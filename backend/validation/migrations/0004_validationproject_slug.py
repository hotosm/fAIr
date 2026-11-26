from django.db import migrations, models

from validation.models import new_slug


def fill_slugs(apps, schema_editor) -> None:
    ValidationProject = apps.get_model("validation", "ValidationProject")
    for project in ValidationProject.objects.filter(slug__isnull=True):
        project.slug = new_slug(project.title)
        project.save(update_fields=["slug"])


class Migration(migrations.Migration):
    dependencies = [
        ("validation", "0003_validationproject_class_map"),
    ]

    operations = [
        migrations.AddField(
            model_name="validationproject",
            name="slug",
            field=models.SlugField(max_length=50, null=True, db_index=False),
        ),
        migrations.RunPython(fill_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="validationproject",
            name="slug",
            field=models.SlugField(
                editable=False,
                help_text="The project's address in links.",
                max_length=50,
                unique=True,
            ),
        ),
    ]
