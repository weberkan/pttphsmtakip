
# Pozisyon Takip Sistemi - Kullanıcı Kılavuzu ve Açıklama

Bu belge, geliştirdiğimiz "Pozisyon Takip Sistemi" aracını, daha önce hiç görmemiş veya teknik bilgisi olmayan bir kişiye anlatmanıza yardımcı olmak için hazırlanmıştır.

---

### 1. Bu Sistem Nedir?

Bu sistem, şirketimizin organizasyon yapısını, yani tüm pozisyonları, bu pozisyonlara atanan kişileri ve kimin kime raporladığını gösteren dijital, canlı ve interaktif bir haritadır. Eskiden kağıtlarda veya farklı Excel dosyalarında dağınık olarak duran tüm bu bilgileri, tek bir güvenilir ve her zaman güncel olan bir merkezde toplar.

Kısacası, "Kim hangi pozisyonda?", "Bu pozisyona kim vekalet ediyor?", "Hangi departmanlar var?" gibi soruların cevabını anında bulabileceğiniz merkezi bir yönetim aracıdır.

### 2. Ana Özellikleri Nelerdir?

*   **Güvenli Giriş:** Sadece yetkili kullanıcılar, kendilerine özel sicil numarası ve şifre ile sisteme giriş yapabilir.
*   **Pozisyon Yönetimi:** Şirketteki tüm pozisyonları detaylı bir liste halinde görebilir, filtreleyebilir ve arama yapabilirsiniz. Yeni pozisyonlar ekleyebilir veya mevcutları güncelleyebilirsiniz.
*   **Personel Yönetimi:** Tüm personelimizin bir listesini ve temel bilgilerini (statü, sicil vb.) yönetebilirsiniz.
*   **Görsel Organizasyon Şeması:** Şirketin tüm hiyerarşik yapısını, kimin kime bağlı olduğunu gösteren interaktif bir şemada görsel olarak inceleyebilirsiniz.
*   **Toplu Veri Yükleme (Excel):** Tek tek elle girmek yerine, personel ve pozisyon listelerinizi bir Excel dosyasından saniyeler içinde sisteme aktarabilirsiniz. Bu, büyük zaman tasarrufu sağlar.
*   **Değişiklik Takibi:** Bir pozisyon veya personel bilgisi güncellendiğinde, değişikliği kimin yaptığını ve ne zaman yaptığını kolayca görebilirsiniz. Bu, veri güvenilirliğini artırır.

### 3. Bu Sistem Neden Faydalı?

*   **Tek Bir Doğru Kaynak:** Herkesin en güncel ve doğru bilgiye aynı yerden ulaşmasını sağlar, bilgi kirliliğini ve karışıklığı önler.
*   **Şeffaflık ve Netlik:** Kimin hangi görevde olduğu, kimin kime rapor verdiği gibi konular netleşir. Bu, kurum içi iletişimi ve iş akışlarını kolaylaştırır.
*   **Verimlilik:** İhtiyaç duyulan bilgiye arama ve filtreleme ile saniyeler içinde ulaşılır. Excel'den toplu veri yükleme özelliği, manuel veri girişine harcanan saatleri ortadan kaldırır.
*   **Hesap Verebilirlik:** Yapılan her değişikliğin kim tarafından yapıldığının kaydının tutulması, veri kalitesini ve sorumluluğu artırır.
*   **Stratejik Görüş:** Üst yönetim, organizasyon şemasını anlık olarak görerek yapısal kararları daha sağlıklı bir veri temelinde alabilir.

### 4. Nasıl Kullanılır? (Temel Adımlar)
1.  Uygulamanın web adresine gidin.
2.  Size verilen Sicil Numarası ve Şifre ile giriş yapın.
3.  Karşınıza üç ana sekme çıkacak: **Pozisyon Yönetimi**, **Personel Yönetimi** ve **Organizasyon Şeması**.
4.  **Pozisyon Yönetimi** sekmesinde, tüm pozisyonların detaylı bir listesini görebilir, arama yapabilir ve filtreleyebilirsiniz.
5.  **Personel Yönetimi** sekmesinde, şirketteki tüm personellerin listesini yönetebilirsiniz.
6.  **Organizasyon Şeması** sekmesinde, şirketin görsel hiyerarşisini inceleyebilirsiniz.
7.  Sağ üstteki **"Personel Ekle"** veya **"Pozisyon Ekle"** butonlarıyla yeni kayıtlar oluşturabilirsiniz.
8.  Listelerin üzerindeki **"Yükle"** butonları ile Excel dosyalarından toplu veri aktarımı yapabilirsiniz.

