from rest_framework import status
from rest_framework.response import Response
from django.utils.translation import gettext_lazy as _


class APIResponseCodes:
    SUCCESS = "SUCCESS"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    ALREADY_EXISTS = "ALREADY_EXISTS"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    TRAINING_IN_PROGRESS = "TRAINING_IN_PROGRESS"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class APIResponse:
    @staticmethod
    def success(data=None, message="Operation successful", status_code=status.HTTP_200_OK):
        response_data = {
            "code": APIResponseCodes.SUCCESS,
            "message": message,
        }
        if data is not None:
            response_data["data"] = data
        return Response(response_data, status=status_code)

    @staticmethod
    def error(code, message, details=None, status_code=status.HTTP_400_BAD_REQUEST):
        response_data = {
            "code": code,
            "message": message,
        }
        if details:
            response_data["details"] = details
        return Response(response_data, status=status_code)

    @staticmethod
    def validation_error(message, details=None):
        return APIResponse.error(
            APIResponseCodes.VALIDATION_ERROR,
            message,
            details,
            status.HTTP_400_BAD_REQUEST
        )

    @staticmethod
    def not_found(message="Resource not found"):
        return APIResponse.error(
            APIResponseCodes.NOT_FOUND,
            message,
            status_code=status.HTTP_404_NOT_FOUND
        )

    @staticmethod
    def permission_denied(message="Permission denied"):
        return APIResponse.error(
            APIResponseCodes.PERMISSION_DENIED,
            message,
            status_code=status.HTTP_403_FORBIDDEN
        )

    @staticmethod
    def already_exists(message="Resource already exists"):
        return APIResponse.error(
            APIResponseCodes.ALREADY_EXISTS,
            message,
            status_code=status.HTTP_409_CONFLICT
        )

    @staticmethod
    def external_service_error(message="External service error"):
        return APIResponse.error(
            APIResponseCodes.EXTERNAL_SERVICE_ERROR,
            message,
            status_code=status.HTTP_502_BAD_GATEWAY
        )

    @staticmethod
    def training_in_progress(message="Another training is already in progress"):
        return APIResponse.error(
            APIResponseCodes.TRAINING_IN_PROGRESS,
            message,
            status_code=status.HTTP_409_CONFLICT
        )

    @staticmethod
    def insufficient_data(message="Insufficient data for operation"):
        return APIResponse.error(
            APIResponseCodes.INSUFFICIENT_DATA,
            message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )