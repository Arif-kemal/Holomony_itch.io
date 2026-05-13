// ============================================================
//  oyun.js — Holonomy Küp Yüzey Bulmacası
//  Ana oyun döngüsü: fizik, top, render, oda geçişleri
//  Bağımlılık: harita.js önce yüklenmiş olmalı
// ============================================================

// ─── Canvas ve 2D bağlam ───
let gecisKilidi = false;
const kanvas  = document.getElementById("oyunCanvas");
const ctx     = kanvas.getContext("2d");

// ============================================================
//  SABITLER
// ============================================================
const HUCRE_BOY       = 28;      // her grid hücresinin piksel boyutu
const YERÇEKIMI       = 0.55;    // kare başına hız artışı (piksel/kare²)
const MAX_DÜŞÜŞ_HIZI  = 14;      // aşağı düşüş hız sınırı
const HAREKET_HIZI    = 3.8;     // yatay hareket hızı (piksel/kare)
const ZIPLAMA_GUCU    = -11.5;   // negatif = yukarı (piksel/kare)
const SÜRTÜNME        = 0.82;    // yerde durduğunda yatay hız katsayısı
const HAVA_SÜRTÜNMESI = 0.92;    // havadayken yatay hız katsayısı

// Topun normal yarıçapı (piksel)
const TOP_YARIÇAP     = 14;

// Squish (ezilme) animasyon katsayıları
const SQUISH_ÇARPAN   = 0.45;    // ne kadar ezilir (0=hiç, 1=tam)
const SQUISH_GERİ     = 0.18;    // geri yaylanma hızı

// Renk paleti (CSS değişkenleriyle uyumlu)
const RENKLER = {
  arkaplan:   "#0a0a14",
  duvarKenar: "#5a5a9a",
  portal:     "#ff4466",
  portalPark: "rgba(255,68,102,0.18)",
  top:        "#f5e642",
  topParıltı: "#fff9a0",
  topGölge:   "#c4a800",
  grid:       "rgba(255,255,255,0.03)",

  // Oda renk grupları — duvar dolgusu ve kenar vurgusu
  odaRenkleri: {
    // Kırmızı grup: oda 1, 7(1b), 13(1c)
    1:  { duvar: "#6b2d2d", kenar: "#a04040" },
    7:  { duvar: "#6b2d2d", kenar: "#a04040" },
    13: { duvar: "#6b2d2d", kenar: "#a04040" },
    // Mavi grup: oda 2, 12(6b), 19(7c), 17(5c)
    2:  { duvar: "#2d3f6b", kenar: "#4060a0" },
    12: { duvar: "#2d3f6b", kenar: "#4060a0" },
    19: { duvar: "#2d3f6b", kenar: "#4060a0" },
    17: { duvar: "#2d3f6b", kenar: "#4060a0" },
    // Yeşil grup: oda 3, 11(5b), 14(2c)
    3:  { duvar: "#2d5c35", kenar: "#3d8a48" },
    11: { duvar: "#2d5c35", kenar: "#3d8a48" },
    14: { duvar: "#2d5c35", kenar: "#3d8a48" },
    // Sarı grup: oda 4, 10(4b), 15(3c)
    4:  { duvar: "#5c4f1a", kenar: "#8a7528" },
    10: { duvar: "#5c4f1a", kenar: "#8a7528" },
    15: { duvar: "#5c4f1a", kenar: "#8a7528" },
    // Mor grup: oda 5, 9(3b), 16(4c)
    5:  { duvar: "#3d2d6b", kenar: "#5a40a0" },
    9:  { duvar: "#3d2d6b", kenar: "#5a40a0" },
    16: { duvar: "#3d2d6b", kenar: "#5a40a0" },
    // Turuncu grup: oda 6, 8(2b), 18(6c)
    6:  { duvar: "#6b3d1a", kenar: "#a05828" },
    8:  { duvar: "#6b3d1a", kenar: "#a05828" },
    18: { duvar: "#6b3d1a", kenar: "#a05828" },
  },
};

// ============================================================
//  OYUN DURUMU
// ============================================================

// Mevcut oda ve harita dönüşü
let mevcutOda    = 1;     // 1-6 arası aktif oda
let haritaDönüş  = 0;     // mevcut haritanın ekstra dönüş açısı (0/90/180/270)
                           // (sağ-sol geçişlerde 0 kalır, portalda değişir)

// Döndürülmüş matris — her oda geçişinde hesaplanır
let aktifMatris  = matrisDondur(odaMatrisiAl(mevcutOda), haritaDönüş);

// Aktif matrisin satır/sütun sayısı (dönüşten sonra değişebilir)
let matrisSatir  = aktifMatris.length;
let matrisSutun  = aktifMatris[0].length;

// ─── Top nesnesi ───
const topumuz = {
  x:          0,           // piksel pozisyonu (merkez)
  y:          0,
  hizX:       0,           // yatay hız
  hizY:       0,           // dikey hız (+ = aşağı)
  yariçap:    TOP_YARIÇAP,
  yerde:      false,       // zeminde mi?
  squishY:    1.0,         // dikey ölçek (1=normal, <1=ezilmiş)
  squishX:    1.0,         // yatay ölçek
  atlama:     0,           // toplam atlama sayacı (HUD için)
};

