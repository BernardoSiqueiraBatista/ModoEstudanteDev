// Enable feature flags for tests so that soft delete and audit log
// code paths are exercised. Must be set before any module reads `env`.
process.env.ENABLE_SOFT_DELETE = 'true';
process.env.ENABLE_AUDIT_LOG = 'true';
process.env.ENABLE_CONSULTATIONS = 'true';
process.env.NODE_ENV = 'test';

// Required env vars stubs (Supabase client is mocked in tests; values are placeholders).
process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY =
process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key';
