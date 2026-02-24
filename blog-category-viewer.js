// CUSTOM ELEMENT - Blog Category Viewer
class BlogCategoryViewer extends HTMLElement {
    constructor() {
        super();
        this.state = {
            category: null,
            posts: [],
            isLoading: true
        };
    }

    static get observedAttributes() {
        return ['category-data', 'posts-data'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        if (name === 'category-data') {
            try {
                this.state.category = JSON.parse(newValue);
                this.state.isLoading = false;
                if (this.isConnected) this.render();
            } catch (e) {
                console.error('Error parsing category data:', e);
            }
        } else if (name === 'posts-data') {
            try {
                this.state.posts = JSON.parse(newValue);
                if (this.isConnected) this.renderPosts();
            } catch (e) {
                console.error('Error parsing posts data:', e);
            }
        }
    }

    connectedCallback() {
        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="category-container">
                <div class="category-header" id="categoryHeader"></div>
                <div class="posts-grid" id="postsGrid"></div>
            </div>
        `;
        
        if (!this.state.isLoading) {
            this.render();
        } else {
            this.showLoading();
        }
    }

    getStyles() {
        return `
            blog-category-viewer {
                display: block;
                width: 100%;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: #1E1E1E;
                color: #ffffff;
                min-height: 600px;
            }

            .category-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 60px 20px;
            }

            .category-header {
                text-align: center;
                margin-bottom: 60px;
                padding-bottom: 40px;
                border-bottom: 2px solid #3d3d3d;
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
                margin: 0 auto 20px;
            }

            .category-meta {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                margin-top: 30px;
                font-size: 15px;
                color: #9ca3af;
            }

            .category-badge {
                background: #2d2d2d;
                border: 1px solid #3d3d3d;
                padding: 8px 20px;
                border-radius: 20px;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .category-badge svg {
                width: 18px;
                height: 18px;
                fill: #64FFDA;
            }

            .posts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 32px;
            }

            .post-card {
                background: #2d2d2d;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #3d3d3d;
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
                background: #1a1a1a;
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
                border-top: 1px solid #3d3d3d;
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

            .empty-state {
                text-align: center;
                padding: 80px 20px;
                color: #9ca3af;
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

            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }

            .skeleton {
                background: #2d2d2d;
                background-image: linear-gradient(
                    to right,
                    #2d2d2d 0%,
                    #3d3d3d 20%,
                    #2d2d2d 40%,
                    #2d2d2d 100%
                );
                background-repeat: no-repeat;
                background-size: 1000px 100%;
                animation: shimmer 1.5s infinite linear;
            }

            .skeleton-title {
                height: 48px;
                width: 60%;
                margin: 0 auto 20px;
                border-radius: 8px;
            }

            .skeleton-text {
                height: 20px;
                width: 80%;
                margin: 0 auto 12px;
                border-radius: 4px;
            }

            .skeleton-card {
                background: #2d2d2d;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #3d3d3d;
            }

            .skeleton-card-image {
                height: 220px;
            }

            .skeleton-card-content {
                padding: 24px;
            }

            .skeleton-card-title {
                height: 24px;
                margin-bottom: 12px;
                border-radius: 4px;
            }

            .skeleton-card-excerpt {
                height: 16px;
                margin-bottom: 8px;
                border-radius: 4px;
            }

            @media (max-width: 768px) {
                .category-container {
                    padding: 40px 16px;
                }

                .posts-grid {
                    grid-template-columns: 1fr;
                    gap: 24px;
                }

                .category-meta {
                    flex-direction: column;
                    gap: 12px;
                }
            }
        `;
    }

    showLoading() {
        const header = this.querySelector('#categoryHeader');
        const grid = this.querySelector('#postsGrid');

        if (header) {
            header.innerHTML = `
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 60%;"></div>
            `;
        }

        if (grid) {
            grid.innerHTML = Array(6).fill(0).map(() => `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-card-image"></div>
                    <div class="skeleton-card-content">
                        <div class="skeleton skeleton-card-title"></div>
                        <div class="skeleton skeleton-card-excerpt"></div>
                        <div class="skeleton skeleton-card-excerpt" style="width: 80%;"></div>
                        <div class="skeleton skeleton-card-excerpt" style="width: 60%;"></div>
                    </div>
                </div>
            `).join('');
        }
    }

    render() {
        const header = this.querySelector('#categoryHeader');
        if (!header || !this.state.category) return;

        const { title, name, description, postCount } = this.state.category;

        header.innerHTML = `
            <h1 class="category-title">${this.escapeHtml(title || name || 'Category')}</h1>
            ${description ? `<p class="category-description">${this.escapeHtml(description)}</p>` : ''}
            <div class="category-meta">
                <span class="category-badge">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                    ${postCount || this.state.posts.length || 0} ${(postCount || this.state.posts.length) === 1 ? 'Post' : 'Posts'}
                </span>
            </div>
        `;

        this.renderPosts();
    }

    renderPosts() {
        const grid = this.querySelector('#postsGrid');
        if (!grid) return;

        if (!this.state.posts || this.state.posts.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    <h3>No Posts Yet</h3>
                    <p>There are no posts in this category at the moment.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.state.posts.map(post => {
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
                        onerror="this.src='https://via.placeholder.com/400x220/2d2d2d/64FFDA?text=No+Image'"
                    />
                    <div class="post-content">
                        <h2 class="post-title">${this.escapeHtml(displayTitle)}</h2>
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
        }).join('');

        this.querySelectorAll('.post-card').forEach(card => {
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

customElements.define('blog-category-viewer', BlogCategoryViewer);
