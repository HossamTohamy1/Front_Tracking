export interface ContainerListItemDto {
  id: string;
  containerNumber: string;
  status: number;
  statusName: string;
  shipmentType: 'LCL' | 'FullContainer';   
  currentWeightKg: number;
  maxWeightKg: number;
  currentVolumeCbm: number;
  maxVolumeCbm: number;
  itemCount: number;
  totalShippingCost: number;
  originPort?: string;
  destinationPort?: string;
  expectedArrival?: string;
  createdAt: string;
}

export interface ContainerItemDto {
  id: string;
  importRequestId: string;
  requestNumber: string;
  weightKg: number;
  volumeCbm: number;
  costShare: number;
  createdAt: string;
}

export interface ContainerDto {
  id: string;
  containerNumber: string;
  status: number;
  statusName: string;
  shipmentType: 'LCL' | 'FullContainer';   
  maxWeightKg: number;
  maxVolumeCbm: number;
  currentWeightKg: number;
  currentVolumeCbm: number;
  weightUtilizationPercent: number;
  volumeUtilizationPercent: number;
  originPort?: string;
  destinationPort?: string;
  shippedAt?: string;
  expectedArrival?: string;
  deliveredAt?: string;
  totalShippingCost: number;
  managedByOfficeId: string;
  managedByOfficeName: string;
  items: ContainerItemDto[];
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface CostShareItemDto {
  containerItemId: string;
  importRequestId: string;
  requestNumber: string;
  volumeCbm: number;
  weightKg: number;
  volumePercentage: number;
  costShare: number;
  customerName: string;
}

export interface ContainerCostBreakdownDto {
  containerId: string;
  containerNumber: string;
  totalShippingCost: number;
  totalVolumeCbm: number;
  items: CostShareItemDto[];
}

export interface CreateContainerDto {
  maxWeightKg: number;
  maxVolumeCbm: number;
  shipmentType: 0 | 1;   
  originPort?: string;
  destinationPort?: string;
  expectedArrival?: string;
}

export interface UpdateContainerDto {
  containerNumber?: string;
  maxWeightKg?: number;
  maxVolumeCbm?: number;
  originPort?: string;
  destinationPort?: string;
  expectedArrival?: string;
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

export const CONTAINER_STATUS = {
  0: 'Open',
  1: 'Closed',
  2: 'Shipped',
  3: 'InTransit',
  4: 'ArrivedPort',
  5: 'Customs',
  6: 'Delivered',
  7: 'Cancelled',
} as const;

export type ContainerStatusKey = keyof typeof CONTAINER_STATUS;