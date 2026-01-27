from django.db import migrations

def transfer_count_to_json(apps, schema_editor):
    Prediction = apps.get_model('core', 'Prediction')
    # Iterate over all predictions that have a result_count
    for prediction in Prediction.objects.all():
        # Initialize result dict if it's None
        if prediction.result is None:
            prediction.result = {}
        
        # Transfer the count
        prediction.result['count'] = prediction.result_count
        prediction.save(update_fields=['result'])

def reverse_transfer(apps, schema_editor):
    Prediction = apps.get_model('core', 'Prediction')
    for prediction in Prediction.objects.all():
        if prediction.result and 'count' in prediction.result:
            prediction.result_count = prediction.result['count']
            prediction.save(update_fields=['result_count'])

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_prediction_result'),
    ]

    operations = [
        migrations.RunPython(transfer_count_to_json, reverse_transfer),
    ]
