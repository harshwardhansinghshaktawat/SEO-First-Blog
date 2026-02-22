// ============================================================
// MDX BLOG EDITOR — Custom Element v4 (complete rewrite)
// <mdx-blog-editor> Web Component
//
// VIEW 1 → Posts List (shows all CMS posts, edit/delete)
// VIEW 2 → Editor (create new or edit existing post)
// ============================================================

class MdxBlogEditor extends HTMLElement {

    // ─────────────────────────────────────────────────────────
    constructor() {
        super();
        this._root = this.attachShadow({ mode: 'open' });

        /* ── view state ── */
        this._currentView = 'list';   // 'list' | 'editor'
        this._posts       = [];
        this._editPost    = null;     // null = new post

        /* ── editor state ── */
        this._blocks   = [];
        this._blockCtr = 0;
        this._uploads  = {};          // blockId → block
        this._dragIdx  = null;
        this._tab      = 'editor';
        this._meta     = this._freshMeta();

        this._inject();
        this._wire();
    }

    _freshMeta() {
        return {
            title:'', slug:'', excerpt:'', author:'', authorImage:'',
            category:'', tags:'', status:'draft',
            publishedDate:'', modifiedDate:'',
            readTime:0, viewCount:0,
            isFeatured:false, featuredImage:'',
            seoTitle:'', seoDescription:'', seoOgImage:'', seoKeywords:''
        };
    }

    // ─────────────────────────────────────────────────────────
    static get observedAttributes() {
        return ['post-list','upload-result','save-result','delete-result','notification','load-data'];
    }

    attributeChangedCallback(name, _, val) {
        if (!val) return;
        try {
            const d = JSON.parse(val);
            if (name === 'post-list')     this._onPostList(d);
            if (name === 'upload-result') this._onUploadResult(d);
            if (name === 'save-result')   this._onSaveResult(d);
            if (name === 'delete-result') this._onDeleteResult(d);
            if (name === 'notification')  this._toast(d.type, d.message);
            if (name === 'load-data')     this._populateEditor(d);
        } catch(e) { console.error('[MdxEditor]', e); }
    }

    connectedCallback() {
        // Ask widget to fetch all posts
        this._emit('load-post-list', {});
    }

    // ═════════════════════════════════════════════════════════
    // ICONS
    // ═════════════════════════════════════════════════════════
    _icon(k) {
        const I = {
            h1:   `<svg viewBox="0 0 24 24"><text x="1" y="17" font-size="11" font-weight="900" font-family="Georgia,serif" fill="currentColor">H1</text></svg>`,
            h2:   `<svg viewBox="0 0 24 24"><text x="1" y="17" font-size="11" font-weight="900" font-family="Georgia,serif" fill="currentColor">H2</text></svg>`,
            h3:   `<svg viewBox="0 0 24 24"><text x="1" y="17" font-size="11" font-weight="900" font-family="Georgia,serif" fill="currentColor">H3</text></svg>`,
            h4:   `<svg viewBox="0 0 24 24"><text x="1" y="17" font-size="11" font-weight="900" font-family="Georgia,serif" fill="currentColor">H4</text></svg>`,
            h5:   `<svg viewBox="0 0 24 24"><text x="1" y="17" font-size="10" font-weight="900" font-family="Georgia,serif" fill="currentColor">H5</text></svg>`,
            h6:   `<svg viewBox="0 0 24 24"><text x="1" y="17" font-size="10" font-weight="900" font-family="Georgia,serif" fill="currentColor">H6</text></svg>`,
            para: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 4H7a4 4 0 0 0 0 8h3v8h3V4z"/><line x1="17" y1="4" x2="17" y2="20"/></svg>`,
            quote:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>`,
            nquote:`<svg viewBox="0 0 24 24" fill="currentColor"><path opacity=".3" d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>`,
            ul:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>`,
            ol:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="1" y="8" font-size="5" fill="currentColor" stroke="none">1.</text><text x="1" y="14" font-size="5" fill="currentColor" stroke="none">2.</text><text x="1" y="20" font-size="5" fill="currentColor" stroke="none">3.</text></svg>`,
            tasklist:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="5" height="5" rx="1"/><polyline points="4.5 7.5 5.5 8.5 7.5 6.5" stroke-width="1.5"/><line x1="11" y1="7" x2="21" y2="7"/><rect x="3" y="14" width="5" height="5" rx="1"/><line x1="11" y1="16" x2="21" y2="16"/></svg>`,
            code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
            icode:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="10" rx="2"/><line x1="7" y1="12" x2="17" y2="12" stroke-dasharray="2 1.5"/></svg>`,
            link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
            image:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
            table:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
            hr:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="12" x2="22" y2="12"/><circle cx="7" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="17" cy="12" r="2" fill="currentColor" stroke="none"/></svg>`,
            escape:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 4H4v16h5"/><polyline points="8 8 4 12 8 16"/></svg>`,
            drag: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>`,
            trash:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
            edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
            plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
            save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
            eye:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
            gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
            seo:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M11 8v3l2 2" stroke-linecap="round"/></svg>`,
            back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`,
            check:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
            up:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>`,
            bolt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
            copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
        };
        return I[k] || I.para;
    }

    // ═════════════════════════════════════════════════════════
    // INJECT HTML + CSS INTO SHADOW ROOT
    // ═════════════════════════════════════════════════════════
    _inject() {
        const style = document.createElement('style');
        style.textContent = this._styles();

        const host = document.createElement('div');
        host.id = 'host';
        host.innerHTML = this._shellHTML();

        this._root.appendChild(style);
        this._root.appendChild(host);
    }

