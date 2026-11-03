# Savora

Marketplace **hyper-local food rescue** untuk Malang. Savora menghubungkan toko roti, kafe, dan restoran yang punya surplus makanan layak konsumsi dengan customer yang ingin makan lebih murah lewat paket **Surprise Bag** dengan *self-pickup*.

> Dokumen produk lengkap ada di [`PRD.md`](./PRD.md).

**Demo live:** <https://savora-lyart-six.vercel.app>

## Status Saat Ini

Repo ini berisi fondasi aplikasi, katalog publik, alur onboarding tiga role, alur order customer, operasional mitra, serta monitoring admin yang sudah terhubung ke database.

Sudah tersedia:

- Monorepo npm workspaces: `client/` (Vue 3 + TypeScript) dan `server/` (Express + TypeScript).
- Prisma schema lengkap untuk `User`, `Store`, `StoreSchedule`, `Tier`, `Order`, dan `OrderAudit`.
- Seed data 8 toko di Malang, 3 tier per toko, akun demo customer/merchant/admin.
- API `GET /api/health`, `GET /api/stores`, dan `GET /api/stores/:id`.
- Home editorial customer-first: hero foto full-bleed, ringkasan Savora, tiga stats, kartu fitur, tiga kartu tier (Hemat, Reguler, Besar) dengan nilai asli minimum, dan section cara kerja berlatar putih.
- Katalog dengan peta Leaflet dan detail toko + tier.
- Auth JWT: register customer, login semua role, dan `GET /api/auth/me`.
- Registrasi publik hanya untuk customer; field `role` ditolak di level validasi.
- Panel admin di `/admin` untuk melihat daftar mitra, statistik toko, pencarian, dan membuat akun mitra + toko sekaligus.
- Akun mitra dan toko hanya dapat dibuat admin. Toko baru langsung `ACTIVE`, memiliki 3 tier dengan stok 0, dan jadwal pickup harian.
- Halaman login/register yang sudah terhubung ke API dan menyimpan sesi di Pinia.
- Navigasi publik hanya **Home** dan **Katalog**. Akses **Pesanan saya** berada di menu akun untuk customer yang login.
- Pencarian di halaman katalog memfilter toko berdasarkan nama atau alamat dan tersinkron dengan `?q=` di URL.
- Redirect setelah login sesuai role: customer → `/`, mitra → `/merchant`, admin → `/admin`.
- Menu akun dan menu mobile bisa ditutup dengan Escape, klik luar, atau perpindahan route.
- Layout dan dasbor mitra di `/merchant`: rekap harian, pesanan terbaru, kelola stok tiga tier, jadwal pickup, dan terminal verifikasi PIN.
- Verifikasi PIN hanya menerima order `PAID` milik toko mitra yang masih dalam jendela pickup, lalu mengubah status menjadi `COMPLETED`.
- Alur order customer: checkout, reservasi stok atomik, batas 2 kantong per toko per hari, pembayaran sandbox, PIN 4 digit, tiket pickup, dan riwayat pesanan.
- Ulasan biner customer setelah pickup (`Sesuai` / `Tidak sesuai`) beserta komentar opsional, hanya untuk order `COMPLETED`.
- Red flag otomatis: toko `ACTIVE` berubah menjadi `WARNING` jika rasio ulasan “Tidak sesuai” melebihi 20%.
- Panel monitoring admin di `/admin/monitoring`: statistik harian, daftar toko WARNING/SUSPENDED beserta rasio ulasan, transaksi terbaru, serta aksi pulihkan/suspend.
- Katalog publik menyaring toko yang tutup: hanya toko `ACTIVE`/`WARNING` yang punya stok dan jadwal pickup hari ini yang belum lewat.
- Cron `node-cron` menandai `PENDING` yang lewat batas bayar sebagai `EXPIRED` (stok dikembalikan) dan `PAID` yang lewat jadwal pickup sebagai `EXPIRED` (tanpa refund).
- Pembaruan otomatis tanpa reload: katalog, detail toko, checkout, pesanan, pembayaran, dan tiket menyegarkan data di latar belakang (interval + saat tab kembali aktif), sehingga stok dan status pesanan berubah sendiri di layar.
- Animasi scroll reveal halus di halaman customer lewat directive `v-reveal`; elemen di atas fold dan area hero tetap tampil instan, dan animasi dimatikan saat `prefers-reduced-motion`.
- Build produksi dan typecheck bebas error.

