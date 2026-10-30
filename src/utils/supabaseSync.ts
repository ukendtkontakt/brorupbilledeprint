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
  tier_1_price?: number;
  tier_3_price?: number;
  tier_5_price?: number;
  tier_10_price?: number;
  tier_20_price?: number;
  contact_group_price?: number;
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
    tier1Price: row.tier_1_price !== undefined && row.tier_1_price !== null ? Number(row.tier_1_price) : 8.0,
    tier3Price: row.tier_3_price !== undefined && row.tier_3_price !== null ? Number(row.tier_3_price) : 7.0,
    tier5Price: row.tier_5_price !== undefined && row.tier_5_price !== null ? Number(row.tier_5_price) : 6.0,
    tier10Price: row.tier_10_price !== undefined && row.tier_10_price !== null ? Number(row.tier_10_price) : 5.5,
    tier20Price: row.tier_20_price !== undefined && row.tier_20_price !== null ? Number(row.tier_20_price) : 5.0,
    contactGroupPrice: row.contact_group_price !== undefined && row.contact_group_price !== null ? Number(row.contact_group_price) : 5.0,
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
    tier_1_price: settings.tier1Price ?? 8.0,
    tier_3_price: settings.tier3Price ?? 7.0,
    tier_5_price: settings.tier5Price ?? 6.0,
    tier_10_price: settings.tier10Price ?? 5.5,
    tier_20_price: settings.tier20Price ?? 5.0,
    contact_group_price: settings.contactGroupPrice ?? 5.0,
  };
}
