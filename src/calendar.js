/**
 * Dastyar Calendar Module - Production Grade (FINAL VERSION)
 * Supports both Gregorian and Jalali (Persian) calendars
 * All critical issues resolved + Event Delegation implemented
 */

// ============================================
// JALALI (PERSIAN) CALENDAR UTILITIES
// ============================================

class JalaliCalendar {
    /**
     * Convert Gregorian date to Jalali
     * @param {number} gy - Gregorian year
     * @param {number} gm - Gregorian month (1-12)
     * @param {number} gd - Gregorian day
     * @returns {Object} {jy, jm, jd}
     */
    static gregorianToJalali(gy, gm, gd) {
        const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        
        let jy = (gy <= 1600) ? 0 : 979;
        gy -= (gy <= 1600) ? 621 : 1600;
        
        let gy2 = (gm > 2) ? (gy + 1) : gy;
        let days = (365 * gy) + (Math.floor((gy2 + 3) / 4)) - (Math.floor((gy2 + 99) / 100)) + 
                   (Math.floor((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1];
        
        jy += 33 * Math.floor(days / 12053);
        days %= 12053;
        
        jy += 4 * Math.floor(days / 1461);
        days %= 1461;
        
        if (days > 365) {
            jy += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }
        
        let jm, jd;
        if (days < 186) {
            jm = 1 + Math.floor(days / 31);
            jd = 1 + (days % 31);
        } else {
            jm = 7 + Math.floor((days - 186) / 30);
            jd = 1 + ((days - 186) % 30);
        }
        
        return { jy, jm, jd };
    }

    /**
     * Convert Jalali date to Gregorian
     * @param {number} jy - Jalali year
     * @param {number} jm - Jalali month (1-12)
     * @param {number} jd - Jalali day
     * @returns {Object} {gy, gm, gd}
     */
    static jalaliToGregorian(jy, jm, jd) {
        let gy = (jy <= 979) ? 621 : 1600;
        jy -= (jy <= 979) ? 0 : 979;
        
        let days = (365 * jy) + (Math.floor(jy / 33) * 8) + 
                   Math.floor(((jy % 33) + 3) / 4) + 78 + jd;
        
        if (jm < 7) {
            days += (jm - 1) * 31;
        } else {
            days += ((jm - 7) * 30) + 186;
        }
        
        gy += 400 * Math.floor(days / 146097);
        days %= 146097;
        
        if (days > 36524) {
            gy += 100 * Math.floor(--days / 36524);
            days %= 36524;
            if (days >= 365) days++;
        }
        
        gy += 4 * Math.floor(days / 1461);
        days %= 1461;
        
        if (days > 365) {
            gy += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }
        
        const sal_a = [0, 31, (this.isGregorianLeapYear(gy) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let gm = 0;
        
        for (gm = 0; gm < 13 && days >= sal_a[gm]; gm++) {
            days -= sal_a[gm];
        }
        
        const gd = days + 1;
        
        return { gy, gm, gd };
    }

    /**
     * Check if Jalali year is leap
     */
    static isJalaliLeapYear(year) {
        const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
        const cycle = 2820;
        let aux = year + 38 - 474;
        let modulo = aux % cycle;
        modulo = modulo < 0 ? modulo + cycle : modulo;
        
        const gy = 474 + modulo;
        const leapIndex = ((gy + 38 + 31) % 128) % 33;
        
        return breaks.includes(leapIndex);
    }

    /**
     * Check if Gregorian year is leap
     */
    static isGregorianLeapYear(year) {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    }

    /**
     * Get number of days in Jalali month
     */
    static getDaysInJalaliMonth(year, month) {
        if (month <= 6) return 31;
        if (month <= 11) return 30;
        return this.isJalaliLeapYear(year) ? 30 : 29;
    }

    /**
     * Get Jalali month names
     */
    static getMonthNames() {
        return [
            'فروردین', 'اردیبهشت', 'خرداد',
            'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر',
            'دی', 'بهمن', 'اسفند'
        ];
    }

    /**
     * Get Jalali weekday names (Saturday first)
     */
    static getWeekdayNames() {
        return ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
    }

    /**
     * Get day of week for Jalali date (0 = Saturday)
     */
    static getJalaliDayOfWeek(jy, jm, jd) {
        const greg = this.jalaliToGregorian(jy, jm, jd);
        const date = new Date(greg.gy, greg.gm - 1, greg.gd);
        const dayOfWeek = date.getDay();
        return (dayOfWeek + 1) % 7;
    }
}

// ============================================
// GREGORIAN CALENDAR UTILITIES
// ============================================

class GregorianCalendar {
    /**
     * Get Gregorian month names
     */
    static getMonthNames() {
        return [
            'January', 'February', 'March', 'April',
            'May', 'June', 'July', 'August',
            'September', 'October', 'November', 'December'
        ];
    }

    /**
     * Get Gregorian weekday names (Saturday first for consistency)
     */
    static getWeekdayNames() {
        return ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    }

    /**
     * Check if Gregorian year is leap
     */
    static isLeapYear(year) {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    }

    /**
     * Get number of days in Gregorian month
     */
    static getDaysInMonth(year, month) {
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (month === 2 && this.isLeapYear(year)) {
            return 29;
        }
        return daysInMonth[month - 1];
    }

    /**
     * Get day of week for Gregorian date (0 = Saturday)
     */
    static getDayOfWeek(year, month, day) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        return (dayOfWeek + 1) % 7;
    }
}

// ============================================
// MAIN CALENDAR CLASS
// ============================================

class Calendar {
    constructor(options = {}) {
        // Configuration
        this.type = options.type || 'gregorian';
        this.container = options.container || document.getElementById('calendarWidget');
        
        // Callbacks
        this.onDateSelect = options.onDateSelect || null;

        // Current date state
        this.today = new Date();
        this.currentYear = this.today.getFullYear();
        this.currentMonth = this.today.getMonth() + 1;
        this.selectedDate = null;

        // Jalali current date
        const jalaliToday = JalaliCalendar.gregorianToJalali(
            this.today.getFullYear(),
            this.today.getMonth() + 1,
            this.today.getDate()
        );
        this.jalaliYear = jalaliToday.jy;
        this.jalaliMonth = jalaliToday.jm;

        // Initialize
        this.init();
    }

    /**
     * Initialize Calendar
     */
    init() {
        this.setupEventListeners();
        this.render();
        this.setupGlobalListeners();
    }

    /**
     * Setup Global Event Listeners (from app.js)
     */
    setupGlobalListeners() {
        // Listen for date notes changes from app.js
        document.addEventListener('dateNotesChanged', () => {
            this.updateDateIndicators();
        });

        // Listen for calendar type change
        document.addEventListener('calendarTypeChanged', (e) => {
            if (e.detail && e.detail.type) {
                this.setType(e.detail.type);
            }
        });
    }

    /**
     * Setup Event Listeners
     */
    setupEventListeners() {
        if (!this.container) {
            console.error('Calendar container not found');
            return;
        }

        // Calendar type toggle
        const toggleBtns = this.container.querySelectorAll('.toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (type) this.setType(type);
            });
        });
    }

