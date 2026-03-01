// CUSTOM ELEMENT - Personal Blog Template
class PersonalBlogTemplate extends HTMLElement {
    constructor() {
        super();
        this.state = {
            featuredPost: null,
            recentPosts: [],
            category1: { id: null, name: '', posts: [] },
            category2: { id: null, name: '', posts: [] },
            category3: { id: null, name: '', posts: [] },
            allPosts: [],
            currentPage: 1,
            postsPerPage: 9,
            totalPosts: 0
        };
        
        this.settings = {
            heroTitle: 'Welcome to My Blog',
            heroSubtitle: 'Sharing stories, insights, and experiences',
            recentTitle: 'Recent Posts',
            category1Title: 'Featured Category',
            category2Title: 'Popular Category',
            category3Title: 'Trending Category',
            allPostsTitle: 'All Posts'
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
            bgColor: '#ffffff',
            primaryColor: '#6366f1',
            primaryHover: '#4f46e5',
            accentColor: '#f9fafb',
            heroTitleColor: '#1e293b',
            heroSubtitleColor: '#475569',
            heroBg: '#ffffff',
            heroBorder: '#e5e7eb',
            featuredBg: '#ffffff',
            featuredBorder: '#e5e7eb',
            featuredTitleColor: '#1e293b',
            featuredExcerptColor: '#475569',
            featuredOverlay: '#666666',
            cardBg: '#ffffff',
            cardBorder: '#e5e7eb',
            cardBorderHover: '#6366f1',
            cardTitleColor: '#1e293b',
            cardExcerptColor: '#475569',
            cardMetaColor: '#64748b',
            categoryBadgeBg: '#ede9fe',
            categoryBadgeText: '#6366f1',
            categoryBadgeHoverBg: '#6366f1',
            categoryBadgeHoverText: '#ffffff',
            sectionTitleColor: '#1e293b',
            sectionBorder: '#e5e7eb',
            authorColor: '#1e293b',
            dateColor: '#64748b',
            readTimeColor: '#64748b',
            paginationBg: '#ffffff',
            paginationBorder: '#e5e7eb',
            paginationText: '#475569',
            paginationActiveBg: '#6366f1',
            paginationActiveText: '#ffffff',
            paginationHoverBg: '#f9fafb',
            buttonBg: '#6366f1',
            buttonText: '#ffffff',
            buttonHoverBg: '#4f46e5',
            sidebarBg: '#f9fafb',
            sidebarBorder: '#e5e7eb',
            sidebarTextColor: '#475569'
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        try {
            if (name === 'blog-data') {
                const data = JSON.parse(newValue);
                this.state.featuredPost = data.featuredPost || null;
                this.state.recentPosts = data.recentPosts || [];
                this.state.category1 = data.category1 || { id: null, name: '', posts: [] };
                this.state.category2 = data.category2 || { id: null, name: '', posts: [] };
                this.state.category3 = data.category3 || { id: null, name: '', posts: [] };
                this.state.allPosts = data.allPosts || [];
                this.state.totalPosts = data.totalPosts || 0;
                this.state.currentPage = data.currentPage || 1;
                this.state.postsPerPage = data.postsPerPage || 9;
                
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
            <div class="blog-template">
                <div id="hero"></div>
                <div id="featured"></div>
                <div id="recent"></div>
                <div id="category1"></div>
                <div id="category2"></div>
                <div id="category3"></div>
                <div id="allposts"></div>
                <div id="pagination"></div>
            </div>
        `;
        
        this.initialRenderDone = true;
        this.render();
    }

    getStyles() {
        const s = this.styleProps;
        return `
            personal-blog-template {
                display: block;
                width: 100%;
                font-family: ${s.fontFamily};
                background: ${s.bgColor};
                color: #1e293b;
            }

            .blog-template {
                width: 100%;
            }

            /* Hero Section */
            .hero-section {
                text-align: center;
                padding: 80px 24px;
                background: ${s.heroBg};
                border-bottom: 1px solid ${s.heroBorder};
            }

            .hero-title {
                font-size: clamp(36px, 5vw, 56px);
                font-weight: 800;
                color: ${s.heroTitleColor};
                margin-bottom: 16px;
                letter-spacing: -0.02em;
            }

            .hero-subtitle {
                font-size: clamp(16px, 2.5vw, 20px);
                color: ${s.heroSubtitleColor};
                max-width: 600px;
                margin: 0 auto;
            }

            /* Featured Post */
            .featured-section {
                padding: 64px 24px;
                max-width: 1200px;
                margin: 0 auto;
            }

            .featured-post {
                position: relative;
                background: ${s.featuredBg};
                border: 1px solid ${s.featuredBorder};
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .featured-post:hover {
                transform: translateY(-4px);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                border-color: ${s.primaryColor};
            }

            .featured-image-wrapper {
                position: relative;
                width: 100%;
                height: 500px;
                overflow: hidden;
            }

            .featured-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }

            .featured-post:hover .featured-image {
                transform: scale(1.05);
            }

            .featured-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, ${s.featuredOverlay}CC, transparent);
                padding: 48px 32px 32px;
            }

            .featured-content {
                padding: 32px;
            }

            .featured-title {
                font-size: clamp(24px, 3vw, 36px);
                font-weight: 700;
                color: ${s.featuredTitleColor};
                margin-bottom: 16px;
                line-height: 1.3;
            }

            .featured-on-image .featured-title {
                color: #ffffff;
            }

            .featured-excerpt {
                font-size: 16px;
                color: ${s.featuredExcerptColor};
                line-height: 1.7;
                margin-bottom: 24px;
            }

            .featured-on-image .featured-excerpt {
                color: rgba(255, 255, 255, 0.95);
            }

            /* Section Headers */
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 32px;
                padding-bottom: 16px;
                border-bottom: 2px solid ${s.sectionBorder};
            }

            .section-title {
                font-size: clamp(24px, 3vw, 32px);
                font-weight: 700;
                color: ${s.sectionTitleColor};
            }

            .view-all-link {
                color: ${s.primaryColor};
                text-decoration: none;
                font-weight: 600;
                font-size: 14px;
                transition: color 0.2s ease;
            }

            .view-all-link:hover {
                color: ${s.primaryHover};
            }

            /* Posts Grid */
            .posts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 32px;
                padding: 32px 24px;
                max-width: 1200px;
                margin: 0 auto;
            }

