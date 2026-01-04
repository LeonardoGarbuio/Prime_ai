# Migração de Email: Resend -> Brevo

## Motivo
O Resend (plano gratuito) limita o envio apenas para o email do proprietário da conta, impedindo testes reais de recuperação de senha e boas-vindas. A Brevo permite até 300 envios/dia para quaisquer destinatários.

## Plano de Implementação

1. **Instalar Dependência**
   - Adicionar `brevo` ou usar fetch direto na API v3 (mais leve).
   - Vou optar por `fetch` direto para não aumentar o bundle com SDKs pesados.

2. **Atualizar Função de Envio**
   - [MODIFY] `lib/send-welcome-email.ts`
   - Substituir lógica do Resend pela API da Brevo.

3. **Atualizar Endpoint de Recuperação**
   - [MODIFY] `app/api/auth/recover/route.ts`
   - Atualizar chamada de envio e logs.

4. **Variáveis de Ambiente**
   - `BREVO_API_KEY` já foi fornecida.
   - Atualizar `.env.local` e Vercel.

## Detalhes da API Brevo

Endpoint: `https://api.brevo.com/v3/smtp/email`
Headers:
- `api-key`: `xkeysib-...`
- `Content-Type`: `application/json`

Payload:
```json
{
  "sender": { "name": "Prime AI", "email": "nao-responda@primeai.com.br" },
  "to": [{ "email": "usuario@email.com", "name": "Nome" }],
  "subject": "Assunto",
  "htmlContent": "<html>...</html>"
}
```

## Verificação
- Enviar email de teste via `/api/test-email`
- Testar fluxo de recuperação de senha com email real (não cadastrado na Brevo)
