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
    Create .env inside backend/aiproject , and add the credentials as provided on .env_sample
#### Now change your username , password and db name in settings.py accordingly to your database
    python manage.py makemigrations
    python manage.py migrate
    python manage.py runserver
### Now server will be available in your 8000 port in web , you can check out your localhost:8000/admin for admin panel 
To login on admin panel , create your superuser and login with your credentials restarting the server

    python manage.py createsuperuser


