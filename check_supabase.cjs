const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rciryiffahzbqvzratnz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjaXJ5aWZmYWh6YnF2enJhdG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTUzNjEsImV4cCI6MjA5NDgzMTM2MX0.p0p4bMqt0wZAlzsuBx5uzwMm7ibzxtu1AMa8RkHM1qs'
);

const tables = ['farmers', 'customers', 'riders', 'products', 'orders', 'payouts', 'support_tickets'];

async function check() {
  console.log("=== Checking Supabase Database Tables ===");
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ Table "${table}": Error ->`, error.message);
      } else {
        console.log(`✅ Table "${table}": Accessible. Columns found:`, data.length > 0 ? Object.keys(data[0]) : '(Empty table)');
      }
    } catch (err) {
      console.error(`❌ Table "${table}": Exceptional error ->`, err.message);
    }
  }
}

check();
