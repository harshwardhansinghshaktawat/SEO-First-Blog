class BlogEditorDashboard extends HTMLElement {
    constructor() {
        super();
        console.log('📝 Blog Editor: Initializing with Quill...');
        
        this._shadow = this.attachShadow({ mode: 'open' });
        
        // Editor state
        this._quill = null;
        this._editorReady = false;
        this._editingItemId = null;
        this._quillLoaded = false;
        
        // Form data
        this._formData = {
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            featuredImage: null,
            author: '',
            authorImage: null,
            category: '',
            tags: [],
            status: 'draft',
            publishedDate: new Date().toISOString(),
            modifiedDate: new Date().toISOString(),
            readTime: 0,
            viewCount: 0,
            seoTitle: '',
            seoDescription: '',
            seoOgImage: null,
            seoKeywords: '',
            isFeatured: false
        };
        
        this._createStructure();
        console.log('📝 Blog Editor: Complete');
    }
    
    static get observedAttributes() {
        return ['notification', 'image-upload-result', 'blog-posts-data', 'edit-data'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || newValue === oldValue) return;
        
        if (name === 'notification') {
            try {
                const notification = JSON.parse(newValue);
                this._showToast(notification.type, notification.message);
            } catch (e) {
                console.error('📝 Blog Editor: Notification error:', e);
            }
        }
        
        if (name === 'image-upload-result') {
            try {
                const result = JSON.parse(newValue);
                this._handleImageUploadResult(result);
            } catch (e) {
                console.error('📝 Blog Editor: Image upload result error:', e);
            }
        }
        
        if (name === 'blog-posts-data') {
            try {
                const data = JSON.parse(newValue);
                this._renderBlogPosts(data);
            } catch (e) {
                console.error('📝 Blog Editor: Blog posts data error:', e);
            }
        }
        
        if (name === 'edit-data') {
            try {
                const data = JSON.parse(newValue);
                this._loadEditData(data);
            } catch (e) {
                console.error('📝 Blog Editor: Edit data error:', e);
            }
        }
    }
    
    connectedCallback() {
        console.log('📝 Blog Editor: Connected to DOM');
        
        this._loadQuill(() => {
            this._setupEventListeners();
            this._initializeQuill();
            this._dispatchEvent('load-blog-posts', {});
        });
    }
    
    _loadQuill(callback) {
        console.log('📝 Blog Editor: Loading Quill...');
        
        if (window.Quill) {
            console.log('📝 Blog Editor: Quill already loaded');
            this._quillLoaded = true;
            callback();
            return;
        }
        
        // Load Quill CSS to document head
        const quillCss = document.createElement('link');
        quillCss.rel = 'stylesheet';
        quillCss.href = 'https://cdn.quilljs.com/1.3.7/quill.snow.css';
        document.head.appendChild(quillCss);
        
        // Load Quill JS
        const quillScript = document.createElement('script');
        quillScript.src = 'https://cdn.quilljs.com/1.3.7/quill.min.js';
        quillScript.onload = () => {
            console.log('📝 Blog Editor: ✅ Quill loaded');
            this._quillLoaded = true;
            callback();
        };
        quillScript.onerror = (error) => {
            console.error('📝 Blog Editor: ❌ Failed to load Quill', error);
            this._showToast('error', 'Failed to load editor');
        };
        document.head.appendChild(quillScript);
    }
    
    _createStructure() {
        const root = document.createElement('div');
        root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                @import url('https://cdn.quilljs.com/1.3.7/quill.snow.css');
                
                * { box-sizing: border-box; margin: 0; padding: 0; }
                
                :host {
                    display: block;
                    width: 100%;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    background: #f8f9fa;
                }
                
                .blog-editor-container { 
                    width: 100%; 
                    min-height: 100vh;
                }
                
                .blog-editor-header {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: white;
                    padding: 24px 32px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .blog-editor-header-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                
                .blog-editor-title {
                    font-size: 28px;
                    font-weight: 700;
                }
                
                .blog-editor-subtitle {
                    font-size: 14px;
                    opacity: 0.9;
                    margin-top: 4px;
                }
                
                .blog-editor-header-actions {
                    display: flex;
                    gap: 12px;
                }
                
                .blog-editor-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                
                .blog-editor-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                
                .blog-editor-btn-primary { background: #8b5cf6; color: white; }
                .blog-editor-btn-success { background: #10b981; color: white; }
                .blog-editor-btn-secondary { background: white; color: #6366f1; }
                .blog-editor-btn-danger { background: #ef4444; color: white; }
                
                .blog-editor-main { padding: 32px; }
                
                .blog-editor-content { max-width: 1400px; margin: 0 auto; }
                
                .blog-editor-view-toggle {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                
                .blog-editor-view-btn {
                    padding: 10px 20px;
                    border: 2px solid #e5e7eb;
                    background: white;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                
                .blog-editor-view-btn.active {
                    background: #6366f1;
                    color: white;
                    border-color: #6366f1;
                }
                
                .blog-editor-editor-view, 
                .blog-editor-posts-view { 
                    display: none;
                }
                
                .blog-editor-editor-view.active, 
                .blog-editor-posts-view.active { 
                    display: block;
                }
                
                .blog-editor-layout {
                    display: grid;
                    grid-template-columns: 1fr 400px;
                    gap: 24px;
                }
                
                @media (max-width: 1200px) {
                    .blog-editor-layout {
                        grid-template-columns: 1fr;
                    }
                }
                
                .blog-editor-main-panel {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                
                .blog-editor-wrapper {
                    padding: 0;
                }
                
                #quillEditor {
                    min-height: 600px;
                    background: white;
                }
                
                /* Quill Toolbar Styling */
                .ql-toolbar {
                    background: #f9fafb !important;
                    border: none !important;
                    border-bottom: 2px solid #e5e7eb !important;
                    padding: 16px !important;
                }
                
                .ql-container {
                    border: none !important;
                    font-family: 'Inter', sans-serif;
                    font-size: 16px;
                }
                
                .ql-editor {
                    min-height: 550px;
                    padding: 32px !important;
                    line-height: 1.8;
                }
                
                .ql-editor h1 { font-size: 2.5em; margin: 24px 0 16px; }
                .ql-editor h2 { font-size: 2em; margin: 24px 0 16px; }
                .ql-editor h3 { font-size: 1.75em; margin: 20px 0 12px; }
                .ql-editor h4 { font-size: 1.5em; margin: 16px 0 10px; }
                .ql-editor h5 { font-size: 1.25em; margin: 12px 0 8px; }
                .ql-editor h6 { font-size: 1em; margin: 12px 0 8px; font-weight: 600; }
                
                .ql-editor p { margin-bottom: 16px; }
                
                .ql-editor ul, .ql-editor ol { 
                    padding-left: 24px;
                    margin-bottom: 16px;
                }
                
                .ql-editor li { margin-bottom: 8px; }
                
                .ql-editor blockquote {
                    border-left: 4px solid #6366f1;
                    padding-left: 16px;
                    margin: 16px 0;
                    color: #6b7280;
                    font-style: italic;
                }
                
                .ql-editor pre {
                    background: #1f2937;
                    color: #f9fafb;
                    padding: 16px;
                    border-radius: 8px;
                    overflow-x: auto;
                    margin: 16px 0;
                }
                
                .ql-editor code {
                    background: #f3f4f6;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Monaco', 'Consolas', monospace;
                }
                
                .ql-editor pre code {
                    background: transparent;
                    color: inherit;
                    padding: 0;
                }
                
                .ql-editor img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 16px 0;
                }
                
                /* Toolbar button styling */
                .ql-toolbar button:hover,
                .ql-toolbar button:focus,
                .ql-toolbar button.ql-active {
                    color: #6366f1 !important;
                }
                
                .ql-toolbar .ql-stroke {
                    stroke: #374151;
                }
                
                .ql-toolbar button:hover .ql-stroke,
                .ql-toolbar button.ql-active .ql-stroke {
                    stroke: #6366f1;
                }
                
                .ql-toolbar .ql-fill {
                    fill: #374151;
                }
                
                .ql-toolbar button:hover .ql-fill,
                .ql-toolbar button.ql-active .ql-fill {
                    fill: #6366f1;
                }
                
                .blog-editor-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .blog-editor-section {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .blog-editor-section-title {
                    font-size: 16px;
                    font-weight: 700;
                    margin-bottom: 16px;
                    color: #1f2937;
                }
                
                .blog-editor-form-group { margin-bottom: 16px; }
                .blog-editor-form-group:last-child { margin-bottom: 0; }
                
                .blog-editor-label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 6px;
                    color: #374151;
                    font-size: 13px;
                }
                
                .blog-editor-input, .blog-editor-textarea, .blog-editor-select {
                    width: 100%;
                    padding: 10px 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }
                
                .blog-editor-input:focus, .blog-editor-textarea:focus, .blog-editor-select:focus {
                    outline: none;
                    border-color: #6366f1;
                }
                
                .blog-editor-textarea { resize: vertical; min-height: 80px; }
                
                .blog-editor-checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .blog-editor-checkbox {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }
                
                .blog-editor-image-upload-area {
                    border: 2px dashed #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .blog-editor-image-upload-area:hover {
                    border-color: #6366f1;
                    background: #f9fafb;
                }
                
                .blog-editor-image-preview {
                    width: 100%;
                    max-height: 200px;
                    object-fit: cover;
                    border-radius: 8px;
                    margin-top: 12px;
                }
                
                .blog-editor-tag-input-wrapper {
                    display: flex;
                    gap: 8px;
                }
                
                .blog-editor-tags-display {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 8px;
                }
                
                .blog-editor-tag-chip {
                    background: #ede9fe;
                    color: #6366f1;
                    padding: 4px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .blog-editor-tag-remove {
                    cursor: pointer;
                    font-weight: 700;
                }
                
                .blog-editor-posts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 24px;
                }
                
                .blog-editor-post-card {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: all 0.3s;
                }
                
                .blog-editor-post-card:hover {
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    transform: translateY(-4px);
                }
                
                .blog-editor-post-card-image {
                    width: 100%;
                    height: 180px;
                    object-fit: cover;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                }
                
                .blog-editor-post-card-body { padding: 20px; }
                
                .blog-editor-post-status {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 12px;
                }
                
                .blog-editor-status-published { background: #d1fae5; color: #065f46; }
                .blog-editor-status-draft { background: #fee2e2; color: #991b1b; }
                
                .blog-editor-post-card-title {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .blog-editor-post-card-excerpt {
                    font-size: 14px;
                    color: #6b7280;
                    margin-bottom: 16px;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .blog-editor-post-card-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                    color: #9ca3af;
                    margin-bottom: 16px;
                }
                
                .blog-editor-post-card-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .blog-editor-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 20px;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    display: none;
                    z-index: 2000;
                    min-width: 320px;
                    animation: slideIn 0.3s;
                }
                
                .blog-editor-toast.show { display: block; }
                
                .blog-editor-toast-success {
                    background: #f0fdf4;
                    border-left: 4px solid #10b981;
                    color: #166534;
                }
                
                .blog-editor-toast-error {
                    background: #fef2f2;
                    border-left: 4px solid #ef4444;
                    color: #991b1b;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .blog-editor-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                }
                
                .blog-editor-loading.hide { display: none; }
                
                .blog-editor-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e5e7eb;
                    border-top-color: #6366f1;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
            
            <div class="blog-editor-container">
                <div class="blog-editor-header">
                    <div class="blog-editor-header-content">
                        <div>
                            <h1 class="blog-editor-title">📝 Advanced Blog Editor</h1>
                            <p class="blog-editor-subtitle">Visual WYSIWYG editor with markdown output</p>
                        </div>
                        <div class="blog-editor-header-actions">
                            <button class="blog-editor-btn blog-editor-btn-secondary" id="cancelEdit" style="display: none;">Cancel</button>
                            <button class="blog-editor-btn blog-editor-btn-success" id="savePost">Save Post</button>
                        </div>
                    </div>
                </div>
                
                <div class="blog-editor-main">
                    <div class="blog-editor-content">
                        <div class="blog-editor-view-toggle">
                            <button class="blog-editor-view-btn active" data-view="editor">✏️ Editor</button>
                            <button class="blog-editor-view-btn" data-view="posts">📚 All Posts</button>
                        </div>
                        
                        <!-- Editor View -->
                        <div class="blog-editor-editor-view active">
                            <div class="blog-editor-layout">
                                <div class="blog-editor-main-panel">
                                    <div class="blog-editor-wrapper">
                                        <div id="quillEditor"></div>
                                    </div>
                                </div>
                                
                                <div class="blog-editor-sidebar">
                                    <!-- Basic Info -->
                                    <div class="blog-editor-section">
                                        <div class="blog-editor-section-title">📄 Basic Information</div>
                                        
                                        <div class="blog-editor-form-group">
                                            <label class="blog-editor-label">Title *</label>
                                            <input type="text" class="blog-editor-input" id="titleInput" placeholder="Enter post title">
                                        </div>
                                        
                                        <div class="blog-editor-form-group">
                                            <label class="blog-editor-label">Slug (URL)</label>
                                            <input type="text" class="blog-editor-input" id="slugInput" placeholder="auto-generated-from-title">
                                        </div>
                                        
                                        <div class="blog-editor-form-group">
                                            <label class="blog-editor-label">Excerpt</label>
                                            <textarea class="blog-editor-textarea" id="excerptInput" placeholder="Brief summary..."></textarea>
                                        </div>
                                        
                                        <div class="blog-editor-form-group">
                                            <label class="blog-editor-label">Category</label>
                                            <input type="text" class="blog-editor-input" id="categoryInput" placeholder="e.g., Technology">
                                        </div>
                                        
                                        <div class="blog-editor-form-group">
                                            <label class="blog-editor-label">Tags</label>
                                            <div class="blog-editor-tag-input-wrapper">
                                                <input type="text" class="blog-editor-input" id="tagInput" placeholder="Add tag">
                                                <button class="blog-editor-btn blog-editor-btn-primary" id="addTagBtn">+</button>
                                            </div>
                                            <div class="blog-editor-tags-display" id="tagsDisplay"></div>
                                        </div>
                                    </div>
                                    
                                    <!-- Featured Image -->
                                    <div class="blog-editor-section">
                                        <div class="blog-editor-section-title">🖼️ Featured Image</div>
                                        <input type="file" id="featuredImageInput" accept="image/*" style="display: none;">
                                        <div class="blog-editor-image-upload-area" id="featuredImageArea">
                                            <div>📸 Click to upload featured image</div>
                                        </div>
                                        <div id="featuredImagePreview"></div>
                                    </div>
                                    
                                    <!-- Author Info -->
                                    <div class="blog-editor-section">
                                        <div class="blog-editor-section-title">✍️ Author Information</div>
                                        
                                        <div class="blog-editor-form-group">
                                            <label class="blog-editor-label">Author Name</label>
                                            <input type="text" class="blog-editor-input" id="authorInput" placeholder="John Doe">
                                        </div>
                                        
                                        <div class="blog-editor-form-group">
                                            <label class="blog-editor-label">Author Image</label>
                                            <input type="file" id="authorImageInput" accept="image/*" style="display: none;">
                                            <div class="blog-editor-image-upload-area" id="authorImageArea">
                                                <div>👤 Click to upload author image</div>
                                            </div>
                                            <div id="authorImagePreview"></div>
                                        </div>
                                    </div>
                                    
                                    <!-- Publishing -->
                                    <div class="blog-editor-section">
                                        <div class="blog-editor-section-title">🚀 Publishing</div>
                                        
                                        <div class="blog-editor-form-group">
                                            <label class="blog-editor-label">Status</label>
                                            <select class="blog-editor-select" id="statusSelect">
                                                <option value="draft">Draft</option>
                                                <option value="published">Published</option>
                                            </select>
                                        </div>
                                        
                                        <div class="blog-editor-form-group">
                                            <label class="blog-editor-label">Read Time (minutes)</label>
                                            <input type="number" class="blog-editor-input" id="readTimeInput" value="5" min="1">
                                        </div>
                                        
                                        <div class="blog-editor-form-group blog-editor-checkbox-group">
                                            <input type="checkbox" class="blog-editor-checkbox" id="isFeaturedCheckbox">
                                            <label class="blog-editor-label" style="margin-bottom: 0;">⭐ Featured Post</label>
                                        </div>
                                    </div>
                                    
                                    <!-- SEO -->
                                    <div class="blog-editor-section">
                                        <div class="blog-editor-section-title">🔍 SEO Settings</div>
                                        
                                        <div class="blog-editor-form-group">
                                            <label class="blog-editor-label">SEO Title</label>
                                            <input type="text" class="blog-editor-input" id="seoTitleInput" placeholder="Optimized title for search engines">
                                        </div>
                                        
                                        <div class="blog-editor-form-group">
                                            <label class="blog-editor-label">SEO Description</label>
                                            <textarea class="blog-editor-textarea" id="seoDescriptionInput" placeholder="Meta description for search results"></textarea>
                                        </div>
                                        
                                        <div class="blog-editor-form-group">
                                            <label class="blog-editor-label">Keywords (comma-separated)</label>
                                            <input type="text" class="blog-editor-input" id="seoKeywordsInput" placeholder="seo, blog, marketing">
                                        </div>
                                        
                                        <div class="blog-editor-form-group">
                                            <label class="blog-editor-label">OG Image</label>
                                            <input type="file" id="seoOgImageInput" accept="image/*" style="display: none;">
                                            <div class="blog-editor-image-upload-area" id="seoOgImageArea">
                                                <div>🌐 Click to upload OG image</div>
                                            </div>
                                            <div id="seoOgImagePreview"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Posts View -->
                        <div class="blog-editor-posts-view">
                            <div id="loadingPosts" class="blog-editor-loading">
                                <div class="blog-editor-spinner"></div>
                            </div>
                            <div class="blog-editor-posts-grid" id="postsGrid"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="blog-editor-toast" id="toast"></div>
        `;
        
        this._shadow.appendChild(root);
    }
    
    _setupEventListeners() {
        // View toggle
        const viewBtns = this._shadow.querySelectorAll('.blog-editor-view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const view = btn.dataset.view;
                this._shadow.querySelector('.blog-editor-editor-view').classList.toggle('active', view === 'editor');
                this._shadow.querySelector('.blog-editor-posts-view').classList.toggle('active', view === 'posts');
                
                if (view === 'posts') {
                    this._dispatchEvent('load-blog-posts', {});
                }
            });
        });
        
        // Title to slug
        this._shadow.querySelector('#titleInput').addEventListener('input', (e) => {
            const slug = this._generateSlug(e.target.value);
            this._shadow.querySelector('#slugInput').value = slug;
        });
        
        // Tags
        this._shadow.querySelector('#addTagBtn').addEventListener('click', () => this._addTag());
        this._shadow.querySelector('#tagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._addTag();
            }
        });
        
        // Image uploads
        this._setupImageUpload('featuredImage');
        this._setupImageUpload('authorImage');
        this._setupImageUpload('seoOgImage');
        
        // Save & Cancel
        this._shadow.querySelector('#savePost').addEventListener('click', () => this._savePost());
        this._shadow.querySelector('#cancelEdit').addEventListener('click', () => this._cancelEdit());
    }
    
    _initializeQuill() {
        console.log('📝 Blog Editor: Initializing Quill...');
        
        if (!window.Quill) {
            console.error('📝 Blog Editor: Quill not loaded');
            return;
        }
        
        const editorElement = this._shadow.querySelector('#quillEditor');
        
        try {
            this._quill = new Quill(editorElement, {
                theme: 'snow',
                placeholder: 'Start writing your amazing blog post...',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'align': [] }],
                        ['blockquote', 'code-block'],
                        ['link', 'image', 'video'],
                        ['clean']
                    ]
                }
            });
            
            this._editorReady = true;
            console.log('📝 Blog Editor: ✅ Quill initialized');
            
        } catch (error) {
            console.error('📝 Blog Editor: Quill initialization error:', error);
        }
    }
    
    _convertQuillToMarkdown(delta) {
        let markdown = '';
        const ops = delta.ops || [];
        
        ops.forEach(op => {
            if (typeof op.insert === 'string') {
                let text = op.insert;
                
                if (op.attributes) {
                    if (op.attributes.bold) text = `**${text}**`;
                    if (op.attributes.italic) text = `*${text}*`;
                    if (op.attributes.strike) text = `~~${text}~~`;
                    if (op.attributes.code) text = `\`${text}\``;
                    if (op.attributes.link) text = `[${text}](${op.attributes.link})`;
                    if (op.attributes.header) {
                        const level = '#'.repeat(op.attributes.header);
                        text = `${level} ${text}\n`;
                    }
                    if (op.attributes.blockquote) text = `> ${text}\n`;
                    if (op.attributes.list) {
                        const prefix = op.attributes.list === 'ordered' ? '1.' : '-';
                        text = `${prefix} ${text}`;
                    }
                }
                
                markdown += text;
            } else if (op.insert.image) {
                markdown += `\n![](${op.insert.image})\n`;
            } else if (op.insert.video) {
                markdown += `\n[Video](${op.insert.video})\n`;
            }
        });
        
        return markdown.trim();
    }
    
    _setupImageUpload(type) {
        const area = this._shadow.querySelector(`#${type}Area`);
        const input = this._shadow.querySelector(`#${type}Input`);
        
        area.addEventListener('click', () => input.click());
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = this._shadow.querySelector(`#${type}Preview`);
                preview.innerHTML = `
                    <img src="${event.target.result}" class="blog-editor-image-preview">
                    <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">${file.name}</div>
                `;
                
                this._formData[type] = file;
            };
            reader.readAsDataURL(file);
        });
    }
    
    _generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 100);
    }
    
    _addTag() {
        const input = this._shadow.querySelector('#tagInput');
        const tag = input.value.trim();
        
        if (!tag) return;
        
        if (!this._formData.tags.includes(tag)) {
            this._formData.tags.push(tag);
            this._renderTags();
        }
        
        input.value = '';
    }
    
    _renderTags() {
        const container = this._shadow.querySelector('#tagsDisplay');
        container.innerHTML = this._formData.tags.map((tag, index) => `
            <div class="blog-editor-tag-chip">
                ${tag}
                <span class="blog-editor-tag-remove" data-index="${index}">×</span>
            </div>
        `).join('');
        
        container.querySelectorAll('.blog-editor-tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this._formData.tags.splice(index, 1);
                this._renderTags();
            });
        });
    }
    
    async _savePost() {
        const title = this._shadow.querySelector('#titleInput').value.trim();
        const slug = this._shadow.querySelector('#slugInput').value.trim();
        
        if (!title) {
            this._showToast('error', 'Please enter a title');
            return;
        }
        
        if (!this._quill) {
            this._showToast('error', 'Editor not ready');
            return;
        }
        
        try {
            const delta = this._quill.getContents();
            const htmlContent = this._quill.root.innerHTML;
            const markdown = this._convertQuillToMarkdown(delta);
            
            const formData = {
                _id: this._editingItemId,
                title: title,
                slug: slug,
                excerpt: this._shadow.querySelector('#excerptInput').value,
                content: markdown,
                htmlContent: htmlContent,
                quillDelta: JSON.stringify(delta),
                author: this._shadow.querySelector('#authorInput').value,
                category: this._shadow.querySelector('#categoryInput').value,
                tags: this._formData.tags,
                status: this._shadow.querySelector('#statusSelect').value,
                readTime: parseInt(this._shadow.querySelector('#readTimeInput').value) || 5,
                isFeatured: this._shadow.querySelector('#isFeaturedCheckbox').checked,
                seoTitle: this._shadow.querySelector('#seoTitleInput').value,
                seoDescription: this._shadow.querySelector('#seoDescriptionInput').value,
                seoKeywords: this._shadow.querySelector('#seoKeywordsInput').value,
                featuredImage: this._formData.featuredImage,
                authorImage: this._formData.authorImage,
                seoOgImage: this._formData.seoOgImage,
                publishedDate: this._formData.publishedDate || new Date().toISOString(),
                modifiedDate: new Date().toISOString()
            };
            
            const promises = [];
            
            ['featuredImage', 'authorImage', 'seoOgImage'].forEach(key => {
                if (formData[key] && formData[key] instanceof File) {
                    promises.push(
                        new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                                formData[key] = {
                                    data: reader.result.split(',')[1],
                                    name: formData[key].name,
                                    type: formData[key].type
                                };
                                resolve();
                            };
                            reader.readAsDataURL(formData[key]);
                        })
                    );
                }
            });
            
            await Promise.all(promises);
            
            this._dispatchEvent('save-blog-post', formData);
            
        } catch (error) {
            console.error('📝 Blog Editor: Save error:', error);
            this._showToast('error', 'Failed to save post');
        }
    }
    
    _cancelEdit() {
        this._editingItemId = null;
        this._resetForm();
        this._shadow.querySelector('#cancelEdit').style.display = 'none';
    }
    
    _resetForm() {
        this._shadow.querySelector('#titleInput').value = '';
        this._shadow.querySelector('#slugInput').value = '';
        this._shadow.querySelector('#excerptInput').value = '';
        this._shadow.querySelector('#authorInput').value = '';
        this._shadow.querySelector('#categoryInput').value = '';
        this._shadow.querySelector('#readTimeInput').value = '5';
        this._shadow.querySelector('#seoTitleInput').value = '';
        this._shadow.querySelector('#seoDescriptionInput').value = '';
        this._shadow.querySelector('#seoKeywordsInput').value = '';
        this._shadow.querySelector('#isFeaturedCheckbox').checked = false;
        this._shadow.querySelector('#statusSelect').value = 'draft';
        
        this._formData.tags = [];
        this._renderTags();
        
        this._shadow.querySelector('#featuredImagePreview').innerHTML = '';
        this._shadow.querySelector('#authorImagePreview').innerHTML = '';
        this._shadow.querySelector('#seoOgImagePreview').innerHTML = '';
        
        this._formData.featuredImage = null;
        this._formData.authorImage = null;
        this._formData.seoOgImage = null;
        
        if (this._quill) {
            this._quill.setContents([]);
        }
    }
    
    _renderBlogPosts(data) {
        const loading = this._shadow.querySelector('#loadingPosts');
        const grid = this._shadow.querySelector('#postsGrid');
        
        loading.classList.add('hide');
        
        if (!data.posts || data.posts.length === 0) {
            grid.innerHTML = '<div style="text-align: center; padding: 60px; color: #6b7280;">No blog posts yet. Create your first post!</div>';
            return;
        }
        
        grid.innerHTML = data.posts.map(post => `
            <div class="blog-editor-post-card">
                <img src="${post.featuredImage?.url || 'https://placehold.co/400x300/e5e7eb/6b7280?text=No+Image'}" class="blog-editor-post-card-image">
                <div class="blog-editor-post-card-body">
                    <div class="blog-editor-post-status blog-editor-status-${post.status}">${post.status}</div>
                    <div class="blog-editor-post-card-title">${post.title}</div>
                    <div class="blog-editor-post-card-excerpt">${post.excerpt || 'No excerpt available'}</div>
                    <div class="blog-editor-post-card-meta">
                        <span>📅 ${new Date(post.publishedDate).toLocaleDateString()}</span>
                        <span>👁️ ${post.viewCount || 0} views</span>
                    </div>
                    <div class="blog-editor-post-card-actions">
                        <button class="blog-editor-btn blog-editor-btn-primary edit-post-btn" data-id="${post._id}">✏️ Edit</button>
                        <button class="blog-editor-btn blog-editor-btn-danger delete-post-btn" data-id="${post._id}">🗑️ Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        grid.querySelectorAll('.edit-post-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this._dispatchEvent('load-post-for-edit', { id });
            });
        });
        
        grid.querySelectorAll('.delete-post-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('Are you sure you want to delete this post?')) {
                    this._dispatchEvent('delete-blog-post', { id });
                }
            });
        });
    }
    
    _loadEditData(data) {
        this._editingItemId = data._id;
        
        this._shadow.querySelector('#titleInput').value = data.title || '';
        this._shadow.querySelector('#slugInput').value = data.slug || '';
        this._shadow.querySelector('#excerptInput').value = data.excerpt || '';
        this._shadow.querySelector('#authorInput').value = data.author || '';
        this._shadow.querySelector('#categoryInput').value = data.category || '';
        this._shadow.querySelector('#readTimeInput').value = data.readTime || 5;
        this._shadow.querySelector('#seoTitleInput').value = data.seoTitle || '';
        this._shadow.querySelector('#seoDescriptionInput').value = data.seoDescription || '';
        this._shadow.querySelector('#seoKeywordsInput').value = data.seoKeywords || '';
        this._shadow.querySelector('#isFeaturedCheckbox').checked = data.isFeatured || false;
        this._shadow.querySelector('#statusSelect').value = data.status || 'draft';
        
        this._formData.tags = data.tags || [];
        this._renderTags();
        
        if (data.featuredImage) {
            this._shadow.querySelector('#featuredImagePreview').innerHTML = `
                <img src="${data.featuredImage.url}" class="blog-editor-image-preview">
            `;
            this._formData.featuredImage = data.featuredImage;
        }
        
        if (data.authorImage) {
            this._shadow.querySelector('#authorImagePreview').innerHTML = `
                <img src="${data.authorImage.url}" class="blog-editor-image-preview">
            `;
            this._formData.authorImage = data.authorImage;
        }
        
        if (data.seoOgImage) {
            this._shadow.querySelector('#seoOgImagePreview').innerHTML = `
                <img src="${data.seoOgImage.url}" class="blog-editor-image-preview">
            `;
            this._formData.seoOgImage = data.seoOgImage;
        }
        
        this._formData.publishedDate = data.publishedDate;
        
        if (this._quill && data.quillDelta) {
            try {
                const delta = JSON.parse(data.quillDelta);
                this._quill.setContents(delta);
            } catch (e) {
                console.error('📝 Blog Editor: Failed to load Quill content:', e);
                if (data.htmlContent) {
                    this._quill.root.innerHTML = data.htmlContent;
                }
            }
        }
        
        this._shadow.querySelector('[data-view="editor"]').click();
        this._shadow.querySelector('#cancelEdit').style.display = 'inline-block';
    }
    
    _handleImageUploadResult(result) {
        console.log('📝 Blog Editor: Image upload result:', result);
    }
    
    _dispatchEvent(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
    
    _showToast(type, message) {
        const toast = this._shadow.querySelector('#toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = `blog-editor-toast blog-editor-toast-${type} show`;
        setTimeout(() => toast.classList.remove('show'), 5000);
    }
}

customElements.define('blog-editor-dashboard', BlogEditorDashboard);
console.log('📝 Blog Editor: ✅ Custom element registered with Quill');
