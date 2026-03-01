class MdxBlogEditor extends HTMLElement {
    constructor() {
        super();
        this._currentView = 'list';
        this._posts = [];
        this._editPost = null;
        this._toastEditor = null;
        this._tab = 'editor';
        this._meta = this._freshMeta();
        this._initialized = false;
        this._seoScore = 0;
        this._readabilityScore = 0;
        this._grammarScore = 0;
        this._seoAnalysis = [];
        this._readabilityAnalysis = [];
        this._grammarAnalysis = [];
        this._schemaType = 'Article';
        this._allCategories = [];
        this._allTags = [];
        this._newCategoriesCreated = [];
        this._newTagsCreated = [];
        this._spellingErrors = [];
        this._grammarIssues = [];
        this._wordSuggestions = new Map();
        this._compromiseLoaded = false;
        this._typoLoaded = false;
        this._typoInstance = null;
        this._currentMarkdown = '';
        this._analysisTimeout = null;
    }

    _freshMeta() {
        return {
            blogTitle: '',
            slug: '',
            excerpt: '',
            author: '',
            authorImage: '',
            authorUrl: '',
            category: '',
            tags: '',
            status: 'draft',
            publishedDate: '',
            modifiedDate: '',
            readTime: 0,
            isFeatured: false,
            featuredImage: '',
            seoTitle: '',
            seoDescription: '',
            seoOgImage: '',
            seoKeywords: '',
            focusKeyphrase: '',
            relatedPosts: [],
            internalLinks: [],
            structuredData: {
                type: 'Article',
                headline: '',
                description: '',
                images: [],
                datePublished: '',
                dateModified: '',
                authors: [],
                faqItems: [],
                jobPosting: {
                    title: '',
                    description: '',
                    datePosted: '',
                    validThrough: '',
                    employmentType: 'FULL_TIME',
                    jobLocationType: '',
                    organizationName: '',
                    organizationUrl: '',
                    organizationLogo: '',
                    streetAddress: '',
                    addressLocality: '',
                    addressRegion: '',
                    postalCode: '',
                    addressCountry: '',
                    salaryValue: '',
                    salaryCurrency: 'USD',
                    salaryUnit: 'HOUR',
                    applicantLocationRequirements: ''
                },
                imageObject: {
                    contentUrl: '',
                    license: '',
                    acquireLicensePage: '',
                    creditText: '',
                    creatorName: '',
                    copyrightNotice: ''
                },
                recipe: {
                    name: '',
                    description: '',
                    cuisine: '',
                    category: '',
                    keywords: '',
                    prepTime: '',
                    cookTime: '',
                    totalTime: '',
                    recipeYield: '',
                    calories: '',
                    ingredients: [],
                    instructions: []
                }
            }
        };
    }

    static get observedAttributes() {
        return ['post-list','upload-result','save-result','delete-result','notification','load-data','search-results','categories-list','tags-list','category-created','tag-created'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (!newVal || newVal === oldVal) return;
        
        if (name === 'post-list' && !this._initialized) {
            this._pendingPostList = newVal;
            return;
        }
        
        if (!this._initialized) return;
        
        try {
            const d = JSON.parse(newVal);
            if (name === 'post-list') this._onPostList(d);
            if (name === 'upload-result') this._onUploadResult(d);
            if (name === 'save-result') this._onSaveResult(d);
            if (name === 'delete-result') this._onDeleteResult(d);
            if (name === 'notification') this._toast(d.type, d.message);
            if (name === 'load-data') this._populateEditor(d);
            if (name === 'search-results') this._onSearchResults(d);
            if (name === 'categories-list') this._onCategoriesList(d);
            if (name === 'tags-list') this._onTagsList(d);
            if (name === 'category-created') this._onCategoryCreated(d);
            if (name === 'tag-created') this._onTagCreated(d);
        } catch(e) {}
    }

    connectedCallback() {
        if (this._initialized) return;
        
        requestAnimationFrame(() => {
            this._inject();
            this._wire();
            this._initialized = true;
            
            if (this._pendingPostList) {
                try {
                    const d = JSON.parse(this._pendingPostList);
                    this._onPostList(d);
                    this._pendingPostList = null;
                } catch(e) {}
            }
            
            this._emit('load-post-list', {});
            this._emit('load-categories', {});
            this._emit('load-tags', {});
        });
    }

    disconnectedCallback() {
        if (this._toastEditor) {
            try {
                this._toastEditor.destroy();
                this._toastEditor = null;
            } catch(e) {}
        }
    }

    _formatDateForInput(dateValue) {
        if (!dateValue) return '';
        
        try {
            let date;
            if (dateValue instanceof Date) {
                date = dateValue;
            } else if (typeof dateValue === 'string') {
                date = new Date(dateValue);
            } else {
                return '';
            }
            
            if (isNaN(date.getTime())) return '';
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (e) {
            return '';
        }
    }

    _parseDateFromInput(inputValue) {
        if (!inputValue) return null;
        
        try {
            const date = new Date(inputValue);
            return isNaN(date.getTime()) ? null : date;
        } catch (e) {
            return null;
        }
    }

    _icon(k) {
        const I = {
            edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
            plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
            save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
            eye:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
            gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
            seo:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M11 8v3l2 2" stroke-linecap="round"/></svg>`,
            schema: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
            back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`,
            check:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
            trash:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
            image:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
            code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
            video:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
            html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
            book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
            link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
            search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
            alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            external: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
            down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`,
            spell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
            grammar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`
        };
        return I[k] || I.edit;
    }

    _inject() {
        if (!document.getElementById('toast-editor-css')) {
            const cssLink = document.createElement('link');
            cssLink.id = 'toast-editor-css';
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://uicdn.toast.com/editor/latest/toastui-editor.min.css';
            document.head.appendChild(cssLink);
        }

        if (!document.getElementById('mdx-editor-styles')) {
            const style = document.createElement('style');
            style.id = 'mdx-editor-styles';
            style.textContent = this._styles();
            document.head.appendChild(style);
        }

        const container = document.createElement('div');
        container.className = 'mdx-host';
        container.innerHTML = this._shellHTML();
        
        this.innerHTML = '';
        this.appendChild(container);

        this._loadExternalLibraries();
        this._loadToastEditor();
    }

    async _loadExternalLibraries() {
        if (!window.nlp) {
            try {
                const script1 = document.createElement('script');
                script1.src = 'https://cdn.jsdelivr.net/npm/compromise@14.9.0/builds/compromise.min.js';
                script1.onload = () => { this._compromiseLoaded = true; };
                document.head.appendChild(script1);
            } catch (error) {}
        } else {
            this._compromiseLoaded = true;
        }

        if (!window.Typo) {
            try {
                const script2 = document.createElement('script');
                script2.src = 'https://cdn.jsdelivr.net/npm/typo-js@1.2.1/typo.js';
                script2.onload = async () => {
                    this._typoLoaded = true;
                    await this._initializeSpellChecker();
                };
                document.head.appendChild(script2);
            } catch (error) {}
        } else {
            this._typoLoaded = true;
            await this._initializeSpellChecker();
        }
    }

    async _initializeSpellChecker() {
        if (!window.Typo || this._typoInstance) return;
        
        try {
            this._typoInstance = new Typo('en_US', false, false, {
                dictionaryPath: 'https://cdn.jsdelivr.net/npm/typo-js@1.2.1/dictionaries'
            });
        } catch (error) {}
    }

    async _loadToastEditor() {
        if (window.toastui && window.toastui.Editor) {
            this._toastEditorLoaded = true;
            return;
        }

        try {
            const script = document.createElement('script');
            script.src = 'https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js';
            script.onload = () => { this._toastEditorLoaded = true; };
            script.onerror = () => { this._toast('error', 'Failed to load editor library'); };
            document.head.appendChild(script);
        } catch (error) {}
    }

    _runGrammarAnalysis() {
        if (!this._compromiseLoaded || !window.nlp) {
            this._grammarAnalysis = [{ status: 'info', text: 'Loading grammar checker...' }];
            this._grammarScore = 0;
            return;
        }

        const content = this._currentMarkdown || '';
        const textContent = content
            .replace(/```[\s\S]*?```/g, '')
            .replace(/^#{1,6}\s+.+$/gm, '')
            .replace(/!\[.*?\]\(.*?\)/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

        if (!textContent.trim()) {
            this._grammarAnalysis = [];
            this._grammarScore = 100;
            this._grammarIssues = [];
            return;
        }

        const checks = [];
        const issues = [];
        let score = 100;
        const doc = window.nlp(textContent);

        const sentences = doc.sentences().out('array');
        let passiveCount = 0;
        sentences.forEach((sentence, idx) => {
            const sentDoc = window.nlp(sentence);
            const hasPassive = sentDoc.match('(was|were|been|being) (quickly|slowly|often|always|never)? #Verb').found;
            
            if (hasPassive) {
                passiveCount++;
                issues.push({
                    type: 'passive-voice',
                    sentence: sentence.trim(),
                    sentenceIndex: idx,
                    message: 'Passive voice detected',
                    suggestion: 'Consider using active voice for stronger writing'
                });
            }
        });

        const passiveRatio = passiveCount / Math.max(sentences.length, 1);
        if (passiveRatio > 0.3) {
            score -= 20;
            checks.push({ status: 'bad', text: `Too much passive voice (${passiveCount} sentences). Use active voice.` });
        } else if (passiveRatio > 0.15) {
            score -= 10;
            checks.push({ status: 'ok', text: `Some passive voice (${passiveCount} sentences). Consider active alternatives.` });
        } else {
            checks.push({ status: 'good', text: 'Minimal passive voice detected' });
        }

        const clauses = doc.clauses().out('array');
        let agreementIssues = 0;
        
        clauses.forEach((clause, idx) => {
            const clauseDoc = window.nlp(clause);
            const pluralSubject = clauseDoc.match('#Plural #Noun').found;
            const singularVerb = clauseDoc.match('(is|was|has)').found;
            const singularSubject = clauseDoc.match('#Singular #Noun').found;
            const pluralVerb = clauseDoc.match('(are|were|have)').found;
            
            if ((pluralSubject && singularVerb) || (singularSubject && pluralVerb)) {
                agreementIssues++;
                issues.push({
                    type: 'agreement',
                    sentence: clause.trim(),
                    sentenceIndex: idx,
                    message: 'Possible subject-verb agreement issue',
                    suggestion: 'Check if subject and verb match in number'
                });
            }
        });

        if (agreementIssues > 0) {
            score -= agreementIssues * 5;
            checks.push({ status: 'bad', text: `${agreementIssues} potential subject-verb agreement issue${agreementIssues > 1 ? 's' : ''}` });
        } else {
            checks.push({ status: 'good', text: 'Good subject-verb agreement' });
        }

        const words = doc.terms().out('array').map(w => w.toLowerCase());
        const wordFreq = {};
        words.forEach(word => {
            if (word.length > 5) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });

        const overusedWords = Object.entries(wordFreq)
            .filter(([word, count]) => count > 5)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (overusedWords.length > 0) {
            score -= overusedWords.length * 3;
            const wordList = overusedWords.map(([w, c]) => `"${w}" (${c}×)`).join(', ');
            checks.push({ status: 'ok', text: `Repetitive words detected: ${wordList}` });
        } else {
            checks.push({ status: 'good', text: 'Good word variety' });
        }

        const weakAdverbs = doc.match('(very|really|quite|extremely|absolutely) #Adjective').out('array');
        if (weakAdverbs.length > 3) {
            score -= 10;
            checks.push({ status: 'ok', text: `${weakAdverbs.length} weak adverb combinations. Use stronger adjectives.` });
        } else if (weakAdverbs.length > 0) {
            checks.push({ status: 'ok', text: 'Some weak adverb usage detected' });
        } else {
            checks.push({ status: 'good', text: 'Strong word choices' });
        }

        this._grammarScore = Math.max(0, Math.min(100, score));
        this._grammarAnalysis = checks;
        this._grammarIssues = issues;
    }

    _runSpellCheck() {
        if (!this._typoLoaded || !this._typoInstance) {
            this._spellingErrors = [];
            return;
        }

        const content = this._currentMarkdown || '';
        const textContent = content
            .replace(/```[\s\S]*?```/g, '')
            .replace(/!\[.*?\]\(.*?\)/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[#*_`]/g, '');

        const words = textContent.match(/\b[a-zA-Z]{2,}\b/g) || [];
        const errors = [];
        const seen = new Set();

        words.forEach((word, index) => {
            const lowerWord = word.toLowerCase();
            
            if (seen.has(lowerWord)) return;
            seen.add(lowerWord);
            
            if (word.match(/^[A-Z]{2,}$/)) return;
            if (word.match(/^[A-Z][a-z]+[A-Z]/)) return;
            
            const isCorrect = this._typoInstance.check(word);
            
            if (!isCorrect) {
                const suggestions = this._typoInstance.suggest(word).slice(0, 5);
                errors.push({
                    word: word,
                    suggestions: suggestions,
                    index: index,
                    position: textContent.indexOf(word)
                });
            }
        });

        this._spellingErrors = errors;
    }

    _runSEOAnalysis() {
        const checks = [];
        let score = 0;
        const maxScore = 100;
        
        const blogTitle = this._meta.blogTitle || '';
        const seoTitle = this._meta.seoTitle || '';
        const seoDesc = this._meta.seoDescription || '';
        const keyphrase = this._meta.focusKeyphrase || '';
        const content = this._currentMarkdown || '';
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

        if (keyphrase.length > 0) {
            score += 8;
            checks.push({ status: 'good', text: 'Focus keyphrase is set' });
        } else {
            checks.push({ status: 'bad', text: 'Set a focus keyphrase to target' });
        }

        if (keyphrase && blogTitle.toLowerCase().includes(keyphrase.toLowerCase())) {
            const position = blogTitle.toLowerCase().indexOf(keyphrase.toLowerCase());
            if (position === 0) {
                score += 12;
                checks.push({ status: 'good', text: 'Keyphrase appears at the beginning of title' });
            } else {
                score += 8;
                checks.push({ status: 'ok', text: 'Keyphrase appears in title but not at the beginning' });
            }
        } else if (keyphrase) {
            checks.push({ status: 'bad', text: 'Keyphrase should appear in blog title, preferably at the beginning' });
        }

        if (keyphrase && seoTitle.toLowerCase().includes(keyphrase.toLowerCase())) {
            score += 10;
            checks.push({ status: 'good', text: 'Keyphrase appears in SEO title' });
        } else if (keyphrase && seoTitle) {
            checks.push({ status: 'bad', text: 'Add keyphrase to SEO title' });
        }

        if (seoTitle.length >= 50 && seoTitle.length <= 60) {
            score += 10;
            checks.push({ status: 'good', text: `SEO title length is optimal (${seoTitle.length} chars)` });
        } else if (seoTitle.length > 0 && seoTitle.length < 70) {
            score += 5;
            checks.push({ status: 'ok', text: `SEO title: ${seoTitle.length} chars (optimal: 50-60)` });
        } else if (seoTitle.length > 70) {
            checks.push({ status: 'bad', text: `SEO title too long (${seoTitle.length} chars, max 60)` });
        } else {
            checks.push({ status: 'bad', text: 'Add SEO title (50-60 characters)' });
        }

        if (seoDesc.length >= 120 && seoDesc.length <= 160) {
            score += 12;
            checks.push({ status: 'good', text: `Meta description length optimal (${seoDesc.length} chars)` });
        } else if (seoDesc.length >= 100 && seoDesc.length < 170) {
            score += 7;
            checks.push({ status: 'ok', text: `Meta description: ${seoDesc.length} chars (optimal: 120-160)` });
        } else if (seoDesc.length > 170) {
            checks.push({ status: 'bad', text: `Meta description too long (${seoDesc.length} chars, max 160)` });
        } else {
            checks.push({ status: 'bad', text: 'Add meta description (120-160 characters)' });
        }

        if (keyphrase && seoDesc.toLowerCase().includes(keyphrase.toLowerCase())) {
            score += 10;
            checks.push({ status: 'good', text: 'Keyphrase appears in meta description' });
        } else if (keyphrase && seoDesc) {
            checks.push({ status: 'bad', text: 'Include keyphrase in meta description' });
        }

        if (wordCount >= 600) {
            score += 12;
            checks.push({ status: 'good', text: `Excellent content length (${wordCount} words)` });
        } else if (wordCount >= 300) {
            score += 8;
            checks.push({ status: 'ok', text: `Good content length (${wordCount} words)` });
        } else if (wordCount >= 150) {
            score += 4;
            checks.push({ status: 'ok', text: `Content is short (${wordCount} words, aim for 300+)` });
        } else {
            checks.push({ status: 'bad', text: `Content too short (${wordCount} words, minimum 300)` });
        }

        if (keyphrase && content) {
            const keyphraseCount = (content.toLowerCase().match(new RegExp(keyphrase.toLowerCase(), 'g')) || []).length;
            const density = wordCount > 0 ? (keyphraseCount / wordCount) * 100 : 0;
            
            if (density >= 0.5 && density <= 2.5) {
                score += 8;
                checks.push({ status: 'good', text: `Keyphrase density good (${density.toFixed(1)}%)` });
            } else if (density > 0 && density < 0.5) {
                score += 4;
                checks.push({ status: 'ok', text: `Use keyphrase more (${density.toFixed(1)}%, aim 0.5-2.5%)` });
            } else if (density > 2.5) {
                checks.push({ status: 'bad', text: `Keyphrase overused (${density.toFixed(1)}%, max 2.5%)` });
            } else {
                checks.push({ status: 'bad', text: 'Keyphrase not found in content' });
            }
            
            const firstParagraph = content.split('\n\n')[0] || '';
            if (firstParagraph.toLowerCase().includes(keyphrase.toLowerCase())) {
                score += 8;
                checks.push({ status: 'good', text: 'Keyphrase in first paragraph' });
            } else if (wordCount > 50) {
                checks.push({ status: 'bad', text: 'Add keyphrase to first paragraph' });
            }
        }

        const h1Count = (content.match(/^# /gm) || []).length;
        const h2Count = (content.match(/^## /gm) || []).length;
        
        if (h1Count === 0 && h2Count > 0) {
            score += 6;
            checks.push({ status: 'good', text: 'Good heading structure' });
        } else if (h1Count > 1) {
            checks.push({ status: 'bad', text: 'Use only one H1 (use H2-H6 for subheadings)' });
        }
        
        if (h2Count > 0) {
            score += 4;
            checks.push({ status: 'good', text: `${h2Count} subheading${h2Count > 1 ? 's' : ''} found` });
        } else if (wordCount > 300) {
            checks.push({ status: 'bad', text: 'Add subheadings (H2) to structure content' });
        }

        const images = (content.match(/!\[/g) || []).length;
        if (images > 0) {
            score += 4;
            checks.push({ status: 'good', text: `${images} image${images > 1 ? 's' : ''} in content` });
            
            const altMissing = (content.match(/!\[\]\(/g) || []).length;
            if (altMissing > 0) {
                checks.push({ status: 'bad', text: `${altMissing} image${altMissing > 1 ? 's' : ''} missing alt text` });
            } else {
                score += 4;
                checks.push({ status: 'good', text: 'All images have alt text' });
            }
        } else if (wordCount > 300) {
            checks.push({ status: 'ok', text: 'Consider adding images' });
        }

        const internalLinks = (content.match(/\[([^\]]+)\]\((?!http)/g) || []).length;
        if (internalLinks >= 2) {
            score += 6;
            checks.push({ status: 'good', text: `${internalLinks} internal link${internalLinks > 1 ? 's' : ''}` });
        } else if (internalLinks === 1) {
            score += 3;
            checks.push({ status: 'ok', text: 'Add more internal links (2+ recommended)' });
        } else if (wordCount > 300) {
            checks.push({ status: 'bad', text: 'Add internal links to other content' });
        }

        const externalLinks = (content.match(/\[([^\]]+)\]\(http/g) || []).length;
        if (externalLinks > 0 && externalLinks <= 5) {
            score += 4;
            checks.push({ status: 'good', text: `${externalLinks} external link${externalLinks > 1 ? 's' : ''}` });
        } else if (externalLinks > 5) {
            checks.push({ status: 'ok', text: 'Many external links - ensure quality sources' });
        }

        this._seoScore = Math.min(score, maxScore);
        this._seoAnalysis = checks;
    }

    _runReadabilityAnalysis() {
        const checks = [];
        let score = 0;
        const maxScore = 100;
        
        const content = this._currentMarkdown || '';
        
        const textContent = content
            .replace(/```[\s\S]*?```/g, '')
            .replace(/^#{1,6}\s+.+$/gm, '');
        
        const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = textContent.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;

        if (wordCount === 0) {
            this._readabilityScore = 0;
            this._readabilityAnalysis = [{ status: 'bad', text: 'Start writing to analyze readability' }];
            return;
        }

        const avgSentenceLength = wordCount / Math.max(sentences.length, 1);
        if (avgSentenceLength <= 15) {
            score += 20;
            checks.push({ status: 'good', text: `Excellent sentence length (avg ${avgSentenceLength.toFixed(1)} words)` });
        } else if (avgSentenceLength <= 20) {
            score += 15;
            checks.push({ status: 'good', text: `Good sentence length (avg ${avgSentenceLength.toFixed(1)} words)` });
        } else if (avgSentenceLength <= 25) {
            score += 10;
            checks.push({ status: 'ok', text: `Acceptable sentences (avg ${avgSentenceLength.toFixed(1)} words, aim <20)` });
        } else {
            score += 5;
            checks.push({ status: 'bad', text: `Sentences too long (avg ${avgSentenceLength.toFixed(1)} words, aim <20)` });
        }

        const longSentences = sentences.filter(s => s.split(/\s+/).length > 25).length;
        const longSentenceRatio = longSentences / Math.max(sentences.length, 1);
        if (longSentenceRatio === 0) {
            score += 15;
            checks.push({ status: 'good', text: 'No overly long sentences' });
        } else if (longSentenceRatio < 0.25) {
            score += 10;
            checks.push({ status: 'ok', text: `${longSentences} long sentence${longSentences > 1 ? 's' : ''} (>25 words)` });
        } else {
            score += 3;
            checks.push({ status: 'bad', text: `${longSentences} very long sentences - split them up` });
        }

        const paragraphs = textContent.split(/\n\n+/).filter(p => p.trim().length > 0);
        const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 150).length;
        const paragraphRatio = longParagraphs / Math.max(paragraphs.length, 1);
        
        if (paragraphRatio === 0 && paragraphs.length > 0) {
            score += 15;
            checks.push({ status: 'good', text: 'All paragraphs concise' });
        } else if (paragraphRatio < 0.3) {
            score += 10;
            checks.push({ status: 'ok', text: 'Most paragraphs good length' });
        } else {
            score += 3;
            checks.push({ status: 'bad', text: `${longParagraphs} long paragraph${longParagraphs > 1 ? 's' : ''} (>150 words)` });
        }

        const headings = (content.match(/^#{2,6}\s/gm) || []).length;
        const wordsPerHeading = headings > 0 ? wordCount / headings : wordCount;
        
        if (headings > 0 && wordsPerHeading <= 250) {
            score += 15;
            checks.push({ status: 'good', text: 'Excellent use of subheadings' });
        } else if (headings > 0 && wordsPerHeading <= 400) {
            score += 10;
            checks.push({ status: 'ok', text: 'Good subheading distribution' });
        } else if (headings > 0) {
            score += 5;
            checks.push({ status: 'ok', text: 'Add more subheadings (every 250-300 words)' });
        } else if (wordCount > 300) {
            checks.push({ status: 'bad', text: 'Add subheadings to break up text' });
        }

        const transitionWords = [
            'however', 'therefore', 'furthermore', 'moreover', 'nevertheless', 'consequently',
            'additionally', 'meanwhile', 'similarly', 'likewise', 'thus', 'hence', 'also',
            'besides', 'first', 'second', 'third', 'finally', 'for example', 'for instance',
            'in addition', 'as a result', 'on the other hand', 'in contrast', 'in conclusion'
        ];
        
        const transitionCount = transitionWords.filter(word =>
            textContent.toLowerCase().includes(word)
        ).length;
        
        const transitionRatio = transitionCount / Math.max(paragraphs.length, 1);
        
        if (transitionRatio >= 0.3) {
            score += 12;
            checks.push({ status: 'good', text: 'Excellent use of transition words' });
        } else if (transitionRatio >= 0.2) {
            score += 8;
            checks.push({ status: 'ok', text: 'Good use of transition words' });
        } else if (transitionCount > 0) {
            score += 4;
            checks.push({ status: 'ok', text: 'Use more transition words for better flow' });
        } else if (wordCount > 200) {
            checks.push({ status: 'bad', text: 'Add transition words to improve flow' });
        }

        const passiveIndicators = ['was', 'were', 'been', 'being', 'is', 'are', 'am'];
        const passiveCount = passiveIndicators.reduce((count, word) => {
            const matches = textContent.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g'));
            return count + (matches ? matches.length : 0);
        }, 0);
        const passiveRatio = passiveCount / Math.max(sentences.length, 1);
        
        if (passiveRatio < 0.2) {
            score += 15;
            checks.push({ status: 'good', text: 'Excellent - very little passive voice' });
        } else if (passiveRatio < 0.3) {
            score += 12;
            checks.push({ status: 'good', text: 'Minimal passive voice' });
        } else if (passiveRatio < 0.5) {
            score += 6;
            checks.push({ status: 'ok', text: 'Some passive voice - use more active voice' });
        } else {
            checks.push({ status: 'bad', text: 'Too much passive voice - rewrite in active voice' });
        }

        const consecutiveSentences = this._findConsecutiveSentences(sentences);
        if (consecutiveSentences === 0) {
            score += 8;
            checks.push({ status: 'good', text: 'Good sentence variety' });
        } else if (consecutiveSentences < 3) {
            score += 5;
            checks.push({ status: 'ok', text: 'Vary sentence structure more' });
        } else {
            checks.push({ status: 'bad', text: `${consecutiveSentences} consecutive similar sentences` });
        }

        this._readabilityScore = Math.min(score, maxScore);
        this._readabilityAnalysis = checks;
    }

    _findConsecutiveSentences(sentences) {
        let maxConsecutive = 0;
        let currentConsecutive = 1;
        
        for (let i = 1; i < sentences.length; i++) {
            const prevWords = sentences[i - 1].trim().split(/\s+/).length;
            const currWords = sentences[i].trim().split(/\s+/).length;
            
            if (Math.abs(prevWords - currWords) <= 2) {
                currentConsecutive++;
                maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
            } else {
                currentConsecutive = 1;
            }
        }
        
        return maxConsecutive > 2 ? maxConsecutive : 0;
    }

    _runFullAnalysis() {
        this._runSEOAnalysis();
        this._runReadabilityAnalysis();
        this._runGrammarAnalysis();
        this._runSpellCheck();
        this._updateScoreDisplay();
        this._displaySpellingIssues();
    }

    _displaySpellingIssues() {
        const card = this.querySelector('#spellingCard');
        const list = this.querySelector('#spellingIssuesList');
        
        if (!card || !list) return;
        
        if (this._spellingErrors.length === 0) {
            card.style.display = 'none';
            return;
        }
        
        card.style.display = 'block';
        
        list.innerHTML = this._spellingErrors.slice(0, 10).map(error => {
            const suggestionsHTML = error.suggestions.length > 0
                ? `<div class="mdx-spell-suggestions">
                    ${error.suggestions.map(s => 
                        `<button class="mdx-spell-suggestion" data-word="${error.word}" data-replacement="${s}">${s}</button>`
                    ).join('')}
                   </div>`
                : '';
            
            return `
                <div class="mdx-spell-error-item">
                    <div class="mdx-spell-word">${error.word}</div>
                    ${suggestionsHTML}
                </div>
            `;
        }).join('');
        
        list.querySelectorAll('.mdx-spell-suggestion').forEach(btn => {
            btn.addEventListener('click', () => {
                const word = btn.dataset.word;
                const replacement = btn.dataset.replacement;
                this._replaceWord(word, replacement);
            });
        });
    }

    _replaceWord(oldWord, newWord) {
        if (!this._toastEditor) return;
        
        const markdown = this._toastEditor.getMarkdown();
        const regex = new RegExp(`\\b${oldWord}\\b`, 'g');
        const newMarkdown = markdown.replace(regex, newWord);
        
        this._toastEditor.setMarkdown(newMarkdown);
        this._toast('success', `Replaced "${oldWord}" with "${newWord}"`);
        
        setTimeout(() => {
            this._runSpellCheck();
            this._displaySpellingIssues();
        }, 100);
    }

    _populateEditor(data) {
        if (!data) return;
        
        Object.keys(this._meta).forEach(k => { 
            if (data[k] !== undefined) {
                this._meta[k] = data[k];
            }
        });
        
        if (data.structuredData && typeof data.structuredData === 'string') {
            try {
                this._meta.structuredData = JSON.parse(data.structuredData);
                this._schemaType = this._meta.structuredData.type || 'Article';
            } catch(e) {
                this._meta.structuredData = this._freshMeta().structuredData;
            }
        }
        
        this.querySelectorAll('[data-m]').forEach(el => {
            const k = el.dataset.m;
            if (!(k in this._meta)) return;
            
            if (el.type === 'checkbox') {
                el.checked = !!this._meta[k];
            } 
            else if (el.type === 'datetime-local') {
                el.value = this._formatDateForInput(this._meta[k]);
            } 
            else if (el.type === 'number') {
                el.value = this._meta[k] || 0;
            }
            else if (el.tagName === 'SELECT') {
                el.value = this._meta[k] || '';
            }
            else {
                el.value = this._meta[k] || '';
            }
        });
        
        this._currentMarkdown = data.content || '';
        
        if (this._meta.authorImage) {
            const prev = this.querySelector('#authorPrev');
            if (prev) { 
                prev.src = this._meta.authorImage; 
                prev.style.display = 'block'; 
            }
        }
        if (this._meta.featuredImage) {
            const prev = this.querySelector('#featuredPrev');
            if (prev) { 
                prev.src = this._meta.featuredImage; 
                prev.style.display = 'block'; 
            }
        }
        if (this._meta.seoOgImage) {
            const prev = this.querySelector('#ogPrev');
            if (prev) { 
                prev.src = this._meta.seoOgImage; 
                prev.style.display = 'block'; 
            }
        }
        
        this.querySelectorAll('.mdx-schema-type-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.type === this._schemaType);
        });

        if (this._schemaType === 'JobPosting') {
            const job = this._meta.structuredData.jobPosting;
            Object.keys(job).forEach(key => {
                const el = this.querySelector(`#job-${key}`);
                if (el) el.value = job[key] || '';
            });
        }

        if (this._schemaType === 'ImageObject') {
            const img = this._meta.structuredData.imageObject;
            Object.keys(img).forEach(key => {
                const el = this.querySelector(`#img-${key}`);
                if (el) el.value = img[key] || '';
            });
        }

        if (this._schemaType === 'Recipe') {
            const recipe = this._meta.structuredData.recipe;
            Object.keys(recipe).forEach(key => {
                if (key !== 'ingredients' && key !== 'instructions') {
                    const el = this.querySelector(`#recipe-${key}`);
                    if (el) el.value = recipe[key] || '';
                }
            });
        }
        
        this._renderSchemaAuthors();
        this._renderSchemaFAQ();
        this._renderRecipeIngredients();
        this._renderRecipeInstructions();
        this._toggleSchemaFields();
        this._updateSchemaPreview();
    }

    _save(statusButtonClicked) {
        const md = this._cleanMarkdown(this._currentMarkdown || '');
        
        const publishedDate = this._meta.publishedDate ? 
            this._parseDateFromInput(this._meta.publishedDate) : null;
        
        const modifiedDate = this._meta.modifiedDate ? 
            this._parseDateFromInput(this._meta.modifiedDate) : new Date();
        
        const statusToSave = this._meta.status || statusButtonClicked;
        
        const readTimeToSave = this._meta.readTime && this._meta.readTime > 0 ?
            Number(this._meta.readTime) :
            Math.max(1, Math.ceil(md.split(/\s+/).length / 200));
        
        const structuredData = JSON.stringify({
            type: this._schemaType,
            ...this._meta.structuredData,
            schema: this._generateStructuredData()
        });
        
        const newCategories = this._newCategoriesCreated;
        const newTags = this._newTagsCreated;
        
        this._emit('save-post', {
            ...this._meta,
            content: md,
            status: statusToSave,
            publishedDate: publishedDate,
            modifiedDate: modifiedDate,
            readTime: readTimeToSave,
            structuredData: structuredData,
            _id: this._editPost?._id || null,
            newCategories: newCategories,
            newTags: newTags
        });
    }

    _wire() {
        const newPostBtn = this.querySelector('#newPostBtn');
        if (newPostBtn) {
            newPostBtn.addEventListener('click', () => this._openEditor(null));
        }

        this.querySelectorAll('.mdx-tab').forEach(t => {
            t.addEventListener('click', () => this._switchTab(t.dataset.tab));
        });

        this.querySelectorAll('[data-m]').forEach(el => {
            const evt = el.type === 'checkbox' ? 'change' : 'input';
            
            el.addEventListener(evt, () => {
                const key = el.dataset.m;
                
                if (el.type === 'checkbox') {
                    this._meta[key] = el.checked;
                } 
                else if (el.type === 'datetime-local') {
                    this._meta[key] = el.value;
                } 
                else if (el.type === 'number') {
                    this._meta[key] = el.value ? Number(el.value) : 0;
                } 
                else if (el.tagName === 'SELECT') {
                    this._meta[key] = el.value;
                }
                else {
                    this._meta[key] = el.value;
                }
                
                if (['blogTitle', 'focusKeyphrase', 'seoTitle', 'seoDescription'].includes(key)) {
                    this._runSEOAnalysis();
                }

                if (['blogTitle', 'excerpt', 'author', 'authorUrl', 'publishedDate', 'modifiedDate', 'featuredImage'].includes(key)) {
                    this._updateSchemaPreview();
                }
            });
        });
        
        const blogTitleInput = this.querySelector('#blogTitleInput');
        if (blogTitleInput) {
            blogTitleInput.addEventListener('input', (e) => {
                this._meta.blogTitle = e.target.value;
                this._autoSlug(e.target.value);
                this._runSEOAnalysis();
                this._updateSchemaPreview();
            });
        }

        const focusKeyphrase = this.querySelector('#focusKeyphrase');
        if (focusKeyphrase) {
            focusKeyphrase.addEventListener('input', () => {
                this._runSEOAnalysis();
            });
        }

        this._wireImgZone('authorZone', 'authorFile', 'authorPrev', 'authorImage');
        this._wireImgZone('featuredZone', 'featuredFile', 'featuredPrev', 'featuredImage');
        this._wireImgZone('ogZone', 'ogFile', 'ogPrev', 'seoOgImage');
        
        this._wireCategoryDropdown();
        this._wireTagsDropdown();
        this._wireRelatedPosts();
        this._wireSchema();
    }

    _autoSlug(title) {
        const slug = title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        
        this._meta.slug = slug;
        const slugInput = this.querySelector('[data-m="slug"]');
        if (slugInput) {
            slugInput.value = slug;
        }
    }

    _wireImgZone(zoneId, fileId, prevId, metaKey) {
        const zone = this.querySelector(`#${zoneId}`);
        const fileInput = this.querySelector(`#${fileId}`);
        const preview = this.querySelector(`#${prevId}`);
        
        if (!zone || !fileInput || !preview) return;

        zone.addEventListener('click', () => fileInput.click());
        
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.style.borderColor = 'var(--accent)';
            zone.style.background = 'rgba(212, 56, 13, 0.05)';
        });
        
        zone.addEventListener('dragleave', () => {
            zone.style.borderColor = 'var(--border)';
            zone.style.background = 'transparent';
        });
        
        zone.addEventListener('drop', async (e) => {
            e.preventDefault();
            zone.style.borderColor = 'var(--border)';
            zone.style.background = 'transparent';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                await this._handleImageUpload(file, preview, metaKey);
            }
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this._handleImageUpload(file, preview, metaKey);
            }
        });
    }

    async _handleImageUpload(file, preview, metaKey) {
        try {
            const webpData = await this._convertToWebP(file);
            const webpFilename = (file.name || 'image.jpg').replace(/\.[^.]+$/, '.webp');
            
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
            
            this._emit('upload-image', {
                blockId: `${metaKey}-${Date.now()}`,
                fileData: webpData,
                filename: webpFilename,
                metaKey: metaKey
            });
            
        } catch (error) {
            this._toast('error', 'Failed to upload image');
        }
    }

    async _convertToWebP(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.toBlob((blob) => {
                        const reader2 = new FileReader();
                        reader2.onload = () => {
                            resolve(reader2.result.split(',')[1]);
                        };
                        reader2.onerror = reject;
                        reader2.readAsDataURL(blob);
                    }, 'image/webp', 0.9);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    _wireCategoryDropdown() {
        const dropdown = this.querySelector('#categoryDropdown');
        const input = this.querySelector('#categoryInput');
        const list = this.querySelector('#categoryList');
        const createBtn = this.querySelector('#createCategoryBtn');
        
        if (!dropdown || !input || !list || !createBtn) return;

        input.addEventListener('focus', () => {
            dropdown.classList.add('open');
            this._renderCategoryList('');
        });

        input.addEventListener('input', (e) => {
            this._renderCategoryList(e.target.value);
        });

        createBtn.addEventListener('click', () => {
            const name = input.value.trim();
            if (!name) return;
            
            this._emit('create-category', { name });
            input.value = name;
            this._meta.category = name;
            dropdown.classList.remove('open');
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    }

    _renderCategoryList(filter) {
        const list = this.querySelector('#categoryList');
        if (!list) return;

        const filtered = this._allCategories.filter(cat =>
            cat.name.toLowerCase().includes(filter.toLowerCase())
        );

        list.innerHTML = filtered.map(cat => `
            <div class="mdx-dropdown-item" data-value="${cat.name}">
                ${cat.name}
            </div>
        `).join('');

        list.querySelectorAll('.mdx-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const value = item.dataset.value;
                const input = this.querySelector('#categoryInput');
                input.value = value;
                this._meta.category = value;
                this.querySelector('#categoryDropdown').classList.remove('open');
            });
        });
    }

    _wireTagsDropdown() {
        const dropdown = this.querySelector('#tagsDropdown');
        const input = this.querySelector('#tagsInput');
        const list = this.querySelector('#tagsList');
        const createBtn = this.querySelector('#createTagBtn');
        
        if (!dropdown || !input || !list || !createBtn) return;

        input.addEventListener('focus', () => {
            dropdown.classList.add('open');
            this._renderTagsList('');
        });

        input.addEventListener('input', (e) => {
            this._renderTagsList(e.target.value);
        });

        createBtn.addEventListener('click', () => {
            const name = input.value.trim();
            if (!name) return;
            
            this._emit('create-tag', { name });
            
            const current = this._meta.tags ? this._meta.tags.split(',').map(t => t.trim()) : [];
            if (!current.includes(name)) {
                current.push(name);
                this._meta.tags = current.join(', ');
                input.value = this._meta.tags;
            }
            dropdown.classList.remove('open');
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    }

    _renderTagsList(filter) {
        const list = this.querySelector('#tagsList');
        if (!list) return;

        const filtered = this._allTags.filter(tag =>
            tag.name.toLowerCase().includes(filter.toLowerCase())
        );

        list.innerHTML = filtered.map(tag => `
            <div class="mdx-dropdown-item" data-value="${tag.name}">
                ${tag.name}
            </div>
        `).join('');

        list.querySelectorAll('.mdx-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const value = item.dataset.value;
                const input = this.querySelector('#tagsInput');
                const current = this._meta.tags ? this._meta.tags.split(',').map(t => t.trim()) : [];
                
                if (!current.includes(value)) {
                    current.push(value);
                    this._meta.tags = current.join(', ');
                    input.value = this._meta.tags;
                }
                this.querySelector('#tagsDropdown').classList.remove('open');
            });
        });
    }

    _wireRelatedPosts() {
        const searchInput = this.querySelector('#relatedSearch');
        const searchBtn = this.querySelector('#relatedSearchBtn');
        
        if (searchInput && searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput.value.trim();
                if (query) {
                    this._emit('search-posts', { query });
                }
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        this._emit('search-posts', { query });
                    }
                }
            });
        }
    }

    _wireSchema() {
        this.querySelectorAll('.mdx-schema-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._schemaType = btn.dataset.type;
                this.querySelectorAll('.mdx-schema-type-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this._toggleSchemaFields();
                this._updateSchemaPreview();
            });
        });

        const addAuthorBtn = this.querySelector('#addSchemaAuthor');
        if (addAuthorBtn) {
            addAuthorBtn.addEventListener('click', () => {
                this._meta.structuredData.authors.push({ name: '', url: '' });
                this._renderSchemaAuthors();
            });
        }

        const addFaqBtn = this.querySelector('#addSchemaFaq');
        if (addFaqBtn) {
            addFaqBtn.addEventListener('click', () => {
                this._meta.structuredData.faqItems.push({ question: '', answer: '' });
                this._renderSchemaFAQ();
            });
        }

        const addIngredientBtn = this.querySelector('#addRecipeIngredient');
        if (addIngredientBtn) {
            addIngredientBtn.addEventListener('click', () => {
                this._meta.structuredData.recipe.ingredients.push('');
                this._renderRecipeIngredients();
            });
        }

        const addInstructionBtn = this.querySelector('#addRecipeInstruction');
        if (addInstructionBtn) {
            addInstructionBtn.addEventListener('click', () => {
                this._meta.structuredData.recipe.instructions.push('');
                this._renderRecipeInstructions();
            });
        }

        this._wireSchemaFields();
    }

    _wireSchemaFields() {
        const jobFields = ['title', 'description', 'datePosted', 'validThrough', 'employmentType', 
                          'jobLocationType', 'organizationName', 'organizationUrl', 'organizationLogo',
                          'streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 
                          'addressCountry', 'salaryValue', 'salaryCurrency', 'salaryUnit', 
                          'applicantLocationRequirements'];
        
        jobFields.forEach(field => {
            const el = this.querySelector(`#job-${field}`);
            if (el) {
                el.addEventListener('input', (e) => {
                    this._meta.structuredData.jobPosting[field] = e.target.value;
                    this._updateSchemaPreview();
                });
            }
        });

        const imgFields = ['contentUrl', 'license', 'acquireLicensePage', 'creditText', 
                          'creatorName', 'copyrightNotice'];
        
        imgFields.forEach(field => {
            const el = this.querySelector(`#img-${field}`);
            if (el) {
                el.addEventListener('input', (e) => {
                    this._meta.structuredData.imageObject[field] = e.target.value;
                    this._updateSchemaPreview();
                });
            }
        });

        const recipeFields = ['name', 'description', 'cuisine', 'category', 'keywords',
                             'prepTime', 'cookTime', 'totalTime', 'recipeYield', 'calories'];
        
        recipeFields.forEach(field => {
            const el = this.querySelector(`#recipe-${field}`);
            if (el) {
                el.addEventListener('input', (e) => {
                    this._meta.structuredData.recipe[field] = e.target.value;
                    this._updateSchemaPreview();
                });
            }
        });
    }

    _renderSchemaAuthors() {
        const container = this.querySelector('#schemaAuthorsContainer');
        if (!container) return;

        const authors = this._meta.structuredData.authors || [];
        container.innerHTML = authors.map((author, idx) => `
            <div class="mdx-schema-author-row">
                <input type="text" 
                       placeholder="Author name" 
                       value="${author.name || ''}"
                       data-author-idx="${idx}"
                       data-field="name"
                       class="mdx-input">
                <input type="url" 
                       placeholder="Author URL" 
                       value="${author.url || ''}"
                       data-author-idx="${idx}"
                       data-field="url"
                       class="mdx-input">
                <button class="mdx-btn-icon" data-remove-author="${idx}">
                    ${this._icon('trash')}
                </button>
            </div>
        `).join('');

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.authorIdx);
                const field = e.target.dataset.field;
                this._meta.structuredData.authors[idx][field] = e.target.value;
                this._updateSchemaPreview();
            });
        });

        container.querySelectorAll('[data-remove-author]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.removeAuthor);
                this._meta.structuredData.authors.splice(idx, 1);
                this._renderSchemaAuthors();
                this._updateSchemaPreview();
            });
        });
    }

    _renderSchemaFAQ() {
        const container = this.querySelector('#schemaFaqContainer');
        if (!container) return;

        const faqs = this._meta.structuredData.faqItems || [];
        container.innerHTML = faqs.map((faq, idx) => `
            <div class="mdx-schema-faq-row">
                <input type="text" 
                       placeholder="Question" 
                       value="${faq.question || ''}"
                       data-faq-idx="${idx}"
                       data-field="question"
                       class="mdx-input">
                <textarea placeholder="Answer" 
                          data-faq-idx="${idx}"
                          data-field="answer"
                          class="mdx-input"
                          rows="2">${faq.answer || ''}</textarea>
                <button class="mdx-btn-icon" data-remove-faq="${idx}">
                    ${this._icon('trash')}
                </button>
            </div>
        `).join('');

        container.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.faqIdx);
                const field = e.target.dataset.field;
                this._meta.structuredData.faqItems[idx][field] = e.target.value;
                this._updateSchemaPreview();
            });
        });

        container.querySelectorAll('[data-remove-faq]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.removeFaq);
                this._meta.structuredData.faqItems.splice(idx, 1);
                this._renderSchemaFAQ();
                this._updateSchemaPreview();
            });
        });
    }

    _renderRecipeIngredients() {
        const container = this.querySelector('#recipeIngredientsContainer');
        if (!container) return;

        const ingredients = this._meta.structuredData.recipe.ingredients || [];
        container.innerHTML = ingredients.map((ingredient, idx) => `
            <div class="mdx-schema-ingredient-row">
                <input type="text" 
                       placeholder="e.g., 2 cups flour" 
                       value="${ingredient}"
                       data-ingredient-idx="${idx}"
                       class="mdx-input">
                <button class="mdx-btn-icon" data-remove-ingredient="${idx}">
                    ${this._icon('trash')}
                </button>
            </div>
        `).join('');

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.ingredientIdx);
                this._meta.structuredData.recipe.ingredients[idx] = e.target.value;
                this._updateSchemaPreview();
            });
        });

        container.querySelectorAll('[data-remove-ingredient]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.removeIngredient);
                this._meta.structuredData.recipe.ingredients.splice(idx, 1);
                this._renderRecipeIngredients();
                this._updateSchemaPreview();
            });
        });
    }

    _renderRecipeInstructions() {
        const container = this.querySelector('#recipeInstructionsContainer');
        if (!container) return;

        const instructions = this._meta.structuredData.recipe.instructions || [];
        container.innerHTML = instructions.map((instruction, idx) => `
            <div class="mdx-schema-instruction-row">
                <textarea placeholder="Step ${idx + 1}" 
                          data-instruction-idx="${idx}"
                          class="mdx-input"
                          rows="2">${instruction}</textarea>
                <button class="mdx-btn-icon" data-remove-instruction="${idx}">
                    ${this._icon('trash')}
                </button>
            </div>
        `).join('');

        container.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.instructionIdx);
                this._meta.structuredData.recipe.instructions[idx] = e.target.value;
                this._updateSchemaPreview();
            });
        });

        container.querySelectorAll('[data-remove-instruction]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.removeInstruction);
                this._meta.structuredData.recipe.instructions.splice(idx, 1);
                this._renderRecipeInstructions();
                this._updateSchemaPreview();
            });
        });
    }

    _toggleSchemaFields() {
        const fields = {
            article: this.querySelector('#articleSchemaFields'),
            job: this.querySelector('#jobSchemaFields'),
            image: this.querySelector('#imageSchemaFields'),
            recipe: this.querySelector('#recipeSchemaFields')
        };

        Object.values(fields).forEach(el => {
            if (el) el.style.display = 'none';
        });

        const typeMap = {
            'Article': 'article',
            'BlogPosting': 'article',
            'NewsArticle': 'article',
            'JobPosting': 'job',
            'ImageObject': 'image',
            'Recipe': 'recipe'
        };

        const activeField = fields[typeMap[this._schemaType]];
        if (activeField) {
            activeField.style.display = 'block';
        }
    }

    _shellHTML() {
        return `
<div class="mdx-top-bar">
    <div class="mdx-brand">MDX<span>Blocks</span></div>
    <div class="mdx-top-acts" id="topActs"></div>
</div>

<div class="mdx-list-view" id="listView">
    <div class="mdx-list-bar">
        <div>
            <span class="mdx-list-heading">Blog Posts</span>
            <span class="mdx-list-count" id="listCount"></span>
        </div>
        <button class="mdx-btn mdx-btn-accent" id="newPostBtn">${this._icon('plus')} New Post</button>
    </div>
    <div class="mdx-list-scroll" id="listScroll">
        <div class="mdx-state-box" id="listLoading">
            <svg class="mdx-spin-anim" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-opacity=".2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
            </svg>
            <p>Loading posts…</p>
        </div>
        <div id="listContent" style="display:none"></div>
    </div>
</div>

<div class="mdx-editor-view hidden" id="editorView">
    <div class="mdx-tab-bar">
        <button class="mdx-tab active" data-tab="editor">${this._icon('edit')} Editor</button>
        <button class="mdx-tab" data-tab="preview">${this._icon('eye')} Preview</button>
        <button class="mdx-tab" data-tab="markdown">${this._icon('code')} Markdown</button>
        <button class="mdx-tab" data-tab="meta">${this._icon('gear')} Settings</button>
        <button class="mdx-tab" data-tab="related">${this._icon('link')} Related</button>
        <button class="mdx-tab" data-tab="schema">${this._icon('schema')} Schema</button>
        <button class="mdx-tab" data-tab="seo">${this._icon('seo')} SEO</button>
    </div>

    <div class="mdx-editor-body">
        <div class="mdx-editor-main">
            <div class="mdx-blog-title-bar" id="blogTitleBar" style="display:none;">
                <input type="text" 
                       class="mdx-blog-title-input" 
                       id="blogTitleInput" 
                       placeholder="Add your blog title here..."
                       data-m="blogTitle">
            </div>

            <div class="mdx-editor-panel" id="editorPanel">
                <div class="mdx-toast-editor-wrapper" id="toastEditorWrapper"></div>
            </div>

            <div class="mdx-prev-panel hidden" id="prevPanel">
                <div class="mdx-prev-inner" id="prevInner"></div>
            </div>

            <div class="mdx-md-panel hidden" id="mdPanel">
                <textarea class="mdx-md-area" id="mdArea" readonly spellcheck="false"></textarea>
            </div>

            <div class="mdx-meta-panel hidden" id="metaPanel">
                <div class="mdx-meta-inner">${this._metaHTML()}</div>
            </div>

            <div class="mdx-related-panel hidden" id="relatedPanel">
                <div class="mdx-related-inner">${this._relatedHTML()}</div>
            </div>

            <div class="mdx-schema-panel hidden" id="schemaPanel">
                <div class="mdx-schema-inner">${this._schemaHTML()}</div>
            </div>

            <div class="mdx-seo-panel hidden" id="seoPanel">
                <div class="mdx-seo-inner">${this._seoHTML()}</div>
            </div>
        </div>

        <div class="mdx-sidebar" id="seoSidebar">
            <div class="mdx-sidebar-scroll">
                <div class="mdx-keyphrase-section">
                    <label class="mdx-keyphrase-label">Focus Keyphrase</label>
                    <input type="text" 
                           class="mdx-keyphrase-input" 
                           id="focusKeyphrase"
                           placeholder="Enter your focus keyword..."
                           data-m="focusKeyphrase">
                </div>

                <div class="mdx-score-card">
                    <div class="mdx-score-title">${this._icon('grammar')} Grammar & Style</div>
                    <div class="mdx-score-circle">
                        <svg class="mdx-score-svg" width="120" height="120">
                            <circle class="mdx-score-bg" cx="60" cy="60" r="52"/>
                            <circle class="mdx-score-fg" id="grammarScoreCircle" cx="60" cy="60" r="52" 
                                    stroke-dasharray="326.73" stroke-dashoffset="326.73"/>
                        </svg>
                        <div class="mdx-score-text" id="grammarScoreText">0</div>
                    </div>
                    <div class="mdx-score-label" id="grammarScoreLabel">Analyzing...</div>
                    <div id="grammarAnalysisItems"></div>
                </div>

                <div class="mdx-score-card">
                    <div class="mdx-score-title">${this._icon('seo')} SEO Analysis</div>
                    <div class="mdx-score-circle">
                        <svg class="mdx-score-svg" width="120" height="120">
                            <circle class="mdx-score-bg" cx="60" cy="60" r="52"/>
                            <circle class="mdx-score-fg" id="seoScoreCircle" cx="60" cy="60" r="52" 
                                    stroke-dasharray="326.73" stroke-dashoffset="326.73"/>
                        </svg>
                        <div class="mdx-score-text" id="seoScoreText">0</div>
                    </div>
                    <div class="mdx-score-label" id="seoScoreLabel">Needs improvement</div>
                    <div id="seoAnalysisItems"></div>
                </div>

                <div class="mdx-score-card">
                    <div class="mdx-score-title">${this._icon('book')} Readability Analysis</div>
                    <div class="mdx-score-circle">
                        <svg class="mdx-score-svg" width="120" height="120">
                            <circle class="mdx-score-bg" cx="60" cy="60" r="52"/>
                            <circle class="mdx-score-fg" id="readScoreCircle" cx="60" cy="60" r="52"
                                    stroke-dasharray="326.73" stroke-dashoffset="326.73"/>
                        </svg>
                        <div class="mdx-score-text" id="readScoreText">0</div>
                    </div>
                    <div class="mdx-score-label" id="readScoreLabel">Needs improvement</div>
                    <div id="readAnalysisItems"></div>
                </div>

                <div class="mdx-score-card" id="spellingCard" style="display:none;">
                    <div class="mdx-score-title">${this._icon('spell')} Spelling Issues</div>
                    <div id="spellingIssuesList"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="mdx-toasts" id="toastArea"></div>
`;
    }

    _metaHTML() {
        return `
<div class="mdx-form-grid">
    <div class="mdx-form-group">
        <label class="mdx-label">Slug</label>
        <input type="text" class="mdx-input" data-m="slug" placeholder="auto-generated-slug">
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">Excerpt</label>
        <textarea class="mdx-input" data-m="excerpt" rows="3" placeholder="Brief summary..."></textarea>
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">Author</label>
        <input type="text" class="mdx-input" data-m="author" placeholder="Author name">
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">Author URL</label>
        <input type="url" class="mdx-input" data-m="authorUrl" placeholder="https://...">
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">Author Image</label>
        <div class="mdx-img-zone" id="authorZone">
            <input type="file" id="authorFile" accept="image/*" style="display:none">
            <img id="authorPrev" class="mdx-img-prev" style="display:none">
            <div class="mdx-img-placeholder">
                ${this._icon('image')}
                <p>Click or drag image</p>
            </div>
        </div>
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">Featured Image</label>
        <div class="mdx-img-zone" id="featuredZone">
            <input type="file" id="featuredFile" accept="image/*" style="display:none">
            <img id="featuredPrev" class="mdx-img-prev" style="display:none">
            <div class="mdx-img-placeholder">
                ${this._icon('image')}
                <p>Click or drag image</p>
            </div>
        </div>
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">Category</label>
        <div class="mdx-dropdown" id="categoryDropdown">
            <input type="text" class="mdx-input" id="categoryInput" placeholder="Select or create category" data-m="category">
            <div class="mdx-dropdown-list" id="categoryList"></div>
            <button class="mdx-dropdown-create" id="createCategoryBtn">+ Create New</button>
        </div>
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">Tags</label>
        <div class="mdx-dropdown" id="tagsDropdown">
            <input type="text" class="mdx-input" id="tagsInput" placeholder="Select or create tags (comma separated)" data-m="tags">
            <div class="mdx-dropdown-list" id="tagsList"></div>
            <button class="mdx-dropdown-create" id="createTagBtn">+ Create New</button>
        </div>
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">Status</label>
        <select class="mdx-input" data-m="status" id="statusInput">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
        </select>
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">Published Date</label>
        <input type="datetime-local" 
               class="mdx-input" 
               data-m="publishedDate" 
               id="publishedDateInput">
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">Modified Date</label>
        <input type="datetime-local" 
               class="mdx-input" 
               data-m="modifiedDate" 
               id="modifiedDateInput">
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">Read Time (minutes)</label>
        <input type="number" 
               class="mdx-input" 
               data-m="readTime" 
               id="readTimeInput" 
               min="0" 
               placeholder="Auto-calculated">
    </div>

    <div class="mdx-form-group">
        <label class="mdx-checkbox">
            <input type="checkbox" data-m="isFeatured" id="isFeaturedInput">
            <span>Featured Post</span>
        </label>
    </div>
</div>
`;
    }

    _seoHTML() {
        return `
<div class="mdx-form-grid">
    <div class="mdx-form-group">
        <label class="mdx-label">SEO Title</label>
        <input type="text" class="mdx-input" data-m="seoTitle" placeholder="Optimized title (50-60 chars)" maxlength="70">
        <small class="mdx-hint">Appears in search results and browser tabs</small>
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">Meta Description</label>
        <textarea class="mdx-input" data-m="seoDescription" rows="3" placeholder="Compelling description (120-160 chars)" maxlength="170"></textarea>
        <small class="mdx-hint">Appears in search results under the title</small>
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">OG Image (Social Media)</label>
        <div class="mdx-img-zone" id="ogZone">
            <input type="file" id="ogFile" accept="image/*" style="display:none">
            <img id="ogPrev" class="mdx-img-prev" style="display:none">
            <div class="mdx-img-placeholder">
                ${this._icon('image')}
                <p>1200×630px recommended</p>
            </div>
        </div>
    </div>

    <div class="mdx-form-group">
        <label class="mdx-label">Keywords (comma separated)</label>
        <input type="text" class="mdx-input" data-m="seoKeywords" placeholder="keyword1, keyword2, keyword3">
        <small class="mdx-hint">Relevant keywords for search engines</small>
    </div>
</div>
`;
    }

    _relatedHTML() {
        return `
<div class="mdx-related-container">
    <div class="mdx-related-search">
        <input type="text" id="relatedSearch" class="mdx-input" placeholder="Search posts by title...">
        <button class="mdx-btn" id="relatedSearchBtn">${this._icon('search')} Search</button>
    </div>
    <div id="relatedResults"></div>
</div>
`;
    }

    _schemaHTML() {
        return `
<div class="mdx-schema-container">
    <div class="mdx-schema-types">
        <button class="mdx-schema-type-btn active" data-type="Article">Article</button>
        <button class="mdx-schema-type-btn" data-type="BlogPosting">Blog</button>
        <button class="mdx-schema-type-btn" data-type="NewsArticle">News</button>
        <button class="mdx-schema-type-btn" data-type="JobPosting">Job</button>
        <button class="mdx-schema-type-btn" data-type="ImageObject">Image</button>
        <button class="mdx-schema-type-btn" data-type="Recipe">Recipe</button>
    </div>

    <div class="mdx-schema-fields" id="articleSchemaFields">
        <h3>Article Schema</h3>
        <div class="mdx-schema-section">
            <label class="mdx-label">Authors</label>
            <div id="schemaAuthorsContainer"></div>
            <button class="mdx-btn-sm" id="addSchemaAuthor">+ Add Author</button>
        </div>
        <div class="mdx-schema-section">
            <label class="mdx-label">FAQ Items</label>
            <div id="schemaFaqContainer"></div>
            <button class="mdx-btn-sm" id="addSchemaFaq">+ Add FAQ</button>
        </div>
    </div>

    <div class="mdx-schema-fields" id="jobSchemaFields" style="display:none;">
        <h3>Job Posting Schema</h3>
    </div>

    <div class="mdx-schema-fields" id="imageSchemaFields" style="display:none;">
        <h3>Image Schema</h3>
    </div>

    <div class="mdx-schema-fields" id="recipeSchemaFields" style="display:none;">
        <h3>Recipe Schema</h3>
        <div id="recipeIngredientsContainer"></div>
        <button class="mdx-btn-sm" id="addRecipeIngredient">+ Add Ingredient</button>
        <div id="recipeInstructionsContainer"></div>
        <button class="mdx-btn-sm" id="addRecipeInstruction">+ Add Step</button>
    </div>

    <div class="mdx-schema-preview">
        <h4>Schema Preview</h4>
        <pre id="schemaPreviewCode"></pre>
    </div>
</div>
`;
    }

    _updateScoreDisplay() {
        const grammarCircle = this.querySelector('#grammarScoreCircle');
        const grammarText = this.querySelector('#grammarScoreText');
        const grammarLabel = this.querySelector('#grammarScoreLabel');
        const grammarItems = this.querySelector('#grammarAnalysisItems');

        if (grammarCircle && grammarText && grammarLabel) {
            const circumference = 326.73;
            const offset = circumference - (this._grammarScore / 100) * circumference;
            
            grammarCircle.style.strokeDashoffset = offset;
            grammarText.textContent = this._grammarScore;
            
            let color = '#cf1322';
            let label = 'Needs work';
            if (this._grammarScore >= 90) {
                color = '#389e0d';
                label = 'Excellent!';
            } else if (this._grammarScore >= 75) {
                color = '#52c41a';
                label = 'Great!';
            } else if (this._grammarScore >= 60) {
                color = '#fa8c16';
                label = 'Good';
            }
            
            grammarCircle.style.stroke = color;
            grammarText.style.color = color;
            grammarLabel.textContent = label;
            grammarLabel.style.color = color;
        }

        if (grammarItems) {
            grammarItems.innerHTML = this._grammarAnalysis.map(item => `
                <div class="mdx-analysis-item mdx-analysis-${item.status}">
                    <div class="mdx-analysis-icon">${item.status === 'good' ? '✓' : item.status === 'ok' ? '!' : '✕'}</div>
                    <div>${item.text}</div>
                </div>
            `).join('');
        }

        const seoCircle = this.querySelector('#seoScoreCircle');
        const seoText = this.querySelector('#seoScoreText');
        const seoLabel = this.querySelector('#seoScoreLabel');
        const seoItems = this.querySelector('#seoAnalysisItems');

        if (seoCircle && seoText && seoLabel) {
            const circumference = 326.73;
            const offset = circumference - (this._seoScore / 100) * circumference;
            
            seoCircle.style.strokeDashoffset = offset;
            seoText.textContent = this._seoScore;
            
            let color = '#cf1322';
            let label = 'Needs improvement';
            if (this._seoScore >= 80) {
                color = '#389e0d';
                label = 'Great!';
            } else if (this._seoScore >= 60) {
                color = '#fa8c16';
                label = 'Good';
            } else if (this._seoScore >= 40) {
                color = '#fa8c16';
                label = 'OK';
            }
            
            seoCircle.style.stroke = color;
            seoText.style.color = color;
            seoLabel.textContent = label;
            seoLabel.style.color = color;
        }

        if (seoItems) {
            seoItems.innerHTML = this._seoAnalysis.map(item => `
                <div class="mdx-analysis-item mdx-analysis-${item.status}">
                    <div class="mdx-analysis-icon">${item.status === 'good' ? '✓' : item.status === 'ok' ? '!' : '✕'}</div>
                    <div>${item.text}</div>
                </div>
            `).join('');
        }

        const readCircle = this.querySelector('#readScoreCircle');
        const readText = this.querySelector('#readScoreText');
        const readLabel = this.querySelector('#readScoreLabel');
        const readItems = this.querySelector('#readAnalysisItems');

        if (readCircle && readText && readLabel) {
            const circumference = 326.73;
            const offset = circumference - (this._readabilityScore / 100) * circumference;
            
            readCircle.style.strokeDashoffset = offset;
            readText.textContent = this._readabilityScore;
            
            let color = '#cf1322';
            let label = 'Needs improvement';
            if (this._readabilityScore >= 80) {
                color = '#389e0d';
                label = 'Easy to read!';
            } else if (this._readabilityScore >= 60) {
                color = '#fa8c16';
                label = 'Fairly easy';
            } else if (this._readabilityScore >= 40) {
                color = '#fa8c16';
                label = 'OK';
            }
            
            readCircle.style.stroke = color;
            readText.style.color = color;
            readLabel.textContent = label;
            readLabel.style.color = color;
        }

        if (readItems) {
            readItems.innerHTML = this._readabilityAnalysis.map(item => `
                <div class="mdx-analysis-item mdx-analysis-${item.status}">
                    <div class="mdx-analysis-icon">${item.status === 'good' ? '✓' : item.status === 'ok' ? '!' : '✕'}</div>
                    <div>${item.text}</div>
                </div>
            `).join('');
        }
    }

    _switchTab(tabName) {
        this._tab = tabName;
        
        this.querySelectorAll('.mdx-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabName);
        });
        
        const panels = ['editorPanel', 'prevPanel', 'mdPanel', 'metaPanel', 
                       'relatedPanel', 'schemaPanel', 'seoPanel'];
        panels.forEach(p => {
            const panel = this.querySelector(`#${p}`);
            if (panel) panel.classList.add('hidden');
        });
        
        const titleBar = this.querySelector('#blogTitleBar');
        if (titleBar) {
            titleBar.style.display = ['editor', 'preview', 'markdown'].includes(tabName) ? 'block' : 'none';
        }
        
        if (tabName === 'editor') {
            this.querySelector('#editorPanel')?.classList.remove('hidden');
        } else if (tabName === 'preview') {
            this.querySelector('#prevPanel')?.classList.remove('hidden');
            this._buildPreview();
        } else if (tabName === 'markdown') {
            this.querySelector('#mdPanel')?.classList.remove('hidden');
            const mdArea = this.querySelector('#mdArea');
            if (mdArea) mdArea.value = this._currentMarkdown || '';
        } else if (tabName === 'meta') {
            this.querySelector('#metaPanel')?.classList.remove('hidden');
        } else if (tabName === 'related') {
            this.querySelector('#relatedPanel')?.classList.remove('hidden');
        } else if (tabName === 'schema') {
            this.querySelector('#schemaPanel')?.classList.remove('hidden');
        } else if (tabName === 'seo') {
            this.querySelector('#seoPanel')?.classList.remove('hidden');
        }
    }

    _initToastEditor(initialMarkdown = '') {
        if (!window.toastui || !window.toastui.Editor) {
            setTimeout(() => this._initToastEditor(initialMarkdown), 500);
            return;
        }

        const wrapper = this.querySelector('#toastEditorWrapper');
        if (!wrapper) return;

        const editorDiv = document.createElement('div');
        editorDiv.className = 'mdx-toast-editor-container';
        editorDiv.style.height = '100%';
        wrapper.appendChild(editorDiv);

        const self = this;

        try {
            this._toastEditor = new toastui.Editor({
                el: editorDiv,
                height: '100%',
                initialEditType: 'wysiwyg',
                previewStyle: 'vertical',
                initialValue: initialMarkdown,
                usageStatistics: false,
                autofocus: false,
                toolbarItems: [
                    ['heading', 'bold', 'italic', 'strike'],
                    ['hr', 'quote'],
                    ['ul', 'ol', 'task', 'indent', 'outdent'],
                    ['table', 'image', 'link'],
                    ['code', 'codeblock'],
                    [
                        {
                            el: this._createCustomButton('Video', 'video', () => this._insertVideoEmbed()),
                            tooltip: 'Insert YouTube/Vimeo Video'
                        },
                        {
                            el: this._createCustomButton('HTML', 'html', () => this._insertHTMLEmbed()),
                            tooltip: 'Insert HTML Embed'
                        },
                        {
                            el: this._createCustomButton('Edit Alt', 'edit', () => this._editImageAlt()),
                            tooltip: 'Edit Image Alt Text'
                        },
                        {
                            el: this._createCustomButton('Check', 'spell', () => this._runFullAnalysis()),
                            tooltip: 'Run Full Analysis'
                        }
                    ]
                ],
                events: {
                    change: () => {
                        let md = self._toastEditor.getMarkdown();
                        md = self._cleanMarkdown(md);
                        self._currentMarkdown = md;
                        
                        clearTimeout(self._analysisTimeout);
                        self._analysisTimeout = setTimeout(() => {
                            self._runFullAnalysis();
                        }, 1000);
                    }
                },
                hooks: {
                    addImageBlobHook: async (blob, callback) => {
                        try {
                            const webpData = await self._convertToWebP(blob);
                            const webpFilename = (blob.name || 'image.jpg').replace(/\.[^.]+$/, '.webp');
                            
                            self._pendingImageUpload = { callback };
                            
                            self._emit('upload-image', {
                                blockId: 'editor-' + Date.now(),
                                fileData: webpData,
                                filename: webpFilename,
                                optimize: true
                            });
                        } catch (error) {
                            self._toast('error', 'Image upload failed');
                        }
                    }
                }
            });

        } catch (error) {
            this._toast('error', 'Failed to initialize editor: ' + error.message);
        }
    }

    _createCustomButton(label, iconKey, onClick) {
        const btn = document.createElement('button');
        btn.className = 'toastui-editor-toolbar-icons';
        btn.style.margin = '0';
        btn.style.border = 'none';
        btn.style.background = 'none';
        btn.innerHTML = this._icon(iconKey);
        btn.addEventListener('click', onClick);
        return btn;
    }

    _insertVideoEmbed() {
        const url = prompt('Enter YouTube or Vimeo URL:');
        if (!url) return;

        let embedCode = '';
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = this._extractYouTubeId(url);
            if (videoId) {
                embedCode = `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
            }
        } else if (url.includes('vimeo.com')) {
            const videoId = url.split('/').pop().split('?')[0];
            if (videoId) {
                embedCode = `<iframe width="100%" height="400" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allowfullscreen></iframe>`;
            }
        }

        if (embedCode) {
            const pos = this._toastEditor.getSelection()[0];
            this._toastEditor.insertText(`\n${embedCode}\n`);
        }
    }

    _extractYouTubeId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    _insertHTMLEmbed() {
        const html = prompt('Enter HTML code:');
        if (!html) return;

        const pos = this._toastEditor.getSelection()[0];
        this._toastEditor.insertText(`\n${html}\n`);
    }

    _editImageAlt() {
        const md = this._toastEditor.getMarkdown();
        const pos = this._toastEditor.getSelection()[0];
        
        const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        let match;
        let foundImage = null;
        
        while ((match = imgRegex.exec(md)) !== null) {
            if (match.index <= pos && pos <= match.index + match[0].length) {
                foundImage = { full: match[0], alt: match[1], url: match[2], index: match.index };
                break;
            }
        }
        
        if (foundImage) {
            const newAlt = prompt('Edit image alt text:', foundImage.alt);
            if (newAlt !== null) {
                const newImage = `![${newAlt}](${foundImage.url})`;
                const newMd = md.substring(0, foundImage.index) + newImage + md.substring(foundImage.index + foundImage.full.length);
                this._toastEditor.setMarkdown(newMd);
            }
        } else {
            alert('Place cursor on an image to edit its alt text');
        }
    }

    _cleanMarkdown(md) {
        return md.replace(/\r\n/g, '\n').trim();
    }

    _buildPreview() {
        const inner = this.querySelector('#prevInner');
        if (!inner) return;

        const html = this._markdownToHTML(this._currentMarkdown || '');
        inner.innerHTML = html;
    }

    _markdownToHTML(md) {
        let html = md;
        
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%">');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }

    _openEditor(post) {
        this._editPost = post;
        this._meta = post ? { ...this._freshMeta(), ...post } : this._freshMeta();
        this._currentMarkdown = post?.content || '';
        this._newCategoriesCreated = [];
        this._newTagsCreated = [];
        
        this.querySelector('#listView')?.classList.add('hidden');
        this.querySelector('#editorView')?.classList.remove('hidden');
        
        const topActs = this.querySelector('#topActs');
        if (topActs) {
            topActs.innerHTML = `
                <button class="mdx-btn" id="backBtn">${this._icon('back')} Back</button>
                <button class="mdx-btn mdx-btn-accent" id="saveDraftBtn">${this._icon('save')} Save Draft</button>
                <button class="mdx-btn mdx-btn-accent" id="publishBtn">${this._icon('check')} Publish</button>
            `;
            
            this.querySelector('#backBtn')?.addEventListener('click', () => this._closeEditor());
            this.querySelector('#saveDraftBtn')?.addEventListener('click', () => this._save('draft'));
            this.querySelector('#publishBtn')?.addEventListener('click', () => this._save('published'));
        }
        
        if (!this._toastEditor) {
            this._initToastEditor(this._currentMarkdown);
        } else {
            this._toastEditor.setMarkdown(this._currentMarkdown);
        }
        
        if (post) {
            this._populateEditor(post);
        }
        
        this._switchTab('editor');
        this._runFullAnalysis();
    }

    _closeEditor() {
        this.querySelector('#editorView')?.classList.add('hidden');
        this.querySelector('#listView')?.classList.remove('hidden');
        
        const topActs = this.querySelector('#topActs');
        if (topActs) topActs.innerHTML = '';
        
        this._editPost = null;
        this._meta = this._freshMeta();
        this._currentMarkdown = '';
    }

    _onPostList(data) {
        this._posts = data.items || [];
        
        const listLoading = this.querySelector('#listLoading');
        const listContent = this.querySelector('#listContent');
        const listCount = this.querySelector('#listCount');
        
        if (listLoading) listLoading.style.display = 'none';
        if (listContent) listContent.style.display = 'block';
        if (listCount) listCount.textContent = `(${this._posts.length})`;
        
        this._renderPostList();
    }

    _renderPostList() {
        const listContent = this.querySelector('#listContent');
        if (!listContent) return;

        if (this._posts.length === 0) {
            listContent.innerHTML = `
                <div class="mdx-state-box">
                    <p>No posts yet. Create your first post!</p>
                </div>
            `;
            return;
        }

        listContent.innerHTML = this._posts.map(post => `
            <div class="mdx-post-card">
                <div class="mdx-post-header">
                    <h3 class="mdx-post-title">${post.blogTitle || post.title || 'Untitled'}</h3>
                    <div class="mdx-post-meta">
                        <span class="mdx-post-status mdx-post-status-${post.status || 'draft'}">${post.status || 'draft'}</span>
                        <span>${new Date(post.modifiedDate || post._createdDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="mdx-post-excerpt">${post.excerpt || ''}</div>
                <div class="mdx-post-actions">
                    <button class="mdx-btn-sm" data-edit-id="${post._id}">${this._icon('edit')} Edit</button>
                    <button class="mdx-btn-sm mdx-btn-danger" data-delete-id="${post._id}">${this._icon('trash')} Delete</button>
                </div>
            </div>
        `).join('');

        listContent.querySelectorAll('[data-edit-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.editId;
                const post = this._posts.find(p => p._id === postId);
                if (post) {
                    this._emit('load-post-data', { _id: postId });
                }
            });
        });

        listContent.querySelectorAll('[data-delete-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.deleteId;
                if (confirm('Are you sure you want to delete this post?')) {
                    this._emit('delete-post', { _id: postId });
                }
            });
        });
    }

    _onUploadResult(data) {
        if (data.success) {
            const url = data.url;
            const metaKey = data.metaKey;
            
            if (metaKey) {
                this._meta[metaKey] = url;
            }
            
            if (this._pendingImageUpload) {
                this._pendingImageUpload.callback(url);
                this._pendingImageUpload = null;
            }
            
            this._toast('success', 'Image uploaded successfully');
        } else {
            this._toast('error', data.error || 'Upload failed');
        }
    }

    _onSaveResult(data) {
        if (data.success) {
            this._toast('success', 'Post saved successfully');
            this._emit('load-post-list', {});
        } else {
            this._toast('error', data.error || 'Failed to save post');
        }
    }

    _onDeleteResult(data) {
        if (data.success) {
            this._toast('success', 'Post deleted successfully');
            this._emit('load-post-list', {});
        } else {
            this._toast('error', data.error || 'Failed to delete post');
        }
    }

    _onSearchResults(data) {
        const results = this.querySelector('#relatedResults');
        if (!results) return;

        if (!data.items || data.items.length === 0) {
            results.innerHTML = '<p class="mdx-no-results">No posts found</p>';
            return;
        }

        results.innerHTML = data.items.map(post => `
            <div class="mdx-related-item">
                <label>
                    <input type="checkbox" 
                           value="${post._id}" 
                           ${this._meta.relatedPosts.includes(post._id) ? 'checked' : ''}
                           class="mdx-related-checkbox">
                    <span>${post.blogTitle || post.title}</span>
                </label>
            </div>
        `).join('');

        results.querySelectorAll('.mdx-related-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = e.target.value;
                if (e.target.checked) {
                    if (!this._meta.relatedPosts.includes(id)) {
                        this._meta.relatedPosts.push(id);
                    }
                } else {
                    this._meta.relatedPosts = this._meta.relatedPosts.filter(p => p !== id);
                }
            });
        });
    }

    _onCategoriesList(data) {
        this._allCategories = data.items || [];
    }

    _onTagsList(data) {
        this._allTags = data.items || [];
    }

    _onCategoryCreated(data) {
        if (data.success) {
            this._newCategoriesCreated.push(data.name);
            this._allCategories.push({ name: data.name, _id: data._id });
        }
    }

    _onTagCreated(data) {
        if (data.success) {
            this._newTagsCreated.push(data.name);
            this._allTags.push({ name: data.name, _id: data._id });
        }
    }

    _generateStructuredData() {
        const base = {
            "@context": "https://schema.org",
            "@type": this._schemaType
        };

        if (['Article', 'BlogPosting', 'NewsArticle'].includes(this._schemaType)) {
            return {
                ...base,
                headline: this._meta.blogTitle || this._meta.seoTitle,
                description: this._meta.excerpt || this._meta.seoDescription,
                image: this._meta.featuredImage ? [this._meta.featuredImage] : [],
                datePublished: this._meta.publishedDate || new Date().toISOString(),
                dateModified: this._meta.modifiedDate || new Date().toISOString(),
                author: this._meta.structuredData.authors.map(a => ({
                    "@type": "Person",
                    name: a.name,
                    url: a.url
                })),
                mainEntityOfPage: {
                    "@type": "WebPage",
                    "@id": window.location.href
                }
            };
        }

        return base;
    }

    _updateSchemaPreview() {
        const preview = this.querySelector('#schemaPreviewCode');
        if (!preview) return;

        const schema = this._generateStructuredData();
        preview.textContent = JSON.stringify(schema, null, 2);
    }

    _emit(eventName, data) {
        this.dispatchEvent(new CustomEvent(eventName, {
            detail: data,
            bubbles: true,
            composed: true
        }));
    }

    _toast(type, message) {
        const area = this.querySelector('#toastArea');
        if (!area) return;

        const toast = document.createElement('div');
        toast.className = `mdx-toast mdx-toast-${type}`;
        toast.innerHTML = `
            ${type === 'success' ? this._icon('check') : this._icon('alert')}
            <span>${message}</span>
        `;
        
        area.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('mdx-toast-show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('mdx-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    _styles() {
        return `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

mdx-blog-editor {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 720px;
    font-family: 'DM Sans', sans-serif;
    --ink: #111;
    --ink2: #444;
    --ink3: #888;
    --paper: #fafaf8;
    --paper2: #f2f1ee;
    --paper3: #e8e6e1;
    --border: #ddd9d2;
    --accent: #d4380d;
    --accent2: #fa8c16;
    --green: #389e0d;
    --blue: #1677ff;
    --red: #cf1322;
    --orange: #fa8c16;
    --yellow: #faad14;
    --purple: #722ed1;
    --r: 8px;
    --shadow-sm: 0 2px 8px rgba(0,0,0,.08);
    --shadow: 0 8px 32px rgba(0,0,0,.14);
    background: var(--paper);
    color: var(--ink);
}

mdx-blog-editor .mdx-host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 720px;
    background: var(--paper);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--shadow);
}

mdx-blog-editor .mdx-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: #fff;
    border-bottom: 1px solid var(--border);
}

mdx-blog-editor .mdx-brand {
    font-family: 'Playfair Display', serif;
    font-size: 24px;
    font-weight: 900;
    color: var(--accent);
}

mdx-blog-editor .mdx-brand span {
    color: var(--ink);
}

mdx-blog-editor .mdx-top-acts {
    display: flex;
    gap: 12px;
}

mdx-blog-editor .mdx-list-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

mdx-blog-editor .mdx-list-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
    background: #fff;
    border-bottom: 1px solid var(--border);
}

