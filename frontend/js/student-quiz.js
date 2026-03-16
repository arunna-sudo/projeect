const BASE_URL = 'http://localhost:8000';
let currentQuizzes = [];
let user = null;

window.onload = async () => {
    user = JSON.parse(localStorage.getItem('user'));
    await loadMyCourses();
}

// 1. โหลดเฉพาะคอร์สที่นักเรียนลงทะเบียนไว้
const loadMyCourses = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/enrollments`);
        let myEnrollments = response.data.filter(e => e.student_id === user.student_id);

        let courseDOM = document.querySelector('select[name=course_id]');
        courseDOM.innerHTML = '<option value="">-- เลือกคอร์สที่ลงทะเบียนไว้ --</option>';

        for (let i = 0; i < myEnrollments.length; i++) {
            let enroll = myEnrollments[i];
            courseDOM.innerHTML += `<option value="${enroll.course_id}">${enroll.course_title}</option>`;
        }
    } catch (error) {
        console.error('Error fetching enrollments:', error);
    }
}

// 2. โหลดบทเรียนของคอร์สที่เลือก
const loadLessons = async () => {
    let courseId = document.querySelector('select[name=course_id]').value;
    let lessonDOM = document.querySelector('select[name=lesson_id]');

    // reset
    lessonDOM.innerHTML = '<option value="">-- เลือกบทเรียน --</option>';
    document.getElementById('quiz-container').innerHTML = '';
    document.getElementById('submit-section').style.display = 'none';
    document.getElementById('score-box').style.display = 'none';

    if (!courseId) return;

    try {
        const response = await axios.get(`${BASE_URL}/lessons`);
        // กรองเฉพาะบทเรียนของคอร์สนี้
        let myLessons = response.data.filter(l => l.course_id == courseId);

        for (let i = 0; i < myLessons.length; i++) {
            let lesson = myLessons[i];
            lessonDOM.innerHTML += `<option value="${lesson.id}">บทที่ ${lesson.order_number}: ${lesson.title}</option>`;
        }
    } catch (error) {
        console.error('Error fetching lessons:', error);
    }
}

// 3. โหลดข้อสอบตามบทเรียนที่เลือก
const loadQuizzes = async () => {
    let lessonId = document.querySelector('select[name=lesson_id]').value;
    if (!lessonId) {
        document.getElementById('quiz-container').innerHTML = '';
        document.getElementById('submit-section').style.display = 'none';
        document.getElementById('score-box').style.display = 'none';
        return;
    }

    try {
        const response = await axios.get(`${BASE_URL}/quizzes/lesson/${lessonId}`);
        currentQuizzes = response.data;

        let htmlData = '';
        for (let i = 0; i < currentQuizzes.length; i++) {
            let quiz = currentQuizzes[i];
            htmlData += `<div class="quiz-item" id="quiz-item-${quiz.id}">
                <div class="quiz-question">ข้อ ${i + 1}. ${quiz.question}</div>
                <ul class="choice-list">
                    <li><label>
                        <input type="radio" name="quiz_${quiz.id}" value="a">
                        A. ${quiz.choice_a}
                    </label></li>
                    <li><label>
                        <input type="radio" name="quiz_${quiz.id}" value="b">
                        B. ${quiz.choice_b}
                    </label></li>
                    <li><label>
                        <input type="radio" name="quiz_${quiz.id}" value="c">
                        C. ${quiz.choice_c}
                    </label></li>
                    <li><label>
                        <input type="radio" name="quiz_${quiz.id}" value="d">
                        D. ${quiz.choice_d}
                    </label></li>
                </ul>
            </div>`
        }

        if (currentQuizzes.length === 0) {
            htmlData = '<p style="text-align:center; color:gray;">ยังไม่มีข้อสอบในบทเรียนนี้</p>';
            document.getElementById('submit-section').style.display = 'none';
        } else {
            document.getElementById('submit-section').style.display = 'block';
        }

        document.getElementById('quiz-container').innerHTML = htmlData;
        document.getElementById('score-box').style.display = 'none';

    } catch (error) {
        console.error('Error fetching quizzes:', error);
    }
}

// 4. ส่งคำตอบทั้งหมด
const submitAllAnswers = async () => {
    if (!confirm('ต้องการส่งคำตอบทั้งหมดใช่หรือไม่?')) return;

    let correctCount = 0;
    let totalCount = currentQuizzes.length;
    let results = [];

    for (let i = 0; i < currentQuizzes.length; i++) {
        let quiz = currentQuizzes[i];
        let selectedDOM = document.querySelector(`input[name=quiz_${quiz.id}]:checked`);
        let selectedAnswer = selectedDOM ? selectedDOM.value : null;

        if (!selectedAnswer) {
            alert(`กรุณาตอบข้อ ${i + 1} ก่อนส่ง`);
            return;
        }

        try {
            const response = await axios.post(`${BASE_URL}/quizzes/submit`, {
                student_id: user.student_id,
                quiz_id: quiz.id,
                selected_answer: selectedAnswer
            });

            let isCorrect = response.data.is_correct;
            if (isCorrect) correctCount++;

            results.push({
                quizId: quiz.id,
                isCorrect: isCorrect,
                correctAnswer: response.data.correct_answer,
                selectedAnswer: selectedAnswer
            });

        } catch (error) {
            if (error.response && error.response.status === 400) {
                results.push({ quizId: quiz.id, isCorrect: false, done: true });
            }
        }
    }

    showResults(results, correctCount, totalCount);
}

// 5. แสดงผลลัพธ์
const showResults = (results, correctCount, totalCount) => {
    let scoreBox = document.getElementById('score-box');
    let scoreText = document.getElementById('score-text');
    scoreText.innerText = `${correctCount} / ${totalCount}`;
    scoreBox.style.display = 'block';

    if (correctCount === totalCount) {
        scoreBox.style.borderTopColor = '#00a65a';
        scoreText.style.color = '#00a65a';
    } else if (correctCount >= totalCount / 2) {
        scoreBox.style.borderTopColor = '#f39c12';
        scoreText.style.color = '#f39c12';
    } else {
        scoreBox.style.borderTopColor = '#dd4b39';
        scoreText.style.color = '#dd4b39';
    }

    for (let i = 0; i < results.length; i++) {
        let result = results[i];
        let quizItemDOM = document.getElementById(`quiz-item-${result.quizId}`);
        if (!quizItemDOM) continue;

        if (result.isCorrect) {
            quizItemDOM.classList.add('result-correct');
            quizItemDOM.innerHTML += `<div class="result-badge badge-correct">✅ ถูกต้อง</div>`;
        } else {
            quizItemDOM.classList.add('result-wrong');
            quizItemDOM.innerHTML += `<div class="result-badge badge-wrong">❌ ผิด — เฉลย: ${result.correctAnswer ? result.correctAnswer.toUpperCase() : '-'}</div>`;
        }
    }

    document.getElementById('submit-section').style.display = 'none';

    // ปุ่มทำใหม่
    let lessonId = document.querySelector('select[name=lesson_id]').value;
    let resetHTML = `<div style="text-align: center; margin-top: 20px;">
        <button onclick="resetAnswers(${lessonId})" class="btn-back" style="padding: 10px 30px;">
            🔄 ทำใหม่อีกครั้ง
        </button>
    </div>`;
    document.getElementById('quiz-container').innerHTML += resetHTML;
}

// 6. ลบคำตอบเดิมแล้วโหลดใหม่
const resetAnswers = async (lessonId) => {
    if (!confirm('ต้องการลบคำตอบเดิมแล้วทำใหม่ใช่หรือไม่?')) return;
    try {
        await axios.delete(`${BASE_URL}/quizzes/results/student/${user.student_id}/lesson/${lessonId}`);
        document.getElementById('score-box').style.display = 'none';
        await loadQuizzes();
    } catch (error) {
        console.error('Error resetting answers:', error);
        alert('เกิดข้อผิดพลาดในการลบคำตอบ');
    }
}