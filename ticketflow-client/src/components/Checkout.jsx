// ---------------------------------------------------------------------------
// TicketFlow — Checkout Component
// ---------------------------------------------------------------------------
// Provides the checkout trigger button connected to useCheckout hook.
// ---------------------------------------------------------------------------

import CheckoutButton from './CheckoutButton';

const Checkout = ({ event, quantity = 1, className = '', onComplete }) => {
  return (
    <CheckoutButton
      eventId={event._id || event.id}
      eventTitle={event.title}
      eventDate={event.date}
      price={event.price}
      quantity={quantity}
      availableTickets={event.availableTickets}
      className={className}
      onComplete={onComplete}
    />
  );
};

export default Checkout;
