/**
 * Panda Labirent – Android projesini derlemeden önce hazırlar.
 * `npx cap add android` SONRASINDA çalıştırılır (GitHub Actions bunu otomatik yapar).
 *
 *  1) native/*.java  → MainActivity (tam ekran) + Türkçe seslendirme eklentisi
 *  2) AndroidManifest → yatay ekran (capacitor.config.json > pandaBuild.orientation)
 *  3) icons/android/res → uygulama ikonları (normal, yuvarlak, adaptif)
 *  4) icons/splash → açılış (launch) görseli, Capacitor logosunun yerine
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'capacitor.config.json'), 'utf8'));
const build = cfg.pandaBuild || {};
const MAIN = path.join(ROOT, 'android', 'app', 'src', 'main');
const RES = path.join(MAIN, 'res');

function fail(msg) { console.error('❌ ' + msg); process.exit(1); }
function ok(msg) { console.log('✅ ' + msg); }
if (!fs.existsSync(MAIN)) fail('android/ klasörü yok. Önce `npx cap add android` çalıştırın.');

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// ---------- 1) Java kaynakları ----------
const pkgDir = path.join(MAIN, 'java', ...cfg.appId.split('.'));
fs.mkdirSync(pkgDir, { recursive: true });
for (const f of fs.readdirSync(pkgDir)) {
  if (/^MainActivity\.(kt|java)$/.test(f)) fs.unlinkSync(path.join(pkgDir, f));
}
for (const f of fs.readdirSync(path.join(ROOT, 'native')).filter(f => f.endsWith('.java'))) {
  const src = fs.readFileSync(path.join(ROOT, 'native', f), 'utf8')
    .replace(/^package\s+[\w.]+;/m, `package ${cfg.appId};`);
  fs.writeFileSync(path.join(pkgDir, f), src);
}
ok('MainActivity (tam ekran) + TextToSpeech eklentisi → ' + path.relative(ROOT, pkgDir));

// ---------- 2) Manifest: ekran yönü ----------
const manPath = path.join(MAIN, 'AndroidManifest.xml');
let man = fs.readFileSync(manPath, 'utf8');
const orientation = build.orientation || 'sensorLandscape';
const actRe = /<activity\b[^>]*?MainActivity[^>]*?>/s;
const act = man.match(actRe);
if (!act) fail('AndroidManifest.xml içinde MainActivity bulunamadı.');
let newAct = act[0].replace(/\s*android:screenOrientation="[^"]*"/, '');
newAct = newAct.replace(/<activity\b/, `<activity\n            android:screenOrientation="${orientation}"`);
man = man.replace(act[0], newAct);
fs.writeFileSync(manPath, man);
ok('Ekran yönü: ' + orientation);

// ---------- 3) İkonlar ----------
const iconRes = path.join(ROOT, 'icons', 'android', 'res');
if (!fs.existsSync(iconRes)) fail('icons/android/res bulunamadı.');
copyDir(iconRes, RES);
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
fs.mkdirSync(path.join(RES, 'mipmap-anydpi-v26'), { recursive: true });
fs.writeFileSync(path.join(RES, 'mipmap-anydpi-v26', 'ic_launcher.xml'), adaptive);
fs.writeFileSync(path.join(RES, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'), adaptive);
fs.mkdirSync(path.join(RES, 'values'), { recursive: true });
fs.writeFileSync(path.join(RES, 'values', 'ic_launcher_background.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#BCE9FB</color>
</resources>
`);
ok('Uygulama ikonları kopyalandı');

// ---------- 4) Açılış görseli ----------
const land = path.join(ROOT, 'icons', 'splash', 'splash-land.png');
const port = path.join(ROOT, 'icons', 'splash', 'splash-port.png');
let n = 0;
for (const f of walk(RES)) {
  if (path.basename(f) !== 'splash.png') continue;
  fs.copyFileSync(/-port/.test(path.basename(path.dirname(f))) ? port : land, f);
  n++;
}
if (n === 0) {                                   // şablonda splash yoksa varsayılan konuma koy
  fs.mkdirSync(path.join(RES, 'drawable'), { recursive: true });
  fs.copyFileSync(land, path.join(RES, 'drawable', 'splash.png'));
  n = 1;
}
ok(`Açılış görseli güncellendi (${n} dosya)`);
console.log('🐼 Android projesi hazır.');
