from django.conf import settings
from django.db import migrations, models


def forward(apps, schema_editor):
    Dataset = apps.get_model("datasets", "Dataset")
    status_map = {
        "draft": "draft",
        "building": "building",
        "published": "built",
        "failed": "failed",
    }
    for row in Dataset.objects.all().only("id", "build_status"):
        new_status = status_map.get(row.build_status, "draft")
        new_visibility = "public" if row.build_status == "published" else "private"
        Dataset.objects.filter(pk=row.pk).update(
            status=new_status, visibility=new_visibility
        )


def backward(apps, schema_editor):
    Dataset = apps.get_model("datasets", "Dataset")
    status_map = {
        "draft": "draft",
        "building": "building",
        "built": "published",
        "failed": "failed",
    }
    for row in Dataset.objects.all().only("id", "status"):
        Dataset.objects.filter(pk=row.pk).update(build_status=status_map.get(row.status, "draft"))


class Migration(migrations.Migration):
    dependencies = [
        ("datasets", "0002_remove_dataset_build_error"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name="dataset",
            name="datasets_da_build_s_7fd7fa_idx",
        ),
        migrations.AddField(
            model_name="dataset",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("building", "Building"),
                    ("built", "Built"),
                    ("failed", "Failed"),
                ],
                default="draft",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="dataset",
            name="visibility",
            field=models.CharField(
                choices=[("private", "Private"), ("public", "Public")],
                db_index=True,
                default="private",
                max_length=20,
            ),
        ),
        migrations.AddIndex(
            model_name="dataset",
            index=models.Index(fields=["status"], name="datasets_da_status_f1863c_idx"),
        ),
        migrations.RunPython(forward, backward),
        migrations.RemoveField(
            model_name="dataset",
            name="build_status",
        ),
    ]
