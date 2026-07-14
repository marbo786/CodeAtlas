import pytest
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from chunker import get_parser, extract_chunks_and_imports

def test_get_parser_valid_languages():
    parser_py = get_parser('python')
    assert parser_py is not None

    parser_js = get_parser('javascript')
    assert parser_js is not None

    parser_ts = get_parser('typescript')
    assert parser_ts is not None

def test_get_parser_invalid_language():
    with pytest.raises(ValueError) as excinfo:
        get_parser('ruby')
    assert "Unsupported language" in str(excinfo.value)

def test_extract_chunks_and_imports(tmp_path):
    # Create a dummy python file
    test_file = tmp_path / "test.py"
    test_file.write_text("""
import os
from collections import Counter

class MyClass:
    def my_method(self):
        pass

def my_function():
    print('hello')
""")

    chunks, imports = extract_chunks_and_imports(str(test_file), 'python')
    
    assert "os" in imports
    assert "collections" in imports
    
    # We expect chunk types: class, function (inside class), function
    chunk_types = [c['type'] for c in chunks]
    assert "class" in chunk_types
    assert "function" in chunk_types
    assert len(chunks) == 3 # Class, Class Method, Global Function
