
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

### Veritabanı Güvenlik Kurallarını Güncelleme (Dağıtma)

`firestore.rules` veya `database.rules.json` dosyalarında bir değişiklik yaptığınızda, bu yeni kuralların Firebase projenizde aktif hale gelmesi için onları "dağıtmanız" (deploy etmeniz) gerekir.

Bu işlem, projenizin güvenliği için kritik öneme sahiptir.

**Gereksinimler:**
*   Terminalde `firebase-tools` paketinin kurulu olması gerekir (projenin `devDependencies` bölümüne ekledik).
*   Firebase hesabınızda oturum açmış olmanız gerekir.

**Adımlar:**

1.  **Firebase'e Giriş Yapın (Sadece ilk seferde gerekli):**
    Terminalinize aşağıdaki komutu yazın ve Enter'a basın:
    ```bash
    npx firebase login
    ```
    Bu komut, tarayıcınızda bir pencere açarak Google hesabınızla giriş yapmanızı isteyecektir. Giriş yaptıktan sonra terminale geri dönebilirsiniz.

2.  **Kuralları Dağıtın:**
    Giriş yaptıktan sonra, terminale aşağıdaki komutu yazarak yeni kurallarınızı Firebase'e gönderin:
    ```bash
    npm run deploy:rules
    ```
    Komut başarıyla tamamlandığında, `✔ Deploy complete!` mesajını göreceksiniz. Bu, yeni güvenlik kurallarınızın artık aktif olduğu anlamına gelir.
