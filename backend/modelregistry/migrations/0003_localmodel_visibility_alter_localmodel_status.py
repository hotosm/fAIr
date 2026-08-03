from django.db import migrations, models


def forward(apps, schema_editor):
    LocalModel = apps.get_model("modelregistry", "LocalModel")
    status_map = {
        "draft": "active",
        "published": "active",
        "archived": "archived",
    }
    for row in LocalModel.objects.all().only("id", "status"):
        new_status = status_map.get(row.status, "active")
        new_visibility = "public" if row.status == "published" else "private"
        LocalModel.objects.filter(pk=row.pk).update(
            status=new_status, visibility=new_visibility
        )


def backward(apps, schema_editor):
    LocalModel = apps.get_model("modelregistry", "LocalModel")
    for row in LocalModel.objects.all().only("id", "status", "visibility"):
        if row.status == "archived":
            new_status = "archived"
        elif row.visibility == "public":
            new_status = "published"
        else:
            new_status = "draft"
        LocalModel.objects.filter(pk=row.pk).update(status=new_status)


class Migration(migrations.Migration):
    dependencies = [
        ("modelregistry", "0002_rename_stac_id_localmodel_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="localmodel",
            name="visibility",
            field=models.CharField(
                choices=[("private", "Private"), ("public", "Public")],
                db_index=True,
                default="private",
                max_length=20,
            ),
        ),
        migrations.RunPython(forward, backward),
        migrations.AlterField(
            model_name="localmodel",
            name="status",
            field=models.CharField(
                choices=[("active", "Active"), ("archived", "Archived")],
                default="active",
                max_length=20,
            ),
        ),
    ]
