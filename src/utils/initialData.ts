import { CostSettings, Order, Toner } from '@/types';

export const DEFAULT_SETTINGS: CostSettings = {
  paperPackPrice: 170, // Pris for 108-print pakke: 170 kr.
  printsPerPack: 108,  // 108 prints pr. pakke
  packsPerPurchase: 2, // Køb af 2 pakker
  shippingPrice: 39,   // Fragt: 39 kr.
  printerCost: 1000,   // Printer startpris: 1000 kr.
};

export const DEFAULT_TONERS: Toner[] = [
  {
    id: 'toner-1',
    name: 'Toner 1',
    status: 'finished',
    printedCount: 4,
    capacity: 108,
    notes: 'Brugt til Folke (4 prints) - Færdig nu',
  },
  {
    id: 'toner-2',
    name: 'Toner 2',
    status: 'active',
    printedCount: 17,
    capacity: 108,
    notes: 'Aktiv patron. Indeholder Folke (2), Teng (1), Teng (12), Johannes (2)',
  },
  {
    id: 'toner-3',
    name: 'Toner 3',
    status: 'ready',
    printedCount: 0,
    capacity: 108,
    notes: 'Klar i reserve',
  },
  {
    id: 'toner-4',
    name: 'Toner 4',
    status: 'ready',
    printedCount: 0,
    capacity: 108,
    notes: 'Klar i reserve',
  },
];

export const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord-1',
    customerName: 'Folke',
    quantity: 6,
    unitPrice: 5.0,
    totalPrice: 30.0,
    isPaid: false, // Rød (Mangler)
    isContactGroup: true,
    tonerNameText: 'Toner 1 (4 stk) / Toner 2 (2 stk)',
    tonerBreakdown: [
      { tonerId: 'toner-1', count: 4 },
      { tonerId: 'toner-2', count: 2 },
    ],
    date: '2026-10-24',
    notes: '4 prints på Toner 1 før skift, 2 prints på Toner 2',
    createdAt: 1729760000000,
  },
  {
    id: 'ord-2',
    customerName: 'Teng',
    quantity: 1,
    unitPrice: 0.0,
    totalPrice: 0.0,
    isPaid: true, // Grøn
    isContactGroup: false,
    tonerNameText: 'Toner 2 (1 stk)',
    tonerBreakdown: [
      { tonerId: 'toner-2', count: 1 },
    ],
    date: '2026-10-25',
    notes: 'Prøveprint / vennetjeneste',
    createdAt: 1729846400000,
  },
  {
    id: 'ord-3',
    customerName: 'Teng',
    quantity: 12,
    unitPrice: 3.0,
    totalPrice: 36.0,
    isPaid: true, // Grøn
    isContactGroup: false,
    tonerNameText: 'Toner 2 (12 stk)',
    tonerBreakdown: [
      { tonerId: 'toner-2', count: 12 },
    ],
    date: '2026-10-26',
    notes: 'Særpris aftalt (3 kr./stk)',
    createdAt: 1729932800000,
  },
  {
    id: 'ord-4',
    customerName: 'Johannes',
    quantity: 2,
    unitPrice: 3.5,
    totalPrice: 7.0,
    isPaid: true, // Grøn
    isContactGroup: false,
    tonerNameText: 'Toner 2 (2 stk)',
    tonerBreakdown: [
      { tonerId: 'toner-2', count: 2 },
    ],
    date: '2026-10-27',
    notes: 'Specialpris (3,5 kr./stk)',
    createdAt: 1730019200000,
  },
];