    // ─────────────────────────────────────────────────────────
    // STYLES
    // ─────────────────────────────────────────────────────────
    _styles() { return `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 720px;
    font-family: 'DM Sans', sans-serif;
    --ink: #111;
    --ink2: #444;
    --ink3: #888;
    --paper: #fafaf8;
    --paper2: #f2f1ee;
    --paper3: #e8e6e1;
    --border: #ddd9d2;
    --accent: #d4380d;
    --accent2: #fa8c16;
    --green: #389e0d;
    --blue: #1677ff;
    --r: 8px;
    --shadow-sm: 0 2px 8px rgba(0,0,0,.08);
    --shadow: 0 8px 32px rgba(0,0,0,.14);
    background: var(--paper);
    color: var(--ink);
}

/* ═══ SHELL ═══════════════════════════════════════════════ */
#host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 720px;
    background: var(--paper);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--shadow);
}

/* ─── Top bar ─── */
.top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 52px;
    padding: 0 20px;
    background: var(--ink);
    color: #fff;
    flex-shrink: 0;
    gap: 10px;
}
.brand {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 900;
    letter-spacing: -.5px;
    white-space: nowrap;
}
.brand span { color: var(--accent2); }
.top-acts { display: flex; gap: 8px; align-items: center; }

/* ─── Buttons ─── */
.btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 15px;
    border: none;
    border-radius: var(--r);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background .15s, opacity .15s;
    white-space: nowrap;
}
.btn svg { width: 14px; height: 14px; flex-shrink: 0; }
.btn-ghost  { background: rgba(255,255,255,.12); color: #fff; border: 1px solid rgba(255,255,255,.2); }
.btn-ghost:hover  { background: rgba(255,255,255,.22); }
.btn-accent { background: var(--accent); color: #fff; }
.btn-accent:hover { opacity: .88; }
.btn-green  { background: var(--green); color: #fff; }
.btn-green:hover  { opacity: .88; }
.btn-light  { background: var(--paper2); color: var(--ink2); border: 1px solid var(--border); }
.btn-light:hover  { background: var(--paper3); }
.btn-red    { background: #fff2f0; color: #a8071a; border: 1px solid #ffccc7; }
.btn-red:hover    { background: #ffccc7; }
.btn-sm { padding: 5px 10px; font-size: 12px; }

/* ═══ LIST VIEW ════════════════════════════════════════════ */
#listView {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}
#listView.hidden { display: none; }

.list-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 22px;
    border-bottom: 1px solid var(--border);
    background: var(--paper);
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: 10px;
}
.list-heading { font-size: 16px; font-weight: 700; }
.list-count { font-size: 13px; color: var(--ink3); margin-left: 6px; }

.list-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 22px;
    min-height: 0;
}
.list-scroll::-webkit-scrollbar { width: 5px; }
.list-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* Loading / empty */
.state-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    gap: 14px;
    color: var(--ink3);
    text-align: center;
}
.state-box svg { width: 44px; height: 44px; opacity: .35; }
.state-box p { font-size: 15px; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin-anim { animation: spin .7s linear infinite; }

/* Posts table */
.posts-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}
.posts-table th {
    text-align: left;
    padding: 9px 13px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .6px;
    color: var(--ink3);
    border-bottom: 2px solid var(--border);
    background: var(--paper2);
}
.posts-table td {
    padding: 11px 13px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
}
.posts-table tr:hover td { background: #fff9f7; }

.col-title { font-weight: 600; max-width: 300px; }
.post-title-txt {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.post-slug { font-size: 11px; color: var(--ink3); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }

.badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .4px;
}
.badge-pub   { background: #d1fae5; color: #065f46; }
.badge-draft { background: #fef3c7; color: #92400e; }

.row-actions { display: flex; gap: 6px; }

/* ═══ EDITOR VIEW ══════════════════════════════════════════ */
#editorView {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}
#editorView.hidden { display: none; }

/* ─── Tab bar ─── */
.tab-bar {
    display: flex;
    align-items: center;
    height: 45px;
    padding: 0 14px;
    background: var(--paper2);
    border-bottom: 2px solid var(--border);
    gap: 3px;
    flex-shrink: 0;
}
.tab {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 12px;
    border: none;
    border-radius: var(--r) var(--r) 0 0;
    background: transparent;
    color: var(--ink3);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all .15s;
}
.tab svg { width: 14px; height: 14px; }
.tab:hover { color: var(--ink); background: var(--paper3); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); background: var(--paper); font-weight: 600; }

/* ─── Toolbar (outside scroll, always visible when on editor tab) ─── */
.toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    padding: 5px 10px;
    gap: 1px;
    background: var(--paper);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(0,0,0,.05);
}
.toolbar.hidden { display: none; }

.sep { width: 1px; height: 22px; background: var(--border); margin: 0 3px; }

.tb {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--ink2);
    cursor: pointer;
    transition: all .12s;
    position: relative;
}
.tb svg { width: 15px; height: 15px; }
.tb:hover { background: var(--paper2); color: var(--ink); }
.tb:hover .tip { opacity: 1; }

.tip {
    position: absolute;
    bottom: calc(100% + 5px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--ink);
    color: #fff;
    font-size: 10px;
    padding: 3px 7px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity .15s;
    z-index: 200;
    font-family: 'DM Sans', sans-serif;
}

/* ─── Editor body (panels container) ─── */
.editor-body {
    display: flex;
    flex: 1;
    overflow: hidden;
    min-height: 0;
    position: relative;
}

/* ─── Blocks panel ─── */
.blocks-panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}
.blocks-panel.hidden { display: none; }
.blocks-panel::-webkit-scrollbar { width: 5px; }
.blocks-panel::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

.blocks-inner {
    max-width: 820px;
    width: 100%;
    margin: 0 auto;
    padding: 32px 44px 100px;
}

/* ─── Block wrapper ─── */
.bw {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 2px;
    position: relative;
}
.bw:hover .bc { opacity: 1; }

.bc {
    display: flex;
    flex-direction: column;
    gap: 2px;
    opacity: 0;
    transition: opacity .15s;
    padding-top: 5px;
    flex-shrink: 0;
    width: 22px;
}
.bc-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--ink3);
    cursor: pointer;
    transition: all .12s;
}
.bc-btn svg { width: 13px; height: 13px; }
.bc-btn:hover { background: var(--paper3); color: var(--accent); }
.bc-drag { cursor: grab; }
.bc-drag:active { cursor: grabbing; }

.bk { flex: 1; min-width: 0; }

/* ─── Contenteditable ─── */
.ce {
    width: 100%;
    min-height: 1.5em;
    outline: none;
    border: none;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    line-height: 1.75;
    color: var(--ink);
    padding: 3px 0;
    caret-color: var(--accent);
}
.ce:empty::before { content: attr(data-ph); color: var(--ink3); pointer-events: none; }

[data-bt="h1"] .ce { font-family: 'Playfair Display', serif; font-size: 34px; font-weight: 900; line-height: 1.2; }
[data-bt="h2"] .ce { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; line-height: 1.3; border-bottom: 2px solid var(--border); padding-bottom: 5px; }
[data-bt="h3"] .ce { font-size: 21px; font-weight: 700; line-height: 1.35; }
[data-bt="h4"] .ce { font-size: 17px; font-weight: 600; line-height: 1.4; }
[data-bt="h5"] .ce { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
[data-bt="h6"] .ce { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--ink3); }
[data-bt="quote"] .ce      { border-left: 4px solid var(--accent2); padding-left: 14px; color: var(--ink2); font-style: italic; }
[data-bt="nested-quote"] .ce { border-left: 4px solid var(--accent); margin-left: 22px; padding: 7px 7px 7px 14px; background: var(--paper2); border-radius: 0 var(--r) var(--r) 0; font-style: italic; color: var(--ink2); }
[data-bt="inline-code"] .ce { font-family: 'JetBrains Mono', monospace; font-size: 13px; background: var(--paper2); padding: 3px 10px; border-radius: 4px; border: 1px solid var(--border); color: var(--accent); display: inline-block; }
[data-bt="ul"] .ce, [data-bt="ol"] .ce { font-size: 16px; line-height: 1.7; white-space: pre-wrap; }

.list-hint { font-size: 11px; color: var(--ink3); margin-top: 2px; font-style: italic; }

/* Code block */
.code-wrap { background: #1e1e2e; border-radius: var(--r); overflow: hidden; margin: 3px 0; }
.code-hdr  { display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; background: #12121f; }
.lang-sel  { background: transparent; border: 1px solid rgba(255,255,255,.15); color: #a8b0c8; font-size: 12px; padding: 3px 8px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; cursor: pointer; }
.copy-btn  { display: flex; align-items: center; gap: 4px; background: transparent; border: none; color: #6e7b9b; font-size: 12px; cursor: pointer; padding: 3px 8px; border-radius: 4px; transition: all .12s; font-family: 'DM Sans', sans-serif; }
.copy-btn:hover { color: #fff; background: rgba(255,255,255,.1); }
.copy-btn svg { width: 12px; height: 12px; }
.code-area { font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.6; color: #cdd6f4; padding: 12px 16px; white-space: pre; overflow-x: auto; tab-size: 2; }

/* HR */
.hr-line { border: none; border-top: 2px solid var(--border); margin: 10px 0; }

/* Link */
.link-row { display: flex; gap: 8px; flex-wrap: wrap; }
.link-inp { flex: 1; min-width: 100px; padding: 8px 11px; border: 1px solid var(--border); border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 14px; background: transparent; color: var(--ink); outline: none; }
.link-inp:focus { border-color: var(--accent); }

/* Image block */
.img-drop {
    border: 2px dashed var(--border);
    border-radius: var(--r);
    padding: 28px;
    text-align: center;
    cursor: pointer;
    transition: all .2s;
    background: var(--paper2);
}
.img-drop:hover, .img-drop.over { border-color: var(--accent); background: #fff5f0; }
.img-drop svg { width: 34px; height: 34px; color: var(--ink3); margin-bottom: 7px; }
.img-drop p { font-size: 13px; color: var(--ink3); }
.img-opts { display: flex; gap: 10px; margin-top: 12px; justify-content: center; }
.img-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: var(--r); border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; }
.img-btn svg { width: 14px; height: 14px; }
.img-btn-up  { background: var(--blue);  color: #fff; }
.img-btn-up:hover  { opacity: .88; }
.img-btn-opt { background: var(--green); color: #fff; }
.img-btn-opt:hover { opacity: .88; }
.img-spinner { display: flex; align-items: center; gap: 8px; justify-content: center; padding: 22px; color: var(--ink3); font-size: 13px; }
.img-spinner svg { width: 20px; height: 20px; }
.img-preview-wrap img { max-width: 100%; border-radius: var(--r); display: block; }
.alt-inp { width: 100%; margin-top: 7px; padding: 7px 11px; border: 1px solid var(--border); border-radius: 5px; font-family: 'DM Sans', sans-serif; font-size: 13px; background: var(--paper2); color: var(--ink); outline: none; }
.alt-inp:focus { border-color: var(--accent); }

/* Table */
.tbl-wrap { overflow-x: auto; margin: 3px 0; }
.etbl { border-collapse: collapse; width: 100%; font-size: 14px; }
.etbl th, .etbl td { border: 1px solid var(--border); padding: 7px 11px; outline: none; min-width: 70px; font-family: 'DM Sans', sans-serif; }
.etbl th { background: var(--paper2); font-weight: 600; font-size: 13px; }
.etbl td:focus, .etbl th:focus { background: #fff9f5; outline: 2px solid var(--accent); outline-offset: -2px; }
.tbl-ctrl { display: flex; gap: 5px; margin-top: 6px; }
.tbl-btn { font-size: 11px; padding: 3px 9px; border: 1px solid var(--border); background: var(--paper2); border-radius: 4px; cursor: pointer; font-family: 'DM Sans', sans-serif; color: var(--ink2); transition: all .12s; }
.tbl-btn:hover { background: var(--paper3); }

/* Task list */
.task-list { list-style: none; }
.task-li { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.task-li input[type=checkbox] { accent-color: var(--accent); width: 15px; height: 15px; cursor: pointer; }
.task-txt { flex: 1; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 15px; outline: none; color: var(--ink); line-height: 1.5; }

/* Add block row */
.add-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; opacity: 0; transition: opacity .2s; }
.blocks-inner:hover .add-row { opacity: 1; }
.add-line { flex: 1; height: 1px; background: var(--border); }
.add-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 10px; border: 1px dashed var(--border); border-radius: 20px;
    background: var(--paper); color: var(--ink3); font-size: 12px;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .15s; white-space: nowrap;
}
.add-btn svg { width: 12px; height: 12px; }
.add-btn:hover { border-color: var(--accent); color: var(--accent); }

/* Block type popup */
.bm-popup {
    position: fixed;
    background: var(--paper);
    border: 1px solid var(--border);
    border-radius: var(--r);
    box-shadow: var(--shadow);
    padding: 7px;
    z-index: 500;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 3px;
    width: 272px;
}
.bm-popup.hidden { display: none; }
.bm-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 7px 4px;
    border: none;
    border-radius: 5px;
    background: transparent;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    color: var(--ink2);
    transition: all .12s;
}
.bm-item svg { width: 18px; height: 18px; }
.bm-item:hover { background: var(--paper2); color: var(--accent); }

/* Drag */
.bw.dragging { opacity: .35; }
.bw.drag-over { border-top: 2px solid var(--accent); padding-top: 2px; }

/* ─── Preview panel ─── */
.prev-panel { display: none; flex: 1; overflow-y: auto; min-height: 0; }
.prev-panel.active { display: block; }
.prev-inner { max-width: 820px; margin: 0 auto; padding: 32px 44px; font-size: 16px; line-height: 1.75; }
.prev-inner h1 { font-family: 'Playfair Display', serif; font-size: 34px; font-weight: 900; margin-bottom: 14px; }
.prev-inner h2 { font-family: 'Playfair Display', serif; font-size: 26px; margin: 22px 0 10px; border-bottom: 2px solid var(--border); padding-bottom: 5px; }
.prev-inner h3 { font-size: 21px; font-weight: 700; margin: 18px 0 8px; }
.prev-inner h4 { font-size: 17px; font-weight: 600; margin: 14px 0 7px; }
.prev-inner h5 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin: 12px 0 6px; }
.prev-inner h6 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--ink3); margin: 10px 0 5px; }
.prev-inner p { margin-bottom: 10px; }
.prev-inner blockquote { border-left: 4px solid var(--accent2); padding-left: 14px; color: var(--ink2); font-style: italic; margin: 10px 0; }
.prev-inner blockquote blockquote { border-left-color: var(--accent); margin-left: 16px; background: var(--paper2); padding: 7px 7px 7px 14px; border-radius: 0 var(--r) var(--r) 0; }
.prev-inner pre { background: #1e1e2e; border-radius: var(--r); padding: 14px; overflow-x: auto; margin: 10px 0; }
.prev-inner code { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #cdd6f4; }
.prev-inner p code { background: var(--paper2); padding: 2px 5px; border-radius: 3px; color: var(--accent); font-size: 12px; border: 1px solid var(--border); }
.prev-inner ul, .prev-inner ol { padding-left: 22px; margin-bottom: 10px; }
.prev-inner li { margin-bottom: 3px; }
.prev-inner hr { border: none; border-top: 2px solid var(--border); margin: 22px 0; }
.prev-inner img { max-width: 100%; border-radius: var(--r); margin: 7px 0; }
.prev-inner table { border-collapse: collapse; width: 100%; margin: 10px 0; }
.prev-inner th, .prev-inner td { border: 1px solid var(--border); padding: 7px 11px; }
.prev-inner th { background: var(--paper2); font-weight: 600; }
.prev-inner a { color: var(--blue); text-decoration: underline; }

/* ─── Markdown panel ─── */
.md-panel { display: none; flex: 1; min-height: 0; }
.md-panel.active { display: flex; flex-direction: column; }
.md-area { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.6; padding: 22px; border: none; outline: none; resize: none; background: #1e1e2e; color: #cdd6f4; }

/* ─── Meta / SEO panels ─── */
.meta-panel, .seo-panel { display: none; flex: 1; overflow-y: auto; min-height: 0; }
.meta-panel.active, .seo-panel.active { display: block; }
.meta-inner, .seo-inner { padding: 20px; }

.msec { background: var(--paper); border: 1px solid var(--border); border-radius: var(--r); margin-bottom: 14px; overflow: hidden; }
.msec-title { padding: 10px 14px; background: var(--paper2); border-bottom: 1px solid var(--border); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--ink3); }
.mfields { padding: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mfull { grid-column: 1 / -1; }
.mfield label { display: block; font-size: 11px; font-weight: 600; color: var(--ink3); margin-bottom: 4px; text-transform: uppercase; letter-spacing: .5px; }
.minp, .msel, .mtxt { width: 100%; padding: 8px 10px; border: 1.5px solid var(--border); border-radius: 5px; font-family: 'DM Sans', sans-serif; font-size: 14px; background: var(--paper); color: var(--ink); outline: none; transition: border-color .15s; }
.minp:focus, .msel:focus, .mtxt:focus { border-color: var(--accent); }
.mtxt { resize: vertical; min-height: 70px; }
.tog-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 14px; border-top: 1px solid var(--border); }
.tog-lbl { font-size: 14px; font-weight: 500; }
.tog { position: relative; width: 38px; height: 21px; }
.tog input { opacity: 0; width: 0; height: 0; }
.tog-slider { position: absolute; inset: 0; background: var(--paper3); border-radius: 21px; cursor: pointer; transition: background .2s; }
.tog-slider::before { content: ''; position: absolute; width: 15px; height: 15px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
input:checked + .tog-slider { background: var(--accent); }
input:checked + .tog-slider::before { transform: translateX(17px); }

.fimg-zone { border: 2px dashed var(--border); border-radius: var(--r); padding: 18px; text-align: center; cursor: pointer; transition: all .2s; background: var(--paper2); margin: 14px; }
.fimg-zone:hover { border-color: var(--accent); background: #fff5f0; }
.fimg-zone svg { width: 26px; height: 26px; color: var(--ink3); margin-bottom: 5px; }
.fimg-zone p { font-size: 12px; color: var(--ink3); }
.fimg-zone input[type=file] { display: none; }
.fimg-prev { max-width: 100%; border-radius: 5px; margin-top: 7px; }

/* ─── Toast ─── */
.toasts { position: fixed; top: 14px; right: 14px; z-index: 9999; display: flex; flex-direction: column; gap: 7px; }
.toast { padding: 11px 16px; border-radius: var(--r); font-size: 13px; font-weight: 500; box-shadow: var(--shadow); animation: tIn .25s ease; max-width: 340px; font-family: 'DM Sans', sans-serif; }
@keyframes tIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.toast-success { background: #f6ffed; border: 1px solid #b7eb8f; color: #135200; }
.toast-error   { background: #fff2f0; border: 1px solid #ffccc7; color: #a8071a; }
.toast-info    { background: #e6f4ff; border: 1px solid #91caff; color: #003eb3; }

@media (max-width: 600px) {
    .blocks-inner, .prev-inner { padding: 16px; }
    .mfields { grid-template-columns: 1fr; }
}
`; }

