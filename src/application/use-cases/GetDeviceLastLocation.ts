import { ILocationRepository } from "../../domain/repositories/ILocationRepository";
import { Location } from "../../domain/entities/Location";
import { isAuthorized } from "../../shared/utils/deviceAuthorization";

export class GetDeviceLastLocation {

    private locationRepository: ILocationRepository;

    constructor(locationRepository: ILocationRepository) {
        this.locationRepository = locationRepository;
    }

    /**
     * Busca última localização de um device
     * Valida autorização do device antes de buscar a localização
     */
    async execute(deviceId: string): Promise<Location | null> {

        if (!isAuthorized(deviceId)) {
            return null;
        }

        return this.locationRepository.getLastLocation(deviceId);
    }
}