const express = require('express');
const router = express.Router();

const validateEnrollment = (data) => {
    let errors = [];
    if (!data.student_id) errors.push('กรุณาระบุรหัสผู้เรียน');
    if (!data.course_id)  errors.push('กรุณาระบุรหัสคอร์สเรียน');
    return errors;
}

// GET /enrollments — ดึงทั้งหมด
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT e.id, e.student_id, e.course_id, e.enrolled_at, e.status,
                   s.firstname, s.lastname,
                   c.title AS course_title
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN courses c  ON e.course_id  = c.id
        `;
        const results = await req.conn.query(query);
        res.json(results[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching enrollments', error: error.message });
    }
});

// POST /enrollments — นักเรียนขอลงทะเบียน (status = pending)
router.post('/', async (req, res) => {
    try {
        let enrollment = {
            student_id: req.body.student_id,
            course_id:  req.body.course_id,
            status:     'pending'
        };

        const errors = validateEnrollment(enrollment);
        if (errors.length > 0) {
            throw { message: 'ข้อมูลไม่ครบถ้วน', errors };
        }

        const result = await req.conn.query('INSERT INTO enrollments SET ?', enrollment);
        res.json({ message: 'ส่งคำขอลงทะเบียนสำเร็จ รอครูอนุมัติ', data: result[0] });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'คุณส่งคำขอลงทะเบียนคอร์สนี้ไปแล้ว' });
        }
        res.status(500).json({ message: error.message || 'Error adding enrollment' });
    }
});

// PUT /enrollments/:id/approve — ครูอนุมัติ
router.put('/:id/approve', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await req.conn.query(
            "UPDATE enrollments SET status = 'approved' WHERE id = ?", [id]
        );
        if (result[0].affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการลงทะเบียน' });
        }
        res.json({ message: 'อนุมัติการลงทะเบียนสำเร็จ' });
    } catch (error) {
        res.status(500).json({ message: 'Error approving enrollment', error: error.message });
    }
});

// PUT /enrollments/:id/reject — ครูปฏิเสธ
router.put('/:id/reject', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await req.conn.query(
            "UPDATE enrollments SET status = 'rejected' WHERE id = ?", [id]
        );
        if (result[0].affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการลงทะเบียน' });
        }
        res.json({ message: 'ปฏิเสธการลงทะเบียนแล้ว' });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting enrollment', error: error.message });
    }
});

// DELETE /enrollments/:id — ยกเลิก
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await req.conn.query('DELETE FROM enrollments WHERE id = ?', id);
        if (result[0].affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการลงทะเบียน' });
        }
        res.json({ message: 'ยกเลิกการลงทะเบียนสำเร็จ', id });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting enrollment', error: error.message });
    }
});

module.exports = router;