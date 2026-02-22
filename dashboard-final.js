class CustomBlogEditor extends HTMLElement {
    constructor() {
        super();
        this.editor = null;
        this.imageModalCallback = null;
        this.videoModalCallback = null;
    }

    async connectedCallback() {
        this.render();
        await this.loadDependencies();
        this.initEditor();
        this.bindEvents();
    }

    render() {
        this.innerHTML = `
            <style>
                :root {
                    --primary-bg: #F7F8FA;
                    --heading-color: #222939;
                    --accent-color: #2337FF;
                    --text-color: #333;
                    --border-color: #e1e5e9;
                    --editor-bg: #ffffff;
                    --shadow: 0 4px 6px rgba(34, 41, 57, 0.1);
                }
                
                .wix-editor-wrapper {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background-color: var(--primary-bg);
                    color: var(--text-color);
                    line-height: 1.6;
                    padding: 20px;
                    box-sizing: border-box;
                }

                .wix-editor-wrapper * {
                    box-sizing: border-box;
                }
                
                .wix-editor-wrapper .container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .wix-editor-wrapper .editor-container {
                    background: var(--editor-bg);
                    border-radius: 12px;
                    box-shadow: var(--shadow);
                    margin-bottom: 20px;
                    overflow: hidden;
                }
                
                .wix-editor-wrapper .editor-toolbar {
                    background: var(--heading-color);
                    padding: 16px 24px;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                
                .wix-editor-wrapper .editor-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                }
                
                .wix-editor-wrapper .editor-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                
                .wix-editor-wrapper .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                
                .wix-editor-wrapper .btn-primary {
                    background: var(--accent-color);
                    color: white;
                }
                
                .wix-editor-wrapper .btn-primary:hover {
                    background: #1c2ecc;
                    transform: translateY(-1px);
                }
                
                .wix-editor-wrapper .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .wix-editor-wrapper .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .wix-editor-wrapper #editor {
                    padding: 24px;
                    min-height: 500px;
                }
                
                .wix-editor-wrapper .modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                }
                
                .wix-editor-wrapper .modal-content {
                    background-color: white;
                    margin: 5% auto;
                    padding: 0;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 85vh;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(34, 41, 57, 0.3);
                    animation: modalFadeIn 0.3s ease-out;
                }
                
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: translateY(-50px) scale(0.9); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                
                .wix-editor-wrapper .modal-header {
                    background: var(--heading-color);
                    color: white;
                    padding: 20px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .wix-editor-wrapper .modal-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0;
                }
                
                .wix-editor-wrapper .close {
                    color: white;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: color 0.2s;
                    line-height: 1;
                }
                
                .wix-editor-wrapper .close:hover {
                    color: var(--accent-color);
                }
                
                .wix-editor-wrapper .modal-body {
                    padding: 24px;
                    max-height: calc(85vh - 100px);
                    overflow-y: auto;
                }
                
                .wix-editor-wrapper .code-output {
                    background: #f8f9fa;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 16px;
                    font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
                    font-size: 14px;
                    line-height: 1.5;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .wix-editor-wrapper .copy-btn {
                    background: var(--accent-color);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    margin-bottom: 16px;
                    transition: background 0.2s;
                }
                
                .wix-editor-wrapper .copy-btn:hover {
                    background: #1c2ecc;
                }
                
                .wix-editor-wrapper .form-group {
                    margin-bottom: 16px;
                }
                
                .wix-editor-wrapper .form-label {
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 500;
                    color: var(--heading-color);
                }
                
                .wix-editor-wrapper .form-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }
                
                .wix-editor-wrapper .form-input:focus {
                    outline: none;
                    border-color: var(--accent-color);
                }
                
                .wix-editor-wrapper .button-group {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-top: 24px;
                }
                
                .wix-editor-wrapper .btn-cancel {
                    background: #6c757d;
                    color: white;
                }
                
                .wix-editor-wrapper .btn-cancel:hover {
                    background: #5a6268;
                }
                
                .wix-editor-wrapper .video-container {
                    position: relative;
                    width: 100%;
                    padding-bottom: 56.25%;
                    height: 0;
                    overflow: hidden;
                    margin: 10px 0;
                }
                
                .wix-editor-wrapper .video-container iframe,
                .wix-editor-wrapper .video-container video {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 8px;
                }
                
                .wix-editor-wrapper .video-caption {
                    margin-top: 8px;
                    font-style: italic;
                    color: #666;
                    text-align: center;
                }
                
                @media (max-width: 768px) {
                    .wix-editor-wrapper {
                        padding: 10px;
                    }
                    .wix-editor-wrapper .editor-toolbar {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .wix-editor-wrapper .modal-content {
                        width: 95%;
                        margin: 10% auto;
                    }
                }
                
                /* Editor.js specific styling */
                .codex-editor__redactor {
                    padding-bottom: 300px;
                }
                .ce-block__content {
                    max-width: none;
                }
                .ce-toolbar__content {
                    max-width: none;
                }
                .ce-toolbar {
                    position: absolute;
                    left: 0 !important;
                    margin-left: 0 !important;
                }
                .ce-toolbox {
                    left: 0 !important;
                }
                .codex-editor {
                    position: relative;
                }
                .ce-toolbar__plus,
                .ce-toolbar__settings-btn {
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                .wix-editor-wrapper #editor {
                    padding-left: 50px;
                }
                .ce-block {
                    margin-left: 0;
                }
                
                .wix-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    z-index: 10000;
                    font-size: 14px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideIn 0.3s ease-out;
                }
                .wix-notification.error {
                    background: #dc3545;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>

            <div class="wix-editor-wrapper">
                <div class="container">
                    <div class="editor-container">
                        <div class="editor-toolbar">
                            <div class="editor-title">📝 Blog Editor</div>
                            <div class="editor-actions">
                                <button class="btn btn-primary" id="btn-save">💾 Save</button>
                                <button class="btn btn-primary" id="btn-view-md">👁️ View Markdown</button>
                                <button class="btn btn-primary" id="btn-export-md">📝 Export MD</button>
                                <button class="btn btn-secondary" id="btn-clear">🗑️ Clear</button>
                            </div>
                        </div>
                        <div id="editor"></div>
                    </div>

                    <div id="markdownModal" class="modal">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3 class="modal-title">📋 Markdown Output</h3>
                                <span class="close" id="close-markdown-modal">&times;</span>
                            </div>
                            <div class="modal-body">
                                <button class="copy-btn" id="btn-copy-md">📋 Copy Markdown</button>
                                <div id="markdown-output" class="code-output"></div>
                            </div>
                        </div>
                    </div>

                    <div id="imageModal" class="modal">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3 class="modal-title">🖼️ Add Image</h3>
                                <span class="close" id="close-image-modal">&times;</span>
                            </div>
                            <div class="modal-body">
                                <form id="imageForm">
                                    <div class="form-group">
                                        <label class="form-label">Image URL *</label>
                                        <input type="url" class="form-input" id="imageUrl" placeholder="https://example.com/image.jpg" required>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Alt Text *</label>
                                        <input type="text" class="form-input" id="imageAlt" placeholder="Description of the image" required>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Caption (Optional)</label>
                                        <input type="text" class="form-input" id="imageCaption" placeholder="Image caption">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Link URL (Optional)</label>
                                        <input type="url" class="form-input" id="imageLink" placeholder="https://example.com">
                                    </div>
                                    <div class="button-group">
                                        <button type="button" class="btn btn-cancel" id="btn-cancel-image">Cancel</button>
                                        <button type="submit" class="btn btn-primary">Add Image</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div id="videoModal" class="modal">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3 class="modal-title">🎥 Add Video</h3>
                                <span class="close" id="close-video-modal">&times;</span>
                            </div>
                            <div class="modal-body">
                                <form id="videoForm">
                                    <div class="form-group">
                                        <label class="form-label">Video Type *</label>
                                        <select class="form-input" id="videoType" required>
                                            <option value="youtube">YouTube</option>
                                            <option value="vimeo">Vimeo</option>
                                            <option value="mp4">Direct Video URL (MP4)</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Video URL *</label>
                                        <input type="url" class="form-input" id="videoUrl" placeholder="https://www.youtube.com/watch?v=..." required>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Caption (Optional)</label>
                                        <input type="text" class="form-input" id="videoCaption" placeholder="Video caption">
                                    </div>
                                    <div class="button-group">
                                        <button type="button" class="btn btn-cancel" id="btn-cancel-video">Cancel</button>
                                        <button type="submit" class="btn btn-primary">Add Video</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async loadDependencies() {
        // Load Core first
        await this.loadScript("https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest/dist/editor.min.js");
        
        // Load Plugins in parallel
        const plugins = [
            "https://cdn.jsdelivr.net/npm/@editorjs/header@latest/dist/bundle.min.js",
            "https://cdn.jsdelivr.net/npm/@editorjs/list@latest/dist/bundle.min.js",
            "https://cdn.jsdelivr.net/npm/@editorjs/quote@latest/dist/bundle.min.js",
            "https://cdn.jsdelivr.net/npm/@editorjs/code@latest/dist/bundle.min.js",
            "https://cdn.jsdelivr.net/npm/@editorjs/embed@latest/dist/bundle.min.js",
            "https://cdn.jsdelivr.net/npm/@editorjs/table@latest/dist/bundle.min.js",
            "https://cdn.jsdelivr.net/npm/@editorjs/warning@latest/dist/bundle.min.js",
            "https://cdn.jsdelivr.net/npm/@editorjs/marker@latest/dist/bundle.min.js",
            "https://cdn.jsdelivr.net/npm/@editorjs/inline-code@latest/dist/bundle.min.js",
            "https://cdn.jsdelivr.net/npm/@editorjs/delimiter@latest/dist/bundle.min.js",
            "https://cdn.jsdelivr.net/npm/@editorjs/raw@latest/dist/bundle.min.js",
            "https://cdn.jsdelivr.net/npm/@editorjs/checklist@latest/dist/bundle.min.js",
            "https://cdn.jsdelivr.net/npm/@editorjs/paragraph@latest/dist/bundle.min.js",
            "https://cdn.jsdelivr.net/npm/@editorjs/underline@latest/dist/bundle.min.js"
        ];
        
        await Promise.all(plugins.map(src => this.loadScript(src)));
    }

    initEditor() {
        const self = this;

        class CustomImageTool {
            static get toolbox() {
                return {
                    title: 'Image',
                    icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>'
                };
            }

            constructor({ data, api, config }) {
                this.data = data;
                this.api = api;
                this.config = config;
                this.wrapper = undefined;
            }

            render() {
                this.wrapper = document.createElement('div');
                this.wrapper.classList.add('custom-image-tool');
                
                const button = document.createElement('button');
                button.classList.add('btn', 'btn-primary');
                button.textContent = '🖼️ Add Image';
                button.style.margin = '10px 0';
                button.onclick = () => this.openImageModal();
                
                this.wrapper.appendChild(button);
                
                if (this.data && this.data.url) {
                    this.showImage();
                }
                
                return this.wrapper;
            }

            openImageModal() {
                this.config.editorInstance.openImageModal((imageData) => {
                    this.data = imageData;
                    this.showImage();
                });
            }

            showImage() {
                this.wrapper.innerHTML = '';
                
                const imageContainer = document.createElement('div');
                imageContainer.style.cssText = 'margin: 10px 0; text-align: center;';
                
                let imgElement;
                if (this.data.link) {
                    const link = document.createElement('a');
                    link.href = this.data.link;
                    link.target = '_blank';
                    imgElement = document.createElement('img');
                    link.appendChild(imgElement);
                    imageContainer.appendChild(link);
                } else {
                    imgElement = document.createElement('img');
                    imageContainer.appendChild(imgElement);
                }
                
                imgElement.src = this.data.url;
                imgElement.alt = this.data.alt || '';
                imgElement.style.cssText = 'max-width: 100%; height: auto; border-radius: 8px;';
                
                if (this.data.caption) {
                    const caption = document.createElement('p');
                    caption.textContent = this.data.caption;
                    caption.style.cssText = 'margin-top: 8px; font-style: italic; color: #666;';
                    imageContainer.appendChild(caption);
                }
                
                const editBtn = document.createElement('button');
                editBtn.classList.add('btn', 'btn-secondary');
                editBtn.textContent = '✏️ Edit Image';
                editBtn.style.marginTop = '10px';
                editBtn.onclick = () => {
                    this.config.editorInstance.prefillImageModal(this.data);
                    this.openImageModal();
                };
                
                this.wrapper.appendChild(imageContainer);
                this.wrapper.appendChild(editBtn);
            }

            save() {
                return this.data;
            }
        }

        class CustomVideoTool {
            static get toolbox() {
                return {
                    title: 'Video',
                    icon: '<svg width="17" height="15" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm115.7 272l-176 101c-15.8 8.8-35.7-2.5-35.7-21V152c0-18.4 19.8-29.8 35.7-21l176 107c16.4 9.2 16.4 32.9 0 42z"/></svg>'
                };
            }

            constructor({ data, api, config }) {
                this.data = data;
                this.api = api;
                this.config = config;
                this.wrapper = undefined;
            }

            render() {
                this.wrapper = document.createElement('div');
                this.wrapper.classList.add('custom-video-tool');
                
                const button = document.createElement('button');
                button.classList.add('btn', 'btn-primary');
                button.textContent = '🎥 Add Video';
                button.style.margin = '10px 0';
                button.onclick = () => this.openVideoModal();
                
                this.wrapper.appendChild(button);
                
                if (this.data && this.data.url) {
                    this.showVideo();
                }
                
                return this.wrapper;
            }

            openVideoModal() {
                this.config.editorInstance.openVideoModal((videoData) => {
                    this.data = videoData;
                    this.showVideo();
                });
            }

            showVideo() {
                this.wrapper.innerHTML = '';
                
                const videoContainer = document.createElement('div');
                videoContainer.classList.add('video-container');
                
                if (this.data.type === 'youtube') {
                    const iframe = document.createElement('iframe');
                    iframe.src = this.getYouTubeEmbedUrl(this.data.url);
                    iframe.frameBorder = '0';
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;
                    videoContainer.appendChild(iframe);
                } else if (this.data.type === 'vimeo') {
                    const iframe = document.createElement('iframe');
                    iframe.src = this.getVimeoEmbedUrl(this.data.url);
                    iframe.frameBorder = '0';
                    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
                    iframe.allowFullscreen = true;
                    videoContainer.appendChild(iframe);
                } else if (this.data.type === 'mp4') {
                    const video = document.createElement('video');
                    video.src = this.data.url;
                    video.controls = true;
                    videoContainer.appendChild(video);
                }
                
                this.wrapper.appendChild(videoContainer);
                
                if (this.data.caption) {
                    const caption = document.createElement('p');
                    caption.classList.add('video-caption');
                    caption.textContent = this.data.caption;
                    this.wrapper.appendChild(caption);
                }
                
                const editBtn = document.createElement('button');
                editBtn.classList.add('btn', 'btn-secondary');
                editBtn.textContent = '✏️ Edit Video';
                editBtn.style.marginTop = '10px';
                editBtn.onclick = () => {
                    this.config.editorInstance.prefillVideoModal(this.data);
                    this.openVideoModal();
                };
                
                this.wrapper.appendChild(editBtn);
            }

            getYouTubeEmbedUrl(url) {
                const videoId = self.extractYouTubeId(url);
                return `https://www.youtube-nocookie.com/embed/${videoId}`;
            }

            getVimeoEmbedUrl(url) {
                const videoId = url.split('/').pop();
                return `https://player.vimeo.com/video/${videoId}`;
            }

            save() {
                return this.data;
            }
        }

        const savedContent = localStorage.getItem('blogEditorContent');
        let initialData;
        
        if (savedContent) {
            try {
                initialData = JSON.parse(savedContent);
            } catch (error) {
                console.log('Failed to parse saved content:', error);
                initialData = this.getDefaultContent();
            }
        } else {
            initialData = this.getDefaultContent();
        }
        
        this.editor = new EditorJS({
            holder: this.querySelector('#editor'),
            autofocus: true,
            placeholder: 'Start writing your blog post here! Click the + button to add different content blocks.',
            tools: {
                header: { class: Header, config: { placeholder: 'Enter a header', levels: [1, 2, 3, 4, 5, 6], defaultLevel: 2 } },
                list: { class: List, inlineToolbar: true, config: { defaultStyle: 'unordered' } },
                checklist: { class: Checklist, inlineToolbar: true },
                quote: { class: Quote, inlineToolbar: true, shortcut: 'CMD+SHIFT+O', config: { quotePlaceholder: 'Enter a quote', captionPlaceholder: 'Quote\'s author' } },
                code: { class: CodeTool, config: { placeholder: 'Enter your code here...' } },
                customImage: { class: CustomImageTool, config: { editorInstance: this } },
                customVideo: { class: CustomVideoTool, config: { editorInstance: this } },
                table: { class: Table, inlineToolbar: true, config: { rows: 2, cols: 3 } },
                warning: { class: Warning, inlineToolbar: true, shortcut: 'CMD+SHIFT+W', config: { titlePlaceholder: 'Title', messagePlaceholder: 'Message' } },
                marker: { class: Marker, shortcut: 'CMD+SHIFT+M' },
                inlineCode: { class: InlineCode, shortcut: 'CMD+SHIFT+C' },
                delimiter: Delimiter,
                raw: { class: RawTool, config: { placeholder: 'Enter raw HTML...' } },
                paragraph: { class: Paragraph, inlineToolbar: true },
                underline: Underline
            },
            data: initialData,
            onChange: () => {
                this.editor.save().then((outputData) => {
                    localStorage.setItem('blogEditorContent', JSON.stringify(outputData));
                }).catch((error) => console.log('Auto-save failed: ', error));
            },
            onReady: () => {
                if (savedContent) {
                    this.showNotification('✅ Previous content restored!', 'success');
                }
            }
        });
    }

    bindEvents() {
        this.querySelector('#btn-save').addEventListener('click', () => this.saveContent());
        this.querySelector('#btn-view-md').addEventListener('click', () => this.viewMarkdown());
        this.querySelector('#btn-export-md').addEventListener('click', () => this.exportMarkdown());
        this.querySelector('#btn-clear').addEventListener('click', () => this.clearEditor());
        
        this.querySelector('#btn-copy-md').addEventListener('click', () => this.copyToClipboard('markdown-output'));

        this.querySelector('#close-markdown-modal').addEventListener('click', () => this.closeMarkdownModal());
        this.querySelector('#close-image-modal').addEventListener('click', () => this.closeImageModal());
        this.querySelector('#close-video-modal').addEventListener('click', () => this.closeVideoModal());

        this.querySelector('#btn-cancel-image').addEventListener('click', () => this.closeImageModal());
        this.querySelector('#btn-cancel-video').addEventListener('click', () => this.closeVideoModal());

        this.querySelector('#imageForm').addEventListener('submit', (e) => this.handleImageSubmit(e));
        this.querySelector('#videoForm').addEventListener('submit', (e) => this.handleVideoSubmit(e));

        // Background click to close modals
        this.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    getDefaultContent() {
        return {
            time: Date.now(),
            blocks: [
                { type: "header", data: { text: "Welcome to Blog Editor!", level: 2 } },
                { type: "paragraph", data: { text: "Start creating your blog post here. Use the + button to add images, videos, code blocks, and more!" } }
            ],
            version: "2.22.2"
        };
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `wix-notification ${type}`;
        notification.textContent = message;
        this.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    saveContent() {
        this.editor.save().then((outputData) => {
            localStorage.setItem('blogEditorContent', JSON.stringify(outputData));
            this.showNotification('💾 Content saved successfully!', 'success');
        }).catch((error) => {
            console.log('Saving failed: ', error);
            this.showNotification('❌ Failed to save content.', 'error');
        });
    }

    viewMarkdown() {
        this.editor.save().then((outputData) => {
            const markdown = this.convertToMarkdown(outputData);
            this.querySelector('#markdown-output').textContent = markdown;
            this.querySelector('#markdownModal').style.display = 'block';
        }).catch((error) => {
            this.showNotification('❌ Failed to generate markdown.', 'error');
        });
    }

    exportMarkdown() {
        this.editor.save().then((outputData) => {
            const markdown = this.convertToMarkdown(outputData);
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'blog-post.md';
            a.click();
            URL.revokeObjectURL(url);
            this.showNotification('📝 Markdown exported successfully!', 'success');
        }).catch((error) => {
            this.showNotification('❌ Failed to export markdown.', 'error');
        });
    }

    clearEditor() {
        if (confirm('🗑️ Are you sure you want to clear all content? This action cannot be undone.')) {
            this.editor.clear();
            localStorage.removeItem('blogEditorContent');
            this.showNotification('✅ Editor cleared!', 'success');
        }
    }

    convertToMarkdown(outputData) {
        let markdown = '';
        outputData.blocks.forEach(block => {
            switch(block.type) {
                case 'header':
                    markdown += `${'#'.repeat(block.data.level)} ${block.data.text}\n\n`;
                    break;
                case 'paragraph':
                    markdown += `${block.data.text}\n\n`;
                    break;
                case 'list':
                    block.data.items.forEach((item, index) => {
                        const prefix = block.data.style === 'ordered' ? `${index + 1}.` : '-';
                        markdown += `${prefix} ${item}\n`;
                    });
                    markdown += '\n';
                    break;
                case 'checklist':
                    block.data.items.forEach(item => {
                        const checked = item.checked ? '[x]' : '[ ]';
                        markdown += `- ${checked} ${item.text}\n`;
                    });
                    markdown += '\n';
                    break;
                case 'quote':
                    markdown += `> ${block.data.text}\n`;
                    if (block.data.caption) {
                        markdown += `> \n> — ${block.data.caption}\n`;
                    }
                    markdown += '\n';
                    break;
                case 'code':
                    markdown += '```\n' + `${block.data.code}\n` + '```\n\n';
                    break;
                case 'customImage':
                    if (block.data && block.data.url) {
                        const alt = block.data.alt || 'Image';
                        if (block.data.link) {
                            markdown += `[![${alt}](${block.data.url})](${block.data.link})\n`;
                        } else {
                            markdown += `![${alt}](${block.data.url})\n`;
                        }
                        if (block.data.caption) markdown += `*${block.data.caption}*\n`;
                        markdown += '\n';
                    }
                    break;
                case 'customVideo':
                    if (block.data && block.data.url) {
                        markdown += '\n<div class="video-container" style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden;">\n';
                        if (block.data.type === 'youtube') {
                            const videoId = this.extractYouTubeId(block.data.url);
                            markdown += `  <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n`;
                        } else if (block.data.type === 'vimeo') {
                            const videoId = block.data.url.split('/').pop();
                            markdown += `  <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>\n`;
                        } else if (block.data.type === 'mp4') {
                            markdown += `  <video style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" controls>\n    <source src="${block.data.url}" type="video/mp4">\n    Your browser does not support the video tag.\n  </video>\n`;
                        }
                        markdown += '</div>\n';
                        if (block.data.caption) markdown += `\n*${block.data.caption}*\n`;
                        markdown += '\n';
                    }
                    break;
                case 'table':
                    if (block.data.content && block.data.content.length > 0) {
                        markdown += '| ' + block.data.content[0].join(' | ') + ' |\n';
                        markdown += '| ' + block.data.content[0].map(() => '---').join(' | ') + ' |\n';
                        for (let i = 1; i < block.data.content.length; i++) {
                            markdown += '| ' + block.data.content[i].join(' | ') + ' |\n';
                        }
                        markdown += '\n';
                    }
                    break;
                case 'warning':
                    markdown += `> ⚠️ **${block.data.title || 'Warning'}**\n> ${block.data.message}\n\n`;
                    break;
                case 'delimiter':
                    markdown += '---\n\n';
                    break;
                case 'raw':
                    markdown += `\`\`\`html\n${block.data.html}\n\`\`\`\n\n`;
                    break;
                default:
                    markdown += `\n\n`;
            }
        });
        return markdown;
    }

    extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    copyToClipboard(elementId) {
        const text = this.querySelector(`#${elementId}`).textContent;
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showNotification('✅ Copied to clipboard!', 'success');
                    document.body.removeChild(textarea);
                }).catch(() => {
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    this.showNotification('✅ Copied to clipboard!', 'success');
                });
            } else {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                this.showNotification('✅ Copied to clipboard!', 'success');
            }
        } catch (error) {
            document.body.removeChild(textarea);
            this.showNotification('❌ Failed to copy.', 'error');
        }
    }

    openImageModal(callback) {
        this.imageModalCallback = callback;
        this.querySelector('#imageModal').style.display = 'block';
    }

    prefillImageModal(data) {
        this.querySelector('#imageUrl').value = data.url || '';
        this.querySelector('#imageAlt').value = data.alt || '';
        this.querySelector('#imageCaption').value = data.caption || '';
        this.querySelector('#imageLink').value = data.link || '';
    }

    closeImageModal() {
        this.querySelector('#imageModal').style.display = 'none';
        this.querySelector('#imageForm').reset();
    }

    handleImageSubmit(e) {
        e.preventDefault();
        const imageData = {
            url: this.querySelector('#imageUrl').value,
            alt: this.querySelector('#imageAlt').value,
            caption: this.querySelector('#imageCaption').value,
            link: this.querySelector('#imageLink').value
        };
        if (this.imageModalCallback) {
            this.imageModalCallback(imageData);
            this.imageModalCallback = null;
        }
        this.closeImageModal();
    }

    openVideoModal(callback) {
        this.videoModalCallback = callback;
        this.querySelector('#videoModal').style.display = 'block';
    }

    prefillVideoModal(data) {
        this.querySelector('#videoType').value = data.type || 'youtube';
        this.querySelector('#videoUrl').value = data.url || '';
        this.querySelector('#videoCaption').value = data.caption || '';
    }

    closeVideoModal() {
        this.querySelector('#videoModal').style.display = 'none';
        this.querySelector('#videoForm').reset();
    }

    handleVideoSubmit(e) {
        e.preventDefault();
        const videoData = {
            type: this.querySelector('#videoType').value,
            url: this.querySelector('#videoUrl').value,
            caption: this.querySelector('#videoCaption').value
        };
        if (this.videoModalCallback) {
            this.videoModalCallback(videoData);
            this.videoModalCallback = null;
        }
        this.closeVideoModal();
    }

    closeMarkdownModal() {
        this.querySelector('#markdownModal').style.display = 'none';
    }
}

customElements.define('custom-blog-editor', CustomBlogEditor);
