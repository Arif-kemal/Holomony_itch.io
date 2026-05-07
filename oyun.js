// ============================================================
//  oyun.js — Holonomy Küp Yüzey Bulmacası
//  Ana oyun döngüsü: fizik, top, render, oda geçişleri
//  Bağımlılık: harita.js önce yüklenmiş olmalı
// ============================================================

// ─── Canvas ve 2D bağlam ───
const kanvas  = document.getElementById("oyunCanvas");
const ctx     = kanvas.getContext("2d");

// ============================================================
//  SABITLER
// ============================================================
const HUCRE_BOY       = 40;      // her grid hücresinin piksel boyutu
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
  duvar:      "#3a3a6a",
  duvarKenar: "#5a5a9a",
  portal:     "#ff4466",
  portalPark: "rgba(255,68,102,0.18)",
  top:        "#f5e642",
  topParıltı: "#fff9a0",
  topGölge:   "#c4a800",
  grid:       "rgba(255,255,255,0.03)",
  geçiş:      "rgba(120,100,255,0.12)",
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
  aktif:    false,
  süre:     18,      // kare sayısı
  sayaç:    0,
  yön:      "sağ",   // "sağ" | "sol" | "portal"
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
  if (blok && aktifMatris[blok.satır][blok.sütun] === HUCRE.CIKIS) {
    if (oyunAktif) {
      oyunAktif = false; // Oyunu durdur
      sesÇal(sesHedef);  // hedef.mp3 sesini çal
      
      // Ses çaldıktan yarım saniye sonra ekrana uyarı ver ve sayfayı yenile
      setTimeout(() => {
        alert("TEBRİKLER HOCAM! PARKURU TAMAMLADIN!");
        location.reload(); 
      }, 500);
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
    // Önce portal var mı bak
    const normPozisyon = topumuz.y / yükseklik;
    const portal = portalBul(mevcutOda, "SAG", normPozisyon);
    if (portal) {
      portalGeçişYap(portal);
    } else {
      // Yoksa sağ-sol döngüsel geçiş
      const geçiş = sagGecisAl(mevcutOda);
      döngüselGeçişYap(geçiş.hedefOda, geçiş.donus, "sağ");
    }
    return;
  }

  // ── SOL KENAR ──
  if (topumuz.x + r < 0) {
    const normPozisyon = topumuz.y / yükseklik;
    const portal = portalBul(mevcutOda, "SOL", normPozisyon);
    if (portal) {
      portalGeçişYap(portal);
    } else {
      const geçiş = solGecisAl(mevcutOda);
      döngüselGeçişYap(geçiş.hedefOda, geçiş.donus, "sol");
    }
    return;
  }

  // ── ÜST KENAR ──
  if (topumuz.y + r < 0) {
    const normPozisyon = topumuz.x / genişlik;
    const portal = portalBul(mevcutOda, "UST", normPozisyon);
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
    const portal = portalBul(mevcutOda, "ALT", normPozisyon);
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
      topumuz.y = hedef.pozisyon * yükseklik;
      topumuz.hizX = Math.abs(topumuz.hizX) + 2;   // içe doğru momentum
      break;
    case "SAG":
      topumuz.x = genişlik - r - 2;
      topumuz.y = hedef.pozisyon * yükseklik;
      topumuz.hizX = -(Math.abs(topumuz.hizX) + 2);
      break;
    case "UST":
      topumuz.x = hedef.pozisyon * genişlik;
      topumuz.y = r + 2;
      topumuz.hizY = Math.abs(topumuz.hizY) * 0.5;
      break;
    case "ALT":
      topumuz.x = hedef.pozisyon * genişlik;
      topumuz.y = yükseklik - r - 2;
      topumuz.hizY = 0;
      topumuz.yerde = true;
      break;
  }

  // Sınır içinde tut
  topumuz.x = Math.max(r + 2, Math.min(topumuz.x, genişlik - r - 2));
  topumuz.y = Math.max(r + 2, Math.min(topumuz.y, yükseklik - r - 2));

  // Geçiş animasyonu
  geçişAnim.aktif  = true;
  geçişAnim.sayaç  = 0;
  geçişAnim.yön    = "portal";

  // HUD güncelle
  hudGüncelle();
}

// ============================================================
//  TOPU SIFIRLA — Başlangıç pozisyonuna yerleştir
// ============================================================
function topuSıfırla() {
  const genişlik  = matrisSutun * HUCRE_BOY;
  const yükseklik = matrisSatir * HUCRE_BOY;

  // Başlangıç: yatayda orta, dikeyde zemine yakın
  topumuz.x     = HUCRE_BOY*1,5;
  topumuz.y     = HUCRE_BOY*17,5;
  topumuz.hizX  = 0;
  topumuz.hizY  = 0;
  topumuz.yerde = false;
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

  // ── Geçiş animasyonu efekti (beyaz flash) ──
  if (geçişAnim.aktif) {
    const t = 1 - geçişAnim.sayaç / geçişAnim.süre;  // 1→0 arası
    ctx.fillStyle = `rgba(120, 100, 255, ${t * 0.35})`;
    ctx.fillRect(0, 0, genişlik, yükseklik);
  }

  // ── Topu çiz ──
  topuÇiz();

  // ── Kenar göstergelerini çiz (hangi kenarda geçiş var?) ──
  kenarGöstergeÇiz(genişlik, yükseklik);
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
  for (let r = 0; r < matrisSatir; r++) {
    for (let s = 0; s < matrisSutun; s++) {
      const değer  = aktifMatris[r][s];
      const px     = s * HUCRE_BOY;
      const py     = r * HUCRE_BOY;

      if (değer === HUCRE.DUVAR) {
        // Dolgu
        ctx.fillStyle = RENKLER.duvar;
        ctx.fillRect(px, py, HUCRE_BOY, HUCRE_BOY);
        // Üst kenar vurgusu (3B hissi)
        ctx.fillStyle = RENKLER.duvarKenar;
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

    const pos = portal.kaynak.pozisyon;

    ctx.fillStyle = RENKLER.portal;

    if (portal.kaynak.kenar === "UST") {
      const merkez = pos * genişlik;
      ctx.fillRect(merkez - 20, 0, 40, 6);
    } else if (portal.kaynak.kenar === "ALT") {
      const merkez = pos * genişlik;
      ctx.fillRect(merkez - 20, yükseklik - 6, 40, 6);
    } else if (portal.kaynak.kenar === "SAG") {
      const merkez = pos * yükseklik;
      ctx.fillRect(genişlik - 6, merkez - 20, 6, 40);
    } else if (portal.kaynak.kenar === "SOL") {
      const merkez = pos * yükseklik;
      ctx.fillRect(0, merkez - 20, 6, 40);
    }
  }
}