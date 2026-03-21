const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    let user = JSON.parse(localStorage.getItem('user'));
    await loadAllCourses(user.student_id);
}

const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = null;
    if (url.includes('youtube.com/watch?v=')) videoId = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/'))       videoId = url.split('youtu.be/')[1].split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

const loadAllCourses = async (studentId) => {
    try {
        const [courseRes, enrollRes, lessonRes] = await Promise.all([
            axios.get(`${BASE_URL}/courses`),
            axios.get(`${BASE_URL}/enrollments`),
            axios.get(`${BASE_URL}/lessons`)
        ]);

        const allCourses   = courseRes.data;
        const myEnrollments = enrollRes.data.filter(e => e.student_id === studentId);
        const allLessons   = lessonRes.data;

        // map course_id → enrollment (เพื่อเช็ค status)
        const enrollMap = {};
        for (let e of myEnrollments) enrollMap[e.course_id] = e;

        let approvedHTML = '';
        let pendingHTML  = '';
        let availableHTML = '';

        for (let course of allCourses) {
            const enroll = enrollMap[course.id];

            if (enroll && enroll.status === 'approved') {
                // ลงทะเบียนและอนุมัติแล้ว — แสดงบทเรียน
                const lessons = allLessons
                    .filter(l => l.course_id === course.id)
                    .sort((a, b) => a.order_number - b.order_number);

                let lessonsHTML = lessons.length === 0
                    ? `<div class="lesson-item" style="color:var(--text-3);">ยังไม่มีบทเรียน</div>`
                    : lessons.map(lesson => {
                        let badges = '';
                        if (lesson.video_url) badges += '<span style="" class="s-badge-video">🎬 วิดีโอ</span>';
                        if (lesson.file_url)  badges += '<span style="" class="s-badge-pdf">📄 PDF</span>';

                        const enc = encodeURIComponent(JSON.stringify({
                            title: lesson.title, content: lesson.content || '',
                            video_url: lesson.video_url || '', file_url: lesson.file_url || ''
                        }));

                        return `<div class="lesson-item">
                            <div><strong>บทที่ ${lesson.order_number}: ${lesson.title}</strong>${badges}</div>
                            <button class="btn-view" onclick="openLesson('${enc}')">📖 ดูเนื้อหา</button>
                        </div>`;
                    }).join('');

                approvedHTML += `<div class="course-section">
                    <div class="course-section-header">
                        📚 ${course.title}
                        <span style="font-size:12px; font-weight:400; opacity:0.85; margin-left:8px;">✅ ลงทะเบียนแล้ว</span>
                    </div>
                    ${lessonsHTML}
                </div>`;

            } else if (enroll && enroll.status === 'pending') {
                // รออนุมัติ
                pendingHTML += `<div class="data-item">
                    <div>
                        <strong>${course.title}</strong>
                        <span style="background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:12px;font-size:12px;margin-left:8px;">⏳ รอครูอนุมัติ</span>
                    </div>
                </div>`;

            } else if (enroll && enroll.status === 'rejected') {
                // ถูกปฏิเสธ
                availableHTML += `<div class="data-item">
                    <div>
                        <strong>${course.title}</strong>
                        <span style="background:#fee2e2;color:#991b1b;padding:2px 10px;border-radius:12px;font-size:12px;margin-left:8px;">❌ ถูกปฏิเสธ</span>
                    </div>
                    <button class="btn-enroll" onclick="enrollCourse(${course.id}, this)">
                        ➕ ขอลงทะเบียนใหม่
                    </button>
                </div>`;

            } else {
                // ยังไม่ได้ขอเลย
                availableHTML += `<div class="data-item">
                    <div>
                        <strong>${course.title}</strong>
                        <span style="color:var(--text-3); font-size:13px; margin-left:8px;">
                            ${course.description ? course.description.substring(0, 50) + '...' : ''}
                        </span>
                    </div>
                    <button class="btn-enroll" onclick="enrollCourse(${course.id}, this)">
                        ➕ ขอลงทะเบียน
                    </button>
                </div>`;
            }
        }

        let html = '';

        if (approvedHTML) {
            html += `<div class="s-section-heading">📚 คอร์สของฉัน</div>${approvedHTML}`;
        }

        if (pendingHTML) {
            html += `<div class="content-box" style="margin-top:20px;">
                <div class="s-section-heading">⏳ รอการอนุมัติจากครู</div>
                ${pendingHTML}
            </div>`;
        }

        if (availableHTML) {
            html += `<div class="content-box" style="margin-top:20px;">
                <div class="s-section-heading">🔍 คอร์สที่เปิดรับสมัคร</div>
                ${availableHTML}
            </div>`;
        }

        if (!html) html = `<div class="s-empty"><span class="s-empty-icon">📭</span><div class="s-empty-title">ยังไม่มีคอร์สในระบบ</div><p class="s-empty-sub">รอครูเพิ่มคอร์สก่อนนะครับ</p></div>`;

        document.getElementById('my-courses').innerHTML = html;

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('my-courses').innerHTML =
            `<div class="s-empty"><span class="s-empty-icon">⚠️</span><div class="s-empty-title">ไม่สามารถโหลดข้อมูลได้</div><p class="s-empty-sub">กรุณาลองใหม่อีกครั้ง</p></div>`;
    }
}

const enrollCourse = async (courseId, btn) => {
    let user = JSON.parse(localStorage.getItem('user'));
    btn.disabled = true;
    btn.innerText = 'กำลังส่งคำขอ...';

    try {
        await axios.post(`${BASE_URL}/enrollments`, {
            student_id: user.student_id,
            course_id: courseId
        });
        await loadAllCourses(user.student_id);
    } catch (error) {
        btn.disabled = false;
        btn.innerText = '➕ ขอลงทะเบียน';
        alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
}

const openLesson = (encoded) => {
    let lesson = JSON.parse(decodeURIComponent(encoded));
    document.getElementById('modal-title').innerText = '📖 ' + lesson.title;

    let embedUrl = getYouTubeEmbedUrl(lesson.video_url);
    document.getElementById('modal-video').innerHTML = embedUrl
        ? `<div class="video-wrapper"><iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe></div>`
        : '';

    document.getElementById('modal-pdf').innerHTML = lesson.file_url
        ? `<div class="pdf-box">📄 <a href="${lesson.file_url}" target="_blank">คลิกเพื่อเปิดเอกสาร / PDF</a></div>`
        : '';

    document.getElementById('modal-content').innerHTML = lesson.content
        ? `<div class="modal-content-text">${lesson.content}</div>`
        : '<p style="color:rgba(255,255,255,0.35); font-size:14px; padding:12px 0;">ยังไม่มีเนื้อหาข้อความ</p>';

    document.getElementById('lesson-modal').classList.add('active');
}

const closeModal = () => {
    document.getElementById('lesson-modal').classList.remove('active');
    document.getElementById('modal-video').innerHTML = '';
}

window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('lesson-modal')) closeModal();
});