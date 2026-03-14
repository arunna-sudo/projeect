const express = require('express');
const router = express.Router();

// validateLesson สำหรับตรวจสอบข้อมูลบทเรียน
const validateLesson = (lessonData) => {
    let errors = [];
    if (!lessonData.course_id) {
        errors.push('กรุณาระบุคอร์ส');
    }
    if (!lessonData.title) {
        errors.push('กรุณากรอกชื่อบทเรียน');
    }
    if (!lessonData.order_number) {
        errors.push('กรุณาระบุลำดับบทเรียน');
    }
    return errors;
}

// path = GET /lessons สำหรับดึงข้อมูลบทเรียนทั้งหมด
router.get('/', async (req, res) => {
    const results = await req.conn.query('SELECT * FROM lessons');
    res.json(results[0]);
});

// path = GET /lessons/:id สำหรับดึงข้อมูลบทเรียนที่มี id ตรงกับ :id
router.get('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('SELECT * FROM lessons WHERE id = ?', [id]);
        if (result[0].length == 0) {
            throw { statuscode: 404, message: 'Lesson not found' };
        }
        res.json(result[0][0]);
    } catch (error) {
        console.error('Error fetching lesson:', error.message);
        let statusCode = error.statuscode || 500;
        res.status(statusCode).json({
            message: 'Error fetching lesson',
            error: error.message
        });
    }
});

// path = POST /lessons สำหรับเพิ่มบทเรียนใหม่
router.post('/', async (req, res) => {
    try {
        let lesson = req.body;
        const errors = validateLesson(lesson);
        if (errors.length > 0) {
            throw {
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
                errors: errors
            }
        }
        const result = await req.conn.query('INSERT INTO lessons SET ?', lesson);
        res.json({
            message: 'Lesson added successfully',
            data: {
                data: result[0]
            }
        });
    } catch (error) {
        const errorMessage = error.message || 'Error adding lesson';
        const errors = error.errors || [];
        console.error('Error adding lesson:', error.message);
        res.status(500).json({
            message: errorMessage,
            errors: errors
        });
    }
});

// path = PUT /lessons/:id สำหรับอัปเดตข้อมูลบทเรียนที่มี id ตรงกับ :id
router.put('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('UPDATE lessons SET ? WHERE id = ?', [req.body, id]);
        if (result[0].affectedRows == 0) {
            throw { statuscode: 404, message: 'Lesson not found' };
        }
        res.json({
            message: 'Lesson updated successfully',
            data: result[0]
        });
    } catch (error) {
        console.error('Error updating lesson:', error.message);
        let statusCode = error.statuscode || 500;
        res.status(statusCode).json({
            message: 'Error updating lesson',
            error: error.message
        });
    }
});

// path = DELETE /lessons/:id สำหรับลบบทเรียนที่มี id ตรงกับ :id
router.delete('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await req.conn.query('DELETE FROM lessons WHERE id = ?', id);
        if (result[0].affectedRows == 0) {
            return res.status(404).json({
                message: 'Lesson not found'
            });
        }
        res.json({
            message: 'Lesson deleted successfully',
            id: id
        });
    } catch (error) {
        console.error('Error deleting lesson:', error.message);
        res.status(500).json({
            message: 'Error deleting lesson',
            error: error.message
        });
    }
});

module.exports = router;