import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderMarkdown, escapeHtml as escape } from './markdown.mjs';
import { mergeBlogArticles } from '../js/library-model.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const blogs = JSON.parse(readFileSync(path.join(root, 'data/blog-articles.json'), 'utf8'));
for (const [index, blog] of blogs.entries()) {
  const raw = readFileSync(path.join(root, 'content/blog', blog.source), 'utf8');
  const start = raw.indexOf('## Introduction');
  if (start < 0) throw new Error(`Missing introduction in ${blog.source}`);
  const markdown = raw.slice(start);
  const { html, headings } = renderMarkdown(markdown);
  const minutes = Math.max(1, Math.ceil(markdown.replace(/https?:\/\/\S+/g, '').split(/\s+/).length / 220));
  const previous = blogs[(index - 1 + blogs.length) % blogs.length];
  const next = blogs[(index + 1) % blogs.length];
  const destination = path.join(root, 'articles', blog.id);
  mkdirSync(destination, { recursive: true });
  writeFileSync(path.join(destination, 'index.html'), `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escape(blog.title)} | Kazi Jawad</title>
  <meta name="description" content="${escape(blog.excerpt)}">
  <meta name="theme-color" content="#f5f6f8">
  <meta property="og:title" content="${escape(blog.title)}"><meta property="og:description" content="${escape(blog.excerpt)}"><meta property="og:type" content="article">
  <link rel="stylesheet" href="../../css/article-reader.css"><link rel="stylesheet" href="../../css/blog-reader.css">
</head><body class="blog-reader">
  <a class="skip-link" href="#article">Skip to article</a>
  <header class="reader-nav"><a class="reader-brand" href="../../"><span class="brand-mark" aria-hidden="true">KJ</span>Kazi Jawad</a><a class="reader-back" href="../../?folder=articles#articles">← All articles</a></header>
  <main class="reader-surface"><article class="reader-article" id="article">
    <header><p class="reader-kicker">Articles / ${String(index + 1).padStart(2, '0')} · ${escape(blog.category)}</p>
      <h1>${escape(blog.title)}</h1><p class="reader-deck">${escape(blog.tagline)}</p>
      <div class="reader-meta"><div class="reader-author"><img src="../../assets/img/author.jpg" alt="" width="38" height="38"><div><span>Written by</span><strong>MD Kazi Jawadul Islam</strong></div></div><div class="reader-tags"><time class="reader-tag" datetime="2026-10-24">24 October 2026</time><span class="reader-tag">${minutes} min read</span></div></div>
    </header>
    <figure class="reader-hero"><img src="../../assets/img/blog/${escape(blog.hero)}" alt="${escape(blog.heroAlt)}" width="1200" height="640" fetchpriority="high"></figure>
    <div class="reader-copy blog-copy">
      <aside class="blog-takeaways" aria-label="Key takeaways"><p class="blog-label">The key ideas</p><ul>${blog.takeaways.map(text => `<li>${escape(text)}</li>`).join('')}</ul></aside>
      <details class="blog-contents" open><summary>In this article</summary><nav aria-label="Article contents"><ol>${headings.map(heading => `<li><a href="#${heading.id}">${escape(heading.title.replace(/^\d+\.\s*/, ''))}</a></li>`).join('')}</ol></nav></details>
      ${html}
      <nav class="reader-pagination" aria-label="More articles"><a href="../${previous.id}/"><span>← Previous article</span><strong>${escape(previous.shortTitle)}</strong></a><a href="../${next.id}/"><span>Next article →</span><strong>${escape(next.shortTitle)}</strong></a></nav>
      <p class="blog-return"><a href="../../?folder=articles#articles">Explore all articles</a><a href="#article">Back to top ↑</a></p>
    </div>
  </article><footer class="reader-footer">Kazi Jawad · Ideas, learning &amp; perspectives</footer></main>
</body></html>`);
}
for (const relative of ['data/portfolio-data.json', 'content/data.json']) {
  const filename = path.join(root, relative);
  const data = JSON.parse(readFileSync(filename, 'utf8'));
  data.articles = mergeBlogArticles(blogs, data.articles || []);
  writeFileSync(filename, JSON.stringify(data, null, 2) + '\n');
}
console.log(`Prepared ${blogs.length} detailed blog posts.`);
