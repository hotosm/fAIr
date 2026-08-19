from django.db import migrations, models


def bbox_to_geometry(apps, schema_editor):
    Prediction = apps.get_model("predictions", "Prediction")
    for prediction in Prediction.objects.all():
        if prediction.geometry or not prediction.bbox:
            continue
        west, south, east, north = (float(v) for v in prediction.bbox)
        prediction.geometry = {
            "type": "Polygon",
            "coordinates": [
                [[west, south], [east, south], [east, north], [west, north], [west, south]]
            ],
        }
        prediction.save(update_fields=["geometry"])


class Migration(migrations.Migration):

    dependencies = [
        ("predictions", "0006_alter_prediction_status_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="prediction",
            name="geometry",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.RunPython(bbox_to_geometry, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="prediction",
            name="geometry",
            field=models.JSONField(),
        ),
        migrations.RemoveField(
            model_name="prediction",
            name="bbox",
        ),
    ]
