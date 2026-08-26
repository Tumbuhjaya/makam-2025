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
    var email_helper = require('../helpper/email.js').email;

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
  moment.locale('id')
var nodemailer = require('nodemailer')
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
   user: 'makam.semarangkota@gmail.com',
    pass: '***REMOVED***'
  }
});
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
function email(email,subject,isi) {
  console.log(email,subject,isi,'email,subject,isi');
   let mailOption = {
    from: 'noreply@survplus.id',
    to: email,
    subject: subject,
    text: isi
  }
 console.log(mailOption,'mailOption');
  
  transporter.sendMail(mailOption, (err, data) => {
    if (err) {
      console.log(err, 'error!');
    } else {
      console.log('sukses!');
    }
  })
}
//start-------------------------------------
router.get('/pemakaman', cek_login,async function(req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  j.tpu = ${req.user[0].master_makam_id}`
  }
  let t =''
  if (req.query.status) {
    t = ` AND p2.status = ${req.query.status} `

  }else{
    t = ` AND p2.status != 2 `

  }
  // console.log(req.user[0]);
  const data = await sql_enak.raw(`SELECT *,
  k.kecamatan AS kecamatan_pemohon,
  k3.desa AS kelurahan_pemohon,
  k2.kecamatan AS kecamatan_jenazah,
  k4.desa AS kelurahan_jenazah,
  k5.kecamatan AS kecamatan_tpu
    ,CASE 
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
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id 
  from  jenazah j  
  left join permohonan p on j.id = p.jenazah_id   and p.deleted = 0
  LEFT JOIN dokument d on d.jenazah_id = j.id  and d.deleted = 0
  LEFT JOIN master_makam mm ON mm.id = j.tpu
  AND mm.deleted = 0
    LEFT JOIN kecamatan k5 ON k5.id_kecamatan = mm.id_kec 
      left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 and x2.status !=2 ) as  p2 on p2.dokument_id =d.id  
   left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id 
WHERE p.jns_pemakaman =  0 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1 ${t} and j.verifikasi_perpanjangan = 0 and p.deleted = 0 ${o}  and p2.status !=2  and p.id = p2.permohonan_id  order by p.id desc`)

  res.render('content-backoffice/manajemen_pemakaman_special/list',{data:data[0],user:req.user[0],status:req.query.status||''}); 
});

router.get('/pemakaman/insert', cek_login,async function(req, res) {
   const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")

  res.render('content-backoffice/manajemen_pemakaman_special/insert' , {kec:kec[0]}) 
});
router.get('/pemakaman_tumpang/insert', cek_login,async function(req, res) {
   const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")

  res.render('content-backoffice/manajemen_pemakaman_tumpang_special/insert' , {kec:kec[0]}) 
});
router.get('/pemakaman/edit/:id', cek_login,async function(req, res) {
    const data = await sql_enak.raw(`SELECT *,d.keterangan as ket,DATE_FORMAT(p2.tanggal_surat , '%Y-%m-%d') as tanggal_surat,p.alamat as alamat_pemohon , j.alamat as alamat_jenazah,p.kec_id as kec_pemohon,p.kel_id as kel_pemohon ,j.kec_id as kec_jenazah,j.kel_id as kel_jenazah ,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted,p2.id as perpanjangan_id ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id ,j.agama as agama_jenazah ,d.keterangan as ket ,
      k.id_kecamatan as kecamatan_pemohon_id,k3.id_kelurahan as kelurahan_pemohon_id,k2.id_kecamatan as kecamatan_jenazah_id,k4.id_kelurahan as kelurahan_jenazah_id
      from  jenazah j  
left join (select p.jenazah_id , p.id as permohonan_id from permohonan p where deleted = 0 group by p.jenazah_id) as p3 on p3.jenazah_id = j.id
left join permohonan p on p.id = p3.permohonan_id    
LEFT JOIN dokument d on d.jenazah_id = j.id 
left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id 
LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id AND p2.status != 2 
left join master_makam mm on mm.id = j.tpu  WHERE p.jns_pemakaman =  0 and j.deleted = 0  and p.deleted = 0  and p.id = p2.permohonan_id and j.juuid ='${req.params.id}'`)
  const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")
  const kel_pemohon = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0][0].kecamatan_pemohon_id}`)
  const kel_jenazah = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0][0].kecamatan_jenazah_id}`)
  const lokasi = await sql_enak.raw(`SELECT * FROM master_makam mm  WHERE mm.deleted = 0  and mm.id = ${data[0][0].tpu} `)
  const blok = await sql_enak.raw(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0    and m.nama_tpu = '${data[0][0].nama_tpu}'`)
  const sub_blok = await sql_enak.raw(`SELECT m.id,m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 and m.nama_tpu = '${data[0][0].nama_tpu}'  and m.blok =   '${data[0][0].blok}' `)
  const no_liang = await sql_enak.raw(`SELECT  m.id,m.no_liang  as no_liang  FROM makam m WHERE m.deleted = 0 and m.jns_makam !=2  and m.nama_tpu = '${data[0][0].nama_tpu}'  and m.blok =   '${data[0][0].blok}'  and m.sub_blok  = '${data[0][0].sub_blok}'  order by m.no_liang asc`)
  let x = sub_blok[0].sort((a,b)=>a.subblok.substring(1,a.subblok.length)-b.subblok.substring(1,b.subblok.length))
  // console.log(data[0][0]);
  res.render('content-backoffice/manajemen_pemakaman_special/edit',{id:req.params.id ,kel_pemohon:kel_pemohon[0],kel_jenazah:kel_jenazah[0], data:data[0],kec:kec[0],lokasi:lokasi[0],blok:blok[0],sub_blok:x,no_liang:no_liang[0]}); 
});
router.get('/pemakaman_tumpang', cek_login,async function(req, res) {
    let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  j.tpu = ${req.user[0].master_makam_id}`
  }
  if (req.query.status) {
    t = ` AND p2.status = ${req.query.status} `

  }else{
    t = ` AND p2.status != 2 `

  }
 const data = await sql_enak.raw(`SELECT *,j.makam_id as makam_jenazah,
  k.kecamatan AS kecamatan_pemohon,
  k3.desa AS kelurahan_pemohon,
  k2.kecamatan AS kecamatan_jenazah,
  k4.desa AS kelurahan_jenazah,
  k5.kecamatan AS kecamatan_tpu
    ,CASE 
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
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id 
  from  jenazah j  
  left join permohonan p on j.id = p.jenazah_id    AND p.deleted = 0
  LEFT JOIN dokument d on d.jenazah_id = j.id   AND d.deleted = 0
  LEFT JOIN master_makam mm ON mm.id = j.tpu
  AND mm.deleted = 0
    LEFT JOIN kecamatan k5 ON k5.id_kecamatan = mm.id_kec 
  left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 and x2.status !=2 ) as  p2 on p2.dokument_id =d.id  
   left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id 
WHERE p.jns_pemakaman =  4 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1 ${t} and j.verifikasi_perpanjangan = 0 and p.deleted = 0 ${o}  and p2.status !=2  and p.id = p2.permohonan_id  order by p.id desc`)
  
  res.render('content-backoffice/manajemen_pemakaman_tumpang_special/list',{data:data[0],user:req.user[0],status:req.query.status||''})
});
router.get('/pemakaman_tumpang/edit/:id', cek_login,async function(req, res) {
    const data = await sql_enak.raw(`SELECT *,d.keterangan as ket,m.agama as cluster,m.id_kec as kecamatan_makam ,m.nama_tpu as lokasi_makam ,m.blok as blok_makam , m.sub_blok as subblok_makam ,m.no_liang as nomor_liang_makam,DATE_FORMAT(p2.tanggal_surat , '%Y-%m-%d') as tanggal_surat,p.alamat as alamat_pemohon , j.alamat as alamat_jenazah,p.kec_id as kec_pemohon,p.kel_id as kel_pemohon,m.id as makam_id,j.agama as agama_jenazah ,j.kec_id as kec_jenazah,j.kel_id as kel_jenazah ,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted,p2.id as perpanjangan_id ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam_tambahan mt on mt.id = j.makam_id and mt.deleted = 0
left join makam m on m.id = mt.makam_id and m.deleted = 0 LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id AND p2.status != 2 WHERE p.jns_pemakaman =  4 and j.deleted = 0  and p.deleted = 0  and p.id = p2.permohonan_id and j.juuid ='${req.params.id}'`)
  const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")
  const lokasi = await sql_enak.raw(`SELECT * FROM master_makam mm  WHERE mm.deleted = 0   and mm.id = ${data[0][0].master_makam_id} `)
  const blok = await sql_enak.raw(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0    and m.nama_tpu = '${data[0][0].lokasi_makam}'`)
  const sub_blok = await sql_enak.raw(`SELECT m.id,m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 and m.nama_tpu = '${data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].blok_makam}' `)
  const no_liang = await sql_enak.raw(`SELECT
     j.*,
     DATE_FORMAT(j.tanggal_meninggal , '%Y-%m-%d') AS tanggal_meninggal,
     a.blok,
     a.sub_blok,
     a.hex
 FROM
     makam a
 INNER JOIN
     makam_tambahan mt ON a.id = mt.makam_id and mt.deleted = 0
 INNER JOIN
     jenazah j ON mt.id = j.makam_id and j.deleted = 0 where a.deleted = 0  and j.kategori_tpu = 1     AND j.tanggal_meninggal <= DATE_SUB(CURDATE(), INTERVAL 3 YEAR) AND j.tanggal_meninggal = (
         SELECT
             MAX(j2.tanggal_meninggal)
         FROM
             jenazah j2
         WHERE
             j2.makam_id = j.makam_id
             AND j2.deleted = 0
     )  and   a.nama_tpu = '${data[0][0].lokasi_makam}' and a.blok =  '${data[0][0].blok_makam}' and a.sub_blok =  '${data[0][0].subblok_makam}' and mt.status_tumpang = 1      AND j.tanggal_dimakamkan = ( 
       SELECT MAX(j2.tanggal_dimakamkan)
       FROM jenazah j2 INNER JOIN dokument d ON j2.id = d.jenazah_id
 INNER JOIN perpanjangan p ON d.id = p.dokument_id
       WHERE j2.makam_id = mt.id AND j2.deleted = 0 and p.status =2
   )
   AND j.tanggal_dimakamkan <= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)  group BY j.makam_id`)
  let x = sub_blok[0].sort((a,b)=>a.subblok.substring(1,a.subblok.length)-b.subblok.substring(1,b.subblok.length))
  
  res.render('content-backoffice/manajemen_pemakaman_tumpang_special/verifikasi',{no_liang:no_liang[0],sub_blok:x,blok:blok[0],lokasi:lokasi[0],data:data[0],kec:kec[0]}); 

  });
