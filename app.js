// Main Application Controller (SchoolHub Dashboard & Portal)

class SchoolHubApp {
    constructor() {
        this.currentView = 'homepage';
        this.currentRole = 'Admin'; 
        this.activeUser = { name: 'ผู้ดูแลระบบ', role: 'Administrator', avatar: 'AD' };
        
        // CMS States
        this.cmsEditMode = false;
        this.homepageConfigs = {};
        
        // Banner state
        this.activeBannerIndex = 0;
        this.bannerInterval = null;

        // Cache DOM elements
        this.appContainer = document.getElementById('app-container');
        this.viewport = document.getElementById('page-viewport');
        this.roleSwitcher = document.getElementById('role-switcher');
        this.themeToggle = document.getElementById('theme-toggle');
        this.userDisplayName = document.getElementById('user-display-name');
        this.userDisplayRole = document.getElementById('user-display-role');
        this.userAvatar = document.getElementById('user-avatar');
        this.globalSearch = document.getElementById('global-search');
        this.cmsToggleWrapper = document.getElementById('cms-toggle-wrapper');
        this.cmsToggleBtn = document.getElementById('cms-toggle-btn');
        this.btnLoginPublic = document.getElementById('btn-login-public');
        this.topNavLinks = document.getElementById('top-nav-links');

        // Modal elements
        this.modalBackdrop = document.getElementById('modal-backdrop');
        this.modalTitle = document.getElementById('modal-title');
        this.modalBody = document.getElementById('modal-body');
        this.modalForm = document.getElementById('modal-form');
        this.modalClose = document.getElementById('modal-close');
        this.modalBtnCancel = document.getElementById('modal-btn-cancel');
    }

    // Initialize App
    async init() {
        // 1. Initialize database service
        await window.dbService.init();
        this.updateDatabaseStatusUI();
        
        // Load CMS Configs
        this.homepageConfigs = await window.dbService.getHomepageConfigs();
        
        // 2. Set up event listeners
        this.setupEventListeners();
        
        // 3. Initialize theme
        this.initTheme();
        
        // 4. Initial role sync from sessionStorage
        const savedRole = sessionStorage.getItem('user_role');
        if (savedRole) {
            this.handleRoleChange(savedRole);
            if (this.roleSwitcher) this.roleSwitcher.value = savedRole;
        } else {
            this.currentRole = null;
        }
        
        // 5. Render top navigation bar
        await this.renderTopNav();
        
        // 6. Initial routing
        this.handleRouting();
    }

