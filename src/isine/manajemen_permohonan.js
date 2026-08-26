var connection = require('../database').connection;
require('dotenv').config()

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
  var axios = require('axios');

  var cek_login = require('./login').cek_login;
  var cek_login_google = require('./login').cek_login_google;
  var dbgeo = require("dbgeo");
  var multer = require("multer");
  var st = require('knex-postgis')(sql_enak);
  var deasync = require('deasync');
  var moment = require("moment");
moment.locale('id')
  var nodemailer = require('nodemailer')
  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
     user: 'makam.semarangkota@gmail.com',
     pass: '***REMOVED***'
    }
  })
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
//billing
// const bearer = `QGnyjTnfSR1G76V1bDKEIAcXZ1UOeYi6qR2wiajcgjjC39fTR7E3gtHZ0jVwzwyfF2IGuFvxEykwtzdxwsiJD4fMO8FdMSfeP0nQ`
// const ip = `103.101.52.19:7200/retribusi/1.2.16.01`

// router.get({
//   url: ip,
//   headers: {
//      "Content-Type":"application/json",
//      "Authorization": `Bearer ${bearer}`
// }
// }, function (error, response) {
//   console.log("hiii");
//   console.log(response);
// });
// router.post({
//   url: ip,
//   body: {},
//   headers: {
//      "Content-Type":"application/json",
//      "Authorization": `Bearer ${bearer}`
// }
// }, function (error, response) {
//   console.log("hiii");
//   console.log(response);
// });
// Permohonan Pemakaman
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
router.get('/pemakaman', cek_login,async function(req, res) {
  // const data = await sql_enak.raw(`SELECT *,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id  WHERE p.jns_pemakaman =  0 and p.deleted = 0 `)
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.id = ${req.user[0].master_makam_id}`
  }
  let t =''
  if (req.query.status) {
    t = ` AND p2.status = ${req.query.status} `

  }else{
    t = ` AND p2.status != 2 `

  }
  // console.log(req.user[0]);
  const data = await sql_enak.raw(`SELECT *,j.blok,j.sub_blok,m.nama_tpu,k5.kecamatan as kecamatan_tpu,k.kecamatan as kecamatan_pemohon,k3.desa as kelurahan_pemohon,k2.kecamatan as kecamatan_jenazah,k4.desa as kelurahan_jenazah,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran
  ,CASE 
  when p2.status  = 0  then 'Belum Diverifikasi'
  when p2.status  = 1  then (SELECT CONCAT('Revisi , ',p2.catatan_revisi)) 
  when p2.status  = 2  then 'Disetujui'
  when p2.status  = 3  then 'Dibatalkan'
  when p2.status  = 4  then 'Telah di revisi user'
  END as status_permohonan
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id ,m.id as makam_id, j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id 
  from  jenazah j  
  left join permohonan p on j.id = p.jenazah_id   and p.deleted = 0
  LEFT JOIN dokument d on d.jenazah_id = j.id  and d.deleted = 0
  left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 and x2.status !=2 ) as  p2 on p2.dokument_id =d.id  
   left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id 
  left join master_makam m on m.id = j.tpu
   left join kecamatan k5 on k5.id_kecamatan = m.id_kec  
WHERE p.jns_pemakaman =  0 and j.kategori_tpu = 0 and j.deleted = 0 and p.deleted = 0  ${t} and j.verifikasi_perpanjangan = 0 and p.deleted = 0 ${o}  and p2.status !=3  and p.id = p2.permohonan_id  order by p.id desc`)
  res.render('content-backoffice/manajemen_permohonan_pemakaman/list',{data:data[0]});
  // res.json({data:data[0]}) 
});
router.get('/pemakaman_special', cek_login,async function(req, res) {
  // const data = await sql_enak.raw(`SELECT *,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id  WHERE p.jns_pemakaman =  0 and p.deleted = 0 `)
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
  let t =''
  if (req.query.status) {
    t = ` AND p2.status = ${req.query.status} `

  }else{
    t = ` AND p2.status != 2 `

  }
  // console.log(req.user[0]);
  const data = await sql_enak.raw(`SELECT *,m.kecamatan as kecamatan_tpu,k.kecamatan as kecamatan_pemohon,k3.desa as kelurahan_pemohon,k2.kecamatan as kecamatan_jenazah,k4.desa as kelurahan_jenazah,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran
  ,CASE 
  when p2.status  = 0  then 'Belum Diverifikasi'
  when p2.status  = 1  then (SELECT CONCAT('Revisi , ',p2.catatan_revisi)) 
  when p2.status  = 2  then 'Disetujui'
  when p2.status  = 3  then 'Dibatalkan'
  when p2.status  = 4  then 'Telah di revisi user'
  END as status_permohonan
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id ,m.id as makam_id, j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id 
  from  jenazah j  
  left join permohonan p on j.id = p.jenazah_id   and p.deleted = 0
  LEFT JOIN dokument d on d.jenazah_id = j.id  and d.deleted = 0
    LEFT join makam_tambahan mt on mt.id = j.makam_id and mt.deleted = 0
  LEFT join makam m on m.id = mt.makam_id and m.deleted = 0
  left join master_makam mm on mm.id = m.master_makam_id and mm.deleted = 0
  left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 and x2.status !=2 ) as  p2 on p2.dokument_id =d.id  
   left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id 
WHERE p.jns_pemakaman =  0 and j.deleted = 0 and p.deleted = 0  ${t} and j.verifikasi_perpanjangan = 0 and p.deleted = 0 ${o}  and p2.status !=3  and p.id = p2.permohonan_id  order by p.id desc`)
  res.render('content-backoffice/manajemen_permohonan_pemakaman/list_special',{data:data[0]}); 
});

router.get('/pemakaman/verifikasi/:id', cek_login,async function(req, res) {
  // const data = await sql_enak.raw(`SELECT *,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id  WHERE p.jns_pemakaman =  0 and p.deleted = 0 and p.id = ${req.params.id}`)
  const data = await sql_enak.raw(`SELECT *,d.keterangan as ket,DATE_FORMAT(p2.tanggal_surat , '%Y-%m-%d') as tanggal_surat,p.alamat as alamat_pemohon , j.alamat as alamat_jenazah,p.kec_id as kec_pemohon,p.kel_id as kel_pemohon ,j.kec_id as kec_jenazah,j.kel_id as kel_jenazah ,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted,p2.id as perpanjangan_id ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id , m.id_kec as kecamatan_makam,m.nama_tpu as lokasi_makam , j.blok as blok_makam , j.sub_blok as subblok_makam ,j.agama as agama_jenazah ,d.keterangan as ket ,j.blok ,j.sub_blok,m.id as master_makam_id
from  jenazah j  
left join (select p.jenazah_id ,max(p.id)  as permohonan_id 
from permohonan p where deleted = 0 group by p.jenazah_id) as p3 on p3.jenazah_id = j.id
left join permohonan p on p.id = p3.permohonan_id   
LEFT JOIN dokument d on d.jenazah_id = j.id 
left join master_makam m on m.id = j.tpu
   left join kecamatan k5 on k5.id_kecamatan = m.id_kec  
left join (select p.dokument_id ,max(p.id)  as perpanjangan_id 
from perpanjangan p where deleted = 0 group by p.dokument_id) as p4 on p4.dokument_id = d.id
LEFT JOIN perpanjangan p2 on p4.perpanjangan_id = p2.id AND p2.status != 2 
WHERE p.jns_pemakaman =  0 and j.deleted = 0  and p.deleted = 0  and p.id = p2.permohonan_id and j.juuid ='${req.params.id}'`)
  const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")
  const lokasi = await sql_enak.raw(`SELECT * FROM master_makam mm  WHERE mm.deleted = 0  and mm.id = ${data[0][0].tpu} `)
  const blok = await sql_enak.raw(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0    and m.master_makam_id = '${data[0][0].tpu}'`)
  const sub_blok = await sql_enak.raw(`SELECT DISTINCT  m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 and m.master_makam_id = '${data[0][0].tpu}'  and m.blok =   '${data[0][0].blok}' `)
  const no_liang = await sql_enak.raw(`SELECT  DISTINCT m.id,m.no_liang  as no_liang  FROM makam m left join (select count(id) as cnt , makam_id from jenazah where deleted = 0 and makam_id is not null and makam_id !=0 group by makam_id  ) as a on a.makam_id = m.id  WHERE (m.id =${data[0][0].makam_id||0 } or  (m.deleted = 0 and m.jns_makam !=2 and a.cnt is null))  and m.nama_tpu = '${data[0][0].makam_id?data[0][0].nama_tpu:data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].makam_id?data[0][0].blok:data[0][0].blok_makam}'  and m.sub_blok  = '${data[0][0].makam_id?data[0][0].sub_blok:data[0][0].subblok_makam}' order by CAST(no_liang AS SIGNED)`) 
  console.log(`SELECT  DISTINCT m.id,m.no_liang  as no_liang  FROM makam m left join (select count(id) as cnt , makam_id from jenazah where deleted = 0 and makam_id is not null and makam_id !=0 group by makam_id  ) as a on a.makam_id = m.id  WHERE (m.id =${data[0][0].makam_id||0 } or  (m.deleted = 0 and m.jns_makam !=2 and a.cnt is null))  and m.master_makam_id = '${data[0][0].makam_id?data[0][0].tpu:data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].makam_id?data[0][0].blok:data[0][0].blok_makam}'  and m.sub_blok  = '${data[0][0].makam_id?data[0][0].sub_blok:data[0][0].subblok_makam}' order by CAST(no_liang AS SIGNED)`,'aaaaaaaaa');
  
  let x = sub_blok[0].sort((a,b)=>a.subblok.substring(1,a.subblok.length)-b.subblok.substring(1,b.subblok.length))
  // console.log(data[0][0]);
    const cluster = await sql_enak.raw(`SELECT distinct agama  FROM makam m WHERE m.deleted = 0  and m.master_makam_id = '${data[0][0].tpu}'  and m.blok =   '${data[0][0].blok}'  and m.sub_blok  = '${data[0][0].sub_blok}'  order by m.no_liang asc`)
