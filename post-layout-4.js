// VARIANT 3: TIMELINE SPLIT-SCREEN LAYOUT - COMPLETE
// Features: Fixed left sidebar with reading progress circle, timeline navigation, large scrolling content area, full-height design

class TimelineSplitBlogViewer extends HTMLElement {
    constructor() {
        super();
        
        this.state = {
            postData: null,
            relatedPosts: [],
            isLoading: true,
            viewCount: 0,
            readingProgress: 0,
            currentSection: null
        };

        this.markedLoaded = false;
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
        this.innerHTML = `
            <style>${this.getStyles()}</style>

            <div class="timeline-blog-container">
                <!-- Left Sidebar - Fixed -->
                <aside class="left-sidebar" id="leftSidebar">
                    <!-- Reading Progress Circle -->
                    <div class="progress-ring-container">
                        <svg class="progress-ring" width="120" height="120">
                            <circle class="progress-ring-background" cx="60" cy="60" r="54" />
                            <circle class="progress-ring-progress" id="progressCircle" cx="60" cy="60" r="54" />
                        </svg>
                        <div class="progress-percentage" id="progressPercentage">0%</div>
                    </div>

                    <!-- Post Meta -->
                    <div class="sidebar-meta">
                        <div class="sidebar-author" id="sidebarAuthor"></div>
                        <div class="sidebar-stats" id="sidebarStats"></div>
                    </div>

                    <!-- Navigation Timeline -->
                    <nav class="nav-timeline" id="navTimeline" aria-label="Article sections"></nav>

                    <!-- Share Section -->
                    <div class="sidebar-share" id="sidebarShare"></div>
                </aside>

                <!-- Right Content Area - Scrolling -->
                <main class="content-area" id="contentArea">
                    <!-- Hero Title -->
                    <header class="content-header">
                        <div class="title-wrapper">
                            <div class="category-badge" id="categoryBadge"></div>
                            <h1 class="main-title" id="mainTitle"></h1>
                        </div>
                    </header>

                    <!-- Article Content -->
                    <article class="article-body" id="articleBody"></article>

                    <!-- Tags -->
                    <section class="tags-section" id="tagsSection" style="display: none;"></section>

                    <!-- Related Posts -->
                    <section class="related-section" id="relatedSection" style="display: none;"></section>
                </main>
            </div>
        `;

        this.leftSidebar = this.querySelector('#leftSidebar');
        this.progressCircle = this.querySelector('#progressCircle');
        this.progressPercentage = this.querySelector('#progressPercentage');
        this.sidebarAuthor = this.querySelector('#sidebarAuthor');
        this.sidebarStats = this.querySelector('#sidebarStats');
        this.navTimeline = this.querySelector('#navTimeline');
        this.sidebarShare = this.querySelector('#sidebarShare');
        this.contentArea = this.querySelector('#contentArea');
        this.categoryBadge = this.querySelector('#categoryBadge');
        this.mainTitle = this.querySelector('#mainTitle');
        this.articleBody = this.querySelector('#articleBody');
        this.tagsSection = this.querySelector('#tagsSection');
        this.relatedSection = this.querySelector('#relatedSection');
        
        this.initialRenderDone = true;
        
        // Setup scroll listener for progress
        this.contentArea.addEventListener('scroll', () => this.updateReadingProgress());
        
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
            timeline-split-blog-viewer {
                display: block;
                width: 100%;
                height: 100vh;
                font-family: ${fontFamily};
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            timeline-split-blog-viewer * { box-sizing: border-box; }
            
            timeline-split-blog-viewer .timeline-blog-container {
                display: flex;
                height: 100vh;
                background-color: ${bgColor};
            }
            
            /* Left Sidebar - Fixed */
            timeline-split-blog-viewer .left-sidebar {
                width: 380px;
                flex-shrink: 0;
                background: ${tableRowBg};
                border-right: 2px solid ${tableBorder};
                padding: 40px 30px;
                display: flex;
                flex-direction: column;
                gap: 40px;
                overflow-y: auto;
                position: relative;
            }
            
            /* Progress Ring */
            timeline-split-blog-viewer .progress-ring-container {
                position: relative;
                width: 120px;
                height: 120px;
                margin: 0 auto;
            }
            
            timeline-split-blog-viewer .progress-ring {
                transform: rotate(-90deg);
            }
            
            timeline-split-blog-viewer .progress-ring-background {
                fill: none;
                stroke: ${tocBorder};
                stroke-width: 8;
            }
            
            timeline-split-blog-viewer .progress-ring-progress {
                fill: none;
                stroke: ${tocActive};
                stroke-width: 8;
                stroke-linecap: round;
                stroke-dasharray: 339.292;
                stroke-dashoffset: 339.292;
                transition: stroke-dashoffset 0.3s ease;
            }
            
            timeline-split-blog-viewer .progress-percentage {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 22px;
                font-weight: 900;
                color: ${tocActive};
            }
            
            /* Sidebar Meta */
            timeline-split-blog-viewer .sidebar-meta {
                text-align: center;
                padding-bottom: 30px;
                border-bottom: 2px solid ${tableBorder};
            }
            
            timeline-split-blog-viewer .sidebar-author {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
            }
            
            timeline-split-blog-viewer .author-avatar-small {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                object-fit: cover;
                border: 3px solid ${authorBorder};
            }
            
            timeline-split-blog-viewer .author-name-small {
                font-size: 16px;
                font-weight: 700;
                color: ${paragraphColor};
            }
            
            timeline-split-blog-viewer .sidebar-stats {
                display: flex;
                flex-direction: column;
                gap: 10px;
                font-size: 14px;
                color: ${metaText};
            }
            
            timeline-split-blog-viewer .stat-item {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            timeline-split-blog-viewer .stat-item svg {
                width: 16px;
                height: 16px;
                fill: ${tocActive};
            }
            
            timeline-split-blog-viewer .view-count-stat {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: ${viewCountBg};
                border: 1px solid ${viewCountBorder};
                padding: 6px 14px;
                border-radius: 20px;
                font-weight: 700;
                color: ${viewCountText};
                margin-top: 8px;
            }
            
            /* Navigation Timeline */
            timeline-split-blog-viewer .nav-timeline {
                flex: 1;
                position: relative;
                padding-left: 24px;
            }
            
            timeline-split-blog-viewer .nav-timeline::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 3px;
                background: ${tocBorder};
                border-radius: 2px;
            }
            
            timeline-split-blog-viewer .timeline-list {
                list-style: none;
                padding: 0;
                margin: 0;
                position: relative;
            }
            
            timeline-split-blog-viewer .timeline-item {
                margin-bottom: 24px;
                position: relative;
            }
            
            timeline-split-blog-viewer .timeline-item::before {
                content: '';
                position: absolute;
                left: -30px;
                top: 8px;
                width: 12px;
                height: 12px;
                background: ${tocBorder};
                border: 3px solid ${bgColor};
                border-radius: 50%;
                transition: all 0.3s;
            }
            
            timeline-split-blog-viewer .timeline-item.active::before {
                background: ${tocActive};
                width: 16px;
                height: 16px;
                left: -32px;
                top: 6px;
                box-shadow: 0 0 0 4px rgba(100, 255, 218, 0.2);
            }
            
            timeline-split-blog-viewer .timeline-link {
                color: ${tocText};
                text-decoration: none;
                display: block;
                font-size: 15px;
                line-height: 1.6;
                transition: color 0.2s;
                font-weight: 500;
            }
            
            timeline-split-blog-viewer .timeline-item.active .timeline-link {
                color: ${tocActive};
                font-weight: 700;
            }
            
            timeline-split-blog-viewer .timeline-link:hover {
                color: ${tocActive};
            }
            
            /* Sidebar Share */
            timeline-split-blog-viewer .sidebar-share {
                padding-top: 30px;
                border-top: 2px solid ${tableBorder};
            }
            
            timeline-split-blog-viewer .share-title-small {
                font-size: 13px;
                font-weight: 700;
                color: ${metaText};
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 16px;
                text-align: center;
            }
            
            timeline-split-blog-viewer .share-buttons-small {
                display: flex;
                justify-content: center;
                gap: 12px;
            }
            
            timeline-split-blog-viewer .share-btn-small {
                width: 44px;
                height: 44px;
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
            
            timeline-split-blog-viewer .share-btn-small svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }
            
            timeline-split-blog-viewer .share-btn-small:hover {
                background: ${shareHover};
                color: ${bgColor};
                border-color: ${shareHover};
                transform: scale(1.15);
            }
            
            /* Content Area - Scrolling */
            timeline-split-blog-viewer .content-area {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 60px 80px 100px;
                scroll-behavior: smooth;
            }
            
            timeline-split-blog-viewer .content-area::-webkit-scrollbar {
                width: 10px;
            }
            
            timeline-split-blog-viewer .content-area::-webkit-scrollbar-track {
                background: ${bgColor};
            }
            
            timeline-split-blog-viewer .content-area::-webkit-scrollbar-thumb {
                background: ${tocActive};
                border-radius: 5px;
            }
            
            /* Content Header */
            timeline-split-blog-viewer .content-header {
                max-width: 900px;
                margin: 0 auto 60px;
            }
            
            timeline-split-blog-viewer .title-wrapper {
                position: relative;
            }
            
            timeline-split-blog-viewer .category-badge {
                display: inline-block;
                background: ${tagBg};
                color: ${tagText};
                padding: 10px 24px;
                border-radius: 30px;
                font-size: 14px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 30px;
                border: 2px solid ${tagBorder};
            }
            
            timeline-split-blog-viewer .main-title {
                font-size: clamp(40px, 6vw, 72px);
                font-weight: 900;
                color: ${h1Color};
                line-height: 1.1;
                margin: 0;
                letter-spacing: -1px;
            }
            
            /* Article Body */
            timeline-split-blog-viewer .article-body {
                max-width: 900px;
                margin: 0 auto;
            }
            
            timeline-split-blog-viewer .article-section {
                margin-bottom: 80px;
                scroll-margin-top: 40px;
            }
            
            timeline-split-blog-viewer .article-body {
                font-size: 19px;
                line-height: 1.8;
                color: ${paragraphColor};
            }
            
            timeline-split-blog-viewer .article-body h2 {
                font-size: clamp(32px, 4.5vw, 48px);
                font-weight: 900;
                color: ${h2Color};
                margin: 80px 0 30px;
                line-height: 1.2;
                position: relative;
                padding-left: 20px;
                scroll-margin-top: 40px;
            }
            
            timeline-split-blog-viewer .article-body h2::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 6px;
                background: ${h2Color};
                border-radius: 3px;
            }
            
            timeline-split-blog-viewer .article-body h3 {
                font-size: clamp(26px, 3.5vw, 36px);
                font-weight: 800;
                color: ${h3Color};
                margin: 60px 0 24px;
                line-height: 1.3;
                scroll-margin-top: 40px;
            }
            
            timeline-split-blog-viewer .article-body h4 {
                font-size: clamp(22px, 3vw, 28px);
                font-weight: 700;
                color: ${h4Color};
                margin: 50px 0 20px;
                scroll-margin-top: 40px;
            }
            
            timeline-split-blog-viewer .article-body h5 {
                font-size: clamp(19px, 2.5vw, 24px);
                font-weight: 700;
                color: ${h5Color};
                margin: 40px 0 16px;
            }
            
            timeline-split-blog-viewer .article-body h6 {
                font-size: clamp(17px, 2vw, 20px);
                font-weight: 700;
                color: ${h6Color};
                margin: 40px 0 16px;
            }
            
            timeline-split-blog-viewer .article-body p {
                margin-bottom: 32px;
                line-height: 1.9;
            }
            
            timeline-split-blog-viewer .article-body a {
                color: ${linkColor};
                text-decoration: none;
                font-weight: 700;
                border-bottom: 2px solid ${linkColor};
                transition: all 0.2s;
                padding-bottom: 2px;
            }
            
            timeline-split-blog-viewer .article-body a:hover {
                opacity: 0.7;
                border-bottom-width: 3px;
            }
            
            timeline-split-blog-viewer .article-body strong {
                font-weight: 800;
                color: ${strongColor};
            }
            
            timeline-split-blog-viewer .article-body em {
                font-style: italic;
            }
            
            timeline-split-blog-viewer .article-body del {
                text-decoration: line-through;
                opacity: 0.7;
            }
            
            timeline-split-blog-viewer .article-body ul,
            timeline-split-blog-viewer .article-body ol {
                margin-bottom: 32px;
                padding-left: 40px;
            }
            
            timeline-split-blog-viewer .article-body li {
                margin-bottom: 16px;
                line-height: 1.8;
            }
            
            timeline-split-blog-viewer .article-body ul li::marker {
                color: ${tocActive};
            }
            
            timeline-split-blog-viewer .article-body blockquote {
                margin: 50px 0;
                padding: 40px 50px;
                background: ${blockquoteBg};
                border-left: 8px solid ${blockquoteBorder};
                font-size: 24px;
                font-style: italic;
                color: ${blockquoteText};
                border-radius: 0 20px 20px 0;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                position: relative;
            }
            
            timeline-split-blog-viewer .article-body blockquote::before {
                content: '"';
                position: absolute;
                top: 10px;
                left: 15px;
                font-size: 80px;
                color: ${blockquoteBorder};
                opacity: 0.3;
                font-family: Georgia, serif;
            }
            
            timeline-split-blog-viewer .article-body code {
                background: ${codeBg};
                padding: 4px 12px;
                border-radius: 6px;
                font-family: 'Monaco', 'Courier New', monospace;
                font-size: 0.9em;
                color: ${codeText};
                border: 1px solid ${tocBorder};
            }
            
            timeline-split-blog-viewer .article-body pre {
                background: ${codeBg};
                padding: 32px;
                border-radius: 16px;
                overflow-x: auto;
                margin: 50px 0;
                border: 1px solid ${tocBorder};
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            }
            
            timeline-split-blog-viewer .article-body pre code {
                background: transparent;
                padding: 0;
                border: none;
                font-size: 15px;
            }
            
            timeline-split-blog-viewer .article-body img {
                max-width: 100%;
                height: auto;
                border-radius: 20px;
                margin: 50px auto;
                display: block;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
            }
            
            timeline-split-blog-viewer .article-body hr {
                border: none;
                border-top: 3px solid ${tableBorder};
                margin: 80px 0;
            }
            
            /* Tables */
            timeline-split-blog-viewer .table-wrapper {
                overflow-x: auto;
                margin: 50px 0;
                border-radius: 16px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            }
            
            timeline-split-blog-viewer .article-body table {
                width: 100%;
                border-collapse: collapse;
                background: ${tableRowBg};
            }
            
            timeline-split-blog-viewer .article-body table th,
            timeline-split-blog-viewer .article-body table td {
                padding: 18px 24px;
                text-align: left;
                border-bottom: 1px solid ${tableBorder};
            }
            
            timeline-split-blog-viewer .article-body table th {
                background: ${tableHeaderBg};
                color: ${tableHeaderText};
                font-weight: 800;
                text-transform: uppercase;
                font-size: 14px;
                letter-spacing: 1px;
            }
            
            timeline-split-blog-viewer .article-body table tbody tr:nth-child(even) {
                background: ${tableRowAltBg};
            }
            
            /* Video Embeds */
            timeline-split-blog-viewer .video-embed {
                position: relative;
                padding-bottom: 56.25%;
                height: 0;
                overflow: hidden;
                margin: 50px 0;
                border-radius: 20px;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
            }
            
            timeline-split-blog-viewer .video-embed iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 0;
            }
            
