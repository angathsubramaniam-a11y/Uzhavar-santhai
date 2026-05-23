import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rciryiffahzbqvzratnz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjaXJ5aWZmYWh6YnF2enJhdG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTUzNjEsImV4cCI6MjA5NDgzMTM2MX0.p0p4bMqt0wZAlzsuBx5uzwMm7ibzxtu1AMa8RkHM1qs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Testing insert into orders table...");
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      customer_id: null,
      farmer_id: 999999999, // Fake farmer ID
      status: 'Pending',
      items: [],
      total: 100,
      subtotal: 100,
      discount: 0,
      delivery_fee: 0,
      address: 'Test Address',
      payment_method: 'Cash on Delivery',
      payment_status: 'Pending',
      delivery_info: {}
    }])
    .select();

  if (error) {
    console.error("INSERT ERROR:", error);
  } else {
    console.log("INSERT SUCCESS:", data);
    // Cleanup
    if (data && data[0]) {
      await supabase.from('orders').delete().eq('id', data[0].id);
    }
  }
}

testInsert();
