// CUSTOM ELEMENT - Category Browser (FIXED - Following Graph Pattern)
class CategoryBrowser extends HTMLElement {
    constructor() {
        super();
        this.state = {
            mode: 'single',
            category: null,
            categories: [],
            posts: [],
            currentPage: 1,
            postsPerPage: 12,
            totalPosts: 0,
            isLoading: true
        };
        
        const initialStyleProps = this.getAttribute('style-props');
        this.styleProps = initialStyleProps ? JSON.parse(initialStyleProps) : this.getDefaultStyleProps();
    }

    static get observedAttributes() {
        return ['mode', 'category-data', 'categories-data', 'posts-data', 'style-props'];
    }

    getDefaultStyleProps() {
        return {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            bgColor: '#0f0f0f',
            titleColor: '#64FFDA',
            subtitleColor: '#b0b0b0',
            cardBg: '#1a1a1a',
            cardBgGradient: '#2d2d2d',
            cardBorder: '#3d3d3d',
            cardBorderHover: '#64FFDA',
            cardTitleColor: '#ffffff',
            cardDescColor: '#9ca3af',
            iconBg: 'rgba(100, 255, 218, 0.1)',
            iconBorder: '#64FFDA',
            iconColor: '#64FFDA',
            postCardBg: '#1a1a1a',
            postCardBorder: '#2d2d2d',
            postCardBorderHover: '#64FFDA',
            postTitleColor: '#ffffff',
            postExcerptColor: '#9ca3af',
            categoryBadgeBg: 'rgba(100, 255, 218, 0.1)',
            categoryBadgeText: '#64FFDA',
            metaColor: '#6b7280',
            authorNameColor: '#ffffff',
            dateColor: '#9ca3af',
            paginationBg: '#1a1a1a',
            paginationBorder: '#3d3d3d',
            paginationText: '#9ca3af',
            paginationHoverBg: '#2d2d2d',
            paginationHoverBorder: '#64FFDA',
            paginationHoverText: '#64FFDA',
            paginationActiveBg: '#64FFDA',
            paginationActiveText: '#000000',
            emptyIconColor: '#3d3d3d',
            emptyTitleColor: '#ffffff',
            emptyTextColor: '#6b7280',
            accentColor: '#64FFDA',
            accentColorSecondary: '#4dd9ba'
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        try {
            if (name === 'mode') {
                this.state.mode = newValue;
                this.state.isLoading = false;
                if (this.isConnected) this.render();
                
            } else if (name === 'category-data') {
                this.state.category = JSON.parse(newValue);
                this.state.mode = 'single';
                this.state.isLoading = false;
                if (this.isConnected) this.render();
                
            } else if (name === 'categories-data') {
                this.state.categories = JSON.parse(newValue);
                this.state.mode = 'all';
                this.state.isLoading = false;
                if (this.isConnected) this.render();
                
            } else if (name === 'posts-data') {
                const data = JSON.parse(newValue);
                console.log('Custom Element - Received posts-data:', data);
                
                // Update all state at once
                this.state.posts = data.posts || [];
                this.state.totalPosts = data.total || this.state.posts.length;
                this.state.currentPage = data.currentPage || 1;
                this.state.postsPerPage = data.postsPerPage || 12;
                
                console.log('Custom Element - State updated:', {
                    postsCount: this.state.posts.length,
                    totalPosts: this.state.totalPosts,
                    currentPage: this.state.currentPage,
                    postsPerPage: this.state.postsPerPage,
                    totalPages: Math.ceil(this.state.totalPosts / this.state.postsPerPage)
                });
                
                // CRITICAL: Immediately update if connected (like the graph does)
                if (this.isConnected) {
                    this.updatePostsDisplay();
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
            <div class="category-browser">
                <div id="content"></div>
                <div id="pagination"></div>
            </div>
        `;
        
        this.initialRenderDone = true;
        
        if (!this.state.isLoading) {
            this.render();
        }
    }

    // NEW: Separate method to update posts display (like graph's updateChart)
    updatePostsDisplay() {
        console.log('updatePostsDisplay called');
        
        const container = this.querySelector('#postsContainer');
        if (!container) {
            console.log('postsContainer not found, full render needed');
            // If container doesn't exist, do full render
            if (this.state.mode === 'single' && this.state.category) {
                this.render();
            }
            return;
        }

        if (!this.state.posts || this.state.posts.length === 0) {
            container.innerHTML = this.getEmptyState('No posts found in this category');
            this.querySelector('#pagination').innerHTML = '';
            return;
        }

        // Update posts grid
        container.innerHTML = `
            <div class="posts-section-header">
                <h2>Articles</h2>
            </div>
            <div class="posts-grid">
                ${this.state.posts.map(post => this.renderPostCard(post)).join('')}
            </div>
        `;

        // Re-attach event listeners to post cards
        this.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.getAttribute('data-slug');
                this.navigateToPost(slug);
            });
        });

        // Update pagination
        this.renderPagination();
    }

    getStyles() {
        const {
            fontFamily, bgColor, titleColor, subtitleColor,
            cardBg, cardBgGradient, cardBorder, cardBorderHover,
            cardTitleColor, cardDescColor,
            iconBg, iconBorder, iconColor,
            postCardBg, postCardBorder, postCardBorderHover,
            postTitleColor, postExcerptColor,
            categoryBadgeBg, categoryBadgeText,
            metaColor, authorNameColor, dateColor,
            paginationBg, paginationBorder, paginationText,
            paginationHoverBg, paginationHoverBorder, paginationHoverText,
            paginationActiveBg, paginationActiveText,
            emptyIconColor, emptyTitleColor, emptyTextColor,
            accentColor, accentColorSecondary
        } = this.styleProps;

        return `
            category-browser {
                display: block;
                width: 100%;
                font-family: ${fontFamily};
                background: ${bgColor};
                color: #ffffff;
                min-height: 100vh;
            }

            .category-browser {
                max-width: 1400px;
                margin: 0 auto;
                padding: 60px 20px;
            }

            /* Single Category Header */
            .single-header {
                text-align: center;
                margin-bottom: 60px;
                padding: 60px 40px;
                background: linear-gradient(135deg, ${cardBg} 0%, ${cardBgGradient} 100%);
                border: 1px solid ${cardBorder};
                border-radius: 16px;
            }

            .category-icon {
                width: 80px;
                height: 80px;
                margin: 0 auto 24px;
                background: ${iconBg};
                border: 2px solid ${iconBorder};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .category-icon svg {
                width: 40px;
                height: 40px;
                fill: ${iconColor};
            }

            .category-title {
                font-size: clamp(36px, 5vw, 56px);
                font-weight: 900;
                color: ${titleColor};
                margin: 0 0 20px 0;
                letter-spacing: -0.5px;
            }

            .category-description {
                font-size: 18px;
                line-height: 1.7;
                color: ${subtitleColor};
                max-width: 800px;
                margin: 0 auto 30px;
            }

            .category-meta {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 24px;
                flex-wrap: wrap;
            }

            .meta-badge {
                background: ${cardBgGradient};
                border: 1px solid ${cardBorder};
                padding: 10px 20px;
                border-radius: 20px;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: ${metaColor};
            }

            .meta-badge svg {
                width: 18px;
                height: 18px;
                fill: ${iconColor};
            }

            /* All Categories Grid */
            .all-categories-header {
                text-align: center;
                margin-bottom: 60px;
            }

            .all-categories-header h1 {
                font-size: clamp(36px, 5vw, 48px);
                font-weight: 900;
                color: ${titleColor};
                margin: 0 0 16px 0;
            }

            .all-categories-header p {
                font-size: 18px;
                color: ${subtitleColor};
                margin: 0;
            }

            .categories-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 24px;
                margin-bottom: 60px;
            }

            .category-card {
                background: linear-gradient(135deg, ${cardBg} 0%, ${cardBgGradient} 100%);
                border: 1px solid ${cardBorder};
                border-radius: 12px;
                padding: 32px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .category-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, ${accentColor} 0%, ${accentColorSecondary} 100%);
                transform: scaleX(0);
                transition: transform 0.3s ease;
            }

            .category-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 12px 24px ${iconBg};
                border-color: ${cardBorderHover};
            }

            .category-card:hover::before {
                transform: scaleX(1);
            }

            .category-card-icon {
                width: 56px;
                height: 56px;
                background: ${iconBg};
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
            }

            .category-card-icon svg {
                width: 28px;
                height: 28px;
                fill: ${iconColor};
            }

            .category-card-title {
                font-size: 24px;
                font-weight: 700;
                color: ${cardTitleColor};
                margin: 0 0 12px 0;
            }

            .category-card-description {
                font-size: 14px;
                line-height: 1.6;
                color: ${cardDescColor};
                margin-bottom: 20px;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .category-card-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding-top: 16px;
                border-top: 1px solid ${cardBorder};
            }

            .category-card-count {
                font-size: 13px;
                color: ${metaColor};
            }

            .category-card-arrow {
                width: 24px;
                height: 24px;
                fill: ${iconColor};
                transition: transform 0.3s ease;
            }

            .category-card:hover .category-card-arrow {
                transform: translateX(4px);
            }

            /* Posts Grid */
            .posts-section-header {
                margin-bottom: 40px;
                padding-bottom: 16px;
                border-bottom: 2px solid ${cardBorder};
            }

            .posts-section-header h2 {
                font-size: 28px;
                font-weight: 700;
                color: ${cardTitleColor};
                margin: 0;
            }

            .posts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 32px;
                margin-bottom: 60px;
            }

            .post-card {
                background: ${postCardBg};
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid ${postCardBorder};
                transition: all 0.3s ease;
                cursor: pointer;
                display: flex;
                flex-direction: column;
            }

            .post-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.6);
                border-color: ${postCardBorderHover};
            }

