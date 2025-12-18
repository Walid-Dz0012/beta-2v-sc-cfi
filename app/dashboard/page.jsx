// social-app-frontend/app/dashboard/page.jsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'https://beta-2v-sc-cfi.vercel.app/api/v1';

export default function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // في التطبيق الحقيقي، ستكون هناك مصادقة
      const usersRes = await axios.get(`${API_URL}/users?page=1&limit=10`);
      const groupsRes = await axios.get(`${API_URL}/groups?page=1&limit=10`);
      
      setUsers(usersRes.data.data.users || []);
      setGroups(groupsRes.data.data.groups || []);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>جاري التحميل...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>📊 لوحة التحكم</h1>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* قسم المستخدمين */}
        <div style={{ flex: 1, border: '1px solid #ddd', padding: '15px' }}>
          <h2>👥 المستخدمون ({users.length})</h2>
          <ul>
            {users.map(user => (
              <li key={user._id} style={{ marginBottom: '10px' }}>
                <strong>{user.username}</strong> - {user.role}
              </li>
            ))}
          </ul>
        </div>
        
        {/* قسم المجموعات */}
        <div style={{ flex: 1, border: '1px solid #ddd', padding: '15px' }}>
          <h2>🏠 المجموعات ({groups.length})</h2>
          <ul>
            {groups.map(group => (
              <li key={group._id} style={{ marginBottom: '10px' }}>
                <strong>{group.name}</strong> - {group.memberCount} أعضاء
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
