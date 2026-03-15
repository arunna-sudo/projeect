const BASE_URL = 'http://localhost:8000';

// ถ้า login แล้ว ให้ redirect ไปหน้าที่ถูกต้องเลย
window.onload = () => {
    let user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        if (user.role === 'teacher') {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'student-dashboard.html';
        }
    }
}

const validateData = (data) => {
    let errors = [];
    if (!data.email) errors.push('กรุณากรอกอีเมล');
    if (!data.password) errors.push('กรุณากรอกรหัสผ่าน');
    return errors;
}

const submitLogin = async () => {
    let emailDOM = document.querySelector('input[name=email]');
    let passwordDOM = document.querySelector('input[name=password]');
    let messageDOM = document.getElementById('message');

    try {
        let loginData = {
            email: emailDOM.value,
            password: passwordDOM.value
        }

        const errors = validateData(loginData);
        if (errors.length > 0) {
            throw { message: 'กรุณากรอกข้อมูลให้ครบถ้วน', errors: errors }
        }

        const response = await axios.post(`${BASE_URL}/login`, loginData);
        console.log('login response', response.data);

        // เก็บข้อมูล user ไว้ใน localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));

        messageDOM.innerText = 'เข้าสู่ระบบสำเร็จ!';
        messageDOM.className = 'message success';

        // redirect ตาม role
        if (response.data.user.role === 'teacher') {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'student-dashboard.html';
        }

    } catch (error) {
        console.log('error', error);
        if (error.response) {
            error.message = error.response.data.message;
            error.errors = [];
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