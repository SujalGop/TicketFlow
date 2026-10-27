const Event = require('../models/Event');
const { asyncHandler } = require('../utils/helpers');

// ---------------------------------------------------------------------------
// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Organizer only)
// ---------------------------------------------------------------------------
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, date, totalCapacity, price } = req.body;

  const event = await Event.create({
    organizerId: req.user._id,
    title,
    description,
    date,
    price,
    totalCapacity,
    availableTickets: totalCapacity, // Initialize available = total
  });

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: event,
  });
});

// ---------------------------------------------------------------------------
// @desc    Get all upcoming events with available tickets
// @route   GET /api/events
// @access  Public
// ---------------------------------------------------------------------------
const getEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({
    date: { $gt: new Date() },       // Only future events
    availableTickets: { $gt: 0 },     // Only events with tickets left
  })
    .populate('organizerId', 'name email') // Include organizer info
    .sort({ date: 1 });                    // Soonest first

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

// ---------------------------------------------------------------------------
// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
// ---------------------------------------------------------------------------
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate(
    'organizerId',
    'name email'
  );

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found',
    });
  }

  res.status(200).json({
    success: true,
    data: event,
  });
});

// ---------------------------------------------------------------------------
// @desc    Get events created by the logged-in organizer
// @route   GET /api/events/my-events
// @access  Private (Organizer only)
// ---------------------------------------------------------------------------
const getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ organizerId: req.user._id }).sort({
    date: -1,
  });

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

module.exports = { createEvent, getEvents, getEventById, getMyEvents };
