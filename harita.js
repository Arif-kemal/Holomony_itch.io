// ============================================================
//  harita.js — Holonomy Küp Yüzey Bulmacası
//  6 odanın grid matrisleri, sağ-sol döngüsü ve portal sistemi
// ============================================================

// ─── Grid boyutları (oyun.js ile senkron olmalı) ───
const SUTUN_SAYISI = 24;   // yatay hücre adedi
const SATIR_SAYISI = 24;   // dikey hücre adedi

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

  // ── ODA 1 ALT → ODA 3 ÜST ──
  // Oda 1 satır 23 boş sütunlar: 8-14 → Oda 3 satır 0 boş sütunlar: 8-15
  {
    kaynak: { oda: 1, kenar: "ALT", aralik: [8, 14] },
    hedef:  { oda: 3, kenar: "UST", hizalama: 0.46 },
    donus: 0,
  },
  // Geri: Oda 3 ÜST → Oda 1 ALT
  {
    kaynak: { oda: 3, kenar: "UST", aralik: [8, 15] },
    hedef:  { oda: 1, kenar: "ALT", hizalama: 0.46 },
    donus: 0,
  },

  // ── ODA 2 ALT → ODA 5 ÜST ──
  // Oda 2 satır 23 boş sütunlar: 8-15 → Oda 5 satır 0 boş sütunlar: 8-15
  {
    kaynak: { oda: 2, kenar: "ALT", aralik: [8, 15] },
    hedef:  { oda: 5, kenar: "UST", hizalama: 0.46 },
    donus: 0,
  },
  // Geri: Oda 5 ÜST → Oda 2 ALT
  {
    kaynak: { oda: 5, kenar: "UST", aralik: [8, 15] },
    hedef:  { oda: 2, kenar: "ALT", hizalama: 0.46 },
    donus: 0,
  },

  // ── ODA 2 ÜST → ODA 4 ALT (180°) ──
  // Oda 2 satır 0 boş sütunlar: 8-15 → Oda 4 satır 23 boş sütunlar: 8-15
  // 180° dönüş: oda 4 baş aşağı döner, top zemine iner
  {
    kaynak: { oda: 2, kenar: "UST", aralik: [8, 15] },
    hedef:  { oda: 4, kenar: "ALT", hizalama: 0.46 },
    donus: 180,
  },
  // Geri: Oda 4 ALT → Oda 2 ÜST (180° geri alır)
  {
    kaynak: { oda: 4, kenar: "ALT", aralik: [8, 15] },
    hedef:  { oda: 2, kenar: "UST", hizalama: 0.46 },
    donus: 180,
  },

  // ── ODA 3 ALT → ODA 6 ÜST ──
  // Oda 3 satır 23 boş sütunlar: 6-8 ve 17-18
  // İki ayrı portal deliği var, ikisini de tanımlıyoruz
  {
    kaynak: { oda: 3, kenar: "ALT", aralik: [6, 8] },
    hedef:  { oda: 6, kenar: "UST", hizalama: 0.46 },
    donus: 0,
  },
  {
    kaynak: { oda: 3, kenar: "ALT", aralik: [17, 18] },
    hedef:  { oda: 6, kenar: "UST", hizalama: 0.75 },
    donus: 0,
  },
  // Geri: Oda 6 ÜST → Oda 3 ALT
  {
    kaynak: { oda: 6, kenar: "UST", aralik: [8, 15] },
    hedef:  { oda: 3, kenar: "ALT", hizalama: 0.46 },
    donus: 0,
  },

  // ── ODA 4 ÜST → ODA 6 ALT (180°) ──
  // Oda 4 satır 0 boş sütunlar: 8-15 → Oda 6 alt bölgesine ters giriş
  // 180°: oda 6 baş aşağı döner, 3'lü çıkış hücreleri zemine gelir!
  {
    kaynak: { oda: 4, kenar: "UST", aralik: [8, 15] },
    hedef:  { oda: 6, kenar: "ALT", hizalama: 0.46 },
    donus: 180,
  },
  // Geri: Oda 6 ALT → Oda 4 ÜST
  {
    kaynak: { oda: 6, kenar: "ALT", aralik: [8, 15] },
    hedef:  { oda: 4, kenar: "UST", hizalama: 0.46 },
    donus: 180,
  },

  // ── ODA 5 ALT → ODA 4 ÜST (180°) ──
  // Oda 5 satır 23 boş sütunlar: 8-15
  {
    kaynak: { oda: 5, kenar: "ALT", aralik: [8, 15] },
    hedef:  { oda: 4, kenar: "UST", hizalama: 0.46 },
    donus: 180,
  },

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
function portalBul(odaNo, kenar, piksel, kanal) {
  // piksel: topun kenar üzerindeki x veya y piksel pozisyonu
  // kanal: o eksenin toplam piksel uzunluğu (canvas genişliği veya yüksekliği)
  // hücre indeksine çeviriyoruz
  const hucrePos = (piksel / kanal) * SUTUN_SAYISI;

  for (const p of portaller) {
    if (p.kaynak.oda !== odaNo) continue;
    if (p.kaynak.kenar !== kenar) continue;
    const [bas, son] = p.kaynak.aralik;
    if (hucrePos >= bas - 0.5 && hucrePos <= son + 0.5) {
      return p;
    }
  }
  return null;
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