Belum diimplementasikan (di luar cakupan MVP):

- Notifikasi email/push dan reset password.
- Integrasi payment gateway nyata (saat ini sandbox).
- Deployment produksi.

## Tech Stack

| Layer | Teknologi |
| :--- | :--- |
| Frontend | Vue 3 Composition API, Vite, TypeScript, Pinia, Vue Router |
| Styling | Tailwind CSS |
| Peta | Leaflet + OpenStreetMap (tanpa API key) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | JSON Web Token + bcrypt |
| Scheduler | node-cron |
| Zona waktu | Luxon / `Asia/Jakarta` |

## Struktur Repo

```text
Savora/
├─ client/
│  └─ src/
│     ├─ components/      # common, home, layout, store, order
│     ├─ layouts/         # PublicLayout, CustomerLayout, MerchantLayout, AdminLayout
│     ├─ router/          # route + guard role
│     ├─ services/        # axios + service per domain
│     ├─ stores/          # Pinia: auth, catalog, order
│     ├─ types/           # tipe domain
│     ├─ utils/           # format, error handling, role landing
│     └─ views/           # public, auth, customer, merchant, admin
├─ server/
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ seed.ts
│  └─ src/
│     ├─ config/          # env, prisma client
│     ├─ jobs/            # cron expire order
│     ├─ middleware/      # auth, role, validate, error
│     ├─ modules/         # auth, admin, merchant, stores, orders, health
│     ├─ types/           # augmentasi Express Request
│     └─ utils/           # jwt, password, pin, time, distance, tiers
├─ PRD.md
└─ package.json           # workspaces + script root
```

## Prasyarat

- Node.js 20 atau lebih baru (diuji dengan Node 24).
- PostgreSQL 14 atau lebih baru (diuji dengan PostgreSQL 18).
- Service PostgreSQL berjalan di `localhost:5432`.

## Setup Lokal

1. Install dependencies dari root repo:

   ```bash
   npm install
   ```

2. Buat database PostgreSQL (pilih salah satu):

   ```bash
   psql -U postgres -c "CREATE DATABASE savora;"
   ```

   Atau lewat pgAdmin: klik kanan **Databases → Create → Database**, beri nama `savora`.

3. Sesuaikan koneksi database di `server/.env`:

   ```env
   DATABASE_URL="postgresql://postgres:PASSWORD_KAMU@localhost:5432/savora?schema=public"
   JWT_SECRET="ganti-dengan-string-acak-minimal-32-karakter"
   DEMO_PASSWORD="password-demo-minimal-12-karakter"
   ```

   File `.env` sudah dibuat untuk development dan **tidak** ikut ter-commit. `DEMO_PASSWORD` dipakai `npm run seed` untuk akun demo; nilainya tidak disimpan di repo.

4. Jalankan migrasi dan seed:

   ```bash
   npm run db:migrate
   npm run seed
   ```

   Migrasi awal sudah tersedia di `server/prisma/migrations/20261102160000_init/`, jadi Prisma tidak akan meminta nama migrasi. Jika `db:migrate` gagal, periksa kembali `DATABASE_URL` di `server/.env`.

5. Jalankan frontend + backend sekaligus:

   ```bash
   npm run dev
   ```

   - Frontend: <http://localhost:5173>
   - API: <http://localhost:4000>
   - Health check: <http://localhost:4000/api/health>

## Akun Demo

Password akun demo diambil dari `DEMO_PASSWORD` di `server/.env` dan tidak ditulis di repo. Untuk mengganti password di database yang sedang berjalan:

```bash
npm run demo:password
```

| Role | Email | Catatan |
| :--- | :--- | :--- |
| Customer | `customer@savora.id` | Untuk alur pemesanan |
| Merchant | `merchant@savora.id` | Pemilik Roti Asri Lowokwaru |
| Admin | `admin@savora.id` | Untuk panel admin |

