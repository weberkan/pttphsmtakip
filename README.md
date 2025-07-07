
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---

## Önemli Geliştirme Komutları

### Geliştirme Sunucusunu Yeniden Başlatma

`.env.local` dosyasını düzenledikten sonra, uygulamanın yeni ayarları okuyabilmesi için geliştirme sunucusunu yeniden başlatmanız gerekir.

1.  **Terminal Penceresini Bulun:** Kod düzenleyicinizin alt kısmında bulunan **Terminal** paneline tıklayın.
2.  **Sunucuyu Durdurun:** Klavyenizde **Ctrl** tuşuna basılı tutarken **C** tuşuna bir kez basın. `^C` gibi bir işaret göreceksiniz ve komut satırı tekrar yazılabilir hale gelecektir.
3.  **Yeniden Başlatın:** Şimdi klavyenizle aşağıdaki komutu yazın ve **Enter** tuşuna basın:
    ```bash
    npm run dev
    ```
4.  **Bekleyin:** Uygulamanın yeniden başlamasını bekleyin. Terminalde "ready" veya "started server" gibi bir mesaj göreceksiniz.

### Veritabanı ve Depolama Yapılandırmasını Güncelleme (Firebase Konsolu)

Uygulamanın veritabanına ve depolama alanına doğru ve verimli bir şekilde erişebilmesi için güvenlik kurallarının ve dizinlerin (index) Firebase Konsolu üzerinden ayarlanması gerekir.

**1. Firestore Güvenlik Kurallarını Güncelleme:**
Bu işlem, `PERMISSION_DENIED` hatalarını önlemek için kritik öneme sahiptir.
1.  **Firebase Konsolu**'na gidin ve projenizi seçin.
2.  Sol menüden **Build > Firestore Database**'e tıklayın.
3.  Üstteki sekmelerden **Kurallar (Rules)** sekmesine geçin.
4.  Editördeki mevcut tüm metni silin ve projenizdeki `firestore.rules` dosyasının içeriğini buraya yapıştırın.
5.  **Yayınla (Publish)** butonuna tıklayın.

**2. Firestore Dizinlerini (Indexes) Güncelleme:**
Bazı karmaşık sorgular, Firebase'in verileri hızlıca bulabilmesi için bir dizin gerektirir. Eğer uygulamada gezinirken `The query requires an index` şeklinde bir hata alırsanız:
1.  **En Kolay Yol:** Hata mesajının içinde size verilen ve `https://console.firebase.google.com/...` ile başlayan linke tıklayın.
2.  Bu link sizi, tüm ayarları önceden doldurulmuş olan doğru dizin oluşturma sayfasına götürecektir.
3.  Açılan sayfada **Dizini Oluştur (Create Index)** veya **Kaydet (Save)** butonuna tıklamanız yeterlidir.
4.  Dizinin oluşturulması birkaç dakika sürebilir. Firebase Konsolu'nda durumu "Etkin (Enabled)" olduğunda, uygulamaya geri dönüp sayfayı yenileyebilirsiniz. Hata çözülmüş olacaktır.


**3. Realtime Database Kurallarını Güncelleme (Kullanıcı Aktiflik Durumu İçin):**
1.  **Firebase Konsolu**'nda, sol menüden **Build > Realtime Database**'e tıklayın.
2.  Üstteki sekmelerden **Kurallar (Rules)** sekmesine geçin.
3.  Editördeki mevcut tüm metni silin ve projenizdeki `database.rules.json` dosyasının içeriğini buraya yapıştırın.
4.  **Yayınla (Publish)** butonuna tıklayın.

**4. Storage Kurallarını Güncelleme (Dosya Yükleme/İndirme İçin):**
Bu işlem, dosyaların (`Depposh` modülündeki gibi) yüklenip indirilebilmesi için gereklidir.
1.  **Firebase Konsolu**'nda, sol menüden **Build > Storage**'a tıklayın.
2.  Eğer Storage'ı ilk kez kullanıyorsanız, kurulumu tamamlamak için ekrandaki adımları izleyin.
3.  Üstteki sekmelerden **Kurallar (Rules)** sekmesine geçin.
4.  Editördeki mevcut tüm metni silin ve projenizdeki `storage.rules` dosyasının içeriğini buraya yapıştırın.
5.  **Yayınla (Publish)** butonuna tıklayın.

Bu adımları tamamladıktan sonra uygulamanızın veritabanı ve depolama erişim izinleri doğru şekilde ayarlanmış olacaktır.
