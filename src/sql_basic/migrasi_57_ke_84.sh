#!/usr/bin/env bash
# Migrasi database MySQL 5.7 -> MySQL 8.4 (dump & restore).
# Jalankan di server (bukan di laptop), mis. di 147.139.167.33 lewat SSH.
#
# Pemakaian:
#   OLD_PASS='xxx' NEW_PASS='yyy' bash migrasi_57_ke_84.sh
#
# Langkah:
#   1. Cek versi & setting kedua server (lower_case_table_names harus sama)
#   2. Laporan nama tabel/kolom yang jadi reserved word di 8.x
#   3. Dump DB lama (hentikan aplikasi dulu: banyak tabel MyISAM, dump tidak konsisten bila ada tulis)
#   4. Buang DEFINER dari dump supaya view/trigger tidak gagal karena user lama tidak ada
#   5. Buat DB di server baru dengan charset/collation yang sama, lalu import
#   6. Verifikasi: jumlah baris per tabel + koordinat geometry (urutan sumbu) lama vs baru
#
# Server lama TIDAK diubah sama sekali; bila gagal, cukup arahkan .env kembali ke 5.7.

set -euo pipefail

OLD_HOST="${OLD_HOST:-127.0.0.1}"
OLD_PORT="${OLD_PORT:-3306}"
OLD_USER="${OLD_USER:-root}"
NEW_HOST="${NEW_HOST:-127.0.0.1}"
NEW_PORT="${NEW_PORT:-3309}"
NEW_USER="${NEW_USER:-root}"
DB_NAME="${DB_NAME:-transit_makam_smg_13012026}"
NEW_DB_NAME="${NEW_DB_NAME:-$DB_NAME}"
OUT_DIR="${OUT_DIR:-./migrasi_$(date +%Y%m%d_%H%M%S)}"

: "${OLD_PASS:?set OLD_PASS}"
: "${NEW_PASS:?set NEW_PASS}"

mkdir -p "$OUT_DIR"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# Password lewat option file (chmod 600), bukan argumen -p yang terlihat di `ps`
OLD_CNF="$TMP_DIR/old.cnf"
NEW_CNF="$TMP_DIR/new.cnf"
umask 077
printf '[client]\nhost=%s\nport=%s\nuser=%s\npassword="%s"\n' "$OLD_HOST" "$OLD_PORT" "$OLD_USER" "$OLD_PASS" > "$OLD_CNF"
printf '[client]\nhost=%s\nport=%s\nuser=%s\npassword="%s"\n' "$NEW_HOST" "$NEW_PORT" "$NEW_USER" "$NEW_PASS" > "$NEW_CNF"

old_q() { mysql --defaults-extra-file="$OLD_CNF" -N -B "$@"; }
new_q() { mysql --defaults-extra-file="$NEW_CNF" -N -B "$@"; }

echo "== 1. Cek server"
OLD_VER="$(old_q -e 'SELECT @@version')"
NEW_VER="$(new_q -e 'SELECT @@version')"
echo "lama: $OLD_VER   baru: $NEW_VER"
case "$NEW_VER" in 8.*|9.*) ;; *) echo "Server baru bukan MySQL 8.x ($NEW_VER), berhenti."; exit 1;; esac

old_q -e "SELECT 'sql_mode', @@GLOBAL.sql_mode UNION ALL
          SELECT 'character_set_server', @@character_set_server UNION ALL
          SELECT 'collation_server', @@collation_server UNION ALL
          SELECT 'time_zone', @@GLOBAL.time_zone" | tee "$OUT_DIR/setting_lama.txt"
echo "-> samakan nilai di atas di my.cnf server 8.4 (terutama sql_mode)."

OLD_LCTN="$(old_q -e 'SELECT @@lower_case_table_names')"
NEW_LCTN="$(new_q -e 'SELECT @@lower_case_table_names')"
if [ "$OLD_LCTN" != "$NEW_LCTN" ]; then
  echo "lower_case_table_names beda (lama=$OLD_LCTN baru=$NEW_LCTN). Inisialisasi ulang server 8.4 dengan nilai $OLD_LCTN."
  exit 1
fi

if new_q -e "SHOW DATABASES LIKE '$NEW_DB_NAME'" | grep -q .; then
  echo "Database $NEW_DB_NAME sudah ada di server baru. Hapus/ganti NEW_DB_NAME dulu agar tidak tercampur."
  exit 1
fi

echo "== 2. Nama yang jadi reserved word di MySQL 8.x (perlu di-backtick di query aplikasi)"
RESERVED="'cume_dist','dense_rank','empty','except','first_value','grouping','groups','json_table','lag','last_value','lateral','lead','nth_value','ntile','of','over','percent_rank','rank','recursive','row_number','system','window','manual','parallel','qualify','tablesample','intersect'"
old_q -e "SELECT CONCAT(TABLE_NAME, '.', COLUMN_NAME) FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA='$DB_NAME' AND LOWER(COLUMN_NAME) IN ($RESERVED)
          UNION ALL
          SELECT TABLE_NAME FROM information_schema.TABLES
          WHERE TABLE_SCHEMA='$DB_NAME' AND LOWER(TABLE_NAME) IN ($RESERVED)" | tee "$OUT_DIR/reserved_words.txt"
