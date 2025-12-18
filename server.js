/**
 * ============================================
 * 🚀 CFI ZOE - Social Media API
 * 📍 مُحسَّن للإنتاج على Vercel
 * 🔗 https://beta-2v-sc-cfi.vercel.app
 * ============================================
 */

// 📦 استيراد الحزم الأساسية فقط (لتجنب أخطاء Build)
const express = require('express');
const cors = require('cors');

// 🚀 إنشاء تطبيق Express
const app = express();

// 🔧 الإعدادات الأساسية
const PORT = process.env.PORT || 3000;

// 🔒 Middleware (مبسطة)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== 🏠 المسارات الأساسية ====================

// 🏠 1. الصفحة الرئيسية - للتحقق من أن API يعمل
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 CFI ZOE API is running on Vercel!',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        login: 'POST /api/v1/auth/login',
        test: 'POST /api/v1/auth/test'
      },
      users: 'GET /api/v1/users',
      health: 'GET /api/v1/health',
      test: 'GET /api/v1/test'
    },
    documentation: 'جميع المسارات جاهزة للاستخدام'
  });
});

// ❤️ 2. حالة النظام
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    region: process.env.VERCEL_REGION || 'unknown'
  });
});

// 🧪 3. مسار اختبار بسيط
app.get('/api/v1/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ API test endpoint is working!',
    test_data: {
      user: 'test_user',
      status: 'active',
      features: ['login', 'users', 'groups']
    }
  });
});

// ==================== 🔐 نظام المصادقة ====================

// 📋 مستخدمين تجريبيين (بدون قاعدة بيانات)
const demoUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@cfizoe.com',
    password: 'AdminSecure123!', // في الإنتاج سيتم تشفيرها
    role: 'admin',
    isActive: true
  },
  {
    id: 2,
    username: 'user1',
    email: 'user1@cfizoe.com',
    password: 'User123!',
    role: 'user',
    isActive: true
  }
];

// 🔑 4. مسار تسجيل الدخول الرئيسي
app.post('/api/v1/auth/login', (req, res) => {
  try {
    console.log('📥 طلب تسجيل دخول:', new Date().toISOString());
    
    const { username, password } = req.body;
    
    // التحقق من البيانات
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'اسم المستخدم وكلمة المرور مطلوبان',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // البحث عن المستخدم
    const user = demoUsers.find(u => 
      u.username === username && u.isActive === true
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'اسم المستخدم غير موجود',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // التحقق من كلمة المرور (مقارنة مباشرة للتجربة)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'كلمة المرور غير صحيحة',
        code: 'WRONG_PASSWORD'
      });
    }
    
    // نجاح تسجيل الدخول
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: '🎉 تم تسجيل الدخول بنجاح!',
      user: userResponse,
      token: `cfi-token-${Date.now()}-${user.id}`,
      session: {
        expiresIn: '24h',
        loginTime: new Date().toISOString()
      }
    });
    
    console.log(`✅ ${username} logged in successfully`);
    
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم',
      code: 'SERVER_ERROR'
    });
  }
});

// 👤 5. الحصول على جميع المستخدمين
app.get('/api/v1/users', (req, res) => {
  // إزالة كلمات المرور من الاستجابة
  const usersWithoutPasswords = demoUsers.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
  
  res.json({
    success: true,
    count: usersWithoutPasswords.length,
    users: usersWithoutPasswords
  });
});

// 👤 6. الحصول على مستخدم محدد
app.get('/api/v1/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = demoUsers.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'المستخدم غير موجود'
    });
  }
  
  // إزالة كلمة المرور
  const { password, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    user: userWithoutPassword
  });
});

// ➕ 7. إنشاء مستخدم جديد
app.post('/api/v1/users', (req, res) => {
  const { username, email, password, role = 'user' } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'جميع الحقول مطلوبة'
    });
  }
  
  // التحقق من عدم تكرار اسم المستخدم
  const userExists = demoUsers.some(u => u.username === username);
  if (userExists) {
    return res.status(400).json({
      success: false,
      error: 'اسم المستخدم موجود مسبقاً'
    });
  }
  
  const newUser = {
    id: demoUsers.length + 1,
    username,
    email,
    password, // في الإنتاج سيتم تشفيرها
    role,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  // في الإنتاج: حفظ في قاعدة البيانات
  // demoUsers.push(newUser);
  
  const { password: _, ...userResponse } = newUser;
  
  res.status(201).json({
    success: true,
    message: 'تم إنشاء المستخدم بنجاح',
    user: userResponse
  });
});

// ==================== 🧪 مسارات تطويرية ====================

// 🔧 8. إنشاء مسؤول افتراضي
app.post('/api/v1/setup/admin', (req, res) => {
  const adminUser = {
    id: 999,
    username: 'admin',
    email: 'admin@cfizoe.com',
    password: 'AdminSecure123!',
    role: 'admin',
    isActive: true,
    created: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: '✅ حساب المسؤول جاهز',
    user: {
      username: adminUser.username,
      password: adminUser.password, // ⚠️ فقط للتطوير
      warning: 'غير كلمة المرور في الإنتاج!'
    }
  });
});

// 🔄 9. إعادة تعيين البيانات التجريبية
app.post('/api/v1/reset', (req, res) => {
  res.json({
    success: true,
    message: 'تم إعادة تعيين البيانات التجريبية',
    users: demoUsers.map(u => ({ username: u.username, role: u.role }))
  });
});

// ==================== ❌ معالجة الأخطاء ====================

// 404 - مسار غير موجود
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'الطريق غير موجود',
    requestedUrl: req.originalUrl,
    code: 'ENDPOINT_NOT_FOUND',
    suggestion: 'جرب GET / للاطلاع على المسارات المتاحة'
  });
});

// معالج الأخطاء العام
app.use((err, req, res, next) => {
  console.error('❌ خطأ:', err);
  res.status(500).json({
    success: false,
    error: 'حدث خطأ في الخادم',
    code: 'INTERNAL_ERROR'
  });
});

// ==================== 🚀 تشغيل الخادم ====================

// ⚠️ مهم: هذا الشرط ضروري لـ Vercel
if (process.env.NODE_ENV !== 'production') {
  // التشغيل المحلي
  app.listen(PORT, () => {
    console.log(`
    🚀 CFI ZOE API - الإصدار المحلي
    =================================
    
    🌐 http://localhost:${PORT}
    📍 Port: ${PORT}
    
    📊 المسارات النشطة:
    • GET  /                 → الصفحة الرئيسية
    • POST /api/v1/auth/login → تسجيل الدخول
    • GET  /api/v1/users     → قائمة المستخدمين
    
    👑 بيانات الاختبار:
    • username: admin
    • password: AdminSecure123!
    
    ⚡ جاهز للاستخدام!
    `);
  });
} else {
  // على Vercel - لا نستخدم app.listen
  console.log('✅ CFI ZOE API جاهز على Vercel');
}

// ⚠️ ضروري لـ Vercel: تصدير app كـ module
module.exports = app;
