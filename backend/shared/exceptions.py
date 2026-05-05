# ruff: noqa: N818

import logging
from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


class FairBaseError(Exception):
    default_message = "An error occurred"
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code = "FAIR_ERROR"

    def __init__(self, message: str | None = None, details: dict[str, Any] | None = None):
        self.message = message or self.default_message
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        return {
            "error": {
                "code": self.error_code,
                "message": self.message,
                "details": self.details,
            }
        }


class ValidationException(FairBaseError):
    default_message = "Validation failed"
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "VALIDATION_ERROR"


class GeometryValidationException(ValidationException):
    error_code = "GEOMETRY_VALIDATION_ERROR"


class AuthenticationException(FairBaseError):
    default_message = "Authentication required"
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "AUTHENTICATION_ERROR"


class LoginException(FairBaseError):
    default_message = "Login failed"
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "LOGIN_ERROR"


def custom_exception_handler(exc, context):
    from fair.client import FairClientError

    if isinstance(exc, FairClientError):
        logger.warning("FairClientError: %s", exc)
        return Response(
            {
                "error": {
                    "code": "STAC_VALIDATION_ERROR",
                    "message": str(exc),
                }
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    if isinstance(exc, FairBaseError):
        logger.warning("Fair error: %s - %s", exc.error_code, exc.message)
        return Response(exc.to_dict(), status=exc.status_code)

    if isinstance(exc, DjangoValidationError):
        wrapped = ValidationException(
            message="Validation failed",
            details={
                "validation_errors": exc.message_dict
                if hasattr(exc, "message_dict")
                else [str(exc)]
            },
        )
        return Response(wrapped.to_dict(), status=wrapped.status_code)

    response = exception_handler(exc, context)
    if response is None:
        return None

    code_for_status = {
        status.HTTP_400_BAD_REQUEST: ("VALIDATION_ERROR", "Invalid request data"),
        status.HTTP_401_UNAUTHORIZED: ("AUTHENTICATION_ERROR", "Authentication required"),
        status.HTTP_403_FORBIDDEN: ("AUTHORIZATION_ERROR", "Permission denied"),
        status.HTTP_404_NOT_FOUND: ("RESOURCE_NOT_FOUND", "Resource not found"),
        status.HTTP_405_METHOD_NOT_ALLOWED: ("METHOD_NOT_ALLOWED", "HTTP method not allowed"),
        status.HTTP_429_TOO_MANY_REQUESTS: ("RATE_LIMIT_EXCEEDED", "Rate limit exceeded"),
    }
    code, message = code_for_status.get(
        response.status_code, ("DRF_ERROR", "Request processing failed")
    )
    if response.status_code >= 500:
        code, message = "INTERNAL_SERVER_ERROR", "Internal server error"
        logger.error("Internal server error: %s", exc, exc_info=True)

    response.data = {"error": {"code": code, "message": message, "details": response.data}}
    return response


def handle_validation_error(
    field_name: str, message: str, value: Any = None
) -> ValidationException:
    details: dict[str, Any] = {"field": field_name, "message": message}
    if value is not None:
        details["invalid_value"] = str(value)
    return ValidationException(
        message=f"Validation failed for field '{field_name}': {message}", details=details
    )


def handle_geometry_error(
    geometry_type: str, error_message: str, geometry_data: Any = None
) -> GeometryValidationException:
    details = {"geometry_type": geometry_type, "error": error_message}
    if geometry_data is not None:
        details["data"] = str(geometry_data)[:200]
    return GeometryValidationException(
        message=f"Invalid {geometry_type} geometry: {error_message}", details=details
    )
