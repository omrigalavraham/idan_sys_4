/**
 * Israel Timezone Utilities - TypeScript Version
 * Handles automatic detection of DST (Daylight Saving Time) for Israel
 * Summer (IDT): UTC+3 (end of March to end of October)
 * Winter (IST): UTC+2 (end of October to end of March)
 */
/**
 * Get Israel timezone offset in hours - simplified to GMT+3
 * Using fixed offset for simplicity
 */
export function getIsraelTimezoneOffset(date) {
    return 3; // Always GMT+3 for simplicity
}
/**
 * Check if a given date is during Israel's Daylight Saving Time (summer)
 * Simplified - always return true since we use GMT+3
 */
export function isIsraelDST(date) {
    return true; // Always use summer time (GMT+3)
}
/**
 * Convert UTC time to Israel local time
 */
export function utcToIsraelTime(utcDate) {
    const offset = getIsraelTimezoneOffset(utcDate);
    return new Date(utcDate.getTime() + (offset * 60 * 60 * 1000));
}
/**
 * Convert Israel local time to UTC
 */
export function israelTimeToUtc(israelDate) {
    const offset = getIsraelTimezoneOffset(israelDate);
    return new Date(israelDate.getTime() - (offset * 60 * 60 * 1000));
}
/**
 * Format Israel time for display
 */
export function formatIsraelTime(date) {
    const israelTime = utcToIsraelTime(date);
    return israelTime.toLocaleString('he-IL');
}
/**
 * Get current Israel time
 */
export function getCurrentIsraelTime() {
    return utcToIsraelTime(new Date());
}
/**
 * Debug function to log timezone information
 */
export function logTimezoneInfo(label, utcTime) {
    const israelTime = utcToIsraelTime(utcTime);
    const offset = getIsraelTimezoneOffset(utcTime);
    const isDST = isIsraelDST(utcTime);
    console.log(`🕐 ${label}:`, {
        UTC: utcTime.toISOString(),
        Israel: israelTime.toLocaleString('he-IL'),
        Offset: `UTC+${offset}`,
        DST: isDST ? 'Summer (IDT)' : 'Winter (IST)'
    });
}
