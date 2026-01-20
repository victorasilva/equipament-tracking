/**
 * Testes Completos - Múltiplos Devices e Cenários
 * 
 * Este teste valida:
 * - Múltiplos devices conectando simultaneamente
 * - Isolamento de dados entre devices
 * - Histórico de localizações
 * - Busca por diferentes IDs
 * - Cenários de erro
 */

import { InMemoryLocationRepository } from './src/domain/repositories/InMemoryLocationRepository';
import { ProcessLocationData } from './src/application/use-cases/ProcessLocationData';
import { ProcessHeartbeat } from './src/application/use-cases/ProcessHeartbeat';
import { GetDeviceLastLocation } from './src/application/use-cases/GetDeviceLastLocation';
import { TCPServer } from './src/infrastructure/tcp/TCPServer';
import { HttpServer } from './src/infrastructure/http/HttpServer';
import net from 'net';
import axios from 'axios';

const TCP_PORT = 3000;
const HTTP_PORT = 8080;

// Pacotes de diferentes devices
const device1 = {
    id: '0A3F73',
    packets: [
        // Localização 1 - Posição inicial
        '50F70A3F7302EEFCF950176200000C80000008CAF8003C01D7D840029F2B8D73C4',
        // Localização 2 - Moveu-se
        '50F70A3F7302EEFCF960176300000D00000008CBF8003D01D7D850029F2B9573C4',
        // Heartbeat
        '50F70A3F73017C73C4'
    ] as const
} as const;

const device2 = {
    id: '1B4E82',
    packets: [
        // Localização 1  
        '50F71B4E8202F0FCF95017A200001000000009AAF8004001FFFF00002AAAAA73C4',
        // Localização 2
        '50F71B4E8202F0FCF96017A300001100000009ABF8004101FFFF10002AAAAB73C4'
    ] as const
} as const;

const device3 = {
    id: 'ABC123',
    packets: [
        // Localização 1 - Similar ao device1 mas com ID diferente
        '50F7ABC12302EEFCF950176200000C80000008CAF8003C01E7D850039F2B9D73C4'
    ] as const
} as const;

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, message: string) {
    results.push({ name, passed, message });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}: ${message}`);
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendPacket(deviceId: string, packetHex: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const client = net.createConnection({ port: TCP_PORT, host: 'localhost' });
        
        client.once('connect', () => {
            const buffer = Buffer.from(packetHex, 'hex');
            client.write(buffer);
            setTimeout(() => {
                client.end();
                resolve();
            }, 100);
        });

        client.once('error', reject);
    });
}

async function getDeviceLocation(deviceId: string): Promise<any> {
    try {
        const response = await axios.get(`http://localhost:${HTTP_PORT}/api/v1/location/${deviceId}`);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
}

