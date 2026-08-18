import os
import time

import yaml
from kubernetes import client, config
from kubernetes.client.rest import ApiException


def deploy_model_to_knative(model_name, stac_item_url, category, namespace="fair-staging"):
    """
    Deploys a Knative service dynamically using the in-cluster RBAC service account.
    """
    # 1. Load Cluster Credentials
    try:
        # Attempts to load the securely mounted token from fair-model-deployer SA
        config.load_incluster_config()
    except config.ConfigException:
        # Fallback for local WSL2/VSCode testing using ~/.kube/config
        config.load_kube_config()

    # 2. Setup the Custom Objects API (required for Knative CRDs)
    api_instance = client.CustomObjectsApi()

    # Knative API Group definitions
    group = "serving.knative.dev"
    version = "v1"
    plural = "services"

    # 3. Load and populate the YAML template
    # Adjust the path based on where this script runs relative to project root
    template_path = os.path.join(
        os.path.dirname(__file__), "../../infra/knative-model-template.yaml"
    )

    with open(template_path) as file:
        manifest_str = file.read()

    # Determine dynamic image - assuming a base model server image for now
    image_url = os.getenv("MODEL_SERVER_IMAGE", "ghcr.io/hotosm/fair-model-server:latest")

    # Replace placeholders
    manifest_str = manifest_str.format(
        model_name=model_name,
        namespace=namespace,
        image_url=image_url,
        stac_item_url=stac_item_url,
        category=category,
    )
    manifest = yaml.safe_load(manifest_str)

    # 4. Deploy to Kubernetes
    try:
        api_instance.create_namespaced_custom_object(
            group=group,
            version=version,
            namespace=namespace,
            plural=plural,
            body=manifest,
        )
    except ApiException as e:
        if e.status == 409:  # Conflict: Service already exists, patch it instead
            api_instance.patch_namespaced_custom_object(
                group=group,
                version=version,
                namespace=namespace,
                plural=plural,
                name=model_name,
                body=manifest,
            )
        else:
            raise e

    # 5. Fetch the resulting Knative URL
    # Knative takes a moment to assign the URL, we implement a brief polling loop
    for _ in range(10):
        try:
            resource = api_instance.get_namespaced_custom_object(
                group=group, version=version, namespace=namespace, plural=plural, name=model_name
            )
            if "status" in resource and "url" in resource["status"]:
                return resource["status"]["url"]
        except ApiException:
            pass
        time.sleep(1)

    # Fallback to predictable internal cluster URL if polling times out
    return f"http://{model_name}.{namespace}.svc.cluster.local"
