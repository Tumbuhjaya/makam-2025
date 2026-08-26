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
  let table = 'kamar_penghuni'
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
// router.post('/insert', upload.fields([{ name: 'foto_1', maxCount: 1 }, { name: 'foto_2', maxCount: 1 }]),async function(req, res) {

//   let post = req.body

//   post.insertedAt = new Date()
//   post.lastUpdateAt = new Date()
//  if (req.files) {
//   if (req.files['foto_1']) {
//     var nama_file = req.files['foto_1'][0].filename;
//     post['foto_1'] = nama_file;
//   }

//   if (req.files['foto_2']) {
//     var nama_file = req.files['foto_2'][0].filename;
//     post['foto_2'] = nama_file;
//   }
// }
// await sql_enak.insert(post).into(table).then(data=>{
//     res.status(200).json({ status: 200, message: "sukses", data: data})
//  })
//  .catch(err=>{
//   console.log(err,'err');
//     res.status(500).json({ status: 500, message: "gagal", data: err})
//  })
// });
// router.post('/edit', upload.fields([{ name: 'foto_1', maxCount: 1 }, { name: 'foto_2', maxCount: 1 }]),async function(req, res) {
//   let post = req.body
//   post.lastUpdateAt = new Date()
//   if (req.files) {
//     if (req.files['foto_1']) {
//       var nama_file = req.files['foto_1'][0].filename;
//       post['foto_1'] = nama_file;
//     }
  
//     if (req.files['foto_2']) {
//       var nama_file = req.files['foto_2'][0].filename;
//       post['foto_2'] = nama_file;
//     }
//   }
//   await sql_enak(table).where(table+'_id','=',post[table+'_id']).update(post).then(data=>{
//     res.status(200).json({ status: 200, message: "sukses", data: data})
//  })
//  .catch(err=>{
//     res.status(500).json({ status: 500, message: "gagal", data: err})
//  })
// })
// router.get('/hapus/:id',async function(req, res) {
//   await sql_enak(table).where(table+'_id','=',req.params.id).update({deletedAt:new Date}).then(data=>{
//     res.status(200).json({ status: 200, message: "sukses", data: data[0]})
//  })
//  .catch(err=>{
//     res.status(500).json({ status: 500, message: "gagal", data: err})
//  })
// })
// router.post('/list',async function(req, res) {
//   let {id,limit,offset}  = req.body
//   let value = [0]
//   let str =` and p.${table}_id > ?`
//   let a = `  *, DATE_FORMAT(p.insertedAt,'%d-%m-%Y') as tanggal  , DATE_FORMAT(p.insertedAt ,'%Y-%m-%d') as tanggal_2     `

//   if (id) {
//       str += ` and p. ${table}_id = ?`

//       value.push(id)
//   }
//   str+='  ORDER BY p.insertedAt DESC '

//    if (limit) {
//     str += ` limit ${limit} `
//   }
//   if (offset) {
//     str += ` offset ${offset} `
//   }

//   let sql = `SELECT  ${a}  FROM  ${table} p  WHERE ISNULL(p.deletedAt) `+str
//     await sql_enak.raw(sql,value).then(data=>{
//       res.status(200).json({ status: 200, message: "sukses", data: data[0]})
//    })
//    .catch(err=>{
//     console.log(err);
//       res.status(500).json({ status: 500, message: "gagal", data: err})
//    })
// })
// router.get('/list',async function(req, res) {
//   let value = [0]
//   let str =` and p.${table}_id > ?`
//   let a = `  *, DATE_FORMAT(p.insertedAt,'%d-%m-%Y') as tanggal , DATE_FORMAT(p.insertedAt ,'%Y-%m-%d') as tanggal_2     `
//   if (req.query.id) {
//       str += ` and p. ${table}_id = ?`

//       value.push(req.query.id)
//   }
//   str+='  ORDER BY p.insertedAt DESC '

//   if (req.query.limit) {
//     str += ` limit ${req.query.limit} `
//   }
//   if (req.query.offset) {
//     str += ` offset ${req.query.offset} `
//   }

