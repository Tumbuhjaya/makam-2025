var connection = require('../database').connection;
var express = require('express');
var router = express.Router();
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , static = require('serve-static')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , path = require('path')
  ,  sha1 = require('sha1');
  var sql_enak = require('../database/mysql_enak.js').connection;
  var cek_login = require('./login').cek_login;
  var cek_login_google = require('./login').cek_login_google;
  var dbgeo = require("dbgeo");
  var multer = require("multer");
  var st = require('knex-postgis')(sql_enak);
  var deasync = require('deasync');
  path.join(__dirname, '/public/foto')
  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));
  router.use(cookieParser() );
  router.use(passport.initialize());
  router.use(passport.session());
  let table = 'jenazah'
  router.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/foto/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now()+'-'+file.originalname)
  }
})

var upload = multer({ storage: storage })

//start-------------------------------------
router.post('/insert', upload.fields([{ name: 'foto_1', maxCount: 1 }, { name: 'foto_2', maxCount: 1 }]),async function(req, res) {

  let post = req.body

  post.insertedAt = new Date()
  post.lastUpdateAt = new Date()
 if (req.files) {
  if (req.files['foto_1']) {
    var nama_file = req.files['foto_1'][0].filename;
    post['foto_1'] = nama_file;
  }

  if (req.files['foto_2']) {
    var nama_file = req.files['foto_2'][0].filename;
    post['foto_2'] = nama_file;
  }
}
await sql_enak.insert(post).into(table).then(data=>{
    res.status(200).json({ status: 200, message: "sukses", data: data})
 })
 .catch(err=>{
  console.log(err,'err');
    res.status(500).json({ status: 500, message: "gagal", data: err})
 })
});

router.post('/edit', upload.fields([{ name: 'foto_1', maxCount: 1 }, { name: 'foto_2', maxCount: 1 }]),async function(req, res) {
  let post = req.body
  post.lastUpdateAt = new Date()
  if (req.files) {
    if (req.files['foto_1']) {
      var nama_file = req.files['foto_1'][0].filename;
      post['foto_1'] = nama_file;
    }
  
    if (req.files['foto_2']) {
      var nama_file = req.files['foto_2'][0].filename;
      post['foto_2'] = nama_file;
    }
  }
  await sql_enak(table).where(table+'_id','=',post[table+'_id']).update(post).then(data=>{
    res.status(200).json({ status: 200, message: "sukses", data: data})
 })
 .catch(err=>{
    res.status(500).json({ status: 500, message: "gagal", data: err})
 })
})
router.get('/hapus/:id',async function(req, res) {
  await sql_enak(table).where(table+'_id','=',req.params.id).update({deletedAt:new Date}).then(data=>{
    res.status(200).json({ status: 200, message: "sukses", data: data[0]})
 })
 .catch(err=>{
    res.status(500).json({ status: 500, message: "gagal", data: err})
 })
})

