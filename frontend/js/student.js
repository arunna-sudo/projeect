const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    await loadData();
}

const loadData = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/students`);
        const studentDOM = document.getElementById('student');
        let htmlData = '<div>';
        
        for (let i = 0; i < response.data.length; i++) {
            let student = response.data[i];
            htmlData += `<div class="data-item">
                <div>
                    <strong>${i + 1}. ${student.firstname} ${student.lastname}</strong>
                    <span style="color: #7f8c8d; font-size: 14px; margin-left: 10px;">(✉️ ${student.email})</span>
                </div>
                <div>
                    <a href="student-form.html?id=${student.id}" class="btn-edit" style="text-decoration: none;">✏️ แก้ไข</a>
                    <button class="delete btn-delete" data-id="${student.id}">🗑️ ลบ</button>
                </div>
            </div>`
        }

        htmlData += '</div>';
        studentDOM.innerHTML = htmlData;

        // ผูก event delete
        const deleteDOMs = document.getElementsByClassName('delete');
        for (let i = 0; i < deleteDOMs.length; i++) {
            deleteDOMs[i].addEventListener('click', async (event) => {
                if (confirm('ต้องการลบผู้เรียนคนนี้ใช่หรือไม่?')) {
                    const id = event.target.dataset.id;
                    try {
                        await axios.delete(`${BASE_URL}/students/${id}`);
                        loadData(); // โหลดข้อมูลใหม่หลังจากลบสำเร็จ
                    } catch (error) {
                        console.error('Error deleting student:', error);
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error fetching students:', error);
    }
}