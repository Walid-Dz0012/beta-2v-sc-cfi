// social-app-frontend/app/page.jsx
'use client';
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

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
        ipAddress: '127.0.0.1'
      });
      
      setMessage(`✅ تم الدخول بنجاح! مرحباً ${response.data.data.user.username}`);
      setUserData(response.data.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    } catch (error) {
      setMessage('❌ خطأ في الدخول: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#1877f2' }}>🚪 صفحة الدخول - موقع تواصل اجتماعي</h1>
      
      {!userData ? (
        <div style={{ margin: '30px 0' }}>
          <div style={{ marginBottom: '15px' }}>
            <input 
              type="text" 
              placeholder="اسم المستخدم" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ padding: '12px', width: '100%', borderRadius: '5px', border: '1px solid #ddd' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '12px', width: '100%', borderRadius: '5px', border: '1px solid #ddd' }}
            />
          </div>
          <button 
            onClick={handleLogin}
            style={{ 
              padding: '12px 30px', 
              backgroundColor: '#1877f2', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            دخول
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <h2>👤 مرحباً {userData.username}!</h2>
          <p>📧 البريد: {userData.email}</p>
          <p>👑 الدور: {userData.role}</p>
          <div style={{ marginTop: '20px' }}>
            <Link href="/dashboard" style={{ 
              padding: '10px 20px', 
              backgroundColor: '#42b72a', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '5px',
              marginRight: '10px'
            }}>
              الذهاب للوحة التحكم
            </Link>
            <button 
              onClick={() => setUserData(null)}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#ccc', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}
      
      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: message.includes('✅') ? '#e7f7e7' : '#ffe7e7',
          borderRadius: '5px'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '50px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
        <h3>🔗 روابط سريعة للاختبار:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ margin: '10px 0' }}>
            <a href={`${API_URL}/health`} target="_blank" rel="noopener noreferrer" style={{ color: '#1877f2' }}>
              ✅ حالة النظام (API Health)
            </a>
          </li>
          <li style={{ margin: '10px 0' }}>
            <a href={`${API_URL}/`} target="_blank" rel="noopener noreferrer" style={{ color: '#1877f2' }}>
              📋 قائمة نقاط نهاية API
            </a>
          </li>
          <li style={{ margin: '10px 0' }}>
            <Link href="/dashboard" style={{ color: '#1877f2' }}>
              📊 لوحة التحكم (Dashboard)
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
