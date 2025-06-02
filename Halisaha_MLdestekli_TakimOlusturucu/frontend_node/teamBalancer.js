// teamBalancer.js

// Bu algoritma için makul üst sınır. Daha fazlası çok uzun sürebilir.
const MAX_PLAYERS_FOR_EXHAUSTIVE_SEARCH = 12;

/**
 * Oyuncuları iki dengeli takıma ayırır.
 * @param {Array<Object>} players - Oyuncu objeleri dizisi.
 * Her oyuncu objesi: { isim: String, mevkiler: Array<String>, overalls: Object }
 * overalls objesi: { "MevkiAdı": puan (sayı), ... }
 */
function balanceTeams(players) {
  console.log("[TB] balanceTeams fonksiyonu çağrıldı.");
  console.log("[TB] Gelen oyuncu sayısı:", players ? players.length : 0);

  // --- Girdi Kontrolleri Başlangıç ---
  if (!players || !Array.isArray(players) || players.length === 0) {
    console.error("[TB] Hata: Oyuncu listesi boş veya geçersiz.");
    return { hata: "Oyuncu listesi boş veya geçersiz." };
  }

  if (players.length > MAX_PLAYERS_FOR_EXHAUSTIVE_SEARCH) {
    console.warn(`[TB] Uyarı: Oyuncu sayısı (${players.length}) önerilen maksimum (${MAX_PLAYERS_FOR_EXHAUSTIVE_SEARCH}) değerini aşıyor.`);
    return {
      hata: `Oyuncu sayısı (${players.length}) çok fazla. Bu detaylı dengeleme algoritması, en fazla ${MAX_PLAYERS_FOR_EXHAUSTIVE_SEARCH} oyuncu için tasarlanmıştır. Daha fazla oyuncu için farklı, daha hızlı bir dengeleme stratejisi gereklidir.`,
    };
  }

  if (players.length % 2 !== 0) {
    console.error("[TB] Hata: Oyuncu sayısı çift olmalıdır.");
    return { hata: "Takım dengelemesi için oyuncu sayısı çift olmalıdır." };
  }

  const teamSize = players.length / 2;
  // isTeamValid fonksiyonu her takımda Kaleci, Defans, Orta Saha, Forvet olmasını şart koşar.
  // Bu da her takımda en az 4 oyuncu olması gerektiği anlamına gelir.
  if (teamSize < 4) {
    console.error("[TB] Hata: Takım boyutu çok küçük.");
    return {
      hata: `Her takımda en az 4 farklı zorunlu mevki (Kaleci, Defans, Orta Saha, Forvet) olmalıdır. Mevcut oyuncu sayısı (${players.length}) iki geçerli takım oluşturmak için yetersizdir. En az 8 oyuncu gereklidir.`,
    };
  }

  // Her oyuncunun verisinin geçerliliğini kontrol et
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    if (!player.isim || typeof player.isim !== 'string' || player.isim.trim() === "") {
      console.error(`[TB] Hata: Oyuncu ${i} için geçersiz isim.`);
      return { hata: `Oyuncu (index: ${i}) için geçersiz veya eksik oyuncu ismi bulundu.` };
    }
    if (!player.mevkiler || !Array.isArray(player.mevkiler) || player.mevkiler.length === 0) {
      console.error(`[TB] Hata: Oyuncu '${player.isim}' için mevkiler eksik.`);
      return { hata: `Oyuncu '${player.isim}' için oynayabileceği mevkiler belirtilmemiş.` };
    }
    if (!player.overalls || typeof player.overalls !== 'object' || player.overalls === null) {
      console.error(`[TB] Hata: Oyuncu '${player.isim}' için overalls objesi eksik.`);
      return { hata: `Oyuncu '${player.isim}' için puan bilgileri (overalls) eksik veya geçersiz formatta.` };
    }
    for (const mevki of player.mevkiler) {
      const puan = player.overalls[mevki];
      if (puan === undefined) {
        console.error(`[TB] Hata: Oyuncu '${player.isim}', '${mevki}' mevkisi için 'overalls' objesinde puana sahip değil.`);
        return { hata: `Oyuncu '${player.isim}' için '${mevki}' mevki puanı 'overalls' içinde tanımlanmamış.` };
      }
      if (typeof puan !== 'number' || isNaN(puan)) {
        console.error(`[TB] Hata: Oyuncu '${player.isim}', '${mevki}' için geçersiz puan tipi (puan: ${puan}, tip: ${typeof puan}).`);
        return { hata: `Oyuncu '${player.isim}' için '${mevki}' mevki puanı eksik veya sayısal bir değer değil.` };
      }
      if (puan < 1 || puan > 10) {
        console.error(`[TB] Hata: Oyuncu '${player.isim}', '${mevki}' için puan aralık dışı (puan: ${puan}).`);
        return { hata: `Oyuncu '${player.isim}' için '${mevki}' mevki puanı (1-10 aralığında olmalıdır) geçersiz: ${puan}.` };
      }
    }
  }
  console.log("[TB] Tüm oyuncu verileri başlangıç kontrollerini geçti.");
  // --- Girdi Kontrolleri Bitiş ---

  const startTime = Date.now();
  const allPossibleRoleAssignments = generateAllRoleAssignments(players);
  console.log(`[TB] Oluşturulan toplam rol atama permütasyonu sayısı: ${allPossibleRoleAssignments.length} (Süre: ${Date.now() - startTime}ms)`);

  if (allPossibleRoleAssignments.length === 0) {
    console.warn("[TB] Uyarı: Hiçbir uygun rol atama kombinasyonu üretilemedi. Oyuncuların 'mevkiler' listesi veya 'overalls' objesi boş olabilir veya puanlar geçersiz olabilir.");
    return { hata: "Oyunculara uygun rol ataması yapılamadı. Her oyuncunun en az bir geçerli mevkisi ve bu mevkiye atanmış bir puanı olduğundan emin olun." };
  }

  let bestResult = null;
  let minFark = Infinity;
  let checkedTeamSplitsCount = 0;
  let validTeamPairFound = false; // Geçerli bir takım çifti bulundu mu?

  const teamSplitStartTime = Date.now();
  for (const assignment of allPossibleRoleAssignments) {
    const teamSplits = generateAllTeamSplits(assignment);
    for (const [team1, team2] of teamSplits) {
      checkedTeamSplitsCount++;
      // console.log(`[TB] Takım bölünmesi deneniyor. Takım1: ${team1.map(p=>p.isim)}-${team1.map(p=>p.mevki)}, Takım2: ${team2.map(p=>p.isim)}-${team2.map(p=>p.mevki)}`);
      
      const isTeam1Valid = isTeamValid(team1, teamSize, "Takım 1");
      const isTeam2Valid = isTeamValid(team2, teamSize, "Takım 2");

      if (isTeam1Valid && isTeam2Valid) {
        validTeamPairFound = true; // En az bir geçerli çift bulundu
        const puan1 = team1.reduce((acc, p) => acc + p.puan, 0);
        const puan2 = team2.reduce((acc, p) => acc + p.puan, 0);
        const fark = Math.abs(puan1 - puan2);

        if (fark < minFark) {
          minFark = fark;
          bestResult = {
            team1: team1.map(p => ({ isim: p.isim, mevki: p.mevki, puan: p.puan })),
            team2: team2.map(p => ({ isim: p.isim, mevki: p.mevki, puan: p.puan })),
            toplamPuan1: puan1,
            toplamPuan2: puan2,
            fark: fark,
          };
        }
      }
    }
  }
  console.log(`[TB] Kontrol edilen toplam takım bölünme sayısı: ${checkedTeamSplitsCount} (Takım bölme süresi: ${Date.now() - teamSplitStartTime}ms)`);
  console.log(`[TB] Toplam dengeleme süresi: ${Date.now() - startTime}ms`);

  if (!validTeamPairFound) {
      console.warn("[TB] Uyarı: Hiçbir denemede her iki takımın da aynı anda geçerli olduğu bir durum bulunamadı.");
  }

  if (!bestResult) {
    console.error("[TB] Hata: Sonuçta 'bestResult' null kaldı. Uygun takım bulunamadı.");
    return { hata: "Uygun takım kombinasyonu bulunamadı. Olası Nedenler: Belirtilen oyuncularla her iki takım için de geçerli (Kaleci, Defans, Orta Saha, Forvet içeren) kadrolar oluşturulamıyor veya oyuncu sayısı/mevki dağılımı bu kriterleri karşılamak için yetersiz." };
  }
  console.log("[TB] En iyi takım kombinasyonu bulundu:", bestResult);
  return bestResult;
}

