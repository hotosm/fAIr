# Project Architecture

This page provides a high-level overview of the fAIr platform’s architecture, including its main components, data flow, and technology stack.

---

## Overview

fAIr is a modular, containerized platform designed for AI-assisted mapping. It consists of several services that work together to process imagery, train AI models, and assist users in mapping tasks.

---

## Main Components

- **Frontend**  
  Built with React and TypeScript, the frontend provides an intuitive web interface for users to manage datasets, train models, and perform mapping tasks.

- **Backend API**  
  Powered by Django (Python), the backend exposes REST APIs for user management, dataset handling, model training, and prediction services.

- **AI/ML Workers**  
  Use TensorFlow and PyTorch for training and running AI models. Workers are managed via Celery for distributed task processing.

- **Database**  
  PostgreSQL with PostGIS extension stores user data, project metadata, and geospatial information.

- **Redis**  
  Used as a message broker for Celery task queues.

- **Flower**  
  Provides a web UI for monitoring Celery tasks and workers.

- **Developer Documentation**  
  Served via VitePress. Run `npm run docs:dev` and visit the port shown in your terminal.

---

## Data Flow

1. **User uploads or selects imagery** (e.g., from OpenAerialMap).
2. **Frontend sends requests** to the backend API to create datasets and manage projects.
3. **Backend schedules AI tasks** (training, prediction) via Celery.
4. **AI/ML workers** process imagery and labels, train models, and generate predictions.
5. **Results are stored** in the database and made available to the frontend for review and editing.
6. **Users review, edit, and validate predictions** before exporting or uploading to OSM.

---

## Technology Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Django, Django REST Framework
- **AI/ML:** TensorFlow, PyTorch
- **Task Queue:** Celery, Redis
- **Database:** PostgreSQL, PostGIS
- **Containerization:** Docker, Docker Compose
- **Documentation:** MkDocs Material

---

## Deployment

All services are containerized and orchestrated using Docker Compose.  
See [Docker Installation (Linux/Mac)](Docker-installation.md) or [Docker Installation (Windows)](Docker-install-windows.md) for setup instructions.

---

## Extending the Platform

- **Add new AI models:** Integrate custom models by extending the AI worker codebase.
- **API integrations:** Use the REST API to connect with external tools or automate workflows.
- **Frontend plugins:** Enhance the user interface with new features or visualization tools.

---

## Diagram

> _A system architecture diagram can be added here for visual reference (e.g., using [diagrams.net](https://diagrams.net) or Mermaid)._

---

For more details, see the [contributing guide](contributing.md) or open an issue on [GitHub](https://github.com/hotosm/fAIr/issues).