import asyncio
import logging
import os
import time

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class PredictorPredictView(APIView):
    """
    Run AI model prediction on a specified bounding box.
    
    Accepts prediction parameters including bbox, model checkpoint, zoom level, 
    and various configuration options. Returns GeoJSON predictions.
    """
    
    def post(self, request):
        """
        Execute prediction with the provided parameters.
        
        Expected request body fields:
        - bbox: List of 4 coordinates [min_lon, min_lat, max_lon, max_lat]
        - checkpoint: Path to model checkpoint file
        - zoom_level: Zoom level for tile imagery (typically 19-21)
        - source: TMS URL for imagery source
        - confidence: Confidence threshold (0-100)
        - tolerance: Geometry simplification tolerance
        - area_threshold: Minimum area threshold for predictions
        - orthogonalize: Whether to orthogonalize geometries
        - ortho_skew_tolerance_deg: Orthogonalization skew tolerance in degrees
        - ortho_max_angle_change_deg: Max angle change for orthogonalization
        - get_predictions_as_points: Return points instead of polygons
        - make_geoms_valid: Ensure output geometries are valid
        """
        start_time = time.time()
        
        try:
            from predictor.models import PredictionRequest
            from predictor import predict
            
            params = PredictionRequest(**request.data)
            
            predictions = asyncio.run(predict(
                bbox=params.bbox,
                model_path=params.checkpoint,
                zoom_level=params.zoom_level,
                tms_url=params.source,
                confidence=params.confidence / 100,
                tolerance=params.tolerance,
                area_threshold=params.area_threshold,
                orthogonalize=params.orthogonalize,
                ortho_skew_tolerance_deg=params.ortho_skew_tolerance_deg,
                ortho_max_angle_change_deg=params.ortho_max_angle_change_deg,
                get_predictions_as_apoints=params.get_predictions_as_points,
                make_geoms_valid=params.make_geoms_valid,
            ))
            
            if params.checkpoint.startswith("/tmp") and os.path.exists(params.checkpoint):
                try:
                    os.remove(params.checkpoint)
                except Exception as cleanup_error:
                    logger.warning(f"Failed to cleanup temp file: {cleanup_error}")
            
            process_time = time.time() - start_time
            response = Response(predictions, status=status.HTTP_200_OK)
            response["X-Process-Time"] = f"{process_time:.4f} seconds"
            return response
            
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        except RuntimeError as e:
            error_message = str(e)
            logger.warning(f"Runtime error during prediction: {error_message}")
            
            if "No images found" in error_message:
                return Response(
                    {"detail": "No images found in the specified area. Please check your bbox and source URL."},
                    status=status.HTTP_404_NOT_FOUND
                )
            else:
                return Response(
                    {"detail": f"Prediction failed: {error_message}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Prediction failed with unexpected error: {e}", exc_info=True)
            return Response(
                {"detail": f"Internal server error during prediction: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
