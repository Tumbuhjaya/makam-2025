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
  var moment = require("moment");
  var axios = require('axios');

  moment.locale('id')
  var nodemailer = require('nodemailer')
  let transporter = nodemailer.createTransport({
    service: 'Gmail',
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
const bearer = `QGnyjTnfSR1G76V1bDKEIAcXZ1UOeYi6qR2wiajcgjjC39fTR7E3gtHZ0jVwzwyfF2IGuFvxEykwtzdxwsiJD4fMO8FdMSfeP0nQ`
const bearer2 =`QGnyjTnfSR1G76V1bDKEIAcXZ1UOeYi6qR2wiajcgjjC39fTR7E3gtHZ0jVwzwyfF2IGuFvxEykwtzdxwsiJD4fMO8FdMSfeP0nQ`
const ip = `http://103.101.52.19:7200/retribusi/1.2.16.01`
const URL = `http://103.101.52.19:7200/retribusi/store`
axios.defaults.headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  "Authorization": `Bearer ${bearer}`,
}
 function getIdBilling(retribusi) {
  return new Promise(async(y,t)=>{
 
    // axios.get(ip).then((data)=>{
    //   console.log(data.data)
    // })
    var qs = require('qs');
    var data = qs.stringify({
      'noskpd': '11111',
      'tanggal': moment().format('YYYY-MM-DD'),
      // 'tanggal': '2019-04-22',
      'keterangan': 'SET RET BIAYA CETAK PETA',
      'ksub': '1.1.04 1.1.04.01 00 000 4 1 2 01 04',//.4.1.2.01.03.0001
      'kredit': `${retribusi}`,
      'xunit': '4.1.02.01.03' 
    });
    var config = {
      method: 'post',
      url: 'http://103.101.52.19:7200/retribusi/store',
      headers: { 
        'Authorization': 'Bearer QGnyjTnfSR1G76V1bDKEIAcXZ1UOeYi6qR2wiajcgjjC39fTR7E3gtHZ0jVwzwyfF2IGuFvxEykwtzdxwsiJD4fMO8FdMSfeP0nQ', 
        'Content-Type': 'application/x-www-form-urlencoded'  },
      data : data
    };
  // console.log('hai hou',data)
     axios(config).then(function (response) {
      y(response.data)
      // console.log('hai hou',response);
    }).catch(err=>{
      y(err)
      // console.log('hai hie',err.response);

    });
  })

}

router.get('/pemakaman', cek_login,async function(req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  (m.master_makam_id = ${req.user[0].master_makam_id} or j.tpu  = ${req.user[0].master_makam_id})`
  }
  const data = await sql_enak.raw(`SELECT *,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan,m.kecamatan as kecamatan_tpu,k.kecamatan as kecamatan_pemohon,k3.desa as kelurahan_pemohon,k2.kecamatan as kecamatan_jenazah,k4.desa as kelurahan_jenazah,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted,DATE_FORMAT(j.tanggal_daftar_perpanjangan , '%d-%m-%Y') as tanggal_daftar_perpanjangan  ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id   LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0  ) as  p2 on p2.dokument_id =d.id 
    left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id   
    WHERE p.jns_pemakaman =  0 and p.deleted = 0 and j.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}  and p2.status =0 and p.id = p2.permohonan_id  order by p.id desc`)
  res.render('content-backoffice/manajemen_perpanjangan_pemakaman/list',{data:data[0]}); 
});
router.get('/pemakaman_tumpang', cek_login,async function(req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  (m.master_makam_id = ${req.user[0].master_makam_id} or j.tpu  = ${req.user[0].master_makam_id})`
  }
  const data = await sql_enak.raw(`SELECT *,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan,m.kecamatan as kecamatan_tpu,k.kecamatan as kecamatan_pemohon,k3.desa as kelurahan_pemohon,k2.kecamatan as kecamatan_jenazah,k4.desa as kelurahan_jenazah,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted,DATE_FORMAT(j.tanggal_daftar_perpanjangan , '%d-%m-%Y') as tanggal_daftar_perpanjangan  ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
       left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id  
    WHERE p.jns_pemakaman =  4 and p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}  and p2.status =0 and p.id = p2.permohonan_id  order by p.id desc`)
  res.render('content-backoffice/manajemen_perpanjangan_pemakaman_tumpang/list',{data:data[0]}); 
});
router.get('/pemakaman/verifikasi/:id', cek_login,async function(req, res) {
  const data = await sql_enak.raw(`SELECT *,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan,m.kecamatan as kecamatan_tpu,k.id_kecamatan as kecamatan_pemohon_id,k3.id_kelurahan as kelurahan_pemohon_id,k2.id_kecamatan as kecamatan_jenazah_id,k4.id_kelurahan as kelurahan_jenazah_id,k.kecamatan as kecamatan_pemohon,k3.desa as kelurahan_pemohon,k2.kecamatan as kecamatan_jenazah,k4.desa as kelurahan_jenazah,d.keterangan as ket,m.agama as agama_makam, m.id_kec as kecamatan_makam,m.nama_tpu as lokasi_makam , m.blok as blok_makam , m.sub_blok as subblok_makam ,m.no_liang as nomor_liang_makam,j.agama as agama_jenazah ,m.agama as cluster,d.keterangan as ket,j.agama as agama_jenazah,DATE_FORMAT(p2.tanggal_surat , '%Y-%m-%d') as tanggal_surat,p.alamat as alamat_pemohon , j.alamat as alamat_jenazah,p.kec_id as kec_pemohon,p.kel_id as kel_pemohon,m.id as makam_id ,j.kec_id as kec_jenazah,j.kel_id as kel_jenazah ,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id  ,p2.id as perpanjangan_id from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id 
    LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
       left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id   and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id  ORDER by p3.id DESC  LIMIT 1) WHERE p.jns_pemakaman =  0 and p.deleted = 0  and p.id = p2.permohonan_id  and j.juuid ='${req.params.id}'`)
  const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")
  const kel_pemohon = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0][0].kecamatan_pemohon_id}`)
  const kel_jenazah = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0][0].kecamatan_jenazah_id}`)
  const lokasi = await sql_enak.raw(`SELECT * FROM master_makam mm  WHERE mm.deleted = 0  and mm.id = ${data[0][0].master_makam_id} `)
  const blok = await sql_enak.raw(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0    and m.nama_tpu = '${data[0][0].lokasi_makam}'`)
  const sub_blok = await sql_enak.raw(`SELECT DISTINCT  m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 and m.nama_tpu = '${data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].blok_makam}' `)
  const no_liang = await sql_enak.raw(`SELECT  m.id,m.no_liang  as no_liang  FROM makam m WHERE m.deleted = 0 and m.jns_makam !=2  and m.nama_tpu = '${data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].blok_makam}'  and m.sub_blok  = '${data[0][0].subblok_makam}'  order by m.no_liang asc`)
  let x = sub_blok[0].sort((a,b)=>a.subblok.substring(1,a.subblok.length)-b.subblok.substring(1,b.subblok.length))
 
  res.render('content-backoffice/manajemen_perpanjangan_pemakaman/verifikasi',{kel_pemohon:kel_pemohon[0],kel_jenazah:kel_jenazah[0],x,no_liang:no_liang[0],data:data[0],kec:kec[0],lokasi:lokasi[0],blok:blok[0],sub_blok:sub_blok[0]}); 
});
router.get('/pemakaman_tumpang/verifikasi/:id', cek_login,async function(req, res) {
  const data = await sql_enak.raw(`SELECT *,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan,m.kecamatan as kecamatan_tpu,k.id_kecamatan as kecamatan_pemohon_id,k3.id_kelurahan as kelurahan_pemohon_id,k2.id_kecamatan as kecamatan_jenazah_id,k4.id_kelurahan as kelurahan_jenazah_id,
k.kecamatan as kecamatan_pemohon,k3.desa as kelurahan_pemohon,k2.kecamatan as kecamatan_jenazah,k4.desa as kelurahan_jenazah,d.keterangan as ket, m.id_kec as kecamatan_makam,m.nama_tpu as lokasi_makam , m.blok as blok_makam , m.sub_blok as subblok_makam ,m.no_liang as nomor_liang_makam,j.agama as agama_jenazah ,m.agama as cluster,d.keterangan as ket,j.agama as agama_jenazah,DATE_FORMAT(p2.tanggal_surat , '%Y-%m-%d') as tanggal_surat,p.alamat as alamat_pemohon , j.alamat as alamat_jenazah,p.kec_id as kec_pemohon,p.kel_id as kel_pemohon,m.id as makam_id ,j.kec_id as kec_jenazah,j.kel_id as kel_jenazah ,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id  ,m.agama as agama_makam ,j.agama as agama_jenazah,DATE_FORMAT(p2.tanggal_surat , '%Y-%m-%d') as tanggal_surat,p.alamat as alamat_pemohon , j.alamat as alamat_jenazah,p.kec_id as kec_pemohon,p.kel_id as kel_pemohon,m.id as makam_id ,j.kec_id as kec_jenazah,j.kel_id as kel_jenazah ,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id  ,p2.id as perpanjangan_id from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0  ) as  p2 on p2.dokument_id =d.id  
   left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id  WHERE p.jns_pemakaman =  4 and p.deleted = 0 and p.id = p2.permohonan_id  and j.juuid ='${req.params.id}'`)
console.log(data[0]);  
const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")
  const kel_pemohon = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0][0].kecamatan_pemohon_id}`)
  const kel_jenazah = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0][0].kecamatan_jenazah_id}`)
  const lokasi = await sql_enak.raw(`SELECT * FROM master_makam mm  WHERE mm.deleted = 0   and mm.id = ${data[0][0].master_makam_id} `)
  const blok = await sql_enak.raw(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0    and m.nama_tpu = '${data[0][0].lokasi_makam}'`)
  const sub_blok = await sql_enak.raw(`SELECT DISTINCT  m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 and m.nama_tpu = '${data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].blok_makam}' `)
  const no_liang = await sql_enak.raw(`SELECT  m.id,m.no_liang  as no_liang  FROM makam m WHERE m.deleted = 0 and m.jns_makam !=2  and m.nama_tpu = '${data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].blok_makam}'  and m.sub_blok  = '${data[0][0].subblok_makam}'  order by m.no_liang asc`)
  let x = sub_blok[0].sort((a,b)=>a.subblok.substring(1,a.subblok.length)-b.subblok.substring(1,b.subblok.length))
 
  res.render('content-backoffice/manajemen_perpanjangan_pemakaman_tumpang/verifikasi',{kel_pemohon:kel_pemohon[0],kel_jenazah:kel_jenazah[0],x,no_liang:no_liang[0],data:data[0],kec:kec[0],lokasi:lokasi[0],blok:blok[0],sub_blok:sub_blok[0]}); 
});

