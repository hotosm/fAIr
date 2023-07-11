 Welcome to the backend source code for fAIr

The backend powersof fAIr is powered by:

- tensorflow:2.9.2
- gdal
- solaris

The pretrained Convolutional Neural Network is base model is provided by [radiant earth ramp baseline model](https://github.com/radiantearth/model_ramp_baseline)

The CNN is an EfficientNet-UNet encoder-decoder model. The baseline model have laready been pretrained on 1,200,0000 labelled buildings across 22 individuals AOI.
The RAMP model was trained with a particular focus on informal settlements and partially constructed buildings, making it an appropriate base model for HOT application.

The platform that fAIr provides is a further fine-tuning of the baseline model which enhance the model efficiacy to the desired area.

### Structure

The backend codebase is organised into the following main directories and files:

- docker/: This directory contains the Docker configurations for the project.
    - ramp/: This directory contains the RAMP (Rapid Analytics and Model Prototyping) configurations.
    - solaris/: This directory contains the Solaris configurations, a Python library for analyzing overhead imagery.
    
- requirements.txt: This file lists the Python dependencies required by the project.
