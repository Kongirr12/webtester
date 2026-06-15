// กำหนดค่าการเชื่อมต่อ Supabase ของคุณที่นี่
const SUPABASE_URL = "https://unoaadqtwxoolpxhuain.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVub2FhZHF0d3hvb2xweGh1YWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTg1NDUsImV4cCI6MjA5NzA3NDU0NX0.eoZ91qmDoS04-AIR4k9fAaCsErnsSRlqG3ibTXA64Uk";

// ตรวจสอบว่าได้ตั้งค่า Supabase เรียบร้อยแล้วหรือยัง
function checkSupabaseConfig() {
    if (SUPABASE_URL === "YOUR_SUPABASE_URL" || SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY") {
        showConfigWarningBanner();
        return false;
    }
    return true;
}

function showConfigWarningBanner() {
    // ตรวจสอบว่ามี Banner เดิมอยู่แล้วหรือไม่
    if (document.getElementById('supabase-config-warning')) return;

    const banner = document.createElement('div');
    banner.id = 'supabase-config-warning';
    banner.style.position = 'fixed';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.width = '100%';
    banner.style.backgroundColor = '#f59e0b';
    banner.style.color = '#ffffff';
    banner.style.textAlign = 'center';
    banner.style.padding = '12px';
    banner.style.fontWeight = 'bold';
    banner.style.zIndex = '99999';
    banner.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    banner.style.fontFamily = 'Sarabun, sans-serif';
    
    banner.innerHTML = `
        ⚠️ ตรวจพบว่ายังไม่ได้ตั้งค่า Supabase! กรุณาใส่ URL และ Anon Key ของคุณในไฟล์ <code>js/config.js</code> 
        ก่อนระบบจะสามารถเชื่อมต่อกับฐานข้อมูลได้
    `;
    
    document.body.prepend(banner);
    document.body.style.paddingTop = '50px';
}
