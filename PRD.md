# Product Requirement Document (PRD) — Savora

**Project Name:** Savora  
**Tagline:** Hyper-Local Food Rescue Marketplace  
**Version:** 1.0.0  
**Target Region:** Malang, East Java, Indonesia  
**Document Status:** Final Draft  

---

## 1. Project Overview

**Savora** adalah platform web *hyper-local food rescue* berkonsep *Surprise Bag* (Tas Kejutan) berbasis *self-pickup*. Platform ini menghubungkan toko roti, kafe, dan restoran yang memiliki surplus makanan harian layak konsumsi dengan konsumen (mahasiswa dan pemburu diskon) pada jendela waktu menjelang toko tutup.

Savora mengunci harga jual dengan sistem **Tier Diskon Standardized (60%–70%)** untuk memangkas kerumitan kasir mendata produk sisa satu per satu. Proyek ini dirancang sebagai aplikasi *full-stack* modern yang tangguh, terukur, dan siap digunakan sebagai portofolio pengembang profesional.

---

## 2. User Roles (Peran Pengguna)

| Role | Deskripsi & Hak Akses |
| :--- | :--- |
| **Customer (Pembeli)** | Pengguna umum yang mendaftar untuk mencari toko terdekat, memilih paket *Surprise Bag*, melakukan checkout simulasi, dan mengambil pesanan menggunakan PIN unik. |
| **Merchant (Mitra Toko / Kasir)** | Staf atau kasir toko yang mengelola ketersediaan stok *Surprise Bag* harian, mengatur jendela waktu *pickup*, dan memvalidasi PIN 4-digit pembeli di lokasi. |
| **Admin (Superadmin)** | Pengelola platform yang menyetujui pendaftaran mitra baru, memantau riwayat transaksi sistem, dan mengawasi indikator kelayakan toko berdasarkan masukan pengguna. |

---

## 3. Goals

### 3.1. Business & Social Goals
*   **Cost Recovery Mitra:** Membantu toko roti/kafe menyelamatkan modal bahan baku (HPP) dari makanan layak konsumsi yang berisiko terbuang di akhir hari.
*   **Akses Makanan Murah:** Menyediakan akses makanan berkualitas dengan harga terjangkau bagi mahasiswa dan masyarakat beranggaran terbatas di Malang.
*   **Pencegahan Food Waste:** Mengurangi volume sampah organik dari sektor F&B harian secara signifikan.

### 3.2. Technical & Portfolio Goals
*   Mengimplementasikan arsitektur *decoupled full-stack* modern (Vue.js 3 + Node.js Express + PostgreSQL).
*   Menyediakan manajemen state (*State Management*) dan *Role-Based Access Control* (RBAC) yang aman.
*   Menyajikan logika transaksi *real-time* yang mencakup *time-window lock*, konfirmasi pembayaran *sandbox*, dan algoritma verifikasi PIN 4-digit.

---

## 4. Feature List

### 4.1. Customer Features
*   **Store Exploration & Search:** Katalog toko terdekat dengan indikator sisa stok dan jam *pickup*.
*   **Tier Selection & Detail:** Tampilan opsi paket (Hemat, Reguler, Besar) beserta informasi batas nilai makanan di dalamnya.
*   **Checkout & Sandbox Payment:** Formulir ringkasan pesanan dan simulasi pembayaran QRIS/E-Wallet.
*   **Digital Pickup Ticket:** Halaman tiket aktif berisi kode PIN 4-digit, peta lokasi toko, dan *countdown timer* batas waktu pengambilan.
*   **Crowdsourcing Feedback:** Pop-up evaluasi cepat (*Ya/Tidak*) setelah pesanan selesai untuk mengonfirmasi kelayakan isi kantong.

### 4.2. Merchant Features
*   **Daily Stock Toggle & Tier Management:** Antarmuka ringkas untuk menambah/mengurangi jumlah stok kantong pada tiap Tier serta tombol buka/tutup toko.
*   **PIN Verification Terminal:** Input pad 4-digit untuk memverifikasi PIN tiket milik pembeli saat tiba di toko.
*   **Daily Sales Summary:** Rekapitulasi transaksi harian yang mencakup jumlah kantong terjual dan estimasi pendapatan bersih.

### 4.3. Admin Features
*   **Merchant Onboarding & Approval:** Panel verifikasi pendaftaran akun toko baru.
*   **System Audit & Quality Monitoring:** Dasbor pemantauan toko yang mendapatkan laporan indikator kelayakan rendah (*Red Flag*).
*   **Transaction & Payout Overview:** Laporan total transaksi keseluruhan dan rekap dana yang siap dicairkan ke mitra.

---

## 5. Flow System

### 5.1. Merchant Stock Input Flow
```
[Kasir Login] ➔ [Buka Dasbor Mitra] ➔ [Hitung Total Est. Harga Asli] ➔ [Input Jumlah Stok Tier] ➔ [Set Jam Pickup] ➔ [Publikasi Stok]
```

