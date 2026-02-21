class BlogListViewer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._posts = [];
        this._currentPage = 1;
        this._totalPages = 1;
        this._postsPerPage = 9;
        this._selectedCategory = '';
        this._searchQuery = '';
        
        // Parse initial style props
        const initialStyleProps = this.getAttribute('style-props');
        this.styleProps = initialStyleProps ? JSON.parse(initialStyleProps) : this.getDefaultStyleProps();
        
        this._initializeUI();
    }

    static get observedAttributes() {
        return ['blog-data', 'current-page', 'total-pages', 'style-props'];
    }

    getDefaultStyleProps() {
        return {
            // Typography
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            
            // Colors
            bgColor: '#ffffff',
            titleColor: '#1a1a1a',
            subtitleColor: '#666666',
            
            // Card
            cardBg: '#ffffff',
            cardBorder: '#f3f4f6',
            cardShadow: 'rgba(0,0,0,0.07)',
            cardHoverShadow: 'rgba(0,0,0,0.12)',
            
            // Card Content
            cardTitleColor: '#1a1a1a',
            cardExcerptColor: '#6b7280',
            
            // Category Badge
            categoryBg: '#ede9fe',
            categoryText: '#6366f1',
            
            // Featured Badge
            featuredBg: '#fbbf24',
            featuredText: '#78350f',
            
            // Meta
            metaColor: '#9ca3af',
            authorNameColor: '#1a1a1a',
            dateColor: '#9ca3af',
            
            // Button
            btnBg: '#6366f1',
            btnText: '#ffffff',
            btnHoverBg: '#4f46e5',
            
            // Filters
            filterBorder: '#e5e7eb',
            filterFocusBorder: '#6366f1',
            filterBg: '#ffffff',
            
            // Pagination
            paginationBorder: '#e5e7eb',
            paginationText: '#374151',
            paginationActiveBg: '#6366f1',
            paginationActiveText: '#ffffff',
            paginationHoverBg: '#f5f3ff',
            paginationHoverBorder: '#6366f1',
            
            // Empty State
            emptyIconColor: 'rgba(0,0,0,0.5)',
            emptyTitleColor: '#1a1a1a',
            emptyTextColor: '#6b7280'
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        if (name === 'blog-data') {
            try {
                const data = JSON.parse(newValue);
                this._posts = data.posts || [];
                this._totalPages = data.totalPages || 1;
                this._currentPage = data.currentPage || 1;
                requestAnimationFrame(() => this._renderPosts());
            } catch (e) {
                console.error('Error parsing blog data:', e);
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

            <div class="blog-container">
                <div class="blog-header">
                    <h1 class="blog-title">Latest Articles</h1>
                    <p class="blog-subtitle">Discover insights, tutorials, and stories from our blog</p>
                </div>

                <div class="filters-section">
                    <div class="search-box">
                        <span class="search-icon">🔍</span>
                        <input 
                            type="text" 
                            class="search-input" 
                            placeholder="Search articles..."
                            id="searchInput"
                        />
                    </div>
                    <select class="category-filter" id="categoryFilter">
                        <option value="">All Categories</option>
                    </select>
                </div>

                <div class="loading-state" id="loadingState">
                    <div class="spinner"></div>
                    <p>Loading articles...</p>
                </div>

                <div id="blogGrid" class="blog-grid"></div>

                <div class="pagination" id="pagination"></div>
            </div>
        `;

        this._setupEventListeners();
        this.initialRenderDone = true;
    }

    getStyles() {
        const {
            fontFamily, bgColor, titleColor, subtitleColor,
            cardBg, cardBorder, cardShadow, cardHoverShadow,
            cardTitleColor, cardExcerptColor,
            categoryBg, categoryText,
            featuredBg, featuredText,
            metaColor, authorNameColor, dateColor,
            btnBg, btnText, btnHoverBg,
            filterBorder, filterFocusBorder, filterBg,
            paginationBorder, paginationText, paginationActiveBg, paginationActiveText,
            paginationHoverBg, paginationHoverBorder,
            emptyIconColor, emptyTitleColor, emptyTextColor
        } = this.styleProps;

        return `
            * { box-sizing: border-box; margin: 0; padding: 0; }
            
            :host {
                display: block;
                width: 100%;
                font-family: ${fontFamily};
            }

            .blog-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 60px 20px;
                background-color: ${bgColor};
            }

            .blog-header {
                text-align: center;
                margin-bottom: 60px;
            }

            .blog-title {
                font-size: clamp(36px, 5vw, 56px);
                font-weight: 800;
                color: ${titleColor};
                margin-bottom: 16px;
                letter-spacing: -0.02em;
            }

            .blog-subtitle {
                font-size: 18px;
                color: ${subtitleColor};
                max-width: 600px;
                margin: 0 auto;
            }

            /* Filters Section */
            .filters-section {
                display: flex;
                gap: 16px;
                margin-bottom: 40px;
                flex-wrap: wrap;
                justify-content: center;
            }

            .search-box {
                flex: 1;
                max-width: 400px;
                position: relative;
            }

            .search-input {
                width: 100%;
                padding: 14px 20px 14px 48px;
                border: 2px solid ${filterBorder};
                border-radius: 12px;
                font-size: 16px;
                background: ${filterBg};
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            .search-input:focus {
                outline: none;
                border-color: ${filterFocusBorder};
                box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
            }

            .search-icon {
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                color: ${metaColor};
            }

            .category-filter {
                padding: 14px 24px;
                border: 2px solid ${filterBorder};
                border-radius: 12px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                background: ${filterBg};
                transition: border-color 0.2s, background-color 0.2s;
            }

            .category-filter:hover {
                border-color: ${filterFocusBorder};
                background: ${paginationHoverBg};
            }

            /* Blog Grid */
            .blog-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                gap: 32px;
                margin-bottom: 60px;
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

            .featured-badge {
                position: absolute;
                top: 16px;
                right: 16px;
                background: ${featuredBg};
                color: ${featuredText};
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
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
                border: 2px solid ${filterBorder};
            }

            .author-details {
                display: flex;
                flex-direction: column;
            }

            .author-name {
                font-size: 14px;
                font-weight: 600;
                color: ${authorNameColor};
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
                text-decoration: none;
                display: inline-block;
            }

            .read-more-btn:hover {
                background: ${btnHoverBg};
            }

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 80px 20px;
            }

            .empty-icon {
                font-size: 64px;
                margin-bottom: 20px;
                opacity: 0.5;
                color: ${emptyIconColor};
            }

            .empty-title {
                font-size: 24px;
                font-weight: 700;
                color: ${emptyTitleColor};
                margin-bottom: 12px;
            }

            .empty-text {
                font-size: 16px;
                color: ${emptyTextColor};
            }

            /* Pagination */
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
                background: ${filterBg};
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
                color: ${filterFocusBorder};
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

            /* Loading State */
            .loading-state {
                display: none;
                text-align: center;
                padding: 80px 20px;
            }

            .loading-state.active {
                display: block;
            }

            .spinner {
                width: 48px;
                height: 48px;
                border: 4px solid ${cardBorder};
                border-top-color: ${filterFocusBorder};
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin: 0 auto 20px;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* Responsive */
            @media (max-width: 768px) {
                .blog-container {
                    padding: 40px 16px;
                }

                .blog-grid {
                    grid-template-columns: 1fr;
                    gap: 24px;
                }

                .filters-section {
                    flex-direction: column;
                }

                .search-box {
                    max-width: 100%;
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

    _setupEventListeners() {
        const searchInput = this.shadowRoot.getElementById('searchInput');
        const categoryFilter = this.shadowRoot.getElementById('categoryFilter');

        searchInput.addEventListener('input', (e) => {
            this._searchQuery = e.target.value;
            this._dispatchFilterEvent();
        });

        categoryFilter.addEventListener('change', (e) => {
            this._selectedCategory = e.target.value;
            this._dispatchFilterEvent();
        });
    }

    _dispatchFilterEvent() {
        this.dispatchEvent(new CustomEvent('filter-change', {
            detail: {
                search: this._searchQuery,
                category: this._selectedCategory,
                page: 1
            },
            bubbles: true,
            composed: true
        }));
    }

    _convertWixImageUrl(wixUrl) {
        if (!wixUrl || typeof wixUrl !== 'string') {
            return 'https://via.placeholder.com/400x240?text=No+Image';
        }

        if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
            return wixUrl;
        }

        if (wixUrl.startsWith('wix:image://')) {
            try {
                const parts = wixUrl.split('/');
                const fileId = parts[3]?.split('#')[0];
                
                if (fileId) {
                    return `https://static.wixstatic.com/media/${fileId}`;
                }
            } catch (e) {
                console.error('Error parsing Wix image URL:', wixUrl, e);
            }
        }

        return 'https://via.placeholder.com/400x240?text=No+Image';
    }

    _renderPosts() {
        const grid = this.shadowRoot.getElementById('blogGrid');
        const loading = this.shadowRoot.getElementById('loadingState');
        
        loading.classList.remove('active');

        if (!this._posts || this._posts.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3 class="empty-title">No articles found</h3>
                    <p class="empty-text">Try adjusting your search or filters</p>
                </div>
            `;
            this._renderPagination();
            return;
        }

        grid.innerHTML = this._posts.map(post => {
            const featuredImageUrl = this._convertWixImageUrl(post.featuredImage);
            const authorImageUrl = this._convertWixImageUrl(post.authorImage);
            
            return `
                <article class="blog-card">
                    <div class="card-image-wrapper">
                        <img 
                            src="${featuredImageUrl}" 
                            alt="${this._escapeHtml(post.title)}"
                            class="card-image"
                            loading="lazy"
                            onerror="this.src='https://via.placeholder.com/400x240?text=No+Image'"
                        />
                        ${post.isFeatured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
                    </div>
                    <div class="card-content">
                        <div class="card-meta">
                            <span class="category-badge">${this._escapeHtml(post.category || 'Uncategorized')}</span>
                            <span class="read-time">⏱️ ${post.readTime || '5 min'}</span>
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
                                Read More →
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        // Add click handlers to read more buttons
        this.shadowRoot.querySelectorAll('.read-more-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const slug = e.target.getAttribute('data-slug');
                this._navigateToPost(slug);
            });
        });

        this._renderPagination();
    }

    _renderPagination() {
        const pagination = this.shadowRoot.getElementById('pagination');
        
        if (this._totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <button class="page-btn" id="prevBtn" ${this._currentPage === 1 ? 'disabled' : ''}>
                ← Previous
            </button>
        `;

        // Page numbers
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

        // Add click handlers
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

    showLoading() {
        const loading = this.shadowRoot.getElementById('loadingState');
        loading.classList.add('active');
        this.shadowRoot.getElementById('blogGrid').innerHTML = '';
    }
}

customElements.define('blog-list-viewer', BlogListViewer);
