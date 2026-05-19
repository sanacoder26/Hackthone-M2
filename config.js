
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.28.0';

// Credentials will be loaded dynamically from the .env file or environment
let supabaseUrl = '';
let supabaseKey = '';

// Dynamically fetch .env file if running on a local development server
try {
  const response = await fetch('./.env');
  if (response.ok) {
    const text = await response.text();
    const lines = text.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          let val = parts.slice(1).join('=').trim();
          // Remove wrapping quotes if they exist
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (key === 'NEXT_PUBLIC_SUPABASE_URL' || key === 'SUPABASE_URL') supabaseUrl = val;
          if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' || key === 'SUPABASE_KEY') supabaseKey = val;
        }
      }
    });
  }
} catch (e) {
  console.log('Using default Supabase credentials (file system or .env fetch blocked/unsupported)', e);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;

