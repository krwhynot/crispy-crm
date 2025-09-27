// Debug authentication helper - paste this in browser console
import { supabase } from './atomic-crm/providers/supabase/supabase';

export async function debugAuth() {
  console.log('=== AUTHENTICATION DEBUG ===');

  // Check current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('Session exists:', !!session);
  if (sessionError) console.error('Session error:', sessionError);
  if (session) {
    console.log('User ID:', session.user?.id);
    console.log('User email:', session.user?.email);
    console.log('Token expires at:', new Date(session.expires_at! * 1000).toLocaleString());
    console.log('Token expired?:', new Date(session.expires_at! * 1000) < new Date());
  }

  // Check current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('User authenticated:', !!user);
  if (userError) console.error('User error:', userError);

  // Test a simple query
  console.log('\n=== TESTING DATABASE ACCESS ===');

  // Test sales table (needed for auth)
  const { data: salesData, error: salesError } = await supabase
    .from('sales')
    .select('id')
    .limit(1);
  console.log('Sales table accessible:', !salesError);
  if (salesError) console.error('Sales error:', salesError);

  // Test tasks table (reported as failing)
  const { data: tasksData, error: tasksError } = await supabase
    .from('tasks')
    .select('id')
    .limit(1);
  console.log('Tasks table accessible:', !tasksError);
  if (tasksError) console.error('Tasks error:', tasksError);

  // Test contacts table
  const { data: contactsData, error: contactsError } = await supabase
    .from('contacts')
    .select('id')
    .limit(1);
  console.log('Contacts table accessible:', !contactsError);
  if (contactsError) console.error('Contacts error:', contactsError);

  return {
    session: !!session,
    user: !!user,
    salesAccess: !salesError,
    tasksAccess: !tasksError,
    contactsAccess: !contactsError
  };
}

// Make it available globally for console
(window as any).debugAuth = debugAuth;