import os
import subprocess
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Restore PostgreSQL database from backup'

    def add_arguments(self, parser):
        parser.add_argument('backup_file', type=str, help='Path to backup file')

    def handle(self, *args, **options):
        backup_file = options['backup_file']

        if not os.path.exists(backup_file):
            raise CommandError(f'Backup file not found: {backup_file}')

        db_config = settings.DATABASES['default']
        db_name = db_config['NAME']
        db_user = db_config['USER']
        db_password = db_config['PASSWORD']
        db_host = db_config['HOST']
        db_port = db_config['PORT']

        cmd = ['psql']
        if db_host:
            cmd.extend(['-h', db_host])
        if db_port:
            cmd.extend(['-p', str(db_port)])
        if db_user:
            cmd.extend(['-U', db_user])
        cmd.extend(['-d', db_name, '-f', backup_file])

        env = os.environ.copy()
        if db_password:
            env['PGPASSWORD'] = db_password

        try:
            subprocess.run(cmd, env=env, check=True)
            self.stdout.write(self.style.SUCCESS(f'Database restored from: {backup_file}'))
        except subprocess.CalledProcessError:
            raise CommandError('psql failed')
        except FileNotFoundError:
            raise CommandError('psql not found')
