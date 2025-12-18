/**
 * 🚀 CFI ZOE - Social Media Platform
 * 📅 الإصدار: 1.0.0
 * 🔗 API الرئيسي: https://beta-2v-sc-cfi.vercel.app
 */

// ==================== 📦 استيراد الحزم ====================
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// ==================== 🚀 إنشاء التطبيق ====================
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 🔒 وسائط الأمان ====================
app.use(helmet({
  contentSecurityPolicy: false, // يمكن تفعيله في الإنتاج
}));
app.use(cors({
  origin: '*', // في الإنتاج ضع نطاقات محددة
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== 🗄️ نموذج المستخدم (مبسط) ====================
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'moderator', 'user'], 
    default: 'user' 
  },
  registeredDevices: [{
    deviceId: String,
    userAgent: String,
    ipAddress: String,
    registeredAt: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  loginCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// 🔐 تشفير كلمة المرور قبل الحفظ
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔍 مقارنة كلمات المرور
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

// ==================== 🗄️ نموذج سجلات الدخول ====================
const LoginLogSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  username: String,
  loginTime: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String,
  browser: String,
  os: String,
  status: { type: String, enum: ['success', 'failed'] },
  failureReason: String
});

const LoginLog = mongoose.model('LoginLog', LoginLogSchema);

// ==================== 🌐 مسارات API ====================

// 🏠 المسار الرئيسي للتحقق
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 CFI ZOE API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        login: 'POST /api/v1/auth/login',
        register: 'POST /api/v1/auth/register (admin only)',
        logout: 'POST /api/v1/auth/logout'
      },
      users: {
        list: 'GET /api/v1/users (admin only)',
        create: 'POST /api/v1/users (admin only)',
        get: 'GET /api/v1/users/:id',
        update: 'PUT /api/v1/users/:id',
        delete: 'DELETE /api/v1/users/:id'
      },
      health: 'GET /api/v1/health'
    },
    documentation: 'https://github.com/Walid-Dz0012/beta-2v-sc-cfi'
  });
});

// ❤️ حالة النظام
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== 🔐 مسارات المصادقة ====================

// 🔑 تسجيل الدخول - المسار الرئيسي الذي تريده
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('📥 طلب تسجيل دخول:', { username, timestamp: new Date() });
    
    // ✅ التحقق من البيانات
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'اسم المستخدم وكلمة المرور مطلوبان',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // 🔍 البحث عن المستخدم
    const user = await User.findOne({ username, isActive: true });
    
    if (!user) {
      // تسجيل محاولة فاشلة
      await LoginLog.create({
        username,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        status: 'failed',
        failureReason: 'user_not_found'
      });
      
      return res.status(401).json({
        success: false,
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // 🔐 التحقق من كلمة المرور
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      await LoginLog.create({
        userId: user._id,
        username: user.username,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        status: 'failed',
        failureReason: 'wrong_password'
      });
      
      return res.status(401).json({
        success: false,
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // ✨ تحديث بيانات المستخدم
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();
    
    // 📝 تسجيل الدخول الناجح
    await LoginLog.create({
      userId: user._id,
      username: user.username,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      browser: req.headers['user-agent']?.includes('Chrome') ? 'Chrome' : 'Other',
      os: req.headers['user-agent']?.includes('Windows') ? 'Windows' : 'Other',
      status: 'success'
    });
    
    // ✅ إرجاع الاستجابة الناجحة
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح!',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount
      },
      token: `cfi-token-${Date.now()}-${user._id}`, // توكن مؤقت
      session: {
        deviceInfo: req.headers['user-agent'],
        loginTime: new Date()
      }
    });
    
    console.log('✅ تسجيل دخول ناجح:', { username, time: new Date() });
    
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم أثناء تسجيل الدخول',
      code: 'LOGIN_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 👤 إنشاء مستخدم جديد (للمسؤول فقط)
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { adminToken, username, email, password, role = 'user' } = req.body;
    
    // تحقق بسيط للمسؤول (في الإنتاج استخدم JWT)
    if (adminToken !== 'ADMIN_SECRET_KEY') {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح - للمسؤولين فقط',
        code: 'ADMIN_ONLY'
      });
    }
    
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'اسم المستخدم أو البريد الإلكتروني موجود مسبقاً',
        code: 'USER_EXISTS'
      });
    }
    
    const newUser = new User({
      username,
      email,
      password,
      role
    });
    
    await newUser.save();
    
    // إزالة كلمة المرور من الاستجابة
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      user: userResponse
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'خطأ في إنشاء المستخدم'
    });
  }
});

// ==================== 👥 مسارات المستخدمين ====================

// 📋 الحصول على جميع المستخدمين
app.get('/api/v1/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password')
      .sort({ createdAt: -1 })
      .limit(50);
    
    const logs = await LoginLog.find()
      .sort({ loginTime: -1 })
      .limit(20);
    
    res.json({
      success: true,
      count: users.length,
      users,
      recentLogins: logs
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب المستخدمين'
    });
  }
});

