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
  var moment = require("moment");
var CronJob = require("cron").CronJob;
moment.locale('id')
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
router.get('/digitasi_liang', cek_login,async function(req, res) {
  let data = await sql_enak.raw(`SELECT DISTINCT  u.master_makam_id , u.id_user , k.kecamatan , m.nama_tpu  FROM user u left join master_makam m on m.id  = u.master_makam_id  LEFT JOIN kecamatan k on m.id_kec = k.id_kecamatan  WHERE u.id_user = ${req.user[0].id_user}`)
  res.render('content-backoffice/manajemen_digitasi_liang/list',{data:data[0]}); 
});

// router.get('/digitasi_liang/insert', cek_login,async function(req, res) {
//   res.render('content-backoffice/manajemen_digitasi_liang/insert'); 
// });

router.get('/digitasi_liang/edit/:id', cek_login,async function(req, res) {
//   let data = await sql_enak.raw(`SELECT id, x(centroid(SHAPE)) as x, y(centroid(SHAPE)) as y, blok, sub_blok, no_liang ,     COALESCE(jml_jenazah, 0) AS jml_jenazah
//  FROM makam m left join (select count(*) as jml_jenazah ,j.makam_id    from jenazah j where j.deleted = 0 group by j.makam_id  ) as a on
// a.makam_id = m.id WHERE m.master_makam_id ='${req.params.id}' and  m.deleted = 0  ORDER BY blok asc, sub_blok asc, no_liang asc`)
  let agama = await sql_enak.raw(`SELECT DISTINCT  m.agama  as agama FROM makam m WHERE m.deleted = 0  and m.master_makam_id = '${req.params.id}'`)
  let master_makam = await sql_enak.raw(`SELECT * FROM master_makam m WHERE m.deleted = 0  and m.id = '${req.params.id}'`)
  let kecamatan = await sql_enak.raw(`SELECT distinct m.kecamatan  FROM makam m WHERE m.master_makam_id    = '${req.params.id}' and m.kecamatan is not null`)
  console.log(master_makam);
  // , makam:data[0]
  res.render('content-backoffice/manajemen_digitasi_liang/edit',{nama_makam:req.params.id,kecamatan:kecamatan[0][0].kecamatan,agama:agama[0], master_makam:master_makam[0]}); 
});
router.post('/digitasi_liang',cek_login,async function(req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  m.master_makam_id = ${req.user[0].master_makam_id}`
  }
  let {count,limit,makam_id, offset,cari,no_liang} = req.body
  console.log(req.body);
  let = str = ''
  let value = []
  if (makam_id) {
   o+=` and m.master_makam_id =? `
    value.push(makam_id)
  }
  if (no_liang) {
   o+=` and m.no_liang =? `
    value.push(no_liang)
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
  console.log(sql_query,value);
  
  res.json({data:data[0],user:req.user[0]})
})
router.get('/digitasi_liang/hapus/:id/:tpu', cek_login,async function(req, res) {
  await sql_enak('makam').where('id', '=', req.params.id).update({
    deleted: 1
  });
  res.redirect(`/manajemen_master/digitasi_liang/edit/`+req.params.tpu)
});
router.post('/digitasi_liang/keterangan', cek_login,async function(req, res) {
  let post = req.body
  console.log(post,'post');
  
  await sql_enak('makam').where('id', '=', post.id).update(post);
  res.redirect(`/manajemen_master/digitasi_liang/edit/`+post.master_makam_id)
});

router.get('/lokasi_pemakaman', cek_login,async function(req, res) {
  res.render('content-backoffice/manajemen_lokasi_pemakaman/list'); 
});

router.get('/lokasi_pemakaman/insert', cek_login,async function(req, res) {3
  const makam =await sql_enak.raw(`SELECT * FROM master_makam mm left join kecamatan k on k.id_kecamatan = mm.id_kec WHERE mm.deleted = 0`)
 const kec = await sql_enak.raw(`SELECT * FROM kecamatan k `)
  res.render('content-backoffice/manajemen_lokasi_pemakaman/insert',{makam:makam[0],kec:kec[0]}); 
});

router.get('/lokasi_pemakaman/edit/:id', cek_login,async function(req, res) {
  res.render('content-backoffice/manajemen_lokasi_pemakaman/edit'); 
});


router.get('/retribusi/pemakaman/:id', cek_login,async function(req, res) {
  let data = await sql_enak.raw(`SELECT * FROM master_retribusi mr WHERE mr.id = 1`)
  res.render('content-backoffice/manajemen_retribusi/pemakaman' , {data:data[0]}); 
});
router.post('/updateRetribusiPermohonan',cek_login,async function (req,res) {
  await sql_enak("master_retribusi")
  .where("id", "=", 1)
  .update({retribusi:req.body.retribusi}) 
  res.redirect(`/backoffice`)
})
router.post('/updateRetribusiMakamTumpang',cek_login,async function (req,res) {
  await sql_enak("master_retribusi")
  .where("id", "=", 2)
  .update({retribusi:req.body.retribusi}) 
  res.redirect(`/backoffice`)
})
router.post('/updateRetribusiPesanMakam',cek_login,async function (req,res) {
  await sql_enak("master_retribusi")
  .where("id", "=", 3)
  .update({retribusi:req.body.retribusi}) 
  res.redirect(`/backoffice`)
})
router.get('/retribusi/pesan_tempat_makam/:id', cek_login,async function(req, res) {
  let data = await sql_enak.raw(`SELECT * FROM master_retribusi mr WHERE mr.id = 3`)

  res.render('content-backoffice/manajemen_retribusi/pesan_tempat_makam', {data:data[0]}); 
});

router.get('/retribusi/pemakaman_tumpang/:id', cek_login,async function(req, res) {
  let data = await sql_enak.raw(`SELECT * FROM master_retribusi mr WHERE mr.id = 2`)
  res.render('content-backoffice/manajemen_retribusi/pemakaman_tumpang', {data:data[0]}); 
});
router.get(`/deleted/:id`,cek_login,async function (req,res) {
  await sql_enak("master_makam")
      .where("id", "=", req.params.id)
      .update({deleted:1,thisKeyIsSkipped: undefined,})
      await sql_enak("makam")
      .where("master_makam_id", "=", req.params.id)
      .update({deleted:1,thisKeyIsSkipped: undefined,})
      res.redirect(`/manajemen_master/lokasi_pemakaman/insert`)

})
router.post(`/submit_insert_makam`,cek_login,async function (req,res) {
  let post = req.body;
  console.log(req.body,'req.body');
  
  let jenazah_id = post.jenazah_id
  console.log(jenazah_id,'jenazah_id');
  
  delete post.jenazah_id
  let nama_jenazah = post.nama_jenazah
  delete post.nama_jenazah
  let tanggal_meninggal = post.tanggal_meninggal
  delete post.tanggal_meninggal
  
  
  if(req.body.SHAPE){

    post['SHAPE']= st.geomFromText(req.body.SHAPE, 4326);
  }
if (jenazah_id||nama_jenazah) {
  post.status_makam =2
  post.jumlah_jenazah=1
  
}
try {
    await sql_enak("makam")
      .insert(post).then(async function (data) {
        console.log(data);
        
        if (jenazah_id) {
          let jenazah = await sql_enak.raw(`select p2.id as perpanjangan_id , d.id as dokument_id , j.id as jenazah_id , p.id as permohonan_id 
from jenazah j  
left join permohonan p on j.id = p.jenazah_id and p.deleted = 0
LEFT JOIN dokument d on d.jenazah_id = j.id  and d.deleted = 0
LEFT JOIN  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
    perpanjangan x where  x.deleted = 0 GROUP BY x.dokument_id ) as y 
    left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ) as  p2 on p2.dokument_id =d.id 
  LEFT join makam m on m.id = j.makam_id 
  LEFT JOIN kecamatan k on k.id_kecamatan = m.id_kec  
  where j.id = ${jenazah_id} and j.deleted = 0`)
  console.log(jenazah_id , jenazah[0][0]);
                    await sql_enak('jenazah').where('id','=',jenazah_id).update({makam_id:data[0],status_survey:1})
             await sql_enak('perpanjangan').where('id','=',jenazah[0][0].perpanjangan_id).update({status:2,status_pembayaran:1,status_perpanjangan:0,perpanjangan_ke:0,tanggal_surat:tanggal_meninggal,tanggal_berlaku_surat:moment(tanggal_meninggal).add(3, 'Y').format('YYYY-MM-DD')})

        }else if (nama_jenazah){
            let jenazah_id = await sql_enak("jenazah").insert({nama_jenazah,makam_id:data[0],status_survey:1,tanggal_meninggal,tanggal_dimakamkan:tanggal_meninggal,inserted:tanggal_meninggal})
            let permohonan_id = await sql_enak("permohonan").insert({jns_pemakaman:0,jenazah_id:jenazah_id[0],inserted:new Date()})
            let dokument_id = await sql_enak("dokument").insert({jenazah_id:jenazah_id[0],periode:1})
            let perpanjangan_id = await sql_enak("perpanjangan").insert({status:2,status_pembayaran:1,status_perpanjangan:0,perpanjangan_ke:0, permohonan_id:permohonan_id[0],dokument_id:dokument_id[0],tanggal_surat:tanggal_meninggal,tanggal_berlaku_surat:moment(tanggal_meninggal).add(3, 'Y').format('YYYY-MM-DD')})

        }

              res.redirect(`/manajemen_master/digitasi_liang/edit/${post.master_makam_id}`)

      })
} catch (error) {
  console.log(error);
  
}


})


router.get('/data_jenazah', cek_login,async function(req, res) {  
  res.render('content-backoffice/manajemen_data_jenazah/list',{user:req.user[0]}); 
});

router.get('/data_jenazah/insert', cek_login,async function(req, res) {
  res.render('content-backoffice/manajemen_data_jenazah/insert'); 
});

router.get('/data_jenazah/edit/:id/:tujuan', cek_login,async function(req, res) {
  const data = await sql_enak.raw(`SELECT *,p.jns_pemakaman,jml_jenazah,d.keterangan as ket,DATE_FORMAT(p2.tanggal_surat , '%Y-%m-%d') as tanggal_surat,p.alamat as alamat_pemohon , j.alamat as alamat_jenazah,p.kec_id as kec_pemohon,p.kel_id as kel_pemohon,m.id as makam_id ,j.kec_id as kec_jenazah,j.kel_id as kel_jenazah ,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted,p2.id as perpanjangan_id ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id , m.id_kec as kecamatan_makam,m.nama_tpu as lokasi_makam , m.blok as blok_makam , m.sub_blok as subblok_makam ,m.no_liang as nomor_liang_makam,j.agama as agama_jenazah ,m.agama as cluster,d.keterangan as ket from  jenazah j 
