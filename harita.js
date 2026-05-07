// ============================================================
//  harita.js — Holonomy Küp Yüzey Bulmacası
//  6 odanın grid matrisleri, sağ-sol döngüsü ve portal sistemi
// ============================================================

// ─── Grid boyutları (oyun.js ile senkron olmalı) ───
const SUTUN_SAYISI = 20;   // yatay hücre adedi
const SATIR_SAYISI = 20;   // dikey hücre adedi

// ─── Hücre türü sabitleri ───
// Sayısal değerler harita matrislerinde kullanılır.
// İleride yeni blok türleri eklemek kolaylaşsın diye sabit olarak tanımladık.
const HUCRE = {
  BOS:    0,   // geçilebilir alan
  DUVAR:  1,   // katı blok / zemin
  PORTAL: 2,   // portal işaretli hücre (görsel farklı çizilir)
  CIKIS:3
};

// ============================================================
//  YARDIMCI: Boş oda şablonu üretici
//  Sadece dış çerçevesi 1, içi 0 olan 12×20 matris döner.
//  Kendiniz dolduracaksınız — bu sadece başlangıç iskeleti.
// ============================================================
function bosOdaOlustur() {
  // Önce tamamı 0 olan 12 satır × 20 sütun dizi yap
  const matris = Array.from({ length: SATIR_SAYISI }, () =>
    new Array(SUTUN_SAYISI).fill(HUCRE.BOS)
  );

  // Üst ve alt satırları tamamen duvar yap
  for (let s = 0; s < SUTUN_SAYISI; s++) {
    matris[0][s]                  = HUCRE.DUVAR;  // üst çerçeve
    matris[SATIR_SAYISI - 1][s]   = HUCRE.DUVAR;  // alt çerçeve
  }

  // Sol ve sağ sütunları tamamen duvar yap
  for (let r = 0; r < SATIR_SAYISI; r++) {
    matris[r][0]                  = HUCRE.DUVAR;  // sol çerçeve
    matris[r][SUTUN_SAYISI - 1]   = HUCRE.DUVAR;  // sağ çerçeve
  }

  return matris;
}
// ============================================================
//  ODA MATRİSLERİ — 20 satır × 20 sütun
//  0 = boşluk (geçilebilir), 1 = duvar, 3 = çıkış
//
//  Satır  0 = üst kenar,  Satır 19 = alt kenar (zemin)
//  Sütun  0 = sol kenar,  Sütun 19 = sağ kenar
//
//  Geçiş koridorları:
//    SAĞ  → sütun 19'da 0 olan satırlar
//    SOL  → sütun  0'da 0 olan satırlar
//    ÜST  → satır  0'da 0 olan sütunlar  (portal girişi)
//    ALT  → satır 19'da 0 olan sütunlar  (portal girişi)
// ============================================================

// ─── ODA 1 ───
// Sol üst köşede başlangıç platformu (satır 1-3, sütun 0-2 boş)
// Orta katmanda geniş boşluk (satır 7-12, sütun 0-12)
// Sağ geçiş koridoru: satır 14-15 → Oda 2'ye
// Alt portal: sütun 7-12, satır 19
const oda1Matrisi = [
  [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,1],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,1]
];

// ─── ODA 2 ───
// Sol geçiş: satır 14-15 (Oda 1'den gelir)
// Sağ geçiş: satır 7-12 → Oda 3'e
// Üst portal: sütun 0-0 yok, üst açık değil
// Alt portal: sütun 7-12, satır 19
const oda2Matrisi = [
  [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0]
];

// ─── ODA 3 ───
// Sol geçiş: satır 7-12 (Oda 2'den gelir)
// Sağ geçiş: satır 7-12 → Oda 4'e
// Üst: kapalı
// Alt portal: sütun 4-14, satır 19 (geniş platform boşluğu)
const oda3Matrisi = [
  [1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,0,0,0,1,1,1,1,1,1,1,0,0,1,1,0,0,0,0],
  [0,0,0,0,1,1,0,0,0,1,1,1,1,1,1,1,0,0,1,1,0,0,1,1]
];

// ─── ODA 4 ───
// Sol geçiş: satır 7-12 (Oda 3'ten gelir)
// Sağ geçiş: satır 7-12 → Oda 5'e
// Üst portal: sütun 0-6 (sol bölge)
// Alt portal: sütun 13-16 (sağ bölge)
const oda4Matrisi = [
  [1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1]
];

