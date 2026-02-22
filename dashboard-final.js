class BlogEditorDashboard extends HTMLElement {
    constructor() {
        super();
        console.log('📝 Blog Editor: Initializing...');
        this._shadow = this.attachShadow({ mode: 'open' });
        this._root = document.createElement('div');
        
        // Editor state
        this._content = '';
        this._cursorPosition = 0;
        this._selectedImageFile = null;
        this._editingItemId = null;
        
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
        this._setupEventListeners();
        console.log('📝 Blog Editor: Complete');
    }
    
    static get observedAttributes() {
        return ['notification', 'image-upload-result', 'blog-posts-data', 'edit-data'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'notification' && newValue && newValue !== oldValue) {
            try {
                const notification = JSON.parse(newValue);
                this._showToast(notification.type, notification.message);
            } catch (e) {
                console.error('📝 Blog Editor: Notification error:', e);
            }
        }
        
        if (name === 'image-upload-result' && newValue && newValue !== oldValue) {
            try {
                const result = JSON.parse(newValue);
                this._handleImageUploadResult(result);
            } catch (e) {
                console.error('📝 Blog Editor: Image upload result error:', e);
            }
        }
        
        if (name === 'blog-posts-data' && newValue && newValue !== oldValue) {
            try {
                const data = JSON.parse(newValue);
                this._renderBlogPosts(data);
            } catch (e) {
                console.error('📝 Blog Editor: Blog posts data error:', e);
            }
        }
        
        if (name === 'edit-data' && newValue && newValue !== oldValue) {
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
        this._dispatchEvent('load-blog-posts', {});
    }
    
    _createStructure() {
        this._root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
                
                * { box-sizing: border-box; margin: 0; padding: 0; }
                
                :host {
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
                
                .editor-main {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                
                .editor-toolbar {
                    background: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                    padding: 12px 16px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .toolbar-group {
                    display: flex;
                    gap: 4px;
                    padding-right: 12px;
                    border-right: 1px solid #e5e7eb;
                }
                
                .toolbar-group:last-child { border-right: none; }
                
                .toolbar-btn {
                    width: 36px;
                    height: 36px;
                    border: none;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    position: relative;
                }
                
                .toolbar-btn:hover {
                    background: #f3f4f6;
                    transform: translateY(-1px);
                }
                
                .toolbar-btn:active { transform: translateY(0); }
                
                .toolbar-btn svg {
                    width: 18px;
                    height: 18px;
                    fill: #374151;
                }
                
                .toolbar-btn:hover::after {
                    content: attr(data-tooltip);
                    position: absolute;
                    bottom: -32px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #1f2937;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    white-space: nowrap;
                    z-index: 100;
                }
                
                .editor-textarea {
                    width: 100%;
                    min-height: 600px;
                    padding: 24px;
                    border: none;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 14px;
                    line-height: 1.6;
                    resize: vertical;
                    outline: none;
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
                
                /* Modal */
                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                
                .modal.active { display: flex; }
                
                .modal-content {
                    background: white;
                    border-radius: 16px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .modal-header {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: white;
                    padding: 20px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .modal-title { font-size: 20px; font-weight: 700; }
                
                .modal-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                }
                
                .modal-body { padding: 24px; }
                
                .modal-footer {
                    padding: 16px 24px;
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .image-upload-options {
                    display: flex;
                    gap: 12px;
                    margin-top: 16px;
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
                            <p class="subtitle">Create SEO-optimized blog posts with markdown support</p>
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
                        
                        <!-- Editor View -->
                        <div class="editor-view active">
                            <div class="editor-container">
                                <div class="editor-main">
                                    <div class="editor-toolbar">
                                        <div class="toolbar-group">
                                            <button class="toolbar-btn" data-action="h1" data-tooltip="Heading 1">
                                                <svg viewBox="0 0 24 24"><text x="4" y="18" font-size="16" font-weight="bold">H1</text></svg>
                                            </button>
                                            <button class="toolbar-btn" data-action="h2" data-tooltip="Heading 2">
                                                <svg viewBox="0 0 24 24"><text x="4" y="18" font-size="14" font-weight="bold">H2</text></svg>
                                            </button>
                                            <button class="toolbar-btn" data-action="h3" data-tooltip="Heading 3">
                                                <svg viewBox="0 0 24 24"><text x="4" y="18" font-size="12" font-weight="bold">H3</text></svg>
                                            </button>
                                        </div>
                                        
                                        <div class="toolbar-group">
                                            <button class="toolbar-btn" data-action="bold" data-tooltip="Bold">
                                                <svg viewBox="0 0 24 24"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
                                            </button>
                                            <button class="toolbar-btn" data-action="italic" data-tooltip="Italic">
                                                <svg viewBox="0 0 24 24"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/></svg>
                                            </button>
                                            <button class="toolbar-btn" data-action="strikethrough" data-tooltip="Strikethrough">
                                                <svg viewBox="0 0 24 24"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>
                                            </button>
                                        </div>
                                        
                                        <div class="toolbar-group">
                                            <button class="toolbar-btn" data-action="ul" data-tooltip="Bullet List">
                                                <svg viewBox="0 0 24 24"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
                                            </button>
                                            <button class="toolbar-btn" data-action="ol" data-tooltip="Numbered List">
                                                <svg viewBox="0 0 24 24"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
                                            </button>
                                            <button class="toolbar-btn" data-action="task" data-tooltip="Task List">
                                                <svg viewBox="0 0 24 24"><path d="M22 5.18L10.59 16.6l-4.24-4.24 1.41-1.41 2.83 2.83 10-10L22 5.18zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8c1.57 0 3.04.46 4.28 1.25l1.45-1.45C16.1 2.67 14.13 2 12 2 6.48 2 2 6.48 2 12s4.48 10 10 10c1.73 0 3.36-.44 4.78-1.22l-1.5-1.5c-1 .46-2.11.72-3.28.72zm7-5h-3v2h3v3h2v-3h3v-2h-3v-3h-2v3z"/></svg>
                                            </button>
                                        </div>
                                        
                                        <div class="toolbar-group">
                                            <button class="toolbar-btn" data-action="link" data-tooltip="Insert Link">
                                                <svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
                                            </button>
                                            <button class="toolbar-btn" data-action="image" data-tooltip="Insert Image">
                                                <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                                            </button>
                                            <button class="toolbar-btn" data-action="code" data-tooltip="Inline Code">
                                                <svg viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
                                            </button>
                                            <button class="toolbar-btn" data-action="codeblock" data-tooltip="Code Block">
                                                <svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
                                            </button>
                                        </div>
                                        
                                        <div class="toolbar-group">
                                            <button class="toolbar-btn" data-action="quote" data-tooltip="Blockquote">
                                                <svg viewBox="0 0 24 24"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
                                            </button>
                                            <button class="toolbar-btn" data-action="hr" data-tooltip="Horizontal Rule">
                                                <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
                                            </button>
                                            <button class="toolbar-btn" data-action="table" data-tooltip="Insert Table">
                                                <svg viewBox="0 0 24 24"><path d="M10 10.02h5V21h-5zM17 21h3c1.1 0 2-.9 2-2v-9h-5v11zm3-18H5c-1.1 0-2 .9-2 2v3h19V5c0-1.1-.9-2-2-2zM3 19c0 1.1.9 2 2 2h3V10.02H3V19z"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <textarea 
                                        class="editor-textarea" 
                                        id="contentEditor"
                                        placeholder="Start writing your blog post in markdown..."
                                    ></textarea>
                                </div>
                                
                                <div class="editor-sidebar">
                                    <!-- Basic Info -->
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
                                    
                                    <!-- Featured Image -->
                                    <div class="sidebar-section">
                                        <div class="section-title">🖼️ Featured Image</div>
                                        <input type="file" id="featuredImageInput" accept="image/*" style="display: none;">
                                        <div class="image-upload-area" id="featuredImageArea">
                                            <div>📸 Click to upload featured image</div>
                                        </div>
                                        <div id="featuredImagePreview"></div>
                                    </div>
                                    
                                    <!-- Author Info -->
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
                                    
                                    <!-- Publishing -->
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
                                    
                                    <!-- SEO -->
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
                        
                        <!-- Posts View -->
                        <div class="posts-view">
                            <div id="loadingPosts" class="loading">
                                <div class="spinner"></div>
                            </div>
                            <div class="posts-grid" id="postsGrid"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Image Upload Modal -->
            <div class="modal" id="imageModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Upload Image to Editor</h2>
                        <button class="modal-close" id="closeImageModal">×</button>
                    </div>
                    <div class="modal-body">
                        <input type="file" id="editorImageInput" accept="image/*" style="display: none;">
                        <div class="image-upload-area" id="editorImageUploadArea">
                            <div style="font-size: 48px; margin-bottom: 12px;">📷</div>
                            <div style="font-weight: 600; margin-bottom: 4px;">Click to select image</div>
                            <div style="font-size: 12px; color: #6b7280;">Supported: JPG, PNG, GIF, WebP</div>
                        </div>
                        <div id="editorImagePreview"></div>
                        
                        <div id="imageOptionsSection" style="display: none;">
                            <div class="form-group">
                                <label class="label">Alt Text</label>
                                <input type="text" class="input" id="imageAltText" placeholder="Describe the image">
                            </div>
                            
                            <div class="image-upload-options">
                                <button class="btn btn-primary" id="uploadImageBtn">📤 Upload Image</button>
                                <button class="btn btn-success" id="optimizeUploadBtn">⚡ Optimize & Upload</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="toast" id="toast"></div>
        `;
        
        this._shadow.appendChild(this._root);
    }

    _setupEventListeners() {
        // View toggle
        const viewBtns = this._shadow.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const view = btn.dataset.view;
                this._shadow.querySelector('.editor-view').classList.toggle('active', view === 'editor');
                this._shadow.querySelector('.posts-view').classList.toggle('active', view === 'posts');
                
                if (view === 'posts') {
                    this._dispatchEvent('load-blog-posts', {});
                }
            });
        });
        
        // Toolbar buttons
        const toolbarBtns = this._shadow.querySelectorAll('.toolbar-btn');
        toolbarBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this._handleToolbarAction(action);
            });
        });
        
        // Title to slug auto-generation
        this._shadow.getElementById('titleInput').addEventListener('input', (e) => {
            const slug = this._generateSlug(e.target.value);
            this._shadow.getElementById('slugInput').value = slug;
        });
        
        // Tags
        this._shadow.getElementById('addTagBtn').addEventListener('click', () => this._addTag());
        this._shadow.getElementById('tagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._addTag();
            }
        });
        
        // Image uploads
        this._setupImageUpload('featuredImage');
        this._setupImageUpload('authorImage');
        this._setupImageUpload('seoOgImage');
        
        // Editor image upload
        this._shadow.getElementById('editorImageUploadArea').addEventListener('click', () => {
            this._shadow.getElementById('editorImageInput').click();
        });
        
        this._shadow.getElementById('editorImageInput').addEventListener('change', (e) => {
            this._handleEditorImageSelect(e);
        });
        
        this._shadow.getElementById('uploadImageBtn').addEventListener('click', () => {
            this._uploadEditorImage(false);
        });
        
        this._shadow.getElementById('optimizeUploadBtn').addEventListener('click', () => {
            this._uploadEditorImage(true);
        });
        
        this._shadow.getElementById('closeImageModal').addEventListener('click', () => {
            this._hideImageModal();
        });
        
        // Save post
        this._shadow.getElementById('savePost').addEventListener('click', () => this._savePost());
        
        // Cancel edit
        this._shadow.getElementById('cancelEdit').addEventListener('click', () => this._cancelEdit());
    }
    
    _setupImageUpload(type) {
        const area = this._shadow.getElementById(`${type}Area`);
        const input = this._shadow.getElementById(`${type}Input`);
        
        area.addEventListener('click', () => input.click());
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = this._shadow.getElementById(`${type}Preview`);
                preview.innerHTML = `
                    <img src="${event.target.result}" class="image-preview">
                    <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">${file.name}</div>
                `;
                
                // Store file for upload
                this._formData[type] = file;
            };
            reader.readAsDataURL(file);
        });
    }
    
    _handleToolbarAction(action) {
        const textarea = this._shadow.getElementById('contentEditor');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const beforeText = textarea.value.substring(0, start);
        const afterText = textarea.value.substring(end);
        
        let newText = '';
        let cursorOffset = 0;
        
        switch(action) {
            case 'h1':
                newText = `# ${selectedText || 'Heading 1'}`;
                cursorOffset = selectedText ? 0 : -9;
                break;
            case 'h2':
                newText = `## ${selectedText || 'Heading 2'}`;
                cursorOffset = selectedText ? 0 : -9;
                break;
            case 'h3':
                newText = `### ${selectedText || 'Heading 3'}`;
                cursorOffset = selectedText ? 0 : -9;
                break;
            case 'bold':
                newText = `**${selectedText || 'bold text'}**`;
                cursorOffset = selectedText ? 0 : -11;
                break;
            case 'italic':
                newText = `*${selectedText || 'italic text'}*`;
                cursorOffset = selectedText ? 0 : -12;
                break;
            case 'strikethrough':
                newText = `~~${selectedText || 'strikethrough'}~~`;
                cursorOffset = selectedText ? 0 : -15;
                break;
            case 'ul':
                newText = `- ${selectedText || 'List item'}`;
                cursorOffset = selectedText ? 0 : -9;
                break;
            case 'ol':
                newText = `1. ${selectedText || 'List item'}`;
                cursorOffset = selectedText ? 0 : -9;
                break;
            case 'task':
                newText = `- [ ] ${selectedText || 'Task item'}`;
                cursorOffset = selectedText ? 0 : -9;
                break;
            case 'link':
                newText = `[${selectedText || 'link text'}](url)`;
                cursorOffset = selectedText ? -4 : -13;
                break;
            case 'image':
                this._showImageModal();
                return;
            case 'code':
                newText = `\`${selectedText || 'code'}\``;
                cursorOffset = selectedText ? 0 : -5;
                break;
            case 'codeblock':
                newText = `\`\`\`javascript\n${selectedText || 'code here'}\n\`\`\``;
                cursorOffset = selectedText ? 0 : -14;
                break;
            case 'quote':
                newText = `> ${selectedText || 'quote'}`;
                cursorOffset = selectedText ? 0 : -5;
                break;
            case 'hr':
                newText = `---`;
                break;
            case 'table':
                newText = `| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |`;
                break;
        }
        
        textarea.value = beforeText + newText + afterText;
        const newCursorPos = start + newText.length + cursorOffset;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
        
        this._content = textarea.value;
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
        const input = this._shadow.getElementById('tagInput');
        const tag = input.value.trim();
        
        if (!tag) return;
        
        if (!this._formData.tags.includes(tag)) {
            this._formData.tags.push(tag);
            this._renderTags();
        }
        
        input.value = '';
    }
    
    _renderTags() {
        const container = this._shadow.getElementById('tagsDisplay');
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
    
    _showImageModal() {
        this._shadow.getElementById('imageModal').classList.add('active');
    }
    
    _hideImageModal() {
        this._shadow.getElementById('imageModal').classList.remove('active');
        this._shadow.getElementById('editorImageInput').value = '';
        this._shadow.getElementById('editorImagePreview').innerHTML = '';
        this._shadow.getElementById('imageOptionsSection').style.display = 'none';
        this._shadow.getElementById('imageAltText').value = '';
        this._selectedImageFile = null;
    }
    
    _handleEditorImageSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        this._selectedImageFile = file;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = this._shadow.getElementById('editorImagePreview');
            preview.innerHTML = `
                <img src="${event.target.result}" class="image-preview" style="margin-top: 16px;">
                <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">${file.name} (${(file.size / 1024).toFixed(2)} KB)</div>
            `;
            
            this._shadow.getElementById('imageOptionsSection').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
    
    _uploadEditorImage(optimize) {
        if (!this._selectedImageFile) return;
        
        const altText = this._shadow.getElementById('imageAltText').value || 'Image';
        
        this._dispatchEvent('upload-editor-image', {
            file: this._selectedImageFile,
            optimize: optimize,
            altText: altText
        });
    }
    
    _handleImageUploadResult(result) {
        if (result.success) {
            const textarea = this._shadow.getElementById('contentEditor');
            const markdownImage = `![${result.altText}](${result.url})`;
            
            const cursorPos = textarea.selectionStart;
            const beforeText = textarea.value.substring(0, cursorPos);
            const afterText = textarea.value.substring(cursorPos);
            
            textarea.value = beforeText + '\n' + markdownImage + '\n' + afterText;
            this._content = textarea.value;
            
            this._hideImageModal();
            this._showToast('success', 'Image uploaded and inserted!');
        } else {
            this._showToast('error', result.error || 'Image upload failed');
        }
    }
    
    _savePost() {
        // Gather all form data
        const title = this._shadow.getElementById('titleInput').value.trim();
        const slug = this._shadow.getElementById('slugInput').value.trim();
        const content = this._shadow.getElementById('contentEditor').value;
        
        if (!title) {
            this._showToast('error', 'Please enter a title');
            return;
        }
        
        if (!content) {
            this._showToast('error', 'Please write some content');
            return;
        }
        
        const formData = {
            _id: this._editingItemId,
            title: title,
            slug: slug,
            excerpt: this._shadow.getElementById('excerptInput').value,
            content: content,
            author: this._shadow.getElementById('authorInput').value,
            category: this._shadow.getElementById('categoryInput').value,
            tags: this._formData.tags,
            status: this._shadow.getElementById('statusSelect').value,
            readTime: parseInt(this._shadow.getElementById('readTimeInput').value) || 5,
            isFeatured: this._shadow.getElementById('isFeaturedCheckbox').checked,
            seoTitle: this._shadow.getElementById('seoTitleInput').value,
            seoDescription: this._shadow.getElementById('seoDescriptionInput').value,
            seoKeywords: this._shadow.getElementById('seoKeywordsInput').value,
            featuredImage: this._formData.featuredImage,
            authorImage: this._formData.authorImage,
            seoOgImage: this._formData.seoOgImage,
            publishedDate: this._formData.publishedDate || new Date().toISOString(),
            modifiedDate: new Date().toISOString()
        };
        
        this._dispatchEvent('save-blog-post', formData);
    }
    
    _cancelEdit() {
        this._editingItemId = null;
        this._resetForm();
        this._shadow.getElementById('cancelEdit').style.display = 'none';
    }
    
    _resetForm() {
        this._shadow.getElementById('titleInput').value = '';
        this._shadow.getElementById('slugInput').value = '';
        this._shadow.getElementById('excerptInput').value = '';
        this._shadow.getElementById('contentEditor').value = '';
        this._shadow.getElementById('authorInput').value = '';
        this._shadow.getElementById('categoryInput').value = '';
        this._shadow.getElementById('readTimeInput').value = '5';
        this._shadow.getElementById('seoTitleInput').value = '';
        this._shadow.getElementById('seoDescriptionInput').value = '';
        this._shadow.getElementById('seoKeywordsInput').value = '';
        this._shadow.getElementById('isFeaturedCheckbox').checked = false;
        this._shadow.getElementById('statusSelect').value = 'draft';
        
        this._formData.tags = [];
        this._renderTags();
        
        this._shadow.getElementById('featuredImagePreview').innerHTML = '';
        this._shadow.getElementById('authorImagePreview').innerHTML = '';
        this._shadow.getElementById('seoOgImagePreview').innerHTML = '';
        
        this._formData.featuredImage = null;
        this._formData.authorImage = null;
        this._formData.seoOgImage = null;
    }
    
    _renderBlogPosts(data) {
        const loading = this._shadow.getElementById('loadingPosts');
        const grid = this._shadow.getElementById('postsGrid');
        
        loading.style.display = 'none';
        
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
                        <button class="btn btn-primary" data-id="${post._id}">✏️ Edit</button>
                        <button class="btn btn-danger" data-id="${post._id}">🗑️ Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        grid.querySelectorAll('.btn-primary').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this._dispatchEvent('load-post-for-edit', { id });
            });
        });
        
        grid.querySelectorAll('.btn-danger').forEach(btn => {
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
        
        this._shadow.getElementById('titleInput').value = data.title || '';
        this._shadow.getElementById('slugInput').value = data.slug || '';
        this._shadow.getElementById('excerptInput').value = data.excerpt || '';
        this._shadow.getElementById('contentEditor').value = data.content || '';
        this._shadow.getElementById('authorInput').value = data.author || '';
        this._shadow.getElementById('categoryInput').value = data.category || '';
        this._shadow.getElementById('readTimeInput').value = data.readTime || 5;
        this._shadow.getElementById('seoTitleInput').value = data.seoTitle || '';
        this._shadow.getElementById('seoDescriptionInput').value = data.seoDescription || '';
        this._shadow.getElementById('seoKeywordsInput').value = data.seoKeywords || '';
        this._shadow.getElementById('isFeaturedCheckbox').checked = data.isFeatured || false;
        this._shadow.getElementById('statusSelect').value = data.status || 'draft';
        
        this._formData.tags = data.tags || [];
        this._renderTags();
        
        if (data.featuredImage) {
            this._shadow.getElementById('featuredImagePreview').innerHTML = `
                <img src="${data.featuredImage.url}" class="image-preview">
            `;
            this._formData.featuredImage = data.featuredImage;
        }
        
        if (data.authorImage) {
            this._shadow.getElementById('authorImagePreview').innerHTML = `
                <img src="${data.authorImage.url}" class="image-preview">
            `;
            this._formData.authorImage = data.authorImage;
        }
        
        if (data.seoOgImage) {
            this._shadow.getElementById('seoOgImagePreview').innerHTML = `
                <img src="${data.seoOgImage.url}" class="image-preview">
            `;
            this._formData.seoOgImage = data.seoOgImage;
        }
        
        this._formData.publishedDate = data.publishedDate;
        
        // Switch to editor view
        this._shadow.querySelector('[data-view="editor"]').click();
        this._shadow.getElementById('cancelEdit').style.display = 'inline-block';
    }
    
    _dispatchEvent(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
    
    _showToast(type, message) {
        const toast = this._shadow.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;
        setTimeout(() => toast.classList.remove('show'), 5000);
    }
}

customElements.define('blog-editor-dashboard', BlogEditorDashboard);
console.log('📝 Blog Editor: ✅ Custom element registered');
