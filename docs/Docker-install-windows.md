Docker Compose is used to create a full installation of fAIr (with redis, worker, postgis database, api and frontend), all in one Docker container. This setup is suitable for development. For production it is not recommended. ***TODO*** What is production? Is it the version that executes on the web site?

## Installation of fAIr using Docker

In the following, four directories are created: ```fair, ramp-code, ramp``` and ```training```, for the fAIr code, the model code, the model variables, and temporary data used during fine-tunining training of the (RAMP) model. It is a good idea to create these directories in the same, new, directory, created for this installation of fAIr and its companions.

1. Check your graphics card

    It is highly recommended to use a graphics card to run fAIr. It might not work with CPU only. (You can set up and test from bottom of this document). ***TODO*** What does this mean? NVIDIA graphics cards are tested. The bottom of this document is about a tile server, whatever that is. But it is not a GPU test?! ***TODO*** Does this mean that it works for NVIDIA cards but not for cards from other brands? 

    For the local fAIr installation to work the necessary drivers for the graphics card need to be installed.

    By the following command you can see your graphics card and the graphics driver details and the NVIDIA container toolkit that is installed. There is more information on the [NVIDIA site](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

    ```
    nvidia-smi
    ```

    You need to see your graphics card details here. ***TODO*** Does this mean that if this command shows details about my GPU, then it is OK for fAIr?

2. Install Docker Compose

    If Docker is not installed, install it from the [Docker site](https://docs.docker.com/engine/install/).

To check whether Docker is installed, type 

    ```
    docker compose version
    ```

3. Clone the repository for fAIr.

    In a Windows Command Prompt window, type 

    ```
    git clone https://github.com/hotosm/fAIr.git
    ```

    This creates directory ```./fAIr```.

4. Clone the Base Model and create environment variable RAMP_HOME

    - Clone the RAMP code. 

        ```
        git clone https://github.com/kshitijrajsharma/ramp-code-fAIr.git 
        ```

    This creates directory ```./ramp-code-fAIr```.

    - Create environment variable RAMP_HOME 

        Set RAMP_HOME to be the file path to the directory ```ramp-code-fAIr```. 

        ```
        set RAMP_HOME=C:\Users\kshitij\fAIr_install\ramp-code-fAIr
        ```

    - Download pre-trained variable values for the RAMP model from [here](https://drive.google.com/file/d/1YQsY61S_rGfJ_f6kLQq4ouYE2l3iRe1k/view). 

        If that doesn't work, you can alternatively use the variables in the original RAMP model, [RAMP Baseline](https://github.com/radiantearth/model_ramp_baseline/tree/main/data/input/checkpoint.tf)

    - Create a new folder called ```ramp-variables```.

        ```
        mkdir ramp-variables
        ```

    - Unzip the downloaded base model variables in subdirectory ```ramp-variables```.

        Move the compressed file to directory ```ramp-variables```. Right-click on it in File Explorer and choose "Extract All...". 

    - Create environment variable TRAINING_WORKSPACE

        Training workspace is the directory where fAIr will store its training files 
        for example. ***TODO*** Is this about a new checkpoint after fine-tuning? The name implies that this is for temporary files.

        ```
        mkdir trainings
        set TRAINING_WORKSPACE=C:\Users\kshitij\fAIr_install\trainings
        ```

5. Register your Local setup to OSM ***TODO*** Settings in OSM? "your Local setup" = my local fAIr installation?

    - Go to [OpenStreetMap](https://www.openstreetmap.org/), Log in (If needed: Create an account first.).
    - Click on your Profile and Hit ```My Settings```
    - Navigate to ```Oauth2 Applications```
    - Register a new application 
    - Check permissions for ```Read user preferences``` and set Redirect URI to be ```http://127.0.0.1:3000/authenticate/```. Give it the name  ```fAIr Dev Local```
    - You will get ```OSM_CLIENT_ID``` and ```OSM_CLIENT_SECRET```. Copy them. 

6. Create environment files
 
    - Create a file ```.env``` in directory backend with a copy of the content in [docker_sample_env](../backend/docker_sample_env).
 
        ```
        cd backend
        copy docker_sample_env .env
        ```

    - Fill in the details of ```OSM_CLIENT_ID``` and ```OSM_CLIENT_SECRET``` in the .env file and generate a unique key and paste it to ```OSM_SECRET_KEY``` (It can be any value in a setup for development).
    
        Leave the other items as they are, unless you have a specific, well-defined need.

    - Create ```.env``` in  directory frontend

        ```
        cd frontend
        copy .env_sample .env
        ```

        There is no need to modify this file in a setup for development.
    
7. Build and Run containers 

    In directory fAIr, run the following commands:

    ```
    docker compose build
    docker compose up
    ```

8. Run Migrations

    ***TODO*** What does "migration" mean in this context?

    Grab API container and Open Bash: In another command window, go to directory fAIr and execute: 

    ```
    docker exec -it api bash
    ```

    Once bash is promoted run the following commands, one at a time: ***TODO*** How do we know when bash is promoted? What does "promoted" mean in this context?

        python manage.py makemigrations
        python manage.py makemigrations login
        python manage.py makemigrations core
        python manage.py migrate

9. Play 

    Restart containers 

    ```
    docker compose restart
    ```

    Frontend will be available on port 5000, Backend on 8000, and Flower on 5500. 

    To use your local fAIr installation, go to [Local fAIr](http://127.0.0.1:3000) with your web browser.
    ***TODO*** There is a list of port numbers, but it doesn't include 3000, which seems to be the most important one. Is this a bug or a feature?

Extra. Do you want to run your local tiles? 

    You can use [TiTiler](https://github.com/developmentseed/titiler), [gdals2tiles](https://gdal.org/programs/gdal2tiles.html) or nginx to run your own TMS server and add the following to docker compose in order to access your localhost through docker containers. Add this to API and Worker. Also update the .env variable accordingly 

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

    Example .env after this host change : 

    ```
    DATABASE_URL=postgis://postgres:admin@localhost:5434/ai
    CELERY_BROKER_URL="redis://localhost:6379/0"
    CELERY_RESULT_BACKEND="redis://localhost:6379/0"
    ```