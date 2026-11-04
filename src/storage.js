// Penyimpanan file upload.
// STORAGE_DRIVER=s3    -> object storage S3-compatible (AWS S3 / MinIO / GCS interop)
// STORAGE_DRIVER=local -> disk lokal public/foto/ (default, untuk development)
// Nama file (key) tetap Date.now()-originalname, jadi nilai di database dan URL /foto/<key> tidak berubah.
require('dotenv').config();
var fs = require('fs');
var path = require('path');

var DRIVER = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
var LOCAL_DIR = path.join(__dirname, '..', 'public', 'foto');
var BUCKET = process.env.S3_BUCKET;

var s3 = null;
var S3 = null;
if (DRIVER === 's3') {
  S3 = require('@aws-sdk/client-s3');
  s3 = new S3.S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || undefined,        // isi untuk MinIO, mis. http://127.0.0.1:9000
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY
    }
  });
} else if (!fs.existsSync(LOCAL_DIR)) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

// cegah path traversal (../../) dari nama file kiriman user
function safeKey(key) {
  return path.basename(String(key));
}

function streamToBuffer(stream) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    stream.on('data', function (c) { chunks.push(c); });
    stream.on('error', reject);
    stream.on('end', function () { resolve(Buffer.concat(chunks)); });
  });
}

async function putFile(key, buffer, contentType) {
  key = safeKey(key);
  if (s3) {
    await s3.send(new S3.PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }));
  } else {
    fs.writeFileSync(path.join(LOCAL_DIR, key), buffer);
  }
  return key;
}

async function getFile(key) {
  key = safeKey(key);
  if (s3) {
    var out = await s3.send(new S3.GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return streamToBuffer(out.Body);
  }
  return fs.readFileSync(path.join(LOCAL_DIR, key));
}

async function exists(key) {
  key = safeKey(key);
  if (s3) {
    try {
      await s3.send(new S3.HeadObjectCommand({ Bucket: BUCKET, Key: key }));
      return true;
    } catch (e) {
      return false;
    }
  }
  return fs.existsSync(path.join(LOCAL_DIR, key));
}

async function removeFile(key) {
  key = safeKey(key);
  if (s3) {
    await s3.send(new S3.DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } else if (fs.existsSync(path.join(LOCAL_DIR, key))) {
    fs.unlinkSync(path.join(LOCAL_DIR, key));
  }
}

// multer storage engine: req.file(s).filename tetap tersedia seperti diskStorage
var storage = {
  _handleFile: function (req, file, cb) {
    var key = safeKey(Date.now() + '-' + file.originalname);
    streamToBuffer(file.stream)
      .then(function (buf) { return putFile(key, buf, file.mimetype).then(function () { return buf.length; }); })
      .then(function (size) { cb(null, { filename: key, key: key, size: size }); })
      .catch(cb);
  },
  _removeFile: function (req, file, cb) {
    removeFile(file.filename).then(function () { cb(null); }).catch(cb);
  }
};

// GET /foto/:key -> ambil dari object storage (untuk driver local, express.static sudah melayani)
function serve(req, res, next) {
  if (!s3) return next();
  var key = safeKey(req.params.key);
  s3.send(new S3.GetObjectCommand({ Bucket: BUCKET, Key: key }))
    .then(function (out) {
      if (out.ContentType) res.set('Content-Type', out.ContentType);
      if (out.ContentLength) res.set('Content-Length', out.ContentLength);
      out.Body.pipe(res);
    })
    .catch(function () { res.status(404).send('File tidak ditemukan'); });
}

module.exports = {
  driver: DRIVER,
  storage: storage,
  putFile: putFile,
  getFile: getFile,
  exists: exists,
  removeFile: removeFile,
  serve: serve
};
