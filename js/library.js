/* Animated Articles / Projects folders, backed by the editable portfolio store. */
async function renderDocumentLibrary(entries = []) {
  const root = document.getElementById('document-library');
  if (!root) return;
  root.querySelector('#article-carousel')?.cleanup?.();
  root.libraryController?.abort();
  const controller = new AbortController();
  root.libraryController = controller;
  const { signal } = controller;
  try {
    const { mergeProjectDocuments, mergeBlogArticles, splitLibrary, safeLibraryUrl } = await import('./library-model.mjs');
    let projectDocuments = [], blogArticles = [];
    try {
      const results = await Promise.allSettled(['data/project-articles.json', 'data/blog-articles.json'].map(async url => { const response = await fetch(url, { signal }); return response.ok ? response.json() : []; }));
      projectDocuments = results[0].status === 'fulfilled' ? results[0].value : [];
      blogArticles = results[1].status === 'fulfilled' ? results[1].value : [];
    } catch (error) { if (error.name === 'AbortError') return; }
    if (signal.aborted) return;
    const library = splitLibrary(mergeBlogArticles(blogArticles, mergeProjectDocuments(projectDocuments, entries)));
    const folders = document.getElementById('library-folders');
    const browser = document.getElementById('library-browser');
    const hint = document.getElementById('library-hint');
    const announcement = document.getElementById('library-announcement');
    const viewer = document.getElementById('library-viewer');
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const link = value => escape(safeLibraryUrl(value));
    const labels = { projects: 'Projects', articles: 'Articles' };
    const icon = name => `<i class="fa-solid fa-${name}" aria-hidden="true"></i>`;
    let activeFolder = 'projects', activeTopic = 'All', viewerTrigger, previousOverflow;

    const previews = kind => [0, 1, 2].map((_, index) => {
      const item = library[kind][index];
      const image = item && safeLibraryUrl(item.thumbnail || item.images?.[0]?.src);
      return `<span class="folder-sheet folder-sheet--${index + 1}">${image
        ? `<img src="${escape(image)}" alt="" loading="lazy"><span class="folder-sheet-caption">${escape(item.title.split(' — ')[0])}</span>`
        : `<span class="folder-sheet-heading">${icon(index === 1 ? 'file-pdf' : 'file-lines')}</span><span class="folder-sheet-line"></span><span class="folder-sheet-line"></span><span class="folder-sheet-line folder-sheet-line--short"></span><span class="folder-sheet-line"></span>`}</span>`;
    }).join('');
    folders.innerHTML = ['projects', 'articles'].map((kind, index) => `
      <button type="button" class="glass-folder glass-folder--${kind}" data-open-folder="${kind}" aria-controls="library-browser" aria-label="Open ${labels[kind]} folder, ${library[kind].length} ${kind}">
        <span class="folder-topline"><span>0${index + 1} / ${kind === 'projects' ? 'Made with purpose' : 'Collected with curiosity'}</span><span class="folder-count">${String(library[kind].length).padStart(2, '0')} ${kind === 'projects' ? 'projects' : 'articles'}</span></span>
        <span class="folder-scene" aria-hidden="true"><span class="folder-aura"></span><span class="folder-back"><span class="folder-tab"></span></span>${previews(kind)}
          <span class="folder-front"><span class="folder-front-top">${icon(kind === 'projects' ? 'layer-group' : 'file-lines')}<span>${kind === 'projects' ? 'SELECTED WORK' : 'READING ROOM'}</span></span><span class="folder-front-name">${labels[kind]}<span>↗</span></span><span class="folder-front-detail">${kind === 'projects' ? 'Ideas turned into experiences' : 'Notes, knowledge & perspectives'}</span></span>
        </span>
        <span class="folder-bottom"><span><strong>${kind === 'projects' ? 'Explore my work' : 'Explore my articles'}</strong><span class="folder-description">${kind === 'projects' ? 'UI/UX · Dashboards · SaaS · Experiments' : 'Research · Ideas · PDFs · Reading notes'}</span></span><span class="folder-open-arrow" aria-hidden="true">↗</span></span>
      </button>`).join('');
    folders.hidden = hint.hidden = false;
    browser.hidden = true;

    const imagesOf = item => (Array.isArray(item.images) ? item.images : []).map(image => typeof image === 'string' ? { src: image, alt: item.title } : image).filter(image => image && safeLibraryUrl(image.src));
    const documentsOf = item => {
      const docs = Array.isArray(item.documents) ? [...item.documents] : [];
      if (item.pdf && !docs.some(doc => (typeof doc === 'string' ? doc : doc?.url) === item.pdf)) docs.unshift({ url: item.pdf, title: item.collection === 'projects' ? 'Project PDF' : 'Read PDF' });
      return docs.map(doc => typeof doc === 'string' ? { url: doc, title: 'Read PDF' } : doc).filter(doc => doc && safeLibraryUrl(doc.url));
    };
    function renderContents(focusHeading = false) {
      browser.querySelector('#article-carousel')?.cleanup?.();
      const all = library[activeFolder];
      const topics = ['All', ...new Set(all.map(item => item.category || 'General'))];
      const visible = all.map((item, index) => ({ item, index })).filter(({ item }) => activeTopic === 'All' || (item.category || 'General') === activeTopic);
      browser.dataset.collection = activeFolder;
      browser.innerHTML = `<div class="library-browser-top"><button type="button" class="library-back" data-back-folders>← Back to folders</button><span class="library-path">Library <span>/</span> ${labels[activeFolder]}</span></div>
        <div class="library-browser-heading"><div><span class="library-eyebrow">${activeFolder === 'projects' ? 'From concept to creation' : 'A space for ideas'}</span><h3 tabindex="-1" id="library-open-title">${labels[activeFolder]}<span>.</span></h3></div><span class="library-total">${all.length} ${all.length === 1 ? 'item' : 'items'}</span></div>
        ${all.length ? `<div class="library-filters" aria-label="Filter ${labels[activeFolder]} by topic">${topics.map(topic => `<button type="button" data-topic="${escape(topic)}" aria-pressed="${topic === activeTopic}">${escape(topic === 'All' ? 'All topics' : topic)}</button>`).join('')}</div>${`<div class="article-carousel" id="article-carousel" role="region" aria-label="${labels[activeFolder]} carousel" aria-roledescription="carousel"><div class="article-carousel-controls"><button type="button" class="article-carousel-arrow" id="article-previous" aria-label="Previous ${activeFolder === 'projects' ? 'project' : 'article'}">←</button><span class="article-carousel-position" id="article-position"></span><button type="button" class="article-carousel-arrow" id="article-next" aria-label="Next ${activeFolder === 'projects' ? 'project' : 'article'}">→</button></div><div class="article-columns" id="article-columns"></div><p class="article-sr-only" id="article-announcement" role="status" aria-live="polite"></p></div>`}`
          : `<div class="library-empty"><span class="library-empty-icon" aria-hidden="true">${icon('file-lines')}</span><h4>A little space for new ideas.</h4><p>Articles, reading notes, and PDFs on different topics will appear here.</p><button type="button" class="library-primary-link" data-open-folder="projects">Explore projects <span aria-hidden="true">↗</span></button></div>`}`;
      if (all.length) {
        renderArticleColumns(visible.map(({ item, index }) => ({ ...item, href: safeLibraryUrl(item.href), serial: index + 1, libraryIndex: index, previewable: Boolean(item.body || documentsOf(item).length || imagesOf(item).length || safeLibraryUrl(item.thumbnail)) })), signal, activeFolder);
      }
      announcement.textContent = `${labels[activeFolder]}: ${visible.length} ${visible.length === 1 ? 'item' : 'items'}${activeTopic === 'All' ? '' : ` in ${activeTopic}`}.`;
      if (focusHeading) {
        browser.querySelector('h3').focus({ preventScroll: true });
        browser.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      }
    }
    function openFolder(kind) {
      if (!(kind in library)) return;
      activeFolder = kind; activeTopic = 'All';
      folders.hidden = hint.hidden = true; browser.hidden = false;
      renderContents(true);
    }
    function showPreview(item, imageIndex, trigger) {
      const body = document.getElementById('library-viewer-content');
      document.getElementById('library-viewer-title').textContent = item.title;
      body.replaceChildren();
      if (imageIndex !== null) {
        const images = imagesOf(item);
        const source = imageIndex === -1 ? { src: safeLibraryUrl(item.thumbnail) || images[0]?.src, alt: images[0]?.alt || item.title } : images[imageIndex];
        if (!source || !safeLibraryUrl(source.src)) return;
        const image = document.createElement('img');
        image.src = safeLibraryUrl(source.src); image.alt = source.alt || item.title;
        body.append(image);
      } else {
        const article = document.createElement('div'); article.className = 'library-reading-copy';
        for (const text of String(item.body || '').split(/\n\s*\n/).filter(Boolean)) {
          const paragraph = document.createElement('p'); paragraph.textContent = text; article.append(paragraph);
        }
        const images = imagesOf(item);
        if (safeLibraryUrl(item.thumbnail) && !images.some(image => image.src === item.thumbnail)) images.unshift({ src: item.thumbnail, alt: item.title });
        for (const source of images) {
          const image = document.createElement('img');
          image.src = safeLibraryUrl(source.src); image.alt = source.alt || item.title;
          article.append(image);
        }
        for (const doc of documentsOf(item)) {
          const anchor = document.createElement('a');
          anchor.className = 'library-primary-link'; anchor.href = safeLibraryUrl(doc.url);
          anchor.target = '_blank'; anchor.rel = 'noopener';
          anchor.textContent = (doc.title || 'Read PDF') + ' ↗';
          anchor.setAttribute('aria-label', (doc.title || 'Read PDF') + ' (opens in a new tab)');
          article.append(anchor);
        }
        body.append(article);
      }
      viewerTrigger = trigger; previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden'; viewer.showModal();
    }
    root.addEventListener('click', event => {
      const button = event.target.closest('button'); if (!button) return;
      if (button.dataset.openFolder) return openFolder(button.dataset.openFolder);
      if (button.hasAttribute('data-back-folders')) {
        browser.querySelector('#article-carousel')?.cleanup?.();
        browser.hidden = true; folders.hidden = hint.hidden = false;
        folders.querySelector(`[data-open-folder="${activeFolder}"]`).focus({ preventScroll: true });
        folders.scrollIntoView({ behavior: 'instant', block: 'center' });
        announcement.textContent = 'Choose Articles or Projects.';
      } else if (button.dataset.topic) {
        activeTopic = button.dataset.topic; renderContents();
        [...browser.querySelectorAll('[data-topic]')].find(control => control.dataset.topic === activeTopic)?.focus({ preventScroll: true });
      } else if (button.hasAttribute('data-preview-item')) {
        showPreview(library[activeFolder][Number(button.dataset.previewItem)], Number(button.dataset.previewImage), button);
      } else if (button.hasAttribute('data-read-item')) {
        showPreview(library[activeFolder][Number(button.dataset.readItem)], null, button);
      }
    }, { signal });
    document.getElementById('library-viewer-close').addEventListener('click', () => viewer.close(), { signal });
    viewer.addEventListener('click', event => {
      if (event.target === viewer) {
        const bounds = viewer.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
      }
    }, { signal });
    const requestedFolder = new URLSearchParams(location.search).get('folder');
    if (requestedFolder === 'articles' || requestedFolder === 'projects') openFolder(requestedFolder);
    viewer.addEventListener('close', () => { document.body.style.overflow = previousOverflow || ''; viewerTrigger?.focus({ preventScroll: true }); }, { signal });
  } catch (error) {
    if (signal.aborted) return;
    document.getElementById('library-hint').textContent = 'The library could not load. Please refresh to try again.';
    console.error('Library could not load', error);
  }
}
