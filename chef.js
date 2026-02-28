// VARIANT 4: RECIPE CHEF LAYOUT - COMPLETE
// Features: Large chef avatar, recipe card design, cooking-themed colors, ingredient highlights, step-by-step format
// Perfect for: Food blogs, recipe sites, cooking tutorials, culinary content

class RecipeChefBlogViewer extends HTMLElement {
    constructor() {
        super();
        
        this.state = {
            postData: null,
            relatedPosts: [],
            isLoading: true,
            viewCount: 0
        };

        this.markedLoaded = false;
        this.initialRenderDone = false;
        
        const initialStyleProps = this.getAttribute('style-props');
        this.styleProps = initialStyleProps ? JSON.parse(initialStyleProps) : this.getDefaultStyleProps();
    }

    static get observedAttributes() {
        return ['post-data', 'related-posts', 'style-props', 'view-count'];
    }

    get postData() { return this.state.postData; }
    set postData(value) {
        try {
            this.state.postData = typeof value === 'string' ? JSON.parse(value) : value;
            this.state.isLoading = false;
            
            if (this.initialRenderDone) {
                requestAnimationFrame(() => {
                    this.renderPost();
                    this.updateSEOMarkup();
                });
            }
        } catch (e) {
            console.error('Error setting post data:', e);
        }
    }

    get relatedPosts() { return this.state.relatedPosts; }
    set relatedPosts(value) {
        try {
            this.state.relatedPosts = typeof value === 'string' ? JSON.parse(value) : value;
            if (this.initialRenderDone) {
                requestAnimationFrame(() => this.renderRelatedPosts());
            }
        } catch (e) {
            console.error('Error setting related posts:', e);
        }
    }

    get viewCount() { return this.state.viewCount; }
    set viewCount(value) {
        try {
            this.state.viewCount = typeof value === 'string' ? parseInt(value) : value;
            if (this.initialRenderDone) {
                this.updateViewCount();
            }
        } catch (e) {
            console.error('Error setting view count:', e);
        }
    }

