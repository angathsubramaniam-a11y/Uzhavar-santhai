import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rciryiffahzbqvzratnz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjaXJ5aWZmYWh6YnF2enJhdG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTUzNjEsImV4cCI6MjA5NDgzMTM2MX0.p0p4bMqt0wZAlzsuBx5uzwMm7ibzxtu1AMa8RkHM1qs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Fetching a valid farmer...");
  const { data: farmers, error: fErr } = await supabase.from('farmers').select('id').limit(1);
  if (fErr || !farmers || farmers.length === 0) {
    console.error("No valid farmers found or error:", fErr);
    return;
  }
  const validFarmerId = farmers[0].id;
  console.log("Using farmer_id:", validFarmerId);

  console.log("Testing insert into products table...");
  const { data, error } = await supabase
    .from('products')
    .insert([{
      farmer_id: validFarmerId,
      farmer_name: "Test Farmer",
      name: "Test Product",
      category: "Vegetables",
      price: 100,
      unit: "kg",
      stock: 10,
      is_organic: true,
      image: "test.jpg",
      description: "Test description"
    }])
    .select();

  if (error) {
    console.error("INSERT ERROR:", error);
  } else {
    console.log("INSERT SUCCESS:", data);
    // Cleanup
    if (data && data[0]) {
      await supabase.from('products').delete().eq('id', data[0].id);
    }
  }
}

testInsert();
