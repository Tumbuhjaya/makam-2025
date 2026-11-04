var connection = require('../database').connection;
var express = require('express');
var router = express.Router();
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , static = require('serve-static')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , path = require('path')
  , sha1 = require('sha1');
var sql_enak = require('../database/mysql_enak.js').connection;
var cek_login = require('./login').cek_login;
var cek_login_google = require('./login').cek_login_google;
var dbgeo = require("dbgeo");
var multer = require("multer");
var st = require('knex-postgis')(sql_enak);
var deasync = require('deasync');

path.join(__dirname, '/public/foto');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(cookieParser());
router.use(passport.initialize());
router.use(passport.session());

let table = 'kamar_penghuni';

router.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
});

var storage = require('../storage').storage;

var upload = multer({ storage: storage });

// ============================================================
//  ROUTER: async_jenazah
// ============================================================
router.post('/async_jenazah', upload.fields([{ name: 'foto_1', maxCount: 1 }, { name: 'foto_2', maxCount: 1 }]), async function (req, res) {
    let { makam_id_baru, jenazah_id, makam_id, status_tumpang } = req.body;

    try {
        // 1. Ambil data jenazah (parameterized)
        const jenazahSql = `
            SELECT p2.id as perpanjangan_id, d.id as dokument_id, j.id as jenazah_id, p.id as permohonan_id 
            FROM jenazah j  
            LEFT JOIN permohonan p ON j.id = p.jenazah_id AND p.deleted = 0
            LEFT JOIN dokument d ON d.jenazah_id = j.id AND d.deleted = 0
            LEFT JOIN (
                SELECT * FROM (
                    SELECT MAX(x.id) as idx FROM perpanjangan x WHERE x.deleted = 0 GROUP BY x.dokument_id
                ) as y 
                LEFT JOIN perpanjangan x2 ON x2.id = y.idx AND x2.deleted = 0 
            ) as p2 ON p2.dokument_id = d.id 
            LEFT JOIN makam m ON m.id = j.makam_id 
            LEFT JOIN kecamatan k ON k.id_kecamatan = m.id_kec  
            WHERE j.id = ? AND j.deleted = 0
        `;
        const jenazah = await sql_enak.raw(jenazahSql, [jenazah_id]);

        // 2. Hitung jumlah jenazah di makam baru (parameterized)
        const countSql = `SELECT COUNT(j.id) as jml FROM jenazah j WHERE j.makam_id = ? AND j.deleted = 0`;
        const jumlah_jenazah = await sql_enak.raw(countSql, [makam_id_baru || 0]);

        // 3. Update status perpanjangan (query builder aman)
        if (jenazah[0][0] && jenazah[0][0].perpanjangan_id) {
            await sql_enak('perpanjangan')
                .where('id', '=', jenazah[0][0].perpanjangan_id)
                .update({ status: 2 });
        }

        // 4. Proses sesuai kondisi
        if (makam_id && status_tumpang == 0) {
            // Update makam lama dengan data dari makam_jatisari_v3
            const updateSql = `
                UPDATE makam m 
                JOIN makam_jatisari_v3 AS mjv ON m.id = ? AND mjv.OGR_FID = ?
                SET m.SHAPE = mjv.SHAPE, m.blok = mjv.blok, m.no_liang = mjv.no_liang,
                    m.keterangan = mjv.keterangan, m.sub_blok = mjv.sub_blok,
                    m.kecamatan = mjv.kecamatan, m.agama = mjv.agama, m.id_kec = mjv.id_kec,
                    m.nama_tpu = mjv.nama_tpu, m.status_makam = 2, m.status_ijin = 0,
                    m.jumlah_jenazah = 1, m.join = 1
                WHERE m.id = ?
            `;
            await sql_enak.raw(updateSql, [makam_id, makam_id_baru, makam_id]);

            // Tandai makam_jatisari_v3 sebagai deleted (query builder aman)
            await sql_enak('makam_jatisari_v3').where('OGR_FID', '=', makam_id_baru).update({ deleted: 1 });

        } else if (status_tumpang == 1) {
            // Tumpang – update jumlah jenazah di makam baru
            const newJumlah = Number(jumlah_jenazah[0][0].jml) + 1;
            let updateSet = `m.jumlah_jenazah = ?`;
            let params = [newJumlah];
            if (status_tumpang == 1) {
                updateSet += `, m.status_tumpang = 1`;
            }
            const updateSql = `UPDATE makam m SET ${updateSet} WHERE m.id = ?`;
            params.push(makam_id_baru);
            await sql_enak.raw(updateSql, params);

            // Update permohonan dan jenazah (query builder aman)
            await sql_enak('permohonan').where('jenazah_id', '=', jenazah_id).update({ jns_pemakaman: 4 });
            await sql_enak('jenazah').where('id', '=', jenazah_id).update({ makam_id: makam_id_baru });

        } else {
            // Insert makam baru dari makam_jatisari_v3
            const insertSql = `
                INSERT INTO makam (SHAPE, blok, no_liang, keterangan, sub_blok, kecamatan, agama,
                                   id_kec, nama_tpu, status_makam, status_ijin, jumlah_jenazah, \`join\`, master_makam_id)
                SELECT mjv.SHAPE, mjv.blok, mjv.no_liang, mjv.keterangan, mjv.sub_blok,
                       mjv.kecamatan, mjv.agama, mjv.id_kec, mjv.nama_tpu, 2, 0, 1, 1, ?
                FROM makam_jatisari_v3 AS mjv
                WHERE mjv.OGR_FID = ?
            `;
            const result = await sql_enak.raw(insertSql, [req.user[0].master_makam_id, makam_id_baru]);
            const newMakamId = result[0].insertId;

            // Update jenazah dengan makam_id baru
            await sql_enak('jenazah').where('id', '=', jenazah_id).update({ makam_id: newMakamId });

            // Tandai makam_jatisari_v3 sebagai deleted
            await sql_enak('makam_jatisari_v3').where('OGR_FID', '=', makam_id_baru).update({ deleted: 1 });
        }

        res.status(200).json({ status: 200, message: "sukses" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "gagal", data: error.message });
    }
});

