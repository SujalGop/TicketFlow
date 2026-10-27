const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: 'Event date must be in the future',
      },
    },
    price: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: [0, 'Price cannot be negative'],
    },
    totalCapacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    availableTickets: {
      type: Number,
      required: true,
      min: [0, 'Available tickets cannot be negative'],
    },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Index: efficiently query upcoming events with available tickets
// ---------------------------------------------------------------------------
eventSchema.index({ date: 1, availableTickets: 1 });

module.exports = mongoose.model('Event', eventSchema);
