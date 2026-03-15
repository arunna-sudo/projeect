const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    let user = JSON.parse(localStorage.getItem('user'));
    await loadMyEnrollments(user.student_id);
}

const loadMyEnrollments = async (studentId) => {
    try {
        const response = await axios.get(`${BASE_URL}/enrollments`);
        let myEnrollments = response.data.filter(e => e.student_id === studentId);
        
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