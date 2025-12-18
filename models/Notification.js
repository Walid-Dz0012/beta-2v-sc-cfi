const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // المستلم
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // المرسل
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // المحتوى
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // النوع والأولوية
  type: {
    type: String,
    enum: ['info', 'warning', 'alert', 'emergency', 'system'],
    default: 'info'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // الحالة
  status: {
    type: String,
    enum: ['unread', 'read', 'archived', 'deleted'],
    default: 'unread',
    index: true
  },
  
  // إعدادات التوصيل
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  
  // التتبع
  sentAt: { type: Date, default: Date.now },
  readAt: Date,
  expiresAt: Date,
  
  // بيانات إضافية
  metadata: mongoose.Schema.Types.Mixed,
  actionUrl: String,
  actionLabel: String
}, {
  timestamps: true
});

// 📊 مؤشرات
NotificationSchema.index({ recipient: 1, status: 1, sentAt: -1 });
NotificationSchema.index({ type: 1, priority: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // لحذف الإشعارات منتهية الصلاحية

module.exports = mongoose.model('Notification', NotificationSchema);
