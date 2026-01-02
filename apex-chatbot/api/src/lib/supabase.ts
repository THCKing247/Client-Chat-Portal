import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// For auth verification only (anon)
export const supabaseAuth = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false }
});

// For database access (admin) - backend-only, never expose to portal
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});
