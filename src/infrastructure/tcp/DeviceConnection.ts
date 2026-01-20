import { Socket } from 'net';
import { ProtocolFramer } from '../../application/parsers/ProtocolFramer';

class DeviceConnection {
    constructor(
        public socket: Socket,
        public framer: ProtocolFramer,
        public deviceId?: string
    ) {}
}

export { DeviceConnection };