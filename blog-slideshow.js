// CUSTOM ELEMENT - Blog Slideshow Widget
class BlogSlideshow extends HTMLElement {
    constructor() {
        super();
        this.state = {
            posts: [],
            currentIndex: 0,
            autoplay: true,
            autoplayInterval: 5000,
            isTransitioning: false
        };
        
        this.autoplayTimer = null;
        
        const initialStyleProps = this.getAttribute('style-props');
        this.styleProps = initialStyleProps ? JSON.parse(initialStyleProps) : this.getDefaultStyleProps();
    }

    static get observedAttributes() {
        return ['slideshow-data', 'style-props'];
    }

    getDefaultStyleProps() {
        return {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            bgColor: '#0f0f0f',
            overlayColor: 'rgba(0, 0, 0, 0.6)',
            titleColor: '#ffffff',
            excerptColor: '#e5e7eb',
            categoryBg: '#6366f1',
            categoryText: '#ffffff',
            metaColor: '#9ca3af',
            btnBg: '#6366f1',
            btnText: '#ffffff',
            btnHoverBg: '#4f46e5',
            arrowBg: 'rgba(255, 255, 255, 0.2)',
            arrowHoverBg: 'rgba(255, 255, 255, 0.4)',
            arrowColor: '#ffffff',
            dotBg: 'rgba(255, 255, 255, 0.3)',
            dotActiveBg: '#ffffff'
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        try {
            if (name === 'slideshow-data') {
                const data = JSON.parse(newValue);
                console.log('Slideshow - Received data:', data);
                
                this.state.posts = data.posts || [];
                this.state.autoplay = data.autoplay !== false;
                this.state.autoplayInterval = data.autoplayInterval || 5000;
                this.state.currentIndex = 0;
                
                if (this.isConnected) {
                    this.render();
                    this.setupAutoplay();
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
            <div class="blog-slideshow">
                <div class="slideshow-container">
                    <div class="slides-wrapper" id="slidesWrapper"></div>
                    <button class="arrow arrow-left" id="prevBtn" aria-label="Previous slide">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
                    <button class="arrow arrow-right" id="nextBtn" aria-label="Next slide">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                    </button>
                </div>
                <div class="dots-container" id="dotsContainer"></div>
            </div>
        `;
        
        this.initialRenderDone = true;
        this.render();
        this.attachEventListeners();
        this.setupAutoplay();
    }

    disconnectedCallback() {
        this.stopAutoplay();
    }

    getStyles() {
        const {
            fontFamily, bgColor, overlayColor, titleColor, excerptColor,
            categoryBg, categoryText, metaColor, btnBg, btnText, btnHoverBg,
            arrowBg, arrowHoverBg, arrowColor, dotBg, dotActiveBg
        } = this.styleProps;

        return `
            blog-slideshow {
                display: block;
                width: 100%;
                font-family: ${fontFamily};
                background: ${bgColor};
            }

            .blog-slideshow {
                position: relative;
                width: 100%;
                overflow: hidden;
            }

            .slideshow-container {
                position: relative;
                width: 100%;
                height: 600px;
                overflow: hidden;
            }

            .slides-wrapper {
                position: relative;
                width: 100%;
                height: 100%;
            }

            .slide {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0;
                transition: opacity 0.6s ease-in-out;
                pointer-events: none;
            }

            .slide.active {
                opacity: 1;
                pointer-events: all;
            }

            .slide-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .slide-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: ${overlayColor};
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 60px 40px;
            }

            .slide-content {
                max-width: 900px;
                text-align: center;
                color: ${titleColor};
            }

            .slide-category {
                display: inline-block;
                background: ${categoryBg};
                color: ${categoryText};
                padding: 8px 20px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .slide-title {
                font-size: clamp(32px, 5vw, 56px);
                font-weight: 900;
                color: ${titleColor};
                margin: 0 0 20px 0;
                line-height: 1.2;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }

            .slide-excerpt {
                font-size: clamp(16px, 2vw, 20px);
                line-height: 1.6;
                color: ${excerptColor};
                margin: 0 0 20px 0;
                max-width: 700px;
                margin-left: auto;
                margin-right: auto;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .slide-meta {
                font-size: 14px;
                color: ${metaColor};
                margin: 0 0 30px 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
            }

            .slide-author {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .slide-btn {
                display: inline-block;
                background: ${btnBg};
                color: ${btnText};
                padding: 14px 32px;
                border-radius: 30px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
                text-decoration: none;
            }

            .slide-btn:hover {
                background: ${btnHoverBg};
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
            }

            /* Navigation Arrows */
            .arrow {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: ${arrowBg};
                backdrop-filter: blur(10px);
                border: none;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 10;
            }

            .arrow:hover {
                background: ${arrowHoverBg};
                transform: translateY(-50%) scale(1.1);
            }

            .arrow svg {
                width: 24px;
                height: 24px;
                fill: ${arrowColor};
            }

            .arrow-left {
                left: 20px;
            }

            .arrow-right {
                right: 20px;
            }

            /* Dots */
            .dots-container {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 12px;
                padding: 30px 20px;
            }

            .dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${dotBg};
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
                padding: 0;
            }

            .dot:hover {
                transform: scale(1.2);
            }

            .dot.active {
                background: ${dotActiveBg};
                width: 40px;
                border-radius: 6px;
            }

            /* Empty State */
            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 600px;
                color: ${metaColor};
                text-align: center;
                padding: 40px;
            }

            .empty-state svg {
                width: 64px;
                height: 64px;
                fill: ${metaColor};
                margin-bottom: 20px;
                opacity: 0.5;
            }

            .empty-state h3 {
                font-size: 24px;
                color: ${titleColor};
                margin: 0 0 12px 0;
            }

            .empty-state p {
                font-size: 16px;
                margin: 0;
            }

            @media (max-width: 768px) {
                .slideshow-container {
                    height: 500px;
                }

                .slide-overlay {
                    padding: 40px 20px;
                }

                .slide-title {
                    font-size: 28px;
                }

                .slide-excerpt {
                    font-size: 16px;
                }

                .arrow {
                    width: 40px;
                    height: 40px;
                }

                .arrow-left {
                    left: 10px;
                }

                .arrow-right {
                    right: 10px;
                }

                .slide-meta {
                    flex-direction: column;
                    gap: 10px;
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
        const wrapper = this.querySelector('#slidesWrapper');
        const dotsContainer = this.querySelector('#dotsContainer');
        
        if (!wrapper || !dotsContainer) return;

        if (this.state.posts.length === 0) {
            wrapper.innerHTML = this.getEmptyState('No posts available for slideshow');
            dotsContainer.innerHTML = '';
            return;
        }

        // Render slides
        wrapper.innerHTML = this.state.posts.map((post, index) => this.renderSlide(post, index)).join('');

        // Render dots
        dotsContainer.innerHTML = this.state.posts.map((_, index) => `
            <button class="dot ${index === this.state.currentIndex ? 'active' : ''}" data-index="${index}" aria-label="Go to slide ${index + 1}"></button>
        `).join('');

        // Show first slide
        this.showSlide(this.state.currentIndex);
        
        // Attach dot listeners
        this.attachDotListeners();
    }

    renderSlide(post, index) {
        const imageUrl = this.convertWixImageUrl(post.featuredImage);
        const displayTitle = post.blogTitle || post.title || 'Untitled';

        return `
            <div class="slide ${index === this.state.currentIndex ? 'active' : ''}" data-index="${index}">
                <img 
                    src="${imageUrl}" 
                    alt="${this.escapeHtml(displayTitle)}"
                    class="slide-bg"
                    onerror="this.src='https://via.placeholder.com/1200x600/1a1a1a/ffffff?text=No+Image'"
                />
                <div class="slide-overlay">
                    <div class="slide-content">
                        ${post.category ? `<div class="slide-category">${this.escapeHtml(post.category)}</div>` : ''}
                        <h2 class="slide-title">${this.escapeHtml(displayTitle)}</h2>
                        <p class="slide-excerpt">${this.escapeHtml(post.excerpt || '')}</p>
                        <div class="slide-meta">
                            ${post.author ? `<div class="slide-author">👤 ${this.escapeHtml(post.author)}</div>` : ''}
                            ${post.publishedDate ? `<div class="slide-date">📅 ${this.formatDate(post.publishedDate)}</div>` : ''}
                        </div>
                        <button class="slide-btn" data-slug="${post.slug}">Read Article →</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const prevBtn = this.querySelector('#prevBtn');
        const nextBtn = this.querySelector('#nextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousSlide());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }

        // Attach click listeners to read buttons
        this.addEventListener('click', (e) => {
            if (e.target.classList.contains('slide-btn')) {
                const slug = e.target.getAttribute('data-slug');
                this.navigateToPost(slug);
            }
        });

        // Pause autoplay on hover
        this.addEventListener('mouseenter', () => this.stopAutoplay());
        this.addEventListener('mouseleave', () => this.setupAutoplay());

        // Keyboard navigation
        this.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
        });
    }

    attachDotListeners() {
        this.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.getAttribute('data-index'));
                this.goToSlide(index);
            });
        });
    }

    showSlide(index) {
        const slides = this.querySelectorAll('.slide');
        const dots = this.querySelectorAll('.dot');

        slides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        this.state.currentIndex = index;
    }

    nextSlide() {
        if (this.state.isTransitioning) return;
        this.state.isTransitioning = true;

        const nextIndex = (this.state.currentIndex + 1) % this.state.posts.length;
        this.goToSlide(nextIndex);

        setTimeout(() => {
            this.state.isTransitioning = false;
        }, 600);
    }

    previousSlide() {
        if (this.state.isTransitioning) return;
        this.state.isTransitioning = true;

        const prevIndex = (this.state.currentIndex - 1 + this.state.posts.length) % this.state.posts.length;
        this.goToSlide(prevIndex);

        setTimeout(() => {
            this.state.isTransitioning = false;
        }, 600);
    }

    goToSlide(index) {
        this.showSlide(index);
        this.resetAutoplay();
    }

    setupAutoplay() {
        this.stopAutoplay();
        
        if (this.state.autoplay && this.state.posts.length > 1) {
            this.autoplayTimer = setInterval(() => {
                this.nextSlide();
            }, this.state.autoplayInterval);
        }
    }

    stopAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    resetAutoplay() {
        this.setupAutoplay();
    }

    getEmptyState(message) {
        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <h3>${message}</h3>
                <p>Add posts to display in the slideshow</p>
            </div>
        `;
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

customElements.define('blog-slideshow', BlogSlideshow);
