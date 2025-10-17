# myapp/admin.py
from django.contrib import admin
from .models import Review

# ... ваши существующие регистрации моделей ...

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'get_short_text', 'sentiment', 'created_at')
    list_filter = ('sentiment', 'created_at', 'user')
    search_fields = ('user__username', 'text')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 25
    
    def get_short_text(self, obj):
        return obj.text[:60] + '...' if len(obj.text) > 60 else obj.text
    
    get_short_text.short_description = 'Текст отзыва'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'text')
        }),
        ('Классификация', {
            'fields': ('sentiment',)
        }),
        ('Служебная информация', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