console.log( cluster[0][0] , ' cluster[0][0]');

    data[0][0].cluster = cluster[0][0].agama
    const cluster_tpu = await sql_enak.raw(`SELECT distinct agama  FROM makam m WHERE m.deleted = 0  and m.master_makam_id = '${data[0][0].tpu}'  and m.blok =   '${data[0][0].blok}'  and m.sub_blok  = '${data[0][0].sub_blok}'  order by m.no_liang asc`)
let list_cluster = cluster_tpu[0]
console.log(data[0]);

  res.render('content-backoffice/manajemen_permohonan_pemakaman/verifikasi' , {list_cluster,data:data[0],kec:kec[0],lokasi:lokasi[0],blok:blok[0],sub_blok:x,no_liang:no_liang[0]}); 
});
router.get('/pemakaman/insert', cek_login,async function(req, res) {
 const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")

  res.render('content-backoffice/manajemen_permohonan_pemakaman/insert' , {kec:kec[0]}); 
});
router.get('/pemakaman/bergota_insert', cek_login,async function(req, res) {
  let kec = await sql_enak.raw(`SELECT * from kecamatan k where k.id_kec in ((select id_kec from master_makam m where m.deleted = 0 and m.id = 5820))`)

  res.render('content-backoffice/manajemen_permohonan_pemakaman/bergota_insert' , {kec:kec[0]}); 
});
router.get('/pesan_tempat_makam', cek_login,async function(req, res) {
  const data = await sql_enak.raw(`SELECT *,m.kecamatan as kecamatan_tpu,CASE 
  when p2.status  = 0  then 'Belum Diverifikasi'
  when p2.status  = 2  then 'Disetujui'
  when p2.status  = 3  then 'Dibatalkan'
  END as status_permohonan,
  p.alamat as alamat_pemohon
  ,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,p.id as pemohon_id,m.id as makam_id  FROM pemohon p left join makam m on p.makam_id = m.id LEFT JOIN jenazah j on j.pemohon_id = p.id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and p2.id = (SELECT p3.id FROM perpanjangan p3 where p3.dokument_id = d.id AND  p3.status !=2 ORDER by p3.id DESC limit 1) WHERE p.deleted = 0 and p2.status  !=2 and j.verifikasi_perpanjangan = 0  and p.deleted = 0 order by p.id desc`)
  res.render('content-backoffice/manajemen_permohonan_pesan_tempat/list',{data:data[0]}); 
});

router.get('/pesan_tempat_makam/verifikasi/:id', cek_login,async function(req, res) {
  const data = await sql_enak.raw(`SELECT *,d.keterangan as ket ,p.alamat as alamat_pemohon,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted ,p.id as pemohon_id , m.id as makam_id ,p2.id as perpanjangan_id , j.id as jenazah_id , d.id as dokument_id FROM pemohon p left join jenazah j on j.pemohon_id = p.id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id ORDER by p3.id DESC  LIMIT 1)  left join makam m on p.makam_id = m.id WHERE p.deleted = 0 and p.puuid ='${req.params.id}'`)
  const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")
  res.render('content-backoffice/manajemen_permohonan_pesan_tempat/verifikasi',{data:data[0],kec:kec[0]}); 
});

