from django.test.runner import DiscoverRunner
from django.db import connections


class NoDestroyTestRunner(DiscoverRunner):
    """Custom test runner that handles database cleanup issues"""
    
    def teardown_databases(self, old_config, **kwargs):
        """Skip database teardown to avoid constraint issues"""
        pass
    
    def setup_databases(self, **kwargs):
        """Setup test databases with CASCADE handling"""
        # First try to drop existing test database if it exists
        from django.db import connection
        from django.core.management import call_command
        
        # Get database settings
        db_settings = connection.settings_dict
        test_db_name = f"test_{db_settings['NAME']}"
        
        # Try to drop the test database with CASCADE
        try:
            with connection.cursor() as cursor:
                cursor.execute(f"DROP DATABASE IF EXISTS {test_db_name} WITH (FORCE)")
        except Exception:
            pass  # Ignore errors
            
        return super().setup_databases(**kwargs)
