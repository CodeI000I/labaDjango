// myapp/static/myapp/js/reviews.js

// Элементы DOM
const reviewText = document.getElementById("review-text");
const applyBtn = document.getElementById("apply-btn");
const reviewError = document.getElementById("review-error");
const reviewList = document.getElementById("firstReviewList");

console.log("✓ Script loaded");

// Функция для удаления отзыва
function deleteReview(event) {
    event.preventDefault();
    
    const reviewId = this.getAttribute("data-review-id");
    console.log("Deleting review:", reviewId);
    
    if (!confirm("Вы уверены, что хотите удалить этот отзыв?")) {
        return;
    }

    fetch(deleteUrl + reviewId + "/", {
        method: "DELETE",
        headers: {
            "X-CSRFToken": token,
        },
    })
    .then(response => {
        console.log("Delete response:", response.status);
        if (!response.ok) {
            throw new Error("Ошибка при удалении");
        }
        return response.json();
    })
    .then(data => {
        console.log("✓ Delete success");
        
        // Находим элемент и удаляем
        const reviewItem = document.querySelector(`.review-item[data-review-id="${reviewId}"]`);
        if (reviewItem) {
            reviewItem.style.transition = "opacity 0.3s ease";
            reviewItem.style.opacity = "0";
            
            setTimeout(() => {
                reviewItem.remove();
                
                // Проверяем, остались ли отзывы
                const remainingReviews = reviewList.querySelectorAll(".review-item");
                if (remainingReviews.length === 0) {
                    const noReviews = document.createElement("p");
                    noReviews.className = "no-reviews";
                    noReviews.textContent = "Пока нет отзывов";
                    reviewList.appendChild(noReviews);
                }
            }, 300);
        }
    })
    .catch(error => {
        console.error("Delete error:", error);
        alert("Не удалось удалить отзыв");
    });
}

// Добавляем обработчики удаления для существующих отзывов
document.querySelectorAll(".del-btn").forEach(button => {
    button.addEventListener("click", deleteReview);
});

// Валидация и отправка формы
if (applyBtn) {
    applyBtn.addEventListener("click", validateForm);
    console.log("✓ Button listener added");
}

function activateReviewError(message) {
    if (reviewError) {
        reviewError.classList.add("visible");
        reviewError.textContent = message;
    }
}

function deactivateReviewError() {
    if (reviewError) {
        reviewError.classList.remove("visible");
        reviewError.textContent = "Пусто";
    }
}

function validateForm(event) {
    if (event) event.preventDefault();
    
    let isValid = true;

    if (!reviewText.value || reviewText.value.trim().length < 10) {
        activateReviewError("Минимум 10 символов");
        isValid = false;
    } else if (reviewText.value.length > 1000) {
        activateReviewError("Максимум 1000 символов");
        isValid = false;
    } else {
        deactivateReviewError();
    }

    if (isValid) {
        sendForm();
    }
}

function sendForm() {
    console.log("Sending review...");
    
    // Блокируем кнопку
    applyBtn.disabled = true;
    applyBtn.textContent = "Отправка...";
    
    fetch(reviewsUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": token,
        },
        body: JSON.stringify({
            review_text: reviewText.value.trim(),
        }),
    })
    .then(response => {
        console.log("Response:", response.status);
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.errors || "Ошибка отправки");
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("✓ Review created:", data);
        addReviewToList(data);
        reviewText.value = "";
        deactivateReviewError();
        showSuccess();
    })
    .catch(error => {
        console.error("Error:", error);
        activateReviewError(error.message);
    })
    .finally(() => {
        applyBtn.disabled = false;
        applyBtn.textContent = "Отправить";
    });
}

function addReviewToList(review) {
    console.log("Adding review to page");
    
    // Удаляем сообщение "Пока нет отзывов"
    const noReviews = reviewList.querySelector(".no-reviews");
    if (noReviews) {
        noReviews.remove();
    }

    const sentimentClass = review.sentiment ? "positive" : "negative";
    const sentimentText = review.sentiment ? "Позитивный" : "Негативный";
    const sentimentBadgeClass = review.sentiment ? "positive-badge" : "negative-badge";

    const reviewItem = document.createElement("div");
    reviewItem.className = `review-item ${sentimentClass}`;
    reviewItem.dataset.reviewId = review.id;

    const canDelete = review.username === currentUsername || isSuperuser;
    const deleteButton = canDelete
        ? `<button class="del-btn" data-review-id="${review.id}">Удалить</button>`
        : "";

    reviewItem.innerHTML = `
        <div class="review-info">
            <span class="review-author">${escapeHtml(review.username)}</span>
            <span class="review-date">${formatDate(review.created_at)}</span>
        </div>
        <div class="review-content">
            <span class="review-text">${escapeHtml(review.text)}</span>
        </div>
        <div class="review-actions">
            <span class="sentiment-badge ${sentimentBadgeClass}">${sentimentText}</span>
            ${deleteButton}
        </div>
    `;

    // Вставляем после заголовка
    const title = reviewList.querySelector("h3");
    if (title) {
        title.insertAdjacentElement('afterend', reviewItem);
    } else {
        reviewList.appendChild(reviewItem);
    }

    // Добавляем обработчик удаления
    if (canDelete) {
        const delBtn = reviewItem.querySelector(".del-btn");
        delBtn.addEventListener("click", deleteReview);
    }
    
    // Анимация появления
    reviewItem.style.opacity = "0";
    setTimeout(() => {
        reviewItem.style.transition = "opacity 0.3s ease";
        reviewItem.style.opacity = "1";
    }, 10);
}

function showSuccess() {
    applyBtn.textContent = "✓ Отправлено!";
    applyBtn.style.backgroundColor = "#4caf50";

    setTimeout(() => {
        applyBtn.textContent = "Отправить";
        applyBtn.style.backgroundColor = "#2196f3";
    }, 2000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Ctrl+Enter для отправки
reviewText.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.key === "Enter") {
        validateForm(e);
    }
});

console.log("✓ Script ready");
