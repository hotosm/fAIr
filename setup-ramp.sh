#!/bin/bash

## To run this activate your venv and hit bash setup-ramp.sh 

# Step 1: Create a new folder called 'ramp' outside fAIr
mkdir -p ramp

# Step 2: Install gdown for downloading files from Google Drive
pip install gdown

# Step 3: Download BaseModel Checkpoint from Google Drive
gdown --fuzzy https://drive.google.com/uc?id=1YQsY61S_rGfJ_f6kLQq4ouYE2l3iRe1k

# Step 4: Clone the Ramp code repository
git clone https://github.com/kshitijrajsharma/ramp-code-fAIr.git ramp-code

# Step 5: Unzip the downloaded BaseModel checkpoint into the 'ramp' directory inside the cloned repository
unzip checkpoint.tf.zip -d ramp-code/ramp

# Step 6: Define the current location for environment variables
RAMP_HOME="$(pwd)/ramp"
TRAINING_WORKSPACE="$(pwd)/trainings"

# Step 7: Create a '.env' file with the exported variables
echo "export RAMP_HOME=$RAMP_HOME" > .env
echo "export TRAINING_WORKSPACE=$TRAINING_WORKSPACE" >> .env

# Print success message
echo "Setup complete. Please run 'source .env' to apply the environment variables."

