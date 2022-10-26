
from django.urls import path
#now import the views.py file into this code
from . import views

urlpatterns=[
  path('login/',views.login),
  path('callback/',views.callback),
  path('me/',views.GetMyData.as_view()),

]