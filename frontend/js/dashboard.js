const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    await updateStatistics();
}

const updateStatistics = async () => {
    try {
        // ดึงข้อมูลพร้อมกันทุกอย่าง
        const [courseRes, instructorRes, studentRes, lessonRes] = await Promise.all([
            axios.get(`${BASE_URL}/courses`),
            axios.get(`${BASE_URL}/instructors`),
            axios.get(`${BASE_URL}/students`),
            axios.get(`${BASE_URL}/lessons`)
        ]);

        // นำจำนวน (length) ของข้อมูลมาใส่ใน HTML
        document.getElementById('count-courses').innerText = courseRes.data.length;
        document.getElementById('count-instructors').innerText = instructorRes.data.length;
        document.getElementById('count-students').innerText = studentRes.data.length;
        document.getElementById('count-lessons').innerText = lessonRes.data.length;

    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}