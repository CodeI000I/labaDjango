import json
import re
import joblib
import os
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.shortcuts import render
from django.views import View
from django.conf import settings
from .models import Review

class Index(LoginRequiredMixin, View): # <--
    def get(self, request):
        return render(request, "myapp/index.html")
    
class MediaView(LoginRequiredMixin, View):  # Новый класс
    def get(self, request):
        return render(request, "myapp/media.html")
    
class ContactsView(LoginRequiredMixin, View):  # Новый класс
    def get(self, request):
        return render(request, "myapp/contacts.html")
    
MODEL_PATH = os.path.join(settings.BASE_DIR, 'myapp', 'ml_models', 'svm_model.pkl')
VECTORIZER_PATH = os.path.join(settings.BASE_DIR, 'myapp', 'ml_models', 'vectorizer.pkl')

try:
    svm_model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("✓ ML модель и векторизатор успешно загружены")
except Exception as e:
    print(f"⚠ Ошибка загрузки ML модели: {e}")
    svm_model = None
    vectorizer = None

def preprocess_text(text):
    """Препроцессинг текста для ML модели"""
    removed_html = re.sub(r'<.*?>', '', text)
    removed_url = re.sub(r'https?://\S+|www\.\S+', '', removed_html)
    return removed_url

class ReviewsView(LoginRequiredMixin, View):
    """Представление для страницы с отзывами"""
    
    def get(self, request):
        """Отображение страницы со списком всех отзывов"""
        all_reviews = Review.objects.select_related('user').all()
        return render(request, "myapp/reviews.html", {
            "all_reviews": all_reviews,
            "user": request.user
        })
    
    def post(self, request):
        """Создание нового отзыва с ML классификацией"""
        try:
            # Проверка загрузки модели
            if svm_model is None or vectorizer is None:
                return JsonResponse({
                    "errors": "ML модель не загружена. Запустите train_model.py"
                }, status=500)
            
            # Парсинг JSON данных
            data = json.loads(request.body.decode("utf-8"))
            
            if "review_text" not in data:
                return JsonResponse({"errors": "Отсутствует текст отзыва"}, status=400)
            
            review_text = data["review_text"].strip()
            
            # Валидация
            if not review_text:
                return JsonResponse({"errors": "Текст отзыва не может быть пустым"}, status=400)
            
            if len(review_text) < 10:
                return JsonResponse({
                    "errors": "Отзыв слишком короткий (минимум 10 символов)"
                }, status=400)
            
            # ML классификация
            processed_text = preprocess_text(review_text)
            vectorized_text = vectorizer.transform([processed_text])
            sentiment_prediction = svm_model.predict(vectorized_text)[0]
            sentiment_bool = bool(sentiment_prediction)
            
            # Создание отзыва
            new_review = Review(
                user=request.user,
                text=review_text,
                sentiment=sentiment_bool
            )
            
            new_review.full_clean()
            new_review.save()
            
            return JsonResponse({
                "id": new_review.id,
                "text": new_review.text,
                "sentiment": new_review.sentiment,
                "username": new_review.user.username,
                "created_at": new_review.created_at.strftime("%d.%m.%Y %H:%M:%S")
            }, status=201)
            
        except ValidationError as e:
            return JsonResponse({"errors": str(e.messages)}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"errors": "Неверный формат JSON"}, status=400)
        except Exception as e:
            return JsonResponse({"errors": f"Ошибка сервера: {str(e)}"}, status=500)

class DeleteReviewView(LoginRequiredMixin, View):
    """Представление для удаления отзыва"""
    
    def delete(self, request, review_id):
        """Удаление отзыва (только своего или админом)"""
        try:
            review = Review.objects.get(id=review_id)
            
            # Проверка прав доступа
            if review.user != request.user and not request.user.is_superuser:
                return JsonResponse({
                    "errors": "Нет прав на удаление этого отзыва"
                }, status=403)
            
            review.delete()
            return JsonResponse({"message": "Отзыв успешно удален"}, status=200)
            
        except Review.DoesNotExist:
            return JsonResponse({"errors": "Отзыв не найден"}, status=404)
        except Exception as e:
            return JsonResponse({"errors": f"Ошибка при удалении: {str(e)}"}, status=500)