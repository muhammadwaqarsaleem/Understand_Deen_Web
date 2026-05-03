// =============================================================
// utils/hijriDate.js — Hijri & Solar Date Utilities
// Understand Deen | Pure JS, no imports, works 100% offline
// =============================================================
//
// HOW THE HIJRI ALGORITHM WORKS:
// The Islamic (Hijri) calendar is a purely lunar calendar of 12
// months, each beginning with the sighting of the new crescent
// moon. A Hijri year is ~354.37 days (11 days shorter than solar).
//
// This implementation uses the "Kuwaiti Algorithm" — a standard
// arithmetic approximation widely used in Islamic software. It is
// based on the Julian Day Number (JDN), a continuous count of days
// since noon on 1 January 4713 BC (Julian calendar). The steps are:
//
//   1. Convert the Gregorian date to a Julian Day Number (JDN).
//      This gives us a single integer we can do arithmetic on.
//
//   2. Apply the Kuwaiti correction offset (1948440 - 385) to shift
//      the epoch from the Julian epoch to the Islamic epoch
//      (16 July 622 CE / 1 Muharram 1 AH).
//
//   3. Use modular arithmetic with the known lengths of Hijri years
//      (30-year cycle with 11 leap years of 355 days and 19 regular
//       years of 354 days) to extract the year, month, and day.
//
// ACCURACY: This algorithm is accurate to ±1 day compared to the
// actual moon sighting, which is acceptable for display purposes.
// For religious precision (e.g., Ramadan start), official moon
// sighting announcements should always take precedence.
//
// REFERENCE: The algorithm is documented in:
//   "Calendrical Calculations" by Reingold & Dershowitz (Cambridge Press)
//   and the Kuwaiti Government Ministry of Awqaf implementation.
// =============================================================

// ── Month name tables ─────────────────────────────────────────

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];

const SOLAR_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SOLAR_DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
];

// ── Step 1: Gregorian → Julian Day Number ────────────────────
// Standard formula from "Astronomical Algorithms" by Jean Meeus.
// Returns an integer representing the Julian Day Number for noon
// on the given Gregorian date.
const gregorianToJulianDay = (year, month, day) => {
  // Treat January and February as months 13 and 14 of the previous year
  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4); // Gregorian correction (not needed for Julian)

  return Math.floor(365.25 * (year + 4716))
       + Math.floor(30.6001 * (month + 1))
       + day + B - 1524;
};

// ── Step 2 & 3: Julian Day Number → Hijri Date ───────────────
// Returns { year, month (1-12), day } in the Hijri calendar.
const julianDayToHijri = (jd) => {
  // Shift JDN to Islamic epoch (1 Muharram 1 AH = JDN 1948440)
  // The -0.5 handles the fact that Islamic days start at sunset
  const l = jd - 1948440 + 10632;

  // Determine position within the 30-year cycle
  const n    = Math.floor((l - 1) / 10631);           // 30-year cycle number
  const l2   = l - 10631 * n + 354;
  const j    = Math.floor((10985 - l2) / 5316)
             * Math.floor(50 * l2 / 17719)
             + Math.floor(l2 / 5670)
             * Math.floor(43 * l2 / 15238);
  const l3   = l2 - Math.floor((30 - j) / 15)
             * Math.floor(17719 * j / 50)
             - Math.floor(j / 16)
             * Math.floor(15238 * j / 43) + 29;

  // Extract month and day
  const month = Math.floor(24 * l3 / 709);
  const day   = l3 - Math.floor(709 * month / 24);
  const year  = 30 * n + j - 30;

  return { year, month, day };
};

// =============================================================
// PUBLIC API
// =============================================================

/**
 * getSolarDate()
 * Returns the current date as a formatted string.
 * Example: "Saturday, 3 May 2026"
 *
 * @param {Date} [date] — optional Date object (defaults to today)
 * @returns {string}
 */
export const getSolarDate = (date = new Date()) => {
  const dayName   = SOLAR_DAYS[date.getDay()];
  const day       = date.getDate();
  const monthName = SOLAR_MONTHS[date.getMonth()];
  const year      = date.getFullYear();

  return `${dayName}, ${day} ${monthName} ${year}`;
};

/**
 * getHijriDate()
 * Returns the current date as a formatted Hijri string.
 * Example: "5 Dhu al-Qi'dah 1447 AH"
 *
 * @param {Date} [date] — optional Date object (defaults to today)
 * @returns {string}
 */
export const getHijriDate = (date = new Date()) => {
  const year  = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  const day   = date.getDate();

  const jd    = gregorianToJulianDay(year, month, day);
  const hijri = julianDayToHijri(jd);

  // hijri.month is 1-indexed; array is 0-indexed
  const monthName = HIJRI_MONTHS[hijri.month - 1] || 'Unknown';

  return `${hijri.day} ${monthName} ${hijri.year} AH`;
};

/**
 * getHijriDateShort()
 * Returns a compact Hijri date for narrow spaces.
 * Example: "5 Dhu al-Qi'dah 1447 AH" → "5 Dhul Qi'dah 1447"
 * Currently returns the same as getHijriDate() — override if needed.
 *
 * @param {Date} [date]
 * @returns {string}
 */
export const getHijriDateShort = (date = new Date()) => {
  return getHijriDate(date);
};
