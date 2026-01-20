import { Location } from "../../domain/entities/Location";
import { ParsedLocationDTO } from "../parsers/dtos/ParsedLocationDTO";

/**
 * Responsabilidade: Converter dados parseados em Entity do domínio
 * Desacopla a camada de parsing da camada de domínio
 */
export class LocationMapper {
    
    static toDomain(dto: ParsedLocationDTO): Location {

        const timestamp = new Date(dto.timestamp * 1000);
        
        return new Location(
            dto.latitude,
            dto.longitude,
            timestamp,
            dto.speed,
            dto.direction,
            dto.distance,
            dto.horimeter,
            dto.gpsFixed,
            dto.gpsHistorical,
            dto.ignitionOn
        );
    }
}
