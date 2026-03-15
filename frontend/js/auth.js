// เช็ค login ทุกหน้า
const checkLogin = (requiredRole) => {
    let user = JSON.parse(localStorage.getItem('user'));
    
    // ถ้าไม่ได้ login ให้ไปหน้า login
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // ถ้า role ไม่ตรง ให้ redirect
    if (requiredRole && user.role !== requiredRole) {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        if (user.role === 'teacher') {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'student-dashboard.html';
        }
        return;
    }

    return user;
}

// ฟังก์ชัน logout
const logout = () => {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}