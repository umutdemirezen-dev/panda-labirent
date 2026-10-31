# 🐼 Panda Labirent – Sevimli Hayvanlar Labirent Macerası

Panda Games Studio · Capacitor 7 · Android (yatay ekran)

## APK nasıl alınır?

1. GitHub'da yeni bir depo aç (ör. `panda-labirent`).
2. Bu ZIP'in **içindeki** tüm dosya ve klasörleri deponun ana dizinine yükle.
   ⚠️ `.github` klasörü gizli klasördür; yüklendiğinden emin ol
   (depoda `.github/workflows/build.yml` görünmeli).
3. Yükleme (commit) yapılınca **Actions** sekmesinde "Android APK Derle" kendiliğinden başlar.
   Elle başlatmak için: Actions → Android APK Derle → **Run workflow**.
4. ~5-8 dakika sonra yeşil tik çıkınca çalışmaya tıkla → en altta **Artifacts → app-debug**
   indir → ZIP'in içinden `app-debug.apk` çıkar → telefona/tablete kur.

## Klasörler

| Yol | Ne işe yarar |
|---|---|
| `www/index.html` | Oyunun tamamı (tek dosya) |
| `capacitor.config.json` | Uygulama adı **Panda Labirent**, paket kimliği **com.pandagames.labirent**, yön ayarı (`pandaBuild.orientation`) |
| `package.json` | Capacitor 7 bağımlılıkları |
| `icons/` | Uygulama ikonları (tüm Android boyutları + adaptif), Play Store ikonu (512/1024), açılış görseli |
| `native/` | `MainActivity.java` (tam ekran, ekran kararmaz) ve `PandaTtsPlugin.java` (Türkçe seslendirme) |
| `scripts/patch-android.js` | Derlemeden önce ikonları, yatay ekranı ve yerel kodu Android projesine işler |
| `.github/workflows/build.yml` | GitHub Actions derleme dosyası |

## Notlar

- `android/` klasörü depoya konmaz; her derlemede sıfırdan oluşturulur.
- Android WebView tarayıcı seslendirmesini desteklemediği için Türkçe konuşma,
  Android'in kendi TextToSpeech motoruyla yapılır (`native/PandaTtsPlugin.java`).
  Cihazda Google Konuşma Hizmetleri + Türkçe ses paketi olmalıdır (çoğu cihazda hazırdır).
- Satın alma şu an **test modunda**dır (gerçek para çekilmez). Google Play Billing için
  Android tarafında `window.PandaBilling` köprüsü eklenecek.
- Oyunu güncellemek için sadece `www/index.html` dosyasını değiştirip yüklemek yeterli.
