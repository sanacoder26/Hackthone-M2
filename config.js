import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.28.0';

// 1. Fetch credentials from our simple env.json configuration file
const response = await fetch('./env.json');
const env = await response.json();

// 2. Initialize and export the Supabase client
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
export default supabase;
