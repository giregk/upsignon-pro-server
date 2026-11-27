import { isAllowedOnPlatform, PlatformInfo } from '../isAllowedOnPlatform';

const info = (osFamily: string, osNameAndVersion = '', deviceType = ''): PlatformInfo => ({
  osFamily,
  osNameAndVersion,
  deviceType,
});

const EDGE_ON_WINDOWS_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36 Edg/158.0.0.0';
const CHROME_ON_ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Mobile Safari/537.36';

describe('isAllowedOnPlatform', () => {
  describe('web', () => {
    it('only depends on ALLOWED_WEB, whatever the user agent contains', () => {
      for (const ua of [EDGE_ON_WINDOWS_UA, CHROME_ON_ANDROID_UA]) {
        const web = info('web', ua, 'Web browser');
        expect(isAllowedOnPlatform(web, { ALLOWED_WEB: false }, {})).toBe(false);
        expect(
          isAllowedOnPlatform(
            web,
            { ALLOWED_WEB: true, ALLOWED_WINDOWS: false, ALLOWED_ANDROID: false },
            {},
          ),
        ).toBe(true);
      }
    });

    it('is allowed by default', () => {
      expect(isAllowedOnPlatform(info('web', EDGE_ON_WINDOWS_UA, 'Web browser'), null, {})).toBe(
        true,
      );
    });

    it('lets the user setting override the bank setting', () => {
      const web = info('web', EDGE_ON_WINDOWS_UA, 'Web browser');
      expect(isAllowedOnPlatform(web, { ALLOWED_WEB: false }, { ALLOWED_WEB: true })).toBe(true);
      expect(isAllowedOnPlatform(web, { ALLOWED_WEB: true }, { ALLOWED_WEB: false })).toBe(false);
    });

    it('does not let ALLOWED_WEB affect native platforms', () => {
      expect(isAllowedOnPlatform(info('windows'), { ALLOWED_WEB: false }, {})).toBe(true);
    });
  });

  describe('native platforms', () => {
    const cases: [string, PlatformInfo, string][] = [
      ['windows', info('windows'), 'ALLOWED_WINDOWS'],
      ['ios', info('ios'), 'ALLOWED_IOS'],
      ['android', info('android'), 'ALLOWED_ANDROID'],
      ['macos', info('macos'), 'ALLOWED_MACOS'],
      ['linux', info('linux'), 'ALLOWED_LINUX'],
      // legacy clients: no osFamily, the platform is in the other fields
      ['legacy win32', info('', 'Windows 10', 'win32'), 'ALLOWED_WINDOWS'],
      ['legacy iPhone', info('', '', 'iPhone'), 'ALLOWED_IOS'],
      ['legacy iPad', info('', '', 'iPad'), 'ALLOWED_IOS'],
      ['legacy Mac', info('', '', 'Mac'), 'ALLOWED_MACOS'],
    ];
    it.each(cases)('%s depends on its own setting', (_name, platform, setting) => {
      expect(isAllowedOnPlatform(platform, { [setting]: false }, {})).toBe(false);
      expect(isAllowedOnPlatform(platform, { [setting]: true }, {})).toBe(true);
    });
  });

  it('refuses unknown platforms', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(isAllowedOnPlatform(info('plan9'), null, {})).toBe(false);
    spy.mockRestore();
  });
});
