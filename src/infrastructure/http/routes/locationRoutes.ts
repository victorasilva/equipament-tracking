import { Router } from "express";
import { LocationController } from "../controllers/LocationController";
import { authMiddleware } from "../middlewares/AuthMiddleware";

export function createLocationRoutes(locationController: LocationController): Router {
    const router = Router();
    router.use(authMiddleware);
    router.get('/v1/location/:deviceId', (req, res) => locationController.getLocations(req, res));
    return router;
}