// src/infrastructure/tcp/ConnectionManager.ts
import { Socket } from 'net';
import { DeviceConnection } from './DeviceConnection';

export class ConnectionManager {
    private connections: Map<Socket, DeviceConnection>;

    constructor() {
        this.connections = new Map();
    }

    add(socket: Socket, connection: DeviceConnection): void {
        this.connections.set(socket, connection);
    }

    remove(socket: Socket): void {
        this.connections.delete(socket);
    }

    get(socket: Socket): DeviceConnection | undefined {
        return this.connections.get(socket);
    }
}