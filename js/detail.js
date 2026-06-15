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

    // 2. Load Content & Navbar
    if (supabaseClient) {
        loadNavbar();
        loadSidebar();
        loadPageDetails();
    } else {
        checkSupabaseConfig();
        loadNavbarMock();
        loadSidebarMock();
        loadPageDetailsMock();
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

// === 2. Load Navbar dynamically ===
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
    const homeLink = navbarMenu.querySelector('li');
    navbarMenu.innerHTML = '';
    if (homeLink) navbarMenu.appendChild(homeLink);

    const mainMenus = menuItems.filter(item => !item.parent_id);
    
    mainMenus.forEach(main => {
        const subMenus = menuItems.filter(sub => sub.parent_id === main.id);
        const li = document.createElement('li');
        li.className = 'nav-item';
        
        let url = 'javascript:void(0);';
        if (main.url) url = main.url;
        else if (main.page_content) url = `page.html?id=${main.id}`;
        
        if (subMenus.length > 0) {
            li.innerHTML = `
                <a href="${url}" class="nav-link">${main.label} <i class="fa-solid fa-chevron-down" style="font-size:10px; margin-left:5px;"></i></a>
                <ul class="dropdown-menu"></ul>
            `;
            const dropdown = li.querySelector('.dropdown-menu');
            subMenus.forEach(sub => {
                let subUrl = 'javascript:void(0);';
                if (sub.url) subUrl = sub.url;
                else if (sub.page_content) subUrl = `page.html?id=${sub.id}`;
                
                const subLi = document.createElement('li');
                subLi.className = 'dropdown-item';
                subLi.innerHTML = `<a href="${subUrl}" class="dropdown-link">${sub.label}</a>`;
                dropdown.appendChild(subLi);
            });

            // accordion for mobile
            const mainLink = li.querySelector('.nav-link');
            mainLink.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    li.classList.toggle('active');
                }
            });
        } else {
            li.innerHTML = `<a href="${url}" class="nav-link">${main.label}</a>`;
        }
        navbarMenu.appendChild(li);
    });
}

