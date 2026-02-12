
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, LayoutDashboard, CalendarDays, Plus, Search, 
  ChevronRight, TrendingUp, Wallet, CheckCircle2, 
  Clock, History, AlertCircle, Waves, Calendar, 
  ChevronDown, X, Edit3, PieChart, Gift, Save, Mail, 
  Phone, Trash2, Check, Pencil, AlertTriangle, Users2, ChevronUp,
  RefreshCw, Landmark, Loader2, Copy, ArrowUpRight, Scale, Menu, ChevronLeft
} from 'lucide-react';
import { Fidele, Event, Pledge, Encaissement, ViewType, ReceiptPreference, TransactionType, BankAccount, DonationCategory, EventSlot } from './types';
import { 
  RAW_EVENTS, OFFICES, DONATION_CATEGORIES, BANK_ACCOUNTS,
  SHABBAT_TEMPLATE, ROCH_HACHANA_TEMPLATE, YOM_KIPPOUR_TEMPLATE, SIMHA_TORAH_TEMPLATE,
  DEFAULT_FIDELES
} from './constants';

// --- COMPOSANT DE RECHERCHE DE FIDÈLE (AUTOCOMPLETE) ---
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
            <button 
              type="button"
              title="Supprimer le fidèle"
              onClick={(e) => { 
                e.stopPropagation(); 
                onSelect(''); 
                setQuery(''); 
              }}
              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
          <ChevronDown size={16} className={`${selectedFidele ? 'text-indigo-400' : 'text-slate-400'} pointer-events-none`} />
        </div>
      </div>
      
      {isOpen && query.trim() !== '' && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {filtered.length > 0 ? (
            filtered.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  onSelect(f.id);
                  setQuery('');
                  setIsOpen(false);
                }}
                className="w-full text-left px-5 py-3 hover:bg-indigo-50 transition-colors flex items-center justify-between group"
              >
                <span className="font-black text-xs text-slate-700 group-hover:text-indigo-600 uppercase">
                  {f.prenom} {f.nom}
                </span>
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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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

  const getSlotsForEvent = (event: Event): EventSlot[] => {
    if (Array.isArray(event.slots)) return event.slots;
    const name = event.name.toLowerCase();
    if (name.includes('roch hachana')) return ROCH_HACHANA_TEMPLATE;
    if (name.includes('yom kipour')) return YOM_KIPPOUR_TEMPLATE;
    if (name.includes('simha torah')) return SIMHA_TORAH_TEMPLATE;
    if (event.category === 'SHABAT' || name.startsWith('shabat')) return SHABBAT_TEMPLATE;
    return [];
  };

  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('syna_events');
    if (saved) return JSON.parse(saved);
    return RAW_EVENTS.map((e, index) => {
      const cleanName = e.category === 'SHABAT' 
        ? e.name.replace(/^(shabat|SHABAT|Shabat|Shabbat)\s+/i, '') 
        : e.name;

      const tempEvent: Event = {
        id: `evt-${index}`,
        name: cleanName,
        isShabbat: e.category === 'SHABAT',
        category: e.category as DonationCategory,
        date: (e as any).date || new Date().toISOString().split('T')[0],
      };
      return { ...tempEvent, slots: getSlotsForEvent(tempEvent) };
    });
  });

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedFideleId, setSelectedFideleId] = useState<string | null>(null);
  const [isAddingFidele, setIsAddingFidele] = useState(false);
  const [editingFideleId, setEditingFideleId] = useState<string | null>(null);
  const editingFidele = useMemo(() => fideles.find(f => f.id === editingFideleId), [fideles, editingFideleId]);

  const [isAddingEncaissement, setIsAddingEncaissement] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [newSlotValue, setNewSlotValue] = useState("");
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlotName, setNewSlotName] = useState("");
  const [newSlotOffice, setNewSlotOffice] = useState(OFFICES[1]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'event' | 'slot'; id: string; slot?: EventSlot } | null>(null);
  const [eventSearch, setEventSearch] = useState('');
  const [fideleSearch, setFideleSearch] = useState('');
  const [showPledgeDistribution, setShowPledgeDistribution] = useState(false);
  const [showCollectionDistribution, setShowCollectionDistribution] = useState(false);
  const [showFideleDistribution, setShowFideleDistribution] = useState(false);

  useEffect(() => { localStorage.setItem('syna_fideles', JSON.stringify(fideles)); }, [fideles]);
  useEffect(() => { localStorage.setItem('syna_pledges', JSON.stringify(pledges)); }, [pledges]);
  useEffect(() => { localStorage.setItem('syna_encaissements', JSON.stringify(encaissements)); }, [encaissements]);
  useEffect(() => { localStorage.setItem('syna_events', JSON.stringify(events)); }, [events]);

  // AUTO-SÉLECTION UNIQUEMENT SUR DESKTOP
  useEffect(() => { 
    if (!selectedEventId && events.length > 0 && window.innerWidth > 1024) {
      setSelectedEventId(events[0].id); 
    }
  }, [events, selectedEventId]);

  const selectedEvent = useMemo(() => events.find(e => e.id === selectedEventId), [events, selectedEventId]);
  const isShabbatEvent = useMemo(() => selectedEvent?.category === 'SHABAT', [selectedEvent]);
  const currentHonors = useMemo(() => selectedEvent?.slots || [], [selectedEvent]);

  const moveEvent = (id: string, direction: 'up' | 'down') => {
    setEvents(prev => {
      const index = prev.findIndex(e => e.id === id);
      if (index === -1) return prev;
      const newEvents = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newEvents.length) return prev;
      [newEvents[index], newEvents[targetIndex]] = [newEvents[targetIndex], newEvents[index]];
      return newEvents;
    });
  };

  const duplicateEvent = (id: string) => {
    const sourceEvent = events.find(e => e.id === id);
    if (!sourceEvent) return;

    const newEvent: Event = {
      ...sourceEvent,
      id: Math.random().toString(36).substr(2, 9),
      name: `${sourceEvent.name} (copie)`,
      date: sourceEvent.date || new Date().toISOString().split('T')[0],
      slots: sourceEvent.slots ? [...sourceEvent.slots] : []
    };

    setEvents(prev => [...prev, newEvent]);
    setSelectedEventId(newEvent.id);
  };

  const moveSlot = (eventId: string, index: number, direction: 'up' | 'down') => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId && e.slots) {
        const newSlots = [...e.slots];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSlots.length) return e;
        [newSlots[index], newSlots[targetIndex]] = [newSlots[targetIndex], newSlots[index]];
        return { ...e, slots: newSlots };
      }
      return e;
    }));
  };

  const updateSlotOffice = (eventId: string, slotIndex: number, newOffice: string) => {
    const oldSlot = events.find(e => e.id === eventId)?.slots?.[slotIndex];
    if (!oldSlot) return;
    setEvents(prev => prev.map(e => {
      if (e.id === eventId && e.slots) {
        const newSlots = [...e.slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], office: newOffice };
        return { ...e, slots: newSlots };
      }
      return e;
    }));
    setPledges(prev => prev.map(p => 
      (p.eventId === eventId && p.slotName === oldSlot.name && p.officeName === oldSlot.office)
      ? { ...p, officeName: newOffice }
      : p
    ));
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
    const newEncaissement: Encaissement = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      numero: encaissements.length + 1,
    };
    setEncaissements(prev => [...prev, newEncaissement]);
    setIsAddingEncaissement(false);
  };

  const updatePledge = (eventId: string, slotName: string, officeName: string, fideleId: string, amount: number, isOffered: boolean = false) => {
    const event = events.find(ev => ev.id === eventId);
    setPledges(prev => {
      const existingIndex = prev.findIndex(p => p.eventId === eventId && p.slotName === slotName && p.officeName === officeName);
      
      const newPledge: Pledge = { 
        id: Math.random().toString(36).substr(2, 9), 
        eventId, 
        slotName,
        officeName,
        fideleId, 
        amount, 
        isOffered,
        category: event?.category || 'SHABAT',
        date: event?.date || new Date().toISOString()
      };
      
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = newPledge;
        return updated;
      }
      return [...prev, newPledge];
    });
  };

  const addEvent = (name: string, category: DonationCategory, date?: string) => {
    const newEvent: Event = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      category,
      date,
      isShabbat: category === 'SHABAT',
      slots: []
    };
    setEvents(prev => [...prev, newEvent]);
    setSelectedEventId(newEvent.id);
    setIsAddingEvent(false);
  };

  const updateEventInfo = (id: string, updates: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates, isShabbat: (updates.category || e.category) === 'SHABAT' } : e));
    if (updates.date || updates.category) {
        setPledges(prev => prev.map(p => p.eventId === id ? { ...p, date: updates.date || p.date, category: updates.category || p.category } : p));
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'event') {
      const targetId = deleteConfirm.id;
      setEvents(prev => prev.filter(e => e.id !== targetId));
      setPledges(prev => prev.filter(p => p.eventId !== targetId));
      if (selectedEventId === targetId) setSelectedEventId(null);
    } else if (deleteConfirm.type === 'slot' && deleteConfirm.slot) {
      const targetId = deleteConfirm.id;
      const targetSlot = deleteConfirm.slot;
      setEvents(prev => prev.map(e => {
        if (e.id === targetId) {
          const currentSlots = e.slots || [];
          return { ...e, slots: currentSlots.filter(s => !(s.name === targetSlot.name && s.office === targetSlot.office)) };
        }
        return e;
      }));
      setPledges(prev => prev.filter(p => !(p.eventId === targetId && p.slotName === targetSlot.name && p.officeName === targetSlot.office)));
    }
    setDeleteConfirm(null);
  };

  const confirmAddSlot = () => {
    if (!selectedEventId || !newSlotName.trim()) return;
    const targetId = selectedEventId;
    const nameToAdd = newSlotName.trim();
    const officeToAdd = isShabbatEvent ? 'Chaharit 1' : newSlotOffice;
    setEvents(prev => prev.map(e => {
      if (e.id === targetId) {
        const currentSlots = e.slots || [];
        return { ...e, slots: [...currentSlots, { name: nameToAdd, office: officeToAdd }] };
      }
      return e;
    }));
    setNewSlotName("");
    setIsAddingSlot(false);
  };

  const updateSlotName = (eventId: string, oldSlot: EventSlot, newName: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        const currentSlots = e.slots || [];
        return { ...e, slots: currentSlots.map(s => (s.name === oldSlot.name && s.office === oldSlot.office) ? { ...s, name: newName } : s) };
      }
      return e;
    }));
    setPledges(prev => prev.map(p => (p.eventId === eventId && p.slotName === oldSlot.name && p.officeName === oldSlot.office) ? { ...p, slotName: newName } : p));
    setEditingSlotIndex(null);
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
      if (createdDaysAgo < 30) status = 'RECENT';
      else if (daysSinceLastPayment !== null && daysSinceLastPayment < 90) status = 'ACTIF';
      else if (fEncaissements.length > 0) status = 'OCCASIONNEL';
      return { ...f, totalPromesses: totalPromised, montantPaye: totalPaidNis, status, lastPaymentDate: lastPayment?.date, daysSinceLastPayment };
    }).filter(f => 
      f.nom.toLowerCase().includes(fideleSearch.toLowerCase()) || 
      f.prenom.toLowerCase().includes(fideleSearch.toLowerCase())
    ).sort((a, b) => a.nom.localeCompare(b.nom));
  }, [fideles, pledges, encaissements, fideleSearch]);

  const stats = useMemo(() => {
    const totalPromisedNis = updatedFideles.reduce((sum, f) => sum + f.totalPromesses, 0);
    const totalPaidNis = updatedFideles.reduce((sum, f) => sum + f.montantPaye, 0);
    const totalDueNis = Math.max(0, totalPromisedNis - totalPaidNis);
    const startDate = new Date('2025-09-23').getTime();
    const endDate = new Date('2026-09-11').getTime();
    const now = Math.min(Math.max(new Date().getTime(), startDate), endDate);
    const timeProgress = (now - startDate) / (endDate - startDate);
    const expectedCollectionPercent = timeProgress * 100;
    const actualCollectionPercent = totalPromisedNis > 0 ? (totalPaidNis / totalPromisedNis) * 100 : 0;
    const isLate = actualCollectionPercent < expectedCollectionPercent - 5;
    const countActif = updatedFideles.filter(f => f.status === 'ACTIF').length;
    const countOccasionnel = updatedFideles.filter(f => f.status === 'OCCASIONNEL').length;
    const countRecent = updatedFideles.filter(f => f.status === 'RECENT').length;
    const countInactif = updatedFideles.filter(f => f.status === 'INACTIF').length;
    const pledgeByCat = DONATION_CATEGORIES.map(cat => ({
      name: cat,
      total: pledges.filter(p => p.category === cat && !p.isOffered).reduce((s, p) => s + p.amount, 0)
    }));
    const collectionByAccount = BANK_ACCOUNTS.map(acc => {
      const total = encaissements.filter(e => e.compte === acc).reduce((s, e) => s + e.montantNis, 0);
      return { name: acc.toUpperCase(), total };
    });
    return { 
      totalPromisedNis, totalPaidNis, totalDueNis, 
      expectedCollectionPercent, actualCollectionPercent, isLate, 
      pledgeByCat, collectionByAccount,
      totalFideles: updatedFideles.length,
      countActif, countOccasionnel, countRecent, countInactif
    };
  }, [updatedFideles, pledges, encaissements]);

  const renderFideleDetailInline = (f: Fidele) => {
    const fPledges = pledges.filter(p => p.fideleId === f.id);
    const fEncaissements = encaissements.filter(e => e.fideleId === f.id);
    const individualCollectionPercent = f.totalPromesses > 0 ? (f.montantPaye / f.totalPromesses) * 100 : 0;
    const isDebtLate = f.totalPromesses > f.montantPaye && fPledges.some(p => {
        if (p.isOffered) return false;
        const pledgeDate = new Date(p.date).getTime();
        const diffMonths = (new Date().getTime() - pledgeDate) / (1000 * 3600 * 24 * 30);
        return diffMonths > 6;
    });
    const currentPledgesTotal = fPledges.filter(p => !p.isOffered).reduce((s, p) => s + p.amount, 0);

    return (
      <div className="bg-indigo-100/50 p-4 md:p-8 border-t-4 border-indigo-600 shadow-inner animate-in slide-in-from-top-6 duration-700 relative overflow-hidden w-full">
        <div className="max-w-full mx-auto space-y-6 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-100/80 p-6 rounded-[1.5rem] shadow-sm border border-slate-200 flex flex-col items-center text-center transform transition hover:scale-[1.02]">
              <div className="w-10 h-10 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mb-3"><Scale size={20} /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Antériorité</p>
              <div className="flex items-baseline gap-1"><span className="text-xl md:text-2xl font-black text-slate-600">{(f.balancePrecedente || 0).toLocaleString()}</span><span className="text-lg font-bold text-slate-400">₪</span></div>
            </div>
            <div className="bg-white p-6 rounded-[1.5rem] shadow-md border border-indigo-200/50 flex flex-col items-center text-center transform transition hover:scale-[1.02]">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Dette Totale</p>
              <div className="flex items-baseline gap-1"><span className="text-3xl md:text-4xl font-black text-slate-900">{f.totalPromesses.toLocaleString()}</span><span className="text-xl font-bold text-slate-300">₪</span></div>
            </div>
            <div className="bg-white p-6 rounded-[1.5rem] shadow-md border border-emerald-200/50 flex flex-col items-center text-center transform transition hover:scale-[1.02]">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Total Payé</p>
              <div className="flex items-baseline gap-1"><span className="text-3xl md:text-4xl font-black text-emerald-600">{f.montantPaye.toLocaleString()}</span><span className="text-xl font-bold text-emerald-300">₪</span></div>
            </div>
            <div className="bg-white p-6 rounded-[1.5rem] shadow-md border border-rose-200/50 flex flex-col items-center text-center transform transition hover:scale-[1.02]">
              <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isDebtLate ? 'text-rose-600' : 'text-slate-400'}`}>Reste à recouvrer</p>
              <div className="flex items-baseline gap-1"><span className={`text-3xl md:text-4xl font-black ${isDebtLate ? 'text-rose-600' : 'text-indigo-900'}`}>{(f.totalPromesses - f.montantPaye).toLocaleString()}</span><span className="text-xl font-bold text-rose-300">₪</span></div>
            </div>
            <div className="bg-indigo-600 p-6 rounded-[1.5rem] flex flex-col items-center justify-center text-center shadow-xl shadow-indigo-200 sm:col-span-2 lg:col-span-1">
              <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-2">Dernier versement</p>
              <p className="text-sm md:text-base font-black text-white uppercase italic leading-tight">{f.lastPaymentDate ? new Date(f.lastPaymentDate).toLocaleDateString() : 'AUCUN'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-[2rem] border border-indigo-200 shadow-lg overflow-hidden flex flex-col">
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100"><h4 className="text-xs font-black uppercase tracking-widest text-indigo-950">Engagements Enregistrés</h4></div>
              <div className="overflow-x-auto custom-scrollbar max-h-[300px] overflow-y-auto">
                <table className="w-full text-left min-w-[300px]"><thead className="bg-indigo-50/70 border-b border-indigo-100 text-[9px] font-black uppercase text-indigo-500 sticky top-0"><tr><th className="px-6 py-3">Date</th><th className="px-6 py-3">Type</th><th className="px-6 py-3 text-right">Montant</th></tr></thead>
                <tbody className="divide-y divide-indigo-50">
                  {fPledges.length > 0 ? fPledges.sort((a,b) => b.date.localeCompare(a.date)).map(p => (
                    <tr key={p.id} className={`group hover:bg-indigo-50/40 ${p.isOffered ? 'opacity-30' : ''}`}><td className="px-6 py-3 font-bold text-slate-400 text-[10px]">{new Date(p.date).toLocaleDateString()}</td><td className="px-6 py-3"><p className="font-black text-indigo-900 uppercase text-[11px] leading-tight">{p.slotName}</p></td><td className="px-6 py-3 text-right font-black text-slate-800 text-[12px]">{p.amount.toLocaleString()} ₪</td></tr>
                  )) : <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-300 italic text-[10px] uppercase font-black tracking-widest">Aucune promesse</td></tr>}
                </tbody></table>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] border border-emerald-100 shadow-lg overflow-hidden flex flex-col">
              <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100"><h4 className="text-xs font-black uppercase tracking-widest text-emerald-950">Derniers Versements</h4></div>
              <div className="overflow-x-auto custom-scrollbar max-h-[300px] overflow-y-auto">
                <table className="w-full text-left min-w-[300px]"><thead className="bg-emerald-50/70 border-b border-emerald-100 text-[9px] font-black uppercase text-emerald-600 sticky top-0"><tr><th className="px-6 py-3">Date</th><th className="px-6 py-3">Trans.</th><th className="px-6 py-3 text-right">Montant</th></tr></thead>
                <tbody className="divide-y divide-emerald-50">
                  {fEncaissements.length > 0 ? fEncaissements.sort((a,b) => b.date.localeCompare(a.date)).map(e => (
                    <tr key={e.id} className="group hover:bg-emerald-50/40"><td className="px-6 py-3 font-bold text-slate-400 text-[10px]">{new Date(e.date).toLocaleDateString()}</td><td className="px-6 py-3 font-black text-emerald-800 uppercase text-[9px]">{e.type}</td><td className="px-6 py-3 text-right font-black text-emerald-600 text-[12px]">{e.montantNis.toLocaleString()} ₪</td></tr>
                  )) : <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-300 italic text-[10px] uppercase font-black tracking-widest">Aucun versement</td></tr>}
                </tbody></table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6 md:space-y-10 pb-20 animate-in fade-in duration-700">
      <section>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-indigo-600 rounded-lg text-white shadow-lg"><LayoutDashboard size={24} /></div>
          <div>
            <h3 className="text-xl font-extrabold uppercase tracking-tight text-slate-800">Résumé Synagogue</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Activité et flux financiers</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {[
            { label: 'Promesses', val: stats.totalPromisedNis, color: 'indigo', icon: <Waves size={14}/>, action: () => setShowPledgeDistribution(!showPledgeDistribution), isOpen: showPledgeDistribution },
            { label: 'Encaissé', val: stats.totalPaidNis, color: 'emerald', icon: <Wallet size={14}/>, action: () => setShowCollectionDistribution(!showCollectionDistribution), isOpen: showCollectionDistribution },
            { label: 'Reste dû', val: stats.totalDueNis, color: 'orange', icon: <Clock size={14}/> },
            { label: 'Fidèles', val: stats.totalFideles, color: 'slate', icon: <Users2 size={14}/>, action: () => setShowFideleDistribution(!showFideleDistribution), isOpen: showFideleDistribution, suffix: 'Fidèles' }
          ].map((card, i) => (
            <div key={i} className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] card-shadow border border-slate-50 relative group cursor-pointer" onClick={card.action}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                {card.action && <div className={`p-2 rounded-full transition-all ${card.isOpen ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-400'}`}><ChevronDown size={14} className={card.isOpen ? 'rotate-180' : ''}/></div>}
              </div>
              <div className="flex items-baseline space-x-2 mb-4">
                <span className={`text-2xl md:text-3xl font-extrabold ${card.color === 'orange' ? 'text-orange-500' : 'text-slate-900'}`}>{card.val.toLocaleString()}</span>
                <span className={`text-base font-bold ${card.color === 'orange' ? 'text-orange-500' : 'text-slate-900'}`}>{card.suffix || '₪'}</span>
              </div>
              <div className={`flex items-center space-x-2 text-[10px] font-extrabold uppercase tracking-widest text-${card.color}-600`}>{card.icon}<span>Détails</span></div>
            </div>
          ))}
        </div>
        
        {(showPledgeDistribution || showCollectionDistribution || showFideleDistribution) && (
          <div className="bg-white p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] card-shadow border border-slate-100 mb-8 animate-in slide-in-from-top-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {showPledgeDistribution && stats.pledgeByCat.map(item => (
                  <div key={item.name} className="p-4 md:p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">{item.name}</p>
                    <div className="flex items-baseline gap-1"><span className="text-xl font-black text-slate-900">{item.total.toLocaleString()}</span><span className="text-xs font-bold text-slate-400">₪</span></div>
                  </div>
                ))}
                {showCollectionDistribution && stats.collectionByAccount.map(item => (
                  <div key={item.name} className="p-4 md:p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">{item.name}</p>
                    <div className="flex items-baseline gap-1"><span className="text-xl font-black text-slate-900">{item.total.toLocaleString()}</span><span className="text-xs font-bold text-slate-400">₪</span></div>
                  </div>
                ))}
                {showFideleDistribution && [
                  {l: 'Actif', v: stats.countActif, c: 'emerald'}, {l: 'Occas.', v: stats.countOccasionnel, c: 'indigo'}, {l: 'Récent', v: stats.countRecent, c: 'sky'}, {l: 'Inactif', v: stats.countInactif, c: 'slate'}
                ].map(p => (
                  <div key={p.l} className={`p-4 md:p-6 bg-${p.c}-50/30 rounded-2xl border border-${p.c}-100`}>
                    <p className={`text-[9px] font-black text-${p.c}-500 uppercase mb-2`}>{p.l}</p><span className="text-2xl font-black text-slate-800">{p.v}</span>
                  </div>
                ))}
             </div>
          </div>
        )}
      </section>
      <section className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] card-shadow border border-slate-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center space-x-4"><div className="p-3 md:p-4 bg-rose-100 text-rose-500 rounded-2xl"><AlertCircle size={24} /></div><div><h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-800 uppercase">Santé des encaissements</h3></div></div>
          <div className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-3xl border ${stats.isLate ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'} text-center min-w-[200px] md:min-w-[280px]`}><p className="text-base md:text-xl font-black uppercase flex items-center justify-center gap-2">{stats.isLate ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}{stats.isLate ? 'Retard' : 'Objectif'}</p></div>
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-end mb-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest"><p className="text-emerald-500">{stats.actualCollectionPercent.toFixed(1)}% payés</p><p className="text-indigo-600">Objectif : {stats.expectedCollectionPercent.toFixed(1)}%</p></div>
          <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden"><div className="absolute top-0 left-0 h-full progress-gradient" style={{ width: `${stats.actualCollectionPercent}%` }}></div><div className="absolute top-0 bottom-0 w-1 bg-indigo-600 z-10" style={{ left: `${stats.expectedCollectionPercent}%` }}></div></div>
        </div>
      </section>
    </div>
  );

  const renderEvenements = () => {
    const filteredEvents = events.filter(e => e.name.toLowerCase().includes(eventSearch.toLowerCase()));
    return (
      <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-180px)] gap-6 md:gap-8 animate-in fade-in duration-500">
        {/* LISTE DES ÉVÉNEMENTS (Masquée si un event est sélectionné sur mobile) */}
        <div className={`w-full lg:w-[380px] bg-white rounded-[1.5rem] md:rounded-[2.5rem] card-shadow flex flex-col overflow-hidden border border-slate-50 ${selectedEventId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center justify-between mb-6 md:mb-8"><div className="flex items-center space-x-3"><div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><Calendar size={24} /></div><h3 className="text-lg md:text-xl font-extrabold uppercase tracking-tight text-slate-800">Événements</h3></div><button onClick={() => setIsAddingEvent(true)} className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Plus size={20} /></button></div>
            <div className="relative"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input placeholder="Chercher..." value={eventSearch} onChange={(e) => setEventSearch(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-xl font-bold text-sm outline-none" /></div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 space-y-4">
            {DONATION_CATEGORIES.map(cat => {
              const catEvents = filteredEvents.filter(e => e.category === cat);
              if (catEvents.length === 0) return null;
              return (
                <div key={cat} className="space-y-1">
                  <p className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></span>{cat}</p>
                  {catEvents.map((e) => (
                    <button key={e.id} onClick={() => setSelectedEventId(e.id)} className={`w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all ${selectedEventId === e.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-700 bg-slate-50/50 hover:bg-slate-100'}`}>
                      <div className="flex flex-col items-start truncate mr-4">
                        <span className="truncate w-full font-black text-xs uppercase">{e.name}</span>
                        {e.date && <span className={`text-[8px] font-bold opacity-70 ${selectedEventId === e.id ? 'text-white' : 'text-slate-400'}`}>{new Date(e.date).toLocaleDateString()}</span>}
                      </div>
                      <ChevronRight size={14} className={`${selectedEventId === e.id ? 'text-white' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* DÉTAIL DE L'ÉVÉNEMENT (Masqué si rien n'est sélectionné sur mobile) */}
        <div className={`flex-1 bg-white rounded-[1.5rem] md:rounded-[2.5rem] card-shadow overflow-hidden flex flex-col border border-slate-50 ${!selectedEventId ? 'hidden lg:flex' : 'flex'}`}>
          {selectedEvent ? <>
            <div className="p-6 md:p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-white gap-6">
              <div className="flex items-center space-x-4 md:space-x-6 w-full md:w-auto">
                {/* Bouton retour mobile */}
                <button onClick={() => setSelectedEventId(null)} className="lg:hidden p-2.5 bg-indigo-50 text-indigo-600 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase shadow-sm">
                   <ChevronLeft size={20} />
                   <span>Liste</span>
                </button>
                <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center hidden sm:flex"><CalendarDays size={24} /></div>
                <div className="flex-1 min-w-0">
                   <h2 className="text-xl md:text-4xl font-black text-slate-950 tracking-tight uppercase truncate">{selectedEvent.name}</h2>
                   <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{selectedEvent.category} • {selectedEvent.date && new Date(selectedEvent.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 text-center min-w-[100px] md:min-w-[140px]"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total</p><p className="text-lg md:text-xl font-black text-indigo-600">{pledges.filter(p => p.eventId === selectedEventId && !p.isOffered).reduce((s,p) => s+p.amount, 0).toLocaleString()} ₪</p></div>
                <button onClick={() => setIsAddingSlot(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] uppercase hover:bg-indigo-700 shadow-lg"><Plus size={14} /> Ajouter</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-50/20">
              <div className="space-y-4">
                {currentHonors.map((slot, idx) => {
                  const pledge = pledges.find(p => p.eventId === selectedEventId && p.slotName === slot.name && p.officeName === slot.office);
                  const isOffered = pledge?.isOffered || false;
                  const hasFidele = !!pledge?.fideleId;
                  const hasAmount = !!pledge?.amount && pledge.amount > 0;
                  
                  return (
                    <div key={`${slot.office}-${slot.name}-${idx}`} className={`flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center p-4 md:p-5 rounded-xl md:rounded-[1.5rem] border transition-all ${isOffered ? 'bg-slate-200 opacity-80' : hasFidele && hasAmount ? 'bg-[#e6fffa] border-emerald-200 shadow-sm' : 'bg-white shadow-sm'}`}>
                      <div className="w-full sm:col-span-3 flex justify-between sm:block">
                        <span className="font-black text-xs uppercase text-slate-900">{slot.name}</span>
                        {!isShabbatEvent && <span className="text-[8px] font-black text-indigo-500 uppercase block sm:mt-1">{slot.office}</span>}
                      </div>
                      <div className="w-full sm:col-span-5">
                        <FideleSearch 
                          fideles={fideles} 
                          selectedId={pledge?.fideleId} 
                          onSelect={(id) => updatePledge(selectedEventId!, slot.name, slot.office, id, pledge?.amount || 0, isOffered)} 
                          disabled={isOffered}
                          className="text-xs"
                        />
                      </div>
                      <div className="w-full sm:col-span-2">
                        <input 
                          type="number" 
                          placeholder="Montant ₪"
                          value={pledge?.amount || ''} 
                          disabled={isOffered} 
                          onChange={(e) => updatePledge(selectedEventId!, slot.name, slot.office, pledge?.fideleId || '', Number(e.target.value), isOffered)} 
                          className="w-full py-2 bg-white/40 border border-slate-300 rounded-lg text-center font-black text-xl outline-none" 
                        />
                      </div>
                      <div className="w-full sm:col-span-2 flex justify-between sm:justify-center items-center gap-2">
                         <button onClick={() => updatePledge(selectedEventId!, slot.name, slot.office, pledge?.fideleId || '', pledge?.amount || 0, !isOffered)} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-black text-[8px] uppercase ${isOffered ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Gift size={12} /> {isOffered ? 'Offert' : 'Vendu'}</button>
                         <button onClick={() => setDeleteConfirm({ type: 'slot', id: selectedEvent.id, slot })} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </> : <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10 text-center"><CalendarDays size={48} className="opacity-20 mb-4" /><p className="font-bold uppercase tracking-widest text-xs">Sélectionnez un événement pour voir les détails</p></div>}
        </div>
      </div>
    );
  };

  const NavItem = ({ id, icon: Icon, label }: { id: ViewType, icon: any, label: string }) => (
    <button onClick={() => { setCurrentView(id); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-xl md:rounded-2xl transition-all text-[10px] md:text-xs font-extrabold uppercase tracking-widest ${currentView === id ? 'active-nav text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#f4f7fe]">
      {/* SIDEBAR DESKTOP */}
      <aside className="w-[300px] sidebar-gradient text-white flex flex-col sticky top-0 h-screen hidden lg:flex shadow-2xl z-40">
        <div className="p-10">
          <div className="flex items-center space-x-4 mb-12">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-2xl">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#2D3083]" stroke="currentColor" strokeWidth="3"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"></path></svg>
            </div>
            <div><h1 className="text-2xl font-black tracking-tighter leading-none">BEITH YEHUDA</h1><p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">CRM de gestion</p></div>
          </div>
          <nav className="space-y-3">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Tableau de bord" />
            <NavItem id="fideles" icon={Users} label="Fidèles" />
            <NavItem id="evenements" icon={CalendarDays} label="Événements" />
            <NavItem id="encaissements" icon={Wallet} label="Encaissements" />
          </nav>
        </div>
        <div className="mt-auto p-10"><div className="flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 p-3 rounded-2xl"><Save size={14} className="text-emerald-500" /><span>Sauvegarde Auto</span></div></div>
      </aside>

      {/* MOBILE DRAWER */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <aside className={`fixed top-0 left-0 h-screen w-[280px] sidebar-gradient text-white z-[110] lg:hidden transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="p-8">
            <div className="flex items-center justify-between mb-10"><h1 className="text-xl font-black tracking-tighter">BEITH YEHUDA</h1><button onClick={() => setIsSidebarOpen(false)}><X size={24}/></button></div>
            <nav className="space-y-4">
              <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem id="fideles" icon={Users} label="Fidèles" />
              <NavItem id="evenements" icon={CalendarDays} label="Événements" />
              <NavItem id="encaissements" icon={Wallet} label="Paiements" />
            </nav>
         </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <header className="px-4 md:px-10 py-4 md:py-6 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100">
          <div className="flex items-center space-x-3 md:space-x-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-indigo-600 bg-indigo-50 rounded-lg"><Menu size={24}/></button>
            <span className="text-[#4A4DE6] font-extrabold text-xl md:text-2xl tracking-tighter truncate">BEITH YEHUDA</span>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-extrabold text-slate-800 leading-none mb-1">Responsable</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestionnaire</p>
             </div>
             <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black">BY</div>
          </div>
        </header>

        <div className="p-2 sm:p-4 md:p-10 max-w-[1600px] mx-auto w-full flex-1 overflow-y-auto">
          {currentView === 'dashboard' && renderDashboard()}
          
          {currentView === 'fideles' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl md:text-3xl font-black text-slate-800">Fidèles</h2>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input placeholder="Recherche..." value={fideleSearch} onChange={(e) => setFideleSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl font-bold text-sm outline-none" />
                  </div>
                  <button onClick={() => setIsAddingFidele(true)} className="bg-indigo-600 text-white p-2.5 rounded-xl"><Plus size={20}/></button>
                </div>
              </div>
              <div className="bg-white rounded-2xl md:rounded-[3rem] card-shadow border border-slate-50 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left min-w-[700px]">
                    <thead><tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-widest"><th className="px-6 md:px-10 py-6">Fidèle</th><th className="px-6 py-6">Statut</th><th className="px-6 py-6 text-right">Promis</th><th className="px-6 py-6 text-right">Payé</th><th className="px-6 py-6 text-right">Reste</th><th className="px-6 py-6 text-right">Action</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {updatedFideles.map(f => {
                        const isExpanded = selectedFideleId === f.id;
                        return (
                          <React.Fragment key={f.id}>
                            <tr className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/50' : ''}`} onClick={() => setSelectedFideleId(isExpanded ? null : f.id)}>
                              <td className="px-6 md:px-10 py-5">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 flex items-center justify-center rounded-xl font-black bg-indigo-50 text-indigo-600">{f.nom[0]}{f.prenom[0]}</div>
                                  <div className="truncate max-w-[120px] md:max-w-none"><p className="font-extrabold text-slate-800 text-sm">{f.prenom} {f.nom}</p></div>
                                </div>
                              </td>
                              <td className="px-6 py-5"><span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-slate-100">{f.status}</span></td>
                              <td className="px-6 py-5 text-right font-black text-slate-800 text-sm">{f.totalPromesses.toLocaleString()} ₪</td>
                              <td className="px-6 py-5 text-right font-black text-emerald-600 text-sm">{f.montantPaye.toLocaleString()} ₪</td>
                              <td className="px-6 py-5 text-right font-black text-rose-500 text-sm">{(f.totalPromesses - f.montantPaye).toLocaleString()} ₪</td>
                              <td className="px-6 py-5 text-right"><ChevronDown size={18} className={`transition-transform inline-block ${isExpanded ? 'rotate-180 text-indigo-600' : 'text-slate-300'}`} /></td>
                            </tr>
                            {isExpanded && <tr><td colSpan={6} className="p-0 border-none">{renderFideleDetailInline(f)}</td></tr>}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {currentView === 'evenements' && renderEvenements()}
          
          {currentView === 'encaissements' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center"><h2 className="text-2xl md:text-3xl font-black text-slate-800">Paiements</h2><button onClick={() => setIsAddingEncaissement(true)} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Wallet size={16} /> Saisir</button></div>
              <div className="bg-white rounded-2xl md:rounded-[3rem] card-shadow border border-slate-50 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left min-w-[700px]">
                    <thead><tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-widest"><th className="px-6 md:px-10 py-6">Date</th><th className="px-6 py-6">Fidèle</th><th className="px-6 py-6 text-right">NIS</th><th className="px-6 py-6 text-right">EUR</th><th className="px-6 py-6">Type</th><th className="px-6 py-6">Compte</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {encaissements.sort((a,b) => b.date.localeCompare(a.date)).map(e => {
                        const f = fideles.find(fi => fi.id === e.fideleId);
                        return <tr key={e.id} className="hover:bg-slate-50/50"><td className="px-6 md:px-10 py-5 text-xs font-bold text-slate-600">{new Date(e.date).toLocaleDateString()}</td><td className="px-6 py-5 font-extrabold text-slate-800 text-sm">{f ? `${f.prenom} ${f.nom}` : '-'}</td><td className="px-6 py-5 text-right font-black text-emerald-600">{e.montantNis.toLocaleString()} ₪</td><td className="px-6 py-5 text-right font-bold text-slate-400">{e.montantEuro > 0 ? `${e.montantEuro.toLocaleString()} €` : '-'}</td><td className="px-6 py-5 text-[9px] font-black uppercase text-slate-400">{e.type}</td><td className="px-6 py-5 text-xs font-bold text-slate-600">{e.compte}</td></tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS RESPONSIVES */}
      {isAddingSlot && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-6 md:p-10 border border-slate-100"><h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tighter mb-6">Ajouter un don</h3><div className="space-y-4 md:space-y-6"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 px-2">Type de don</label><input autoFocus placeholder="Ex: Parnassa..." value={newSlotName} onChange={(e) => setNewSlotName(e.target.value)} className="w-full px-6 py-3 bg-slate-50 border-none rounded-xl font-bold outline-none" /></div>{!isShabbatEvent && <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 px-2">Office</label><select value={newSlotOffice} onChange={(e) => setNewSlotOffice(e.target.value)} className="w-full px-6 py-3 bg-slate-50 border-none rounded-xl font-bold outline-none">{OFFICES.map(o => <option key={o} value={o}>{o}</option>)}</select></div>}<div className="flex gap-4"><button onClick={() => setIsAddingSlot(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px]">Annuler</button><button onClick={confirmAddSlot} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg">Ajouter</button></div></div></div></div>}
      
      {deleteConfirm && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-6 md:p-10 text-center"><div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={32} /></div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-4">Confirmer ?</h3><p className="text-slate-500 font-bold text-xs mb-8 uppercase">Suppression définitive.</p><div className="flex gap-3"><button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px]">Annuler</button><button onClick={handleConfirmDelete} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg">Supprimer</button></div></div></div>}

      {isAddingEvent && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-6 md:p-10 animate-in zoom-in-95"><div className="flex justify-between items-center mb-8"><h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase italic">Nouvel Événement</h3><button onClick={() => setIsAddingEvent(false)}><X size={24}/></button></div><form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); addEvent(fd.get('name') as string, fd.get('category') as DonationCategory, fd.get('date') as string); }} className="space-y-5"><input name="name" required placeholder="Nom de l'événement" className="w-full px-6 py-3 bg-slate-50 border-none rounded-xl font-bold outline-none" /><div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 px-2">Date</label><input name="date" type="date" required className="w-full px-6 py-3 bg-slate-50 border-none rounded-xl font-bold outline-none" defaultValue={new Date().toISOString().split('T')[0]} /></div><div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 px-2">Catégorie</label><select name="category" required className="w-full px-6 py-3 bg-slate-50 border-none rounded-xl font-bold outline-none">{DONATION_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div><button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase shadow-lg hover:bg-indigo-700 transition-all">Créer</button></form></div></div>}

      {(isAddingFidele || editingFideleId) && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl p-6 md:p-10 animate-in zoom-in-95 overflow-y-auto max-h-[95vh]"><div className="flex justify-between items-center mb-8"><h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase italic">{editingFideleId ? 'Modifier' : 'Nouveau'} Fidèle</h3><button onClick={() => { setIsAddingFidele(false); setEditingFideleId(null); }}><X size={24} /></button></div><form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const data = { nom: formData.get('nom') as string, prenom: formData.get('prenom') as string, mail: formData.get('mail') as string, telephone: formData.get('telephone') as string, paysResidence: formData.get('pays') as string, preferenceRecu: formData.get('preference') as ReceiptPreference, balancePrecedente: Number(formData.get('balancePrecedente')) || 0 }; editingFideleId ? updateFidele(editingFideleId, data) : addFidele(data); }} className="space-y-5">
        <div className="bg-amber-50 p-6 rounded-2xl border-2 border-amber-200">
          <label className="text-[10px] font-black uppercase text-amber-800 block mb-2">💰 Ancienne Dette ₪</label>
          <input name="balancePrecedente" type="number" step="0.01" placeholder="0.00" defaultValue={editingFidele?.balancePrecedente} className="w-full px-4 py-3 bg-white border-2 border-amber-300 rounded-xl font-black text-2xl outline-none" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><input name="prenom" required placeholder="Prénom" defaultValue={editingFidele?.prenom} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold outline-none" /><input name="nom" required placeholder="Nom" defaultValue={editingFidele?.nom} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold outline-none" /></div><input name="mail" type="email" placeholder="Email" defaultValue={editingFidele?.mail} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold outline-none" /><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><input name="telephone" placeholder="Téléphone" defaultValue={editingFidele?.telephone} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold outline-none" /><input name="pays" placeholder="Pays" defaultValue={editingFidele?.paysResidence} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold outline-none" /></div><div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Reçu</label><select name="preference" defaultValue={editingFidele?.preferenceRecu} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold outline-none"><option value="Cerfa">Cerfa</option><option value="Tofess 46">Tofess 46</option><option value="En attente">En attente</option><option value="Aucun">Aucun</option></select></div><button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase shadow-lg hover:bg-indigo-700 transition-all">{editingFideleId ? 'Mettre à jour' : 'Enregistrer'}</button></form></div></div>}
      
      {isAddingEncaissement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 max-h-[95vh] overflow-y-auto">
            <div className="bg-[#4A4DE6] px-6 py-4 flex justify-between items-center text-white"><h3 className="text-lg font-bold">Nouveau Paiement</h3><button onClick={() => setIsAddingEncaissement(false)}><X size={24} /></button></div>
            <div className="p-6 md:p-8"><PaymentForm fideles={fideles} onSubmit={(data) => { addEncaissement(data); }} /></div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPOSANT FORMULAIRE DE PAIEMENT POUR LA MODALE ---
const PaymentForm: React.FC<{ fideles: Fidele[], onSubmit: (data: any) => void }> = ({ fideles, onSubmit }) => {
  const [selectedFideleId, setSelectedFideleId] = useState('');
  const [amountEuro, setAmountEuro] = useState<number>(0);
  const [amountNis, setAmountNis] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(3.98); 
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptStatus, setReceiptStatus] = useState<ReceiptPreference>('En attente');
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  useEffect(() => {
    const fetchRealExchangeRate = async () => {
      setIsLoadingRate(true);
      try {
        const response = await fetch(`https://api.frankfurter.app/${paymentDate}?from=EUR&to=ILS`);
        if (!response.ok) throw new Error("Erreur API");
        const data = await response.json();
        const rate = data.rates.ILS;
        setExchangeRate(rate);
        if (amountEuro > 0) setAmountNis(parseFloat((amountEuro * rate).toFixed(2)));
      } catch (error) {
        console.error("Erreur taux de change.");
      } finally {
        setIsLoadingRate(false);
      }
    };
    fetchRealExchangeRate();
  }, [paymentDate]);

  const handleEuroChange = (val: number) => {
    setAmountEuro(val);
    setAmountNis(parseFloat((val * exchangeRate).toFixed(2)));
  };

  const handleNisChange = (val: number) => setAmountNis(val);

  return (
    <form onSubmit={(e) => { 
      e.preventDefault(); 
      if (!selectedFideleId) return alert("Veuillez sélectionner un fidèle");
      const formData = new FormData(e.currentTarget); 
      onSubmit({ date: paymentDate, fideleId: selectedFideleId, montantNis: amountNis, montantEuro: amountEuro, tauxChange: exchangeRate, type: formData.get('type') as TransactionType, compte: formData.get('compte') as BankAccount, recu: receiptStatus }); 
    }} className="space-y-5 md:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 px-1">Fidèle</label><FideleSearch fideles={fideles} selectedId={selectedFideleId} onSelect={setSelectedFideleId} placeholder="Sélectionner..." className="w-full" /></div>
        <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 px-1">Date</label><input name="date" type="date" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-1">
          <div className="flex justify-between items-center px-1"><label className="text-[10px] font-black uppercase text-slate-400">Euro (€)</label>{isLoadingRate && <Loader2 size={10} className="animate-spin text-indigo-600" />}</div>
          <input type="number" step="0.01" placeholder="0.00" value={amountEuro || ''} onChange={(e) => handleEuroChange(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 px-1">Nis (₪)</label>
          <input type="number" step="0.01" placeholder="0.00" value={amountNis || ''} onChange={(e) => handleNisChange(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl font-bold text-sm text-indigo-600 outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 px-1">Paiement</label><select name="type" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none appearance-none">{['Virement', 'Espece', 'Cheque', 'Direct Donateur'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}</select></div>
        <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 px-1">Compte</label><select name="compte" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none appearance-none">{BANK_ACCOUNTS.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}</select></div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 px-1">Reçu</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['Tofess 46', 'Cerfa', 'En attente', 'Aucun'] as ReceiptPreference[]).map(status => (
            <button key={status} type="button" onClick={() => setReceiptStatus(status)} className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase transition-all border ${receiptStatus === status ? 'bg-[#4A4DE6] border-[#4A4DE6] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>
              {status}
            </button>
          ))}
        </div>
      </div>
      <button type="submit" className="w-full py-4 bg-[#4A4DE6] text-white rounded-xl font-bold text-sm shadow-xl hover:bg-indigo-700 transition-all">Enregistrer</button>
    </form>
  );
};

export default App;
