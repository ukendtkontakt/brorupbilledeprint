'use client';

import React, { useState } from 'react';
import { usePrintStore } from '@/context/PrintStoreContext';
import { useToast } from '@/context/ToastContext';
import { getStandardUnitPrice, formatCurrency } from '@/utils/calculations';
import {
  X,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  RotateCcw,
  Split,
} from 'lucide-react';

interface QuickAddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuantity?: number;
  initialIsContactGroup?: boolean;
  initialCustomerName?: string;
  initialUnitPrice?: number;
}

interface FormInnerProps {
  onClose: () => void;
  initialQuantity?: number;
  initialIsContactGroup?: boolean;
  initialCustomerName?: string;
  initialUnitPrice?: number;
}

function QuickAddFormInner({
  onClose,
  initialQuantity,
  initialIsContactGroup,
  initialCustomerName,
  initialUnitPrice,
}: FormInnerProps) {
  const { addOrder, toners, activeToner, orders, settings, getNextTonerName } = usePrintStore();
  const { showToast } = useToast();
  const nextSequentialName = getNextTonerName();

  const [customerName, setCustomerName] = useState(initialCustomerName || '');
  const [quantity, setQuantity] = useState<number>(initialQuantity || 1);
  const [isContactGroup, setIsContactGroup] = useState<boolean>(initialIsContactGroup || false);

  // Decimal price string supporting comma e.g. "4,7" or "4.7"
  const defaultInitialPrice = initialUnitPrice !== undefined
    ? initialUnitPrice
    : getStandardUnitPrice(initialQuantity || 1, initialIsContactGroup || false, settings);
  const [priceInput, setPriceInput] = useState<string>(() =>
    defaultInitialPrice.toString().replace('.', ',')
  );
  const [isManualPrice, setIsManualPrice] = useState<boolean>(initialUnitPrice !== undefined);

  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // Primary toner selection (defaults to current active toner)
  const defaultToner = activeToner || toners.find((t) => t.status === 'active') || toners[0];
  const [selectedTonerId, setSelectedTonerId] = useState<string>(defaultToner?.id || '');

  // Mid-order split state
  const [isSplitToner, setIsSplitToner] = useState<boolean>(false);
  const [printsOnFirstToner, setPrintsOnFirstToner] = useState<number>(() =>
    Math.max(1, Math.min(14, (initialQuantity || 1) - 1))
  );

  const readyToners = toners.filter((t) => t.status === 'ready' && t.id !== selectedTonerId);
  const [secondTonerChoice, setSecondTonerChoice] = useState<string>(() => readyToners[0]?.id || 'NEW_TONER');
  const [autoRetireFirstToner, setAutoRetireFirstToner] = useState<boolean>(true);

  // Extract unique customer names for quick autocomplete
  const existingCustomers = Array.from(new Set(orders.map((o) => o.customerName))).filter(Boolean);

  // Parse price safely from comma or dot input
  const parsedUnitPrice = (() => {
    if (!isManualPrice) {
      return getStandardUnitPrice(quantity, isContactGroup, settings);
    }
    const clean = priceInput.replace(',', '.').trim();
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  })();

  const totalPrice = Math.round(quantity * parsedUnitPrice * 100) / 100;

  // Handle quantity changes
  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    setQuantity(validQty);
    if (!isManualPrice) {
      const autoPrice = getStandardUnitPrice(validQty, isContactGroup, settings);
      setPriceInput(autoPrice.toString().replace('.', ','));
    }

    if (printsOnFirstToner >= validQty) {
      setPrintsOnFirstToner(Math.max(1, validQty - 1));
    }
  };

  const handleContactGroupToggle = (checked: boolean) => {
    setIsContactGroup(checked);
    setIsManualPrice(false);
    const autoPrice = getStandardUnitPrice(quantity, checked, settings);
    setPriceInput(autoPrice.toString().replace('.', ','));
  };

  const handlePriceChange = (val: string) => {
    setPriceInput(val);
    setIsManualPrice(true);
  };

  const resetToAutoPrice = () => {
    setIsManualPrice(false);
    const autoPrice = getStandardUnitPrice(quantity, isContactGroup, settings);
    setPriceInput(autoPrice.toString().replace('.', ','));
    showToast('Pris nulstillet til standard takst');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Angiv venligst et kundenavn', 'error');
      return;
    }
    if (quantity <= 0) {
      showToast('Antal skal være mindst 1 print', 'error');
      return;
    }

    // Mid-order split execution
    if (isSplitToner && quantity > 1) {
      const firstCount = Math.max(1, Math.min(printsOnFirstToner, quantity - 1));
      const secondCount = quantity - firstCount;

      const isBrandNewToner = secondTonerChoice === 'NEW_TONER';
      const secondTonerName = isBrandNewToner
        ? nextSequentialName
        : toners.find((t) => t.id === secondTonerChoice)?.name || 'Ny patron';

      const firstTonerName = toners.find((t) => t.id === selectedTonerId)?.name || 'Gammel patron';

      const createdOrder = addOrder({
        customerName,
        quantity,
        unitPrice: parsedUnitPrice,
        totalPrice,
        isPaid,
        isContactGroup,
        tonerBreakdown: [
          { tonerId: selectedTonerId, count: firstCount },
          { tonerId: isBrandNewToner ? 'new-toner-temp' : secondTonerChoice, count: secondCount },
        ],
        tonerNameText: `${firstTonerName} (${firstCount} stk) / ${secondTonerName} (${secondCount} stk)`,
        autoRetireOldTonerId: autoRetireFirstToner ? selectedTonerId : undefined,
        autoActivateNewTonerId: autoRetireFirstToner
          ? isBrandNewToner
            ? undefined
            : secondTonerChoice
          : undefined,
        autoCreateNewTonerName: isBrandNewToner ? nextSequentialName : undefined,
        date,
        notes,
      });

      showToast(
        autoRetireFirstToner
          ? `Ordre oprettet & patron skiftet til ${secondTonerName}!`
          : `Ordre oprettet for ${createdOrder.customerName}`
      );
      onClose();
      return;
    }

    // Standard single toner allocation
    const targetToner = toners.find((t) => t.id === selectedTonerId);
    const createdOrder = addOrder({
      customerName,
      quantity,
      unitPrice: parsedUnitPrice,
      totalPrice,
      isPaid,
      isContactGroup,
      tonerId: selectedTonerId,
      tonerNameText: targetToner ? `${targetToner.name} (${quantity} stk)` : undefined,
      date,
      notes,
    });

    showToast(
      `Ordre oprettet for ${createdOrder.customerName} (${createdOrder.quantity} stk - ${formatCurrency(createdOrder.totalPrice)})`
    );
    onClose();
  };

  return (
    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-stone-200 shadow-xl relative max-h-[92vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-stone-900">
            Opret ny print-ordre
          </h3>
          <p className="text-xs text-stone-500">
            Udfyld kundenavn, antal og evt. fordeling på flere tonere.
          </p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Customer Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Kunde Navn *
          </label>
          <input
            type="text"
            required
            placeholder="F.eks. Folke, Teng, Johannes..."
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm font-medium focus:outline-hidden focus:border-stone-500"
            autoFocus
          />

          {/* Quick autocomplete chips */}
          {existingCustomers.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-stone-400">Hurtigvalg:</span>
              {existingCustomers.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCustomerName(name)}
                  className="text-xs px-2.5 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quantity & Quick Chips */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Antal prints *
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 5, 10, 12, 20, 38].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleQuantityChange(num)}
                  className={`text-xs px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                    quantity === num
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <input
            type="number"
            min="1"
            max="2000"
            required
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-base font-bold focus:outline-hidden focus:border-stone-500 tabular-nums"
          />
        </div>

        {/* Contact Group toggle */}
        <div className="p-3 rounded-xl bg-stone-50/80 border border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-stone-600" />
            <div>
              <div className="text-xs font-semibold text-stone-800">
                Kontaktgruppe
              </div>
              <div className="text-[11px] text-stone-500">
                Låser automatisk prisen til fast 5,00 kr./stk uanset antal
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isContactGroup}
              onChange={(e) => handleContactGroupToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5.5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-stone-900"></div>
          </label>
        </div>

        {/* Unit Price & Total live price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                Pris pr. stk (kr.)
              </label>
              {isManualPrice && (
                <button
                  type="button"
                  onClick={resetToAutoPrice}
                  className="text-[10px] text-stone-600 hover:text-stone-900 underline flex items-center gap-0.5 cursor-pointer"
                  title="Nulstil til auto-udregnet takst"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Auto
                </button>
              )}
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="F.eks. 4,7 eller 5"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-stone-900 text-sm font-bold focus:outline-hidden focus:border-stone-500 tabular-nums ${
                isManualPrice
                  ? 'border-amber-400 bg-amber-50/20'
                  : 'border-stone-300'
              }`}
            />
            <span className="text-[10px] text-stone-400 mt-0.5 block">
              {isManualPrice ? 'Manuel pris (f.eks. 4,7)' : 'Auto takst'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Pris i alt
            </label>
            <div className="w-full px-3.5 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-900 text-base sm:text-lg font-bold tabular-nums flex items-center justify-between">
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <span className="text-[10px] text-stone-400 mt-0.5 block">
              {quantity} stk × {parsedUnitPrice.toString().replace('.', ',')} kr.
            </span>
          </div>
        </div>

        {/* Payment Status Toggle (Ja / Nej) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Betalingsstatus *
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIsPaid(true)}
              className={`py-2.5 px-3 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isPaid
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ja (Betalt)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPaid(false)}
              className={`py-2.5 px-3 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !isPaid
                  ? 'bg-rose-800 text-white border-rose-800 shadow-2xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Nej (Udestående)</span>
            </button>
          </div>
        </div>

        {/* Toner Section - Single or Streamlined Mid-Order Split */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Toner-forbrug</span>
            </label>

            {quantity > 1 && (
              <button
                type="button"
                onClick={() => {
                  const nextSplit = !isSplitToner;
                  setIsSplitToner(nextSplit);
                  if (nextSplit) {
                    setPrintsOnFirstToner(Math.max(1, Math.min(14, quantity - 1)));
                  }
                }}
                className={`text-xs px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                  isSplitToner
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Split className="w-3 h-3" />
                <span>{isSplitToner ? 'Patronskift aktivt' : 'Løb toneren tør midt i?'}</span>
              </button>
            )}
          </div>

          {!isSplitToner ? (
            /* Standard Single Toner */
            <div>
              <select
                value={selectedTonerId}
                onChange={(e) => setSelectedTonerId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
              >
                {toners
                  .filter((t) => t.status === 'active' || t.status === 'ready')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.status === 'active' ? '(Aktiv i printer)' : '(Klar på lager)'} — {t.printedCount} print hidtil
                    </option>
                  ))}
                {toners.every((t) => t.status === 'finished') &&
                  toners.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.printedCount} print
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            /* Streamlined Mid-Order Split */
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                {/* Step 1: First toner (ran empty) */}
                <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">1. Gammel patron</span>
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                      Løb tør
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-700 truncate">
                    {toners.find((t) => t.id === selectedTonerId)?.name || 'Nuværende toner'}
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      Prints før den løb tør:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max={quantity - 1}
                        value={printsOnFirstToner}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setPrintsOnFirstToner(Math.max(1, Math.min(val, quantity - 1)));
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 tabular-nums focus:outline-hidden focus:border-indigo-500"
                      />
                      <span className="text-xs font-semibold text-slate-500">stk</span>
                    </div>
                  </div>
                </div>

                {/* Step 2: Second toner (gets remainder) */}
                <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-2xs space-y-2 ring-1 ring-emerald-300/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">2. Ny patron</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Resten ({quantity - printsOnFirstToner} stk)
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      Vælg ny patron:
                    </label>
                    <select
                      value={secondTonerChoice}
                      onChange={(e) => setSecondTonerChoice(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                    >
                      {readyToners.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Fra lager)
                        </option>
                      ))}
                      <option value="NEW_TONER">
                        ✨ {nextSequentialName} (Ny patron)
                      </option>
                    </select>
                  </div>

                  <div className="text-[11px] text-emerald-800 font-medium">
                    Får automatisk de resterende <b>{quantity - printsOnFirstToner} prints</b>.
                  </div>
                </div>
              </div>

              {/* Auto-retire & activate checkbox */}
              <label className="flex items-center gap-2 p-2 bg-indigo-50/70 rounded-xl border border-indigo-100 cursor-pointer text-xs font-medium text-indigo-900">
                <input
                  type="checkbox"
                  checked={autoRetireFirstToner}
                  onChange={(e) => setAutoRetireFirstToner(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  Marker automatisk den gamle patron som <b>Færdig</b> og gør den nye patron <b>Aktiv</b>
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Date and Notes */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Dato</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs font-medium focus:outline-hidden focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Noter (valgfrit)
            </label>
            <input
              type="text"
              placeholder="F.eks. Vennerabat, MobilePay..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs focus:outline-hidden focus:border-stone-500"
            />
          </div>
        </div>

        {/* Submit & Cancel */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 text-xs font-semibold rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            Annuller
          </button>
          <button
            type="submit"
            className="flex-2 py-3 px-4 text-xs font-medium rounded-xl text-stone-100 bg-stone-900 hover:bg-stone-800 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
          >
            Gem & opret ordre ({formatCurrency(totalPrice)})
          </button>
        </div>
      </form>
    </div>
  );
}

export const QuickAddOrderModal: React.FC<QuickAddOrderModalProps> = ({
  isOpen,
  onClose,
  initialQuantity,
  initialIsContactGroup,
  initialCustomerName,
  initialUnitPrice,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <QuickAddFormInner
        onClose={onClose}
        initialQuantity={initialQuantity}
        initialIsContactGroup={initialIsContactGroup}
        initialCustomerName={initialCustomerName}
        initialUnitPrice={initialUnitPrice}
      />
    </div>
  );
};
