import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ypgoodjdxcnjysrsortp.supabase.co";
// You need to replace this with your actual Supabase anon key from:
// Supabase Dashboard > Settings > API > Project API keys > anon (public)
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZ29vZGpkeGNuanlzcnNvcnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NjA1MjgsImV4cCI6MjA2NTMzNjUyOH0.LfvPJFgpjgvMB5z6Z1gv3XvP7xXo7OWJ_BqKqKmG6yY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
