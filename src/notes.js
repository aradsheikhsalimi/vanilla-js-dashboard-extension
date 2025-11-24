/**
 * Notes Module
 * Manages general notes and date-specific notes
 */
const Notes = {
    // Configuration
    MAX_NOTE_LENGTH: 500,
    currentEditingId: null,
    currentEditingType: null, // 'general' or 'date'
    currentEditingDate: null,

    /**
     * Initialize Notes module
     */
    init() {
        this.attachEventListeners();
        this.render();
    },

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Add note button (General)
        const addNoteBtn = document.getElementById('addNoteBtn');
        if (addNoteBtn) {
            addNoteBtn.addEventListener('click', () => this.openNoteModal());
        }

        // Note modal close buttons
        const noteModalCloseBtn = document.querySelector('#noteModal .modal-close');
        if (noteModalCloseBtn) {
            noteModalCloseBtn.addEventListener('click', () => this.closeNoteModal());
        }

        const noteCancelBtn = document.getElementById('noteCancelBtn');
        if (noteCancelBtn) {
            noteCancelBtn.addEventListener('click', () => this.closeNoteModal());
        }

        // Note modal backdrop click
        const noteModal = document.getElementById('noteModal');
        if (noteModal) {
            noteModal.addEventListener('click', (e) => {
                if (e.target === noteModal) {
                    this.closeNoteModal();
                }
            });
        }

        // Note form submit
        const noteForm = document.getElementById('noteForm');
        if (noteForm) {
            noteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNote();
            });
        }

        // Character counter
        const noteInput = document.getElementById('noteInput');
        if (noteInput) {
            noteInput.addEventListener('input', () => this.updateCharCounter());
        }

        // Date note modal close buttons
        const dateNoteModalCloseBtn = document.querySelector('#dateNoteModal .modal-close');
        if (dateNoteModalCloseBtn) {
            dateNoteModalCloseBtn.addEventListener('click', () => this.closeDateNoteModal());
        }

        const dateNoteCancelBtn = document.getElementById('dateNoteCancelBtn');
        if (dateNoteCancelBtn) {
            dateNoteCancelBtn.addEventListener('click', () => this.closeDateNoteModal());
        }

        // Date note modal backdrop click
        const dateNoteModal = document.getElementById('dateNoteModal');
        if (dateNoteModal) {
            dateNoteModal.addEventListener('click', (e) => {
                if (e.target === dateNoteModal) {
                    this.closeDateNoteModal();
                }
            });
        }

        // Date note form submit
        const dateNoteForm = document.getElementById('dateNoteForm');
        if (dateNoteForm) {
            dateNoteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDateNote();
            });
        }

        // Date note character counter
        const dateNoteInput = document.getElementById('dateNoteInput');
        if (dateNoteInput) {
            dateNoteInput.addEventListener('input', () => this.updateDateCharCounter());
        }
    },

    /**
     * Open note modal for general notes
     * @param {string} noteId - Optional note ID for editing
     */
    openNoteModal(noteId = null) {
        const modal = document.getElementById('noteModal');
        const form = document.getElementById('noteForm');
        const titleInput = document.getElementById('noteTitleInput');
        const input = document.getElementById('noteInput');
        const modalTitle = document.querySelector('#noteModal .modal-title');

        if (!modal || !form || !titleInput || !input) return;

        // Reset form
        form.reset();
        this.currentEditingId = null;
        this.currentEditingType = 'general';
        this.updateCharCounter();

        if (noteId) {
            // Editing mode
            const notes = Storage.getNotes();
            const note = notes.find(n => n.id === noteId);

            if (note) {
                this.currentEditingId = noteId;
                titleInput.value = note.title || '';
                input.value = note.content || '';
                modalTitle.textContent = 'ویرایش یادداشت';
                this.updateCharCounter();
            }
        } else {
            // Creating mode
            modalTitle.textContent = 'یادداشت جدید';
        }

        // Show modal
        modal.style.display = 'flex';
        input.focus();
    },

    /**
     * Close note modal
     */
    closeNoteModal() {
        const modal = document.getElementById('noteModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentEditingId = null;
        this.currentEditingType = null;
    },

    /**
     * Save general note
     */
    saveNote() {
        const titleInput = document.getElementById('noteTitleInput');
        const input = document.getElementById('noteInput');

        if (!titleInput || !input) return;

        const title = titleInput.value.trim();
        const content = input.value.trim();

        if (!content) {
            Utils.showToast('متن یادداشت نمی‌تواند خالی باشد', 'error');
            return;
        }

        const note = {
            id: this.currentEditingId || Utils.generateId(),
            title: title || 'بدون عنوان',
            content: content,
            createdAt: this.currentEditingId ? 
                Storage.getNotes().find(n => n.id === this.currentEditingId)?.createdAt :
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        Storage.saveNote(note);
        this.closeNoteModal();
        this.render();
        Utils.showToast(this.currentEditingId ? 'یادداشت بروزرسانی شد' : 'یادداشت اضافه شد');
    },

    /**
     * Delete general note
     * @param {string} noteId - Note ID
     */
    deleteNote(noteId) {
        if (confirm('آیا مطمئن هستید؟')) {
            Storage.deleteNote(noteId);
            this.render();
            Utils.showToast('یادداشت حذف شد');
        }
    },

    /**
     * Edit general note
     * @param {string} noteId - Note ID
     */
    editNote(noteId) {
        this.openNoteModal(noteId);
    },

    /**
     * Update character counter for general notes
     */
    updateCharCounter() {
        const input = document.getElementById('noteInput');
        const counter = document.getElementById('noteCharCounter');

        if (!input || !counter) return;

        const length = input.value.length;
        const remaining = this.MAX_NOTE_LENGTH - length;
        counter.textContent = `${remaining} / ${this.MAX_NOTE_LENGTH}`;

        if (length >= this.MAX_NOTE_LENGTH) {
            input.value = input.value.substring(0, this.MAX_NOTE_LENGTH);
            counter.style.color = 'var(--color-danger)';
        } else if (length > this.MAX_NOTE_LENGTH * 0.8) {
            counter.style.color = 'var(--color-warning)';
        } else {
            counter.style.color = 'var(--text-secondary)';
        }
    },

    /**
     * Render general notes
     */
    renderNotes() {
        const container = document.getElementById('notesList');
        if (!container) return;

        const notes = Storage.getNotes();
        container.innerHTML = '';

        if (notes.length === 0) {
            container.innerHTML = '<div class="empty-state">هیچ یادداشتی وجود ندارد</div>';
            return;
        }

        notes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-item';
            noteEl.innerHTML = `
                <div class="note-content">
                    <h4 class="note-title">${Utils.escapeHTML(note.title)}</h4>
                    <p class="note-text">${Utils.escapeHTML(note.content)}</p>
                    <small class="note-date">${new Date(note.updatedAt).toLocaleDateString('fa-IR')}</small>
                </div>
                <div class="note-item-actions">
                    <button class="btn-icon" title="ویرایش" onclick="Notes.editNote('${note.id}')">✏️</button>
                    <button class="btn-icon" title="حذف" onclick="Notes.deleteNote('${note.id}')">🗑️</button>
                </div>
            `;
            container.appendChild(noteEl);
        });
    },

    /**
     * Open date note modal for a specific date
     * @param {Date} date - Date object
     * @param {string} noteId - Optional note ID for editing
     */
    openDateNoteModal(date, noteId = null) {
        const modal = document.getElementById('dateNoteModal');
        const form = document.getElementById('dateNoteForm');
        const dateDisplay = document.getElementById('dateNoteDisplay');
        const titleInput = document.getElementById('dateNoteTitleInput');
        const input = document.getElementById('dateNoteInput');
        const modalTitle = document.querySelector('#dateNoteModal .modal-title');

        if (!modal || !form || !dateDisplay || !titleInput || !input) return;

        // Reset form
        form.reset();
        this.currentEditingId = null;
        this.currentEditingType = 'date';
        this.currentEditingDate = date;
        this.updateDateCharCounter();

        // Display date
        dateDisplay.textContent = date.toLocaleDateString('fa-IR');

        if (noteId) {
            // Editing mode
            const dateKey = Utils.getDateKey(date);
            const dateNotes = Storage.getDateNotes(dateKey);
            const note = dateNotes.find(n => n.id === noteId);

            if (note) {
                this.currentEditingId = noteId;
                titleInput.value = note.title || '';
                input.value = note.content || '';
                modalTitle.textContent = 'ویرایش یادداشت روز';
                this.updateDateCharCounter();
            }
        } else {
            // Creating mode
            modalTitle.textContent = 'یادداشت جدید برای این روز';
        }

        // Show modal
        modal.style.display = 'flex';
        input.focus();
    },

    /**
     * Close date note modal
     */
    closeDateNoteModal() {
        const modal = document.getElementById('dateNoteModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentEditingId = null;
        this.currentEditingType = null;
        this.currentEditingDate = null;
    },

    /**
     * Save date note
     */
    saveDateNote() {
        const titleInput = document.getElementById('dateNoteTitleInput');
        const input = document.getElementById('dateNoteInput');

        if (!titleInput || !input || !this.currentEditingDate) return;

        const title = titleInput.value.trim();
        const content = input.value.trim();

        if (!content) {
            Utils.showToast('متن یادداشت نمی‌تواند خالی باشد', 'error');
            return;
        }

        const dateKey = Utils.getDateKey(this.currentEditingDate);
        const note = {
            id: this.currentEditingId || Utils.generateId(),
            title: title || 'بدون عنوان',
            content: content,
            createdAt: this.currentEditingId ? 
                Storage.getDateNotes(dateKey).find(n => n.id === this.currentEditingId)?.createdAt :
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        Storage.saveDateNote(dateKey, note);
        this.closeDateNoteModal();
        Calendar.render(); // Update calendar to show note indicator
        this.renderDateNotes(dateKey);
        Utils.showToast(this.currentEditingId ? 'یادداشت بروزرسانی شد' : 'یادداشت اضافه شد');
    },

    /**
     * Delete date note
     * @param {string} dateKey - Date key
     * @param {string} noteId - Note ID
     */
    deleteDateNote(dateKey, noteId) {
        if (confirm('آیا مطمئن هستید؟')) {
            Storage.deleteDateNote(dateKey, noteId);
            this.renderDateNotes(dateKey);
            Calendar.render(); // Update calendar
            Utils.showToast('یادداشت حذف شد');
        }
    },

    /**
     * Edit date note
     * @param {string} dateKey - Date key
     * @param {string} noteId - Note ID
     */
    editDateNote(dateKey, noteId) {
        const [year, month, day] = dateKey.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        this.openDateNoteModal(date, noteId);
    },

    /**
     * Update character counter for date notes
     */
    updateDateCharCounter() {
        const input = document.getElementById('dateNoteInput');
        const counter = document.getElementById('dateNoteCharCounter');

        if (!input || !counter) return;

        const length = input.value.length;
        const remaining = this.MAX_NOTE_LENGTH - length;
        counter.textContent = `${remaining} / ${this.MAX_NOTE_LENGTH}`;

        if (length >= this.MAX_NOTE_LENGTH) {
            input.value = input.value.substring(0, this.MAX_NOTE_LENGTH);
            counter.style.color = 'var(--color-danger)';
        } else if (length > this.MAX_NOTE_LENGTH * 0.8) {
            counter.style.color = 'var(--color-warning)';
        } else {
            counter.style.color = 'var(--text-secondary)';
        }
    },

    /**
     * Render date notes for a specific date
     * @param {string} dateKey - Date key (YYYY-MM-DD)
     */
    renderDateNotes(dateKey) {
        const container = document.getElementById('dateNotesList');
        if (!container) return;

        const dateNotes = Storage.getDateNotes(dateKey);
        container.innerHTML = '';

        if (dateNotes.length === 0) {
            container.innerHTML = '<div class="empty-state">هیچ یادداشتی برای این روز وجود ندارد</div>';
            return;
        }

        dateNotes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-item';
            noteEl.innerHTML = `
                <div class="note-content">
                    <h4 class="note-title">${Utils.escapeHTML(note.title)}</h4>
                    <p class="note-text">${Utils.escapeHTML(note.content)}</p>
                    <small class="note-date">${new Date(note.updatedAt).toLocaleDateString('fa-IR')}</small>
                </div>
                <div class="note-item-actions">
                    <button class="btn-icon" title="ویرایش" onclick="Notes.editDateNote('${dateKey}', '${note.id}')">✏️</button>
                    <button class="btn-icon" title="حذف" onclick="Notes.deleteDateNote('${dateKey}', '${note.id}')">🗑️</button>
                </div>
            `;
            container.appendChild(noteEl);
        });
    },

    /**
     * Render all notes sections
     */
    render() {
        this.renderNotes();
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Notes;
}
