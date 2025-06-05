# Welcome to fAIr

**fAIr** is an open-source, AI-assisted mapping platform by the Humanitarian OpenStreetMap Team (HOT). It empowers humanitarian mappers and local communities with accessible, fair, and transparent AI tools for mapping from satellite and UAV imagery.

---

## Quick Start

1. **Clone the repository**
    ```sh
    git clone https://github.com/hotosm/fAIr.git
    cd fAIr
    ```

2. **Copy and edit environment variables**
    ```sh
    cp .env.example .env
    # Edit .env as needed for your setup
    ```

3. **Start all services**
    ```sh
    docker compose -f docker-compose.prod.yml up --build
    ```

4. **Access the services:**
    - **API:** http://localhost:8000
    - **Developer Docs:** http://localhost:8001
    - **Flower (Task Queue Monitor):** http://localhost:5500

---

##  Documentation Index

- [About fAIr](About.md) — Project background and vision
- [Docker Installation (Linux/Mac)](Docker-installation.md)
- [Docker Installation (Windows)](Docker-install-windows.md)
- [User Manual](User-Manual-for-fAIr.md)
- [FAQ](FAQ.md)
- [Release Process](Release.md)
- [Code of Conduct](Code-of-Conduct.md)
- [Contributing Guide](contributing.md)
- [Project Architecture](architecture.md)

---

## 🛠 Troubleshooting

- Make sure Docker is running.
- If you get port conflicts, update the ports in `docker-compose.prod.yml`.
- For database or Redis issues, check the logs:
    ```sh
    docker compose logs postgres
    docker compose logs redis
    ```

---

## 💡 Useful Commands

- **Stop all services:**  
    ```sh
    docker compose down
    ```
- **Rebuild after code changes:**  
    ```sh
    docker compose build
    ```

---

## 🙋 Need Help?

- Check the [FAQ](FAQ.md)
- Join our [Slack community](https://slack.hotosm.org)
- Open an issue on [GitHub](https://github.com/hotosm/fAIr/issues)

---

Happy mapping!