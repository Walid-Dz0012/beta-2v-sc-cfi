// social-app-frontend/app/page.jsx
'use client';
import { useState } from 'react';
import axios from 'axios';

const API_URL = 'https://beta-2v-sc-cfi.vercel.app/api/v1';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState(null);

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password,
        userAgent: navigator.userAgent,
        ipAddress: '127.0.0.1' // في الحقيقي سيتم الحصول عليه من الخادم
      });
      
      setMessage(`✅ تم الدخول بنجاح! مرحباً ${response.data.data.user.username}`);
      setUserData(response.data.data.user);
    } catch (error) {
      setMessage('❌ خطأ في الدخول: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🚪 صفحة الدخول - موقع تواصل اجتماعي</h1>
      
      {!userData ? (
        <div>
          <input 
            type="text" 
            placeholder="اسم المستخدم" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '10px', margin: '10px', width: '200px' }}
          />
          <br />
          <input 
            type="password" 
            placeholder="كلمة المرور" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', margin: '10px', width: '200px' }}
          />
          <br />
          <button 
            onClick={handleLogin}
            style={{ padding: '10px 20px', margin: '10px', backgroundColor: '#1877f2', color: 'white', border: 'none' }}
          >
            دخول
          </button>
        </div>
      ) : (
        <div>
          <h2>👤 مرحباً {userData.username}!</h2>
          <p>📧 البريد: {userData.email}</p>
          <p>👑 الدور: {userData.role}</p>
          <button onClick={() => setUserData(null)}>تسجيل الخروج</button>
        </div>
      )}
      
      {message && <p style={{ marginTop: '20px' }}>{message}</p>}
      
      <div style={{ marginTop: '50px' }}>
        <h3>🔗 روابط سريعة للاختبار:</h3>
        <ul>
          <li><a href={`${API_URL}/health`} target="_blank">حالة النظام</a></li>
          <li><a href={`${API_URL}/`} target="_blank">قائمة API</a></li>
        </ul>
      </div>
    </div>
  );
}
