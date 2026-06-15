// Database Service Layer (Supabase + LocalStorage Fallback)

class SchoolDatabaseService {
    constructor() {
        this.supabase = null;
        this.demoMode = true;
        this.dbConfig = { url: '', anonKey: '' };
    }

    // Initialize Connection
    async init() {
        let url = window.SUPABASE_CONFIG?.url || '';
        let anonKey = window.SUPABASE_CONFIG?.anonKey || '';

        const savedUrl = localStorage.getItem('supabase_url');
        const savedKey = localStorage.getItem('supabase_anon_key');
        
        if (savedUrl && savedKey) {
            url = savedUrl;
            anonKey = savedKey;
        }

        this.dbConfig = { url, anonKey };

        if (url && anonKey && window.supabase) {
            try {
                this.supabase = window.supabase.createClient(url, anonKey);
                // Simple connectivity test
                const { data, error } = await this.supabase.from('classes').select('id').limit(1);
                if (error) throw error;
                
                this.demoMode = false;
                console.log("Database: Connected to Supabase successfully.");
            } catch (err) {
                console.warn("Database: Failed to connect to Supabase. Falling back to Demo Mode.", err);
                this.demoMode = true;
            }
        } else {
            console.log("Database: Supabase not configured or client library missing. Running in Demo Mode (LocalStorage).");
            this.demoMode = true;
        }

        // Initialize local storage database in any case (for demo mode)
        this.initDemoData();
    }

    // Save Dynamic Connection Details
    saveConnectionSettings(url, anonKey) {
        if (url && anonKey) {
            localStorage.setItem('supabase_url', url);
            localStorage.setItem('supabase_anon_key', anonKey);
        } else {
            localStorage.removeItem('supabase_url');
            localStorage.removeItem('supabase_anon_key');
        }
    }

    // Clear Connection details to reset
    clearConnectionSettings() {
        localStorage.removeItem('supabase_url');
        localStorage.removeItem('supabase_anon_key');
        this.supabase = null;
        this.demoMode = true;
        this.initDemoData();
    }

