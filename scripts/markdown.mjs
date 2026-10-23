// A deliberately small, HTML-safe renderer for the blog's authored Markdown.
// Supports headings, paragraphs, lists, tables, quotations and fenced examples.
import { safeLibraryUrl } from '../js/library-model.mjs';
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function inline(text) {
  const tokens = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^\s)]+)\)|(https?:\/\/[^\s<>]+)/g;
  let result = '', previous = 0;
  for (const match of text.matchAll(tokens)) {
    result += escapeHtml(text.slice(previous, match.index));
    if (match[1]) result += `<code>${escapeHtml(match[1])}</code>`;
    else if (match[2]) result += `<strong>${inline(match[2])}</strong>`;
    else if (match[3]) result += `<em>${inline(match[3])}</em>`;
    else {
      const rawUrl = match[5] || match[6].replace(/[.,;]+$/, '');
      const url = safeLibraryUrl(rawUrl);
      const label = match[4] ? inline(match[4]) : escapeHtml(rawUrl);
      result += url ? `<a href="${escapeHtml(url)}"${url.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>` : label;
      if (match[6]) result += escapeHtml(match[6].slice(rawUrl.length));
    }
    previous = match.index + match[0].length;
  }
  return result + escapeHtml(text.slice(previous));
}

export function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const headings = [], html = [], ids = new Map();
  const cells = line => line.trim().replace(/^\||\|$/g, '').split('|').map(value => value.trim());
  const isTableDivider = line => /^\|?\s*:?-{3,}/.test(line || '') && cells(line).every(cell => /^:?-{3,}:?$/.test(cell));
  const blockStart = line => /^(#{1,6} |```|> ?|[-*] |\d+\. |---\s*$)/.test(line);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    if (line.startsWith('```')) {
      const code = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++]);
      i++;
      html.push(`<pre tabindex="0"><code>${escapeHtml(code.join('\n'))}</code></pre>`);
    } else if (/^#{1,6} /.test(line)) {
      const [, hashes, title] = line.match(/^(#{1,6}) (.*)$/);
      const level = Math.max(2, hashes.length);
      const base = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') || 'section';
      const count = (ids.get(base) || 0) + 1; ids.set(base, count);
      const id = base + (count > 1 ? `-${count}` : '');
      if (level === 2) headings.push({ id, title });
      html.push(`<h${level} id="${id}">${inline(title)}</h${level}>`); i++;
    } else if (/^---\s*$/.test(line)) {
      html.push('<hr>'); i++;
    } else if (line.includes('|') && isTableDivider(lines[i + 1])) {
      const header = cells(line); i += 2; const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]));
      html.push(`<div class="blog-table" role="region" aria-label="Comparison table" tabindex="0"><table><thead><tr>${header.map(cell => `<th scope="col">${inline(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
    } else if (line.startsWith('>')) {
      const quote = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) quote.push(lines[i++].trim().replace(/^> ?/, ''));
      html.push(`<blockquote><p>${inline(quote.join('\n')).replace(/\n/g, '<br>')}</p></blockquote>`);
    } else if (/^([-*] |\d+\. )/.test(line)) {
      const ordered = /^\d/.test(line), items = [], pattern = ordered ? /^\d+\. / : /^[-*] /;
      while (i < lines.length && pattern.test(lines[i].trim())) {
        const item = lines[i++].trim().replace(pattern, '');
        items.push(`<li>${item.startsWith('[ ] ') ? '<span class="blog-check" aria-hidden="true">□</span> ' + inline(item.slice(4)) : inline(item)}</li>`);
      }
      const tag = ordered ? 'ol' : 'ul'; html.push(`<${tag}>${items.join('')}</${tag}>`);
    } else {
      const paragraph = [line]; i++;
      while (i < lines.length && lines[i].trim() && !blockStart(lines[i].trim()) && !isTableDivider(lines[i + 1])) paragraph.push(lines[i++].trim());
      html.push(`<p>${inline(paragraph.join(' '))}</p>`);
    }
  }
  return { html: html.join('\n'), headings };
}
