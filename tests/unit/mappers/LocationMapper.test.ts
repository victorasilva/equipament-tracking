import { LocationMapper } from '../../../src/application/mappers/LocationMapper';
import { ParsedLocationDTO } from '../../../src/application/parsers/dtos/ParsedLocationDTO';
import { Location } from '../../../src/domain/entities/Location';

describe('LocationMapper', () => {
  describe('toDomain', () => {
    it('deve converter ParsedLocationDTO para entidade Location', () => {
      const dto: ParsedLocationDTO = {
        timestamp: 4015107504,
        latitude: 30.922816,
        longitude: 43.985805,
        speed: 60,
        direction: 59.86,
        distance: 3200,
        horimeter: 2250,
        gpsFixed: true,
        gpsHistorical: false,
        ignitionOn: true,
      };

      const location = LocationMapper.toDomain(dto);

      expect(location).toBeInstanceOf(Location);
      expect(location.latitude).toBe(30.922816);
      expect(location.longitude).toBe(43.985805);
      expect(location.speed).toBe(60);
      expect(location.direction).toBe(59.86);
      expect(location.distance).toBe(3200);
      expect(location.horimeter).toBe(2250);
      expect(location.gpsFixed).toBe(true);
      expect(location.gpsHistorical).toBe(false);
      expect(location.ignitionOn).toBe(true);
      expect(location.timestamp).toEqual(new Date(4015107504000));
    });

    it('deve converter corretamente o timestamp Unix para Date', () => {
      const dto: ParsedLocationDTO = {
        timestamp: 1705708800,
        latitude: 0,
        longitude: 0,
        speed: 0,
        direction: 0,
        distance: 0,
        horimeter: 0,
        gpsFixed: false,
        gpsHistorical: false,
        ignitionOn: false,
      };

      const location = LocationMapper.toDomain(dto);

      expect(location.timestamp.getTime()).toBe(1705708800000);
    });

    it('deve lidar com GPS não fixado', () => {
      const dto: ParsedLocationDTO = {
        timestamp: 1705708800,
        latitude: 0,
        longitude: 0,
        speed: 0,
        direction: 0,
        distance: 0,
        horimeter: 0,
        gpsFixed: false,
        gpsHistorical: false,
        ignitionOn: false,
      };

      const location = LocationMapper.toDomain(dto);

      expect(location.gpsFixed).toBe(false);
    });

    it('deve lidar com dados históricos de GPS', () => {
      const dto: ParsedLocationDTO = {
        timestamp: 1705708800,
        latitude: -23.550520,
        longitude: -46.633308,
        speed: 40,
        direction: 180.5,
        distance: 1500,
        horimeter: 1000,
        gpsFixed: true,
        gpsHistorical: true,
        ignitionOn: false,
      };

      const location = LocationMapper.toDomain(dto);

      expect(location.gpsHistorical).toBe(true);
    });
  });
});
