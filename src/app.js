class DastyarApp {
    constructor() {
        this.state = {
            notes: [],
            quickLinks: [],
            currentCalendarType: 'gregorian',
            currentDate: new Date(),
            dateNotes: {} // Format: { 'YYYY-MM-DD': [{id, title, content, createdAt}] }
        };

        this.elements = {};
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.cacheElements();
            this.loadFromStorage();
            this.setupEventListeners();
            this.renderNotes();
            this.renderQuickLinks();
            this.renderCalendar();
            this.updateDateTime();
            
            // Update time every minute
            setInterval(() => this.updateDateTime(), 60000);
            
            console.log('✅ Dastyar App initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing app:', error);
            this.showToast('خطا در راه‌اندازی برنامه', 'error');
        }
    }

    /**
     * Cache all DOM elements for better performance
     */
    cacheElements() {
        // Search elements
        this.elements.searchInput = document.getElementById('searchInput');
        this.elements.searchOptions = document.querySelectorAll('.search-option');
        this.elements.searchForm = document.getElementById('searchForm');

        // Notes elements
        this.elements.notesContainer = document.getElementById('notesContainer');
        this.elements.addNoteBtn = document.getElementById('addNoteBtn');
        this.elements.noteModal = document.getElementById('noteModal');
        this.elements.noteForm = document.getElementById('noteForm');
        this.elements.noteTitle = document.getElementById('noteTitle');
        this.elements.noteContent = document.getElementById('noteContent');
        this.elements.charCount = document.getElementById('charCount');
        this.elements.cancelNoteBtn = document.getElementById('cancelNoteBtn');

        // Quick Access elements
        this.elements.quickLinksContainer = document.getElementById('quickLinksContainer');
        this.elements.addLinkBtn = document.getElementById('addLinkBtn');
        this.elements.linkModal = document.getElementById('linkModal');
        this.elements.linkForm = document.getElementById('linkForm');
        this.elements.linkTitle = document.getElementById('linkTitle');
        this.elements.linkUrl = document.getElementById('linkUrl');
        this.elements.linkIcon = document.getElementById('linkIcon');
        this.elements.cancelLinkBtn = document.getElementById('cancelLinkBtn');

        // Calendar elements
        this.elements.calendarGrid = document.getElementById('calendarGrid');
        this.elements.currentMonthYear = document.getElementById('currentMonthYear');
        this.elements.prevMonthBtn = document.getElementById('prevMonthBtn');
        this.elements.nextMonthBtn = document.getElementById('nextMonthBtn');
        this.elements.todayBtn = document.getElementById('todayBtn');
        this.elements.calendarToggle = document.getElementById('calendarToggle');
        this.elements.calendarTypeLabel = document.getElementById('calendarTypeLabel');

        // Date Note Modal elements
        this.elements.dateNoteModal = document.getElementById('dateNoteModal');
        this.elements.dateNotesList = document.getElementById('dateNotesList');
        this.elements.addDateNoteBtn = document.getElementById('addDateNoteBtn');
        this.elements.closeDateNoteBtn = document.getElementById('closeDateNoteBtn');

        // Toast
        this.elements.toast = document.getElementById('toast');
    }

    /**
     * Setup all event listeners with Event Delegation
     */
    setupEventListeners() {
        // Search Form Submit
        if (this.elements.searchForm) {
            this.elements.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        // Search Options (Event Delegation)
        if (this.elements.searchOptions) {
            this.elements.searchOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    this.elements.searchOptions.forEach(opt => opt.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                });
            });
        }

        // Notes: Add Note Button
        if (this.elements.addNoteBtn) {
            this.elements.addNoteBtn.addEventListener('click', () => this.showNoteModal());
        }

        // Notes: Form Submit
        if (this.elements.noteForm) {
            this.elements.noteForm.addEventListener('submit', (e) => this.handleNoteSubmit(e));
        }

        // Notes: Cancel Button
        if (this.elements.cancelNoteBtn) {
            this.elements.cancelNoteBtn.addEventListener('click', () => this.closeAllModals());
        }

        // Notes: Character Counter
        if (this.elements.noteContent) {
            this.elements.noteContent.addEventListener('input', (e) => {
                const count = e.target.value.length;
                if (this.elements.charCount) {
                    this.elements.charCount.textContent = `${count} / 500`;
                }
            });
        }

        // Notes Container: Event Delegation for Edit/Delete
        if (this.elements.notesContainer) {
            this.elements.notesContainer.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.note-edit');
                const deleteBtn = e.target.closest('.note-delete');

                if (editBtn) {
                    const noteId = editBtn.dataset.id;
                    this.editNote(noteId);
                } else if (deleteBtn) {
                    const noteId = deleteBtn.dataset.id;
                    this.deleteNote(noteId);
                }
            });
        }

        // Quick Links: Add Link Button
        if (this.elements.addLinkBtn) {
            this.elements.addLinkBtn.addEventListener('click', () => this.showLinkModal());
        }

        // Quick Links: Form Submit
        if (this.elements.linkForm) {
            this.elements.linkForm.addEventListener('submit', (e) => this.handleLinkSubmit(e));
        }

        // Quick Links: Cancel Button
        if (this.elements.cancelLinkBtn) {
            this.elements.cancelLinkBtn.addEventListener('click', () => this.closeAllModals());
        }

        // Quick Links Container: Event Delegation for Edit/Delete
        if (this.elements.quickLinksContainer) {
            this.elements.quickLinksContainer.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.link-edit');
                const deleteBtn = e.target.closest('.link-delete');

                if (editBtn) {
                    const linkId = editBtn.dataset.id;
                    this.editLink(linkId);
                } else if (deleteBtn) {
                    const linkId = deleteBtn.dataset.id;
                    this.deleteLink(linkId);
                }
            });
        }

        // Calendar: Navigation Buttons
        if (this.elements.prevMonthBtn) {
            this.elements.prevMonthBtn.addEventListener('click', () => this.navigateMonth(-1));
        }
        if (this.elements.nextMonthBtn) {
            this.elements.nextMonthBtn.addEventListener('click', () => this.navigateMonth(1));
        }
        if (this.elements.todayBtn) {
            this.elements.todayBtn.addEventListener('click', () => this.goToToday());
        }

        // Calendar: Type Toggle
        if (this.elements.calendarToggle) {
            this.elements.calendarToggle.addEventListener('change', (e) => {
                this.state.currentCalendarType = e.target.checked ? 'jalali' : 'gregorian';
                this.renderCalendar();
            });
        }

        // Calendar Grid: Event Delegation for Date Clicks
        if (this.elements.calendarGrid) {
            this.elements.calendarGrid.addEventListener('click', (e) => {
                const dateCell = e.target.closest('.calendar-day[data-date]');
                if (dateCell && !dateCell.classList.contains('other-month')) {
                    const dateKey = dateCell.dataset.date;
                    this.showDateNoteModal(dateKey);
                }
            });
        }

        // Date Note Modal: Add Date Note Button
        if (this.elements.addDateNoteBtn) {
            this.elements.addDateNoteBtn.addEventListener('click', () => {
                const dateKey = this.elements.dateNoteModal?.dataset.currentDate;
                if (dateKey) {
                    // Close date modal and open note form
                    this.elements.dateNoteModal.classList.remove('active');
                    
                    // Mark that this note is for a specific date
                    this.elements.noteForm.dataset.dateContext = dateKey;
                    
                    this.showNoteModal();
                }
            });
        }

        // Date Note Modal: Close Button
        if (this.elements.closeDateNoteBtn) {
            this.elements.closeDateNoteBtn.addEventListener('click', () => {
                this.elements.dateNoteModal?.classList.remove('active');
            });
        }

        // Date Notes List: Event Delegation for Delete
        if (this.elements.dateNotesList) {
            this.elements.dateNotesList.addEventListener('click', (e) => {
                const deleteBtn = e.target.closest('.date-note-delete');
                if (deleteBtn) {
                    const noteId = deleteBtn.dataset.id;
                    const dateKey = this.elements.dateNoteModal?.dataset.currentDate;
                    if (dateKey) {
                        this.deleteDateNote(dateKey, noteId);
                    }
                }
            });
        }

        // Modal Background Click (Close modals)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
                this.closeAllModals();
            }
        });

        // Escape Key (Close modals)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    // ============================================
    // SEARCH FUNCTIONALITY
    // ============================================

    handleSearch(e) {
        e.preventDefault();
        
        const query = this.elements.searchInput?.value.trim();
        if (!query) {
            this.showToast('لطفاً عبارت جستجو را وارد کنید', 'error');
            return;
        }

        const activeOption = document.querySelector('.search-option.active');
        const searchEngine = activeOption?.dataset.engine || 'google';

        const searchUrls = {
            google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
            duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            yahoo: `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`
        };

        const url = searchUrls[searchEngine];
        if (url) {
            window.location.href = url;
        }
    }

    // ============================================
    // NOTES FUNCTIONALITY
    // ============================================

    showNoteModal(note = null) {
        if (!this.elements.noteModal) return;

        if (note) {
            // Edit mode
            this.elements.noteTitle.value = note.title;
            this.elements.noteContent.value = note.content;
            this.elements.noteForm.dataset.editId = note.id;
            if (this.elements.charCount) {
                this.elements.charCount.textContent = `${note.content.length} / 500`;
            }
        } else {
            // Create mode
            this.elements.noteForm?.reset();
            delete this.elements.noteForm?.dataset.editId;
            if (this.elements.charCount) {
                this.elements.charCount.textContent = '0 / 500';
            }
        }

        this.elements.noteModal.classList.add('active');
        this.elements.noteTitle?.focus();
    }

    handleNoteSubmit(e) {
        e.preventDefault();

        const title = this.elements.noteTitle?.value.trim();
        const content = this.elements.noteContent?.value.trim();

        if (!title || !content) {
            this.showToast('لطفاً عنوان و محتوا را وارد کنید', 'error');
            return;
        }

        if (content.length > 500) {
            this.showToast('محتوا نباید بیشتر از ۵۰۰ کاراکتر باشد', 'error');
            return;
        }

        const editId = this.elements.noteForm?.dataset.editId;
        const dateContext = this.elements.noteForm?.dataset.dateContext;

        // If this note is for a specific date
        if (dateContext) {
            this.addDateNote(dateContext, title, content);
            delete this.elements.noteForm.dataset.dateContext;
            this.closeAllModals();
            this.showDateNoteModal(dateContext); // Return to date modal
            return;
        }

        // Regular note
        if (editId) {
            // Edit existing note
            const index = this.state.notes.findIndex(n => n.id === editId);
            if (index !== -1) {
                this.state.notes[index] = {
                    ...this.state.notes[index],
                    title,
                    content,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // Create new note
            const newNote = {
                id: this.generateId(),
                title,
                content,
                createdAt: new Date().toISOString()
            };
            this.state.notes.push(newNote);
        }

        this.saveToStorage();
        this.renderNotes();
        this.closeAllModals();
        this.showToast('یادداشت با موفقیت ذخیره شد', 'success');
    }

    editNote(noteId) {
        const note = this.state.notes.find(n => n.id === noteId);
        if (note) {
            this.showNoteModal(note);
        }
    }

    deleteNote(noteId) {
        if (confirm('آیا از حذف این یادداشت اطمینان دارید؟')) {
            this.state.notes = this.state.notes.filter(n => n.id !== noteId);
            this.saveToStorage();
            this.renderNotes();
            this.showToast('یادداشت حذف شد', 'success');
        }
    }

    renderNotes() {
        if (!this.elements.notesContainer) return;

        if (this.state.notes.length === 0) {
            this.elements.notesContainer.innerHTML = `
                <div class="empty-state">
                    <p>هنوز یادداشتی ندارید</p>
                </div>
            `;
            return;
        }

        const notesHtml = this.state.notes.map(note => {
            const date = new Date(note.createdAt);
            const formattedDate = this.formatDate(date);
            
            return `
                <div class="note-card">
                    <div class="note-header">
                        <h3 class="note-title">${this.sanitizeHtml(note.title)}</h3>
                        <div class="note-actions">
                            <button class="note-edit" data-id="${note.id}" title="ویرایش">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="note-delete" data-id="${note.id}" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="note-content">${this.sanitizeHtml(note.content)}</p>
                    <div class="note-footer">
                        <span class="note-date">${formattedDate}</span>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.notesContainer.innerHTML = notesHtml;
    }

    // ============================================
    // QUICK ACCESS FUNCTIONALITY
    // ============================================

    showLinkModal(link = null) {
        if (!this.elements.linkModal) return;

        if (link) {
            // Edit mode
            this.elements.linkTitle.value = link.title;
            this.elements.linkUrl.value = link.url;
            this.elements.linkIcon.value = link.icon || '';
            this.elements.linkForm.dataset.editId = link.id;
        } else {
            // Create mode
            this.elements.linkForm?.reset();
            delete this.elements.linkForm?.dataset.editId;
        }

        this.elements.linkModal.classList.add('active');
        this.elements.linkTitle?.focus();
    }

    handleLinkSubmit(e) {
        e.preventDefault();

        const title = this.elements.linkTitle?.value.trim();
        let url = this.elements.linkUrl?.value.trim();
        const icon = this.elements.linkIcon?.value.trim();

        if (!title || !url) {
            this.showToast('لطفاً عنوان و آدرس را وارد کنید', 'error');
            return;
        }

        // Add https:// if protocol is missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            this.showToast('آدرس وارد شده معتبر نیست', 'error');
            return;
        }

        const editId = this.elements.linkForm?.dataset.editId;

        if (editId) {
            // Edit existing link
            const index = this.state.quickLinks.findIndex(l => l.id === editId);
            if (index !== -1) {
                this.state.quickLinks[index] = {
                    ...this.state.quickLinks[index],
                    title,
                    url,
                    icon: icon || null
                };
            }
        } else {
            // Create new link
            const newLink = {
                id: this.generateId(),
                title,
                url,
                icon: icon || null
            };
            this.state.quickLinks.push(newLink);
        }

        this.saveToStorage();
        this.renderQuickLinks();
        this.closeAllModals();
        this.showToast('لینک با موفقیت ذخیره شد', 'success');
    }

    editLink(linkId) {
        const link = this.state.quickLinks.find(l => l.id === linkId);
        if (link) {
            this.showLinkModal(link);
        }
    }

    deleteLink(linkId) {
        if (confirm('آیا از حذف این لینک اطمینان دارید؟')) {
            this.state.quickLinks = this.state.quickLinks.filter(l => l.id !== linkId);
            this.saveToStorage();
            this.renderQuickLinks();
            this.showToast('لینک حذف شد', 'success');
        }
    }

    renderQuickLinks() {
        if (!this.elements.quickLinksContainer) return;

        if (this.state.quickLinks.length === 0) {
            this.elements.quickLinksContainer.innerHTML = '';
            return;
        }

        const linksHtml = this.state.quickLinks.map(link => {
            const iconHtml = this.getLinkIcon(link);
            
            return `
                <div class="quick-link-item">
                    <a href="${this.sanitizeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="quick-link">
                        ${iconHtml}
                        <span class="quick-link-title">${this.sanitizeHtml(link.title)}</span>
                    </a>
                    <div class="quick-link-actions">
                        <button class="link-edit" data-id="${link.id}" title="ویرایش">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="link-delete" data-id="${link.id}" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.quickLinksContainer.innerHTML = linksHtml;
    }

    getLinkIcon(link) {
        if (link.icon) {
            // Check if it's an emoji (single character or emoji sequence)
            if (link.icon.length <= 2 || /\p{Emoji}/u.test(link.icon)) {
                return `<span class="quick-link-icon emoji">${link.icon}</span>`;
            }
            // Check if it's a URL
            if (link.icon.startsWith('http://') || link.icon.startsWith('https://')) {
                return `<img src="${this.sanitizeHtml(link.icon)}" alt="" class="quick-link-icon" onerror="this.src='https://www.google.com/s2/favicons?domain=${this.sanitizeHtml(link.url)}&sz=64'">`;
            }
        }
        
        // Fallback: Use Google's favicon service with S2 endpoint
        try {
            const urlObj = new URL(link.url);
            return `<img src="https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64" alt="" class="quick-link-icon">`;
        } catch {
            return `<span class="quick-link-icon emoji">🔗</span>`;
        }
    }

    // ============================================
    // CALENDAR FUNCTIONALITY
    // ============================================

    renderCalendar() {
        if (!this.elements.calendarGrid || !this.elements.currentMonthYear) return;

        const isJalali = this.state.currentCalendarType === 'jalali';
        
        if (isJalali && typeof window.JalaliDate === 'undefined') {
            this.showToast('کتابخانه تقویم شمسی بارگذاری نشده است', 'error');
            return;
        }

        if (isJalali) {
            this.renderJalaliCalendar();
        } else {
            this.renderGregorianCalendar();
        }

        // Update calendar type label
        if (this.elements.calendarTypeLabel) {
            this.elements.calendarTypeLabel.textContent = isJalali ? 'شمسی' : 'میلادی';
        }
    }

    renderGregorianCalendar() {
        const year = this.state.currentDate.getFullYear();
        const month = this.state.currentDate.getMonth();
        
        // Month names
        const monthNames = [
            'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
            'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'
        ];

        this.elements.currentMonthYear.textContent = `${monthNames[month]} ${year}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        let calendarHtml = '';
        let dayCount = 1;
        let nextMonthDay = 1;

        // 6 weeks x 7 days = 42 cells
        for (let i = 0; i < 42; i++) {
            const dayOfWeek = i % 7;
            
            if (i < firstDay) {
                // Previous month days
                const day = daysInPrevMonth - firstDay + i + 1;
                const prevMonth = month === 0 ? 11 : month - 1;
                const prevYear = month === 0 ? year - 1 : year;
                const dateKey = this.formatDateKey(new Date(prevYear, prevMonth, day));
                const hasNotes = this.state.dateNotes[dateKey] && this.state.dateNotes[dateKey].length > 0;
                
                calendarHtml += `
                    <div class="calendar-day other-month ${hasNotes ? 'has-notes' : ''}" data-date="${dateKey}">
                        ${day}
                    </div>
                `;
            } else if (dayCount <= daysInMonth) {
                // Current month days
                const dateKey = this.formatDateKey(new Date(year, month, dayCount));
                const isToday = this.isToday(new Date(year, month, dayCount));
                const hasNotes = this.state.dateNotes[dateKey] && this.state.dateNotes[dateKey].length > 0;
                
                calendarHtml += `
                    <div class="calendar-day ${isToday ? 'today' : ''} ${hasNotes ? 'has-notes' : ''}" data-date="${dateKey}">
                        ${dayCount}
                    </div>
                `;
                dayCount++;
            } else {
                // Next month days
                const nextMonth = month === 11 ? 0 : month + 1;
                const nextYear = month === 11 ? year + 1 : year;
                const dateKey = this.formatDateKey(new Date(nextYear, nextMonth, nextMonthDay));
                const hasNotes = this.state.dateNotes[dateKey] && this.state.dateNotes[dateKey].length > 0;
                
                calendarHtml += `
                    <div class="calendar-day other-month ${hasNotes ? 'has-notes' : ''}" data-date="${dateKey}">
                        ${nextMonthDay}
                    </div>
                `;
                nextMonthDay++;
            }
        }

        this.elements.calendarGrid.innerHTML = calendarHtml;
    }

    renderJalaliCalendar() {
        if (typeof window.JalaliDate === 'undefined') return;

        const jDate = this.toJalali(this.state.currentDate);
        const year = jDate.year;
        const month = jDate.month;

        const monthNames = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];

        this.elements.currentMonthYear.textContent = `${monthNames[month - 1]} ${year}`;

        // Get first day of month (0 = Saturday in Jalali)
        const firstDayGregorian = window.JalaliDate.jalaliToGregorian(year, month, 1);
        const firstDayDate = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
        const firstDay = (firstDayDate.getDay() + 1) % 7; // Convert to Jalali week (Sat = 0)

        // Days in current Jalali month
        const daysInMonth = month <= 6 ? 31 : (month <= 11 ? 30 : (this.isJalaliLeapYear(year) ? 30 : 29));

        // Days in previous Jalali month
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const daysInPrevMonth = prevMonth <= 6 ? 31 : (prevMonth <= 11 ? 30 : (this.isJalaliLeapYear(prevYear) ? 30 : 29));

        let calendarHtml = '';
        let dayCount = 1;
        let nextMonthDay = 1;

        for (let i = 0; i < 42; i++) {
            if (i < firstDay) {
                // Previous month
                const day = daysInPrevMonth - firstDay + i + 1;
                const gDate = window.JalaliDate.jalaliToGregorian(prevYear, prevMonth, day);
                const gregorianDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
                const dateKey = this.formatDateKey(gregorianDate);
                const hasNotes = this.state.dateNotes[dateKey] && this.state.dateNotes[dateKey].length > 0;
                
                calendarHtml += `
                    <div class="calendar-day other-month ${hasNotes ? 'has-notes' : ''}" data-date="${dateKey}">
                        ${day}
                    </div>
                `;
            } else if (dayCount <= daysInMonth) {
                // Current month
                const gDate = window.JalaliDate.jalaliToGregorian(year, month, dayCount);
                const gregorianDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
                const dateKey = this.formatDateKey(gregorianDate);
                const isToday = this.isToday(gregorianDate);
                const hasNotes = this.state.dateNotes[dateKey] && this.state.dateNotes[dateKey].length > 0;
                
                calendarHtml += `
                    <div class="calendar-day ${isToday ? 'today' : ''} ${hasNotes ? 'has-notes' : ''}" data-date="${dateKey}">
                        ${dayCount}
                    </div>
                `;
                dayCount++;
            } else {
                // Next month
                const nextMonth = month === 12 ? 1 : month + 1;
                const nextYear = month === 12 ? year + 1 : year;
                const gDate = window.JalaliDate.jalaliToGregorian(nextYear, nextMonth, nextMonthDay);
                const gregorianDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
                const dateKey = this.formatDateKey(gregorianDate);
                const hasNotes = this.state.dateNotes[dateKey] && this.state.dateNotes[dateKey].length > 0;
                
                calendarHtml += `
                    <div class="calendar-day other-month ${hasNotes ? 'has-notes' : ''}" data-date="${dateKey}">
                        ${nextMonthDay}
                    </div>
                `;
                nextMonthDay++;
            }
        }

        this.elements.calendarGrid.innerHTML = calendarHtml;
    }

    navigateMonth(direction) {
        if (this.state.currentCalendarType === 'jalali' && typeof window.JalaliDate !== 'undefined') {
            const jDate = this.toJalali(this.state.currentDate);
            let newMonth = jDate.month + direction;
            let newYear = jDate.year;

            if (newMonth < 1) {
                newMonth = 12;
                newYear--;
            } else if (newMonth > 12) {
                newMonth = 1;
                newYear++;
            }

            const gDate = window.JalaliDate.jalaliToGregorian(newYear, newMonth, 1);
            this.state.currentDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
        } else {
            this.state.currentDate = new Date(
                this.state.currentDate.getFullYear(),
                this.state.currentDate.getMonth() + direction,
                1
            );
        }

        this.renderCalendar();
    }

    goToToday() {
        this.state.currentDate = new Date();
        this.renderCalendar();
    }

    // ============================================
    // DATE NOTES FUNCTIONALITY
    // ============================================

    showDateNoteModal(dateKey) {
        if (!this.elements.dateNoteModal) return;

        this.elements.dateNoteModal.dataset.currentDate = dateKey;
        
        const date = new Date(dateKey);
        const formattedDate = this.formatDate(date, true);
        
        const modalTitle = this.elements.dateNoteModal.querySelector('.date-note-modal-title');
        if (modalTitle) {
            modalTitle.textContent = `یادداشت‌های ${formattedDate}`;
        }

        this.renderDateNotes(dateKey);
        this.elements.dateNoteModal.classList.add('active');
    }

    addDateNote(dateKey, title, content) {
        if (!this.state.dateNotes[dateKey]) {
            this.state.dateNotes[dateKey] = [];
        }

        const newNote = {
            id: this.generateId(),
            title,
            content,
            createdAt: new Date().toISOString()
        };

        this.state.dateNotes[dateKey].push(newNote);
        this.saveToStorage();
        this.renderCalendar(); // Update calendar to show note indicator
        this.notifyCalendarUpdate(); // Notify calendar component
        this.showToast('یادداشت تاریخ با موفقیت اضافه شد', 'success');
    }

    deleteDateNote(dateKey, noteId) {
        if (confirm('آیا از حذف این یادداشت اطمینان دارید؟')) {
            if (this.state.dateNotes[dateKey]) {
                this.state.dateNotes[dateKey] = this.state.dateNotes[dateKey].filter(n => n.id !== noteId);
                
                if (this.state.dateNotes[dateKey].length === 0) {
                    delete this.state.dateNotes[dateKey];
                }
                
                this.saveToStorage();
                this.renderDateNotes(dateKey);
                this.renderCalendar();
                this.notifyCalendarUpdate();
                this.showToast('یادداشت حذف شد', 'success');
            }
        }
    }

    renderDateNotes(dateKey) {
        if (!this.elements.dateNotesList) return;

        const notes = this.state.dateNotes[dateKey] || [];

        if (notes.length === 0) {
            this.elements.dateNotesList.innerHTML = `
                <div class="empty-state">
                    <p>هنوز یادداشتی برای این روز ندارید</p>
                </div>
            `;
            return;
        }

        const notesHtml = notes.map(note => `
            <div class="date-note-item">
                <div class="date-note-header">
                    <h4>${this.sanitizeHtml(note.title)}</h4>
                    <button class="date-note-delete" data-id="${note.id}" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p class="date-note-content">${this.sanitizeHtml(note.content)}</p>
            </div>
        `).join('');

        this.elements.dateNotesList.innerHTML = notesHtml;
    }

    /**
     * Notify other components about calendar updates (decoupled integration)
     */
    notifyCalendarUpdate() {
        const event = new CustomEvent('calendarUpdate', {
            detail: { dateNotes: this.state.dateNotes }
        });
        document.dispatchEvent(event);
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    updateDateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('fa-IR', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        
        document.querySelectorAll('.current-time').forEach(el => {
            el.textContent = timeString;
        });
    }

    formatDate(date, longFormat = false) {
        if (this.state.currentCalendarType === 'jalali' && typeof window.JalaliDate !== 'undefined') {
            const jDate = this.toJalali(date);
            const monthNames = [
                'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
            ];
            
            if (longFormat) {
                return `${jDate.day} ${monthNames[jDate.month - 1]} ${jDate.year}`;
            }
            return `${jDate.year}/${jDate.month}/${jDate.day}`;
        }
        
        if (longFormat) {
            return date.toLocaleDateString('fa-IR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        return date.toLocaleDateString('fa-IR');
    }

    formatDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}-${day}`;
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
}

// ============================================
// INITIALIZE APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DastyarApp();
});
