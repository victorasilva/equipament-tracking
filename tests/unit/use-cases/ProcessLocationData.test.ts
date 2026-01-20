import { ProcessLocationData } from '../../../src/application/use-cases/ProcessLocationData';
import { ILocationRepository } from '../../../src/domain/repositories/ILocationRepository';
import { ParsedPacketDTO } from '../../../src/application/parsers/dtos/ParsedPacketDTO';
import { ParsedLocationDTO } from '../../../src/application/parsers/dtos/ParsedLocationDTO';
import { Location } from '../../../src/domain/entities/Location';

describe('ProcessLocationData', () => {
    let mockRepository: jest.Mocked<ILocationRepository>;
    let useCase: ProcessLocationData;

    beforeEach(() => {
        mockRepository = {
            saveLocation: jest.fn(),
            getLastLocation: jest.fn(),
            updateDeviceConnection: jest.fn(),
        };

        useCase = new ProcessLocationData(mockRepository);
    });

    describe('execute', () => {
        it('deve salvar dados de localização válidos', async () => {
            const locationDTO: ParsedLocationDTO = {
                timestamp: 1705708800,
                latitude: -23.550520,
                longitude: -46.633308,
                speed: 60,
                direction: 180,
                distance: 1000,
                horimeter: 500,
                gpsFixed: true,
                gpsHistorical: false,
                ignitionOn: true,
            };

            const packetDTO: ParsedPacketDTO = {
                deviceId: '0A3F73',
                messageType: 0x02,
                rawHex: '50F70A3F73...',
                location: locationDTO,
            };

            await useCase.execute(packetDTO);

            expect(mockRepository.saveLocation).toHaveBeenCalledTimes(1);
            expect(mockRepository.saveLocation).toHaveBeenCalledWith(
                '0A3F73',
                expect.any(Location)
            );
        });

        it('deve lançar erro se o pacote não tem dados de localização', async () => {
            const packetDTO: ParsedPacketDTO = {
                deviceId: '0A3F73',
                messageType: 0x01,
                rawHex: '50F70A3F730173C4',
                location: undefined,
            };

            await expect(useCase.execute(packetDTO)).rejects.toThrow(
                'Pacote não contém dados de localização'
            );
            expect(mockRepository.saveLocation).not.toHaveBeenCalled();
        });

        it('deve ignorar localização com coordenadas GPS (0,0)', async () => {
            const locationDTO: ParsedLocationDTO = {
                timestamp: 1705708800,
                latitude: 0,
                longitude: 0,
                speed: 0,
                direction: 0,
                distance: 1000,
                horimeter: 500,
                gpsFixed: false,
                gpsHistorical: false,
                ignitionOn: false,
            };

            const packetDTO: ParsedPacketDTO = {
                deviceId: '0A3F73',
                messageType: 0x02,
                rawHex: '50F70A3F73...',
                location: locationDTO,
            };

            await useCase.execute(packetDTO);

            expect(mockRepository.saveLocation).not.toHaveBeenCalled();
        });

        it('deve lidar com localização com GPS não fixado', async () => {
            const locationDTO: ParsedLocationDTO = {
                timestamp: 1705708800,
                latitude: -23.550520,
                longitude: -46.633308,
                speed: 60,
                direction: 180,
                distance: 1000,
                horimeter: 500,
                gpsFixed: false,
                gpsHistorical: false,
                ignitionOn: true,
            };

            const packetDTO: ParsedPacketDTO = {
                deviceId: '0A3F73',
                messageType: 0x02,
                rawHex: '50F70A3F73...',
                location: locationDTO,
            };

            await useCase.execute(packetDTO);

            expect(mockRepository.saveLocation).toHaveBeenCalledTimes(1);
        });

        it('deve lidar com localização GPS histórica', async () => {
            const locationDTO: ParsedLocationDTO = {
                timestamp: 1705708800,
                latitude: -23.550520,
                longitude: -46.633308,
                speed: 60,
                direction: 180,
                distance: 1000,
                horimeter: 500,
                gpsFixed: true,
                gpsHistorical: true,
                ignitionOn: true,
            };

            const packetDTO: ParsedPacketDTO = {
                deviceId: '0A3F73',
                messageType: 0x02,
                rawHex: '50F70A3F73...',
                location: locationDTO,
            };

            await useCase.execute(packetDTO);

            expect(mockRepository.saveLocation).toHaveBeenCalledTimes(1);
        });

        it('deve passar entidade Location correta para o repositório', async () => {
            const locationDTO: ParsedLocationDTO = {
                timestamp: 1705708800,
                latitude: -23.550520,
                longitude: -46.633308,
                speed: 60,
                direction: 180.5,
                distance: 1500,
                horimeter: 1000,
                gpsFixed: true,
                gpsHistorical: false,
                ignitionOn: true,
            };

            const packetDTO: ParsedPacketDTO = {
                deviceId: '0A3F73',
                messageType: 0x02,
                rawHex: '50F70A3F73...',
                location: locationDTO,
            };

            await useCase.execute(packetDTO);

            const savedLocation = mockRepository.saveLocation.mock.calls[0][1];
            expect(savedLocation.latitude).toBe(-23.550520);
            expect(savedLocation.longitude).toBe(-46.633308);
            expect(savedLocation.speed).toBe(60);
            expect(savedLocation.direction).toBe(180.5);
            expect(savedLocation.distance).toBe(1500);
            expect(savedLocation.horimeter).toBe(1000);
            expect(savedLocation.gpsFixed).toBe(true);
            expect(savedLocation.ignitionOn).toBe(true);
        });

        it('deve rejeitar dados de device não autorizado', async () => {
            const parsed: ParsedPacketDTO = {
                deviceId: 'UNAUTHORIZED123',
                messageType: 0x02,
                rawHex: '50F70A3F73...',
                location: {
                    timestamp: 1705708800,
                    latitude: -23.550520,
                    longitude: -46.633308,
                    speed: 60,
                    direction: 180,
                    distance: 1000,
                    horimeter: 500,
                    gpsFixed: true,
                    gpsHistorical: false,
                    ignitionOn: true,
                },
            };

            await expect(useCase.execute(parsed)).rejects.toThrow(
                'Dispositivo não autorizado'
            );
            expect(mockRepository.saveLocation).not.toHaveBeenCalled();});
    });
});
