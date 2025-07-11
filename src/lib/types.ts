
import type { Timestamp } from 'firebase/firestore';

export interface Position {
  id: string;
  name: string; // Ünvan
  department: string; // Birim
  dutyLocation?: string | null; // Görev Yeri (Opsiyonel)
  status: 'Asıl' | 'Vekalet' | 'Yürütme' | 'Boş'; // Güncellenmiş durumlar + Boş
  reportsTo: string | null; // ID of the parent position
  assignedPersonnelId: string | null; // ID of the assigned personnel
  startDate: Date | null; // Göreve başlama tarihi
  originalTitle?: string | null; // Asıl Ünvan (Vekalet/Yürütme durumları için)
  lastModifiedBy?: string; // UID of the user
  lastModifiedAt?: Date | Timestamp | null;
}

export interface TasraPosition {
  id: string;
  unit: string;
  dutyLocation: string;
  kadroUnvani?: string | null; // Pozisyonun kadro ünvanı
  assignedPersonnelId: string | null;
  originalTitle?: string | null;
  status: 'Asıl' | 'Vekalet' | 'Yürütme' | 'Boş';
  actingAuthority?: 'Başmüdürlük' | 'Genel Müdürlük' | null;
  startDate: Date | null;
  receivesProxyPay: boolean;
  hasDelegatedAuthority: boolean;
  lastModifiedBy?: string; // UID of the user
  lastModifiedAt?: Date | Timestamp | null;
}

export interface Personnel {
  id: string;
  firstName: string; // Adı
  lastName: string; // Soyadı
  unvan?: string | null; // Kadro Ünvanı
  registryNumber: string; // Sicil Numarası
  status: 'İHS' | '399'; // Personel Statüsü
  photoUrl?: string | null; // Fotoğraf URL'si (Opsiyonel)
  email?: string | null; // E-posta Adresi (Opsiyonel)
  phone?: string | null; // Telefon Numarası (Opsiyonel)
  dateOfBirth?: Date | null; // Doğum Tarihi
  lastModifiedBy?: string; // UID of the user
  lastModifiedAt?: Date | Timestamp | null;
}

export interface AppUser {
  uid: string;
  registryNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  isApproved: boolean;
  role?: 'admin' | 'user';
  photoUrl?: string | null;
  presence?: 'online' | 'offline';
  lastSeen?: Date | Timestamp | null;
}

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inProgress' | 'done';
  order: number;
  assignedUids?: string[];
  priority?: 'low' | 'medium' | 'high';
  startDate?: Date | Timestamp | null;
  dueDate?: Date | Timestamp | null;
  lastModifiedBy?: string; // UID of the user
  lastModifiedAt?: Date | Timestamp | null;
}

export type DepposhFileCategory = 'taslak' | 'matbu' | 'güncel' | 'mevzuat';

export interface DepposhFile {
  id: string;
  name: string;
  type: string;
  size: number;
  category: DepposhFileCategory;
  downloadUrl: string; 
  storagePath: string;
  order: number;
  lastModifiedBy?: string; // UID of the user
  lastModifiedAt?: Date | Timestamp | null;
}

export interface AppNotification {
  id: string;
  recipientUid: string;
  senderInfo: string; // "First Last (RegistryNumber)"
  message: string;
  link: string;
  isRead: boolean;
  createdAt: Date | Timestamp;
}

    