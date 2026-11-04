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
  var axios = require('axios');
const crypto = require('crypto');
global.crypto = crypto.webcrypto;
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
  var nodemailer = require('nodemailer')
  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
     user: process.env.GMAIL_USER,
     pass: process.env.GMAIL_APP_PASSWORD
    }
  })





  moment.locale('id')
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
var storage = require('../storage').storage;

var upload = multer({ storage: storage })

//start-------------------------------------

function email(email,subject,isi) {
  console.log(email,subject,isi,'email,subject,isi');
   let mailOption = {
    from: 'noreply@survplus.id',
    to: email,
    subject: subject,
    text: isi
  }
//   let mailOption = {
//     from: 'noreply@survplus.id',
//     to: email,
//     subject: subject, //'cetak sk'
//     html:`<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <style>
//     body {
//       font-family: Arial, sans-serif;
//       margin: 0;
//       padding: 0;
//       background-color: #f4f4f4;
//     }
//     .container {
//       max-width: 600px;
//       margin: 20px auto;
//       background: #ffffff;
//       padding: 20px;
//       border-radius: 8px;
//       box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
//     }
//     .header {
//       background-color: #b71c1c;
//       color: white;
//       text-align: center;
//       padding: 10px 20px;
//       border-radius: 8px 8px 0 0;
//     }
//     .content {
//       margin: 20px 0;
//       color: #333333;
//       line-height: 1.6;
//     }
//     .button {
//       display: inline-block;
//       background-color: #b71c1c;
//       color: white;
//       text-decoration: none;
//       padding: 10px 20px;
//       border-radius: 4px;
//       margin-top: 20px;
//     }
//       .button {
//       display: block;
//       width: fit-content;
//       margin: 20px auto;
//       padding: 10px 20px;
//       background-color: #b71c1c;
//       color: white;
//       text-decoration: none;
//       border-radius: 5px;
//       text-align: center;
//       font-weight: bold;
//       transition: background-color 0.3s ease;
//     }
//     .button:hover {
//       background-color: #b71c1c;
//     }
//     .footer {
//       text-align: center;
//       margin-top: 20px;
//       font-size: 0.9em;
//       color: #777777;
//     }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="header">
//     <h1>${isi[0]}</h1>
//     </div>
//     <div class="content">
//     ${isi[1]}
//     </div>
//     <div class="footer">
//       <p>&copy; 2023. Dinas Perumahan dan Kawasan Permukiman Kota Semarang.</p>
//     </div>
//   </div>
// </body>
// </html>`//`silahkan ambil dokumen sk asli di ... sebelum nya telp dahulu . sementara dapat mencetak sk di "https://makam.semarangkota.go.id/manajemen_perijinan/pemakaman/cetak/${data[0][0].permohonan_id}"`
//   }
  console.log(mailOption,'mailOption');
  
  transporter.sendMail(mailOption, (err, data) => {
    if (err) {
      console.log(err, 'error!');
    } else {
      console.log('sukses!');
    }
  })
}

