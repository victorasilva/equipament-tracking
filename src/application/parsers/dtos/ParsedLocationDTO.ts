/**
 * DTO com dados de localização parseados do protocolo SFT9001
 */
export interface ParsedLocationDTO {
    timestamp: number;
    latitude: number;
    longitude: number;
    speed: number;
    direction: number;
    distance: number;
    horimeter: number;
    gpsFixed: boolean;
    gpsHistorical: boolean;
    ignitionOn: boolean;
}