router.get('/makam_tumpang', cek_login,async function(req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
  if (req.query.status) {
    t = ` AND p2.status = ${req.query.status} `

  }else{
    t = ` AND p2.status != 2 `

  }
  // console.log(req.user[0]);
  // const data = await sql_enak.raw(`SELECT *,CASE 
  // when p2.status_pembayaran = 0  then 'Belum Dibayar'
  // when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  // END as status_pembayaran
  // ,CASE 
  // when p2.status  = 0  then 'Belum Diverifikasi'
  // when p2.status  = 1  then (SELECT CONCAT('Revisi , ',p2.catatan_revisi)) 
  // when p2.status  = 2  then 'Disetujui'
  // when p2.status  = 3  then 'Dibatalkan'
  // when p2.status  = 4  then 'Telah di revisi user'
  // END as status_permohonan
  // ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id ,m.id as makam_id, j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id AND p2.status != 2  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status !=2 ORDER by p3.id DESC  LIMIT 1) WHERE p.jns_pemakaman =  4 and p.deleted = 0  ${t} and j.verifikasi_perpanjangan = 0  and p.deleted = 0 ${o}  and p2.status !=3  and p.id = p2.permohonan_id  order by p.id desc`)
   const data = await sql_enak.raw(`SELECT *,m.kecamatan as kecamatan_tpu,k.kecamatan as kecamatan_pemohon,k3.desa as kelurahan_pemohon,k2.kecamatan as kecamatan_jenazah,k4.desa as kelurahan_jenazah,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran
  ,CASE 
  when p2.status  = 0  then 'Belum Diverifikasi'
  when p2.status  = 1  then (SELECT CONCAT('Revisi , ',p2.catatan_revisi)) 
  when p2.status  = 2  then 'Disetujui'
  when p2.status  = 3  then 'Dibatalkan'
  when p2.status  = 4  then 'Telah di revisi user'
  END as status_permohonan
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id ,m.id as makam_id, j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id 
  from  jenazah j  
  left join permohonan p on j.id = p.jenazah_id  

  LEFT JOIN dokument d on d.jenazah_id = j.id 
  LEFT join makam m on m.id = j.makam_id 
  left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 and x2.status !=2 ) as  p2 on p2.dokument_id =d.id  
   left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id 
WHERE p.jns_pemakaman =  4 and j.deleted = 0 and p.deleted = 0  ${t} and j.verifikasi_perpanjangan = 0 and p.deleted = 0 ${o}  and p2.status !=3  and p.id = p2.permohonan_id  order by p.id desc`)
  res.render('content-backoffice/manajemen_permohonan_makam_tumpang/list',{data:data[0]}); 
});
router.get('/makam_tumpang/insert', cek_login,async function(req, res) {
    const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")

    res.render('content-backoffice/manajemen_permohonan_makam_tumpang/insert',{kec:kec[0]}); 

})
router.get('/makam_tumpang/verifikasi/:id', cek_login,async function(req, res) {
  const data = await sql_enak.raw(`SELECT *,d.keterangan as ket,m.agama as cluster,m.id_kec as kecamatan_makam ,m.nama_tpu as lokasi_makam ,m.blok as blok_makam , m.sub_blok as subblok_makam ,m.no_liang as nomor_liang_makam,DATE_FORMAT(p2.tanggal_surat , '%Y-%m-%d') as tanggal_surat,p.alamat as alamat_pemohon , j.alamat as alamat_jenazah,p.kec_id as kec_pemohon,p.kel_id as kel_pemohon,m.id as makam_id,j.agama as agama_jenazah ,j.kec_id as kec_jenazah,j.kel_id as kel_jenazah ,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted,p2.id as perpanjangan_id ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id AND p2.status != 2 WHERE p.jns_pemakaman =  4 and j.deleted = 0  and p.deleted = 0  and p.id = p2.permohonan_id and j.juuid ='${req.params.id}'`)
  const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")
  const lokasi = await sql_enak.raw(`SELECT * FROM master_makam mm  WHERE mm.deleted = 0   and mm.id = ${data[0][0].master_makam_id} `)
  const blok = await sql_enak.raw(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0    and m.nama_tpu = '${data[0][0].lokasi_makam}'`)
  const sub_blok = await sql_enak.raw(`SELECT DISTINCT  m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 and m.nama_tpu = '${data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].blok_makam}' `)
  const no_liang = await sql_enak.raw(`SELECT  m.id,m.no_liang  as no_liang  FROM makam m WHERE m.deleted = 0  and m.status_tumpang =1  and m.nama_tpu = '${data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].blok_makam}'  and m.sub_blok  = '${data[0][0].subblok_makam}'  order by m.no_liang asc`)
  let x = sub_blok[0].sort((a,b)=>a.subblok.substring(1,a.subblok.length)-b.subblok.substring(1,b.subblok.length))
  
  res.render('content-backoffice/manajemen_permohonan_makam_tumpang/verifikasi',{no_liang:no_liang[0],sub_blok:x,blok:blok[0],lokasi:lokasi[0],data:data[0],kec:kec[0]}); 
});

router.post(`/submit_verifikasi`,upload.fields([{name:'foto_ktp_pemohon',maxCount:1},{name:'foto_ktp_jenazah',maxCount:1},{name:'surat_pemeriksaan',maxCount:1},{name:'surat_rumah_sakit',maxCount:1},{name:'surat_lurah',maxCount:1},{name:'surat_kematian',maxCount:1}]),async function (req,res) {
  const permohonan = {}
  const jenazah ={}
  const dokument = {}
  const perpanjangan = {}
  const log={}
  const makam = {}
  dokument["id"] = req.body.dokument_id;  
  dokument.keterangan = req.body.keterangan
  console.log(req.body,'submit_verifikasi');
      if (!req.body.nomor_liang_makam&&req.body.verifikasi=='2') {
     res.json(`Pastikan makam ter isi`)
}
  if (req.body.jns_pemakaman == 0) {
    let zxc = await sql_enak.raw(`SELECT j.makam_id  FROM jenazah j WHERE j.id = ${req.body.jenazah_id}`)

  }

  

  log.permohonan_id = req.body.permohonan_id


  perpanjangan.nomor_surat=req.body.nomor_surat
  perpanjangan.status=+req.body.verifikasi
  perpanjangan.catatan_revisi=req.body.catatan_revisi

  if(req.body.verifikasi=='3' && req.body.jns_pemakaman ==0){
        if (req.body.nomor_liang_makam) {

      await sql_enak("makam")
      .where("id", "=", req.body.nomor_liang_makam)
      .update({status_makam:0})
        
      await sql_enak("jenazah")
      .where("id", "=", req.body.jenazah_id)
      .update({deleted :1})
        }
  }
  if (req.body.verifikasi!='3') {
    await sql_enak("jenazah")
    .where("id", "=", req.body.jenazah_id)
    .update({deleted :0})
  }
  if(req.body.verifikasi=='2'){
          makam.status_makam=2

    await sql_enak("makam")
    .where("id", "=", req.body.nomor_liang_makam)
    .update(makam)
        if (req.body.nomor_liang_makam) {

    if (req.body.jns_pemakaman ==0) {
      await sql_enak("makam")
      .where("id", "=", req.body.nomor_liang_makam)
      .update({jumlah_jenazah:1})
    }else{
      let jumlah_jenazah = await sql_enak.raw(`SELECT m.jumlah_jenazah  FROM makam m WHERE  m.id = ${req.body.nomor_liang_makam}`)
      await sql_enak("makam")
      .where("id", "=", req.body.makam_id)
      .update({jumlah_jenazah:jumlah_jenazah[0][0].jumlah_jenazah+1})
    }
  }
 
  }
  await sql_enak("perpanjangan")
  .where("id", "=", req.body.perpanjangan_id)
  .update(perpanjangan)
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
  // jenazah.verifikasi= +req.body.verifikasi
  permohonan.nama_ahli_waris=req.body.nama_ahli_waris
  permohonan.pekerjaan=req.body.pekerjaan
  permohonan.nik=req.body.nik
  permohonan.domisili=req.body.domisili_pemohon
  permohonan.alamat=req.body.alamat_pemohon
  permohonan.kec_id=req.body.kecamatan_pemohon
  permohonan.kel_id=req.body.kelurahan_pemohon
  permohonan.hp=req.body.hp
  permohonan.email=req.body.email

  // permohonan.pin=insert_pin
  permohonan.jns_pemakaman=+(req.body.jns_pemakaman)
  jenazah.nama_jenazah=req.body.nama_jenazah
  jenazah.jenis_kelamin=req.body.jenis_kelamin
  jenazah.agama=req.body.agama
  jenazah.domisili_jenazah=req.body.domisili_jenazah
  jenazah.tanggal_meninggal=req.body.tanggal_meninggal
  jenazah.tanggal_dimakamkan=req.body.tanggal_dimakamkan
  jenazah.makam_id=req.body.verifikasi!='2'&&req.body.jns_pemakaman==0?0:req.body.nomor_liang_makam
  jenazah.kec_id=req.body.kecamatan_jenazah
  jenazah.kel_id=req.body.kelurahan_jenazah
  jenazah.alamat=req.body.alamat_jenazah
  jenazah.nik_jenazah=req.body.nik_jenazah

  // jenazah.catatan_revisi=req.body.catatan_revisi
  // jenazah.kode_billing= hasil.idbiling
  await sql_enak("jenazah")
  .where("id", "=", req.body.jenazah_id)
  .update(jenazah)
  await sql_enak("dokument")
  .where("id", "=", req.body.dokument_id)
  .update(dokument)
  await sql_enak("permohonan")
  .where("id", "=", req.body.permohonan_id)
  .update(permohonan)
  await sql_enak("perpanjangan")
  .where("id", "=", req.body.perpanjangan_id)
  .update(perpanjangan)
  let text_email = ''
  let subject_email = ''
  if (req.body.verifikasi=='1') {
    text_email = `Silahkan lengkapi persyaratan permohonan ijin anda melalui link berikut ini : "https://makam.semarangkota.go.id/revisi_dokumen/${req.body.dokument_id}"`
    subject_email = 'Permohonanan ijin direvisi'
  }else   if (req.body.verifikasi=='2') {
    if (req.body.jns_pemakaman == '0') {
      subject_email = 'Permohonan ijin penggunaan tanah makam/pemakaman jenazah disetujui'
      text_email = `Permohonan ijin penggunaan tanah makam/pemakaman jenazah anda telah disetujui oleh pengelola TPU, silahkan melakukan pemakaman jenazah sesuai dengan permohonan yang telah setujui ini. Untuk SK ijin penggunaan tanah makam/pemakaman jenazah akan kami kirimkan melalui email ini.`
    }else{
      subject_email = 'Permohonan ijin pemakaman tumpang disetujui'
      text_email = `Permohonan ijin pemakaman tumpang anda telah disetujui oleh pengelola TPU, silahkan melakukan pemakaman jenazah tumpang sesuai dengan permohonan yang telah setujui ini. Untuk SK ijin pemakaman tumpang akan kami kirimkan melalui email ini.`
    }
    
  }else   if (req.body.verifikasi=='3') {
    if (req.body.jns_pemakaman == '0') {
      text_email = `Permohonan ijin penggunaan tanah makam/pemakaman jenazah dibatalkan`
    }else{
      text_email = `Permohonan ijin pemakaman tumpang dibatalkan`
    }
    subject_email = 'Permohonan ijin dibatalkan'

  }
  // console.log(req.body.hp,text_email);
  // let hasilWa =await kirimWa(req.body.hp,text_email)
  // console.log(hasilWa);
  let mailOption = {
    from: 'noreply@survplus.id',
    to: req.body.email,
    subject: subject_email,
    text: text_email
  }
  if (req.body.verifikasi!='0') {

  transporter.sendMail(mailOption, (err, data) => {
    if (err) {
      console.log(err, 'error!');
    } else {
      console.log('sukses!');
    }
  })
}
  if (req.body.jns_pemakaman == 0) {
    res.redirect(`/manajemen_permohonan/pemakaman`)
  } else if (req.body.jns_pemakaman == 4) {
     res.redirect(`/manajemen_permohonan/makam_tumpang`)
  }

  

})
router.post('/submit_insert',upload.fields([{name:'foto_ktp_pemohon',maxCount:1},{name:'foto_ktp_jenazah',maxCount:1},{name:'surat_pemeriksaan',maxCount:1},{name:'surat_rumah_sakit',maxCount:1},{name:'surat_lurah',maxCount:1},{name:'surat_kematian',maxCount:1}]),async function(req, res) {
  const dokument = {}  
  const jenazah = {} 
  const permohonan = {}
  // console.log(req.body);
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
    let q = `SELECT * from makam m WHERE m.id = ${req.body.makam_id_permohonan}`
    let cek_makam = await sql_enak.raw(q)
    if(cek_makam[0].length>0){
    let insert_pin = await get_pin()
    let hasil = {idbiling:''}
    if (x[0][0].retribusi>0) {
      hasil = await getIdBilling(x[0][0].retribusi,cek_makam[0],'permohonan');
    }
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
    // if (req.body.jns_pemakaman==0 &&cek_makam[0][0].master_makam_id!=process.env.MAKAM_BERGOTA) {
      makam.status_makam=1
    // }


    const perpanjangan = {}
    if (x[0][0].retribusi==0) {
      perpanjangan.status_pembayaran = 1
    }
      perpanjangan.retribusi = x[0][0].retribusi
      perpanjangan.kode_billing= hasil.idbiling
    // console.log(jenazah,'jenazah',permohonan,'permohonan',makam,'makam',perpanjangan,'perpanjangan')
    if (req.body.jns_pemakaman==0) {
      await sql_enak("makam")
      .where("id", "=", req.body.makam_id_permohonan)
      .update(makam)
            
    }
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
              if (req.body.jns_pemakaman == 0) {
                res.redirect(`/manajemen_permohonan/pemakaman`)
              } else if (req.body.jns_pemakaman == 4) {
                res.redirect(`/manajemen_permohonan/makam_tumpang`)
              }
            })
          })
        })
    })
  }else{
    res.json({message:'Liang telah terisi'})
  }
});
router.post(`/submit_edit`,upload.fields([{name:'foto_ktp_pemohon',maxCount:1},{name:'sk_lama',maxCount:1},{name:'foto_ktp_jenazah',maxCount:1},{name:'surat_pemeriksaan',maxCount:1},{name:'surat_rumah_sakit',maxCount:1},{name:'surat_lurah',maxCount:1},{name:'surat_kematian',maxCount:1}]),async function (req,res) {
  const permohonan = {}
  const jenazah ={}
  const dokument = {}
  const perpanjangan = {}
  dokument["id"] = req.body.dokument_id;  
  dokument.keterangan = req.body.keterangan
  let tujuan = req.body.tujuan
  delete req.body.tujuan 
  let makam_sebelum = await sql_enak.raw(`SELECT * FROM makam m WHERE id = `+req.body.makam_sebelum)
  console.log(makam_sebelum[0][0],'makam_sebelum');
  let makam_Sesudah = await sql_enak.raw(`SELECT * FROM makam m WHERE id = `+req.body.nomor_liang_makam)
  console.log(makam_Sesudah[0][0],'makam_Sesudah');

  if (req.files) {
    if (req.files["surat_pemeriksaan"]) {
      var nama_file = req.files["surat_pemeriksaan"][0].filename;
      dokument["surat_pemeriksaan"] = nama_file;  
    }
    if (req.files["surat_rumah_sakit"]) {
      var nama_file = req.files["surat_rumah_sakit"][0].filename;
      dokument["surat_rumah_sakit"] = nama_file;  
    }
    if (req.files["sk_lama"]) {
      var nama_file = req.files["sk_lama"][0].filename;
      permohonan["sk_lama"] = nama_file;  
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
  // jenazah.verifikasi= +req.body.verifikasi
  permohonan.nama_ahli_waris=req.body.nama_ahli_waris
  permohonan.pekerjaan=req.body.pekerjaan
  permohonan.nik=req.body.nik
  permohonan.domisili=req.body.domisili_pemohon
  permohonan.alamat=req.body.alamat_pemohon
  permohonan.kec_id=req.body.kecamatan_pemohon
  permohonan.kel_id=req.body.kelurahan_pemohon
  permohonan.hp=req.body.hp
  permohonan.email=req.body.email

  // permohonan.pin=insert_pin
  permohonan.jns_pemakaman=+(req.body.jns_pemakaman)
  jenazah.nama_jenazah=req.body.nama_jenazah
  jenazah.jenis_kelamin=req.body.jenis_kelamin
  jenazah.agama=req.body.agama
  jenazah.domisili_jenazah=req.body.domisili_jenazah
  jenazah.tanggal_meninggal=req.body.tanggal_meninggal
  jenazah.tanggal_dimakamkan=req.body.tanggal_dimakamkan
  jenazah.makam_id=req.body.nomor_liang_makam
  jenazah.kec_id=req.body.kecamatan_jenazah
  jenazah.kel_id=req.body.kelurahan_jenazah
  jenazah.alamat=req.body.alamat_jenazah
  jenazah.nik_jenazah=req.body.nik_jenazah

  perpanjangan.id= req.body.perpanjangan_id

  perpanjangan.perpanjangan_ke=req.body.perpanjangan_ke

  // jenazah.catatan_revisi=req.body.catatan_revisi
  // jenazah.kode_billing= hasil.idbiling
  await sql_enak("jenazah")
  .where("id", "=", req.body.jenazah_id)
  .update(jenazah)
  await sql_enak("perpanjangan")
  .where("id", "=", req.body.perpanjangan_id)
  .update(perpanjangan)
  await sql_enak("dokument")
  .where("id", "=", req.body.dokument_id)
  .update(dokument)
  await sql_enak("permohonan")
  .where("id", "=", req.body.permohonan_id)
  .update(permohonan)
  let redirect = ''
  switch (tujuan) {
    case '1':
      redirect = '/manajemen_perijinan/pemakaman'
      break;
      case '2':
      redirect = '/manajemen_perijinan/pemakaman_tumpang'
      break;
      case '3':
      redirect = '/manajemen_perijinan/pesan_tempat_makam'
      break;
      case '4':
        redirect = '/manajemen_perijinan/perpanjangan/pemakaman'
      break;
      case '5':
        redirect = '/manajemen_perijinan/perpanjangan/pemakaman_tumpang'
      break;
      case '6':
        redirect = '/manajemen_perijinan/perpanjangan/pesan_tempat_makam'
      break;
    default:
      break;
  }
  
  if (makam_sebelum[0][0].id!=makam_Sesudah[0][0].id) {
    console.log('if',1);
    if (req.body.jns_pemakaman==0) {
      
    if (makam_Sesudah[0][0].status_makam==0&&makam_Sesudah[0][0].jumlah_jenazah==0) {
    console.log('if',2);

    await sql_enak("makam")
    .where("id", "=", req.body.nomor_liang_makam)
    .update({status_makam:makam_sebelum[0][0].status_makam,jumlah_jenazah:makam_sebelum[0][0].jumlah_jenazah,status_tumpang:makam_sebelum[0][0].status_tumpang})
    }else{
    res.json('Harus di makam yang kosong')
  }
    }

  }

    let data = {status_makam:0,jumlah_jenazah:0,status_tumpang:0}
    if (makam_sebelum[0][0].jumlah_jenazah>1) {
          console.log('if',3);
      data = {status_makam:makam_sebelum[0][0].status_makam,jumlah_jenazah:Number(makam_sebelum[0][0].jumlah_jenazah)-1,status_tumpang:1}
    }
    await sql_enak("makam")
    .where("id", "=", req.body.makam_sebelum)
    .update(data)
    res.redirect(redirect)




})
router.post(`/submit_verifikasi_pemohon`,upload.fields([{name:'foto_ktp',maxCount:1}]),async function (req,res) {
  const dokument = {}
  dokument.pemohon_id=req.body.id
  if(req.body.verifikasi=='3'){
      await sql_enak("makam")
      .where("id", "=", req.body.makam_id)
      .update({status_makam:0})
  }
  const perpanjangan = {}
  perpanjangan.tanggal_surat=moment().format('YYYY-MM-DD')
  perpanjangan.tanggal_berlaku_surat=moment(req.body.tanggal_surat).add(3, 'Y').format('YYYY-MM-DD')
  // perpanjangan.nomor_surat=req.body.nomor_surat
  perpanjangan.status=+req.body.verifikasi
  perpanjangan.catatan_revisi=req.body.catatan_revisi

  const pemohon = {}
  if (req.files) {
    if (req.files["foto_ktp"]) {
      var nama_file = req.files["foto_ktp"][0].filename;
      pemohon["foto_ktp"] = nama_file;  
    }
  }
  pemohon.nama=req.body.nama
  pemohon.ktp=req.body.ktp
  pemohon.hp=req.body.hp
  pemohon.email=req.body.email
  pemohon.alamat=req.body.alamat
  pemohon.verifikasi=req.body.verifikasi
  await sql_enak("pemohon").where("id", "=", req.body.id).update(pemohon).then((data)=>{
  })
  await sql_enak("perpanjangan").where("id", "=", req.body.perpanjangan_id).update(perpanjangan).then((data)=>{
  })
  
  res.redirect('/backoffice')
})
router.post(`/pembayaran`,async function (req,res) {
  let post = {}
  post.status_pembayaran = 1
  let perpanjangan = await sql_enak.raw(`select * from perpanjangan p where p.kode_billing = ${req.body.kode_billing}`)
  if (perpanjangan[0].length>0) {
    if (perpanjangan[0][0].status_pembayaran==1) {
      res.json({Message:'Tagihan telah terbayar'})
    } else {
      await sql_enak("perpanjangan").where("id", "=", perpanjangan[0][0].id).update(post).then((data)=>{
        let error = {
          Message:'Jenazah tidak di temukan'
        }
        if (perpanjangan[0].length==0) {
          res.json(error)
        }else{
          let hasil = {
            res:100,
            Message:'telah terbayar'
          }
          res.json(hasil)
        }
      })       
    }
  }else{
    res.json({res:99,Message:'Kode billing tidak di temukan'})
  }
})
module.exports = router;