mdx-blog-editor .mdx-list-heading {
    font-size: 20px;
    font-weight: 600;
    color: var(--ink);
}

mdx-blog-editor .mdx-list-count {
    margin-left: 8px;
    font-size: 14px;
    color: var(--ink3);
}

mdx-blog-editor .mdx-list-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}

mdx-blog-editor .mdx-post-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 20px;
    margin-bottom: 16px;
    transition: all 0.2s;
}

mdx-blog-editor .mdx-post-card:hover {
    box-shadow: var(--shadow-sm);
    transform: translateY(-2px);
}

mdx-blog-editor .mdx-post-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

mdx-blog-editor .mdx-post-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--ink);
    margin: 0;
}

mdx-blog-editor .mdx-post-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: var(--ink3);
}

mdx-blog-editor .mdx-post-status {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
}

mdx-blog-editor .mdx-post-status-draft {
    background: var(--paper3);
    color: var(--ink2);
}

mdx-blog-editor .mdx-post-status-published {
    background: rgba(56, 158, 13, 0.1);
    color: var(--green);
}

mdx-blog-editor .mdx-post-status-archived {
    background: rgba(207, 19, 34, 0.1);
    color: var(--red);
}

mdx-blog-editor .mdx-post-excerpt {
    color: var(--ink2);
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 16px;
}

