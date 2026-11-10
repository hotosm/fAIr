from django.conf import settings
from fair.stac.inputs import IMAGE_INPUT, SINGLE_CHIPS_ASSET, input_chips_asset
from fair.utils.storage import DatasetStoragePaths
from upath import UPath


def presigned_get_url(key: str) -> str:
    return settings.S3_CLIENT.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": settings.BUCKET_NAME, "Key": key},
        ExpiresIn=settings.PRESIGNED_URL_EXPIRY,
    )


def remove_dir(uri: str) -> None:
    folder = UPath(uri)
    if not folder.exists():
        return
    folder.rmdir(recursive=True)
    # s3fs bulk delete omits per-key errors such as AccessDenied (S3FileSystem._bulk_delete).
    if folder.exists():
        raise OSError(f"{uri} still exists after delete")


def _folder() -> str:
    # Per-environment key prefix (e.g. "dev/"), shared with the pipeline paths so
    # a bucket can host several environments side by side. Empty disables it.
    prefix = settings.PARENT_BUCKET_FOLDER
    return f"{prefix}/" if prefix else ""


class StoragePaths:
    # Source of truth for every S3 path the backend writes or reads. Every key is
    # rooted under `_folder()` so all environments share one bucket cleanly.
    # `*_key()` returns "{folder}{key}" (for boto3 presigning); `*_uri()` returns
    # "s3://{bucket}/{folder}{key}" (for upath/fsspec writes).

    DATASETS_ROOT = "datasets"
    DATASETS_DOWNLOAD_SUBDIR = "download"
    PREDICTIONS_ROOT = "predict"
    STAC_DOWNLOADS_ROOT = "downloads"

    LABELS_GEOJSON_FILENAME = "labels.geojson"
    PREDICTION_GEOJSON_FILENAME = "predictions.geojson"
    PREDICTION_FGB_FILENAME = "predictions.fgb"
    PREDICTION_PMTILES_FILENAME = "predictions.pmtiles"

    @staticmethod
    def _bucket() -> str:
        return settings.BUCKET_NAME

    @classmethod
    def _uri(cls, key: str) -> str:
        return f"s3://{cls._bucket()}/{key}"

    #  STAC downloads

    @classmethod
    def stac_download_prefix(cls, collection: str, item_id: str, asset: str) -> str:
        return f"{_folder()}{cls.STAC_DOWNLOADS_ROOT}/{collection}/{item_id}/{asset}/"

    #  datasets

    @classmethod
    def dataset_chips_dir_key(cls, stac_id: str, input_name: str) -> str:
        # Built single-input datasets hold their chips in `chips/`; asset URLs derive from it.
        folder = SINGLE_CHIPS_ASSET if input_name == IMAGE_INPUT else input_chips_asset(input_name)
        return f"{_folder()}{cls.DATASETS_ROOT}/{stac_id}/{folder}"

    @classmethod
    def dataset_chips_dir_uri(cls, stac_id: str, input_name: str) -> str:
        return cls._uri(cls.dataset_chips_dir_key(stac_id, input_name))

    @classmethod
    def dataset_labels_dir_key(cls, stac_id: str) -> str:
        return f"{_folder()}{cls.DATASETS_ROOT}/{stac_id}/labels"

    @classmethod
    def dataset_labels_dir_uri(cls, stac_id: str) -> str:
        return cls._uri(cls.dataset_labels_dir_key(stac_id))

    @classmethod
    def dataset_labels_geojson_key(cls, stac_id: str) -> str:
        return f"{cls.dataset_labels_dir_key(stac_id)}/{cls.LABELS_GEOJSON_FILENAME}"

    @classmethod
    def prediction_dir_key(cls, prediction_id: int) -> str:
        return f"{_folder()}{cls.PREDICTIONS_ROOT}/{prediction_id}"

    @classmethod
    def prediction_dir_uri(cls, prediction_id: int) -> str:
        return cls._uri(cls.prediction_dir_key(prediction_id))

    #  predictions: input chips

    @classmethod
    def prediction_input_dir_key(cls, prediction_id: int, input_name: str) -> str:
        return f"{cls.prediction_dir_key(prediction_id)}/input/{input_name}"

    @classmethod
    def prediction_input_dir_uri(cls, prediction_id: int, input_name: str) -> str:
        return cls._uri(cls.prediction_input_dir_key(prediction_id, input_name))

    #  predictions: outputs (deterministic; populated by post_run)

    @classmethod
    def prediction_output_dir_key(cls, prediction_id: int) -> str:
        return f"{cls.prediction_dir_key(prediction_id)}/output"

    @classmethod
    def prediction_geojson_key(cls, prediction_id: int) -> str:
        return f"{cls.prediction_output_dir_key(prediction_id)}/{cls.PREDICTION_GEOJSON_FILENAME}"

    @classmethod
    def prediction_geojson_uri(cls, prediction_id: int) -> str:
        return cls._uri(cls.prediction_geojson_key(prediction_id))

    @classmethod
    def prediction_fgb_key(cls, prediction_id: int) -> str:
        return f"{cls.prediction_output_dir_key(prediction_id)}/{cls.PREDICTION_FGB_FILENAME}"

    @classmethod
    def prediction_fgb_uri(cls, prediction_id: int) -> str:
        return cls._uri(cls.prediction_fgb_key(prediction_id))

    @classmethod
    def prediction_pmtiles_key(cls, prediction_id: int) -> str:
        return f"{cls.prediction_output_dir_key(prediction_id)}/{cls.PREDICTION_PMTILES_FILENAME}"

    @classmethod
    def prediction_pmtiles_uri(cls, prediction_id: int) -> str:
        return cls._uri(cls.prediction_pmtiles_key(prediction_id))


class BackendDatasetPaths(DatasetStoragePaths):
    ROOT = f"{_folder()}{StoragePaths.DATASETS_ROOT}"
    DOWNLOAD_SUBDIR = StoragePaths.DATASETS_DOWNLOAD_SUBDIR
