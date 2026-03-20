const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    await loadStudents();
    await loadCourses();
    await loadEnrollments();
}

const loadStudents = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/students`);
        let dom = document.querySelector('select[name=student_id]');
        for (let s of response.data) {
            dom.innerHTML += `<option value="${s.id}">${s.firstname} ${s.lastname}</option>`;
        }
    } catch (error) { console.error(error); }
}

const loadCourses = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/courses`);
        let dom = document.querySelector('select[name=course_id]');
        for (let c of response.data) {
            dom.innerHTML += `<option value="${c.id}">${c.title}</option>`;
        }
    } catch (error) { console.error(error); }
}

const loadEnrollments = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/enrollments`);
        const enrollmentDOM = document.getElementById('enrollment-data');
        const data = response.data;

        // แยก pending ออกมาก่อน
        const pending  = data.filter(e => e.status === 'pending');
        const approved = data.filter(e => e.status === 'approved');
        const rejected = data.filter(e => e.status === 'rejected');

        let html = '';

        // รอการอนุมัติ
        if (pending.length > 0) {
            html += `<div style="margin-bottom:16px;">
                <p style="font-size:13px; font-weight:600; color:var(--c-amber-600,#d97706); margin-bottom:8px;">
                    ⏳ รอการอนุมัติ (${pending.length} รายการ)
                </p>`;
            for (let e of pending) {
                html += `<div class="enrollment-item" style="border-left-color: #f59e0b;">
                    <div>
                        <strong>${e.firstname} ${e.lastname}</strong>
                        ขอลงเรียน <strong>${e.course_title}</strong>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="btn-approve" onclick="approveEnrollment(${e.id})">✅ อนุมัติ</button>
                        <button class="btn-reject"  onclick="rejectEnrollment(${e.id})">❌ ปฏิเสธ</button>
                    </div>
                </div>`;
            }
            html += `</div>`;
        }

        // อนุมัติแล้ว
        if (approved.length > 0) {
            html += `<p style="font-size:13px; font-weight:600; color:var(--c-emerald-600,#059669); margin-bottom:8px;">
                ✅ อนุมัติแล้ว (${approved.length} รายการ)
            </p>`;
            for (let e of approved) {
                html += `<div class="enrollment-item">
                    <div>
                        <strong>${e.firstname} ${e.lastname}</strong> — ${e.course_title}
                        <br><small>วันที่: ${new Date(e.enrolled_at).toLocaleString('th-TH')}</small>
                    </div>
                    <button class="delete btn-cancel" data-id="${e.id}">🗑️ ยกเลิก</button>
                </div>`;
            }
        }

        // ปฏิเสธแล้ว
        if (rejected.length > 0) {
            html += `<p style="font-size:13px; font-weight:600; color:var(--c-rose-500,#f43f5e); margin:12px 0 8px;">
                ❌ ปฏิเสธแล้ว (${rejected.length} รายการ)
            </p>`;
            for (let e of rejected) {
                html += `<div class="enrollment-item" style="border-left-color:#f43f5e; opacity:0.7;">
                    <div>
                        <strong>${e.firstname} ${e.lastname}</strong> — ${e.course_title}
                    </div>
                    <button class="delete btn-cancel" data-id="${e.id}">🗑️ ลบ</button>
                </div>`;
            }
        }

        if (!html) {
            html = '<p style="text-align:center; color:gray;">ยังไม่มีข้อมูลการลงทะเบียน</p>';
        }

        enrollmentDOM.innerHTML = html;

        // ผูกปุ่มลบ
        document.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('ต้องการยกเลิกการลงทะเบียนนี้ใช่หรือไม่?')) {
                    await axios.delete(`${BASE_URL}/enrollments/${e.target.dataset.id}`);
                    loadEnrollments();
                }
            });
        });

    } catch (error) { console.error(error); }
}

// ครูอนุมัติ
const approveEnrollment = async (id) => {
    try {
        await axios.put(`${BASE_URL}/enrollments/${id}/approve`);
        loadEnrollments();
    } catch (error) {
        alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
}

// ครูปฏิเสธ
const rejectEnrollment = async (id) => {
    if (!confirm('ต้องการปฏิเสธคำขอนี้ใช่หรือไม่?')) return;
    try {
        await axios.put(`${BASE_URL}/enrollments/${id}/reject`);
        loadEnrollments();
    } catch (error) {
        alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
}

const validateData = (data) => {
    let errors = [];
    if (!data.student_id) errors.push('กรุณาเลือกผู้เรียน');
    if (!data.course_id)  errors.push('กรุณาเลือกคอร์สเรียน');
    return errors;
}

// ครูลงทะเบียนให้นักเรียนเอง (approved ทันที)
const submitData = async () => {
    let studentDOM = document.querySelector('select[name=student_id]');
    let courseDOM  = document.querySelector('select[name=course_id]');
    let messageDOM = document.getElementById('message');

    try {
        let data = { student_id: studentDOM.value, course_id: courseDOM.value };
        const errors = validateData(data);
        if (errors.length > 0) throw { message: 'ข้อมูลไม่ครบถ้วน', errors };

        // ครูลงทะเบียนให้ → approved ทันที
        await axios.post(`${BASE_URL}/enrollments`, data);
        await axios.put(`${BASE_URL}/enrollments/${(await getLastEnrollmentId())}/approve`);

        messageDOM.innerText = 'ลงทะเบียนสำเร็จ!';
        messageDOM.className = 'message success';
        studentDOM.value = '';
        courseDOM.value = '';
        loadEnrollments();

    } catch (error) {
        if (error.response) {
            error.message = error.response.data.message;
            error.errors  = error.response.data.errors || [];
        }
        let html = `<div>${error.message || 'เกิดข้อผิดพลาด'}</div>`;
        if (error.errors?.length) {
            html += '<ul>' + error.errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
        }
        messageDOM.innerHTML = html;
        messageDOM.className = 'message danger';
    }
}

// ดึง enrollment id ล่าสุดของ student+course
const getLastEnrollmentId = async () => {
    const res = await axios.get(`${BASE_URL}/enrollments`);
    const last = res.data[res.data.length - 1];
    return last?.id;
}