# train_model.py
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.svm import LinearSVC
import re
import pandas as pd
from sklearn.model_selection import train_test_split
import joblib
import kagglehub
import os

def preprocess(text):
    """Препроцессинг текста"""
    removed_html = re.sub(r'<.*?>', '', text)
    removed_url = re.sub(r'https?://\S+|www\.\S+', '', removed_html)
    return removed_url

def train_and_save_model():
    print("Загрузка датасета IMDB...")
    path = kagglehub.dataset_download("lakshmi25npathi/imdb-dataset-of-50k-movie-reviews")
    df = pd.read_csv(f"{path}/IMDB Dataset.csv")
    
    print("Подготовка данных...")
    X = df["review"].apply(preprocess).to_numpy()
    y = df["sentiment"].map({"positive": 1, "negative": 0}).to_numpy()
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("Обучение векторизатора...")
    vectorizer = CountVectorizer(token_pattern=r'\b[a-zA-Z]+\b', max_features=5000)
    X_train_vectorized = vectorizer.fit_transform(X_train)
    
    print("Обучение SVM модели...")
    sk_svm = LinearSVC(C=0.001, random_state=42, max_iter=2000)
    sk_svm.fit(X_train_vectorized, y_train)
    
    # Создаем папку для моделей
    models_dir = os.path.join('myapp', 'ml_models')
    os.makedirs(models_dir, exist_ok=True)
    
    # Сохраняем модель и векторизатор
    model_path = os.path.join(models_dir, 'svm_model.pkl')
    vectorizer_path = os.path.join(models_dir, 'vectorizer.pkl')
    
    joblib.dump(sk_svm, model_path)
    joblib.dump(vectorizer, vectorizer_path)
    
    print(f"✓ Модель сохранена: {model_path}")
    print(f"✓ Векторизатор сохранен: {vectorizer_path}")
    
    # Тестируем модель
    X_test_vectorized = vectorizer.transform(X_test)
    accuracy = sk_svm.score(X_test_vectorized, y_test)
    print(f"✓ Точность модели на тестовой выборке: {accuracy:.4f}")

if __name__ == "__main__":
    train_and_save_model()
