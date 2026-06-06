export type RequestStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Processing'
  | 'Shipped'
  | 'Customs'
  | 'OutForDelivery'
  | 'Delivered'
  | 'Cancelled';

export type ShipmentType = 'FullContainer' | 'LCL';

export interface ImportRequestListDto {
  id: string;
  userId: string;
  productId: string;
  productName?: string;
  assignedOfficeId?: string;
  assignedOfficeName?: string;
  quantity: number;
  totalWeightKg: number;
  totalVolumeCbm: number;
  shipmentType: ShipmentType;
  status: RequestStatus;
  shippingAddress: string;
  requestedDeliveryDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ImportRequestDto extends ImportRequestListDto {
  specialInstructions?: string;
  rejectionReason?: string;
  tracking?: {
    id: string;
    currentStage: string;
    trackingNumber?: string;
    carrierName?: string;
    currentLocation?: string;
    estimatedDeliveryDate?: string;
  };
  costCalculation?: {
    id: string;
    finalAmount: number;
    currency: string;
    baseShippingCost: number;
    customsDuty: number;
    taxAmount: number;
    insuranceCost: number;
    handlingFee: number;
    otherFees: number;
    discountAmount: number;
    totalBeforeDiscount: number;
  };
}

export interface SubmitImportRequestDto {
  productId: string;
  quantity: number;
  shippingAddress: string;
  specialInstructions?: string;
  requestedDeliveryDate?: string;
  shipmentType: ShipmentType; // ← مضاف
}

export interface RejectImportRequestDto {
  rejectionReason: string;
}

export interface AssignOfficeDto {
  officeId: string;
}

export interface UpdateStageDto {
  stage: 'Processing' | 'Shipped' | 'Customs' | 'OutForDelivery' | 'Delivered';
  location?: string;
  notes?: string;
  trackingNumber?: string;
  carrierName?: string;
  estimatedDeliveryDate?: string;
}