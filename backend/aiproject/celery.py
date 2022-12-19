"""
https://docs.celeryq.dev/en/stable/django/first-steps-with-django.html
"""
from __future__ import absolute_import

import os

from celery import Celery
from django.conf import settings

# this code copied from manage.py
# set the default Django settings module for the 'celery' app.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aiproject.settings")

# app name
app = Celery("aiproject")

# read config from Django settings, the CELERY namespace would make celery
# config keys has `CELERY` prefix
app.config_from_object("django.conf:settings", namespace="CELERY")

# discover and load tasks.py from from all registered Django apps
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)


@app.task(bind=True)
def debug_task(self):
    print("Request: {0!r}".format(self.request))
