# vape-discord-api

Bot + API de presença do dono (VapeV4-Better).

O site lê `GET /api/status` e mostra foto, nome, status (online/ausente/ocupado/offline),
atividade, bio e descrição no card owner. Sem esse servidor no ar, o site usa o
conteúdo estático + Lanyard como fallback.

## 1. Criar o bot (1 vez)

1. Abra https://discord.com/developers/applications > **New Application**.
2. Aba **Bot** > **Reset Token** > copie (esse é o `DISCORD_TOKEN`).
3. Na mesma aba, em **Privileged Gateway Intents**, ligue:
   - **Presence Intent**
   - **Server Members Intent**
   - Salve (Save Changes).
4. Aba **OAuth2 > URL Generator**: marque o scope **bot** (nenhuma permissão
   precisa), abra o link gerado e coloque o bot **num servidor onde VOCÊ está**
   (sem servidor em comum ele não enxerga seu status).
5. No Discord, ative modo desenvolvedor (Config > Avançado), clique na sua
   foto > **Copiar ID de usuário** (confira se bate com o `OWNER_ID`).

## 2. Rodar local

```bat
cd "bot discord"
copy .env.example .env
notepad .env
npm install
npm start
```

Teste: http://localhost:3000/api/status (tem que voltar seu JSON).

## 3. Subir pra host (Render/Railway/Fly/etc.)

- **Start command:** `npm start`
- **Variáveis de ambiente:** `DISCORD_TOKEN`, `OWNER_ID`, `BIO`, `DESCRIPTION`
  (`PORT` a host define sozinha).
- Depois, no `site/index.html`, preencha `data-api-url` do `.owner-card` com
  `https://SUA-HOST/api/status`.

## Importante

- **Bio de verdade não existe na API pra bots** (bloqueio do Discord).
  Como fica: se `BIO` no `.env` estiver preenchido, usa ele; se estiver
  **vazio**, o site mostra seu **status personalizado ao vivo**.
- **NUNCA commite o `.env`** — ele está no `.gitignore`. Vazou token?
  Bot > Reset Token e troque em todo lugar.
- Status só aparece certo se o bot dividir servidor com você.