// === 3. Load Sidebar Content dynamically ===
async function loadSidebar() {
    // 3.1 Load Executives
    const execContainer = document.getElementById('executives-list-container');
    try {
        const { data, error } = await supabaseClient
            .from('executives')
            .select('*')
            .order('menu_order', { ascending: true });

        if (error) throw error;
        execContainer.innerHTML = '';
        if (data.length === 0) {
            execContainer.innerHTML = '<div style="text-align:center; color:var(--text-muted);">ไม่มีข้อมูล</div>';
        } else {
            data.forEach(exec => {
                const card = document.createElement('div');
                card.className = 'exec-card';
                card.innerHTML = `
                    <img src="${exec.image_url}" alt="${exec.name}" class="exec-image">
                    <div class="exec-name">${exec.name}</div>
                    <div class="exec-position">${exec.position}</div>
                `;
                execContainer.appendChild(card);
            });
        }
    } catch (err) {
        console.error('Error loading executives in sidebar:', err);
    }

    // 3.2 Load Sidebar links & e-Services
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
        
        agencies.forEach(item => {
            const link = document.createElement('a');
            link.href = item.url;
            link.target = '_blank';
            link.className = 'agency-link-banner';
            link.innerHTML = `<img src="${item.image_url}" alt="${item.title}">`;
            agencyContainer.appendChild(link);
        });
        
        if (eservices.length === 0) {
            eserviceContainer.innerHTML = '<div style="text-align:center; grid-column: span 2; color:var(--text-muted); font-size:13px;">ไม่มีบริการ e-Service</div>';
        } else {
            eservices.forEach(item => {
                const btn = document.createElement('a');
                btn.href = item.url;
                btn.target = '_blank';
                btn.className = 'eservice-button';
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

// === 4. Load Specific Page Content based on URL Query Parameter ===
async function loadPageDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    const loadingBox = document.getElementById('detail-loading-box');
    
    if (!id) {
        if (loadingBox) loadingBox.innerHTML = '<p style="color:red; text-align:center;">ไม่พบข้อมูลที่ระบุ</p>';
        return;
    }

    const isNewsPage = window.location.pathname.includes('news-detail.html');

    try {
        if (isNewsPage) {
            // โหลดรายละเอียดข่าว
            const { data, error } = await supabaseClient
                .from('news')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (loadingBox) loadingBox.style.display = 'none';
            const detailArea = document.getElementById('news-detail-content-area');
            detailArea.style.display = 'block';
            
            document.title = `${data.title} - โรงเรียนมหาชัยพิทยาคาร`;
            
            const dateStr = new Date(data.created_at).toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            document.getElementById('news-date-meta').innerHTML = `<i class="fa-regular fa-calendar"></i> เผยแพร่เมื่อ: ${dateStr}`;
            document.getElementById('news-detail-title').textContent = data.title;
            
            const coverImg = document.getElementById('news-detail-cover-img');
            if (data.cover_url) {
                coverImg.src = data.cover_url;
                coverImg.style.display = 'block';
            } else {
                coverImg.style.display = 'none';
            }
            
            // แทนที่ newline ด้วย <br> หรือรองรับการเขียนแบบ HTML
            document.getElementById('news-detail-body').innerHTML = data.content.replace(/\n/g, '<br>');

        } else {
            // โหลดรายละเอียดหน้าเว็บเพจ Dynamic
            const { data, error } = await supabaseClient
                .from('navbar')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (loadingBox) loadingBox.style.display = 'none';
            const detailArea = document.getElementById('page-content-area');
            detailArea.style.display = 'block';
            
            document.title = `${data.label} - โรงเรียนมหาชัยพิทยาคาร`;
            document.getElementById('page-title').textContent = data.label;
            document.getElementById('page-body').innerHTML = data.page_content || '<p style="color:var(--text-muted)">ไม่มีเนื้อหาสำหรับหน้านี้</p>';
        }
    } catch (err) {
        console.error('Error loading content:', err);
        if (loadingBox) loadingBox.innerHTML = '<p style="color:red; text-align:center;">เกิดข้อผิดพลาดในการดึงข้อมูลจากระบบฐานข้อมูล</p>';
    }
}

// === 5. Fallback Mock Data functions ===
function loadNavbarMock() {
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
}

function loadSidebarMock() {
    // mock exec
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

    // mock links
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

function loadPageDetailsMock() {
    const urlParams = new URLSearchParams(window.location.search);
    const mockId = urlParams.get('mock_id');
    const mockPage = urlParams.get('mock');
    
    const loadingBox = document.getElementById('detail-loading-box');
    if (loadingBox) loadingBox.style.display = 'none';

    const isNewsPage = window.location.pathname.includes('news-detail.html');

    if (isNewsPage) {
        // Mock News Details
        const mockNewsList = [
            { 
                id: 1, 
                title: "ประกาศรับสมัครนักเรียนใหม่ ประจำปีการศึกษา 2568 รอบโควตาพิเศษ", 
                cover_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200", 
                created_at: "2026-06-15T09:00:00Z",
                content: "โรงเรียนมหาชัยพิทยาคาร เปิดรับสมัครนักเรียนใหม่ ประจำปีการศึกษา 2568 รอบโควตาพิเศษ เพื่อเข้าเรียนในระดับชั้นมัธยมศึกษาปีที่ 1 และมัธยมศึกษาปีที่ 4\n\n**กำหนดการที่สำคัญ:**\n- รับสมัคร: 15-25 มิถุนายน 2568 (ผ่านระบบสมัครออนไลน์ e-Service)\n- ประกาศรายชื่อผู้มีสิทธิ์สอบสัมภาษณ์: 28 มิถุนายน 2568\n- สอบสัมภาษณ์และวัดแววความสามารถ: 30 มิถุนายน 2568\n- ประกาศผลการคัดเลือก: 3 กรกฎาคม 2568\n\n**คุณสมบัติเบื้องต้น:**\n1. เป็นผู้สำเร็จการศึกษาหรือกำลังศึกษาในชั้นประถมศึกษาปีที่ 6 หรือมัธยมศึกษาปีที่ 3\n2. มีผลการเรียนเฉลี่ยสะสม (GPAX) ไม่ต่ำกว่า 3.00\n3. มีความประพฤติดี มีระเบียบวินัย\n\nผู้ที่สนใจสามารถดาวน์โหลดระเบียบการรับสมัครได้ที่หน้าเว็บไซต์ และคลิกสมัครสอบผ่านแถบ e-Service 'ระบบสมัครเรียนใหม่' ได้เลยค่ะ"
            },
            {
                id: 2,
                title: "นักเรียนโรงเรียนมหาชัยพิทยาคาร คว้าเหรียญทองการแข่งขันทักษะคอมพิวเตอร์ระดับประเทศ",
                cover_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200",
                created_at: "2026-06-12T13:45:00Z",
                content: "ขอแสดงความยินดีกับ นายอภิสิทธิ์ รักดี นักเรียนชั้นมัธยมศึกษาปีที่ 6/1 ที่ได้รับรางวัลเหรียญทอง ในการแข่งขันการพัฒนาโปรแกรมคอมพิวเตอร์ระดับเยาวชนแห่งชาติ ประจำปี 2568 ณ ศูนย์นิทรรศการและการประชุมไบเทค บางนา\n\nการแข่งขันในครั้งนี้มีผู้เข้าร่วมกว่า 150 โรงเรียนทั่วประเทศ โดยผลงานของนายอภิสิทธิ์ ได้แก่ระบบ 'School Alert System' ซึ่งเป็นระบบแจ้งเตือนข่าวสารโรงเรียนอัตโนมัติ ที่ตอบโจทย์การติดต่อสื่อสารระหว่างสถาบันกับผู้ปกครองได้อย่างโดดเด่นและสร้างสรรค์\n\nทางคณะผู้บริหาร ครู และบุคลากรทางการศึกษาโรงเรียนมหาชัยพิทยาคาร ขอร่วมชื่นชมความมุ่งมั่นทุ่มเทของนักเรียนและอาจารย์ที่ปรึกษาในการสร้างชื่อเสียงให้กับสถาบันในครั้งนี้"
            },
            {
                id: 3,
                title: "ประมวลภาพกิจกรรมวันไหว้ครู ประจำปีการศึกษา 2568",
                cover_url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1200",
                created_at: "2026-06-10T10:30:00Z",
                content: "ภาพบรรยากาศพิธีไหว้ครู โรงเรียนมหาชัยพิทยาคาร ประจำปีการศึกษา 2568 ณ หอประชุมมหาชัยร่วมใจ\n\nพิธีไหว้ครูจัดขึ้นเพื่อให้นักเรียนได้แสดงความเคารพ นอบน้อม และกตัญญูกตเวทิตาต่อครูอาจารย์ผู้ประสิทธิ์ประสาทวิชาความรู้ โดยในงานมีการประกวดพานไหว้ครูประเภทสวยงามและประเภทความคิดสร้างสรรค์ ซึ่งปีนี้ตัวแทนนักเรียนจากห้องต่างๆ ได้สร้างสรรค์พานไหว้ครูออกมาได้อย่างสวยงามและสื่อความหมายที่ดีเยี่ยม\n\nดร.สมชาย ยินดี ผู้อำนวยการโรงเรียน ได้กล่าวให้โอวาทแก่นักเรียน มุ่งเน้นการปฏิบัติตนเป็นคนดี มีศีลธรรม ตั้งใจศึกษาเล่าเรียน เพื่อเป็นกำลังสำคัญในการพัฒนาประเทศในอนาคตต่อไป"
            }
        ];

        const targetId = parseInt(mockId) || 1;
        const newsData = mockNewsList.find(n => n.id === targetId) || mockNewsList[0];

        const detailArea = document.getElementById('news-detail-content-area');
        detailArea.style.display = 'block';
        
        document.title = `${newsData.title} - โรงเรียนมหาชัยพิทยาคาร`;
        
        const dateStr = new Date(newsData.created_at).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        document.getElementById('news-date-meta').innerHTML = `<i class="fa-regular fa-calendar"></i> เผยแพร่เมื่อ: ${dateStr}`;
        document.getElementById('news-detail-title').textContent = newsData.title;
        document.getElementById('news-detail-cover-img').src = newsData.cover_url;
        document.getElementById('news-detail-body').innerHTML = newsData.content.replace(/\n/g, '<br>');

    } else {
        // Mock Page Details
        const mockPageList = {
            about: {
                title: "ข้อมูลทั่วไปของโรงเรียน",
                body: `
                    <h3>ข้อมูลทั่วไป โรงเรียนมหาชัยพิทยาคาร</h3>
                    <p style="margin-top:15px;">โรงเรียนมหาชัยพิทยาคาร ตั้งอยู่เลขที่ 250 ถนนเลี่ยงเมืองมหาชัย ตำบลมหาชัย อำเภอเมือง จังหวัดสมุทรสาคร ก่อตั้งขึ้นในปี พ.ศ. 2525 เพื่อจัดการศึกษาระดับมัธยมศึกษาแก่เยาวชนในพื้นที่สมุทรสาครและใกล้เคียง</p>
                    <p>ปัจจุบันเปิดสอนตั้งแต่ระดับมัธยมศึกษาปีที่ 1 ถึงมัธยมศึกษาปีที่ 6 มีนักเรียนรวมทั้งสิ้น 1,800 คน และบุคลากรทางการศึกษาจำนวน 95 คน</p>
                    <p>สีประจำโรงเรียน: แดงเลือดหมู - เทา</p>
                    <p>อักษรย่อ: ม.ช.พ.</p>
                `
            },
            vision: {
                title: "วิสัยทัศน์และพันธกิจ",
                body: `
                    <h3>วิสัยทัศน์ (Vision)</h3>
                    <blockquote style="border-left: 4px solid var(--primary); padding-left: 15px; margin: 15px 0; font-style: italic; font-weight: 500;">
                        "มุ่งมั่นพัฒนาผู้เรียนสู่ความเป็นเลิศทางวิชาการ มีคุณธรรมนำความรู้ ควบคู่ทักษะเทคโนโลยี มีมาตรฐานความรู้ระดับสากล บนพื้นฐานความเป็นไทย"
                    </blockquote>
                    <h3 style="margin-top:25px;">พันธกิจ (Mission)</h3>
                    <ol style="margin-left: 20px; margin-top:10px; display:flex; flex-direction:column; gap:8px;">
                        <li>จัดการศึกษาระดับมัธยมศึกษาอย่างทั่วถึงและมีคุณภาพ</li>
                        <li>ส่งเสริมพัฒนาศักยภาพผู้เรียนสู่การแข่งขันในระดับสากล</li>
                        <li>ปลูกฝังคุณธรรม จริยธรรม ค่านิยมอันพึงประสงค์ และปรัชญาเศรษฐกิจพอเพียง</li>
                        <li>พัฒนาบุคลากรทางการศึกษาให้มีความเชี่ยวชาญตามมาตรฐานวิชาชีพ</li>
                        <li>พัฒนาระบบเทคโนโลยีสารสนเทศและการบริหารจัดการด้วยระบบคุณภาพ</li>
                    </ol>
                `
            },
            history: {
                title: "ประวัติความเป็นมาของโรงเรียน",
                body: `
                    <h3>ประวัติความเป็นมา</h3>
                    <p style="margin-top:15px;">โรงเรียนมหาชัยพิทยาคาร ก่อตั้งขึ้นอย่างเป็นทางการตามประกาศกระทรวงศึกษาธิการ เมื่อวันที่ 1 กรกฎาคม พ.ศ. 2525 โดยในช่วงเริ่มแรกได้รับการบริจาคที่ดินจากศิษย์เก่าและคหบดีในท้องถิ่นจำนวน 35 ไร่</p>
                    <p>อาคารเรียนหลังแรกสร้างเสร็จและเปิดใช้สอนครั้งแรกในปีการศึกษา 2526 มีนักเรียนรุ่นแรกจำนวน 120 คน และผู้อำนวยการท่านแรกคือ นายวิวัฒน์ มหาชัยพงษ์</p>
                    <p>ด้วยความร่วมมือของชุมชนและหน่วยงานที่เกี่ยวข้อง โรงเรียนได้พัฒนาการเรียนการสอน มีการก่อสร้างอาคารเรียนเพิ่มเติม ห้องปฏิบัติการวิทยาศาสตร์ ห้องคอมพิวเตอร์ และสนามกีฬาที่ครบครัน จนทำให้กลายเป็นสถานศึกษาชั้นนำในจังหวัดสมุทรสาครในปัจจุบัน</p>
                `
            },
            academic: {
                title: "กลุ่มบริหารวิชาการ",
                body: `
                    <h3>กลุ่มบริหารวิชาการ (Academic Management)</h3>
                    <p style="margin-top:15px;">เป็นแกนหลักในการขับเคลื่อนคุณภาพการศึกษาของโรงเรียนมหาชัยพิทยาคาร รับผิดชอบการจัดทำหลักสูตรสถานศึกษา การพัฒนาการจัดกิจกรรมเรียนการสอน การวัดและประเมินผล และการวิจัยเพื่อพัฒนาคุณภาพการศึกษา</p>
                    <p><strong>งานบริการหลักด้านวิชาการ:</strong></p>
                    <ul style="margin-left:20px; margin-top:10px; display:flex; flex-direction:column; gap:8px;">
                        <li>การลงทะเบียนเรียน และตรวจสอบผลการเรียนของนักเรียน</li>
                        <li>งานห้องสมุดดิจิทัลและศูนย์การเรียนรู้ด้วยตนเอง</li>
                        <li>การแนะแนวการศึกษาต่อและการประกอบอาชีพ</li>
                        <li>การส่งเสริมความเป็นเลิศทางวิทยาศาสตร์ คณิตศาสตร์ และภาษาต่างประเทศ</li>
                    </ul>
                `
            },
            budget: {
                title: "กลุ่มบริหารงบประมาณ",
                body: `
                    <h3>กลุ่มบริหารงบประมาณ (Budget Management)</h3>
                    <p style="margin-top:15px;">รับผิดชอบการวางแผนอัตรากำลัง การระดมทรัพยากร การเงิน บัญชี และพัสดุครุภัณฑ์ เพื่อสนับสนุนการจัดกิจกรรมการเรียนการสอนและการบริหารโรงเรียนให้มีประสิทธิภาพสูงสุด โปร่งใส ตรวจสอบได้</p>
                `
            },
            personnel: {
                title: "กลุ่มบริหารงานบุคคล",
                body: `
                    <h3>กลุ่มบริหารงานบุคคล (Personnel Management)</h3>
                    <p style="margin-top:15px;">มีหน้าที่ส่งเสริมวินัย คุณธรรม จริยธรรมของบุคลากร ครู และสภานักเรียน ดูแลเรื่องการแต่งกาย ระเบียบวินัยนักเรียน ความปลอดภัยในสถานศึกษา และการสมาคมผู้ปกครองและครู</p>
                `
            },
            students: {
                title: "ข้อมูลนักเรียน",
                body: `
                    <h3>ข้อมูลนักเรียนและการบริการนักเรียน</h3>
                    <p style="margin-top:15px;">ส่วนรวบรวมข้อมูลสถิติจำนวนนักเรียนในแต่ละปีการศึกษา รายละเอียดสวัสดิการ สภานักเรียน และข่าวสารกิจกรรมสำหรับนักเรียนโรงเรียนมหาชัยพิทยาคาร</p>
                    <p>ขณะนี้ระบบฐานข้อมูลนักเรียนออนไลน์เชื่อมต่อผ่าน e-Service นักเรียนสามารถล็อกอินเข้าสู่ระบบ SGS เพื่อเช็คเกรดและผลการเรียนได้ที่แถบ sidebar ด้านขวา</p>
                `
            },
            contact: {
                title: "ช่องทางการติดต่อเรา",
                body: `
                    <h3>ติดต่อ โรงเรียนมหาชัยพิทยาคาร</h3>
                    <p style="margin-top:15px;"><strong>ที่ตั้ง:</strong> ถนนเลี่ยงเมืองมหาชัย ตำบลมหาชัย อำเภอเมือง จังหวัดสมุทรสาคร 74000</p>
                    <p><strong>โทรศัพท์:</strong> 034-123456</p>
                    <p><strong>โทรสาร:</strong> 034-123457</p>
                    <p><strong>อีเมล:</strong> admin@mahachai.ac.th</p>
                    <p><strong>เวลาทำการ:</strong> จันทร์ - ศุกร์ เวลา 08.00 น. - 16.30 น. (เว้นวันหยุดราชการ)</p>
                    <div style="margin-top: 20px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); height: 300px; background-color: #e5e7eb; display:flex; align-items:center; justify-content:center; color: var(--text-muted);">
                         <i class="fa-solid fa-map-location-dot" style="font-size:32px; margin-right:10px;"></i> แผนที่ตั้งโรงเรียนมหาชัยพิทยาคาร (Google Maps Mockup)
                    </div>
                `
            }
        };

        const pageKey = mockPage || 'about';
        const pageData = mockPageList[pageKey] || mockPageList['about'];

        const detailArea = document.getElementById('page-content-area');
        detailArea.style.display = 'block';
        
        document.title = `${pageData.title} - โรงเรียนมหาชัยพิทยาคาร`;
        document.getElementById('page-title').textContent = pageData.title;
        document.getElementById('page-body').innerHTML = pageData.body;
    }
}
