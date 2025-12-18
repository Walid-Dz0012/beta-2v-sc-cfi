const mongoose = require('mongoose');

class Database {
  constructor() {
    this._connect();
  }
  
  _connect() {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/social_app_beta';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      w: 'majority'
    };
    
    mongoose.connect(MONGODB_URI, options)
      .then(() => {
        console.log('✅ قاعدة البيانات متصلة بنجاح');
        console.log(`📊 المضيف: ${mongoose.connection.host}`);
        console.log(`🗄️  قاعدة البيانات: ${mongoose.connection.name}`);
      })
      .catch(err => {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
        console.log('🔄 محاولة إعادة الاتصال خلال 5 ثوان...');
        setTimeout(() => this._connect(), 5000);
      });
    
    // أحداث الاتصال
    mongoose.connection.on('error', (err) => {
      console.error('❌ خطأ في اتصال MongoDB:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  تم قطع اتصال MongoDB');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 تم إعادة الاتصال بـ MongoDB');
    });
    
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('👋 تم إغلاق اتصال MongoDB بسبب إنهاء التطبيق');
      process.exit(0);
    });
  }
  
  // الحصول على حالة الاتصال
  getStatus() {
    return {
      connected: mongoose.connection.readyState === 1,
      host: mongoose.connection.host,
      database: mongoose.connection.name,
      models: Object.keys(mongoose.connection.models),
      readyState: mongoose.connection.readyState
    };
  }
}

module.exports = new Database();
