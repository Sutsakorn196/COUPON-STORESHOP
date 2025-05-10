// ========== script.js สำหรับเว็บแอปคูปอง ==========

const scriptURL = 'https://script.google.com/macros/s/AKfycbzka4-7wm5_IWKrpkmdEnRcH47dw1pAdPhk4adY0EO6CHoPGMC6OO2LMHOw3eAsOrUW/exec'; // เปลี่ยนเป็น URL จริงของคุณ

// === Login ===
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch(`${scriptURL}?action=login&email=${email}&password=${password}`);
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('user', email);
      window.location.href = 'coupon.html';
    } else {
      alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  });
}

// === Register ===
if (document.getElementById('registerForm')) {
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) return alert('รหัสผ่านไม่ตรงกัน');

    const res = await fetch(`${scriptURL}?action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (data.success) {
      alert('สมัครสมาชิกสำเร็จ');
      window.location.href = 'login.html';
    } else {
      alert('อีเมลถูกใช้งานแล้ว');
    }
  });
}

// === Load Coupons ===
if (document.getElementById('couponList')) {
  window.onload = async () => {
    const user = localStorage.getItem('user');
    if (!user) return window.location.href = 'login.html';

    const res = await fetch(`${scriptURL}?action=getCoupons&email=${user}`);
    const result = await res.json();
    const list = document.getElementById('couponList');
    list.innerHTML = '';

    if (result.success) {
      result.coupons.forEach(coupon => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><img src="${coupon.image}" width="50"></td>
          <td>${coupon.name}</td>
          <td>${coupon.expire}</td>
          <td>
            <button class="show-btn"
              data-name="${coupon.name}"
              data-image="${coupon.image}"
              data-condition="${coupon.condition}"
              data-expire="${coupon.expire}"
              data-code="${coupon.code}"
            >ดูโค้ด</button>
          </td>
        `;
        list.appendChild(tr);
      });

      document.querySelectorAll('.show-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const coupon = {
            name: btn.dataset.name,
            image: btn.dataset.image,
            condition: btn.dataset.condition,
            expire: btn.dataset.expire,
            code: btn.dataset.code
          };
          showPopup(coupon);
        });
      });

    } else {
      list.innerHTML = '<tr><td colspan="4">ไม่พบคูปอง</td></tr>';
    }
  };
}

// ฟังก์ชันในการแสดงป็อปอัป
function showPopup(coupon) {
  document.getElementById('popupImage').src = coupon.image;
  document.getElementById('popupName').innerText = coupon.name;
  document.getElementById('popupCondition').innerText = coupon.condition;


  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(coupon.code)}&size=150x150`;
  const barcodeURL = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(coupon.code)}&code=Code128&translate-esc=false`;

  document.getElementById('displayArea').innerHTML = `
    <p><strong>โค้ด:</strong> ${coupon.code}</p>
    <p><strong>QR Code:</strong><br><img src="${qrCodeURL}" alt="QR Code"></p>
    <p><strong>Barcode:</strong><br><img src="${barcodeURL}" alt="Barcode"></p>
  `;

  document.getElementById('popup').style.display = 'block';
}

// ฟังก์ชันในการปิดป็อปอัป
function closePopup() {
  document.getElementById('popup').style.display = 'none';
}


// === Use Coupon ===
async function useCoupon() {
    const code = localStorage.getItem('selectedCoupon');
    const email = localStorage.getItem('user');
  
    if (!code || !email) {
      alert('ไม่พบข้อมูลคูปองหรือผู้ใช้งาน');
      return;
    }
  
    const res = await fetch(`${scriptURL}?action=useCoupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
  
    const data = await res.json();
  
    if (data.success) {
      alert('ใช้งานคูปองเรียบร้อยแล้ว');
      startCouponTimer(); // เริ่มจับเวลา
      closePopup();
      window.location.reload();
    } else {
      alert(data.message || 'คูปองนี้ถูกใช้งานแล้วหรือมีข้อผิดพลาด');
    }
  }
  
  // === Start Coupon Timer ===
  function startCouponTimer() {
    const timerDisplay = document.getElementById('timer'); // เพิ่ม HTML element สำหรับแสดงเวลา
    let timeRemaining = 180; // 3 นาที (180 วินาที)
  
    // อัพเดทเวลาในทุกๆ 1 วินาที
    const interval = setInterval(() => {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      timerDisplay.innerText = `เวลาที่เหลือ: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  
      if (timeRemaining <= 0) {
        clearInterval(interval);
        alert('คูปองหมดเวลาแล้ว');
        // ทำการอัพเดตสถานะคูปองหรือสิ้นสุดการใช้งาน
        expireCoupon();
      } else {
        timeRemaining--;
      }
    }, 1000);
  }
  
  // === Expire Coupon === (หลังจากหมดเวลา)
  async function expireCoupon() {
    const code = localStorage.getItem('selectedCoupon');
    const email = localStorage.getItem('user');
  
    if (!code || !email) return;
  
    const res = await fetch(`${scriptURL}?action=expireCoupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
  
    const data = await res.json();
    if (data.success) {
      console.log('คูปองหมดอายุ');
      // ทำการรีเฟรชหน้าหรืออัพเดต UI ให้แสดงสถานะใหม่
    } else {
      console.log(data.message || 'มีข้อผิดพลาดในการอัพเดตสถานะคูปอง');
    }
  }
  
