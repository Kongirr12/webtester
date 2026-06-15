let supabaseClient = null;
let isDemoMode = false;

// Check config and initialize Supabase
if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined') {
    if (SUPABASE_URL !== "YOUR_SUPABASE_URL" && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY") {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in (Supabase or Demo session)
    checkAuthSession();

    // Event Listeners
    initEventHandlers();
});

// === 1. Authentication Handlers ===
function checkAuthSession() {
    const isDemoLoggedIn = sessionStorage.getItem('school_admin_demo_logged_in') === 'true';
    
    if (isDemoLoggedIn) {
        enableDemoMode();
    } else if (supabaseClient) {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                showDashboard();
            } else {
                showLoginForm();
            }
        });
    } else {
        showLoginForm();
        checkSupabaseConfig(); // Display configuration warning banner
    }
}

function enableDemoMode() {
    isDemoMode = true;
    sessionStorage.setItem('school_admin_demo_logged_in', 'true');
    document.getElementById('demo-mode-badge').style.display = 'inline-block';
    
    // Initialize Mock database in sessionStorage if empty
    initMockDatabase();
    
    showDashboard();
}

function showDashboard() {
    document.getElementById('login-panel').style.display = 'none';
    document.getElementById('dashboard-panel').style.display = 'grid';
    
    // Load navbar tab content by default
    switchTab('navbar-tab');
}

function showLoginForm() {
    document.getElementById('login-panel').style.display = 'block';
    document.getElementById('dashboard-panel').style.display = 'none';
}

function initEventHandlers() {
    // Login form submission
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorMsg = document.getElementById('login-error-msg');
        
        errorMsg.style.display = 'none';

        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) throw error;
                showDashboard();
            } catch (err) {
                errorMsg.textContent = '❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง: ' + err.message;
                errorMsg.style.display = 'block';
            }
        } else {
            errorMsg.textContent = '❌ ระบบยังไม่เชื่อมต่อฐานข้อมูล Supabase กรุณาเข้าสู่ระบบด้วย Demo Mode';
            errorMsg.style.display = 'block';
        }
    });

    // Bypass / Demo login button
    document.getElementById('bypass-login-btn').addEventListener('click', () => {
        enableDemoMode();
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', async () => {
        if (isDemoMode) {
            sessionStorage.removeItem('school_admin_demo_logged_in');
            isDemoMode = false;
            window.location.reload();
        } else if (supabaseClient) {
            await supabaseClient.auth.signOut();
            window.location.reload();
        }
    });

    // Sidebar tab selection
    const menuLinks = document.querySelectorAll('.admin-menu-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            menuLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            switchTab(link.dataset.target);
        });
    });

    // Modal Close on Esc key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('open'));
        }
    });

    // Form setup triggers
    initFormTriggers();
}

function switchTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.getElementById(tabId).style.display = 'block';
    
    // Fetch data for the active tab
    if (tabId === 'navbar-tab') loadNavbarData();
    else if (tabId === 'banners-tab') loadBannersData();
    else if (tabId === 'news-tab') loadNewsData();
    else if (tabId === 'newsletter-tab') loadNewsletterData();
    else if (tabId === 'executives-tab') loadExecutivesData();
    else if (tabId === 'sidebar-links-tab') loadSidebarLinksData();
    else if (tabId === 'settings-tab') loadSettingsData();
}

