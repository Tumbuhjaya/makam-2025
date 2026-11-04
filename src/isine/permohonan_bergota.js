
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
var cek_login = require('./login').cek_login;
var cek_login_google = require('./login').cek_login_google;
var dbgeo = require("dbgeo");
var multer = require("multer");
var st = require('knex-postgis')(sql_enak);
var axios = require('axios');
var moment = require("moment");
var CronJob = require("cron").CronJob;
moment.locale('id')
var nodemailer = require('nodemailer')
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
   user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

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
var svgCaptcha = require('svg-captcha');
var svgToImage = require('svg-to-image')
var getContext = require('get-canvas-context')
 
// set up a new Canvas2D
var context = getContext('2d', {
  width: 200, height: 200
})
router.get('/',async function(req, res) {
  connection.query("SELECT id_kecamatan, kecamatan from kecamatan",async function (err, rows, fields) {
    const lokasi = await sql_enak.raw(`SELECT mm.nama_tpu, (select x(centroid(SHAPE)) from makam where mm.id =master_makam_id  limit 1 ) as x, (select y(centroid(SHAPE)) from makam where mm.id =master_makam_id  limit 1 ) as y FROM master_makam mm  where mm.deleted = 0`)
    var captcha = svgCaptcha.create();
    var data = [captcha.data].join('\n')
    res.render('content/permohonan_bergota', {kec:rows,lokasi:lokasi[0],captcha,data}); 
  })
});
router.get('/getKec',async function(req, res) {
  let kec = await sql_enak.raw(`SELECT * from kecamatan k where k.id_kec in ((select id_kec from master_makam m where m.deleted = 0 and m.kategori_tpu = 1))`)
  res.json({status :200 , message:"sukses",data:kec[0]})
})
//   router.get('/lokasiByKec', function(req, res) {
//     let w = ''
//     if (req.query.kec) {
//       w+=` and mm.id_kec ='${req.query.kec}'`
//     }else{
//       w+=` and mm.id_kec ='null'`
//     }
//   connection.query(`SELECT mm.id as master_makam_id , mm.nama_tpu FROM master_makam mm  WHERE mm.id in ((select id from master_makam m where m.deleted = 0 and m.kategori_tpu = 1)) and mm.deleted = 0 ${w} `, function (err, rows, fields) {
//     for (let u = 0; u < rows.length; u++) {
//       rows[u].x = ''; 
//       rows[u].y = '';
//       console.log(rows[u].master_makam_id);
//       connection.query(`SELECT  x(centroid(SHAPE)) as x, y(centroid(SHAPE)) as y FROM makam m WHERE  m.master_makam_id in ((select id from master_makam m where m.deleted = 0 and m.kategori_tpu = 1)) and m.master_makam_id = '${rows[u].master_makam_id}'  and m.deleted = 0 `, function (err, det) {
//         console.log(rows[u].master_makam_id);
//         console.log(det);
//         for (let i = 0; i < det.length; i++) {
//              rows[u].x = det[i].x; 
//             rows[u].y = det[i].y;
//         }
     
//         // if(u == rows.length-1){
//             res.json(rows)
//           // }
//     })

