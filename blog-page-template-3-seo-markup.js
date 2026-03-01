// CUSTOM ELEMENT - Advanced Blog Hub
class AdvancedBlogHub extends HTMLElement {
    constructor() {
        super();
        this.state = {
            categories: [],
            tags: [],
            posts: [],
            currentPage: 1,
            postsPerPage: 12,
            totalPosts: 0,
            filter: { type: 'all', value: null, searchTerm: '' }
        };
        
        this.settings = {
            heroTitle: 'Discover Our Blog',
            heroSubtitle: 'Explore articles, tutorials, and insights',
            searchPlaceholder: 'Search articles...',
            categoriesTitle: 'Browse by Category',
            tagsTitle: 'Popular Tags',
            postsTitle: 'Latest Articles'
        };
        
        const initialStyleProps = this.getAttribute('style-props');
        this.styleProps = initialStyleProps ? JSON.parse(initialStyleProps) : this.getDefaultStyleProps();
    }

    static get observedAttributes() {
        return ['blog-data', 'settings', 'style-props'];
    }

    getDefaultStyleProps() {
        return {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            bgColor: '#0f0f0f',
            primaryColor: '#64FFDA',
            primaryHover: '#4dd9ba',
            heroGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            heroTitleColor: '#ffffff',
            heroSubtitleColor: '#e0e0e0',
            searchBg: '#1a1a1a',
            searchBorder: '#3d3d3d',
            searchBorderFocus: '#64FFDA',
            searchText: '#ffffff',
            searchPlaceholder: '#9ca3af',
            searchIconColor: '#64FFDA',
            categoriesBg: '#1a1a1a',
            categoriesBorder: '#2d2d2d',
            categoryTagBg: 'rgba(100, 255, 218, 0.1)',
            categoryTagText: '#64FFDA',
            categoryTagActiveBg: '#64FFDA',
            categoryTagActiveText: '#000000',
            sidebarBg: '#1a1a1a',
            sidebarBorder: '#2d2d2d',
            sidebarTitleColor: '#64FFDA',
            tagPillBg: 'rgba(100, 255, 218, 0.1)',
            tagPillText: '#64FFDA',
            tagPillHoverBg: '#64FFDA',
            tagPillHoverText: '#000000',
            postCardBg: '#1a1a1a',
            postCardBorder: '#2d2d2d',
            postCardBorderHover: '#64FFDA',
            postTitleColor: '#ffffff',
            postExcerptColor: '#9ca3af',
            postMetaColor: '#6b7280',
            postAuthorColor: '#ffffff',
            postDateColor: '#9ca3af',
            paginationBg: '#1a1a1a',
            paginationBorder: '#3d3d3d',
            paginationText: '#9ca3af',
            paginationActiveBg: '#64FFDA',
            paginationActiveText: '#000000',
            sectionTitleColor: '#64FFDA',
            sectionBorder: '#2d2d2d'
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        try {
            if (name === 'blog-data') {
                const data = JSON.parse(newValue);
                this.state.categories = data.categories || [];
                this.state.tags = data.tags || [];
                this.state.posts = data.posts || [];
                this.state.totalPosts = data.total || 0;
                this.state.currentPage = data.currentPage || 1;
                this.state.postsPerPage = data.postsPerPage || 12;
                this.state.filter = data.filter || { type: 'all', value: null, searchTerm: '' };
                
                if (this.isConnected) this.render();
                
            } else if (name === 'settings') {
                this.settings = { ...this.settings, ...JSON.parse(newValue) };
                if (this.initialRenderDone) this.render();
                
            } else if (name === 'style-props') {
                this.styleProps = { ...this.styleProps, ...JSON.parse(newValue) };
                if (this.initialRenderDone) this.updateStyles();
            }
        } catch (e) {
            console.error('Error in attributeChangedCallback:', name, e);
        }
    }

    connectedCallback() {
        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="blog-hub">
                <div id="hero"></div>
                <div id="categories"></div>
                <div class="hub-container">
                    <aside class="sidebar" id="sidebar"></aside>
                    <main class="main-content">
                        <div id="posts-section"></div>
                        <div id="pagination"></div>
                    </main>
                </div>
            </div>
        `;
        
        this.initialRenderDone = true;
        this.render();
    }

    getStyles() {
        const s = this.styleProps;
        return `
            advanced-blog-hub {
                display: block;
                width: 100%;
                font-family: ${s.fontFamily};
                background: ${s.bgColor};
                color: #ffffff;
                min-height: 100vh;
            }

            .blog-hub {
                width: 100%;
            }

            /* Hero Section */
            .hero-section {
                background: ${s.heroGradient};
                padding: 80px 20px;
                text-align: center;
            }

            .hero-content {
                max-width: 800px;
                margin: 0 auto;
            }

            .hero-title {
                font-size: clamp(36px, 6vw, 56px);
                font-weight: 900;
                color: ${s.heroTitleColor};
                margin: 0 0 16px 0;
                letter-spacing: -1px;
            }

            .hero-subtitle {
                font-size: 20px;
                color: ${s.heroSubtitleColor};
                margin: 0 0 40px 0;
            }

            .search-container {
                position: relative;
                max-width: 600px;
                margin: 0 auto;
            }

            .search-icon {
                position: absolute;
                left: 20px;
                top: 50%;
                transform: translateY(-50%);
                width: 20px;
                height: 20px;
                fill: ${s.searchIconColor};
                pointer-events: none;
            }

            .search-input {
                width: 100%;
                padding: 18px 20px 18px 55px;
                background: ${s.searchBg};
                border: 2px solid ${s.searchBorder};
                border-radius: 50px;
                color: ${s.searchText};
                font-size: 16px;
                font-family: inherit;
                transition: all 0.3s ease;
                box-sizing: border-box;
            }

            .search-input::placeholder {
                color: ${s.searchPlaceholder};
            }

            .search-input:focus {
                outline: none;
                border-color: ${s.searchBorderFocus};
                box-shadow: 0 0 0 4px rgba(100, 255, 218, 0.1);
            }

            /* Categories Bar */
            .categories-bar {
                background: ${s.categoriesBg};
                border-top: 1px solid ${s.categoriesBorder};
                border-bottom: 1px solid ${s.categoriesBorder};
                padding: 20px;
                overflow-x: auto;
            }

            .categories-bar::-webkit-scrollbar {
                height: 6px;
            }

            .categories-bar::-webkit-scrollbar-track {
                background: ${s.searchBg};
            }

            .categories-bar::-webkit-scrollbar-thumb {
                background: ${s.primaryColor};
                border-radius: 3px;
            }

            .categories-wrapper {
                max-width: 1600px;
                margin: 0 auto;
                display: flex;
                gap: 12px;
                flex-wrap: nowrap;
            }

            .category-tag {
                padding: 10px 24px;
                background: ${s.categoryTagBg};
                color: ${s.categoryTagText};
                border: 2px solid transparent;
                border-radius: 25px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
                flex-shrink: 0;
            }

            .category-tag:hover {
                background: ${s.categoryTagActiveBg};
                color: ${s.categoryTagActiveText};
                transform: translateY(-2px);
            }

            .category-tag.active {
                background: ${s.categoryTagActiveBg};
                color: ${s.categoryTagActiveText};
                border-color: ${s.categoryTagActiveBg};
            }

            /* Hub Container */
            .hub-container {
                max-width: 1600px;
                margin: 0 auto;
                padding: 60px 20px;
                display: grid;
                grid-template-columns: 280px 1fr;
                gap: 40px;
            }

            /* Sidebar */
            .sidebar {
                position: sticky;
                top: 20px;
                height: fit-content;
                max-height: calc(100vh - 100px);
                overflow-y: auto;
                background: ${s.sidebarBg};
                border: 1px solid ${s.sidebarBorder};
                border-radius: 16px;
                padding: 24px;
            }

            .sidebar::-webkit-scrollbar {
                width: 6px;
            }

            .sidebar::-webkit-scrollbar-track {
                background: ${s.postCardBg};
                border-radius: 3px;
            }

            .sidebar::-webkit-scrollbar-thumb {
                background: ${s.primaryColor};
                border-radius: 3px;
            }

            .sidebar-title {
                font-size: 18px;
                font-weight: 700;
                color: ${s.sidebarTitleColor};
                margin: 0 0 20px 0;
                padding-bottom: 12px;
                border-bottom: 2px solid ${s.sectionBorder};
            }

            .tag-cloud {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .tag-pill {
                padding: 6px 14px;
                background: ${s.tagPillBg};
                color: ${s.tagPillText};
                border-radius: 16px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 1px solid transparent;
            }

            .tag-pill:hover {
                background: ${s.tagPillHoverBg};
                color: ${s.tagPillHoverText};
                transform: scale(1.05);
            }

            /* Main Content */
            .main-content {
                min-width: 0;
            }

            .section-header {
                margin-bottom: 40px;
            }

            .section-title {
                font-size: 28px;
                font-weight: 700;
                color: ${s.sectionTitleColor};
                margin: 0;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .section-title::before {
                content: '';
                width: 4px;
                height: 32px;
                background: ${s.primaryColor};
                border-radius: 2px;
            }

            .filter-info {
                margin-top: 12px;
                color: ${s.postMetaColor};
                font-size: 14px;
            }

            /* Posts Grid */
            .posts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                gap: 32px;
                margin-bottom: 60px;
            }

            .post-card {
                background: ${s.postCardBg};
                border: 1px solid ${s.postCardBorder};
                border-radius: 16px;
                overflow: hidden;
                transition: all 0.3s ease;
                cursor: pointer;
                display: flex;
                flex-direction: column;
            }

            .post-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 16px 32px rgba(0,0,0,0.6);
                border-color: ${s.postCardBorderHover};
            }

            .post-image {
                width: 100%;
                height: 240px;
                object-fit: cover;
                background: ${s.bgColor};
            }

            .post-content {
                padding: 24px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .post-title {
                font-size: 22px;
                font-weight: 700;
                color: ${s.postTitleColor};
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
                color: ${s.postExcerptColor};
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
                color: ${s.postMetaColor};
                padding-top: 16px;
                border-top: 1px solid ${s.postCardBorder};
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
                color: ${s.postAuthorColor};
                font-weight: 500;
            }

            .post-date {
                color: ${s.postDateColor};
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
                padding: 12px 18px;
                background: ${s.paginationBg};
                border: 1px solid ${s.paginationBorder};
                border-radius: 10px;
                color: ${s.paginationText};
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .pagination-btn:hover:not(:disabled) {
                background: ${s.primaryColor};
                color: #000000;
                border-color: ${s.primaryColor};
            }

            .pagination-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .pagination-btn.active {
                background: ${s.paginationActiveBg};
                border-color: ${s.paginationActiveBg};
                color: ${s.paginationActiveText};
            }

            .pagination-btn svg {
                width: 16px;
                height: 16px;
                fill: currentColor;
            }

            .pagination-info {
                padding: 0 16px;
                color: ${s.paginationText};
                font-size: 14px;
            }

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 80px 20px;
                color: ${s.postMetaColor};
            }

            .empty-state svg {
                width: 64px;
                height: 64px;
                fill: ${s.postMetaColor};
                opacity: 0.5;
                margin-bottom: 20px;
            }

            .empty-state h3 {
                font-size: 24px;
                color: ${s.postTitleColor};
                margin: 0 0 12px 0;
            }

            .empty-state p {
                font-size: 16px;
                margin: 0;
                color: ${s.postExcerptColor};
            }

            /* Responsive */
            @media (max-width: 1200px) {
                .hub-container {
                    grid-template-columns: 240px 1fr;
                    gap: 30px;
                }
            }

            @media (max-width: 968px) {
                .hub-container {
                    grid-template-columns: 1fr;
                    padding: 40px 16px;
                }

                .sidebar {
                    position: relative;
                    top: 0;
                    max-height: none;
                }

                .posts-grid {
                    grid-template-columns: 1fr;
                }

                .categories-wrapper {
                    flex-wrap: wrap;
                }

                .category-tag {
                    flex-shrink: 1;
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
        this.renderHero();
        this.renderCategories();
        this.renderSidebar();
        this.renderPosts();
        this.renderPagination();
        this.attachEventListeners();
    }

    renderHero() {
        const hero = this.querySelector('#hero');
        if (!hero) return;

        hero.innerHTML = `
            <div class="hero-section">
                <div class="hero-content">
                    <h1 class="hero-title">${this.escapeHtml(this.settings.heroTitle)}</h1>
                    <p class="hero-subtitle">${this.escapeHtml(this.settings.heroSubtitle)}</p>
                    <div class="search-container">
                        <svg class="search-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <input 
                            type="text" 
                            class="search-input" 
                            placeholder="${this.escapeHtml(this.settings.searchPlaceholder)}"
                            value="${this.escapeHtml(this.state.filter.searchTerm)}"
                        />
                    </div>
                </div>
            </div>
        `;
    }

    renderCategories() {
        const categoriesEl = this.querySelector('#categories');
        if (!categoriesEl) return;

        if (!this.state.categories || this.state.categories.length === 0) {
            categoriesEl.innerHTML = '';
            return;
        }

        const activeCategory = this.state.filter.type === 'category' ? this.state.filter.value : null;

        categoriesEl.innerHTML = `
            <div class="categories-bar">
                <div class="categories-wrapper">
                    <div class="category-tag ${!activeCategory ? 'active' : ''}" data-category-id="">
                        📚 All Posts
                    </div>
                    ${this.state.categories.map(cat => `
                        <div class="category-tag ${activeCategory === cat._id ? 'active' : ''}" data-category-id="${cat._id}">
                            ${this.escapeHtml(cat.title || cat.name)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderSidebar() {
        const sidebar = this.querySelector('#sidebar');
        if (!sidebar) return;

        sidebar.innerHTML = `
            <h3 class="sidebar-title">🏷️ ${this.escapeHtml(this.settings.tagsTitle)}</h3>
            <div class="tag-cloud">
                ${this.state.tags.map(tag => `
                    <div class="tag-pill" data-tag-id="${tag._id}">
                        #${this.escapeHtml(tag.name)}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderPosts() {
        const postsSection = this.querySelector('#posts-section');
        if (!postsSection) return;

        let filterInfo = '';
        if (this.state.filter.type === 'search') {
            filterInfo = `<p class="filter-info">Search results for "${this.escapeHtml(this.state.filter.searchTerm)}" • ${this.state.totalPosts} posts found</p>`;
        } else if (this.state.filter.type === 'category') {
            const cat = this.state.categories.find(c => c._id === this.state.filter.value);
            if (cat) {
                filterInfo = `<p class="filter-info">Category: ${this.escapeHtml(cat.title || cat.name)} • ${this.state.totalPosts} posts</p>`;
            }
        } else if (this.state.filter.type === 'tag') {
            const tag = this.state.tags.find(t => t._id === this.state.filter.value);
            if (tag) {
                filterInfo = `<p class="filter-info">Tag: #${this.escapeHtml(tag.name)} • ${this.state.totalPosts} posts</p>`;
            }
        }

        postsSection.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">${this.escapeHtml(this.settings.postsTitle)}</h2>
                ${filterInfo}
            </div>
            ${this.state.posts.length > 0 ? this.renderPostsGrid() : this.getEmptyState()}
        `;
    }

    renderPostsGrid() {
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
                    onerror="this.src='https://via.placeholder.com/400x240/1a1a1a/64FFDA?text=No+Image'"
                />
                <div class="post-content">
                    <h3 class="post-title">${this.escapeHtml(displayTitle)}</h3>
                    <p class="post-excerpt">${this.escapeHtml(post.excerpt || '')}</p>
                    <div class="post-meta">
                        <div class="post-author">
                            <img 
                                src="${authorImageUrl}" 
                                alt="${this.escapeHtml(post.author || 'Author')}"
                                class="post-author-avatar"
                                loading="lazy"
                                onerror="this.style.display='none'"
                            />
                            <span>${this.escapeHtml(post.author || 'Anonymous')}</span>
                        </div>
                        <div class="post-date">
                            ${this.formatDate(post.publishedDate)}
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    attachEventListeners() {
        // Search input
        const searchInput = this.querySelector('.search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.emitEvent('search-posts', { searchTerm: e.target.value.trim() });
                }, 500);
            });
        }

        // Category tags
        this.querySelectorAll('.category-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const categoryId = tag.getAttribute('data-category-id');
                this.emitEvent('filter-category', { categoryId });
            });
        });

        // Tag pills
        this.querySelectorAll('.tag-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const tagId = pill.getAttribute('data-tag-id');
                this.emitEvent('filter-tag', { tagId });
            });
        });

        // Post cards
        this.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.getAttribute('data-slug');
                this.emitEvent('navigate-to-post', { slug });
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    getEmptyState() {
        let message = 'No posts found';
        let suggestion = 'Try adjusting your filters or search terms';

        if (this.state.filter.type === 'search') {
            message = `No results for "${this.state.filter.searchTerm}"`;
            suggestion = 'Try different keywords or browse all posts';
        }

        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.59-13L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z"/>
                </svg>
                <h3>${message}</h3>
                <p>${suggestion}</p>
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

customElements.define('advanced-blog-hub', AdvancedBlogHub);