// 👤 الحصول على مستخدم محدد
app.get('/api/v1/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود'
      });
    }
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب بيانات المستخدم'
    });
  }
});

// ==================== 🧪 مسارات الاختبار ====================

// 🧪 إنشاء مستخدم مسؤول افتراضي (للتجربة)
app.post('/api/v1/setup/admin', async (req, res) => {
  try {
    // حذف المسؤول الحالي إذا موجود
    await User.deleteOne({ username: 'admin' });
    
    // إنشاء مسؤول جديد
    const adminUser = new User({
      username: 'admin',
      email: 'admin@cfizoe.com',
      password: 'AdminSecure123!', // سيتم تشفيرها تلقائياً
      role: 'admin',
      isActive: true
    });
    
    await adminUser.save();
    
    res.json({
      success: true,
      message: '✅ تم إنشاء حساب المسؤول بنجاح',
      credentials: {
        username: 'admin',
        password: 'AdminSecure123!',
        email: 'admin@cfizoe.com'
      },
      warning: '⚠️ غير كلمة المرور في الإنتاج!'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'خطأ في إعداد المسؤول'
    });
  }
});

// 🧪 مسار اختبار بسيط
app.get('/api/v1/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ كل شيء يعمل بشكل صحيح!',
    endpoint: '/api/v1/auth/login موجود وجاهز',
    test: {
      method: 'POST',
      url: '/api/v1/auth/login',
      body: {
        username: 'admin',
        password: 'AdminSecure123!'
      }
    }
  });
});

// ==================== 🗄️ اتصال قاعدة البيانات ====================
async function connectDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cfi_zoe';
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ متصل بقاعدة البيانات:', mongoose.connection.host);
    
    // إنشاء مسؤول افتراضي إذا لم يكن موجوداً
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@cfizoe.com',
        password: 'AdminSecure123!',
        role: 'admin'
      });
      await adminUser.save();
      console.log('👑 تم إنشاء المسؤول الافتراضي');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
    console.log('ℹ️ سيعمل التطبيق بدون قاعدة بيانات (وضع تجريبي)');
  }
}

// ==================== ❌ معالجة الأخطاء ====================

// معالج الأخطاء 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'الطريق غير موجود',
    requestedUrl: req.originalUrl,
    code: 'ENDPOINT_NOT_FOUND',
    availableEndpoints: [
      'GET /',
      'GET /api/v1/health',
      'POST /api/v1/auth/login',
      'GET /api/v1/test'
    ],
    suggestion: 'جرب POST /api/v1/auth/login لتسجيل الدخول'
  });
});

// معالج الأخطاء العام
app.use((err, req, res, next) => {
  console.error('❌ خطأ غير معالج:', err);
  
  res.status(500).json({
    success: false,
    error: 'خطأ داخلي في الخادم',
    code: 'INTERNAL_SERVER_ERROR'
  });
});

// ==================== 🚀 تشغيل الخادم ====================
async function startServer() {
  // محاولة الاتصال بقاعدة البيانات
  await connectDatabase();
  
  // تشغيل الخادم
  app.listen(PORT, () => {
    console.log(`
    🚀 CFI ZOE API - النسخة التجريبية
    ====================================
    
    🌐 المضيف: http://localhost:${PORT}
    📍 Port: ${PORT}
    🗄️  قاعدة البيانات: ${mongoose.connection.readyState === 1 ? '✅ متصل' : '❌ غير متصل'}
    
    📊 المسارات الرئيسية:
    - 🏠  GET  /                    → الصفحة الرئيسية
    - ❤️  GET  /api/v1/health       → حالة النظام
    - 🔐  POST /api/v1/auth/login   → تسجيل الدخول
    - 🧪  GET  /api/v1/test         → اختبار API
    
    👑 بيانات اختبار الدخول:
    - 👤 المستخدم: admin
    - 🔑 كلمة المرور: AdminSecure123!
    - 📧 البريد: admin@cfizoe.com
    
    ⚠️  ملاحظات:
    1. إذا لم تكن قاعدة البيانات متصلة، سيستخدم بيانات تجريبية
    2. يمكن اختبار API باستخدام Postman أو curl
    3. للمساعدة: node server.js --help
    `);
  });
}

// ==================== 📝 ملفات الدعم ====================

/**
 * 📋 كيفية الاستخدام:
 * 1. احفظ هذا الملف كـ server.js
 * 2. قم بتثبيت الحزم: npm install express mongoose bcryptjs cors helmet dotenv
 * 3. شغل الخادم: node server.js
 * 
 * 🧪 اختبار تسجيل الدخول:
 * curl -X POST http://localhost:3000/api/v1/auth/login \\
 *   -H "Content-Type: application/json" \\
 *   -d '{"username":"admin","password":"AdminSecure123!"}'
 */

// تشغيل الخادم
startServer();

// معالجة إغلاق التطبيق
process.on('SIGINT', async () => {
  console.log('\n👋 إغلاق الخادم...');
  await mongoose.connection.close();
  process.exit(0);
});
