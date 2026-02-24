// CUSTOM ELEMENT - Category Browser
class CategoryBrowser extends HTMLElement {
    constructor() {
        super();
        this.state = {
            mode: 'single', // 'single' or 'all'
            category: null,
            categories: [],
            posts: [],
            currentPage: 1,
            postsPerPage: 12,
            totalPosts: 0,
            isLoading: true
        };
    }

    static get observedAttributes() {
        return ['mode', 'category-data', 'categories-data', 'posts-data'];
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
                this.state.posts = data.posts || [];
                this.state.totalPosts = data.total || this.state.posts.length;
                this.state.currentPage = data.currentPage || 1;
                if (this.isConnected) this.renderPosts();
            }
        } catch (e) {
            console.error('Error parsing attribute:', e);
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
        
        if (!this.state.isLoading) {
            this.render();
        }
    }

    getStyles() {
        return `
            category-browser {
                display: block;
                width: 100%;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: #0f0f0f;
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
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                border: 1px solid #3d3d3d;
                border-radius: 16px;
            }

            .category-icon {
                width: 80px;
                height: 80px;
                margin: 0 auto 24px;
                background: rgba(100, 255, 218, 0.1);
                border: 2px solid #64FFDA;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .category-icon svg {
                width: 40px;
                height: 40px;
                fill: #64FFDA;
            }

            .category-title {
                font-size: clamp(36px, 5vw, 56px);
                font-weight: 900;
                color: #64FFDA;
                margin: 0 0 20px 0;
                letter-spacing: -0.5px;
            }

            .category-description {
                font-size: 18px;
                line-height: 1.7;
                color: #b0b0b0;
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
                background: #2d2d2d;
                border: 1px solid #3d3d3d;
                padding: 10px 20px;
                border-radius: 20px;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: #9ca3af;
            }

            .meta-badge svg {
                width: 18px;
                height: 18px;
                fill: #64FFDA;
            }

            /* All Categories Grid */
            .all-categories-header {
                text-align: center;
                margin-bottom: 60px;
            }

            .all-categories-header h1 {
                font-size: clamp(36px, 5vw, 48px);
                font-weight: 900;
                color: #64FFDA;
                margin: 0 0 16px 0;
            }

            .all-categories-header p {
                font-size: 18px;
                color: #b0b0b0;
                margin: 0;
            }

            .categories-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 24px;
                margin-bottom: 60px;
            }

            .category-card {
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                border: 1px solid #3d3d3d;
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
                background: linear-gradient(90deg, #64FFDA 0%, #4dd9ba 100%);
                transform: scaleX(0);
                transition: transform 0.3s ease;
            }

            .category-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 12px 24px rgba(100, 255, 218, 0.2);
                border-color: #64FFDA;
            }

            .category-card:hover::before {
                transform: scaleX(1);
            }

            .category-card-icon {
                width: 56px;
                height: 56px;
                background: rgba(100, 255, 218, 0.1);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
            }

            .category-card-icon svg {
                width: 28px;
                height: 28px;
                fill: #64FFDA;
            }

            .category-card-title {
                font-size: 24px;
                font-weight: 700;
                color: #ffffff;
                margin: 0 0 12px 0;
            }

            .category-card-description {
                font-size: 14px;
                line-height: 1.6;
                color: #9ca3af;
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
                border-top: 1px solid #3d3d3d;
            }

            .category-card-count {
                font-size: 13px;
                color: #6b7280;
            }

            .category-card-arrow {
                width: 24px;
                height: 24px;
                fill: #64FFDA;
                transition: transform 0.3s ease;
            }

            .category-card:hover .category-card-arrow {
                transform: translateX(4px);
            }

            /* Posts Grid */
            .posts-section-header {
                margin-bottom: 40px;
                padding-bottom: 16px;
                border-bottom: 2px solid #3d3d3d;
            }

            .posts-section-header h2 {
                font-size: 28px;
                font-weight: 700;
                color: #ffffff;
                margin: 0;
            }

            .posts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 32px;
                margin-bottom: 60px;
            }

            .post-card {
                background: #1a1a1a;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #2d2d2d;
                transition: all 0.3s ease;
                cursor: pointer;
                display: flex;
                flex-direction: column;
            }

            .post-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.6);
                border-color: #64FFDA;
            }

            .post-image {
                width: 100%;
                height: 220px;
                object-fit: cover;
                background: #0f0f0f;
            }

            .post-content {
                padding: 24px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .post-category-badge {
                display: inline-block;
                background: rgba(100, 255, 218, 0.1);
                color: #64FFDA;
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
                color: #ffffff;
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
                color: #9ca3af;
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
                color: #6b7280;
                padding-top: 16px;
                border-top: 1px solid #2d2d2d;
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
                border: 1px solid #64FFDA;
            }

            .post-date {
                display: flex;
                align-items: center;
                gap: 6px;
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
                background: #1a1a1a;
                border: 1px solid #3d3d3d;
                border-radius: 8px;
                color: #9ca3af;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .pagination-btn:hover:not(:disabled) {
                background: #2d2d2d;
                border-color: #64FFDA;
                color: #64FFDA;
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
                background: #64FFDA;
                border-color: #64FFDA;
                color: #000000;
            }

            .pagination-info {
                padding: 0 16px;
                color: #9ca3af;
                font-size: 14px;
            }

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 80px 20px;
                color: #6b7280;
            }

            .empty-state svg {
                width: 64px;
                height: 64px;
                fill: #3d3d3d;
                margin-bottom: 20px;
            }

            .empty-state h3 {
                font-size: 24px;
                color: #ffffff;
                margin: 0 0 12px 0;
            }

            .empty-state p {
                font-size: 16px;
                margin: 0;
            }

            /* Loading */
            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }

            .skeleton {
                background: #1a1a1a;
                background-image: linear-gradient(
                    to right,
                    #1a1a1a 0%,
                    #2d2d2d 20%,
                    #1a1a1a 40%,
                    #1a1a1a 100%
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

        this.renderPosts();
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

    renderPosts() {
        const container = this.querySelector('#postsContainer');
        if (!container) return;

        if (!this.state.posts || this.state.posts.length === 0) {
            container.innerHTML = this.getEmptyState('No posts found in this category');
            return;
        }

        container.innerHTML = `
            <div class="posts-section-header">
                <h2>Articles</h2>
            </div>
            <div class="posts-grid">
                ${this.state.posts.map(post => this.renderPostCard(post)).join('')}
            </div>
        `;

        this.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.getAttribute('data-slug');
                this.navigateToPost(slug);
            });
        });

        this.renderPagination();
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
        if (!paginationEl) return;

        const totalPages = Math.ceil(this.state.totalPosts / this.state.postsPerPage);
        
        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        const currentPage = this.state.currentPage;
        const pages = [];

        // Always show first page
        pages.push(1);

        // Show pages around current
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (!pages.includes(i)) pages.push(i);
        }

        // Always show last page
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
