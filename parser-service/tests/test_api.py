from fastapi.testclient import TestClient
from main import app, API_KEY
import os

client = TestClient(app)

def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_parse_missing_api_key():
    response = client.post("/parse", json={"repo_path": "test_repo"})
    assert response.status_code == 403
    assert "Not authenticated" in response.json()["detail"] or "Could not validate" in response.json()["detail"]

def test_parse_invalid_api_key():
    response = client.post("/parse", json={"repo_path": "test_repo"}, headers={"X-API-Key": "wrong_key"})
    assert response.status_code == 403

def test_parse_path_traversal():
    response = client.post(
        "/parse", 
        json={"repo_path": "../escaped_repo"}, 
        headers={"X-API-Key": API_KEY}
    )
    assert response.status_code == 400
    assert "Path traversal attempt" in response.json()["detail"]

def test_parse_repo_not_found():
    response = client.post(
        "/parse", 
        json={"repo_path": "nonexistent_repo_12345"}, 
        headers={"X-API-Key": API_KEY}
    )
    assert response.status_code == 404
    assert "Repo not found" in response.json()["detail"]

from unittest.mock import patch
def test_ingest_repo():
    with patch('git.Repo.clone_from') as mock_clone:
        # We don't actually want to clone, we just want to ensure it gets called 
        # and returns a valid 200 (since the temp dir will be empty, it returns 0 files)
        response = client.post(
            "/ingest",
            json={"github_url": "https://github.com/expressjs/express"},
            headers={"X-API-Key": API_KEY}
        )
        assert response.status_code == 200
        assert mock_clone.called
        assert "files" in response.json()