            /* Tags Section */
            timeline-split-blog-viewer .tags-section {
                max-width: 900px;
                margin: 80px auto;
                padding: 40px;
                background: ${tableRowBg};
                border-radius: 20px;
                border: 2px solid ${tableBorder};
            }
            
            timeline-split-blog-viewer .tags-header {
                font-size: 16px;
                font-weight: 800;
                color: ${metaText};
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 20px;
            }
            
            timeline-split-blog-viewer .tags-list {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            timeline-split-blog-viewer .tag {
                background: ${tagBg};
                color: ${tagText};
                padding: 12px 24px;
                border-radius: 30px;
                font-size: 15px;
                font-weight: 700;
                border: 2px solid ${tagBorder};
                transition: all 0.3s;
            }
            
            timeline-split-blog-viewer .tag:hover {
                background: ${tagBorder};
                border-color: ${tagText};
                transform: translateY(-3px);
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            }
            
            /* Related Section */
            timeline-split-blog-viewer .related-section {
                max-width: 1200px;
                margin: 100px auto 0;
                padding-top: 80px;
                border-top: 3px solid ${tableBorder};
            }
            
            timeline-split-blog-viewer .related-header {
                font-size: 42px;
                font-weight: 900;
                color: ${h2Color};
                text-align: center;
                margin-bottom: 60px;
            }
            
            timeline-split-blog-viewer .related-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
                gap: 32px;
            }
            
