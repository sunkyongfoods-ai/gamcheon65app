export type ProductType = 'mackerel' | 'squid';
export type CalculationType = 'auction' | 'warehouse';
export type MackerelBaitBoxWeight = 10 | 15 | 20;

export interface CalculatorInput {
  productType: ProductType;
  calculationType: CalculationType;
  mackerelBaitBoxWeight: MackerelBaitBoxWeight;
  boxCount: string; // Represents original boxes, PANs, or final boxes depending on context
  unitPrice: string;
}

export interface CalculatorResult {
  totalFinalUnits: number;
  costPerFinalUnit: number;
  finalUnitName: string; // '베이트박스' or 'PAN'
  dailyStorageFee: number;
}

export interface CostBreakdown {
  rawPurchasePrice: number;
  purchaseCommission: number;
  totalOnSiteCost: number;
  totalWarehouseCost: number;
  grandTotalCost: number;
}
