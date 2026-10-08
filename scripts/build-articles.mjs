import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const projects = JSON.parse(readFileSync(path.join(root, 'data/project-articles.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const paragraphs = values => values.map(value => `<p>${escape(value)}</p>`).join('\n');
const author = 'MD Kazi Jawadul Islam';

for (const [index, project] of projects.entries()) {
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const words = [...project.intro, ...project.sections.flatMap(section => [section.title, ...section.paragraphs])].join(' ').split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(project.title)} | Kazi Jawad</title>
  <meta name="description" content="${escape(project.tagline)}">
  <meta name="theme-color" content="#f5f6f8">
  <meta property="og:title" content="${escape(project.title)}">
  <meta property="og:description" content="${escape(project.tagline)}">
  <meta property="og:type" content="article">
  <link rel="stylesheet" href="../../css/article-reader.css">
</head>
<body>
  <a class="skip-link" href="#article">Skip to article</a>
  <header class="reader-nav">
    <a class="reader-brand" href="../../"><span class="brand-mark" aria-hidden="true">KJ</span>Kazi Jawad</a>
    <a class="reader-back" href="../../#articles">← All projects</a>
  </header>
  <main class="reader-surface">
    <article class="reader-article" id="article">
      <header>
        <p class="reader-kicker">Articles &amp; Projects / ${String(index + 1).padStart(2, '0')}</p>
        <h1>${escape(project.title)}</h1>
        <p class="reader-deck">${escape(project.tagline)}</p>
        <div class="reader-meta">
          <div class="reader-author">
            <img src="../../assets/img/author.jpg" alt="" width="38" height="38">
            <div><span>Written by</span><strong>${author}</strong></div>
          </div>
          <div class="reader-tags"><span class="reader-tag">${escape(project.category)}</span><span class="reader-tag">${minutes} min read</span></div>
        </div>
      </header>
      <figure class="reader-hero${project.id === 'security-system' ? ' reader-hero--portrait' : ''}">
        <img src="../../assets/img/projects/${escape(project.hero)}" alt="${escape(project.heroAlt)}" fetchpriority="high">
        <figcaption>${escape(project.heroCaption)}</figcaption>
      </figure>
      <div class="reader-copy">
        ${paragraphs(project.intro)}
        ${project.sections.map((section, sectionIndex) => `<section><h2>${sectionIndex + 1}. ${escape(section.title)}</h2>${paragraphs(section.paragraphs)}</section>`).join('\n')}
        <aside class="reader-source" aria-label="Original documentation">
          <p>Explore the complete diagrams and technical notes in the original project documentation.</p>
          <a href="../documents/${escape(project.pdf)}">Read the original PDF <span>↗ ${project.pages} pages</span></a>
        </aside>
        <nav class="reader-pagination" aria-label="More project articles">
          <a href="../${prev.id}/"><span>← Previous project</span><strong>${escape(prev.shortTitle)}</strong></a>
          <a href="../${next.id}/"><span>Next project →</span><strong>${escape(next.shortTitle)}</strong></a>
        </nav>
      </div>
    </article>
    <footer class="reader-footer">Kazi Jawad · Ideas, experiments &amp; projects</footer>
  </main>
</body>
</html>
`;
  const destination = path.join(root, 'articles', project.id);
  mkdirSync(destination, { recursive: true });
  writeFileSync(path.join(destination, 'index.html'), html);
}

// Keep both existing portfolio data stores aligned with the document library.
const articleCards = projects.map(({ id, title, tagline, keywords, excerpt, category }) => ({ id, title, tagline, keywords, excerpt, category, href: `articles/${id}/` }));
for (const relative of ['data/portfolio-data.json', 'content/data.json']) {
  const destination = path.join(root, relative);
  const data = JSON.parse(readFileSync(destination, 'utf8'));
  data.articles = articleCards;
  writeFileSync(destination, JSON.stringify(data, null, 2) + '\n');
}
console.log(`Prepared ${projects.length} project cards and article pages.`);
