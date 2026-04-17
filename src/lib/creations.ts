export interface Creation {
  slug: string;
  title: string;
  date: Date;
  images: string[];
  description: string;
}

export async function getCreations(): Promise<Creation[]> {
  const files = import.meta.glob('../data/creations/*.md', { eager: true, query: '?raw', import: 'default' });

  const creations: Creation[] = [];

  for (const [path, content] of Object.entries(files)) {
    const slug = path.split('/').pop()?.replace('.md', '') ?? '';
    const rawContent = content as string;

    const frontmatterMatch = rawContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) continue;

    const frontmatter = frontmatterMatch[1];
    const description = frontmatterMatch[2].trim();

    const data: Record<string, string> = {};
    for (const line of frontmatter.split('\n')) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value = line.slice(colonIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        data[key] = value;
      }
    }

    const images = (data.images ?? '')
      .split(',')
      .map((s) => s.trim().replace(/^\/public/, ''))
      .filter(Boolean);

    creations.push({
      slug,
      title: data.title ?? '',
      date: new Date(data.date + 'T12:00:00'),
      images,
      description,
    });
  }

  // Most recent first
  return creations.sort((a, b) => b.date.getTime() - a.date.getTime());
}
