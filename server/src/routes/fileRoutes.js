const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const { authenticate, validate, upload } = require('../middleware');
const fileController = require('../controllers/fileController');

// 所有路由都需要认证
router.use(authenticate);

// 上传单个文件
router.post('/:type',
  upload.single('file'),
  fileController.uploadFile
);

// 上传多个文件
router.post('/:type/multiple',
  upload.array('files', 10), // 最多10个文件
  fileController.uploadFiles
);

// 获取文件列表
router.get('/:type',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  fileController.getFiles
);

// 获取文件信息
router.get('/:type/:filename',
  fileController.getFileInfo
);

// 删除文件
router.delete('/:type/:filename',
  fileController.deleteFile
);

module.exports = router;
