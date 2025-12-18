const User = require('../models/User');
const LoginLog = require('../models/LoginLog');

// 🔐 وسيط المصادقة
const authenticate = async (req, res, next) => {
  try {
    // في النسخة البسيطة، نستخدم API Key في Header
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'مفتاح API مطلوب للوصول',
        code: 'API_KEY_REQUIRED'
      });
    }
    
    // البحث عن المستخدم بالمفتاح (في النسخة الحقيقية سيكون JWT)
    const user = await User.findOne({ 
      _id: apiKey, // مؤقتاً نستخدم الـ ID كمفتاح
      isActive: true 
    }).select('-password');
    
    if (!user) {
      // تسجيل محاولة دخول فاشلة
      await LoginLog.create({
        userId: null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failed',
        failureReason: 'invalid_api_key',
        isSuspicious: true
      });
      
      return res.status(401).json({
        success: false,
        error: 'مفتاح API غير صالح',
        code: 'INVALID_API_KEY'
      });
    }
    
    // تسجيل دخول ناجح
    await LoginLog.create({
      userId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      browser: parseUserAgent(req.headers['user-agent']).browser,
      os: parseUserAgent(req.headers['user-agent']).os,
      status: 'success'
    });
    
    // تحديث آخر دخول للمستخدم
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();
    
    // إضافة المستخدم للطلب
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error('❌ خطأ في المصادقة:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم أثناء المصادقة',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

// 👑 التحقق من الصلاحيات
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح بالوصول',
        code: 'UNAUTHORIZED'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'لا تملك الصلاحيات الكافية',
        requiredRoles: roles,
        userRole: req.user.role,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
};

// 📱 التحقق من الجهاز المسجل
const checkDevice = async (req, res, next) => {
  try {
    if (!req.user) return next();
    
    const userAgent = req.headers['user-agent'] || 'unknown';
    const deviceId = generateDeviceId(req);
    
    // التحقق إذا كان الجهاز مسجلاً
    const isRegistered = req.user.isDeviceRegistered(deviceId);
    
    if (!isRegistered && req.user.registeredDevices.length >= req.user.maxDevices) {
      return res.status(403).json({
        success: false,
        error: 'تم تجاوز الحد الأقصى للأجهزة المسجلة',
        maxDevices: req.user.maxDevices,
        code: 'DEVICE_LIMIT_EXCEEDED'
      });
    }
    
    // إضافة الجهاز إذا لم يكن مسجلاً
    if (!isRegistered) {
      req.user.addDevice({
        deviceId,
        userAgent,
        ipAddress: req.ip,
        browser: parseUserAgent(userAgent).browser,
        os: parseUserAgent(userAgent).os,
        isTrusted: false
      });
      
      await req.user.save();
      
      // إضافة علامة للطلب
      req.newDevice = true;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// 🔧 وظائف مساعدة
function generateDeviceId(req) {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || 'unknown';
  return Buffer.from(`${userAgent}:${ip}`).toString('base64').substring(0, 32);
}

function parseUserAgent(ua) {
  const browser = ua.includes('Chrome') ? 'Chrome' : 
                  ua.includes('Firefox') ? 'Firefox' : 
                  ua.includes('Safari') ? 'Safari' : 'Other';
  
  const os = ua.includes('Windows') ? 'Windows' :
             ua.includes('Mac') ? 'MacOS' :
             ua.includes('Linux') ? 'Linux' :
             ua.includes('Android') ? 'Android' :
             ua.includes('iOS') ? 'iOS' : 'Other';
  
  return { browser, os };
}

module.exports = {
  authenticate,
  requireRole,
  checkDevice
};
