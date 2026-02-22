class BlogEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                /* All the CSS from the original code goes here */
                /* CSS Variables for consistent theming */
                :root {
                    --primary-bg: #F7F8FA;
                    --heading-color: #222939;
                    --accent-color: #2337FF;
                    --text-color: #333;
                    --border-color: #e1e5e9;
                    --editor-bg: #ffffff;
                    --shadow: 0 4px 6px rgba(34, 41, 57, 0.1);
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background-color: var(--primary-bg);
                    color: var(--text-color);
                    line-height: 1.6;
                    padding: 20px;
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .editor-container {
                    background: var(--editor-bg);
                    border-radius: 12px;
                    box-shadow: var(--shadow);
                    margin-bottom: 20px;
                    overflow: hidden;
                }
                
                .editor-toolbar {
                    background: var(--heading-color);
                    padding: 16px 24px;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                
                .editor-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                }
                
                .editor-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                
                .btn-primary {
                    background: var(--accent-color);
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #1c2ecc;
                    transform: translateY(-1px);
                }
                
                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                #editor {
                    padding: 24px;
                    min-height: 500px;
                }
                
                /* Modal Styles */
                .modal {
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
                
                .modal-content {
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
                
                .modal-header {
                    background: var(--heading-color);
                    color: white;
                    padding: 20px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .modal-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0;
                }
                
                .close {
                    color: white;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: color 0.2s;
                    line-height: 1;
                }
                
                .close:hover {
                    color: var(--accent-color);
                }
                
                .modal-body {
                    padding: 24px;
                    max-height: calc(85vh - 100px);
                    overflow-y: auto;
                }
                
                .code-output {
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
                
                .copy-btn {
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
                
                .copy-btn:hover {
                    background: #1c2ecc;
                }
                
                /* Image Popup Styles */
                .form-group {
                    margin-bottom: 16px;
                }
                
                .form-label {
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 500;
                    color: var(--heading-color);
                }
                
                .form-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }
                
                .form-input:focus {
                    outline: none;
                    border-color: var(--accent-color);
                }
                
                .form-textarea {
                    min-height: 80px;
                    resize: vertical;
                }
                
                .button-group {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-top: 24px;
                }
                
                .btn-cancel {
                    background: #6c757d;
                    color: white;
                }
                
                .btn-cancel:hover {
                    background: #5a6268;
                }
                
                /* Responsive video container */
                .video-container {
                    position: relative;
                    width: 100%;
                    padding-bottom: 56.25%; /* 16:9 aspect ratio */
                    height: 0;
                    overflow: hidden;
                    margin: 10px 0;
                }
                
                .video-container iframe,
                .video-container video {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 8px;
                }
                
                .video-caption {
                    margin-top: 8px;
                    font-style: italic;
                    color: #666;
                    text-align: center;
                }
                
                @media (max-width: 768px) {
                    body {
                        padding: 10px;
                    }
                    
                    .editor-toolbar {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    
                    .modal-content {
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
                
                /* Fix for Editor.js toolbar positioning */
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
                
                /* Ensure toolbar buttons are visible */
                .ce-toolbar__plus,
                .ce-toolbar__settings-btn {
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                
                /* Add padding to editor content to prevent overlap */
                #editor {
                    padding-left: 50px;
                }
                
                .ce-block {
                    margin-left: 0;
                }
                
                /* Notification styles */
                .notification {
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
                
                .notification.error {
                    background: #dc3545;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
            <div class="container">
                <!-- Editor Tool -->
                <div class="editor-container">
                    <div class="editor-toolbar">
                        <div class="editor-title">📝 Blog Editor</div>
                        <div class="editor-actions">
                            <button id="save-btn" class="btn btn-primary">💾 Save</button>
                            <button id="view-markdown-btn" class="btn btn-primary">👁️ View Markdown</button>
                            <button id="export-markdown-btn" class="btn btn-primary">📝 Export MD</button>
                            <button id="clear-btn" class="btn btn-secondary">🗑️ Clear</button>
                        </div>
                    </div>
                    <div id="editor"></div>
                </div>

                <!-- Markdown Viewer Modal -->
                <div id="markdownModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">📋 Markdown Output</h3>
                            <span id="close-markdown" class="close">&times;</span>
                        </div>
                        <div class="modal-body">
                            <button id="copy-markdown" class="copy-btn">📋 Copy Markdown</button>
                            <div id="markdown-output" class="code-output"></div>
                        </div>
                    </div>
                </div>

                <!-- Image Popup Modal -->
                <div id="imageModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">🖼️ Add Image</h3>
                            <span id="close-image" class="close">&times;</span>
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
                                    <button type="button" id="cancel-image" class="btn btn-cancel">Cancel</button>
                                    <button type="submit" class="btn btn-primary">Add Image</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Video Popup Modal -->
                <div id="videoModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">🎥 Add Video</h3>
                            <span id="close-video" class="close">&times;</span>
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
                                    <button type="button" id="cancel-video" class="btn btn-cancel">Cancel</button>
                                    <button type="submit" class="btn btn-primary">Add Video</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const scriptUrls = [
            'https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest/dist/editor.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/header@latest/dist/bundle.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/list@latest/dist/bundle.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/quote@latest/dist/bundle.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/code@latest/dist/bundle.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/embed@latest/dist/bundle.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/table@latest/dist/bundle.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/warning@latest/dist/bundle.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/marker@latest/dist/bundle.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/inline-code@latest/dist/bundle.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/delimiter@latest/dist/bundle.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/raw@latest/dist/bundle.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/checklist@latest/dist/bundle.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/paragraph@latest/dist/bundle.min.js',
            'https://cdn.jsdelivr.net/npm/@editorjs/underline@latest/dist/bundle.min.js'
        ];

        await this.loadScripts(scriptUrls);

        this.initFunctionality();
    }

    async loadScripts(urls) {
        for (const url of urls) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = url;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
    }

    initFunctionality() {
        const root = this.shadowRoot;
        let editor;
        let imageModalCallback = null;
        let videoModalCallback = null;

        // Custom Image Tool
        class CustomImageTool {
            static get toolbox() {
                return {
                    title: 'Image',
                    icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>'
                };
            }

            constructor({ data, api }) {
                this.data = data;
                this.api = api;
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
                imageModalCallback = (imageData) => {
                    this.data = imageData;
                    this.showImage();
                };
                root.getElementById('imageModal').style.display = 'block';
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
                    root.getElementById('imageUrl').value = this.data.url || '';
                    root.getElementById('imageAlt').value = this.data.alt || '';
                    root.getElementById('imageCaption').value = this.data.caption || '';
                    root.getElementById('imageLink').value = this.data.link || '';
                    this.openImageModal();
                };
                
                this.wrapper.appendChild(imageContainer);
                this.wrapper.appendChild(editBtn);
            }

            save() {
                return this.data;
            }
        }

        // Custom Video Tool
        class CustomVideoTool {
            static get toolbox() {
                return {
                    title: 'Video',
                    icon: '<svg width="17" height="15" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm115.7 272l-176 101c-15.8 8.8-35.7-2.5-35.7-21V152c0-18.4 19.8-29.8 35.7-21l176 107c16.4 9.2 16.4 32.9 0 42z"/></svg>'
                };
            }

            constructor({ data, api }) {
                this.data = data;
                this.api = api;
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
                videoModalCallback = (videoData) => {
                    this.data = videoData;
                    this.showVideo();
                };
                root.getElementById('videoModal').style.display = 'block';
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
                    root.getElementById('videoType').value = this.data.type || 'youtube';
                    root.getElementById('videoUrl').value = this.data.url || '';
                    root.getElementById('videoCaption').value = this.data.caption || '';
                    this.openVideoModal();
                };
                
                this.wrapper.appendChild(editBtn);
            }

            getYouTubeEmbedUrl(url) {
                const videoId = this.extractYouTubeId(url);
                return `https://www.youtube-nocookie.com/embed/${videoId}`;
            }

            extractYouTubeId(url) {
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                const match = url.match(regExp);
                return (match && match[2].length === 11) ? match[2] : null;
            }

            getVimeoEmbedUrl(url) {
                const videoId = url.split('/').pop();
                return `https://player.vimeo.com/video/${videoId}`;
            }

            save() {
                return this.data;
            }
        }

        // Get default content
        function getDefaultContent() {
            return {
                time: Date.now(),
                blocks: [
                    {
                        type: "header",
                        data: {
                            text: "Welcome to Blog Editor!",
                            level: 2
                        }
                    },
                    {
                        type: "paragraph",
                        data: {
                            text: "Start creating your blog post here. Use the + button to add images, videos, code blocks, and more!"
                        }
                    }
                ],
                version: "2.22.2"
            };
        }

        // Show notification
        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        // Convert to Markdown
        function convertToMarkdown(outputData) {
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
                        markdown += '```\n';
                        markdown += `${block.data.code}\n`;
                        markdown += '```\n\n';
                        break;
                    case 'customImage':
                        if (block.data && block.data.url) {
                            const alt = block.data.alt || 'Image';
                            if (block.data.link) {
                                markdown += `[![${alt}](${block.data.url})](${block.data.link})\n`;
                            } else {
                                markdown += `![${alt}](${block.data.url})\n`;
                            }
                            if (block.data.caption) {
                                markdown += `*${block.data.caption}*\n`;
                            }
                            markdown += '\n';
                        }
                        break;
                    case 'customVideo':
                        if (block.data && block.data.url) {
                            markdown += '\n';
                            markdown += '<div class="video-container" style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden;">\n';
                            
                            if (block.data.type === 'youtube') {
                                const videoId = extractYouTubeId(block.data.url);
                                markdown += `  <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n`;
                            } else if (block.data.type === 'vimeo') {
                                const videoId = block.data.url.split('/').pop();
                                markdown += `  <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>\n`;
                            } else if (block.data.type === 'mp4') {
                                markdown += `  <video style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" controls>\n    <source src="${block.data.url}" type="video/mp4">\n    Your browser does not support the video tag.\n  </video>\n`;
                            }
                            
                            markdown += '</div>\n';
                            
                            if (block.data.caption) {
                                markdown += `\n*${block.data.caption}*\n`;
                            }
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
                        markdown += `> ⚠️ **${block.data.title || 'Warning'}**\n`;
                        markdown += `> ${block.data.message}\n\n`;
                        break;
                    case 'delimiter':
                        markdown += '---\n\n';
                        break;
                    case 'raw':
                        markdown += `\`\`\`html\n${block.data.html}\n\`\`\`\n\n`;
                        break;
                    default:
                        markdown += `<!-- ${block.type} block -->\n\n`;
                }
            });
            return markdown;
        }

        function extractYouTubeId(url) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        }

        // Copy to clipboard
        function copyToClipboard(elementId) {
            const element = root.getElementById(elementId);
            const text = element.textContent;
            
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(() => {
                        showNotification('✅ Copied to clipboard!', 'success');
                        document.body.removeChild(textarea);
                    }).catch(() => {
                        fallbackCopy();
                    });
                } else {
                    fallbackCopy();
                }
            } catch (error) {
                console.log('Failed to copy: ', error);
                document.body.removeChild(textarea);
                showNotification('❌ Failed to copy.', 'error');
            }

            function fallbackCopy() {
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (success) {
                    showNotification('✅ Copied to clipboard!', 'success');
                } else {
                    showNotification('❌ Failed to copy.', 'error');
                }
            }
        }

        // Modal close functions
        function closeMarkdownModal() {
            root.getElementById('markdownModal').style.display = 'none';
        }

        function closeImageModal() {
            root.getElementById('imageModal').style.display = 'none';
            root.getElementById('imageForm').reset();
        }

        function closeVideoModal() {
            root.getElementById('videoModal').style.display = 'none';
            root.getElementById('videoForm').reset();
        }

        // Initialize Editor.js
        const savedContent = localStorage.getItem('blogEditorContent');
        let initialData;
        
        if (savedContent) {
            try {
                initialData = JSON.parse(savedContent);
            } catch (error) {
                console.log('Failed to parse saved content:', error);
                initialData = getDefaultContent();
            }
        } else {
            initialData = getDefaultContent();
        }
        
        editor = new EditorJS({
            holder: root.getElementById('editor'),
            autofocus: true,
            placeholder: 'Start writing your blog post here! Click the + button to add different content blocks.',
            tools: {
                header: {
                    class: Header,
                    config: {
                        placeholder: 'Enter a header',
                        levels: [1, 2, 3, 4, 5, 6],
                        defaultLevel: 2
                    }
                },
                list: {
                    class: List,
                    inlineToolbar: true,
                    config: {
                        defaultStyle: 'unordered'
                    }
                },
                checklist: {
                    class: Checklist,
                    inlineToolbar: true,
                },
                quote: {
                    class: Quote,
                    inlineToolbar: true,
                    shortcut: 'CMD+SHIFT+O',
                    config: {
                        quotePlaceholder: 'Enter a quote',
                        captionPlaceholder: 'Quote\'s author',
                    },
                },
                code: {
                    class: CodeTool,
                    config: {
                        placeholder: 'Enter your code here...'
                    }
                },
                customImage: CustomImageTool,
                customVideo: CustomVideoTool,
                table: {
                    class: Table,
                    inlineToolbar: true,
                    config: {
                        rows: 2,
                        cols: 3,
                    },
                },
                warning: {
                    class: Warning,
                    inlineToolbar: true,
                    shortcut: 'CMD+SHIFT+W',
                    config: {
                        titlePlaceholder: 'Title',
                        messagePlaceholder: 'Message',
                    },
                },
                marker: {
                    class: Marker,
                    shortcut: 'CMD+SHIFT+M',
                },
                inlineCode: {
                    class: InlineCode,
                    shortcut: 'CMD+SHIFT+C',
                },
                delimiter: Delimiter,
                raw: {
                    class: RawTool,
                    config: {
                        placeholder: 'Enter raw HTML...'
                    }
                },
                paragraph: {
                    class: Paragraph,
                    inlineToolbar: true,
                },
                underline: Underline
            },
            data: initialData,
            onChange: function() {
                editor.save().then((outputData) => {
                    localStorage.setItem('blogEditorContent', JSON.stringify(outputData));
                }).catch((error) => {
                    console.log('Auto-save failed: ', error);
                });
            },
            onReady: function() {
                console.log('Blog Editor is ready!');
                if (savedContent) {
                    showNotification('✅ Previous content restored!', 'success');
                }
            }
        });

        // Save content
        function saveContent() {
            editor.save().then((outputData) => {
                localStorage.setItem('blogEditorContent', JSON.stringify(outputData));
                showNotification('💾 Content saved successfully!', 'success');
            }).catch((error) => {
                console.log('Saving failed: ', error);
                showNotification('❌ Failed to save content.', 'error');
            });
        }

        // View Markdown
        function viewMarkdown() {
            editor.save().then((outputData) => {
                const markdown = convertToMarkdown(outputData);
                root.getElementById('markdown-output').textContent = markdown;
                root.getElementById('markdownModal').style.display = 'block';
            }).catch((error) => {
                console.log('Failed to generate markdown: ', error);
                showNotification('❌ Failed to generate markdown.', 'error');
            });
        }

        // Export Markdown
        function exportMarkdown() {
            editor.save().then((outputData) => {
                const markdown = convertToMarkdown(outputData);
                const blob = new Blob([markdown], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'blog-post.md';
                a.click();
                URL.revokeObjectURL(url);
                showNotification('📝 Markdown exported successfully!', 'success');
            }).catch((error) => {
                console.log('Export failed: ', error);
                showNotification('❌ Failed to export markdown.', 'error');
            });
        }

        // Clear editor
        function clearEditor() {
            if (confirm('🗑️ Are you sure you want to clear all content? This action cannot be undone.')) {
                editor.clear();
                localStorage.removeItem('blogEditorContent');
                showNotification('✅ Editor cleared!', 'success');
            }
        }

        // Add event listeners
        root.getElementById('save-btn').addEventListener('click', saveContent);
        root.getElementById('view-markdown-btn').addEventListener('click', viewMarkdown);
        root.getElementById('export-markdown-btn').addEventListener('click', exportMarkdown);
        root.getElementById('clear-btn').addEventListener('click', clearEditor);

        root.getElementById('close-markdown').addEventListener('click', closeMarkdownModal);
        root.getElementById('copy-markdown').addEventListener('click', () => copyToClipboard('markdown-output'));
        root.getElementById('close-image').addEventListener('click', closeImageModal);
        root.getElementById('cancel-image').addEventListener('click', closeImageModal);
        root.getElementById('close-video').addEventListener('click', closeVideoModal);
        root.getElementById('cancel-video').addEventListener('click', closeVideoModal);

        // Image form submission
        root.getElementById('imageForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const imageData = {
                url: root.getElementById('imageUrl').value,
                alt: root.getElementById('imageAlt').value,
                caption: root.getElementById('imageCaption').value,
                link: root.getElementById('imageLink').value
            };
            
            if (imageModalCallback) {
                imageModalCallback(imageData);
                imageModalCallback = null;
            }
            
            closeImageModal();
        });

        // Video form submission
        root.getElementById('videoForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const videoData = {
                type: root.getElementById('videoType').value,
                url: root.getElementById('videoUrl').value,
                caption: root.getElementById('videoCaption').value
            };
            
            if (videoModalCallback) {
                videoModalCallback(videoData);
                videoModalCallback = null;
            }
            
            closeVideoModal();
        });

        // Close modals on outside click
        window.addEventListener('click', function(event) {
            const modals = ['markdownModal', 'imageModal', 'videoModal'];
            modals.forEach(id => {
                const modal = root.getElementById(id);
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Close modals with Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeMarkdownModal();
                closeImageModal();
                closeVideoModal();
            }
        });
    }
}

customElements.define('blog-editor', BlogEditor);
