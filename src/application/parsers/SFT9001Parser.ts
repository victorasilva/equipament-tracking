import { ParsedPacketDTO } from "./dtos/ParsedPacketDTO";
import { ParsedLocationDTO } from "./dtos/ParsedLocationDTO";

export class SFT9001Parser {

    // Constantes
    private static readonly HEADER = 0x50F7;
    private static readonly FOOTER = 0x73C4;
    private static readonly MSG_TYPE_PING = 0x01;
    private static readonly MSG_TYPE_LOCATION = 0x02;

    // Offsets da estrutura do pacote
    private static readonly OFFSET_DEVICE_ID = 2;
    private static readonly OFFSET_MSG_TYPE = 5;
    private static readonly OFFSET_DATA = 6;

    // Tamanhos
    private static readonly SIZE_DEVICE_ID = 3;

    /**
     * Parse principal - identifica tipo de mensagem
     * 
     * IMPORTANTE: Este parser assume que o buffer foi validado pelo ProtocolFramer!
     * - Header 50F7 já foi validado
     * - Footer 73C4 já foi validado
     * - Tamanho do pacote já foi validado
     */

    parse(buffer: Buffer): ParsedPacketDTO | null {

        try {

            const deviceIdEnd = SFT9001Parser.OFFSET_DEVICE_ID + SFT9001Parser.SIZE_DEVICE_ID;
            const deviceId = buffer.subarray(SFT9001Parser.OFFSET_DEVICE_ID, deviceIdEnd).toString('hex').toUpperCase();

            const messageType = buffer.readUInt8(SFT9001Parser.OFFSET_MSG_TYPE);

            if (messageType === SFT9001Parser.MSG_TYPE_LOCATION) {
                return this.parseLocationPacket(buffer, deviceId);
            } else if (messageType === SFT9001Parser.MSG_TYPE_PING) {
                return this.parseHeartbeatPacket(buffer, deviceId);
            } else {
                console.log(`[Parser] Tipo de mensagem desconhecido: ${messageType}`);
                return null;
            }

        } catch (error) {
            console.error('[Parser] Erro ao fazer parse:', error);
            return null;
        }
    }

    /**
     * Parse de pacote de localização (tipo 0x02)
     */
    private parseLocationPacket(buffer: Buffer, deviceId: string): ParsedPacketDTO | null {
        try {

            let offset = SFT9001Parser.OFFSET_DATA;

            // Timestamp UNIX (4 bytes)
            const timestamp = buffer.readUInt32BE(offset);
            offset += 4;

            const directionRaw = buffer.readUInt16BE(offset);
            const direction = directionRaw / 100;
            offset += 2;

            const distance = buffer.readUInt32BE(offset);
            offset += 4;

            // 4. Horímetro/Tempo reportando (4 bytes) - em minutos
            // NOTA: Quando atinge valor máximo (UInt32 = 4.294.967.295), reseta para 0
            const horimeter = buffer.readUInt32BE(offset);
            offset += 4;
            
            // Composição (2 bytes) - bits de status
            const composition = buffer.readUInt16BE(offset);
            offset += 2;

            // Bit 1: GPS fixado - indica se lat/lng têm precisão suficiente para localizar no mapa
            const gpsFixed = (composition & 0b0000000000000001) !== 0;

            // Bit 2: GPS histórico - localização enviada quando device não tinha 2G ou servidor offline
            const gpsHistorical = (composition & 0b0000000000000010) !== 0;

            // Bit 3: Ignição ligada
            const ignitionOn = (composition & 0b0000000000000100) !== 0;

            // Bits 4-8: Entradas digitais (sensores: presença, portas, etc)
            // Bits 9-12: Saídas digitais (relés, atuadores, etc)
            // Bits 13-16: Reservados para uso futuro

            const speed = buffer.readUInt8(offset);
            offset += 1;

            //Latitude e Logitude (4 bytes) - dividir por 1.000.000 para obter decimal
            const latitudeRaw = buffer.readInt32BE(offset);
            const latitude = latitudeRaw / 1000000;
            offset += 4;
            const longitudeRaw = buffer.readInt32BE(offset);
            const longitude = longitudeRaw / 1000000;
            offset += 4;

            if (latitude === 0 && longitude === 0) {
                console.log('GPS sem sinal (0,0)');
            }

            if (latitude < -90 || latitude > 90) {
                console.log(`Latitude inválida: ${latitude}`);
                return null;
            }

            if (longitude < -180 || longitude > 180) {
                console.log(`Longitude inválida: ${longitude}`);
                return null;
            }

            // Criar DTO de localização
            const locationDTO: ParsedLocationDTO = {
                timestamp,
                latitude,
                longitude,
                speed,
                direction,
                distance,
                horimeter,
                gpsFixed,
                gpsHistorical,
                ignitionOn
            };

            // Criar DTO do pacote completo
            const packetDTO: ParsedPacketDTO = {
                deviceId,
                messageType: SFT9001Parser.MSG_TYPE_LOCATION,
                rawHex: buffer.toString('hex'),
                location: locationDTO
            };

            console.log(`[Parser] Localização parseada: Device ${deviceId}, Lat: ${latitude}, Lng: ${longitude}`);

            return packetDTO;

        } catch (error) {
            console.error('Erro ao parsear localização:', error);
            return null;
        }
    }

    /**
     * Parse de pacote Heartbeat/Ping (tipo 0x01)
     * Estrutura simples: apenas confirma que dispositivo está ativo
     */
    private parseHeartbeatPacket(buffer: Buffer, deviceId: string): ParsedPacketDTO {

        console.log(`Heartbeat recebido do device ${deviceId}`);

        return {
            deviceId,
            messageType: SFT9001Parser.MSG_TYPE_PING,
            rawHex: buffer.toString('hex'),
            location: undefined
        };
    }

    /**
     * Cria resposta Ping ACK para enviar de volta ao dispositivo
     */
    static createPingAckResponse(): Buffer {
        const buffer = Buffer.alloc(13);
        buffer.writeUInt16BE(SFT9001Parser.HEADER, 0);
        buffer.writeUInt8(0x01, 2);
        buffer.writeUInt16BE(SFT9001Parser.FOOTER, 11);

        return buffer;
    }
}

