from django.db import migrations, models


def forward(apps, schema_editor):
    Prediction = apps.get_model("predictions", "Prediction")
    for row in Prediction.objects.all().only("id", "is_public"):
        Prediction.objects.filter(pk=row.pk).update(
            visibility="public" if row.is_public else "private"
        )


def backward(apps, schema_editor):
    Prediction = apps.get_model("predictions", "Prediction")
    for row in Prediction.objects.all().only("id", "visibility"):
        Prediction.objects.filter(pk=row.pk).update(is_public=row.visibility == "public")


class Migration(migrations.Migration):
    dependencies = [
        ("predictions", "0004_remove_prediction_predictions_status__a25001_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="prediction",
            name="visibility",
            field=models.CharField(
                choices=[("private", "Private"), ("public", "Public")],
                db_index=True,
                default="private",
                max_length=20,
            ),
        ),
        migrations.RunPython(forward, backward),
        migrations.RemoveField(
            model_name="prediction",
            name="is_public",
        ),
    ]
