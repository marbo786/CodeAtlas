from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
import os
import logging
import time
import tempfile
import git
import shutil
from chunker import extract_chunks_and_imports
from collections import Counter
from pydantic import BaseModel, HttpUrl

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("parser-service")

API_KEY = os.getenv("PARSER_API_KEY", "dev_api_key_123")
ALLOWED_ROOT = os.getenv("PARSER_ALLOWED_REPO_ROOT", "/projects")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
MAX_FILES_PER_REPO = int(os.getenv("PARSER_MAX_FILES", "5000"))
MAX_FILE_SIZE = int(os.getenv("PARSER_MAX_FILE_SIZE", str(1 * 1024 * 1024))) # 1MB limit

IGNORED_DIRS = {'node_modules', 'dist', 'build', 'venv', 'env', '__pycache__', '.git', '.github'}

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

def get_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    return api_key

def get_secure_path(repo_path_input: str) -> str:
    if ".." in repo_path_input:
        raise HTTPException(status_code=400, detail="Path traversal attempt")
        
    # If the user provides an absolute path in /tmp/, allow it (used by n8n git clone)
    if os.path.isabs(repo_path_input):
        resolved_path = os.path.abspath(repo_path_input)
        if resolved_path.startswith('/tmp/'):
            if not os.path.exists(resolved_path):
                raise HTTPException(status_code=404, detail="Repo not found")
            return resolved_path
            
    # Otherwise, treat it as a relative path under ALLOWED_ROOT
    repo_path = os.path.abspath(os.path.join(ALLOWED_ROOT, repo_path_input))
    if not repo_path.startswith(os.path.abspath(ALLOWED_ROOT)):
        raise HTTPException(status_code=400, detail="Path traversal attempt")
    if not os.path.exists(repo_path):
        raise HTTPException(status_code=404, detail="Repo not found")
    return repo_path

app = FastAPI(title="CodeAtlas Parser API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ParseRequest(BaseModel):
    repo_path: str

class IngestRequest(BaseModel):
    github_url: str

@app.get("/healthz")
def health_check():
    return {"status": "ok"}

def _do_parse(repo_path: str, identifier: str):
    logger.info(f"Starting parse for: {identifier}")
    start_time = time.time()
        
    result_files = []
    file_count = 0
    skipped_count = 0
    error_count = 0
    
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith('.')]
        
        for file in files:
            if file_count >= MAX_FILES_PER_REPO:
                logger.warning(f"Max files limit reached ({MAX_FILES_PER_REPO}) for {request.repo_id}")
                break
            ext = os.path.splitext(file)[1]
            lang = None
            if ext == '.py':
                lang = 'python'
            elif ext in ['.js', '.jsx']:
                lang = 'javascript'
            elif ext in ['.ts', '.tsx']:
                lang = 'typescript'
                
            if lang:
                full_path = os.path.join(root, file)
                
                if os.path.getsize(full_path) > MAX_FILE_SIZE:
                    logger.debug(f"Skipping {full_path} (exceeds MAX_FILE_SIZE)")
                    skipped_count += 1
                    continue

                file_count += 1
                rel_path = os.path.relpath(full_path, repo_path).replace('\\', '/')
                try:
                    chunks, imports = extract_chunks_and_imports(full_path, lang)
                    result_files.append({
                        "path": rel_path,
                        "language": lang,
                        "chunks": chunks,
                        "imports": imports
                    })
                except Exception as e:
                    logger.error(f"Error parsing {full_path}: {e}")
                    error_count += 1
                    
        if file_count >= MAX_FILES_PER_REPO:
            break
            
    duration = time.time() - start_time
    logger.info(f"Completed parse for {identifier} in {duration:.2f}s. Parsed: {file_count}, Skipped: {skipped_count}, Errors: {error_count}")
    return {"files": result_files}

def _do_summary(repo_path: str, identifier: str):
        
    total_files = 0
    lang_counter = Counter()
    all_imports = set()
    total_functions = 0
    total_classes = 0
    
    logger.info(f"Starting summary for: {identifier}")
    
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith('.')]
        
        for file in files:
            if total_files >= MAX_FILES_PER_REPO:
                break
            ext = os.path.splitext(file)[1]
            lang = None
            if ext == '.py':
                lang = 'python'
            elif ext in ['.js', '.jsx']:
                lang = 'javascript'
            elif ext in ['.ts', '.tsx']:
                lang = 'typescript'
                
            if lang:
                total_files += 1
                lang_counter[lang] += 1
                full_path = os.path.join(root, file)
                try:
                    chunks, imports = extract_chunks_and_imports(full_path, lang)
                    all_imports.update(imports)
                    
                    for chunk in chunks:
                        if chunk['type'] == 'function':
                            total_functions += 1
                        elif chunk['type'] == 'class':
                            total_classes += 1
                except Exception as e:
                    print(f"Error parsing {full_path}: {e}")
                    
    # Determine primary language
    primary_language = lang_counter.most_common(1)[0][0] if lang_counter else "Unknown"
    
    # Capitalize it
    if primary_language == 'javascript':
        primary_language = 'JavaScript'
    elif primary_language == 'typescript':
        primary_language = 'TypeScript'
    elif primary_language == 'python':
        primary_language = 'Python'
        
    # Detect framework from imports
    framework = "None detected"
    imports_lower = {i.lower() for i in all_imports}
    
    if "express" in imports_lower:
        framework = "Express.js"
    elif "react" in imports_lower:
        framework = "React"
    elif "fastapi" in imports_lower:
        framework = "FastAPI"
    elif "flask" in imports_lower:
        framework = "Flask"
    elif "vue" in imports_lower:
        framework = "Vue.js"
    elif "next" in imports_lower:
        framework = "Next.js"
        
    # Runtime detection
    runtime = "Unknown"
    if primary_language in ['JavaScript', 'TypeScript']:
        runtime = "Node.js"
    elif primary_language == 'Python':
        runtime = "Python 3.x"

    return {
        "language": primary_language,
        "runtime": runtime,
        "framework": framework,
        "total_modules": total_files,
        "total_functions": total_functions,
        "total_classes": total_classes,
        "has_dependency_graph": True,
        "has_security_analysis": True
    }

@app.post("/parse")
def parse_repo(request: ParseRequest, api_key: str = Depends(get_api_key)):
    repo_path = get_secure_path(request.repo_path)
    return _do_parse(repo_path, request.repo_path)

@app.post("/summary")
def summary_repo_endpoint(request: ParseRequest, api_key: str = Depends(get_api_key)):
    repo_path = get_secure_path(request.repo_path)
    return _do_summary(repo_path, request.repo_path)

@app.post("/ingest")
def ingest_repo(request: IngestRequest, api_key: str = Depends(get_api_key)):
    logger.info(f"Starting ingest for: {request.github_url}")
    # Create temp directory
    temp_dir = tempfile.mkdtemp(prefix="codeatlas_ingest_")
    try:
        git.Repo.clone_from(request.github_url, temp_dir, depth=1)
        # Parse it
        parsed_data = _do_parse(temp_dir, request.github_url)
        return parsed_data
    except git.exc.GitCommandError as e:
        logger.error(f"Git clone failed for {request.github_url}: {e}")
        raise HTTPException(status_code=400, detail="Failed to clone repository. Ensure the URL is valid and public.")
    finally:
        # Clean up temp directory aggressively
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception as e:
            logger.error(f"Failed to cleanup temp dir {temp_dir}: {e}")
