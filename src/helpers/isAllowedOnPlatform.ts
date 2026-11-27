import { BANK_SETTINGS, USER_SETTINGS_OVERRIDE } from './getDefaultSettingOrUserOverride';

export type PlatformInfo = {
  osFamily: string;
  osNameAndVersion: string;
  deviceType: string;
};

// The web app sends osFamily = "web" and its osNameAndVersion is the browser user agent,
// which may contain "Windows", "Android", "Mac"...
// => it must be detected from osFamily alone, before any other platform.
const isWeb = (osFamily: string) => {
  return osFamily.toLowerCase() === 'web';
};

const isWindows = (osFamily: string) => {
  if (osFamily.toLowerCase().indexOf('win32') >= 0) {
    // deprecated check
    return true;
  }
  return osFamily.toLowerCase().indexOf('windows') >= 0;
};

const isIos = (osFamily: string) => {
  if (
    osFamily.toLowerCase().indexOf('iphone') >= 0 ||
    osFamily.toLowerCase().indexOf('ipad') >= 0
  ) {
    // deprecated check
    return true;
  }
  return osFamily.toLowerCase().indexOf('ios') >= 0;
};

const isAndroid = (osFamily: string) => {
  return osFamily.toLowerCase().indexOf('android') >= 0;
};

const isMacos = (osFamily: string) => {
  if (osFamily.toLowerCase().indexOf('mac') >= 0) {
    // deprecated check
    return true;
  }
  return osFamily.toLowerCase().indexOf('macos') >= 0;
};

const isLinux = (osFamily: string) => {
  return osFamily.toLowerCase().indexOf('linux') >= 0;
};
const _settingResultForUser = (
  bankSettings: BANK_SETTINGS,
  userSettings: USER_SETTINGS_OVERRIDE,
  settingName: keyof USER_SETTINGS_OVERRIDE,
  defaultResult: boolean,
): boolean => {
  const userParam = userSettings?.[settingName];
  const bankParam = bankSettings?.[settingName];
  if (userParam === true) return true;
  if (userParam === false) return false;
  // userParam is null or undefined
  if (bankParam === true) return true;
  if (bankParam === false) return false;
  // bankParam is also null or undefined
  return defaultResult;
};

export const isAllowedOnPlatform = (
  platformInfo: PlatformInfo,
  bankSettings: BANK_SETTINGS,
  userSettings: USER_SETTINGS_OVERRIDE,
): boolean => {
  const defaultAllowed = true;
  if (isWeb(platformInfo.osFamily)) {
    return _settingResultForUser(bankSettings, userSettings, 'ALLOWED_WEB', defaultAllowed);
  }
  // Older app versions did not send osFamily (or sent a legacy value), the platform name could be
  // in any of the 3 fields => look into all of them.
  const osFamily = `${platformInfo.osFamily} ${platformInfo.osNameAndVersion} ${platformInfo.deviceType}`;
  if (isWindows(osFamily)) {
    return _settingResultForUser(bankSettings, userSettings, 'ALLOWED_WINDOWS', defaultAllowed);
  } else if (isIos(osFamily)) {
    return _settingResultForUser(bankSettings, userSettings, 'ALLOWED_IOS', defaultAllowed);
  } else if (isAndroid(osFamily)) {
    return _settingResultForUser(bankSettings, userSettings, 'ALLOWED_ANDROID', defaultAllowed);
  } else if (isMacos(osFamily)) {
    return _settingResultForUser(bankSettings, userSettings, 'ALLOWED_MACOS', defaultAllowed);
  } else if (isLinux(osFamily)) {
    return _settingResultForUser(bankSettings, userSettings, 'ALLOWED_LINUX', defaultAllowed);
  } else {
    console.error('isAllowedOnPlatform - unknown osFamily: ', osFamily);
    return false;
  }
};
