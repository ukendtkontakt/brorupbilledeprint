export type TonerStatus = 'active' | 'finished' | 'ready';

export interface Toner {
  id: string;
  name: string;
  status: TonerStatus;
  printedCount: number;
  capacity: number; // e.g. 108 prints
  notes?: string;
}

export interface OrderTonerBreakdown {
  tonerId: string;
  count: number;
}

export interface Order {
  id: string;
  customerName: string;
  quantity: number;
  unitPrice: number; // kr. pr. stk
  totalPrice: number; // kr. i alt
  isPaid: boolean;
  isContactGroup: boolean;
  tonerNameText: string; // e.g. "Toner 1 (4 stk) / Toner 2 (2 stk)" or "Toner 2 (1 stk)"
  tonerBreakdown?: OrderTonerBreakdown[];
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: number;
}

export interface CostSettings {
  paperPackPrice: number; // e.g. 170 kr.
  printsPerPack: number; // e.g. 108 prints
  packsPerPurchase: number; // e.g. 2 packs
  shippingPrice: number; // e.g. 39 kr.
  printerCost: number; // e.g. 1000 kr.
  tier1Price?: number; // 1-2 stk
  tier3Price?: number; // 3-4 stk
  tier5Price?: number; // 5-9 stk
  tier10Price?: number; // 10-19 stk
  tier20Price?: number; // 20+ stk
  contactGroupPrice?: number; // fast kontaktgruppe takst
}

export interface KpiData {
  totalRevenue: number; // Omsat
  outstandingAmount: number; // Udestående (Skyldnere)
  unpaidOrdersCount: number;
  totalPrints: number; // Printet i alt
  costPerPrint: number; // Slid/materiale pr. print
  totalWearCost: number; // Samlet slidomkostning
  profitMinusWear: number; // Profit minus slid
  printerCost: number; // Printer startpris (1000 kr.)
  printerRemainingCost: number; // Del af printer der mangler at blive betalt af
  printerPayoffPercentage: number; // 0 - 100%
  paidRevenue: number; // Allerede modtaget
}

export type DashboardWidgetId =
  | 'kpis'
  | 'printer_payoff'
  | 'activity_trend'
  | 'profit_simulator'
  | 'pricing_calculator'
  | 'toner_tracker'
  | 'customer_stats'
  | 'orders_table';

export interface DashboardWidgetConfig {
  id: DashboardWidgetId;
  title: string;
  description: string;
  enabled: boolean;
}
