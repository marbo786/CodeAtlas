FROM python:3.10-slim

WORKDIR /app

# Install gcc, g++, and git for tree-sitter C extensions and GitPython
RUN apt-get update && apt-get install -y gcc g++ git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
