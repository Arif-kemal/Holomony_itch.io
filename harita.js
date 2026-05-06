// ============================================================
//  harita.js — Holonomy Küp Yüzey Bulmacası
//  6 odanın grid matrisleri, sağ-sol döngüsü ve portal sistemi
// ============================================================

// ─── Grid boyutları (oyun.js ile senkron olmalı) ───
const SUTUN_SAYISI = 20;   // yatay hücre adedi
const SATIR_SAYISI = 12;   // dikey hücre adedi

// ─── Hücre türü sabitleri ───
// Sayısal değerler harita matrislerinde kullanılır.
// İleride yeni blok türleri eklemek kolaylaşsın diye sabit olarak tanımladık.
const HUCRE = {
  BOS:    0,   // geçilebilir alan
  DUVAR:  1,   // katı blok / zemin
  PORTAL: 2,   // portal işaretli hücre (görsel farklı çizilir)
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
//  6 ODA MATRİSİ
//  Her oda 12 satır × 20 sütun.
//  Şu an sadece dış çerçeveler dolu — içini kendiniz doldurun.
//  Satır 0 = üst kenar, satır 11 = alt kenar (zemin)
//  Sütun 0 = sol kenar, sütun 19 = sağ kenar
// ============================================================

// ─── Oda 1 ───
const oda1Matrisi = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0 (Sol üst boşluk)
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 1
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 2
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 3
  [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1], // 4 (Sol orta portal)
  [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1], // 5
  [1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1], // 6
  [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 7 (Oda 2'ye giden SAĞ yol)
  [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 8 
  [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1], // 9 (Sol alt boşluk)
  [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1], // 10
  [1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]  // 11 (Zemin - Ortada portal deliği var)
];
const oda2Matrisi = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
  [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1], // 0 (Üst portal boşluğu)
  [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1], // 1
  [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1], // 2
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0], // 3 (Oda 3'e giden SAĞ yol)
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0], // 4
  [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1], // 5
  [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1], // 6
  [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1], // 7 (Oda 1'den gelen SOL yol)
  [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1], // 8
  [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1], // 9
  [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1], // 10
  [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1]  // 11 (Alt portal boşluğu)
];
const oda3Matrisi = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
  [1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0 (Üst portal boşluğu)
  [1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 1
  [1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 2
  [0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 3 (Oda 2'den gelen SOL yol)
  [0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 4
  [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1], // 5 (Geniş boşluk başlıyor)
  [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1], // 6
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1], // 7
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1], // 8
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0], // 9 (Oda 4'e giden SAĞ yol)
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0], // 10
  [1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1]  // 11 (Alt portal boşluğu)
];
const oda4Matrisi = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
  [1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1], // 0 (Üst portal boşluğu)
  [1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1], // 1
  [1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1], // 2
  [1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1], // 3
  [1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1], // 4
  [1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1], // 5
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0], // 6 (Oda 5'e giden SAĞ yol)
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0], // 7 
  [1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1], // 8
  [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1], // 9 (Oda 3'ten gelen SOL yol)
  [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1], // 10
  [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1]  // 11 (Alt portal boşluğu)
];
const oda5Matrisi = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
  [1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0 (Üst portal boşluğu)
  [1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 1
  [1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 2
  [1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 3
  [1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 4
  [1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1], // 5
  [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1], // 6 (Oda 4'ten gelen SOL yol)
  [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1], // 7 
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0], // 8 (Oda 6'ya giden SAĞ yol)
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0], // 9 
  [1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1], // 10
  [1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1]  // 11 (Alt portal boşluğu)
];
const oda6Matrisi = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1], // 0 (Üst portal boşluğu)
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1], // 1
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1], // 2
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1], // 3
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0], // 4 (Oda 1'e BAĞLANAN SAĞ ÇIKIŞ)
  [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0], // 5 
  [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1], // 6
  [1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1], // 7
  [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1], // 8 (Oda 5'ten gelen SOL yol)
  [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1], // 9 
  [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1], // 10 (Alt portal boşluğu)
  [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1]  // 11 
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
const portaller = [
  // Örnek (aktif değil, yorum satırında bırakıldı):
  // {
  //   kaynak: { oda: 1, kenar: "UST", pozisyon: 0.5 },
  //   hedef:  { oda: 4, kenar: "SAG", pozisyon: 0.5 },
  //   donus: 90
  // },
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