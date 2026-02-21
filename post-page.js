class BlogPostViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._post = null;
    this._render();
  }

  static get observedAttributes() {
    return ['post-data', 'loading'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!newValue || oldValue === newValue) return;

    if (name === 'post-data') {
      try {
        this._post = JSON.parse(newValue);
        this._renderPost();
      } catch (e) {
        console.error('BlogPostViewer: post-data parse error', e);
      }
    }

    if (name === 'loading') {
      if (newValue === 'true') this._renderSkeleton();
    }
  }

  connectedCallback() {
    this._renderSkeleton();
  }

  _dispatchEvent(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  // ─── Main render shell ───────────────────────────────
  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :host {
          display: block;
          width: 100%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0f0f0f;
          color: #e0e0e0;
        }

        /* ─── LAYOUT ─────────────────────────────────── */
        .page-wrapper {
          max-width: 1280px;
          margin: 0 auto;
          padding: 48px 24px;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 48px;
          align-items: start;
        }

        .main-col { min-width: 0; }

        /* ─── BREADCRUMB ─────────────────────────────── */
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #555;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .breadcrumb a {
          color: #555;
          text-decoration: none;
          transition: color 0.2s;
          cursor: pointer;
        }

        .breadcrumb a:hover { color: #64FFDA; }
        .breadcrumb .sep { color: #333; }
        .breadcrumb .current { color: #888; }

        /* ─── HEADER ─────────────────────────────────── */
        .post-header { margin-bottom: 40px; }

        .post-meta-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .category-badge {
          display: inline-block;
          padding: 5px 14px;
          border-radius: 999px;
          background: rgba(100,255,218,0.1);
          color: #64FFDA;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          cursor: pointer;
          border: 1px solid rgba(100,255,218,0.2);
          transition: all 0.2s;
        }

        .category-badge:hover {
          background: rgba(100,255,218,0.18);
        }

        .dot { width: 3px; height: 3px; border-radius: 50%; background: #333; }

        .meta-item {
          font-size: 13px;
          color: #555;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .post-title {
          font-size: clamp(28px, 4.5vw, 48px);
          font-weight: 800;
          line-height: 1.2;
          color: #ffffff;
          letter-spacing: -0.02em;
          margin-bottom: 20px;
        }

        .post-excerpt {
          font-size: 18px;
          color: #888;
          line-height: 1.7;
          margin-bottom: 28px;
          font-weight: 300;
        }

        .author-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 0;
          border-top: 1px solid #1e1e1e;
          border-bottom: 1px solid #1e1e1e;
          gap: 16px;
          flex-wrap: wrap;
        }

        .author-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .author-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
          background: #1e1e1e;
          border: 2px solid #2a2a2a;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64FFDA;
          font-size: 16px;
          font-weight: 700;
          flex-shrink: 0;
          overflow: hidden;
        }

        .author-details { display: flex; flex-direction: column; gap: 2px; }
        .author-name { font-size: 15px; font-weight: 600; color: #ccc; }
        .author-date { font-size: 13px; color: #555; }

        .post-stats {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
          color: #555;
        }

        .stat-item { display: flex; align-items: center; gap: 5px; }

        /* ─── FEATURED IMAGE ─────────────────────────── */
        .featured-image-wrap {
          margin: 36px 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }

        .featured-image {
          width: 100%;
          height: auto;
          max-height: 520px;
          object-fit: cover;
          display: block;
        }

        /* ─── ARTICLE CONTENT ────────────────────────── */
        .article-content {
          font-family: 'Merriweather', Georgia, serif;
          font-size: 18px;
          line-height: 1.85;
          color: #d0d0d0;
        }

        .article-content h1,
        .article-content h2,
        .article-content h3,
        .article-content h4,
        .article-content h5,
        .article-content h6 {
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.3;
          margin-top: 48px;
          margin-bottom: 16px;
          letter-spacing: -0.01em;
          scroll-margin-top: 24px;
        }

        .article-content h1 { font-size: clamp(26px, 3.5vw, 36px); margin-top: 64px; }
        .article-content h2 { font-size: clamp(22px, 3vw, 30px); margin-top: 52px; }
        .article-content h3 { font-size: clamp(19px, 2.5vw, 24px); }
        .article-content h4 { font-size: clamp(17px, 2vw, 20px); }
        .article-content h5, .article-content h6 { font-size: 17px; color: #aaa; }

        .article-content p { margin-bottom: 26px; }

        .article-content a {
          color: #64FFDA;
          text-decoration: none;
          border-bottom: 1px solid rgba(100,255,218,0.3);
          transition: border-color 0.2s;
        }

        .article-content a:hover { border-bottom-color: #64FFDA; }

        .article-content strong, .article-content b {
          font-weight: 700;
          color: #ffffff;
        }

        .article-content em, .article-content i { font-style: italic; color: #bbb; }

        .article-content ul, .article-content ol {
          margin: 0 0 26px 0;
          padding-left: 28px;
        }

        .article-content li {
          margin-bottom: 10px;
          padding-left: 4px;
        }

        .article-content ul li { list-style-type: disc; }
        .article-content ol li { list-style-type: decimal; }

        .article-content blockquote {
          margin: 36px 0;
          padding: 24px 32px;
          border-left: 4px solid #64FFDA;
          background: #161616;
          border-radius: 0 12px 12px 0;
          font-style: italic;
          color: #aaa;
        }

        .article-content blockquote p { margin-bottom: 0; color: #aaa; }

        .article-content code {
          background: #1e1e1e;
          padding: 3px 8px;
          border-radius: 5px;
          font-family: 'Monaco', 'Cascadia Code', 'Courier New', monospace;
          font-size: 0.88em;
          color: #64FFDA;
          border: 1px solid #2a2a2a;
        }

        .article-content pre {
          background: #141414;
          border: 1px solid #252525;
          border-radius: 12px;
          padding: 24px;
          overflow-x: auto;
          margin: 32px 0;
          position: relative;
        }

        .article-content pre code {
          background: transparent;
          padding: 0;
          border: none;
          color: #e0e0e0;
          font-size: 14px;
          line-height: 1.7;
        }

        .article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 10px;
          margin: 32px auto;
          display: block;
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }

        .article-content hr {
          border: none;
          border-top: 1px solid #1e1e1e;
          margin: 48px 0;
        }

        .article-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 32px 0;
          border-radius: 10px;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
        }

        .article-content th {
          background: #1a1a1a;
          color: #64FFDA;
          font-weight: 600;
          padding: 12px 16px;
          text-align: left;
          border-bottom: 2px solid #2a2a2a;
        }

        .article-content td {
          padding: 12px 16px;
          border-bottom: 1px solid #1e1e1e;
          color: #ccc;
        }

        .article-content tbody tr:last-child td { border-bottom: none; }
        .article-content tbody tr:nth-child(even) { background: #141414; }
        .article-content tbody tr:hover { background: #1a1a1a; }

        /* ─── TAGS ───────────────────────────────────── */
        .tags-section {
          margin-top: 48px;
          padding-top: 28px;
          border-top: 1px solid #1e1e1e;
        }

        .tags-label {
          font-size: 13px;
          font-weight: 600;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 12px;
          font-family: 'Inter', sans-serif;
        }

        .tags-list { display: flex; gap: 8px; flex-wrap: wrap; }

        .tag {
          padding: 6px 14px;
          border-radius: 999px;
          background: #1a1a1a;
          color: #888;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid #2a2a2a;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
        }

        .tag:hover {
          background: rgba(100,255,218,0.08);
          color: #64FFDA;
          border-color: rgba(100,255,218,0.25);
        }

        /* ─── SHARE ──────────────────────────────────── */
        .share-section {
          margin-top: 36px;
          padding: 24px;
          background: #141414;
          border-radius: 14px;
          border: 1px solid #1e1e1e;
          font-family: 'Inter', sans-serif;
        }

        .share-label {
          font-size: 14px;
          font-weight: 600;
          color: #888;
          margin-bottom: 14px;
        }

        .share-buttons { display: flex; gap: 10px; flex-wrap: wrap; }

        .share-btn {
          padding: 9px 18px;
          border-radius: 9px;
          border: 1.5px solid #2a2a2a;
          background: #1a1a1a;
          color: #aaa;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .share-btn:hover {
          border-color: #64FFDA;
          color: #64FFDA;
          transform: translateY(-2px);
        }

        /* ─── SIDEBAR ────────────────────────────────── */
        .sidebar { display: flex; flex-direction: column; gap: 28px; }

        /* TOC */
        .toc-box {
          background: #141414;
          border: 1px solid #1e1e1e;
          border-radius: 14px;
          padding: 24px;
          position: sticky;
          top: 24px;
        }

        .toc-heading {
          font-size: 13px;
          font-weight: 700;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toc-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 2px;
          max-height: 400px;
          overflow-y: auto;
        }

        .toc-list::-webkit-scrollbar { width: 4px; }
        .toc-list::-webkit-scrollbar-track { background: transparent; }
        .toc-list::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

        .toc-link {
          display: block;
          padding: 7px 10px;
          font-size: 13px;
          color: #666;
          text-decoration: none;
          border-left: 2px solid transparent;
          border-radius: 0 6px 6px 0;
          transition: all 0.2s;
          line-height: 1.4;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
        }

        .toc-link:hover { color: #ccc; border-left-color: #333; background: #1a1a1a; }
        .toc-link.active { color: #64FFDA; border-left-color: #64FFDA; background: rgba(100,255,218,0.05); font-weight: 500; }
        .toc-link.level-2 { padding-left: 20px; }
        .toc-link.level-3 { padding-left: 32px; font-size: 12px; }
        .toc-link.level-4 { padding-left: 44px; font-size: 12px; }

        /* Related posts sidebar */
        .related-box {
          background: #141414;
          border: 1px solid #1e1e1e;
          border-radius: 14px;
          padding: 24px;
        }

        .related-heading {
          font-size: 13px;
          font-weight: 700;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 16px;
        }

        .related-post {
          display: flex;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #1a1a1a;
          cursor: pointer;
          transition: all 0.2s;
        }

        .related-post:last-child { border-bottom: none; }
        .related-post:hover .related-title { color: #64FFDA; }

        .related-thumb {
          width: 64px;
          height: 64px;
          border-radius: 8px;
          object-fit: cover;
          background: #1e1e1e;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          overflow: hidden;
        }

        .related-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }

        .related-title {
          font-size: 14px;
          font-weight: 600;
          color: #ccc;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s;
          font-family: 'Inter', sans-serif;
        }

        .related-date { font-size: 12px; color: #555; font-family: 'Inter', sans-serif; }

        /* ─── SKELETON ───────────────────────────────── */
        .skeleton {
          border-radius: 8px;
          background: linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ─── NOT FOUND ──────────────────────────────── */
        .not-found {
          text-align: center;
          padding: 120px 24px;
          grid-column: 1 / -1;
        }

        .not-found-icon { font-size: 64px; margin-bottom: 20px; }
        .not-found h2 { font-size: 28px; color: #888; margin-bottom: 12px; }
        .not-found p { color: #555; font-size: 16px; margin-bottom: 28px; }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 10px;
          border: 1.5px solid #64FFDA;
          background: transparent;
          color: #64FFDA;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .back-btn:hover { background: rgba(100,255,218,0.08); }

        /* ─── RESPONSIVE ─────────────────────────────── */
        @media (max-width: 1024px) {
          .page-wrapper {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .sidebar {
            order: -1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          .toc-box { position: relative; top: 0; }
        }

        @media (max-width: 640px) {
          .page-wrapper { padding: 28px 16px; }
          .post-title { font-size: clamp(24px, 6vw, 32px); }
          .article-content { font-size: 16px; }
          .sidebar { grid-template-columns: 1fr; }
          .author-row { flex-direction: column; align-items: flex-start; }
          .post-stats { margin-top: 8px; }
        }
      </style>

      <div id="root"></div>
    `;
  }

  // ─── Skeleton ─────────────────────────────────────────
  _renderSkeleton() {
    const root = this.shadowRoot.getElementById('root');
    root.innerHTML = `
      <div class="page-wrapper">
        <div class="main-col">
          <div style="display:flex;gap:10px;margin-bottom:32px;">
            <div class="skeleton" style="height:14px;width:60px;"></div>
            <div class="skeleton" style="height:14px;width:8px;"></div>
            <div class="skeleton" style="height:14px;width:120px;"></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:32px;">
            <div class="skeleton" style="height:20px;width:120px;border-radius:999px;"></div>
            <div class="skeleton" style="height:48px;width:90%;"></div>
            <div class="skeleton" style="height:48px;width:70%;"></div>
            <div class="skeleton" style="height:20px;width:50%;margin-top:8px;"></div>
          </div>
          <div class="skeleton" style="height:420px;border-radius:16px;margin-bottom:36px;"></div>
          <div style="display:flex;flex-direction:column;gap:14px;">
            ${Array(8).fill(0).map((_, i) => `<div class="skeleton" style="height:18px;width:${85 + Math.random() * 15}%;"></div>`).join('')}
          </div>
        </div>
        <div class="sidebar">
          <div class="toc-box">
            <div class="skeleton" style="height:14px;width:80px;margin-bottom:16px;"></div>
            ${Array(6).fill(0).map(() => `<div class="skeleton" style="height:13px;width:${60 + Math.random() * 35}%;margin-bottom:10px;"></div>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ─── Full post render ─────────────────────────────────
  _renderPost() {
    const root = this.shadowRoot.getElementById('root');

    if (!this._post) {
      root.innerHTML = `
        <div class="page-wrapper">
          <div class="not-found">
            <div class="not-found-icon">📭</div>
            <h2>Post not found</h2>
            <p>This post may have been removed or the link is incorrect.</p>
            <button class="back-btn" id="back-home">← Back to Blog</button>
          </div>
        </div>`;
      root.querySelector('#back-home').addEventListener('click', () => {
        this._dispatchEvent('navigate-home', {});
      });
      return;
    }

    const post = this._post;
    const htmlContent = this._parseMarkdown(post.content || '');
    const { toc, content } = this._buildTOC(htmlContent);
    const tags = (post.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const formattedDate = post.publishedDate
      ? new Date(post.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const authorInitial = (post.author || 'A').charAt(0).toUpperCase();
    const relatedPosts = post.relatedPosts || [];

    root.innerHTML = `
      <div class="page-wrapper">
        <!-- MAIN COLUMN -->
        <article class="main-col">
          <!-- Breadcrumb -->
          <nav class="breadcrumb" aria-label="breadcrumb">
            <a id="bc-home">Blog</a>
            <span class="sep">›</span>
            ${post.category ? `<a id="bc-cat">${post.category}</a><span class="sep">›</span>` : ''}
            <span class="current">${post.title || ''}</span>
          </nav>

          <!-- Header -->
          <header class="post-header">
            <div class="post-meta-top">
              ${post.category ? `<span class="category-badge" id="cat-badge">${post.category}</span><span class="dot"></span>` : ''}
              ${formattedDate ? `<span class="meta-item">📅 ${formattedDate}</span>` : ''}
              ${post.readTime ? `<span class="dot"></span><span class="meta-item">⏱ ${post.readTime} min read</span>` : ''}
            </div>
            <h1 class="post-title">${post.title || 'Untitled'}</h1>
            ${post.excerpt ? `<p class="post-excerpt">${post.excerpt}</p>` : ''}
            <div class="author-row">
              <div class="author-info">
                ${post.authorImage
                  ? `<img class="author-avatar" src="${post.authorImage}" alt="${post.author}">`
                  : `<div class="author-avatar">${authorInitial}</div>`
                }
                <div class="author-details">
                  <span class="author-name">${post.author || 'Anonymous'}</span>
                  ${formattedDate ? `<span class="author-date">${formattedDate}</span>` : ''}
                </div>
              </div>
              <div class="post-stats">
                ${post.viewCount ? `<span class="stat-item">👁 ${post.viewCount.toLocaleString()} views</span>` : ''}
              </div>
            </div>
          </header>

          <!-- Featured Image -->
          ${post.featuredImage ? `
            <div class="featured-image-wrap">
              <img class="featured-image" src="${post.featuredImage}" alt="${post.title}" loading="eager">
            </div>` : ''}

          <!-- Article Body -->
          <div class="article-content" id="article-body">${content}</div>

          <!-- Tags -->
          ${tags.length ? `
            <div class="tags-section">
              <div class="tags-label">🏷 Tags</div>
              <div class="tags-list">
                ${tags.map(t => `<button class="tag" data-tag="${t}">${t}</button>`).join('')}
              </div>
            </div>` : ''}

          <!-- Share -->
          <div class="share-section">
            <div class="share-label">Share this article</div>
            <div class="share-buttons">
              <button class="share-btn" id="share-twitter">𝕏 Twitter</button>
              <button class="share-btn" id="share-linkedin">in LinkedIn</button>
              <button class="share-btn" id="share-copy">🔗 Copy Link</button>
            </div>
          </div>
        </article>

        <!-- SIDEBAR -->
        <aside class="sidebar">
          <!-- TOC -->
          ${toc ? `
            <div class="toc-box" id="toc-box">
              <div class="toc-heading">📑 Contents</div>
              <ul class="toc-list" id="toc-list">${toc}</ul>
            </div>` : ''}

          <!-- Related Posts -->
          ${relatedPosts.length ? `
            <div class="related-box">
              <div class="related-heading">📚 Related Posts</div>
              ${relatedPosts.map(rp => `
                <div class="related-post" data-slug="${rp.slug}">
                  <div class="related-thumb">
                    ${rp.featuredImage
                      ? `<img src="${rp.featuredImage}" alt="${rp.title}" style="width:100%;height:100%;object-fit:cover;">`
                      : '✍️'
                    }
                  </div>
                  <div class="related-info">
                    <div class="related-title">${rp.title}</div>
                    <div class="related-date">${rp.publishedDate ? new Date(rp.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</div>
                  </div>
                </div>`).join('')}
            </div>` : ''}
        </aside>
      </div>
    `;

    this._bindEvents();
    this._initScrollSpy();
  }

  // ─── Event bindings ───────────────────────────────────
  _bindEvents() {
    const root = this.shadowRoot.getElementById('root');

    // Breadcrumb
    root.querySelector('#bc-home')?.addEventListener('click', () => {
      this._dispatchEvent('navigate-home', {});
    });
    root.querySelector('#bc-cat')?.addEventListener('click', () => {
      const cat = this._post?.category || '';
      const slug = cat.toLowerCase().replace(/\s+/g, '-');
      this._dispatchEvent('navigate-category', { category: cat, slug });
    });
    root.querySelector('#cat-badge')?.addEventListener('click', () => {
      const cat = this._post?.category || '';
      const slug = cat.toLowerCase().replace(/\s+/g, '-');
      this._dispatchEvent('navigate-category', { category: cat, slug });
    });

    // Tags
    root.querySelectorAll('.tag').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        const slug = tag.toLowerCase().replace(/\s+/g, '-');
        this._dispatchEvent('navigate-tag', { tag, slug });
      });
    });

    // Related posts
    root.querySelectorAll('.related-post').forEach(el => {
      el.addEventListener('click', () => {
        this._dispatchEvent('navigate-post', { slug: el.dataset.slug });
      });
    });

    // TOC smooth scroll
    root.querySelectorAll('.toc-link').forEach(link => {
      link.addEventListener('click', () => {
        const id = link.dataset.id;
        const target = this.shadowRoot.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          root.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    });

    // Share buttons
    const postUrl = window.location.href;
    const title = encodeURIComponent(this._post?.title || '');

    root.querySelector('#share-twitter')?.addEventListener('click', () => {
      window.open(`https://twitter.com/intent/tweet?text=${title}&url=${encodeURIComponent(postUrl)}`, '_blank');
    });

    root.querySelector('#share-linkedin')?.addEventListener('click', () => {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`, '_blank');
    });

    root.querySelector('#share-copy')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(postUrl);
        const btn = root.querySelector('#share-copy');
        btn.textContent = '✅ Copied!';
        setTimeout(() => { btn.textContent = '🔗 Copy Link'; }, 2000);
      } catch (copyErr) {
        console.warn('Clipboard copy failed:', copyErr.message);
      }
    });
  }

  // ─── Scroll spy for TOC ───────────────────────────────
  _initScrollSpy() {
    const articleBody = this.shadowRoot.getElementById('article-body');
    if (!articleBody) return;

    const headings = articleBody.querySelectorAll('h1[id], h2[id], h3[id], h4[id]');
    if (!headings.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          this.shadowRoot.querySelectorAll('.toc-link').forEach(link => {
            link.classList.toggle('active', link.dataset.id === id);
          });
        }
      });
    }, { rootMargin: '-15% 0px -75% 0px', threshold: 0 });

    headings.forEach(h => observer.observe(h));
    this._tocObserver = observer;
  }

  disconnectedCallback() {
    if (this._tocObserver) this._tocObserver.disconnect();
  }

  // ─── TOC builder ─────────────────────────────────────
  _buildTOC(htmlContent) {
    const div = document.createElement('div');
    div.innerHTML = htmlContent;

    const headings = div.querySelectorAll('h1, h2, h3, h4');
    if (headings.length < 2) return { toc: '', content: htmlContent };

    let tocHTML = '';
    headings.forEach((h, i) => {
      const level = parseInt(h.tagName[1], 10);
      const id = `heading-${i}`;
      h.id = id;
      tocHTML += `<li><span class="toc-link level-${level}" data-id="${id}">${h.textContent}</span></li>`;
    });

    return { toc: tocHTML, content: div.innerHTML };
  }

  // ─── Markdown parser ──────────────────────────────────
  _parseMarkdown(md) {
    if (!md) return '';

    let html = md;

    // Tables first
    html = this._parseTables(html);

    // Protect HTML already in content
    const protected_ = [];
    html = html.replace(/<[^>]+>/g, match => {
      const ph = `%%PROT${protected_.length}%%`;
      protected_.push(match);
      return ph;
    });

    // Headings
    html = html.replace(/^######\s+(.+)$/gim, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gim, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gim, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gim, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gim, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gim, '<h1>$1</h1>');

    // HR
    html = html.replace(/^---+$/gim, '<hr>');

    // Blockquote
    html = html.replace(/^>\s+(.+)$/gim, '<blockquote><p>$1</p></blockquote>');

    // Code blocks
    html = html.replace(/```[\w]*\n?([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');

    // Images before links
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" loading="lazy">');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Inline code
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

    // Bold / italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/gim, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/gim, '<em>$1</em>');
    html = html.replace(/___(.+?)___/gim, '<strong><em>$1</em></strong>');
    html = html.replace(/__(.+?)__/gim, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/gim, '<em>$1</em>');

    // Unordered lists
    html = html.replace(/((?:^[-*+]\s.+\n?)+)/gim, (match) => {
      const items = match.trim().split('\n').map(l => `<li>${l.replace(/^[-*+]\s/, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    });

    // Ordered lists
    html = html.replace(/((?:^\d+\.\s.+\n?)+)/gim, (match) => {
      const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\.\s/, '')}</li>`).join('');
      return `<ol>${items}</ol>`;
    });

    // Paragraphs
    html = html.replace(/\n{2,}/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = `<p>${html}</p>`;
    html = html.replace(/<p>\s*(<(?:h[1-6]|ul|ol|pre|blockquote|hr|table)[^>]*>)/gi, '$1');
    html = html.replace(/(<\/(?:h[1-6]|ul|ol|pre|blockquote|hr|table)>)\s*<\/p>/gi, '$1');
    html = html.replace(/<p>\s*<\/p>/g, '');

    // Restore protected tags
    protected_.forEach((tag, i) => {
      html = html.replace(`%%PROT${i}%%`, tag);
    });

    return html;
  }

  _parseTables(md) {
    const lines = md.split('\n');
    const result = [];
    let inTable = false;
    let tableRows = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isTableRow = line.startsWith('|') && line.endsWith('|');
      const isSeparator = /^\|[\s|:-]+\|$/.test(line);

      if (isTableRow && !isSeparator) {
        const cells = line.slice(1, -1).split('|').map(c => c.trim());

        if (!inTable) {
          inTable = true;
          tableRows = [`<thead><tr>${cells.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`];
        } else {
          tableRows.push(`<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`);
        }
      } else if (isSeparator) {
        // skip separator row
      } else {
        if (inTable) {
          tableRows.push('</tbody>');
          result.push(`<table>${tableRows.join('')}</table>`);
          tableRows = [];
          inTable = false;
        }
        result.push(lines[i]);
      }
    }

    if (inTable) {
      tableRows.push('</tbody>');
      result.push(`<table>${tableRows.join('')}</table>`);
    }

    return result.join('\n');
  }
}

customElements.define('blog-post-viewer', BlogPostViewer);
