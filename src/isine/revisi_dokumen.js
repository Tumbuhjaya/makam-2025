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
var axios = require('axios');

var st = require('knex-postgis')(sql_enak);
path.join(__dirname, '/public/foto')
  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));
  var nodemailer = require('nodemailer')
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'makam.semarangkota@gmail.com',
     pass: '***REMOVED***'
    }
  })
  router.use(cookieParser() );
  router.use(passport.initialize());
  router.use(passport.session());
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
function kirimWa(hp,text) {
  // console.log(hp,text);
  return new Promise(async(y,t)=>{
    var config = {
      method: 'get',
      url: `http://survplus.id:8006/kirim_pesan/${hp}?pesan=${text}`,
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'  }
    };
     axios(config).then(function (response) {
      y(response.data)
    }).catch(err=>{
      y(err)
    });
  })
}
router.get('/:id',async function(req, res) {
  const data = await sql_enak.raw(`SELECT *, p.id as permohonan_id ,m.id as makam_id, j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id  ORDER by p3.id DESC  LIMIT 1) WHERE d.id =  ${req.params.id} and p.id = p2.permohonan_id `)
  res.render('content/revisi_dokumen',{data:data[0]}); 
});
router.post('/revisi',upload.fields([{name:'surat_pemeriksaan',maxCount:1},{name:'foto_ktp_pemohon',maxCount:1},{name:'foto_ktp_jenazah',maxCount:1},{name:'surat_rumah_sakit',maxCount:1},{name:'surat_lurah',maxCount:1},{name:'surat_kematian',maxCount:1}]),async function (req,res) {
  // const data = await sql_enak.raw(`SELECT * FROM perpanjangan p WHERE p.dokument_id =  ${req.body.id} ORDER by p.id DESC  limit 1 `)
  let dokument = {id:req.body.dokument_id}  
  let permohonan ={id:req.body.permohonan_id}
  let jenazah = {id:req.body.jenazah_id}
  if (req.files) {
      if (req.files["surat_pemeriksaan"]) {
        var nama_file = req.files["surat_pemeriksaan"][0].filename;
        dokument["surat_pemeriksaan"] = nama_file;  
      }
      if (req.files["foto_ktp_pemohon"]) {
        var nama_file = req.files["foto_ktp_pemohon"][0].filename;
        permohonan["foto_ktp_pemohon"] = nama_file;  
      }
      if (req.files["foto_ktp_jenazah"]) {
        var nama_file = req.files["foto_ktp_jenazah"][0].filename;
        jenazah["foto_ktp_jenazah"] = nama_file;  
      }
      if (req.files["surat_rumah_sakit"]) {
        var nama_file = req.files["surat_rumah_sakit"][0].filename;
        dokument["surat_rumah_sakit"] = nama_file;  
      }
      if (req.files["surat_lurah"]) {
        var nama_file = req.files["surat_lurah"][0].filename;
        dokument["surat_lurah"] = nama_file;  
      }
      if (req.files["surat_kematian"]) {
        var nama_file = req.files["surat_kematian"][0].filename;
        dokument["surat_kematian"] = nama_file;  
      }
    }
    let pemohon = await sql_enak.raw(`SELECT p.nama_ahli_waris,p.email FROM permohonan p WHERE id =${req.body.permohonan_id}  and p.deleted =0`)
    let admin = await sql_enak.raw(`SELECT * FROM user u WHERE u.is_admin = 1 and u.deleted = 0 limit 1`)
    let a = `Pemohon atas nama ${pemohon[0][0].nama_ahli_waris} telah melakukan revisi`
    let mailOption = {
      from: 'noreply@survplus.id',
      to: admin[0][0].email,
      subject: 'Telah Revisi',
      text: a
    }
    kirimWa(admin[0][0].telp,a)
    transporter.sendMail(mailOption, (err, data) => {
      if (err) {
        console.log(err, 'error!');
      } else {
        console.log('sukses!');
      }
    })
  await sql_enak("perpanjangan")
  .where("id", "=",  req.body.perpanjangan_id)
  .update({status:4})
  await sql_enak("dokument")
  .where("id", "=", req.body.dokument_id)
  .update(dokument)
  await sql_enak("permohonan")
  .where("id", "=", req.body.permohonan_id)
  .update(permohonan)
  await sql_enak("jenazah")
  .where("id", "=", req.body.jenazah_id)
  .update(jenazah)
  res.redirect('/')
})
module.exports = router;