    // Initialize Mock Data for LocalStorage (Demo Mode)
    initDemoData() {
        if (!localStorage.getItem('demo_initialized_v2')) {
            // Core Data
            const classes = [
                { id: 'c1', name: 'ม.1/1', room: 'ห้อง 301' },
                { id: 'c2', name: 'ม.1/2', room: 'ห้อง 302' },
                { id: 'c3', name: 'ม.2/1', room: 'ห้อง 401' }
            ];

            const subjects = [
                { id: 's1', code: 'MA1101', name: 'คณิตศาสตร์พื้นฐาน', credits: 1.5 },
                { id: 's2', code: 'EN1101', name: 'ภาษาอังกฤษพื้นฐาน', credits: 1.5 },
                { id: 's3', code: 'SC1101', name: 'วิทยาศาสตร์กายภาพ', credits: 1.5 },
                { id: 's4', code: 'TH1101', name: 'ภาษาไทยเพื่อการสื่อสาร', credits: 1.0 }
            ];

            const teachers = [
                { id: 't1', teacher_code: 'TCH20001', first_name: 'สมศักดิ์', last_name: 'รักเรียน', email: 'somsak@school.ac.th', phone: '081-234-5678' },
                { id: 't2', teacher_code: 'TCH20002', first_name: 'จรรยา', last_name: 'สอนดี', email: 'janya@school.ac.th', phone: '089-876-5432' }
            ];

            const students = [
                { id: 'st1', student_code: 'STD10001', first_name: 'เด็กชายวิชัย', last_name: 'ใจกล้า', class_id: 'c1', gender: 'ชาย', guardian_name: 'นายมานะ ใจกล้า', guardian_phone: '082-111-2222', status: 'Active' },
                { id: 'st2', student_code: 'STD10002', first_name: 'เด็กหญิงณิชา', last_name: 'งามดี', class_id: 'c1', gender: 'หญิง', guardian_name: 'นางมยุรี งามดี', guardian_phone: '085-333-4444', status: 'Active' },
                { id: 'st3', student_code: 'STD10003', first_name: 'เด็กชายอนันต์', last_name: 'รุ่งเรือง', class_id: 'c2', gender: 'ชาย', guardian_name: 'นายประวัติ รุ่งเรือง', guardian_phone: '086-555-6666', status: 'Active' },
                { id: 'st4', student_code: 'STD10004', first_name: 'เด็กหญิงธัญญา', last_name: 'จิตมั่น', class_id: 'c2', gender: 'หญิง', guardian_name: 'นางพิมพ์ จิตมั่น', guardian_phone: '087-777-8888', status: 'Active' }
            ];

            const attendance = [
                { id: 'a1', student_id: 'st1', date: this.getTodayDateString(), status: 'Present', remarks: '' },
                { id: 'a2', student_id: 'st2', date: this.getTodayDateString(), status: 'Present', remarks: '' },
                { id: 'a3', student_id: 'st3', date: this.getTodayDateString(), status: 'Late', remarks: 'รถติด' },
                { id: 'a4', student_id: 'st4', date: this.getTodayDateString(), status: 'Absent', remarks: 'ป่วย' }
            ];

            const grades = [
                { id: 'g1', student_id: 'st1', subject_id: 's1', semester: '1/2569', midterm_score: 25, final_score: 24, classwork_score: 35, total_score: 84, grade_value: '4' },
                { id: 'g2', student_id: 'st1', subject_id: 's2', semester: '1/2569', midterm_score: 20, final_score: 22, classwork_score: 32, total_score: 74, grade_value: '3.5' },
                { id: 'g3', student_id: 'st2', subject_id: 's1', semester: '1/2569', midterm_score: 22, final_score: 20, classwork_score: 36, total_score: 78, grade_value: '3.5' }
            ];

            // V2: Homepage Portal CMS Data
            const homepage_configs = [
                { section_key: 'banner', is_visible: true },
                { section_key: 'news_activities', is_visible: true },
                { section_key: 'pr_newsletters', is_visible: true },
                { section_key: 'facebook_embed', is_visible: true },
                { section_key: 'executives', is_visible: true },
                { section_key: 'quick_links', is_visible: true },
                { section_key: 'eservices', is_visible: true }
            ];

            const banners = [
                { id: 'b1', title: 'ยินดีต้อนรับสู่เปิดภาคเรียนใหม่ ปีการศึกษา 2569', image_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80', link_url: '#' },
                { id: 'b2', title: 'กิจกรรมนิทรรศการวิชาการ Open House ประจำปี', image_url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1200&q=80', link_url: '#' }
            ];

            const news_activities = [
                { id: 'n1', title: 'บรรยากาศพิธีไหว้ครู ประจำปีการศึกษา 2569', content: 'นักเรียนทุกระดับชั้นร่วมใจกันจัดพานดอกไม้เข้าร่วมพิธีแสดงความเคารพกตัญญูกตเวทิตาต่อคุณครูบาอาจารย์ ณ หอประชุมใหญ่ เพื่อระลึกถึงพระคุณครูผู้ประสิทธิ์ประสาทวิชาความรู้', image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80', date: this.getTodayDateString() },
                { id: 'n2', title: 'นักเรียนรับรางวัลชนะเลิศ การแข่งขันคณิตศาสตร์โอลิมปิกระดับจังหวัด', content: 'ขอแสดงความยินดีกับเด็กชายวิชัย ใจกล้า นักเรียนชั้น ม.1/1 ที่คว้าเหรียญทองเกียรติยศมาสร้างชื่อเสียงให้กับโรงเรียนของเราในการแข่งขันวิชาการประจำปี', image_url: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&w=600&q=80', date: this.getDaysAgoDateString(3) }
            ];

            const pr_newsletters = [
                { id: 'pr1', title: 'จดหมายข่าวประชาสัมพันธ์ ฉบับที่ 01/2569', image_url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=500&q=80', file_url: '#', date: this.getTodayDateString() },
                { id: 'pr2', title: 'จดหมายข่าวประชาสัมพันธ์ ฉบับที่ 02/2569', image_url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=500&q=80', file_url: '#', date: this.getDaysAgoDateString(7) }
            ];

            const executives = [
                { id: 'ex1', name: 'ดร.มานะ ทุ่มเท', position: 'ผู้อำนวยการโรงเรียน', image_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80', display_order: 1 },
                { id: 'ex2', name: 'นางอรัญญา สอนดี', position: 'รองผู้อำนวยการฝ่ายวิชาการ', image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80', display_order: 2 }
            ];

            const quick_links = [
                { id: 'ql1', name: 'กระทรวงศึกษาธิการ', url: 'https://www.moe.go.th', icon: 'globe', type: 'agency', display_order: 1 },
                { id: 'ql2', name: 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.)', url: 'https://www.obec.go.th', icon: 'external-link', type: 'agency', display_order: 2 },
                { id: 'ql3', name: 'ระบบกู้ยืมเงินเพื่อการศึกษา (DSL)', url: 'https://www.studentloan.or.th', icon: 'wallet', type: 'eservice', display_order: 1 },
                { id: 'ql4', name: 'ระบบจดหมายอิเล็กทรอนิกส์บุคลากร (SGS)', url: 'https://sgs.obec.go.th', icon: 'mail', type: 'eservice', display_order: 2 }
            ];

            // Budgeting Data
            const budget_transactions = [
                { id: 'b_t1', title: 'ได้รับงบอุดหนุนรายหัวนักเรียน ประจำปีงบประมาณ 2569', amount: 350000.00, type: 'income', category: 'งบรัฐอุดหนุน', date: this.getDaysAgoDateString(15), remarks: 'โอนจากสพฐ.' },
                { id: 'b_t2', title: 'ค่าจัดซื้ออุปกรณ์คอมพิวเตอร์ห้องแล็บไอทีใหม่', amount: 120000.00, type: 'expense', category: 'ฝ่ายบริหารทั่วไป', date: this.getDaysAgoDateString(10), remarks: 'จัดซื้อ PC 5 เครื่อง' },
                { id: 'b_t3', title: 'ค่าสมนาคุณวิทยากรอบรมคุณธรรมนักเรียน', amount: 15000.00, type: 'expense', category: 'ฝ่ายวิชาการ', date: this.getDaysAgoDateString(2), remarks: 'วิทยากรจากมูลนิธิศาสนา' },
                { id: 'b_t4', title: 'ได้รับเงินบริจาคสมทบทุนจัดทำห้องสมุดอิเล็กทรอนิกส์', amount: 50000.00, type: 'income', category: 'อื่นๆ', date: this.getDaysAgoDateString(1), remarks: 'เงินบริจาคศิษย์เก่า' }
            ];

            // Media Library Data
            const media_library = [
                { id: 'm1', title: 'ใบงานคณิตศาสตร์พื้นฐาน ม.1 เรื่อง ค.ร.น. และ ห.ร.ม.', subject: 'คณิตศาสตร์', grade: 'ม.1', link_url: 'https://example.com/math-m1-worksheet.pdf', description: 'ใบงานประกอบการเรียนรายวิชา ค11101' },
                { id: 'm2', title: 'สไลด์ประกอบการบรรยาย เรื่องแรงและการเคลื่อนที่', subject: 'วิทยาศาสตร์', grade: 'ม.2', link_url: 'https://example.com/science-m2-slides.pptx', description: 'สไลด์ความรู้บทที่ 2 ฟิสิกส์เบื้องต้น' },
                { id: 'm3', title: 'คลิปวิดีโอติวเข้มไวยากรณ์ภาษาอังกฤษเตรียมสอบ O-NET', subject: 'ภาษาอังกฤษ', grade: 'ม.6', link_url: 'https://youtube.com', description: 'วิดีโอทบทวน Active & Passive Voice' }
            ];

            localStorage.setItem('demo_classes', JSON.stringify(classes));
            localStorage.setItem('demo_subjects', JSON.stringify(subjects));
            localStorage.setItem('demo_teachers', JSON.stringify(teachers));
            localStorage.setItem('demo_students', JSON.stringify(students));
            localStorage.setItem('demo_attendance', JSON.stringify(attendance));
            localStorage.setItem('demo_grades', JSON.stringify(grades));
            
            // CMS Tables seeding
            localStorage.setItem('demo_homepage_configs', JSON.stringify(homepage_configs));
            localStorage.setItem('demo_banners', JSON.stringify(banners));
            localStorage.setItem('demo_news_activities', JSON.stringify(news_activities));
            localStorage.setItem('demo_pr_newsletters', JSON.stringify(pr_newsletters));
            localStorage.setItem('demo_executives', JSON.stringify(executives));
            localStorage.setItem('demo_quick_links', JSON.stringify(quick_links));
            localStorage.setItem('demo_budget_transactions', JSON.stringify(budget_transactions));
            localStorage.setItem('demo_media_library', JSON.stringify(media_library));

            localStorage.setItem('demo_initialized_v2', 'true');
        }
    }

    getTodayDateString() {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();
        if (mm < 10) mm = '0' + mm;
        if (dd < 10) dd = '0' + dd;
        return `${yyyy}-${mm}-${dd}`;
    }

    getDaysAgoDateString(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const yyyy = date.getFullYear();
        let mm = date.getMonth() + 1;
        let dd = date.getDate();
        if (mm < 10) mm = '0' + mm;
        if (dd < 10) dd = '0' + dd;
        return `${yyyy}-${mm}-${dd}`;
    }

    generateUUID() {
        return 'demo-' + Math.random().toString(36).substring(2, 11);
    }

    getLocalData(key) {
        return JSON.parse(localStorage.getItem(`demo_${key}`) || '[]');
    }

    setLocalData(key, data) {
        localStorage.setItem(`demo_${key}`, JSON.stringify(data));
    }

    // =========================================================================
    // PART 1: CORE CRUD Fallbacks (Classes, Subjects, Students, Teachers, Attendance, Grades)
    // =========================================================================
    async getClasses() {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('classes').select('*').order('name', { ascending: true });
            if (error) throw error;
            return data;
        } else {
            return this.getLocalData('classes').sort((a, b) => a.name.localeCompare(b.name));
        }
    }

    async addClass(classData) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('classes').insert([classData]).select();
            if (error) throw error;
            return data[0];
        } else {
            const classes = this.getLocalData('classes');
            const newClass = { id: this.generateUUID(), ...classData };
            classes.push(newClass);
            this.setLocalData('classes', classes);
            return newClass;
        }
    }

    async deleteClass(classId) {
        if (!this.demoMode) {
            const { error } = await this.supabase.from('classes').delete().eq('id', classId);
            if (error) throw error;
            return true;
        } else {
            let classes = this.getLocalData('classes');
            classes = classes.filter(c => c.id !== classId);
            this.setLocalData('classes', classes);

            let students = this.getLocalData('students');
            students = students.map(s => s.class_id === classId ? { ...s, class_id: null } : s);
            this.setLocalData('students', students);
            return true;
        }
    }

    async getSubjects() {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('subjects').select('*').order('code', { ascending: true });
            if (error) throw error;
            return data;
        } else {
            return this.getLocalData('subjects').sort((a, b) => a.code.localeCompare(b.code));
        }
    }

    async addSubject(subjectData) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('subjects').insert([subjectData]).select();
            if (error) throw error;
            return data[0];
        } else {
            const subjects = this.getLocalData('subjects');
            const newSubject = { id: this.generateUUID(), ...subjectData };
            subjects.push(newSubject);
            this.setLocalData('subjects', subjects);
            return newSubject;
        }
    }

    async deleteSubject(subjectId) {
        if (!this.demoMode) {
            const { error } = await this.supabase.from('subjects').delete().eq('id', subjectId);
            if (error) throw error;
            return true;
        } else {
            let subjects = this.getLocalData('subjects');
            subjects = subjects.filter(s => s.id !== subjectId);
            this.setLocalData('subjects', subjects);

            let grades = this.getLocalData('grades');
            grades = grades.filter(g => g.subject_id !== subjectId);
            this.setLocalData('grades', grades);
            return true;
        }
    }

    async getStudents() {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('students').select('*, classes(name)').order('student_code', { ascending: true });
            if (error) throw error;
            return data.map(s => ({ ...s, class_name: s.classes ? s.classes.name : 'ไม่มีห้องเรียน' }));
        } else {
            const students = this.getLocalData('students');
            const classes = this.getLocalData('classes');
            return students.map(s => {
                const c = classes.find(cl => cl.id === s.class_id);
                return { ...s, class_name: c ? c.name : 'ไม่มีห้องเรียน' };
            }).sort((a, b) => a.student_code.localeCompare(b.student_code));
        }
    }

    async addStudent(studentData) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('students').insert([studentData]).select();
            if (error) throw error;
            return data[0];
        } else {
            const students = this.getLocalData('students');
            const newStudent = { id: this.generateUUID(), ...studentData };
            students.push(newStudent);
            this.setLocalData('students', students);
            return newStudent;
        }
    }

    async updateStudent(studentId, studentData) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('students').update(studentData).eq('id', studentId).select();
            if (error) throw error;
            return data[0];
        } else {
            let students = this.getLocalData('students');
            const idx = students.findIndex(s => s.id === studentId);
            if (idx !== -1) {
                students[idx] = { ...students[idx], ...studentData };
                this.setLocalData('students', students);
                return students[idx];
            }
            throw new Error("Student not found");
        }
    }

    async deleteStudent(studentId) {
        if (!this.demoMode) {
            const { error } = await this.supabase.from('students').delete().eq('id', studentId);
            if (error) throw error;
            return true;
        } else {
            let students = this.getLocalData('students');
            students = students.filter(s => s.id !== studentId);
            this.setLocalData('students', students);

            let attendance = this.getLocalData('attendance');
            attendance = attendance.filter(a => a.student_id !== studentId);
            this.setLocalData('attendance', attendance);

            let grades = this.getLocalData('grades');
            grades = grades.filter(g => g.student_id !== studentId);
            this.setLocalData('grades', grades);
            return true;
        }
    }

    async getTeachers() {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('teachers').select('*').order('teacher_code', { ascending: true });
            if (error) throw error;
            return data;
        } else {
            return this.getLocalData('teachers').sort((a, b) => a.teacher_code.localeCompare(b.teacher_code));
        }
    }

    async addTeacher(teacherData) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('teachers').insert([teacherData]).select();
            if (error) throw error;
            return data[0];
        } else {
            const teachers = this.getLocalData('teachers');
            const newTeacher = { id: this.generateUUID(), ...teacherData };
            teachers.push(newTeacher);
            this.setLocalData('teachers', teachers);
            return newTeacher;
        }
    }

    async updateTeacher(teacherId, teacherData) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('teachers').update(teacherData).eq('id', teacherId).select();
            if (error) throw error;
            return data[0];
        } else {
            let teachers = this.getLocalData('teachers');
            const idx = teachers.findIndex(t => t.id === teacherId);
            if (idx !== -1) {
                teachers[idx] = { ...teachers[idx], ...teacherData };
                this.setLocalData('teachers', teachers);
                return teachers[idx];
            }
            throw new Error("Teacher not found");
        }
    }

    async deleteTeacher(teacherId) {
        if (!this.demoMode) {
            const { error } = await this.supabase.from('teachers').delete().eq('id', teacherId);
            if (error) throw error;
            return true;
        } else {
            let teachers = this.getLocalData('teachers');
            teachers = teachers.filter(t => t.id !== teacherId);
            this.setLocalData('teachers', teachers);
            return true;
        }
    }

    async getAttendanceByDateAndClass(dateStr, classId) {
        if (!this.demoMode) {
            let query = this.supabase.from('students').select('id, student_code, first_name, last_name').eq('status', 'Active');
            if (classId) query = query.eq('class_id', classId);
            const { data: classStudents, error: sError } = await query;
            if (sError) throw sError;

            const { data: attRecords, error: aError } = await this.supabase.from('attendance').select('*').eq('date', dateStr);
            if (aError) throw aError;

            return classStudents.map(student => {
                const record = attRecords.find(a => a.student_id === student.id);
                return {
                    student_id: student.id,
                    student_code: student.student_code,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    attendance_id: record ? record.id : null,
                    date: dateStr,
                    status: record ? record.status : 'Present',
                    remarks: record ? (record.remarks || '') : ''
                };
            });
        } else {
            const students = this.getLocalData('students').filter(s => s.status === 'Active' && (!classId || s.class_id === classId));
            const attendance = this.getLocalData('attendance').filter(a => a.date === dateStr);

            return students.map(student => {
                const record = attendance.find(a => a.student_id === student.id);
                return {
                    student_id: student.id,
                    student_code: student.student_code,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    attendance_id: record ? record.id : null,
                    date: dateStr,
                    status: record ? record.status : 'Present',
                    remarks: record ? (record.remarks || '') : ''
                };
            }).sort((a, b) => a.student_code.localeCompare(b.student_code));
        }
    }

    async saveAttendance(records) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' }).select();
            if (error) throw error;
            return data;
        } else {
            const attendance = this.getLocalData('attendance');
            records.forEach(rec => {
                const idx = attendance.findIndex(a => a.student_id === rec.student_id && a.date === rec.date);
                if (idx !== -1) {
                    attendance[idx] = { ...attendance[idx], status: rec.status, remarks: rec.remarks || '' };
                } else {
                    attendance.push({ id: this.generateUUID(), student_id: rec.student_id, date: rec.date, status: rec.status, remarks: rec.remarks || '' });
                }
            });
            this.setLocalData('attendance', attendance);
            return true;
        }
    }

    async getAttendanceSummary() {
        if (!this.demoMode) {
            const todayStr = this.getTodayDateString();
            const { data, error } = await this.supabase.from('attendance').select('status').eq('date', todayStr);
            if (error) throw error;

            const counts = { Present: 0, Late: 0, Absent: 0, Excused: 0, total: data.length };
            data.forEach(r => {
                if (counts[r.status] !== undefined) counts[r.status]++;
            });
            return counts;
        } else {
            const todayStr = this.getTodayDateString();
            const todayAttendance = this.getLocalData('attendance').filter(a => a.date === todayStr);
            const counts = { Present: 0, Late: 0, Absent: 0, Excused: 0, total: todayAttendance.length };
            todayAttendance.forEach(r => {
                if (counts[r.status] !== undefined) counts[r.status]++;
            });
            return counts;
        }
    }

    async getGradesByClassAndSubject(classId, subjectId, semester) {
        if (!this.demoMode) {
            const { data: students, error: sError } = await this.supabase.from('students').select('id, student_code, first_name, last_name').eq('class_id', classId).eq('status', 'Active');
            if (sError) throw sError;

            const { data: grades, error: gError } = await this.supabase.from('grades').select('*').eq('subject_id', subjectId).eq('semester', semester);
            if (gError) throw gError;

            return students.map(student => {
                const grade = grades.find(g => g.student_id === student.id);
                return {
                    student_id: student.id,
                    student_code: student.student_code,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    grade_id: grade ? grade.id : null,
                    midterm_score: grade ? grade.midterm_score : 0,
                    final_score: grade ? grade.final_score : 0,
                    classwork_score: grade ? grade.classwork_score : 0,
                    total_score: grade ? (Number(grade.midterm_score) + Number(grade.final_score) + Number(grade.classwork_score)) : 0,
                    grade_value: grade ? grade.grade_value : '-'
                };
            });
        } else {
            const students = this.getLocalData('students').filter(s => s.class_id === classId && s.status === 'Active');
            const grades = this.getLocalData('grades').filter(g => g.subject_id === subjectId && g.semester === semester);

            return students.map(student => {
                const grade = grades.find(g => g.student_id === student.id);
                return {
                    student_id: student.id,
                    student_code: student.student_code,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    grade_id: grade ? grade.id : null,
                    midterm_score: grade ? grade.midterm_score : 0,
                    final_score: grade ? grade.final_score : 0,
                    classwork_score: grade ? grade.classwork_score : 0,
                    total_score: grade ? (Number(grade.midterm_score) + Number(grade.final_score) + Number(grade.classwork_score)) : 0,
                    grade_value: grade ? grade.grade_value : '-'
                };
            }).sort((a, b) => a.student_code.localeCompare(b.student_code));
        }
    }

    async saveGrades(gradesArray) {
        if (!this.demoMode) {
            const formatted = gradesArray.map(g => {
                const total = Number(g.midterm_score) + Number(g.final_score) + Number(g.classwork_score);
                return {
                    ...g,
                    grade_value: this.calculateGradeValue(total)
                };
            });
            const { data, error } = await this.supabase.from('grades').upsert(formatted, { onConflict: 'student_id,subject_id,semester' }).select();
            if (error) throw error;
            return data;
        } else {
            const grades = this.getLocalData('grades');
            gradesArray.forEach(g => {
                const total = Number(g.midterm_score) + Number(g.final_score) + Number(g.classwork_score);
                const gradeValue = this.calculateGradeValue(total);

                const idx = grades.findIndex(existing => existing.student_id === g.student_id && existing.subject_id === g.subject_id && existing.semester === g.semester);
                const record = {
                    student_id: g.student_id,
                    subject_id: g.subject_id,
                    semester: g.semester,
                    midterm_score: Number(g.midterm_score),
                    final_score: Number(g.final_score),
                    classwork_score: Number(g.classwork_score),
                    grade_value: gradeValue
                };

                if (idx !== -1) {
                    grades[idx] = { ...grades[idx], ...record };
                } else {
                    grades.push({ id: this.generateUUID(), ...record });
                }
            });
            this.setLocalData('grades', grades);
            return true;
        }
    }

    calculateGradeValue(totalScore) {
        if (totalScore >= 80) return '4';
        if (totalScore >= 75) return '3.5';
        if (totalScore >= 70) return '3';
        if (totalScore >= 65) return '2.5';
        if (totalScore >= 60) return '2';
        if (totalScore >= 55) return '1.5';
        if (totalScore >= 50) return '1';
        return '0';
    }

    async getStudentReportCard(studentId, semester) {
        if (!this.demoMode) {
            const { data: student, error: sError } = await this.supabase.from('students').select('*, classes(name)').eq('id', studentId).single();
            if (sError) throw sError;

            const { data: grades, error: gError } = await this.supabase.from('grades').select('*, subjects(code, name, credits)').eq('student_id', studentId).eq('semester', semester);
            if (gError) throw gError;

            return {
                student: { ...student, class_name: student.classes ? student.classes.name : 'ไม่มีห้องเรียน' },
                grades: grades.map(g => ({
                    subject_code: g.subjects.code,
                    subject_name: g.subjects.name,
                    credits: Number(g.subjects.credits),
                    midterm_score: g.midterm_score,
                    final_score: g.final_score,
                    classwork_score: g.classwork_score,
                    total_score: Number(g.midterm_score) + Number(g.final_score) + Number(g.classwork_score),
                    grade_value: g.grade_value
                }))
            };
        } else {
            const students = this.getLocalData('students');
            const classes = this.getLocalData('classes');
            const subjects = this.getLocalData('subjects');
            const grades = this.getLocalData('grades').filter(g => g.student_id === studentId && g.semester === semester);

            const student = students.find(s => s.id === studentId);
            if (!student) throw new Error("Student not found");

            const cls = classes.find(c => c.id === student.class_id);
            const enrichedGrades = grades.map(g => {
                const sub = subjects.find(s => s.id === g.subject_id);
                return {
                    subject_code: sub ? sub.code : 'UNKNOWN',
                    subject_name: sub ? sub.name : 'Unknown Subject',
                    credits: sub ? Number(sub.credits) : 1.0,
                    midterm_score: g.midterm_score,
                    final_score: g.final_score,
                    classwork_score: g.classwork_score,
                    total_score: Number(g.midterm_score) + Number(g.final_score) + Number(g.classwork_score),
                    grade_value: g.grade_value
                };
            });

            return {
                student: { ...student, class_name: cls ? cls.name : 'ไม่มีห้องเรียน' },
                grades: enrichedGrades
            };
        }
    }

    // =========================================================================
    // PART 2: NEW CMS AND SETTINGS Fallbacks (Configs, Banners, News, Executives, Links)
    // =========================================================================
    async getHomepageConfigs() {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('homepage_configs').select('*');
            if (error) throw error;
            // Return as map { section_key: is_visible }
            const configMap = {};
            data.forEach(item => {
                configMap[item.section_key] = item.is_visible;
            });
            return configMap;
        } else {
            const configs = this.getLocalData('homepage_configs');
            const configMap = {};
            configs.forEach(item => {
                configMap[item.section_key] = item.is_visible;
            });
            return configMap;
        }
    }

    async updateHomepageConfigVisibility(sectionKey, isVisible) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase
                .from('homepage_configs')
                .upsert({ section_key: sectionKey, is_visible: isVisible, updated_at: new Date() })
                .select();
            if (error) throw error;
            return data[0];
        } else {
            const configs = this.getLocalData('homepage_configs');
            const idx = configs.findIndex(c => c.section_key === sectionKey);
            if (idx !== -1) {
                configs[idx].is_visible = isVisible;
            } else {
                configs.push({ section_key: sectionKey, is_visible: isVisible });
            }
            this.setLocalData('homepage_configs', configs);
            return true;
        }
    }

    async getBanners() {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('banners').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } else {
            return this.getLocalData('banners');
        }
    }

    async addBanner(bannerData) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('banners').insert([bannerData]).select();
            if (error) throw error;
            return data[0];
        } else {
            const banners = this.getLocalData('banners');
            const newBanner = { id: this.generateUUID(), ...bannerData };
            banners.unshift(newBanner); // Newest first
            this.setLocalData('banners', banners);
            return newBanner;
        }
    }

    async deleteBanner(bannerId) {
        if (!this.demoMode) {
            const { error } = await this.supabase.from('banners').delete().eq('id', bannerId);
            if (error) throw error;
            return true;
        } else {
            let banners = this.getLocalData('banners');
            banners = banners.filter(b => b.id !== bannerId);
            this.setLocalData('banners', banners);
            return true;
        }
    }

    async getNewsActivities() {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('news_activities').select('*').order('date', { ascending: false });
            if (error) throw error;
            return data;
        } else {
            return this.getLocalData('news_activities').sort((a, b) => b.date.localeCompare(a.date));
        }
    }

    async addNewsActivity(newsData) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('news_activities').insert([newsData]).select();
            if (error) throw error;
            return data[0];
        } else {
            const news = this.getLocalData('news_activities');
            const newNews = { id: this.generateUUID(), ...newsData };
            news.unshift(newNews);
            this.setLocalData('news_activities', news);
            return newNews;
        }
    }

    async deleteNewsActivity(newsId) {
        if (!this.demoMode) {
            const { error } = await this.supabase.from('news_activities').delete().eq('id', newsId);
            if (error) throw error;
            return true;
        } else {
            let news = this.getLocalData('news_activities');
            news = news.filter(n => n.id !== newsId);
            this.setLocalData('news_activities', news);
            return true;
        }
    }

    async getPrNewsletters() {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('pr_newsletters').select('*').order('date', { ascending: false });
            if (error) throw error;
            return data;
        } else {
            return this.getLocalData('pr_newsletters').sort((a, b) => b.date.localeCompare(a.date));
        }
    }

    async addPrNewsletter(letterData) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('pr_newsletters').insert([letterData]).select();
            if (error) throw error;
            return data[0];
        } else {
            const letters = this.getLocalData('pr_newsletters');
            const newLetter = { id: this.generateUUID(), ...letterData };
            letters.unshift(newLetter);
            this.setLocalData('pr_newsletters', letters);
            return newLetter;
        }
    }

    async deletePrNewsletter(letterId) {
        if (!this.demoMode) {
            const { error } = await this.supabase.from('pr_newsletters').delete().eq('id', letterId);
            if (error) throw error;
            return true;
        } else {
            let letters = this.getLocalData('pr_newsletters');
            letters = letters.filter(l => l.id !== letterId);
            this.setLocalData('pr_newsletters', letters);
            return true;
        }
    }

    async getExecutives() {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('executives').select('*').order('display_order', { ascending: true });
            if (error) throw error;
            return data;
        } else {
            return this.getLocalData('executives').sort((a, b) => a.display_order - b.display_order);
        }
    }

    async addExecutive(execData) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('executives').insert([execData]).select();
            if (error) throw error;
            return data[0];
        } else {
            const execs = this.getLocalData('executives');
            const newExec = { id: this.generateUUID(), ...execData };
            execs.push(newExec);
            this.setLocalData('executives', execs);
            return newExec;
        }
    }

    async deleteExecutive(execId) {
        if (!this.demoMode) {
            const { error } = await this.supabase.from('executives').delete().eq('id', execId);
            if (error) throw error;
            return true;
        } else {
            let execs = this.getLocalData('executives');
            execs = execs.filter(e => e.id !== execId);
            this.setLocalData('executives', execs);
            return true;
        }
    }

    async getQuickLinks() {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('quick_links').select('*').order('display_order', { ascending: true });
            if (error) throw error;
            return data;
        } else {
            return this.getLocalData('quick_links').sort((a, b) => a.display_order - b.display_order);
        }
    }

    async addQuickLink(linkData) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('quick_links').insert([linkData]).select();
            if (error) throw error;
            return data[0];
        } else {
            const links = this.getLocalData('quick_links');
            const newLink = { id: this.generateUUID(), ...linkData };
            links.push(newLink);
            this.setLocalData('quick_links', links);
            return newLink;
        }
    }

    async deleteQuickLink(linkId) {
        if (!this.demoMode) {
            const { error } = await this.supabase.from('quick_links').delete().eq('id', linkId);
            if (error) throw error;
            return true;
        } else {
            let links = this.getLocalData('quick_links');
            links = links.filter(l => l.id !== linkId);
            this.setLocalData('quick_links', links);
            return true;
        }
    }

    // =========================================================================
    // PART 3: FINANCIAL & LIBRARY (Budgeting & Media Library)
    // =========================================================================
    async getBudgetTransactions() {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('budget_transactions').select('*').order('date', { ascending: false });
            if (error) throw error;
            return data;
        } else {
            return this.getLocalData('budget_transactions').sort((a, b) => b.date.localeCompare(a.date));
        }
    }

    async addBudgetTransaction(txData) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('budget_transactions').insert([txData]).select();
            if (error) throw error;
            return data[0];
        } else {
            const txs = this.getLocalData('budget_transactions');
            const newTx = { id: this.generateUUID(), ...txData };
            txs.unshift(newTx);
            this.setLocalData('budget_transactions', txs);
            return newTx;
        }
    }

    async deleteBudgetTransaction(txId) {
        if (!this.demoMode) {
            const { error } = await this.supabase.from('budget_transactions').delete().eq('id', txId);
            if (error) throw error;
            return true;
        } else {
            let txs = this.getLocalData('budget_transactions');
            txs = txs.filter(t => t.id !== txId);
            this.setLocalData('budget_transactions', txs);
            return true;
        }
    }

    async getBudgetSummary() {
        const txs = await this.getBudgetTransactions();
        let totalIncome = 0;
        let totalExpense = 0;
        const categories = {};

        txs.forEach(t => {
            const amt = Number(t.amount);
            if (t.type === 'income') {
                totalIncome += amt;
            } else {
                totalExpense += amt;
                categories[t.category] = (categories[t.category] || 0) + amt;
            }
        });

        return {
            income: totalIncome,
            expense: totalExpense,
            balance: totalIncome - totalExpense,
            categoryBreakdown: categories
        };
    }

    async getMediaItems() {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('media_library').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } else {
            return this.getLocalData('media_library');
        }
    }

    async addMediaItem(itemData) {
        if (!this.demoMode) {
            const { data, error } = await this.supabase.from('media_library').insert([itemData]).select();
            if (error) throw error;
            return data[0];
        } else {
            const items = this.getLocalData('media_library');
            const newItem = { id: this.generateUUID(), ...itemData };
            items.unshift(newItem);
            this.setLocalData('media_library', items);
            return newItem;
        }
    }

    async deleteMediaItem(itemId) {
        if (!this.demoMode) {
            const { error } = await this.supabase.from('media_library').delete().eq('id', itemId);
            if (error) throw error;
            return true;
        } else {
            let items = this.getLocalData('media_library');
            items = items.filter(i => i.id !== itemId);
            this.setLocalData('media_library', items);
            return true;
        }
    }
}

// Create global database service instance
window.dbService = new SchoolDatabaseService();
