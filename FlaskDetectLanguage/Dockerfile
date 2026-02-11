FROM python:3.9-slim AS base
WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
COPY requirements.txt . 
RUN pip install --no-cache-dir -r requirements.txt

# Final image
FROM base AS final
COPY app.py . 
RUN chmod 755 app.py

# Expose port 5000
EXPOSE 5000

CMD ["python", "app.py"]
