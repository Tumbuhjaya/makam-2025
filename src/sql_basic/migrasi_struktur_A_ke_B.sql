-- Migrasi struktur: transit_makam_smg -> menyamakan dengan transit_makam_smg_13012026
-- Dibuat otomatis dari information_schema transit_makam_smg_13012026 pada 2026-11-05
-- Hanya menambah tabel/kolom/index; tidak menghapus atau mengubah data yang ada.
-- Jalankan SEKALI. MySQL 5.7 tidak punya ADD COLUMN IF NOT EXISTS, jadi menjalankan
-- ulang akan gagal di "Duplicate column name" (tidak merusak data).
-- Backup dulu sebelum menjalankan di server.

USE `transit_makam_smg`;

-- user.last_login memakai DEFAULT '0000-00-00 00:00:00'; ALTER TABLE akan ditolak
-- bila sql_mode berisi NO_ZERO_DATE/STRICT. Nonaktifkan untuk sesi ini saja.
SET @OLD_SQL_MODE = @@SESSION.sql_mode;
SET SESSION sql_mode = '';

-- =========================================================
-- 1. Tabel baru
-- =========================================================

CREATE TABLE IF NOT EXISTS `bergota_sompok` (
  `OGR_FID` int(11) NOT NULL AUTO_INCREMENT,
  `SHAPE` geometry NOT NULL,
  `id` decimal(6,0) DEFAULT NULL,
  `blok` varchar(50) DEFAULT NULL,
  `juru_kunci` varchar(50) DEFAULT NULL,
  `surveyor` varchar(50) DEFAULT NULL,
  `sub_blok` varchar(50) DEFAULT NULL,
  `kecamatan` varchar(50) DEFAULT NULL,
  `id_kec` double(19,11) DEFAULT NULL,
  `nama_tpu` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`OGR_FID`),
  SPATIAL KEY `SHAPE` (`SHAPE`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `blok_subblok_bergota_dms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `SHAPE` geometry NOT NULL,
  `blok` varchar(50) DEFAULT NULL,
  `juru_kunci` varchar(50) DEFAULT NULL,
  `surveyor` varchar(50) DEFAULT NULL,
  `sub_blok` varchar(50) DEFAULT NULL,
  `kecamatan` varchar(50) DEFAULT NULL,
  `id_kec` double(19,11) DEFAULT NULL,
  `nama_tpu` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  SPATIAL KEY `SHAPE` (`SHAPE`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `log` (
  `riwayat` varchar(300) DEFAULT NULL,
  `user_uuid` varchar(100) DEFAULT NULL,
  `insertedAt` datetime DEFAULT NULL,
  `lastUpdateAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `log_id` varchar(100) DEFAULT NULL,
  `t` varchar(100) DEFAULT NULL,
  `id` varchar(100) DEFAULT NULL,
  `luuid` varchar(100) DEFAULT NULL,
  `log_uuid` varchar(100) NOT NULL,
  UNIQUE KEY `log_unique` (`log_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `makam_tambahan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `makam_id` int(11) DEFAULT NULL,
  `status_makam` tinyint(4) DEFAULT '0',
  `jumlah_jenazah` tinyint(4) DEFAULT '0',
  `status_tumpang` tinyint(4) DEFAULT '0',
  `deleted` tinyint(4) DEFAULT '0',
  `mtuuid` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- =========================================================
-- 2. Kolom baru di tabel yang sudah ada
-- =========================================================

ALTER TABLE `dokument`
  ADD COLUMN `status_tte` tinyint(4) NOT NULL DEFAULT 0 AFTER `penandatangan_id`,
  ADD COLUMN `duuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `status_tte`,
  ADD COLUMN `juuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `duuid`;

ALTER TABLE `jenazah`
  ADD COLUMN `tpu` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `status_survey`,
  ADD COLUMN `blok` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `tpu`,
  ADD COLUMN `sub_blok` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `blok`,
  ADD COLUMN `kategori_tpu` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT '0' AFTER `sub_blok`,
  ADD COLUMN `juuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `kategori_tpu`;

ALTER TABLE `kecamatan`
  ADD COLUMN `kcuuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `kecamatan`;

ALTER TABLE `kelurahan`
  ADD COLUMN `kluuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `deleted`,
  ADD COLUMN `kcuuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `kluuid`;

ALTER TABLE `makam`
  ADD COLUMN `hex` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL AFTER `keterangan_pengelola`,
  ADD COLUMN `muuid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL AFTER `hex`,
  ADD COLUMN `mmuuid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL AFTER `muuid`;

ALTER TABLE `master_makam`
  ADD COLUMN `kategori_tpu` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `kode_tpu`,
  ADD COLUMN `mmuuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `kategori_tpu`;

ALTER TABLE `master_retribusi`
  ADD COLUMN `ruuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `retribusi`;

ALTER TABLE `penandatangan`
  ADD COLUMN `pttuuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `deleted`;

ALTER TABLE `permohonan`
  ADD COLUMN `puuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `tanggal_daftar_perpanjangan`,
  ADD COLUMN `juuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `puuid`;

ALTER TABLE `perpanjangan`
  ADD COLUMN `status_tte` tinyint(4) NULL DEFAULT 0 AFTER `penandatangan_id`,
  ADD COLUMN `duuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `perpanjangan_ke`,
  ADD COLUMN `pjuuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `duuid`;

-- `perpanjangan`: kolom Column16 ada di A tapi tidak di B. Tidak dihapus otomatis; aktifkan jika yakin:
-- ALTER TABLE `perpanjangan` DROP COLUMN `Column16`;

ALTER TABLE `user`
  ADD COLUMN `uuuid` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `master_makam_id`,
  ADD COLUMN `NIK` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `uuuid`,
  ADD COLUMN `jabatan` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER `NIK`;

-- =========================================================
-- 3. Index yang ada di B tapi belum ada di A
-- =========================================================
-- (tidak ada)

SET SESSION sql_mode = @OLD_SQL_MODE;
