// ==========================================
// oyun.js — Ana Oyun Motoru
// Bu dosya fizik.js'deki fonksiyonları kullanır.
// Çizim, kontrol, seviye yönetimi hep burada.
// ==========================================


// ------------------------------------------
// 1. CANVAS KURULUMU
// HTML'deki <canvas> elementini JavaScript'e bağlıyoruz.
// 'cizim' değişkeni tüm çizim komutlarının çalıştığı kalem gibidir.
// ------------------------------------------
const canvas = document.getElementById('oyunCanvas');
const cizim = canvas.getContext('2d'); // 2D modda aç

canvas.width = 900;
canvas.height = 600;


// ------------------------------------------
// 2. OYUN DURUMU DEĞİŞKENLERİ
// Oyunun hangi ekranda olduğunu takip eder.
// Bu değişkene göre hangi şeylerin çizileceğine
// ve hangi kontrollerin çalışacağına karar veririz.
// ------------------------------------------
let oyunDurumu = 'MENU'; // 'MENU' | 'OYNANIYOR' | 'DURDURULDU' | 'BITTI'
let kacinciSeviye = 0;   // Hangi seviyedeyiz (dizi indeksi, 0'dan başlar)
let kalanHamle = 3;      // Her seviyede kaç atış hakkımız var


// ------------------------------------------
// 3. TOP OBJESİ
// Oyuncunun fırlattığı topu.
// hizX ve hizY her frame konuma eklenir — böylece hareket olur.
// fizik.js'deki topuHarekettir() bu objeyi kullanır.
// ------------------------------------------
let topu = {
    x: 150, y: 300,  // Ekrandaki konum (piksel)
    r: 14,            // Yarıçap — çarpışma hesaplarında kullanılır
    hizX: 0,          // Yatay hız — pozitif = sağa, negatif = sola
    hizY: 0,          // Dikey hız — pozitif = aşağı, negatif = yukarı
    hareketEdiyor: false  // Fırlatıldı mı? Duruyorsa false.
};


// ------------------------------------------
// 4. HEDEF OBJESİ
// Topun ulaşması gereken yeşil daire.
// ------------------------------------------
let hedef = {
    x: 750, y: 300,
    r: 22
};


// ------------------------------------------
// 5. DÖNEN KAPI SINIFI
// Her kapı bir çizgi parçasıdır — merkez nokta, uzunluk ve açıyla tanımlanır.
// Her frame guncelle() çağrılınca aci değişir, kapı döner.
// uclariGetir() fonksiyonu fizik.js'deki carpismavar() için gereklidir.
// ------------------------------------------
class DonenKapi {
    constructor(x, y, uzunluk, baslangicAcisi, donusHizi, renk) {
        this.x = x;                      // Merkez nokta X
        this.y = y;                      // Merkez nokta Y
        this.uzunluk = uzunluk;          // Kapının piksel uzunluğu
        this.aci = baslangicAcisi;       // Başlangıç açısı (radyan cinsinden)
        this.donusHizi = donusHizi;      // Her frame kaç radyan dönecek
        this.renk = renk;                // Çizim rengi
    }

    // Her frame çağrılır — açıyı artırarak kapıyı döndürür
    guncelle() {
        this.aci += this.donusHizi;
        // Not: Math.PI * 2 = 360 derece, yani tam tur
        // donusHizi = 0.02 ise saniyede yaklaşık 72 derece döner (60fps'de)
    }

    // Kapının iki uç noktasını hesaplar
    // Bu noktalar fizik.js'deki carpismavar() fonksiyonuna gönderilir
    uclariGetir() {
        let yari = this.uzunluk / 2;
        return {
            basX: this.x + Math.cos(this.aci) * yari,
            basY: this.y + Math.sin(this.aci) * yari,
            sonX: this.x - Math.cos(this.aci) * yari,
            sonY: this.y - Math.sin(this.aci) * yari
        };
    }

