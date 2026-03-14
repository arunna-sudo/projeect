const BASE_URL = 'http://localhost:8000';
let mode = 'create';
let selectedId = '';

window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (id) {
        mode = 'edit';
        selectedId = id;
        try {
            const response = await axios.get(`${BASE_URL}/students/${id}`);
            const student = response.data;

            let firstnameDOM = document.querySelector('input[name=firstname]');
            let lastnameDOM = document.querySelector('input[name=lastname]');
            let emailDOM = document.querySelector('input[name=email]');

            firstnameDOM.value = student.firstname;
            lastnameDOM.value = student.lastname;
            emailDOM.value = student.email;
        } catch (error) {
            console.error('Error fetching student data:', error);
        }
    }
}

const validateData = (data) => {
    let errors = [];
    if (!data.firstname) errors.push('กรุณากรอกชื่อ');
    if (!data.lastname) errors.push('กรุณากรอกนามสกุล');
    if (!data.email) errors.push('กรุณากรอกอีเมล');
    return errors;
}

const submitData = async () => {
    let firstnameDOM = document.querySelector('input[name=firstname]');
    let lastnameDOM = document.querySelector('input[name=lastname]');
    let emailDOM = document.querySelector('input[name=email]');
    let messageDOM = document.getElementById('message');

    try {
        let studentData = {
            firstname: firstnameDOM.value,
            lastname: lastnameDOM.value,
            email: emailDOM.value
        }

        const errors = validateData(studentData);
        if (errors.length > 0) {
            throw {
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
                errors: errors
            }
        }

        let message = 'บันทึกข้อมูลสำเร็จ';
        if (mode === 'create') {
            await axios.post(`${BASE_URL}/students`, studentData);
        } else if (mode === 'edit') {
            await axios.put(`${BASE_URL}/students/${selectedId}`, studentData);
            message = 'แก้ไขข้อมูลสำเร็จ';
        }

        messageDOM.innerText = message;
        // ทำให้ข้อความสีเขียวเวลาสำเร็จ
        messageDOM.style.color = "green"; 
        messageDOM.className = 'message success';

    } catch (error) {
        console.log('error object:', error);
        
        let errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
        let errorList = [];

        // เช็คว่ามี Error จาก Backend ส่งมาหรือไม่
        if (error.response && error.response.data) {
            errorMessage = error.response.data.message || errorMessage;
            errorList = error.response.data.errors || [];
            
            // 🌟 ดักจับคำว่า Duplicate entry เพื่อเปลี่ยนเป็นข้อความภาษาไทย 🌟
            if (typeof errorMessage === 'string' && errorMessage.includes('Duplicate entry')) {
                errorMessage = '❌ อีเมลนี้มีอยู่ในระบบแล้ว กรุณาใช้อีเมลอื่น';
            }
        } else if (error.message) {
            // กรณีเป็น Error จากการ validate ข้อมูลไม่ครบ
            errorMessage = error.message;
            errorList = error.errors || [];
        }

        // ประกอบร่าง HTML เพื่อแสดงผล
        let htmlData = '<div>';
        htmlData += `<div style="font-weight: bold;">${errorMessage}</div>`;
        
        if (errorList && errorList.length > 0) {
            htmlData += '<ul style="text-align: left; margin-top: 10px;">';
            for (let i = 0; i < errorList.length; i++) {
                htmlData += `<li>${errorList[i]}</li>`;
            }
            htmlData += '</ul>';
        }
        htmlData += '</div>';
        
        messageDOM.innerHTML = htmlData;
        // ทำให้ข้อความสีแดงเวลา Error
        messageDOM.style.color = "red";
        messageDOM.className = 'message danger';
    }
}