# 🔒 Auditoria de Segurança - Sistema de Pagamentos Prime AI

**Data:** 2026-01-02  
**Escopo:** Sistema de pagamento, cancelamento e reembolso  
**Arquivos analisados:**
- [route.ts](file:///d:/Desktop/SaaS_real/prime-ai/app/api/webhook/kiwify/route.ts) (Webhook Kiwify)
- [supabase.ts](file:///d:/Desktop/SaaS_real/prime-ai/lib/supabase.ts) (Funções de assinatura)
- [verify/route.ts](file:///d:/Desktop/SaaS_real/prime-ai/app/api/auth/verify/route.ts) (Verificação de acesso)
- [send-welcome-email.ts](file:///d:/Desktop/SaaS_real/prime-ai/lib/send-welcome-email.ts) (Envio de emails)

---

## 🚨 VULNERABILIDADES CRÍTICAS

### 1. **WEBHOOK SEM AUTENTICAÇÃO** (Severidade: CRÍTICA 🔴)

> [!CAUTION]
> O webhook não valida a origem das requisições! Qualquer pessoa pode chamar este endpoint e manipular assinaturas.

**Arquivo:** `route.ts` (linha 17-19)
```typescript
export async function POST(req: Request) {
    try {
        const body = await req.json();
```

**Problema:** Não há verificação de:
- ❌ Assinatura HMAC do Kiwify
- ❌ Header de autenticação `X-Kiwify-Signature`
- ❌ Token de segurança
- ❌ IP de origem

**Impacto:** Um atacante pode:
1. Ativar assinaturas falsas enviando: `POST /api/webhook/kiwify` com `{"Customer": {"email": "atacante@email.com"}, "order_status": "paid"}`
2. Cancelar assinaturas de qualquer usuário legítimo
3. Processar reembolsos falsos

**Correção recomendada:**
```typescript
// Verificar assinatura HMAC do Kiwify
const signature = req.headers.get('x-kiwify-signature');
const secret = process.env.KIWIFY_WEBHOOK_SECRET;

if (!secret) {
    return NextResponse.json({ error: "Webhook secret não configurado" }, { status: 500 });
}

const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');

if (signature !== expectedSignature) {
    console.error("❌ Assinatura inválida no webhook");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

### 2. **EXPOSIÇÃO DE PAYLOAD NO ENDPOINT GET** (Severidade: MÉDIA 🟡)

**Arquivo:** `route.ts` (linhas 192-205)
```typescript
export async function GET() {
    return NextResponse.json({
        status: "Webhook Kiwify ativo",
        version: "2.0",
        eventos_suportados: [...]
    });
}
```

**Problema:** Expõe informações sobre a estrutura do webhook para atacantes.

**Correção:** Remover ou proteger este endpoint.

---

### 3. **FALTA DE RATE LIMITING** (Severidade: ALTA 🟠)

**Problema:** Nenhum dos endpoints possui rate limiting.

**Impacto:**
- Ataques de força bruta no endpoint de verificação
- Sobrecarga do servidor via spam de webhooks falsos
- Possível negação de serviço (DoS)

**Correção:** Implementar rate limiting com middleware ou biblioteca como `upstash/ratelimit`.

---

### 4. **VAZAMENTO DE INFORMAÇÕES EM LOGS** (Severidade: MÉDIA 🟡)

**Arquivo:** `route.ts` (linha 22)
```typescript
console.log("📨 Webhook Kiwify recebido:", JSON.stringify(body, null, 2));
```

**Problema:** Loga todo o payload em produção, incluindo dados sensíveis como emails e IDs de transação.

**Correção:** Remover ou sanitizar logs em produção.

---

### 5. **SIMULAÇÃO EM PRODUÇÃO** (Severidade: ALTA 🟠)

**Arquivo:** `supabase.ts` (linhas 64-66 e 97-99)
```typescript
if (!supabase) {
    console.log('⚠️ Supabase não configurado - simulando ativação');
    return true; // Retorna true para não bloquear o webhook
}
```

**Problema:** Se o Supabase não estiver configurado, a função retorna `true` (sucesso), permitindo que assinaturas sejam "ativadas" sem persistência real.

**Impacto:** Em caso de problema de conexão com Supabase:
- Usuário recebe confirmação de ativação
- Email de boas-vindas é enviado
- Mas a assinatura NÃO existe no banco

**Correção:**
```typescript
if (!supabase) {
    console.error('❌ ERRO: Supabase não configurado - operação bloqueada');
    return false; // Falha crítica
}
```

---

### 6. **FALTA DE IDEMPOTÊNCIA** (Severidade: MÉDIA 🟡)

**Problema:** Não há verificação se um webhook já foi processado.

**Arquivo:** `route.ts` (linha 53)
```typescript
const ativadoCompra = await ativarAssinatura(emailNormalizado, orderId);
```

**Impacto:**
- Webhooks duplicados podem causar múltiplas tentativas de ativação
- Múltiplos emails de boas-vindas podem ser enviados
- Logs inconsistentes

**Correção:** Armazenar `orderId` processados e verificar antes de executar:
```typescript
const jaProcessado = await verificarWebhookProcessado(orderId);
if (jaProcessado) {
    return NextResponse.json({ message: "Webhook já processado" });
}
```

---

### 7. **VALIDAÇÃO INSUFICIENTE DE ENTRADA** (Severidade: MÉDIA 🟡)

**Problema:** Email não é validado além de `toLowerCase().trim()`.

**Arquivo:** `route.ts` (linha 41)
```typescript
const emailNormalizado = email.toLowerCase().trim();
```

**Correção:** Adicionar validação de formato de email:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(emailNormalizado)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
}
```

---

### 8. **SQL INJECTION VIA EMAIL** (Severidade: BAIXA 🟢)

**Arquivo:** `supabase.ts`

**Status:** ✅ Seguro - Supabase usa queries parametrizadas automaticamente.

---

### 9. **FALTA DE VERIFICAÇÃO DE ORDER_ID NO CANCELAMENTO** (Severidade: ALTA 🟠)

**Arquivo:** `route.ts` (linhas 102, 122, 143)
```typescript
const canceladoReembolso = await cancelarAssinatura(emailNormalizado);
```

**Problema:** Cancelamento só usa email, não valida o `orderId` da transação original.

**Impacto:** Um atacante pode cancelar qualquer assinatura conhecendo apenas o email do usuário.

**Correção:** Verificar se o `orderId` corresponde à assinatura ativa antes de cancelar:
```typescript
export async function cancelarAssinatura(email: string, orderId: string): Promise<boolean> {
    // Verificar se orderId corresponde ao registro
    const { data } = await supabase
        .from('assinantes')
        .select('kiwify_id')
        .eq('email', email.toLowerCase())
        .single();
    
    if (data?.kiwify_id !== orderId) {
        console.error('❌ Order ID não corresponde ao registro');
        return false;
    }
    // ... continuar cancelamento
}
```

---

## ⚠️ FALHAS DE LÓGICA

### 10. **SENHA MASTER EXPOSTA** (Severidade: ALTA 🟠)

**Arquivo:** `verify/route.ts` (linhas 15-24)
```typescript
const masterPassword = process.env.ADMIN_MASTER_PASSWORD;
if (masterPassword && senha === masterPassword) {
    // Acesso admin liberado
}
```

**Problema:** 
- Comparação de string simples (vulnerável a timing attacks)
- Qualquer email com a senha master ganha acesso admin

**Correção:** Usar comparação segura e lista de emails admin permitidos:
```typescript
import { timingSafeEqual } from 'crypto';

const allowedAdmins = ['admin@seudominio.com'];
if (masterPassword && allowedAdmins.includes(email)) {
    const isValid = timingSafeEqual(Buffer.from(senha), Buffer.from(masterPassword));
    if (isValid) { /* ... */ }
}
```

---

### 11. **SENHA VIP PÚBLICA** (Severidade: MÉDIA 🟡)

**Arquivo:** `verify/route.ts` (linha 27)
```typescript
const vipPassword = process.env.NEXT_PUBLIC_VIP_PASSWORD;
```

**Problema:** Variável com prefixo `NEXT_PUBLIC_` é exposta no frontend, permitindo que qualquer pessoa veja a senha VIP no código JavaScript do site.

**Correção:** Remover o prefixo `NEXT_PUBLIC_`:
```
VIP_PASSWORD=sua_senha_segura
```

---

## 📋 RESUMO EXECUTIVO

| # | Vulnerabilidade | Severidade | Status |
|---|-----------------|------------|--------|
| 1 | Webhook sem autenticação HMAC | 🔴 CRÍTICA | Corrigir imediatamente |
| 2 | Endpoint GET expondo informações | 🟡 MÉDIA | Remover |
| 3 | Falta de rate limiting | 🟠 ALTA | Implementar |
| 4 | Vazamento de dados em logs | 🟡 MÉDIA | Sanitizar |
| 5 | Simulação de sucesso sem DB | 🟠 ALTA | Falhar explicitamente |
| 6 | Falta de idempotência | 🟡 MÉDIA | Implementar |
| 7 | Validação insuficiente de email | 🟡 MÉDIA | Validar formato |
| 8 | SQL Injection | 🟢 BAIXA | ✅ Seguro |
| 9 | Cancelamento sem verificar orderId | 🟠 ALTA | Implementar |
| 10 | Senha master sem proteção | 🟠 ALTA | Proteger |
| 11 | Senha VIP exposta no frontend | 🟡 MÉDIA | Corrigir |

---

## ✅ PRÓXIMOS PASSOS RECOMENDADOS

1. **Prioridade 1 (Urgente):**
   - Implementar validação HMAC no webhook
   - Remover prefixo `NEXT_PUBLIC_` da senha VIP
   - Alterar `return true` para `return false` quando Supabase não está configurado

2. **Prioridade 2 (Esta semana):**
   - Implementar rate limiting
   - Adicionar verificação de `orderId` nos cancelamentos
   - Implementar idempotência com verificação de webhooks já processados

3. **Prioridade 3 (Próxima sprint):**
   - Sanitizar logs de produção
   - Implementar lista de emails admin permitidos
   - Adicionar monitoramento de webhooks suspeitos
