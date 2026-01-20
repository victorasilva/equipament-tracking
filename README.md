# Equipament Tracking System

Sistema de rastreamento GPS para dispositivos que utilizam o protocolo SFT9001.

## Sobre

Sistema que recebe dados de rastreadores GPS via TCP, processa pacotes binários do protocolo SFT9001 e disponibiliza uma API REST para consulta de localizações.

**Principais recursos:**
- Servidor TCP para recepção de dados GPS (porta 3000)
- Parser de protocolo binário SFT9001 (33 bytes por pacote)
- API REST para consulta de última localização (porta 8080)
- Suporte a múltiplas conexões simultâneas
- Tratamento adequado de fragmentação TCP
- Armazenamento em memória com histórico de até 100 localizações por dispositivo
- Autenticação via API Key
- Whitelist de dispositivos autorizados  

## Arquitetura

O projeto utiliza Clean Architecture com separação clara entre camadas:

- **Domain**: Entidades de negócio (Location, GPSPacket) e interfaces de repositórios
- **Application**: Casos de uso, parsers de protocolo e DTOs
- **Infrastructure**: Servidores TCP/HTTP, controllers e implementação de repositórios
- **Shared**: Utilitários e helpers compartilhados entre camadas

Todas as dependências são injetadas via construtor, seguindo os princípios SOLID e permitindo fácil substituição de implementações.

### Motivos das Escolhas Técnicas

**Clean Architecture:**
- Facilita manutenção e evolução do código
- Permite testar regras de negócio isoladamente
- Independência de frameworks externos
- Código mais legível e organizado

**TypeScript:**
- Tipagem estática previne erros em tempo de desenvolvimento
- Melhor autocompletar e refatoração no IDE
- Código mais documentado e autodescritivo
- Facilita trabalho em equipe, middlewares

**Node.js com módulo `net` nativo:**
- Performance superior para conexões TCP persistentes
- Controle total sobre o protocolo binário
- Menos overhead que bibliotecas HTTP
- Ideal para IoT e telemetria

**Express para API REST:**
- Framework maduro e amplamente utilizado
- Middlewares facilitam autenticação e validação
- Ótima documentação e comunidade ativa

**Jest para testes:**
- Framework completo com mocking integrado
- Cobertura de código built-in
- Sintaxe clara e descritiva
- Amplamente adotado na comunidade Node.js

**Repository Pattern:**
- Desacopla lógica de negócio da persistência
- Facilita trocar implementação (memória → banco de dados)
- Simplifica testes unitários com mocks
- Interface clara e consistente

**Autenticação simples (API Key + Whitelist):**
- Adequado para comunicação sistema-a-sistema
- Fácil gerenciamento via variáveis de ambiente
- Performance superior a JWT para este caso de uso
- Suficiente para proteger APIs internas

## Estrutura do Projeto

```
src/
├── domain/
│   ├── entities/                # Location, GPSPacket
│   └── repositories/            # Interfaces e InMemory implementation
├── application/
│   ├── use-cases/              # ProcessLocationData, GetDeviceLastLocation, ProcessHeartbeat
│   ├── parsers/                # SFT9001Parser, ProtocolFramer
│   └── mappers/                # Conversão entre DTOs e entidades
├── infrastructure/
│   ├── tcp/                    # TCPServer, DeviceConnection, ConnectionManager
│   └── http/                   # HttpServer, controllers, routes
└── main.ts                     # Entry point
```

## Tecnologias

- Node.js + TypeScript
- Express (API REST)
- Net (TCP nativo do Node)

## Instalação

```bash
git clone <repository>
cd equipament-tracking
npm install

Crie um arquivo `.env` na raiz do projeto:

```env
# Portas dos servidores
TCP_PORT=3000
HTTP_PORT=8080

# Autenticação da API REST
API_KEY=sk_Hg5adyl8QvkI0jQxOpf5Ks6I4s18KwfE

# Dispositivos autorizados (separados por vírgula)
ALLOW_DEVICES=0A3F73,1B4E82,2C5D91

# Configurações opcionais (RabbitMQ para futuras implementações)
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
QUEUE_LOCATION=location.received
EXCHANGE_LOCATION=location.exchange
NODE_ENV=development
```

## Como usar

### Desenvolvimento

Inicie o servidor em modo desenvolvimento:

```bash
npm run dev
```

O sistema vai iniciar:
- **TCP Server** na porta 3000 (recebe dados dos rastreadores)
- **HTTP API** na porta 8080 (consulta de localizações)

### Produção

Build e execução:

```bash
npm run build
npm start
```

### Testes Rápidos (Demonstração End-to-End)

Para testar o sistema completo sem precisar configurar cliente TCP manualmente:

**Teste básico:**
```bash
npm run test:integration
```

Este script automaticamente:
1. Inicia servidores TCP e HTTP
2. Envia dados GPS de um dispositivo via TCP
3. Consulta a API REST
4. Valida as respostas

**Teste avançado (múltiplos devices):**
```bash
npm run test:advanced
```

Testa cenários complexos com múltiplos dispositivos simultâneos.

💡 **Dica:** Estes scripts são úteis para demonstrar o sistema funcionando completamente, pois para testar no Insomnia/Postman você precisaria primeiro enviar dados GPS via TCP (protocolo binário), o que é mais trabalhoso manualmente.

## API REST

### Autenticação

Todas as requisições precisam do header `X-API-Key`:

```bash
X-API-Key: sk_Hg5adyl8QvkI0jQxOpf5Ks6I4s18KwfE
```

### GET /v1/location/:deviceId

Retorna a última localização conhecida de um dispositivo autorizado.

**Exemplo com cURL:**
```bash
curl -H "X-API-Key: sk_Hg5adyl8QvkI0jQxOpf5Ks6I4s18KwfE" \
     http://localhost:8080/v1/location/0A3F73