// ─── Klavye durumu ───
const tuşlar = {
  sol:   false,
  sağ:   false,
  zıpla: false,
};

// Zıplama önce bir kez tetiklenmeli, sürekli basılı kalınca tekrar zıplamasın
let zıplamaBasıldı = false;

// ─── Ses nesneleri ───
const sesMüzik  = document.getElementById("ses-muzik");
const sesGeçiş  = document.getElementById("ses-gecis");
const sesHedef  = document.getElementById("ses-hedef");

// ─── Oyun aktif mi? ───
let oyunAktif = false;

// ─── Geçiş animasyonu durumu ───
const geçişAnim = {
  aktif:      false,
  süre:       20,
  sayaç:      0,
  yön:        "sağ",
  eskiMatris: null,   // önceki odanın matrisi
  eskiOda:    1,      // önceki oda numarası
};

// ─── requestAnimationFrame handle'ı ───
let animasyonId = null;

// ============================================================
//  BAŞLANGIÇ — DOM hazır olduğunda çalışır
// ============================================================
window.addEventListener("load", () => {
  // Canvas boyutunu ilk aktif matrise göre ayarla
  kanvasYenidenBoyutla();

  // Topu başlangıç pozisyonuna yerleştir
  topuSıfırla();

  // İlk kareyi çiz (dondurulmuş ekran)
  çiz();

  // Yükleniyor ekranını gizle
  const yükleniyor = document.getElementById("yukleniyor");
  yükleniyor.classList.add("gizli");

  // Başla butonuna tıklanınca oyunu devreye al
  document.getElementById("basla-btn").addEventListener("click", oyunuBaşlat);
});

// ============================================================
//  CANVAS YENİDEN BOYUTLANDIRMA
//  Aktif matris döndükten sonra satır/sütun sayısı değişebilir.
//  Canvas'ı buna göre güncelle.
// ============================================================
function kanvasYenidenBoyutla() {
  matrisSatir = aktifMatris.length;
  matrisSutun = aktifMatris[0].length;
  kanvas.width  = matrisSutun * HUCRE_BOY;
  kanvas.height = matrisSatir * HUCRE_BOY;
}

// ============================================================
//  OYUNU BAŞLAT
// ============================================================
function oyunuBaşlat() {
  // Overlay'i gizle
  document.getElementById("baslangic-overlay").classList.add("gizli");

  // Müziği başlat (tarayıcı ses politikası: tıklama sonrası çalışır)
  sesMüzik.volume = 0.4;
  sesMüzik.play().catch(() => { /* kullanıcı ses izni vermediyse sessiz devam */ });

  oyunAktif = true;

  // Oyun döngüsünü başlat
  animasyonId = requestAnimationFrame(döngü);
}

// ============================================================
//  KLAVYE DİNLEYİCİLERİ
// ============================================================
document.addEventListener("keydown", (e) => {
  switch (e.code) {
    case "ArrowLeft":  case "KeyA": tuşlar.sol   = true;  break;
    case "ArrowRight": case "KeyD": tuşlar.sağ   = true;  break;
    case "ArrowUp": case "KeyW": case "Space":
      tuşlar.zıpla = true;
      // Boşluk çubuğunun sayfayı kaydırmasını engelle
      e.preventDefault();
      break;
  }
});

document.addEventListener("keyup", (e) => {
  switch (e.code) {
    case "ArrowLeft":  case "KeyA": tuşlar.sol   = false; break;
    case "ArrowRight": case "KeyD": tuşlar.sağ   = false; break;
    case "ArrowUp": case "KeyW": case "Space":
      tuşlar.zıpla    = false;
      zıplamaBasıldı  = false;  // tuş bırakılınca bir sonraki basışa izin ver
      break;
  }
});

// ============================================================
//  ANA OYUN DÖNGÜSÜ
// ============================================================
function döngü() {
  if (!oyunAktif) return;

  güncelle();   // fizik ve mantık
  çiz();        // render

  animasyonId = requestAnimationFrame(döngü);
}

