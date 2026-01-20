/**
    * Acumulador de bytes para montagem de pacotes do protocolo SFT9001
    * Este acumulador:
    * 1. Acumula bytes conforme chegam
    * 2. Detecta pacotes completos (header 50F7 + footer 73C4)
    * 3. Extrai pacotes completos
    * 4. Mantém sobras para próxima leitura
 */
export class ProtocolFramer {
    private buffer: Buffer = Buffer.alloc(0);

    // Constantes
    private static readonly HEADER = 0x50F7;
    private static readonly FOOTER = 0x73C4;
    private static readonly MIN_PACKET_SIZE = 8;
    private static readonly MAX_PACKET_SIZE = 1024;
    private static readonly MSG_TYPE_PING = 0x01;
    private static readonly MSG_TYPE_LOCATION = 0x02;
    private static readonly OFFSET_MSG_TYPE = 5;

    /**
     * Adiciona novos bytes ao buffer acumulador
     * Limita tamanho do buffer para evitar estouro de memória
     */
    feed(chunk: Buffer): void {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        if (this.buffer.length > ProtocolFramer.MAX_PACKET_SIZE * 10) {
            console.warn('Buffer muito grande, descartando dados antigos');
            this.buffer = this.buffer.subarray(-ProtocolFramer.MAX_PACKET_SIZE);
        }
    }

    /**
     * Extrai todos os pacotes completos disponíveis no buffer
     */
    getPackets(): Buffer[] {
        const packets: Buffer[] = [];

        while (true) {
            const packet = this.extractNextPacket();
            if (!packet) break;
            packets.push(packet);
        }

        return packets;
    }

    /**
     * Tenta extrair o próximo pacote completo do buffer
     */
    private extractNextPacket(): Buffer | null {
        if (this.buffer.length < ProtocolFramer.MIN_PACKET_SIZE) {
            return null;
        }

        const headerIndex = this.findHeader();
        if (headerIndex === -1) {
            this.buffer = this.buffer.subarray(this.buffer.length - 1);
            return null;
        }


        if (headerIndex > 0) {
            console.warn(`Descartando ${headerIndex} bytes antes do header`);
            this.buffer = this.buffer.subarray(headerIndex);
        }

        if (this.buffer.length < ProtocolFramer.OFFSET_MSG_TYPE + 1) {
            return null;
        }

        const messageType = this.buffer.readUInt8(ProtocolFramer.OFFSET_MSG_TYPE);

        let expectedSize: number;
        if (messageType === ProtocolFramer.MSG_TYPE_PING) {
            expectedSize = 8;
        }
        else if (messageType === ProtocolFramer.MSG_TYPE_LOCATION) {
            /**
             * NOTA - Divergência entre versões do protocolo:
             * 
             * Documentação original menciona 24 bytes de dados (32 bytes total),
             * porém a especificação da tabela define 25 bytes de dados (33 bytes total).
             * 
             * Diferença: Campo "Horímetro" (4 bytes) presente na tabela oficial.
             * 
             * Estrutura validada (33 bytes):
             * - Header: 2 bytes (0x50F7)
             * - Device ID: 3 bytes
             * - Message Type: 1 byte (0x02)
             * - Data: 25 bytes (timestamp 4 + direção 2 + distância 4 + horímetro 4 + composição 2 + velocidade 1 + lat 4 + lng 4)
             * - Footer: 2 bytes (0x73C4)
             * 
             * Implementação segue a tabela oficial (33 bytes).
             */
            expectedSize = 33;
        } else {
            console.warn(`Tipo de mensagem desconhecido: ${messageType}, descartando`);
            this.buffer = this.buffer.subarray(1);
            return null;
        }

        if (this.buffer.length < expectedSize) return null;

        const footerOffset = expectedSize - 2;
        const footer = this.buffer.readUInt16BE(footerOffset);
        if (footer !== ProtocolFramer.FOOTER) {
            console.warn('Footer inválido na posição esperada, descartando');
            this.buffer = this.buffer.subarray(1);
            return null;
        }

        // Quando o pacote é válido, extrai e retorna
        const packet = this.buffer.subarray(0, expectedSize);

        // Remover o pacote extraído do buffer
        this.buffer = this.buffer.subarray(expectedSize);

        return packet;
    }

    /**
     * Procura pela sequência de header (50F7) no buffer
     */
    private findHeader(): number {
        for (let i = 0; i <= this.buffer.length - 2; i++) {
            const value = this.buffer.readUInt16BE(i);
            if (value === ProtocolFramer.HEADER) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Limpa o buffer acumulador (útil para reset de conexão)
     */
    reset(): void {
        this.buffer = Buffer.alloc(0);
    }

    /**
     * Retorna tamanho atual do buffer acumulador
     */
    getBufferSize(): number {
        return this.buffer.length;
    }
}
