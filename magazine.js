// CUSTOM ELEMENT - Magazine Blog Page (Part 1)
class MagazinePage extends HTMLElement {
    constructor() {
        super();
        this.state = {
            featured: [],
            latest: [],
            trending: [],
            editorPick: [],
            category1: [],
            category2: [],
            category3: [],
            headings: {
                featuredHeading: 'Featured Stories',
                latestHeading: 'Latest News',
                trendingHeading: 'Trending Now',
                editorPickHeading: "Editor's Picks",
                category1Heading: 'Technology',
                category2Heading: 'Business',
                category3Heading: 'Lifestyle'
            }
        };
        
        const initialStyleProps = this.getAttribute('style-props');
        this.styleProps = initialStyleProps ? JSON.parse(initialStyleProps) : this.getDefaultStyleProps();
    }

    static get observedAttributes() {
        return ['magazine-data', 'style-props'];
    }

    getDefaultStyleProps() {
        return {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            primaryBg: '#ffffff',
            secondaryBg: '#f8f9fa',
            mainAccent: '#dc2626',
            hoverAccent: '#991b1b',
            textPrimary: '#1a1a1a',
            textSecondary: '#6b7280',
            border: '#e5e7eb',
            shadow: 'rgba(0, 0, 0, 0.1)',
            shape: '#dc2626'
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        try {
            if (name === 'magazine-data') {
                const data = JSON.parse(newValue);
                console.log('Magazine - Received data');
                
                this.state.featured = data.featured || [];
                this.state.latest = data.latest || [];
                this.state.trending = data.trending || [];
                this.state.editorPick = data.editorPick || [];
                this.state.category1 = data.category1 || [];
                this.state.category2 = data.category2 || [];
                this.state.category3 = data.category3 || [];
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
            <div class="magazine-page">
                <div id="content"></div>
            </div>
        `;
        
        this.initialRenderDone = true;
        this.render();
        this.attachEventListeners();
    }

    getStyles() {
        const {
            fontFamily, primaryBg, secondaryBg, mainAccent, hoverAccent,
            textPrimary, textSecondary, border, shadow, shape
        } = this.styleProps;

        return `
            magazine-page {
                display: block;
                width: 100%;
                font-family: ${fontFamily};
                background: ${primaryBg};
                color: ${textPrimary};
            }

            .magazine-page {
                max-width: 1400px;
                margin: 0 auto;
                padding: 40px 20px;
            }

            /* Section Titles */
            .section-header {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 30px;
                padding-bottom: 16px;
                border-bottom: 3px solid ${border};
            }

            .section-title {
                font-size: 28px;
                font-weight: 900;
                color: ${textPrimary};
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 1px;
                position: relative;
            }

            .section-title::before {
                content: '';
                position: absolute;
                left: 0;
                bottom: -19px;
                width: 60px;
                height: 3px;
                background: ${mainAccent};
            }

            .section-shape {
                width: 40px;
                height: 40px;
                background: ${shape};
                transform: rotate(45deg);
            }

            /* Featured Section */
            .featured-section {
                margin-bottom: 60px;
            }

            .featured-card {
                position: relative;
                height: 600px;
                overflow: hidden;
                border-radius: 8px;
                cursor: pointer;
                box-shadow: 0 10px 30px ${shadow};
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

            .featured-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
                padding: 60px 40px;
                color: #ffffff;
            }

            .featured-category {
                display: inline-block;
                background: ${mainAccent};
                color: #ffffff;
                padding: 8px 20px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 16px;
            }

            .featured-title {
                font-size: clamp(28px, 4vw, 48px);
                font-weight: 900;
                color: #ffffff;
                margin: 0 0 16px 0;
                line-height: 1.2;
            }

            .featured-excerpt {
                font-size: 18px;
                color: #e5e7eb;
                margin: 0 0 20px 0;
                max-width: 700px;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .featured-meta {
                display: flex;
                align-items: center;
                gap: 20px;
                font-size: 14px;
                color: #9ca3af;
            }

            /* Grid Layouts */
            .posts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 30px;
                margin-bottom: 60px;
            }

            .posts-grid-2col {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 30px;
                margin-bottom: 60px;
            }

            /* Standard Post Card */
            .post-card {
                background: ${primaryBg};
                border: 1px solid ${border};
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px ${shadow};
                display: flex;
                flex-direction: column;
            }

            .post-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 12px 24px ${shadow};
                border-color: ${mainAccent};
            }

            .post-image {
                width: 100%;
                height: 220px;
                object-fit: cover;
                transition: transform 0.3s ease;
            }

            .post-card:hover .post-image {
                transform: scale(1.1);
            }

            .post-content {
                padding: 24px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .post-category {
                display: inline-block;
                background: ${secondaryBg};
                color: ${mainAccent};
                padding: 6px 14px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 12px;
                width: fit-content;
                border: 1px solid ${border};
            }

            .post-title {
                font-size: 20px;
                font-weight: 700;
                color: ${textPrimary};
                margin: 0 0 12px 0;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .post-card:hover .post-title {
                color: ${mainAccent};
            }

            .post-excerpt {
                font-size: 15px;
                line-height: 1.6;
                color: ${textSecondary};
                margin: 0 0 16px 0;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                flex: 1;
            }

            .post-meta {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding-top: 16px;
                border-top: 1px solid ${border};
                font-size: 13px;
                color: ${textSecondary};
            }

            .post-author {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 500;
            }

            /* Horizontal Post Card (for Trending/Editor's Pick) */
            .post-card-horizontal {
                display: flex;
                gap: 20px;
                background: ${primaryBg};
                border: 1px solid ${border};
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.3s ease;
                padding: 16px;
            }

            .post-card-horizontal:hover {
                background: ${secondaryBg};
                border-color: ${mainAccent};
                box-shadow: 0 4px 12px ${shadow};
            }

            .post-image-horizontal {
                width: 120px;
                height: 120px;
                object-fit: cover;
                border-radius: 6px;
                flex-shrink: 0;
            }

            .post-content-horizontal {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            .post-title-horizontal {
                font-size: 18px;
                font-weight: 700;
                color: ${textPrimary};
                margin: 0 0 8px 0;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .post-card-horizontal:hover .post-title-horizontal {
                color: ${mainAccent};
            }

            .post-date-small {
                font-size: 12px;
                color: ${textSecondary};
            }

            /* Sidebar Layout */
            .content-with-sidebar {
                display: grid;
                grid-template-columns: 1fr 350px;
                gap: 40px;
                margin-bottom: 60px;
            }

            .main-content {
                min-width: 0;
            }

            .sidebar {
                position: sticky;
                top: 20px;
                height: fit-content;
            }

            .sidebar-section {
                background: ${secondaryBg};
                border: 1px solid ${border};
                border-radius: 8px;
                padding: 24px;
                margin-bottom: 24px;
            }

            .sidebar-title {
                font-size: 18px;
                font-weight: 700;
                color: ${textPrimary};
                margin: 0 0 20px 0;
                padding-bottom: 12px;
                border-bottom: 2px solid ${mainAccent};
            }

            .sidebar-posts {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            /* Category Sections */
            .category-section {
                margin-bottom: 60px;
            }

            /* Empty State */
            .empty-section {
                text-align: center;
                padding: 60px 20px;
                color: ${textSecondary};
            }

            /* Responsive */
            @media (max-width: 1200px) {
                .content-with-sidebar {
                    grid-template-columns: 1fr;
                }

                .sidebar {
                    position: relative;
                    top: 0;
                }
            }

            @media (max-width: 768px) {
                .magazine-page {
                    padding: 20px 16px;
                }

                .featured-card {
                    height: 400px;
                }

                .featured-overlay {
                    padding: 30px 20px;
                }

                .posts-grid,
                .posts-grid-2col {
                    grid-template-columns: 1fr;
                }

                .section-title {
                    font-size: 22px;
                }

                .post-card-horizontal {
                    flex-direction: column;
                }

                .post-image-horizontal {
                    width: 100%;
                    height: 180px;
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
  // CUSTOM ELEMENT - Magazine Blog Page (Part 2)
    
    render() {
        const content = this.querySelector('#content');
        if (!content) return;

        console.log('Rendering magazine page...');

        let html = '';

        // Featured Section
        if (this.state.featured.length > 0) {
            html += `
                <section class="featured-section">
                    <div class="section-header">
                        <h1 class="section-title">${this.escapeHtml(this.state.headings.featuredHeading)}</h1>
                    </div>
                    ${this.renderFeaturedCard(this.state.featured[0])}
                </section>
            `;
        }

        // Latest News Section with Trending Sidebar
        html += `
            <div class="content-with-sidebar">
                <div class="main-content">
                    <section>
                        <div class="section-header">
                            <h2 class="section-title">${this.escapeHtml(this.state.headings.latestHeading)}</h2>
                        </div>
                        ${this.state.latest.length > 0 
                            ? `<div class="posts-grid">${this.state.latest.map(post => this.renderPostCard(post)).join('')}</div>`
                            : '<div class="empty-section"><p>No latest posts available</p></div>'
                        }
                    </section>
                </div>
                
                <aside class="sidebar">
                    <!-- Trending Section -->
                    <div class="sidebar-section">
                        <h3 class="sidebar-title">${this.escapeHtml(this.state.headings.trendingHeading)}</h3>
                        <div class="sidebar-posts">
                            ${this.state.trending.length > 0
                                ? this.state.trending.map(post => this.renderHorizontalCard(post)).join('')
                                : '<p style="color: #6b7280;">No trending posts</p>'
                            }
                        </div>
                    </div>
                    
                    <!-- Editor's Pick Section -->
                    <div class="sidebar-section">
                        <h3 class="sidebar-title">${this.escapeHtml(this.state.headings.editorPickHeading)}</h3>
                        <div class="sidebar-posts">
                            ${this.state.editorPick.length > 0
                                ? this.state.editorPick.map(post => this.renderHorizontalCard(post)).join('')
                                : '<p style="color: #6b7280;">No editor picks</p>'
                            }
                        </div>
                    </div>
                </aside>
            </div>
        `;

        // Category Section 1
        if (this.state.category1.length > 0) {
            html += `
                <section class="category-section">
                    <div class="section-header">
                        <div class="section-shape"></div>
                        <h2 class="section-title">${this.escapeHtml(this.state.headings.category1Heading)}</h2>
                    </div>
                    <div class="posts-grid">
                        ${this.state.category1.map(post => this.renderPostCard(post)).join('')}
                    </div>
                </section>
            `;
        }

        // Category Section 2
        if (this.state.category2.length > 0) {
            html += `
                <section class="category-section">
                    <div class="section-header">
                        <div class="section-shape"></div>
                        <h2 class="section-title">${this.escapeHtml(this.state.headings.category2Heading)}</h2>
                    </div>
                    <div class="posts-grid">
                        ${this.state.category2.map(post => this.renderPostCard(post)).join('')}
                    </div>
                </section>
            `;
        }

        // Category Section 3
        if (this.state.category3.length > 0) {
            html += `
                <section class="category-section">
                    <div class="section-header">
                        <div class="section-shape"></div>
                        <h2 class="section-title">${this.escapeHtml(this.state.headings.category3Heading)}</h2>
                    </div>
                    <div class="posts-grid">
                        ${this.state.category3.map(post => this.renderPostCard(post)).join('')}
                    </div>
                </section>
            `;
        }

        content.innerHTML = html;
        this.attachEventListeners();
    }

    renderFeaturedCard(post) {
        const imageUrl = this.convertWixImageUrl(post.featuredImage);
        const displayTitle = post.blogTitle || post.title || 'Untitled';

        return `
            <article class="featured-card" data-slug="${post.slug}">
                <img 
                    src="${imageUrl}" 
                    alt="${this.escapeHtml(displayTitle)}"
                    class="featured-image"
                    onerror="this.src='https://via.placeholder.com/1200x600/1a1a1a/ffffff?text=Featured+Post'"
                />
                <div class="featured-overlay">
                    ${post.category ? `<span class="featured-category">${this.escapeHtml(post.category)}</span>` : ''}
                    <h2 class="featured-title">${this.escapeHtml(displayTitle)}</h2>
                    <p class="featured-excerpt">${this.escapeHtml(post.excerpt || '')}</p>
                    <div class="featured-meta">
                        ${post.author ? `<span>By ${this.escapeHtml(post.author)}</span>` : ''}
                        ${post.publishedDate ? `<span>${this.formatDate(post.publishedDate)}</span>` : ''}
                    </div>
                </div>
            </article>
        `;
    }

    renderPostCard(post) {
        const imageUrl = this.convertWixImageUrl(post.featuredImage);
        const displayTitle = post.blogTitle || post.title || 'Untitled';

        return `
            <article class="post-card" data-slug="${post.slug}">
                <div style="overflow: hidden;">
                    <img 
                        src="${imageUrl}" 
                        alt="${this.escapeHtml(displayTitle)}"
                        class="post-image"
                        loading="lazy"
                        onerror="this.src='https://via.placeholder.com/400x220/f3f4f6/1a1a1a?text=No+Image'"
                    />
                </div>
                <div class="post-content">
                    ${post.category ? `<span class="post-category">${this.escapeHtml(post.category)}</span>` : ''}
                    <h3 class="post-title">${this.escapeHtml(displayTitle)}</h3>
                    <p class="post-excerpt">${this.escapeHtml(post.excerpt || '')}</p>
                    <div class="post-meta">
                        <span class="post-author">
                            ${post.author ? `👤 ${this.escapeHtml(post.author)}` : 'Anonymous'}
                        </span>
                        <span class="post-date">
                            ${post.publishedDate ? this.formatDate(post.publishedDate) : ''}
                        </span>
                    </div>
                </div>
            </article>
        `;
    }

    renderHorizontalCard(post) {
        const imageUrl = this.convertWixImageUrl(post.featuredImage);
        const displayTitle = post.blogTitle || post.title || 'Untitled';

        return `
            <article class="post-card-horizontal" data-slug="${post.slug}">
                <img 
                    src="${imageUrl}" 
                    alt="${this.escapeHtml(displayTitle)}"
                    class="post-image-horizontal"
                    loading="lazy"
                    onerror="this.src='https://via.placeholder.com/120/f3f4f6/1a1a1a?text=No+Image'"
                />
                <div class="post-content-horizontal">
                    <h4 class="post-title-horizontal">${this.escapeHtml(displayTitle)}</h4>
                    <span class="post-date-small">
                        ${post.publishedDate ? `📅 ${this.formatDate(post.publishedDate)}` : ''}
                    </span>
                </div>
            </article>
        `;
    }

    attachEventListeners() {
        // Attach click listeners to all post cards
        this.querySelectorAll('[data-slug]').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.getAttribute('data-slug');
                this.navigateToPost(slug);
            });
        });
    }

    navigateToPost(slug) {
        this.dispatchEvent(new CustomEvent('navigate-to-post', {
            detail: { slug },
            bubbles: true,
            composed: true
        }));
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
}

customElements.define('magazine-page', MagazinePage);
