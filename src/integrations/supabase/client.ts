import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ypgoodjdxcnjysrsortp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZ29vZGpkeGNuanlzcnNvcnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTI5NTIsImV4cCI6MjA4MTIyODk1Mn0.4xlx81jHjv3OcvSE1oJlv1ZPjQUOMIJigTGhvikDfvw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
