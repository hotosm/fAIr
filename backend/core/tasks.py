from celery import shared_task


@shared_task
def train_model(param):
    print(param)
    return 'The test task executed with argument "%s" ' % param
