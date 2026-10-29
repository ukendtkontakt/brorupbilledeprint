'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { CostSettings, KpiData, Order, Toner, TonerStatus } from '@/types';
import { DEFAULT_ORDERS, DEFAULT_SETTINGS, DEFAULT_TONERS } from '@/utils/initialData';
import { calculateKpis, getStandardUnitPrice } from '@/utils/calculations';

interface AddOrderInput {
  customerName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  isPaid: boolean;
  isContactGroup: boolean;
  tonerId?: string; // If omitted, uses current active toner
  date?: string;
  notes?: string;
}

interface PrintStoreContextType {
  orders: Order[];
  toners: Toner[];
  settings: CostSettings;
  kpis: KpiData;
  isLoaded: boolean;
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

  // Load from LocalStorage on mount asynchronously to prevent cascading renders
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
        const storedToners = localStorage.getItem(STORAGE_KEY_TONERS);
        const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);

        if (storedOrders) {
          setOrders(JSON.parse(storedOrders));
        } else {
          localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(DEFAULT_ORDERS));
        }

        if (storedToners) {
          setToners(JSON.parse(storedToners));
        } else {
          localStorage.setItem(STORAGE_KEY_TONERS, JSON.stringify(DEFAULT_TONERS));
        }

        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        } else {
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        }
      } catch (err) {
        console.error('Failed to load from localStorage:', err);
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Save to LocalStorage when states change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (err) {
      console.error('Failed to save orders:', err);
    }
  }, [orders, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_TONERS, JSON.stringify(toners));
    } catch (err) {
      console.error('Failed to save toners:', err);
    }
  }, [toners, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save settings:', err);
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

  // Order actions
  const addOrder = (input: AddOrderInput): Order => {
    const qty = Math.max(1, Number(input.quantity) || 1);
    const unitPrice =
      typeof input.unitPrice === 'number'
        ? input.unitPrice
        : getStandardUnitPrice(qty, input.isContactGroup);
    const totalPrice =
      typeof input.totalPrice === 'number' ? input.totalPrice : Math.round(qty * unitPrice * 100) / 100;

    // Determine toner
    const targetTonerId = input.tonerId || (activeToner ? activeToner.id : 'toner-2');
    const targetToner = toners.find((t) => t.id === targetTonerId);
    const tonerLabel = targetToner ? `${targetToner.name} (${qty} stk)` : `Toner (${qty} stk)`;

    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerName: input.customerName.trim(),
      quantity: qty,
      unitPrice,
      totalPrice,
      isPaid: input.isPaid,
      isContactGroup: input.isContactGroup,
      tonerNameText: tonerLabel,
      tonerBreakdown: targetToner ? [{ tonerId: targetToner.id, count: qty }] : undefined,
      date: input.date || new Date().toISOString().split('T')[0],
      notes: input.notes?.trim() || '',
      createdAt: Date.now(),
    };

    // Update orders list (newest first)
    setOrders((prev) => [newOrder, ...prev]);

    // Automatically update toner print count on target toner
    if (targetToner) {
      setToners((prev) =>
        prev.map((t) =>
          t.id === targetToner.id
            ? { ...t, printedCount: t.printedCount + qty }
            : t
        )
      );
    }

    return newOrder;
  };

  const updateOrder = (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === updatedOrder.id ? updatedOrder : ord))
    );
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((ord) => ord.id !== id));
  };

  const togglePaymentStatus = (id: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === id ? { ...ord, isPaid: !ord.isPaid } : ord
      )
    );
  };

  const markAllAsPaid = () => {
    setOrders((prev) => prev.map((ord) => ({ ...ord, isPaid: true })));
  };

  // Toner actions
  const addToner = (name?: string, capacity = 108) => {
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
  };

  const updateToner = (updatedToner: Toner) => {
    setToners((prev) =>
      prev.map((t) => (t.id === updatedToner.id ? updatedToner : t))
    );
  };

  const deleteToner = (id: string) => {
    setToners((prev) => prev.filter((t) => t.id !== id));
  };

  const setTonerStatus = (id: string, status: TonerStatus) => {
    setToners((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return { ...t, status };
        }
        // If we set a toner to active, ensure others aren't active unless intended
        if (status === 'active' && t.status === 'active') {
          return { ...t, status: 'ready' };
        }
        return t;
      })
    );
  };

  /**
   * Fast toggle: "Rød betyder den er færdig nu".
   * Sets this toner as 'finished' (Red) and sets the next ready toner as 'active' (or creates/promotes next).
   */
  const markTonerFinishedAndActivateNext = (tonerId: string) => {
    setToners((prev) => {
      const targetIndex = prev.findIndex((t) => t.id === tonerId);
      if (targetIndex === -1) return prev;

      // Find next ready toner
      const nextReadyIndex = prev.findIndex(
        (t, idx) => idx > targetIndex && t.status === 'ready'
      );

      // If no subsequent ready toner, find any ready toner
      const fallbackReadyIndex =
        nextReadyIndex !== -1
          ? nextReadyIndex
          : prev.findIndex((t, idx) => idx !== targetIndex && t.status === 'ready');

      return prev.map((t, idx) => {
        if (idx === targetIndex) {
          return { ...t, status: 'finished' };
        }
        if (fallbackReadyIndex !== -1 && idx === fallbackReadyIndex) {
          return { ...t, status: 'active' };
        }
        return t;
      });
    });
  };

  const adjustTonerCount = (tonerId: string, delta: number) => {
    setToners((prev) =>
      prev.map((t) =>
        t.id === tonerId
          ? { ...t, printedCount: Math.max(0, t.printedCount + delta) }
          : t
      )
    );
  };

  // Settings actions
  const updateSettings = (newSettings: Partial<CostSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetToDefaults = () => {
    setOrders(DEFAULT_ORDERS);
    setToners(DEFAULT_TONERS);
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(DEFAULT_ORDERS));
      localStorage.setItem(STORAGE_KEY_TONERS, JSON.stringify(DEFAULT_TONERS));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    } catch (err) {
      console.error('Failed to reset localStorage:', err);
    }
  };

  // Backup & Restore
  const exportJson = () => {
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
  };

  const importJson = (jsonString: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Ugyldigt JSON format' };
      }

      if (Array.isArray(parsed.orders)) {
        setOrders(parsed.orders);
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(parsed.orders));
      }
      if (Array.isArray(parsed.toners)) {
        setToners(parsed.toners);
        localStorage.setItem(STORAGE_KEY_TONERS, JSON.stringify(parsed.toners));
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        setSettings(parsed.settings);
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(parsed.settings));
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Kunne ikke indlæse filen',
      };
    }
  };

  const exportCsv = () => {
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
  };

  return (
    <PrintStoreContext.Provider
      value={{
        orders,
        toners,
        settings,
        kpis,
        isLoaded,
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
