class BlogDashboard extends HTMLElement {
    constructor() {
        super();
        console.log('📝 Blog Dashboard: Initializing...');
        this._shadow = this.attachShadow({ mode: 'open' });
        this._posts = [];
        this._currentPage = 0;
        this._pageSize = 10;
        this._totalPosts = 0;
        this._selectedPost = null;
        this._featuredImageFile = null;
        this._authorImageFile = null;
        this._editorContent = '';
        this._root = document.createElement('div');
        
        this._createStructure();
        this._setupEventListeners();
        console.log('📝 Blog Dashboard: Complete');
    }
    
    static get observedAttributes() {
        return ['blog-posts', 'notification', 'upload-progress'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'blog-posts' && newValue && newValue !== oldValue) {
            try {
                const data = JSON.parse(newValue);
                this.setPosts(data);
            } catch (e) {
                console.error('📝 Dashboard: Parse error:', e);
            }
        }
        
        if (name === 'notification' && newValue && newValue !== oldValue) {
            try {
                const notification = JSON.parse(newValue);
                this._showToast(notification.type, notification.message);
                if (notification.type === 'success') {
                    this._hideModal();
                }
            } catch (e) {
                console.error('📝 Dashboard: Notification error:', e);
            }
        }
        
        if (name === 'upload-progress' && newValue && newValue !== oldValue) {
            try {
                const progress = JSON.parse(newValue);
                this._updateUploadProgress(progress);
            } catch (e) {
                console.error('📝 Dashboard: Progress error:', e);
            }
        }
    }
    
    connectedCallback() {
        console.log('📝 Dashboard: Connected to DOM');
    }
    
    _createStructure() {
        this._root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
                
                * { box-sizing: border-box; margin: 0; padding: 0; }
                
                :host {
                    display: block;
                    width: 100%;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    background: #f9fafb;
                }
                
                .material-icons {
                    font-family: 'Material Icons';
                    font-weight: normal;
                    font-style: normal;
                    font-size: 20px;
                    display: inline-block;
                    line-height: 1;
                    text-transform: none;
                    letter-spacing: normal;
                    word-wrap: normal;
                    white-space: nowrap;
                    direction: ltr;
                }
                
                .container { width: 100%; min-height: 600px; }
                
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 32px;
                }
                
