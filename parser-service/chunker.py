import tree_sitter_python as tspython
import tree_sitter_javascript as tsjavascript
import tree_sitter_typescript as tstypescript
try:
    import tree_sitter_java as tsjava
    import tree_sitter_go as tsgo
    import tree_sitter_rust as tsrust
    HAS_EXTRA_LANGS = True
except ImportError:
    HAS_EXTRA_LANGS = False

from tree_sitter import Language, Parser
import os
import re

PY_LANGUAGE = Language(tspython.language(), 'python')
JS_LANGUAGE = Language(tsjavascript.language(), 'javascript')
TS_LANGUAGE = Language(tstypescript.language_typescript(), 'typescript')

if HAS_EXTRA_LANGS:
    try:
        JAVA_LANGUAGE = Language(tsjava.language(), 'java')
        GO_LANGUAGE = Language(tsgo.language(), 'go')
        RUST_LANGUAGE = Language(tsrust.language(), 'rust')
    except (TypeError, ValueError):
        HAS_EXTRA_LANGS = False

SUPPORTED_LANGUAGES = {'python', 'javascript', 'typescript'}
if HAS_EXTRA_LANGS:
    SUPPORTED_LANGUAGES.update({'java', 'go', 'rust'})

def is_language_supported(language_str: str) -> bool:
    return language_str in SUPPORTED_LANGUAGES

def get_parser(language_str: str) -> Parser:
    parser = Parser()
    if language_str == 'python':
        parser.set_language(PY_LANGUAGE)
    elif language_str == 'javascript':
        parser.set_language(JS_LANGUAGE)
    elif language_str == 'typescript':
        parser.set_language(TS_LANGUAGE)
    elif HAS_EXTRA_LANGS and language_str == 'java':
        parser.set_language(JAVA_LANGUAGE)
    elif HAS_EXTRA_LANGS and language_str == 'go':
        parser.set_language(GO_LANGUAGE)
    elif HAS_EXTRA_LANGS and language_str == 'rust':
        parser.set_language(RUST_LANGUAGE)
    else:
        raise ValueError(f"Unsupported language: {language_str}")
    return parser

def extract_chunks_and_imports(file_path: str, language_str: str):
    parser = get_parser(language_str)
    
    with open(file_path, 'r', encoding='utf-8') as f:
        source_code = f.read()
    
    tree = parser.parse(bytes(source_code, 'utf8'))
    
    chunks = []
    imports = []
    
    lines = source_code.split('\n')
    
    def traverse(node):
        # We identify types by looking at node.type
        # Python: function_definition, class_definition, import_statement, import_from_statement
        # JS/TS: function_declaration, class_declaration, arrow_function, method_definition, import_statement
        
        node_type = node.type
        
        if node_type in ['import_statement', 'import_from_statement', 'import_declaration', 'import_spec', 'use_declaration', 'call_expression']:
            text = node.text.decode('utf8')
            
            # CommonJS / Dynamic imports
            if node_type == 'call_expression':
                if 'require(' in text or 'import(' in text:
                    imports.append(text)
            else:
                imports.append(text)
            
        elif node_type in ['function_definition', 'function_declaration', 'arrow_function', 'method_definition', 'method_declaration', 'function_item']:
            # Find name
            name = "unknown_function"
            for child in node.children:
                if child.type == 'identifier' or child.type == 'property_identifier':
                    name = child.text.decode('utf8')
                    break
            
            chunks.append({
                "type": "function",
                "name": name,
                "start_line": node.start_point[0] + 1,
                "end_line": node.end_point[0] + 1,
                "code": "\n".join(lines[node.start_point[0]:node.end_point[0] + 1])
            })
            
        elif node_type in ['class_definition', 'class_declaration', 'struct_item', 'impl_item', 'interface_declaration']:
            name = "unknown_class"
            for child in node.children:
                if child.type == 'identifier' or child.type == 'type_identifier':
                    name = child.text.decode('utf8')
                    break
                    
            chunks.append({
                "type": "class",
                "name": name,
                "start_line": node.start_point[0] + 1,
                "end_line": node.end_point[0] + 1,
                "code": "\n".join(lines[node.start_point[0]:node.end_point[0] + 1])
            })
            
        # Continue traversing children
        for child in node.children:
            traverse(child)

    traverse(tree.root_node)
    
    # Process imports to extract just the module names for dependencies
    clean_imports = []
    for imp in imports:
        if language_str == 'python':
            if imp.startswith('import '):
                parts = imp[7:].split(',')
                for p in parts:
                    clean_imports.append(p.strip().split(' ')[0])
            elif imp.startswith('from '):
                parts = imp.split(' ')
                if len(parts) > 1:
                    clean_imports.append(parts[1])
        else: # JS/TS/Java/Go/Rust
            if 'from' in imp and ('javascript' in language_str or 'typescript' in language_str):
                parts = imp.split('from')
                if len(parts) > 1:
                    clean_module = parts[1].strip().strip('\'";')
                    clean_imports.append(clean_module)
            elif 'require(' in imp:
                match = re.search(r"require\(['\"](.*?)['\"]\)", imp)
                if match:
                    clean_imports.append(match.group(1))
            elif 'import(' in imp:
                match = re.search(r"import\(['\"](.*?)['\"]\)", imp)
                if match:
                    clean_imports.append(match.group(1))
            elif language_str == 'go' and 'import' in imp:
                match = re.search(r'"(.*?)"', imp)
                if match:
                    clean_imports.append(match.group(1))
            elif language_str == 'java' and 'import ' in imp:
                clean_module = imp.replace('import ', '').replace(';', '').strip()
                clean_imports.append(clean_module)
            elif language_str == 'rust' and 'use ' in imp:
                clean_module = imp.replace('use ', '').replace(';', '').strip()
                clean_imports.append(clean_module.split('::')[0])
                    
    # Deduplicate
    clean_imports = list(set(clean_imports))

    return chunks, clean_imports
