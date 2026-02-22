class BlogEditorDashboard extends HTMLElement {
    constructor() {
        super();
        console.log('========================================');
        console.log('📝 Blog Editor: CONSTRUCTOR CALLED');
        console.log('📝 Blog Editor: Timestamp:', new Date().toISOString());
        
        // IMPORTANT: Mark this as already initialized
        this._initialized = false;
        
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
        
        console.log('📝 Blog Editor: Constructor complete');
        console.log('========================================');
    }
    
    static get observedAttributes() {
        console.log('📝 Blog Editor: observedAttributes getter called');
        return ['notification', 'image-upload-result', 'blog-posts-data', 'edit-data'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        console.log('========================================');
        console.log('📝 Blog Editor: ATTRIBUTE CHANGED');
        console.log('📝 Blog Editor: Name:', name);
        console.log('📝 Blog Editor: Initialized:', this._initialized);
        console.log('========================================');
        
        // Don't process attributes until we're initialized
        if (!this._initialized) {
            console.log('📝 Blog Editor: Skipping - not initialized yet');
            return;
        }
        
        if (!newValue || newValue === oldValue) {
            console.log('📝 Blog Editor: Skipping - no change or null value');
            return;
        }
        
        if (name === 'notification') {
            try {
                const notification = JSON.parse(newValue);
                console.log('📝 Blog Editor: Processing notification:', notification);
                this._showToast(notification.type, notification.message);
            } catch (e) {
                console.error('📝 Blog Editor: Notification error:', e);
            }
        }
        
        if (name === 'image-upload-result') {
            try {
                const result = JSON.parse(newValue);
                console.log('📝 Blog Editor: Processing image upload result:', result);
                this._handleImageUploadResult(result);
            } catch (e) {
                console.error('📝 Blog Editor: Image upload result error:', e);
            }
        }
        
        if (name === 'blog-posts-data') {
            try {
                const data = JSON.parse(newValue);
                console.log('📝 Blog Editor: Processing blog posts data, count:', data.posts?.length || 0);
                this._renderBlogPosts(data);
            } catch (e) {
                console.error('📝 Blog Editor: Blog posts data error:', e);
            }
        }
        
        if (name === 'edit-data') {
            try {
                const data = JSON.parse(newValue);
                console.log('📝 Blog Editor: Processing edit data for post:', data.title);
                this._loadEditData(data);
            } catch (e) {
                console.error('📝 Blog Editor: Edit data error:', e);
            }
        }
    }
    
    connectedCallback() {
        console.log('========================================');
        console.log('📝 Blog Editor: CONNECTED TO DOM');
        console.log('📝 Blog Editor: Timestamp:', new Date().toISOString());
        console.log('📝 Blog Editor: Already initialized:', this._initialized);
        console.log('📝 Blog Editor: Parent element:', this.parentElement?.tagName);
        console.log('📝 Blog Editor: Has children:', this.childElementCount);
        console.log('========================================');
        
        // CRITICAL FIX: Only initialize once!
        if (this._initialized) {
            console.log('📝 Blog Editor: ⚠️ Already initialized, skipping setup');
            return;
        }
        
        // Mark as initializing
        this._initialized = true;
        console.log('📝 Blog Editor: Starting initialization...');
        
        // Create structure ONLY if we don't have children
        if (this.childElementCount === 0) {
            console.log('📝 Blog Editor: Creating structure (no children)...');
            this._createStructure();
        } else {
            console.log('📝 Blog Editor: ⚠️ Structure already exists, skipping creation');
        }
        
        // Check if element structure exists
        const container = this.querySelector('.blog-editor-container');
        console.log('📝 Blog Editor: Container found:', !!container);
        
        if (!container) {
            console.error('📝 Blog Editor: CRITICAL - Container not found!');
            return;
        }
        
        console.log('📝 Blog Editor: Container display:', window.getComputedStyle(container).display);
        console.log('📝 Blog Editor: Container visibility:', window.getComputedStyle(container).visibility);
        
        // Load Quill only if not already loaded
        if (!this._quillLoaded) {
            console.log('📝 Blog Editor: Starting Quill load process...');
            this._loadQuill(() => {
                console.log('📝 Blog Editor: Quill load callback triggered');
                this._setupEventListeners();
                this._initializeQuill();
                
                console.log('📝 Blog Editor: Dispatching load-blog-posts event');
                this._dispatchEvent('load-blog-posts', {});
                
                console.log('📝 Blog Editor: Connected callback complete');
            });
        } else {
            console.log('📝 Blog Editor: ⚠️ Quill already loaded, skipping');
        }
    }
    
    disconnectedCallback() {
        console.log('========================================');
        console.log('📝 Blog Editor: DISCONNECTED FROM DOM');
        console.log('📝 Blog Editor: Timestamp:', new Date().toISOString());
        console.log('📝 Blog Editor: This is likely a React re-render issue!');
        console.log('========================================');
        
        // DON'T reset _initialized here - we want to keep our state
        // this._initialized = false; // REMOVED!
    }
    
    _loadQuill(callback) {
        console.log('========================================');
        console.log('📝 Blog Editor: LOADING QUILL');
        console.log('📝 Blog Editor: Window.Quill exists:', !!window.Quill);
        console.log('📝 Blog Editor: Already loaded flag:', this._quillLoaded);
        console.log('========================================');
        
        // Check if Quill is already loaded
        if (window.Quill) {
            console.log('📝 Blog Editor: Quill already exists in window');
            this._quillLoaded = true;
            callback();
            return;
        }
        
        console.log('📝 Blog Editor: Loading Quill CSS...');
        // Load CSS
        const quillCss = document.createElement('link');
        quillCss.rel = 'stylesheet';
        quillCss.href = 'https://cdn.quilljs.com/1.3.7/quill.snow.css';
        quillCss.onload = () => {
            console.log('📝 Blog Editor: ✅ Quill CSS loaded');
        };
        quillCss.onerror = () => {
            console.error('📝 Blog Editor: ❌ Failed to load Quill CSS');
        };
        document.head.appendChild(quillCss);
        
        console.log('📝 Blog Editor: Loading Quill JS...');
        // Load JS
        const quillScript = document.createElement('script');
        quillScript.src = 'https://cdn.quilljs.com/1.3.7/quill.min.js';
        quillScript.onload = () => {
            console.log('========================================');
            console.log('📝 Blog Editor: ✅ QUILL JS LOADED SUCCESSFULLY');
            console.log('📝 Blog Editor: Window.Quill exists:', !!window.Quill);
            console.log('📝 Blog Editor: Quill version:', window.Quill?.version);
            console.log('========================================');
            this._quillLoaded = true;
            callback();
        };
        quillScript.onerror = (error) => {
            console.error('========================================');
            console.error('📝 Blog Editor: ❌ FAILED TO LOAD QUILL JS');
            console.error('📝 Blog Editor: Error:', error);
            console.error('========================================');
            this._showToast('error', 'Failed to load editor');
        };
        document.head.appendChild(quillScript);
    }
    
    _createStructure() {
        console.log('========================================');
        console.log('📝 Blog Editor: CREATING STRUCTURE');
        console.log('========================================');
        
        // Add styles to document head (only once)
        if (!document.getElementById('blog-editor-styles')) {
            console.log('📝 Blog Editor: Adding styles to document head');
            const style = document.createElement('style');
            style.id = 'blog-editor-styles';
            style.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                blog-editor-dashboard {
                    display: block !important;
                    width: 100%;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    background: #f8f9fa;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                
                blog-editor-dashboard * { box-sizing: border-box; }
                
                .blog-editor-container { 
                    width: 100%; 
                    min-height: 100vh;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
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
                    display: block !important;
                    visibility: visible !important;
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
                    padding: 24px;
                }
                
                #quillEditor {
                    min-height: 500px;
                    background: white;
                    display: block !important;
                }
                
                /* Quill customization */
                .ql-container {
                    font-size: 16px;
                    font-family: 'Inter', sans-serif;
                }
                
                .ql-editor {
                    min-height: 450px;
                    max-height: 600px;
                    overflow-y: auto;
                }
                
                .ql-editor p {
                    line-height: 1.8;
                }
                
                .ql-toolbar {
                    border-top-left-radius: 8px;
                    border-top-right-radius: 8px;
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
            `;
            document.head.appendChild(style);
            console.log('📝 Blog Editor: ✅ Styles added to document head');
        } else {
            console.log('📝 Blog Editor: Styles already exist in document head');
        }
        
        console.log('📝 Blog Editor: Creating HTML structure...');
        // Create HTML structure in Light DOM
        this.innerHTML = `
            <div class="blog-editor-container">
                <div class="blog-editor-header">
                    <div class="blog-editor-header-content">
                        <div>
                            <h1 class="blog-editor-title">📝 Advanced Blog Editor</h1>
                            <p class="blog-editor-subtitle">Create SEO-optimized blog posts with Quill.js</p>
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
        
        console.log('📝 Blog Editor: ✅ HTML structure created');
        
        // Verify structure
        setTimeout(() => {
            const container = this.querySelector('.blog-editor-container');
            const editorView = this.querySelector('.blog-editor-editor-view');
            const quillEditor = this.querySelector('#quillEditor');
            
            console.log('========================================');
            console.log('📝 Blog Editor: STRUCTURE VERIFICATION (after creation)');
            console.log('📝 Blog Editor: Container exists:', !!container);
            console.log('📝 Blog Editor: Editor view exists:', !!editorView);
            console.log('📝 Blog Editor: Quill element exists:', !!quillEditor);
            
            if (container) {
                console.log('📝 Blog Editor: Container display:', window.getComputedStyle(container).display);
                console.log('📝 Blog Editor: Container visibility:', window.getComputedStyle(container).visibility);
            }
            
            if (editorView) {
                console.log('📝 Blog Editor: Editor view classes:', editorView.className);
                console.log('📝 Blog Editor: Editor view display:', window.getComputedStyle(editorView).display);
            }
            console.log('========================================');
        }, 100);
    }

    _setupEventListeners() {
        console.log('========================================');
        console.log('📝 Blog Editor: SETTING UP EVENT LISTENERS');
        console.log('========================================');
        
        // View toggle
        const viewBtns = this.querySelectorAll('.blog-editor-view-btn');
        console.log('📝 Blog Editor: View buttons found:', viewBtns.length);
        
        viewBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                console.log('📝 Blog Editor: View button clicked:', index, btn.dataset.view);
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const view = btn.dataset.view;
                const editorView = this.querySelector('.blog-editor-editor-view');
                const postsView = this.querySelector('.blog-editor-posts-view');
                
                editorView.classList.toggle('active', view === 'editor');
                postsView.classList.toggle('active', view === 'posts');
                
                console.log('📝 Blog Editor: Editor view active:', editorView.classList.contains('active'));
                console.log('📝 Blog Editor: Posts view active:', postsView.classList.contains('active'));
                
                if (view === 'posts') {
                    console.log('📝 Blog Editor: Dispatching load-blog-posts from view toggle');
                    this._dispatchEvent('load-blog-posts', {});
                }
            });
        });
        
        // Title to slug auto-generation
        const titleInput = this.querySelector('#titleInput');
        console.log('📝 Blog Editor: Title input found:', !!titleInput);
        
        titleInput.addEventListener('input', (e) => {
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
        const saveBtn = this.querySelector('#savePost');
        console.log('📝 Blog Editor: Save button found:', !!saveBtn);
        saveBtn.addEventListener('click', () => {
            console.log('📝 Blog Editor: Save button clicked');
            this._savePost();
        });
        
        // Cancel edit
        this.querySelector('#cancelEdit').addEventListener('click', () => this._cancelEdit());
        
        console.log('📝 Blog Editor: ✅ Event listeners set up complete');
    }
    
    _initializeQuill() {
        console.log('========================================');
        console.log('📝 Blog Editor: INITIALIZING QUILL EDITOR');
        console.log('📝 Blog Editor: Window.Quill exists:', !!window.Quill);
        console.log('========================================');
        
        if (!window.Quill) {
            console.error('📝 Blog Editor: ❌ Quill not loaded!');
            this._showToast('error', 'Editor failed to load');
            return;
        }
        
        const editorElement = this.querySelector('#quillEditor');
        console.log('📝 Blog Editor: Quill element found:', !!editorElement);
        
        if (!editorElement) {
            console.error('📝 Blog Editor: ❌ Editor element not found!');
            return;
        }
        
       try {
            console.log('📝 Blog Editor: Creating Quill instance...');
            
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
            
            console.log('📝 Blog Editor: ✅ Quill instance created');
            console.log('📝 Blog Editor: Quill object:', this._quill);
            console.log('📝 Blog Editor: Quill toolbar:', !!this._quill.getModule('toolbar'));
            
            this._editorReady = true;
            console.log('📝 Blog Editor: Editor ready flag set to true');
            
            // Verify editor is visible
            setTimeout(() => {
                const toolbar = editorElement.querySelector('.ql-toolbar');
                const container = editorElement.querySelector('.ql-container');
                
                console.log('========================================');
                console.log('📝 Blog Editor: QUILL VISIBILITY CHECK');
                console.log('📝 Blog Editor: Toolbar exists:', !!toolbar);
                console.log('📝 Blog Editor: Container exists:', !!container);
                
                if (toolbar) {
                    console.log('📝 Blog Editor: Toolbar display:', window.getComputedStyle(toolbar).display);
                }
                if (container) {
                    console.log('📝 Blog Editor: Container display:', window.getComputedStyle(container).display);
                }
                console.log('========================================');
            }, 100);
            
        } catch (error) {
            console.error('========================================');
            console.error('📝 Blog Editor: ❌ FAILED TO INITIALIZE QUILL');
            console.error('📝 Blog Editor: Error:', error);
            console.error('📝 Blog Editor: Error stack:', error.stack);
            console.error('========================================');
            this._showToast('error', 'Failed to initialize editor');
        }
    }
    
    _convertQuillToMarkdown(delta) {
        let markdown = '';
        
        const ops = delta.ops || [];
        
        ops.forEach(op => {
            if (typeof op.insert === 'string') {
                let text = op.insert;
                
                // Apply formatting
                if (op.attributes) {
                    if (op.attributes.bold) {
                        text = `**${text}**`;
                    }
                    if (op.attributes.italic) {
                        text = `*${text}*`;
                    }
                    if (op.attributes.strike) {
                        text = `~~${text}~~`;
                    }
                    if (op.attributes.code) {
                        text = `\`${text}\``;
                    }
                    if (op.attributes.link) {
                        text = `[${text}](${op.attributes.link})`;
                    }
                    if (op.attributes.header) {
                        const level = '#'.repeat(op.attributes.header);
                        text = `${level} ${text}\n`;
                    }
                    if (op.attributes.blockquote) {
                        text = `> ${text}\n`;
                    }
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
        console.log('========================================');
        console.log('📝 Blog Editor: SAVE POST CALLED');
        console.log('========================================');
        
        const title = this.querySelector('#titleInput').value.trim();
        const slug = this.querySelector('#slugInput').value.trim();
        
        console.log('📝 Blog Editor: Title:', title);
        console.log('📝 Blog Editor: Slug:', slug);
        
        if (!title) {
            console.log('📝 Blog Editor: ❌ No title provided');
            this._showToast('error', 'Please enter a title');
            return;
        }
        
        if (!this._quill) {
            console.log('📝 Blog Editor: ❌ Editor not ready');
            this._showToast('error', 'Editor not ready');
            return;
        }
        
        try {
            console.log('📝 Blog Editor: Getting content from Quill...');
            const delta = this._quill.getContents();
            const htmlContent = this._quill.root.innerHTML;
            const markdown = this._convertQuillToMarkdown(delta);
            
            console.log('📝 Blog Editor: Delta blocks:', delta.ops?.length || 0);
            console.log('📝 Blog Editor: HTML length:', htmlContent.length);
            console.log('📝 Blog Editor: Markdown length:', markdown.length);
            
            const formData = {
                _id: this._editingItemId,
                title: title,
                slug: slug,
                excerpt: this.querySelector('#excerptInput').value,
                content: markdown,
                htmlContent: htmlContent,
                quillDelta: JSON.stringify(delta),
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
            
            console.log('📝 Blog Editor: Form data prepared');
            console.log('📝 Blog Editor: Editing ID:', this._editingItemId || 'NEW POST');
            
            const promises = [];
            
            ['featuredImage', 'authorImage', 'seoOgImage'].forEach(key => {
                if (formData[key] && formData[key] instanceof File) {
                    console.log(`📝 Blog Editor: Converting ${key} to base64...`);
                    promises.push(
                        new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                                formData[key] = {
                                    data: reader.result.split(',')[1],
                                    name: formData[key].name,
                                    type: formData[key].type
                                };
                                console.log(`📝 Blog Editor: ✅ ${key} converted`);
                                resolve();
                            };
                            reader.readAsDataURL(formData[key]);
                        })
                    );
                }
            });
            
            await Promise.all(promises);
            console.log('📝 Blog Editor: All images converted');
            
            console.log('📝 Blog Editor: Dispatching save-blog-post event...');
            this._dispatchEvent('save-blog-post', formData);
            console.log('📝 Blog Editor: ✅ Event dispatched');
            
        } catch (error) {
            console.error('========================================');
            console.error('📝 Blog Editor: ❌ SAVE ERROR');
            console.error('📝 Blog Editor: Error:', error);
            console.error('📝 Blog Editor: Stack:', error.stack);
            console.error('========================================');
            this._showToast('error', 'Failed to save post');
        }
    }
    
    _cancelEdit() {
        console.log('📝 Blog Editor: Cancel edit clicked');
        this._editingItemId = null;
        this._resetForm();
        this.querySelector('#cancelEdit').style.display = 'none';
    }
    
    _resetForm() {
        console.log('📝 Blog Editor: Resetting form...');
        
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
        
        if (this._quill) {
            console.log('📝 Blog Editor: Clearing Quill content...');
            this._quill.setContents([]);
        }
        
        console.log('📝 Blog Editor: ✅ Form reset complete');
    }
    
    _renderBlogPosts(data) {
        console.log('========================================');
        console.log('📝 Blog Editor: RENDERING BLOG POSTS');
        console.log('📝 Blog Editor: Posts count:', data.posts?.length || 0);
        console.log('========================================');
        
        const loading = this.querySelector('#loadingPosts');
        const grid = this.querySelector('#postsGrid');
        
        loading.classList.add('hide');
        
        if (!data.posts || data.posts.length === 0) {
            console.log('📝 Blog Editor: No posts to display');
            grid.innerHTML = '<div style="text-align: center; padding: 60px; color: #6b7280;">No blog posts yet. Create your first post!</div>';
            return;
        }
        
        console.log('📝 Blog Editor: Rendering', data.posts.length, 'posts...');
        
        grid.innerHTML = data.posts.map(post => `
            <div class="blog-editor-post-card">
                <img src="${post.featuredImage?.url || 'https://via.placeholder.com/400x300?text=No+Image'}" class="blog-editor-post-card-image">
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
        
        console.log('📝 Blog Editor: Posts HTML rendered');
        
        grid.querySelectorAll('.edit-post-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                console.log('📝 Blog Editor: Edit post clicked:', id);
                this._dispatchEvent('load-post-for-edit', { id });
            });
        });
        
        grid.querySelectorAll('.delete-post-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                console.log('📝 Blog Editor: Delete post clicked:', id);
                if (confirm('Are you sure you want to delete this post?')) {
                    this._dispatchEvent('delete-blog-post', { id });
                }
            });
        });
        
        console.log('📝 Blog Editor: ✅ Posts rendered with event listeners');
    }
    
    _loadEditData(data) {
        console.log('========================================');
        console.log('📝 Blog Editor: LOADING EDIT DATA');
        console.log('📝 Blog Editor: Post ID:', data._id);
        console.log('📝 Blog Editor: Post Title:', data.title);
        console.log('========================================');
        
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
                <img src="${data.featuredImage.url}" class="blog-editor-image-preview">
            `;
            this._formData.featuredImage = data.featuredImage;
        }
        
        if (data.authorImage) {
            this.querySelector('#authorImagePreview').innerHTML = `
                <img src="${data.authorImage.url}" class="blog-editor-image-preview">
            `;
            this._formData.authorImage = data.authorImage;
        }
        
        if (data.seoOgImage) {
            this.querySelector('#seoOgImagePreview').innerHTML = `
                <img src="${data.seoOgImage.url}" class="blog-editor-image-preview">
            `;
            this._formData.seoOgImage = data.seoOgImage;
        }
        
        this._formData.publishedDate = data.publishedDate;
        
        // Load Quill content
        if (this._quill && data.quillDelta) {
            try {
                console.log('📝 Blog Editor: Loading Quill delta...');
                const delta = JSON.parse(data.quillDelta);
                this._quill.setContents(delta);
                console.log('📝 Blog Editor: ✅ Quill content loaded');
            } catch (e) {
                console.error('📝 Blog Editor: Failed to load Quill delta:', e);
                // Fallback to HTML
                if (data.htmlContent) {
                    console.log('📝 Blog Editor: Falling back to HTML content...');
                    this._quill.root.innerHTML = data.htmlContent;
                }
            }
        }
        
        this.querySelector('[data-view="editor"]').click();
        this.querySelector('#cancelEdit').style.display = 'inline-block';
        
        console.log('📝 Blog Editor: ✅ Edit data loaded');
    }
    
    _handleImageUploadResult(result) {
        console.log('📝 Blog Editor: Image upload result received:', result);
    }
    
    _dispatchEvent(name, detail) {
        console.log('========================================');
        console.log('📝 Blog Editor: DISPATCHING EVENT');
        console.log('📝 Blog Editor: Event name:', name);
        console.log('📝 Blog Editor: Event detail keys:', Object.keys(detail));
        console.log('========================================');
        
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
    
    _showToast(type, message) {
        console.log('📝 Blog Editor: Showing toast:', type, message);
        const toast = this.querySelector('#toast');
        if (!toast) {
            console.error('📝 Blog Editor: Toast element not found!');
            return;
        }
        
        toast.textContent = message;
        toast.className = `blog-editor-toast blog-editor-toast-${type} show`;
        setTimeout(() => toast.classList.remove('show'), 5000);
    }
}

customElements.define('blog-editor-dashboard', BlogEditorDashboard);
console.log('========================================');
console.log('📝 Blog Editor: ✅ CUSTOM ELEMENT REGISTERED');
console.log('📝 Blog Editor: Element name: blog-editor-dashboard');
console.log('========================================');