                .header-content { 
                    max-width: 1400px; 
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .header-left { flex: 1; }
                
                .title {
                    font-size: 32px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                
                .subtitle {
                    font-size: 16px;
                    opacity: 0.95;
                }
                
                .btn-create {
                    background: white;
                    color: #667eea;
                    padding: 14px 28px;
                    border: none;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .btn-create:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                }
                
                .stats {
                    display: flex;
                    gap: 24px;
                    margin-top: 24px;
                    flex-wrap: wrap;
                }
                
                .stat {
                    background: rgba(255,255,255,0.15);
                    padding: 16px 20px;
                    border-radius: 12px;
                    min-width: 140px;
                }
                
                .stat-label { font-size: 13px; opacity: 0.9; }
                .stat-value { font-size: 28px; font-weight: 700; margin-top: 4px; }
                
                .main { padding: 32px; }
                
                .content { max-width: 1400px; margin: 0 auto; }
                
                .posts-table {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                thead {
                    background: #f9fafb;
                    border-bottom: 2px solid #e5e7eb;
                }
                
                th {
                    padding: 16px;
                    text-align: left;
                    font-weight: 600;
                    color: #374151;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                tbody tr {
                    border-bottom: 1px solid #f3f4f6;
                    transition: background 0.2s;
                }
                
                tbody tr:hover {
                    background: #f9fafb;
                }
                
                td {
                    padding: 16px;
                    color: #6b7280;
                    font-size: 14px;
                }
                
                .post-title {
                    font-weight: 600;
                    color: #111827;
                    font-size: 15px;
                    max-width: 300px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .post-image {
                    width: 60px;
                    height: 60px;
                    border-radius: 8px;
                    object-fit: cover;
                    border: 2px solid #e5e7eb;
                }
                
                .badge {
                    display: inline-flex;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .badge-published { background: #d1fae5; color: #065f46; }
                .badge-draft { background: #fef3c7; color: #92400e; }
                
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                    margin-right: 8px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .btn:hover { transform: translateY(-1px); }
                
                .btn-primary { background: #8b5cf6; color: white; }
                .btn-warning { background: #f59e0b; color: white; }
                .btn-danger { background: #ef4444; color: white; }
                
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
                    overflow-y: auto;
                    padding: 20px;
                }
                
                .modal.active { display: flex; }
                
                .modal-content {
                    background: white;
                    border-radius: 20px;
                    max-width: 1000px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    margin: auto;
                }
                
                .modal-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 24px 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                
                .modal-title { font-size: 24px; font-weight: 700; }
                
                .modal-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-body { padding: 32px; }
                
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                
                .form-group { margin-bottom: 20px; }
                .form-group.full { grid-column: 1 / -1; }
                
                .label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #374151;
                    font-size: 14px;
                }
                
                .input, .textarea, .select {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }
                
                .input:focus, .textarea:focus, .select:focus {
                    outline: none;
                    border-color: #8b5cf6;
                }
                
                .textarea {
                    min-height: 100px;
                    resize: vertical;
                }
                
                .file-upload {
                    border: 2px dashed #e5e7eb;
                    border-radius: 12px;
                    padding: 24px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: #f9fafb;
                }
                
                .file-upload:hover {
                    border-color: #8b5cf6;
                    background: #ede9fe;
                }
                
                .file-upload input {
                    display: none;
                }
                
                .file-preview {
                    margin-top: 12px;
                    display: none;
                }
                
                .file-preview.active {
                    display: block;
                }
                
                .file-preview img {
                    max-width: 200px;
                    border-radius: 8px;
                    border: 2px solid #e5e7eb;
                }

                /* Rich Content Editor */
                .rich-editor {
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    background: white;
                    overflow: hidden;
                }

                .editor-toolbar {
                    background: #f9fafb;
                    border-bottom: 2px solid #e5e7eb;
                    padding: 12px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .toolbar-group {
                    display: flex;
                    gap: 4px;
                    padding: 4px;
                    border-right: 1px solid #e5e7eb;
                    padding-right: 12px;
                }

                .toolbar-group:last-child {
                    border-right: none;
                }

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
                    color: #374151;
                }

                .toolbar-btn:hover {
                    background: #e5e7eb;
                    transform: translateY(-1px);
                }

                .toolbar-btn.active {
                    background: #8b5cf6;
                    color: white;
                }

                .toolbar-btn .material-icons {
                    font-size: 20px;
                }

                .editor-content {
                    padding: 24px;
                    min-height: 400px;
                    max-height: 500px;
                    overflow-y: auto;
                    font-size: 16px;
                    line-height: 1.7;
                    color: #111827;
                }

                .editor-content:focus {
                    outline: none;
                }

                .editor-content[contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    font-style: italic;
                }

                .editor-content h1 {
                    font-size: 2em;
                    font-weight: 700;
                    margin: 0.67em 0;
                }

                .editor-content h2 {
                    font-size: 1.5em;
                    font-weight: 700;
                    margin: 0.75em 0;
                }

                .editor-content h3 {
                    font-size: 1.17em;
                    font-weight: 700;
                    margin: 0.83em 0;
                }

                .editor-content ul, .editor-content ol {
                    margin: 1em 0;
                    padding-left: 2em;
                }

                .editor-content blockquote {
                    border-left: 4px solid #8b5cf6;
                    padding-left: 1em;
                    margin: 1em 0;
                    color: #6b7280;
                    font-style: italic;
                }

                .editor-content code {
                    background: #f3f4f6;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                }

                .editor-content pre {
                    background: #1f2937;
                    color: #f3f4f6;
                    padding: 16px;
                    border-radius: 8px;
                    overflow-x: auto;
                    margin: 1em 0;
                }

                .editor-content pre code {
                    background: none;
                    padding: 0;
                    color: inherit;
                }

                .editor-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 1em 0;
                }

                .editor-content a {
                    color: #8b5cf6;
                    text-decoration: underline;
                }

                .editor-content hr {
                    border: none;
                    border-top: 2px solid #e5e7eb;
                    margin: 2em 0;
                }

                /* Image Upload Modal */
                .image-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                }

                .image-modal.active {
                    display: flex;
                }

                .image-modal-content {
                    background: white;
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 500px;
                    width: 90%;
                }

                .image-modal-title {
                    font-size: 20px;
                    font-weight: 700;
                    margin-bottom: 20px;
                    color: #111827;
                }

                .image-upload-area {
                    border: 2px dashed #e5e7eb;
                    border-radius: 12px;
                    padding: 40px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: #f9fafb;
                    margin-bottom: 20px;
                }

                .image-upload-area:hover {
                    border-color: #8b5cf6;
                    background: #ede9fe;
                }

                .image-upload-area.dragover {
                    border-color: #8b5cf6;
                    background: #ede9fe;
                }

                .upload-icon {
                    font-size: 48px;
                    color: #9ca3af;
                    margin-bottom: 12px;
                }

                .image-preview-area {
                    display: none;
                    margin-top: 16px;
                }

                .image-preview-area.active {
                    display: block;
                }

                .image-preview-area img {
                    max-width: 100%;
                    border-radius: 8px;
                    border: 2px solid #e5e7eb;
                }

                .button-group {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-top: 20px;
                }
                
                .modal-footer {
                    padding: 20px 32px;
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    position: sticky;
                    bottom: 0;
                }
                
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 20px;
                    border-radius: 12px;
                    box-shadow: 0 20px 25px rgba(0,0,0,0.1);
                    display: none;
                    z-index: 3000;
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
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 20px;
                    min-height: 400px;
                }
                
                .loading.hide { display: none; }
                
                .spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid #e5e7eb;
                    border-top-color: #8b5cf6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .pagination {
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                    margin-top: 32px;
                    align-items: center;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                }
                
                .empty-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }
                
                .empty-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: #111827;
                    margin-bottom: 8px;
                }
                
                .empty-text {
                    color: #6b7280;
                    font-size: 14px;
                }

                .progress-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.8);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 3000;
                }

                .progress-overlay.active {
                    display: flex;
                }

                .progress-box {
                    background: white;
                    padding: 32px;
                    border-radius: 16px;
                    min-width: 400px;
                    text-align: center;
                }

                .progress-bar-bg {
                    width: 100%;
                    height: 12px;
                    background: #f3f4f6;
                    border-radius: 6px;
                    overflow: hidden;
                    margin-top: 16px;
                }

                .progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #8b5cf6, #7c3aed);
                    width: 0%;
                    transition: width 0.3s ease;
                }

