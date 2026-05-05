// ==========================================
// fizik.js — Küp Yüzey Geçiş Sistemi
// ==========================================
//
// TEMEL FİKİR:
// Harita aslında 6 yüzlü bir küpün açılmış hali.
// Her yüzey kendi ekranıdır. Oyuncu bir yüzeyin
// kenarından çıkınca, küpün geometrisine göre
// hangi yüzeye, hangi kenardan, hangi yönle
// gireceği hesaplanır.
//
// Küpün açılım şeması (yüzey numaraları):
//
//             [ 3 ]
//       [ 5 ] [ 1 ] [ 2 ] [ 4 ]
//             [ 6 ]
//
// Yüzey 1 = Ön yüz (başlangıç yüzeyi)
// Yüzey 2 = Sağ yüz
// Yüzey 3 = Üst yüz
// Yüzey 4 = Arka yüz
// Yüzey 5 = Sol yüz
// Yüzey 6 = Alt yüz
// ==========================================


// ------------------------------------------
// YERÇEKİMİ VEKTÖRLERİ
// Her yüzeyde "aşağı" farklı bir yöndür.
// Örneğin üst yüzeyde (3) aşağı = küpün dışına doğru,
// yani o yüzeyde Y ekseni tersine çalışır.
//
// yerekimiYonleri[yuzeyNo] = { x, y }
// x pozitif = sağa çeker
// y pozitif = aşağı çeker
// ------------------------------------------
const yerekimiYonleri = {
    1: { x: 0,     y: 0.35  },  // Ön yüz   — normal, aşağı çeker
    2: { x: -0.35, y: 0     },  // Sağ yüz  — sola çeker (küpte sağ yüzün "zemini" soldadır)
    3: { x: 0,     y: -0.35 },  // Üst yüz  — yukarı çeker (baş aşağı)
    4: { x: 0.35,  y: 0     },  // Arka yüz — sağa çeker
    5: { x: 0.35,  y: 0     },  // Sol yüz  — sağa çeker
    6: { x: 0,     y: 0.35  }   // Alt yüz  — normal, aşağı çeker
};

// Şu an hangi yüzeydeyiz
let aktifYuzey = 1;

// Aktif yüzeyin yerçekimini al
function aktifYerekimi() {
    return yerekimiYonleri[aktifYuzey];
}


