FROM node:24-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pip \
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g @anthropic-ai/claude-code
RUN pip3 install --no-cache-dir --break-system-packages fastapi "uvicorn[standard]"
WORKDIR /app
COPY server.py .
EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