// ============================================================
//  GÜNCELLE — Her karede çağrılır (fizik + mantık)
// ============================================================
function güncelle() {
  // Geçiş animasyonu sırasında oyuncu kontrolü dondur
  if (geçişAnim.aktif) {
    geçişAnim.sayaç++;
    if (geçişAnim.sayaç >= geçişAnim.süre) {
      geçişAnim.aktif  = false;
      geçişAnim.sayaç  = 0;
    }
    return; // fizik güncellemesi yapılmaz
  }

  // ─── Yatay hareket ───
  if (tuşlar.sol)  topumuz.hizX -= HAREKET_HIZI * 0.4;
  if (tuşlar.sağ) topumuz.hizX += HAREKET_HIZI * 0.4;

  // Hız sınırı
  topumuz.hizX = Math.max(-HAREKET_HIZI, Math.min(HAREKET_HIZI, topumuz.hizX));

  // Sürtünme uygula
  const sürtünme = topumuz.yerde ? SÜRTÜNME : HAVA_SÜRTÜNMESI;
  if (!tuşlar.sol && !tuşlar.sağ) {
    topumuz.hizX *= sürtünme;
    // Çok küçük hızları sıfırla (titreme önleme)
    if (Math.abs(topumuz.hizX) < 0.05) topumuz.hizX = 0;
  }

  // ─── Zıplama ───
  if (tuşlar.zıpla && topumuz.yerde && !zıplamaBasıldı) {
    topumuz.hizY       = ZIPLAMA_GUCU;
    topumuz.yerde      = false;
    zıplamaBasıldı = true;
    topumuz.atlama++;
    // Squish: zıplayınca yatay genişle
    topumuz.squishX = 1.3;
    topumuz.squishY = 0.7;
    // HUD güncelle
    document.getElementById("hud-atlama").textContent = topumuz.atlama;
  }

  // ─── Yerçekimi ───
  topumuz.hizY += YERÇEKIMI;
  topumuz.hizY  = Math.min(topumuz.hizY, MAX_DÜŞÜŞ_HIZI);

  // ─── Squish animasyonunu normalize et ───
  topumuz.squishX += (1.0 - topumuz.squishX) * SQUISH_GERİ;
  topumuz.squishY += (1.0 - topumuz.squishY) * SQUISH_GERİ;
  // Aşırı salınımı kes
  if (Math.abs(topumuz.squishX - 1.0) < 0.01) topumuz.squishX = 1.0;
  if (Math.abs(topumuz.squishY - 1.0) < 0.01) topumuz.squishY = 1.0;

  // ─── Hareket ve Çarpışma ───
  // Önce yatay, sonra dikey eksende ayrı ayrı çözümlenir.
  // Bu yöntem "süpürme" hatasını en aza indirir.
  hareketVeÇarpışma();

  // ─── Kenar geçiş kontrolü ───
  kenarGeçişKontrol();
  const blok = pikseldenBlokAl(topumuz.x, topumuz.y);
if (blok) {
  const deger = aktifMatris[blok.satır][blok.sütun];

  // Çıkış
  if (deger === HUCRE.CIKIS) {
    if (oyunAktif) {
      oyunAktif = false;
      sesÇal(sesHedef);
      setTimeout(() => {
        alert("TEBRİKLER HOCAM! PARKURU TAMAMLADIN!");
        location.reload();
      }, 500);
    }
  }

  // 5 → oda1b'ye geçiş tetikleyicisi
  if (deger === HUCRE.GECIS5 && !gecisKilidi) {
  gecisKilidi = true;
  döngüselGeçişYap(7, 0, mevcutOda === 1 ? "sol" : "sağ");
  topumuz.yerde = false;
  geçişAnim.aktif = false;
  geçişAnim.sayaç = 0;
  setTimeout(() => { gecisKilidi = false; }, 500);
}
// 9 → oda1c spawn noktası (sağ alt)
// güncelle() fonksiyonunun dışında, üst kısımda tanımla:
/*if (deger === 9 && !gecisKilidi) {
  gecisKilidi = true;
  sesÇal(sesGeçiş);
  mevcutOda   = 13;
  haritaDönüş = 0;
  aktifMatris = matrisDondur(odaMatrisiAl(13), 0);
  kanvasYenidenBoyutla();
  topumuz.x    = 22 * HUCRE_BOY + HUCRE_BOY / 2;
  topumuz.y    = 22 * HUCRE_BOY + HUCRE_BOY / 2;
  topumuz.hizX = 0;
  topumuz.hizY = 0;
  topumuz.yerde = false;
  geçişAnim.aktif = false;
  geçişAnim.sayaç = 0;
  hudGüncelle();
  setTimeout(() => { gecisKilidi = false; }, 500);
}*/// bu kodu yazan adam kör oldu
  // 6 → oda1b spawn noktası (sadece görsel, geçiş yok)
  // spawn portallar üzerinden zaten geliyor

  // 8 → başa döndür (oda4b'deki tuzak)
  if (deger === HUCRE.GECIS8 && !gecisKilidi) {
  gecisKilidi = true;
  sesÇal(sesGeçiş);
  mevcutOda   = 7;
  haritaDönüş = 0;
  aktifMatris = matrisDondur(odaMatrisiAl(7), 0);
  kanvasYenidenBoyutla();
  topumuz.x    = 22 * HUCRE_BOY + HUCRE_BOY / 2;
  topumuz.y    = 2  * HUCRE_BOY + HUCRE_BOY / 2;
  topumuz.hizX = 0;
  topumuz.hizY = 0;
  topumuz.yerde = false;
  geçişAnim.aktif = false;
  geçişAnim.sayaç = 0;
  hudGüncelle();
  setTimeout(() => { gecisKilidi = false; }, 500);
}

  // 11 → oda1c spawn noktası
  if (deger === HUCRE.GECIS11 && !gecisKilidi) {
  gecisKilidi = true;
  sesÇal(sesGeçiş);
  mevcutOda   = 13;
  haritaDönüş = 0;
  aktifMatris = matrisDondur(odaMatrisiAl(13), 0);
  kanvasYenidenBoyutla();
  topumuz.x    = 22 * HUCRE_BOY + HUCRE_BOY / 2;
  topumuz.y    = 22 * HUCRE_BOY + HUCRE_BOY / 2;
  topumuz.hizX = 0;
  topumuz.hizY = 0;
  topumuz.yerde = false;
  geçişAnim.aktif = false;
  geçişAnim.sayaç = 0;
  hudGüncelle();
  setTimeout(() => { gecisKilidi = false; }, 500);
}
}
}

