export interface Tool {
  slug: string;
  title: string;
  brand: string;
  category: string;
  image?: string;
  cost?: string;
  description: string;
}

export async function getTools(): Promise<Tool[]> {
  const toolFiles = import.meta.glob('../data/tools/*.md', { eager: true, query: '?raw', import: 'default' });

  const tools: Tool[] = [];

  for (const [path, content] of Object.entries(toolFiles)) {
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

    tools.push({
      slug,
      title: data.title ?? '',
      brand: data.brand ?? '',
      category: data.category ?? '',
      image: data.image,
      cost: data.cost,
      description,
    });
  }

  return tools.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.title.localeCompare(b.title);
  });
}
