const mongoose = require('mongoose');

const LoginLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // معلومات الدخول
  loginTime: { type: Date, default: Date.now, index: true },
  logoutTime: Date,
  sessionDuration: Number, // بالثواني
  
  // معلومات الجهاز والشبكة
  deviceInfo: String,
  ipAddress: { type: String, required: true },
  userAgent: String,
  browser: {
    name: String,
    version: String,
    engine: String
  },
  os: {
    name: String,
    version: String,
    platform: String
  },
  
  // الموقع الجغرافي (لو أردت إضافته لاحقاً)
  location: {
    country: String,
    city: String,
    timezone: String
  },
  
  // حالة الدخول
  status: {
    type: String,
    enum: ['success', 'failed', 'blocked', 'expired'],
    default: 'success'
  },
  
  // أسباب الفشل (إذا فشل الدخول)
  failureReason: {
    type: String,
    enum: ['wrong_password', 'user_not_found', 'inactive_account', 'device_not_trusted', 'rate_limit']
  },
  
  // معلومات إضافية
  isSuspicious: { type: Boolean, default: false },
  flags: [String] // مثل: 'new_device', 'new_location', 'unusual_time'
}, {
  timestamps: true
});

// 📊 مؤشرات للبحث السريع
LoginLogSchema.index({ userId: 1, loginTime: -1 });
LoginLogSchema.index({ ipAddress: 1, loginTime: -1 });
LoginLogSchema.index({ status: 1 });

module.exports = mongoose.model('LoginLog', LoginLogSchema);
