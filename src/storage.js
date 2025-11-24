/**
 * Storage Manager
 * Handles all localStorage operations with error handling
 */

const Storage = {
    // Storage keys
    KEYS: {
        NOTES: 'assistant_notes',
        DATE_NOTES: 'assistant_date_notes',
        QUICK_ACCESS: 'assistant_quick_access',
        CALENDAR_TYPE: 'assistant_calendar_type',
        SEARCH_ENGINE: 'assistant_search_engine'
    },

    /**
     * Check if localStorage is available
     * @returns {boolean} True if available
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Stored value or default
     */
    get(key, defaultValue = null) {
        if (!this.isAvailable()) {
            console.warn('localStorage is not available');
            return defaultValue;
        }

        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },

    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        if (!this.isAvailable()) {
            console.warn('localStorage is not available');
            return false;
        }

        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                Utils.showToast('فضای ذخیره‌سازی پر شده است', 'error');
            }
            
            return false;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },

    /**
     * Clear all storage
     * @returns {boolean} Success status
     */
    clear() {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },

    // ============================================
    // NOTES OPERATIONS
    // ============================================

    /**
     * Get all notes
     * @returns {Array} Array of notes
     */
    getNotes() {
        return this.get(this.KEYS.NOTES, []);
    },

    /**
     * Save note
     * @param {Object} note - Note object
     * @returns {boolean} Success status
     */
    saveNote(note) {
        const notes = this.getNotes();
        const existingIndex = notes.findIndex(n => n.id === note.id);
        
        if (existingIndex >= 0) {
            notes[existingIndex] = note;
        } else {
            notes.unshift(note);
        }
        
        return this.set(this.KEYS.NOTES, notes);
    },

    /**
     * Delete note
     * @param {string} noteId - Note ID
     * @returns {boolean} Success status
     */
    deleteNote(noteId) {
        const notes = this.getNotes();
        const filtered = notes.filter(n => n.id !== noteId);
        return this.set(this.KEYS.NOTES, filtered);
    },

    // ============================================
    // DATE NOTES OPERATIONS
    // ============================================

    /**
     * Get notes for a specific date
     * @param {string} dateKey - Date key (YYYY-MM-DD)
     * @returns {Array} Array of notes for the date
     */
    getDateNotes(dateKey) {
        const allDateNotes = this.get(this.KEYS.DATE_NOTES, {});
        return allDateNotes[dateKey] || [];
    },

    /**
     * Save note for a specific date
     * @param {string} dateKey - Date key (YYYY-MM-DD)
     * @param {Object} note - Note object
     * @returns {boolean} Success status
     */
    saveDateNote(dateKey, note) {
        const allDateNotes = this.get(this.KEYS.DATE_NOTES, {});
        
        if (!allDateNotes[dateKey]) {
            allDateNotes[dateKey] = [];
        }
        
        const existingIndex = allDateNotes[dateKey].findIndex(n => n.id === note.id);
        
        if (existingIndex >= 0) {
            allDateNotes[dateKey][existingIndex] = note;
        } else {
            allDateNotes[dateKey].unshift(note);
        }
        
        return this.set(this.KEYS.DATE_NOTES, allDateNotes);
    },

    /**
     * Delete date note
     * @param {string} dateKey - Date key (YYYY-MM-DD)
     * @param {string} noteId - Note ID
     * @returns {boolean} Success status
     */
    deleteDateNote(dateKey, noteId) {
        const allDateNotes = this.get(this.KEYS.DATE_NOTES, {});
        
        if (allDateNotes[dateKey]) {
            allDateNotes[dateKey] = allDateNotes[dateKey].filter(n => n.id !== noteId);
            
            // Remove empty date keys
            if (allDateNotes[dateKey].length === 0) {
                delete allDateNotes[dateKey];
            }
        }
        
        return this.set(this.KEYS.DATE_NOTES, allDateNotes);
    },

    /**
     * Get all dates that have notes
     * @returns {Array} Array of date keys
     */
    getDatesWithNotes() {
        const allDateNotes = this.get(this.KEYS.DATE_NOTES, {});
        return Object.keys(allDateNotes).filter(key => allDateNotes[key].length > 0);
    },

    // ============================================
    // QUICK ACCESS OPERATIONS
    // ============================================

    /**
     * Get all quick access items
     * @returns {Array} Array of quick access items
     */
    getQuickAccess() {
        return this.get(this.KEYS.QUICK_ACCESS, []);
    },

    /**
     * Save quick access item
     * @param {Object} item - Quick access item
     * @returns {boolean} Success status
     */
    saveQuickAccessItem(item) {
        const items = this.getQuickAccess();
        const existingIndex = items.findIndex(i => i.id === item.id);
        
        if (existingIndex >= 0) {
            items[existingIndex] = item;
        } else {
            items.push(item);
        }
        
        return this.set(this.KEYS.QUICK_ACCESS, items);
    },

    /**
     * Delete quick access item
     * @param {string} itemId - Item ID
     * @returns {boolean} Success status
     */
    deleteQuickAccessItem(itemId) {
        const items = this.getQuickAccess();
        const filtered = items.filter(i => i.id !== itemId);
        return this.set(this.KEYS.QUICK_ACCESS, filtered);
    },

    // ============================================
    // SETTINGS OPERATIONS
    // ============================================

    /**
     * Get calendar type preference
     * @returns {string} Calendar type (gregorian or jalali)
     */
    getCalendarType() {
        return this.get(this.KEYS.CALENDAR_TYPE, 'gregorian');
    },

    /**
     * Set calendar type preference
     * @param {string} type - Calendar type
     * @returns {boolean} Success status
     */
    setCalendarType(type) {
        return this.set(this.KEYS.CALENDAR_TYPE, type);
    },

    /**
     * Get search engine preference
     * @returns {string} Search engine name
     */
    getSearchEngine() {
        return this.get(this.KEYS.SEARCH_ENGINE, 'google');
    },

    /**
     * Set search engine preference
     * @param {string} engine - Search engine name
     * @returns {boolean} Success status
     */
    setSearchEngine(engine) {
        return this.set(this.KEYS.SEARCH_ENGINE, engine);
    },

    /**
     * Export all data
     * @returns {Object} All stored data
     */
    exportData() {
        return {
            notes: this.getNotes(),
            dateNotes: this.get(this.KEYS.DATE_NOTES, {}),
            quickAccess: this.getQuickAccess(),
            calendarType: this.getCalendarType(),
            searchEngine: this.getSearchEngine(),
            exportDate: new Date().toISOString()
        };
    },

    /**
     * Import data
     * @param {Object} data - Data to import
     * @returns {boolean} Success status
     */
    importData(data) {
        try {
            if (data.notes) this.set(this.KEYS.NOTES, data.notes);
            if (data.dateNotes) this.set(this.KEYS.DATE_NOTES, data.dateNotes);
            if (data.quickAccess) this.set(this.KEYS.QUICK_ACCESS, data.quickAccess);
            if (data.calendarType) this.setCalendarType(data.calendarType);
            if (data.searchEngine) this.setSearchEngine(data.searchEngine);
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