mdx-blog-editor .mdx-post-actions {
    display: flex;
    gap: 8px;
}

mdx-blog-editor .mdx-editor-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

mdx-blog-editor .mdx-tab-bar {
    display: flex;
    background: #fff;
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
}

mdx-blog-editor .mdx-tab {
    padding: 16px 20px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 14px;
    font-weight: 500;
    color: var(--ink3);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    white-space: nowrap;
}

mdx-blog-editor .mdx-tab svg {
    width: 18px;
    height: 18px;
}

mdx-blog-editor .mdx-tab:hover {
    color: var(--accent);
}

mdx-blog-editor .mdx-tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
}

mdx-blog-editor .mdx-editor-body {
    flex: 1;
    display: flex;
    overflow: hidden;
}

mdx-blog-editor .mdx-editor-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fff;
}

mdx-blog-editor .mdx-blog-title-bar {
    padding: 24px 32px;
    border-bottom: 1px solid var(--border);
}

mdx-blog-editor .mdx-blog-title-input {
    width: 100%;
    border: none;
    font-size: 32px;
    font-weight: 600;
    font-family: 'Playfair Display', serif;
    color: var(--ink);
    outline: none;
}

mdx-blog-editor .mdx-blog-title-input::placeholder {
    color: var(--ink3);
}

