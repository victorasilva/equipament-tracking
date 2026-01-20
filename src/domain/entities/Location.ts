export class Location {
    constructor(
        public latitude: number,
        public longitude: number,
        public timestamp: Date,
        public speed: number,
        public direction: number,
        public distance: number,
        public horimeter: number,
        public gpsFixed: boolean,
        public gpsHistorical: boolean,
        public ignitionOn: boolean
    ) {}
}