# Deployment Guide (DigitalOcean)

## Ringkasan

Dokumen ini menjelaskan langkah setup deployment monorepo menggunakan GitHub Actions dan DigitalOcean, dengan backend Rails melalui Kamal.

## Prasyarat

- Akun DigitalOcean
- Droplet Ubuntu (disarankan 22.04)
- Domain (opsional)
- Akses SSH ke droplet

## Langkah 1: Siapkan Droplet

1. Buat droplet Ubuntu 22.04.
2. Pasang Docker dan Docker Compose.
3. Buka port 80 dan 443 di firewall droplet.

## Langkah 2: Generate SSH Key

1. Generate SSH key baru menggunakan perintah berikut (ganti email dengan milik Anda):

   ```bash
   # Generate a new ed25519 SSH key (ganti email dengan milik Anda)
   ssh-keygen -t ed25519 -C "you@example.com" -f ~/.ssh/id_ed25519 -N ""
   ```

   - File `id_ed25519` adalah private key.
   - File `id_ed25519.pub` adalah public key.

2. Tambahkan public key ke `~/.ssh/authorized_keys` pada droplet (jika belum ada):

   ```bash
   # Salin public key ke droplet
   ssh-copy-id -i ~/.ssh/id_ed25519.pub root@<droplet-ip>
   ```

   Atau secara manual:

   ```bash
   # Buka authorized_keys pada droplet
   ssh root@<droplet-ip> "mkdir -p ~/.ssh && echo '$(cat ~/.ssh/id_ed25519.pub)' >> ~/.ssh/authorized_keys"
   ```

3. Salin private key ke GitHub Secrets sebagai `SSH_PRIVATE_KEY`:

   ```bash
   # Tampilkan private key untuk disalin
   cat ~/.ssh/id_ed25519
   ```

   Salin seluruh output dan tambahkan ke GitHub Repository Settings → Secrets and variables → Actions sebagai `SSH_PRIVATE_KEY`.

4. Opsional: Tambahkan key ke ssh-agent:

   ```bash
   # Mulai ssh-agent jika belum berjalan
   eval "$(ssh-agent -s)"

   # Tambahkan key ke ssh-agent
   ssh-add ~/.ssh/id_ed25519
   ```

## Langkah 3: Setup SSH Connection ke Server

### Test koneksi SSH ke droplet

```bash
# Ganti root@IP_DROPLET dengan user dan IP droplet Anda
ssh root@IP_DROPLET
```

### Menambahkan server ke known_hosts (opsional untuk local)

```bash
# Menambahkan fingerprint server ke known_hosts
ssh-keyscan -H IP_DROPLET >> ~/.ssh/known_hosts
```

### Untuk GitHub Actions (CI/CD), tambahkan konfigurasi SSH

```bash
# Di workflow GitHub Actions, tambahkan step untuk setup SSH
- name: Setup SSH
  run: |
    mkdir -p ~/.ssh
    echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_ed25519
    chmod 600 ~/.ssh/id_ed25519
    ssh-keyscan -H ${{ secrets.DROPLET_IP }} >> ~/.ssh/known_hosts
```

### Verifikasi koneksi

```bash
ssh -o StrictHostKeyChecking=no root@IP_DROPLET "echo 'SSH connection successful'"
```

### Catatan Penting

- Pastikan port 22 terbuka di firewall droplet
- Untuk GitHub Actions, gunakan `StrictHostKeyChecking=no` atau tambahkan ke known_hosts
- Ganti `IP_DROPLET` dengan IP address droplet DigitalOcean Anda

## Langkah 4: Mendapatkan RAILS_MASTER_KEY

`RAILS_MASTER_KEY` adalah kunci rahasia yang digunakan untuk mendekripsi `config/credentials.yml.enc` yang berisi konfigurasi production (database, API keys, dll.).

### Dari file master.key yang sudah ada

Jika file `config/master.key` sudah ada di lokal, Anda bisa melihat isinya dengan:

```bash
cat config/master.key
```

Salin output tersebut untuk digunakan sebagai secret di GitHub Actions.

### Jika file master.key hilang atau belum ada

Jika file `config/master.key` tidak ada, Anda perlu generate key baru:

1. Generate secret key baru:

   ```bash
   rails secret
   ```

2. Simpan output tersebut ke `config/master.key`:

   ```bash
   echo "output_dari_rails_secret" > config/master.key
   ```

   Ganti `output_dari_rails_secret` dengan hasil dari perintah `rails secret`.

### Alternatif - Edit credentials (akan membuat master.key otomatis)

Rails akan membuat `config/master.key` otomatis jika belum ada ketika Anda mengedit credentials:

```bash
EDITOR=vim rails credentials:edit
```

Setelah file dibuat, Anda bisa melihat isinya dengan:

```bash
cat config/master.key
```

### Catatan Penting

- `config/master.key` **TIDAK** boleh di-commit ke Git (sudah ada di `.gitignore`)
- Isi file ini harus disimpan sebagai secret di GitHub Actions dengan nama `RAILS_MASTER_KEY`
- Key ini digunakan untuk mendekripsi `config/credentials.yml.enc` yang berisi konfigurasi production (database, API keys, dll.)
- Jika key hilang, Anda tidak akan bisa mendekripsi credentials yang sudah ada

## Langkah 5: Konfigurasi Kamal

1. Edit `backend/config/deploy.yml`:
   - Ganti `servers.web` ke IP droplet DigitalOcean.
   - Atur `registry.server` sesuai registry yang digunakan.
2. Pastikan `backend/.kamal/secrets` berisi `RAILS_MASTER_KEY`.

## Langkah 6: Setup Secrets di GitHub

Tambahkan secrets berikut di GitHub Repository Settings → Secrets and variables → Actions:

- `DEPLOY_HOST`: IP atau hostname droplet.

- `SSH_PRIVATE_KEY`: Private key untuk akses droplet.

## Langkah 7: Struktur Workflow

Workflow utama berada di `.github/workflows/ci.yml` dan berjalan untuk monorepo:

- Path filtering menentukan job frontend/backend.
- Cache Ruby dan Node untuk akselerasi build.
- Deploy otomatis backend ke droplet ketika push ke `main`.

## Langkah 8: Jalankan Deployment

1. Push ke branch `main`.
2. GitHub Actions menjalankan job backend dan deploy otomatis.
3. Verifikasi aplikasi dengan mengakses IP/domain droplet.

## Troubleshooting

- Jika deploy gagal, cek log Actions pada job `backend_deploy`.
- Pastikan SSH key dan `RAILS_MASTER_KEY` benar.
- Pastikan droplet dapat diakses dari GitHub Actions.
