// Lanjutan migrasi_satuan_ke_tambahan.js: sisa makam satuan aktif di master khusus 5812/5820.
// Sebab tertinggal di script sebelumnya:
//  1. sub_blok satuan ditulis tanpa titik ('S4','UU'), poligon subblok pakai titik ('S.4','U.U') -> tidak cocok.
//  2. satuan yang id-nya sudah ada di makam_tambahan (dari migrasi pertama) dilewati, padahal satuannya
//     belum deleted=1 dan sebagian jenazahnya masih kategori_tpu=0.
// Aturan: satuan dicocokkan ke subblok (blok sama, sub_blok sama setelah titik/spasi dihilangkan, harus tepat 1).
// makam_tambahan.id = id satuan (jenazah.makam_id tidak berubah), jenazah.kategori_tpu=1, satuan deleted=1.
//
//   node migrasi_satuan_ke_tambahan_2.js          -> dry-run, hanya membaca dan menghitung
//   node migrasi_satuan_ke_tambahan_2.js --apply  -> menulis (cadangan: bak_khusus3_map, bak_khusus3_jenazah)
// Pembatalan: lihat bagian bawah.
require('dotenv').config({ path: __dirname + '/../../.env' })
const d = require('knex')({ client: 'mysql2', connection: { host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME } })
const apply = process.argv.includes('--apply')
const N = x => `upper(replace(replace(${x},'.',''),' ',''))`
const cocok = `from makam b where b.master_makam_id=s.master_makam_id and b.no_liang is null and b.deleted=0 and b.blok=s.blok and ${N('b.sub_blok')}=${N('s.sub_blok')}`
const kandidat = `select s.id satuan_id,
    coalesce((select mt.makam_id from makam_tambahan mt where mt.id=s.id), (select b.id ${cocok} limit 1)) blok_id,
    if(s.id in (select id from makam_tambahan), 'sudah_mt', 'baru') cara,
    (select count(*) ${cocok}) n_cocok
  from makam s where s.master_makam_id in (5812,5820) and s.deleted=0 and s.no_liang is not null`
;(async () => {
  const rows = (await d.raw(kandidat))[0]
  const layak = rows.filter(r => r.n_cocok == 1 && r.blok_id)
  const ringkas = {}
  for (const r of rows) { const k = r.cara + (layak.includes(r) ? '' : ' (dilewati)'); ringkas[k] = (ringkas[k] || 0) + 1 }
  console.log('satuan aktif:', rows.length, JSON.stringify(ringkas))
  const jz = (await d.raw(`select count(*) n from jenazah where kategori_tpu='0' and makam_id in (?)`, [layak.map(r => r.satuan_id).concat(0)]))[0][0].n
  console.log('jenazah kategori_tpu 0 yang akan dipindah:', jz)
  if (!apply) { console.log('\ndry-run, tidak ada yang ditulis. Jalankan dengan --apply untuk menulis.'); process.exit() }

  await d.raw(`create table bak_khusus3_map (satuan_id int primary key, blok_id int, cara varchar(10))`)
  await d('bak_khusus3_map').insert(layak.map(({ satuan_id, blok_id, cara }) => ({ satuan_id, blok_id, cara })))
  await d.raw(`create table bak_khusus3_jenazah as select id,kategori_tpu from jenazah where kategori_tpu='0' and makam_id in (select satuan_id from bak_khusus3_map)`)
  await d.transaction(async t => {
    const mt = await t.raw(`insert into makam_tambahan (id,makam_id,status_makam,jumlah_jenazah,status_tumpang,deleted,mtuuid)
      select s.id,x.blok_id,s.status_makam,s.jumlah_jenazah,s.status_tumpang,0,uuid() from bak_khusus3_map x join makam s on s.id=x.satuan_id where x.cara='baru'`)
    const j = await t.raw(`update jenazah set kategori_tpu='1' where id in (select id from bak_khusus3_jenazah)`)
    const m = await t.raw(`update makam set deleted=1 where id in (select satuan_id from bak_khusus3_map)`)
    console.log('makam_tambahan baru, jenazah dipindah, satuan deleted:', mt[0].affectedRows, j[0].affectedRows, m[0].affectedRows)
  })
  console.log('sisa satuan aktif:', JSON.stringify((await d.raw(`select master_makam_id,count(*) n from makam where master_makam_id in (5812,5820) and deleted=0 and no_liang is not null group by 1`))[0]))
  console.log('jenazah kategori 0 aktif di satuan deleted:', (await d.raw(`select count(*) n from jenazah j join makam m on m.id=j.makam_id where j.kategori_tpu='0' and j.deleted=0 and m.deleted=1 and m.master_makam_id in (5812,5820)`))[0][0].n)
  process.exit()
})().catch(e => { console.error(e.message); process.exit(1) })
// Pembatalan: update jenazah set kategori_tpu=(select kategori_tpu from bak_khusus3_jenazah b where b.id=jenazah.id) where id in (select id from bak_khusus3_jenazah);
//   delete from makam_tambahan where id in (select satuan_id from bak_khusus3_map where cara='baru'); update makam set deleted=0 where id in (select satuan_id from bak_khusus3_map);
