const BASE_URL = 'http://localhost:8000';
let mode = 'create';
let selectedId = '';

window.onload = async () => {
    // โหลดคอร์สทั้งหมดมาใส่ใน Dropdown ก่อน
    await loadCourses();

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (id) {
        mode = 'edit';
        selectedId = id;
        try {
            const response = await axios.get(`${BASE_URL}/lessons/${id}`);
            const lesson = response.data;

            let courseDOM = document.querySelector('select[name=course_id]');
            let orderDOM = document.querySelector('input[name=order_number]');
            let titleDOM = document.querySelector('input[name=title]');
            let contentDOM = document.querySelector('textarea[name=content]');

            courseDOM.value = lesson.course_id;
            orderDOM.value = lesson.order_number;
            titleDOM.value = lesson.title;
            contentDOM.value = lesson.content;
        } catch (error) {
            console.error('Error fetching lesson data:', error);
        }
    }
}

// ฟังก์ชันดึงข้อมูลคอร์สมาทำ Dropdown
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

const validateData = (data) => {
    let errors = [];
    if (!data.course_id) errors.push('กรุณาเลือกคอร์สเรียน');
    if (!data.order_number) errors.push('กรุณาระบุลำดับบทเรียน');
    if (!data.title) errors.push('กรุณากรอกชื่อบทเรียน');
    return errors;
}

const submitData = async () => {
    let courseDOM = document.querySelector('select[name=course_id]');
    let orderDOM = document.querySelector('input[name=order_number]');
    let titleDOM = document.querySelector('input[name=title]');
    let contentDOM = document.querySelector('textarea[name=content]');
    let messageDOM = document.getElementById('message');

    try {
        let lessonData = {
            course_id: courseDOM.value,
            order_number: orderDOM.value,
            title: titleDOM.value,
            content: contentDOM.value
        }

        const errors = validateData(lessonData);
        if (errors.length > 0) {
            throw {
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
                errors: errors
            }
        }

        let message = 'บันทึกข้อมูลสำเร็จ';
        if (mode === 'create') {
            await axios.post(`${BASE_URL}/lessons`, lessonData);
        } else if (mode === 'edit') {
            await axios.put(`${BASE_URL}/lessons/${selectedId}`, lessonData);
            message = 'แก้ไขข้อมูลสำเร็จ';
        }

        messageDOM.innerText = message;
        messageDOM.className = 'message success';
    } catch (error) {
        console.log('error message', error.message);
        if (error.response) {
            error.message = error.response.data.message;
            error.errors = error.response.data.errors;
        }

        let htmlData = '<div>';
        htmlData += `<div>${error.message}</div>`;
        if (error.errors && error.errors.length > 0) {
            htmlData += '<ul>';
            for (let i = 0; i < error.errors.length; i++) {
                htmlData += `<li>${error.errors[i]}</li>`;
            }
            htmlData += '</ul>';
        }
        htmlData += '</div>';
        
        messageDOM.innerHTML = htmlData;
        messageDOM.className = 'message danger';
    }
}