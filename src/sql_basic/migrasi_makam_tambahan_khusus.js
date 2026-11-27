// Migrasi poligon blok + makam_tambahan untuk TPU khusus (master 5812 Sompok Kesambi, 5820 Bergota)
// dari transit_makam_smg_13012026 (MySQL 5.7) ke database aplikasi (DB_* di .env, MySQL 8).
//
//   node migrasi_makam_tambahan_khusus.js             -> dry-run, hanya membaca dan menghitung
//   node migrasi_makam_tambahan_khusus.js --apply     -> menulis ke database aplikasi
//   node migrasi_makam_tambahan_khusus.js --rollback  -> membatalkan hasil --apply
//
// Koneksi transit lewat env: TRANSIT_HOST, TRANSIT_PORT, TRANSIT_USER, TRANSIT_PASSWORD, TRANSIT_DB
//
// Yang dilakukan --apply:
//  1. 175 poligon blok (no_liang NULL) disisipkan ke makam dengan id baru; pemetaan id lama -> baru
//     disimpan di tabel bak_khusus_map_blok.
//  2. makam_tambahan diisi dengan id SAMA seperti jenazah.makam_id saat ini, makam_id-nya ke blok baru.
//  3. jenazah tersambung diubah kategori_tpu = 1 (nilai lama disimpan di bak_khusus_jenazah).
// Dilewati: jenazah yang makam_id-nya di database aplikasi berbeda dari transit, jenazah tanpa baris
// makam_tambahan di transit, dan jenazah baru yang tidak ada di transit.

require('dotenv').config({ path: __dirname + '/../../.env' })
const crypto = require('crypto')
const knex = require('knex')

const MASTER_KHUSUS = [5812, 5820]
const mode = process.argv.includes('--apply') ? 'apply' : process.argv.includes('--rollback') ? 'rollback' : 'dry'

const transit = knex({ client: 'mysql2', connection: {
  host: process.env.TRANSIT_HOST || process.env.DB_HOST,
  port: process.env.TRANSIT_PORT || 3306,
  user: process.env.TRANSIT_USER || process.env.DB_USER,
  password: process.env.TRANSIT_PASSWORD,
  database: process.env.TRANSIT_DB || 'transit_makam_smg_13012026' } })
const app = knex({ client: 'mysql2', connection: {
  host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME } })

const kolomMakam = ['blok', 'no_liang', 'keterangan', 'sub_blok', 'kecamatan', 'agama', 'id_kec', 'nama_tpu',
  'status_makam', 'status_ijin', 'jumlah_jenazah', 'jns_makam', 'deleted', 'status_tumpang', 'master_makam_id',
  'join', 'keterangan_pengelola', 'hex']

async function rollback() {
  const map = (await app.raw('select old_id,new_id from bak_khusus_map_blok'))[0]
  const jz = (await app.raw('select id,kategori_tpu from bak_khusus_jenazah'))[0]
  await app.transaction(async trx => {
    for (const j of jz) await trx('jenazah').where('id', j.id).update({ kategori_tpu: j.kategori_tpu })
    if (jz.length) await trx('makam_tambahan').whereIn('id', (await trx.raw('select id from bak_khusus_mt'))[0].map(x => x.id)).del()
    if (map.length) await trx('makam').whereIn('id', map.map(m => m.new_id)).del()
  })
  console.log('rollback selesai:', jz.length, 'jenazah dikembalikan,', map.length, 'blok dihapus')
}