Seed juga membuat merchant2–merchant8 untuk toko lainnya; semuanya memakai `DEMO_PASSWORD` yang sama.

Registrasi publik di `/auth/register` hanya membuat akun **customer**. Akun mitra dibuat admin dari panel `/admin`; setelah itu mitra masuk lewat halaman login yang sama. Jangan mendaftarkan email mitra lewat form publik.

Halaman login dan register publik memakai panel editorial yang sama dengan Home: satu kolom foto gelap dengan wordmark **Savora**, dan satu kolom form putih dengan eyebrow hijau, input membulat, serta tombol utama pill gelap. Kredensial mitra dan admin tidak ditampilkan di halaman publik; akun mitra dibuat admin dari panel `/admin`.

## Alur Halaman User

1. Pengunjung membuka `/` dan langsung melihat Home bergaya editorial: hero foto dengan kata **SAVORA**, ringkasan Savora, tiga stats, kartu fitur, tiga kartu tier (Hemat, Reguler, Besar), dan section **Cara kerja** berlatar putih.
2. Navigasi utama hanya **Home** dan **Katalog**.
3. Customer memilih **Daftar** atau **Masuk**. Setelah berhasil, customer diarahkan ke Home. Merchant dan admin tetap diarahkan ke dasbor masing-masing.
4. Customer membuka **Pesanan saya** lewat menu akun di kanan atas. Menu yang sama berisi **Keluar**.
5. Di layar kecil, menu hamburger memuat Home, Katalog, dan aksi akun.
6. Logout dari halaman mana pun kembali ke Home.
7. Hero menampilkan jumlah kantong dan toko hari ini dari `GET /api/stores`, dengan state memuat dan state stok kosong. Tidak ada stok, PIN, atau nama toko yang di-hardcode.
8. Daftar toko lengkap ada di halaman Katalog, bukan di Home.

## Alur Onboarding Mitra

1. Admin masuk ke `/admin` lalu memilih **Tambah mitra**.
2. Admin mengisi data akun (nama pemilik, email, password awal) dan profil toko (nama, alamat, koordinat, jam pickup).
3. Server membuat `User` dengan role `MERCHANT` dan `Store` berstatus `ACTIVE` dalam satu transaksi, lengkap dengan 3 tier bawaan dan jadwal pickup harian.
4. Admin menyerahkan email dan password awal ke mitra melalui kanal aman.
5. Mitra masuk dan diarahkan ke `/merchant`. Stok awal 0, sehingga toko belum tampil di katalog publik sampai stok diisi.

## Alur Pemesanan Customer

1. Customer memilih tier di halaman toko. Tombol pesan hanya muncul jika stok tier > 0.
2. Checkout menampilkan toko, jadwal pickup hari ini, sisa kuota harian, dan jumlah kantong (maksimal 2 per toko per hari).
3. `POST /api/orders` mengurangi stok lewat `updateMany` bersyarat di dalam transaksi, sehingga dua pesanan bersamaan tidak bisa mengambil stok yang sama.
4. Order berstatus `PENDING` dengan batas bayar 15 menit (atau sampai jam pickup berakhir, mana yang lebih dulu).
5. Pembayaran sandbox mengubah status menjadi `PAID`, membuat PIN 4 digit unik, dan menetapkan batas pickup sesuai jam toko.
6. Tiket menampilkan PIN, hitung mundur pickup, alamat toko, dan peta.
7. Order `PENDING` yang kedaluwarsa otomatis menjadi `EXPIRED` dan stoknya dikembalikan. Order `PAID` yang melewati jam pickup menjadi `EXPIRED` tanpa refund.
8. Customer dapat membatalkan order `PENDING`; stok langsung dikembalikan.

## Alur Operasional Mitra

