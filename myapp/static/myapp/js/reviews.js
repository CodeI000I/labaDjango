// myapp/static/myapp/js/reviews.js

// Элементы DOM
const reviewTextarea = document.getElementById('review-text');
const submitBtn = document.getElementById('submit-review');
const errorElement = document.getElementById('review-error');
const charCount = document.getElementById('char-count');
const reviewsList = document.getElementById('reviews-list');

// Счетчик символов
reviewTextarea.addEventListener('input', function() {
    charCount.textContent = this.value.length;
});

// Отправка отзыва
submitBtn.addEventListener('click', submitReview);

function submitReview() {
    const reviewText = reviewTextarea.value.trim();
    
    // Валидация
    if (!reviewText) {
        showError('Пожалуйста, введите текст отзыва');
        return;
    }
    
    if (reviewText.length < 10) {
        showError('Отзыв слишком короткий (минимум 10 символов)');
        return;
    }
    
    hideError();
    
    // Блокируем кнопку
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Отправка...';
    
    // Отправка на сервер
    fetch(reviewsUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            review_text: reviewText
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.errors || 'Ошибка при отправке отзыва');
            });
        }
        return response.json();
    })
    .then(data => {
        addReviewToList(data);
        reviewTextarea.value = '';
        charCount.textContent = '0';
        showSuccess();
    })
    .catch(error => {
        showError(error.message);
    })
    .finally(() => {
        // Разблокируем кнопку
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-icon">📤</span> Отправить отзыв';
    });
}

function addReviewToList(review) {
    const noReviews = reviewsList.querySelector('.no-reviews');
    
    if (noReviews) {
        noReviews.remove();
    }
    
    const sentimentClass = review.sentiment ? 'positive' : 'negative';
    const sentimentText = review.sentiment ? '😊 Позитивный' : '😞 Негативный';
    const sentimentBadgeClass = review.sentiment ? 'positive-badge' : 'negative-badge';
    
    const reviewCard = document.createElement('div');
    reviewCard.className = `review-card ${sentimentClass}`;
    reviewCard.dataset.reviewId = review.id;
    reviewCard.style.opacity = '0';
    reviewCard.style.transform = 'translateY(-20px)';
    
    const canDelete = review.username === currentUsername;
    const deleteButton = canDelete ? 
        `<button class="delete-btn" data-review-id="${review.id}">🗑️ Удалить</button>` : '';
    
    reviewCard.innerHTML = `
        <div class="review-header">
            <div class="review-author-block">
                <span class="review-author">👤 ${escapeHtml(review.username)}</span>
                <span class="review-date">📅 ${formatDate(review.created_at)}</span>
            </div>
            <span class="review-sentiment">
                <span class="sentiment-badge ${sentimentBadgeClass}">${sentimentText}</span>
            </span>
        </div>
        <div class="review-text">${escapeHtml(review.text)}</div>
        ${deleteButton}
    `;
    
    reviewsList.insertBefore(reviewCard, reviewsList.firstChild);
    
    // Анимация появления
    setTimeout(() => {
        reviewCard.style.transition = 'all 0.3s ease';
        reviewCard.style.opacity = '1';
        reviewCard.style.transform = 'translateY(0)';
    }, 10);
    
    // Добавляем обработчик удаления
    if (canDelete) {
        const deleteBtn = reviewCard.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function() {
            deleteReview(review.id);
        });
    }
}

// Обработчики удаления для существующих отзывов
document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const reviewId = this.dataset.reviewId;
        deleteReview(reviewId);
    });
});

function deleteReview(reviewId) {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) {
        return;
    }
    
    fetch(deleteUrl + reviewId + '/', {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': csrfToken
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.errors || 'Ошибка при удалении отзыва');
            });
        }
        return response.json();
    })
    .then(() => {
        const reviewCard = document.querySelector(`[data-review-id="${reviewId}"]`);
        if (reviewCard) {
            reviewCard.style.opacity = '0';
            reviewCard.style.transform = 'scale(0.8)';
            setTimeout(() => {
                reviewCard.remove();
                
                // Проверяем, остались ли отзывы
                const remainingReviews = reviewsList.querySelectorAll('.review-card');
                if (remainingReviews.length === 0) {
                    reviewsList.innerHTML = `
                        <div class="no-reviews">
                            <div class="no-reviews-icon">🎬</div>
                            <p>Пока нет отзывов. Будьте первым!</p>
                        </div>
                    `;
                }
            }, 300);
        }
    })
    .catch(error => {
        alert(error.message);
    });
}

function showError(message) {
    errorElement.textContent = message;
    errorElement.classList.add('visible');
    reviewTextarea.style.borderColor = '#e74c3c';
}

function hideError() {
    errorElement.classList.remove('visible');
    reviewTextarea.style.borderColor = '#e0e0e0';
}

function showSuccess() {
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn-icon">✅</span> Отзыв добавлен!';
    submitBtn.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
    
    setTimeout(() => {
        submitBtn.innerHTML = originalHTML;
        submitBtn.style.background = '';
    }, 2000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Enter для отправки (Ctrl+Enter)
reviewTextarea.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        submitReview();
    }
});
