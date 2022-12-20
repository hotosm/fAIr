from celery import shared_task


@shared_task
def train_model(training_id, epochs, batch_size):

    return 'The test task executed with id "%s" ' % id