// === 2. UI Helper Actions ===
function openModal(modalId) {
    document.getElementById(modalId).classList.add('open');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

function initFormTriggers() {
    // Navbar: Add Menu
    document.getElementById('btn-add-navbar').onclick = () => {
        document.getElementById('form-navbar').reset();
        document.getElementById('nav-id').value = '';
        document.getElementById('modal-navbar-title').textContent = 'เพิ่มเมนูนำทาง';
        toggleNavbarFields();
        populateParentMenuSelect();
        openModal('modal-navbar');
    };

    // Banners: Add Banner
    document.getElementById('btn-add-banner').onclick = () => {
        document.getElementById('form-banner').reset();
        document.getElementById('banner-id').value = '';
        document.getElementById('banner-preview').style.display = 'none';
        document.getElementById('modal-banner-title').textContent = 'เพิ่มแบนเนอร์';
        openModal('modal-banner');
    };

    // News: Add News
    document.getElementById('btn-add-news').onclick = () => {
        document.getElementById('form-news').reset();
        document.getElementById('news-id').value = '';
        document.getElementById('news-preview').style.display = 'none';
        document.getElementById('modal-news-title').textContent = 'เพิ่มข่าวสารประกาศ';
        openModal('modal-news');
    };

    // Newsletter: Add Newsletter
    document.getElementById('btn-add-newsletter').onclick = () => {
        document.getElementById('form-newsletter').reset();
        document.getElementById('newsletter-id').value = '';
        document.getElementById('newsletter-preview').style.display = 'none';
        document.getElementById('modal-newsletter-title').textContent = 'อัปโหลดจดหมายข่าว';
        openModal('modal-newsletter');
    };

    // Executives: Add Executive
    document.getElementById('btn-add-exec').onclick = () => {
        document.getElementById('form-exec').reset();
        document.getElementById('exec-id').value = '';
        document.getElementById('exec-preview').style.display = 'none';
        document.getElementById('modal-exec-title').textContent = 'เพิ่มรายชื่อผู้บริหาร';
        openModal('modal-exec');
    };

    // Sidebar links: Add link
    document.getElementById('btn-add-link').onclick = () => {
        document.getElementById('form-link').reset();
        document.getElementById('link-id').value = '';
        document.getElementById('link-preview').style.display = 'none';
        document.getElementById('modal-link-title').textContent = 'เพิ่มลิงก์ / บริการ';
        toggleLinkIconField();
        openModal('modal-link');
    };

    // Auto Image Previews for File uploads
    setupImagePreview('banner-file', 'banner-preview');
    setupImagePreview('news-file', 'news-preview');
    setupImagePreview('newsletter-file', 'newsletter-preview');
    setupImagePreview('exec-file', 'exec-preview');
    setupImagePreview('link-file', 'link-preview');
}

function setupImagePreview(fileInputId, previewImgId) {
    const input = document.getElementById(fileInputId);
    const preview = document.getElementById(previewImgId);
    
    input.onchange = () => {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    };
}

// Helper to Upload Image to Supabase storage or return local Base64/Blob URL in demo mode
async function uploadMediaFile(fileInput, bucketName = 'school-media') {
    const file = fileInput.files[0];
    if (!file) return null;

    if (isDemoMode) {
        // ในโหมดเดโม แปลงเป็น Data URL เพื่อใช้จำลองในเพจหน้าแรกชั่วคราว
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    // อัปโหลดขึ้น Supabase Storage
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabaseClient.storage
            .from(bucketName)
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabaseClient.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message);
        return null;
    }
}

// === 3. TAB 1: Navbar Manager ===
function toggleNavbarFields() {
    const type = document.getElementById('nav-type').value;
    if (type === 'link') {
        document.getElementById('nav-url-group').style.display = 'block';
        document.getElementById('nav-content-group').style.display = 'none';
    } else {
        document.getElementById('nav-url-group').style.display = 'none';
        document.getElementById('nav-content-group').style.display = 'block';
    }
}

async function loadNavbarData() {
    const tbody = document.getElementById('admin-navbar-list');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">กำลังโหลดข้อมูล...</td></tr>';
    
    let navbarItems = [];
    if (isDemoMode) {
        navbarItems = getMockTable('navbar');
    } else {
        const { data, error } = await supabaseClient
            .from('navbar')
            .select('*')
            .order('menu_order', { ascending: true });
        if (error) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">โหลดล้มเหลว</td></tr>';
            return;
        }
        navbarItems = data;
    }

    tbody.innerHTML = '';
    if (navbarItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">ยังไม่มีข้อมูลเมนูนำทาง</td></tr>';
        return;
    }

    navbarItems.forEach(item => {
        // หาชื่อเมนูหลัก (กรณีเป็นเมนูย่อย)
        const parent = navbarItems.find(p => p.id === item.parent_id);
        const parentLabel = parent ? `<span class="badge badge-success">${parent.label}</span>` : '<span style="color:gray;">-</span>';
        
        let typeStr = item.url ? 'ลิงก์ภายนอก' : 'เพจเขียนเอง';
        let destStr = item.url || `หน้าเพจ ID: ${item.id}`;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.label}</strong></td>
            <td>${typeStr}</td>
            <td>${item.parent_id ? parentLabel : destStr}</td>
            <td>${item.menu_order || 0}</td>
            <td>
                <span class="badge ${item.is_active ? 'badge-success' : 'badge-danger'}">
                    ${item.is_active ? 'เปิดใช้งาน' : 'ซ่อน'}
                </span>
            </td>
            <td class="table-actions">
                <button class="action-btn action-edit" onclick="editNavbarItem(${item.id})"><i class="fa-solid fa-pen"></i> แก้ไข</button>
                <button class="action-btn action-delete" onclick="deleteNavbarItem(${item.id})"><i class="fa-solid fa-trash"></i> ลบ</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// เติมตัวเลือกเมนูหลักใน Dropdown
async function populateParentMenuSelect(selectedParentId = '') {
    const select = document.getElementById('nav-parent');
    select.innerHTML = '<option value="">-- เป็นเมนูหลัก --</option>';
    
    let menus = [];
    if (isDemoMode) {
        menus = getMockTable('navbar');
    } else {
        const { data } = await supabaseClient.from('navbar').select('*').eq('is_active', true);
        menus = data || [];
    }
    
    // กรองเอาเฉพาะเมนูหลัก (ที่ไม่มี parent_id)
    menus.filter(m => !m.parent_id).forEach(menu => {
        const opt = document.createElement('option');
        opt.value = menu.id;
        opt.textContent = menu.label;
        if (menu.id == selectedParentId) opt.selected = true;
        select.appendChild(opt);
    });
}

// ทำงานกับฟอร์มบันทึก Navbar
document.getElementById('form-navbar').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('nav-id').value;
    const label = document.getElementById('nav-label').value;
    const parent_id = document.getElementById('nav-parent').value ? parseInt(document.getElementById('nav-parent').value) : null;
    const type = document.getElementById('nav-type').value;
    const menu_order = parseInt(document.getElementById('nav-order').value) || 0;
    const is_active = document.getElementById('nav-active').checked;
    
    let url = null;
    let page_content = null;

    if (type === 'link') {
        url = document.getElementById('nav-url').value;
    } else {
        page_content = document.getElementById('nav-content').value;
    }

    const payload = { label, parent_id, url, page_content, menu_order, is_active };

    if (isDemoMode) {
        if (id) {
            updateMockRow('navbar', parseInt(id), payload);
        } else {
            insertMockRow('navbar', payload);
        }
        closeModal('modal-navbar');
        loadNavbarData();
    } else {
        try {
            if (id) {
                const { error } = await supabaseClient.from('navbar').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabaseClient.from('navbar').insert(payload);
                if (error) throw error;
            }
            closeModal('modal-navbar');
            loadNavbarData();
        } catch (err) {
            alert('ล้มเหลว: ' + err.message);
        }
    }
};

