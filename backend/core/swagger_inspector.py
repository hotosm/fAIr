from drf_yasg.inspectors import SwaggerAutoSchema


class CustomAutoSchema(SwaggerAutoSchema):
    """
    Custom schema inspector for automatic tag generation based on URL patterns.
    """
    
    def get_tags(self, operation_keys=None):
        """
        Automatically generate tags from URL path.
        Converts URL segments like 'mapswipe-project' to 'Mapswipe Project'
        """
        operation_keys = operation_keys or []
        
        TAG_MAP = {
            'dataset': 'Datasets',
            'aoi': 'AOI (Areas of Interest)',
            'label': 'Labels',
            'training': 'Training',
            'model': 'Models',
            'feedback': 'Feedback',
            'banner': 'Banners',
            'notifications': 'Notifications',
            'prediction': 'Predictions',
            'mapswipe-project': 'MapSwipe Projects',
            'auth': 'Authentication',
        }
        
        if operation_keys:
            path_segment = operation_keys[0] if operation_keys else None
            
            if path_segment in TAG_MAP:
                return [TAG_MAP[path_segment]]
            
            if path_segment:
                return [path_segment.replace('-', ' ').replace('_', ' ').title()]
        
        return super().get_tags(operation_keys)
