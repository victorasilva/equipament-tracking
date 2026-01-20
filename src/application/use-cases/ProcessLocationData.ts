import { ILocationRepository } from "../../domain/repositories/ILocationRepository";
import { ParsedPacketDTO } from "../parsers/dtos/ParsedPacketDTO";
import { PacketMapper } from "../mappers/PacketMapper";
import { isAuthorized } from "../../shared/utils/deviceAuthorization";

export class ProcessLocationData {
    constructor(
        private readonly locationRepository: ILocationRepository
    ) {}
    
    async execute(packetDTO: ParsedPacketDTO): Promise<void> {
        if (!isAuthorized(packetDTO.deviceId)) {
            throw new Error('Dispositivo não autorizado');
        }
        
        if (!ParsedPacketDTO.isLocation(packetDTO)) {
            throw new Error('Pacote não contém dados de localização');
        }
        
        const packet = PacketMapper.toDomain(packetDTO);
        
        if (!packet.location) {
            throw new Error('Localização inválida');
        }
        
        if (packet.location.latitude === 0 && packet.location.longitude === 0) {
            console.log(`[UseCase] GPS sem sinal para device ${packet.deviceId} - ignorando`);
            return;
        }
        
        if (!packet.location.gpsFixed) {
            console.log(`[UseCase] GPS não fixado para device ${packet.deviceId} - precisão pode ser insuficiente`);
        }
        
        if (packet.location.gpsHistorical) {
            console.log(`[UseCase] Localização histórica do device ${packet.deviceId} - enviada sem conexão 2G ou servidor offline`);
        }
        
        await this.locationRepository.saveLocation(
            packet.deviceId,
            packet.location
        );
    }
}
