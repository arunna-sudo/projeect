const express = require('express');
const router = express.Router();

const validateQuiz = (data) => {
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

// GET /quizzes
router.get('/', async (req, res) => {
    try {
        const query = `SELECT q.*, l.title AS lesson_title FROM quizzes q JOIN lessons l ON q.lesson_id = l.id`;
        const results = await req.conn.query(query);
        res.json(results[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
    }
});

// GET /quizzes/results/all  ← ดึงผลสอบทุกคน (สำหรับครู) — ต้องอยู่ก่อน /:id
router.get('/results/all', async (req, res) => {
    try {
        const query = `
            SELECT qr.id, qr.student_id, qr.quiz_id, qr.selected_answer, qr.is_correct,
                   s.firstname, s.lastname,
                   q.question, q.answer AS correct_answer, q.lesson_id,
                   l.title AS lesson_title
            FROM quiz_results qr
            JOIN students s ON qr.student_id = s.id
            JOIN quizzes q ON qr.quiz_id = q.id
            JOIN lessons l ON q.lesson_id = l.id
            ORDER BY l.title, s.firstname
        `;
        const results = await req.conn.query(query);
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching all results:', error.message);
        res.status(500).json({ message: 'Error fetching results', error: error.message });
    }
});

// GET /quizzes/lesson/:lessonId  ← ต้องอยู่ก่อน /:id
router.get('/lesson/:lessonId', async (req, res) => {
    try {
        let lessonId = req.params.lessonId;
        const result = await req.conn.query('SELECT * FROM quizzes WHERE lesson_id = ?', [lessonId]);
        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
    }
});

// GET /quizzes/results/:studentId  ← ต้องอยู่ก่อน /:id
router.get('/results/:studentId', async (req, res) => {
    try {
        let studentId = req.params.studentId;
        const query = `
            SELECT qr.*, q.question, q.answer AS correct_answer, l.title AS lesson_title
            FROM quiz_results qr
            JOIN quizzes q ON qr.quiz_id = q.id
            JOIN lessons l ON q.lesson_id = l.id
            WHERE qr.student_id = ?
        `;
        const results = await req.conn.query(query, [studentId]);
        res.json(results[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching results', error: error.message });
    }
});

// GET /quizzes/:id
router.get('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('SELECT * FROM quizzes WHERE id = ?', [id]);
        if (result[0].length == 0) throw { statuscode: 404, message: 'Quiz not found' };
        res.json(result[0][0]);
    } catch (error) {
        let statusCode = error.statuscode || 500;
        res.status(statusCode).json({ message: 'Error fetching quiz', error: error.message });
    }
});

// POST /quizzes
router.post('/', async (req, res) => {
    try {
        let quiz = req.body;
        const errors = validateQuiz(quiz);
        if (errors.length > 0) throw { message: 'กรุณากรอกข้อมูลให้ครบถ้วน', errors: errors }
        const result = await req.conn.query('INSERT INTO quizzes SET ?', quiz);
        res.json({ message: 'Quiz added successfully', data: { data: result[0] } });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error adding quiz', errors: error.errors || [] });
    }
});

// POST /quizzes/submit  ← ต้องอยู่ก่อน PUT /:id
router.post('/submit', async (req, res) => {
    try {
        let { student_id, quiz_id, selected_answer } = req.body;
        const quizResult = await req.conn.query('SELECT answer FROM quizzes WHERE id = ?', [quiz_id]);
        if (quizResult[0].length == 0) throw { message: 'ไม่พบข้อสอบ' };

        let correctAnswer = quizResult[0][0].answer;
        let isCorrect = selected_answer === correctAnswer;

        await req.conn.query('INSERT INTO quiz_results SET ?', {
            student_id, quiz_id, selected_answer, is_correct: isCorrect
        });

        res.json({ message: 'บันทึกคำตอบสำเร็จ', is_correct: isCorrect, correct_answer: correctAnswer });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'ทำข้อสอบข้อนี้ไปแล้ว' });
        res.status(500).json({ message: 'Error submitting quiz', error: error.message });
    }
});

// PUT /quizzes/:id
router.put('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('UPDATE quizzes SET ? WHERE id = ?', [req.body, id]);
        if (result[0].affectedRows == 0) throw { statuscode: 404, message: 'Quiz not found' };
        res.json({ message: 'Quiz updated successfully', data: result[0] });
    } catch (error) {
        let statusCode = error.statuscode || 500;
        res.status(statusCode).json({ message: 'Error updating quiz', error: error.message });
    }
});

// DELETE /quizzes/results/student/:studentId/lesson/:lessonId
router.delete('/results/student/:studentId/lesson/:lessonId', async (req, res) => {
    try {
        let { studentId, lessonId } = req.params;
        const query = `
            DELETE qr FROM quiz_results qr
            JOIN quizzes q ON qr.quiz_id = q.id
            WHERE qr.student_id = ? AND q.lesson_id = ?
        `;
        const result = await req.conn.query(query, [studentId, lessonId]);
        res.json({ message: 'ลบคำตอบสำเร็จ', affectedRows: result[0].affectedRows });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting results', error: error.message });
    }
});

// DELETE /quizzes/:id
router.delete('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('DELETE FROM quizzes WHERE id = ?', id);
        if (result[0].affectedRows == 0) return res.status(404).json({ message: 'Quiz not found' });
        res.json({ message: 'Quiz deleted successfully', id: id });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting quiz', error: error.message });
    }
});

module.exports = router;