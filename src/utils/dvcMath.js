// DVC Use Years and their corresponding banking deadlines (8 months later)
const USE_YEARS = {
  'February': 'September 30',
  'March': 'October 31',
  'April': 'November 30',
  'June': 'January 31',
  'August': 'March 31',
  'September': 'April 30',
  'October': 'May 31',
  'December': 'July 31'
};

export const validUseYears = Object.keys(USE_YEARS);

/**
 * Calculates the banking deadline for a given Use Year
 * @param {string} useYearMonth - e.g. "February"
 * @returns {string} - e.g. "September 30"
 */
export function getBankingDeadline(useYearMonth) {
  return USE_YEARS[useYearMonth] || 'Unknown';
}
