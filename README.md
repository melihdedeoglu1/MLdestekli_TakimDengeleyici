# Halı Saha Takım Dengeleyici (ML Destekli)

Bu proje, halı saha maçları için oyuncu listesi oluşturmanıza, oyuncuların farklı mevkilerdeki yeteneklerini girmenize ve makine öğrenmesi destekli bir model aracılığıyla genel (overall) puanlarını hesaplayarak bu puanlara göre dengeli takımlar kurmanıza olanak tanıyan bir web uygulamasıdır.

## Temel Özellikler
* *Oyuncu Yönetimi:*
    * Oyuncu ekleme, silme ve güncelleme.
    * Her oyuncu için birden fazla pozisyon (Kaleci, Defans, Orta Saha, Forvet) tanımlayabilme.
* *Makine Öğrenmesi Destekli Overall Puanı:*
    * Kullanıcılar, oyuncuların doğrudan bir "overall" puanını girmek yerine, seçtikleri pozisyona özel alt yeteneklere (örneğin, Defans için "Müdahale", "Markaj"; Forvet için "Bitiricilik", "Şut" vb.) 1-100 arası puan verirler.
    * Dataset: https://www.kaggle.com/datasets/stefanoleone992/fifa-22-complete-player-dataset
    * Bu alt yetenek puanları, Python (FastAPI) backend'inde çalışan ve önceden eğitilmiş makine öğrenmesi modellerine gönderilir.
    * Modeller, girilen alt yeteneklere göre oyuncunun o pozisyondaki "overall" puanını (0-99 aralığında) tahmin eder.
    * Tahmin edilen bu "overall" puanı, frontend'de 1-10 skalasına çevrilerek kullanılır.
* *Dengeli Takım Oluşturma:*
    * En az 8 oyuncu (her takım için 4) gereklidir.
    * Algoritma, oyuncuların modelden gelen "overall" puanlarını ve seçilen mevkilerini dikkate alarak mümkün olan tüm rol atamalarını ve takım bölünmelerini dener.
    * Her iki takımın da geçerli bir kadroya (en az 1 Kaleci, 1 Defans, 1 Orta Saha, 1 Forvet) sahip olmasını zorunlu kılar.
    * Takımlar arasındaki toplam "overall" puan farkını minimize ederek en dengeli eşleşmeyi bulur.
* *Kullanıcı Dostu Arayüz:*
    * Oyuncuları ve oluşturulan takımları net bir şekilde gösterir.
    * Pozisyon seçimi için interaktif bir saha haritası sunar.

## 🛠️ Kullanılan Teknolojiler

* *Frontend:*
    * HTML5
    * CSS3 (Temel stil ve düzenlemeler)
    * JavaScript (Vanilla JS - DOM manipülasyonu, API istekleri, kullanıcı etkileşimi)
