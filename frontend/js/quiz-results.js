const BASE_URL = 'http://localhost:8000';
let allResults = [];

window.onload = async () => {
    await loadAllResults();
}

const loadAllResults = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/quizzes/results/all`);
        allResults = response.data;

        let correct = allResults.filter(r => r.is_correct).length;
        let wrong = allResults.length - correct;
        let uniqueStudents = [...new Set(allResults.map(r => r.student_id))].length;
        let avg = allResults.length > 0 ? Math.round((correct / allResults.length) * 100) : 0;

        document.getElementById('count-students').innerText = uniqueStudents;
        document.getElementById('count-correct').innerText = correct;
        document.getElementById('count-wrong').innerText = wrong;
        document.getElementById('count-avg').innerText = avg + '%';

        let studentMap = new Map();
        for (let r of allResults) {
            if (!studentMap.has(r.student_id)) {
                studentMap.set(r.student_id, `${r.firstname} ${r.lastname}`);
            }
        }
        let studentDOM = document.getElementById('filter-student');
        for (let [id, name] of studentMap) {
            studentDOM.innerHTML += `<option value="${id}">${name}</option>`;
        }

        renderGrouped(allResults);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('results-container').innerHTML =
            '<p style="color:red; text-align:center;">ไม่สามารถโหลดข้อมูลได้</p>';
    }
}

const applyFilter = () => {
    let studentId = document.getElementById('filter-student').value;
    let filtered = studentId
        ? allResults.filter(r => r.student_id == studentId)
        : allResults;
    renderGrouped(filtered);
}

const renderGrouped = (data) => {
    if (data.length === 0) {
        document.getElementById('results-container').innerHTML =
            '<p style="text-align:center; color:gray;">ยังไม่มีข้อมูลผลสอบ</p>';
        return;
    }

    let groups = {};
    for (let r of data) {
        if (!groups[r.lesson_id]) {
            groups[r.lesson_id] = { lesson_title: r.lesson_title, rows: [] };
        }
        groups[r.lesson_id].rows.push(r);
    }

    let html = '';
    for (let lessonId in groups) {
        let group = groups[lessonId];
        let rows = group.rows;
        let correctCount = rows.filter(r => r.is_correct).length;
        let pct = Math.round((correctCount / rows.length) * 100);

        html += `<div class="lesson-group">
            <div class="lesson-group-header">
                📝 ${group.lesson_title}
                <span class="lesson-summary">ตอบถูก ${correctCount}/${rows.length} ข้อ (${pct}%)</span>
            </div>
            <table class="score-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>ชื่อนักเรียน</th>
                        <th>คำถาม</th>
                        <th style="text-align:center;">คำตอบ</th>
                        <th style="text-align:center;">เฉลย</th>
                        <th style="text-align:center;">ผล</th>
                    </tr>
                </thead>
                <tbody>`;

        for (let i = 0; i < rows.length; i++) {
            let r = rows[i];
            let badge = r.is_correct
                ? '<span class="badge-pass">✅ ถูก</span>'
                : '<span class="badge-fail">❌ ผิด</span>';

            html += `<tr>
                <td>${i + 1}</td>
                <td><strong>${r.firstname} ${r.lastname}</strong></td>
                <td style="max-width:250px; font-size:13px;">${r.question}</td>
                <td style="text-align:center; font-weight:bold; color:#3c8dbc; font-size:16px;">${r.selected_answer.toUpperCase()}</td>
                <td style="text-align:center; font-weight:bold; color:#00a65a; font-size:16px;">${r.correct_answer.toUpperCase()}</td>
                <td style="text-align:center;">${badge}</td>
            </tr>`;
        }

        html += `</tbody></table></div>`;
    }

    document.getElementById('results-container').innerHTML = html;
}