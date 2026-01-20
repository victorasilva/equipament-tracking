import { SFT9001Parser } from '../../../src/application/parsers/SFT9001Parser';

describe('SFT9001Parser', () => {
  let parser: SFT9001Parser;

  beforeEach(() => {
    parser = new SFT9001Parser();
  });

  describe('parse - Location Packet', () => {
    it('deve fazer parse de pacote de localização válido', () => {
      const hex = '50F70A3F7302EEFCF950176200000C80000008CAF8003C01D7D840029F2B8D73C4';
      const buffer = Buffer.from(hex, 'hex');

      const result = parser.parse(buffer);

      expect(result).not.toBeNull();
      expect(result?.deviceId).toBe('0A3F73');
      expect(result?.messageType).toBe(0x02);
      expect(result?.location).toBeDefined();
      expect(result?.location?.latitude).toBeCloseTo(30.922816, 5);
      expect(result?.location?.longitude).toBeCloseTo(43.985805, 5);
      expect(result?.location?.speed).toBe(60);
      expect(result?.rawHex).toBe(hex.toLowerCase());
    });

    it('deve fazer parse de todos os campos de localização corretamente', () => {
      const hex = '50F70A3F7302EEFCF950176200000C80000008CAF8003C01D7D840029F2B8D73C4';
      const buffer = Buffer.from(hex, 'hex');

      const result = parser.parse(buffer);

      expect(result?.location?.timestamp).toBe(4009556304);
      expect(result?.location?.direction).toBeCloseTo(59.86, 2);
      expect(result?.location?.distance).toBe(3200);
      expect(result?.location?.horimeter).toBe(2250);
      expect(result?.location?.gpsFixed).toBe(false);
      expect(result?.location?.gpsHistorical).toBe(false);
      expect(result?.location?.ignitionOn).toBe(false);
    });

    it('deve retornar null para latitude inválida', () => {
      const buffer = Buffer.alloc(33);
      buffer.writeUInt16BE(0x50F7, 0);
      buffer.write('0A3F73', 2, 3, 'hex');
      buffer.writeUInt8(0x02, 5);
      buffer.writeUInt32BE(1705708800, 6);
      buffer.writeUInt16BE(9000, 10);
      buffer.writeUInt32BE(1000, 12);
      buffer.writeUInt32BE(500, 16);
      buffer.writeUInt16BE(0x0001, 20);
      buffer.writeUInt8(50, 22);
      buffer.writeInt32BE(100000000, 23);
      buffer.writeInt32BE(43985805, 27);
      buffer.writeUInt16BE(0x73C4, 31);

      const result = parser.parse(buffer);

      expect(result).toBeNull();
    });

    it('deve retornar null para longitude inválida', () => {
      const buffer = Buffer.alloc(33);
      buffer.writeUInt16BE(0x50F7, 0);
      buffer.write('0A3F73', 2, 3, 'hex');
      buffer.writeUInt8(0x02, 5);
      buffer.writeUInt32BE(1705708800, 6);
      buffer.writeUInt16BE(9000, 10);
      buffer.writeUInt32BE(1000, 12);
      buffer.writeUInt32BE(500, 16);
      buffer.writeUInt16BE(0x0001, 20);
      buffer.writeUInt8(50, 22);
      buffer.writeInt32BE(30922816, 23);
      buffer.writeInt32BE(200000000, 27);
      buffer.writeUInt16BE(0x73C4, 31);

      const result = parser.parse(buffer);

      expect(result).toBeNull();
    });

    it('deve fazer parse das flags de composição GPS corretamente', () => {
      const buffer = Buffer.alloc(33);
      buffer.writeUInt16BE(0x50F7, 0);
      buffer.write('0A3F73', 2, 3, 'hex');
      buffer.writeUInt8(0x02, 5);
      buffer.writeUInt32BE(1705708800, 6);
      buffer.writeUInt16BE(9000, 10);
      buffer.writeUInt32BE(1000, 12);
      buffer.writeUInt32BE(500, 16);
      buffer.writeUInt16BE(0b0000000000000111, 20);
      buffer.writeUInt8(50, 22);
      buffer.writeInt32BE(30922816, 23);
      buffer.writeInt32BE(43985805, 27);
      buffer.writeUInt16BE(0x73C4, 31);

      const result = parser.parse(buffer);

      expect(result?.location?.gpsFixed).toBe(true);
      expect(result?.location?.gpsHistorical).toBe(true);
      expect(result?.location?.ignitionOn).toBe(true);
    });
  });

  describe('parse - Heartbeat Packet', () => {
    it('deve fazer parse de pacote de heartbeat válido', () => {
      const buffer = Buffer.alloc(8);
      buffer.writeUInt16BE(0x50F7, 0);
      buffer.write('0A3F73', 2, 3, 'hex');
      buffer.writeUInt8(0x01, 5);
      buffer.writeUInt16BE(0x73C4, 6);

      const result = parser.parse(buffer);

      expect(result).not.toBeNull();
      expect(result?.deviceId).toBe('0A3F73');
      expect(result?.messageType).toBe(0x01);
      expect(result?.location).toBeUndefined();
    });
  });

  describe('parse - Invalid Packets', () => {
    it('deve retornar null para tipo de mensagem desconhecido', () => {
      const buffer = Buffer.alloc(10);
      buffer.writeUInt16BE(0x50F7, 0);
      buffer.write('0A3F73', 2, 3, 'hex');
      buffer.writeUInt8(0xFF, 5);
      buffer.writeUInt16BE(0x73C4, 8);

      const result = parser.parse(buffer);

      expect(result).toBeNull();
    });

    it('deve lidar com erros de parse graciosamente', () => {
      const buffer = Buffer.from([0x50, 0xF7]);

      const result = parser.parse(buffer);

      expect(result).toBeNull();
    });
  });

  describe('createPingAckResponse', () => {
    it('deve criar resposta de ping válida', () => {
      const response = SFT9001Parser.createPingAckResponse();

      expect(response).toBeInstanceOf(Buffer);
      expect(response.length).toBe(13);
      expect(response.readUInt16BE(0)).toBe(0x50F7);
      expect(response.readUInt8(2)).toBe(0x01);
      expect(response.readUInt16BE(11)).toBe(0x73C4);
    });
  });
});
