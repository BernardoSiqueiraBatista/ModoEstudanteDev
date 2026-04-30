from supabase import create_client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    sb = None
else:
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