mdx-blog-editor .mdx-editor-panel,
mdx-blog-editor .mdx-prev-panel,
mdx-blog-editor .mdx-md-panel,
mdx-blog-editor .mdx-meta-panel,
mdx-blog-editor .mdx-related-panel,
mdx-blog-editor .mdx-schema-panel,
mdx-blog-editor .mdx-seo-panel {
    flex: 1;
    overflow-y: auto;
}

mdx-blog-editor .mdx-toast-editor-wrapper {
    height: 100%;
    padding: 16px;
}

mdx-blog-editor .mdx-prev-inner,
mdx-blog-editor .mdx-meta-inner,
mdx-blog-editor .mdx-related-inner,
mdx-blog-editor .mdx-schema-inner,
mdx-blog-editor .mdx-seo-inner {
    padding: 32px;
    max-width: 900px;
    margin: 0 auto;
}

mdx-blog-editor .mdx-md-area {
    width: 100%;
    height: 100%;
    padding: 32px;
    border: none;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
    resize: none;
    outline: none;
    background: var(--paper);
}

mdx-blog-editor .mdx-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

mdx-blog-editor .mdx-form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

mdx-blog-editor .mdx-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--ink2);
}

mdx-blog-editor .mdx-input,
mdx-blog-editor select.mdx-input {
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--r);
    font-size: 14px;
    font-family: inherit;
    color: var(--ink);
    background: #fff;
    transition: all 0.2s;
}