* *Backend (Web Sunucusu & Takım Dengeleme Mantığı):*
    * Node.js
    * Express.js (Frontend dosyalarını sunmak ve /takim-olustur endpoint'i için)
* *Backend (Makine Öğrenmesi Model Sunucusu):*
    * Python 3
    * FastAPI (Overall puanı tahmini için API endpoint'leri oluşturma)
    * Uvicorn (ASGI sunucusu)
    * Scikit-learn (Makine öğrenmesi modellerini eğitme ve kullanma)
    * Joblib (Eğitilmiş modelleri kaydetme ve yükleme)
    * Pandas & NumPy (Veri işleme)
* *Veri Seti (Model Eğitimi İçin):*
    *  https://www.kaggle.com/datasets/stefanoleone992/fifa-22-complete-player-dataset


## 🚀 Kurulum ve Çalıştırma

### Ön Gereksinimler

* [Node.js ve npm](https://nodejs.org/) (Frontend ve Express sunucusu için)
* [Python 3.8+](https://www.python.org/downloads/) ve pip (FastAPI backend ve ML modelleri için)

### 1. Backend Kurulumu (FastAPI - Makine Öğrenmesi Modelleri)

1.  Projenin backend_fastapi klasörüne gidin:
    bash
    cd backend_fastapi
    
2.  Gerekli Python kütüphanelerini yükleyin:
    bash
    pip install -r requirements.txt
    # veya py -m pip install -r requirements.txt
    
    (Eğer requirements.txt dosyanız yoksa, temel kütüphaneler: fastapi uvicorn scikit-learn joblib pandas numpy python-multipart)

### 2. Frontend Kurulumu (Node.js - Express Sunucusu)

1.  Projenin frontend_node klasörüne gidin:
    bash
    cd ../frontend_node
    # veya cd /path/to/frontend_node
    
2.  Gerekli Node.js modüllerini yükleyin (Eğer package.json dosyanız varsa):
    bash
    npm install
    
    (Temel bağımlılıklar: express, body-parser)

### 3. Uygulamayı Çalıştırma

*Önce Backend'i (FastAPI) Başlatın:*

1.  backend_fastapi klasöründeyken:
    bash
    uvicorn main:app --reload
    # veya py -m uvicorn main:app --reload
    
    Bu komut, FastAPI sunucusunu genellikle http://127.0.0.1:8000 adresinde başlatacaktır. Terminalde "Uvicorn running on..." mesajını ve modellerin yüklendiğine dair logları görmelisiniz.

*Sonra Frontend'i (Node.js Express) Başlatın:*

1.  frontend_node klasöründeyken:
    bash
    node server.js
    
    Bu komut, Express sunucusunu genellikle http://localhost:3000 adresinde başlatacaktır. Terminalde "Sunucu başarıyla başlatıldı..." mesajını görmelisiniz.

*Uygulamaya Erişin:*

* Web tarayıcınızı açın ve http://localhost:3000 (veya Express sunucunuzun çalıştığı port) adresine gidin.

## ⚙️ Nasıl Çalışıyor?

1.  *Oyuncu Ekleme/Düzenleme:*
    
    https://i.imgur.com/pR9EnxO.png
    * Kullanıcı, index.html arayüzünden oyuncu adı girer.
    * SVG saha haritasından oyuncunun oynayabileceği pozisyonları (Kaleci, Defans, Orta Saha, Forvet) seçer.
    * Seçilen her pozisyon için, o pozisyona özel alt yeteneklere (örneğin Kaleci için Refleksler, Boy; Defans için Müdahale, Hız vb.) 0-100 (veya tanımlı aralıkta) puanlar girer.
2.  *Overall Puanı Tahmini:*
    * "Kaydet" butonuna tıklandığında, index.html'deki JavaScript, seçilen her pozisyon ve o pozisyona ait girilmiş alt yetenek puanlarını alır.
    * Her bir pozisyon için, bu alt yetenek listesi, çalışan FastAPI sunucusundaki (http://localhost:8000) /predict endpoint'ine bir POST isteği ile gönderilir.
    * FastAPI (main.py), isteği alır, ilgili pozisyonun .pkl modelini yükler ve gelen alt yeteneklere göre oyuncunun o pozisyondaki "overall" puanını (0-99 aralığında) tahmin eder.
    * Tahmin edilen "overall" puanı, API cevabı olarak frontend'e geri döner.
3.  *Puanların Saklanması:*
    * Frontend JavaScript, API'den gelen her pozisyon için "overall" puanını alır, 1-10 skalasına çevirir ve oyuncunun verileri arasında saklar (hem ham alt yetenekler hem de hesaplanmış overall'lar).
4.  *Takım Dengeleme:*
    https://i.imgur.com/rCJDBcv.png
    * Kullanıcı "Takımları Oluştur" butonuna tıkladığında, frontend'de saklanan tüm oyuncuların listesi (isimleri, oynayabildikleri mevkiler ve her mevki için hesaplanmış 1-10 arası "overall" puanları) Node.js Express sunucusundaki /takim-olustur endpoint'ine gönderilir.
    * server.js, bu isteği alır ve teamBalancer.js içindeki balanceTeams fonksiyonuna oyuncu verilerini iletir.
    * balanceTeams algoritması:
        * Öncelikle girdi kontrolleri yapar (oyuncu sayısı, her oyuncunun geçerli veriye sahip olması vb.).
        * generateAllRoleAssignments: Her oyuncu için oynayabileceği tüm mevkilerde olası tüm rol atamalarını (o mevkideki overall puanıyla birlikte) üretir.
        * generateAllTeamSplits: Her bir rol atama senaryosu için, oyuncuları iki takıma ayırmanın tüm olası yollarını üretir.
        * isTeamValid: Oluşturulan her bir takımın geçerli olup olmadığını kontrol eder (takım boyutu, her takımda 1 Kaleci, en az 1 Defans, 1 Orta Saha, 1 Forvet olması).
        * Geçerli takım çiftleri arasından, iki takımın toplam "overall" puanları arasındaki farkı en aza indiren kombinasyonu seçer.
    * Sonuç (iki takım listesi, toplam puanları ve fark) frontend'e geri gönderilir ve index.html'de görüntülenir.
