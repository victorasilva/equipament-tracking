import { isAuthorized } from "../../../src/shared/utils/deviceAuthorization";

describe('isAuthorized', () => {
    it('deve retornar true para devices autorizados', () => {
        const authorizedDeviceIds = ['0A3F73', '1B4E82', '2C5D91'];
        authorizedDeviceIds.forEach(deviceId => {
            expect(isAuthorized(deviceId)).toBe(true);
        });
    });

    it('deve retornar false para devices não autorizados', () => {
        const unauthorizedDeviceIds = ['UNAUTHORIZED123', 'UNKNOWN_DEVICE', '123456'];
        unauthorizedDeviceIds.forEach(deviceId => {
            expect(isAuthorized(deviceId)).toBe(false);
        });
    });
});