// ------------------------------------------
// YÜZEY GEÇİŞ BAĞLANTILARI
//
// Küpün geometrisine göre hangi yüzeyin hangi
// kenarı, hangi yüzeyin hangi kenarına bağlıdır.
//
// Format:
// gecisHaritasi[mevcutYuzey][cikilanKenar] = {
//     hedefYuzey: ...,   hangi yüzeye geçilecek
//     girisKenar: ...,   o yüzeyin hangi kenarından girilecek
//     yonDonusumu: ...   hareket yönü nasıl dönüşecek (0, 90, 180, 270 derece)
// }
//
// Kenar isimleri: 'ust' | 'alt' | 'sol' | 'sag'
// yonDonusumu: geçişte hareket vektörü kaç derece döner
// ------------------------------------------
const gecisHaritasi = {
    1: {
        // Yüzey 1 (Ön) kenarlarından çıkınca:
        sag:  { hedefYuzey: 2, girisKenar: 'sol', yonDonusumu: 0   },
        // Sağdan çıkınca yüzey 2'nin solundan girilir, yön değişmez

        sol:  { hedefYuzey: 5, girisKenar: 'sag', yonDonusumu: 0   },
        // Soldan çıkınca yüzey 5'in sağından girilir, yön değişmez

        ust:  { hedefYuzey: 3, girisKenar: 'alt', yonDonusumu: 0   },
        // Üstten çıkınca yüzey 3'ün altından girilir

        alt:  { hedefYuzey: 6, girisKenar: 'ust', yonDonusumu: 0   }
        // Alttan çıkınca yüzey 6'nın üstünden girilir
    },
    2: {
        // Yüzey 2 (Sağ)
        sol:  { hedefYuzey: 1, girisKenar: 'sag', yonDonusumu: 0   },
        sag:  { hedefYuzey: 4, girisKenar: 'sol', yonDonusumu: 0   },
        ust:  { hedefYuzey: 3, girisKenar: 'sag', yonDonusumu: 90  },
        // Üstten çıkınca yüzey 3'e geçilir ama YÖN 90 DERECE DÖNER
        // Çünkü küpün köşesinde bükülme var
        alt:  { hedefYuzey: 6, girisKenar: 'sag', yonDonusumu: -90 }
    },
    3: {
        // Yüzey 3 (Üst)
        alt:  { hedefYuzey: 1, girisKenar: 'ust', yonDonusumu: 0   },
        ust:  { hedefYuzey: 4, girisKenar: 'ust', yonDonusumu: 180 },
        // 180 derece dönüş — arka yüze geçince baş aşağı oluyoruz
        sol:  { hedefYuzey: 5, girisKenar: 'ust', yonDonusumu: -90 },
        sag:  { hedefYuzey: 2, girisKenar: 'ust', yonDonusumu: 90  }
    },
    4: {
        // Yüzey 4 (Arka)
        sol:  { hedefYuzey: 2, girisKenar: 'sag', yonDonusumu: 0   },
        sag:  { hedefYuzey: 5, girisKenar: 'sol', yonDonusumu: 0   },
        ust:  { hedefYuzey: 3, girisKenar: 'ust', yonDonusumu: 180 },
        alt:  { hedefYuzey: 6, girisKenar: 'alt', yonDonusumu: 180 }
    },
    5: {
        // Yüzey 5 (Sol)
        sag:  { hedefYuzey: 1, girisKenar: 'sol', yonDonusumu: 0   },
        sol:  { hedefYuzey: 4, girisKenar: 'sag', yonDonusumu: 0   },
        ust:  { hedefYuzey: 3, girisKenar: 'sol', yonDonusumu: -90 },
        alt:  { hedefYuzey: 6, girisKenar: 'sol', yonDonusumu: 90  }
    },
    6: {
        // Yüzey 6 (Alt)
        ust:  { hedefYuzey: 1, girisKenar: 'alt', yonDonusumu: 0   },
        alt:  { hedefYuzey: 4, girisKenar: 'alt', yonDonusumu: 180 },
        sol:  { hedefYuzey: 5, girisKenar: 'alt', yonDonusumu: 90  },
        sag:  { hedefYuzey: 2, girisKenar: 'alt', yonDonusumu: -90 }
    }
};


// ------------------------------------------
// YÜZEY DEĞİŞTİR
//
// Oyuncu bir yüzeyin kenarından çıkınca bu
// fonksiyon çağrılır. Topun yeni konumunu ve
// hız yönünü hesaplayarak döndürür.
//
// Örnek kullanım:
//   yuzeyDegistir(top, 'sag', canvas.width, canvas.height)
//   → top yüzey 1'in sağından çıktı
//   → yüzey 2'nin solundan giriyor
//   → konum ve hız güncellendi
// ------------------------------------------
function yuzeyDegistir(top, cikilanKenar, ekranEn, ekranBoy) {

    // Geçiş bilgisini haritadan al
    let gecis = gecisHaritasi[aktifYuzey][cikilanKenar];

    if (!gecis) {
        // Bağlantı tanımlanmamışsa bir şey yapma
        return;
    }

    // Yüzeyi güncelle
    aktifYuzey = gecis.hedefYuzey;

    // --- YENİ KONUMU HESAPLA ---
    // Hangi kenardan giriyorsa o kenara yakın bir konuma koy
    // Kenar boyunca pozisyon korunur (geçiş yumuşak görünsün)

    let kenarPayi = top.r + 2; // Duvarın içine gömülmesin diye küçük boşluk

    // Eski yüzeydeki "kenar boyunca" pozisyon oranını hesapla
    // Örneğin sağ/sol kenardan geçiyorsa Y konumu korunur
    // Üst/alt kenardan geçiyorsa X konumu korunur
    let oran; // 0 ile 1 arasında — kenar üzerindeki konum yüzdesi

    if (cikilanKenar === 'sag' || cikilanKenar === 'sol') {
        oran = top.y / ekranBoy;
    } else {
        oran = top.x / ekranEn;
    }

    // Yön dönüşümü varsa oranı da döndür
    // 90 derece dönüşte X↔Y yer değiştirir
    if (Math.abs(gecis.yonDonusumu) === 90) {
        oran = 1 - oran; // 90 veya -90 derecede ters taraftan giriş
    }

    // Giriş kenarına göre yeni konumu belirle
    if (gecis.girisKenar === 'sol') {
        top.x = kenarPayi;
        top.y = oran * ekranBoy;
    } else if (gecis.girisKenar === 'sag') {
        top.x = ekranEn - kenarPayi;
        top.y = oran * ekranBoy;
    } else if (gecis.girisKenar === 'ust') {
        top.y = kenarPayi;
        top.x = oran * ekranEn;
    } else if (gecis.girisKenar === 'alt') {
        top.y = ekranBoy - kenarPayi;
        top.x = oran * ekranEn;
    }

    // --- HIZ VEKTÖRÜNÜ DÖNDÜR ---
    // Yön dönüşümü kaç derece ise hız vektörü o kadar döner
    let aciRadyan = gecis.yonDonusumu * (Math.PI / 180);
    let eskiHizX = top.hizX;
    let eskiHizY = top.hizY;

    // 2D rotasyon matrisi (basit trigonometri):
    // yeniX = eskiX * cos(a) - eskiY * sin(a)
    // yeniY = eskiX * sin(a) + eskiY * cos(a)
    top.hizX = eskiHizX * Math.cos(aciRadyan) - eskiHizY * Math.sin(aciRadyan);
    top.hizY = eskiHizX * Math.sin(aciRadyan) + eskiHizY * Math.cos(aciRadyan);
}


