from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_transfer_result_count'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='prediction',
            name='result_count',
        ),
    ]