// ============================================================
//  HAREKET VE ÇARPIŞMA
//  AABB (Axis-Aligned Bounding Box) tabanlı,
//  önce X sonra Y ekseninde ayrı ayrı çözülür.
// ============================================================
function hareketVeÇarpışma() {
  const r = topumuz.yariçap;

  // ── Yatay hareket ──
  topumuz.x += topumuz.hizX;

  // Yatay çarpışma: topun sol ve sağ taraflarını kontrol et
  if (topumuz.hizX !== 0) {
    const çarpışma = yatayÇarpışmaVar(topumuz.x, topumuz.y, r);
    if (çarpışma) {
      // Topu bloğun kenarına yasla
      if (topumuz.hizX > 0) {
        // Sağa gidiyordu, sağ kenarda çarpıştı
        topumuz.x  = çarpışma.blokSolX - r - 0.01;
      } else {
        // Sola gidiyordu, sol kenarda çarpıştı
        topumuz.x  = çarpışma.blokSağX + r + 0.01;
      }
      topumuz.hizX = 0;
    }
  }

  // ── Dikey hareket ──
  topumuz.y    += topumuz.hizY;
  topumuz.yerde = false;

  const dikeyÇarpışma = dikeyÇarpışmaVar(topumuz.x, topumuz.y, r);
  if (dikeyÇarpışma) {
    if (topumuz.hizY > 0) {
      // Aşağı gidiyordu, zemine çarptı
      topumuz.y     = dikeyÇarpışma.blokÜstY - r - 0.01;
      topumuz.yerde = true;
      // Zemine çarparken squish uygula
      const çarpmaHızı = Math.abs(topumuz.hizY);
      if (çarpmaHızı > 3) {
        topumuz.squishY = 1 - Math.min(çarpmaHızı * SQUISH_ÇARPAN * 0.07, 0.4);
        topumuz.squishX = 1 + Math.min(çarpmaHızı * SQUISH_ÇARPAN * 0.07, 0.4);
      }
      topumuz.hizY  = 0;
    } else {
      // Yukarı gidiyordu, tavana çarptı
      topumuz.y    = dikeyÇarpışma.blokAltY + r + 0.01;
      topumuz.hizY = 0;
    }
  }
}

// ─── Yatay çarpışma yardımcısı ───
// Topun x,y merkezinden yatay yönde solid blok var mı?
// Varsa bloğun sol/sağ kenar piksel değerlerini döner.
function yatayÇarpışmaVar(x, y, r) {
  // Topun kaplayacağı 4 köşeyi kontrol et
  const kontrolNoktalari = [
    { cx: x + (topumuz.hizX > 0 ? r : -r), cy: y - r * 0.8 },
    { cx: x + (topumuz.hizX > 0 ? r : -r), cy: y },
    { cx: x + (topumuz.hizX > 0 ? r : -r), cy: y + r * 0.8 },
  ];

  for (const n of kontrolNoktalari) {
    const blok = pikseldenBlokAl(n.cx, n.cy);
    if (blok && katıMı(blok.satır, blok.sütun)) {
      return {
        blokSolX: blok.sütun       * HUCRE_BOY,
        blokSağX: (blok.sütun + 1) * HUCRE_BOY,
      };
    }
  }
  return null;
}

// ─── Dikey çarpışma yardımcısı ───
function dikeyÇarpışmaVar(x, y, r) {
  const kontrolNoktalari = [
    { cx: x - r * 0.8, cy: y + (topumuz.hizY > 0 ? r : -r) },
    { cx: x,           cy: y + (topumuz.hizY > 0 ? r : -r) },
    { cx: x + r * 0.8, cy: y + (topumuz.hizY > 0 ? r : -r) },
  ];

  for (const n of kontrolNoktalari) {
    const blok = pikseldenBlokAl(n.cx, n.cy);
    if (blok && katıMı(blok.satır, blok.sütun)) {
      return {
        blokÜstY: blok.satır       * HUCRE_BOY,
        blokAltY: (blok.satır + 1) * HUCRE_BOY,
      };
    }
  }
  return null;
}

// ─── Piksel koordinatından matris hücresini bul ───
function pikseldenBlokAl(px, py) {
  const sütun = Math.floor(px / HUCRE_BOY);
  const satır  = Math.floor(py / HUCRE_BOY);
  if (satır < 0 || satır >= matrisSatir) return null;
  if (sütun < 0 || sütun >= matrisSutun) return null;
  return { satır, sütun };
}

