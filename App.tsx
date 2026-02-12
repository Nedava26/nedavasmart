
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, LayoutDashboard, CalendarDays, Plus, Search, 
  ChevronRight, TrendingUp, Wallet, CheckCircle2, 
  Clock, History, AlertCircle, Waves, Calendar, 
  ChevronDown, X, Edit3, PieChart, Gift, Save, Mail, 
  Phone, Trash2, Check, Pencil, AlertTriangle, Users2, ChevronUp,
  RefreshCw, Landmark, Loader2, Copy, ArrowUpRight, Scale
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
      // Retrait automatique du mot Shabat devant le nom si la catégorie est SHABAT
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

  useEffect(() => { if (!selectedEventId && events.length > 0) setSelectedEventId(events[0].id); }, [events, selectedEventId]);

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
      <div className="bg-indigo-100/50 p-12 border-t-4 border-indigo-600 shadow-inner animate-in slide-in-from-top-6 duration-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full -ml-20 -mb-20"></div>
        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-slate-100/80 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col items-center text-center transform transition hover:scale-[1.02]">
              <div className="w-10 h-10 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mb-3"><Scale size={20} /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Balance Précédente</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-600">{(f.balancePrecedente || 0).toLocaleString()}</span>
                <span className="text-lg font-bold text-slate-400">₪</span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-md border border-indigo-200/50 flex flex-col items-center text-center transform transition hover:scale-[1.02] relative group">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Total dû Global</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">{f.totalPromesses.toLocaleString()}</span>
                <span className="text-xl font-bold text-slate-300">₪</span>
              </div>
              <div className="mt-3 text-[9px] font-bold text-slate-400 uppercase">
                Dont {currentPledgesTotal.toLocaleString()} ₪ cette année
              </div>
              <div className="absolute -top-3 -right-3 bg-indigo-600 text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><ArrowUpRight size={16} /></div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-md border border-emerald-200/50 flex flex-col items-center text-center transform transition hover:scale-[1.02]">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Dons encaissés</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-emerald-600">{f.montantPaye.toLocaleString()}</span>
                <span className="text-xl font-bold text-emerald-300">₪</span>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-md border border-rose-200/50 flex flex-col items-center text-center relative overflow-hidden transform transition hover:scale-[1.02]">
              {isDebtLate && <div className="absolute top-0 right-0 p-4 text-rose-500"><AlertTriangle size={24} /></div>}
              <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isDebtLate ? 'text-rose-600' : 'text-slate-400'}`}>Reste à recouvrer</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black ${isDebtLate ? 'text-rose-600' : 'text-indigo-900'}`}>{(f.totalPromesses - f.montantPaye).toLocaleString()}</span>
                <span className="text-xl font-bold text-rose-300">₪</span>
              </div>
            </div>
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center shadow-xl shadow-indigo-200">
              <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-2">Dernier paiement</p>
              <p className="text-base font-black text-white uppercase italic leading-tight">
                {f.lastPaymentDate ? new Date(f.lastPaymentDate).toLocaleDateString() : 'AUCUN HISTORIQUE'}
              </p>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[3.5rem] border border-indigo-200 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-6">
               <div className="flex items-center gap-5">
                  <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100"><PieChart size={24} /></div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-indigo-950 tracking-widest">Taux de Recouvrement Personnel</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Analyse comparative de la fiabilité</p>
                  </div>
               </div>
               <div className="flex gap-10">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Individuel</p>
                    <p className={`text-2xl font-black ${individualCollectionPercent >= 80 ? 'text-emerald-500' : 'text-indigo-600'}`}>{individualCollectionPercent.toFixed(1)}%</p>
                  </div>
                  <div className="text-center border-l border-slate-100 pl-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Objectif Commun</p>
                    <p className="text-2xl font-black text-slate-800">{stats.expectedCollectionPercent.toFixed(1)}%</p>
                  </div>
               </div>
            </div>
            <div className="relative h-6 w-full bg-indigo-50/50 rounded-full overflow-hidden shadow-inner border border-indigo-100/50">
              <div className="absolute top-0 left-0 h-full progress-gradient transition-all duration-1000 shadow-[4px_0_10px_rgba(74,77,230,0.4)]" style={{ width: `${Math.min(100, individualCollectionPercent)}%` }}></div>
              <div className="absolute top-0 bottom-0 w-1.5 bg-indigo-900 z-10 shadow-[0_0_15px_rgba(0,0,0,0.2)]" style={{ left: `${stats.expectedCollectionPercent}%` }}></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-5">
              <div className="flex items-center gap-4 px-2">
                <div className="p-3 bg-indigo-700 text-white rounded-2xl shadow-lg"><TrendingUp size={18} /></div>
                <h4 className="text-sm font-black uppercase tracking-widest text-indigo-950">Engagements Enregistrés</h4>
              </div>
              <div className="bg-white rounded-[3.5rem] border border-indigo-200/60 overflow-hidden shadow-lg max-h-[450px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-indigo-50/70 border-b border-indigo-100 text-[10px] font-black uppercase text-indigo-500 tracking-widest sticky top-0 z-10">
                    <tr><th className="px-10 py-6">Date</th><th className="px-10 py-6">Détails de l'Honneur</th><th className="px-10 py-6 text-right">Montant</th></tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50">
                    {f.balancePrecedente ? (
                      <tr className="bg-slate-50 italic">
                        <td className="px-10 py-6 font-bold text-slate-400 text-[11px]">ANTÉRIEUR</td>
                        <td className="px-10 py-6 font-black text-slate-500 uppercase text-[12px]">BALANCE PRÉCÉDENTE (REPORT)</td>
                        <td className="px-10 py-6 text-right font-black text-slate-800 text-[14px]">{f.balancePrecedente.toLocaleString()} ₪</td>
                      </tr>
                    ) : null}
                    {fPledges.length > 0 ? fPledges.sort((a,b) => b.date.localeCompare(a.date)).map(p => {
                      const ev = events.find(e => e.id === p.eventId);
                      return (
                        <tr key={p.id} className={`group hover:bg-indigo-50/40 transition-all ${p.isOffered ? 'opacity-30' : ''}`}>
                          <td className="px-10 py-6 font-bold text-slate-400 text-[11px]">{new Date(p.date).toLocaleDateString()}</td>
                          <td className="px-10 py-6">
                            <p className="font-black text-indigo-900 uppercase text-[12px] leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{ev?.name || '---'}</p>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{ev?.category === 'SHABAT' ? p.slotName : `${p.officeName} - ${p.slotName}`}</p>
                          </td>
                          <td className="px-10 py-6 text-right font-black text-slate-800 text-[14px]">{p.amount.toLocaleString()} ₪</td>
                        </tr>
                      );
                    }) : !f.balancePrecedente && <tr><td colSpan={3} className="px-10 py-16 text-center text-slate-300 italic text-[11px] uppercase font-black tracking-widest">Aucune promesse enregistrée</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-4 px-2">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg"><History size={18} /></div>
                <h4 className="text-sm font-black uppercase tracking-widest text-emerald-950">Historique des Versements</h4>
              </div>
              <div className="bg-white rounded-[3.5rem] border border-emerald-100 overflow-hidden shadow-lg max-h-[450px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-emerald-50/70 border-b border-emerald-100 text-[10px] font-black uppercase text-emerald-600 tracking-widest sticky top-0 z-10">
                    <tr><th className="px-10 py-6">Date</th><th className="px-10 py-6">Transaction</th><th className="px-10 py-6 text-right">Montant</th></tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {fEncaissements.length > 0 ? fEncaissements.sort((a,b) => b.date.localeCompare(a.date)).map(e => (
                      <tr key={e.id} className="group hover:bg-emerald-50/40 transition-all">
                        <td className="px-10 py-6 font-bold text-slate-400 text-[11px]">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-10 py-6 font-black text-emerald-800 uppercase tracking-widest text-[10px]">{e.type}</td>
                        <td className="px-10 py-6 text-right font-black text-emerald-600 text-[14px]">{e.montantNis.toLocaleString()} ₪</td>
                      </tr>
                    )) : <tr><td colSpan={3} className="px-10 py-16 text-center text-slate-300 italic text-[11px] uppercase font-black tracking-widest">Aucun versement effectué</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <section>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-indigo-600 rounded-lg text-white shadow-lg"><LayoutDashboard size={24} /></div>
          <div>
            <h3 className="text-xl font-extrabold uppercase tracking-tight text-slate-800">Résumé Synagogue</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activité et flux financiers</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-8 rounded-[2rem] card-shadow border border-slate-50 relative group cursor-pointer" onClick={() => setShowPledgeDistribution(!showPledgeDistribution)}>
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Promesses de dons</p>
              <div className={`p-2 rounded-full transition-all ${showPledgeDistribution ? 'bg-indigo-600 text-white' : 'bg-blue-50 text-blue-500'}`}><ChevronDown size={18} className={`transition-transform duration-300 ${showPledgeDistribution ? 'rotate-180' : ''}`} /></div>
            </div>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-3xl font-extrabold text-slate-900">{stats.totalPromisedNis.toLocaleString()}</span>
              <span className="text-xl font-bold text-slate-900">₪</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest"><Waves size={14} /><span>Détails par catégorie</span></div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] card-shadow border border-slate-50 relative cursor-pointer" onClick={() => setShowCollectionDistribution(!showCollectionDistribution)}>
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dons encaissés</p>
              <div className={`p-2 rounded-full transition-all ${showCollectionDistribution ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-500'}`}><ChevronDown size={18} className={`transition-transform duration-300 ${showCollectionDistribution ? 'rotate-180' : ''}`} /></div>
            </div>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-3xl font-extrabold text-slate-900">{stats.totalPaidNis.toLocaleString()}</span>
              <span className="text-xl font-bold text-slate-900">₪</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest"><Wallet size={14} /><span>Répartition des comptes</span></div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] card-shadow border border-slate-50 relative">
            <div className="flex justify-between items-start mb-4"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solde Restant Dû</p></div>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-3xl font-extrabold text-orange-500">{stats.totalDueNis.toLocaleString()}</span>
              <span className="text-xl font-bold text-orange-500">₪</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-extrabold text-orange-500 uppercase tracking-widest"><Clock size={14} /><span>À collecter</span></div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] card-shadow border border-slate-50 relative cursor-pointer" onClick={() => setShowFideleDistribution(!showFideleDistribution)}>
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Communauté</p>
              <div className={`p-2 rounded-full transition-all ${showFideleDistribution ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-400'}`}><ChevronDown size={18} className={`transition-transform duration-300 ${showFideleDistribution ? 'rotate-180' : ''}`} /></div>
            </div>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-3xl font-extrabold text-slate-900">{stats.totalFideles}</span>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fidèles</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-extrabold text-slate-600 uppercase tracking-widest"><Users2 size={14} /><span>Répartition des profils</span></div>
          </div>
        </div>
        {(showPledgeDistribution || showCollectionDistribution || showFideleDistribution) && (
          <div className="bg-white p-10 rounded-[2.5rem] card-shadow border border-slate-100 mb-8 animate-in slide-in-from-top-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {showPledgeDistribution && stats.pledgeByCat.map(item => (
                  <div key={item.name} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.name}</p>
                    <div className="flex items-baseline gap-1"><span className="text-2xl font-black text-slate-900">{item.total.toLocaleString()}</span><span className="text-sm font-bold text-slate-400">₪</span></div>
                  </div>
                ))}
                {showCollectionDistribution && stats.collectionByAccount.map(item => (
                  <div key={item.name} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.name}</p>
                    <div className="flex items-baseline gap-1"><span className="text-2xl font-black text-slate-900">{item.total.toLocaleString()}</span><span className="text-sm font-bold text-slate-400">₪</span></div>
                  </div>
                ))}
                {showFideleDistribution && <>
                  <div className="p-6 bg-emerald-50/30 rounded-3xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Actif</p><span className="text-3xl font-black text-slate-800">{stats.countActif}</span>
                  </div>
                  <div className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Occasionnel</p><span className="text-3xl font-black text-slate-800">{stats.countOccasionnel}</span>
                  </div>
                  <div className="p-6 bg-sky-50/30 rounded-3xl border border-sky-100">
                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2">Récent</p><span className="text-3xl font-black text-slate-800">{stats.countRecent}</span>
                  </div>
                  <div className="p-6 bg-slate-100/50 rounded-3xl border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inactif</p><span className="text-3xl font-black text-slate-800">{stats.countInactif}</span>
                  </div>
                </>}
             </div>
          </div>
        )}
      </section>
      <section className="bg-white p-10 rounded-[3rem] card-shadow border border-slate-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center space-x-4"><div className="p-4 bg-rose-100 text-rose-500 rounded-2xl"><AlertCircle size={32} /></div><div><h3 className="text-2xl font-extrabold tracking-tight text-slate-800 uppercase">Santé des encaissements</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comparatif promesses vs encaissements</p></div></div>
          <div className={`p-6 rounded-3xl border ${stats.isLate ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'} text-center min-w-[280px]`}><p className="text-xl font-black uppercase flex items-center justify-center gap-2">{stats.isLate ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}{stats.isLate ? 'Retard de recouvrement' : 'Objectif en cours'}</p></div>
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-end mb-2 text-[10px] font-black uppercase tracking-widest"><p className="text-emerald-500">Réel : {stats.actualCollectionPercent.toFixed(1)}% payés</p><p className="text-indigo-600">Objectif temporel : {stats.expectedCollectionPercent.toFixed(1)}%</p></div>
          <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="absolute top-0 left-0 h-full progress-gradient transition-all duration-1000" style={{ width: `${stats.actualCollectionPercent}%` }}></div><div className="absolute top-0 bottom-0 w-1 bg-indigo-600 z-10" style={{ left: `${stats.expectedCollectionPercent}%` }}></div></div>
        </div>
      </section>
    </div>
  );

  const renderEvenements = () => {
    const filteredEvents = events.filter(e => e.name.toLowerCase().includes(eventSearch.toLowerCase()));
    return (
      <div className="flex h-[calc(100vh-180px)] gap-8 animate-in fade-in duration-500">
        <div className="w-[380px] bg-white rounded-[2.5rem] card-shadow flex flex-col overflow-hidden border border-slate-50">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center justify-between mb-8"><div className="flex items-center space-x-3"><div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><Calendar size={24} /></div><h3 className="text-xl font-extrabold uppercase tracking-tight text-slate-800">Événements</h3></div><button onClick={() => setIsAddingEvent(true)} className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Plus size={20} /></button></div>
            <div className="relative"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} /><input placeholder="Chercher..." value={eventSearch} onChange={(e) => setEventSearch(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.2rem] font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm" /></div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {DONATION_CATEGORIES.map(cat => {
              const catEvents = filteredEvents.filter(e => e.category === cat);
              if (catEvents.length === 0) return null;
              return (
                <div key={cat} className="space-y-1">
                  <p className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></span>{cat}</p>
                  {catEvents.map((e, idx) => {
                    return (
                      <div key={e.id} className="group relative flex items-center">
                        <div className="absolute -left-2 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button onClick={(ev) => { ev.stopPropagation(); moveEvent(e.id, 'up'); }} className="p-1 hover:text-indigo-600 text-slate-300 transition-colors"><ChevronUp size={14}/></button>
                          <button onClick={(ev) => { ev.stopPropagation(); moveEvent(e.id, 'down'); }} className="p-1 hover:text-indigo-600 text-slate-300 transition-colors"><ChevronDown size={14}/></button>
                        </div>
                        <button onClick={() => setSelectedEventId(e.id)} className={`flex-1 flex items-center justify-between px-6 py-4 rounded-2xl transition-all tracking-normal ${selectedEventId === e.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-700 bg-slate-50/50 hover:bg-slate-100 border border-slate-100/50'}`}>
                          <div className="flex flex-col items-start truncate mr-12">
                            <span className="truncate w-full font-black text-xs uppercase">{e.name}</span>
                            {e.date && <span className={`text-[9px] font-bold opacity-70 ${selectedEventId === e.id ? 'text-white' : 'text-slate-400'}`}>{new Date(e.date).toLocaleDateString()}</span>}
                          </div>
                          <ChevronRight size={14} className={`${selectedEventId === e.id ? 'text-white' : 'text-slate-300'}`} />
                        </button>
                        <div className="absolute right-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                          <button onClick={(ev) => { ev.stopPropagation(); duplicateEvent(e.id); }} className={`p-2 rounded-lg ${selectedEventId === e.id ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'}`}><Copy size={16} /></button>
                          <button onClick={(ev) => { ev.stopPropagation(); setDeleteConfirm({ type: 'event', id: e.id }); }} className={`p-2 rounded-lg ${selectedEventId === e.id ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 bg-white rounded-[2.5rem] card-shadow overflow-hidden flex flex-col border border-slate-50">
          {selectedEvent ? <>
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm"><CalendarDays size={32} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 group">
                    {editingEventId === selectedEvent.id ? (
                      <div className="flex flex-col gap-3">
                        <input autoFocus defaultValue={selectedEvent.name} onBlur={(e) => updateEventInfo(selectedEvent.id, { name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && updateEventInfo(selectedEvent.id, { name: e.currentTarget.value })} className="text-3xl font-black text-slate-900 tracking-tighter uppercase bg-slate-50 px-2 outline-none border-b-2 border-indigo-600 w-full" />
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                             <Calendar size={14} className="text-indigo-400" />
                             <input type="date" defaultValue={selectedEvent.date} onChange={(e) => updateEventInfo(selectedEvent.id, { date: e.target.value })} className="text-xs font-bold text-indigo-600 bg-slate-50 p-1 rounded outline-none cursor-pointer" />
                          </div>
                          <div className="flex items-center gap-2">
                             <Tag size={14} className="text-indigo-400" />
                             <select 
                               defaultValue={selectedEvent.category} 
                               onChange={(e) => updateEventInfo(selectedEvent.id, { category: e.target.value as DonationCategory })}
                               className="text-xs font-bold text-indigo-600 bg-slate-50 p-1 rounded outline-none cursor-pointer"
                             >
                               {DONATION_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                             </select>
                          </div>
                          <button onClick={() => setEditingEventId(null)} className="p-1 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"><Check size={18}/></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h2 className="text-4xl font-black text-slate-950 tracking-tight uppercase truncate leading-tight">{selectedEvent.name}</h2>
                          <button onClick={() => setEditingEventId(selectedEvent.id)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={18} /></button>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{selectedEvent.category}</p>
                          {selectedEvent.date && <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><Calendar size={10} /> {new Date(selectedEvent.date).toLocaleDateString()}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-center min-w-[140px]"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Promis</p><p className="text-2xl font-black text-indigo-600">{pledges.filter(p => p.eventId === selectedEventId && !p.isOffered).reduce((s,p) => s+p.amount, 0).toLocaleString()} ₪</p></div>
                <button onClick={() => setIsAddingSlot(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"><Plus size={16} /> Ajouter don</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/20">
              <div className="grid grid-cols-12 gap-6 px-8 mb-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {!isShabbatEvent && <div className="col-span-2">Office</div>}
                <div className={isShabbatEvent ? "col-span-4" : "col-span-2"}>Type de don</div>
                <div className="col-span-4">Fidèle</div>
                <div className="col-span-2 text-center">Montant (₪)</div>
                <div className="col-span-2 text-center">Offert / Actions</div>
              </div>
              <div className="space-y-4">
                {currentHonors.map((slot, idx) => {
                  const pledge = pledges.find(p => p.eventId === selectedEventId && p.slotName === slot.name && p.officeName === slot.office);
                  const isOffered = pledge?.isOffered || false;
                  const hasFidele = !!pledge?.fideleId;
                  const hasAmount = !!pledge?.amount && pledge.amount > 0;
                  const isEditingSlot = editingSlotIndex === idx;

                  let rowColorClass = "bg-white border-slate-100 shadow-sm hover:shadow-md";
                  if (isOffered) {
                    rowColorClass = "bg-slate-300 border-slate-400 opacity-90";
                  } else if (hasFidele && hasAmount) {
                    rowColorClass = "bg-[#e6fffa] border-emerald-200 shadow-md";
                  }

                  return (
                    <div key={`${slot.office}-${slot.name}-${idx}`} className={`grid grid-cols-12 gap-6 items-center p-5 rounded-[1.5rem] border transition-all group ${rowColorClass}`}>
                      {!isShabbatEvent && (
                        <div className="col-span-2 flex items-center gap-2">
                           <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => moveSlot(selectedEvent.id, idx, 'up')} className="text-slate-300 hover:text-indigo-600"><ChevronUp size={12}/></button>
                              <button onClick={() => moveSlot(selectedEvent.id, idx, 'down')} className="text-slate-300 hover:text-indigo-600"><ChevronDown size={12}/></button>
                           </div>
                           <select 
                            value={slot.office} 
                            onChange={(e) => updateSlotOffice(selectedEvent.id, idx, e.target.value)}
                            className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg outline-none cursor-pointer border-none appearance-none"
                           >
                              {OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
                           </select>
                        </div>
                      )}
                      <div className={isShabbatEvent ? "col-span-4 flex items-center gap-2" : "col-span-2 flex items-center gap-2"}>
                        {isShabbatEvent && (
                          <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => moveSlot(selectedEvent.id, idx, 'up')} className="text-slate-300 hover:text-indigo-600"><ChevronUp size={12}/></button>
                              <button onClick={() => moveSlot(selectedEvent.id, idx, 'down')} className="text-slate-300 hover:text-indigo-600"><ChevronDown size={12}/></button>
                          </div>
                        )}
                        {isEditingSlot ? (
                          <div className="flex items-center gap-1 w-full">
                            <input autoFocus value={newSlotValue} onChange={(e) => setNewSlotValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && updateSlotName(selectedEvent.id, slot, newSlotValue)} className="text-sm font-bold bg-white border border-indigo-200 px-2 py-1 rounded w-full outline-none" />
                            <button onClick={() => updateSlotName(selectedEvent.id, slot, newSlotValue)} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded"><Check size={16}/></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className={`font-black text-sm uppercase tracking-tight truncate ${isOffered ? 'text-slate-600' : 'text-slate-900'}`}>{slot.name}</span>
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingSlotIndex(idx); setNewSlotValue(slot.name); }} className="p-1.5 text-slate-300 hover:text-indigo-600"><Pencil size={14}/></button>
                              <button onClick={() => setDeleteConfirm({ type: 'slot', id: selectedEvent.id, slot })} className="p-1.5 text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="col-span-4">
                        <FideleSearch 
                          fideles={fideles} 
                          selectedId={pledge?.fideleId} 
                          onSelect={(id) => updatePledge(selectedEventId!, slot.name, slot.office, id, pledge?.amount || 0, isOffered)} 
                          disabled={isOffered}
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number" 
                          placeholder="---"
                          value={pledge?.amount || ''} 
                          disabled={isOffered} 
                          onChange={(e) => updatePledge(selectedEventId!, slot.name, slot.office, pledge?.fideleId || '', Number(e.target.value), isOffered)} 
                          className={`w-full py-3 bg-white/40 border border-slate-300 rounded-xl text-center font-black text-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all disabled:cursor-not-allowed ${isOffered ? 'text-slate-500' : 'text-slate-900'}`} 
                        />
                      </div>
                      <div className="col-span-2 flex justify-center"><button onClick={() => updatePledge(selectedEventId!, slot.name, slot.office, pledge?.fideleId || '', pledge?.amount || 0, !isOffered)} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shadow-sm font-black text-[10px] uppercase tracking-tighter ${isOffered ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}><Gift size={16} />{isOffered ? 'OUI' : 'NON'}</button></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </> : <div className="flex-1 flex flex-col items-center justify-center text-slate-300"><CalendarDays size={64} className="opacity-20 mb-4" /><p className="font-bold uppercase tracking-widest text-sm">Sélectionnez un événement</p></div>}
        </div>
      </div>
    );
  };

  const Tag = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2z"></path>
      <path d="M7 7h.01"></path>
    </svg>
  );

  return (
    <div className="flex min-h-screen bg-[#f4f7fe]">
      <aside className="w-[300px] sidebar-gradient text-white flex flex-col sticky top-0 h-screen hidden lg:flex shadow-2xl z-40">
        <div className="p-10">
          <div className="flex items-center space-x-4 mb-12">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-2xl">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#2D3083]" stroke="currentColor" strokeWidth="3">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-none">BEITH YEHUDA</h1>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">CRM de gestion</p>
            </div>
          </div>
          <nav className="space-y-3">
            {[{ id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' }, { id: 'fideles', icon: Users, label: 'Fidèles' }, { id: 'evenements', icon: CalendarDays, label: 'Événements' }, { id: 'encaissements', icon: Wallet, label: 'Encaissements' }].map(nav => (
              <button key={nav.id} onClick={() => setCurrentView(nav.id as ViewType)} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all text-xs font-extrabold uppercase tracking-widest ${currentView === nav.id ? 'active-nav text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><nav.icon size={20} /><span>{nav.label}</span></button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-10 flex flex-col gap-4">
          <div className="flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 p-3 rounded-2xl">
            <Save size={14} className="animate-pulse text-emerald-500" />
            <span>Sauvegarde Auto</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="px-10 py-6 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Synagogue :</span>
            <span className="text-[#4A4DE6] font-extrabold text-2xl tracking-tighter">BEITH YEHUDA</span>
          </div>
          
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-extrabold text-slate-800 leading-none mb-1">Responsable</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestionnaire</p>
              </div>
              
              <div className="flex flex-col items-center pl-6 border-l border-slate-200">
                 <div className="h-14 w-auto flex items-center justify-center opacity-90">
                    <svg viewBox="0 0 400 200" className="h-full w-auto">
                       <path d="M50 100 Q 200 20 350 100" stroke="black" fill="none" strokeWidth="2" />
                       <path d="M50 120 Q 200 200 350 120" stroke="black" fill="none" strokeWidth="2" />
                       <circle cx="200" cy="110" r="10" fill="black" />
                       <path d="M180 110 Q 200 80 220 110" stroke="black" fill="none" />
                       <text x="50%" y="115" textAnchor="middle" className="text-4xl font-serif font-black" fill="black" style={{ fontSize: '24px' }}>BEIT YEHOUDA</text>
                       <text x="50%" y="145" textAnchor="middle" className="text-[10px] font-bold uppercase tracking-widest" fill="black" style={{ fontSize: '10px' }}>Kehilat</text>
                    </svg>
                 </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-[1600px] mx-auto w-full flex-1 overflow-y-auto">
          {currentView === 'dashboard' && renderDashboard()}
          {currentView === 'fideles' && <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8"><div className="flex justify-between items-center flex-wrap gap-4"><h2 className="text-3xl font-black text-slate-800 tracking-tight">Annuaire des Fidèles</h2><div className="flex gap-4 items-center"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input placeholder="Chercher un fidèle..." value={fideleSearch} onChange={(e) => setFideleSearch(e.target.value)} className="pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm min-w-[300px]" /></div><button onClick={() => setIsAddingFidele(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 flex items-center gap-2"><Plus size={18} /> Nouveau</button></div></div><div className="bg-white rounded-[3rem] card-shadow border border-slate-50 overflow-hidden"><table className="w-full text-left"><thead><tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-widest"><th className="px-10 py-6">Fidèle</th><th className="px-10 py-6">Statut</th><th className="px-10 py-6 text-right">Promesses (Total)</th><th className="px-10 py-6 text-right">Payé</th><th className="px-10 py-6 text-right">Reste</th><th className="px-10 py-6 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-50">{updatedFideles.map(f => {
            const isExpanded = selectedFideleId === f.id;
            const fPledges = pledges.filter(p => p.fideleId === f.id);
            const isLate = f.totalPromesses > f.montantPaye && fPledges.some(p => !p.isOffered && (new Date().getTime() - new Date(p.date).getTime()) / (1000 * 3600 * 24 * 30) > 6);
            return <React.Fragment key={f.id}><tr className={`group hover:bg-slate-50/50 transition-all cursor-pointer ${isExpanded ? 'bg-indigo-100/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]' : ''}`} onClick={() => setSelectedFideleId(isExpanded ? null : f.id)}><td className="px-10 py-6"><div className="flex items-center space-x-4"><div className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black transition-all ${isLate ? 'bg-rose-100 text-rose-600' : isExpanded ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-600'}`}>{isLate ? <AlertTriangle size={24} /> : `${f.nom[0]}${f.prenom[0]}`}</div><div><p className="font-extrabold text-slate-800">{f.prenom} {f.nom}</p><div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold"><span className="flex items-center gap-1"><Mail size={10}/> {f.mail}</span><span className="flex items-center gap-1"><Phone size={10}/> {f.telephone}</span>{f.balancePrecedente ? <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md font-black">Balance Incluse</span> : null}</div></div></div></td><td className="px-10 py-6"><span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${f.status === 'ACTIF' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{f.status}</span></td><td className="px-10 py-6 text-right font-black text-slate-800">{f.totalPromesses.toLocaleString()} ₪</td><td className="px-10 py-6 text-right font-black text-emerald-600">{f.montantPaye.toLocaleString()} ₪</td><td className="px-10 py-6 text-right font-black text-rose-500">{(f.totalPromesses - f.montantPaye).toLocaleString()} ₪</td><td className="px-10 py-6 text-right"><div className="flex items-center justify-end gap-3"><button onClick={(e) => { e.stopPropagation(); setEditingFideleId(f.id); }} className="p-2 hover:bg-white text-slate-300 hover:text-indigo-600 rounded-lg transition-colors shadow-none hover:shadow-sm"><Edit3 size={18} /></button><div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-600' : 'text-slate-300'}`}><ChevronDown size={20} /></div></div></td></tr>{isExpanded && <tr><td colSpan={6} className="p-0 border-none">{renderFideleDetailInline(f)}</td></tr>}</React.Fragment>;
          })}</tbody></table></div></div>}
          {currentView === 'evenements' && renderEvenements()}
          {currentView === 'encaissements' && <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8"><div className="flex justify-between items-center"><h2 className="text-3xl font-black text-slate-800 tracking-tight">Journal des Paiements</h2><button onClick={() => setIsAddingEncaissement(true)} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 flex items-center gap-2"><Wallet size={18} /> Saisir un Paiement</button></div><div className="bg-white rounded-[3rem] card-shadow border border-slate-50 overflow-hidden"><table className="w-full text-left"><thead><tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-widest"><th className="px-10 py-6">Date</th><th className="px-10 py-6">Fidèle</th><th className="px-10 py-6 text-right">Montant</th><th className="px-10 py-6 text-right">Devise d'origine</th><th className="px-10 py-6">Transaction</th><th className="px-10 py-6">Compte</th></tr></thead><tbody className="divide-y divide-slate-50">{encaissements.sort((a,b) => b.date.localeCompare(a.date)).map(e => {
            const f = fideles.find(fi => fi.id === e.fideleId);
            return <tr key={e.id} className="hover:bg-slate-50/50"><td className="px-10 py-6 text-sm font-bold text-slate-600">{new Date(e.date).toLocaleDateString()}</td><td className="px-10 py-6 font-extrabold text-slate-800">{f ? `${f.prenom} ${f.nom}` : '-'}</td><td className="px-10 py-6 text-right font-black text-emerald-600">{e.montantNis.toLocaleString()} ₪</td><td className="px-10 py-6 text-right font-bold text-slate-400">{e.montantEuro > 0 ? `${e.montantEuro.toLocaleString()} €` : '-'}</td><td className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{e.type}</td><td className="px-10 py-6 font-bold text-slate-600">{e.compte}</td></tr>;
          })}</tbody></table></div></div>}
        </div>
      </main>

      {isAddingSlot && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"><div className="bg-white rounded-[2.5rem] w-full max-md shadow-2xl p-10 border border-slate-100"><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-6">Ajouter un don</h3><div className="space-y-6"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Type de don</label><input autoFocus placeholder="Ex: Parnassa, Montee..." value={newSlotName} onChange={(e) => setNewSlotName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none text-slate-800" /></div>{!isShabbatEvent && <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Office</label><select value={newSlotOffice} onChange={(e) => setNewSlotOffice(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none text-slate-800">{OFFICES.map(o => <option key={o} value={o}>{o}</option>)}</select></div>}<div className="flex gap-4"><button onClick={() => setIsAddingSlot(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs">Annuler</button><button onClick={confirmAddSlot} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-indigo-100">Ajouter</button></div></div></div></div>}
      {deleteConfirm && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"><div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 border border-slate-100 text-center"><div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={40} /></div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-4">Confirmer la suppression ?</h3><p className="text-slate-500 font-bold text-sm mb-10 leading-relaxed uppercase tracking-tight">{deleteConfirm.type === 'event' ? "Tous les dons liés à cet événement seront supprimés définitivement." : `Voulez-vous supprimer le don "${deleteConfirm.slot?.name}"${!isShabbatEvent ? ` (${deleteConfirm.slot?.office})` : ''} ?`}</p><div className="flex gap-4"><button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs">Annuler</button><button onClick={handleConfirmDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-rose-100">Supprimer</button></div></div></div>}
      {isAddingEvent && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"><div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl p-12 border border-slate-100 animate-in zoom-in-95 duration-200"><div className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Nouvel Événement</h3><button onClick={() => setIsAddingEvent(false)} className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={24}/></button></div><form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); addEvent(fd.get('name') as string, fd.get('category') as DonationCategory, fd.get('date') as string); }} className="space-y-6"><input name="name" required placeholder="Nom de l'événement" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none text-slate-800" /><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Date</label><input name="date" type="date" required className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none text-slate-800" defaultValue={new Date().toISOString().split('T')[0]} /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Catégorie</label><select name="category" required className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none text-slate-800">{DONATION_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div><button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl uppercase tracking-tighter shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all mt-4">Créer l'événement</button></form></div></div>}
      {(isAddingFidele || editingFideleId) && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"><div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl p-12 border border-slate-100 animate-in zoom-in-95 duration-200"><div className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">{editingFideleId ? 'Modifier Fidèle' : 'Nouveau Fidèle'}</h3><button onClick={() => { setIsAddingFidele(false); setEditingFideleId(null); }} className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={24} /></button></div><form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const data = { nom: formData.get('nom') as string, prenom: formData.get('prenom') as string, mail: formData.get('mail') as string, telephone: formData.get('telephone') as string, paysResidence: formData.get('pays') as string, preferenceRecu: formData.get('preference') as ReceiptPreference, balancePrecedente: Number(formData.get('balancePrecedente')) || 0 }; editingFideleId ? updateFidele(editingFideleId, data) : addFidele(data); }} className="space-y-6">
        <div className="bg-amber-50 p-8 rounded-[2rem] border-2 border-amber-200 mb-4 animate-pulse-slow">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 bg-amber-200 text-amber-700 rounded-xl flex items-center justify-center"><Scale size={20} /></div>
             <label className="text-sm font-black uppercase text-amber-800 tracking-widest">💰 Balance Précédente (Anciennes dettes ₪)</label>
          </div>
          <input 
            name="balancePrecedente" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            defaultValue={editingFidele?.balancePrecedente} 
            className="w-full px-6 py-5 bg-white border-2 border-amber-300 rounded-2xl font-black text-3xl text-amber-900 outline-none focus:ring-4 focus:ring-amber-100 shadow-inner" 
          />
          <p className="mt-3 text-[10px] font-bold text-amber-600 uppercase italic">⚠️ Ce montant s'additionnera automatiquement au total de ses promesses de dons.</p>
        </div>
        <div className="grid grid-cols-2 gap-6"><input name="prenom" required placeholder="Prénom" defaultValue={editingFidele?.prenom} className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl font-bold outline-none" /><input name="nom" required placeholder="Nom" defaultValue={editingFidele?.nom} className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl font-bold outline-none" /></div><input name="mail" type="email" placeholder="Email" defaultValue={editingFidele?.mail} className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl font-bold outline-none" /><div className="grid grid-cols-2 gap-6"><input name="telephone" placeholder="Téléphone" defaultValue={editingFidele?.telephone} className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl font-bold outline-none" /><input name="pays" placeholder="Pays" defaultValue={editingFidele?.paysResidence} className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl font-bold outline-none" /></div><div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Préférence Reçu</label><select name="preference" defaultValue={editingFidele?.preferenceRecu} className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl font-bold outline-none"><option value="Cerfa">Cerfa</option><option value="Tofess 46">Tofess 46</option><option value="En attente">En attente</option><option value="Aucun">Aucun</option></select></div><button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl uppercase tracking-tighter shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all">{editingFideleId ? 'Mettre à jour' : 'Enregistrer la fiche'}</button></form></div></div>}
      {isAddingEncaissement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-[#4A4DE6] px-8 py-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white tracking-tight">Nouvel Encaissement</h3>
              <button onClick={() => setIsAddingEncaissement(false)} className="text-white hover:bg-white/10 p-1 rounded-lg transition-all"><X size={24} /></button>
            </div>
            <div className="p-8">
              <PaymentForm fideles={fideles} onSubmit={(data) => { addEncaissement(data); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
        if (amountEuro > 0) {
          setAmountNis(parseFloat((amountEuro * rate).toFixed(2)));
        }
      } catch (error) {
        console.error("Impossible de récupérer le taux réel, utilisation du taux par défaut.");
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

  const handleNisChange = (val: number) => {
    setAmountNis(val);
  };

  return (
    <form onSubmit={(e) => { 
      e.preventDefault(); 
      if (!selectedFideleId) return alert("Veuillez sélectionner un fidèle");
      const formData = new FormData(e.currentTarget); 
      onSubmit({ 
        date: paymentDate, 
        fideleId: selectedFideleId, 
        montantNis: amountNis, 
        montantEuro: amountEuro, 
        tauxChange: exchangeRate, 
        type: formData.get('type') as TransactionType, 
        compte: formData.get('compte') as BankAccount, 
        recu: receiptStatus 
      }); 
    }} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Fidèle</label>
          <FideleSearch fideles={fideles} selectedId={selectedFideleId} onSelect={setSelectedFideleId} placeholder="-- Sélectionner --" className="w-full" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Date d'encaissement</label>
          <div className="relative">
            <input name="date" type="date" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-500" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Montant EUR (€)</label>
            <div className="flex items-center gap-1">
              {isLoadingRate && <Loader2 size={10} className="animate-spin text-indigo-600" />}
              <span className="text-[10px] font-black text-indigo-600">Taux: {exchangeRate}</span>
            </div>
          </div>
          <input type="number" step="0.01" placeholder="0.00" value={amountEuro || ''} onChange={(e) => handleEuroChange(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm text-slate-400 outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Montant NIS (₪)</label>
          <input type="number" step="0.01" placeholder="0.00" value={amountNis || ''} onChange={(e) => handleNisChange(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl font-bold text-sm text-indigo-600 outline-none shadow-[0_0_10px_rgba(74,77,230,0.05)]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Type de transaction</label>
          <div className="relative">
            <select name="type" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none appearance-none focus:border-indigo-500">
              {['Virement', 'Espece', 'Cheque', 'Direct Donateur'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Compte</label>
          <div className="relative">
            <select name="compte" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none appearance-none focus:border-indigo-500">
              {BANK_ACCOUNTS.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Statut du reçu</label>
        <div className="grid grid-cols-4 gap-2">
          {(['Tofess 46', 'Cerfa', 'En attente', 'Aucun'] as ReceiptPreference[]).map(status => (
            <button key={status} type="button" onClick={() => setReceiptStatus(status)} className={`py-3 px-1 rounded-xl text-[10px] font-black uppercase transition-all border ${receiptStatus === status ? 'bg-[#4A4DE6] border-[#4A4DE6] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>
              {status}
            </button>
          ))}
        </div>
      </div>
      <button type="submit" className="w-full py-4 bg-[#4A4DE6] text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all mt-4">
        Enregistrer l'encaissement
      </button>
    </form>
  );
};

export default App;