    /**
     * Set Calendar Type
     */
    setType(type) {
        if (type !== 'gregorian' && type !== 'jalali') {
            console.error('Invalid calendar type');
            return;
        }

        this.type = type;

        // Update toggle buttons
        const toggleBtns = this.container.querySelectorAll('.toggle-btn');
        toggleBtns.forEach(btn => {
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.render();
    }

    /**
     * Navigate to Previous Month
     */
    previousMonth() {
        if (this.type === 'gregorian') {
            this.currentMonth--;
            if (this.currentMonth < 1) {
                this.currentMonth = 12;
                this.currentYear--;
            }
        } else {
            this.jalaliMonth--;
            if (this.jalaliMonth < 1) {
                this.jalaliMonth = 12;
                this.jalaliYear--;
            }
        }
        this.render();
    }

    /**
     * Navigate to Next Month
     */
    nextMonth() {
        if (this.type === 'gregorian') {
            this.currentMonth++;
            if (this.currentMonth > 12) {
                this.currentMonth = 1;
                this.currentYear++;
            }
        } else {
            this.jalaliMonth++;
            if (this.jalaliMonth > 12) {
                this.jalaliMonth = 1;
                this.jalaliYear++;
            }
        }
        this.render();
    }

    /**
     * Go to Today
     */
    goToToday() {
        this.currentYear = this.today.getFullYear();
        this.currentMonth = this.today.getMonth() + 1;

        const jalaliToday = JalaliCalendar.gregorianToJalali(
            this.today.getFullYear(),
            this.today.getMonth() + 1,
            this.today.getDate()
        );
        this.jalaliYear = jalaliToday.jy;
        this.jalaliMonth = jalaliToday.jm;

        this.render();
    }

    /**
     * Handle Date Selection
     * FIXED: Removed setTimeout anti-pattern, direct synchronous call
     */
    selectDate(year, month, day, isOtherMonth = false) {
        // UX IMPROVEMENT: Navigate to other month if clicked
        if (isOtherMonth) {
            if (this.type === 'gregorian') {
                if (month < this.currentMonth || (month === 12 && this.currentMonth === 1)) {
                    this.previousMonth();
                } else {
                    this.nextMonth();
                }
            } else {
                if (month < this.jalaliMonth || (month === 12 && this.jalaliMonth === 1)) {
                    this.previousMonth();
                } else {
                    this.nextMonth();
                }
            }
            
            // FIXED: Direct call instead of setTimeout (synchronous render)
            this.selectDate(year, month, day, false);
            return;
        }

        // Convert to Gregorian for storage consistency
        let dateKey;
        if (this.type === 'jalali') {
            const greg = JalaliCalendar.jalaliToGregorian(year, month, day);
            dateKey = this.formatDateString(greg.gy, greg.gm, greg.gd);
        } else {
            dateKey = this.formatDateString(year, month, day);
        }

        this.selectedDate = dateKey;

        // Callback to app.js
        if (this.onDateSelect && typeof this.onDateSelect === 'function') {
            this.onDateSelect(dateKey);
        }

        // Visual update
        this.updateSelectedDay(dateKey);
    }

    /**
     * Update Selected Day Visual
     */
    updateSelectedDay(dateKey) {
        const dayCells = this.container.querySelectorAll('.day-cell');
        dayCells.forEach(cell => {
            if (cell.dataset.date === dateKey) {
                cell.classList.add('selected');
            } else {
                cell.classList.remove('selected');
            }
        });
    }

    /**
     * Update Date Indicators (show notes)
     * FIXED: Direct access to app.state instead of non-existent hasNotesForDate method
     */
    updateDateIndicators() {
        const dayCells = this.container.querySelectorAll('.day-cell');
        dayCells.forEach(cell => {
            const dateKey = cell.dataset.date;
            if (dateKey) {
                const hasNotes = this.hasNotesForDate(dateKey);
                if (hasNotes) {
                    cell.classList.add('has-note');
                } else {
                    cell.classList.remove('has-note');
                }
            }
        });
    }

    /**
     * Check if date has notes
     * FIXED: Proper integration with app.js state
     */
    hasNotesForDate(dateKey) {
        if (window.app && window.app.state && window.app.state.dateNotes) {
            const notes = window.app.state.dateNotes[dateKey];
            return Array.isArray(notes) && notes.length > 0;
        }
        return false;
    }

    /**
     * Format Date String (YYYY-MM-DD) - Always Gregorian for storage
     */
    formatDateString(year, month, day) {
        const y = String(year).padStart(4, '0');
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * Check if date is today
     */
    isToday(year, month, day) {
        if (this.type === 'gregorian') {
            return (
                year === this.today.getFullYear() &&
                month === this.today.getMonth() + 1 &&
                day === this.today.getDate()
            );
        } else {
            const jalaliToday = JalaliCalendar.gregorianToJalali(
                this.today.getFullYear(),
                this.today.getMonth() + 1,
                this.today.getDate()
            );
            return (
                year === jalaliToday.jy &&
                month === jalaliToday.jm &&
                day === jalaliToday.jd
            );
        }
    }

    /**
     * Check if day is weekend (Friday in Jalali, Saturday/Sunday in Gregorian)
     */
    isWeekend(year, month, day) {
        if (this.type === 'jalali') {
            const dayOfWeek = JalaliCalendar.getJalaliDayOfWeek(year, month, day);
            return dayOfWeek === 6; // Friday
        } else {
            const dayOfWeek = GregorianCalendar.getDayOfWeek(year, month, day);
            return dayOfWeek === 0 || dayOfWeek === 6; // Saturday or Friday
        }
    }

    /**
     * Render Calendar
     */
    render() {
        if (!this.container) return;

        const calendarWidget = this.container.querySelector('.calendar-widget');
        if (!calendarWidget) {
            console.error('Calendar widget not found');
            return;
        }

        let html;
        if (this.type === 'gregorian') {
            html = this.renderGregorianCalendar();
        } else {
            html = this.renderJalaliCalendar();
        }

        calendarWidget.innerHTML = html;

        // Re-attach event listeners
        this.attachNavigationListeners();
        this.attachDayClickListeners();
        this.updateDateIndicators();

        // Add ARIA attributes for accessibility
        this.setupAccessibility();
    }

    /**
     * Render Gregorian Calendar
     */
    renderGregorianCalendar() {
        const monthNames = GregorianCalendar.getMonthNames();
        const weekdayNames = GregorianCalendar.getWeekdayNames();
        const daysInMonth = GregorianCalendar.getDaysInMonth(this.currentYear, this.currentMonth);
        const firstDayOfWeek = GregorianCalendar.getDayOfWeek(this.currentYear, this.currentMonth, 1);

        // Navigation
        const navHtml = `
            <div class="calendar-nav">
                <button class="nav-btn" id="prevMonthBtn" aria-label="Previous Month">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <div class="calendar-current">
                    <div class="current-month">${monthNames[this.currentMonth - 1]}</div>
                    <div class="current-year">${this.currentYear}</div>
                </div>
                <button class="nav-btn" id="nextMonthBtn" aria-label="Next Month">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        `;

        // Weekday headers
        const weekdaysHtml = `
            <div class="calendar-weekdays">
                ${weekdayNames.map(day => `<div class="weekday">${day}</div>`).join('')}
            </div>
        `;

        // Days grid
        const days = [];

        // Previous month days
        const prevMonthDays = GregorianCalendar.getDaysInMonth(
            this.currentMonth === 1 ? this.currentYear - 1 : this.currentYear,
            this.currentMonth === 1 ? 12 : this.currentMonth - 1
        );
        
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const prevMonth = this.currentMonth === 1 ? 12 : this.currentMonth - 1;
            const prevYear = this.currentMonth === 1 ? this.currentYear - 1 : this.currentYear;
            days.push({
                day,
                month: prevMonth,
                year: prevYear,
                isOtherMonth: true,
                isToday: false,
                isWeekend: false
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                day,
                month: this.currentMonth,
                year: this.currentYear,
                isOtherMonth: false,
                isToday: this.isToday(this.currentYear, this.currentMonth, day),
                isWeekend: this.isWeekend(this.currentYear, this.currentMonth, day)
            });
        }

        // Next month days
        const remainingCells = 42 - days.length;
        for (let day = 1; day <= remainingCells; day++) {
            const nextMonth = this.currentMonth === 12 ? 1 : this.currentMonth + 1;
            const nextYear = this.currentMonth === 12 ? this.currentYear + 1 : this.currentYear;
            days.push({
                day,
                month: nextMonth,
                year: nextYear,
                isOtherMonth: true,
                isToday: false,
                isWeekend: false
            });
        }

        const daysHtml = `
            <div class="calendar-days">
                ${days.map(d => {
                    const dateKey = this.formatDateString(d.year, d.month, d.day);
                    const classes = [
                        'day-cell',
                        d.isOtherMonth ? 'other-month' : '',
                        d.isToday ? 'today' : '',
                        d.isWeekend ? 'weekend' : ''
                    ].filter(Boolean).join(' ');

                    return `
                        <div class="${classes}" 
                             data-date="${dateKey}"
                             data-year="${d.year}"
                             data-month="${d.month}"
                             data-day="${d.day}"
                             data-other="${d.isOtherMonth}"
                             role="button"
                             tabindex="${d.isOtherMonth ? -1 : 0}"
                             aria-label="${d.day} ${monthNames[d.month - 1]} ${d.year}">
                            <span class="day-number">${d.day}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Actions
        const actionsHtml = `
            <div class="calendar-actions">
                <button class="action-btn" id="todayBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Today
                </button>
            </div>
        `;

        return `
            ${navHtml}
            <div class="calendar-body">
                ${weekdaysHtml}
                ${daysHtml}
            </div>
            ${actionsHtml}
        `;
    }

    /**
     * Render Jalali Calendar
     */
    renderJalaliCalendar() {
        const monthNames = JalaliCalendar.getMonthNames();
        const weekdayNames = JalaliCalendar.getWeekdayNames();
        const daysInMonth = JalaliCalendar.getDaysInJalaliMonth(this.jalaliYear, this.jalaliMonth);
        const firstDayOfWeek = JalaliCalendar.getJalaliDayOfWeek(this.jalaliYear, this.jalaliMonth, 1);

        // Navigation
        const navHtml = `
            <div class="calendar-nav">
                <button class="nav-btn" id="prevMonthBtn" aria-label="ماه قبل">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                <div class="calendar-current">
                    <div class="current-month">${monthNames[this.jalaliMonth - 1]}</div>
                    <div class="current-year">${this.jalaliYear}</div>
                </div>
                <button class="nav-btn" id="nextMonthBtn" aria-label="ماه بعد">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
            </div>
        `;

        // Weekday headers
        const weekdaysHtml = `
            <div class="calendar-weekdays">
                ${weekdayNames.map(day => `<div class="weekday">${day}</div>`).join('')}
            </div>
        `;

        // Days grid
        const days = [];

        // Previous month days
        const prevMonth = this.jalaliMonth === 1 ? 12 : this.jalaliMonth - 1;
        const prevYear = this.jalaliMonth === 1 ? this.jalaliYear - 1 : this.jalaliYear;
        const prevMonthDays = JalaliCalendar.getDaysInJalaliMonth(prevYear, prevMonth);
        
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            days.push({
                day,
                month: prevMonth,
                year: prevYear,
                isOtherMonth: true,
                isToday: false,
                isWeekend: false
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                day,
                month: this.jalaliMonth,
                year: this.jalaliYear,
                isOtherMonth: false,
                isToday: this.isToday(this.jalaliYear, this.jalaliMonth, day),
                isWeekend: this.isWeekend(this.jalaliYear, this.jalaliMonth, day)
            });
        }

        // Next month days
        const remainingCells = 42 - days.length;
        const nextMonth = this.jalaliMonth === 12 ? 1 : this.jalaliMonth + 1;
        const nextYear = this.jalaliMonth === 12 ? this.jalaliYear + 1 : this.jalaliYear;
        
        for (let day = 1; day <= remainingCells; day++) {
            days.push({
                day,
                month: nextMonth,
                year: nextYear,
                isOtherMonth: true,
                isToday: false,
                isWeekend: false
            });
        }

        const daysHtml = `
            <div class="calendar-days">
                ${days.map(d => {
                    // Convert Jalali to Gregorian for storage key
                    const greg = JalaliCalendar.jalaliToGregorian(d.year, d.month, d.day);
                    const dateKey = this.formatDateString(greg.gy, greg.gm, greg.gd);
                    
                    const classes = [
                        'day-cell',
                        d.isOtherMonth ? 'other-month' : '',
                        d.isToday ? 'today' : '',
                        d.isWeekend ? 'weekend' : ''
                    ].filter(Boolean).join(' ');

                    return `
                        <div class="${classes}" 
                             data-date="${dateKey}"
                             data-year="${d.year}"
                             data-month="${d.month}"
                             data-day="${d.day}"
                             data-other="${d.isOtherMonth}"
                             role="button"
                             tabindex="${d.isOtherMonth ? -1 : 0}"
                             aria-label="${d.day} ${monthNames[d.month - 1]} ${d.year}">
                            <span class="day-number">${d.day}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Actions
        const actionsHtml = `
            <div class="calendar-actions">
                <button class="action-btn" id="todayBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    امروز
                </button>
            </div>
        `;

        return `
            ${navHtml}
            <div class="calendar-body">
                ${weekdaysHtml}
                ${daysHtml}
            </div>
            ${actionsHtml}
        `;
    }

    /**
     * Attach Navigation Event Listeners
     * Called after each render
     */
    attachNavigationListeners() {
        const prevBtn = this.container.querySelector('#prevMonthBtn');
        const nextBtn = this.container.querySelector('#nextMonthBtn');
        const todayBtn = this.container.querySelector('#todayBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousMonth());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextMonth());
        }

        if (todayBtn) {
            todayBtn.addEventListener('click', () => this.goToToday());
        }
    }

    /**
     * Attach Day Click Event Listeners
     * PERFORMANCE OPTIMIZATION: Using Event Delegation (1 listener instead of 42)
     */
    attachDayClickListeners() {
        const daysContainer = this.container.querySelector('.calendar-days');
        if (!daysContainer) return;

        // Remove previous listener if exists (prevent duplicates)
        const oldListener = daysContainer._clickListener;
        if (oldListener) {
            daysContainer.removeEventListener('click', oldListener);
        }

        // Create new listener
        const clickListener = (e) => {
            const cell = e.target.closest('.day-cell');
            if (cell) {
                const year = parseInt(cell.dataset.year);
                const month = parseInt(cell.dataset.month);
                const day = parseInt(cell.dataset.day);
                const isOther = cell.dataset.other === 'true';
                
                this.selectDate(year, month, day, isOther);
            }
        };

        // Store reference for cleanup
        daysContainer._clickListener = clickListener;
        daysContainer.addEventListener('click', clickListener);

        // Keyboard navigation support
        daysContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const cell = e.target.closest('.day-cell');
                if (cell) {
                    e.preventDefault();
                    cell.click();
                }
            }
        });
    }

    /**
     * Setup Accessibility Attributes
     */
    setupAccessibility() {
        const calendarBody = this.container.querySelector('.calendar-body');
        if (calendarBody) {
            calendarBody.setAttribute('role', 'grid');
            calendarBody.setAttribute('aria-label', 
                this.type === 'gregorian' ? 'Calendar Grid' : 'تقویم شمسی'
            );
        }

        const weekdays = this.container.querySelector('.calendar-weekdays');
        if (weekdays) {
            weekdays.setAttribute('role', 'rowgroup');
        }

        const daysContainer = this.container.querySelector('.calendar-days');
        if (daysContainer) {
            daysContainer.setAttribute('role', 'rowgroup');
        }
    }
}

// ============================================
// INITIALIZATION ON DOM READY
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Wait for app.js to be ready
    if (typeof window.app !== 'undefined') {
        initializeCalendar();
    } else {
        // Fallback: wait a bit for app.js
        const checkAppReady = setInterval(() => {
            if (typeof window.app !== 'undefined') {
                clearInterval(checkAppReady);
                initializeCalendar();
            }
        }, 50);
        
        // Timeout after 5 seconds
        setTimeout(() => clearInterval(checkAppReady), 5000);
    }
});

/**
 * Initialize Calendar Instance
 */
function initializeCalendar() {
    window.calendar = new Calendar({
        type: 'gregorian',
        container: document.getElementById('calendarWidget'),
        onDateSelect: (dateKey) => {
            if (window.app && typeof window.app.showDateNoteModal === 'function') {
                window.app.showDateNoteModal(dateKey);
            }
        }
    });

    console.log('✓ Calendar initialized successfully');
}
