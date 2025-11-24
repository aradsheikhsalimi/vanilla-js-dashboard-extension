/**
 * Quick Access Module
 * Manages quick access links/tiles
 */
const QuickAccess = {
    MAX_ITEMS: 12,
    currentEditingId: null,

    /**
     * Initialize Quick Access module
     */
    init() {
        this.attachEventListeners();
        this.render();
    },

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Add quick access button
        const addQaBtn = document.getElementById('addQaBtn');
        if (addQaBtn) {
            addQaBtn.addEventListener('click', () => this.openModal());
        }

        // QA modal close buttons
        const qaModalCloseBtn = document.querySelector('#quickAccessModal .modal-close');
        if (qaModalCloseBtn) {
            qaModalCloseBtn.addEventListener('click', () => this.closeModal());
        }

        const qaCancelBtn = document.getElementById('qaCancelBtn');
        if (qaCancelBtn) {
            qaCancelBtn.addEventListener('click', () => this.closeModal());
        }

        // QA modal backdrop click
        const qaModal = document.getElementById('quickAccessModal');
        if (qaModal) {
            qaModal.addEventListener('click', (e) => {
                if (e.target === qaModal) {
                    this.closeModal();
                }
            });
        }

        // QA form submit
        const qaForm = document.getElementById('quickAccessForm');
        if (qaForm) {
            qaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveItem();
            });
        }
    },

    /**
     * Open quick access modal
     * @param {string} itemId - Optional item ID for editing
     */
    openModal(itemId = null) {
        const modal = document.getElementById('quickAccessModal');
        const form = document.getElementById('quickAccessForm');
        const titleInput = document.getElementById('qaTitle');
        const urlInput = document.getElementById('qaUrl');
        const iconInput = document.getElementById('qaIcon');
        const modalTitle = document.querySelector('#quickAccessModal .modal-title');

        if (!modal || !form || !titleInput || !urlInput || !iconInput) return;

        // Reset form
        form.reset();
        this.currentEditingId = null;

        if (itemId) {
            // Editing mode
            const items = Storage.getQuickAccess();
            const item = items.find(i => i.id === itemId);

            if (item) {
                this.currentEditingId = itemId;
                titleInput.value = item.title || '';
                urlInput.value = item.url || '';
                iconInput.value = item.icon || '';
                modalTitle.textContent = 'ویرایش دسترسی سریع';
            }
        } else {
            // Creating mode
            modalTitle.textContent = 'اضافه کردن دسترسی سریع';
        }

        // Show modal
        modal.style.display = 'flex';
        titleInput.focus();
    },

    /**
     * Close quick access modal
     */
    closeModal() {
        const modal = document.getElementById('quickAccessModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentEditingId = null;
    },

    /**
     * Save quick access item
     */
    saveItem() {
        const titleInput = document.getElementById('qaTitle');
        const urlInput = document.getElementById('qaUrl');
        const iconInput = document.getElementById('qaIcon');

        if (!titleInput || !urlInput || !iconInput) return;

        const title = titleInput.value.trim();
        const url = urlInput.value.trim();
        const icon = iconInput.value.trim();

        if (!title || !url) {
            Utils.showToast('عنوان و آدرس الزامی هستند', 'error');
            return;
        }

        if (!Utils.isValidUrl(url)) {
            Utils.showToast('آدرس معتبر نیست', 'error');
            return;
        }

        // Check max items limit
        const items = Storage.getQuickAccess();
        if (!this.currentEditingId && items.length >= this.MAX_ITEMS) {
            Utils.showToast(`حداکثر ${this.MAX_ITEMS} دسترسی سریع مجاز است`, 'error');
            return;
        }

        const item = {
            id: this.currentEditingId || Utils.generateId(),
            title: title,
            url: url,
            icon: icon || this.getDefaultIcon(url),
            createdAt: this.currentEditingId ? 
                items.find(i => i.id === this.currentEditingId)?.createdAt :
                new Date().toISOString()
        };

        Storage.saveQuickAccessItem(item);
        this.closeModal();
        this.render();
        Utils.showToast(this.currentEditingId ? 'دسترسی بروزرسانی شد' : 'دسترسی اضافه شد');
    },

    /**
     * Delete quick access item
     * @param {string} itemId - Item ID
     */
    deleteItem(itemId) {
        if (confirm('آیا مطمئن هستید؟')) {
            Storage.deleteQuickAccessItem(itemId);
            this.render();
            Utils.showToast('دسترسی حذف شد');
        }
    },

    /**
     * Edit quick access item
     * @param {string} itemId - Item ID
     */
    editItem(itemId) {
        this.openModal(itemId);
    },

    /**
     * Get default icon for URL
     * @param {string} url - URL
     * @returns {string} Icon URL or emoji
     */
    getDefaultIcon(url) {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch {
            return '🔗';
        }
    },

    /**
     * Open quick access link
     * @param {string} url - URL to open
     */
    openLink(url) {
        window.open(url, '_blank');
    },

    /**
     * Render quick access tiles
     */
    render() {
        const container = document.getElementById('quickAccessGrid');
        if (!container) return;

        const items = Storage.getQuickAccess();
        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">هیچ دسترسی سریع وجود ندارد</div>';
            return;
        }

        items.forEach(item => {
            const isEmoji = item.icon && item.icon.length < 10 && !item.icon.includes('/');
            const tileEl = document.createElement('div');
            tileEl.className = 'qa-tile';

            let iconHTML = '';
            if (isEmoji) {
                iconHTML = `<span class="qa-icon-emoji">${item.icon}</span>`;
            } else {
                iconHTML = `<img src="${Utils.escapeHTML(item.icon)}" alt="${Utils.escapeHTML(item.title)}" class="qa-icon" onerror="this.src='🔗'">`;
            }

            tileEl.innerHTML = `
                <a href="${Utils.escapeHTML(item.url)}" target="_blank" class="qa-link" title="${Utils.escapeHTML(item.title)}">
                    ${iconHTML}
                    <span class="qa-title">${Utils.escapeHTML(item.title)}</span>
                </a>
                <div class="qa-tile-actions">
                    <button class="qa-tile-btn" title="ویرایش" onclick="event.preventDefault(); event.stopPropagation(); QuickAccess.editItem('${item.id}')">✏️</button>
                    <button class="qa-tile-btn" title="حذف" onclick="event.preventDefault(); event.stopPropagation(); QuickAccess.deleteItem('${item.id}')">🗑️</button>
                </div>
            `;

            // Prevent navigation when clicking edit/delete
            tileEl.querySelector('.qa-link').addEventListener('click', (e) => {
                if (e.target.closest('.qa-tile-actions')) {
                    e.preventDefault();
                }
            });

            container.appendChild(tileEl);
        });

        // Show current count
        const countEl = document.getElementById('qaCount');
        if (countEl) {
            countEl.textContent = `${items.length}/${this.MAX_ITEMS}`;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuickAccess;
}
