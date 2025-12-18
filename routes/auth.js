const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const { authLimiter } = require('../middleware/rateLimit');

// 🔐 تسجيل الدخول
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password, userAgent, ipAddress } = req.body;
    
    // التحقق من البيانات
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'اسم المستخدم وكلمة المرور مطلوبان',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // البحث عن المستخدم
    const user = await User.findOne({ username, isActive: true })
      .select('+password'); // تضمين كلمة المرور
    
    if (!user) {
      await LoginLog.create({
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.headers['user-agent'],
        status: 'failed',
        failureReason: 'user_not_found',
        isSuspicious: true
      });
      
      return res.status(401).json({
        success: false,
        error: 'بيانات الدخول غير صحيحة',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // التحقق من كلمة المرور
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      await LoginLog.create({
        userId: user._id,
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.headers['user-agent'],
        status: 'failed',
        failureReason: 'wrong_password',
        isSuspicious: true
      });
      
      return res.status(401).json({
        success: false,
        error: 'بيانات الدخول غير صحيحة',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // تحديث المستخدم
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();
    
    // تسجيل الدخول الناجح
    const loginLog = await LoginLog.create({
      userId: user._id,
      ipAddress: ipAddress || req.ip,
      userAgent: userAgent || req.headers['user-agent'],
      status: 'success'
    });
    
    // التحقق من الجهاز
    const deviceInfo = {
      userAgent: userAgent || req.headers['user-agent'],
      ipAddress: ipAddress || req.ip
    };
    
    const deviceId = Buffer.from(`${deviceInfo.userAgent}:${deviceInfo.ipAddress}`)
      .toString('base64').substring(0, 32);
    
    const isDeviceRegistered = user.isDeviceRegistered(deviceId);
    
    // إرجاع البيانات
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount
        },
        session: {
          loginId: loginLog._id,
          deviceRegistered: isDeviceRegistered,
          deviceId: deviceId,
          newDevice: !isDeviceRegistered
        }
      }
    });
    
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم أثناء تسجيل الدخول',
      code: 'LOGIN_SERVER_ERROR'
    });
  }
});

// ℹ️ الحصول على معلومات الجلسة
router.get('/session', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'معرف المستخدم مطلوب',
        code: 'USER_ID_REQUIRED'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // الحصول على سجلات الدخول الأخيرة
    const recentLogs = await LoginLog.find({ userId })
      .sort({ loginTime: -1 })
      .limit(5)
      .select('loginTime ipAddress browser os status');
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          lastLogin: user.lastLogin,
          registeredDevices: user.registeredDevices.length
        },
        recentLogins: recentLogs,
        deviceLimit: user.maxDevices
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

// 🚪 تسجيل الخروج
router.post('/logout', async (req, res) => {
  try {
    const { loginId } = req.body;
    
    if (loginId) {
      await LoginLog.findByIdAndUpdate(loginId, {
        logoutTime: new Date(),
        sessionDuration: Math.floor((new Date() - new Date(loginLog.loginTime)) / 1000)
      });
    }
    
    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
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
