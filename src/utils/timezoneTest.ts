import { utcToIsraelTime, israelTimeToUtc, getIsraelTimezoneOffset, isIsraelDST } from './israelTimezone';

export function testCurrentTimezone() {
  const now = new Date();
  const israelNow = utcToIsraelTime(now);
  const offset = getIsraelTimezoneOffset(now);
  const isDST = isIsraelDST(now);
  
  console.log('\n🕐 Current Timezone Test (GMT+3 Fixed):');
  console.log('Current UTC:', now.toISOString());
  console.log('Current Israel (calculated):', israelNow.toLocaleString('he-IL'));
  console.log('Current Israel (browser):', now.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }));
  console.log('Offset:', `UTC+${offset}`);
  console.log('DST:', 'GMT+3 (Fixed)');
  
  return {
    utc: now,
    israelCalculated: israelNow,
    israelBrowser: new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })),
    offset,
    isDST
  };
}

export function testSpecificTime(israelTimeStr: string) {
  console.log(`\n🧪 Testing specific time: ${israelTimeStr}`);
  
  // Test 1: Create as local time (what we want)
  const localDate = new Date(israelTimeStr);
  console.log('1. As local time:', localDate.toLocaleString('he-IL'));
  
  // Test 2: Convert to UTC and back
  const utcFromLocal = israelTimeToUtc(localDate);
  const israelFromUtc = utcToIsraelTime(utcFromLocal);
  console.log('2. Local -> UTC -> Israel:', israelFromUtc.toLocaleString('he-IL'));
  
  // Test 3: Parse as UTC and convert
  const utcDirect = new Date(israelTimeStr + 'Z');
  const israelFromUtcDirect = utcToIsraelTime(utcDirect);
  console.log('3. Parse as UTC -> Israel:', israelFromUtcDirect.toLocaleString('he-IL'));
  
  return {
    original: israelTimeStr,
    localDate,
    utcFromLocal,
    israelFromUtc,
    utcDirect,
    israelFromUtcDirect
  };
}

export function debugEventTime(eventStartTime: string) {
  console.log(`\n🔍 Debug Event Time: ${eventStartTime}`);
  
  let eventDateTime: Date;
  let conversionMethod: string;
  
  if (eventStartTime.includes('T') && eventStartTime.includes('Z')) {
    // UTC time - convert to Israel time
    const utcDateTime = new Date(eventStartTime);
    eventDateTime = utcToIsraelTime(utcDateTime);
    conversionMethod = 'UTC -> Israel';
    console.log('UTC input:', utcDateTime.toISOString());
    console.log('Israel output:', eventDateTime.toLocaleString('he-IL'));
  } else if (eventStartTime.includes('T')) {
    // Local time
    eventDateTime = new Date(eventStartTime);
    conversionMethod = 'Local (no conversion)';
    console.log('Local time:', eventDateTime.toLocaleString('he-IL'));
  } else {
    // Simple format
    eventDateTime = new Date(eventStartTime);
    conversionMethod = 'Simple format';
    console.log('Simple format:', eventDateTime.toLocaleString('he-IL'));
  }
  
  console.log('Conversion method:', conversionMethod);
  console.log('Final time:', eventDateTime.toLocaleString('he-IL'));
  console.log('Final ISO:', eventDateTime.toISOString());
  
  return {
    input: eventStartTime,
    output: eventDateTime,
    conversionMethod,
    israelTime: eventDateTime.toLocaleString('he-IL')
  };
}

// Test function to call from browser console
export function runTimezoneTests() {
  console.log('🧪 Running comprehensive timezone tests...');
  
  testCurrentTimezone();
  testSpecificTime('2024-01-15T17:42:00');
  testSpecificTime('2024-07-15T17:42:00');
  debugEventTime('2025-09-28T17:42:00.000Z');
  debugEventTime('2025-09-28T17:42:00');
  
  console.log('\n✅ Timezone tests completed!');
}
