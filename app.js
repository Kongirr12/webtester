let supabaseClient = null;

// Initialize Supabase Client if configured
if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined') {
    if (SUPABASE_URL !== "YOUR_SUPABASE_URL" && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY") {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggles
    initMobileMenu();

    // 2. Load Data from Supabase (or Fallback if not configured)
    if (supabaseClient) {
        loadNavbar();
        loadBanners();
        loadNews();
        loadNewsletters();
        loadSettings();
        loadExecutives();
        loadSidebarLinks();
    } else {
        checkSupabaseConfig(); // แสดง Warning Banner
        loadMockData(); // โหลดข้อมูลตัวอย่างแสดงผลให้ดูก่อนเซ็ตอัพจริง
    }
});

// === 1. Mobile Menu Controls ===
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger-menu');
    const navMenu = document.getElementById('navbar-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            hamburger.classList.toggle('active');
            
            // Toggle hamburger icon animation
            const spans = hamburger.querySelectorAll('span');
            if (hamburger.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
}

// === 2. Load Dynamic Navbar ===
async function loadNavbar() {
    try {
        const { data, error } = await supabaseClient
            .from('navbar')
            .select('*')
            .eq('is_active', true)
            .order('menu_order', { ascending: true });

        if (error) throw error;
        renderNavbar(data);
    } catch (err) {
        console.error('Error loading navbar:', err);
    }
}

function renderNavbar(menuItems) {
    const navbarMenu = document.getElementById('navbar-menu');
    
    // เคลียร์เมนูเดิมยกเว้นหน้าแรก
    const homeLink = navbarMenu.querySelector('li');
    navbarMenu.innerHTML = '';
    if (homeLink) navbarMenu.appendChild(homeLink);

    // กรองเมนูหลัก (parent_id เป็น null)
    const mainMenus = menuItems.filter(item => !item.parent_id);
    
    mainMenus.forEach(main => {
        const subMenus = menuItems.filter(sub => sub.parent_id === main.id);
        const li = document.createElement('li');
        li.className = 'nav-item';
        
        // ตรวจสอบลิ้งก์ปลายทาง
        let url = 'javascript:void(0);';
        if (main.url) {
            url = main.url;
        } else if (main.page_content) {
            url = `page.html?id=${main.id}`;
        }
        
        if (subMenus.length > 0) {
            // เมนูหลักที่มีเมนูย่อย
            li.innerHTML = `
                <a href="${url}" class="nav-link">${main.label} <i class="fa-solid fa-chevron-down" style="font-size:10px; margin-left:5px;"></i></a>
                <ul class="dropdown-menu"></ul>
            `;
            
            const dropdown = li.querySelector('.dropdown-menu');
            subMenus.forEach(sub => {
                let subUrl = 'javascript:void(0);';
                if (sub.url) {
                    subUrl = sub.url;
                } else if (sub.page_content) {
                    subUrl = `page.html?id=${sub.id}`;
                }
                
                const subLi = document.createElement('li');
                subLi.className = 'dropdown-item';
                subLi.innerHTML = `<a href="${subUrl}" class="dropdown-link">${sub.label}</a>`;
                dropdown.appendChild(subLi);
            });

            // เพิ่มความสามารถในการคลิกเปิดเมนูย่อยบนมือถือ
            const mainLink = li.querySelector('.nav-link');
            mainLink.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    li.classList.toggle('active');
                }
            });
            
        } else {
            // เมนูเดี่ยว ไม่มีเมนูย่อย
            li.innerHTML = `<a href="${url}" class="nav-link">${main.label}</a>`;
        }
        
        navbarMenu.appendChild(li);
    });
}

// === 3. Slider Banners ===
let slideIndex = 0;
let slideInterval = null;

async function loadBanners() {
    try {
        const { data, error } = await supabaseClient
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('menu_order', { ascending: true });

        if (error) throw error;
        
        // แยก Banner หลักกับ Banner เทศกาล
        const mainBanners = data.filter(b => b.type === 'main');
        const festivalBanners = data.filter(b => b.type === 'festival');

        // เรนเดอร์ Banner หลัก
        if (mainBanners.length > 0) {
            renderMainSlider(mainBanners);
        }

        // เรนเดอร์ Banner เทศกาล
        const festivalArea = document.getElementById('festival-banner-area');
        if (festivalBanners.length > 0) {
            festivalArea.style.display = 'block';
            festivalArea.innerHTML = `
                <a href="${festivalBanners[0].image_url}" target="_blank">
                    <img src="${festivalBanners[0].image_url}" alt="${festivalBanners[0].title || 'แบนเนอร์วันสำคัญ'}">
                </a>
            `;
        } else {
            festivalArea.style.display = 'none';
        }
    } catch (err) {
        console.error('Error loading banners:', err);
    }
}

