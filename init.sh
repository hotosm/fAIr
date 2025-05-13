#!/bin/bash
set -e

# ----------------------------------------
# Step 1: Set defaults
# ----------------------------------------

# Use provided or fallback to sensible defaults
RAMP_HOME=${RAMP_HOME:-$(pwd)/../ramp}
TRAINING_WORKSPACE=${TRAINING_WORKSPACE:-$(pwd)/trainings}
RAMP_CODE_DIR="${RAMP_HOME}/ramp-code"
CHECKPOINT_DIR="${RAMP_CODE_DIR}/ramp"

# ----------------------------------------
# Step 2: Create folders
# ----------------------------------------

mkdir -p "${TRAINING_WORKSPACE}"
mkdir -p "${CHECKPOINT_DIR}"

echo "[+] RAMP_HOME is set to: ${RAMP_HOME}"
echo "[+] TRAINING_WORKSPACE is set to: ${TRAINING_WORKSPACE}"

# ----------------------------------------
# Step 3: Download base model
# ----------------------------------------

BASEMODEL_ZIP="baseline.zip"
BASEMODEL_URL="https://api-prod.fair.hotosm.org/api/v1/workspace/download/ramp/baseline.zip"

if [ ! -f "${CHECKPOINT_DIR}/checkpoint.tf.index" ]; then
    echo "[+] Downloading base model from: ${BASEMODEL_URL}"
    curl -L -o "${BASEMODEL_ZIP}" "${BASEMODEL_URL}"
    echo "[+] Unzipping base model into ${CHECKPOINT_DIR}"
    unzip -o "${BASEMODEL_ZIP}" -d "${CHECKPOINT_DIR}"
    rm "${BASEMODEL_ZIP}"
else
    echo "[✓] Base model already present."
fi

# ----------------------------------------
# Step 4: Clone ramp-code if needed
# ----------------------------------------

if [ ! -d "${RAMP_CODE_DIR}" ]; then
    echo "[+] Cloning ramp-code-fAIr..."
    git clone https://github.com/kshitijrajsharma/ramp-code-fAIr.git "${RAMP_CODE_DIR}"
else
    echo "[✓] ramp-code-fAIr already cloned."
fi

# ----------------------------------------
# Step 5: Write .env file for Docker Compose
# ----------------------------------------

cat <<EOF > .env
RAMP_HOME=${RAMP_HOME}
TRAINING_WORKSPACE=${TRAINING_WORKSPACE}
EOF

echo "[✓] .env file created for Docker Compose"

# ----------------------------------------
# Done
# ----------------------------------------

echo ""
echo "Init complete. You can now run:"
echo ""
echo "    docker compose up --build"
echo ""