left join (select p.jenazah_id , max(p.id) as permohonan_id from permohonan p where deleted = 0 group by p.jenazah_id) as p3 on p3.jenazah_id = j.id
left join permohonan p on p.id = p3.permohonan_id   LEFT JOIN dokument d on d.jenazah_id = j.id 
LEFT join makam m on m.id = j.makam_id 
left join (select max(p.id) as perpanjangan_id,p.dokument_id  from perpanjangan p where deleted = 0 and p.status =2 group by p.dokument_id ) as p4 
on p4.dokument_id = d.id
LEFT JOIN perpanjangan p2 on p2.dokument_id = d.id and p2.id = p4.perpanjangan_id  
left join (select count(id) jml_jenazah , makam_id from jenazah where deleted = 0 group by makam_id ) jml on jml.makam_id = m.id
WHERE   j.deleted = 0  and p.deleted = 0  and p.id = p2.permohonan_id and j.id =${req.params.id}`)
  const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")
  const lokasi = await sql_enak.raw(`SELECT * FROM master_makam mm  WHERE mm.deleted = 0  and mm.id = ${data[0][0].master_makam_id} `)
  const blok = await sql_enak.raw(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0    and m.nama_tpu = '${data[0][0].lokasi_makam}'`)
  const sub_blok = await sql_enak.raw(`SELECT DISTINCT  m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 and m.nama_tpu = '${data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].blok_makam}' `)
  const no_liang = await sql_enak.raw(`SELECT  m.id,m.no_liang  as no_liang  FROM makam m WHERE m.deleted = 0 and m.jns_makam !=2  and m.nama_tpu = '${data[0][0].lokasi_makam}'  and m.blok =   '${data[0][0].blok_makam}'  and m.sub_blok  = '${data[0][0].subblok_makam}'  order by m.no_liang asc`)
  let x = sub_blok[0].sort((a,b)=>a.subblok.substring(1,a.subblok.length)-b.subblok.substring(1,b.subblok.length))
  // console.log(data[0][0]);

  res.render('content-backoffice/manajemen_data_jenazah/edit',{user:req.user[0],id:req.params.id,tujuan:req.params.tujuan , data:data[0],kec:kec[0],lokasi:lokasi[0],blok:blok[0],sub_blok:x,no_liang:no_liang[0]}); 
});

