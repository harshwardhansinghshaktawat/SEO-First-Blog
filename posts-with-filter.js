// CUSTOM ELEMENT - Blog Posts Widget
class BlogPostsWidget extends HTMLElement {
    constructor() {
        super();
        this.state = {
            posts: [],
            currentPage: 1,
            postsPerPage: 9,
            totalPosts: 0
        };
        
        const initialStyleProps = this.getAttribute('style-props');
        this.styleProps = initialStyleProps ? JSON.parse(initialStyleProps) : this.getDefaultStyleProps();
    }

    static get observedAttributes() {
        return ['posts-data', 'style-props'];
    }

    getDefaultStyleProps() {
        return {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            bgColor: '#ffffff',
            cardBg: '#ffffff',
            cardBorder: '#f3f4f6',
            cardShadow: 'rgba(0,0,0,0.07)',
            cardHoverShadow: 'rgba(0,0,0,0.12)',
            cardTitleColor: '#1a1a1a',
            cardExcerptColor: '#6b7280',
            categoryBg: '#ede9fe',
            categoryText: '#6366f1',
            featuredBg: '#fbbf24',
            featuredText: '#78350f',
            metaColor: '#9ca3af',
            authorNameColor: '#1a1a1a',
            dateColor: '#9ca3af',
            btnBg: '#6366f1',
            btnText: '#ffffff',
            btnHoverBg: '#4f46e5',
            emptyIconColor: 'rgba(0,0,0,0.5)',
            emptyTitleColor: '#1a1a1a',
            emptyTextColor: '#6b7280'
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        try {
            if (name === 'posts-data') {
                const data = JSON.parse(newValue);
                console.log('Custom Element - Received posts-data:', data);
                
                this.state.posts = data.posts || [];
                this.state.totalPosts = data.total || 0;
                this.state.currentPage = data.currentPage || 1;
                this.state.postsPerPage = data.postsPerPage || 9;
                
                console.log('Custom Element - State updated:', this.state);
                
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
            <div class="blog-posts-widget">
                <div id="content"></div>
                <div id="pagination"></div>
            </div>
        `;
        
        this.initialRenderDone = true;
        this.render();
    }

    getStyles() {
        const {
            fontFamily, bgColor, cardBg, cardBorder, cardShadow, cardHoverShadow,
            cardTitleColor, cardExcerptColor, categoryBg, categoryText,
            featuredBg, featuredText, metaColor, authorNameColor, dateColor,
            btnBg, btnText, btnHoverBg,
            emptyIconColor, emptyTitleColor, emptyTextColor
        } = this.styleProps;

        return `
            blog-posts-widget {
                display: block;
                width: 100%;
                font-family: ${fontFamily};
                background: ${bgColor};
                padding: 40px 20px;
            }

            .blog-posts-widget {
                max-width: 1400px;
                margin: 0 auto;
            }

            /* Posts Grid */
            .posts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 32px;
                margin-bottom: 60px;
            }

            .post-card {
                background: ${cardBg};
                border: 1px solid ${cardBorder};
                border-radius: 12px;
                overflow: hidden;
                transition: all 0.3s ease;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                box-shadow: 0 4px 6px ${cardShadow};
            }

            .post-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 12px 24px ${cardHoverShadow};
            }

            .post-image {
                width: 100%;
                height: 220px;
                object-fit: cover;
                background: #f3f4f6;
            }

            .post-content {
                padding: 24px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .post-badges {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
                flex-wrap: wrap;
            }

            .post-category-badge {
                display: inline-block;
                background: ${categoryBg};
                color: ${categoryText};
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }

            .post-featured-badge {
                display: inline-block;
                background: ${featuredBg};
                color: ${featuredText};
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }

            .post-title {
                font-size: 24px;
                font-weight: 700;
                color: ${cardTitleColor};
                margin: 0 0 12px 0;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .post-excerpt {
                font-size: 15px;
                line-height: 1.6;
                color: ${cardExcerptColor};
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
                border-top: 1px solid ${cardBorder};
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
            }

            .post-author span {
                color: ${authorNameColor};
                font-weight: 500;
            }

            .post-date {
                color: ${dateColor};
            }

            .post-footer {
                padding: 16px 24px;
                border-top: 1px solid ${cardBorder};
            }

            .read-more-btn {
                width: 100%;
                padding: 10px 20px;
                background: ${btnBg};
                color: ${btnText};
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
            }

            .read-more-btn:hover {
                background: ${btnHoverBg};
                transform: translateY(-2px);
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
                background: ${cardBg};
                border: 1px solid ${cardBorder};
                border-radius: 8px;
                color: ${cardTitleColor};
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .pagination-btn:hover:not(:disabled) {
                background: ${btnBg};
                color: ${btnText};
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
                background: ${btnBg};
                color: ${btnText};
            }

            .pagination-info {
                padding: 0 16px;
                color: ${metaColor};
                font-size: 14px;
            }

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 80px 20px;
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

            @media (max-width: 768px) {
                .posts-grid {
                    grid-template-columns: 1fr;
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

        console.log('Rendering posts:', this.state.posts.length);

        if (this.state.posts.length === 0) {
            content.innerHTML = this.getEmptyState('No posts found');
        } else {
            content.innerHTML = `
                <div class="posts-grid">
                    ${this.state.posts.map(post => this.renderPostCard(post)).join('')}
                </div>
            `;
        }

        this.attachEventListeners();
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
                    onerror="this.src='https://via.placeholder.com/400x220/f3f4f6/6366f1?text=No+Image'"
                />
                <div class="post-content">
                    <div class="post-badges">
                        ${post.category ? `<span class="post-category-badge">${this.escapeHtml(post.category)}</span>` : ''}
                        ${post.isFeatured ? '<span class="post-featured-badge">⭐ Featured</span>' : ''}
                    </div>
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
                            ${this.formatDate(post.publishedDate)}
                        </div>
                    </div>
                </div>
                <div class="post-footer">
                    <button class="read-more-btn">Read More →</button>
                </div>
            </article>
        `;
    }

    attachEventListeners() {
        this.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.getAttribute('data-slug');
                this.navigateToPost(slug);
            });
        });
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
        this.emitEvent('page-change', { page });
    }

    getEmptyState(message) {
        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <h3>${message}</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
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

customElements.define('blog-posts-widget', BlogPostsWidget);