            .post-image {
                width: 100%;
                height: 220px;
                object-fit: cover;
                background: ${bgColor};
            }

            .post-content {
                padding: 24px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .post-category-badge {
                display: inline-block;
                background: ${categoryBadgeBg};
                color: ${categoryBadgeText};
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 12px;
                width: fit-content;
            }

            .post-title {
                font-size: 22px;
                font-weight: 700;
                color: ${postTitleColor};
                margin: 0 0 12px 0;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .post-excerpt {
                font-size: 15px;
                line-height: 1.6;
                color: ${postExcerptColor};
                margin-bottom: 20px;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                flex: 1;
            }

            .post-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 13px;
                color: ${metaColor};
                padding-top: 16px;
                border-top: 1px solid ${postCardBorder};
            }

            .post-author {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .post-author-avatar {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                object-fit: cover;
                border: 1px solid ${iconColor};
            }

            .post-author span {
                color: ${authorNameColor};
            }

            .post-date {
                display: flex;
                align-items: center;
                gap: 6px;
                color: ${dateColor};
            }

            /* Pagination */
            .pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                margin-top: 60px;
            }

            .pagination-btn {
                padding: 10px 16px;
                background: ${paginationBg};
                border: 1px solid ${paginationBorder};
                border-radius: 8px;
                color: ${paginationText};
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .pagination-btn:hover:not(:disabled) {
                background: ${paginationHoverBg};
                border-color: ${paginationHoverBorder};
                color: ${paginationHoverText};
            }

            .pagination-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .pagination-btn svg {
                width: 16px;
                height: 16px;
                fill: currentColor;
            }

            .pagination-btn.active {
                background: ${paginationActiveBg};
                border-color: ${paginationActiveBg};
                color: ${paginationActiveText};
            }

            .pagination-info {
                padding: 0 16px;
                color: ${paginationText};
                font-size: 14px;
            }

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 80px 20px;
                color: ${metaColor};
            }

            .empty-state svg {
                width: 64px;
                height: 64px;
                fill: ${emptyIconColor};
                margin-bottom: 20px;
            }

            .empty-state h3 {
                font-size: 24px;
                color: ${emptyTitleColor};
                margin: 0 0 12px 0;
            }

            .empty-state p {
                font-size: 16px;
                margin: 0;
                color: ${emptyTextColor};
            }

            /* Loading */
            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }

