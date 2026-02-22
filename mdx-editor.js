// ============================================================
// MDX BLOG EDITOR — Custom Element v5 (Light DOM + TOAST UI)
// <mdx-blog-editor> Web Component
//
// VIEW 1 → Posts List (shows all CMS posts, edit/delete)
// VIEW 2 → Editor (WYSIWYG Markdown editor with TOAST UI)
// ============================================================

class MdxBlogEditor extends HTMLElement {

    // ─────────────────────────────────────────────────────────
    constructor() {
        super();
        // Using Light DOM instead of Shadow DOM
        this._root = this;

        /* ── view state ── */
        this._currentView = 'list';   // 'list' | 'editor'
        this._posts       = [];
        this._editPost    = null;     // null = new post

        /* ── editor state ── */
        this._toastEditor = null;     // TOAST UI Editor instance
        this._tab         = 'editor';
        this._meta        = this._freshMeta();

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
        this._emit('load-post-list', {});
    }

    // ═════════════════════════════════════════════════════════
    // ICONS
    // ═════════════════════════════════════════════════════════
    _icon(k) {
        const I = {
            edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
            plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
            save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
            eye:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
            gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
            seo:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M11 8v3l2 2" stroke-linecap="round"/></svg>`,
            back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`,
            check:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
            trash:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
            image:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
            code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
        };
        return I[k] || I.edit;
    }

    // ═════════════════════════════════════════════════════════
    // INJECT HTML + CSS
    // ═════════════════════════════════════════════════════════
    _inject() {
        // Load TOAST UI Editor CSS
        if (!document.getElementById('toast-editor-css')) {
            const cssLink = document.createElement('link');
            cssLink.id = 'toast-editor-css';
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://uicdn.toast.com/editor/latest/toastui-editor.min.css';
            document.head.appendChild(cssLink);
        }

        // Add component styles
        if (!document.getElementById('mdx-editor-styles')) {
            const style = document.createElement('style');
            style.id = 'mdx-editor-styles';
            style.textContent = this._styles();
            document.head.appendChild(style);
        }

        // Inject HTML
        this.innerHTML = this._shellHTML();

        // Load TOAST UI Editor script
        this._loadToastEditor();
    }

    // ─────────────────────────────────────────────────────────
    // STYLES
    // ─────────────────────────────────────────────────────────
    _styles() { return `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

mdx-blog-editor {
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
mdx-blog-editor .mdx-host {
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
mdx-blog-editor .mdx-top-bar {
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
mdx-blog-editor .mdx-brand {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 900;
    letter-spacing: -.5px;
    white-space: nowrap;
}
mdx-blog-editor .mdx-brand span { color: var(--accent2); }
mdx-blog-editor .mdx-top-acts { display: flex; gap: 8px; align-items: center; }

/* ─── Buttons ─── */
mdx-blog-editor .mdx-btn {
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
mdx-blog-editor .mdx-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
mdx-blog-editor .mdx-btn-ghost  { background: rgba(255,255,255,.12); color: #fff; border: 1px solid rgba(255,255,255,.2); }
mdx-blog-editor .mdx-btn-ghost:hover  { background: rgba(255,255,255,.22); }
mdx-blog-editor .mdx-btn-accent { background: var(--accent); color: #fff; }
mdx-blog-editor .mdx-btn-accent:hover { opacity: .88; }
mdx-blog-editor .mdx-btn-green  { background: var(--green); color: #fff; }
mdx-blog-editor .mdx-btn-green:hover  { opacity: .88; }
mdx-blog-editor .mdx-btn-light  { background: var(--paper2); color: var(--ink2); border: 1px solid var(--border); }
mdx-blog-editor .mdx-btn-light:hover  { background: var(--paper3); }
mdx-blog-editor .mdx-btn-red    { background: #fff2f0; color: #a8071a; border: 1px solid #ffccc7; }
mdx-blog-editor .mdx-btn-red:hover    { background: #ffccc7; }
mdx-blog-editor .mdx-btn-sm { padding: 5px 10px; font-size: 12px; }

/* ═══ LIST VIEW ════════════════════════════════════════════ */
mdx-blog-editor .mdx-list-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}
mdx-blog-editor .mdx-list-view.hidden { display: none; }

mdx-blog-editor .mdx-list-bar {
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
mdx-blog-editor .mdx-list-heading { font-size: 16px; font-weight: 700; }
mdx-blog-editor .mdx-list-count { font-size: 13px; color: var(--ink3); margin-left: 6px; }

mdx-blog-editor .mdx-list-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 22px;
    min-height: 0;
}
mdx-blog-editor .mdx-list-scroll::-webkit-scrollbar { width: 5px; }
mdx-blog-editor .mdx-list-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* Loading / empty */
mdx-blog-editor .mdx-state-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    gap: 14px;
    color: var(--ink3);
    text-align: center;
}
mdx-blog-editor .mdx-state-box svg { width: 44px; height: 44px; opacity: .35; }
mdx-blog-editor .mdx-state-box p { font-size: 15px; }

@keyframes mdx-spin { to { transform: rotate(360deg); } }
mdx-blog-editor .mdx-spin-anim { animation: mdx-spin .7s linear infinite; }

/* Posts table */
mdx-blog-editor .mdx-posts-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}
mdx-blog-editor .mdx-posts-table th {
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
mdx-blog-editor .mdx-posts-table td {
    padding: 11px 13px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
}
mdx-blog-editor .mdx-posts-table tr:hover td { background: #fff9f7; }

mdx-blog-editor .mdx-col-title { font-weight: 600; max-width: 300px; }
mdx-blog-editor .mdx-post-title-txt {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
mdx-blog-editor .mdx-post-slug { font-size: 11px; color: var(--ink3); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }

mdx-blog-editor .mdx-badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .4px;
}
mdx-blog-editor .mdx-badge-pub   { background: #d1fae5; color: #065f46; }
mdx-blog-editor .mdx-badge-draft { background: #fef3c7; color: #92400e; }

mdx-blog-editor .mdx-row-actions { display: flex; gap: 6px; }

/* ═══ EDITOR VIEW ══════════════════════════════════════════ */
mdx-blog-editor .mdx-editor-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}
mdx-blog-editor .mdx-editor-view.hidden { display: none; }

/* ─── Tab bar ─── */
mdx-blog-editor .mdx-tab-bar {
    display: flex;
    align-items: center;
    height: 45px;
    padding: 0 14px;
    background: var(--paper2);
    border-bottom: 2px solid var(--border);
    gap: 3px;
    flex-shrink: 0;
}
mdx-blog-editor .mdx-tab {
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
mdx-blog-editor .mdx-tab svg { width: 14px; height: 14px; }
mdx-blog-editor .mdx-tab:hover { color: var(--ink); background: var(--paper3); }
mdx-blog-editor .mdx-tab.active { color: var(--accent); border-bottom-color: var(--accent); background: var(--paper); font-weight: 600; }

/* ─── Editor body (panels container) ─── */
mdx-blog-editor .mdx-editor-body {
    display: flex;
    flex: 1;
    overflow: hidden;
    min-height: 0;
    position: relative;
}

/* ─── Editor panel ─── */
mdx-blog-editor .mdx-editor-panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
    background: #fff;
}
mdx-blog-editor .mdx-editor-panel.hidden { display: none; }

mdx-blog-editor .mdx-toast-editor-wrapper {
    flex: 1;
    overflow: hidden;
    min-height: 0;
    position: relative;
}

mdx-blog-editor .mdx-toast-editor-container {
    height: 100%;
}

/* ─── Preview panel ─── */
mdx-blog-editor .mdx-prev-panel { display: none; flex: 1; overflow-y: auto; min-height: 0; background: #fff; }
mdx-blog-editor .mdx-prev-panel.active { display: block; }
mdx-blog-editor .mdx-prev-inner { max-width: 820px; margin: 0 auto; padding: 32px 44px; font-size: 16px; line-height: 1.75; }
mdx-blog-editor .mdx-prev-inner h1 { font-family: 'Playfair Display', serif; font-size: 34px; font-weight: 900; margin-bottom: 14px; }
mdx-blog-editor .mdx-prev-inner h2 { font-family: 'Playfair Display', serif; font-size: 26px; margin: 22px 0 10px; border-bottom: 2px solid var(--border); padding-bottom: 5px; }
mdx-blog-editor .mdx-prev-inner h3 { font-size: 21px; font-weight: 700; margin: 18px 0 8px; }
mdx-blog-editor .mdx-prev-inner h4 { font-size: 17px; font-weight: 600; margin: 14px 0 7px; }
mdx-blog-editor .mdx-prev-inner h5 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin: 12px 0 6px; }
mdx-blog-editor .mdx-prev-inner h6 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--ink3); margin: 10px 0 5px; }
mdx-blog-editor .mdx-prev-inner p { margin-bottom: 10px; }
mdx-blog-editor .mdx-prev-inner blockquote { border-left: 4px solid var(--accent2); padding-left: 14px; color: var(--ink2); font-style: italic; margin: 10px 0; }
mdx-blog-editor .mdx-prev-inner blockquote blockquote { border-left-color: var(--accent); margin-left: 16px; background: var(--paper2); padding: 7px 7px 7px 14px; border-radius: 0 var(--r) var(--r) 0; }
mdx-blog-editor .mdx-prev-inner pre { background: #1e1e2e; border-radius: var(--r); padding: 14px; overflow-x: auto; margin: 10px 0; }
mdx-blog-editor .mdx-prev-inner code { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #cdd6f4; }
mdx-blog-editor .mdx-prev-inner p code { background: var(--paper2); padding: 2px 5px; border-radius: 3px; color: var(--accent); font-size: 12px; border: 1px solid var(--border); }
mdx-blog-editor .mdx-prev-inner ul, mdx-blog-editor .mdx-prev-inner ol { padding-left: 22px; margin-bottom: 10px; }
mdx-blog-editor .mdx-prev-inner li { margin-bottom: 3px; }
mdx-blog-editor .mdx-prev-inner hr { border: none; border-top: 2px solid var(--border); margin: 22px 0; }
mdx-blog-editor .mdx-prev-inner img { max-width: 100%; border-radius: var(--r); margin: 7px 0; }
mdx-blog-editor .mdx-prev-inner table { border-collapse: collapse; width: 100%; margin: 10px 0; }
mdx-blog-editor .mdx-prev-inner th, mdx-blog-editor .mdx-prev-inner td { border: 1px solid var(--border); padding: 7px 11px; }
mdx-blog-editor .mdx-prev-inner th { background: var(--paper2); font-weight: 600; }
mdx-blog-editor .mdx-prev-inner a { color: var(--blue); text-decoration: underline; }

/* ─── Markdown panel ─── */
mdx-blog-editor .mdx-md-panel { display: none; flex: 1; min-height: 0; background: #1e1e2e; }
mdx-blog-editor .mdx-md-panel.active { display: flex; flex-direction: column; }
mdx-blog-editor .mdx-md-area { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.6; padding: 22px; border: none; outline: none; resize: none; background: #1e1e2e; color: #cdd6f4; }

/* ─── Meta / SEO panels ─── */
mdx-blog-editor .mdx-meta-panel, mdx-blog-editor .mdx-seo-panel { display: none; flex: 1; overflow-y: auto; min-height: 0; }
mdx-blog-editor .mdx-meta-panel.active, mdx-blog-editor .mdx-seo-panel.active { display: block; }
mdx-blog-editor .mdx-meta-inner, mdx-blog-editor .mdx-seo-inner { padding: 20px; }

mdx-blog-editor .mdx-msec { background: var(--paper); border: 1px solid var(--border); border-radius: var(--r); margin-bottom: 14px; overflow: hidden; }
mdx-blog-editor .mdx-msec-title { padding: 10px 14px; background: var(--paper2); border-bottom: 1px solid var(--border); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--ink3); }
mdx-blog-editor .mdx-mfields { padding: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
mdx-blog-editor .mdx-mfull { grid-column: 1 / -1; }
mdx-blog-editor .mdx-mfield label { display: block; font-size: 11px; font-weight: 600; color: var(--ink3); margin-bottom: 4px; text-transform: uppercase; letter-spacing: .5px; }
mdx-blog-editor .mdx-minp, mdx-blog-editor .mdx-msel, mdx-blog-editor .mdx-mtxt { width: 100%; padding: 8px 10px; border: 1.5px solid var(--border); border-radius: 5px; font-family: 'DM Sans', sans-serif; font-size: 14px; background: var(--paper); color: var(--ink); outline: none; transition: border-color .15s; }
mdx-blog-editor .mdx-minp:focus, mdx-blog-editor .mdx-msel:focus, mdx-blog-editor .mdx-mtxt:focus { border-color: var(--accent); }
mdx-blog-editor .mdx-mtxt { resize: vertical; min-height: 70px; }
mdx-blog-editor .mdx-tog-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 14px; border-top: 1px solid var(--border); }
mdx-blog-editor .mdx-tog-lbl { font-size: 14px; font-weight: 500; }
mdx-blog-editor .mdx-tog { position: relative; width: 38px; height: 21px; }
mdx-blog-editor .mdx-tog input { opacity: 0; width: 0; height: 0; }
mdx-blog-editor .mdx-tog-slider { position: absolute; inset: 0; background: var(--paper3); border-radius: 21px; cursor: pointer; transition: background .2s; }
mdx-blog-editor .mdx-tog-slider::before { content: ''; position: absolute; width: 15px; height: 15px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
mdx-blog-editor .mdx-tog input:checked + .mdx-tog-slider { background: var(--accent); }
mdx-blog-editor .mdx-tog input:checked + .mdx-tog-slider::before { transform: translateX(17px); }

mdx-blog-editor .mdx-fimg-zone { border: 2px dashed var(--border); border-radius: var(--r); padding: 18px; text-align: center; cursor: pointer; transition: all .2s; background: var(--paper2); margin: 14px; }
mdx-blog-editor .mdx-fimg-zone:hover { border-color: var(--accent); background: #fff5f0; }
mdx-blog-editor .mdx-fimg-zone svg { width: 26px; height: 26px; color: var(--ink3); margin-bottom: 5px; }
mdx-blog-editor .mdx-fimg-zone p { font-size: 12px; color: var(--ink3); }
mdx-blog-editor .mdx-fimg-zone input[type=file] { display: none; }
mdx-blog-editor .mdx-fimg-prev { max-width: 100%; border-radius: 5px; margin-top: 7px; }

/* ─── Toast ─── */
mdx-blog-editor .mdx-toasts { position: fixed; top: 14px; right: 14px; z-index: 9999; display: flex; flex-direction: column; gap: 7px; }
mdx-blog-editor .mdx-toast { padding: 11px 16px; border-radius: var(--r); font-size: 13px; font-weight: 500; box-shadow: var(--shadow); animation: mdx-tIn .25s ease; max-width: 340px; font-family: 'DM Sans', sans-serif; }
@keyframes mdx-tIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
mdx-blog-editor .mdx-toast-success { background: #f6ffed; border: 1px solid #b7eb8f; color: #135200; }
mdx-blog-editor .mdx-toast-error   { background: #fff2f0; border: 1px solid #ffccc7; color: #a8071a; }
mdx-blog-editor .mdx-toast-info    { background: #e6f4ff; border: 1px solid #91caff; color: #003eb3; }

@media (max-width: 600px) {
    mdx-blog-editor .mdx-prev-inner { padding: 16px; }
    mdx-blog-editor .mdx-mfields { grid-template-columns: 1fr; }
}
`; }

    // ─────────────────────────────────────────────────────────
    // SHELL HTML
    // ─────────────────────────────────────────────────────────
    _shellHTML() { return `
<div class="mdx-host">
<!-- Top bar -->
<div class="mdx-top-bar">
    <div class="mdx-brand">MDX<span>Blocks</span></div>
    <div class="mdx-top-acts" id="topActs"></div>
</div>

<!-- ═══ LIST VIEW ═══ -->
<div class="mdx-list-view" id="listView">
    <div class="mdx-list-bar">
        <div>
            <span class="mdx-list-heading">Blog Posts</span>
            <span class="mdx-list-count" id="listCount"></span>
        </div>
        <button class="mdx-btn mdx-btn-accent" id="newPostBtn">${this._icon('plus')} New Post</button>
    </div>
    <div class="mdx-list-scroll" id="listScroll">
        <div class="mdx-state-box" id="listLoading">
            <svg class="mdx-spin-anim" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-opacity=".2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
            </svg>
            <p>Loading posts…</p>
        </div>
        <div id="listContent" style="display:none"></div>
    </div>
</div>

<!-- ═══ EDITOR VIEW ═══ -->
<div class="mdx-editor-view hidden" id="editorView">

    <!-- Tab bar -->
    <div class="mdx-tab-bar">
        <button class="mdx-tab active" data-tab="editor">${this._icon('edit')} Editor</button>
        <button class="mdx-tab" data-tab="preview">${this._icon('eye')} Preview</button>
        <button class="mdx-tab" data-tab="markdown">${this._icon('code')} Markdown</button>
        <button class="mdx-tab" data-tab="meta">${this._icon('gear')} Settings</button>
        <button class="mdx-tab" data-tab="seo">${this._icon('seo')} SEO</button>
    </div>

    <!-- Body -->
    <div class="mdx-editor-body">

        <!-- Editor Panel -->
        <div class="mdx-editor-panel" id="editorPanel">
            <div class="mdx-toast-editor-wrapper" id="toastEditorWrapper"></div>
        </div>

        <!-- Preview -->
        <div class="mdx-prev-panel" id="prevPanel">
            <div class="mdx-prev-inner" id="prevInner"></div>
        </div>

        <!-- Markdown -->
        <div class="mdx-md-panel" id="mdPanel">
            <textarea class="mdx-md-area" id="mdArea" readonly spellcheck="false"></textarea>
        </div>

        <!-- Post Settings -->
        <div class="mdx-meta-panel" id="metaPanel">
            <div class="mdx-meta-inner">${this._metaHTML()}</div>
        </div>

        <!-- SEO -->
        <div class="mdx-seo-panel" id="seoPanel">
            <div class="mdx-seo-inner">${this._seoHTML()}</div>
        </div>

    </div>
</div>

<!-- Toasts -->
<div class="mdx-toasts" id="toastArea"></div>
</div>
`; }

    _metaHTML() { return `
<div class="mdx-msec">
    <div class="mdx-msec-title">Post Details</div>
    <div class="mdx-mfields">
        <div class="mdx-mfield mdx-mfull"><label>Title</label><input class="mdx-minp" id="m-title" type="text" placeholder="Post title…" data-m="title"></div>
        <div class="mdx-mfield mdx-mfull"><label>Slug</label><input class="mdx-minp" id="m-slug" type="text" placeholder="post-url-slug" data-m="slug"></div>
        <div class="mdx-mfield mdx-mfull"><label>Excerpt</label><textarea class="mdx-mtxt" placeholder="Short description…" data-m="excerpt" rows="3"></textarea></div>
        <div class="mdx-mfield"><label>Author</label><input class="mdx-minp" type="text" placeholder="Author name" data-m="author"></div>
        <div class="mdx-mfield"><label>Category</label><input class="mdx-minp" type="text" placeholder="Category" data-m="category"></div>
        <div class="mdx-mfield mdx-mfull"><label>Tags (comma-separated)</label><input class="mdx-minp" type="text" placeholder="web, tech, javascript" data-m="tags"></div>
        <div class="mdx-mfield"><label>Status</label>
            <select class="mdx-msel" data-m="status"><option value="draft">Draft</option><option value="published">Published</option></select>
        </div>
        <div class="mdx-mfield"><label>Published Date</label><input class="mdx-minp" type="datetime-local" data-m="publishedDate"></div>
        <div class="mdx-mfield"><label>Modified Date</label><input class="mdx-minp" type="datetime-local" data-m="modifiedDate"></div>
        <div class="mdx-mfield"><label>Read Time (min)</label><input class="mdx-minp" type="number" placeholder="5" data-m="readTime"></div>
        <div class="mdx-mfield"><label>View Count</label><input class="mdx-minp" type="number" placeholder="0" data-m="viewCount"></div>
    </div>
    <div class="mdx-tog-row">
        <span class="mdx-tog-lbl">Featured Post</span>
        <label class="mdx-tog"><input type="checkbox" data-m="isFeatured" id="m-featured"><span class="mdx-tog-slider"></span></label>
    </div>
</div>
<div class="mdx-msec">
    <div class="mdx-msec-title">Author Image</div>
    <div class="mdx-fimg-zone" id="authorZone">
        <input type="file" id="authorFile" accept="image/*">${this._icon('image')}
        <p>Click to upload author image</p>
        <img class="mdx-fimg-prev" id="authorPrev" style="display:none">
    </div>
</div>
<div class="mdx-msec">
    <div class="mdx-msec-title">Featured Image</div>
    <div class="mdx-fimg-zone" id="featuredZone">
        <input type="file" id="featuredFile" accept="image/*">${this._icon('image')}
        <p>Click to upload featured image</p>
        <img class="mdx-fimg-prev" id="featuredPrev" style="display:none">
    </div>
</div>`; }

    _seoHTML() { return `
<div class="mdx-msec">
    <div class="mdx-msec-title">SEO Settings</div>
    <div class="mdx-mfields">
        <div class="mdx-mfield mdx-mfull"><label>SEO Title</label><input class="mdx-minp" type="text" placeholder="SEO title…" data-m="seoTitle"></div>
        <div class="mdx-mfield mdx-mfull"><label>SEO Description</label><textarea class="mdx-mtxt" placeholder="Meta description…" data-m="seoDescription" rows="3"></textarea></div>
        <div class="mdx-mfield mdx-mfull"><label>Keywords (comma-separated)</label><input class="mdx-minp" type="text" placeholder="keyword1, keyword2" data-m="seoKeywords"></div>
    </div>
</div>
<div class="mdx-msec">
    <div class="mdx-msec-title">Open Graph Image</div>
    <div class="mdx-fimg-zone" id="ogZone">
        <input type="file" id="ogFile" accept="image/*">${this._icon('image')}
        <p>Recommended: 1200×630px</p>
        <img class="mdx-fimg-prev" id="ogPrev" style="display:none">
    </div>
</div>`; }

    // ═════════════════════════════════════════════════════════
    // WIRE ALL EVENTS
    // ═════════════════════════════════════════════════════════
    _wire() {
        this.querySelector('#newPostBtn').addEventListener('click', () => this._openEditor(null));
        this.querySelectorAll('.mdx-tab').forEach(t => t.addEventListener('click', () => this._switchTab(t.dataset.tab)));

        this.querySelectorAll('[data-m]').forEach(el => {
            const evt = el.type === 'checkbox' ? 'change' : 'input';
            el.addEventListener(evt, () => {
                this._meta[el.dataset.m] = el.type === 'checkbox' ? el.checked : el.value;
            });
        });
        
        // Fixed slug auto-generation
        let isManualSlugEdit = false;
        const slugInput = this.querySelector('#m-slug');
        
        slugInput.addEventListener('input', () => {
            isManualSlugEdit = true;
        });
        
        this.querySelector('#m-title').addEventListener('input', (e) => {
            if (!isManualSlugEdit) {
                this._autoSlug(e.target.value);
            }
        });

        this._wireImgZone('authorZone',   'authorFile',   'authorPrev',   'authorImage');
        this._wireImgZone('featuredZone', 'featuredFile', 'featuredPrev', 'featuredImage');
        this._wireImgZone('ogZone',       'ogFile',       'ogPrev',       'seoOgImage');
    }

    _wireImgZone(zoneId, fileId, prevId, metaKey) {
        const zone = this.querySelector(`#${zoneId}`);
        const file = this.querySelector(`#${fileId}`);
        const prev = this.querySelector(`#${prevId}`);
        if (!zone || !file) return;
        zone.addEventListener('click', () => file.click());
        file.addEventListener('change', async e => {
            const f = e.target.files[0]; if (!f) return;
            if (prev) { prev.src = URL.createObjectURL(f); prev.style.display = 'block'; }
            this._emit('upload-meta-image', { fileData: await this._toBase64(f), filename: f.name, metaKey, optimize: true });
        });
    }

    // ═════════════════════════════════════════════════════════
    // LOAD TOAST UI EDITOR
    // ═════════════════════════════════════════════════════════
    async _loadToastEditor() {
        if (window.toastui && window.toastui.Editor) {
            this._toastEditorLoaded = true;
            return;
        }

        try {
            const script = document.createElement('script');
            script.src = 'https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js';
            script.onload = () => {
                console.log('✅ TOAST UI Editor library loaded');
                this._toastEditorLoaded = true;
            };
            script.onerror = () => {
                console.error('❌ Failed to load TOAST UI Editor');
                this._toast('error', 'Failed to load editor library');
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('❌ Error loading TOAST UI Editor:', error);
        }
    }

    // ═════════════════════════════════════════════════════════
    // INITIALIZE TOAST UI EDITOR
    // ═════════════════════════════════════════════════════════
    _initToastEditor(initialMarkdown = '') {
        if (!window.toastui || !window.toastui.Editor) {
            console.error('TOAST UI Editor not loaded yet');
            setTimeout(() => this._initToastEditor(initialMarkdown), 500);
            return;
        }

        const wrapper = this.querySelector('#toastEditorWrapper');
        if (!wrapper) return;

        // Create the editor container div
        const editorDiv = document.createElement('div');
        editorDiv.className = 'mdx-toast-editor-container';
        editorDiv.style.height = '100%';
        wrapper.appendChild(editorDiv);

        const self = this;

        try {
            this._toastEditor = new toastui.Editor({
                el: editorDiv,
                height: '100%',
                initialEditType: 'wysiwyg',
                previewStyle: 'vertical',
                initialValue: initialMarkdown,
                usageStatistics: false,
                toolbarItems: [
                    ['heading', 'bold', 'italic', 'strike'],
                    ['hr', 'quote'],
                    ['ul', 'ol', 'task', 'indent', 'outdent'],
                    ['table', 'image', 'link'],
                    ['code', 'codeblock']
                ],
                hooks: {
                    addImageBlobHook: async (blob, callback) => {
                        try {
                            const fileData = await self._toBase64(blob);
                            
                            self._pendingImageUpload = { callback };
                            
                            self._emit('upload-image', {
                                blockId: 'editor-' + Date.now(),
                                fileData: fileData,
                                filename: blob.name || 'image.jpg',
                                optimize: true
                            });
                        } catch (error) {
                            console.error('Image upload error:', error);
                            self._toast('error', 'Image upload failed');
                        }
                    }
                }
            });

            // Listen for content changes
            this._toastEditor.on('change', () => {
                this._currentMarkdown = this._toastEditor.getMarkdown();
            });

            console.log('✅ TOAST UI Editor initialized');
        } catch (error) {
            console.error('❌ Error initializing TOAST UI Editor:', error);
            this._toast('error', 'Failed to initialize editor: ' + error.message);
        }
    }

    // ═════════════════════════════════════════════════════════
    // VIEW MANAGEMENT
    // ═════════════════════════════════════════════════════════
    _showListView() {
        this.querySelector('#listView').classList.remove('hidden');
        this.querySelector('#editorView').classList.add('hidden');
        this.querySelector('#topActs').innerHTML = '';
        this._currentView = 'list';
        this.querySelector('#listLoading').style.display = 'flex';
        this.querySelector('#listContent').style.display = 'none';
        
        // Destroy editor when leaving
        if (this._toastEditor) {
            try {
                this._toastEditor.destroy();
                this._toastEditor = null;
            } catch(e) { console.error('Error destroying editor:', e); }
        }
    }

    _showEditorView() {
        this.querySelector('#listView').classList.add('hidden');
        this.querySelector('#editorView').classList.remove('hidden');
        this._currentView = 'editor';

        const isNew = !this._editPost;
        this.querySelector('#topActs').innerHTML = `
            <button class="mdx-btn mdx-btn-ghost" id="backBtn">${this._icon('back')} All Posts</button>
            <button class="mdx-btn mdx-btn-ghost" id="draftBtn">${this._icon('save')} Save Draft</button>
            <button class="mdx-btn mdx-btn-accent" id="pubBtn">${this._icon('check')} ${isNew ? 'Publish' : 'Update'}</button>`;

        this.querySelector('#backBtn').addEventListener('click', () => {
            this._showListView();
            this._emit('load-post-list', {});
        });
        this.querySelector('#draftBtn').addEventListener('click', () => this._save('draft'));
        this.querySelector('#pubBtn').addEventListener('click',   () => this._save('published'));
    }

    _openEditor(post) {
        this._editPost = post;
        this._resetEditorState();
        
        const initialMarkdown = post?.content || '';
        
        if (post) {
            this._populateEditor(post);
        }
        
        this._showEditorView();
        this._switchTab('editor');
        
        // Clear previous editor instance if exists
        const wrapper = this.querySelector('#toastEditorWrapper');
        if (wrapper) wrapper.innerHTML = '';
        
        setTimeout(() => {
            this._initToastEditor(initialMarkdown);
        }, 200);
    }

    // ═════════════════════════════════════════════════════════
    // POSTS LIST
    // ═════════════════════════════════════════════════════════
    _onPostList(data) {
        this.querySelector('#listLoading').style.display = 'none';
        const content = this.querySelector('#listContent');
        content.style.display = 'block';

        this._posts = data.posts || [];
        const total = data.totalCount || this._posts.length;
        this.querySelector('#listCount').textContent = `(${total})`;

        if (!this._posts.length) {
            content.innerHTML = `<div class="mdx-state-box">${this._icon('image')}<p>No posts yet. Click "New Post" to create your first!</p></div>`;
            return;
        }

        content.innerHTML = `
<table class="mdx-posts-table">
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

        const tbody = content.querySelector('#postsBody');
        this._posts.forEach((post, idx) => {
            const tr = document.createElement('tr');
            const dateStr = post.publishedDate
                ? new Date(post.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : '—';
            const badgeClass = post.status === 'published' ? 'mdx-badge-pub' : 'mdx-badge-draft';

            tr.innerHTML = `
<td class="mdx-col-title">
    <div class="mdx-post-title-txt">${post.title || '(Untitled)'}</div>
    <div class="mdx-post-slug">${post.slug || ''}</div>
</td>
<td>${post.category || '—'}</td>
<td><span class="mdx-badge ${badgeClass}">${post.status || 'draft'}</span></td>
<td style="white-space:nowrap;font-size:13px">${dateStr}</td>
<td>
    <div class="mdx-row-actions">
        <button class="mdx-btn mdx-btn-light mdx-btn-sm edit-btn" data-i="${idx}">${this._icon('edit')} Edit</button>
        <button class="mdx-btn mdx-btn-red   mdx-btn-sm del-btn"  data-i="${idx}">${this._icon('trash')} Delete</button>
    </div>
</td>`;
            tbody.appendChild(tr);
        });

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
    // TABS
    // ═════════════════════════════════════════════════════════
    _switchTab(tab) {
        this._tab = tab;

        this.querySelectorAll('.mdx-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

        this.querySelector('#editorPanel').style.display = tab === 'editor' ? 'flex' : 'none';
        this.querySelector('#prevPanel').classList.toggle('active',  tab === 'preview');
        this.querySelector('#mdPanel').classList.toggle('active',    tab === 'markdown');
        this.querySelector('#metaPanel').classList.toggle('active',  tab === 'meta');
        this.querySelector('#seoPanel').classList.toggle('active',   tab === 'seo');

        if (tab === 'preview')  this._buildPreview();
        if (tab === 'markdown') this.querySelector('#mdArea').value = this._currentMarkdown || '';
    }

    _buildPreview() {
        const markdown = this._currentMarkdown || '';
        this.querySelector('#prevInner').innerHTML = this._mdToHtml(markdown);
    }

    _mdToHtml(md) {
        // Simple markdown to HTML converter
        return md
            .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
            .replace(/^##### (.+)$/gm,  '<h5>$1</h5>')
            .replace(/^#### (.+)$/gm,   '<h4>$1</h4>')
            .replace(/^### (.+)$/gm,    '<h3>$1</h3>')
            .replace(/^## (.+)$/gm,     '<h2>$1</h2>')
            .replace(/^# (.+)$/gm,      '<h1>$1</h1>')
            .replace(/^---$/gm,         '<hr>')
            .replace(/^> (.+)$/gm,      '<blockquote>$1</blockquote>')
            .replace(/```(\w+)?\n([\s\S]*?)```/gm, '<pre><code>$2</code></pre>')
            .replace(/`([^`]+)`/g,      '<code>$1</code>')
            .replace(/\*\*(.+?)\*\*/g,  '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g,      '<em>$1</em>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1">')
            .replace(/^- (.+)$/gm,      '<li>$1</li>')
            .replace(/^\d+\. (.+)$/gm,  '<li>$1</li>')
            .replace(/^(?!<[h1-6ublptd]|<hr|<pre)(.+)$/gm, '<p>$1</p>');
    }

    // ═════════════════════════════════════════════════════════
    // EDITOR STATE
    // ═════════════════════════════════════════════════════════
    _resetEditorState() {
        this._currentMarkdown = '';
        this._meta = this._freshMeta();
        this.querySelectorAll('[data-m]').forEach(el => {
            if (el.type === 'checkbox') el.checked = false; else el.value = '';
        });
        ['authorPrev','featuredPrev','ogPrev'].forEach(id => {
            const el = this.querySelector(`#${id}`); if (el) { el.src = ''; el.style.display = 'none'; }
        });
    }

    _populateEditor(data) {
        if (!data) return;
        
        Object.keys(this._meta).forEach(k => { 
            if (data[k] !== undefined) this._meta[k] = data[k]; 
        });
        
        this.querySelectorAll('[data-m]').forEach(el => {
            const k = el.dataset.m;
            if (el.type === 'checkbox') el.checked = !!this._meta[k];
            else el.value = this._meta[k] || '';
        });
        
        this._currentMarkdown = data.content || '';
        
        if (data.authorImage) {
            const prev = this.querySelector('#authorPrev');
            if (prev) { prev.src = data.authorImage; prev.style.display = 'block'; }
        }
        if (data.featuredImage) {
            const prev = this.querySelector('#featuredPrev');
            if (prev) { prev.src = data.featuredImage; prev.style.display = 'block'; }
        }
        if (data.seoOgImage) {
            const prev = this.querySelector('#ogPrev');
            if (prev) { prev.src = data.seoOgImage; prev.style.display = 'block'; }
        }
    }

    // ═════════════════════════════════════════════════════════
    // SAVE
    // ═════════════════════════════════════════════════════════
    _save(status) {
        const md = this._currentMarkdown || '';
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
    // IMAGE UPLOAD
    // ═════════════════════════════════════════════════════════
    _wixUrl(url) {
        if (!url || url.startsWith('http')) return url;
        const m = url.match(/^wix:image:\/\/v1\/([^/]+)\//);
        return m ? `https://static.wixstatic.com/media/${m[1]}` : url;
    }

    _onUploadResult(data) {
        if (data.blockId && this._pendingImageUpload) {
            const publicUrl = this._wixUrl(data.url);
            this._pendingImageUpload.callback(publicUrl);
            this._pendingImageUpload = null;
            this._toast('success', 'Image uploaded!');
        }
        if (data.metaKey) {
            this._meta[data.metaKey] = this._wixUrl(data.url);
            this._toast('success', 'Image uploaded!');
        }
    }

    // ═════════════════════════════════════════════════════════
    // HELPERS
    // ═════════════════════════════════════════════════════════
    _autoSlug(title) {
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        const el = this.querySelector('#m-slug');
        if (el) { 
            el.value = slug; 
            this._meta.slug = slug; 
        }
    }

    _emit(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }

    _toast(type, msg) {
        const area = this.querySelector('#toastArea');
        const t = document.createElement('div');
        t.className = `mdx-toast mdx-toast-${type}`;
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
console.log('✍️ MdxBlogEditor v5 (Light DOM + TOAST UI) registered');
