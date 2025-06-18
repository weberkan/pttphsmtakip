
export interface Position {
  id: string;
  name: string; // Ünvan
  department: string; // Departman
  status: 'Asıl' | 'Vekalet' | 'Yürütme'; // Güncellenmiş durumlar
  reportsTo: string | null; // ID of the parent position
  assignedPersonnelId: string | null; // ID of the assigned personnel
  startDate: Date | null; // Göreve başlama tarihi
}

export interface Personnel {
  id: string;
  firstName: string; // Adı
  lastName: string; // Soyadı
  registryNumber: string; // Sicil Numarası
  photoUrl?: string | null; // Fotoğraf URL'si (Opsiyonel)
  email?: string | null; // E-posta Adresi (Opsiyonel)
  phone?: string | null; // Telefon Numarası (Opsiyonel)
}