// ─── Hücre katı blok mu? ───
function katıMı(satır, sütun) {
  if (satır < 0 || satır >= matrisSatir) return false;
  if (sütun < 0 || sütun >= matrisSutun) return false;
  const değer = aktifMatris[satır][sütun];
  return değer === HUCRE.DUVAR || değer === HUCRE.PORTAL;
  // 11 geçilebilir kalır, sadece dokunca tetiklenir
}

// ============================================================
//  KENAR GEÇİŞ KONTROL
//  Top ekran dışına çıkıyor mu? Hangi kenara?
//  Porta mı yoksa sağ-sol döngüsü mü?
// ============================================================
function kenarGeçişKontrol() {
  const genişlik  = matrisSutun * HUCRE_BOY;
  const yükseklik = matrisSatir * HUCRE_BOY;
  const r         = topumuz.yariçap;

  // ── SAĞ KENAR ──
if (topumuz.x - r > genişlik) {
  const portal = portalBul(mevcutOda, "SAG", topumuz.y, matrisSatir * HUCRE_BOY);
  if (portal) {
    portalGeçişYap(portal);
  } else {
    const geçiş = sagGecisAl(mevcutOda);
    if (geçiş) döngüselGeçişYap(geçiş.hedefOda, geçiş.donus, "sağ");
    else { topumuz.x = genişlik - r - 1; topumuz.hizX = 0; }
  }
  return;
}

// ── SOL KENAR ──
if (topumuz.x + r < 0) {
  const portal = portalBul(mevcutOda, "SOL", topumuz.y, matrisSatir * HUCRE_BOY);
  if (portal) {
    portalGeçişYap(portal);
  } else {
    const geçiş = solGecisAl(mevcutOda);
    if (geçiş) döngüselGeçişYap(geçiş.hedefOda, geçiş.donus, "sol");
    else { topumuz.x = r + 1; topumuz.hizX = 0; }
  }
  return;
}

  // ── ÜST KENAR ──
  if (topumuz.y + r < 0) {
    const normPozisyon = topumuz.x / genişlik;
    // ÜST kenarda:
const portal = portalBul(mevcutOda, "UST", topumuz.x, matrisSutun * HUCRE_BOY);
    if (portal) {
      portalGeçişYap(portal);
    } else {
      // Üst kenarda portal yoksa topu geri it (tavan gibi davran)
      topumuz.y    = r + 1;
      topumuz.hizY = Math.abs(topumuz.hizY) * 0.4;
    }
    return;
  }

  // ── ALT KENAR ──
  if (topumuz.y - r > yükseklik) {
    const normPozisyon = topumuz.x / genişlik;
    // ALT kenarda:
const portal = portalBul(mevcutOda, "ALT", topumuz.x, matrisSutun * HUCRE_BOY);
    if (portal) {
      portalGeçişYap(portal);
    } else {
      // Alt kenarda portal yoksa topu geri tut (zemin gibi)
      topumuz.y    = yükseklik - r - 1;
      topumuz.hizY = 0;
      topumuz.yerde = true;
    }
    return;
  }
}

// ============================================================
//  DÖNGÜSEL GEÇİŞ (Sağ-Sol arası oda değişimi)
//  Harita döndürülmez (donus: 0), top karşı kenardan girer.
// ============================================================
function döngüselGeçişYap(hedefOda, dönüş, yön) {
  // Ses çal
  sesÇal(sesGeçiş);

  // Geçiş animasyonu için eski durumu kaydet
  geçişAnim.eskiMatris = aktifMatris.map(s => [...s]);
  geçişAnim.eskiOda    = mevcutOda;

  // Oda ve dönüşü güncelle
  mevcutOda   = hedefOda;
  haritaDönüş = dönüş;

  // Yeni aktif matrisi hesapla
  aktifMatris = matrisDondur(odaMatrisiAl(mevcutOda), haritaDönüş);
  kanvasYenidenBoyutla();

  const genişlik  = matrisSutun * HUCRE_BOY;
  const yükseklik = matrisSatir * HUCRE_BOY;
  const r         = topumuz.yariçap;

  // Topu karşı kenardan giriş yaptır
  if (yön === "sağ") {
    // Sağdan çıktı → yeni odanın solundan gir
    topumuz.x = r + 2;
  } else {
    // Soldan çıktı → yeni odanın sağından gir
    topumuz.x = genişlik - r - 2;
  }

  // Y pozisyonu korunur (aynı yükseklikte giriş)
  topumuz.y = Math.max(r + 2, Math.min(topumuz.y, yükseklik - r - 2));

 geçişAnim.dikey = false;
geçişAnim.aktif = true;
geçişAnim.sayaç = 0;
  // Geçiş animasyonunu başlat
  geçişAnim.aktif  = true;
  geçişAnim.sayaç  = 0;
  geçişAnim.yön    = yön;

  // HUD güncelle
  hudGüncelle();
}

