const express = require('express');
const router = express.Router();

// ฟังก์ชันสำหรับตรวจสอบข้อมูลผู้เรียน
const validateStudent = (studentData) => {
    let errors = [];
    if (!studentData.firstname) {
        errors.push('กรุณากรอกชื่อ');
    }
    if (!studentData.lastname) {
        errors.push('กรุณากรอกนามสกุล');
    }
    if (!studentData.email) {
        errors.push('กรุณากรอกอีเมล');
    }
    // ตัวอย่างการตรวจสอบรูปแบบอีเมลง่ายๆ (เพิ่มได้ตามต้องการ)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (studentData.email && !emailRegex.test(studentData.email)) {
        errors.push('รูปแบบอีเมลไม่ถูกต้อง');
    }
    return errors;
}

// GET /students - ดึงข้อมูลผู้เรียนทั้งหมด
router.get('/', async (req, res) => {
    try {
        const results = await req.conn.query('SELECT * FROM students');
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching students:', error.message);
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
});

// GET /students/:id - ดึงข้อมูลผู้เรียนตาม ID
router.get('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('SELECT * FROM students WHERE id = ?', [id]);
        if (result[0].length == 0) {
            throw { statuscode: 404, message: 'Student not found' };
        }
        res.json(result[0][0]);
    } catch (error) {
        console.error('Error fetching student:', error.message);
        let statusCode = error.statuscode || 500;
        res.status(statusCode).json({
            message: 'Error fetching student',
            error: error.message
        });
    }
});

// POST /students - เพิ่มข้อมูลผู้เรียนใหม่
router.post('/', async (req, res) => {
    try {
        let student = req.body;
        const errors = validateStudent(student);
        if (errors.length > 0) {
            throw {
                message: 'กรุณากรอกข้อมูลให้ถูกต้องและครบถ้วน',
                errors: errors
            }
        }
        const result = await req.conn.query('INSERT INTO students SET ?', student);
        res.json({
            message: 'Student added successfully',
            data: {
                data: result[0]
            }
        });
    } catch (error) {
        const errorMessage = error.message || 'Error adding student';
        const errors = error.errors || [];
        console.error('Error adding student:', error.message);
        // เช็คว่า error เกิดจากอีเมลซ้ำหรือไม่ (เนื่องจากตั้ง UNIQUE ไว้ใน DB)
        if (error.code === 'ER_DUP_ENTRY') {
             res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว', errors: ['อีเมลนี้ถูกใช้งานแล้ว'] });
             return;
        }
        res.status(500).json({
            message: errorMessage,
            errors: errors
        });
    }
});

// PUT /students/:id - อัปเดตข้อมูลผู้เรียน
router.put('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('UPDATE students SET ? WHERE id = ?', [req.body, id]);
        if (result[0].affectedRows == 0) {
            throw { statuscode: 404, message: 'Student not found' };
        }
        res.json({
            message: 'Student updated successfully',
            data: result[0]
        });
    } catch (error) {
        console.error('Error updating student:', error.message);
        let statusCode = error.statuscode || 500;
        res.status(statusCode).json({
            message: 'Error updating student',
            error: error.message
        });
    }
});

// DELETE /students/:id - ลบข้อมูลผู้เรียน
router.delete('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('DELETE FROM students WHERE id = ?', id);
        if (result[0].affectedRows == 0) {
            return res.status(404).json({
                message: 'Student not found'
            });
        }
        res.json({
            message: 'Student deleted successfully',
            id: id
        });
    } catch (error) {
        console.error('Error deleting student:', error.message);
        res.status(500).json({
            message: 'Error deleting student',
            error: error.message
        });
    }
});

module.exports = router;