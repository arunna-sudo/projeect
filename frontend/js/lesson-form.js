const BASE_URL = 'http://localhost:8000';
let mode = 'create';
let selectedId = '';

window.onload = async () => {
    await loadCourses();

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (id) {
        mode = 'edit';
        selectedId = id;
        try {
            const response = await axios.get(`${BASE_URL}/lessons/${id}`);
            const lesson = response.data;

            document.querySelector('select[name=course_id]').value = lesson.course_id;
            document.querySelector('input[name=order_number]').value = lesson.order_number;
            document.querySelector('input[name=title]').value = lesson.title;
            document.querySelector('textarea[name=content]').value = lesson.content || '';
            document.querySelector('input[name=video_url]').value = lesson.video_url || '';
            document.querySelector('input[name=file_url]').value = lesson.file_url || '';
        } catch (error) {
            console.error('Error fetching lesson data:', error);
        }
    }
}

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
    let messageDOM = document.getElementById('message');

    try {
        let lessonData = {
            course_id: document.querySelector('select[name=course_id]').value,
            order_number: document.querySelector('input[name=order_number]').value,
            title: document.querySelector('input[name=title]').value,
            content: document.querySelector('textarea[name=content]').value,
            video_url: document.querySelector('input[name=video_url]').value,
            file_url: document.querySelector('input[name=file_url]').value
        }

        const errors = validateData(lessonData);
        if (errors.length > 0) {
            throw { message: 'กรุณากรอกข้อมูลให้ครบถ้วน', errors: errors }
        }

        let message = 'บันทึกข้อมูลสำเร็จ';
        if (mode === 'create') {
            await axios.post(`${BASE_URL}/lessons`, lessonData);
        } else {
            await axios.put(`${BASE_URL}/lessons/${selectedId}`, lessonData);
            message = 'แก้ไขข้อมูลสำเร็จ';
        }

        messageDOM.innerText = message;
        messageDOM.className = 'message success';

        setTimeout(() => { window.location.href = 'lesson.html'; }, 1500);

    } catch (error) {
        if (error.response) {
            error.message = error.response.data.message;
            error.errors = error.response.data.errors;
        }
        let htmlData = `<div>${error.message || 'เกิดข้อผิดพลาด'}</div>`;
        if (error.errors && error.errors.length > 0) {
            htmlData += '<ul>';
            for (let e of error.errors) { htmlData += `<li>${e}</li>`; }
            htmlData += '</ul>';
        }
        messageDOM.innerHTML = htmlData;
        messageDOM.className = 'message danger';
    }
}