    // Kapıyı canvas'a çizer
    ciz() {
        let uclar = this.uclariGetir();

        // Kapı gövdesi — iki uç nokta arasına çizgi çek
        cizim.beginPath();
        cizim.moveTo(uclar.basX, uclar.basY);
        cizim.lineTo(uclar.sonX, uclar.sonY);
        cizim.strokeStyle = this.renk;
        cizim.lineWidth = 4;
        cizim.lineCap = 'round'; // Uçlar yuvarlak görünsün
        cizim.stroke();

        // Merkezdeki döndürme noktasını küçük daire ile göster
        cizim.beginPath();
        cizim.arc(this.x, this.y, 5, 0, Math.PI * 2);
        cizim.fillStyle = '#ffffff';
        cizim.fill();
    }
}


// ------------------------------------------
// 6. SEVİYELER
// Her seviye: topun başlangıç yeri, hedefin yeri ve kapıların listesi.
// Kapılar DonenKapi sınıfından oluşturulur.
// Yeni seviye eklemek için bu diziye yeni bir obje ekle.
// ------------------------------------------
const seviyeler = [

    // SEVİYE 1 — Tek kapı, geniş alan, alışmak için
    {
        topX: 150, topY: 300,
        hedefX: 750, hedefY: 300,
        kapilar: [
            // Ortada yavaş dönen mavi kapı
            // Math.PI / 4 = 45 derece başlangıç açısı
            new DonenKapi(450, 300, 130, Math.PI / 4, 0.015, '#60d0ff')
        ]
    },

    // SEVİYE 2 — İki kapı, farklı yönlerde dönüyorlar
    {
        topX: 150, topY: 150,
        hedefX: 750, hedefY: 450,
        kapilar: [
            // Saat yönünde dönen pembe kapı (donusHizi pozitif)
            new DonenKapi(350, 250, 110, 0, 0.02, '#ff60a0'),
            // Saat yönünün tersine dönen mavi kapı (donusHizi negatif)
            new DonenKapi(580, 380, 110, Math.PI / 2, -0.018, '#60d0ff')
        ]
    },

    // SEVİYE 3 — Üç kapı, dar geçitler, farklı yüzeyler gerekli
    {
        topX: 150, topY: 500,
        hedefX: 750, hedefY: 100,
        kapilar: [
            new DonenKapi(280, 300, 100, 0,            0.025, '#ff9060'),
            new DonenKapi(500, 200, 120, Math.PI / 3, -0.02,  '#60d0ff'),
            new DonenKapi(680, 400, 90,  Math.PI,      0.03,  '#ff60a0')
        ]
    }
];


// ------------------------------------------
// 7. HUD GÜNCELLEME
// HTML'deki bilgi çubuğundaki yazıları günceller.
// document.getElementById ile HTML elementine ulaşıp
// içeriğini değiştiriyoruz.
// aktifYuzey değişkeni fizik.js'de tanımlanmıştır.
// ------------------------------------------
function hudGuncelle() {
    document.getElementById('seviyeNo').innerText = kacinciSeviye + 1;
    document.getElementById('hamleNo').innerText = kalanHamle;

    // aktifYuzey fizik.js'den geliyor — hangi küp yüzündeyiz
    // yerekimiYonleri de fizik.js'den — o yüzün yerçekimi yönü
    let yer = yerekimiYonleri[aktifYuzey];
    let yonYazi = '';
    if (yer.y > 0) yonYazi = 'Aşağı ↓';
    else if (yer.y < 0) yonYazi = 'Yukarı ↑';
    else if (yer.x > 0) yonYazi = 'Sağa →';
    else if (yer.x < 0) yonYazi = 'Sola ←';

    document.getElementById('yuzAd').innerText = 'Yüzey ' + aktifYuzey + ' (' + yonYazi + ')';
}


// ------------------------------------------
// 8. SEVİYEYİ HAZIRLA
// Seçilen seviyenin verilerini oyuna uygular.
// Topu ve hedefi doğru yere koyar, sayaçları sıfırlar.
// ------------------------------------------
function seviyeyiHazirla(indeks) {
    let bolum = seviyeler[indeks];

    // Topu başlangıç konumuna taşı ve durdur
    topu.x = bolum.topX;
    topu.y = bolum.topY;
    topu.hizX = 0;
    topu.hizY = 0;
    topu.hareketEdiyor = false;

    // Hedefi doğru yere koy
    hedef.x = bolum.hedefX;
    hedef.y = bolum.hedefY;

    // Yüzeyi sıfırla — her seviyeye normal yerçekimiyle başla
    // aktifYuzey fizik.js'de tanımlı, burada sıfırlıyoruz
    aktifYuzey = 1;

    // Hamle hakkını sıfırla
    kalanHamle = 3;

    hudGuncelle();
}