router.get('/data_jenazah_khusus/edit/:id/:tujuan', cek_login,async function(req, res) {
    const data = await sql_enak.raw(`SELECT *, j.makam_id as makam_sebelumnya,d.keterangan as ket,DATE_FORMAT(p2.tanggal_surat , '%Y-%m-%d') as tanggal_surat,p.alamat as alamat_pemohon , j.alamat as alamat_jenazah,p.kec_id as kec_pemohon,p.kel_id as kel_pemohon ,j.kec_id as kec_jenazah,j.kel_id as kel_jenazah ,DATE_FORMAT(j.inserted , '%Y-%m-%d') as inserted,p2.id as perpanjangan_id ,DATE_FORMAT(j.tanggal_meninggal  , '%Y-%m-%d') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%Y-%m-%d') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id ,j.agama as agama_jenazah ,d.keterangan as ket ,
      k.id_kecamatan as kecamatan_pemohon_id,k3.id_kelurahan as kelurahan_pemohon_id,k2.id_kecamatan as kecamatan_jenazah_id,k4.id_kelurahan as kelurahan_jenazah_id , j.makam_id as makam_id
      from  jenazah j   left join makam_tambahan mt on mt.id = j.makam_id and mt.deleted =0
      left join makam m on m.id = mt.makam_id and m.deleted = 0
left join (select p.jenazah_id ,max(p.id) as permohonan_id from permohonan p where deleted = 0 group by p.jenazah_id) as p3 on p3.jenazah_id = j.id
left join permohonan p on p.id = p3.permohonan_id    
LEFT JOIN dokument d on d.jenazah_id = j.id 
left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id 
left join (select max(p.id) as id,p.dokument_id  FROM perpanjangan p group by p.dokument_id  ) as p4 on p4.dokument_id = d.id 
LEFT JOIN perpanjangan p2 on p2.id = p4.id
left join master_makam mm on mm.id = j.tpu  WHERE j.deleted = 0  and p.deleted = 0  and p.id = p2.permohonan_id and j.id =${req.params.id}`)
  const kec = await sql_enak.raw("SELECT id_kecamatan, kecamatan from kecamatan")
  console.log(data[0]);
  
  const kel_pemohon = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0].length>0?data[0][0].kecamatan_pemohon_id:0}`)
  const kel_jenazah = await sql_enak.raw(`SELECT * FROM kelurahan k WHERE k.id_kec =${data[0].length>0?data[0][0].kecamatan_jenazah_id:0}`)
  const lokasi = await sql_enak.raw(`SELECT * FROM master_makam mm  WHERE mm.deleted = 0  and mm.id = ${data[0][0].tpu} `)
  const blok = await sql_enak.raw(`SELECT DISTINCT  m.blok  as blok FROM makam m WHERE m.deleted = 0    and m.nama_tpu = '${data[0][0].nama_tpu}'`)
  const sub_blok = await sql_enak.raw(`SELECT m.id,m.sub_blok as subblok FROM makam m WHERE m.deleted = 0 and m.nama_tpu = '${data[0][0].nama_tpu}'  and m.blok =   '${data[0][0].blok}' `)
  const no_liang = await sql_enak.raw(`SELECT  j.nama_jenazah , mt.id,  x(centroid(SHAPE)) as x, y(centroid(SHAPE)) as y 
