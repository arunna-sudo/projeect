const BASE_URL = 'http://localhost:8000';

let mode = 'create';
let selectedId = '';

window.onload = async () => {
    await loadInstructors();

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (id) {
        mode = 'edit';
        selectedId = id;
        try {
            const response = await axios.get(`${BASE_URL}/courses/${id}`);
            const course = response.data;
            
            document.querySelector('input[name=title]').value = course.title;
            document.querySelector('textarea[name=description]').value = course.description;
            document.querySelector('select[name=instructor_id]').value = course.instructor_id;
        } catch (error) {
            console.error('Error fetching course data:', error);
        }
    }
}

const loadInstructors = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/instructors`);
        let instructorDOM = document.querySelector('select[name=instructor_id]');
        for (let i = 0; i < response.data.length; i++) {
            let instructor = response.data[i];
            instructorDOM.innerHTML += `<option value="${instructor.id}">${instructor.firstname} ${instructor.lastname}</option>`;
        }
    } catch (error) {
        console.error('Error fetching instructors:', error);
    }
}

const validateData = (courseData) => {
    let errors = [];
    if (!courseData.title) errors.push('กรุณากรอกชื่อคอร์ส');
    if (!courseData.description) errors.push('กรุณากรอกรายละเอียด');
    if (!courseData.instructor_id) errors.push('กรุณาเลือกผู้สอน');
    return errors;
}

const submitData = async () => {
    // 1. ดึง DOM กลับมาก่อน (ห้ามลืมตรงนี้!)
    let titleDOM = document.querySelector('input[name=title]');
    let descriptionDOM = document.querySelector('textarea[name=description]');
    let instructorDOM = document.querySelector('select[name=instructor_id]');
    let messageDOM = document.getElementById('message');

    try {
        // 2. สร้าง object courseData เพื่อเตรียมส่ง (ห้ามลืมตรงนี้!)
        let courseData = {
            title: titleDOM.value,
            description: descriptionDOM.value,
            instructor_id: instructorDOM.value
        }

        // 3. ตรวจสอบข้อมูลก่อนส่ง
        const errors = validateData(courseData);
        if (errors.length > 0) {
            // ถ้ากรอกไม่ครบ ให้โยน error ไปที่ catch
            throw { message: 'กรุณากรอกข้อมูลให้ครบถ้วน', errors: errors };
        }

        let messageText = '💾 บันทึกข้อมูลสำเร็จ';
        if (mode === 'create') {
            await axios.post(`${BASE_URL}/courses`, courseData);
        } else {
            await axios.put(`${BASE_URL}/courses/${selectedId}`, courseData);
            messageText = '✅ แก้ไขข้อมูลสำเร็จ';
        }

        // แสดงผลสำเร็จ
        messageDOM.innerText = messageText;
        messageDOM.className = 'message success'; 

        setTimeout(() => { window.location.href = 'course.html'; }, 1500);

    } catch (error) {
        // ส่วนจัดการ Error ที่คุณต้องการ
        let errorMessage = '❌ เกิดข้อผิดพลาด';
        let errorList = error.errors || [];

        if (error.response && error.response.data) {
            errorMessage = error.response.data.message || errorMessage;
            errorList = error.response.data.errors || errorList;
        }

        let htmlData = `<div style="font-weight: bold;">${errorMessage}</div>`;
        if (errorList.length > 0) {
            htmlData += '<ul style="text-align: left; display: inline-block; margin-top: 10px;">';
            for (let i = 0; i < errorList.length; i++) {
                htmlData += `<li>${errorList[i]}</li>`;
            }
            htmlData += '</ul>';
        }

        messageDOM.innerHTML = htmlData;
        messageDOM.className = 'message danger'; 
    }
}