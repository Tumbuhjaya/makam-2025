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

var storage = require('../storage').storage;

var upload = multer({ storage: storage })

//start-------------------------------------
router.get('/umum/pj',  cek_login, async function(req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
  let penandatangan = await sql_enak.raw(`SELECT * FROM penandatangan p WHERE p.deleted  = 0`)
   let data = [[]]
  res.render('content-backoffice/manajemen_penandatanganan_ijin/pemakaman',{cetak:req.query.cetak,data:data[0],user:req.user[0],penandatangan:penandatangan[0]});
});


router.get('/umum/pt', cek_login,async function(req, res) {
  res.render('content-backoffice/manajemen_penandatanganan_ijin/pemakaman_tumpang',{cetak:req.query.cetak,user:req.user[0]}); 
});
router.get('/umum/ppj', cek_login,async function(req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  (m.master_makam_id = ${req.user[0].master_makam_id} or j.tpu  = ${req.user[0].master_makam_id})`
  }
    let penandatangan = await sql_enak.raw(`SELECT * FROM penandatangan p WHERE p.deleted  = 0`)
  const data = await sql_enak.raw(`SELECT *,DATE_FORMAT(p2.inserted_perpanjangan , '%d-%m-%Y') as inserted_perpanjangan,m.kecamatan as kecamatan_tpu,k.kecamatan as kecamatan_pemohon,k3.desa as kelurahan_pemohon,k2.kecamatan as kecamatan_jenazah,k4.desa as kelurahan_jenazah,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted,DATE_FORMAT(j.tanggal_daftar_perpanjangan , '%d-%m-%Y') as tanggal_daftar_perpanjangan  ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id 
  from  jenazah j  
  left join permohonan p on j.id = p.jenazah_id   
  LEFT JOIN dokument d on d.jenazah_id = j.id 
  LEFT join makam m on m.id = j.makam_id   
  LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0  ) as  p2 on p2.dokument_id =d.id 
    left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id   
    WHERE p.jns_pemakaman =  0 and p2.sk_perpanjangan is not null and p2.sk_perpanjangan !='' and p.deleted = 0 and j.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}  and p2.status =0 and p.id = p2.permohonan_id  order by p.id desc`)
  res.render('content-backoffice/manajemen_penandatanganan_ijin/perpanjangan_pemakaman',{cetak:req.query.cetak,data:data[0],user:req.user[0],penandatangan:penandatangan[0]}); 
});
router.get('/umum/ppt', cek_login,async function(req, res) {
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
    WHERE p.jns_pemakaman =  4 and p2.sk_perpanjangan is not null and p2.sk_perpanjangan !='' and p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}  and p2.status =0 and p.id = p2.permohonan_id  order by p.id desc`)
  res.render('content-backoffice/manajemen_penandatanganan_ijin/perpanjangan_pemakaman_tumpang',{cetak:req.query.cetak,user:req.user[0]}); 
});

router.get('/khusus/pj',  cek_login, async function(req, res) {
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
WHERE  d.sk is not null and d.sk !='' and p.jns_pemakaman =  0 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1 ${t} and j.verifikasi_perpanjangan = 0 and p.deleted = 0 ${o}  and p2.status !=2  and p.id = p2.permohonan_id  order by p.id desc`)

  res.render('content-backoffice/manajemen_penandatanganan_ijin/pemakaman_special',{data:data[0],user:req.user[0],status:req.query.status||''}); 
});
router.get('/khusus/pt',  cek_login, async function(req, res) {
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
WHERE  d.sk is not null and d.sk !='' and p.jns_pemakaman =  4 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1 ${t} and j.verifikasi_perpanjangan = 0 and p.deleted = 0 ${o}  and p2.status !=2  and p.id = p2.permohonan_id  order by p.id desc`)
  
  res.render('content-backoffice/manajemen_penandatanganan_ijin/pemakaman_tumpang_special',{data:data[0],user:req.user[0],status:req.query.status||''})
});

router.get('/khusus/ppt',  cek_login, async function(req, res) {
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
WHERE  d.sk is not null and d.sk !='' and p2.sk_perpanjangan is not null and p2.sk_perpanjangan !='' and
  p.jns_pemakaman =  4 ${o} and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1   and j.verifikasi_perpanjangan = 1 and p.deleted = 0   and p2.status !=2  and p.id = p2.permohonan_id  order by p.id desc`
 const data = await sql_enak.raw(q)
 console.log(q,'asdfghj');
 
  
  res.render('content-backoffice/manajemen_penandatanganan_ijin/perpanjangan_pemakaman_tumpang_special',{cetak:req.query.cetak ,data:data[0]}); 
});
router.get('/khusus/ppj',  cek_login, async function(req, res) {
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
WHERE  d.sk is not null and d.sk !='' and p.jns_pemakaman =  0 and p2.sk_perpanjangan is not null and p2.sk_perpanjangan !='' and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1 ${t} and j.verifikasi_perpanjangan = 1 and p.deleted = 0 ${o}  and p2.status !=2   and p.id = p2.permohonan_id  order by p.id desc`
  const data = await sql_enak.raw(sql)
console.log(sql);
  res.render('content-backoffice/manajemen_penandatanganan_ijin/perpanjangan_pemakaman_special',{cetak:req.query.cetak ,data:data[0]}); 
});
router.post(`/umum/pt/list`,async function (req,res) {
  let {limit,offset,cari,count,mulai,akhir,sk}=req.body
  console.log(req.body,'req.body');
  
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
 if (sk) {
     o += ` and d.sk is not null and d.sk !='' `
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

router.post('/edit_sk',async function(req, res) {
  let post = req.body

  try {
      await sql_enak('dokument').where('id','=',post['id']).update(post).then(data=>{
    res.status(200).json({ status: 200, message: "sukses", data: data})
 })
 .catch(err=>{
      console.log(err);

    res.status(500).json({ status: 500, message: "gagal", data: err})
 })
  } catch (error) {
    console.log(error);
    
        res.status(500).json({ status: 500, message: "gagal", data: error})

  }

})
router.post('/edit_sk_perpanjangan',async function(req, res) {
  let post = req.body

  try {
      await sql_enak('perpanjangan').where('id','=',post['id']).update(post).then(data=>{
    res.status(200).json({ status: 200, message: "sukses", data: data})
 })
 .catch(err=>{
      console.log(err);

    res.status(500).json({ status: 500, message: "gagal", data: err})
 })
  } catch (error) {
    console.log(error);
    
        res.status(500).json({ status: 500, message: "gagal", data: error})

  }

})
module.exports = router;
