import { browserExtensionCors, isBrowserExtensionOrigin } from '../browserExtensionCors';

const chromeId = 'ikddeecpbbbnfmnkldhnhjlljddnjbon';
const edgeId = 'jhglfkcppgkgenonjpoopfbobcdlffgg';
const unpackedId = 'mjahhidapkkmobhedcponfciiclejhkp';
const firefoxOrigin = 'moz-extension://3f1c9a52-9a4e-4a5b-8b1c-0f6e0f0b6d21';
const safariOrigin = 'safari-web-extension://A1B2C3D4-E5F6-7890-ABCD-EF1234567890';

function run(isProduction: boolean, method: string, headers: Record<string, string>) {
  const set: Record<string, string> = {};
  let status: number | undefined;
  const next = jest.fn();
  const res: any = {
    setHeader: (k: string, v: string) => (set[k] = v),
    sendStatus: (s: number) => (status = s),
  };
  browserExtensionCors(isProduction)({ method, headers } as any, res, next);
  return { set, status, next };
}

describe('browser extension CORS', () => {
  describe('in production', () => {
    test.each([`chrome-extension://${chromeId}`, `chrome-extension://${edgeId}`, firefoxOrigin, safariOrigin])(
      'accepts %s',
      (origin) => {
        expect(isBrowserExtensionOrigin(origin, true)).toBe(true);
      },
    );

    test.each([
      undefined,
      `chrome-extension://${unpackedId}`, // another Chromium extension
      `chrome-extension://${chromeId}x`,
      `chrome-extension://${chromeId}/path`,
      `chrome-extension://${chromeId.toUpperCase()}`,
      'https://evil.example',
      'http://localhost:5173',
      'chrome-extension://',
      'file://abc',
    ])('refuses %s', (origin) => {
      expect(isBrowserExtensionOrigin(origin, true)).toBe(false);
    });
  });

  describe('outside production', () => {
    test.each([`chrome-extension://${unpackedId}`, `chrome-extension://${chromeId}`, firefoxOrigin, safariOrigin])(
      'accepts %s',
      (origin) => {
        expect(isBrowserExtensionOrigin(origin, false)).toBe(true);
      },
    );

    test.each([undefined, 'https://evil.example', 'chrome-extension://abc/path', 'chrome-extension://abc.evil.example@host'])(
      'refuses %s',
      (origin) => {
        expect(isBrowserExtensionOrigin(origin, false)).toBe(false);
      },
    );
  });

  it('answers the preflight of a published extension, without credentials', () => {
    const { set, status, next } = run(true, 'OPTIONS', {
      origin: `chrome-extension://${chromeId}`,
      'access-control-request-headers': 'content-type,x-custom',
    });
    expect(status).toBe(204);
    expect(next).not.toHaveBeenCalled();
    expect(set['Access-Control-Allow-Origin']).toBe(`chrome-extension://${chromeId}`);
    expect(set['Access-Control-Allow-Headers']).toBe('content-type,x-custom');
    expect(set['Access-Control-Allow-Credentials']).toBeUndefined();
    expect(set['Vary']).toBe('Origin');
  });

  it('allows the origin on a regular request and goes on', () => {
    const { set, next } = run(true, 'POST', { origin: firefoxOrigin });
    expect(set['Access-Control-Allow-Origin']).toBe(firefoxOrigin);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does nothing in production for an unlisted Chromium extension', () => {
    const { set, status, next } = run(true, 'OPTIONS', { origin: `chrome-extension://${unpackedId}` });
    expect(set).toEqual({});
    expect(status).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