### 5. Excel ile Toplu Veri Yükleme Formatı

Sisteme Excel dosyaları ile toplu olarak personel ve pozisyon ekleyebilirsiniz. Bu özellik, manuel veri girişine harcanan zamanı önemli ölçüde azaltır. Yükleyeceğiniz dosyanın doğru formatta olması, verilerin sorunsuz bir şekilde aktarılması için kritiktir.

**Genel Kurallar:**

*   Excel dosyanızın ilk satırı **başlık satırı** olmalıdır.
*   Sütunların sırası önemli değildir. Sistem, başlık isimlerine göre doğru alanı tanıyacaktır.
*   Başlık isimlerinde büyük/küçük harf veya boşluk karakterleri önemli değildir (örn: "Sicil Numarası" ile "sicilnumarasi" aynı kabul edilir).
*   Dosya `.xlsx`, `.xls` veya `.csv` formatında olabilir.

---

#### Personel Yükleme Formatı (Merkez ve Taşra Ortak)

Hem Merkez hem de Taşra personelini aynı Excel formatını kullanarak sisteme yükleyebilirsiniz. Sistem, dosyayı hangi ekrandan (`Merkez Personel Yönetimi` veya `Taşra Personel Yönetimi`) yüklediğinizi anlar ve personeli doğru listeye ekler.

Personel listesini yüklemek için Excel dosyanızda aşağıdaki sütunlar bulunmalıdır. **Kalın** ile yazılanlar zorunlu alanlardır.

*   **`Adı`** (Alternatif başlıklar: `Ad`)
*   **`Soyadı`** (Alternatif başlıklar: `Soyad`)
*   **`Sicil Numarası`** (Alternatif başlıklar: `Sicil No`, `Sicil`)
*   **`Statü`** (Değerler: `İHS` veya `399` olmalıdır)
*   `Ünvan` (Opsiyonel. Personelin kadro unvanı. Alternatif: `Kadro Ünvanı`)
*   `E-posta` (Opsiyonel, geçerli bir e-posta formatı olmalıdır. Alternatif başlıklar: `Mail`)
*   `Telefon` (Opsiyonel)
*   `Fotoğraf URL` (Opsiyonel, geçerli bir URL olmalıdır. Alternatif başlıklar: `Foto URL`, `Foto`, `Url`)
*   `Doğum Tarihi` (Opsiyonel. `GG.AA.YYYY` formatında olmalıdır.)

_Örnek Personel Excel Dosyası:_

| Adı      | Soyadı    | Sicil Numarası | Statü | Ünvan | Doğum Tarihi | E-posta | Telefon | Fotoğraf URL |
|----------|-----------|----------------|-------|-------|--------------|-----------------------|--------------|------------------------------------|
| Ali      | Yılmaz    | 215812         | İHS   | Uzman | 15.03.1985   | ali.yilmaz@ptt.gov.tr | 555-555-6677 | https://placehold.co/100x100.png   |
| Ayşe     | Kaya      | 123456         | 399   | Başmüdür| 20.08.1979 | ayse.kaya@ptt.gov.tr  | 555-111-2233 | https://placehold.co/100x100.png   |

---

#### Merkez Pozisyon Yükleme Formatı

Pozisyon listesini yüklemek için Excel dosyanızda aşağıdaki sütunlar bulunmalıdır. **Kalın** ile yazılanlar zorunlu alanlardır.

*   **`Ünvan`** (Alternatif başlıklar: `Unvan`)
*   **`Birim`**
*   **`Durum`** (Değerler: `Asıl`, `Vekalet`, `Yürütme` veya `Boş` olmalıdır)
*   `Görev Yeri` (Opsiyonel. Alternatif başlıklar: `Gorevyeri`)
*   `Asıl Ünvan` (Opsiyonel, genellikle `Vekalet` veya `Yürütme` durumlarında kullanılır. Alternatif başlıklar: `Asil Unvan`)
*   `Bağlı Olduğu Personel Sicil` (Opsiyonel. Üst pozisyondaki kişinin **sicil numarası**. Alternatif: `Raporladığı Sicil`)
*   `Atanan Personel Sicil` (Opsiyonel. Pozisyona atanan kişinin **sicil numarası**. Alternatif başlıklar: `Personel Sicil`, `Atanan Personel`. `Durum` "Boş" ise bu alan dikkate alınmaz.)
*   `Başlama Tarihi` (Opsiyonel. `GG.AA.YYYY` formatında. Alternatif başlık: `Tarih`. `Durum` "Boş" ise dikkate alınmaz.)

