Docker Compose is created with redis , worker , postgis database ,  api and frontend all in one making it easy for development . For production it is not recommended

## [DEV] Installation With Docker 

1. Clone Repo 

    ```bash
    git clone https://github.com/hotosm/fAIr.git
    ```

2. Get Docker Compose Installed 

    If docker is not installed , Install it from [here](https://docs.docker.com/engine/install/) 
    ```bash
    docker compose version
    ```

3. Check your Graphics (Optional)

    fAIr works best with graphics card , Ideally you can also set it up only with CPU though for the development , but if you want models to be trained locally GPU is recommended. Nvidia Graphics cards are tested 

    You need to make sure you can see your graphics card details and can be accessed through docker by installing necessary drivers

    By following command you can see your graphics and graphics driver details & nvidia container toolkit is installed More details [here](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
    ```bash
    nvidia-smi
    ```

4. Setup
   ```bash
   bash ./manage-dev.sh setup
   ```
   It will create .env.dev in your dir , Now replace your credentials for the Login 

5. Register your Local setup to OSM 

    - Go to [OpenStreetMap](https://www.openstreetmap.org/) , Login/Create Account
    - Click on your Profile and Hit ```My Settings```
    - Navigate to ```Oauth2 Applications```
    - Register new application 
    - Check permissions for ```Read user preferences``` and Redirect URI to be ```http://127.0.0.1:3000/authenticate/``` , Give it name as ```fAIr Dev Local```
    - You will get ```OSM_CLIENT_ID``` , ```OSM_CLIENT_SECRET``` Copy them & Replace it back to the .env.dev

6. Build & Run containers 

    ```bash
    bash ./manage-dev.sh start
    ```

    Frontend will be available on 5000 port , Backend will be on 8000 , Flower will be on 5500 

    Please open the frontend using URL `127.0.0.1:3000` instead of `localhost:3000` to ensure login functionality.

7. Want to run your local tiles ? 

    You can use [titler](https://github.com/developmentseed/titiler) , [gdals2tiles](https://gdal.org/programs/gdal2tiles.html) or nginx to run your own TMS server and add following to docker compose in order to access your localhost through docker containers . Add those to API and Worker . Make sure you update the .env variable accordingly 
