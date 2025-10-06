FROM python:3.10-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && rm -rf /var/lib/apt/lists/*

# Copy and install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your entire app
COPY . .

# Expose port (Spaces provides PORT env var)
ENV PORT=7860
EXPOSE 7860

# Start the Flask app with gunicorn (binds to provided PORT)
CMD gunicorn -w 2 -k gthread --threads 8 -b 0.0.0.0:${PORT} web_app:app