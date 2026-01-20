import { authMiddleware } from '../../../src/infrastructure/http/middlewares/AuthMiddleware';

describe('AuthMiddleware', () => {
    it('deve permitir requisição para dispositivo autorizado', () => {
        const req: any = {
            headers: {
                'x-api-key': 'sk_Hg5adyl8QvkI0jQxOpf5Ks6I4s18KwfE'
            }
        }; 
        const res: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();
        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it('deve bloquear requisição para dispositivo não autorizado', () => {
        const req: any = {
            headers: {
                'x-api-key': 'invalid_key'
            }
        };
        const res: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();
        authMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        expect(next).not.toHaveBeenCalled();
    });

    it('deve bloquear requisição sem chave de API', () => {
        const req: any = {
            headers: {}
        };
        const res: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();
        authMiddleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        expect(next).not.toHaveBeenCalled();
    });
});