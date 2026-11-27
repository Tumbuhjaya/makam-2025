// Pindahkan jenazah di makam satuan (master khusus 5812/5820) yang belum tersambung ke makam_tambahan.
// Blok ditentukan: 1) blok+sub_blok sama, 2) kalau tidak ada, titik tengah satuan berada di dalam satu blok.
// makam_tambahan.id = id satuan (jenazah.makam_id tidak berubah), jenazah.kategori_tpu=1, satuan ditandai deleted=1.
// Cadangan: bak_khusus2_map, bak_khusus2_jenazah. Pembatalan: lihat bagian bawah.
require('dotenv').config({ path: __dirname + '/../../.env' })
const d = require('knex')({ client: 'mysql2', connection: { host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME } })
const kandidat = `from makam s where s.master_makam_id in (5812,5820) and s.deleted=0 and s.id<92107 and s.no_liang is not null
  and s.id not in (select id from makam_tambahan)
  and exists (select 1 from jenazah j where j.makam_id=s.id and j.kategori_tpu='0')`
;(async () => {
  await d.raw(`create table bak_khusus2_map (satuan_id int primary key, blok_id int, cara varchar(10))`)
  await d.raw(`insert into bak_khusus2_map select s.id,(select b.id from makam b where b.id>=92107 and b.master_makam_id=s.master_makam_id and b.blok=s.blok and b.sub_blok=s.sub_blok limit 1),'nama' ${kandidat}`)
  await d.raw(`update bak_khusus2_map x join makam s on s.id=x.satuan_id set x.blok_id=(select b.id from makam b where b.id>=92107 and b.master_makam_id=s.master_makam_id and ST_Contains(ST_SRID(b.SHAPE,0),ST_Centroid(ST_SRID(s.SHAPE,0))) limit 1), x.cara='peta' where x.blok_id is null`)
  // satuan yang menyentuh lebih dari satu blok dianggap ambigu -> dilepas
  await d.raw(`update bak_khusus2_map x join makam s on s.id=x.satuan_id set x.blok_id=null where x.cara='peta' and (select count(*) from makam b where b.id>=92107 and b.master_makam_id=s.master_makam_id and ST_Contains(ST_SRID(b.SHAPE,0),ST_Centroid(ST_SRID(s.SHAPE,0))))<>1`)
  const r = (await d.raw(`select cara,blok_id is not null ada,count(*) n from bak_khusus2_map group by 1,2`))[0]
  console.log('kandidat:', JSON.stringify(r))
  await d.raw(`delete from bak_khusus2_map where blok_id is null`)
  await d.raw(`create table bak_khusus2_jenazah as select id,kategori_tpu from jenazah where kategori_tpu='0' and makam_id in (select satuan_id from bak_khusus2_map)`)
  await d.transaction(async t => {
    await t.raw(`insert into makam_tambahan (id,makam_id,status_makam,jumlah_jenazah,status_tumpang,deleted,mtuuid)
      select s.id,x.blok_id,s.status_makam,s.jumlah_jenazah,s.status_tumpang,0,uuid() from bak_khusus2_map x join makam s on s.id=x.satuan_id`)
    const j = await t.raw(`update jenazah set kategori_tpu='1' where id in (select id from bak_khusus2_jenazah)`)
    const m = await t.raw(`update makam set deleted=1 where id in (select satuan_id from bak_khusus2_map)`)
    console.log('makam_tambahan baru + jenazah dipindah + satuan deleted:', (await t.raw('select count(*) n from bak_khusus2_map'))[0][0].n, j[0].affectedRows, m[0].affectedRows)
  })
  console.log('sisa satuan aktif:', JSON.stringify((await d.raw(`select master_makam_id,count(*) n from makam where master_makam_id in (5812,5820) and deleted=0 and id<92107 group by 1`))[0]))
  console.log('jenazah kategori 0 aktif di satuan deleted:', (await d.raw(`select count(*) n from jenazah j join makam m on m.id=j.makam_id where j.kategori_tpu='0' and j.deleted=0 and m.deleted=1 and m.master_makam_id in (5812,5820)`))[0][0].n)
  process.exit()
})().catch(e => { console.error(e.message); process.exit(1) })
// Pembatalan: update jenazah set kategori_tpu=(select kategori_tpu from bak_khusus2_jenazah b where b.id=jenazah.id) where id in (select id from bak_khusus2_jenazah);
//   delete from makam_tambahan where id in (select satuan_id from bak_khusus2_map); update makam set deleted=0 where id in (select satuan_id from bak_khusus2_map);
