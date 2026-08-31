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
var { DBFFile } = require('dbffile');
var deasync = require('deasync');

path.join(__dirname, '/foto');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use(cookieParser());
router.use(session({ 
    secret: '***REMOVED***',   // SARAN: pindahkan ke environment variable
    cookie: { maxAge: 1200000 },
    saveUninitialized: true,
    resave: true 
}));
router.use(passport.initialize());
router.use(passport.session());

// middleware time log
router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
});

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/shp/');
    },
    filename: function (req, file, cb) {
        var nama_file = file.originalname.substr(file.originalname.length - 4);
        nama_file = "datane" + nama_file;
        cb(null, nama_file);
    }
});
var upload = multer({ storage: storage });

// ============================================================
//  GET  /  – halaman upload
// ============================================================
router.get('/', cek_login, function(req, res) {
    res.render('upload_form_shp');
});

// ============================================================
//  POST /shp  – proses upload dan insert ke database
// ============================================================
var cpUpload = upload.fields([
    { name: 'shp', maxCount: 1 },
    { name: 'shx', maxCount: 1 },
    { name: 'dbf', maxCount: 1 }
]);

router.post('/shp', cpUpload, async function(req, res) {
    try {
        // 1. Baca file DBF
        let dbf = await DBFFile.open('src/shp/datane.dbf');
        let datanya = await dbf.readRecords();

        // 2. Siapkan data untuk INSERT ke master_makam (dinamis)
        let columnNames = ['nama_tpu', 'id_kec', 'deleted'];
        let placeholders = ['?', '?', '?'];
        let values = [req.body.nama_tpu, req.body.id_kec, 0];

        if (req.body.luas) {
            columnNames.push('luas');
            placeholders.push('?');
            values.push(req.body.luas);
        }
        if (req.body.kode_tpu) {
            columnNames.push('kode_tpu');
            placeholders.push('?');
            values.push(req.body.kode_tpu);
        }

        const insertMasterSql = `
            INSERT INTO master_makam (${columnNames.join(', ')})
            VALUES (${placeholders.join(', ')})
        `;
        const idResult = await sql_enak.raw(insertMasterSql, values);
        const masterMakamId = idResult[0].insertId;

        // 3. Baca file SHP
        var dataset = gdal.open("src/shp/datane.shp");
        var features = dataset.layers.get(0).features;

        // 4. Loop setiap fitur secara berurutan (gunakan for...of agar await bekerja)
        for (let index = 0; index < features.length; index++) {
            const feature = features.get(index);
            const record = datanya[index];

            let wkt = '';
            if (feature.getGeometry()) {
                wkt = feature.getGeometry().toWKT();
            } else {
                // Jika tidak ada geometri, lewati insert (sesuai logika asli)
                continue;
            }

            // Siapkan data untuk INSERT makam
            const insertMakamSql = `
                INSERT INTO makam (
                    SHAPE, kecamatan, nama_tpu, blok, sub_blok, no_liang,
                    id_kec, agama, keterangan, master_makam_id
                ) VALUES (
                    geomfromtext(?), ?, ?, ?, ?, ?, ?, ?, ?, ?
                ) ON DUPLICATE KEY UPDATE
                    kecamatan = VALUES(kecamatan),
                    nama_tpu = VALUES(nama_tpu),
                    blok = VALUES(blok),
                    sub_blok = VALUES(sub_blok),
                    no_liang = VALUES(no_liang),
                    agama = VALUES(agama),
                    id_kec = VALUES(id_kec),
                    master_makam_id = VALUES(master_makam_id)
            `;

            const makamValues = [
                wkt,                                    // SHAPE (WKT)
                record.Kecamatan || '',                 // kecamatan
                req.body.nama_tpu,                      // nama_tpu
                record.Blok || '',                      // blok
                record.Sub_Blok || '',                  // sub_blok
                record.No || '',                        // no_liang
                req.body.id_kec,                        // id_kec
                record.Agama || '',                     // agama
                record.Keterangan || '',                // keterangan
                masterMakamId                           // master_makam_id
            ];

            await sql_enak.raw(insertMakamSql, makamValues);
        }

        // 5. Redirect setelah selesai
        res.redirect('/manajemen_master/lokasi_pemakaman/insert');

    } catch (error) {
        console.error('Error:', error);
        res.json({ status: 'gagal koordinat salah', detail: error.message });
    }
});

module.exports = router;