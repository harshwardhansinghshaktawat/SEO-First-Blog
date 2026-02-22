// ============================================================
// MDX BLOG EDITOR - Custom Element
// File: custom-element.js (Wix Blocks Custom Element)
// ============================================================

class MdxBlogEditor extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
        this._blocks = [];
        this._blockIdCounter = 0;
        this._uploadingImages = {};
        this._metaData = {
            title: '', slug: '', excerpt: '', author: '', authorImage: '',
            category: '', tags: '', status: 'draft', publishedDate: '',
            modifiedDate: '', readTime: 0, viewCount: 0, seoTitle: '',
            seoDescription: '', seoOgImage: '', seoKeywords: '',
            isFeatured: false, featuredImage: ''
        };
        this._activeTab = 'editor';
        this._dragSrcIdx = null;

        this._render();
        this._setupListeners();
        this._addBlock('paragraph');
    }

    static get observedAttributes() {
        return ['notification', 'upload-result', 'save-result', 'load-data'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (!newVal || newVal === oldVal) return;
        try {
            const data = JSON.parse(newVal);
            if (name === 'notification') this._showToast(data.type, data.message);
            if (name === 'upload-result') this._handleUploadResult(data);
            if (name === 'save-result') this._handleSaveResult(data);
            if (name === 'load-data') this._loadExistingPost(data);
        } catch (e) { console.error('MdxEditor attr error:', e); }
    }

    connectedCallback() { this._updatePreview(); }

    // ─── SVGS ────────────────────────────────────────────────
    _svg(type) {
        const svgs = {
            h1: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="2" y="17" font-size="11" font-weight="900" font-family="serif" fill="currentColor" stroke="none">H1</text></svg>`,
            h2: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="2" y="17" font-size="11" font-weight="900" font-family="serif" fill="currentColor" stroke="none">H2</text></svg>`,
            h3: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="2" y="17" font-size="11" font-weight="900" font-family="serif" fill="currentColor" stroke="none">H3</text></svg>`,
            h4: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="2" y="17" font-size="11" font-weight="900" font-family="serif" fill="currentColor" stroke="none">H4</text></svg>`,
            h5: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="2" y="17" font-size="11" font-weight="900" font-family="serif" fill="currentColor" stroke="none">H5</text></svg>`,
            h6: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="2" y="17" font-size="11" font-weight="900" font-family="serif" fill="currentColor" stroke="none">H6</text></svg>`,
            paragraph: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 4H7a4 4 0 0 0 0 8h3v8h3V4z"/><line x1="17" y1="4" x2="17" y2="20"/></svg>`,
            bold: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
            italic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
            strikethrough: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/><path d="M17.5 6.5C17.5 4.6 15.6 3 12 3S6.5 4.6 6.5 7c0 1.3.8 2.4 2 3"/><path d="M6.5 17c0 1.9 1.9 3.5 5.5 3.5s5.5-1.6 5.5-3.5c0-1.3-.8-2.4-2-3"/></svg>`,
            quote: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>`,
            ul: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>`,
            ol: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="1" y="8" font-size="5" fill="currentColor" stroke="none">1.</text><text x="1" y="14" font-size="5" fill="currentColor" stroke="none">2.</text><text x="1" y="20" font-size="5" fill="currentColor" stroke="none">3.</text></svg>`,
            code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
            inlineCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="10" rx="2"/><line x1="7" y1="12" x2="17" y2="12" stroke-dasharray="2 1.5"/></svg>`,
            link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
            image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
            hr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="12" x2="22" y2="12"/><circle cx="7" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="17" cy="12" r="2" fill="currentColor" stroke="none"/></svg>`,
            table: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
            tasklist: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="5" height="5" rx="1"/><polyline points="4.5 7.5 5.5 8.5 7.5 6.5" stroke-width="1.5"/><line x1="11" y1="7" x2="21" y2="7"/><rect x="3" y="14" width="5" height="5" rx="1"/><line x1="11" y1="16" x2="21" y2="16"/></svg>`,
            drag: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>`,
            delete: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
            add: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
            save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
            preview: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
            settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
            escape: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 4H4v16h5"/><polyline points="8 8 4 12 8 16"/></svg>`,
            upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>`,
            optimize: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
            copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
            check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
            nestedQuote: `<svg viewBox="0 0 24 24" fill="currentColor"><path opacity="0.4" d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>`,
            seo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M11 8v3l2 2" stroke-linecap="round"/></svg>`,
        };
        return svgs[type] || svgs.paragraph;
    }

    // ─── RENDER ──────────────────────────────────────────────
    _render() {
        this._shadow.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

            :host {
                display: block;
                width: 100%;
                height: 100%;
                min-height: 700px;
                font-family: 'DM Sans', sans-serif;
                --ink: #0f0f0f;
                --ink2: #3a3a3a;
                --ink3: #7a7a7a;
                --paper: #fafaf8;
                --paper2: #f2f1ee;
                --paper3: #e8e6e1;
                --accent: #d4380d;
                --accent2: #fa8c16;
                --green: #389e0d;
                --blue: #1677ff;
                --purple: #531dab;
                --border: #ddd9d2;
                --shadow: 0 2px 8px rgba(0,0,0,0.08);
                --shadow-lg: 0 8px 32px rgba(0,0,0,0.14);
                --radius: 8px;
                --toolbar-h: 52px;
                --tabbar-h: 46px;
                background: var(--paper);
                color: var(--ink);
            }

            /* ── LAYOUT ── */
            .editor-shell {
                display: flex;
                flex-direction: column;
                height: 100%;
                min-height: 700px;
                background: var(--paper);
                border: 1px solid var(--border);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: var(--shadow-lg);
            }

            /* ── TOP BAR ── */
            .top-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 16px;
                height: var(--toolbar-h);
                background: var(--ink);
                color: #fff;
                gap: 12px;
                flex-shrink: 0;
            }

            .top-bar-brand {
                font-family: 'Playfair Display', serif;
                font-size: 18px;
                font-weight: 900;
                letter-spacing: -0.5px;
                color: #fff;
                white-space: nowrap;
            }

            .top-bar-brand span { color: var(--accent2); }

            .top-bar-actions { display: flex; gap: 8px; align-items: center; }

            .btn-top {
                display: flex; align-items: center; gap: 6px;
                padding: 7px 14px;
                border-radius: var(--radius);
                border: none;
                font-family: 'DM Sans', sans-serif;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.15s;
            }

            .btn-top svg { width: 15px; height: 15px; flex-shrink: 0; }

            .btn-save { background: var(--accent); color: #fff; }
            .btn-save:hover { background: #b7310b; }
            .btn-draft { background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
            .btn-draft:hover { background: rgba(255,255,255,0.2); }

            /* ── TABS ── */
            .tab-bar {
                display: flex;
                align-items: center;
                height: var(--tabbar-h);
                background: var(--paper2);
                border-bottom: 2px solid var(--border);
                padding: 0 16px;
                gap: 4px;
                flex-shrink: 0;
            }

            .tab {
                display: flex; align-items: center; gap: 6px;
                padding: 8px 14px;
                border-radius: var(--radius) var(--radius) 0 0;
                border: none;
                background: transparent;
                color: var(--ink3);
                font-family: 'DM Sans', sans-serif;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s;
                border-bottom: 2px solid transparent;
                margin-bottom: -2px;
            }

            .tab svg { width: 15px; height: 15px; }
            .tab:hover { color: var(--ink); background: var(--paper3); }
            .tab.active { color: var(--accent); border-bottom-color: var(--accent); background: var(--paper); font-weight: 600; }

            /* ── TOOLBAR ── */
            .toolbar {
                display: flex;
                align-items: center;
                padding: 6px 12px;
                background: var(--paper);
                border-bottom: 1px solid var(--border);
                gap: 2px;
                flex-wrap: wrap;
                flex-shrink: 0;
                position: sticky;
                top: 0;
                z-index: 50;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            }

            .toolbar-sep {
                width: 1px;
                height: 24px;
                background: var(--border);
                margin: 0 4px;
            }

            .tb-btn {
                display: flex; align-items: center; justify-content: center;
                width: 32px; height: 32px;
                border: none;
                border-radius: 6px;
                background: transparent;
                color: var(--ink2);
                cursor: pointer;
                transition: all 0.12s;
                position: relative;
            }

            .tb-btn svg { width: 16px; height: 16px; }
            .tb-btn:hover { background: var(--paper2); color: var(--ink); }
            .tb-btn.active { background: var(--accent); color: #fff; }

            .tb-tooltip {
                position: absolute;
                bottom: calc(100% + 6px);
                left: 50%;
                transform: translateX(-50%);
                background: var(--ink);
                color: #fff;
                font-size: 11px;
                padding: 4px 8px;
                border-radius: 4px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.15s;
                z-index: 100;
            }

            .tb-btn:hover .tb-tooltip { opacity: 1; }

            /* ── EDITOR AREA ── */
            .editor-body { display: flex; flex: 1; overflow: hidden; position: relative; }

            .editor-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .editor-toolbar-wrap {
                position: sticky;
                top: 0;
                z-index: 50;
                background: var(--paper);
                border-bottom: 1px solid var(--border);
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                flex-shrink: 0;
            }

            .blocks-container {
                flex: 1;
                overflow-y: auto;
                padding: 32px 48px;
                max-width: 860px;
                margin: 0 auto;
                width: 100%;
            }

            .blocks-container::-webkit-scrollbar { width: 6px; }
            .blocks-container::-webkit-scrollbar-track { background: transparent; }
            .blocks-container::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

            /* ── BLOCK ── */
            .block-wrapper {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                margin-bottom: 4px;
                position: relative;
                padding: 2px 0;
            }

            .block-wrapper:hover .block-controls { opacity: 1; }

            .block-controls {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                opacity: 0;
                transition: opacity 0.15s;
                padding-top: 4px;
                flex-shrink: 0;
                width: 28px;
            }

            .block-ctrl-btn {
                display: flex; align-items: center; justify-content: center;
                width: 22px; height: 22px;
                border: none;
                border-radius: 4px;
                background: transparent;
                color: var(--ink3);
                cursor: pointer;
                transition: all 0.12s;
            }

            .block-ctrl-btn svg { width: 14px; height: 14px; }
            .block-ctrl-btn:hover { background: var(--paper3); color: var(--accent); }
            .block-ctrl-btn.drag-handle { cursor: grab; }
            .block-ctrl-btn.drag-handle:active { cursor: grabbing; }

            .block-content { flex: 1; min-width: 0; }

            /* ── EDITABLE BLOCKS ── */
            .block-editable {
                width: 100%;
                min-height: 1.6em;
                outline: none;
                border: none;
                background: transparent;
                font-family: 'DM Sans', sans-serif;
                font-size: 16px;
                line-height: 1.75;
                color: var(--ink);
                resize: none;
                padding: 4px 0;
                caret-color: var(--accent);
            }

            .block-editable:empty::before {
                content: attr(data-placeholder);
                color: var(--ink3);
                pointer-events: none;
            }

            /* ── HEADING STYLES ── */
            [data-block-type="h1"] .block-editable { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 900; line-height: 1.2; color: var(--ink); }
            [data-block-type="h2"] .block-editable { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; line-height: 1.3; border-bottom: 2px solid var(--border); padding-bottom: 6px; }
            [data-block-type="h3"] .block-editable { font-size: 22px; font-weight: 700; line-height: 1.35; }
            [data-block-type="h4"] .block-editable { font-size: 18px; font-weight: 600; line-height: 1.4; }
            [data-block-type="h5"] .block-editable { font-size: 15px; font-weight: 700; line-height: 1.45; text-transform: uppercase; letter-spacing: 0.5px; }
            [data-block-type="h6"] .block-editable { font-size: 13px; font-weight: 700; line-height: 1.5; text-transform: uppercase; letter-spacing: 1px; color: var(--ink3); }

            /* ── QUOTE ── */
            [data-block-type="quote"] .block-editable,
            [data-block-type="nested-quote"] .block-editable {
                border-left: 4px solid var(--accent2);
                padding-left: 16px;
                color: var(--ink2);
                font-style: italic;
            }

            [data-block-type="nested-quote"] .block-editable {
                border-left: 4px solid var(--accent);
                margin-left: 24px;
                background: var(--paper2);
                padding: 8px 8px 8px 16px;
                border-radius: 0 var(--radius) var(--radius) 0;
            }

            /* ── CODE BLOCK ── */
            .code-block-wrapper {
                background: #1e1e2e;
                border-radius: var(--radius);
                overflow: hidden;
                margin: 4px 0;
            }

            .code-block-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
                background: #12121f;
            }

            .code-lang-select {
                background: transparent;
                border: 1px solid rgba(255,255,255,0.15);
                color: #a8b0c8;
                font-size: 12px;
                padding: 3px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-family: 'JetBrains Mono', monospace;
            }

            .code-copy-btn {
                display: flex; align-items: center; gap: 4px;
                background: transparent;
                border: none;
                color: #6e7b9b;
                font-size: 12px;
                cursor: pointer;
                padding: 3px 8px;
                border-radius: 4px;
                transition: all 0.12s;
                font-family: 'DM Sans', sans-serif;
            }

            .code-copy-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }
            .code-copy-btn svg { width: 12px; height: 12px; }

            .block-editable.code-area {
                font-family: 'JetBrains Mono', monospace;
                font-size: 14px;
                line-height: 1.6;
                color: #cdd6f4;
                padding: 12px 16px;
                white-space: pre;
                overflow-x: auto;
                tab-size: 2;
            }

            /* ── LIST ── */
            [data-block-type="ul"] .block-editable,
            [data-block-type="ol"] .block-editable,
            [data-block-type="tasklist"] .block-editable {
                font-size: 16px;
                line-height: 1.7;
                padding: 4px 0;
            }

            .list-hint { font-size: 11px; color: var(--ink3); margin-top: 2px; font-style: italic; }

            /* ── INLINE CODE ── */
            [data-block-type="inline-code"] .block-editable {
                font-family: 'JetBrains Mono', monospace;
                font-size: 14px;
                background: var(--paper2);
                padding: 3px 10px;
                border-radius: 4px;
                border: 1px solid var(--border);
                color: var(--accent);
                display: inline-block;
            }

            /* ── HR ── */
            .hr-block {
                border: none;
                border-top: 2px solid var(--border);
                margin: 12px 0;
            }

            /* ── TABLE ── */
            .table-wrapper { overflow-x: auto; margin: 4px 0; }

            table.editable-table {
                border-collapse: collapse;
                width: 100%;
                font-size: 14px;
            }

            table.editable-table th,
            table.editable-table td {
                border: 1px solid var(--border);
                padding: 8px 12px;
                outline: none;
                min-width: 80px;
                background: transparent;
                font-family: 'DM Sans', sans-serif;
            }

            table.editable-table th {
                background: var(--paper2);
                font-weight: 600;
                font-size: 13px;
            }

            table.editable-table td:focus,
            table.editable-table th:focus {
                background: #fff9f5;
                outline: 2px solid var(--accent);
            }

            .table-controls { display: flex; gap: 6px; margin-top: 6px; }

            .table-ctrl-btn {
                font-size: 11px;
                padding: 3px 10px;
                border: 1px solid var(--border);
                background: var(--paper2);
                border-radius: 4px;
                cursor: pointer;
                font-family: 'DM Sans', sans-serif;
                color: var(--ink2);
                transition: all 0.12s;
            }

            .table-ctrl-btn:hover { background: var(--paper3); }

            /* ── IMAGE BLOCK ── */
            .image-upload-zone {
                border: 2px dashed var(--border);
                border-radius: var(--radius);
                padding: 32px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
                background: var(--paper2);
            }

            .image-upload-zone:hover,
            .image-upload-zone.drag-over { border-color: var(--accent); background: #fff5f0; }

            .image-upload-zone svg { width: 36px; height: 36px; color: var(--ink3); margin-bottom: 8px; }

            .image-upload-zone p { font-size: 14px; color: var(--ink3); }

            .image-upload-zone input[type="file"] { display: none; }

            .image-options {
                display: flex;
                gap: 10px;
                margin-top: 12px;
                justify-content: center;
            }

            .img-opt-btn {
                display: flex; align-items: center; gap: 6px;
                padding: 8px 16px;
                border-radius: var(--radius);
                border: none;
                font-family: 'DM Sans', sans-serif;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.15s;
            }

            .img-opt-btn svg { width: 15px; height: 15px; }
            .btn-upload-direct { background: var(--blue); color: #fff; }
            .btn-upload-direct:hover { background: #0958d9; }
            .btn-upload-optimize { background: var(--green); color: #fff; }
            .btn-upload-optimize:hover { background: #237804; }
            .img-opt-btn:disabled { opacity: 0.5; cursor: not-allowed; }

            .image-spinner {
                display: flex; align-items: center; gap: 8px;
                justify-content: center;
                padding: 16px;
                color: var(--ink3);
                font-size: 14px;
            }

            .spinner-ring {
                width: 20px; height: 20px;
                border: 2px solid var(--border);
                border-top-color: var(--accent);
                border-radius: 50%;
                animation: spin 0.7s linear infinite;
            }

            @keyframes spin { to { transform: rotate(360deg); } }

            .image-preview-wrapper {
                position: relative;
                border-radius: var(--radius);
                overflow: hidden;
                background: var(--paper2);
            }

            .image-preview-wrapper img {
                width: 100%;
                height: auto;
                display: block;
                border-radius: var(--radius);
            }

            .image-alt-input {
                width: 100%;
                margin-top: 8px;
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-family: 'DM Sans', sans-serif;
                font-size: 13px;
                background: var(--paper2);
                color: var(--ink);
                outline: none;
                transition: border-color 0.15s;
            }

            .image-alt-input:focus { border-color: var(--accent); }

            /* ── LINK BLOCK ── */
            .link-inputs { display: flex; gap: 8px; flex-wrap: wrap; }
            .link-input {
                flex: 1;
                min-width: 120px;
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-family: 'DM Sans', sans-serif;
                font-size: 14px;
                background: transparent;
                color: var(--ink);
                outline: none;
            }
            .link-input:focus { border-color: var(--accent); }

            /* ── TASKLIST ── */
            .tasklist-items { list-style: none; }
            .tasklist-item { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
            .tasklist-item input[type="checkbox"] { accent-color: var(--accent); width: 16px; height: 16px; cursor: pointer; }
            .tasklist-item-text {
                flex: 1;
                border: none;
                background: transparent;
                font-family: 'DM Sans', sans-serif;
                font-size: 15px;
                outline: none;
                color: var(--ink);
                line-height: 1.5;
            }

            /* ── ESCAPE BLOCK ── */
            [data-block-type="escape"] .block-editable { color: var(--purple); }

            /* ── ADD BLOCK BTN ── */
            .add-block-row {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 0;
                opacity: 0;
                transition: opacity 0.2s;
            }

            .blocks-container:hover .add-block-row { opacity: 1; }

            .add-block-line {
                flex: 1;
                height: 1px;
                background: var(--border);
            }

            .add-block-btn {
                display: flex; align-items: center; gap: 6px;
                padding: 6px 12px;
                border: 1px dashed var(--border);
                border-radius: 20px;
                background: var(--paper);
                color: var(--ink3);
                font-size: 12px;
                font-family: 'DM Sans', sans-serif;
                cursor: pointer;
                transition: all 0.15s;
                white-space: nowrap;
            }

            .add-block-btn svg { width: 13px; height: 13px; }
            .add-block-btn:hover { border-color: var(--accent); color: var(--accent); }

            /* ── BLOCK TYPE MENU ── */
            .block-type-menu {
                position: absolute;
                top: calc(100% + 4px);
                left: 0;
                background: var(--paper);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                box-shadow: var(--shadow-lg);
                padding: 8px;
                z-index: 200;
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4px;
                width: 280px;
            }

            .block-type-menu.hidden { display: none; }

            .bm-item {
                display: flex; flex-direction: column; align-items: center; gap: 4px;
                padding: 8px 4px;
                border: none;
                border-radius: 6px;
                background: transparent;
                cursor: pointer;
                font-family: 'DM Sans', sans-serif;
                font-size: 11px;
                color: var(--ink2);
                transition: all 0.12s;
                text-align: center;
            }

            .bm-item svg { width: 20px; height: 20px; }
            .bm-item:hover { background: var(--paper2); color: var(--accent); }

            /* ── PREVIEW PANEL ── */
            .preview-panel {
                flex: 1;
                overflow-y: auto;
                padding: 32px 48px;
                max-width: 860px;
                margin: 0 auto;
                width: 100%;
                display: none;
            }

            .preview-panel.active { display: block; }

            .preview-panel h1 { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 900; margin-bottom: 16px; }
            .preview-panel h2 { font-family: 'Playfair Display', serif; font-size: 28px; margin: 24px 0 12px; border-bottom: 2px solid var(--border); padding-bottom: 6px; }
            .preview-panel h3 { font-size: 22px; font-weight: 700; margin: 20px 0 10px; }
            .preview-panel h4 { font-size: 18px; font-weight: 600; margin: 16px 0 8px; }
            .preview-panel h5 { font-size: 15px; font-weight: 700; margin: 14px 0 6px; text-transform: uppercase; letter-spacing: 0.5px; }
            .preview-panel h6 { font-size: 13px; font-weight: 700; margin: 12px 0 6px; text-transform: uppercase; letter-spacing: 1px; color: var(--ink3); }
            .preview-panel p { margin-bottom: 12px; line-height: 1.75; }
            .preview-panel blockquote { border-left: 4px solid var(--accent2); padding-left: 16px; color: var(--ink2); font-style: italic; margin: 12px 0; }
            .preview-panel blockquote blockquote { border-left-color: var(--accent); margin-left: 16px; background: var(--paper2); padding: 8px 8px 8px 16px; border-radius: 0 var(--radius) var(--radius) 0; }
            .preview-panel pre { background: #1e1e2e; border-radius: var(--radius); padding: 16px; overflow-x: auto; margin: 12px 0; }
            .preview-panel code { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #cdd6f4; }
            .preview-panel p code { background: var(--paper2); padding: 2px 6px; border-radius: 3px; color: var(--accent); font-size: 13px; border: 1px solid var(--border); }
            .preview-panel ul { padding-left: 24px; margin-bottom: 12px; }
            .preview-panel ol { padding-left: 24px; margin-bottom: 12px; }
            .preview-panel li { margin-bottom: 4px; line-height: 1.7; }
            .preview-panel hr { border: none; border-top: 2px solid var(--border); margin: 24px 0; }
            .preview-panel img { max-width: 100%; border-radius: var(--radius); margin: 8px 0; }
            .preview-panel table { border-collapse: collapse; width: 100%; margin: 12px 0; }
            .preview-panel th, .preview-panel td { border: 1px solid var(--border); padding: 8px 12px; }
            .preview-panel th { background: var(--paper2); font-weight: 600; }
            .preview-panel a { color: var(--blue); text-decoration: underline; }

            .md-output-wrapper {
                display: none;
                flex-direction: column;
                width: 100%;
                height: 100%;
            }

            .md-output-wrapper.active { display: flex; }

            .md-textarea {
                flex: 1;
                font-family: 'JetBrains Mono', monospace;
                font-size: 13px;
                line-height: 1.6;
                padding: 24px;
                border: none;
                outline: none;
                resize: none;
                background: #1e1e2e;
                color: #cdd6f4;
            }

            /* ── META PANEL ── */
            .meta-panel {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
                display: none;
            }

            .meta-panel.active { display: block; }

            .meta-section {
                background: var(--paper);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                margin-bottom: 16px;
                overflow: hidden;
            }

            .meta-section-title {
                padding: 12px 16px;
                background: var(--paper2);
                border-bottom: 1px solid var(--border);
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: var(--ink3);
            }

            .meta-fields { padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
            .meta-field-full { grid-column: 1 / -1; }

            .meta-field label {
                display: block;
                font-size: 12px;
                font-weight: 600;
                color: var(--ink3);
                margin-bottom: 5px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .meta-input,
            .meta-select,
            .meta-textarea {
                width: 100%;
                padding: 9px 12px;
                border: 1.5px solid var(--border);
                border-radius: 6px;
                font-family: 'DM Sans', sans-serif;
                font-size: 14px;
                background: var(--paper);
                color: var(--ink);
                outline: none;
                transition: border-color 0.15s;
            }

            .meta-input:focus,
            .meta-select:focus,
            .meta-textarea:focus { border-color: var(--accent); }

            .meta-textarea { resize: vertical; min-height: 80px; }

            .toggle-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 16px;
                border-top: 1px solid var(--border);
            }

            .toggle-label { font-size: 14px; font-weight: 500; }

            .toggle {
                position: relative;
                width: 40px;
                height: 22px;
            }

            .toggle input { opacity: 0; width: 0; height: 0; }

            .toggle-slider {
                position: absolute;
                inset: 0;
                background: var(--paper3);
                border-radius: 22px;
                cursor: pointer;
                transition: background 0.2s;
            }

            .toggle-slider::before {
                content: '';
                position: absolute;
                width: 16px; height: 16px;
                left: 3px; top: 3px;
                background: #fff;
                border-radius: 50%;
                transition: transform 0.2s;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }

            input:checked + .toggle-slider { background: var(--accent); }
            input:checked + .toggle-slider::before { transform: translateX(18px); }

            /* ── FEATURED IMAGE ── */
            .featured-img-zone {
                border: 2px dashed var(--border);
                border-radius: var(--radius);
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
                background: var(--paper2);
                margin: 16px;
            }

            .featured-img-zone:hover { border-color: var(--accent); background: #fff5f0; }
            .featured-img-zone svg { width: 28px; height: 28px; color: var(--ink3); margin-bottom: 6px; }
            .featured-img-zone p { font-size: 13px; color: var(--ink3); }
            .featured-img-zone input[type="file"] { display: none; }
            .featured-img-preview { max-width: 100%; border-radius: 6px; margin-top: 8px; }

            /* ── SEO PANEL ── */
            .seo-panel {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
                display: none;
            }

            .seo-panel.active { display: block; }

            /* ── TOAST ── */
            .toast-container {
                position: fixed;
                top: 16px;
                right: 16px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .toast {
                padding: 12px 18px;
                border-radius: var(--radius);
                font-size: 14px;
                font-weight: 500;
                box-shadow: var(--shadow-lg);
                animation: toastIn 0.25s ease;
                max-width: 360px;
            }

            @keyframes toastIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            .toast-success { background: #f6ffed; border: 1px solid #b7eb8f; color: #135200; }
            .toast-error { background: #fff2f0; border: 1px solid #ffccc7; color: #a8071a; }
            .toast-info { background: #e6f4ff; border: 1px solid #91caff; color: #003eb3; }

            /* ── DRAG & DROP ── */
            .block-wrapper.dragging { opacity: 0.4; }
            .block-wrapper.drag-over { border-top: 2px solid var(--accent); }

            /* ── RESPONSIVE ── */
            @media (max-width: 640px) {
                .blocks-container, .preview-panel { padding: 16px; }
                .meta-fields { grid-template-columns: 1fr; }
                .top-bar-brand { font-size: 15px; }
            }
        </style>

        <div class="editor-shell">
            <!-- TOP BAR -->
            <div class="top-bar">
                <div class="top-bar-brand">MDX<span>Blocks</span></div>
                <div class="top-bar-actions">
                    <button class="btn-top btn-draft" id="saveBtn">
                        ${this._svg('save')} Save Draft
                    </button>
                    <button class="btn-top btn-save" id="publishBtn">
                        ${this._svg('check')} Publish
                    </button>
                </div>
            </div>

            <!-- TAB BAR -->
            <div class="tab-bar">
                <button class="tab active" data-tab="editor">
                    ${this._svg('paragraph')} Editor
                </button>
                <button class="tab" data-tab="preview">
                    ${this._svg('preview')} Preview
                </button>
                <button class="tab" data-tab="markdown">
                    ${this._svg('code')} Markdown
                </button>
                <button class="tab" data-tab="meta">
                    ${this._svg('settings')} Post Settings
                </button>
                <button class="tab" data-tab="seo">
                    ${this._svg('seo')} SEO
                </button>
            </div>

            <!-- BODY -->
            <div class="editor-body">

                <!-- EDITOR PANEL -->
                <div class="editor-panel" id="editorPanel">
                    <!-- STICKY TOOLBAR WRAPPER (inside editor panel) -->
                    <div class="editor-toolbar-wrap" id="toolbarWrap">
                        <div class="toolbar" id="toolbar">
                            ${this._renderToolbar()}
                        </div>
                    </div>
                    <div class="blocks-container" id="blocksContainer">
                        <!-- blocks injected here -->
                    </div>
                </div>

                <!-- PREVIEW PANEL -->
                <div class="preview-panel" id="previewPanel"></div>

                <!-- MARKDOWN PANEL -->
                <div class="md-output-wrapper" id="markdownPanel">
                    <textarea class="md-textarea" id="mdOutput" readonly spellcheck="false"></textarea>
                </div>

                <!-- META PANEL -->
                <div class="meta-panel" id="metaPanel">
                    ${this._renderMetaPanel()}
                </div>

                <!-- SEO PANEL -->
                <div class="seo-panel" id="seoPanel">
                    ${this._renderSeoPanel()}
                </div>
            </div>
        </div>

        <!-- BLOCK TYPE MENU -->
        <div class="block-type-menu hidden" id="blockTypeMenu">
            ${this._renderBlockTypeMenu()}
        </div>

        <!-- TOAST -->
        <div class="toast-container" id="toastContainer"></div>
        `;
    }

    _renderToolbar() {
        const groups = [
            [
                { type: 'h1', label: 'Heading 1' },
                { type: 'h2', label: 'Heading 2' },
                { type: 'h3', label: 'Heading 3' },
                { type: 'h4', label: 'Heading 4' },
                { type: 'h5', label: 'Heading 5' },
                { type: 'h6', label: 'Heading 6' },
            ],
            null,
            [
                { type: 'paragraph', label: 'Paragraph' },
                { type: 'quote', label: 'Blockquote' },
                { type: 'nested-quote', label: 'Nested Quote' },
            ],
            null,
            [
                { type: 'ul', label: 'Bullet List' },
                { type: 'ol', label: 'Numbered List' },
                { type: 'tasklist', label: 'Task List' },
            ],
            null,
            [
                { type: 'code-block', label: 'Code Block' },
                { type: 'inline-code', label: 'Inline Code' },
            ],
            null,
            [
                { type: 'link', label: 'Link' },
                { type: 'image', label: 'Image' },
                { type: 'table', label: 'Table' },
                { type: 'hr', label: 'Divider' },
            ],
            null,
            [
                { type: 'escape', label: 'Escaped Text' },
            ],
        ];

        let html = '';
        groups.forEach(group => {
            if (group === null) {
                html += `<div class="toolbar-sep"></div>`;
            } else {
                group.forEach(item => {
                    html += `
                    <button class="tb-btn" data-action="insert-block" data-block-type="${item.type}" title="${item.label}">
                        ${this._svg(item.type === 'nested-quote' ? 'nestedQuote' : item.type === 'code-block' ? 'code' : item.type === 'inline-code' ? 'inlineCode' : item.type)}
                        <span class="tb-tooltip">${item.label}</span>
                    </button>`;
                });
            }
        });
        return html;
    }

    _renderBlockTypeMenu() {
        const items = [
            { type: 'h1', label: 'H1' },
            { type: 'h2', label: 'H2' },
            { type: 'h3', label: 'H3' },
            { type: 'h4', label: 'H4' },
            { type: 'h5', label: 'H5' },
            { type: 'h6', label: 'H6' },
            { type: 'paragraph', label: 'Para' },
            { type: 'quote', label: 'Quote' },
            { type: 'nested-quote', label: 'Nested' },
            { type: 'ul', label: 'List' },
            { type: 'ol', label: 'Ordered' },
            { type: 'tasklist', label: 'Tasks' },
            { type: 'code-block', label: 'Code' },
            { type: 'inline-code', label: 'Inline' },
            { type: 'link', label: 'Link' },
            { type: 'image', label: 'Image' },
            { type: 'table', label: 'Table' },
            { type: 'hr', label: 'Rule' },
            { type: 'escape', label: 'Escape' },
        ];

        return items.map(item => `
            <button class="bm-item" data-bm-type="${item.type}">
                ${this._svg(item.type === 'nested-quote' ? 'nestedQuote' : item.type === 'code-block' ? 'code' : item.type === 'inline-code' ? 'inlineCode' : item.type)}
                ${item.label}
            </button>`).join('');
    }

    _renderMetaPanel() {
        return `
        <div class="meta-section">
            <div class="meta-section-title">Post Details</div>
            <div class="meta-fields">
                <div class="meta-field meta-field-full">
                    <label>Title</label>
                    <input class="meta-input" id="m-title" type="text" placeholder="Post title..." data-meta="title">
                </div>
                <div class="meta-field meta-field-full">
                    <label>Slug</label>
                    <input class="meta-input" id="m-slug" type="text" placeholder="post-url-slug" data-meta="slug">
                </div>
                <div class="meta-field meta-field-full">
                    <label>Excerpt</label>
                    <textarea class="meta-textarea" id="m-excerpt" placeholder="Short description..." data-meta="excerpt" rows="3"></textarea>
                </div>
                <div class="meta-field">
                    <label>Author</label>
                    <input class="meta-input" type="text" placeholder="Author name" data-meta="author">
                </div>
                <div class="meta-field">
                    <label>Category</label>
                    <input class="meta-input" type="text" placeholder="Category" data-meta="category">
                </div>
                <div class="meta-field meta-field-full">
                    <label>Tags (comma separated)</label>
                    <input class="meta-input" type="text" placeholder="tech, web, javascript" data-meta="tags">
                </div>
                <div class="meta-field">
                    <label>Status</label>
                    <select class="meta-select" data-meta="status">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </div>
                <div class="meta-field">
                    <label>Published Date</label>
                    <input class="meta-input" type="datetime-local" data-meta="publishedDate">
                </div>
                <div class="meta-field">
                    <label>Modified Date</label>
                    <input class="meta-input" type="datetime-local" data-meta="modifiedDate">
                </div>
                <div class="meta-field">
                    <label>Read Time (minutes)</label>
                    <input class="meta-input" type="number" placeholder="5" data-meta="readTime">
                </div>
                <div class="meta-field">
                    <label>View Count</label>
                    <input class="meta-input" type="number" placeholder="0" data-meta="viewCount">
                </div>
            </div>
            <div class="toggle-row">
                <span class="toggle-label">Featured Post</span>
                <label class="toggle">
                    <input type="checkbox" data-meta="isFeatured" id="m-featured">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        </div>

        <div class="meta-section">
            <div class="meta-section-title">Author Image</div>
            <div class="featured-img-zone" id="authorImgZone">
                <input type="file" id="authorImgInput" accept="image/*">
                ${this._svg('image')}
                <p>Click to upload author image</p>
                <img class="featured-img-preview" id="authorImgPreview" style="display:none">
            </div>
        </div>

        <div class="meta-section">
            <div class="meta-section-title">Featured Image</div>
            <div class="featured-img-zone" id="featuredImgZone">
                <input type="file" id="featuredImgInput" accept="image/*">
                ${this._svg('image')}
                <p>Click to upload featured image</p>
                <img class="featured-img-preview" id="featuredImgPreview" style="display:none">
            </div>
        </div>`;
    }

    _renderSeoPanel() {
        return `
        <div class="meta-section">
            <div class="meta-section-title">SEO Settings</div>
            <div class="meta-fields">
                <div class="meta-field meta-field-full">
                    <label>SEO Title</label>
                    <input class="meta-input" type="text" placeholder="SEO optimized title..." data-meta="seoTitle">
                </div>
                <div class="meta-field meta-field-full">
                    <label>SEO Description</label>
                    <textarea class="meta-textarea" placeholder="Meta description for search engines..." data-meta="seoDescription" rows="3"></textarea>
                </div>
                <div class="meta-field meta-field-full">
                    <label>SEO Keywords (comma separated)</label>
                    <input class="meta-input" type="text" placeholder="keyword1, keyword2, keyword3" data-meta="seoKeywords">
                </div>
            </div>
        </div>

        <div class="meta-section">
            <div class="meta-section-title">Open Graph Image</div>
            <div class="featured-img-zone" id="ogImgZone">
                <input type="file" id="ogImgInput" accept="image/*">
                ${this._svg('image')}
                <p>Recommended: 1200x630px</p>
                <img class="featured-img-preview" id="ogImgPreview" style="display:none">
            </div>
        </div>`;
    }

    // ─── EVENT LISTENERS ─────────────────────────────────────
    _setupListeners() {
        const s = this._shadow;

        // Tabs
        s.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this._switchTab(tab.dataset.tab));
        });

        // Toolbar buttons — CONVERT focused block OR add new block
        s.getElementById('toolbar').addEventListener('click', e => {
            const btn = e.target.closest('[data-action="insert-block"]');
            if (!btn) return;
            const newType = btn.dataset.blockType;

            // Find which block is currently focused
            const focusedEl = s.activeElement || s.querySelector(':focus');
            const focusedWrapper = focusedEl?.closest?.('[data-block-id]');

            if (focusedWrapper) {
                // A block is focused — convert its type instead of inserting new block
                const blockId = parseInt(focusedWrapper.getAttribute('data-block-id'));
                const blockIdx = this._blocks.findIndex(b => b.id === blockId);
                if (blockIdx !== -1) {
                    const currentBlock = this._blocks[blockIdx];
                    // Preserve text content when converting compatible types
                    const textCompatible = ['h1','h2','h3','h4','h5','h6','paragraph','quote','nested-quote','ul','ol','inline-code','escape'];
                    const hasText = textCompatible.includes(currentBlock.type) && textCompatible.includes(newType);

                    this._blocks[blockIdx] = {
                        id: currentBlock.id,
                        type: newType,
                        data: hasText
                            ? { ...this._defaultData(newType), text: currentBlock.data.text || '' }
                            : this._defaultData(newType)
                    };
                    this._renderBlocks();
                    setTimeout(() => this._focusBlock(blockId), 50);
                    return;
                }
            }

            // No focused block — append new block at end
            this._addBlock(newType);
        });

        // Save / Publish
        s.getElementById('saveBtn').addEventListener('click', () => this._save('draft'));
        s.getElementById('publishBtn').addEventListener('click', () => this._save('published'));

        // Meta inputs
        s.querySelectorAll('[data-meta]').forEach(el => {
            const event = el.type === 'checkbox' ? 'change' : 'input';
            el.addEventListener(event, () => {
                const key = el.dataset.meta;
                this._metaData[key] = el.type === 'checkbox' ? el.checked : el.value;
                if (key === 'title' && !this._metaData.slug) {
                    this._autoSlug(el.value);
                }
            });
        });

        // Title auto-slug
        s.getElementById('m-title')?.addEventListener('input', e => {
            if (!this._metaData.slug) this._autoSlug(e.target.value);
        });

        // Featured image zones
        this._setupImgZone('featuredImgZone', 'featuredImgInput', 'featuredImgPreview', 'featuredImage');
        this._setupImgZone('authorImgZone', 'authorImgInput', 'authorImgPreview', 'authorImage');
        this._setupImgZone('ogImgZone', 'ogImgInput', 'ogImgPreview', 'seoOgImage');

        // Block type menu close on outside click
        document.addEventListener('click', e => {
            if (!e.composedPath().includes(s.getElementById('blockTypeMenu'))) {
                s.getElementById('blockTypeMenu').classList.add('hidden');
            }
        });

        s.getElementById('blockTypeMenu').addEventListener('click', e => {
            const btn = e.target.closest('[data-bm-type]');
            if (btn) {
                this._addBlock(btn.dataset.bmType);
                s.getElementById('blockTypeMenu').classList.add('hidden');
            }
        });
    }

    _setupImgZone(zoneId, inputId, previewId, metaKey) {
        const s = this._shadow;
        const zone = s.getElementById(zoneId);
        const input = s.getElementById(inputId);
        const preview = s.getElementById(previewId);

        if (!zone || !input) return;

        zone.addEventListener('click', () => input.click());
        input.addEventListener('change', async e => {
            const file = e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            if (preview) { preview.src = url; preview.style.display = 'block'; }
            // Upload to media manager
            this._dispatchEvent('upload-meta-image', {
                fileData: await this._fileToBase64(file),
                filename: file.name,
                metaKey,
                optimize: true
            });
        });
    }

    _autoSlug(title) {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const slugInput = this._shadow.getElementById('m-slug');
        if (slugInput) { slugInput.value = slug; this._metaData.slug = slug; }
    }

    _switchTab(tab) {
        this._activeTab = tab;
        const s = this._shadow;

        s.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

        const panels = { editor: 'editorPanel', preview: 'previewPanel', markdown: 'markdownPanel', meta: 'metaPanel', seo: 'seoPanel' };

        Object.entries(panels).forEach(([key, id]) => {
            const el = s.getElementById(id);
            if (!el) return;
            const isActive = key === tab;
            if (id === 'editorPanel') {
                el.style.display = isActive ? 'flex' : 'none';
            } else {
                el.classList.toggle('active', isActive);
            }
        });

        if (tab === 'preview') this._updatePreview();
        if (tab === 'markdown') this._updateMarkdown();
    }

    // ─── BLOCKS ──────────────────────────────────────────────
    _addBlock(type, afterIdx = null) {
        const id = ++this._blockIdCounter;
        const block = { id, type, data: this._defaultData(type) };

        if (afterIdx !== null && afterIdx < this._blocks.length) {
            this._blocks.splice(afterIdx + 1, 0, block);
        } else {
            this._blocks.push(block);
        }

        this._renderBlocks();
        setTimeout(() => this._focusBlock(id), 50);
    }

    _defaultData(type) {
        if (type === 'table') return { rows: [['Header 1', 'Header 2', 'Header 3'], ['Cell', 'Cell', 'Cell']] };
        if (type === 'tasklist') return { items: [{ text: '', checked: false }] };
        if (type === 'code-block') return { lang: 'javascript', code: '' };
        if (type === 'link') return { text: '', url: '' };
        if (type === 'image') return { src: '', alt: '', file: null, pendingFile: null };
        if (type === 'hr') return {};
        return { text: '' };
    }

    _renderBlocks() {
        const container = this._shadow.getElementById('blocksContainer');
        container.innerHTML = '';

        this._blocks.forEach((block, idx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'block-wrapper';
            wrapper.setAttribute('data-block-id', block.id);
            wrapper.setAttribute('data-block-type', block.type);
            wrapper.draggable = true;

            wrapper.innerHTML = `
                <div class="block-controls">
                    <button class="block-ctrl-btn drag-handle" title="Drag">${this._svg('drag')}</button>
                    <button class="block-ctrl-btn" data-action="delete-block" title="Delete">${this._svg('delete')}</button>
                </div>
                <div class="block-content">
                    ${this._renderBlockContent(block, idx)}
                </div>`;

            // Add block button below
            if (idx === this._blocks.length - 1 || true) {
                const addRow = document.createElement('div');
                addRow.className = 'add-block-row';
                addRow.dataset.afterIdx = idx;
                addRow.innerHTML = `
                    <div class="add-block-line"></div>
                    <button class="add-block-btn" data-after-idx="${idx}">
                        ${this._svg('add')} Add Block
                    </button>
                    <div class="add-block-line"></div>`;
                container.appendChild(wrapper);
                container.appendChild(addRow);
            } else {
                container.appendChild(wrapper);
            }

            this._bindBlockEvents(wrapper, block, idx);
        });

        // Bottom add button
        if (this._blocks.length === 0) {
            const addRow = document.createElement('div');
            addRow.className = 'add-block-row';
            addRow.style.opacity = '1';
            addRow.innerHTML = `
                <div class="add-block-line"></div>
                <button class="add-block-btn" data-after-idx="-1">
                    ${this._svg('add')} Add Block
                </button>
                <div class="add-block-line"></div>`;
            container.appendChild(addRow);
        }

        // Bind add-block buttons
        container.querySelectorAll('.add-block-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const afterIdx = parseInt(btn.dataset.afterIdx);
                this._showBlockMenu(btn, afterIdx);
            });
        });
    }

    _renderBlockContent(block, idx) {
        switch (block.type) {
            case 'h1': return `<div class="block-editable" contenteditable="true" data-placeholder="Heading 1..." data-idx="${idx}">${block.data.text}</div>`;
            case 'h2': return `<div class="block-editable" contenteditable="true" data-placeholder="Heading 2..." data-idx="${idx}">${block.data.text}</div>`;
            case 'h3': return `<div class="block-editable" contenteditable="true" data-placeholder="Heading 3..." data-idx="${idx}">${block.data.text}</div>`;
            case 'h4': return `<div class="block-editable" contenteditable="true" data-placeholder="Heading 4..." data-idx="${idx}">${block.data.text}</div>`;
            case 'h5': return `<div class="block-editable" contenteditable="true" data-placeholder="Heading 5..." data-idx="${idx}">${block.data.text}</div>`;
            case 'h6': return `<div class="block-editable" contenteditable="true" data-placeholder="Heading 6..." data-idx="${idx}">${block.data.text}</div>`;
            case 'paragraph': return `<div class="block-editable" contenteditable="true" data-placeholder="Write something..." data-idx="${idx}">${block.data.text}</div>`;
            case 'quote': return `<div class="block-editable" contenteditable="true" data-placeholder="Blockquote..." data-idx="${idx}">${block.data.text}</div>`;
            case 'nested-quote': return `<div class="block-editable" contenteditable="true" data-placeholder="Nested quote..." data-idx="${idx}">${block.data.text}</div>`;
            case 'ul': return `
                <div class="block-editable" contenteditable="true" data-placeholder="- Item 1\n- Item 2\n- Item 3" data-idx="${idx}" style="white-space:pre-wrap">${block.data.text}</div>
                <div class="list-hint">Each line = one bullet item (starts with -)</div>`;
            case 'ol': return `
                <div class="block-editable" contenteditable="true" data-placeholder="1. Item 1\n2. Item 2" data-idx="${idx}" style="white-space:pre-wrap">${block.data.text}</div>
                <div class="list-hint">Each line = one numbered item (starts with number.)</div>`;
            case 'inline-code': return `<div class="block-editable" contenteditable="true" data-placeholder="inline code here..." data-idx="${idx}">${block.data.text}</div>`;
            case 'escape': return `<div class="block-editable" contenteditable="true" data-placeholder="\\*escaped text\\*" data-idx="${idx}">${block.data.text}</div>`;
            case 'hr': return `<hr class="hr-block">`;
            case 'code-block': return `
                <div class="code-block-wrapper">
                    <div class="code-block-header">
                        <select class="code-lang-select" data-idx="${idx}">
                            ${['javascript','typescript','python','html','css','json','bash','sql','java','php','ruby','rust','go','cpp','c','swift','kotlin','r','yaml','xml'].map(l => `<option value="${l}" ${block.data.lang === l ? 'selected' : ''}>${l}</option>`).join('')}
                        </select>
                        <button class="code-copy-btn" data-idx="${idx}">${this._svg('copy')} Copy</button>
                    </div>
                    <div class="block-editable code-area" contenteditable="true" data-placeholder="// Write code here..." data-idx="${idx}" spellcheck="false">${block.data.code}</div>
                </div>`;
            case 'link': return `
                <div class="link-inputs">
                    <input class="link-input" type="text" placeholder="Link text..." value="${block.data.text}" data-link-text="${idx}">
                    <input class="link-input" type="url" placeholder="https://..." value="${block.data.url}" data-link-url="${idx}">
                </div>`;
            case 'image': return this._renderImageBlock(block, idx);
            case 'table': return this._renderTableBlock(block, idx);
            case 'tasklist': return this._renderTasklistBlock(block, idx);
            default: return `<div class="block-editable" contenteditable="true" data-placeholder="..." data-idx="${idx}">${block.data.text || ''}</div>`;
        }
    }

    _renderImageBlock(block, idx) {
        if (block.data.src) {
            return `
                <div class="image-preview-wrapper">
                    <img src="${block.data.src}" alt="${block.data.alt}">
                    <input class="image-alt-input" type="text" placeholder="Alt text (for accessibility)..." value="${block.data.alt}" data-img-alt="${idx}">
                </div>`;
        }
        if (block.data.pendingFile) {
            return `
                <div class="image-upload-zone">
                    <div style="text-align:center; margin-bottom:12px;">
                        <img src="${block.data.preview}" style="max-height:180px; border-radius:8px; object-fit:contain;">
                    </div>
                    <div class="image-options">
                        <button class="img-opt-btn btn-upload-direct" data-img-action="upload" data-idx="${idx}">
                            ${this._svg('upload')} Upload Image
                        </button>
                        <button class="img-opt-btn btn-upload-optimize" data-img-action="optimize" data-idx="${idx}">
                            ${this._svg('optimize')} Optimize & Upload
                        </button>
                    </div>
                </div>`;
        }
        return `
            <div class="image-upload-zone" data-dropzone="${idx}">
                <input type="file" accept="image/*" style="display:none" data-img-file-input="${idx}">
                ${this._svg('image')}
                <p>Click or drag & drop to upload image</p>
            </div>`;
    }

    _renderTableBlock(block, idx) {
        const rows = block.data.rows;
        let tableHtml = `<div class="table-wrapper"><table class="editable-table" data-idx="${idx}">`;
        rows.forEach((row, ri) => {
            tableHtml += '<tr>';
            row.forEach((cell, ci) => {
                const tag = ri === 0 ? 'th' : 'td';
                tableHtml += `<${tag} contenteditable="true" data-row="${ri}" data-col="${ci}" data-tbl-idx="${idx}">${cell}</${tag}>`;
            });
            tableHtml += '</tr>';
        });
        tableHtml += `</table>
            <div class="table-controls">
                <button class="table-ctrl-btn" data-tbl-action="add-row" data-idx="${idx}">+ Row</button>
                <button class="table-ctrl-btn" data-tbl-action="add-col" data-idx="${idx}">+ Column</button>
                <button class="table-ctrl-btn" data-tbl-action="del-row" data-idx="${idx}">− Row</button>
                <button class="table-ctrl-btn" data-tbl-action="del-col" data-idx="${idx}">− Column</button>
            </div></div>`;
        return tableHtml;
    }

    _renderTasklistBlock(block, idx) {
        const items = block.data.items;
        let html = `<ul class="tasklist-items" data-idx="${idx}">`;
        items.forEach((item, ii) => {
            html += `<li class="tasklist-item">
                <input type="checkbox" ${item.checked ? 'checked' : ''} data-task-check="${idx}-${ii}">
                <input class="tasklist-item-text" type="text" value="${item.text}" placeholder="Task..." data-task-text="${idx}-${ii}">
            </li>`;
        });
        html += `</ul><button class="table-ctrl-btn" data-task-add="${idx}" style="margin-top:8px;">+ Add Task</button>`;
        return html;
    }

    _bindBlockEvents(wrapper, block, idx) {
        const s = this._shadow;

        // Delete block
        wrapper.querySelector('[data-action="delete-block"]')?.addEventListener('click', () => {
            this._blocks.splice(idx, 1);
            this._renderBlocks();
        });

        // Drag
        wrapper.addEventListener('dragstart', e => {
            this._dragSrcIdx = idx;
            wrapper.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        wrapper.addEventListener('dragend', () => wrapper.classList.remove('dragging'));

        wrapper.addEventListener('dragover', e => {
            e.preventDefault();
            s.querySelectorAll('.block-wrapper').forEach(w => w.classList.remove('drag-over'));
            wrapper.classList.add('drag-over');
        });

        wrapper.addEventListener('drop', e => {
            e.preventDefault();
            wrapper.classList.remove('drag-over');
            if (this._dragSrcIdx === null || this._dragSrcIdx === idx) return;
            const moved = this._blocks.splice(this._dragSrcIdx, 1)[0];
            const targetIdx = this._dragSrcIdx < idx ? idx - 1 : idx;
            this._blocks.splice(targetIdx, 0, moved);
            this._dragSrcIdx = null;
            this._renderBlocks();
        });

        // Content editables
        const editable = wrapper.querySelector('.block-editable');
        if (editable) {
            editable.addEventListener('input', () => {
                if (block.type === 'code-block') {
                    block.data.code = editable.textContent;
                } else {
                    block.data.text = editable.textContent;
                }
            });

            editable.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code-block' && block.type !== 'ul' && block.type !== 'ol') {
                    e.preventDefault();
                    this._addBlock('paragraph', idx);
                }
            });
        }

        // Code block language
        const langSelect = wrapper.querySelector('.code-lang-select');
        if (langSelect) {
            langSelect.addEventListener('change', () => { block.data.lang = langSelect.value; });
        }

        // Code copy
        const copyBtn = wrapper.querySelector('.code-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(block.data.code || '');
                this._showToast('info', 'Code copied!');
            });
        }

        // Link inputs
        const linkText = wrapper.querySelector(`[data-link-text="${idx}"]`);
        const linkUrl = wrapper.querySelector(`[data-link-url="${idx}"]`);
        if (linkText) linkText.addEventListener('input', () => { block.data.text = linkText.value; });
        if (linkUrl) linkUrl.addEventListener('input', () => { block.data.url = linkUrl.value; });

        // Image
        const dropzone = wrapper.querySelector(`[data-dropzone="${idx}"]`);
        const fileInput = wrapper.querySelector(`[data-img-file-input="${idx}"]`);

        if (dropzone) {
            dropzone.addEventListener('click', () => fileInput?.click());
            dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
            dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
            dropzone.addEventListener('drop', e => {
                e.preventDefault();
                dropzone.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) this._handleImageFile(file, block, idx);
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', e => {
                const file = e.target.files[0];
                if (file) this._handleImageFile(file, block, idx);
            });
        }

        // Image upload buttons
        const imgUploadBtn = wrapper.querySelector(`[data-img-action="upload"][data-idx="${idx}"]`);
        const imgOptimizeBtn = wrapper.querySelector(`[data-img-action="optimize"][data-idx="${idx}"]`);

        if (imgUploadBtn) {
            imgUploadBtn.addEventListener('click', () => this._triggerImageUpload(block, idx, false));
        }
        if (imgOptimizeBtn) {
            imgOptimizeBtn.addEventListener('click', () => this._triggerImageUpload(block, idx, true));
        }

        // Image alt
        const altInput = wrapper.querySelector(`[data-img-alt="${idx}"]`);
        if (altInput) altInput.addEventListener('input', () => { block.data.alt = altInput.value; });

        // Table
        wrapper.querySelectorAll(`[data-tbl-idx="${idx}"]`).forEach(cell => {
            cell.addEventListener('input', () => {
                const ri = parseInt(cell.dataset.row);
                const ci = parseInt(cell.dataset.col);
                block.data.rows[ri][ci] = cell.textContent;
            });
        });

        wrapper.querySelectorAll(`[data-tbl-action]`).forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.tblAction;
                if (action === 'add-row') block.data.rows.push(block.data.rows[0].map(() => 'Cell'));
                if (action === 'add-col') block.data.rows.forEach(r => r.push(''));
                if (action === 'del-row' && block.data.rows.length > 2) block.data.rows.pop();
                if (action === 'del-col' && block.data.rows[0].length > 1) block.data.rows.forEach(r => r.pop());
                this._renderBlocks();
            });
        });

        // Tasklist
        wrapper.querySelectorAll(`[data-task-text]`).forEach(input => {
            const [blockIdxStr, itemIdxStr] = input.dataset.taskText.split('-');
            const ii = parseInt(itemIdxStr);
            input.addEventListener('input', () => { block.data.items[ii].text = input.value; });
        });

        wrapper.querySelectorAll(`[data-task-check]`).forEach(cb => {
            const [, itemIdxStr] = cb.dataset.taskCheck.split('-');
            const ii = parseInt(itemIdxStr);
            cb.addEventListener('change', () => { block.data.items[ii].checked = cb.checked; });
        });

        const addTaskBtn = wrapper.querySelector(`[data-task-add="${idx}"]`);
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                block.data.items.push({ text: '', checked: false });
                this._renderBlocks();
            });
        }
    }

    _focusBlock(id) {
        const wrapper = this._shadow.querySelector(`[data-block-id="${id}"]`);
        if (!wrapper) return;
        const editable = wrapper.querySelector('.block-editable, .link-input, .tasklist-item-text');
        if (editable) {
            editable.focus();
            if (editable.contentEditable === 'true') {
                const range = document.createRange();
                range.selectNodeContents(editable);
                range.collapse(false);
                const sel = this._shadow.getSelection ? this._shadow.getSelection() : window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }
    }

    _showBlockMenu(btn, afterIdx) {
        const menu = this._shadow.getElementById('blockTypeMenu');
        const rect = btn.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = (rect.bottom + 4) + 'px';
        menu.style.left = rect.left + 'px';
        menu.classList.remove('hidden');
        menu.dataset.afterIdx = afterIdx;

        // Rebind menu items with correct afterIdx
        menu.querySelectorAll('[data-bm-type]').forEach(item => {
            item.onclick = () => {
                this._addBlock(item.dataset.bmType, afterIdx);
                menu.classList.add('hidden');
            };
        });
    }

    // ─── IMAGE HANDLING ──────────────────────────────────────

    /**
     * Convert wix:image://v1/HASH~mv2.ext/filename.ext#... 
     * → https://static.wixstatic.com/media/HASH~mv2.ext
     */
    _convertWixImageUrl(url) {
        if (!url) return url;
        // Already a public URL
        if (url.startsWith('http')) return url;
        // wix:image://v1/{hash~mv2.ext}/{filename}#{params}
        const match = url.match(/^wix:image:\/\/v1\/([^/]+)\//);
        if (match) {
            const mediaFile = match[1]; // e.g. 8874a0_abc~mv2.webp
            return `https://static.wixstatic.com/media/${mediaFile}`;
        }
        return url;
    }
        const preview = URL.createObjectURL(file);
        block.data.pendingFile = file;
        block.data.preview = preview;
        this._renderBlocks();
    }

    async _triggerImageUpload(block, idx, optimize) {
        const file = block.data.pendingFile;
        if (!file) return;

        // Show spinner
        const wrapper = this._shadow.querySelector(`[data-block-id="${block.id}"]`);
        if (wrapper) {
            const content = wrapper.querySelector('.block-content');
            content.innerHTML = `<div class="image-spinner"><div class="spinner-ring"></div>${optimize ? 'Optimizing & uploading...' : 'Uploading...'}</div>`;
        }

        try {
            let uploadFile = file;
            if (optimize) uploadFile = await this._convertToWebp(file);

            const base64 = await this._fileToBase64(uploadFile);
            const filename = optimize ? file.name.replace(/\.[^.]+$/, '.webp') : file.name;

            this._uploadingImages[block.id] = { block, idx };

            this._dispatchEvent('upload-image', {
                blockId: block.id,
                fileData: base64,
                filename,
                optimize
            });
        } catch (err) {
            this._showToast('error', 'Image processing failed: ' + err.message);
            this._renderBlocks();
        }
    }

    async _convertToWebp(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                canvas.toBlob(blob => {
                    if (blob) resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
                    else reject(new Error('WebP conversion failed'));
                }, 'image/webp', 0.92);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    _handleUploadResult(data) {
        if (data.blockId) {
            const info = this._uploadingImages[data.blockId];
            if (info) {
                // Convert wix:image:// URL to public https URL
                info.block.data.src = this._convertWixImageUrl(data.url);
                info.block.data.alt = '';
                info.block.data.pendingFile = null;
                info.block.data.preview = null;
                delete this._uploadingImages[data.blockId];
                this._renderBlocks();
                this._showToast('success', 'Image uploaded!');
            }
        }
        if (data.metaKey) {
            // Convert wix:image:// URL for meta images too
            this._metaData[data.metaKey] = this._convertWixImageUrl(data.url);
            this._showToast('success', 'Image uploaded!');
        }
    }

    _handleSaveResult(data) {
        if (data.success) {
            this._showToast('success', data.message || 'Post saved!');
        } else {
            this._showToast('error', data.message || 'Save failed.');
        }
    }

    _loadExistingPost(data) {
        if (!data) return;
        // Load meta
        Object.keys(this._metaData).forEach(key => {
            if (data[key] !== undefined) this._metaData[key] = data[key];
        });
        // Sync inputs
        this._shadow.querySelectorAll('[data-meta]').forEach(el => {
            const key = el.dataset.meta;
            if (el.type === 'checkbox') el.checked = !!this._metaData[key];
            else el.value = this._metaData[key] || '';
        });
        // Load content from markdown
        if (data.content) this._parseMarkdownToBlocks(data.content);
        this._showToast('info', 'Post loaded!');
    }

    _parseMarkdownToBlocks(md) {
        this._blocks = [];
        const lines = md.split('\n');
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            if (!line.trim()) { i++; continue; }
            if (line.startsWith('# ')) { this._blocks.push({ id: ++this._blockIdCounter, type: 'h1', data: { text: line.slice(2) } }); }
            else if (line.startsWith('## ')) { this._blocks.push({ id: ++this._blockIdCounter, type: 'h2', data: { text: line.slice(3) } }); }
            else if (line.startsWith('### ')) { this._blocks.push({ id: ++this._blockIdCounter, type: 'h3', data: { text: line.slice(4) } }); }
            else if (line.startsWith('#### ')) { this._blocks.push({ id: ++this._blockIdCounter, type: 'h4', data: { text: line.slice(5) } }); }
            else if (line.startsWith('##### ')) { this._blocks.push({ id: ++this._blockIdCounter, type: 'h5', data: { text: line.slice(6) } }); }
            else if (line.startsWith('###### ')) { this._blocks.push({ id: ++this._blockIdCounter, type: 'h6', data: { text: line.slice(7) } }); }
            else if (line.startsWith('>> ')) { this._blocks.push({ id: ++this._blockIdCounter, type: 'nested-quote', data: { text: line.slice(3) } }); }
            else if (line.startsWith('> ')) { this._blocks.push({ id: ++this._blockIdCounter, type: 'quote', data: { text: line.slice(2) } }); }
            else if (line.startsWith('---')) { this._blocks.push({ id: ++this._blockIdCounter, type: 'hr', data: {} }); }
            else { this._blocks.push({ id: ++this._blockIdCounter, type: 'paragraph', data: { text: line } }); }
            i++;
        }
        this._renderBlocks();
    }

    // ─── MARKDOWN GENERATION ─────────────────────────────────
    _blocksToMarkdown() {
        return this._blocks.map(block => {
            switch (block.type) {
                case 'h1': return `# ${block.data.text}`;
                case 'h2': return `## ${block.data.text}`;
                case 'h3': return `### ${block.data.text}`;
                case 'h4': return `#### ${block.data.text}`;
                case 'h5': return `##### ${block.data.text}`;
                case 'h6': return `###### ${block.data.text}`;
                case 'paragraph': return block.data.text;
                case 'quote': return `> ${block.data.text}`;
                case 'nested-quote': return `>> ${block.data.text}`;
                case 'ul': return block.data.text.split('\n').filter(l => l.trim()).map(l => {
                    const clean = l.replace(/^[-*+]\s*/, '');
                    return `- ${clean}`;
                }).join('\n');
                case 'ol': return block.data.text.split('\n').filter(l => l.trim()).map((l, i) => {
                    const clean = l.replace(/^\d+\.\s*/, '');
                    return `${i + 1}. ${clean}`;
                }).join('\n');
                case 'tasklist': return block.data.items.map(item => `- [${item.checked ? 'x' : ' '}] ${item.text}`).join('\n');
                case 'code-block': return `\`\`\`${block.data.lang}\n${block.data.code}\n\`\`\``;
                case 'inline-code': return `\`${block.data.text}\``;
                case 'link': return `[${block.data.text}](${block.data.url})`;
                case 'image': return `![${block.data.alt}](${block.data.src})`;
                case 'hr': return `---`;
                case 'escape': return block.data.text.replace(/([*_`~\\])/g, '\\$1');
                case 'table': {
                    const rows = block.data.rows;
                    if (!rows.length) return '';
                    const header = '| ' + rows[0].join(' | ') + ' |';
                    const sep = '| ' + rows[0].map(() => '---').join(' | ') + ' |';
                    const body = rows.slice(1).map(r => '| ' + r.join(' | ') + ' |').join('\n');
                    return `${header}\n${sep}\n${body}`;
                }
                default: return block.data.text || '';
            }
        }).join('\n\n');
    }

    _updateMarkdown() {
        const el = this._shadow.getElementById('mdOutput');
        if (el) el.value = this._blocksToMarkdown();
    }

    _updatePreview() {
        const md = this._blocksToMarkdown();
        const html = this._mdToHtml(md);
        const panel = this._shadow.getElementById('previewPanel');
        if (panel) panel.innerHTML = html;
    }

    _mdToHtml(md) {
        let html = md
            .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
            .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
            .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^---$/gm, '<hr>')
            .replace(/^>> (.+)$/gm, '<blockquote><blockquote>$1</blockquote></blockquote>')
            .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
            .replace(/```(\w+)\n([\s\S]*?)```/gm, '<pre><code class="language-$1">$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/~~(.+?)~~/g, '<del>$1</del>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
            .replace(/^- \[x\] (.+)$/gm, '<li style="list-style:none"><input type="checkbox" checked disabled> $1</li>')
            .replace(/^- \[ \] (.+)$/gm, '<li style="list-style:none"><input type="checkbox" disabled> $1</li>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>[\s\S]+?<\/li>)/gm, '<ul>$1</ul>')
            .replace(/\|(.+)\|/g, (match) => {
                if (match.includes('---')) return '';
                const cells = match.split('|').slice(1, -1).map(c => c.trim());
                return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
            });

        html = html.replace(/^(?!<[h1-6ul]|<block|<hr|<pre|<table|<tr)(.+)$/gm, '<p>$1</p>');
        return html;
    }

    // ─── SAVE ────────────────────────────────────────────────
    _save(status) {
        const md = this._blocksToMarkdown();
        const payload = {
            ...this._metaData,
            content: md,
            status
        };

        // Calculate read time
        const wordCount = md.split(/\s+/).length;
        payload.readTime = Math.ceil(wordCount / 200);

        this._dispatchEvent('save-post', payload);
    }

    // ─── HELPERS ─────────────────────────────────────────────
    _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    _dispatchEvent(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }

    _showToast(type, message) {
        const container = this._shadow.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }
}

customElements.define('mdx-blog-editor', MdxBlogEditor);
console.log('✍️ MdxBlogEditor: Custom element registered');