_Önemli Notlar:_
*   `Bağlı Olduğu Personel Sicil` alanına yazdığınız sicil numarasının sistemde kayıtlı bir personele ait olması ve o personelin bir pozisyona atanmış olması gerekir.
*   `Atanan Personel Sicil` alanına yazdığınız sicil numarasının sistemde kayıtlı bir personele ait olması gerekir.
*   Bir pozisyonu güncellemek için (örn: atanan kişiyi değiştirmek), Excel'de `Ünvan`, `Birim` ve `Görev Yeri` alanları sistemdekiyle birebir aynı olan bir satır ekleyin. Sistem bu pozisyonu bulup diğer sütunlardaki bilgilerle güncelleyecektir.

_Örnek Merkez Pozisyon Excel Dosyası:_

| Birim                   | Ünvan            | Durum   | Atanan Personel Sicil | Bağlı Olduğu Personel Sicil |
|-------------------------|------------------|---------|-----------------------|-----------------------------|
| Bilgi Teknolojileri D.B | Daire Başkanı    | Asıl    | 240637                | 239089                      |
| İnsan Kaynakları D.B.   | Şube Müdürü      | Vekalet | 215812                | 248143                      |
| Destek Hizmetleri D.B.  | Uzman            | Boş     |                       | 251469                      |

---

#### Taşra Pozisyon Yükleme Formatı

Taşra pozisyon listesini yüklemek için Excel dosyanızda aşağıdaki sütunlar bulunmalıdır. **Kalın** ile yazılanlar zorunlu alanlardır.

*   **`Ünite`**
*   **`Görev Yeri`**
*   **`Durum`** (Değerler: `Asıl`, `Vekalet`, `Yürütme` veya `Boş` olmalıdır)
*   `Kadro Ünvanı` (Opsiyonel. Pozisyonun resmi kadro ünvanı.)
*   `Asıl Ünvan` (Opsiyonel, genellikle `Vekalet` veya `Yürütme` durumlarında kullanılır)
*   `Atanan Personel Sicil` (Opsiyonel. Pozisyona atanan kişinin **sicil numarası**. Alternatif başlıklar: `Atanan Personel`, `Personel Sicil`. `Durum` "Boş" ise bu alan dikkate alınmaz.)
*   `Başlama Tarihi` (Opsiyonel. `GG.AA.YYYY` formatında. `Durum` "Boş" ise dikkate alınmaz.)
*   `Görevi Veren Makam` (Opsiyonel. Değerler: `Başmüdürlük` veya `Genel Müdürlük`. Sadece `Durum` "Vekalet" veya "Yürütme" ise geçerlidir.)
*   `Vekalet Ücreti Alıyor Mu?` (Opsiyonel. Değerler: `Evet`, `Hayır`, `True`, `False`. Alternatif başlık: `Vekalet Ücreti`. Sadece `Durum` "Vekalet" veya "Yürütme" ise geçerlidir.)
*   `Yetki Devri Var Mı?` (Opsiyonel. Değerler: `Evet`, `Hayır`, `True`, `False`. Alternatif başlık: `Yetki Devri`. Sadece `Durum` "Vekalet" veya "Yürütme" ise geçerlidir.)

_Önemli Notlar:_
*   `Atanan Personel Sicil` alanına yazdığınız sicil numarasının sistemde (Taşra Personel listesinde) kayıtlı bir personele ait olması gerekir.
*   Bir pozisyonu güncellemek için (örn: atanan kişiyi değiştirmek), Excel'de `Ünite` ve `Görev Yeri` alanları sistemdekiyle birebir aynı olan bir satır ekleyin. Sistem bu pozisyonu bulup diğer sütunlardaki bilgilerle güncelleyecektir.

_Örnek Taşra Pozisyon Excel Dosyası:_

| Ünite | Görev Yeri | Kadro Ünvanı | Durum | Atanan Personel Sicil | Asıl Ünvan | Görevi Veren Makam | Vekalet Ücreti Alıyor Mu? | Yetki Devri Var Mı? |
|---|---|---|---|---|---|---|---|---|
| Adana P.İ.M. | Müdür | Müdür | Vekalet | 123456 | Başdağıtıcı | Başmüdürlük | Evet | Hayır |
| Ankara P.İ.M. | Memur | Memur | Asıl | 789012 | | | | |
| İzmir P.İ.M. | Şef | Şef | Boş | | | | | |
    