// ------------------------------------------
// 9. FARE KONTROLLERİ — SAPAN MEKANİĞİ
// Oyuncu fareyi basılı tutup çekip bırakır.
// Bırakma noktası ile basma noktası arasındaki fark
// topun hızını belirler — ne kadar çekersen o kadar hızlı.
// ------------------------------------------
let fareBasili = false;
let cekisBaslangic = { x: 0, y: 0 };
let cekisSon = { x: 0, y: 0 };

// Fare tıklandığında — nişan almaya başla
canvas.addEventListener('mousedown', function(e) {
    // Oyun oynamıyorsa veya top zaten uçuyorsa atış yapma
    if (oyunDurumu !== 'OYNANIYOR' || topu.hareketEdiyor) return;

    fareBasili = true;
    cekisBaslangic = { x: e.offsetX, y: e.offsetY };
    cekisSon = { x: e.offsetX, y: e.offsetY };
});

// Fare hareket edince — nişan çizgisini güncelle
canvas.addEventListener('mousemove', function(e) {
    if (!fareBasili) return;
    cekisSon = { x: e.offsetX, y: e.offsetY };
});

// Fare bırakılınca — topu fırlat
canvas.addEventListener('mouseup', function(e) {
    if (!fareBasili) return;
    fareBasili = false;

    // Hız = (bırakma - basma) * güç katsayısı
    // 0.12 katsayısı çok hızlı gitmemesi için ayarlandı
    let gucKatsayi = 0.12;
    topu.hizX = (e.offsetX - cekisBaslangic.x) * gucKatsayi;
    topu.hizY = (e.offsetY - cekisBaslangic.y) * gucKatsayi;

    // Maksimum hız sınırı — Math.hypot iki kenardan hipotenüsü bulur
    // yani hız vektörünün büyüklüğünü hesaplar
    let toplamHiz = Math.hypot(topu.hizX, topu.hizY);
    if (toplamHiz > 18) {
        // Oranı koruyarak 18'e düşür
        topu.hizX = (topu.hizX / toplamHiz) * 18;
        topu.hizY = (topu.hizY / toplamHiz) * 18;
    }

    topu.hareketEdiyor = true;
    kalanHamle--;
    hudGuncelle();
});


// ------------------------------------------
// 10. KLAVYE KONTROLLERİ
// R = seviyeyi yeniden başlat
// ESC = duraklat / devam et
// ------------------------------------------
document.addEventListener('keydown', function(e) {
    let tus = e.key.toLowerCase();

    if (tus === 'r' && oyunDurumu === 'OYNANIYOR') {
        seviyeyiHazirla(kacinciSeviye);
    }

    if (tus === 'escape') {
        if (oyunDurumu === 'OYNANIYOR') {
            oyunDurumu = 'DURDURULDU';
            document.getElementById('duraklatEkrani').classList.remove('gizli');
        } else if (oyunDurumu === 'DURDURULDU') {
            oyunDurumu = 'OYNANIYOR';
            document.getElementById('duraklatEkrani').classList.add('gizli');
        }
    }
});


// ------------------------------------------
// 11. ÇİZİM FONKSİYONLARI
// Her frame ekran tamamen silinip yeniden çizilir.
// Bu "dirty rect" değil "full repaint" yaklaşımıdır —
// basit ama 60fps'de sorunsuz çalışır.
// ------------------------------------------

