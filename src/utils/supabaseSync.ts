import { CostSettings, Order, Toner } from '@/types';

export interface DbOrder {
  id: string;
  customer_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_paid: boolean;
  is_contact_group: boolean;
  toner_name_text: string;
  toner_breakdown?: unknown;
  date: string;
  notes?: string;
  created_at: number;
}

export interface DbToner {
  id: string;
  name: string;
  status: string;
  printed_count: number;
  capacity: number;
  notes?: string;
}

export interface DbSettings {
  id: string;
  paper_pack_price: number;
  prints_per_pack: number;
  packs_per_purchase: number;
  shipping_price: number;
  printer_cost: number;
}

export function dbOrderToOrder(row: DbOrder): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
    isPaid: Boolean(row.is_paid),
    isContactGroup: Boolean(row.is_contact_group),
    tonerNameText: row.toner_name_text || '',
    tonerBreakdown: Array.isArray(row.toner_breakdown) ? row.toner_breakdown : undefined,
    date: row.date,
    notes: row.notes || '',
    createdAt: Number(row.created_at) || Date.now(),
  };
}

export function orderToDbOrder(order: Order): DbOrder {
  return {
    id: order.id,
    customer_name: order.customerName,
    quantity: order.quantity,
    unit_price: order.unitPrice,
    total_price: order.totalPrice,
    is_paid: order.isPaid,
    is_contact_group: order.isContactGroup,
    toner_name_text: order.tonerNameText,
    toner_breakdown: order.tonerBreakdown || [],
    date: order.date,
    notes: order.notes || '',
    created_at: order.createdAt,
  };
}

export function dbTonerToToner(row: DbToner): Toner {
  return {
    id: row.id,
    name: row.name,
    status: row.status as Toner['status'],
    printedCount: Number(row.printed_count) || 0,
    capacity: Number(row.capacity) || 108,
    notes: row.notes || '',
  };
}

export function tonerToDbToner(toner: Toner): DbToner {
  return {
    id: toner.id,
    name: toner.name,
    status: toner.status,
    printed_count: toner.printedCount,
    capacity: toner.capacity,
    notes: toner.notes || '',
  };
}

export function dbSettingsToSettings(row: DbSettings): CostSettings {
  return {
    paperPackPrice: Number(row.paper_pack_price),
    printsPerPack: Number(row.prints_per_pack),
    packsPerPurchase: Number(row.packs_per_purchase),
    shippingPrice: Number(row.shipping_price),
    printerCost: Number(row.printer_cost),
  };
}

export function settingsToDbSettings(settings: CostSettings): DbSettings {
  return {
    id: 'default',
    paper_pack_price: settings.paperPackPrice,
    prints_per_pack: settings.printsPerPack,
    packs_per_purchase: settings.packsPerPurchase,
    shipping_price: settings.shippingPrice,
    printer_cost: settings.printerCost,
  };
}