//   };
// });
// })
router.get('/lokasiByKec', function(req, res) {
    let kec = req.query.kec ? req.query.kec : 'null';

    // Query Tunggal dengan JOIN
    const sql = `
        SELECT 
            mm.id as master_makam_id, 
            mm.nama_tpu,
            (SELECT X(CENTROID(m.SHAPE)) FROM makam m WHERE m.master_makam_id = mm.id AND m.deleted = 0 LIMIT 1) as x,
            (SELECT Y(CENTROID(m.SHAPE)) FROM makam m WHERE m.master_makam_id = mm.id AND m.deleted = 0 LIMIT 1) as y
        FROM master_makam mm
        WHERE mm.deleted = 0 
        AND mm.kategori_tpu = 1
        AND mm.id_kec = ${connection.escape(kec)}
    `;

    connection.query(sql, function (err, rows) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        
        // Kirim data sekali saja setelah query selesai
        res.json(rows);
    });
});
router.get('/get_jenazah_by_sub_blok',async function(req, res) {
  let w =''
  if (req.query.jns_permohonan == 0 ) {
    w += ` and mt.status_makam = 2 `
    
  } else if (req.query.jns_permohonan == 2 ) {
    // w += ` and (m.status_makam = 0 or m.status_tumpang =1 and jumlah_jenazah<3) `
    w += ` and (mt.status_makam = 2 or mt.status_tumpang =1 ) `

  } else if (req.query.jns_permohonan == 4 ) {
    // w += ` and m.status_tumpang =1 and jumlah_jenazah<3`
    w += ` and mt.status_tumpang =1`

  }
    if (req.query.makam_id) {
    w +=` and mt.makam_id = '${req.query.makam_id}' `
  }
    if (req.query.makam_asli) {
    w +=` or mt.id = '${req.query.makam_asli}' `
  }
  
  if (req.query.master_makam_id) {
    w +=` and m.master_makam_id = '${req.query.master_makam_id}' `
  }
 if (req.query.nama_tpu) {
    w +=` and m.master_makam_id = '${req.query.nama_tpu}' `
  }
  if (req.query.agama == 1) {
    w+=` and m.agama = 'Islam'`
  }else if (req.query.agama == 0) {
    w+=` and m.agama != 'Islam'`
  }
  if (req.query.blok) {
    w +=` and m.blok = '${req.query.blok}' `
  }
  if (req.query.subblok) {
    w +=` and m.sub_blok  = '${req.query.subblok}'  `
  }
  // if (req.query.jns_permohonan == 4) {
  //   w +=` and m.status_tumpang  = '1'  `

  // }
  
  let q = `SELECT  j.nama_jenazah , mt.id,  x(centroid(SHAPE)) as x, y(centroid(SHAPE)) as y 
FROM makam m left JOIN  makam_tambahan mt on mt.makam_id = m.id 
left join (SELECT max(j.tanggal_meninggal ) as tanggal_meninggal,j.id,j.makam_id   from jenazah j where j.kategori_tpu =1 GROUP by j.makam_id ) as j2 on j2.makam_id = mt.id
left join jenazah j on j.id = j2.id 
WHERE mt.deleted = 0      AND j2.tanggal_meninggal <= DATE_SUB(CURDATE(), INTERVAL 3 YEAR) ${w}  order by j.nama_jenazah `
console.log(q);

  connection.query(q, function (err, rows, fields) {
    console.log(rows);
    
    res.json(rows)
  });
});
router.get(`/list_makam`,async (req,res) => {
      let a = `where a.deleted = 0  and j.kategori_tpu = 1     AND j.tanggal_meninggal <= DATE_SUB(CURDATE(), INTERVAL 3 YEAR) AND j.tanggal_meninggal = (
        SELECT
            MAX(j2.tanggal_meninggal)
        FROM
            jenazah j2
        WHERE
            j2.makam_id = j.makam_id
            AND j2.deleted = 0
    ) `

         let {master_makam_id,blok,sub_blok,no_liang,makam_id,agama,jns_permohonan,all}= req.query
              if (all) {
       a = `where a.deleted = 0  and j.kategori_tpu = 1  `
     }
            if(master_makam_id && master_makam_id!= 'null'){
              a += " and a.master_makam_id =  '"+master_makam_id+"'";
            }
            if(blok && blok!= 'null'){
              a += " and a.blok =  '"+blok+"'";
            }
            if(sub_blok && sub_blok!= 'null'){
              a += " and a.sub_blok =  '"+sub_blok+"'";
            }
            if(no_liang && no_liang != 'null'){
              a += " and a.no_liang =  '"+no_liang+"'";
            }
            if(makam_id && makam_id != 'null'){
              a += " and a.id =  '"+makam_id+"'";
            }
            if(agama == 1){
              a += " and a.agama =  'Islam'";
            }else if(agama == '' || agama == 'null'){
              a+= ''
            }else if(agama == 0){
              a += " and a.agama !=  'Islam'";
            }
            let join = ''
            if (jns_permohonan==4) {
              let atambahan = ''
              // if (!makam_id) {
                atambahan = `  and mt.status_tumpang =1      AND j.tanggal_dimakamkan = (
      SELECT MAX(j2.tanggal_dimakamkan)
      FROM jenazah j2 INNER JOIN dokument d ON j2.id = d.jenazah_id
INNER JOIN perpanjangan p ON d.id = p.dokument_id
      WHERE j2.makam_id = mt.id AND j2.deleted = 0 and p.status =2
  ) 
  AND j.tanggal_dimakamkan <= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)  group BY j.makam_id `
                join += ` 
INNER JOIN dokument d ON j.id = d.jenazah_id
INNER JOIN perpanjangan p ON d.id = p.dokument_id`
              // }
                            a += " and mt.status_tumpang = 1 "+atambahan;

            }else if (jns_permohonan==0) {
                                          a += " and mt.status_tumpang = 0 ";

            }
            
                 // connection.query("SELECT asWkb(a.SHAPE) as geometry, a.blok,j.nama_jenazah ,DATE_FORMAT(j.tanggal_meninggal , '%d-%m-%Y') as tanggal_meninggal , a.no_liang, a.keterangan, a.sub_blok, a.id, j.id as jenazahId FROM makam a left join jenazah j on a.id = j.makam_id and j.deleted = 0 "+a , function(err, rows, fields) {
           let q = `SELECT
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
    jenazah j ON mt.id = j.makam_id and j.deleted = 0 ` +a 
                 connection.query(q, function(err, rows, fields) {
console.log(rows,'q',q);

              res.json({status:200,message:"sukses",data:rows})
            })
})
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
            jenazah.tpu=req.body.lokasi_modal
    jenazah.blok=req.body.blok_modal
    jenazah.sub_blok=req.body.subblok_modal
    jenazah.kategori_tpu=1
    const makam ={}
      makam.status_makam=1


    const perpanjangan = {}
    if (x[0][0].retribusi==0) {
      perpanjangan.status_pembayaran = 1
    }
      perpanjangan.retribusi = x[0][0].retribusi
      perpanjangan.kode_billing= hasil.idbiling
      let jenazah_id = 0
      if (req.body.jns_pemakaman==4) {
            jenazah.makam_id=req.body.makam_id_modal

      }
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
router.post('/get_makam_tambahan',async function (req,res) {
  let {blok,sub_blok ,  nama_tpu}= req.body
  let tambahan = ''
    let value = []

  if (blok) {
    tambahan += ` and m.blok = ? `
    value.push(blok)
  }
   if (sub_blok) {
    tambahan += ` and m.sub_blok = ? `
    value.push(sub_blok)
  }
   if (nama_tpu) {
    tambahan += ` and m.nama_tpu = ? `
    value.push(nama_tpu)
  }
  let sql = `select mt.*,j.nama_jenazah ,DATE_FORMAT(j.tanggal_meninggal,'%d-%m-%Y' ) as tanggal_meninggal from jenazah j left join makam m on m.id = j.makam_id and m.deleted = 0  
left join makam_tambahan mt on m.id = mt.makam_id and mt.deleted =0 
where j.deleted = 0 and j.kategori_tpu =1 and mt.status_tumpang =1 and mt.status_makam =2 and mt.jumlah_jenazah >0 ${tambahan}`
let data = await sql_enak.raw(sql,value)
try {
  res.json({status:200,data:data[0],message:'sukses'})
} catch (error) {
    res.json({status:201,data:error,message:'gagal'})

}
})
module.exports = router;
