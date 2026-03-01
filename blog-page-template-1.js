// CUSTOM ELEMENT - Blog Page Template
class BlogPageElement extends HTMLElement {
    constructor() {
        super();
        this.state = {
            heroPost: null,
            featuredPosts: [],
            recentPosts: [],
            categoryPosts: [],
            trendingPosts: [],
            allPosts: [],
            currentPage: 1,
            totalPages: 1,
            postsPerPage: 9,
            headings: {
                heroHeading: 'Latest Article',
                featuredHeading: 'Featured Posts',
                recentHeading: 'Recent Posts',
                categoryHeading: 'Technology',
                trendingHeading: 'Trending',
                allPostsHeading: 'All Posts'
            }
        };
        
        const initialStyleProps = this.getAttribute('style-props');
        this.styleProps = initialStyleProps ? JSON.parse(initialStyleProps) : this.getDefaultStyleProps();
        
        this.imageCache = new Map();
        this.intersectionObserver = null;
    }

    static get observedAttributes() {
        return ['blog-data', 'style-props'];
    }

    getDefaultStyleProps() {
        return {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            primaryBg: '#ffffff',
            secondaryBg: '#f8f9fa',
            mainAccent: '#2563eb',
            hoverAccent: '#1d4ed8',
            textPrimary: '#111827',
            textSecondary: '#6b7280',
            border: '#e5e7eb',
            shadow: 'rgba(0, 0, 0, 0.1)',
            cardBg: '#ffffff'
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        try {
            if (name === 'blog-data') {
                const data = JSON.parse(newValue);
                console.log('Blog Page - Received data');
                
                this.state.heroPost = data.heroPost || null;
                this.state.featuredPosts = data.featuredPosts || [];
                this.state.recentPosts = data.recentPosts || [];
                this.state.categoryPosts = data.categoryPosts || [];
                this.state.trendingPosts = data.trendingPosts || [];
                this.state.allPosts = data.allPosts || [];
                this.state.currentPage = data.currentPage || 1;
                this.state.totalPages = data.totalPages || 1;
                this.state.postsPerPage = data.postsPerPage || 9;
                this.state.headings = data.headings || this.state.headings;
                
                if (this.isConnected) {
                    this.render();
                }
                
            } else if (name === 'style-props') {
                const newStyleProps = JSON.parse(newValue);
                this.styleProps = { ...this.styleProps, ...newStyleProps };
                
                if (this.initialRenderDone) {
                    this.updateStyles();
                }
            }
        } catch (e) {
            console.error('Error in attributeChangedCallback:', name, e);
        }
    }

    connectedCallback() {
        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="blog-page">
                <div id="content"></div>
            </div>
        `;
        
        this.initialRenderDone = true;
        this.setupIntersectionObserver();
        this.render();
    }

    disconnectedCallback() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
    }

    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                                img.removeAttribute('data-src');
                                this.intersectionObserver.unobserve(img);
                            }
                        }
                    });
                },
                { rootMargin: '50px' }
            );
        }
    }

    getStyles() {
        const {
            fontFamily, primaryBg, secondaryBg, mainAccent, hoverAccent,
            textPrimary, textSecondary, border, shadow, cardBg
        } = this.styleProps;

        return `
            blog-page-element {
                display: block;
                width: 100%;
                font-family: ${fontFamily};
                background: ${primaryBg};
                color: ${textPrimary};
            }

            * {
                box-sizing: border-box;
            }

            .blog-page {
                max-width: 1280px;
                margin: 0 auto;
                padding: 0 20px 60px;
            }

            /* Section Headers */
            .section-header {
                margin: 50px 0 30px;
                padding-bottom: 16px;
                border-bottom: 2px solid ${border};
                position: relative;
            }

            .section-title {
                font-size: clamp(24px, 3vw, 32px);
                font-weight: 800;
                color: ${textPrimary};
                margin: 0;
                display: inline-block;
                position: relative;
            }

            .section-title::after {
                content: '';
                position: absolute;
                left: 0;
                bottom: -18px;
                width: 80px;
                height: 2px;
                background: ${mainAccent};
            }

            /* Hero Section */
            .hero-section {
                margin: 40px 0 60px;
                position: relative;
            }

            .hero-card {
                position: relative;
                height: clamp(400px, 60vh, 600px);
                border-radius: 12px;
                overflow: hidden;
                cursor: pointer;
                box-shadow: 0 20px 40px ${shadow};
                background: ${secondaryBg};
            }

            .hero-image-container {
                width: 100%;
                height: 100%;
                position: relative;
                overflow: hidden;
            }

            .hero-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .hero-card:hover .hero-image {
                transform: scale(1.08);
            }

            .hero-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, 
                    rgba(0,0,0,0.95) 0%, 
                    rgba(0,0,0,0.7) 40%,
                    rgba(0,0,0,0.3) 70%,
                    transparent 100%);
                padding: clamp(30px, 5vw, 60px);
                color: #ffffff;
            }

