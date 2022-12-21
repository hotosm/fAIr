from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()


def test_dataset():
    response = factory.get("api/v1/dataset/")
    assert response.status_code == 200