mdx-blog-editor .mdx-input:focus,
mdx-blog-editor select.mdx-input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(212, 56, 13, 0.1);
}

mdx-blog-editor textarea.mdx-input {
    resize: vertical;
    min-height: 80px;
}

mdx-blog-editor .mdx-hint {
    font-size: 12px;
    color: var(--ink3);
}

mdx-blog-editor .mdx-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

mdx-blog-editor .mdx-checkbox input {
    cursor: pointer;
}

mdx-blog-editor .mdx-img-zone {
    position: relative;
    width: 100%;
    height: 200px;
    border: 2px dashed var(--border);
    border-radius: var(--r);
    cursor: pointer;
    transition: all 0.2s;
    overflow: hidden;
}

mdx-blog-editor .mdx-img-zone:hover {
    border-color: var(--accent);
    background: rgba(212, 56, 13, 0.02);
}

mdx-blog-editor .mdx-img-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--ink3);
}

mdx-blog-editor .mdx-img-placeholder svg {
    width: 48px;
    height: 48px;
    margin-bottom: 8px;
}

mdx-blog-editor .mdx-img-prev {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

mdx-blog-editor .mdx-dropdown {
    position: relative;
}

mdx-blog-editor .mdx-dropdown-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 200px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--r);
    margin-top: 4px;
    box-shadow: var(--shadow-sm);
    z-index: 100;
    display: none;
}