//   let sql = `SELECT  ${a}  FROM ${table} p  WHERE ISNULL(p.deletedAt) `+str
//     await sql_enak.raw(sql,value).then(data=>{
//       res.status(200).json({ status: 200, message: "sukses", data: data[0]})
//    })
//    .catch(err=>{
//     console.log(err);
//       res.status(500).json({ status: 500, message: "gagal", data: err})
//    })
// })
router.post('/async_jenazah', upload.fields([{ name: 'foto_1', maxCount: 1 }, { name: 'foto_2', maxCount: 1 }]),async function(req, res) {
  let {makam_id_baru,jenazah_id,makam_id,status_tumpang} = req.body
  console.log(makam_id_baru,jenazah_id,makam_id,status_tumpang);
  
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
  console.log(jenazah[0][0].perpanjangan_id , jenazah[0]);
    let jumlah_jenazah = await sql_enak.raw(`select count(j.id) as jml from jenazah j where j.makam_id =${makam_id_baru||0} and j.deleted = 0`)

             await sql_enak('perpanjangan').where('id','=',jenazah[0][0].perpanjangan_id).update({status:2})

    try {
      let sql = ''
      if (makam_id&&status_tumpang==0) {
                  console.log('if',1);

         sql = `UPDATE makam m JOIN makam_jatisari_v3 AS mjv
  ON m.id = ${makam_id} AND mjv.OGR_FID = ${makam_id_baru}
SET m.SHAPE = mjv.SHAPE, m.blok = mjv.blok ,m.no_liang = mjv.no_liang 
,m.keterangan = mjv.keterangan ,m.sub_blok = mjv.sub_blok ,m.kecamatan = mjv.kecamatan ,m.agama = mjv.agama ,m.id_kec = mjv.id_kec 
,m.nama_tpu = mjv.nama_tpu 
, m.status_makam=2, m.status_ijin=0, m.jumlah_jenazah=1,m.join=1
WHERE m.id=${makam_id};`
      }else if ( status_tumpang ==1) {
                  console.log('if',1,12);

               sql = `UPDATE makam m set m.jumlah_jenazah=${Number(jumlah_jenazah[0][0].jml)+1} ${status_tumpang?', m.status_tumpang=1 ':''}
WHERE m.id=${makam_id_baru};`
      }else{
                          console.log('else',1,12);

        sql = 'INSERT INTO makam ( SHAPE, blok, no_liang, keterangan, sub_blok, kecamatan, agama, id_kec, nama_tpu, status_makam, status_ijin, jumlah_jenazah, `join`,master_makam_id) SELECT mjv.SHAPE, mjv.blok, mjv.no_liang, mjv.keterangan, mjv.sub_blok, mjv.kecamatan, mjv.agama, mjv.id_kec, mjv.nama_tpu, 2, 0, 1, 1,'+req.user[0].master_makam_id +' FROM makam_jatisari_v3 AS mjv WHERE mjv.OGR_FID ='+makam_id_baru 
      }

console.log(sql);
      if (makam_id&&status_tumpang==0) {
    console.log('if',2);

     await sql_enak.raw(sql)
           await sql_enak('makam_jatisari_v3').where('OGR_FID','=',makam_id_baru).update({deleted:1})
      }else if ( status_tumpang ==1) {
  console.log('if',3,{jns_pemakaman:4},{makam_id:makam_id_baru});
               await sql_enak('permohonan').where('jenazah_id','=',jenazah_id).update({jns_pemakaman:4})

    await sql_enak('jenazah').where('id','=',jenazah_id).update({makam_id:makam_id_baru})
}else{
    console.log('if',4);

  let data = await sql_enak.raw(sql)
  console.log(makam_id_baru,jenazah_id,makam_id,data[0].insertId);
  
             await sql_enak('jenazah').where('id','=',jenazah_id).update({makam_id:data[0].insertId})

           await sql_enak('makam_jatisari_v3').where('OGR_FID','=',makam_id_baru).update({deleted:1})
}
   

res.status(200).json({ status: 200, message: "sukses"})

    } catch (error) {
      console.log(error);
      
          res.status(500).json({ status: 500, message: "gagal", data: error})

    }

})

