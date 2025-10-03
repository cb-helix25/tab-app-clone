/**
 * Future Bookings Routes
 * Handles boardroom and soundproof pod bookings from helix-project-data database
 */

const express = require('express');
const router = express.Router();
const { withRequest } = require('../utils/db');

/**
 * GET /api/future-bookings
 * Returns future bookings for boardrooms and soundproof pods
 */
router.get('/', async (req, res) => {
  try {
    console.log('[FutureBookings] Fetching future bookings');

    // Get base connection string and modify for helix-project-data database
    const baseConnectionString = process.env.SQL_CONNECTION_STRING;
    if (!baseConnectionString) {
      console.error('[FutureBookings] SQL_CONNECTION_STRING not configured');
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    // Replace database name in connection string
    const projectDataConnectionString = baseConnectionString.replace(
      /Initial Catalog=helix-core-data/i,
      'Initial Catalog=helix-project-data'
    );

    // Query boardroom bookings
    const boardroomResult = await withRequest(
      projectDataConnectionString,
      async (request) => {
        const query = `
          SELECT id, fee_earner, booking_date, booking_time, duration, reason, created_at, updated_at
          FROM [dbo].[boardroom_bookings]
          WHERE booking_date >= CAST(GETDATE() AS date)
        `;
        return await request.query(query);
      }
    );

    // Query soundproof pod bookings
    const soundproofResult = await withRequest(
      projectDataConnectionString,
      async (request) => {
        const query = `
          SELECT id, fee_earner, booking_date, booking_time, duration, reason, created_at, updated_at
          FROM [dbo].[soundproofpod_bookings]
          WHERE booking_date >= CAST(GETDATE() AS date)
        `;
        return await request.query(query);
      }
    );

    // Format dates properly
    const formatBooking = (booking, spaceType) => ({
      ...booking,
      booking_date: booking.booking_date?.toISOString().substring(0, 10),
      booking_time: booking.booking_time instanceof Date 
        ? booking.booking_time.toISOString().substring(11, 19)
        : booking.booking_time,
      spaceType
    });

    const boardroomBookings = boardroomResult.recordset.map(b => formatBooking(b, 'Boardroom'));
    const soundproofBookings = soundproofResult.recordset.map(b => formatBooking(b, 'Soundproof Pod'));

    const response = {
      boardroomBookings,
      soundproofBookings
    };

    console.log(`[FutureBookings] Retrieved ${boardroomBookings.length} boardroom and ${soundproofBookings.length} soundproof bookings`);
    res.json(response);
  } catch (error) {
    console.error('[FutureBookings] Error retrieving future bookings:', error);
    // Don't leak error details to browser
    res.status(500).json({ 
      error: 'Error retrieving future bookings'
    });
  }
});

module.exports = router;
