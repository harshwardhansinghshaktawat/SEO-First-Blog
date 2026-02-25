// CUSTOM ELEMENT - Tag Browser (FIXED Pagination)
class TagBrowser extends HTMLElement {
    constructor() {
        super();
        this.state = {
            tags: [],
            currentTag: null,
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
                
                this.state.tags = data.tags || [];
                this.state.currentTag = data.currentTag || null;
                this.state.posts = data.posts || [];
                this.state.totalPosts = data.total || 0;
                this.state.currentPage = data.currentPage || 1;
                this.state.postsPerPage = data.postsPerPage || 12; // CRITICAL: Must update postsPerPage
                
                console.log('Custom Element - State updated:', {
                    postsCount: this.state.posts.length,
                    totalPosts: this.state.totalPosts,
                    currentPage: this.state.currentPage,
                    postsPerPage: this.state.postsPerPage,
                    totalPages: Math.ceil(this.state.totalPosts / this.state.postsPerPage)
                });
                
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
            <div class="tag-browser">
                <div class="content-wrapper">
                    <aside class="sidebar" id="sidebar"></aside>
                    <main class="main-content">
                        <div id="content"></div>
                        <div id="pagination"></div>
                    </main>
                </div>
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
            tag-browser {
                display: block;
                width: 100%;
                font-family: ${fontFamily};
                background: ${bgColor};
                color: #ffffff;
                min-height: 100vh;
            }

            .tag-browser {
                max-width: 1600px;
                margin: 0 auto;
                padding: 60px 20px;
            }

            .content-wrapper {
                display: grid;
                grid-template-columns: 300px 1fr;
                gap: 40px;
            }

            /* Sidebar */
            .sidebar {
                position: sticky;
                top: 80px;
                height: fit-content;
                max-height: calc(100vh - 120px);
                overflow-y: auto;
                padding: 30px;
                background: linear-gradient(135deg, ${cardBg} 0%, ${cardBgGradient} 100%);
                border: 1px solid ${cardBorder};
                border-radius: 16px;
            }

            .sidebar::-webkit-scrollbar {
                width: 6px;
            }

            .sidebar::-webkit-scrollbar-track {
                background: ${cardBg};
                border-radius: 3px;
            }

            .sidebar::-webkit-scrollbar-thumb {
                background: ${iconColor};
                border-radius: 3px;
            }

            .sidebar-title {
                font-size: 20px;
                font-weight: 700;
                color: ${titleColor};
                margin: 0 0 20px 0;
                padding-bottom: 15px;
                border-bottom: 2px solid ${cardBorder};
            }

            .tag-cloud {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }

            .tag-pill {
                padding: 8px 16px;
                background: ${categoryBadgeBg};
                color: ${categoryBadgeText};
                border: 2px solid transparent;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
            }

            .tag-pill:hover {
                background: ${iconBg};
                border-color: ${iconBorder};
                transform: translateY(-2px);
            }

            .tag-pill.active {
                background: ${accentColor};
                color: #000000;
                border-color: ${accentColor};
                font-weight: 700;
            }

            .tag-pill.all-tags {
                background: ${iconBg};
                border-color: ${iconBorder};
            }

            .tag-pill.all-tags.active {
                background: ${accentColor};
                color: #000000;
            }

            /* Main Content */
            .main-content {
                min-width: 0;
            }

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

            @media (max-width: 1200px) {
                .content-wrapper {
                    grid-template-columns: 250px 1fr;
                    gap: 30px;
                }
            }

            @media (max-width: 968px) {
                .tag-browser {
                    padding: 40px 16px;
                }

                .content-wrapper {
                    grid-template-columns: 1fr;
                }

                .sidebar {
                    position: relative;
                    top: 0;
                    max-height: none;
                    margin-bottom: 30px;
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
        const sidebar = this.querySelector('#sidebar');
        if (!content || !sidebar) return;

        console.log('Rendering - Current tag:', this.state.currentTag ? this.state.currentTag.name : 'ALL POSTS');
        console.log('Posts to display:', this.state.posts.length);
        console.log('Total posts:', this.state.totalPosts);
        console.log('Posts per page:', this.state.postsPerPage);

        // Render sidebar
        sidebar.innerHTML = this.renderSidebar();

        // Render main content
        const pageTitle = this.state.currentTag 
            ? `#${this.state.currentTag.name}`
            : 'All Blog Posts';
        
        const pageSubtitle = this.state.currentTag 
            ? (this.state.currentTag.description || `Explore articles tagged with ${this.state.currentTag.name}`)
            : 'Browse all posts by tags';

        content.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">${this.escapeHtml(pageTitle)}</h1>
                <p class="page-subtitle">${this.escapeHtml(pageSubtitle)}</p>
            </div>

            ${this.state.posts.length > 0 ? this.renderPosts() : this.getEmptyState('No posts found')}
        `;

        this.attachEventListeners();
        
        // CRITICAL: Always call renderPagination after rendering content
        this.renderPagination();
    }

    renderSidebar() {
        if (!this.state.tags || this.state.tags.length === 0) {
            return '<p style="color: #6b7280; font-size: 14px;">No tags available</p>';
        }

        const currentSlug = this.state.currentTag ? this.state.currentTag.slug : null;

        return `
            <h3 class="sidebar-title">🏷️ Browse Tags</h3>
            <div class="tag-cloud">
                <div class="tag-pill all-tags ${!currentSlug ? 'active' : ''}" data-slug="">
                    All Posts
                </div>
                ${this.state.tags.map(tag => `
                    <div class="tag-pill ${currentSlug === tag.slug ? 'active' : ''}" data-slug="${tag.slug}">
                        #${this.escapeHtml(tag.name)}
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
        // Tag pill clicks
        this.querySelectorAll('.tag-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const slug = pill.getAttribute('data-slug');
                this.navigateToTag(slug);
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
        if (!paginationEl) {
            console.log('Pagination element not found in DOM');
            return;
        }

        const totalPages = Math.ceil(this.state.totalPosts / this.state.postsPerPage);
        
        console.log('renderPagination called - Total posts:', this.state.totalPosts, 'Posts per page:', this.state.postsPerPage, 'Total pages:', totalPages, 'Current page:', this.state.currentPage);
        
        if (totalPages <= 1) {
            console.log('Only 1 page or less, hiding pagination');
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

        console.log('Rendering pagination with pages:', pages);

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

        // Attach click handlers
        paginationEl.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.getAttribute('data-page'));
                console.log('Pagination button clicked, page:', page);
                this.changePage(page);
            });
        });

        console.log('Pagination rendered successfully');
    }

    changePage(page) {
        console.log('changePage called with page:', page);
        this.emitEvent('page-change', { page });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    getEmptyState(message) {
        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
                </svg>
                <h3>${message}</h3>
                <p>Try browsing other tags</p>
            </div>
        `;
    }

    navigateToTag(slug) {
        const url = slug ? `/blog-tag/${slug}` : '/blog-tag';
        this.emitEvent('navigate-to-tag', { slug });
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

customElements.define('tag-browser', TagBrowser);
