## fAIr Backend

This repository contains the backend sourcecode for the fAIr project. The backend
is composed of several services that are orchestrated using Docker Compose.

The backend of fAIr is powered by
- tensorflow:2.9.2
- django 3.1.2 & geodjango
- celery and flower
- solaris

The pretrained Convolutional Neural Network is base-model is provided by [radiant earth ramp baseline model](https://github.com/radiantearth/model_ramp_baseline)

The CNN is an EfficientNet-UNet encoder-decoder semantic segmentation model. The baseline model have already been pretrained on 1,200,0000 labelled buildings across 22 individuals AOI.
The RAMP model was trained with a particular focus on informal settlements and partially constructed buildings, making it an appropriate base-model for HOT application.

The platform that fAIr provides is a further fine-tuning of the base-line model which enhance the model efficiacy to the desired area.

> The backend codebase and the containersed docker enviornment is currently optimised for deployment on an Debian AWS instance with 4GB. Nvidia GPU and 16 GB. RAM.

> It is recommended to use the provided docker images and cloud instance to deploy the RAMP model. As the Docker images with model, model weights, and peripherial requirements will take up at least 10 Gb. of storage space.

### Structure

The backend codebase is organised into the following main directories and files:

- [docker](../docker/): This directory contains the Docker configurations for the project.
    - ramp: This directory contains the RAMP (Rapid Analytics and Model Prototyping) configurations.
    - solaris: This directory contains the Solaris configurations, a Python library for piping and translation between geospatial and ML formats
    
- [requirements.txt](../requirements.txt): This file lists the Python dependencies required by the project.

### Deploying

The user can pull and deploy fAIr backend by running:

```bash
docker build .
```

Before running the docker container, we need to obtain the pre-trained RAMP model.
We will also need to mount it:

```bash
git clone https://github.com/kshitijrajsharma/ramp-code-fAIr.git ramp-code &&\
pip install gdown &&\
gdown --fuzzy 'https://drive.google.com/u/0/uc?id=1wvJhkiOrSlHmmvJ0avkAdu9sslFf5_I0&export=download' &&\
unzip checkpoint.tf.zip -d ./ramp-code/ramp && rm -rf checkpoint.tf.zip
```

Run the built container using

```bash
docker run .
```

Once insider the docker container, there are several more additional steps to communicate\
with the database

### Make sure you have postgresql installed with postgis extension enabled

Configure .env:

Create .env in the root backend project , and add the credentials as provided on .env_sample , Export your secret key and database url to your env

```bash
# Export your database url 
export DATABASE_URL=postgis://postgres:postgres@localhost:5432/ai
```

You will need more env variables (Such as Ramp home, Training Home) that can be found on ```.sample_env```  

Now change your username, password and db name in settings.py accordingly to your database

> The application is boostrapped by calling `manage.py` to bootstrap the geodjango application.

``` bash
python manage.py makemigrations login
python manage.py migrate login
python manage.py makemigrations core
python manage.py migrate core 
python manage.py makemigrations 
python manage.py migrate
python manage.py runserver
```

### Now server will be available in your 8000 port on web, you can check out your localhost:8000/admin for admin panel

To login on admin panel, create your superuser and login with your credentials restarting the server

```bash
python manage.py createsuperuser
```

### Authentication

fAIr uses oauth2.0 Authentication using ![osm-login-python](https://github.com/kshitijrajsharma/osm-login-python)

1. Get your login Url Hit /api/v1/auth/login/ 
- URL will give you login URL which you can use to provide your osm credentials and authorize fAIr
- After successful login you will get access-token that you can use across all osm login required endpoints in fAIr
2. Check authentication by getting back your data Hit /api/v1/auth/me/
- URL requires access-token as header and in return you will see your osm username, id and image url

### Start celery workers

```bash
celery -A aiproject worker --loglevel=debug -n my_worker
```

Monitor using flower if you are using redis as result backend, api supports both options django / redis You can start flower to start monitoring your tasks

```bash
celery -A aiproject  --broker=redis://127.0.0.1:6379/0 flower 
```

### Run Tests

```bash
python manage.py test
```


### Services

The backend is composedof the following services:

- **PostgreSQL Database (with PostGIS)**: This service uses the `postgis/postgis` Docker image
to provide a spatial enabled RDBMS. This is where the geospatial data for this project is stored

- **Redis**: This is an key-value in memory database for the queueing system for User/Instance/Worker celery.
This stores the user list and specifications of task requests for RAMP.

- **App**: This is hte main application service. Built from the Dockerfile, the django and geodjango
bootstraps the various API communication services.

- **Worker**: This is the Celery service that manages the AWS resources. The queueing process can be monitored using **Flower**
nke

#### Flowchart

![architecture_flowchart](./fAIr_backend.png)

#### Ports

The services are exposed on the following ports:
- PostgreSQL: 5434
- Redis: 6379
- App: 8000
- Worker Dashboard(Flower): 5500
