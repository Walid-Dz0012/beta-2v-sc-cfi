#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// نموذج المستخدم (مبسط)
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean
});

const User = mongoose.model('User', UserSchema);

async function setupAdmin() {
  try {
    console.log('🔧 بدء إعداد المسؤول...');
    
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/social_app_beta');
    console.log('✅ متصل بقاعدة البيانات');
    
    // التحقق من وجود مسؤول
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  حساب المسؤول موجود بالفعل');
      console.log(`👤 اسم المستخدم: ${existingAdmin.username}`);
      console.log(`📧 البريد الإلكتروني: ${existingAdmin.email}`);
      console.log(`👑 الدور: ${existingAdmin.role}`);
      
      const update = process.argv.includes('--reset');
      if (update) {
        console.log('🔄 إعادة تعيين كلمة المرور...');
        const newPassword = process.argv[3] || 'AdminSecure123!';
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        existingAdmin.password = hashedPassword;
        await existingAdmin.save();
        console.log(`🔑 تم تعيين كلمة المرور الجديدة: ${newPassword}`);
      }
    } else {
      // إنشاء مسؤول جديد
      const adminPassword = process.argv[2] || 'AdminSecure123!';
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      const admin = new User({
        username: 'admin',
        email: 'admin@socialapp.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      
      await admin.save();
      
      console.log('✅ تم إنشاء حساب المسؤول بنجاح');
      console.log('================================');
      console.log(`👤 اسم المستخدم: admin`);
      console.log(`📧 البريد الإلكتروني: admin@socialapp.com`);
      console.log(`🔑 كلمة المرور: ${adminPassword}`);
      console.log(`👑 الدور: admin`);
      console.log('================================');
      console.log('⚠️  يحفظ هذه المعلومات في مكان آمن!');
    }
    
    // إحصاءات
    const userCount = await User.countDocuments();
    console.log(`📊 عدد المستخدمين في النظام: ${userCount}`);
    
    await mongoose.disconnect();
    console.log('✅ تم إنهاء الإعداد');
    
  } catch (error) {
    console.error('❌ خطأ في إعداد المسؤول:', error);
    process.exit(1);
  }
}

// تشغيل الإعداد
setupAdmin();
