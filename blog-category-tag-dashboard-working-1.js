// CUSTOM ELEMENT - Blog Dashboard (FIXED)
class BlogDashboard extends HTMLElement {
    constructor() {
        super();
        this.state = {
            activeTab: 'categories',
            categories: [],
            tags: [],
            allPosts: [],
            editingItem: null,
            isLoading: true,
            showForm: false
        };
    }

    static get observedAttributes() {
        return ['categories-data', 'tags-data', 'posts-data', 'save-result', 'delete-result', 'upload-result'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || oldValue === newValue) return;

        try {
            if (name === 'categories-data') {
                this.state.categories = JSON.parse(newValue);
                this.state.isLoading = false;
                if (this.isConnected) this.renderList();
            } else if (name === 'tags-data') {
                this.state.tags = JSON.parse(newValue);
                this.state.isLoading = false;
                if (this.isConnected) this.renderList();
            } else if (name === 'posts-data') {
                this.state.allPosts = JSON.parse(newValue);
                if (this.state.showForm && this.isConnected) this.renderForm();
            } else if (name === 'save-result') {
                const result = JSON.parse(newValue);
                this.handleSaveResult(result);
            } else if (name === 'delete-result') {
                const result = JSON.parse(newValue);
                this.handleDeleteResult(result);
            } else if (name === 'upload-result') {
                const result = JSON.parse(newValue);
                this.handleUploadResult(result);
            }
        } catch (e) {
            console.error('Error parsing attribute:', e);
        }
    }

    connectedCallback() {
        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="dashboard-container">
                <header class="dashboard-header">
                    <h1 class="dashboard-title">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                        </svg>
                        Blog Categories & Tags
                    </h1>
                </header>

                <div class="tab-bar">
                    <button class="tab-btn active" data-tab="categories">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                        </svg>
                        Categories
                    </button>
                    <button class="tab-btn" data-tab="tags">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
                        </svg>
                        Tags
                    </button>
                </div>

                <div class="dashboard-body">
                    <div class="content-panel" id="listPanel">
                        <div class="panel-actions">
                            <button class="btn btn-primary" id="addNewBtn">
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                </svg>
                                Add New
                            </button>
                        </div>
                        <div id="itemsList"></div>
                    </div>

                    <div class="content-panel hidden" id="formPanel">
                        <div class="panel-header">
                            <button class="btn btn-ghost" id="backBtn">
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                </svg>
                                Back
                            </button>
                            <h2 id="formTitle"></h2>
                        </div>
                        <div id="formContent"></div>
                    </div>
                </div>

                <div class="toast-container" id="toastContainer"></div>
            </div>
        `;

        this.setupEventListeners();
        if (!this.state.isLoading) {
            this.renderList();
        }
    }

    getStyles() {
        return `
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

            blog-dashboard {
                display: block;
                width: 100%;
                min-height: 100vh;
                font-family: 'DM Sans', sans-serif;
                background: #fafaf8;
                color: #111;
            }

            .dashboard-container {
                max-width: 1600px;
                margin: 0 auto;
                padding: 20px;
            }

            .dashboard-header {
                background: #111;
                border-radius: 12px;
                padding: 32px;
                margin-bottom: 24px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }

            .dashboard-title {
                font-family: 'Playfair Display', serif;
                font-size: 32px;
                font-weight: 900;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 16px;
                color: #64FFDA;
            }

            .dashboard-title svg {
                width: 40px;
                height: 40px;
                fill: #64FFDA;
            }

            .tab-bar {
                display: flex;
                gap: 8px;
                margin-bottom: 24px;
                background: #fff;
                border: 1px solid #ddd9d2;
                border-radius: 12px;
                padding: 8px;
            }

            .tab-btn {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                padding: 14px 24px;
                background: transparent;
                border: none;
                border-radius: 8px;
                color: #888;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .tab-btn svg {
                width: 20px;
                height: 20px;
                fill: currentColor;
            }

            .tab-btn:hover {
                background: #f2f1ee;
                color: #111;
            }

            .tab-btn.active {
                background: #d4380d;
                color: #fff;
            }

            .dashboard-body {
                position: relative;
                min-height: 600px;
            }

            .content-panel {
                background: #fff;
                border: 1px solid #ddd9d2;
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 2px 8px rgba(0,0,0,.08);
            }

            .content-panel.hidden {
                display: none;
            }

            .panel-actions {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 24px;
            }

            .panel-header {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 32px;
                padding-bottom: 16px;
                border-bottom: 2px solid #ddd9d2;
            }

            .panel-header h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                color: #d4380d;
            }

