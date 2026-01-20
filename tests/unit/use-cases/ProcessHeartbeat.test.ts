import { ProcessHeartbeat } from '../../../src/application/use-cases/ProcessHeartbeat';
import { ILocationRepository } from '../../../src/domain/repositories/ILocationRepository';
import { ParsedPacketDTO } from '../../../src/application/parsers/dtos/ParsedPacketDTO';

describe('ProcessHeartbeat', () => {
  let mockRepository: jest.Mocked<ILocationRepository>;
  let useCase: ProcessHeartbeat;

  beforeEach(() => {
    mockRepository = {
      saveLocation: jest.fn(),
      getLastLocation: jest.fn(),
      updateDeviceConnection: jest.fn(),
    };

    useCase = new ProcessHeartbeat(mockRepository);
  });

  describe('execute', () => {
    it('deve atualizar a conexão do dispositivo para heartbeat válido', async () => {
      const packetDTO: ParsedPacketDTO = {
        deviceId: '0A3F73',
        messageType: 0x01,
        rawHex: '50F70A3F730173C4',
        location: undefined,
      };

      await useCase.execute(packetDTO);

      expect(mockRepository.updateDeviceConnection).toHaveBeenCalledTimes(1);
      expect(mockRepository.updateDeviceConnection).toHaveBeenCalledWith('0A3F73');
    });

    it('deve lançar erro se o pacote não for heartbeat', async () => {
      const packetDTO: ParsedPacketDTO = {
        deviceId: '0A3F73',
        messageType: 0x02,
        rawHex: '50F70A3F7302...',
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

      await expect(useCase.execute(packetDTO)).rejects.toThrow(
        'Pacote não é de heartbeat'
      );
      expect(mockRepository.updateDeviceConnection).not.toHaveBeenCalled();
    });

    it('deve lidar com diferentes IDs de dispositivos', async () => {
      const packetDTO1: ParsedPacketDTO = {
        deviceId: 'DEVICE1',
        messageType: 0x01,
        rawHex: '50F7...',
        location: undefined,
      };

      const packetDTO2: ParsedPacketDTO = {
        deviceId: 'DEVICE2',
        messageType: 0x01,
        rawHex: '50F7...',
        location: undefined,
      };

      await useCase.execute(packetDTO1);
      await useCase.execute(packetDTO2);

      expect(mockRepository.updateDeviceConnection).toHaveBeenCalledTimes(2);
      expect(mockRepository.updateDeviceConnection).toHaveBeenNthCalledWith(1, 'DEVICE1');
      expect(mockRepository.updateDeviceConnection).toHaveBeenNthCalledWith(2, 'DEVICE2');
    });
  });
});
