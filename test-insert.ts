import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajhijibbuhupvopibxwg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqaGlqaWJidWh1cHZvcGlieHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjMwNTUsImV4cCI6MjA4OTk5OTA1NX0.BB41z89t55xhjc_q_jZpTCIwNusfkZij7AhPDadGRR0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const fakeUserId = "123e4567-e89b-12d3-a456-426614174000"; // Fake UUID
  
  console.log("Attempting to insert into couples table with UUID:", fakeUserId);
  const today = new Date().toISOString().split('T')[0];
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from("couples")
    .insert({
      user1_id: fakeUserId,
      user2_id: null,
      anniversary_date: today,
      invite_code: code,
    });

  if (error) {
    console.error("Insert Error Details:");
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log("Insert Success!", data);
  }
}

testInsert();
