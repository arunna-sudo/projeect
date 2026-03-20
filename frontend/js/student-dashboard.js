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
            '<p style="text-align:center; color:gray;">ไม่พบข้อมูลนักเรียน กรุณาติดต่อผู้ดูแลระบบ</p>';
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
            htmlData += `<div class="data-item">
                <div>
                    <strong>${i + 1}. ${enroll.course_title}</strong>
                    <span style="color: #7f8c8d; font-size: 13px; margin-left: 10px;">
                        ลงทะเบียนเมื่อ: ${new Date(enroll.enrolled_at).toLocaleDateString('th-TH')}
                    </span>
                </div>
                <span style="background: #d4edda; color: #155724; padding: 4px 10px; border-radius: 15px; font-size: 13px;">✅ ลงทะเบียนแล้ว</span>
            </div>`
        }

        if (myEnrollments.length === 0) {
            htmlData = '<p style="text-align:center; color:gray;">ยังไม่ได้ลงทะเบียนคอร์สใดๆ</p>';
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
            let statusBadge = prog.is_completed
                ? `<span style="background: #d4edda; color: #155724; padding: 4px 10px; border-radius: 15px; font-size: 13px;">✅ เรียนจบแล้ว</span>`
                : `<span style="background: #fff3e0; color: #e65100; padding: 4px 10px; border-radius: 15px; font-size: 13px;">⏳ กำลังเรียน</span>`;

            htmlData += `<div class="data-item">
                <div>
                    <strong>${prog.lesson_title}</strong>
                </div>
                ${statusBadge}
            </div>`
        }

        if (myProgress.length === 0) {
            htmlData = '<p style="text-align:center; color:gray;">ยังไม่มีประวัติการเรียน</p>';
        }

        document.getElementById('my-progress').innerHTML = htmlData;

    } catch (error) {
        console.error('Error fetching progress:', error);
    }
}