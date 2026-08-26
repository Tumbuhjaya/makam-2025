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

  var nodemailer = require('nodemailer')
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'noreply@survplus.id',
      pass: '***REMOVED***'
    }
  })
var login = require('./isine/login').router;
var peta = require('./isine/topojson');
var upload = require('./isine/upload_file');
// var upload_shp = require('./isine/upload_shp');
var user = require('./isine/user');
var fn = require('./isine/ckeditor-upload-image');
var cek_login = require('./isine/login').cek_login;
var permohonan_ijin = require('./isine/permohonan_ijin');
var revisi_dokumen = require('./isine/revisi_dokumen');
var manajemen_permohonan = require('./isine/manajemen_permohonan');
var manajemen_perpanjangan = require('./isine/manajemen_perpanjangan');
var manajemen_perijinan = require('./isine/manajemen_perijinan');
var manajemen_laporan = require('./isine/manajemen_laporan');
var manajemen_master = require('./isine/manajemen_master');
var moment = require("moment")
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
app.set('port', process.env.PORT || 8123);

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
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  duration: 50 * 60 * 1000,
  activeDuration: 10 * 60 * 1000,
  secret: '***REMOVED***',
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
app.use('/revisi_dokumen', revisi_dokumen);
app.use('/manajemen_permohonan', manajemen_permohonan);
app.use('/manajemen_laporan', manajemen_laporan);
app.use('/manajemen_perpanjangan', manajemen_perpanjangan);
app.use('/manajemen_perijinan', manajemen_perijinan);
app.use('/manajemen_master', manajemen_master);

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
  let {kolom , val_kol ,like,val_like, is_null , is_not_null} = req.body
  console.log(req.body);
  let str = ''
  let value = []
  if (like&&val_like) {
      str += ` and ${like} like '%${val_like}%' `
  }
  if (kolom&&val_kol) {
    if (typeof kolom == 'string' && typeof val_kol == 'string') {
      str += ` and ${kolom} = ? `
      value.push(val_kol)
  
    }else{
      for (let i = 0; i < kolom.length; i++) {
        str += ` and ${kolom[i]} = ? `
        value.push(val_kol[i])
      }
    }

  }
  if (is_not_null) {
    str += ` and ${is_not_null} is not null`
  }
  if (is_null) {
    str += ` and ${is_null} is null`
  }
  let sql = `SELECT DISTINCT  nama_jenazah  FROM jenazah j left join permohonan p on j.id = p.jenazah_id  WHERE p.deleted = 0 ${str} order by nama_jenazah asc`
  console.log(sql);
  console.log(value);
  await sql_enak.raw(sql,value).then(function (hsl) {
    res.json({data:hsl[0]})
  })
})
app.post('/get_nama_dan_lokasi',async function (req,res) {
  let {kolom , val_kol ,like,val_like, is_null , is_not_null} = req.body
  let str = ''
  let value = []
  if (like&&val_like) {
      str += ` and ${like} like '%${val_like}%' `
  }
  if (kolom&&val_kol) {
    if (typeof kolom == 'string' && typeof val_kol == 'string') {
      str += ` and ${kolom} = ? `
      value.push(val_kol)
  
    }else{
      for (let i = 0; i < kolom.length; i++) {
        str += ` and ${kolom[i]} = ? `
        value.push(val_kol[i])
      }
    }

  }
  if (is_not_null) {
    str += ` and ${is_not_null} is not null`
  }
  if (is_null) {
    str += ` and ${is_null} is null`
  }
  let sql = `SELECT  DATE_FORMAT(j.tanggal_meninggal,'%Y') as tahun, p.id as permohonan_id,j.id as jenazah_id , j.nama_jenazah as nama_jenazah, m.id as makam_id, x(centroid(m.SHAPE)) as x,y(centroid(m.SHAPE)) as y FROM permohonan p left join jenazah j on j.permohonan_id = p.id   LEFT join makam m on m.id = j.makam_id   WHERE j.deleted = 0 ${str} ORDER by j.nama_jenazah DESC;`
  await sql_enak.raw(sql,value).then(function (hsl) {
    res.json({data:hsl[0]})
  })
})
app.get('/', function (req, res) {
  let date = moment().format('YYYY-MM-DD')
  connection.query("SELECT id_kecamatan, kecamatan from kecamatan",async function (err, kec, fields) {
    connection.query('SELECT DISTINCT  nama_jenazah  FROM jenazah j left join permohonan p on j.id = p.jenazah_id  WHERE p.deleted = 0 and p.jns_pemakaman = 0 order by nama_jenazah asc',async function (err, nama_jenazah , fields) {
      connection.query('SELECT DISTINCT  nama_jenazah  FROM jenazah j left join permohonan p on j.id = p.jenazah_id  WHERE p.deleted = 0 and p.jns_pemakaman = 2 order by nama_jenazah asc',async function (err, nama_jenazah_pesan , fields) {
        connection.query('SELECT DISTINCT  nama_jenazah  FROM jenazah j left join permohonan p on j.id = p.jenazah_id  WHERE p.deleted = 0 and p.jns_pemakaman = 4 order by nama_jenazah asc',async function (err, nama_jenazah_tumpang , fields) {
      // connection.query(`SELECT  j.nama_jenazah as nama_pemohon FROM jenazah j  left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id AND p2.id = (SELECT p3.id FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC LIMIT 1) LEFT join makam m on m.id = j.makam_id  WHERE  j.deleted = 0 and p.jns_pemakaman =2 ORDER by p.nama_ahli_waris  DESC; `,async function (err, nama_pemohon, fields) {
        
      // nama jenazah lama 
      // connection.query(`SELECT  j.nama_jenazah as nama_pemohon FROM jenazah j  left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN (SELECT *  FROM perpanjangan p3 WHERE   p3.status =2  and p3.deleted = 0 ORDER by p3.id DESC) as a on  a.dokument_id = d.id LEFT join makam m on m.id = j.makam_id  WHERE  j.deleted = 0 and p.jns_pemakaman =2 ORDER by p.nama_ahli_waris  DESC; `,async function (err, nama_pemohon, fields) {
                
      
      // nama jenazah baru 
      connection.query(`SELECT  j.nama_jenazah as nama_pemohon FROM jenazah j  WHERE j.deleted = 0 and j.nama_jenazah is not null`,async function (err, nama_pemohon, fields) {
        // connection.query("SELECT  nama_tpu,id, (select x(centroid(SHAPE)) from makam where id=m.id limit 1 ) as x, (select y(centroid(SHAPE)) from makam where id=m.id limit 1 ) as y FROM makam m where m.deleted = 0 GROUP by nama_tpu",async function (err, makam, fields) {
        connection.query(`SELECT  nama_tpu,id, (select x(centroid(SHAPE)) from makam where master_makam_id =mm.id limit 1 ) as x, (select y(centroid(SHAPE)) from makam where master_makam_id=mm.id limit 1 ) as y FROM master_makam mm  where mm.deleted = 0 GROUP by nama_tpu`,async function (err, makam , fields) {
          // connection.query(`SELECT  DATE_FORMAT(j.tanggal_meninggal,'%Y') as tahun, p.id as permohonan_id,j.id as jenazah_id , j.nama_jenazah as nama_jenazah, m.id as makam_id, x(centroid(m.SHAPE)) as x,y(centroid(m.SHAPE)) as y FROM permohonan p left join jenazah j on j.permohonan_id = p.id LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id AND p2.id = (SELECT p3.id FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p4 on p4.dokument_id = d.id and p4.id = (SELECT p5.id from perpanjangan p5 WHERE p5.dokument_id= d.id ORDER BY p5.id DESC limit 1 ) WHERE p4.status= 2 ORDER by j.nama_jenazah DESC;`,async function (err, jenazah, fields) {
            connection.query(`SELECT  DATE_FORMAT(j.tanggal_meninggal,'%Y') as tahun, p.id as permohonan_id,j.id as jenazah_id , j.nama_jenazah as nama_jenazah, m.id as makam_id, x(centroid(m.SHAPE)) as x,y(centroid(m.SHAPE)) as y FROM permohonan p left join jenazah j on j.permohonan_id = p.id   LEFT join makam m on m.id = j.makam_id   WHERE j.deleted = 0 ORDER by j.nama_jenazah DESC;`,async function (err, jenazah, fields) {
              connection.query("SELECT id_kecamatan, kecamatan from kecamatan",async function (err, kecamatan, fields) {
              // connection.query(`SELECT COUNT(*) as total  FROM makam m WHERE  m.jumlah_jenazah  =0 and m.deleted = 0`,async function (err, liang_kosong, fields) {
              //   connection.query(`SELECT COUNT(*) as total  FROM makam m WHERE  m.jumlah_jenazah  >0  and m.deleted = 0`,async function (err, liang_isi, fields) {
              //     connection.query(`SELECT COUNT(*)  as total FROM permohonan p left join  jenazah j on j.id = p.jenazah_id  left join dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC  LIMIT 1)   WHERE p.deleted = 0 and m.status_makam =2 and p.jns_pemakaman = 0 and m.deleted = 0 and p2.tanggal_berlaku_surat>='${date}' `,async function (err, liang_berlaku1, fields) {
              //         connection.query(`SELECT COUNT(*)  as total FROM permohonan p left join  jenazah j on j.id = p.jenazah_id  left join dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC  LIMIT 1)   WHERE p.deleted = 0 and m.status_makam =2 and p.jns_pemakaman = 0 and m.deleted = 0  and p2.tanggal_berlaku_surat<'${date}'`,async function (err, liang_kadaluarsa1, fields) {
                // connection.query(`SELECT COUNT(*) as total  FROM makam m WHERE  m.jumlah_jenazah  =0 and m.deleted = 0`,async function (err, liang_kosong, fields) {
                //   connection.query(`SELECT COUNT(*) as total  FROM makam m WHERE  m.jumlah_jenazah  >0  and m.deleted = 0`,async function (err, liang_isi, fields) {
                //     connection.query(`SELECT COUNT(*)  as total FROM permohonan p left join  jenazah j on j.id = p.jenazah_id  left join dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN (SELECT *  FROM perpanjangan p3 WHERE   p3.status =2  and p3.deleted = 0 ORDER by p3.id DESC) as a on  a.dokument_id = d.id   WHERE p.deleted = 0 and m.status_makam =2 and p.jns_pemakaman = 0 and m.deleted = 0 and a.tanggal_berlaku_surat>='${date}' `,async function (err, liang_berlaku1, fields) {  
                //       connection.query(`SELECT COUNT(*)  as total FROM permohonan p left join  jenazah j on j.id = p.jenazah_id  left join dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN (SELECT *  FROM perpanjangan p3 WHERE   p3.status =2  and p3.deleted = 0 ORDER by p3.id DESC) as a on  a.dokument_id = d.id   WHERE p.deleted = 0 and m.status_makam =2 and p.jns_pemakaman = 0 and m.deleted = 0  and a.tanggal_berlaku_surat<'${date}'`,async function (err, liang_kadaluarsa1, fields) {
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
                          AND p2.tanggal_berlaku_surat >= '${date}'
                          ORDER BY p2.id DESC
                      ) p2 ON p2.dokument_id = d.id
                      WHERE m.status_makam = 2
                          AND p.jns_pemakaman = 0
                          AND m.deleted = 0
                          AND p2.dokument_id IS NOT NULL`,async function (err, liang_berlaku1, fields) {
                      // connection.query(`SELECT COUNT(*)  as total FROM permohonan p left join  jenazah j on j.permohonan_id = p.id  left join dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC  LIMIT 1)   WHERE m.status_makam =2 and p.jns_pemakaman = 0 and m.deleted = 0 and p2.tanggal_berlaku_surat<'${date}'  ${x}`,async function (err, liang_kadaluarsa, fields) {
                        connection.query(`SELECT COUNT(*) AS total
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
                        WHERE m.status_makam = 2
                            AND p.jns_pemakaman = 0
                            AND m.deleted = 0
                            AND p2.dokument_id IS NOT NULL`,async function (err, liang_kadaluarsa1, fields) {            
                let liang_berlaku = 0
                          let liang_kadaluarsa = 0
                          if (liang_berlaku1[0]) {
                            liang_berlaku+=liang_berlaku1[0].total
                          }
                
                          if (liang_kadaluarsa1[0]) {
                            liang_kadaluarsa+=liang_kadaluarsa1[0].total
                          }
                        //  console.log(liang_kadaluarsa,liang_kosong,liang_isi,liang_berlaku);
                          res.render('content/index', {
                            jenazah,kecamatan,makam,nama_jenazah,nama_jenazah_pesan,nama_jenazah_tumpang,
                          user: req.user,liang_kosong,liang_isi,
                          // liang_berlaku:liang_berlaku1[0].total,
                          // liang_kadaluarsa:liang_kadaluarsa1[0].total
                          liang_berlaku,nama_pemohon,
                          liang_kadaluarsa,kec
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  });
});
})
app.get('/peta_lantai', function (req, res) {
  res.render('content/peta_lantai');
})
app.get('/getJumlahLiang',function (req,res) {
  let x =''
  if (req.query.master_makam_id&&req.query.master_makam_id != 'null') {
    x+=` and m.master_makam_id  = '${req.query.master_makam_id}'`
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
  // if (req.query.permohonan_id != 'null') {
  //   connection.query(`SELECT *  FROM jenazah j left join permohonan p on p.id = j.permohonan_id  WHERE p.id =  ${req.query.permohonan_id}`,async function (err, jenazah, fields) {
  //     x+=` and m.id  = ${jenazah[0].makam_id}`
  //   })
  // }
  // console.log(x);
  let date = moment().format('YYYY-MM-DD')
  connection.query(`SELECT COUNT(*) as total  FROM makam m WHERE  m.jumlah_jenazah  =0  and m.deleted = 0 ${x}`,async function (err, liang_kosong, fields) {
    connection.query(`SELECT COUNT(*) as total  FROM makam m WHERE  m.jumlah_jenazah  >0   and m.deleted = 0 ${x}`,async function (err, liang_isi, fields) {
      // connection.query(`SELECT COUNT(*)  as total FROM permohonan p left join  jenazah j on j.permohonan_id = p.id  left join dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC  LIMIT 1)   WHERE m.status_makam =2 and p.jns_pemakaman = 0 and m.deleted = 0 and p2.tanggal_berlaku_surat>='${date}'  ${x}`,async function (err, liang_berlaku, fields) {
      connection.query(`SELECT COUNT(*) AS total
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
      WHERE m.status_makam = 2
          AND p.jns_pemakaman = 0
          AND m.deleted = 0
          AND p2.dokument_id IS NOT NULL ${x}`,async function (err, liang_berlaku, fields) {
      // connection.query(`SELECT COUNT(*)  as total FROM permohonan p left join  jenazah j on j.permohonan_id = p.id  left join dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2  ORDER by p3.id DESC  LIMIT 1)   WHERE m.status_makam =2 and p.jns_pemakaman = 0 and m.deleted = 0 and p2.tanggal_berlaku_surat<'${date}'  ${x}`,async function (err, liang_kadaluarsa, fields) {
        connection.query(`SELECT COUNT(*) AS total
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
        WHERE m.status_makam = 2
            AND p.jns_pemakaman = 0
            AND m.deleted = 0
            AND p2.dokument_id IS NOT NULL ${x}`,async function (err, liang_kadaluarsa, fields) {         
      // console.log(x,liang_kosong,liang_isi,
      //             liang_berlaku,
      //             liang_kadaluarsa,'liang_kosong,liang_isi,liang_berlaku,liang_kadaluarsa');
            res.json( {
                liang_kosong,liang_isi,
                liang_berlaku,
                liang_kadaluarsa
              })
            })
          })
        })
      })
})
app.get('/backoffice', cek_login,async function (req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
  let permohonan = await sql_enak.raw(`SELECT *,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran
  ,CASE 
  when p2.status  = 0  then 'Belum Diverifikasi'
  when p2.status  = 1  then (SELECT CONCAT('Revisi')) 
  when p2.status  = 2  then 'Disetujui'
  when p2.status  = 3  then 'Dibatalkan'
  when p2.status  = 4  then 'Telah di revisi user'
  END as status_permohonan
  ,DATE_FORMAT(p.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id ,m.id as makam_id, j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id,  p.email as email_pemohon from jenazah j left join   permohonan p  on j.id = p.jenazah_id LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN (SELECT *
    FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id
          FROM perpanjangan p     GROUP BY p.dokument_id) as p
    LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 on p2.dokument_id_nya = d.id AND p2.status != 2  WHERE  j.deleted = 0  AND p.deleted = 0  AND p2.status != 2 and j.verifikasi_perpanjangan = 0 and p2.status !=3 and p.deleted = 0 ${o}  order by p.id desc`)
  let perpanjangan = await sql_enak.raw(`SELECT *,NOW()>p2.tanggal_berlaku_surat  as kadaluarsa,CASE 
  when p2.status_pembayaran = 0  then 'Belum Dibayar'
  when p2.status_pembayaran = 1  then 'Sudah Dibayar'
  END as status_pembayaran,DATE_FORMAT(p2.tanggal_surat , '%d-%m-%Y') as tanggal_surat,DATE_FORMAT(p2.tanggal_berlaku_surat , '%d-%m-%Y') as tanggal_berlaku_surat
  ,DATE_FORMAT(p.inserted , '%d-%m-%Y') as inserted,DATE_FORMAT(j.tanggal_daftar_perpanjangan , '%d-%m-%Y') as tanggal_daftar_perpanjangan  ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id ,p2.id as perpanjangan_id ,  p.email as email_pemohon from  jenazah j left join   permohonan p  on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN (SELECT *
    FROM (SELECT p.dokument_id as dokument_id_nya, MAX(p.id) as perpanjangan_id
    FROM perpanjangan p     GROUP BY p.dokument_id) as p
LEFT JOIN perpanjangan p2 ON p2.id = p.perpanjangan_id) p2 on p2.dokument_id_nya = d.id   WHERE  j.deleted = 0  AND  p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}  and p.id = p2.permohonan_id  order by p.id desc`)
  
  
  res.render('content-backoffice/index',{permohonan:permohonan[0],perpanjangan:perpanjangan[0]});
});
app.get('/getCount',cek_login,async function (req,res) {
  let o = ''
if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
  // let permohonan = await sql_enak.raw(`SELECT COUNT(*) as count from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id AND p2.status != 2 AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status !=2 ORDER by p3.id DESC  LIMIT 1) WHERE p.jns_pemakaman =  0 and p.deleted = 0  AND p2.status != 2 and j.verifikasi_perpanjangan = 0 and p.deleted = 0 ${o}  and p2.status !=3  and p.id = p2.permohonan_id  order by p.id desc `)
  // let permohonan_tumpang = await sql_enak.raw(`SELECT COUNT(*) as count  from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id AND p2.status != 2  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status !=2 ORDER by p3.id DESC  LIMIT 1) WHERE p.jns_pemakaman =  4 and p.deleted = 0  AND p2.status != 2 and j.verifikasi_perpanjangan = 0  and p.deleted = 0 ${o}  and p2.status !=3   and p.id = p2.permohonan_id  order by p.id desc`)
  // let perijinan = await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC  LIMIT 1) LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman =  0 and p.deleted = 0 and p2.status = 2 ${o}   and p2.status !=3 and p.deleted = 0   and p.id = p2.permohonan_id  order by p.id desc`)
  // let perijinan_tumpang = await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC  LIMIT 1) LEFT join makam m on m.id = j.makam_id WHERE p.jns_pemakaman =  4 and p.deleted = 0 and p2.status = 2  and p.deleted = 0 ${o}   and p2.status !=3  and p.id = p2.permohonan_id  order by p.id desc`)
  // let perijinan_pesan = await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id  AND p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id and p3.status =2 ORDER by p3.id DESC  LIMIT 1) LEFT join makam m on m.id = j.makam_id WHERE p.jns_pemakaman =  2 and p.deleted = 0 and p2.status = 2  and p.deleted = 0 ${o}   and p2.status !=3  and p.id = p2.permohonan_id  order by p.id desc`)
  // let perpanjangan =  await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id    LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id ORDER by p3.id DESC  LIMIT 1)   WHERE p.jns_pemakaman =  0 and p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}   and p.id = p2.permohonan_id  and p2.status !=3 order by p.id desc`)
  // let perpanjangan_tumpang =  await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id    LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id ORDER by p3.id DESC  LIMIT 1)   WHERE p.jns_pemakaman =  4 and p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}    and p.id = p2.permohonan_id  and p2.status !=3 order by p.id desc`)
  // let perpanjangan_pesan =  await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id    LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id ORDER by p3.id DESC  LIMIT 1)   WHERE p.jns_pemakaman =  2 and p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}    and p.id = p2.permohonan_id  and p2.status !=3 order by p.id desc`)
  
  let permohonan = await sql_enak.raw(`SELECT COUNT(*) as count from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id AND p2.status != 2  WHERE p.jns_pemakaman =  0  and j.deleted = 0  and p.deleted = 0  AND p2.status != 2 and j.verifikasi_perpanjangan = 0  and j.deleted = 0  and p.deleted = 0 ${o}  and p2.status !=3  and p.id = p2.permohonan_id  order by p.id desc `)
  let permohonan_tumpang = await sql_enak.raw(`SELECT COUNT(*) as count  from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id AND p2.status != 2   WHERE p.jns_pemakaman =  4  and j.deleted = 0  and p.deleted = 0  AND p2.status != 2 and j.verifikasi_perpanjangan = 0   and j.deleted = 0  and p.deleted = 0 ${o}  and p2.status !=3   and p.id = p2.permohonan_id  order by p.id desc`)
  let perijinan = await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id   LEFT join makam m on m.id = j.makam_id LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  WHERE p.jns_pemakaman =  0  and j.deleted = 0  and p.deleted = 0 and p2.status = 2 ${o}   and p2.status !=3  and j.deleted = 0  and p.deleted = 0   and p.id = p2.permohonan_id  order by p.id desc`)
  let perijinan_tumpang = await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id   LEFT join makam m on m.id = j.makam_id WHERE p.jns_pemakaman =  4  and j.deleted = 0  and p.deleted = 0 and p2.status = 2   and j.deleted = 0  and p.deleted = 0 ${o}   and p2.status !=3  and p.id = p2.permohonan_id  order by p.id desc`)
  let perijinan_pesan = await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id   LEFT JOIN dokument d on d.jenazah_id = j.id left join perpanjangan p2 on p2.dokument_id = d.id   LEFT join makam m on m.id = j.makam_id WHERE p.jns_pemakaman =  2  and j.deleted = 0  and p.deleted = 0 and p2.status = 2   and j.deleted = 0  and p.deleted = 0 ${o}   and p2.status !=3  and p.id = p2.permohonan_id  order by p.id desc`)
  let perpanjangan =  await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id    LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id   WHERE p.jns_pemakaman =  0  and j.deleted = 0  and p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}   and p.id = p2.permohonan_id  and p2.status !=3 order by p.id desc`)
  let perpanjangan_tumpang =  await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id    LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id   WHERE p.jns_pemakaman =  4  and j.deleted = 0  and p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}    and p.id = p2.permohonan_id  and p2.status !=3 order by p.id desc`)
  let perpanjangan_pesan =  await sql_enak.raw(`SELECT COUNT(*) as count   from  jenazah j  left join permohonan p on j.id = p.jenazah_id    LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id   WHERE p.jns_pemakaman =  2  and j.deleted = 0  and p.deleted = 0 and j.verifikasi_perpanjangan =1 ${o}    and p.id = p2.permohonan_id  and p2.status !=3 order by p.id desc`)

  res.json({perpanjangan_pesan:perpanjangan_pesan[0],perijinan_pesan:perijinan_pesan[0],perpanjangan:perpanjangan[0],perpanjangan_tumpang:perpanjangan_tumpang[0],permohonan:permohonan[0],permohonan_tumpang:permohonan_tumpang[0],perijinan:perijinan[0],perijinan_tumpang:perijinan_tumpang[0]})
})

app.use(`/update_status_permohonan`,cek_login,async function (req,res) {
  let perpanjangan ={status:req.body.status, catatan_revisi:req.body.catatan_revisi}
  let jenazah_id =  req.body.jenazah_id
  let perpanjangan_id = req.body.perpanjangan_id
  let email_pemohon = req.body.email_pemohon
  let dokument_id = req.body.dokument_id
  let hp = req.body.hp
  delete perpanjangan.hp
  delete perpanjangan.dokument_id
  delete perpanjangan.email_pemohon
  delete perpanjangan.perpanjangan_id
  delete perpanjangan.jenazah_id
  if (req.body.status == '3') {
    await sql_enak("jenazah")
    .where("id", "=",jenazah_id)
    .update({deleted :1})
  }else{
    await sql_enak("jenazah")
    .where("id", "=", req.body.jenazah_id)
    .update({deleted :0})
  }
  await sql_enak("perpanjangan")
  .where("id", "=", perpanjangan_id)
  .update(perpanjangan)
  let text_email = ''
  let subject_email = ''
  if (req.body.status=='1') {
    text_email = `silahkan lengkapi data - data anda di  "https://makam.semarangkota.go.id/revisi_dokumen/${dokument_id}"`
    subject_email = 'Revisi'
  }else   if (req.body.status=='2') {
    text_email = `Permohonan telah di verifikasi`
    subject_email = 'Disetujui'

  }else   if (req.body.status=='3') {
    text_email = `Permohonan telah di tolak`
    subject_email = 'Ditolak'

  }
    let hasilWa =await kirimWa(hp,text_email)
    // console.log(hasilWa);

  let mailOption = {
    from: 'noreply@survplus.id',
    to: email_pemohon,
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
  res.redirect('/backoffice')
})
app.use(`/update_status`,cek_login,async function (req,res) {
  let perpanjangan =req.body
  let perpanjangan_id =  req.body.perpanjangan_id
  // console.log(perpanjangan_id , perpanjangan);
  let id = await sql_enak.raw(` SELECT j.id  from jenazah j left join  permohonan p  on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT join makam m on m.id = j.makam_id LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and  p2.id = (SELECT p3.id  FROM perpanjangan p3 where p3.dokument_id = d.id ORDER by p3.id DESC  LIMIT 1)   WHERE p2.id = ${perpanjangan_id}   `)
  delete perpanjangan.perpanjangan_id
  let email_pemohon = req.body.email_pemohon
  let hp = req.body.hp
  delete perpanjangan.email_pemohon
  delete perpanjangan.hp

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
    text_email = `silahkan lengkapi data - data anda di  "https://makam.semarangkota.go.id/revisi_dokumen/${req.body.dokument_id}"`
    subject_email = 'Revisi'
  }else   if (req.body.status=='2') {
    text_email = `Perpanjangan telah di verifikasi`
    subject_email = 'Disetujui'

  }else   if (req.body.status=='3') {
    text_email = `Perpanjangan telah di tolak`
    subject_email = 'Ditolak'

  }
  let mailOption = {
    from: 'noreply@survplus.id',
    to: email_pemohon,
    subject: subject_email,
    text: text_email
  }
      let hasilWa =await kirimWa(hp,text_email)
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
  // let data = await sql_enak.raw(`SELECT COUNT(*) as y , mm.nama_tpu as label  FROM master_makam mm left join  makam m on mm.id = m.master_makam_id WHERE mm.deleted =0 GROUP by m.master_makam_id `)
  let a = ''
  if (req.query.tahun) {
    a +=` and DATE_FORMAT(j.tanggal_dimakamkan,'%Y')   = '${req.query.tahun}' ` 
  }
  let data = await sql_enak.raw(`SELECT COUNT(*) as y , mm.nama_tpu as label  FROM master_makam mm left join  makam m on mm.id = m.master_makam_id left join jenazah j on j.makam_id = m.id  WHERE mm.deleted =0 ${a} GROUP by m.master_makam_id `)
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
  // let q = `SELECT SUM(mr.retribusi) as y,? as label  from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN  (SELECT * FROM perpanjangan p3  ORDER by p3.id DESC ) as p2 on  p2.dokument_id = d.id  and p2.status =2  LEFT join makam m on m.id = j.makam_id left join master_makam mm on mm.id =m.master_makam_id  LEFT JOIN master_retribusi mr on mr.jenis  = p.jns_pemakaman  WHERE   p.deleted = 0   and p2.status =2  and p.id = p2.permohonan_id  and p2.status_pembayaran =1  and  DATE_FORMAT(p2.tanggal_surat,'%Y') = '${tahun}' and DATE_FORMAT(p2.tanggal_surat,'%M') in ? ${a}`
  //  arr = await sql_enak.raw(q, [moon, bulan]);

    for (let i = 1; i < 13; i++) {
    let bulan = ''
    if (i<10) {
      bulan ='0'+i

    }else{
      bulan =''+i
    }
    let x =await sql_enak.raw(`SELECT SUM(mr.retribusi) as y,'${moon[i-1]}' as label  from  jenazah j  left join permohonan p on j.id = p.jenazah_id  LEFT JOIN dokument d on d.jenazah_id = j.id LEFT JOIN  (SELECT * FROM perpanjangan p3  ORDER by p3.id DESC ) as p2 on  p2.dokument_id = d.id  and p2.status =2  LEFT join makam m on m.id = j.makam_id left join master_makam mm on mm.id =m.master_makam_id  LEFT JOIN master_retribusi mr on mr.jenis  = p.jns_pemakaman  WHERE   p.deleted = 0   and p2.status =2  and p.id = p2.permohonan_id  and p2.status_pembayaran =1  and  DATE_FORMAT(p2.tanggal_surat,'%Y') = '${tahun}' and DATE_FORMAT(p2.tanggal_surat,'%m') =${bulan} ${a}`)
    // console.log(x[0][0].y);
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
  // console.log(data[0]);
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
// app.get('/4E26CD6CB47148CCFB9334CB15B95495.txt', function (req, res) {
//   console.log(req.user)
//   //res.render('7ECA9DC7A2167A6EB33B60F1DA8B85E1.txt');
//   var file = __dirname + '/4E26CD6CB47148CCFB9334CB15B95495.txt';
//     res.download(file);
// });
// app.listen(800, function () {
//   console.log('Example app listening on port 800!');
//admin
//mysql

app.use(function (req, res, next) {
  res.status(404).send("Halaman yang anda tuju tidak ada!")
})

// < !--start socketio connection-- >

io.sockets.on('connection', function (socket) {



});
