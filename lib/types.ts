export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "renter" | "host" | "both";
  verifiedEmail: boolean;
}

export interface Listing {
  id: string;
  hostId: string;
  title: string;
  description: string;
  spaceType: string;
  areaLabel: string;
  approxLatLng?: { lat: number; lng: number };
  fullAddressPrivate: string;
  sizeM2: number;
  fits: string[];
  accessType: "24_7" | "scheduled";
  accessHoursText?: string;
  rulesAllowed: string[];
  rulesNotAllowed: string[];
  amenities: string[];
  priceDaily: number;
  priceWeekly?: number;
  priceMonthly?: number;
  photos: string[];
  status: "active" | "pending_review" | "suspended";
  createdAt: string;
}

export interface AvailabilityBlock {
  id: string;
  listingId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface Booking {
  id: string;
  listingId: string;
  renterId: string;
  hostId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: "pending_payment" | "confirmed" | "cancelled" | "completed" | "refunded" | "disputed";
  paymentProvider: "mercadopago";
  createdAt: string;
}

export interface Conversation {
  id: string;
  bookingId: string;
  participants: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Report {
  id: string;
  bookingId?: string;
  listingId?: string;
  reporterId: string;
  reason: string;
  details?: string;
  createdAt: string;
  status: "pending" | "reviewed" | "resolved";
}
export interface MessageData {
  id: string;
  bookingId: string;
  senderId: string;
  text: string;
  createdAt: string;
}