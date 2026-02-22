class EnhancedBlogPostViewer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.state = {
            postData: null,
            relatedPosts: [],
            isLoading: true
        };

        this.markedLoaded = false;
        this.isMobile = window.innerWidth <= 768;
        
        const initialStyleProps = this.getAttribute('style-props');
        this.styleProps = initialStyleProps ? JSON.parse(initialStyleProps) : this.getDefaultStyleProps();
        
        this.initializeUI();
    }

    static get observedAttributes() {
        return ['post-data', 'related-posts', 'style-props'];
    }

    // --- Velo Property Setters (Makes data passing bulletproof in Wix) ---
    get postData() { return this.state.postData; }
    set postData(value) {
        try {
            this.state.postData = typeof value === 'string' ? JSON.parse(value) : value;
            this.state.isLoading = false;
            requestAnimationFrame(() => {
                this.renderPost();
                this.updateSEOMarkup();
            });
        } catch (e) {
            console.error('Error setting post data:', e);
        }
    }

    get relatedPosts() { return this.state.relatedPosts; }
    set relatedPosts(value) {
        try {
            this.state.relatedPosts = typeof value === 'string' ? JSON.parse(value) : value;
            requestAnimationFrame(() => this.renderRelatedPosts());
        } catch (e) {
            console.error('Error setting related posts:', e);
        }
    }
    // ---------------------------------------------------------------------

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
            relatedMeta: '#6b7280'
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        if (name === 'post-data') {
            this.postData = newValue; // Routes through setter
        } else if (name === 'related-posts') {
            this.relatedPosts = newValue; // Routes through setter
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
        this.shadowRoot.innerHTML = `
            <style>${this.getStyles()}</style>

            <article class="blog-post-container" aria-live="polite" aria-busy="true">
                <div id="blog-content-wrapper">
                    <aside class="toc-sidebar" id="tocSidebar" aria-label="Table of Contents">
                        <div id="tableOfContents"></div>
                    </aside>

                    <main class="main-content">
                        <div class="featured-image-container" id="featuredImageContainer" style="display: none;">
                            <img class="featured-image" id="featuredImage" alt="Blog featured image" width="900" height="500" fetchpriority="high" decoding="async" />
                        </div>
                        
                        <div class="blog-content" id="blogContent"></div>

                        <footer class="post-footer" id="postFooter" style="display: none;"></footer>
                    </main>
                </div>

                <section class="tags-section" id="tagsSection" style="display: none;" aria-label="Post tags"></section>

                <section class="related-posts-section" id="relatedPostsSection" style="display: none;" aria-label="Related posts"></section>
            </article>
        `;

        this.container = this.shadowRoot.querySelector('.blog-post-container');
        this.featuredImageContainer = this.shadowRoot.getElementById('featuredImageContainer');
        this.featuredImage = this.shadowRoot.getElementById('featuredImage');
        this.tocElement = this.shadowRoot.getElementById('tableOfContents');
        this.tocSidebar = this.shadowRoot.getElementById('tocSidebar');
        this.contentElement = this.shadowRoot.getElementById('blogContent');
        this.postFooter = this.shadowRoot.getElementById('postFooter');
        this.tagsSection = this.shadowRoot.getElementById('tagsSection');
        this.relatedPostsSection = this.shadowRoot.getElementById('relatedPostsSection');
        
        this.initialRenderDone = true;
        this.showLoading();
    }

    getStyles() {
        const {
            fontFamily, bgColor, h1Color, h2Color, h3Color, h4Color, h5Color, h6Color,
            paragraphColor, linkColor, strongColor, blockquoteBg, blockquoteBorder, blockquoteText,
            codeBg, codeText, tableHeaderBg, tableHeaderText, tableRowBg, tableRowAltBg, tableText, tableBorder,
            tocBg, tocBorder, tocTitle, tocText, tocActive, authorBorder, metaText,
            shareBg, shareBorder, shareText, shareHover, tagBg, tagText, tagBorder,
            relatedCardBg, relatedCardBorder, relatedCategory, relatedTitle, relatedExcerpt, relatedMeta
        } = this.styleProps;
        
        return `
            :host {
                display: block; width: 100%; font-family: ${fontFamily};
                -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
            }
            * { box-sizing: border-box; }
            .blog-post-container { max-width: 1400px; margin: 0 auto; padding: 40px 20px; background-color: ${bgColor}; min-height: 800px; }
            
            /* Skeleton Loaders */
            @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
            .skeleton-bg {
                background: ${tableRowBg};
                background-image: linear-gradient(to right, ${tableRowBg} 0%, ${tableRowAltBg} 20%, ${tableRowBg} 40%, ${tableRowBg} 100%);
                background-repeat: no-repeat; background-size: 1000px 100%;
                animation: shimmer 1.5s infinite linear forwards;
            }
            .sk-hero { width: 100%; height: 400px; border-radius: 12px; margin-bottom: 40px; }
            .sk-title { width: 80%; height: 48px; border-radius: 6px; margin: 60px 0 30px; }
            .sk-text { width: 100%; height: 20px; border-radius: 4px; margin-bottom: 16px; }
            .sk-text.short { width: 60%; margin-bottom: 30px; }
            .sk-toc-box { border: 2px solid ${tocBorder}; border-radius: 12px; padding: 28px 24px; min-height: 300px; }
            .sk-toc-item { width: 80%; height: 16px; border-radius: 4px; margin-bottom: 16px; }

            /* Content Wrapper */
            #blog-content-wrapper { display: flex; gap: 40px; width: 100%; position: relative; }
            .main-content { flex: 1; min-width: 0; max-width: 900px; }
            .featured-image-container {
                width: 100%; margin-bottom: 40px; border-radius: 12px; overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); aspect-ratio: 16 / 9; background-color: ${tableRowBg};
            }
            .featured-image { width: 100%; height: 100%; display: block; object-fit: cover; }

            /* TOC Sidebar */
            .toc-sidebar { width: 280px; flex-shrink: 0; position: sticky; top: 20px; align-self: flex-start; max-height: calc(100vh - 40px); overflow-y: auto; -webkit-overflow-scrolling: touch; }
            .table-of-contents { background: ${tocBg}; border: 2px solid ${tocBorder}; border-radius: 12px; padding: 28px 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); }
            .toc-title { font-size: 22px; font-weight: 700; color: ${tocTitle}; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; }
            .toc-list { list-style: none; padding: 0; margin: 0; }
            .toc-list li { margin-bottom: 4px; }
            .toc-list a { color: ${tocText}; text-decoration: none; display: block; padding: 10px 12px; transition: color 0.2s, background-color 0.2s; border-left: 3px solid transparent; border-radius: 6px; font-size: 15px; }
            .toc-list a:hover, .toc-list a.active { color: ${tocActive}; background-color: rgba(100, 255, 218, 0.15); border-left-color: ${tocActive}; }
            .toc-list .toc-level-1 { font-size: 17px; font-weight: 600; }
            .toc-list .toc-level-2 { font-size: 16px; padding-left: 12px; }
            .toc-list .toc-level-3 { font-size: 15px; padding-left: 24px; }
            .toc-sidebar::-webkit-scrollbar { width: 6px; }
            .toc-sidebar::-webkit-scrollbar-track { background: ${tocBg}; border-radius: 3px; }
            .toc-sidebar::-webkit-scrollbar-thumb { background: ${tocActive}; border-radius: 3px; }

            /* Blog Content */
            .blog-content { font-size: 18px; line-height: 1.8; color: ${paragraphColor}; word-wrap: break-word; overflow-wrap: break-word; }
            .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6 { font-weight: 700; line-height: 1.3; margin-top: 40px; margin-bottom: 20px; scroll-margin-top: 20px; }
            .blog-content h1 { font-size: clamp(32px, 4vw, 42px); color: ${h1Color}; margin-top: 60px; }
            .blog-content h2 { font-size: clamp(28px, 3.5vw, 36px); color: ${h2Color}; margin-top: 50px; }
            .blog-content h3 { font-size: clamp(24px, 3vw, 30px); color: ${h3Color}; }
            .blog-content h4 { font-size: clamp(20px, 2.5vw, 24px); color: ${h4Color}; }
            .blog-content h5 { font-size: clamp(18px, 2vw, 20px); color: ${h5Color}; }
            .blog-content h6 { font-size: clamp(16px, 1.8vw, 18px); color: ${h6Color}; }
            .blog-content p { margin-bottom: 24px; line-height: 1.8; }
            .blog-content a { color: ${linkColor}; text-decoration: none; border-bottom: 1px solid ${linkColor}; transition: opacity 0.2s; }
            .blog-content a:hover { opacity: 0.8; }
            .blog-content strong, .blog-content b { font-weight: 700; color: ${strongColor}; }
            .blog-content em, .blog-content i { font-style: italic; }
            .blog-content ul, .blog-content ol { margin-bottom: 24px; padding-left: 30px; }
            .blog-content ul li { list-style-type: disc; margin-bottom: 12px; line-height: 1.8; }
            .blog-content ol li { list-style-type: decimal; margin-bottom: 12px; line-height: 1.8; }
            .blog-content blockquote { margin: 30px 0; padding: 20px 30px; border-left: 4px solid ${blockquoteBorder}; background-color: ${blockquoteBg}; font-style: italic; color: ${blockquoteText}; border-radius: 0 8px 8px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
            .blog-content code { background-color: ${codeBg}; padding: 3px 8px; border-radius: 4px; font-family: 'Monaco', 'Courier New', monospace; font-size: 0.9em; color: ${codeText}; }
            .blog-content pre { background-color: ${codeBg}; color: ${paragraphColor}; padding: 20px; border-radius: 8px; overflow-x: auto; margin: 30px 0; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); }
            .blog-content pre code { background-color: transparent; padding: 0; font-size: 14px; }
            .blog-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 30px auto; display: block; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
            .blog-content hr { border: none; border-top: 2px solid ${tableBorder}; margin: 40px 0; }
            .table-wrapper { overflow-x: auto; margin: 30px 0; }
            .blog-content table { width: 100%; border-collapse: collapse; margin: 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); border-radius: 8px; overflow: hidden; background-color: ${tableRowBg}; }
            .blog-content table th, .blog-content table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid ${tableBorder}; color: ${tableText}; }
            .blog-content table th { background-color: ${tableHeaderBg}; font-weight: 700; color: ${tableHeaderText}; border-bottom: 2px solid ${tableHeaderText}; }
            .blog-content table tbody tr { background-color: ${tableRowBg}; }
            .blog-content table tbody tr:nth-child(even) { background-color: ${tableRowAltBg}; }
            .blog-content table tbody tr:hover { background-color: ${tableBorder}; }

            /* Post Footer (Author & Share) */
            .post-footer { margin-top: 60px; padding-top: 40px; border-top: 2px solid ${tableBorder}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 30px; }
            .author-section { display: flex; align-items: center; gap: 16px; }
            .author-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid ${authorBorder}; background-color: ${tableRowBg}; }
            .author-info { display: flex; flex-direction: column; gap: 4px; }
            .author-label { font-size: 12px; color: ${metaText}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
            .author-name { font-weight: 700; color: ${paragraphColor}; font-size: 18px; }
            .author-meta { font-size: 14px; color: ${metaText}; display: flex; align-items: center; gap: 12px; }
            .meta-separator { color: ${tableBorder}; }

            /* Share Buttons */
            .share-section { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
            .share-label { font-size: 12px; color: ${metaText}; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
            .share-buttons { display: flex; gap: 12px; }
            .share-btn { width: 44px; height: 44px; border-radius: 50%; border: 1px solid ${shareBorder}; background: ${shareBg}; color: ${shareText}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background-color 0.2s, color 0.2s, border-color 0.2s; text-decoration: none; }
            .share-btn svg { width: 20px; height: 20px; fill: currentColor; }
            .share-btn:hover { background: ${shareHover}; color: ${bgColor}; border-color: ${shareHover}; }

            /* Tags Section */
            .tags-section { max-width: 900px; margin: 60px auto; padding-top: 40px; border-top: 2px solid ${tableBorder}; }
            .tags-title { font-size: 16px; font-weight: 600; color: ${metaText}; margin-bottom: 16px; }
            .tags-container { display: flex; gap: 10px; flex-wrap: wrap; }
            .tag { background: ${tagBg}; color: ${tagText}; padding: 8px 16px; border-radius: 20px; font-size: 14px; border: 1px solid ${tagBorder}; transition: background-color 0.2s, border-color 0.2s; }
            .tag:hover { background: ${tagBorder}; border-color: ${tagText}; }

            /* Related Posts */
            .related-posts-section { max-width: 1200px; margin: 80px auto 0; padding-top: 60px; border-top: 2px solid ${tableBorder}; }
            .related-posts-title { font-size: 32px; font-weight: 700; color: ${h2Color}; margin-bottom: 40px; text-align: center; }
            .related-posts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }
            .related-post-card { background: ${relatedCardBg}; border-radius: 12px; overflow: hidden; border: 1px solid ${relatedCardBorder}; transition: box-shadow 0.2s, border-color 0.2s; cursor: pointer; }
            .related-post-card:hover { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5); border-color: ${relatedCategory}; }
            .related-post-image { width: 100%; height: 200px; object-fit: cover; background-color: ${tableRowBg}; }
            .related-post-content { padding: 24px; }
            .related-post-category { display: inline-block; background: rgba(100, 255, 218, 0.1); color: ${relatedCategory}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
            .related-post-title { font-size: 20px; font-weight: 700; color: ${relatedTitle}; margin-bottom: 12px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .related-post-excerpt { font-size: 14px; color: ${relatedExcerpt}; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 16px; }
            .related-post-meta { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: ${relatedMeta}; }

            /* Responsive */
            @media (max-width: 1200px) { #blog-content-wrapper { flex-direction: column; } .toc-sidebar { position: relative; top: 0; width: 100%; max-width: 100%; margin-bottom: 40px; max-height: 400px; } .main-content { max-width: 100%; } }
            @media (max-width: 768px) { .blog-post-container { padding: 30px 16px; } .post-footer { flex-direction: column; align-items: flex-start; } .share-section { align-items: flex-start; width: 100%; } .blog-content { font-size: 16px; } .related-posts-grid { grid-template-columns: 1fr; } .table-of-contents { padding: 20px; } }
            @media (max-width: 480px) { .blog-post-container { padding: 20px 12px; } .share-btn { width: 40px; height: 40px; } .share-btn svg { width: 18px; height: 18px; } }
        `;
    }

    updateStyles() {
        const styleElement = this.shadowRoot.querySelector('style');
        if (styleElement) {
            styleElement.textContent = this.getStyles();
        }
    }

    showLoading() {
        if (!this.state.isLoading) return;
        this.container.setAttribute('aria-busy', 'true');

        this.tocElement.innerHTML = `
            <div class="sk-toc-box skeleton-bg">
                <div class="sk-toc-item skeleton-bg" style="width: 50%; height: 24px; margin-bottom: 20px;"></div>
                <div class="sk-toc-item skeleton-bg"></div>
                <div class="sk-toc-item skeleton-bg" style="width: 90%;"></div>
                <div class="sk-toc-item skeleton-bg" style="width: 70%;"></div>
                <div class="sk-toc-item skeleton-bg" style="width: 85%;"></div>
            </div>
        `;

        this.contentElement.innerHTML = `
            <div class="sk-hero skeleton-bg"></div>
            <div class="sk-title skeleton-bg"></div>
            <div class="sk-text skeleton-bg"></div>
            <div class="sk-text skeleton-bg"></div>
            <div class="sk-text short skeleton-bg"></div>
            <div class="sk-title skeleton-bg" style="height: 32px; width: 50%;"></div>
            <div class="sk-text skeleton-bg"></div>
            <div class="sk-text short skeleton-bg"></div>
        `;
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

    renderPost() {
        if (!this.state.postData) return;
        this.container.setAttribute('aria-busy', 'false');

        const post = this.state.postData;

        if (post.featuredImage) {
            const featuredImageUrl = this._convertWixImageUrl(post.featuredImage);
            this.featuredImage.src = featuredImageUrl;
            this.featuredImage.onerror = () => { this.featuredImageContainer.style.display = 'none'; };
            this.featuredImageContainer.style.display = 'block';
        }

        this._renderContent(post.content);

        const authorImageUrl = this._convertWixImageUrl(post.authorImage);
        this.postFooter.innerHTML = `
            <div class="author-section">
                <img 
                    src="${authorImageUrl}" 
                    alt="${this._escapeHtml(post.author)}"
                    class="author-avatar"
                    width="56"
                    height="56"
                    loading="lazy"
                    decoding="async"
                    onerror="this.src='https://via.placeholder.com/56'"
                />
                <div class="author-info">
                    <div class="author-label">Written by</div>
                    <div class="author-name">${this._escapeHtml(post.author || 'Anonymous')}</div>
                    <div class="author-meta">
                        <span>${this._formatDate(post.publishedDate)}</span>
                        <span class="meta-separator" aria-hidden="true">•</span>
                        <span>${post.readTime || '5 min read'}</span>
                    </div>
                </div>
            </div>

            <div class="share-section">
                <div class="share-label">Share this post</div>
                <div class="share-buttons">
                    <a href="#" class="share-btn" data-share="twitter" title="Share on X (Twitter)" aria-label="Share on X">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a href="#" class="share-btn" data-share="facebook" title="Share on Facebook" aria-label="Share on Facebook">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                    <a href="#" class="share-btn" data-share="linkedin" title="Share on LinkedIn" aria-label="Share on LinkedIn">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                    <button class="share-btn" data-share="copy" title="Copy link" aria-label="Copy link">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    </button>
                </div>
            </div>
        `;
        this.postFooter.style.display = 'flex';
        this._setupShareButtons();

        if (post.tags) this._renderTags(post.tags);
    }

    _renderContent(markdown) {
        if (!markdown) return;

        let htmlContent;
        try {
            const preprocessed = this._preprocessMarkdownImages(markdown);
            if (window.marked && window.marked.parse) {
                window.marked.use({ breaks: true, gfm: true, headerIds: true, mangle: false });
                htmlContent = window.marked.parse(preprocessed);
            } else {
                htmlContent = this._simpleMarkdownParse(preprocessed);
            }
        } catch (error) {
            console.error('Parse error:', error);
            htmlContent = this._simpleMarkdownParse(this._preprocessMarkdownImages(markdown));
        }

        htmlContent = this._convertImagesInHTML(htmlContent);
        htmlContent = this._wrapTablesForMobile(htmlContent);
        
        const result = this._generateTableOfContents(htmlContent);
        
        if (result.toc) {
            this.tocElement.innerHTML = result.toc;
            this.contentElement.innerHTML = result.content;
            this._addSmoothScrollToTOC();
            
            if (!this.isMobile) {
                this._initScrollSpy();
            }
        } else {
            this.tocElement.innerHTML = '';
            this.tocSidebar.style.display = 'none';
            this.contentElement.innerHTML = result.content;
        }
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

    _wrapTablesForMobile(html) {
        return html.replace(/<table>/g, '<div class="table-wrapper"><table>').replace(/<\/table>/g, '</table></div>');
    }

    _convertImagesInHTML(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        const images = tempDiv.querySelectorAll('img');
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
        
        return tempDiv.innerHTML;
    }

    _renderTags(tagsString) {
        if (!tagsString) return;
        const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
        if (tags.length === 0) return;

        this.tagsSection.innerHTML = `
            <div class="tags-title">Tags</div>
            <div class="tags-container">
                ${tags.map(tag => `<span class="tag">${this._escapeHtml(tag)}</span>`).join('')}
            </div>
        `;
        this.tagsSection.style.display = 'block';
    }

    renderRelatedPosts() {
        if (!this.state.relatedPosts || this.state.relatedPosts.length === 0) {
            this.relatedPostsSection.style.display = 'none';
            return;
        }

        const posts = this.state.relatedPosts;

        this.relatedPostsSection.innerHTML = `
            <h2 class="related-posts-title">Related Articles</h2>
            <div class="related-posts-grid">
                ${posts.map(post => {
                    const relatedImageUrl = this._convertWixImageUrl(post.featuredImage);
                    return `
                        <article class="related-post-card" data-slug="${post.slug}">
                            <img 
                                src="${relatedImageUrl}" 
                                alt="${this._escapeHtml(post.title)}"
                                class="related-post-image"
                                width="400"
                                height="200"
                                loading="lazy"
                                decoding="async"
                                onerror="this.src='https://via.placeholder.com/400x200'"
                            />
                            <div class="related-post-content">
                                ${post.category ? `<span class="related-post-category">${this._escapeHtml(post.category)}</span>` : ''}
                                <h3 class="related-post-title">${this._escapeHtml(post.title)}</h3>
                                <p class="related-post-excerpt">${this._escapeHtml(post.excerpt || '')}</p>
                                <div class="related-post-meta">
                                    <span class="related-post-date">📅 ${this._formatDate(post.publishedDate)}</span>
                                    <span class="related-post-readtime">⏱️ ${post.readTime || '5 min'}</span>
                                </div>
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        `;

        this.relatedPostsSection.style.display = 'block';

        this.shadowRoot.querySelectorAll('.related-post-card').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.getAttribute('data-slug');
                this._navigateToPost(slug);
            });
        });
    }

    updateSEOMarkup() {
        if (!this.state.postData) return;

        const post = this.state.postData;
        let seoHTML = '';

        if (post.content) {
            let contentHTML = this._simpleMarkdownParse(post.content);
            contentHTML = this._convertImagesInHTML(contentHTML);
            seoHTML += `<div class="blog-content">${contentHTML}</div>`;
        }

        seoHTML += `<div class="post-footer">`;
        seoHTML += `<strong>${this._escapeHtml(post.author || 'Anonymous')}</strong>`;
        seoHTML += `<span>${this._formatDate(post.publishedDate)}</span>`;
        seoHTML += `<span>${post.readTime || '5 min read'}</span>`;
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
                seoHTML += `<li><a href="/blog-post/${relatedPost.slug}">${this._escapeHtml(relatedPost.title)}</a></li>`;
            });
            seoHTML += `</ul></div>`;
        }

        this.dispatchEvent(new CustomEvent('seo-markup-ready', {
            detail: { markup: seoHTML }, bubbles: true, composed: true
        }));
    }

    _setupShareButtons() {
        const shareButtons = this.shadowRoot.querySelectorAll('[data-share]');
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
        const title = this.state.postData?.title || '';

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

    _preprocessMarkdownImages(markdown) {
        const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
        return markdown.replace(imagePattern, (match, alt, url) => {
            return `<img src="${url}" alt="${alt}" loading="lazy" />`;
        });
    }

    _generateTableOfContents(htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) return { toc: '', content: htmlContent };
        
        const tocItems = [];
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.substring(1));
            const text = heading.textContent;
            const id = `heading-${index}`;
            heading.id = id;
            tocItems.push({ level, text, id });
        });
        
        const updatedContent = tempDiv.innerHTML;
        
        let tocHtml = `<div class="table-of-contents"><div class="toc-title"><span>📑</span>Table of Contents</div><ul class="toc-list">`;
        tocItems.forEach(item => {
            tocHtml += `<li class="toc-level-${item.level}"><a href="#${item.id}" data-heading-id="${item.id}">${item.text}</a></li>`;
        });
        tocHtml += `</ul></div>`;
        
        return { toc: tocHtml, content: updatedContent };
    }

    _addSmoothScrollToTOC() {
        const tocLinks = this.tocElement.querySelectorAll('a[href^="#"]');
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = this.contentElement.querySelector(`#${targetId}`);
                
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    tocLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        });
    }

    _initScrollSpy() {
        const headings = this.contentElement.querySelectorAll('[id^="heading-"]');
        const tocLinks = this.tocElement.querySelectorAll('a[data-heading-id]');
        
        if (headings.length === 0 || tocLinks.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const headingId = entry.target.id;
                    tocLinks.forEach(link => link.classList.remove('active'));
                    const activeLink = this.tocElement.querySelector(`a[data-heading-id="${headingId}"]`);
                    if (activeLink) activeLink.classList.add('active');
                }
            });
        }, { rootMargin: '-20% 0px -80% 0px', threshold: 0 });
        
        headings.forEach(heading => observer.observe(heading));
        this.scrollSpyObserver = observer;
    }

    _formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
            if (this.state.postData) this.renderPost();
        };
        document.head.appendChild(script);
    }

    connectedCallback() {
        this.loadMarkedJS();
    }

    disconnectedCallback() {
        if (this.scrollSpyObserver) {
            this.scrollSpyObserver.disconnect();
        }
    }
}

customElements.define('enhanced-blog-post-viewer', EnhancedBlogPostViewer);
