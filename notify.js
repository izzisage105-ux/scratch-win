// notify.js
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://zziqhxaofrzjhejpvjve.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6aXFoeGFvZnJ6amhlanB2anZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDg4MTAyMCwiZXhwIjoyMDg2NDU3MDIwfQ.2RoA8hyjIPN5wghGhu5ofW6ikOoJfC21jhEMBxYNdCg';

// Initialize Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Insert a notification for admin when a user requests a deposit or withdrawal.
 * @param {string} userId - The ID of the user making the request.
 * @param {string} type - 'deposit' or 'withdrawal'.
 * @param {number} amount - The amount in Naira.
 */
async function addNotification(userId, type, amount) {
  try {
    const { data, error } = await supabase
      .from('admin_notifications')
      .insert([
        {
          user_id: userId,
          type: type,
          amount: amount,
          status: 'pending',
        },
      ]);

    if (error) {
      console.error('❌ Failed to insert notification:', error.message);
    } else {
      console.log('✅ Notification inserted successfully:', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error in addNotification:', err);
  }
}

module.exports = addNotification;