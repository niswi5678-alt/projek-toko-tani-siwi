import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ltednvoypbgjposdlqkp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qdZUGLDite3phpm1zRLgIg_cITW_wpH';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
