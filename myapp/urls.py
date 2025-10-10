from django.urls import path
from django.contrib.auth.views import LoginView, LogoutView # <--
from . import views

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("media/", views.MediaView.as_view(), name = "media"),
    path("contacts/", views.ContactsView.as_view(), name = "contacts"), # <--
    path("logout/", LogoutView.as_view(), name="logout"), # <--
    path("", views.Index.as_view(), name="index"),
]