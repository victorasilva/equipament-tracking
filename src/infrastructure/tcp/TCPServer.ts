import net from 'net';
import { Socket } from 'net';
import { ProcessLocationData } from '../../application/use-cases/ProcessLocationData';
import { ProcessHeartbeat } from '../../application/use-cases/ProcessHeartbeat';
import { DeviceConnection } from './DeviceConnection';
import { ProtocolFramer } from '../../application/parsers/ProtocolFramer';
import { SFT9001Parser } from '../../application/parsers/SFT9001Parser';
import { ConnectionManager } from './ConnectionManager';
import { isAuthorized } from '../../shared/utils/deviceAuthorization';


class TCPServer {
    private connectionManager: ConnectionManager;

    constructor(
        private processLocationUseCase: ProcessLocationData,
        private processHeartbeatUseCase: ProcessHeartbeat,
        private port: number,
        private host: string
    ) {
        this.connectionManager = new ConnectionManager();
    }

    start(): void {
        const server = net.createServer((socket: Socket) => {
            this.handleNewConnection(socket);
        });
        server.listen(this.port, this.host, () => {
            console.log(`Servidor TCP ouvindo em ${this.host}:${this.port}`);
        });
        server.on('error', (err: Error) => {
            console.error(`Erro no servidor TCP: ${err.message}`);
        });
    }

    private handleNewConnection(socket: Socket): void {
        console.log(`Nova conexão de ${socket.remoteAddress}:${socket.remotePort}`);

        const connection = new DeviceConnection(
            socket,
            new ProtocolFramer(),
            undefined
        );
        this.connectionManager.add(socket, connection);
        socket.on('data', (chunk: Buffer) => {
            this.handleData(connection, chunk);
        });
        socket.on('close', () => {
            this.connectionManager.remove(socket);
            console.log(`Conexão encerrada de ${socket.remoteAddress}:${socket.remotePort}`);
        });
        socket.on('error', (err: Error) => {
            console.error(`Erro na conexão de ${socket.remoteAddress}:${socket.remotePort} - ${err.message}`);
        });

    }

    private async handleData(connection: DeviceConnection, chunk: Buffer): Promise<void> {
        try {
            connection.framer.feed(chunk);
            const packets = connection.framer.getPackets();

            const parser = new SFT9001Parser();

            for (const packet of packets) {
                const parsed = parser.parse(packet);

                if (!parsed) {
                    console.warn(`Pacote inválido de ${connection.socket.remoteAddress}:${connection.socket.remotePort}`);
                    continue;
                }

                if (!connection.deviceId) {
                    connection.deviceId = parsed.deviceId;

                    if (!isAuthorized(connection.deviceId)) {
                        console.warn(`Dispositivo não autorizado ${connection.deviceId} em ${connection.socket.remoteAddress}:${connection.socket.remotePort}`);
                        connection.socket.destroy();
                        return;
                    }
                    console.log(`Dispositivo autorizado ${connection.deviceId} em ${connection.socket.remoteAddress}:${connection.socket.remotePort}`);
                }

                if (parsed.location) {
                    await this.processLocationUseCase.execute(parsed);
                } else {
                    await this.processHeartbeatUseCase.execute(parsed);
                }
            }
        } catch (err) {
            console.error(`Erro ao processar dados de ${connection.socket.remoteAddress}:${connection.socket.remotePort} - ${(err as Error).message}`);
        }
    }
}

export { TCPServer };