# Kaynak kod düzeni

Aether Media, mevcut React/Zustand frontend ve Rust/Tauri backend yapısını korur.
Modüller sorumluluklarına göre gruplandırılmıştır. `@/types`,
`@/store/queueStore`, `commands` ve `modules::ffmpeg` üzerinden yapılan mevcut
aktarımlar kullanılmaya devam eder.

## Frontend

- `App.tsx`, uygulamanın ana yapısını bir araya getirir. `useSessionRestore`,
  oturum geri yükleme iletişim kutusunu; `useFileImport`, dosyaların gruplar hâlinde
  içe aktarılmasını; `useFileDrop` ise işletim sisteminden gelen dosya bırakma
  olaylarını yönetir. Yerleşim ve ekran üstü katmanların arayüz kodu bileşenlerde bulunur.
- `components/file-table/FileTable.tsx`, filtreleme ve liste sanallaştırmasını
  koordine eder. `VirtualRow`, satır yüksekliklerini ölçer; `useScrollActivity`,
  kaydırma sırasında gösterilen yer tutucuları kontrol eder;
  `useFileTableActions`, seçim, silme ve klavye kısayollarını yönetir.
  Araç çubuğu ve durum filtreleri ayrı arayüz bileşenleridir.
- `components/file-table/row/`, satır etkileşimlerini, durum ve ilerleme
  gösterimini, genişletilmiş ayarları ve bağlam menüsünü içerir.
  `FileRow.tsx`, bu parçaları bir araya getirir.
- `components/settings/processing/`, çıktı biçimi, biçime özel kalite ve bit hızı
  kontrollerini içerir. `settings/naming/`, blok tanımlarını, sürüklenebilir
  blokları ve blok ekleme menüsünü barındırır. `SettingsPanel` ve `NamingConfig`,
  kendi bölümlerini koordine eder.
- `components/layout/useSidebar.ts`, yan panel işlemlerini ve kuyruk özetlerini
  yönetir; `Sidebar.tsx`, bunları ekranda gösterir.
- `store/queue/`, kuyruk işlemlerini öğeler, seçim, işleme, küçük resimler,
  dosyaya özel ayarlar ve oturum yönetimi olarak gruplandırır. `persistence.ts`,
  verilerin depolama için serileştirilmesini ve kaydedilmiş durumun geri
  yüklenmesini yönetir; `itemIndex.ts`, kimliğe göre erişim indeksini yeniden
  oluşturur. Tüm işlemler hâlâ `queueStore.ts` içinde Immer ve kalıcı depolama
  ara katmanıyla oluşturulan tek bir Zustand deposuna aittir.
- `hooks/useConversionQueue.ts`, kuyruğun çalıştırılmasını ve iptal edilmesini
  kontrol eder. `hooks/conversion/useConversionEvents.ts`, backend'in ilerleme
  ve tamamlanma olaylarını dinler. `lib/conversion/buildRequest.ts`, Tauri
  isteğini oluşturur.
- `types/`, medya biçimlerini, adlandırmayı, ayarları ve varsayılan değerleri,
  kuyruk ve olay türlerini, kalite tanımlarını ayrı dosyalarda tutar.
  `types/index.ts`, mevcut dışa açık API'yi sunar.

## Backend

- `commands.rs`, komutların dışa açıldığı ortak giriş noktasıdır.
  `commands/files.rs`, dosya bilgilerini ve varlık kontrollerini;
  `commands/thumbnails.rs`, küçük resim komutlarını yönetir.
  `commands/sidecars.rs`, motorların çalıştırılabilir dosya yollarını çözümler.
- `commands/conversion/mod.rs`, istekleri doğrular, dosya çakışmalarını çözer ve
  işlemleri yönlendirir. `copy.rs`, `video.rs` ve `image.rs`, sırasıyla mevcut
  kopyalama, FFmpeg ve ImageMagick işlemlerini yürütür. `output_path.rs`, çıktı
  adlandırmasını uygular.
- `modules/ffmpeg.rs`, mevcut argüman ve ilerleme yardımcılarını dışa aktarır.
  `modules/ffmpeg/`, argüman oluşturucuyu, kodlama seçeneklerini, yeniden
  boyutlandırma filtrelerini ve ilerleme bilgilerinin ayrıştırılmasını ayırır.
- `types.rs`, medya türlerini, dönüştürme seçeneklerini ve isteklerini, olay ve
  sonuç verilerini `types/` içinden yeniden dışa aktarır. Serde alan adları ve
  veri gösterimleri değişmemiştir.
- Süreç takibi, iptal sonrası temizlik, adlandırma, ImageMagick argümanlarının
  oluşturulması ve küçük resimlere ilişkin dosya sistemi yardımcıları mevcut,
  belirli bir sorumluluğa odaklanan modüllerinde kalır.

## Davranış kontrolleri

Depo kök dizininde çalıştırın:

```powershell
npm test
npm run build
cargo test --lib --locked --offline --manifest-path src-tauri/Cargo.toml
cargo build --locked --offline --manifest-path src-tauri/Cargo.toml
```

`npm test`, gerçek TypeScript kaynaklarını ve kurulu React, Zustand ve Immer
paketlerini kullanarak bu yapısal düzenlemeyi `c734d4b` commit'i ile
karşılaştırır. Bu commit'in yerel Git geçmişinde bulunması gerekir.
Ek bir test bağımlılığı gerekmez. Daha sonra davranışta bilinçli bir değişiklik
yapılırsa ilgili referans sürüm karşılaştırmaları da bu değişiklik kapsamında
gözden geçirilmelidir.

Test kapsamına tüm kuyruk işlemleri, kaydedilmiş oturumun geri yüklenmesi,
3.360 dönüştürme isteği kombinasyonu, oluşturulan ayar/satır/uygulama HTML
çıktıları, taşınan olay işleyicilerinin sözdizimi ağaçları, olaylara ilişkin
effect'ler, dışa aktarılan varsayılan değerler ve Rust fonksiyon gövdeleri girer.
Rust birim testleri ayrıca codec ve akış argümanlarını, ses kalitesi sınırlarını,
yeniden boyutlandırma filtrelerini, ilerleme bilgilerinin ayrıştırılmasını ve
küçük resim argümanlarını kapsar.

Frontend test düzeneği; depolama, UUID ve zaman üretimi ile yerel işletim sistemi
çağrılarının yerine test karşılıklarını kullanır. Görüntüleme karşılaştırmaları
HTML çıktısını denetler; tarayıcı yerleşimini veya işletim sistemi iletişim
kutularını denetlemez. Bu testler, masaüstü etkileşim kontrolünün yerini tutmaz.
Yapısal düzenleme; komut adlarını, olay adlarını ve verilerini, depolama
anahtarlarını, varsayılan değerleri ve mevcut işleme kurallarını korur.
