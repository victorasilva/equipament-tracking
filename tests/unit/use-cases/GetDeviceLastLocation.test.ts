import { GetDeviceLastLocation } from '../../../src/application/use-cases/GetDeviceLastLocation';
import { ILocationRepository } from '../../../src/domain/repositories/ILocationRepository';
import { Location } from '../../../src/domain/entities/Location';

describe('GetDeviceLastLocation', () => {
    let mockRepository: jest.Mocked<ILocationRepository>;
    let useCase: GetDeviceLastLocation;

    beforeEach(() => {
        mockRepository = {
            saveLocation: jest.fn(),
            getLastLocation: jest.fn(),
            updateDeviceConnection: jest.fn(),
        };

        useCase = new GetDeviceLastLocation(mockRepository);
    });

    describe('execute', () => {
        it('deve retornar localização quando dispositivo está autorizado', async () => {
            const deviceId = '0A3F73';
            const location = new Location(
                -23.550520,
                -46.633308,
                new Date(),
                60,
                180,
                1000,
                500,
                true,
                false,
                true
            );

            mockRepository.getLastLocation.mockResolvedValue(location);

            const result = await useCase.execute(deviceId);

            expect(result).toBe(location);
            expect(mockRepository.getLastLocation).toHaveBeenCalledWith(deviceId);
        });

        it('deve retornar null quando dispositivo não existe', async () => {
            const deviceId = '0A3F73';
            mockRepository.getLastLocation.mockResolvedValue(null);

            const result = await useCase.execute(deviceId);

            expect(result).toBeNull();
            expect(mockRepository.getLastLocation).toHaveBeenCalledWith(deviceId);
        });

        it('deve chamar repositório com ID de dispositivo correto', async () => {
            const deviceId = '1B4E82';
            mockRepository.getLastLocation.mockResolvedValue(null);

            await useCase.execute(deviceId);

            expect(mockRepository.getLastLocation).toHaveBeenCalledTimes(1);
            expect(mockRepository.getLastLocation).toHaveBeenCalledWith('1B4E82');
        });

        it('deve retornar null para devices não autorizados', async () => {
            const deviceId = 'UNAUTHORIZED123';
            const result = await useCase.execute(deviceId);
            expect(result).toBeNull();
        });

    });
});
