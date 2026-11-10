-- Isi UUID yang masih kosong + sambungkan UUID relasi antar tabel.
-- Jalankan SETELAH migrasi_struktur_A_ke_B.sql. Aman dijalankan ulang:
-- hanya mengisi yang kosong (NULL / '') dan menyamakan UUID relasi dengan induknya.
-- Backup dulu sebelum menjalankan di server. Pilih database dulu (USE nama_db;).
--
-- Relasi yang disambungkan:
--   makam.mmuuid         <- master_makam.mmuuid  (makam.master_makam_id = master_makam.id)
--   kelurahan.kcuuid     <- kecamatan.kcuuid     (kelurahan.id_kec      = kecamatan.id_kecamatan)
--   dokument.juuid       <- jenazah.juuid        (dokument.jenazah_id   = jenazah.id)
--   permohonan.juuid     <- jenazah.juuid        (permohonan.jenazah_id = jenazah.id)
--   perpanjangan.duuid   <- dokument.duuid       (perpanjangan.dokument_id = dokument.id)

-- =========================================================
-- 1. UUID milik tabel sendiri (UUID() menghasilkan nilai beda per baris)
-- =========================================================

UPDATE master_makam     SET mmuuid  = UUID() WHERE mmuuid  IS NULL OR mmuuid  = '';
UPDATE makam            SET muuid   = UUID() WHERE muuid   IS NULL OR muuid   = '';
UPDATE kecamatan        SET kcuuid  = UUID() WHERE kcuuid  IS NULL OR kcuuid  = '';
UPDATE kelurahan        SET kluuid  = UUID() WHERE kluuid  IS NULL OR kluuid  = '';
UPDATE jenazah          SET juuid   = UUID() WHERE juuid   IS NULL OR juuid   = '';
UPDATE dokument         SET duuid   = UUID() WHERE duuid   IS NULL OR duuid   = '';
UPDATE permohonan       SET puuid   = UUID() WHERE puuid   IS NULL OR puuid   = '';
UPDATE perpanjangan     SET pjuuid  = UUID() WHERE pjuuid  IS NULL OR pjuuid  = '';
UPDATE master_retribusi SET ruuid   = UUID() WHERE ruuid   IS NULL OR ruuid   = '';
UPDATE penandatangan    SET pttuuid = UUID() WHERE pttuuid IS NULL OR pttuuid = '';
UPDATE makam_tambahan   SET mtuuid  = UUID() WHERE mtuuid  IS NULL OR mtuuid  = '';
UPDATE `user`           SET uuuid   = UUID() WHERE uuuid   IS NULL OR uuuid   = '';

-- =========================================================
-- 2. UUID relasi: salin dari tabel induk (harus setelah langkah 1)
-- =========================================================

UPDATE makam m
  JOIN master_makam mm ON mm.id = m.master_makam_id
   SET m.mmuuid = mm.mmuuid
 WHERE NOT (m.mmuuid <=> mm.mmuuid);

UPDATE kelurahan kl
  JOIN kecamatan kc ON kc.id_kecamatan = kl.id_kec
   SET kl.kcuuid = kc.kcuuid
 WHERE NOT (kl.kcuuid <=> kc.kcuuid);

UPDATE dokument d
  JOIN jenazah j ON j.id = d.jenazah_id
   SET d.juuid = j.juuid
 WHERE NOT (d.juuid <=> j.juuid);

UPDATE permohonan p
  JOIN jenazah j ON j.id = p.jenazah_id
   SET p.juuid = j.juuid
 WHERE NOT (p.juuid <=> j.juuid);

UPDATE perpanjangan pj
  JOIN dokument d ON d.id = pj.dokument_id
   SET pj.duuid = d.duuid
 WHERE NOT (pj.duuid <=> d.duuid);

-- =========================================================
-- 3. Trigger: data baru otomatis dapat UUID & tersambung ke induknya
--    (kode yang sudah mengisi UUID sendiri tidak terpengaruh, trigger
--    hanya mengisi bila kolomnya kosong)
-- =========================================================