    // ─────────────────────────────────────────────────────────
    // SHELL HTML
    // ─────────────────────────────────────────────────────────
    _shellHTML() { return `
<!-- Top bar -->
<div class="top-bar">
    <div class="brand">MDX<span>Blocks</span></div>
    <div class="top-acts" id="topActs"></div>
</div>

<!-- ═══ LIST VIEW ═══ -->
<div id="listView">
    <div class="list-bar">
        <div>
            <span class="list-heading">Blog Posts</span>
            <span class="list-count" id="listCount"></span>
        </div>
        <button class="btn btn-accent" id="newPostBtn">${this._icon('plus')} New Post</button>
    </div>
    <div class="list-scroll" id="listScroll">
        <div class="state-box" id="listLoading">
            <svg class="spin-anim" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-opacity=".2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
            </svg>
            <p>Loading posts…</p>
        </div>
        <div id="listContent" style="display:none"></div>
    </div>
</div>

<!-- ═══ EDITOR VIEW ═══ -->
<div id="editorView" class="hidden">

    <!-- Tab bar -->
    <div class="tab-bar">
        <button class="tab active" data-tab="editor">${this._icon('para')} Editor</button>
        <button class="tab" data-tab="preview">${this._icon('eye')} Preview</button>
        <button class="tab" data-tab="markdown">${this._icon('code')} Markdown</button>
        <button class="tab" data-tab="meta">${this._icon('gear')} Settings</button>
        <button class="tab" data-tab="seo">${this._icon('seo')} SEO</button>
    </div>

    <!-- Toolbar -->
    <div class="toolbar" id="toolbar">${this._toolbarHTML()}</div>

    <!-- Body -->
    <div class="editor-body">

        <!-- Blocks -->
        <div class="blocks-panel" id="blocksPanel">
            <div class="blocks-inner" id="blocksInner"></div>
        </div>

        <!-- Preview -->
        <div class="prev-panel" id="prevPanel">
            <div class="prev-inner" id="prevInner"></div>
        </div>

        <!-- Markdown -->
        <div class="md-panel" id="mdPanel">
            <textarea class="md-area" id="mdArea" readonly spellcheck="false"></textarea>
        </div>

        <!-- Post Settings -->
        <div class="meta-panel" id="metaPanel">
            <div class="meta-inner">${this._metaHTML()}</div>
        </div>

        <!-- SEO -->
        <div class="seo-panel" id="seoPanel">
            <div class="seo-inner">${this._seoHTML()}</div>
        </div>

    </div>
</div>

<!-- Block type popup -->
<div class="bm-popup hidden" id="bmPopup">${this._bmHTML()}</div>

<!-- Toasts -->
<div class="toasts" id="toastArea"></div>
`; }

