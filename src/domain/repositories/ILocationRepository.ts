import { Location } from "../entities/Location";

interface LocationRepository {
    saveLocation(deviceId: string, location: Location): Promise<void>;
    getLastLocation(deviceId: string): Promise<Location | null>;
    updateDeviceConnection(deviceId: string): Promise<void>;
}

export type { LocationRepository as ILocationRepository };