// VARIANT 2 OPTIMIZED: MINIMAL CARD LAYOUT - HIGH PERFORMANCE
// Optimizations: Lazy loading, minimal initial JS, progressive enhancement, optimized images

class MinimalCardBlogViewerOptimized extends HTMLElement {
    constructor() {
        super();
        
        this.state = {
            postData: null,
            relatedPosts: [],
            isLoading: true,
            viewCount: 0
        };

        this.markedLoaded = false;
        this.initialRenderDone = false;
        this.criticalOnly = true; // Start with critical CSS only
        
        const initialStyleProps = this.getAttribute('style-props');
        this.styleProps = initialStyleProps ? JSON.parse(initialStyleProps) : this.getDefaultStyleProps();
    }

    static get observedAttributes() {
        return ['post-data', 'related-posts', 'style-props', 'view-count'];
    }

    get postData() { return this.state.postData; }
    set postData(value) {
        try {
            this.state.postData = typeof value === 'string' ? JSON.parse(value) : value;
            this.state.isLoading = false;
            
            if (this.initialRenderDone) {
                requestAnimationFrame(() => {
                    this.renderPost();
                    this.updateSEOMarkup();
                    // Load non-critical features after initial render
                    this.loadNonCriticalFeatures();
                });
            }
        } catch (e) {
            console.error('Error setting post data:', e);
        }
    }

    get relatedPosts() { return this.state.relatedPosts; }
    set relatedPosts(value) {
        try {
            this.state.relatedPosts = typeof value === 'string' ? JSON.parse(value) : value;
            if (this.initialRenderDone) {
                // Defer related posts rendering
                setTimeout(() => this.renderRelatedPosts(), 100);
            }
        } catch (e) {
            console.error('Error setting related posts:', e);
        }
    }

    get viewCount() { return this.state.viewCount; }
    set viewCount(value) {
        try {
            this.state.viewCount = typeof value === 'string' ? parseInt(value) : value;
            if (this.initialRenderDone) {
                this.updateViewCount();
            }
        } catch (e) {
            console.error('Error setting view count:', e);
        }
    }

