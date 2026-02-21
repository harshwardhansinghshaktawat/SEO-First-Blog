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
        this._editor = null;
        this._featuredImageFile = null;
        this._authorImageFile = null;
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
        this._loadEditorJS();
    }
    
    _createStructure() {
        this._root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                * { box-sizing: border-box; margin: 0; padding: 0; }
                
                :host {
                    display: block;
                    width: 100%;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    background: #f9fafb;
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
                
                .editor-container {
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 20px;
                    min-height: 400px;
                    background: white;
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
                            <span style="font-size: 20px;">✏️</span>
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
                            <button class="btn btn-primary" id="prevBtn" disabled>← Previous</button>
                            <span id="pageInfo" style="font-weight: 600;">Page 1</span>
                            <button class="btn btn-primary" id="nextBtn">Next →</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title" id="modalTitle">Create New Post</h2>
                        <button class="modal-close" id="closeModal">×</button>
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
                                    <div>📷 Click to upload featured image</div>
                                    <small style="color: #6b7280;">Recommended: 1200x630px</small>
                                </div>
                                <div class="file-preview" id="featuredImagePreview"></div>
                            </div>
                            
                            <div class="form-group">
                                <label class="label">Author Image</label>
                                <div class="file-upload" id="authorImageUpload">
                                    <input type="file" id="authorImageInput" accept="image/*">
                                    <div>👤 Click to upload author image</div>
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
                            <div class="editor-container" id="editorjs"></div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn" style="background: #f3f4f6; color: #111827;" id="cancelBtn">Cancel</button>
                        <button class="btn btn-primary" id="saveBtn">Save Post</button>
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

    async _loadEditorJS() {
        // Load Editor.js from CDN
        if (!window.EditorJS) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest';
            script.onload = () => {
                console.log('📝 Dashboard: Editor.js loaded');
                this._loadEditorPlugins();
            };
            document.head.appendChild(script);
        } else {
            this._loadEditorPlugins();
        }
    }

    async _loadEditorPlugins() {
        // Load essential Editor.js plugins
        const plugins = [
            { name: 'Header', url: 'https://cdn.jsdelivr.net/npm/@editorjs/header@latest' },
            { name: 'List', url: 'https://cdn.jsdelivr.net/npm/@editorjs/list@latest' },
            { name: 'Quote', url: 'https://cdn.jsdelivr.net/npm/@editorjs/quote@latest' },
            { name: 'Code', url: 'https://cdn.jsdelivr.net/npm/@editorjs/code@latest' },
            { name: 'InlineCode', url: 'https://cdn.jsdelivr.net/npm/@editorjs/inline-code@latest' },
            { name: 'Table', url: 'https://cdn.jsdelivr.net/npm/@editorjs/table@latest' },
            { name: 'Delimiter', url: 'https://cdn.jsdelivr.net/npm/@editorjs/delimiter@latest' }
        ];

        for (const plugin of plugins) {
            if (!window[plugin.name]) {
                const script = document.createElement('script');
                script.src = plugin.url;
                await new Promise((resolve) => {
                    script.onload = resolve;
                    document.head.appendChild(script);
                });
            }
        }
        
        console.log('📝 Dashboard: All Editor.js plugins loaded');
    }

    _setupEventListeners() {
        // Header button
        this._shadow.getElementById('createBtn').addEventListener('click', () => this._showModal());
        
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
            row.innerHTML = `
                <td>
                    <img src="${post.featuredImage || 'https://via.placeholder.com/60'}" 
                         class="post-image" 
                         alt="${post.title}"
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
                    <button class="btn btn-warning edit-btn" data-id="${post._id}">Edit</button>
                    <button class="btn btn-danger delete-btn" data-id="${post._id}">Delete</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Add event listeners
        this._shadow.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.getAttribute('data-id');
                const post = this._posts.find(p => p._id === postId);
                this._showModal(post);
            });
        });
        
        this._shadow.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.getAttribute('data-id');
                this._deletePost(postId);
            });
        });
    }
    
    async _showModal(post = null) {
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
        
        // Reset images
        this._featuredImageFile = null;
        this._authorImageFile = null;
        this._shadow.getElementById('featuredImageInput').value = '';
        this._shadow.getElementById('authorImageInput').value = '';
        this._shadow.getElementById('featuredImagePreview').classList.remove('active');
        this._shadow.getElementById('authorImagePreview').classList.remove('active');
        
        if (post?.featuredImage) {
            this._shadow.getElementById('featuredImagePreview').innerHTML = 
                `<img src="${post.featuredImage}" alt="Featured">`;
            this._shadow.getElementById('featuredImagePreview').classList.add('active');
        }
        
        if (post?.authorImage) {
            this._shadow.getElementById('authorImagePreview').innerHTML = 
                `<img src="${post.authorImage}" alt="Author">`;
            this._shadow.getElementById('authorImagePreview').classList.add('active');
        }
        
        // Initialize Editor.js
        await this._initializeEditor(post);
        
        this._shadow.getElementById('modal').classList.add('active');
    }
    
    async _initializeEditor(post) {
        if (this._editor) {
            this._editor.destroy();
        }
        
        const editorData = post?.editorData ? JSON.parse(post.editorData) : {
            blocks: []
        };
        
        this._editor = new EditorJS({
            holder: this._shadow.getElementById('editorjs'),
            data: editorData,
            tools: {
                header: {
                    class: Header,
                    config: {
                        levels: [1, 2, 3, 4, 5, 6],
                        defaultLevel: 2
                    }
                },
                list: {
                    class: List,
                    inlineToolbar: true
                },
                quote: {
                    class: Quote,
                    inlineToolbar: true
                },
                code: Code,
                inlineCode: InlineCode,
                table: {
                    class: Table,
                    inlineToolbar: true
                },
                delimiter: Delimiter
            },
            placeholder: 'Start writing your blog post...'
        });
    }
    
    _hideModal() {
        this._shadow.getElementById('modal').classList.remove('active');
        if (this._editor) {
            this._editor.destroy();
            this._editor = null;
        }
    }
    
    async _savePost() {
        const title = this._shadow.getElementById('postTitle').value.trim();
        const slug = this._shadow.getElementById('postSlug').value.trim();
        
        if (!title || !slug) {
            this._showToast('error', 'Please fill in title and slug');
            return;
        }
        
        if (!this._editor) {
            this._showToast('error', 'Editor not initialized');
            return;
        }
        
        try {
            const editorData = await this._editor.save();
            
            const postData = {
                title,
                slug,
                category: this._shadow.getElementById('postCategory').value.trim(),
                tags: this._shadow.getElementById('postTags').value.trim(),
                excerpt: this._shadow.getElementById('postExcerpt').value.trim(),
                author: this._shadow.getElementById('postAuthor').value.trim() || 'Anonymous',
                status: this._shadow.getElementById('postStatus').value,
                editorData: JSON.stringify(editorData),
                featuredImageFile: this._featuredImageFile,
                authorImageFile: this._authorImageFile,
                existingFeaturedImage: this._selectedPost?.featuredImage,
                existingAuthorImage: this._selectedPost?.authorImage,
                isEdit: !!this._selectedPost,
                postId: this._selectedPost?._id
            };
            
            this._dispatchEvent('save-post', postData);
            
        } catch (error) {
            console.error('📝 Dashboard: Save error:', error);
            this._showToast('error', 'Failed to save post: ' + error.message);
        }
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
