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
2. Pasang Docker dan Docker Compose:

   ```bash
   # Update package index
   sudo apt-get update

   # Install prerequisites
   sudo apt-get install -y ca-certificates curl gnupg lsb-release

   # Add Docker's official GPG key
   sudo mkdir -p /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

   # Set up Docker repository
   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

   # Install Docker Engine
   sudo apt-get update
   sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

   # Verify Docker installation
   sudo docker run hello-world

   # Add current user to docker group (optional, untuk menjalankan docker tanpa sudo)
   sudo usermod -aG docker $USER

   # Enable Docker to start on boot
   sudo systemctl enable docker
   sudo systemctl start docker
   ```

3. Buka port 80 dan 443 di firewall droplet:

   ```bash
   # Jika menggunakan UFW
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable

   # Jika menggunakan DigitalOcean Cloud Firewall, tambahkan rule di panel DigitalOcean
   ```

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

- `RAILS_MASTER_KEY`: Kunci untuk mendekripsi credentials (lihat Langkah 4).

- `KAMAL_REGISTRY_PASSWORD`: Password untuk registry (jika menggunakan authenticated registry).

### Environment Variables untuk Database

Pastikan environment variables berikut di-set di server deployment atau melalui Kamal:

**Opsi 1: Menggunakan DATABASE_URL (disarankan)**

```bash
# Di backend/.kamal/secrets atau di server
DATABASE_URL="postgres://backend:password@localhost:5432/backend_production"
```

**Opsi 2: Menggunakan konfigurasi terpisah**

```bash
# Di backend/.kamal/secrets atau di server
BACKEND_DATABASE_PASSWORD="your_secure_password"
```

Pastikan PostgreSQL server tersedia dan dapat diakses dari droplet. Anda bisa:

- Menggunakan PostgreSQL di droplet yang sama
- Menggunakan managed database seperti DigitalOcean Managed Databases
- Menggunakan database server eksternal

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

### Error: "docker: command not found"

Jika deployment gagal dengan error `bash: line 1: docker: command not found`, berarti Docker belum terinstall pada droplet deployment.

**Solusi:**

1. SSH ke droplet:

   ```bash
   ssh root@<droplet-ip>
   ```

2. Install Docker (lihat Langkah 1 di atas untuk detail lengkap):

   ```bash
   # Quick install script (recommended)
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Verify installation
   sudo docker --version
   ```

3. Pastikan user yang digunakan untuk deployment memiliki akses ke Docker:

   ```bash
   # Jika menggunakan user root (default), sudah memiliki akses
   # Jika menggunakan user lain, tambahkan ke docker group:
   sudo usermod -aG docker <username>
   ```

4. Restart deployment:
   ```bash
   # Dari local machine
   cd backend
   bundle exec kamal deploy
   ```

### Error: "Permission denied" pada Docker build

Jika build Docker gagal dengan error `/bin/sh: 1: ./bin/rails: Permission denied`, file executable tidak memiliki permission yang benar.

**Solusi:**

Dockerfile sudah diperbaiki dengan menambahkan `RUN chmod +x bin/*` setelah copy application code. Pastikan Anda menggunakan versi terbaru dari Dockerfile.

### Error: "target failed to become healthy within configured timeout"

Jika deployment gagal dengan error `Error: target failed to become healthy within configured timeout (30s)`, container tidak berhasil menjadi healthy dalam waktu yang ditentukan.

**Penyebab Umum:**

1. Database tidak tersedia atau tidak dapat diakses
2. Environment variable database tidak di-set dengan benar
3. Rails server gagal start karena error konfigurasi
4. Health check endpoint tidak merespons

**Solusi:**

1. **Cek log container untuk melihat error:**

   ```bash
   # SSH ke droplet
   ssh root@<droplet-ip>

   # Lihat log container
   docker logs backend-web-<version>

   # Atau menggunakan Kamal
   cd backend
   bundle exec kamal app logs -f
   ```

2. **Verifikasi konfigurasi database:**

   Pastikan environment variables di-set di `backend/.kamal/secrets` atau di server:

   ```bash
   # Opsi 1: Menggunakan DATABASE_URL (disarankan)
   DATABASE_URL="postgres://backend:password@localhost:5432/backend_production"

   # Opsi 2: Menggunakan password terpisah
   BACKEND_DATABASE_PASSWORD="your_secure_password"
   ```

3. **Pastikan PostgreSQL tersedia:**

   ```bash
   # Cek jika PostgreSQL berjalan
   sudo systemctl status postgresql

   # Install PostgreSQL jika belum ada
   sudo apt-get install -y postgresql postgresql-contrib

   # Buat database dan user
   sudo -u postgres psql
   CREATE DATABASE backend_production;
   CREATE USER backend WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE backend_production TO backend;
   \q
   ```

4. **Verifikasi health check endpoint:**

   Dockerfile sudah dikonfigurasi dengan health check yang memanggil `/up` endpoint. Pastikan route ini tersedia:

   ```ruby
   # routes.rb
   get "up" => "rails/health#show", as: :rails_health_check
   ```

5. **Tingkatkan timeout health check (opsional):**

   Jika aplikasi membutuhkan waktu lebih lama untuk start, Anda bisa mengubah konfigurasi health check di Dockerfile:

   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=30s --start-period=120s --retries=5 \
     CMD curl -f http://localhost:80/up || exit 1
   ```

6. **Debug database connection:**
   ```bash
   # Test koneksi database dari dalam container
   docker exec -it backend-web-<version> rails db:prepare
   ```

### Error lainnya

- Jika deploy gagal, cek log Actions pada job `backend_deploy`.
- Pastikan SSH key dan `RAILS_MASTER_KEY` benar.
- Pastikan droplet dapat diakses dari GitHub Actions.
- Cek log Kamal: `cd backend && bundle exec kamal app logs -f`
- Verifikasi koneksi SSH: `ssh -o StrictHostKeyChecking=no root@<droplet-ip> "echo 'SSH OK'"`
