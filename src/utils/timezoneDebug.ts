import { utcToIsraelTime, israelTimeToUtc, getIsraelTimezoneOffset, isIsraelDST } from './israelTimezone';

export function debugTimezoneConversion(utcTimeString: string, label: string = 'Debug') {
  console.log(`\n🕐 ${label} - Timezone Debug:`);
  
  const utcDate = new Date(utcTimeString);
  const israelDate = utcToIsraelTime(utcDate);
  const offset = getIsraelTimezoneOffset(utcDate);
  const isDST = isIsraelDST(utcDate);
  
  console.log('Input UTC:', utcTimeString);
  console.log('UTC Date:', utcDate.toISOString());
  console.log('Israel Date:', israelDate.toLocaleString('he-IL'));
  console.log('Israel Time:', israelDate.toLocaleTimeString('he-IL'));
  console.log('Offset:', `UTC+${offset}`);
  console.log('DST:', isDST ? 'Summer (IDT)' : 'Winter (IST)');
  console.log('Current time:', new Date().toLocaleString('he-IL'));
  console.log('Current Israel time:', utcToIsraelTime(new Date()).toLocaleString('he-IL'));
  
  return {
    utcDate,
    israelDate,
    offset,
    isDST
  };
}

export function testTimezoneConversion() {
  console.log('\n🧪 Testing Timezone Conversions:');
  
  // Test current time
  const now = new Date();
  debugTimezoneConversion(now.toISOString(), 'Current Time');
  
  // Test a specific time
  const testTime = '2024-01-15T14:30:00.000Z';
  debugTimezoneConversion(testTime, 'Test Time (Winter)');
  
  // Test summer time
  const summerTime = '2024-07-15T14:30:00.000Z';
  debugTimezoneConversion(summerTime, 'Test Time (Summer)');
  
  // Test reverse conversion
  console.log('\n🔄 Testing Reverse Conversion:');
  const israelInput = new Date('2024-01-15T16:30:00'); // 4:30 PM Israel time
  const utcOutput = israelTimeToUtc(israelInput);
  console.log('Israel Input:', israelInput.toLocaleString('he-IL'));
  console.log('UTC Output:', utcOutput.toISOString());
  console.log('Back to Israel:', utcToIsraelTime(utcOutput).toLocaleString('he-IL'));
}