[ -s "$OUT_DIR/reserved_words.txt" ] || echo "(tidak ada)"

echo "== 3. Dump $DB_NAME dari 5.7"
DUMP_OPTS=(--single-transaction --routines --triggers --events --hex-blob
           --default-character-set=utf8mb4 --set-gtid-purged=OFF)
# mysqldump 8.x butuh ini saat dump dari server 5.7 (tabel COLUMN_STATISTICS tidak ada)
if mysqldump --help 2>/dev/null | grep -q column-statistics; then
  DUMP_OPTS+=(--column-statistics=0)
fi
mysqldump --defaults-extra-file="$OLD_CNF" "${DUMP_OPTS[@]}" "$DB_NAME" > "$OUT_DIR/dump_57.sql"
ls -lh "$OUT_DIR/dump_57.sql"

echo "== 4. Buang DEFINER"
sed -E 's/DEFINER=`[^`]+`@`[^`]+`/DEFINER=CURRENT_USER/g' "$OUT_DIR/dump_57.sql" > "$OUT_DIR/dump_84.sql"

echo "== 5. Buat DB & import ke 8.4"
read -r DB_CHARSET DB_COLLATION < <(old_q -e "SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
                                              FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='$DB_NAME'")
new_q -e "CREATE DATABASE \`$NEW_DB_NAME\` CHARACTER SET $DB_CHARSET COLLATE $DB_COLLATION"
# Header dump sudah mematikan NO_ZERO_DATE, jadi baris '0000-00-00' tetap masuk
new_q --default-character-set=utf8mb4 "$NEW_DB_NAME" < "$OUT_DIR/dump_84.sql" 2> "$OUT_DIR/import_warning.txt" || {
  echo "Import gagal, lihat $OUT_DIR/import_warning.txt"; exit 1; }
echo "import selesai"

echo "== 6a. Verifikasi jumlah baris"
SELISIH=0
: > "$OUT_DIR/jumlah_baris.txt"
for T in $(old_q -e "SELECT TABLE_NAME FROM information_schema.TABLES
                     WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_TYPE='BASE TABLE' ORDER BY 1"); do
  A="$(old_q "$DB_NAME" -e "SELECT COUNT(*) FROM \`$T\`")"
  B="$(new_q "$NEW_DB_NAME" -e "SELECT COUNT(*) FROM \`$T\`" 2>/dev/null || echo HILANG)"
  STATUS=OK; [ "$A" = "$B" ] || { STATUS=BEDA; SELISIH=$((SELISIH + 1)); }
  printf '%-50s %10s %10s %s\n' "$T" "$A" "$B" "$STATUS" | tee -a "$OUT_DIR/jumlah_baris.txt"
done

echo "== 6b. Verifikasi geometry (koordinat harus sama, urutan lng lat)"
# Satu baris per kolom geometry, dibandingkan lewat primary key.
# Di 8.4 dibaca dengan ST_SRID(col, 0) persis seperti query aplikasi.
old_q -e "SELECT c.TABLE_NAME, c.COLUMN_NAME, k.COLUMN_NAME
          FROM information_schema.COLUMNS c
          JOIN information_schema.KEY_COLUMN_USAGE k
            ON k.TABLE_SCHEMA=c.TABLE_SCHEMA AND k.TABLE_NAME=c.TABLE_NAME
           AND k.CONSTRAINT_NAME='PRIMARY' AND k.ORDINAL_POSITION=1
          WHERE c.TABLE_SCHEMA='$DB_NAME'
            AND c.DATA_TYPE IN ('geometry','point','linestring','polygon','multipoint',
                                'multilinestring','multipolygon','geometrycollection')" |
while read -r T COL PK; do
  ID="$(old_q "$DB_NAME" -e "SELECT \`$PK\` FROM \`$T\` WHERE \`$COL\` IS NOT NULL LIMIT 1")"
  [ -n "$ID" ] || continue
  A="$(old_q "$DB_NAME" -e "SELECT LEFT(ST_AsText(\`$COL\`), 80) FROM \`$T\` WHERE \`$PK\`='$ID'")"
  B="$(new_q "$NEW_DB_NAME" -e "SELECT LEFT(ST_AsText(ST_SRID(\`$COL\`, 0)), 80) FROM \`$T\` WHERE \`$PK\`='$ID'")"
  SRIDS="$(new_q "$NEW_DB_NAME" -e "SELECT GROUP_CONCAT(DISTINCT ST_SRID(\`$COL\`)) FROM \`$T\`")"
  STATUS=OK; [ "$A" = "$B" ] || STATUS=BEDA
  printf '%s.%s (SRID: %s) %s\n  lama: %s\n  baru: %s\n' "$T" "$COL" "$SRIDS" "$STATUS" "$A" "$B"
done | tee "$OUT_DIR/cek_geometry.txt"

echo
echo "Hasil di $OUT_DIR"
if [ "$SELISIH" -gt 0 ] || grep -q ' BEDA' "$OUT_DIR/cek_geometry.txt"; then
  echo "ADA PERBEDAAN - jangan pindahkan aplikasi dulu."
  exit 1
fi
echo "Semua cocok. Langkah berikut: buat user aplikasi di 8.4, ubah DB_HOST/DB_PORT di .env, tes aplikasi."