async function editNavbarItem(id) {
    let item;
    if (isDemoMode) {
        item = getMockRow('navbar', id);
    } else {
        const { data } = await supabaseClient.from('navbar').select('*').eq('id', id).single();
        item = data;
    }

    if (!item) return;

    document.getElementById('nav-id').value = item.id;
    document.getElementById('nav-label').value = item.label;
    document.getElementById('nav-order').value = item.menu_order;
    document.getElementById('nav-active').checked = item.is_active;

    await populateParentMenuSelect(item.parent_id);

    if (item.url) {
        document.getElementById('nav-type').value = 'link';
        document.getElementById('nav-url').value = item.url;
    } else {
        document.getElementById('nav-type').value = 'content';
        document.getElementById('nav-content').value = item.page_content || '';
    }

    toggleNavbarFields();
    document.getElementById('modal-navbar-title').textContent = 'แก้ไขเมนูนำทาง';
    openModal('modal-navbar');
}

async function deleteNavbarItem(id) {
    if (!confirm('ยืนยันที่จะลบเมนูนี้หรือไม่? (เมนูย่อยที่อยู่ภายใต้เมนูนี้จะถูกลบไปด้วย)')) return;

    if (isDemoMode) {
        deleteMockRow('navbar', id);
        // ลบลูกๆ ด้วย
        const children = getMockTable('navbar').filter(c => c.parent_id === id);
        children.forEach(c => deleteMockRow('navbar', c.id));
        loadNavbarData();
    } else {
        const { error } = await supabaseClient.from('navbar').delete().eq('id', id);
        if (error) alert('ลบไม่สำเร็จ: ' + error.message);
        else loadNavbarData();
    }
}


// === 4. TAB 2: Banners Manager ===
async function loadBannersData() {
    const tbody = document.getElementById('admin-banners-list');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">กำลังโหลดข้อมูล...</td></tr>';
    
    let banners = [];
    if (isDemoMode) {
        banners = getMockTable('banners');
    } else {
        const { data } = await supabaseClient.from('banners').select('*').order('menu_order', { ascending: true });
        banners = data || [];
    }

    tbody.innerHTML = '';
    if (banners.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">ยังไม่มีข้อมูลแบนเนอร์</td></tr>';
        return;
    }

    banners.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${b.image_url}" class="admin-table-img" alt="banner"></td>
            <td>${b.title || '<span style="color:gray;">ไม่มีข้อความ</span>'}</td>
            <td><span class="badge ${b.type === 'main' ? 'badge-success' : 'badge-danger'}">${b.type === 'main' ? 'สไลเดอร์หลัก' : 'ป้ายประกาศวันสำคัญ'}</span></td>
            <td>${b.menu_order || 0}</td>
            <td><span class="badge ${b.is_active ? 'badge-success' : 'badge-danger'}">${b.is_active ? 'แสดงผล' : 'ซ่อน'}</span></td>
            <td class="table-actions">
                <button class="action-btn action-edit" onclick="editBanner(${b.id})"><i class="fa-solid fa-pen"></i> แก้ไข</button>
                <button class="action-btn action-delete" onclick="deleteBanner(${b.id})"><i class="fa-solid fa-trash"></i> ลบ</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('form-banner').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('banner-id').value;
    const title = document.getElementById('banner-title').value;
    const type = document.getElementById('banner-type').value;
    const menu_order = parseInt(document.getElementById('banner-order').value) || 0;
    const is_active = document.getElementById('banner-active').checked;
    
    // จัดการอัปโหลดไฟล์ภาพ
    let image_url = document.getElementById('banner-url').value;
    const uploadedUrl = await uploadMediaFile(document.getElementById('banner-file'));
    if (uploadedUrl) image_url = uploadedUrl;

    if (!image_url) {
        alert('กรุณาอัปโหลดรูปภาพหรือใส่ URL รูปภาพแบนเนอร์');
        return;
    }

    const payload = { title, type, image_url, menu_order, is_active };

    if (isDemoMode) {
        if (id) updateMockRow('banners', parseInt(id), payload);
        else insertMockRow('banners', payload);
        closeModal('modal-banner');
        loadBannersData();
    } else {
        try {
            if (id) {
                const { error } = await supabaseClient.from('banners').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabaseClient.from('banners').insert(payload);
                if (error) throw error;
            }
            closeModal('modal-banner');
            loadBannersData();
        } catch (err) {
            alert('ล้มเหลว: ' + err.message);
        }
    }
};

