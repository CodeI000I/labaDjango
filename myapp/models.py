# myapp/models.py
from django.db import models
from django.contrib.auth.models import User

# ... ваши существующие модели (UserToken и т.д.) ...

class Review(models.Model):
    """Модель отзыва на фильм с автоматической классификацией тональности"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name="Пользователь"
    )
    text = models.TextField(
        verbose_name="Текст отзыва",
        help_text="Напишите ваш отзыв на английском языке"
    )
    sentiment = models.BooleanField(
        verbose_name="Тональность",
        help_text="True - позитивный, False - негативный"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    class Meta:
        verbose_name = "Отзыв"
        verbose_name_plural = "Отзывы"
        ordering = ["-created_at"]

    def __str__(self):
        sentiment_text = "😊 Позитивный" if self.sentiment else "😞 Негативный"
        return f"{self.user.username} - {sentiment_text} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

