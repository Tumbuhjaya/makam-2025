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
  let table = ''
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

var storage = require('../storage').storage;

var upload = multer({ storage: storage })

//start-------------------------------------
router.post('/submit_insert',upload.fields([{name:'foto_ktp_pemohon',maxCount:1},{name:'foto_ktp_jenazah',maxCount:1},{name:'surat_pemeriksaan',maxCount:1},{name:'surat_rumah_sakit',maxCount:1},{name:'surat_lurah',maxCount:1},{name:'surat_kematian',maxCount:1}]),async function(req, res) {
  const dokument = {}  
  const jenazah = {} 
  const permohonan = {}
  if (req.files) {
      if (req.files["surat_pemeriksaan"]) {
        var nama_file = req.files["surat_pemeriksaan"][0].filename;
        dokument["surat_pemeriksaan"] = nama_file;  
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
      if (req.files["foto_ktp_pemohon"]) {
        var nama_file = req.files["foto_ktp_pemohon"][0].filename;
        permohonan["foto_ktp_pemohon"] = nama_file;  
      }
      if (req.files["foto_ktp_jenazah"]) {
        var nama_file = req.files["foto_ktp_jenazah"][0].filename;
        jenazah["foto_ktp_jenazah"] = nama_file;  
      }
    }
    let x = await sql_enak.raw(`SELECT * FROM master_retribusi mr WHERE mr.jenis = ${req.body.jns_pemakaman}`)
    let insert_pin = ''
    let hasil = {idbiling:''}
    dokument.keterangan=req.body.keterangan


    permohonan.nama_ahli_waris=req.body.nama_ahli_waris
    permohonan.pekerjaan=req.body.pekerjaan
    permohonan.domisili=req.body.domisili_pemohon
    permohonan.alamat=req.body.alamat_pemohon
    permohonan.kec_id=req.body.kecamatan_pemohon
    permohonan.kel_id=req.body.kelurahan_pemohon
    permohonan.hp=req.body.hp
    permohonan.nik=req.body.nik
    permohonan.pin=insert_pin
    permohonan.jns_pemakaman=+(req.body.jns_pemakaman)
    permohonan.inserted = moment().format('YYYY-MM-DD')
    permohonan.email = req.body.email

    jenazah.nama_jenazah=req.body.nama_jenazah
    jenazah.jenis_kelamin=req.body.jenis_kelamin
    jenazah.agama=req.body.agama
    jenazah.nik_jenazah=req.body.nik_jenazah
    jenazah.domisili_jenazah=req.body.domisili_jenazah
    jenazah.tanggal_meninggal=req.body.tanggal_meninggal
    jenazah.tanggal_dimakamkan=req.body.tanggal_dimakamkan
    jenazah.makam_id=req.body.makam_id_permohonan
    jenazah.kec_id=req.body.kecamatan_jenazah
    jenazah.kel_id=req.body.kelurahan_jenazah
    jenazah.alamat=req.body.alamat_jenazah
    jenazah.inserted = moment().format('YYYY-MM-DD')
    jenazah.jam_dimakamkan = req.body.jam_dimakamkan
    const makam ={}
      makam.status_makam=1


    const perpanjangan = {}
    if (x[0][0].retribusi==0) {
      perpanjangan.status_pembayaran = 1
    }
      perpanjangan.retribusi = x[0][0].retribusi
      perpanjangan.kode_billing= hasil.idbiling
      let jenazah_id = 0
        sql_enak.insert(jenazah).into("jenazah").then(function (id) {
          jenazah_id=id
          permohonan.jenazah_id=jenazah_id
          sql_enak.insert(permohonan).into("permohonan").then(function (id) {
          dokument.jenazah_id=jenazah_id
          perpanjangan.permohonan_id = id
          sql_enak.insert(dokument).into("dokument").then( function (id) {
            perpanjangan.dokument_id = id
            perpanjangan.inserted_perpanjangan = moment().format('YYYY-MM-DD')
            sql_enak.insert(perpanjangan).into("perpanjangan").then(async function (id) {
            let isi_email_pemohon = ''
            let subject = ''
            let isi_email_admin_tpu = ''
            let isi_email_admin = ''
            if (req.body.jns_pemakaman == 0) {
              subject = 'Permohonan ijin penggunaan tanah makam/pemakaman jenazah'
              isi_email_admin = `Terdapat permohonan baru ijin makam/pemakaman pada TPU yang dikelola oleh pemerintah kota semarang.`
              isi_email_admin_tpu = `Terdapat permohonan baru ijin makam/pemakaman pada TPU yang anda kelola. Silahkan segera lakukan verfikasi data permohonan tersebut.`
            
             isi_email_pemohon =`Permohonan ijin penggunaan tanah makam/pemakaman jenazah anda berhasil terkirim. Silahkan tunggu verifikasi permohonan anda dari pengelola TPU terkait.`
            }else  if (req.body.jns_pemakaman == 4){
              subject = 'Permohonan ijin pemakaman tumpang'
              isi_email_admin = `Terdapat permohonan baru ijin pemakaman tumpang pada TPU yang dikelola oleh pemerintah kota semarang.`
              isi_email_admin_tpu = `Terdapat permohonan baru ijin pemakaman tumpang pada TPU yang anda kelola. Silahkan segera lakukan verfikasi data permohonan tersebut.`
              isi_email_pemohon =`Permohonan ijin pemakaman tumpang anda berhasil terkirim. Silahkan tunggu verifikasi permohonan anda dari pengelola TPU terkait.`

            }
            res.redirect(`/`)
            })
          })
        })
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

router.get('/list',async function(req, res) {
  let {id,limit,offset,count} = req.query
  let value = [0]
  let str =` and p.id > ?`
  let a = `  *,p.id as ${table}_id, DATE_FORMAT(p.insertedAt,'%d-%m-%Y') as tanggal , DATE_FORMAT(p.insertedAt ,'%Y-%m-%d') as tanggal_2     `
  if (id) {
      str += ` and p.id = ?`
      value.push(id)
  }
  if (count) {
    a = ` count(p.id) as jml `
  }
  str+='  ORDER BY p.insertedAt DESC '

  if (limit) {
    str += ` limit ${limit} `
  }
  if (offset) {
    str += ` offset ${offset} `
  }

  let sql = `SELECT  ${a}  FROM ${table} p  WHERE ISNULL(p.deletedAt) `+str
    await sql_enak.raw(sql,value).then(data=>{
      res.status(200).json({ status: 200, message: "sukses", data: data[0]})
   })
   .catch(err=>{
    console.log(err);
      res.status(500).json({ status: 500, message: "gagal", data: err})
   })
})

module.exports = router;