    // Setup global listeners
    setupEventListeners() {
        // Hash navigation
        window.addEventListener('hashchange', () => this.handleRouting());
        
        // Sidebar item clicking
        document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const target = item.getAttribute('data-target');
                window.location.hash = target;
            });
        });
        
        // Role switcher
        if (this.roleSwitcher) {
            this.roleSwitcher.addEventListener('change', (e) => {
                this.handleRoleChange(e.target.value);
            });
        }
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Modal cancel/close
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modalBtnCancel.addEventListener('click', () => this.closeModal());
        
        // Global search input keyup
        this.globalSearch.addEventListener('input', (e) => {
            this.handleGlobalSearch(e.target.value.trim().toLowerCase());
        });

        // CMS Toggle Button
        this.cmsToggleBtn.addEventListener('click', () => {
            this.toggleCmsEditMode();
        });

        // Logout Button
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                sessionStorage.removeItem('user_role');
                this.currentRole = null;
                window.location.hash = 'homepage';
            });
        }
    }

    // Initialize Theme
    initTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeButtonIcon(theme);
    }

    // Toggle Light/Dark Theme
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeButtonIcon(newTheme);
    }

    updateThemeButtonIcon(theme) {
        const sunIcon = document.getElementById('theme-icon-sun');
        const moonIcon = document.getElementById('theme-icon-moon');
        
        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }

    // Update DB status UI
    updateDatabaseStatusUI() {
        const dot = document.getElementById('db-status-dot');
        const text = document.getElementById('db-status-text');
        const badge = document.getElementById('db-status-badge');
        
        if (window.dbService.demoMode) {
            dot.className = "status-dot status-demo";
            text.textContent = "โหมดจำลอง (Local)";
            badge.title = "ระบบใช้ LocalStorage บันทึกข้อมูลตั้งค่า Supabase เพิ่มในหน้าการตั้งค่าได้";
        } else {
            dot.className = "status-dot status-online";
            text.textContent = "Supabase เชื่อมต่อแล้ว";
            badge.title = `เชื่อมต่อ Supabase แล้ว: ${window.dbService.dbConfig.url}`;
        }
    }

    // Toggle CMS Live Edit Mode
    toggleCmsEditMode() {
        this.cmsEditMode = !this.cmsEditMode;
        if (this.cmsEditMode) {
            this.cmsToggleBtn.classList.add('active');
            this.cmsToggleBtn.querySelector('span').textContent = 'ปิดโหมดแก้ไขสด';
            document.body.classList.add('cms-edit-active');
        } else {
            this.cmsToggleBtn.classList.remove('active');
            this.cmsToggleBtn.querySelector('span').textContent = 'เปิดโหมดแก้ไขสด';
            document.body.classList.remove('cms-edit-active');
        }
        this.renderView(this.currentView);
    }

    // Handle user role swapping (simulator & session sync)
    handleRoleChange(role) {
        this.currentRole = role;
        sessionStorage.setItem('user_role', role);
        
        if (role === 'Admin') {
            this.activeUser = { name: 'ผู้ดูแลระบบ', role: 'Administrator', avatar: 'AD' };
            this.cmsToggleWrapper.style.display = 'block';
        } else if (role === 'Teacher') {
            this.activeUser = { name: 'ครูสมศักดิ์ รักเรียน', role: 'คุณครูผู้สอน', avatar: 'T' };
            this.cmsToggleWrapper.style.display = 'none';
        } else if (role === 'Student') {
            // Simulator only fallback - redirect students back to homepage
            this.activeUser = { name: 'เด็กชายวิชัย ใจกล้า', role: 'นักเรียน / ผู้ปกครอง', avatar: 'S' };
            this.cmsToggleWrapper.style.display = 'none';
            sessionStorage.removeItem('user_role');
            this.currentRole = null;
            window.location.hash = 'homepage';
            return;
        }
        
        if (this.userDisplayName) this.userDisplayName.textContent = this.activeUser.name;
        if (this.userDisplayRole) this.userDisplayRole.textContent = this.activeUser.role;
        if (this.userAvatar) this.userAvatar.textContent = this.activeUser.avatar;

        // Menu visibility based on roles inside Sidebar
        document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
            const allowedRoles = item.getAttribute('data-roles');
            if (allowedRoles) {
                const rolesArray = allowedRoles.split(',');
                item.style.display = rolesArray.includes(role) ? 'block' : 'none';
            } else {
                item.style.display = 'block';
            }
        });

        // Validate backend view restrictions for current role
        const isBackendView = this.currentView.startsWith('backend/');
        if (isBackendView) {
            const renderKey = this.currentView.replace('backend/', '');
            const adminOnlyKeys = ['teachers', 'classes', 'pages', 'navigation'];
            if (role === 'Teacher' && adminOnlyKeys.includes(renderKey)) {
                window.location.hash = 'backend/dashboard';
            } else {
                this.handleRouting();
            }
        } else {
            this.handleRouting();
        }
    }

    // Routing based on hash
    handleRouting() {
        const hash = window.location.hash.substring(1) || 'homepage';
        this.currentView = hash;

        // Reset banner interval if moving away from homepage
        if (hash !== 'homepage' && this.bannerInterval) {
            clearInterval(this.bannerInterval);
            this.bannerInterval = null;
        }

        const isBackend = hash.startsWith('backend/');
        const sessionRole = sessionStorage.getItem('user_role');

        if (isBackend) {
            // AUTH GUARD: Redirect to login if no session exists
            if (!sessionRole) {
                window.location.hash = 'login';
                return;
            }

            // Verify role access for backend page
            const renderKey = hash.replace('backend/', '');
            const adminOnlyKeys = ['teachers', 'classes', 'pages', 'navigation'];
            if (sessionRole === 'Teacher' && adminOnlyKeys.includes(renderKey)) {
                window.location.hash = 'backend/dashboard';
                return;
            }

            this.currentRole = sessionRole;
            if (this.roleSwitcher) this.roleSwitcher.value = sessionRole;
            this.handleRoleChange(sessionRole); // Ensure menu and user details are synced

            // Show backend layout
            document.body.classList.remove('public-route', 'login-active');
            this.appContainer.classList.remove('sidebar-hidden');
            if (this.cmsToggleWrapper) this.cmsToggleWrapper.style.display = (sessionRole === 'Admin') ? 'block' : 'none';
            if (this.btnLoginPublic) this.btnLoginPublic.style.display = 'none';

        } else if (hash === 'login') {
            // Redirect to backend dashboard if already logged in
            if (sessionRole) {
                window.location.hash = 'backend/dashboard';
                return;
            }

            // Set login layout
            document.body.classList.remove('public-route');
            document.body.classList.add('login-active');
            this.appContainer.classList.add('sidebar-hidden');
            if (this.btnLoginPublic) this.btnLoginPublic.style.display = 'none';

        } else {
            // Public Route layout
            document.body.classList.add('public-route');
            document.body.classList.remove('login-active');
            this.appContainer.classList.add('sidebar-hidden');

            // Set login/backoffice button state
            if (this.btnLoginPublic) {
                this.btnLoginPublic.style.display = 'inline-flex';
                if (sessionRole) {
                    this.btnLoginPublic.innerHTML = `<i data-lucide="layout-dashboard" style="width: 14px; height: 14px;"></i><span>ระบบหลังบ้าน</span>`;
                    this.btnLoginPublic.href = '#backend/dashboard';
                } else {
                    this.btnLoginPublic.innerHTML = `<i data-lucide="log-in" style="width: 14px; height: 14px;"></i><span>เข้าสู่ระบบ</span>`;
                    this.btnLoginPublic.href = '#login';
                }
            }
        }

        // Highlight active Top Navigation Link
        document.querySelectorAll('.top-nav-links .top-nav-item').forEach(item => {
            const dataNav = item.getAttribute('data-nav');
            item.classList.toggle('active', dataNav === hash);
        });

        // Highlight active Sidebar Menu item
        document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-target') === hash);
        });

        this.renderView(hash);
    }

    async renderView(view) {
        this.viewport.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:300px; color:var(--text-muted);">
            <i data-lucide="loader" class="animate-spin" style="width: 32px; height: 32px; margin-right: 8px;"></i>
            <span>กำลังโหลดข้อมูล...</span>
        </div>`;
        lucide.createIcons();

        try {
            // Check for pages/:id routing
            if (view.startsWith('pages/')) {
                const pageId = view.split('/')[1];
                await this.renderPage(pageId);
                lucide.createIcons();
                return;
            }

            // Strip "backend/" prefix if present
            let renderKey = view;
            if (view.startsWith('backend/')) {
                renderKey = view.replace('backend/', '');
            }

            switch(renderKey) {
                case 'homepage':
                    await this.renderHomepage();
                    break;
                case 'login':
                    await this.renderLogin();
                    break;
                case 'dashboard':
                    await this.renderDashboard();
                    break;
                case 'students':
                    await this.renderStudents();
                    break;
                case 'teachers':
                    await this.renderTeachers();
                    break;
                case 'classes':
                    await this.renderClassesAndSubjects();
                    break;
                case 'attendance':
                    await this.renderAttendance();
                    break;
                case 'grades':
                    await this.renderGrades();
                    break;
                case 'budgeting':
                    await this.renderBudgeting();
                    break;
                case 'medialibrary':
                    await this.renderMediaLibrary();
                    break;
                case 'pages':
                    await this.renderBackendPages();
                    break;
                case 'navigation':
                    await this.renderBackendNavigation();
                    break;
                case 'settings':
                    await this.renderSettings();
                    break;
                default:
                    this.viewport.innerHTML = `<div style="padding:4rem; text-align:center;"><h2>404 ไม่พบหน้าเพจที่ต้องการ</h2><a href="#homepage" class="btn btn-primary" style="margin-top:1rem;">กลับสู่หน้าหลัก</a></div>`;
            }
            lucide.createIcons();
        } catch (error) {
            console.error("View rendering error:", error);
            this.viewport.innerHTML = `
                <div class="card" style="border-color: var(--color-danger); text-align: center; padding: 3rem;">
                    <i data-lucide="alert-triangle" style="width: 48px; height: 48px; color: var(--color-danger); margin: 0 auto 1rem auto;"></i>
                    <h2 style="color: var(--color-danger); margin-bottom: 0.5rem;">การเชื่อมต่อฐานข้อมูลล้มเหลว</h2>
                    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">ระบบไม่สามารถดึงข้อมูลได้: ${error.message || error}</p>
                    <button class="btn btn-primary" onclick="location.reload()">ลองใหม่</button>
                </div>
            `;
            lucide.createIcons();
        }
    }

    // =========================================================================
    // 1. HOMEPAGE PORTAL VIEW RENDERER (CMS SUPPORTED)
    // =========================================================================
    async renderHomepage() {
        const banners = await window.dbService.getBanners();
        const news = await window.dbService.getNewsActivities();
        const newsletters = await window.dbService.getPrNewsletters();
        const executives = await window.dbService.getExecutives();
        const links = await window.dbService.getQuickLinks();
        
        this.homepageConfigs = await window.dbService.getHomepageConfigs();
        const isVisible = (key) => this.homepageConfigs[key] !== false || this.cmsEditMode;

        const renderCmsControls = (key, title, addBtnId = '', addBtnText = '') => {
            if (!this.cmsEditMode) return '';
            const checked = this.homepageConfigs[key] !== false ? 'checked' : '';
            return `
                <div class="cms-section-control">
                    <span>${title}</span>
                    <label class="switch-control" title="เปิด/ปิดการแสดงผลหน้าเว็บ">
                        <input type="checkbox" ${checked} class="cms-section-toggle" data-section="${key}">
                        <span class="switch-slider"></span>
                    </label>
                    ${addBtnId ? `<button type="button" class="cms-btn-action" id="${addBtnId}"><i data-lucide="plus" style="width:12px;height:12px;"></i> ${addBtnText}</button>` : ''}
                </div>
            `;
        };

        let portalHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>ประชาสัมพันธ์โรงเรียน</h1>
                    <p>ยินดีต้อนรับสู่หน้าพอร์ทัลหลักอย่างเป็นทางการ</p>
                </div>
            </div>
        `;

        // 1. Banner Carousel Section
        if (isVisible('banner')) {
            const displayStyle = this.homepageConfigs['banner'] === false ? 'style="opacity: 0.5;"' : '';
            let bannerSlidesHTML = '';
            let dotsHTML = '';
            
            if (banners.length === 0) {
                bannerSlidesHTML = `
                    <div class="banner-slide">
                        <img src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80">
                        <div class="banner-overlay">
                            <h2 class="banner-title">ยินดีต้อนรับสู่ระบบ SchoolHub Portal</h2>
                        </div>
                    </div>
                `;
            } else {
                banners.forEach((b, index) => {
                    bannerSlidesHTML += `
                        <div class="banner-slide">
                            <img src="${b.image_url}" onerror="this.src='https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80'">
                            <div class="banner-overlay">
                                <h2 class="banner-title">${b.title}</h2>
                                ${this.cmsEditMode ? `<button class="btn btn-danger btn-sm btn-delete-banner" data-id="${b.id}" style="margin-top:0.5rem; padding: 0.2rem 0.5rem;"><i data-lucide="trash-2" style="width:12px;height:12px;"></i> ลบ</button>` : ''}
                            </div>
                        </div>
                    `;
                    dotsHTML += `<button class="banner-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></button>`;
                });
            }

            portalHTML += `
                <div class="cms-editable-section" ${displayStyle}>
                    ${renderCmsControls('banner', 'แบนเนอร์สไลด์', 'btn-add-banner-cms', 'เพิ่มแบนเนอร์')}
                    <div class="portal-banner">
                        <div class="banner-track" id="banner-track" style="transform: translateX(0%);">
                            ${bannerSlidesHTML}
                        </div>
                        <div class="banner-controls" id="banner-controls">
                            ${dotsHTML}
                        </div>
                    </div>
                </div>
            `;
        }

        // 2. Main Columns Layout: Left (72%) vs Right (28%)
        portalHTML += `<div class="homepage-grid">`;

        // LEFT COLUMN (72%)
        portalHTML += `<div class="homepage-left-col" style="display: flex; flex-direction: column; gap: 2rem;">`;

        // A. News & Activities Section
        if (isVisible('news_activities')) {
            const displayStyle = this.homepageConfigs['news_activities'] === false ? 'style="opacity: 0.5;"' : '';
            let newsCardsHTML = '';
            if (news.length === 0) {
                newsCardsHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color:var(--text-muted);">ไม่มีข้อมูลข่าวกิจกรรม</div>`;
            } else {
                news.forEach(n => {
                    newsCardsHTML += `
                        <div class="news-item-card">
                            <div class="news-item-img">
                                <img src="${n.image_url || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80'}" onerror="this.src='https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80'">
                            </div>
                            <div class="news-item-body">
                                <div class="news-item-date">
                                    <i data-lucide="calendar" style="width:12px;height:12px;"></i> ${n.date}
                                </div>
                                <h3 class="news-item-title">${n.title}</h3>
                                <p class="news-item-excerpt">${n.content}</p>
                                ${this.cmsEditMode ? `
                                    <div class="news-item-actions">
                                        <button class="btn btn-danger btn-sm btn-delete-news" data-id="${n.id}">
                                            <i data-lucide="trash-2" style="width:12px;height:12px;"></i> ลบข่าว
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
            }

            portalHTML += `
                <div class="cms-editable-section card" ${displayStyle}>
                    ${renderCmsControls('news_activities', 'ข่าวกิจกรรม', 'btn-add-news-cms', 'เพิ่มข่าวใหม่')}
                    <div class="card-header" style="margin-bottom:0.5rem;">
                        <h2><i data-lucide="newspaper" style="color:var(--color-primary);"></i> ข่าวสารและกิจกรรมโรงเรียน</h2>
                    </div>
                    <div class="news-bulletin-grid">
                        ${newsCardsHTML}
                    </div>
                </div>
            `;
        }

        // B. PR Newsletters Section
        if (isVisible('pr_newsletters')) {
            const displayStyle = this.homepageConfigs['pr_newsletters'] === false ? 'style="opacity: 0.5;"' : '';
            let newslettersHTML = '';
            if (newsletters.length === 0) {
                newslettersHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">ไม่มีจดหมายข่าวประชาสัมพันธ์</div>`;
            } else {
                newsletters.forEach(letter => {
                    newslettersHTML += `
                        <div class="newsletter-card">
                            <img class="newsletter-thumbnail" src="${letter.image_url}" onerror="this.src='https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=500&q=80'">
                            <div class="newsletter-title">${letter.title}</div>
                            <div class="newsletter-actions">
                                <a href="${letter.file_url || '#'}" target="_blank" class="btn btn-secondary btn-sm" style="padding:0.25rem 0.5rem; font-size:0.75rem;">
                                    <i data-lucide="download" style="width:12px;height:12px;"></i> ดาวน์โหลด
                                </a>
                                ${this.cmsEditMode ? `
                                    <button class="btn btn-danger btn-sm btn-delete-newsletter" data-id="${letter.id}" style="padding:0.25rem 0.5rem; font-size:0.75rem;">
                                        <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
            }

            portalHTML += `
                <div class="cms-editable-section card" ${displayStyle}>
                    ${renderCmsControls('pr_newsletters', 'จดหมายข่าว', 'btn-add-newsletter-cms', 'เพิ่มจดหมายข่าว')}
                    <div class="card-header" style="margin-bottom:0.5rem;">
                        <h2><i data-lucide="megaphone" style="color:var(--color-success);"></i> จดหมายข่าวประชาสัมพันธ์</h2>
                    </div>
                    <div class="newsletter-pr-grid">
                        ${newslettersHTML}
                    </div>
                </div>
            `;
        }

        // C. Facebook Page Section
        if (isVisible('facebook_embed')) {
            const displayStyle = this.homepageConfigs['facebook_embed'] === false ? 'style="opacity: 0.5;"' : '';
            portalHTML += `
                <div class="cms-editable-section" ${displayStyle}>
                    ${renderCmsControls('facebook_embed', 'กล่องเฟสบุ๊ค')}
                    <div class="fb-simulated-box">
                        <div class="fb-header">
                            <div class="fb-header-left">
                                <div class="fb-logo-mock">f</div>
                                <div class="fb-title-mock">โรงเรียนพัฒนาการศึกษาขั้นพื้นฐาน (Facebook)</div>
                            </div>
                            <button class="fb-btn-like" onclick="window.open('https://facebook.com', '_blank')">
                                <i data-lucide="thumbs-up" style="width:14px;height:14px;"></i> ติดตามเพจ
                            </button>
                        </div>
                        <div class="fb-body">
                            <div class="fb-post">
                                <div class="fb-post-header">
                                    <div class="fb-post-avatar">🏫</div>
                                    <div class="fb-post-meta">
                                        <span class="fb-post-author">โรงเรียนพัฒนาการศึกษาขั้นพื้นฐาน</span>
                                        <span class="fb-post-time">1 ชั่วโมงที่แล้ว</span>
                                    </div>
                                </div>
                                <div class="fb-post-content">
                                    ประชาสัมพันธ์: กำหนดการแจกสมุดบัญชีรายรับ-จ่ายเงินเพื่อการศึกษา และการเข้าเรียนในวันพรุ่งนี้ ขอให้คุณครูและผู้ปกครองสลับบทบาทตรวจผลได้ในระบบของพอร์ทัลเว็บไซต์ครับ
                                </div>
                            </div>
                            <div class="fb-post">
                                <div class="fb-post-header">
                                    <div class="fb-post-avatar">🏫</div>
                                    <div class="fb-post-meta">
                                        <span class="fb-post-author">โรงเรียนพัฒนาการศึกษาขั้นพื้นฐาน</span>
                                        <span class="fb-post-time">เมื่อวานนี้</span>
                                    </div>
                                </div>
                                <div class="fb-post-content">
                                    ขอแสดงความยินดีกับกลุ่มสาระวิทยาศาสตร์ที่ได้พัฒนา "คลังสื่อการเรียนรู้ออนไลน์" เพื่อให้นักเรียน ม.1 - ม.6 ดาวน์โหลดใบงานและเข้าดูคลิปทบทวนความรู้ได้ทุกวิชา! 💻📚
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        portalHTML += `</div>`; // End Left Column

        // RIGHT COLUMN (28% SIDEBAR)
        portalHTML += `<div class="homepage-right-col" style="display: flex; flex-direction: column; gap: 2rem;">`;

        // A. Executive Board Section
        if (isVisible('executives')) {
            const displayStyle = this.homepageConfigs['executives'] === false ? 'style="opacity: 0.5;"' : '';
            let execsHTML = '';
            if (executives.length === 0) {
                execsHTML = `<div style="text-align:center; padding:1rem; color:var(--text-muted);">ไม่มีข้อมูลผู้บริหาร</div>`;
            } else {
                executives.forEach(ex => {
                    execsHTML += `
                        <div class="executive-sidebar-card">
                            <div class="executive-sidebar-avatar">
                                <img src="${ex.image_url}" onerror="this.src='https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'">
                            </div>
                            <div class="executive-sidebar-info">
                                <span class="executive-sidebar-name">${ex.name}</span>
                                <span class="executive-sidebar-position">${ex.position}</span>
                            </div>
                            ${this.cmsEditMode ? `
                                <div class="executive-sidebar-actions">
                                    <button class="btn btn-danger btn-sm btn-delete-executive" data-id="${ex.id}" style="padding: 2px 5px;">
                                        <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
            }

            portalHTML += `
                <div class="cms-editable-section card" ${displayStyle}>
                    ${renderCmsControls('executives', 'ทำเนียบผู้บริหาร', 'btn-add-executive-cms', 'เพิ่มผู้บริหาร')}
                    <div class="card-header" style="margin-bottom:1rem; padding-bottom:0.5rem;">
                        <h2><i data-lucide="user-check" style="color:var(--color-primary);"></i> ผู้บริหารโรงเรียน</h2>
                    </div>
                    <div class="executives-sidebar-list">
                        ${execsHTML}
                    </div>
                </div>
            `;
        }

        // B. Quick Links Section
        if (isVisible('quick_links')) {
            const displayStyle = this.homepageConfigs['quick_links'] === false ? 'style="opacity: 0.5;"' : '';
            const agencyLinks = links.filter(l => l.type === 'agency');
            let linksHTML = '';
            if (agencyLinks.length === 0) {
                linksHTML = `<div style="text-align:center; padding:0.5rem; color:var(--text-muted); font-size:0.8rem;">ไม่มีลิงก์หน่วยงาน</div>`;
            } else {
                agencyLinks.forEach(l => {
                    linksHTML += `
                        <div class="executive-sidebar-card" style="padding:0.6rem; align-items:center; gap:0.5rem;">
                            <a href="${l.url}" target="_blank" class="link-sidebar-label" style="flex:1;">
                                <i data-lucide="${l.icon || 'link'}" style="width:16px;height:16px;color:var(--color-primary);flex-shrink:0;"></i>
                                <span>${l.name}</span>
                            </a>
                            ${this.cmsEditMode ? `
                                <button class="btn btn-danger btn-sm btn-delete-link" data-id="${l.id}" style="padding: 2px 4px; font-size:0.7rem;">
                                    <i data-lucide="trash-2" style="width:10px;height:10px;"></i>
                                </button>
                            ` : ''}
                        </div>
                    `;
                });
            }

            portalHTML += `
                <div class="cms-editable-section card" ${displayStyle}>
                    ${renderCmsControls('quick_links', 'ลิงก์หน่วยงาน', 'btn-add-link-agency-cms', 'เพิ่มลิงก์')}
                    <div class="card-header" style="margin-bottom:1rem; padding-bottom:0.5rem;">
                        <h2><i data-lucide="globe" style="color:var(--color-info);"></i> ลิงก์หน่วยงาน</h2>
                    </div>
                    <div class="links-sidebar-list">
                        ${linksHTML}
                    </div>
                </div>
            `;
        }

        // C. E-Services Section
        if (isVisible('eservices')) {
            const displayStyle = this.homepageConfigs['eservices'] === false ? 'style="opacity: 0.5;"' : '';
            const eserviceLinks = links.filter(l => l.type === 'eservice');
            let eservicesHTML = '';
            if (eserviceLinks.length === 0) {
                eservicesHTML = `<div style="text-align:center; padding:0.5rem; color:var(--text-muted); font-size:0.8rem;">ไม่มีลิงก์บริการ E-Service</div>`;
            } else {
                eserviceLinks.forEach(l => {
                    eservicesHTML += `
                        <div class="executive-sidebar-card" style="padding:0.6rem; align-items:center; gap:0.5rem;">
                            <a href="${l.url}" target="_blank" class="link-sidebar-label" style="flex:1;">
                                <i data-lucide="${l.icon || 'link'}" style="width:16px;height:16px;color:var(--color-warning);flex-shrink:0;"></i>
                                <span>${l.name}</span>
                            </a>
                            ${this.cmsEditMode ? `
                                <button class="btn btn-danger btn-sm btn-delete-link" data-id="${l.id}" style="padding: 2px 4px; font-size:0.7rem;">
                                    <i data-lucide="trash-2" style="width:10px;height:10px;"></i>
                                </button>
                            ` : ''}
                        </div>
                    `;
                });
            }

            portalHTML += `
                <div class="cms-editable-section card" ${displayStyle}>
                    ${renderCmsControls('eservices', 'บริการ E-Services', 'btn-add-link-eservice-cms', 'เพิ่มลิงก์')}
                    <div class="card-header" style="margin-bottom:1rem; padding-bottom:0.5rem;">
                        <h2><i data-lucide="cpu" style="color:var(--color-warning);"></i> บริการ E-Services</h2>
                    </div>
                    <div class="links-sidebar-list">
                        ${eservicesHTML}
                    </div>
                </div>
            `;
        }

        portalHTML += `</div>`; // End Right Column
        portalHTML += `</div>`; // End Grid

        this.viewport.innerHTML = portalHTML;
        this.initBannerSlider(banners.length);

        if (this.cmsEditMode) {
            this.bindCmsEditModeActions();
        }
    }

    initBannerSlider(slideCount) {
        if (slideCount <= 1) return;
        const track = document.getElementById('banner-track');
        const dots = document.querySelectorAll('.banner-dot');
        this.activeBannerIndex = 0;

        const updateSlider = (index) => {
            this.activeBannerIndex = index;
            if (track) track.style.transform = `translateX(-${index * 100}%)`;
            dots.forEach((dot, idx) => dot.classList.toggle('active', idx === index));
        };

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const idx = parseInt(dot.getAttribute('data-index'));
                updateSlider(idx);
            });
        });

        if (this.bannerInterval) clearInterval(this.bannerInterval);
        this.bannerInterval = setInterval(() => {
            let nextIndex = this.activeBannerIndex + 1;
            if (nextIndex >= slideCount) nextIndex = 0;
            updateSlider(nextIndex);
        }, 4000);
    }

    bindCmsEditModeActions() {
        document.querySelectorAll('.cms-section-toggle').forEach(toggle => {
            toggle.addEventListener('change', async () => {
                const key = toggle.getAttribute('data-section');
                const visible = toggle.checked;
                await window.dbService.updateHomepageConfigVisibility(key, visible);
                const parent = toggle.closest('.cms-editable-section');
                if (parent) parent.style.opacity = visible ? '1' : '0.5';
            });
        });

        document.querySelectorAll('.btn-delete-banner').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm("ลบแบนเนอร์?")) {
                    await window.dbService.deleteBanner(btn.getAttribute('data-id'));
                    this.renderHomepage();
                }
            });
        });

        document.querySelectorAll('.btn-delete-news').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm("ลบข่าวสาร?")) {
                    await window.dbService.deleteNewsActivity(btn.getAttribute('data-id'));
                    this.renderHomepage();
                }
            });
        });

        document.querySelectorAll('.btn-delete-newsletter').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm("ลบจดหมายข่าว?")) {
                    await window.dbService.deletePrNewsletter(btn.getAttribute('data-id'));
                    this.renderHomepage();
                }
            });
        });

        document.querySelectorAll('.btn-delete-executive').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm("ลบรายชื่อผู้บริหาร?")) {
                    await window.dbService.deleteExecutive(btn.getAttribute('data-id'));
                    this.renderHomepage();
                }
            });
        });

        document.querySelectorAll('.btn-delete-link').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm("ลบลิงก์นี้?")) {
                    await window.dbService.deleteQuickLink(btn.getAttribute('data-id'));
                    this.renderHomepage();
                }
            });
        });

        document.getElementById('btn-add-banner-cms')?.addEventListener('click', () => {
            this.modalTitle.textContent = 'เพิ่มภาพแบนเนอร์สไลด์';
            this.modalBody.innerHTML = `
                <div class="form-group">
                    <label>ชื่อแบนเนอร์ <span style="color:var(--color-danger)">*</span></label>
                    <input type="text" class="form-control" name="title" required>
                </div>
                <div class="form-group">
                    <label>ที่อยู่อ้างอิงรูปภาพ (Image URL) <span style="color:var(--color-danger)">*</span></label>
                    <input type="url" class="form-control" name="image_url" placeholder="https://..." required>
                </div>
                <div class="form-group">
                    <label>ลิงก์ปลายทาง (Link URL)</label>
                    <input type="url" class="form-control" name="link_url" value="#">
                </div>
            `;
            this.openModal();
            this.modalForm.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(this.modalForm);
                await window.dbService.addBanner({
                    title: formData.get('title'),
                    image_url: formData.get('image_url'),
                    link_url: formData.get('link_url')
                });
                this.closeModal();
                this.renderHomepage();
            };
        });

        document.getElementById('btn-add-news-cms')?.addEventListener('click', () => {
            this.modalTitle.textContent = 'เพิ่มข่าวสารกิจกรรม';
            this.modalBody.innerHTML = `
                <div class="form-group">
                    <label>หัวข้อข่าว <span style="color:var(--color-danger)">*</span></label>
                    <input type="text" class="form-control" name="title" required>
                </div>
                <div class="form-group">
                    <label>เนื้อหาโดยย่อ <span style="color:var(--color-danger)">*</span></label>
                    <textarea class="form-control" name="content" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label>ลิงก์รูปภาพ (Image URL)</label>
                    <input type="url" class="form-control" name="image_url">
                </div>
                <div class="form-group">
                    <label>วันที่กิจกรรม</label>
                    <input type="date" class="form-control" name="date" value="${window.dbService.getTodayDateString()}" required>
                </div>
            `;
            this.openModal();
            this.modalForm.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(this.modalForm);
                await window.dbService.addNewsActivity({
                    title: formData.get('title'),
                    content: formData.get('content'),
                    image_url: formData.get('image_url'),
                    date: formData.get('date')
                });
                this.closeModal();
                this.renderHomepage();
            };
        });

        document.getElementById('btn-add-newsletter-cms')?.addEventListener('click', () => {
            this.modalTitle.textContent = 'เพิ่มจดหมายข่าวประชาสัมพันธ์';
            this.modalBody.innerHTML = `
                <div class="form-group">
                    <label>หัวข้อจดหมายข่าว <span style="color:var(--color-danger)">*</span></label>
                    <input type="text" class="form-control" name="title" required>
                </div>
                <div class="form-group">
                    <label>รูปภาพปก (Image URL) <span style="color:var(--color-danger)">*</span></label>
                    <input type="url" class="form-control" name="image_url" placeholder="https://..." required>
                </div>
                <div class="form-group">
                    <label>ลิงก์ดาวน์โหลดไฟล์ (PDF URL)</label>
                    <input type="url" class="form-control" name="file_url" value="#">
                </div>
            `;
            this.openModal();
            this.modalForm.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(this.modalForm);
                await window.dbService.addPrNewsletter({
                    title: formData.get('title'),
                    image_url: formData.get('image_url'),
                    file_url: formData.get('file_url'),
                    date: window.dbService.getTodayDateString()
                });
                this.closeModal();
                this.renderHomepage();
            };
        });

        document.getElementById('btn-add-executive-cms')?.addEventListener('click', () => {
            this.modalTitle.textContent = 'เพิ่มทำเนียบผู้บริหาร';
            this.modalBody.innerHTML = `
                <div class="form-group">
                    <label>ชื่อ-นามสกุล <span style="color:var(--color-danger)">*</span></label>
                    <input type="text" class="form-control" name="name" required>
                </div>
                <div class="form-group">
                    <label>ตำแหน่งทางการบริหาร <span style="color:var(--color-danger)">*</span></label>
                    <input type="text" class="form-control" name="position" required>
                </div>
                <div class="form-group">
                    <label>ลิงก์รูปถ่าย (Image URL) <span style="color:var(--color-danger)">*</span></label>
                    <input type="url" class="form-control" name="image_url" placeholder="https://..." required>
                </div>
                <div class="form-group">
                    <label>ลำดับจัดเรียง</label>
                    <input type="number" class="form-control" name="display_order" value="1" required>
                </div>
            `;
            this.openModal();
            this.modalForm.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(this.modalForm);
                await window.dbService.addExecutive({
                    name: formData.get('name'),
                    position: formData.get('position'),
                    image_url: formData.get('image_url'),
                    display_order: parseInt(formData.get('display_order'))
                });
                this.closeModal();
                this.renderHomepage();
            };
        });

        const setupLinkAdd = (buttonId, typeLabel, typeKey) => {
            document.getElementById(buttonId)?.addEventListener('click', () => {
                this.modalTitle.textContent = `เพิ่มลิงก์${typeLabel}`;
                this.modalBody.innerHTML = `
                    <div class="form-group">
                        <label>ชื่อปุ่มลิงก์แสดงผล <span style="color:var(--color-danger)">*</span></label>
                        <input type="text" class="form-control" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>ที่อยู่อ้างอิง URL <span style="color:var(--color-danger)">*</span></label>
                        <input type="url" class="form-control" name="url" required>
                    </div>
                    <div class="form-group">
                        <label>ไอคอน</label>
                        <select class="form-control" name="icon">
                            <option value="link">Link</option>
                            <option value="globe">Globe (เว็บหลัก)</option>
                            <option value="external-link">External Link</option>
                            <option value="mail">Mail</option>
                            <option value="wallet">Wallet</option>
                            <option value="book-open">Book Open</option>
                            <option value="cpu">CPU</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>ลำดับจัดเรียง</label>
                        <input type="number" class="form-control" name="display_order" value="1" required>
                    </div>
                `;
                this.openModal();
                this.modalForm.onsubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(this.modalForm);
                    await window.dbService.addQuickLink({
                        name: formData.get('name'),
                        url: formData.get('url'),
                        icon: formData.get('icon'),
                        type: typeKey,
                        display_order: parseInt(formData.get('display_order'))
                    });
                    this.closeModal();
                    this.renderHomepage();
                };
            });
        };
        setupLinkAdd('btn-add-link-agency-cms', 'หน่วยงาน', 'agency');
        setupLinkAdd('btn-add-link-eservice-cms', 'บริการ E-Services', 'eservice');
    }

    // =========================================================================
    // 2. OFFICE DASHBOARD VIEW RENDERER (Original backend stats)
    // =========================================================================
    async renderDashboard() {
        const students = await window.dbService.getStudents();
        const teachers = await window.dbService.getTeachers();
        const classes = await window.dbService.getClasses();
        const attSummary = await window.dbService.getAttendanceSummary();

        const activeStudentsCount = students.filter(s => s.status === 'Active').length;
        const attendedToday = attSummary.Present + attSummary.Late + attSummary.Excused;
        const attendanceRate = activeStudentsCount > 0 ? Math.round((attendedToday / activeStudentsCount) * 100) : 0;

        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>แผงควบคุมฝ่ายการจัดการสำนักงานหลังบ้าน</h1>
                    <p>สถิติสะสมภายในโรงเรียนประจำวันที่ ${window.dbService.getTodayDateString()}</p>
                </div>
            </div>

            <!-- Stats grid Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-details">
                        <h3>นักเรียนสะสม</h3>
                        <div class="value">${students.length} คน</div>
                        <div class="change up">
                            <i data-lucide="check" style="width:14px;height:14px;"></i> Active: ${activeStudentsCount} คน
                        </div>
                    </div>
                    <div class="stat-icon primary"><i data-lucide="users"></i></div>
                </div>

                <div class="stat-card">
                    <div class="stat-details">
                        <h3>ครูและอาจารย์</h3>
                        <div class="value">${teachers.length} คน</div>
                        <div class="change"><i data-lucide="award" style="width:14px;height:14px;"></i> ประจำการปกติ</div>
                    </div>
                    <div class="stat-icon success"><i data-lucide="award"></i></div>
                </div>

                <div class="stat-card">
                    <div class="stat-details">
                        <h3>ห้องเรียนทั้งหมด</h3>
                        <div class="value">${classes.length} ห้อง</div>
                        <div class="change"><i data-lucide="school" style="width:14px;height:14px;"></i> บันทึกในระบบ</div>
                    </div>
                    <div class="stat-icon warning"><i data-lucide="school"></i></div>
                </div>

                <div class="stat-card">
                    <div class="stat-details">
                        <h3>การเข้าเรียนวันนี้</h3>
                        <div class="value">${attendanceRate}%</div>
                        <div class="change"><i data-lucide="user-check" style="width:14px;height:14px;"></i> เช็คแล้ว ${attSummary.total} คน</div>
                    </div>
                    <div class="stat-icon info"><i data-lucide="calendar-check"></i></div>
                </div>
            </div>

            <div class="homepage-grid">
                <div class="card">
                    <div class="card-header">
                        <h2><i data-lucide="bar-chart-3" style="color:var(--color-primary);"></i> วิเคราะห์สรุปการเข้าเรียนประจำวัน</h2>
                    </div>
                    ${attSummary.total > 0 ? `
                        <div class="dashboard-graph">
                            <div class="graph-bar-container">
                                <div class="graph-bar" style="height: ${(attSummary.Present/attSummary.total)*100}%;"><span class="graph-bar-val">${attSummary.Present}</span></div>
                                <span class="graph-label">มาปกติ</span>
                            </div>
                            <div class="graph-bar-container">
                                <div class="graph-bar" style="height: ${(attSummary.Late/attSummary.total)*100}%; background: var(--color-warning);"><span class="graph-bar-val">${attSummary.Late}</span></div>
                                <span class="graph-label">มาสาย</span>
                            </div>
                            <div class="graph-bar-container">
                                <div class="graph-bar" style="height: ${(attSummary.Excused/attSummary.total)*100}%; background: var(--color-info);"><span class="graph-bar-val">${attSummary.Excused}</span></div>
                                <span class="graph-label">ลาเรียน</span>
                            </div>
                            <div class="graph-bar-container">
                                <div class="graph-bar" style="height: ${(attSummary.Absent/attSummary.total)*100}%; background: var(--color-danger);"><span class="graph-bar-val">${attSummary.Absent}</span></div>
                                <span class="graph-label">ขาดเรียน</span>
                            </div>
                        </div>
                    ` : `
                        <div style="height:200px; display:flex; flex-direction:column; justify-content:center; align-items:center; color:var(--text-muted); gap:0.5rem;">
                            <i data-lucide="calendar-x" style="width:36px;height:36px;"></i>
                            <span>วันนี้คุณครูประจำชั้นยังไม่ได้เช็คชื่อลงในระบบ</span>
                        </div>
                    `}
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2><i data-lucide="calendar" style="color:var(--color-warning);"></i> ตารางงานสำนักงาน</h2>
                    </div>
                    <div class="schedule-list">
                        <div class="schedule-item">
                            <span class="schedule-time">08:30 น.</span>
                            <div class="schedule-info">
                                <span class="schedule-title">เปิดรับใบเสนอราคางบประมาณ</span>
                                <span class="schedule-meta">ตึกอำนวยการ</span>
                            </div>
                        </div>
                        <div class="schedule-item">
                            <span class="schedule-time">10:00 น.</span>
                            <div class="schedule-info">
                                <span class="schedule-title">ตรวจคลังสื่อสารสนเทศของกลุ่มครู</span>
                                <span class="schedule-meta">กลุ่มสาระวิทยาศาสตร์</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // 3. STUDENTS VIEW RENDERER (Registry)
    // =========================================================================
    async renderStudents() {
        const students = await window.dbService.getStudents();
        const classes = await window.dbService.getClasses();

        let tableRowsHTML = '';
        if (students.length === 0) {
            tableRowsHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding: 2rem;">ไม่มีข้อมูลนักเรียนในระบบ</td></tr>`;
        } else {
            students.forEach(s => {
                const statusBadgeClass = s.status === 'Active' ? 'badge-success' : (s.status === 'Suspended' ? 'badge-danger' : 'badge-warning');
                const statusText = s.status === 'Active' ? 'ปกติ' : (s.status === 'Suspended' ? 'พ้นสภาพ' : 'จบการศึกษา');
                
                tableRowsHTML += `
                    <tr class="student-row" data-search-content="${s.student_code} ${s.first_name} ${s.last_name} ${s.class_name}">
                        <td><strong>${s.student_code}</strong></td>
                        <td>${s.first_name} ${s.last_name}</td>
                        <td>${s.gender || '-'}</td>
                        <td><span class="badge badge-info">${s.class_name}</span></td>
                        <td><span class="badge ${statusBadgeClass}">${statusText}</span></td>
                        ${this.currentRole === 'Admin' ? `
                            <td>
                                <button class="btn btn-secondary btn-sm btn-edit-student" data-id="${s.id}">
                                    <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
                                </button>
                                <button class="btn btn-danger btn-sm btn-delete-student" data-id="${s.id}">
                                    <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                                </button>
                            </td>
                        ` : `<td>-</td>`}
                    </tr>
                `;
            });
        }

        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>ทะเบียนนักเรียน</h1>
                    <p>จัดการข้อมูลประวัตินักเรียนทั้งหมดในโรงเรียน</p>
                </div>
                ${this.currentRole === 'Admin' ? `
                    <button class="btn btn-primary" id="btn-add-student">
                        <i data-lucide="user-plus"></i> เพิ่มนักเรียนใหม่
                    </button>
                ` : ''}
            </div>

            <div class="card" style="margin-bottom: 1.5rem; padding: 1rem;">
                <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
                    <div style="flex:1; min-width:200px;">
                        <input type="text" class="form-control" id="search-student-input" placeholder="ค้นหา รหัส, ชื่อ หรือชั้นเรียน...">
                    </div>
                    <div>
                        <select class="form-control" id="filter-class-select" style="min-width:150px;">
                            <option value="">ชั้นเรียนทั้งหมด</option>
                            ${classes.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="table-responsive">
                    <table class="data-table" id="students-table">
                        <thead><tr><th>รหัสนักเรียน</th><th>ชื่อ-นามสกุล</th><th>เพศ</th><th>ห้องเรียน</th><th>สถานะ</th><th>การดำเนินงาน</th></tr></thead>
                        <tbody>${tableRowsHTML}</tbody>
                    </table>
                </div>
            </div>
        `;

        if (this.currentRole === 'Admin') {
            document.getElementById('btn-add-student').addEventListener('click', () => this.showStudentModal());
            document.querySelectorAll('.btn-edit-student').forEach(btn => {
                btn.addEventListener('click', () => {
                    const student = students.find(s => s.id === btn.getAttribute('data-id'));
                    if (student) this.showStudentModal(student);
                });
            });
            document.querySelectorAll('.btn-delete-student').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm("ลบรายชื่อนักเรียนนี้และคะแนนประวัติทั้งหมด?")) {
                        await window.dbService.deleteStudent(btn.getAttribute('data-id'));
                        this.renderStudents();
                    }
                });
            });
        }

        const searchInput = document.getElementById('search-student-input');
        const classFilter = document.getElementById('filter-class-select');
        const rows = document.querySelectorAll('.student-row');

        const filterFunc = () => {
            const query = searchInput.value.trim().toLowerCase();
            const classVal = classFilter.value;
            rows.forEach(row => {
                const searchContent = row.getAttribute('data-search-content').toLowerCase();
                const matchesSearch = query === '' || searchContent.includes(query);
                const matchesClass = classVal === '' || searchContent.includes(classVal.toLowerCase());
                row.style.display = (matchesSearch && matchesClass) ? '' : 'none';
            });
        };
        searchInput.addEventListener('input', filterFunc);
        classFilter.addEventListener('change', filterFunc);
    }

    async showStudentModal(student = null) {
        const classes = await window.dbService.getClasses();
        const isEdit = student !== null;
        this.modalTitle.textContent = isEdit ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่';
        
        this.modalBody.innerHTML = `
            <input type="hidden" name="id" value="${isEdit ? student.id : ''}">
            <div class="form-group">
                <label>รหัสนักเรียน <span style="color:var(--color-danger)">*</span></label>
                <input type="text" class="form-control" name="student_code" value="${isEdit ? student.student_code : ''}" required ${isEdit ? 'readonly' : ''}>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label>ชื่อจริง <span style="color:var(--color-danger)">*</span></label>
                    <input type="text" class="form-control" name="first_name" value="${isEdit ? student.first_name : ''}" required>
                </div>
                <div class="form-group">
                    <label>นามสกุล <span style="color:var(--color-danger)">*</span></label>
                    <input type="text" class="form-control" name="last_name" value="${isEdit ? student.last_name : ''}" required>
                </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label>เพศ</label>
                    <select class="form-control" name="gender">
                        <option value="ชาย" ${isEdit && student.gender === 'ชาย' ? 'selected' : ''}>ชาย</option>
                        <option value="หญิง" ${isEdit && student.gender === 'หญิง' ? 'selected' : ''}>หญิง</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>ชั้นเรียน</label>
                    <select class="form-control" name="class_id">
                        <option value="">ไม่มีห้องเรียน</option>
                        ${classes.map(c => `<option value="${c.id}" ${isEdit && student.class_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>ชื่อผู้ปกครอง</label>
                <input type="text" class="form-control" name="guardian_name" value="${isEdit ? (student.guardian_name || '') : ''}">
            </div>
            <div class="form-group">
                <label>เบอร์โทรศัพท์ผู้ปกครอง</label>
                <input type="tel" class="form-control" name="guardian_phone" value="${isEdit ? (student.guardian_phone || '') : ''}">
            </div>
            <div class="form-group">
                <label>สถานะนักเรียน</label>
                <select class="form-control" name="status">
                    <option value="Active" ${isEdit && student.status === 'Active' ? 'selected' : ''}>ปกติ (Active)</option>
                    <option value="Suspended" ${isEdit && student.status === 'Suspended' ? 'selected' : ''}>พ้นสภาพ (Suspended)</option>
                    <option value="Graduated" ${isEdit && student.status === 'Graduated' ? 'selected' : ''}>จบการศึกษา (Graduated)</option>
                </select>
            </div>
        `;
        this.openModal();

        this.modalForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(this.modalForm);
            const studentData = {
                student_code: formData.get('student_code'),
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                gender: formData.get('gender'),
                class_id: formData.get('class_id') || null,
                guardian_name: formData.get('guardian_name'),
                guardian_phone: formData.get('guardian_phone'),
                status: formData.get('status')
            };

            try {
                if (isEdit) {
                    await window.dbService.updateStudent(formData.get('id'), studentData);
                } else {
                    await window.dbService.addStudent(studentData);
                }
                this.closeModal();
                this.renderStudents();
            } catch (err) {
                alert("บันทึกผิดพลาด: " + err.message);
            }
        };
    }

    // =========================================================================
    // 4. TEACHERS VIEW RENDERER (Registry)
    // =========================================================================
    async renderTeachers() {
        const teachers = await window.dbService.getTeachers();

        let tableRowsHTML = '';
        if (teachers.length === 0) {
            tableRowsHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding: 2rem;">ไม่มีข้อมูลครูในระบบ</td></tr>`;
        } else {
            teachers.forEach(t => {
                tableRowsHTML += `
                    <tr class="teacher-row" data-search-content="${t.teacher_code} ${t.first_name} ${t.last_name}">
                        <td><strong>${t.teacher_code}</strong></td>
                        <td>${t.first_name} ${t.last_name}</td>
                        <td>${t.email || '-'}</td>
                        <td>${t.phone || '-'}</td>
                        ${this.currentRole === 'Admin' ? `
                            <td>
                                <button class="btn btn-secondary btn-sm btn-edit-teacher" data-id="${t.id}"><i data-lucide="edit-3" style="width:14px;height:14px;"></i></button>
                                <button class="btn btn-danger btn-sm btn-delete-teacher" data-id="${t.id}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                            </td>
                        ` : `<td>-</td>`}
                    </tr>
                `;
            });
        }

        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>ครูและบุคลากร</h1>
                    <p>จัดการประวัติครูผู้สอนวิชาต่างๆ</p>
                </div>
                ${this.currentRole === 'Admin' ? `
                    <button class="btn btn-primary" id="btn-add-teacher">
                        <i data-lucide="user-plus"></i> เพิ่มครูคนใหม่
                    </button>
                ` : ''}
            </div>

            <div class="card" style="margin-bottom: 1.5rem; padding: 1rem;">
                <input type="text" class="form-control" id="search-teacher-input" placeholder="ค้นหาครูผู้สอน...">
            </div>

            <div class="card">
                <div class="table-responsive">
                    <table class="data-table" id="teachers-table">
                        <thead><tr><th>รหัสคุณครู</th><th>ชื่อ-นามสกุล</th><th>อีเมล</th><th>เบอร์โทร</th><th>การดำเนินงาน</th></tr></thead>
                        <tbody>${tableRowsHTML}</tbody>
                    </table>
                </div>
            </div>
        `;

        if (this.currentRole === 'Admin') {
            document.getElementById('btn-add-teacher').addEventListener('click', () => this.showTeacherModal());
            document.querySelectorAll('.btn-edit-teacher').forEach(btn => {
                btn.addEventListener('click', () => {
                    const teacher = teachers.find(t => t.id === btn.getAttribute('data-id'));
                    if (teacher) this.showTeacherModal(teacher);
                });
            });
            document.querySelectorAll('.btn-delete-teacher').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm("ต้องการลบประวัติครูคนนี้ออกจากสารสนเทศ?")) {
                        await window.dbService.deleteTeacher(btn.getAttribute('data-id'));
                        this.renderTeachers();
                    }
                });
            });
        }

        const searchInput = document.getElementById('search-teacher-input');
        const rows = document.querySelectorAll('.teacher-row');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            rows.forEach(row => {
                const searchContent = row.getAttribute('data-search-content').toLowerCase();
                row.style.display = (query === '' || searchContent.includes(query)) ? '' : 'none';
            });
        });
    }

    showTeacherModal(teacher = null) {
        const isEdit = teacher !== null;
        this.modalTitle.textContent = isEdit ? 'แก้ไขข้อมูลคุณครู' : 'เพิ่มคุณครูใหม่';
        
        this.modalBody.innerHTML = `
            <input type="hidden" name="id" value="${isEdit ? teacher.id : ''}">
            <div class="form-group">
                <label>รหัสประจำตัวคุณครู <span style="color:var(--color-danger)">*</span></label>
                <input type="text" class="form-control" name="teacher_code" value="${isEdit ? teacher.teacher_code : ''}" required ${isEdit ? 'readonly' : ''}>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label>ชื่อจริง <span style="color:var(--color-danger)">*</span></label>
                    <input type="text" class="form-control" name="first_name" value="${isEdit ? teacher.first_name : ''}" required>
                </div>
                <div class="form-group">
                    <label>นามสกุล <span style="color:var(--color-danger)">*</span></label>
                    <input type="text" class="form-control" name="last_name" value="${isEdit ? teacher.last_name : ''}" required>
                </div>
            </div>
            <div class="form-group">
                <label>อีเมล</label>
                <input type="email" class="form-control" name="email" value="${isEdit ? (teacher.email || '') : ''}">
            </div>
            <div class="form-group">
                <label>เบอร์โทร</label>
                <input type="tel" class="form-control" name="phone" value="${isEdit ? (teacher.phone || '') : ''}">
            </div>
        `;
        this.openModal();

        this.modalForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(this.modalForm);
            try {
                if (isEdit) {
                    await window.dbService.updateTeacher(formData.get('id'), {
                        teacher_code: formData.get('teacher_code'),
                        first_name: formData.get('first_name'),
                        last_name: formData.get('last_name'),
                        email: formData.get('email'),
                        phone: formData.get('phone')
                    });
                } else {
                    await window.dbService.addTeacher({
                        teacher_code: formData.get('teacher_code'),
                        first_name: formData.get('first_name'),
                        last_name: formData.get('last_name'),
                        email: formData.get('email'),
                        phone: formData.get('phone')
                    });
                }
                this.closeModal();
                this.renderTeachers();
            } catch (err) {
                alert("เกิดข้อผิดพลาด: " + err.message);
            }
        };
    }

    // =========================================================================
    // 5. CLASSES & SUBJECTS VIEW RENDERER
    // =========================================================================
    async renderClassesAndSubjects() {
        const classes = await window.dbService.getClasses();
        const subjects = await window.dbService.getSubjects();

        let classRowsHTML = '';
        classes.forEach(c => {
            classRowsHTML += `
                <tr>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.room || '-'}</td>
                    <td>
                        <button class="btn btn-danger btn-sm btn-delete-class" data-id="${c.id}"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                    </td>
                </tr>
            `;
        });

        let subjectRowsHTML = '';
        subjects.forEach(s => {
            subjectRowsHTML += `
                <tr>
                    <td><strong>${s.code}</strong></td>
                    <td>${s.name}</td>
                    <td>${s.credits} นก.</td>
                    <td>
                        <button class="btn btn-danger btn-sm btn-delete-subject" data-id="${s.id}"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                    </td>
                </tr>
            `;
        });

        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>ชั้นเรียนและรายวิชา</h1>
                    <p>กำหนดการเรียนการสอนรายภาควิชา</p>
                </div>
            </div>
            <div class="homepage-grid">
                <div class="card">
                    <div class="card-header">
                        <h2><i data-lucide="home" style="color:var(--color-primary);"></i> ห้องเรียน</h2>
                        <button class="btn btn-primary btn-sm" id="btn-add-class"><i data-lucide="plus"></i> เพิ่มห้อง</button>
                    </div>
                    <table class="data-table">
                        <thead><tr><th>ห้องเรียน</th><th>ห้องปฏิบัติการ</th><th>จัดการ</th></tr></thead>
                        <tbody>${classRowsHTML || '<tr><td colspan="3">ไม่มีห้องเรียน</td></tr>'}</tbody>
                    </table>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h2><i data-lucide="book-open" style="color:var(--color-success);"></i> รายวิชา</h2>
                        <button class="btn btn-primary btn-sm" id="btn-add-subject"><i data-lucide="plus"></i> เพิ่มวิชา</button>
                    </div>
                    <table class="data-table">
                        <thead><tr><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>หน่วยกิต</th><th>จัดการ</th></tr></thead>
                        <tbody>${subjectRowsHTML || '<tr><td colspan="4">ไม่มีรายวิชา</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('btn-add-class').addEventListener('click', () => this.showClassModal());
        document.getElementById('btn-add-subject').addEventListener('click', () => this.showSubjectModal());

        document.querySelectorAll('.btn-delete-class').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm("ยืนยันการลบห้องเรียนนี้?")) {
                    await window.dbService.deleteClass(btn.getAttribute('data-id'));
                    this.renderClassesAndSubjects();
                }
            });
        });

        document.querySelectorAll('.btn-delete-subject').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm("ยืนยันการลบรายวิชานี้?")) {
                    await window.dbService.deleteSubject(btn.getAttribute('data-id'));
                    this.renderClassesAndSubjects();
                }
            });
        });
    }

    showClassModal() {
        this.modalTitle.textContent = 'เพิ่มห้องเรียนใหม่';
        this.modalBody.innerHTML = `
            <div class="form-group">
                <label>ชื่อห้องเรียน <span style="color:var(--color-danger)">*</span></label>
                <input type="text" class="form-control" name="name" placeholder="ม.1/1" required>
            </div>
            <div class="form-group">
                <label>สถานที่/อาคาร</label>
                <input type="text" class="form-control" name="room" placeholder="เช่น อาคาร 3 ห้อง 324">
            </div>
        `;
        this.openModal();
        this.modalForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(this.modalForm);
            await window.dbService.addClass({ name: formData.get('name'), room: formData.get('room') });
            this.closeModal();
            this.renderClassesAndSubjects();
        };
    }

    showSubjectModal() {
        this.modalTitle.textContent = 'เพิ่มวิชาใหม่';
        this.modalBody.innerHTML = `
            <div class="form-group">
                <label>รหัสวิชา <span style="color:var(--color-danger)">*</span></label>
                <input type="text" class="form-control" name="code" placeholder="ค11101" required>
            </div>
            <div class="form-group">
                <label>ชื่อวิชา <span style="color:var(--color-danger)">*</span></label>
                <input type="text" class="form-control" name="name" placeholder="คณิตศาสตร์พื้นฐาน" required>
            </div>
            <div class="form-group">
                <label>หน่วยกิต</label>
                <input type="number" class="form-control" name="credits" step="0.5" value="1.0" required>
            </div>
        `;
        this.openModal();
        this.modalForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(this.modalForm);
            await window.dbService.addSubject({
                code: formData.get('code'),
                name: formData.get('name'),
                credits: Number(formData.get('credits'))
            });
            this.closeModal();
            this.renderClassesAndSubjects();
        };
    }

    // =========================================================================
    // 6. ATTENDANCE VIEW RENDERER
    // =========================================================================
    async renderAttendance() {
        const classes = await window.dbService.getClasses();
        const todayStr = window.dbService.getTodayDateString();

        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>เช็คชื่อเข้าเรียน</h1>
                    <p>ระบบบันทึกสถานะการเข้าห้องเรียนของนักเรียนประจำวัน</p>
                </div>
            </div>
            <div class="card" style="margin-bottom:1.5rem;">
                <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
                    <div style="flex:1; min-width:200px;">
                        <select class="form-control" id="attendance-class-select">
                            <option value="">-- เลือกห้องเรียน --</option>
                            ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div style="width:180px;">
                        <input type="date" class="form-control" id="attendance-date-input" value="${todayStr}">
                    </div>
                    <div>
                        <button class="btn btn-primary" id="btn-load-attendance">โหลดรายชื่อ</button>
                    </div>
                </div>
            </div>
            <div id="attendance-board-container">
                <div class="card" style="text-align:center; padding:3rem; color:var(--text-muted);">
                    <i data-lucide="calendar-days" style="width:40px;height:40px;margin-bottom:1rem;opacity:0.5;"></i>
                    <p>กรุณาระบุชั้นเรียนและดาวน์โหลดข้อมูล</p>
                </div>
            </div>
        `;

        document.getElementById('btn-load-attendance').addEventListener('click', () => {
            const classId = document.getElementById('attendance-class-select').value;
            const date = document.getElementById('attendance-date-input').value;
            if (!classId) {
                alert("เลือกชั้นเรียนด้วยครับ");
                return;
            }
            this.loadAttendanceBoard(classId, date);
        });
    }

    async loadAttendanceBoard(classId, dateStr) {
        const container = document.getElementById('attendance-board-container');
        container.innerHTML = `<div style="text-align:center; padding:2rem;">กำลังโหลด...</div>`;

        const records = await window.dbService.getAttendanceByDateAndClass(dateStr, classId);
        if (records.length === 0) {
            container.innerHTML = `<div class="card" style="padding:2rem;">ไม่มีนักเรียนในห้องเรียนนี้</div>`;
            return;
        }

        let cardsHTML = '';
        records.forEach(rec => {
            cardsHTML += `
                <div class="attendance-card" data-student-id="${rec.student_id}">
                    <div>
                        <div class="student-name">${rec.first_name} ${rec.last_name}</div>
                        <div class="student-code">${rec.student_code}</div>
                    </div>
                    <div class="attendance-options">
                        <button type="button" class="attendance-btn present ${rec.status === 'Present' ? 'active' : ''}" data-val="Present">มา</button>
                        <button type="button" class="attendance-btn late ${rec.status === 'Late' ? 'active' : ''}" data-val="Late">สาย</button>
                        <button type="button" class="attendance-btn excused ${rec.status === 'Excused' ? 'active' : ''}" data-val="Excused">ลา</button>
                        <button type="button" class="attendance-btn absent ${rec.status === 'Absent' ? 'active' : ''}" data-val="Absent">ขาด</button>
                    </div>
                    <input type="text" class="form-control attendance-remarks" style="padding:0.35rem; font-size:0.8rem;" placeholder="หมายเหตุ..." value="${rec.remarks || ''}">
                </div>
            `;
        });

        container.innerHTML = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                    <h2>ลงสถิตินักเรียน</h2>
                    <button class="btn btn-secondary btn-sm" id="btn-att-select-all">มาทั้งหมด</button>
                </div>
                <div class="attendance-grid">${cardsHTML}</div>
                <div style="display:flex; justify-content:flex-end; margin-top:2rem;">
                    <button class="btn btn-primary" id="btn-save-attendance-submit">บันทึกสถิติ</button>
                </div>
            </div>
        `;
        lucide.createIcons();

        const cards = container.querySelectorAll('.attendance-card');
        cards.forEach(card => {
            const btns = card.querySelectorAll('.attendance-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    btns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });
        });

        document.getElementById('btn-att-select-all').addEventListener('click', () => {
            cards.forEach(card => {
                card.querySelectorAll('.attendance-btn').forEach(btn => btn.classList.remove('active'));
                card.querySelector('.attendance-btn.present').classList.add('active');
            });
        });

        document.getElementById('btn-save-attendance-submit').addEventListener('click', async () => {
            const saveArr = [];
            cards.forEach(card => {
                const sId = card.getAttribute('data-student-id');
                const active = card.querySelector('.attendance-btn.active');
                const remarks = card.querySelector('.attendance-remarks').value;
                if (active) {
                    saveArr.push({
                        student_id: sId,
                        date: dateStr,
                        status: active.getAttribute('data-val'),
                        remarks: remarks.trim()
                    });
                }
            });
            await window.dbService.saveAttendance(saveArr);
            alert("บันทึกข้อมูลสำเร็จแล้วครับ! 💾");
        });
    }

    // =========================================================================
    // 7. GRADES & PORTALS
    // =========================================================================
    async renderGrades() {
        if (this.currentRole === 'Student') {
            await this.renderStudentGradesPortal();
        } else {
            await this.renderTeacherGradesPortal();
        }
    }

    async renderTeacherGradesPortal() {
        const classes = await window.dbService.getClasses();
        const subjects = await window.dbService.getSubjects();

        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>จัดการคะแนนการสอบและบันทึกเกรด</h1>
                    <p>ครูประจำชั้นเลือกวิชาและลงบันทึกคะแนนสะสม</p>
                </div>
            </div>
            <div class="card" style="margin-bottom:1.5rem;">
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:1rem; align-items:center;">
                    <select class="form-control" id="grade-class-select">
                        <option value="">-- เลือกห้องเรียน --</option>
                        ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                    <select class="form-control" id="grade-subject-select">
                        <option value="">-- เลือกวิชา --</option>
                        ${subjects.map(s => `<option value="${s.id}">${s.code} - ${s.name}</option>`).join('')}
                    </select>
                    <select class="form-control" id="grade-semester-select">
                        <option value="1/2569">1/2569</option>
                        <option value="2/2569">2/2569</option>
                    </select>
                    <button class="btn btn-primary" id="btn-load-grades">โหลดเกรด</button>
                </div>
            </div>
            <div id="grades-board-container">
                <div class="card" style="text-align:center; padding:3rem; color:var(--text-muted);">
                    <i data-lucide="folder" style="width:40px;height:40px;margin-bottom:1rem;opacity:0.5;"></i>
                    <p>ระบุวิชาเพื่อเริ่มการบันทึกเกรด</p>
                </div>
            </div>
        `;

        document.getElementById('btn-load-grades').addEventListener('click', () => {
            const classId = document.getElementById('grade-class-select').value;
            const subjectId = document.getElementById('grade-subject-select').value;
            const sem = document.getElementById('grade-semester-select').value;
            if (!classId || !subjectId) {
                alert("กรอกข้อมูลให้ครบครับ");
                return;
            }
            this.loadGradesBoard(classId, subjectId, sem);
        });
    }

    async loadGradesBoard(classId, subjectId, semester) {
        const container = document.getElementById('grades-board-container');
        container.innerHTML = `<div>กำลังโหลด...</div>`;

        const grades = await window.dbService.getGradesByClassAndSubject(classId, subjectId, semester);
        if (grades.length === 0) {
            container.innerHTML = `<div>ไม่มีประวัตินักเรียนห้องนี้</div>`;
            return;
        }

        let rowsHTML = '';
        grades.forEach(g => {
            rowsHTML += `
                <tr class="grade-input-row" data-student-id="${g.student_id}">
                    <td><strong>${g.student_code}</strong></td>
                    <td>${g.first_name} ${g.last_name}</td>
                    <td><input type="number" class="form-control score-classwork" min="0" max="40" style="width:80px; text-align:center;" value="${g.classwork_score || 0}"></td>
                    <td><input type="number" class="form-control score-midterm" min="0" max="30" style="width:80px; text-align:center;" value="${g.midterm_score || 0}"></td>
                    <td><input type="number" class="form-control score-final" min="0" max="30" style="width:80px; text-align:center;" value="${g.final_score || 0}"></td>
                    <td><span class="total-score-badge">${g.total_score || 0}</span></td>
                    <td><span class="badge badge-info grade-value-badge">${g.grade_value || '-'}</span></td>
                </tr>
            `;
        });

        container.innerHTML = `
            <div class="card">
                <table class="data-table">
                    <thead><tr><th>รหัสนักเรียน</th><th>ชื่อ</th><th>คะแนนเก็บ (40)</th><th>กลางภาค (30)</th><th>ปลายภาค (30)</th><th>รวม</th><th>เกรด</th></tr></thead>
                    <tbody>${rowsHTML}</tbody>
                </table>
                <div style="display:flex; justify-content:flex-end; margin-top:2rem;">
                    <button class="btn btn-primary" id="btn-save-grades-submit">บันทึกคะแนน</button>
                </div>
            </div>
        `;

        const rows = container.querySelectorAll('.grade-input-row');
        rows.forEach(row => {
            const classwork = row.querySelector('.score-classwork');
            const midterm = row.querySelector('.score-midterm');
            const final = row.querySelector('.score-final');
            const total = row.querySelector('.total-score-badge');
            const gr = row.querySelector('.grade-value-badge');

            const calc = () => {
                const sum = Number(classwork.value) + Number(midterm.value) + Number(final.value);
                total.textContent = sum;
                gr.textContent = window.dbService.calculateGradeValue(sum);
            };
            classwork.addEventListener('input', calc);
            midterm.addEventListener('input', calc);
            final.addEventListener('input', calc);
        });

        document.getElementById('btn-save-grades-submit').addEventListener('click', async () => {
            const saveArr = [];
            rows.forEach(row => {
                const sId = row.getAttribute('data-student-id');
                const cw = Number(row.querySelector('.score-classwork').value);
                const mt = Number(row.querySelector('.score-midterm').value);
                const fn = Number(row.querySelector('.score-final').value);
                saveArr.push({
                    student_id: sId,
                    subject_id: subjectId,
                    semester: semester,
                    midterm_score: mt,
                    final_score: fn,
                    classwork_score: cw
                });
            });
            await window.dbService.saveGrades(saveArr);
            alert("บันทึกและตัดเกรดเสร็จสิ้น! 🎓💾");
        });
    }

    async renderStudentGradesPortal() {
        const students = await window.dbService.getStudents();
        const activeStudent = students.find(s => s.student_code === 'STD10001') || students[0];

        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>ประวัตินักเรียนและผลการเรียนออนไลน์</h1>
                    <p>ระบบสืบค้นผลการเรียนรายเทอม</p>
                </div>
            </div>
            <div class="card" style="margin-bottom:1.5rem;">
                <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
                    <div style="flex:1;">
                        <select class="form-control" id="student-portal-select">
                            ${students.map(s => `<option value="${s.id}" ${activeStudent?.id === s.id ? 'selected' : ''}>${s.student_code} - ${s.first_name} ${s.last_name}</option>`).join('')}
                        </select>
                    </div>
                    <select class="form-control" id="student-portal-semester" style="width:150px;">
                        <option value="1/2569">1/2569</option>
                        <option value="2/2569">2/2569</option>
                    </select>
                    <button class="btn btn-primary" id="btn-portal-load-report">เปิดดูใบสมุดพก</button>
                </div>
            </div>
            <div id="portal-report-container"></div>
        `;

        const loadReport = async () => {
            const sId = document.getElementById('student-portal-select').value;
            const sem = document.getElementById('student-portal-semester').value;
            this.loadStudentReportCard(sId, sem);
        };
        document.getElementById('btn-portal-load-report').addEventListener('click', loadReport);
        if (activeStudent) {
            this.loadStudentReportCard(activeStudent.id, '1/2569');
        }
    }

    async loadStudentReportCard(studentId, semester) {
        const container = document.getElementById('portal-report-container');
        container.innerHTML = `<div>กำลังดึงข้อมูล...</div>`;

        try {
            const report = await window.dbService.getStudentReportCard(studentId, semester);
            const { student, grades } = report;

            if (grades.length === 0) {
                container.innerHTML = `<div class="card" style="padding:2rem;">ยังไม่มีรายงานการตัดเกรดในเทอมนี้</div>`;
                return;
            }

            let totalCredits = 0;
            let points = 0;
            grades.forEach(g => {
                totalCredits += g.credits;
                if (g.grade_value !== '-') {
                    points += Number(g.grade_value) * g.credits;
                }
            });
            const gpa = totalCredits > 0 ? (points / totalCredits).toFixed(2) : '0.00';

            let trHTML = '';
            grades.forEach(g => {
                trHTML += `
                    <tr>
                        <td><strong>${g.subject_code}</strong></td>
                        <td style="text-align:left;">${g.subject_name}</td>
                        <td>${g.credits.toFixed(1)}</td>
                        <td>${g.classwork_score}</td>
                        <td>${g.midterm_score}</td>
                        <td>${g.final_score}</td>
                        <td><strong>${g.total_score}</strong></td>
                        <td><strong>${g.grade_value}</strong></td>
                    </tr>
                `;
            });

            container.innerHTML = `
                <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
                    <button class="btn btn-secondary btn-sm" onclick="window.print()"><i data-lucide="printer"></i> พิมพ์เกรด</button>
                </div>
                <div class="report-card-view">
                    <div class="report-header">
                        <div class="school-emblem">🏫</div>
                        <h2 class="report-title">สมุดพกรายงานผลการเรียนรายบุคคล</h2>
                        <p class="report-subtitle">SchoolHub Educational Portal</p>
                    </div>
                    <div class="student-meta-grid">
                        <div class="meta-item"><span class="meta-label">ชื่อ-นามสกุล:</span> <span>${student.first_name} ${student.last_name}</span></div>
                        <div class="meta-item"><span class="meta-label">รหัสประจำตัว:</span> <span>${student.student_code}</span></div>
                        <div class="meta-item"><span class="meta-label">ห้องเรียน:</span> <span>${student.class_name}</span></div>
                        <div class="meta-item"><span class="meta-label">ปีการศึกษา/ภาคเรียน:</span> <span>${semester}</span></div>
                    </div>
                    <table class="report-table">
                        <thead><tr><th>รหัสวิชา</th><th style="text-align:left;">รายวิชา</th><th>หน่วยกิต</th><th>เก็บ (40)</th><th>กลางภาค (30)</th><th>ปลายภาค (30)</th><th>รวม (100)</th><th>เกรด</th></tr></thead>
                        <tbody>
                            ${trHTML}
                            <tr style="font-weight:700; background:#f8fafc;">
                                <td colspan="2" style="text-align:right;">ผลสรุปหน่วยกิต:</td>
                                <td>${totalCredits.toFixed(1)}</td>
                                <td colspan="4" style="text-align:right;">เกรดเฉลี่ยรายภาคเรียน (GPA)</td>
                                <td style="color:var(--color-primary); font-size:1.2rem;">${gpa}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
            lucide.createIcons();
        } catch (err) {
            container.innerHTML = `<div>โหลดคะแนนผิดพลาด: ${err.message}</div>`;
        }
    }

    // =========================================================================
    // 8. BUDGETING SYSTEM VIEW RENDERER (Office Subsystem)
    // =========================================================================
    async renderBudgeting() {
        const txs = await window.dbService.getBudgetTransactions();
        const summary = await window.dbService.getBudgetSummary();

        let listHTML = '';
        if (txs.length === 0) {
            listHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.5rem;">ไม่มีข้อมูลธุรกรรมงบประมาณ</td></tr>`;
        } else {
            txs.forEach(t => {
                const isInc = t.type === 'income';
                const typeBadge = isInc ? 'badge-success' : 'badge-danger';
                const typeText = isInc ? 'รายรับ' : 'รายจ่าย';
                const amtFormatted = Number(t.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 });
                
                listHTML += `
                    <tr>
                        <td><strong>${t.date}</strong></td>
                        <td>${t.title}</td>
                        <td><span class="badge ${typeBadge}">${typeText}</span></td>
                        <td><span class="badge badge-info">${t.category}</span></td>
                        <td style="font-weight:700; text-align:right; color: ${isInc ? 'var(--color-success)' : 'var(--color-danger)'};">
                            ${isInc ? '+' : '-'}${amtFormatted}
                        </td>
                        ${this.currentRole === 'Admin' ? `
                            <td>
                                <button class="btn btn-danger btn-sm btn-delete-tx" data-id="${t.id}" style="padding:2px 5px;">
                                    <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
                                </button>
                            </td>
                        ` : `<td>-</td>`}
                    </tr>
                `;
            });
        }

        let allocationHTML = '';
        Object.keys(summary.categoryBreakdown).forEach(cat => {
            const amt = summary.categoryBreakdown[cat];
            allocationHTML += `
                <div class="executive-sidebar-card" style="padding:0.75rem; flex-direction:column; align-items:flex-start; gap:0.25rem;">
                    <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">${cat}</span>
                    <span style="font-weight:700; font-size:0.95rem; color:var(--color-danger);">${amt.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                </div>
            `;
        });

        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>ระบบการบริหารงบประมาณการศึกษาโรงเรียน</h1>
                    <p>ติดตามรายรับรายจ่ายเงินรัฐอุดหนุน บริจาค และโควตาฝ่ายการคลังของสถานศึกษา</p>
                </div>
                ${this.currentRole === 'Admin' ? `
                    <button class="btn btn-primary" id="btn-add-tx">
                        <i data-lucide="plus-circle"></i> บันทึกธุรกรรมงบการเงิน
                    </button>
                ` : ''}
            </div>

            <!-- Dashboard summary cards -->
            <div class="budget-summary-grid">
                <div class="budget-card income">
                    <h3>งบรายรับสะสม</h3>
                    <div class="amount">${summary.income.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</div>
                </div>
                <div class="budget-card expense">
                    <h3>งบรายจ่ายสะสม</h3>
                    <div class="amount">${summary.expense.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</div>
                </div>
                <div class="budget-card balance">
                    <h3>ดุลบัญชีงบประมาณคงเหลือ</h3>
                    <div class="amount">${summary.balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</div>
                </div>
            </div>

            <div class="homepage-grid">
                <!-- Left: List of transactions (72%) -->
                <div class="card">
                    <div class="card-header">
                        <h2><i data-lucide="history" style="color:var(--color-primary);"></i> รายการเดินบัญชีการคลัง</h2>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>วันที่</th>
                                    <th>หัวข้อ/วัตถุประสงค์</th>
                                    <th>ประเภท</th>
                                    <th>ฝ่ายงานที่รับงบ</th>
                                    <th style="text-align:right;">จำนวนเงิน (บาท)</th>
                                    <th>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${listHTML}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Right: Allocations by department (28%) -->
                <div class="card">
                    <div class="card-header">
                        <h2><i data-lucide="pie-chart" style="color:var(--color-warning);"></i> รายจ่ายแยกตามฝ่ายงาน</h2>
                    </div>
                    <div class="executives-sidebar-list">
                        ${allocationHTML || '<div style="color:var(--text-muted); font-size:0.8rem;">ยังไม่มีรายงานการเงิน</div>'}
                    </div>
                </div>
            </div>
        `;

        if (this.currentRole === 'Admin') {
            document.getElementById('btn-add-tx').addEventListener('click', () => {
                this.modalTitle.textContent = 'บันทึกรายรับ-รายจ่ายการเงิน';
                this.modalBody.innerHTML = `
                    <div class="form-group">
                        <label>วัตถุประสงค์ / หัวข้อกิจกรรม <span style="color:var(--color-danger)">*</span></label>
                        <input type="text" class="form-control" name="title" placeholder="เช่น ค่าจัดทำพานดอกไม้ไหว้ครู" required>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>ประเภทงบ</label>
                            <select class="form-control" name="type">
                                <option value="income">รายรับ (Income)</option>
                                <option value="expense">รายจ่าย (Expense)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>จำนวนเงิน (บาท) <span style="color:var(--color-danger)">*</span></label>
                            <input type="number" step="0.01" class="form-control" name="amount" min="1" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>ฝ่ายงานที่จัดสรร / แหล่งที่มางบประมาณ</label>
                        <select class="form-control" name="category">
                            <option value="ฝ่ายวิชาการ">ฝ่ายวิชาการ</option>
                            <option value="ฝ่ายบุคคล">ฝ่ายบุคคล</option>
                            <option value="ฝ่ายบริหารทั่วไป">ฝ่ายบริหารทั่วไป</option>
                            <option value="งบรัฐอุดหนุน">งบรัฐอุดหนุน</option>
                            <option value="อื่นๆ">อื่น ๆ</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>วันที่ทำรายการ</label>
                        <input type="date" class="form-control" name="date" value="${window.dbService.getTodayDateString()}" required>
                    </div>
                    <div class="form-group">
                        <label>หมายเหตุบันทึก</label>
                        <input type="text" class="form-control" name="remarks">
                    </div>
                `;
                this.openModal();
                this.modalForm.onsubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(this.modalForm);
                    await window.dbService.addBudgetTransaction({
                        title: formData.get('title'),
                        amount: Number(formData.get('amount')),
                        type: formData.get('type'),
                        category: formData.get('category'),
                        date: formData.get('date'),
                        remarks: formData.get('remarks')
                    });
                    this.closeModal();
                    this.renderBudgeting();
                };
            });

            document.querySelectorAll('.btn-delete-tx').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm("ลบธุรกรรมการเงินนี้ออกจากประวัติ?")) {
                        await window.dbService.deleteBudgetTransaction(btn.getAttribute('data-id'));
                        this.renderBudgeting();
                    }
                });
            });
        }
    }

    // =========================================================================
    // 9. MEDIA LIBRARY VIEW RENDERER (Office Subsystem)
    // =========================================================================
    async renderMediaLibrary() {
        const items = await window.dbService.getMediaItems();
        const loggedIn = this.currentRole === 'Admin' || this.currentRole === 'Teacher';

        const renderItemsList = (filterSubject = '') => {
            const filtered = filterSubject ? items.filter(i => i.subject === filterSubject) : items;
            let gridHTML = '';
            if (filtered.length === 0) {
                gridHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 3rem; color:var(--text-muted);">
                    <i data-lucide="folder-open" style="width:36px;height:36px;margin: 0 auto 0.5rem auto; opacity:0.5;"></i>
                    <span>ไม่มีไฟล์สื่อการสอนของวิชานี้</span>
                </div>`;
            } else {
                filtered.forEach(i => {
                    gridHTML += `
                        <div class="media-card">
                            <span class="badge badge-info media-subject">${i.subject}</span>
                            <div class="media-title">${i.title}</div>
                            <div class="media-desc">${i.description || 'ไม่มีคำอธิบาย'}</div>
                            <div class="media-meta">
                                <span>ระดับชั้น: ${i.grade}</span>
                                <a href="${i.link_url}" target="_blank" class="btn btn-secondary btn-sm" style="padding:0.25rem 0.5rem; font-size:0.75rem;">
                                    <i data-lucide="external-link" style="width:12px;height:12px;"></i> ดาวน์โหลด
                                </a>
                            </div>
                            ${loggedIn ? `
                                <button class="btn btn-danger btn-sm btn-delete-media" data-id="${i.id}" 
                                    style="position:absolute; top:-10px; right:-10px; width:24px; height:24px; border-radius:50%; padding:0; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-sm);">
                                    &times;
                                </button>
                            ` : ''}
                        </div>
                    `;
                });
            }
            return gridHTML;
        };

        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>คลังสื่อการเรียนการสอนและแหล่งเรียนรู้</h1>
                    <p>รวมศูนย์ใบงาน คลังวิดีโอ สไลด์เฉลยความรู้สำหรับทุกคน</p>
                </div>
                ${loggedIn ? `
                    <button class="btn btn-primary" id="btn-add-media">
                        <i data-lucide="upload"></i> อัปโหลดคลังสื่อใหม่
                    </button>
                ` : ''}
            </div>

            <div class="card" style="margin-bottom: 1.5rem; padding: 1rem;">
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;" id="media-filters-wrapper">
                    <button class="btn btn-primary btn-sm btn-media-filter active" data-subject="">ทั้งหมด</button>
                    <button class="btn btn-secondary btn-sm btn-media-filter" data-subject="คณิตศาสตร์">คณิตศาสตร์</button>
                    <button class="btn btn-secondary btn-sm btn-media-filter" data-subject="วิทยาศาสตร์">วิทยาศาสตร์</button>
                    <button class="btn btn-secondary btn-sm btn-media-filter" data-subject="ภาษาอังกฤษ">ภาษาอังกฤษ</button>
                    <button class="btn btn-secondary btn-sm btn-media-filter" data-subject="ภาษาไทย">ภาษาไทย</button>
                </div>
            </div>

            <div class="media-library-grid" id="media-cards-container">
                ${renderItemsList()}
            </div>
        `;
        lucide.createIcons();

        const filters = document.querySelectorAll('.btn-media-filter');
        const container = document.getElementById('media-cards-container');

        filters.forEach(btn => {
            btn.addEventListener('click', () => {
                filters.forEach(b => {
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-secondary');
                });
                btn.classList.add('btn-primary');
                btn.classList.remove('btn-secondary');

                const subject = btn.getAttribute('data-subject');
                container.innerHTML = renderItemsList(subject);
                lucide.createIcons();
                this.bindMediaItemDeleteListeners();
            });
        });

        if (loggedIn) {
            document.getElementById('btn-add-media').addEventListener('click', () => {
                this.modalTitle.textContent = 'อัปโหลดแบ่งปันคลังสื่อเรียนรู้';
                this.modalBody.innerHTML = `
                    <div class="form-group">
                        <label>หัวข้อ/ชื่อสื่อการสอน <span style="color:var(--color-danger)">*</span></label>
                        <input type="text" class="form-control" name="title" required>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>กลุ่มสาระวิชา <span style="color:var(--color-danger)">*</span></label>
                            <select class="form-control" name="subject" required>
                                <option value="คณิตศาสตร์">คณิตศาสตร์</option>
                                <option value="วิทยาศาสตร์">วิทยาศาสตร์</option>
                                <option value="ภาษาอังกฤษ">ภาษาอังกฤษ</option>
                                <option value="ภาษาไทย">ภาษาไทย</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>ระดับชั้นการศึกษา <span style="color:var(--color-danger)">*</span></label>
                            <select class="form-control" name="grade" required>
                                <option value="ม.1">ม.1</option>
                                <option value="ม.2">ม.2</option>
                                <option value="ม.3">ม.3</option>
                                <option value="ม.4">ม.4</option>
                                <option value="ม.5">ม.5</option>
                                <option value="ม.6">ม.6</option>
                                <option value="ทั่วไป">ทั่วไป</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>ลิงก์ปลายทางสื่อไฟล์ (Link URL) <span style="color:var(--color-danger)">*</span></label>
                        <input type="url" class="form-control" name="link_url" placeholder="https://..." required>
                    </div>
                    <div class="form-group">
                        <label>รายละเอียด</label>
                        <textarea class="form-control" name="description" rows="2"></textarea>
                    </div>
                `;
                this.openModal();
                this.modalForm.onsubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(this.modalForm);
                    await window.dbService.addMediaItem({
                        title: formData.get('title'),
                        subject: formData.get('subject'),
                        grade: formData.get('grade'),
                        link_url: formData.get('link_url'),
                        description: formData.get('description')
                    });
                    this.closeModal();
                    this.renderMediaLibrary();
                };
            });
            this.bindMediaItemDeleteListeners();
        }
    }

    bindMediaItemDeleteListeners() {
        document.querySelectorAll('.btn-delete-media').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm("ยืนยันลบสื่อการเรียนรู้นี้?")) {
                    await window.dbService.deleteMediaItem(btn.getAttribute('data-id'));
                    this.renderMediaLibrary();
                }
            });
        });
    }

    // =========================================================================
    // 10. SETTINGS VIEW RENDERER (Connection Panel)
    // =========================================================================
    async renderSettings() {
        const urlInputVal = localStorage.getItem('supabase_url') || window.SUPABASE_CONFIG?.url || '';
        const keyInputVal = localStorage.getItem('supabase_anon_key') || window.SUPABASE_CONFIG?.anonKey || '';

        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>แผงควบคุมการตั้งค่าระบบและการเชื่อมต่อฐานข้อมูล</h1>
                    <p>คุณสามารถตั้งค่าการเชื่อมต่อฐานข้อมูล Supabase เพื่อให้ข้อมูลคงอยู่ถาวร</p>
                </div>
            </div>

            <div class="card" style="max-width:650px; margin:0 auto;">
                <div class="card-header">
                    <h2><i data-lucide="database" style="color:var(--color-primary)"></i> เชื่อมต่อฐานข้อมูล Supabase</h2>
                </div>

                <div class="info-alert">
                    <p><strong>💡 วิธีการเชื่อมต่อ:</strong></p>
                    <ol style="margin-left: 1.5rem; margin-top: 0.5rem; display:flex; flex-direction:column; gap:0.25rem;">
                        <li>สร้างโครงการใหม่ที่ <strong>supabase.com</strong></li>
                        <li>เข้าไปที่เมนู <strong>Project Settings > API</strong></li>
                        <li>คัดลอกค่า <strong>Project URL</strong> และ <strong>anon (public) key</strong> มาป้อน</li>
                        <li>รันชุดคำสั่งในไฟล์ <code>schema.sql</code> ของโปรเจกต์นี้ในหน้า SQL Editor เพื่อเตรียมตารางข้อมูล</li>
                    </ol>
                </div>

                <form id="settings-db-form">
                    <div class="form-group">
                        <label>Supabase Project URL</label>
                        <input type="url" class="form-control" id="settings-supabase-url" value="${urlInputVal}" required>
                    </div>
                    <div class="form-group">
                        <label>Supabase Anon (Public) Key</label>
                        <textarea class="form-control" id="settings-supabase-key" rows="3" style="resize:none;" required>${keyInputVal}</textarea>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border-color);">
                        <button type="button" class="btn btn-secondary btn-danger" id="btn-reset-db-settings">ยกเลิกการเชื่อมต่อ</button>
                        <button type="submit" class="btn btn-primary">บันทึกและรีสตาร์ทระบบ</button>
                    </div>
                </form>
            </div>
        `;

        const form = document.getElementById('settings-db-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const urlVal = document.getElementById('settings-supabase-url').value.trim();
            const keyVal = document.getElementById('settings-supabase-key').value.trim();

            try {
                const testClient = window.supabase.createClient(urlVal, keyVal);
                const { error } = await testClient.from('classes').select('id').limit(1);
                if (error) throw error;
                
                window.dbService.saveConnectionSettings(urlVal, keyVal);
                alert("เชื่อมต่อฐานข้อมูล Supabase สำเร็จ! 🚀");
                await this.init();
                window.location.hash = 'homepage';
            } catch (err) {
                alert("เชื่อมต่อล้มเหลว: " + err.message + "\n\nคำแนะนำ: ตรวจสอบ URL/Key และตรวจสอบว่ารันสคริปต์ sql เรียบร้อยแล้ว");
            }
        };

        document.getElementById('btn-reset-db-settings').addEventListener('click', async () => {
            if (confirm("ยกเลิกการเชื่อมต่อ Supabase หรือไม่?")) {
                window.dbService.clearConnectionSettings();
                alert("สลับกลับมาใช้โหมดจำลองสำเร็จ");
                await this.init();
                window.location.hash = 'homepage';
            }
        });
    }

    // =========================================================================
    // 11. TOP NAVIGATION DYNAMIC RENDERER
    // =========================================================================
    async renderTopNav() {
        if (!this.topNavLinks) return;
        try {
            const menuItems = await window.dbService.getNavigationMenu();
            const roots = menuItems.filter(m => !m.parent_id);
            
            let html = '';
            for (const root of roots) {
                const children = menuItems.filter(m => m.parent_id === root.id);
                const targetUrl = root.link_type === 'page' ? `#pages/${root.page_id}` : root.url;
                
                if (children.length > 0) {
                    html += `
                        <div class="top-nav-dropdown">
                            <a href="${targetUrl}" class="top-nav-item" data-nav="pages/${root.page_id || ''}" style="display: inline-flex; align-items: center; gap: 0.25rem; text-decoration: none;">
                                <span>${root.title}</span>
                                <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                            </a>
                            <div class="top-nav-dropdown-content">
                                ${children.map(child => {
                                    const childUrl = child.link_type === 'page' ? `#pages/${child.page_id}` : child.url;
                                    return `<a href="${childUrl}" style="text-decoration: none;">${child.title}</a>`;
                                }).join('')}
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <a href="${targetUrl}" class="top-nav-item" data-nav="${root.link_type === 'page' ? 'pages/' + root.page_id : (targetUrl.startsWith('#') ? targetUrl.substring(1) : targetUrl)}" style="text-decoration: none;">
                            ${root.title}
                        </a>
                    `;
                }
            }
            this.topNavLinks.innerHTML = html;
            lucide.createIcons();
        } catch (error) {
            console.error("Error rendering top navigation:", error);
        }
    }

    // =========================================================================
    // 12. CUSTOM PAGE VIEWPORT RENDERER
    // =========================================================================
    async renderPage(id) {
        this.viewport.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:300px; color:var(--text-muted);">
            <i data-lucide="loader" class="animate-spin" style="width: 32px; height: 32px; margin-right: 8px;"></i>
            <span>กำลังโหลดหน้าเพจ...</span>
        </div>`;
        lucide.createIcons();

        try {
            const page = await window.dbService.getPageById(id);
            if (page) {
                this.viewport.innerHTML = `
                    <div style="max-width: 800px; margin: 2rem auto; padding: 0 1rem;">
                        <article class="card" style="padding: 2.5rem; line-height: 1.8;">
                            <h1 style="font-size: 2.25rem; font-weight: 700; color: var(--color-primary); margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-color); padding-bottom: 1rem;">
                                ${page.title}
                            </h1>
                            <div class="page-content-body" style="font-size: 1.05rem; color: var(--text-main);">
                                ${page.content}
                            </div>
                        </article>
                    </div>
                `;
            } else {
                this.viewport.innerHTML = `
                    <div style="max-width: 600px; margin: 5rem auto; text-align: center;">
                        <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: var(--color-danger); margin-bottom: 1rem;"></i>
                        <h2 style="color: var(--color-danger); font-size: 2rem; margin-bottom: 1rem;">ไม่พบหน้าที่คุณต้องการ</h2>
                        <p style="color: var(--text-muted); margin-bottom: 2rem;">หน้าเพจนี้อาจถูกลบหรือไม่มีอยู่ในระบบ</p>
                        <a href="#homepage" class="btn btn-primary">กลับสู่หน้าหลัก</a>
                    </div>
                `;
            }
            lucide.createIcons();
        } catch (error) {
            console.error("Error rendering page:", error);
            this.viewport.innerHTML = `<div class="card" style="border-color: var(--color-danger); text-align: center; padding: 3rem;">
                <h2>โหลดหน้าเพจผิดพลาด</h2>
                <p>${error.message || error}</p>
            </div>`;
        }
    }

    // =========================================================================
    // 13. LOGIN RENDERER
    // =========================================================================
    async renderLogin() {
        this.viewport.innerHTML = `
            <div class="login-card">
                <div class="login-logo" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 2rem; text-align: center;">
                    <div style="background: var(--color-primary); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);">
                        <i data-lucide="school" style="width: 30px; height: 30px; color: #ffffff;"></i>
                    </div>
                    <h2 style="font-size: 1.5rem; font-weight: 700; letter-spacing: 0.5px; color:#ffffff;">เข้าสู่ระบบจัดการโรงเรียน</h2>
                    <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; margin-top: 0.25rem;">สำหรับผู้ดูแลระบบและบุคลากรโรงเรียน</p>
                </div>
                
                <form id="login-form">
                    <div class="form-group" style="margin-bottom: 1.25rem;">
                        <label style="display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; color: rgba(255,255,255,0.8);">ชื่อผู้ใช้ (Username)</label>
                        <input type="text" id="login-username" class="form-control" required placeholder="กรอกชื่อผู้ใช้ของคุณ" style="width: 100%; padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.15); background: rgba(255, 255, 255, 0.05); color: #fff; font-size: 0.9rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label style="display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; color: rgba(255,255,255,0.8);">รหัสผ่าน (Password)</label>
                        <input type="password" id="login-password" class="form-control" required placeholder="กรอกรหัสผ่านของคุณ" style="width: 100%; padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.15); background: rgba(255, 255, 255, 0.05); color: #fff; font-size: 0.9rem;">
                    </div>
                    
                    <div id="login-error-msg" style="display: none; color: #f87171; font-size: 0.85rem; margin-bottom: 1.25rem; text-align: center; background: rgba(239, 68, 68, 0.1); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(239, 68, 68, 0.2);">
                        ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; font-weight: 600; font-size: 0.95rem; border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                        เข้าสู่ระบบ
                    </button>
                    
                    <div style="margin-top: 1.5rem; text-align: center;">
                        <a href="#homepage" style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem; transition: color 0.2s;">
                            <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i>
                            <span>กลับสู่หน้าเว็บหลัก</span>
                        </a>
                    </div>
                </form>
            </div>
        `;
        lucide.createIcons();

        const form = document.getElementById('login-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();
            const errorMsg = document.getElementById('login-error-msg');
            
            let authenticatedRole = null;
            if (username === 'admin' && password === 'admin1234') {
                authenticatedRole = 'Admin';
            } else if (username === 'teacher' && password === 'teacher1234') {
                authenticatedRole = 'Teacher';
            }
            
            if (authenticatedRole) {
                sessionStorage.setItem('user_role', authenticatedRole);
                this.handleRoleChange(authenticatedRole);
                if (this.roleSwitcher) this.roleSwitcher.value = authenticatedRole;
                window.location.hash = 'backend/dashboard';
            } else {
                errorMsg.style.display = 'block';
            }
        });
    }

    // =========================================================================
    // 14. BACKEND PAGES CMS RENDERER
    // =========================================================================
    async renderBackendPages() {
        const pages = await window.dbService.getPages();
        
        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>จัดการหน้าเพจและบทความ</h1>
                    <p>คุณสามารถเขียนเนื้อหาข่าวประชาสัมพันธ์ หรือข้อมูลทางวิชาการเพื่อแสดงบนหน้าเว็บไซต์</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" id="btn-add-page-backend">
                        <i data-lucide="plus-circle" style="width: 16px; height: 16px; margin-right: 4px;"></i> เขียนหน้าเพจใหม่
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2><i data-lucide="file-text" style="color:var(--color-primary)"></i> รายการหน้าเพจทั้งหมดในระบบ</h2>
                </div>
                <div style="overflow-x:auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>หัวข้อหน้าเพจ</th>
                                <th>ลิงก์อ้างอิง (Hash URL)</th>
                                <th>วันที่สร้าง</th>
                                <th style="text-align:right;">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pages.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">ไม่มีข้อมูลหน้าเพจในระบบ</td></tr>' : pages.map(p => `
                                <tr>
                                    <td style="font-weight:600; color:var(--text-main);">${p.title}</td>
                                    <td><code style="background:var(--bg-card-hover); padding:0.2rem 0.4rem; border-radius:var(--radius-sm); font-size:0.8rem;">#pages/${p.id}</code></td>
                                    <td>${new Date(p.created_at || Date.now()).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    <td style="text-align:right; display:flex; justify-content:flex-end; gap:0.5rem;">
                                        <button class="btn btn-secondary btn-sm btn-edit-page" data-id="${p.id}" title="แก้ไข">
                                            <i data-lucide="edit" style="width:14px; height:14px;"></i> แก้ไข
                                        </button>
                                        <button class="btn btn-secondary btn-danger btn-sm btn-delete-page" data-id="${p.id}" title="ลบ">
                                            <i data-lucide="trash-2" style="width:14px; height:14px;"></i> ลบ
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        lucide.createIcons();

        // Bind add page button
        document.getElementById('btn-add-page-backend').addEventListener('click', () => this.showPageEditorForm(null));

        // Bind edit & delete buttons
        document.querySelectorAll('.btn-edit-page').forEach(btn => {
            btn.addEventListener('click', () => this.showPageEditorForm(btn.getAttribute('data-id')));
        });

        document.querySelectorAll('.btn-delete-page').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm("ยืนยันที่จะลบหน้าเพจนี้หรือไม่? ลิงก์เมนูที่อ้างอิงถึงหน้าเพจนี้จะถูกลบไปด้วย")) {
                    await window.dbService.deletePage(btn.getAttribute('data-id'));
                    await this.renderTopNav();
                    this.renderBackendPages();
                }
            });
        });
    }

    async showPageEditorForm(pageId = null) {
        let pageData = { title: '', content: '' };
        if (pageId) {
            pageData = await window.dbService.getPageById(pageId);
        }

        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>${pageId ? 'แก้ไขหน้าเพจ' : 'เขียนหน้าเพจใหม่'}</h1>
                    <p>ป้อนรายละเอียดหัวข้อและโค้ด HTML ของหน้าเพจที่ต้องการบันทึก</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-secondary" id="btn-cancel-page-editor">ย้อนกลับ</button>
                </div>
            </div>

            <div class="card" style="max-width:900px; margin: 0 auto;">
                <form id="page-editor-form">
                    <div class="form-group">
                        <label>หัวข้อหน้าเพจ (Title)</label>
                        <input type="text" class="form-control" id="page-title-input" value="${pageData.title}" required placeholder="เช่น ประวัติความเป็นมาของโรงเรียน">
                    </div>
                    
                    <div class="form-group">
                        <label>เนื้อหาของหน้าเพจ (Content - รองรับ HTML)</label>
                        <textarea class="form-control" id="page-content-input" rows="18" style="font-family: monospace; font-size:0.9rem;" required placeholder="ป้อนเนื้อหาบทความด้วยโค้ด HTML หรือข้อความธรรมดา เช่น &lt;h2&gt;หัวข้อ&lt;/h2&gt;&lt;p&gt;เนื้อหา...&lt;/p&gt;">${pageData.content}</textarea>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border-color);">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-page-editor-footer">ยกเลิก</button>
                        <button type="submit" class="btn btn-primary">บันทึกข้อมูลหน้าเพจ</button>
                    </div>
                </form>
            </div>
        `;
        lucide.createIcons();

        const handleCancel = () => this.renderBackendPages();
        document.getElementById('btn-cancel-page-editor').addEventListener('click', handleCancel);
        document.getElementById('btn-cancel-page-editor-footer').addEventListener('click', handleCancel);

        const form = document.getElementById('page-editor-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const title = document.getElementById('page-title-input').value.trim();
            const content = document.getElementById('page-content-input').value.trim();

            if (pageId) {
                await window.dbService.updatePage(pageId, { title, content });
            } else {
                await window.dbService.addPage({ title, content });
            }
            await this.renderTopNav();
            this.renderBackendPages();
        };
    }

    // =========================================================================
    // 15. BACKEND NAVIGATION MENU CMS RENDERER
    // =========================================================================
    async renderBackendNavigation() {
        const navItems = await window.dbService.getNavigationMenu();
        const pages = await window.dbService.getPages();

        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>จัดการเมนูนำทางด้านบน (Top Navigation)</h1>
                    <p>เพิ่ม แก้ไข หรือลบแถบเมนูด้านบนของเว็บไซต์ สามารถจัดกลุ่มทำเป็นเมนูย่อย (Sub-menu Dropdown) ได้</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" id="btn-add-nav-backend">
                        <i data-lucide="plus-circle" style="width: 16px; height: 16px; margin-right: 4px;"></i> เพิ่มรายการเมนูใหม่
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2><i data-lucide="menu" style="color:var(--color-primary)"></i> โครงสร้างเมนูทั้งหมดในระบบ</h2>
                </div>
                <div style="overflow-x:auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>หัวข้อเมนู</th>
                                <th>ประเภท</th>
                                <th>ปลายทางลิงก์ (URL / Page ID)</th>
                                <th>เมนูหลัก (Parent)</th>
                                <th>ลำดับ</th>
                                <th style="text-align:right;">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${navItems.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">ไม่มีรายการเมนูในระบบ</td></tr>' : navItems.map(n => {
                                const parent = navItems.find(p => p.id === n.parent_id);
                                const targetDesc = n.link_type === 'page' ? `หน้าเพจ: ${pages.find(p => p.id === n.page_id)?.title || n.page_id}` : `ลิงก์ภายนอก: ${n.url}`;
                                return `
                                    <tr>
                                        <td style="font-weight:600; color:var(--text-main); ${n.parent_id ? 'padding-left: 2rem;' : ''}">
                                            ${n.parent_id ? '<span style="color:var(--text-muted); margin-right:0.25rem;">└</span>' : ''} ${n.title}
                                        </td>
                                        <td><span class="badge ${n.link_type === 'page' ? 'badge-success' : 'badge-warning'}">${n.link_type === 'page' ? 'หน้าเพจ' : 'ลิงก์ภายนอก'}</span></td>
                                        <td style="font-size:0.85rem; color:var(--text-muted);">${targetDesc}</td>
                                        <td style="color:var(--text-muted);">${parent ? parent.title : '-'}</td>
                                        <td>${n.display_order}</td>
                                        <td style="text-align:right; display:flex; justify-content:flex-end; gap:0.5rem;">
                                            <button class="btn btn-secondary btn-sm btn-edit-nav" data-id="${n.id}">
                                                <i data-lucide="edit" style="width:14px; height:14px;"></i> แก้ไข
                                            </button>
                                            <button class="btn btn-secondary btn-danger btn-sm btn-delete-nav" data-id="${n.id}">
                                                <i data-lucide="trash-2" style="width:14px; height:14px;"></i> ลบ
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        lucide.createIcons();

        // Bind add menu button
        document.getElementById('btn-add-nav-backend').addEventListener('click', () => this.showNavForm(null, navItems, pages));

        // Bind edit & delete buttons
        document.querySelectorAll('.btn-edit-nav').forEach(btn => {
            btn.addEventListener('click', () => this.showNavForm(btn.getAttribute('data-id'), navItems, pages));
        });

        document.querySelectorAll('.btn-delete-nav').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm("ยืนยันที่จะลบเมนูนี้หรือไม่? หากลบเมนูหลัก เมนูย่อยทั้งหมดจะถูกลบไปด้วย")) {
                    await window.dbService.deleteNavigationItem(btn.getAttribute('data-id'));
                    await this.renderTopNav();
                    this.renderBackendNavigation();
                }
            });
        });
    }

    async showNavForm(navId = null, navItems = [], pages = []) {
        let navData = { title: '', link_type: 'page', page_id: '', url: '', parent_id: '', display_order: 1 };
        if (navId) {
            navData = navItems.find(n => n.id === navId) || navData;
        }

        // Filter valid parents (cannot choose itself or its submenus as parent to avoid cycles)
        const validParents = navItems.filter(n => !n.parent_id && n.id !== navId);

        this.viewport.innerHTML = `
            <div class="page-header">
                <div class="page-title">
                    <h1>${navId ? 'แก้ไขรายการเมนู' : 'เพิ่มรายการเมนูใหม่'}</h1>
                    <p>กำหนดรายละเอียด หัวข้อเมนู ลิงก์ปลายทาง และการจัดลำดับการแสดงผล</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-secondary" id="btn-cancel-nav-form">ย้อนกลับ</button>
                </div>
            </div>

            <div class="card" style="max-width:600px; margin: 0 auto;">
                <form id="nav-item-form">
                    <div class="form-group">
                        <label>หัวข้อเมนู (Menu Title)</label>
                        <input type="text" class="form-control" id="nav-title" value="${navData.title}" required placeholder="เช่น ประวัติโรงเรียน">
                    </div>
                    
                    <div class="form-group">
                        <label>ประเภทลิงก์ (Link Type)</label>
                        <select class="form-control" id="nav-link-type">
                            <option value="page" ${navData.link_type === 'page' ? 'selected' : ''}>ลิงก์ไปหน้าเพจ CMS ภายในระบบ</option>
                            <option value="external" ${navData.link_type === 'external' ? 'selected' : ''}>ระบุ URL/ลิงก์ภายนอกเอง</option>
                        </select>
                    </div>

                    <div class="form-group" id="nav-page-wrapper" style="display: ${navData.link_type === 'page' ? 'block' : 'none'};">
                        <label>เลือกหน้าเพจ CMS ที่ต้องการลิงก์ไป</label>
                        <select class="form-control" id="nav-page-id">
                            <option value="">-- เลือกหน้าเพจ --</option>
                            ${pages.map(p => `<option value="${p.id}" ${navData.page_id === p.id ? 'selected' : ''}>${p.title}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-group" id="nav-url-wrapper" style="display: ${navData.link_type === 'external' ? 'block' : 'none'};">
                        <label>ระบุ URL (ภายนอก หรือ ID อื่นๆ เช่น #backend/attendance)</label>
                        <input type="text" class="form-control" id="nav-url" value="${navData.url || ''}" placeholder="เช่น https://google.com หรือ #backend/attendance">
                    </div>

                    <div class="form-group">
                        <label>เลือกเมนูหลักเพื่อสร้างเมนูย่อย (Parent Menu - ปล่อยว่างหากต้องการให้เป็นเมนูหลัก)</label>
                        <select class="form-control" id="nav-parent-id">
                            <option value="">-- ไม่มี (เป็นเมนูหลัก) --</option>
                            ${validParents.map(p => `<option value="${p.id}" ${navData.parent_id === p.id ? 'selected' : ''}>${p.title}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>ลำดับจัดเรียงแสดงผล (Display Order)</label>
                        <input type="number" class="form-control" id="nav-display-order" value="${navData.display_order}" min="1" required>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border-color);">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-nav-form-footer">ยกเลิก</button>
                        <button type="submit" class="btn btn-primary">บันทึกข้อมูลเมนู</button>
                    </div>
                </form>
            </div>
        `;
        lucide.createIcons();

        // Listen for type switch
        const typeSelect = document.getElementById('nav-link-type');
        const pageWrapper = document.getElementById('nav-page-wrapper');
        const urlWrapper = document.getElementById('nav-url-wrapper');
        const pageIdSelect = document.getElementById('nav-page-id');
        const urlInput = document.getElementById('nav-url');

        typeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'page') {
                pageWrapper.style.display = 'block';
                urlWrapper.style.display = 'none';
                pageIdSelect.required = true;
                urlInput.required = false;
            } else {
                pageWrapper.style.display = 'none';
                urlWrapper.style.display = 'block';
                pageIdSelect.required = false;
                urlInput.required = true;
            }
        });

        // Set required logic on load
        if (navData.link_type === 'page') {
            pageIdSelect.required = true;
        } else {
            urlInput.required = true;
        }

        const handleCancel = () => this.renderBackendNavigation();
        document.getElementById('btn-cancel-nav-form').addEventListener('click', handleCancel);
        document.getElementById('btn-cancel-nav-form-footer').addEventListener('click', handleCancel);

        const form = document.getElementById('nav-item-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const title = document.getElementById('nav-title').value.trim();
            const link_type = typeSelect.value;
            const page_id = link_type === 'page' ? pageIdSelect.value : null;
            const url = link_type === 'external' ? urlInput.value.trim() : null;
            const parent_id = document.getElementById('nav-parent-id').value || null;
            const display_order = parseInt(document.getElementById('nav-display-order').value) || 1;

            const data = { title, link_type, page_id, url, parent_id, display_order };

            if (navId) {
                await window.dbService.updateNavigationItem(navId, data);
            } else {
                await window.dbService.addNavigationItem(data);
            }
            await this.renderTopNav();
            this.renderBackendNavigation();
        };
    }

    // ==========================================
    // MODAL UTILITY METHODS
    // ==========================================
    openModal() {
        this.modalBackdrop.style.display = 'flex';
        lucide.createIcons();
    }

    closeModal() {
        this.modalBackdrop.style.display = 'none';
        this.modalForm.reset();
        this.modalForm.onsubmit = null;
    }

    handleGlobalSearch(query) {
        if (this.currentView === 'students') {
            const rows = document.querySelectorAll('.student-row');
            rows.forEach(row => {
                const searchContent = row.getAttribute('data-search-content').toLowerCase();
                row.style.display = searchContent.includes(query) ? '' : 'none';
            });
        } else if (this.currentView === 'teachers') {
            const rows = document.querySelectorAll('.teacher-row');
            rows.forEach(row => {
                const searchContent = row.getAttribute('data-search-content').toLowerCase();
                row.style.display = searchContent.includes(query) ? '' : 'none';
            });
        }
    }
}

// Instantiate and start app on window loaded
window.addEventListener('DOMContentLoaded', () => {
    window.app = new SchoolHubApp();
    window.app.init();
});
