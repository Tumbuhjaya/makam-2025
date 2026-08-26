var connection = require('../database').connection;
var sql_enak = require('../database/mysql_enak.js').connection;
var express = require('express');
var router = express.Router();
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , static = require('serve-static')
  , bodyParser = require('body-parser')
  , session = require('express-session')
  , cookieParser = require('cookie-parser')
  , path = require('path');
 var cek_login = require('./login').cek_login;
var dbgeo = require("dbgeo");
var multer = require("multer");
  var gdal = require("gdal");
  var {DBFFile} = require('dbffile');
      var deasync = require('deasync');
path.join(__dirname, '/foto')

  router.use(bodyParser.urlencoded({ extended: true }));
  router.use(bodyParser.json());
  router.use(cookieParser() );
  router.use(session({ secret: '***REMOVED***', cookie: { maxAge : 1200000 },saveUninitialized: true, resave: true }));
  router.use(passport.initialize());
  router.use(passport.session());
  
// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/shp/')
  },
  filename: function (req, file, cb) {
    var nama_file = file.originalname.substr(file.originalname.length - 4);
    nama_file = "datane"+nama_file;
    cb(null, nama_file)
  }
})
var upload = multer({ storage: storage })
//ambil data shp----------------------------------


// parser.on('start', function(p) {
//     console.log('dBase file parsing has started');
// });

// parser.on('header', function(h) {
//     console.log('dBase file header has been parsed');
// });


//  var data_geometry = [];
// parser.on('end', function(p) {
//   var dataset = gdal.open("shp/daerah_irigasi.shp");
 
//   dataset.layers.get(0).features.forEach(function(feature, index) {
//     data_geometry.push(JSON.stringify(feature.getGeometry().toWKT()))
//     // console.log(feature.getGeometry().toWKT());
//    //  console.log(datanya[index])
//   });

//   //  console.log('Finished parsing the dBase file');
// });
//ambil data shp----------------------------------



router.get('/', cek_login, function(req, res) {

  res.render('upload_form_shp');
});

var cpUpload = upload.fields([{ name: 'shp', maxCount: 1 }, { name: 'shx', maxCount: 1 }, { name: 'dbf', maxCount: 1 }])
  router.post('/shp', cpUpload, async function(req, res){
    try {
    let dbf = await DBFFile.open('src/shp/datane.dbf');
    //dbf
    let datanya = await dbf.readRecords();
    // console.log(datanya);
   // parser.parse();
     //shp
     let a = ''
     let b = ''
     if (req.body.luas) {
      a += `,luas,kode_tpu`
      b+=`,${req.body.luas},${req.body.kode_tpu}`
     }
     let id = await sql_enak.raw(`INSERT INTO master_makam
            (nama_tpu, id_kec${a}, deleted)
            VALUES('${req.body.nama_tpu}', ${req.body.id_kec}${b}, 0);
            `)

      var dataset = gdal.open("src/shp/datane.shp");
      
let g = false;
      // console.log( dataset.layers.get(0).features.length, datanya.length);
       dataset.layers.get(0).features.forEach(async function(feature, index) {
        // datanya[i].wkt = feature.getGeometry().toWKT()
        //  data_geometry.push(feature.getGeometry().toWKT())
        
          if(feature.getGeometry()){
            // console.log(datanya);
         

            datanya[index].wkt = feature.getGeometry().toWKT()
            await sql_enak.raw(`INSERT INTO 
            makam(SHAPE,kecamatan, nama_tpu, blok, sub_blok, no_liang, id_kec, agama, keterangan , master_makam_id) 
         VALUES 
            (geomfromtext('${datanya[index].wkt}'), '${datanya[index].Kecamatan}', '${req.body.nama_tpu}', '${datanya[index].Blok}', '${datanya[index].Sub_Blok}', '${datanya[index].No}', '${req.body.id_kec}', '${datanya[index].Agama}', '${datanya[index].Keterangan}',${id[0].insertId}) 
         ON DUPLICATE KEY UPDATE kecamatan='${datanya[index].Kecamatan}',nama_tpu = '${req.body.nama_tpu}', blok = '${datanya[index].Blok}', sub_blok= '${datanya[index].Sub_Blok}', no_liang='${datanya[index].No}',agama='${datanya[index].Agama}', id_kec='${req.body.id_kec}', master_makam_id='${id[0].insertId}';`)
                         
            // console.log(feature.getGeometry().toWKT());
           }else{
            // console.log('gagal feature.getGeometry()');

            datanya[index].wkt = ""
        //     await sql_enak.raw(`INSERT INTO 
        //     makam(nama_tpu, blok, sub_blok, no_liang, id_kec) 
        //  VALUES 
        //     ('${datanya[index].Nama_TPU}', '${datanya[index].Blok}', '${datanya[index].Sub_Blok}', '${datanya[index].No}', '${req.body.id_kec}') 
        //  ON DUPLICATE KEY UPDATE nama_tpu = '${datanya[index].Nama_TPU}', blok = '${datanya[index].Blok}', sub_blok= '${datanya[index].Sub_Blok}', no_liang='${datanya[index].No}', id_kec='${req.body.id_kec}';`)
           
           }
           
      
       

    
        // console.log(index);
        //  console.log(datanya[index])
       });
      //  res.json({status:'berhasil'})
      res.redirect('/manajemen_master/lokasi_pemakaman/insert')
      } catch (error) {
        console.log(error);
        res.json({status:'gagal koordinat salah'})
       }
      
      
   // res.sendStatus(200)
})

   
module.exports = router;
