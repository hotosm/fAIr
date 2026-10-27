from django.core.management import call_command
from django.db import migrations


def create_cache_table(apps, schema_editor) -> None:
    call_command("createcachetable", database=schema_editor.connection.alias)


class Migration(migrations.Migration):
    dependencies = [("modelregistry", "0011_remove_basemodel_stac_item")]

    operations = [migrations.RunPython(create_cache_table, migrations.RunPython.noop)]
