ARG PYTHON_VERSION=3.12
ARG UV_VERSION=0.5

FROM ghcr.io/astral-sh/uv:${UV_VERSION}-python${PYTHON_VERSION}-bookworm-slim AS builder

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    libproj-dev \
    gdal-bin \
    proj-bin \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-default-groups

COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-default-groups


FROM python:${PYTHON_VERSION}-slim-bookworm AS runtime

# Build-time deps for tippecanoe  : geojson2pmtilesfgb
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal32 \
    libproj25 \
    proj-bin \
    libpq5 \
    ca-certificates \
    git \
    build-essential \
    zlib1g-dev \
    libsqlite3-dev \
    && git clone --depth=1 https://github.com/felt/tippecanoe /tmp/tippecanoe \
    && cd /tmp/tippecanoe \
    && make -j"$(nproc)" \
    && make install \
    && cd / \
    && rm -rf /tmp/tippecanoe \
    && apt-get purge -y --auto-remove build-essential zlib1g-dev libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app /app

# ZenML's CodeArchive uses `git ls-files --others --exclude-standard` to decide
# what to upload as the pipeline source bundle. Without a repo + .gitignore it
# falls back to walking everything under WORKDIR 
RUN printf '.venv/\nartifacts/\n.zen/\n*.pyc\n__pycache__/\n*.log\n' > /app/.gitignore \
    && git -C /app init -q -b main

ENV PATH="/app/.venv/bin:${PATH}" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--access-logfile", "-"]
