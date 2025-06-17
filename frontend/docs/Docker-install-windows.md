# fAIr Docker Installation Guide (Windows)

This guide will help you set up the fAIr project for local development on Windows using Docker Compose.  
**Note:** This setup is for development only. For production, use a more secure and robust deployment.

---

## Prerequisites

- [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- [Git for Windows](https://git-scm.com/download/win)
- (Recommended) An NVIDIA GPU with drivers and [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
- (Optional) Python 3.9+ and pip

---

## 1. Check Your Graphics Card (Optional, but recommended)

fAIr works best with an NVIDIA GPU.  
Open **Command Prompt** and run:

```sh
nvidia-smi
```

If you see your GPU details, you’re good to go.  
If not, install the latest [NVIDIA drivers](https://www.nvidia.com/Download/index.aspx) and [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

---

## 2. Install Docker Desktop

Download and install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/).  
After installation, open Docker Desktop and ensure it is running.

Check Docker Compose is available:

```sh
docker compose version
```

---

## 3. Prepare Project Directories

It’s a good idea to keep all related directories in one place.  
Create a folder for your work (e.g., `C:\fAIr_install`), then open **Command Prompt** and run:

```sh
cd C:\fAIr_install
git clone https://github.com/hotosm/fAIr.git
git clone https://github.com/kshitijrajsharma/ramp-code-fAIr.git
mkdir ramp-variables
mkdir trainings
```

---

## 4. Download Model Variables

Download the pre-trained model variables from [Google Drive](https://drive.google.com/file/d/1YQsY61S_rGfJ_f6kLQq4ouYE2l3iRe1k/view) and extract them into your `ramp-variables` folder.

---

## 5. Set Environment Variables

Set these environment variables in your Command Prompt (replace with your actual paths):

```sh
set RAMP_HOME=C:\fAIr_install\ramp-code-fAIr
set TRAINING_WORKSPACE=C:\fAIr_install\trainings
```

You can also add these to your system environment variables for persistence.

---

## 6. Register Your Local Setup with OSM

1. Go to [OpenStreetMap](https://www.openstreetmap.org/) and log in (or create an account).
2. Go to **My Settings** → **Oauth2 Applications** → Register a new application.
3. Set permissions for "Read user preferences" and set Redirect URI to `http://127.0.0.1:3000/authenticate/`.
4. Copy your `OSM_CLIENT_ID` and `OSM_CLIENT_SECRET`.

---

## 7. Configure Environment Files

**Backend:**

```sh
cd C:\fAIr_install\fAIr\backend
copy docker_sample_env .env
```
- Edit `.env` and fill in `OSM_CLIENT_ID`, `OSM_CLIENT_SECRET`, and a random `OSM_SECRET_KEY`.
- Set `EXPORT_TOOL_API_URL=https://api-prod.raw-data.hotosm.org/v1`

**Frontend:**

```sh
cd ..\frontend
copy .env_sample .env
```
- No changes needed for development.

---

## 8. Build and Run Containers

From your main project directory (`C:\fAIr_install\fAIr`):

```sh
docker compose build
docker compose up
```

---

## 9. Run Database Migrations

Open a new Command Prompt and run:

```sh
docker exec -it api bash
```

Inside the container, run:

```sh
python manage.py makemigrations
python manage.py makemigrations login
python manage.py makemigrations core
python manage.py migrate
exit
```

---

## 10. Access the Services

- **Frontend:** http://127.0.0.1:3000  
- **Backend API:** http://127.0.0.1:8000  
- **Flower (Task Queue Monitor):** http://127.0.0.1:5500  

---

## 11. (Optional) Use Local Tiles

If you want to serve your own map tiles, use [TiTiler](https://github.com/developmentseed/titiler), [gdal2tiles](https://gdal.org/programs/gdal2tiles.html), or nginx.  
To allow Docker containers to access your local TMS server, add:

```yaml
network_mode: "host"
```
to the relevant services in your `docker-compose` file, and update `.env` accordingly.

---

## Troubleshooting

- **Docker not running?** Start Docker Desktop.
- **Port conflicts?** Change ports in `docker-compose.prod.yml`.
- **Database/Redis issues?**  
  ```sh
  docker compose logs postgres
  docker compose logs redis
  ```

---

For more help, open an issue on [GitHub](https://github.com/hotosm/fAIr/issues) or join our [community Slack](https://slack.hotosm.org).

---

Happy mapping!