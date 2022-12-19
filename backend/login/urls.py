from django.urls import path

# now import the views.py file into this code
from . import views

urlpatterns = [
    path("login/", views.login.as_view()),
    path("callback/", views.callback.as_view()),
    path("me/", views.GetMyData.as_view()),
]