            .btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                font-family: 'DM Sans', sans-serif;
            }

            .btn svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }

            .btn-primary {
                background: #d4380d;
                color: #fff;
            }

            .btn-primary:hover {
                background: #fa8c16;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(212, 56, 13, 0.3);
            }

            .btn-ghost {
                background: #f2f1ee;
                color: #111;
                border: 1px solid #ddd9d2;
            }

            .btn-ghost:hover {
                background: #e8e6e1;
            }

            .btn-danger {
                background: #cf1322;
                color: #fff;
            }

            .btn-danger:hover {
                background: #a8071a;
            }

            .btn-sm {
                padding: 6px 12px;
                font-size: 12px;
            }

            .btn-sm svg {
                width: 14px;
                height: 14px;
            }

            .items-table {
                width: 100%;
                border-collapse: collapse;
            }

            .items-table th {
                text-align: left;
                padding: 12px 16px;
                background: #f2f1ee;
                color: #444;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-bottom: 2px solid #ddd9d2;
            }

            .items-table td {
                padding: 16px;
                border-bottom: 1px solid #e8e6e1;
            }

            .items-table tr:hover {
                background: #fafaf8;
            }

            .item-image {
                width: 60px;
                height: 60px;
                border-radius: 8px;
                object-fit: cover;
                background: #e8e6e1;
            }

            .item-info {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .item-name {
                font-weight: 600;
                color: #d4380d;
                font-size: 15px;
            }

            .item-slug {
                font-size: 12px;
                color: #888;
                font-family: 'JetBrains Mono', monospace;
                margin-top: 4px;
            }

            .item-count {
                background: #f2f1ee;
                border: 1px solid #ddd9d2;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 13px;
                font-weight: 600;
                color: #d4380d;
            }

            .item-actions {
                display: flex;
                gap: 8px;
            }

            .form-grid {
                display: grid;
                gap: 24px;
            }

            .form-section {
                background: #fafaf8;
                border: 1px solid #ddd9d2;
                border-radius: 8px;
                padding: 24px;
            }

            .form-section-title {
                font-size: 16px;
                font-weight: 700;
                color: #d4380d;
                margin: 0 0 20px 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .form-section-title svg {
                width: 20px;
                height: 20px;
                fill: currentColor;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group:last-child {
                margin-bottom: 0;
            }

            .form-label {
                display: block;
                margin-bottom: 8px;
                font-size: 13px;
                font-weight: 600;
                color: #444;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .form-label.required::after {
                content: ' *';
                color: #cf1322;
            }

            .form-input,
            .form-textarea {
                width: 100%;
                padding: 12px 16px;
                background: #fff;
                border: 1.5px solid #ddd9d2;
                border-radius: 6px;
                color: #111;
                font-size: 14px;
                font-family: 'DM Sans', sans-serif;
                transition: all 0.2s;
            }

            .form-input:focus,
            .form-textarea:focus {
                outline: none;
                border-color: #d4380d;
                box-shadow: 0 0 0 3px rgba(212, 56, 13, 0.1);
            }

            .form-textarea {
                resize: vertical;
                min-height: 100px;
            }

            .form-input:read-only {
                background: #f2f1ee;
                color: #888;
                cursor: not-allowed;
            }

            .form-hint {
                font-size: 12px;
                color: #888;
                margin-top: 6px;
            }

            .image-upload-zone {
                border: 2px dashed #ddd9d2;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
                background: #fff;
            }

            .image-upload-zone:hover {
                border-color: #d4380d;
                background: #fff5f0;
            }

            .image-upload-zone svg {
                width: 32px;
                height: 32px;
                color: #888;
                margin-bottom: 8px;
            }

            .image-upload-zone p {
                font-size: 13px;
                color: #888;
                margin: 0;
            }

            .image-upload-zone input[type=file] {
                display: none;
            }

            .image-preview {
                margin-top: 16px;
                text-align: center;
            }

            .image-preview img {
                max-width: 100%;
                max-height: 300px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,.1);
            }

            .posts-selector {
                background: #fff;
                border: 1.5px solid #ddd9d2;
                border-radius: 6px;
                max-height: 300px;
                overflow-y: auto;
            }

            .post-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border-bottom: 1px solid #e8e6e1;
                cursor: pointer;
                transition: background 0.2s;
            }

            .post-item:last-child {
                border-bottom: none;
            }

            .post-item:hover {
                background: #fafaf8;
            }

            .post-checkbox {
                width: 18px;
                height: 18px;
                border: 2px solid #ddd9d2;
                border-radius: 4px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .post-item.selected .post-checkbox {
                background: #d4380d;
                border-color: #d4380d;
            }

            .post-checkbox svg {
                width: 12px;
                height: 12px;
                fill: #fff;
                display: none;
            }

            .post-item.selected .post-checkbox svg {
                display: block;
            }

            .post-info {
                flex: 1;
            }

            .post-title {
                font-size: 14px;
                font-weight: 600;
                color: #111;
                margin-bottom: 4px;
            }

            .post-meta {
                font-size: 12px;
                color: #888;
            }

            .form-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 32px;
                padding-top: 24px;
                border-top: 2px solid #ddd9d2;
            }

            .empty-state {
                text-align: center;
                padding: 80px 20px;
                color: #888;
            }

            .empty-state svg {
                width: 64px;
                height: 64px;
                fill: #ddd9d2;
                margin-bottom: 20px;
            }

            .empty-state h3 {
                font-size: 20px;
                color: #111;
                margin: 0 0 12px 0;
            }

            .empty-state p {
                font-size: 14px;
                margin: 0;
            }

            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .toast {
                background: #fff;
                border: 1px solid #ddd9d2;
                border-radius: 8px;
                padding: 16px 20px;
                min-width: 300px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                animation: slideIn 0.3s ease;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .toast svg {
                width: 20px;
                height: 20px;
                flex-shrink: 0;
            }

            .toast-success {
                border-left: 4px solid #389e0d;
            }

            .toast-success svg {
                fill: #389e0d;
            }

            .toast-error {
                border-left: 4px solid #cf1322;
            }

            .toast-error svg {
                fill: #cf1322;
            }

            .toast-message {
                flex: 1;
                font-size: 14px;
                font-weight: 500;
                color: #111;
            }

            @media (max-width: 768px) {
                .dashboard-container {
                    padding: 12px;
                }

                .dashboard-header {
                    padding: 20px;
                }

                .dashboard-title {
                    font-size: 24px;
                }

                .tab-bar {
                    flex-direction: column;
                }

                .items-table {
                    font-size: 13px;
                }

                .items-table th,
                .items-table td {
                    padding: 10px;
                }

                .form-actions {
                    flex-direction: column;
                }

                .btn {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
    }

    setupEventListeners() {
        this.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        this.querySelector('#addNewBtn').addEventListener('click', () => {
            this.showForm(null);
        });

        this.querySelector('#backBtn').addEventListener('click', () => {
            this.hideForm();
        });
    }

    switchTab(tab) {
        this.state.activeTab = tab;
        
        this.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        this.hideForm();
        this.renderList();
    }

    renderList() {
        const listPanel = this.querySelector('#itemsList');
        if (!listPanel) return;

        const items = this.state.activeTab === 'categories' ? this.state.categories : this.state.tags;

        if (items.length === 0) {
            listPanel.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    <h3>No ${this.state.activeTab} yet</h3>
                    <p>Click "Add New" to create your first ${this.state.activeTab === 'categories' ? 'category' : 'tag'}</p>
                </div>
            `;
            return;
        }

        listPanel.innerHTML = `
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Posts</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => {
                        const imageUrl = this.convertWixImageUrl(item.image);
                        return `
                            <tr>
                                <td>
                                    <div class="item-info">
                                        ${imageUrl ? `<img src="${imageUrl}" alt="${this.escapeHtml(item.title || item.name)}" class="item-image" onerror="this.style.display='none'">` : ''}
                                        <div>
                                            <div class="item-name">${this.escapeHtml(item.title || item.name)}</div>
                                            <div class="item-slug">/${item.slug}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #888;">
                                        ${this.escapeHtml(item.description || '—')}
                                    </div>
                                </td>
                                <td>
                                    <span class="item-count">${item.postCount || 0}</span>
                                </td>
                                <td>
                                    <div class="item-actions">
                                        <button class="btn btn-ghost btn-sm edit-btn" data-id="${item._id}">
                                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                            </svg>
                                            Edit
                                        </button>
                                        <button class="btn btn-danger btn-sm delete-btn" data-id="${item._id}" data-name="${this.escapeHtml(item.title || item.name)}">
                                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        listPanel.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const item = items.find(i => i._id === id);
                this.showForm(item);
            });
        });

        listPanel.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const name = btn.dataset.name;
                if (confirm(`Are you sure you want to delete "${name}"?`)) {
                    this.deleteItem(id);
                }
            });
        });
    }

    showForm(item) {
        this.state.editingItem = item;
        this.state.showForm = true;

        this.querySelector('#listPanel').classList.add('hidden');
        this.querySelector('#formPanel').classList.remove('hidden');

        const isCategory = this.state.activeTab === 'categories';
        const title = item 
            ? `Edit ${isCategory ? 'Category' : 'Tag'}` 
            : `Add New ${isCategory ? 'Category' : 'Tag'}`;

        this.querySelector('#formTitle').textContent = title;
        
        this.emitEvent('load-posts', {});
        
        this.renderForm();
    }

    renderForm() {
        const formContent = this.querySelector('#formContent');
        if (!formContent) return;

        const isCategory = this.state.activeTab === 'categories';
        const item = this.state.editingItem || {};
        const imageUrl = this.convertWixImageUrl(item.image);

        formContent.innerHTML = `
            <form id="itemForm" class="form-grid">
                <div class="form-section">
                    <h3 class="form-section-title">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        </svg>
                        Basic Information
                    </h3>

                    ${isCategory ? `
                        <div class="form-group">
                            <label class="form-label required">Title</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                id="titleInput" 
                                value="${this.escapeHtml(item.title || '')}"
                                required
                            />
                            <div class="form-hint">Display title for the category</div>
                        </div>
                    ` : ''}

                    <div class="form-group">
                        <label class="form-label required">Name</label>
                        <input 
                            type="text" 
                            class="form-input" 
                            id="nameInput" 
                            value="${this.escapeHtml(item.name || '')}"
                            required
                        />
                        <div class="form-hint">Internal name for the ${isCategory ? 'category' : 'tag'}</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label required">Slug</label>
                        <input 
                            type="text" 
                            class="form-input" 
                            id="slugInput" 
                            value="${this.escapeHtml(item.slug || '')}"
                            ${item && item._id ? 'readonly' : ''}
                            required
                        />
                        <div class="form-hint">URL-friendly identifier ${item && item._id ? '(cannot be changed)' : '(auto-generated from name)'}</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea 
                            class="form-textarea" 
                            id="descriptionInput"
                        >${this.escapeHtml(item.description || '')}</textarea>
                        <div class="form-hint">Brief description of this ${isCategory ? 'category' : 'tag'}</div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                        Featured Image
                    </h3>

                    <div class="image-upload-zone" id="imageZone">
                        <input type="file" id="imageFile" accept="image/*">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                        <p>Click to upload image</p>
                    </div>
                    ${imageUrl ? `
                        <div class="image-preview">
                            <img src="${imageUrl}" alt="Preview" id="imagePreview">
                        </div>
                    ` : '<div class="image-preview" id="imagePreview" style="display:none;"></div>'}
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                        Posts
                    </h3>
                    <div id="postsSelector"></div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 11H6.83l3.58-3.59L9 6l-6 6 6 6 1.41-1.41L6.83 13H21z"/>
                        </svg>
                        SEO Settings
                    </h3>

                    <div class="form-group">
                        <label class="form-label">SEO Title</label>
                        <input 
                            type="text" 
                            class="form-input" 
                            id="seoTitleInput" 
                            value="${this.escapeHtml(item.seoTitle || '')}"
                            maxlength="60"
                        />
                        <div class="form-hint">Recommended: 50-60 characters</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">SEO Description</label>
                        <textarea 
                            class="form-textarea" 
                            id="seoDescriptionInput"
                            maxlength="160"
                        >${this.escapeHtml(item.seoDescription || '')}</textarea>
                        <div class="form-hint">Recommended: 150-160 characters</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">SEO Keywords</label>
                        <input 
                            type="text" 
                            class="form-input" 
                            id="seoKeywordsInput" 
                            value="${this.escapeHtml(item.seoKeywords || '')}"
                        />
                        <div class="form-hint">Comma-separated keywords</div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-ghost" id="cancelBtn">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                        </svg>
                        ${item && item._id ? 'Update' : 'Create'}
                    </button>
                </div>
            </form>
        `;

        this.renderPostsSelector();

        const nameInput = this.querySelector('#nameInput');
        const slugInput = this.querySelector('#slugInput');
        const isNewItem = !item || !item._id;

        if (isNewItem && nameInput && slugInput) {
            if (nameInput.value && !slugInput.value) {
                slugInput.value = this.generateUniqueSlug(nameInput.value);
            }
            
            nameInput.addEventListener('input', (e) => {
                const newSlug = this.generateUniqueSlug(e.target.value);
                slugInput.value = newSlug;
            });
        }

        const imageZone = this.querySelector('#imageZone');
        const imageFile = this.querySelector('#imageFile');
        const imagePreview = this.querySelector('#imagePreview');

        imageZone.addEventListener('click', () => imageFile.click());
        
        imageFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const tempUrl = URL.createObjectURL(file);
            if (imagePreview) {
                imagePreview.innerHTML = `<img src="${tempUrl}" alt="Preview">`;
                imagePreview.style.display = 'block';
            }

            const fileData = await this.toBase64(file);
            this.emitEvent('upload-image', { 
                fileData, 
                filename: file.name,
                type: this.state.activeTab
            });
        });

        this.querySelector('#cancelBtn').addEventListener('click', () => {
            this.hideForm();
        });

        this.querySelector('#itemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const slugValue = slugInput.value.trim();
            if (!slugValue) {
                alert('Slug cannot be empty. It will be auto-generated from the name.');
                slugInput.value = this.generateUniqueSlug(nameInput.value);
                return;
            }
            
            this.saveItem();
        });
    }

    renderPostsSelector() {
        const selector = this.querySelector('#postsSelector');
        if (!selector) return;

        const selectedPosts = this.state.editingItem?.posts || [];
        const selectedIds = selectedPosts.map(p => p._id);

        if (this.state.allPosts.length === 0) {
            selector.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px;">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    <p style="margin: 12px 0 0 0; color: #888;">No posts available</p>
                </div>
            `;
            return;
        }

        selector.innerHTML = `
            <div class="posts-selector">
                ${this.state.allPosts.map(post => {
                    const isSelected = selectedIds.includes(post._id);
                    return `
                        <div class="post-item ${isSelected ? 'selected' : ''}" data-id="${post._id}">
                            <div class="post-checkbox">
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                            </div>
                            <div class="post-info">
                                <div class="post-title">${this.escapeHtml(post.blogTitle || post.title || 'Untitled')}</div>
                                <div class="post-meta">${post.category || 'No category'} • ${this.formatDate(post.publishedDate)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        selector.querySelectorAll('.post-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('selected');
            });
        });
    }

    hideForm() {
        this.state.showForm = false;
        this.state.editingItem = null;
        this.state.uploadedImageUrl = null;
        this.querySelector('#listPanel').classList.remove('hidden');
        this.querySelector('#formPanel').classList.add('hidden');
    }

    saveItem() {
        const isCategory = this.state.activeTab === 'categories';
        
        const nameInput = this.querySelector('#nameInput');
        const slugInput = this.querySelector('#slugInput');
        
        const name = nameInput.value.trim();
        let slug = slugInput.value.trim();
        
        if (!slug && name) {
            slug = this.generateUniqueSlug(name);
        }
        
        if (!name) {
            alert('Name is required');
            return;
        }
        
        if (!slug) {
            alert('Slug is required');
            return;
        }
        
        const data = {
            name: name,
            slug: slug,
            description: this.querySelector('#descriptionInput').value.trim(),
            seoTitle: this.querySelector('#seoTitleInput').value.trim(),
            seoDescription: this.querySelector('#seoDescriptionInput').value.trim(),
            seoKeywords: this.querySelector('#seoKeywordsInput').value.trim(),
            image: this.state.uploadedImageUrl || this.state.editingItem?.image || ''
        };

        if (isCategory) {
            const titleInput = this.querySelector('#titleInput');
            if (titleInput) {
                data.title = titleInput.value.trim();
            }
        }
        
        const selectedPosts = Array.from(this.querySelectorAll('.post-item.selected'))
            .map(item => item.dataset.id);
        data.selectedPosts = selectedPosts;
        data.postCount = selectedPosts.length;

        if (this.state.editingItem && this.state.editingItem._id) {
            data._id = this.state.editingItem._id;
        }

        this.emitEvent('save-item', {
            type: isCategory ? 'category' : 'tag',
            data: data
        });
    }

    deleteItem(id) {
        const isCategory = this.state.activeTab === 'categories';
        
        this.emitEvent('delete-item', {
            type: isCategory ? 'category' : 'tag',
            id: id
        });
    }

    handleSaveResult(result) {
        if (result.success) {
            this.showToast('success', result.message || 'Saved successfully');
            this.hideForm();
            this.emitEvent('load-data', { type: this.state.activeTab });
        } else {
            this.showToast('error', result.message || 'Save failed');
        }
    }

    handleDeleteResult(result) {
        if (result.success) {
            this.showToast('success', result.message || 'Deleted successfully');
            this.emitEvent('load-data', { type: this.state.activeTab });
        } else {
            this.showToast('error', result.message || 'Delete failed');
        }
    }

    handleUploadResult(result) {
        if (result.success) {
            this.state.uploadedImageUrl = result.url;
            const preview = this.querySelector('#imagePreview');
            if (preview) {
                preview.innerHTML = `<img src="${result.url}" alt="Preview">`;
                preview.style.display = 'block';
            }
            this.showToast('success', 'Image uploaded successfully');
        } else {
            this.showToast('error', 'Image upload failed');
        }
    }

    showToast(type, message) {
        const container = this.querySelector('#toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                ${type === 'success' 
                    ? '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>'
                    : '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>'
                }
            </svg>
            <div class="toast-message">${this.escapeHtml(message)}</div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    generateUniqueSlug(text) {
        if (!text) return '';
        
        const baseSlug = text.toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        const items = this.state.activeTab === 'categories' ? this.state.categories : this.state.tags;
        const existingSlugs = items
            .filter(i => i._id !== this.state.editingItem?._id)
            .map(i => i.slug);
        
        let slug = baseSlug;
        let counter = 1;
        
        while (existingSlugs.includes(slug)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        
        return slug;
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

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    emitEvent(name, detail) {
        this.dispatchEvent(new CustomEvent(name, {
            detail,
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('blog-dashboard', BlogDashboard);
