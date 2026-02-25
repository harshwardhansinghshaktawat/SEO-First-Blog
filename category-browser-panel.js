// CUSTOM ELEMENT - Category Browser (REDESIGNED)
class CategoryBrowser extends HTMLElement {
    constructor() {
        super();
        this.state = {
            categories: [],
            currentCategory: null,
            posts: [],
            currentPage: 1,
            postsPerPage: 12,
            totalPosts: 0
        };
        
        const initialStyleProps = this.getAttribute('style-props');
        this.styleProps = initialStyleProps ? JSON.parse(initialStyleProps) : this.getDefaultStyleProps();
    }

    static get observedAttributes() {
        return ['display-data', 'style-props'];
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
            if (name === 'display-data') {
                const data = JSON.parse(newValue);
                console.log('Custom Element - Received display-data:', data);
                
                this.state.categories = data.categories || [];
                this.state.currentCategory = data.currentCategory || null;
                this.state.posts = data.posts || [];
                this.state.totalPosts = data.total || 0;
                this.state.currentPage = data.currentPage || 1;
                this.state.postsPerPage = data.postsPerPage || 12;
                
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
            <div class="category-browser">
                <div id="content"></div>
                <div id="pagination"></div>
            </div>
        `;
        
        this.initialRenderDone = true;
        this.render();
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

            /* Page Header */
            .page-header {
                text-align: center;
                margin-bottom: 50px;
            }

            .page-title {
                font-size: clamp(36px, 5vw, 48px);
                font-weight: 900;
                color: ${titleColor};
                margin: 0 0 16px 0;
                letter-spacing: -0.5px;
            }

            .page-subtitle {
                font-size: 18px;
                color: ${subtitleColor};
                margin: 0;
            }

            /* Category Tags Navigation */
            .categories-nav {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                justify-content: center;
                margin-bottom: 50px;
                padding: 30px 20px;
                background: linear-gradient(135deg, ${cardBg} 0%, ${cardBgGradient} 100%);
                border: 1px solid ${cardBorder};
                border-radius: 16px;
            }

            .category-tag {
                padding: 10px 20px;
                background: ${categoryBadgeBg};
                color: ${categoryBadgeText};
                border: 2px solid transparent;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .category-tag:hover {
                background: ${iconBg};
                border-color: ${iconBorder};
                transform: translateY(-2px);
                box-shadow: 0 4px 12px ${iconBg};
            }

            .category-tag.active {
                background: ${accentColor};
                color: #000000;
                border-color: ${accentColor};
                font-weight: 700;
            }

            .category-tag.all-posts {
                background: ${iconBg};
                border-color: ${iconBorder};
            }

            .category-tag.all-posts.active {
                background: ${accentColor};
                color: #000000;
            }

            /* Posts Grid */
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

            @media (max-width: 768px) {
                .category-browser {
                    padding: 40px 16px;
                }

                .categories-nav {
                    padding: 20px 15px;
                }

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

        console.log('Rendering - Current category:', this.state.currentCategory ? this.state.currentCategory.name : 'ALL POSTS');
        console.log('Posts to display:', this.state.posts.length);

        const pageTitle = this.state.currentCategory 
            ? (this.state.currentCategory.title || this.state.currentCategory.name)
            : 'All Blog Posts';
        
        const pageSubtitle = this.state.currentCategory 
            ? (this.state.currentCategory.description || `Explore articles in ${this.state.currentCategory.name}`)
            : 'Discover insights, tutorials, and stories from our blog';

        content.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">${this.escapeHtml(pageTitle)}</h1>
                <p class="page-subtitle">${this.escapeHtml(pageSubtitle)}</p>
            </div>

            ${this.renderCategoryNav()}

            ${this.state.posts.length > 0 ? this.renderPosts() : this.getEmptyState('No posts found')}
        `;

        this.attachEventListeners();
        this.renderPagination();
    }

    renderCategoryNav() {
        if (!this.state.categories || this.state.categories.length === 0) {
            return '';
        }

        const currentSlug = this.state.currentCategory ? this.state.currentCategory.slug : null;

        return `
            <div class="categories-nav">
                <div class="category-tag all-posts ${!currentSlug ? 'active' : ''}" data-slug="">
                    📚 All Posts
                </div>
                ${this.state.categories.map(cat => `
                    <div class="category-tag ${currentSlug === cat.slug ? 'active' : ''}" data-slug="${cat.slug}">
                        ${this.escapeHtml(cat.title || cat.name)}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderPosts() {
        return `
            <div class="posts-grid">
                ${this.state.posts.map(post => this.renderPostCard(post)).join('')}
            </div>
        `;
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

    attachEventListeners() {
        // Category tag clicks
        this.querySelectorAll('.category-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const slug = tag.getAttribute('data-slug');
                this.navigateToCategory(slug);
            });
        });

        // Post card clicks
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
        
        console.log('Rendering pagination - Total:', this.state.totalPosts, 'Per page:', this.state.postsPerPage, 'Pages:', totalPages);
        
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    getEmptyState(message) {
        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <h3>${message}</h3>
                <p>Try browsing other categories</p>
            </div>
        `;
    }

    navigateToCategory(slug) {
        const url = slug ? `/blog-category/${slug}` : '/blog-category';
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