### 5.2. Customer Order & Checkout Flow
```
[Customer Login] ➔ [Pilih Toko & Tier Bag] ➔ [Checkout] ➔ [Simulasi Pembayaran (Sandbox)] ➔ [Sistem Validasi] ➔ [Generate PIN 4-Digit & Tiket Aktif]
```

### 5.3. Pickup & Verification Flow
```
[Customer Datang ke Toko] ➔ [Tunjukkan Tiket & PIN] ➔ [Kasir Input PIN di Terminal] ➔ [Sistem Cocokkan PIN] ➔ [Status: Completed] ➔ [Customer Beri Feedback]
```

### 5.4. Expired Order Flow
```
[Jam Pickup Berakhir] ➔ [Cron Job / Worker Check] ➔ [Pesanan Belum Diambil (Status: Paid)] ➔ [Status Otomatis ➔ Expired] ➔ [Dana Terkunci / No Refund]
```

---

## 6. Functional Requirements

### 6.1. Authentication & Authorization (FR-AUTH)
*   **FR-AUTH-01:** Sistem harus mendukung pendaftaran dan login menggunakan JWT (*JSON Web Token*) untuk `Customer`, `Merchant`, dan `Admin`.
*   **FR-AUTH-02:** Password wajib dienkripsi menggunakan algoritma *hashing* `bcrypt` sebelum disimpan ke database.
*   **FR-AUTH-03:** Middleware backend harus memvalidasi token dan hak akses (*role*) pada setiap *protected endpoint*.

### 6.2. Store & Tier Management (FR-STORE)
*   **FR-STORE-01:** Merchant dapat memperbarui kuantitas stok untuk 3 Tier baku:
    *   **Tier Hemat:** Harga Jual Rp15.000 *(Nilai Asli Min. Rp45.000)*
    *   **Tier Reguler:** Harga Jual Rp25.000 *(Nilai Asli Min. Rp75.000)*
    *   **Tier Besar:** Harga Jual Rp35.000 *(Nilai Asli Min. Rp105.000)*
*   **FR-STORE-02:** Merchant wajib menentukan jendela waktu pengambilan (misal: 20:30 – 21:30 WIB).
*   **FR-STORE-03:** Sistem otomatis menyembunyikan toko dari katalog publik jika seluruh stok Tier bernilai 0 atau jam *pickup* telah terlewati.

### 6.3. Order & Payment Engine (FR-ORDER)
*   **FR-ORDER-01:** Customer dibatasi membeli maksimal 2 kantong per transaksi per toko harian.
*   **FR-ORDER-02:** Pembayaran menggunakan sistem *sandbox* (mock payment). Setelah tombol bayar ditekan, status pesanan berubah dari `PENDING` menjadi `PAID`.
*   **FR-ORDER-03:** Saat status menjadi `PAID`, sistem mengenerate 4-digit PIN acak unik yang diasosiasikan dengan `Order ID` tersebut.

### 6.4. Verification & Audit Engine (FR-VERIFY)
*   **FR-VERIFY-01:** Merchant memasukkan 4-digit PIN pada terminal validasi. Jika cocok dan waktu masih dalam batas jam *pickup*, status pesanan berubah menjadi `COMPLETED`.
*   **FR-VERIFY-02:** Jika PIN salah atau waktu *pickup* kadaluarsa, sistem mengembalikan respon eror yang sesuai.
*   **FR-VERIFY-03:** Setelah status `COMPLETED`, Customer dapat memberikan ulasan *Binary* (Sesuai / Tidak Sesuai). Jika toko mengumpulkan >20% ulasan "Tidak Sesuai", status toko diubah menjadi `WARNING` di dasbor Admin.

---

## 7. Tech Stack & Software Architecture

### 7.1. Stack Specification
*   **Frontend Framework:** Vue.js 3 (Composition API) + Vite
*   **State Management & Routing:** Pinia & Vue Router
*   **UI Styling:** Tailwind CSS
*   **Backend Framework:** Node.js + Express.js (RESTful API)
*   **Database:** PostgreSQL
*   **Database Client / Driver:** `pg` (node-postgres) atau Prisma ORM
*   **Authentication:** JSON Web Token (JWT) & bcrypt

### 7.2. Database Schema (Entity Relationship Overview)

```
Users (id, name, email, password_hash, role, phone, created_at)
  │
  ├── Stores (id, user_id [Merchant], store_name, address, latitude, longitude, status)
  │     │
  │     └── StoreSchedules (id, store_id, pickup_start, pickup_end)
  │     │
  │     └── Tiers (id, store_id, name [Hemat/Reguler/Besar], price, min_original_value, stock)
  │
  └── Orders (id, customer_id, store_id, tier_id, qty, total_price, status, pin_code, expires_at, created_at)
        │
        └── OrderAudits (id, order_id, is_satisfied, comment, created_at)
```

### 7.3. Deployment & Portfolio Hosting Plan
*   **Frontend:** Vercel (Terhubung ke repository GitHub)
*   **Backend:** Vercel (Express Serverless Function) / Render
*   **Database Cloud:** Supabase / Neon.tech (Managed Cloud PostgreSQL Instance)