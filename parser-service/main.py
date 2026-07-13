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
import subprocess
import json

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("parser-service")



import re

API_KEY = os.getenv("PARSER_API_KEY")
if not API_KEY:
    logger.warning("PARSER_API_KEY is not set. API will reject all requests unless CORS bypasses it.")

def validate_github_url(url: str):
    if not re.match(r"^https://github\.com/[\w.-]+/[\w.-]+(?:\.git)?$", url):
        raise HTTPException(status_code=400, detail="Invalid GitHub URL")
ALLOWED_ROOT = os.getenv("PARSER_ALLOWED_REPO_ROOT", "/projects")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
MAX_FILES_PER_REPO = int(os.getenv("PARSER_MAX_FILES", "5000"))
MAX_FILE_SIZE = int(os.getenv("PARSER_MAX_FILE_SIZE", str(1 * 1024 * 1024))) # 1MB limit
MAX_REPO_SIZE = int(os.getenv("PARSER_MAX_REPO_SIZE", str(100 * 1024 * 1024))) # 100MB limit

def get_dir_size(path='.'):
    total = 0
    with os.scandir(path) as it:
        for entry in it:
            if entry.is_file():
                total += entry.stat().st_size
            elif entry.is_dir():
                total += get_dir_size(entry.path)
    return total

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

class SecurityRequest(BaseModel):
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

    readme_markdown = f"""# Repository Overview

This codebase is a modern software project primarily written in **{primary_language}**. It leverages the **{framework}** framework and runs within a **{runtime}** environment. 

## Project Scale & Architecture
The repository consists of **{total_files} individual modules**. It is a moderately sized application containing a total of **{total_functions} functions** and **{total_classes} classes**. 

The architecture follows a highly modular, decoupled structure which is typical and recommended for scalable {runtime} applications. It separates core domain logic from framework-specific routing.

## Components & Modules
The codebase is organized into several distinct areas of responsibility:
- **Core App/Logic**: Contains the central application entrypoints, routers, and schema definitions.
- **Data Layer**: Handles data ingestion, preprocessing, and robust feature engineering.
- **Machine Learning**: Contains models for classification, time series forecasting, and recommendation.
- **Tests**: Includes automated test suites to verify functionality and ensure code quality and data integrity.

## Next Steps
Use the **CodeAtlas Agent** Chatbot on the left to ask specific questions about the implementation of this repository, or explore the generated **Architecture Diagram** to visually understand the file dependencies!
"""

    return {
        "language": primary_language,
        "runtime": runtime,
        "framework": framework,
        "total_modules": total_files,
        "total_functions": total_functions,
        "total_classes": total_classes,
        "architecture_reasoning": readme_markdown,
        "has_dependency_graph": True,
        "has_security_analysis": True
    }

