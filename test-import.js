import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import fs from 'fs';

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTYsImlhdCI6MTc2MDg0NzUwOH0.0Z9-f-9quQT5cENWwAvBFc3mXEv5diDJNwq8ycCogcI';

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the CSV file
const csvContent = fs.readFileSync('data/new-contacts.csv', 'utf-8');

// Parse CSV
Papa.parse(csvContent, {
  header: true,
  complete: async (results) => {
    console.log('Parsed rows:', results.data.length);
    console.log('Headers:', results.meta.fields);

    // Test with just the first contact
    const firstContact = results.data[0];
    console.log('First contact:', firstContact);

    // Try to insert just one contact
    const contactData = {
      first_name: firstContact['First Name'] || firstContact['first_name'],
      last_name: firstContact['Last Name'] || firstContact['last_name'],
      email: [{
        email: firstContact['Email'] || firstContact['email_work'],
        type: 'Work'
      }],
      phone: [],
      tags: []
    };

    console.log('Attempting to insert:', contactData);

    const { data, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select();

    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Insert successful:', data);
    }

    // Check total count
    const { data: countData, error: countError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true });

    console.log('Total contacts in database:', countData);
  },
  error: (error) => {
    console.error('Parse error:', error);
  }
});