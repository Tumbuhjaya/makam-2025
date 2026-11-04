var express = require('express')
  , http = require('http')
  , path = require('path')
  , logger = require('morgan')
  , bodyParser = require('body-parser')
  , methodOverride = require('method-override')
  , static = require('serve-static')
  , errorHandler = require('errorhandler')
  , passport = require('passport')
  , session = require('express-session')
  , cookieParser = require('cookie-parser')
  , flash = require("connect-flash")
  , LocalStrategy = require('passport-local').Strategy;
  var sql_enak = require('./database/mysql_enak.js').connection;
  var axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
var storage = require('./storage');

  var nodemailer = require('nodemailer')
  var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
     user: process.env.GMAIL_USER,
     pass: process.env.GMAIL_APP_PASSWORD
    }
  });
var login = require('./isine/login').router;
var peta = require('./isine/topojson');
var upload = require('./isine/upload_file');
// var upload_shp = require('./isine/upload_shp');
var user = require('./isine/user');
var fn = require('./isine/ckeditor-upload-image');
var cek_login = require('./isine/login').cek_login;
var permohonan_ijin = require('./isine/permohonan_ijin');
var pilihan_permohonan = require('./isine/pilihan_permohonan');
var permohonan_bergota = require('./isine/permohonan_bergota');
var jenazah = require('./isine/jenazah');

var api = require('./isine/api');

var revisi_dokumen = require('./isine/revisi_dokumen');
var manajemen_permohonan = require('./isine/manajemen_permohonan');
var manajemen_perpanjangan = require('./isine/manajemen_perpanjangan');
var manajemen_perijinan = require('./isine/manajemen_perijinan');
var manajemen_laporan = require('./isine/manajemen_laporan');
var manajemen_master = require('./isine/manajemen_master');
var manajemen_sinkronisasi = require('./isine/manajemen_sinkronisasi');
var manajemen_pemakaman_special = require('./isine/manajemen_pemakaman_special');
var manajemen_penandatanganan_ijin = require('./isine/manajemen_penandatanganan_ijin');
var manajemen_basic = require('./isine/manajemen_basic');

var moment = require("moment")
// const { Resend } = require('resend');

// Inisialisasi langsung dengan API Key
// const resend = new Resend('re_15JzhGgN_LDqAxkmkwAEiE5G9h6fMRXSw');

// async function kirimEmail(email,subject,html) {
//   try {
//     const data = await resend.emails.send({
//       from: 'makam.semarangkota@gmail.com', // Gunakan domain yang sudah diverifikasi nanti
//       to: [email],
//       subject: subject,
//       html: html,
//     });

//     console.log('Berhasil terkirim:', data);
//   } catch (error) {
//     console.error('Ada error:', error);
//   }
// }

// kirimEmail();
moment.locale('id')
var app = express();
var connection = require('./database').connection;
//var mysql2geojson = require("mysql2geojson");
var router = express.Router();
var dbgeo = require("dbgeo");
app.set('views', __dirname + '/views');
//app.set('view engine', 'jade');
//app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');


//end dbf dan shp
// all environments
app.set('port', process.env.PORT || 8941);

//app.use(express.favicon());
app.use(function (req, res, next) {

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
app.use(logger('dev'));
app.use(methodOverride());
// app.use(static(path.join(__dirname, 'public')));
app.get('/foto/:key', storage.serve);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  duration: 50 * 60 * 1000,
  activeDuration: 10 * 60 * 1000,
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 60 * 60 * 1000 },
  cookieName: 'session',
  saveUninitialized: true,
  resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// Add headers

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}
var server = http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
var io = require('socket.io').listen(server, { log: false });