// Arkaplanı çiz — koyu zemin + ızgara deseni
function arkaplanCiz() {
    cizim.fillStyle = '#0d0d1a';
    cizim.fillRect(0, 0, canvas.width, canvas.height);

    // Izgara çizgileri — oyuna derinlik hissi verir
    cizim.strokeStyle = 'rgba(50, 50, 90, 0.35)';
    cizim.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        cizim.beginPath();
        cizim.moveTo(i, 0);
        cizim.lineTo(i, canvas.height);
        cizim.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
        cizim.beginPath();
        cizim.moveTo(0, i);
        cizim.lineTo(canvas.width, i);
        cizim.stroke();
    }
}

// Yerçekimi yönünü ekranda ok ile göster
// Oyuncu hangi yüzeyde olduğunu anlasın
function yerekimiOkuCiz() {
    let yer = yerekimiYonleri[aktifYuzey]; // fizik.js'den geliyor
    let okX = canvas.width - 60;
    let okY = 60;
    let buyukluk = 30;

    // Ok gövdesi
    cizim.beginPath();
    cizim.moveTo(okX, okY);
    cizim.lineTo(okX + yer.x * buyukluk * 2, okY + yer.y * buyukluk * 2);
    cizim.strokeStyle = '#ffdd60';
    cizim.lineWidth = 3;
    cizim.stroke();

    // Ok ucu (küçük daire)
    cizim.beginPath();
    cizim.arc(okX + yer.x * buyukluk * 2, okY + yer.y * buyukluk * 2, 5, 0, Math.PI * 2);
    cizim.fillStyle = '#ffdd60';
    cizim.fill();

    // Etiket
    cizim.fillStyle = '#ffdd60';
    cizim.font = '11px Courier New';
    cizim.fillText('YERÇEKİMİ', okX - 20, okY - 12);
}

// Hedefi çiz — yeşil parlayan daire
function hedefiCiz() {
    // Dış parlama halkası
    cizim.beginPath();
    cizim.arc(hedef.x, hedef.y, hedef.r + 8, 0, Math.PI * 2);
    cizim.strokeStyle = 'rgba(96, 255, 144, 0.25)';
    cizim.lineWidth = 5;
    cizim.stroke();

    // İç dolu daire
    cizim.beginPath();
    cizim.arc(hedef.x, hedef.y, hedef.r, 0, Math.PI * 2);
    cizim.fillStyle = 'rgba(96, 255, 144, 0.2)';
    cizim.fill();
    cizim.strokeStyle = '#60ff90';
    cizim.lineWidth = 2;
    cizim.stroke();
}

// Topu çiz — rengi aktif yüzeyin yerçekimi yönüne göre değişir
function topuCiz() {
    // Aktif yüzeye göre renk seç — fizik.js'deki yerekimiYonleri'nden al
    let yer = yerekimiYonleri[aktifYuzey];
    let topRenk = '#a090ff'; // varsayılan mor
    if (yer.y > 0) topRenk = '#a090ff';      // normal — mor
    else if (yer.y < 0) topRenk = '#60d0ff'; // ters yerçekimi — mavi
    else if (yer.x > 0) topRenk = '#ff9060'; // sağa çekim — turuncu
    else if (yer.x < 0) topRenk = '#ff60a0'; // sola çekim — pembe

    // Işıma efekti — shadowBlur ile neon görünümü
    cizim.shadowColor = topRenk;
    cizim.shadowBlur = 18;

    cizim.beginPath();
    cizim.arc(topu.x, topu.y, topu.r, 0, Math.PI * 2);
    cizim.fillStyle = topRenk;
    cizim.fill();

    // Parlak iç nokta — topun küresel göründüğü his verir
    cizim.shadowBlur = 0; // İç nokta için ışımayı kapat
    cizim.beginPath();
    cizim.arc(topu.x - topu.r * 0.3, topu.y - topu.r * 0.3, topu.r * 0.35, 0, Math.PI * 2);
    cizim.fillStyle = 'rgba(255, 255, 255, 0.5)';
    cizim.fill();

    cizim.shadowBlur = 0;
}

