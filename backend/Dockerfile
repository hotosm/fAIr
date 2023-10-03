FROM tensorflow/tensorflow:2.9.2-gpu

# ENV PIP_NO_CACHE_DIR=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

COPY requirements.txt requirements.txt
COPY docker/ramp/docker-requirements.txt docker-requirements.txt

RUN apt-get update &&\
    apt-get install -y --no-install-recommends \
        gdal-bin \
        libgdal-dev \
        python3-opencv && \
    pip install --upgrade --user pip \
    && pip install --global-option=build_ext --global-option="-I/usr/include/gdal" GDAL==`gdal-config --version` \
    && pip install --user  -r docker-requirements.txt \
    && pip install --user  fair-solaris==0.4.1 \
    && pip install --user  ramp-fair \
    && pip install --user  setuptools --upgrade \
    && pip install --user  -r requirements.txt && \
    apt-get clean -y && \
    apt-get autoremove -y && \c
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . /app