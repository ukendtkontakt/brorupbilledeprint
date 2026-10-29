import { CostSettings, KpiData, Order } from '@/types';

/**
 * Standard Tier Prices according to specification:
 * - 1 stk: 8 kr./stk
 * - 3 stk: 7 kr./stk
 * - 5 stk: 6 kr./stk
 * - 10 stk: 5,5 kr./stk
 * - >=20 stk: 5 kr./stk
 * - Kontaktgruppe: Fast 5 kr./stk uanset antal
 */
export function getStandardUnitPrice(quantity: number, isContactGroup: boolean): number {
  if (isContactGroup) {
    return 5.0;
  }

  const qty = Math.max(1, Math.floor(quantity || 1));
  if (qty >= 20) return 5.0;
  if (qty >= 10) return 5.5;
  if (qty >= 5) return 6.0;
  if (qty >= 3) return 7.0;
  return 8.0;
}

/**
 * Calculates cost per print (slid/materiale)
 * Formula: ((paperPackPrice * packsPerPurchase) + shippingPrice) / (packsPerPurchase * printsPerPack)
 * Default: ((170 * 2) + 39) / (2 * 108) = 379 / 216 = 1.7546296 kr.
 */
export function calculateCostPerPrint(settings: CostSettings): number {
  const totalCost = (settings.paperPackPrice * settings.packsPerPurchase) + settings.shippingPrice;
  const totalPrints = settings.packsPerPurchase * settings.printsPerPack;
  if (totalPrints <= 0) return 0;
  return totalCost / totalPrints;
}

/**
 * Calculates all KPIs for the dashboard
 */
export function calculateKpis(orders: Order[], settings: CostSettings): KpiData {
  const costPerPrint = calculateCostPerPrint(settings);

  let totalRevenue = 0;
  let outstandingAmount = 0;
  let unpaidOrdersCount = 0;
  let totalPrints = 0;

  for (const order of orders) {
    totalRevenue += order.totalPrice;
    totalPrints += order.quantity;
    if (!order.isPaid) {
      outstandingAmount += order.totalPrice;
      unpaidOrdersCount += 1;
    }
  }

  const paidRevenue = totalRevenue - outstandingAmount;
  const totalWearCost = totalPrints * costPerPrint;
  const profitMinusWear = totalRevenue - totalWearCost;

  // Del af printer der mangler at blive betalt af: Printer pris - Profit minus slid
  const printerCost = settings.printerCost;
  const printerRemainingCost = Math.max(0, printerCost - profitMinusWear);
  const printerPayoffPercentage = printerCost > 0
    ? Math.min(100, Math.max(0, (profitMinusWear / printerCost) * 100))
    : 100;

  return {
    totalRevenue,
    outstandingAmount,
    unpaidOrdersCount,
    totalPrints,
    costPerPrint,
    totalWearCost,
    profitMinusWear,
    printerCost,
    printerRemainingCost,
    printerPayoffPercentage,
    paidRevenue,
  };
}

/**
 * Format Danish currency with "kr."
 */
export function formatCurrency(amount: number, options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}): string {
  const minDigits = options.minimumFractionDigits ?? 2;
  const maxDigits = options.maximumFractionDigits ?? 2;

  const formatted = new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  }).format(amount);

  return `${formatted} kr.`;
}

/**
 * Format general numbers with Danish locale
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
