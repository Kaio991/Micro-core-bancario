import rateLimit from 'express-rate-limit';


export const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 100,
    standardHeaders: true, // manda os headers RateLimit-* padrão
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Tente novamente em instantes.' }
});

// Login é o alvo clássico de força bruta / credential stuffing.
// skipSuccessfulRequests: só conta tentativas que FALHARAM (senha errada),
// então um usuário legítimo que erra a senha 1x e acerta na 2ª não é punido.
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});

// Cadastro: evita automação criando contas falsas em massa.
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de cadastro. Tente novamente mais tarde.' }
});

// Pix/Saque: mais generoso que o login (um usuário real pode errar o PIN
// algumas vezes em sequência), mas ainda barra tentativa automatizada de
// varrer e-mails de destinatário ou martelar a rota.
export const transferLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de transação. Tente novamente em alguns minutos.' }
});