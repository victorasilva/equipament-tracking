import { ILocationRepository } from "./ILocationRepository";
import { Location } from "../entities/Location";
export class InMemoryLocationRepository implements ILocationRepository {

    private static readonly MAX_HISTORY_PER_DEVICE = 100;
    private locations: Map<string, Location[]>;

    constructor() {
        this.locations = new Map<string, Location[]>();
    }

    async saveLocation(deviceId: string, location: Location): Promise<void> {
        if (!this.locations.has(deviceId)) {
            this.locations.set(deviceId, []);
        }
        
        const locations = this.locations.get(deviceId)!;
        locations.push(location);
        
        if (locations.length > InMemoryLocationRepository.MAX_HISTORY_PER_DEVICE) {
            locations.shift();
        }
        
    }

    async getLastLocation(deviceId: string): Promise<Location | null> {
        const deviceLocations = this.locations.get(deviceId);
        if (!deviceLocations || deviceLocations.length === 0) {
            return null;
        }
        
        return deviceLocations.reduce((latest, current) => 
            current.timestamp > latest.timestamp ? current : latest
        );
    }

    async getLocationHistory(deviceId: string, limit?: number): Promise<Location[]> {
        const locations = this.locations.get(deviceId);
        if (!locations) return [];
        
        const sorted = [...locations].sort((a, b) => 
            b.timestamp.getTime() - a.timestamp.getTime()
        );
        
        return limit ? sorted.slice(0, limit) : sorted;
    }

    async updateDeviceConnection(deviceId: string): Promise<void> {
        if (!this.locations.has(deviceId)) {
            this.locations.set(deviceId, []);
        }
    }

    getStats(): { devices: number, totalLocations: number } {
        let total = 0;
        this.locations.forEach(locs => total += locs.length);
        return {
            devices: this.locations.size,
            totalLocations: total
        };
    }
}