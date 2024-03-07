Docker Compose is created with redis , worker , postgis database ,  api and frontend all in one making it easy for development . For production it is not recommended

## [DEV] Installation With Docker 

1. Clone Repo 

    ```
    git clone https://github.com/hotosm/fAIr.git
    ```

2. Get Docker Compose Installed 

    If docker is not installed , Install it from [here](https://docs.docker.com/engine/install/) 
    ```
    docker compose version
    ```

3. Check your Graphics 

    fAIr works best with graphics card. It is highly recommended to use graphics card . It might not work with CPU only (You can setup and test from bottom of this document). Nvidia Graphics cards are tested 

    You need to make sure you can see your graphics card details and can be accessed through docker by installing necessary drivers

    By following command you can see your graphics and graphics driver details & nvidia container toolkit is installed More details [here](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
    ```
    nvidia-smi
    ```

4. Clonse Base Model and Create RAMP_HOME

    - Create a new folder called RAMP , outside fAIr

        ```
        mkdir ramp
        ```
    - Download BaseModel Checkpoint from [here](https://drive.google.com/file/d/1YQsY61S_rGfJ_f6kLQq4ouYE2l3iRe1k/view) 
        OR You can use basemodel from [Model Ramp Baseline](https://github.com/radiantearth/model_ramp_baseline/tree/main/data/input/checkpoint.tf)
        ```
        pip install gdown
        gdown --fuzzy https://drive.google.com/file/d/1YQsY61S_rGfJ_f6kLQq4ouYE2l3iRe1k/view
        ```
    - Clone Ramp Code 

        ```
        git clone https://github.com/kshitijrajsharma/ramp-code-fAIr.git ramp-code
        ```
    - Unzip downloaded basemodel and move inside ramp-code/ramp

        ```
        unzip checkpoint.tf.zip -d ramp-code/ramp  
        ```
    - Export Env variable for RAMP_HOME 
        Grab the file path of folder we created earlier ```ramp``` and export it as env variable
        ```
        export RAMP_HOME=/home/YOUR_RAMP_LOCATION
        ```
        eg : export RAMP_HOME=/home/kshitij/ramp

    - Export ```TRAINING_WORKSPACE``` Env
        Training workspace is the folder where fAIr will store its training files 
        for eg :
        ```
        export TRAINING_WORKSPACE=/home/kshitij/hotosm/fAIr/trainings
        ```

5. Register your Local setup to OSM 

    - Go to [OpenStreetMap](https://www.openstreetmap.org/) , Login/Create Account
    - Click on your Profile and Hit ```My Settings```
    - Navigate to ```Oauth2 Applications```
    - Register new application 
    - Check permissions for ```Read user preferences``` and Redirect URI to be ```http://127.0.0.1:3000/authenticate/``` , Give it name as ```fAIr Dev Local```
    - You will get ```OSM_CLIENT_ID``` , ```OSM_CLIENT_SECRET``` Copy them 

6. Create Env variables 
    - Create a file ```.env``` in backend with [docker_sample_env](../backend/docker_sample_env) content 
        ```
        cd backend
        cp docker_sample_env .env
        ```
    - Fill out the details of ```OSM_CLIENT_ID``` &```OSM_CLIENT_SECRET``` in .env file and generate a unique key & paste it to ```OSM_SECRET_KEY``` (It can be random for dev setup)
    
        Leave rest of the items as it is unless you know what you are doing

    - Create ```.env``` in /frontend
        ```
        cd frontend
        cp .env_sample .env
        ```
        You can leave it as it is for dev setup
    
7. Build & Run containers 

    ```
    docker compose build
    ```

    ```
    docker compose up
    ```

8. Run Migrations 

    Run directly bash script : 

    ```
    bash run_migrations.sh
    ```

    OR 

    Grab API container & Open Bash

        docker exec -it api bash


    Once Bash is promoted hit following commands 

        python manage.py makemigrations
        python manage.py makemigrations login
        python manage.py makemigrations core
        python manage.py migrate

9. Play and Develop 

    Restart containers 

    ```
    docker compose restart
    ```

    Frontend will be available on 5000 port , Backend will be on 8000 , Flower will be on 5500 

    Please open the frontend using URL `127.0.0.1:3000` instead of `localhost:3000` to ensure login functionality.

10. Want to run your local tiles ? 

    You can use [titler](https://github.com/developmentseed/titiler) , [gdals2tiles](https://gdal.org/programs/gdal2tiles.html) or nginx to run your own TMS server and add following to docker compose in order to access your localhost through docker containers . Add those to API and Worker . Make sure you update the .env variable accordingly 

    ```
    network_mode: "host"
    ```
    Example docker compose : 

    ```
    backend-api:
        build:
        context: ./backend
        dockerfile: Dockerfile_CPU
        container_name: api
        command: python manage.py runserver 0.0.0.0:8000

        ports:
        - 8000:8000
        volumes:
        - ./backend:/app
        - ${RAMP_HOME}:/RAMP_HOME
        - ${TRAINING_WORKSPACE}:/TRAINING_WORKSPACE
        depends_on:
        - redis
        - postgres
        network_mode: "host"

    backend-worker:
        build:
        context: ./backend
        dockerfile: Dockerfile_CPU
        container_name: worker
        command: celery -A aiproject worker --loglevel=INFO --concurrency=1

        volumes:
        - ./backend:/app
        - ${RAMP_HOME}:/RAMP_HOME
        - ${TRAINING_WORKSPACE}:/TRAINING_WORKSPACE
        depends_on:
        - backend-api
        - redis
        - postgres
        network_mode: "host"
    ```

    Example .env after host change : 

    ```
    DATABASE_URL=postgis://postgres:admin@localhost:5434/ai
    CELERY_BROKER_URL="redis://localhost:6379/0"
    CELERY_RESULT_BACKEND="redis://localhost:6379/0"
    ```