// ============================================================
//  ROUTER: cari_jenazah
// ============================================================
router.get('/cari_jenazah', cek_login, async function (req, res) {
    let { nama_jenazah } = req.query;
    let { id, limit, offset } = req.body;
    let value = [];
    let str = ` ORDER BY p.nama_jenazah `;
    let a = ` *, p.id as jenazah_id, DATE_FORMAT(p.tanggal_meninggal,'%d-%m-%Y') as tanggal_meninggal2,
              DATE_FORMAT(p.tanggal_meninggal,'%Y-%m-%d') as tanggal_meninggal,
              DATE_FORMAT(p.tanggal_dimakamkan,'%d-%m-%Y') as tanggal_dimakamkan2,
              DATE_FORMAT(p.tanggal_dimakamkan,'%Y-%m-%d') as tanggal_dimakamkan`;

    let searchParam = `%${nama_jenazah}%`;
    let masterMakamId = req.user[0].master_makam_id;

    let sql = `
        (
            SELECT ${a}
            FROM jenazah p
            LEFT JOIN makam m ON m.id = p.makam_id AND m.deleted = 0
            WHERE p.deleted = 0 AND (m.join IS NULL OR m.join = '')
              AND p.nama_jenazah LIKE ? AND ISNULL(p.makam_id)
            ${str}
        )
        UNION ALL
        (
            SELECT ${a}
            FROM jenazah p
            LEFT JOIN makam m ON m.id = p.makam_id AND m.deleted = 0
            WHERE p.deleted = 0 AND (m.join IS NULL OR m.join = '')
              AND p.nama_jenazah LIKE ? AND m.master_makam_id = ?
            ${str}
        )
    `;

    try {
        const data = await sql_enak.raw(sql, [searchParam, searchParam, masterMakamId]);
        res.status(200).json({ status: 200, message: "sukses", data: data[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "gagal", data: error.message });
    }
});

// ============================================================
//  ROUTER: reset_makam
// ============================================================
router.post('/reset_makam', cek_login, async function (req, res) {
    let { makam_id } = req.body;
    try {
        await sql_enak('jenazah').where('makam_id', '=', makam_id).update({ deleted: 1 });
        await sql_enak('makam').where('id', '=', makam_id).update({
            status_tumpang: 0,
            jns_makam: 0,
            jumlah_jenazah: 0,
            status_ijin: 0,
            status_makam: 0
        });
        res.status(200).json({ status: 200, message: "sukses" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "gagal", data: error.message });
    }
});

// ============================================================
//  ROUTER: pemakaman_khusus
// ============================================================
router.get('/pemakaman_khusus', cek_login, async function (req, res) {
    let params = [];
    let t_condition = '';
    let t2_condition = '';
    let o_condition = '';

    // Kondisi dari req.query.s
    if (req.query.s === 'a') {
        t_condition += ' AND p2.status = ?';
        t2_condition += ' AND x2.status = ?';
        params.push(2);
    } else if (req.query.s === 'ta') {
        t_condition += ' AND p2.status != ?';
        t2_condition += ' AND x2.status != ?';
        params.push(2);
    }

    // Kondisi jns_pemakaman
    if (req.query.jns_pemakaman) {
        t_condition += ' AND p.jns_pemakaman = ?';
        params.push(req.query.jns_pemakaman);
    }

    // Kondisi verifikasi_perpanjangan
    if (req.query.verifikasi_perpanjangan) {
        t_condition += ' AND j.verifikasi_perpanjangan = ?';
        params.push(req.query.verifikasi_perpanjangan);
    }

    // Kondisi admin (o)
    if (req.user[0].is_admin == 0) {
        o_condition = ' AND j.tpu = ?';
        params.push(req.user[0].master_makam_id);
    }

    const sql = `
        SELECT *,
            k.kecamatan AS kecamatan_pemohon,
            k3.desa AS kelurahan_pemohon,
            k2.kecamatan AS kecamatan_jenazah,
            k4.desa AS kelurahan_jenazah,
            k5.kecamatan AS kecamatan_tpu,
            CASE 
                WHEN p2.status_pembayaran = 0 THEN 'Belum Dibayar'
                WHEN p2.status_pembayaran = 1 THEN 'Sudah Dibayar'
            END as status_pembayaran,
            CASE 
                WHEN p2.status = 0 THEN 'Belum Diverifikasi'
                WHEN p2.status = 1 THEN (SELECT CONCAT('Revisi , ', p2.catatan_revisi))
                WHEN p2.status = 2 THEN 'Disetujui'
                WHEN p2.status = 3 THEN 'Dibatalkan'
                WHEN p2.status = 4 THEN 'Telah di revisi user'
            END as status_permohonan,
            DATE_FORMAT(j.inserted, '%d-%m-%Y') as inserted,
            DATE_FORMAT(j.tanggal_meninggal, '%d-%m-%Y') as tanggal_meninggal,
            DATE_FORMAT(j.tanggal_dimakamkan, '%d-%m-%Y') as tanggal_dimakamkan,
            p.id as permohonan_id,
            j.id as jenazah_id,
            d.id as dokument_id,
            p2.id as perpanjangan_id 
        FROM jenazah j  
        LEFT JOIN permohonan p ON j.id = p.jenazah_id AND p.deleted = 0
        LEFT JOIN dokument d ON d.jenazah_id = j.id AND d.deleted = 0
        LEFT JOIN master_makam mm ON mm.id = j.tpu AND mm.deleted = 0
        LEFT JOIN kecamatan k5 ON k5.id_kecamatan = mm.id_kec 
        LEFT JOIN (
            SELECT * FROM (
                SELECT MAX(x.id) as idx FROM perpanjangan x GROUP BY x.dokument_id
            ) as y 
            LEFT JOIN perpanjangan x2 ON x2.id = y.idx AND x2.deleted = 0 ${t2_condition}
        ) as p2 ON p2.dokument_id = d.id  
        LEFT JOIN kecamatan k ON k.id_kecamatan = p.kec_id 
        LEFT JOIN kecamatan k2 ON k2.id_kecamatan = j.kec_id 
        LEFT JOIN kelurahan k3 ON k3.id_kelurahan = p.kel_id 
        LEFT JOIN kelurahan k4 ON k4.id_kelurahan = j.kel_id 
        WHERE j.deleted = 0 AND p.deleted = 0 AND j.kategori_tpu = 1
          ${t_condition}
          AND p.deleted = 0
          ${o_condition}
          AND p.id = p2.permohonan_id
        ORDER BY p.id DESC
    `;

    try {
        const data = await sql_enak.raw(sql, params);
        res.json({ data: data[0], user: req.user[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "gagal", data: error.message });
    }
});

// ============================================================
//  ROUTER: insert_makam_tambahan
// ============================================================
router.get('/insert_makam_tambahan/:id', async function (req, res) {
    try {
        const masterId = req.params.id;
        let sqlSelect = `SELECT * FROM makam WHERE master_makam_id = ? AND deleted = 0`;
        const [rows] = await sql_enak.raw(sqlSelect, [masterId]);

        if (!rows || rows.length === 0) {
            return res.json('Tidak ada data makam untuk diproses');
        }

        // Loop insert
        for (let i = 0; i < rows.length; i++) {
            let item = rows[i];
            let sqlInsert = `
                INSERT INTO makam_tambahan 
                (id, makam_id, status_makam, jumlah_jenazah, status_tumpang, deleted)
                SELECT DISTINCT j.makam_id, ?, m.status_makam, m.jumlah_jenazah, m.status_tumpang, 0
                FROM jenazah j 
                LEFT JOIN makam m ON m.id = j.makam_id 
                WHERE m.master_makam_id = ? 
                  AND m.blok = ? 
                  AND m.sub_blok = REPLACE(?, '.', '')
                  AND m.id NOT IN (SELECT id FROM makam_tambahan)
            `;
            await sql_enak.raw(sqlInsert, [item.id, masterId, item.blok, item.sub_blok]);
        }

        // Update jenazah
        let sqlUpdate = `
            UPDATE jenazah j
            JOIN makam_tambahan mt ON j.makam_id = mt.id
            JOIN makam m ON mt.makam_id = m.id
            SET j.kategori_tpu = 1
            WHERE m.master_makam_id = ? AND m.deleted = 0
        `;
        await sql_enak.raw(sqlUpdate, [masterId]);

        // Update makam (tandai deleted)
        let sqlUpdate2 = `
            UPDATE makam 
            SET deleted = 1
            WHERE master_makam_id = ? AND no_liang IS NOT NULL AND no_liang != ''
        `;
        await sql_enak.raw(sqlUpdate2, [masterId]);

        // Update master_makam
        let sqlUpdate3 = `
            UPDATE master_makam 
            SET kategori_tpu = 1
            WHERE master_makam_id = ?
        `;
        await sql_enak.raw(sqlUpdate3, [masterId]);

        return res.json('selesai');

    } catch (error) {
        console.error("Error Detail:", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: error.message });
        }
    }
});

// ============================================================
//  ROUTER: jenazah/:id
// ============================================================
router.get('/jenazah/:id', async function (req, res) {
    try {
        let data = await sql_enak.raw(`SELECT * FROM jenazah j WHERE j.id = ? AND j.deleted = 0`, [req.params.id]);
        return res.status(200).json({ data: data[0] });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// ============================================================
//  ROUTER: permohonan
// ============================================================
router.post('/permohonan', async function (req, res) {
    let { jenazah_id, permohonan_id } = req.body;
    let tambahan = '';
    let val = [];

    if (jenazah_id) {
        tambahan += ` AND p.jenazah_id = ? `;
        val.push(jenazah_id);
    }
    if (permohonan_id) {
        tambahan += ` AND p.id = ? `;
        val.push(permohonan_id);
    }

    try {
        let data = await sql_enak.raw(`
            SELECT *, p.id as permohonan_id
            FROM permohonan p
            LEFT JOIN jenazah j ON p.jenazah_id = j.id
            WHERE p.deleted = 0 ${tambahan}
        `, val);
        return res.status(200).json({ data: data[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;