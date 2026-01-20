import { GPSPacket } from "../../domain/entities/GPSPacket";
import { ParsedPacketDTO } from "../parsers/dtos/ParsedPacketDTO";
import { LocationMapper } from "./LocationMapper";

/**
 * Responsabilidade: Converter pacote parseado em Entity do domínio
 * Orquestra a conversão de sub-objetos como Location
 */
export class PacketMapper {
    
    static toDomain(dto: ParsedPacketDTO): GPSPacket {

        const location = dto.location ? LocationMapper.toDomain(dto.location): undefined;
        
        return new GPSPacket(
            dto.deviceId,
            dto.messageType,
            dto.rawHex,
            location
        );
    }
}
