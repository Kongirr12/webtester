// Configuration for Supabase Connection
// Replace these values with your actual Supabase Project credentials.
// If left empty, the application will automatically run in "Demo Mode" using LocalStorage.
const SUPABASE_CONFIG = {
    url: "https://unoaadqtwxoolpxhuain.supabase.co",      // e.g., "https://your-project-id.supabase.co"
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVub2FhZHF0d3hvb2xweGh1YWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTg1NDUsImV4cCI6MjA5NzA3NDU0NX0.eoZ91qmDoS04-AIR4k9fAaCsErnsSRlqG3ibTXA64Uk"   // e.g., "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
};

window.SUPABASE_CONFIG = SUPABASE_CONFIG;
