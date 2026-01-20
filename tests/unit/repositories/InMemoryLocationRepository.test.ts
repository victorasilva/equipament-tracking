import { InMemoryLocationRepository } from '../../../src/domain/repositories/InMemoryLocationRepository';
import { Location } from '../../../src/domain/entities/Location';

describe('InMemoryLocationRepository', () => {
  let repository: InMemoryLocationRepository;

  beforeEach(() => {
    repository = new InMemoryLocationRepository();
  });

  describe('saveLocation', () => {
    it('deve salvar uma localização para um dispositivo', async () => {
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

      await repository.saveLocation(deviceId, location);
      const result = await repository.getLastLocation(deviceId);

      expect(result).toBeDefined();
      expect(result?.latitude).toBe(-23.550520);
      expect(result?.longitude).toBe(-46.633308);
    });

    it('deve manter histórico de localizações', async () => {
      const deviceId = '0A3F73';
      const location1 = new Location(-23.0, -46.0, new Date('2024-01-01'), 50, 90, 100, 100, true, false, true);
      const location2 = new Location(-23.1, -46.1, new Date('2024-01-02'), 60, 100, 200, 200, true, false, true);

      await repository.saveLocation(deviceId, location1);
      await repository.saveLocation(deviceId, location2);
      const history = await repository.getLocationHistory(deviceId);

      expect(history).toHaveLength(2);
    });

    it('deve limitar histórico a 100 localizações por dispositivo', async () => {
      const deviceId = '0A3F73';

      for (let i = 0; i < 150; i++) {
        const location = new Location(
          -23.0 + i * 0.001,
          -46.0,
          new Date(),
          50,
          90,
          i,
          i,
          true,
          false,
          true
        );
        await repository.saveLocation(deviceId, location);
      }

      const history = await repository.getLocationHistory(deviceId);

      expect(history).toHaveLength(100);
    });
  });

  describe('getLastLocation', () => {
    it('deve retornar null para dispositivo desconhecido', async () => {
      const result = await repository.getLastLocation('UNKNOWN');

      expect(result).toBeNull();
    });

    it('deve retornar a localização mais recente', async () => {
      const deviceId = '0A3F73';
      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-01-02');

      const location1 = new Location(-23.0, -46.0, oldDate, 50, 90, 100, 100, true, false, true);
      const location2 = new Location(-23.1, -46.1, newDate, 60, 100, 200, 200, true, false, true);

      await repository.saveLocation(deviceId, location1);
      await repository.saveLocation(deviceId, location2);
      const result = await repository.getLastLocation(deviceId);

      expect(result?.timestamp).toEqual(newDate);
      expect(result?.latitude).toBe(-23.1);
    });

    it('deve retornar a mais recente mesmo se salva fora de ordem', async () => {
      const deviceId = '0A3F73';
      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-01-03');
      const midDate = new Date('2024-01-02');

      const location1 = new Location(-23.0, -46.0, newDate, 50, 90, 100, 100, true, false, true);
      const location2 = new Location(-23.1, -46.1, oldDate, 60, 100, 200, 200, true, false, true);
      const location3 = new Location(-23.2, -46.2, midDate, 70, 110, 300, 300, true, false, true);

      await repository.saveLocation(deviceId, location1);
      await repository.saveLocation(deviceId, location2);
      await repository.saveLocation(deviceId, location3);
      const result = await repository.getLastLocation(deviceId);

      expect(result?.timestamp).toEqual(newDate);
      expect(result?.latitude).toBe(-23.0);
    });
  });

  describe('getLocationHistory', () => {
    it('deve retornar array vazio para dispositivo desconhecido', async () => {
      const result = await repository.getLocationHistory('UNKNOWN');

      expect(result).toEqual([]);
    });

    it('deve retornar localizações ordenadas por timestamp decrescente', async () => {
      const deviceId = '0A3F73';
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');
      const date3 = new Date('2024-01-03');

      const location1 = new Location(-23.0, -46.0, date1, 50, 90, 100, 100, true, false, true);
      const location2 = new Location(-23.1, -46.1, date2, 60, 100, 200, 200, true, false, true);
      const location3 = new Location(-23.2, -46.2, date3, 70, 110, 300, 300, true, false, true);

      await repository.saveLocation(deviceId, location1);
      await repository.saveLocation(deviceId, location2);
      await repository.saveLocation(deviceId, location3);
      const result = await repository.getLocationHistory(deviceId);

      expect(result).toHaveLength(3);
      expect(result[0].timestamp).toEqual(date3);
      expect(result[1].timestamp).toEqual(date2);
      expect(result[2].timestamp).toEqual(date1);
    });

    it('deve respeitar parâmetro de limite', async () => {
      const deviceId = '0A3F73';

      for (let i = 0; i < 10; i++) {
        const location = new Location(-23.0, -46.0, new Date(), 50, 90, i, i, true, false, true);
        await repository.saveLocation(deviceId, location);
      }

      const result = await repository.getLocationHistory(deviceId, 5);

      expect(result).toHaveLength(5);
    });
  });

  describe('updateDeviceConnection', () => {
    it('deve inicializar entrada do dispositivo se não existir', async () => {
      const deviceId = '0A3F73';

      await repository.updateDeviceConnection(deviceId);
      const result = await repository.getLocationHistory(deviceId);

      expect(result).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas zeradas para repositório vazio', () => {
      const stats = repository.getStats();

      expect(stats.devices).toBe(0);
      expect(stats.totalLocations).toBe(0);
    });

    it('deve retornar contagem correta de dispositivos', async () => {
      const location = new Location(-23.0, -46.0, new Date(), 50, 90, 100, 100, true, false, true);

      await repository.saveLocation('DEVICE1', location);
      await repository.saveLocation('DEVICE2', location);
      await repository.saveLocation('DEVICE3', location);
      const stats = repository.getStats();

      expect(stats.devices).toBe(3);
    });

    it('deve retornar contagem total correta de localizações', async () => {
      const location = new Location(-23.0, -46.0, new Date(), 50, 90, 100, 100, true, false, true);

      await repository.saveLocation('DEVICE1', location);
      await repository.saveLocation('DEVICE1', location);
      await repository.saveLocation('DEVICE2', location);
      const stats = repository.getStats();

      expect(stats.devices).toBe(2);
      expect(stats.totalLocations).toBe(3);
    });
  });
});
