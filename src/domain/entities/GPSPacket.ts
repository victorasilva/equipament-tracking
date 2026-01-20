import { Location } from "./Location";

export class GPSPacket {
    public deviceId: string;
    public messageType: number;
    public rawHex: string;
    public location: Location | undefined;

    constructor(
        deviceId: string, 
        messageType: number, 
        rawHex: string, 
        location?: Location
    ) {
        this.deviceId = deviceId;
        this.messageType = messageType;
        this.rawHex = rawHex;
        this.location = location;
    }
}