DROP TRIGGER IF EXISTS trg_master_makam_uuid_bi;
DROP TRIGGER IF EXISTS trg_makam_uuid_bi;
DROP TRIGGER IF EXISTS trg_makam_uuid_bu;
DROP TRIGGER IF EXISTS trg_kecamatan_uuid_bi;
DROP TRIGGER IF EXISTS trg_kelurahan_uuid_bi;
DROP TRIGGER IF EXISTS trg_kelurahan_uuid_bu;
DROP TRIGGER IF EXISTS trg_jenazah_uuid_bi;
DROP TRIGGER IF EXISTS trg_dokument_uuid_bi;
DROP TRIGGER IF EXISTS trg_dokument_uuid_bu;
DROP TRIGGER IF EXISTS trg_permohonan_uuid_bi;
DROP TRIGGER IF EXISTS trg_permohonan_uuid_bu;
DROP TRIGGER IF EXISTS trg_perpanjangan_uuid_bi;
DROP TRIGGER IF EXISTS trg_perpanjangan_uuid_bu;
DROP TRIGGER IF EXISTS trg_master_retribusi_uuid_bi;
DROP TRIGGER IF EXISTS trg_penandatangan_uuid_bi;
DROP TRIGGER IF EXISTS trg_makam_tambahan_uuid_bi;
DROP TRIGGER IF EXISTS trg_user_uuid_bi;

DELIMITER $$

CREATE TRIGGER trg_master_makam_uuid_bi BEFORE INSERT ON master_makam FOR EACH ROW
BEGIN
  IF NEW.mmuuid IS NULL OR NEW.mmuuid = '' THEN SET NEW.mmuuid = UUID(); END IF;
END$$

CREATE TRIGGER trg_makam_uuid_bi BEFORE INSERT ON makam FOR EACH ROW
BEGIN
  IF NEW.muuid IS NULL OR NEW.muuid = '' THEN SET NEW.muuid = UUID(); END IF;
  IF NEW.master_makam_id IS NOT NULL THEN
    SET NEW.mmuuid = (SELECT mmuuid FROM master_makam WHERE id = NEW.master_makam_id LIMIT 1);
  END IF;
END$$

CREATE TRIGGER trg_makam_uuid_bu BEFORE UPDATE ON makam FOR EACH ROW
BEGIN
  IF NOT (NEW.master_makam_id <=> OLD.master_makam_id) THEN
    SET NEW.mmuuid = (SELECT mmuuid FROM master_makam WHERE id = NEW.master_makam_id LIMIT 1);
  END IF;
END$$

CREATE TRIGGER trg_kecamatan_uuid_bi BEFORE INSERT ON kecamatan FOR EACH ROW
BEGIN
  IF NEW.kcuuid IS NULL OR NEW.kcuuid = '' THEN SET NEW.kcuuid = UUID(); END IF;
END$$

CREATE TRIGGER trg_kelurahan_uuid_bi BEFORE INSERT ON kelurahan FOR EACH ROW
BEGIN
  IF NEW.kluuid IS NULL OR NEW.kluuid = '' THEN SET NEW.kluuid = UUID(); END IF;
  IF NEW.id_kec IS NOT NULL THEN
    SET NEW.kcuuid = (SELECT kcuuid FROM kecamatan WHERE id_kecamatan = NEW.id_kec LIMIT 1);
  END IF;
END$$

CREATE TRIGGER trg_kelurahan_uuid_bu BEFORE UPDATE ON kelurahan FOR EACH ROW
BEGIN
  IF NOT (NEW.id_kec <=> OLD.id_kec) THEN
    SET NEW.kcuuid = (SELECT kcuuid FROM kecamatan WHERE id_kecamatan = NEW.id_kec LIMIT 1);
  END IF;
END$$

CREATE TRIGGER trg_jenazah_uuid_bi BEFORE INSERT ON jenazah FOR EACH ROW
BEGIN
  IF NEW.juuid IS NULL OR NEW.juuid = '' THEN SET NEW.juuid = UUID(); END IF;
END$$

CREATE TRIGGER trg_dokument_uuid_bi BEFORE INSERT ON dokument FOR EACH ROW
BEGIN
  IF NEW.duuid IS NULL OR NEW.duuid = '' THEN SET NEW.duuid = UUID(); END IF;
  IF (NEW.juuid IS NULL OR NEW.juuid = '') AND NEW.jenazah_id IS NOT NULL THEN
    SET NEW.juuid = (SELECT juuid FROM jenazah WHERE id = NEW.jenazah_id LIMIT 1);
  END IF;
END$$

CREATE TRIGGER trg_dokument_uuid_bu BEFORE UPDATE ON dokument FOR EACH ROW
BEGIN
  IF NOT (NEW.jenazah_id <=> OLD.jenazah_id) THEN
    SET NEW.juuid = (SELECT juuid FROM jenazah WHERE id = NEW.jenazah_id LIMIT 1);
  END IF;
END$$

CREATE TRIGGER trg_permohonan_uuid_bi BEFORE INSERT ON permohonan FOR EACH ROW
BEGIN
  IF NEW.puuid IS NULL OR NEW.puuid = '' THEN SET NEW.puuid = UUID(); END IF;
  IF (NEW.juuid IS NULL OR NEW.juuid = '') AND NEW.jenazah_id IS NOT NULL THEN
    SET NEW.juuid = (SELECT juuid FROM jenazah WHERE id = NEW.jenazah_id LIMIT 1);
  END IF;