mdx-blog-editor .mdx-dropdown.open .mdx-dropdown-list {
    display: block;
}

mdx-blog-editor .mdx-dropdown-item {
    padding: 10px 14px;
    cursor: pointer;
    transition: background 0.15s;
}

mdx-blog-editor .mdx-dropdown-item:hover {
    background: var(--paper2);
}

mdx-blog-editor .mdx-dropdown-create {
    width: 100%;
    padding: 10px 14px;
    border: none;
    border-top: 1px solid var(--border);
    background: var(--paper2);
    color: var(--accent);
    font-weight: 500;
    cursor: pointer;
    text-align: left;
}

mdx-blog-editor .mdx-dropdown-create:hover {
    background: var(--paper3);
}

mdx-blog-editor .mdx-sidebar {
    width: 360px;
    background: var(--paper);
    border-left: 1px solid var(--border);
    overflow-y: auto;
}

mdx-blog-editor .mdx-sidebar-scroll {
    padding: 24px;
}

mdx-blog-editor .mdx-keyphrase-section {
    margin-bottom: 24px;
}

mdx-blog-editor .mdx-keyphrase-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink2);
    margin-bottom: 8px;
}

mdx-blog-editor .mdx-keyphrase-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--r);
    font-size: 14px;
}

mdx-blog-editor .mdx-score-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 20px;
    margin-bottom: 16px;
}

