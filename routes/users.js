const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

// 👥 الحصول على جميع المستخدمين (للمسؤول فقط)
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    
    // بناء الاستعلام
    const query = { isActive: true };
    
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // التنفيذ مع التقسيم
    const users = await User.find(query)
      .select('-password -registeredDevices')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ خطأ في الحصول على المستخدمين:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم',
      code: 'SERVER_ERROR'
    });
  }
});

// ➕ إنشاء مستخدم جديد (للمسؤول فقط)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, role = 'user' } = req.body;
    
    // التحقق من البيانات
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        error: 'اسم المستخدم والبريد الإلكتروني مطلوبان',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    // التحقق من وجود المستخدم
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
    
    // توليد كلمة مرور عشوائية
    const generatePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    
    const tempPassword = generatePassword();
    
    // إنشاء المستخدم
    const newUser = new User({
      username,
      email,
      password: tempPassword, // سيتم تشفيرها تلقائياً
      role,
      isActive: true
    });
    
    await newUser.save();
    
    // إرجاع البيانات (بدون كلمة المرور)
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: {
        user: userResponse,
        temporaryPassword: tempPassword, // في الإنتاج، أرسلها بالبريد
        note: 'يجب تغيير كلمة المرور عند أول دخول'
      }
    });
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدم:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم أثناء إنشاء المستخدم',
      details: error.message,
      code: 'CREATE_USER_ERROR'
    });
  }
});

// 👤 الحصول على معلومات مستخدم محدد
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // المسؤول يمكنه رؤية الجميع، الآخرون فقط حساباتهم
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح بالوصول لهذا المستخدم',
        code: 'ACCESS_DENIED'
      });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم',
      code: 'SERVER_ERROR'
    });
  }
});

// ✏️ تحديث مستخدم
router.put('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // التحقق من الصلاحيات
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح بتحديث هذا المستخدم',
        code: 'UPDATE_DENIED'
      });
    }
    
    // منع تحديث بعض الحقول
    delete updates.password;
    delete updates._id;
    delete updates.createdAt;
    
    // التحقق من تحديث الدور (للمسؤول فقط)
    if (updates.role && req.user.role !== 'admin') {
      delete updates.role;
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح',
      data: { user }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم',
      code: 'SERVER_ERROR'
    });
  }
});

// 🗑️ حذف مستخدم (تعطيل)
router.delete('/:userId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // منع حذف المسؤول الرئيسي
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'لا يمكنك حذف حسابك الخاص',
        code: 'SELF_DELETE_NOT_ALLOWED'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'تم تعطيل المستخدم بنجاح',
      data: { userId: user._id }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم',
      code: 'SERVER_ERROR'
    });
  }
});

// 📱 إدارة أجهزة المستخدم
router.get('/:userId/devices', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح بالوصول',
        code: 'ACCESS_DENIED'
      });
    }
    
    const user = await User.findById(userId).select('registeredDevices maxDevices');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: {
        devices: user.registeredDevices,
        deviceCount: user.registeredDevices.length,
        maxDevices: user.maxDevices,
        canAddMore: user.registeredDevices.length < user.maxDevices
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
