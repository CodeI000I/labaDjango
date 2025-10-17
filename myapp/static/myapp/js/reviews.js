// myapp/static/myapp/js/reviews.js

const reviewTextarea = document.getElementById('review-text');
const submitBtn = document.getElementById('submit-review');
const errorElement = document.getElementById('review-error');
const reviewsList = document.getElementById('reviews-list');

submitBtn.addEventListener('click', submitReview);

function submitReview() {
    const reviewText = reviewTextarea.value.trim();
    
    if (!reviewText) {
        showError('Пожалуйста, введите текст отзыва');
        return;
    }
    
    if (reviewText.length < 10) {
        showError('Отзыв слишком короткий (минимум 10 символов)');
        return;
    }
    
    hideError();
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
    
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
        showSuccess();
    })
    .catch(error => {
        showError(error.message);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить';
    });
}

function addReviewToList(review) {
    const noReviews = reviewsList.querySelector('.no-reviews');
    
    if (noReviews) {
        noReviews.remove();
    }
    
    const sentimentClass = review.sentiment ? 'positive' : 'negative';
    const sentimentText = review.sentiment ? 'Позитивный' : 'Негативный';
    const sentimentLabelClass = review.sentiment ? 'positive-sentiment' : 'negative-sentiment';
    
    const reviewItem = document.createElement('div');
    reviewItem.className = `review-item ${sentimentClass}`;
    reviewItem.dataset.reviewId = review.id;
    reviewItem.style.opacity = '0';
    
    const canDelete = review.username === currentUsername || isSuperuser;
    const deleteButton = canDelete ? 
        `<button class="delete-btn" data-review-id="${review.id}">Удалить</button>` : '';
    
    reviewItem.innerHTML = `
        <div class="review-header">
            <span class="review-author">${escapeHtml(review.username)}</span>
            <span class="review-date">${formatDate(review.created_at)}</span>
        </div>
        <div class="review-text">${escapeHtml(review.text)}</div>
        <div class="review-footer">
            <span class="sentiment-label">
                <span class="sentiment ${sentimentLabelClass}">${sentimentText}</span>
            </span>
            ${deleteButton}
        </div>
    `;
    
    reviewsList.insertBefore(reviewItem, reviewsList.firstChild);
    
    setTimeout(() => {
        reviewItem.style.transition = 'all 0.3s ease';
        reviewItem.style.opacity = '1';
    }, 10);
    
    if (canDelete) {
        const deleteBtn = reviewItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function() {
            deleteReview(review.id);
        });
    }
}

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
        const reviewItem = document.querySelector(`[data-review-id="${reviewId}"]`);
        if (reviewItem) {
            reviewItem.style.opacity = '0';
            setTimeout(() => {
                reviewItem.remove();
                
                const remainingReviews = reviewsList.querySelectorAll('.review-item');
                if (remainingReviews.length === 0) {
                    reviewsList.innerHTML = '<p class="no-reviews">Пока нет отзывов</p>';
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
    reviewTextarea.style.borderColor = '#e32636';
}

function hideError() {
    errorElement.classList.remove('visible');
    reviewTextarea.style.borderColor = '#ddd';
}

function showSuccess() {
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Отправлено!';
    submitBtn.style.backgroundColor = '#4caf50';
    
    setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.style.backgroundColor = '';
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

reviewTextarea.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        submitReview();
    }
});
