import os
import subprocess
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Create PostgreSQL database backup'

    def add_arguments(self, parser):
        parser.add_argument('output', type=str, help='Output file path')

    def handle(self, *args, **options):
        output_file = options['output']
        
        db_config = settings.DATABASES['default']
        db_name = db_config['NAME']
        db_user = db_config['USER']
        db_password = db_config['PASSWORD']
        db_host = db_config['HOST']
        db_port = db_config['PORT']

        cmd = ['pg_dump']
        if db_host:
            cmd.extend(['-h', db_host])
        if db_port:
            cmd.extend(['-p', str(db_port)])
        if db_user:
            cmd.extend(['-U', db_user])
        cmd.extend(['-f', output_file, db_name])

        env = os.environ.copy()
        if db_password:
            env['PGPASSWORD'] = db_password

        try:
            subprocess.run(cmd, env=env, check=True)
            self.stdout.write(self.style.SUCCESS(f'Backup created: {output_file}'))
        except subprocess.CalledProcessError:
            raise CommandError('pg_dump failed')
        except FileNotFoundError:
            raise CommandError('pg_dump not found')
