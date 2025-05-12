# Stage 1: Builder
FROM ghcr.io/kshitijrajsharma/ramp-code-fair/tensorflow-gpu:latest AS builder

RUN pip install --no-cache-dir uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_MANAGED_PYTHON=1

WORKDIR /app

COPY pyproject.toml uv.lock /app/

# Resolve deps and install globally
RUN uv pip compile pyproject.toml -o requirements.txt \
    && pip install -r requirements.txt

COPY aiproject core login /app/


EXPOSE 8080

CMD ["bash"]