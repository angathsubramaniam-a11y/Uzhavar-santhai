const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rciryiffahzbqvzratnz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjaXJ5aWZmYWh6YnF2enJhdG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTUzNjEsImV4cCI6MjA5NDgzMTM2MX0.p0p4bMqt0wZAlzsuBx5uzwMm7ibzxtu1AMa8RkHM1qs'
);

async function checkRPC() {
  console.log("=== Checking RPC Functions ===");
  // Let's check if we can execute a common RPC or get information about RPCs
  try {
    const { data, error } = await supabase.rpc('get_rpc_functions');
    if (error) {
      console.log("get_rpc_functions not found or not accessible:", error.message);
    } else {
      console.log("get_rpc_functions successful:", data);
    }
  } catch (err) {
    console.error("Exceptional error:", err);
  }
}

checkRPC();
