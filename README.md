# Savora

Marketplace **hyper-local food rescue** untuk Malang. Savora menghubungkan toko roti, kafe, dan restoran yang punya surplus makanan layak konsumsi dengan customer yang ingin makan lebih murah lewat paket **Surprise Bag** dengan *self-pickup*.

> Dokumen produk lengkap ada di [`PRD.md`](./PRD.md).

## Status Saat Ini

Repo ini berisi fondasi aplikasi dan katalog publik yang sudah terhubung ke database.

Sudah tersedia:

- Monorepo npm workspaces: `client/` (Vue 3 + TypeScript) dan `server/` (Express + TypeScript).
- Prisma schema lengkap untuk `User`, `Store`, `StoreSchedule`, `Tier`, `Order`, dan `OrderAudit`.
- Seed data 8 toko di Malang, 3 tier per toko, akun demo customer/merchant/admin.
- API `GET /api/health`, `GET /api/stores`, dan `GET /api/stores/:id`.
- Halaman beranda, katalog dengan peta Leaflet, dan detail toko + tier.
- Halaman login/register (UI siap, endpoint auth menyusul).
- Halaman placeholder checkout, pembayaran, tiket, dan riwayat pesanan.
- Cron `node-cron` untuk menandai order `PAID` yang kedaluwarsa sebagai `EXPIRED`.
- Build produksi dan typecheck bebas error.

Belum diimplementasikan (tahap berikutnya):

- Endpoint auth JWT + bcrypt.
- Order, mock payment, PIN, verifikasi merchant, feedback.
- Dashboard merchant dan admin.
- Aturan katalog berdasarkan jam pickup dan stok (saat ini filter status + stok).

## Tech Stack

| Layer | Teknologi |
| :--- | :--- |
| Frontend | Vue 3 Composition API, Vite, TypeScript, Pinia, Vue Router |
| Styling | Tailwind CSS |
| Peta | Leaflet + OpenStreetMap (tanpa API key) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth (rencana) | JSON Web Token + bcrypt |
| Scheduler | node-cron |
| Zona waktu | Luxon / `Asia/Jakarta` |

## Struktur Repo

```text
Savora/
├─ client/
│  └─ src/
│     ├─ components/      # common, store, order
│     ├─ layouts/         # PublicLayout, CustomerLayout
│     ├─ router/          # route + guard role
│     ├─ services/        # axios + service per domain
│     ├─ stores/          # Pinia: auth, catalog, order
│     ├─ types/           # tipe domain
│     ├─ utils/           # format, error handling
│     └─ views/           # public, auth, customer
├─ server/
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ seed.ts
│  └─ src/
│     ├─ config/          # env, prisma client
│     ├─ jobs/            # cron expire order
│     ├─ middleware/      # auth, role, validate, error
│     ├─ modules/         # auth, stores, orders, health
│     ├─ types/           # augmentasi Express Request
│     └─ utils/           # jwt, password, pin, time, distance
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
   ```

   File `.env` sudah dibuat untuk development dan **tidak** ikut ter-commit.

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

Semua akun memakai password `password123`.

| Role | Email | Catatan |
| :--- | :--- | :--- |
| Customer | `customer@savora.id` | Untuk alur pemesanan |
| Merchant | `merchant@savora.id` | Pemilik Roti Asri Lowokwaru |
| Admin | `admin@savora.id` | Untuk panel admin |

Seed juga membuat merchant2–merchant8 untuk toko lainnya.

## Script Root

| Script | Fungsi |
| :--- | :--- |
| `npm run dev` | Jalankan server + client dengan concurrently |
| `npm run build` | Build server (tsc) dan client (vite) |
| `npm run typecheck` | Typecheck server dan client |
| `npm run seed` | Jalankan `prisma db seed` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:studio` | Buka Prisma Studio |

## API Yang Sudah Ada

| Method | Endpoint | Keterangan |
| :--- | :--- | :--- |
| GET | `/api/health` | Status API + koneksi database |
| GET | `/api/stores?q=` | Toko ACTIVE yang masih punya stok, opsional pencarian |
| GET | `/api/stores/:id` | Detail toko + tier + jadwal pickup |
| ALL | `/api/auth/*` | Placeholder 501 |
| ALL | `/api/orders/*` | Placeholder 501 |

## Catatan Teknis

- **Password hashing:** memakai `bcryptjs` (implementasi bcrypt murni JavaScript) agar tidak perlu kompilasi native di Windows. Algoritmanya tetap bcrypt dengan 12 salt rounds.
- **Zona waktu:** seluruh logika jadwal menggunakan `Asia/Jakarta`, bukan zona waktu server.
- **Jam pickup:** Prisma menyimpan `TIME`; helper `dbTimeToString()` mengembalikan `HH:mm` untuk API dan UI.
- **Stok katalog:** endpoint katalog saat ini menyaring toko `ACTIVE` dan stok > 0. Filter "jam pickup sudah lewat" akan ditambahkan bersama modul order.
- **Map:** Leaflet memakai tile OpenStreetMap, jadi tidak memerlukan API key.
- **PIN:** helper generator 4 digit sudah tersedia; pengecekan keunikan akan dilakukan di modul order.

## Roadmap

1. **Fase 1 (berikutnya):** auth JWT, order + reservasi stok, mock payment, PIN, tiket, cron expiry.
2. **Fase 2:** dashboard merchant, kelola stok/tier/jadwal, terminal verifikasi PIN, rekap harian.
3. **Fase 3:** approval merchant, monitoring red flag, laporan transaksi admin, feedback customer.
4. **Deploy:** frontend Vercel, backend Render, database Neon/Supabase.
