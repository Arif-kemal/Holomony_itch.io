// Fizik sabitleri — bunları değiştirerek oyunun hissini ayarlarsın
const FIZIK = {
    yerekimi: 0.25,
    surtunem: 0.99,
    duvarYitim: 0.70,
    maxHiz: 18
};

// Küpün 6 yüzü ve her yüzün fizik özellikleri
const kupYuzleri = [
    { ad: "Normal",    renk: "#a090ff", hizCarpan: 1.0, ziplamaCarpan: 0.70, yerekimiCarpan: 1.0 },
    { ad: "Hızlı",    renk: "#60d0ff", hizCarpan: 1.7, ziplamaCarpan: 0.50, yerekimiCarpan: 0.8 },
    { ad: "Ağır",     renk: "#ff9060", hizCarpan: 0.5, ziplamaCarpan: 0.90, yerekimiCarpan: 2.0 },
    { ad: "Zıplayıcı",renk: "#60ff90", hizCarpan: 0.9, ziplamaCarpan: 1.40, yerekimiCarpan: 0.6 },
    { ad: "Kaygan",   renk: "#ffdd60", hizCarpan: 1.2, ziplamaCarpan: 0.20, yerekimiCarpan: 1.0 },
    { ad: "Donuk",    renk: "#c0c0c0", hizCarpan: 0.3, ziplamaCarpan: 0.15, yerekimiCarpan: 1.5 }
];

// Şu an aktif olan yüz — 0'dan başlar
const kup = {
    mevcutYuz: 0
};