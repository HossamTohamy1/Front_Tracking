// ── DTOs matching backend CostCalculationDto ─────────────────────────────────

export interface CostCalculationDto {
  id: string;
  importRequestId: string;
  requestNumber?: string;
  customerName?: string;

  // Shipment snapshot
  weightKg: number;
  volumeCbm: number;

  // Cost components
  baseShippingCost: number;
  customsDuty: number;
  taxAmount: number;
  insuranceCost: number;
  handlingFee: number;
  otherFees: number;
  discountAmount: number;

  // Totals
  totalBeforeDiscount: number;
  finalAmount: number;

  currency: string;
  notes?: string;

  isLocked?: boolean; // true after payment completed
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateCostCalculationRequest {
  baseShippingCost: number;
  customsDuty: number;
  taxAmount: number;
  insuranceCost: number;
  handlingFee: number;
  otherFees?: number;
  currency?: string;
  notes?: string;
}

export interface UpdateDiscountRequest {
  discountAmount: number;
  notes?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
