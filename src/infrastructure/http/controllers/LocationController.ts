import { Request, Response } from 'express';
import { GetDeviceLastLocation } from '../../../application/use-cases/GetDeviceLastLocation';

export class LocationController {
    constructor(
        private readonly getDeviceLocation: GetDeviceLastLocation
    ) { }
    async getLocations(req: Request, res: Response): Promise<void> {
        try {
            const deviceId = req.params.deviceId as string;
            const locations = await this.getDeviceLocation.execute(deviceId);

            if (!locations) {
                res.status(404).json({ error: 'Device not found or no locations available' });
                return;
            }

            res.status(200).json(locations);

        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    }
}