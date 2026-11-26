-- Tandai SK lama (diupload sebelum alur TTE) sebagai sudah final.
-- Di alur lama, SK yang diupload superadmin langsung terbit, sedangkan di alur baru
-- file yang diupload masih draft dan tombol Download SK baru muncul setelah status_tte = 2.
-- Tanpa ini, SK lama tidak bisa didownload dan ikut antre "Belum disetujui" di menu Penandatanganan.
--
-- Jalankan SEKALI saat deploy, SEBELUM ada draft SK baru yang diupload lewat alur baru
-- (draft baru juga status_tte = 0, jadi akan ikut tertandai kalau dijalankan setelahnya).
-- Backup dulu sebelum menjalankan di server. Ganti nama database sesuai server.

USE `2025_makam_smg_dumb`;

-- cek dulu jumlah yang akan diubah
SELECT COUNT(*) AS akan_ditandai FROM dokument
WHERE sk IS NOT NULL AND sk != '' AND status_tte = 0;

UPDATE dokument SET status_tte = 2
WHERE sk IS NOT NULL AND sk != '' AND status_tte = 0;
