const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  userAgent: String,
  ipAddress: String,
  browser: String,
  os: String,
  lastUsed: { type: Date, default: Date.now },
  registeredAt: { type: Date, default: Date.now },
  isTrusted: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema({
  // المعلومات الأساسية
  username: {
    type: String,
    required: [true, 'اسم المستخدم مطلوب'],
    unique: true,
    trim: true,
    minlength: [3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'],
    maxlength: [30, 'اسم المستخدم يجب أن لا يتجاوز 30 حرف']
  },
  
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'يرجى إدخال بريد إلكتروني صالح']
  },
  
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: [6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'],
    select: false // عدم إرجاع كلمة المرور افتراضياً
  },
  
  // الصلاحيات والأدوار
  role: {
    type: String,
    enum: {
      values: ['admin', 'moderator', 'user'],
      message: 'الدور {VALUE} غير مسموح'
    },
    default: 'user'
  },
  
  // إدارة الأجهزة
  registeredDevices: [DeviceSchema],
  maxDevices: { type: Number, default: 3 },
  
  // الحالة والنشاط
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  loginCount: { type: Number, default: 0 },
  
  // الطوابع الزمنية
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// 🔐 تشفير كلمة المرور قبل الحفظ
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔍 مقارنة كلمات المرور
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 📱 التحقق من الجهاز
UserSchema.methods.isDeviceRegistered = function(deviceId) {
  return this.registeredDevices.some(device => device.deviceId === deviceId);
};

// ➕ إضافة جهاز جديد
UserSchema.methods.addDevice = function(deviceInfo) {
  if (this.registeredDevices.length >= this.maxDevices) {
    throw new Error('تجاوزت الحد الأقصى للأجهزة المسجلة');
  }
  
  this.registeredDevices.push({
    deviceId: deviceInfo.deviceId,
    userAgent: deviceInfo.userAgent,
    ipAddress: deviceInfo.ipAddress,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    isTrusted: deviceInfo.isTrusted || false
  });
};

module.exports = mongoose.model('User', UserSchema);
