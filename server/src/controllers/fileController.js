const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// 配置文件存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.params.type || 'misc';
    const dir = path.join(__dirname, '../../uploads', type);
    
    // 确保目录存在
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 文件类型过滤
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    certificate: ['image/jpeg', 'image/png', 'application/pdf']
  };

  const type = req.params.type || 'misc';
  const allowed = allowedTypes[type] || allowedTypes.image;

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 配置上传中间件
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// 上传单个文件
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未找到上传的文件'
      });
    }

    const { type = 'misc' } = req.params;
    const { userId } = req.user;

    // 生成文件URL
    const fileUrl = `/uploads/${type}/${req.file.filename}`;

    // TODO: 保存文件记录到数据库

    logger.info(`File uploaded: ${fileUrl}`);

    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    logger.error('Upload file failed:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 上传多个文件
const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '未找到上传的文件'
      });
    }

    const { type = 'misc' } = req.params;
    const { userId } = req.user;

    // 处理上传的文件
    const uploadedFiles = req.files.map(file => ({
      url: `/uploads/${type}/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }));

    // TODO: 保存文件记录到数据库

    logger.info(`Multiple files uploaded: ${uploadedFiles.length} files`);

    res.json({
      success: true,
      message: '文件上传成功',
      data: uploadedFiles
    });
  } catch (error) {
    logger.error('Upload files failed:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 删除文件
const deleteFile = async (req, res) => {
  try {
    const { type, filename } = req.params;
    const { userId } = req.user;

    const filePath = path.join(__dirname, '../../uploads', type, filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // TODO: 检查文件所有权或权限

    // 删除文件
    fs.unlinkSync(filePath);

    // TODO: 从数据库中删除文件记录

    logger.info(`File deleted: ${filePath}`);

    res.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    logger.error('Delete file failed:', error);
    res.status(500).json({
      success: false,
      message: '文件删除失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取文件列表
const getFiles = async (req, res) => {
  try {
    const { type = 'misc' } = req.params;
    const { userId } = req.user;
    const { page = 1, limit = 20 } = req.query;

    // TODO: 从数据库获取文件列表
    const dir = path.join(__dirname, '../../uploads', type);
    
    // 确保目录存在
    if (!fs.existsSync(dir)) {
      return res.json({
        success: true,
        data: {
          files: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            pages: 0
          }
        }
      });
    }

    // 读取目录内容
    const files = fs.readdirSync(dir)
      .map(filename => {
        const filePath = path.join(dir, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          url: `/uploads/${type}/${filename}`,
          size: stats.size,
          createdAt: stats.birthtime,
          updatedAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    // 分页
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedFiles = files.slice(start, end);

    res.json({
      success: true,
      data: {
        files: paginatedFiles,
        pagination: {
          total: files.length,
          page: parseInt(page),
          pages: Math.ceil(files.length / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get files failed:', error);
    res.status(500).json({
      success: false,
      message: '获取文件列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取文件信息
const getFileInfo = async (req, res) => {
  try {
    const { type, filename } = req.params;
    const { userId } = req.user;

    const filePath = path.join(__dirname, '../../uploads', type, filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 获取文件信息
    const stats = fs.statSync(filePath);
    const fileInfo = {
      filename,
      url: `/uploads/${type}/${filename}`,
      size: stats.size,
      createdAt: stats.birthtime,
      updatedAt: stats.mtime
    };

    res.json({
      success: true,
      data: fileInfo
    });
  } catch (error) {
    logger.error('Get file info failed:', error);
    res.status(500).json({
      success: false,
      message: '获取文件信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  upload,
  uploadFile,
  uploadFiles,
  deleteFile,
  getFiles,
  getFileInfo
};
