const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    await loadData();
}

const loadData = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/quizzes`);
        const quizDOM = document.getElementById('quiz');
        let htmlData = '<div>';

        for (let i = 0; i < response.data.length; i++) {
            let quiz = response.data[i];
            htmlData += `<div class="data-item">
                <div>
                    <strong>${i + 1}. ${quiz.question}</strong>
                    <span style="color: #7f8c8d; font-size: 13px; margin-left: 10px;">(บทเรียน: ${quiz.lesson_title})</span>
                </div>
                <div>
                    <a href="quiz-form.html?id=${quiz.id}" class="btn-edit" style="text-decoration: none;">✏️ แก้ไข</a>
                    <button class="delete btn-delete" data-id="${quiz.id}">🗑️ ลบ</button>
                </div>
            </div>`
        }

        if (response.data.length === 0) {
            htmlData += '<p style="text-align:center; color:gray;">ยังไม่มีข้อสอบ</p>';
        }

        htmlData += '</div>';
        quizDOM.innerHTML = htmlData;

        const deleteDOMs = document.getElementsByClassName('delete');
        for (let i = 0; i < deleteDOMs.length; i++) {
            deleteDOMs[i].addEventListener('click', async (event) => {
                if (confirm('ต้องการลบข้อสอบนี้ใช่หรือไม่?')) {
                    const id = event.target.dataset.id;
                    try {
                        await axios.delete(`${BASE_URL}/quizzes/${id}`);
                        loadData();
                    } catch (error) {
                        console.error('Error deleting quiz:', error);
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error fetching quizzes:', error);
    }
}