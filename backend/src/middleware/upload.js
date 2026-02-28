const util   = require('util');
const multer = require('multer');

const maxSize = 2 * 1024 * 1024;

const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSize },
}).single('file');

const uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;