// ============================================================
//  PORTAL GEÇİŞİ (Üst/Alt kenardaki özel ışınlama)
//  Harita döndürülür, top hedef kenara yerleştirilir.
// ============================================================
function portalGeçişYap(portal) {
  // Ses çal
  sesÇal(sesGeçiş);

  // Geçiş animasyonu için eski durumu kaydet
  geçişAnim.eskiMatris = aktifMatris.map(s => [...s]);
  geçişAnim.eskiOda    = mevcutOda; 

  const hedef = portal.hedef;

  // Oda ve dönüşü güncelle
  mevcutOda   = hedef.oda;
  haritaDönüş = portal.donus;

  // Yeni aktif matrisi döndürülmüş şekilde hesapla
  aktifMatris = matrisDondur(odaMatrisiAl(mevcutOda), haritaDönüş);
  kanvasYenidenBoyutla();

  const genişlik  = matrisSutun * HUCRE_BOY;
  const yükseklik = matrisSatir * HUCRE_BOY;
  const r         = topumuz.yariçap;

  // Topu hedef kenar ve pozisyona yerleştir
  switch (hedef.kenar) {
  case "SOL":
    topumuz.x = r + 2;
    topumuz.y = hedef.hizalama * (matrisSatir * HUCRE_BOY);
    topumuz.hizX = Math.abs(topumuz.hizX) + 2;
    break;
  case "SAG":
    topumuz.x = (matrisSutun * HUCRE_BOY) - r - 2;
    topumuz.y = hedef.hizalama * (matrisSatir * HUCRE_BOY);
    topumuz.hizX = -(Math.abs(topumuz.hizX) + 2);
    break;
  case "UST":
  topumuz.x = hedef.hizalama * (matrisSutun * HUCRE_BOY);
  topumuz.y = r + 2;
  topumuz.hizY = 2;
  break;
  case "ALT":
    topumuz.x = hedef.hizalama * (matrisSutun * HUCRE_BOY);
    topumuz.y = (matrisSatir * HUCRE_BOY) - r - 2;
    topumuz.hizY = 0;
    topumuz.yerde = true;
    break;
}

  // Sınır içinde tut
  topumuz.x = Math.max(r + 2, Math.min(topumuz.x, genişlik - r - 2));
  topumuz.y = Math.max(r + 2, Math.min(topumuz.y, yükseklik - r - 2));

  // Portal yönüne göre animasyon yönü belirle
if (portal.kaynak.kenar === "ALT") {
  geçişAnim.yön   = "asagi";
  geçişAnim.dikey = true;
} else if (portal.kaynak.kenar === "UST") {
  geçişAnim.yön   = "yukari";
  geçişAnim.dikey = true;
} else {
  geçişAnim.dikey = false;
}
geçişAnim.aktif = true;
geçişAnim.sayaç = 0;


  // HUD güncelle
  hudGüncelle();
}

// ============================================================
//  TOPU SIFIRLA — Başlangıç pozisyonuna yerleştir
// ============================================================
function topuSıfırla() {
  mevcutOda   = 1;
  haritaDönüş = 0;
  aktifMatris = matrisDondur(odaMatrisiAl(1), 0);
  kanvasYenidenBoyutla();
  topumuz.x    = 12 * HUCRE_BOY + HUCRE_BOY / 2;
  topumuz.y    = 10 * HUCRE_BOY + HUCRE_BOY / 2;
  topumuz.hizX = 0;
  topumuz.hizY = 0;
  topumuz.yerde = false;
  aktifMatris = matrisDondur(odaMatrisiAl(mevcutOda), haritaDönüş);
  kanvasYenidenBoyutla();
  hudGüncelle();
   // Oda 3, satır 10, sütun 12 → HUCRE.PORTAL (2) konumu
  // piksel = hücre_no × HUCRE_BOY + yarım hücre
}

// ============================================================
//  HUD GÜNCELLE — Başlık bandındaki durum göstergesi
// ============================================================
function hudGüncelle() {
  document.getElementById("hud-oda").textContent   = mevcutOda;
  document.getElementById("hud-donus").textContent = haritaDönüş + "°";

  // Mini oda listesi — aktif odayı vurgula
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById(`oda-mini-${i}`);
    if (el) {
      el.classList.toggle("aktif", i === mevcutOda);
    }
  }
}

// ============================================================
//  SES YARDIMCI — Sesi baştan çal, hata varsa sessiz geç
// ============================================================
function sesÇal(sesEl) {
  try {
    sesEl.currentTime = 0;
    sesEl.play().catch(() => {});
  } catch (_) {}
}

