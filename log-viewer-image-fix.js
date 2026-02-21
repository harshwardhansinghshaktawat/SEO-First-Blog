class EnhancedBlogPostViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.state = {
      postData: null,
      relatedPosts: [],
      isLoading: true
    };

    this.markedLoaded = false;
    this.isMobile = false;
    this.initializeUI();
  }

  static get observedAttributes() {
    return ['post-data', 'related-posts'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!newValue || oldValue === newValue) return;

    if (name === 'post-data') {
      try {
        this.state.postData = JSON.parse(newValue);
        // Use requestAnimationFrame for smoother rendering
        requestAnimationFrame(() => {
          this.renderPost();
          this.updateSEOMarkup();
        });
      } catch (e) {
        console.error('Error parsing post data:', e);
      }
    } else if (name === 'related-posts') {
      try {
        this.state.relatedPosts = JSON.parse(newValue);
        requestAnimationFrame(() => {
          this.renderRelatedPosts();
        });
      } catch (e) {
        console.error('Error parsing related posts:', e);
      }
    }
  }

  initializeUI() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-height: 400px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        * {
          box-sizing: border-box;
        }

        .blog-post-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #1E1E1E;
          min-height: 400px;
        }

        /* Post Meta */
        .post-meta {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 30px;
          flex-wrap: wrap;
          padding: 20px 0;
          border-bottom: 1px solid #3d3d3d;
          margin-bottom: 40px;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }

        .author-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .author-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #64FFDA;
        }

        .author-info {
          text-align: left;
        }

        .author-name {
          font-weight: 600;
          color: #ffffff;
          font-size: 15px;
        }

        .publish-date {
          font-size: 13px;
          color: #9ca3af;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #9ca3af;
          font-size: 14px;
        }

        .meta-icon {
          font-size: 16px;
        }

        /* Share Buttons */
        .share-section {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .share-label {
          font-size: 14px;
          color: #9ca3af;
          font-weight: 500;
        }

        .share-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #3d3d3d;
          background: #2d2d2d;
          color: #b0b0b0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
        }

        .share-btn:hover {
          background: #64FFDA;
          color: #1E1E1E;
          border-color: #64FFDA;
          transform: translateY(-2px);
        }

        /* Content Wrapper */
        #blog-content-wrapper {
          display: flex;
          gap: 40px;
          width: 100%;
          position: relative;
          will-change: transform;
        }

        /* Main Content Area */
        .main-content {
          flex: 1;
          min-width: 0;
          max-width: 900px;
        }

        /* TOC Sidebar */
        .toc-sidebar {
          width: 280px;
          flex-shrink: 0;
          position: sticky;
          top: 20px;
          align-self: flex-start;
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .table-of-contents {
          background: linear-gradient(135deg, #2d2d2d 0%, #252525 100%);
          border: 2px solid #3d3d3d;
          border-radius: 12px;
          padding: 28px 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .toc-title {
          font-size: 22px;
          font-weight: 700;
          color: #64FFDA;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .toc-list li {
          margin-bottom: 4px;
        }

        .toc-list a {
          color: #b0b0b0;
          text-decoration: none;
          display: block;
          padding: 10px 12px;
          transition: all 0.3s;
          border-left: 3px solid transparent;
          border-radius: 6px;
          font-size: 15px;
        }

        .toc-list a:hover,
        .toc-list a.active {
          color: #64FFDA;
          background-color: rgba(100, 255, 218, 0.15);
          border-left-color: #64FFDA;
        }

        .toc-list .toc-level-1 { font-size: 17px; font-weight: 600; }
        .toc-list .toc-level-2 { font-size: 16px; padding-left: 12px; }
        .toc-list .toc-level-3 { font-size: 15px; padding-left: 24px; }

        /* Scrollbar */
        .toc-sidebar::-webkit-scrollbar {
          width: 6px;
        }

        .toc-sidebar::-webkit-scrollbar-track {
          background: #2d2d2d;
          border-radius: 3px;
        }

        .toc-sidebar::-webkit-scrollbar-thumb {
          background: #64FFDA;
          border-radius: 3px;
        }

        /* Blog Content */
        .blog-content {
          font-size: 18px;
          line-height: 1.8;
          color: #ffffff;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
          font-weight: 700;
          line-height: 1.3;
          margin-top: 40px;
          margin-bottom: 20px;
          color: #64FFDA;
          scroll-margin-top: 20px;
        }

        .blog-content h1 { font-size: clamp(32px, 4vw, 42px); }
        .blog-content h2 { font-size: clamp(28px, 3.5vw, 36px); }
        .blog-content h3 { font-size: clamp(24px, 3vw, 30px); }
        .blog-content h4 { font-size: clamp(20px, 2.5vw, 24px); }
        .blog-content h5 { font-size: clamp(18px, 2vw, 20px); }
        .blog-content h6 { font-size: clamp(16px, 1.8vw, 18px); }

        .blog-content p {
          margin-bottom: 24px;
          line-height: 1.8;
        }

        .blog-content a {
          color: #FFFF05;
          text-decoration: none;
          border-bottom: 1px solid #FFFF05;
          transition: all 0.3s;
        }

        .blog-content a:hover {
          color: #FFFF05;
          opacity: 0.8;
        }

        .blog-content strong,
        .blog-content b {
          font-weight: 700;
          color: #64FFDA;
        }

        .blog-content em,
        .blog-content i {
          font-style: italic;
        }

        .blog-content ul,
        .blog-content ol {
          margin-bottom: 24px;
          padding-left: 30px;
        }

        .blog-content ul li {
          list-style-type: disc;
          margin-bottom: 12px;
          line-height: 1.8;
        }

        .blog-content ol li {
          list-style-type: decimal;
          margin-bottom: 12px;
          line-height: 1.8;
        }

        /* Blockquote Styling - FIXED */
        .blog-content blockquote {
          margin: 30px 0;
          padding: 20px 30px;
          border-left: 4px solid #FFFF05;
          background-color: #2d2d2d;
          font-style: italic;
          color: #FFFF05;
          border-radius: 0 8px 8px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .blog-content blockquote p {
          margin-bottom: 0;
        }

        .blog-content blockquote p:last-child {
          margin-bottom: 0;
        }

        /* Code Blocks */
        .blog-content code {
          background-color: #2d2d2d;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
          color: #64FFDA;
        }

        .blog-content pre {
          background-color: #2d2d2d;
          color: #f8f8f2;
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 30px 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          -webkit-overflow-scrolling: touch;
        }

        .blog-content pre code {
          background-color: transparent;
          padding: 0;
          color: #f8f8f2;
          font-size: 14px;
        }

        /* Images */
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 30px auto;
          display: block;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        /* Horizontal Rule */
        .blog-content hr {
          border: none;
          border-top: 2px solid #3d3d3d;
          margin: 40px 0;
        }

        /* Tables - FIXED FOR MOBILE */
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          overflow: hidden;
          background-color: #2d2d2d;
          display: table;
        }

        .blog-content table th,
        .blog-content table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #3d3d3d;
          color: #ffffff;
        }

        .blog-content table thead {
          display: table-header-group;
        }

        .blog-content table tbody {
          display: table-row-group;
        }

        .blog-content table tr {
          display: table-row;
        }

        .blog-content table th {
          display: table-cell;
          background-color: #1a1a1a;
          font-weight: 700;
          color: #64FFDA;
          border-bottom: 2px solid #64FFDA;
        }

        .blog-content table td {
          display: table-cell;
        }

        .blog-content table tbody tr {
          background-color: #2d2d2d;
        }

        .blog-content table tbody tr:nth-child(even) {
          background-color: #252525;
        }

        .blog-content table tr:last-child td {
          border-bottom: none;
        }

        .blog-content table tbody tr:hover {
          background-color: #333333;
        }

        /* Table wrapper for mobile scrolling */
        .table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin: 30px 0;
        }

        .table-wrapper table {
          margin: 0;
        }

        /* Tags Section */
        .tags-section {
          max-width: 900px;
          margin: 60px auto;
          padding-top: 40px;
          border-top: 2px solid #3d3d3d;
        }

        .tags-title {
          font-size: 16px;
          font-weight: 600;
          color: #9ca3af;
          margin-bottom: 16px;
        }

        .tags-container {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tag {
          background: #2d2d2d;
          color: #64FFDA;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          border: 1px solid #3d3d3d;
          transition: all 0.3s;
        }

        .tag:hover {
          background: #3d3d3d;
          border-color: #64FFDA;
        }

        /* Related Posts Section */
        .related-posts-section {
          max-width: 1200px;
          margin: 80px auto 0;
          padding-top: 60px;
          border-top: 2px solid #3d3d3d;
        }

        .related-posts-title {
          font-size: 32px;
          font-weight: 700;
          color: #64FFDA;
          margin-bottom: 40px;
          text-align: center;
        }

        .related-posts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 30px;
        }

        .related-post-card {
          background: #2d2d2d;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #3d3d3d;
          transition: all 0.3s;
          cursor: pointer;
        }

        .related-post-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
          border-color: #64FFDA;
        }

        .related-post-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .related-post-content {
          padding: 24px;
        }

        .related-post-category {
          display: inline-block;
          background: rgba(100, 255, 218, 0.1);
          color: #64FFDA;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .related-post-title {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .related-post-excerpt {
          font-size: 14px;
          color: #9ca3af;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .related-post-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #6b7280;
        }

        /* Mobile Optimizations */
        @media (max-width: 1200px) {
          #blog-content-wrapper {
            flex-direction: column;
          }

          .toc-sidebar {
            position: relative;
            top: 0;
            width: 100%;
            max-width: 100%;
            margin-bottom: 40px;
            max-height: 400px;
          }

          .main-content {
            max-width: 100%;
          }
        }

        @media (max-width: 768px) {
          .blog-post-container {
            padding: 30px 16px;
          }

          .post-meta {
            flex-direction: column;
            gap: 20px;
          }

          .blog-content {
            font-size: 16px;
          }

          .blog-content h1,
          .blog-content h2,
          .blog-content h3 {
            margin-top: 30px;
          }

          .blog-content table {
            font-size: 14px;
          }

          .blog-content table th,
          .blog-content table td {
            padding: 10px 12px;
          }

          .related-posts-grid {
            grid-template-columns: 1fr;
          }

          .share-section {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .blog-post-container {
            padding: 20px 12px;
          }

          .blog-content {
            font-size: 15px;
          }

          .blog-content table th,
          .blog-content table td {
            padding: 8px 10px;
            font-size: 13px;
          }

          .share-btn {
            width: 36px;
            height: 36px;
          }
        }

        /* Performance: Reduce animations on mobile */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      </style>

      <div class="blog-post-container">
        <!-- Post Meta -->
        <div class="post-meta" id="postMeta"></div>

        <!-- Content Wrapper -->
        <div id="blog-content-wrapper">
          <!-- TOC Sidebar -->
          <aside class="toc-sidebar" id="tocSidebar">
            <div id="tableOfContents"></div>
          </aside>

          <!-- Main Content -->
          <div class="main-content">
            <div class="blog-content" id="blogContent"></div>
          </div>
        </div>

        <!-- Tags Section -->
        <div class="tags-section" id="tagsSection" style="display: none;"></div>

        <!-- Related Posts Section -->
        <div class="related-posts-section" id="relatedPostsSection" style="display: none;"></div>
      </div>
    `;

    this.postMeta = this.shadowRoot.getElementById('postMeta');
    this.tocElement = this.shadowRoot.getElementById('tableOfContents');
    this.tocSidebar = this.shadowRoot.getElementById('tocSidebar');
    this.contentElement = this.shadowRoot.getElementById('blogContent');
    this.tagsSection = this.shadowRoot.getElementById('tagsSection');
    this.relatedPostsSection = this.shadowRoot.getElementById('relatedPostsSection');
  }

  _convertWixImageUrl(wixUrl) {
    if (!wixUrl || typeof wixUrl !== 'string') {
      return 'https://static.wixstatic.com/media/default-image.jpg';
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
        console.error('Error parsing Wix image URL:', wixUrl, e);
      }
    }

    return 'https://static.wixstatic.com/media/default-image.jpg';
  }

  renderPost() {
    if (!this.state.postData) return;

    const post = this.state.postData;
    const authorImageUrl = this._convertWixImageUrl(post.authorImage);

    this.postMeta.innerHTML = `
      <div class="author-section">
        <img 
          src="${authorImageUrl}" 
          alt="${this._escapeHtml(post.author)}"
          class="author-avatar"
          loading="lazy"
          onerror="this.src='https://via.placeholder.com/48'"
        />
        <div class="author-info">
          <div class="author-name">${this._escapeHtml(post.author || 'Anonymous')}</div>
          <div class="publish-date">${this._formatDate(post.publishedDate)}</div>
        </div>
      </div>

      <div class="meta-item">
        <span class="meta-icon">⏱️</span>
        <span>${post.readTime || '5 min read'}</span>
      </div>

      <div class="share-section">
        <span class="share-label">Share:</span>
        <a href="#" class="share-btn" data-share="twitter" title="Share on Twitter">🐦</a>
        <a href="#" class="share-btn" data-share="facebook" title="Share on Facebook">📘</a>
        <a href="#" class="share-btn" data-share="linkedin" title="Share on LinkedIn">💼</a>
        <button class="share-btn" data-share="copy" title="Copy link">🔗</button>
      </div>
    `;

    this._setupShareButtons();
    this._renderContent(post.content);

    if (post.tags) {
      this._renderTags(post.tags);
    }
  }

  _renderContent(markdown) {
    if (!markdown) return;

    let htmlContent;
    
    try {
      const preprocessed = this._preprocessMarkdownImages(markdown);
      
      if (window.marked && window.marked.parse) {
        marked.use({
          breaks: true,
          gfm: true,
          headerIds: true,
          mangle: false
        });
        htmlContent = marked.parse(preprocessed);
      } else {
        htmlContent = this._enhancedMarkdownParse(preprocessed);
      }
    } catch (error) {
      console.error('Parse error:', error);
      htmlContent = this._enhancedMarkdownParse(this._preprocessMarkdownImages(markdown));
    }

    htmlContent = this._convertImagesInHTML(htmlContent);
    htmlContent = this._wrapTablesForMobile(htmlContent);
    
    const result = this._generateTableOfContents(htmlContent);
    
    if (result.toc) {
      this.tocElement.innerHTML = result.toc;
      this.contentElement.innerHTML = result.content;
      this._addSmoothScrollToTOC();
      
      // Only init scroll spy on desktop for better mobile performance
      if (window.innerWidth > 768) {
        this._initScrollSpy();
      }
    } else {
      this.tocElement.innerHTML = '';
      this.tocSidebar.style.display = 'none';
      this.contentElement.innerHTML = result.content;
    }
  }

  // Enhanced markdown parser with proper table and blockquote support
  _enhancedMarkdownParse(markdown) {
    let html = markdown;
    
    // Step 1: Protect code blocks first
    const codeBlocks = [];
    html = html.replace(/```([a-z]*)\n([\s\S]*?)```/gim, (match, lang, code) => {
      const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`;
      codeBlocks.push(`<pre><code class="language-${lang}">${this._escapeHtml(code.trim())}</code></pre>`);
      return placeholder;
    });

    // Step 2: Protect inline code
    const inlineCodes = [];
    html = html.replace(/`([^`]+)`/gim, (match, code) => {
      const placeholder = `___INLINE_CODE_${inlineCodes.length}___`;
      inlineCodes.push(`<code>${this._escapeHtml(code)}</code>`);
      return placeholder;
    });

    // Step 3: Protect images
    const protectedImages = [];
    html = html.replace(/<img[^>]+>/g, (match) => {
      const placeholder = `___PROTECTED_IMAGE_${protectedImages.length}___`;
      protectedImages.push(match);
      return placeholder;
    });

    // Step 4: Parse tables BEFORE other elements
    html = this._parseMarkdownTables(html);

    // Step 5: Parse blockquotes
    html = this._parseBlockquotes(html);

    // Step 6: Parse headings
    html = html.replace(/^######\s+(.*)$/gim, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.*)$/gim, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.*)$/gim, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.*)$/gim, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.*)$/gim, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.*)$/gim, '<h1>$1</h1>');

    // Step 7: Parse links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

    // Step 8: Parse bold and italic
    html = html.replace(/\*\*\*([^\*]+)\*\*\*/gim, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*([^\*]+)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*([^\*]+)\*/gim, '<em>$1</em>');

    // Step 9: Parse horizontal rules
    html = html.replace(/^---$/gim, '<hr>');
    html = html.replace(/^\*\*\*$/gim, '<hr>');

    // Step 10: Parse lists
    html = this._parseLists(html);

    // Step 11: Restore protected elements
    protectedImages.forEach((img, index) => {
      html = html.replace(`___PROTECTED_IMAGE_${index}___`, img);
    });

    inlineCodes.forEach((code, index) => {
      html = html.replace(`___INLINE_CODE_${index}___`, code);
    });

    codeBlocks.forEach((code, index) => {
      html = html.replace(`___CODE_BLOCK_${index}___`, code);
    });

    // Step 12: Wrap paragraphs
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<table>)/g, '$1');
    html = html.replace(/(<\/table>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ol>)/g, '$1');
    html = html.replace(/(<\/ol>)<\/p>/g, '$1');
    
    return html;
  }

  // Improved table parser
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
          i++; // Skip separator line
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

  // Parse blockquotes
  _parseBlockquotes(markdown) {
    const lines = markdown.split('\n');
    let result = [];
    let inBlockquote = false;
    let blockquoteLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('>')) {
        inBlockquote = true;
        blockquoteLines.push(line.replace(/^>\s*/, ''));
      } else {
        if (inBlockquote) {
          result.push(`<blockquote><p>${blockquoteLines.join('<br>')}</p></blockquote>`);
          blockquoteLines = [];
          inBlockquote = false;
        }
        result.push(line);
      }
    }
    
    if (inBlockquote && blockquoteLines.length > 0) {
      result.push(`<blockquote><p>${blockquoteLines.join('<br>')}</p></blockquote>`);
    }
    
    return result.join('\n');
  }

  // Parse lists
  _parseLists(markdown) {
    const lines = markdown.split('\n');
    let result = [];
    let inUnorderedList = false;
    let inOrderedList = false;
    let listItems = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const unorderedMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
      const orderedMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
      
      if (unorderedMatch) {
        if (inOrderedList) {
          result.push(`<ol>${listItems.join('')}</ol>`);
          listItems = [];
          inOrderedList = false;
        }
        inUnorderedList = true;
        listItems.push(`<li>${unorderedMatch[1]}</li>`);
      } else if (orderedMatch) {
        if (inUnorderedList) {
          result.push(`<ul>${listItems.join('')}</ul>`);
          listItems = [];
          inUnorderedList = false;
        }
        inOrderedList = true;
        listItems.push(`<li>${orderedMatch[1]}</li>`);
      } else {
        if (inUnorderedList) {
          result.push(`<ul>${listItems.join('')}</ul>`);
          listItems = [];
          inUnorderedList = false;
        }
        if (inOrderedList) {
          result.push(`<ol>${listItems.join('')}</ol>`);
          listItems = [];
          inOrderedList = false;
        }
        result.push(line);
      }
    }
    
    if (inUnorderedList) {
      result.push(`<ul>${listItems.join('')}</ul>`);
    }
    if (inOrderedList) {
      result.push(`<ol>${listItems.join('')}</ol>`);
    }
    
    return result.join('\n');
  }

  // Wrap tables in scrollable container for mobile
  _wrapTablesForMobile(html) {
    return html.replace(/<table>/g, '<div class="table-wrapper"><table>').replace(/<\/table>/g, '</table></div>');
  }

  _convertImagesInHTML(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const images = tempDiv.querySelectorAll('img');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src) {
        const convertedSrc = this._convertWixImageUrl(src);
        img.setAttribute('src', convertedSrc);
        img.setAttribute('loading', 'lazy');
        img.setAttribute('onerror', "this.src='https://static.wixstatic.com/media/default-image.jpg'");
      }
    });
    
    return tempDiv.innerHTML;
  }

  _renderTags(tagsString) {
    if (!tagsString) return;

    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    if (tags.length === 0) return;

    this.tagsSection.innerHTML = `
      <div class="tags-title">Tags</div>
      <div class="tags-container">
        ${tags.map(tag => `<span class="tag">${this._escapeHtml(tag)}</span>`).join('')}
      </div>
    `;
    this.tagsSection.style.display = 'block';
  }

  renderRelatedPosts() {
    if (!this.state.relatedPosts || this.state.relatedPosts.length === 0) {
      this.relatedPostsSection.style.display = 'none';
      return;
    }

    const posts = this.state.relatedPosts;

    this.relatedPostsSection.innerHTML = `
      <h2 class="related-posts-title">Related Articles</h2>
      <div class="related-posts-grid">
        ${posts.map(post => {
          const relatedImageUrl = this._convertWixImageUrl(post.featuredImage);
          return `
            <article class="related-post-card" data-slug="${post.slug}">
              <img 
                src="${relatedImageUrl}" 
                alt="${this._escapeHtml(post.title)}"
                class="related-post-image"
                loading="lazy"
                onerror="this.src='https://via.placeholder.com/400x200'"
              />
              <div class="related-post-content">
                ${post.category ? `<span class="related-post-category">${this._escapeHtml(post.category)}</span>` : ''}
                <h3 class="related-post-title">${this._escapeHtml(post.title)}</h3>
                <p class="related-post-excerpt">${this._escapeHtml(post.excerpt || '')}</p>
                <div class="related-post-meta">
                  <span class="related-post-date">
                    📅 ${this._formatDate(post.publishedDate)}
                  </span>
                  <span class="related-post-readtime">
                    ⏱️ ${post.readTime || '5 min'}
                  </span>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;

    this.relatedPostsSection.style.display = 'block';

    this.shadowRoot.querySelectorAll('.related-post-card').forEach(card => {
      card.addEventListener('click', () => {
        const slug = card.getAttribute('data-slug');
        this._navigateToPost(slug);
      });
    });
  }

  updateSEOMarkup() {
    if (!this.state.postData) return;

    const post = this.state.postData;
    let seoHTML = '';

    seoHTML += `<div class="post-meta">`;
    seoHTML += `<div class="author-section">`;
    seoHTML += `<strong>${this._escapeHtml(post.author || 'Anonymous')}</strong>`;
    seoHTML += `<span>${this._formatDate(post.publishedDate)}</span>`;
    seoHTML += `</div>`;
    seoHTML += `<span>${post.readTime || '5 min read'}</span>`;
    seoHTML += `</div>`;

    if (post.content) {
      let contentHTML = this._enhancedMarkdownParse(post.content);
      contentHTML = this._convertImagesInHTML(contentHTML);
      seoHTML += `<div class="blog-content">${contentHTML}</div>`;
    }

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
      seoHTML += `<div class="related-posts">`;
      seoHTML += `<h2>Related Articles</h2>`;
      seoHTML += `<ul>`;
      this.state.relatedPosts.forEach(relatedPost => {
        seoHTML += `<li><a href="/blog-post/${relatedPost.slug}">${this._escapeHtml(relatedPost.title)}</a></li>`;
      });
      seoHTML += `</ul>`;
      seoHTML += `</div>`;
    }

    this.dispatchEvent(new CustomEvent('seo-markup-ready', {
      detail: { markup: seoHTML },
      bubbles: true,
      composed: true
    }));
  }

  _setupShareButtons() {
    const shareButtons = this.shadowRoot.querySelectorAll('[data-share]');
    
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
    const title = this.state.postData?.title || '';

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };

    if (type === 'copy') {
      navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
      });
    } else if (shareUrls[type]) {
      window.open(shareUrls[type], '_blank', 'width=600,height=400');
    }
  }

  _navigateToPost(slug) {
    this.dispatchEvent(new CustomEvent('navigate-to-post', {
      detail: { slug },
      bubbles: true,
      composed: true
    }));
  }

  _preprocessMarkdownImages(markdown) {
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    return markdown.replace(imagePattern, (match, alt, url) => {
      return `<img src="${url}" alt="${alt}" loading="lazy" />`;
    });
  }

  _generateTableOfContents(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
      return { toc: '', content: htmlContent };
    }
    
    const tocItems = [];
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent;
      const id = `heading-${index}`;
      
      heading.id = id;
      tocItems.push({ level, text, id });
    });
    
    const updatedContent = tempDiv.innerHTML;
    
    let tocHtml = `
      <div class="table-of-contents">
        <div class="toc-title">
          <span>📑</span>
          Table of Contents
        </div>
        <ul class="toc-list">
    `;
    
    tocItems.forEach(item => {
      tocHtml += `<li class="toc-level-${item.level}"><a href="#${item.id}" data-heading-id="${item.id}">${item.text}</a></li>`;
    });
    
    tocHtml += `</ul></div>`;
    
    return { toc: tocHtml, content: updatedContent };
  }

  _addSmoothScrollToTOC() {
    const tocLinks = this.tocElement.querySelectorAll('a[href^="#"]');
    
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = this.contentElement.querySelector(`#${targetId}`);
        
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          tocLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    });
  }

  _initScrollSpy() {
    const headings = this.contentElement.querySelectorAll('[id^="heading-"]');
    const tocLinks = this.tocElement.querySelectorAll('a[data-heading-id]');
    
    if (headings.length === 0 || tocLinks.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const headingId = entry.target.id;
          tocLinks.forEach(link => link.classList.remove('active'));
          const activeLink = this.tocElement.querySelector(`a[data-heading-id="${headingId}"]`);
          if (activeLink) activeLink.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -80% 0px', threshold: 0 });
    
    headings.forEach(heading => observer.observe(heading));
    this.scrollSpyObserver = observer;
  }

  _formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
      console.log('Marked.js loaded');
    };
    document.head.appendChild(script);
  }

  connectedCallback() {
    this.loadMarkedJS();
  }

  disconnectedCallback() {
    if (this.scrollSpyObserver) {
      this.scrollSpyObserver.disconnect();
    }
  }
}

customElements.define('enhanced-blog-post-viewer', EnhancedBlogPostViewer);
