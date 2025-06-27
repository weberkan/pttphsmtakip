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
};
