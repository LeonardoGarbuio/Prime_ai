import crypto from 'crypto';

/**
 * Módulo de Segurança - Prime AI
 * Implementa validações e proteções de nível enterprise
 */

// ==================== WEBHOOK TOKEN VALIDATION (KIWIFY) ====================

/**
 * Valida token do webhook Kiwify
 * O Kiwify envia um token no body que deve corresponder ao configurado
 * @param receivedToken - Token recebido no body do webhook
 * @returns boolean - true se válido
 */
export function validateKiwifyWebhookToken(receivedToken: string | undefined): boolean {
    const expectedToken = process.env.KIWIFY_WEBHOOK_TOKEN;

    if (!expectedToken) {
        console.error('❌ KIWIFY_WEBHOOK_TOKEN não configurado!');
        return false;
    }

    if (!receivedToken) {
        console.error('❌ Token ausente no webhook');
        return false;
    }

    // Comparação timing-safe para prevenir timing attacks
    return secureCompare(receivedToken, expectedToken);
}

// ==================== RATE LIMITING ====================

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// Armazena tentativas por IP/identificador
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Verifica rate limit para um identificador (IP, email, etc)
 * @param identifier - Identificador único (geralmente IP)
 * @param maxRequests - Número máximo de requisições
 * @param windowMs - Janela de tempo em ms
 * @returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
    identifier: string,
    maxRequests: number = 10,
    windowMs: number = 60000 // 1 minuto
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // Limpeza periódica de entradas expiradas
    if (Math.random() < 0.01) {
        cleanupRateLimitStore();
    }

    if (!entry || now > entry.resetTime) {
        // Nova janela
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + windowMs
        });
        return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
    }

    if (entry.count >= maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.resetTime - now
        };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetIn: entry.resetTime - now
    };
}

function cleanupRateLimitStore() {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

// ==================== IDEMPOTENCY ====================

// Armazena webhooks já processados (Order IDs)
const processedWebhooks = new Map<string, number>();

/**
 * Verifica se um webhook já foi processado (idempotência)
 * @param orderId - ID único da ordem/transação
 * @returns boolean - true se já processado
 */
export function isWebhookAlreadyProcessed(orderId: string): boolean {
    if (!orderId) return false;

    const processedAt = processedWebhooks.get(orderId);
    if (processedAt) {
        // Manter registros por 24h
        if (Date.now() - processedAt < 24 * 60 * 60 * 1000) {
            return true;
        }
        processedWebhooks.delete(orderId);
    }
    return false;
}

/**
 * Marca webhook como processado
 * @param orderId - ID único da ordem/transação
 */
export function markWebhookAsProcessed(orderId: string): void {
    if (!orderId) return;
    processedWebhooks.set(orderId, Date.now());

    // Limpeza periódica
    if (processedWebhooks.size > 1000) {
        cleanupProcessedWebhooks();
    }
}

function cleanupProcessedWebhooks() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const [key, timestamp] of processedWebhooks.entries()) {
        if (timestamp < cutoff) {
            processedWebhooks.delete(key);
        }
    }
}

// ==================== INPUT VALIDATION ====================

/**
 * Valida formato de email
 * @param email - Email a validar
 * @returns boolean - true se válido
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;

    // RFC 5322 simplified regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitiza string para logs (remove dados sensíveis)
 * @param data - Dados a sanitizar
 * @returns string sanitizada
 */
export function sanitizeForLogs(data: unknown): string {
    if (!data) return '';

    const str = typeof data === 'string' ? data : JSON.stringify(data);

    // Mascara emails
    const sanitized = str.replace(
        /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        (match, local) => `${local.substring(0, 2)}***@***`
    );

    return sanitized;
}

// ==================== PASSWORD SECURITY ====================

/**
 * Compara senhas de forma segura (timing-safe)
 * @param provided - Senha fornecida
 * @param expected - Senha esperada
 * @returns boolean - true se iguais
 */
export function secureCompare(provided: string, expected: string): boolean {
    if (!provided || !expected) return false;

    try {
        const providedBuffer = Buffer.from(provided);
        const expectedBuffer = Buffer.from(expected);

        if (providedBuffer.length !== expectedBuffer.length) {
            // Ainda fazemos a comparação para manter tempo constante
            crypto.timingSafeEqual(providedBuffer, providedBuffer);
            return false;
        }

        return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    } catch {
        return false;
    }
}

// ==================== ADMIN VALIDATION ====================

/**
 * Lista de emails com permissão de admin
 * Em produção, isso deveria vir de uma variável de ambiente ou banco de dados
 */
export function isAllowedAdmin(email: string): boolean {
    const allowedAdmins = process.env.ALLOWED_ADMIN_EMAILS?.split(',') || [];
    return allowedAdmins.includes(email.toLowerCase().trim());
}

// ==================== REQUEST HELPERS ====================

/**
 * Extrai IP do cliente da requisição
 * Considera proxies e load balancers
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIP) {
        return realIP.trim();
    }

    return 'unknown';
}

// ==================== MAGIC LINK TOKENS ====================

// Armazena tokens de recuperação em memória (em produção, usar Redis ou DB)
const magicTokens = new Map<string, { email: string; expiresAt: number; used: boolean }>();

/**
 * Gera um token mágico para recuperação de acesso
 * @param email - Email do usuário
 * @param expiresInMs - Tempo de expiração em ms (padrão: 15 minutos)
 * @returns token gerado
 */
export function generateMagicToken(email: string, expiresInMs: number = 15 * 60 * 1000): string {
    // Gera token aleatório seguro
    const token = crypto.randomBytes(32).toString('hex');

    // Armazena com expiração
    magicTokens.set(token, {
        email: email.toLowerCase().trim(),
        expiresAt: Date.now() + expiresInMs,
        used: false
    });

    // Limpeza periódica
    if (magicTokens.size > 100) {
        cleanupMagicTokens();
    }

    return token;
}

/**
 * Valida e consome um token mágico
 * @param token - Token a validar
 * @returns { valid: boolean, email?: string, error?: string }
 */
export function validateMagicToken(token: string): { valid: boolean; email?: string; error?: string } {
    if (!token) {
        return { valid: false, error: 'Token não fornecido' };
    }

    const entry = magicTokens.get(token);

    if (!entry) {
        return { valid: false, error: 'Token inválido ou não encontrado' };
    }

    if (entry.used) {
        return { valid: false, error: 'Este link já foi utilizado' };
    }

    if (Date.now() > entry.expiresAt) {
        magicTokens.delete(token);
        return { valid: false, error: 'Link expirado. Solicite um novo.' };
    }

    // Marca como usado
    entry.used = true;

    // Remove após uso para segurança
    setTimeout(() => magicTokens.delete(token), 1000);

    return { valid: true, email: entry.email };
}

function cleanupMagicTokens() {
    const now = Date.now();
    for (const [token, entry] of magicTokens.entries()) {
        if (now > entry.expiresAt || entry.used) {
            magicTokens.delete(token);
        }
    }
}
