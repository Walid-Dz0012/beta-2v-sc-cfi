// social-app-frontend/app/dashboard/page.jsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = 'https://beta-2v-sc-cfi.vercel.app/api/v1';

export default function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // جلب بيانات المستخدم من التخزين المحلي
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // جلب المستخدمين
      const usersRes = await axios.get(`${API_URL}/users?page=1&limit=10`);
      // جلب المجموعات
      const groupsRes = await axios.get(`${API_URL}/groups?page=1&limit=10`);
      
      setUsers(usersRes.data.data?.users || []);
      setGroups(groupsRes.data.data?.groups || []);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* شريط التنقل */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '15px 20px',
        backgroundColor: '#1877f2',
        color: 'white',
        borderRadius: '10px 10px 0 0'
      }}>
        <h1 style={{ margin: 0 }}>📊 لوحة التحكم</h1>
        <div>
          {user && (
            <span style={{ marginRight: '20px' }}>
              👤 {user.username} ({user.role})
            </span>
          )}
          <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
            🏠 الرئيسية
          </Link>
        </div>
      </div>

      {/* محتوى لوحة التحكم */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginTop: '20px',
        flexWrap: 'wrap'
      }}>
        {/* بطاقة المستخدمين */}
        <div style={{ 
          flex: '1 1 300px',
          border: '1px solid #ddd', 
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: '#1877f2' }}>👥 المستخدمون</h2>
            <span style={{ 
              backgroundColor: '#1877f2', 
              color: 'white',
              padding: '5px 10px',
              borderRadius: '20px'
            }}>
              {users.length} مستخدم
            </span>
          </div>
          
          <div style={{ marginTop: '15px', maxHeight: '300px', overflowY: 'auto' }}>
            {users.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '10px', textAlign: 'right' }}>اسم المستخدم</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>الدور</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{user.username}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '3px',
                          backgroundColor: user.role === 'admin' ? '#ff6b6b' : 
                                         user.role === 'moderator' ? '#4ecdc4' : '#45b7d1',
                          color: 'white',
                          fontSize: '12px'
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          color: user.isActive ? '#42b72a' : '#ff6b6b'
                        }}>
                          {user.isActive ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: '#666' }}>لا يوجد مستخدمين</p>
            )}
          </div>
        </div>

        {/* بطاقة المجموعات */}
        <div style={{ 
          flex: '1 1 300px',
          border: '1px solid #ddd', 
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: '#42b72a' }}>🏠 المجموعات</h2>
            <span style={{ 
              backgroundColor: '#42b72a', 
              color: 'white',
              padding: '5px 10px',
              borderRadius: '20px'
            }}>
              {groups.length} مجموعة
            </span>
          </div>
          
          <div style={{ marginTop: '15px', maxHeight: '300px', overflowY: 'auto' }}>
            {groups.length > 0 ? (
              <div>
                {groups.map(group => (
                  <div key={group._id} style={{
                    padding: '15px',
                    marginBottom: '10px',
                    border: '1px solid #eee',
                    borderRadius: '5px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h4 style={{ margin: '0 0 10px 0' }}>{group.name}</h4>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {group.memberCount || 0} أعضاء
                      </span>
                    </div>
                    {group.description && (
                      <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                        {group.description.substring(0, 100)}...
                      </p>
                    )}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginTop: '10px',
                      fontSize: '12px'
                    }}>
                      <span>النوع: {group.type === 'private' ? 'خاصة' : 'عامة'}</span>
                      <span>آخر نشاط: {new Date(group.lastActivity).toLocaleDateString('ar')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#666' }}>لا يوجد مجموعات</p>
            )}
          </div>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px'
      }}>
        <h3>📈 إحصائيات سريعة</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'white',
            borderRadius: '5px',
            flex: '1',
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1877f2' }}>
              {users.length}
            </div>
            <div>مستخدم مسجل</div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'white',
            borderRadius: '5px',
            flex: '1',
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#42b72a' }}>
              {groups.length}
            </div>
            <div>مجموعة نشطة</div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'white',
            borderRadius: '5px',
            flex: '1',
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b' }}>
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div>مسؤول</div>
          </div>
        </div>
      </div>

      {/* رابط العودة */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <Link href="/" style={{
          padding: '10px 20px',
          backgroundColor: '#1877f2',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px'
        }}>
          ← العودة للصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
