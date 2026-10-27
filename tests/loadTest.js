// ---------------------------------------------------------------------------
// TicketFlow — Concurrency & Race Condition Load Test
// ---------------------------------------------------------------------------
// SCENARIO:
//   An event has EXACTLY 1 ticket available.
//   10 concurrent users (each with a unique JWT session) attempt to reserve
//   that single ticket at the exact same millisecond using Promise.all().
//
// EXPECTED BEHAVIOR:
//   - Exactly 1 request succeeds (HTTP 201 Created).
//   - Exactly 9 requests fail with HTTP 409 Conflict (Tickets sold out).
//   - The event's availableTickets count drops from 1 to 0 (never negative).
//   - Zero race conditions, zero overselling.
// ---------------------------------------------------------------------------

let axios;
try {
  axios = require('axios');
} catch (err) {
  // Graceful fallback to built-in fetch if axios is not installed in current directory
  console.log('ℹ️  Using Node.js native fetch (Axios not found locally)');
}

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const RUN_ID = Date.now().toString().slice(-6);

// Helper for HTTP requests (supports both axios and fetch)
async function request(method, url, data = null, headers = {}) {
  const fullUrl = `${BASE_URL}${url}`;
  if (axios) {
    try {
      const res = await axios({ method, url: fullUrl, data, headers });
      return { status: res.status, data: res.data };
    } catch (err) {
      if (err.response) {
        return { status: err.response.status, data: err.response.data };
      }
      throw err;
    }
  } else {
    const res = await fetch(fullUrl, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: data ? JSON.stringify(data) : undefined,
    });
    const resData = await res.json().catch(() => ({}));
    return { status: res.status, data: resData };
  }
}