// ============================================================
//  ÇİZ — Her karede canvas'ı sıfırdan render et
// ============================================================
function çiz() {
  const genişlik  = kanvas.width;
  const yükseklik = kanvas.height;

  // ── Arkaplanı temizle ──
  ctx.fillStyle = RENKLER.arkaplan;
  ctx.fillRect(0, 0, genişlik, yükseklik);

  // ── Grid çizgilerini çiz (hafif görünür) ──
  gridÇiz(genişlik, yükseklik);

  // ── Harita bloklarını çiz ──
  haritaÇiz();
/*
  // ── Geçiş animasyonu efekti (beyaz flash) ──
  if (geçişAnim.aktif) {
    const t = 1 - geçişAnim.sayaç / geçişAnim.süre;  // 1→0 arası
    ctx.fillStyle = `rgba(120, 100, 255, ${t * 0.35})`;
    ctx.fillRect(0, 0, genişlik, yükseklik);
  }*/
  if (geçişAnim.aktif && geçişAnim.eskiMatris) {
  const t = geçişAnim.sayaç / geçişAnim.süre;

  if (geçişAnim.dikey) {
    // Dikey kayma (portal geçişi)
    const yukariMi = geçişAnim.yön === "asagi" ? -1 : 1;
    const offset   = Math.round(yukariMi * t * yükseklik);

    // Eski oda yukarı/aşağı kayıyor
    ctx.save();
    ctx.translate(0, offset);
    _eskiOdaCiz(genişlik, yükseklik);
    ctx.restore();

    // Yeni oda karşı yönden geliyor
    ctx.save();
    ctx.translate(0, offset + yukariMi * -yükseklik);
    haritaÇiz();
    topuÇiz();
    ctx.restore();

  } else {
    // Yatay kayma (döngüsel geçiş)
    const kaymaMi = geçişAnim.yön === "sağ" ? -1 : 1;
    const offset  = Math.round(kaymaMi * t * genişlik);

    ctx.save();
    ctx.translate(offset, 0);
    _eskiOdaCiz(genişlik, yükseklik);
    ctx.restore();

    ctx.save();
    ctx.translate(offset + kaymaMi * -genişlik, 0);
    haritaÇiz();
    topuÇiz();
    ctx.restore();
  }
}
  // ── Topu çiz ──
  topuÇiz();

  // Oda 3c uyarısı
if (mevcutOda === 15) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 80, 80, 0.85)";
  ctx.font = "bold 18px 'Courier New'";
  ctx.textAlign = "center";
  ctx.fillText("⚠ SONSUZ DÖNGÜ ⚠", kanvas.width / 2, 30);
  ctx.font = "13px 'Courier New'";
  ctx.fillStyle = "rgba(255, 150, 150, 0.7)";
  ctx.fillText("Gittiğin yol yol değil yeğen", kanvas.width / 2, 52);
  ctx.restore();
} 
  // ── Kenar göstergelerini çiz (hangi kenarda geçiş var?) ──
  kenarGöstergeÇiz(genişlik, yükseklik);
}
  // Geçiş animasyonu için eski odayı çizer
function _eskiOdaCiz(genişlik, yükseklik) {
  if (!geçişAnim.eskiMatris) return;

  const eskiOdaNo = geçişAnim.eskiOda;
  const matris    = geçişAnim.eskiMatris;

  ctx.fillStyle = RENKLER.arkaplan;
  ctx.fillRect(0, 0, genişlik, yükseklik);

  // Grid
  ctx.strokeStyle = RENKLER.grid;
  ctx.lineWidth   = 0.5;
  ctx.beginPath();
  for (let s = 0; s <= matris[0].length; s++) {
    ctx.moveTo(s * HUCRE_BOY, 0);
    ctx.lineTo(s * HUCRE_BOY, yükseklik);
  }
  for (let r = 0; r <= matris.length; r++) {
    ctx.moveTo(0, r * HUCRE_BOY);
    ctx.lineTo(genişlik, r * HUCRE_BOY);
  }
  ctx.stroke();

  // Duvarlar
  const odaPaleti = RENKLER.odaRenkleri[eskiOdaNo] || { duvar: "#3a3a6a", kenar: "#5a5a9a" };
  for (let r = 0; r < matris.length; r++) {
    for (let s = 0; s < matris[0].length; s++) {
      const deger = matris[r][s];
      const px    = s * HUCRE_BOY;
      const py    = r * HUCRE_BOY;
      if (deger === HUCRE.DUVAR) {
        ctx.fillStyle = odaPaleti.duvar;
        ctx.fillRect(px, py, HUCRE_BOY, HUCRE_BOY);
        ctx.fillStyle = odaPaleti.kenar;
        ctx.fillRect(px, py, HUCRE_BOY, 3);
        ctx.fillRect(px, py, 3, HUCRE_BOY);
      } else if (deger === HUCRE.CIKIS) {
        ctx.fillStyle = "#42f554";
        ctx.fillRect(px, py, HUCRE_BOY, HUCRE_BOY);
      }
    }
  }
}  


// ─── Grid çizgisi render ───
function gridÇiz(genişlik, yükseklik) {
  ctx.strokeStyle = RENKLER.grid;
  ctx.lineWidth   = 0.5;
  ctx.beginPath();
  for (let s = 0; s <= matrisSutun; s++) {
    ctx.moveTo(s * HUCRE_BOY, 0);
    ctx.lineTo(s * HUCRE_BOY, yükseklik);
  }
  for (let r = 0; r <= matrisSatir; r++) {
    ctx.moveTo(0, r * HUCRE_BOY);
    ctx.lineTo(genişlik, r * HUCRE_BOY);
  }
  ctx.stroke();
}

