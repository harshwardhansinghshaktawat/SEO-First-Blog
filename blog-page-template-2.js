class BlogPageTemplate extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Data storage
        this._heroPost = null;
        this._featuredPosts = [];
        this._category1Posts = [];
        this._category2Posts = [];
        this._category3Posts = [];
        this._allPosts = [];
        
        // Pagination
        this._currentPage = 1;
        this._totalPages = 1;
        this._allPostsPerPage = 9;
        
        // Settings
        this._settings = this.getDefaultSettings();
        
        // Parse initial style props
        const initialStyleProps = this.getAttribute('style-props');
        this.styleProps = initialStyleProps ? JSON.parse(initialStyleProps) : this.getDefaultStyleProps();
        
        this._initializeUI();
    }

    static get observedAttributes() {
        return ['blog-data', 'settings', 'style-props'];
    }

    getDefaultSettings() {
        return {
            heroTitle: 'Latest Articles',
            section1Title: 'Featured Stories',
            section2Title: 'Technology',
            section3Title: 'Lifestyle',
            section4Title: 'Business',
            allPostsTitle: 'All Articles',
            featuredCount: 3,
            category1Count: 3,
            category2Count: 3,
            category3Count: 3
        };
    }

    getDefaultStyleProps() {
        return {
            // Typography
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            
            // General Colors
            bgColor: '#ffffff',
            primaryColor: '#6366f1',
            primaryHover: '#4f46e5',
            textPrimary: '#1a1a1a',
            textSecondary: '#6b7280',
            textMuted: '#9ca3af',
            
            // Hero Section
            heroBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            heroOverlay: 'rgba(0, 0, 0, 0.4)',
            heroTitleColor: '#ffffff',
            heroExcerptColor: '#f3f4f6',
            heroBadgeBg: '#fbbf24',
            heroBadgeText: '#78350f',
            
            // Card Colors
            cardBg: '#ffffff',
            cardBorder: '#f3f4f6',
            cardShadow: 'rgba(0, 0, 0, 0.07)',
            cardHoverShadow: 'rgba(0, 0, 0, 0.12)',
            cardTitleColor: '#1a1a1a',
            cardExcerptColor: '#6b7280',
            
            // Badge Colors
            categoryBg: '#ede9fe',
            categoryText: '#6366f1',
            featuredBadgeBg: '#fbbf24',
            featuredBadgeText: '#78350f',
            
            // Section Headers
            sectionTitleColor: '#1a1a1a',
            sectionBorder: '#e5e7eb',
            
            // Meta Colors
            metaColor: '#9ca3af',
            authorColor: '#1a1a1a',
            dateColor: '#9ca3af',
            
            // Button Colors
            btnBg: '#6366f1',
            btnText: '#ffffff',
            btnHoverBg: '#4f46e5',
            
            // Pagination
            paginationBorder: '#e5e7eb',
            paginationText: '#374151',
            paginationActiveBg: '#6366f1',
            paginationActiveText: '#ffffff',
            paginationHoverBg: '#f5f3ff',
            paginationHoverBorder: '#6366f1'
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        if (name === 'blog-data') {
            try {
                const data = JSON.parse(newValue);
                console.log('Custom Element - Received blog data');
                
                this._heroPost = data.heroPost || null;
                this._featuredPosts = data.featuredPosts || [];
                this._category1Posts = data.category1Posts || [];
                this._category2Posts = data.category2Posts || [];
                this._category3Posts = data.category3Posts || [];
                this._allPosts = data.allPosts || [];
                this._currentPage = data.currentPage || 1;
                this._totalPages = data.totalPages || 1;
                this._allPostsPerPage = data.allPostsPerPage || 9;
                
                requestAnimationFrame(() => this._renderAll());
            } catch (e) {
                console.error('Error parsing blog data:', e);
            }
        } else if (name === 'settings') {
            try {
                const newSettings = JSON.parse(newValue);
                this._settings = { ...this._settings, ...newSettings };
                if (this.initialRenderDone) {
                    this._renderAll();
                }
            } catch (error) {
                console.error('Error parsing settings:', error);
            }
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

    _initializeUI() {
        this.shadowRoot.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="blog-template-container">
                <div id="heroSection"></div>
                <div id="featuredSection"></div>
                <div id="category1Section"></div>
                <div id="category2Section"></div>
                <div id="category3Section"></div>
                <div id="allPostsSection"></div>
            </div>
        `;

        this.initialRenderDone = true;
    }

    getStyles() {
        const {
            fontFamily, bgColor, primaryColor, primaryHover, textPrimary, textSecondary, textMuted,
            heroBg, heroOverlay, heroTitleColor, heroExcerptColor, heroBadgeBg, heroBadgeText,
            cardBg, cardBorder, cardShadow, cardHoverShadow, cardTitleColor, cardExcerptColor,
            categoryBg, categoryText, featuredBadgeBg, featuredBadgeText,
            sectionTitleColor, sectionBorder,
            metaColor, authorColor, dateColor,
            btnBg, btnText, btnHoverBg,
            paginationBorder, paginationText, paginationActiveBg, paginationActiveText,
            paginationHoverBg, paginationHoverBorder
        } = this.styleProps;

        return `
            * { box-sizing: border-box; margin: 0; padding: 0; }
            
            :host {
                display: block;
                width: 100%;
                font-family: ${fontFamily};
            }

            .blog-template-container {
                background-color: ${bgColor};
            }

            /* ========== HERO SECTION ========== */
            .hero-section {
                position: relative;
                width: 100%;
                height: 600px;
                margin-bottom: 80px;
                overflow: hidden;
            }

            .hero-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: ${heroBg};
            }

            .hero-bg img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .hero-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: ${heroOverlay};
            }

            .hero-content {
                position: relative;
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                z-index: 2;
            }

            .hero-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: ${heroBadgeBg};
                color: ${heroBadgeText};
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                width: fit-content;
                margin-bottom: 20px;
            }

            .hero-title {
                font-size: 56px;
                font-weight: 800;
                color: ${heroTitleColor};
                margin-bottom: 20px;
                line-height: 1.2;
                max-width: 900px;
            }

            .hero-excerpt {
                font-size: 20px;
                color: ${heroExcerptColor};
                margin-bottom: 30px;
                line-height: 1.6;
                max-width: 700px;
            }

            .hero-meta {
                display: flex;
                align-items: center;
                gap: 24px;
                margin-bottom: 30px;
                flex-wrap: wrap;
            }

            .hero-author {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .hero-author-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                border: 3px solid ${heroTitleColor};
            }

            .hero-author-info {
                display: flex;
                flex-direction: column;
            }

            .hero-author-name {
                color: ${heroTitleColor};
                font-weight: 600;
                font-size: 15px;
            }

            .hero-date {
                color: ${heroExcerptColor};
                font-size: 14px;
            }

            .hero-read-time {
                display: flex;
                align-items: center;
                gap: 8px;
                color: ${heroExcerptColor};
                font-size: 15px;
            }

            .hero-btn {
                background: ${btnBg};
                color: ${btnText};
                padding: 16px 32px;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                border: none;
                cursor: pointer;
                transition: all 0.3s;
                width: fit-content;
                display: inline-flex;
                align-items: center;
                gap: 10px;
            }

            .hero-btn:hover {
                background: ${btnHoverBg};
                transform: translateY(-2px);
            }

            /* ========== SECTION CONTAINERS ========== */
            .section-container {
                max-width: 1400px;
                margin: 0 auto 80px;
                padding: 0 20px;
            }

            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid ${sectionBorder};
            }

            .section-title {
                font-size: 36px;
                font-weight: 700;
                color: ${sectionTitleColor};
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .section-view-all {
                color: ${primaryColor};
                font-size: 15px;
                font-weight: 600;
                text-decoration: none;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: gap 0.3s;
            }

            .section-view-all:hover {
                gap: 12px;
            }

            /* ========== BLOG GRID ========== */
            .blog-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                gap: 32px;
            }

            .blog-grid.featured-grid {
                grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            }

            .blog-card {
                background: ${cardBg};
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 6px ${cardShadow};
                transition: transform 0.3s, box-shadow 0.3s;
                border: 1px solid ${cardBorder};
                display: flex;
                flex-direction: column;
                height: 100%;
            }

            .blog-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 24px ${cardHoverShadow};
            }

            .card-image-wrapper {
                width: 100%;
                height: 240px;
                overflow: hidden;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                position: relative;
            }

            .card-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s;
            }

            .blog-card:hover .card-image {
                transform: scale(1.05);
            }

            .card-featured-badge {
                position: absolute;
                top: 16px;
                right: 16px;
                background: ${featuredBadgeBg};
                color: ${featuredBadgeText};
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .card-content {
                padding: 28px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .card-meta {
                display: flex;
                gap: 16px;
                margin-bottom: 16px;
                flex-wrap: wrap;
                align-items: center;
            }

            .category-badge {
                background: ${categoryBg};
                color: ${categoryText};
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }

            .read-time {
                color: ${metaColor};
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .card-title {
                font-size: 22px;
                font-weight: 700;
                color: ${cardTitleColor};
                margin-bottom: 12px;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .card-excerpt {
                color: ${cardExcerptColor};
                font-size: 15px;
                line-height: 1.7;
                margin-bottom: 20px;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                flex: 1;
            }

            .card-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 20px;
                border-top: 1px solid ${cardBorder};
            }

            .author-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .author-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid ${cardBorder};
            }

            .author-details {
                display: flex;
                flex-direction: column;
            }

            .author-name {
                font-size: 14px;
                font-weight: 600;
                color: ${authorColor};
            }

            .publish-date {
                font-size: 12px;
                color: ${dateColor};
            }

            .read-more-btn {
                background: ${btnBg};
                color: ${btnText};
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                border: none;
                cursor: pointer;
                transition: background-color 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .read-more-btn:hover {
                background: ${btnHoverBg};
            }

            /* ========== PAGINATION ========== */
            .pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 12px;
                margin-top: 60px;
            }

            .page-btn {
                padding: 12px 20px;
                border: 2px solid ${paginationBorder};
                border-radius: 10px;
                background: ${cardBg};
                color: ${paginationText};
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: border-color 0.2s, background-color 0.2s, color 0.2s;
                min-width: 48px;
            }

            .page-btn:hover:not(:disabled) {
                border-color: ${paginationHoverBorder};
                background: ${paginationHoverBg};
                color: ${paginationHoverBorder};
            }

            .page-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .page-btn.active {
                background: ${paginationActiveBg};
                border-color: ${paginationActiveBg};
                color: ${paginationActiveText};
            }

            .page-info {
                font-size: 15px;
                color: ${cardExcerptColor};
                font-weight: 500;
            }

            /* ========== EMPTY STATE ========== */
            .empty-state {
                text-align: center;
                padding: 60px 20px;
            }

            .empty-icon {
                width: 64px;
                height: 64px;
                margin: 0 auto 20px;
                opacity: 0.5;
            }

            .empty-title {
                font-size: 24px;
                font-weight: 700;
                color: ${textPrimary};
                margin-bottom: 12px;
            }

            .empty-text {
                font-size: 16px;
                color: ${textSecondary};
            }

            /* ========== SVG ICONS ========== */
            .icon {
                width: 20px;
                height: 20px;
                fill: currentColor;
            }

            .icon-large {
                width: 32px;
                height: 32px;
            }

            /* ========== RESPONSIVE ========== */
            @media (max-width: 1024px) {
                .hero-section {
                    height: 500px;
                }

                .hero-title {
                    font-size: 42px;
                }

                .hero-excerpt {
                    font-size: 18px;
                }

                .section-title {
                    font-size: 28px;
                }
            }

            @media (max-width: 768px) {
                .hero-section {
                    height: 400px;
                }

                .hero-title {
                    font-size: 32px;
                }

                .hero-excerpt {
                    font-size: 16px;
                }

                .section-container {
                    margin-bottom: 60px;
                }

                .section-title {
                    font-size: 24px;
                }

                .blog-grid,
                .blog-grid.featured-grid {
                    grid-template-columns: 1fr;
                    gap: 24px;
                }

                .pagination {
                    gap: 8px;
                }

                .page-btn {
                    padding: 10px 16px;
                    font-size: 14px;
                    min-width: 40px;
                }
            }
        `;
    }

    updateStyles() {
        const styleElement = this.shadowRoot.querySelector('style');
        if (styleElement) {
            styleElement.textContent = this.getStyles();
        }
    }

    _getSVGIcon(type) {
        const icons = {
            star: '<svg viewBox="0 0 24 24" class="icon"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            clock: '<svg viewBox="0 0 24 24" class="icon"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></svg>',
            arrow: '<svg viewBox="0 0 24 24" class="icon"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>',
            grid: '<svg viewBox="0 0 24 24" class="icon-large"><path d="M4 11h6V4H4v7zm0 9h6v-7H4v7zm8 0h6v-7h-6v7zm0-16v7h6V4h-6z"/></svg>',
            article: '<svg viewBox="0 0 24 24" class="icon-large"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
            bookmark: '<svg viewBox="0 0 24 24" class="icon-large"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>',
            trending: '<svg viewBox="0 0 24 24" class="icon-large"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>',
            category: '<svg viewBox="0 0 24 24" class="icon-large"><path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z"/></svg>'
        };
        return icons[type] || '';
    }

    _convertWixImageUrl(wixUrl, options = {}) {
        if (!wixUrl || typeof wixUrl !== 'string') {
            return 'https://via.placeholder.com/400x240?text=No+Image';
        }

        const {
            width = 400,
            height = 240,
            quality = 85,
            operation = 'fill'
        } = options;

        if (wixUrl.startsWith('https://static.wixstatic.com/media/')) {
            try {
                const urlParts = wixUrl.split('/media/')[1];
                if (!urlParts) return wixUrl;
                
                const filename = urlParts.split('/')[0];
                const fileId = filename.split('~')[0];
                const hasExtension = filename.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                const originalExt = hasExtension ? hasExtension[1] : 'png';
                
                const params = `w_${width},h_${height},al_c,q_${quality},usm_0.66_1.00_0.01,enc_avif,quality_auto`;
                return `https://static.wixstatic.com/media/${filename}/v1/${operation}/${params}/${filename}`;
            } catch (e) {
                console.error('Error optimizing Wix URL:', e);
                return wixUrl;
            }
        }

        if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
            return wixUrl;
        }

        if (wixUrl.startsWith('wix:image://')) {
            try {
                const parts = wixUrl.split('/');
                let fileId = parts[3]?.split('#')[0];
                
                if (!fileId) return 'https://via.placeholder.com/400x240?text=No+Image';
                
                const filenamePart = parts[4] || fileId;
                const hasExtension = filenamePart.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                const ext = hasExtension ? hasExtension[1] : 'png';
                
                let filename = fileId;
                if (!filename.includes('~mv2')) {
                    filename = `${fileId}~mv2.${ext}`;
                } else if (!filename.includes('.')) {
                    filename = `${filename}.${ext}`;
                }
                
                const params = `w_${width},h_${height},al_c,q_${quality},usm_0.66_1.00_0.01,enc_avif,quality_auto`;
                return `https://static.wixstatic.com/media/${filename}/v1/${operation}/${params}/${filename}`;
            } catch (e) {
                console.error('Error parsing Wix image URL:', e);
            }
        }

        return 'https://via.placeholder.com/400x240?text=No+Image';
    }

    _renderAll() {
        this._renderHero();
        this._renderFeatured();
        this._renderCategory1();
        this._renderCategory2();
        this._renderCategory3();
        this._renderAllPosts();
    }

    _renderHero() {
        const heroSection = this.shadowRoot.getElementById('heroSection');
        
        if (!this._heroPost) {
            heroSection.innerHTML = '';
            return;
        }

        const post = this._heroPost;
        const heroImageUrl = this._convertWixImageUrl(post.featuredImage, {
            width: 1920,
            height: 1080,
            quality: 85
        });

        const authorImageUrl = this._convertWixImageUrl(post.authorImage, {
            width: 96,
            height: 96,
            quality: 75
        });

        heroSection.innerHTML = `
            <section class="hero-section">
                <div class="hero-bg">
                    <img src="${heroImageUrl}" alt="${this._escapeHtml(post.title)}" loading="eager" fetchpriority="high" />
                </div>
                <div class="hero-overlay"></div>
                <div class="hero-content">
                    ${post.isFeatured ? `<div class="hero-badge">${this._getSVGIcon('star')} Featured</div>` : ''}
                    <h1 class="hero-title">${this._escapeHtml(post.title)}</h1>
                    <p class="hero-excerpt">${this._escapeHtml(post.excerpt || '')}</p>
                    <div class="hero-meta">
                        <div class="hero-author">
                            <img src="${authorImageUrl}" alt="${this._escapeHtml(post.author)}" class="hero-author-avatar" loading="eager" />
                            <div class="hero-author-info">
                                <div class="hero-author-name">${this._escapeHtml(post.author || 'Anonymous')}</div>
                                <div class="hero-date">${this._formatDate(post.publishedDate)}</div>
                            </div>
                        </div>
                        <div class="hero-read-time">
                            ${this._getSVGIcon('clock')}
                            ${post.readTime || '5 min read'}
                        </div>
                    </div>
                    <button class="hero-btn" data-slug="${post.slug}">
                        Read Article
                        ${this._getSVGIcon('arrow')}
                    </button>
                </div>
            </section>
        `;

        this.shadowRoot.querySelector('.hero-btn')?.addEventListener('click', (e) => {
            const slug = e.currentTarget.getAttribute('data-slug');
            this._navigateToPost(slug);
        });
    }

    _renderFeatured() {
        this._renderSection('featuredSection', this._featuredPosts, this._settings.section1Title, 'grid', true);
    }

    _renderCategory1() {
        this._renderSection('category1Section', this._category1Posts, this._settings.section2Title, 'trending');
    }

    _renderCategory2() {
        this._renderSection('category2Section', this._category2Posts, this._settings.section3Title, 'category');
    }

    _renderCategory3() {
        this._renderSection('category3Section', this._category3Posts, this._settings.section4Title, 'bookmark');
    }

    _renderSection(sectionId, posts, title, iconType, isFeatured = false) {
        const section = this.shadowRoot.getElementById(sectionId);
        
        if (!posts || posts.length === 0) {
            section.innerHTML = '';
            return;
        }

        const gridClass = isFeatured ? 'blog-grid featured-grid' : 'blog-grid';
        
        section.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">
                        ${this._getSVGIcon(iconType)}
                        ${this._escapeHtml(title)}
                    </h2>
                </div>
                <div class="${gridClass}">
                    ${this._renderCards(posts)}
                </div>
            </div>
        `;

        this._attachCardListeners(section);
    }

    _renderAllPosts() {
        const section = this.shadowRoot.getElementById('allPostsSection');
        
        if (!this._allPosts || this._allPosts.length === 0) {
            section.innerHTML = `
                <div class="section-container">
                    <div class="section-header">
                        <h2 class="section-title">
                            ${this._getSVGIcon('article')}
                            ${this._escapeHtml(this._settings.allPostsTitle)}
                        </h2>
                    </div>
                    <div class="empty-state">
                        ${this._getSVGIcon('article')}
                        <h3 class="empty-title">No articles found</h3>
                        <p class="empty-text">Check back later for new content</p>
                    </div>
                </div>
            `;
            return;
        }

        section.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">
                        ${this._getSVGIcon('article')}
                        ${this._escapeHtml(this._settings.allPostsTitle)}
                    </h2>
                </div>
                <div class="blog-grid">
                    ${this._renderCards(this._allPosts)}
                </div>
                <div class="pagination" id="pagination"></div>
            </div>
        `;

        this._attachCardListeners(section);
        this._renderPagination();
    }

    _renderCards(posts) {
        return posts.map((post, index) => {
            const isAboveFold = index < 6;
            const featuredImageUrl = this._convertWixImageUrl(post.featuredImage, {
                width: 680,
                height: 480,
                quality: isAboveFold ? 80 : 75
            });
            
            const authorImageUrl = this._convertWixImageUrl(post.authorImage, {
                width: 80,
                height: 80,
                quality: 70
            });
            
            return `
                <article class="blog-card">
                    <div class="card-image-wrapper">
                        <img 
                            src="${featuredImageUrl}" 
                            alt="${this._escapeHtml(post.title)}"
                            class="card-image"
                            loading="${isAboveFold ? 'eager' : 'lazy'}"
                            fetchpriority="${isAboveFold ? 'high' : 'auto'}"
                            onerror="this.src='https://via.placeholder.com/400x240?text=No+Image'"
                        />
                        ${post.isFeatured ? `<span class="card-featured-badge">${this._getSVGIcon('star')} Featured</span>` : ''}
                    </div>
                    <div class="card-content">
                        <div class="card-meta">
                            <span class="category-badge">${this._escapeHtml(post.category || 'Uncategorized')}</span>
                            <span class="read-time">${this._getSVGIcon('clock')} ${post.readTime || '5 min'}</span>
                        </div>
                        <h2 class="card-title">${this._escapeHtml(post.title)}</h2>
                        <p class="card-excerpt">${this._escapeHtml(post.excerpt || '')}</p>
                        <div class="card-footer">
                            <div class="author-info">
                                <img 
                                    src="${authorImageUrl}" 
                                    alt="${this._escapeHtml(post.author || 'Author')}"
                                    class="author-avatar"
                                    loading="lazy"
                                    onerror="this.src='https://via.placeholder.com/40'"
                                />
                                <div class="author-details">
                                    <div class="author-name">${this._escapeHtml(post.author || 'Anonymous')}</div>
                                    <div class="publish-date">${this._formatDate(post.publishedDate)}</div>
                                </div>
                            </div>
                            <button class="read-more-btn" data-slug="${post.slug}">
                                Read ${this._getSVGIcon('arrow')}
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    _attachCardListeners(container) {
        container.querySelectorAll('.read-more-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const slug = e.currentTarget.getAttribute('data-slug');
                this._navigateToPost(slug);
            });
        });
    }

    _renderPagination() {
        const pagination = this.shadowRoot.getElementById('pagination');
        
        if (!pagination || this._totalPages <= 1) {
            if (pagination) pagination.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <button class="page-btn" id="prevBtn" ${this._currentPage === 1 ? 'disabled' : ''}>
                ← Previous
            </button>
        `;

        const maxVisible = 5;
        let startPage = Math.max(1, this._currentPage - 2);
        let endPage = Math.min(this._totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            paginationHTML += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="page-info">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="page-btn ${i === this._currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        if (endPage < this._totalPages) {
            if (endPage < this._totalPages - 1) {
                paginationHTML += `<span class="page-info">...</span>`;
            }
            paginationHTML += `<button class="page-btn" data-page="${this._totalPages}">${this._totalPages}</button>`;
        }

        paginationHTML += `
            <button class="page-btn" id="nextBtn" ${this._currentPage === this._totalPages ? 'disabled' : ''}>
                Next →
            </button>
        `;

        pagination.innerHTML = paginationHTML;

        this.shadowRoot.getElementById('prevBtn')?.addEventListener('click', () => {
            if (this._currentPage > 1) {
                this._changePage(this._currentPage - 1);
            }
        });

        this.shadowRoot.getElementById('nextBtn')?.addEventListener('click', () => {
            if (this._currentPage < this._totalPages) {
                this._changePage(this._currentPage + 1);
            }
        });

        this.shadowRoot.querySelectorAll('.page-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.getAttribute('data-page'));
                this._changePage(page);
            });
        });
    }

    _changePage(page) {
        this.dispatchEvent(new CustomEvent('page-change', {
            detail: { page },
            bubbles: true,
            composed: true
        }));
    }

    _navigateToPost(slug) {
        this.dispatchEvent(new CustomEvent('navigate-to-post', {
            detail: { slug },
            bubbles: true,
            composed: true
        }));
    }

    _formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

customElements.define('blog-page-template', BlogPageTemplate);
