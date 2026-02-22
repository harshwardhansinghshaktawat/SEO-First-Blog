class BlogEditorDashboard extends HTMLElement {
    constructor() {
        super();
        console.log('📝 Blog Editor: Initializing...');
        
        // Editor state
        this._editor = null;
        this._editorReady = false;
        this._editingItemId = null;
        this._rendered = false; // Flag to prevent double rendering
        
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
        
        // Only render the HTML and load scripts once the element is actually on the page
        if (!this._rendered) {
            this._createStructure();
            this._loadEditorJS(() => {
                this._setupEventListeners();
                // Dispatch the load event AFTER everything is set up
                this._dispatchEvent('load-blog-posts', {});
            });
            this._rendered = true;
            console.log('📝 Blog Editor: Complete');
        } else {
            // If it's already rendered (e.g., moved in the DOM), just request posts again
            this._dispatchEvent('load-blog-posts', {});
        }
    }
    
    _loadEditorJS(callback) {
        console.log('📝 Blog Editor: Loading Editor.js and plugins...');
        
        const scripts = [
            'https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest',
            'https://cdn.jsdelivr.net/npm/@editorjs/header@latest',
            'https://cdn.jsdelivr.net/npm/@editorjs/list@latest',
            'https://cdn.jsdelivr.net/npm/@editorjs/checklist@latest',
            'https://cdn.jsdelivr.net/npm/@editorjs/quote@latest',
            'https://cdn.jsdelivr.net/npm/@editorjs/code@latest',
            'https://cdn.jsdelivr.net/npm/@editorjs/delimiter@latest',
            'https://cdn.jsdelivr.net/npm/@editorjs/table@latest',
            'https://cdn.jsdelivr.net/npm/@editorjs/link@latest',
            'https://cdn.jsdelivr.net/npm/@editorjs/marker@latest',
            'https://cdn.jsdelivr.net/npm/@editorjs/inline-code@latest',
            'https://cdn.jsdelivr.net/npm/@editorjs/embed@latest'
        ];
        
        let loaded = 0;
        const total = scripts.length;
        
        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                loaded++;
                if (loaded === total) {
                    console.log('📝 Blog Editor: All scripts loaded');
                    callback();
                }
            };
            script.onerror = () => {
                console.error('📝 Blog Editor: Failed to load script:', src);
                loaded++;
                if (loaded === total) {
                    callback();
                }
            };
            document.head.appendChild(script);
        });
    }
    
    _createStructure() {
        const root = document.createElement('div');
        root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                * { box-sizing: border-box; margin: 0; padding: 0; }
                
                blog-editor-dashboard {
                    display: block;
                    width: 100%;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    background: #f8f9fa;
                }
                
                .container { width: 100%; min-height: 100vh; }
                
                .header {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: white;
                    padding: 24px 32px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .header-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .title {
                    font-size: 28px;
                    font-weight: 700;
                }
                
                .subtitle {
                    font-size: 14px;
                    opacity: 0.9;
                    margin-top: 4px;
                }
                
                .header-actions {
                    display: flex;
                    gap: 12px;
                }
                
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                
                .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                
                .btn-primary { background: #8b5cf6; color: white; }
                .btn-success { background: #10b981; color: white; }
                .btn-secondary { background: white; color: #6366f1; }
                .btn-danger { background: #ef4444; color: white; }
                .btn-warning { background: #f59e0b; color: white; }
                
                .main { padding: 32px; }
                
                .content { max-width: 1400px; margin: 0 auto; }
                
                .view-toggle {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                
                .view-btn {
                    padding: 10px 20px;
                    border: 2px solid #e5e7eb;
                    background: white;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                
                .view-btn.active {
                    background: #6366f1;
                    color: white;
                    border-color: #6366f1;
                }
                
                .editor-view, .posts-view { display: none; }
                .editor-view.active, .posts-view.active { display: block; }
                
                /* Editor Layout */
                .editor-container {
                    display: grid;
                    grid-template-columns: 1fr 400px;
                    gap: 24px;
                }
                
                @media (max-width: 1200px) {
                    .editor-container {
                        grid-template-columns: 1fr;
                    }
                }
                
                .editor-main {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                
                .editor-wrapper {
                    padding: 24px;
                    min-height: 600px;
                }
                
                #editorjs {
                    background: white;
                }
                
                /* Editor.js Custom Styles */
                .ce-block__content,
                .ce-toolbar__content {
                    max-width: 100%;
                }
                
                .codex-editor__redactor {
                    padding-bottom: 100px !important;
                }
                
                .ce-paragraph {
                    line-height: 1.8;
                    font-size: 16px;
                }
                
                .ce-header {
                    margin-top: 24px;
                    margin-bottom: 16px;
                }
                
                .editor-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .sidebar-section {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .section-title {
                    font-size: 16px;
                    font-weight: 700;
                    margin-bottom: 16px;
                    color: #1f2937;
                }
                
                .form-group { margin-bottom: 16px; }
                .form-group:last-child { margin-bottom: 0; }
                
                .label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 6px;
                    color: #374151;
                    font-size: 13px;
                }
                
                .input, .textarea, .select {
                    width: 100%;
                    padding: 10px 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }
                
                .input:focus, .textarea:focus, .select:focus {
                    outline: none;
                    border-color: #6366f1;
                }
                
                .textarea { resize: vertical; min-height: 80px; }
                
                .checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .checkbox {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }
                
                .image-upload-area {
                    border: 2px dashed #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .image-upload-area:hover {
                    border-color: #6366f1;
                    background: #f9fafb;
                }
                
                .image-preview {
                    width: 100%;
                    max-height: 200px;
                    object-fit: cover;
                    border-radius: 8px;
                    margin-top: 12px;
                }
                
                .tag-input-wrapper {
                    display: flex;
                    gap: 8px;
                }
                
                .tags-display {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 8px;
                }
                
                .tag-chip {
                    background: #ede9fe;
                    color: #6366f1;
                    padding: 4px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .tag-remove {
                    cursor: pointer;
                    font-weight: 700;
                }
                
                /* Posts Grid */
                .posts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 24px;
                }
                
                .post-card {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: all 0.3s;
                }
                
                .post-card:hover {
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    transform: translateY(-4px);
                }
                
                .post-card-image {
                    width: 100%;
                    height: 180px;
                    object-fit: cover;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                }
                
                .post-card-body { padding: 20px; }
                
                .post-status {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 12px;
                }
                
                .status-published { background: #d1fae5; color: #065f46; }
                .status-draft { background: #fee2e2; color: #991b1b; }
                
                .post-card-title {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .post-card-excerpt {
                    font-size: 14px;
                    color: #6b7280;
                    margin-bottom: 16px;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .post-card-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                    color: #9ca3af;
                    margin-bottom: 16px;
                }
                
                .post-card-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .toast {
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
                
                .toast.show { display: block; }
                
                .toast-success {
                    background: #f0fdf4;
                    border-left: 4px solid #10b981;
                    color: #166534;
                }
                
                .toast-error {
                    background: #fef2f2;
                    border-left: 4px solid #ef4444;
                    color: #991b1b;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                }
                
                .loading.hide { display: none; }
                
                .spinner {
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
            
            <div class="container">
                <div class="header">
                    <div class="header-content">
                        <div>
                            <h1 class="title">📝 Advanced Blog Editor</h1>
                            <p class="subtitle">Create SEO-optimized blog posts with Editor.js</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn btn-secondary" id="cancelEdit" style="display: none;">Cancel</button>
                            <button class="btn btn-success" id="savePost">Save Post</button>
                        </div>
                    </div>
                </div>
                
                <div class="main">
                    <div class="content">
                        <div class="view-toggle">
                            <button class="view-btn active" data-view="editor">✏️ Editor</button>
                            <button class="view-btn" data-view="posts">📚 All Posts</button>
                        </div>
                        
                        <div class="editor-view active">
                            <div class="editor-container">
                                <div class="editor-main">
                                    <div class="editor-wrapper">
                                        <div id="editorjs"></div>
                                    </div>
                                </div>
                                
                                <div class="editor-sidebar">
                                    <div class="sidebar-section">
                                        <div class="section-title">📄 Basic Information</div>
                                        
                                        <div class="form-group">
                                            <label class="label">Title *</label>
                                            <input type="text" class="input" id="titleInput" placeholder="Enter post title">
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="label">Slug (URL)</label>
                                            <input type="text" class="input" id="slugInput" placeholder="auto-generated-from-title">
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="label">Excerpt</label>
                                            <textarea class="textarea" id="excerptInput" placeholder="Brief summary..."></textarea>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="label">Category</label>
                                            <input type="text" class="input" id="categoryInput" placeholder="e.g., Technology">
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="label">Tags</label>
                                            <div class="tag-input-wrapper">
                                                <input type="text" class="input" id="tagInput" placeholder="Add tag">
                                                <button class="btn btn-primary" id="addTagBtn">+</button>
                                            </div>
                                            <div class="tags-display" id="tagsDisplay"></div>
                                        </div>
                                    </div>
                                    
                                    <div class="sidebar-section">
                                        <div class="section-title">🖼️ Featured Image</div>
                                        <input type="file" id="featuredImageInput" accept="image/*" style="display: none;">
                                        <div class="image-upload-area" id="featuredImageArea">
                                            <div>📸 Click to upload featured image</div>
                                        </div>
                                        <div id="featuredImagePreview"></div>
                                    </div>
                                    
                                    <div class="sidebar-section">
                                        <div class="section-title">✍️ Author Information</div>
                                        
                                        <div class="form-group">
                                            <label class="label">Author Name</label>
                                            <input type="text" class="input" id="authorInput" placeholder="John Doe">
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="label">Author Image</label>
                                            <input type="file" id="authorImageInput" accept="image/*" style="display: none;">
                                            <div class="image-upload-area" id="authorImageArea">
                                                <div>👤 Click to upload author image</div>
                                            </div>
                                            <div id="authorImagePreview"></div>
                                        </div>
                                    </div>
                                    
                                    <div class="sidebar-section">
                                        <div class="section-title">🚀 Publishing</div>
                                        
                                        <div class="form-group">
                                            <label class="label">Status</label>
                                            <select class="select" id="statusSelect">
                                                <option value="draft">Draft</option>
                                                <option value="published">Published</option>
                                            </select>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="label">Read Time (minutes)</label>
                                            <input type="number" class="input" id="readTimeInput" value="5" min="1">
                                        </div>
                                        
                                        <div class="form-group checkbox-group">
                                            <input type="checkbox" class="checkbox" id="isFeaturedCheckbox">
                                            <label class="label" style="margin-bottom: 0;">⭐ Featured Post</label>
                                        </div>
                                    </div>
                                    
                                    <div class="sidebar-section">
                                        <div class="section-title">🔍 SEO Settings</div>
                                        
                                        <div class="form-group">
                                            <label class="label">SEO Title</label>
                                            <input type="text" class="input" id="seoTitleInput" placeholder="Optimized title for search engines">
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="label">SEO Description</label>
                                            <textarea class="textarea" id="seoDescriptionInput" placeholder="Meta description for search results"></textarea>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="label">Keywords (comma-separated)</label>
                                            <input type="text" class="input" id="seoKeywordsInput" placeholder="seo, blog, marketing">
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="label">OG Image</label>
                                            <input type="file" id="seoOgImageInput" accept="image/*" style="display: none;">
                                            <div class="image-upload-area" id="seoOgImageArea">
                                                <div>🌐 Click to upload OG image</div>
                                            </div>
                                            <div id="seoOgImagePreview"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="posts-view">
                            <div id="loadingPosts" class="loading">
                                <div class="spinner"></div>
                            </div>
                            <div class="posts-grid" id="postsGrid"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="toast" id="toast"></div>
        `;
        
        // Append directly to the custom element in the Light DOM
        this.appendChild(root);
    }

    _setupEventListeners() {
        // Initialize Editor.js
        this._initializeEditor();
        
        // View toggle
        const viewBtns = this.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const view = btn.dataset.view;
                this.querySelector('.editor-view').classList.toggle('active', view === 'editor');
                this.querySelector('.posts-view').classList.toggle('active', view === 'posts');
                
                if (view === 'posts') {
                    this._dispatchEvent('load-blog-posts', {});
                }
            });
        });
        
        // Title to slug auto-generation
        this.querySelector('#titleInput').addEventListener('input', (e) => {
            const slug = this._generateSlug(e.target.value);
            this.querySelector('#slugInput').value = slug;
        });
        
        // Tags
        this.querySelector('#addTagBtn').addEventListener('click', () => this._addTag());
        this.querySelector('#tagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._addTag();
            }
        });
        
        // Image uploads
        this._setupImageUpload('featuredImage');
        this._setupImageUpload('authorImage');
        this._setupImageUpload('seoOgImage');
        
        // Save post
        this.querySelector('#savePost').addEventListener('click', () => this._savePost());
        
        // Cancel edit
        this.querySelector('#cancelEdit').addEventListener('click', () => this._cancelEdit());
    }
    
    _initializeEditor() {
        const editorElement = this.querySelector('#editorjs');
        
        if (!window.EditorJS) {
            console.error('📝 Blog Editor: Editor.js not loaded');
            return;
        }
        
        // Custom image uploader
        class ImageTool {
            static get toolbox() {
                return {
                    title: 'Image',
                    icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150.242V79c0-18.778-15.222-34-34-34H79c-18.778 0-34 15.222-34 34v42.264l67.179-44.192 80.398 71.614 56.686-29.14L291 150.242zm-.345 51.622l-42.3-30.246-56.3 29.884-80.773-66.925L45 174.187V197c0 18.778 15.222 34 34 34h178c17.126 0 31.295-12.663 33.655-29.136zM79 0h178c43.63 0 79 35.37 79 79v118c0 43.63-35.37 79-79 79H79c-43.63 0-79-35.37-79-79V79C0 35.37 35.37 0 79 0z"/></svg>'
                };
            }
            
            constructor({data, api, config}) {
                this.api = api;
                this.data = data || {};
                this.wrapper = null;
                this.config = config;
            }
            
            render() {
                const wrapper = document.createElement('div');
                wrapper.classList.add('simple-image');
                
                if (this.data && this.data.url) {
                    const img = document.createElement('img');
                    img.src = this.data.url;
                    img.alt = this.data.caption || '';
                    img.style.cssText = 'max-width: 100%; height: auto; display: block; margin: 20px auto;';
                    wrapper.appendChild(img);
                    
                    if (this.data.caption) {
                        const caption = document.createElement('div');
                        caption.contentEditable = true;
                        caption.innerHTML = this.data.caption;
                        caption.style.cssText = 'text-align: center; font-size: 14px; color: #6b7280; margin-top: 8px;';
                        wrapper.appendChild(caption);
                    }
                } else {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.style.cssText = 'padding: 12px; border: 2px dashed #e5e7eb; border-radius: 8px; width: 100%; cursor: pointer;';
                    
                    input.addEventListener('change', (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            this._uploadImage(file, wrapper);
                        }
                    });
                    
                    wrapper.appendChild(input);
                }
                
                this.wrapper = wrapper;
                return wrapper;
            }
            
            _uploadImage(file, wrapper) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64Data = event.target.result.split(',')[1];
                    
                    // Dispatch upload event to custom element
                    const customElement = document.querySelector('blog-editor-dashboard');
                    if(customElement) {
                        customElement._uploadEditorImage(base64Data, file.name, file.type, (result) => {
                            if (result.success) {
                                wrapper.innerHTML = '';
                                
                                const img = document.createElement('img');
                                img.src = result.url;
                                img.style.cssText = 'max-width: 100%; height: auto; display: block; margin: 20px auto;';
                                wrapper.appendChild(img);
                                
                                const caption = document.createElement('div');
                                caption.contentEditable = true;
                                caption.innerHTML = 'Enter image caption...';
                                caption.style.cssText = 'text-align: center; font-size: 14px; color: #6b7280; margin-top: 8px;';
                                wrapper.appendChild(caption);
                                
                                this.data = {
                                    url: result.url,
                                    caption: 'Enter image caption...'
                                };
                            }
                        });
                    }
                };
                reader.readAsDataURL(file);
            }
            
            save(blockContent) {
                const img = blockContent.querySelector('img');
                const caption = blockContent.querySelector('div[contenteditable]');
                
                return {
                    url: img ? img.src : '',
                    caption: caption ? caption.innerHTML : ''
                };
            }
        }
        
        this._editor = new EditorJS({
            holder: editorElement,
            placeholder: 'Start writing your amazing blog post...',
            tools: {
                header: {
                    class: window.Header,
                    config: {
                        placeholder: 'Enter a header',
                        levels: [1, 2, 3, 4, 5, 6],
                        defaultLevel: 2
                    }
                },
                list: {
                    class: window.List,
                    inlineToolbar: true
                },
                checklist: {
                    class: window.Checklist,
                    inlineToolbar: true
                },
                quote: {
                    class: window.Quote,
                    inlineToolbar: true,
                    config: {
                        quotePlaceholder: 'Enter a quote',
                        captionPlaceholder: 'Quote author'
                    }
                },
                code: {
                    class: window.CodeTool
                },
                delimiter: window.Delimiter,
                table: {
                    class: window.Table,
                    inlineToolbar: true
                },
                linkTool: {
                    class: window.LinkTool,
                    config: {
                        endpoint: '#'
                    }
                },
                marker: {
                    class: window.Marker
                },
                inlineCode: {
                    class: window.InlineCode
                },
                embed: {
                    class: window.Embed,
                    config: {
                        services: {
                            youtube: true,
                            coub: true,
                            codepen: true,
                            twitter: true
                        }
                    }
                },
                image: ImageTool
            },
            onChange: () => {
                console.log('📝 Blog Editor: Content changed');
            }
        });
        
        this._editorReady = true;
        console.log('📝 Blog Editor: Editor initialized');
    }
    
    _uploadEditorImage(base64Data, fileName, mimeType, callback) {
        this._dispatchEvent('upload-editor-image', {
            fileData: base64Data,
            fileName: fileName,
            mimeType: mimeType
        });
        
        // Store callback for later
        this._imageUploadCallback = callback;
    }
    
    _handleImageUploadResult(result) {
        if (this._imageUploadCallback) {
            this._imageUploadCallback(result);
            this._imageUploadCallback = null;
        }
    }
    
    _setupImageUpload(type) {
        const area = this.querySelector(`#${type}Area`);
        const input = this.querySelector(`#${type}Input`);
        
        area.addEventListener('click', () => input.click());
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = this.querySelector(`#${type}Preview`);
                preview.innerHTML = `
                    <img src="${event.target.result}" class="image-preview">
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
        const input = this.querySelector('#tagInput');
        const tag = input.value.trim();
        
        if (!tag) return;
        
        if (!this._formData.tags.includes(tag)) {
            this._formData.tags.push(tag);
            this._renderTags();
        }
        
        input.value = '';
    }
    
    _renderTags() {
        const container = this.querySelector('#tagsDisplay');
        container.innerHTML = this._formData.tags.map((tag, index) => `
            <div class="tag-chip">
                ${tag}
                <span class="tag-remove" data-index="${index}">×</span>
            </div>
        `).join('');
        
        container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this._formData.tags.splice(index, 1);
                this._renderTags();
            });
        });
    }
    
    async _savePost() {
        const title = this.querySelector('#titleInput').value.trim();
        const slug = this.querySelector('#slugInput').value.trim();
        
        if (!title) {
            this._showToast('error', 'Please enter a title');
            return;
        }
        
        if (!this._editor) {
            this._showToast('error', 'Editor not ready');
            return;
        }
        
        try {
            const editorData = await this._editor.save();
            const markdown = this._convertToMarkdown(editorData);
            
            const formData = {
                _id: this._editingItemId,
                title: title,
                slug: slug,
                excerpt: this.querySelector('#excerptInput').value,
                content: markdown,
                editorData: JSON.stringify(editorData),
                author: this.querySelector('#authorInput').value,
                category: this.querySelector('#categoryInput').value,
                tags: this._formData.tags,
                status: this.querySelector('#statusSelect').value,
                readTime: parseInt(this.querySelector('#readTimeInput').value) || 5,
                isFeatured: this.querySelector('#isFeaturedCheckbox').checked,
                seoTitle: this.querySelector('#seoTitleInput').value,
                seoDescription: this.querySelector('#seoDescriptionInput').value,
                seoKeywords: this.querySelector('#seoKeywordsInput').value,
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
    
    _convertToMarkdown(editorData) {
        let markdown = '';
        
        editorData.blocks.forEach(block => {
            switch (block.type) {
                case 'header':
                    const level = '#'.repeat(block.data.level);
                    markdown += `${level} ${block.data.text}\n\n`;
                    break;
                    
                case 'paragraph':
                    markdown += `${block.data.text}\n\n`;
                    break;
                    
                case 'list':
                    block.data.items.forEach(item => {
                        const prefix = block.data.style === 'ordered' ? '1.' : '-';
                        markdown += `${prefix} ${item}\n`;
                    });
                    markdown += '\n';
                    break;
                    
                case 'checklist':
                    block.data.items.forEach(item => {
                        const checked = item.checked ? 'x' : ' ';
                        markdown += `- [${checked}] ${item.text}\n`;
                    });
                    markdown += '\n';
                    break;
                    
                case 'quote':
                    markdown += `> ${block.data.text}\n`;
                    if (block.data.caption) {
                        markdown += `>\n> — ${block.data.caption}\n`;
                    }
                    markdown += '\n';
                    break;
                    
                case 'code':
                    markdown += `\`\`\`\n${block.data.code}\n\`\`\`\n\n`;
                    break;
                    
                case 'delimiter':
                    markdown += `---\n\n`;
                    break;
                    
                case 'table':
                    if (block.data.content && block.data.content.length > 0) {
                        // Header
                        markdown += '| ' + block.data.content[0].join(' | ') + ' |\n';
                        markdown += '|' + block.data.content[0].map(() => '---').join('|') + '|\n';
                        // Rows
                        for (let i = 1; i < block.data.content.length; i++) {
                            markdown += '| ' + block.data.content[i].join(' | ') + ' |\n';
                        }
                        markdown += '\n';
                    }
                    break;
                    
                case 'image':
                    markdown += `![${block.data.caption || ''}](${block.data.url})\n\n`;
                    break;
                    
                case 'linkTool':
                    markdown += `[${block.data.meta.title || block.data.link}](${block.data.link})\n\n`;
                    break;
                    
                case 'embed':
                    markdown += `[Embedded Content](${block.data.embed})\n\n`;
                    break;
                    
                default:
                    break;
            }
        });
        
        return markdown.trim();
    }
    
    _cancelEdit() {
        this._editingItemId = null;
        this._resetForm();
        this.querySelector('#cancelEdit').style.display = 'none';
    }
    
    _resetForm() {
        this.querySelector('#titleInput').value = '';
        this.querySelector('#slugInput').value = '';
        this.querySelector('#excerptInput').value = '';
        this.querySelector('#authorInput').value = '';
        this.querySelector('#categoryInput').value = '';
        this.querySelector('#readTimeInput').value = '5';
        this.querySelector('#seoTitleInput').value = '';
        this.querySelector('#seoDescriptionInput').value = '';
        this.querySelector('#seoKeywordsInput').value = '';
        this.querySelector('#isFeaturedCheckbox').checked = false;
        this.querySelector('#statusSelect').value = 'draft';
        
        this._formData.tags = [];
        this._renderTags();
        
        this.querySelector('#featuredImagePreview').innerHTML = '';
        this.querySelector('#authorImagePreview').innerHTML = '';
        this.querySelector('#seoOgImagePreview').innerHTML = '';
        
        this._formData.featuredImage = null;
        this._formData.authorImage = null;
        this._formData.seoOgImage = null;
        
        if (this._editor) {
            this._editor.clear();
        }
    }
    
    _renderBlogPosts(data) {
        const loading = this.querySelector('#loadingPosts');
        const grid = this.querySelector('#postsGrid');
        
        loading.classList.add('hide');
        
        if (!data.posts || data.posts.length === 0) {
            grid.innerHTML = '<div style="text-align: center; padding: 60px; color: #6b7280;">No blog posts yet. Create your first post!</div>';
            return;
        }
        
        grid.innerHTML = data.posts.map(post => `
            <div class="post-card">
                <img src="${post.featuredImage?.url || 'https://via.placeholder.com/400x300?text=No+Image'}" class="post-card-image">
                <div class="post-card-body">
                    <div class="post-status status-${post.status}">${post.status}</div>
                    <div class="post-card-title">${post.title}</div>
                    <div class="post-card-excerpt">${post.excerpt || 'No excerpt available'}</div>
                    <div class="post-card-meta">
                        <span>📅 ${new Date(post.publishedDate).toLocaleDateString()}</span>
                        <span>👁️ ${post.viewCount || 0} views</span>
                    </div>
                    <div class="post-card-actions">
                        <button class="btn btn-primary edit-post-btn" data-id="${post._id}">✏️ Edit</button>
                        <button class="btn btn-danger delete-post-btn" data-id="${post._id}">🗑️ Delete</button>
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
    
    async _loadEditData(data) {
        this._editingItemId = data._id;
        
        this.querySelector('#titleInput').value = data.title || '';
        this.querySelector('#slugInput').value = data.slug || '';
        this.querySelector('#excerptInput').value = data.excerpt || '';
        this.querySelector('#authorInput').value = data.author || '';
        this.querySelector('#categoryInput').value = data.category || '';
        this.querySelector('#readTimeInput').value = data.readTime || 5;
        this.querySelector('#seoTitleInput').value = data.seoTitle || '';
        this.querySelector('#seoDescriptionInput').value = data.seoDescription || '';
        this.querySelector('#seoKeywordsInput').value = data.seoKeywords || '';
        this.querySelector('#isFeaturedCheckbox').checked = data.isFeatured || false;
        this.querySelector('#statusSelect').value = data.status || 'draft';
        
        this._formData.tags = data.tags || [];
        this._renderTags();
        
        if (data.featuredImage) {
            this.querySelector('#featuredImagePreview').innerHTML = `
                <img src="${data.featuredImage.url}" class="image-preview">
            `;
            this._formData.featuredImage = data.featuredImage;
        }
        
        if (data.authorImage) {
            this.querySelector('#authorImagePreview').innerHTML = `
                <img src="${data.authorImage.url}" class="image-preview">
            `;
            this._formData.authorImage = data.authorImage;
        }
        
        if (data.seoOgImage) {
            this.querySelector('#seoOgImagePreview').innerHTML = `
                <img src="${data.seoOgImage.url}" class="image-preview">
            `;
            this._formData.seoOgImage = data.seoOgImage;
        }
        
        this._formData.publishedDate = data.publishedDate;
        
        // Load editor content
        if (this._editor && data.editorData) {
            try {
                const editorData = JSON.parse(data.editorData);
                await this._editor.render(editorData);
            } catch (e) {
                console.error('📝 Blog Editor: Failed to load editor data:', e);
            }
        }
        
        this.querySelector('[data-view="editor"]').click();
        this.querySelector('#cancelEdit').style.display = 'inline-block';
    }
    
    _dispatchEvent(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
    
    _showToast(type, message) {
        const toast = this.querySelector('#toast');
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;
        setTimeout(() => toast.classList.remove('show'), 5000);
    }
}

customElements.define('blog-editor-dashboard', BlogEditorDashboard);
console.log('📝 Blog Editor: ✅ Custom element registered');
