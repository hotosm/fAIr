![example workflow](https://github.com/omranlm/TDB/actions/workflows/backend_build.yml/badge.svg)

## Backend is created with [Django](https://www.djangoproject.com/)
This project was bootstrapped with  [Geodjango Template](https://github.com/itskshitiz321/geodjangotemplate.git)
#### For Quickly Getting Started
**Note:** Depending upon your OS and Env installation will vary, This project tightly depends on [Tensorflow](https://www.tensorflow.org/install/pip) with GPU support so accordingly build your development environment 
### Install Python3, pip and virtualenv first
##### Skip this, step if you already have one
    sudo apt-get install python3
    sudo apt-get install -y python3-pip
    sudo apt install python3-virtualenv
##### Create your virtual env
    virtualenv env
    source ./env/bin/activate

##### Setup Basemodels (Ramp Supported Currently)
- Clone Ramp Basemodel 
```
git clone https://github.com/radiantearth/model_ramp_baseline.git
```
OR Download from google drive 
```
pip install gdown
gdown --fuzzy https://drive.google.com/file/d/1wvJhkiOrSlHmmvJ0avkAdu9sslFf5_I0/view?usp=sharing
```

- Clone Ramp - Code 
Note: This clone location will be your RAMP_HOME 
```
git clone https://github.com/kshitijrajsharma/ramp-code-fAIr.git ramp-code
```
- Copy Basemodel checkpoint to ramp-code
```
cp -r model_ramp_baseline/data/input/checkpoint.tf ramp-code/ramp/checkpoint.tf
```

Our Basemodel is available for public download [here](https://drive.google.com/file/d/1wvJhkiOrSlHmmvJ0avkAdu9sslFf5_I0/view?usp=sharing)

You can unzip and  move the downloaded basemodel 
```
unzip checkpoint.tf.zip -d ramp-code/ramp  
```


- Remove basemodel repo we don't need it anymore 
```
rm -rf model_ramp_baseline
```
- Install numpy 
Numpy needs to be installed before gdal 
```
pip install numpy==1.23.5
```

- Install gdal and rasetrio 
Based on your env : You can either use conda / setup manually on your os 
for eg on ubuntu : 
```
sudo add-apt-repository ppa:ubuntugis/ppa && sudo apt-get update
sudo apt-get install gdal-bin
sudo apt-get install libgdal-dev
export CPLUS_INCLUDE_PATH=/usr/include/gdal
export C_INCLUDE_PATH=/usr/include/gdal
pip install --global-option=build_ext --global-option="-I/usr/include/gdal" GDAL==`gdal-config --version`
```

- Install Ramp - Dependecies 
```
cd ramp-code && cd colab && make install
```

- For Conda users : You may need to install rtree, gdal , rasterio & imagecodecs separately 

```
conda install -c conda-forge rtree
conda install -c conda-forge gdal
conda install -c conda-forge rasterio
conda install -c conda-forge imagecodecs
```

##### Install necessary libraries for fAIr

- Install Tensorflow  from [here] (https://www.tensorflow.org/install/pip) According to your os (Tested Versions : 2.9.2, 2.8.0)

- Upgrade your setuptools before installing fair-utilities

```
pip install --upgrade setuptools
```

- Install fAIr Utilities 
```
pip install hot-fair-utilities==1.0.41
```

**Remember In order to run fAIr , You need to configure your PC with tensorflow - GPU Support** 

You can check your GPU by : 

```
import tensorflow as tf
print("Num GPUs Available: ", len(tf.config.experimental.list_physical_devices('GPU')))
```


- Install psycopg2
Again based on your os/env you can do manual installation 
for eg : on ubuntu : 
```
sudo apt-get install python3-psycopg2
```

- Install redis server on your pc 

```
sudo apt install redis
```

- Finally installl pip dependencies 

```
pip install -r requirements.txt
```

### Make sure you have postgresql installed with postgis extension enabled


#### Configure .env: 
    Create .env in the root backend project , and add the credentials as provided on .env_sample , Export your secret key and database url to your env

    Export your database url 
    ```
    export DATABASE_URL=postgis://postgres:postgres@localhost:5432/ai
    ```
    
    You will need more env variables (Such as Ramp home, Training Home) that can be found on ```.sample_env```  

#### Now change your username, password and db name in settings.py accordingly to your database
    python manage.py makemigrations login
    python manage.py migrate login
    python manage.py makemigrations core
    python manage.py migrate core 
    python manage.py makemigrations 
    python manage.py migrate
    python manage.py runserver
### Now server will be available in your 8000 port on web, you can check out your localhost:8000/admin for admin panel 
To login on admin panel, create your superuser and login with your credentials restarting the server

    python manage.py createsuperuser

## Authentication 
fAIr uses oauth2.0 Authentication using [osm-login-python](https://github.com/kshitijrajsharma/osm-login-python)
1. Get your login Url
    Hit ```/api/v1/auth/login/ ```
    - URL will give you login URL which you can use to provide your osm credentials and authorize fAIr 
    - After successful login  you will get access-token that you can use across all osm login required endpoints in fAIr
2. Check authentication by getting back your data 
    Hit ```/api/v1/auth/me/```
    - URL requires access-token as header and in return you will see your osm username, id and image url 


## Start celery workers 

-  Start celery workers 

```
celery -A aiproject worker --loglevel=debug -n my_worker
```

- Monitor using flower 
if  you are using redis as result backend, api supports both options django / redis 
You can start flower to start monitoring your tasks
```
celery -A aiproject  --broker=redis://127.0.0.1:6379/0 flower 
```

## Run Tests 

```
python manage.py test
```


# Build fAIr with Docker for Development 
- Install all the required drivers for your graphics to access it from containers, and check your graphics and drivers with ```nvidia-smi``` . Up to now only nvidia is Supported 
- Follow docker_sample_env to create ```.env``` file in your dir 
- Build the Image

```
docker-compose up -d --build
```
- Once the image is build, Open the API container terminal and run the migrations
