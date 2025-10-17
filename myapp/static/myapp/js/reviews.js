// myapp/static/myapp/js/reviews.js

// Элементы DOM
const reviewText = document.getElementById("review-text");
const applyBtn = document.getElementById("apply-btn");
const reviewError = document.getElementById("review-error");
const reviewList = document.getElementById("firstReviewList");

console.log("Script loaded");
console.log("reviewsUrl:", reviewsUrl);
console.log("deleteUrl:", deleteUrl);
console.log("token:", token);

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
        console.log("Delete response status:", response.status);
        if (!response.ok) {
            throw new Error("Ошибка при удалении отзыва");
        }
        return response.json();
    })
    .then(data => {
        console.log("Delete success:", data);
        const reviewItem = document.querySelector(`[data-review-id="${reviewId}"]`);
        if (reviewItem) {
            reviewItem.style.transition = "opacity 0.3s ease";
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
        console.error("Delete error:", error);
        alert("Не удалось удалить отзыв: " + error.message);
    });
}

// Добавляем обработчики удаления для существующих отзывов
document.querySelectorAll(".del-btn").forEach(button => {
    console.log("Adding delete listener to button:", button);
    button.addEventListener("click", deleteReview);
});

// Валидация и отправка формы
if (applyBtn) {
    applyBtn.addEventListener("click", validateForm);
    console.log("Apply button listener added");
} else {
    console.error("Apply button not found!");
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
    event.preventDefault();
    console.log("Validating form...");
    
    let isValid = true;

    if (!reviewText || !reviewText.value || reviewText.value.trim().length < 10) {
        activateReviewError("Пожалуйста, введите отзыв (минимум 10 символов)");
        isValid = false;
        console.log("Validation failed: too short");
    } else if (reviewText.value.length > 1000) {
        activateReviewError("Отзыв слишком длинный (максимум 1000 символов)");
        isValid = false;
        console.log("Validation failed: too long");
    } else {
        deactivateReviewError();
        console.log("Validation passed");
    }

    if (isValid) {
        sendForm();
    }
}

function responseCheck(response) {
    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);
    
    if (!response.ok) {
        return response.json().then(data => {
            console.log("Error response data:", data);
            activateReviewError(data.errors || "Ошибка при отправке отзыва");
            throw new Error(data.errors || response.statusText);
        });
    }
    return response.json();
}

function sendForm() {
    console.log("Sending form...");
    console.log("Review text:", reviewText.value);
    
    const requestData = {
        review_text: reviewText.value.trim(),
    };
    
    console.log("Request data:", requestData);
    
    fetch(reviewsUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": token,
        },
        body: JSON.stringify(requestData),
    })
    .then(responseCheck)
    .then(data => {
        console.log("Success response:", data);
        addReviewToList(data);
        reviewText.value = "";
        deactivateReviewError();
        showSuccess();
    })
    .catch(error => {
        console.error("Send error:", error);
    });
}

function addReviewToList(review) {
    console.log("Adding review to list:", review);
    
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
    if (title) {
        title.insertAdjacentElement('afterend', reviewItem);
    } else {
        reviewList.appendChild(reviewItem);
    }

    // Добавляем обработчик удаления
    if (canDelete) {
        const delBtn = reviewItem.querySelector(".del-btn");
        if (delBtn) {
            delBtn.addEventListener("click", deleteReview);
            console.log("Delete listener added to new review");
        }
    }
}

function showSuccess() {
    const originalText = applyBtn.textContent;
    const originalColor = applyBtn.style.backgroundColor;
    
    applyBtn.textContent = "Отправлено!";
    applyBtn.style.backgroundColor = "#4caf50";

    setTimeout(() => {
        applyBtn.textContent = originalText;
        applyBtn.style.backgroundColor = originalColor;
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
if (reviewText) {
    reviewText.addEventListener("keydown", function (e) {
        if (e.ctrlKey && e.key === "Enter") {
            validateForm(e);
        }
    });
}

console.log("Script initialization complete");
