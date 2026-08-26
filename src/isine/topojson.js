var connection = require('../database').connection;
var express = require('express');
var router = express.Router();
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , static = require('serve-static')
  , bodyParser = require('body-parser')
  , session = require('express-session')
  , cookieParser = require('cookie-parser');
 var cek_login = require('./login').cek_login;
var dbgeo = require("dbgeo");

  var sql_enak = require('../database/mysql_enak.js').connection;

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



      router.get('/json_kec', function(req, res){
  //connection.connect();
  //console.log(req.query)
  connection.query("SELECT x(centroid(a.the_geom)) as x, y(centroid(a.the_geom)) as y, a.kecamatan as kec FROM kecamatan a" , function(err, rows, fields) {
    if (err) throw err;

   //console.log("SELECT asWkt(admin_kec.the_geom) as geometry FROM admin_kec WHERE MBRContains(GeomFromText( 'POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))' ),admin_kec.the_geom");

  //res.end(JSON.stringify(rows))

    // MySQL query...
  //ambil geojson
  res.send(JSON.stringify(rows))
  });

  //connection.end();
  })
   router.get('/topojson_kec', function(req, res){
 //connection.connect();
 //console.log(req.query)
 if(req.query.id_kec){
   var tambahan = "where id_kec= '"+req.query.id_kec+"'";
 }else{
   var tambahan = "";
     
 }
 connection.query("SELECT asWkt(the_geom) as geometry, kecamatan as kecamatan FROM kecamatan "+tambahan, function(err, rows, fields) {
   if (err) throw err;

  //console.log("SELECT asWkt(admin_kec.the_geom) as geometry FROM admin_kec WHERE MBRContains(GeomFromText( 'POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))' ),admin_kec.the_geom");

 //res.end(JSON.stringify(rows))

   // MySQL query...
 //ambil geojson
   dbgeo.parse({
   "data": rows,
   "outputFormat": "topojson",
   "geometryColumn": "geometry",
   "geometryType": "wkt"
 },function(error, result) {
   if (error) {
     return console.log(error);
   }
   // This will log a valid GeoJSON object
  // console.log(result)  
   res.send(JSON.stringify(result))
 });
 });

 //connection.end();
 })

   router.get('/topojson_desa', function(req, res){
//connection.connect();
//console.log(req.query)
connection.query("SELECT asWkt(a.the_geom) as geometry, a.desa, a.id_kelurahan FROM kelurahan a  WHERE mbrIntersects(a.the_geom,  GeomFromText('POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))', 1))", function(err, rows, fields) {
  if (err) throw err;

 //console.log("SELECT asWkt(admin_kec.the_geom) as geometry FROM admin_kec WHERE MBRContains(GeomFromText( 'POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))' ),admin_kec.the_geom");

//res.end(JSON.stringify(rows))

  // MySQL query...
//ambil geojson
  dbgeo.parse({
  "data": rows,
  "outputFormat": "topojson",
  "geometryColumn": "geometry",
  "geometryType": "wkt"
},function(error, result) {
  if (error) {
    return console.log(error);
  }
  // This will log a valid GeoJSON object
 // console.log(result)  
  res.send(JSON.stringify(result))
});
});

//connection.end();
})
 router.get('/floor_plan', function(req, res){
  let a = ''
  if (req.query.id) {
    a += ` and OGR_FID = ${req.query.id}`
  }
connection.query("SELECT a.*,asWkt(a.SHAPE) as geometry FROM floor_plan a  WHERE 1 "+a, function(err, rows, fields) {
    if (err) throw err;

  if (req.query.peta) {
     dbgeo.parse({
        "data": rows,
        "outputFormat": "topojson",
        "geometryColumn": "geometry",
        "geometryType": "wkt"
      },function(error, result) {
        if (error) {
          return console.log(error);
        }
      res.send(JSON.stringify(result))
    });
  }else{
    res.json({data:rows})
  }
       
  });
})
 // router.get('/bencana', function(req, res){
 // //connection.connect();
 // //console.log(req.query)
 // var tambahan = "where deleted=0";
 // if(req.query.id_kec){
 //    tambahan = tambahan+" and id_desa= '"+req.query.id_kec+"'";
 // }
 // connection.query("SELECT asWkt(a.SHAPE) as geometry, id  FROM angin_puting_beliung_dan_hujan_deras a "+tambahan, function(err, rows, fields) {
 //   if (err) throw err;

 //  //console.log("SELECT asWkt(admin_kec.the_geom) as geometry FROM admin_kec WHERE MBRContains(GeomFromText( 'POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))' ),admin_kec.the_geom");

 // //res.end(JSON.stringify(rows))

 //   // MySQL query...
 // //ambil geojson
 //   dbgeo.parse({
 //   "data": rows,
 //   "outputFormat": "topojson",
 //   "geometryColumn": "geometry",
 //   "geometryType": "wkt"
 // },function(error, result) {
 //   if (error) {
 //     return console.log(error);
 //   }
 //   // This will log a valid GeoJSON object
 //  // console.log(result)  
 //   res.send(JSON.stringify(result))
 // });
 // });

 // //connection.end();
 // })

 router.get('/unsur_lain', function(req, res){
 //connection.connect();
 //console.log(req.query)
 var tambahan = "where deleted=0";
 if(req.query.id_kec){
    tambahan = tambahan+" and kecamatan= '"+req.query.id_kec+"'";
 }
 connection.query("SELECT asWkt(unsur_lain.the_geom) as geometry, id, nm_unsur, nm_daerah, nm_sepakat, kls_unsur  FROM unsur_lain "+tambahan, function(err, rows, fields) {
   if (err) throw err;

  //console.log("SELECT asWkt(admin_kec.the_geom) as geometry FROM admin_kec WHERE MBRContains(GeomFromText( 'POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))' ),admin_kec.the_geom");

 //res.end(JSON.stringify(rows))

   // MySQL query...
 //ambil geojson
   dbgeo.parse({
   "data": rows,
   "outputFormat": "topojson",
   "geometryColumn": "geometry",
   "geometryType": "wkt"
 },function(error, result) {
   if (error) {
     return console.log(error);
   }
   // This will log a valid GeoJSON object
  // console.log(result)  
   res.send(JSON.stringify(result))
 });
 });


 //connection.end();
 })
   router.get('/makam_tumpang',cek_login, function(req, res){
    let {makam_id,blok,sub_blok} = req.query
    let tambahan = ''
      if (req.user[0].is_admin==0) {
tambahan+= ' and m.master_makam_id =  ' +req.user[0].master_makam_id
 }
     if (makam_id) {
          tambahan += ` and makam_id =  '${makam_id}' `
 }
    if (blok) {
          tambahan += ` and blok =  '${blok}' `
 }
  if (sub_blok) {
          tambahan += ` and sub_blok =  '${sub_blok}' `
 }
 console.log(`SELECT asWkt(SHAPE) as geometry,j.*,blok, no_liang, keterangan, sub_blok, kecamatan,  id_kec, nama_tpu, status_makam, status_ijin, jumlah_jenazah, jns_makam, status_tumpang, master_makam_id,  keterangan_pengelola from jenazah j left join makam m on m.id = j.makam_id  where m.join = 1 and m.deleted = 0 ${tambahan} `);
 try {

     connection.query( `SELECT asWkt(SHAPE) as geometry,j.*,m.blok, m.no_liang, m.keterangan, m.sub_blok, kecamatan,  id_kec, m.nama_tpu, status_makam, status_ijin, jumlah_jenazah, jns_makam, status_tumpang, master_makam_id, keterangan_pengelola from jenazah j left join makam m on m.id = j.makam_id  where m.join = 1 and m.deleted = 0 ${tambahan} `, function(err, rows, fields) {
    console.log(rows);
    
      dbgeo.parse({
   "data": rows,
   "outputFormat": "topojson",
   "geometryColumn": "geometry",
   "geometryType": "wkt"
 },function(error, result) {
   if (error) {
     return console.log(error);
   }
   // This will log a valid GeoJSON object
  // console.log(result)  
   res.send(JSON.stringify(result))
 });
     })
       
 } catch (error) {
  console.log(error);
  res.json('gagal')
 }
  })
   router.get('/makam_jatisari_v3',cek_login,async function(req, res){
 //connection.connect();
 //console.log(req.query)
 let {blok ,get_blok, id_kec , sub_blok ,get_sub_blok} = req.query
 let value = []
 let value2 = []
 let tambahan1 = '  '

 var tambahan = `where 1 `;
  if (req.user[0].is_admin==0) {
tambahan1+= ' and m.id = ? '
    value2.push(req.user[0].master_makam_id)
 }
 if(id_kec){
    tambahan = tambahan+" and kecamatan= '"+req.query.id_kec+"'";
 }
 let a = 'asWkt(SHAPE) as geometry,OGR_FID as makam_id , blok , no_liang , sub_blok , agama , nama_tpu ,deleted '
 if (get_blok) {
    a = ` DISTINCT blok `

 }
  if (get_sub_blok) {
    a = ` DISTINCT sub_blok `
    tambahan += ` and blok =  '${get_sub_blok}' `
 }
 if (blok) {
          tambahan += ` and blok =  '${blok}' `
 }
  if (sub_blok) {
          tambahan += ` and sub_blok =  '${sub_blok}' `
 }
  let master_makam = await sql_enak.raw(`SELECT *  FROM master_makam m where  1 ${tambahan1}`,value2)
  console.log(master_makam[0][0].nama_tpu);
  
  if (req.user[0].is_admin==0) {
      tambahan += ` and nama_tpu = '${master_makam[0][0].nama_tpu}' `
  }
 connection.query(`SELECT ${a}  FROM makam_jatisari_v3 m  `+tambahan, function(err, rows, fields) {
   if (err) throw err;

  //console.log("SELECT asWkt(admin_kec.the_geom) as geometry FROM admin_kec WHERE MBRContains(GeomFromText( 'POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))' ),admin_kec.the_geom");

 //res.end(JSON.stringify(rows))

   // MySQL query...
 //ambil geojson
 if (get_blok||get_sub_blok) {
  res.status(200).json({data:rows})
 }else{
dbgeo.parse({
   "data": rows,
   "outputFormat": "topojson",
   "geometryColumn": "geometry",
   "geometryType": "wkt"
 },function(error, result) {
   if (error) {
     return console.log(error);
   }
   // This will log a valid GeoJSON object
  // console.log(result)  
   res.send(JSON.stringify(result))
 });
 }
   
 });


 //connection.end();
 })
           router.get('/list_polaruang', function(req, res){
    //connection.connect();
   // console.log(req.query.kode_kab)
    var a = '';
    if(req.query.x != undefined && req.query.y != undefined){
      a = "where ST_Within(GeomFromText('POINT("+req.query.x+" "+req.query.y+")'),a.SHAPE);";
    }else if(req.query.p != undefined){
      a = "where ST_Intersects(a.SHAPE, GeomFromText('"+req.query.p+"'));";
    }
    connection.query("SELECT distinct(a.sub_zona) as rencana_tg, a.kode FROM merge1 a "+a , function(err, rows, fields) {
      if (err) throw err;

      res.send(JSON.stringify(rows))
    });
    //connection.end();
    })

                   router.get('/bencana', function(req, res){
            //connection.connect();
           // console.log(req.query.kode_kab)
           var tambahan = "where deleted=0";
           if(req.query.id_desa){
              tambahan = tambahan+" and id_desa= '"+req.query.id_desa+"'";
           }
            if(req.query.id_bencana){
              tambahan = tambahan+" and id_bencana= '"+req.query.id_bencana+"'";
           }
           if(req.query.tahun){
              tambahan = tambahan+" and Year(tgl_kejadian)= '"+req.query.tahun+"'";
           }
            connection.query("SELECT *, DATE_FORMAT(tgl_kejadian, '%d-%m-%Y') as tgl_tampil FROM bencana a "+tambahan , function(err, rows, fields) {
              if (err) throw err;

              res.send(JSON.stringify(rows))
            });
            //connection.end();
            })

                    router.get('/jumlah_bencana', function(req, res){
            //connection.connect();
           // console.log(req.query.kode_kab)
           var tambahan = "where deleted=0";
           if(req.query.id_desa){
              tambahan = tambahan+" and id_desa= '"+req.query.id_desa+"'";
           }
            if(req.query.id_bencana){
              tambahan = tambahan+" and id_bencana= '"+req.query.id_bencana+"'";
           }
           if(req.query.tahun){
              tambahan = tambahan+" and Year(tgl_kejadian)= '"+req.query.tahun+"'";
           }
            connection.query("SELECT count(id) as jml FROM bencana a "+tambahan , function(err, rows, fields) {
              if (err) throw err;

              res.send(JSON.stringify(rows))
            });
            //connection.end();
            })

                 router.get('/makam', function(req, res){
            //connection.connect();
           // console.log(req.query.kode_kab)
            let a = 'where a.deleted = 0 ';
         
            if(req.query.master_makam_id && req.query.master_makam_id!= 'null'){
              a += " and a.master_makam_id =  '"+req.query.master_makam_id+"'";
            }
            if(req.query.blok && req.query.blok!= 'null'){
              a += " and a.blok =  '"+req.query.blok+"'";
            }
            if(req.query.sub_blok && req.query.sub_blok!= 'null'){
              a += " and a.sub_blok =  '"+req.query.sub_blok+"'";
            }
            if(req.query.no_liang && req.query.no_liang != 'null'){
              a += " and a.no_liang =  '"+req.query.no_liang+"'";
            }
            if(req.query.makam_id && req.query.makam_id != 'null'){
              a += " and a.id =  '"+req.query.makam_id+"'";
            }
            if(req.query.agama == 1){
              a += " and a.agama =  'Islam'";
            }else if(req.query.agama == '' || req.query.agama == 'null'){
              a+= ''
            }else if(req.query.agama == 0){
              a += " and a.agama !=  'Islam'";
            }
            // console.log(a);
            // connection.query("SELECT asWkb(a.SHAPE) as geometry, a.blok,j.nama_jenazah ,DATE_FORMAT(j.tanggal_meninggal , '%d-%m-%Y') as tanggal_meninggal , a.no_liang, a.keterangan, a.sub_blok, a.id, j.id as jenazahId FROM makam a left join jenazah j on a.id = j.makam_id and j.deleted = 0 "+a , function(err, rows, fields) {
            connection.query(`SELECT asWkb(a.SHAPE) as geometry,a.status_makam,k.kecamatan  ,a.agama ,a.nama_tpu , a.blok,j.nama_jenazah ,DATE_FORMAT(j.tanggal_meninggal , '%d-%m-%Y') as tanggal_meninggal , a.no_liang, a.keterangan, a.sub_blok, a.id, j.id as jenazahId ,mm.id as master_makam_id,a.hex, mm.kategori_tpu FROM makam a left join master_makam mm on mm.id = a.master_makam_id left join kecamatan k on k.id_kecamatan = mm.id_kec  left join (select j.* from jenazah j 
left join dokument d on d.jenazah_id = j.id and d.deleted =0
left join perpanjangan p on p.dokument_id = d.id and p.deleted =0 where  p.status =2 and j.deleted = 0  ) j on j.makam_id = a.id
 ` +a , function(err, rows, fields) {
              if (err) throw err;
             //console.log("SELECT asWkt(admin_kec.the_geom) as geometry FROM admin_kec WHERE MBRContains(GeomFromText( 'POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))' ),admin_kec.the_geom");

            //res.end(JSON.stringify(rows))

              // MySQL query...
            //ambil geojson
              dbgeo.parse({
              "data": rows,
              "outputFormat": "geojson",
              "geometryColumn": "geometry",
              "geometryType": "wkb"
            },function(error, result) {
              if (error) {
                return console.log(error);
              }
              // This will log a valid GeoJSON object
             // console.log(result)  
            //  console.log(result);
              res.send(JSON.stringify(result))
            });
            });
            //connection.end();
            })
                       router.get('/makam_bergota', function(req, res){
            //connection.connect();
           // console.log(req.query.kode_kab)
            let a = 'where a.deleted = 0 and a.SHAPE is not null';
         
            if(req.query.master_makam_id && req.query.master_makam_id!= 'null'){
              a += " and a.master_makam_id =  '"+req.query.master_makam_id+"'";
            }
            if(req.query.blok && req.query.blok!= 'null'){
              a += " and a.blok =  '"+req.query.blok+"'";
            }
            if(req.query.sub_blok && req.query.sub_blok!= 'null'){
              a += " and a.sub_blok =  '"+req.query.sub_blok+"'";
            }
            if(req.query.no_liang && req.query.no_liang != 'null'){
              a += " and a.no_liang =  '"+req.query.no_liang+"'";
            }
            if(req.query.makam_id && req.query.makam_id != 'null'){
              a += " and a.id =  '"+req.query.makam_id+"'";
            }
            if(req.query.agama == 1){
              a += " and a.agama =  'Islam'";
            }else if(req.query.agama == '' || req.query.agama == 'null'){
              a+= ''
            }else if(req.query.agama == 0){
              a += " and a.agama !=  'Islam'";
            }
            // console.log(a);
            // connection.query("SELECT asWkb(a.SHAPE) as geometry, a.blok,j.nama_jenazah ,DATE_FORMAT(j.tanggal_meninggal , '%d-%m-%Y') as tanggal_meninggal , a.no_liang, a.keterangan, a.sub_blok, a.id, j.id as jenazahId FROM makam a left join jenazah j on a.id = j.makam_id and j.deleted = 0 "+a , function(err, rows, fields) {
            connection.query(`SELECT asWkb(a.SHAPE) as geometry,a.status_makam,k.kecamatan  ,a.agama ,a.nama_tpu , a.blok, a.no_liang, a.keterangan, a.sub_blok,a.hex, mm.kategori_tpu, a.id FROM makam a left join master_makam mm on mm.id = a.master_makam_id left join kecamatan k on k.id_kecamatan = mm.id_kec   ` +a , function(err, rows, fields) {
              if (err) throw err;
             //console.log("SELECT asWkt(admin_kec.the_geom) as geometry FROM admin_kec WHERE MBRContains(GeomFromText( 'POLYGON(("+req.query.kiri_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kanan_lat+","+req.query.kanan_lng+" "+req.query.kiri_lat+","+req.query.kiri_lng+" "+req.query.kiri_lat+"))' ),admin_kec.the_geom");

            //res.end(JSON.stringify(rows))

              // MySQL query...
            //ambil geojson
              dbgeo.parse({
              "data": rows,
              "outputFormat": "geojson",
              "geometryColumn": "geometry",
              "geometryType": "wkb"
            },function(error, result) {
              if (error) {
                return console.log(error);
              }
              // This will log a valid GeoJSON object
             // console.log(result)  
            //  console.log(result);
              res.send(JSON.stringify(result))
            });
            });
            //connection.end();
            })
            router.get('/topojson_drainase', function(req, res){
              if(req.query.kd_ruas){
                var tambahan = "where kd_ruas= '"+req.query.kd_ruas+"'";
              }else{
                var tambahan = "";
              }
              connection.query("SELECT asWkt(SHAPE) as geometry, id, kd_ruas, pss_drns, panjang, kntrs_drns, bntk_drns, knds_drns, tipe_drns, bhn_din, bhn_dsr, l_atas, l_bawah, t_saluran, foto_p, foto_u FROM drainase "+tambahan, function(err, rows, fields) {
                if (err) throw err;
                          
              //res.end(JSON.stringify(rows))
             
                // MySQL query...
              //ambil geojson
                dbgeo.parse({
                "data": rows,
                "outputFormat": "topojson",
                "geometryColumn": "geometry",
                "geometryType": "wkt"
              },function(error, result) {
                if (error) {
                  return console.log(error);
                }
                // This will log a valid GeoJSON object
               // console.log(result)  
                res.send(JSON.stringify(result))
              });
              });
             
              //connection.end();
              })
              router.get('/topojson_drainase_bangunan', function(req, res){
                if(req.query.kd_ruas){
                  var tambahan = "where kd_ruas= '"+req.query.kd_ruas+"'";
                }else{
                  var tambahan = "";
                }
                connection.query("SELECT asWkt(SHAPE) as geometry, id, kd_ruas, jns_bngun, kondisi, foto FROM drainase_bangunan "+tambahan, function(err, rows, fields) {
                  if (err) throw err;
                            
                //res.end(JSON.stringify(rows))
               
                  // MySQL query...
                //ambil geojson
                  dbgeo.parse({
                  "data": rows,
                  "outputFormat": "topojson",
                  "geometryColumn": "geometry",
                  "geometryType": "wkt"
                },function(error, result) {
                  if (error) {
                    return console.log(error);
                  }
                  // This will log a valid GeoJSON object
                 // console.log(result)  
                  res.send(JSON.stringify(result))
                });
                });
               
                //connection.end();
                })
               router.get('/get_json_peta_makam', function(req, res) {
    let sql = "SELECT asWkt(SHAPE) as geometry, OGR_FID, id, blok, no_liang, keterangan, sub_blok, kecamatan, agama, id_kec, nama_tpu, status_mak, status_iji, jumlah_jen, jns_makam, deleted, status_tum, master_mak, `join`, nama_jenaz, shape_leng, shape_area FROM makam_jatisari_v3";
    let params = [];

    // Filter berdasarkan kd_ruas jika ada
    if (req.query.kd_ruas) {
        sql += " WHERE kd_ruas = ?";
        params.push(req.query.kd_ruas);
    }

    connection.query(sql, params, function(err, rows) {
        if (err) {
            return res.status(500).send(err);
        }

        dbgeo.parse({
            "data": rows,
            "outputFormat": "geojson",
            "geometryColumn": "geometry",
            "geometryType": "wkt"
        }, function(error, result) {
            if (error) {
                return res.status(500).send(error);
            }

            // --- BAGIAN DOWNLOAD ---
            const fileName = "peta_makam.json";
            
            // Memberitahu browser untuk mendownload file dengan nama tertentu
            res.attachment(fileName); 
            
            // Kirim data sebagai JSON
            res.send(result); 
        });
    });
});
         router.get('/get_json_makam_jenazah/:id', function(req, res) {
    // 1. Gabungkan query dengan benar (Tanpa double SELECT)
    let sql = `
        SELECT 
            asWkt(m.SHAPE) as geometry, 
            m.id as makam_id, 
            m.blok, 
            m.no_liang, 
            m.keterangan, 
            m.sub_blok, 
            m.kecamatan, 
            m.agama as agama_makam, 
            m.id_kec, 
            m.nama_tpu, 
            m.status_makam, 
            m.status_ijin, 
            m.jumlah_jenazah, 
            m.jns_makam, 
            m.deleted as makam_delete, 
            m.status_tumpang, 
            m.master_makam_id, 
            m.\`join\`, 
            m.keterangan_pengelola,
            j.id as jenazah_id, 
            j.nama_jenazah, 
            j.jenis_kelamin, 
            j.agama as jenzah_agama, 
            j.domisili_jenazah, 
            j.tanggal_meninggal, 
            j.tanggal_dimakamkan, 
            j.deleted as jenazah_delete, 
            j.makam_id, 
            j.kec_id, 
            j.kel_id, 
            j.alamat, 
            j.permohonan_id, 
            j.verifikasi, 
            j.status_pembayaran, 
            j.pemohon_id, 
            j.foto_ktp_jenazah, 
            j.ktp_jenazah, 
            j.verifikasi_perpanjangan, 
            j.inserted, 
            j.tanggal_daftar_perpanjangan, 
            j.jam_dimakamkan, 
            j.nik_jenazah, 
            j.kode, 
            j.status_survey
        FROM jenazah j 
        LEFT JOIN makam m ON j.makam_id = m.id  where m.master_makam_id in ( ${req.params.id}) 
    `;

    let params = [];
    if (req.query.kd_ruas) {
        sql += " WHERE m.kd_ruas = ?"; // Sesuaikan alias tabelnya
        params.push(req.query.kd_ruas);
    }

    connection.query(sql, params, function(err, rows) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }

        dbgeo.parse({
            "data": rows,
            "outputFormat": "geojson",
            "geometryColumn": "geometry",
            "geometryType": "wkt"
        }, function(error, result) {
            if (error) {
                return res.status(500).send(error);
            }

            // Set header agar file langsung terdownload
            const fileName = `data_makam_${Date.now()}.json`;
            res.attachment(fileName); 
            res.send(result);
        });
    });
});
module.exports = router;
