from django.urls import path
from . import views

urlpatterns = [
    path('goals/', views.list_goals, name='list-goals'),
    path('standards/', views.list_standards, name='list-standards'),
    path('recommend/', views.recommend, name='recommend'),
]
