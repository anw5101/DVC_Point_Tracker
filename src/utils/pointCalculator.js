/**
 * DVC Point Calculator — Core utility functions
 * Handles all point cost calculations, season lookups, and trip breakdowns.
 */

/**
 * Determine if a date falls on a weekend (Fri/Sat) for DVC pricing.
 * DVC weekdays = Sun-Thu, DVC weekends = Fri-Sat
 * @param {Date} date
 * @returns {boolean}
 */
export function isWeekend(date) {
  const day = date.getDay();
  return day === 5 || day === 6; // Friday = 5, Saturday = 6
}

/**
 * Parse a "YYYY-MM-DD" string into a local Date object (avoiding timezone offset issues).
 * @param {string} dateStr - ISO date string "YYYY-MM-DD"
 * @returns {Date}
 */
export function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date as a short readable string (e.g., "Jan 15").
 * @param {string} dateStr - ISO date string "YYYY-MM-DD"
 * @returns {string}
 */
export function formatDateShort(dateStr) {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a date range as "Jan 1 – Feb 14".
 * @param {string} startStr
 * @param {string} endStr
 * @returns {string}
 */
export function formatDateRange(startStr, endStr) {
  return `${formatDateShort(startStr)} – ${formatDateShort(endStr)}`;
}

/**
 * Get the active travel period (season) for a given date.
 * @param {Date} date
 * @param {Array} travelPeriods - Array of travel period objects with dateRanges
 * @returns {object|null} - The matching travel period, or null
 */
export function getSeasonForDate(date, travelPeriods) {
  const dateTime = date.getTime();
  
  for (const period of travelPeriods) {
    for (const range of period.dateRanges) {
      const start = parseDate(range.start).getTime();
      const end = parseDate(range.end).getTime();
      if (dateTime >= start && dateTime <= end) {
        return period;
      }
    }
  }
  return null;
}

/**
 * Get the points cost for a single night at a specific room type.
 * @param {Date} date - The check-in date for this night
 * @param {string} roomTypeId - The room type ID
 * @param {Array} pointChart - The point chart array from the resort data
 * @param {Array} travelPeriods - The travel periods array
 * @returns {object|null} - { points, dayType, season } or null
 */
export function getPointsForNight(date, roomTypeId, pointChart, travelPeriods) {
  const season = getSeasonForDate(date, travelPeriods);
  if (!season) return null;
  
  const roomData = pointChart.find(r => r.roomTypeId === roomTypeId);
  if (!roomData) return null;
  
  const seasonPoints = roomData.seasons[season.id];
  if (!seasonPoints) return null;
  
  const dayType = isWeekend(date) ? 'weekend' : 'weekday';
  
  return {
    points: seasonPoints[dayType],
    dayType,
    season: season,
    weekdayPoints: seasonPoints.weekday,
    weekendPoints: seasonPoints.weekend,
  };
}

/**
 * Calculate the total point cost for a multi-night stay.
 * Returns a night-by-night breakdown plus summary stats.
 * @param {Date} checkIn - Check-in date
 * @param {Date} checkOut - Check-out date
 * @param {string} roomTypeId - Room type ID
 * @param {Array} pointChart - Point chart data
 * @param {Array} travelPeriods - Travel period definitions
 * @returns {object} - { nights: [...], totalPoints, avgPerNight, weekdayTotal, weekendTotal }
 */
export function calculateTripCost(checkIn, checkOut, roomTypeId, pointChart, travelPeriods) {
  const nights = [];
  let totalPoints = 0;
  let weekdayTotal = 0;
  let weekendTotal = 0;
  
  const current = new Date(checkIn);
  
  while (current < checkOut) {
    const nightData = getPointsForNight(current, roomTypeId, pointChart, travelPeriods);
    
    nights.push({
      date: new Date(current),
      dateStr: formatLocalDate(current),
      dayOfWeek: current.toLocaleDateString('en-US', { weekday: 'short' }),
      ...nightData,
    });
    
    if (nightData) {
      totalPoints += nightData.points;
      if (nightData.dayType === 'weekend') {
        weekendTotal += nightData.points;
      } else {
        weekdayTotal += nightData.points;
      }
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return {
    nights,
    totalPoints,
    nightCount: nights.length,
    avgPerNight: nights.length > 0 ? Math.round(totalPoints / nights.length * 10) / 10 : 0,
    weekdayTotal,
    weekendTotal,
  };
}

/**
 * Convert total points to a cash equivalent based on maintenance dues.
 * @param {number} totalPoints
 * @param {number} duesPerPoint - Annual dues per point
 * @param {number} rentalRate - Market rental rate per point (default $19.50)
 * @returns {object} - { duesCost, rentalValue }
 */
export function calculateCashEquivalent(totalPoints, duesPerPoint, rentalRate = 19.50) {
  return {
    duesCost: Math.round(totalPoints * duesPerPoint * 100) / 100,
    rentalValue: Math.round(totalPoints * rentalRate * 100) / 100,
  };
}

/**
 * Format a Date as "YYYY-MM-DD" in local time.
 * @param {Date} date
 * @returns {string}
 */
export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the season color CSS variable based on a period index.
 * @param {number} index - 0-based index of the season
 * @returns {string} - CSS color string
 */
export function getSeasonColor(index) {
  const colors = [
    'var(--color-season-1)',
    'var(--color-season-2)',
    'var(--color-season-3)',
    'var(--color-season-4)',
    'var(--color-season-5)',
    'var(--color-season-6)',
    'var(--color-season-7)',
  ];
  return colors[index % colors.length];
}

/**
 * Get all unique room type "names" (groupings) from a room types array.
 * e.g., ["Deluxe Studio", "1-Bedroom Villa", "2-Bedroom Villa"]
 * @param {Array} roomTypes
 * @returns {string[]}
 */
export function getUniqueRoomNames(roomTypes) {
  return [...new Set(roomTypes.map(rt => rt.name))];
}

/**
 * Group room types by their name.
 * @param {Array} roomTypes
 * @returns {Object} - { "Deluxe Studio": [...], "1-Bedroom Villa": [...] }
 */
export function groupRoomTypesByName(roomTypes) {
  return roomTypes.reduce((acc, rt) => {
    if (!acc[rt.name]) acc[rt.name] = [];
    acc[rt.name].push(rt);
    return acc;
  }, {});
}
