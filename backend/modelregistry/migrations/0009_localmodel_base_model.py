import django.db.models.deletion
from django.db import migrations, models


def link_base_models(apps, schema_editor):
    LocalModel = apps.get_model("modelregistry", "LocalModel")
    BaseModel = apps.get_model("modelregistry", "BaseModel")
    TrainingRunRef = apps.get_model("trainings", "TrainingRunRef")
    for local_model in LocalModel.objects.all():
        stac_id = (
            TrainingRunRef.objects.filter(local_model=local_model)
            .values_list("base_model_stac_id", flat=True)
            .first()
        )
        base_model = BaseModel.objects.filter(stac_item_id=stac_id).first() if stac_id else None
        if base_model is None:
            raise RuntimeError(
                f"LocalModel '{local_model.name}' has no registered base model "
                f"(training base_model_stac_id={stac_id!r}); cannot backfill base_model."
            )
        local_model.base_model = base_model
        local_model.save(update_fields=["base_model"])


class Migration(migrations.Migration):

    dependencies = [
        ("modelregistry", "0008_category_alter_basemodel_category_and_more"),
        ("trainings", "0005_alter_trainingrunref_status_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="localmodel",
            name="base_model",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="local_models",
                to="modelregistry.basemodel",
            ),
        ),
        migrations.RunPython(link_base_models, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="localmodel",
            name="base_model",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="local_models",
                to="modelregistry.basemodel",
            ),
        ),
    ]
