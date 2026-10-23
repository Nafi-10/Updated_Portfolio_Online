import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from './markdown.mjs';
import { mergeBlogArticles, splitLibrary } from '../js/library-model.mjs';

test('Markdown preserves tables, examples, code, and linked section navigation', () => {
  const { html, headings } = renderMarkdown('## A useful guide\n\n**Clear** instructions.\n\n| Task | Result |\n|---|---|\n| Draft | Review |\n\n> An example prompt.\n\n```\n<material>Source</material>\n```\n\n- [ ] Check facts\n\n## A useful guide');
  assert.match(html, /<strong>Clear<\/strong>/);
  assert.match(html, /<table>/);
  assert.match(html, /<th scope="col">Task<\/th>/);
  assert.match(html, /<blockquote>/);
  assert.match(html, /&lt;material&gt;Source&lt;\/material&gt;/);
  assert.match(html, /Check facts/);
  assert.deepEqual(headings.map(h => h.id), ['a-useful-guide', 'a-useful-guide-2']);
});

test('Markdown treats raw HTML and unsafe links as text', () => {
  const { html } = renderMarkdown('<script>alert(1)</script>\n\n[bad](javascript:alert) [safe](https://example.com/page)\n\n`<img src=x onerror=alert(1)>`');
  assert.doesNotMatch(html, /<script|<img|href="javascript:/);
  assert.match(html, /href="https:\/\/example.com\/page"/);
});

test('blog imports preserve projects and custom articles without duplication', () => {
  const blogs = [{ id: 'future-of-ai', title: 'Future of AI', hero: 'future.svg' }];
  const existing = [{ id: 'nexora', collection: 'projects' }, { id: 'notes', title: 'My notes' }];
  const merged = mergeBlogArticles(blogs, existing);
  assert.equal(splitLibrary(merged).projects.length, 1);
  assert.equal(splitLibrary(merged).articles.length, 2);
  assert.equal(merged.find(x => x.id === 'future-of-ai').href, 'articles/future-of-ai/');
  assert.deepEqual(mergeBlogArticles(blogs, merged), merged);
});
