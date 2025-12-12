from django.urls import path
from . import views

urlpatterns = [
    path('', views.chat_view, name='chat_view'),  # Main chat interface
    path('api/chat/', views.chat, name='chat_api'),  # API endpoint for chat
]
