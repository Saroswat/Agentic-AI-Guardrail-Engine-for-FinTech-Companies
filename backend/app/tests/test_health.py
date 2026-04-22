def test_health_endpoint(client):
    response = client.get("/health")
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "ok"
    assert "service" in payload
    assert "timestamp" in payload