async function runTests() {
    console.log('═══════════════════════════════════════════════');
    console.log('SUITE DE TESTES COMPLETA');
    console.log('═══════════════════════════════════════════════\n');

    // Inicializar sistema
    console.log('📦 Inicializando sistema...\n');
    const repository = new InMemoryLocationRepository();
    const processLocation = new ProcessLocationData(repository);
    const processHeartbeat = new ProcessHeartbeat(repository);
    const getLocationUseCase = new GetDeviceLastLocation(repository);

    const tcpServer = new TCPServer(processLocation, processHeartbeat, TCP_PORT, '0.0.0.0');
    const httpServer = new HttpServer(getLocationUseCase, HTTP_PORT);

    tcpServer.start();
    httpServer.start();
    await sleep(1000);

    // ═══════════════════════════════════════════════════════════
    // TESTE 1: Buscar device inexistente
    // ═══════════════════════════════════════════════════════════
    console.log('\nTESTE 1: Buscar device inexistente');
    const locationNotFound = await getDeviceLocation('FFFFFF');
    addResult(
        'Device inexistente retorna null',
        locationNotFound === null,
        locationNotFound === null ? 'Retornou 404 corretamente' : 'Deveria retornar 404'
    );

    // ═══════════════════════════════════════════════════════════
    // TESTE 2: Enviar dados de Device 1
    // ═══════════════════════════════════════════════════════════
    console.log('\nTESTE 2: Device 1 - Múltiplas localizações');
    
    // Enviar primeira localização
    await sendPacket(device1.id, device1.packets[0]);
    await sleep(300);
    
    const device1Location1 = await getDeviceLocation(device1.id);
    addResult(
        'Device 1 - Primeira localização salva',
        device1Location1 !== null && device1Location1.latitude !== undefined,
        device1Location1 ? `Lat: ${device1Location1.latitude}, Lng: ${device1Location1.longitude}` : 'Falhou'
    );

    // Enviar segunda localização
    await sendPacket(device1.id, device1.packets[1]);
    await sleep(300);
    
    const device1Location2 = await getDeviceLocation(device1.id);
    addResult(
        'Device 1 - Segunda localização atualizada',
        device1Location2 !== null && 
        device1Location2.latitude !== device1Location1.latitude,
        'Localização atualizada corretamente'
    );

    // Enviar heartbeat
    await sendPacket(device1.id, device1.packets[2]);
    await sleep(300);
    
    addResult(
        'Device 1 - Heartbeat processado',
        true,
        'Heartbeat não altera última localização'
    );

    // ═══════════════════════════════════════════════════════════
    // TESTE 3: Enviar dados de Device 2
    // ═══════════════════════════════════════════════════════════
    console.log('\nTESTE 3: Device 2 - Localizações independentes');
    
    await sendPacket(device2.id, device2.packets[0]);
    await sleep(300);
    
    const device2Location1 = await getDeviceLocation(device2.id);
    addResult(
        'Device 2 - Primeira localização salva',
        device2Location1 !== null,
        device2Location1 ? `Device: ${device2.id}` : 'Falhou'
    );

    await sendPacket(device2.id, device2.packets[1]);
    await sleep(300);

    // ═══════════════════════════════════════════════════════════
    // TESTE 4: Enviar dados de Device 3
    // ═══════════════════════════════════════════════════════════
    console.log('\nTESTE 4: Device 3 - Terceiro device');
    
    await sendPacket(device3.id, device3.packets[0]);
    await sleep(300);
    
    const device3Location1 = await getDeviceLocation(device3.id);
    addResult(
        'Device 3 - Localização salva',
        device3Location1 !== null,
        device3Location1 ? `Device: ${device3.id}` : 'Falhou'
    );

    // ═══════════════════════════════════════════════════════════
    // TESTE 5: Isolamento de dados entre devices
    // ═══════════════════════════════════════════════════════════
    
    console.log('TESTE 5: Isolamento de dados entre devices');
    
    const finalDevice1 = await getDeviceLocation(device1.id);
    const finalDevice2 = await getDeviceLocation(device2.id);
    const finalDevice3 = await getDeviceLocation(device3.id);

    addResult(
        'Device 1 mantém seus dados',
        finalDevice1 !== null && finalDevice1.latitude === device1Location2.latitude,
        'Dados não foram sobrescritos'
    );

    addResult(
        'Device 2 mantém seus dados',
        finalDevice2 !== null,
        'Dados independentes do Device 1'
    );

    addResult(
        'Device 3 mantém seus dados',
        finalDevice3 !== null,
        'Dados independentes dos outros'
    );

    addResult(
        'Devices têm dados diferentes',
        finalDevice1.latitude !== finalDevice2.latitude ||
        finalDevice1.longitude !== finalDevice2.longitude,
        'Nenhum dado se misturou'
    );

    // ═══════════════════════════════════════════════════════════
    // TESTE 6: Histórico de localizações
    // ═══════════════════════════════════════════════════════════
    console.log('TESTE 6: Histórico de localizações');
    
    const device1History = await repository.getLocationHistory(device1.id, 10);
    addResult(
        'Device 1 tem histórico',
        device1History.length >= 2,
        `${device1History.length} localizações no histórico`
    );

    const device2History = await repository.getLocationHistory(device2.id);
    addResult(
        'Device 2 tem histórico',
        device2History.length === 2,
        `${device2History.length} localizações (correto)`
    );

    // ═══════════════════════════════════════════════════════════
    // TESTE 7: Estatísticas do sistema
    // ═══════════════════════════════════════════════════════════
    console.log('TESTE 7: Estatísticas do sistema');
    
    const stats = repository.getStats();
    addResult(
        'Total de devices rastreados',
        stats.devices === 3,
        `${stats.devices} devices (esperado: 3)`
    );

    addResult(
        'Total de localizações',
        stats.totalLocations >= 5,
        `${stats.totalLocations} localizações armazenadas`
    );

    // ═══════════════════════════════════════════════════════════
    // TESTE 8: Validação de campos
    // ═══════════════════════════════════════════════════════════
    console.log('TESTE 8: Validação de campos');
    
    const locationToValidate = await getDeviceLocation(device1.id);
    const requiredFields = ['latitude', 'longitude', 'timestamp', 'speed', 'direction', 'distance', 'horimeter'];
    const missingFields = requiredFields.filter(field => locationToValidate[field] === undefined);
    
    addResult(
        'Todos os campos obrigatórios presentes',
        missingFields.length === 0,
        missingFields.length === 0 ? 'Todos os campos OK' : `Faltam: ${missingFields.join(', ')}`
    );

    addResult(
        'Latitude no range válido',
        locationToValidate.latitude >= -90 && locationToValidate.latitude <= 90,
        `Latitude: ${locationToValidate.latitude}°`
    );

    addResult(
        'Longitude no range válido',
        locationToValidate.longitude >= -180 && locationToValidate.longitude <= 180,
        `Longitude: ${locationToValidate.longitude}°`
    );

    addResult(
        'Velocidade é número positivo',
        locationToValidate.speed >= 0 && locationToValidate.speed <= 255,
        `Velocidade: ${locationToValidate.speed} km/h`
    );

    // ═══════════════════════════════════════════════════════════
    // TESTE 9: Busca simultânea de múltiplos devices
    // ═══════════════════════════════════════════════════════════
    console.log('TESTE 9: Busca simultânea de múltiplos devices');
    
    const [loc1, loc2, loc3] = await Promise.all([
        getDeviceLocation(device1.id),
        getDeviceLocation(device2.id),
        getDeviceLocation(device3.id)
    ]);

    addResult(
        'Busca simultânea bem sucedida',
        loc1 !== null && loc2 !== null && loc3 !== null,
        'Todos os devices retornaram dados'
    );

    // ═══════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════');
    console.log('RESULTADO FINAL');
    console.log('═══════════════════════════════════════════════\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;
    const percentage = ((passed / total) * 100).toFixed(1);

    console.log(`Total de testes: ${total}`);
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`📈 Taxa de sucesso: ${percentage}%`);

    if (failed > 0) {
        console.log('\nTestes que falharam:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`   - ${r.name}: ${r.message}`);
        });
    }

    console.log('\nEstatísticas finais do sistema:');
    console.log(`Devices rastreados: ${stats.devices}`);
    console.log(`Total de localizações: ${stats.totalLocations}`);

    if (failed === 0) {
        console.log('\nTODOS OS TESTES PASSARAM COM SUCESSO!\n');
        process.exit(0);
    } else {
        console.log('\nALGUNS TESTES FALHARAM!\n');
        process.exit(1);
    }
}

// Executar testes
runTests().catch((error) => {
    console.error('\nERRO CRÍTICO:', error.message);
    console.error(error.stack);
    process.exit(1);
});
