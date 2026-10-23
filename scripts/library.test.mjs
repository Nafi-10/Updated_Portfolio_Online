import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeProjectDocuments, splitLibrary, safeLibraryUrl } from '../js/library-model.mjs';

const projects = JSON.parse(readFileSync(new URL('../data/project-articles.json', import.meta.url)));

test('building project documents preserves general PDFs and custom projects', () => {
  const article = { id: 'research-notes', collection: 'articles', title: 'Research notes', pdf: 'articles/documents/notes.pdf' };
  const dashboard = { id: 'dashboard', collection: 'projects', title: 'Dashboard', images: [{ src: 'assets/dashboard.png' }] };
  const result = mergeProjectDocuments(projects, [article, dashboard]);
  assert.deepEqual(result.find(item => item.id === article.id), article);
  assert.deepEqual(result.find(item => item.id === dashboard.id), dashboard);
  assert.equal(splitLibrary(result).projects.length, projects.length + 1);
  assert.equal(splitLibrary(result).articles.length, 1);
  assert.deepEqual(mergeProjectDocuments(projects, result), result, 'rebuilding must not duplicate or discard content');
});

test('legacy project cards retain their reader and gain their source PDF and image', () => {
  const result = mergeProjectDocuments(projects, [{ id: 'nexora', title: 'NEXORA', href: 'articles/nexora/' }]);
  const nexora = result.find(item => item.id === 'nexora');
  assert.equal(nexora.collection, 'projects');
  assert.equal(nexora.href, 'articles/nexora/');
  assert.equal(nexora.pdf, 'articles/documents/NEXORA_Project_Documentation.pdf');
  assert.equal(nexora.images[0].src, 'assets/img/projects/nexora.png');
});

test('a new general-topic PDF belongs to Articles by default', () => {
  const item = { id: 'reading', title: 'Reading', pdf: 'articles/documents/reading.pdf' };
  assert.deepEqual(splitLibrary([item]), { articles: [item], projects: [] });
});

test('web case studies without source PDFs keep their screenshots and do not invent PDF URLs', () => {
  const project = { id: 'web-case-study', title: 'Web case study', hero: 'cover.jpg', heroAlt: 'Project homepage', images: [{ src: 'assets/img/projects/detail.jpg', alt: 'Project detail' }] };
  const [result] = mergeProjectDocuments([project]);
  assert.equal(result.pdf, undefined);
  assert.equal(result.href, 'articles/web-case-study/');
  assert.deepEqual(result.images, [
    { src: 'assets/img/projects/cover.jpg', alt: 'Project homepage' },
    { src: 'assets/img/projects/detail.jpg', alt: 'Project detail' }
  ]);
});

test('document and image links reject executable and malformed URLs', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,test', '//example.com/file.pdf', 'file:///D:/private.pdf', 'java\nscript:alert(1)']) {
    assert.equal(safeLibraryUrl(url), '');
  }
  assert.equal(safeLibraryUrl('articles/documents/notes.pdf'), 'articles/documents/notes.pdf');
  assert.equal(safeLibraryUrl('https://example.com/file.pdf'), 'https://example.com/file.pdf');
});