router.post('/pemakaman/submit_verifikasi',upload.fields([{name:'foto_ktp_pemohon',maxCount:1},{name:'foto_ktp_jenazah',maxCount:1},{name:'surat_pemeriksaan',maxCount:1},{name:'surat_rumah_sakit',maxCount:1},{name:'surat_lurah',maxCount:1},{name:'surat_kematian',maxCount:1}]), cek_login,async function(req, res) {
  console.log(req.body,'req.body');
    console.log(req.files,'req.files');
        let {subblok_makam,nik_jenazah,alamat_jenazah,kelurahan_jenazah,kecamatan_jenazah,tanggal_dimakamkan,agama,domisili_jenazah,tanggal_meninggal,jenis_kelamin,nama_jenazah,email,hp,kelurahan_pemohon,kecamatan_pemohon,alamat_pemohon,domisili_pemohon,nik,pekerjaan,nama_ahli_waris,dokument_id,keterangan,jns_pemakaman,verifikasi,makam_id,permohonan_id,nomor_surat,catatan_revisi,jenazah_id,perpanjangan_id} = req.body
  const permohonan = {}
  const jenazah ={}
  const dokument = {}
  const perpanjangan = {}
  const log={}
  const makam = {}
  makam.makam_id = subblok_makam
  // if (makam_id) {
  //     await sql_enak("makam")
  //     .where("makam_id", "=", makam_id)
  //     .update(makam)
  // }

  dokument["id"] = dokument_id;  
  dokument.keterangan = keterangan
  // console.log(req.body);


  if (jns_pemakaman == 0) {

        if(verifikasi=='2'){
    if (jns_pemakaman == '0') {
  
          let q = `SELECT * from makam m WHERE  m.deleted = 0  and m.id =   '${subblok_makam}' `
    console.log(q ,'ini q');
    
    let cek_makam = await sql_enak.raw(q)
    console.log( cek_makam[0][0]);
    if(cek_makam[0].length>0){
    
        jenazah.blok = cek_makam[0][0].blok
    jenazah.sub_blok = cek_makam[0][0].sub_blok
    jenazah.tpu = cek_makam[0][0].master_makam_id
    if (makam_id=='null'||!makam_id) {
            let data = await sql_enak.insert({makam_id:cek_makam[0][0].id,status_makam:2, jumlah_jenazah:1, status_tumpang:0, }).into('makam_tambahan')
       
      console.log(data);

      jenazah.makam_id=data[0]
    }


              }

    }else{
           let q = `SELECT *  from makam_tambahan m WHERE  m.deleted = 0 and m.id = '${makam_id}'`
    let cek_makam = await sql_enak.raw(q)
      await sql_enak(table).where('id','=',makam_id).update({jumlah_jenazah:cek_makam[0][0].jumlah_jenazah++})
    }
    }
  }          


  log.permohonan_id = permohonan_id


  perpanjangan.nomor_surat=nomor_surat
  perpanjangan.status=+verifikasi
  perpanjangan.catatan_revisi=catatan_revisi
  if(verifikasi=='3' && jns_pemakaman ==0){
      // await sql_enak("makam")
      // .where("id", "=", nomor_liang_makam)
      // .update({status_makam:0})
      await sql_enak("jenazah")
      .where("id", "=", jenazah_id)
      .update({deleted :1})
  }

  if (verifikasi!='3') {
    await sql_enak("jenazah")
    .where("id", "=", jenazah_id)
    .update({deleted :0})
  }
 
  await sql_enak("perpanjangan")
  .where("id", "=", perpanjangan_id)
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
  // jenazah.verifikasi= +verifikasi
  permohonan.nama_ahli_waris=nama_ahli_waris
  permohonan.pekerjaan=pekerjaan
  permohonan.nik=nik
  permohonan.domisili=domisili_pemohon
  permohonan.alamat=alamat_pemohon
  permohonan.kec_id=kecamatan_pemohon
  permohonan.kel_id=kelurahan_pemohon
  permohonan.hp=hp
  permohonan.email=email

  // permohonan.pin=insert_pin
  permohonan.jns_pemakaman=+(jns_pemakaman)
  jenazah.nama_jenazah=nama_jenazah
  jenazah.jenis_kelamin=jenis_kelamin
  jenazah.agama=agama
  jenazah.domisili_jenazah=domisili_jenazah
  jenazah.tanggal_meninggal=tanggal_meninggal
  jenazah.tanggal_dimakamkan=tanggal_dimakamkan
  // jenazah.makam_id=nomor_liang_makam
  jenazah.kec_id=kecamatan_jenazah
  jenazah.kel_id=kelurahan_jenazah
  jenazah.alamat=alamat_jenazah
  jenazah.nik_jenazah=nik_jenazah

  // jenazah.catatan_revisi=catatan_revisi
  // jenazah.kode_billing= hasil.idbiling
  console.log(jenazah);
  
  await sql_enak("jenazah")
  .where("id", "=", jenazah_id)
  .update(jenazah)
  await sql_enak("dokument")
  .where("id", "=", dokument_id)
  .update(dokument)
  await sql_enak("permohonan")
  .where("id", "=", permohonan_id)
  .update(permohonan)
  await sql_enak("perpanjangan")
  .where("id", "=", perpanjangan_id)
  .update(perpanjangan)
  let text_email = ''
  let subject_email = ''
  if (verifikasi=='1') {
    text_email = `Silahkan lengkapi persyaratan permohonan ijin anda melalui link berikut ini : "https://makam.semarangkota.go.id/revisi_dokumen/${dokument_id}"`
    subject_email = 'Permohonanan ijin direvisi'
  }else   if (verifikasi=='2') {
    if (jns_pemakaman == '0') {
      subject_email = 'Permohonan ijin penggunaan tanah makam/pemakaman jenazah disetujui'
      text_email = `Permohonan ijin penggunaan tanah makam/pemakaman jenazah anda telah disetujui oleh pengelola TPU, silahkan melakukan pemakaman jenazah sesuai dengan permohonan yang telah setujui ini. Untuk SK ijin penggunaan tanah makam/pemakaman jenazah akan kami kirimkan melalui email ini.`
    }else{
      subject_email = 'Permohonan ijin pemakaman tumpang disetujui'
      text_email = `Permohonan ijin pemakaman tumpang anda telah disetujui oleh pengelola TPU, silahkan melakukan pemakaman jenazah tumpang sesuai dengan permohonan yang telah setujui ini. Untuk SK ijin pemakaman tumpang akan kami kirimkan melalui email ini.`
    }
    
  }else   if (verifikasi=='3') {
    if (jns_pemakaman == '0') {
      text_email = `Permohonan ijin penggunaan tanah makam/pemakaman jenazah dibatalkan`
    }else{
      text_email = `Permohonan ijin pemakaman tumpang dibatalkan`
    }
    subject_email = 'Permohonan ijin dibatalkan'

  }
      // await email_helper(email,subject_email,text_email)
let mailOption = {
    from: 'noreply@survplus.id',
    to: req.body.email,
    subject: subject_email,
    text: text_email
  }
  transporter.sendMail(mailOption, (err, data) => {
    if (err) {
      console.log(err, 'error!');
    } else {
      console.log('sukses!');
    }
  })
    if (jns_pemakaman == 0) {
    res.redirect(`/manajemen_pemakaman_special/pemakaman`)
  } else if (jns_pemakaman == 4) {
     res.redirect(`/manajemen_pemakaman_special/pemakaman_tumpang`)
  }
  // res.json({body:req.body,file:req.files})
  // res.render('content-backoffice/manajemen_pemakaman_special/'); 
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
let makam_sebelum = {}
 let makam_Sesudah = {}
 console.log(req.body,'req.body');
 
    if (req.body.jns_pemakaman==4) {
         makam_sebelum = await sql_enak.raw(`SELECT * FROM makam_tambahan m WHERE id = `+req.body.makam_sebelumnya)
           makam_Sesudah = await sql_enak.raw(`SELECT * FROM makam_tambahan m WHERE id = `+req.body.makam_id)
    }else{
      let data_makam_sebelum = await sql_enak.raw(`SELECT * FROM makam_tambahan m WHERE id = `+req.body.makam_sebelumnya)
      console.log(data_makam_sebelum[0][0],'data_makam_sebelum[0][0]',req.body.subblok_makam,req.body.makam_sebelumnya);
      
   makam_sebelum = await sql_enak.raw(`SELECT * FROM makam m WHERE id = `+data_makam_sebelum[0][0].makam_id)
   makam_Sesudah = await sql_enak.raw(`SELECT * FROM makam m WHERE id = `+req.body.subblok_makam)
  jenazah.blok = makam_Sesudah[0][0].blok
    jenazah.sub_blok = makam_Sesudah[0][0].sub_blok
    jenazah.tpu = makam_Sesudah[0][0].master_makam_id
    }

    console.log(makam_Sesudah[0][0] , 'makam_Sesudah[0][0]' ,makam_sebelum[0][0]  ,'makam_sebelum[0][0] ' );
    
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
    // if (makam_Sesudah[0][0].status_makam==0&&makam_Sesudah[0][0].jumlah_jenazah==0) {
    // console.log('if',2);

    // await sql_enak("makam")
    // .where("id", "=", req.body.nomor_liang_makam)
    // .update({status_makam:makam_sebelum[0][0].status_makam,jumlah_jenazah:makam_sebelum[0][0].jumlah_jenazah,status_tumpang:makam_sebelum[0][0].status_tumpang})
    // let data = {status_makam:0,jumlah_jenazah:0,status_tumpang:0}
    // if (makam_sebelum[0][0].jumlah_jenazah>1) {
    //       console.log('if',3);
    //   data = {status_makam:makam_sebelum[0][0].status_makam,jumlah_jenazah:Number(makam_sebelum[0][0].jumlah_jenazah)-1,status_tumpang:1}
    // }
    // await sql_enak("makam")
    // .where("id", "=", req.body.makam_sebelum)
    // .update(data)
    if (makam_sebelum[0][0]) {
      
  if (makam_sebelum[0][0].id!=makam_Sesudah[0][0].id && req.body.jns_pemakaman ==0) {
    console.log('if',1);
      
      let data = await sql_enak.insert({makam_id: req.body.subblok_makam, status_makam:makam_sebelum[0][0].status_makam,jumlah_jenazah:makam_sebelum[0][0].jumlah_jenazah,status_tumpang:makam_sebelum[0][0].status_tumpang }).into('makam_tambahan')
         await sql_enak("makam_tambahan")
  .where("id", "=", req.body.makam_sebelumnya)
  .update({deleted :1})
      console.log(data);

      jenazah.makam_id=data[0]

    }
  }else   if (makam_sebelum[0][0].id!=makam_Sesudah[0][0].id && req.body.jns_pemakaman ==4) {
          console.log(makam_sebelum[0][0].id!=makam_Sesudah[0][0].id ,'else if');

      jenazah.makam_id=req.body.makam_id

        }else{
                let data = await sql_enak.insert({makam_id: req.body.subblok_makam, status_makam:2,jumlah_jenazah:1,status_tumpang:0}).into('makam_tambahan')
       
      console.log(data,'else');

      jenazah.makam_id=data[0]

        }

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
      redirect = '/manajemen_pemakaman_special/ijin/pemakaman'
      break;
      case '2':
      redirect = '/manajemen_pemakaman_special/ijin/pemakaman_tumpang'
      break;
      case '3':
      redirect = '/manajemen_pemakaman_special/ijin/perpanjangan/pemakaman'
      break;
      case '4':
        redirect = '/manajemen_pemakaman_special/ijin/perpanjangan/pemakaman_tumpang'
      break;
    default:
      break;
  }
  


  
    res.redirect(redirect)

  // }else{
  //   res.json('Harus di makam yang kosong')
  // }



})
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
  const data = await sql_enak.raw(`SELECT ${b} from jenazah j  left join permohonan p on j.id = p.jenazah_id  and p.deleted = 0 LEFT JOIN dokument d on d.jenazah_id = j.id   and d.deleted = 0 LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id   LEFT join makam_tambahan mt  on mt.id = j.makam_id  and mt.deleted = 0
  left join makam m on mt.makam_id = m.id and m.deleted = 0 LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman =  4 and j.kategori_tpu = 1  ${o} and p.deleted = 0 and p2.status = 2  and (j.verifikasi_perpanjangan =2 or p2.status_perpanjangan = 1)   and p.id = p2.permohonan_id   and j.deleted = 0 and p.deleted = 0 ${a}  order by p.id desc ${str}`,value)
    res.json({data:data[0],user:req.user[0]})
  });