router.get('/pesan_tempat_makam', cek_login,async function(req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
  const data = await sql_enak.raw(`SELECT *,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan,m.kecamatan as kecamatan_tpu,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted,DATE_FORMAT(j.tanggal_daftar_perpanjangan , '%d-%m-%Y') as tanggal_daftar_perpanjangan  ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
      WHERE p.jns_pemakaman =  2 and p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}  and p.id = p2.permohonan_id  order by p.id desc`)
  res.render('content-backoffice/manajemen_perpanjangan_pesan_tempat_makam/list',{data:data[0]}); 
});
router.get('/pesan_tempat_makam/verifikasi/:id', cek_login,async function(req, res) {
  const data = await sql_enak.raw(`SELECT *,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan,d.keterangan as ket,m.agama as agama_makam, m.id_kec as kecamatan_makam,m.nama_tpu as lokasi_makam , m.blok as blok_makam , m.sub_blok as subblok_makam ,m.no_liang as nomor_liang_makam,j.agama as agama_jenazah ,m.agama as cluster,d.keterangan as ket,j.agama as agama_jenazah,DATE_FORMAT(p2.tanggal_surat , '%Y-%m-%d') as tanggal_surat,p.alamat as alamat_pemohon , j.alamat as alamat_jenazah,p.kec_id as kec_pemohon,p.kel_id as kel_pemohon,m.id as makam_id ,j.kec_id as kec_jenazah,j.kel_id as kel_jenazah ,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id  ,p2.id as perpanjangan_id from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan =  p.kec_id LEFT JOIN kelurahan k2 on k2.id_kelurahan = p.kel_id LEFT JOIN kecamatan k3 on k3.id_kecamatan = j.kec_id LEFT JOIN kelurahan k4 on k4.id_kelurahan = j.kel_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id  ORDER by p3.id DESC  LIMIT 1) WHERE p.jns_pemakaman =  2 and p.deleted = 0  and p.id = p2.permohonan_id  and j.juuid ='${req.params.id}'`)
  // console.log(data[0]);
  const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")
  const kel_pemohon = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0][0].kec_pemohon}`)
  const kel_jenazah = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0][0].kec_jenazah}`)
  const lokasi = await sql_enak.raw(`SELECT * FROM master_makam mm  WHERE mm.deleted = 0   and mm.id = ${data[0][0].master_makam_id} `)
  const blok = await sql_enak.raw(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0    and m.nama_tpu = '${data[0][0].lokasi_makam}'`)
  const sub_blok = await sql_enak.raw(`SELECT DISTINCT  m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 and m.nama_tpu = '${data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].blok_makam}' `)
  const no_liang = await sql_enak.raw(`SELECT  m.id,m.no_liang  as no_liang  FROM makam m WHERE m.deleted = 0 and m.jns_makam !=2  and m.nama_tpu = '${data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].blok_makam}'  and m.sub_blok  = '${data[0][0].subblok_makam}'  order by m.no_liang asc`)
  let x = sub_blok[0].sort((a,b)=>a.subblok.substring(1,a.subblok.length)-b.subblok.substring(1,b.subblok.length))
 
  res.render('content-backoffice/manajemen_perpanjangan_pesan_tempat_makam/verifikasi',{kel_pemohon:kel_pemohon[0],kel_jenazah:kel_jenazah[0],x,no_liang:no_liang[0],data:data[0],kec:kec[0],lokasi:lokasi[0],blok:blok[0],sub_blok:sub_blok[0]}); 
});

router.post(`/verifikasi_perpanjangan`,upload.fields([{name:'foto_ktp_pemohon',maxCount:1},{name:'foto_ktp_jenazah',maxCount:1},{name:'surat_pemeriksaan',maxCount:1},{name:'surat_rumah_sakit',maxCount:1},{name:'surat_lurah',maxCount:1},{name:'surat_kematian',maxCount:1},{name:'sk_lama',maxCount:1}]),async function (req,res) {
  // console.log(req.body,'body');
  let data_dokument = await sql_enak.raw(`SELECT * FROM dokument d WHERE d.id =${req.body.dokument_id}`)
  const permohonan = {}
  const jenazah ={}
  const dokument = {}
  const perpanjangan = {}
  const log={}
  const makam = {}

  // let x = await sql_enak.raw(`SELECT * FROM master_retribusi mr WHERE mr.jenis = 0`)
  // let tambahan = 0
  // if (data_dokument[0][0].periode<5) {
  //   tambahan =   (+x[0][0].retribusi)*(1+(0.5*(+data_dokument[0][0].periode)))
  // }else if (data_dokument[0][0].periode>=5){
  //   tambahan =   (+x[0][0].retribusi)*(3)
  // }
  
  // let hasil = await getIdBilling(tambahan);
  dokument.jenazah_id=req.body.jenazah_id
  dokument.keterangan = req.body.keterangan
  // perpanjangan.retribusi = tambahan
  // perpanjangan.dokument_id = req.body.dokument_id
  perpanjangan.nomor_surat=req.body.nomor_surat
  perpanjangan.status=req.body.verifikasi
  perpanjangan.perpanjangan_ke=req.body.perpanjangan_ke

  if (req.body.tanggal_surat) {
    perpanjangan.tanggal_surat=req.body.tanggal_surat
    perpanjangan.tanggal_berlaku_surat = moment(req.body.tanggal_surat).add(3, 'Y').format('YYYY-MM-DD')
  }
 
  // perpanjangan.kode_billing = hasil.idbiling
  // perpanjangan.status=1

  permohonan.nama_ahli_waris=req.body.nama_ahli_waris
  permohonan.pekerjaan=req.body.pekerjaan
  permohonan.nik=req.body.nik
  permohonan.domisili=req.body.domisili_pemohon
  permohonan.alamat=req.body.alamat_pemohon
  permohonan.kec_id=req.body.kecamatan_pemohon
  permohonan.kel_id=req.body.kelurahan_pemohon
  permohonan.hp=req.body.hp
  permohonan.email=req.body.email
  if (req.body.verifikasi == 2) {
    jenazah.verifikasi_perpanjangan = 2
    dokument.periode=(+data_dokument[0][0].periode)+1
  // permohonan.tanggal_daftar_perpanjangan = null
  } 
 
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
    if (req.files["sk_lama"]) {
      var nama_file = req.files["sk_lama"][0].filename;
      permohonan["sk_lama"] = nama_file;  
    }
  }
  await sql_enak("permohonan")
  .where("id", "=", req.body.pemohon_id)
  .update(permohonan)

  
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
  await sql_enak("jenazah")
  .where("id", "=", req.body.jenazah_id)
  .update(jenazah)
  let text_email = ''
  let subject_email = ''
  if (req.body.verifikasi=='2') {
    // text_email = `Permohonan telah di verifikasi`
    if (req.body.jns_pemakaman == 0) {
      text_email = `Permohonan perpanjangan ijin penggunaan tanah makam anda telah disetujui oleh pengelola TPU. Untuk Surat Keputusan (SK) perpanjangan ijin penggunaan tanah makam akan kami kirimkan melalui email ini.`
      subject_email = 'Permohonan perpanjangan ijin penggunaan tanah makam disetujui'
    
    } else if (req.body.jns_pemakaman == 2){
      subject_email=`Permohonan perpanjangan ijin pesan tempat makam di setujui`
       text_email=`Permohonan perpanjangan ijin pesan tempat makam anda telah disetujui oleh pengelola TPU. Untuk Surat Keputusan (SK) perpanjangan ijin pesan tempat makam akan kami kirimkan melalui email ini.`
    }else if (req.body.jns_pemakaman == 4){
      text_email = ` Permohonan perpanjangan ijin pemakaman tumpang anda telah disetujui oleh pengelola TPU. Untuk Surat Keputusan (SK) perpanjangan ijin pemakaman tumpang akan kami kirimkan melalui email ini.`
      subject_email = 'Permohonan perpanjangan ijin pemakaman tumpang disetujui'
    
    }

  }else   if (req.body.verifikasi=='3') { 
    subject_email = 'permohonan ijin dibatalkan' 
    text_email = 'permohonan ijin anda dibatalkan'
    // if (req.body.jns_pemakaman == 0) {
    //   // text_email = `Permohonan telah di tolak`
    //   text_email = `Permohonan ijin dibatalkan`
    //   subject_email = 'Permohonan ijin anda dibatalkan'
    // } else if (req.body.jns_pemakaman == 2){
    //     // text_email = `Permohonan telah di tolak`
    //     text_email = `Permohonan ijin dibatalkan`
    //     subject_email = 'Permohonan ijin anda dibatalkan'
    // }else if (req.body.jns_pemakaman == 4){
    //     // text_email = `Permohonan telah di tolak`
    //     text_email = `Permohonan ijin dibatalkan`
    //     subject_email = 'Permohonan ijin anda dibatalkan'
    // }
  }
  let mailOption = {
    from: 'noreply@survplus.id',
    to: req.body.email,
    subject: subject_email,
    text: text_email
  }
        let hasilWa =await kirimWa(req.body.hp, text_email)
// console.log(hasilWa);
  transporter.sendMail(mailOption, (err, data) => {
    if (err) {
      console.log(err, 'error!');
    } else {
      console.log('sukses!');
    }
  })
  await sql_enak("dokument")
  .where("id", "=", req.body.dokument_id)
  .update(dokument)
  await sql_enak("perpanjangan")
  .where("id", "=", req.body.perpanjangan_id)
  .update(perpanjangan)
  //   sql_enak.insert(perpanjangan).into("perpanjangan").then(function (data) {
  //     res.json({res:200,message:'sukses',data})

  //   })
  // console.log();
  if (req.body.jns_pemakaman == 0) {
    res.redirect(`/manajemen_perpanjangan/pemakaman`)

  } else if (req.body.jns_pemakaman == 2){
    res.redirect(`/manajemen_perpanjangan/pesan_tempat_makam`)

  }else if (req.body.jns_pemakaman == 4){
    res.redirect(`/manajemen_perpanjangan/pemakaman_tumpang`)

  }
})
module.exports = router;
