// 📦 استيراد الحزم
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// 🔗 استيراد المكونات
const database = require('./config/database');
const { globalLimiter } = require('./middleware/rateLimit');

// 🚀 إنشاء التطبيق
const app = express();
const PORT = process.env.PORT || 3000;

// 🔒 وسائط الأمان
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// 📊 وسائط الطلبات
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(globalLimiter);

// 📁 استيراد المسارات
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');

// 🛣️ تعريف المسارات
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/groups', groupRoutes);

// 🏠 مسار الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Social App API - النسخة التجريبية',
    version: '1.0.0-beta',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        login: 'POST /api/v1/auth/login',
        session: 'GET /api/v1/auth/session',
        logout: 'POST /api/v1/auth/logout'
      },
      users: {
        list: 'GET /api/v1/users',
        create: 'POST /api/v1/users',
        get: 'GET /api/v1/users/:id',
        update: 'PUT /api/v1/users/:id',
        delete: 'DELETE /api/v1/users/:id',
        devices: 'GET /api/v1/users/:id/devices'
      },
      groups: {
        list: 'GET /api/v1/groups',
        create: 'POST /api/v1/groups',
        get: 'GET /api/v1/groups/:id',
        addMember: 'POST /api/v1/groups/:id/members',
        delete: 'DELETE /api/v1/groups/:id'
      }
    },
    documentation: 'راجع ملف README.md لمزيد من المعلومات'
  });
});

// 🔍 مسار حالة النظام
app.get('/api/v1/health', (req, res) => {
  const dbStatus = database.getStatus();
  
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ❌ معالج الأخطاء 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'الطريق غير موجود',
    requestedUrl: req.originalUrl,
    code: 'ENDPOINT_NOT_FOUND'
  });
});

// ⚠️ معالج الأخطاء العام
app.use((err, req, res, next) => {
  console.error('❌ خطأ غير معالج:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'خطأ داخلي في الخادم';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 🚀 تشغيل الخادم
app.listen(PORT, () => {
  console.log(`
  🚀 Social App API - النسخة التجريبية
  ====================================
  
  📍 البيئة: ${process.env.NODE_ENV || 'development'}
  🌐 المضيف: http://localhost:${PORT}
  🗄️  قاعدة البيانات: ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/social_app_beta'}
  
  📊 المسارات المتاحة:
  - 📍 GET  /              → الصفحة الرئيسية
  - 📍 GET  /api/v1/health → حالة النظام
  - 🔐 POST /api/v1/auth/login → تسجيل الدخول
  - 👥 GET  /api/v1/users      → إدارة المستخدمين
  - 🏠 GET  /api/v1/groups     → إدارة المجموعات
  
  ⚠️  ملاحظة: هذه نسخة تجريبية للأغراض التعليمية فقط
  `);
});

// 🔄 معالجة إغلاق التطبيق
process.on('SIGTERM', () => {
  console.log('🔄 تلقي إشارة SIGTERM، إغلاق بخير...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 تلقي إشارة SIGINT، إغلاق بخير...');
  process.exit(0);
});
