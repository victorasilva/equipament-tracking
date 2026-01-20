import express, { Express } from 'express';
import { createLocationRoutes } from './routes/locationRoutes';
import { LocationController } from './controllers/LocationController';
import { ILocationRepository } from '../../domain/repositories/ILocationRepository';
import { GetDeviceLastLocation } from '../../application/use-cases/GetDeviceLastLocation';

export class HttpServer {
    private app: Express;

    constructor(
        private getDeviceLastLocation: GetDeviceLastLocation,
        private port: number
    ) {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log(`Server is running on port ${this.port}`);
        });
    }

    private setupMiddleware(): void {
        this.app.use(express.json());
    }

    private setupRoutes(): void {
        const locationController = new LocationController(this.getDeviceLastLocation);
        this.app.use('/api', createLocationRoutes(locationController));
    }
}