router.get(`/pemakaman/edit/:id`,async function (req,res) {
  const data = await sql_enak.raw(`SELECT *,d.keterangan as ket,DATE_FORMAT(p2.tanggal_surat , '%Y-%m-%d') as tanggal_surat,p.alamat as alamat_pemohon , j.alamat as alamat_jenazah,p.kec_id as kec_pemohon,p.kel_id as kel_pemohon,m.id as makam_id ,j.kec_id as kec_jenazah,j.kel_id as kel_jenazah ,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted,p2.id as perpanjangan_id ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id , m.id_kec as kecamatan_makam,m.nama_tpu as lokasi_makam , m.blok as blok_makam , m.sub_blok as subblok_makam ,m.no_liang as nomor_liang_makam,j.agama as agama_jenazah ,m.agama as cluster,d.keterangan as ket from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id AND p2.status != 2 WHERE p.jns_pemakaman =  0 and p.id = p2.permohonan_id and p.deleted = 0 and j.juuid ='${req.params.id}'`)
  const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")
  const lokasi = await sql_enak.raw(`SELECT * FROM master_makam mm  WHERE mm.deleted = 0  and mm.id_kec = ${data[0][0].kecamatan_makam} `)
  const blok = await sql_enak.raw(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0    and m.nama_tpu = '${data[0][0].lokasi_makam}`)
  const sub_blok = await sql_enak.raw(`SELECT DISTINCT  m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 and m.nama_tpu = '${data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].blok_makam}' `)
  const no_liang = await sql_enak.raw(`SELECT  m.id,m.no_liang  as no_liang  FROM makam m WHERE m.deleted = 0 and m.jns_makam !=2  and m.nama_tpu = '${data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].blok_makam}'  and m.sub_blok  = '${data[0][0].subblok_makam}'  order by m.no_liang asc`)
  let x = sub_blok[0].sort((a,b)=>a.subblok.substring(1,a.subblok.length)-b.subblok.substring(1,b.subblok.length))
  res.render('content-backoffice/manajemen_ijin/edit_pemakaman', {data:data[0],kec:kec[0],lokasi:lokasi[0],blok:blok[0],sub_blok:x,no_liang:no_liang[0]})
})
router.post(`/submit_edit`,cek_login,upload.fields([{name:'foto_ktp_pemohon',maxCount:1},{name:'foto_ktp_jenazah',maxCount:1},{name:'surat_pemeriksaan',maxCount:1},{name:'surat_rumah_sakit',maxCount:1},{name:'surat_lurah',maxCount:1},{name:'surat_kematian',maxCount:1}]),async function (req,res) {
  const permohonan = {}
  const jenazah ={}
  const dokument = {}
  const perpanjangan = {}
  const makam = {}
  dokument["id"] = req.body.dokument_id;  
  dokument.keterangan = req.body.keterangan
  // if (req.body.jns_pemakaman == 0) {
  //   let zxc = await sql_enak.raw(`SELECT j.makam_id  FROM jenazah j WHERE j.id = ${req.body.jenazah_id}`)
  //   await sql_enak.raw(`UPDATE 2022_makam_smg.makam
  //   SET  status_makam=0, jns_makam=0
  //   WHERE id=${zxc[0][0].makam_id};`)
  //   makam.status_makam=1
  //   await sql_enak("makam")
  //   .where("id", "=", req.body.nomor_liang_makam)
  //   .update(makam)
  // }
  perpanjangan.nomor_surat=req.body.nomor_surat
  perpanjangan.catatan_revisi=req.body.catatan_revisi

  // if(req.body.verifikasi=='3' && req.body.jns_pemakaman ==0){
  //     await sql_enak("makam")
  //     .where("id", "=", req.body.nomor_liang_makam)
  //     .update({status_makam:0})
  //     await sql_enak("jenazah")
  //     .where("id", "=", req.body.jenazah_id)
  //     .update({deleted :1})
  // }
  // if (req.body.verifikasi!='3') {
  //   await sql_enak("jenazah")
  //   .where("id", "=", req.body.jenazah_id)
  //   .update({deleted :0})
  // }
  // if(req.body.verifikasi=='2'){
  //   if (req.body.jns_pemakaman ==0) {
  //     await sql_enak("makam")
  //     .where("id", "=", req.body.nomor_liang_makam)
  //     .update({jumlah_jenazah:1})
  //   }else{
  //     let jumlah_jenazah = await sql_enak.raw(`SELECT m.jumlah_jenazah  FROM makam m WHERE  m.id = ${req.body.makam_id}`)
  //     await sql_enak("makam")
  //     .where("id", "=", req.body.makam_id)
  //     .update({jumlah_jenazah:jumlah_jenazah[0][0].jumlah_jenazah+1})
  //   }
 
  // }
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
  // permohonan.jns_pemakaman=+(req.body.jns_pemakaman)
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
  // let text_email = ''
  // let subject_email = ''
  if (req.body.verifikasi=='1') {
    text_email = `silahkan lengkapi data - data anda di  "https://makam.semarangkota.go.id/revisi_dokumen/${req.body.dokument_id}"`
    subject_email = 'Revisi'
  }else   if (req.body.verifikasi=='2') {
    text_email = `Permohonan Ijin Penggunaan Tanah Makam/Pemakaman Jenazah telah di setujui`
    subject_email = 'Disetujui'

  }else   if (req.body.verifikasi=='3') {
    text_email = `Permohonan Ijin Penggunaan Tanah Makam/Pemakaman Jenazah di tolak`
    subject_email = 'Ditolak'

  }
  let mailOption = {
    from: 'noreply@survplus.id',
    to: req.body.email,
    subject: subject_email,
    text: text_email
  }
  let hasilWa =await kirimWa(req.body.hp,text_email)
  // console.log(hasilWa);
  transporter.sendMail(mailOption, (err, data) => {
    if (err) {
      console.log(err, 'error!');
    } else {
      console.log('sukses!');
    }
  })
  if (req.body.jns_pemakaman == 0) {
    res.redirect(`/manajemen_perijinan/pemakaman`)
  } else if (req.body.jns_pemakaman == 4) {
     res.redirect(`/manajemen_perijinan/makam_tumpang`)
  }
})
router.get(`/getPenandatangan`,cek_login,async function (req,res) {
  let penandatangan = await sql_enak.raw(`select *,id_user penandatangan_id , fullname nama from user where deleted = 0 and is_admin in (2,3)`)
  // console.log(penandatangan[0]);
  res.json({data:penandatangan[0]})
})
router.get('/pemakaman', cek_login,async function(req, res) { 
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
  let penandatangan = await sql_enak.raw(`select * from user where deleted = 0 and is_admin in (2,3)`)
 let data = [[]]
  res.render('content-backoffice/manajemen_ijin/pemakaman',{cetak:req.query.cetak,data:data[0],user:req.user[0],penandatangan:penandatangan[0]}); 
});
router.post('/list_pemakaman',cek_login,async function(req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
  let {count,limit,jns_pemakaman, offset,cari,mulai,akhir,file} = req.body
  // console.log(req.body);
  str = ''
  let value = []
  if (file) {
    o+= ` and d.sk is not null  and d.sk != '' `
  }
  if (limit) {
    str += ` limit ${limit} `
  }
  if (offset) {
    str += `  offset ${offset} `

  }
  
  if (cari) {
    o += ` and ( p.pin like ? or d.periode  like ? or d.sk  like ? or  p2.status   like ? or  nama_ahli_waris   like ? or nama_jenazah  like ? or k.kecamatan   like ? or m.nama_tpu   like ? or m.blok   like ? or m.sub_blok  like ? or m.no_liang  like ? or p2.kode_billing  like ?  or  j.inserted   like ? or j.tanggal_meninggal like ? or j.tanggal_dimakamkan like ? ) `
  
    
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
  }
  if (mulai) {
    o += ` and j.inserted >=?`
    value.push(mulai)
  }
  if (akhir) {
    o += ` and j.inserted <=?`
    value.push(akhir)
  }
  let sql = ` j.juuid,d.status_tte, p.pin,d.periode,d.sk, p2.status,foto_ktp_pemohon,foto_ktp_jenazah,surat_kematian,surat_lurah, nama_ahli_waris ,nama_jenazah,k.kecamatan, m.kecamatan as kecamatan_tpu,nama_tpu ,m.blok ,m.sub_blok,m.no_liang,p2.kode_billing,(SELECT CASE when isnull(p.tanggal_surat) or isnull(p.tanggal_berlaku_surat)   then 'false' ELSE 'true' END as x FROM perpanjangan p WHERE p.id  = p2.id) as cek,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE when p2.status_pembayaran = 0  then 'Belum Dibayar' when p2.status_pembayaran = 1  then 'Sudah Dibayar' END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,k.kecamatan , p2.id as perpanjangan_id`
  if (count) {
    sql = ' count(*) as jml'
  }
  let sql_query = `SELECT ${sql} from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id 
LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
  LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman = ${jns_pemakaman||0} and j.kategori_tpu = 0  and p.deleted = 0 and j.deleted = 0 and p2.status = 2  and p.id = p2.permohonan_id  and p.deleted = 0 ${o} order by p.id desc ${str}`
  console.log(sql_query,value);
 const data = await sql_enak.raw(sql_query,value)
  res.json({data:data[0],user:req.user[0]})
})
router.post('/perpanjangan/pemakaman', cek_login,async function(req, res) { 
  let {limit,offset,cari,mulai,akhir,count,sk_perpanjangan} = req.body   
  let o = ''
  let a = ''
  let value = []

  let b = `*,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan,(SELECT CASE when  p.tanggal_surat = '00-00-0000' or ISNULL(p.tanggal_surat)    then 'false' ELSE 'true' END as x FROM perpanjangan p WHERE p.id  = p2.id) as cek,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,k.kecamatan , p2.id as perpanjangan_id`
    let str = ''
  if (req.user[0].master_makam_id) {
    a = ` and m.master_makam_id =`+req.user[0].master_makam_id
  }
  if (sk_perpanjangan) {
   o += `  and p2.sk_perpanjangan is not null and p2.sk_perpanjangan !='' `
  }
  if (cari) {
    o += ` and ( p.pin like ? or d.periode  like ? or d.sk  like ? or  p2.status   like ? or  nama_ahli_waris   like ? or j.nama_jenazah  like ? or k.kecamatan   like ? or nama_tpu   like ? or m.blok   like ? or m.sub_blok  like ? or m.no_liang  like ? or p2.kode_billing  like ?  or  j.inserted   like ? or j.tanggal_meninggal like ? or j.tanggal_dimakamkan like ? ) `
  
    
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
  }
  if (mulai) {
    o += ` and p2.inserted_perpanjangan >=?`
    value.push(mulai)
  }
  if (akhir) {
    o += ` and p2.inserted_perpanjangan <=?`
    value.push(akhir)
  }
     if (count) {
          b = ' count(*) as jml '
        }
        if (limit) {
          str += ` limit ${limit}`
        }
        if (offset) {
          str += ` offset ${offset}`
        }
 
  const data = await sql_enak.raw(`SELECT ${b} from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id  LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  
  WHERE p.jns_pemakaman =  0 ${o} and j.kategori_tpu = 0  and p.deleted = 0 and p2.status = 2  and (j.verifikasi_perpanjangan =2 or p2.status_perpanjangan = 1) ${a}  and p.id = p2.permohonan_id   and j.deleted = 0 and p.deleted = 0 order by p.id desc ${str}`,value)
  res.json({data:data[0],user:req.user[0]})
})
router.post('/perpanjangan/pemakaman_special', cek_login, async function(req, res) {
  let {limit, offset, cari, mulai, akhir, count, status,jenis,jns_pemakaman } = req.body
  let o = ''
  let a = ''
  let value = []
  let str = ''

  console.log('ini perpanjangan_pemakaman_tumpang');

  // Filter berdasarkan admin
  if (req.user[0].is_admin == 0) {
    a = ` and mm.id = ${req.user[0].master_makam_id}`
  }

  // Filter status
  if (status) {
    o += ` AND p2.status = ${status} `
  } else {
    o += ` AND p2.status != 2 `
  }
  if (jns_pemakaman) {
    o += ` AND p.jns_pemakaman = ? `
    value.push(jns_pemakaman)
  }
  // Define select columns
  let b = `*,
    DATE_FORMAT(p2.inserted_perpanjangan, '%d-%m-%Y') as inserted_perpanjangan,
    j.makam_id AS makam_jenazah,
    k3.desa AS kelurahan_pemohon,
    k2.kecamatan AS kecamatan_jenazah,
    k4.desa AS kelurahan_jenazah,
    k5.kecamatan AS kecamatan_tpu,
    CASE
        WHEN p2.status_pembayaran = 0 THEN 'Belum Dibayar'
        WHEN p2.status_pembayaran = 1 THEN 'Sudah Dibayar'
    END AS status_pembayaran,
    CASE
        WHEN p2.status = 0 THEN 'Belum Diverifikasi'
        WHEN p2.status = 1 THEN CONCAT('Revisi , ', p2.catatan_revisi)
        WHEN p2.status = 2 THEN 'Disetujui'
        WHEN p2.status = 3 THEN 'Dibatalkan'
        WHEN p2.status = 4 THEN 'Telah di revisi user'
    END AS status_permohonan,
    DATE_FORMAT(j.inserted, '%d-%m-%Y') AS inserted,
    DATE_FORMAT(j.tanggal_meninggal, '%d-%m-%Y') AS tanggal_meninggal,
    DATE_FORMAT(j.tanggal_dimakamkan, '%d-%m-%Y') AS tanggal_dimakamkan,
    p.id AS permohonan_id,
    j.id AS jenazah_id,
    d.id AS dokument_id,
    p2.id AS perpanjangan_id`

  // Search filter
  if (cari) {
    o += ` and (j.nama_jenazah like ? or p2.sk_perpanjangan like ? or d.sk like ? or p2.kode_billing like ? or k5.kecamatan like ? or k3.desa like ?)`
    value.push(`%${cari}%`)
    value.push(`%${cari}%`)
    value.push(`%${cari}%`)
    value.push(`%${cari}%`)
    value.push(`%${cari}%`)
    value.push(`%${cari}%`)
  }

  // Date filters
  if (mulai) {
    o += ` and p2.inserted_perpanjangan >= ?`
    value.push(mulai)
  }
  if (akhir) {
    o += ` and p2.inserted_perpanjangan <= ?`
    value.push(akhir)
  }

  // Count or data
  if (count) {
    b = ' count(*) as jml '
  }

  // Pagination
  if (limit) {
    str += ` limit ${limit}`
  }
  if (offset) {
    str += ` offset ${offset}`
  }

  let q = `SELECT ${b} 
    FROM jenazah j
    LEFT JOIN permohonan p ON j.id = p.jenazah_id AND p.deleted = 0 AND p.jns_pemakaman = 4
    LEFT JOIN dokument d ON d.jenazah_id = j.id AND d.deleted = 0
    LEFT JOIN master_makam mm ON mm.id = j.tpu AND mm.deleted = 0
    LEFT JOIN kecamatan k5 ON k5.id_kecamatan = mm.id_kec
    LEFT JOIN kecamatan k ON k.id_kecamatan = p.kec_id
    LEFT JOIN kecamatan k2 ON k2.id_kecamatan = j.kec_id
    LEFT JOIN kelurahan k3 ON k3.id_kelurahan = p.kel_id
    LEFT JOIN kelurahan k4 ON k4.id_kelurahan = j.kel_id
    LEFT JOIN (
      SELECT * FROM (
        SELECT MAX(x.id) as idx 
        FROM perpanjangan x 
        GROUP BY x.dokument_id
      ) as y 
      LEFT JOIN perpanjangan x2 ON x2.id = y.idx AND x2.deleted = 0 AND x2.status != 2
    ) as p2 ON p2.dokument_id = d.id  
    WHERE d.sk is not null 
      AND d.sk != '' 
      AND p2.sk_perpanjangan is not null 
      AND p2.sk_perpanjangan != ''
      
      ${a}
      AND j.deleted = 0 
      AND p.deleted = 0 
      AND j.kategori_tpu = 1
      AND j.verifikasi_perpanjangan = 1
      AND p2.status != 2
      AND p.id = p2.permohonan_id
      ${o}
    ORDER BY p.id DESC ${str}`

  console.log(q, 'asdfghj');
  
  const data = await sql_enak.raw(q, value)
  
  // Response format seperti API kedua
  if (count) {
    res.json({ 
      data: data[0],
      user: req.user[0],
      total: data[0][0]?.jml || 0
    })
  } else {
    res.json({ 
      data: data[0],
      user: req.user[0]
    })
  }
});
router.get('/perpanjangan/pemakaman', cek_login,async function(req, res) { 
 
    res.render('content-backoffice/manajemen_ijin/perpanjangan_pemakaman',{cetak:req.query.cetak}); 
  });
  router.post('/perpanjangan/pemakaman_tumpang', cek_login,async function(req, res) { 
    let a = ''
    if (req.user[0].master_makam_id) {
      a = ` and m.master_makam_id =`+req.user[0].master_makam_id
    }
    let value = []
    let o = ''
    let str = ''
    let b = ` *,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan,(SELECT CASE when  p.tanggal_surat = '00-00-0000' or ISNULL(p.tanggal_surat)    then 'false' ELSE 'true' END as x FROM perpanjangan p WHERE p.id  = p2.id) as cek,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
    when p2.status_pembayaran = 0  then 'Belum Dibayar'
    when p2.status_pembayaran = 1  then 'Sudah Dibayar'
    END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
    ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,k.kecamatan , p2.id as perpanjangan_id `
  //   const data = await sql_enak.raw(`SELECT *,(SELECT CASE when  p.tanggal_surat = '00-00-0000'  or ISNULL(p.tanggal_surat)   then 'false' ELSE 'true' END as x FROM perpanjangan p WHERE p.id  = p2.id) as cek,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
  //   when p2.status_pembayaran = 0  then 'Belum Dibayar'
  //   when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  //   END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
  //   ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,k.kecamatan , p2.id as perpanjangan_id from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id left join   (SELECT DISTINCT  p2.id,p2.tanggal_berlaku_surat,p2.status_pembayaran,p2.tanggal_surat,p2.status,p2.permohonan_id,p2.dokument_id
  //     ,p2.status_perpanjangan,p2.penandatangan_id  FROM perpanjangan p2
  //     WHERE p2.status = 2
  //     ORDER BY p2.id DESC
  // ) p2 ON p2.dokument_id = d.id LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman =  4 and p.deleted = 0 and p2.status = 2  and (j.verifikasi_perpanjangan =2 or p2.status_perpanjangan = 1)  and p.id = p2.permohonan_id   and p.deleted = 0 order by p.id desc`)
  let {limit,offset,cari,mulai,akhir,count} = req.body   
  
  if (cari) {
    o += ` and ( p.pin like ? or d.periode  like ? or d.sk  like ? or  p2.status   like ? or  nama_ahli_waris   like ? or nama_jenazah  like ? or k.kecamatan   like ? or nama_tpu   like ? or blok   like ? or sub_blok  like ? or no_liang  like ? or p2.kode_billing  like ?  or  j.inserted   like ? or j.tanggal_meninggal like ? or j.tanggal_dimakamkan like ? ) `
  
    
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
  }
  if (mulai) {
    o += ` and p2.inserted_perpanjangan >=?`
    value.push(mulai)
  }
  if (akhir) {
    o += ` and p2.inserted_perpanjangan <=?`
    value.push(akhir)
  }
     if (count) {
          b = ' count(*) as jml '
        }
        if (limit) {
          str += ` limit ${limit}`
        }
        if (offset) {
          str += ` offset ${offset}`
        }
  const data = await sql_enak.raw(`SELECT ${b} from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id  LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman =  4 and j.kategori_tpu = 0  ${o} and p.deleted = 0 and p2.status = 2  and (j.verifikasi_perpanjangan =2 or p2.status_perpanjangan = 1)   and p.id = p2.permohonan_id   and j.deleted = 0 and p.deleted = 0 ${a}  order by p.id desc ${str}`,value)
    res.json({data:data[0],user:req.user[0]})
  });

  router.get('/perpanjangan/pemakaman_tumpang', cek_login,async function(req, res) { 
  
      res.render('content-backoffice/manajemen_ijin/perpanjangan_pemakaman_tumpang',{cetak:req.query.cetak}); 
    });
    // router.post('/perpanjangan/pemakaman', cek_login,async function(req, res) { 
    //   let {limit,offset,count} = req.body
    //   let str = ''
    //   let sql = `*,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan,(SELECT CASE when  p.tanggal_surat = '00-00-0000' or ISNULL(p.tanggal_surat)    then 'false' ELSE 'true' END as x FROM perpanjangan p WHERE p.id  = p2.id) as cek,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
    //   when p2.status_pembayaran = 0  then 'Belum Dibayar'
    //   when p2.status_pembayaran = 1  then 'Sudah Dibayar'
    //   END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
    //   ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,k.kecamatan , p2.id as perpanjangan_id `
    // let {limit,offset,count} = req.body   
    //  if (count) {
    //       sql = ' count(*) as jml '
    //     }
    //     if (limit) {
    //       str += ` limit ${limit}`
    //     }
    //     if (offset) {
    //       str += ` offset ${offset}`
    //     }
    // const data = await sql_enak.raw(`SELECT ${sql} from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id left join   (SELECT DISTINCT  p2.id,p2.tanggal_berlaku_surat,p2.status_pembayaran,p2.tanggal_surat,p2.status,p2.permohonan_id,p2.dokument_id
    //     ,p2.status_perpanjangan,p2.penandatangan_id FROM perpanjangan p2
    //       WHERE p2.status = 2
    //       ORDER BY p2.id DESC
    //   ) p2 ON p2.dokument_id = d.id LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman =  2  and p.deleted = 0 and p2.status = 2  and (j.verifikasi_perpanjangan =2 or p2.status_perpanjangan = 1)   and p.id = p2.permohonan_id  and j.deleted = 0   and p.deleted = 0 order by p.id desc ${str}`)
    //   res.json({data:data[0]})
    // });

// router.get('/perpanjangan/pemakaman', cek_login,async function(req, res) { 

//   res.render('content-backoffice/manajemen_ijin/perpanjangan_pemakaman',{cetak:req.query.cetak}); 
// });
router.get(`/pemakaman/cetak/:id`,async function (req,res) {
  const data = await sql_enak.raw(`SELECT *,kp.kecamatan as kecamatan_pemohon , kj.kecamatan as kecamatan_jenazah , kp2.desa as kelurahan_pemohon , kj2.desa as kelurahan_jenazah ,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
  ,CASE 
  when p.kec_id != 0   then (SELECT CONCAT(p.alamat,'') from permohonan p 
  left join kecamatan k on p.kec_id = k.id_kecamatan  LEFT join kelurahan k2 on k2.id_kelurahan = p.kel_id  WHERE p.id = p2.permohonan_id)
  ELSE p.alamat END as alamat_pemohon,
  CASE 
  when j.kec_id != 0   then (SELECT CONCAT( j2.alamat, '') from jenazah j2  
  left join kecamatan k on j2.kec_id = k.id_kecamatan  LEFT join kelurahan k2 on k2.id_kelurahan = j2.kel_id  WHERE j2.id = d.jenazah_id)
  ELSE j.alamat END as alamat_jenazah,
   CONCAT(m.nama_tpu , ' blok  ' , m.blok,' sub blok  ', m.sub_blok , ' nomor liang sistem ',m.no_liang ) as alamat_makam
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted,u.jabatan as jab_penanda,u.fullname  as nama_penanda ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id , m.id as makam_id 
  from jenazah j  
  left join permohonan p on j.id = p.jenazah_id
  LEFT JOIN dokument d on d.jenazah_id = j.id 
  LEFT join makam m on m.id = j.makam_id 
  left join perpanjangan p2 on p2.dokument_id = d.id and p2.status=2 AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC  LIMIT 1)   
  LEFT JOIN user u on u.id_user  = p2.penandatangan_id    
  left join kecamatan kp on p.kec_id = kp.id_kecamatan  
  LEFT join kelurahan kp2 on kp2.id_kelurahan = p.kel_id 
  left join kecamatan kj on j.kec_id = kj.id_kecamatan 
LEFT join kelurahan kj2 on kj2.id_kelurahan = j.kel_id    WHERE  j.juuid='${req.params.id}'  and p.id = p2.permohonan_id `)
  await sql_enak("makam")
  .where("id", "=", data[0][0].makam_id)
  .update({status_makam:2})
  if (data[0][0].periode == 0) {
    await sql_enak("dokument")
    .where("id", "=", data[0][0].dokument_id)
    .update({periode:1})
    // email(data[0][0].email,'cetak sk',`silahkan ambil dokumen sk asli di ... sebelum nya telp dahulu . sementara dapat mencetak sk di "https://makam.semarangkota.go.id/manajemen_perijinan/pemakaman/cetak/${data[0][0].permohonan_id}"`)
  }
  const jumlah_perpanjangan = await sql_enak.raw(`  select count(*) as jumlah_perpanjangan ,p.dokument_id from perpanjangan p where p.deleted = 0 and p.status =2 and p.dokument_id = `+data[0][0].dokument_id

  )
  if (data[0][0].jns_pemakaman == 0) {
    res.render('content-backoffice/manajemen_ijin/cetak_permohonan_pemakaman',{data:data[0],jumlah_perpanjangan:jumlah_perpanjangan[0][0].jumlah_perpanjangan})

  } else {
    let sql = `SELECT j.nama_jenazah , j.id FROM jenazah j WHERE j.makam_id = ? and j.deleted = 0 and j.juuid !='${req.params.id}'`
    let val = [data[0][0].makam_id]
    let data2 = await sql_enak.raw(sql,val)

    res.render('content-backoffice/manajemen_ijin/cetak_pemakaman_tumpang',{data:data[0],data2:data2[0],jumlah_perpanjangan:jumlah_perpanjangan[0][0].jumlah_perpanjangan})

  }
})
router.get(`/pemakaman/cetak_perpanjangan/:id`,async function (req,res) {
  const data = await sql_enak.raw(`SELECT *,kp.kecamatan as kecamatan_pemohon , kj.kecamatan as kecamatan_jenazah , kp2.desa as kelurahan_pemohon , kj2.desa as kelurahan_jenazah ,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
  ,CASE 
  when p.kec_id != 0   then CONCAT( p.alamat,'')
  ELSE p.alamat END as alamat_pemohon,
  CASE 
  when j.kec_id != 0   then CONCAT( j.alamat,'')
  ELSE j.alamat END as alamat_jenazah,
   CONCAT(m.nama_tpu , ' blok  ' , m.blok,' sub blok  ', m.sub_blok , ' nomor liang sistem ',m.no_liang ) as alamat_makam
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,p4.jabatan as jab_penanda,p4.nama as nama_penanda ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id , m.id as makam_id from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id left join perpanjangan p2 on p2.dokument_id = d.id and p2.status=2  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC  LIMIT 1) left join kecamatan k on k.id_kecamatan = p.kec_id left join kelurahan k2 on k2.id_kelurahan = p.kel_id left join kecamatan k3 on j.kec_id = k3.id_kec left join kelurahan k4 on k4.id_kelurahan = j.kel_id  LEFT JOIN penandatangan p4 on p4.id = p2.penandatangan_id    left join kecamatan kp on p.kec_id = kp.id_kecamatan  LEFT join kelurahan kp2 on kp2.id_kelurahan = p.kel_id 
  left join kecamatan kj on j.kec_id = kj.id_kecamatan  LEFT join kelurahan kj2 on kj2.id_kelurahan = j.kel_id   WHERE  j.juuid='${req.params.id}' and p.id = p2.permohonan_id `)
  await sql_enak("makam")
  .where("id", "=", data[0][0].makam_id)
  .update({status_makam:2})
  if (data[0][0].periode == 0) {
    await sql_enak("dokument")
    .where("id", "=", data[0][0].dokument_id)
    .update({periode:1})
    // email(data[0][0].email,'cetak sk',`silahkan ambil dokumen sk asli di ... sebelum nya telp dahulu . sementara dapat mencetak sk di "https://makam.semarangkota.go.id/manajemen_perijinan/pemakaman/cetak/${data[0][0].permohonan_id}"`)
  }
  let jumlah = await sql_enak.raw(`SELECT COUNT(*) as jumlah_perpanjangan FROM jenazah j join dokument d on d.jenazah_id = j.id left join perpanjangan p on p.dokument_id =d.id where j.juuid = '${req.params.id}'`)
  if (data[0][0].jns_pemakaman == 0) {
    res.render('content-backoffice/manajemen_ijin/cetak_perpanjangan_pemakaman',{data:data[0],jumlah:jumlah[0]})

  } 
  else {
    let sql = `SELECT j.nama_jenazah , j.id FROM jenazah j WHERE j.makam_id = ? and j.deleted = 0 and j.juuid !='${req.params.id}'`
    let val = [data[0][0].makam_id]
    let data2 = await sql_enak.raw(sql,val)

    res.render('content-backoffice/manajemen_ijin/cetak_perpanjangan_pemakaman_tumpang',{data:data[0],data2:data2[0],jumlah:jumlah[0]})

  }
  // else  if (data[0][0].jns_pemakaman == 4) {
  //   res.render('content-backoffice/manajemen_ijin/cetak_perpanjangan_pemakaman_tumpang',{data:data[0],jumlah:jumlah[0]})
  // } 
  // else  if (data[0][0].jns_pemakaman == 2) {

  //   res.render('content-backoffice/manajemen_ijin/cetak_perpanjangan_pesan_tempat',{data:data[0],jumlah:jumlah[0]})

  // }
})
router.post(`/pemakaman_tumpang/list`,async function (req,res) {
  let {limit,offset,cari,count,mulai,akhir}=req.body
  let value = []
  let str = ''
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
    if (cari) {
    o += ` and ( p.pin like ? or d.periode  like ? or d.sk  like ? or  p2.status   like ? or  p.nama_ahli_waris   like ? or j.nama_jenazah  like ? or k.kecamatan   like ? or m.nama_tpu   like ? or m.blok   like ? or m.sub_blok  like ? or m.no_liang  like ? or p2.kode_billing  like ?  or  j.inserted   like ? or j.tanggal_meninggal like ? or j.tanggal_dimakamkan like ? ) `
  
    
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
value.push(`%${cari}%`)
  }
  if (mulai) {
    o += ` and j.inserted >=?`
    value.push(mulai)
  }
  if (akhir) {
    o += ` and j.inserted <=?`
    value.push(akhir)
  }
  if (limit) {
    str += ` limit ${limit} `

  }
  if (offset) {
    str += ` offset ${offset} `
  }

  let sql = ` *,(SELECT CASE when isnull(p.tanggal_surat) or isnull(p.tanggal_berlaku_surat)   then 'false' ELSE 'true' END as x FROM perpanjangan p WHERE p.id  = p2.id) as cek,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
  ,DATE_FORMAT(j.tanggal_dimakamkan , '%d-%m-%Y') as inserted,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id ,p2.id as perpanjangan_id `
 if(count){
  sql = ' count(*) as jml'
 }
  let sql_query = `SELECT ${sql} from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id 
LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
   perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
 LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman = 4 and j.kategori_tpu = 0  and p.deleted = 0 and p2.status != 0  and p.id = p2.permohonan_id   and j.deleted = 0 and p.deleted = 0 ${o} order by p.id desc ${str}`
try {
   const data = await sql_enak.raw(sql_query,value)
console.log(sql_query,value);

 res.json({data:data[0],user:req.user[0]})
} catch (error) {
  console.log(error);
   res.json({data:error})
  
}

})
router.get('/pemakaman_tumpang', cek_login,async function(req, res) {

  res.render('content-backoffice/manajemen_ijin/pemakaman_tumpang',{cetak:req.query.cetak,user:req.user[0]}); 
});

router.post(`/perpanjangan_makam`,async function (req,res) {
  let data = await sql_enak.raw(`SELECT *,p.id as pemohon_id , j.id as jenazah_id , d.id as dokument_id , m.id as makam_id  FROM jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN makam m on m.id = j.makam_id  WHERE p.pin = '${req.body.pin}'  and p.id = p2.permohonan_id `)
  let perpanjangan={}
  perpanjangan.pemohon_id = data[0][0].pemohon_id
  perpanjangan.tanggal_awal = moment().format('YYYY-MM-DD')
  perpanjangan.tanggal_akhir = moment().add(3, 'Y').format('YYYY-MM-DD')
  sql_enak.insert(perpanjangan).into("perpanjangan").then(function (data) {
    res.json(data)
  })
})

router.post(`/uploadSK`,cek_login,upload.fields([{name:'sk',maxCount:1}]),async function (req,res) {
  const dokument = {}  
  let jns_permohonan =  req.body.jns_permohonan
  delete dokument.jns_permohonan
  if (req.files) {
    if (req.files["sk"]) {
      var nama_file = req.files["sk"][0].filename;
      dokument["sk"] = nama_file;  
    }
  }
    const { v4: uuidv4 } = await import('uuid');
  let log = {}
  let now = new Date()
  let luuid = uuidv4()
  log.id = req.body.id
  log.insertedAt = now
  log.lastUpdateAt = now
  log.log_id = luuid
  log.log_uuid = luuid
  log.luuid= luuid
  log.riwayat = 'Draft Sk telah di buat'
  log.t = 'dokument'
  log.user_uuid = req.user[0].id_user
await sql_enak.insert(log).into('log')

await sql_enak("dokument")
  .where("id", "=", req.body.id)
  .update(dokument)
  let data = await sql_enak.raw(`SELECT p.id as permohonan_id,p.email,p.hp ,j.id as jenazah_id ,j.juuid from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id  left join perpanjangan p2 on p2.dokument_id = d.id and p2.status=2 AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC  LIMIT 1)  WHERE  p.deleted = 0  and p.id = p2.permohonan_id  and p2.status !=3  and d.id = ${req.body.id} order by j.id desc`)

  console.log(req.body);
  
  if (jns_permohonan == 0) {
    // let text = `SK ijin penggunaan tanah makam/pemakaman jenazah telah terbit. Silahkan klik link berikut "https://makam.semarangkota.go.id/manajemen_perijinan/pemakaman/cetak/${data[0][0].jenazah_id}"`
    // let text = [`Surat Keputusan (SK) ijin penggunaan tanah makam/pemakaman jenazah`,`Surat Keputusan (SK) ijin penggunaan tanah makam/pemakaman jenazah telah terbit. Silahkan download/lihat file tersebut melalui tombol dibawah ini<br/><a href="https://makam.semarangkota.go.id/foto/${nama_file}" target="_blank" class="button" style="color:white">Download/Lihat</a>"`]
   let text= `https://makam.semarangkota.go.id/foto/${nama_file}`
    // email(data[0][0].email,'SK Terbit',text)
    email(data[0][0].email,'Surat Keputusan (SK) ijin penggunaan tanah makam/pemakaman jenazah terbit',text)
    let hasilWa =await kirimWa(data[0][0].hp,text)

    res.redirect(`/manajemen_perijinan/pemakaman?cetak=`+data[0][0].juuid)
  } else if (jns_permohonan == 4) {
    // let text = `SK ijin pemakaman tumpang telah terbit. Silahkan klik link berikut "https://makam.semarangkota.go.id/manajemen_perijinan/pemakaman/cetak/${data[0][0].jenazah_id}"`
    // let text = `Surat Keputusan (SK) ijin pemakaman tumpang telah terbit. Silahkan download/lihat file tersebut melalui link berikut ini : "https://makam.semarangkota.go.id/foto/${nama_file}"`
    // let text = [`Surat Keputusan (SK) ijin pemakaman tumpang`,`Surat Keputusan (SK) ijin pemakaman tumpang telah terbit. Silahkan download/lihat file tersebut melalui tombol dibawah ini<br/><a href="https://makam.semarangkota.go.id/foto/${nama_file}" target="_blank" class="button" style="color:white">Download/Lihat</a>"`]
   let text= `https://makam.semarangkota.go.id/foto/${nama_file}`

    email(data[0][0].email,'Surat Keputusan (SK) ijin pemakaman tumpang terbit',text)
    let hasilWa =await kirimWa(data[0][0].hp,text)

    res.redirect(`/manajemen_perijinan/pemakaman_tumpang?cetak=`+data[0][0].juuid)
  }
  else if (jns_permohonan == 2) {
    // let text = `Surat Keputusan (SK) ijin pesan tempat makam telah terbit. Silahkan download/lihat file tersebut melalui link berikut ini : "https://makam.semarangkota.go.id/foto/${nama_file}"`

    // let text = [`Surat Keputusan (SK) ijin pesan tempat makam`,`Surat Keputusan (SK) ijin pesan tempat makam telah terbit. Silahkan download/lihat file tersebut melalui tombol dibawah ini<br/><a href="https://makam.semarangkota.go.id/foto/${nama_file}" target="_blank" class="button" style="color:white">Download/Lihat</a>"`]
    let text = `SK ijin pesan tempat telah terbit. Silahkan klik link berikut "https://makam.semarangkota.go.id/manajemen_perijinan/pemakaman/cetak/${data[0][0].jenazah_id}"`

    email(data[0][0].email,'Surat Keputusan (SK) ijin pesan tempat pemakaman terbit',text)
    let hasilWa =await kirimWa(data[0][0].hp,text)

    res.redirect(`/manajemen_perijinan/pesan_tempat_makam?cetak=`+data[0][0].juuid)
  }
})
router.post(`/uploadSKPerpanjangan`,upload.fields([{name:'sk_perpanjangan',maxCount:1}]),async function (req,res) {
  const perpanjangan = {}  
  let jns_permohonan =  req.body.jns_permohonan
  delete perpanjangan.jns_permohonan
  if (req.files) {
    if (req.files["sk_perpanjangan"]) {
      var nama_file = req.files["sk_perpanjangan"][0].filename;
      perpanjangan["sk_perpanjangan"] = nama_file;  
    }
  }
  await sql_enak("perpanjangan")
  .where("id", "=", req.body.id)
  .update(perpanjangan)
  let data = await sql_enak.raw(`SELECT p.id as permohonan_id,p.email ,j.id as jid ,j.juuid from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id   AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC  LIMIT 1)   WHERE  p.deleted = 0 and p.id = p2.permohonan_id  and p2.id =  ${req.body.id}`)

  if (jns_permohonan == 0) {
    
    let text = `Surat Keputusan (SK) perpanjangan ijin penggunaan tanah makam telah terbit. Silahkan download/lihat file tersebut melalui link berikut ini : "https://makam.semarangkota.go.id/foto/${perpanjangan["sk_perpanjangan"]}"`

    // let text = [`Surat Keputusan (SK) perpanjangan ijin penggunaan tanah makam`,`Surat Keputusan (SK) perpanjangan ijin penggunaan tanah makam telah terbit. Silahkan download/lihat file tersebut melalui tombol dibawah ini<br/><a href="https://makam.semarangkota.go.id/foto/${perpanjangan["sk_perpanjangan"]}" target="_blank" class="button" style="color:white">Download/Lihat</a>"`]

    // let text = `SK perpanjangan ijin penggunaan tanah makam telah terbit. Silahkan klik link berikut "https://makam.semarangkota.go.id/manajemen_perijinan/pemakaman/cetak_perpanjangan/${data[0][0].jid}"`
    email(data[0][0].email,'Surat Keputusan (SK) perpanjangan ijin penggunaan tanah makam terbit',text)
    let hasilWa =await kirimWa(data[0][0].hp,text)

    res.redirect(`/manajemen_perijinan/perpanjangan/pemakaman?cetak=`+data[0][0].juuid)

  } else  if (jns_permohonan == 4) {
    
    // let text = [`Surat Keputusan (SK) perpanjangan ijin pemakaman tumpang`,`Surat Keputusan (SK) perpanjangan ijin pemakaman tumpang telah terbit. Silahkan download/lihat file tersebut melalui tombol dibawah ini<br/><a href="https://makam.semarangkota.go.id/foto/${perpanjangan["sk_perpanjangan"]}" target="_blank" class="button" style="color:white">Download/Lihat</a>"`]

    let text = `Surat Keputusan (SK) perpanjangan ijin pemakaman tumpang telah terbit. Silahkan download/lihat file tersebut melalui link berikut ini : "https://makam.semarangkota.go.id/foto/${perpanjangan["sk_perpanjangan"]}"`

    // let text = `SK perpanjangan ijin pemakaman tumpang telah terbit. Silahkan klik link berikut "https://makam.semarangkota.go.id/manajemen_perijinan/pemakaman/cetak_perpanjangan/${data[0][0].jid}"`
    email(data[0][0].email,'Surat Keputusan (SK) perpanjangan ijin pemakaman tumpang terbit',text)
    let hasilWa =await kirimWa(data[0][0].hp,text)

    res.redirect(`/manajemen_perijinan/perpanjangan/pemakaman_tumpang?cetak=`+data[0][0].juuid)
  }else  if (jns_permohonan == 2) {
    // let text = [`Surat Keputusan (SK) perpanjangan ijin pesan tempat`,`Surat Keputusan (SK) perpanjangan ijin pesan tempat telah terbit. Silahkan download/lihat file tersebut melalui tombol dibawah ini<br/><a href="https://makam.semarangkota.go.id/foto/${perpanjangan["sk_perpanjangan"]}" target="_blank" class="button" style="color:white">Download/Lihat</a>"`]
    

    let text = `Surat Keputusan (SK) perpanjangan ijin pesan tempat telah terbit. Silahkan download/lihat file tersebut melalui link berikut ini : "https://makam.semarangkota.go.id/foto/${perpanjangan["sk_perpanjangan"]}"`

  // let text = `SK perpanjangan ijin pesan tempat telah terbit. Silahkan klik link berikut "https://makam.semarangkota.go.id/manajemen_perijinan/pemakaman/cetak_perpanjangan/${data[0][0].jid}"`
  email(data[0][0].email,'SK Terbit',text)
  let hasilWa =await kirimWa(data[0][0].hp,text)

  res.redirect(`/manajemen_perijinan/perpanjangan/pesan_tempat_makam?cetak=`+data[0][0].juuid)
}
})
//PESAN TEMPAT MAKAM


router.get('/pesan_tempat_makam', cek_login,async function(req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
const data = await sql_enak.raw(`SELECT *,(SELECT CASE when isnull(p.tanggal_surat) or isnull(p.tanggal_berlaku_surat)   then 'false' ELSE 'true' END as x FROM perpanjangan p WHERE p.id  = p2.id) as cek,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
when p2.status_pembayaran = 0  then 'Belum Dibayar'
when p2.status_pembayaran = 1  then 'Sudah Dibayar'
END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,k.kecamatan , p2.id as perpanjangan_id from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
     LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman =  2 and p.deleted = 0 and p2.status = 2  and p.id = p2.permohonan_id  and p.deleted = 0 ${o}  and p2.status !=3 order by p.id desc`)

  res.render('content-backoffice/manajemen_ijin/pesan_tempat_makam',{data:data[0]}); 
});
router.get('/perpanjangan/pesan_tempat_makam', cek_login,async function(req, res) { 
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
  const data = await sql_enak.raw(`SELECT *,(SELECT CASE when  p.tanggal_surat = '00-00-0000' or ISNULL(p.tanggal_surat)    then 'false' ELSE 'true' END as x FROM perpanjangan p WHERE p.id  = p2.id) as cek,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,k.kecamatan , p2.id as perpanjangan_id from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
  LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman =  2 and p.deleted = 0 and p2.status = 2  and (j.verifikasi_perpanjangan =2 or p2.status_perpanjangan = 1)  and p2.status !=3  and p.id = p2.permohonan_id   and j.deleted = 0 and p.deleted = 0 ${o} order by p.id desc`)

  res.render('content-backoffice/manajemen_ijin/perpanjangan_pesan_tempat_makam',{data:data[0]}); 
});
router.get(`/pesan_tempat_makam/cetak/:id`,async function (req,res) {
// const data = await sql_enak.raw(`SELECT *,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
// when p2.status_pembayaran = 0  then 'Belum Dibayar'
// when p2.status_pembayaran = 1  then 'Sudah Dibayar'
// END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
// ,CASE 
// when p.kec_id != 0   then (SELECT CONCAT('kecamatan ',k.kecamatan,' kelurahan ',k2.desa) from permohonan p left join kecamatan k on p.kec_id = k.id_kecamatan  LEFT join kelurahan k2 on k2.id_kelurahan = p.kel_id  WHERE p.id = permohonan_id)
// ELSE p.alamat END as alamat_pemohon,
// CASE 
// when j.kec_id != 0   then (SELECT CONCAT('kecamatan ',k.kecamatan,' kelurahan ',k2.desa) from jenazah j2  left join kecamatan k on j2.kec_id = k.id_kecamatan  LEFT join kelurahan k2 on k2.id_kelurahan = j2.kel_id  WHERE j2.id = jenazah_id)
// ELSE p.alamat END as alamat_jenazah,
//  CONCAT(m.kecamatan,' lokasi  ',m.nama_tpu , ' blok  ' , m.blok,' sub blok  ', m.sub_blok , ' nomor liang  ',m.no_liang) as alamat_makam
// ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id , m.id as makam_id from pemohon p left join jenazah j on j.pemohon_id = p.id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id left join perpanjangan p2 on p2.dokument_id = d.id and p2.status=2   WHERE  j.id=${req.params.id}`)

const data = await sql_enak.raw(`SELECT *,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan, NOW() > p2.tanggal_berlaku_surat AS kadaluarsa,
CASE
  WHEN p2.status_pembayaran = 0 THEN 'Belum Dibayar'
  WHEN p2.status_pembayaran = 1 THEN 'Sudah Dibayar'
END AS status_pembayaran,
DATE_FORMAT(p2.tanggal_surat, '%d-%m-%Y') AS tanggal_surat,
DATE_FORMAT(p2.tanggal_berlaku_surat, '%d-%m-%Y') AS tanggal_berlaku_surat,
CASE
  WHEN p.kec_id != 0 THEN (
      SELECT CONCAT( p.alamat,'kecamatan ', k.kecamatan, ' kelurahan ', k2.desa)
      FROM permohonan p3
      LEFT JOIN kecamatan k ON p3.kec_id = k.id_kecamatan
      LEFT JOIN kelurahan k2 ON k2.id_kelurahan = p3.kel_id
      WHERE p.id = p3.id
    )
  ELSE p.alamat
END AS alamat_pemohon,
CASE
  WHEN j.kec_id != 0 THEN (
      SELECT CONCAT( j2alamat,'kecamatan ', k.kecamatan, ' kelurahan ', k2.desa)
      FROM jenazah j2
      LEFT JOIN kecamatan k ON j2.kec_id = k.id_kecamatan
      LEFT JOIN kelurahan k2 ON k2.id_kelurahan = j2.kel_id
      WHERE j2.id = j.id
    )
  ELSE j.alamat
END AS alamat_jenazah,
CONCAT(m.kecamatan, ' lokasi ', m.nama_tpu, ' blok ', m.blok, ' sub blok ', m.sub_blok, ' nomor liang sistem ',m.no_liang ) AS alamat_makam,
DATE_FORMAT(j.inserted, '%d-%m-%Y') AS inserted,
DATE_FORMAT(j.tanggal_meninggal, '%d-%m-%Y') AS tanggal_meninggal,
DATE_FORMAT(j.tanggal_dimakamkan, '%d-%m-%Y') AS tanggal_dimakamkan,
p.id AS permohonan_id,
j.id AS jenazah_id,
d.id AS dokument_id,
m.id AS makam_id
FROM jenazah j
LEFT JOIN permohonan p ON j.id = p.jenazah_id
LEFT JOIN dokument d ON d.jenazah_id = j.id
LEFT JOIN (
SELECT DISTINCT p2.id, p2.tanggal_berlaku_surat, p2.status_pembayaran, p2.tanggal_surat, p2.status, p2.permohonan_id, p2.dokument_id, p2.status_perpanjangan
FROM perpanjangan p2
WHERE p2.status = 2
ORDER BY p2.id DESC
) p2 ON p2.dokument_id = d.id
LEFT JOIN makam m ON m.id = j.makam_id
LEFT JOIN kecamatan k ON k.id_kecamatan = m.id_kec
WHERE p.jns_pemakaman = 2
AND p.deleted = 0
AND p2.status = 2
AND p.id = p2.permohonan_id
AND p.deleted = 0
AND p2.status != 3
AND j.juuid = '${req.params.id}';
`)
await sql_enak("makam")
  .where("id", "=", data[0][0].makam_id)
  .update({status_makam:2})
  if (data[0][0].periode == 0) {
    await sql_enak("dokument")
    .where("id", "=", data[0][0].dokument_id)
    .update({periode:1})
  }
  res.json({message:'sukses!'})
})
router.post(`/inputDataSK`,async function (req,res) {
  let perpanjangan={}
  perpanjangan = req.body
  let jenazah_id = req.body.jenazah_id
  let jns_permohonan =  req.body.jns_permohonan
  let juuid = req.body.juuid
  delete perpanjangan.jns_permohonan
  delete perpanjangan.jenazah_id
  delete perpanjangan.juuid
  perpanjangan.tanggal_berlaku_surat = moment(req.body.tanggal_surat).add(3, 'Y').format('YYYY-MM-DD')
    await sql_enak("perpanjangan")
    .where("id", "=", perpanjangan.id)
    .update(perpanjangan)
  // }
  // res.redirect(`/manajemen_perijinan/pemakaman/cetak/${jenazah_id}`)

  if (jns_permohonan == 0) {
    res.redirect(`/manajemen_perijinan/pemakaman?cetak=`+juuid)

  } else if (jns_permohonan == 2) {
    res.redirect(`/manajemen_perijinan/pesan_tempat_makam?cetak=`+juuid)
  }else if (jns_permohonan == 4) {
    res.redirect(`/manajemen_perijinan/pemakaman_tumpang?cetak=`+juuid)
  }
})
router.post(`/inputDataSKPerpanjangan`,async function (req,res) {
  let perpanjangan={}
  perpanjangan = req.body
  
  perpanjangan.status_perpanjangan = 1
  let jenazah_id = req.body.jenazah_id
  let jns_permohonan =  req.body.jns_permohonan
    let juuid =  req.body.juuid
      console.log(req.body,'req.body',juuid);

  delete perpanjangan.juuid

  delete perpanjangan.jns_permohonan
  await sql_enak("jenazah")
    .where("id", "=", jenazah_id)
    .update({
      verifikasi_perpanjangan : 0,
      tanggal_daftar_perpanjangan : null
    })
  delete perpanjangan.jenazah_id
  perpanjangan.tanggal_berlaku_surat = moment(req.body.tanggal_surat).add(3, 'Y').format('YYYY-MM-DD')
  // console.log(perpanjangan,req.body.tanggal_surat);
    await sql_enak("perpanjangan")
    .where("id", "=", perpanjangan.id)
    .update(perpanjangan)
  // }
  // res.redirect(`/manajemen_perijinan/pemakaman/cetak/${permohonan_id}`)
  if (jns_permohonan == 0) {
    // res.redirect(`/manajemen_perijinan/perpanjangan/pemakaman?cetak=`+jenazah_id)cetak_perpanjangan
    console.log(`/manajemen_perijinan/perpanjangan/pemakaman?cetak=${juuid}`);
    
  res.redirect(`/manajemen_perijinan/perpanjangan/pemakaman?cetak=${juuid}`)
  
  } else if (jns_permohonan == 4) {
    res.redirect(`/manajemen_perijinan/perpanjangan/pemakaman_tumpang?cetak=`+juuid)
  }else if (jns_permohonan == 2) {
    res.redirect(`/manajemen_perijinan/perpanjangan/pesan_tempat_makam?cetak=`+juuid)
  }
})
router.get(`/getPerpanjanganById`,async function (req,res) {
  let a = ''
  if (req.query.perpanjangan) {
    a+=` and p.id =${req.query.perpanjangan} `

  }
  if (req.query.dokument) {
    a+=` and p.dokument_id =${req.query.dokument} AND p.tanggal_berlaku_surat`
  }
  const data =await sql_enak.raw(`SELECT *,DATE_FORMAT(p.tanggal_surat , '%Y-%m-%d') as tanggal_surat,DATE_FORMAT(p.tanggal_berlaku_surat , '%Y-%m-%d') as tanggal_berlaku_surat  FROM perpanjangan p WHERE 1 ${a} ORDER by p.id DESC `)
  // console.log(data[0]);
  res.json({data:data[0]})
})
module.exports = router;
