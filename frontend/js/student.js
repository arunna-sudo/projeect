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
            htmlData += `<div>
                ${student.id}. ${student.firstname} ${student.lastname} (${student.email})
                <a href="student-form.html?id=${student.id}"><button>Edit</button></a>
                <button class="delete" data-id="${student.id}">Delete</button>
            </div>`
        }
        htmlData += '</div>';
        studentDOM.innerHTML = htmlData;

        // ผูก event delete
        const deleteDOMs = document.getElementsByClassName('delete');
        for (let i = 0; i < deleteDOMs.length; i++) {
            deleteDOMs[i].addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                try {
                    await axios.delete(`${BASE_URL}/students/${id}`);
                    loadData(); // โหลดข้อมูลใหม่หลังจากลบสำเร็จ
                } catch (error) {
                    console.error('Error deleting student:', error);
                }
            });
        }
    } catch (error) {
        console.error('Error fetching students:', error);
    }
}