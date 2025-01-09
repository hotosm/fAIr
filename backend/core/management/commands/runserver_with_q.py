import multiprocessing
import os

from django.core.management import call_command
from django.core.management.commands.runserver import Command as RunserverCommand


class Command(RunserverCommand):
    def handle(self, *args, **options):
        multiprocessing.Process(target=self.start_django_q).start()

        super().handle(*args, **options)

    def start_django_q(self):
        call_command("qcluster")
