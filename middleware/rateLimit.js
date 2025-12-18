const rateLimit = require('express-rate-limit');

// 🚦 تحديد معدل الطلبات العامة
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // حد 100 طلب لكل IP
  message: {
    success: false,
    error: 'تم تجاوز عدد الطلبات المسموح بها',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 دقيقة'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => req.ip
});

// 🚦 تحديد معدل طلبات المصادقة
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 5, // 5 محاولات دخول فقط
  message: {
    success: false,
    error: 'تم تجاوز محاولات الدخول المسموح بها',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 'ساعة واحدة'
  },
  skipSuccessfulRequests: true
});

// 🚦 تحديد معدل طلبات المسؤول
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 1000, // حد أعلى للمسؤولين
  message: {
    success: false,
    error: 'تم تجاوز عدد الطلبات المسموح بها',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  adminLimiter
};