router.get('/cari_jenazah',cek_login,async function(req, res) {
    let {nama_jenazah} = req.query
    let {id,limit,offset}  = req.body
  let value = []
  let str =` `
  let a = ` *,p.id as jenazah_id , DATE_FORMAT(p.tanggal_meninggal,'%d-%m-%Y') as tanggal_meninggal2 , DATE_FORMAT(p.tanggal_meninggal,'%Y-%m-%d') as tanggal_meninggal  , DATE_FORMAT(p.tanggal_dimakamkan,'%d-%m-%Y') as tanggal_dimakamkan2 , DATE_FORMAT(p.tanggal_dimakamkan,'%Y-%m-%d') as tanggal_dimakamkan`

  str+='  ORDER BY p.nama_jenazah  '


  let sql = ` (
    SELECT ${a}
    FROM  jenazah p     LEFT JOIN makam m ON m.id = p.makam_id AND m.deleted = 0
    WHERE p.deleted = 0 and ( m.join is null or m.join ='') and p.nama_jenazah like '%${nama_jenazah}%' AND ISNULL(p.makam_id)   ${str}
)
UNION ALL
(
    SELECT ${a}
    FROM  jenazah p
    LEFT JOIN makam m ON m.id = p.makam_id AND m.deleted = 0
    WHERE p.deleted = 0 and ( m.join is null or m.join ='') and p.nama_jenazah like '%${nama_jenazah}%' AND m.master_makam_id = ${req.user[0].master_makam_id} ${str}
);`
//   let data = await sql_enak.raw(`select j.id as jenazah_id,j.nama_jenazah ,m.id as makam_id,m.blok,m.sub_blok,m.no_liang,DATE_FORMAT(j.tanggal_meninggal,'%d-%M-%Y') as tanggal_meninggal from jenazah j left join makam m on m.id = j.makam_id and m.deleted =0 
// where j.deleted = 0 and m.nama_tpu ='TPU JATISARI' and j.nama_jenazah like '%${nama_jenazah}%' and ( m.join is null or m.join ='') `)
try {
  let data = await sql_enak.raw(sql,value)
           res.status(200).json({ status: 200, message: "sukses", data: data[0]})

} catch (error) {
  console.log(error);
  
            res.status(500).json({ status: 500, message: "gagal", data: error})

}
  })
router.post('/reset_makam',cek_login,async function(req, res) {
  let {makam_id} = req.body
try {
             await sql_enak('jenazah').where('makam_id','=',makam_id).update({deleted:1})
                          await sql_enak('makam').where('id','=',makam_id).update({status_tumpang:0,jns_makam:0,jumlah_jenazah:0,status_ijin:0,status_makam:0})

           res.status(200).json({ status: 200, message: "sukses"})

} catch (error) {
  console.log(error);
  
            res.status(500).json({ status: 500, message: "gagal", data: error})

}
  })