// Nişan çizgisi — fare basılıyken toptan imleç yönüne kesik çizgi
function nisanCiz() {
    if (!fareBasili || topu.hareketEdiyor) return;

    cizim.beginPath();
    cizim.moveTo(topu.x, topu.y);
    cizim.lineTo(cekisSon.x, cekisSon.y);
    cizim.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    cizim.lineWidth = 2;
    cizim.setLineDash([6, 6]); // Kesik çizgi: 6px çiz, 6px boş bırak
    cizim.stroke();
    cizim.setLineDash([]); // Sıfırla — diğer çizimler etkilenmesin
}

// Küp HUD — sol üst köşede hangi yüzeyde olduğumuzu gösterir
// İzometrik küp çizimi: 3 paralel kenar şeklinde
function kupHudCiz() {
    let mx = 70;  // Küpün merkez X
    let my = 70;  // Küpün merkez Y
    let b = 22;   // Kenar uzunluğu

    // İzometrik küp için 3 görünen yüzün köşe noktaları
    // Üst yüz — paralelkenar
    let ustOrta  = { x: mx,     y: my - b };
    let ustSag   = { x: mx + b, y: my - b/2 };
    let ustMerkez= { x: mx,     y: my };
    let ustSol   = { x: mx - b, y: my - b/2 };

    // Sol alt yüz
    let solAlt   = { x: mx - b, y: my + b/2 };

    // Sağ alt yüz
    let sagAlt   = { x: mx + b, y: my + b/2 };

    // Alt orta
    let altOrta  = { x: mx,     y: my + b };

    // Aktif yüzeyi parlat, diğerlerini koyu göster
    // Yüzey numarası ile hangi kısım parlayacak eşleştiriliyor
    let parlak = 'rgba(160, 144, 255, 0.8)';
    let koyu   = 'rgba(40, 40, 80, 0.8)';

    // Üst yüz (yüzey 3)
    cizim.beginPath();
    cizim.moveTo(ustOrta.x,   ustOrta.y);
    cizim.lineTo(ustSag.x,    ustSag.y);
    cizim.lineTo(ustMerkez.x, ustMerkez.y);
    cizim.lineTo(ustSol.x,    ustSol.y);
    cizim.closePath();
    cizim.fillStyle = (aktifYuzey === 3) ? parlak : koyu;
    cizim.fill();
    cizim.strokeStyle = '#6060aa';
    cizim.lineWidth = 1;
    cizim.stroke();

    // Sol yüz (yüzey 5)
    cizim.beginPath();
    cizim.moveTo(ustSol.x,    ustSol.y);
    cizim.lineTo(ustMerkez.x, ustMerkez.y);
    cizim.lineTo(altOrta.x,   altOrta.y);
    cizim.lineTo(solAlt.x,    solAlt.y);
    cizim.closePath();
    cizim.fillStyle = (aktifYuzey === 5) ? parlak : koyu;
    cizim.fill();
    cizim.stroke();

    // Sağ yüz (yüzey 2)
    cizim.beginPath();
    cizim.moveTo(ustMerkez.x, ustMerkez.y);
    cizim.lineTo(ustSag.x,    ustSag.y);
    cizim.lineTo(sagAlt.x,    sagAlt.y);
    cizim.lineTo(altOrta.x,   altOrta.y);
    cizim.closePath();
    cizim.fillStyle = (aktifYuzey === 2) ? parlak : koyu;
    cizim.fill();
    cizim.stroke();

    // Yüzey numarasını küpün altına yaz
    cizim.fillStyle = '#c0b8ff';
    cizim.font = '11px Courier New';
    cizim.fillText('YÜZ: ' + aktifYuzey, mx - 18, my + b + 18);
}

// Ana çizim fonksiyonu — her frame çağrılır
function ekraniCiz() {
    arkaplanCiz();

    // Oyun ekranındayken objeleri çiz
    if (oyunDurumu === 'OYNANIYOR' || oyunDurumu === 'DURDURULDU') {
        let bolum = seviyeler[kacinciSeviye];

        hedefiCiz();

        // Tüm kapıları çiz
        for (let i = 0; i < bolum.kapilar.length; i++) {
            bolum.kapilar[i].ciz();
        }

        topuCiz();
        nisanCiz();
        yerekimiOkuCiz(); // Sağ üstte yerçekimi oku
        kupHudCiz();      // Sol üstte küp göstergesi
    }
}


