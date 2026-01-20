import { InMemoryLocationRepository } from './domain/repositories/InMemoryLocationRepository';
import { ProcessLocationData } from './application/use-cases/ProcessLocationData';
import { ProcessHeartbeat } from './application/use-cases/ProcessHeartbeat';
import { TCPServer } from './infrastructure/tcp/TCPServer';
import { HttpServer } from './infrastructure/http/HttpServer';
import { GetDeviceLastLocation } from './application/use-cases/GetDeviceLastLocation';

const TCP_HOST = process.env.TCP_HOST || '0.0.0.0';
const TCP_PORT = Number(process.env.TCP_PORT) || 3000;
const HTTP_PORT = Number(process.env.HTTP_PORT) || 8080;

console.log('Iniciando Equipament Tracking System...');
console.log('Criando repository...');
const locationRepository = new InMemoryLocationRepository();

console.log('Criando use cases...');
const processLocationUseCase = new ProcessLocationData(locationRepository);
const processHeartbeatUseCase = new ProcessHeartbeat(locationRepository);
const getDeviceLastLocationUseCase = new GetDeviceLastLocation(locationRepository);

console.log('Criando TCP Server...');
const tcpServer = new TCPServer(
    processLocationUseCase,
    processHeartbeatUseCase,
    TCP_PORT,
    TCP_HOST
);

console.log('Criando HTTP Server...');
const httpServer = new HttpServer(getDeviceLastLocationUseCase, HTTP_PORT);

console.log('Iniciando servidores...');
tcpServer.start();
httpServer.start();

process.on('SIGINT', () => {
    console.log('\n\nEncerrando servidor...');
    const stats = locationRepository.getStats();
    console.log(`📊 Estatísticas finais:`);
    console.log(`   - Devices rastreados: ${stats.devices}`);
    console.log(`   - Total de localizações: ${stats.totalLocations}`);
    process.exit(0);
});