            .skeleton {
                background: ${cardBg};
                background-image: linear-gradient(
                    to right,
                    ${cardBg} 0%,
                    ${cardBgGradient} 20%,
                    ${cardBg} 40%,
                    ${cardBg} 100%
                );
                background-repeat: no-repeat;
                background-size: 1000px 100%;
                animation: shimmer 1.5s infinite linear;
                border-radius: 8px;
            }

            @media (max-width: 768px) {
                .category-browser {
                    padding: 40px 16px;
                }

                .single-header {
                    padding: 40px 24px;
                }

                .categories-grid,
                .posts-grid {
                    grid-template-columns: 1fr;
                }

                .category-meta {
                    flex-direction: column;
                    gap: 12px;
                }

                .pagination {
                    flex-wrap: wrap;
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

        if (this.state.mode === 'single') {
            this.renderSingleCategory(content);
        } else {
            this.renderAllCategories(content);
        }
    }

    renderSingleCategory(content) {
        if (!this.state.category) {
            content.innerHTML = this.getEmptyState('Category not found');
            return;
        }

        const cat = this.state.category;

        content.innerHTML = `
            <div class="single-header">
                <div class="category-icon">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                    </svg>
                </div>
                <h1 class="category-title">${this.escapeHtml(cat.title || cat.name)}</h1>
                ${cat.description ? `<p class="category-description">${this.escapeHtml(cat.description)}</p>` : ''}
                <div class="category-meta">
                    <span class="meta-badge">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                        ${this.state.totalPosts || cat.postCount || 0} Posts
                    </span>
                </div>
            </div>
            <div id="postsContainer"></div>
        `;

        // Render posts if we have them
        if (this.state.posts && this.state.posts.length > 0) {
            this.updatePostsDisplay();
        }
    }

    renderAllCategories(content) {
        if (!this.state.categories || this.state.categories.length === 0) {
            content.innerHTML = this.getEmptyState('No categories found');
            return;
        }

        content.innerHTML = `
            <div class="all-categories-header">
                <h1>Browse Categories</h1>
                <p>Explore articles by category</p>
            </div>
            <div class="categories-grid">
                ${this.state.categories.map(cat => `
                    <div class="category-card" data-slug="${cat.slug}">
                        <div class="category-card-icon">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                            </svg>
                        </div>
                        <h2 class="category-card-title">${this.escapeHtml(cat.title || cat.name)}</h2>
                        <p class="category-card-description">${this.escapeHtml(cat.description || 'Explore articles in this category')}</p>
                        <div class="category-card-footer">
                            <span class="category-card-count">${cat.postCount || 0} posts</span>
                            <svg class="category-card-arrow" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                            </svg>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.getAttribute('data-slug');
                this.navigateToCategory(slug);
            });
        });
    }

    renderPostCard(post) {
        const imageUrl = this.convertWixImageUrl(post.featuredImage);
        const authorImageUrl = this.convertWixImageUrl(post.authorImage);
        const displayTitle = post.blogTitle || post.title || 'Untitled';

        return `
            <article class="post-card" data-slug="${post.slug}">
                <img 
                    src="${imageUrl}" 
                    alt="${this.escapeHtml(displayTitle)}"
                    class="post-image"
                    loading="lazy"
                    onerror="this.src='https://via.placeholder.com/400x220/1a1a1a/64FFDA?text=No+Image'"
                />
                <div class="post-content">
                    ${post.category ? `<span class="post-category-badge">${this.escapeHtml(post.category)}</span>` : ''}
                    <h3 class="post-title">${this.escapeHtml(displayTitle)}</h3>
                    <p class="post-excerpt">${this.escapeHtml(post.excerpt || '')}</p>
                    <div class="post-meta">
                        <div class="post-author">
                            <img 
                                src="${authorImageUrl}" 
                                alt="${this.escapeHtml(post.author || 'Author')}"
                                class="post-author-avatar"
                                onerror="this.src='https://via.placeholder.com/28'"
                            />
                            <span>${this.escapeHtml(post.author || 'Anonymous')}</span>
                        </div>
                        <div class="post-date">
                            <span>📅 ${this.formatDate(post.publishedDate)}</span>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    renderPagination() {
        const paginationEl = this.querySelector('#pagination');
        if (!paginationEl) {
            console.log('pagination element not found');
            return;
        }

        const totalPages = Math.ceil(this.state.totalPosts / this.state.postsPerPage);
        
        console.log('Rendering pagination - Total posts:', this.state.totalPosts, 'Posts per page:', this.state.postsPerPage, 'Total pages:', totalPages, 'Current page:', this.state.currentPage);
        
        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        const currentPage = this.state.currentPage;
        const pages = [];

        pages.push(1);

        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (!pages.includes(i)) pages.push(i);
        }

        if (!pages.includes(totalPages)) pages.push(totalPages);

        paginationEl.innerHTML = `
            <div class="pagination">
                <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                    Previous
                </button>
                
                ${pages.map((page, index) => {
                    const prevPage = pages[index - 1];
                    const gap = prevPage && page - prevPage > 1 ? '<span class="pagination-info">...</span>' : '';
                    
                    return `
                        ${gap}
                        <button class="pagination-btn ${page === currentPage ? 'active' : ''}" data-page="${page}">
                            ${page}
                        </button>
                    `;
                }).join('')}
                
                <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                    Next
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                </button>
            </div>
        `;

        paginationEl.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.getAttribute('data-page'));
                this.changePage(page);
            });
        });
    }

    changePage(page) {
        this.state.currentPage = page;
        this.emitEvent('page-change', { page });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    getEmptyState(message) {
        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <h3>${message}</h3>
                <p>Try exploring other categories</p>
            </div>
        `;
    }

    navigateToCategory(slug) {
        this.emitEvent('navigate-to-category', { slug });
    }

    navigateToPost(slug) {
        this.emitEvent('navigate-to-post', { slug });
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

    emitEvent(name, detail) {
        this.dispatchEvent(new CustomEvent(name, {
            detail,
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('category-browser', CategoryBrowser);
