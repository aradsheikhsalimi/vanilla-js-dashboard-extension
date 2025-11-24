/**
 * Dastyar Application - Main Application Logic (IMPROVED)
 * Handles: Search, Quick Access Links, General Notes, Date Notes
 */

class DastyarApp {
    constructor() {
        // State Management
        this.state = {
            notes: [],
            dateNotes: {},
            quickLinks: [],
            settings: {
                calendarType: 'gregorian' // or 'jalali'
            }
        };

        // DOM Elements Cache
        this.elements = {};
        this.missingElements = [];

        // Initialize
        this.init();
    }

    /**
     * Initialize Application
     */
    init() {
        this.cacheElements();
        this.validateElements();
        this.loadFromStorage();
        this.setupEventListeners();
        this.render();
    }

    /**
     * Cache DOM Elements with Error Tracking
     */
    cacheElements() {
        const elementIds = {
            // Search Bar
            searchInput: 'searchInput',
            searchBtn: 'searchBtn',

            // Quick Access
            quickAccessGrid: 'quickAccessGrid',
            addTileBtn: 'addTileBtn',

            // Notes Section
            notesContainer: 'notesContainer',
            addNoteBtn: 'addNoteBtn',
            generalNotesTab: 'generalNotesTab',
            dateNotesTab: 'dateNotesTab',

            // Modals
            linkModal: 'linkModal',
            noteModal: 'noteModal',
            dateNoteModal: 'dateNoteModal',

            // Modal Forms
            linkForm: 'linkForm',
            noteForm: 'noteForm',
            dateNoteForm: 'dateNoteForm'
        };

        for (const [key, id] of Object.entries(elementIds)) {
            const element = document.getElementById(id);
            this.elements[key] = element;

            if (!element) {
                this.missingElements.push(id);
            }
        }

        // Cache close buttons
        this.elements.closeBtns = document.querySelectorAll('.close-modal');
    }

    /**
     * Validate and Report Missing Elements
     */
    validateElements() {
        if (this.missingElements.length > 0) {
            console.warn(
                '⚠️ Missing HTML Elements:',
                this.missingElements.join(', ')
            );
        }
    }

