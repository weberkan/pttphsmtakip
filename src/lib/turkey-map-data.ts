export interface ProvinceData {
  id: string;
  il_adi: string;
  basmudur_adi_soyadi: string;
  basmudur_foto_url: string;
  gorev_durumu: 'Asaleten' | 'Vekaleten';
  gorevlendirme_tarihi: string;
}

export const provinceDataMap: Record<string, ProvinceData> = {
  adana: {
    id: 'adana',
    il_adi: 'Adana',
    basmudur_adi_soyadi: 'Mehmet Kılıç',
    basmudur_foto_url: 'https://placehold.co/100x100.png',
    gorev_durumu: 'Asaleten',
    gorevlendirme_tarihi: '10.01.2022',
  },
  adiyaman: {
    id: 'adiyaman',
    il_adi: 'Adıyaman',
    basmudur_adi_soyadi: 'Zeynep Yıldırım',
    basmudur_foto_url: 'https://placehold.co/100x100.png',
    gorev_durumu: 'Vekaleten',
    gorevlendirme_tarihi: '05.03.2023',
  },
  afyonkarahisar: {
    id: 'afyonkarahisar',
    il_adi: 'Afyonkarahisar',
    basmudur_adi_soyadi: 'Hasan Yılmaz',
    basmudur_foto_url: 'https://placehold.co/100x100.png',
    gorev_durumu: 'Asaleten',
    gorevlendirme_tarihi: '21.08.2021',
  },
  agri: {
    id: 'agri',
    il_adi: 'Ağrı',
    basmudur_adi_soyadi: 'Fatma Öztürk',
    basmudur_foto_url: 'https://placehold.co/100x100.png',
    gorev_durumu: 'Asaleten',
    gorevlendirme_tarihi: '12.11.2022',
  },
  aksaray: {
    id: 'aksaray',
    il_adi: 'Aksaray',
    basmudur_adi_soyadi: 'Mustafa Demir',
    basmudur_foto_url: 'https://placehold.co/100x100.png',
    gorev_durumu: 'Vekaleten',
    gorevlendirme_tarihi: '30.07.2023',
  },
   amasya: {
    id: 'amasya',
    il_adi: 'Amasya',
    basmudur_adi_soyadi: 'İsmail Çetin',
    basmudur_foto_url: 'https://placehold.co/100x100.png',
    gorev_durumu: 'Asaleten',
    gorevlendirme_tarihi: '18.02.2022',
  },
  ankara: {
    id: 'ankara',
    il_adi: 'Ankara',
    basmudur_adi_soyadi: 'Bülent Karslı',
    basmudur_foto_url: 'https://placehold.co/100x100.png',
    gorev_durumu: 'Asaleten',
    gorevlendirme_tarihi: '01.01.2020',
  },
  antalya: {
    id: 'antalya',
    il_adi: 'Antalya',
    basmudur_adi_soyadi: 'Ayşe Güler',
    basmudur_foto_url: 'https://placehold.co/100x100.png',
    gorev_durumu: 'Asaleten',
    gorevlendirme_tarihi: '15.06.2022',
  },
  ardahan: {
    id: 'ardahan',
    il_adi: 'Ardahan',
    basmudur_adi_soyadi: 'Serhat Tekin',
    basmudur_foto_url: 'https://placehold.co/100x100.png',
    gorev_durumu: 'Vekaleten',
    gorevlendirme_tarihi: '22.09.2023',
  },
  artvin: {
    id: 'artvin',
    il_adi: 'Artvin',
    basmudur_adi_soyadi: 'Yusufeli Kaya',
    basmudur_foto_url: 'https://placehold.co/100x100.png',
    gorev_durumu: 'Asaleten',
    gorevlendirme_tarihi: '03.04.2021',
  },
  aydin: {
    id: 'aydin',
    il_adi: 'Aydın',
    basmudur_adi_soyadi: 'Deniz Aksoy',
    basmudur_foto_url: 'https://placehold.co/100x100.png',
    gorev_durumu: 'Asaleten',
    gorevlendirme_tarihi: '11.11.2021',
  },
};