    getDefaultStyleProps() {
        return {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            bgColor: '#1E1E1E',
            h1Color: '#64FFDA',
            h2Color: '#64FFDA',
            h3Color: '#64FFDA',
            h4Color: '#64FFDA',
            h5Color: '#64FFDA',
            h6Color: '#64FFDA',
            paragraphColor: '#ffffff',
            linkColor: '#FFFF05',
            strongColor: '#64FFDA',
            blockquoteBg: '#2d2d2d',
            blockquoteBorder: '#FFFF05',
            blockquoteText: '#FFFF05',
            codeBg: '#2d2d2d',
            codeText: '#64FFDA',
            tableHeaderBg: '#1a1a1a',
            tableHeaderText: '#64FFDA',
            tableRowBg: '#2d2d2d',
            tableRowAltBg: '#252525',
            tableText: '#ffffff',
            tableBorder: '#3d3d3d',
            tocBg: '#2d2d2d',
            tocBorder: '#3d3d3d',
            tocTitle: '#64FFDA',
            tocText: '#b0b0b0',
            tocActive: '#64FFDA',
            authorBorder: '#64FFDA',
            metaText: '#9ca3af',
            shareBg: '#2d2d2d',
            shareBorder: '#3d3d3d',
            shareText: '#b0b0b0',
            shareHover: '#64FFDA',
            tagBg: '#2d2d2d',
            tagText: '#64FFDA',
            tagBorder: '#3d3d3d',
            relatedCardBg: '#2d2d2d',
            relatedCardBorder: '#3d3d3d',
            relatedCategory: '#64FFDA',
            relatedTitle: '#ffffff',
            relatedExcerpt: '#9ca3af',
            relatedMeta: '#6b7280',
            viewCountBg: '#2d2d2d',
            viewCountText: '#64FFDA',
            viewCountBorder: '#3d3d3d'
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        if (name === 'post-data') {
            this.postData = newValue; 
        } else if (name === 'related-posts') {
            this.relatedPosts = newValue; 
        } else if (name === 'view-count') {
            this.viewCount = newValue;
        } else if (name === 'style-props') {
            try {
                const newStyleProps = JSON.parse(newValue);
                this.styleProps = { ...this.styleProps, ...newStyleProps };
                if (this.initialRenderDone) {
                    this.updateStyles();
                }
            } catch (error) {
                console.error('Error parsing style props:', error);
            }
        }
    }

    initializeUI() {
        // Minimal HTML structure for fast initial render
        this.innerHTML = `
            <style>${this.getCriticalStyles()}</style>

            <article class="minimal-blog-container">
                <!-- Header Card with eager content -->
                <div class="header-card">
                    <div class="breadcrumb" id="breadcrumb"></div>
                    <h1 class="post-title" id="postTitle"></h1>
                    <div class="meta-row" id="metaRow"></div>
                </div>

                <!-- Main Content Card -->
                <div class="content-card">
                    <div id="articleContent"></div>
                </div>

                <!-- Below-fold content loaded lazily -->
                <div id="belowFoldContent"></div>
            </article>
        `;

        this.breadcrumb = this.querySelector('#breadcrumb');
        this.postTitle = this.querySelector('#postTitle');
        this.metaRow = this.querySelector('#metaRow');
        this.contentElement = this.querySelector('#articleContent');
        this.belowFoldContent = this.querySelector('#belowFoldContent');
        
        this.initialRenderDone = true;
        
        if (this.state.isLoading) {
            this.showLoading();
        } else if (this.state.postData) {
            this.renderPost();
            this.updateSEOMarkup();
        }
    }

    // PERFORMANCE OPTIMIZATION: Critical CSS only for initial render
    getCriticalStyles() {
        const { fontFamily, bgColor, h1Color, paragraphColor, tableRowBg, tableBorder, metaText, tocBorder, tocActive } = this.styleProps;
        
        // Only include styles needed for above-the-fold content
        return `
            minimal-card-blog-viewer-optimized {
                display: block;
                width: 100%;
                font-family: ${fontFamily};
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                contain: layout style paint;
            }
            
            minimal-card-blog-viewer-optimized * { box-sizing: border-box; }
            
            minimal-card-blog-viewer-optimized .minimal-blog-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 60px 20px 100px;
                background-color: ${bgColor};
            }
            
            /* Critical card styles */
            minimal-card-blog-viewer-optimized .header-card,
            minimal-card-blog-viewer-optimized .content-card {
                background: ${tableRowBg};
                border: 1px solid ${tableBorder};
                border-radius: 20px;
                padding: 40px;
                margin-bottom: 30px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }
            
            /* Critical header styles */
            minimal-card-blog-viewer-optimized .breadcrumb {
                font-size: 14px;
                color: ${metaText};
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            minimal-card-blog-viewer-optimized .post-title {
                font-size: clamp(32px, 6vw, 48px);
                font-weight: 900;
                color: ${h1Color};
                line-height: 1.2;
                margin: 0 0 30px;
                letter-spacing: -0.5px;
                /* PERFORMANCE: Reserve space to prevent layout shift */
                min-height: 1.2em;
            }
            
            minimal-card-blog-viewer-optimized .meta-row {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                align-items: center;
                padding-top: 30px;
                border-top: 1px solid ${tableBorder};
            }
            
            minimal-card-blog-viewer-optimized .meta-chip {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: ${bgColor};
                border: 1px solid ${tocBorder};
                padding: 8px 16px;
                border-radius: 30px;
                font-size: 14px;
                color: ${metaText};
            }
            
            minimal-card-blog-viewer-optimized .meta-chip svg {
                width: 16px;
                height: 16px;
                fill: ${tocActive};
            }
            
            /* Critical content styles */
            minimal-card-blog-viewer-optimized .content-card {
                padding: 50px;
            }
            
            minimal-card-blog-viewer-optimized #articleContent {
                font-size: 18px;
                line-height: 1.9;
                color: ${paragraphColor};
                /* PERFORMANCE: Use content-visibility for off-screen content */
                content-visibility: auto;
            }
            
            /* Lazy load placeholder */
            minimal-card-blog-viewer-optimized .lazy-section {
                min-height: 100px;
                /* PERFORMANCE: Reserve space */
            }
            
            @media (max-width: 768px) {
                minimal-card-blog-viewer-optimized .minimal-blog-container {
                    padding: 40px 16px 80px;
                }
                
                minimal-card-blog-viewer-optimized .header-card,
                minimal-card-blog-viewer-optimized .content-card {
                    padding: 24px;
                }
                
                minimal-card-blog-viewer-optimized .content-card {
                    padding: 32px 24px;
                }
            }
        `;
    }

    // PERFORMANCE: Load non-critical styles after initial render
    loadNonCriticalFeatures() {
        if (!this.criticalOnly) return;
        this.criticalOnly = false;
        
        // Add full styles
        const styleElement = this.querySelector('style');
        if (styleElement) {
            styleElement.textContent = this.getFullStyles();
        }
        
        // Load marked.js only after content is visible
        this.loadMarkedJS();
    }

    getFullStyles() {
        const {
            fontFamily, bgColor, h1Color, h2Color, h3Color, h4Color, h5Color, h6Color,
            paragraphColor, linkColor, strongColor, blockquoteBg, blockquoteBorder, blockquoteText,
            codeBg, codeText, tableHeaderBg, tableHeaderText, tableRowBg, tableRowAltBg, tableText, tableBorder,
            tocBg, tocBorder, tocTitle, tocText, tocActive, authorBorder, metaText,
            shareBg, shareBorder, shareText, shareHover, tagBg, tagText, tagBorder,
            relatedCardBg, relatedCardBorder, relatedCategory, relatedTitle, relatedExcerpt, relatedMeta,
            viewCountBg, viewCountText, viewCountBorder
        } = this.styleProps;
        
        return `
            ${this.getCriticalStyles()}
            
            /* Non-critical styles loaded after initial render */
            minimal-card-blog-viewer-optimized .breadcrumb-item {
                color: ${tocActive};
                text-decoration: none;
            }
            
            minimal-card-blog-viewer-optimized .breadcrumb-sep {
                color: ${tableBorder};
            }
            
            minimal-card-blog-viewer-optimized .view-badge {
                background: ${viewCountBg};
                border-color: ${viewCountBorder};
                color: ${viewCountText};
                font-weight: 600;
            }
            
            /* TOC Dropdown */
            minimal-card-blog-viewer-optimized .toc-dropdown {
                margin-bottom: 30px;
            }
            
            minimal-card-blog-viewer-optimized .toc-toggle {
                width: 100%;
                background: ${tocBg};
                border: 2px solid ${tocBorder};
                border-radius: 16px;
                padding: 18px 24px;
                color: ${tocTitle};
                font-size: 16px;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                transition: all 0.3s;
                will-change: background, border-color;
            }
            
            minimal-card-blog-viewer-optimized .toc-toggle:hover {
                background: ${tableRowAltBg};
                border-color: ${tocActive};
            }
            
            minimal-card-blog-viewer-optimized .toc-toggle.open .chevron {
                transform: rotate(180deg);
            }
            
            minimal-card-blog-viewer-optimized .toc-toggle .chevron {
                transition: transform 0.3s;
                margin-left: auto;
            }
            
            minimal-card-blog-viewer-optimized .toc-dropdown-content {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
                background: ${tocBg};
                border: 2px solid ${tocBorder};
                border-top: none;
                border-radius: 0 0 16px 16px;
                margin-top: -16px;
                padding: 0 24px;
            }
            
            minimal-card-blog-viewer-optimized .toc-dropdown-content.open {
                max-height: 600px;
                padding: 20px 24px 24px;
                overflow-y: auto;
            }
            
            minimal-card-blog-viewer-optimized .toc-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            minimal-card-blog-viewer-optimized .toc-list li {
                margin-bottom: 4px;
            }
            
            minimal-card-blog-viewer-optimized .toc-list a {
                color: ${tocText};
                text-decoration: none;
                display: block;
                padding: 10px 14px;
                border-radius: 10px;
                transition: all 0.2s;
                font-size: 15px;
            }
            
            minimal-card-blog-viewer-optimized .toc-list a:hover,
            minimal-card-blog-viewer-optimized .toc-list a.active {
                color: ${tocActive};
                background: rgba(100, 255, 218, 0.1);
            }
            
            /* Typography - loaded after initial render */
            minimal-card-blog-viewer-optimized #articleContent h2 {
                font-size: clamp(26px, 4vw, 36px);
                font-weight: 800;
                color: ${h2Color};
                margin: 60px 0 24px;
                line-height: 1.3;
                padding-bottom: 16px;
                border-bottom: 2px solid ${tableBorder};
            }
            
            minimal-card-blog-viewer-optimized #articleContent h3 {
                font-size: clamp(22px, 3vw, 28px);
                font-weight: 700;
                color: ${h3Color};
                margin: 50px 0 20px;
                line-height: 1.3;
            }
            
            minimal-card-blog-viewer-optimized #articleContent h4 {
                font-size: clamp(19px, 2.5vw, 23px);
                font-weight: 700;
                color: ${h4Color};
                margin: 40px 0 16px;
            }
            
            minimal-card-blog-viewer-optimized #articleContent h5 {
                font-size: clamp(17px, 2vw, 20px);
                font-weight: 700;
                color: ${h5Color};
                margin: 30px 0 14px;
            }
            
            minimal-card-blog-viewer-optimized #articleContent h6 {
                font-size: clamp(16px, 1.8vw, 18px);
                font-weight: 700;
                color: ${h6Color};
                margin: 30px 0 14px;
            }
            
            minimal-card-blog-viewer-optimized #articleContent p {
                margin-bottom: 30px;
                line-height: 1.9;
            }
            
            minimal-card-blog-viewer-optimized #articleContent a {
                color: ${linkColor};
                text-decoration: none;
                font-weight: 600;
                border-bottom: 2px solid ${linkColor};
                transition: opacity 0.2s;
                padding-bottom: 2px;
            }
            
            minimal-card-blog-viewer-optimized #articleContent a:hover {
                opacity: 0.7;
            }
            
            minimal-card-blog-viewer-optimized #articleContent strong {
                font-weight: 700;
                color: ${strongColor};
            }
            
            minimal-card-blog-viewer-optimized #articleContent em {
                font-style: italic;
            }
            
            minimal-card-blog-viewer-optimized #articleContent del {
                text-decoration: line-through;
                opacity: 0.7;
            }
            
            minimal-card-blog-viewer-optimized #articleContent ul,
            minimal-card-blog-viewer-optimized #articleContent ol {
                margin-bottom: 30px;
                padding-left: 30px;
            }
            
            minimal-card-blog-viewer-optimized #articleContent li {
                margin-bottom: 14px;
                line-height: 1.8;
            }
            
            minimal-card-blog-viewer-optimized #articleContent blockquote {
                margin: 40px 0;
                padding: 30px 40px;
                background: ${blockquoteBg};
                border-left: 5px solid ${blockquoteBorder};
                border-radius: 0 16px 16px 0;
                font-size: 20px;
                font-style: italic;
                color: ${blockquoteText};
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            }
            
            minimal-card-blog-viewer-optimized #articleContent code {
                background: ${codeBg};
                padding: 4px 10px;
                border-radius: 6px;
                font-family: 'Monaco', 'Courier New', monospace;
                font-size: 0.9em;
                color: ${codeText};
                border: 1px solid ${tocBorder};
            }
            
            minimal-card-blog-viewer-optimized #articleContent pre {
                background: ${codeBg};
                padding: 28px;
                border-radius: 16px;
                overflow-x: auto;
                margin: 40px 0;
                border: 1px solid ${tocBorder};
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            }
            
            minimal-card-blog-viewer-optimized #articleContent pre code {
                background: transparent;
                padding: 0;
                border: none;
                font-size: 15px;
            }
            
            /* PERFORMANCE: Use transform for images to enable GPU acceleration */
            minimal-card-blog-viewer-optimized #articleContent img {
                max-width: 100%;
                height: auto;
                border-radius: 16px;
                margin: 40px auto;
                display: block;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                transform: translateZ(0);
                will-change: transform;
            }
            
            minimal-card-blog-viewer-optimized #articleContent hr {
                border: none;
                border-top: 2px solid ${tableBorder};
                margin: 60px 0;
            }
            
            /* Tables */
            minimal-card-blog-viewer-optimized .table-wrapper {
                overflow-x: auto;
                margin: 40px 0;
                border-radius: 12px;
            }
            
            minimal-card-blog-viewer-optimized #articleContent table {
                width: 100%;
                border-collapse: collapse;
                background: ${tableRowBg};
                border-radius: 12px;
                overflow: hidden;
            }
            
            minimal-card-blog-viewer-optimized #articleContent table th,
            minimal-card-blog-viewer-optimized #articleContent table td {
                padding: 16px 20px;
                text-align: left;
                border-bottom: 1px solid ${tableBorder};
            }
            
            minimal-card-blog-viewer-optimized #articleContent table th {
                background: ${tableHeaderBg};
                color: ${tableHeaderText};
                font-weight: 700;
            }
            
            minimal-card-blog-viewer-optimized #articleContent table tbody tr:nth-child(even) {
                background: ${tableRowAltBg};
            }
            
            /* Video Embeds */
            minimal-card-blog-viewer-optimized .video-embed {
                position: relative;
                padding-bottom: 56.25%;
                height: 0;
                overflow: hidden;
                margin: 40px 0;
                border-radius: 16px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            }
            
            minimal-card-blog-viewer-optimized .video-embed iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 0;
            }
            
            /* Below-fold content */
            minimal-card-blog-viewer-optimized .author-card,
            minimal-card-blog-viewer-optimized .tags-card,
            minimal-card-blog-viewer-optimized .share-card {
                background: ${tableRowBg};
                border: 1px solid ${tableBorder};
                border-radius: 20px;
                padding: 40px;
                margin-bottom: 30px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }
            
            minimal-card-blog-viewer-optimized .author-card {
                display: flex;
                align-items: center;
                gap: 24px;
            }
            
            minimal-card-blog-viewer-optimized .author-avatar {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                object-fit: cover;
                border: 3px solid ${authorBorder};
                flex-shrink: 0;
            }
            
            minimal-card-blog-viewer-optimized .author-info h3 {
                font-size: 22px;
                font-weight: 800;
                color: ${paragraphColor};
                margin: 0 0 8px;
            }
            
            minimal-card-blog-viewer-optimized .author-info p {
                font-size: 15px;
                color: ${metaText};
                margin: 0;
                line-height: 1.6;
            }
            
            minimal-card-blog-viewer-optimized .tags-card {
                padding: 30px 40px;
            }
            
            minimal-card-blog-viewer-optimized .tags-title {
                font-size: 14px;
                font-weight: 700;
                color: ${metaText};
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 16px;
            }
            
            minimal-card-blog-viewer-optimized .tags-list {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            minimal-card-blog-viewer-optimized .tag {
                background: ${tagBg};
                color: ${tagText};
                padding: 10px 20px;
                border-radius: 24px;
                font-size: 14px;
                font-weight: 600;
                border: 1px solid ${tagBorder};
                transition: all 0.2s;
            }
            
            minimal-card-blog-viewer-optimized .tag:hover {
                background: ${tagBorder};
                border-color: ${tagText};
                transform: translateY(-2px);
            }
            
            minimal-card-blog-viewer-optimized .share-card {
                padding: 30px 40px;
                text-align: center;
            }
            
            minimal-card-blog-viewer-optimized .share-label {
                font-size: 16px;
                font-weight: 700;
                color: ${metaText};
                margin-bottom: 20px;
            }
            
            minimal-card-blog-viewer-optimized .share-buttons {
                display: flex;
                justify-content: center;
                gap: 16px;
                flex-wrap: wrap;
            }
            
            minimal-card-blog-viewer-optimized .share-btn {
                width: 52px;
                height: 52px;
                border-radius: 50%;
                border: 2px solid ${shareBorder};
                background: ${shareBg};
                color: ${shareText};
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            minimal-card-blog-viewer-optimized .share-btn svg {
                width: 22px;
                height: 22px;
                fill: currentColor;
            }
            
            minimal-card-blog-viewer-optimized .share-btn:hover {
                background: ${shareHover};
                color: ${bgColor};
                border-color: ${shareHover};
                transform: translateY(-4px) scale(1.1);
                box-shadow: 0 8px 16px rgba(100, 255, 218, 0.3);
            }
            
            minimal-card-blog-viewer-optimized .related-section {
                margin-top: 60px;
            }
            
            minimal-card-blog-viewer-optimized .related-title {
                font-size: 32px;
                font-weight: 900;
                color: ${h2Color};
                text-align: center;
                margin-bottom: 40px;
            }
            
            minimal-card-blog-viewer-optimized .related-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 24px;
            }
            
            minimal-card-blog-viewer-optimized .related-card {
                background: ${relatedCardBg};
                border: 1px solid ${relatedCardBorder};
                border-radius: 20px;
                overflow: hidden;
                transition: all 0.3s;
                cursor: pointer;
            }
            
            minimal-card-blog-viewer-optimized .related-card:hover {
                transform: translateY(-6px);
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
                border-color: ${relatedCategory};
            }
            
            /* PERFORMANCE: Explicit dimensions to prevent layout shift */
            minimal-card-blog-viewer-optimized .related-image {
                width: 100%;
                height: 200px;
                object-fit: cover;
                aspect-ratio: 16/9;
            }
            
            minimal-card-blog-viewer-optimized .related-content {
                padding: 24px;
            }
            
            minimal-card-blog-viewer-optimized .related-category {
                display: inline-block;
                background: rgba(100, 255, 218, 0.15);
                color: ${relatedCategory};
                padding: 6px 14px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 700;
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            minimal-card-blog-viewer-optimized .related-title-text {
                font-size: 20px;
                font-weight: 800;
                color: ${relatedTitle};
                margin-bottom: 12px;
                line-height: 1.4;
            }
            
            minimal-card-blog-viewer-optimized .related-excerpt {
                font-size: 14px;
                color: ${relatedExcerpt};
                line-height: 1.6;
                margin-bottom: 16px;
            }
            
            @media (max-width: 768px) {
                minimal-card-blog-viewer-optimized #articleContent {
                    font-size: 17px;
                }
                
                minimal-card-blog-viewer-optimized .author-card {
                    flex-direction: column;
                    text-align: center;
                }
                
                minimal-card-blog-viewer-optimized .related-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }

    updateStyles() {
        const styleElement = this.querySelector('style');
        if (styleElement) {
            styleElement.textContent = this.getFullStyles();
        }
    }

    showLoading() {
        this.contentElement.innerHTML = '<p style="text-align: center; color: ' + this.styleProps.metaText + '; padding: 60px 20px;">Loading...</p>';
    }

    renderPost() {
        if (!this.state.postData || !this.initialRenderDone) return;
        
        const post = this.state.postData;
        const viewCount = this.state.viewCount || post.viewCount || 0;
        
        // Breadcrumb
        this.breadcrumb.innerHTML = `
            <a href="/" class="breadcrumb-item">Home</a>
            <span class="breadcrumb-sep">›</span>
            <a href="/blog" class="breadcrumb-item">Blog</a>
            ${post.category ? `<span class="breadcrumb-sep">›</span><span class="breadcrumb-item">${this._escapeHtml(post.category)}</span>` : ''}
        `;
        
        // Title - PERFORMANCE: Set immediately for LCP
        this.postTitle.textContent = post.blogTitle || post.title || 'Untitled';
        
        // Meta Row
        this.metaRow.innerHTML = `
            <div class="meta-chip">
                <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                ${this._escapeHtml(post.author || 'Anonymous')}
            </div>
            <div class="meta-chip">
                <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                ${this._formatDate(post.publishedDate)}
            </div>
            <div class="meta-chip">
                <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                ${post.readTime || '5'} min
            </div>
            <div class="meta-chip view-badge">
                <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                <span id="viewCountNumber">${this._formatNumber(viewCount)}</span>
            </div>
        `;
        
        // Render Content - PERFORMANCE: Priority content first
        this._renderContent(post.content);
        
        // Defer below-fold content
        requestIdleCallback(() => this.renderBelowFold(post), { timeout: 2000 });
    }

    renderBelowFold(post) {
        const authorImageUrl = this._convertWixImageUrl(post.authorImage);
        
        let belowFoldHTML = `
            <!-- TOC Dropdown -->
            <div class="toc-dropdown" id="tocDropdown" style="display: none;">
                <button class="toc-toggle" id="tocToggle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9h14V7H3v2zm0 4h14v-2H3v2zm0 4h14v-2H3v2zm16 0h2v-2h-2v2zm0-10v2h2V7h-2zm0 6h2v-2h-2v2z"/>
                    </svg>
                    Table of Contents
                    <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 10l5 5 5-5z"/>
                    </svg>
                </button>
                <div class="toc-dropdown-content" id="tocDropdownContent"></div>
            </div>

            <!-- Author Card -->
            <div class="author-card">
                <img src="${authorImageUrl}" alt="${this._escapeHtml(post.author)}" class="author-avatar" width="80" height="80" />
                <div class="author-info">
                    <h3>${this._escapeHtml(post.author || 'Anonymous')}</h3>
                    <p>Published ${this._formatDate(post.publishedDate)}</p>
                </div>
            </div>
        `;
        
        // Tags
        if (post.tags) {
            const tagArray = post.tags.split(',').map(t => t.trim());
            belowFoldHTML += `
                <div class="tags-card">
                    <div class="tags-title">Tagged With</div>
                    <div class="tags-list">
                        ${tagArray.map(tag => `<span class="tag">${this._escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        
        // Share Buttons
        belowFoldHTML += `
            <div class="share-card">
                <div class="share-label">Share this article</div>
                <div class="share-buttons">
                    <button class="share-btn" data-share="twitter" title="Share on Twitter">
                        <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </button>
                    <button class="share-btn" data-share="facebook" title="Share on Facebook">
                        <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </button>
                    <button class="share-btn" data-share="linkedin" title="Share on LinkedIn">
                        <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </button>
                    <button class="share-btn" data-share="copy" title="Copy Link">
                        <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    </button>
                </div>
            </div>
        `;
        
        this.belowFoldContent.innerHTML = belowFoldHTML;
        
        // Setup TOC toggle
        const tocToggle = this.querySelector('#tocToggle');
        const tocDropdownContent = this.querySelector('#tocDropdownContent');
        const tocDropdown = this.querySelector('#tocDropdown');
        
        if (tocToggle && tocDropdownContent) {
            tocToggle.addEventListener('click', () => {
                tocDropdownContent.classList.toggle('open');
                tocToggle.classList.toggle('open');
            });
            
            // Generate TOC if headings exist
            const headings = this.contentElement.querySelectorAll('h2, h3, h4');
            if (headings.length > 0) {
                let tocHTML = '<ul class="toc-list">';
                headings.forEach((heading, index) => {
                    const id = heading.id || `heading-${index}`;
                    if (!heading.id) heading.id = id;
                    tocHTML += `<li><a href="#${id}" data-heading-id="${id}">${this._escapeHtml(heading.textContent)}</a></li>`;
                });
                tocHTML += '</ul>';
                tocDropdownContent.innerHTML = tocHTML;
                tocDropdown.style.display = 'block';
                
                // Add smooth scroll
                tocDropdownContent.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const targetId = link.getAttribute('href').substring(1);
                        const targetElement = this.contentElement.querySelector(`#${targetId}`);
                        if (targetElement) {
                            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            tocDropdownContent.classList.remove('open');
                            tocToggle.classList.remove('open');
                        }
                    });
                });
            }
        }
        
        this._setupShareButtons();
    }

    // [Include all the helper methods from the complete version]
    _renderContent(markdown) {
        if (!markdown) return;
        
        let htmlContent;
        try {
            const preprocessed = this._preprocessMarkdown(markdown);
            if (window.marked && window.marked.parse) {
                window.marked.use({ breaks: true, gfm: true, headerIds: true, mangle: false });
                htmlContent = window.marked.parse(preprocessed);
            } else {
                htmlContent = this._simpleMarkdownParse(preprocessed);
            }
        } catch (error) {
            console.error('Parse error:', error);
            htmlContent = this._simpleMarkdownParse(this._preprocessMarkdown(markdown));
        }
        
        htmlContent = this._convertImagesInHTML(htmlContent);
        htmlContent = this._processVideoEmbeds(htmlContent);
        htmlContent = this._processHTMLEmbeds(htmlContent);
        htmlContent = this._wrapTablesForMobile(htmlContent);
        
        this.contentElement.innerHTML = htmlContent;
    }

    // All helper methods from complete version (copy from variant-2-minimal-card-complete.js)
    _preprocessMarkdown(markdown) {
        return this._preprocessMarkdownImages(markdown);
    }

    _preprocessMarkdownImages(markdown) {
        const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
        return markdown.replace(imagePattern, (match, alt, url) => {
            return `<img src="${url}" alt="${alt}" loading="lazy" />`;
        });
    }

    _simpleMarkdownParse(markdown) {
        let html = markdown;
        
        const codeBlocks = [];
        html = html.replace(/```([a-z]*)\n([\s\S]*?)```/gim, (match, lang, code) => {
            const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`;
            codeBlocks.push(`<pre><code class="language-${lang}">${this._escapeHtml(code.trim())}</code></pre>`);
            return placeholder;
        });

        const inlineCodes = [];
        html = html.replace(/`([^`]+)`/gim, (match, code) => {
            const placeholder = `___INLINE_CODE_${inlineCodes.length}___`;
            inlineCodes.push(`<code>${this._escapeHtml(code)}</code>`);
            return placeholder;
        });

        const protectedImages = [];
        html = html.replace(/<img[^>]+>/g, (match) => {
            const placeholder = `___PROTECTED_IMAGE_${protectedImages.length}___`;
            protectedImages.push(match);
            return placeholder;
        });

        html = this._parseMarkdownTables(html);

        html = html.replace(/^######\s+(.*)$/gim, '<h6>$1</h6>');
        html = html.replace(/^#####\s+(.*)$/gim, '<h5>$1</h5>');
        html = html.replace(/^####\s+(.*)$/gim, '<h4>$1</h4>');
        html = html.replace(/^###\s+(.*)$/gim, '<h3>$1</h3>');
        html = html.replace(/^##\s+(.*)$/gim, '<h2>$1</h2>');
        html = html.replace(/^#\s+(.*)$/gim, '<h1>$1</h1>');

        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
        html = html.replace(/~~(.+?)~~/gim, '<del>$1</del>');
        html = html.replace(/\*\*\*([^\*]+)\*\*\*/gim, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*([^\*]+)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/\*([^\*]+)\*/gim, '<em>$1</em>');
        html = html.replace(/^---$/gim, '<hr>');
        html = html.replace(/^\*\*\*$/gim, '<hr>');

        protectedImages.forEach((img, index) => {
            html = html.replace(`___PROTECTED_IMAGE_${index}___`, img);
        });

        inlineCodes.forEach((code, index) => {
            html = html.replace(`___INLINE_CODE_${index}___`, code);
        });

        codeBlocks.forEach((code, index) => {
            html = html.replace(`___CODE_BLOCK_${index}___`, code);
        });

        html = html.replace(/\n\n+/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        html = '<p>' + html + '</p>';
        
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>\s*<\/p>/g, '');
        html = html.replace(/<p>(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<table>)/g, '$1');
        html = html.replace(/(<\/table>)<\/p>/g, '$1');
        html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
        html = html.replace(/<p>(<div class="video-embed">)/g, '$1');
        html = html.replace(/(<\/div>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        
        return html;
    }

    _parseMarkdownTables(markdown) {
        const lines = markdown.split('\n');
        let result = [];
        let inTable = false;
        let tableRows = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.includes('|')) {
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
                const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
                const isSeparator = /^[\s\|:-]+$/.test(nextLine);
                
                if (!inTable && isSeparator && cells.length > 0) {
                    inTable = true;
                    const headerCells = cells.map(cell => `<th>${cell}</th>`).join('');
                    tableRows.push(`<thead><tr>${headerCells}</tr></thead><tbody>`);
                    i++;
                } else if (inTable && cells.length > 0) {
                    const dataCells = cells.map(cell => `<td>${cell}</td>`).join('');
                    tableRows.push(`<tr>${dataCells}</tr>`);
                } else if (!inTable) {
                    result.push(line);
                }
            } else {
                if (inTable && tableRows.length > 0) {
                    tableRows.push('</tbody>');
                    result.push(`<table>${tableRows.join('')}</table>`);
                    tableRows = [];
                    inTable = false;
                }
                result.push(line);
            }
        }
        
        if (inTable && tableRows.length > 0) {
            tableRows.push('</tbody>');
            result.push(`<table>${tableRows.join('')}</table>`);
        }
        
        return result.join('\n');
    }

    // PERFORMANCE: Add explicit width/height to prevent layout shift
    _convertWixImageUrl(wixUrl) {
        if (!wixUrl || typeof wixUrl !== 'string') return 'https://static.wixstatic.com/media/default-image.jpg';
        if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) return wixUrl;

        if (wixUrl.startsWith('wix:image://')) {
            try {
                const parts = wixUrl.split('/');
                const fileId = parts[3]?.split('#')[0];
                if (fileId) return `https://static.wixstatic.com/media/${fileId}`;
            } catch (e) {
                console.error('Error parsing Wix image URL:', wixUrl, e);
            }
        }
        return 'https://static.wixstatic.com/media/default-image.jpg';
    }

    _convertImagesInHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = html;
        
        const images = template.content.querySelectorAll('img');
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src) {
                const convertedSrc = this._convertWixImageUrl(src);
                img.setAttribute('src', convertedSrc);
                img.setAttribute('loading', 'lazy');
                img.setAttribute('decoding', 'async');
                // PERFORMANCE: Add explicit dimensions to prevent layout shift
                img.setAttribute('width', '800');
                img.setAttribute('height', '450');
                img.setAttribute('style', 'width: 100%; height: auto;');
                img.setAttribute('onerror', "this.src='https://static.wixstatic.com/media/default-image.jpg'");
            }
        });
        
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(template.content);
        return tempDiv.innerHTML;
    }

    _processVideoEmbeds(html) {
        html = html.replace(/\[youtube:([a-zA-Z0-9_-]+)\]/g, (match, videoId) => {
            return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen title="YouTube video" loading="lazy"></iframe></div>`;
        });

        html = html.replace(/\[vimeo:(\d+)\]/g, (match, videoId) => {
            return `<div class="video-embed"><iframe src="https://player.vimeo.com/video/${videoId}" allowfullscreen title="Vimeo video" loading="lazy"></iframe></div>`;
        });

        return html;
    }

    _processHTMLEmbeds(html) {
        html = html.replace(/\[html\]([\s\S]*?)\[\/html\]/g, (match, htmlCode) => {
            return htmlCode;
        });

        return html;
    }

    _wrapTablesForMobile(html) {
        return html.replace(/<table>/g, '<div class="table-wrapper"><table>').replace(/<\/table>/g, '</table></div>');
    }

    renderRelatedPosts() {
        if (!this.state.relatedPosts || this.state.relatedPosts.length === 0) return;
        
        const posts = this.state.relatedPosts;
        const relatedHTML = `
            <div class="related-section">
                <h2 class="related-title">You Might Also Like</h2>
                <div class="related-grid">
                    ${posts.map(post => `
                        <div class="related-card" data-slug="${post.slug}">
                            <img src="${this._convertWixImageUrl(post.featuredImage)}" alt="${this._escapeHtml(post.blogTitle || post.title)}" class="related-image" loading="lazy" width="400" height="200" />
                            <div class="related-content">
                                ${post.category ? `<span class="related-category">${this._escapeHtml(post.category)}</span>` : ''}
                                <h3 class="related-title-text">${this._escapeHtml(post.blogTitle || post.title)}</h3>
                                <p class="related-excerpt">${this._escapeHtml(post.excerpt || '')}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.belowFoldContent.insertAdjacentHTML('beforeend', relatedHTML);

        this.querySelectorAll('.related-card').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.getAttribute('data-slug');
                this._navigateToPost(slug);
            });
        });
    }

    updateViewCount() {
        const el = this.querySelector('#viewCountNumber');
        if (el) el.textContent = this._formatNumber(this.state.viewCount);
    }

    updateSEOMarkup() {
        if (!this.state.postData || !this.initialRenderDone) return;

        const post = this.state.postData;
        let seoHTML = '';

        if (post.content) {
            let contentHTML = this._simpleMarkdownParse(post.content);
            contentHTML = this._convertImagesInHTML(contentHTML);
            contentHTML = this._processVideoEmbeds(contentHTML);
            contentHTML = this._processHTMLEmbeds(contentHTML);
            seoHTML += `<div class="blog-content">${contentHTML}</div>`;
        }

        seoHTML += `<div class="post-footer">`;
        seoHTML += `<strong>${this._escapeHtml(post.author || 'Anonymous')}</strong>`;
        seoHTML += `<span>${this._formatDate(post.publishedDate)}</span>`;
        seoHTML += `<span>${post.readTime || '5'} min read</span>`;
        seoHTML += `</div>`;

        if (post.tags) {
            const tags = post.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            if (tags.length > 0) {
                seoHTML += `<div class="tags-section">`;
                seoHTML += `<strong>Tags:</strong> `;
                seoHTML += tags.map(tag => `<span>${this._escapeHtml(tag)}</span>`).join(', ');
                seoHTML += `</div>`;
            }
        }

        if (this.state.relatedPosts && this.state.relatedPosts.length > 0) {
            seoHTML += `<div class="related-posts"><h2>Related Articles</h2><ul>`;
            this.state.relatedPosts.forEach(relatedPost => {
                const displayTitle = relatedPost.blogTitle || relatedPost.title || 'Untitled';
                seoHTML += `<li><a href="/blog-post/${relatedPost.slug}">${this._escapeHtml(displayTitle)}</a></li>`;
            });
            seoHTML += `</ul></div>`;
        }

        this.dispatchEvent(new CustomEvent('seo-markup-ready', {
            detail: { markup: seoHTML }, bubbles: true, composed: true
        }));
    }

    _setupShareButtons() {
        const shareButtons = this.querySelectorAll('[data-share]');
        shareButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = btn.getAttribute('data-share');
                this._handleShare(type);
            });
        });
    }

    _handleShare(type) {
        const url = window.location.href;
        const title = this.state.postData?.blogTitle || this.state.postData?.title || '';

        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        };

        if (type === 'copy') {
            navigator.clipboard.writeText(url).then(() => {
                alert('Link copied to clipboard!');
            }).catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Link copied to clipboard!');
            });
        } else if (shareUrls[type]) {
            window.open(shareUrls[type], '_blank', 'width=600,height=400');
        }
    }

    _navigateToPost(slug) {
        this.dispatchEvent(new CustomEvent('navigate-to-post', {
            detail: { slug }, bubbles: true, composed: true
        }));
    }

    _formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    _formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num.toString();
    }

    _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // PERFORMANCE: Lazy load marked.js only when needed
    loadMarkedJS() {
        if (window.marked) {
            this.markedLoaded = true;
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
        script.async = true;
        script.onload = () => {
            this.markedLoaded = true;
            if (this.state.postData && this.initialRenderDone) this.renderPost();
        };
        document.head.appendChild(script);
    }

    connectedCallback() {
        if (!this.initialRenderDone) this.initializeUI();
        // PERFORMANCE: Don't load marked.js immediately, wait for loadNonCriticalFeatures
    }

    disconnectedCallback() {}
}

customElements.define('minimal-card-blog-viewer-optimized', MinimalCardBlogViewerOptimized);