            timeline-split-blog-viewer .related-card {
                background: ${relatedCardBg};
                border: 2px solid ${relatedCardBorder};
                border-radius: 20px;
                overflow: hidden;
                transition: all 0.4s;
                cursor: pointer;
            }
            
            timeline-split-blog-viewer .related-card:hover {
                transform: translateY(-12px) scale(1.02);
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
                border-color: ${relatedCategory};
            }
            
            timeline-split-blog-viewer .related-image {
                width: 100%;
                height: 240px;
                object-fit: cover;
            }
            
            timeline-split-blog-viewer .related-content {
                padding: 28px;
            }
            
            timeline-split-blog-viewer .related-category {
                display: inline-block;
                background: rgba(100, 255, 218, 0.15);
                color: ${relatedCategory};
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 800;
                margin-bottom: 16px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            timeline-split-blog-viewer .related-title-text {
                font-size: 22px;
                font-weight: 900;
                color: ${relatedTitle};
                margin-bottom: 14px;
                line-height: 1.3;
            }
            
            timeline-split-blog-viewer .related-excerpt {
                font-size: 15px;
                color: ${relatedExcerpt};
                line-height: 1.7;
            }
            
            /* Responsive */
            @media (max-width: 1200px) {
                timeline-split-blog-viewer .timeline-blog-container {
                    flex-direction: column;
                    height: auto;
                }
                
                timeline-split-blog-viewer .left-sidebar {
                    width: 100%;
                    border-right: none;
                    border-bottom: 2px solid ${tableBorder};
                    flex-direction: row;
                    flex-wrap: wrap;
                    padding: 30px 20px;
                }
                
                timeline-split-blog-viewer .progress-ring-container {
                    width: 80px;
                    height: 80px;
                }
                
                timeline-split-blog-viewer .progress-ring {
                    width: 80px;
                    height: 80px;
                }
                
                timeline-split-blog-viewer .progress-ring-background,
                timeline-split-blog-viewer .progress-ring-progress {
                    r: 36;
                    cx: 40;
                    cy: 40;
                }
                
                timeline-split-blog-viewer .progress-percentage {
                    font-size: 18px;
                }
                
                timeline-split-blog-viewer .nav-timeline {
                    display: none;
                }
                
                timeline-split-blog-viewer .content-area {
                    height: auto;
                    padding: 40px 20px 80px;
                }
            }
            
            @media (max-width: 768px) {
                timeline-split-blog-viewer .content-area {
                    padding: 30px 16px 60px;
                }
                
                timeline-split-blog-viewer .article-body {
                    font-size: 17px;
                }
                
                timeline-split-blog-viewer .related-grid {
                    grid-template-columns: 1fr;
                }
                
                timeline-split-blog-viewer .sidebar-meta {
                    width: 100%;
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
        this.articleBody.innerHTML = '<p style="text-align: center; color: ' + this.styleProps.metaText + '; padding: 60px 20px;">Loading post...</p>';
    }

    renderPost() {
        if (!this.state.postData || !this.initialRenderDone) return;
        
        const post = this.state.postData;
        const viewCount = this.state.viewCount || post.viewCount || 0;
        
        // Category Badge
        if (post.category) {
            this.categoryBadge.textContent = post.category;
            this.categoryBadge.style.display = 'inline-block';
        }
        
        // Main Title
        this.mainTitle.textContent = post.blogTitle || post.title || 'Untitled';
        
        // Sidebar Author
        const authorImageUrl = this._convertWixImageUrl(post.authorImage);
        this.sidebarAuthor.innerHTML = `
            <img src="${authorImageUrl}" alt="${this._escapeHtml(post.author)}" class="author-avatar-small" />
            <div class="author-name-small">${this._escapeHtml(post.author || 'Anonymous')}</div>
        `;
        
        // Sidebar Stats
        this.sidebarStats.innerHTML = `
            <div class="stat-item">
                <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                ${this._formatDate(post.publishedDate)}
            </div>
            <div class="stat-item">
                <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                ${post.readTime || '5'} min read
            </div>
            <div class="view-count-stat">
                <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                <span id="viewCountNumber">${this._formatNumber(viewCount)}</span>
            </div>
        `;
        
        // Sidebar Share
        this.sidebarShare.innerHTML = `
            <div class="share-title-small">Share</div>
            <div class="share-buttons-small">
                <button class="share-btn-small" data-share="twitter">
                    <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </button>
                <button class="share-btn-small" data-share="facebook">
                    <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </button>
                <button class="share-btn-small" data-share="linkedin">
                    <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </button>
                <button class="share-btn-small" data-share="copy">
                    <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                </button>
            </div>
        `;
        
        this._setupShareButtons();
        
        // Render Content
        this._renderContent(post.content);
        
        // Tags
        if (post.tags) this._renderTags(post.tags);
    }

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
        
        const result = this._generateTableOfContents(htmlContent);
        
        if (result.toc) {
            this.navTimeline.innerHTML = result.toc;
            this._addSmoothScrollToTOC();
        }
        
        this.articleBody.innerHTML = result.content;
    }

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
                img.setAttribute('onerror', "this.src='https://static.wixstatic.com/media/default-image.jpg'");
            }
        });
        
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(template.content);
        return tempDiv.innerHTML;
    }

    _processVideoEmbeds(html) {
        html = html.replace(/\[youtube:([a-zA-Z0-9_-]+)\]/g, (match, videoId) => {
            return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen title="YouTube video"></iframe></div>`;
        });

        html = html.replace(/\[vimeo:(\d+)\]/g, (match, videoId) => {
            return `<div class="video-embed"><iframe src="https://player.vimeo.com/video/${videoId}" allowfullscreen title="Vimeo video"></iframe></div>`;
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

    _generateTableOfContents(htmlContent) {
        const template = document.createElement('template');
        template.innerHTML = htmlContent;
        
        const headings = template.content.querySelectorAll('h2, h3');
        if (headings.length === 0) return { toc: '', content: htmlContent };
        
        const tocItems = [];
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.substring(1));
            const text = heading.textContent;
            const id = `heading-${index}`;
            heading.id = id;
            tocItems.push({ level, text, id });
        });
        
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(template.content);
        const updatedContent = tempDiv.innerHTML;
        
        let tocHtml = `<ul class="timeline-list">`;
        tocItems.forEach((item, index) => {
            const activeClass = index === 0 ? ' active' : '';
            tocHtml += `<li class="timeline-item${activeClass}"><a href="#${item.id}" class="timeline-link" data-heading-id="${item.id}">${this._escapeHtml(item.text)}</a></li>`;
        });
        tocHtml += `</ul>`;
        
        return { toc: tocHtml, content: updatedContent };
    }

    _addSmoothScrollToTOC() {
        const tocLinks = this.navTimeline.querySelectorAll('.timeline-link');
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = this.articleBody.querySelector(`#${targetId}`);
                
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // Update active state
                    this.querySelectorAll('.timeline-item').forEach(item => item.classList.remove('active'));
                    link.closest('.timeline-item').classList.add('active');
                }
            });
        });
    }

    updateReadingProgress() {
        const scrollTop = this.contentArea.scrollTop;
        const scrollHeight = this.contentArea.scrollHeight - this.contentArea.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        
        this.state.readingProgress = Math.min(Math.max(progress, 0), 100);
        
        // Update progress ring (circumference = 2 * PI * 54 = 339.292)
        const circumference = 339.292;
        const offset = circumference - (this.state.readingProgress / 100) * circumference;
        this.progressCircle.style.strokeDashoffset = offset;
        this.progressPercentage.textContent = Math.round(this.state.readingProgress) + '%';
    }

    _renderTags(tags) {
        const tagArray = tags.split(',').map(t => t.trim());
        this.tagsSection.innerHTML = `
            <div class="tags-header">Topics Covered</div>
            <div class="tags-list">
                ${tagArray.map(tag => `<span class="tag">${this._escapeHtml(tag)}</span>`).join('')}
            </div>
        `;
        this.tagsSection.style.display = 'block';
    }

    renderRelatedPosts() {
        if (!this.state.relatedPosts || this.state.relatedPosts.length === 0) return;
        
        const posts = this.state.relatedPosts;
        this.relatedSection.innerHTML = `
            <h2 class="related-header">Continue Reading</h2>
            <div class="related-grid">
                ${posts.map(post => `
                    <div class="related-card" data-slug="${post.slug}">
                        <img src="${this._convertWixImageUrl(post.featuredImage)}" alt="${this._escapeHtml(post.blogTitle || post.title)}" class="related-image" loading="lazy" />
                        <div class="related-content">
                            ${post.category ? `<span class="related-category">${this._escapeHtml(post.category)}</span>` : ''}
                            <h3 class="related-title-text">${this._escapeHtml(post.blogTitle || post.title)}</h3>
                            <p class="related-excerpt">${this._escapeHtml(post.excerpt || '')}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        this.relatedSection.style.display = 'block';

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
        this.loadMarkedJS();
    }

    disconnectedCallback() {}
}

customElements.define('timeline-split-blog-viewer', TimelineSplitBlogViewer);
