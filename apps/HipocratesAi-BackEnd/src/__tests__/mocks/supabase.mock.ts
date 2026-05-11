export const mockSupabaseAdmin = {
  schema: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  rpc: jest.fn(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('../../infra/supabase/supabase-admin', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

jest.mock('../../config/supabase', () => ({
  supabase: mockSupabaseAdmin,
}));
