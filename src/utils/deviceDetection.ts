export interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  platform: string;
}

export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  // More accurate iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                (platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Android detection
  const isAndroid = /Android/.test(userAgent);

  // Mobile detection
  const isMobile = /Mobi|Android/i.test(userAgent) || isIOS;

  // Tablet detection
  const isTablet = /iPad/.test(userAgent) || 
                   (isAndroid && !/Mobile/.test(userAgent));

  // Desktop detection
  const isDesktop = !isMobile && !isTablet;

  return {
    isIOS,
    isAndroid,
    isMobile,
    isTablet,
    isDesktop,
    userAgent,
    platform
  };
};

export const isIOS = (): boolean => getDeviceInfo().isIOS;
export const isAndroid = (): boolean => getDeviceInfo().isAndroid;
export const isMobile = (): boolean => getDeviceInfo().isMobile;
export const isTablet = (): boolean => getDeviceInfo().isTablet;
export const isDesktop = (): boolean => getDeviceInfo().isDesktop;
