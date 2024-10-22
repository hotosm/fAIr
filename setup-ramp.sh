#!/bin/bash

## To run this activate your venv and hit bash setup-ramp.sh 


if [ ! -d "ramp_base" ]; then

    mkdir -p ramp_base


    pip install gdown


    gdown --fuzzy https://drive.google.com/uc?id=1YQsY61S_rGfJ_f6kLQq4ouYE2l3iRe1k

    git clone https://github.com/kshitijrajsharma/ramp-code-fAIr.git "$(pwd)/ramp_base/ramp-code"


    unzip checkpoint.tf.zip -d "$(pwd)/ramp_base/ramp-code/ramp"

    echo "Setup complete. Please run 'source .env' to apply the environment variables."
fi 

RAMP_HOME="$(pwd)/ramp_base"
TRAINING_WORKSPACE="$(pwd)/trainings"

echo "export RAMP_HOME=$RAMP_HOME" > .env
echo "export TRAINING_WORKSPACE=$TRAINING_WORKSPACE" >> .env
