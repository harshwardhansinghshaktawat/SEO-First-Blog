class MdxBlogEditor extends HTMLElement {
    constructor() {
        super();
        this._currentView = 'list';
        this._posts = [];
        this._editPost = null;
        this._toastEditor = null;
        this._tab = 'editor';
        this._meta = this._freshMeta();
        this._initialized = false;
        this._seoScore = 0;
        this._readabilityScore = 0;
        this._seoAnalysis = [];
        this._readabilityAnalysis = [];
    }

    _freshMeta() {
        return {
            blogTitle: '',
            slug: '',
            excerpt: '',
            author: '',
            authorImage: '',
            category: '',
            tags: '',
            status: 'draft',
            publishedDate: '',
            modifiedDate: '',
            readTime: 0,
            viewCount: 0,
            isFeatured: false,
            featuredImage: '',
            seoTitle: '',
            seoDescription: '',
            seoOgImage: '',
            seoKeywords: '',
            focusKeyphrase: '',
            relatedPosts: [],
            internalLinks: []
        };
    }

    static get observedAttributes() {
        return ['post-list','upload-result','save-result','delete-result','notification','load-data','search-results'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (!newVal || newVal === oldVal) return;
        
        if (name === 'post-list') {
            if (!this._initialized) {
                this._pendingPostList = newVal;
                return;
            }
        }
        
        if (!this._initialized) return;
        
        try {
            const d = JSON.parse(newVal);
            if (name === 'post-list') this._onPostList(d);
            if (name === 'upload-result') this._onUploadResult(d);
            if (name === 'save-result') this._onSaveResult(d);
            if (name === 'delete-result') this._onDeleteResult(d);
            if (name === 'notification') this._toast(d.type, d.message);
            if (name === 'load-data') this._populateEditor(d);
            if (name === 'search-results') this._onSearchResults(d);
        } catch(e) {}
    }

    connectedCallback() {
        if (this._initialized) return;
        
        requestAnimationFrame(() => {
            this._inject();
            this._wire();
            this._initialized = true;
            
            if (this._pendingPostList) {
                try {
                    const d = JSON.parse(this._pendingPostList);
                    this._onPostList(d);
                    this._pendingPostList = null;
                } catch(e) {}
            }
            
            this._emit('load-post-list', {});
        });
    }

    disconnectedCallback() {
        if (this._toastEditor) {
            try {
                this._toastEditor.destroy();
                this._toastEditor = null;
            } catch(e) {}
        }
    }

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
            video:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
            html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
            book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
            link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
            search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
        };
        return I[k] || I.edit;
    }

    _inject() {
        if (!document.getElementById('toast-editor-css')) {
            const cssLink = document.createElement('link');
            cssLink.id = 'toast-editor-css';
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://uicdn.toast.com/editor/latest/toastui-editor.min.css';
            document.head.appendChild(cssLink);
        }

        if (!document.getElementById('mdx-editor-styles')) {
            const style = document.createElement('style');
            style.id = 'mdx-editor-styles';
            style.textContent = this._styles();
            document.head.appendChild(style);
        }

        const container = document.createElement('div');
        container.className = 'mdx-host';
        container.innerHTML = this._shellHTML();
        
        this.innerHTML = '';
        this.appendChild(container);

        this._loadToastEditor();
    }

    _styles() { 
        return `
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
    --red: #cf1322;
    --orange: #fa8c16;
    --r: 8px;
    --shadow-sm: 0 2px 8px rgba(0,0,0,.08);
    --shadow: 0 8px 32px rgba(0,0,0,.14);
    background: var(--paper);
    color: var(--ink);
}

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
mdx-blog-editor .mdx-btn-light  { background: var(--paper2); color: var(--ink2); border: 1px solid var(--border); }
mdx-blog-editor .mdx-btn-light:hover  { background: var(--paper3); }
mdx-blog-editor .mdx-btn-red    { background: #fff2f0; color: #a8071a; border: 1px solid #ffccc7; }
mdx-blog-editor .mdx-btn-red:hover    { background: #ffccc7; }
mdx-blog-editor .mdx-btn-sm { padding: 5px 10px; font-size: 12px; }

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

mdx-blog-editor .mdx-editor-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}
mdx-blog-editor .mdx-editor-view.hidden { display: none; }

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

mdx-blog-editor .mdx-editor-body {
    display: flex;
    flex: 1;
    overflow: hidden;
    min-height: 0;
    position: relative;
}

mdx-blog-editor .mdx-editor-main {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}

mdx-blog-editor .mdx-blog-title-bar {
    padding: 16px 20px;
    background: #fff;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}

mdx-blog-editor .mdx-blog-title-input {
    width: 100%;
    border: none;
    outline: none;
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--ink);
    background: transparent;
    padding: 0;
}

mdx-blog-editor .mdx-blog-title-input::placeholder {
    color: var(--ink3);
    opacity: 0.5;
}

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

mdx-blog-editor .mdx-sidebar {
    width: 340px;
    background: var(--paper);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
}

mdx-blog-editor .mdx-sidebar.hidden {
    display: none;
}

mdx-blog-editor .mdx-sidebar-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

mdx-blog-editor .mdx-sidebar-scroll::-webkit-scrollbar { width: 5px; }
mdx-blog-editor .mdx-sidebar-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

mdx-blog-editor .mdx-score-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 16px;
    margin-bottom: 16px;
}

mdx-blog-editor .mdx-score-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .6px;
    color: var(--ink3);
    margin-bottom: 12px;
}

mdx-blog-editor .mdx-score-circle {
    width: 120px;
    height: 120px;
    margin: 0 auto 12px;
    position: relative;
}

mdx-blog-editor .mdx-score-svg {
    transform: rotate(-90deg);
}

mdx-blog-editor .mdx-score-bg {
    fill: none;
    stroke: var(--paper3);
    stroke-width: 8;
}

mdx-blog-editor .mdx-score-fg {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.5s ease;
}

mdx-blog-editor .mdx-score-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 32px;
    font-weight: 700;
}

mdx-blog-editor .mdx-score-label {
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    margin-top: -8px;
}

mdx-blog-editor .mdx-analysis-item {
    display: flex;
    gap: 10px;
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 8px;
    font-size: 13px;
    line-height: 1.5;
}

mdx-blog-editor .mdx-analysis-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    margin-top: 1px;
}

mdx-blog-editor .mdx-analysis-good {
    background: #f6ffed;
    border: 1px solid #b7eb8f;
}

mdx-blog-editor .mdx-analysis-good .mdx-analysis-icon {
    background: var(--green);
    color: #fff;
}

mdx-blog-editor .mdx-analysis-ok {
    background: #fffbe6;
    border: 1px solid #ffe58f;
}

mdx-blog-editor .mdx-analysis-ok .mdx-analysis-icon {
    background: var(--orange);
    color: #fff;
}

mdx-blog-editor .mdx-analysis-bad {
    background: #fff2f0;
    border: 1px solid #ffccc7;
}

mdx-blog-editor .mdx-analysis-bad .mdx-analysis-icon {
    background: var(--red);
    color: #fff;
}

mdx-blog-editor .mdx-keyphrase-section {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 16px;
    margin-bottom: 16px;
}

mdx-blog-editor .mdx-keyphrase-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink3);
    margin-bottom: 6px;
    display: block;
}

mdx-blog-editor .mdx-keyphrase-input {
    width: 100%;
    padding: 8px 10px;
    border: 1.5px solid var(--border);
    border-radius: 5px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    background: var(--paper);
    color: var(--ink);
    outline: none;
}

mdx-blog-editor .mdx-keyphrase-input:focus {
    border-color: var(--accent);
}

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

mdx-blog-editor .mdx-prev-inner .video-embed {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    overflow: hidden;
    max-width: 100%;
    margin: 16px 0;
    border-radius: var(--r);
}

mdx-blog-editor .mdx-prev-inner .video-embed iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
}

mdx-blog-editor .mdx-md-panel { display: none; flex: 1; min-height: 0; background: #1e1e2e; }
mdx-blog-editor .mdx-md-panel.active { display: flex; flex-direction: column; }
mdx-blog-editor .mdx-md-area { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.6; padding: 22px; border: none; outline: none; resize: none; background: #1e1e2e; color: #cdd6f4; }

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
mdx-blog-editor .mdx-minp:read-only { background: var(--paper2); cursor: not-allowed; }
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

mdx-blog-editor .mdx-related-search {
    width: 100%;
    padding: 8px 10px;
    border: 1.5px solid var(--border);
    border-radius: 5px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    background: var(--paper);
    color: var(--ink);
    outline: none;
}

mdx-blog-editor .mdx-related-search:focus {
    border-color: var(--accent);
}

mdx-blog-editor .mdx-related-results {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--border);
    border-radius: 5px;
    margin-top: 8px;
    background: #fff;
}

mdx-blog-editor .mdx-related-results::-webkit-scrollbar { width: 5px; }
mdx-blog-editor .mdx-related-results::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

mdx-blog-editor .mdx-related-item {
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
    transition: background .15s;
}

mdx-blog-editor .mdx-related-item:hover {
    background: var(--paper2);
}

mdx-blog-editor .mdx-related-item:last-child {
    border-bottom: none;
}

mdx-blog-editor .mdx-related-selected {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
}

mdx-blog-editor .mdx-related-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    background: var(--paper2);
    border: 1px solid var(--border);
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

mdx-blog-editor .mdx-related-remove {
    cursor: pointer;
    color: var(--red);
    font-weight: 700;
}

mdx-blog-editor .mdx-toasts { position: fixed; top: 14px; right: 14px; z-index: 9999; display: flex; flex-direction: column; gap: 7px; }
mdx-blog-editor .mdx-toast { padding: 11px 16px; border-radius: var(--r); font-size: 13px; font-weight: 500; box-shadow: var(--shadow); animation: mdx-tIn .25s ease; max-width: 340px; font-family: 'DM Sans', sans-serif; }
@keyframes mdx-tIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
mdx-blog-editor .mdx-toast-success { background: #f6ffed; border: 1px solid #b7eb8f; color: #135200; }
mdx-blog-editor .mdx-toast-error   { background: #fff2f0; border: 1px solid #ffccc7; color: #a8071a; }
mdx-blog-editor .mdx-toast-info    { background: #e6f4ff; border: 1px solid #91caff; color: #003eb3; }

@media (max-width: 1200px) {
    mdx-blog-editor .mdx-sidebar {
        width: 300px;
    }
}

@media (max-width: 900px) {
    mdx-blog-editor .mdx-sidebar {
        display: none;
    }
    mdx-blog-editor .mdx-prev-inner { padding: 16px; }
    mdx-blog-editor .mdx-mfields { grid-template-columns: 1fr; }
}
`; }

    _shellHTML() { return `
<div class="mdx-top-bar">
    <div class="mdx-brand">MDX<span>Blocks</span></div>
    <div class="mdx-top-acts" id="topActs"></div>
</div>

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

<div class="mdx-editor-view hidden" id="editorView">
    <div class="mdx-tab-bar">
        <button class="mdx-tab active" data-tab="editor">${this._icon('edit')} Editor</button>
        <button class="mdx-tab" data-tab="preview">${this._icon('eye')} Preview</button>
        <button class="mdx-tab" data-tab="markdown">${this._icon('code')} Markdown</button>
        <button class="mdx-tab" data-tab="meta">${this._icon('gear')} Settings</button>
        <button class="mdx-tab" data-tab="seo">${this._icon('seo')} SEO</button>
    </div>

    <div class="mdx-editor-body">
        <div class="mdx-editor-main">
            <div class="mdx-blog-title-bar" id="blogTitleBar" style="display:none;">
                <input type="text" 
                       class="mdx-blog-title-input" 
                       id="blogTitleInput" 
                       placeholder="Add your blog title here..."
                       data-m="blogTitle">
            </div>

            <div class="mdx-editor-panel" id="editorPanel">
                <div class="mdx-toast-editor-wrapper" id="toastEditorWrapper"></div>
            </div>

            <div class="mdx-prev-panel" id="prevPanel">
                <div class="mdx-prev-inner" id="prevInner"></div>
            </div>

            <div class="mdx-md-panel" id="mdPanel">
                <textarea class="mdx-md-area" id="mdArea" readonly spellcheck="false"></textarea>
            </div>

            <div class="mdx-meta-panel" id="metaPanel">
                <div class="mdx-meta-inner">${this._metaHTML()}</div>
            </div>

            <div class="mdx-seo-panel" id="seoPanel">
                <div class="mdx-seo-inner">${this._seoHTML()}</div>
            </div>
        </div>

        <div class="mdx-sidebar" id="seoSidebar">
            <div class="mdx-sidebar-scroll">
                <div class="mdx-keyphrase-section">
                    <label class="mdx-keyphrase-label">Focus Keyphrase</label>
                    <input type="text" 
                           class="mdx-keyphrase-input" 
                           id="focusKeyphrase"
                           placeholder="Enter your focus keyword..."
                           data-m="focusKeyphrase">
                </div>

                <div class="mdx-score-card">
                    <div class="mdx-score-title">SEO Analysis</div>
                    <div class="mdx-score-circle">
                        <svg class="mdx-score-svg" width="120" height="120">
                            <circle class="mdx-score-bg" cx="60" cy="60" r="52"/>
                            <circle class="mdx-score-fg" id="seoScoreCircle" cx="60" cy="60" r="52" 
                                    stroke-dasharray="326.73" stroke-dashoffset="326.73"/>
                        </svg>
                        <div class="mdx-score-text" id="seoScoreText">0</div>
                    </div>
                    <div class="mdx-score-label" id="seoScoreLabel">Needs improvement</div>
                    <div id="seoAnalysisItems"></div>
                </div>

                <div class="mdx-score-card">
                    <div class="mdx-score-title">Readability Analysis</div>
                    <div class="mdx-score-circle">
                        <svg class="mdx-score-svg" width="120" height="120">
                            <circle class="mdx-score-bg" cx="60" cy="60" r="52"/>
                            <circle class="mdx-score-fg" id="readScoreCircle" cx="60" cy="60" r="52"
                                    stroke-dasharray="326.73" stroke-dashoffset="326.73"/>
                        </svg>
                        <div class="mdx-score-text" id="readScoreText">0</div>
                    </div>
                    <div class="mdx-score-label" id="readScoreLabel">Needs improvement</div>
                    <div id="readAnalysisItems"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="mdx-toasts" id="toastArea"></div>
`; }

    _metaHTML() { return `
<div class="mdx-msec">
    <div class="mdx-msec-title">Post Details</div>
    <div class="mdx-mfields">
        <div class="mdx-mfield mdx-mfull"><label>Slug</label><input class="mdx-minp" id="m-slug" type="text" placeholder="post-url-slug" data-m="slug" readonly></div>
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
    <div class="mdx-msec-title">Related Posts</div>
    <div style="padding: 14px;">
        <input type="text" 
               class="mdx-related-search" 
               id="relatedSearch" 
               placeholder="Search posts to add as related...">
        <div class="mdx-related-results" id="relatedResults" style="display:none;"></div>
        <div class="mdx-related-selected" id="relatedSelected"></div>
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

    _wire() {
        this.querySelector('#newPostBtn').addEventListener('click', () => this._openEditor(null));
        this.querySelectorAll('.mdx-tab').forEach(t => t.addEventListener('click', () => this._switchTab(t.dataset.tab)));

        this.querySelectorAll('[data-m]').forEach(el => {
            const evt = el.type === 'checkbox' ? 'change' : 'input';
            el.addEventListener(evt, () => {
                this._meta[el.dataset.m] = el.type === 'checkbox' ? el.checked : el.value;
                
                if (['blogTitle', 'focusKeyphrase', 'seoTitle', 'seoDescription'].includes(el.dataset.m)) {
                    this._runSEOAnalysis();
                }
            });
        });
        
        let isManualSlugEdit = false;
        const slugInput = this.querySelector('#m-slug');
        const blogTitleInput = this.querySelector('#blogTitleInput');
        
        blogTitleInput.addEventListener('input', (e) => {
            this._meta.blogTitle = e.target.value;
            if (!isManualSlugEdit) {
                this._autoSlug(e.target.value);
            }
            this._runSEOAnalysis();
        });

        this._wireImgZone('authorZone', 'authorFile', 'authorPrev', 'authorImage');
        this._wireImgZone('featuredZone', 'featuredFile', 'featuredPrev', 'featuredImage');
        this._wireImgZone('ogZone', 'ogFile', 'ogPrev', 'seoOgImage');
        
        this._wireRelatedPosts();
    }

    _wireRelatedPosts() {
        const searchInput = this.querySelector('#relatedSearch');
        const resultsDiv = this.querySelector('#relatedResults');
        const selectedDiv = this.querySelector('#relatedSelected');
        
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                resultsDiv.style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                this._emit('search-posts', { query });
            }, 300);
        });
        
        this._renderRelatedPosts();
    }

    _onSearchResults(data) {
        const resultsDiv = this.querySelector('#relatedResults');
        const posts = data.posts || [];
        
        if (!posts.length) {
            resultsDiv.style.display = 'none';
            return;
        }
        
        const currentPostId = this._editPost?._id;
        const selectedIds = this._meta.relatedPosts || [];
        
        const filteredPosts = posts.filter(p => p._id !== currentPostId && !selectedIds.includes(p._id));
        
        if (!filteredPosts.length) {
            resultsDiv.style.display = 'none';
            return;
        }
        
        resultsDiv.innerHTML = filteredPosts.map(post => `
            <div class="mdx-related-item" data-id="${post._id}" data-title="${post.blogTitle || post.title}">
                ${post.blogTitle || post.title}
            </div>
        `).join('');
        
        resultsDiv.style.display = 'block';
        
        resultsDiv.querySelectorAll('.mdx-related-item').forEach(item => {
            item.addEventListener('click', () => {
                const postId = item.dataset.id;
                const postTitle = item.dataset.title;
                
                if (!this._meta.relatedPosts) this._meta.relatedPosts = [];
                if (!this._meta.relatedPosts.includes(postId)) {
                    this._meta.relatedPosts.push(postId);
                    this._renderRelatedPosts();
                }
                
                resultsDiv.style.display = 'none';
                this.querySelector('#relatedSearch').value = '';
            });
        });
    }

    _renderRelatedPosts() {
        const selectedDiv = this.querySelector('#relatedSelected');
        if (!selectedDiv) return;
        
        const relatedIds = this._meta.relatedPosts || [];
        
        if (!relatedIds.length) {
            selectedDiv.innerHTML = '';
            return;
        }
        
        const relatedPosts = relatedIds.map(id => {
            const post = this._posts.find(p => p._id === id);
            return post ? { id, title: post.blogTitle || post.title } : { id, title: 'Unknown Post' };
        });
        
        selectedDiv.innerHTML = relatedPosts.map(post => `
            <div class="mdx-related-tag">
                ${post.title}
                <span class="mdx-related-remove" data-id="${post.id}">×</span>
            </div>
        `).join('');
        
        selectedDiv.querySelectorAll('.mdx-related-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.id;
                this._meta.relatedPosts = this._meta.relatedPosts.filter(id => id !== postId);
                this._renderRelatedPosts();
            });
        });
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

    async _loadToastEditor() {
        if (window.toastui && window.toastui.Editor) {
            this._toastEditorLoaded = true;
            return;
        }

        try {
            const script = document.createElement('script');
            script.src = 'https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js';
            script.onload = () => {
                this._toastEditorLoaded = true;
            };
            script.onerror = () => {
                this._toast('error', 'Failed to load editor library');
            };
            document.head.appendChild(script);
        } catch (error) {}
    }

    _initToastEditor(initialMarkdown = '') {
        if (!window.toastui || !window.toastui.Editor) {
            setTimeout(() => this._initToastEditor(initialMarkdown), 500);
            return;
        }

        const wrapper = this.querySelector('#toastEditorWrapper');
        if (!wrapper) return;

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
                autofocus: false,
                toolbarItems: [
                    ['heading', 'bold', 'italic', 'strike'],
                    ['hr', 'quote'],
                    ['ul', 'ol', 'task', 'indent', 'outdent'],
                    ['table', 'image', 'link'],
                    ['code', 'codeblock'],
                    [
                        {
                            el: this._createCustomButton('Video', 'video', () => this._insertVideoEmbed()),
                            tooltip: 'Insert YouTube/Vimeo Video'
                        },
                        {
                            el: this._createCustomButton('HTML', 'html', () => this._insertHTMLEmbed()),
                            tooltip: 'Insert HTML Embed'
                        }
                    ]
                ],
                events: {
                    change: () => {
                        let md = self._toastEditor.getMarkdown();
                        md = self._cleanMarkdown(md);
                        self._currentMarkdown = md;
                        self._runAnalysis();
                    }
                },
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
                            self._toast('error', 'Image upload failed');
                        }
                    }
                }
            });
        } catch (error) {
            this._toast('error', 'Failed to initialize editor: ' + error.message);
        }
    }

    _createCustomButton(text, icon, onClick) {
        const button = document.createElement('button');
        button.className = 'toastui-editor-toolbar-icons';
        button.style.cssText = 'background: none; border: none; color: #555; margin: 0; padding: 0 8px; cursor: pointer; font-size: 13px; font-weight: 500;';
        button.innerHTML = this._icon(icon);
        button.addEventListener('click', (e) => {
            e.preventDefault();
            onClick();
        });
        return button;
    }

    _insertVideoEmbed() {
        const url = prompt('Enter YouTube or Vimeo URL:');
        if (!url) return;

        let embedCode = '';
        
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (ytMatch) {
            embedCode = `[youtube:${ytMatch[1]}]`;
        }
        
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            embedCode = `[vimeo:${vimeoMatch[1]}]`;
        }

        if (embedCode) {
            this._toastEditor.insertText(embedCode);
            this._toast('success', 'Video embed added!');
        } else {
            this._toast('error', 'Invalid video URL');
        }
    }

    _insertHTMLEmbed() {
        const html = prompt('Enter HTML code to embed:');
        if (!html) return;

        const embedCode = `\n\n[html]\n${html}\n[/html]\n\n`;
        this._toastEditor.insertText(embedCode);
        this._toast('success', 'HTML embed added!');
    }

    _cleanMarkdown(md) {
        return md
            .replace(/^(#{1,6}\s+.+)\n\*\*\*\n/gm, '$1\n\n')
            .replace(/\\~\\~(.+?)\\~\\~/g, '~~$1~~')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\</g, '<')
            .replace(/\\\>/g, '>')
            .replace(/(\*\*\*\n){2,}/g, '***\n')
            .replace(/\*\*\*\n(#{1,6}\s)/g, '$1');
    }

    _showListView() {
        this.querySelector('#listView').classList.remove('hidden');
        this.querySelector('#editorView').classList.add('hidden');
        this.querySelector('#topActs').innerHTML = '';
        this._currentView = 'list';
        
        if (this._toastEditor) {
            try {
                this._toastEditor.destroy();
                this._toastEditor = null;
            } catch(e) {}
        }
        
        this._emit('load-post-list', {});
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
        });
        this.querySelector('#draftBtn').addEventListener('click', () => this._save('draft'));
        this.querySelector('#pubBtn').addEventListener('click', () => this._save('published'));
    }

    _openEditor(post) {
        this._editPost = post;
        this._resetEditorState();
        
        let initialMarkdown = '';
        
        if (post && post.content) {
            initialMarkdown = post.content;
            this._populateEditor(post);
        }
        
        this._showEditorView();
        this._switchTab('editor');
        
        const wrapper = this.querySelector('#toastEditorWrapper');
        if (wrapper) wrapper.innerHTML = '';
        
        setTimeout(() => {
            this._initToastEditor(initialMarkdown);
            if (post) {
                setTimeout(() => {
                    this._runAnalysis();
                }, 500);
            }
        }, 200);
    }

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
            const displayTitle = post.blogTitle || post.title || '(Untitled)';

            tr.innerHTML = `
<td class="mdx-col-title">
    <div class="mdx-post-title-txt">${displayTitle}</div>
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
                const idx = parseInt(btn.dataset.i);
                const post = this._posts[idx];
                this._openEditor(post);
            });
        });
        
        tbody.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = this._posts[parseInt(btn.dataset.i)];
                const displayTitle = p.blogTitle || p.title || 'this post';
                if (!confirm(`Delete "${displayTitle}"?\n\nThis cannot be undone.`)) return;
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

    _switchTab(tab) {
        this._tab = tab;

        this.querySelectorAll('.mdx-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

        const editorPanel = this.querySelector('#editorPanel');
        const blogTitleBar = this.querySelector('#blogTitleBar');
        const seoSidebar = this.querySelector('#seoSidebar');

        const showBlogTitle = tab === 'editor';
        const showSidebar = tab === 'editor';

        if (blogTitleBar) blogTitleBar.style.display = showBlogTitle ? 'block' : 'none';
        if (seoSidebar) seoSidebar.classList.toggle('hidden', !showSidebar);

        editorPanel.style.display = tab === 'editor' ? 'flex' : 'none';
        this.querySelector('#prevPanel').classList.toggle('active', tab === 'preview');
        this.querySelector('#mdPanel').classList.toggle('active', tab === 'markdown');
        this.querySelector('#metaPanel').classList.toggle('active', tab === 'meta');
        this.querySelector('#seoPanel').classList.toggle('active', tab === 'seo');

        if (tab === 'preview') this._buildPreview();
        if (tab === 'markdown') this.querySelector('#mdArea').value = this._currentMarkdown || '';
    }

    _buildPreview() {
        const markdown = this._currentMarkdown || '';
        const html = this._mdToHtml(markdown);
        
        const blogTitle = this._meta.blogTitle || '';
        const titleHtml = blogTitle ? `<h1>${blogTitle}</h1>` : '';
        
        this.querySelector('#prevInner').innerHTML = titleHtml + html;
    }

    _mdToHtml(md) {
        md = md.replace(/\[youtube:([a-zA-Z0-9_-]+)\]/g, (match, id) => {
            return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe></div>`;
        });

        md = md.replace(/\[vimeo:(\d+)\]/g, (match, id) => {
            return `<div class="video-embed"><iframe src="https://player.vimeo.com/video/${id}" allowfullscreen></iframe></div>`;
        });

        md = md.replace(/\[html\]([\s\S]*?)\[\/html\]/g, (match, html) => {
            return html;
        });

        return md
            .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
            .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
            .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^---$/gm, '<hr>')
            .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
            .replace(/```(\w+)?\n([\s\S]*?)```/gm, '<pre><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/~~(.+?)~~/g, '<del>$1</del>')
            .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
            .replace(/^[\*\-\+] (.+)$/gm, '<li>$1</li>')
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/^(?!<[h1-6ublptd]|<hr|<pre|<div)(.+)$/gm, '<p>$1</p>');
    }

    _resetEditorState() {
        this._currentMarkdown = '';
        this._meta = this._freshMeta();
        this.querySelectorAll('[data-m]').forEach(el => {
            if (el.type === 'checkbox') el.checked = false; else el.value = '';
        });
        ['authorPrev', 'featuredPrev', 'ogPrev'].forEach(id => {
            const el = this.querySelector(`#${id}`); if (el) { el.src = ''; el.style.display = 'none'; }
        });
        
        this._seoScore = 0;
        this._readabilityScore = 0;
        this._updateScoreDisplay();
        
        const relatedSelected = this.querySelector('#relatedSelected');
        if (relatedSelected) relatedSelected.innerHTML = '';
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
        
        this._renderRelatedPosts();
    }

    _save(status) {
        const md = this._cleanMarkdown(this._currentMarkdown || '');
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

    _autoSlug(title) {
        const baseSlug = title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        const existingSlugs = this._posts
            .filter(p => p._id !== this._editPost?._id)
            .map(p => p.slug);
        
        let slug = baseSlug;
        let counter = 1;
        
        while (existingSlugs.includes(slug)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        
        const el = this.querySelector('#m-slug');
        if (el) { 
            el.value = slug; 
            this._meta.slug = slug; 
        }
    }

    _runAnalysis() {
        this._runSEOAnalysis();
        this._runReadabilityAnalysis();
    }

    _runSEOAnalysis() {
        const checks = [];
        let score = 0;
        const maxScore = 100;
        
        const blogTitle = this._meta.blogTitle || '';
        const seoTitle = this._meta.seoTitle || '';
        const seoDesc = this._meta.seoDescription || '';
        const keyphrase = this._meta.focusKeyphrase || '';
        const content = this._currentMarkdown || '';
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

        if (keyphrase.length > 0) {
            score += 8;
            checks.push({ status: 'good', text: 'Focus keyphrase is set' });
        } else {
            checks.push({ status: 'bad', text: 'Set a focus keyphrase to target' });
        }

        if (keyphrase && blogTitle.toLowerCase().includes(keyphrase.toLowerCase())) {
            const position = blogTitle.toLowerCase().indexOf(keyphrase.toLowerCase());
            if (position === 0) {
                score += 12;
                checks.push({ status: 'good', text: 'Keyphrase appears at the beginning of title' });
            } else {
                score += 8;
                checks.push({ status: 'ok', text: 'Keyphrase appears in title but not at the beginning' });
            }
        } else if (keyphrase) {
            checks.push({ status: 'bad', text: 'Keyphrase should appear in blog title, preferably at the beginning' });
        }

        if (keyphrase && seoTitle.toLowerCase().includes(keyphrase.toLowerCase())) {
            score += 10;
            checks.push({ status: 'good', text: 'Keyphrase appears in SEO title' });
        } else if (keyphrase && seoTitle) {
            checks.push({ status: 'bad', text: 'Add keyphrase to SEO title' });
        }

        if (seoTitle.length >= 50 && seoTitle.length <= 60) {
            score += 10;
            checks.push({ status: 'good', text: `SEO title length is optimal (${seoTitle.length} chars)` });
        } else if (seoTitle.length > 0 && seoTitle.length < 70) {
            score += 5;
            checks.push({ status: 'ok', text: `SEO title: ${seoTitle.length} chars (optimal: 50-60)` });
        } else if (seoTitle.length > 70) {
            checks.push({ status: 'bad', text: `SEO title too long (${seoTitle.length} chars, max 60)` });
        } else {
            checks.push({ status: 'bad', text: 'Add SEO title (50-60 characters)' });
        }

        if (seoDesc.length >= 120 && seoDesc.length <= 160) {
            score += 12;
            checks.push({ status: 'good', text: `Meta description length optimal (${seoDesc.length} chars)` });
        } else if (seoDesc.length >= 100 && seoDesc.length < 170) {
            score += 7;
            checks.push({ status: 'ok', text: `Meta description: ${seoDesc.length} chars (optimal: 120-160)` });
        } else if (seoDesc.length > 170) {
            checks.push({ status: 'bad', text: `Meta description too long (${seoDesc.length} chars, max 160)` });
        } else {
            checks.push({ status: 'bad', text: 'Add meta description (120-160 characters)' });
        }

        if (keyphrase && seoDesc.toLowerCase().includes(keyphrase.toLowerCase())) {
            score += 10;
            checks.push({ status: 'good', text: 'Keyphrase appears in meta description' });
        } else if (keyphrase && seoDesc) {
            checks.push({ status: 'bad', text: 'Include keyphrase in meta description' });
        }

        if (wordCount >= 600) {
            score += 12;
            checks.push({ status: 'good', text: `Excellent content length (${wordCount} words)` });
        } else if (wordCount >= 300) {
            score += 8;
            checks.push({ status: 'ok', text: `Good content length (${wordCount} words)` });
        } else if (wordCount >= 150) {
            score += 4;
            checks.push({ status: 'ok', text: `Content is short (${wordCount} words, aim for 300+)` });
        } else {
            checks.push({ status: 'bad', text: `Content too short (${wordCount} words, minimum 300)` });
        }

        if (keyphrase && content) {
            const keyphraseCount = (content.toLowerCase().match(new RegExp(keyphrase.toLowerCase(), 'g')) || []).length;
            const density = wordCount > 0 ? (keyphraseCount / wordCount) * 100 : 0;
            
            if (density >= 0.5 && density <= 2.5) {
                score += 8;
                checks.push({ status: 'good', text: `Keyphrase density good (${density.toFixed(1)}%)` });
            } else if (density > 0 && density < 0.5) {
                score += 4;
                checks.push({ status: 'ok', text: `Use keyphrase more (${density.toFixed(1)}%, aim 0.5-2.5%)` });
            } else if (density > 2.5) {
                checks.push({ status: 'bad', text: `Keyphrase overused (${density.toFixed(1)}%, max 2.5%)` });
            } else {
                checks.push({ status: 'bad', text: 'Keyphrase not found in content' });
            }
            
            const firstParagraph = content.split('\n\n')[0] || '';
            if (firstParagraph.toLowerCase().includes(keyphrase.toLowerCase())) {
                score += 8;
                checks.push({ status: 'good', text: 'Keyphrase in first paragraph' });
            } else if (wordCount > 50) {
                checks.push({ status: 'bad', text: 'Add keyphrase to first paragraph' });
            }
        }

        const h1Count = (content.match(/^# /gm) || []).length;
        const h2Count = (content.match(/^## /gm) || []).length;
        const h3Count = (content.match(/^### /gm) || []).length;
        
        if (h1Count === 0 && h2Count > 0) {
            score += 6;
            checks.push({ status: 'good', text: 'Good heading structure' });
        } else if (h1Count > 1) {
            checks.push({ status: 'bad', text: 'Use only one H1 (use H2-H6 for subheadings)' });
        }
        
        if (h2Count > 0) {
            score += 4;
            checks.push({ status: 'good', text: `${h2Count} subheading${h2Count > 1 ? 's' : ''} found` });
        } else if (wordCount > 300) {
            checks.push({ status: 'bad', text: 'Add subheadings (H2) to structure content' });
        }

        const images = (content.match(/!\[/g) || []).length;
        if (images > 0) {
            score += 4;
            checks.push({ status: 'good', text: `${images} image${images > 1 ? 's' : ''} in content` });
            
            const altMissing = (content.match(/!\[\]\(/g) || []).length;
            if (altMissing > 0) {
                checks.push({ status: 'bad', text: `${altMissing} image${altMissing > 1 ? 's' : ''} missing alt text` });
            } else {
                score += 4;
                checks.push({ status: 'good', text: 'All images have alt text' });
            }
        } else if (wordCount > 300) {
            checks.push({ status: 'ok', text: 'Consider adding images' });
        }

        const internalLinks = (content.match(/\[([^\]]+)\]\((?!http)/g) || []).length;
        if (internalLinks >= 2) {
            score += 6;
            checks.push({ status: 'good', text: `${internalLinks} internal link${internalLinks > 1 ? 's' : ''}` });
        } else if (internalLinks === 1) {
            score += 3;
            checks.push({ status: 'ok', text: 'Add more internal links (2+ recommended)' });
        } else if (wordCount > 300) {
            checks.push({ status: 'bad', text: 'Add internal links to other content' });
        }

        const externalLinks = (content.match(/\[([^\]]+)\]\(http/g) || []).length;
        if (externalLinks > 0 && externalLinks <= 5) {
            score += 4;
            checks.push({ status: 'good', text: `${externalLinks} external link${externalLinks > 1 ? 's' : ''}` });
        } else if (externalLinks > 5) {
            checks.push({ status: 'ok', text: 'Many external links - ensure quality sources' });
        }

        this._seoScore = Math.min(score, maxScore);
        this._seoAnalysis = checks;
        this._updateScoreDisplay();
    }

    _runReadabilityAnalysis() {
        const checks = [];
        let score = 0;
        const maxScore = 100;
        
        const content = this._currentMarkdown || '';
        
        const textContent = content
            .replace(/```[\s\S]*?```/g, '')
            .replace(/^#{1,6}\s+.+$/gm, '');
        
        const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = textContent.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;

        if (wordCount === 0) {
            this._readabilityScore = 0;
            this._readabilityAnalysis = [{ status: 'bad', text: 'Start writing to analyze readability' }];
            this._updateScoreDisplay();
            return;
        }

        const avgSentenceLength = wordCount / Math.max(sentences.length, 1);
        if (avgSentenceLength <= 15) {
            score += 20;
            checks.push({ status: 'good', text: `Excellent sentence length (avg ${avgSentenceLength.toFixed(1)} words)` });
        } else if (avgSentenceLength <= 20) {
            score += 15;
            checks.push({ status: 'good', text: `Good sentence length (avg ${avgSentenceLength.toFixed(1)} words)` });
        } else if (avgSentenceLength <= 25) {
            score += 10;
            checks.push({ status: 'ok', text: `Acceptable sentences (avg ${avgSentenceLength.toFixed(1)} words, aim <20)` });
        } else {
            score += 5;
            checks.push({ status: 'bad', text: `Sentences too long (avg ${avgSentenceLength.toFixed(1)} words, aim <20)` });
        }

        const longSentences = sentences.filter(s => s.split(/\s+/).length > 25).length;
        const longSentenceRatio = longSentences / Math.max(sentences.length, 1);
        if (longSentenceRatio === 0) {
            score += 15;
            checks.push({ status: 'good', text: 'No overly long sentences' });
        } else if (longSentenceRatio < 0.25) {
            score += 10;
            checks.push({ status: 'ok', text: `${longSentences} long sentence${longSentences > 1 ? 's' : ''} (>25 words)` });
        } else {
            score += 3;
            checks.push({ status: 'bad', text: `${longSentences} very long sentences - split them up` });
        }

        const paragraphs = textContent.split(/\n\n+/).filter(p => p.trim().length > 0);
        const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 150).length;
        const paragraphRatio = longParagraphs / Math.max(paragraphs.length, 1);
        
        if (paragraphRatio === 0 && paragraphs.length > 0) {
            score += 15;
            checks.push({ status: 'good', text: 'All paragraphs concise' });
        } else if (paragraphRatio < 0.3) {
            score += 10;
            checks.push({ status: 'ok', text: 'Most paragraphs good length' });
        } else {
            score += 3;
            checks.push({ status: 'bad', text: `${longParagraphs} long paragraph${longParagraphs > 1 ? 's' : ''} (>150 words)` });
        }

        const headings = (content.match(/^#{2,6}\s/gm) || []).length;
        const wordsPerHeading = headings > 0 ? wordCount / headings : wordCount;
        
        if (headings > 0 && wordsPerHeading <= 250) {
            score += 15;
            checks.push({ status: 'good', text: 'Excellent use of subheadings' });
        } else if (headings > 0 && wordsPerHeading <= 400) {
            score += 10;
            checks.push({ status: 'ok', text: 'Good subheading distribution' });
        } else if (headings > 0) {
            score += 5;
            checks.push({ status: 'ok', text: 'Add more subheadings (every 250-300 words)' });
        } else if (wordCount > 300) {
            checks.push({ status: 'bad', text: 'Add subheadings to break up text' });
        }

        const transitionWords = [
            'however', 'therefore', 'furthermore', 'moreover', 'nevertheless', 'consequently',
            'additionally', 'meanwhile', 'similarly', 'likewise', 'thus', 'hence', 'also',
            'besides', 'first', 'second', 'third', 'finally', 'for example', 'for instance',
            'in addition', 'as a result', 'on the other hand', 'in contrast', 'in conclusion'
        ];
        
        const transitionCount = transitionWords.filter(word =>
            textContent.toLowerCase().includes(word)
        ).length;
        
        const transitionRatio = transitionCount / Math.max(paragraphs.length, 1);
        
        if (transitionRatio >= 0.3) {
            score += 12;
            checks.push({ status: 'good', text: 'Excellent use of transition words' });
        } else if (transitionRatio >= 0.2) {
            score += 8;
            checks.push({ status: 'ok', text: 'Good use of transition words' });
        } else if (transitionCount > 0) {
            score += 4;
            checks.push({ status: 'ok', text: 'Use more transition words for better flow' });
        } else if (wordCount > 200) {
            checks.push({ status: 'bad', text: 'Add transition words to improve flow' });
        }

        const passiveIndicators = ['was', 'were', 'been', 'being', 'is', 'are', 'am'];
        const passiveCount = passiveIndicators.reduce((count, word) => {
            const matches = textContent.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g'));
            return count + (matches ? matches.length : 0);
        }, 0);
        const passiveRatio = passiveCount / Math.max(sentences.length, 1);
        
        if (passiveRatio < 0.2) {
            score += 15;
            checks.push({ status: 'good', text: 'Excellent - very little passive voice' });
        } else if (passiveRatio < 0.3) {
            score += 12;
            checks.push({ status: 'good', text: 'Minimal passive voice' });
        } else if (passiveRatio < 0.5) {
            score += 6;
            checks.push({ status: 'ok', text: 'Some passive voice - use more active voice' });
        } else {
            checks.push({ status: 'bad', text: 'Too much passive voice - rewrite in active voice' });
        }

        const consecutiveSentences = this._findConsecutiveSentences(sentences);
        if (consecutiveSentences === 0) {
            score += 8;
            checks.push({ status: 'good', text: 'Good sentence variety' });
        } else if (consecutiveSentences < 3) {
            score += 5;
            checks.push({ status: 'ok', text: 'Vary sentence structure more' });
        } else {
            checks.push({ status: 'bad', text: `${consecutiveSentences} consecutive similar sentences` });
        }

        this._readabilityScore = Math.min(score, maxScore);
        this._readabilityAnalysis = checks;
        this._updateScoreDisplay();
    }

    _findConsecutiveSentences(sentences) {
        let maxConsecutive = 0;
        let currentConsecutive = 1;
        
        for (let i = 1; i < sentences.length; i++) {
            const prevWords = sentences[i - 1].trim().split(/\s+/).length;
            const currWords = sentences[i].trim().split(/\s+/).length;
            
            if (Math.abs(prevWords - currWords) <= 2) {
                currentConsecutive++;
                maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
            } else {
                currentConsecutive = 1;
            }
        }
        
        return maxConsecutive > 2 ? maxConsecutive : 0;
    }

    _updateScoreDisplay() {
        const seoCircle = this.querySelector('#seoScoreCircle');
        const seoText = this.querySelector('#seoScoreText');
        const seoLabel = this.querySelector('#seoScoreLabel');
        const seoItems = this.querySelector('#seoAnalysisItems');

        if (seoCircle && seoText && seoLabel) {
            const circumference = 326.73;
            const offset = circumference - (this._seoScore / 100) * circumference;
            
            seoCircle.style.strokeDashoffset = offset;
            seoText.textContent = this._seoScore;
            
            let color = '#cf1322';
            let label = 'Needs improvement';
            if (this._seoScore >= 80) {
                color = '#389e0d';
                label = 'Great!';
            } else if (this._seoScore >= 60) {
                color = '#fa8c16';
                label = 'Good';
            } else if (this._seoScore >= 40) {
                color = '#fa8c16';
                label = 'OK';
            }
            
            seoCircle.style.stroke = color;
            seoText.style.color = color;
            seoLabel.textContent = label;
            seoLabel.style.color = color;
        }

        if (seoItems) {
            seoItems.innerHTML = this._seoAnalysis.map(item => `
                <div class="mdx-analysis-item mdx-analysis-${item.status}">
                    <div class="mdx-analysis-icon">${item.status === 'good' ? '✓' : item.status === 'ok' ? '!' : '✕'}</div>
                    <div>${item.text}</div>
                </div>
            `).join('');
        }

        const readCircle = this.querySelector('#readScoreCircle');
        const readText = this.querySelector('#readScoreText');
        const readLabel = this.querySelector('#readScoreLabel');
        const readItems = this.querySelector('#readAnalysisItems');

        if (readCircle && readText && readLabel) {
            const circumference = 326.73;
            const offset = circumference - (this._readabilityScore / 100) * circumference;
            
            readCircle.style.strokeDashoffset = offset;
            readText.textContent = this._readabilityScore;
            
            let color = '#cf1322';
            let label = 'Needs improvement';
            if (this._readabilityScore >= 80) {
                color = '#389e0d';
                label = 'Easy to read!';
            } else if (this._readabilityScore >= 60) {
                color = '#fa8c16';
                label = 'Fairly easy';
            } else if (this._readabilityScore >= 40) {
                color = '#fa8c16';
                label = 'OK';
            }
            
            readCircle.style.stroke = color;
            readText.style.color = color;
            readLabel.textContent = label;
            readLabel.style.color = color;
        }

        if (readItems) {
            readItems.innerHTML = this._readabilityAnalysis.map(item => `
                <div class="mdx-analysis-item mdx-analysis-${item.status}">
                    <div class="mdx-analysis-icon">${item.status === 'good' ? '✓' : item.status === 'ok' ? '!' : '✕'}</div>
                    <div>${item.text}</div>
                </div>
            `).join('');
        }
    }

    _emit(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }

    _toast(type, msg) {
        const area = this.querySelector('#toastArea');
        if (!area) return;
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