1. Mitra masuk dan diarahkan ke `/merchant`.
2. Dasbor menampilkan header foto toko, pendapatan hari ini, pesanan selesai, tiket yang menunggu pickup, total stok, dan 10 pesanan terbaru.
3. Halaman **Stok** memungkinkan mitra mengubah stok tiap tier. Harga tier tetap mengikuti aturan PRD.
4. Halaman **Stok** juga mengatur jendela pickup harian. Perubahan langsung memengaruhi katalog publik.
5. Halaman **Verifikasi** menyediakan keypad PIN 4 digit. Sistem mencocokkan PIN dengan order `PAID` milik toko, memastikan masih dalam jam pickup, lalu mengubah status menjadi `COMPLETED`.
6. Tiket customer memantau status secara berkala, sehingga PIN yang sudah diverifikasi berubah menjadi status selesai tanpa perlu memuat ulang manual.

## Alur Ulasan & Red Flag

1. Setelah kasir memverifikasi PIN, order berstatus `COMPLETED` dan tombol **Beri ulasan** muncul di riwayat pesanan serta tiket.
2. Customer memilih **Sesuai** atau **Tidak sesuai**, lalu boleh menambahkan komentar singkat.
3. Ulasan disimpan di `OrderAudit` dan hanya bisa dikirim sekali per order.
4. Server menghitung rasio ulasan “Tidak sesuai” seluruh toko. Jika melewati 20% dan toko masih `ACTIVE`, status otomatis berubah menjadi `WARNING`.
5. Toko `WARNING` tetap tampil di katalog dan bisa menerima pesanan; admin yang memutuskan apakah perlu menangguhkan toko.

## Alur Monitoring Admin

1. Admin membuka `/admin/monitoring`.
2. Ringkasan menampilkan pesanan hari ini, omzet dari order `COMPLETED`, jumlah toko peringatan, dan rasio ulasan tidak sesuai.
3. Daftar **Toko butuh perhatian** menampilkan toko `WARNING`/`SUSPENDED` beserta rasio ulasan, jumlah ulasan, pemilik, dan stok.
4. Admin dapat memilih **Pulihkan ke aktif** atau **Suspend toko**. Toko `SUSPENDED` hilang dari katalog dan tidak bisa menerima pesanan baru.
5. Tabel transaksi terbaru menampilkan 10 order lintas toko untuk audit cepat.

## Script Root

| Script | Fungsi |
| :--- | :--- |
| `npm run dev` | Jalankan server + client dengan concurrently |
| `npm run build` | Build server (tsc) dan client (vite) |
| `npm run typecheck` | Typecheck server dan client |
| `npm run seed` | Jalankan `prisma db seed` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` (untuk database cloud) |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:studio` | Buka Prisma Studio |

## API Yang Sudah Ada

| Method | Endpoint | Akses | Keterangan |
| :--- | :--- | :--- | :--- |
| GET | `/api/health` | Publik | Status API + koneksi database |
| GET | `/api/stores?q=` | Publik | Toko `ACTIVE`/`WARNING` yang punya stok + jadwal pickup hari ini yang belum lewat |
| GET | `/api/stores/:id` | Publik | Detail toko + tier + jadwal pickup |
| POST | `/api/auth/register` | Publik | Registrasi customer baru (role lain ditolak) |
| POST | `/api/auth/login` | Publik | Login customer, merchant, atau admin |
| GET | `/api/auth/me` | Terautentikasi | Profil user dari token JWT |
| GET | `/api/admin/merchants` | Admin | Daftar akun mitra beserta toko, tier, dan jadwal |
| POST | `/api/admin/merchants` | Admin | Buat akun mitra + toko + 3 tier default |
| GET | `/api/admin/overview` | Admin | Statistik harian, toko WARNING/SUSPENDED, dan transaksi terbaru |
| PATCH | `/api/admin/stores/:storeId/status` | Admin | Ubah status toko menjadi `ACTIVE`, `WARNING`, atau `SUSPENDED` |
| GET | `/api/orders/checkout/:tierId` | Customer | Info tier/toko/jadwal + sisa kuota harian |
| POST | `/api/orders` | Customer | Buat order PENDING + reservasi stok atomik |
| GET | `/api/orders/mine` | Customer | Riwayat pesanan customer |
| GET | `/api/orders/:id` | Customer/Admin | Detail pesanan dan tiket |
| POST | `/api/orders/:id/pay` | Customer | Mock payment + generate PIN unik |
| POST | `/api/orders/:id/cancel` | Customer | Batalkan order PENDING dan kembalikan stok |
| POST | `/api/orders/:id/feedback` | Customer | Kirim ulasan biner untuk order COMPLETED |
| GET | `/api/merchant/store` | Mitra | Profil toko + tier + jadwal milik mitra |
| PATCH | `/api/merchant/tiers/:tierId` | Mitra | Ubah stok tier milik mitra |
| PUT | `/api/merchant/schedule` | Mitra | Ubah jendela pickup harian |
| GET | `/api/merchant/summary` | Mitra | Rekap hari ini + pesanan terbaru |
| POST | `/api/merchant/verify-pin` | Mitra | Verifikasi PIN pickup dan selesaikan order |