    getDefaultStyleProps() {
        return {
            // Recipe/Chef themed colors - warm, inviting, culinary palette
            fontFamily: 'Georgia, "Times New Roman", serif',
            bgColor: '#FFF8F0', // Cream background
            h1Color: '#8B4513', // Saddle Brown
            h2Color: '#D2691E', // Chocolate
            h3Color: '#CD853F', // Peru
            h4Color: '#A0522D', // Sienna
            h5Color: '#8B4513', // Saddle Brown
            h6Color: '#A0522D', // Sienna
            paragraphColor: '#2C1810', // Dark Brown
            linkColor: '#C75C3C', // Terra Cotta
            strongColor: '#8B4513', // Saddle Brown
            blockquoteBg: '#FFF5E6', // Linen
            blockquoteBorder: '#D2691E', // Chocolate
            blockquoteText: '#654321', // Dark Brown
            codeBg: '#F5E6D3', // Wheat
            codeText: '#654321', // Dark Brown
            tableHeaderBg: '#E8B887', // Tan
            tableHeaderText: '#2C1810', // Dark Brown
            tableRowBg: '#FFF8F0', // Cream
            tableRowAltBg: '#FFF5E6', // Linen
            tableText: '#2C1810', // Dark Brown
            tableBorder: '#D2B48C', // Tan
            tocBg: '#FFF5E6', // Linen
            tocBorder: '#D2B48C', // Tan
            tocTitle: '#8B4513', // Saddle Brown
            tocText: '#654321', // Dark Brown
            tocActive: '#C75C3C', // Terra Cotta
            authorBorder: '#D2691E', // Chocolate
            metaText: '#8B7355', // Brown
            shareBg: '#FFF5E6', // Linen
            shareBorder: '#D2B48C', // Tan
            shareText: '#654321', // Dark Brown
            shareHover: '#C75C3C', // Terra Cotta
            tagBg: '#FFE4B5', // Moccasin
            tagText: '#8B4513', // Saddle Brown
            tagBorder: '#DEB887', // Burlywood
            relatedCardBg: '#FFFFFF', // White
            relatedCardBorder: '#D2B48C', // Tan
            relatedCategory: '#C75C3C', // Terra Cotta
            relatedTitle: '#2C1810', // Dark Brown
            relatedExcerpt: '#654321', // Dark Brown
            relatedMeta: '#8B7355', // Brown
            viewCountBg: '#FFE4B5', // Moccasin
            viewCountText: '#8B4513', // Saddle Brown
            viewCountBorder: '#DEB887' // Burlywood
        };
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        if (name === 'post-data') {
            this.postData = newValue; 
        } else if (name === 'related-posts') {
            this.relatedPosts = newValue; 
        } else if (name === 'view-count') {
            this.viewCount = newValue;
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

    initializeUI() {
        this.innerHTML = `
            <style>${this.getStyles()}</style>

            <article class="recipe-blog-container">
                <!-- Hero Section with Chef Badge -->
                <header class="recipe-hero" id="recipeHero">
                    <div class="hero-overlay">
                        <div class="chef-badge-container">
                            <div class="chef-badge" id="chefBadge">
                                <img class="chef-avatar" id="chefAvatar" alt="Chef" />
                                <div class="chef-hat">👨‍🍳</div>
                            </div>
                            <div class="chef-info" id="chefInfo"></div>
                        </div>
                    </div>
                </header>

                <!-- Recipe Title Card -->
                <section class="recipe-title-card">
                    <div class="recipe-category" id="recipeCategory"></div>
                    <h1 class="recipe-title" id="recipeTitle"></h1>
                    <div class="recipe-meta-bar" id="recipeMetaBar"></div>
                </section>

                <!-- Main Content Container -->
                <div class="recipe-content-wrapper">
                    <!-- Recipe Details Sidebar -->
                    <aside class="recipe-sidebar">
                        <div class="recipe-quick-facts" id="recipeQuickFacts">
                            <div class="fact-title">📋 Recipe Info</div>
                        </div>
                        
                        <div class="recipe-tools" id="recipeTools">
                            <div class="tools-title">🔪 Kitchen Tools</div>
                        </div>

                        <div class="share-recipe" id="shareRecipe">
                            <div class="share-title">📤 Share Recipe</div>
                            <div class="share-buttons" id="shareButtons"></div>
                        </div>
                    </aside>

                    <!-- Main Recipe Content -->
                    <main class="recipe-main-content">
                        <article class="recipe-article" id="recipeArticle"></article>
                        
                        <section class="chef-notes" id="chefNotes" style="display: none;"></section>
                        
                        <section class="recipe-tags" id="recipeTags" style="display: none;"></section>
                    </main>
                </div>

                <!-- Related Recipes -->
                <section class="related-recipes" id="relatedRecipes" style="display: none;"></section>
            </article>
        `;

        this.recipeHero = this.querySelector('#recipeHero');
        this.chefBadge = this.querySelector('#chefBadge');
        this.chefAvatar = this.querySelector('#chefAvatar');
        this.chefInfo = this.querySelector('#chefInfo');
        this.recipeCategory = this.querySelector('#recipeCategory');
        this.recipeTitle = this.querySelector('#recipeTitle');
        this.recipeMetaBar = this.querySelector('#recipeMetaBar');
        this.recipeQuickFacts = this.querySelector('#recipeQuickFacts');
        this.recipeTools = this.querySelector('#recipeTools');
        this.shareRecipe = this.querySelector('#shareRecipe');
        this.shareButtons = this.querySelector('#shareButtons');
        this.recipeArticle = this.querySelector('#recipeArticle');
        this.chefNotes = this.querySelector('#chefNotes');
        this.recipeTags = this.querySelector('#recipeTags');
        this.relatedRecipes = this.querySelector('#relatedRecipes');
        
        this.initialRenderDone = true;
        
        if (this.state.isLoading) {
            this.showLoading();
        } else if (this.state.postData) {
            this.renderPost();
            this.updateSEOMarkup();
        }

        if (this.state.relatedPosts && this.state.relatedPosts.length > 0) {
            this.renderRelatedPosts();
        }
    }

    getStyles() {
        const {
            fontFamily, bgColor, h1Color, h2Color, h3Color, h4Color, h5Color, h6Color,
            paragraphColor, linkColor, strongColor, blockquoteBg, blockquoteBorder, blockquoteText,
            codeBg, codeText, tableHeaderBg, tableHeaderText, tableRowBg, tableRowAltBg, tableText, tableBorder,
            tocBg, tocBorder, tocTitle, tocText, tocActive, authorBorder, metaText,
            shareBg, shareBorder, shareText, shareHover, tagBg, tagText, tagBorder,
            relatedCardBg, relatedCardBorder, relatedCategory, relatedTitle, relatedExcerpt, relatedMeta,
            viewCountBg, viewCountText, viewCountBorder
        } = this.styleProps;
        
        return `
            recipe-chef-blog-viewer {
                display: block;
                width: 100%;
                font-family: ${fontFamily};
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            recipe-chef-blog-viewer * { box-sizing: border-box; }
            
            recipe-chef-blog-viewer .recipe-blog-container {
                background-color: ${bgColor};
                min-height: 100vh;
            }
            
            /* Hero Section with Chef Badge */
            recipe-chef-blog-viewer .recipe-hero {
                width: 100%;
                height: 500px;
                position: relative;
                overflow: hidden;
                background: linear-gradient(135deg, ${h2Color} 0%, ${h1Color} 100%);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            recipe-chef-blog-viewer .hero-overlay {
                position: relative;
                z-index: 2;
                text-align: center;
            }
            
            /* Large Chef Badge */
            recipe-chef-blog-viewer .chef-badge-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 30px;
            }
            
            recipe-chef-blog-viewer .chef-badge {
                position: relative;
                width: 220px;
                height: 220px;
                background: ${bgColor};
                border-radius: 50%;
                border: 8px solid ${authorBorder};
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4),
                            0 0 0 16px rgba(210, 105, 30, 0.2);
                padding: 8px;
                animation: float 3s ease-in-out infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-15px); }
            }
            
            recipe-chef-blog-viewer .chef-avatar {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
                border: 4px solid ${bgColor};
            }
            
            /* Chef Hat Badge */
            recipe-chef-blog-viewer .chef-hat {
                position: absolute;
                top: -20px;
                right: -10px;
                width: 70px;
                height: 70px;
                background: ${bgColor};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 36px;
                border: 4px solid ${authorBorder};
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            }
            
            /* Chef Info */
            recipe-chef-blog-viewer .chef-info {
                text-align: center;
            }
            
            recipe-chef-blog-viewer .chef-name {
                font-size: 32px;
                font-weight: 900;
                color: ${bgColor};
                margin: 0 0 10px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                letter-spacing: 1px;
            }
            
            recipe-chef-blog-viewer .chef-title {
                font-size: 18px;
                color: ${bgColor};
                font-weight: 600;
                opacity: 0.95;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            
            /* Recipe Title Card */
            recipe-chef-blog-viewer .recipe-title-card {
                max-width: 900px;
                margin: -80px auto 60px;
                position: relative;
                z-index: 3;
                background: white;
                padding: 50px;
                border-radius: 30px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                border: 3px solid ${tableBorder};
            }
            
            recipe-chef-blog-viewer .recipe-category {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: ${tagBg};
                color: ${tagText};
                padding: 10px 24px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 24px;
                border: 2px solid ${tagBorder};
            }
            
            recipe-chef-blog-viewer .recipe-category::before {
                content: '🍽️';
                font-size: 18px;
            }
            
            recipe-chef-blog-viewer .recipe-title {
                font-size: clamp(32px, 5vw, 56px);
                font-weight: 900;
                color: ${h1Color};
                line-height: 1.2;
                margin: 0 0 30px;
                text-align: center;
            }
            
            recipe-chef-blog-viewer .recipe-meta-bar {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 30px;
                flex-wrap: wrap;
                padding-top: 30px;
                border-top: 2px solid ${tableBorder};
                font-size: 15px;
                color: ${metaText};
            }
            
            recipe-chef-blog-viewer .meta-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
            }
            
            recipe-chef-blog-viewer .meta-divider {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: ${tocActive};
            }
            
            /* Content Wrapper */
            recipe-chef-blog-viewer .recipe-content-wrapper {
                max-width: 1400px;
                margin: 0 auto;
                padding: 0 40px 80px;
                display: grid;
                grid-template-columns: 350px 1fr;
                gap: 60px;
                align-items: start;
            }
            
            /* Recipe Sidebar */
            recipe-chef-blog-viewer .recipe-sidebar {
                position: sticky;
                top: 20px;
            }
            
            recipe-chef-blog-viewer .recipe-quick-facts,
            recipe-chef-blog-viewer .recipe-tools,
            recipe-chef-blog-viewer .share-recipe {
                background: white;
                border: 3px solid ${tableBorder};
                border-radius: 20px;
                padding: 30px;
                margin-bottom: 30px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            }
            
            recipe-chef-blog-viewer .fact-title,
            recipe-chef-blog-viewer .tools-title,
            recipe-chef-blog-viewer .share-title {
                font-size: 18px;
                font-weight: 900;
                color: ${h2Color};
                margin: 0 0 20px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            recipe-chef-blog-viewer .fact-list,
            recipe-chef-blog-viewer .tools-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            recipe-chef-blog-viewer .fact-item,
            recipe-chef-blog-viewer .tool-item {
                padding: 12px 0;
                border-bottom: 1px solid ${tableBorder};
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 15px;
            }
            
            recipe-chef-blog-viewer .fact-item:last-child,
            recipe-chef-blog-viewer .tool-item:last-child {
                border-bottom: none;
            }
            
            recipe-chef-blog-viewer .fact-label,
            recipe-chef-blog-viewer .tool-name {
                color: ${metaText};
                font-weight: 600;
            }
            
            recipe-chef-blog-viewer .fact-value {
                color: ${paragraphColor};
                font-weight: 700;
            }
            
            /* Share Buttons */
            recipe-chef-blog-viewer .share-buttons {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
            
            recipe-chef-blog-viewer .share-btn {
                padding: 12px;
                border-radius: 12px;
                border: 2px solid ${shareBorder};
                background: ${shareBg};
                color: ${shareText};
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 14px;
                font-weight: 700;
            }
            
            recipe-chef-blog-viewer .share-btn svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }
            
            recipe-chef-blog-viewer .share-btn:hover {
                background: ${shareHover};
                color: white;
                border-color: ${shareHover};
                transform: translateY(-3px);
                box-shadow: 0 6px 20px rgba(199, 92, 60, 0.3);
            }
            
            /* Main Recipe Content */
            recipe-chef-blog-viewer .recipe-main-content {
                background: white;
                border: 3px solid ${tableBorder};
                border-radius: 20px;
                padding: 60px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            }
            
            recipe-chef-blog-viewer .recipe-article {
                font-size: 18px;
                line-height: 1.9;
                color: ${paragraphColor};
            }
            
            /* Typography */
            recipe-chef-blog-viewer .recipe-article h2 {
                font-size: clamp(28px, 4vw, 40px);
                font-weight: 900;
                color: ${h2Color};
                margin: 60px 0 24px;
                line-height: 1.3;
                padding-left: 30px;
                border-left: 6px solid ${h2Color};
                position: relative;
            }
            
            recipe-chef-blog-viewer .recipe-article h2::before {
                content: '🔸';
                position: absolute;
                left: -20px;
                top: 0;
            }
            
            recipe-chef-blog-viewer .recipe-article h3 {
                font-size: clamp(24px, 3vw, 32px);
                font-weight: 800;
                color: ${h3Color};
                margin: 50px 0 20px;
                line-height: 1.3;
            }
            
            recipe-chef-blog-viewer .recipe-article h4 {
                font-size: clamp(20px, 2.5vw, 26px);
                font-weight: 700;
                color: ${h4Color};
                margin: 40px 0 16px;
            }
            
            recipe-chef-blog-viewer .recipe-article h5 {
                font-size: clamp(18px, 2vw, 22px);
                font-weight: 700;
                color: ${h5Color};
                margin: 30px 0 14px;
            }
            
            recipe-chef-blog-viewer .recipe-article h6 {
                font-size: clamp(16px, 1.8vw, 20px);
                font-weight: 700;
                color: ${h6Color};
                margin: 30px 0 14px;
            }
            
            recipe-chef-blog-viewer .recipe-article p {
                margin-bottom: 28px;
                line-height: 1.9;
            }
            
            recipe-chef-blog-viewer .recipe-article a {
                color: ${linkColor};
                text-decoration: none;
                font-weight: 700;
                border-bottom: 2px solid ${linkColor};
                transition: opacity 0.2s;
                padding-bottom: 2px;
            }
            
            recipe-chef-blog-viewer .recipe-article a:hover {
                opacity: 0.7;
            }
            
            recipe-chef-blog-viewer .recipe-article strong {
                font-weight: 800;
                color: ${strongColor};
            }
            
            recipe-chef-blog-viewer .recipe-article em {
                font-style: italic;
            }
            
            recipe-chef-blog-viewer .recipe-article ul,
            recipe-chef-blog-viewer .recipe-article ol {
                margin-bottom: 28px;
                padding-left: 30px;
            }
            
            recipe-chef-blog-viewer .recipe-article li {
                margin-bottom: 12px;
                line-height: 1.8;
                position: relative;
            }
            
            recipe-chef-blog-viewer .recipe-article ul li::marker {
                content: '🔹 ';
            }
            
            recipe-chef-blog-viewer .recipe-article blockquote {
                margin: 40px 0;
                padding: 30px 40px;
                background: ${blockquoteBg};
                border-left: 6px solid ${blockquoteBorder};
                border-radius: 0 16px 16px 0;
                font-size: 20px;
                font-style: italic;
                color: ${blockquoteText};
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                position: relative;
            }
            
            recipe-chef-blog-viewer .recipe-article blockquote::before {
                content: '👨‍🍳';
                position: absolute;
                top: 20px;
                left: -30px;
                font-size: 40px;
            }
            
            recipe-chef-blog-viewer .recipe-article code {
                background: ${codeBg};
                padding: 4px 10px;
                border-radius: 6px;
                font-family: 'Monaco', 'Courier New', monospace;
                font-size: 0.9em;
                color: ${codeText};
                border: 1px solid ${tableBorder};
            }
            
            recipe-chef-blog-viewer .recipe-article pre {
                background: ${codeBg};
                padding: 24px;
                border-radius: 12px;
                overflow-x: auto;
                margin: 40px 0;
                border: 2px solid ${tableBorder};
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            }
            
            recipe-chef-blog-viewer .recipe-article pre code {
                background: transparent;
                padding: 0;
                border: none;
                font-size: 15px;
            }
            
            recipe-chef-blog-viewer .recipe-article img {
                max-width: 100%;
                height: auto;
                border-radius: 16px;
                margin: 40px auto;
                display: block;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
                border: 4px solid ${tableBorder};
            }
            
            recipe-chef-blog-viewer .recipe-article hr {
                border: none;
                border-top: 3px dashed ${tableBorder};
                margin: 60px 0;
            }
            
            /* Tables */
            recipe-chef-blog-viewer .table-wrapper {
                overflow-x: auto;
                margin: 40px 0;
                border-radius: 12px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            }
            
            recipe-chef-blog-viewer .recipe-article table {
                width: 100%;
                border-collapse: collapse;
                background: ${tableRowBg};
                border: 2px solid ${tableBorder};
            }
            
            recipe-chef-blog-viewer .recipe-article table th,
            recipe-chef-blog-viewer .recipe-article table td {
                padding: 16px 20px;
                text-align: left;
                border-bottom: 1px solid ${tableBorder};
                color: ${tableText};
            }
            
            recipe-chef-blog-viewer .recipe-article table th {
                background: ${tableHeaderBg};
                color: ${tableHeaderText};
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-size: 14px;
            }
            
            recipe-chef-blog-viewer .recipe-article table tbody tr:nth-child(even) {
                background: ${tableRowAltBg};
            }
            
            /* Video Embeds */
            recipe-chef-blog-viewer .video-embed {
                position: relative;
                padding-bottom: 56.25%;
                height: 0;
                overflow: hidden;
                margin: 40px 0;
                border-radius: 16px;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
                border: 4px solid ${tableBorder};
            }
            
            recipe-chef-blog-viewer .video-embed iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 0;
            }
            
            /* Chef Notes */
            recipe-chef-blog-viewer .chef-notes {
                background: linear-gradient(135deg, ${blockquoteBg} 0%, ${bgColor} 100%);
                border: 3px solid ${blockquoteBorder};
                border-radius: 20px;
                padding: 40px;
                margin: 60px 0;
                position: relative;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            }
            
            recipe-chef-blog-viewer .chef-notes::before {
                content: '👨‍🍳';
                position: absolute;
                top: -30px;
                left: 40px;
                font-size: 50px;
                background: white;
                padding: 10px;
                border-radius: 50%;
                border: 3px solid ${blockquoteBorder};
            }
            
            recipe-chef-blog-viewer .chef-notes-title {
                font-size: 24px;
                font-weight: 900;
                color: ${h2Color};
                margin: 0 0 20px;
                padding-top: 20px;
            }
            
            recipe-chef-blog-viewer .chef-notes-content {
                font-size: 17px;
                line-height: 1.8;
                color: ${paragraphColor};
            }
            
            /* Recipe Tags */
            recipe-chef-blog-viewer .recipe-tags {
                margin-top: 60px;
                padding-top: 40px;
                border-top: 3px dashed ${tableBorder};
            }
            
            recipe-chef-blog-viewer .tags-title {
                font-size: 18px;
                font-weight: 900;
                color: ${h2Color};
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            recipe-chef-blog-viewer .tags-container {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            recipe-chef-blog-viewer .tag {
                background: ${tagBg};
                color: ${tagText};
                padding: 10px 20px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 700;
                border: 2px solid ${tagBorder};
                transition: all 0.3s;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            
            recipe-chef-blog-viewer .tag::before {
                content: '#';
                opacity: 0.6;
            }
            
            recipe-chef-blog-viewer .tag:hover {
                background: ${tagBorder};
                transform: translateY(-3px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
            }
            
            /* Related Recipes */
            recipe-chef-blog-viewer .related-recipes {
                max-width: 1400px;
                margin: 80px auto 0;
                padding: 80px 40px;
                background: linear-gradient(135deg, ${blockquoteBg} 0%, white 100%);
                border-top: 4px solid ${tableBorder};
            }
            
            recipe-chef-blog-viewer .related-title {
                font-size: 42px;
                font-weight: 900;
                color: ${h1Color};
                text-align: center;
                margin-bottom: 50px;
            }
            
            recipe-chef-blog-viewer .related-title::before {
                content: '🍳 ';
            }
            
            recipe-chef-blog-viewer .related-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 30px;
            }
            
            recipe-chef-blog-viewer .related-card {
                background: ${relatedCardBg};
                border: 3px solid ${relatedCardBorder};
                border-radius: 20px;
                overflow: hidden;
                transition: all 0.3s;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            }
            
            recipe-chef-blog-viewer .related-card:hover {
                transform: translateY(-10px);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                border-color: ${relatedCategory};
            }
            
            recipe-chef-blog-viewer .related-image {
                width: 100%;
                height: 220px;
                object-fit: cover;
                border-bottom: 3px solid ${tableBorder};
            }
            
            recipe-chef-blog-viewer .related-content {
                padding: 24px;
            }
            
            recipe-chef-blog-viewer .related-category {
                display: inline-block;
                background: ${tagBg};
                color: ${relatedCategory};
                padding: 6px 14px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 800;
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                border: 2px solid ${tagBorder};
            }
            
            recipe-chef-blog-viewer .related-recipe-title {
                font-size: 20px;
                font-weight: 900;
                color: ${relatedTitle};
                margin-bottom: 12px;
                line-height: 1.4;
            }
            
            recipe-chef-blog-viewer .related-excerpt {
                font-size: 14px;
                color: ${relatedExcerpt};
                line-height: 1.6;
            }
            
            /* View Count Badge */
            recipe-chef-blog-viewer .view-count-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: ${viewCountBg};
                border: 2px solid ${viewCountBorder};
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 700;
                color: ${viewCountText};
            }
            
            recipe-chef-blog-viewer .view-count-badge svg {
                width: 16px;
                height: 16px;
                fill: currentColor;
            }
            
            /* Responsive */
            @media (max-width: 1200px) {
                recipe-chef-blog-viewer .recipe-content-wrapper {
                    grid-template-columns: 1fr;
                    gap: 40px;
                }
                
                recipe-chef-blog-viewer .recipe-sidebar {
                    position: relative;
                    top: 0;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                }
                
                recipe-chef-blog-viewer .related-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
            
            @media (max-width: 768px) {
                recipe-chef-blog-viewer .recipe-hero {
                    height: 400px;
                }
                
                recipe-chef-blog-viewer .chef-badge {
                    width: 180px;
                    height: 180px;
                }
                
                recipe-chef-blog-viewer .chef-hat {
                    width: 60px;
                    height: 60px;
                    font-size: 30px;
                }
                
                recipe-chef-blog-viewer .chef-name {
                    font-size: 26px;
                }
                
                recipe-chef-blog-viewer .recipe-title-card {
                    margin: -60px 20px 40px;
                    padding: 30px;
                }
                
                recipe-chef-blog-viewer .recipe-content-wrapper {
                    padding: 0 20px 60px;
                }
                
                recipe-chef-blog-viewer .recipe-main-content {
                    padding: 30px;
                }
                
                recipe-chef-blog-viewer .recipe-article {
                    font-size: 17px;
                }
                
                recipe-chef-blog-viewer .recipe-sidebar {
                    grid-template-columns: 1fr;
                }
                
                recipe-chef-blog-viewer .related-grid {
                    grid-template-columns: 1fr;
                }
                
                recipe-chef-blog-viewer .share-buttons {
                    grid-template-columns: 1fr;
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

    showLoading() {
        this.recipeArticle.innerHTML = '<p style="text-align: center; color: ' + this.styleProps.metaText + '; padding: 60px 20px;">Loading recipe...</p>';
    }

    renderPost() {
        if (!this.state.postData || !this.initialRenderDone) return;
        
        const post = this.state.postData;
        const viewCount = this.state.viewCount || post.viewCount || 0;
        
        // Hero Background
        const featuredImageUrl = this._convertWixImageUrl(post.featuredImage);
        this.recipeHero.style.backgroundImage = `url(${featuredImageUrl})`;
        this.recipeHero.style.backgroundSize = 'cover';
        this.recipeHero.style.backgroundPosition = 'center';
        
        // Chef Avatar (Large)
        const authorImageUrl = this._convertWixImageUrl(post.authorImage);
        this.chefAvatar.src = authorImageUrl;
        this.chefAvatar.alt = post.author || 'Chef';
        
        // Chef Info
        this.chefInfo.innerHTML = `
            <div class="chef-name">${this._escapeHtml(post.author || 'Anonymous Chef')}</div>
            <div class="chef-title">Recipe by Chef ${this._escapeHtml(post.author || 'Anonymous')}</div>
        `;
        
        // Recipe Category
        if (post.category) {
            this.recipeCategory.textContent = post.category;
            this.recipeCategory.style.display = 'inline-flex';
        }
        
        // Recipe Title
        this.recipeTitle.textContent = post.blogTitle || post.title || 'Untitled Recipe';
        
        // Recipe Meta Bar
        this.recipeMetaBar.innerHTML = `
            <div class="meta-item">
                📅 ${this._formatDate(post.publishedDate)}
            </div>
            <div class="meta-divider"></div>
            <div class="meta-item">
                ⏱️ ${post.readTime || '5'} min read
            </div>
            <div class="meta-divider"></div>
            <div class="view-count-badge">
                <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                <span id="viewCountNumber">${this._formatNumber(viewCount)}</span>
            </div>
        `;
        
        // Quick Facts (Recipe Info Sidebar)
        this.recipeQuickFacts.innerHTML += `
            <ul class="fact-list">
                <li class="fact-item">
                    <span class="fact-label">🕐 Prep Time</span>
                    <span class="fact-value">15 min</span>
                </li>
                <li class="fact-item">
                    <span class="fact-label">🍳 Cook Time</span>
                    <span class="fact-value">30 min</span>
                </li>
                <li class="fact-item">
                    <span class="fact-label">👥 Servings</span>
                    <span class="fact-value">4 people</span>
                </li>
                <li class="fact-item">
                    <span class="fact-label">📊 Difficulty</span>
                    <span class="fact-value">Medium</span>
                </li>
            </ul>
        `;
        
        // Kitchen Tools
        this.recipeTools.innerHTML += `
            <ul class="tools-list">
                <li class="tool-item">
                    <span class="tool-name">🔪 Chef's Knife</span>
                </li>
                <li class="tool-item">
                    <span class="tool-name">🍳 Frying Pan</span>
                </li>
                <li class="tool-item">
                    <span class="tool-name">🥘 Large Pot</span>
                </li>
                <li class="tool-item">
                    <span class="tool-name">🥄 Mixing Bowl</span>
                </li>
            </ul>
        `;
        
        // Share Buttons
        this.shareButtons.innerHTML = `
            <button class="share-btn" data-share="twitter">
                <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Twitter
            </button>
            <button class="share-btn" data-share="facebook">
                <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
            </button>
            <button class="share-btn" data-share="linkedin">
                <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
            </button>
            <button class="share-btn" data-share="copy">
                <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                Copy
            </button>
        `;
        
        this._setupShareButtons();
        
        // Render Content
        this._renderContent(post.content);
        
        // Chef Notes (if author has bio or special note)
        if (post.author) {
            this.chefNotes.innerHTML = `
                <div class="chef-notes-title">Chef's Notes</div>
                <div class="chef-notes-content">
                    <p>This recipe has been carefully crafted and tested by <strong>${this._escapeHtml(post.author)}</strong>. Follow the steps closely for the best results!</p>
                </div>
            `;
            this.chefNotes.style.display = 'block';
        }
        
        // Tags
        if (post.tags) this._renderTags(post.tags);
    }

    _renderContent(markdown) {
        if (!markdown) return;
        
        let htmlContent;
        try {
            const preprocessed = this._preprocessMarkdown(markdown);
            if (window.marked && window.marked.parse) {
                window.marked.use({ breaks: true, gfm: true, headerIds: true, mangle: false });
                htmlContent = window.marked.parse(preprocessed);
            } else {
                htmlContent = this._simpleMarkdownParse(preprocessed);
            }
        } catch (error) {
            console.error('Parse error:', error);
            htmlContent = this._simpleMarkdownParse(this._preprocessMarkdown(markdown));
        }
        
        htmlContent = this._convertImagesInHTML(htmlContent);
        htmlContent = this._processVideoEmbeds(htmlContent);
        htmlContent = this._processHTMLEmbeds(htmlContent);
        htmlContent = this._wrapTablesForMobile(htmlContent);
        
        this.recipeArticle.innerHTML = htmlContent;
    }

    // [Copy all helper methods from previous variants - _preprocessMarkdown, _simpleMarkdownParse, _parseMarkdownTables, _convertWixImageUrl, etc.]
    
    _preprocessMarkdown(markdown) {
        return this._preprocessMarkdownImages(markdown);
    }

    _preprocessMarkdownImages(markdown) {
        const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
        return markdown.replace(imagePattern, (match, alt, url) => {
            return `<img src="${url}" alt="${alt}" loading="lazy" />`;
        });
    }

    _simpleMarkdownParse(markdown) {
        let html = markdown;
        
        const codeBlocks = [];
        html = html.replace(/```([a-z]*)\n([\s\S]*?)```/gim, (match, lang, code) => {
            const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`;
            codeBlocks.push(`<pre><code class="language-${lang}">${this._escapeHtml(code.trim())}</code></pre>`);
            return placeholder;
        });

        const inlineCodes = [];
        html = html.replace(/`([^`]+)`/gim, (match, code) => {
            const placeholder = `___INLINE_CODE_${inlineCodes.length}___`;
            inlineCodes.push(`<code>${this._escapeHtml(code)}</code>`);
            return placeholder;
        });

        const protectedImages = [];
        html = html.replace(/<img[^>]+>/g, (match) => {
            const placeholder = `___PROTECTED_IMAGE_${protectedImages.length}___`;
            protectedImages.push(match);
            return placeholder;
        });

        html = this._parseMarkdownTables(html);

        html = html.replace(/^######\s+(.*)$/gim, '<h6>$1</h6>');
        html = html.replace(/^#####\s+(.*)$/gim, '<h5>$1</h5>');
        html = html.replace(/^####\s+(.*)$/gim, '<h4>$1</h4>');
        html = html.replace(/^###\s+(.*)$/gim, '<h3>$1</h3>');
        html = html.replace(/^##\s+(.*)$/gim, '<h2>$1</h2>');
        html = html.replace(/^#\s+(.*)$/gim, '<h1>$1</h1>');

        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
        html = html.replace(/~~(.+?)~$/gim, '<del>$1</del>');
        html = html.replace(/\*\*\*([^\*]+)\*\*\*/gim, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*([^\*]+)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/\*([^\*]+)\*/gim, '<em>$1</em>');
        html = html.replace(/^---$/gim, '<hr>');
        html = html.replace(/^\*\*\*$/gim, '<hr>');

        protectedImages.forEach((img, index) => {
            html = html.replace(`___PROTECTED_IMAGE_${index}___`, img);
        });

        inlineCodes.forEach((code, index) => {
            html = html.replace(`___INLINE_CODE_${index}___`, code);
        });

        codeBlocks.forEach((code, index) => {
            html = html.replace(`___CODE_BLOCK_${index}___`, code);
        });

        html = html.replace(/\n\n+/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        html = '<p>' + html + '</p>';
        
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>\s*<\/p>/g, '');
        html = html.replace(/<p>(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<table>)/g, '$1');
        html = html.replace(/(<\/table>)<\/p>/g, '$1');
        html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
        html = html.replace(/<p>(<div class="video-embed">)/g, '$1');
        html = html.replace(/(<\/div>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        
        return html;
    }

    _parseMarkdownTables(markdown) {
        const lines = markdown.split('\n');
        let result = [];
        let inTable = false;
        let tableRows = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.includes('|')) {
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
                const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
                const isSeparator = /^[\s\|:-]+$/.test(nextLine);
                
                if (!inTable && isSeparator && cells.length > 0) {
                    inTable = true;
                    const headerCells = cells.map(cell => `<th>${cell}</th>`).join('');
                    tableRows.push(`<thead><tr>${headerCells}</tr></thead><tbody>`);
                    i++;
                } else if (inTable && cells.length > 0) {
                    const dataCells = cells.map(cell => `<td>${cell}</td>`).join('');
                    tableRows.push(`<tr>${dataCells}</tr>`);
                } else if (!inTable) {
                    result.push(line);
                }
            } else {
                if (inTable && tableRows.length > 0) {
                    tableRows.push('</tbody>');
                    result.push(`<table>${tableRows.join('')}</table>`);
                    tableRows = [];
                    inTable = false;
                }
                result.push(line);
            }
        }
        
        if (inTable && tableRows.length > 0) {
            tableRows.push('</tbody>');
            result.push(`<table>${tableRows.join('')}</table>`);
        }
        
        return result.join('\n');
    }

    _convertWixImageUrl(wixUrl) {
        if (!wixUrl || typeof wixUrl !== 'string') return 'https://static.wixstatic.com/media/default-image.jpg';
        if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) return wixUrl;

        if (wixUrl.startsWith('wix:image://')) {
            try {
                const parts = wixUrl.split('/');
                const fileId = parts[3]?.split('#')[0];
                if (fileId) return `https://static.wixstatic.com/media/${fileId}`;
            } catch (e) {
                console.error('Error parsing Wix image URL:', wixUrl, e);
            }
        }
        return 'https://static.wixstatic.com/media/default-image.jpg';
    }

    _convertImagesInHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = html;
        
        const images = template.content.querySelectorAll('img');
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src) {
                const convertedSrc = this._convertWixImageUrl(src);
                img.setAttribute('src', convertedSrc);
                img.setAttribute('loading', 'lazy');
                img.setAttribute('decoding', 'async');
                img.setAttribute('onerror', "this.src='https://static.wixstatic.com/media/default-image.jpg'");
            }
        });
        
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(template.content);
        return tempDiv.innerHTML;
    }

    _processVideoEmbeds(html) {
        html = html.replace(/\[youtube:([a-zA-Z0-9_-]+)\]/g, (match, videoId) => {
            return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen title="YouTube video"></iframe></div>`;
        });

        html = html.replace(/\[vimeo:(\d+)\]/g, (match, videoId) => {
            return `<div class="video-embed"><iframe src="https://player.vimeo.com/video/${videoId}" allowfullscreen title="Vimeo video"></iframe></div>`;
        });

        return html;
    }

    _processHTMLEmbeds(html) {
        html = html.replace(/\[html\]([\s\S]*?)\[\/html\]/g, (match, htmlCode) => {
            return htmlCode;
        });

        return html;
    }

    _wrapTablesForMobile(html) {
        return html.replace(/<table>/g, '<div class="table-wrapper"><table>').replace(/<\/table>/g, '</table></div>');
    }

    _renderTags(tags) {
        const tagArray = tags.split(',').map(t => t.trim());
        this.recipeTags.innerHTML = `
            <div class="tags-title">🏷️ Recipe Tags</div>
            <div class="tags-container">
                ${tagArray.map(tag => `<span class="tag">${this._escapeHtml(tag)}</span>`).join('')}
            </div>
        `;
        this.recipeTags.style.display = 'block';
    }

    renderRelatedPosts() {
        if (!this.state.relatedPosts || this.state.relatedPosts.length === 0) return;
        
        const posts = this.state.relatedPosts;
        this.relatedRecipes.innerHTML = `
            <h2 class="related-title">More Delicious Recipes</h2>
            <div class="related-grid">
                ${posts.map(post => `
                    <div class="related-card" data-slug="${post.slug}">
                        <img src="${this._convertWixImageUrl(post.featuredImage)}" alt="${this._escapeHtml(post.blogTitle || post.title)}" class="related-image" loading="lazy" />
                        <div class="related-content">
                            ${post.category ? `<span class="related-category">${this._escapeHtml(post.category)}</span>` : ''}
                            <h3 class="related-recipe-title">${this._escapeHtml(post.blogTitle || post.title)}</h3>
                            <p class="related-excerpt">${this._escapeHtml(post.excerpt || '')}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        this.relatedRecipes.style.display = 'block';

        this.querySelectorAll('.related-card').forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.getAttribute('data-slug');
                this._navigateToPost(slug);
            });
        });
    }

    updateViewCount() {
        const el = this.querySelector('#viewCountNumber');
        if (el) el.textContent = this._formatNumber(this.state.viewCount);
    }

    updateSEOMarkup() {
        if (!this.state.postData || !this.initialRenderDone) return;

        const post = this.state.postData;
        let seoHTML = '';

        if (post.content) {
            let contentHTML = this._simpleMarkdownParse(post.content);
            contentHTML = this._convertImagesInHTML(contentHTML);
            contentHTML = this._processVideoEmbeds(contentHTML);
            contentHTML = this._processHTMLEmbeds(contentHTML);
            seoHTML += `<div class="blog-content">${contentHTML}</div>`;
        }

        seoHTML += `<div class="post-footer">`;
        seoHTML += `<strong>${this._escapeHtml(post.author || 'Anonymous')}</strong>`;
        seoHTML += `<span>${this._formatDate(post.publishedDate)}</span>`;
        seoHTML += `<span>${post.readTime || '5'} min read</span>`;
        seoHTML += `</div>`;

        if (post.tags) {
            const tags = post.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            if (tags.length > 0) {
                seoHTML += `<div class="tags-section">`;
                seoHTML += `<strong>Tags:</strong> `;
                seoHTML += tags.map(tag => `<span>${this._escapeHtml(tag)}</span>`).join(', ');
                seoHTML += `</div>`;
            }
        }

        if (this.state.relatedPosts && this.state.relatedPosts.length > 0) {
            seoHTML += `<div class="related-posts"><h2>Related Recipes</h2><ul>`;
            this.state.relatedPosts.forEach(relatedPost => {
                const displayTitle = relatedPost.blogTitle || relatedPost.title || 'Untitled';
                seoHTML += `<li><a href="/blog-post/${relatedPost.slug}">${this._escapeHtml(displayTitle)}</a></li>`;
            });
            seoHTML += `</ul></div>`;
        }

        this.dispatchEvent(new CustomEvent('seo-markup-ready', {
            detail: { markup: seoHTML }, bubbles: true, composed: true
        }));
    }

    _setupShareButtons() {
        const shareButtons = this.querySelectorAll('[data-share]');
        shareButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = btn.getAttribute('data-share');
                this._handleShare(type);
            });
        });
    }

    _handleShare(type) {
        const url = window.location.href;
        const title = this.state.postData?.blogTitle || this.state.postData?.title || '';

        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        };

        if (type === 'copy') {
            navigator.clipboard.writeText(url).then(() => {
                alert('Recipe link copied! 🎉');
            }).catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Recipe link copied! 🎉');
            });
        } else if (shareUrls[type]) {
            window.open(shareUrls[type], '_blank', 'width=600,height=400');
        }
    }

    _navigateToPost(slug) {
        this.dispatchEvent(new CustomEvent('navigate-to-post', {
            detail: { slug }, bubbles: true, composed: true
        }));
    }

    _formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    _formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num.toString();
    }

    _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadMarkedJS() {
        if (window.marked) {
            this.markedLoaded = true;
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
        script.async = true;
        script.onload = () => {
            this.markedLoaded = true;
            if (this.state.postData && this.initialRenderDone) this.renderPost();
        };
        document.head.appendChild(script);
    }

    connectedCallback() {
        if (!this.initialRenderDone) this.initializeUI();
        this.loadMarkedJS();
    }

    disconnectedCallback() {}
}

customElements.define('recipe-chef-blog-viewer', RecipeChefBlogViewer);
