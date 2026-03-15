const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    let user = JSON.parse(localStorage.getItem('user'));
    await loadMyProgress(user.student_id);
}

const loadMyProgress = async (studentId) => {
    try {
        const response = await axios.get(`${BASE_URL}/progress`);
        let myProgress = response.data.filter(p => p.student_id === studentId);

        // นับจำนวน
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

            htmlData += `<div class="progress-item">
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