router.post('/list_jenazah_survey',cek_login,async function(req, res) {
    let {id,limit,offset,join}  = req.body
  let value = []
  let str =` AND ISNULL(p.makam_id) `
  let a = `  *,p.id as jenazah_id  , DATE_FORMAT(p.tanggal_dimakamkan,'%d-%m-%Y') as tanggal_dimakamkan2 , DATE_FORMAT(p.tanggal_dimakamkan,'%Y-%m-%d') as tanggal_dimakamkan `

  if (join) {
    str = ` AND m.join = ${join} `
  }
      if (req.user[0].is_admin==0) {
str+= ' and m.master_makam_id =  ' +req.user[0].master_makam_id
 }
   str+='  ORDER BY p.nama_jenazah  '

  let sql = `
    SELECT ${a}
    FROM (SELECT
    p.nama_jenazah,
    p.tanggal_dimakamkan,
    p.makam_id,p.id
FROM
    jenazah p
JOIN (
    SELECT
        makam_id,
        MIN(tanggal_dimakamkan) AS tanggal_terlama
    FROM
        jenazah
    WHERE
        deleted = 0 AND id > 88000
    GROUP BY
        makam_id
) AS t1
ON
    p.makam_id = t1.makam_id AND p.tanggal_dimakamkan = t1.tanggal_terlama
WHERE
    p.deleted = 0 AND p.id > 88000 ) as p23
    left join  ${table} p  on p.id = p23.id    LEFT JOIN makam m ON m.id = p.makam_id AND m.deleted = 0
    WHERE p.deleted = 0  AND p.id > 88000  ${str}`
    console.log(sql,value);
    
    await sql_enak.raw(sql,value).then(data=>{
      res.status(200).json({ status: 200, message: "sukses", data: data[0]})
   })
   .catch(err=>{
    console.log(err);
      res.status(500).json({ status: 500, message: "gagal", data: err})
   })
})
router.post('/list_jenazah_survey_makam_kosong',cek_login,async function(req, res) {
    let {id,limit,offset,join}  = req.body
  let value = []
  let str =` AND ISNULL(p.makam_id) `
  let a = `  *,p.id as jenazah_id  , DATE_FORMAT(p.tanggal_dimakamkan,'%d-%m-%Y') as tanggal_dimakamkan2 , DATE_FORMAT(p.tanggal_dimakamkan,'%Y-%m-%d') as tanggal_dimakamkan `

  if (join) {
    str = ` AND m.join = ${join} `
  }
//       if (req.user[0].is_admin==0) {
// str+= ' and m.master_makam_id =  ' +req.user[0].master_makam_id
//  }
   str+='  ORDER BY p.nama_jenazah  '

  let sql = `
    SELECT ${a}
FROM
    jenazah p
  LEFT JOIN makam m ON m.id = p.makam_id AND m.deleted = 0
    WHERE p.deleted = 0  AND p.id > 88000 and p.makam_id is null ${str}`
    console.log(sql,value);
    
    await sql_enak.raw(sql,value).then(data=>{
      res.status(200).json({ status: 200, message: "sukses", data: data[0]})
   })
   .catch(err=>{
    console.log(err);
      res.status(500).json({ status: 500, message: "gagal", data: err})
   })
})
router.post('/list_jenazah_survey_sync',cek_login,async function(req, res) {
    let {id,limit,offset,join}  = req.body
  let value = []
  let str =` AND ISNULL(p.makam_id) `
  let a = `  *,p.id as jenazah_id  , DATE_FORMAT(p.tanggal_dimakamkan,'%d-%m-%Y') as tanggal_dimakamkan2 , DATE_FORMAT(p.tanggal_dimakamkan,'%Y-%m-%d') as tanggal_dimakamkan `

  str+='  ORDER BY p.nama_jenazah  '
  if (join) {
    str = ` AND m.join = ${join} `
  }
      if (req.user[0].is_admin==0) {
str+= ' and m.master_makam_id =  ' +req.user[0].master_makam_id
 }
  let sql = `
    SELECT ${a}
    FROM (SELECT
    p.nama_jenazah,
    p.tanggal_dimakamkan,
    p.makam_id,p.id
FROM
    jenazah p
JOIN (
    SELECT
        makam_id,
        MIN(tanggal_dimakamkan) AS tanggal_terlama
    FROM
        jenazah
    WHERE
        deleted = 0 
    GROUP BY
        makam_id
) AS t1
ON
    p.makam_id = t1.makam_id AND p.tanggal_dimakamkan = t1.tanggal_terlama
WHERE
    p.deleted = 0  ) as p23
    left join  ${table} p  on p.id = p23.id    LEFT JOIN makam m ON m.id = p.makam_id AND m.deleted = 0
    WHERE p.deleted = 0   ${str}`
    console.log(sql,value);
    
    await sql_enak.raw(sql,value).then(data=>{
      res.status(200).json({ status: 200, message: "sukses", data: data[0]})
   })
   .catch(err=>{
    console.log(err);
      res.status(500).json({ status: 500, message: "gagal", data: err})
   })
})
router.post('/list_jenazah_survey_all',cek_login,async function(req, res) {
  let {id,limit,offset}  = req.body
  let value = []
  let str =` `
  let a = ` *,p.id as jenazah_id , DATE_FORMAT(p.tanggal_dimakamkan,'%d-%m-%Y') as tanggal_dimakamkan2 , DATE_FORMAT(p.tanggal_dimakamkan,'%Y-%m-%d') as tanggal_dimakamkan `

  str+='  ORDER BY p.nama_jenazah  '


  let sql = ` (
    SELECT ${a}
    FROM  ${table} p     LEFT JOIN makam m ON m.id = p.makam_id AND m.deleted = 0
    WHERE p.deleted = 0 AND ISNULL(p.makam_id) AND p.id > 88000  ${str}
)
UNION ALL
(
    SELECT ${a}
    FROM  ${table} p
    LEFT JOIN makam m ON m.id = p.makam_id AND m.deleted = 0
    WHERE p.deleted = 0 AND m.master_makam_id = ${req.user[0].master_makam_id} ${str}
);`
    await sql_enak.raw(sql,value).then(data=>{
      res.status(200).json({ status: 200, message: "sukses", data: data[0]})
   })
   .catch(err=>{
    console.log(err);
      res.status(500).json({ status: 500, message: "gagal", data: err})
   })
})
router.get('/list',async function(req, res) {
  let value = [0]
  let str =` and p.${table}_id > ?`
  let a = `  p.*,k.id_kec , k.id_kel , k.desa , k2.kecamatan , CASE
    WHEN p.jenis = 1 THEN 'Rumah Susun'
    WHEN p.jenis = 2 THEN 'Rumah Susun Pekerja'
    WHEN p.jenis = 3 THEN 'Rumah Deret'
    ELSE 'Lain - Lain' END as jenis_rusun , DATE_FORMAT(p.insertedAt,'%d-%m-%Y') as tanggal , DATE_FORMAT(p.insertedAt ,'%Y-%m-%d') as tanggal_2     `
  if (req.query.id) {
      str += ` and p. ${table}_id = ?`

      value.push(req.query.id)
  }
  str+='  ORDER BY p.insertedAt DESC '

  if (req.query.limit) {
    str += ` limit ? `
    value.push(req.query.limit)

  }
  if (req.query.offset) {
    str += ` offset ? `
    value.push(req.query.offset)
  }

  let sql = `SELECT  ${a}  FROM ${table} p left join kelurahan k on p.id_kel  = k.id_kelurahan left join kecamatan k2 on k2.id_kec = k.id_kec  WHERE ISNULL(p.deletedAt) `+str
    await sql_enak.raw(sql,value).then(data=>{
      res.status(200).json({ status: 200, message: "sukses", data: data[0]})
   })
   .catch(err=>{
    console.log(err);
      res.status(500).json({ status: 500, message: "gagal", data: err})
   })
})

module.exports = router;
