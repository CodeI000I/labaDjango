from django.shortcuts import render
from django.contrib.auth.mixins import LoginRequiredMixin # <--
from django.views import View

class Index(LoginRequiredMixin, View): # <--
    def get(self, request):
        return render(request, "myapp/index.html")
    
class MediaView(LoginRequiredMixin, View):  # Новый класс
    def get(self, request):
        return render(request, "myapp/media.html")
    
class ContactsView(LoginRequiredMixin, View):  # Новый класс
    def get(self, request):
        return render(request, "myapp/contacts.html")