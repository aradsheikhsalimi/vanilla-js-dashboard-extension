/**
 * Search Module
 * Manages search functionality with multiple search engines
 */
const Search = {
    engines: {
        google: {
            name: 'Google',
            url: 'https://www.google.com/search?q=',
            icon: '🔍'
        },
        bing: {
            name: 'Bing',
            url: 'https://www.bing.com/search?q=',
            icon: '🅱️'
        },
        duckduckgo: {
            name: 'DuckDuckGo',
            url: 'https://duckduckgo.com/?q=',
            icon: '🦆'
        },
        yahoo: {
            name: 'Yahoo',
            url: 'https://search.yahoo.com/search?p=',
            icon: 'Ⓨ'
        }
    },

    currentEngine: 'google',

    /**
     * Initialize Search module
     */
    init() {
        this.currentEngine = Storage.getSearchEngine();
        this.attachEventListeners();
        this.updateActiveEngine();
    },

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Search form submit
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.performSearch();
            });
        }

        // Search engine buttons
        document.querySelectorAll('.engine-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const engine = e.target.dataset.engine;
                if (engine) {
                    this.setEngine(engine);
                }
            });
        });

        // Voice search button (placeholder)
        const voiceBtn = document.getElementById('voiceSearchBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.voiceSearch());
        }
    },

    /**
     * Perform search
     */
    performSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const query = searchInput.value.trim();
        if (!query) {
            Utils.showToast('لطفاً عبارت جستجو را وارد کنید', 'warning');
            return;
        }

        const engine = this.engines[this.currentEngine];
        const searchUrl = engine.url + encodeURIComponent(query);

        window.open(searchUrl, '_blank');
        searchInput.value = '';
    },

    /**
     * Set search engine
     * @param {string} engineKey - Engine key (google, bing, etc.)
     */
    setEngine(engineKey) {
        if (!this.engines[engineKey]) return;

        this.currentEngine = engineKey;
        Storage.setSearchEngine(engineKey);
        this.updateActiveEngine();
        Utils.showToast(`موتور جستجو: ${this.engines[engineKey].name}`);
    },

    /**
     * Update active engine button
     */
    updateActiveEngine() {
        document.querySelectorAll('.engine-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.engine === this.currentEngine);
        });
    },

    /**
     * Voice search (placeholder)
     */
    voiceSearch() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.lang = 'fa-IR';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = transcript;
                    this.performSearch();
                }
            };

            recognition.onerror = (event) => {
                Utils.showToast('خطا در تشخیص صدا', 'error');
            };

            recognition.start();
            Utils.showToast('در حال گوش دادن...');
        } else {
            Utils.showToast('مرورگر شما از تشخیص صدا پشتیبانی نمی‌کند', 'error');
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Search;
}