FROM makam m left JOIN  makam_tambahan mt on mt.makam_id = m.id 
left join (SELECT max(j.tanggal_meninggal ) as tanggal_meninggal,j.id,j.makam_id   from jenazah j where j.kategori_tpu =1 GROUP by j.makam_id ) as j2 on j2.makam_id = mt.id
left join jenazah j on j.id = j2.id 
WHERE mt.deleted = 0      AND j2.tanggal_meninggal <= DATE_SUB(CURDATE(), INTERVAL 3 YEAR) and m.nama_tpu = '${data[0][0].nama_tpu}'  and m.blok =   '${data[0][0].blok}'  and m.sub_blok  = '${data[0][0].sub_blok}'   order by j.nama_jenazah `)
  let x = sub_blok[0].sort((a,b)=>a.subblok.substring(1,a.subblok.length)-b.subblok.substring(1,b.subblok.length))
  // console.log(data[0][0]);
  res.render('content-backoffice/manajemen_data_jenazah/edit_special',{id:req.params.id ,tujuan:req.params.tujuan,kel_pemohon:kel_pemohon[0],kel_jenazah:kel_jenazah[0], data:data[0],kec:kec[0],lokasi:lokasi[0],blok:blok[0],sub_blok:x,no_liang:no_liang[0]}); 
});
router.get('/penandatangan', cek_login,async function(req, res) {
  let data = await sql_enak.raw(`SELECT * FROM penandatangan p WHERE p.deleted  = 0`)
  res.render('content-backoffice/manajemen_penandatangan/list',{data:data[0]}); 
});

router.get('/penandatangan/insert', cek_login,async function(req, res) {
  res.render('content-backoffice/manajemen_penandatangan/insert'); 
});

router.get('/penandatangan/edit/:id', cek_login,async function(req, res) {
  let data = await sql_enak.raw(`SELECT * FROM penandatangan p WHERE p.deleted  = 0 and p.id = ${req.params.id}`)

  res.render('content-backoffice/manajemen_penandatangan/edit',{data:data[0]}); 
});
router.post('/penandatangan/insert',cek_login,async function (req,res) {
  let post = req.body
  await sql_enak("penandatangan").insert(post).then(function (data) {
    res.redirect(`/manajemen_master/penandatangan`)
  }).catch(function (err) {
    res.json({res:500,err})
  })
})
router.post('/penandatangan/edit',cek_login,async function (req,res) {
  let post = req.body
  await sql_enak("penandatangan").where("id", "=", req.body.id).update(post).then(function (data) {
    res.redirect(`/manajemen_master/penandatangan`)
  }).catch(function (err) {
    res.json({res:500,err})
  })
})

router.get('/penandatangan/hapus/:id',cek_login,async function (req,res) {
  await sql_enak("penandatangan")
  .where("id", "=", req.params.id)
  .update({deleted:1,thisKeyIsSkipped: undefined,}).then(function (data) {
    res.redirect(`/manajemen_master/penandatangan`)
  }).catch(function (err) {
    res.json({res:500,err})
  })
})
module.exports = router;
