export const getDeviceInfo = () => {
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
export const isIOS = () => getDeviceInfo().isIOS;
export const isAndroid = () => getDeviceInfo().isAndroid;
export const isMobile = () => getDeviceInfo().isMobile;
export const isTablet = () => getDeviceInfo().isTablet;
export const isDesktop = () => getDeviceInfo().isDesktop;
