import { ProtocolFramer } from '../../../src/application/parsers/ProtocolFramer';

describe('ProtocolFramer', () => {
  let framer: ProtocolFramer;

  beforeEach(() => {
    framer = new ProtocolFramer();
  });

  describe('feed and getPackets', () => {
    it('deve extrair pacote completo de localização', () => {
      const hex = '50F70A3F7302EEFCF950176200000C80000008CAF8003C01D7D840029F2B8D73C4';
      const buffer = Buffer.from(hex, 'hex');

      framer.feed(buffer);
      const packets = framer.getPackets();

      expect(packets).toHaveLength(1);
      expect(packets[0].toString('hex')).toBe(hex.toLowerCase());
    });

    it('deve extrair pacote completo de heartbeat', () => {
      const buffer = Buffer.alloc(8);
      buffer.writeUInt16BE(0x50F7, 0);
      buffer.write('0A3F73', 2, 3, 'hex');
      buffer.writeUInt8(0x01, 5);
      buffer.writeUInt16BE(0x73C4, 6);

      framer.feed(buffer);
      const packets = framer.getPackets();

      expect(packets).toHaveLength(1);
      expect(packets[0].length).toBe(8);
    });

    it('deve lidar com pacote fragmentado', () => {
      const hex = '50F70A3F7302EEFCF950176200000C80000008CAF8003C01D7D840029F2B8D73C4';
      const buffer = Buffer.from(hex, 'hex');
      const part1 = buffer.subarray(0, 10);
      const part2 = buffer.subarray(10);
      framer.feed(part1);
      let packets = framer.getPackets();
      expect(packets).toHaveLength(0);

      framer.feed(part2);
      packets = framer.getPackets();
      expect(packets).toHaveLength(1);
      expect(packets[0].toString('hex')).toBe(hex.toLowerCase());
    });

    it('deve lidar com múltiplos pacotes em um único buffer', () => {
      const packet1 = Buffer.alloc(8);
      packet1.writeUInt16BE(0x50F7, 0);
      packet1.write('0A3F73', 2, 3, 'hex');
      packet1.writeUInt8(0x01, 5);
      packet1.writeUInt16BE(0x73C4, 6);

      const packet2 = Buffer.alloc(8);
      packet2.writeUInt16BE(0x50F7, 0);
      packet2.write('0B4F84', 2, 3, 'hex');
      packet2.writeUInt8(0x01, 5);
      packet2.writeUInt16BE(0x73C4, 6);

      const combined = Buffer.concat([packet1, packet2]);

      framer.feed(combined);
      const packets = framer.getPackets();

      expect(packets).toHaveLength(2);
      expect(packets[0].toString('hex')).toContain('0a3f73');
      expect(packets[1].toString('hex')).toContain('0b4f84');
    });

    it('deve descartar dados antes do cabeçalho', () => {
      const garbage = Buffer.from([0xFF, 0xFF, 0xAA, 0xBB]);
      const validPacket = Buffer.alloc(8);
      validPacket.writeUInt16BE(0x50F7, 0);
      validPacket.write('0A3F73', 2, 3, 'hex');
      validPacket.writeUInt8(0x01, 5);
      validPacket.writeUInt16BE(0x73C4, 6);

      const combined = Buffer.concat([garbage, validPacket]);

      framer.feed(combined);
      const packets = framer.getPackets();

      expect(packets).toHaveLength(1);
      expect(packets[0].length).toBe(8);
    });

    it('deve retornar array vazio quando nenhum pacote completo estiver disponível', () => {
      const buffer = Buffer.from([0x50, 0xF7, 0x0A]);

      framer.feed(buffer);
      const packets = framer.getPackets();

      expect(packets).toHaveLength(0);
    });

    it('deve descartar pacote com footer inválido', () => {
      const buffer = Buffer.alloc(8);
      buffer.writeUInt16BE(0x50F7, 0);
      buffer.write('0A3F73', 2, 3, 'hex');
      buffer.writeUInt8(0x01, 5);
      buffer.writeUInt16BE(0xFFFF, 6);

      framer.feed(buffer);
      const packets = framer.getPackets();

      expect(packets).toHaveLength(0);
    });

    it('deve lidar com limite de tamanho do buffer', () => {
      const hugeBuffer = Buffer.alloc(15000);

      framer.feed(hugeBuffer);

      expect(framer.getBufferSize()).toBeLessThanOrEqual(1024);
    });
  });

  describe('reset', () => {
    it('deve limpar o buffer interno', () => {
      const buffer = Buffer.from([0x50, 0xF7, 0x0A]);
      framer.feed(buffer);
      expect(framer.getBufferSize()).toBeGreaterThan(0);

      framer.reset();

      expect(framer.getBufferSize()).toBe(0);
    });
  });

  describe('getBufferSize', () => {
    it('deve retornar o tamanho atual do buffer', () => {
      const buffer = Buffer.from([0x50, 0xF7, 0x0A, 0x3F, 0x73]);

      framer.feed(buffer);

      expect(framer.getBufferSize()).toBe(5);
    });

    it('deve retornar 0 para buffer vazio', () => {
      expect(framer.getBufferSize()).toBe(0);
    });
  });
});