            /* Post Card */
            .post-card {
                background: ${s.cardBg};
                border: 1px solid ${s.cardBorder};
                border-radius: 12px;
                overflow: hidden;
                transition: all 0.3s ease;
                cursor: pointer;
                display: flex;
                flex-direction: column;
            }

            .post-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.12);
                border-color: ${s.cardBorderHover};
            }

            .post-image {
                width: 100%;
                height: 220px;
                object-fit: cover;
                transition: transform 0.3s ease;
            }

            .post-card:hover .post-image {
                transform: scale(1.05);
            }

            .post-image-wrapper {
                overflow: hidden;
                background: ${s.accentColor};
            }

            .post-content {
                padding: 24px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .post-title {
                font-size: 20px;
                font-weight: 700;
                color: ${s.cardTitleColor};
                margin-bottom: 12px;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .post-excerpt {
                font-size: 15px;
                color: ${s.cardExcerptColor};
                line-height: 1.6;
                margin-bottom: 16px;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                flex: 1;
            }

            .post-meta {
                display: flex;
                align-items: center;
                gap: 16px;
                padding-top: 16px;
                border-top: 1px solid ${s.cardBorder};
                font-size: 13px;
                color: ${s.cardMetaColor};
            }

            .post-author {
                display: flex;
                align-items: center;
                gap: 8px;
                color: ${s.authorColor};
                font-weight: 500;
            }

            .author-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid ${s.cardBorder};
            }

            .post-date {
                color: ${s.dateColor};
            }

            .post-read-time {
                color: ${s.readTimeColor};
            }

            /* Pagination */
            .pagination-wrapper {
                padding: 48px 24px;
                max-width: 1200px;
                margin: 0 auto;
            }

            .pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }

            .page-button {
                min-width: 40px;
                height: 40px;
                padding: 0 16px;
                background: ${s.paginationBg};
                border: 1px solid ${s.paginationBorder};
                color: ${s.paginationText};
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s ease;
                font-size: 14px;
            }

            .page-button:hover:not(:disabled) {
                background: ${s.paginationHoverBg};
                border-color: ${s.primaryColor};
            }

            .page-button.active {
                background: ${s.paginationActiveBg};
                color: ${s.paginationActiveText};
                border-color: ${s.paginationActiveBg};
            }

            .page-button:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .page-ellipsis {
                padding: 0 8px;
                color: ${s.paginationText};
            }

            /* Premium Banner */
            .premium-banner {
                background: linear-gradient(135deg, ${s.primaryColor} 0%, ${s.primaryHover} 100%);
                color: white;
                padding: 24px;
                border-radius: 12px;
                text-align: center;
                margin: 32px 24px;
                max-width: 1200px;
                margin-left: auto;
                margin-right: auto;
            }

            .premium-banner h3 {
                font-size: 20px;
                margin-bottom: 8px;
            }

            .premium-banner p {
                opacity: 0.9;
                font-size: 14px;
            }

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 64px 24px;
                color: ${s.cardExcerptColor};
            }

            .empty-state-icon {
                font-size: 48px;
                margin-bottom: 16px;
                opacity: 0.3;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .hero-section {
                    padding: 48px 16px;
                }

                .featured-section {
                    padding: 32px 16px;
                }

                .featured-image-wrapper {
                    height: 300px;
                }

                .posts-grid {
                    grid-template-columns: 1fr;
                    gap: 24px;
                    padding: 24px 16px;
                }

                .section-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
                }
            }

            @media (min-width: 769px) and (max-width: 1024px) {
                .posts-grid {
                    grid-template-columns: repeat(2, 1fr);
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
        this.renderFeatured();
        this.renderRecent();
        this.renderCategory(this.state.category1, 'category1', this.settings.category1Title);
        this.renderCategory(this.state.category2, 'category2', this.settings.category2Title);
        this.renderCategory(this.state.category3, 'category3', this.settings.category3Title);
        this.renderAllPosts();
        this.renderPagination();
        this.attachEventListeners();
    }

    renderHero() {
        const hero = this.querySelector('#hero');
        if (!hero) return;

        hero.innerHTML = `
            <div class="hero-section">
                <h1 class="hero-title">${this.escapeHtml(this.settings.heroTitle)}</h1>
                <p class="hero-subtitle">${this.escapeHtml(this.settings.heroSubtitle)}</p>
            </div>
        `;
    }

    renderFeatured() {
        const featured = this.querySelector('#featured');
        if (!featured) return;

        if (!this.state.featuredPost) {
            featured.innerHTML = '';
            return;
        }

        const post = this.state.featuredPost;
        const hasImage = post.coverImage || post.featuredImage;

        featured.innerHTML = `
            <div class="featured-section">
                <div class="featured-post" data-slug="${post.slug || post._id}">
                    ${hasImage ? `
                        <div class="featured-image-wrapper">
                            <img 
                                src="${this.convertWixImageUrl(post.coverImage || post.featuredImage)}" 
                                alt="${this.escapeHtml(post.title || 'Featured Post')}"
                                class="featured-image"
                                loading="lazy"
                                onerror="this.style.display='none'"
                            />
                            <div class="featured-overlay featured-on-image">
                                <h2 class="featured-title">${this.escapeHtml(post.title || 'Untitled')}</h2>
                                <p class="featured-excerpt">${this.escapeHtml(post.excerpt || '')}</p>
                                ${this.renderPostMeta(post, true)}
                            </div>
                        </div>
                    ` : `
                        <div class="featured-content">
                            <h2 class="featured-title">${this.escapeHtml(post.title || 'Untitled')}</h2>
                            <p class="featured-excerpt">${this.escapeHtml(post.excerpt || '')}</p>
                            ${this.renderPostMeta(post, false)}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    renderRecent() {
        const recent = this.querySelector('#recent');
        if (!recent) return;

        if (!this.state.recentPosts || this.state.recentPosts.length === 0) {
            recent.innerHTML = '';
            return;
        }

        recent.innerHTML = `
            <div class="posts-grid">
                <div style="grid-column: 1 / -1;">
                    <div class="section-header">
                        <h2 class="section-title">${this.escapeHtml(this.settings.recentTitle)}</h2>
                    </div>
                </div>
                ${this.state.recentPosts.map(post => this.renderPostCard(post)).join('')}
            </div>
        `;
    }

    renderCategory(category, elementId, title) {
        const element = this.querySelector(`#${elementId}`);
        if (!element) return;

        if (!category || !category.posts || category.posts.length === 0) {
            element.innerHTML = '';
            return;
        }

        element.innerHTML = `
            <div class="posts-grid">
                <div style="grid-column: 1 / -1;">
                    <div class="section-header">
                        <h2 class="section-title">${this.escapeHtml(title)}</h2>
                        ${category.id ? `<a href="/blog/category/${category.id}" class="view-all-link">View All →</a>` : ''}
                    </div>
                </div>
                ${category.posts.map(post => this.renderPostCard(post)).join('')}
            </div>
        `;
    }

    renderAllPosts() {
        const allposts = this.querySelector('#allposts');
        if (!allposts) return;

        if (!this.state.allPosts || this.state.allPosts.length === 0) {
            allposts.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>No posts yet</h3>
                    <p>Check back soon for new content!</p>
                </div>
            `;
            return;
        }

        allposts.innerHTML = `
            <div class="posts-grid">
                <div style="grid-column: 1 / -1;">
                    <div class="section-header">
                        <h2 class="section-title">${this.escapeHtml(this.settings.allPostsTitle)}</h2>
                    </div>
                </div>
                ${this.state.allPosts.map(post => this.renderPostCard(post)).join('')}
            </div>
        `;
    }

    renderPostCard(post) {
        const imageUrl = this.convertWixImageUrl(post.coverImage || post.featuredImage);
        const title = post.title || 'Untitled';
        const excerpt = post.excerpt || '';

        return `
            <article class="post-card" data-slug="${post.slug || post._id}">
                ${imageUrl ? `
                    <div class="post-image-wrapper">
                        <img 
                            src="${imageUrl}" 
                            alt="${this.escapeHtml(title)}"
                            class="post-image"
                            loading="lazy"
                            onerror="this.parentElement.style.display='none'"
                        />
                    </div>
                ` : ''}
                <div class="post-content">
                    <h3 class="post-title">${this.escapeHtml(title)}</h3>
                    <p class="post-excerpt">${this.escapeHtml(excerpt)}</p>
                    ${this.renderPostMeta(post, false)}
                </div>
            </article>
        `;
    }

    renderPostMeta(post, isOnImage) {
        const author = post.author || 'Anonymous';
        const date = this.formatDate(post.publishDate || post._createdDate);
        const readTime = this.calculateReadTime(post.plainContent || '');
        const avatarUrl = this.convertWixImageUrl(post.authorImage);

        const textClass = isOnImage ? 'style="color: rgba(255, 255, 255, 0.9);"' : '';

        return `
            <div class="post-meta" ${textClass}>
                <div class="post-author">
                    ${avatarUrl ? `
                        <img 
                            src="${avatarUrl}" 
                            alt="${this.escapeHtml(author)}"
                            class="author-avatar"
                            loading="lazy"
                            onerror="this.style.display='none'"
                        />
                    ` : ''}
                    <span>${this.escapeHtml(author)}</span>
                </div>
                ${date ? `<span class="post-date">${date}</span>` : ''}
                ${readTime ? `<span class="post-read-time">${readTime}</span>` : ''}
            </div>
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

        pages.push(1);

        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (!pages.includes(i)) pages.push(i);
        }

        if (!pages.includes(totalPages)) pages.push(totalPages);

        paginationEl.innerHTML = `
            <div class="pagination-wrapper">
                <div class="pagination">
                    <button class="page-button" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">← Prev</button>
                    ${pages.map((page, index) => {
                        const prevPage = pages[index - 1];
                        const gap = prevPage && page - prevPage > 1 ? '<span class="page-ellipsis">...</span>' : '';
                        return `${gap}<button class="page-button ${page === currentPage ? 'active' : ''}" data-page="${page}">${page}</button>`;
                    }).join('')}
                    <button class="page-button" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Next →</button>
                </div>
            </div>
        `;

        paginationEl.querySelectorAll('.page-button[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.getAttribute('data-page'));
                this.changePage(page);
            });
        });
    }

    attachEventListeners() {
        this.querySelectorAll('.post-card, .featured-post').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.getAttribute('data-slug');
                this.emitEvent('navigate-to-post', { slug });
            });
        });
    }

    changePage(page) {
        this.emitEvent('page-change', { page });
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    calculateReadTime(content) {
        if (!content) return '';
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return `${minutes} min read`;
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

customElements.define('personal-blog-template', PersonalBlogTemplate);
