const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { balanceTeams } = require("./teamBalancer"); // teamBalancer.js dosyasından fonksiyonu al

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware'ler
app.use(bodyParser.json()); // Gelen JSON request body'lerini parse etmek için
app.use(express.static(path.join(__dirname, "public"))); // Frontend dosyalarını (index.html vb.) sunmak için

// Ana endpoint: Takımları oluşturmak için POST isteği
app.post("/takim-olustur", (req, res) => {
  console.log("[SERVER] POST /takim-olustur endpoint'ine istek geldi ✅");

  const oyuncular = req.body.oyuncular;

  // Gelen oyuncu verisini detaylı logla (özellikle geliştirme aşamasında)
  // Eğer oyuncu sayısı çok fazlaysa bu logu kısaltmak gerekebilir.
  // Şimdilik tamamını loglayalım.
  console.log("[SERVER] Gelen oyuncu verisi:", JSON.stringify(oyuncular, null, 2));

  if (!oyuncular || !Array.isArray(oyuncular)) {
    console.error("[SERVER] Hata: Geçersiz oyuncu verisi alındı.");
    return res.status(400).json({ hata: "Geçersiz oyuncu verisi formatı." });
  }

  // teamBalancer fonksiyonunu çağırarak takımları dengele
  const sonuc = balanceTeams(oyuncular);

  console.log("[SERVER] Dengeleme sonucu:", JSON.stringify(sonuc, null, 2));

  // Sonucu JSON olarak frontend'e gönder
  res.json(sonuc);
});

// Sunucuyu belirtilen portta dinlemeye başla
app.listen(PORT, () => {
  console.log(`[SERVER] Sunucu başarıyla başlatıldı ve http://localhost:${PORT} adresinde çalışıyor.`);
});