// ------------------------------------------
// 12. ANA OYUN DÖNGÜSÜ
// requestAnimationFrame tarayıcının ekran
// yenileme hızına (genellikle 60fps) göre
// bu fonksiyonu tekrar tekrar çağırır.
// Sıra: fizik güncelle → çarpışmaları kontrol et → ekranı çiz → tekrar et
// ------------------------------------------
function anaDongu() {

    if (oyunDurumu === 'OYNANIYOR') {
        let bolum = seviyeler[kacinciSeviye];

        // Kapıları döndür
        for (let i = 0; i < bolum.kapilar.length; i++) {
            bolum.kapilar[i].guncelle();
        }

        // Topu hareket ettir — fizik.js'den geliyor
        // Yerçekimi ve sürtünmeyi uygular, konumu günceller
        topuHarekettir(top);

        // Ekran sınırlarını kontrol et — fizik.js'den geliyor
        // Kenara çarparsa yüzey geçişi tetikleyebilir
        sinirKontrol(top, canvas.width, canvas.height);

        // Kapılara çarpma kontrolü
        for (let i = 0; i < bolum.kapilar.length; i++) {
            let kapi = bolum.kapilar[i];
            let uclar = kapi.uclariGetir();

            // carpismavar() fizik.js'den geliyor — daire+çizgi kesişimi
            if (carpismavar(top, uclar)) {

                // hiziYansit() fizik.js'den geliyor — yansıma formülü
                hiziYansit(top, kapi.aci);

                // Topun kapının içine gömülmesini engelle
                topu.x += topu.hizX * 2;
                topu.y += topu.hizY * 2;
            }
        }

        // Hedefe ulaşıldı mı?
        // Math.hypot = iki nokta arasındaki mesafe (Pisagor teoremi)
        let mesafe = Math.hypot(topu.x - hedef.x, topu.y - hedef.y);
        if (mesafe < topu.r + hedef.r) {
            topu.hareketEdiyor = false;

            // Başka seviye var mı?
            if (kacinciSeviye + 1 < seviyeler.length) {
                kacinciSeviye++;
                // 1 saniye bekleyip sonraki seviyeye geç
                setTimeout(function() {
                    seviyeyiHazirla(kacinciSeviye);
                }, 1000);
            } else {
                // Tüm seviyeler bitti
                oyunDurumu = 'BITTI';
                document.getElementById('bitisEkrani').classList.remove('gizli');
            }
        }

        // Top durdu ve hamle kalmadıysa seviyeyi sıfırla
        if (!topu.hareketEdiyor && kalanHamle <= 0) {
            setTimeout(function() {
                seviyeyiHazirla(kacinciSeviye);
            }, 800);
        }

        hudGuncelle();
    }

    // Ekranı çiz (duraklatılmışsa da çizilsin)
    ekraniCiz();

    // Döngüyü devam ettir
    requestAnimationFrame(anaDongu);
}


// ------------------------------------------
// 13. HTML BUTON OLAYLARI
// Ekrandaki butonlara tıklanınca ne olacağını tanımlar.
// classList.add('gizli') = ekranı gizle
// classList.remove('gizli') = ekranı göster
// ------------------------------------------

document.getElementById('baslatButon').addEventListener('click', function() {
    document.getElementById('baslangicEkrani').classList.add('gizli');
    document.getElementById('hud').classList.remove('gizli');
    kacinciSeviye = 0;
    oyunDurumu = 'OYNANIYOR';
    seviyeyiHazirla(0);
});

document.getElementById('devamButon').addEventListener('click', function() {
    oyunDurumu = 'OYNANIYOR';
    document.getElementById('duraklatEkrani').classList.add('gizli');
});

document.getElementById('tekrarButon').addEventListener('click', function() {
    document.getElementById('bitisEkrani').classList.add('gizli');
    kacinciSeviye = 0;
    oyunDurumu = 'OYNANIYOR';
    seviyeyiHazirla(0);
});


// ------------------------------------------
// 14. MOTORU BAŞLAT
// Döngüyü ilk kez çalıştır — program burada hayata girer
// ------------------------------------------
anaDongu();