#!/bin/bash

docker exec -it api bash -c "python manage.py makemigrations"
docker exec -it api bash -c "python manage.py makemigrations login"
docker exec -it api bash -c "python manage.py makemigrations core"
docker exec -it api bash -c "python manage.py migrate"
