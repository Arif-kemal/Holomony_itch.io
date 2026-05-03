/*hocam burda neler yapmam gerekiyor 
yapacağımız oyun 6 yüzlü bir küpte topumuzu çıkışa götürmeye çalışıyoruz her yüzde yer çekimi değişiyr ve topun hareketi etkileniyor. Bu kodda fizik sabitlerini ve küpün yüzlerinin özelliklerini tanımlamışsınız. Şimdi yapmanız gerekenler şunlar olabilir:o

görevlerimiz
Görev 1 — Canvas'ı bağla ve topu tanımla
Görev 2 → Hedef objesi + Kapi sınıfı
Görev 3 → Seviye verileri (kapılar + duvarlar)
Görev 4 → Çizim fonksiyonları (arkaplan, top, hedef)
Görev 5 → Fare girdisi (fırlatma)
Görev 6 → Fizik güncellemesi
Görev 7 → Çarpışma tespiti
Görev 8 → Küp yüz değişimi
Görev 9 → Oyun döngüsü
Görev 10 → Buton olayları
anladıysan koduları yazar mısın?*/

//kodu yaz lütfen

// Görev 1 — Canvas'ı bağla ve topu tanımla
const canvas = document.getElementById("oyunCanvas");
const ctx = canvas.getContext("2d");
const top = {
    x: 50,
    y: 50,
    radius: 10,
    hizX: 0,
    hizY: 0
};

// Görev 2 → Hedef objesi + Kapi sınıfı
class Kapi {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    ciz() {
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

const hedef = new Kapi(400, 300, 50, 50);       
// Görev 3 → Seviye verileri (kapılar + duvarlar)

// Görev 4 → Çizim fonksiyonları (arkaplan, top, hedef)
function cizArkaplan() {
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function cizTop() {
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(top.x, top.y, top.radius, 0, Math.PI * 2);
    ctx.fill();
}
function cizHedef() {
    hedef.ciz();
}   
// Görev 5 → Fare girdisi (fırlatma)
canvas.addEventListener("click", function(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    top.hizX = (mouseX - top.x) * 0.1;
    top.hizY = (mouseY - top.y) * 0.1;
});
// Görev 6 → Fizik güncellemesi
function fizikGuncelle() {
    const yuz = kupYuzleri[kup.mevcutYuz];
    top.hizX *= FIZIK.surtunem * yuz.hizCarpan;
    top.hizY *= FIZIK.surtunem * yuz.hizCarpan;
    top.hizY += FIZIK.yerekimi * yuz.yerekimiCarpan;
    if (top.hizX > FIZIK.maxHiz) top.hizX = FIZIK.maxHiz;
    if (top.hizX < -FIZIK.maxHiz) top.hizX = -FIZIK.maxHiz;
    if (top.hizY > FIZIK.maxHiz) top.hizY = FIZIK.maxHiz;
    if (top.hizY < -FIZIK.maxHiz) top.hizY = -FIZIK.maxHiz;
    top.x += top.hizX;
    top.y += top.hizY;
}
// Görev 7 → Çarpışma tespiti
function carpismalariKontrolEt() {
    // Duvar çarpışmaları
    if (top.x - top.radius < 0) {
        top.x = top.radius;
        top.hizX *= -FIZIK.duvarYitim;
    }

    if (top.x + top.radius > canvas.width) {
        top.x = canvas.width - top.radius;
        top.hizX *= -FIZIK.duvarYitim;
    }
    if (top.y - top.radius < 0) {
        top.y = top.radius;
        top.hizY *= -FIZIK.duvarYitim;
    }
    if (top.y + top.radius > canvas.height) {
        top.y = canvas.height - top.radius; 
        top.hizY *= -FIZIK.duvarYitim;
    }   
    // Hedef çarpışması
    if (top.x + top.radius > hedef.x && top.x - top.radius < hedef.x + hedef.width &&
        top.y + top.radius > hedef.y && top.y - top.radius < hedef.y + hedef.height) {
        alert("Tebrikler! Hedefe ulaştınız!");
        // Oyun sıfırlanabilir veya yeni seviye yüklenebilir
    }
}
// Görev 8 → Küp yüz değişimi
function yuzDegistir() {
    kup.mevcutYuz = (kup.mevcutYuz + 1) % kupYuzleri.length;
}
// Görev 9 → Oyun döngüsü
function oyunDongusu() {
    cizArkaplan();
    cizHedef();
    cizTop();
    fizikGuncelle();
    carpismalariKontrolEt();
    requestAnimationFrame(oyunDongusu);
}
// Görev 10 → Buton olayları
document.getElementById("yuzDegistirBtn").addEventListener("click", yuzDegistir);   
// Oyun döngüsünü başlat
oyunDongusu();



    