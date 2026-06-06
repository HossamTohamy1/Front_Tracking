// ============================================================
// Auth Types
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'Customer' | 'ImportOffice' | 'Exporter' | 'Admin';
  profilePicture?: string;
  companyName?: string;
  phone?: string;
  country?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  role: 'Customer' | 'ImportOffice' | 'Exporter';
  companyName?: string;
  address?: string;
  country?: string;
}

export interface AuthResponse {
  token: string;
  fullName: string;
  email: string;
  role: string;
  expiresAt: string;
  message?: string;
  id?: string;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data?: T;
  errorCode?: string;
  traceId?: string;
  validationErrors?: Record<string, string[]>;
  timestamp: string;
}

export interface ErrorResponse {
  isSuccess: false;
  message: string;
  errorCode?: string;
  traceId?: string;
  validationErrors?: Record<string, string[]>;
}

// ============================================================
// Shipment/Import Request Types
// ============================================================

export const RequestStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
  Processing: 3,
  Shipped: 4,
  Customs: 5,
  OutForDelivery: 6,
  Delivered: 7,
  Cancelled: 8,
} as const;
export type RequestStatus = typeof RequestStatus[keyof typeof RequestStatus];

export const ShipmentType = {
  FullContainer: 0,
  LCL: 1,
} as const;
export type ShipmentType = typeof ShipmentType[keyof typeof ShipmentType];


export interface ImportRequest {
  id: string;
  userId: string;
  productId: string;
  assignedOfficeId?: string;
  quantity: number;
  totalWeightKg: number;
  totalVolumeCbm: number;
  shipmentType: ShipmentType;
  status: RequestStatus;
  shippingAddress: string;
  specialInstructions?: string;
  rejectionReason?: string;
  requestedDeliveryDate?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================
// Payment Types
// ============================================================

export const PaymentStatus = {
  Pending: 0,
  Processing: 1,
  Completed: 2,
  Failed: 3,
  Refunded: 4,
  Cancelled: 5,
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];


export interface Payment {
  id: string;
  userId: string;
  importRequestId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  createdAt: string;
  paidAt?: string;
}

// ============================================================
// Container Types
// ============================================================

export const ContainerStatus = {
  Open: 0,
  Closed: 1,
  Shipped: 2,
  InTransit: 3,
  ArrivedPort: 4,
  Customs: 5,
  Delivered: 6,
  Cancelled: 7,
} as const;

export type ContainerStatus = typeof ContainerStatus[keyof typeof ContainerStatus];


export interface Container {
  id: string;
  containerNumber: string;
  status: ContainerStatus;
  maxWeightKg: number;
  maxVolumeCbm: number;
  currentWeightKg: number;
  currentVolumeCbm: number;
  originPort?: string;
  destinationPort?: string;
  totalShippingCost: number;
  managedByOfficeId: string;
  createdAt: string;
}

// ============================================================
// Tracking Types
// ============================================================

export const ShipmentStage = {
  Purchased: 0,
  Processing: 1,
  ReadyToShip: 2,
  Shipped: 3,
  InTransit: 4,
  ArrivedPort: 5,
  Customs: 6,
  OutForDelivery: 7,
  Delivered: 8,
  Exception: 9,
} as const;

export type ShipmentStage = typeof ShipmentStage[keyof typeof ShipmentStage];

export interface Tracking {
  id: string;
  importRequestId: string;
  currentStage: ShipmentStage;
  trackingNumber?: string;
  carrierName?: string;
  currentLocation?: string;
  estimatedDeliveryDate?: string;
  shippedAt?: string;
  arrivedPortAt?: string;
  customsClearedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  history: TrackingHistory[];
}

export interface TrackingHistory {
  id: string;
  trackingId: string;
  stage: ShipmentStage;
  description: string;
  location?: string;
  occurredAt: string;
  updatedByUserId?: string;
}

// ============================================================
// Notification Types
// ============================================================

export const NotificationType = {
  ShipmentUpdate: 0,
  PaymentSuccess: 1,
  PaymentFailed: 2,
  NewMessage: 3,
  CustomsUpdate: 4,
  RequestApproved: 5,
  RequestRejected: 6,
  ContainerUpdate: 7,
  General: 8,
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  readAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  createdAt: string;
}

// ============================================================
// Constants
// ============================================================

export const APP_ROLES = {
  Customer: 'Customer',
  ImportOffice: 'ImportOffice',
  Exporter: 'Exporter',
  Admin: 'Admin',
} as const;

export type AppRole = typeof APP_ROLES[keyof typeof APP_ROLES];

export const SHIPMENT_STATUS_LABELS: Record<RequestStatus, string> = {
  [RequestStatus.Pending]: 'Pending',
  [RequestStatus.Approved]: 'Approved',
  [RequestStatus.Rejected]: 'Rejected',
  [RequestStatus.Processing]: 'Processing',
  [RequestStatus.Shipped]: 'Shipped',
  [RequestStatus.Customs]: 'In Customs',
  [RequestStatus.OutForDelivery]: 'Out for Delivery',
  [RequestStatus.Delivered]: 'Delivered',
  [RequestStatus.Cancelled]: 'Cancelled',
};

export const SHIPMENT_STAGE_LABELS: Record<ShipmentStage, string> = {
  [ShipmentStage.Purchased]: 'Purchased',
  [ShipmentStage.Processing]: 'Processing',
  [ShipmentStage.ReadyToShip]: 'Ready to Ship',
  [ShipmentStage.Shipped]: 'Shipped',
  [ShipmentStage.InTransit]: 'In Transit',
  [ShipmentStage.ArrivedPort]: 'Arrived at Port',
  [ShipmentStage.Customs]: 'In Customs',
  [ShipmentStage.OutForDelivery]: 'Out for Delivery',
  [ShipmentStage.Delivered]: 'Delivered',
  [ShipmentStage.Exception]: 'Exception',
};