const mongoose = require('mongoose');

const GroupMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  role: {
    type: String,
    enum: ['admin', 'moderator', 'member'],
    default: 'member'
  },
  
  joinedAt: { type: Date, default: Date.now },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // صلاحيات داخل المجموعة
  permissions: {
    canPost: { type: Boolean, default: true },
    canComment: { type: Boolean, default: true },
    canInvite: { type: Boolean, default: false },
    canRemove: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false }
  },
  
  // إحصاءات
  postCount: { type: Number, default: 0 },
  lastActive: Date
});

const GroupSchema = new mongoose.Schema({
  // المعلومات الأساسية
  name: {
    type: String,
    required: [true, 'اسم المجموعة مطلوب'],
    trim: true,
    minlength: [2, 'اسم المجموعة يجب أن يكون حرفين على الأقل'],
    maxlength: [50, 'اسم المجموعة يجب أن لا يتجاوز 50 حرف']
  },
  
  description: {
    type: String,
    maxlength: [500, 'الوصف يجب أن لا يتجاوز 500 حرف']
  },
  
  // النوع والإعدادات
  type: {
    type: String,
    enum: ['public', 'private', 'secret'],
    default: 'private'
  },
  
  settings: {
    requireApproval: { type: Boolean, default: true },
    allowInvites: { type: Boolean, default: true },
    maxMembers: { type: Number, default: 100 },
    contentVisibility: {
      type: String,
      enum: ['members_only', 'public'],
      default: 'members_only'
    }
  },
  
  // الأعضاء والإدارة
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  members: [GroupMemberSchema],
  pendingInvites: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invitedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(+new Date() + 7*24*60*60*1000) } // أسبوع
  }],
  
  // المحتوى
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  
  // الإحصاءات
  memberCount: { type: Number, default: 0 },
  postCount: { type: Number, default: 0 },
  
  // الطوابع الزمنية
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastActivity: Date
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// 🔢 تحديث عداد الأعضاء تلقائياً
GroupSchema.pre('save', function(next) {
  this.memberCount = this.members.length;
  this.lastActivity = new Date();
  next();
});

// 📊 مؤشرات للبحث
GroupSchema.index({ name: 'text', description: 'text' });
GroupSchema.index({ createdBy: 1 });
GroupSchema.index({ 'members.userId': 1 });
GroupSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Group', GroupSchema);
