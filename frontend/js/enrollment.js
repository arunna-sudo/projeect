const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    // โหลดข้อมูลนักเรียนและคอร์สมาใส่ Dropdown ทันทีที่เปิดหน้าเว็บ
    await loadStudents();
    await loadCourses();
    // โหลดรายชื่อคนที่ลงทะเบียนแล้วมาแสดง
    await loadEnrollments();
}

// 1. ดึงข้อมูลผู้เรียนมาใส่ Dropdown
const loadStudents = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/students`);
        let studentDOM = document.querySelector('select[name=student_id]');
        for (let i = 0; i < response.data.length; i++) {
            let student = response.data[i];
            studentDOM.innerHTML += `<option value="${student.id}">${student.firstname} ${student.lastname}</option>`;
        }
    } catch (error) {
        console.error('Error fetching students:', error);
    }
}

// 2. ดึงข้อมูลคอร์สมาใส่ Dropdown
const loadCourses = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/courses`);
        let courseDOM = document.querySelector('select[name=course_id]');
        for (let i = 0; i < response.data.length; i++) {
            let course = response.data[i];
            courseDOM.innerHTML += `<option value="${course.id}">${course.title}</option>`;
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
}

// 3. ดึงข้อมูลการลงทะเบียนทั้งหมดมาแสดง
const loadEnrollments = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/enrollments`);
        const enrollmentDOM = document.getElementById('enrollment-data');
        let htmlData = '';
        
        for (let i = 0; i < response.data.length; i++) {
            let enroll = response.data[i];
            // สังเกตว่าเราใช้ firstname, lastname, course_title ที่ได้มาจากคำสั่ง JOIN ใน Backend ได้เลย
            htmlData += `<div class="enrollment-item">
                <div>
                    <strong>นักเรียน:</strong> ${enroll.firstname} ${enroll.lastname} <br>
                    <strong>ลงเรียนคอร์ส:</strong> ${enroll.course_title} <br>
                    <small style="color: gray;">วันที่ลงทะเบียน: ${new Date(enroll.enrolled_at).toLocaleString('th-TH')}</small>
                </div>
                <button class="delete" data-id="${enroll.id}">ยกเลิกการลงทะเบียน</button>
            </div>`
        }
        
        if(response.data.length === 0) {
            htmlData = '<p style="text-align:center; color:gray;">ยังไม่มีข้อมูลการลงทะเบียน</p>';
        }
        
        enrollmentDOM.innerHTML = htmlData;

        // ผูก event ปุ่มลบ (ยกเลิกการลงทะเบียน)
        const deleteDOMs = document.getElementsByClassName('delete');
        for (let i = 0; i < deleteDOMs.length; i++) {
            deleteDOMs[i].addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                const confirmDelete = confirm('ต้องการยกเลิกการลงทะเบียนนี้ใช่หรือไม่?');
                if(confirmDelete) {
                    try {
                        await axios.delete(`${BASE_URL}/enrollments/${id}`);
                        loadEnrollments(); // โหลดข้อมูลใหม่หลังจากลบสำเร็จ
                    } catch (error) {
                        console.error('Error deleting enrollment:', error);
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error fetching enrollments:', error);
    }
}

// 4. ฟังก์ชันตรวจสอบการกรอกข้อมูล
const validateData = (data) => {
    let errors = [];
    if (!data.student_id) errors.push('กรุณาเลือกผู้เรียน');
    if (!data.course_id) errors.push('กรุณาเลือกคอร์สเรียน');
    return errors;
}

// 5. ส่งข้อมูลลงทะเบียนใหม่
const submitData = async () => {
    let studentDOM = document.querySelector('select[name=student_id]');
    let courseDOM = document.querySelector('select[name=course_id]');
    let messageDOM = document.getElementById('message');

    try {
        let enrollData = {
            student_id: studentDOM.value,
            course_id: courseDOM.value
        }

        const errors = validateData(enrollData);
        if (errors.length > 0) {
            throw { message: 'ข้อมูลไม่ครบถ้วน', errors: errors }
        }

        // ยิง API บันทึกข้อมูล
        await axios.post(`${BASE_URL}/enrollments`, enrollData);
        
        messageDOM.innerText = 'ลงทะเบียนเรียนสำเร็จ!';
        messageDOM.className = 'message success';
        
        // ล้างค่า Dropdown ให้กลับไปค่าเริ่มต้น
        studentDOM.value = '';
        courseDOM.value = '';

        // รีเฟรชรายการด้านล่างใหม่ทันที
        loadEnrollments();

    } catch (error) {
        console.log('error:', error);
        if (error.response) {
            error.message = error.response.data.message;
            error.errors = error.response.data.errors;
        }

        let htmlData = `<div>${error.message || 'เกิดข้อผิดพลาด'}</div>`;
        if (error.errors && error.errors.length > 0) {
            htmlData += '<ul>';
            for (let i = 0; i < error.errors.length; i++) {
                htmlData += `<li>${error.errors[i]}</li>`;
            }
            htmlData += '</ul>';
        }
        
        messageDOM.innerHTML = htmlData;
        messageDOM.className = 'message danger';
    }
}
