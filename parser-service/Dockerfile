FROM python:3.10-slim

WORKDIR /app

# Install gcc, g++, and git for tree-sitter C extensions and GitPython
RUN apt-get update && apt-get install -y gcc g++ git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Install semgrep in an isolated virtual environment to prevent dependency conflicts with FastAPI
RUN python -m venv /opt/semgrep-venv
RUN /opt/semgrep-venv/bin/pip install --no-cache-dir semgrep
RUN ln -s /opt/semgrep-venv/bin/semgrep /usr/local/bin/semgrep
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
