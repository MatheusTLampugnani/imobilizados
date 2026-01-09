import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ppatzcfifgbznbserfsh.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXR6Y2ZpZmdiem5ic2VyZnNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY4MDkzNiwiZXhwIjoyMDY2MjU2OTM2fQ.VDi-9z9z7xA9WBWMHMYEn1tAyGN8hmYgleaZjM8gDso';

export const supabase = createClient(supabaseUrl, supabaseKey);