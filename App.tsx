import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, LayoutDashboard, CalendarDays, Plus, Search, 
  ChevronRight, TrendingUp, Wallet, CheckCircle2, 
  Clock, History, AlertCircle, Waves, Calendar, 
  ChevronDown, X, Edit3, PieChart, Gift, Save, Mail, 
  Phone, Trash2, Check, Pencil, AlertTriangle, Users2, ChevronUp,
  Loader2, Copy, ArrowUpRight, Scale, Menu, ChevronLeft, Settings, GripVertical, Trash, Layout, Image as ImageIcon, Upload, Lock, LogOut, CreditCard, Building2, ChevronDownCircle
} from 'lucide-react';
import { Fidele, Event, Pledge, Encaissement, ViewType, ReceiptPreference, TransactionType, BankAccount, DonationCategory, EventSlot, AppConfig } from './types';
import { 
  RAW_EVENTS, OFFICES, DONATION_CATEGORIES, BANK_ACCOUNTS,
  SHABBAT_TEMPLATE, ROCH_HACHANA_TEMPLATE, YOM_KIPPOUR_TEMPLATE, SIMHA_TORAH_TEMPLATE,
  DEFAULT_FIDELES
} from './constants';
import { db } from './lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// --- ICÔNE ÉTOILE DE DAVID (FALLBACK) ---
const SynagogueLogo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2l3.5 6h7l-5.5 4.5 2 7.5-7-4.5-7 4.5 2-7.5-5.5-4.5h7z" />
    <path d="M12 22l-3.5-6h-7l5.5-4.5-2-7.5 7 4.5 7-4.5-2 7.5 5.5 4.5h-7z" className="opacity-50" />
  </svg>
);

// --- COMPOSANT D'AFFICHAGE DU LOGO ---
const AppLogo = ({ config, className, iconClassName }: { config: AppConfig, className?: string, iconClassName?: string }) => {
  if (config.logo) {
    return <img src={config.logo} alt="Logo" className={`${className || 'w-full h-full'} object-contain`} />;
  }
  return <SynagogueLogo className={iconClassName || "w-8 h-8 text-indigo-900"} />;
};

