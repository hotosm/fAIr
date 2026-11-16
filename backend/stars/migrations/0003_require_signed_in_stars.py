import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def delete_anonymous_stars(apps, schema_editor):
    apps.get_model("stars", "Star").objects.filter(user__isnull=True).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("stars", "0002_remove_star_unique_user_star_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(delete_anonymous_stars, migrations.RunPython.noop),
        migrations.RemoveConstraint(model_name="star", name="unique_anon_star"),
        migrations.RemoveConstraint(model_name="star", name="unique_user_star"),
        migrations.RemoveField(model_name="star", name="anon_key"),
        migrations.AlterField(
            model_name="star",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="stars",
                to=settings.AUTH_USER_MODEL,
                to_field="osm_id",
            ),
        ),
        migrations.AddConstraint(
            model_name="star",
            constraint=models.UniqueConstraint(
                fields=("target_id", "user"), name="unique_user_star"
            ),
        ),
    ]
