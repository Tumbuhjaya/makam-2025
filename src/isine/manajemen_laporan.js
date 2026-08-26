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
router.get('/', cek_login,async function(req, res) {
  let tahun = 0
  if(req.query.tahun){
    tahun = req.query.tahun
  }else{
    tahun = new Date().getFullYear()
  }

    // let jan0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  1 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let jan4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  1 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let feb0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  2 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let feb4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  2 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let mar0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  3 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let mar4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  3 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let apr0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  4 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let apr4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  4 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let mei0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  5 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let mei4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  5 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let jun0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  6 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let jun4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  6 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let jul0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  7 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let jul4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  7 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let ags0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  8 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let ags4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  8 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let sep0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  9 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let sep4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  9 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let okt0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  10 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let okt4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  10 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let nov0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  11 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let nov4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  11 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let des0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  12 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let des4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  12 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode =1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let total0 = await sql_enak.raw(`SELECT * ,( SELECT SUM(p2.retribusi) as x from jenazah j left join permohonan p  on j.id  = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0  and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode =1 and m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let total4 = await sql_enak.raw(`SELECT * ,( SELECT SUM(p2.retribusi) as x from jenazah j left join permohonan p  on j.id  = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0  and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode =1 and m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // // console.log(jan0[0]);
    // let jan0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  1 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let jan4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  1 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let feb0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  2 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let feb4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  2 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let mar0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  3 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let mar4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  3 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let apr0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  4 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let apr4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  4 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let mei0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  5 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let mei4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  5 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let jun0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  6 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let jun4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  6 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let jul0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  7 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let jul4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  7 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let ags0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  8 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let ags4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  8 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let sep0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  9 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let sep4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  9 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let okt0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  10 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let okt4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  10 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let nov0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  11 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let nov4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  11 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let des0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  12 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let des4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0 and (SELECT DATE_FORMAT(p4.tanggal_surat , '%m') from perpanjangan p4 where p4.id = p2.id )=  12 and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode >1 AND m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let total0p = await sql_enak.raw(`SELECT * ,( SELECT SUM(p2.retribusi) as x from jenazah j left join permohonan p  on j.id  = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0  and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 0   and d.periode >1 and m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    // let total4p = await sql_enak.raw(`SELECT * ,( SELECT SUM(p2.retribusi) as x from jenazah j left join permohonan p  on j.id  = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC   LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.deleted = 0 and j.deleted = 0  and p2.status = 2  and p.deleted = 0  and  (SELECT DATE_FORMAT(p5.tanggal_surat , '%Y')  from perpanjangan p5 where p5.id = p2.id )= ${tahun} AND p.jns_pemakaman = 4   and d.periode >1 and m.master_makam_id = mm.id) as x from master_makam mm WHERE mm.deleted = 0`)
    
    let jan0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-01' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let jan4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-01' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let feb0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-02' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let feb4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-02' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let mar0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-03' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let mar4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-03' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let apr0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-04' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let apr4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-04' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let mei0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-05' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let mei4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-05' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let jun0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-06' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let jun4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-06' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let jul0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-07' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let jul4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-07' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let ags0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-08' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let ags4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-08' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let sep0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-09' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let sep4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-09' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let okt0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-10' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let okt4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-10' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let nov0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-11' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let nov4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-11' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let des0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-12' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let des4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-12' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let total0 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
    left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
    LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
    LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
    left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y') = '${tahun}' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
    WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let total4 = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
    left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
    LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
    LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode =1 and d.deleted = 0
    left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y') = '${tahun}' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
    WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    // console.log(jan0[0]);
    let jan0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-01' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let jan4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-01' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let feb0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-02' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let feb4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-02' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let mar0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-03' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let mar4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-03' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let apr0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-04' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let apr4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-04' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let mei0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-05' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let mei4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-05' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let jun0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-06' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let jun4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-06' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let jul0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-07' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let jul4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-07' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let ags0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-08' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let ags4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-08' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let sep0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-09' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let sep4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-09' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let okt0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-10' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let okt4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-10' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let nov0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-11' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let nov4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-11' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let des0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-12' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let des4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
          left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
          LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
          LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
          left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y-%m') = '${tahun}-12' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
          WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let total0p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
    left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 0   and p.deleted = 0
    LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
    LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
    left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y') = '${tahun}' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
    WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    let total4p = await sql_enak.raw(`SELECT * , (SELECT SUM(p2.retribusi) as x from jenazah j 
    left join  permohonan p  on j.id = p.jenazah_id and  p.jns_pemakaman = 4   and p.deleted = 0
    LEFT JOIN dokument d on d.jenazah_id = j.id   and d.periode >1 and d.deleted = 0
    LEFT JOIN makam m   on  j.makam_id= m.id  and m.deleted = 0
    left join (SELECT p3.id ,p3.tanggal_surat , p3.dokument_id, p3.status ,p3.retribusi,  p3.deleted  FROM perpanjangan p3 where  DATE_FORMAT(p3.tanggal_surat , '%Y') = '${tahun}' and p3.deleted = 0 and p3.status =2  ) as p2 on p2.dokument_id = d.id  
    WHERE  j.deleted = 0 and  p2.id  is not null  and m.master_makam_id = mm.id) as x from master_makam mm  WHERE mm.deleted = 0`)
    
    res.render('content-backoffice/manajemen_laporan/list',{tahun,total0,total4,total0p,total4p,jan0,jan4,feb0,feb4 ,mar0,mar4,apr0,apr4,mei0,mei4,jun0,jun4,jul0,jul4,ags0,ags4,sep0,sep4,okt0,okt4,nov0,nov4,des0,des4,jan0p,jan4p,feb0p,feb4p ,mar0p,mar4p,apr0p,apr4p,mei0p,mei4p,jun0p,jun4p,jul0p,jul4p,ags0p,ags4p,sep0p,sep4p,okt0p,okt4p,nov0p,nov4p,des0p,des4p}); 
});

router.get('/insert', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_laporan/insert'); 
});

router.get('/edit/:id', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_laporan/edit'); 
});

module.exports = router;