                .progress-text {
                    margin-top: 12px;
                    color: #6b7280;
                    font-size: 14px;
                }

                .link-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                }

                .link-modal.active {
                    display: flex;
                }

                .link-modal-content {
                    background: white;
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 500px;
                    width: 90%;
                }
            </style>
            
            <div class="container">
                <div class="header">
                    <div class="header-content">
                        <div class="header-left">
                            <h1 class="title">📝 Blog Dashboard</h1>
                            <p class="subtitle">Create and manage your blog posts</p>
                            <div class="stats">
                                <div class="stat">
                                    <div class="stat-label">Total Posts</div>
                                    <div class="stat-value" id="totalPosts">0</div>
                                </div>
                                <div class="stat">
                                    <div class="stat-label">Published</div>
                                    <div class="stat-value" id="publishedCount">0</div>
                                </div>
                                <div class="stat">
                                    <div class="stat-label">Drafts</div>
                                    <div class="stat-value" id="draftCount">0</div>
                                </div>
                            </div>
                        </div>
                        <button class="btn-create" id="createBtn">
                            <span class="material-icons">edit</span>
                            Create New Post
                        </button>
                    </div>
                </div>
                
                <div class="main">
                    <div class="content">
                        <div id="loading" class="loading">
                            <div class="spinner"></div>
                            <p style="margin-top: 16px; color: #6b7280;">Loading posts...</p>
                        </div>
                        
                        <div id="postsTable" class="posts-table" style="display: none;">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="postsBody"></tbody>
                            </table>
                        </div>

                        <div id="emptyState" class="empty-state" style="display: none;">
                            <div class="empty-icon">📝</div>
                            <h3 class="empty-title">No blog posts yet</h3>
                            <p class="empty-text">Create your first blog post to get started</p>
                        </div>
                        
                        <div class="pagination" id="pagination" style="display: none;">
                            <button class="btn btn-primary" id="prevBtn" disabled>
                                <span class="material-icons">chevron_left</span>
                                Previous
                            </button>
                            <span id="pageInfo" style="font-weight: 600;">Page 1</span>
                            <button class="btn btn-primary" id="nextBtn">
                                Next
                                <span class="material-icons">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title" id="modalTitle">Create New Post</h2>
                        <button class="modal-close" id="closeModal">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="label">Post Title *</label>
                                <input type="text" class="input" id="postTitle" placeholder="Enter post title" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="label">Slug (URL) *</label>
                                <input type="text" class="input" id="postSlug" placeholder="auto-generated-from-title">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="label">Category</label>
                                <input type="text" class="input" id="postCategory" placeholder="e.g., Technology, Tutorial">
                            </div>
                            
                            <div class="form-group">
                                <label class="label">Tags (comma-separated)</label>
                                <input type="text" class="input" id="postTags" placeholder="react, javascript, tutorial">
                            </div>
                        </div>
                        
                        <div class="form-group full">
                            <label class="label">Excerpt (Short Description)</label>
                            <textarea class="textarea" id="postExcerpt" placeholder="Brief summary of the post..." maxlength="200"></textarea>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="label">Featured Image</label>
                                <div class="file-upload" id="featuredImageUpload">
                                    <input type="file" id="featuredImageInput" accept="image/*">
                                    <div><span class="material-icons" style="font-size: 32px; color: #9ca3af;">image</span></div>
                                    <div style="margin-top: 8px;">Click to upload featured image</div>
                                    <small style="color: #6b7280;">Recommended: 1200x630px</small>
                                </div>
                                <div class="file-preview" id="featuredImagePreview"></div>
                            </div>
                            
                            <div class="form-group">
                                <label class="label">Author Image</label>
                                <div class="file-upload" id="authorImageUpload">
                                    <input type="file" id="authorImageInput" accept="image/*">
                                    <div><span class="material-icons" style="font-size: 32px; color: #9ca3af;">account_circle</span></div>
                                    <div style="margin-top: 8px;">Click to upload author image</div>
                                    <small style="color: #6b7280;">Recommended: Square image</small>
                                </div>
                                <div class="file-preview" id="authorImagePreview"></div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="label">Author Name</label>
                                <input type="text" class="input" id="postAuthor" placeholder="John Doe">
                            </div>
                            
                            <div class="form-group">
                                <label class="label">Status</label>
                                <select class="select" id="postStatus">
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group full">
                            <label class="label">Content (Rich Editor) *</label>
                            <div class="rich-editor">
                                <div class="editor-toolbar">
                                    <div class="toolbar-group">
                                        <button type="button" class="toolbar-btn" data-command="bold" title="Bold">
                                            <span class="material-icons">format_bold</span>
                                        </button>
                                        <button type="button" class="toolbar-btn" data-command="italic" title="Italic">
                                            <span class="material-icons">format_italic</span>
                                        </button>
                                        <button type="button" class="toolbar-btn" data-command="underline" title="Underline">
                                            <span class="material-icons">format_underlined</span>
                                        </button>
                                        <button type="button" class="toolbar-btn" data-command="strikeThrough" title="Strikethrough">
                                            <span class="material-icons">format_strikethrough</span>
                                        </button>
                                    </div>
                                    
                                    <div class="toolbar-group">
                                        <button type="button" class="toolbar-btn" data-command="h1" title="Heading 1">
                                            <span class="material-icons">title</span>
                                        </button>
                                        <button type="button" class="toolbar-btn" data-command="h2" title="Heading 2">
                                            <span class="material-icons">format_size</span>
                                        </button>
                                        <button type="button" class="toolbar-btn" data-command="h3" title="Heading 3">
                                            <span class="material-icons">text_fields</span>
                                        </button>
                                    </div>
                                    
                                    <div class="toolbar-group">
                                        <button type="button" class="toolbar-btn" data-command="insertUnorderedList" title="Bullet List">
                                            <span class="material-icons">format_list_bulleted</span>
                                        </button>
                                        <button type="button" class="toolbar-btn" data-command="insertOrderedList" title="Numbered List">
                                            <span class="material-icons">format_list_numbered</span>
                                        </button>
                                    </div>
                                    
                                    <div class="toolbar-group">
                                        <button type="button" class="toolbar-btn" data-command="blockquote" title="Quote">
                                            <span class="material-icons">format_quote</span>
                                        </button>
                                        <button type="button" class="toolbar-btn" data-command="code" title="Code">
                                            <span class="material-icons">code</span>
                                        </button>
                                    </div>
                                    
                                    <div class="toolbar-group">
                                        <button type="button" class="toolbar-btn" id="insertImageBtn" title="Insert Image">
                                            <span class="material-icons">image</span>
                                        </button>
                                        <button type="button" class="toolbar-btn" id="insertLinkBtn" title="Insert Link">
                                            <span class="material-icons">link</span>
                                        </button>
                                    </div>
                                    
                                    <div class="toolbar-group">
                                        <button type="button" class="toolbar-btn" data-command="insertHorizontalRule" title="Horizontal Line">
                                            <span class="material-icons">horizontal_rule</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="editor-content" 
                                     id="richEditor" 
                                     contenteditable="true"
                                     data-placeholder="Start writing your blog post here...">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn" style="background: #f3f4f6; color: #111827;" id="cancelBtn">
                            <span class="material-icons">close</span>
                            Cancel
                        </button>
                        <button class="btn btn-primary" id="saveBtn">
                            <span class="material-icons">save</span>
                            Save Post
                        </button>
                    </div>
                </div>
            </div>

            <!-- Image Upload Modal -->
            <div id="imageModal" class="image-modal">
                <div class="image-modal-content">
                    <h3 class="image-modal-title">Insert Image</h3>
                    <div class="image-upload-area" id="imageUploadArea">
                        <input type="file" id="editorImageInput" accept="image/*" style="display: none;">
                        <div class="upload-icon">
                            <span class="material-icons" style="font-size: 48px;">cloud_upload</span>
                        </div>
                        <div style="font-weight: 600; margin-bottom: 4px;">Click to upload or drag and drop</div>
                        <div style="font-size: 13px; color: #6b7280;">PNG, JPG, GIF up to 10MB</div>
                    </div>
                    <div class="image-preview-area" id="editorImagePreview"></div>
                    <div class="button-group">
                        <button class="btn" style="background: #f3f4f6; color: #111827;" id="cancelImageBtn">
                            Cancel
                        </button>
                        <button class="btn btn-primary" id="insertImageConfirmBtn" style="display: none;">
                            Insert Image
                        </button>
                    </div>
                </div>
            </div>

            <!-- Link Modal -->
            <div id="linkModal" class="link-modal">
                <div class="link-modal-content">
                    <h3 class="image-modal-title">Insert Link</h3>
                    <div class="form-group">
                        <label class="label">URL</label>
                        <input type="url" class="input" id="linkUrl" placeholder="https://example.com">
                    </div>
                    <div class="form-group">
                        <label class="label">Link Text (optional)</label>
                        <input type="text" class="input" id="linkText" placeholder="Click here">
                    </div>
                    <div class="button-group">
                        <button class="btn" style="background: #f3f4f6; color: #111827;" id="cancelLinkBtn">
                            Cancel
                        </button>
                        <button class="btn btn-primary" id="insertLinkConfirmBtn">
                            Insert Link
                        </button>
                    </div>
                </div>
            </div>

            <div class="progress-overlay" id="progressOverlay">
                <div class="progress-box">
                    <h3 style="margin-bottom: 16px; color: #111827;">Uploading Images...</h3>
                    <div class="spinner"></div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar" id="uploadProgressBar"></div>
                    </div>
                    <div class="progress-text" id="progressText">Preparing...</div>
                </div>
            </div>
            
            <div class="toast" id="toast"></div>
        `;
        
        this._shadow.appendChild(this._root);
    }

    _setupEventListeners() {
        // Header button
        this._shadow.getElementById('createBtn').addEventListener('click', () => {
            this._showModal();
        });
        
        // Modal controls
        this._shadow.getElementById('closeModal').addEventListener('click', () => this._hideModal());
        this._shadow.getElementById('cancelBtn').addEventListener('click', () => this._hideModal());
        this._shadow.getElementById('saveBtn').addEventListener('click', () => this._savePost());
        
        // Title -> Slug auto-generation
        this._shadow.getElementById('postTitle').addEventListener('input', (e) => {
            const slug = this._generateSlug(e.target.value);
            this._shadow.getElementById('postSlug').value = slug;
        });
        
        // Image uploads
        this._shadow.getElementById('featuredImageUpload').addEventListener('click', () => {
            this._shadow.getElementById('featuredImageInput').click();
        });
        
        this._shadow.getElementById('authorImageUpload').addEventListener('click', () => {
            this._shadow.getElementById('authorImageInput').click();
        });
        
        this._shadow.getElementById('featuredImageInput').addEventListener('change', (e) => {
            this._handleImageSelect(e, 'featured');
        });
        
        this._shadow.getElementById('authorImageInput').addEventListener('change', (e) => {
            this._handleImageSelect(e, 'author');
        });
        
        // Pagination
        this._shadow.getElementById('prevBtn').addEventListener('click', () => {
            if (this._currentPage > 0) {
                this._currentPage--;
                this._loadPosts();
            }
        });
        
        this._shadow.getElementById('nextBtn').addEventListener('click', () => {
            this._currentPage++;
            this._loadPosts();
        });

        // Rich Editor Toolbar
        this._setupRichEditorToolbar();

        // Image Modal
        this._setupImageModal();

        // Link Modal
        this._setupLinkModal();
    }

    _setupRichEditorToolbar() {
        const toolbar = this._shadow.querySelector('.editor-toolbar');
        const editor = this._shadow.getElementById('richEditor');

        // Handle toolbar button clicks
        toolbar.querySelectorAll('.toolbar-btn').forEach(btn => {
            if (btn.id === 'insertImageBtn' || btn.id === 'insertLinkBtn') {
                return; // These are handled separately
            }

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.getAttribute('data-command');
                this._executeEditorCommand(command);
            });
        });

        // Update toolbar state on selection change
        editor.addEventListener('mouseup', () => this._updateToolbarState());
        editor.addEventListener('keyup', () => this._updateToolbarState());
    }

    _executeEditorCommand(command) {
        const editor = this._shadow.getElementById('richEditor');
        editor.focus();

        switch(command) {
            case 'h1':
                document.execCommand('formatBlock', false, '<h1>');
                break;
            case 'h2':
                document.execCommand('formatBlock', false, '<h2>');
                break;
            case 'h3':
                document.execCommand('formatBlock', false, '<h3>');
                break;
            case 'blockquote':
                document.execCommand('formatBlock', false, '<blockquote>');
                break;
            case 'code':
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const code = document.createElement('code');
                    code.textContent = range.toString();
                    range.deleteContents();
                    range.insertNode(code);
                }
                break;
            default:
                document.execCommand(command, false, null);
        }
    }

    _updateToolbarState() {
        const toolbar = this._shadow.querySelector('.editor-toolbar');
        
        toolbar.querySelectorAll('.toolbar-btn').forEach(btn => {
            const command = btn.getAttribute('data-command');
            
            let isActive = false;
            try {
                if (command === 'h1' || command === 'h2' || command === 'h3') {
                    const tagName = command.toUpperCase();
                    isActive = document.queryCommandValue('formatBlock') === tagName;
                } else if (command === 'blockquote') {
                    isActive = document.queryCommandValue('formatBlock') === 'BLOCKQUOTE';
                } else {
                    isActive = document.queryCommandState(command);
                }
            } catch (e) {
                // Some commands may not support queryCommandState
            }
            
            if (isActive) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    _setupImageModal() {
        const imageBtn = this._shadow.getElementById('insertImageBtn');
        const imageModal = this._shadow.getElementById('imageModal');
        const imageUploadArea = this._shadow.getElementById('imageUploadArea');
        const imageInput = this._shadow.getElementById('editorImageInput');
        const cancelBtn = this._shadow.getElementById('cancelImageBtn');
        const confirmBtn = this._shadow.getElementById('insertImageConfirmBtn');
        const preview = this._shadow.getElementById('editorImagePreview');

        let selectedImageFile = null;

        imageBtn.addEventListener('click', () => {
            imageModal.classList.add('active');
            selectedImageFile = null;
            preview.classList.remove('active');
            preview.innerHTML = '';
            confirmBtn.style.display = 'none';
        });

        imageUploadArea.addEventListener('click', () => {
            imageInput.click();
        });

        // Drag and drop
        imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadArea.classList.add('dragover');
        });

        imageUploadArea.addEventListener('dragleave', () => {
            imageUploadArea.classList.remove('dragover');
        });

        imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                selectedImageFile = files[0];
                this._showImagePreview(files[0], preview, confirmBtn);
            }
        });

        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                selectedImageFile = file;
                this._showImagePreview(file, preview, confirmBtn);
            }
        });

        cancelBtn.addEventListener('click', () => {
            imageModal.classList.remove('active');
        });

        confirmBtn.addEventListener('click', async () => {
            if (selectedImageFile) {
                // Show progress
                const progressOverlay = this._shadow.getElementById('progressOverlay');
                progressOverlay.classList.add('active');
                this._updateUploadProgress({ status: 'uploading', progress: 30, message: 'Uploading image...' });

                // Upload to media manager
                try {
                    const imageUrl = await this._uploadImageToMediaManager(selectedImageFile);
                    
                    // Insert image into editor
                    const editor = this._shadow.getElementById('richEditor');
                    editor.focus();
                    
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = selectedImageFile.name.replace(/\.[^/.]+$/, '');
                    img.style.maxWidth = '100%';
                    
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        range.insertNode(img);
                        range.collapse(false);
                    } else {
                        editor.appendChild(img);
                    }

                    progressOverlay.classList.remove('active');
                    imageModal.classList.remove('active');
                    this._showToast('success', 'Image uploaded successfully!');
                } catch (error) {
                    progressOverlay.classList.remove('active');
                    this._showToast('error', 'Failed to upload image: ' + error.message);
                }
            }
        });
    }

    _showImagePreview(file, previewElement, confirmBtn) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewElement.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            previewElement.classList.add('active');
            confirmBtn.style.display = 'inline-flex';
        };
        reader.readAsDataURL(file);
    }

    async _uploadImageToMediaManager(file) {
        return new Promise((resolve, reject) => {
            // Dispatch event to widget to handle upload
            const eventDetail = {
                file: file,
                callback: (url, error) => {
                    if (error) {
                        reject(new Error(error));
                    } else {
                        resolve(url);
                    }
                }
            };
            
            this.dispatchEvent(new CustomEvent('upload-editor-image', {
                detail: eventDetail,
                bubbles: true,
                composed: true
            }));
        });
    }

    _setupLinkModal() {
        const linkBtn = this._shadow.getElementById('insertLinkBtn');
        const linkModal = this._shadow.getElementById('linkModal');
        const linkUrl = this._shadow.getElementById('linkUrl');
        const linkText = this._shadow.getElementById('linkText');
        const cancelBtn = this._shadow.getElementById('cancelLinkBtn');
        const confirmBtn = this._shadow.getElementById('insertLinkConfirmBtn');

        linkBtn.addEventListener('click', () => {
            // Get selected text
            const selection = window.getSelection();
            const selectedText = selection.toString();
            
            linkUrl.value = '';
            linkText.value = selectedText;
            linkModal.classList.add('active');
        });

        cancelBtn.addEventListener('click', () => {
            linkModal.classList.remove('active');
        });

        confirmBtn.addEventListener('click', () => {
            const url = linkUrl.value.trim();
            const text = linkText.value.trim();

            if (!url) {
                this._showToast('error', 'Please enter a URL');
                return;
            }

            const editor = this._shadow.getElementById('richEditor');
            editor.focus();

            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                
                const link = document.createElement('a');
                link.href = url;
                link.textContent = text || url;
                link.target = '_blank';
                
                range.deleteContents();
                range.insertNode(link);
                range.collapse(false);
            }

            linkModal.classList.remove('active');
        });
    }

    _generateSlug(title) {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    _handleImageSelect(e, type) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (type === 'featured') {
            this._featuredImageFile = file;
            const preview = this._shadow.getElementById('featuredImagePreview');
            preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Featured">`;
            preview.classList.add('active');
        } else {
            this._authorImageFile = file;
            const preview = this._shadow.getElementById('authorImagePreview');
            preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Author">`;
            preview.classList.add('active');
        }
    }

    _convertWixImageUrl(wixUrl) {
        if (!wixUrl || typeof wixUrl !== 'string') {
            return 'https://via.placeholder.com/60';
        }

        if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
            return wixUrl;
        }

        if (wixUrl.startsWith('wix:image://')) {
            try {
                const parts = wixUrl.split('/');
                const fileId = parts[3]?.split('#')[0];
                
                if (fileId) {
                    return `https://static.wixstatic.com/media/${fileId}`;
                }
            } catch (e) {
                console.error('📝 Dashboard: Error parsing Wix image URL:', wixUrl, e);
            }
        }

        return 'https://via.placeholder.com/60';
    }

    _dispatchEvent(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    }
    
    _loadPosts() {
        const loading = this._shadow.getElementById('loading');
        loading.classList.remove('hide');
        
        this._dispatchEvent('load-posts', {
            limit: this._pageSize,
            skip: this._currentPage * this._pageSize
        });
    }
    
    setPosts(data) {
        this._posts = data.posts || [];
        this._totalPosts = data.totalCount || 0;
        
        this._shadow.getElementById('loading').classList.add('hide');
        
        if (this._posts.length === 0) {
            this._shadow.getElementById('emptyState').style.display = 'block';
            this._shadow.getElementById('postsTable').style.display = 'none';
            this._shadow.getElementById('pagination').style.display = 'none';
        } else {
            this._shadow.getElementById('emptyState').style.display = 'none';
            this._renderPosts();
            this._updatePagination(data.hasMore);
        }
        
        this._updateStats();
    }
    
    _updatePagination(hasMore) {
        const prevBtn = this._shadow.getElementById('prevBtn');
        const nextBtn = this._shadow.getElementById('nextBtn');
        const pageInfo = this._shadow.getElementById('pageInfo');
        const pagination = this._shadow.getElementById('pagination');
        
        pagination.style.display = 'flex';
        prevBtn.disabled = this._currentPage === 0;
        nextBtn.disabled = !hasMore;
        
        const currentPageNum = this._currentPage + 1;
        const totalPages = Math.ceil(this._totalPosts / this._pageSize);
        pageInfo.textContent = `Page ${currentPageNum} of ${totalPages}`;
    }
    
    _renderPosts() {
        const tbody = this._shadow.getElementById('postsBody');
        const table = this._shadow.getElementById('postsTable');
        
        table.style.display = 'block';
        tbody.innerHTML = '';
        
        this._posts.forEach(post => {
            const row = document.createElement('tr');
            
            const featuredImageUrl = this._convertWixImageUrl(post.featuredImage);
            
            row.innerHTML = `
                <td>
                    <img src="${featuredImageUrl}" 
                         class="post-image" 
                         alt="${this._escapeHtml(post.title)}"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/60'">
                </td>
                <td>
                    <div class="post-title">${this._escapeHtml(post.title)}</div>
                </td>
                <td>${this._escapeHtml(post.category || 'Uncategorized')}</td>
                <td>
                    <span class="badge badge-${post.status === 'published' ? 'published' : 'draft'}">
                        ${post.status === 'published' ? '✓ Published' : '✎ Draft'}
                    </span>
                </td>
                <td>${this._formatDate(post.publishedDate || post._createdDate)}</td>
                <td>
                    <button class="btn btn-warning edit-btn" data-id="${post._id}">
                        <span class="material-icons">edit</span>
                        Edit
                    </button>
                    <button class="btn btn-danger delete-btn" data-id="${post._id}">
                        <span class="material-icons">delete</span>
                        Delete
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Add event listeners
        this._shadow.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.getAttribute('data-id');
                const post = this._posts.find(p => p._id === postId);
                if (post) {
                    this._showModal(post);
                }
            });
        });
        
        this._shadow.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.getAttribute('data-id');
                const post = this._posts.find(p => p._id === postId);
                if (post) {
                    this._deletePost(postId);
                }
            });
        });
    }
    
    _showModal(post = null) {
        this._selectedPost = post;
        
        // Reset modal
        this._shadow.getElementById('modalTitle').textContent = post ? 'Edit Post' : 'Create New Post';
        this._shadow.getElementById('postTitle').value = post?.title || '';
        this._shadow.getElementById('postSlug').value = post?.slug || '';
        this._shadow.getElementById('postCategory').value = post?.category || '';
        this._shadow.getElementById('postTags').value = post?.tags || '';
        this._shadow.getElementById('postExcerpt').value = post?.excerpt || '';
        this._shadow.getElementById('postAuthor').value = post?.author || '';
        this._shadow.getElementById('postStatus').value = post?.status || 'draft';
        
        // Reset editor
        const editor = this._shadow.getElementById('richEditor');
        editor.innerHTML = post?.content ? this._markdownToHtml(post.content) : '';
        
        // Reset images
        this._featuredImageFile = null;
        this._authorImageFile = null;
        this._shadow.getElementById('featuredImageInput').value = '';
        this._shadow.getElementById('authorImageInput').value = '';
        this._shadow.getElementById('featuredImagePreview').classList.remove('active');
        this._shadow.getElementById('authorImagePreview').classList.remove('active');
        
        if (post?.featuredImage) {
            const featuredImageUrl = this._convertWixImageUrl(post.featuredImage);
            this._shadow.getElementById('featuredImagePreview').innerHTML = 
                `<img src="${featuredImageUrl}" alt="Featured" onerror="this.src='https://via.placeholder.com/200'">`;
            this._shadow.getElementById('featuredImagePreview').classList.add('active');
        }
        
        if (post?.authorImage) {
            const authorImageUrl = this._convertWixImageUrl(post.authorImage);
            this._shadow.getElementById('authorImagePreview').innerHTML = 
                `<img src="${authorImageUrl}" alt="Author" onerror="this.src='https://via.placeholder.com/200'">`;
            this._shadow.getElementById('authorImagePreview').classList.add('active');
        }
        
        // Show modal
        this._shadow.getElementById('modal').classList.add('active');
    }
    
    _hideModal() {
        this._shadow.getElementById('modal').classList.remove('active');
    }
    
    async _savePost() {
        const title = this._shadow.getElementById('postTitle').value.trim();
        const slug = this._shadow.getElementById('postSlug').value.trim();
        
        if (!title || !slug) {
            this._showToast('error', 'Please fill in title and slug');
            return;
        }
        
        const editor = this._shadow.getElementById('richEditor');
        const htmlContent = editor.innerHTML;
        
        if (!htmlContent || htmlContent === '') {
            this._showToast('error', 'Please add some content to your post');
            return;
        }
        
        // Convert HTML to Markdown
        const markdown = this._htmlToMarkdown(htmlContent);
        
        const postData = {
            title,
            slug,
            category: this._shadow.getElementById('postCategory').value.trim(),
            tags: this._shadow.getElementById('postTags').value.trim(),
            excerpt: this._shadow.getElementById('postExcerpt').value.trim(),
            author: this._shadow.getElementById('postAuthor').value.trim() || 'Anonymous',
            status: this._shadow.getElementById('postStatus').value,
            content: markdown,
            featuredImageFile: this._featuredImageFile,
            authorImageFile: this._authorImageFile,
            existingFeaturedImage: this._selectedPost?.featuredImage,
            existingAuthorImage: this._selectedPost?.authorImage,
            isEdit: !!this._selectedPost,
            postId: this._selectedPost?._id
        };
        
        this._dispatchEvent('save-post', postData);
    }

    _htmlToMarkdown(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        let markdown = '';
        
        const processNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }
            
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return '';
            }
            
            const tagName = node.tagName.toLowerCase();
            let text = '';
            
            // Process children first
            for (let child of node.childNodes) {
                text += processNode(child);
            }
            
            switch(tagName) {
                case 'h1':
                    return `\n# ${text}\n\n`;
                case 'h2':
                    return `\n## ${text}\n\n`;
                case 'h3':
                    return `\n### ${text}\n\n`;
                case 'h4':
                    return `\n#### ${text}\n\n`;
                case 'h5':
                    return `\n##### ${text}\n\n`;
                case 'h6':
                    return `\n###### ${text}\n\n`;
                case 'p':
                    return `${text}\n\n`;
                case 'br':
                    return '\n';
                case 'strong':
                case 'b':
                    return `**${text}**`;
                case 'em':
                case 'i':
                    return `*${text}*`;
                case 'u':
                    return `<u>${text}</u>`;
                case 'strike':
                case 'del':
                    return `~~${text}~~`;
                case 'code':
                    return `\`${text}\``;
                case 'pre':
                    return `\n\`\`\`\n${text}\n\`\`\`\n\n`;
                case 'blockquote':
                    return `\n> ${text}\n\n`;
                case 'ul':
                    return `\n${text}\n`;
                case 'ol':
                    return `\n${text}\n`;
                case 'li':
                    const parent = node.parentElement;
                    if (parent && parent.tagName.toLowerCase() === 'ol') {
                        const index = Array.from(parent.children).indexOf(node) + 1;
                        return `${index}. ${text}\n`;
                    } else {
                        return `- ${text}\n`;
                    }
                case 'a':
                    const href = node.getAttribute('href') || '';
                    return `[${text}](${href})`;
                case 'img':
                    const src = node.getAttribute('src') || '';
                    const alt = node.getAttribute('alt') || '';
                    return `\n![${alt}](${src})\n\n`;
                case 'hr':
                    return '\n---\n\n';
                case 'div':
                    return text + '\n\n';
                default:
                    return text;
            }
        };
        
        markdown = processNode(tempDiv);
        
        // Clean up extra whitespace
        markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
        
        return markdown;
    }

    _markdownToHtml(markdown) {
        let html = markdown;
        
        // Headers
        html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
        
        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Strikethrough
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
        
        // Inline code
        html = html.replace(/`(.+?)`/g, '<code>$1</code>');
        
        // Code blocks
        html = html.replace(/```\n([\s\S]+?)\n```/g, '<pre><code>$1</code></pre>');
        
        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%;">');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Blockquotes
        html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Horizontal rule
        html = html.replace(/^---$/gm, '<hr>');
        
        // Lists
        html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
        
        // Paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        // Clean up
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)<\/p>/g, '$1');
        html = html.replace(/<p>(<blockquote>)/g, '$1');
        html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
        html = html.replace(/<p>(<img[^>]+>)<\/p>/g, '$1');
        
        return html;
    }
    
    _deletePost(postId) {
        const post = this._posts.find(p => p._id === postId);
        if (!post) return;
        
        if (confirm(`Delete "${post.title}"?\n\nThis action cannot be undone.`)) {
            this._dispatchEvent('delete-post', { postId });
        }
    }
    
    _updateStats() {
        const published = this._posts.filter(p => p.status === 'published').length;
        const drafts = this._posts.filter(p => p.status === 'draft').length;
        
        this._shadow.getElementById('totalPosts').textContent = this._totalPosts;
        this._shadow.getElementById('publishedCount').textContent = published;
        this._shadow.getElementById('draftCount').textContent = drafts;
    }
    
    _updateUploadProgress(progress) {
        const overlay = this._shadow.getElementById('progressOverlay');
        const progressBar = this._shadow.getElementById('uploadProgressBar');
        const progressText = this._shadow.getElementById('progressText');
        
        if (progress.status === 'uploading') {
            overlay.classList.add('active');
            progressBar.style.width = progress.progress + '%';
            progressText.textContent = progress.message || 'Uploading...';
        } else if (progress.status === 'complete') {
            progressBar.style.width = '100%';
            progressText.textContent = 'Upload complete!';
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 1000);
        } else if (progress.status === 'error') {
            overlay.classList.remove('active');
            this._showToast('error', progress.message || 'Upload failed');
        }
    }
    
    _showToast(type, message) {
        const toast = this._shadow.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;
        setTimeout(() => toast.classList.remove('show'), 5000);
    }
    
    _formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

customElements.define('blog-dashboard', BlogDashboard);
console.log('📝 Dashboard: ✅ Custom element registered');
