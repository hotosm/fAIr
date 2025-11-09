import httpx
import json
import time
from ulid import ULID
from django.conf import settings
import requests
from urllib.parse import urlparse

class MapswipeClient:
    """
    A client for interacting with the MapSwipe backend API.
    """

    _ME_QUERY = """
        query Me {
          me { id, displayName }
        }
    """
    _CREATE_DRAFT_PROJECT_MUTATION = """
        mutation NewDraftProject($data: ProjectCreateInput!) {
            createProject(data: $data) {
                ... on ProjectTypeMutationResponseType {
                  result { id }
                  errors
                }
                ... on OperationInfo {
                  messages { message }
                }
            }
        }
    """
    _CREATE_PROJECT_ASSET_MUTATION = """
        mutation CreateProjectAsset($data: ProjectAssetCreateInput!) {
          createProjectAsset(data: $data) {
            ... on ProjectAssetTypeMutationResponseType {
              result { id }
              errors
            }
          }
        }
    """
    _ORGANIZATIONS_QUERY = """
        query Organizations {
          organizations {
            results { id, name }
          }
        }
    """
    _PROJECT_BY_ID_QUERY = """
        query ProjectById($id: ID!) {
          project(id: $id) {
            id
            firebaseId
            name
            status
            projectType
            region
            topic
            description
            projectInstruction
            lookFor
            projectNumber
            requestingOrganization { id, name }
          }
        }
    """
    _UPDATE_PROJECT_MUTATION = """
        mutation UpdateProject($id: ID!, $data: ProjectUpdateInput!) {
            updateProject(pk: $id, data: $data) {
                ... on ProjectTypeMutationResponseType {
                    result { id, status }
                    errors
                }
            }
        }
    """
    _UPDATE_PROJECT_STATUS_MUTATION = """
        mutation UpdateProjectStatus($id: ID!, $data: ProjectStatusUpdateInput!) {
            updateProjectStatus(pk: $id, data: $data) {
                ... on ProjectTypeMutationResponseType {
                    result { id, status, statusMessage }
                    errors
                }
            }
        }
    """
    _PROJECT_STATUS_QUERY = """
        query ProjectStatus($id: ID!) {
            project(id: $id) { id, status, statusMessage, processingStatus }
        }
    """

    def __init__(
        self,
        backend_url: str,
        manager_url: str,
        fb_auth_url: str,
        fb_username: str,
        fb_password: str,
        csrftoken_key: str = "MAPSWIPE-ALPHA-2-CSRFTOKEN",
        enable_authentication: bool = True,
    ):
        self._base_url = backend_url
        self._manager_url = manager_url
        self._fb_auth_url = fb_auth_url
        self._fb_username = fb_username
        self._fb_password = fb_password
        self._csrftoken_key = csrftoken_key
        self._enable_authentication = enable_authentication
        self._client = httpx.Client(base_url=self._base_url, timeout=30.0)
        self._headers = {}
        self._client_id = str(ULID())
        self._authenticate()

    def _authenticate(self):
        self._client.get("/health-check/").raise_for_status()
        if self._enable_authentication:
            fb_resp = httpx.post(
                self._fb_auth_url,
                headers={"origin": self._manager_url},
                json={
                    "returnSecureToken": True,
                    "email": self._fb_username,
                    "password": self._fb_password,
                    "clientType": "CLIENT_TYPE_WEB",
                },
            )
            fb_resp.raise_for_status()
            id_token = fb_resp.json()["idToken"]

            auth_resp = self._client.post("/firebase-auth/", json={"token": id_token})
            auth_resp.raise_for_status()

        csrf_token = self._client.cookies.get(self._csrftoken_key)
        if not csrf_token:
            raise ValueError("CSRF token not found in cookies.")

        self._headers = {
            "x-csrftoken": csrf_token,
            "origin": self._manager_url,
        }
        
    def _graphql_request(self, query: str, variables: dict = None, operation_name: str = None):
        payload = {"query": query, "variables": variables}
        if operation_name:
            payload["operationName"] = operation_name
        
        response = self._client.post("/graphql/", headers=self._headers, json=payload)
        response.raise_for_status()
        data = response.json()
        if "errors" in data:
            raise RuntimeError(f"GraphQL errors: {data['errors']}")
        return data["data"]

    def _graphql_request_with_files(self, query: str, files: dict, map_data: dict, variables: dict):
        form_data = {
            "operations": json.dumps({"query": query, "variables": variables}),
            "map": json.dumps(map_data),
        }
        response = self._client.post("/graphql/", headers=self._headers, files=files, data=form_data)
        response.raise_for_status()
        data = response.json()
        if "errors" in data:
            raise RuntimeError(f"GraphQL file upload errors: {data['errors']}")
        return data["data"]

    # def get_first_organization_id(self) -> str:
    #     """Fetches organizations and returns the ID of the first one."""
    #     data = self._graphql_request(self._ORGANIZATIONS_QUERY, operation_name="Organizations")
    #     organizations = data["organizations"]["results"]
    #     if not organizations:
    #         raise RuntimeError("No organizations found for the user.")
    #     return organizations[0]["id"]
    
    def create_validation_project(
        self,
        topic: str,
        region: str,
        description: str,
        instruction: str,
        look_for: str,
        project_number: int,
        cover_image_path: str = 'https://www.pngall.com/wp-content/uploads/8/Sample.png',
        organization_id: str = "4",
        additional_info_url: str = "fair-dev.hotosm.org",
    ) -> tuple[str, str]:
        """Creates a draft project and uploads its cover image."""
        project_params = {
            "clientId": self._client_id,
            "projectType": "VALIDATE",
            "topic": topic,
            "region": region,
            "description": description,
            "projectInstruction": instruction,
            "lookFor": look_for,
            "projectNumber": project_number,
            "requestingOrganization": organization_id,
            "additionalInfoUrl": additional_info_url,
        }
        
        create_project_data = self._graphql_request(
            query=self._CREATE_DRAFT_PROJECT_MUTATION,
            variables={"data": project_params},
            operation_name="NewDraftProject"
        )
        
        response_data = create_project_data.get("createProject", {})
        if not response_data.get("result") or response_data.get("errors"):
            raise RuntimeError(f"Failed to create draft project: {response_data}")

        project_id = response_data["result"]["id"]


        def is_url(path):
            try:
                result = urlparse(path)
                return all([result.scheme, result.netloc])
            except ValueError:
                return False

        if is_url(cover_image_path):
            response = requests.get(cover_image_path)
            response.raise_for_status()
            image_data = response.content
            filename = cover_image_path.split('/')[-1]
        else:
            with open(cover_image_path, "rb") as image_file:
                image_data = image_file.read()
                filename = cover_image_path.split('/')[-1]

        asset_params = {
            "inputType": "COVER_IMAGE",
            "clientId": self._client_id,
            "project": project_id,
        }

        asset_response = self._graphql_request_with_files(
            query=self._CREATE_PROJECT_ASSET_MUTATION,
            files={"coverImage": (filename, image_data, "image/png")},
            map_data={"coverImage": ["variables.data.file"]},
            variables={"data": asset_params},
        )

        image_asset_id = asset_response["createProjectAsset"]["result"]["id"]
        return project_id, image_asset_id


    def get_project_details(self, project_id: str) -> dict:
        """Polls and fetches the details for a given project ID."""
        return self._graphql_request(
            query=self._PROJECT_BY_ID_QUERY,
            variables={"id": project_id},
            operation_name="ProjectById"
        )["project"]

    def update_project(
        self,
        project_id: str,
        geojson_url: str,
        tms_url: str,
        image_asset_id: str,
        group_size: int = 25,
        verification_number: int = 4,
    ):
        """Updates a project with additional details."""
        update_params = {
            "clientId": self._client_id,
            "groupSize": group_size,
            "verificationNumber": verification_number,
            "image": image_asset_id,
            "tutorial": "37",
            "projectTypeSpecifics": {
                "validate": {
                    "objectSource": {
                        "sourceType": "OBJECT_GEOJSON_URL",
                        "objectGeojsonUrl": geojson_url,
                    },
                    "tileServerProperty": {
                        "name": "CUSTOM",
                        "custom": {
                            "credits": "OAM",
                            "url": tms_url,
                            "minZoom": 16,
                            "maxZoom": 20,
                        },
                    },
                    "customOptions": [
                        {
                            "clientId": self._client_id,
                            "title": "Yes",
                            "value": 1,
                            "icon": "CHECKMARK_OUTLINE",
                            "iconColor": "#388E3C",
                            "description": "matches",
                            "subOptions": [],
                        },
                        {
                            "clientId": self._client_id,
                            "title": "No",
                            "value": 0,
                            "icon": "CLOSE_OUTLINE",
                            "iconColor": "#D32F2F",
                            "description": "no match",
                            "subOptions": [],
                        },
                        {
                            "clientId": self._client_id,
                            "title": "Not Sure",
                            "value": 2,
                            "icon": "REMOVE_OUTLINE",
                            "iconColor": "#616161",
                            "description": "unsure",
                            "subOptions": [],
                        },
                    ],
                }
            },
        }
        update_data = self._graphql_request(
            query=self._UPDATE_PROJECT_MUTATION,
            variables={"id": project_id, "data": update_params},
            operation_name="UpdateProject",
        )
        
        response_data = update_data.get("updateProject", {})
        if not response_data.get("result") or response_data.get("errors"):
            raise RuntimeError(f"Failed to update project: {response_data}")
        
        return response_data

    def update_project_status(self, project_id: str, status: str):
        """Updates the status of a project."""
        status_params = {"clientId": self._client_id, "status": status}
        status_data = self._graphql_request(
            query=self._UPDATE_PROJECT_STATUS_MUTATION,
            variables={"id": project_id, "data": status_params},
            operation_name="UpdateProjectStatus",
        )
        
        response_data = status_data.get("updateProjectStatus", {})
        if not response_data.get("result") or response_data.get("errors"):
            raise RuntimeError(f"Failed to update project status: {response_data}")
        
        return response_data

    def get_project_status(self, project_id: str) -> dict:
        """Gets the status of a project."""
        return self._graphql_request(
            query=self._PROJECT_STATUS_QUERY,
            variables={"id": project_id},
            operation_name="ProjectStatus",
        )["project"]

    def poll_project_status(
        self, project_id: str, target_status: str
    ):
        """Polls the project status until it reaches the target status."""
        interval = settings.MAPSWIPE_POLL_INTERVAL
        timeout = settings.MAPSWIPE_POLL_TIMEOUT
        start_time = time.time()
        while time.time() - start_time < timeout:
            status_data = self.get_project_status(project_id)
            current_status = status_data.get("status")
            processing_status = status_data.get("processingStatus")
            print(f"Current Status: {current_status}, Processing: {processing_status}")
            if current_status == target_status:
                return status_data
            time.sleep(interval)
        raise TimeoutError(
            f"Project did not reach '{target_status}' status within {timeout} seconds."
        )

    def close(self):
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