router.get('/pemakaman_khusus', cek_login,async function(req, res) {
  let o = ''
  if (req.user[0].is_admin==0) {
    o+=` and  j.tpu = ${req.user[0].master_makam_id}`
  }
  let t =''
  let t2 =''
  if (req.query.s == 'a') {
    t = ` AND p2.status = 2 `
    t2 = ` and x2.status = 2 `
  }else if (req.query.s == 'ta') {
    t = ` AND p2.status != 2 `
    t2 = ` and x2.status != 2 `
  }
  if (req.query.jns_pemakaman) {
    t = ` AND p.jns_pemakaman = ${req.query.jns_pemakaman} `
  }
    if (req.query.verifikasi_perpanjangan) {
    t = ` AND j.verifikasi_perpanjangan = ${req.query.verifikasi_perpanjangan} `
  }
  // console.log(req.user[0]);
  const data = await sql_enak.raw(`SELECT *,
  k.kecamatan AS kecamatan_pemohon,
  k3.desa AS kelurahan_pemohon,
  k2.kecamatan AS kecamatan_jenazah,
  k4.desa AS kelurahan_jenazah,
  k5.kecamatan AS kecamatan_tpu
    ,CASE 
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
  ,DATE_FORMAT(j.inserted , '%d-%m-%Y') as inserted ,DATE_FORMAT(j.tanggal_meninggal  , '%d-%m-%Y') as tanggal_meninggal,DATE_FORMAT(j.tanggal_dimakamkan  , '%d-%m-%Y') as tanggal_dimakamkan,p.id as permohonan_id , j.id as jenazah_id , d.id as dokument_id,p2.id as perpanjangan_id 
  from  jenazah j  
  left join permohonan p on j.id = p.jenazah_id   and p.deleted = 0
  LEFT JOIN dokument d on d.jenazah_id = j.id  and d.deleted = 0
  LEFT JOIN master_makam mm ON mm.id = j.tpu
  AND mm.deleted = 0
    LEFT JOIN kecamatan k5 ON k5.id_kecamatan = mm.id_kec 
      left join  (SELECT *  from (SELECT  MAX(x.id) as idx    FROM 
  perpanjangan x  GROUP BY x.dokument_id ) as y left join perpanjangan x2 on x2.id = y.idx and x2.deleted = 0 ${t2}) as  p2 on p2.dokument_id =d.id  
   left join kecamatan k on k.id_kecamatan = p.kec_id 
left join kecamatan k2 on k2.id_kecamatan = j.kec_id 
left join kelurahan k3 on k3.id_kelurahan = p.kel_id 
left join kelurahan k4 on k4.id_kelurahan = j. kel_id 
WHERE   j.deleted = 0 and p.deleted = 0 and j.kategori_tpu = 1 ${t}  and p.deleted = 0 ${o}    and p.id = p2.permohonan_id  order by p.id desc`)
    res.json({data:data[0],user:req.user[0]})
});
router.get('/insert_makam_tambahan/:id', async function(req, res) {
    try {
        const masterId = req.params.id;
        let sqlSelect = `SELECT * FROM makam WHERE master_makam_id = ? AND deleted = 0`;
        const [rows] = await sql_enak.raw(sqlSelect, [masterId]);

        if (!rows || rows.length === 0) {
            return res.json('Tidak ada data makam untuk diproses');
        }

        // 1. Jalankan Loop Insert
        for (let i = 0; i < rows.length; i++) {
            let item = rows[i];
            
            let sqlInsert = `
                INSERT INTO makam_tambahan 
                (id, makam_id, status_makam, jumlah_jenazah, status_tumpang, deleted)
                SELECT DISTINCT j.makam_id, 
                    ?,        
                    m.status_makam, 
                    m.jumlah_jenazah, 
                    m.status_tumpang, 
                    0 AS deleted               
                FROM jenazah j 
                LEFT JOIN makam m ON m.id = j.makam_id 
                WHERE m.master_makam_id = ? 
                  AND m.blok = ? 
                  AND m.sub_blok = REPLACE(?, '.', '')
                  AND m.id NOT IN (SELECT id FROM makam_tambahan)
            `;

            await sql_enak.raw(sqlInsert, [item.id, masterId, item.blok, item.sub_blok]);
        }

        // 2. Jalankan Update setelah Loop selesai (di luar for)
        let sqlUpdate = `
            UPDATE jenazah j
            JOIN makam_tambahan mt ON j.makam_id = mt.id
            JOIN makam m ON mt.makam_id = m.id
            SET j.kategori_tpu = 1
            WHERE m.master_makam_id = ?
              AND m.deleted = 0
        `;
        await sql_enak.raw(sqlUpdate, [masterId]);
          let sqlUpdate2 = `
          UPDATE makam 
          SET deleted = 1
          WHERE master_makam_id = ? and no_liang is not null and no_liang != ''
        `;
        await sql_enak.raw(sqlUpdate2, [masterId]);
           let sqlUpdate3 = `
          UPDATE master_makam 
          SET kategori_tpu = 1
          WHERE master_makam_id = ? 
        `;
        await sql_enak.raw(sqlUpdate3, [masterId]);
        // 3. Berikan respons
        return res.json('selesai');

    } catch (error) {
        console.error("Error Detail:", error);
        // Pastikan memberikan respons meskipun error agar client tidak hang
        if (!res.headersSent) {
            return res.status(500).json({ error: error.message });
        }
    }
});
router.get('/jenazah/:id',async function(req, res) {
  try {
        let data = await sql_enak.raw(`SELECT * from jenazah j where j.id = ? and j.deleted =0`,[req.params.id])
                        return res.status(200).json({ data:data[0] });


  } catch (error) {
                return res.status(500).json({ error });

  }

})
router.post('/permohonan',async function(req, res) {
  let  {jenazah_id , permohonan_id} = req.body
  let tambahan = ''
  let val = []
  console.log('aaaaaaaaaaaaaaaaaaaaaa');
  
  if (jenazah_id) {
    tambahan += ` and p.jenazah_id = ? `
    val.push(jenazah_id)
  }
    if (permohonan_id) {
    tambahan += ` and p.id = ? `
    val.push(permohonan_id)
  }
  try {
        let data = await sql_enak.raw(`SELECT *,p.id as permohonan_id from permohonan p left join jenazah j on p.jenazah_id = j.id  where  p.deleted =0 ${tambahan}`,val)
        console.log(data[0]);
                  
        return res.status(200).json({ data:data[0] });


  } catch (error) {
    console.log(error);
    
                return res.status(500).json({ error });

  }

})
module.exports = router;