function renderMainSlider(banners) {
    const slider = document.getElementById('main-slider');
    const dotsContainer = document.getElementById('slider-dots-container');
    
    // เคลียร์ค่าเดิม
    slider.querySelectorAll('.slide').forEach(s => s.remove());
    dotsContainer.innerHTML = '';
    
    banners.forEach((banner, idx) => {
        // สร้าง Slide
        const slide = document.createElement('div');
        slide.className = `slide ${idx === 0 ? 'active' : ''}`;
        slide.style.backgroundImage = `url('${banner.image_url}')`;
        slide.innerHTML = `
            <div class="slide-overlay">
                <h2 class="slide-title">${banner.title || ''}</h2>
            </div>
        `;
        slider.appendChild(slide);
        
        // สร้าง Dot
        const dot = document.createElement('span');
        dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
        dot.dataset.index = idx;
        dot.addEventListener('click', () => showSlide(idx));
        dotsContainer.appendChild(dot);
    });

    slideIndex = 0;
    initSliderInterval();

    // ปุ่มควบคุม
    document.getElementById('slider-prev').onclick = () => showSlide(slideIndex - 1);
    document.getElementById('slider-next').onclick = () => showSlide(slideIndex + 1);
}

function showSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    
    if (slides.length === 0) return;
    
    // วนลูปรูป
    if (index >= slides.length) slideIndex = 0;
    else if (index < 0) slideIndex = slides.length - 1;
    else slideIndex = index;
    
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    
    slides[slideIndex].classList.add('active');
    dots[slideIndex].classList.add('active');
    
    initSliderInterval(); // เริ่มนับเวลาใหม่เมื่อกดเลือกสไลด์ด้วยตนเอง
}

function initSliderInterval() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        showSlide(slideIndex + 1);
    }, 5000); // เปลี่ยนสไลด์ทุก 5 วินาที
}

