# fAIr Docker Installation Guide

This guide will help you set up the fAIr project for local development using Docker Compose.  
**Note:** This setup is for development only. For production, use a more secure and robust deployment.

---

## Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/engine/install/)
- [Git](https://git-scm.com/)
- (Recommended) An NVIDIA GPU with drivers and [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
- (Optional) Python 3.9+ and pip

---

## 1. Clone the Repository

```sh
git clone https://github.com/hotosm/fAIr.git
cd fAIr
```

---

## 2. Verify Docker Installation

```sh
docker compose version
```

---

## 3. Check GPU Availability (Optional, but recommended)

fAIr works best with an NVIDIA GPU.  
Check your GPU and drivers:

```sh
nvidia-smi
```

If using Docker with GPU, ensure [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) is installed.

---

## 4. Prepare Model Data and RAMP_HOME

- **Create a folder for RAMP data (outside the fAIr repo):**

    ```sh
    mkdir ~/ramp
    ```

- **Download the base model checkpoint:**  
  [Download from Google Drive](https://drive.google.com/file/d/1YQsY61S_rGfJ_f6kLQq4ouYE2l3iRe1k/view)  
  Or use the [Model Ramp Baseline](https://github.com/radiantearth/model_ramp_baseline/tree/main/data/input/checkpoint.tf)

    ```sh
    pip install gdown
    gdown --fuzzy https://drive.google.com/file/d/1YQsY61S_rGfJ_f6kLQq4ouYE2l3iRe1k/view
    ```

- **Clone Ramp code:**

    ```sh
    git clone https://github.com/kshitijrajsharma/ramp-code-fAIr.git ramp-code
    ```

- **Unzip the base model and move it into `ramp-code/ramp`:**

    ```sh
    unzip checkpoint.tf.zip -d ramp-code/ramp
    ```

- **Set environment variables:**

    ```sh
    export RAMP_HOME=/path/to/your/ramp
    export TRAINING_WORKSPACE=/path/to/your/fAIr/trainings
    ```

---

## 5. Register Your Local Setup with OSM

1. Go to [OpenStreetMap](https://www.openstreetmap.org/), log in or create an account.
2. Go to **My Settings** → **Oauth2 Applications** → Register a new application.
3. Set permissions for "Read user preferences" and set Redirect URI to `http://127.0.0.1:3000/authenticate/`.
4. Copy your `OSM_CLIENT_ID` and `OSM_CLIENT_SECRET`.

---

## 6. Configure Environment Variables

**Backend:**

```sh
cd backend
cp docker_sample_env .env
```
- Fill in `OSM_CLIENT_ID`, `OSM_CLIENT_SECRET`, and a random `OSM_SECRET_KEY` in `.env`.

**Frontend:**

```sh
cd ../frontend
cp .env_sample .env
```
- You can leave the frontend `.env` as is for development.

---

## 7. Build & Run Containers

```sh
docker compose build
docker compose up
```

---

## 8. Run Database Migrations

You can use the provided script:

```sh
bash run_migrations.sh
```

Or run manually inside the API container:

```sh
docker exec -it api bash
python manage.py makemigrations
python manage.py makemigrations login
python manage.py makemigrations core
python manage.py migrate
```

---

## 9. Access the Services

- **Frontend:** http://127.0.0.1:3000  
  (Use `127.0.0.1` instead of `localhost` for login to work)
- **Backend API:** http://127.0.0.1:8000
- **Flower (Task Queue Monitor):** http://127.0.0.1:5500

---

## 10. (Optional) Use Local Tiles

If you want to serve your own map tiles, use [titiler](https://github.com/developmentseed/titiler), [gdal2tiles](https://gdal.org/programs/gdal2tiles.html), or nginx.  
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
