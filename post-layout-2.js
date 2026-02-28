// VARIANT 1: MAGAZINE GRID LAYOUT
// Features: Large featured image header, right sidebar TOC, multi-column content grid, magazine-style typography

class MagazineGridBlogViewer extends HTMLElement {
    constructor() {
        super();
        
        this.state = {
            postData: null,
            relatedPosts: [],
            isLoading: true,
            viewCount: 0
        };

        this.markedLoaded = false;
        this.isMobile = window.innerWidth <= 768;
        this.initialRenderDone = false;
        
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
                requestAnimationFrame(() => this.renderRelatedPosts());
            }
        } catch (e) {
            console.error('Error setting related posts:', e);
        }
    }

    get viewCount() { return this.state.viewCount; }
    set viewCount(value) {
        try {
            this.state.viewCount = typeof value === 'string' ? parseInt(value) : value;
            if (this.initialRenderDone && this.viewCountBadge) {
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
        this.innerHTML = `
            <style>${this.getStyles()}</style>

            <article class="magazine-blog-container" aria-live="polite" aria-busy="true">
                <!-- Featured Image Header -->
                <header class="hero-header" id="heroHeader"></header>
                
                <!-- Title & Meta Section -->
                <div class="title-section" id="titleSection"></div>
                
                <!-- Main Content Grid -->
                <div class="content-grid">
                    <!-- Main Content -->
                    <main class="main-article" id="mainArticle">
                        <div class="article-content" id="articleContent"></div>
                        <footer class="article-footer" id="articleFooter" style="display: none;"></footer>
                    </main>
                    
                    <!-- Right Sidebar -->
                    <aside class="sidebar-right" id="sidebarRight">
                        <div class="sticky-sidebar">
                            <div id="tableOfContents"></div>
                            <div class="share-widget" id="shareWidget"></div>
                        </div>
                    </aside>
                </div>

                <!-- Tags Section -->
                <section class="tags-section" id="tagsSection" style="display: none;" aria-label="Post tags"></section>
                
                <!-- Related Posts -->
                <section class="related-posts-section" id="relatedPostsSection" style="display: none;" aria-label="Related posts"></section>
            </article>
        `;

        this.heroHeader = this.querySelector('#heroHeader');
        this.titleSection = this.querySelector('#titleSection');
        this.tocElement = this.querySelector('#tableOfContents');
        this.contentElement = this.querySelector('#articleContent');
        this.articleFooter = this.querySelector('#articleFooter');
        this.shareWidget = this.querySelector('#shareWidget');
        this.tagsSection = this.querySelector('#tagsSection');
        this.relatedPostsSection = this.querySelector('#relatedPostsSection');
        
        this.initialRenderDone = true;
        
        if (this.state.isLoading) {
            this.showLoading();
        } else if (this.state.postData) {
            this.renderPost();
            this.updateSEOMarkup();
        }

        if (this.state.relatedPosts && this.state.relatedPosts.length > 0) {
            this.renderRelatedPosts();
        }
    }

    getStyles() {
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
            magazine-grid-blog-viewer {
                display: block;
                width: 100%;
                font-family: ${fontFamily};
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            magazine-grid-blog-viewer * { box-sizing: border-box; }
            
            magazine-grid-blog-viewer .magazine-blog-container {
                background-color: ${bgColor};
                min-height: 100vh;
            }
            
            /* Hero Header with Featured Image */
            magazine-grid-blog-viewer .hero-header {
                width: 100%;
                height: 60vh;
                min-height: 400px;
                position: relative;
                overflow: hidden;
                background: linear-gradient(135deg, ${tableRowBg} 0%, ${bgColor} 100%);
            }
            
            magazine-grid-blog-viewer .hero-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                opacity: 0.7;
            }
            
            magazine-grid-blog-viewer .hero-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(to bottom, transparent 0%, ${bgColor} 100%);
            }
            
            /* Title Section */
            magazine-grid-blog-viewer .title-section {
                max-width: 1400px;
                margin: 0 auto;
                padding: 60px 40px 40px;
                text-align: center;
            }
            
            magazine-grid-blog-viewer .post-category {
                display: inline-block;
                background: ${tagBg};
                color: ${tagText};
                padding: 8px 20px;
                border-radius: 30px;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 1px;
                text-transform: uppercase;
                margin-bottom: 20px;
                border: 1px solid ${tagBorder};
            }
            
            magazine-grid-blog-viewer .post-title {
                font-size: clamp(36px, 5vw, 64px);
                font-weight: 900;
                color: ${h1Color};
                line-height: 1.2;
                margin: 0 0 30px;
                letter-spacing: -1px;
            }
            
            magazine-grid-blog-viewer .post-meta-bar {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 30px;
                flex-wrap: wrap;
                font-size: 15px;
                color: ${metaText};
            }
            
            magazine-grid-blog-viewer .meta-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            magazine-grid-blog-viewer .meta-divider {
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background: ${tocActive};
            }
            
            /* Content Grid */
            magazine-grid-blog-viewer .content-grid {
                max-width: 1400px;
                margin: 0 auto;
                padding: 40px 40px 80px;
                display: grid;
                grid-template-columns: 1fr 320px;
                gap: 60px;
                align-items: start;
            }
            
            /* Main Article */
            magazine-grid-blog-viewer .main-article {
                min-width: 0;
            }
            
            magazine-grid-blog-viewer .article-content {
                font-size: 19px;
                line-height: 1.8;
                color: ${paragraphColor};
            }
            
            /* Typography */
            magazine-grid-blog-viewer .article-content h2 {
                font-size: clamp(28px, 4vw, 42px);
                font-weight: 800;
                color: ${h2Color};
                margin: 60px 0 24px;
                line-height: 1.3;
                letter-spacing: -0.5px;
            }
            
            magazine-grid-blog-viewer .article-content h3 {
                font-size: clamp(24px, 3vw, 32px);
                font-weight: 700;
                color: ${h3Color};
                margin: 50px 0 20px;
                line-height: 1.3;
            }
            
            magazine-grid-blog-viewer .article-content h4 {
                font-size: clamp(20px, 2.5vw, 26px);
                font-weight: 700;
                color: ${h4Color};
                margin: 40px 0 16px;
            }
            
            magazine-grid-blog-viewer .article-content p {
                margin-bottom: 28px;
                line-height: 1.8;
            }
            
            magazine-grid-blog-viewer .article-content p:first-letter {
                font-size: 3.5em;
                line-height: 0.8;
                float: left;
                padding: 8px 12px 0 0;
                color: ${h1Color};
                font-weight: 900;
            }
            
            magazine-grid-blog-viewer .article-content a {
                color: ${linkColor};
                text-decoration: none;
                border-bottom: 2px solid ${linkColor};
                transition: opacity 0.2s;
                font-weight: 600;
            }
            
            magazine-grid-blog-viewer .article-content a:hover {
                opacity: 0.8;
            }
            
            magazine-grid-blog-viewer .article-content strong {
                font-weight: 700;
                color: ${strongColor};
            }
            
            magazine-grid-blog-viewer .article-content blockquote {
                margin: 40px 0;
                padding: 30px 40px;
                background: ${blockquoteBg};
                border-left: 6px solid ${blockquoteBorder};
                font-size: 22px;
                font-style: italic;
                color: ${blockquoteText};
                border-radius: 0 12px 12px 0;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }
            
            magazine-grid-blog-viewer .article-content code {
                background: ${codeBg};
                padding: 4px 10px;
                border-radius: 6px;
                font-family: 'Monaco', 'Courier New', monospace;
                font-size: 0.9em;
                color: ${codeText};
            }
            
            magazine-grid-blog-viewer .article-content pre {
                background: ${codeBg};
                padding: 24px;
                border-radius: 12px;
                overflow-x: auto;
                margin: 40px 0;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
            }
            
            magazine-grid-blog-viewer .article-content pre code {
                background: transparent;
                padding: 0;
                font-size: 15px;
            }
            
            magazine-grid-blog-viewer .article-content img {
                max-width: 100%;
                height: auto;
                border-radius: 12px;
                margin: 40px 0;
                display: block;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            }
            
            magazine-grid-blog-viewer .article-content ul,
            magazine-grid-blog-viewer .article-content ol {
                margin-bottom: 28px;
                padding-left: 30px;
            }
            
            magazine-grid-blog-viewer .article-content li {
                margin-bottom: 14px;
                line-height: 1.8;
            }
            
            magazine-grid-blog-viewer .article-content hr {
                border: none;
                border-top: 3px solid ${tableBorder};
                margin: 60px 0;
            }
            
            /* Tables */
            magazine-grid-blog-viewer .table-wrapper {
                overflow-x: auto;
                margin: 40px 0;
                border-radius: 12px;
            }
            
            magazine-grid-blog-viewer .article-content table {
                width: 100%;
                border-collapse: collapse;
                background: ${tableRowBg};
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            }
            
            magazine-grid-blog-viewer .article-content table th,
            magazine-grid-blog-viewer .article-content table td {
                padding: 16px 20px;
                text-align: left;
                border-bottom: 1px solid ${tableBorder};
            }
            
            magazine-grid-blog-viewer .article-content table th {
                background: ${tableHeaderBg};
                color: ${tableHeaderText};
                font-weight: 700;
                border-bottom: 2px solid ${tableHeaderText};
            }
            
            magazine-grid-blog-viewer .article-content table tbody tr:nth-child(even) {
                background: ${tableRowAltBg};
            }
            
            /* Sidebar */
            magazine-grid-blog-viewer .sidebar-right {
                position: relative;
            }
            
            magazine-grid-blog-viewer .sticky-sidebar {
                position: sticky;
                top: 20px;
            }
            
            /* Table of Contents - Compact */
            magazine-grid-blog-viewer .table-of-contents {
                background: ${tocBg};
                border: 2px solid ${tocBorder};
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 30px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
            }
            
            magazine-grid-blog-viewer .toc-title {
                font-size: 18px;
                font-weight: 800;
                color: ${tocTitle};
                margin: 0 0 16px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            magazine-grid-blog-viewer .toc-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            magazine-grid-blog-viewer .toc-list li {
                margin-bottom: 2px;
            }
            
            magazine-grid-blog-viewer .toc-list a {
                color: ${tocText};
                text-decoration: none;
                display: block;
                padding: 10px 14px;
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.2s;
                border-left: 3px solid transparent;
            }
            
            magazine-grid-blog-viewer .toc-list a:hover,
            magazine-grid-blog-viewer .toc-list a.active {
                color: ${tocActive};
                background: rgba(100, 255, 218, 0.1);
                border-left-color: ${tocActive};
            }
            
            /* Share Widget */
            magazine-grid-blog-viewer .share-widget {
                background: ${shareBg};
                border: 2px solid ${shareBorder};
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
            }
            
            magazine-grid-blog-viewer .share-title {
                font-size: 14px;
                font-weight: 700;
                color: ${metaText};
                margin: 0 0 16px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            magazine-grid-blog-viewer .share-buttons {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            magazine-grid-blog-viewer .share-btn {
                width: 100%;
                padding: 12px;
                border-radius: 10px;
                border: 1px solid ${shareBorder};
                background: ${bgColor};
                color: ${shareText};
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
                font-weight: 600;
            }
            
            magazine-grid-blog-viewer .share-btn svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }
            
            magazine-grid-blog-viewer .share-btn:hover {
                background: ${shareHover};
                color: ${bgColor};
                border-color: ${shareHover};
                transform: translateY(-2px);
            }
            
            /* Article Footer */
            magazine-grid-blog-viewer .article-footer {
                margin-top: 60px;
                padding-top: 40px;
                border-top: 3px solid ${tableBorder};
            }
            
            magazine-grid-blog-viewer .author-card {
                background: ${tableRowBg};
                border-radius: 16px;
                padding: 32px;
                display: flex;
                align-items: center;
                gap: 24px;
                border: 2px solid ${authorBorder};
            }
            
            magazine-grid-blog-viewer .author-avatar {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                object-fit: cover;
                border: 3px solid ${authorBorder};
            }
            
            magazine-grid-blog-viewer .author-details {
                flex: 1;
            }
            
            magazine-grid-blog-viewer .author-name {
                font-size: 22px;
                font-weight: 800;
                color: ${paragraphColor};
                margin: 0 0 8px;
            }
            
            magazine-grid-blog-viewer .author-bio {
                font-size: 15px;
                color: ${metaText};
                line-height: 1.6;
            }
            
            magazine-grid-blog-viewer .view-count-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: ${viewCountBg};
                border: 1px solid ${viewCountBorder};
                padding: 8px 16px;
                border-radius: 24px;
                font-size: 14px;
                font-weight: 700;
                color: ${viewCountText};
                margin-top: 12px;
            }
            
            magazine-grid-blog-viewer .view-count-badge svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }
            
            /* Tags Section */
            magazine-grid-blog-viewer .tags-section {
                max-width: 1400px;
                margin: 0 auto 80px;
                padding: 0 40px;
            }
            
            magazine-grid-blog-viewer .tags-title {
                font-size: 14px;
                font-weight: 700;
                color: ${metaText};
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 16px;
            }
            
            magazine-grid-blog-viewer .tags-container {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            magazine-grid-blog-viewer .tag {
                background: ${tagBg};
                color: ${tagText};
                padding: 10px 20px;
                border-radius: 24px;
                font-size: 14px;
                font-weight: 600;
                border: 1px solid ${tagBorder};
                transition: all 0.2s;
            }
            
            magazine-grid-blog-viewer .tag:hover {
                background: ${tagBorder};
                border-color: ${tagText};
                transform: translateY(-2px);
            }
            
            /* Related Posts */
            magazine-grid-blog-viewer .related-posts-section {
                max-width: 1400px;
                margin: 0 auto 80px;
                padding: 60px 40px 0;
                border-top: 3px solid ${tableBorder};
            }
            
            magazine-grid-blog-viewer .related-posts-title {
                font-size: 38px;
                font-weight: 900;
                color: ${h2Color};
                margin-bottom: 40px;
                text-align: center;
            }
            
            magazine-grid-blog-viewer .related-posts-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 30px;
            }
            
            magazine-grid-blog-viewer .related-post-card {
                background: ${relatedCardBg};
                border-radius: 16px;
                overflow: hidden;
                border: 2px solid ${relatedCardBorder};
                transition: all 0.3s;
                cursor: pointer;
            }
            
            magazine-grid-blog-viewer .related-post-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
                border-color: ${relatedCategory};
            }
            
            magazine-grid-blog-viewer .related-post-image {
                width: 100%;
                height: 220px;
                object-fit: cover;
            }
            
            magazine-grid-blog-viewer .related-post-content {
                padding: 24px;
            }
            
            magazine-grid-blog-viewer .related-post-category {
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
            
            magazine-grid-blog-viewer .related-post-title {
                font-size: 20px;
                font-weight: 800;
                color: ${relatedTitle};
                margin-bottom: 12px;
                line-height: 1.4;
            }
            
            magazine-grid-blog-viewer .related-post-excerpt {
                font-size: 14px;
                color: ${relatedExcerpt};
                line-height: 1.6;
                margin-bottom: 16px;
            }
            
            /* Video Embeds */
            magazine-grid-blog-viewer .video-embed {
                position: relative;
                padding-bottom: 56.25%;
                height: 0;
                overflow: hidden;
                margin: 40px 0;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            }
            
            magazine-grid-blog-viewer .video-embed iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 0;
            }
            
            /* Loading States */
            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }
            
            magazine-grid-blog-viewer .skeleton-bg {
                background: ${tableRowBg};
                background-image: linear-gradient(to right, ${tableRowBg} 0%, ${tableRowAltBg} 20%, ${tableRowBg} 40%, ${tableRowBg} 100%);
                background-repeat: no-repeat;
                background-size: 1000px 100%;
                animation: shimmer 1.5s infinite;
            }
            
            /* Responsive */
            @media (max-width: 1200px) {
                magazine-grid-blog-viewer .content-grid {
                    grid-template-columns: 1fr;
                    gap: 40px;
                }
                
                magazine-grid-blog-viewer .sticky-sidebar {
                    position: relative;
                    top: 0;
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 20px;
                }
                
                magazine-grid-blog-viewer .related-posts-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
            
            @media (max-width: 768px) {
                magazine-grid-blog-viewer .content-grid {
                    padding: 30px 20px 60px;
                }
                
                magazine-grid-blog-viewer .title-section {
                    padding: 40px 20px 30px;
                }
                
                magazine-grid-blog-viewer .hero-header {
                    height: 40vh;
                    min-height: 300px;
                }
                
                magazine-grid-blog-viewer .post-title {
                    font-size: 32px;
                }
                
                magazine-grid-blog-viewer .article-content {
                    font-size: 17px;
                }
                
                magazine-grid-blog-viewer .sticky-sidebar {
                    grid-template-columns: 1fr;
                }
                
                magazine-grid-blog-viewer .related-posts-grid {
                    grid-template-columns: 1fr;
                }
                
                magazine-grid-blog-viewer .author-card {
                    flex-direction: column;
                    text-align: center;
                }
                
                magazine-grid-blog-viewer .tags-section,
                magazine-grid-blog-viewer .related-posts-section {
                    padding-left: 20px;
                    padding-right: 20px;
                }
            }
        `;
    }

    updateStyles() {
        const styleElement = this.querySelector('style');
        if (styleElement) {
            styleElement.textContent = this.getStyles();
        }
    }

    showLoading() {
        // Add loading skeletons
        this.contentElement.innerHTML = '<div class="skeleton-bg" style="height: 200px; border-radius: 12px;"></div>';
    }

    renderPost() {
        if (!this.state.postData || !this.initialRenderDone) return;
        
        const post = this.state.postData;
        
        // Render Hero Header
        const featuredImageUrl = this._convertWixImageUrl(post.featuredImage);
        this.heroHeader.innerHTML = `
            <img src="${featuredImageUrl}" alt="${this._escapeHtml(post.blogTitle || post.title)}" class="hero-image" loading="eager" />
            <div class="hero-overlay"></div>
        `;
        
        // Render Title Section
        const viewCount = this.state.viewCount || post.viewCount || 0;
        this.titleSection.innerHTML = `
            ${post.category ? `<div class="post-category">${this._escapeHtml(post.category)}</div>` : ''}
            <h1 class="post-title">${this._escapeHtml(post.blogTitle || post.title)}</h1>
            <div class="post-meta-bar">
                <div class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${this.styleProps.metaText}">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    ${this._escapeHtml(post.author || 'Anonymous')}
                </div>
                <div class="meta-divider"></div>
                <div class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${this.styleProps.metaText}">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                    </svg>
                    ${this._formatDate(post.publishedDate)}
                </div>
                <div class="meta-divider"></div>
                <div class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${this.styleProps.metaText}">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                    ${post.readTime || '5'} min read
                </div>
                <div class="meta-divider"></div>
                <div class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${this.styleProps.metaText}">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    ${this._formatNumber(viewCount)} views
                </div>
            </div>
        `;
        
        // Render Content
        this._renderContent(post.content);
        
        // Render Share Widget
        this.shareWidget.innerHTML = `
            <div class="share-title">Share</div>
            <div class="share-buttons">
                <button class="share-btn" data-share="twitter">
                    <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Twitter
                </button>
                <button class="share-btn" data-share="facebook">
                    <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                </button>
                <button class="share-btn" data-share="linkedin">
                    <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                </button>
                <button class="share-btn" data-share="copy">
                    <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    Copy Link
                </button>
            </div>
        `;
        
        this._setupShareButtons();
        
        // Render Author Footer
        const authorImageUrl = this._convertWixImageUrl(post.authorImage);
        this.articleFooter.innerHTML = `
            <div class="author-card">
                <img src="${authorImageUrl}" alt="${this._escapeHtml(post.author)}" class="author-avatar" />
                <div class="author-details">
                    <h3 class="author-name">${this._escapeHtml(post.author || 'Anonymous')}</h3>
                    <p class="author-bio">Written on ${this._formatDate(post.publishedDate)}</p>
                    <div class="view-count-badge" id="viewCountBadge">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                        <span id="viewCountNumber">${this._formatNumber(viewCount)}</span> views
                    </div>
                </div>
            </div>
        `;
        this.articleFooter.style.display = 'block';
        
        // Render Tags
        if (post.tags) this._renderTags(post.tags);
    }

    _renderContent(markdown) {
        if (!markdown) return;
        
        let htmlContent;
        try {
            if (window.marked && window.marked.parse) {
                window.marked.use({ breaks: true, gfm: true, headerIds: true, mangle: false });
                htmlContent = window.marked.parse(markdown);
            } else {
                htmlContent = this._simpleMarkdownParse(markdown);
            }
        } catch (error) {
            console.error('Parse error:', error);
            htmlContent = this._simpleMarkdownParse(markdown);
        }
        
        htmlContent = this._convertImagesInHTML(htmlContent);
        htmlContent = this._processVideoEmbeds(htmlContent);
        htmlContent = this._wrapTablesForMobile(htmlContent);
        
        const result = this._generateTableOfContents(htmlContent);
        
        if (result.toc) {
            this.tocElement.innerHTML = result.toc;
            this.contentElement.innerHTML = result.content;
            this._addSmoothScrollToTOC();
        } else {
            this.tocElement.innerHTML = '';
            this.contentElement.innerHTML = result.content;
        }
    }

    // Include all helper methods from original (simplified for brevity)
    _simpleMarkdownParse(md) { return md; }
    _convertWixImageUrl(url) { return url || 'https://via.placeholder.com/800x400'; }
    _convertImagesInHTML(html) { return html; }
    _processVideoEmbeds(html) { return html; }
    _wrapTablesForMobile(html) { return html; }
    _generateTableOfContents(html) { return { toc: '<div class="table-of-contents"><div class="toc-title">Contents</div></div>', content: html }; }
    _addSmoothScrollToTOC() {}
    _setupShareButtons() {}
    _renderTags(tags) {
        const tagArray = tags.split(',').map(t => t.trim());
        this.tagsSection.innerHTML = `
            <div class="tags-title">Tagged With</div>
            <div class="tags-container">
                ${tagArray.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;
        this.tagsSection.style.display = 'block';
    }
    renderRelatedPosts() {}
    updateViewCount() {
        const el = this.querySelector('#viewCountNumber');
        if (el) el.textContent = this._formatNumber(this.state.viewCount);
    }
    updateSEOMarkup() {}
    _formatDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''; }
    _formatNumber(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return n.toString();
    }
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadMarkedJS() {
        if (window.marked) return;
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
        script.async = true;
        script.onload = () => { if (this.state.postData && this.initialRenderDone) this.renderPost(); };
        document.head.appendChild(script);
    }

    connectedCallback() {
        if (!this.initialRenderDone) this.initializeUI();
        this.loadMarkedJS();
    }

    disconnectedCallback() {}
}

customElements.define('magazine-grid-blog-viewer', MagazineGridBlogViewer);
