from django.db import migrations, models


def imagery_from_source(apps, schema_editor):
    Dataset = apps.get_model("datasets", "Dataset")
    for dataset in Dataset.objects.all():
        dataset.imagery = {"image": dataset.source_imagery}
        dataset.save(update_fields=["imagery"])


def source_from_imagery(apps, schema_editor):
    Dataset = apps.get_model("datasets", "Dataset")
    for dataset in Dataset.objects.all():
        if len(dataset.imagery) > 1:
            raise RuntimeError(f"Dataset {dataset.id} has imagery for {sorted(dataset.imagery)}; one URL cannot hold it")
        dataset.source_imagery = dataset.imagery[dataset.primary_input]
        dataset.save(update_fields=["source_imagery"])


class Migration(migrations.Migration):
    dependencies = [
        ("datasets", "0005_dataset_category"),
    ]

    operations = [
        migrations.AddField(model_name="dataset", name="imagery", field=models.JSONField(default=dict)),
        migrations.AddField(
            model_name="dataset", name="primary_input", field=models.CharField(default="image", max_length=64)
        ),
        # Nullable while the data moves, so reversing can add the column back to a populated table.
        migrations.AlterField(
            model_name="dataset", name="source_imagery", field=models.URLField(null=True)
        ),
        migrations.RunPython(imagery_from_source, source_from_imagery),
        migrations.RemoveField(model_name="dataset", name="source_imagery"),
        migrations.AlterField(model_name="dataset", name="imagery", field=models.JSONField()),
        migrations.AlterField(model_name="dataset", name="primary_input", field=models.CharField(max_length=64)),
    ]
