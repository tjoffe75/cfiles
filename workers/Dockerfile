# Dockerfile for Python Workers
FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better layer caching
COPY workers/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install clamd

# Copy the shared database models
COPY backend/database ./database
COPY backend/enums.py .

# Copy the worker script
COPY workers/worker.py .

CMD ["python", "-u", "worker.py"]
