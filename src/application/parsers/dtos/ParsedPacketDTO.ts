import { ParsedLocationDTO } from "./ParsedLocationDTO";

/**
 * DTO com pacote completo parseado do protocolo SFT9001
 * Não tem dependência com entities do Domain
 */
export interface ParsedPacketDTO {
    deviceId: string;                 
    messageType: number;                
    rawHex: string;
    location: ParsedLocationDTO | undefined; 
}

/**
 * Type guards para facilitar identificação do tipo
 */
export namespace ParsedPacketDTO {
    /**
     * Verifica se é pacote de heartbeat/ping (0x01)
     * Mantém conexão ativa, atualiza lastConnection
     */
    export function isHeartbeat(packet: ParsedPacketDTO): boolean {
        return packet.messageType === 0x01;
    }
    
    /**
     * Verifica se é pacote de localização (0x02)
     * Contém dados GPS completos
     */
    export function isLocation(packet: ParsedPacketDTO): packet is ParsedPacketDTO & { location: ParsedLocationDTO } {
        return packet.messageType === 0x02 && packet.location !== undefined;
    }
}