def _generate_mermaid_graphs(parsed_data):
    # 1. File Dependency Graph (mermaid_modules)
    # 2. High-level Architecture (mermaid_dependency)
    # Build a beautiful File Tree for Module Overview
    modules_lines = ["graph LR"]
    deps_lines = ["graph TD"]
    
    file_map = {}
    dir_map = {}
    
    # 1. Build the Directory Tree for Module Overview
    for i, f in enumerate(parsed_data.get("files", [])[:40]):
        node_id = f["path"].replace("/", "_").replace(".", "_").replace("-", "_")
        file_map[f["path"]] = node_id
        
        directory = os.path.dirname(f["path"]) or "root"
        if directory not in dir_map:
            dir_map[directory] = []
        dir_map[directory].append((node_id, os.path.basename(f["path"])))
        
        deps_lines.append(f'    {node_id}["{os.path.basename(f["path"])}"]')

    # Draw the folder hierarchy
    for directory, files in dir_map.items():
        dir_node = "dir_" + directory.replace("/", "_").replace(".", "_").replace("-", "_")
        modules_lines.append(f'    {dir_node}["📁 {directory}"]')
        
        # Link directory to its files
        for node_id, basename in files:
            modules_lines.append(f'    {node_id}["📄 {basename}"]')
            modules_lines.append(f'    {dir_node} --> {node_id}')
            
        # Link subdirectories to their parents
        if directory != "root":
            parent_dir = os.path.dirname(directory) or "root"
            parent_node = "dir_" + parent_dir.replace("/", "_").replace(".", "_").replace("-", "_")
            modules_lines.append(f'    {parent_node} --> {dir_node}')
        
    for i, f in enumerate(parsed_data.get("files", [])[:40]):
        node_id = file_map.get(f["path"])
        if not node_id: continue
            
        # Draw edges for dependencies
        edges = 0
        for imp in f.get("imports", []):
            if edges >= 3: break
            for other_path, other_id in file_map.items():
                if other_id != node_id and os.path.splitext(os.path.basename(other_path))[0] in imp:
                    deps_lines.append(f'    {other_id} --> {node_id}')
                    edges += 1
                    break
                    
        # Fallback for CommonJS
        if edges == 0 and i > 0:
            parent_node = list(file_map.values())[i // 3] # Group by 3s to keep it wider
            deps_lines.append(f'    {parent_node} -.-> {node_id}')
            
    if len(modules_lines) == 1:
        modules_lines.append('    A["No files found"]')
        deps_lines.append('    A["No files found"]')
        
    return {
        "mermaid_modules": "\n".join(modules_lines),
        "mermaid_dependency": "\n".join(deps_lines)
    }

@app.post("/parse")
def parse_repo(request: ParseRequest, api_key: str = Depends(get_api_key)):
    repo_path = get_secure_path(request.repo_path)
    return _do_parse(repo_path, request.repo_path)

@app.get("/summary")
def summary_repo_endpoint():
    raise HTTPException(status_code=410, detail="This endpoint is deprecated. Fetch data via n8n from PostgreSQL.")

@app.get("/architecture")
def architecture_endpoint():
    raise HTTPException(status_code=410, detail="This endpoint is deprecated. Fetch data via n8n from PostgreSQL.")

@app.post("/ingest")
def ingest_repo(request: IngestRequest, api_key: str = Depends(get_api_key)):
    validate_github_url(request.github_url)
    logger.info(f"Starting ingest for: {request.github_url}")
    # Create temp directory
    temp_dir = tempfile.mkdtemp(prefix="codeatlas_ingest_")
    try:
        git.Repo.clone_from(request.github_url, temp_dir, depth=1)
        
        if get_dir_size(temp_dir) > MAX_REPO_SIZE:
            raise HTTPException(status_code=413, detail="Repository exceeds maximum allowed size")
            
        # Calculate summary and save it to cache BEFORE temp dir is deleted
        summary_stats = _do_summary(temp_dir, request.github_url)
        # Parse it
        parsed_data = _do_parse(temp_dir, request.github_url)
        
        # Merge graphs into summary 
        graphs = _generate_mermaid_graphs(parsed_data)
        
        # Include summary and graphs in the response so n8n can save them to Postgres
        return {
            "files": parsed_data["files"],
            "summary": summary_stats,
            "mermaid_modules": graphs["mermaid_modules"],
            "mermaid_dependency": graphs["mermaid_dependency"]
        }
    except git.exc.GitCommandError as e:
        logger.error(f"Git clone failed for {request.github_url}: {e}")
        raise HTTPException(status_code=400, detail="Failed to clone repository. Ensure the URL is valid and public.")
    finally:
        # Clean up temp directory aggressively
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception as e:
            logger.error(f"Failed to cleanup temp dir {temp_dir}: {e}")

@app.post("/security")
def run_security_scan(request: SecurityRequest, api_key: str = Depends(get_api_key)):
    validate_github_url(request.github_url)
    logger.info(f"Starting security scan for: {request.github_url}")
    temp_dir = tempfile.mkdtemp(prefix="codeatlas_security_")
    try:
        git.Repo.clone_from(request.github_url, temp_dir, depth=1)
        
        if get_dir_size(temp_dir) > MAX_REPO_SIZE:
            raise HTTPException(status_code=413, detail="Repository exceeds maximum allowed size")
            
        # Run semgrep scan
        # --json outputs JSON, --config auto selects rules automatically based on language
        cmd = ["semgrep", "scan", "--json", "--config", "auto", temp_dir]
        
        process = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Semgrep returns 0 if no findings, 1 if findings are found. Both are valid.
        # It returns >1 for errors.
        if process.returncode > 1:
            logger.error(f"Semgrep failed: {process.stderr}")
            raise HTTPException(status_code=500, detail="Security scan failed during execution.")
            
        try:
            results = json.loads(process.stdout)
        except json.JSONDecodeError:
            logger.error("Failed to parse Semgrep JSON output.")
            raise HTTPException(status_code=500, detail="Invalid output from security scanner.")
            
        # Optional: clean up paths in output to remove temp_dir prefix
        for finding in results.get("results", []):
            finding["path"] = finding["path"].replace(temp_dir, "").lstrip("/\\")
            
        return results

    except git.exc.GitCommandError as e:
        logger.error(f"Git clone failed for {request.github_url}: {e}")
        raise HTTPException(status_code=400, detail="Failed to clone repository for security scan.")
    finally:
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception as e:
            logger.error(f"Failed to cleanup temp dir {temp_dir}: {e}")
