export function isAuthorized(deviceId: string): boolean {
    const authorizedDevices = process.env.ALLOW_DEVICES ? process.env.ALLOW_DEVICES.split(',') : [];
    return authorizedDevices.includes(deviceId);
}