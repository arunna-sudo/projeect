const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    await loadData();
}

const loadData = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/lessons`);
        const lessonDOM = document.getElementById('lesson');
        let htmlData = '<div>';
        
        for (let i = 0; i < response.data.length; i++) {
            let lesson = response.data[i];
            htmlData += `<div>
                (คอร์ส ID: ${lesson.course_id}) ลำดับที่ ${lesson.order_number}: ${lesson.title} 
                <a href="lesson-form.html?id=${lesson.id}"><button>Edit</button></a>
                <button class="delete" data-id="${lesson.id}">Delete</button>
            </div>`
        }
        htmlData += '</div>';
        lessonDOM.innerHTML = htmlData;

        // ผูก event delete
        const deleteDOMs = document.getElementsByClassName('delete');
        for (let i = 0; i < deleteDOMs.length; i++) {
            deleteDOMs[i].addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                try {
                    await axios.delete(`${BASE_URL}/lessons/${id}`);
                    loadData(); // โหลดข้อมูลใหม่หลังจากลบสำเร็จ
                } catch (error) {
                    console.error('Error deleting lesson:', error);
                }
            });
        }
    } catch (error) {
        console.error('Error fetching lessons:', error);
    }
}