            .hero-category {
                display: inline-block;
                background: ${mainAccent};
                color: #ffffff;
                padding: 8px 18px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 16px;
            }

            .hero-title {
                font-size: clamp(28px, 5vw, 52px);
                font-weight: 900;
                color: #ffffff;
                margin: 0 0 16px 0;
                line-height: 1.1;
                text-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }

            .hero-excerpt {
                font-size: clamp(16px, 2vw, 20px);
                color: #e5e7eb;
                margin: 0 0 20px 0;
                max-width: 800px;
                line-height: 1.6;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .hero-meta {
                display: flex;
                align-items: center;
                gap: 24px;
                font-size: 15px;
                color: #d1d5db;
                flex-wrap: wrap;
            }

            .meta-item {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            /* Featured Posts Grid */
            .featured-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 30px;
                margin-bottom: 60px;
            }

            /* Post Cards */
            .post-card {
                background: ${cardBg};
                border-radius: 12px;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 12px ${shadow};
                border: 1px solid ${border};
                display: flex;
                flex-direction: column;
                height: 100%;
            }

            .post-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 20px 40px ${shadow};
                border-color: ${mainAccent};
            }

            .post-image-container {
                width: 100%;
                height: 240px;
                overflow: hidden;
                background: ${secondaryBg};
                position: relative;
            }

