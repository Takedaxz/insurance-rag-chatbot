# Multi-stage Dockerfile for UOB RM AI Assistant
# ===============================================

# Stage 1: Base image with Python and system dependencies
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    git \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Dependencies
FROM base as deps

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements files
COPY requirements/ /tmp/requirements/
COPY requirements.txt /tmp/

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r /tmp/requirements.txt

# Stage 3: Production image
FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from deps stage
COPY --from=deps /opt/venv /opt/venv

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Create app directory
WORKDIR /app

# Copy application code
COPY . /app/

# Create necessary directories
RUN mkdir -p /app/data/documents /app/data/indexes /app/logs && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5500

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5500/ || exit 1

# Default command
CMD ["python", "start_web.py"]

# Stage 4: Development image (optional)
FROM production as development

USER root

# Install development dependencies
RUN pip install pytest pytest-asyncio pytest-cov black flake8 mypy

# Install additional development tools
RUN apt-get update && apt-get install -y \
    vim \
    htop \
    && rm -rf /var/lib/apt/lists/*

USER appuser

# Override command for development
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5500", "--debug"]