```

**Exemplo com Insomnia/Postman:**
- URL: `http://localhost:8080/v1/location/0A3F73`
- Method: `GET`
- Header: `X-API-Key: sk_Hg5adyl8QvkI0jQxOpf5Ks6I4s18KwfE`

**Resposta (200 OK):**
```json
{
  "latitude": 30.922816,
  "longitude": 43.985805,
  "timestamp": "2097-01-20T21:38:24.000Z",
  "speed": 60,
  "direction": 59.86,
  "distance": 3200,
  "horimeter": 2250,
  "gpsFixed": false,
  "gpsHistorical": false,
  "ignitionOn": false
}
```

## Testes

### Testes Unitários

Execute os testes unitários com Jest:

```bash
# Rodar todos os testes
npm test
- **Middlewares**: AuthMiddleware
- **Utilities**: deviceAuthorization

**Cobertura atual: 94.52%** (58 testes passando)
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

Os testes cobrem:
- **Parsers**: SFT9001Parser e ProtocolFramer
- **Mappers**: LocationMapper e PacketMapper
- **Use Cases**: ProcessLocationData, GetDeviceLastLocation, ProcessHeartbeat
- **Repository**: InMemoryLocationRepository
- **Middlewares**: AuthMiddleware
- **Utilities**: deviceAuthorization

Cobertura mínima: 70% (branches, functions, lines, statements)

### Teste de Integração

Execute o teste de integração completo:

```bash
npm run test:integration
```

O teste vai:
1. Iniciar os servidores TCP e HTTP
2. Tentar consultar um device inexistente (espera 404)
3. Enviar dados GPS via TCP
4. Consultar o device novamente (espera 200 com dados)
5. Validar os dados recebidos

## Protocolo SFT9001

O protocolo utiliza pacotes binários de 33 bytes:

```
Header (2) | Device ID (3) | Type (1) | Data (25) | Footer (2)
  50F7     |    0A3F73     |   02     |   ...     |   73C4
```

**Dados de localização (25 bytes):**
- Timestamp: 4 bytes (Unix timestamp)
- Direção: 2 bytes (valor / 100 = graus)
- Distância: 4 bytes (metros)
- Horímetro: 4 bytes (minutos)
- Composição: 2 bytes (flags: GPS fixado, histórico, ignição)
- Velocidade: 1 byte (km/h)
- Latitude: 4 bytes (valor / 1.000.000 = decimal)
- Longitude: 4 bytes (valor / 1.000.000 = decimal)

O `ProtocolFramer` lida com fragmentação TCP, acumulando bytes e extraindo pacotes completos baseado nos headers/footers.

### ⚠️ Nota sobre Divergência na Documentação

Durante a implementação, foi identificada uma **inconsistência na documentação oficial** do protocolo SFT9001:

- **Documentação original**: menciona 24 bytes de dados (32 bytes totais)
- **Tabela de especificação**: define 25 bytes de dados (33 bytes totais)

**Diferença identificada:** Campo "Horímetro" (4 bytes) presente na tabela oficial mas não mencionado na descrição resumida.

**Decisão técnica:** A implementação segue a **tabela detalhada (33 bytes)**, pois:
1. É mais completa e específica
2. O campo "Horímetro" é útil para rastreamento de equipamentos
3. Pacotes de teste fornecidos validaram essa estrutura
4. Estrutura de 33 bytes foi validada com sucesso nos testes

Esta escolha está documentada no código (`ProtocolFramer.ts`) para referência futura.

## Notas Técnicas

**Fragmentação TCP:** Como TCP é stream-based, os dados podem chegar fragmentados ou agregados. O `ProtocolFramer` acumula bytes e extrai pacotes completos validando headers (0x50F7) e footers (0x73C4).

- Autenticação de API via API Key
- WSegurança

O sistema implementa duas camadas de segurança:

**1. API REST (consultas):**
- Autenticação via header `X-API-Key`
- Middleware valida antes de processar requisições
- Retorna 401 para chaves inválidas

**2. Servidor TCP (dispositivos GPS):**
- Whitelist de Device IDs configurável via `.env`
- Validação ao identificar dispositivo na primeira mensagem
- Conexão TCP é fechada imediatamente se device não autorizado
- Use cases validam autorização antes de processar dados

## Possíveis Melhorias

- Persistência com PostgreSQL + PostGIS para dados geográficos
- Redis para cache de última localização
- Rotação automática de API Keys
- Rate limiting por device/IP
- RabbitMQ para processamento assíncrono de localizações
- Docker/Docker Compose para deploy
- Logs estruturados (Winston/Pino) e alertas
- Métricas e monitoramento (Prometheus + Grafana)
- WebSocket para notificações em tempo real
- Histórico de rotas com query por período

## Licença

MIT
