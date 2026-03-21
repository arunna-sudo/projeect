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