//mulai apps ----------------------------------------------------------
app.use('/autentifikasi', login);
app.use('/peta', peta);
app.use('/upload', upload);
// app.use('/upload_shp', upload_shp);
app.use('/user', user);
app.use('/uploadckeditor', fn);
app.use('/permohonan_ijin', permohonan_ijin);
app.use('/pilihan_permohonan', pilihan_permohonan);
app.use('/permohonan_bergota', permohonan_bergota);
app.use('/revisi_dokumen', revisi_dokumen);
app.use('/manajemen_permohonan', manajemen_permohonan);
app.use('/manajemen_laporan', manajemen_laporan);
app.use('/manajemen_perpanjangan', manajemen_perpanjangan);
app.use('/manajemen_perijinan', manajemen_perijinan);
app.use('/manajemen_master', manajemen_master);
app.use('/manajemen_sinkronisasi', manajemen_sinkronisasi);
app.use('/manajemen_pemakaman_special', manajemen_pemakaman_special);
app.use('/manajemen_penandatanganan_ijin', manajemen_penandatanganan_ijin);
app.use('/manajemen_basic', manajemen_basic);
app.use('/jenazah', jenazah);
app.use('/makam',  require('./isine/makam'));
app.use('/log',  require('./isine/log'));
app.get('/verify-tte', async (req, res) => {
  try {
    const fileBuffer = await storage.getFile('hasil_tte3.pdf');
    const base64File = fileBuffer.toString('base64');

    const username = process.env.TTE_USERNAME;
    const password = process.env.TTE_PASSWORD;
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await axios.post(
      process.env.TTE_BASE_URL + '/api/v2/verify/pdf',
      { file: base64File },
      {
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Hasil Verifikasi:', JSON.stringify(response.data, null, 2));

    return res.json({
      status: 'success',
      verification: response.data
    });

  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({
      status: 'error',
      message: error.response?.data || error.message
    });
  }
});
app.get('/cetak-tte-inv', async (req, res) => {
  let { file } = req.body
  try {
    // 🔹 1. Read file PDF
    const fileBuffer = await storage.getFile(file);
    const base64File = fileBuffer.toString('base64');

    // 🔹 2. Config Esign
    const username = process.env.TTE_USERNAME;
    const password = process.env.TTE_PASSWORD;
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

    // 🔹 3. Request ke API TTE
    const response = await axios.post(
      process.env.TTE_BASE_URL + '/api/v2/sign/pdf',
      {
        nik: process.env.TTE_NIK,
        passphrase: process.env.TTE_PASSPHRASE,
        signatureProperties: [
          {
            tampilan: "INVISIBLE",
             tag_koordinat: "#",
    width: 200,
    height: 100
          }
        ],
        file: [base64File]
      },
      {
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 🔹 4. Ambil hasil base64
        console.log('FULL RESPONSE:', response.data);

    const resultBase64 = response.data.file[0];
    // 🔹 5. Convert ke PDF
    // const outputPath = __dirname + '../public/hasil_tte.pdf';
    await storage.putFile('hasil_tte4.pdf', Buffer.from(resultBase64, 'base64'), 'application/pdf');

    return res.json({
      status: 'success',
      message: 'TTE berhasil',
      file: '/public/hasil_tte.pdf'
    });

  } catch (error) {
    console.error(error.response?.data || error.message);

    return res.status(500).json({
      status: 'error',
      message: error.response?.data || error.message
    });
  }
});
app.post('/penandatangan', async (req, res) => {
  let sql = await sql_enak.raw(`SELECT * from user u where u.deleted = 0 and u.is_admin in (2,3)`)
  res.json({status:200,data:sql[0]})
})
app.post('/cetak-tte-qrcode', async (req, res) => {
  let {file,nik,passphrase} = req.body
  console.log(file, nik);
  if (file&&nik&&passphrase) {
    
  try {
    // 🔹 1. Path file (AMAN)
    file = path.basename(file);
    if (!(await storage.exists(file))) {
      return res.status(400).json({
        status: 'error',
        message: 'File tidak ditemukan'
      });
    }

    const fileBuffer = await storage.getFile(file);

    // 🔹 2. Config Basic Auth
    const username = process.env.TTE_USERNAME;
    const password = process.env.TTE_PASSWORD;
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

    // 🔹 3. FormData (FIXED VERSION)
    const form = new FormData();
    form.append('file', fileBuffer, { filename: file });
    form.append('nik', nik);
    form.append('passphrase', passphrase);
    form.append('tampilan', 'visible');
    form.append('linkQR', process.env.APP_PUBLIC_URL + '/foto/hasil_'+file);
    form.append('tag_koordinat', '#');
    form.append('width', '50');
    form.append('height', '50');

    // 🔹 4. Request ke API
    const response = await axios.post(
      process.env.TTE_BASE_URL + '/api/sign/pdf',
      form,
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          ...form.getHeaders()
        },
        responseType: 'arraybuffer' // 🔥 WAJIB biar PDF tidak corrupt
      }
    );

    // 🔹 5. Simpan hasil PDF
    await storage.putFile('hasil_'+file, Buffer.from(response.data), 'application/pdf');
    await sql_enak.raw(`UPDATE dokument SET sk = ? WHERE sk = ?`, ['hasil_'+file, file]);

    return res.json({
      status: 'success',
      file: `${'hasil_'+file}`,
    });

  } catch (error) {
    console.error('ERROR FULL:', error.response?.data || error.message);

    return res.status(500).json({
      status: 'error',
      message: error.response?.data || error.message
    });
  }
    }else{
       return res.status(500).json({
      status: 'error',
      message: 'File , Nik dan Passphrase wajib terisi'
    });
    }

});
app.post('/cetak-tte-qrcode-p', async (req, res) => {
  let {file,nik,passphrase} = req.body
  console.log(file, nik);
  if (file&&nik&&passphrase) {
    
  try {
    // 🔹 1. Path file (AMAN)
    file = path.basename(file);
    if (!(await storage.exists(file))) {
      return res.status(400).json({
        status: 'error',
        message: 'File tidak ditemukan'
      });
    }

    const fileBuffer = await storage.getFile(file);

    // 🔹 2. Config Basic Auth
    const username = process.env.TTE_USERNAME;
    const password = process.env.TTE_PASSWORD;
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

    // 🔹 3. FormData (FIXED VERSION)
    const form = new FormData();
    form.append('file', fileBuffer, { filename: file });
    form.append('nik', nik);
    form.append('passphrase', passphrase);
    form.append('tampilan', 'visible');
    form.append('linkQR', process.env.APP_PUBLIC_URL + '/foto/hasil_'+file);
    form.append('tag_koordinat', '#');
    form.append('width', '50');
    form.append('height', '50');

    // 🔹 4. Request ke API
    const response = await axios.post(
      process.env.TTE_BASE_URL + '/api/sign/pdf',
      form,
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          ...form.getHeaders()
        },
        responseType: 'arraybuffer' // 🔥 WAJIB biar PDF tidak corrupt
      }
    );

    // 🔹 5. Simpan hasil PDF
    await storage.putFile('hasil_'+file, Buffer.from(response.data), 'application/pdf');
    await sql_enak.raw(`UPDATE perpanjangan SET sk_perpanjangan = ? WHERE sk_perpanjangan = ?`, ['hasil_'+file, file]);

    return res.json({
      status: 'success',
      file: `${'hasil_'+file}`,
    });

  } catch (error) {
    console.error('ERROR FULL:', error.response?.data || error.message);

    return res.status(500).json({
      status: 'error',
      message: error.response?.data || error.message
    });
  }
    }else{
       return res.status(500).json({
      status: 'error',
      message: 'File , Nik dan Passphrase wajib terisi'
    });
    }

});
app.use('/api', api);
app.get('/getUser',cek_login,function (req, res) {
  let user = ''
  if (req.user) {
    user = req.user[0]
  }

  res.json({ user })
})
app.get('/jumlahLiangMakam',async function (req, res) {
  let data = await sql_enak.raw(`SELECT COUNT(*) as count from makam m WHERE m.deleted = 0 `)

  res.json({ data:data[0] })
})
app.post('/get_nama_pemohon',async function (req,res) {
  let {kolom , val_kol ,tanggal_meninggal,nama_jenazah, is_null , is_not_null} = req.body
  let str = ''
  let value = []
  if (tanggal_meninggal) {
      str += ` and j.tanggal_meninggal like '%${tanggal_meninggal}%' `
  }
  if (nama_jenazah) {
    str += ` and j.nama_jenazah like '%${nama_jenazah}%' `
  }
  
  if (kolom&&val_kol) {
      str += ` and ${kolom} = ? `
      value.push(val_kol)
  }
  if (is_not_null) {
    str += ` and ${is_not_null} is not null`
  }
  if (is_null) {
    str += ` and ${is_null} is null`
  }
  let sql = `SELECT DISTINCT  nama_jenazah  FROM jenazah j left join permohonan p on p.jenazah_id = j.id and p.deleted = 0  WHERE j.deleted = 0 ${str} order by nama_jenazah asc`
  console.log(sql);
  console.log(value);
  await sql_enak.raw(sql,value).then(function (hsl) {
    res.json({data:hsl[0]})
  })
})
app.post('/get_nama_dan_lokasi',async function (req,res) {
  let {kolom , val_kol ,tanggal_meninggal,nama_jenazah, is_null , is_not_null} = req.body
  let str = ''
  let value = []
  if (tanggal_meninggal) {
      str += ` and j.tanggal_meninggal like '%${tanggal_meninggal}%' `
  }
  if (nama_jenazah) {
    str += ` and j.nama_jenazah like '%${nama_jenazah}%' `
  }
  
  if (kolom&&val_kol) {
      str += ` and ${kolom} = ? `
      value.push(val_kol)
  }
  if (is_not_null) {
    str += ` and ${is_not_null} is not null`
  }
  if (is_null) {
    str += ` and ${is_null} is null`
  }
  let sql = `SELECT  
    DATE_FORMAT(j.tanggal_meninggal,'%Y') as tahun, 
    p.id as permohonan_id,
    j.id as jenazah_id, 
    j.nama_jenazah as nama_jenazah, 
    IF(j.kategori_tpu = 1, m2.id, m.id) as makam_id,
    IF(j.kategori_tpu = 1, x(centroid(m2.SHAPE)), x(centroid(m.SHAPE))) as x,
    IF(j.kategori_tpu = 1, y(centroid(m2.SHAPE)), y(centroid(m.SHAPE))) as y
FROM (
    SELECT * FROM (
        SELECT max(p.id) as idx 
        FROM permohonan p 
        WHERE deleted = 0  
        GROUP BY jenazah_id
    ) i 
    LEFT JOIN permohonan p ON i.idx = p.id 
    WHERE deleted = 0  
    GROUP BY jenazah_id 
) p 
LEFT JOIN jenazah j ON p.jenazah_id = j.id AND j.deleted = 0 
LEFT JOIN makam m ON m.id = j.makam_id AND m.deleted = 0 
LEFT JOIN makam_tambahan mt ON mt.id = j.makam_id AND mt.deleted = 0 
LEFT JOIN makam m2 ON m2.id = mt.makam_id AND m2.deleted = 0 
WHERE j.deleted = 0 ${str} ORDER by j.nama_jenazah DESC;`
  await sql_enak.raw(sql,value).then(function (hsl) {
    res.json({data:hsl[0]})
  })
})
app.get('/kecamatan',async function (req, res) {
  let kecamatan =  await sql_enak.raw(`SELECT id_kec , kecamatan FROM kecamatan k `)
  res.json({data:kecamatan[0]})
})
app.get('/',async function (req, res) {
  let date = moment().format('YYYY-MM-DD')
  console.log(new Date());
      let luas = await sql_enak.raw("SELECT sum(luas) as luas from master_makam")
console.log(luas[0],'ini luas');

  connection.query("SELECT id_kecamatan, kecamatan from kecamatan",async function (err, kec, fields) {
    connection.query(`SELECT  nama_tpu,id, (select x(centroid(SHAPE)) from makam where master_makam_id =mm.id limit 1 ) as x, (select y(centroid(SHAPE)) from makam where master_makam_id=mm.id limit 1 ) as y FROM master_makam mm  where mm.deleted = 0  GROUP by nama_tpu`,async function (err, makam , fields) {
      connection.query("SELECT id_kecamatan, kecamatan from kecamatan",async function (err, kecamatan, fields) {
        connection.query(`SELECT COUNT(*) as total  FROM makam m WHERE  m.jumlah_jenazah  =0  and m.deleted = 0`,async function (err, liang_kosong, fields) {
            connection.query(`SELECT COUNT(*) as total  FROM makam m WHERE  m.jumlah_jenazah  >0   and m.deleted = 0`,async function (err, liang_isi, fields) {
              connection.query(`SELECT COUNT(*) AS total
              FROM permohonan p
              LEFT JOIN jenazah j ON j.permohonan_id = p.id
              LEFT JOIN dokument d ON d.jenazah_id = j.id
              LEFT JOIN makam m ON m.id = j.makam_id
              LEFT JOIN (
                  SELECT DISTINCT  p2.dokument_id,p2.id
                  FROM perpanjangan p2
                  WHERE p2.status = 2
                  AND p2.tanggal_berlaku_surat >=  CURRENT_DATE() 
                  ORDER BY p2.id DESC
              ) p2 ON p2.dokument_id = d.id
              WHERE m.status_makam = 2
                  AND p.jns_pemakaman = 0
                  AND m.deleted = 0
                  AND p2.dokument_id IS NOT NULL`,async function (err, liang_berlaku1, fields) {
                connection.query(`SELECT COUNT(*) AS total
                FROM permohonan p
                LEFT JOIN jenazah j ON j.permohonan_id = p.id
                LEFT JOIN dokument d ON d.jenazah_id = j.id
                LEFT JOIN makam m ON m.id = j.makam_id
                LEFT JOIN (
                    SELECT DISTINCT  p2.dokument_id,p2.id
                    FROM perpanjangan p2
                    WHERE p2.status = 2
                    AND p2.tanggal_berlaku_surat <  CURRENT_DATE() 
                    ORDER BY p2.id DESC
                ) p2 ON p2.dokument_id = d.id
                WHERE m.status_makam = 2
                    AND p.jns_pemakaman = 0
                    AND m.deleted = 0
                    AND p2.dokument_id IS NOT NULL`,async function (err, liang_kadaluarsa1, fields) {            
                  let liang_berlaku = 0
                  let liang_kadaluarsa = 0
                  console.log(liang_berlaku1);
                  
                  if (liang_berlaku1[0]) {
                    liang_berlaku+=liang_berlaku1[0].total
                  }
        
                  if (liang_kadaluarsa1[0]) {
                    liang_kadaluarsa+=liang_kadaluarsa1[0].total
                  }
                  res.render('content/index', {kecamatan,makam,user: req.user,liang_kosong,luas:luas[0][0].luas,liang_isi,liang_berlaku,liang_kadaluarsa,kec})
              })
            })
          })
        })
      })
    })
  })
})
app.get('/peta_lantai', function (req, res) {
  res.render('content/peta_lantai');
})
app.get('/getJumlahLiang',async function (req,res) {
  let x =''
  let l = ''
  if (req.query.master_makam_id&&req.query.master_makam_id != 'null') {
    x+=` and m.master_makam_id  = '${req.query.master_makam_id}'`
        l+=` where  m.id  = '${req.query.master_makam_id}'`

  }
  if (req.query.blok&&req.query.blok != 'null') {
    x+=` and m.blok  = '${req.query.blok}'`
  }
  if (req.query.sub_blok&&req.query.sub_blok != 'null') {
    x+=` and m.sub_blok  = '${req.query.sub_blok}'`
  }
  if (req.query.no_liang&&req.query.no_liang != 'null') {
    x+=` and m.no_liang  = '${req.query.no_liang}'`
  }

  let luas = await sql_enak.raw(`select sum(m.luas) luas from master_makam m `+l)
  let date = moment().format('YYYY-MM-DD')
  let sql_isi = `SELECT
  (SELECT COUNT(*) FROM makam m left join master_makam mm on mm.id = m.master_makam_id WHERE mm.kategori_tpu =0 and  m.jumlah_jenazah  >0   and m.deleted = 0 ${x})+  (SELECT COUNT(*) FROM makam_tambahan mt left join jenazah j on j.makam_id = mt.id and j.deleted = 0 left JOIN makam m on m.id = mt.makam_id  WHERE mt.jumlah_jenazah > 0 and j.id is not null AND mt.deleted = 0 ${x}) AS total;`
  console.log(sql_isi);
  connection.query(`SELECT COUNT(*) as total  FROM makam m left join master_makam mm on mm.id = m.master_makam_id WHERE mm.kategori_tpu =0 and  m.jumlah_jenazah  =0  and m.deleted = 0 ${x}`,async function (err, liang_kosong, fields) {
    connection.query(sql_isi,async function (err, liang_isi, fields) {
      connection.query(`SELECT (SELECT COUNT(*)
      FROM permohonan p
      LEFT JOIN jenazah j ON j.permohonan_id = p.id
      LEFT JOIN dokument d ON d.jenazah_id = j.id
      LEFT JOIN makam m ON m.id = j.makam_id
      LEFT JOIN (
          SELECT DISTINCT  p2.dokument_id,p2.id
          FROM perpanjangan p2
          WHERE p2.status = 2
          AND p2.tanggal_berlaku_surat >= '${date}'
          ORDER BY p2.id DESC
      ) p2 ON p2.dokument_id = d.id
       left join master_makam mm on mm.id = m.master_makam_id WHERE mm.kategori_tpu =0 and  m.status_makam = 2
          AND p.jns_pemakaman = 0
          AND m.deleted = 0
          AND p2.dokument_id IS NOT NULL ${x})+(SELECT count(*) as total FROM makam_tambahan mt left join makam m on m.id = mt.makam_id  left join jenazah j on j.makam_id = mt.id and j.kategori_tpu = 1
left join permohonan p on p.jenazah_id = j.id and p.deleted = 0
left join dokument d on d.jenazah_id = j.id and d.deleted = 0 
      LEFT JOIN (
          SELECT DISTINCT  p2.dokument_id,p2.id
          FROM perpanjangan p2
          WHERE p2.status = 2
                      AND p2.tanggal_berlaku_surat >= '${date}'
          ORDER BY p2.id DESC
      ) p2 ON p2.dokument_id = d.id
      WHERE  p.jns_pemakaman = 0
          AND m.deleted = 0
          AND p2.dokument_id IS NOT NULL) AS total`,async function (err, liang_berlaku, fields) {
        connection.query(`SELECT (SELECT COUNT(*) 
        FROM permohonan p
        LEFT JOIN jenazah j ON j.permohonan_id = p.id
        LEFT JOIN dokument d ON d.jenazah_id = j.id
        LEFT JOIN makam m ON m.id = j.makam_id
        LEFT JOIN (
            SELECT DISTINCT  p2.dokument_id,p2.id
            FROM perpanjangan p2
            WHERE p2.status = 2
            AND p2.tanggal_berlaku_surat < '${date}'
            ORDER BY p2.id DESC
        ) p2 ON p2.dokument_id = d.id
         left join master_makam mm on mm.id = m.master_makam_id WHERE mm.kategori_tpu =0 and  m.status_makam = 2
            AND p.jns_pemakaman = 0
            AND m.deleted = 0
            AND p2.dokument_id IS NOT NULL ${x})+(SELECT count(*) as total FROM makam_tambahan mt left join makam m on m.id = mt.makam_id  left join jenazah j on j.makam_id = mt.id and j.kategori_tpu = 1
left join permohonan p on p.jenazah_id = j.id and p.deleted = 0
left join dokument d on d.jenazah_id = j.id and d.deleted = 0 
      LEFT JOIN (
          SELECT DISTINCT  p2.dokument_id,p2.id
          FROM perpanjangan p2
          WHERE p2.status = 2
                      AND p2.tanggal_berlaku_surat < CURRENT_DATE()
          ORDER BY p2.id DESC
      ) p2 ON p2.dokument_id = d.id
      WHERE  p.jns_pemakaman = 0
          AND m.deleted = 0
          AND p2.dokument_id IS NOT NULL) AS total`,async function (err, liang_kadaluarsa, fields) {         
              res.json( {
                liang_kosong,liang_isi,
                liang_berlaku,
                liang_kadaluarsa,luas:luas[0][0].luas
              })
            })
          })
        })
      })
})
app.get('/api/permohonan', cek_login, async function (req, res) {
    let o = '';
    if (req.user[0].is_admin == 0) {
        o += ` and ( m.master_makam_id = ${req.user[0].master_makam_id} or j.tpu= ${req.user[0].master_makam_id}) `;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    try {
        const countResult = await sql_enak.raw(`
            SELECT count(j.id) as jml FROM jenazah j
            LEFT JOIN (SELECT * FROM (SELECT MAX(p.id) as id_p FROM permohonan p WHERE deleted = 0 GROUP BY p.jenazah_id) as p LEFT JOIN permohonan p2 ON p2.id = p.id_p) p ON j.id = p.jenazah_id
            LEFT JOIN dokument d ON d.jenazah_id = j.id
            LEFT JOIN makam m ON m.id = j.makam_id
                left join master_makam mm on mm.id  = j.tpu 
            LEFT JOIN (SELECT * FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id FROM perpanjangan p GROUP BY p.dokument_id) as p LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 ON p2.dokument_id_nya = d.id AND p2.status != 2
            WHERE j.deleted = 0 and j.kategori_tpu =0 AND p.deleted = 0 AND p2.status != 2 AND j.verifikasi_perpanjangan = 0 AND p2.status != 3 AND p.deleted = 0 ${o}`);
        const totalItems = countResult[0][0].jml;
        const totalPages = Math.ceil(totalItems / limit);
          console.log(countResult[0][0].jml,totalItems , limit);
          
        const dataResult = await sql_enak.raw(`
            SELECT *,j.blok as pilihan_blok,j.sub_blok as pilihan_sub_blok,m.nama_tpu as nama_tpu,mm.nama_tpu as pilihan_nama_tpu,
            CASE when p2.status_pembayaran = 0 then 'Belum Dibayar' when p2.status_pembayaran = 1 then 'Sudah Dibayar' END as status_pembayaran,
            CASE when p2.status = 0 then 'Belum Diverifikasi' when p2.status = 1 then (SELECT CONCAT('Revisi')) when p2.status = 2 then 'Disetujui' when p2.status = 3 then 'Dibatalkan' when p2.status = 4 then 'Telah di revisi user' END as status_permohonan,
            DATE_FORMAT(p.inserted , '%d-%m-%Y') as inserted, DATE_FORMAT(j.tanggal_meninggal , '%d-%m-%Y') as tanggal_meninggal, DATE_FORMAT(j.tanggal_dimakamkan , '%d-%m-%Y') as tanggal_dimakamkan, p.id as permohonan_id, m.id as makam_id, j.id as jenazah_id, d.id as dokument_id, p2.id as perpanjangan_id, p.email as email_pemohon
            FROM jenazah j
            LEFT JOIN (SELECT * FROM (SELECT MAX(p.id) as id_p FROM permohonan p WHERE deleted = 0 GROUP BY p.jenazah_id) as p LEFT JOIN permohonan p2 ON p2.id = p.id_p) p ON j.id = p.jenazah_id
            LEFT JOIN dokument d ON d.jenazah_id = j.id
            LEFT JOIN makam m ON m.id = j.makam_id
                left join master_makam mm on mm.id  = j.tpu 
            LEFT JOIN (SELECT * FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id FROM perpanjangan p GROUP BY p.dokument_id) as p LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 ON p2.dokument_id_nya = d.id AND p2.status != 2
            WHERE j.deleted = 0 and j.kategori_tpu =0 AND p.deleted = 0 AND p2.status != 2 AND j.verifikasi_perpanjangan = 0 AND p2.status != 3 AND p.deleted = 0 ${o}
            ORDER BY p.id DESC LIMIT ${limit} OFFSET ${startIndex}
        `);

   res.json({
            data: dataResult[0],
            currentPage: page,
            totalPages: totalPages,
            limit: limit
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
app.get('/api/permohonan_khusus', cek_login, async function (req, res) {
    let o = '';
    if (req.user[0].is_admin == 0) {
        o += ` and j.tpu = ${req.user[0].master_makam_id}`;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    try {
        const countResult = await sql_enak.raw(`
            SELECT count(j.id) as jml FROM jenazah j
            LEFT JOIN (SELECT * FROM (SELECT MAX(p.id) as id_p FROM permohonan p WHERE deleted = 0 GROUP BY p.jenazah_id) as p LEFT JOIN permohonan p2 ON p2.id = p.id_p) p ON j.id = p.jenazah_id
            LEFT JOIN dokument d ON d.jenazah_id = j.id
            LEFT join makam_tambahan mt on mt.id = j.makam_id and mt.deleted = 0
            LEFT JOIN makam m ON m.id = mt.makam_id
            LEFT JOIN (SELECT * FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id FROM perpanjangan p GROUP BY p.dokument_id) as p LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 ON p2.dokument_id_nya = d.id AND p2.status != 2
            WHERE j.deleted = 0 and j.kategori_tpu = 1 AND p.deleted = 0 AND p2.status != 2 AND j.verifikasi_perpanjangan = 0 AND p2.status != 3 AND p.deleted = 0 ${o}
        `);
        const totalItems = countResult[0][0].jml;
        const totalPages = Math.ceil(totalItems / limit);

        const dataResult = await sql_enak.raw(`
            SELECT *,j.blok as pilihan_blok,j.sub_blok as pilihan_sub_blok,m.nama_tpu as nama_tpu,mm.nama_tpu as pilihan_nama_tpu,m.id as makam_tambahan_id,j.makam_id as makam_jenazah_id , 
            CASE when p2.status_pembayaran = 0 then 'Belum Dibayar' when p2.status_pembayaran = 1 then 'Sudah Dibayar' END as status_pembayaran,
            CASE when p2.status = 0 then 'Belum Diverifikasi' when p2.status = 1 then (SELECT CONCAT('Revisi')) when p2.status = 2 then 'Disetujui' when p2.status = 3 then 'Dibatalkan' when p2.status = 4 then 'Telah di revisi user' END as status_permohonan,
            DATE_FORMAT(p.inserted , '%d-%m-%Y') as inserted, DATE_FORMAT(j.tanggal_meninggal , '%d-%m-%Y') as tanggal_meninggal, DATE_FORMAT(j.tanggal_dimakamkan , '%d-%m-%Y') as tanggal_dimakamkan, p.id as permohonan_id, m.id as makam_id, j.id as jenazah_id, d.id as dokument_id, p2.id as perpanjangan_id, p.email as email_pemohon
            FROM jenazah j
            LEFT JOIN (SELECT * FROM (SELECT MAX(p.id) as id_p FROM permohonan p WHERE deleted = 0 GROUP BY p.jenazah_id) as p LEFT JOIN permohonan p2 ON p2.id = p.id_p) p ON j.id = p.jenazah_id
            LEFT JOIN dokument d ON d.jenazah_id = j.id
            LEFT join makam_tambahan mt on mt.id = j.makam_id and mt.deleted = 0
            LEFT JOIN makam m ON m.id = mt.makam_id
            left join master_makam mm on mm.id = j.tpu
            LEFT JOIN (SELECT * FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id FROM perpanjangan p GROUP BY p.dokument_id) as p LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 ON p2.dokument_id_nya = d.id AND p2.status != 2
            WHERE j.deleted = 0  and j.kategori_tpu = 1  AND p.deleted = 0 AND p2.status != 2 AND j.verifikasi_perpanjangan = 0 AND p2.status != 3 AND p.deleted = 0 ${o}
            ORDER BY p.id DESC LIMIT ${limit} OFFSET ${startIndex}
        `);


        res.json({
            data: dataResult[0],
            currentPage: page,
            totalPages: totalPages,
            limit: limit
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Rute API untuk Perpanjangan
app.get('/api/perpanjangan_khusus', cek_login, async function (req, res) {
    let o = '';
    if (req.user[0].is_admin == 0) {
        o += ` and m.master_makam_id  = ${req.user[0].master_makam_id}`;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    try {
        const countResult = await sql_enak.raw(`
            SELECT count(j.id) as jml FROM jenazah j
            LEFT JOIN (SELECT * FROM (SELECT MAX(p.id) as id_p FROM permohonan p WHERE deleted = 0 GROUP BY p.jenazah_id) as p LEFT JOIN permohonan p2 ON p2.id = p.id_p) p ON j.id = p.jenazah_id
            LEFT JOIN dokument d ON d.jenazah_id = j.id
            LEFT join makam_tambahan mt on mt.id = j.makam_id and mt.deleted = 0
            LEFT JOIN makam m ON m.id = mt.makam_id
            LEFT JOIN (SELECT * FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id FROM perpanjangan p GROUP BY p.dokument_id) as p LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 ON p2.dokument_id_nya = d.id
            WHERE j.deleted = 0   and j.kategori_tpu = 1  AND p.deleted = 0 AND j.verifikasi_perpanjangan = 1 ${o} AND p.id = p2.permohonan_id
        `);
        const totalItems = countResult[0][0].jml;
        const totalPages = Math.ceil(totalItems / limit);

        const dataResult = await sql_enak.raw(`
            SELECT *,j.blok as pilihan_blok,j.sub_blok as pilihan_sub_blok,m.nama_tpu as nama_tpu,mm.nama_tpu as pilihan_nama_tpu,m.id as makam_tambahan_id,j.makam_id as makam_jenazah_id , 
             NOW() > p2.tanggal_berlaku_surat as kadaluarsa,
            CASE when p2.status_pembayaran = 0 then 'Belum Dibayar' when p2.status_pembayaran = 1 then 'Sudah Dibayar' END as status_pembayaran,
            DATE_FORMAT(p2.tanggal_surat, '%d-%m-%Y') as tanggal_surat, DATE_FORMAT(p2.tanggal_berlaku_surat, '%d-%m-%Y') as tanggal_berlaku_surat,
            DATE_FORMAT(p.inserted, '%d-%m-%Y') as inserted, DATE_FORMAT(j.tanggal_daftar_perpanjangan, '%d-%m-%Y') as tanggal_daftar_perpanjangan,
            DATE_FORMAT(j.tanggal_meninggal, '%d-%m-%mY') as tanggal_meninggal, DATE_FORMAT(j.tanggal_dimakamkan, '%d-%m-%Y') as tanggal_dimakamkan,
            p.id as permohonan_id, j.id as jenazah_id, d.id as dokument_id, p2.id as perpanjangan_id, p.email as email_pemohon
            FROM jenazah j
            LEFT JOIN (SELECT * FROM (SELECT MAX(p.id) as id_p FROM permohonan p WHERE deleted = 0 GROUP BY p.jenazah_id) as p LEFT JOIN permohonan p2 ON p2.id = p.id_p) p ON j.id = p.jenazah_id
            LEFT JOIN dokument d ON d.jenazah_id = j.id
            LEFT join makam_tambahan mt on mt.id = j.makam_id and mt.deleted = 0
            LEFT JOIN makam m ON m.id = mt.makam_id
                        left join master_makam mm on mm.id = j.tpu
            LEFT JOIN (SELECT * FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id FROM perpanjangan p GROUP BY p.dokument_id) as p LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 ON p2.dokument_id_nya = d.id
            WHERE j.deleted = 0   and j.kategori_tpu = 1  AND p.deleted = 0 AND j.verifikasi_perpanjangan = 1 ${o} AND p.id = p2.permohonan_id
            ORDER BY p.id DESC LIMIT ${limit} OFFSET ${startIndex}
        `);

        res.json({
            data: dataResult[0],
            currentPage: page,
            totalPages: totalPages,
            limit: limit
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
app.get('/api/perpanjangan', cek_login, async function (req, res) {
    let o = '';
    if (req.user[0].is_admin == 0) {
        o += ` and m.master_makam_id = ${req.user[0].master_makam_id}`;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    try {
        const countResult = await sql_enak.raw(`
            SELECT count(j.id) as jml FROM jenazah j
            LEFT JOIN (SELECT * FROM (SELECT MAX(p.id) as id_p FROM permohonan p WHERE deleted = 0 GROUP BY p.jenazah_id) as p LEFT JOIN permohonan p2 ON p2.id = p.id_p) p ON j.id = p.jenazah_id
            LEFT JOIN dokument d ON d.jenazah_id = j.id
            LEFT JOIN makam m ON m.id = j.makam_id
            LEFT JOIN (SELECT * FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id FROM perpanjangan p GROUP BY p.dokument_id) as p LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 ON p2.dokument_id_nya = d.id
            WHERE j.deleted = 0 AND p.deleted = 0 AND j.verifikasi_perpanjangan = 1 ${o} AND p.id = p2.permohonan_id
        `);
        const totalItems = countResult[0][0].jml;
        const totalPages = Math.ceil(totalItems / limit);

        const dataResult = await sql_enak.raw(`
            SELECT *,j.blok as pilihan_blok,j.sub_blok as pilihan_sub_blok,m.nama_tpu as nama_tpu,mm.nama_tpu as pilihan_nama_tpu,
             NOW() > p2.tanggal_berlaku_surat as kadaluarsa,
            CASE when p2.status_pembayaran = 0 then 'Belum Dibayar' when p2.status_pembayaran = 1 then 'Sudah Dibayar' END as status_pembayaran,
            DATE_FORMAT(p2.tanggal_surat, '%d-%m-%Y') as tanggal_surat, DATE_FORMAT(p2.tanggal_berlaku_surat, '%d-%m-%Y') as tanggal_berlaku_surat,
            DATE_FORMAT(p.inserted, '%d-%m-%Y') as inserted, DATE_FORMAT(j.tanggal_daftar_perpanjangan, '%d-%m-%Y') as tanggal_daftar_perpanjangan,
            DATE_FORMAT(j.tanggal_meninggal, '%d-%m-%mY') as tanggal_meninggal, DATE_FORMAT(j.tanggal_dimakamkan, '%d-%m-%Y') as tanggal_dimakamkan,
            p.id as permohonan_id, j.id as jenazah_id, d.id as dokument_id, p2.id as perpanjangan_id, p.email as email_pemohon
            FROM jenazah j
            LEFT JOIN (SELECT * FROM (SELECT MAX(p.id) as id_p FROM permohonan p WHERE deleted = 0 GROUP BY p.jenazah_id) as p LEFT JOIN permohonan p2 ON p2.id = p.id_p) p ON j.id = p.jenazah_id
            LEFT JOIN dokument d ON d.jenazah_id = j.id
            LEFT JOIN makam m ON m.id = j.makam_id
                        left join master_makam mm on mm.id = j.tpu
            LEFT JOIN (SELECT * FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id FROM perpanjangan p GROUP BY p.dokument_id) as p LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 ON p2.dokument_id_nya = d.id
            WHERE j.deleted = 0 AND p.deleted = 0 AND j.verifikasi_perpanjangan = 1 ${o} AND p.id = p2.permohonan_id
            ORDER BY p.id DESC LIMIT ${limit} OFFSET ${startIndex}
        `);

        res.json({
            data: dataResult[0],
            currentPage: page,
            totalPages: totalPages,
            limit: limit
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
app.get('/backoffice_khusus', cek_login,async function (req, res) {
  let data = await sql_enak.raw(` select * from master_makam mm where mm.id = ${req.user[0].master_makam_id}`)
  console.log(req.user[0]);
     
  if (req.user[0].is_admin ==1) {
     res.render('content-backoffice/index_khusus', {
        // Hanya mengirim data yang dibutuhkan untuk halaman awal
        user: req.user[0] 
    });
    }else  if (data[0][0].kategori_tpu==1) {
     res.render('content-backoffice/index_khusus', {
        // Hanya mengirim data yang dibutuhkan untuk halaman awal
        user: req.user[0] 
    });
  }else{
    res.redirect(`/backoffice`)
  }
     
  })
app.get('/backoffice', cek_login,async function (req, res) {
    let data = await sql_enak.raw(` select * from master_makam mm where mm.id = ${req.user[0].master_makam_id}`)
    if (req.user[0].is_admin !=0) {
              res.render('content-backoffice/index', {
        // Hanya mengirim data yang dibutuhkan untuk halaman awal
        user: req.user[0] 
    });
    }else  if (data[0][0].kategori_tpu!=1) {
        res.render('content-backoffice/index', {
        // Hanya mengirim data yang dibutuhkan untuk halaman awal
        user: req.user[0] 
    });
  }else{
    res.redirect(`/backoffice_khusus`)
  }
 
//   let o = ''
//   if (req.user[0].is_admin==0) {
//     o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
//   }
  
// let count_permohonan = await sql_enak.raw(`
// SELECT count(j.id) as jml from jenazah j 
//    LEFT JOIN (SELECT *
//     FROM (SELECT  MAX(p.id) as id_p
//           FROM permohonan p  where deleted = 0   GROUP BY p.jenazah_id) as p
//     LEFT JOIN permohonan p2 ON p2.id = p.id_p) p   on j.id = p.jenazah_id 
//   LEFT JOIN dokument d on d.jenazah_id = j.id 
//   LEFT join makam m on m.id = j.makam_id 
//   LEFT JOIN (SELECT *
//     FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id
//           FROM perpanjangan p     GROUP BY p.dokument_id) as p
//     LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 on p2.dokument_id_nya = d.id AND p2.status != 2  WHERE  j.deleted = 0  AND p.deleted = 0  AND p2.status != 2 and j.verifikasi_perpanjangan = 0 and p2.status !=3 and p.deleted = 0  ${o}  order by p.id desc`)
//   let count_perpanjangan = await sql_enak.raw(`SELECT count(j.id) as jml
//           from  jenazah j  LEFT JOIN (SELECT *
//     FROM (SELECT  MAX(p.id) as id_p
//           FROM permohonan p  where deleted = 0   GROUP BY p.jenazah_id) as p
//     LEFT JOIN permohonan p2 ON p2.id = p.id_p) p   on j.id = p.jenazah_id    LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN (SELECT *
//     FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id
//     FROM perpanjangan p     GROUP BY p.dokument_id) as p
// LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 on p2.dokument_id_nya = d.id   WHERE  j.deleted = 0  AND  p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}  and p.id = p2.permohonan_id  order by p.id desc `)

// const allPermohonan =count_permohonan[0][0].jml
// const allPerpanjangan = count_perpanjangan[0][0].jml
//    const pagePermohonan = parseInt(req.query.page_permohonan) || 1;
//     const limitPermohonan = parseInt(req.query.limit_permohonan) ||2; // Tentukan jumlah item per halaman
//     const startIndexPermohonan = (pagePermohonan - 1) * limitPermohonan;
//     const endIndexPermohonan = pagePermohonan * limitPermohonan;

//     const totalPermohonan =parseInt(allPermohonan);
//     const totalPagesPermohonan = Math.ceil(totalPermohonan / limitPermohonan);
//       let permohonan = await sql_enak.raw(`
// SELECT *,CASE 
//   when p2.status_pembayaran = 0  then 'Belum Dibayar'
//   when p2.status_pembayaran = 1  then 'Sudah Dibayar'
//   END as status_pembayaran
//   ,CASE 
//   when p2.status  = 0  then 'Belum Diverifikasi'
//   when p2.status  = 1  then (SELECT CONCAT('Revisi')) 
//   when p2.status  = 2  then 'Disetujui'
//   when p2.status  = 3  then 'Dibatalkan'
//   when p2.status  = 4  then 'Telah di revisi user'
//   END as status_permohonan
//   ,DATE_FORMAT(p.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id ,m.id as makam_id, j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id,  p.email as email_pemohon 
//   from jenazah j 
//    LEFT JOIN (SELECT *
//     FROM (SELECT  MAX(p.id) as id_p
//           FROM permohonan p  where deleted = 0   GROUP BY p.jenazah_id) as p
//     LEFT JOIN permohonan p2 ON p2.id = p.id_p) p   on j.id = p.jenazah_id 
//   LEFT JOIN dokument d on d.jenazah_id = j.id 
//   LEFT join makam m on m.id = j.makam_id 
//   LEFT JOIN (SELECT *
//     FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id
//           FROM perpanjangan p     GROUP BY p.dokument_id) as p
//     LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 on p2.dokument_id_nya = d.id AND p2.status != 2  WHERE  j.deleted = 0  AND p.deleted = 0  AND p2.status != 2 and j.verifikasi_perpanjangan = 0 and p2.status !=3 and p.deleted = 0  ${o}  order by p.id desc limit ${limitPermohonan} offset ${startIndexPermohonan}`)
  
//     // --- Logika untuk Perpanjangan (jika ada) ---
//     const pagePerpanjangan = parseInt(req.query.page_perpanjangan) || 1;
//     const limitPerpanjangan = parseInt(req.query.limit_perpanjangan) ||2;
//     const startIndexPerpanjangan = (pagePerpanjangan - 1) * limitPerpanjangan;
//     const endIndexPerpanjangan = pagePerpanjangan * limitPerpanjangan;

//     const totalPerpanjangan = parseInt(allPerpanjangan);
//     const totalPagesPerpanjangan = Math.ceil(totalPerpanjangan / limitPerpanjangan);
// let perpanjangan = await sql_enak.raw(`SELECT *,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
//   when p2.status_pembayaran = 0  then 'Belum Dibayar'
//   when p2.status_pembayaran = 1  then 'Sudah Dibayar'
//   END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
//   ,DATE_FORMAT(p.inserted , '%d-%m-%Y') as inserted,DATE_FORMAT(j.tanggal_daftar_perpanjangan , '%d-%m-%Y') as tanggal_daftar_perpanjangan  ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id ,p2.id as perpanjangan_id ,  p.email as email_pemohon 
//   from  jenazah j  LEFT JOIN (SELECT *
//     FROM (SELECT  MAX(p.id) as id_p
//           FROM permohonan p  where deleted = 0   GROUP BY p.jenazah_id) as p
//     LEFT JOIN permohonan p2 ON p2.id = p.id_p) p   on j.id = p.jenazah_id    LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN (SELECT *
//     FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id
//     FROM perpanjangan p     GROUP BY p.dokument_id) as p
// LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 on p2.dokument_id_nya = d.id   WHERE  j.deleted = 0  AND  p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}  and p.id = p2.permohonan_id  order by p.id desc  limit ${limitPerpanjangan} offset ${startIndexPerpanjangan}`)

//   res.render('content-backoffice/index',{
//         permohonan: permohonan[0],
//         perpanjangan: perpanjangan[0],
//         // Data untuk permohonan
//         currentPagePermohonan: pagePermohonan,
//         totalPagesPermohonan: totalPagesPermohonan,
//         limitPermohonan: limitPermohonan,
//         // Data untuk perpanjangan
//         currentPagePerpanjangan: pagePerpanjangan,
//         totalPagesPerpanjangan: totalPagesPerpanjangan,
//         limitPerpanjangan: limitPerpanjangan
//     });
});
app.get('/getCount',cek_login,async function (req,res) {
  let o = ''
  let o2 = ''
  let o3 = ''
if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
    o2+=` and  m.id = ${req.user[0].master_makam_id}`
    o3+= `  and j.tpu = ${req.user[0].master_makam_id}  `
  }
  let sql_a = `SELECT count(*) as count from  jenazah j  left join makam_tambahan mt on mt.id = j.makam_id and mt.deleted =0
  left join makam m on m.id = mt.makam_id 
  left join permohonan p on j.id = p.jenazah_id   and p.deleted = 0
  LEFT JOIN dokument d on d.jenazah_id = j.id  and d.deleted = 0
  LEFT JOIN master_makam mm ON mm.id = j.tpu
  AND mm.deleted = 0
    LEFT JOIN kecamatan k5 ON k5.id_kecamatan = mm.id_kec 
      left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0`
  let sql_b = `) as  p2 on p2.dokument_id =d.id   `
  let sql_non_aktif_khusus = `${sql_a} and x2.status !=2 ${sql_b}`
   let sql_aktif_khusus = `${sql_a} and x2.status =2 ${sql_b}`
let permohonan_tumpang_khusus = await sql_enak.raw(`${sql_non_aktif_khusus}
WHERE p.jns_pemakaman =  4 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1  AND p2.status != 2 and j.verifikasi_perpanjangan = 0 and p.deleted = 0     and p.id = p2.permohonan_id  ${o3}  order by p.id desc`)
  
let permohonan_khusus = await sql_enak.raw(`${sql_non_aktif_khusus}
WHERE p.jns_pemakaman =  0 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1  AND p2.status != 2 and j.verifikasi_perpanjangan = 0 and p.deleted = 0     and p.id = p2.permohonan_id  ${o3}  order by p.id desc`)
let perpanjangan_pemakaman_khusus = await sql_enak.raw(`${sql_non_aktif_khusus}
WHERE p.jns_pemakaman =  0 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1  AND p2.status != 2 and j.verifikasi_perpanjangan = 1 and p.deleted = 0 ${o}    and p.id = p2.permohonan_id  order by p.id desc`) 
console.log(`${sql_non_aktif_khusus}
WHERE p.jns_pemakaman =  0 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1  AND p2.status != 2 and j.verifikasi_perpanjangan = 1 and p.deleted = 0 ${o}    and p.id = p2.permohonan_id  order by p.id desc`) 

let perpanjangan_pemakaman_tumpang_khusus = await sql_enak.raw(`${sql_non_aktif_khusus}
WHERE p.jns_pemakaman =  4 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1  AND p2.status != 2 and j.verifikasi_perpanjangan = 1 and p.deleted = 0 ${o}    and p.id = p2.permohonan_id  order by p.id desc`) 
  let ijin_permohonan_tumpang_khusus = await sql_enak.raw(`${sql_aktif_khusus}
WHERE p.jns_pemakaman =  4 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1  AND p2.status = 2  and p.deleted = 0     and p.id = p2.permohonan_id  ${o}  order by p.id desc`)
  let ijin_permohonan_khusus = await sql_enak.raw(`${sql_aktif_khusus}
WHERE p.jns_pemakaman =  0 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1  AND p2.status = 2  and p.deleted = 0     and p.id = p2.permohonan_id  ${o}  order by p.id desc`)
let ijin_perpanjangan_pemakaman_khusus = await sql_enak.raw(`${sql_aktif_khusus}
WHERE p.jns_pemakaman =  0 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1  AND p2.status = 2 and (j.verifikasi_perpanjangan =2 or p2.status_perpanjangan = 1)   and p.deleted = 0 ${o}    and p.id = p2.permohonan_id  order by p.id desc`) 
let ijin_perpanjangan_pemakaman_tumpang_khusus = await sql_enak.raw(`${sql_aktif_khusus}
WHERE p.jns_pemakaman =  4 and j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1  AND p2.status = 2 and (j.verifikasi_perpanjangan =2 or p2.status_perpanjangan = 1)   and p.deleted = 0 ${o}    and p.id = p2.permohonan_id  order by p.id desc`) 

let q = `SELECT COUNT(*) as count from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join master_makam m on m.id = j.tpu LEFT JOIN   (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
 AND p2.status != 2  WHERE p.jns_pemakaman =  0 and j.kategori_tpu = 0  and j.deleted = 0  and p.deleted = 0  AND p2.status != 2 and j.verifikasi_perpanjangan = 0  and j.deleted = 0  and p.deleted = 0 ${o2}  and p2.status !=3  and p.id = p2.permohonan_id  order by p.id desc `
let permohonan = await sql_enak.raw(q) ;
  let permohonan_tumpang = await sql_enak.raw(`SELECT COUNT(*) as count  from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN   (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
 AND p2.status != 2   WHERE p.jns_pemakaman =  4  and j.deleted = 0  and p.deleted = 0  AND p2.status != 2 and j.verifikasi_perpanjangan = 0   and j.deleted = 0  and p.deleted = 0 ${o}  and p2.status !=3   and p.id = p2.permohonan_id  order by p.id desc`)
  let perijinan = await sql_enak.raw(`SELECT COUNT(*) as count   from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id 
LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
  LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman = 0 and j.kategori_tpu = 0 and p.deleted = 0 and j.deleted = 0 and p2.status = 2  and p.id = p2.permohonan_id  and p.deleted = 0 ${o} order by p.id desc`)
  let perijinan_tumpang = await sql_enak.raw(`SELECT COUNT(*) as count from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id 
LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
   perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
 LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman = 4 and  j.kategori_tpu = 0   and p.deleted = 0 and p2.status != 0  and p.id = p2.permohonan_id   and j.deleted = 0 and p.deleted = 0 ${o} order by p.id desc `)
  let perijinan_pesan = await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
   LEFT join makam m on m.id = j.makam_id WHERE p.jns_pemakaman =  2  and j.deleted = 0  and p.deleted = 0 and p2.status = 2   and j.deleted = 0  and p.deleted = 0 ${o}   and p2.status !=3  and p.id = p2.permohonan_id  order by p.id desc`)
  let perpanjangan =  await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id    LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN   (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
   WHERE p.jns_pemakaman =  0  and j.deleted = 0  and p.deleted = 0  and j.verifikasi_perpanjangan =1 ${o}   and p.id = p2.permohonan_id   and p2.status =0 order by p.id desc`)
  let perpanjangan_tumpang =  await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id    LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN   (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
   WHERE p.jns_pemakaman =  4  and j.deleted = 0  and p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}    and p.id = p2.permohonan_id  and  p2.status =0 order by p.id desc`)
  let perpanjangan_pesan =  await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id    LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN   (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
   WHERE p.jns_pemakaman =  2  and j.deleted = 0  and p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}    and p.id = p2.permohonan_id  and p2.status !=3 order by p.id desc`)
    let izin_perpanjangan_makam = await sql_enak.raw(`select count(*) as count from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id  LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman =  0  and j.kategori_tpu = 0  ${o} and p.deleted = 0 and p2.status = 2  and (j.verifikasi_perpanjangan =2 or p2.status_perpanjangan = 1)   and p.id = p2.permohonan_id   and j.deleted = 0 and p.deleted = 0 order by p.id desc `)
  let izin_perpanjangan_tumpang = await sql_enak.raw(`SELECT count(*) as count from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id  LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman =  4  and j.kategori_tpu = 0  ${o} and p.deleted = 0 and p2.status = 2  and (j.verifikasi_perpanjangan =2 or p2.status_perpanjangan = 1)   and p.id = p2.permohonan_id   and j.deleted = 0 and p.deleted = 0 order by p.id desc `)
 
  let izin_pesan_tempat = await sql_enak.raw(`SELECT count(*) as count from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
  LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman =  2 and p.deleted = 0 and p2.status = 2  and (j.verifikasi_perpanjangan =2 or p2.status_perpanjangan = 1)  and p2.status !=3  and p.id = p2.permohonan_id ${o} and p.deleted = 0 order by p.id desc`)
  res.json({ijin_permohonan_tumpang_khusus:ijin_permohonan_tumpang_khusus[0],
ijin_permohonan_khusus:ijin_permohonan_khusus[0],
ijin_perpanjangan_pemakaman_khusus:ijin_perpanjangan_pemakaman_khusus[0],
ijin_perpanjangan_pemakaman_tumpang_khusus:ijin_perpanjangan_pemakaman_tumpang_khusus[0],perpanjangan_pemakaman_khusus:perpanjangan_pemakaman_khusus[0],perpanjangan_pemakaman_tumpang_khusus:perpanjangan_pemakaman_tumpang_khusus[0],permohonan_tumpang_khusus:permohonan_tumpang_khusus[0],permohonan_khusus:permohonan_khusus[0],izin_perpanjangan_makam:izin_perpanjangan_makam[0],izin_perpanjangan_tumpang:izin_perpanjangan_tumpang[0],izin_pesan_tempat:izin_pesan_tempat[0],perpanjangan_pesan:perpanjangan_pesan[0],perijinan_pesan:perijinan_pesan[0],perpanjangan:perpanjangan[0],perpanjangan_tumpang:perpanjangan_tumpang[0],permohonan:permohonan[0],permohonan_tumpang:permohonan_tumpang[0],perijinan:perijinan[0],perijinan_tumpang:perijinan_tumpang[0]})
})

app.use(`/update_status_permohonan`,cek_login,async function (req,res) {
  let perpanjangan ={status:req.body.status, catatan_revisi:req.body.catatan_revisi}
  let {jenazah_id ,perpanjangan_id,email_pemohon,dokument_id,makam_id ,tpu,pilihan_blok,pilihan_sub_blok} = req.body
  let hp = req.body.hp
  console.log(req.body);
    let text_email = ''
  let subject_email = ''

  delete perpanjangan.hp
  delete perpanjangan.dokument_id
  delete perpanjangan.email_pemohon
  delete perpanjangan.perpanjangan_id
  delete perpanjangan.jenazah_id
   if (req.body.status=='1') {
    text_email = `Silahkan lengkapi persyaratan permohonan ijin anda melalui link berikut ini : "https://makam.semarangkota.go.id/revisi_dokumen/${dokument_id}"`
    subject_email = 'Permohonan ijin direvisi'
  }else   if (req.body.status=='2') {
      let q = `SELECT m.id from makam m WHERE  m.deleted = 0  and m.master_makam_id ='${tpu}'  and m.blok ='${pilihan_blok}' and m.sub_blok = '${pilihan_sub_blok}'  `
    let cek_makam = await sql_enak.raw(q)
    console.log(cek_makam[0]);
    console.log(cek_makam[0].length>0,(makam_id==0||makam_id==null||makam_id==undefined||!makam_id),makam_id==0,makam_id==null,makam_id=='null',makam_id==undefined,!makam_id);
    
    if(cek_makam[0].length>0&&(makam_id==0||makam_id==null||makam_id==undefined||!makam_id||makam_id=='null')){
          let data = await sql_enak.insert({makam_id:cek_makam[0][0].id,status_makam:2, jumlah_jenazah:1, status_tumpang:0, }).into('makam_tambahan')
         makam_id=data[0]
      console.log(makam_id,'makam_id');
  
        }
              console.log(req.body,makam_id,'makam_id');

              await sql_enak("jenazah")
    .where("id", "=",jenazah_id)
    .update({makam_id})
        console.log(req.body.jns_pemakaman ,req.body.jns_pemakaman==4,req.body.jns_pemakaman==0 );
        
    if (req.body.jns_pemakaman==0) {
      subject_email = 'Permohonan ijin penggunaan tanah makam/pemakaman jenazah disetujui'
      text_email = `Permohonnan ijin penggunaan tanah makam/pemakaman jenazah anda telah disetujui oleh pengelola TPU, silahkan melakukan pemakaman jenazah sesuai dengan permohonan yang telah setujui ini. Untuk Surat Keputusan (SK) ijin penggunaan tanah makam/pemakaman jenazah akan kami kirimkan melalui email ini.`

    }else  if (req.body.jns_pemakaman==4) {
      subject_email = 'Permohonan ijin pemakaman tumpang disetujui'
      text_email = `Permohonan ijin pemakaman tumpang anda telah disetujui oleh pengelola TPU, silahkan melakukan pemakaman jenazah tumpang sesuai dengan permohonan yang telah setujui ini. Untuk Surat Keputusan (SK) ijin pemakaman tumpang akan kami kirimkan melalui email ini.`
    }
    

  }else   if (req.body.status=='3') {
    text_email = `Permohonan ijin dibatalkan`
    subject_email = 'Permohonan ijin anda dibatalkan'

  }
  if (req.body.status == '3') {
    await sql_enak("jenazah")
    .where("id", "=",jenazah_id)
    .update({deleted :1})
    await sql_enak("makam")
    .where("id", "=",makam_id)
    .update({status_makam :0})
  }else{
    console.log({id:req.body.jenazah_id,deleted :0});
    
    await sql_enak("jenazah")
    .where("id", "=", req.body.jenazah_id)
    .update({deleted :0})
  }
  await sql_enak("perpanjangan")
  .where("id", "=", perpanjangan_id)
  .update(perpanjangan)

 
    let hasilWa =await kirimWa(hp,text_email)
    // console.log(hasilWa);

  let mailOption = {
    from: 'noreply@survplus.id',
    to: email_pemohon,
    subject: subject_email,
    text: text_email
  }
// kirimEmail(email_pemohon,subject_email,text_email)
  transporter.sendMail(mailOption, (err, data) => {
    if (err) {
      console.log(err, 'error!');
    } else {
      console.log('sukses!');
    }
  })
  if (req.body.tujuan) {
      res.redirect(req.body.tujuan)

  }else{
  res.redirect('/backoffice')

  }
})
app.use(`/update_status`,cek_login,async function (req,res) {
  let perpanjangan =req.body
  let perpanjangan_id =  req.body.perpanjangan_id
  let jns_pemakaman =  req.body.jns_pemakaman
  let id = await sql_enak.raw(` SELECT j.*  from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id ORDER by p3.id DESC  LIMIT 1)   WHERE p2.id = ${perpanjangan_id}   `)
  delete perpanjangan.perpanjangan_id
  let email_pemohon = req.body.email_pemohon
  let hp = req.body.hp
  delete perpanjangan.email_pemohon
  delete perpanjangan.hp
  delete perpanjangan.jns_pemakaman

  await sql_enak("perpanjangan")
  .where("id", "=", perpanjangan_id)
  .update(perpanjangan)
  if (req.body.status == 3 ) {
    await sql_enak("jenazah")
    .where("id", "=", id[0][0].id)
    .update({verifikasi_perpanjangan:0, tanggal_daftar_perpanjangan :null})
  }else if (req.body.status == 2 ) {
    await sql_enak("jenazah")
    .where("id", "=", id[0][0].id)
    .update({verifikasi_perpanjangan:req.body.status})
  }


  let text_email = ''
  let subject_email = ''
  if (req.body.status=='1') {
    text_email = `Silahkan lengkapi persyaratan permohonan ijin anda melalui link berikut ini : "https://makam.semarangkota.go.id/revisi_dokumen/${req.body.dokument_id}"`
    subject_email = 'Permohonan ijin direvisi'
  }else   if (req.body.status=='2') {

    if (jns_pemakaman==0) {
      subject_email = 'Permohonan perpanjangan ijin penggunaan tanah makam disetujui'
      text_email = `Permohonan perpanjangan ijin penggunaan tanah makam anda telah disetujui oleh pengelola TPU. Untuk Surat Keputusan (SK) perpanjangan ijin penggunaan tanah makam akan kami kirimkan melalui email ini.`

    }else  if (jns_pemakaman==4){
      subject_email = 'Permohonan perpanjangan ijin pemakaman tumpang disetujui'
      text_email = `Permohonan perpanjangan ijin pemakaman tumpang anda telah disetujui oleh pengelola TPU. Untuk Surat Keputusan (SK) perpanjangan ijin pemakaman tumpang akan kami kirimkan melalui email ini.`
    }

  }else   if (req.body.status=='3') {
    text_email = `Permohonan ijin dibatalkan`
    subject_email = 'Permohonan ijin anda dibatalkan'

  }
  let mailOption = {
    from: 'noreply@survplus.id',
    // to: 'reikirayuki@gmail.com',
    to: email_pemohon,
    subject: subject_email,
    text: text_email
  }
      // let hasilWa =await kirimWa(hp,text_email)
// console.log(hasilWa);
  transporter.sendMail(mailOption, (err, data) => {
    if (err) {
      console.log(err, 'error!');
    } else {
      console.log('sukses!');
    }
  })
  res.redirect('/backoffice')
})
app.use(`/update_status_khusus`,cek_login,async function (req,res) {
  let {perpanjangan_id,email_pemohon,hp,jns_pemakaman,status,dokument_id,tpu,pilihan_blok,pilihan_sub_blok,makam_id,perpanjangan_ke} =req.body
  console.log(req.body);
  
  let perpanjangan = {status,perpanjangan_ke}
  let id = await sql_enak.raw(` SELECT j.id  from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id ORDER by p3.id DESC  LIMIT 1)   WHERE p2.id = ${perpanjangan_id}   `)

  const sub_blok = await sql_enak.raw(`SELECT m.id,m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 and m.master_makam_id = '${tpu}'  and m.blok =   '${pilihan_blok}'   and m.sub_blok =   '${pilihan_sub_blok}'  `)
  console.log(sub_blok[0]);
  
  await sql_enak("perpanjangan")
  .where("id", "=", perpanjangan_id)
  .update(perpanjangan)
  if (status == 3 ) {
    console.log('  if (status == 3 ) {');
    
    await sql_enak("jenazah")
    .where("id", "=", id[0][0].id)
    .update({verifikasi_perpanjangan:0, tanggal_daftar_perpanjangan :null})
  }else if (status == 2 ) {
    console.log('  }else if (status == 2 ) {');
    
    if (jns_pemakaman == '0') {
      console.log('    if (jns_pemakaman == 0) {');
      
    let q = `SELECT m.id from makam m WHERE  m.deleted = 0  and m.id =   '${makam_id}' `
    let cek_makam = await sql_enak.raw(q)
    if(cek_makam[0].length>0){
      let data = await sql_enak.insert({makam_id:cek_makam[0][0].id,status_makam:2, jumlah_jenazah:1, status_tumpang:0, }).into('makam_tambahan')
       
      console.log(data);

      jenazah.makam_id=data[0]
              }

    }else{
  console.log('    }else{');
  
    if (!makam_id) {
      console.log('    if (!makam_id) {');
      
               let q = `SELECT *  from makam_tambahan m WHERE  m.deleted = 0 and m.id ='${sub_blok[0][0].id}' `
    let cek_makam = await sql_enak.raw(q)
    console.log(cek_makam[0]);
            await sql_enak('makam_tambahan').where('id','=',cek_makam[0][0].id).update({jumlah_jenazah:cek_makam[0][0].jumlah_jenazah++})

    }

  }     
    await sql_enak("jenazah")
    .where("id", "=", id[0][0].id)
    .update({verifikasi_perpanjangan:status})
  }


  let text_email = ''
  let subject_email = ''
  if (status=='1') {
    text_email = `Silahkan lengkapi persyaratan permohonan ijin anda melalui link berikut ini : "https://makam.semarangkota.go.id/revisi_dokumen/${dokument_id}"`
    subject_email = 'Permohonan ijin direvisi'
  }else   if (status=='2') {

    if (jns_pemakaman==0) {
      subject_email = 'Permohonan perpanjangan ijin penggunaan tanah makam disetujui'
      text_email = `Permohonan perpanjangan ijin penggunaan tanah makam anda telah disetujui oleh pengelola TPU. Untuk Surat Keputusan (SK) perpanjangan ijin penggunaan tanah makam akan kami kirimkan melalui email ini.`

    }else  if (jns_pemakaman==4){
      subject_email = 'Permohonan perpanjangan ijin pemakaman tumpang disetujui'
      text_email = `Permohonan perpanjangan ijin pemakaman tumpang anda telah disetujui oleh pengelola TPU. Untuk Surat Keputusan (SK) perpanjangan ijin pemakaman tumpang akan kami kirimkan melalui email ini.`
    }

  }else   if (status=='3') {
    text_email = `Permohonan ijin dibatalkan`
    subject_email = 'Permohonan ijin anda dibatalkan'

  }
  let mailOption = {
    from: 'noreply@survplus.id',
    // to: 'reikirayuki@gmail.com',
    to: email_pemohon,
    subject: subject_email,
    text: text_email
  }
      // let hasilWa =await kirimWa(hp,text_email)
// console.log(hasilWa);
console.log(mailOption,'mailOption');

  transporter.sendMail(mailOption, (err, data) => {
    if (err) {
      console.log(err, 'error!');
    } else {
      console.log('sukses!');
    }
  })
  res.redirect('/backoffice_khusus')
})
app.get(`/getMakamByTgl`,function (req,res) {
  let w = ''
  if (req.query.nama) {
    w += ` and j.nama_jenazah LIKE '%${req.query.nama}%'`
  }
  if (req.query.tanggal) {
    w+=` and j.tanggal_meninggal = (SELECT DATE_FORMAT('${req.query.tanggal}','%Y-%m-%d'))`
  }
  connection.query(`SELECT  nama_tpu,id, (select x(centroid(SHAPE)) from makam where master_makam_id =mm.id limit 1 ) as x, (select y(centroid(SHAPE)) from makam where master_makam_id=mm.id limit 1 ) as y FROM master_makam mm  where mm.deleted = 0 ${w} GROUP by nama_tpu`,async function (err, makam , fields) {
  })
})
app.get(`/getMasterMakam`,async function (req,res) {
  let sql = `SELECT * , (SELECT  count(*) as permohonan_baru  from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id AND p2.status != 2 AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status !=2 ORDER by p3.id DESC  LIMIT 1)    WHERE p.jns_pemakaman =  0 and p.deleted = 0   AND p2.status != 2 and j.verifikasi_perpanjangan = 0 and p.deleted = 0   and p2.status !=3  and p.id = p2.permohonan_id   and mm.id = m.master_makam_id) as permohonan_baru FROM master_makam mm WHERE mm.deleted = ?`
  let val = [0]
  let data = await sql_enak.raw(sql,val)
  res.json({data:data[0]})
})

app.get(`/getJmlJenazahMakamGroup`,async function (req,res) {
  let a = ''
  let val = []
  if (req.query.tahun) {
    a +=` and DATE_FORMAT(j.tanggal_dimakamkan,'%Y')   = ? ` 
    val.push(req.query.tahun)
  }
  let data = await sql_enak.raw(`SELECT COUNT(*) as y , mm.nama_tpu as label   from jenazah j  left join permohonan p on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id 
LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
  LEFT join makam m on m.id = j.makam_id left join master_makam mm on mm.id = m.master_makam_id  LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman = 0 and p.deleted = 0 and p2.status = 2  and p.id = p2.permohonan_id and mm.nama_tpu  is not null  and p.deleted = 0 
 ${a} group by m.master_makam_id `,val)
  res.json({data:data[0]})

})
app.get(`/getJmlJenazahMakamGroupBulanan`,async function (req,res) {
  let tahun = new Date().getFullYear()
  let a = ''
  if (req.query.tahun) {
   tahun = req.query.tahun
  }
  a +=` and DATE_FORMAT(j.tanggal_dimakamkan,'%Y')   = '${tahun}' ` 
  if (req.query.mm) {
    a+= ` and mm.id =${req.query.mm}`
  }
  let arr = []
  let moon = []
  for (let i = 0; i < 12; i++) {
    let date = new Date(`1990-${i+1}-1`)
    moon.push(moment(date).format('MMMM'))
  }
    for (let i = 1; i < 13; i++) {
    let bulan = ''
    if (i<10) {
      bulan ='0'+i

    }else{
      bulan =''+i
    }
    let x = await sql_enak.raw(`SELECT COUNT(*) as y , '${moon[i-1]}' as label FROM master_makam mm left join  makam m on mm.id = m.master_makam_id left join jenazah j on j.makam_id = m.id  WHERE mm.deleted =0  and DATE_FORMAT(j.tanggal_dimakamkan,'%m')   = '${bulan}'  ${a}  `)
    arr.push(x[0][0])

  }
  res.json({data:arr})

})
app.get(`/getPerijinanMakam`,async function (req,res) {
  let date = moment().format('YYYY-MM-DD')
  let a = ''
  if (req.query.mm) {
    a+= ` and mm.id =${req.query.mm}`
  }
  let kadaluarsa = await sql_enak.raw(`SELECT COUNT(*)  as y ,'Ijin Habis' as label FROM permohonan p left join  jenazah j on j.permohonan_id = p.id  left join dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN  (SELECT * FROM perpanjangan p3  ORDER by p3.id DESC ) as p2 on  p2.dokument_id = d.id  and p2.status =2    left join master_makam mm on mm.id = m.master_makam_id   WHERE m.status_makam =2 and p.jns_pemakaman = 0 and m.deleted = 0 and p2.tanggal_berlaku_surat<'${date}' ${a}`)
  let perijinan = await sql_enak.raw(`SELECT COUNT(*) as y ,'Ijin Pemakaman' as label  from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN  (SELECT * FROM perpanjangan p3  ORDER by p3.id DESC ) as p2 on  p2.dokument_id = d.id  and p2.status =2  LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  left join master_makam mm on mm.id = m.master_makam_id  WHERE p.jns_pemakaman =  0 and p.deleted = 0 and p2.status = 2   and p2.status !=3 and p.deleted = 0   and p.id = p2.permohonan_id  and p2.tanggal_berlaku_surat>='${date}'  ${a}`)
  let perijinan_tumpang = await sql_enak.raw(`SELECT COUNT(*) as y  ,'Ijin Pemakaman Tumpang' as label from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN  (SELECT * FROM perpanjangan p3  ORDER by p3.id DESC ) as p2 on  p2.dokument_id = d.id  and p2.status =2  LEFT join makam m on m.id = j.makam_id  left join master_makam mm on mm.id = m.master_makam_id  WHERE p.jns_pemakaman =  4 and p.deleted = 0 and p2.status = 2  and p.deleted = 0   and p2.status !=3  and p.id = p2.permohonan_id  and p2.tanggal_berlaku_surat>='${date}'  ${a}`)
  let perijinan_pesan = await sql_enak.raw(`SELECT COUNT(*) as y ,'Ijin Pesan Tempat' as label  from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN  (SELECT * FROM perpanjangan p3  ORDER by p3.id DESC ) as p2 on  p2.dokument_id = d.id  and p2.status =2  LEFT join makam m on m.id = j.makam_id  left join master_makam mm on mm.id = m.master_makam_id  WHERE p.jns_pemakaman =  2 and p.deleted = 0 and p2.status = 2  and p.deleted = 0   and p2.status !=3  and p.id = p2.permohonan_id  and p2.tanggal_berlaku_surat>='${date}'  ${a}`)
  res.json([kadaluarsa[0][0],perijinan[0][0],perijinan_tumpang[0][0],perijinan_pesan[0][0]]);
})
app.get('/getRetribusi',async function (req,res) {
  let tahun = moment().format('YYYY')
  if (req.query.tahun) {
    tahun = req.query.tahun
  }
  let data = await sql_enak.raw(`SELECT SUM(mr.retribusi) as y ,mm.nama_tpu as label   from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN  (SELECT * FROM perpanjangan p3  ORDER by p3.id DESC ) as p2 on  p2.dokument_id = d.id  and p2.status =2   LEFT join makam m on m.id = j.makam_id left join master_makam mm on mm.id =m.master_makam_id  LEFT JOIN master_retribusi mr on mr.jenis  = p.jns_pemakaman  WHERE   p.deleted = 0   and p2.status =2  and p.id = p2.permohonan_id  and p2.status_pembayaran =1  and  DATE_FORMAT(p2.tanggal_surat,'%Y') = '${tahun}'  GROUP  by mm.nama_tpu`)
  res.json({data:data[0]})
})
app.get('/getRetribusiBulanan',async function (req,res) {
  let tahun = moment().format('YYYY')
  if (req.query.tahun) {
    tahun = req.query.tahun
  }else{
    tahun = new Date().getFullYear()
  }
  let a = ''
  if (req.query.mm) {
    a+= ` and mm.id =${req.query.mm}`
  }
  let arr = []
  let moon = []
  let bulan = []
  for (let i = 0; i < 12; i++) {
    let date = new Date(`1990-${i+1}-1`)
    moon.push(moment(date).format('MMMM'))
    if (i+1<10) {
      bulan.push('0'+(i+1))
    
        }else{
          bulan.push(''+(i+1))
        }
  }
    for (let i = 1; i < 13; i++) {
    let bulan = ''
    if (i<10) {
      bulan ='0'+i

    }else{
      bulan =''+i
    }
    let x =await sql_enak.raw(`SELECT SUM(mr.retribusi) as y,'${moon[i-1]}' as label  from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN  (SELECT * FROM perpanjangan p3  ORDER by p3.id DESC ) as p2 on  p2.dokument_id = d.id  and p2.status =2  LEFT join makam m on m.id = j.makam_id left join master_makam mm on mm.id =m.master_makam_id  LEFT JOIN master_retribusi mr on mr.jenis  = p.jns_pemakaman  WHERE   p.deleted = 0   and p2.status =2  and p.id = p2.permohonan_id  and p2.status_pembayaran =1  and  DATE_FORMAT(p2.tanggal_surat,'%Y') = '${tahun}' and DATE_FORMAT(p2.tanggal_surat,'%m') =${bulan} ${a}`)
    if (!x[0][0].y) {
      x[0][0].y =0
    }
    arr.push(x[0][0])
  }
  res.json({data:arr})
})
app.get('/getLiangKosongGroupMakam',async function (req,res) {
  let a = ''
  if (req.query.mm) {
    a+= ` and mm.id =${req.query.mm}`
  }
  let data_kosong = await sql_enak.raw(`SELECT mm.nama_tpu as label , COUNT(m.id) - (SELECT COUNT(*)  FROM master_makam mm2 left join makam m2 on m2.master_makam_id = mm2.id WHERE  mm2.deleted =0 and mm2.id = mm.id and m2.jumlah_jenazah >0) as y  FROM master_makam mm left join makam m on m.master_makam_id = mm.id WHERE  mm.deleted =0     ${a} GROUP BY mm.id  `)
  let data_isi = await sql_enak.raw(`SELECT mm.nama_tpu as label , COUNT(m.id) - (SELECT COUNT(*)  FROM master_makam mm2 left join makam m2 on m2.master_makam_id = mm2.id WHERE  mm2.deleted =0 and mm2.id = mm.id and m2.jumlah_jenazah =0) as y  FROM master_makam mm left join makam m on m.master_makam_id = mm.id WHERE  mm.deleted =0    ${a} GROUP BY mm.id  `)
  res.json({data_kosong:data_kosong[0],data_isi:data_isi[0]})
})
app.get(`/getListDataJenazahByMasterMakam/:id`,async function (req,res) {
  let data = await sql_enak.raw(`SELECT p.nama_ahli_waris ,j.nama_jenazah,m.blok ,m.sub_blok ,m.nama_tpu ,m.no_liang  ,k.kecamatan   as kecamatan, DATE_FORMAT(p.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id ,m.id as makam_id, j.id as jenazah_id ,  p.email as email_pemohon from jenazah j left join   permohonan p  on j.id = p.jenazah_id  LEFT join makam m on m.id = j.makam_id left join kecamatan k on k.id_kecamatan = m.id_kec  WHERE  p.deleted = 0 and j.verifikasi_perpanjangan = 0 and p.deleted = 0  and  m.master_makam_id =${req.params.id} order by p.id desc`)
res.json({data:data[0]})
})
app.get(`/getListDataJenazah`,async function (req,res) {
  let data = await sql_enak.raw(`SELECT * ,k.kecamatan   as kecamatan, DATE_FORMAT(p.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id ,m.id as makam_id, j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id,  p.email as email_pemohon from jenazah j left join   permohonan p  on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id left join kecamatan k on k.id_kecamatan = m.id_kec  LEFT JOIN (SELECT *  FROM perpanjangan p3 WHERE   p3.status =2  and p3.deleted = 0 ORDER by p3.id DESC) as p2 on  p2.dokument_id = d.id WHERE  p.deleted = 0  AND p2.status = 2 and j.verifikasi_perpanjangan = 0 and p.deleted = 0   order by p.id desc`)
  res.json({data:data[0]})
})
app.get(`/getMasterMakamById/:id`,async function (req,res) {
  let data = await sql_enak.raw(`SELECT * FROM master_makam mm WHERE mm.id =${req.params.id}`)
  res.json({data:data[0]})
})
app.get(`/getPermohonanBaru`,async function (req,res) {
  let a =' * '
  let b = ''
  if (req.query.data) {
    a = `*,CASE 
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
    ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted   ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id ,m.id as makam_id, j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id`
  }
  if (req.query.count) {
    a = ' count(*) as permohonan_baru'
  }
  if (req.query.group_by_master_makam) {
    a+= ' ,  mm.nama_tpu  as label '
    b = ' group by m.master_makam_id '
  }
  if (req.query.master_makam) {
    b = `  and m.master_makam_id = ${req.query.master_makam}`
  }
  let sql = `SELECT ${a} from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id AND p2.status != 2 AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status !=2 ORDER by p3.id DESC  LIMIT 1) left join master_makam mm on mm.id = m.master_makam_id   WHERE p.jns_pemakaman =  0 and p.deleted = 0   AND p2.status != 2 and j.verifikasi_perpanjangan = ? and p.deleted = ?   and p2.status !=3  and p.id = p2.permohonan_id ${b}  order by p.id desc`
  let val = [0,0]
  let data = await sql_enak.raw(sql,val)
  res.json({data:data[0]})
})
app.get(`/ganti_makam`,async function (req,res) {
  let a = await sql_enak.raw(`select * from jenazah j where j.makam_id = 0`)
  let liang = await sql_enak.raw(`select makam_id from jenazah j where makam_id >=78009 and makam_id <= 83452  `)

  const min = 78009;
  const max = 83452;
  let val = []
  for (let i = 0; i < liang[0].length; i++) {
      val.push(liang[0][i].makam_id)    
  }
  // Menghasilkan angka acak antara min dan max (inklusif)
  function randomNumber() {
    const a = Math.floor(Math.random() * (max - min + 1)) + min;
    let count = 0
    for (let k = 0; k < val.length; k++) {
      if (val[k]==a) {
        count++
      }      
    }
    if (count!=0) {
      randomNumber()
    }else{
      return a

    }
  }
  for (let i = 0; i < a[0].length; i++) {
   let b =  randomNumber() 
   let c = 0
   if (b) {

      c = b
   }else{
    randomNumber() 
   }
   await sql_enak.raw(`UPDATE transit_makam_smg.jenazah
    SET makam_id = ${c} WHERE id = ${a[0][i].id}`)
       val.push(c)
   if (i==a[0].length-1) {
    res.json('sukses')
   }
  }
})
app.get(`/getPermohonanLama`,async function (req,res) {
  let a =' * '
  let b = ''
  if (req.query.data) {
    a = `*,CASE 
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
    ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted, DATE_FORMAT(p2.tanggal_berlaku_surat ,'%d-%m-%Y') as tanggal_berlaku_surat  ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id ,m.id as makam_id, j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id`
  }
  if (req.query.count) {
    a = ' count(*) as permohonan_baru'
  }
  if (req.query.group_by_master_makam) {
    a+= ' ,  mm.nama_tpu  as label '
    b = ' group by m.master_makam_id '
  }
  if (req.query.master_makam) {
    b = `  and m.master_makam_id = ${req.query.master_makam}`
  }
  let sql = `SELECT ${a}  from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id AND p2.status = 2 AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC  LIMIT 1)   WHERE p.jns_pemakaman =  ?   and p.deleted = ?    and p.id = p2.permohonan_id and DATEDIFF( p2.tanggal_berlaku_surat,CURRENT_DATE()  ) <7 ${b}  order by p.id desc`
  let val = [0,0]
  let data = await sql_enak.raw(sql,val)
  res.json({data:data[0]})
})
app.use(function (req, res, next) {
  res.status(404).send("Halaman yang anda tuju tidak ada!")
})

// < !--start socketio connection-- >

io.sockets.on('connection', function (socket) {



});