// --- COMPOSANT DE RECHERCHE DE FIDÈLE ---
interface FideleSearchProps {
  fideles: Fidele[];
  selectedId?: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const FideleSearch: React.FC<FideleSearchProps> = ({ fideles, selectedId, onSelect, placeholder, disabled, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedFidele = useMemo(() => fideles.find(f => f.id === selectedId), [fideles, selectedId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    return fideles.filter(f => 
      `${f.prenom} ${f.nom}`.toLowerCase().includes(query.toLowerCase()) ||
      `${f.nom} ${f.prenom}`.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
  }, [fideles, query]);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          placeholder={selectedFidele ? `${selectedFidele.prenom} ${selectedFidele.nom}` : (placeholder || "Chercher un fidèle...")}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className={`w-full px-4 py-3 border rounded-xl font-black text-sm outline-none transition-all disabled:cursor-not-allowed pr-16 
            ${selectedFidele 
              ? 'bg-indigo-50/30 border-indigo-200 text-slate-950 placeholder:text-slate-950 placeholder:font-black' 
              : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 placeholder:font-bold focus:border-indigo-500'
            }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedId && !disabled && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onSelect(''); setQuery(''); }} className="p-1.5 text-slate-300 hover:text-rose-500"><X size={14} /></button>
          )}
          <ChevronDown size={16} className={`${selectedFidele ? 'text-indigo-400' : 'text-slate-400'} pointer-events-none`} />
        </div>
      </div>
      {isOpen && query.trim() !== '' && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[120] overflow-hidden">
          {filtered.length > 0 ? (
            filtered.map(f => (
              <button key={f.id} type="button" onClick={() => { onSelect(f.id); setQuery(''); setIsOpen(false); }} className="w-full text-left px-5 py-3 hover:bg-indigo-50 transition-colors flex items-center justify-between group">
                <span className="font-black text-xs text-slate-700 uppercase">{f.prenom} {f.nom}</span>
                <ChevronRight size={12} className="text-slate-300 group-hover:text-indigo-400" />
              </button>
            ))
          ) : (
            <div className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase italic">Aucun résultat</div>
          )}
        </div>
      )}
    </div>
  );
};

// Fix: Added 'export' keyword to make App available for named import in index.tsx
export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('syna_auth') === 'true';
  });
  
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // --- STATS DETAILS ---
  const [expandedStat, setExpandedStat] = useState<'pledges' | 'encaissements' | null>(null);

  // --- CONFIG ---
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('syna_config');
    return saved ? JSON.parse(saved) : {
      appName: 'MA SYNAGOGUE',
      categories: DONATION_CATEGORIES,
      bankAccounts: BANK_ACCOUNTS,
      paymentTypes: ['Virement', 'Espèce', 'Chèque'],
      status: { recentDays: 30, activeDays: 90 }
    };
  });

  const [fideles, setFideles] = useState<Fidele[]>(() => {
    const saved = localStorage.getItem('syna_fideles');
    return saved ? JSON.parse(saved) : DEFAULT_FIDELES;
  });
  
  const [pledges, setPledges] = useState<Pledge[]>(() => {
    const saved = localStorage.getItem('syna_pledges');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [encaissements, setEncaissements] = useState<Encaissement[]>(() => {
    const saved = localStorage.getItem('syna_encaissements');
    return saved ? JSON.parse(saved) : [];
  });

  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('syna_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedFideleId, setSelectedFideleId] = useState<string | null>(null);
  const [isAddingFidele, setIsAddingFidele] = useState(false);
  const [editingFideleId, setEditingFideleId] = useState<string | null>(null);
  const [isAddingEncaissement, setIsAddingEncaissement] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isEditingEventHeader, setIsEditingEventHeader] = useState(false);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlotName, setNewSlotName] = useState("");
  const [newSlotOffice, setNewSlotOffice] = useState(OFFICES[0] || "Office");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'event' | 'slot' | 'bank' | 'pay'; id: string; slot?: EventSlot; value?: string } | null>(null);
  const [eventSearch, setEventSearch] = useState('');
  const [fideleSearch, setFideleSearch] = useState('');
  const [draggedEventIndex, setDraggedEventIndex] = useState<number | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // States pour les nouveaux paramètres
  const [addingField, setAddingField] = useState<'bank' | 'pay' | 'cat' | null>(null);
  const [newBank, setNewBank] = useState("");
  const [newPay, setNewPay] = useState("");
  const [newCat, setNewCat] = useState("");

  useEffect(() => { localStorage.setItem('syna_fideles', JSON.stringify(fideles)); }, [fideles]);
  useEffect(() => { localStorage.setItem('syna_pledges', JSON.stringify(pledges)); }, [pledges]);
  useEffect(() => { localStorage.setItem('syna_encaissements', JSON.stringify(encaissements)); }, [encaissements]);
  useEffect(() => { localStorage.setItem('syna_events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('syna_config', JSON.stringify(config)); }, [config]);

  const selectedEvent = useMemo(() => events.find(e => e.id === selectedEventId), [events, selectedEventId]);
  const currentHonors = useMemo(() => selectedEvent?.slots || [], [selectedEvent]);

  // --- LOGIN LOGIC ---
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (email === 'admin@nedava.com' && password === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('syna_auth', 'true');
      setLoginError(null);
    } else {
      setLoginError("Identifiants incorrects. Réessayez.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('syna_auth');
    setCurrentView('dashboard');
  };

  // --- DRAG AND DROP ---
  const handleDragStart = (index: number) => setDraggedEventIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (index: number) => {
    if (draggedEventIndex === null) return;
    const newEvents = [...events];
    const [reorderedItem] = newEvents.splice(draggedEventIndex, 1);
    newEvents.splice(index, 0, reorderedItem);
    setEvents(newEvents);
    setDraggedEventIndex(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addFidele = (data: Partial<Fidele>) => {
    const newFidele: Fidele = {
      id: Math.random().toString(36).substr(2, 9),
      nom: (data.nom || '').toUpperCase(),
      prenom: (data.prenom || '').charAt(0).toUpperCase() + (data.prenom || '').slice(1).toLowerCase(),
      mail: data.mail || '',
      telephone: data.telephone || '',
      paysResidence: data.paysResidence || 'France',
      preferenceRecu: data.preferenceRecu || 'Aucun',
      balancePrecedente: data.balancePrecedente || 0,
      montantDu: 0,
      montantPaye: 0,
      totalPromesses: 0,
      status: 'RECENT',
      dateCreation: new Date().toISOString(),
    };
    setFideles(prev => [...prev, newFidele]);
    setIsAddingFidele(false);
  };

  const updateFidele = (id: string, data: Partial<Fidele>) => {
    setFideles(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
    setEditingFideleId(null);
  };

  const addEncaissement = (data: Omit<Encaissement, 'id' | 'numero'>) => {
    const newEncaissement: Encaissement = { ...data, id: Math.random().toString(36).substr(2, 9), numero: encaissements.length + 1 };
    setEncaissements(prev => [...prev, newEncaissement]);
    setIsAddingEncaissement(false);
  };

  const updatePledge = (eventId: string, slotName: string, officeName: string, fideleId: string, amount: number, isOffered: boolean = false) => {
    const event = events.find(ev => ev.id === eventId);
    setPledges(prev => {
      const existingIndex = prev.findIndex(p => p.eventId === eventId && p.slotName === slotName && p.officeName === officeName);
      const newPledge: Pledge = { id: Math.random().toString(36).substr(2, 9), eventId, slotName, officeName, fideleId, amount, isOffered, category: event?.category || 'Général', date: event?.date || new Date().toISOString() };
      if (existingIndex > -1) { const updated = [...prev]; updated[existingIndex] = newPledge; return updated; }
      return [...prev, newPledge];
    });
  };

  const addEvent = (name: string, category: DonationCategory, date?: string) => {
    const newEvent: Event = { id: Math.random().toString(36).substr(2, 9), name, category, date, isShabbat: category.includes('SHABAT'), slots: [] };
    setEvents(prev => [...prev, newEvent]);
    setSelectedEventId(newEvent.id);
    setIsAddingEvent(false);
  };

  const updateEventInfo = (id: string, updates: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    if (updates.date || updates.category) {
        setPledges(prev => prev.map(p => p.eventId === id ? { ...p, date: updates.date || p.date, category: updates.category || p.category } : p));
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    const { type, id, slot, value } = deleteConfirm;
    if (type === 'event') {
      setEvents(prev => prev.filter(e => e.id !== id));
      setPledges(prev => prev.filter(p => p.eventId !== id));
      if (selectedEventId === id) setSelectedEventId(null);
    } else if (type === 'slot' && slot) {
      setEvents(prev => prev.map(e => e.id === id ? { ...e, slots: (e.slots || []).filter(s => !(s.name === slot.name && s.office === slot.office)) } : e));
      setPledges(prev => prev.filter(p => !(p.eventId === id && p.slotName === slot.name && p.officeName === slot.office)));
    } else if (type === 'bank' && value) {
      setConfig(prev => ({ ...prev, bankAccounts: (prev.bankAccounts || []).filter(b => b !== value) }));
    } else if (type === 'pay' && value) {
      setConfig(prev => ({ ...prev, paymentTypes: (prev.paymentTypes || []).filter(p => p !== value) }));
    }
    setDeleteConfirm(null);
  };

  const confirmAddSlot = () => {
    if (!selectedEventId || !newSlotName.trim()) return;
    const slot: EventSlot = { name: newSlotName.trim(), office: newSlotOffice };
    setEvents(prev => prev.map(e => e.id === selectedEventId ? { ...e, slots: [...(e.slots || []), slot] } : e));
    setNewSlotName("");
    setIsAddingSlot(false);
  };

  const handleAddBank = () => {
    if (newBank.trim()) {
      setConfig(prev => ({
        ...prev,
        bankAccounts: [...(prev.bankAccounts || []), newBank.trim()]
      }));
      setNewBank("");
      setAddingField(null);
    }
  };

  const handleAddPay = () => {
    if (newPay.trim()) {
      setConfig(prev => ({
        ...prev,
        paymentTypes: [...(prev.paymentTypes || []), newPay.trim()]
      }));
      setNewPay("");
      setAddingField(null);
    }
  };

  const handleAddCat = () => {
    if (newCat.trim()) {
      setConfig(prev => ({
        ...prev,
        categories: [...(prev.categories || []), newCat.trim().toUpperCase()]
      }));
      setNewCat("");
      setAddingField(null);
    }
  };

  const updatedFideles = useMemo(() => {
    return fideles.map(f => {
      const fPledges = pledges.filter(p => p.fideleId === f.id && !p.isOffered);
      const totalPromised = fPledges.reduce((sum, p) => sum + p.amount, 0) + (f.balancePrecedente || 0);
      const fEncaissements = encaissements.filter(e => e.fideleId === f.id);
      const totalPaidNis = fEncaissements.reduce((sum, e) => sum + e.montantNis, 0);
      const lastPayment = fEncaissements.length > 0 ? [...fEncaissements].sort((a,b) => b.date.localeCompare(a.date))[0] : null;
      const daysSinceLastPayment = lastPayment ? Math.floor((new Date().getTime() - new Date(lastPayment.date).getTime()) / (1000 * 3600 * 24)) : null;
      let status: Fidele['status'] = 'INACTIF';
      const createdDaysAgo = Math.floor((new Date().getTime() - new Date(f.dateCreation).getTime()) / (1000 * 3600 * 24));
      
      const statusConfig = config.status || { recentDays: 30, activeDays: 90 };
      if (createdDaysAgo < statusConfig.recentDays) status = 'RECENT';
      else if (daysSinceLastPayment !== null && daysSinceLastPayment < statusConfig.activeDays) status = 'ACTIF';
      else if (fEncaissements.length > 0) status = 'OCCASIONNEL';
      return { ...f, totalPromesses: totalPromised, montantPaye: totalPaidNis, status, lastPaymentDate: lastPayment?.date, daysSinceLastPayment };
    }).filter(f => f.nom.toLowerCase().includes(fideleSearch.toLowerCase()) || f.prenom.toLowerCase().includes(fideleSearch.toLowerCase()));
  }, [fideles, pledges, encaissements, fideleSearch, config.status]);

  const stats = useMemo(() => {
    const totalPromisedNis = updatedFideles.reduce((sum, f) => sum + f.totalPromesses, 0);
    const totalPaidNis = updatedFideles.reduce((sum, f) => sum + f.montantPaye, 0);
    const timeProgress = (new Date().getTime() - new Date('2025-09-23').getTime()) / (new Date('2026-09-11').getTime() - new Date('2025-09-23').getTime());
    
    // Ventilation par catégorie (promesses)
    const categoryBreakdown = (config.categories || []).map(cat => ({
      label: cat,
      amount: pledges.filter(p => p.category === cat && !p.isOffered).reduce((sum, p) => sum + p.amount, 0)
    }));

    // Ventilation par compte (encaissements)
    const accountBreakdown = (config.bankAccounts || []).map(acc => ({
      label: acc,
      amount: encaissements.filter(e => e.compte === acc).reduce((sum, e) => sum + e.montantNis, 0)
    }));

    return { 
      totalPromisedNis, 
      totalPaidNis, 
      expected: timeProgress * 100, 
      actual: totalPromisedNis > 0 ? (totalPaidNis / totalPromisedNis) * 100 : 0,
      categoryBreakdown,
      accountBreakdown
    };
  }, [updatedFideles, pledges, encaissements, config.categories, config.bankAccounts]);

  const renderDashboard = () => (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            id: 'pledges',
            label: 'Promesses de dons', 
            value: `${stats.totalPromisedNis.toLocaleString()} ₪`, 
            icon: TrendingUp, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-50' 
          },
          { 
            id: 'encaissements',
            label: 'Dons Encaissés', 
            value: `${stats.totalPaidNis.toLocaleString()} ₪`, 
            icon: Wallet, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50' 
          },
          { 
            label: 'Reste à percevoir', 
            value: `${(stats.totalPromisedNis - stats.totalPaidNis).toLocaleString()} ₪`, 
            icon: Scale, 
            color: 'text-rose-600', 
            bg: 'bg-rose-50' 
          },
          { 
            label: 'Taux de recouvrement', 
            value: `${stats.actual.toFixed(1)}%`, 
            icon: CheckCircle2, 
            color: 'text-sky-600', 
            bg: 'bg-sky-50' 
          }
        ].map((item, idx) => (
          <div key={idx} className="relative group">
            <button 
              onClick={() => {
                if ('id' in item) {
                  setExpandedStat(expandedStat === item.id ? null : item.id as any);
                }
              }}
              className={`w-full text-left bg-white p-8 rounded-[2.5rem] card-shadow border border-slate-50 flex items-center space-x-6 hover:scale-[1.02] transition-transform duration-300 ${'id' in item ? 'cursor-pointer active:scale-95' : ''}`}
            >
              <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}><item.icon size={28}/></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
              </div>
              {'id' in item && (
                <div className={`${expandedStat === item.id ? 'rotate-180' : ''} transition-transform`}>
                   <ChevronDownCircle size={18} className="text-slate-200 group-hover:text-indigo-300" />
                </div>
              )}
            </button>
            
            {/* VENTILATION DETAILLEE */}
            {expandedStat === 'pledges' && item.id === 'pledges' && (
              <div className="absolute top-full left-0 right-0 z-20 mt-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 animate-in slide-in-from-top-4 duration-300">
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest border-b border-slate-50 pb-2">Répartition par Catégorie</h4>
                <div className="space-y-3">
                  {stats.categoryBreakdown.filter(c => c.amount > 0).length > 0 ? stats.categoryBreakdown.filter(c => c.amount > 0).map((c, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-600 uppercase">{c.label}</span>
                      <span className="text-sm font-black text-indigo-600">{c.amount.toLocaleString()} ₪</span>
                    </div>
                  )) : <div className="text-[9px] font-bold text-slate-300 uppercase italic py-2">Aucune donnée</div>}
                </div>
              </div>
            )}
            
            {expandedStat === 'encaissements' && item.id === 'encaissements' && (
              <div className="absolute top-full left-0 right-0 z-20 mt-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 animate-in slide-in-from-top-4 duration-300">
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest border-b border-slate-50 pb-2">Répartition par Compte</h4>
                <div className="space-y-3">
                  {stats.accountBreakdown.filter(a => a.amount > 0).length > 0 ? stats.accountBreakdown.filter(a => a.amount > 0).map((a, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-600 uppercase">{a.label}</span>
                      <span className="text-sm font-black text-emerald-600">{a.amount.toLocaleString()} ₪</span>
                    </div>
                  )) : <div className="text-[9px] font-bold text-slate-300 uppercase italic py-2">Aucune donnée</div>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] card-shadow border border-slate-50">
          <div className="flex items-center justify-between mb-10"><h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3"><PieChart className="text-indigo-600" /> Analyse</h3><span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Saisonnalité: {stats.expected.toFixed(0)}%</span></div>
          <div className="space-y-12">
            <div className="space-y-4">
              <div className="flex justify-between items-end"><label className="text-xs font-black text-slate-400 uppercase tracking-widest">Objectif annuel</label><span className="text-sm font-black text-slate-800">{stats.actual.toFixed(1)}% atteint</span></div>
              <div className="w-full h-8 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 p-1">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl transition-all duration-1000" style={{ width: `${stats.actual}%` }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl">
          <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-3"><Clock className="text-indigo-400" /> État du Fidèle</h3>
          <div className="space-y-6">
            {[
              { label: 'Fidèle Actif', count: updatedFideles.filter(f => f.status === 'ACTIF').length, color: 'bg-emerald-500' },
              { label: 'Nouveau', count: updatedFideles.filter(f => f.status === 'RECENT').length, color: 'bg-sky-500' },
              { label: 'Occasionnel', count: updatedFideles.filter(f => f.status === 'OCCASIONNEL').length, color: 'bg-amber-500' },
              { label: 'Inactif', count: updatedFideles.filter(f => f.status === 'INACTIF').length, color: 'bg-slate-600' }
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4"><div className={`w-3 h-3 rounded-full ${stat.color}`}></div><span className="text-xs font-black text-white uppercase tracking-widest">{stat.label}</span></div>
                <span className="text-xl font-black text-white">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderParametre = () => (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-10">
        <div className="p-4 bg-slate-800 text-white rounded-2xl shadow-lg"><Settings size={32} /></div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic">Paramètre</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configuration et personnalisation</p>
        </div>
      </div>
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 space-y-12">
        <section className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><Layout className="text-indigo-600" /> Branding</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Nom de l'application</label>
               <input 
                 value={config.appName} 
                 onChange={(e) => {
                   const newVal = e.target.value.toUpperCase();
                   setConfig(prev => ({ ...prev, appName: newVal }));
                 }} 
                 className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl outline-none focus:border-indigo-500 transition-all"
               />
             </div>
             <div className="space-y-4">
               <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Logo de la Synagogue</label>
               <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                    {config.logo ? <img src={config.logo} className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-300" size={24} />}
                 </div>
                 <label className="cursor-pointer px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">
                   <Upload size={14} /> Choisir une image
                   <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                 </label>
               </div>
             </div>
          </div>
        </section>

        {/* COMPTES BANCAIRES */}
        <section className="space-y-6 pt-10 border-t border-slate-100">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><Building2 className="text-emerald-600" /> Comptes Bancaires</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(config.bankAccounts || []).map((acc, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                <span className="font-bold text-slate-700 uppercase text-xs">{acc}</span>
                <button onClick={() => setDeleteConfirm({ type: 'bank', id: 'bank', value: acc })} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash size={16}/></button>
              </div>
            ))}
            {addingField === 'bank' ? (
              <div className="flex items-center p-1 border-2 border-emerald-400 rounded-2xl bg-white shadow-lg shadow-emerald-50 animate-in zoom-in-95">
                <input 
                  autoFocus
                  className="flex-1 bg-transparent px-4 py-3 outline-none font-black text-xs uppercase text-slate-600"
                  placeholder="Nom du compte..."
                  value={newBank}
                  onChange={(e) => setNewBank(e.target.value)}
                  onKeyDown={(e) => {
                    if(e.key === 'Enter') handleAddBank();
                    if(e.key === 'Escape') setAddingField(null);
                  }}
                />
                <button onClick={handleAddBank} className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-xl"><Check size={20}/></button>
                <button onClick={() => setAddingField(null)} className="p-3 text-slate-300 hover:text-rose-500"><X size={20}/></button>
              </div>
            ) : (
              <button 
                onClick={() => setAddingField('bank')}
                className="flex items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-emerald-400 hover:text-emerald-600 transition-all font-black text-xs uppercase group bg-white/50 hover:bg-white"
              >
                <Plus size={16} className="mr-2 group-hover:scale-125 transition-transform"/>
                Ajouter un compte
              </button>
            )}
          </div>
        </section>

        {/* TYPES DE PAIEMENT */}
        <section className="space-y-6 pt-10 border-t border-slate-100">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><CreditCard className="text-sky-600" /> Types de paiement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(config.paymentTypes || []).map((pt, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                <span className="font-bold text-slate-700 uppercase text-xs">{pt}</span>
                <button onClick={() => setDeleteConfirm({ type: 'pay', id: 'pay', value: pt })} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash size={16}/></button>
              </div>
            ))}
            {addingField === 'pay' ? (
              <div className="flex items-center p-1 border-2 border-sky-400 rounded-2xl bg-white shadow-lg shadow-sky-50 animate-in zoom-in-95">
                <input 
                  autoFocus
                  className="flex-1 bg-transparent px-4 py-3 outline-none font-black text-xs uppercase text-slate-600"
                  placeholder="Nouveau mode..."
                  value={newPay}
                  onChange={(e) => setNewPay(e.target.value)}
                  onKeyDown={(e) => {
                    if(e.key === 'Enter') handleAddPay();
                    if(e.key === 'Escape') setAddingField(null);
                  }}
                />
                <button onClick={handleAddPay} className="p-3 text-sky-600 hover:bg-sky-50 rounded-xl"><Check size={20}/></button>
                <button onClick={() => setAddingField(null)} className="p-3 text-slate-300 hover:text-rose-500"><X size={20}/></button>
              </div>
            ) : (
              <button 
                onClick={() => setAddingField('pay')}
                className="flex items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-sky-400 hover:text-sky-600 transition-all font-black text-xs uppercase group bg-white/50 hover:bg-white"
              >
                <Plus size={16} className="mr-2 group-hover:scale-125 transition-transform"/>
                Ajouter un mode
              </button>
            )}
          </div>
        </section>

        <section className="space-y-6 pt-10 border-t border-slate-100">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><Waves className="text-indigo-600" /> Catégories d'Événement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(config.categories || []).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                <span className="font-bold text-slate-700 uppercase text-xs">{cat}</span>
                <button onClick={() => setConfig(prev => ({ ...prev, categories: (prev.categories || []).filter(c => c !== cat) }))} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash size={16}/></button>
              </div>
            ))}
            {addingField === 'cat' ? (
              <div className="flex items-center p-1 border-2 border-indigo-400 rounded-2xl bg-white shadow-lg shadow-indigo-50 animate-in zoom-in-95">
                <input 
                  autoFocus
                  className="flex-1 bg-transparent px-4 py-3 outline-none font-black text-xs uppercase text-slate-600"
                  placeholder="Nouvelle catégorie..."
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => {
                    if(e.key === 'Enter') handleAddCat();
                    if(e.key === 'Escape') setAddingField(null);
                  }}
                />
                <button onClick={handleAddCat} className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-xl"><Check size={20}/></button>
                <button onClick={() => setAddingField(null)} className="p-3 text-slate-300 hover:text-rose-500"><X size={20}/></button>
              </div>
            ) : (
              <button 
                onClick={() => setAddingField('cat')}
                className="flex items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all font-black text-xs uppercase group bg-white/50 hover:bg-white"
              >
                <Plus size={16} className="mr-2 group-hover:scale-125 transition-transform"/>
                Ajouter
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const renderEvenement = () => {
    const filteredEvents = events.filter(e => e.name.toLowerCase().includes(eventSearch.toLowerCase()));
    return (
      <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-180px)] gap-6 md:gap-8 animate-in fade-in duration-500">
        <div className={`w-full lg:w-[380px] bg-white rounded-[2.5rem] card-shadow flex flex-col overflow-hidden border border-slate-50 ${selectedEventId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center justify-between mb-8"><div className="flex items-center space-x-3"><div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><Calendar size={24} /></div><h3 className="text-xl font-extrabold uppercase tracking-tight text-slate-800">Événement</h3></div><button onClick={() => setIsAddingEvent(true)} className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Plus size={20} /></button></div>
            <div className="relative"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input placeholder="Chercher un événement..." value={eventSearch} onChange={(e) => setEventSearch(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-xl font-bold text-sm outline-none" /></div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {filteredEvents.map((e, idx) => (
              <div key={e.id} draggable onDragStart={() => handleDragStart(idx)} onDragOver={handleDragOver} onDrop={() => handleDrop(idx)} className={`flex items-center gap-2 group cursor-move ${draggedEventIndex === idx ? 'opacity-20' : ''}`}>
                <div className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"><GripVertical size={16}/></div>
                <button onClick={() => { setSelectedEventId(e.id); setIsEditingEventHeader(false); }} className={`flex-1 flex items-center justify-between px-5 py-4 rounded-xl transition-all ${selectedEventId === e.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-700 bg-slate-50/50 hover:bg-slate-100'}`}>
                  <div className="flex flex-col items-start truncate mr-4">
                    <span className="truncate w-full font-black text-xs uppercase">{e.name}</span>
                    <span className={`text-[8px] font-bold opacity-70 uppercase ${selectedEventId === e.id ? 'text-white' : 'text-slate-400'}`}>{e.category}</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className={`flex-1 bg-white rounded-[2.5rem] card-shadow overflow-hidden flex flex-col border border-slate-50 ${!selectedEventId ? 'hidden lg:flex' : 'flex'}`}>
          {selectedEvent ? <>
            <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-white gap-6">
              <div className="flex items-center space-x-6 w-full md:w-auto">
                <button onClick={() => setSelectedEventId(null)} className="lg:hidden p-2.5 bg-indigo-50 text-indigo-600 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase"><ChevronLeft size={20} /><span>Liste</span></button>
                <div className="flex-1 min-w-0">
                  {isEditingEventHeader ? (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 bg-slate-50 p-4 rounded-2xl border border-indigo-200">
                       <input autoFocus value={selectedEvent.name} onChange={(e) => updateEventInfo(selectedEvent.id, { name: e.target.value })} className="text-2xl font-black text-slate-900 uppercase border-b-2 border-indigo-600 outline-none w-full bg-transparent" />
                       <div className="flex flex-wrap gap-4">
                         <input type="date" value={selectedEvent.date} onChange={(e) => updateEventInfo(selectedEvent.id, { date: e.target.value })} className="text-[10px] font-bold p-2 border rounded-lg bg-white" />
                         <select value={selectedEvent.category} onChange={(e) => updateEventInfo(selectedEvent.id, { category: e.target.value })} className="text-[10px] font-bold p-2 border rounded-lg bg-white">
                           {(config.categories || []).map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                         <button onClick={() => setIsEditingEventHeader(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase">Valider</button>
                       </div>
                    </div>
                  ) : (
                    <div className="group relative">
                      <h2 className="text-4xl font-black text-slate-950 tracking-tight uppercase truncate leading-tight">{selectedEvent.name}</h2>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{selectedEvent.category} • {selectedEvent.date && new Date(selectedEvent.date).toLocaleDateString()}</p>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setIsEditingEventHeader(true)} className="text-slate-300 hover:text-indigo-600 p-1"><Edit3 size={14}/></button>
                          <button onClick={() => setDeleteConfirm({ type: 'event', id: selectedEvent.id })} className="text-slate-300 hover:text-rose-500 p-1"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setIsAddingSlot(true)} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-[9px] uppercase shadow-lg shadow-indigo-100 flex items-center gap-2"><Plus size={16} /> Ajouter</button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/20 space-y-4">
              {currentHonors.map((slot, idx) => {
                const pledge = pledges.find(p => p.eventId === selectedEventId && p.slotName === slot.name && p.officeName === slot.office);
                return (
                  <div key={idx} className={`flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center p-5 rounded-[1.5rem] border transition-all ${pledge?.isOffered ? 'bg-slate-100 opacity-60' : pledge?.fideleId ? 'bg-emerald-50 border-emerald-200' : 'bg-white'}`}>
                    <div className="w-full sm:col-span-3 font-black text-xs uppercase text-slate-900">{slot.name}</div>
                    <div className="w-full sm:col-span-5"><FideleSearch fideles={fideles} selectedId={pledge?.fideleId} onSelect={(id) => updatePledge(selectedEventId!, slot.name, slot.office, id, pledge?.amount || 0, pledge?.isOffered)} /></div>
                    <div className="w-full sm:col-span-2"><input type="number" value={pledge?.amount || ''} onChange={(e) => updatePledge(selectedEventId!, slot.name, slot.office, pledge?.fideleId || '', Number(e.target.value), pledge?.isOffered)} className="w-full py-2 bg-white/40 border rounded-lg text-center font-black text-xl outline-none" /></div>
                    <div className="w-full sm:col-span-2 flex justify-center gap-2">
                       <button onClick={() => updatePledge(selectedEventId!, slot.name, slot.office, pledge?.fideleId || '', pledge?.amount || 0, !pledge?.isOffered)} className={`flex-1 py-2 rounded-lg font-black text-[8px] uppercase ${pledge?.isOffered ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{pledge?.isOffered ? 'OFFERT' : 'VENDRE'}</button>
                       <button onClick={() => setDeleteConfirm({ type: 'slot', id: selectedEvent.id, slot })} className="p-2 text-slate-200 hover:text-rose-500"><Trash2 size={16}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </> : <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10"><CalendarDays size={48} className="opacity-20 mb-4" /><p className="font-bold uppercase tracking-widest text-xs">Sélectionnez un événement</p></div>}
        </div>
      </div>
    );
  };

  const renderFideleDetailInline = (f: Fidele) => {
    const fPledges = pledges.filter(p => p.fideleId === f.id);
    const fEncaissements = encaissements.filter(e => e.fideleId === f.id);
    const totalDue = f.totalPromesses - f.montantPaye;
    
    return (
      <div className="bg-slate-50/80 p-10 border-t border-slate-100 animate-in slide-in-from-top-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><History size={14} className="text-indigo-600" /> Dons</h4>
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100"><tr className="text-[8px] font-black text-slate-400 uppercase"><th className="px-6 py-4">Fête</th><th className="px-6 py-4">Action</th><th className="px-6 py-4 text-right">Montant</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {fPledges.length > 0 ? fPledges.sort((a,b) => b.date.localeCompare(a.date)).map(p => {
                    const event = events.find(e => e.id === p.eventId);
                    return (
                      <tr key={p.id} className="text-[10px] font-bold text-slate-600">
                        <td className="px-6 py-4 uppercase font-black">{event?.name || '---'}</td>
                        <td className="px-6 py-4 text-indigo-600 uppercase italic">{p.slotName}</td>
                        <td className="px-6 py-4 text-right font-black text-slate-900">{p.amount.toLocaleString()} ₪</td>
                      </tr>
                    );
                  }) : (<tr><td colSpan={3} className="px-6 py-8 text-center text-[9px] font-black text-slate-300 uppercase italic">Aucun don</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Wallet size={14} className="text-emerald-600" /> Paiement</h4>
            <div className={`p-8 rounded-[2rem] text-white shadow-xl flex flex-col items-center justify-center text-center ${totalDue > 0 ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{totalDue > 0 ? 'Dû' : 'À jour'}</p>
                <p className="text-4xl font-black">{Math.abs(totalDue).toLocaleString()} ₪</p>
                {totalDue > 0 && <button onClick={() => { setSelectedFideleId(f.id); setIsAddingEncaissement(true); }} className="mt-4 px-6 py-2 bg-white/20 rounded-full text-[9px] font-black uppercase">Régler</button>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDERING PAGE LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen sidebar-gradient flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white rounded-[3rem] shadow-2xl p-10 space-y-10 border border-white/10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-48 h-48 bg-slate-50 rounded-[2.5rem] flex items-center justify-center shadow-xl border border-slate-100 p-6">
                <AppLogo config={config} className="w-full h-full" iconClassName="w-24 h-24 text-indigo-900" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight">{config.appName}</h2>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Identifiant (Email)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    name="email" 
                    type="email" 
                    required 
                    defaultValue="admin@nedava.com"
                    placeholder="admin@nedava.com"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    name="password" 
                    type="password" 
                    required 
                    defaultValue="admin"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" 
                  />
                </div>
              </div>
              
              {loginError && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                  <AlertCircle size={14} /> {loginError}
                </div>
              )}

              <button 
                type="submit" 
                className="w-full py-5 bg-[#4A4DE6] text-white rounded-[2rem] font-black text-xl uppercase tracking-tighter shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Se connecter
              </button>
            </form>
          </div>
          
          <div className="mt-12 text-center space-y-2 opacity-60">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Nedava Smart</h3>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">La gestion des dons, simplifiée</p>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING MAIN APP ---
  return (
    <div className="flex min-h-screen bg-[#f4f7fe]">
      <aside className="w-[300px] sidebar-gradient text-white flex flex-col sticky top-0 h-screen hidden lg:flex shadow-2xl z-40">
        <div className="p-10 flex flex-col h-full">
          <div className="flex items-center space-x-4 mb-12">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl p-2">
              <AppLogo config={config} className="w-full h-full" iconClassName="w-10 h-10 text-indigo-900" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tighter leading-tight uppercase truncate">{config.appName}</h1>
            </div>
          </div>
          <nav className="space-y-3 flex-1">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
              { id: 'fidele', icon: Users, label: 'Fidèle' },
              { id: 'evenement', icon: CalendarDays, label: 'Événement' },
              { id: 'paiement', icon: Wallet, label: 'Paiement' },
              { id: 'parametre', icon: Settings, label: 'Paramètre' }
            ].map(nav => (
              <button key={nav.id} onClick={() => { setCurrentView(nav.id as ViewType); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all text-xs font-extrabold uppercase tracking-widest ${currentView === nav.id ? 'active-nav text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><nav.icon size={20} /><span>{nav.label}</span></button>
            ))}
          </nav>
          
          <button 
            onClick={handleLogout}
            className="mt-10 flex items-center space-x-4 px-6 py-4 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-all text-xs font-extrabold uppercase tracking-widest"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <aside className={`fixed top-0 left-0 h-screen w-[280px] sidebar-gradient text-white z-[110] lg:hidden transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="p-8 h-full flex flex-col">
           <div className="flex justify-between items-center mb-10">
             <div className="flex items-center space-x-3">
               <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-1.5">
                 <AppLogo config={config} className="w-full h-full" iconClassName="w-8 h-8 text-indigo-900" />
               </div>
               <h1 className="text-xl font-black tracking-tighter uppercase italic truncate mr-4">{config.appName}</h1>
             </div>
             <button onClick={() => setIsSidebarOpen(false)}><X size={24}/></button>
           </div>
           <nav className="space-y-4 flex-1">
             {[
               { id: 'dashboard', label: 'Dashboard' },
               { id: 'fidele', label: 'Fidèle' },
               { id: 'evenement', label: 'Événement' },
               { id: 'paiement', label: 'Paiement' },
               { id: 'parametre', label: 'Paramètre' }
             ].map(nav => (
               <button key={nav.id} onClick={() => { setCurrentView(nav.id as ViewType); setIsSidebarOpen(false); }} className={`w-full text-left px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest ${currentView === nav.id ? 'active-nav' : 'text-slate-400'}`}>{nav.label}</button>
             ))}
           </nav>
           <button 
            onClick={handleLogout}
            className="mt-10 flex items-center space-x-4 px-6 py-4 rounded-2xl text-slate-400 text-xs font-black uppercase tracking-widest"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
         </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <header className="px-10 py-6 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100">
          <div className="flex items-center space-x-4"><button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-indigo-600 bg-indigo-50 rounded-lg"><Menu size={24}/></button><span className="text-[#4A4DE6] font-extrabold text-2xl tracking-tighter uppercase italic">{currentView}</span></div>
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-100 uppercase overflow-hidden p-2">
            <AppLogo config={config} className="w-full h-full" iconClassName="w-7 h-7 text-white" />
          </div>
        </header>

        <div className="p-4 md:p-10 max-w-[1600px] mx-auto w-full flex-1">
          {currentView === 'dashboard' && renderDashboard()}
          {currentView === 'fidele' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic">Registre du Fidèle</h2>
                <div className="flex gap-4">
                  <div className="relative w-64 hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input placeholder="Recherche..." value={fideleSearch} onChange={(e) => setFideleSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <button onClick={() => setIsAddingFidele(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"><Plus size={18}/><span>Nouveau</span></button>
                </div>
              </div>
              <div className="bg-white rounded-[2.5rem] card-shadow border border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                        <th className="px-10 py-6">Fidèle</th>
                        <th className="px-10 py-6">Statut</th>
                        <th className="px-10 py-6 text-right">Dette Totale</th>
                        <th className="px-10 py-6 text-right">Réglé</th>
                        <th className="px-10 py-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {updatedFideles.map(f => {
                        const isExpanded = selectedFideleId === f.id;
                      return (
  <React.Fragment key={f.id}>
    {/* ... ton contenu actuel (tr, etc.) ... */}
  </React.Fragment>
);
