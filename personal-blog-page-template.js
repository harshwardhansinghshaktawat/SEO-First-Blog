class PersonalBlogTemplate extends HTMLElement {
    constructor() {
        super();
        this.settings = {};
        this.styleProps = {};
        this.blogData = {};
    }

    static get observedAttributes() {
        return ['settings', 'style-props', 'blog-data'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        try {
            if (name === 'settings') {
                this.settings = JSON.parse(newValue || '{}');
            } else if (name === 'style-props') {
                this.styleProps = JSON.parse(newValue || '{}');
            } else if (name === 'blog-data') {
                this.blogData = JSON.parse(newValue || '{}');
            }
            
            this.render();
        } catch (error) {
            console.error('Error parsing attribute:', name, error);
        }
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const s = this.settings;
        const st = this.styleProps;
        const data = this.blogData;

        this.innerHTML = `
            <style>
            ${this.getStyles()}
            </style>
            <div class="blog-container">
                ${this.renderHero()}
                ${this.renderFeaturedPost()}
                ${this.renderRecentPosts()}
                ${this.renderCategorySection(data.category1, s.category1Title || 'Featured Category', 1)}
                ${this.renderCategorySection(data.category2, s.category2Title || 'Popular Category', 2)}
                ${this.renderCategorySection(data.category3, s.category3Title || 'Trending Category', 3)}
                ${this.renderAllPostsSection()}
            </div>
        `;

        this.attachEventListeners();
    }

    getStyles() {
        const st = this.styleProps;
        
        return `
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            .blog-container {
                font-family: ${st.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
                background: ${st.bgColor || '#ffffff'};
                color: ${st.cardTitleColor || '#1e293b'};
                line-height: 1.6;
            }

            /* Hero Section */
            .hero-section {
                text-align: center;
                padding: 80px 24px;
                background: ${st.heroBg || '#ffffff'};
                border-bottom: 1px solid ${st.heroBorder || '#e5e7eb'};
            }

            .hero-title {
                font-size: clamp(36px, 5vw, 56px);
                font-weight: 800;
                color: ${st.heroTitleColor || '#1e293b'};
                margin-bottom: 16px;
                letter-spacing: -0.02em;
            }

            .hero-subtitle {
                font-size: clamp(16px, 2.5vw, 20px);
                color: ${st.heroSubtitleColor || '#475569'};
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
                background: ${st.featuredBg || '#ffffff'};
                border: 1px solid ${st.featuredBorder || '#e5e7eb'};
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .featured-post:hover {
                transform: translateY(-4px);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                border-color: ${st.primaryColor || '#6366f1'};
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
                background: linear-gradient(to top, ${st.featuredOverlay || 'rgba(0, 0, 0, 0.6)'}, transparent);
                padding: 48px 32px 32px;
            }

            .featured-content {
                padding: 32px;
            }

            .featured-title {
                font-size: clamp(24px, 3vw, 36px);
                font-weight: 700;
                color: ${st.featuredTitleColor || '#1e293b'};
                margin-bottom: 16px;
                line-height: 1.3;
            }

            .featured-on-image .featured-title {
                color: #ffffff;
            }

            .featured-excerpt {
                font-size: 16px;
                color: ${st.featuredExcerptColor || '#475569'};
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
                border-bottom: 2px solid ${st.sectionBorder || '#e5e7eb'};
            }

            .section-title {
                font-size: clamp(24px, 3vw, 32px);
                font-weight: 700;
                color: ${st.sectionTitleColor || '#1e293b'};
            }

            .view-all-link {
                color: ${st.primaryColor || '#6366f1'};
                text-decoration: none;
                font-weight: 600;
                font-size: 14px;
                transition: color 0.2s ease;
            }

            .view-all-link:hover {
                color: ${st.primaryHover || '#4f46e5'};
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
                background: ${st.cardBg || '#ffffff'};
                border: 1px solid ${st.cardBorder || '#e5e7eb'};
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
                border-color: ${st.cardBorderHover || '#6366f1'};
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
                background: ${st.accentColor || '#f9fafb'};
            }

            .post-content {
                padding: 24px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .post-category {
                display: inline-block;
                background: ${st.categoryBadgeBg || '#ede9fe'};
                color: ${st.categoryBadgeText || '#6366f1'};
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 12px;
                transition: all 0.2s ease;
            }

            .post-card:hover .post-category {
                background: ${st.categoryBadgeHoverBg || '#6366f1'};
                color: ${st.categoryBadgeHoverText || '#ffffff'};
            }

            .post-title {
                font-size: 20px;
                font-weight: 700;
                color: ${st.cardTitleColor || '#1e293b'};
                margin-bottom: 12px;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .post-excerpt {
                font-size: 15px;
                color: ${st.cardExcerptColor || '#475569'};
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
                border-top: 1px solid ${st.cardBorder || '#e5e7eb'};
                font-size: 13px;
                color: ${st.cardMetaColor || '#64748b'};
            }

            .post-author {
                display: flex;
                align-items: center;
                gap: 8px;
                color: ${st.authorColor || '#1e293b'};
                font-weight: 500;
            }

            .author-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid ${st.cardBorder || '#e5e7eb'};
            }

            .post-date {
                color: ${st.dateColor || '#64748b'};
            }

            .post-read-time {
                color: ${st.readTimeColor || '#64748b'};
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
                background: ${st.paginationBg || '#ffffff'};
                border: 1px solid ${st.paginationBorder || '#e5e7eb'};
                color: ${st.paginationText || '#475569'};
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s ease;
                font-size: 14px;
            }

            .page-button:hover:not(:disabled) {
                background: ${st.paginationHoverBg || '#f9fafb'};
                border-color: ${st.primaryColor || '#6366f1'};
            }

            .page-button.active {
                background: ${st.paginationActiveBg || '#6366f1'};
                color: ${st.paginationActiveText || '#ffffff'};
                border-color: ${st.paginationActiveBg || '#6366f1'};
            }

            .page-button:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .page-ellipsis {
                padding: 0 8px;
                color: ${st.paginationText || '#475569'};
            }

            /* Premium Banner */
            .premium-banner {
                background: linear-gradient(135deg, ${st.primaryColor || '#6366f1'} 0%, ${st.primaryHover || '#4f46e5'} 100%);
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
                color: ${st.cardExcerptColor || '#475569'};
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

    renderHero() {
        const s = this.settings;
        
        return `
            <div class="hero-section">
                <h1 class="hero-title">${this.escapeHtml(s.heroTitle || 'Welcome to My Blog')}</h1>
                <p class="hero-subtitle">${this.escapeHtml(s.heroSubtitle || 'Sharing stories, insights, and experiences')}</p>
            </div>
        `;
    }

    renderFeaturedPost() {
        const data = this.blogData;
        if (!data.featuredPost) return '';

        const post = data.featuredPost;
        const hasImage = post.coverImage || post.featuredImage;

        return `
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

    renderRecentPosts() {
        const s = this.settings;
        const data = this.blogData;
        
        if (!data.recentPosts || data.recentPosts.length === 0) return '';

        return `
            <div class="posts-grid">
                <div style="grid-column: 1 / -1;">
                    <div class="section-header">
                        <h2 class="section-title">${this.escapeHtml(s.recentTitle || 'Recent Posts')}</h2>
                    </div>
                </div>
                ${data.recentPosts.map(post => this.renderPostCard(post)).join('')}
            </div>
        `;
    }

    renderCategorySection(category, title, index) {
        if (!category || !category.posts || category.posts.length === 0) return '';

        return `
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

    renderAllPostsSection() {
        const s = this.settings;
        const data = this.blogData;
        
        if (!data.allPosts || data.allPosts.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>No posts yet</h3>
                    <p>Check back soon for new content!</p>
                </div>
            `;
        }

        return `
            <div class="posts-grid">
                <div style="grid-column: 1 / -1;">
                    <div class="section-header">
                        <h2 class="section-title">${this.escapeHtml(s.allPostsTitle || 'All Posts')}</h2>
                    </div>
                </div>
                ${data.allPosts.map(post => this.renderPostCard(post)).join('')}
            </div>
            ${this.renderPagination()}
            ${data.planLimit ? this.renderPremiumBanner() : ''}
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
        const data = this.blogData;
        const currentPage = data.currentPage || 1;
        const postsPerPage = data.postsPerPage || 9;
        const totalPages = Math.ceil(data.totalPosts / postsPerPage);

        if (totalPages <= 1) return '';

        let pages = [];
        
        // Always show first page
        pages.push(1);
        
        // Show pages around current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (!pages.includes(i)) {
                if (i > pages[pages.length - 1] + 1) pages.push('...');
                pages.push(i);
            }
        }
        
        // Always show last page
        if (totalPages > 1) {
            if (totalPages > pages[pages.length - 1] + 1) pages.push('...');
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }

        return `
            <div class="pagination-wrapper">
                <div class="pagination">
                    <button 
                        class="page-button" 
                        data-page="${currentPage - 1}"
                        ${currentPage === 1 ? 'disabled' : ''}
                    >
                        ← Prev
                    </button>
                    
                    ${pages.map(page => {
                        if (page === '...') {
                            return '<span class="page-ellipsis">...</span>';
                        }
                        return `
                            <button 
                                class="page-button ${page === currentPage ? 'active' : ''}" 
                                data-page="${page}"
                            >
                                ${page}
                            </button>
                        `;
                    }).join('')}
                    
                    <button 
                        class="page-button" 
                        data-page="${currentPage + 1}"
                        ${currentPage === totalPages ? 'disabled' : ''}
                    >
                        Next →
                    </button>
                </div>
            </div>
        `;
    }

    renderPremiumBanner() {
        const data = this.blogData;
        
        return `
            <div class="premium-banner">
                <h3>🚀 Unlock Unlimited Posts</h3>
                <p>Upgrade to Premium to view all ${data.totalPosts}+ posts. Currently showing ${data.maxPosts} posts.</p>
            </div>
        `;
    }

    attachEventListeners() {
        // Post card clicks
        this.querySelectorAll('.post-card, .featured-post').forEach(card => {
            card.addEventListener('click', (e) => {
                const slug = e.currentTarget.dataset.slug;
                if (slug) {
                    this.dispatchEvent(new CustomEvent('navigate-to-post', {
                        detail: { slug },
                        bubbles: true,
                        composed: true
                    }));
                }
            });
        });

        // Pagination clicks
        this.querySelectorAll('.page-button:not(:disabled)').forEach(button => {
            button.addEventListener('click', (e) => {
                const page = parseInt(e.currentTarget.dataset.page);
                if (page && page > 0) {
                    this.dispatchEvent(new CustomEvent('page-change', {
                        detail: { page },
                        bubbles: true,
                        composed: true
                    }));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
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
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

customElements.define('personal-blog-template', PersonalBlogTemplate);
