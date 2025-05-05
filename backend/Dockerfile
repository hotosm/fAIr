FROM tensorflow/tensorflow:2.9.2-gpu AS base
RUN apt-get update && \
    apt-get install -y \
      build-essential \
      python3-opencv \
      gdal-bin \
      libgdal-dev \
    && add-apt-repository ppa:ubuntugis/ppa && \
    apt-get update && \
    rm -rf /var/lib/apt/lists/*
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal



FROM base AS gdal-deps
RUN pip install numpy==1.23.5
RUN pip install --global-option=build_ext --global-option="-I/usr/include/gdal" GDAL==$(gdal-config --version)

FROM base AS docker-deps
COPY docker/ramp/docker-requirements.txt /tmp/docker-requirements.txt
RUN pip install -r /tmp/docker-requirements.txt

FROM base AS worker-deps
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

FROM base AS api-deps
COPY api-requirements.txt api-requirements.txt
RUN pip install -r api-requirements.txt

FROM base AS solaris-deps
COPY docker/ramp/solaris /tmp/solaris
RUN pip install /tmp/solaris --use-feature=in-tree-build && \
    pip install scikit-fmm --use-feature=in-tree-build



FROM base AS run
COPY --from=gdal-deps /usr/local/lib/python3.8/dist-packages /usr/local/lib/python3.8/dist-packages
COPY --from=docker-deps /usr/local/lib/python3.8/dist-packages /usr/local/lib/python3.8/dist-packages
COPY --from=worker-deps /usr/local/lib/python3.8/dist-packages /usr/local/lib/python3.8/dist-packages
COPY --from=api-deps /usr/local/lib/python3.8/dist-packages /usr/local/lib/python3.8/dist-packages
COPY --from=solaris-deps /usr/local/lib/python3.8/dist-packages /usr/local/lib/python3.8/dist-packages
COPY . /app



FROM scratch
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal
# Squash the final image
COPY --from=run / /
WORKDIR /app
