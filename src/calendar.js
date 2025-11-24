/**
 * ============================================
 * CALENDAR MODULE - PRODUCTION READY VERSION
 * ============================================
 * 
 * Features:
 * - Dual Calendar Support (Gregorian & Jalali)
 * - Event Delegation for Performance
 * - Accessibility Support (ARIA, Keyboard Navigation)
 * - Clean Separation of Concerns
 * - Consistent Date Key Generation (Always Gregorian)
 * 
 * Dependencies:
 * - window.JalaliDate from jalali.js (REQUIRED for Jalali mode)
 * - window.app from app.js (for state management)
 * 
 * @version 2.0.0
 * @author Dastyar Team
 */

class Calendar {
    /**
     * Initialize Calendar with default state
     */
    constructor() {
        // Calendar State
        this.currentDate = new Date();
        this.currentType = 'gregorian'; // 'gregorian' | 'jalali'
        
        // Month Names (Localized)
        this.gregorianMonths = [
            'ژانویه', 'فوریه', 'مارس', 'آوریل', 'می', 'ژوئن',
            'ژوئیه', 'آگوست', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'
        ];
        
        this.jalaliMonths = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        
        // Weekday Names (Saturday-based for Persian locale)
        this.weekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
        
        // Cache DOM Elements
        this.elements = this.cacheElements();
        
        // Initialize
        this.init();
    }

    /**
     * Cache all required DOM elements
     * @returns {Object} Cached elements
     */
    cacheElements() {
        return {
            calendarWidget: document.querySelector('.calendar-widget'),
            calendarDays: document.querySelector('.calendar-days'),
            currentMonth: document.querySelector('.current-month'),
            currentYear: document.querySelector('.current-year'),
            prevBtn: document.querySelector('.prev-month'),
            nextBtn: document.querySelector('.next-month'),
            todayBtn: document.querySelector('.today-btn'),
            toggleBtns: document.querySelectorAll('.toggle-btn')
        };
    }

    /**
     * Initialize calendar with event listeners and render
     */
    init() {
        if (!this.elements.calendarWidget) {
            console.warn('Calendar widget not found in DOM');
            return;
        }

        this.setupEventListeners();
        this.render();
        this.setupAccessibility();
        
        console.log('✅ Calendar initialized successfully');
    }

