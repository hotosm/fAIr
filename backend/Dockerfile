FROM tensorflow/tensorflow:2.9.2-gpu AS base
RUN apt-get update && \
    apt-get install -y python3-opencv gdal-bin libgdal-dev && \
    add-apt-repository ppa:ubuntugis/ppa && \
    apt-get update && \
    rm -rf /var/lib/apt/lists/*
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal



FROM base AS build
RUN pip install numpy==1.23.5
RUN pip install --global-option=build_ext --global-option="-I/usr/include/gdal" GDAL==$(gdal-config --version)
COPY docker/ramp/docker-requirements.txt /tmp/docker-requirements.txt
RUN pip install -r /tmp/docker-requirements.txt
COPY requirements.txt requirements.txt
COPY api-requirements.txt api-requirements.txt
# Don't use legacy resolver , TODO : fix this dependencies 
# RUN pip install --use-deprecated=legacy-resolver -r api-requirements.txt 
RUN pip install setuptools==68.2.2 wheel==0.41.3 build==1.0.0
RUN pip install -r requirements.txt
COPY docker/ramp/solaris /tmp/solaris
RUN pip install /tmp/solaris --use-feature=in-tree-build && \
    pip install scikit-fmm --use-feature=in-tree-build



FROM base AS run
COPY --from=build /usr/local/lib/python3.*/dist-packages /usr/local/lib/python3.*/dist-packages
COPY . /app



FROM scratch
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal
COPY --from=run / /
WORKDIR /app
