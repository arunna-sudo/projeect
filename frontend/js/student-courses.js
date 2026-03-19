const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    let user = JSON.parse(localStorage.getItem('user'));
    await loadMyCoursesWithLessons(user.student_id);
}

// แปลง YouTube URL → embed URL
const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = null;
    if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

const loadMyCoursesWithLessons = async (studentId) => {
    try {
        const [enrollRes, lessonRes] = await Promise.all([
            axios.get(`${BASE_URL}/enrollments`),
            axios.get(`${BASE_URL}/lessons`)
        ]);

        let myEnrollments = enrollRes.data.filter(e => e.student_id === studentId);
        let allLessons = lessonRes.data;
        let htmlData = '';

        if (myEnrollments.length === 0) {
            htmlData = '<p style="text-align:center; color:gray;">ยังไม่ได้ลงทะเบียนคอร์สใดๆ</p>';
        } else {
            for (let enroll of myEnrollments) {
                let courseLessons = allLessons
                    .filter(l => l.course_id === enroll.course_id)
                    .sort((a, b) => a.order_number - b.order_number);

                htmlData += `<div class="course-section">
                    <div class="course-section-header">
                        📚 ${enroll.course_title}
                        <span style="font-size: 13px; font-weight: normal; margin-left: 10px; opacity: 0.85;">
                            ลงทะเบียนเมื่อ ${new Date(enroll.enrolled_at).toLocaleDateString('th-TH')}
                        </span>
                    </div>`;

                if (courseLessons.length === 0) {
                    htmlData += `<div class="lesson-item" style="color: gray; font-size: 14px;">
                        ยังไม่มีบทเรียนในคอร์สนี้
                    </div>`;
                } else {
                    for (let lesson of courseLessons) {
                        // ไอคอนแสดงว่ามี video/pdf หรือไม่
                        let badges = '';
                        if (lesson.video_url) badges += '<span style="background:#e3f2fd;color:#1565c0;padding:2px 8px;border-radius:10px;font-size:12px;margin-left:8px;">🎬 วิดีโอ</span>';
                        if (lesson.file_url) badges += '<span style="background:#fff8e1;color:#e65100;padding:2px 8px;border-radius:10px;font-size:12px;margin-left:4px;">📄 PDF</span>';

                        // เก็บข้อมูลใน data attribute
                        let lessonEncoded = encodeURIComponent(JSON.stringify({
                            title: lesson.title,
                            content: lesson.content || '',
                            video_url: lesson.video_url || '',
                            file_url: lesson.file_url || ''
                        }));

                        htmlData += `<div class="lesson-item">
                            <div>
                                <strong>บทที่ ${lesson.order_number}: ${lesson.title}</strong>
                                ${badges}
                            </div>
                            <button class="btn-view" onclick="openLesson('${lessonEncoded}')">
                                📖 ดูเนื้อหา
                            </button>
                        </div>`;
                    }
                }
                htmlData += `</div>`;
            }
        }

        document.getElementById('my-courses').innerHTML = htmlData;

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('my-courses').innerHTML =
            '<p style="color:red;text-align:center;">ไม่สามารถโหลดข้อมูลได้</p>';
    }
}

// เปิด popup
const openLesson = (encoded) => {
    let lesson = JSON.parse(decodeURIComponent(encoded));

    document.getElementById('modal-title').innerText = '📖 ' + lesson.title;

    // วิดีโอ YouTube
    let videoSection = document.getElementById('modal-video');
    let embedUrl = getYouTubeEmbedUrl(lesson.video_url);
    if (embedUrl) {
        videoSection.innerHTML = `<div class="video-wrapper">
            <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
        </div>`;
    } else {
        videoSection.innerHTML = '';
    }

    // PDF / ไฟล์แนบ
    let pdfSection = document.getElementById('modal-pdf');
    if (lesson.file_url) {
        pdfSection.innerHTML = `<div class="pdf-box">
            📄 <a href="${lesson.file_url}" target="_blank">คลิกเพื่อเปิดเอกสาร / PDF</a>
        </div>`;
    } else {
        pdfSection.innerHTML = '';
    }

    // เนื้อหาข้อความ
    let contentSection = document.getElementById('modal-content');
    if (lesson.content) {
        contentSection.innerHTML = `<div class="modal-content-text">${lesson.content}</div>`;
    } else {
        contentSection.innerHTML = '<p style="color:gray;font-size:14px;">ยังไม่มีเนื้อหาข้อความ</p>';
    }

    document.getElementById('lesson-modal').classList.add('active');
}

// ปิด popup (หยุดวิดีโอด้วย)
const closeModal = () => {
    document.getElementById('lesson-modal').classList.remove('active');
    document.getElementById('modal-video').innerHTML = '';
}

// คลิก overlay ด้านนอกเพื่อปิด
window.addEventListener('click', (e) => {
    let modal = document.getElementById('lesson-modal');
    if (e.target === modal) closeModal();
});