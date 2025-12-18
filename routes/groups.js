const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

// 🏠 الحصول على جميع المجموعات
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, search } = req.query;
    const userId = req.user._id;
    
    // بناء الاستعلام
    const query = {};
    
    // حسب النوع والبحث
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // إذا لم يكن مسؤول، يرى فقط المجموعات العامة أو التي هو عضو فيها
    if (req.user.role !== 'admin') {
      query.$or = [
        { type: 'public' },
        { 'members.userId': userId }
      ];
    }
    
    const groups = await Group.find(query)
      .populate('createdBy', 'username email')
      .populate('members.userId', 'username email role')
      .sort({ lastActivity: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Group.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ خطأ في الحصول على المجموعات:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم',
      code: 'SERVER_ERROR'
    });
  }
});

// ➕ إنشاء مجموعة جديدة
router.post('/', authenticate, requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const { name, description, type = 'private', memberIds = [] } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'اسم المجموعة مطلوب',
        code: 'GROUP_NAME_REQUIRED'
      });
    }
    
    // التحقق من وجود المجموعة بنفس الاسم
    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        error: 'مجموعة بهذا الاسم موجودة مسبقاً',
        code: 'GROUP_EXISTS'
      });
    }
    
    // التحقق من صحة الأعضاء
    const validMembers = [];
    for (const memberId of memberIds) {
      const user = await User.findById(memberId);
      if (user && user.isActive) {
        validMembers.push({
          userId: memberId,
          role: 'member',
          joinedAt: new Date(),
          invitedBy: req.user._id
        });
      }
    }
    
    // إنشاء المجموعة
    const newGroup = new Group({
      name,
      description,
      type,
      createdBy: req.user._id,
      members: [
        {
          userId: req.user._id,
          role: 'admin',
          joinedAt: new Date(),
          permissions: {
            canPost: true,
            canComment: true,
            canInvite: true,
            canRemove: true,
            canManageSettings: true
          }
        },
        ...validMembers
      ]
    });
    
    await newGroup.save();
    
    // تحميل البيانات
    const populatedGroup = await Group.findById(newGroup._id)
      .populate('createdBy', 'username email')
      .populate('members.userId', 'username email role');
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء المجموعة بنجاح',
      data: { group: populatedGroup }
    });
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء المجموعة:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم أثناء إنشاء المجموعة',
      code: 'CREATE_GROUP_ERROR'
    });
  }
});

// 👥 الحصول على مجموعة محددة
router.get('/:groupId', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    
    const group = await Group.findById(groupId)
      .populate('createdBy', 'username email')
      .populate('members.userId', 'username email role')
      .populate('pendingInvites.userId', 'username email');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'المجموعة غير موجودة',
        code: 'GROUP_NOT_FOUND'
      });
    }
    
    // التحقق من الصلاحيات
    const isMember = group.members.some(m => m.userId._id.toString() === userId.toString());
    const isAdmin = req.user.role === 'admin';
    
    if (group.type === 'secret' && !isMember && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح بالوصول لهذه المجموعة',
        code: 'GROUP_ACCESS_DENIED'
      });
    }
    
    res.json({
      success: true,
      data: { group }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم',
      code: 'SERVER_ERROR'
    });
  }
});

// ➕ إضافة عضو للمجموعة
router.post('/:groupId/members', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId: newMemberId } = req.body;
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'المجموعة غير موجودة',
        code: 'GROUP_NOT_FOUND'
      });
    }
    
    // التحقق من صلاحيات المستخدم
    const userMembership = group.members.find(
      m => m.userId.toString() === req.user._id.toString()
    );
    
    const canInvite = req.user.role === 'admin' || 
      (userMembership && userMembership.permissions.canInvite);
    
    if (!canInvite) {
      return res.status(403).json({
        success: false,
        error: 'لا تملك صلاحية لإضافة أعضاء',
        code: 'NO_INVITE_PERMISSION'
      });
    }
    
    // التحقق من العضو الجديد
    const newUser = await User.findById(newMemberId);
    if (!newUser || !newUser.isActive) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود أو غير نشط',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // التحقق إذا كان عضو بالفعل
    const alreadyMember = group.members.some(
      m => m.userId.toString() === newMemberId
    );
    
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        error: 'المستخدم عضو بالفعل في المجموعة',
        code: 'ALREADY_MEMBER'
      });
    }
    
    // إضافة العضو
    group.members.push({
      userId: newMemberId,
      role: 'member',
      joinedAt: new Date(),
      invitedBy: req.user._id
    });
    
    await group.save();
    
    res.json({
      success: true,
      message: 'تم إضافة العضو بنجاح',
      data: { groupId, memberId: newMemberId }
    });
    
  } catch (error) {
    console.error('❌ خطأ في إضافة العضو:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم',
      code: 'SERVER_ERROR'
    });
  }
});

// 🗑️ حذف مجموعة
router.delete('/:groupId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findByIdAndDelete(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'المجموعة غير موجودة',
        code: 'GROUP_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف المجموعة بنجاح',
      data: { groupId }
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
