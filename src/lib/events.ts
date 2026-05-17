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
  const urlPattern = /\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g;
  const nodes: DescriptionNode[] = [];
  let cursor = 0;
  for (const match of paragraph.matchAll(urlPattern)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      nodes.push({ type: 'text', value: paragraph.slice(cursor, start) });
    }
    const href = match[0];
    nodes.push({ type: 'link', href, label: href.replace(/^https?:\/\//, '') });
    cursor = start + href.length;
  }
  if (cursor < paragraph.length) {
    nodes.push({ type: 'text', value: paragraph.slice(cursor) });
  }
  return nodes;
}

export function formatEventDateWithYear(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