router.get('/perpanjangan_pemakaman', cek_login,async function(req, res) {
    let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and   m.master_makam_id  = ${req.user[0].master_makam_id}`
  }
  let t =''
  if (req.query.status) {
    t = ` AND p2.status = ${req.query.status} `

  }
  let sql = `SELECT *,
  k.kecamatan AS kecamatan_pemohon,
  k3.desa AS kelurahan_pemohon,
  k2.kecamatan AS kecamatan_jenazah,
  k4.desa AS kelurahan_jenazah,
  k5.kecamatan AS kecamatan_tpu,
        k.id_kecamatan as kecamatan_pemohon_id,k3.id_kelurahan as kelurahan_pemohon_id,k2.id_kecamatan as kecamatan_jenazah_id,k4.id_kelurahan as kelurahan_jenazah_id
    ,CASE 
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
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted   ,DATE_FORMAT(j.tanggal_daftar_perpanjangan , '%d-%m-%Y') as tanggal_daftar_perpanjangan,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id 
  from  jenazah j  
  left join permohonan p on j.id = p.jenazah_id   and p.deleted = 0
  LEFT JOIN dokument d on d.jenazah_id = j.id  and d.deleted = 0
  left join makam_tambahan mt on mt.id = j.makam_id   AND mt.deleted = 0
  left join makam m  on m.id = mt.makam_id   AND m.deleted = 0
  LEFT JOIN master_makam mm ON mm.id = m.master_makam_id AND mm.deleted = 0
    LEFT JOIN kecamatan k5 ON k5.id_kecamatan = mm.id_kec 
      left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 and x2.status !=2  ) as  p2 on p2.dokument_id =d.id  
   left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id 
WHERE p.jns_pemakaman =  0 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1 ${t} and j.verifikasi_perpanjangan = 1 and p.deleted = 0 ${o}  and p2.status !=2   and p.id = p2.permohonan_id  order by p.id desc`
  const data = await sql_enak.raw(sql)
console.log(sql);
  res.render('content-backoffice/manajemen_perpanjangan_pemakaman_special/list',{cetak:req.query.cetak ,data:data[0]}); 
});
router.get('/perpanjangan_pemakaman/insert', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_perpanjangan_pemakaman_special/insert'); 
});

router.get('/perpanjangan_pemakaman/edit/:id', cek_login,async function(req, res) {
    const data = await sql_enak.raw(`SELECT *,p.kec_id as kec_pemohon,p.kel_id as kel_pemohon,p.alamat as alamat_pemohon,j.kec_id as kec_jenazah,j.kel_id as kel_jenazah,j.agama as agama_jenazah,j.alamat as alamat_jenazah, m.id_kec as kecamatan_makam,m.nama_tpu as lokasi_makam , m.blok as blok_makam , m.sub_blok as subblok_makam ,
  k.kecamatan AS kecamatan_pemohon,
  k3.desa AS kelurahan_pemohon,
  k2.kecamatan AS kecamatan_jenazah,
  k4.desa AS kelurahan_jenazah,
  k5.kecamatan AS kecamatan_tpu,
        k.id_kecamatan as kecamatan_pemohon_id,k3.id_kelurahan as kelurahan_pemohon_id,k2.id_kecamatan as kecamatan_jenazah_id,k4.id_kelurahan as kelurahan_jenazah_id
    ,CASE 
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
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan
   ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal_2,DATE_FORMAT(j.tanggal_dimakamkan  ,'%Y-%m-%d') as tanggal_dimakamkan_2,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id 
  from  jenazah j  
  left join permohonan p on j.id = p.jenazah_id   and p.deleted = 0
  LEFT JOIN dokument d on d.jenazah_id = j.id  and d.deleted = 0
  left join makam_tambahan mt on mt.id = j.makam_id   AND mt.deleted = 0
  left join makam m  on m.id = mt.makam_id   AND m.deleted = 0
  LEFT JOIN master_makam mm ON mm.id = m.master_makam_id AND mm.deleted = 0
    LEFT JOIN kecamatan k5 ON k5.id_kecamatan = mm.id_kec 
      left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 and x2.status !=2 ) as  p2 on p2.dokument_id =d.id  
   left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id 
