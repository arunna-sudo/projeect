const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    // ดึงข้อมูล user จาก localStorage
    let user = JSON.parse(localStorage.getItem('user'));
    // แสดงชื่อจาก email — ตัดเอาแค่ส่วนหน้า @ 
    const displayName = user.email.split('@')[0];
    document.getElementById('student-name').innerText = displayName;

    // ใช้ student_id แทน user.id
    if (user.student_id) {
        await loadMyEnrollments(user.student_id);
        await loadMyProgress(user.student_id);
    } else {
        document.getElementById('my-courses').innerHTML =
            `<div class="s-empty">
                <span class="s-empty-icon">⚠️</span>
                <div class="s-empty-title">ไม่พบข้อมูลนักเรียน</div>
                <p class="s-empty-sub">กรุณาติดต่อผู้ดูแลระบบ</p>
            </div>`;
    }
}

// 1. ดึงคอร์สที่ลงทะเบียนไว้
const loadMyEnrollments = async (studentId) => {
    try {
        const response = await axios.get(`${BASE_URL}/enrollments`);
        
        // กรองเฉพาะของนักเรียนคนนี้
        let myEnrollments = response.data.filter(e => e.student_id === studentId);
        
        document.getElementById('count-enrolled').innerText = myEnrollments.length;
        
        let htmlData = '';
        for (let i = 0; i < myEnrollments.length; i++) {
            let enroll = myEnrollments[i];
            // Skooldio-style: s-course-card แทน data-item ธรรมดา
            const icons = ['📚','🎓','📖','🎬','📝','🔬','💡','🌐'];
            const icon  = icons[i % icons.length];
            const dateStr = new Date(enroll.enrolled_at).toLocaleDateString('th-TH');
            htmlData += `<div class="s-course-card">
                <div class="s-course-card-icon">${icon}</div>
                <div class="s-course-card-body">
                    <div class="s-course-card-title">${enroll.course_title}</div>
                    <div class="s-course-card-meta">ลงทะเบียนเมื่อ ${dateStr}</div>
                </div>
                <span class="s-enrolled-pill">✅ ลงทะเบียนแล้ว</span>
            </div>`;
        }

        if (myEnrollments.length === 0) {
            // Empty state แบบ Skooldio
            htmlData = `<div class="s-empty">
                <span class="s-empty-icon">📭</span>
                <div class="s-empty-title">ยังไม่ได้ลงทะเบียนคอร์สใดๆ</div>
                <p class="s-empty-sub">ไปที่ "คอร์สของฉัน" เพื่อขอลงทะเบียนคอร์สที่สนใจ</p>
            </div>`;
        }

        document.getElementById('my-courses').innerHTML = htmlData;

    } catch (error) {
        console.error('Error fetching enrollments:', error);
    }
}

// 2. ดึงความคืบหน้าการเรียน
const loadMyProgress = async (studentId) => {
    try {
        const response = await axios.get(`${BASE_URL}/progress`);

        // กรองเฉพาะของนักเรียนคนนี้
        let myProgress = response.data.filter(p => p.student_id === studentId);

        // นับจำนวนที่เรียนจบและกำลังเรียน
        let completed = myProgress.filter(p => p.is_completed).length;
        let inProgress = myProgress.filter(p => !p.is_completed).length;

        document.getElementById('count-completed').innerText = completed;
        document.getElementById('count-inprogress').innerText = inProgress;

        let htmlData = '';
        for (let i = 0; i < myProgress.length; i++) {
            let prog = myProgress[i];
            // Skooldio-style: s-progress-item พร้อม progress bar
            const isDone   = prog.is_completed;
            const cls      = isDone ? 'done' : 'going';
            const badge    = isDone
                ? `<span class="s-progress-badge done">✅ เรียนจบแล้ว</span>`
                : `<span class="s-progress-badge going">⏳ กำลังเรียน</span>`;
            const barWidth = isDone ? '100%' : '45%';

            htmlData += `<div class="s-progress-item ${cls}">
                <div class="s-progress-item-top">
                    <span class="s-progress-label">${prog.lesson_title}</span>
                    ${badge}
                </div>
                <div class="s-progress-bar-wrap">
                    <div class="s-progress-bar-fill ${cls}" style="width:${barWidth};"></div>
                </div>
            </div>`;
        }

        if (myProgress.length === 0) {
            htmlData = `<div class="s-empty">
                <span class="s-empty-icon">📈</span>
                <div class="s-empty-title">ยังไม่มีประวัติการเรียน</div>
                <p class="s-empty-sub">เริ่มเรียนบทแรกจากเมนู "คอร์สของฉัน" ได้เลย</p>
            </div>`;
        }

        document.getElementById('my-progress').innerHTML = htmlData;

    } catch (error) {
        console.error('Error fetching progress:', error);
    }
}