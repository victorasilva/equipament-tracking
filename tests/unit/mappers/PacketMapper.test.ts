import { PacketMapper } from '../../../src/application/mappers/PacketMapper';
import { ParsedPacketDTO } from '../../../src/application/parsers/dtos/ParsedPacketDTO';
import { ParsedLocationDTO } from '../../../src/application/parsers/dtos/ParsedLocationDTO';
import { GPSPacket } from '../../../src/domain/entities/GPSPacket';

describe('PacketMapper', () => {
  describe('toDomain', () => {
    it('deve converter pacote de localização para entidade GPSPacket', () => {
      const locationDTO: ParsedLocationDTO = {
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

      const packetDTO: ParsedPacketDTO = {
        deviceId: '0A3F73',
        messageType: 0x02,
        rawHex: '50F70A3F7302EEFCF950176200000C80000008CAF8003C01D7D840029F2B8D73C4',
        location: locationDTO,
      };

      const packet = PacketMapper.toDomain(packetDTO);

      expect(packet).toBeInstanceOf(GPSPacket);
      expect(packet.deviceId).toBe('0A3F73');
      expect(packet.messageType).toBe(0x02);
      expect(packet.rawHex).toBe('50F70A3F7302EEFCF950176200000C80000008CAF8003C01D7D840029F2B8D73C4');
      expect(packet.location).toBeDefined();
      expect(packet.location?.latitude).toBe(30.922816);
      expect(packet.location?.longitude).toBe(43.985805);
    });

    it('deve converter pacote de heartbeat sem localização', () => {
      const packetDTO: ParsedPacketDTO = {
        deviceId: '0A3F73',
        messageType: 0x01,
        rawHex: '50F70A3F730173C4',
        location: undefined,
      };

      const packet = PacketMapper.toDomain(packetDTO);

      expect(packet).toBeInstanceOf(GPSPacket);
      expect(packet.deviceId).toBe('0A3F73');
      expect(packet.messageType).toBe(0x01);
      expect(packet.location).toBeUndefined();
    });
  });
});
