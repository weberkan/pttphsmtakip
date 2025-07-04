
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

### Veritabanı Güvenlik Kurallarını Güncelleme (Firebase Konsolu)

Uygulamanın veritabanına erişebilmesi için güvenlik kurallarını manuel olarak Firebase Konsolu üzerinden ayarlamanız gerekir. Bu işlem, `PERMISSION_DENIED` hatalarını önlemek için kritik öneme sahiptir.

**1. Firestore Kurallarını Güncelleme:**
1.  **Firebase Konsolu**'na gidin ve projenizi seçin.
2.  Sol menüden **Build > Firestore Database**'e tıklayın.
3.  Üstteki sekmelerden **Kurallar (Rules)** sekmesine geçin.
4.  Editördeki mevcut tüm metni silin ve projenizdeki `firestore.rules` dosyasının içeriğini buraya yapıştırın.
5.  **Yayınla (Publish)** butonuna tıklayın.

**2. Realtime Database Kurallarını Güncelleme (Kullanıcı Aktiflik Durumu İçin):**
1.  **Firebase Konsolu**'nda, sol menüden **Build > Realtime Database**'e tıklayın.
2.  Üstteki sekmelerden **Kurallar (Rules)** sekmesine geçin.
3.  Editördeki mevcut tüm metni silin ve projenizdeki `database.rules.json` dosyasının içeriğini buraya yapıştırın.
4.  **Yayınla (Publish)** butonuna tıklayın.

Bu iki adımı tamamladıktan sonra uygulamanızın veritabanı erişim izinleri doğru şekilde ayarlanmış olacaktır.
