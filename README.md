# Event Registration & Check-in

Website siap-deploy untuk:
- Registrasi peserta
- QR code otomatis
- Link peserta
- Tombol kirim WhatsApp tanpa WhatsApp API
- Login admin
- Scan QR via kamera HP
- Check-in
- Daftar seluruh peserta
- Daftar peserta hadir
- Dashboard statistik
- Distribusi ukuran baju
- Responsive mobile

## Stack
- React + Vite
- Supabase Auth + PostgreSQL
- qrcode
- html5-qrcode
- Lucide React

## 1. Buat Supabase
Buat project gratis di Supabase, lalu buka SQL Editor dan jalankan:
`supabase/schema.sql`

## 2. Buat akun admin
Di Supabase:
Authentication > Users > Add user

Gunakan:
Email: superadmin@mail.com
Password: 123456

Untuk penggunaan nyata, ganti password default tersebut setelah instalasi awal.

## 3. Konfigurasi frontend
Copy `.env.example` menjadi `.env` lalu isi:
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY

Jangan masukkan service_role/secret key ke frontend.

## 4. Jalankan lokal
npm install
npm run dev

## 5. Build production
npm run build

Folder `dist` dapat dideploy ke Vercel/Netlify. HTTPS diperlukan agar kamera QR scanner dapat digunakan di HP.

## Catatan keamanan
- Halaman admin dan scan hanya dapat dibuka setelah login.
- Anonymous user hanya dapat membuat registrasi dan membuka halaman peserta melalui link unik.
- Data peserta tidak diberikan sebagai daftar kepada anonymous user.
- RLS Supabase dipakai untuk membatasi akses database.
- QR berisi URL peserta unik, sehingga scanner dapat menemukan peserta yang tepat.