// ─── Harita blok render ───
function haritaÇiz() {
     // Oda 3c'deyse (index 15) uyarı arka planı çiz
  if (mevcutOda === 15) {
    ctx.fillStyle = "rgba(255, 50, 50, 0.08)";
    ctx.fillRect(0, 0, kanvas.width, kanvas.height);
  }
  for (let r = 0; r < matrisSatir; r++) {
    for (let s = 0; s < matrisSutun; s++) {
      const değer  = aktifMatris[r][s];
      const px     = s * HUCRE_BOY;
      const py     = r * HUCRE_BOY;

      if (değer === HUCRE.DUVAR) {
  // Mevcut odanın renk grubunu al, yoksa varsayılan gri
  const odaPaleti = RENKLER.odaRenkleri[mevcutOda] || { duvar: "#3a3a6a", kenar: "#5a5a9a" };
  ctx.fillStyle = odaPaleti.duvar;
  ctx.fillRect(px, py, HUCRE_BOY, HUCRE_BOY);
  ctx.fillStyle = odaPaleti.kenar;
  ctx.fillRect(px, py, HUCRE_BOY, 3);
  ctx.fillRect(px, py, 3, HUCRE_BOY);

      } else if (değer === HUCRE.PORTAL) {
        // Portal hücresi — parlak kırmızı
        ctx.fillStyle = RENKLER.portalPark;
        ctx.fillRect(px, py, HUCRE_BOY, HUCRE_BOY);
        ctx.strokeStyle = RENKLER.portal;
        ctx.lineWidth   = 2;
        ctx.strokeRect(px + 1, py + 1, HUCRE_BOY - 2, HUCRE_BOY - 2);
        // İç parlama
        const grad = ctx.createRadialGradient(
          px + HUCRE_BOY / 2, py + HUCRE_BOY / 2, 2,
          px + HUCRE_BOY / 2, py + HUCRE_BOY / 2, HUCRE_BOY * 0.7
        );
        grad.addColorStop(0, "rgba(255,80,120,0.5)");
        grad.addColorStop(1, "rgba(255,80,120,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(px, py, HUCRE_BOY, HUCRE_BOY);
      }else if (değer === HUCRE.CIKIS) {
        // Çıkış noktamız nane yeşili olsun bizde naneyi yedik zaten
        ctx.fillStyle = "#42f554";
        ctx.fillRect(px, py, HUCRE_BOY, HUCRE_BOY);
      }
    }
  }
}

// ─── Top render ───
function topuÇiz() {
  const cx = topumuz.x;
  const cy = topumuz.y;
  const rx = topumuz.yariçap * topumuz.squishX;   // yatay yarıçap (squish)
  const ry = topumuz.yariçap * topumuz.squishY;   // dikey yarıçap (squish)

  ctx.save();
  ctx.translate(cx, cy);

  // Gölge
  ctx.beginPath();
  ctx.ellipse(2, 3, rx * 0.9, ry * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fill();

  // Ana top gövdesi (radyal gradyan)
  const grad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, rx * 0.1, 0, 0, rx);
  grad.addColorStop(0, RENKLER.topParıltı);
  grad.addColorStop(0.4, RENKLER.top);
  grad.addColorStop(1, RENKLER.topGölge);

  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Parlak nokta (sol üst)
  ctx.beginPath();
  ctx.ellipse(-rx * 0.25, -ry * 0.28, rx * 0.22, ry * 0.18, -Math.PI / 5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fill();

  ctx.restore();
}

// ─── Kenar geçiş göstergesi ───
// Sağ ve sol kenarlarda geçiş yönünü işaret eden ince şeritler çizer.
// Portal olan kenarlarda kırmızı işaret gösterir.
function kenarGöstergeÇiz(genişlik, yükseklik) {
  const kalınlık = 4;

  // Sağ kenar — her zaman döngüsel geçiş var
  const sağRenk = "rgba(124,106,240,0.6)";
  ctx.fillStyle = sağRenk;
  ctx.fillRect(genişlik - kalınlık, 0, kalınlık, yükseklik);

  // Sol kenar
  ctx.fillRect(0, 0, kalınlık, yükseklik);

  // Portaller için üst/alt kenar göstergesi
  for (const portal of portaller) {
  if (portal.kaynak.oda !== mevcutOda) continue;
  const [bas, son] = portal.kaynak.aralik;
  // aralığın ortasını al
  const ortaHucre = (bas + son) / 2;
  ctx.fillStyle = RENKLER.portal;

  if (portal.kaynak.kenar === "UST") {
    const merkez = (ortaHucre / SUTUN_SAYISI) * genişlik;
    ctx.fillRect(merkez - 20, 0, 40, 6);
  } else if (portal.kaynak.kenar === "ALT") {
    const merkez = (ortaHucre / SUTUN_SAYISI) * genişlik;
    ctx.fillRect(merkez - 20, yükseklik - 6, 40, 6);
  } else if (portal.kaynak.kenar === "SAG") {
    const merkez = (ortaHucre / SATIR_SAYISI) * yükseklik;
    ctx.fillRect(genişlik - 6, merkez - 20, 6, 40);
  } else if (portal.kaynak.kenar === "SOL") {
    const merkez = (ortaHucre / SATIR_SAYISI) * yükseklik;
    ctx.fillRect(0, merkez - 20, 6, 40);
  }
}
}