            .post-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                opacity: 0;
                animation: fadeIn 0.3s ease-in forwards;
            }

            @keyframes fadeIn {
                to { opacity: 1; }
            }

            .post-card:hover .post-image {
                transform: scale(1.1);
            }

            .post-content {
                padding: 24px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .post-category {
                display: inline-block;
                background: ${secondaryBg};
                color: ${mainAccent};
                padding: 6px 14px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                margin-bottom: 14px;
                width: fit-content;
                border: 1px solid ${border};
            }

            .post-title {
                font-size: 20px;
                font-weight: 700;
                color: ${textPrimary};
                margin: 0 0 12px 0;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .post-card:hover .post-title {
                color: ${mainAccent};
            }

            .post-excerpt {
                font-size: 15px;
                line-height: 1.7;
                color: ${textSecondary};
                margin: 0 0 auto 0;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .post-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding-top: 16px;
                margin-top: 16px;
                border-top: 1px solid ${border};
                font-size: 13px;
                color: ${textSecondary};
            }

            .post-author {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 500;
            }

            .post-date {
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            /* SVG Icons */
            .icon {
                width: 16px;
                height: 16px;
                flex-shrink: 0;
            }

            .icon-small {
                width: 14px;
                height: 14px;
                flex-shrink: 0;
            }

            .meta-item .icon,
            .post-author .icon,
            .post-date .icon,
            .compact-meta .icon-small {
                opacity: 0.8;
            }

            /* Two Column Layout */
            .two-column-layout {
                display: grid;
                grid-template-columns: 1fr 380px;
                gap: 40px;
                margin-bottom: 60px;
                align-items: start;
            }

            .main-column {
                min-width: 0;
            }

            .sidebar-column {
                position: sticky;
                top: 20px;
            }

            /* Recent Posts List */
            .recent-posts-list {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }

            /* Compact Post Card */
            .compact-post-card {
                display: flex;
                gap: 16px;
                background: ${cardBg};
                border: 1px solid ${border};
                border-radius: 10px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .compact-post-card:hover {
                background: ${secondaryBg};
                border-color: ${mainAccent};
                box-shadow: 0 6px 16px ${shadow};
            }

            .compact-image-container {
                width: 100px;
                height: 100px;
                flex-shrink: 0;
                border-radius: 8px;
                overflow: hidden;
                background: ${secondaryBg};
            }

            .compact-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .compact-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                min-width: 0;
            }

            .compact-title {
                font-size: 16px;
                font-weight: 700;
                color: ${textPrimary};
                margin: 0 0 8px 0;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .compact-post-card:hover .compact-title {
                color: ${mainAccent};
            }

            .compact-meta {
                font-size: 12px;
                color: ${textSecondary};
                display: flex;
                gap: 12px;
            }

            /* Sidebar Widget */
            .sidebar-widget {
                background: ${cardBg};
                border: 1px solid ${border};
                border-radius: 12px;
                padding: 24px;
                margin-bottom: 24px;
                box-shadow: 0 2px 8px ${shadow};
            }

            .widget-title {
                font-size: 20px;
                font-weight: 700;
                color: ${textPrimary};
                margin: 0 0 20px 0;
                padding-bottom: 12px;
                border-bottom: 2px solid ${mainAccent};
            }

            .trending-list {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            /* Loading Skeleton */
            .skeleton {
                background: linear-gradient(
                    90deg,
                    ${secondaryBg} 0%,
                    ${border} 50%,
                    ${secondaryBg} 100%
                );
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
            }

            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 80px 20px;
                color: ${textSecondary};
            }

            .empty-state-icon {
                font-size: 64px;
                margin-bottom: 16px;
                opacity: 0.3;
            }

            .empty-state-text {
                font-size: 18px;
                margin: 0;
            }

            /* Pagination */
            .pagination-section {
                margin: 80px 0 60px;
            }

            .pagination-container {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                margin-top: 40px;
                flex-wrap: wrap;
            }

            .pagination-button {
                min-width: 40px;
                height: 40px;
                padding: 0 12px;
                border: 1px solid ${border};
                background: ${cardBg};
                color: ${textPrimary};
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                user-select: none;
            }

            .pagination-button:hover:not(.active):not(:disabled) {
                background: ${secondaryBg};
                border-color: ${mainAccent};
                color: ${mainAccent};
            }

            .pagination-button.active {
                background: ${mainAccent};
                color: #ffffff;
                border-color: ${mainAccent};
            }

            .pagination-button:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .pagination-button svg {
                width: 16px;
                height: 16px;
            }

            .pagination-ellipsis {
                min-width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: ${textSecondary};
                font-weight: 500;
            }

            .pagination-info {
                text-align: center;
                margin-top: 16px;
                font-size: 14px;
                color: ${textSecondary};
            }

            /* Responsive */
            @media (max-width: 1024px) {
                .two-column-layout {
                    grid-template-columns: 1fr;
                }

                .sidebar-column {
                    position: relative;
                    top: 0;
                }
            }

            @media (max-width: 768px) {
                .blog-page {
                    padding: 0 16px 40px;
                }

                .hero-section {
                    margin: 20px 0 40px;
                }

                .featured-grid {
                    grid-template-columns: 1fr;
                    gap: 24px;
                }

                .section-header {
                    margin: 40px 0 24px;
                }
            }

            @media (max-width: 480px) {
                .compact-image-container {
                    width: 80px;
                    height: 80px;
                }

                .compact-title {
                    font-size: 14px;
                }

                .hero-meta {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
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

    render() {
        const content = this.querySelector('#content');
        if (!content) return;

        console.log('Rendering blog page...');

        let html = '';

        // Hero Section
        if (this.state.heroPost) {
            html += this.renderHeroSection();
        }

        // Featured Posts Section
        if (this.state.featuredPosts.length > 0) {
            html += `
                <section>
                    <div class="section-header">
                        <h2 class="section-title">${this.escapeHtml(this.state.headings.featuredHeading)}</h2>
                    </div>
                    <div class="featured-grid">
                        ${this.state.featuredPosts.map(post => this.renderPostCard(post, false)).join('')}
                    </div>
                </section>
            `;
        }

        // Two Column Layout: Recent Posts + Trending Sidebar
        html += `
            <div class="two-column-layout">
                <div class="main-column">
                    ${this.renderRecentSection()}
                    ${this.renderCategorySection()}
                </div>
                <aside class="sidebar-column">
                    ${this.renderTrendingSidebar()}
                </aside>
            </div>
        `;

        // All Posts Section with Pagination
        html += this.renderAllPostsSection();

        content.innerHTML = html;
        this.attachEventListeners();
    }

    renderHeroSection() {
        const post = this.state.heroPost;
        const imageUrl = this.convertWixImageUrl(post.featuredImage, 'hero');
        const displayTitle = post.blogTitle || post.title || 'Untitled';

        return `
            <section class="hero-section">
                <article class="hero-card" data-slug="${post.slug}">
                    <div class="hero-image-container">
                        <img 
                            src="${imageUrl}" 
                            alt="${this.escapeHtml(displayTitle)}"
                            class="hero-image"
                            loading="eager"
                            onerror="this.src='https://via.placeholder.com/1200x600/e5e7eb/6b7280?text=Hero+Post'"
                        />
                    </div>
                    <div class="hero-overlay">
                        ${post.category ? `<span class="hero-category">${this.escapeHtml(post.category)}</span>` : ''}
                        <h1 class="hero-title">${this.escapeHtml(displayTitle)}</h1>
                        <p class="hero-excerpt">${this.escapeHtml(post.excerpt || '')}</p>
                        <div class="hero-meta">
                            ${post.author ? `
                                <span class="meta-item">
                                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    ${this.escapeHtml(post.author)}
                                </span>` : ''}
                            ${post.publishedDate ? `
                                <span class="meta-item">
                                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    ${this.formatDate(post.publishedDate)}
                                </span>` : ''}
                        </div>
                    </div>
                </article>
            </section>
        `;
    }

    renderRecentSection() {
        if (this.state.recentPosts.length === 0) {
            return `
                <section>
                    <div class="section-header">
                        <h2 class="section-title">${this.escapeHtml(this.state.headings.recentHeading)}</h2>
                    </div>
                    <div class="empty-state">
                        <div class="empty-state-icon">📰</div>
                        <p class="empty-state-text">No recent posts available</p>
                    </div>
                </section>
            `;
        }

        return `
            <section>
                <div class="section-header">
                    <h2 class="section-title">${this.escapeHtml(this.state.headings.recentHeading)}</h2>
                </div>
                <div class="recent-posts-list">
                    ${this.state.recentPosts.map(post => this.renderPostCard(post, false)).join('')}
                </div>
            </section>
        `;
    }

    renderCategorySection() {
        if (this.state.categoryPosts.length === 0) return '';

        return `
            <section>
                <div class="section-header">
                    <h2 class="section-title">${this.escapeHtml(this.state.headings.categoryHeading)}</h2>
                </div>
                <div class="featured-grid">
                    ${this.state.categoryPosts.map(post => this.renderPostCard(post, false)).join('')}
                </div>
            </section>
        `;
    }

    renderTrendingSidebar() {
        return `
            <div class="sidebar-widget">
                <h3 class="widget-title">${this.escapeHtml(this.state.headings.trendingHeading)}</h3>
                <div class="trending-list">
                    ${this.state.trendingPosts.length > 0
                        ? this.state.trendingPosts.map(post => this.renderCompactCard(post)).join('')
                        : '<p style="color: #6b7280; text-align: center;">No trending posts</p>'
                    }
                </div>
            </div>
        `;
    }

    renderAllPostsSection() {
        if (!this.state.allPosts || this.state.allPosts.length === 0) {
            return '';
        }

        return `
            <section class="pagination-section">
                <div class="section-header">
                    <h2 class="section-title">${this.escapeHtml(this.state.headings.allPostsHeading)}</h2>
                </div>
                <div class="featured-grid">
                    ${this.state.allPosts.map(post => this.renderPostCard(post, true)).join('')}
                </div>
                ${this.renderPagination()}
            </section>
        `;
    }

    renderPagination() {
        const { currentPage, totalPages } = this.state;
        
        if (totalPages <= 1) {
            return '';
        }

        let html = '<div class="pagination-container">';

        // Previous button
        html += `
            <button class="pagination-button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
        `;

        // Page numbers with smart ellipsis
        const pagesToShow = this.getPageNumbers(currentPage, totalPages);
        
        pagesToShow.forEach((page, index) => {
            if (page === '...') {
                html += '<span class="pagination-ellipsis">...</span>';
            } else {
                html += `
                    <button 
                        class="pagination-button ${page === currentPage ? 'active' : ''}" 
                        data-page="${page}"
                    >${page}</button>
                `;
            }
        });

        // Next button
        html += `
            <button class="pagination-button" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        `;

        html += '</div>';

        // Pagination info
        const start = (currentPage - 1) * this.state.postsPerPage + 1;
        const end = Math.min(currentPage * this.state.postsPerPage, this.getTotalPostsCount());
        const total = this.getTotalPostsCount();

        html += `<div class="pagination-info">Showing ${start}-${end} of ${total} posts</div>`;

        return html;
    }

    getPageNumbers(current, total) {
        const delta = 2; // Number of pages to show on each side of current page
        const range = [];
        const rangeWithDots = [];

        // Always show first page
        range.push(1);

        // Calculate range around current page
        for (let i = current - delta; i <= current + delta; i++) {
            if (i > 1 && i < total) {
                range.push(i);
            }
        }

        // Always show last page
        if (total > 1) {
            range.push(total);
        }

        // Add ellipsis where needed
        let prev = 0;
        for (const i of range) {
            if (prev && i - prev > 1) {
                rangeWithDots.push('...');
            }
            rangeWithDots.push(i);
            prev = i;
        }

        return rangeWithDots;
    }

    getTotalPostsCount() {
        // This should be provided from the widget
        return this.state.totalPosts || (this.state.totalPages * this.state.postsPerPage);
    }

    attachEventListeners() {
        // Attach click listeners to all post cards
        this.querySelectorAll('[data-slug]').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.getAttribute('data-slug');
                this.navigateToPost(slug);
            });
        });

        // Attach pagination button listeners
        this.querySelectorAll('.pagination-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const page = parseInt(button.getAttribute('data-page'));
                if (!isNaN(page) && !button.disabled) {
                    this.changePage(page);
                }
            });
        });
    }

    changePage(page) {
        // Scroll to all posts section
        const allPostsSection = this.querySelector('.pagination-section');
        if (allPostsSection) {
            allPostsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Dispatch event to widget
        this.dispatchEvent(new CustomEvent('page-change', {
            detail: { page },
            bubbles: true,
            composed: true
        }));
    }

    renderPostCard(post, lazy = true) {
        const imageUrl = this.convertWixImageUrl(post.featuredImage, 'card');
        const displayTitle = post.blogTitle || post.title || 'Untitled';

        return `
            <article class="post-card" data-slug="${post.slug}">
                <div class="post-image-container">
                    <img 
                        src="${imageUrl}"
                        alt="${this.escapeHtml(displayTitle)}"
                        class="post-image"
                        loading="${lazy ? 'lazy' : 'eager'}"
                        onerror="this.src='https://via.placeholder.com/400x240/e5e7eb/6b7280?text=No+Image'"
                    />
                </div>
                <div class="post-content">
                    ${post.category ? `<span class="post-category">${this.escapeHtml(post.category)}</span>` : ''}
                    <h3 class="post-title">${this.escapeHtml(displayTitle)}</h3>
                    <p class="post-excerpt">${this.escapeHtml(post.excerpt || '')}</p>
                    <div class="post-footer">
                        <span class="post-author">
                            ${post.author ? `
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                ${this.escapeHtml(post.author)}` : 'Anonymous'}
                        </span>
                        <span class="post-date">
                            ${post.publishedDate ? `
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                ${this.formatDate(post.publishedDate)}` : ''}
                        </span>
                    </div>
                </div>
            </article>
        `;
    }

    renderCompactCard(post) {
        const imageUrl = this.convertWixImageUrl(post.featuredImage, 'thumbnail');
        const displayTitle = post.blogTitle || post.title || 'Untitled';

        return `
            <article class="compact-post-card" data-slug="${post.slug}">
                <div class="compact-image-container">
                    <img 
                        src="${imageUrl}"
                        alt="${this.escapeHtml(displayTitle)}"
                        class="compact-image"
                        loading="lazy"
                        onerror="this.src='https://via.placeholder.com/100/e5e7eb/6b7280?text=No+Image'"
                    />
                </div>
                <div class="compact-content">
                    <h4 class="compact-title">${this.escapeHtml(displayTitle)}</h4>
                    <div class="compact-meta">
                        ${post.publishedDate ? `
                            <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${this.formatDate(post.publishedDate)}` : ''}
                    </div>
                </div>
            </article>
        `;
    }

    navigateToPost(slug) {
        this.dispatchEvent(new CustomEvent('navigate-to-post', {
            detail: { slug },
            bubbles: true,
            composed: true
        }));
    }

    convertWixImageUrl(wixUrl, size = 'card') {
        if (!wixUrl || typeof wixUrl !== 'string') return '';
        if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
            return this.optimizeImageUrl(wixUrl, size);
        }

        if (wixUrl.startsWith('wix:image://')) {
            try {
                const parts = wixUrl.split('/');
                const fileId = parts[3]?.split('#')[0];
                if (fileId) {
                    const baseUrl = `https://static.wixstatic.com/media/${fileId}`;
                    return this.optimizeImageUrl(baseUrl, size);
                }
            } catch (e) {
                console.error('Error parsing Wix image URL:', e);
            }
        }
        return '';
    }

    optimizeImageUrl(url, size) {
        if (!url) return '';
        
        // If it's already a Wix static URL with parameters, return as is
        if (url.includes('/v1/fill/')) return url;
        
        // Define size parameters for different contexts
        const sizeParams = {
            hero: '/v1/fill/w_1200,h_600,al_c,q_85,usm_0.66_1.00_0.01',
            card: '/v1/fill/w_400,h_240,al_c,q_80,usm_0.66_1.00_0.01',
            thumbnail: '/v1/fill/w_100,h_100,al_c,q_75,usm_0.66_1.00_0.01'
        };

        const params = sizeParams[size] || sizeParams.card;
        
        // Only append if it's a Wix static URL and doesn't already have parameters
        if (url.includes('static.wixstatic.com/media/')) {
            // Ensure URL ends with proper file extension
            if (!url.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                // Add default jpg extension if missing
                return url + params + '/file.jpg';
            }
            return url + params;
        }
        
        return url;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

customElements.define('blog-page-element', BlogPageElement);
