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

router.get('/list_makam_special',cek_login,async function(req, res) {
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

  let sql = `SELECT *,m.kecamatan as kecamatan_tpu,k.kecamatan as kecamatan_pemohon,k3.desa as kelurahan_pemohon,k2.kecamatan as kecamatan_jenazah,k4.desa as kelurahan_jenazah,CASE 
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
  left join permohonan p on j.id = p.jenazah_id  and p.deleted =0
  LEFT JOIN dokument d on d.jenazah_id = j.id and d.deleted =0
  LEFT join makam_tambahan  mt on mt.id = j.makam_id and mt.deleted =0
  LEFT join makam m on m.id = mt.makam_id and m.deleted =0
  left join master_makam mm on mm.id = m.master_makam_id and mm.deleted =0
  left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 and x2.status !=2 ) as  p2 on p2.dokument_id =d.id  
left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id 
WHERE p.jns_pemakaman =  0 and j.deleted = 0 and p.deleted = 0  and j.verifikasi_perpanjangan = 0 and p.deleted = 0   and p2.status !=3  and p.id = p2.permohonan_id  order by p.id desc`+str
    await sql_enak.raw(sql,value).then(data=>{
      res.status(200).json({ status: 200, message: "sukses", data: data[0]})
   })
   .catch(err=>{
    console.log(err);
      res.status(500).json({ status: 500, message: "gagal", data: err})
   })
})
router.post('/list_makam',cek_login,async function(req, res) {
    let {kolom,tpu,blok,sub_blok,agama,jns_pemakaman,makam_id} = req.body
    console.log(req.body,'req.body');
    
    let tambahan = ''
    let value = []
    if (tpu) {
      tambahan+=' and m.master_makam_id = ?'
      value.push(tpu)
    }
      if (agama) {
      tambahan+=' and m.agama = ?'
      value.push(agama)
    }
    if (blok) {
      tambahan+=' and m.blok = ?'
            value.push(blok)

    }
    if (sub_blok) {
      tambahan+=' and m.sub_blok = ?'
                  value.push(sub_blok)

    }
    let a = ' distinct m.* '
    if (kolom) {
      a = `distinct m.${kolom}`
    }
    let b = ' left join jenazah j on j.makam_id = m.id and j.kategori_tpu = 0 and j.deleted = 0 where m.deleted = 0 and j.id is null '
    if (jns_pemakaman==4) {
    //  b = ' left join jenazah j on j.makam_id = m.id and j.kategori_tpu = 0 and j.deleted = 0 where m.deleted = 0 and j.id is not null and m.status_tumpang =1 '
  b = ` left join (select max(j.id) ,  j.makam_id from jenazah j 
left join dokument d on d.jenazah_id = j.id and d.deleted =0
left join perpanjangan p on p.dokument_id = d.id and p.deleted =0 where  p.status =2 and j.deleted = 0 group by j.makam_id ) j on j.makam_id = m.id
 where m.deleted = 0   and m.status_tumpang =1  `  
  }else if(makam_id){
      b=' where m.deleted = 0 '
    }
   let sql = `select ${a} from makam m ${b} `+tambahan    
    console.log(sql,value , req.body ,'req.body');
    
    await sql_enak.raw(sql,value).then(data=>{
      res.status(200).json({ status: 200, message: "sukses", data: data[0]})
   })
   .catch(err=>{
    console.log(err);
      res.status(500).json({ status: 500, message: "gagal", data: err})
   })
})
module.exports = router;
