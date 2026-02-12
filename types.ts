
export type ReceiptPreference = 'Tofess 46' | 'Cerfa' | 'En attente' | 'Aucun';
export type TransactionType = 'Virement' | 'Espece' | 'Cheque' | 'Direct Donateur';
export type BankAccount = 'Beith Yossef' | 'Mishkan Yehuda' | 'Atrid' | 'Yahad Naale';
export type DonationCategory = 'SHABAT' | 'FETES DE TICHRI' | 'FETES' | 'AUTRES';

export interface Fidele {
  id: string;
  nom: string;
  prenom: string;
  mail?: string;
  telephone: string;
  paysResidence: string;
  preferenceRecu: ReceiptPreference;
  montantDu: number;
  montantPaye: number;
  totalPromesses: number;
  balancePrecedente?: number;
  status: 'ACTIF' | 'OCCASIONNEL' | 'RECENT' | 'INACTIF';
  dateCreation: string;
  lastPaymentDate?: string;
  daysSinceLastPayment?: number | null;
}

export interface Pledge {
  id: string;
  fideleId: string;
  eventId: string;
  slotName: string;
  officeName: string; // Identification unique par Nom + Office
  amount: number;
  isOffered: boolean;
  category: DonationCategory;
  date: string;
}

export interface Encaissement {
  id: string;
  numero: number;
  date: string;
  fideleId: string;
  montantNis: number;
  montantEuro: number;
  tauxChange: number;
  type: TransactionType;
  compte: BankAccount;
  recu: ReceiptPreference;
}

export interface EventSlot {
  name: string;
  office: string;
}

export interface Event {
  id: string;
  name: string;
  isShabbat: boolean;
  category: DonationCategory;
  date?: string;
  slots?: EventSlot[];
}

export type ViewType = 'dashboard' | 'fideles' | 'encaissements' | 'evenements' | 'admin';
