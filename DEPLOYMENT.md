# Deployment

Target arsitektur:

- **Frontend** — Next.js 16 di **Vercel**
- **Backend** — Hono di **Railway**, dengan **Railway Postgres**
- **Auth** — Telegram Mini App (verifikasi `initData` di backend)

Status saat ini: frontend siap deploy. Backend **belum ada** di repo ini — semua
data masih dari `lib/mock-data.ts` dan state hidup di React Context
(`lib/store.tsx`). Bagian 2 di bawah adalah rencana, bukan sesuatu yang sudah
bisa dijalankan.

---

## 1. Frontend → Vercel

### Prasyarat

Tidak ada environment variable yang wajib. Satu-satunya pemakaian
`process.env` di app adalah `NODE_ENV` (untuk mengaktifkan `@vercel/analytics`
hanya di production), dan itu diisi otomatis oleh Vercel.

### Langkah

1. Vercel Dashboard → **Add New** → **Project** → import `llianified/PICO`.
2. Biarkan semua setting default. Vercel mendeteksi:
   - Framework: Next.js
   - Package manager: pnpm (dari `pnpm-lock.yaml`)
   - Build command: `pnpm build`
   - Output: `.next`
3. **Deploy.**

Alternatif: klik **Publish** di kanan atas v0.

### Yang perlu diperhatikan

- **Jangan** memakai `pnpm lint` sebagai build command. Lint saat ini melaporkan
  13 error React Compiler di `lib/store.tsx` (`react-hooks/set-state-in-effect`,
  `react-hooks/immutability`). Ini isu kualitas kode yang sudah ada sebelumnya
  dan **tidak** menggagalkan `next build`, tapi akan menggagalkan build kalau
  lint dijadikan gate. Perlu dibereskan terpisah sebelum backend masuk, karena
  effect yang menulis state akan makin rapuh begitu ada data async.
- `next build` menjalankan type-check TypeScript, jadi type error **akan**
  menggagalkan deploy. Saat ini bersih.
- Security header sudah diset di `next.config.mjs` (`nosniff`,
  `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`).
  Catatan: `X-Frame-Options: SAMEORIGIN` **memblokir embed lintas origin** —
  ini akan menghalangi Telegram Mini App yang berjalan di dalam webview
  Telegram. Header ini harus dilonggarkan saat auth Telegram dikerjakan (lihat
  bagian 2).
- `images.unoptimized: true` mematikan Image Optimization Vercel. Aman, tapi
  kalau nanti ada aset berat pertimbangkan menyalakannya.

### Verifikasi setelah live

Buka URL production, cek kelima tab bawah (Home, Adventure, Inventory, Wallet,
Profile) berpindah, lalu reload — state akan kembali ke awal, karena belum ada
persistence. Itu ekspektasi yang benar untuk tahap ini.

---

## 2. Backend → Railway (belum dibangun)

### Struktur yang direncanakan

Ubah repo jadi pnpm workspace supaya frontend dan backend hidup berdampingan:

```
PICO/
├── pnpm-workspace.yaml
├── apps/
│   ├── web/     # Next.js (isi repo saat ini dipindah ke sini)
│   └── api/     # Hono + Postgres
```

`pnpm.overrides.hono` sudah ada di `package.json` (dipin ke `4.12.25`), jadi
versi Hono konsisten begitu `apps/api` dibuat.

### Setup Railway

1. Railway → **New Project** → **Deploy from GitHub repo** → pilih `llianified/PICO`.
2. Service Settings → **Root Directory**: `apps/api`.
3. Start command: `pnpm start` (Railway auto-detect Node dari `package.json`).
4. Di project yang sama: **New** → **Database** → **Add PostgreSQL**.
   Railway meng-inject `DATABASE_URL` ke service backend secara otomatis —
   jangan hardcode.
5. Service Settings → **Networking** → **Generate Domain** untuk dapat URL publik.
6. Health check path: `/health` (sediakan endpoint ini di Hono).

### Environment variables

Di **Railway** (backend):

| Variable | Sumber | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | auto dari Railway Postgres | jangan diisi manual |
| `TELEGRAM_BOT_TOKEN` | BotFather | dipakai untuk verifikasi HMAC `initData` |
| `SESSION_SECRET` | `openssl rand -base64 32` | signing session/JWT |
| `CORS_ORIGIN` | domain Vercel | mis. `https://pico.vercel.app` |
| `PORT` | auto dari Railway | server harus `listen` ke `process.env.PORT` |

Di **Vercel** (frontend):

| Variable | Nilai |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL publik service Railway |

Set `NEXT_PUBLIC_API_URL` untuk ketiga environment (Production, Preview,
Development). Ingat prefix `NEXT_PUBLIC_` berarti nilainya **ikut ter-bundle ke
browser** — jangan pernah menaruh secret di situ.

### Urutan pengerjaan

1. Ubah repo jadi workspace, pindahkan app ke `apps/web`.
2. Scaffold `apps/api` (Hono + driver Postgres + tooling migrasi).
3. Desain schema: users, wallet/balance, quests, quest progress, transactions.
   Saldo Rupiah dan riwayat transaksi harus append-only / ledger-style, bukan
   satu kolom yang di-update — supaya saldo bisa diaudit dan direkonsiliasi.
4. Verifikasi `initData` Telegram di backend, terbitkan session.
5. Ganti `lib/mock-data.ts` dengan fetch nyata; pindahkan aturan XP/koin/energy
   dari `lib/store.tsx` ke backend.
6. Longgarkan `X-Frame-Options` agar Mini App bisa di-embed Telegram.

### Catatan keamanan

Semua aturan ekonomi (XP, koin, energy, klaim reward, withdraw) saat ini
dihitung di client di `lib/store.tsx`. Begitu ini jadi aplikasi nyata, **semua
perhitungan itu harus pindah ke backend** dan client hanya menampilkan hasil.
Logika ekonomi yang tinggal di client bisa dimanipulasi siapa pun lewat
devtools, dan di sini yang dipertaruhkan adalah saldo uang.
