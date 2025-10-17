// myapp/static/myapp/js/reviews.js

// Элементы DOM
const reviewText = document.getElementById("review-text");
const applyBtn = document.getElementById("apply-btn");
const reviewError = document.getElementById("review-error");
const reviewList = document.getElementById("firstReviewList");

// Функция для удаления отзыва
function deleteReview() {
    const reviewId = this.getAttribute("data-review-id");
    
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
        if (!response.ok) {
            throw new Error("Ошибка при удалении отзыва");
        }
        return response.json();
    })
    .then(() => {
        const reviewItem = document.querySelector(`[data-review-id="${reviewId}"]`);
        if (reviewItem) {
            reviewItem.style.opacity = "0";
            setTimeout(() => {
                reviewItem.remove();
                
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
        console.error("Ошибка:", error);
        alert("Не удалось удалить отзыв");
    });
}

// Добавляем обработчики удаления для существующих отзывов
document.querySelectorAll(".del-btn").forEach(button => {
    button.addEventListener("click", deleteReview);
});

// Валидация и отправка формы
applyBtn.addEventListener("click", validateForm);

function activateReviewError(message) {
    reviewError.classList.add("visible");
    reviewError.textContent = message;
}

function deactivateReviewError() {
    reviewError.classList.remove("visible");
    reviewError.textContent = "Пусто";
}

function validateForm() {
    let isValid = true;

    if (!reviewText.value || reviewText.value.length < 10) {
        activateReviewError("Пожалуйста, введите отзыв (минимум 10 символов)");
        isValid = false;
    } else if (reviewText.value.length > 1000) {
        activateReviewError("Отзыв слишком длинный (максимум 1000 символов)");
        isValid = false;
    } else {
        deactivateReviewError();
    }

    if (isValid) {
        sendForm();
    }
}

function responseCheck(response) {
    if (!response.ok) {
        console.log(response.statusText);
        activateReviewError("Ошибка при отправке отзыва");
        throw new Error(response.statusText);
    }
    return response.json();
}

function sendForm() {
    fetch(reviewsUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": token,
        },
        body: JSON.stringify({
            review_text: reviewText.value,
        }),
    })
    .then(responseCheck)
    .then(data => {
        addReviewToList(data);
        reviewText.value = "";
        deactivateReviewError();
        showSuccess();
    })
    .catch(error => {
        console.error("Ошибка:", error);
    });
}

function addReviewToList(review) {
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
            <span class="sentiment-badge ${sentimentBadgeClass}">
                ${sentimentText}
            </span>
            ${deleteButton}
        </div>
    `;

    // Вставляем после заголовка h3
    const title = reviewList.querySelector("h3");
    if (title && title.nextSibling) {
        reviewList.insertBefore(reviewItem, title.nextSibling);
    } else {
        reviewList.appendChild(reviewItem);
    }

    // Добавляем обработчик удаления
    if (canDelete) {
        const delBtn = reviewItem.querySelector(".del-btn");
        delBtn.addEventListener("click", deleteReview);
    }
}

function showSuccess() {
    const originalText = applyBtn.textContent;
    applyBtn.textContent = "Отправлено!";
    applyBtn.style.backgroundColor = "#4caf50";

    setTimeout(() => {
        applyBtn.textContent = originalText;
        applyBtn.style.backgroundColor = "";
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

// Enter для отправки (Ctrl+Enter)
reviewText.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "Enter") {
        validateForm();
    }
});
