from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from chunker import extract_chunks_and_imports
from collections import Counter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ParseRequest(BaseModel):
    repo_path: str

@app.post("/parse")
def parse_repo(request: ParseRequest):
    repo_path = request.repo_path
    if not os.path.exists(repo_path):
        raise HTTPException(status_code=404, detail="Repo path not found")
        
    result_files = []
    
    for root, dirs, files in os.walk(repo_path):
        # skip hidden dirs like .git
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        
        for file in files:
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
                # Ensure the path uses forward slashes for cross-platform consistency
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
                    print(f"Error parsing {full_path}: {e}")
                    
    return {"files": result_files}

@app.post("/summary")
def summary_repo(request: ParseRequest):
    repo_path = request.repo_path
    if not os.path.exists(repo_path):
        raise HTTPException(status_code=404, detail="Repo path not found")
        
    total_files = 0
    lang_counter = Counter()
    all_imports = set()
    total_functions = 0
    total_classes = 0
    
    for root, dirs, files in os.walk(repo_path):
        # skip hidden dirs and node_modules
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', 'dist', 'build', 'venv', '__pycache__']]
        
        for file in files:
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
