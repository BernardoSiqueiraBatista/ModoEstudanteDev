import { requestIdMiddleware } from '../request-id.middleware';

function makeReq(headers: Record<string, string | undefined> = {}) {
  return { headers } as any;
}
function makeRes() {
  return { setHeader: jest.fn() } as any;
}

describe('requestIdMiddleware', () => {
  it('generates a UUID when no X-Request-Id header is present', () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.id);
    expect(next).toHaveBeenCalled();
  });

  it('uses existing X-Request-Id when provided', () => {
    const req = makeReq({ 'x-request-id': 'custom-id-123' });
    const res = makeRes();
    const next = jest.fn();

    requestIdMiddleware(req, res, next);

    expect(req.id).toBe('custom-id-123');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'custom-id-123');
  });

  it('falls back to a UUID when header is empty string', () => {
    const req = makeReq({ 'x-request-id': '' });
    const res = makeRes();

    requestIdMiddleware(req, res, jest.fn());

    expect(req.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('attaches req.id and calls next once', () => {
    const req = makeReq();
    const next = jest.fn();
    requestIdMiddleware(req, makeRes(), next);
    expect(req.id).toBeDefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