async function main() {
  if (mode === 'rollback') return rollback()

  // ---- baca transit ----
  const blok = (await transit.raw(
    `select id, master_makam_id, ${kolomMakam.filter(k => k !== 'master_makam_id').map(k => '`' + k + '`').join(',')},
            hex(ST_AsBinary(SHAPE)) as wkb
     from makam where no_liang is null and deleted = 0 and master_makam_id in (?)`, [MASTER_KHUSUS]))[0]
  const jenazahT = (await transit.raw(
    `select j.id jid, j.makam_id mt_id, mt.makam_id blok_id, mt.status_makam, mt.jumlah_jenazah, mt.status_tumpang,
            mt.deleted, mt.mtuuid
     from jenazah j join makam_tambahan mt on mt.id = j.makam_id where j.kategori_tpu = 1`))[0]
  const blokIds = new Set(blok.map(b => b.id))
  const kandidat = jenazahT.filter(j => blokIds.has(j.blok_id))

  // ---- bandingkan dengan database aplikasi ----
  const jenazahA = new Map((await app.raw(
    `select id, makam_id, kategori_tpu from jenazah where id in (?)`, [kandidat.map(j => j.jid)]))[0].map(j => [j.id, j]))
  const layak = [], beda = [], hilang = []
  for (const j of kandidat) {
    const a = jenazahA.get(j.jid)
    if (!a) hilang.push(j.jid)
    else if (a.makam_id !== j.mt_id) beda.push(j.jid)
    else layak.push(j)
  }
  const mtLayak = new Map()
  for (const j of layak) if (!mtLayak.has(j.mt_id)) mtLayak.set(j.mt_id, j)

  const mtAda = (await app.raw('select count(*) n from makam_tambahan'))[0][0].n
  const mmuuid = Object.fromEntries((await app.raw('select id,mmuuid from master_makam where id in (?)', [MASTER_KHUSUS]))[0].map(m => [m.id, m.mmuuid]))

  console.log('blok khusus di transit        :', blok.length)
  console.log('jenazah khusus di transit     :', jenazahT.length, '(tersambung ke blok di atas:', kandidat.length + ')')
  console.log('layak disambung               :', layak.length, 'jenazah ->', mtLayak.size, 'baris makam_tambahan')
  console.log('dilewati: makam_id beda       :', beda.length)
  console.log('dilewati: tidak ada di aplikasi:', hilang.length)
  console.log('makam_tambahan di aplikasi    :', mtAda, mtAda ? '<-- harus 0' : '(kosong, ok)')
  if (mode === 'dry') return console.log('\ndry-run, tidak ada yang ditulis. Jalankan dengan --apply untuk menulis.')
  if (mtAda) throw new Error('makam_tambahan tidak kosong, batal')

  // ---- tulis ----
  await app.raw('create table bak_khusus_map_blok (old_id int, new_id int)')
  await app.raw('create table bak_khusus_jenazah (id int, kategori_tpu varchar(100))')
  await app.raw('create table bak_khusus_mt (id int)')
  await app.transaction(async trx => {
    const map = new Map()
    for (const b of blok) {
      const v = {}
      for (const k of kolomMakam) v[k] = b[k]
      v.muuid = crypto.randomUUID()
      v.mmuuid = mmuuid[b.master_makam_id]
      const cols = Object.keys(v).map(() => '??').join(',')
      const r = await trx.raw(`insert into makam (${cols}, SHAPE) values (${Object.keys(v).map(() => '?').join(',')}, ST_GeomFromWKB(UNHEX(?), 0))`,
        [...Object.keys(v), ...Object.values(v), b.wkb])
      map.set(b.id, r[0].insertId)
      await trx('bak_khusus_map_blok').insert({ old_id: b.id, new_id: r[0].insertId })
    }
    for (const [mtId, j] of mtLayak) {
      await trx('makam_tambahan').insert({ id: mtId, makam_id: map.get(j.blok_id), status_makam: j.status_makam,
        jumlah_jenazah: j.jumlah_jenazah, status_tumpang: j.status_tumpang, deleted: j.deleted, mtuuid: j.mtuuid })
      await trx('bak_khusus_mt').insert({ id: mtId })
    }
    for (const j of layak) {
      await trx('bak_khusus_jenazah').insert({ id: j.jid, kategori_tpu: jenazahA.get(j.jid).kategori_tpu })
      await trx('jenazah').where('id', j.jid).update({ kategori_tpu: 1 })
    }
  })
  const cek = (await app.raw(`select (select count(*) from makam_tambahan) mt, (select count(*) from bak_khusus_map_blok) blok,
    (select count(*) from jenazah j join makam_tambahan mt on mt.id=j.makam_id where j.kategori_tpu=1) tersambung`))[0][0]
  console.log('\nselesai:', cek)
}

main().catch(e => { console.error(e.message); process.exitCode = 1 }).finally(() => { transit.destroy(); app.destroy() })
