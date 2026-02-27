import type { Booking, Conversation, Message, Report } from "./types";

export const mockBookings: Booking[] = [
  {
    id: "booking_1",
    listingId: "1",
    renterId: "user_renter_1",
    hostId: "host_1",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    totalAmount: 50000,
    status: "confirmed",
    paymentProvider: "mercadopago",
    createdAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "booking_2",
    listingId: "2",
    renterId: "user_renter_1",
    hostId: "host_1",
    startDate: "2026-02-15",
    endDate: "2026-03-14",
    totalAmount: 15000,
    status: "confirmed",
    paymentProvider: "mercadopago",
    createdAt: "2026-01-25T14:30:00Z",
  },
  {
    id: "booking_3",
    listingId: "3",
    renterId: "user_renter_2",
    hostId: "host_2",
    startDate: "2026-02-10",
    endDate: "2026-02-16",
    totalAmount: 8400,
    status: "pending_payment",
    paymentProvider: "mercadopago",
    createdAt: "2026-01-26T09:15:00Z",
  },
];

export const mockConversations: Conversation[] = [
  {
    id: "conv_1",
    bookingId: "booking_1",
    participants: ["user_renter_1", "host_1"],
  },
  {
    id: "conv_2",
    bookingId: "booking_2",
    participants: ["user_renter_1", "host_1"],
  },
];

export const mockMessages: Message[] = [
  {
    id: "msg_1",
    conversationId: "conv_1",
    senderId: "user_renter_1",
    text: "Hola! Ya confirmé la reserva. ¿A qué hora puedo pasar a dejar el auto?",
    createdAt: "2026-01-20T11:00:00Z",
  },
  {
    id: "msg_2",
    conversationId: "conv_1",
    senderId: "host_1",
    text: "Hola! Podés pasar cuando quieras, el acceso es 24/7. Te paso el código del portón por acá.",
    createdAt: "2026-01-20T11:15:00Z",
  },
  {
    id: "msg_3",
    conversationId: "conv_1",
    senderId: "host_1",
    text: "El código es 1234# para abrir el portón. Cualquier cosa me avisás!",
    createdAt: "2026-01-20T11:16:00Z",
  },
  {
    id: "msg_4",
    conversationId: "conv_2",
    senderId: "user_renter_1",
    text: "Perfecto, muchas gracias! Voy a llevar unas cajas el sábado.",
    createdAt: "2026-01-25T15:00:00Z",
  },
];

export const mockReports: Report[] = [
  {
    id: "report_1",
    bookingId: "booking_1",
    reporterId: "user_renter_1",
    reason: "Intento de coordinación fuera de la plataforma",
    details: "El host intentó coordinar el pago fuera de Doorly",
    createdAt: "2026-01-22T10:00:00Z",
    status: "pending",
  },
];

// Mock action to update booking status
export function updateBookingStatus(bookingId: string, status: Booking["status"]) {
  // TODO: Integrate with Supabase to update booking status
  console.log(`[v0] Updating booking ${bookingId} to status: ${status}`);
  const booking = mockBookings.find(b => b.id === bookingId);
  if (booking) {
    booking.status = status;
  }
}

// Mock action to add a message
export function addMessage(conversationId: string, senderId: string, text: string): Message {
  // TODO: Integrate with Supabase Realtime for live chat
  const newMessage: Message = {
    id: `msg_${Date.now()}`,
    conversationId,
    senderId,
    text,
    createdAt: new Date().toISOString(),
  };
  mockMessages.push(newMessage);
  return newMessage;
}

// Mock action to create a report
export function createReport(data: Omit<Report, "id" | "createdAt" | "status">): Report {
  // TODO: Integrate with Supabase to store reports
  const newReport: Report = {
    id: `report_${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  mockReports.push(newReport);
  return newReport;
}

// Mock action to update listing status (admin)
export function updateListingStatus(listingId: string, status: "active" | "pending_review" | "suspended") {
  // TODO: Integrate with Supabase to update listing status
  console.log(`[v0] Admin updating listing ${listingId} to status: ${status}`);
}
