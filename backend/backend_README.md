## Welcome to the backend source code for fAIr

The backend of fAIr is powered by:

- tensorflow:2.9.2
- django 3.1.2 & geodjango
- gdal
- solaris

The pretrained Convolutional Neural Network is base-model is provided by [radiant earth ramp baseline model](https://github.com/radiantearth/model_ramp_baseline)

The CNN is an EfficientNet-UNet encoder-decoder semantic segmentation model. The baseline model have already been pretrained on 1,200,0000 labelled buildings across 22 individuals AOIj.
The RAMP model was trained with a particular focus on informal settlements and partially constructed buildings, making it an appropriate base-model for HOT application.

The platform that fAIr provides is a further fine-tuning of the base-line model which enhance the model efficiacy to the desired area.

> The backend codebase and the containersed docker enviornment is currently optimised for deployment on an Debian AWS instance with Nvidia GPU 16 Gb.

> It is recommended to use the provided docker images and cloud instance to deploy the RAMP model. As the Docker images with model, model weights, and peripherial requirements will take up at least 10 Gb. of storage space.

### Structure

The backend codebase is organised into the following main directories and files:

- docker: This directory contains the Docker configurations for the project.
    - ramp: This directory contains the RAMP (Rapid Analytics and Model Prototyping) configurations.
    - solaris: This directory contains the Solaris configurations, a Python library for piping and translation between geospatial and ML formats
    
- requirements.txt: This file lists the Python dependencies required by the project.

### Deploying

The user can pull and deploy fAIr backend by running:

'''
docker build .
'''