END$$

CREATE TRIGGER trg_permohonan_uuid_bu BEFORE UPDATE ON permohonan FOR EACH ROW
BEGIN
  IF NOT (NEW.jenazah_id <=> OLD.jenazah_id) THEN
    SET NEW.juuid = (SELECT juuid FROM jenazah WHERE id = NEW.jenazah_id LIMIT 1);
  END IF;
END$$

CREATE TRIGGER trg_perpanjangan_uuid_bi BEFORE INSERT ON perpanjangan FOR EACH ROW
BEGIN
  IF NEW.pjuuid IS NULL OR NEW.pjuuid = '' THEN SET NEW.pjuuid = UUID(); END IF;
  IF (NEW.duuid IS NULL OR NEW.duuid = '') AND NEW.dokument_id IS NOT NULL THEN
    SET NEW.duuid = (SELECT duuid FROM dokument WHERE id = NEW.dokument_id LIMIT 1);
  END IF;
END$$

CREATE TRIGGER trg_perpanjangan_uuid_bu BEFORE UPDATE ON perpanjangan FOR EACH ROW
BEGIN
  IF NOT (NEW.dokument_id <=> OLD.dokument_id) THEN
    SET NEW.duuid = (SELECT duuid FROM dokument WHERE id = NEW.dokument_id LIMIT 1);
  END IF;
END$$

CREATE TRIGGER trg_master_retribusi_uuid_bi BEFORE INSERT ON master_retribusi FOR EACH ROW
BEGIN
  IF NEW.ruuid IS NULL OR NEW.ruuid = '' THEN SET NEW.ruuid = UUID(); END IF;
END$$

CREATE TRIGGER trg_penandatangan_uuid_bi BEFORE INSERT ON penandatangan FOR EACH ROW
BEGIN
  IF NEW.pttuuid IS NULL OR NEW.pttuuid = '' THEN SET NEW.pttuuid = UUID(); END IF;
END$$

CREATE TRIGGER trg_makam_tambahan_uuid_bi BEFORE INSERT ON makam_tambahan FOR EACH ROW
BEGIN
  IF NEW.mtuuid IS NULL OR NEW.mtuuid = '' THEN SET NEW.mtuuid = UUID(); END IF;
END$$

CREATE TRIGGER trg_user_uuid_bi BEFORE INSERT ON `user` FOR EACH ROW
BEGIN
  IF NEW.uuuid IS NULL OR NEW.uuuid = '' THEN SET NEW.uuuid = UUID(); END IF;
END$$

DELIMITER ;

-- =========================================================
-- 4. Cek hasil: semua angka harus 0
-- =========================================================

SELECT 'master_makam.mmuuid kosong' AS cek, COUNT(*) AS jumlah FROM master_makam WHERE mmuuid IS NULL OR mmuuid = ''
UNION ALL SELECT 'makam.muuid kosong',        COUNT(*) FROM makam        WHERE muuid  IS NULL OR muuid  = ''
UNION ALL SELECT 'jenazah.juuid kosong',      COUNT(*) FROM jenazah      WHERE juuid  IS NULL OR juuid  = ''
UNION ALL SELECT 'dokument.duuid kosong',     COUNT(*) FROM dokument     WHERE duuid  IS NULL OR duuid  = ''
UNION ALL SELECT 'permohonan.puuid kosong',   COUNT(*) FROM permohonan   WHERE puuid  IS NULL OR puuid  = ''
UNION ALL SELECT 'perpanjangan.pjuuid kosong',COUNT(*) FROM perpanjangan WHERE pjuuid IS NULL OR pjuuid = ''
UNION ALL SELECT 'makam.mmuuid tidak sama',   COUNT(*) FROM makam m JOIN master_makam mm ON mm.id = m.master_makam_id WHERE NOT (m.mmuuid <=> mm.mmuuid)
UNION ALL SELECT 'dokument.juuid tidak sama', COUNT(*) FROM dokument d JOIN jenazah j ON j.id = d.jenazah_id WHERE NOT (d.juuid <=> j.juuid)
UNION ALL SELECT 'permohonan.juuid tidak sama', COUNT(*) FROM permohonan p JOIN jenazah j ON j.id = p.jenazah_id WHERE NOT (p.juuid <=> j.juuid)
UNION ALL SELECT 'perpanjangan.duuid tidak sama', COUNT(*) FROM perpanjangan pj JOIN dokument d ON d.id = pj.dokument_id WHERE NOT (pj.duuid <=> d.duuid);
