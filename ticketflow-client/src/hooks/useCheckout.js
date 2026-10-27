// ---------------------------------------------------------------------------
// TicketFlow — Razorpay Checkout Hook
// ---------------------------------------------------------------------------
// Custom hook that encapsulates the complete Razorpay checkout flow:
//
//   1. loadRazorpayScript()  → Dynamically loads Razorpay checkout.js into DOM
//   2. POST /api/tickets/reserve → Atomic inventory lock (10-min TTL reservation)
//   3. POST /api/payments/create-order → Creates Razorpay order from reservation
//   4. window.Razorpay(options).open() → Launches Razorpay checkout modal
//   5. On success → navigates to /booking-success with ticket details
//
// IDEMPOTENCY:
//   The hook guards against double-clicks via `processing` state lock.
//   If the user already has a pending reservation (409 response), it reuses
//   that reservationId to create the Razorpay order.
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

// ---------------------------------------------------------------------------
// Dynamically load Razorpay checkout script (cached via script tag check)
// ---------------------------------------------------------------------------
const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () =>
        reject(new Error('Failed to load Razorpay SDK'))
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
};

// ---------------------------------------------------------------------------
// useCheckout — Custom Hook
// ---------------------------------------------------------------------------
export const useCheckout = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('idle'); // idle | reserving | creating-order | paying
  const processingRef = useRef(false); // Ref guard for strict mode double-invoke
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Initiate the full checkout flow for a given event.
   *
   * @param {string} eventId - MongoDB ObjectId of the event
   * @param {object} eventDetails - { title, price } for Razorpay modal display
   */
  const initiateCheckout = useCallback(
    async (eventId, eventDetails = {}) => {
      // Guard: prevent concurrent checkouts
      if (processingRef.current) return;
      processingRef.current = true;
      setProcessing(true);
      setError(null);

      try {
        // -------------------------------------------------------------------
        // Step 1: Load Razorpay checkout.js
        // -------------------------------------------------------------------
        setStep('reserving');
        await loadRazorpayScript();

        // -------------------------------------------------------------------
        // Step 2: Reserve the ticket (atomic inventory decrement)
        // -------------------------------------------------------------------
        let reservationId;

        try {
          const reserveRes = await API.post('/tickets/reserve', {
            eventId,
            quantity: eventDetails.quantity || 1,
          });
          reservationId = reserveRes.data.data.reservationId;
        } catch (reserveErr) {
          // 409 = user already has a pending reservation → reuse it
          if (
            reserveErr.response?.status === 409 &&
            reserveErr.response?.data?.data?.reservationId
          ) {
            reservationId = reserveErr.response.data.data.reservationId;
          } else {
            throw new Error(
              reserveErr.response?.data?.message || 'Failed to reserve ticket'
            );
          }
        }

        // -------------------------------------------------------------------
        // Step 3: Create Razorpay order from the reservation
        // -------------------------------------------------------------------
        setStep('creating-order');
        const orderRes = await API.post('/payments/create-order', {
          reservationId,
        });

        const { order_id, amount, currency, key_id } = orderRes.data.data;

        // -------------------------------------------------------------------
        // Step 4: Open Razorpay checkout modal
        // -------------------------------------------------------------------
        setStep('paying');

        const options = {
          key: key_id,
          amount,
          currency,
          name: 'TicketFlow',
          description: eventDetails.title || 'Event Ticket Purchase',
          order_id,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#7c3aed', // Brand violet
          },
          // -----------------------------------------------------------------
          // Success Handler (client-side confirmation)
          // NOTE: The actual ticket issuance is handled server-side by the
          // Razorpay webhook (POST /api/webhooks/razorpay). This handler
          // only provides immediate UX feedback to the user.
          // -----------------------------------------------------------------
          handler: async (response) => {
            try {
              // Optionally confirm via the legacy client-side endpoint
              await API.post('/tickets/confirm', {
                reservationId,
                razorpayOrderId: response.razorpay_order_id,
              });
            } catch {
              // If client-side confirm fails, the webhook will still handle it.
              // This is a non-critical failure — ticket issuance is guaranteed
              // by the server-side webhook.
              console.warn(
                'Client-side confirmation failed — webhook will handle fulfillment'
              );
            }

            // Navigate to success page
            navigate('/booking-success', {
              state: {
                eventTitle: eventDetails.title,
                eventDate: eventDetails.date,
                amount: amount / 100,
                quantity: eventDetails.quantity || 1,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
              },
            });
          },
          // -----------------------------------------------------------------
          // Modal Dismiss Handler
          // -----------------------------------------------------------------
          modal: {
            ondismiss: () => {
              setError('Payment was cancelled. Your reservation is still active for 10 minutes.');
              setStep('idle');
              setProcessing(false);
              processingRef.current = false;
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);

        // Handle payment failure events from Razorpay
        razorpayInstance.on('payment.failed', (failResponse) => {
          setError(
            failResponse.error?.description ||
              'Payment failed. Please try again.'
          );
          setStep('idle');
          setProcessing(false);
          processingRef.current = false;
        });

        razorpayInstance.open();
      } catch (err) {
        console.error('Checkout error:', err);
        setError(err.message || 'An error occurred during checkout');
        setStep('idle');
        setProcessing(false);
        processingRef.current = false;
      }
    },
    [navigate, user]
  );

  // Reset state for retries
  const resetCheckout = useCallback(() => {
    setProcessing(false);
    setError(null);
    setStep('idle');
    processingRef.current = false;
  }, []);

  return {
    initiateCheckout,
    resetCheckout,
    processing,
    error,
    step,
  };
};

export default useCheckout;
