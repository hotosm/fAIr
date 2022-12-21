from rest_framework.test import APIClient

client = APIClient()


def test_dataset():
    response = client.get("api/v1/dataset/")
    assert response.status_code == 200
