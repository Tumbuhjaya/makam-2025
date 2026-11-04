
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
function kirimBulk(text) {
  // console.log(text,'text');
  return new Promise(async(y,t)=>{
    var config = {
      method: 'post',
      url: ` http://survplus.id:8006/kirim_pesan_bulk`,
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'   ,
        data : {data:text}
      },
        

    };
     axios(config).then(function (response) {
      y(response.data)
    }).catch(err=>{
      y(err)
    });
  })
}
var job = new CronJob(
  "0 0 8 * * *",
  async function () {
    console.log('cron jalan ', new Date());
    
    // let permohonan = await sql_enak.raw(`SELECT *,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id ,m.id as makam_id, j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id,(SELECT COUNT(*) from perpanjangan p4 WHERE p4.dokument_id = d.id and p4.status_pembayaran = 0) as pembayaran_belum_lunas  from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id AND p2.id =  (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id ORDER by p3.id DESC  LIMIT 1) and p2.status = 2 WHERE j.deleted = 0  AND p2.status = 2   and p.id = p2.permohonan_id  and  CURRENT_DATE() > p2.tanggal_berlaku_surat   order by j.inserted desc`)
    // console.log(permohonan[0][0]);
    let permohonan = await sql_enak.raw(`SELECT tanggal_berlaku_surat,email,hp,tanggal_berlaku_surat,makam_id,j.tanggal_dimakamkan  
FROM jenazah j
LEFT JOIN (
    SELECT x2.*
    FROM permohonan x2
    INNER JOIN (
        SELECT MAX(id) AS id
        FROM permohonan
        WHERE deleted = 0
        GROUP BY jenazah_id
    ) AS latest_permohonan ON x2.id = latest_permohonan.id
) AS p ON p.jenazah_id = j.id
LEFT JOIN dokument d ON d.jenazah_id = j.id
LEFT JOIN makam m ON m.id = j.makam_id
LEFT JOIN (
    SELECT x2.*
    FROM perpanjangan x2
    INNER JOIN (
        SELECT MAX(id) AS id
        FROM perpanjangan
        WHERE deleted = 0
        GROUP BY dokument_id
    ) AS latest_perpanjangan ON x2.id = latest_perpanjangan.id
) AS p2 ON p2.dokument_id = d.id AND p2.status = 2
WHERE 
    j.deleted = 0
    AND p2.status = 2
    AND p.id = p2.permohonan_id
    AND CURRENT_DATE() > p2.tanggal_berlaku_surat
ORDER BY j.inserted DESC;`)
    let arr =[]
    let text =  `silahkan lakukan perpanjangan makam`
    // console.log(permohonan[0]);
    
    for (let i = 0; i < permohonan[0].length; i++) {
      if (moment(permohonan[0][i].tanggal_berlaku_surat).format('YYYY-MM-DD')  < moment().add(0, 'M').format('YYYY-MM-DD') &&  permohonan[0][i].email) {
        let mailOption = {
          from: 'noreply@survplus.id',
          to: permohonan[0][i].email,
          subject: 'peringatan kadaluarsa',
          text: text
        }
        if (permohonan[0][i].hp) {
          arr.push({nomor:permohonan[0][i].hp,pesan:text})
        }
        transporter.sendMail(mailOption, (err, data) => {
          if (err) {
            console.log(err, 'error!');
          } else {
            console.log('sukses!');
          }
        })
      }
      // if (permohonan[0][i].pembayaran_belum_lunas >= '3') {
      //   await sql_enak("permohonan")
      //   .where("jenazah_id", "=", permohonan[0][i].jenazah_id)
      //   .update({deleted:1})  
      //   await sql_enak("jenazah")
      //   .where("id", "=", permohonan[0][i].jenazah_id)
      //   .update({deleted:1})  
      // }
   await sql_enak.raw(`UPDATE makam m
INNER JOIN jenazah j ON j.makam_id = m.id and j.deleted = 0
SET m.status_tumpang = 1
WHERE m.deleted = 0 
  AND j.kategori_tpu = 0
  AND m.status_tumpang = 0
  AND DATE_ADD(j.tanggal_dimakamkan, INTERVAL 3 YEAR) <= CURRENT_DATE();`)
   await sql_enak.raw(`UPDATE makam_tambahan m
INNER JOIN jenazah j ON j.makam_id = m.id and j.deleted = 0
SET m.status_tumpang = 1
WHERE m.deleted = 0 
  AND j.kategori_tpu = 1 
  AND m.status_tumpang = 0
  AND DATE_ADD(j.tanggal_dimakamkan, INTERVAL 3 YEAR) <= CURRENT_DATE();`)

    }
    // console.log(arr);

    if (arr.length >0) {
          // kirimBulk(arr)
    }else{
      console.log('kosong');
    }
  })
  // job.start();
