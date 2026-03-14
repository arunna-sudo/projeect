const express = require('express');
const router = express.Router();

// ฟังก์ชันตรวจสอบข้อมูลการลงทะเบียน
const validateEnrollment = (data) => {
    let errors = [];
    if (!data.student_id) {
        errors.push('กรุณาระบุรหัสผู้เรียน');
    }
    if (!data.course_id) {
        errors.push('กรุณาระบุรหัสคอร์สเรียน');
    }
    return errors;
}

// GET /enrollments - ดึงข้อมูลการลงทะเบียนทั้งหมด พร้อมชื่อนักเรียนและชื่อคอร์ส
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT e.id, e.student_id, e.course_id, e.enrolled_at, 
                   s.firstname, s.lastname, 
                   c.title AS course_title
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN courses c ON e.course_id = c.id
        `;
        const results = await req.conn.query(query);
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching enrollments:', error.message);
        res.status(500).json({ message: 'Error fetching enrollments', error: error.message });
    }
});

// POST /enrollments - ลงทะเบียนเรียนใหม่
router.post('/', async (req, res) => {
    try {
        let enrollment = {
            student_id: req.body.student_id,
            course_id: req.body.course_id
        };
        
        const errors = validateEnrollment(enrollment);
        if (errors.length > 0) {
            throw { message: 'ข้อมูลไม่ครบถ้วน', errors: errors };
        }

        const result = await req.conn.query('INSERT INTO enrollments SET ?', enrollment);
        res.json({
            message: 'ลงทะเบียนเรียนสำเร็จ',
            data: result[0]
        });
    } catch (error) {
        console.error('Error adding enrollment:', error.message);
        // ดักจับ error กรณีลงทะเบียนคอร์สเดิมซ้ำ (UNIQUE KEY ที่เราตั้งไว้ทำงาน)
        if (error.code === 'ER_DUP_ENTRY') {
             res.status(400).json({ message: 'ผู้เรียนคนนี้ลงทะเบียนคอร์สนี้ไปแล้ว', errors: ['ลงทะเบียนซ้ำ'] });
             return;
        }
        res.status(500).json({ message: 'Error adding enrollment', error: error.message });
    }
});

// DELETE /enrollments/:id - ยกเลิกการลงทะเบียน
router.delete('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('DELETE FROM enrollments WHERE id = ?', id);
        if (result[0].affectedRows == 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการลงทะเบียน' });
        }
        res.json({ message: 'ยกเลิกการลงทะเบียนสำเร็จ', id: id });
    } catch (error) {
        console.error('Error deleting enrollment:', error.message);
        res.status(500).json({ message: 'Error deleting enrollment', error: error.message });
    }
});

module.exports = router;