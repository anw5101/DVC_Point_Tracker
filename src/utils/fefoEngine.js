const MONTH_MAP = {
  'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
  'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
};

/**
 * Determines the Use Year (YYYY) for a given date based on the contract's Use Year Month.
 */
export function getUseYearForDate(useYearMonth, dateStrOrObj) {
  const date = new Date(dateStrOrObj);
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();
  const uyMonthIndex = MONTH_MAP[useYearMonth];
  
  if (currentMonth >= uyMonthIndex) {
    return currentYear;
  }
  return currentYear - 1;
}

/**
 * Gets the Current Use Year based on today's date.
 */
export function getCurrentUseYear(useYearMonth) {
  return getUseYearForDate(useYearMonth, new Date());
}

/**
 * Calculates a contract's exact point buckets for a given target year using FEFO logic.
 */
export function calculateYearBalance(contract, targetYear, allTrips, allTransactions) {
  let basePoints = contract.points;
  let bankedIn = 0;
  let borrowedIn = 0;
  let bankedOut = 0;
  let borrowedOut = 0;
  let used = 0;

  // Process manual bank/borrow transactions
  allTransactions.forEach(tx => {
    if (tx.contractId !== contract.id) return;
    if (tx.type === 'BANK') {
      if (tx.toYear === targetYear) bankedIn += tx.amount;
      if (tx.fromYear === targetYear) bankedOut += tx.amount;
    }
    if (tx.type === 'BORROW') {
      if (tx.toYear === targetYear) borrowedIn += tx.amount;
      if (tx.fromYear === targetYear) borrowedOut += tx.amount;
    }
  });

  // Process trips falling in this Use Year
  allTrips.forEach(trip => {
    if (trip.allocations && trip.allocations.length > 0) {
      // New format: trip has allocations across multiple contracts
      trip.allocations.forEach(alloc => {
        if (alloc.contractId === contract.id && alloc.useYear === targetYear) {
          used += alloc.amount;
        }
      });
    } else {
      // Legacy format (fallback)
      if (trip.contractId !== contract.id) return;
      const tripUseYear = getUseYearForDate(contract.useYear, trip.checkInDate);
      if (tripUseYear === targetYear) {
        used += trip.pointsUsed;
      }
    }
  });

  // FEFO Application (First-Expiring, First-Out)
  // BankedIn and BorrowedIn both expire at the end of this Target Year.
  // We consume them first.
  const totalExpiring = bankedIn + borrowedIn;
  const currentPool = basePoints - bankedOut - borrowedOut; 
  
  let expiringAvailable = 0;
  let currentAvailable = 0;

  if (used <= totalExpiring) {
    // We used less than our expiring points
    expiringAvailable = totalExpiring - used;
    currentAvailable = currentPool;
  } else {
    // We used all expiring points, dip into current pool
    expiringAvailable = 0;
    const overflowUsage = used - totalExpiring;
    currentAvailable = currentPool - overflowUsage;
  }

  const totalAvailable = expiringAvailable + currentAvailable;

  return {
    basePoints,
    bankedIn,
    borrowedIn,
    bankedOut,
    borrowedOut,
    used,
    expiringAvailable,
    currentAvailable,
    totalAvailable
  };
}

/**
 * Calculates how to fund a trip using FEFO (First-Expiring, First-Out) logic across all contracts.
 * It identifies the available points in each contract for the Use Year corresponding to the check-in date,
 * sorts them by which points expire first (e.g. banked points expire sooner than base points),
 * and returns an array of allocations.
 * 
 * @returns {Array} allocations - e.g. [{ contractId: "abc", useYear: 2026, amount: 50 }]
 */
export function allocateTripPoints(contracts, allTrips, allTransactions, checkInDateStr, pointsNeeded) {
  let pointsRemainingToFund = Number(pointsNeeded);
  const allocations = [];

  // 1. Evaluate availability for each contract based on the check-in date's Use Year
  const availableBuckets = [];

  contracts.forEach(contract => {
    const tripUseYear = getUseYearForDate(contract.useYear, checkInDateStr);
    const balance = calculateYearBalance(contract, tripUseYear, allTrips, allTransactions);

    if (balance.expiringAvailable > 0) {
      availableBuckets.push({
        contractId: contract.id,
        useYear: tripUseYear,
        points: balance.expiringAvailable,
        type: 'expiring',
        // Give expiring points highest priority (lowest number)
        priority: 1 
      });
    }
    
    if (balance.currentAvailable > 0) {
      availableBuckets.push({
        contractId: contract.id,
        useYear: tripUseYear,
        points: balance.currentAvailable,
        type: 'current',
        // Base points have normal priority
        priority: 2 
      });
    }
  });

  // 2. Sort buckets by priority (FEFO)
  // If priorities match, sort by which contract has fewer points (to leave larger blocks intact if possible, or arbitrarily)
  availableBuckets.sort((a, b) => a.priority - b.priority);

  // 3. Allocate points
  for (const bucket of availableBuckets) {
    if (pointsRemainingToFund <= 0) break;

    const amountToTake = Math.min(bucket.points, pointsRemainingToFund);
    
    // Check if we already have an allocation for this contract/useYear to combine them
    const existing = allocations.find(a => a.contractId === bucket.contractId && a.useYear === bucket.useYear);
    if (existing) {
      existing.amount += amountToTake;
    } else {
      allocations.push({
        contractId: bucket.contractId,
        useYear: bucket.useYear,
        amount: amountToTake
      });
    }
    
    pointsRemainingToFund -= amountToTake;
  }

  if (pointsRemainingToFund > 0) {
    throw new Error(`Insufficient points. You need ${pointsRemainingToFund} more points to book this trip.`);
  }

  return allocations;
}