const bearer = `QGnyjTnfSR1G76V1bDKEIAcXZ1UOeYi6qR2wiajcgjjC39fTR7E3gtHZ0jVwzwyfF2IGuFvxEykwtzdxwsiJD4fMO8FdMSfeP0nQ`
const bearer2 =`QGnyjTnfSR1G76V1bDKEIAcXZ1UOeYi6qR2wiajcgjjC39fTR7E3gtHZ0jVwzwyfF2IGuFvxEykwtzdxwsiJD4fMO8FdMSfeP0nQ`
const ip = `http://103.101.52.19:7200/retribusi/1.2.16.01`
const URL = `http://103.101.52.19:7200/retribusi/store`
axios.defaults.headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  "Authorization": `Bearer ${bearer}`,
}
 function getIdBilling(retribusi,makam,tipe) {
  return new Promise(async(y,t)=>{
 
    // axios.get(ip).then((data)=>{
    //   console.log(data.data)
    // })
    var qs = require('qs');
    let a = ''
    if (tipe == 'permohonan') {
      a=`Pembayaran TPU ${makam[0].nama_tpu} blok ${makam[0].blok} subblok ${makam[0].sub_blok} dengan nomor liang ${makam[0].no_liang} pada ${moment().format('DD-MM-YYYY')}`
    }else if (tipe == 'perpanjangan'){
      a=`Pembayaran ${makam[0].nama_jenazah} pada ${moment().format('DD-MM-YYYY')}`

    }
    var data = qs.stringify({
      'noskpd': a,
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
     axios(config).then(function (response) {
      y(response.data)
    }).catch(err=>{
      y(err)
    });
  })

}
let pin = (length) => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
let get_pin = async () => {
  x = pin(6)
  let y = await sql_enak.raw(`select p.pin from permohonan p where p.pin = '${x}'`)
  if (y[0].length) {
    get_pin()
  } else {
    return x
  }
}
router.get('/',async function(req, res) {
  console.log(new Date());
  
//  res.send(hasil) 
// getIdBilling()
// const lokasi = await sql_enak.raw(`SELECT DISTINCT nama_tpu as nama_tpu, (select x(centroid(SHAPE)) from makam where nama_tpu=nama_tpu limit 1 ) as x, (select y(centroid(SHAPE)) from makam where nama_tpu=nama_tpu limit 1 ) as y FROM makam m where m.deleted = 0`)
  connection.query("SELECT id_kecamatan, kecamatan from kecamatan",async function (err, rows, fields) {
  const lokasi = await sql_enak.raw(`SELECT mm.nama_tpu, (select x(centroid(SHAPE)) from makam where mm.id =master_makam_id  limit 1 ) as x, (select y(centroid(SHAPE)) from makam where mm.id =master_makam_id  limit 1 ) as y FROM master_makam mm  where mm.deleted = 0`)
  var captcha = svgCaptcha.create();
  var data = [captcha.data].join('\n')
  res.render('content/permohonan_ijin', {kec:rows,lokasi:lokasi[0],captcha,data}); 
  });
});
// router.get('/lokasiByKec/:kec', function(req, res) {
  router.get('/lokasiByKec', function(req, res) {
    let w = ''
    if (req.query.kec) {
      w+=` and mm.id_kec ='${req.query.kec}'`
    }else{
      w+=` and mm.id_kec ='null'`
    }
  connection.query(`SELECT mm.id as master_makam_id , mm.nama_tpu FROM master_makam mm  WHERE mm.deleted = 0 ${w} `, function (err, rows, fields) {
    for (let u = 0; u < rows.length; u++) {
      rows[u].x = ''; 
      rows[u].y = '';
      console.log(rows[u].master_makam_id);
      connection.query(`SELECT  x(centroid(SHAPE)) as x, y(centroid(SHAPE)) as y FROM makam m WHERE m.master_makam_id = '${rows[u].master_makam_id}' limit 1 `, function (err, det) {
        console.log(rows[u].master_makam_id);
        console.log(det);
        rows[u].x = det[0].x; 
        rows[u].y = det[0].y;
        if(u == rows.length-1){
            res.json(rows)
          }
    })

  };
});
})
router.get('/kecById/:id', function(req, res) {
  connection.query(`SELECT  kecamatan from kecamatan where id_kecamatan = ${req.params.id}`, function (err, rows, fields) {
    res.json(rows)
  });
});
router.get('/blokByLokasi', function(req, res) {
  let w =''
  if (req.query.jns_makam == 0 ) {
    w += ` and m.status_makam = 0`
  } else if (req.query.jns_makam == 2 ) {
    w += ` and m.status_makam = 0`
  } else if (req.query.jns_makam == 4 ) {
    // w += ` and m.status_makam = 2 and m.jumlah_jenazah<3`
    w += ` and m.status_makam = 2 `

  }
  if (req.query.master_makam_id) {
    w+=`  and m.master_makam_id = '${req.query.master_makam_id}'`
  }
  if (req.query.agama == 1) {
    w+=` and m.agama = 'Islam'`
  }else if (req.query.agama == 0) {
    w+=` and m.agama != 'Islam'`
  }
  connection.query(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0  ${w}`, function (err, rows, fields) {    res.json(rows)
  });
});
router.get('/getBlokByLokasi', function(req, res) {
  let w =''
  if (req.query.lokasi) {
    w+=` and m.master_makam_id = '${req.query.lokasi}'`
  }
  connection.query(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0 ${w}`, function (err, rows, fields) {    res.json(rows)
  });
});
router.get('/getBlokByAgama', function(req, res) {
  let w =''
  if (req.query.agama) {
    w+=` and m.agama = '${req.query.agama}' `
  }
  if (req.query.master_makam_id) {
    w+=` and m.master_makam_id = '${req.query.master_makam_id}'`
  }
  if (req.query.nama_tpu) {
    w +=` and m.master_makam_id = '${req.query.nama_tpu}' `
  }
    if (req.query.non_id) {
    id=''
  }else{
    id = ' m.id, '
  }
  connection.query(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0 ${w}`, function (err, rows, fields) {    res.json(rows)
  });
});
router.get('/subblokByBlok',async function(req, res) {
  let w =''
  if (req.query.blok) {
    w+=` and m.blok = '${req.query.blok}'`
  }
  if (req.query.agama == 1) {
    w+=` and m.agama = 'Islam'`
  }else if (req.query.agama == 0) {
    w+=` and m.agama != 'Islam'`
  }
  if (req.query.master_makam_id) {
    w +=` and m.master_makam_id = '${req.query.master_makam_id}' `
  }
  if (req.query.nama_tpu) {
    w +=` and m.master_makam_id = '${req.query.nama_tpu}' `
  }
  let id = ''
  if (req.query.non_id) {
    id=''
  }else{
    id = ' m.id, '
  }
  console.log(`SELECT DISTINCT ${id} m.sub_blok as subblok  FROM makam m WHERE m.deleted = 0 ${w}`,req.query);
  
  const data = await sql_enak.raw(`SELECT DISTINCT ${id} m.sub_blok as subblok  FROM makam m WHERE m.deleted = 0 ${w}`)
  res.json({data:data[0]})
});
router.get('/getSubblokByBlok', function(req, res) {
  let w = ''
  if (req.query.blok) {
    w+=` and m.blok = '${req.query.blok}'`
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
  connection.query(`SELECT DISTINCT  m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 ${w}`,function (err, rows, fields) {
    res.json(rows)
  })
});
router.get(`/getKec`,function (req,res) {
  connection.query("SELECT id_kecamatan, kecamatan from kecamatan",async function (err, rows, fields) {
    res.json({kec:rows})
  })
})
router.get('/noliangBySubblok',async function(req, res) {
  let w =''
  let join = ''
  if (req.query.jns_permohonan == 0 ) {
    w += ` and m.status_makam = 0 `
    
  } else if (req.query.jns_permohonan == 2 ) {
    // w += ` and (m.status_makam = 0 or m.status_tumpang =1 and jumlah_jenazah<3) `
    w += ` and (m.status_makam = 0 or m.status_tumpang =1 ) `

  } else if (req.query.jns_permohonan == 4 ) {
    // w += ` and m.status_tumpang =1 and jumlah_jenazah<3`
    join = `INNER JOIN jenazah j ON m.id = j.makam_id
INNER JOIN dokument d ON j.id = d.jenazah_id
INNER JOIN perpanjangan p ON d.id = p.dokument_id
`
    w += ` and m.status_tumpang =1      AND j.tanggal_dimakamkan = (
      SELECT MAX(j2.tanggal_dimakamkan)
      FROM jenazah j2 INNER JOIN dokument d ON j2.id = d.jenazah_id
INNER JOIN perpanjangan p ON d.id = p.dokument_id
      WHERE j2.makam_id = m.id AND j2.deleted = 0 and p.status =2
  ) 
  AND j.tanggal_dimakamkan <= DATE_SUB(CURDATE(), INTERVAL 3 YEAR) `
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
  
  let q = `SELECT distinct m.no_liang  as no_liang , m.id,  x(centroid(SHAPE)) as x, y(centroid(SHAPE)) as y  FROM makam m ${join} WHERE m.deleted = 0 and m.jns_makam !=2  ${w}  ORDER BY 
    CAST(m.no_liang AS UNSIGNED) ASC, 
    m.no_liang ASC;`
     console.log(q);

  connection.query(q, function (err, rows, fields) {
    console.log(rows);
    
    res.json(rows)
  });
});
router.get('/getNoliangBySubblok',async function(req, res) {
    let w = ''
    if (req.query.subblok) {
      w +=` and m.sub_blok  = '${req.query.subblok}'  `
    }
    if (req.query.nama_tpu) {
      w +=` and m.nama_tpu = '${req.query.nama_tpu}' `
    }else{
      w+=`  and m.nama_tpu = 'null'`
    }
    if (req.query.blok) {
      w +=` and m.blok = '${req.query.blok}' `
    }
    
    if (req.query.agama == 1) {
      w+=` and m.agama = 'Islam'`
    }else if (req.query.agama == 0) {
      w+=` and m.agama != 'Islam'`
    }
  let q = `SELECT  m.id,m.no_liang  as no_liang  FROM makam m WHERE m.deleted = 0  and m.jns_makam !=2  ${w} order by m.no_liang asc`
  connection.query(q, function (err, rows, fields) {
    res.json(rows)
  });
});
router.get('/kelurahanByKec/:kec', function(req, res) {
  connection.query(`SELECT * FROM kelurahan k WHERE k.id_kec = '${req.params.kec}'`, function (err, rows, fields) {
    res.json(rows)
  });
});
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
    // let q = `SELECT * from makam m WHERE m.id = ${req.body.makam_id_permohonan}`
    // let cek_makam = await sql_enak.raw(q)
    // // if(cek_makam[0].length>0){
    // let insert_pin = await get_pin()
    let insert_pin = ''
    let hasil = {idbiling:''}
    // if (x[0][0].retribusi>0) {
    //   hasil = await getIdBilling(x[0][0].retribusi,cek_makam[0],'permohonan');
    // }
    dokument.keterangan=req.body.keterangan
    const { v4: uuidv4 } = await import('uuid');
  let puuid = uuidv4()
  let juuid = uuidv4()
  let duuid = uuidv4()
  let pjuuid = uuidv4()
permohonan.juuid = juuid
permohonan.puuid = puuid
dokument.juuid = juuid
dokument.duuid = duuid
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
jenazah.juuid = juuid

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
    const makam ={}
    // if (req.body.jns_pemakaman==0 &&cek_makam[0][0].master_makam_id!=process.env.MAKAM_BERGOTA) {
      makam.status_makam=1
    // }


    const perpanjangan = {}
    perpanjangan.pjuuid = pjuuid
    perpanjangan.duuid = duuid
    if (x[0][0].retribusi==0) {
      perpanjangan.status_pembayaran = 1
    }
      perpanjangan.retribusi = x[0][0].retribusi
      perpanjangan.kode_billing= hasil.idbiling
    // console.log(jenazah,'jenazah',permohonan,'permohonan',makam,'makam',perpanjangan,'perpanjangan')
    // if (req.body.jns_pemakaman==0) {
    //   await sql_enak("makam")
    //   .where("id", "=", req.body.makam_id_permohonan)
    //   .update(makam)
            
    // }
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
            // let mailOption = {
            //   from: 'noreply@survplus.id',
            //   to: req.body.email,
            //   // subject: 'Permohonan ijin penggunaan tanah makam/pemakaman jenazah',
            //   subject,
            //   text: isi_email_pemohon
            // }
            // let testWa =await kirimWa(req.body.hp,isi_email_pemohon)
            // console.log(testWa);
            // transporter.sendMail(mailOption, (err, data) => {
            //   if (err) {
            //     console.log(err, 'error!');
            //   } else {
            //     console.log('sukses!');
            //   }
            // })

            // let x = await sql_enak.raw(`SELECT * FROM master_makam mm left join makam m on m.master_makam_id = mm.id  WHERE mm.deleted = 0 AND m.id = ${req.body.makam_id_permohonan}`)
            // let d = await sql_enak.raw(`SELECT * FROM user u WHERE u.master_makam_id = '${x[0][0].master_makam_id}' and u.deleted = 0`)
            // let admin = await sql_enak.raw(`SELECT * FROM user u WHERE is_admin =1 and u.deleted = 0`)
          
            // let mailOption2 = {
            //   from: 'noreply@survplus.id',
            //   to: d[0][0].email,
            //   subject: subject,
            //   text:isi_email_admin_tpu
            //   // text: 'Terdapat permohonan baru ijin penggunaan tanah makam/pemakaman jenazah pada TPU yang anda kelola. Silahkan segera lakukan verfikasi data permohonan tersebut.'
            // }
            // let testWa2 =await kirimWa(req.body.hp,'Terdapat Permohonan Baru')
            // console.log(testWa2,d[0][0].email,req.body.hp);

            // transporter.sendMail(mailOption2, (err, data) => {
            //   if (err) {
            //     console.log(err, 'error!');
            //   } else {
            //     console.log('sukses!');
            //   }
            // })
            // let mailOption3 = {
            //   from: 'noreply@survplus.id',
            //   to: admin[0][0].email,
            //   // subject: 'Permohonan ijin penggunaan tanah makam/pemakaman jenazah',
            //   subject,
            //   text:isi_email_admin
            //   // text: 'Terdapat permohonan baru ijin penggunaan tanah makam/pemakaman jenazah pada TPU yang dikelola oleh pemerintah kota semarang.'
            // }
            // let hasilWa =await kirimWa(admin[0][0].telp, 'Terdapat permohonan baru ijin penggunaan tanah makam/pemakaman jenazah pada TPU yang anda kelola. Silahkan segera lakukan verfikasi data permohonan tersebut.')
            // console.log(hasilWa);

            // transporter.sendMail(mailOption3, (err, data) => {
            //   if (err) {
            //     console.log(err, 'error!');
            //   } else {
            //     console.log('sukses!');
            //   }
            // })
            res.redirect(`/`)
            })
          })
        })
    })
  // }else{
  //   res.json({message:'Liang telah terisi'})
  // }
});

router.post(`/submit_pemohon`,upload.fields([{name:'foto_ktp',maxCount:1}]),async function (req,res) {
   //data pemohon
   const pemohon = {} //(nama, ktp, hp, email, alamat, lokasi, blok, deleted)
   if (req.files) {
    if (req.files["foto_ktp"]) {
      var nama_file = req.files["foto_ktp"][0].filename;
      pemohon["foto_ktp"] = nama_file;  
    }
   }
   let x = await sql_enak.raw(`SELECT * FROM master_retribusi mr WHERE mr.jenis = 2`)
   let insert_pin = await get_pin()
   let hasil = {idbiling:''}
   if (x[0][0].retribusi>0) {
     hasil = await getIdBilling(x[0][0].retribusi);
   }
  //  let hasil = await getIdBilling(x[0][0].retribusi);
   pemohon.pin=insert_pin
   pemohon.makam_id = req.body.makam_id_pemohon
   pemohon.inserted = moment().format('YYYY-MM-DD')
   pemohon.nama=req.body.nama_pemohon
   pemohon.ktp=req.body.no_ktp_pemohon
   pemohon.hp=req.body.no_hp_pemohon
   pemohon.email=req.body.email_pemohon
   pemohon.alamat=req.body.alamat_pemohon
   pemohon.kode_billing= hasil.idbiling
   pemohon.retribusi = x[0][0].retribusi
   let mailOption =  {
    from: 'noreply@survplus.id',
    to: req.body.email_pemohon,
    subject: 'Permohonan ijin penggunaan tanah makam/pemakaman jenazah',
    text: `Mohon Tunggu Verifikasi Admin`
  }
   if (x[0][0].retribusi>0) {
     mailOption = {
      from: 'noreply@survplus.id',
      to: req.body.email_pemohon,
      subject: 'Permohonan ijin penggunaan tanah makam/pemakaman jenazah',
      text: `silahkan lakukan pembayaran dengan kode billing ${hasil.idbiling}`
    }
   }
 
  // let hasilWa =await kirimWa(req.body.hp, `silahkan lakukan pembayaran dengan kode billing ${hasil.idbiling}`)
  // console.log(hasilWa);

  transporter.sendMail(mailOption, (err, data) => {
    if (err) {
      console.log(err, 'error!');
    } else {
      console.log('sukses!');
    }
  })
  const jenazah = {}
  const dokument ={}
  const makam = {}
  const perpanjangan ={}
  if (x[0][0].retribusi==0) {
    perpanjangan.status_pembayaran = 1
  }
  let q = `SELECT * from makam m WHERE m.id = ${req.body.makam_id_pemohon}`
  let cek_makam = await sql_enak.raw(q)
  // if (cek_makam[0][0].master_makam_id!=process.env.MAKAM_BERGOTA) {
    makam.status_makam=1
  // }
  makam.jns_makam=req.body.jns_pemakaman
  // console.log();
  await sql_enak("makam")
  .where("id", "=", req.body.makam_id_pemohon)
  .update(makam)
   sql_enak.insert(pemohon).into("pemohon").then(function (id) {
    jenazah.pemohon_id = id
    jenazah.makam_id = req.body.makam_id_pemohon
    sql_enak.insert(jenazah).into("jenazah").then(function (id) {
      dokument.jenazah_id = id
      sql_enak.insert(dokument).into("dokument").then(function (id) {
        perpanjangan.dokument_id = id
        perpanjangan.kode_billing = hasil.idbiling
        perpanjangan.retribusi = x[0][0].retribusi
        perpanjangan.inserted_perpanjangan = moment().format('YYYY-MM-DD')

        sql_enak.insert(perpanjangan).into("perpanjangan").then(function (id) {
          res.redirect(`/`)
        })
      })
    })
  })
})

router.post('/submit_jenazah',upload.fields([{name:'surat_pemeriksaan',maxCount:1},{name:'surat_rumah_sakit',maxCount:1},{name:'surat_lurah',maxCount:1},{name:'surat_kematian',maxCount:1}]),async function(req, res) {
  const dokument = {}  
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
    }
    dokument.keterangan=req.body.keterangan
    let cek_makam = await sql_enak.raw(q)
    if(cek_makam[0].length>0){
    //data jenazah
    const jenazah = {} //    (nama_jenazah, jenis_kelamin, agama, domisili_jenazah, tanggal_meninggal, tanggal_dimakamkan, deleted, makam_id, kec_id, kel_id, alamat)    

    // const makam_id = await sql_enak.raw(`SELECT * FROM makam m WHERE m.id_kec ='${req.body.kecamatan_modal}' and  m.nama_tpu='${req.body.lokasi_modal}' and m.blok='${req.body.blok_modal}' and m.sub_blok='${req.body.subblok_modal}' and m.no_liang ='${req.body.no_liang_modal}'`)
    // console.log(makam_id[0][0].id)
    jenazah.nama_jenazah=req.body.nama_jenazah
    jenazah.jenis_kelamin=req.body.jenis_kelamin
    jenazah.agama=req.body.agama
    jenazah.domisili_jenazah=req.body.domisili_jenazah
    jenazah.tanggal_meninggal=req.body.tanggal_meninggal
    jenazah.tanggal_dimakamkan=req.body.tanggal_dimakamkan
    jenazah.makam_id=req.body.makam_id_permohonan
    jenazah.kec_id=req.body.kecamatan_jenazah
    jenazah.kel_id=req.body.kelurahan_jenazah
    jenazah.alamat=req.body.alamat_jenazah
    jenazah.kode_billing= hasil.idbiling


    //ubah status makam
    const makam ={}
    // makam.status_makam=1
    let q = `SELECT * from makam m WHERE m.id = ${req.body.makam_id_permohonan}`
    let cek_makam = await sql_enak.raw(q)
    // if (cek_makam[0][0].master_makam_id!=process.env.MAKAM_BERGOTA) {
      makam.status_makam=1
    // }
    makam.jumlah_jenazah=1
    makam.jns_makam=req.body.jns_pemakaman
    await sql_enak("makam")
  .where("id", "=", req.body.makam_id_permohonan)
  .update(makam)
    sql_enak.insert(permohonan).into("permohonan").then(function (id) {
      jenazah.permohonan_id= id
        sql_enak.insert(jenazah).into("jenazah").then(function (id) {
          dokument.jenazah_id=id
          sql_enak.insert(dokument).into("dokument").then(async function (id) {
            let subject = 'Permohonan ijin perpanjangan pemakaman tumpang'
            if (req.body.jns_pemakaman == 0) {
              subject = 'ijin penggunaan tanah makam/pemakaman jenazah'
            }
            let x = await sql_enak.raw(`SELECT * FROM master_retribusi mr WHERE mr.jenis = ${req.params.tipe}`)

            let text = 'Mohon Tunggu verifikasi Permohonan'
            if (x[0][0].retribusi>0) {
              text = `silahkan lakukan pembayaran dengan kode billing ${hasil.idbiling}`
            }
            let mailOption = {
              from: 'noreply@survplus.id',
              to: req.body.email,
              subject: subject,
              text: text
            }
            // let hasilWa =await kirimWa(req.body.hp, `silahkan lakukan pembayaran dengan kode billing ${hasil.idbiling}`)
            // console.log(hasilWa);

            transporter.sendMail(mailOption, (err, data) => {
              if (err) {
                console.log(err, 'error!');
              } else {
                console.log('sukses!');
              }
            })
            res.redirect(`/`)
        })
      })
    })
  }
})
router.get(`/getMakam/:kec/:lokasi/:blok/:subblok/:no_liang`,async function (req,res) {
  const q = `SELECT m.id FROM makam m WHERE m.id_kec ='${req.params.kec}' and  m.master_makam_id='${req.params.lokasi}' and m.blok='${req.params.blok}' and m.sub_blok='${req.params.subblok}' and m.no_liang ='${req.params.no_liang}' `
  // console.log(q);
  const makam_id = await sql_enak.raw(q)
  res.json({data:makam_id[0][0].id})
})
router.get(`/cekPin/:pin`,async function (req,res) {
  let q = ''
  let pemohon = await sql_enak.raw(`SELECT *,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,
  CASE 
  WHEN j.domisili_jenazah = '0' THEN 'Dalam kota semarang'
  WHEN j.domisili_jenazah = '1' THEN 'Luar kota semarang'
END as domisili_jenazah,
DATE_FORMAT(p2.tanggal_surat  , '%d-%m-%Y') as tanggal_surat
,DATE_FORMAT(p2.tanggal_berlaku_surat  , '%d-%m-%Y') as tanggal_berlaku_surat,
 CASE 
  WHEN p.domisili = '0' THEN 'Dalam kota semarang'
  WHEN p.domisili = '1' THEN 'Luar kota semarang'
END as domisili_pemohon,j.alamat as alamat_jenazah,p.alamat as alamat_pemohon,
   CONCAT(m.kecamatan,' lokasi  ',m.nama_tpu , ' blok  ' , m.blok,' sub blok  ', m.sub_blok , ' nomor liang  ',m.no_liang) as alamat_makam
  ,k.kecamatan as kecamatan_pemohon , k2.desa as kelurahan_pemohon , k3.kecamatan as kecamatan_jenazah , k4.desa as kelurahan_jenazah,
  m.agama as cluster , m.blok as blok_makam , m.sub_blok as sub_blok_makam , m.no_liang as no_liang_makam , j.agama as agama_jenazah
   ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id , m.id as makam_id ,m.agama as cluster , m.sub_blok as sub_blok_makam , m.no_liang as no_liang_makam from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = p.kec_id LEFT JOIN kelurahan k2 on k2.id_kelurahan = p.kel_id LEFT JOIN kecamatan k3 on k3.id_kecamatan = j.kec_id LEFT JOIN kelurahan k4 on k4.id_kelurahan  = j.kel_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status = 2 ORDER by p3.id DESC  LIMIT 1)   WHERE  p.pin ='${req.params.pin}' and p.id = p2.permohonan_id  and  p.deleted = 0`)
  if (pemohon[0].length==0) {
    q = await sql_enak.raw(`SELECT *,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,DATE_FORMAT(p2.tanggal_berlaku_surat  , '%d-%m-%Y') as tanggal_berlaku_surat    ,p.alamat as alamat, 2 as jns_pemakaman FROM pemohon p left join jenazah j on j.pemohon_id = p.id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status = 2 ORDER by p3.id DESC  LIMIT 1) left join makam m on m.id = j.makam_id  WHERE p.pin = '${req.params.pin}'`)
  } else {
    q = pemohon
  }
  res.json({data:q[0]})
})

router.get(`/dataJenazah`,async function (req,res) {
  let q = ''
  let nama = ''
  let nik = ''
  let type =''
  if (req.query.nama_pemohon) {
    nama += ` and p.nama_ahli_waris LIKE '%${req.query.nama_pemohon}%' and p.jns_pemakaman = 2 `
  }
  if (req.query.nama) {
    nama += ` and j.nama_jenazah LIKE '%${req.query.nama}%'`
  }
  if (req.query.tanggal) {
    nama += ` and j.tanggal_meninggal = (SELECT DATE_FORMAT('${req.query.tanggal}','%Y-%m-%d'))`
  }
  // if (req.query.nik) {
  //   nik = ` and j.ktp_jenazah = '${req.query.nik}'`
  // }
  if (req.query.type) {
    nama += ` and p.jns_pemakaman = '${req.query.type}'`
  }
  // console.log(nama);
  let pemohon = await sql_enak.raw(`SELECT *,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,
  CASE 
  WHEN j.domisili_jenazah = '0' THEN 'Dalam kota semarang'
  WHEN j.domisili_jenazah = '1' THEN 'Luar kota semarang'
END as domisili_jenazah,
DATE_FORMAT(p2.tanggal_surat  , '%d-%m-%Y') as tanggal_surat
,DATE_FORMAT(p2.tanggal_berlaku_surat  , '%d-%m-%Y') as tanggal_berlaku_surat,
 CASE 
  WHEN p.domisili = '0' THEN 'Dalam kota semarang'
  WHEN p.domisili = '1' THEN 'Luar kota semarang'
END as domisili_pemohon,j.alamat as alamat_jenazah,p.alamat as alamat_pemohon,
   CONCAT(m.kecamatan,' lokasi  ',m.nama_tpu , ' blok  ' , m.blok,' sub blok  ', m.sub_blok , ' nomor liang  ',m.no_liang) as alamat_makam
  ,k.kecamatan as kecamatan_pemohon , k2.desa as kelurahan_pemohon , k3.kecamatan as kecamatan_jenazah , k4.desa as kelurahan_jenazah,
  m.agama as cluster , m.blok as blok_makam , m.sub_blok as sub_blok_makam , m.no_liang as no_liang_makam , j.agama as agama_jenazah
   ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id , m.id as makam_id ,m.agama as cluster , m.sub_blok as sub_blok_makam , m.no_liang as no_liang_makam 
   from  jenazah j  
   left join permohonan p on j.id = p.jenazah_id  
   LEFT JOIN dokument d on d.jenazah_id = j.id 
   LEFT join makam m on m.id = j.makam_id 
   LEFT JOIN kecamatan k on k.id_kecamatan = p.kec_id 
   LEFT JOIN kelurahan k2 on k2.id_kelurahan = p.kel_id 
   LEFT JOIN kecamatan k3 on k3.id_kecamatan = j.kec_id 
   LEFT JOIN kelurahan k4 on k4.id_kelurahan  = j.kel_id 
   LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status = 2 ORDER by p3.id DESC  LIMIT 1)   WHERE  j.kategori_tpu = 0 and p.deleted = 0 ${nama} and p.id = p2.permohonan_id `)
 let pemohon2 = await sql_enak.raw(`SELECT *,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,
  CASE 
  WHEN j.domisili_jenazah = '0' THEN 'Dalam kota semarang'
  WHEN j.domisili_jenazah = '1' THEN 'Luar kota semarang'
END as domisili_jenazah,
DATE_FORMAT(p2.tanggal_surat  , '%d-%m-%Y') as tanggal_surat
,DATE_FORMAT(p2.tanggal_berlaku_surat  , '%d-%m-%Y') as tanggal_berlaku_surat,
 CASE 
  WHEN p.domisili = '0' THEN 'Dalam kota semarang'
  WHEN p.domisili = '1' THEN 'Luar kota semarang'
END as domisili_pemohon,j.alamat as alamat_jenazah,p.alamat as alamat_pemohon,
   CONCAT(m.kecamatan,' lokasi  ',m.nama_tpu , ' blok  ' , m.blok,' sub blok  ', m.sub_blok , ' nomor liang  ',m.no_liang) as alamat_makam
  ,k.kecamatan as kecamatan_pemohon , k2.desa as kelurahan_pemohon , k3.kecamatan as kecamatan_jenazah , k4.desa as kelurahan_jenazah,
  m.agama as cluster , m.blok as blok_makam , m.sub_blok as sub_blok_makam , m.no_liang as no_liang_makam , j.agama as agama_jenazah
   ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id , m.id as makam_id ,m.agama as cluster , m.sub_blok as sub_blok_makam , m.no_liang as no_liang_makam 
   from  jenazah j  
   left join permohonan p on j.id = p.jenazah_id  
   LEFT JOIN dokument d on d.jenazah_id = j.id 
   left join makam_tambahan mt on mt.id = j.makam_id 
   LEFT join makam m on m.id = mt.makam_id 
   LEFT JOIN kecamatan k on k.id_kecamatan = p.kec_id 
   LEFT JOIN kelurahan k2 on k2.id_kelurahan = p.kel_id 
   LEFT JOIN kecamatan k3 on k3.id_kecamatan = j.kec_id 
   LEFT JOIN kelurahan k4 on k4.id_kelurahan  = j.kel_id 
   LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status = 2 ORDER by p3.id DESC  LIMIT 1)   WHERE  j.kategori_tpu = 1 and p.deleted = 0 ${nama} and p.id = p2.permohonan_id `)
 console.log(pemohon[0],'pemohon[0]');
  console.log(pemohon2[0],'pemohon2[0]');
let data = pemohon[0]
data = data.concat(pemohon2[0]);
    console.log(data,'data[0]concat');

   res.json({data})
})
router.get('/perpanjangan/:id/:tipe',async function (req,res) {
  let z = ''
  if (req.params.tipe==2) {
    z=` and p.jns_pemakaman = 2 and j.id = ${req.params.id}`
  }else{
    z = ` and j.id = ${req.params.id}`
  }

    let q = `SELECT *,p.id as permohonan_id,j.id as jenazah_id,p2.id as perpanjangan_id,d.id as dokument_id 
    FROM  jenazah j  
    left join permohonan p on j.id = p.jenazah_id  
    LEFT JOIN dokument d on d.jenazah_id = j.id 
    LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id 
    and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id ORDER by p3.id DESC  LIMIT 1) 
    left join makam m on m.id = j.makam_id  
    WHERE  j.deleted = 0  and p.id = p2.permohonan_id ${z}`
  const data = await sql_enak.raw(q)

  let x = await sql_enak.raw(`SELECT * FROM master_retribusi mr WHERE mr.jenis = ${req.params.tipe}`)

  let tambahan = 0
  if (x[0][0].retribusi>0) {
    if (data[0][0].periode<5) {
      tambahan =   (+x[0][0].retribusi)*(1+(0.5*((+data[0][0].periode))))
    }else if (data[0][0].periode>=4){
      tambahan =   (+x[0][0].retribusi)*(3)
    }
  }

  console.log(data[0][0] , ' ini datanya');
  let response = {}
  // console.log(data[0][0].jenazah_id,data[0][0].permohonan_id,'adada',data[0][0].verifikasi_perpanjangan);

  if(data[0][0].verifikasi_perpanjangan == 0){
    // if(req.params.tipe!=2){

      await sql_enak("jenazah")
      .where("id", "=", data[0][0].jenazah_id)
      .update({verifikasi_perpanjangan:1,tanggal_daftar_perpanjangan:moment().format('YYYY-MM-DD')})
    // }
    const perpanjangan = {}
    let hasil = {idbiling:''}

    if (x[0][0].retribusi==0) {
      perpanjangan.status_pembayaran = 1
    }else{
      hasil = await getIdBilling(tambahan,data[0],'perpanjangan');

    }
    perpanjangan.retribusi = tambahan
    perpanjangan.dokument_id = data[0][0].dokument_id
    // perpanjangan.tanggal_surat=req.body.tanggal_surat
    // perpanjangan.tanggal_berlaku_surat = moment(req.body.tanggal_surat).add(3, 'Y').format('YYYY-MM-DD')
    perpanjangan.inserted_perpanjangan = moment().format('YYYY-MM-DD')
    perpanjangan.kode_billing = hasil.idbiling
    perpanjangan.status=0
    perpanjangan.permohonan_id = data[0][0].permohonan_id
    // console.log(data[0][0]);
    let text1 = ''
    let text2 = ''
    let text3 = ''
    let subject = ''
    if (req.params.tipe == 0 ) {
      subject = 'Permohonan perpanjangan ijin penggunaan tanah makam'
      // text1 = `Silahkan lakukan pembayaran Permohonan Ijin Perpanjangan Penggunaan Tanah Makam dengan kode billing ${hasil.idbiling}`
      text1 = `Permohonan perpanjangan ijin penggunaan tanah makam/pemakaman jenazah anda berhasil terkirim. Silahkan tunggu verifikasi permohonan anda dari pengelola TPU terkait.`
      text2 = `Terdapat permohonan baru perpanjangan ijin penggunaan tanah makam. Silahkah segera lakukan verifikasi data permohonan tersebut`
    }else if (req.params.tipe == 2 ){
      subject = 'Permohonan perpanjangan ijin pesan tempat makam'

      text1 = `Permohonan perpanjangan ijin pesan tempat makam anda berhasil terkirim. Silahkan tunggu verifikasi permohonan anda dari pengelola TPU terkait.`
      text2 = `Terdapat permohonan baru perpanjangan ijin pesan tempat makam pada TPU yang anda kelola. Silahkah segera lakukan verifikasi data permohonan tersebut`
      text3 =`Terdapat permohonan baru perpanjangan ijin pesan tempat makam pada TPU yang dikelola pemerintah kota semarang`
    }else if (req.params.tipe == 4 ){
      subject = 'Permohonan perpanjangan ijin pemakaman tumpang'

      // text1 = `Silahkan lakukan pembayaran Permohonan Ijin Perpanjangan Penggunaan Tanah Makam Tumpang dengan kode billing ${hasil.idbiling}`
      text1 = `Permohonan perpanjangan ijin pemakaman tumpang anda berhasil terkirim. Silahkan tunggu verifikasi permohonan anda dari pengelola TPU terkait.`
      text2 = `Terdapat permohonan baru perpanjangan ijin pemakaman tumpang. Silahkan segera lakukan verifikasi data permohonan tersebut.`
    }
   await sql_enak.insert(perpanjangan).into("perpanjangan").then(async function (id) {
      let mailOption = {
        from: 'noreply@survplus.id',
        to: data[0][0].email,
        subject,
        text: text1
      }
      // let hasilWa =await kirimWa( data[0][0].hp,text1)
      // console.log(hasilWa,data[0][0].hp);
      let d = await sql_enak.raw(`SELECT * FROM user u WHERE u.master_makam_id = '${data[0][0].master_makam_id}' and u.deleted = 0`)
      let admin = await sql_enak.raw(`SELECT * FROM user u WHERE is_admin =1 and u.deleted = 0`)
      console.log(id , d[0][0] , admin[0][0]);
      // let mailOption2 = {
      //   from: 'noreply@survplus.id',
      //   to: admin[0][0].email,
      //   subject,
      //   text: text3
      // }
      // let mailOption3 = {
      //   from: 'noreply@survplus.id',
      //   to: d[0][0].email,
      //   subject,
      //   text: text2
      // }
      // transporter.sendMail(mailOption2, (err, data) => {
      //   if (err) {
      //     console.log(err, 'error!');
      //   } else {
      //     console.log('sukses!');
      //   }
      // })
      // transporter.sendMail(mailOption3, (err, data) => {
      //   if (err) {
      //     console.log(err, 'error!');
      //   } else {
      //     console.log('sukses!');
      //   }
      // })
      // transporter.sendMail(mailOption, (err, data) => {
      //   if (err) {
      //     console.log(err, 'error!');
      //   } else {
      //     console.log('sukses!');
      //   }
      // })
    })
    response.res=200
    response.message='Data permohonan perpanjangan ijin berhasil terkirim, segala pemberitahuan mengenai permohonan perpanjangan ijin anda akan kami informasikan melalui email yang telah anda inputkan pada pada sistem.'
    
    res.send({response})

  }else if(data[0][0].verifikasi_perpanjangan == 1){
    console.log('verifikasi_perpanjangan == 1');
    response.res=500
    response.message='Data perpanjangan ijin belum diverifikasi oleh pengelola TPU'
    res.send({response})

  }

})
router.post('/perpanjanganMakam',upload.fields([{name:'foto_ktp_pemohon',maxCount:1},{name:'sk_lama',maxCount:1}]),async function (req,res) {
  let post = req.body
  let q = ''
  let tambahan = 0
      const { v4: uuidv4 } = await import('uuid');
  let uuid = uuidv4()
  console.log(post);
  
  if (req.files) {
    if (req.files["foto_ktp_pemohon"]) {
      var nama_file = req.files["foto_ktp_pemohon"][0].filename;
      post["foto_ktp_pemohon"] = nama_file;  
    }
    if (req.files["sk_lama"]) {
      var nama_file = req.files["sk_lama"][0].filename;
      post["sk_lama"] = nama_file;  
    }
  }
  // if (req.params.tipe==2) {
  //   q=`SELECT *,p.id as pemohon_id,j.id as jenazah_id,p2.id as perpanjangan_id,d.id as dokument_id FROM jenazah j left join pemohon p  on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id ORDER by p3.id DESC  LIMIT 1) left join makam m on m.id = j.makam_id  WHERE j.id ='${req.body.id}' and p.deleted = 0`
  // }else{
    q = `SELECT *,d.duuid,p.id as permohonan_id,j.id as jenazah_id,p2.id as perpanjangan_id,d.id as dokument_id FROM  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id ORDER by p3.id DESC  LIMIT 1) left join makam m on m.id = j.makam_id  WHERE j.id ='${req.body.jenazah_id}' and p.deleted = 0  and p.id = p2.permohonan_id `
  // }
  // console.log(req.body);
  const perpanjangan = {}
  try {
    

  let  data = await sql_enak.raw(q)
  if (data[0][0].kategori_tpu == 1) {
    q = `SELECT j.*,j.kategori_tpu ,p.id as permohonan_id,j.id as jenazah_id,p2.id as perpanjangan_id,d.id as dokument_id 