## Catatan Teknis

- **Password hashing:** memakai `bcryptjs` (implementasi bcrypt murni JavaScript) agar tidak perlu kompilasi native di Windows. Algoritmanya tetap bcrypt dengan 12 salt rounds.
- **Zona waktu:** seluruh logika jadwal menggunakan `Asia/Jakarta`, bukan zona waktu server.
- **Jam pickup:** Prisma menyimpan `TIME`; helper `dbTimeToString()` mengembalikan `HH:mm` untuk API dan UI.
- **Onboarding role:** registrasi publik memakai schema `.strict()` sehingga field `role` atau field tak dikenal ditolak `422`. Satu-satunya jalur pembuatan mitra adalah `POST /api/admin/merchants` yang dilindungi `authenticate` + `requireRole(ADMIN)`.
- **Toko baru:** dibuat `ACTIVE` dengan 3 tier (`HEMAT`, `REGULER`, `BESAR`) dan stok 0. Toko otomatis belum terlihat di katalog sampai stok diisi.
- **Katalog:** hanya menampilkan toko `ACTIVE`/`WARNING` yang punya stok dan memiliki jadwal pickup hari ini yang belum lewat. Toko `PENDING`/`SUSPENDED` atau yang sudah tutup disembunyikan, termasuk dari halaman detail.
- **Ulasan:** hanya order `COMPLETED` milik customer yang bisa diberi ulasan, satu kali per order. Komentar opsional maksimal 1000 karakter.
- **Red flag:** rasio “Tidak sesuai” dihitung dari seluruh ulasan toko. Jika >20% dan toko masih `ACTIVE`, status otomatis menjadi `WARNING`. Toko `WARNING` tetap beroperasi sampai admin menangguhkannya.
- **Aksi admin:** admin dapat memulihkan toko ke `ACTIVE` atau menangguhkan toko menjadi `SUSPENDED`. Status `SUSPENDED` langsung menghilangkan toko dari katalog dan mencegah checkout baru.
- **Stok:** reservasi memakai `updateMany` dengan syarat `stock >= qty` di dalam transaksi. Jika stok tidak cukup, seluruh transaksi dibatalkan.
- **Batas harian:** maksimal 2 kantong per customer per toko per hari, dihitung dari order `PAID`/`COMPLETED` hari ini dan `PENDING` yang belum kedaluwarsa.
- **Pembayaran:** sandbox murni, tidak ada gateway. Order `PENDING` mendapat batas bayar 15 menit; setelah `PAID`, `expiresAt` diganti menjadi akhir jam pickup.
- **PIN:** dibuat saat pembayaran dan dicek keunikannya terhadap order `PAID`/`COMPLETED`. PIN hanya ditampilkan ke customer pemilik order.
- **Verifikasi mitra:** PIN dicari hanya di toko milik mitra yang login; order harus `PAID`, belum lewat `expiresAt`, dan sudah masuk jam pickup. Verifikasi mengubah status menjadi `COMPLETED` dan PIN tidak bisa dipakai ulang.
- **Rekap mitra:** pendapatan hari ini dihitung dari order `COMPLETED` yang diperbarui hari ini; tiket aktif dihitung dari order `PAID` yang belum lewat batas pickup.
- **Stok mitra:** perubahan stok langsung memengaruhi katalog. Toko dengan total stok 0 otomatis hilang dari katalog sampai stok diisi kembali.
- **Halaman user:** `/` adalah Home publik bergaya editorial dengan hero foto, ringkasan Savora, kartu fitur, tiga kartu tier, dan section cara kerja. Navigasi utama hanya Home dan Katalog; Pesanan saya berada di menu akun.
- **Auth:** halaman login dan register memakai panel `rounded-[2rem]` dua kolom. Kolom kiri berisi foto toko dengan overlay `ink-950`, wordmark Savora, dan daftar keunggulan; kolom kanan berisi form putih dengan eyebrow `brand-700`, label kapital 11px, input `rounded-2xl` berfokus brand, serta tombol pill `ink-900`. Di bawah 1024 px panel bertumpuk dengan banner foto ringkas.
- **Data Home:** badge hero menghitung jumlah kantong dan toko hari ini dari `GET /api/stores`, lengkap dengan state memuat dan state stok kosong. Tidak ada angka stok atau PIN contoh yang di-hardcode.
- **Cara kerja:** section berlatar putih dengan garis pemisah di atas langkah. Tiap langkah memakai tile ikon sage dengan badge nomor di sudutnya, judul ink, dan deskripsi. Di layar ≥1024 px langkah tersusun tiga kolom dengan garis putus-putus yang menyambung tepat di tengah ikon; di bawahnya langkah bertumpuk dengan rel vertikal di sisi kiri. Eyebrow section memakai `brand-700` yang sama dengan section lain, tanpa aksen amber.
- **Tier:** tiga kartu Hemat, Reguler, dan Besar menampilkan harga tetap Rp15.000 / Rp25.000 / Rp35.000 beserta nilai asli minimum dari PRD. Kartu Reguler diberi garis putih tipis dan posisi lebih tinggi di layar lebar; di bawah 1024 px ketiganya bertumpuk penuh.
- **Pencarian:** halaman katalog menyinkronkan input dengan `?q=` lewat `router.replace`, lalu memfilter nama serta alamat toko.
- **Alur customer:** halaman toko, checkout, pembayaran, tiket, pesanan, dan ulasan memakai header foto gelap `PageHero` dengan eyebrow `brand-300`, panel putih `rounded-[2rem]` ber-`shadow-card`, tombol pill `ink-900`, dan status badge bernada sage/brand. Aksen amber dihapus dari seluruh alur customer; keadaan negatif memakai merah lembut dan keadaan netral memakai sage.
- **Area mitra:** dasbor, stok & jadwal, dan terminal verifikasi PIN memakai bahasa visual yang sama dengan alur customer — latar `sage-100`, header foto toko `PageHero`, panel putih `rounded-[2rem]`, nav pill aktif `ink-900`, keypad PIN editorial, serta status badge sage/brand. Aksen amber dan stone dihapus dari area mitra; error memakai merah lembut dan tips memakai sage.
- **Foto:** hero, kartu tier, dan kartu toko di katalog memakai foto Unsplash yang disimpan lokal di `client/public/images` dan dioptimalkan ke WebP. Foto bersifat ilustrasi, bukan dokumentasi toko asli.
- **Map:** Leaflet memakai tile OpenStreetMap, jadi tidak memerlukan API key. Tile layer mengaktifkan `detectRetina` agar peta tetap tajam di layar berdensitas tinggi.

