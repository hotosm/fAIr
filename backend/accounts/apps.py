from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = "accounts"

    def ready(self) -> None:
        from . import schema  # noqa: F401  # registers OpenAPI auth extensions
