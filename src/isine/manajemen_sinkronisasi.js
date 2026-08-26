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
router.get('/', cek_login,async function(req, res) {
  console.log(`SELECT DISTINCT  u.master_makam_id , u.id_user , k.kecamatan , m.nama_tpu  FROM user u left join master_makam m on m.id  = u.master_makam_id  LEFT JOIN kecamatan k on m.id_kec = k.id_kecamatan  WHERE m.id = ${req.user[0].master_makam_id}`);
  
  let data = await sql_enak.raw(`SELECT DISTINCT  u.master_makam_id , u.id_user , k.kecamatan , m.nama_tpu  FROM user u left join master_makam m on m.id  = u.master_makam_id  LEFT JOIN kecamatan k on m.id_kec = k.id_kecamatan  WHERE m.id = ${req.user[0].master_makam_id}`)
  res.render('content-backoffice/manajemen_sinkronisasi_data/list',{data:data[0]}); 
});

// router.get('/digitasi_liang/insert', cek_login,async function(req, res) {
//   res.render('content-backoffice/manajemen_digitasi_liang/insert'); 
// });

router.get('/edit/:id', cek_login,async function(req, res) {
//   let data = await sql_enak.raw(`SELECT id, x(centroid(SHAPE)) as x, y(centroid(SHAPE)) as y, blok, sub_blok, no_liang ,     COALESCE(jml_jenazah, 0) AS jml_jenazah
//  FROM makam m left join (select count(*) as jml_jenazah ,j.makam_id    from jenazah j where j.deleted = 0 group by j.makam_id  ) as a on
// a.makam_id = m.id WHERE m.master_makam_id ='${req.params.id}' and  m.deleted = 0  ORDER BY blok asc, sub_blok asc, no_liang asc`)
  let blok = await sql_enak.raw(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0  and m.mmuuid = '${req.params.id}'`)
  let master_makam = await sql_enak.raw(`SELECT * FROM master_makam m WHERE m.deleted = 0  and m.muuid = '${req.params.id}'`)
  console.log(master_makam);
  // , makam:data[0]
  res.render('content-backoffice/manajemen_sinkronisasi_data/edit',{nama_makam:req.params.id,blok:blok[0], master_makam:master_makam[0]}); 
});

router.post('/',cek_login,async function(req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
  let {count,limit,makam_id, offset,cari} = req.body
  // console.log(req.body);
  let = str = ''
  let value = []
  if (makam_id) {
   o+=` and m.master_makam_id =? `
    value.push(makam_id)
  }
  if (limit) {
    str += ` limit ${limit} `
  }
  if (offset) {
    str += `  offset ${offset} `

  }
  
  if (cari) {
    o += ` and ( m.blok like ? or m.sub_blok like ? or m.no_liang like ?)`
      value.push(`%${cari}%`)
      value.push(`%${cari}%`)
      value.push(`%${cari}%`)
  }
  let sql = ` id, x(centroid(SHAPE)) as x, y(centroid(SHAPE)) as y, blok, sub_blok, no_liang ,  keterangan_pengelola,   COALESCE(jml_jenazah, 0) AS jml_jenazah `
  if (count) {
    sql = ' count(*) as jml'
  }
   let sql_query = `SELECT ${sql}
 FROM makam m left join (select count(*) as jml_jenazah ,j.makam_id    from jenazah j where j.deleted = 0 group by j.makam_id  ) as a on
a.makam_id = m.id WHERE   m.deleted = 0 ${o} ORDER BY blok asc, sub_blok asc, no_liang asc ${str}`

  const data = await sql_enak.raw(sql_query,value)
  res.json({data:data[0],user:req.user[0]})
})


module.exports = router;