async function runConcurrencyTest() {
  console.log('\n===============================================================');
  console.log('       🎟️  TICKETFLOW CONCURRENCY LOAD TEST (RACE CONDITION)    ');
  console.log('===============================================================\n');
  console.log(`📡 Target API: ${BASE_URL}`);

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Register Organizer & Create a Limited Event (Capacity = 1)
    // -------------------------------------------------------------------------
    console.log('\n[1/4] Setting up test event with EXACTLY 1 ticket available...');

    const organizerEmail = `organizer_${RUN_ID}@ticketflow.test`;
    const regOrgRes = await request('POST', '/auth/register', {
      name: `Test Organizer ${RUN_ID}`,
      email: organizerEmail,
      password: 'Password123!',
      role: 'Organizer',
    });

    let organizerToken = regOrgRes.data?.data?.token;
    if (!organizerToken) {
      // If already registered, attempt login
      const loginOrgRes = await request('POST', '/auth/login', {
        email: organizerEmail,
        password: 'Password123!',
      });
      organizerToken = loginOrgRes.data?.data?.token;
    }

    if (!organizerToken) {
      throw new Error(`Failed to authenticate organizer: ${JSON.stringify(regOrgRes.data)}`);
    }

    // Tomorrow date in ISO format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const eventPayload = {
      title: `Flash Sale Concurrency Event #${RUN_ID}`,
      description: 'Single exclusive VIP ticket load test',
      date: tomorrow.toISOString(),
      price: 999,
      totalCapacity: 1, // Only 1 ticket exists!
    };

    const eventRes = await request('POST', '/events', eventPayload, {
      Authorization: `Bearer ${organizerToken}`,
    });

    if (eventRes.status !== 201 || !eventRes.data?.data?._id) {
      throw new Error(`Failed to create test event: ${JSON.stringify(eventRes.data)}`);
    }

    const eventId = eventRes.data.data._id;
    console.log(`   ✓ Created Event ID: ${eventId}`);
    console.log(`   ✓ Initial Total Capacity: 1`);
    console.log(`   ✓ Initial Available Tickets: 1`);

    // -------------------------------------------------------------------------
    // STEP 2: Create 10 Distinct Attendee Users (to simulate concurrent buyers)
    // -------------------------------------------------------------------------
    console.log('\n[2/4] Provisioning 10 concurrent attendee accounts & JWT sessions...');

    const attendees = [];
    for (let i = 1; i <= 10; i++) {
      const email = `buyer_${RUN_ID}_${i}@ticketflow.test`;
      const regRes = await request('POST', '/auth/register', {
        name: `Concurrent Buyer ${i}`,
        email,
        password: 'Password123!',
        role: 'Attendee',
      });

      const token = regRes.data?.data?.token;
      if (!token) {
        throw new Error(`Failed to provision buyer #${i}: ${JSON.stringify(regRes.data)}`);
      }
      attendees.push({ id: i, email, token });
    }
    console.log(`   ✓ Successfully authenticated 10 independent attendees with JWT tokens.`);

    // -------------------------------------------------------------------------
    // STEP 3: Fire 10 Concurrent Requests Simultaneously via Promise.all()
    // -------------------------------------------------------------------------
    console.log('\n[3/4] ⚡ FIRING 10 CONCURRENT RESERVATION REQUESTS SIMULTANEOUSLY...');
    console.log('   All 10 users are requesting POST /api/tickets/reserve at the exact same millisecond...');

    const timestampBefore = Date.now();

    // Map each attendee to a reservation promise
    const reservationPromises = attendees.map((attendee) =>
      request(
        'POST',
        '/tickets/reserve',
        { eventId },
        { Authorization: `Bearer ${attendee.token}` }
      ).then((res) => ({
        attendeeId: attendee.id,
        status: res.status,
        success: res.data?.success || false,
        message: res.data?.message || '',
        reservationId: res.data?.data?._id || null,
      }))
    );

    // Execute concurrently
    const results = await Promise.all(reservationPromises);
    const durationMs = Date.now() - timestampBefore;

    console.log(`   ✓ All 10 requests completed in ${durationMs}ms.\n`);

    // -------------------------------------------------------------------------
    // STEP 4: Analyze Results & Assert Optimistic Lock Correctness
    // -------------------------------------------------------------------------
    console.log('[4/4] Concurrency Results Summary:');
    console.log('---------------------------------------------------------------');
    console.log('Buyer #   | Status Code | Outcome   | Message');
    console.log('---------------------------------------------------------------');

    let successCount = 0;
    let conflictCount = 0;
    let otherCount = 0;
    let winnerId = null;

    results.forEach((r) => {
      const isSuccess = r.status === 201;
      const isConflict = r.status === 409;
      if (isSuccess) {
        successCount++;
        winnerId = r.attendeeId;
      } else if (isConflict) {
        conflictCount++;
      } else {
        otherCount++;
      }

      const outcome = isSuccess ? '✅ SUCCESS' : isConflict ? '❌ BLOCKED' : '⚠️ OTHER';
      const cleanMsg = (r.message || '').slice(0, 32);
      console.log(
        `Buyer ${String(r.attendeeId).padEnd(4)} | ` +
        `HTTP ${r.status}  | ` +
        `${outcome.padEnd(9)} | ` +
        `${cleanMsg}`
      );
    });
    console.log('---------------------------------------------------------------');

    // Verify DB state
    const verifyRes = await request('GET', `/events/${eventId}`);
    const remainingTickets = verifyRes.data?.data?.availableTickets;

    console.log('\n📊 FINAL ASSERTION & AUDIT:');
    console.log(`   - Successful Reservations: ${successCount} (Expected: 1)`);
    console.log(`   - Rejected Requests (409): ${conflictCount} (Expected: 9)`);
    console.log(`   - Other / Errors:          ${otherCount} (Expected: 0)`);
    console.log(`   - Remaining Tickets in DB: ${remainingTickets} (Expected: 0)`);

    if (successCount === 1 && conflictCount === 9 && remainingTickets === 0) {
      console.log('\n🏆 TEST PASSED: ZERO RACE CONDITIONS DETECTED!');
      console.log(`   Attendee #${winnerId} acquired the ticket atomically.`);
      console.log('   The other 9 concurrent attempts were safely rejected without overselling.\n');
      process.exit(0);
    } else {
      console.error('\n🚨 TEST FAILED: Concurrency violation or unexpected response!');
      if (successCount > 1) {
        console.error(`   CRITICAL: Overselling occurred! ${successCount} tickets were reserved.`);
      }
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Unexpected error running concurrency load test:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runConcurrencyTest();