/**
 * Her oyuncu için olası tüm rol atamalarını (mevki ve puan) üretir.
 */
function generateAllRoleAssignments(players) {
  const assignments = [];
  function backtrack(playerIndex, currentAssignment) {
    if (playerIndex === players.length) {
      assignments.push([...currentAssignment]); // Mevcut atama setinin bir kopyasını sakla
      return;
    }

    const player = players[playerIndex];
    let playerHasValidRoleInThisPath = false;
    for (const mevki of player.mevkiler) {
      const puan = player.overalls[mevki]; // Girdi kontrolünde puanın geçerli olduğu teyit edildi.
      
      // Bu kontrol burada gereksiz çünkü balanceTeams'de yapıldı, ama ek güvence
      if (typeof puan === 'number' && !isNaN(puan)) {
        currentAssignment.push({ isim: player.isim, mevki, puan });
        playerHasValidRoleInThisPath = true;
        backtrack(playerIndex + 1, currentAssignment);
        currentAssignment.pop(); // Geri al (backtrack)
      } else {
        // Bu durumun oluşmaması gerekir eğer balanceTeams'deki kontroller doğruysa.
        // console.warn(`[TB-RoleAssignment] Oyuncu ${player.isim}, mevki ${mevki} için geçersiz puan (${puan}) atlandı.`);
      }
    }
    // Eğer oyuncu için hiçbir geçerli mevki/puan bulunamazsa, o dalda tam bir atama oluşmaz.
    // Bu, oyuncunun mevkiler listesi boşsa veya hiçbir mevkisi için geçerli puanı yoksa olabilir.
    // Ana `balanceTeams` fonksiyonundaki kontroller bunu en başta yakalamalı.
  }
  backtrack(0, []);
  return assignments;
}

