// ── DTOs matching backend PaymentResponseDto exactly ───────────────────────

export interface CreatePaymentIntentRequest {
  importRequestId: string;
  currency?: string; // default USD
}

export interface PaymentIntentResponse {
  paymentId: string;     // maps to Payment.Id stored in DB
  clientSecret: string;  // Stripe client secret to confirm payment
  amount: number;
  currency: string;
  status: string;        // Stripe PaymentIntent status e.g. "requires_payment_method"
}

// Matches Domain.Models.PaymentStatus enum (string serialised)
export type PaymentStatus =
  | 'Pending'
  | 'Processing'
  | 'Completed'
  | 'Failed'
  | 'Refunded'
  | 'Cancelled';

// Matches Domain.Models.PaymentMethod enum (string serialised)
export type PaymentMethod =
  | 'CreditCard'
  | 'DebitCard'
  | 'PayPal'
  | 'BankTransfer'
  | 'Stripe'
  | 'Cash';

// Matches Domain.Models.PaymentPurpose enum (string serialised)
export type PaymentPurpose =
  | 'ImportShipment'
  | 'ContainerShare'
  | 'CustomsDuty'
  | 'PartialDeposit';

// Matches backend PaymentResponseDto
export interface PaymentDto {
  id: string;
  userId: string;
  importRequestId?: string;
  containerId?: string;
  purpose: PaymentPurpose;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  currency: string;
  gatewayTransactionId?: string;
  paidAt?: string;       // ISO date string
  failureReason?: string;
  createdAt: string;     // ISO date string
}