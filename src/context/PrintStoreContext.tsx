'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { CostSettings, KpiData, Order, OrderTonerBreakdown, Toner, TonerStatus } from '@/types';
import { DEFAULT_ORDERS, DEFAULT_SETTINGS, DEFAULT_TONERS } from '@/utils/initialData';
import { calculateKpis, getStandardUnitPrice } from '@/utils/calculations';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import {
  dbOrderToOrder,
  orderToDbOrder,
  dbTonerToToner,
  tonerToDbToner,
  dbSettingsToSettings,
  settingsToDbSettings,
  DbOrder,
  DbToner,
  DbSettings,
} from '@/utils/supabaseSync';

interface AddOrderInput {
  customerName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  isPaid: boolean;
  isContactGroup: boolean;
  tonerId?: string; // If omitted, uses current active toner
  tonerBreakdown?: OrderTonerBreakdown[];
  tonerNameText?: string;
  date?: string;
  notes?: string;
  autoRetireOldTonerId?: string;
  autoActivateNewTonerId?: string;
  autoCreateNewTonerName?: string;
}

interface PrintStoreContextType {
  orders: Order[];
  toners: Toner[];
  settings: CostSettings;
  kpis: KpiData;
  isLoaded: boolean;
  isCloudConnected: boolean;
  activeToner: Toner | undefined;
  
  // Order actions
  addOrder: (input: AddOrderInput) => Order;
  updateOrder: (order: Order) => void;
  deleteOrder: (id: string) => void;
  togglePaymentStatus: (id: string) => void;
  markAllAsPaid: () => void;

  // Toner actions
  addToner: (name?: string, capacity?: number) => void;
  updateToner: (toner: Toner) => void;
  deleteToner: (id: string) => void;
  setTonerStatus: (id: string, status: TonerStatus) => void;
  markTonerFinishedAndActivateNext: (tonerId: string) => void;
  replaceActiveToner: (currentTonerId: string, nextTonerIdOrName?: string) => void;
  getNextTonerName: () => string;
  adjustTonerCount: (tonerId: string, delta: number) => void;

  // Settings actions
  updateSettings: (newSettings: Partial<CostSettings>) => void;
  resetToDefaults: () => void;

  // Backup & Restore
  exportJson: () => void;
  importJson: (jsonString: string) => { success: boolean; error?: string };
  exportCsv: () => void;
}

const STORAGE_KEY_ORDERS = 'brorup_orders_v1';
const STORAGE_KEY_TONERS = 'brorup_toners_v1';
const STORAGE_KEY_SETTINGS = 'brorup_settings_v1';

const PrintStoreContext = createContext<PrintStoreContextType | null>(null);