    /**
     * Setup all event listeners using Event Delegation
     */
    setupEventListeners() {
        // Navigation Buttons
        this.elements.prevBtn?.addEventListener('click', () => this.navigateMonth(-1));
        this.elements.nextBtn?.addEventListener('click', () => this.navigateMonth(1));
        this.elements.todayBtn?.addEventListener('click', () => this.goToToday());

        // Calendar Type Toggle
        this.elements.toggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTypeToggle(e));
        });

        // Day Click Handler (Event Delegation)
        this.attachDayClickListeners();

        // Listen to note updates from app.js
        window.addEventListener('notesUpdated', () => this.render());
    }

    /**
     * Attach day click listeners using Event Delegation
     * This prevents creating 42 individual listeners
     */
    attachDayClickListeners() {
        if (!this.elements.calendarDays) return;

        this.elements.calendarDays.addEventListener('click', (e) => {
            const dayCell = e.target.closest('.day-cell');
            if (!dayCell || dayCell.classList.contains('other-month')) return;

            const dateKey = dayCell.dataset.date;
            if (dateKey && window.app) {
                window.app.showDateNoteModal(dateKey);
            }
        });
    }

    /**
     * Setup keyboard accessibility for calendar navigation
     */
    setupAccessibility() {
        if (!this.elements.calendarDays) return;

        this.elements.calendarDays.addEventListener('keydown', (e) => {
            const dayCell = e.target.closest('.day-cell');
            if (!dayCell) return;

            // Enter or Space to select date
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                dayCell.click();
            }

            // Arrow key navigation
            const days = Array.from(this.elements.calendarDays.querySelectorAll('.day-cell:not(.other-month)'));
            const currentIndex = days.indexOf(dayCell);

            let targetIndex = currentIndex;

            switch(e.key) {
                case 'ArrowLeft':
                    targetIndex = currentIndex + 1; // RTL: left = next
                    break;
                case 'ArrowRight':
                    targetIndex = currentIndex - 1; // RTL: right = previous
                    break;
                case 'ArrowUp':
                    targetIndex = currentIndex - 7;
                    break;
                case 'ArrowDown':
                    targetIndex = currentIndex + 7;
                    break;
                default:
                    return;
            }

            if (days[targetIndex]) {
                e.preventDefault();
                days[targetIndex].focus();
            }
        });
    }

    /**
     * Handle calendar type toggle (Gregorian/Jalali)
     * @param {Event} e - Click event
     */
    handleTypeToggle(e) {
        const type = e.target.dataset.type;
        
        // Validate Jalali dependency
        if (type === 'jalali' && !window.JalaliDate) {
            console.error('❌ JalaliDate library not loaded. Cannot switch to Jalali calendar.');
            if (window.app) {
                window.app.showToast('کتابخانه تقویم شمسی بارگذاری نشده است', 'error');
            }
            return;
        }

        if (type !== this.currentType) {
            this.currentType = type;
            
            // Update active state
            this.elements.toggleBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === type);
            });

            this.render();
        }
    }

    /**
     * Navigate to previous/next month
     * @param {number} direction - -1 for previous, 1 for next
     */
    navigateMonth(direction) {
        if (this.currentType === 'gregorian') {
            this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        } else {
            const jalali = this.gregorianToJalali(this.currentDate);
            let newMonth = jalali.month + direction;
            let newYear = jalali.year;

            if (newMonth > 12) {
                newMonth = 1;
                newYear++;
            } else if (newMonth < 1) {
                newMonth = 12;
                newYear--;
            }

            this.currentDate = this.jalaliToGregorian({ year: newYear, month: newMonth, day: 1 });
        }

        this.render();
    }

    /**
     * Go to today's date
     */
    goToToday() {
        this.currentDate = new Date();
        this.render();
    }

    /**
     * Main render method - delegates to specific calendar renderer
     */
    render() {
        if (this.currentType === 'gregorian') {
            this.renderGregorianCalendar();
        } else {
            this.renderJalaliCalendar();
        }
    }

    /**
     * Render Gregorian Calendar
     */
    renderGregorianCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Update header
        if (this.elements.currentMonth) {
            this.elements.currentMonth.textContent = this.gregorianMonths[month];
        }
        if (this.elements.currentYear) {
            this.elements.currentYear.textContent = year;
        }

        // Calculate first day of month (0 = Sunday)
        const firstDay = new Date(year, month, 1).getDay();
        // Adjust for Saturday-based week (Persian locale)
        const adjustedFirstDay = (firstDay + 1) % 7;

        // Days in current and previous month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Today reference
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        let html = '';

        // Previous month days (grayed out)
        for (let i = adjustedFirstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const prevMonth = month === 0 ? 11 : month - 1;
            const prevYear = month === 0 ? year - 1 : year;
            const dateStr = this.formatDateKey(prevYear, prevMonth + 1, day);
            
            html += this.renderDayCell(day, dateStr, true, false, false);
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = this.formatDateKey(year, month + 1, day);
            const isToday = isCurrentMonth && day === today.getDate();
            const currentDayOfWeek = new Date(year, month, day).getDay();
            const isWeekend = currentDayOfWeek === 5; // Friday

            html += this.renderDayCell(day, dateStr, false, isToday, isWeekend);
        }

        // Next month days (to fill grid)
        const totalCells = adjustedFirstDay + daysInMonth;
        const remainingCells = totalCells > 35 ? 42 - totalCells : 35 - totalCells;

        for (let day = 1; day <= remainingCells; day++) {
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;
            const dateStr = this.formatDateKey(nextYear, nextMonth + 1, day);
            
            html += this.renderDayCell(day, dateStr, true, false, false);
        }

        if (this.elements.calendarDays) {
            this.elements.calendarDays.innerHTML = html;
        }
    }

    /**
     * Render Jalali Calendar
     * ✅ FIXED: Uses Gregorian keys for consistency
     */
    renderJalaliCalendar() {
        // Validate dependency
        if (!window.JalaliDate) {
            console.error('❌ Critical: JalaliDate not available');
            this.showFallbackMessage();
            return;
        }

        const jalali = this.gregorianToJalali(this.currentDate);
        const { year, month } = jalali;

        // Update header
        if (this.elements.currentMonth) {
            this.elements.currentMonth.textContent = this.jalaliMonths[month - 1];
        }
        if (this.elements.currentYear) {
            this.elements.currentYear.textContent = year;
        }

        // Calculate first day of Jalali month in Gregorian calendar
        const firstDayGregorian = this.jalaliToGregorian({ year, month, day: 1 });
        const firstDay = firstDayGregorian.getDay();
        const adjustedFirstDay = (firstDay + 1) % 7;

        // Days in current Jalali month
        const daysInMonth = this.jalaliMonthLength(year, month);
        
        // Previous Jalali month info
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const daysInPrevMonth = this.jalaliMonthLength(prevYear, prevMonth);

        // Today reference
        const today = this.gregorianToJalali(new Date());
        const isCurrentMonth = year === today.year && month === today.month;

        let html = '';

        // Previous month days
        for (let i = adjustedFirstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dateGregorian = this.jalaliToGregorian({ year: prevYear, month: prevMonth, day });
            
            // ✅ CRITICAL FIX: Use Gregorian date for key generation
            const dateStr = this.formatDateKey(
                dateGregorian.getFullYear(),
                dateGregorian.getMonth() + 1,
                dateGregorian.getDate()
            );
            
            html += this.renderDayCell(day, dateStr, true, false, false);
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateGregorian = this.jalaliToGregorian({ year, month, day });
            
            // ✅ CRITICAL FIX: Use Gregorian date for key generation
            const dateStr = this.formatDateKey(
                dateGregorian.getFullYear(),
                dateGregorian.getMonth() + 1,
                dateGregorian.getDate()
            );

            const isToday = isCurrentMonth && day === today.day;
            const isWeekend = dateGregorian.getDay() === 5; // Friday
            
            html += this.renderDayCell(day, dateStr, false, isToday, isWeekend);
        }

        // Next month days
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const totalCells = adjustedFirstDay + daysInMonth;
        const remainingCells = totalCells > 35 ? 42 - totalCells : 35 - totalCells;

        for (let day = 1; day <= remainingCells; day++) {
            const dateGregorian = this.jalaliToGregorian({ year: nextYear, month: nextMonth, day });
            
            // ✅ CRITICAL FIX: Use Gregorian date for key generation
            const dateStr = this.formatDateKey(
                dateGregorian.getFullYear(),
                dateGregorian.getMonth() + 1,
                dateGregorian.getDate()
            );
            
            html += this.renderDayCell(day, dateStr, true, false, false);
        }

        if (this.elements.calendarDays) {
            this.elements.calendarDays.innerHTML = html;
        }
    }

    /**
     * Render a single day cell with proper classes and attributes
     * @param {number} day - Day number
     * @param {string} dateStr - Gregorian date key (YYYY-M-D)
     * @param {boolean} isOtherMonth - Is from adjacent month
     * @param {boolean} isToday - Is today
     * @param {boolean} isWeekend - Is weekend (Friday)
     * @returns {string} HTML for day cell
     */
    renderDayCell(day, dateStr, isOtherMonth, isToday, isWeekend) {
        const classes = ['day-cell'];
        
        if (isOtherMonth) classes.push('other-month');
        if (isToday) classes.push('today');
        if (isWeekend) classes.push('weekend');
        
        // Check if this date has notes (from app state)
        const hasNote = window.app?.state?.dateNotes?.[dateStr]?.length > 0;
        if (hasNote) classes.push('has-note');

        // Accessibility attributes
        const ariaLabel = `${day} ${isToday ? '(امروز)' : ''}`;
        const tabindex = isOtherMonth ? '-1' : '0';

        return `
            <div class="${classes.join(' ')}" 
                 data-date="${dateStr}"
                 role="button"
                 tabindex="${tabindex}"
                 aria-label="${ariaLabel}">
                <span class="day-number">${day}</span>
            </div>
        `;
    }

    /**
     * Show fallback message when JalaliDate is not available
     */
    showFallbackMessage() {
        if (this.elements.calendarDays) {
            this.elements.calendarDays.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <p>⚠️ کتابخانه تقویم شمسی بارگذاری نشده است</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;">
                        لطفاً فایل jalali.js را اضافه کنید
                    </p>
                </div>
            `;
        }
    }

    /**
     * Format date key consistently (Gregorian YYYY-M-D)
     * ✅ Always generates Gregorian keys for data consistency
     * @param {number} year - Year
     * @param {number} month - Month (1-12)
     * @param {number} day - Day (1-31)
     * @returns {string} Formatted date key
     */
    formatDateKey(year, month, day) {
        return `${year}-${parseInt(month)}-${parseInt(day)}`;
    }

    /**
     * Get Jalali month length (handles leap years)
     * @param {number} year - Jalali year
     * @param {number} month - Jalali month (1-12)
     * @returns {number} Number of days in month
     */
    jalaliMonthLength(year, month) {
        if (month <= 6) return 31;
        if (month <= 11) return 30;
        return this.isJalaliLeapYear(year) ? 30 : 29;
    }

    /**
     * Check if Jalali year is leap year
     * ✅ This logic will be moved to jalali.js in production
     * @param {number} year - Jalali year
     * @returns {boolean} Is leap year
     */
    isJalaliLeapYear(year) {
        // Algorithm: 33-year cycle with 8 leap years
        const cycle = year % 33;
        return [1, 5, 9, 13, 17, 22, 26, 30].includes(cycle);
    }

    /**
     * Convert Gregorian date to Jalali
     * @param {Date} date - Gregorian Date object
     * @returns {Object} {year, month, day}
     */
    gregorianToJalali(date) {
        if (window.JalaliDate) {
            try {
                const jd = new JalaliDate(date);
                return {
                    year: jd.getFullYear(),
                    month: jd.getMonth() + 1, // JalaliDate uses 0-11
                    day: jd.getDate()
                };
            } catch (error) {
                console.error('JalaliDate conversion error:', error);
            }
        }

        // ⚠️ NO FALLBACK - Return error state
        console.error('❌ JalaliDate library required but not available');
        return { year: 0, month: 0, day: 0 };
    }

    /**
     * Convert Jalali date to Gregorian
     * @param {Object} jalali - {year, month, day}
     * @returns {Date} Gregorian Date object
     */
    jalaliToGregorian(jalali) {
        if (window.JalaliDate) {
            try {
                // JalaliDate constructor expects (year, month, day)
                // Month is 0-based in JalaliDate
                const jd = new JalaliDate(jalali.year, jalali.month - 1, jalali.day);
                return jd.toGregorian();
            } catch (error) {
                console.error('Jalali to Gregorian conversion error:', error);
            }
        }

        // ⚠️ NO FALLBACK - Return current date to prevent crashes
        console.error('❌ JalaliDate library required but not available');
        return new Date();
    }
}

// ============================================
// AUTO-INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.calendar = new Calendar();
});
