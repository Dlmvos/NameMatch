const APP_STORE_SCREENSHOT_MODE = true;

export const DEV_PREVIEW = {
  appStoreScreenshotMode: APP_STORE_SCREENSHOT_MODE,
  forcePaywallState: (APP_STORE_SCREENSHOT_MODE ? 'owned' : null) as 'locked' | 'owned' | null,
  forceMatches: APP_STORE_SCREENSHOT_MODE,
  forceScreenshotNames: APP_STORE_SCREENSHOT_MODE,
  disableEmptyStates: APP_STORE_SCREENSHOT_MODE,
};