    /**
     * Setup Event Listeners with Safe Checks
     */
    setupEventListeners() {
        // Search Functionality
        if (this.elements.searchBtn) {
            this.elements.searchBtn.addEventListener('click', () => this.handleSearch());
        }
        
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch();
            });
        }

        // Quick Access
        if (this.elements.addTileBtn) {
            this.elements.addTileBtn.addEventListener('click', () => this.showLinkModal());
        }

        // Notes
        if (this.elements.addNoteBtn) {
            this.elements.addNoteBtn.addEventListener('click', () => this.showNoteModal());
        }

        if (this.elements.generalNotesTab) {
            this.elements.generalNotesTab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchNotesTab('general');
            });
        }

        if (this.elements.dateNotesTab) {
            this.elements.dateNotesTab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchNotesTab('date');
            });
        }

        // Modal Forms
        if (this.elements.linkForm) {
            this.elements.linkForm.addEventListener('submit', (e) => this.handleLinkSubmit(e));
        }

        if (this.elements.noteForm) {
            this.elements.noteForm.addEventListener('submit', (e) => this.handleNoteSubmit(e));
        }

        if (this.elements.dateNoteForm) {
            this.elements.dateNoteForm.addEventListener('submit', (e) => this.handleDateNoteSubmit(e));
        }

        // Close Modals
        this.elements.closeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllModals();
        });
    }

    /**
     * Handle Google Search
     */
    handleSearch() {
        const query = this.elements.searchInput?.value.trim();
        if (query) {
            const searchUrl = $`https://www.google.com/search?q=${encodeURIComponent(query)}`;
            window.open(searchUrl, '_blank');
            if (this.elements.searchInput) {
                this.elements.searchInput.value = '';
            }
        }
    }

    /**
     * Quick Access - Show Link Modal (IMPROVED)
     */
    showLinkModal(linkData = null) {
        const modal = this.elements.linkModal;
        const form = this.elements.linkForm;
        
        if (!modal || !form) {
            console.error('Link modal or form not found');
            return;
        }

        // Reset or populate form
        if (linkData) {
            form.linkTitle.value = linkData.title || '';
            form.linkUrl.value = linkData.url || '';
            form.linkIcon.value = linkData.icon || '';
            form.dataset.editId = linkData.id;
        } else {
            form.reset();
            delete form.dataset.editId;
        }

        modal.classList.add('active');
    }

    /**
     * Handle Link Form Submit (IMPROVED - SAFE EVENT DELEGATION)
     */
    handleLinkSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const title = formData.get('linkTitle')?.trim();
        const url = formData.get('linkUrl')?.trim();
        const icon = formData.get('linkIcon')?.trim();

        if (!title || !url) {
            this.showToast('لطفاً تمام فیلدها را پر کنید', 'error');
            return;
        }

        const linkData = {
            id: form.dataset.editId || this.generateId(),
            title: title,
            url: this.normalizeUrl(url),
            icon: icon || this.getFaviconUrl(url) // ✅ IMPROVED: Auto-fetch favicon
        };

        if (form.dataset.editId) {
            // Edit existing link
            const index = this.state.quickLinks.findIndex(l => l.id === linkData.id);
            if (index !== -1) {
                this.state.quickLinks[index] = linkData;
            }
        } else {
            // Add new link
            this.state.quickLinks.push(linkData);
        }

        this.saveToStorage();
        this.renderQuickLinks();
        this.closeAllModals();
        this.showToast('لینک با موفقیت ذخیره شد', 'success');
    }

    /**
     * Delete Quick Access Link with Delegation (IMPROVED)
     */
    deleteLink(linkId) {
        if (confirm('آیا از حذف این لینک اطمینان دارید؟')) {
            this.state.quickLinks = this.state.quickLinks.filter(l => l.id !== linkId);
            this.saveToStorage();
            this.renderQuickLinks();
            this.showToast('لینک حذف شد', 'success');
        }
    }

    /**
     * Notes - Show Note Modal
     */
    showNoteModal(noteData = null) {
        const modal = this.elements.noteModal;
        const form = this.elements.noteForm;
        
        if (!modal || !form) {
            console.error('Note modal or form not found');
            return;
        }

        if (noteData) {
            form.noteTitle.value = noteData.title || '';
            form.noteContent.value = noteData.content || '';
            form.dataset.editId = noteData.id;
        } else {
            form.reset();
            delete form.dataset.editId;
        }

        modal.classList.add('active');
    }

    /**
     * Handle Note Form Submit
     */
    handleNoteSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const title = formData.get('noteTitle')?.trim();
        const content = formData.get('noteContent')?.trim();

        if (!title || !content) {
            this.showToast('لطفاً تمام فیلدها را پر کنید', 'error');
            return;
        }

        const existingNote = this.state.notes.find(n => n.id === form.dataset.editId);

        const noteData = {
            id: form.dataset.editId || this.generateId(),
            title: title,
            content: content,
            createdAt: existingNote?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (form.dataset.editId) {
            const index = this.state.notes.findIndex(n => n.id === noteData.id);
            if (index !== -1) {
                this.state.notes[index] = noteData;
            }
        } else {
            this.state.notes.unshift(noteData);
        }

        this.saveToStorage();
        this.renderNotes();
        this.closeAllModals();
        this.showToast('یادداشت ذخیره شد', 'success');
    }

    /**
     * Delete Note
     */
    deleteNote(noteId) {
        if (confirm('آیا از حذف این یادداشت اطمینان دارید؟')) {
            this.state.notes = this.state.notes.filter(n => n.id !== noteId);
            this.saveToStorage();
            this.renderNotes();
            this.showToast('یادداشت حذف شد', 'success');
        }
    }

    /**
     * Date Notes - Show Modal (IMPROVED - BETTER PARAMETER HANDLING)
     */
    showDateNoteModal(dateKey, noteData = null) {
        const modal = this.elements.dateNoteModal;
        const form = this.elements.dateNoteForm;
        
        if (!modal || !form) {
            console.error('Date note modal or form not found');
            return;
        }

        form.dataset.dateKey = dateKey;

        if (noteData) {
            form.dateNoteTitle.value = noteData.title || '';
            form.dateNoteContent.value = noteData.content || '';
            form.dataset.editId = noteData.id;
        } else {
            form.reset();
            delete form.dataset.editId;
        }

        // Update modal title with date
        const modalTitle = modal.querySelector('.modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = `یادداشت برای ${dateKey}`;
        }

        modal.classList.add('active');
    }

    /**
     * Handle Date Note Form Submit
     */
    handleDateNoteSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const dateKey = form.dataset.dateKey;

        if (!dateKey) {
            this.showToast('تاریخ مشخص نشده است', 'error');
            return;
        }

        const title = formData.get('dateNoteTitle')?.trim();
        const content = formData.get('dateNoteContent')?.trim();

        if (!title || !content) {
            this.showToast('لطفاً تمام فیلدها را پر کنید', 'error');
            return;
        }

        const existingNote = this.getDateNote(dateKey, form.dataset.editId);

        const noteData = {
            id: form.dataset.editId || this.generateId(),
            title: title,
            content: content,
            createdAt: existingNote?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Initialize date notes array if doesn't exist
        if (!this.state.dateNotes[dateKey]) {
            this.state.dateNotes[dateKey] = [];
        }

        if (form.dataset.editId) {
            const index = this.state.dateNotes[dateKey].findIndex(n => n.id === noteData.id);
            if (index !== -1) {
                this.state.dateNotes[dateKey][index] = noteData;
            }
        } else {
            this.state.dateNotes[dateKey].unshift(noteData);
        }

        this.saveToStorage();
        this.closeAllModals();
        this.showToast('یادداشت تاریخ ذخیره شد', 'success');

        // ✅ CRITICAL: Update calendar to show note indicator
        this.notifyCalendarUpdate(dateKey);
    }

    /**
     * Delete Date Note
     */
    deleteDateNote(dateKey, noteId) {
        if (confirm('آیا از حذف این یادداشت اطمینان دارید؟')) {
            if (this.state.dateNotes[dateKey]) {
                this.state.dateNotes[dateKey] = this.state.dateNotes[dateKey].filter(n => n.id !== noteId);
                
                // Remove date key if no notes left
                if (this.state.dateNotes[dateKey].length === 0) {
                    delete this.state.dateNotes[dateKey];
                }
                
                this.saveToStorage();
                this.showToast('یادداشت حذف شد', 'success');

                // ✅ Update calendar
                this.notifyCalendarUpdate(dateKey);
            }
        }
    }

    /**
     * Get Date Note by ID
     */
    getDateNote(dateKey, noteId) {
        if (!noteId) return null;
        return this.state.dateNotes[dateKey]?.find(n => n.id === noteId);
    }

    /**
     * Check if date has notes
     */
    hasNotesForDate(dateKey) {
        return this.state.dateNotes[dateKey] && this.state.dateNotes[dateKey].length > 0;
    }

    /**
     * Get notes for specific date
     */
    getNotesForDate(dateKey) {
        return this.state.dateNotes[dateKey] || [];
    }

    /**
     * ✅ NEW: Notify Calendar About Updates
     * This allows the calendar to update UI without tight coupling
     */
    notifyCalendarUpdate(dateKey) {
        // Emit a custom event so calendar can listen
        const event = new CustomEvent('dateNotesChanged', {
            detail: { dateKey: dateKey }
        });
        document.dispatchEvent(event);

        // Also support direct method call if calendar exists
        if (window.calendar && typeof window.calendar.updateDateIndicators === 'function') {
            window.calendar.updateDateIndicators();
        }
    }

    /**
     * Switch Notes Tab (IMPROVED)
     */
    switchNotesTab(tab) {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(t => t.classList.remove('active'));

        if (tab === 'general') {
            if (this.elements.generalNotesTab) {
                this.elements.generalNotesTab.classList.add('active');
            }
            this.renderNotes();
        } else if (tab === 'date') {
            if (this.elements.dateNotesTab) {
                this.elements.dateNotesTab.classList.add('active');
            }
            this.renderDateNotes();
        }
    }

    /**
     * Render Quick Access Links (IMPROVED - EVENT DELEGATION)
     */
    renderQuickLinks() {
        if (!this.elements.quickAccessGrid) return;

        const linksHtml = this.state.quickLinks.map(link => {
            const iconHtml = link.icon.startsWith('http') 
                ? `<img src="${this.sanitizeHtml(link.icon)}" alt="icon">`
                : `<span>${this.sanitizeHtml(link.icon)}</span>`;

            return `
                <div class="quick-access-tile" data-id="${this.sanitizeHtml(link.id)}">
                    <a href="${this.sanitizeHtml(link.url)}" target="_blank" class="tile-link">
                        <div class="quick-access-icon">${iconHtml}</div>
                        <div class="quick-access-title">${this.sanitizeHtml(link.title)}</div>
                    </a>
                    <div class="tile-actions">
                        <button class="tile-edit-btn" data-action="edit" data-id="${this.sanitizeHtml(link.id)}" title="ویرایش">
                            ✏️
                        </button>
                        <button class="tile-delete-btn" data-action="delete" data-id="${this.sanitizeHtml(link.id)}" title="حذف">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        const addTileHtml = `
            <div class="quick-access-tile add-tile-btn" id="addTileBtn">
                <div class="add-icon">+</div>
                <div class="quick-access-title">افزودن لینک</div>
            </div>
        `;

        this.elements.quickAccessGrid.innerHTML = linksHtml + addTileHtml;

        // ✅ Event Delegation (Safe approach)
        this.elements.quickAccessGrid.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.tile-edit-btn');
            const deleteBtn = e.target.closest('.tile-delete-btn');
            const addBtn = e.target.closest('#addTileBtn');

            if (editBtn) {
                const linkId = editBtn.dataset.id;
                const link = this.state.quickLinks.find(l => l.id === linkId);
                if (link) this.showLinkModal(link);
            } else if (deleteBtn) {
                const linkId = deleteBtn.dataset.id;
                this.deleteLink(linkId);
            } else if (addBtn) {
                this.showLinkModal();
            }
        });

        // Re-attach add button listener
        const newAddBtn = document.getElementById('addTileBtn');
        if (newAddBtn) {
            newAddBtn.addEventListener('click', () => this.showLinkModal());
        }
    }

    /**
     * Render General Notes
     */
    renderNotes() {
        if (!this.elements.notesContainer) return;

        if (this.state.notes.length === 0) {
            this.elements.notesContainer.innerHTML = `
                <div class="empty-state">
                    <p>هیچ یادداشتی وجود ندارد</p>
                </div>
            `;
            return;
        }

        const notesHtml = this.state.notes.map(note => `
            <div class="note-item" data-id="${this.sanitizeHtml(note.id)}">
                <h4 class="note-title">${this.sanitizeHtml(note.title)}</h4>
                <p class="note-content">${this.sanitizeHtml(note.content)}</p>
                <div class="note-footer">
                    <span class="note-date">${this.formatDateTime(note.updatedAt)}</span>
                    <div class="note-actions">
                        <button class="note-edit-btn" data-action="edit" data-id="${this.sanitizeHtml(note.id)}">
                            ویرایش
                        </button>
                        <button class="note-delete-btn" data-action="delete" data-id="${this.sanitizeHtml(note.id)}">
                            حذف
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        this.elements.notesContainer.innerHTML = notesHtml;

        // ✅ Event Delegation
        this.elements.notesContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.note-edit-btn');
            const deleteBtn = e.target.closest('.note-delete-btn');

            if (editBtn) {
                const noteId = editBtn.dataset.id;
                const note = this.state.notes.find(n => n.id === noteId);
                if (note) this.showNoteModal(note);
            } else if (deleteBtn) {
                const noteId = deleteBtn.dataset.id;
                this.deleteNote(noteId);
            }
        });
    }

    /**
     * Render Date Notes Overview
     */
    renderDateNotes() {
        if (!this.elements.notesContainer) return;

        const dates = Object.keys(this.state.dateNotes).sort();
        
        if (dates.length === 0) {
            this.elements.notesContainer.innerHTML = `
                <div class="empty-state">
                    <p>هیچ یادداشت تاریخی وجود ندارد</p>
                    <p class="empty-state-hint">روی تاریخ در تقویم کلیک کنید</p>
                </div>
            `;
            return;
        }

        const dateNotesHtml = dates.map(dateKey => {
            const notes = this.state.dateNotes[dateKey];
            return `
                <div class="date-notes-group">
                    <h3 class="date-notes-header">${dateKey}</h3>
                    <div class="notes-list">
                        ${notes.map(note => `
                            <div class="note-item" data-id="${this.sanitizeHtml(note.id)}" data-date="${this.sanitizeHtml(dateKey)}">
                                <h4 class="note-title">${this.sanitizeHtml(note.title)}</h4>
                                <p class="note-content">${this.sanitizeHtml(note.content)}</p>
                                <div class="note-footer">
                                    <span class="note-date">${this.formatDateTime(note.updatedAt)}</span>
                                    <div class="note-actions">
                                        <button class="note-edit-btn" data-action="edit" data-id="${this.sanitizeHtml(note.id)}" data-date="${this.sanitizeHtml(dateKey)}">
                                            ویرایش
                                        </button>
                                        <button class="note-delete-btn" data-action="delete" data-id="${this.sanitizeHtml(note.id)}" data-date="${this.sanitizeHtml(dateKey)}">
                                            حذف
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        this.elements.notesContainer.innerHTML = dateNotesHtml;

        // ✅ Event Delegation for Date Notes
        this.elements.notesContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.note-edit-btn');
            const deleteBtn = e.target.closest('.note-delete-btn');

            if (editBtn) {
                const noteId = editBtn.dataset.id;
                const dateKey = editBtn.dataset.date;
                const note = this.getDateNote(dateKey, noteId);
                if (note) this.showDateNoteModal(dateKey, note);
            } else if (deleteBtn) {
                const noteId = deleteBtn.dataset.id;
                const dateKey = deleteBtn.dataset.date;
                this.deleteDateNote(dateKey, noteId);
            }
        });
    }

    /**
     * Render All Components
     */
    render() {
        this.renderQuickLinks();
        this.renderNotes();
    }

    /**
     * Close All Modals
     */
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * Show Toast Notification
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Storage - Save to LocalStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('dastyar_data', JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving to storage:', error);
            this.showToast('خطا در ذخیره‌سازی', 'error');
        }
    }

    /**
     * Storage - Load from LocalStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('dastyar_data');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = {
                    notes: parsed.notes || [],
                    dateNotes: parsed.dateNotes || {},
                    quickLinks: parsed.quickLinks || [],
                    settings: { ...this.state.settings, ...parsed.settings }
                };
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
            this.showToast('خطا در بارگذاری داده‌ها', 'error');
        }
    }

    /**
     * Utility - Generate Unique ID
     */
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Utility - Normalize URL
     */
    normalizeUrl(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return 'https://' + url;
        }
        return url;
    }

    /**
     * ✅ NEW: Get Favicon URL
     * Uses Google's favicon service as fallback
     */
    getFaviconUrl(url) {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch {
            return '🔗'; // Fallback emoji
        }
    }

    /**
     * Utility - Sanitize HTML (XSS Protection)
     */
    sanitizeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    /**
     * ✅ IMPROVED: Escape JSON for Safe HTML Attributes
     */
    escapeJson(obj) {
        return JSON.stringify(obj)
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Utility - Format DateTime in Persian
     */
    formatDateTime(isoString) {
        try {
            const date = new Date(isoString);
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch {
            return 'تاریخ نامعتبر';
        }
    }
}

// Initialize App
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DastyarApp();
    console.log('✅ Dastyar App Initialized Successfully');
});