    // ─────────────────────────────────────────────────────────
    // TOOLBAR / POPUP HTML
    // ─────────────────────────────────────────────────────────
    _toolbarHTML() {
        const groups = [
            [['h1','H1'],['h2','H2'],['h3','H3'],['h4','H4'],['h5','H5'],['h6','H6']], null,
            [['para','Paragraph'],['quote','Blockquote'],['nested-quote','Nested Quote']], null,
            [['ul','Bullet List'],['ol','Ordered List'],['tasklist','Task List']], null,
            [['code-block','Code Block'],['inline-code','Inline Code']], null,
            [['link','Link'],['image','Image'],['table','Table'],['hr','Divider']], null,
            [['escape','Escape Text']],
        ];
        const svk = t => ({ para:'para', quote:'quote', 'nested-quote':'nquote', 'code-block':'code', 'inline-code':'icode', escape:'escape' }[t] || t);
        let h = '';
        groups.forEach(g => {
            if (!g) { h += `<div class="sep"></div>`; return; }
            g.forEach(([t, l]) => { h += `<button class="tb" data-ins="${t}">${this._icon(svk(t))}<span class="tip">${l}</span></button>`; });
        });
        return h;
    }

    _bmHTML() {
        const items = [
            ['h1','H1'],['h2','H2'],['h3','H3'],['h4','H4'],['h5','H5'],['h6','H6'],
            ['para','Para'],['quote','Quote'],['nested-quote','Nested'],
            ['ul','List'],['ol','Ordered'],['tasklist','Tasks'],
            ['code-block','Code'],['inline-code','Inline'],
            ['link','Link'],['image','Image'],['table','Table'],['hr','Rule'],['escape','Escape'],
        ];
        const svk = t => ({ para:'para', quote:'quote', 'nested-quote':'nquote', 'code-block':'code', 'inline-code':'icode', escape:'escape' }[t] || t);
        return items.map(([t,l]) => `<button class="bm-item" data-bm="${t}">${this._icon(svk(t))}${l}</button>`).join('');
    }

    _metaHTML() { return `
<div class="msec">
    <div class="msec-title">Post Details</div>
    <div class="mfields">
        <div class="mfield mfull"><label>Title</label><input class="minp" id="m-title" type="text" placeholder="Post title…" data-m="title"></div>
        <div class="mfield mfull"><label>Slug</label><input class="minp" id="m-slug" type="text" placeholder="post-url-slug" data-m="slug"></div>
        <div class="mfield mfull"><label>Excerpt</label><textarea class="mtxt" placeholder="Short description…" data-m="excerpt" rows="3"></textarea></div>
        <div class="mfield"><label>Author</label><input class="minp" type="text" placeholder="Author name" data-m="author"></div>
        <div class="mfield"><label>Category</label><input class="minp" type="text" placeholder="Category" data-m="category"></div>
        <div class="mfield mfull"><label>Tags (comma-separated)</label><input class="minp" type="text" placeholder="web, tech, javascript" data-m="tags"></div>
        <div class="mfield"><label>Status</label>
            <select class="msel" data-m="status"><option value="draft">Draft</option><option value="published">Published</option></select>
        </div>
        <div class="mfield"><label>Published Date</label><input class="minp" type="datetime-local" data-m="publishedDate"></div>
        <div class="mfield"><label>Modified Date</label><input class="minp" type="datetime-local" data-m="modifiedDate"></div>
        <div class="mfield"><label>Read Time (min)</label><input class="minp" type="number" placeholder="5" data-m="readTime"></div>
        <div class="mfield"><label>View Count</label><input class="minp" type="number" placeholder="0" data-m="viewCount"></div>
    </div>
    <div class="tog-row">
        <span class="tog-lbl">Featured Post</span>
        <label class="tog"><input type="checkbox" data-m="isFeatured" id="m-featured"><span class="tog-slider"></span></label>
    </div>
</div>
<div class="msec">
    <div class="msec-title">Author Image</div>
    <div class="fimg-zone" id="authorZone">
        <input type="file" id="authorFile" accept="image/*">${this._icon('image')}
        <p>Click to upload author image</p>
        <img class="fimg-prev" id="authorPrev" style="display:none">
    </div>
</div>
<div class="msec">
    <div class="msec-title">Featured Image</div>
    <div class="fimg-zone" id="featuredZone">
        <input type="file" id="featuredFile" accept="image/*">${this._icon('image')}
        <p>Click to upload featured image</p>
        <img class="fimg-prev" id="featuredPrev" style="display:none">
    </div>
</div>`; }