mdx-blog-editor .mdx-score-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

mdx-blog-editor .mdx-score-title svg {
    width: 18px;
    height: 18px;
}

mdx-blog-editor .mdx-score-circle {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 12px;
}

mdx-blog-editor .mdx-score-svg {
    transform: rotate(-90deg);
}

mdx-blog-editor .mdx-score-bg {
    fill: none;
    stroke: var(--paper3);
    stroke-width: 10;
}

mdx-blog-editor .mdx-score-fg {
    fill: none;
    stroke: var(--green);
    stroke-width: 10;
    stroke-linecap: round;
    transition: all 0.5s ease;
}

mdx-blog-editor .mdx-score-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 32px;
    font-weight: 700;
    color: var(--green);
}

mdx-blog-editor .mdx-score-label {
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--green);
    margin-bottom: 16px;
}

mdx-blog-editor .mdx-analysis-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 0;
    font-size: 13px;
    line-height: 1.5;
}

mdx-blog-editor .mdx-analysis-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 600;
}

mdx-blog-editor .mdx-analysis-good .mdx-analysis-icon {
    background: rgba(56, 158, 13, 0.1);
    color: var(--green);
}

mdx-blog-editor .mdx-analysis-ok .mdx-analysis-icon {
    background: rgba(250, 140, 22, 0.1);
    color: var(--orange);
}