WHERE p.jns_pemakaman =  0 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1  AND p2.status != 2  and j.verifikasi_perpanjangan = 1 and p.deleted = 0   and p.id = p2.permohonan_id   and j.juuid ='${req.params.id}'`)
  const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")
  const lokasi = await sql_enak.raw(`SELECT * FROM master_makam mm  WHERE mm.deleted = 0  and mm.id = ${data[0][0].tpu} `)
    const kel_pemohon = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0][0].kecamatan_pemohon_id}`)
  const kel_jenazah = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0][0].kecamatan_jenazah_id}`)
  const blok = await sql_enak.raw(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0    and m.nama_tpu = '${data[0][0].nama_tpu}'`)
  const sub_blok = await sql_enak.raw(`SELECT m.id,m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 and m.nama_tpu = '${data[0][0].nama_tpu}'  and m.blok =   '${data[0][0].blok}' `)
  const no_liang = await sql_enak.raw(`SELECT  m.id,m.no_liang  as no_liang  FROM makam m WHERE m.deleted = 0 and m.jns_makam !=2  and m.nama_tpu = '${data[0][0].nama_tpu}'  and m.blok =   '${data[0][0].blok}'  and m.sub_blok  = '${data[0][0].sub_blok}'  order by m.no_liang asc`)
  let x = sub_blok[0].sort((a,b)=>a.subblok.substring(1,a.subblok.length)-b.subblok.substring(1,b.subblok.length))
  console.log({id:req.params.id,data:data[0],kec:kec[0],lokasi:lokasi[0],blok:blok[0],sub_blok:x,no_liang:no_liang[0]});
  
  res.render('content-backoffice/manajemen_perpanjangan_pemakaman_special/verifikasi',{id:req.params.id,data:data[0],kel_pemohon:kel_pemohon[0],kel_jenazah:kel_jenazah[0],kec:kec[0],lokasi:lokasi[0],blok:blok[0],sub_blok:x,no_liang:no_liang[0]}); 
});
router.get('/perpanjangan_pemakaman_tumpang', cek_login,async function(req, res) {
      let o = ''
      console.log('ini perpanjangan_pemakaman_tumpang');
      
  if (req.user[0].is_admin==0) {
    o+=` and  mm.id = ${req.user[0].master_makam_id}`
  }
  if (req.query.status) {
    t = ` AND p2.status = ${req.query.status} `

  }else{
    t = ` AND p2.status != 2 `

  }
  let q = `SELECT
    *,DATE_FORMAT(inserted_perpanjangan  , '%d-%m-%Y') inserted_perpanjangan,
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
    p2.id AS perpanjangan_id
FROM
    jenazah j
LEFT JOIN
    permohonan p ON j.id = p.jenazah_id AND p.deleted = 0 AND p.jns_pemakaman = 4
LEFT JOIN
    dokument d ON d.jenazah_id = j.id AND d.deleted = 0
LEFT JOIN
    master_makam mm ON mm.id = j.tpu AND mm.deleted = 0
LEFT JOIN
    kecamatan k5 ON k5.id_kecamatan = mm.id_kec
LEFT JOIN
    kecamatan k ON k.id_kecamatan = p.kec_id
LEFT JOIN
    kecamatan k2 ON k2.id_kecamatan = j.kec_id
LEFT JOIN
    kelurahan k3 ON k3.id_kelurahan = p.kel_id
LEFT JOIN
    kelurahan k4 ON k4.id_kelurahan = j.kel_id
     left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 and x2.status !=2  ) as  p2 on p2.dokument_id =d.id  
WHERE
  p.jns_pemakaman =  4 ${o} and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1   and j.verifikasi_perpanjangan = 1 and p.deleted = 0   and p2.status !=2  and p.id = p2.permohonan_id  order by p.id desc`
 const data = await sql_enak.raw(q)
 console.log(q,'asdfghj');
 
  
  res.render('content-backoffice/manajemen_perpanjangan_pemakaman_tumpang_special/list',{cetak:req.query.cetak ,data:data[0]}); 
});

