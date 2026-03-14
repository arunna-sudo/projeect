const BASE_URL = 'http://localhost:8000';

// เมื่อโหลดหน้าเว็บเสร็จ ให้ดึงข้อมูลมาแสดงทันที
window.onload = async () => {
    await loadData();
};

// ฟังก์ชันดึงข้อมูลผู้สอนจากฐานข้อมูล
const loadData = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/instructors`);
        const instructors = response.data;
        
        let htmlData = '';
        
        // วนลูปสร้างกล่องข้อมูลสวยๆ ทีละรายชื่อ
        for (let i = 0; i < instructors.length; i++) {
            let instructor = instructors[i];
            
            // 🌟 ตรงนี้แหละครับที่เราเรียกใช้ CSS Class (.data-item, .btn-edit, .btn-delete) 🌟
            htmlData += `
                <div class="data-item">
                    <div style="font-size: 16px; color: #333;">
                        <strong>${i + 1}. ${instructor.firstname} ${instructor.lastname}</strong>
                        <span style="color: #7f8c8d; font-size: 14px; margin-left: 10px;">(✉️ ${instructor.email})</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <a href="instructor-form.html?id=${instructor.id}" class="btn-edit" style="text-decoration: none;">✏️ แก้ไข</a>
                        
                        <button onclick="deleteData(${instructor.id})" class="btn-delete">🗑️ ลบ</button>
                    </div>
                </div>
            `;
        }
        
        // เอา HTML ที่จัดทรงสวยแล้ว ไปยัดใส่ใน <div id="instructor"> ของหน้าเว็บ
        document.getElementById('instructor').innerHTML = htmlData;
        
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
        document.getElementById('instructor').innerHTML = '<p style="color: red;">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>';
    }
};

// ฟังก์ชันลบข้อมูล
const deleteData = async (id) => {
    // ถามเพื่อความแน่ใจก่อนลบ
    if (confirm('⚠️ คุณต้องการลบข้อมูลอาจารย์ท่านนี้ใช่หรือไม่?')) {
        try {
            await axios.delete(`${BASE_URL}/instructors/${id}`);
            // โหลดข้อมูลใหม่หลังจากลบเสร็จ (เพื่อให้รายชื่ออัปเดตทันที)
            await loadData(); 
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการลบข้อมูล:', error);
            alert('❌ เกิดข้อผิดพลาด ไม่สามารถลบข้อมูลได้');
        }
    }
};