mdx-blog-editor .mdx-analysis-bad .mdx-analysis-icon {
    background: rgba(207, 19, 34, 0.1);
    color: var(--red);
}

mdx-blog-editor .mdx-spell-error-item {
    padding: 10px;
    border-bottom: 1px solid var(--border);
}

mdx-blog-editor .mdx-spell-error-item:last-child {
    border-bottom: none;
}

mdx-blog-editor .mdx-spell-word {
    font-weight: 600;
    color: var(--red);
    margin-bottom: 6px;
    font-family: 'JetBrains Mono', monospace;
}

mdx-blog-editor .mdx-spell-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

mdx-blog-editor .mdx-spell-suggestion {
    padding: 4px 10px;
    background: var(--paper2);
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
}

mdx-blog-editor .mdx-spell-suggestion:hover {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
}

mdx-blog-editor .mdx-btn {
    padding: 10px 20px;
    border: 1px solid var(--border);
    border-radius: var(--r);
    background: #fff;
    color: var(--ink);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

mdx-blog-editor .mdx-btn svg {
    width: 16px;
    height: 16px;
}

mdx-blog-editor .mdx-btn:hover {
    background: var(--paper2);
}

mdx-blog-editor .mdx-btn-accent {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
}

mdx-blog-editor .mdx-btn-accent:hover {
    background: #b8300b;
    border-color: #b8300b;
}

mdx-blog-editor .mdx-btn-sm {
    padding: 6px 12px;
    font-size: 13px;
}

mdx-blog-editor .mdx-btn-danger {
    color: var(--red);
}

mdx-blog-editor .mdx-btn-danger:hover {
    background: rgba(207, 19, 34, 0.1);
}

mdx-blog-editor .mdx-btn-icon {
    width: 32px;
    height: 32px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    border-radius: var(--r);
    background: #fff;
    cursor: pointer;
}

mdx-blog-editor .mdx-btn-icon:hover {
    background: var(--paper2);
}

mdx-blog-editor .mdx-btn-icon svg {
    width: 16px;
    height: 16px;
}

mdx-blog-editor .mdx-schema-types {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 24px;
}

mdx-blog-editor .mdx-schema-type-btn {
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: var(--r);
    background: #fff;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}

mdx-blog-editor .mdx-schema-type-btn:hover {
    background: var(--paper2);
}

mdx-blog-editor .mdx-schema-type-btn.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
}

mdx-blog-editor .mdx-schema-section {
    margin-bottom: 24px;
}

mdx-blog-editor .mdx-schema-author-row,
mdx-blog-editor .mdx-schema-faq-row,
mdx-blog-editor .mdx-schema-ingredient-row,
mdx-blog-editor .mdx-schema-instruction-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

mdx-blog-editor .mdx-schema-preview {
    margin-top: 32px;
    padding-top: 32px;
    border-top: 1px solid var(--border);
}

mdx-blog-editor .mdx-schema-preview pre {
    background: var(--paper);
    padding: 16px;
    border-radius: var(--r);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    overflow-x: auto;
}

mdx-blog-editor .mdx-toasts {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

mdx-blog-editor .mdx-toast {
    padding: 16px 20px;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--r);
    box-shadow: var(--shadow);
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    transform: translateX(400px);
    opacity: 0;
    transition: all 0.3s;
}

mdx-blog-editor .mdx-toast-show {
    transform: translateX(0);
    opacity: 1;
}

mdx-blog-editor .mdx-toast svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

mdx-blog-editor .mdx-toast-success {
    border-left: 4px solid var(--green);
}

mdx-blog-editor .mdx-toast-success svg {
    color: var(--green);
}

mdx-blog-editor .mdx-toast-error {
    border-left: 4px solid var(--red);
}

mdx-blog-editor .mdx-toast-error svg {
    color: var(--red);
}

mdx-blog-editor .mdx-state-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    color: var(--ink3);
}

mdx-blog-editor .mdx-spin-anim {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

mdx-blog-editor .hidden {
    display: none !important;
}

mdx-blog-editor .mdx-no-results {
    text-align: center;
    color: var(--ink3);
    padding: 24px;
}

mdx-blog-editor .mdx-related-item {
    padding: 12px;
    border-bottom: 1px solid var(--border);
}

mdx-blog-editor .mdx-related-item:last-child {
    border-bottom: none;
}

mdx-blog-editor .mdx-related-item label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

mdx-blog-editor .mdx-related-search {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
}

mdx-blog-editor .mdx-related-search .mdx-input {
    flex: 1;
}
`;
    }
}

customElements.define('mdx-blog-editor', MdxBlogEditor);
