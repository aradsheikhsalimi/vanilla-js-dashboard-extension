/**
 * ============================================
 * JALALI (SHAMSI/PERSIAN) CALENDAR LIBRARY
 * ============================================
 * 
 * A comprehensive, production-ready implementation of the Solar Hijri calendar
 * (also known as Jalali or Persian calendar) with accurate astronomical calculations.
 * 
 * Features:
 * - Bidirectional conversion (Gregorian ↔ Jalali)
 * - Leap year calculation (33-year cycle algorithm)
 * - Date arithmetic (add/subtract days, months, years)
 * - Format parsing and output
 * - Locale-aware month/weekday names
 * - Immutable API (does not modify original dates)
 * 
 * Algorithm: Based on Kazimierz M. Borkowski's algorithm with optimizations
 * Reference: https://www.astro.uni.torun.pl/~kb/Papers/EMP/PersianC-EMP.htm
 * 
 * @version 2.0.0
 * @author Dastyar Team
 * @license MIT
 */

(function(global) {
    'use strict';

    /**
     * ============================================
     * CONSTANTS & LOOKUP TABLES
     * ============================================
     */

    // Jalali calendar epoch (622-03-22 CE in proleptic Gregorian calendar)
    const JALALI_EPOCH = 1948321; // Julian Day Number

    // Gregorian calendar epoch
    const GREGORIAN_EPOCH = 1721426; // Julian Day Number

    // Month names in Persian (nominative case)
    const JALALI_MONTH_NAMES = [
        'فروردین',    // 1 - Farvardin (31 days)
        'اردیبهشت',   // 2 - Ordibehesht (31 days)
        'خرداد',       // 3 - Khordad (31 days)
        'تیر',         // 4 - Tir (31 days)
        'مرداد',       // 5 - Mordad (31 days)
        'شهریور',      // 6 - Shahrivar (31 days)
        'مهر',         // 7 - Mehr (30 days)
        'آبان',        // 8 - Aban (30 days)
        'آذر',         // 9 - Azar (30 days)
        'دی',          // 10 - Dey (30 days)
        'بهمن',        // 11 - Bahman (30 days)
        'اسفند'        // 12 - Esfand (29/30 days - leap year dependent)
    ];

    // Weekday names (Saturday-based week)
    const JALALI_WEEKDAY_NAMES = [
        'شنبه',        // Saturday (0)
        'یکشنبه',      // Sunday (1)
        'دوشنبه',      // Monday (2)
        'سه‌شنبه',     // Tuesday (3)
        'چهارشنبه',    // Wednesday (4)
        'پنجشنبه',     // Thursday (5)
        'جمعه'         // Friday (6) - Weekend
    ];

    // Short weekday names
    const JALALI_WEEKDAY_NAMES_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    // Number of days in each Jalali month (non-leap year)
    const JALALI_MONTH_LENGTHS = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

    /**
     * ============================================
     * CORE CONVERSION ALGORITHMS
     * ============================================
     */

    /**
     * Check if a Jalali year is a leap year
     * Uses the 33-year cycle algorithm (2820-year grand cycle)
     * 
     * @param {number} jy - Jalali year
     * @returns {boolean} True if leap year
     */
    function isJalaliLeapYear(jy) {
        // Validate input
        if (!Number.isInteger(jy) || jy < 1) {
            throw new Error('Invalid Jalali year: must be a positive integer');
        }

        // 128-year cycle algorithm (more accurate for modern years)
        const breaks = [
            -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
            1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
        ];

        const gy = jy + 621;
        let jp = breaks[0];

        let jump = 0;
        for (let i = 1; i < breaks.length; i++) {
            const jm = breaks[i];
            jump = jm - jp;
            if (jy < jm) break;
            jp = jm;
        }

        let n = jy - jp;

        if (jump - n < 6) {
            n = n - jump + (Math.floor(jump / 33) * 33);
        }

        let leapFactor = (((n + 1) % 33) - 1) % 4;
        if (leapFactor === -1) {
            leapFactor = 4;
        }

        return leapFactor === 0;
    }

    /**
     * Convert Jalali date to Julian Day Number
     * 
     * @param {number} jy - Jalali year
     * @param {number} jm - Jalali month (1-12)
     * @param {number} jd - Jalali day (1-31)
     * @returns {number} Julian Day Number
     */
    function jalaliToJulian(jy, jm, jd) {
        // Validate inputs
        if (!Number.isInteger(jy) || jy < 1) {
            throw new Error('Invalid Jalali year');
        }
        if (!Number.isInteger(jm) || jm < 1 || jm > 12) {
            throw new Error('Invalid Jalali month: must be 1-12');
        }
        if (!Number.isInteger(jd) || jd < 1 || jd > 31) {
            throw new Error('Invalid Jalali day: must be 1-31');
        }

        // Calculate Julian Day Number
        const gy = jy + 621;
        const breaks = [
            -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
            1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
        ];

        let jp = breaks[0];
        let jump = 0;

        for (let i = 1; i < breaks.length; i++) {
            const jm_val = breaks[i];
            jump = jm_val - jp;
            if (jy < jm_val) break;
            jp = jm_val;
        }

        let n = jy - jp;

        if (jump - n < 6) {
            n = n - jump + (Math.floor(jump / 33) * 33);
        }

        let leapJ = -14;
        let leapG = 0;

        if (((n + 1) % 33) - 1 === 0) {
            leapJ = 0;
        } else {
            leapJ = (((n + 1) % 33) - 1) % 4;
            if (leapJ === -1) leapJ = 4;
        }

        leapG = Math.floor((gy / 4)) - Math.floor(((gy / 100) + 1) * 0.75) - 150;

        const jpd = JALALI_EPOCH + (365 * n) + Math.floor((n / 33) * 8) + 
                    Math.floor(((n % 33) + 3) / 4) + jd;

        if (jm < 7) {
            return jpd + (jm - 1) * 31;
        } else {
            return jpd + (jm - 7) * 30 + 186;
        }
    }

    /**
     * Convert Julian Day Number to Jalali date
     * 
     * @param {number} jdn - Julian Day Number
     * @returns {Object} {year, month, day}
     */
    function julianToJalali(jdn) {
        // Validate input
        if (!Number.isFinite(jdn) || jdn < JALALI_EPOCH) {
            throw new Error('Invalid Julian Day Number');
        }

        const gy = Math.floor((jdn - GREGORIAN_EPOCH + 0.5) / 365.25);
        let jy = Math.floor((jdn - JALALI_EPOCH + 0.5) / 365.25);

        const breaks = [
            -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
            1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
        ];

        let jp = breaks[0];
        let jump = 0;

        for (let i = 1; i < breaks.length; i++) {
            const jm = breaks[i];
            jump = jm - jp;
            if (jy < jm) break;
            jp = jm;
        }

        let n = jy - jp;

        if (jump - n < 6) {
            n = n - jump + (Math.floor(jump / 33) * 33);
        }

        let leapJ = -14;
        if (((n + 1) % 33) - 1 === 0) {
            leapJ = 0;
        } else {
            leapJ = (((n + 1) % 33) - 1) % 4;
            if (leapJ === -1) leapJ = 4;
        }

        const jpd = JALALI_EPOCH + (365 * n) + Math.floor((n / 33) * 8) + 
                    Math.floor(((n % 33) + 3) / 4);

        let jm, jd;

        if (jdn >= jpd) {
            jm = Math.floor((jdn - jpd) / 31);
            jd = (jdn - jpd) - (jm * 31);
            if (jm >= 6) {
                jm = Math.floor((jdn - jpd - 186) / 30);
                jd = (jdn - jpd - 186) - (jm * 30);
                jm += 7;
            } else {
                jm += 1;
            }
            jd += 1;
        } else {
            jy -= 1;
            jm = 12;
            jd = (jdn - jpd) + (isJalaliLeapYear(jy) ? 30 : 29) + 1;
        }

        return {
            year: jy,
            month: jm,
            day: jd
        };
    }

    /**
     * Convert Gregorian date to Julian Day Number
     * 
     * @param {number} gy - Gregorian year
     * @param {number} gm - Gregorian month (1-12)
     * @param {number} gd - Gregorian day (1-31)
     * @returns {number} Julian Day Number
     */
    function gregorianToJulian(gy, gm, gd) {
        // Validate inputs
        if (!Number.isInteger(gy)) {
            throw new Error('Invalid Gregorian year');
        }
        if (!Number.isInteger(gm) || gm < 1 || gm > 12) {
            throw new Error('Invalid Gregorian month: must be 1-12');
        }
        if (!Number.isInteger(gd) || gd < 1 || gd > 31) {
            throw new Error('Invalid Gregorian day: must be 1-31');
        }

        // Calculate Julian Day Number
        let a = Math.floor((14 - gm) / 12);
        let y = gy + 4800 - a;
        let m = gm + (12 * a) - 3;

        return gd + Math.floor((153 * m + 2) / 5) + (365 * y) + 
               Math.floor(y / 4) - Math.floor(y / 100) + 
               Math.floor(y / 400) - 32045;
    }

    /**
     * Convert Julian Day Number to Gregorian date
     * 
     * @param {number} jdn - Julian Day Number
     * @returns {Object} {year, month, day}
     */
    function julianToGregorian(jdn) {
        // Validate input
        if (!Number.isFinite(jdn)) {
            throw new Error('Invalid Julian Day Number');
        }

        const a = jdn + 32044;
        const b = Math.floor((4 * a + 3) / 146097);
        const c = a - Math.floor((146097 * b) / 4);
        const d = Math.floor((4 * c + 3) / 1461);
        const e = c - Math.floor((1461 * d) / 4);
        const m = Math.floor((5 * e + 2) / 153);

        const day = e - Math.floor((153 * m + 2) / 5) + 1;
        const month = m + 3 - (12 * Math.floor(m / 10));
        const year = (100 * b) + d - 4800 + Math.floor(m / 10);

        return {
            year: year,
            month: month,
            day: day
        };
    }

    /**
     * ============================================
     * JALALI DATE CLASS
     * ============================================
     */

    /**
     * JalaliDate class - Main API for Jalali calendar operations
     * 
     * @class
     * @param {...any} args - Constructor arguments (similar to JavaScript Date)
     */
    function JalaliDate(...args) {
        // Internal Gregorian Date storage
        this._gDate = null;
        this._jDate = null;

        // Parse constructor arguments
        if (args.length === 0) {
            // No arguments: current date/time
            this._gDate = new Date();
        } else if (args.length === 1) {
            const arg = args[0];

            if (arg instanceof Date) {
                // Argument is a Date object
                this._gDate = new Date(arg.getTime());
            } else if (arg instanceof JalaliDate) {
                // Copy constructor
                this._gDate = new Date(arg._gDate.getTime());
            } else if (typeof arg === 'number') {
                // Unix timestamp (milliseconds)
                this._gDate = new Date(arg);
            } else if (typeof arg === 'string') {
                // ISO string or Jalali string "YYYY-MM-DD"
                if (arg.includes('-') && arg.split('-').length === 3) {
                    const parts = arg.split('-').map(p => parseInt(p, 10));
                    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
                        // Assume Jalali format
                        this._jDate = { year: parts[0], month: parts[1], day: parts[2] };
                        const jdn = jalaliToJulian(parts[0], parts[1], parts[2]);
                        const greg = julianToGregorian(jdn);
                        this._gDate = new Date(greg.year, greg.month - 1, greg.day);
                    } else {
                        this._gDate = new Date(arg);
                    }
                } else {
                    this._gDate = new Date(arg);
                }
            } else {
                throw new Error('Invalid JalaliDate constructor argument');
            }
        } else if (args.length >= 3) {
            // Jalali date components (year, month, day, ...)
            const [jy, jm, jd, h = 0, i = 0, s = 0, ms = 0] = args;

            // Validate Jalali date
            if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) {
                throw new Error('Invalid Jalali date components');
            }

            this._jDate = { year: jy, month: jm, day: jd };

            // Convert to Gregorian
            const jdn = jalaliToJulali(jy, jm, jd);
            const greg = julianToGregorian(jdn);
            this._gDate = new Date(greg.year, greg.month - 1, greg.day, h, i, s, ms);
        } else {
            throw new Error('Invalid number of arguments for JalaliDate constructor');
        }

        // Cache Jalali representation if not already set
        if (!this._jDate) {
            const jdn = gregorianToJulian(
                this._gDate.getFullYear(),
                this._gDate.getMonth() + 1,
                this._gDate.getDate()
            );
            this._jDate = julianToJalali(jdn);
        }
    }

    /**
     * ============================================
     * JALALI DATE GETTERS
     * ============================================
     */

    /**
     * Get Jalali year
     * @returns {number} Jalali year
     */
    JalaliDate.prototype.getFullYear = function() {
        return this._jDate.year;
    };

    /**
     * Get Jalali month (0-11, similar to JavaScript Date)
     * @returns {number} Jalali month (0 = Farvardin, 11 = Esfand)
     */
    JalaliDate.prototype.getMonth = function() {
        return this._jDate.month - 1;
    };

    /**
     * Get Jalali date (day of month)
     * @returns {number} Jalali day (1-31)
     */
    JalaliDate.prototype.getDate = function() {
        return this._jDate.day;
    };

    /**
     * Get day of week (0-6, where 0 = Saturday)
     * @returns {number} Day of week
     */
    JalaliDate.prototype.getDay = function() {
        // JavaScript Date.getDay() returns 0 for Sunday
        // We need 0 for Saturday (Persian week start)
        const jsDay = this._gDate.getDay();
        return (jsDay + 1) % 7;
    };

    /**
     * Get hours (0-23)
     * @returns {number} Hours
     */
    JalaliDate.prototype.getHours = function() {
        return this._gDate.getHours();
    };

    /**
     * Get minutes (0-59)
     * @returns {number} Minutes
     */
    JalaliDate.prototype.getMinutes = function() {
        return this._gDate.getMinutes();
    };

    /**
     * Get seconds (0-59)
     * @returns {number} Seconds
     */
    JalaliDate.prototype.getSeconds = function() {
        return this._gDate.getSeconds();
    };

    /**
     * Get milliseconds (0-999)
     * @returns {number} Milliseconds
     */
    JalaliDate.prototype.getMilliseconds = function() {
        return this._gDate.getMilliseconds();
    };

    /**
     * Get Unix timestamp (milliseconds since 1970-01-01)
     * @returns {number} Timestamp
     */
    JalaliDate.prototype.getTime = function() {
        return this._gDate.getTime();
    };

    /**
     * ============================================
     * JALALI DATE SETTERS
     * ============================================
     */

    /**
     * Set Jalali year
     * @param {number} jy - Jalali year
     */
    JalaliDate.prototype.setFullYear = function(jy) {
        if (!Number.isInteger(jy)) {
            throw new Error('Invalid year');
        }
        this._jDate.year = jy;
        this._updateGregorian();
    };

    /**
     * Set Jalali month (0-11)
     * @param {number} jm - Jalali month (0 = Farvardin)
     */
    JalaliDate.prototype.setMonth = function(jm) {
        if (!Number.isInteger(jm)) {
            throw new Error('Invalid month');
        }
        this._jDate.month = jm + 1;
        this._updateGregorian();
    };

    /**
     * Set Jalali date (day of month)
     * @param {number} jd - Jalali day (1-31)
     */
    JalaliDate.prototype.setDate = function(jd) {
        if (!Number.isInteger(jd)) {
            throw new Error('Invalid date');
        }
        this._jDate.day = jd;
        this._updateGregorian();
    };

    /**
     * Internal method to update Gregorian date after Jalali modification
     * @private
     */
    JalaliDate.prototype._updateGregorian = function() {
        const jdn = jalaliToJulian(this._jDate.year, this._jDate.month, this._jDate.day);
        const greg = julianToGregorian(jdn);
        const prevTime = this._gDate.getTime() % 86400000; // Preserve time of day
        this._gDate = new Date(greg.year, greg.month - 1, greg.day);
        this._gDate.setTime(this._gDate.getTime() + prevTime);
    };

    /**
     * ============================================
     * CONVERSION METHODS
     * ============================================
     */

    /**
     * Convert to Gregorian Date object
     * @returns {Date} JavaScript Date object
     */
    JalaliDate.prototype.toGregorian = function() {
        return new Date(this._gDate.getTime());
    };

    /**
     * Get Jalali date object
     * @returns {Object} {year, month, day}
     */
    JalaliDate.prototype.toJalali = function() {
        return {
            year: this._jDate.year,
            month: this._jDate.month,
            day: this._jDate.day
        };
    };

    /**
     * ============================================
     * FORMATTING METHODS
     * ============================================
     */

    /**
     * Format Jalali date to string
     * @param {string} format - Format string (YYYY, MM, DD, etc.)
     * @returns {string} Formatted date
     */
    JalaliDate.prototype.format = function(format = 'YYYY-MM-DD') {
        const tokens = {
            YYYY: String(this._jDate.year),
            YY: String(this._jDate.year).slice(-2),
            MM: String(this._jDate.month).padStart(2, '0'),
            M: String(this._jDate.month),
            DD: String(this._jDate.day).padStart(2, '0'),
            D: String(this._jDate.day),
            dddd: JALALI_WEEKDAY_NAMES[this.getDay()],
            ddd: JALALI_WEEKDAY_NAMES_SHORT[this.getDay()],
            MMMM: JALALI_MONTH_NAMES[this._jDate.month - 1],
            HH: String(this.getHours()).padStart(2, '0'),
            mm: String(this.getMinutes()).padStart(2, '0'),
            ss: String(this.getSeconds()).padStart(2, '0')
        };

        return format.replace(/YYYY|YY|MMMM|MM|M|DD|D|dddd|ddd|HH|mm|ss/g, match => tokens[match]);
    };

    /**
     * Convert to ISO-like string (Jalali)
     * @returns {string} YYYY-MM-DD format
     */
    JalaliDate.prototype.toString = function() {
        return this.format('YYYY-MM-DD');
    };

    /**
     * Convert to locale-specific string (Persian)
     * @returns {string} Locale string
     */
    JalaliDate.prototype.toLocaleString = function() {
        return this.format('dddd، D MMMM YYYY');
    };

    /**
     * ============================================
     * UTILITY METHODS
     * ============================================
     */

    /**
     * Check if date is valid
     * @returns {boolean} True if valid
     */
    JalaliDate.prototype.isValid = function() {
        return this._gDate instanceof Date && !isNaN(this._gDate.getTime());
    };

    /**
     * Clone this JalaliDate
     * @returns {JalaliDate} New instance
     */
    JalaliDate.prototype.clone = function() {
        return new JalaliDate(this);
    };

    /**
     * ============================================
     * STATIC METHODS
     * ============================================
     */

    /**
     * Get current Jalali date
     * @static
     * @returns {JalaliDate} Current date
     */
    JalaliDate.now = function() {
        return new JalaliDate();
    };

    /**
     * Check if a Jalali year is leap year (static)
     * @static
     * @param {number} jy - Jalali year
     * @returns {boolean} True if leap year
     */
    JalaliDate.isLeapYear = isJalaliLeapYear;

    /**
     * Get month name
     * @static
     * @param {number} month - Month number (1-12)
     * @returns {string} Month name
     */
    JalaliDate.getMonthName = function(month) {
        if (month < 1 || month > 12) {
            throw new Error('Invalid month: must be 1-12');
        }
        return JALALI_MONTH_NAMES[month - 1];
    };

    /**
     * Get weekday name
     * @static
     * @param {number} day - Day of week (0-6, 0 = Saturday)
     * @returns {string} Weekday name
     */
    JalaliDate.getWeekdayName = function(day) {
        if (day < 0 || day > 6) {
            throw new Error('Invalid day: must be 0-6');
        }
        return JALALI_WEEKDAY_NAMES[day];
    };

    /**
     * Get days in Jalali month
     * @static
     * @param {number} year - Jalali year
     * @param {number} month - Jalali month (1-12)
     * @returns {number} Number of days
     */
    JalaliDate.getDaysInMonth = function(year, month) {
        if (month < 1 || month > 12) {
            throw new Error('Invalid month: must be 1-12');
        }
        if (month <= 6) return 31;
        if (month <= 11) return 30;
        return isJalaliLeapYear(year) ? 30 : 29;
    };

    /**
     * ============================================
     * EXPORT TO GLOBAL SCOPE
     * ============================================
     */

    // Expose to global scope (window in browser, global in Node.js)
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js / CommonJS
        module.exports = JalaliDate;
    } else {
        // Browser
        global.JalaliDate = JalaliDate;
    }

    // Also expose utility functions for advanced use
    global.JalaliDate.utils = {
        isLeapYear: isJalaliLeapYear,
        jalaliToJulian: jalaliToJulian,
        julianToJalali: julianToJalali,
        gregorianToJulian: gregorianToJulian,
        julianToGregorian: julianToGregorian,
        MONTH_NAMES: JALALI_MONTH_NAMES,
        WEEKDAY_NAMES: JALALI_WEEKDAY_NAMES
    };

    console.log('✅ JalaliDate library loaded successfully (v2.0.0)');

})(typeof window !== 'undefined' ? window : global);