// ------------------------------------------
// TEMEL FİZİK FONKSİYONLARI
// ------------------------------------------

// Topu hareket ettir — aktif yüzeyin yerçekimini kullan
function topuHarekettir(top) {
    if (!top.hareketEdiyor) return;

    let yer = aktifYerekimi();

    top.hizX += yer.x;
    top.hizY += yer.y;

    top.hizX *= 0.99;  // hafif sürtünme
    top.hizY *= 0.99;

    top.x += top.hizX;
    top.y += top.hizY;
}

// Ekran sınırlarını kontrol et
// Eğer top bir kenara çıkarsa yüzey geçişi tetiklenir
function sinirKontrol(top, ekranEn, ekranBoy) {
    const sekme = 0.65;

    // Sol kenara çarptı mı?
    if (top.x - top.r < 0) {
        yuzeyDegistir(top, 'sol', ekranEn, ekranBoy);
        return; // Geçiş oldu, diğer kontrollere bakma
    }

    // Sağ kenara çarptı mı?
    if (top.x + top.r > ekranEn) {
        yuzeyDegistir(top, 'sag', ekranEn, ekranBoy);
        return;
    }

    // Üst kenara çarptı mı?
    if (top.y - top.r < 0) {
        yuzeyDegistir(top, 'ust', ekranEn, ekranBoy);
        return;
    }

    // Alt kenara çarptı mı?
    if (top.y + top.r > ekranBoy) {
        // Yerçekimi aşağı ise zemine oturuyor (geçiş değil, sekme)
        let yer = aktifYerekimi();
        if (yer.y > 0) {
            // Normal zemin — sekme
            top.y = ekranBoy - top.r;
            top.hizY = -Math.abs(top.hizY) * sekme;

            if (Math.abs(top.hizY) < 0.5) {
                top.hizY = 0;
                top.hareketEdiyor = false;
            }
        } else {
            // Yerçekimi aşağı değilse — geçiş
            yuzeyDegistir(top, 'alt', ekranEn, ekranBoy);
        }
        return;
    }
}

// Çizgi parçası ile daire çarpışması
function carpismavar(top, seg) {
    let dx = seg.sonX - seg.basX;
    let dy = seg.sonY - seg.basY;
    let uzunlukKare = dx * dx + dy * dy;
    if (uzunlukKare === 0) return false;

    let t = Math.max(0, Math.min(1,
        ((top.x - seg.basX) * dx + (top.y - seg.basY) * dy) / uzunlukKare
    ));
    let yakinX = seg.basX + t * dx;
    let yakinY = seg.basY + t * dy;
    return Math.hypot(top.x - yakinX, top.y - yakinY) < top.r;
}

// Kapıya çarpınca hızı yansıt
function hiziYansit(top, kapiAcisi) {
    let nx = Math.cos(kapiAcisi + Math.PI / 2);
    let ny = Math.sin(kapiAcisi + Math.PI / 2);
    let nokta = top.hizX * nx + top.hizY * ny;
    top.hizX = top.hizX - 2 * nokta * nx;
    top.hizY = top.hizY - 2 * nokta * ny;
}