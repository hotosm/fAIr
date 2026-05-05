from django.test.runner import DiscoverRunner


class NoDestroyTestRunner(DiscoverRunner):
    def teardown_databases(self, old_config, **kwargs):
        pass

    def setup_databases(self, **kwargs):
        from django.db import connection

        db_settings = connection.settings_dict
        test_db_name = f"test_{db_settings['NAME']}"

        try:
            with connection.cursor() as cursor:
                cursor.execute(f"DROP DATABASE IF EXISTS {test_db_name} WITH (FORCE)")
        except Exception:
            pass

        return super().setup_databases(**kwargs)
