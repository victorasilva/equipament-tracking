import { ILocationRepository } from "../../domain/repositories/ILocationRepository";
import { ParsedPacketDTO } from "../parsers/dtos/ParsedPacketDTO";

/**
 * Use Case: Processar heartbeat/ping do device
 * 
 * Heartbeat mantém conexão ativa e atualiza timestamp de última comunicação
 * Não contém dados de localização GPS
 */
export class ProcessHeartbeat {
    constructor(
        private readonly locationRepository: ILocationRepository
    ) { }

    async execute(packetDTO: ParsedPacketDTO): Promise<void> {
        if (!ParsedPacketDTO.isHeartbeat(packetDTO)) {
            throw new Error('Pacote não é de heartbeat');
        }

        await this.locationRepository.updateDeviceConnection(packetDTO.deviceId);
    }
}