// === 4. Announcements / News ===
async function loadNews() {
    const container = document.getElementById('news-list-container');
    try {
        const { data, error } = await supabaseClient
            .from('news')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        container.innerHTML = '';
        if (data.length === 0) {
            container.innerHTML = '<div style="text-align:center; width:100%; color:var(--text-muted);">ยังไม่มีรายการข่าวประกาศ</div>';
            return;
        }
        
        data.forEach(item => {
            const dateStr = new Date(item.created_at).toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            
            const card = document.createElement('article');
            card.className = 'news-card';
            card.innerHTML = `
                <div class="news-image">
                    <img src="${item.cover_url || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600'}" alt="${item.title}">
                </div>
                <div class="news-info">
                    <span class="news-date"><i class="fa-regular fa-calendar"></i> ${dateStr}</span>
                    <h3 class="news-title">${item.title}</h3>
                    <a href="news-detail.html?id=${item.id}" class="news-link">อ่านรายละเอียด <i class="fa-solid fa-circle-arrow-right"></i></a>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading news:', err);
        container.innerHTML = '<div style="color:red; text-align:center; width:100%;">เกิดข้อผิดพลาดในการโหลดข่าวสาร</div>';
    }
}

// === 5. Newsletters with Filtering ===
let allNewsletters = [];

async function loadNewsletters() {
    const container = document.getElementById('newsletter-list-container');
    const filterBar = document.getElementById('academic-year-filters');
    
    try {
        const { data, error } = await supabaseClient
            .from('newsletters')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        allNewsletters = data;
        
        // ดึงปีการศึกษาที่ไม่ซ้ำกัน
        const years = [...new Set(data.map(item => item.academic_year))].sort((a,b) => b - a);
        
        // เคลียร์ปุ่มฟิลเตอร์และสร้างใหม่
        filterBar.innerHTML = '<button class="filter-btn active" data-year="all">ทั้งหมด</button>';
        years.forEach(year => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.year = year;
            btn.textContent = `ปีการศึกษา ${year}`;
            filterBar.appendChild(btn);
        });

        // แอด Event Listener สำหรับฟิลเตอร์
        filterBar.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderNewsletters(btn.dataset.year);
            });
        });

        renderNewsletters('all');
    } catch (err) {
        console.error('Error loading newsletters:', err);
        container.innerHTML = '<div style="color:red; text-align:center; width:100%;">เกิดข้อผิดพลาดในการโหลดจดหมายข่าว</div>';
    }
}

function renderNewsletters(yearFilter) {
    const container = document.getElementById('newsletter-list-container');
    container.innerHTML = '';
    
    const filtered = yearFilter === 'all' 
        ? allNewsletters 
        : allNewsletters.filter(item => item.academic_year === yearFilter);

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; width:100%; color:var(--text-muted); padding: 20px;">ไม่มีจดหมายข่าวของปีการศึกษานี้</div>';
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'newsletter-card';
        card.innerHTML = `
            <a href="${item.image_url}" target="_blank">
                <div class="newsletter-image">
                    <img src="${item.image_url}" alt="${item.title}">
                    <span class="newsletter-year-badge">ปีการศึกษา ${item.academic_year}</span>
                </div>
                <div class="newsletter-title">${item.title}</div>
            </a>
        `;
        container.appendChild(card);
    });
}

// === 6. Settings (Facebook Embed Code) ===
async function loadSettings() {
    try {
        const { data, error } = await supabaseClient
            .from('settings')
            .select('*');

        if (error) throw error;
        
        const fbSetting = data.find(s => s.key === 'facebook_embed_url');
        if (fbSetting && fbSetting.value) {
            const container = document.getElementById('fb-iframe-container');
            // ทำการกรองและครอบโค้ด/ลิ้งก์ให้แสดงได้อย่างปลอดภัย
            if (fbSetting.value.startsWith('http')) {
                container.innerHTML = `
                    <iframe src="https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(fbSetting.value)}&tabs=timeline&width=500&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true" 
                            width="500" height="500" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
                `;
            } else {
                // หากใส่เป็น iframe code มาโดยตรง
                container.innerHTML = fbSetting.value;
            }
        }
    } catch (err) {
        console.error('Error loading settings:', err);
    }
}

// === 7. Executives ===
async function loadExecutives() {
    const container = document.getElementById('executives-list-container');
    try {
        const { data, error } = await supabaseClient
            .from('executives')
            .select('*')
            .order('menu_order', { ascending: true });

        if (error) throw error;
        
        container.innerHTML = '';
        if (data.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:var(--text-muted);">ไม่มีข้อมูลทำเนียบผู้บริหาร</div>';
            return;
        }

        data.forEach(exec => {
            const card = document.createElement('div');
            card.className = 'exec-card';
            card.innerHTML = `
                <img src="${exec.image_url}" alt="${exec.name}" class="exec-image">
                <div class="exec-name">${exec.name}</div>
                <div class="exec-position">${exec.position}</div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading executives:', err);
    }
}

// === 8. Sidebar Links & e-Services ===
async function loadSidebarLinks() {
    const agencyContainer = document.getElementById('agency-links-container');
    const eserviceContainer = document.getElementById('eservice-links-container');
    
    try {
        const { data, error } = await supabaseClient
            .from('sidebar_links')
            .select('*')
            .order('menu_order', { ascending: true });

        if (error) throw error;
        
        agencyContainer.innerHTML = '';
        eserviceContainer.innerHTML = '';
        
        const agencies = data.filter(item => item.type === 'agency');
        const eservices = data.filter(item => item.type === 'eservice');
        
        // เรนเดอร์หน่วยงานภายนอก
        if (agencies.length === 0) {
            agencyContainer.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:13px;">ไม่มีลิงก์หน่วยงาน</div>';
        } else {
            agencies.forEach(item => {
                const link = document.createElement('a');
                link.href = item.url;
                link.target = '_blank';
                link.className = 'agency-link-banner';
                link.innerHTML = `<img src="${item.image_url || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=250'}" alt="${item.title}">`;
                agencyContainer.appendChild(link);
            });
        }
        
        // เรนเดอร์ e-Service
        if (eservices.length === 0) {
            eserviceContainer.innerHTML = '<div style="text-align:center; grid-column: span 2; color:var(--text-muted); font-size:13px;">ไม่มีบริการ e-Service</div>';
        } else {
            eservices.forEach(item => {
                const btn = document.createElement('a');
                btn.href = item.url;
                btn.target = '_blank';
                btn.className = 'eservice-button';
                
                // ใช้ไอคอนแบบสุ่มหรือไอคอนเริ่มต้น หากไม่มีฟิลด์ระบุไอคอนเฉพาะ
                const iconClass = item.image_url || 'fa-solid fa-graduation-cap';
                
                btn.innerHTML = `
                    <i class="${iconClass} eservice-icon"></i>
                    <span class="eservice-title">${item.title}</span>
                `;
                eserviceContainer.appendChild(btn);
            });
        }
    } catch (err) {
        console.error('Error loading sidebar links:', err);
    }
}

// === 9. Mock Data Fallback (สำหรับทดลองรันครั้งแรกโดยไม่ต้องเซ็ต Supabase) ===
function loadMockData() {
    // 9.1 Mock Navbar
    const mockNavbar = [
        { id: 1, label: "ข้อมูลโรงเรียน", url: null, parent_id: null, menu_order: 1, is_active: true },
        { id: 2, label: "ข้อมูลทั่วไป", url: "page.html?mock=about", parent_id: 1, menu_order: 1, is_active: true },
        { id: 3, label: "วิสัยทัศน์/พันธกิจ", url: "page.html?mock=vision", parent_id: 1, menu_order: 2, is_active: true },
        { id: 4, label: "ประวัติโรงเรียน", url: "page.html?mock=history", parent_id: 1, menu_order: 3, is_active: true },
        { id: 5, label: "ฝ่ายบริหารงาน", url: null, parent_id: null, menu_order: 2, is_active: true },
        { id: 6, label: "กลุ่มบริหารวิชาการ", url: "page.html?mock=academic", parent_id: 5, menu_order: 1, is_active: true },
        { id: 7, label: "กลุ่มบริหารงบประมาณ", url: "page.html?mock=budget", parent_id: 5, menu_order: 2, is_active: true },
        { id: 8, label: "กลุ่มบริหารงานบุคคล", url: "page.html?mock=personnel", parent_id: 5, menu_order: 3, is_active: true },
        { id: 9, label: "ข้อมูลนักเรียน", url: "page.html?mock=students", parent_id: null, menu_order: 3, is_active: true },
        { id: 10, label: "ติดต่อเรา", url: "page.html?mock=contact", parent_id: null, menu_order: 4, is_active: true }
    ];
    renderNavbar(mockNavbar);

    // 9.2 Mock Banners
    const mockBanners = [
        { id: 1, title: "มุ่งมั่นสู่ความเป็นเลิศ พัฒนาวิชาการและเทคโนโลยี", image_url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200", type: "main", is_active: true, menu_order: 1 },
        { id: 2, title: "บรรยากาศการเรียนรู้ที่เอื้อต่อการสร้างอนาคต", image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200", type: "main", is_active: true, menu_order: 2 },
        { id: 3, title: "กิจกรรมพัฒนาผู้เรียน กีฬา และศิลปวัฒนธรรม", image_url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1200", type: "main", is_active: true, menu_order: 3 },
        { id: 4, title: "วันครบรอบวันสถาปนาโรงเรียนมหาชัยพิทยาคาร", image_url: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1200", type: "festival", is_active: true, menu_order: 1 }
    ];
    
    renderMainSlider(mockBanners.filter(b => b.type === 'main'));
    
    const festivalArea = document.getElementById('festival-banner-area');
    festivalArea.style.display = 'block';
    festivalArea.innerHTML = `
        <div style="background-color: var(--primary); color: white; padding: 15px; text-align: center; border-radius: var(--radius-md); font-weight: bold;">
            🎉 กิจกรรมและวันสำคัญ: วันครบรอบวันสถาปนาโรงเรียนมหาชัยพิทยาคาร วันที่ 1 กรกฎาคมนี้
        </div>
    `;

    // 9.3 Mock News
    const mockNews = [
        { id: 1, title: "ประกาศรับสมัครนักเรียนใหม่ ประจำปีการศึกษา 2568 รอบโควตาพิเศษ", cover_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600", created_at: "2026-06-15T00:00:00Z" },
        { id: 2, title: "นักเรียนโรงเรียนมหาชัยพิทยาคาร คว้าเหรียญทองการแข่งขันทักษะคอมพิวเตอร์ระดับประเทศ", cover_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600", created_at: "2026-06-12T00:00:00Z" },
        { id: 3, title: "ประมวลภาพกิจกรรมวันไหว้ครู ประจำปีการศึกษา 2568", cover_url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600", created_at: "2026-06-10T00:00:00Z" }
    ];
    
    const newsContainer = document.getElementById('news-list-container');
    newsContainer.innerHTML = '';
    mockNews.forEach(item => {
        const dateStr = new Date(item.created_at).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const card = document.createElement('article');
        card.className = 'news-card';
        card.innerHTML = `
            <div class="news-image">
                <img src="${item.cover_url}" alt="${item.title}">
            </div>
            <div class="news-info">
                <span class="news-date"><i class="fa-regular fa-calendar"></i> ${dateStr}</span>
                <h3 class="news-title">${item.title}</h3>
                <a href="news-detail.html?mock_id=${item.id}" class="news-link">อ่านรายละเอียด <i class="fa-solid fa-circle-arrow-right"></i></a>
            </div>
        `;
        newsContainer.appendChild(card);
    });

    // 9.4 Mock Newsletters
    allNewsletters = [
        { id: 1, title: "จดหมายข่าวสัปดาห์ที่ 1 เดือนมิถุนายน 2568", image_url: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=400", academic_year: "2568", created_at: "2026-06-10" },
        { id: 2, title: "จดหมายข่าวสัปดาห์ที่ 4 เดือนพฤษภาคม 2568", image_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400", academic_year: "2568", created_at: "2026-05-28" },
        { id: 3, title: "จดหมายข่าวสรุปผลงาน ประจำภาคเรียนที่ 2/2567", image_url: "https://images.unsplash.com/photo-1588072401702-d1573b6f626f?q=80&w=400", academic_year: "2567", created_at: "2025-03-15" },
        { id: 4, title: "จดหมายข่าวสัปดาห์วันวิทยาศาสตร์ ปีการศึกษา 2567", image_url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=400", academic_year: "2567", created_at: "2024-08-18" }
    ];
    renderNewsletters('all');
    
    // เคลียร์และสร้างปุ่มฟิลเตอร์ตัวอย่าง
    const filterBar = document.getElementById('academic-year-filters');
    filterBar.innerHTML = `
        <button class="filter-btn active" data-year="all">ทั้งหมด</button>
        <button class="filter-btn" data-year="2568">ปีการศึกษา 2568</button>
        <button class="filter-btn" data-year="2567">ปีการศึกษา 2567</button>
    `;
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderNewsletters(btn.dataset.year);
        });
    });

    // 9.5 Mock Executives
    const mockExec = [
        { id: 1, name: "ดร.สมชาย ยินดี", position: "ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร", image_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200" },
        { id: 2, name: "นางสาวศิริพร บุญดี", position: "รองผู้อำนวยการกลุ่มบริหารวิชาการ", image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200" },
        { id: 3, name: "นายวิชาญ พรสวรรค์", position: "รองผู้อำนวยการกลุ่มบริหารบุคคล", image_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200" }
    ];
    const execContainer = document.getElementById('executives-list-container');
    execContainer.innerHTML = '';
    mockExec.forEach(exec => {
        const card = document.createElement('div');
        card.className = 'exec-card';
        card.innerHTML = `
            <img src="${exec.image_url}" alt="${exec.name}" class="exec-image">
            <div class="exec-name">${exec.name}</div>
            <div class="exec-position">${exec.position}</div>
        `;
        execContainer.appendChild(card);
    });

    // 9.6 Mock Sidebar links & e-Services
    const agencyContainer = document.getElementById('agency-links-container');
    const eserviceContainer = document.getElementById('eservice-links-container');
    
    agencyContainer.innerHTML = `
        <a href="https://www.obec.go.th" target="_blank" class="agency-link-banner">
            <div style="background-color:#4b5563; color:white; padding:12px; border-radius: var(--radius-sm); text-align:center; font-size:13px; font-weight:500;">
                <i class="fa-solid fa-building-columns"></i> สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.)
            </div>
        </a>
        <a href="https://www.moe.go.th" target="_blank" class="agency-link-banner">
            <div style="background-color:#374151; color:white; padding:12px; border-radius: var(--radius-sm); text-align:center; font-size:13px; font-weight:500;">
                <i class="fa-solid fa-award"></i> กระทรวงศึกษาธิการ
            </div>
        </a>
    `;
    
    eserviceContainer.innerHTML = `
        <a href="#" class="eservice-button">
            <i class="fa-solid fa-address-card eservice-icon"></i>
            <span class="eservice-title">ระบบ SGS นักเรียน</span>
        </a>
        <a href="#" class="eservice-button">
            <i class="fa-solid fa-list-check eservice-icon"></i>
            <span class="eservice-title">ระบบสมัครเรียนใหม่</span>
        </a>
        <a href="#" class="eservice-button">
            <i class="fa-solid fa-book-open-reader eservice-icon"></i>
            <span class="eservice-title">ห้องสมุดดิจิทัล</span>
        </a>
        <a href="#" class="eservice-button">
            <i class="fa-solid fa-envelope-open-text eservice-icon"></i>
            <span class="eservice-title">ระบบลงทะเบียนเรียน</span>
        </a>
    `;
}