router.get('/perpanjangan_pemakaman_tumpang/insert', cek_login, function(req, res) {
  res.render('content-backoffice/manajemen_perpanjangan_pemakaman_tumpang_special/insert'); 
});

router.get('/perpanjangan_pemakaman_tumpang/edit/:id', cek_login,async function(req, res) {
   const data = await sql_enak.raw(`SELECT *,p.kec_id as kec_pemohon,p.kel_id as kel_pemohon,p.alamat as alamat_pemohon,j.kec_id as kec_jenazah,j.kel_id as kel_jenazah,j.agama as agama_jenazah,j.alamat as alamat_jenazah, m.id_kec as kecamatan_makam,m.nama_tpu as lokasi_makam , m.blok as blok_makam , m.sub_blok as subblok_makam ,
  k.kecamatan AS kecamatan_pemohon,
  k3.desa AS kelurahan_pemohon,
  k2.kecamatan AS kecamatan_jenazah,
  k4.desa AS kelurahan_jenazah,
  k5.kecamatan AS kecamatan_tpu,
        k.id_kecamatan as kecamatan_pemohon_id,k3.id_kelurahan as kelurahan_pemohon_id,k2.id_kecamatan as kecamatan_jenazah_id,k4.id_kelurahan as kelurahan_jenazah_id
    ,CASE 
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
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id 
  ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal_2,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan_2 from  jenazah j  
  left join permohonan p on j.id = p.jenazah_id   and p.deleted = 0
  LEFT JOIN dokument d on d.jenazah_id = j.id  and d.deleted = 0
  left join makam_tambahan mt on mt.id = j.makam_id   AND mt.deleted = 0
  left join makam m  on m.id = mt.makam_id   AND m.deleted = 0
  LEFT JOIN master_makam mm ON mm.id = m.master_makam_id AND mm.deleted = 0
    LEFT JOIN kecamatan k5 ON k5.id_kecamatan = mm.id_kec 
      left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 and x2.status !=2 ) as  p2 on p2.dokument_id =d.id  
   left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id 
WHERE p.jns_pemakaman =  4 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1  AND p2.status != 2  and j.verifikasi_perpanjangan = 1 and p.deleted = 0   and p.id = p2.permohonan_id   and j.juuid ='${req.params.id}'`)
  const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")
  const lokasi = await sql_enak.raw(`SELECT * FROM master_makam mm  WHERE mm.deleted = 0  and mm.id = ${data[0][0].tpu} `)
    const kel_pemohon = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0][0].kecamatan_pemohon_id}`)
  const kel_jenazah = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0][0].kecamatan_jenazah_id}`)
  const blok = await sql_enak.raw(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0    and m.nama_tpu = '${data[0][0].nama_tpu}'`)
  const sub_blok = await sql_enak.raw(`SELECT m.id,m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 and m.nama_tpu = '${data[0][0].nama_tpu}'  and m.blok =   '${data[0][0].blok}' `)
  const no_liang = await sql_enak.raw(`SELECT  m.id,m.no_liang  as no_liang  FROM makam m WHERE m.deleted = 0 and m.jns_makam !=2  and m.nama_tpu = '${data[0][0].nama_tpu}'  and m.blok =   '${data[0][0].blok}'  and m.sub_blok  = '${data[0][0].sub_blok}'  order by m.no_liang asc`)
  let x = sub_blok[0].sort((a,b)=>a.subblok.substring(1,a.subblok.length)-b.subblok.substring(1,b.subblok.length))
  console.log({id:req.params.id,data:data[0],kec:kec[0],lokasi:lokasi[0],blok:blok[0],sub_blok:x,no_liang:no_liang[0]});
  

  res.render('content-backoffice/manajemen_perpanjangan_pemakaman_tumpang_special/edit',{kel_jenazah:kel_jenazah[0],kel_pemohon:kel_pemohon[0],id:req.params.id,data:data[0],kec:kec[0],lokasi:lokasi[0],blok:blok[0],sub_blok:x,no_liang:no_liang[0]}); 
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
  transporter.sendMail(mailOption, (err, data) => {
    if (err) {
      console.log(err, 'error!');
    } else {
      console.log('sukses!');
    }
  })
  try {
    

    await sql_enak("permohonan")
  .where("id", "=", req.body.pemohon_id)
  .update(permohonan)
  await sql_enak("jenazah")
  .where("id", "=", req.body.jenazah_id)
  .update(jenazah)
  await sql_enak("dokument")
  .where("id", "=", req.body.dokument_id)
  .update(dokument)
  await sql_enak("perpanjangan")
  .where("id", "=", req.body.perpanjangan_id)
  .update(perpanjangan)
    } catch (error) {
    console.log(error,'error');
    
  }
  //   sql_enak.insert(perpanjangan).into("perpanjangan").then(function (data) {
  //     res.json({res:200,message:'sukses',data})

  //   })
  // console.log();
  if (req.body.jns_pemakaman == 0) {
    res.redirect(`/manajemen_pemakaman_special/perpanjangan_pemakaman`)

  } else if (req.body.jns_pemakaman == 2){
    res.redirect(`/manajemen_pemakaman_special/pesan_tempat_makam`)

  }else if (req.body.jns_pemakaman == 4){
    res.redirect(`/manajemen_pemakaman_special/perpanjangan_pemakaman_tumpang`)

  }
})
router.get('/ijin/pemakaman', cek_login,async function(req, res) {
    let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
    let data = [[]]

  let penandatangan = await sql_enak.raw(`SELECT * FROM penandatangan p WHERE p.deleted  = 0`)
  res.render('content-backoffice/manajemen_ijin_khusus/pemakaman',{cetak:req.query.cetak,data:data[0],user:req.user[0],penandatangan:penandatangan[0]}); 
});

router.get('/ijin/pemakaman_tumpang', cek_login,async function(req, res) {
  res.render('content-backoffice/manajemen_ijin_khusus/pemakaman_tumpang',{cetak:req.query.cetak,user:req.user[0]}); 
});
router.get('/ijin/perpanjangan/pemakaman', cek_login,async function(req, res) { 
 
    res.render('content-backoffice/manajemen_ijin_khusus/perpanjangan_pemakaman',{cetak:req.query.cetak}); 
  });
    router.get('/ijin/perpanjangan/pemakaman_tumpang', cek_login,async function(req, res) { 
  
      res.render('content-backoffice/manajemen_ijin_khusus/perpanjangan_pemakaman_tumpang',{cetak:req.query.cetak}); 
    });
    router.post('/perpanjangan/pemakaman', cek_login,async function(req, res) { 
  let {limit,offset,cari,mulai,akhir,count} = req.body   
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
 let sql = `SELECT ${b} from jenazah j  left join permohonan p on j.id = p.jenazah_id  and p.deleted = 0 LEFT JOIN dokument d on d.jenazah_id = j.id  and d.deleted = 0  LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id   LEFT join makam_tambahan mt  on mt.id = j.makam_id  and mt.deleted = 0
  left join makam m on mt.makam_id = m.id and m.deleted = 0 LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman =  0 and j.kategori_tpu = 1  ${o} and p.deleted = 0 and p2.status = 2  and (j.verifikasi_perpanjangan =2 or p2.status_perpanjangan = 1) ${a}  and p.id = p2.permohonan_id   and j.deleted = 0 and p.deleted = 0 order by p.id desc ${str}`
  const data = await sql_enak.raw(sql,value)
  console.log(sql,'sql');
  
  res.json({data:data[0],user:req.user[0]})
})
router.post('/list_pemakaman',cek_login,async function(req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
  let {count,limit,jns_pemakaman, offset,cari,mulai,akhir} = req.body
  // console.log(req.body);
  str = ''
  let value = []
  
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
  let sql = ` p.pin,d.periode,d.sk, p2.status,foto_ktp_pemohon,foto_ktp_jenazah,surat_kematian,surat_lurah, nama_ahli_waris ,nama_jenazah,k.kecamatan, m.kecamatan as kecamatan_tpu,nama_tpu ,m.blok ,m.sub_blok,m.no_liang,p2.kode_billing,(SELECT CASE when isnull(p.tanggal_surat) or isnull(p.tanggal_berlaku_surat)   then 'false' ELSE 'true' END as x FROM perpanjangan p WHERE p.id  = p2.id) as cek,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE when p2.status_pembayaran = 0  then 'Belum Dibayar' when p2.status_pembayaran = 1  then 'Sudah Dibayar' END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,k.kecamatan , p2.id as perpanjangan_id`
  if (count) {
    sql = ' count(*) as jml'
  }
  let sql_query = `SELECT ${sql} from jenazah j  
  left join permohonan p on j.id = p.jenazah_id and p.deleted = 0
  LEFT JOIN dokument d on d.jenazah_id = j.id and d.deleted = 0
LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
   LEFT join makam_tambahan mt  on mt.id = j.makam_id  and mt.deleted = 0
  left join makam m on mt.makam_id = m.id and m.deleted = 0 LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman = ${jns_pemakaman||0} and  j.kategori_tpu = 1   and p.deleted = 0 and j.deleted = 0 and p2.status = 2  and p.id = p2.permohonan_id  and p.deleted = 0 ${o} order by p.id desc ${str}`
  console.log(sql_query,value);

  const data = await sql_enak.raw(sql_query,value)
  res.json({data:data[0],user:req.user[0]})
})
router.post(`/inputDataSK`,async function (req,res) {
  let perpanjangan={}
  perpanjangan = req.body
  let jenazah_id = req.body.jenazah_id
  let jns_permohonan =  req.body.jns_permohonan
  delete perpanjangan.jns_permohonan
  delete perpanjangan.jenazah_id

  perpanjangan.tanggal_berlaku_surat = moment(req.body.tanggal_surat).add(3, 'Y').format('YYYY-MM-DD')
    await sql_enak("perpanjangan")
    .where("id", "=", perpanjangan.id)
    .update(perpanjangan)
  if (jns_permohonan == 0) {
    res.redirect(`/manajemen_pemakaman_special/ijin/pemakaman?cetak=`+jenazah_id)
  }else if (jns_permohonan == 4) {
    res.redirect(`/manajemen_pemakaman_special/ijin/pemakaman_tumpang?cetak=`+jenazah_id)
  }
})
router.post(`/inputDataSKPerpanjangan`,async function (req,res) {
  let perpanjangan={}
  perpanjangan = req.body
  perpanjangan.status_perpanjangan = 1
  let jenazah_id = req.body.jenazah_id
  let jns_permohonan =  req.body.jns_permohonan
  delete perpanjangan.jns_permohonan
  await sql_enak("jenazah")
    .where("id", "=", jenazah_id)
    .update({
      verifikasi_perpanjangan : 0,
      tanggal_daftar_perpanjangan : null
    })
  delete perpanjangan.jenazah_id
  perpanjangan.tanggal_berlaku_surat = moment(req.body.tanggal_surat).add(3, 'Y').format('YYYY-MM-DD')
    await sql_enak("perpanjangan")
    .where("id", "=", perpanjangan.id)
    .update(perpanjangan)
  if (jns_permohonan == 0) {
  res.redirect(`/manajemen_pemakaman_special/ijin/perpanjangan/pemakaman?cetak=${jenazah_id}`)
  
  } else if (jns_permohonan == 4) {
    res.redirect(`/manajemen_pemakaman_special/ijin/perpanjangan/pemakaman_tumpang?cetak=`+jenazah_id)
  }
})
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
   CONCAT(m.nama_tpu , ' blok  ' , m.blok,' sub blok  ', m.sub_blok  ) as alamat_makam
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted,p4.jabatan as jab_penanda,p4.nama as nama_penanda ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id , j.makam_id as makam_id 
  from jenazah j  
  left join permohonan p on j.id = p.jenazah_id 
  LEFT JOIN dokument d on d.jenazah_id = j.id 
  left join makam_tambahan mt on mt.id = j.makam_id   AND mt.deleted = 0
  left join makam m  on m.id = mt.makam_id   AND m.deleted = 0
  LEFT JOIN master_makam mm ON mm.id = m.master_makam_id AND mm.deleted = 0  left join perpanjangan p2 on p2.dokument_id = d.id and p2.status=2 AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC  LIMIT 1)   
  LEFT JOIN penandatangan p4 on p4.id = p2.penandatangan_id    
  left join kecamatan kp on p.kec_id = kp.id_kecamatan  
  LEFT join kelurahan kp2 on kp2.id_kelurahan = p.kel_id 
  left join kecamatan kj on j.kec_id = kj.id_kecamatan  LEFT join kelurahan kj2 on kj2.id_kelurahan = j.kel_id    WHERE  j.juuid='${req.params.id}'  and p.id = p2.permohonan_id `)
  await sql_enak("makam")
  .where("id", "=", data[0][0].makam_id)
  .update({status_makam:2})
  if (data[0][0].periode == 0) {
    await sql_enak("dokument")
    .where("id", "=", data[0][0].dokument_id)
    .update({periode:1})
  }
  const jumlah_perpanjangan = await sql_enak.raw(`  select count(*) as jumlah_perpanjangan ,p.dokument_id from perpanjangan p where p.deleted = 0 and p.status =2 and p.dokument_id = `+data[0][0].dokument_id

  )
  console.log(data[0][0],'data[0][0]');
  
  if (data[0][0].jns_pemakaman == 0) {
    console.log('if');
    
    res.render('content-backoffice/manajemen_ijin_khusus/cetak_permohonan_pemakaman',{data:data[0],jumlah_perpanjangan:jumlah_perpanjangan[0][0].jumlah_perpanjangan})

  } else {
    console.log('else');
    
    let sql = `SELECT j.nama_jenazah , j.id FROM jenazah j WHERE j.makam_id = ? and j.deleted = 0 and juuid !='${req.params.id}'`
    let val = [data[0][0].makam_id]
    let data2 = await sql_enak.raw(sql,val)
    console.log(sql,val,data2[0]);
    
    res.render('content-backoffice/manajemen_ijin_khusus/cetak_pemakaman_tumpang',{data:data[0],data2:data2[0],jumlah_perpanjangan:jumlah_perpanjangan[0][0].jumlah_perpanjangan})

  }
})
router.get(`/pemakaman/cetak_perpanjangan/:id`,async function (req,res) {
  const data = await sql_enak.raw(`SELECT *,j.makam_id makam_jenazah_id,kp.kecamatan as kecamatan_pemohon , kj.kecamatan as kecamatan_jenazah , kp2.desa as kelurahan_pemohon , kj2.desa as kelurahan_jenazah ,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
  ,CASE 
  when p.kec_id != 0   then CONCAT( p.alamat,'')
  ELSE p.alamat END as alamat_pemohon,
  CASE 
  when j.kec_id != 0   then CONCAT( j.alamat,'')
  ELSE j.alamat END as alamat_jenazah,
   CONCAT(m.nama_tpu , ' blok  ' , m.blok,' sub blok  ', m.sub_blok  ) as alamat_makam
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,p4.jabatan as jab_penanda,p4.nama as nama_penanda ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id , m.id as makam_id from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id   left join makam_tambahan mt on mt.id = j.makam_id   AND mt.deleted = 0
  left join makam m  on m.id = mt.makam_id   AND m.deleted = 0
  LEFT JOIN master_makam mm ON mm.id = m.master_makam_id AND mm.deleted = 0 left join perpanjangan p2 on p2.dokument_id = d.id and p2.status=2  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC  LIMIT 1) left join kecamatan k on k.id_kecamatan = p.kec_id left join kelurahan k2 on k2.id_kelurahan = p.kel_id left join kecamatan k3 on j.kec_id = k3.id_kec left join kelurahan k4 on k4.id_kelurahan = j.kel_id  LEFT JOIN penandatangan p4 on p4.id = p2.penandatangan_id    left join kecamatan kp on p.kec_id = kp.id_kecamatan  LEFT join kelurahan kp2 on kp2.id_kelurahan = p.kel_id 
  left join kecamatan kj on j.kec_id = kj.id_kecamatan  LEFT join kelurahan kj2 on kj2.id_kelurahan = j.kel_id   WHERE  j.juuid='${req.params.id}' and p.id = p2.permohonan_id `)
  await sql_enak("makam")
  .where("id", "=", data[0][0].makam_id)
  .update({status_makam:2})
  if (data[0][0].periode == 0) {
    await sql_enak("dokument")
    .where("id", "=", data[0][0].dokument_id)
    .update({periode:1})
  }
  let jumlah = await sql_enak.raw(`SELECT COUNT(*) as jumlah_perpanjangan FROM jenazah j join dokument d on d.jenazah_id = j.id left join perpanjangan p on p.dokument_id =d.id where j.juuid = '${req.params.id}'`)
  if (data[0][0].jns_pemakaman == 0) {
    res.render('content-backoffice/manajemen_ijin_khusus/cetak_perpanjangan_pemakaman',{data:data[0],jumlah:jumlah[0]})

  } 
  else {
    let sql = `SELECT j.nama_jenazah , j.id FROM jenazah j WHERE j.makam_id = ? and j.deleted = 0 and juuid !='${req.params.id}'`
    let val = [data[0][0].makam_jenazah_id]
    let data2 = await sql_enak.raw(sql,val)

    res.render('content-backoffice/manajemen_ijin_khusus/cetak_perpanjangan_pemakaman_tumpang',{data:data[0],data2:data2[0],jumlah:jumlah[0]})

  }
})
router.post(`/uploadSK`,upload.fields([{name:'sk',maxCount:1}]),async function (req,res) {
  const dokument = {}  
  let jns_permohonan =  req.body.jns_permohonan
  delete dokument.jns_permohonan
  let nama_file = ''
  if (req.files) {
    if (req.files["sk"]) {
       nama_file = req.files["sk"][0].filename;
      dokument["sk"] = nama_file;  
    }
  }
  let text= `https://makam.semarangkota.go.id/foto/${nama_file}`

  await sql_enak("dokument")
  .where("id", "=", req.body.id)
  .update(dokument)
  let data = await sql_enak.raw(`SELECT p.id as permohonan_id,p.email,p.hp ,j.id as jenazah_id from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id  left join perpanjangan p2 on p2.dokument_id = d.id and p2.status=2 AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC  LIMIT 1)  WHERE  p.deleted = 0  and p.id = p2.permohonan_id  and p2.status !=3  and d.id = ${req.body.id} order by j.id desc`)
console.log(data[0][0],jns_permohonan,jns_permohonan==4,jns_permohonan==0,'data,jns_permohonan)');

  
  if (jns_permohonan == 0) {
    console.log('if');

    email(data[0][0].email,'Surat Keputusan (SK) ijin penggunaan tanah makam/pemakaman jenazah terbit','Surat Keputusan (SK) ijin penggunaan tanah makam/pemakaman jenazah telah terbit. Silahkan download/unduh file tersebut melalui link berikut ini : '+text+'.')
    res.redirect(`/manajemen_pemakaman_special/ijin/pemakaman?cetak=`+data[0][0].jenazah_id)
  } else if (jns_permohonan == 4) {
        console.log('else');
    email(data[0][0].email,'Surat Keputusan (SK) ijin pemakaman tumpang terbit','Surat Keputusan (SK) ijin pemakaman tumpang telah terbit. Silahkan download/unduh file tersebut melalui link berikut ini : '+text+'')

    res.redirect(`/manajemen_pemakaman_special/ijin/pemakaman_tumpang?cetak=`+data[0][0].jenazah_id)
  }

})
router.post(`/uploadSKPerpanjangan`,upload.fields([{name:'sk_perpanjangan',maxCount:1}]),async function (req,res) {
  const perpanjangan = {}  
  let jns_permohonan =  req.body.jns_permohonan
  delete perpanjangan.jns_permohonan
  let nama_file = ''
  if (req.files) {
    if (req.files["sk_perpanjangan"]) {
       nama_file = req.files["sk_perpanjangan"][0].filename;
      perpanjangan["sk_perpanjangan"] = nama_file;  
    }
  }
  let text= `https://makam.semarangkota.go.id/foto/${nama_file}`
  await sql_enak("perpanjangan")
  .where("id", "=", req.body.id)
  .update(perpanjangan)
  let data = await sql_enak.raw(`SELECT p.id as permohonan_id,p.email ,j.id as jid  from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id   AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC  LIMIT 1)   WHERE  p.deleted = 0 and p.id = p2.permohonan_id  and p2.id =  ${req.body.id}`)

  if (jns_permohonan == 0) {
        email(data[0][0].email,'Surat Keputusan (SK) perpanjangan ijin penggunaan tanah makam terbit','Surat Keputusan (SK) perpanjangan ijin penggunaan tanah makam telah terbit. Silahkan download/unduh file tersebut melalui link berikut ini : '+text+'')

    res.redirect(`/manajemen_pemakaman_special/ijin/perpanjangan/pemakaman?cetak=`+data[0][0].jid)
  } else  if (jns_permohonan == 4) {
        email(data[0][0].email,'Surat Keputusan (SK) perpanjangan ijin pemakaman tumpang terbit','Surat Keputusan (SK) perpanjangan ijin pemakaman tumpang telah terbit. Silahkan download/unduh file tersebut melalui link berikut ini : '+text+'')

    res.redirect(`/manajemen_pemakaman_special/ijin/perpanjangan/pemakaman_tumpang?cetak=`+data[0][0].jid)
}
})
module.exports = router;
