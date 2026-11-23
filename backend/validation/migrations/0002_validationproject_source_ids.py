import django.contrib.postgres.fields
from django.db import migrations, models


def copy_source_id(apps, schema_editor):
    ValidationProject = apps.get_model("validation", "ValidationProject")
    for project in ValidationProject.objects.all():
        project.source_ids = [project.source_id]
        project.save(update_fields=["source_ids"])


def restore_source_id(apps, schema_editor):
    ValidationProject = apps.get_model("validation", "ValidationProject")
    for project in ValidationProject.objects.all():
        project.source_id = project.source_ids[0]
        project.save(update_fields=["source_id"])


class Migration(migrations.Migration):
    dependencies = [("validation", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="validationproject",
            name="source_ids",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=200),
                default=list,
                help_text="Dataset STAC ids on the same imagery, or the one prediction id.",
                size=None,
            ),
        ),
        migrations.RunPython(copy_source_id, restore_source_id),
        migrations.AlterField(
            model_name="validationproject",
            name="source_id",
            field=models.CharField(max_length=200, default=""),
        ),
        migrations.RemoveField(model_name="validationproject", name="source_id"),
    ]
