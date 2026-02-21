class BlogDashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._posts = [];
    this._totalPosts = 0;
    this._currentPage = 0;
    this._pageSize = 12;
    this._view = 'list'; // 'list' | 'editor'
    this._editingPost = null;
    this._isSaving = false;
    this._autoSaveTimer = null;
    this._autoSaveDelay = 3000;
    this._lastSavedContent = '';
    this._analysisTimer = null;
    this._render();
  }

  static get observedAttributes() {
    return ['posts-data', 'save-result', 'delete-result', 'notification', 'upload-result', 'trigger-load'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!newValue || oldValue === newValue) return;
    if (name === 'trigger-load') {
      this._loadPosts();
      return;
    }
    try {
      const data = JSON.parse(newValue);
      if (name === 'posts-data') { this._onPostsData(data); }
      else if (name === 'save-result') { this._onSaveResult(data); }
      else if (name === 'delete-result') { this._onDeleteResult(data); }
      else if (name === 'notification') { this._showToast(data.type, data.message); }
      else if (name === 'upload-result') { this._onUploadResult(data); }
    } catch (e) { console.error('BlogDashboard attr error:', e); }
  }

  connectedCallback() {
    // Frontend triggers initial load via setAttribute('trigger-load','1')
    // after registering all el.on() listeners, avoiding timing race conditions
  }

  _dispatch(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  // ─────────────────────────────────────────────────────────
  //  STYLES
  // ─────────────────────────────────────────────────────────
  _getStyles() {
    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :host { display: block; width: 100%; min-height: 100vh; font-family: 'Inter', sans-serif; background: #0d0d0d; color: #e0e0e0; }

        /* ── HEADER ── */
        .dash-header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          padding: 28px 32px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          border-bottom: 1px solid #1e2a4a; flex-wrap: wrap;
        }
        .dash-title { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.03em; }
        .dash-title span { color: #64FFDA; }
        .dash-stats { display: flex; gap: 20px; }
        .stat-pill {
          background: rgba(100,255,218,0.08); border: 1px solid rgba(100,255,218,0.15);
          padding: 8px 16px; border-radius: 999px; font-size: 13px; color: #aaa;
        }
        .stat-pill strong { color: #64FFDA; }
        .btn-new {
          background: #64FFDA; color: #0d0d0d; border: none; padding: 12px 24px;
          border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: all 0.2s; display: flex; align-items: center; gap: 8px;
        }
        .btn-new:hover { background: #4de8c4; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(100,255,218,0.25); }

        /* ── TOOLBAR ── */
        .toolbar {
          padding: 18px 32px; background: #111; border-bottom: 1px solid #1e1e1e;
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .search-input {
          flex: 1; min-width: 200px; background: #1a1a1a; border: 1.5px solid #252525;
          border-radius: 8px; padding: 9px 14px; color: #e0e0e0; font-size: 14px;
          font-family: inherit; transition: border-color 0.2s; outline: none;
        }
        .search-input:focus { border-color: #64FFDA; }
        .filter-select {
          background: #1a1a1a; border: 1.5px solid #252525; border-radius: 8px;
          padding: 9px 14px; color: #e0e0e0; font-size: 14px; font-family: inherit;
          outline: none; cursor: pointer;
        }
        .filter-select:focus { border-color: #64FFDA; }

        /* ── POSTS TABLE ── */
        .posts-wrap { padding: 24px 32px; }
        .posts-table { width: 100%; border-collapse: collapse; }
        .posts-table th {
          text-align: left; padding: 10px 14px; font-size: 12px; font-weight: 600;
          color: #555; text-transform: uppercase; letter-spacing: 0.6px;
          border-bottom: 1px solid #1e1e1e;
        }
        .posts-table td { padding: 14px; border-bottom: 1px solid #161616; vertical-align: middle; }
        .posts-table tr:hover td { background: #141414; }
        .post-row-title { font-size: 15px; font-weight: 600; color: #e0e0e0; margin-bottom: 4px; }
        .post-row-meta { font-size: 12px; color: #555; display: flex; gap: 10px; }
        .post-thumb {
          width: 56px; height: 56px; border-radius: 8px; object-fit: cover;
          background: #1a1a1a; flex-shrink: 0; display: flex; align-items: center;
          justify-content: center; font-size: 20px; overflow: hidden;
        }
        .post-thumb-cell { display: flex; align-items: center; gap: 14px; }
        .status-badge {
          display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
          border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase;
        }
        .status-published { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
        .status-draft { background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }
        .dot-status { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .row-actions { display: flex; gap: 8px; }
        .row-btn {
          padding: 7px 14px; border-radius: 7px; border: 1.5px solid #252525;
          background: #1a1a1a; color: #aaa; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
        }
        .row-btn:hover { border-color: #64FFDA; color: #64FFDA; }
        .row-btn.danger:hover { border-color: #ef4444; color: #ef4444; }

        /* ── PAGINATION ── */
        .pagination {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 32px; border-top: 1px solid #1a1a1a;
        }
        .page-info { font-size: 13px; color: #555; }
        .page-btns { display: flex; gap: 8px; }
        .page-btn {
          padding: 8px 18px; border-radius: 8px; border: 1.5px solid #252525;
          background: #1a1a1a; color: #aaa; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
        }
        .page-btn:hover:not(:disabled) { border-color: #64FFDA; color: #64FFDA; }
        .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* ── SKELETON ── */
        .skeleton {
          border-radius: 6px; animation: shimmer 1.4s infinite;
          background: linear-gradient(90deg, #161616 25%, #1e1e1e 50%, #161616 75%);
          background-size: 200% 100%;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ── TOAST ── */
        .toast {
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          padding: 14px 20px; border-radius: 10px; font-size: 14px; font-weight: 500;
          min-width: 280px; box-shadow: 0 8px 30px rgba(0,0,0,0.4);
          display: none; animation: slideIn 0.3s ease;
        }
        .toast.show { display: flex; align-items: center; gap: 10px; }
        .toast-success { background: #0d2b1e; border: 1px solid #065f46; color: #34d399; }
        .toast-error { background: #2b0d0d; border: 1px solid #7f1d1d; color: #f87171; }
        .toast-info { background: #0d1a2b; border: 1px solid #1e3a5f; color: #60a5fa; }
        @keyframes slideIn { from{transform:translateX(120px);opacity:0} to{transform:translateX(0);opacity:1} }

        /* ═══════════════════════════════════════════════════
           EDITOR VIEW
        ═══════════════════════════════════════════════════ */
        .editor-view { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

        .editor-topbar {
          background: #111; border-bottom: 1px solid #1e1e1e;
          padding: 12px 20px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .back-btn {
          background: transparent; border: 1.5px solid #252525; color: #aaa;
          padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
          display: flex; align-items: center; gap: 6px;
        }
        .back-btn:hover { border-color: #aaa; color: #fff; }
        .editor-title-input {
          flex: 1; background: transparent; border: none; outline: none;
          font-size: 20px; font-weight: 700; color: #fff; font-family: inherit;
          min-width: 200px;
        }
        .editor-title-input::placeholder { color: #333; }
        .autosave-status { font-size: 12px; color: #555; white-space: nowrap; }
        .autosave-status.saving { color: #fbbf24; }
        .autosave-status.saved { color: #34d399; }
        .publish-btn {
          background: #64FFDA; color: #0d0d0d; border: none; padding: 9px 20px;
          border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: all 0.2s;
        }
        .publish-btn:hover { background: #4de8c4; }
        .draft-btn {
          background: transparent; border: 1.5px solid #252525; color: #aaa;
          padding: 9px 20px; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
        }
        .draft-btn:hover { border-color: #fbbf24; color: #fbbf24; }

        /* ── EDITOR LAYOUT ── */
        .editor-body {
          display: grid; grid-template-columns: 1fr 340px;
          flex: 1; overflow: hidden;
        }

        /* ── EDITOR CENTER PANEL ── */
        .editor-center {
          display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid #1a1a1a;
        }

        /* ── RICH TOOLBAR ── */
        .rich-toolbar {
          background: #111; border-bottom: 1px solid #1a1a1a;
          padding: 8px 16px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
        }
        .tb-sep { width: 1px; height: 22px; background: #252525; margin: 0 6px; flex-shrink: 0; }
        .tb-btn {
          background: transparent; border: none; color: #777;
          width: 32px; height: 32px; border-radius: 6px; cursor: pointer;
          font-size: 13px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
          transition: all 0.15s; display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .tb-btn:hover { background: #1e1e1e; color: #e0e0e0; }
        .tb-btn.active { background: rgba(100,255,218,0.12); color: #64FFDA; }
        .tb-btn-text { font-family: inherit; font-size: 12px; font-weight: 600; width: auto; padding: 0 8px; }
        .tb-select {
          background: transparent; border: 1px solid #252525; color: #777;
          padding: 4px 8px; border-radius: 6px; font-size: 12px; font-family: inherit;
          cursor: pointer; outline: none;
        }
        .tb-select:focus { border-color: #64FFDA; color: #e0e0e0; }

        /* ── PREVIEW TOGGLE ── */
        .mode-toggle {
          display: flex; background: #1a1a1a; border-radius: 8px; padding: 3px; margin-left: auto;
        }
        .mode-btn {
          padding: 5px 12px; border-radius: 6px; border: none; background: transparent;
          color: #666; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
          transition: all 0.2s;
        }
        .mode-btn.active { background: #252525; color: #64FFDA; }

        /* ── EDITOR AREA ── */
        .editor-area { flex: 1; overflow: hidden; display: flex; }
        .md-editor {
          flex: 1; resize: none; background: #0d0d0d; border: none; outline: none;
          color: #d4d4d4; font-family: 'JetBrains Mono', monospace; font-size: 15px;
          line-height: 1.8; padding: 32px; tab-size: 2; overflow-y: auto;
        }
        .md-editor::placeholder { color: #2a2a2a; }
        .md-preview {
          flex: 1; background: #0d0d0d; padding: 32px; overflow-y: auto;
          display: none; font-size: 16px; line-height: 1.8; color: #d4d4d4;
        }
        .md-preview.active { display: block; }
        .md-editor.hidden { display: none; }

        /* Preview typography */
        .md-preview h1,.md-preview h2,.md-preview h3,.md-preview h4 { color:#fff;font-weight:700;margin:32px 0 12px; }
        .md-preview h1{font-size:28px;} .md-preview h2{font-size:22px;} .md-preview h3{font-size:18px;}
        .md-preview p { margin-bottom:18px; }
        .md-preview a { color:#64FFDA; }
        .md-preview blockquote { border-left:3px solid #64FFDA;padding:12px 20px;background:#141414;margin:20px 0;border-radius:0 8px 8px 0; }
        .md-preview code { background:#1a1a1a;padding:2px 6px;border-radius:4px;font-family:'JetBrains Mono',monospace;color:#64FFDA;font-size:0.88em; }
        .md-preview pre { background:#141414;border:1px solid #252525;border-radius:10px;padding:20px;margin:20px 0;overflow-x:auto; }
        .md-preview pre code { background:transparent;padding:0;color:#e0e0e0; }
        .md-preview ul,.md-preview ol { padding-left:24px;margin-bottom:18px; }
        .md-preview li { margin-bottom:6px; }
        .md-preview img { max-width:100%;border-radius:8px;margin:16px 0; }
        .md-preview table { width:100%;border-collapse:collapse;margin:20px 0; }
        .md-preview th { background:#1a1a1a;color:#64FFDA;padding:10px 14px;text-align:left;border-bottom:2px solid #252525; }
        .md-preview td { padding:10px 14px;border-bottom:1px solid #1a1a1a; }
        .md-preview hr { border:none;border-top:1px solid #1e1e1e;margin:32px 0; }
        .md-preview strong { color:#fff;font-weight:700; }

        /* ── RIGHT PANEL ── */
        .editor-panel {
          overflow-y: auto; background: #0f0f0f; display: flex; flex-direction: column;
        }
        .editor-panel::-webkit-scrollbar { width: 5px; }
        .editor-panel::-webkit-scrollbar-thumb { background: #252525; border-radius: 3px; }

        .panel-section { border-bottom: 1px solid #1a1a1a; }
        .panel-header {
          padding: 14px 20px; display: flex; align-items: center; justify-content: space-between;
          cursor: pointer; user-select: none; transition: background 0.2s;
        }
        .panel-header:hover { background: #141414; }
        .panel-header-title { font-size: 13px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.6px; display: flex; align-items: center; gap: 8px; }
        .panel-chevron { color: #444; font-size: 11px; transition: transform 0.2s; }
        .panel-chevron.open { transform: rotate(180deg); }
        .panel-body { padding: 16px 20px; display: none; }
        .panel-body.open { display: flex; flex-direction: column; gap: 14px; }

        /* ── FORM FIELDS ── */
        .field-label { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 6px; display: block; }
        .field-input {
          width: 100%; background: #141414; border: 1.5px solid #1e1e1e; border-radius: 8px;
          padding: 9px 12px; color: #e0e0e0; font-size: 13px; font-family: inherit; outline: none;
          transition: border-color 0.2s;
        }
        .field-input:focus { border-color: #64FFDA; }
        .field-textarea {
          width: 100%; background: #141414; border: 1.5px solid #1e1e1e; border-radius: 8px;
          padding: 9px 12px; color: #e0e0e0; font-size: 13px; font-family: inherit; outline: none;
          transition: border-color 0.2s; resize: vertical; min-height: 80px;
        }
        .field-textarea:focus { border-color: #64FFDA; }
        .field-select {
          width: 100%; background: #141414; border: 1.5px solid #1e1e1e; border-radius: 8px;
          padding: 9px 12px; color: #e0e0e0; font-size: 13px; font-family: inherit; outline: none;
          cursor: pointer;
        }
        .char-count { font-size: 11px; color: #444; text-align: right; margin-top: 4px; }
        .char-count.warn { color: #fbbf24; }
        .char-count.over { color: #f87171; }
        .slug-preview { font-size: 11px; color: #555; margin-top: 4px; word-break: break-all; }

        /* ── IMAGE UPLOAD ── */
        .image-upload-area {
          border: 2px dashed #252525; border-radius: 10px; padding: 20px;
          text-align: center; cursor: pointer; transition: all 0.2s;
        }
        .image-upload-area:hover { border-color: #64FFDA; background: rgba(100,255,218,0.03); }
        .image-upload-area input { display: none; }
        .upload-icon { font-size: 28px; margin-bottom: 8px; }
        .upload-text { font-size: 13px; color: #555; }
        .img-preview { width: 100%; border-radius: 8px; display: block; margin-top: 10px; }

        /* ═══════════════════════════════════════════════════
           SEO ANALYZER
        ═══════════════════════════════════════════════════ */
        .seo-score-ring {
          display: flex; align-items: center; gap: 14px; margin-bottom: 16px;
        }
        .score-circle {
          position: relative; width: 70px; height: 70px; flex-shrink: 0;
        }
        .score-svg { transform: rotate(-90deg); }
        .score-bg { fill: none; stroke: #1e1e1e; stroke-width: 6; }
        .score-arc { fill: none; stroke-width: 6; stroke-linecap: round; transition: stroke-dashoffset 0.6s ease, stroke 0.4s ease; }
        .score-text {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          font-size: 18px; font-weight: 800; font-family: 'Inter', sans-serif;
        }
        .score-label { font-size: 13px; }
        .score-label strong { display: block; font-size: 15px; font-weight: 700; color: #e0e0e0; margin-bottom: 4px; }
        .score-label span { font-size: 12px; color: #555; }

        .seo-checks { display: flex; flex-direction: column; gap: 8px; }
        .seo-check {
          display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px;
          border-radius: 8px; background: #141414; border: 1px solid #1a1a1a; font-size: 12px;
        }
        .check-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
        .check-text { color: #888; line-height: 1.4; }
        .check-text strong { display: block; color: #ccc; font-size: 13px; margin-bottom: 2px; }
        .seo-check.pass { border-color: rgba(16,185,129,0.15); }
        .seo-check.fail { border-color: rgba(239,68,68,0.15); }
        .seo-check.warn { border-color: rgba(245,158,11,0.15); }

        /* ═══════════════════════════════════════════════════
           READABILITY ANALYZER
        ═══════════════════════════════════════════════════ */
        .readability-score-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .readability-badge {
          padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .readability-checks { display: flex; flex-direction: column; gap: 6px; }
        .r-bar-row { display: flex; flex-direction: column; gap: 4px; }
        .r-bar-label { display: flex; justify-content: space-between; font-size: 12px; color: #666; }
        .r-bar-bg { background: #1a1a1a; border-radius: 999px; height: 5px; overflow: hidden; }
        .r-bar-fill { height: 100%; border-radius: 999px; transition: width 0.5s ease; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1100px) {
          .editor-body { grid-template-columns: 1fr; }
          .editor-panel { display: none; }
        }
        @media (max-width: 768px) {
          .dash-header { padding: 20px 16px; }
          .posts-wrap { padding: 16px; }
          .toolbar { padding: 12px 16px; }
          .posts-table th:nth-child(3), .posts-table td:nth-child(3),
          .posts-table th:nth-child(4), .posts-table td:nth-child(4) { display: none; }
        }
      </style>
    `;
  }

  // ─────────────────────────────────────────────────────────
  //  INITIAL RENDER
  // ─────────────────────────────────────────────────────────
  _render() {
    this.shadowRoot.innerHTML = `
      ${this._getStyles()}
      <div id="root"></div>
      <div class="toast" id="toast"></div>
    `;
    this._renderListView();
  }

  // ─────────────────────────────────────────────────────────
  //  LIST VIEW
  // ─────────────────────────────────────────────────────────
  _renderListView() {
    const root = this.shadowRoot.getElementById('root');
    root.innerHTML = `
      <div class="dash-header">
        <div>
          <div class="dash-title">Blog <span>Dashboard</span></div>
        </div>
        <div class="dash-stats">
          <div class="stat-pill">Total: <strong id="stat-total">—</strong></div>
          <div class="stat-pill">Published: <strong id="stat-pub">—</strong></div>
          <div class="stat-pill">Drafts: <strong id="stat-draft">—</strong></div>
        </div>
        <button class="btn-new" id="btn-new-post">✦ New Post</button>
      </div>

      <div class="toolbar">
        <input class="search-input" id="search-input" type="text" placeholder="Search posts…">
        <select class="filter-select" id="status-filter">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div class="posts-wrap">
        <table class="posts-table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Category</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="posts-tbody">
            ${this._skeletonRows()}
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <div class="page-info" id="page-info">Loading…</div>
        <div class="page-btns">
          <button class="page-btn" id="prev-btn" disabled>← Prev</button>
          <button class="page-btn" id="next-btn" disabled>Next →</button>
        </div>
      </div>
    `;

    this._bindListEvents();
  }

  _skeletonRows() {
    return Array(6).fill(0).map(() => `
      <tr>
        <td><div class="post-thumb-cell">
          <div class="post-thumb skeleton"></div>
          <div style="flex:1"><div class="skeleton" style="height:16px;width:70%;margin-bottom:8px;"></div><div class="skeleton" style="height:12px;width:40%;"></div></div>
        </div></td>
        <td><div class="skeleton" style="height:14px;width:80px;"></div></td>
        <td><div class="skeleton" style="height:22px;width:70px;border-radius:999px;"></div></td>
        <td><div class="skeleton" style="height:14px;width:90px;"></div></td>
        <td><div style="display:flex;gap:8px;">
          <div class="skeleton" style="height:32px;width:52px;border-radius:7px;"></div>
          <div class="skeleton" style="height:32px;width:52px;border-radius:7px;"></div>
        </div></td>
      </tr>`).join('');
  }

  _bindListEvents() {
    const root = this.shadowRoot.getElementById('root');

    root.querySelector('#btn-new-post').addEventListener('click', () => {
      this._openEditor(null);
    });

    let searchTimeout = null;
    root.querySelector('#search-input').addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => this._loadPosts({ search: e.target.value }), 350);
    });

    root.querySelector('#status-filter').addEventListener('change', (e) => {
      this._loadPosts({ statusFilter: e.target.value });
    });

    root.querySelector('#prev-btn').addEventListener('click', () => {
      if (this._currentPage > 0) { this._currentPage--; this._loadPosts(); }
    });

    root.querySelector('#next-btn').addEventListener('click', () => {
      this._currentPage++;
      this._loadPosts();
    });
  }

  _loadPosts(opts = {}) {
    this._dispatch('load-posts', {
      limit: this._pageSize,
      skip: this._currentPage * this._pageSize,
      ...opts
    });
  }

  _onPostsData(data) {
    this._posts = data.posts || [];
    this._totalPosts = data.totalCount || 0;
    const root = this.shadowRoot.getElementById('root');
    if (!root) return;

    // Stats
    const pub = this._posts.filter(p => p.status === 'published').length;
    const draft = this._posts.filter(p => p.status === 'draft').length;
    const statTotal = root.querySelector('#stat-total');
    const statPub = root.querySelector('#stat-pub');
    const statDraft = root.querySelector('#stat-draft');
    if (statTotal) statTotal.textContent = this._totalPosts;
    if (statPub) statPub.textContent = data.publishedCount ?? pub;
    if (statDraft) statDraft.textContent = data.draftCount ?? draft;

    // Table
    const tbody = root.querySelector('#posts-tbody');
    if (!tbody) return;

    if (!this._posts.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:60px;color:#444;">No posts found</td></tr>`;
    } else {
      tbody.innerHTML = this._posts.map(post => this._postRowHTML(post)).join('');
      tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const post = this._posts.find(p => p._id === btn.dataset.id);
          if (post) this._openEditor(post);
        });
      });
      tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => this._confirmDelete(btn.dataset.id, btn.dataset.title));
      });
    }

    // Pagination
    const totalPages = Math.ceil(this._totalPosts / this._pageSize);
    const pageInfo = root.querySelector('#page-info');
    const prevBtn = root.querySelector('#prev-btn');
    const nextBtn = root.querySelector('#next-btn');
    if (pageInfo) pageInfo.textContent = `Page ${this._currentPage + 1} of ${Math.max(1, totalPages)}`;
    if (prevBtn) prevBtn.disabled = this._currentPage === 0;
    if (nextBtn) nextBtn.disabled = (this._currentPage + 1) >= totalPages;
  }

  _postRowHTML(post) {
    const date = post.publishedDate
      ? new Date(post.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : new Date(post._updatedDate || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const isPub = post.status === 'published';
    const thumbHTML = post.featuredImage
      ? `<img class="post-thumb" src="${post.featuredImage}" alt="">`
      : `<div class="post-thumb">✍️</div>`;

    return `
      <tr>
        <td><div class="post-thumb-cell">
          ${thumbHTML}
          <div>
            <div class="post-row-title">${post.title || 'Untitled'}</div>
            <div class="post-row-meta">
              <span>/${post.slug || ''}</span>
              ${post.readTime ? `<span>· ${post.readTime} min read</span>` : ''}
            </div>
          </div>
        </div></td>
        <td style="color:#888;font-size:13px;">${post.category || '—'}</td>
        <td>
          <span class="status-badge ${isPub ? 'status-published' : 'status-draft'}">
            <span class="dot-status"></span>${isPub ? 'Published' : 'Draft'}
          </span>
        </td>
        <td style="color:#555;font-size:13px;">${date}</td>
        <td>
          <div class="row-actions">
            <button class="row-btn edit-btn" data-id="${post._id}">Edit</button>
            <button class="row-btn danger delete-btn" data-id="${post._id}" data-title="${(post.title || '').replace(/"/g, '&quot;')}">Delete</button>
          </div>
        </td>
      </tr>`;
  }

  _confirmDelete(id, title) {
    if (confirm(`Delete "${title}"?\n\nThis action cannot be undone.`)) {
      this._dispatch('delete-post', { postId: id });
    }
  }

  _onDeleteResult(data) {
    if (data.success) {
      this._showToast('success', 'Post deleted successfully');
      this._loadPosts();
    } else {
      this._showToast('error', `Delete failed: ${data.error || 'Unknown error'}`);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  EDITOR VIEW
  // ─────────────────────────────────────────────────────────
  _openEditor(post) {
    this._editingPost = post ? { ...post } : null;
    this._view = 'editor';
    this._renderEditorView();
  }

  _renderEditorView() {
    const root = this.shadowRoot.getElementById('root');
    const post = this._editingPost;

    root.innerHTML = `
      <div class="editor-view">
        <!-- TOP BAR -->
        <div class="editor-topbar">
          <button class="back-btn" id="back-btn">← Posts</button>
          <input class="editor-title-input" id="ed-title" type="text"
            placeholder="Post title…"
            value="${this._esc(post?.title || '')}">
          <span class="autosave-status" id="autosave-status">●  All changes saved</span>
          <button class="draft-btn" id="save-draft-btn">Save Draft</button>
          <button class="publish-btn" id="publish-btn">
            ${post?.status === 'published' ? '🔄 Update' : '🚀 Publish'}
          </button>
        </div>

        <!-- MAIN BODY -->
        <div class="editor-body">
          <!-- CENTER: EDITOR -->
          <div class="editor-center">
            <!-- RICH TOOLBAR -->
            <div class="rich-toolbar">
              <!-- Headings -->
              <select class="tb-select" id="heading-select">
                <option value="">Paragraph</option>
                <option value="h1"># H1</option>
                <option value="h2">## H2</option>
                <option value="h3">### H3</option>
                <option value="h4">#### H4</option>
                <option value="h5">##### H5</option>
                <option value="h6">###### H6</option>
              </select>
              <div class="tb-sep"></div>
              <!-- Inline formatting -->
              <button class="tb-btn" data-action="bold" title="Bold (Ctrl+B)"><b>B</b></button>
              <button class="tb-btn" data-action="italic" title="Italic (Ctrl+I)"><i>I</i></button>
              <button class="tb-btn" data-action="strikethrough" title="Strikethrough">S̶</button>
              <button class="tb-btn" data-action="inline-code" title="Inline Code">&lt;/&gt;</button>
              <div class="tb-sep"></div>
              <!-- Lists -->
              <button class="tb-btn tb-btn-text" data-action="ul" title="Bullet List">• List</button>
              <button class="tb-btn tb-btn-text" data-action="ol" title="Numbered List">1. List</button>
              <button class="tb-btn tb-btn-text" data-action="checklist" title="Task List">☐ Task</button>
              <div class="tb-sep"></div>
              <!-- Blocks -->
              <button class="tb-btn" data-action="blockquote" title="Blockquote">"</button>
              <button class="tb-btn tb-btn-text" data-action="code-block" title="Code Block">{ } Code</button>
              <button class="tb-btn" data-action="hr" title="Horizontal Rule">—</button>
              <div class="tb-sep"></div>
              <!-- Media -->
              <button class="tb-btn tb-btn-text" data-action="link" title="Insert Link">🔗</button>
              <button class="tb-btn tb-btn-text" data-action="image-url" title="Insert Image">🖼</button>
              <button class="tb-btn tb-btn-text" data-action="table" title="Insert Table">⊞ Table</button>
              <div class="tb-sep"></div>
              <!-- Mode -->
              <div class="mode-toggle">
                <button class="mode-btn active" id="mode-edit">Edit</button>
                <button class="mode-btn" id="mode-preview">Preview</button>
                <button class="mode-btn" id="mode-split">Split</button>
              </div>
            </div>

            <!-- EDITOR AREA -->
            <div class="editor-area">
              <textarea class="md-editor" id="md-editor"
                placeholder="Start writing in Markdown…&#10;&#10;## Heading&#10;**Bold**, *italic*, \`code\`&#10;&#10;- List item"
                spellcheck="true">${this._esc(post?.content || '')}</textarea>
              <div class="md-preview" id="md-preview"></div>
            </div>
          </div>

          <!-- RIGHT PANEL -->
          <div class="editor-panel" id="editor-panel">
            ${this._panelPostSettings(post)}
            ${this._panelFeaturedImage(post)}
            ${this._panelSEO(post)}
            ${this._panelReadability()}
          </div>
        </div>
      </div>
    `;

    this._bindEditorEvents();
    this._runAnalysis();
  }

  _esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ─────────────────────────────────────────────────────────
  //  PANEL TEMPLATES
  // ─────────────────────────────────────────────────────────
  _panelPostSettings(post) {
    return `
      <div class="panel-section">
        <div class="panel-header" data-section="settings">
          <div class="panel-header-title">⚙️ Post Settings</div>
          <div class="panel-chevron open" id="chevron-settings">▼</div>
        </div>
        <div class="panel-body open" id="body-settings">
          <div>
            <label class="field-label">Slug (URL)</label>
            <input class="field-input" id="ed-slug" type="text"
              value="${this._esc(post?.slug || '')}" placeholder="my-post-title">
            <div class="slug-preview" id="slug-preview">/blog/${post?.slug || ''}</div>
          </div>
          <div>
            <label class="field-label">Author</label>
            <input class="field-input" id="ed-author" type="text"
              value="${this._esc(post?.author || '')}" placeholder="Author name">
          </div>
          <div>
            <label class="field-label">Category</label>
            <input class="field-input" id="ed-category" type="text"
              value="${this._esc(post?.category || '')}" placeholder="e.g. Technology">
          </div>
          <div>
            <label class="field-label">Tags (comma separated)</label>
            <input class="field-input" id="ed-tags" type="text"
              value="${this._esc(post?.tags || '')}" placeholder="tag1, tag2, tag3">
          </div>
          <div>
            <label class="field-label">Excerpt</label>
            <textarea class="field-textarea" id="ed-excerpt"
              placeholder="Short description (used for cards and SEO)…">${this._esc(post?.excerpt || '')}</textarea>
            <div class="char-count" id="excerpt-count">0 / 160</div>
          </div>
          <div>
            <label class="field-label">Featured</label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:#888;">
              <input type="checkbox" id="ed-featured" ${post?.isFeatured ? 'checked' : ''}
                style="width:16px;height:16px;cursor:pointer;">
              Mark as featured post
            </label>
          </div>
        </div>
      </div>`;
  }

  _panelFeaturedImage(post) {
    return `
      <div class="panel-section">
        <div class="panel-header" data-section="image">
          <div class="panel-header-title">🖼️ Featured Image</div>
          <div class="panel-chevron open" id="chevron-image">▼</div>
        </div>
        <div class="panel-body open" id="body-image">
          <div class="image-upload-area" id="image-upload-area">
            <input type="file" id="image-file-input" accept="image/*">
            <div class="upload-icon">📁</div>
            <div class="upload-text">Click to upload image</div>
          </div>
          ${post?.featuredImage ? `<img class="img-preview" id="img-preview" src="${post.featuredImage}" alt="Featured image">` : '<img class="img-preview" id="img-preview" style="display:none;" alt="">'}
          ${post?.featuredImage ? `<button class="row-btn danger" id="remove-img-btn" style="width:100%;justify-content:center;">Remove Image</button>` : ''}
        </div>
      </div>`;
  }

  _panelSEO(post) {
    return `
      <div class="panel-section">
        <div class="panel-header" data-section="seo">
          <div class="panel-header-title">🔍 SEO Analyzer</div>
          <div class="panel-chevron open" id="chevron-seo">▼</div>
        </div>
        <div class="panel-body open" id="body-seo">
          <!-- Score ring -->
          <div class="seo-score-ring">
            <div class="score-circle">
              <svg class="score-svg" width="70" height="70" viewBox="0 0 70 70">
                <circle class="score-bg" cx="35" cy="35" r="28"/>
                <circle class="score-arc" id="seo-arc" cx="35" cy="35" r="28"
                  stroke-dasharray="175.93" stroke-dashoffset="175.93" stroke="#64FFDA"/>
              </svg>
              <div class="score-text" id="seo-score-num" style="color:#64FFDA;">0</div>
            </div>
            <div class="score-label">
              <strong id="seo-score-label">Not analyzed</strong>
              <span id="seo-score-desc">Start writing to see your SEO score</span>
            </div>
          </div>

          <!-- Focus keyword -->
          <div>
            <label class="field-label">Focus Keyword</label>
            <input class="field-input" id="ed-focus-kw" type="text"
              value="" placeholder="e.g. blog editor">
          </div>

          <!-- SEO Title -->
          <div>
            <label class="field-label">SEO Title</label>
            <input class="field-input" id="ed-seo-title" type="text"
              value="${this._esc(post?.seoTitle || '')}" placeholder="Leave blank to use post title">
            <div class="char-count" id="seo-title-count">0 / 60</div>
          </div>

          <!-- SEO Description -->
          <div>
            <label class="field-label">Meta Description</label>
            <textarea class="field-textarea" id="ed-seo-desc"
              placeholder="Compelling description for search engines…">${this._esc(post?.seoDescription || '')}</textarea>
            <div class="char-count" id="seo-desc-count">0 / 160</div>
          </div>

          <!-- SEO Keywords -->
          <div>
            <label class="field-label">Meta Keywords</label>
            <input class="field-input" id="ed-seo-keywords" type="text"
              value="${this._esc(post?.seoKeywords || '')}" placeholder="keyword1, keyword2">
          </div>

          <!-- Checks -->
          <div class="seo-checks" id="seo-checks">
            <div style="color:#444;font-size:12px;text-align:center;padding:12px;">Start writing to analyze…</div>
          </div>
        </div>
      </div>`;
  }

  _panelReadability() {
    return `
      <div class="panel-section">
        <div class="panel-header" data-section="readability">
          <div class="panel-header-title">📖 Readability</div>
          <div class="panel-chevron" id="chevron-readability">▼</div>
        </div>
        <div class="panel-body" id="body-readability">
          <div class="readability-score-row">
            <div class="readability-badge" id="r-badge" style="background:#1a1a1a;color:#555;border:1px solid #252525;">
              —
            </div>
            <div style="font-size:13px;color:#888;" id="r-grade">Not analyzed</div>
          </div>

          <div class="readability-checks" id="r-checks">
            <div class="r-bar-row">
              <div class="r-bar-label"><span>Flesch Reading Ease</span><span id="r-flesch-val">—</span></div>
              <div class="r-bar-bg"><div class="r-bar-fill" id="r-flesch-bar" style="width:0%;background:#64FFDA;"></div></div>
            </div>
            <div class="r-bar-row">
              <div class="r-bar-label"><span>Avg. Sentence Length</span><span id="r-sent-val">—</span></div>
              <div class="r-bar-bg"><div class="r-bar-fill" id="r-sent-bar" style="width:0%;background:#64FFDA;"></div></div>
            </div>
            <div class="r-bar-row">
              <div class="r-bar-label"><span>Passive Voice</span><span id="r-passive-val">—</span></div>
              <div class="r-bar-bg"><div class="r-bar-fill" id="r-passive-bar" style="width:0%;background:#64FFDA;"></div></div>
            </div>
            <div class="r-bar-row">
              <div class="r-bar-label"><span>Transition Words</span><span id="r-trans-val">—</span></div>
              <div class="r-bar-bg"><div class="r-bar-fill" id="r-trans-bar" style="width:0%;background:#64FFDA;"></div></div>
            </div>
            <div class="r-bar-row">
              <div class="r-bar-label"><span>Consecutive Sentences</span><span id="r-consec-val">—</span></div>
              <div class="r-bar-bg"><div class="r-bar-fill" id="r-consec-bar" style="width:0%;background:#64FFDA;"></div></div>
            </div>
          </div>

          <div class="seo-checks" id="r-issues" style="margin-top:10px;"></div>
        </div>
      </div>`;
  }

  // ─────────────────────────────────────────────────────────
  //  EDITOR EVENT BINDING
  // ─────────────────────────────────────────────────────────
  _bindEditorEvents() {
    const root = this.shadowRoot.getElementById('root');

    // Back button
    root.querySelector('#back-btn').addEventListener('click', () => {
      if (this._hasUnsavedChanges()) {
        if (!confirm('You have unsaved changes. Leave anyway?')) return;
      }
      clearTimeout(this._autoSaveTimer);
      this._view = 'list';
      this._editingPost = null;
      this._renderListView();
      this._loadPosts();
    });

    // Save buttons
    root.querySelector('#save-draft-btn').addEventListener('click', () => this._savePost('draft'));
    root.querySelector('#publish-btn').addEventListener('click', () => this._savePost('published'));

    // Panel collapsibles
    root.querySelectorAll('.panel-header').forEach(header => {
      header.addEventListener('click', () => {
        const section = header.dataset.section;
        const body = root.querySelector(`#body-${section}`);
        const chevron = root.querySelector(`#chevron-${section}`);
        if (body) body.classList.toggle('open');
        if (chevron) chevron.classList.toggle('open');
      });
    });

    // Title → slug auto-gen
    const titleInput = root.querySelector('#ed-title');
    const slugInput = root.querySelector('#ed-slug');
    const slugPreview = root.querySelector('#slug-preview');
    titleInput.addEventListener('input', () => {
      if (!this._editingPost?._id) {
        const slug = this._toSlug(titleInput.value);
        slugInput.value = slug;
        if (slugPreview) slugPreview.textContent = `/blog/${slug}`;
      }
      this._scheduleAutoSave();
    });
    slugInput.addEventListener('input', () => {
      if (slugPreview) slugPreview.textContent = `/blog/${slugInput.value}`;
      this._scheduleAutoSave();
    });

    // Excerpt char count
    const excerptTA = root.querySelector('#ed-excerpt');
    const excerptCount = root.querySelector('#excerpt-count');
    excerptTA.addEventListener('input', () => {
      const len = excerptTA.value.length;
      if (excerptCount) {
        excerptCount.textContent = `${len} / 160`;
        excerptCount.className = `char-count ${len > 160 ? 'over' : len > 130 ? 'warn' : ''}`;
      }
      this._scheduleAutoSave();
    });
    if (excerptTA.value) excerptTA.dispatchEvent(new Event('input'));

    // SEO title char count
    const seoTitleInput = root.querySelector('#ed-seo-title');
    const seoTitleCount = root.querySelector('#seo-title-count');
    seoTitleInput.addEventListener('input', () => {
      const len = seoTitleInput.value.length;
      if (seoTitleCount) {
        seoTitleCount.textContent = `${len} / 60`;
        seoTitleCount.className = `char-count ${len > 60 ? 'over' : len > 50 ? 'warn' : ''}`;
      }
      this._scheduleAnalysis();
      this._scheduleAutoSave();
    });
    if (seoTitleInput.value) seoTitleInput.dispatchEvent(new Event('input'));

    // SEO desc char count
    const seoDescTA = root.querySelector('#ed-seo-desc');
    const seoDescCount = root.querySelector('#seo-desc-count');
    seoDescTA.addEventListener('input', () => {
      const len = seoDescTA.value.length;
      if (seoDescCount) {
        seoDescCount.textContent = `${len} / 160`;
        seoDescCount.className = `char-count ${len > 160 ? 'over' : len > 140 ? 'warn' : ''}`;
      }
      this._scheduleAnalysis();
      this._scheduleAutoSave();
    });
    if (seoDescTA.value) seoDescTA.dispatchEvent(new Event('input'));

    // Focus keyword triggers re-analysis
    root.querySelector('#ed-focus-kw').addEventListener('input', () => this._scheduleAnalysis());

    // Other fields trigger autosave
    ['#ed-author', '#ed-category', '#ed-tags', '#ed-seo-keywords'].forEach(id => {
      root.querySelector(id)?.addEventListener('input', () => this._scheduleAutoSave());
    });
    root.querySelector('#ed-featured')?.addEventListener('change', () => this._scheduleAutoSave());

    // ── Rich toolbar ─────────────────────────────────────
    root.querySelectorAll('.tb-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => this._toolbarAction(btn.dataset.action));
    });

    root.querySelector('#heading-select').addEventListener('change', (e) => {
      if (e.target.value) {
        this._insertHeading(e.target.value);
        e.target.value = '';
      }
    });

    // ── Editor modes ──────────────────────────────────────
    const editor = root.querySelector('#md-editor');
    const preview = root.querySelector('#md-preview');
    const modeEdit = root.querySelector('#mode-edit');
    const modePreview = root.querySelector('#mode-preview');
    const modeSplit = root.querySelector('#mode-split');

    const setMode = (mode) => {
      [modeEdit, modePreview, modeSplit].forEach(b => b?.classList.remove('active'));
      if (mode === 'edit') {
        editor.classList.remove('hidden');
        preview.classList.remove('active');
        preview.style.flex = '';
        modeEdit.classList.add('active');
      } else if (mode === 'preview') {
        editor.classList.add('hidden');
        preview.classList.add('active');
        preview.style.flex = '1';
        this._updatePreview();
        modePreview.classList.add('active');
      } else {
        editor.classList.remove('hidden');
        preview.classList.add('active');
        editor.style.flex = '1';
        preview.style.flex = '1';
        this._updatePreview();
        modeSplit.classList.add('active');
      }
    };

    modeEdit.addEventListener('click', () => setMode('edit'));
    modePreview.addEventListener('click', () => setMode('preview'));
    modeSplit.addEventListener('click', () => setMode('split'));

    // ── Main editor input ──────────────────────────────────
    editor.addEventListener('input', () => {
      this._scheduleAutoSave();
      this._scheduleAnalysis();
      const preview = root.querySelector('#md-preview');
      if (preview.classList.contains('active')) this._updatePreview();
    });

    // Tab key in editor
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this._insertAtCursor(editor, '  ');
      }
      // Ctrl+B / I shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b') { e.preventDefault(); this._toolbarAction('bold'); }
        if (e.key === 'i') { e.preventDefault(); this._toolbarAction('italic'); }
        if (e.key === 'k') { e.preventDefault(); this._toolbarAction('link'); }
      }
    });

    // ── Image upload ──────────────────────────────────────
    const uploadArea = root.querySelector('#image-upload-area');
    const fileInput = root.querySelector('#image-file-input');
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = '#64FFDA'; });
    uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = ''; });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file) this._handleImageUpload(file);
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) this._handleImageUpload(fileInput.files[0]);
    });

    root.querySelector('#remove-img-btn')?.addEventListener('click', () => {
      const preview = root.querySelector('#img-preview');
      if (preview) preview.style.display = 'none';
      if (this._editingPost) this._editingPost.featuredImage = null;
    });
  }

  // ─────────────────────────────────────────────────────────
  //  TOOLBAR ACTIONS
  // ─────────────────────────────────────────────────────────
  _toolbarAction(action) {
    const editor = this.shadowRoot.querySelector('#md-editor');
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.substring(start, end);

    const wrap = (before, after = before) => {
      const text = selected || 'text';
      this._replaceSelection(editor, start, end, `${before}${text}${after}`);
      if (!selected) {
        editor.setSelectionRange(start + before.length, start + before.length + 4);
      }
    };

    const insertBlock = (text) => {
      const prefix = start > 0 && editor.value[start - 1] !== '\n' ? '\n\n' : '';
      const suffix = '\n\n';
      this._replaceSelection(editor, start, end, `${prefix}${text}${suffix}`);
    };

    switch (action) {
      case 'bold': wrap('**'); break;
      case 'italic': wrap('*'); break;
      case 'strikethrough': wrap('~~'); break;
      case 'inline-code': wrap('`'); break;
      case 'blockquote': insertBlock(`> ${selected || 'Blockquote text'}`); break;
      case 'ul': insertBlock(`- ${selected || 'List item'}\n- Item 2\n- Item 3`); break;
      case 'ol': insertBlock(`1. ${selected || 'First item'}\n2. Second item\n3. Third item`); break;
      case 'checklist': insertBlock(`- [ ] ${selected || 'Task one'}\n- [ ] Task two\n- [x] Completed task`); break;
      case 'code-block': insertBlock(`\`\`\`javascript\n${selected || '// Your code here'}\n\`\`\``); break;
      case 'hr': insertBlock('---'); break;
      case 'table':
        insertBlock(`| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |`);
        break;
      case 'link': {
        const url = prompt('Enter URL:', 'https://');
        if (url) {
          const linkText = selected || 'Link text';
          this._replaceSelection(editor, start, end, `[${linkText}](${url})`);
        }
        break;
      }
      case 'image-url': {
        const url = prompt('Enter image URL:', 'https://');
        if (url) {
          const alt = selected || 'Image description';
          insertBlock(`![${alt}](${url})`);
        }
        break;
      }
      default: break;
    }

    editor.focus();
    editor.dispatchEvent(new Event('input'));
  }

  _insertHeading(level) {
    const editor = this.shadowRoot.querySelector('#md-editor');
    if (!editor) return;
    const prefix = '#'.repeat(parseInt(level[1], 10));
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.substring(start, end) || 'Heading';
    const prefix2 = start > 0 && editor.value[start - 1] !== '\n' ? '\n\n' : '';
    this._replaceSelection(editor, start, end, `${prefix2}${prefix} ${selected}\n\n`);
    editor.focus();
    editor.dispatchEvent(new Event('input'));
  }

  _replaceSelection(editor, start, end, replacement) {
    const before = editor.value.substring(0, start);
    const after = editor.value.substring(end);
    editor.value = before + replacement + after;
    editor.setSelectionRange(start + replacement.length, start + replacement.length);
  }

  _insertAtCursor(editor, text) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    this._replaceSelection(editor, start, end, text);
  }

  // ─────────────────────────────────────────────────────────
  //  LIVE PREVIEW
  // ─────────────────────────────────────────────────────────
  _updatePreview() {
    const editor = this.shadowRoot.querySelector('#md-editor');
    const preview = this.shadowRoot.querySelector('#md-preview');
    if (!editor || !preview) return;
    preview.innerHTML = this._mdToHtml(editor.value);
  }

  _mdToHtml(md) {
    if (!md) return '';
    let html = md;
    html = this._parseMdTables(html);
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
    html = html.replace(/^######\s+(.+)$/gim, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gim, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gim, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gim, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gim, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gim, '<h1>$1</h1>');
    html = html.replace(/^---+$/gim, '<hr>');
    html = html.replace(/^>\s+(.+)$/gim, '<blockquote>$1</blockquote>');
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1">');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/\*\*\*(.+?)\*\*\*/gim, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/gim, '<em>$1</em>');
    html = html.replace(/~~(.+?)~~/gim, '<del>$1</del>');
    html = html.replace(/^- \[x\] (.+)$/gim, '<li style="list-style:none">☑ $1</li>');
    html = html.replace(/^- \[ \] (.+)$/gim, '<li style="list-style:none">☐ $1</li>');
    html = html.replace(/((?:^- .+\n?)+)/gim, m => `<ul>${m.replace(/^- (.+)$/gim, '<li>$1</li>')}</ul>`);
    html = html.replace(/((?:^\d+\. .+\n?)+)/gim, m => `<ol>${m.replace(/^\d+\. (.+)$/gim, '<li>$1</li>')}</ol>`);
    html = html.replace(/\n{2,}/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = `<p>${html}</p>`;
    html = html.replace(/<p>\s*(<(?:h[1-6]|ul|ol|pre|blockquote|hr|table)[^>]*>)/gi, '$1');
    html = html.replace(/(<\/(?:h[1-6]|ul|ol|pre|blockquote|hr|table)>)\s*<\/p>/gi, '$1');
    html = html.replace(/<p>\s*<\/p>/g, '');
    return html;
  }

  _parseMdTables(md) {
    const lines = md.split('\n');
    const out = [];
    let inTable = false;
    let rows = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isRow = line.startsWith('|') && line.endsWith('|');
      const isSep = /^\|[\s|:-]+\|$/.test(line);
      if (isRow && !isSep) {
        const cells = line.slice(1, -1).split('|').map(c => c.trim());
        if (!inTable) {
          inTable = true;
          rows = [`<thead><tr>${cells.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`];
        } else {
          rows.push(`<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`);
        }
      } else if (isSep) {
        // skip
      } else {
        if (inTable) { rows.push('</tbody>'); out.push(`<table>${rows.join('')}</table>`); rows = []; inTable = false; }
        out.push(lines[i]);
      }
    }
    if (inTable) { rows.push('</tbody>'); out.push(`<table>${rows.join('')}</table>`); }
    return out.join('\n');
  }

  // ─────────────────────────────────────────────────────────
  //  AUTO SAVE
  // ─────────────────────────────────────────────────────────
  _scheduleAutoSave() {
    clearTimeout(this._autoSaveTimer);
    const statusEl = this.shadowRoot.querySelector('#autosave-status');
    if (statusEl) { statusEl.textContent = '● Unsaved changes…'; statusEl.className = 'autosave-status saving'; }
    this._autoSaveTimer = setTimeout(() => this._savePost('auto'), this._autoSaveDelay);
  }

  _hasUnsavedChanges() {
    const editor = this.shadowRoot.querySelector('#md-editor');
    if (!editor) return false;
    return editor.value !== this._lastSavedContent;
  }

  // ─────────────────────────────────────────────────────────
  //  SAVE POST
  // ─────────────────────────────────────────────────────────
  _savePost(statusOrMode) {
    if (this._isSaving && statusOrMode !== 'auto') return;
    const root = this.shadowRoot.getElementById('root');
    if (!root) return;

    const isAuto = statusOrMode === 'auto';
    const status = isAuto
      ? (this._editingPost?.status || 'draft')
      : statusOrMode;

    const data = {
      title: root.querySelector('#ed-title')?.value?.trim() || 'Untitled',
      slug: root.querySelector('#ed-slug')?.value?.trim() || '',
      content: root.querySelector('#md-editor')?.value || '',
      author: root.querySelector('#ed-author')?.value?.trim() || '',
      category: root.querySelector('#ed-category')?.value?.trim() || '',
      tags: root.querySelector('#ed-tags')?.value?.trim() || '',
      excerpt: root.querySelector('#ed-excerpt')?.value?.trim() || '',
      isFeatured: root.querySelector('#ed-featured')?.checked || false,
      seoTitle: root.querySelector('#ed-seo-title')?.value?.trim() || '',
      seoDescription: root.querySelector('#ed-seo-desc')?.value?.trim() || '',
      seoKeywords: root.querySelector('#ed-seo-keywords')?.value?.trim() || '',
      status,
      featuredImage: this._editingPost?.featuredImage || null
    };

    if (!data.slug && data.title) {
      data.slug = this._toSlug(data.title);
    }

    this._lastSavedContent = data.content;

    if (!isAuto) this._isSaving = true;

    this._dispatch('save-post', {
      postData: data,
      existingId: this._editingPost?._id || null,
      isAuto
    });
  }

  _onSaveResult(data) {
    this._isSaving = false;
    const statusEl = this.shadowRoot.querySelector('#autosave-status');

    if (data.success) {
      // Update local editing post with returned ID/slug
      if (data.post) {
        if (!this._editingPost) this._editingPost = {};
        this._editingPost._id = data.post._id || this._editingPost._id;
        this._editingPost.slug = data.post.slug || this._editingPost.slug;
        if (!data.isAuto) this._editingPost.status = data.post.status || this._editingPost.status;
      }

      if (statusEl) {
        statusEl.textContent = `● Saved at ${new Date().toLocaleTimeString()}`;
        statusEl.className = 'autosave-status saved';
      }

      if (!data.isAuto) {
        this._showToast('success', data.post?.status === 'published'
          ? '🚀 Post published!'
          : '✅ Draft saved!');
      }
    } else {
      if (statusEl) {
        statusEl.textContent = '● Save failed';
        statusEl.className = 'autosave-status';
      }
      if (!data.isAuto) {
        this._showToast('error', `Save failed: ${data.error || 'Unknown error'}`);
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  //  IMAGE UPLOAD
  // ─────────────────────────────────────────────────────────
  _handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      const preview = this.shadowRoot.querySelector('#img-preview');
      if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
      this._dispatch('upload-image', {
        data: base64,
        filename: file.name,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  }

  _onUploadResult(data) {
    if (data.success && data.url) {
      if (!this._editingPost) this._editingPost = {};
      this._editingPost.featuredImage = data.url;
      const preview = this.shadowRoot.querySelector('#img-preview');
      if (preview) { preview.src = data.url; preview.style.display = 'block'; }
      this._showToast('success', 'Image uploaded!');
      this._scheduleAutoSave();
    } else {
      this._showToast('error', `Upload failed: ${data.error || 'Unknown error'}`);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  SEO + READABILITY ANALYSIS
  // ─────────────────────────────────────────────────────────
  _scheduleAnalysis() {
    clearTimeout(this._analysisTimer);
    this._analysisTimer = setTimeout(() => this._runAnalysis(), 800);
  }

  _runAnalysis() {
    const root = this.shadowRoot.getElementById('root');
    if (!root || this._view !== 'editor') return;

    const content = root.querySelector('#md-editor')?.value || '';
    const title = root.querySelector('#ed-title')?.value || '';
    const seoTitle = root.querySelector('#ed-seo-title')?.value || title;
    const seoDesc = root.querySelector('#ed-seo-desc')?.value || '';
    const focusKw = root.querySelector('#ed-focus-kw')?.value?.toLowerCase().trim() || '';

    this._analyzeSEO({ content, title, seoTitle, seoDesc, focusKw });
    this._analyzeReadability(content);
  }

  _plainText(md) {
    return md
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/[*_~]+/g, '')
      .replace(/^[-*+]\s/gm, '')
      .replace(/^\d+\.\s/gm, '')
      .replace(/^>\s/gm, '')
      .replace(/---+/g, '')
      .replace(/\|.*?\|/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  _countWords(text) {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  _getSentences(text) {
    return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 3);
  }

  // ── SEO ANALYSIS ──────────────────────────────────────────
  _analyzeSEO({ content, title, seoTitle, seoDesc, focusKw }) {
    const plain = this._plainText(content);
    const words = this._countWords(plain);
    const kw = focusKw;
    const kwRe = kw ? new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi') : null;

    const checks = [];

    // 1. Word count
    const wcOk = words >= 300;
    const wcGood = words >= 600;
    checks.push({
      status: wcGood ? 'pass' : wcOk ? 'warn' : 'fail',
      title: 'Content length',
      desc: `${words} words — ${wcGood ? 'Great!' : wcOk ? 'Aim for 600+' : 'Too short, aim for 300+ words'}`
    });

    // 2. SEO Title length
    const titleLen = seoTitle.length;
    const titleOk = titleLen >= 30 && titleLen <= 60;
    checks.push({
      status: titleOk ? 'pass' : 'warn',
      title: 'SEO title length',
      desc: `${titleLen} chars — ${titleOk ? 'Perfect range (30–60)' : titleLen < 30 ? 'Too short, aim for 30+ chars' : 'Too long, keep under 60'}`
    });

    // 3. Meta description
    const descLen = seoDesc.length;
    const descOk = descLen >= 120 && descLen <= 160;
    checks.push({
      status: descLen === 0 ? 'fail' : descOk ? 'pass' : 'warn',
      title: 'Meta description',
      desc: descLen === 0
        ? 'Missing — add a meta description'
        : `${descLen} chars — ${descOk ? 'Good length' : descLen < 120 ? 'Too short (aim 120–160)' : 'Too long (max 160)'}`
    });

    // 4. Focus keyword presence
    if (kw) {
      const inTitle = kw && title.toLowerCase().includes(kw);
      const inSeoTitle = kw && seoTitle.toLowerCase().includes(kw);
      const inDesc = kw && seoDesc.toLowerCase().includes(kw);
      const inContent = kw && kwRe ? (plain.match(kwRe) || []).length : 0;
      const density = words > 0 ? ((inContent / words) * 100).toFixed(1) : 0;
      const densityOk = density >= 0.5 && density <= 2.5;

      checks.push({
        status: inTitle ? 'pass' : 'fail',
        title: 'Keyword in title',
        desc: inTitle ? `"${kw}" found in post title` : `"${kw}" not found in title`
      });
      checks.push({
        status: inDesc ? 'pass' : 'warn',
        title: 'Keyword in meta description',
        desc: inDesc ? 'Focus keyword in description ✓' : 'Add keyword to meta description'
      });
      checks.push({
        status: densityOk ? 'pass' : parseFloat(density) > 2.5 ? 'warn' : 'fail',
        title: 'Keyword density',
        desc: `${density}% — ${densityOk ? 'Optimal (0.5–2.5%)' : parseFloat(density) > 2.5 ? 'Over-optimized, reduce usage' : 'Too low, use keyword more'}`
      });
      checks.push({
        status: inSeoTitle ? 'pass' : 'warn',
        title: 'Keyword in SEO title',
        desc: inSeoTitle ? 'Keyword in SEO title ✓' : 'Consider adding keyword to SEO title'
      });
    } else {
      checks.push({ status: 'warn', title: 'Focus keyword', desc: 'Set a focus keyword for detailed analysis' });
    }

    // 5. Headings in content
    const h2count = (content.match(/^##\s/gm) || []).length;
    const hasHeadings = h2count > 0;
    checks.push({
      status: hasHeadings ? 'pass' : 'warn',
      title: 'Subheadings (H2)',
      desc: hasHeadings ? `${h2count} H2 heading${h2count > 1 ? 's' : ''} found` : 'No H2 subheadings — structure your content'
    });

    // 6. Internal/external links
    const linkCount = (content.match(/\[.+?\]\(.+?\)/g) || []).length;
    checks.push({
      status: linkCount > 0 ? 'pass' : 'warn',
      title: 'Links',
      desc: linkCount > 0 ? `${linkCount} link${linkCount > 1 ? 's' : ''} found` : 'No links detected — add internal or external links'
    });

    // 7. Images with alt text
    const imgTotal = (content.match(/!\[.*?\]\(.+?\)/g) || []).length;
    const imgWithAlt = (content.match(/!\[.+?\]\(.+?\)/g) || []).length;
    checks.push({
      status: imgTotal === 0 ? 'warn' : imgWithAlt === imgTotal ? 'pass' : 'warn',
      title: 'Images & alt text',
      desc: imgTotal === 0
        ? 'No images — consider adding visuals'
        : imgWithAlt === imgTotal
          ? `${imgTotal} image${imgTotal > 1 ? 's' : ''} with alt text ✓`
          : `${imgTotal - imgWithAlt} image(s) missing alt text`
    });

    // Calculate score
    const scoreMap = { pass: 10, warn: 5, fail: 0 };
    const total = checks.reduce((a, c) => a + scoreMap[c.status], 0);
    const maxScore = checks.length * 10;
    const score = Math.round((total / maxScore) * 100);

    this._renderSEOScore(score, checks);
  }

  _renderSEOScore(score, checks) {
    const root = this.shadowRoot.getElementById('root');
    if (!root) return;

    const arc = root.querySelector('#seo-arc');
    const numEl = root.querySelector('#seo-score-num');
    const labelEl = root.querySelector('#seo-score-label');
    const descEl = root.querySelector('#seo-score-desc');
    const checksEl = root.querySelector('#seo-checks');

    const circumference = 175.93;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f87171';
    const label = score >= 70 ? 'Good' : score >= 40 ? 'Needs work' : 'Poor';
    const desc = score >= 70
      ? 'Your SEO looks solid!'
      : score >= 40
        ? 'Some improvements needed'
        : 'Multiple SEO issues found';

    if (arc) { arc.style.strokeDashoffset = offset; arc.style.stroke = color; }
    if (numEl) { numEl.textContent = score; numEl.style.color = color; }
    if (labelEl) { labelEl.textContent = label; labelEl.style.color = color; }
    if (descEl) descEl.textContent = desc;

    if (checksEl) {
      const iconMap = { pass: '✅', warn: '⚠️', fail: '❌' };
      checksEl.innerHTML = checks.map(c => `
        <div class="seo-check ${c.status}">
          <span class="check-icon">${iconMap[c.status]}</span>
          <div class="check-text"><strong>${c.title}</strong>${c.desc}</div>
        </div>`).join('');
    }
  }

  // ── READABILITY ANALYSIS ───────────────────────────────────
  _analyzeReadability(content) {
    const root = this.shadowRoot.getElementById('root');
    if (!root) return;

    const plain = this._plainText(content);
    if (!plain || plain.split(/\s+/).length < 20) {
      root.querySelector('#r-badge').textContent = '—';
      root.querySelector('#r-grade').textContent = 'Not enough content';
      return;
    }

    const words = plain.split(/\s+/).filter(w => w.length > 0);
    const sentences = this._getSentences(plain);
    const wordCount = words.length;
    const sentenceCount = Math.max(1, sentences.length);

    // ── Avg sentence length ───────────────────────────────
    const avgSentLen = wordCount / sentenceCount;
    const sentLenOk = avgSentLen <= 20;
    const sentLenPct = Math.min(100, (avgSentLen / 30) * 100);

    // ── Syllables (approx) & Flesch ──────────────────────
    const syllableCount = words.reduce((acc, w) => acc + this._countSyllables(w), 0);
    const avgSyl = syllableCount / Math.max(1, wordCount);
    const flesch = Math.max(0, Math.min(100,
      206.835 - 1.015 * avgSentLen - 84.6 * avgSyl
    ));
    const fleschPct = flesch;

    // ── Passive voice ─────────────────────────────────────
    const passiveRe = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi;
    const passiveMatches = (plain.match(passiveRe) || []).length;
    const passivePct = Math.min(100, (passiveMatches / sentenceCount) * 100);
    const passiveOk = passivePct <= 10;

    // ── Transition words ──────────────────────────────────
    const transitions = ['however','therefore','furthermore','moreover','consequently',
      'nevertheless','additionally','meanwhile','subsequently','otherwise','instead',
      'similarly','in addition','as a result','for example','in contrast','on the other hand',
      'first','second','third','finally','also','but','yet','so','because','since','although'];
    const plainLower = plain.toLowerCase();
    const transCount = transitions.filter(t => plainLower.includes(t)).length;
    const transPct = Math.min(100, (transCount / Math.max(1, sentenceCount)) * 100 * 3);
    const transOk = transPct >= 30;

    // ── Consecutive sentences starting same word ──────────
    let consecCount = 0;
    for (let i = 1; i < sentences.length; i++) {
      const prevWord = sentences[i - 1].trim().split(/\s+/)[0]?.toLowerCase();
      const currWord = sentences[i].trim().split(/\s+/)[0]?.toLowerCase();
      if (prevWord && currWord && prevWord === currWord) consecCount++;
    }
    const consecPct = Math.min(100, (consecCount / Math.max(1, sentenceCount)) * 100);
    const consecOk = consecPct <= 10;

    // ── Overall score ─────────────────────────────────────
    let score = 0;
    if (flesch >= 60) score += 30;
    else if (flesch >= 40) score += 15;
    if (sentLenOk) score += 20;
    if (passiveOk) score += 20;
    if (transOk) score += 20;
    if (consecOk) score += 10;

    const gradeLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
    const gradeColor = score >= 80 ? '#34d399' : score >= 60 ? '#60a5fa' : score >= 40 ? '#fbbf24' : '#f87171';

    const badge = root.querySelector('#r-badge');
    const gradeEl = root.querySelector('#r-grade');
    if (badge) { badge.textContent = gradeLabel; badge.style.background = `${gradeColor}18`; badge.style.color = gradeColor; badge.style.border = `1px solid ${gradeColor}30`; }
    if (gradeEl) gradeEl.textContent = `Readability Score: ${score}/100`;

    // Update bars
    const barColor = (pct, goodHigh) => pct >= 70 === goodHigh ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171';

    this._setBar(root, 'r-flesch', Math.round(flesch), `${Math.round(flesch)}/100`, fleschPct, barColor(flesch, true));
    this._setBar(root, 'r-sent', `${avgSentLen.toFixed(1)} words`, avgSentLen.toFixed(1), Math.min(100, sentLenPct), sentLenOk ? '#34d399' : '#f87171');
    this._setBar(root, 'r-passive', `${passivePct.toFixed(0)}%`, passivePct.toFixed(0), passivePct, passiveOk ? '#34d399' : '#f87171');
    this._setBar(root, 'r-trans', `${transCount} found`, transCount, transPct, transOk ? '#34d399' : '#fbbf24');
    this._setBar(root, 'r-consec', consecOk ? 'OK' : `${consecCount} issues`, consecCount, consecPct, consecOk ? '#34d399' : '#fbbf24');

    // Issues list
    const issues = [];
    if (flesch < 60) issues.push({ status: flesch >= 40 ? 'warn' : 'fail', title: 'Readability score', desc: `Flesch score ${Math.round(flesch)} — use shorter words and sentences` });
    if (!sentLenOk) issues.push({ status: 'warn', title: 'Long sentences', desc: `Avg ${avgSentLen.toFixed(1)} words/sentence — aim for 20 or less` });
    if (!passiveOk) issues.push({ status: 'warn', title: 'Passive voice', desc: `${passiveMatches} passive sentence${passiveMatches > 1 ? 's' : ''} — use active voice` });
    if (!transOk) issues.push({ status: 'warn', title: 'Transition words', desc: 'Use more transitions (however, therefore, etc.)' });
    if (!consecOk) issues.push({ status: 'warn', title: 'Consecutive sentences', desc: `${consecCount} sentence${consecCount > 1 ? 's' : ''} start with the same word` });

    const issuesEl = root.querySelector('#r-issues');
    if (issuesEl) {
      const iconMap = { pass: '✅', warn: '⚠️', fail: '❌' };
      issuesEl.innerHTML = issues.length
        ? issues.map(c => `<div class="seo-check ${c.status}"><span class="check-icon">${iconMap[c.status]}</span><div class="check-text"><strong>${c.title}</strong>${c.desc}</div></div>`).join('')
        : `<div class="seo-check pass"><span class="check-icon">✅</span><div class="check-text"><strong>Readability looks great!</strong>Your content is clear and well-structured.</div></div>`;
    }
  }

  _setBar(root, id, valText, rawVal, pct, color) {
    const valEl = root.querySelector(`#${id}-val`);
    const barEl = root.querySelector(`#${id}-bar`);
    if (valEl) valEl.textContent = valText;
    if (barEl) { barEl.style.width = `${Math.max(0, Math.min(100, pct))}%`; barEl.style.background = color; }
  }

  _countSyllables(word) {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    const vowelGroups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
    return vowelGroups ? vowelGroups.length : 1;
  }

  // ─────────────────────────────────────────────────────────
  //  UTILITIES
  // ─────────────────────────────────────────────────────────
  _toSlug(str) {
    return str.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }

  _showToast(type, message) {
    const toast = this.shadowRoot.getElementById('toast');
    if (!toast) return;
    toast.className = `toast toast-${type} show`;
    toast.textContent = message;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
  }
}

customElements.define('blog-dashboard', BlogDashboard);
