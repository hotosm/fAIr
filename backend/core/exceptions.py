import logging
from typing import Dict, Any, Optional, Union
from rest_framework import status
from rest_framework.views import exception_handler
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError

logger = logging.getLogger(__name__)


class FairBaseException(Exception):
    default_message = "An error occurred"
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code = "FAIR_ERROR"
    
    def __init__(self, message: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        self.message = message or self.default_message
        self.details = details or {}
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "error": {
                "code": self.error_code,
                "message": self.message,
                "details": self.details
            }
        }


class ValidationException(FairBaseException):
    default_message = "Validation failed"
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "VALIDATION_ERROR"


class AuthenticationException(FairBaseException):
    default_message = "Authentication failed"
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "AUTHENTICATION_ERROR"


class LoginException(FairBaseException):
    default_message = "Login failed"
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "LOGIN_ERROR"


class AuthorizationException(FairBaseException):
    default_message = "Permission denied"
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "AUTHORIZATION_ERROR"


class ResourceNotFoundException(FairBaseException):
    default_message = "Resource not found"
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "RESOURCE_NOT_FOUND"


class ConflictException(FairBaseException):
    default_message = "Resource conflict"
    status_code = status.HTTP_409_CONFLICT
    error_code = "RESOURCE_CONFLICT"


class RateLimitException(FairBaseException):
    default_message = "Rate limit exceeded"
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    error_code = "RATE_LIMIT_EXCEEDED"


class GeometryValidationException(ValidationException):
    default_message = "Invalid geometry data"
    error_code = "GEOMETRY_VALIDATION_ERROR"


class SpatialQueryException(FairBaseException):
    default_message = "Spatial query failed"
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "SPATIAL_QUERY_ERROR"


class ModelTrainingException(FairBaseException):
    default_message = "Model training failed"
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "TRAINING_ERROR"


class PredictionException(FairBaseException):
    default_message = "Prediction failed"
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "PREDICTION_ERROR"


class ExternalServiceException(FairBaseException):
    default_message = "External service unavailable"
    status_code = status.HTTP_502_BAD_GATEWAY
    error_code = "EXTERNAL_SERVICE_ERROR"


class S3ServiceException(ExternalServiceException):
    default_message = "Storage service unavailable"
    error_code = "S3_SERVICE_ERROR"


class OSMServiceException(ExternalServiceException):
    default_message = "OpenStreetMap service unavailable"
    error_code = "OSM_SERVICE_ERROR"


class DataIntegrityException(FairBaseException):
    default_message = "Data integrity violation"
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "DATA_INTEGRITY_ERROR"


def custom_exception_handler(exc, context):
    if isinstance(exc, FairBaseException):
        logger.warning(
            f"FairException: {exc.error_code} - {exc.message}",
            extra={
                "error_code": exc.error_code,
                "details": exc.details,
                "view": context.get('view').__class__.__name__ if context.get('view') else None,
                "request_path": context.get('request').path if context.get('request') else None
            }
        )
        return Response(exc.to_dict(), status=exc.status_code)
    
    if isinstance(exc, DjangoValidationError):
        validation_exc = ValidationException(
            message="Validation failed",
            details={"validation_errors": exc.message_dict if hasattr(exc, 'message_dict') else [str(exc)]}
        )
        logger.warning(f"Django ValidationError: {exc}")
        return Response(validation_exc.to_dict(), status=validation_exc.status_code)
    
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response_data = {
            "error": {
                "code": "DRF_ERROR",
                "message": "Request processing failed",
                "details": response.data
            }
        }
        
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            custom_response_data["error"]["code"] = "VALIDATION_ERROR"
            custom_response_data["error"]["message"] = "Invalid request data"
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            custom_response_data["error"]["code"] = "AUTHENTICATION_ERROR"
            custom_response_data["error"]["message"] = "Authentication required"
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            custom_response_data["error"]["code"] = "AUTHORIZATION_ERROR"
            custom_response_data["error"]["message"] = "Permission denied"
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            custom_response_data["error"]["code"] = "RESOURCE_NOT_FOUND"
            custom_response_data["error"]["message"] = "Resource not found"
        elif response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            custom_response_data["error"]["code"] = "METHOD_NOT_ALLOWED"
            custom_response_data["error"]["message"] = "HTTP method not allowed"
        elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            custom_response_data["error"]["code"] = "RATE_LIMIT_EXCEEDED"
            custom_response_data["error"]["message"] = "Rate limit exceeded"
        elif response.status_code >= 500:
            custom_response_data["error"]["code"] = "INTERNAL_SERVER_ERROR"
            custom_response_data["error"]["message"] = "Internal server error"
            logger.error(f"Internal server error: {exc}", exc_info=True)
        
        response.data = custom_response_data
    
    return response


def handle_validation_error(field_name: str, message: str, value: Any = None) -> ValidationException:
    details = {"field": field_name, "message": message}
    if value is not None:
        details["invalid_value"] = str(value)
    
    return ValidationException(
        message=f"Validation failed for field '{field_name}': {message}",
        details=details
    )


def handle_geometry_error(geometry_type: str, error_message: str, geometry_data: Any = None) -> GeometryValidationException:
    details = {
        "geometry_type": geometry_type,
        "error": error_message
    }
    
    return GeometryValidationException(
        message=f"Invalid {geometry_type} geometry: {error_message}",
        details=details
    )


def handle_spatial_query_error(operation: str, error_message: str, **kwargs) -> SpatialQueryException:
    details = {
        "operation": operation,
        "error": error_message,
        **kwargs
    }
    
    return SpatialQueryException(
        message=f"Spatial query failed: {error_message}",
        details=details
    )