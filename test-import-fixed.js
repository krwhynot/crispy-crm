import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import fs from 'fs';

// Read environment variables
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTYsImlhdCI6MTc2MDg0NzUwOH0.0Z9-f-9quQT5cENWwAvBFc3mXEv5diDJNwq8ycCogcI';

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the CSV file
const csvContent = fs.readFileSync('data/new-contacts.csv', 'utf-8');

// Parse CSV with proper settings
Papa.parse(csvContent, {
  header: true,
  skipEmptyLines: true,
  skipFirstNLines: 2, // Skip the instruction rows
  complete: async (results) => {
    console.log('Parsed rows:', results.data.length);
    console.log('Headers:', results.meta.fields);

    // Test with first 5 contacts
    const testContacts = results.data.slice(0, 5);
    console.log('\nFirst 5 contacts:');
    testContacts.forEach((contact, i) => {
      console.log(`${i + 1}:`, contact);
    });

    // Map the headers to our expected format
    const mappedContacts = testContacts.map(row => {
      // Handle the "FULL NAME (FIRST, LAST)" which often contains just last name
      const fullName = row['FULL NAME (FIRST, LAST)'] || '';
      const nameParts = fullName.trim().split(/\s+/);

      let firstName = '';
      let lastName = '';

      if (nameParts.length === 1) {
        // Only one name - treat as last name
        lastName = nameParts[0];
      } else if (nameParts.length >= 2) {
        // Multiple parts - first is first name, rest is last name
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      }

      const email = row['EMAIL'] ? [{
        email: row['EMAIL'],
        type: 'Work'
      }] : [];

      const phone = row['PHONE'] ? [{
        phone: row['PHONE'],
        type: 'Work'
      }] : [];

      return {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        tags: [],
        // We'll skip organization for this test
      };
    });

    console.log('\nMapped contacts:');
    mappedContacts.forEach((contact, i) => {
      console.log(`${i + 1}:`, contact);
    });

    // Try to insert the first contact
    if (mappedContacts.length > 0) {
      const firstContact = mappedContacts[0];
      console.log('\nAttempting to insert:', firstContact);

      const { data, error } = await supabase
        .from('contacts')
        .insert(firstContact)
        .select();

      if (error) {
        console.error('Insert error:', error);
      } else {
        console.log('Insert successful:', data);
      }
    }

    // Check total count
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    console.log('\nTotal contacts in database:', count);
  },
  error: (error) => {
    console.error('Parse error:', error);
  }
});