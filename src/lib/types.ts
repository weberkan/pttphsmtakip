
export interface Position {
  id: string;
  name: string; // Pozisyon Adı
  department: string; // Departman
  status: 'permanent' | 'acting';
  reportsTo: string | null; // ID of the parent position
  assignedPersonnelId: string | null; // ID of the assigned personnel
}

export interface Personnel {
  id: string;
  firstName: string; // Adı
  lastName: string; // Soyadı
  registryNumber: string; // Sicil Numarası
}
