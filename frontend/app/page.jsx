'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    // سيتم ربط هذا بـ API الموجود لديك
    console.log('تسجيل دخول:', { username, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-2xl font-bold text-center mb-6">
          CFI ZOE - تسجيل الدخول
        </h1>
        <input 
          className="w-full p-3 border rounded mb-4"
          placeholder="اسم المستخدم"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input 
          className="w-full p-3 border rounded mb-4"
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button 
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
        >
          دخول
        </button>
      </div>
    </div>
  )
}
const API_URL = 'https://beta-2v-sc-cfi.vercel.app/api/v1'

const handleLogin = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        password: password
      })
    })
    
    const data = await response.json()
    console.log('نجاح:', data)
  } catch (error) {
    console.error('خطأ:', error)
  }
}
