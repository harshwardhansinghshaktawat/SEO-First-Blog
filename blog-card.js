class BlogCardWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._posts = [];
    this._currentPage = 0;
    this._pageSize = 6;
    this._totalPosts = 0;
    this._hasMore = false;
    this._layout = 'grid'; // grid | list
    this._activeFilter = 'all';
    this._categories = [];
    this._isLoading = true;
    this._render();
  }

  static get observedAttributes() {
    return ['posts-data', 'categories-data', 'layout', 'loading', 'has-more', 'total-count'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!newValue || oldValue === newValue) return;

    if (name === 'posts-data') {
      try {
        const data = JSON.parse(newValue);
        this._posts = data.posts || [];
        this._totalPosts = data.totalCount || 0;
        this._hasMore = data.hasMore || false;
        this._isLoading = false;
        this._renderPosts();
        this._renderPagination();
      } catch (e) {
        console.error('BlogCardWidget: posts-data parse error', e);
      }
    }

    if (name === 'categories-data') {
      try {
        this._categories = JSON.parse(newValue) || [];
        this._renderFilters();
      } catch (e) {}
    }

    if (name === 'layout') {
      this._layout = newValue;
      this._renderPosts();
    }

    if (name === 'loading') {
      this._isLoading = newValue === 'true';
      this._updateLoadingState();
    }
  }

  connectedCallback() {
    this._dispatchEvent('load-posts', {
      limit: this._pageSize,
      skip: 0,
      filter: this._activeFilter
    });
    this._dispatchEvent('load-categories', {});
  }

  _dispatchEvent(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :host {
          display: block;
          width: 100%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0f0f0f;
          color: #e0e0e0;
          min-height: 400px;
        }

        /* ─── HEADER / FILTER BAR ─────────────────────── */
        .filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 0 28px 0;
          flex-wrap: wrap;
        }

        .filter-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .chip {
          padding: 7px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1.5px solid #333;
          background: transparent;
          color: #aaa;
          transition: all 0.2s ease;
          font-family: inherit;
          white-space: nowrap;
        }

        .chip:hover {
          border-color: #64FFDA;
          color: #64FFDA;
        }

        .chip.active {
          background: #64FFDA;
          color: #0f0f0f;
          border-color: #64FFDA;
          font-weight: 600;
        }

        .layout-toggle {
          display: flex;
          gap: 4px;
          background: #1a1a1a;
          border-radius: 8px;
          padding: 4px;
        }

        .layout-btn {
          background: transparent;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 16px;
          transition: all 0.2s;
        }

        .layout-btn.active {
          background: #2a2a2a;
          color: #64FFDA;
        }

        /* ─── GRID ────────────────────────────────────── */
        .posts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          transition: all 0.3s ease;
        }

        .posts-grid.list-mode {
          grid-template-columns: 1fr;
        }

        /* ─── CARD ────────────────────────────────────── */
        .card {
          background: #1a1a1a;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #2a2a2a;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(100,255,218,0.15);
          border-color: rgba(100,255,218,0.3);
        }

        .card.featured-card {
          border-color: rgba(100,255,218,0.2);
        }

        .card.list-card {
          flex-direction: row;
          height: 180px;
        }

        .card.list-card .card-image-wrap {
          width: 240px;
          min-width: 240px;
          height: 100%;
          border-radius: 16px 0 0 16px;
        }

        .card.list-card .card-body {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* ─── CARD IMAGE ──────────────────────────────── */
        .card-image-wrap {
          position: relative;
          height: 220px;
          overflow: hidden;
          background: linear-gradient(135deg, #1e1e1e, #2d2d2d);
          flex-shrink: 0;
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .card:hover .card-image {
          transform: scale(1.05);
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          background: linear-gradient(135deg, #1e1e2a, #2d2d3a);
        }

        .featured-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(135deg, #64FFDA, #00b894);
          color: #0f0f0f;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .read-time-badge {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          color: #fff;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 999px;
        }

        /* ─── CARD BODY ───────────────────────────────── */
        .card-body {
          padding: 22px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: #666;
        }

        .card-category {
          color: #64FFDA;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #444;
          flex-shrink: 0;
        }

        .card-date { color: #555; }

        .card-title {
          font-size: 18px;
          font-weight: 700;
          color: #f0f0f0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s;
        }

        .card:hover .card-title { color: #ffffff; }

        .card-excerpt {
          font-size: 14px;
          color: #777;
          line-height: 1.65;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }

        .list-card .card-excerpt {
          -webkit-line-clamp: 2;
        }

        /* ─── TAGS ────────────────────────────────────── */
        .card-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: auto;
        }

        .tag {
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 999px;
          background: #232323;
          color: #888;
          border: 1px solid #2e2e2e;
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
        }

        .tag:hover {
          background: rgba(100,255,218,0.08);
          color: #64FFDA;
          border-color: rgba(100,255,218,0.2);
        }

        /* ─── CARD FOOTER ─────────────────────────────── */
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 22px;
          border-top: 1px solid #222;
          background: #151515;
        }

        .author-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .author-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          background: #333;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64FFDA;
          font-weight: 600;
          flex-shrink: 0;
          overflow: hidden;
        }

        .author-name {
          font-size: 13px;
          font-weight: 500;
          color: #999;
        }

        .read-more-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #64FFDA;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: inherit;
          padding: 0;
          transition: gap 0.2s;
        }

        .read-more-btn:hover { gap: 10px; }

        .arrow {
          font-size: 16px;
          transition: transform 0.2s;
        }

        .read-more-btn:hover .arrow {
          transform: translateX(4px);
        }

        /* ─── LOADING / EMPTY ─────────────────────────── */
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .skeleton-card {
          background: #1a1a1a;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #222;
        }

        .skeleton-img { height: 220px; }
        .skeleton-body { padding: 22px; display: flex; flex-direction: column; gap: 12px; }

        .skeleton {
          border-radius: 8px;
          background: linear-gradient(90deg, #1a1a1a 25%, #232323 50%, #1a1a1a 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .skeleton-title { height: 24px; width: 85%; }
        .skeleton-text { height: 14px; }
        .skeleton-text-short { height: 14px; width: 60%; }
        .skeleton-meta { height: 12px; width: 40%; }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #555;
        }

        .empty-state .empty-icon { font-size: 56px; margin-bottom: 16px; }
        .empty-state h3 { font-size: 20px; color: #888; margin-bottom: 8px; }
        .empty-state p { font-size: 14px; }

        /* ─── PAGINATION ──────────────────────────────── */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 40px;
        }

        .page-btn {
          padding: 10px 24px;
          border-radius: 10px;
          border: 1.5px solid #2a2a2a;
          background: #1a1a1a;
          color: #aaa;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .page-btn:hover:not(:disabled) {
          border-color: #64FFDA;
          color: #64FFDA;
        }

        .page-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 14px;
          color: #555;
        }

        .load-more-btn {
          display: block;
          width: 100%;
          max-width: 240px;
          margin: 40px auto 0;
          padding: 14px 28px;
          border-radius: 12px;
          border: 1.5px solid #64FFDA;
          background: transparent;
          color: #64FFDA;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.25s;
          text-align: center;
        }

        .load-more-btn:hover {
          background: rgba(100,255,218,0.08);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(100,255,218,0.15);
        }

        .load-more-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        /* ─── RESPONSIVE ──────────────────────────────── */
        @media (max-width: 768px) {
          .posts-grid { grid-template-columns: 1fr; }
          .card.list-card { flex-direction: column; height: auto; }
          .card.list-card .card-image-wrap { width: 100%; height: 200px; border-radius: 16px 16px 0 0; }
          .layout-toggle { display: none; }
          .filter-bar { gap: 8px; }
        }

        @media (max-width: 480px) {
          .card-body { padding: 16px; }
          .card-footer { padding: 12px 16px; }
          .chip { padding: 6px 14px; font-size: 12px; }
        }
      </style>

      <div class="filter-bar" id="filter-bar">
        <div class="filter-chips" id="filter-chips">
          <button class="chip active" data-filter="all">All Posts</button>
        </div>
        <div class="layout-toggle">
          <button class="layout-btn active" data-layout="grid" title="Grid view">⊞</button>
          <button class="layout-btn" data-layout="list" title="List view">☰</button>
        </div>
      </div>

      <div id="posts-container"></div>
      <div id="pagination-container"></div>
    `;

    this._setupInternalListeners();
  }

  _setupInternalListeners() {
    // Layout toggle
    this.shadowRoot.querySelectorAll('.layout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._layout = btn.dataset.layout;
        this.shadowRoot.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderPosts();
      });
    });

    // Filter chip for "All"
    const allChip = this.shadowRoot.querySelector('[data-filter="all"]');
    allChip.addEventListener('click', () => this._applyFilter('all'));
  }

  _renderFilters() {
    const chips = this.shadowRoot.getElementById('filter-chips');
    chips.innerHTML = `<button class="chip ${this._activeFilter === 'all' ? 'active' : ''}" data-filter="all">All Posts</button>`;

    this._categories.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = `chip ${this._activeFilter === cat.slug ? 'active' : ''}`;
      chip.dataset.filter = cat.slug;
      chip.textContent = cat.name;
      chip.addEventListener('click', () => this._applyFilter(cat.slug));
      chips.appendChild(chip);
    });

    chips.querySelector('[data-filter="all"]').addEventListener('click', () => this._applyFilter('all'));
  }

  _applyFilter(filter) {
    this._activeFilter = filter;
    this._currentPage = 0;
    this.shadowRoot.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', c.dataset.filter === filter);
    });
    this._dispatchEvent('load-posts', {
      limit: this._pageSize,
      skip: 0,
      filter
    });
  }

  _updateLoadingState() {
    const container = this.shadowRoot.getElementById('posts-container');
    if (this._isLoading) {
      container.innerHTML = this._skeletonHTML();
    }
  }

  _skeletonHTML() {
    let html = '<div class="loading-grid">';
    for (let i = 0; i < 6; i++) {
      html += `
        <div class="skeleton-card">
          <div class="skeleton skeleton-img"></div>
          <div class="skeleton-body">
            <div class="skeleton skeleton-meta"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text-short"></div>
          </div>
        </div>`;
    }
    html += '</div>';
    return html;
  }

  _renderPosts() {
    const container = this.shadowRoot.getElementById('posts-container');

    if (this._isLoading) {
      container.innerHTML = this._skeletonHTML();
      return;
    }

    if (!this._posts.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No posts found</h3>
          <p>There are no posts in this category yet.</p>
        </div>`;
      return;
    }

    const gridClass = `posts-grid${this._layout === 'list' ? ' list-mode' : ''}`;
    container.innerHTML = `<div class="${gridClass}" id="posts-grid"></div>`;
    const grid = container.querySelector('#posts-grid');

    this._posts.forEach(post => {
      const card = this._createCard(post);
      grid.appendChild(card);
    });
  }

  _createCard(post) {
    const isListMode = this._layout === 'list';
    const card = document.createElement('div');
    card.className = `card${post.isFeatured ? ' featured-card' : ''}${isListMode ? ' list-card' : ''}`;

    const imageHTML = post.featuredImage
      ? `<img class="card-image" src="${post.featuredImage}" alt="${post.title}" loading="lazy">`
      : `<div class="image-placeholder">✍️</div>`;

    const tagsHTML = (post.tags || '').split(',').filter(t => t.trim()).slice(0, 3).map(tag =>
      `<span class="tag">${tag.trim()}</span>`
    ).join('');

    const authorInitial = (post.author || 'A').charAt(0).toUpperCase();
    const authorAvatarHTML = post.authorImage
      ? `<img class="author-avatar" src="${post.authorImage}" alt="${post.author}">`
      : `<div class="author-avatar">${authorInitial}</div>`;

    const formattedDate = post.publishedDate
      ? new Date(post.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : '';

    card.innerHTML = `
      <div class="card-image-wrap">
        ${imageHTML}
        ${post.isFeatured ? '<div class="featured-badge">⭐ Featured</div>' : ''}
        ${post.readTime ? `<div class="read-time-badge">⏱ ${post.readTime} min read</div>` : ''}
      </div>
      <div class="card-body">
        <div class="card-meta">
          ${post.category ? `<span class="card-category">${post.category}</span><span class="dot"></span>` : ''}
          ${formattedDate ? `<span class="card-date">${formattedDate}</span>` : ''}
        </div>
        <div class="card-title">${post.title || 'Untitled Post'}</div>
        ${!isListMode ? `<div class="card-excerpt">${post.excerpt || ''}</div>` : ''}
        ${!isListMode && tagsHTML ? `<div class="card-tags">${tagsHTML}</div>` : ''}
      </div>
      <div class="card-footer">
        <div class="author-info">
          ${authorAvatarHTML}
          <span class="author-name">${post.author || 'Anonymous'}</span>
        </div>
        <button class="read-more-btn">
          Read <span class="arrow">→</span>
        </button>
      </div>
    `;

    // Navigation
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('tag')) {
        const tagSlug = e.target.textContent.trim().toLowerCase().replace(/\s+/g, '-');
        this._dispatchEvent('navigate-tag', { tag: e.target.textContent.trim(), slug: tagSlug });
        return;
      }
      this._dispatchEvent('navigate-post', { slug: post.slug, post });
    });

    return card;
  }

  _renderPagination() {
    const container = this.shadowRoot.getElementById('pagination-container');

    if (this._totalPosts <= this._pageSize) {
      container.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(this._totalPosts / this._pageSize);
    const currentPage = this._currentPage + 1;

    container.innerHTML = `
      <div class="pagination">
        <button class="page-btn" id="prev-btn" ${this._currentPage === 0 ? 'disabled' : ''}>← Previous</button>
        <span class="page-info">Page ${currentPage} of ${totalPages}</span>
        <button class="page-btn" id="next-btn" ${!this._hasMore ? 'disabled' : ''}>Next →</button>
      </div>
    `;

    container.querySelector('#prev-btn')?.addEventListener('click', () => {
      if (this._currentPage > 0) {
        this._currentPage--;
        this._dispatchEvent('load-posts', {
          limit: this._pageSize,
          skip: this._currentPage * this._pageSize,
          filter: this._activeFilter
        });
      }
    });

    container.querySelector('#next-btn')?.addEventListener('click', () => {
      if (this._hasMore) {
        this._currentPage++;
        this._dispatchEvent('load-posts', {
          limit: this._pageSize,
          skip: this._currentPage * this._pageSize,
          filter: this._activeFilter
        });
      }
    });
  }
}

customElements.define('blog-card-widget', BlogCardWidget);