/**
 * Verilen oyuncu listesini (rolleri atanmış) iki takıma ayırmanın tüm olası yollarını üretir.
 */
function generateAllTeamSplits(assignedPlayers) {
  const n = assignedPlayers.length;
  const half = n / 2;
  const results = [];

  function backtrack(index, team1, team2) {
    if (team1.length > half || team2.length > half) {
      return; // Bir takım zaten dolduysa veya taştıysa bu dalı buda
    }
    if (index === n) { // Tüm oyuncular atandıysa
      if (team1.length === half && team2.length === half) {
        results.push([team1.slice(), team2.slice()]); // Takımların kopyalarını sakla
      }
      return;
    }

    const currentPlayer = assignedPlayers[index];

    // Oyuncuyu 1. takıma eklemeyi dene
    team1.push(currentPlayer);
    backtrack(index + 1, team1, team2);
    team1.pop(); // Geri al

    // Oyuncuyu 2. takıma eklemeyi dene
    team2.push(currentPlayer);
    backtrack(index + 1, team1, team2);
    team2.pop(); // Geri al
  }

  backtrack(0, [], []);
  return results;
}

/**
 * Bir takımın geçerli olup olmadığını kontrol eder.
 * Geçerli takım: Belirlenen boyutta, tam olarak 1 Kaleci ve en az 1 Defans, 1 Orta Saha, 1 Forvet içerir.
 */
function isTeamValid(team, expectedTeamSize, teamLabelForLogging = "Takım") {
  // console.log(`[TB-isTeamValid] ${teamLabelForLogging} kontrol ediliyor. Oyuncular: ${team.map(p=>p.isim)}-${team.map(p=>p.mevki)}`);

  if (team.length !== expectedTeamSize) {
    // console.warn(`[TB-isTeamValid] ${teamLabelForLogging} - Hata: Takım boyutu (${team.length}) beklenen (${expectedTeamSize}) ile eşleşmiyor.`);
    return false;
  }

  const mevkiler = team.map(p => p.mevki);

  const kaleciSayisi = mevkiler.filter(m => m === "Kaleci").length;
  if (kaleciSayisi !== 1) {
    // console.warn(`[TB-isTeamValid] ${teamLabelForLogging} - Hata: Kaleci sayısı (${kaleciSayisi}) 1 olmalı.`);
    return false;
  }

  const requiredCorePositions = ["Defans", "OrtaSaha", "Forvet"]; // "Orta Saha" yerine "OrtaSaha" olmalı (frontend ile tutarlı)
  for (const corePos of requiredCorePositions) {
    if (!mevkiler.includes(corePos)) {
      // console.warn(`[TB-isTeamValid] ${teamLabelForLogging} - Hata: Zorunlu mevki '${corePos}' bulunamadı. Mevcut mevkiler: ${mevkiler.join(', ')}`);
      return false;
    }
  }
  
  // Takım içinde aynı oyuncunun birden fazla kez yer almadığından emin ol.
  // Bu, generateAllTeamSplits doğru çalışıyorsa zaten sağlanır, ama ek bir kontrol.
  const uniquePlayerNamesInTeam = new Set(team.map(p => p.isim));
  if (uniquePlayerNamesInTeam.size !== team.length) {
    // console.warn(`[TB-isTeamValid] ${teamLabelForLogging} - Hata: Takım içinde tekrar eden oyuncu isimleri var.`);
    return false;
  }

  // console.log(`[TB-isTeamValid] ${teamLabelForLogging} geçerli.`);
  return true;
}

module.exports = { balanceTeams };