async function editBanner(id) {
    let b;
    if (isDemoMode) b = getMockRow('banners', id);
    else {
        const { data } = await supabaseClient.from('banners').select('*').eq('id', id).single();
        b = data;
    }
    if (!b) return;

    document.getElementById('banner-id').value = b.id;
    document.getElementById('banner-title').value = b.title || '';
    document.getElementById('banner-type').value = b.type;
    document.getElementById('banner-order').value = b.menu_order || 0;
    document.getElementById('banner-active').checked = b.is_active;
    document.getElementById('banner-url').value = b.image_url;
    
    const preview = document.getElementById('banner-preview');
    preview.src = b.image_url;
    preview.style.display = 'block';

    document.getElementById('modal-banner-title').textContent = 'แก้ไขแบนเนอร์';
    openModal('modal-banner');
}

async function deleteBanner(id) {
    if (!confirm('ยืนยันที่จะลบแบนเนอร์นี้หรือไม่?')) return;
    if (isDemoMode) {
        deleteMockRow('banners', id);
        loadBannersData();
    } else {
        await supabaseClient.from('banners').delete().eq('id', id);
        loadBannersData();
    }
}


// === 5. TAB 3: Announcements (News) Manager ===
async function loadNewsData() {
    const tbody = document.getElementById('admin-news-list');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">กำลังโหลดข้อมูล...</td></tr>';
    
    let news = [];
    if (isDemoMode) news = getMockTable('news');
    else {
        const { data } = await supabaseClient.from('news').select('*').order('created_at', { ascending: false });
        news = data || [];
    }

    tbody.innerHTML = '';
    if (news.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">ยังไม่มีข้อมูลข่าวประชาสัมพันธ์</td></tr>';
        return;
    }

    news.forEach(n => {
        const dateStr = new Date(n.created_at).toLocaleDateString('th-TH');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${n.cover_url || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=250'}" class="admin-table-img" alt="cover"></td>
            <td><strong>${n.title}</strong></td>
            <td>${dateStr}</td>
            <td class="table-actions">
                <button class="action-btn action-edit" onclick="editNews(${n.id})"><i class="fa-solid fa-pen"></i> แก้ไข</button>
                <button class="action-btn action-delete" onclick="deleteNews(${n.id})"><i class="fa-solid fa-trash"></i> ลบ</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('form-news').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('news-id').value;
    const title = document.getElementById('news-title-input').value;
    const content = document.getElementById('news-content-input').value;
    
    let cover_url = document.getElementById('news-url').value;
    const uploadedUrl = await uploadMediaFile(document.getElementById('news-file'));
    if (uploadedUrl) cover_url = uploadedUrl;

    const payload = { title, content, cover_url, updated_at: new Date().toISOString() };

    if (isDemoMode) {
        if (id) updateMockRow('news', parseInt(id), payload);
        else {
            payload.created_at = new Date().toISOString();
            insertMockRow('news', payload);
        }
        closeModal('modal-news');
        loadNewsData();
    } else {
        try {
            if (id) {
                const { error } = await supabaseClient.from('news').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                payload.created_at = new Date().toISOString();
                const { error } = await supabaseClient.from('news').insert(payload);
                if (error) throw error;
            }
            closeModal('modal-news');
            loadNewsData();
        } catch (err) {
            alert('ล้มเหลว: ' + err.message);
        }
    }
};

async function editNews(id) {
    let n;
    if (isDemoMode) n = getMockRow('news', id);
    else {
        const { data } = await supabaseClient.from('news').select('*').eq('id', id).single();
        n = data;
    }
    if (!n) return;

    document.getElementById('news-id').value = n.id;
    document.getElementById('news-title-input').value = n.title;
    document.getElementById('news-content-input').value = n.content;
    document.getElementById('news-url').value = n.cover_url || '';
    
    const preview = document.getElementById('news-preview');
    if (n.cover_url) {
        preview.src = n.cover_url;
        preview.style.display = 'block';
    } else preview.style.display = 'none';

    document.getElementById('modal-news-title').textContent = 'แก้ไขข่าวสารประกาศ';
    openModal('modal-news');
}

async function deleteNews(id) {
    if (!confirm('ยืนยันที่จะลบข่าวสารนี้หรือไม่?')) return;
    if (isDemoMode) {
        deleteMockRow('news', id);
        loadNewsData();
    } else {
        await supabaseClient.from('news').delete().eq('id', id);
        loadNewsData();
    }
}


// === 6. TAB 4: Newsletters Manager ===
async function loadNewsletterData() {
    const tbody = document.getElementById('admin-newsletter-list');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">กำลังโหลดข้อมูล...</td></tr>';
    
    let newsletters = [];
    if (isDemoMode) newsletters = getMockTable('newsletters');
    else {
        const { data } = await supabaseClient.from('newsletters').select('*').order('created_at', { ascending: false });
        newsletters = data || [];
    }

    tbody.innerHTML = '';
    if (newsletters.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">ยังไม่มีข้อมูลจดหมายข่าว</td></tr>';
        return;
    }

    newsletters.forEach(nl => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${nl.image_url}" class="admin-table-img" alt="newsletter"></td>
            <td><strong>${nl.title}</strong></td>
            <td>ปีการศึกษา ${nl.academic_year}</td>
            <td class="table-actions">
                <button class="action-btn action-edit" onclick="editNewsletter(${nl.id})"><i class="fa-solid fa-pen"></i> แก้ไข</button>
                <button class="action-btn action-delete" onclick="deleteNewsletter(${nl.id})"><i class="fa-solid fa-trash"></i> ลบ</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('form-newsletter').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('newsletter-id').value;
    const title = document.getElementById('newsletter-title-input').value;
    const academic_year = document.getElementById('newsletter-year').value;
    
    let image_url = document.getElementById('newsletter-url').value;
    const uploadedUrl = await uploadMediaFile(document.getElementById('newsletter-file'));
    if (uploadedUrl) image_url = uploadedUrl;

    if (!image_url) {
        alert('กรุณาอัปโหลดรูปภาพจดหมายข่าว');
        return;
    }

    const payload = { title, academic_year, image_url };

    if (isDemoMode) {
        if (id) updateMockRow('newsletters', parseInt(id), payload);
        else insertMockRow('newsletters', payload);
        closeModal('modal-newsletter');
        loadNewsletterData();
    } else {
        try {
            if (id) {
                const { error } = await supabaseClient.from('newsletters').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabaseClient.from('newsletters').insert(payload);
                if (error) throw error;
            }
            closeModal('modal-newsletter');
            loadNewsletterData();
        } catch (err) {
            alert('ล้มเหลว: ' + err.message);
        }
    }
};

async function editNewsletter(id) {
    let nl;
    if (isDemoMode) nl = getMockRow('newsletters', id);
    else {
        const { data } = await supabaseClient.from('newsletters').select('*').eq('id', id).single();
        nl = data;
    }
    if (!nl) return;

    document.getElementById('newsletter-id').value = nl.id;
    document.getElementById('newsletter-title-input').value = nl.title;
    document.getElementById('newsletter-year').value = nl.academic_year;
    document.getElementById('newsletter-url').value = nl.image_url;
    
    const preview = document.getElementById('newsletter-preview');
    preview.src = nl.image_url;
    preview.style.display = 'block';

    document.getElementById('modal-newsletter-title').textContent = 'แก้ไขจดหมายข่าว';
    openModal('modal-newsletter');
}

async function deleteNewsletter(id) {
    if (!confirm('ยืนยันที่จะลบจดหมายข่าวนี้หรือไม่?')) return;
    if (isDemoMode) {
        deleteMockRow('newsletters', id);
        loadNewsletterData();
    } else {
        await supabaseClient.from('newsletters').delete().eq('id', id);
        loadNewsletterData();
    }
}


// === 7. TAB 5: Executives Manager ===
async function loadExecutivesData() {
    const tbody = document.getElementById('admin-exec-list');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">กำลังโหลดข้อมูล...</td></tr>';
    
    let execs = [];
    if (isDemoMode) execs = getMockTable('executives');
    else {
        const { data } = await supabaseClient.from('executives').select('*').order('menu_order', { ascending: true });
        execs = data || [];
    }

    tbody.innerHTML = '';
    if (execs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">ยังไม่มีรายชื่อผู้บริหาร</td></tr>';
        return;
    }

    execs.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${e.image_url}" class="admin-table-img" style="width:40px; height:40px; border-radius:50%;" alt="exec"></td>
            <td><strong>${e.name}</strong></td>
            <td>${e.position}</td>
            <td>${e.menu_order || 0}</td>
            <td class="table-actions">
                <button class="action-btn action-edit" onclick="editExec(${e.id})"><i class="fa-solid fa-pen"></i> แก้ไข</button>
                <button class="action-btn action-delete" onclick="deleteExec(${e.id})"><i class="fa-solid fa-trash"></i> ลบ</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('form-exec').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('exec-id').value;
    const name = document.getElementById('exec-name-input').value;
    const position = document.getElementById('exec-position-input').value;
    const menu_order = parseInt(document.getElementById('exec-order').value) || 0;
    
    let image_url = document.getElementById('exec-url').value;
    const uploadedUrl = await uploadMediaFile(document.getElementById('exec-file'));
    if (uploadedUrl) image_url = uploadedUrl;

    if (!image_url) {
        alert('กรุณาอัปโหลดรูปภาพผู้บริหาร');
        return;
    }

    const payload = { name, position, image_url, menu_order };

    if (isDemoMode) {
        if (id) updateMockRow('executives', parseInt(id), payload);
        else insertMockRow('executives', payload);
        closeModal('modal-exec');
        loadExecutivesData();
    } else {
        try {
            if (id) {
                const { error } = await supabaseClient.from('executives').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabaseClient.from('executives').insert(payload);
                if (error) throw error;
            }
            closeModal('modal-exec');
            loadExecutivesData();
        } catch (err) {
            alert('ล้มเหลว: ' + err.message);
        }
    }
};

async function editExec(id) {
    let e;
    if (isDemoMode) e = getMockRow('executives', id);
    else {
        const { data } = await supabaseClient.from('executives').select('*').eq('id', id).single();
        e = data;
    }
    if (!e) return;

    document.getElementById('exec-id').value = e.id;
    document.getElementById('exec-name-input').value = e.name;
    document.getElementById('exec-position-input').value = e.position;
    document.getElementById('exec-order').value = e.menu_order || 0;
    document.getElementById('exec-url').value = e.image_url;
    
    const preview = document.getElementById('exec-preview');
    preview.src = e.image_url;
    preview.style.display = 'block';

    document.getElementById('modal-exec-title').textContent = 'แก้ไขรายชื่อผู้บริหาร';
    openModal('modal-exec');
}

async function deleteExec(id) {
    if (!confirm('ยืนยันที่จะลบผู้บริหารท่านนี้หรือไม่?')) return;
    if (isDemoMode) {
        deleteMockRow('executives', id);
        loadExecutivesData();
    } else {
        await supabaseClient.from('executives').delete().eq('id', id);
        loadExecutivesData();
    }
}


// === 8. TAB 6: Sidebar Links Manager ===
function toggleLinkIconField() {
    const type = document.getElementById('link-type').value;
    if (type === 'eservice') {
        document.getElementById('link-icon-group').style.display = 'block';
        document.getElementById('link-image-group').style.display = 'none';
    } else {
        document.getElementById('link-icon-group').style.display = 'none';
        document.getElementById('link-image-group').style.display = 'block';
    }
}

async function loadSidebarLinksData() {
    const tbody = document.getElementById('admin-links-list');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">กำลังโหลดข้อมูล...</td></tr>';
    
    let links = [];
    if (isDemoMode) links = getMockTable('sidebar_links');
    else {
        const { data } = await supabaseClient.from('sidebar_links').select('*').order('menu_order', { ascending: true });
        links = data || [];
    }

    tbody.innerHTML = '';
    if (links.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">ยังไม่มีข้อมูลลิงก์หรือบริการ</td></tr>';
        return;
    }

    links.forEach(l => {
        let visualCol = '';
        if (l.type === 'agency') {
            visualCol = `<img src="${l.image_url}" class="admin-table-img" alt="banner">`;
        } else {
            visualCol = `<span style="font-size:18px;"><i class="${l.image_url || 'fa-solid fa-graduation-cap'}"></i></span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${visualCol}</td>
            <td><strong>${l.title}</strong></td>
            <td><a href="${l.url}" target="_blank" style="color:var(--primary); text-decoration:underline;">${l.url}</a></td>
            <td><span class="badge ${l.type === 'agency' ? 'badge-success' : 'badge-danger'}">${l.type === 'agency' ? 'ลิงก์หน่วยงาน' : 'บริการ e-Service'}</span></td>
            <td>${l.menu_order || 0}</td>
            <td class="table-actions">
                <button class="action-btn action-edit" onclick="editLink(${l.id})"><i class="fa-solid fa-pen"></i> แก้ไข</button>
                <button class="action-btn action-delete" onclick="deleteLink(${l.id})"><i class="fa-solid fa-trash"></i> ลบ</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('form-link').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('link-id').value;
    const title = document.getElementById('link-title-input').value;
    const url = document.getElementById('link-url-input').value;
    const type = document.getElementById('link-type').value;
    const menu_order = parseInt(document.getElementById('link-order').value) || 0;
    
    let image_url = '';
    
    if (type === 'eservice') {
        // บันทึก class ไอคอน ลงใน field image_url
        image_url = document.getElementById('link-icon-input').value || 'fa-solid fa-graduation-cap';
    } else {
        // บันทึกภาพแบนเนอร์หน่วยงาน
        image_url = document.getElementById('link-url-image').value;
        const uploadedUrl = await uploadMediaFile(document.getElementById('link-file'));
        if (uploadedUrl) image_url = uploadedUrl;
        
        if (!image_url) {
            alert('กรุณาอัปโหลดรูปภาพแบนเนอร์หรือใส่ URL');
            return;
        }
    }

    const payload = { title, url, type, image_url, menu_order };

    if (isDemoMode) {
        if (id) updateMockRow('sidebar_links', parseInt(id), payload);
        else insertMockRow('sidebar_links', payload);
        closeModal('modal-link');
        loadSidebarLinksData();
    } else {
        try {
            if (id) {
                const { error } = await supabaseClient.from('sidebar_links').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabaseClient.from('sidebar_links').insert(payload);
                if (error) throw error;
            }
            closeModal('modal-link');
            loadSidebarLinksData();
        } catch (err) {
            alert('ล้มเหลว: ' + err.message);
        }
    }
};

async function editLink(id) {
    let l;
    if (isDemoMode) l = getMockRow('sidebar_links', id);
    else {
        const { data } = await supabaseClient.from('sidebar_links').select('*').eq('id', id).single();
        l = data;
    }
    if (!l) return;

    document.getElementById('link-id').value = l.id;
    document.getElementById('link-title-input').value = l.title;
    document.getElementById('link-url-input').value = l.url;
    document.getElementById('link-type').value = l.type;
    document.getElementById('link-order').value = l.menu_order || 0;
    
    toggleLinkIconField();

    if (l.type === 'eservice') {
        document.getElementById('link-icon-input').value = l.image_url || '';
    } else {
        document.getElementById('link-url-image').value = l.image_url || '';
        const preview = document.getElementById('link-preview');
        if (l.image_url) {
            preview.src = l.image_url;
            preview.style.display = 'block';
        } else preview.style.display = 'none';
    }

    document.getElementById('modal-link-title').textContent = 'แก้ไขลิงก์และบริการ';
    openModal('modal-link');
}

async function deleteLink(id) {
    if (!confirm('ยืนยันที่จะลบลิงก์นี้หรือไม่?')) return;
    if (isDemoMode) {
        deleteMockRow('sidebar_links', id);
        loadSidebarLinksData();
    } else {
        await supabaseClient.from('sidebar_links').delete().eq('id', id);
        loadSidebarLinksData();
    }
}


// === 9. TAB 7: Facebook Embed Configuration ===
async function loadSettingsData() {
    const textarea = document.getElementById('fb-url-input');
    textarea.value = '';

    if (isDemoMode) {
        const setting = getMockRow('settings', 'facebook_embed_url');
        if (setting) textarea.value = setting.value;
    } else {
        try {
            const { data } = await supabaseClient.from('settings').select('*').eq('key', 'facebook_embed_url').single();
            if (data) textarea.value = data.value;
        } catch (err) {
            console.log('No existing Facebook settings found yet.');
        }
    }
}

document.getElementById('facebook-config-form').onsubmit = async (e) => {
    e.preventDefault();
    const value = document.getElementById('fb-url-input').value;

    if (isDemoMode) {
        updateMockSettings('facebook_embed_url', value);
        alert('บันทึกการตั้งค่าลงในเครื่องคอมพิวเตอร์ของคุณชั่วคราวแล้ว!');
    } else {
        try {
            // ใช้ upsert เพื่ออัปเดตหรือเพิ่มข้อมูล
            const { error } = await supabaseClient
                .from('settings')
                .upsert({ key: 'facebook_embed_url', value, updated_at: new Date().toISOString() });
            
            if (error) throw error;
            alert('บันทึกการตั้งค่า Facebook Embed ไปยังฐานข้อมูลสำเร็จ!');
        } catch (err) {
            alert('บันทึกข้อมูลล้มเหลว: ' + err.message);
        }
    }
};


// === 10. SESSION-BASED MOCK DATABASE SIMULATOR (สำหรับโหมดทดลองใช้ฟรี) ===

function initMockDatabase() {
    // โหลด/จำลองตาราง Navbar
    if (!localStorage.getItem('mock_navbar')) {
        const defaultNavbar = [
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
        localStorage.setItem('mock_navbar', JSON.stringify(defaultNavbar));
    }

    // โหลด/จำลองตาราง Banners
    if (!localStorage.getItem('mock_banners')) {
        const defaultBanners = [
            { id: 1, title: "มุ่งมั่นสู่ความเป็นเลิศ พัฒนาวิชาการและเทคโนโลยี", image_url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200", type: "main", is_active: true, menu_order: 1 },
            { id: 2, title: "บรรยากาศการเรียนรู้ที่เอื้อต่อการสร้างอนาคต", image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200", type: "main", is_active: true, menu_order: 2 },
            { id: 3, title: "กิจกรรมพัฒนาผู้เรียน กีฬา และศิลปวัฒนธรรม", image_url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1200", type: "main", is_active: true, menu_order: 3 },
            { id: 4, title: "วันครบรอบวันสถาปนาโรงเรียนมหาชัยพิทยาคาร", image_url: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1200", type: "festival", is_active: true, menu_order: 1 }
        ];
        localStorage.setItem('mock_banners', JSON.stringify(defaultBanners));
    }

    // โหลด/จำลองตาราง ข่าวสาร
    if (!localStorage.getItem('mock_news')) {
        const defaultNews = [
            { id: 1, title: "ประกาศรับสมัครนักเรียนใหม่ ประจำปีการศึกษา 2568 รอบโควตาพิเศษ", cover_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600", content: "โรงเรียนมหาชัยพิทยาคาร เปิดรับสมัครนักเรียนใหม่ ประจำปีการศึกษา 2568 รอบโควตาพิเศษ...", created_at: "2026-06-15T00:00:00Z" },
            { id: 2, title: "นักเรียนโรงเรียนมหาชัยพิทยาคาร คว้าเหรียญทองการแข่งขันทักษะคอมพิวเตอร์ระดับประเทศ", cover_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600", content: "ขอแสดงความยินดีกับ นายอภิสิทธิ์ รักดี นักเรียนชั้นมัธยมศึกษาปีที่ 6/1...", created_at: "2026-06-12T00:00:00Z" },
            { id: 3, title: "ประมวลภาพกิจกรรมวันไหว้ครู ประจำปีการศึกษา 2568", cover_url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600", content: "ภาพบรรยากาศพิธีไหว้ครู โรงเรียนมหาชัยพิทยาคาร ประจำปีการศึกษา 2568...", created_at: "2026-06-10T00:00:00Z" }
        ];
        localStorage.setItem('mock_news', JSON.stringify(defaultNews));
    }

    // โหลด/จำลองจดหมายข่าว
    if (!localStorage.getItem('mock_newsletters')) {
        const defaultNewsletters = [
            { id: 1, title: "จดหมายข่าวสัปดาห์ที่ 1 เดือนมิถุนายน 2568", image_url: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=400", academic_year: "2568", created_at: "2026-06-10" },
            { id: 2, title: "จดหมายข่าวสัปดาห์ที่ 4 เดือนพฤษภาคม 2568", image_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400", academic_year: "2568", created_at: "2026-05-28" },
            { id: 3, title: "จดหมายข่าวสรุปผลงาน ประจำภาคเรียนที่ 2/2567", image_url: "https://images.unsplash.com/photo-1588072401702-d1573b6f626f?q=80&w=400", academic_year: "2567", created_at: "2025-03-15" }
        ];
        localStorage.setItem('mock_newsletters', JSON.stringify(defaultNewsletters));
    }

    // โหลด/จำลองผู้บริหาร
    if (!localStorage.getItem('mock_executives')) {
        const defaultExec = [
            { id: 1, name: "ดร.สมชาย ยินดี", position: "ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร", image_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200", menu_order: 1 },
            { id: 2, name: "นางสาวศิริพร บุญดี", position: "รองผู้อำนวยการกลุ่มบริหารวิชาการ", image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200", menu_order: 2 },
            { id: 3, name: "นายวิชาญ พรสวรรค์", position: "รองผู้อำนวยการกลุ่มบริหารบุคคล", image_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200", menu_order: 3 }
        ];
        localStorage.setItem('mock_executives', JSON.stringify(defaultExec));
    }

    // โหลด/จำลองลิงก์
    if (!localStorage.getItem('mock_sidebar_links')) {
        const defaultLinks = [
            { id: 1, title: "สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.)", url: "https://www.obec.go.th", type: "agency", image_url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=250", menu_order: 1 },
            { id: 2, title: "ระบบ SGS นักเรียน", url: "#", type: "eservice", image_url: "fa-solid fa-address-card", menu_order: 1 },
            { id: 3, title: "ระบบสมัครเรียนใหม่", url: "#", type: "eservice", image_url: "fa-solid fa-list-check", menu_order: 2 }
        ];
        localStorage.setItem('mock_sidebar_links', JSON.stringify(defaultLinks));
    }

    // โหลด/จำลองการตั้งค่า
    if (!localStorage.getItem('mock_settings')) {
        const defaultSettings = [
            { key: "facebook_embed_url", value: "https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Ffacebook&tabs=timeline&width=500&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true" }
        ];
        localStorage.setItem('mock_settings', JSON.stringify(defaultSettings));
    }
}

// Local Storage Helper CRUDs
function getMockTable(tableName) {
    return JSON.parse(localStorage.getItem(`mock_${tableName}`)) || [];
}

function saveMockTable(tableName, data) {
    localStorage.setItem(`mock_${tableName}`, JSON.stringify(data));
}

function getMockRow(tableName, id) {
    const table = getMockTable(tableName);
    // สำหรับ settings
    if (tableName === 'settings') {
        return table.find(r => r.key === id);
    }
    return table.find(r => r.id === parseInt(id));
}

function insertMockRow(tableName, rowPayload) {
    const table = getMockTable(tableName);
    const newId = table.length > 0 ? Math.max(...table.map(r => r.id || 0)) + 1 : 1;
    const newRow = { id: newId, ...rowPayload };
    table.push(newRow);
    saveMockTable(tableName, table);
    return newRow;
}

function updateMockRow(tableName, id, rowPayload) {
    let table = getMockTable(tableName);
    table = table.map(row => {
        if (row.id === id) {
            return { ...row, ...rowPayload };
        }
        return row;
    });
    saveMockTable(tableName, table);
}

function deleteMockRow(tableName, id) {
    let table = getMockTable(tableName);
    table = table.filter(row => row.id !== id);
    saveMockTable(tableName, table);
}

function updateMockSettings(key, value) {
    let table = getMockTable('settings');
    const index = table.findIndex(r => r.key === key);
    if (index >= 0) {
        table[index].value = value;
    } else {
        table.push({ key, value });
    }
    saveMockTable('settings', table);
}
