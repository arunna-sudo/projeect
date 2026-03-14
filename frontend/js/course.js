const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    await loadData();
}

const loadData = async () => {
    try {
        // 1. ดึงข้อมูลคอร์สทั้งหมด
        const response = await axios.get(`${BASE_URL}/courses`);
        const courses = response.data;

        // 2. ดึงข้อมูลอาจารย์ทั้งหมดมาเตรียมไว้จับคู่ 
        const instResponse = await axios.get(`${BASE_URL}/instructors`);
        const instructors = instResponse.data;

        const courseDOM = document.getElementById('course');
        let htmlData = '<div>'; // เปิด tag คลุมไว้

        for (let i = 0; i < courses.length; i++) {
            let course = courses[i];
            
            // โลจิกจับคู่: เอา instructor_id ของคอร์ส ไปค้นหาชื่ออาจารย์
            let instructorName = 'ไม่มีผู้สอน';
            if (course.instructor_id) {
                // ค้นหาในกล่อง instructors ว่าใครมี id ตรงกับ course.instructor_id
                let matchedInst = instructors.find(inst => inst.id === course.instructor_id);
                if (matchedInst) {
                    // ถ้าเจอ ให้เอาชื่อกับนามสกุลมาต่อกัน
                    instructorName = `${matchedInst.firstname} ${matchedInst.lastname}`;
                }
            }

            // ปรับ HTML 
            htmlData += `
            <div class="data-item">
                <div>
                    <strong>${i + 1}. ${course.title}</strong> 
                    <span style="color: #7f8c8d; font-size: 14px; margin-left: 10px;">(ผู้สอน: ${instructorName})</span>
                </div>
                <div>
                    <a href="index.html?id=${course.id}" class="btn-edit" style="text-decoration: none;">Edit</a>
                    <button class="delete btn-delete" data-id="${course.id}">Delete</button>
                </div>
            </div>`
        }
        
        htmlData += '</div>';
        courseDOM.innerHTML = htmlData;

        // ผูก delete 
        const deleteDOMs = document.getElementsByClassName('delete');
        for (let i = 0; i < deleteDOMs.length; i++) {
            deleteDOMs[i].addEventListener('click', async (event) => {
                if (confirm('ต้องการลบคอร์สนี้ใช่หรือไม่?')) {
                    const id = event.target.dataset.id;
                    try {
                        await axios.delete(`${BASE_URL}/courses/${id}`);
                        loadData(); // โหลดข้อมูลใหม่หลังจากลบสำเร็จ
                    } catch (error) {
                        console.error('Error deleting course:', error);
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}