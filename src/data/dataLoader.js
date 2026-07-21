/**
 * Data loader — imports all resort and point chart data.
 * Centralizes data access for the entire application.
 */

import resortsData from '../data/resorts.json';

// Dynamically import all point chart JSON files using Vite's import.meta.glob
// This allows the app to automatically support new charts when they are added to the folder (e.g. via GitHub Actions)
const pointChartModules = import.meta.glob('../data/points/*.json', { eager: true });
const pointCharts = {};

Object.keys(pointChartModules).forEach(path => {
  // extract filename without extension, e.g. "bay-lake-tower-2025"
  const filename = path.split('/').pop().replace('.json', '');
  pointCharts[filename] = pointChartModules[path].default || pointChartModules[path];
});

/**
 * Get all resorts.
 * @returns {Array}
 */
export function getAllResorts() {
  return resortsData;
}

/**
 * Get a single resort by ID.
 * @param {string} resortId
 * @returns {object|undefined}
 */
export function getResortById(resortId) {
  return resortsData.find(r => r.id === resortId);
}

/**
 * Get resorts filtered by location.
 * @param {string} location - e.g., 'walt-disney-world'
 * @returns {Array}
 */
export function getResortsByLocation(location) {
  return resortsData.filter(r => r.location === location);
}

/**
 * Get all unique locations.
 * @returns {string[]}
 */
export function getLocations() {
  return [...new Set(resortsData.map(r => r.location))];
}

/**
 * Get the point chart data for a specific resort and year.
 * @param {string} resortId
 * @param {number} year
 * @returns {object|null}
 */
export function getPointChart(resortId, year) {
  const exactKey = `${resortId}-${year}`;
  if (pointCharts[exactKey]) {
    return pointCharts[exactKey];
  }
  
  // Fallback logic: get highest year less than requested year, or highest year overall
  const availableYears = getAvailableYears(resortId);
  if (availableYears.length === 0) return null;
  
  const pastYears = availableYears.filter(y => y < year);
  const fallbackYear = pastYears.length > 0 
    ? pastYears[pastYears.length - 1] // highest past year
    : availableYears[availableYears.length - 1]; // highest overall year (if all available are > year)
    
  return pointCharts[`${resortId}-${fallbackYear}`] || null;
}

/**
 * Get all available years for a specific resort.
 * @param {string} resortId
 * @returns {number[]}
 */
export function getAvailableYears(resortId) {
  const years = [];
  Object.keys(pointCharts).forEach(key => {
    if (key.startsWith(resortId + '-')) {
      const year = parseInt(key.split('-').pop());
      if (!isNaN(year)) years.push(year);
    }
  });
  return years.sort();
}

/**
 * Get IDs of resorts that have point chart data available.
 * @returns {string[]}
 */
export function getResortsWithCharts() {
  const ids = new Set();
  Object.keys(pointCharts).forEach(key => {
    // Remove the year suffix (last segment after the last dash where segment is numeric)
    const parts = key.split('-');
    const year = parts.pop();
    if (!isNaN(parseInt(year))) {
      ids.add(parts.join('-'));
    }
  });
  return [...ids];
}

/**
 * Location display name mapping.
 */
export const locationNames = {
  'walt-disney-world': 'Walt Disney World',
  'disneyland': 'Disneyland Resort',
  'aulani': 'Aulani, Hawaiʻi',
  'hilton-head': 'Hilton Head Island',
  'vero-beach': 'Vero Beach',
};

/**
 * Format a dues value as currency.
 * @param {number} value
 * @returns {string}
 */
export function formatDues(value) {
  return `$${value.toFixed(4)}`;
}

/**
 * Format currency.
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