    _seoHTML() { return `
<div class="msec">
    <div class="msec-title">SEO Settings</div>
    <div class="mfields">
        <div class="mfield mfull"><label>SEO Title</label><input class="minp" type="text" placeholder="SEO title…" data-m="seoTitle"></div>
        <div class="mfield mfull"><label>SEO Description</label><textarea class="mtxt" placeholder="Meta description…" data-m="seoDescription" rows="3"></textarea></div>
        <div class="mfield mfull"><label>Keywords (comma-separated)</label><input class="minp" type="text" placeholder="keyword1, keyword2" data-m="seoKeywords"></div>
    </div>
</div>
<div class="msec">
    <div class="msec-title">Open Graph Image</div>
    <div class="fimg-zone" id="ogZone">
        <input type="file" id="ogFile" accept="image/*">${this._icon('image')}
        <p>Recommended: 1200×630px</p>
        <img class="fimg-prev" id="ogPrev" style="display:none">
    </div>
</div>`; }

    // ═════════════════════════════════════════════════════════
    // WIRE ALL EVENTS (called once on build)
    // ═════════════════════════════════════════════════════════
    _wire() {
        const s = this._root;

        /* list view */
        s.getElementById('newPostBtn').addEventListener('click', () => this._openEditor(null));

        /* tabs */
        s.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => this._switchTab(t.dataset.tab)));

        /* toolbar */
        s.getElementById('toolbar').addEventListener('click', e => {
            const b = e.target.closest('[data-ins]');
            if (b) this._toolbarInsert(b.dataset.ins === 'para' ? 'paragraph' : b.dataset.ins);
        });

        /* block type popup */
        const popup = s.getElementById('bmPopup');
        popup.addEventListener('click', e => {
            const b = e.target.closest('[data-bm]');
            if (!b) return;
            const t = b.dataset.bm === 'para' ? 'paragraph' : b.dataset.bm;
            const afterIdx = parseInt(popup.dataset.after);
            this._addBlock(t, afterIdx);
            popup.classList.add('hidden');
        });
        document.addEventListener('click', e => {
            if (!popup.classList.contains('hidden') && !e.composedPath().includes(popup)) {
                popup.classList.add('hidden');
            }
        });

        /* meta inputs */
        s.querySelectorAll('[data-m]').forEach(el => {
            const evt = el.type === 'checkbox' ? 'change' : 'input';
            el.addEventListener(evt, () => {
                this._meta[el.dataset.m] = el.type === 'checkbox' ? el.checked : el.value;
            });
        });
        s.getElementById('m-title').addEventListener('input', e => {
            if (!this._meta.slug) this._autoSlug(e.target.value);
        });

        /* image upload zones */
        this._wireImgZone('authorZone',   'authorFile',   'authorPrev',   'authorImage');
        this._wireImgZone('featuredZone', 'featuredFile', 'featuredPrev', 'featuredImage');
        this._wireImgZone('ogZone',       'ogFile',       'ogPrev',       'seoOgImage');
    }

    _wireImgZone(zoneId, fileId, prevId, metaKey) {
        const s = this._root;
        const zone = s.getElementById(zoneId);
        const file = s.getElementById(fileId);
        const prev = s.getElementById(prevId);
        if (!zone || !file) return;
        zone.addEventListener('click', () => file.click());
        file.addEventListener('change', async e => {
            const f = e.target.files[0]; if (!f) return;
            if (prev) { prev.src = URL.createObjectURL(f); prev.style.display = 'block'; }
            this._emit('upload-meta-image', { fileData: await this._toBase64(f), filename: f.name, metaKey, optimize: true });
        });
    }

    // ═════════════════════════════════════════════════════════
    // VIEW MANAGEMENT
    // ═════════════════════════════════════════════════════════
    _showListView() {
        const s = this._root;
        s.getElementById('listView').classList.remove('hidden');
        s.getElementById('editorView').classList.add('hidden');
        s.getElementById('topActs').innerHTML = '';
        this._currentView = 'list';
        // Reset loader state
        s.getElementById('listLoading').style.display = 'flex';
        s.getElementById('listContent').style.display = 'none';
    }

    _showEditorView() {
        const s = this._root;
        s.getElementById('listView').classList.add('hidden');
        s.getElementById('editorView').classList.remove('hidden');
        this._currentView = 'editor';

        const isNew = !this._editPost;
        s.getElementById('topActs').innerHTML = `
            <button class="btn btn-ghost" id="backBtn">${this._icon('back')} All Posts</button>
            <button class="btn btn-ghost" id="draftBtn">${this._icon('save')} Save Draft</button>
            <button class="btn btn-accent" id="pubBtn">${this._icon('check')} ${isNew ? 'Publish' : 'Update'}</button>`;

        s.getElementById('backBtn').addEventListener('click', () => {
            this._showListView();
            this._emit('load-post-list', {});
        });
        s.getElementById('draftBtn').addEventListener('click', () => this._save('draft'));
        s.getElementById('pubBtn').addEventListener('click',   () => this._save('published'));
    }

    _openEditor(post) {
        this._editPost = post;
        this._resetEditorState();
        if (post) {
            this._populateEditor(post);
        } else {
            this._addBlock('paragraph');
        }
        this._showEditorView();
        this._switchTab('editor');
    }

    // ═════════════════════════════════════════════════════════
    // POSTS LIST
    // ═════════════════════════════════════════════════════════
    _onPostList(data) {
        const s = this._root;
        s.getElementById('listLoading').style.display = 'none';
        const content = s.getElementById('listContent');
        content.style.display = 'block';

        this._posts = data.posts || [];
        const total = data.totalCount || this._posts.length;
        s.getElementById('listCount').textContent = `(${total})`;

        if (!this._posts.length) {
            content.innerHTML = `<div class="state-box">${this._icon('image')}<p>No posts yet. Click "New Post" to create your first!</p></div>`;
            return;
        }

        content.innerHTML = `
<table class="posts-table">
    <thead>
        <tr>
            <th>Title / Slug</th>
            <th>Category</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody id="postsBody"></tbody>
</table>`;

        const tbody = s.getElementById('postsBody');
        this._posts.forEach((post, idx) => {
            const tr = document.createElement('tr');
            const dateStr = post.publishedDate
                ? new Date(post.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : '—';
            const badgeClass = post.status === 'published' ? 'badge-pub' : 'badge-draft';

            tr.innerHTML = `
<td class="col-title">
    <div class="post-title-txt">${post.title || '(Untitled)'}</div>
    <div class="post-slug">${post.slug || ''}</div>
</td>
<td>${post.category || '—'}</td>
<td><span class="badge ${badgeClass}">${post.status || 'draft'}</span></td>
<td style="white-space:nowrap;font-size:13px">${dateStr}</td>
<td>
    <div class="row-actions">
        <button class="btn btn-light btn-sm edit-btn" data-i="${idx}">${this._icon('edit')} Edit</button>
        <button class="btn btn-red   btn-sm del-btn"  data-i="${idx}">${this._icon('trash')} Delete</button>
    </div>
</td>`;
            tbody.appendChild(tr);
        });

        // Bind edit / delete
        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._openEditor(this._posts[parseInt(btn.dataset.i)]);
            });
        });
        tbody.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = this._posts[parseInt(btn.dataset.i)];
                if (!confirm(`Delete "${p.title || 'this post'}"?\n\nThis cannot be undone.`)) return;
                this._emit('delete-post', { id: p._id, slug: p.slug });
            });
        });
    }

    _onDeleteResult(data) {
        if (data.success) {
            this._toast('success', 'Post deleted.');
            this._emit('load-post-list', {});
        } else {
            this._toast('error', 'Delete failed: ' + (data.message || ''));
        }
    }

    // ═════════════════════════════════════════════════════════
    // EDITOR — TABS
    // ═════════════════════════════════════════════════════════
    _switchTab(tab) {
        this._tab = tab;
        const s = this._root;

        s.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

        /* toolbar only shows on editor tab */
        s.getElementById('toolbar').classList.toggle('hidden', tab !== 'editor');

        /* panels */
        s.getElementById('blocksPanel').style.display = tab === 'editor' ? 'flex' : 'none';
        s.getElementById('prevPanel').classList.toggle('active',  tab === 'preview');
        s.getElementById('mdPanel').classList.toggle('active',    tab === 'markdown');
        s.getElementById('metaPanel').classList.toggle('active',  tab === 'meta');
        s.getElementById('seoPanel').classList.toggle('active',   tab === 'seo');

        if (tab === 'preview')  this._buildPreview();
        if (tab === 'markdown') s.getElementById('mdArea').value = this._toMarkdown();
    }

    // ═════════════════════════════════════════════════════════
    // EDITOR — BLOCKS
    // ═════════════════════════════════════════════════════════
    _resetEditorState() {
        this._blocks = []; this._blockCtr = 0; this._uploads = {};
        this._meta = this._freshMeta();
        const s = this._root;
        s.querySelectorAll('[data-m]').forEach(el => {
            if (el.type === 'checkbox') el.checked = false; else el.value = '';
        });
        ['authorPrev','featuredPrev','ogPrev'].forEach(id => {
            const el = s.getElementById(id); if (el) { el.src = ''; el.style.display = 'none'; }
        });
        const inner = s.getElementById('blocksInner');
        if (inner) inner.innerHTML = '';
    }

    _addBlock(type, afterIdx) {
        const id = ++this._blockCtr;
        const block = { id, type, data: this._defaultData(type) };
        if (afterIdx !== undefined && afterIdx !== null && afterIdx >= 0 && afterIdx < this._blocks.length) {
            this._blocks.splice(afterIdx + 1, 0, block);
        } else {
            this._blocks.push(block);
        }
        this._renderBlocks();
        setTimeout(() => this._focusBlock(id), 40);
    }

    _defaultData(type) {
        if (type === 'table')      return { rows: [['Header 1', 'Header 2', 'Header 3'], ['Cell', 'Cell', 'Cell']] };
        if (type === 'tasklist')   return { items: [{ text: '', checked: false }] };
        if (type === 'code-block') return { lang: 'javascript', code: '' };
        if (type === 'link')       return { text: '', url: '' };
        if (type === 'image')      return { src: '', alt: '', pendingFile: null, preview: null };
        if (type === 'hr')         return {};
        return { text: '' };
    }

    _renderBlocks() {
        const inner = this._root.getElementById('blocksInner');
        if (!inner) return;
        inner.innerHTML = '';
        this._blocks.forEach((b, i) => {
            inner.appendChild(this._makeBlockEl(b, i));
            inner.appendChild(this._makeAddRow(i));
        });
        if (!this._blocks.length) inner.appendChild(this._makeAddRow(-1));

        inner.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                this._showPopup(btn, parseInt(btn.dataset.after));
            });
        });
    }

    _makeBlockEl(block, idx) {
        const wrap = document.createElement('div');
        wrap.className = 'bw';
        wrap.setAttribute('data-block-id', block.id);
        wrap.setAttribute('data-bt', block.type);
        wrap.draggable = true;

        wrap.innerHTML = `
<div class="bc">
    <button class="bc-btn bc-drag">${this._icon('drag')}</button>
    <button class="bc-btn bc-del">${this._icon('trash')}</button>
</div>
<div class="bk">${this._blockHTML(block, idx)}</div>`;

        wrap.querySelector('.bc-del').addEventListener('click', () => {
            this._blocks.splice(idx, 1);
            this._renderBlocks();
        });

        this._bindDrag(wrap, idx);
        this._bindBlockEvents(wrap, block, idx);
        return wrap;
    }

    _makeAddRow(afterIdx) {
        const row = document.createElement('div');
        row.className = 'add-row';
        row.innerHTML = `<div class="add-line"></div><button class="add-btn" data-after="${afterIdx}">${this._icon('plus')} Add Block</button><div class="add-line"></div>`;
        return row;
    }

    _blockHTML(b, idx) {
        const PH = {
            h1:'Heading 1…', h2:'Heading 2…', h3:'Heading 3…',
            h4:'Heading 4…', h5:'Heading 5…', h6:'Heading 6…',
            paragraph:'Write something…', quote:'Blockquote…',
            'nested-quote':'Nested quote…', ul:'- Item 1\n- Item 2',
            ol:'1. First\n2. Second', 'inline-code':'inline code…', escape:'\\*escaped text\\*'
        };
        const safe = t => (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const ph = PH[b.type] || '…';

        switch (b.type) {
            case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
            case 'paragraph': case 'quote': case 'nested-quote': case 'inline-code': case 'escape':
                return `<div class="ce" contenteditable="true" data-ph="${ph}">${safe(b.data.text)}</div>`;

            case 'ul': case 'ol':
                return `<div class="ce" contenteditable="true" data-ph="${ph}" style="white-space:pre-wrap">${safe(b.data.text)}</div>
                         <div class="list-hint">Each line = one item</div>`;

            case 'hr':
                return `<hr class="hr-line">`;

            case 'code-block': {
                const LANGS = ['javascript','typescript','python','html','css','json','bash','sql','java','php','ruby','rust','go','cpp','c','swift','kotlin','r','yaml','xml'];
                return `<div class="code-wrap">
    <div class="code-hdr">
        <select class="lang-sel">${LANGS.map(l => `<option value="${l}"${b.data.lang===l?' selected':''}>${l}</option>`).join('')}</select>
        <button class="copy-btn">${this._icon('copy')} Copy</button>
    </div>
    <div class="ce code-area" contenteditable="true" data-ph="// write code…" spellcheck="false">${safe(b.data.code)}</div>
</div>`; }

            case 'link':
                return `<div class="link-row">
    <input class="link-inp link-text" type="text" placeholder="Link text…" value="${safe(b.data.text)}">
    <input class="link-inp link-url"  type="url"  placeholder="https://…"  value="${safe(b.data.url)}">
</div>`;

            case 'image': return this._imageBlockHTML(b);
            case 'table': return this._tableHTML(b);
            case 'tasklist': return this._taskHTML(b);
            default: return `<div class="ce" contenteditable="true" data-ph="…">${safe(b.data.text)}</div>`;
        }
    }

    _imageBlockHTML(b) {
        if (b.data.src) return `
<div class="img-preview-wrap"><img src="${b.data.src}" alt="${b.data.alt||''}"></div>
<input class="alt-inp" type="text" placeholder="Alt text (accessibility)…" value="${b.data.alt||''}">`;

        if (b.data.pendingFile) return `
<div class="img-drop">
    <div style="text-align:center;margin-bottom:10px">
        <img src="${b.data.preview}" style="max-height:170px;border-radius:7px;object-fit:contain">
    </div>
    <div class="img-opts">
        <button class="img-btn img-btn-up  js-upload"  type="button">${this._icon('up')} Upload Image</button>
        <button class="img-btn img-btn-opt js-optimize" type="button">${this._icon('bolt')} Optimize &amp; Upload</button>
    </div>
</div>`;

        return `
<div class="img-drop js-drop">
    <input type="file" accept="image/*" class="js-file-in" style="display:none">
    ${this._icon('image')}<p>Click or drag &amp; drop to upload</p>
</div>`;
    }

    _tableHTML(b) {
        let t = `<div class="tbl-wrap"><table class="etbl">`;
        b.data.rows.forEach((row, ri) => {
            t += '<tr>';
            row.forEach((cell, ci) => {
                const tag = ri === 0 ? 'th' : 'td';
                t += `<${tag} contenteditable="true" data-row="${ri}" data-col="${ci}">${cell}</${tag}>`;
            });
            t += '</tr>';
        });
        t += `</table><div class="tbl-ctrl">
<button class="tbl-btn" data-ta="add-row">+ Row</button>
<button class="tbl-btn" data-ta="add-col">+ Col</button>
<button class="tbl-btn" data-ta="del-row">− Row</button>
<button class="tbl-btn" data-ta="del-col">− Col</button>
</div></div>`;
        return t;
    }

    _taskHTML(b) {
        let h = `<ul class="task-list">`;
        b.data.items.forEach((it, ii) => {
            h += `<li class="task-li">
<input type="checkbox" class="js-tc" data-ii="${ii}" ${it.checked ? 'checked' : ''}>
<input class="task-txt js-tt" type="text" value="${(it.text||'').replace(/"/g,'&quot;')}" placeholder="Task…" data-ii="${ii}">
</li>`;
        });
        return h + `</ul><button class="tbl-btn js-add-task" style="margin-top:7px">+ Add Task</button>`;
    }

    // ─────────────────────────────────────────────────────────
    // BIND BLOCK EVENTS
    // ─────────────────────────────────────────────────────────
    _bindBlockEvents(wrap, block, idx) {
        /* contenteditable */
        const ce = wrap.querySelector('.ce');
        if (ce) {
            ce.addEventListener('input', () => {
                if (block.type === 'code-block') block.data.code = ce.textContent;
                else block.data.text = ce.textContent;
            });
            ce.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey && !['code-block','ul','ol'].includes(block.type)) {
                    e.preventDefault();
                    this._addBlock('paragraph', idx);
                }
            });
        }

        /* code lang / copy */
        const ls = wrap.querySelector('.lang-sel');
        if (ls) ls.addEventListener('change', () => { block.data.lang = ls.value; });
        const cp = wrap.querySelector('.copy-btn');
        if (cp) cp.addEventListener('click', () => { navigator.clipboard.writeText(block.data.code || ''); this._toast('info', 'Copied!'); });

        /* link */
        const lt = wrap.querySelector('.link-text'), lu = wrap.querySelector('.link-url');
        if (lt) lt.addEventListener('input', () => { block.data.text = lt.value; });
        if (lu) lu.addEventListener('input', () => { block.data.url  = lu.value; });

        /* image — drop zone */
        const drop = wrap.querySelector('.js-drop'), fi = wrap.querySelector('.js-file-in');
        if (drop) {
            drop.addEventListener('click', () => fi?.click());
            drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
            drop.addEventListener('dragleave', () => drop.classList.remove('over'));
            drop.addEventListener('drop', e => {
                e.preventDefault(); drop.classList.remove('over');
                const f = e.dataTransfer.files[0];
                if (f && f.type.startsWith('image/')) this._stageImage(f, block);
            });
        }
        if (fi) fi.addEventListener('change', e => {
            const f = e.target.files[0]; if (f) this._stageImage(f, block);
        });

        /* image — upload buttons */
        const upBtn  = wrap.querySelector('.js-upload');
        const optBtn = wrap.querySelector('.js-optimize');
        if (upBtn)  upBtn.addEventListener('click',  () => this._uploadImage(block, false));
        if (optBtn) optBtn.addEventListener('click',  () => this._uploadImage(block, true));

        /* alt text */
        const alt = wrap.querySelector('.alt-inp');
        if (alt) alt.addEventListener('input', () => { block.data.alt = alt.value; });

        /* table cells */
        wrap.querySelectorAll('[data-row]').forEach(cell => {
            cell.addEventListener('input', () => {
                block.data.rows[parseInt(cell.dataset.row)][parseInt(cell.dataset.col)] = cell.textContent;
            });
        });
        wrap.querySelectorAll('[data-ta]').forEach(btn => {
            btn.addEventListener('click', () => {
                const a = btn.dataset.ta;
                if (a === 'add-row') block.data.rows.push(block.data.rows[0].map(() => ''));
                if (a === 'add-col') block.data.rows.forEach(r => r.push(''));
                if (a === 'del-row' && block.data.rows.length > 2) block.data.rows.pop();
                if (a === 'del-col' && block.data.rows[0].length > 1) block.data.rows.forEach(r => r.pop());
                this._renderBlocks();
            });
        });

        /* tasklist */
        wrap.querySelectorAll('.js-tc').forEach(cb => {
            cb.addEventListener('change', () => { block.data.items[parseInt(cb.dataset.ii)].checked = cb.checked; });
        });
        wrap.querySelectorAll('.js-tt').forEach(inp => {
            inp.addEventListener('input', () => { block.data.items[parseInt(inp.dataset.ii)].text = inp.value; });
        });
        const addTask = wrap.querySelector('.js-add-task');
        if (addTask) addTask.addEventListener('click', () => {
            block.data.items.push({ text: '', checked: false }); this._renderBlocks();
        });
    }

    _focusBlock(id) {
        const w = this._root.querySelector(`[data-block-id="${id}"]`);
        if (!w) return;
        const el = w.querySelector('.ce, .link-inp, .task-txt');
        if (!el) return;
        el.focus();
        if (el.contentEditable === 'true') {
            try {
                const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
                window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(r);
            } catch(e) {}
        }
    }

    /* toolbar: convert focused block type, or append */
    _toolbarInsert(type) {
        const focused = this._root.activeElement;
        const wrap    = focused?.closest?.('[data-block-id]');
        if (wrap) {
            const id  = parseInt(wrap.getAttribute('data-block-id'));
            const idx = this._blocks.findIndex(b => b.id === id);
            if (idx !== -1) {
                const cur = this._blocks[idx];
                const textTypes = new Set(['h1','h2','h3','h4','h5','h6','paragraph','quote','nested-quote','ul','ol','inline-code','escape']);
                const keepText  = textTypes.has(cur.type) && textTypes.has(type);
                this._blocks[idx] = {
                    id: cur.id, type,
                    data: keepText ? { ...this._defaultData(type), text: cur.data.text || '' } : this._defaultData(type)
                };
                this._renderBlocks();
                setTimeout(() => this._focusBlock(cur.id), 40);
                return;
            }
        }
        this._addBlock(type);
    }

    /* drag & drop */
    _bindDrag(wrap, idx) {
        const s = this._root;
        wrap.addEventListener('dragstart', e => {
            this._dragIdx = idx; wrap.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move';
        });
        wrap.addEventListener('dragend', () => wrap.classList.remove('dragging'));
        wrap.addEventListener('dragover', e => {
            e.preventDefault(); s.querySelectorAll('.bw').forEach(w => w.classList.remove('drag-over')); wrap.classList.add('drag-over');
        });
        wrap.addEventListener('drop', e => {
            e.preventDefault(); wrap.classList.remove('drag-over');
            if (this._dragIdx === null || this._dragIdx === idx) return;
            const moved = this._blocks.splice(this._dragIdx, 1)[0];
            this._blocks.splice(this._dragIdx < idx ? idx - 1 : idx, 0, moved);
            this._dragIdx = null; this._renderBlocks();
        });
    }

    _showPopup(btn, afterIdx) {
        const popup = this._root.getElementById('bmPopup');
        const r = btn.getBoundingClientRect();
        popup.style.top  = (r.bottom + 4) + 'px';
        popup.style.left = r.left + 'px';
        popup.dataset.after = afterIdx;
        popup.classList.remove('hidden');
    }

    // ═════════════════════════════════════════════════════════
    // IMAGE UPLOAD
    // ═════════════════════════════════════════════════════════
    _stageImage(file, block) {
        block.data.pendingFile = file;
        block.data.preview = URL.createObjectURL(file);
        this._renderBlocks();
    }

    async _uploadImage(block, optimize) {
        const file = block.data.pendingFile; if (!file) return;
        const wrap = this._root.querySelector(`[data-block-id="${block.id}"]`);
        if (wrap) {
            wrap.querySelector('.bk').innerHTML = `
<div class="img-spinner">
<svg class="spin-anim" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
    <circle cx="12" cy="12" r="10" stroke-opacity=".2"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
</svg> ${optimize ? 'Optimizing & uploading…' : 'Uploading…'}
</div>`;
        }
        try {
            let f = file;
            if (optimize) f = await this._toWebp(file);
            this._uploads[block.id] = block;
            this._emit('upload-image', {
                blockId: block.id,
                fileData: await this._toBase64(f),
                filename: optimize ? file.name.replace(/\.[^.]+$/, '.webp') : file.name,
                optimize
            });
        } catch(e) {
            this._toast('error', 'Upload error: ' + e.message);
            this._renderBlocks();
        }
    }

    async _toWebp(file) {
        return new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
                c.getContext('2d').drawImage(img, 0, 0);
                c.toBlob(b => b
                    ? res(new File([b], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
                    : rej(new Error('WebP conversion failed')),
                'image/webp', 0.92);
            };
            img.onerror = rej;
            img.src = URL.createObjectURL(file);
        });
    }

    /* Convert wix:image://v1/HASH~mv2.ext/... → https://static.wixstatic.com/media/HASH~mv2.ext */
    _wixUrl(url) {
        if (!url || url.startsWith('http')) return url;
        const m = url.match(/^wix:image:\/\/v1\/([^/]+)\//);
        return m ? `https://static.wixstatic.com/media/${m[1]}` : url;
    }

    _onUploadResult(data) {
        if (data.blockId) {
            const block = this._uploads[data.blockId];
            if (block) {
                block.data.src = this._wixUrl(data.url);
                block.data.alt = '';
                block.data.pendingFile = null;
                block.data.preview = null;
                delete this._uploads[data.blockId];
                this._renderBlocks();
                this._toast('success', 'Image uploaded!');
            }
        }
        if (data.metaKey) {
            this._meta[data.metaKey] = this._wixUrl(data.url);
            this._toast('success', 'Image uploaded!');
        }
    }

    // ═════════════════════════════════════════════════════════
    // MARKDOWN
    // ═════════════════════════════════════════════════════════
    _toMarkdown() {
        return this._blocks.map(b => {
            const t = b.data.text || '';
            switch (b.type) {
                case 'h1': return `# ${t}`;
                case 'h2': return `## ${t}`;
                case 'h3': return `### ${t}`;
                case 'h4': return `#### ${t}`;
                case 'h5': return `##### ${t}`;
                case 'h6': return `###### ${t}`;
                case 'paragraph': return t;
                case 'quote': return `> ${t}`;
                case 'nested-quote': return `>> ${t}`;
                case 'ul': return t.split('\n').filter(l => l.trim()).map(l => `- ${l.replace(/^[-*+]\s*/, '')}`).join('\n');
                case 'ol': return t.split('\n').filter(l => l.trim()).map((l, i) => `${i+1}. ${l.replace(/^\d+\.\s*/, '')}`).join('\n');
                case 'tasklist': return b.data.items.map(it => `- [${it.checked ? 'x' : ' '}] ${it.text}`).join('\n');
                case 'code-block': return `\`\`\`${b.data.lang}\n${b.data.code || ''}\n\`\`\``;
                case 'inline-code': return `\`${t}\``;
                case 'link': return `[${b.data.text}](${b.data.url})`;
                case 'image': return `![${b.data.alt || ''}](${b.data.src || ''})`;
                case 'hr': return `---`;
                case 'escape': return t.replace(/([*_`~\\])/g, '\\$1');
                case 'table': {
                    const r = b.data.rows; if (!r.length) return '';
                    return `| ${r[0].join(' | ')} |\n| ${r[0].map(() => '---').join(' | ')} |\n${r.slice(1).map(row => `| ${row.join(' | ')} |`).join('\n')}`;
                }
                default: return t;
            }
        }).join('\n\n');
    }

    _buildPreview() {
        this._root.getElementById('prevInner').innerHTML = this._mdToHtml(this._toMarkdown());
    }

    _mdToHtml(md) {
        return md
            .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
            .replace(/^##### (.+)$/gm,  '<h5>$1</h5>')
            .replace(/^#### (.+)$/gm,   '<h4>$1</h4>')
            .replace(/^### (.+)$/gm,    '<h3>$1</h3>')
            .replace(/^## (.+)$/gm,     '<h2>$1</h2>')
            .replace(/^# (.+)$/gm,      '<h1>$1</h1>')
            .replace(/^---$/gm,         '<hr>')
            .replace(/^>> (.+)$/gm,     '<blockquote><blockquote>$1</blockquote></blockquote>')
            .replace(/^> (.+)$/gm,      '<blockquote>$1</blockquote>')
            .replace(/```(\w+)?\n([\s\S]*?)```/gm, '<pre><code>$2</code></pre>')
            .replace(/`([^`]+)`/g,      '<code>$1</code>')
            .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.+?)\*\*/g,  '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g,      '<em>$1</em>')
            .replace(/~~(.+?)~~/g,      '<del>$1</del>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1">')
            .replace(/^- \[x\] (.+)$/gm,'<li><input type="checkbox" checked disabled> $1</li>')
            .replace(/^- \[ \] (.+)$/gm,'<li><input type="checkbox" disabled> $1</li>')
            .replace(/^- (.+)$/gm,      '<li>$1</li>')
            .replace(/^\d+\. (.+)$/gm,  '<li>$1</li>')
            .replace(/^(?!<[h1-6ublptd]|<block|<hr|<pre|<table|<tr)(.+)$/gm, '<p>$1</p>');
    }

    // ═════════════════════════════════════════════════════════
    // LOAD EXISTING POST INTO EDITOR
    // ═════════════════════════════════════════════════════════
    _populateEditor(data) {
        if (!data) return;
        Object.keys(this._meta).forEach(k => { if (data[k] !== undefined) this._meta[k] = data[k]; });
        this._root.querySelectorAll('[data-m]').forEach(el => {
            const k = el.dataset.m;
            if (el.type === 'checkbox') el.checked = !!this._meta[k];
            else el.value = this._meta[k] || '';
        });
        if (data.content) this._parseMd(data.content);
        else { this._blocks = []; this._addBlock('paragraph'); }
    }

    _parseMd(md) {
        this._blocks = [];
        md.split('\n').forEach(line => {
            if (!line.trim()) return;
            const id = ++this._blockCtr;
            if      (line.startsWith('###### ')) this._blocks.push({ id, type: 'h6',           data: { text: line.slice(7)  } });
            else if (line.startsWith('##### '))  this._blocks.push({ id, type: 'h5',           data: { text: line.slice(6)  } });
            else if (line.startsWith('#### '))   this._blocks.push({ id, type: 'h4',           data: { text: line.slice(5)  } });
            else if (line.startsWith('### '))    this._blocks.push({ id, type: 'h3',           data: { text: line.slice(4)  } });
            else if (line.startsWith('## '))     this._blocks.push({ id, type: 'h2',           data: { text: line.slice(3)  } });
            else if (line.startsWith('# '))      this._blocks.push({ id, type: 'h1',           data: { text: line.slice(2)  } });
            else if (line.startsWith('>> '))     this._blocks.push({ id, type: 'nested-quote', data: { text: line.slice(3)  } });
            else if (line.startsWith('> '))      this._blocks.push({ id, type: 'quote',        data: { text: line.slice(2)  } });
            else if (line.startsWith('---'))     this._blocks.push({ id, type: 'hr',           data: {}                       });
            else {
                const imgM = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
                if (imgM) this._blocks.push({ id, type: 'image', data: { alt: imgM[1], src: imgM[2], pendingFile: null, preview: null } });
                else this._blocks.push({ id, type: 'paragraph', data: { text: line } });
            }
        });
        this._renderBlocks();
    }

    // ═════════════════════════════════════════════════════════
    // SAVE
    // ═════════════════════════════════════════════════════════
    _save(status) {
        const md = this._toMarkdown();
        this._emit('save-post', {
            ...this._meta,
            content: md,
            status,
            readTime: Math.max(1, Math.ceil(md.split(/\s+/).length / 200)),
            _id: this._editPost?._id || null
        });
    }

    _onSaveResult(data) {
        if (data.success) {
            this._toast('success', data.message || 'Post saved!');
            if (!this._editPost && data.id) this._editPost = { _id: data.id };
            else if (this._editPost && data.id) this._editPost._id = data.id;
        } else {
            this._toast('error', data.message || 'Save failed.');
        }
    }

    // ═════════════════════════════════════════════════════════
    // HELPERS
    // ═════════════════════════════════════════════════════════
    _autoSlug(title) {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const el = this._root.getElementById('m-slug');
        if (el) { el.value = slug; this._meta.slug = slug; }
    }

    _emit(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }

    _toast(type, msg) {
        const area = this._root.getElementById('toastArea');
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.textContent = msg;
        area.appendChild(t);
        setTimeout(() => t.remove(), 5000);
    }

    _toBase64(file) {
        return new Promise((res, rej) => {
            const r = new FileReader();
            r.onloadend = () => res(r.result.split(',')[1]);
            r.onerror = rej;
            r.readAsDataURL(file);
        });
    }
}

customElements.define('mdx-blog-editor', MdxBlogEditor);
console.log('✍️ MdxBlogEditor v4 registered'
