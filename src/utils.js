/**
 * Utility Functions
 * Helper functions used across the application
 */

const Utils = {
    /**
     * Generate unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Format date to Persian locale
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }
        
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return new Intl.DateTimeFormat('fa-IR', options).format(date);
    },

    /**
     * Format date to short Persian format
     * @param {Date} date - Date object
     * @returns {string} Short formatted date
     */
    formatDateShort(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }
        
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        
        return new Intl.DateTimeFormat('fa-IR', options).format(date);
    },

    /**
     * Get date key for storage (YYYY-MM-DD)
     * @param {Date} date - Date object
     * @returns {string} Date key
     */
    getDateKey(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    },

    /**
     * Check if two dates are the same day
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {boolean} True if same day
     */
    isSameDay(date1, date2) {
        if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
            return false;
        }
        
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    },

    /**
     * Check if date is weekend (Friday or Saturday for Persian calendar)
     * @param {Date} date - Date object
     * @returns {boolean} True if weekend
     */
    isWeekend(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return false;
        }
        
        const day = date.getDay();
        return day === 5 || day === 6; // Friday = 5, Saturday = 6
    },

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} str - Input string
     * @returns {string} Sanitized string
     */
    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    /**
     * Escape HTML entities
     * @param {string} str - Input string
     * @returns {string} Escaped string
     */
    escapeHTML(str) {
        const htmlEscapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        };
        
        return String(str).replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
    },

    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit = 300) {
        let inThrottle;
        
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Get favicon URL for a website
     * @param {string} url - Website URL
     * @returns {string} Favicon URL
     */
    getFaviconUrl(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.origin}/favicon.ico`;
        } catch (e) {
            return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="18" font-size="18">🌐</text></svg>';
        }
    },

    /**
     * Validate URL
     * @param {string} str - String to validate
     * @returns {boolean} True if valid URL
     */
    isValidUrl(str) {
        try {
            const url = new URL(str);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    },

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) {
            return text;
        }
        
        return text.substring(0, maxLength).trim() + '...';
    },

    /**
     * Deep clone object
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     */
    deepClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch {
            return obj;
        }
    },

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, info)
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = toast.querySelector('.toast-icon');
        
        if (!toast || !toastMessage) return;
        
        // Set message
        toastMessage.textContent = message;
        
        // Update icon based on type
        let iconSVG = '';
        let borderColor = '';
        
        switch (type) {
            case 'success':
                iconSVG = '<polyline points="20 6 9 17 4 12"></polyline>';
                borderColor = 'var(--color-success)';
                break;
            case 'error':
                iconSVG = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
                borderColor = 'var(--color-error)';
                break;
            case 'info':
                iconSVG = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>';
                borderColor = 'var(--color-info)';
                break;
        }
        
        toastIcon.innerHTML = iconSVG;
        toast.style.borderColor = borderColor;
        
        // Show toast
        toast.classList.add('active');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
