# 📧 Prime AI - Migração de Email (Brevo)

## Resumo
Substituímos o **Resend** (que bloqueia emails no plano grátis) pela **Brevo** (que permite 300 envios/dia para qualquer pessoa).

## O que mudou?

### 1. Envio de Emails (`lib/send-welcome-email.ts`)
- Removido SDK do Resend
- Implementada integração direta com API SMTP da Brevo (`v3/smtp/email`)
- Mantida compatibilidade com código existente

### 2. Recuperação de Senha (`/api/auth/recover`)
- Agora usa a nova função da Brevo
- Templates de email atualizados

### 3. Webhook Kiwify (Correções)
- Correção de **Idempotência**: Chave agora inclui timestamp para permitir múltiplos pagamentos do mesmo Order ID (renovações/reativações)
- Correção de **Re-assinatura**: Sistema detecta reativação de usuário inativo e re-envia email de boas-vindas

### 4. Entregabilidade
- Adicionado header `Reply-To` para melhorar reputação do remetente
- Email de teste detalhado em `/api/test-email`

---

## Configuração Necessária (Vercel)

Adicionar/Verificar variável de ambiente:
```env
BREVO_API_KEY=xkeysib-4b069d304f5e04375... (sua chave)
```

## Como Testar
1. Acesse o site em produção
2. Use "Esqueci meu acesso" com **qualquer email**
3. Verifique se o email chega (pode cair em Spam por ser domínio novo)

---

## Status
✅ Código atualizado no GitHub  
✅ Deploy automático iniciado na Vercel
