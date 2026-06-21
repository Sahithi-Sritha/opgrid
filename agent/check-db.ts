import 'dotenv/config';
import { supabase } from './src/config/supabase';
import fs from 'fs';
import path from 'path';

async function checkAndApplySchema() {
  console.log("Checking if opportunities table exists...");
  const { data, error } = await supabase.from('opportunities').select('id').limit(1);
  
  if (error) {
    console.error("Error accessing opportunities:", error.message || error);
    console.log("It seems tables do not exist. We need to run the SQL schemas.");
    console.log("Unfortunately, Supabase JS doesn't have an execute raw SQL method.");
    console.log("You can use the REST API or psql if the connection string is known.");
  } else {
    console.log("Opportunities table exists! Data:", data);
  }
}

checkAndApplySchema();