## Deploy (Vercel + Supabase)

Satu project Vercel dengan **Services** menyajikan dua aplikasi dalam satu domain:

- `client/` dibangun sebagai situs statis Vite.
- `server/` dijalankan sebagai layanan Express di `/api/*`.

Database memakai PostgreSQL Supabase. Frontend dan API berbagi domain, jadi `VITE_API_URL` tetap `/api` dan tidak ada preflight CORS.

### 1. Supabase

1. Buat project baru. Pilih region yang dekat dengan region function Vercel (proyek ini memakai `dub1`/Dublin, jadi database idealnya `eu-west-1`).
2. Buka **Connect** dan salin dua connection string:
   - **Transaction pooler** (port `6543`) → `DATABASE_URL`, tambahkan `?pgbouncer=true&connection_limit=1&sslmode=require`.
   - **Session pooler** (port `5432`) → `DIRECT_URL`, tambahkan `?sslmode=require`.
3. Jangan memakai host `db.<project-ref>.supabase.co` kecuali jaringanmu mendukung IPv6.

### 2. Migrasi dan seed

```bash
# isi DATABASE_URL, DIRECT_URL, dan DEMO_PASSWORD di server/.env
npm run db:deploy
npm run seed
```

`DIRECT_URL` hanya dipakai Prisma untuk migrasi; Prisma Client memakai `DATABASE_URL` yang lewat pooler. Password akun demo diambil dari `DEMO_PASSWORD`, bukan dari kode.

