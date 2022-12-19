![example workflow](https://github.com/omranlm/TDB/actions/workflows/backend_build.yml/badge.svg)

## Backend is created with [Django](https://www.djangoproject.com/)
This project was bootstrapped with  [Geodjango Template](https://github.com/itskshitiz321/geodjangotemplate.git)
#### For Quickly Getting Started
### Install Python3, pip and virtualenv first
##### Skip this, step if you already have one

    sudo apt-get install python3
    sudo apt-get install -y python3-pip
    sudo apt install python3-virtualenv
##### Create your virtual env
    virtualenv env
    source ./env/bin/activate
##### Install necessary libraries
    chmod +x library.sh
    ./library.sh
    ogrinfo --version
##### Change the GDAL verision in requirements.txt if your installed version is different from default one (gdal version can be checked from previous command ogrinfo--version
    pip install -r requirements.txt

### Make sure you have postgresql installed with postgis extension enabled


#### Default database settings: 
    Create .env in root backend project , and add the credentials as provided on .env_sample , Export your secret key and database url to your env

    Export your database url 

    export DATABASE_URL=postgis://postgres:postgres@localhost:5432/ai
#### Now change your username , password and db name in settings.py accordingly to your database
    python manage.py makemigrations
    python manage.py migrate
    python manage.py runserver
### Now server will be available in your 8000 port in web , you can check out your localhost:8000/admin for admin panel 
To login on admin panel , create your superuser and login with your credentials restarting the server

    python manage.py createsuperuser

## Authentication 
fAIr uses oauth2.0 Authentication using [osm-login-python](https://github.com/kshitijrajsharma/osm-login-python)
1. Get your login Url
    Hit ```/api/v1/auth/login/ ```
    - URL will give you login URL which you can use to provide your osm credentials and authorize fAIr 
    - After successfull login  you will get access-token that you can use accross all osm login required endpoints in fAIr
2. Check authentiation by getting back your data 
    Hit ```/api/v1/auth/me/```
    - URL requires access-token as header and in return you will see your osm username , id and image url 


## Start celery workers 
1. Install redis server in your pc 

```
sudo apt install redis
```

2. Start celery workers 

```
celery -A aiproject worker --loglevel=info -n my_worker
```

3. Monitor using flower 
if  you are using redis as result backend , api supports both options django / redis 
You can start flower to start monitoring your tasks
```
celery -A aiproject  --broker=redis://127.0.0.1:6379/0 flower 
```

