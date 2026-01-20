/**
 * Teste completo: Inicia servidor, envia dados, testa API
 * Execute apenas este arquivo
 */

import { InMemoryLocationRepository } from '../src/domain/repositories/InMemoryLocationRepository';
import { ProcessLocationData } from '../src/application/use-cases/ProcessLocationData';
import { ProcessHeartbeat } from '../src/application/use-cases/ProcessHeartbeat';
import { GetDeviceLastLocation } from '../src/application/use-cases/GetDeviceLastLocation';
import { TCPServer } from '../src/infrastructure/tcp/TCPServer';
import { HttpServer } from '../src/infrastructure/http/HttpServer';
import net from 'net';
import axios from 'axios';

const TCP_PORT = 3000;
const HTTP_PORT = 8080;
const DEVICE_ID = '0A3F73';

async function runTest() {
    console.log('🧪 TESTE COMPLETO DO SISTEMA\n');
    
    // 1. Iniciar servidores
    console.log('📦 Criando dependências...');
    const repository = new InMemoryLocationRepository();
    const processLocation = new ProcessLocationData(repository);
    const processHeartbeat = new ProcessHeartbeat(repository);
    const getLocation = new GetDeviceLastLocation(repository);
    
    const tcpServer = new TCPServer(processLocation, processHeartbeat, TCP_PORT, '0.0.0.0');
    const httpServer = new HttpServer(getLocation, HTTP_PORT);
    
    console.log('🚀 Iniciando servidores...');
    tcpServer.start();
    httpServer.start();
    
    // Aguardar servidores iniciarem
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Testar API sem dados (deve retornar 404)
    console.log('\n📋 TESTE 1: Consultar device inexistente');
    try {
        await axios.get(`http://localhost:${HTTP_PORT}/api/v1/location/${DEVICE_ID}`);
        console.log('❌ Deveria retornar 404!');
    } catch (error: any) {
        if (error.response?.status === 404) {
            console.log('✅ Retornou 404 corretamente');
            console.log('   Mensagem:', error.response.data.error);
        }
    }
    
    // 3. Enviar dados GPS via TCP
    console.log('\n📋 TESTE 2: Enviar dados GPS via TCP');
    const locationPacket = '50F70A3F7302EEFCF950176200000C80000008CAF8003C01D7D840029F2B8D73C4';
    
    const client = net.createConnection({ port: TCP_PORT, host: 'localhost' });
    await new Promise((resolve) => {
        client.once('connect', () => {
            console.log('✅ Conectado ao TCP Server');
            const buffer = Buffer.from(locationPacket, 'hex');
            client.write(buffer);
            console.log('✅ Pacote enviado (33 bytes)');
            setTimeout(resolve, 500);
        });
    });
    client.end();
    
    // 4. Testar API com dados (deve retornar 200)
    console.log('\n📋 TESTE 3: Consultar device após receber dados');
    try {
        const response = await axios.get(`http://localhost:${HTTP_PORT}/api/v1/location/${DEVICE_ID}`);
        console.log('✅ Status 200 OK');
        console.log('\n📍 Dados retornados:');
        console.log(`   Latitude: ${response.data.latitude}°`);
        console.log(`   Longitude: ${response.data.longitude}°`);
        console.log(`   Velocidade: ${response.data.speed} km/h`);
        console.log(`   Direção: ${response.data.direction}°`);
        console.log(`   Distância: ${response.data.distance} m`);
        console.log(`   Horímetro: ${response.data.horimeter} min`);
        console.log(`   GPS Fixado: ${response.data.gpsFixed}`);
        console.log(`   Ignição: ${response.data.ignitionOn}`);
        
        // Validar dados
        if (response.data.latitude === 30.922816 && 
            response.data.longitude === 43.985805 &&
            response.data.speed === 60) {
            console.log('\n✅ Dados validados corretamente!');
        }
    } catch (error: any) {
        console.log('❌ Erro ao consultar API:', error.message);
    }
    
    // 5. Estatísticas finais
    console.log('\n📊 Estatísticas finais:');
    const stats = repository.getStats();
    console.log(`   Devices: ${stats.devices}`);
    console.log(`   Localizações: ${stats.totalLocations}`);
    
    console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS!\n');
    process.exit(0);
}

runTest().catch(console.error);