// ─── ODA 5 ───
// Sol geçiş: satır 7-12 (Oda 4'ten gelir)
// Sağ geçiş: satır 7-12 → Oda 6'ya
// Üst portal: sütun 0-6
// Alt portal: sütun 17-18
const oda5Matrisi = [
  [1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1]
];

// ─── ODA 6 ───
// Sol geçiş: satır 7-12 (Oda 5'ten gelir)
// Sağ → Oda 1'e döngüsel (satır 7-12)
// Üst portal: sütun 0-6
// Alt portal: sütun 13-15
// ÇIKIŞ (3): satır 19, sütun 0-2
const oda6Matrisi = [
  [1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,3,3,3,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,3,3,3,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,3,3,3,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
  [0,0,0,0,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,0,0,0,0],
  [0,0,0,0,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,0,0,0,0],
  [0,0,0,0,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,0,0,0,0],
  [1,0,0,0,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,0,0,0,1]
];
// ============================================================
//  ODA HAVUZU
//  Index 0 = oda1, index 1 = oda2, ... (0-tabanlı erişim için)
//  oyun.js içinden: odaHavuzu[mevcutOda - 1]  → o odanın matrisi
// ============================================================
const odaHavuzu = [
  oda1Matrisi,
  oda2Matrisi,
  oda3Matrisi,
  oda4Matrisi,
  oda5Matrisi,
  oda6Matrisi,
];

// ============================================================
//  SAĞ-SOL DÖNGÜSEL GEÇİŞ TABLOSU
//  Sağa gidince bir sonraki oda (1→2→…→6→1)
//  Sola gidince bir önceki oda (1→6→…→2→1)
//  Bu geçişlerde harita DÖNMEZ (donus: 0).
//  Top yeni odaya giriş yaptığı kenarın karşı ucundan çıkar.
//
//  Veri yapısı:
//    sagGecis[n]  = { hedefOda, donus }
//    solGecis[n]  = { hedefOda, donus }
//  n = mevcut oda (1-tabanlı)
// ============================================================
const sagGecis = {
  1: { hedefOda: 2, donus: 0 },
  2: { hedefOda: 3, donus: 0 },
  3: { hedefOda: 4, donus: 0 },
  4: { hedefOda: 5, donus: 0 },
  5: { hedefOda: 6, donus: 0 },
  6: { hedefOda: 1, donus: 0 },
};

const solGecis = {
  1: { hedefOda: 6, donus: 0 },
  2: { hedefOda: 1, donus: 0 },
  3: { hedefOda: 2, donus: 0 },
  4: { hedefOda: 3, donus: 0 },
  5: { hedefOda: 4, donus: 0 },
  6: { hedefOda: 5, donus: 0 },
};

// ============================================================
//  PORTAL (ÜST/ALT KENAR GEÇİŞ) SİSTEMİ
//
//  Her portal nesnesi şu alanları içerir:
//
//    kaynak.oda       → portali barındıran oda numarası (1-6)
//    kaynak.kenar     → "UST" | "ALT" | "SAG" | "SOL"
//    kaynak.pozisyon  → kenar boyunca 0.0–1.0 arası yüzde
//                       (0.5 = tam orta)
//
//    hedef.oda        → ışınlanacak oda numarası
//    hedef.kenar      → ışınlandıktan sonra hangi kenardan girilir
//    hedef.pozisyon   → hedef kenarda konumlanma yüzdesi
//
//    donus            → yeni odanın haritasının döneceği açı
//                       0, 90, 180 veya 270 (saat yönü, derece)
//
//  DÖNÜŞ MANTIĞI:
//    Yerçekimi ekranda her zaman aşağı yönde sabit kalır.
//    Yeni odaya girildiğinde harita `donus` kadar döndürülür.
//    Bu sayede top "tavan"dan girip "yer"e düşüyormuş gibi hissedilir.
//
//  ÖRNEK:
//    Oda 1'in tavanından çıkıp Oda 4'ün sağ duvarına giren top için
//    donus: 90 verilirse → Oda 4'ün haritası 90° döner,
//    sağ duvar artık "taban" gibi davranır.
//
//  ŞİMDİLİK BOŞ — İçini siz dolduracaksınız.
// ============================================================
// ============================================================
//  PORTAL (ÜST/ALT KENAR GEÇİŞ) SİSTEMİ - TÜM KURALLAR
// ============================================================
// ============================================================
//  PORTAL (ÜST/ALT KENAR GEÇİŞ) SİSTEMİ - TÜM KURALLAR
// ============================================================
const portaller = [
  // ─── 1. ODA BAĞLANTILARI ───
  {
    kaynak: { oda: 1, kenar: "ALT", pozisyon: 0.2 }, // Oda 1'den aşağı düşersen
    hedef:  { oda: 3, kenar: "UST", pozisyon: 0.25 }, // Oda 3'ün tavanından girersin
    donus: 0 
  },

  // ─── 2. ODA BAĞLANTILARI ───
  {
    kaynak: { oda: 2, kenar: "ALT", pozisyon: 0.45 }, // Oda 2'den aşağı düşersen
    hedef:  { oda: 5, kenar: "UST", pozisyon: 0.25 }, // Oda 5'in tavanından girersin
    donus: 0 
  },
  {
    kaynak: { oda: 2, kenar: "UST", pozisyon: 0.45 }, // Oda 2'den yukarı zıplarsan
    hedef:  { oda: 4, kenar: "ALT", pozisyon: 0.35 }, // Oda 4'ün altından, TERS YERÇEKİMİ ile girersin
    donus: 180 
  },

  // ─── 3. ODA BAĞLANTILARI ───
  {
    kaynak: { oda: 3, kenar: "UST", pozisyon: 0.25 }, // Oda 3'ten yukarı zıplarsan
    hedef:  { oda: 1, kenar: "ALT", pozisyon: 0.2 },  // Oda 1'e geri dönersin
    donus: 0 
  },
  {
    kaynak: { oda: 3, kenar: "ALT", pozisyon: 0.6 },  // Oda 3'ün büyük boşluğundan düşersen
    hedef:  { oda: 6, kenar: "UST", pozisyon: 0.75 }, // Oda 6'nın tavanından girersin
    donus: 0 
  },

  // ─── 4. ODA BAĞLANTILARI ───
  {
    kaynak: { oda: 4, kenar: "ALT", pozisyon: 0.35 }, // Oda 4'ten aşağı düşersen
    hedef:  { oda: 2, kenar: "UST", pozisyon: 0.45 }, // Oda 2'nin tavanından, TERS YERÇEKİMİ ile dönersin
    donus: 180 
  },
  {
    kaynak: { oda: 4, kenar: "UST", pozisyon: 0.55 }, // Oda 4'ün bacasından zıplarsan
    hedef:  { oda: 6, kenar: "ALT", pozisyon: 0.35 }, // Oda 6'ya tersten girersin
    donus: 180 
  },

  // ─── 5. ODA BAĞLANTILARI ───
  {
    kaynak: { oda: 5, kenar: "UST", pozisyon: 0.25 }, // Oda 5'ten yukarı zıplarsan
    hedef:  { oda: 2, kenar: "ALT", pozisyon: 0.45 }, // Oda 2'nin zeminine geri dönersin
    donus: 0 
  },
  {
    kaynak: { oda: 5, kenar: "ALT", pozisyon: 0.65 }, // Oda 5'in altından düşersen
    hedef:  { oda: 4, kenar: "UST", pozisyon: 0.55 }, // Oda 4'ün tavanından TERS YERÇEKİMİ ile girersin
    donus: 180 
  },

  // ─── 6. ODA BAĞLANTILARI ───
  {
    kaynak: { oda: 6, kenar: "UST", pozisyon: 0.75 }, // Oda 6'dan yukarı zıplarsan
    hedef:  { oda: 3, kenar: "ALT", pozisyon: 0.6 },  // Oda 3'e geri dönersin
    donus: 0 
  },
  {
    kaynak: { oda: 6, kenar: "ALT", pozisyon: 0.35 }, // Oda 6'dan aşağı düşersen
    hedef:  { oda: 4, kenar: "UST", pozisyon: 0.55 }, // Oda 4'ün tavanından tersten girersin
    donus: 180 
  }
];

// ============================================================
//  YARDIMCI FONKSİYONLAR
//  oyun.js bu fonksiyonları kullanır — doğrudan matrise dokunmaz.
// ============================================================

/**
 * Belirtilen odanın ham matrisini döner (0-tabanlı değil, 1-tabanlı oda no).
 * @param {number} odaNo  1–6 arası oda numarası
 * @returns {number[][]}  12×20 matris
 */
function odaMatrisiAl(odaNo) {
  if (odaNo < 1 || odaNo > 6) {
    console.warn(`odaMatrisiAl: geçersiz oda numarası ${odaNo}`);
    return odaHavuzu[0];
  }
  return odaHavuzu[odaNo - 1];
}

/**
 * Bir matrisi saat yönünde 90° döndürür.
 * Döndürme: yeni[s][r] = eski[SATIR-1-r][s]
 * (12×20 matris → 20×12 olur dikkat! Grid kare değil.)
 *
 * NOT: Holonomy'de tüm odalar kare DEĞİL (20×12).
 * Bu yüzden 90° döndürme satır/sütun sayısını değiştirir.
 * oyun.js render sırasında genişlik/yüksekliği buna göre ayarlar.
 *
 * @param {number[][]} matris  Kaynak matris
 * @returns {number[][]}       Döndürülmüş yeni matris (kopya)
 */
function matrisDondur90(matris) {
  const eskiSatir  = matris.length;
  const eskiSutun  = matris[0].length;
  // Yeni matris: eskiSutun satır × eskiSatir sütun
  const yeni = Array.from({ length: eskiSutun }, () =>
    new Array(eskiSatir).fill(0)
  );
  for (let r = 0; r < eskiSatir; r++) {
    for (let s = 0; s < eskiSutun; s++) {
      // Saat yönü 90°: yeni[s][eskiSatir - 1 - r] = eski[r][s]
      yeni[s][eskiSatir - 1 - r] = matris[r][s];
    }
  }
  return yeni;
}

/**
 * Bir matrisi istenen açı kadar döndürür.
 * Geçerli açılar: 0, 90, 180, 270
 * Diğer değerler console uyarısı verir ve orijinal matrisi döner.
 *
 * @param {number[][]} matris  Kaynak matris
 * @param {number}     aci     Dönüş açısı (0 / 90 / 180 / 270)
 * @returns {number[][]}       Döndürülmüş yeni matris (kopya)
 */
function matrisDondur(matris, aci) {
  // Açıyı 0-360 aralığına normalize et
  const normalAci = ((aci % 360) + 360) % 360;

  if (normalAci === 0)   return matris.map(satir => [...satir]); // derin kopya
  if (normalAci === 90)  return matrisDondur90(matris);
  if (normalAci === 180) return matrisDondur90(matrisDondur90(matris));
  if (normalAci === 270) return matrisDondur90(matrisDondur90(matrisDondur90(matris)));

  console.warn(`matrisDondur: desteklenmeyen açı ${aci}, orijinal döndürüldü`);
  return matris.map(satir => [...satir]);
}

/**
 * Verilen oda + kenar + pozisyon için eşleşen portalı arar.
 * Bulamazsa null döner.
 *
 * @param {number} odaNo     Kaynak oda (1-6)
 * @param {string} kenar     "UST" | "ALT" | "SAG" | "SOL"
 * @param {number} pozisyon  0.0–1.0 arası normalize konum
 * @param {number} tolerans  Pozisyon eşleşme toleransı (varsayılan 0.15)
 * @returns {object|null}    Portal nesnesi ya da null
 */
function portalBul(odaNo, kenar, pozisyon, tolerans = 0.15) {
  for (const portal of portaller) {
    const k = portal.kaynak;
    if (
      k.oda    === odaNo &&
      k.kenar  === kenar &&
      Math.abs(k.pozisyon - pozisyon) <= tolerans
    ) {
      return portal;
    }
  }
  return null; // eşleşen portal yok
}

/**
 * Sağa geçiş bilgisini döner.
 * @param {number} odaNo  Mevcut oda (1-6)
 * @returns {{ hedefOda: number, donus: number }}
 */
function sagGecisAl(odaNo) {
  return sagGecis[odaNo];
}

/**
 * Sola geçiş bilgisini döner.
 * @param {number} odaNo  Mevcut oda (1-6)
 * @returns {{ hedefOda: number, donus: number }}
 */
function solGecisAl(odaNo) {
  return solGecis[odaNo];
}