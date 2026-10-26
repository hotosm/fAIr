from django.db import migrations, models


def imagery_from_image_uri(apps, schema_editor):
    Prediction = apps.get_model("predictions", "Prediction")
    for prediction in Prediction.objects.all():
        prediction.imagery = {"image": prediction.image_uri}
        prediction.save(update_fields=["imagery"])


def image_uri_from_imagery(apps, schema_editor):
    Prediction = apps.get_model("predictions", "Prediction")
    for prediction in Prediction.objects.all():
        if len(prediction.imagery) > 1:
            raise RuntimeError(f"Prediction {prediction.id} has imagery for {sorted(prediction.imagery)}; one URL cannot hold it")
        prediction.image_uri = prediction.imagery[prediction.primary_input]
        prediction.save(update_fields=["image_uri"])


class Migration(migrations.Migration):
    dependencies = [
        ("predictions", "0007_prediction_geometry"),
    ]

    operations = [
        migrations.AddField(model_name="prediction", name="imagery", field=models.JSONField(default=dict)),
        migrations.AddField(
            model_name="prediction", name="primary_input", field=models.CharField(default="image", max_length=64)
        ),
        # Nullable while the data moves, so reversing can add the column back to a populated table.
        migrations.AlterField(
            model_name="prediction", name="image_uri", field=models.URLField(null=True)
        ),
        migrations.RunPython(imagery_from_image_uri, image_uri_from_imagery),
        migrations.RemoveField(model_name="prediction", name="image_uri"),
        migrations.AlterField(model_name="prediction", name="imagery", field=models.JSONField()),
        migrations.AlterField(model_name="prediction", name="primary_input", field=models.CharField(max_length=64)),
    ]
