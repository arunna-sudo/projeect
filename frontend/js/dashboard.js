const BASE_URL = 'http://localhost:8000';
let quizChart = null;

window.onload = async () => {
    await updateStatistics();
    await loadQuizChart();
}

const updateStatistics = async () => {
    try {
        const [courseRes, instructorRes, studentRes, lessonRes] = await Promise.all([
            axios.get(`${BASE_URL}/courses`),
            axios.get(`${BASE_URL}/instructors`),
            axios.get(`${BASE_URL}/students`),
            axios.get(`${BASE_URL}/lessons`)
        ]);

        document.getElementById('count-courses').innerText = courseRes.data.length;
        document.getElementById('count-instructors').innerText = instructorRes.data.length;
        document.getElementById('count-students').innerText = studentRes.data.length;
        document.getElementById('count-lessons').innerText = lessonRes.data.length;
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

const loadQuizChart = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/quizzes/results/all`);
        const results = response.data;

        // ถ้าไม่มีข้อมูล แสดงข้อความแทน
        if (results.length === 0) {
            document.getElementById('chart-empty').style.display = 'block';
            document.getElementById('quiz-chart-wrapper').style.display = 'none';
            return;
        }

        // จัดกลุ่มตามบทเรียน คำนวณ % ถูก
        let groups = {};
        for (let r of results) {
            if (!groups[r.lesson_title]) {
                groups[r.lesson_title] = { correct: 0, total: 0 };
            }
            groups[r.lesson_title].total++;
            if (r.is_correct) groups[r.lesson_title].correct++;
        }

        const labels = Object.keys(groups);
        const percentages = labels.map(l =>
            Math.round((groups[l].correct / groups[l].total) * 100)
        );

        // สีตาม % — เขียว / เหลือง / แดง
        const colors = percentages.map(p =>
            p >= 70 ? 'rgba(16,185,129,0.85)' :
            p >= 40 ? 'rgba(245,158,11,0.85)' :
                      'rgba(239,68,68,0.85)'
        );

        const ctx = document.getElementById('quizChart').getContext('2d');
        if (quizChart) quizChart.destroy();

        quizChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'คะแนนเฉลี่ย (%)',
                    data: percentages,
                    backgroundColor: colors,
                    borderRadius: 10,
                    borderSkipped: false,
                    maxBarThickness: 60,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 24 } },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(26,29,58,0.9)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (ctx) =>
                                ` ${ctx.raw}%  (${groups[ctx.label].correct}/${groups[ctx.label].total} ข้อถูก)`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: val => val + '%',
                            font: { family: 'DM Sans, sans-serif', size: 12 },
                            color: '#8b90b8'
                        },
                        grid: { color: 'rgba(0,0,0,0.04)' }
                    },
                    x: {
                        ticks: {
                            font: { family: 'DM Sans, sans-serif', size: 13 },
                            color: '#4a4f72',
                            maxRotation: 20
                        },
                        grid: { display: false }
                    }
                },
                // แสดง % บนหัวแท่ง
                animation: {
                    onComplete: function () {
                        const chart = this;
                        const ctx2 = chart.ctx;
                        ctx2.save();
                        ctx2.font = 'bold 13px DM Sans, sans-serif';
                        ctx2.fillStyle = '#4a4f72';
                        ctx2.textAlign = 'center';
                        ctx2.textBaseline = 'bottom';
                        chart.data.datasets.forEach((ds, i) => {
                            chart.getDatasetMeta(i).data.forEach((bar, idx) => {
                                ctx2.fillText(ds.data[idx] + '%', bar.x, bar.y - 4);
                            });
                        });
                        ctx2.restore();
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error loading quiz chart:', error);
        document.getElementById('chart-empty').style.display = 'block';
        document.getElementById('quiz-chart-wrapper').style.display = 'none';
    }
}