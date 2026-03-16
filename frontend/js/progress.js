const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    // โหลดข้อมูลใส่ Dropdown
    await loadStudents();
    // await loadLessons(); // เอาออก เพราะเราจะโหลดบทเรียนหลังจากเลือกคอร์สแล้วแทน
    // โหลดประวัติการเรียนมาแสดง
    await loadProgress();
}

// 1. โหลดชื่อผู้เรียน
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

// (เพิ่มใหม่) โหลดคอร์สที่นักเรียนคนนั้นลงทะเบียนไว้
const loadStudentCourses = async () => {
    let studentId = document.querySelector('select[name=student_id]').value;
    let courseDOM = document.querySelector('select[name=course_id]');
    let lessonDOM = document.querySelector('select[name=lesson_id]');

    courseDOM.innerHTML = '<option value="">-- เลือกคอร์ส --</option>';
    lessonDOM.innerHTML = '<option value="">-- กรุณาเลือกคอร์สก่อน --</option>';
    courseDOM.disabled = true;
    lessonDOM.disabled = true;

    if (!studentId) return;

    try {
        const response = await axios.get(`${BASE_URL}/enrollments`);
        let myEnrollments = response.data.filter(e => e.student_id == studentId);

        if (myEnrollments.length === 0) {
            courseDOM.innerHTML = '<option value="">-- นักเรียนยังไม่ได้ลงคอร์สใดๆ --</option>';
        } else {
            for (let i = 0; i < myEnrollments.length; i++) {
                let enroll = myEnrollments[i];
                courseDOM.innerHTML += `<option value="${enroll.course_id}">${enroll.course_title}</option>`;
            }
            courseDOM.disabled = false;
        }
    } catch (error) {
        console.error('Error fetching enrollments:', error);
    }
}

// 2. โหลดชื่อบทเรียน (แก้ให้โหลดตามคอร์สที่เลือก)
const loadCourseLessons = async () => {
    let courseId = document.querySelector('select[name=course_id]').value;
    let lessonDOM = document.querySelector('select[name=lesson_id]');

    lessonDOM.innerHTML = '<option value="">-- เลือกบทเรียน --</option>';
    lessonDOM.disabled = true;

    if (!courseId) return;

    try {
        const response = await axios.get(`${BASE_URL}/lessons`);
        let courseLessons = response.data.filter(l => l.course_id == courseId);

        if (courseLessons.length === 0) {
            lessonDOM.innerHTML = '<option value="">-- คอร์สนี้ยังไม่มีบทเรียน --</option>';
        } else {
            for (let i = 0; i < courseLessons.length; i++) {
                let lesson = courseLessons[i];
                lessonDOM.innerHTML += `<option value="${lesson.id}">บทที่ ${lesson.order_number}: ${lesson.title}</option>`;
            }
            lessonDOM.disabled = false;
        }
    } catch (error) {
        console.error('Error fetching lessons:', error);
    }
}

// 3. โหลดประวัติการเรียนทั้งหมดมาแสดง
const loadProgress = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/progress`);
        const progressDOM = document.getElementById('progress-data');
        let htmlData = '';
        
        for (let i = 0; i < response.data.length; i++) {
            let prog = response.data[i];
            
            // เช็คว่าเรียนจบหรือยัง เพื่อเปลี่ยนสีป้ายและข้อความ
            let statusBadge = prog.is_completed 
                ? `<span class="status-badge status-completed">✅ เรียนจบแล้ว</span>`
                : `<span class="status-badge status-learning">⏳ กำลังเรียน</span>`;
            
            // จัดรูปแบบวันที่ถ้าเรียนจบแล้ว
            let dateText = prog.is_completed && prog.completed_at 
                ? `จบเมื่อ: ${new Date(prog.completed_at).toLocaleString('th-TH')}`
                : `เริ่มเรียนเมื่อไม่มีข้อมูล`; // ถ้ายังไม่จบ จะไม่มีเวลา completed_at
            
            htmlData += `<div class="progress-item">
                <div>
                    <strong>ผู้เรียน:</strong> ${prog.firstname} ${prog.lastname} <br>
                    <strong>บทเรียน:</strong> ${prog.lesson_title} <br>
                    ${statusBadge} <small style="color: gray; margin-left: 10px;">${prog.is_completed ? dateText : ''}</small>
                </div>
                <div>
                    ${!prog.is_completed ? `<button class="btn-success update-btn" data-id="${prog.id}">✅ กดเรียนจบ</button>` : ''}
                </div>
            </div>`
        }
        
        if(response.data.length === 0) {
            htmlData = '<p style="text-align:center; color:gray;">ยังไม่มีประวัติการเรียน</p>';
        }
        
        progressDOM.innerHTML = htmlData;

        // ผูก event ปุ่ม "กดเรียนจบ" (อัปเดตสถานะผ่าน PUT)
        const updateBtns = document.getElementsByClassName('update-btn');
        for (let i = 0; i < updateBtns.length; i++) {
            updateBtns[i].addEventListener('click', async (event) => {
                const id = event.target.dataset.id;
                try {
                    // ส่งข้อมูลไปอัปเดตว่า is_completed เป็น true
                    await axios.put(`${BASE_URL}/progress/${id}`, { is_completed: true });
                    loadProgress(); // โหลดข้อมูลใหม่หลังจากอัปเดตสำเร็จ
                } catch (error) {
                    console.error('Error updating progress:', error);
                    alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
                }
            });
        }
    } catch (error) {
        console.error('Error fetching progress:', error);
    }
}

// 4. ตรวจสอบการกรอกฟอร์ม
const validateData = (data) => {
    let errors = [];
    if (!data.student_id) errors.push('กรุณาเลือกผู้เรียน');
    if (!data.lesson_id) errors.push('กรุณาเลือกบทเรียน');
    return errors;
}

// 5. บันทึกประวัติการเริ่มเรียน (POST)
const submitData = async () => {
    let studentDOM = document.querySelector('select[name=student_id]');
    let lessonDOM = document.querySelector('select[name=lesson_id]');
    let completedDOM = document.querySelector('select[name=is_completed]');
    let messageDOM = document.getElementById('message');

    try {
        let progressData = {
            student_id: studentDOM.value,
            lesson_id: lessonDOM.value,
            // แปลงข้อความ "true"/"false" เป็นค่า Boolean จริงๆ
            is_completed: completedDOM.value === 'true' 
        }

        const errors = validateData(progressData);
        if (errors.length > 0) {
            throw { message: 'ข้อมูลไม่ครบถ้วน', errors: errors }
        }

        // ยิง API บันทึกข้อมูล
        await axios.post(`${BASE_URL}/progress`, progressData);
        
        messageDOM.innerText = 'บันทึกประวัติการเรียนสำเร็จ!';
        messageDOM.className = 'message success';
        
        // รีเฟรชรายการด้านล่าง
        loadProgress();

    } catch (error) {
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