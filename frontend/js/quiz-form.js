const BASE_URL = 'http://localhost:8000';
let mode = 'create';
let selectedId = '';

window.onload = async () => {
    // โหลดบทเรียนมาใส่ dropdown ก่อน
    await loadLessons();

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (id) {
        mode = 'edit';
        selectedId = id;
        try {
            const response = await axios.get(`${BASE_URL}/quizzes/${id}`);
            const quiz = response.data;

            document.querySelector('select[name=lesson_id]').value = quiz.lesson_id;
            document.querySelector('textarea[name=question]').value = quiz.question;
            document.querySelector('input[name=choice_a]').value = quiz.choice_a;
            document.querySelector('input[name=choice_b]').value = quiz.choice_b;
            document.querySelector('input[name=choice_c]').value = quiz.choice_c;
            document.querySelector('input[name=choice_d]').value = quiz.choice_d;
            document.querySelector('select[name=answer]').value = quiz.answer;
        } catch (error) {
            console.error('Error fetching quiz:', error);
        }
    }
}

const loadLessons = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/lessons`);
        let lessonDOM = document.querySelector('select[name=lesson_id]');
        for (let i = 0; i < response.data.length; i++) {
            let lesson = response.data[i];
            lessonDOM.innerHTML += `<option value="${lesson.id}">บทที่ ${lesson.order_number}: ${lesson.title}</option>`;
        }
    } catch (error) {
        console.error('Error fetching lessons:', error);
    }
}

const validateData = (data) => {
    let errors = [];
    if (!data.lesson_id) errors.push('กรุณาเลือกบทเรียน');
    if (!data.question) errors.push('กรุณากรอกคำถาม');
    if (!data.choice_a) errors.push('กรุณากรอกตัวเลือก A');
    if (!data.choice_b) errors.push('กรุณากรอกตัวเลือก B');
    if (!data.choice_c) errors.push('กรุณากรอกตัวเลือก C');
    if (!data.choice_d) errors.push('กรุณากรอกตัวเลือก D');
    if (!data.answer) errors.push('กรุณาเลือกเฉลย');
    return errors;
}

const submitData = async () => {
    let lessonDOM = document.querySelector('select[name=lesson_id]');
    let questionDOM = document.querySelector('textarea[name=question]');
    let choiceADOM = document.querySelector('input[name=choice_a]');
    let choiceBDOM = document.querySelector('input[name=choice_b]');
    let choiceCDOM = document.querySelector('input[name=choice_c]');
    let choiceDDOM = document.querySelector('input[name=choice_d]');
    let answerDOM = document.querySelector('select[name=answer]');
    let messageDOM = document.getElementById('message');

    try {
        let quizData = {
            lesson_id: lessonDOM.value,
            question: questionDOM.value,
            choice_a: choiceADOM.value,
            choice_b: choiceBDOM.value,
            choice_c: choiceCDOM.value,
            choice_d: choiceDDOM.value,
            answer: answerDOM.value
        }

        const errors = validateData(quizData);
        if (errors.length > 0) {
            throw { message: 'กรุณากรอกข้อมูลให้ครบถ้วน', errors: errors }
        }

        let message = 'บันทึกข้อมูลสำเร็จ';
        if (mode === 'create') {
            await axios.post(`${BASE_URL}/quizzes`, quizData);
        } else if (mode === 'edit') {
            await axios.put(`${BASE_URL}/quizzes/${selectedId}`, quizData);
            message = 'แก้ไขข้อมูลสำเร็จ';
        }

        messageDOM.innerText = message;
        messageDOM.className = 'message success';

        setTimeout(() => { window.location.href = 'quiz.html'; }, 1500);

    } catch (error) {
        console.log('error', error);
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