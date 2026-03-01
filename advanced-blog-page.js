// CUSTOM ELEMENT - Advanced Blog Page (Magazine Layout)
class AdvancedBlogPage extends HTMLElement {
    constructor() {
        super();
        this.state = {
            featuredPost: null,
            latestPosts: [],
            allPosts: [],
            categories: [],
            tags: [],
            currentPage: 1,
            totalPages: 1,
            postsPerPage: 9,
            totalPosts: 0,
            showCategories: true,
            showTags: true,
            headings: {
                featuredHeading: 'Featured Story',
                latestHeading: 'Latest Articles',
                allPostsHeading: 'All Posts',
                categoriesHeading: 'Categories',
                tagsHeading: 'Popular Tags'
            }
        };
        
        const initialStyleProps = this.getAttribute('style-props');
        this.styleProps = initialStyleProps ? JSON.parse(initialStyleProps) : this.getDefaultStyleProps();
    }

    static get observedAttributes() {
        return ['blog-data', 'style-props'];
    }

    getDefaultStyleProps() {
        return {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            bgColor: '#ffffff',
            primaryColor: '#2563eb',
            secondaryColor: '#3b82f6',
            textColor: '#111827',
            textSecondary: '#6b7280',
            borderColor: '#e5e7eb',
            cardBg: '#ffffff',
            sidebarBg: '#f9fafb',
            hoverColor: '#1e40af',
            accentColor: '#f59e0b'
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        try {
            if (name === 'blog-data') {
                const data = JSON.parse(newValue);
                console.log('Blog Page - Received data');
                
                this.state.featuredPost = data.featuredPost || null;
                this.state.latestPosts = data.latestPosts || [];
                this.state.allPosts = data.allPosts || [];
                this.state.categories = data.categories || [];
                this.state.tags = data.tags || [];
                this.state.currentPage = data.currentPage || 1;
                this.state.totalPages = data.totalPages || 1;
                this.state.postsPerPage = data.postsPerPage || 9;
                this.state.totalPosts = data.totalPosts || 0;
                this.state.showCategories = data.showCategories !== false;
                this.state.showTags = data.showTags !== false;
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
            <div class="advanced-blog-page">
                <div class="container">
                    <div class="layout-grid">
                        <aside class="sidebar" id="sidebar"></aside>
                        <main class="main-content">
                            <div id="content"></div>
                        </main>
                    </div>
                </div>
            </div>
        `;
        
        this.initialRenderDone = true;
        this.render();
    }

    getStyles() {
        const {
            fontFamily, bgColor, primaryColor, secondaryColor,
            textColor, textSecondary, borderColor, cardBg,
            sidebarBg, hoverColor, accentColor
        } = this.styleProps;

        return `
            advanced-blog-page {
                display: block;
                width: 100%;
                font-family: ${fontFamily};
                background: ${bgColor};
                color: ${textColor};
                min-height: 100vh;
            }

            * {
                box-sizing: border-box;
            }

            .advanced-blog-page {
                padding: 40px 0;
            }

            .container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 0 20px;
            }

            .layout-grid {
                display: grid;
                grid-template-columns: 320px 1fr;
                gap: 40px;
                align-items: start;
            }

            /* Sidebar */
            .sidebar {
                position: sticky;
                top: 20px;
                background: ${sidebarBg};
                border-radius: 12px;
                padding: 24px;
                border: 1px solid ${borderColor};
                max-height: calc(100vh - 40px);
                overflow-y: auto;
            }

            .sidebar::-webkit-scrollbar {
                width: 6px;
            }

            .sidebar::-webkit-scrollbar-track {
                background: ${borderColor};
                border-radius: 3px;
            }

            .sidebar::-webkit-scrollbar-thumb {
                background: ${primaryColor};
                border-radius: 3px;
            }

            .sidebar-section {
                margin-bottom: 32px;
            }

            .sidebar-section:last-child {
                margin-bottom: 0;
            }

            .sidebar-title {
                font-size: 16px;
                font-weight: 700;
                color: ${textColor};
                margin: 0 0 16px 0;
                padding-bottom: 12px;
                border-bottom: 2px solid ${primaryColor};
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .category-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .category-item {
                padding: 10px 14px;
                background: ${cardBg};
                border: 1px solid ${borderColor};
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .category-item:hover {
                background: ${primaryColor};
                color: #ffffff;
                border-color: ${primaryColor};
                transform: translateX(4px);
            }

            .category-name {
                font-size: 14px;
                font-weight: 500;
            }

            .category-count {
                font-size: 12px;
                opacity: 0.8;
                background: ${borderColor};
                padding: 2px 8px;
                border-radius: 10px;
            }

            .category-item:hover .category-count {
                background: rgba(255, 255, 255, 0.2);
            }

            .tag-cloud {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .tag-pill {
                padding: 6px 12px;
                background: ${cardBg};
                border: 1px solid ${borderColor};
                border-radius: 16px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                color: ${textColor};
            }

            .tag-pill:hover {
                background: ${accentColor};
                color: #ffffff;
                border-color: ${accentColor};
                transform: translateY(-2px);
            }

            /* Featured Post */
            .featured-section {
                margin-bottom: 50px;
            }

            .section-header {
                margin-bottom: 24px;
            }

            .section-title {
                font-size: 28px;
                font-weight: 800;
                color: ${textColor};
                margin: 0 0 8px 0;
                position: relative;
                display: inline-block;
            }

            .section-title::after {
                content: '';
                position: absolute;
                left: 0;
                bottom: -4px;
                width: 60px;
                height: 4px;
                background: ${primaryColor};
                border-radius: 2px;
            }

            .featured-card {
                background: ${cardBg};
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid ${borderColor};
                cursor: pointer;
                transition: all 0.3s ease;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0;
            }

            .featured-card:hover {
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
                transform: translateY(-4px);
            }

            .featured-image-container {
                position: relative;
                overflow: hidden;
                height: 100%;
                min-height: 400px;
            }

            .featured-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s ease;
            }

            .featured-card:hover .featured-image {
                transform: scale(1.05);
            }

            .featured-content {
                padding: 40px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            .featured-badge {
                display: inline-block;
                background: ${accentColor};
                color: #ffffff;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 16px;
                width: fit-content;
            }

            .featured-title {
                font-size: 32px;
                font-weight: 900;
                color: ${textColor};
                margin: 0 0 16px 0;
                line-height: 1.2;
            }

            .featured-excerpt {
                font-size: 16px;
                line-height: 1.7;
                color: ${textSecondary};
                margin: 0 0 24px 0;
            }

            .featured-meta {
                display: flex;
                gap: 20px;
                align-items: center;
                font-size: 14px;
                color: ${textSecondary};
            }

            .meta-item {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .meta-item svg {
                width: 16px;
                height: 16px;
                opacity: 0.7;
            }

            /* Latest Posts Grid */
            .latest-section {
                margin-bottom: 50px;
            }

            .posts-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 24px;
            }

            .post-card {
                background: ${cardBg};
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid ${borderColor};
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
            }

            .post-card:hover {
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
                transform: translateY(-4px);
                border-color: ${primaryColor};
            }

            .post-image-container {
                position: relative;
                width: 100%;
                height: 200px;
                overflow: hidden;
                background: ${borderColor};
            }

            .post-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.4s ease;
            }

            .post-card:hover .post-image {
                transform: scale(1.1);
            }

            .post-content {
                padding: 20px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .post-category {
                display: inline-block;
                background: ${primaryColor}20;
                color: ${primaryColor};
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 12px;
                width: fit-content;
            }

            .post-title {
                font-size: 18px;
                font-weight: 700;
                color: ${textColor};
                margin: 0 0 12px 0;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .post-excerpt {
                font-size: 14px;
                line-height: 1.6;
                color: ${textSecondary};
                margin: 0 0 auto 0;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .post-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 16px;
                margin-top: 16px;
                border-top: 1px solid ${borderColor};
                font-size: 12px;
                color: ${textSecondary};
            }

            .post-author {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .post-date {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            /* All Posts Section */
            .all-posts-section {
                margin-top: 50px;
            }

            /* Pagination */
            .pagination-container {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                margin-top: 40px;
                flex-wrap: wrap;
            }

            .pagination-btn {
                min-width: 40px;
                height: 40px;
                padding: 0 12px;
                border: 1px solid ${borderColor};
                background: ${cardBg};
                color: ${textColor};
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .pagination-btn:hover:not(.active):not(:disabled) {
                background: ${primaryColor};
                color: #ffffff;
                border-color: ${primaryColor};
            }

            .pagination-btn.active {
                background: ${primaryColor};
                color: #ffffff;
                border-color: ${primaryColor};
            }

            .pagination-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .pagination-btn svg {
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

            /* SVG Icons */
            .icon {
                width: 16px;
                height: 16px;
                flex-shrink: 0;
                stroke: currentColor;
                fill: none;
                stroke-width: 2;
            }

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 80px 20px;
                color: ${textSecondary};
            }

            .empty-state svg {
                width: 64px;
                height: 64px;
                margin-bottom: 20px;
                opacity: 0.3;
            }

            .empty-state h3 {
                font-size: 24px;
                color: ${textColor};
                margin: 0 0 12px 0;
            }

            .empty-state p {
                font-size: 16px;
                margin: 0;
            }

            /* Responsive */
            @media (max-width: 1200px) {
                .layout-grid {
                    grid-template-columns: 280px 1fr;
                    gap: 30px;
                }

                .posts-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }

            @media (max-width: 968px) {
                .layout-grid {
                    grid-template-columns: 1fr;
                }

                .sidebar {
                    position: relative;
                    top: 0;
                    max-height: none;
                    margin-bottom: 30px;
                }

                .featured-card {
                    grid-template-columns: 1fr;
                }

                .featured-image-container {
                    min-height: 300px;
                }

                .posts-grid {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 640px) {
                .advanced-blog-page {
                    padding: 20px 0;
                }

                .container {
                    padding: 0 16px;
                }

                .featured-content {
                    padding: 24px;
                }

                .featured-title {
                    font-size: 24px;
                }

                .section-title {
                    font-size: 24px;
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
        const sidebar = this.querySelector('#sidebar');
        const content = this.querySelector('#content');
        if (!sidebar || !content) return;

        console.log('Rendering blog page...');

        // Render sidebar
        sidebar.innerHTML = this.renderSidebar();

        // Render main content
        let html = '';

        // Featured Post
        if (this.state.featuredPost) {
            html += this.renderFeaturedSection();
        }

        // Latest Posts
        if (this.state.latestPosts.length > 0) {
            html += this.renderLatestSection();
        }

        // All Posts with Pagination
        html += this.renderAllPostsSection();

        content.innerHTML = html;
        this.attachEventListeners();
    }

    renderSidebar() {
        let html = '';

        // Categories
        if (this.state.showCategories && this.state.categories.length > 0) {
            html += `
                <div class="sidebar-section">
                    <h3 class="sidebar-title">${this.escapeHtml(this.state.headings.categoriesHeading)}</h3>
                    <div class="category-list">
                        ${this.state.categories.map(cat => `
                            <div class="category-item" data-category-slug="${cat.slug}">
                                <span class="category-name">${this.escapeHtml(cat.name || cat.title)}</span>
                                <span class="category-count">${cat.postCount || 0}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Tags
        if (this.state.showTags && this.state.tags.length > 0) {
            html += `
                <div class="sidebar-section">
                    <h3 class="sidebar-title">${this.escapeHtml(this.state.headings.tagsHeading)}</h3>
                    <div class="tag-cloud">
                        ${this.state.tags.map(tag => `
                            <div class="tag-pill" data-tag-slug="${tag.slug}">
                                #${this.escapeHtml(tag.name)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return html || '<p style="color: #6b7280;">No categories or tags available</p>';
    }

    renderFeaturedSection() {
        const post = this.state.featuredPost;
        const imageUrl = this.convertWixImageUrl(post.featuredImage);
        const displayTitle = post.blogTitle || post.title || 'Untitled';

        return `
            <section class="featured-section">
                <div class="section-header">
                    <h2 class="section-title">${this.escapeHtml(this.state.headings.featuredHeading)}</h2>
                </div>
                <article class="featured-card" data-slug="${post.slug}">
                    <div class="featured-image-container">
                        <img 
                            src="${imageUrl}"
                            alt="${this.escapeHtml(displayTitle)}"
                            class="featured-image"
                            onerror="this.src='https://via.placeholder.com/800x400/e5e7eb/6b7280?text=Featured+Post'"
                        />
                    </div>
                    <div class="featured-content">
                        ${post.category ? `<span class="featured-badge">${this.escapeHtml(post.category)}</span>` : ''}
                        <h1 class="featured-title">${this.escapeHtml(displayTitle)}</h1>
                        <p class="featured-excerpt">${this.escapeHtml(post.excerpt || '')}</p>
                        <div class="featured-meta">
                            ${post.author ? `
                                <div class="meta-item">
                                    <svg class="icon" viewBox="0 0 24 24">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <span>${this.escapeHtml(post.author)}</span>
                                </div>
                            ` : ''}
                            ${post.publishedDate ? `
                                <div class="meta-item">
                                    <svg class="icon" viewBox="0 0 24 24">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    <span>${this.formatDate(post.publishedDate)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </article>
            </section>
        `;
    }

    renderLatestSection() {
        return `
            <section class="latest-section">
                <div class="section-header">
                    <h2 class="section-title">${this.escapeHtml(this.state.headings.latestHeading)}</h2>
                </div>
                <div class="posts-grid">
                    ${this.state.latestPosts.map(post => this.renderPostCard(post)).join('')}
                </div>
            </section>
        `;
    }

    renderAllPostsSection() {
        if (!this.state.allPosts || this.state.allPosts.length === 0) {
            return `
                <section class="all-posts-section">
                    <div class="section-header">
                        <h2 class="section-title">${this.escapeHtml(this.state.headings.allPostsHeading)}</h2>
                    </div>
                    ${this.getEmptyState('No posts available')}
                </section>
            `;
        }

        return `
            <section class="all-posts-section">
                <div class="section-header">
                    <h2 class="section-title">${this.escapeHtml(this.state.headings.allPostsHeading)}</h2>
                </div>
                <div class="posts-grid">
                    ${this.state.allPosts.map(post => this.renderPostCard(post)).join('')}
                </div>
                ${this.renderPagination()}
            </section>
        `;
    }

    renderPostCard(post) {
        const imageUrl = this.convertWixImageUrl(post.featuredImage);
        const displayTitle = post.blogTitle || post.title || 'Untitled';

        return `
            <article class="post-card" data-slug="${post.slug}">
                <div class="post-image-container">
                    <img 
                        src="${imageUrl}"
                        alt="${this.escapeHtml(displayTitle)}"
                        class="post-image"
                        loading="lazy"
                        onerror="this.src='https://via.placeholder.com/400x200/e5e7eb/6b7280?text=No+Image'"
                    />
                </div>
                <div class="post-content">
                    ${post.category ? `<span class="post-category">${this.escapeHtml(post.category)}</span>` : ''}
                    <h3 class="post-title">${this.escapeHtml(displayTitle)}</h3>
                    <p class="post-excerpt">${this.escapeHtml(post.excerpt || '')}</p>
                    <div class="post-footer">
                        <div class="post-author">
                            ${post.author ? `
                                <svg class="icon" viewBox="0 0 24 24">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <span>${this.escapeHtml(post.author)}</span>
                            ` : 'Anonymous'}
                        </div>
                        <div class="post-date">
                            ${post.publishedDate ? `
                                <svg class="icon" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                ${this.formatDate(post.publishedDate)}
                            ` : ''}
                        </div>
                    </div>
                </div>
            </article>
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
            <button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
        `;

        // Page numbers
        const pagesToShow = this.getPageNumbers(currentPage, totalPages);
        
        pagesToShow.forEach((page) => {
            if (page === '...') {
                html += '<span class="pagination-ellipsis">...</span>';
            } else {
                html += `
                    <button 
                        class="pagination-btn ${page === currentPage ? 'active' : ''}" 
                        data-page="${page}"
                    >${page}</button>
                `;
            }
        });

        // Next button
        html += `
            <button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        `;

        html += '</div>';

        // Pagination info
        const start = (currentPage - 1) * this.state.postsPerPage + 1;
        const end = Math.min(currentPage * this.state.postsPerPage, this.state.totalPosts);
        const total = this.state.totalPosts;

        html += `<div class="pagination-info">Showing ${start}-${end} of ${total} posts</div>`;

        return html;
    }

    getPageNumbers(current, total) {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        range.push(1);

        for (let i = current - delta; i <= current + delta; i++) {
            if (i > 1 && i < total) {
                range.push(i);
            }
        }

        if (total > 1) {
            range.push(total);
        }

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

    attachEventListeners() {
        // Post card clicks
        this.querySelectorAll('[data-slug]').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.getAttribute('data-slug');
                this.navigateToPost(slug);
            });
        });

        // Category clicks
        this.querySelectorAll('[data-category-slug]').forEach(item => {
            item.addEventListener('click', () => {
                const slug = item.getAttribute('data-category-slug');
                this.navigateToCategory(slug);
            });
        });

        // Tag clicks
        this.querySelectorAll('[data-tag-slug]').forEach(pill => {
            pill.addEventListener('click', () => {
                const slug = pill.getAttribute('data-tag-slug');
                this.navigateToTag(slug);
            });
        });

        // Pagination clicks
        this.querySelectorAll('.pagination-btn').forEach(button => {
            button.addEventListener('click', () => {
                const page = parseInt(button.getAttribute('data-page'));
                if (!isNaN(page) && !button.disabled) {
                    this.changePage(page);
                }
            });
        });
    }

    changePage(page) {
        const allPostsSection = this.querySelector('.all-posts-section');
        if (allPostsSection) {
            allPostsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        this.dispatchEvent(new CustomEvent('page-change', {
            detail: { page },
            bubbles: true,
            composed: true
        }));
    }

    navigateToPost(slug) {
        this.dispatchEvent(new CustomEvent('navigate-to-post', {
            detail: { slug },
            bubbles: true,
            composed: true
        }));
    }

    navigateToCategory(slug) {
        this.dispatchEvent(new CustomEvent('navigate-to-category', {
            detail: { slug },
            bubbles: true,
            composed: true
        }));
    }

    navigateToTag(slug) {
        this.dispatchEvent(new CustomEvent('navigate-to-tag', {
            detail: { slug },
            bubbles: true,
            composed: true
        }));
    }

    getEmptyState(message) {
        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                    <path d="M7 7h10M7 12h10M7 17h7"/>
                </svg>
                <h3>${message}</h3>
                <p>Check back later for updates</p>
            </div>
        `;
    }

    convertWixImageUrl(wixUrl) {
        if (!wixUrl || typeof wixUrl !== 'string') return '';
        if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) return wixUrl;

        if (wixUrl.startsWith('wix:image://')) {
            try {
                const parts = wixUrl.split('/');
                const fileId = parts[3]?.split('#')[0];
                if (fileId) return `https://static.wixstatic.com/media/${fileId}`;
            } catch (e) {
                console.error('Error parsing Wix image URL:', e);
            }
        }
        return '';
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

customElements.define('advanced-blog-page', AdvancedBlogPage);
