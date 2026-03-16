const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = 8000;

app.use(bodyParser.json());
app.use(cors());


let conn = null;

const initMySQL = async () => {
    conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'webdb',
        port: 8820
    });
}

// เชื่อม conn ไปให้ทุก route ใช้ได้ 
app.use((req, res, next) => {
    req.conn = conn;
    next();
});

// import routes 
const instructorRoutes = require('./routes/instructors');
app.use('/instructors', instructorRoutes);

const lessonRoutes = require('./routes/lessons');
app.use('/lessons', lessonRoutes);

const studentRoutes = require('./routes/students');
app.use('/students', studentRoutes);

const enrollmentRoutes = require('./routes/enrollments');
app.use('/enrollments', enrollmentRoutes);

const progressRoutes = require('./routes/progress');
app.use('/progress', progressRoutes);

const quizRoutes = require('./routes/quizzes');
app.use('/quizzes', quizRoutes);


// validateData 
const validateData = (courseData) => {
    let errors = [];
    if (!courseData.title) {
        errors.push('กรุณากรอกชื่อคอร์ส');
    }
    if (!courseData.description) {
        errors.push('กรุณากรอกรายละเอียด');
    }
    if (!courseData.instructor_id) {
        errors.push('กรุณาเลือกผู้สอน');
    }
    return errors;
}

// path = GET /courses สำหรับดึงข้อมูลคอร์สทั้งหมด
app.get('/courses', async (req, res) => {
    const results = await conn.query('SELECT * FROM courses');
    res.json(results[0]);
});

// path = GET /courses/:id สำหรับดึงข้อมูลคอร์สที่มี id ตรงกับ :id
app.get('/courses/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await conn.query('SELECT * FROM courses WHERE id = ?', [id]);
        if (result[0].length == 0) {
            throw { statuscode: 404, message: 'Course not found' };
        }
        res.json(result[0][0]);
    } catch (error) {
        console.error('Error fetching course:', error.message);
        let statusCode = error.statuscode || 500;
        res.status(statusCode).json({
            message: 'Error fetching course',
            error: error.message
        });
    }
});

// path = POST /courses สำหรับเพิ่มคอร์สใหม่
app.post('/courses', async (req, res) => {
    try {
        let course = req.body;
        const errors = validateData(course);
        if (errors.length > 0) {
            throw {
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
                errors: errors
            }
        }
        const result = await conn.query('INSERT INTO courses SET ?', course);
        res.json({
            message: 'Course added successfully',
            data: {
                data: result[0]
            }
        });
    } catch (error) {
        const errorMessage = error.message || 'Error adding course';
        const errors = error.errors || [];
        console.error('Error adding course:', error.message);
        res.status(500).json({
            message: errorMessage,
            errors: errors
        });
    }
});

// path = PUT /courses/:id สำหรับอัปเดตข้อมูลคอร์สที่มี id ตรงกับ :id
app.put('/courses/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await conn.query('UPDATE courses SET ? WHERE id = ?', [req.body, id]);
        if (result[0].affectedRows == 0) {
            throw { statuscode: 404, message: 'Course not found' };
        }
        res.json({
            message: 'Course updated successfully',
            data: result[0]
        });
    } catch (error) {
        console.error('Error updating course:', error.message);
        let statusCode = error.statuscode || 500;
        res.status(statusCode).json({
            message: 'Error updating course',
            error: error.message
        });
    }
});

// path = DELETE /courses/:id สำหรับลบคอร์สที่มี id ตรงกับ :id (แบบลบข้อมูลที่เกี่ยวข้องทั้งหมด)

app.delete('/courses/:id', async (req, res) => {
    try {
        let courseId = req.params.id;

        // 1. ลบประวัติการเรียน (progress) ที่ผูกกับบทเรียนในคอร์สนี้
        await req.conn.query(`
            DELETE p FROM progress p 
            JOIN lessons l ON p.lesson_id = l.id 
            WHERE l.course_id = ?
        `, [courseId]);

        // 2. ลบผลสอบและข้อสอบ (quizzes & quiz_results) ที่ผูกกับบทเรียนในคอร์สนี้
        await req.conn.query(`
            DELETE qr FROM quiz_results qr
            JOIN quizzes q ON qr.quiz_id = q.id
            JOIN lessons l ON q.lesson_id = l.id
            WHERE l.course_id = ?
        `, [courseId]);

        await req.conn.query(`
            DELETE q FROM quizzes q
            JOIN lessons l ON q.lesson_id = l.id
            WHERE l.course_id = ?
        `, [courseId]);

        // 3. ลบบทเรียน (lessons) ในคอร์สนี้
        await req.conn.query('DELETE FROM lessons WHERE course_id = ?', [courseId]);

        // 4. ลบการลงทะเบียน (enrollments) ในคอร์สนี้
        await req.conn.query('DELETE FROM enrollments WHERE course_id = ?', [courseId]);

        // 5. ลบตัวคอร์สเรียน (courses) สุดท้าย
        const result = await req.conn.query('DELETE FROM courses WHERE id = ?', [courseId]);

        if (result[0].affectedRows == 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลคอร์สเรียน' });
        }

        res.json({ message: 'ลบคอร์สและข้อมูลที่เกี่ยวข้องสำเร็จ' });

    } catch (error) {
        console.error('Error deleting course cascade:', error.message);
        res.status(500).json({ message: 'Error deleting course', error: error.message });
    }
});

// path = POST /login สำหรับเข้าสู่ระบบ

app.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;

        // 1. เช็คใน users ก่อน (สำหรับครูหลัก)
        const userResult = await conn.query(
            'SELECT * FROM users WHERE email = ? AND password = ?',
            [email, password]
        );

        // 2. ถ้าเจอใน users และเป็นครู
        if (userResult[0].length > 0 && userResult[0][0].role === 'teacher') {
            let user = userResult[0][0];
            return res.json({
                message: 'เข้าสู่ระบบสำเร็จ',
                user: {
                    id: user.id,
                    email: user.email,
                    role: 'teacher',
                    student_id: null
                }
            });
        }

        // 3. password ต้องเป็น 1234 เท่านั้น
        if (password !== '1234') {
            throw { statuscode: 401, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
        }

        // 4. เช็คใน instructors — ครูใหม่ที่เพิ่มในระบบ
        const instructorResult = await conn.query(
            'SELECT * FROM instructors WHERE email = ?', [email]
        );
        if (instructorResult[0].length > 0) {
            let instructor = instructorResult[0][0];
            return res.json({
                message: 'เข้าสู่ระบบสำเร็จ',
                user: {
                    id: instructor.id,
                    email: instructor.email,
                    role: 'teacher',
                    student_id: null
                }
            });
        }

        // 5. เช็คใน students
        const studentResult = await conn.query(
            'SELECT * FROM students WHERE email = ?', [email]
        );
        if (studentResult[0].length == 0) {
            throw { statuscode: 401, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
        }

        let student = studentResult[0][0];
        return res.json({
            message: 'เข้าสู่ระบบสำเร็จ',
            user: {
                id: student.id,
                email: student.email,
                role: 'student',
                student_id: student.id // ← ใช้ id จาก students โดยตรง
            }
        });

    } catch (error) {
        console.error('Error login:', error.message);
        let statusCode = error.statuscode || 500;
        res.status(statusCode).json({
            message: error.message || 'Error login'
        });
    }
});




app.listen(port, async () => {
    try {
        await initMySQL();
        console.log(`Server is running on port ${port}`);
    } catch (err) {
        console.error('MySQL Connection Failed:', err.message);
    }
});