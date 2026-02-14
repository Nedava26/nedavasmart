
export type ReceiptPreference = 'Tofess 46' | 'Cerfa' | 'En attente' | 'Aucun';
export type TransactionType = string;
export type BankAccount = string;
export type DonationCategory = string;

export interface StatusConfig {
  recentDays: number;
  activeDays: number;
}

export interface AppConfig {
  appName: string;
  logo?: string; // Image en Base64
  categories: DonationCategory[];
  bankAccounts: BankAccount[];
  paymentTypes: TransactionType[];
  status: StatusConfig;
}

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
  officeName: string;
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

export type ViewType = 'dashboard' | 'fidele' | 'paiement' | 'evenement' | 'parametre';
