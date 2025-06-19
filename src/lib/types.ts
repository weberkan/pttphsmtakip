
export interface Position {
  id: string;
  name: string; // Ünvan
  department: string; // Birim
  dutyLocation?: string | null; // Görev Yeri (Opsiyonel)
  status: 'Asıl' | 'Vekalet' | 'Yürütme' | 'Boş'; // Güncellenmiş durumlar + Boş
  reportsTo: string | null; // ID of the parent position
  assignedPersonnelId: string | null; // ID of the assigned personnel
  startDate: Date | null; // Göreve başlama tarihi
}

export interface Personnel {
  id: string;
  firstName: string; // Adı
  lastName: string; // Soyadı
  registryNumber: string; // Sicil Numarası
  status: 'İHS' | '399'; // Personel Statüsü
  photoUrl?: string | null; // Fotoğraf URL'si (Opsiyonel)
  email?: string | null; // E-posta Adresi (Opsiyonel)
  phone?: string | null; // Telefon Numarası (Opsiyonel)
}
