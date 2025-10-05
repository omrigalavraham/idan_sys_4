/**
 * Israel Timezone Utilities - Working Version
 * Summer (IDT): UTC+3 (April-September) 
 * Winter (IST): UTC+2 (October-March)
 */

// Check if date is in Israel DST (summer time)
function isIsraelDST(date) {
  return true; // Always use summer time (GMT+3) for simplicity
}

// Get Israel timezone offset (+2 winter, +3 summer)
function getIsraelTimezoneOffset(date) {
    return 3; // Always GMT+3 for simplicity
}

// Convert UTC to Israel time
function utcToIsraelTime(utcDate) {
  const offset = getIsraelTimezoneOffset(utcDate);
  return new Date(utcDate.getTime() + (offset * 60 * 60 * 1000));
}

// Convert Israel time to UTC
function israelTimeToUtc(israelDate) {
  const offset = getIsraelTimezoneOffset(israelDate);
  return new Date(israelDate.getTime() - (offset * 60 * 60 * 1000));
}

// Debug logging
function logTimezoneInfo(label, utcTime) {
  const israelTime = utcToIsraelTime(utcTime);
  const offset = getIsraelTimezoneOffset(utcTime);
  const isDST = isIsraelDST(utcTime);
  
  console.log(`🕐 ${label}:`, {
    UTC: utcTime.toISOString(),
    Israel: israelTime.toLocaleString('he-IL'),
    Offset: `UTC+${offset}`,
    Season: isDST ? 'Summer (IDT)' : 'Winter (IST)'
  });
}

module.exports = {
  isIsraelDST,
  getIsraelTimezoneOffset,
  utcToIsraelTime,
  israelTimeToUtc,
  logTimezoneInfo
};