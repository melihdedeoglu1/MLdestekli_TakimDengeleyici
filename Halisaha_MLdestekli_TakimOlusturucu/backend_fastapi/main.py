from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware # CORS için eklendi
from pydantic import BaseModel
import joblib
import numpy as np
import os
import pandas as pd # İsteğe bağlı: Özellik isimleriyle tahmin için

app = FastAPI()

# --- CORS Ayarları Başlangıç ---
# Frontend'inizin (index.html'i çalıştıran Node.js sunucusu)
# çalıştığı adresi/portu buraya ekleyin.
# Genellikle geliştirme sırasında http://localhost:3000 veya benzeri bir adres olur.
# Tarayıcıdan direkt dosya olarak açıyorsanız (file://...) CORS genellikle sorun olmaz
# ama sunucu üzerinden sunuyorsanız (Node.js gibi) gereklidir.
origins = [
    "http://localhost",         # Tarayıcıdan direkt dosya açma durumu için (pek olası değil ama eklenebilir)
    "http://localhost:3000",    # Node.js/Express sunucunuzun varsayılan portu
    "null",                     # Bazen tarayıcıdan direkt açılan dosyalar için origin 'null' olabilir
    # Frontend'inizi farklı bir portta çalıştırıyorsanız onu da ekleyin
    # Örn: "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Belirli kaynaklara izin ver
    allow_credentials=True, # Cookie gibi bilgilerin paylaşımına izin ver (bu projede gerekmeyebilir)
    allow_methods=["*"],    # Tüm HTTP metodlarına izin ver (GET, POST vb.)
    allow_headers=["*"],    # Tüm başlıklara izin ver
)
# --- CORS Ayarları Bitiş ---


# Modellerin bulunduğu klasör
# __file__ bu dosyanın (main.py) bulunduğu yolu verir.
# MODEL_DIR, main.py'nin olduğu dizindeki 'models' klasörünü işaret eder.
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

# Her modelin beklediği özellik isimleri ve sırası (Notebook'tan)
# Bu, özellik sayısı kontrolü ve isteğe bağlı olarak uyarıyı engellemek için kullanılabilir.
model_feature_names = {
    "GK": ['goalkeeping_reflexes', 'goalkeeping_handling', 'goalkeeping_diving', 'goalkeeping_kicking', 'goalkeeping_positioning', 'height_cm'],
    "DEF": ['defending_standing_tackle', 'defending_marking_awareness', 'power_strength', 'pace', 'attacking_heading_accuracy'],
    "MID": ['shooting', 'passing', 'dribbling', 'mentality_vision', 'work_rate_score'],
    "ST": ['attacking_finishing', 'power_strength', 'mentality_positioning', 'attacking_heading_accuracy', 'shooting']
}

# Modelleri yükle
models = {}
model_files = {
    "GK": "gk_model.pkl",
    "DEF": "def_model.pkl",   
    "MID": "mid_model.pkl",
    "ST": "st_model.pkl",
}

print("Modeller yükleniyor...")
for pos_code, filename in model_files.items():
    model_path = os.path.join(MODEL_DIR, filename)
    if os.path.exists(model_path):
        try:
            models[pos_code] = joblib.load(model_path)
            print(f"✅ {pos_code} modeli başarıyla yüklendi: {model_path}")
        except Exception as e:
            print(f"❌ HATA: {pos_code} modeli yüklenemedi ({model_path}): {e}")
    else:
        print(f"⚠️ UYARI: Model dosyası bulunamadı: {model_path}. Bu pozisyon için tahmin yapılamayacak.")
print("-" * 30)

class PredictionRequest(BaseModel):
    position: str  # GK, DEF, MID, ST (Frontend'den gelen model_pos_code)
    features: list[float]  # Pozisyona özel sıralı özellik değerleri

@app.get("/")
def home():
    return {"message": "Halı Saha Oyuncu Overall Tahmin API"}

@app.post("/predict")
def predict(request: PredictionRequest):
    pos = request.position.upper()
    
    if pos not in models:
        # Model yüklenmemişse (dosya bulunamamışsa veya yükleme hatası olmuşsa)
        # veya desteklenmeyen bir pozisyon kodu gönderilmişse
        raise HTTPException(status_code=400, detail=f"'{pos}' pozisyonu için model bulunamadı veya desteklenmiyor.")
    
    model = models[pos]
    
    # Özellik sayısı kontrolü (çok önemli!)
    expected_feature_list = model_feature_names.get(pos)
    if not expected_feature_list:
         raise HTTPException(status_code=500, detail=f"'{pos}' pozisyonu için sunucuda özellik tanımı bulunamadı.")

    expected_count = len(expected_feature_list)
    if len(request.features) != expected_count:
        raise HTTPException(
            status_code=422, # Unprocessable Entity (Veri formatı doğru ama anlamsal olarak işlenemiyor)
            detail=f"'{pos}' pozisyonu için {expected_count} özellik bekleniyordu, ancak {len(request.features)} özellik gönderildi."
        )

    try:
        # Gelen özellikleri NumPy array'ine çevir
        X_np = np.array(request.features).reshape(1, -1)
        
        # İsteğe Bağlı: Scikit-learn uyarısını ("X does not have valid feature names...") engellemek için:
        # Özellik isimleriyle bir Pandas DataFrame oluşturup modele onu verebilirsiniz.
        # Bu, modelin eğitildiği zamanki isimlerle eşleşmelidir.
        # X_df = pd.DataFrame(X_np, columns=expected_feature_list)
        # y_pred = model.predict(X_df)
        
        # Şimdilik NumPy array ile devam edelim (uyarı konsolda görünebilir, sorun değil):
        y_pred = model.predict(X_np)
        
        predicted_overall = float(y_pred[0])
        print(f"Tahmin ({pos}): {request.features} -> {predicted_overall:.2f}") # Sunucu logu
        
        return {"position": pos, "predicted_overall": predicted_overall}
    except Exception as e:
        print(f"❌ Tahmin sırasında hata ({pos}): {e}") # Sunucu loguna yazdır
        # Kullanıcıya daha genel bir hata mesajı göster
        raise HTTPException(status_code=500, detail=f"'{pos}' pozisyonu için tahmin yapılırken sunucuda bir iç hata oluştu.")