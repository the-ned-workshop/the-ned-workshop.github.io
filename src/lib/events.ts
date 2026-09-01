export interface EventImage {
  src: string;
  alt: string;
}

export interface Event {
  slug: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  locationUrl?: string;
  // Venue address for the Event structured data. Street and postal code are
  // optional on purpose: leave them out for any location we don't want to
  // publish, and the address falls back to the town it's in.
  locationStreet?: string;
  locationLocality: string;
  locationRegion: string;
  locationPostalCode?: string;
  cost: string;
  costNote?: string;
  image?: string;
  images: EventImage[];
  description: string;
  rsvpWidgetId?: string;
}

export async function getEvents(): Promise<Event[]> {
  const eventFiles = import.meta.glob('../data/events/*.md', { eager: true, query: '?raw', import: 'default' });

  const events: Event[] = [];

  for (const [path, content] of Object.entries(eventFiles)) {
    const slug = path.split('/').pop()?.replace('.md', '') ?? '';
    const rawContent = content as string;

    // Parse frontmatter
    const frontmatterMatch = rawContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) continue;

    const frontmatter = frontmatterMatch[1];
    const description = frontmatterMatch[2].trim();

    // Parse YAML frontmatter manually
    const data: Record<string, string> = {};
    for (const line of frontmatter.split('\n')) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value = line.slice(colonIndex + 1).trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        data[key] = value;
      }
    }

    const title = data.title ?? '';
    const images: EventImage[] = (data.images ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [rawSrc, ...altParts] = entry.split('|');
        const src = rawSrc.trim().replace(/^\/public/, '');
        const alt = altParts.join('|').trim() || title;
        return { src, alt };
      });

    events.push({
      slug,
      title,
      date: new Date(data.date + 'T12:00:00'),
      startTime: data.startTime ?? '',
      endTime: data.endTime ?? '',
      location: data.location ?? '',
      locationUrl: data.locationUrl,
      locationStreet: data.locationStreet,
      locationLocality: data.locationLocality || 'Nederland',
      locationRegion: data.locationRegion || 'CO',
      locationPostalCode: data.locationPostalCode,
      cost: data.cost ?? '',
      costNote: data.costNote,
      image: data.image,
      images,
      description,
      rsvpWidgetId: data.rsvpWidgetId,
    });
  }

  // Sort by date, upcoming first
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function formatEventDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export type DescriptionNode =
  | { type: 'text'; value: string }
  | { type: 'link'; href: string; label: string };

export function parseDescriptionParagraph(paragraph: string): DescriptionNode[] {
  // Markdown-style [label](url) first, then bare URLs.
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g;
  const nodes: DescriptionNode[] = [];
  let cursor = 0;
  for (const match of paragraph.matchAll(linkPattern)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      nodes.push({ type: 'text', value: paragraph.slice(cursor, start) });
    }
    if (match[1]) {
      nodes.push({ type: 'link', href: match[2], label: match[1] });
    } else {
      const href = match[0];
      nodes.push({ type: 'link', href, label: href.replace(/^https?:\/\//, '') });
    }
    cursor = start + match[0].length;
  }
  if (cursor < paragraph.length) {
    nodes.push({ type: 'text', value: paragraph.slice(cursor) });
  }
  return nodes;
}

// Plain-text form of a description, with link markup reduced to its label.
// Used where a real anchor can't go — inside the clickable event cards on the
// listing pages, and in meta/JSON-LD description text.
export function stripDescriptionLinks(text: string): string {
  return text
    .split('\n\n')
    .map((paragraph) =>
      parseDescriptionParagraph(paragraph)
        .map((node) => (node.type === 'text' ? node.value : node.label))
        .join('')
    )
    .join('\n\n');
}

export function formatEventDateParts(date: Date): { month: string; day: number; weekday: string } {
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: date.getDate(),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
  };
}

export function formatEventDateWithYear(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
