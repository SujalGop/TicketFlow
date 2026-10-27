const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  getMyEvents,
} = require('../controllers/eventController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', getEvents);

// Protected routes — must come before /:id to avoid "my-events" being parsed as an ID
router.get('/my-events', protect, authorizeRoles('Organizer'), getMyEvents);

// Public route — single event
router.get('/:id', getEventById);

// Protected + Organizer only
router.post('/', protect, authorizeRoles('Organizer'), createEvent);

module.exports = router;
