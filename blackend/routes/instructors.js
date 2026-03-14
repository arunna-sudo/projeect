const express = require('express');
const router = express.Router();

// validateInstructor สำหรับตรวจสอบข้อมูลผู้สอน
const validateInstructor = (instructorData) => {
    let errors = [];
    if (!instructorData.firstname) {
        errors.push('กรุณากรอกชื่อ');
    }
    if (!instructorData.lastname) {
        errors.push('กรุณากรอกนามสกุล');
    }
    if (!instructorData.email) {
        errors.push('กรุณากรอกอีเมล');
    }
    return errors;
}

// path = GET /instructors สำหรับดึงข้อมูลผู้สอนทั้งหมด
router.get('/', async (req, res) => {
    const results = await req.conn.query('SELECT * FROM instructors');
    res.json(results[0]);
});

// path = GET /instructors/:id สำหรับดึงข้อมูลผู้สอนที่มี id ตรงกับ :id
router.get('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('SELECT * FROM instructors WHERE id = ?', [id]);
        if (result[0].length == 0) {
            throw { statuscode: 404, message: 'Instructor not found' };
        }
        res.json(result[0][0]);
    } catch (error) {
        console.error('Error fetching instructor:', error.message);
        let statusCode = error.statuscode || 500;
        res.status(statusCode).json({
            message: 'Error fetching instructor',
            error: error.message
        });
    }
});

// path = POST /instructors สำหรับเพิ่มผู้สอนใหม่
router.post('/', async (req, res) => {
    try {
        let instructor = req.body;
        const errors = validateInstructor(instructor);
        if (errors.length > 0) {
            throw {
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
                errors: errors
            }
        }
        const result = await req.conn.query('INSERT INTO instructors SET ?', instructor);
        res.json({
            message: 'Instructor added successfully',
            data: {
                data: result[0]
            }
        });
    } catch (error) {
        const errorMessage = error.message || 'Error adding instructor';
        const errors = error.errors || [];
        console.error('Error adding instructor:', error.message);
        res.status(500).json({
            message: errorMessage,
            errors: errors
        });
    }
});

// path = PUT /instructors/:id สำหรับอัปเดตข้อมูลผู้สอนที่มี id ตรงกับ :id
router.put('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('UPDATE instructors SET ? WHERE id = ?', [req.body, id]);
        if (result[0].affectedRows == 0) {
            throw { statuscode: 404, message: 'Instructor not found' };
        }
        res.json({
            message: 'Instructor updated successfully',
            data: result[0]
        });
    } catch (error) {
        console.error('Error updating instructor:', error.message);
        let statusCode = error.statuscode || 500;
        res.status(statusCode).json({
            message: 'Error updating instructor',
            error: error.message
        });
    }
});

// path = DELETE /instructors/:id สำหรับลบผู้สอนที่มี id ตรงกับ :id
router.delete('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('DELETE FROM instructors WHERE id = ?', id);
        if (result[0].affectedRows == 0) {
            return res.status(404).json({
                message: 'Instructor not found'
            });
        }
        res.json({
            message: 'Instructor deleted successfully',
            id: id
        });
    } catch (error) {
        console.error('Error deleting instructor:', error.message);
        res.status(500).json({
            message: 'Error deleting instructor',
            error: error.message
        });
    }
});

module.exports = router;