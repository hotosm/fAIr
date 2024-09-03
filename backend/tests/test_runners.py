from django.test.runner import DiscoverRunner
from django.db import connections

class NoDestroyTestRunner(DiscoverRunner):
    def teardown_databases(self, old_config, **kwargs):
        ## TODO : Do proper teardown
        pass