### 3. Environment Vercel

| Variabel | Nilai |
| :--- | :--- |
| `DATABASE_URL` | transaction pooler Supabase (port 6543 + `pgbouncer=true`) |
| `JWT_SECRET` | string acak minimal 32 karakter |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `https://<project>.vercel.app` |
| `NODE_ENV` | `production` |

`DIRECT_URL` tidak perlu diisi di Vercel karena migrasi dijalankan dari lokal/CLI. `PORT` diabaikan oleh function.

### 4. Deploy

Import repo ke Vercel tanpa mengubah Root Directory. `vercel.json` memakai model `services`:

| Service | Root | Peran |
| :--- | :--- | :--- |
| `web` | `client/` | build Vite, output `dist`, fallback SPA ke `index.html` |
| `api` | `server/` | Express, entrypoint `src/app.ts` (Vercel meng-compile TypeScript) |

Request `/api/*` dirutekan ke service `api`, sisanya ke `web`. Vercel membangun kedua service secara terpisah dalam satu deployment. `regions` di `vercel.json` menaruh function di `dub1` agar dekat dengan database Supabase `eu-west-1`.

### Catatan produksi

- **Cron:** `node-cron` tidak berjalan di serverless. Saat `process.env.VERCEL` terisi, `server/src/app.ts` memanggil `runLazyExpireOrders()` yang membatasi pemeriksaan order kedaluwarsa maksimal sekali per menit. Di lokal/Render, `startExpireOrdersJob()` tetap dipakai.
- **Koneksi:** `PrismaClient` di-cache di `globalThis` agar tidak membuka koneksi baru setiap request.
- **Supabase free tier** mem-pause project setelah ±7 hari tanpa aktivitas. Workflow `.github/workflows/uptime.yml` memanggil `GET /api/health` setiap hari (termasuk `workflow_dispatch` manual) agar project tetap hidup.
- **Refresh halaman dalam** seperti `/catalog` bergantung pada rewrite SPA di `vercel.json`.

## Roadmap

1. **Fase 1 (selesai):** auth JWT, onboarding admin→mitra, order + reservasi stok, mock payment, PIN, tiket, cron expiry.
2. **Fase 2 (selesai):** operasional mitra — kelola stok/tier/jadwal, terminal verifikasi PIN, rekap harian.
3. **Fase 3 (selesai):** ulasan biner customer, red flag otomatis >20%, monitoring dan aksi status toko di panel admin.
4. **Fase 4 (selesai):** penyederhanaan halaman user: Home customer-first, navigasi Home + Katalog, menu akun, dan penghapusan promosi mitra dari area publik.
5. **Fase 5 (selesai):** redesign editorial Home dan header/footer: hero foto, palet sage-ink, kartu tier, section cara kerja, pencarian katalog, serta komponen kartu dan langkah.
6. **Fase 6 (selesai):** penyamaan desain seluruh alur customer (toko, checkout, pembayaran, tiket, pesanan, ulasan) dengan bahasa visual Home, termasuk header foto bersama dan penghapusan aksen amber.
7. **Fase 7 (selesai):** penyamaan desain area mitra (dasbor, stok & jadwal, terminal verifikasi PIN) dengan bahasa visual Home dan alur customer, termasuk penghapusan aksen amber/stone.
8. **Fase 8 (selesai):** deploy frontend & API ke Vercel (Services), database Supabase, plus uptime ping harian.
