# Dockerfile for Python Workers
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install clamd

COPY . .

CMD ["python", "-u", "worker.py"]