export function PrintStoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(DEFAULT_ORDERS);
  const [toners, setToners] = useState<Toner[]>(DEFAULT_TONERS);
  const [settings, setSettings] = useState<CostSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const isCloudConnected = isSupabaseConfigured;

  // Initial load from Supabase or LocalStorage
  useEffect(() => {
    let isCancelled = false;
    const db = supabase;

    async function loadData() {
      // 1. Try loading from Supabase if configured
      if (db) {
        try {
          const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
          let cachedSettings: CostSettings | undefined = undefined;
          if (storedSettings) {
            try {
              cachedSettings = JSON.parse(storedSettings);
            } catch (e) {
              console.error(e);
            }
          }

          const [ordersRes, tonersRes, settingsRes] = await Promise.all([
            db.from('orders').select('*').order('created_at', { ascending: false }),
            db.from('toners').select('*').order('id', { ascending: true }),
            db.from('settings').select('*').limit(1).maybeSingle(),
          ]);

          if (!isCancelled) {
            if (ordersRes.data && ordersRes.data.length > 0) {
              setOrders(ordersRes.data.map((r) => dbOrderToOrder(r as DbOrder)));
            }
            if (tonersRes.data && tonersRes.data.length > 0) {
              setToners(tonersRes.data.map((r) => dbTonerToToner(r as DbToner)));
            }
            if (settingsRes.data) {
              setSettings(dbSettingsToSettings(settingsRes.data as DbSettings, cachedSettings));
            }
          }
        } catch (err) {
          console.error('Error fetching from Supabase, falling back to LocalStorage:', err);
        }
      } else {
        // 2. Load from LocalStorage fallback
        try {
          const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
          const storedToners = localStorage.getItem(STORAGE_KEY_TONERS);
          const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);

          if (!isCancelled) {
            if (storedOrders) setOrders(JSON.parse(storedOrders));
            if (storedToners) setToners(JSON.parse(storedToners));
            if (storedSettings) setSettings(JSON.parse(storedSettings));
          }
        } catch (err) {
          console.error('Failed to load from localStorage:', err);
        }
      }

      if (!isCancelled) {
        setIsLoaded(true);
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Supabase Realtime Subscription: Sync live across PC & mobile!
  useEffect(() => {
    const db = supabase;
    if (!db) return;

    const channel = db
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = dbOrderToOrder(payload.new as DbOrder);
            setOrders((prev) => (prev.some((o) => o.id === newOrder.id) ? prev : [newOrder, ...prev]));
          } else if (payload.eventType === 'UPDATE') {
            const updated = dbOrderToOrder(payload.new as DbOrder);
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setOrders((prev) => prev.filter((o) => o.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'toners' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newToner = dbTonerToToner(payload.new as DbToner);
            setToners((prev) => (prev.some((t) => t.id === newToner.id) ? prev : [...prev, newToner]));
          } else if (payload.eventType === 'UPDATE') {
            const updated = dbTonerToToner(payload.new as DbToner);
            setToners((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setToners((prev) => prev.filter((t) => t.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setSettings((prev) => dbSettingsToSettings(payload.new as DbSettings, prev));
          }
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, []);

  // Cache to LocalStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_TONERS, JSON.stringify(toners));
    } catch (e) {
      console.error(e);
    }
  }, [toners, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings, isLoaded]);

  // Derived: Active toner
  const activeToner = useMemo(() => {
    return toners.find((t) => t.status === 'active') || toners[0];
  }, [toners]);

  // Derived: KPIs
  const kpis = useMemo(() => {
    return calculateKpis(orders, settings);
  }, [orders, settings]);

  const getNextTonerName = useCallback(() => {
    let maxNum = 0;
    for (const t of toners) {
      const match = t.name.match(/Toner\s*(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = maxNum > 0 ? maxNum + 1 : toners.length + 1;
    return `Toner ${nextNum}`;
  }, [toners]);

  // Order actions
  const addOrder = useCallback((input: AddOrderInput): Order => {
    const qty = Math.max(1, Number(input.quantity) || 1);
    const unitPrice =
      typeof input.unitPrice === 'number'
        ? input.unitPrice
        : getStandardUnitPrice(qty, input.isContactGroup, settings);
    const totalPrice =
      typeof input.totalPrice === 'number' ? input.totalPrice : Math.round(qty * unitPrice * 100) / 100;

    // Check if breakdown was provided
    const hasCustomBreakdown = Array.isArray(input.tonerBreakdown) && input.tonerBreakdown.length > 0;
    let finalBreakdown: OrderTonerBreakdown[] = [];
    let tonerLabel = '';

    if (hasCustomBreakdown) {
      finalBreakdown = [...input.tonerBreakdown!];
      if (input.tonerNameText) {
        tonerLabel = input.tonerNameText;
      } else {
        tonerLabel = finalBreakdown
          .map((b) => {
            const t = toners.find((item) => item.id === b.tonerId);
            return `${t ? t.name : 'Toner'} (${b.count} stk)`;
          })
          .join(' / ');
      }
    } else {
      const targetTonerId = input.tonerId || (activeToner ? activeToner.id : 'toner-2');
      const targetToner = toners.find((t) => t.id === targetTonerId);
      tonerLabel = targetToner ? `${targetToner.name} (${qty} stk)` : `Toner (${qty} stk)`;
      if (targetToner) {
        finalBreakdown = [{ tonerId: targetToner.id, count: qty }];
      }
    }

    // Check if a brand new toner is created during mid-order split
    let generatedNewToner: Toner | undefined;
    const actualBreakdown: OrderTonerBreakdown[] = [...finalBreakdown];

    if (input.autoCreateNewTonerName) {
      const newTonerId = `toner-${Date.now()}`;
      const alloc = actualBreakdown.find(
        (b) => b.tonerId === 'new-toner-temp' || b.tonerId === input.autoActivateNewTonerId
      );
      const initialCount = alloc ? alloc.count : 0;

      generatedNewToner = {
        id: newTonerId,
        name: input.autoCreateNewTonerName,
        status: 'active',
        printedCount: initialCount,
        capacity: 108,
        notes: 'Taget i brug ved ordre',
      };

      if (alloc) {
        alloc.tonerId = newTonerId;
      }

      tonerLabel = actualBreakdown
        .map((b) => {
          if (b.tonerId === newTonerId) {
            return `${input.autoCreateNewTonerName} (${b.count} stk)`;
          }
          const t = toners.find((item) => item.id === b.tonerId);
          return `${t ? t.name : 'Toner'} (${b.count} stk)`;
        })
        .join(' / ');
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerName: input.customerName.trim(),
      quantity: qty,
      unitPrice,
      totalPrice,
      isPaid: input.isPaid,
      isContactGroup: input.isContactGroup,
      tonerNameText: tonerLabel,
      tonerBreakdown: actualBreakdown.length > 0 ? actualBreakdown : undefined,
      date: input.date || new Date().toISOString().split('T')[0],
      notes: input.notes?.trim() || '',
      createdAt: Date.now(),
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Update target toner count(s) & statuses
    const db = supabase;
    setToners((prev) => {
      const working = generatedNewToner ? [...prev, generatedNewToner] : [...prev];

      const updated = working.map((t) => {
        let count = t.printedCount;
        let status = t.status;

        // If not newly generated, add count from this order
        if (!generatedNewToner || t.id !== generatedNewToner.id) {
          const alloc = actualBreakdown.find((b) => b.tonerId === t.id);
          if (alloc && alloc.count > 0) {
            count = count + alloc.count;
          }
        }

        // Auto retire old toner
        if (input.autoRetireOldTonerId && t.id === input.autoRetireOldTonerId) {
          status = 'finished' as TonerStatus;
        }

        // Auto activate existing ready toner
        if (
          input.autoActivateNewTonerId &&
          t.id === input.autoActivateNewTonerId &&
          (!generatedNewToner || t.id !== generatedNewToner.id)
        ) {
          status = 'active' as TonerStatus;
        }

        return { ...t, printedCount: count, status };
      });

      if (db) {
        if (generatedNewToner) {
          db.from('toners').insert(tonerToDbToner(generatedNewToner)).then();
        }
        updated.forEach((t) => {
          if (!generatedNewToner || t.id !== generatedNewToner.id) {
            const hasChanged = prev.some(
              (p) => p.id === t.id && (p.printedCount !== t.printedCount || p.status !== t.status)
            );
            if (hasChanged) {
              db.from('toners').update(tonerToDbToner(t)).eq('id', t.id).then();
            }
          }
        });
      }

      return updated;
    });

    if (db) {
      db.from('orders').insert(orderToDbOrder(newOrder)).then();
    }

    return newOrder;
  }, [activeToner, toners, settings]);

  const updateOrder = useCallback((updatedOrder: Order) => {
    setOrders((prev) => {
      const oldOrder = prev.find((ord) => ord.id === updatedOrder.id);
      if (oldOrder) {
        // Reconcile toner allocations
        const oldBreakdown = oldOrder.tonerBreakdown || [];
        const newBreakdown = updatedOrder.tonerBreakdown || [];

        const netChanges: Record<string, number> = {};
        for (const item of oldBreakdown) {
          netChanges[item.tonerId] = (netChanges[item.tonerId] || 0) - item.count;
        }
        for (const item of newBreakdown) {
          netChanges[item.tonerId] = (netChanges[item.tonerId] || 0) + item.count;
        }

        const tonersToUpdate = Object.entries(netChanges).filter(([, diff]) => diff !== 0);
        if (tonersToUpdate.length > 0) {
          const db = supabase;
          setToners((prevToners) => {
            return prevToners.map((t) => {
              const diff = netChanges[t.id];
              if (diff) {
                const updated = { ...t, printedCount: Math.max(0, t.printedCount + diff) };
                if (db) {
                  db.from('toners').update(tonerToDbToner(updated)).eq('id', updated.id).then();
                }
                return updated;
              }
              return t;
            });
          });
        }
      }

      return prev.map((ord) => (ord.id === updatedOrder.id ? updatedOrder : ord));
    });

    const db = supabase;
    if (db) {
      db.from('orders').update(orderToDbOrder(updatedOrder)).eq('id', updatedOrder.id).then();
    }
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => {
      const target = prev.find((ord) => ord.id === id);
      if (target && target.tonerBreakdown && target.tonerBreakdown.length > 0) {
        const db = supabase;
        setToners((prevToners) => {
          return prevToners.map((t) => {
            const alloc = target.tonerBreakdown?.find((b) => b.tonerId === t.id);
            if (alloc && alloc.count > 0) {
              const updated = { ...t, printedCount: Math.max(0, t.printedCount - alloc.count) };
              if (db) {
                db.from('toners').update(tonerToDbToner(updated)).eq('id', updated.id).then();
              }
              return updated;
            }
            return t;
          });
        });
      }
      return prev.filter((ord) => ord.id !== id);
    });

    const db = supabase;
    if (db) {
      db.from('orders').delete().eq('id', id).then();
    }
  }, []);

  const togglePaymentStatus = useCallback((id: string) => {
    setOrders((prev) => {
      const target = prev.find((o) => o.id === id);
      if (!target) return prev;
      const nextPaid = !target.isPaid;
      const updated = { ...target, isPaid: nextPaid };

      const db = supabase;
      if (db) {
        db.from('orders').update({ is_paid: nextPaid }).eq('id', id).then();
      }

      return prev.map((ord) => (ord.id === id ? updated : ord));
    });
  }, []);

  const markAllAsPaid = useCallback(() => {
    setOrders((prev) => prev.map((ord) => ({ ...ord, isPaid: true })));
    const db = supabase;
    if (db) {
      db.from('orders').update({ is_paid: true }).neq('is_paid', true).then();
    }
  }, []);

  // Toner actions
  const addToner = useCallback((name?: string, capacity = 108) => {
    const nextNumber = toners.length + 1;
    const tonerName = name || `Toner ${nextNumber}`;
    const newToner: Toner = {
      id: `toner-${Date.now()}`,
      name: tonerName,
      status: toners.some((t) => t.status === 'active') ? 'ready' : 'active',
      printedCount: 0,
      capacity,
      notes: 'Tilføjet manuelt',
    };
    setToners((prev) => [...prev, newToner]);
    const db = supabase;
    if (db) {
      db.from('toners').insert(tonerToDbToner(newToner)).then();
    }
  }, [toners]);

  const updateToner = useCallback((updatedToner: Toner) => {
    setToners((prev) =>
      prev.map((t) => (t.id === updatedToner.id ? updatedToner : t))
    );
    const db = supabase;
    if (db) {
      db.from('toners').update(tonerToDbToner(updatedToner)).eq('id', updatedToner.id).then();
    }
  }, []);

  const deleteToner = useCallback((id: string) => {
    setToners((prev) => prev.filter((t) => t.id !== id));
    const db = supabase;
    if (db) {
      db.from('toners').delete().eq('id', id).then();
    }
  }, []);

  const setTonerStatus = useCallback((id: string, status: TonerStatus) => {
    setToners((prev) => {
      const nextToners = prev.map((t) => {
        if (t.id === id) {
          return { ...t, status };
        }
        if (status === 'active' && t.status === 'active') {
          return { ...t, status: 'ready' as TonerStatus };
        }
        return t;
      });

      const db = supabase;
      if (db) {
        nextToners.forEach((t) => {
          db.from('toners').update({ status: t.status }).eq('id', t.id).then();
        });
      }

      return nextToners;
    });
  }, []);

  const markTonerFinishedAndActivateNext = useCallback((tonerId: string) => {
    setToners((prev) => {
      const targetIndex = prev.findIndex((t) => t.id === tonerId);
      if (targetIndex === -1) return prev;

      const nextReadyIndex = prev.findIndex(
        (t, idx) => idx > targetIndex && t.status === 'ready'
      );

      const fallbackReadyIndex =
        nextReadyIndex !== -1
          ? nextReadyIndex
          : prev.findIndex((t, idx) => idx !== targetIndex && t.status === 'ready');

      const updated = prev.map((t, idx) => {
        if (idx === targetIndex) {
          return { ...t, status: 'finished' as TonerStatus };
        }
        if (fallbackReadyIndex !== -1 && idx === fallbackReadyIndex) {
          return { ...t, status: 'active' as TonerStatus };
        }
        return t;
      });

      const db = supabase;
      if (db) {
        updated.forEach((t) => {
          db.from('toners').update({ status: t.status }).eq('id', t.id).then();
        });
      }

      return updated;
    });
  }, []);

  const replaceActiveToner = useCallback((currentTonerId: string, nextTonerIdOrName?: string) => {
    setToners((prev) => {
      const db = supabase;
      const targetCurrent = prev.find((t) => t.id === currentTonerId);
      if (!targetCurrent) return prev;

      const nextReady = prev.find((t) =>
        nextTonerIdOrName ? t.id === nextTonerIdOrName : t.id !== currentTonerId && t.status === 'ready'
      );
      let newlyCreated: Toner | undefined;

      if (!nextReady) {
        let maxNum = 0;
        for (const t of prev) {
          const match = t.name.match(/Toner\s*(\d+)/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }
        const nextNum = maxNum > 0 ? maxNum + 1 : prev.length + 1;
        const newName =
          nextTonerIdOrName && !prev.some((t) => t.id === nextTonerIdOrName)
            ? nextTonerIdOrName
            : `Toner ${nextNum}`;

        newlyCreated = {
          id: `toner-${Date.now()}`,
          name: newName,
          status: 'active',
          printedCount: 0,
          capacity: 108,
          notes: 'Taget i brug',
        };
      }

      const updated = prev.map((t) => {
        if (t.id === currentTonerId) {
          return { ...t, status: 'finished' as TonerStatus };
        }
        if (nextReady && t.id === nextReady.id) {
          return { ...t, status: 'active' as TonerStatus };
        }
        return t;
      });

      const finalToners = newlyCreated ? [...updated, newlyCreated] : updated;

      if (db) {
        if (newlyCreated) {
          db.from('toners').insert(tonerToDbToner(newlyCreated)).then();
        }
        db.from('toners').update({ status: 'finished' }).eq('id', currentTonerId).then();
        if (nextReady) {
          db.from('toners').update({ status: 'active' }).eq('id', nextReady.id).then();
        }
      }

      return finalToners;
    });
  }, []);

  const adjustTonerCount = useCallback((tonerId: string, delta: number) => {
    setToners((prev) => {
      const updated = prev.map((t) =>
        t.id === tonerId
          ? { ...t, printedCount: Math.max(0, t.printedCount + delta) }
          : t
      );
      const target = updated.find((t) => t.id === tonerId);
      const db = supabase;
      if (target && db) {
        db.from('toners').update({ printed_count: target.printedCount }).eq('id', tonerId).then();
      }
      return updated;
    });
  }, []);

  // Settings actions
  const updateSettings = useCallback((newSettings: Partial<CostSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      const db = supabase;
      if (db) {
        const fullPayload = settingsToDbSettings(merged);
        db.from('settings')
          .upsert(fullPayload)
          .then(({ error }) => {
            if (error) {
              // Fallback to core columns if tier columns are not yet migrated in Supabase
              const basicPayload = {
                id: 'default',
                paper_pack_price: merged.paperPackPrice,
                prints_per_pack: merged.printsPerPack,
                packs_per_purchase: merged.packsPerPurchase,
                shipping_price: merged.shippingPrice,
                printer_cost: merged.printerCost,
              };
              db.from('settings').upsert(basicPayload).then();
            }
          });
      }
      return merged;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setOrders(DEFAULT_ORDERS);
    setToners(DEFAULT_TONERS);
    setSettings(DEFAULT_SETTINGS);

    const db = supabase;
    if (db) {
      Promise.all([
        db.from('orders').delete().neq('id', ''),
        db.from('toners').delete().neq('id', ''),
      ]).then(() => {
        db.from('orders').insert(DEFAULT_ORDERS.map(orderToDbOrder)).then();
        db.from('toners').insert(DEFAULT_TONERS.map(tonerToDbToner)).then();
        db.from('settings').upsert(settingsToDbSettings(DEFAULT_SETTINGS)).then();
      });
    }

    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(DEFAULT_ORDERS));
      localStorage.setItem(STORAGE_KEY_TONERS, JSON.stringify(DEFAULT_TONERS));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Backup & Restore
  const exportJson = useCallback(() => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'Billede Print Dashboard',
      settings,
      toners,
      orders,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `billede-print-backup-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [settings, toners, orders]);

  const importJson = useCallback((jsonString: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Ugyldigt JSON format' };
      }

      const db = supabase;

      if (Array.isArray(parsed.orders)) {
        setOrders(parsed.orders);
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(parsed.orders));
        if (db) {
          db.from('orders').delete().neq('id', '').then(() => {
            db.from('orders').insert(parsed.orders.map(orderToDbOrder)).then();
          });
        }
      }
      if (Array.isArray(parsed.toners)) {
        setToners(parsed.toners);
        localStorage.setItem(STORAGE_KEY_TONERS, JSON.stringify(parsed.toners));
        if (db) {
          db.from('toners').delete().neq('id', '').then(() => {
            db.from('toners').insert(parsed.toners.map(tonerToDbToner)).then();
          });
        }
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        setSettings(parsed.settings);
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(parsed.settings));
        if (db) {
          db.from('settings').upsert(settingsToDbSettings(parsed.settings)).then();
        }
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Kunne ikke indlæse filen',
      };
    }
  }, []);

  const exportCsv = useCallback(() => {
    const headers = [
      'Ordre ID',
      'Dato',
      'Kunde',
      'Antal prints',
      'Pris pr. stk (kr.)',
      'Samlet pris (kr.)',
      'Betalt',
      'Kontaktgruppe',
      'Toner',
      'Noter',
    ];

    const rows = orders.map((o) => [
      `"${o.id}"`,
      `"${o.date}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.quantity,
      o.unitPrice.toString().replace('.', ','),
      o.totalPrice.toString().replace('.', ','),
      o.isPaid ? 'Ja' : 'Nej',
      o.isContactGroup ? 'Ja' : 'Nej',
      `"${(o.tonerNameText || '').replace(/"/g, '""')}"`,
      `"${(o.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.download = `billede-print-ordrer-${dateStr}.csv`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  }, [orders]);

  return (
    <PrintStoreContext.Provider
      value={{
        orders,
        toners,
        settings,
        kpis,
        isLoaded,
        isCloudConnected,
        activeToner,
        addOrder,
        updateOrder,
        deleteOrder,
        togglePaymentStatus,
        markAllAsPaid,
        addToner,
        updateToner,
        deleteToner,
        setTonerStatus,
        markTonerFinishedAndActivateNext,
        replaceActiveToner,
        getNextTonerName,
        adjustTonerCount,
        updateSettings,
        resetToDefaults,
        exportJson,
        importJson,
        exportCsv,
      }}
    >
      {children}
    </PrintStoreContext.Provider>
  );
}

export function usePrintStore() {
  const context = useContext(PrintStoreContext);
  if (!context) {
    throw new Error('usePrintStore must be used within a PrintStoreProvider');
  }
  return context;
}
