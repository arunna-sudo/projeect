const express = require('express');
const router = express.Router();

// ฟังก์ชันตรวจสอบข้อมูลเบื้องต้น
const validateProgress = (data) => {
    let errors = [];
    if (!data.student_id) {
        errors.push('กรุณาระบุรหัสผู้เรียน');
    }
    if (!data.lesson_id) {
        errors.push('กรุณาระบุรหัสบทเรียน');
    }
    return errors;
}

// GET /progress - ดึงข้อมูลความคืบหน้าทั้งหมด พร้อมชื่อผู้เรียนและชื่อบทเรียน
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.student_id, p.lesson_id, p.is_completed, p.completed_at,
                   s.firstname, s.lastname,
                   l.title AS lesson_title
            FROM progress p
            JOIN students s ON p.student_id = s.id
            JOIN lessons l ON p.lesson_id = l.id
        `;
        const results = await req.conn.query(query);
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching progress:', error.message);
        res.status(500).json({ message: 'Error fetching progress', error: error.message });
    }
});

// POST /progress - สร้างประวัติการเรียน (กดเริ่มเรียน)
router.post('/', async (req, res) => {
    try {
        let progressData = {
            student_id: req.body.student_id,
            lesson_id: req.body.lesson_id,
            is_completed: req.body.is_completed || false, 
            completed_at: req.body.is_completed ? new Date() : null
        };
        
        const errors = validateProgress(progressData);
        if (errors.length > 0) {
            throw { message: 'ข้อมูลไม่ครบถ้วน', errors: errors };
        }

        const result = await req.conn.query('INSERT INTO progress SET ?', progressData);
        res.json({
            message: 'บันทึกประวัติการเรียนสำเร็จ',
            data: result[0]
        });
    } catch (error) {
        // ดักจับ error กรณีมีข้อมูลการเรียนบทนี้อยู่แล้ว
        if (error.code === 'ER_DUP_ENTRY') {
             res.status(400).json({ message: 'มีประวัติการเรียนบทเรียนนี้แล้ว', errors: ['ข้อมูลซ้ำ'] });
             return;
        }
        res.status(500).json({ message: 'Error adding progress', error: error.message });
    }
});

// PUT /progress/:id - อัปเดตสถานะ (เช่น กดปุ่ม "เรียนจบแล้ว")
router.put('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        
        // ถ้าส่ง is_completed มาเป็น true ให้บันทึกเวลาปัจจุบันด้วย
        let updateData = {
            is_completed: req.body.is_completed,
            completed_at: req.body.is_completed ? new Date() : null
        };

        const result = await req.conn.query('UPDATE progress SET ? WHERE id = ?', [updateData, id]);
        
        if (result[0].affectedRows == 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลประวัติการเรียน' });
        }
        
        res.json({
            message: 'อัปเดตสถานะการเรียนสำเร็จ',
            data: updateData
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating progress', error: error.message });
    }
});
// DELETE /progress/:id - ลบประวัติการเรียนที่กดผิด
router.delete('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('DELETE FROM progress WHERE id = ?', id);
        if (result[0].affectedRows == 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลประวัติการเรียน' });
        }
        res.json({ message: 'ลบประวัติการเรียนสำเร็จ', id: id });
    } catch (error) {
        console.error('Error deleting progress:', error.message);
        res.status(500).json({ message: 'Error deleting progress', error: error.message });
    }
});
module.exports = router;