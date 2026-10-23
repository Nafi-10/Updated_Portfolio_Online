// The public folders share the existing editable articles store.
export function mergeBlogArticles(blogs, entries = []) {
  const defaults = blogs.map(blog => ({ id: blog.id, collection: 'articles', title: blog.title, tagline: blog.tagline, keywords: blog.keywords, excerpt: blog.excerpt, category: blog.category, href: `articles/${blog.id}/`, thumbnail: `assets/img/blog/${blog.hero}`, images: [{ src: `assets/img/blog/${blog.hero}`, alt: blog.heroAlt }] }));
  const byId = new Map(defaults.map(entry => [entry.id, entry]));
  const result = entries.map(entry => byId.has(entry.id) ? { ...byId.get(entry.id), ...entry, collection: entry.collection || 'articles' } : { ...entry });
  for (const entry of defaults) if (!result.some(item => item.id === entry.id)) result.push(entry);
  return result;
}

export function mergeProjectDocuments(projects, entries = []) {
  const defaults = projects.map(project => ({
    id: project.id,
    collection: 'projects',
    title: project.title,
    tagline: project.tagline,
    keywords: project.keywords,
    excerpt: project.excerpt,
    category: project.category,
    href: `articles/${project.id}/`,
    thumbnail: `assets/img/projects/${project.hero}`,
    ...(project.pdf ? { pdf: `articles/documents/${project.pdf}` } : {}),
    images: [{ src: `assets/img/projects/${project.hero}`, alt: project.heroAlt }, ...(project.images || [])]
  }));
  const byId = new Map(defaults.map(entry => [entry.id, entry]));
  const result = entries.map(entry => byId.has(entry.id)
    ? { ...byId.get(entry.id), ...entry, collection: entry.collection || 'projects' }
    : { ...entry });
  for (const entry of defaults) {
    if (!result.some(item => item.id === entry.id)) result.push(entry);
  }
  return result;
}

export function splitLibrary(entries = []) {
  return {
    articles: entries.filter(entry => entry.collection !== 'projects'),
    projects: entries.filter(entry => entry.collection === 'projects')
  };
}

export function safeLibraryUrl(value) {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) return '';
  const url = value.trim();
  if (!url || url.startsWith('//') || url.includes('\\')) return '';
  if (/^https?:\/\/[^/\s]+/i.test(url)) return url;
  if (/^[a-z][a-z\d+.-]*:/i.test(url)) return '';
  return url;
}
