import Papa from 'papaparse';
import fs from 'fs';

// Read the CSV file
const csvContent = fs.readFileSync('data/new-contacts.csv', 'utf-8');

console.log('Testing Papa Parse with skipEmptyLines: true\n');
console.log('='.repeat(80));

Papa.parse(csvContent, {
  header: false,
  skipEmptyLines: true,
  complete: (results) => {
    const rawData = results.data;

    console.log(`\nTotal rows parsed: ${rawData.length}\n`);

    // Show first 10 rows
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      console.log(`Row ${i}:`);
      console.log(`  Length: ${rawData[i].length}`);
      console.log(`  First 3 cells:`, rawData[i].slice(0, 3));
      console.log(`  Cell [0]: "${rawData[i][0]}"`);
      console.log(`  Cell [1]: "${rawData[i][1]}"`);
      console.log(`  Cell [2]: "${rawData[i][2]}"`);
      console.log('');
    }

    console.log('\nAnalysis:');
    console.log('='.repeat(80));
    console.log('Row 0 (should be instructions):', rawData[0]?.[0]?.substring(0, 50));
    console.log('Row 1 (should be headers):', rawData[1]?.[0]?.substring(0, 50));
    console.log('Row 2 (should be first data):', rawData[2]?.slice(0, 3));
  }
});
