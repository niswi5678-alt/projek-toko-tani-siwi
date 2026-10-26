// ============================================
// SUPABASE CLIENT
// GANTI DENGAN KREDENSIAL PROJECT ANDA
// ============================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://gbetpgkomyopscvemwnj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_DnFUxaia4l_pH8BdPlNLYA_Nt2MbCjN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