FROM  jenazah j  left join permohonan p on j.id = p.jenazah_id  
LEFT JOIN dokument d on d.jenazah_id = j.id 
LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id ORDER by p3.id DESC  LIMIT 1) 
left join makam_tambahan mt on mt.id = j.makam_id and mt.deleted = 0
left join makam m on m.id = mt.makam_id  
WHERE j.id ='${req.body.jenazah_id}' and p.deleted = 0  and p.id = p2.permohonan_id `
data = await sql_enak.raw(q)
  }
  let x = await sql_enak.raw(`SELECT * FROM master_retribusi mr WHERE mr.jenis = ${req.body.tipe}`)
  // console.log(data[0][0],x,'fdsfsd');
  if (x[0][0].retribusi==0) {
    perpanjangan.status_pembayaran = 1
  }
  let hasil = {idbiling:''}

  // if (x[0][0].retribusi==0) {
  //   perpanjangan.status_pembayaran = 1
  //   hasil = await getIdBilling(tambahan);
  // }
  if (data[0][0].periode<5) {
    tambahan =   (+x[0][0].retribusi)*(1+(0.5*((+data[0][0].periode))))
  }else if (data[0][0].periode>=4){
    tambahan =   (+x[0][0].retribusi)*(3)
  }
    // let hasil = await getIdBilling(tambahan);

  let response = {}
  let text1 = ''
  let text2 = ''
  let text3 = ''
  let subject = ''
  if (data[0][0].jns_pemakaman == 0 ) {
    subject = 'Permohonan perpanjangan ijin penggunaan tanah makam'
    if (x[0][0].retribusi>0) {
      text1 = `Silahkan lakukan pembayaran Permohonan Ijin Perpanjangan Penggunaan Tanah Makam dengan kode billing ${hasil.idbiling}`
    }else{
      text1 = `Permohonan perpanjangan ijin penggunaan tanah makam/pemakaman jenazah anda berhasil terkirim. Silahkan tunggu verifikasi permohonan anda dari pengelola TPU terkait.`
    }
    text2 = `Terdapat permohonan baru perpanjangan ijin penggunaan tanah makam pada TPU yang anda kelola. Silahkah segera lakukan verifikasi data permohonan tersebut`
    text3 = `Terdapat permohonan baru perpanjangan ijin penggunaan tanah makam pada TPU yang dikelola oleh pemerintah kota semarang.`
  }else if (data[0][0].jns_pemakaman == 2){
    subject = 'Permohonan perpanjangan ijin pesan tempat makam'
    if (x[0][0].retribusi>0) {
      text1 = `email retrubusi`
    }else{
      text1 = `Terdapat permohonan baru perpanjangan ijin pesan tempat makam pada TPU yang anda kelola. Silahkah segera lakukan verifikasi data permohonan tersebut`
    }
    text2 = `Terdapat permohonan baru perpanjangan ijin pesan tempat makam pada TPU yang anda kelola. Silahkah segera lakukan verifikasi data permohonan tersebut`
    text3 =`Terdapat permohonan baru perpanjangan ijin pesan tempat makam pada TPU yang dikelola pemerintah kota semarang`
  }else if (data[0][0].jns_pemakaman == 4){
    subject = 'Permohonan perpanjangan ijin pemakaman tumpang'
    if (x[0][0].retribusi>0) {
      text1 = `Silahkan lakukan pembayaran Permohonan Ijin Perpanjangan Penggunaan Tanah Makam Tumpang dengan kode billing ${hasil.idbiling}`
    }else{
      text1 = `Permohonan perpanjangan ijin pemakaman tumpang anda berhasil terkirim. Silahkan tunggu verifikasi permohonan anda dari pengelola TPU terkait.`
    }
    text2 = `Terdapat permohonan baru perpanjangan ijin pemakaman tumpang pada TPU yang anda kelola. Silahkah segera lakukan verifikasi data permohonan tersebut`
    text3 = `Terdapat permohonan baru perpanjangan ijin penggunaan pemakaman tumpang pada TPU yang dikelola oleh pemerintah kota semarang.`
  }
  console.log([subject,'subject',data[0][0]]);
  
  if(data[0][0].verifikasi_perpanjangan == 0){
    post.jns_pemakaman = req.body.tipe
    delete post.tipe
    post.inserted = new Date()
    // if(req.params.tipe!=2){
      post.pin=await get_pin()
console.log('  if(data[0][0].verifikasi_perpanjangan == 0){');
 await sql_enak('permohonan').where('id','=',post['id']).update(post)
    //  let data_permohonan =  await sql_enak('permohonan').insert(post)
        // console.log(data_permohonan[0],'data_permohonan[0]');
        
      await sql_enak("jenazah")
      .where("id", "=", data[0][0].jenazah_id)
      .update({verifikasi_perpanjangan:1,tanggal_daftar_perpanjangan:moment().format('YYYY-MM-DD')})
    // }
    perpanjangan.retribusi = tambahan
    perpanjangan.dokument_id = data[0][0].dokument_id
    // perpanjangan.tanggal_surat=req.body.tanggal_surat
    // perpanjangan.tanggal_berlaku_surat = moment(req.body.tanggal_surat).add(3, 'Y').format('YYYY-MM-DD')
    perpanjangan.inserted_perpanjangan = moment().format('YYYY-MM-DD')
    perpanjangan.kode_billing = hasil.idbiling
    perpanjangan.status=0
    // perpanjangan.permohonan_id = data_permohonan[0]
 perpanjangan.permohonan_id =post.id
     perpanjangan.duuid= data[0][0].duuid
    perpanjangan.pjuuid=uuid

    await sql_enak.insert(perpanjangan).into("perpanjangan").then(async function (id) {
      let mailOption = {
        from: 'noreply@survplus.id',
        to: req.body.email,
        subject: subject,
        text: text1
      }
      let d = await sql_enak.raw(`SELECT * FROM user u WHERE u.master_makam_id = '${data[0][0].master_makam_id}' and u.deleted = 0`)
      let admin = await sql_enak.raw(`SELECT * FROM user u WHERE is_admin =1 and u.deleted = 0`)
      console.log(d[0][0]);
      
      let mailOption2 = {
        from: 'noreply@survplus.id',
        to: admin[0][0].email,
        subject: subject,
        text:  text3
      }
      let mailOption3 = {
        from: 'noreply@survplus.id',
        to: d[0][0].email,
        subject: subject,
        text: text2
      }
      // let hasilWa =await kirimWa(req.body.hp, `Silahkan lakukan pembayaran Permohonan Ijin Perpanjangan Penggunaan Tanah Makam dengan kode billing ${hasil.idbiling}`)
      // console.log(hasilWa);
      // if ( x[0][0].retribusi>0) {
        
      transporter.sendMail(mailOption, (err, data) => {
        if (err) {
          console.log(err, 'error!');
        } else {
          console.log('sukses!');
        }
      })
      transporter.sendMail(mailOption2, (err, data) => {
        if (err) {
          console.log(err, 'error!');
        } else {
          console.log('sukses!');
        }
      })
      transporter.sendMail(mailOption3, (err, data) => {
        if (err) {
          console.log(err, 'error!');
        } else {
          console.log('sukses!');
        }
      })
      // }
    })
  
    response.res=200
    response.message='mohon tunggu verifikasi admin'
  }else if(data[0][0].verifikasi_perpanjangan == 1){
    console.log('  }else if(data[0][0].verifikasi_perpanjangan == 1){');
    
    response.res=500
    response.message='masih menunggu konfirmasi admin'
    await kirimWa(req.body.hp, response.message)
  }

    // res.send({response})
    res.redirect('/')
  } catch (error) {
    console.log(error);
    
    res.send({error})
  }
})
router.get(`/getDataPemohon/:nama`,async function (req,res) {
  let data = await sql_enak.raw(`SELECT *,p.id as pemohon_id , p2.id as perpanjangan_id,2 as jns_pemakaman,DATE_FORMAT(p2.tanggal_berlaku_surat,'%d-%m-%Y') as tanggal_berlaku_surat, (SELECT CURRENT_DATE() > p2.tanggal_berlaku_surat) as kadaluarsa  FROM pemohon p left join perpanjangan p2 on p2.permohonan_id = p.id  LEFT JOIN makam m on m.id = p.makam_id WHERE p.deleted = 0 AND p.nama LIKE   '%${req.params.nama}%'`)
  res.json({data:data[0]})
})

router.get(`/selesaiPerpanjangan/:id`,async function (req,res) {
  let data = await sql_enak.raw(`SELECT *,p.id as permohonan_id ,j.id as jenazah_id , d.id as dokumen_id FROM jenazah j left join permohonan p on p.jenazah_id = j.id LEFT JOIN dokument d on d.jenazah_id = j.id  WHERE j.id  = ${req.params.id}`)
  
})
router.get(`/getNamaLokasi/:id`,async function (req,res) {
  let data = await sql_enak.raw(`SELECT m.nama_tpu  FROM makam m WHERE m.master_makam_id = ${req.params.id}`)
  res.json({data:data[0]})
})
module.exports = router;
