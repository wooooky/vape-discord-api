// VapeV4-Better — bot + API de presenca do dono (tudo num processo so).
// O site usa GET /api/status e mostra foto, nome, status e bio no card owner.
//
// Requisitos no Discord Developer Portal (https://discord.com/developers/applications):
//   1. App > Bot > Reset Token > colar em DISCORD_TOKEN no .env (NUNCA commitar!)
//   2. Bot > Privileged Gateway Intents > ligar PRESENCE INTENT + SERVER MEMBERS INTENT
//   3. OAuth2 > URL Generator > scope "bot" (sem permissao) > abrir o link e
//      colocar o bot NUM SERVIDOR ONDE VOCE ESTA (senao ele nao ve seu status)
//   4. Ative o modo desenvolvedor no Discord > clique na sua foto > Copiar ID
//      de usuario > colar em OWNER_ID no .env
require('dotenv').config();
const express = require('express');
const { Client, Events, GatewayIntentBits } = require('discord.js');

const TOKEN = (process.env.DISCORD_TOKEN || '').trim();
const OWNER_ID = (process.env.OWNER_ID || '').trim();
const PORT = Number(process.env.PORT || 3000);
// Bio/descricao NAO existem na API do Discord p/ bots: edite no .env.
const BIO = process.env.BIO || '';
const DESCRIPTION = process.env.DESCRIPTION || '';
const CACHE_TTL = 10000;

if (!TOKEN || !OWNER_ID) {
  console.error('[vape-api] Faltando DISCORD_TOKEN ou OWNER_ID no .env (copie o .env.example).');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
  ],
});

let cache = { at: 0, data: null };

async function fetchStatus() {
  const now = Date.now();
  if (cache.data && now - cache.at < CACHE_TTL) return cache.data;
  const guilds = Array.from(client.guilds.cache.values());
  let member = null;
  for (const guild of guilds) {
    try {
      const found = await guild.members.fetch(OWNER_ID);
      if (found) { member = found; break; }
    } catch (_) { /* tenta o proximo servidor */ }
  }
  if (!member) {
    const err = new Error('owner-not-found (bot e dono no mesmo servidor? intents ligadas?)');
    err.code = 'OWNER_NOT_FOUND';
    throw err;
  }
  const user = member.user;
  const presence = member.presence;
  const status = (presence && presence.status) || 'offline';
  const activities = (presence && presence.activities) || [];
  const game = activities.find((a) => a && a.type === 0);
  // Bio de verdade nao existe na API p/ bots: usa o BIO do .env; se vazio,
  // cai pro status personalizado ao vivo (unico texto "seu" que da pra ler).
  const custom = activities.find((a) => a && a.type === 4);
  const customText = custom && custom.state ? String(custom.state) : '';
  const data = {
    username: user.username,
    globalName: user.globalName || user.username,
    avatarUrl: typeof user.displayAvatarURL === 'function' ? user.displayAvatarURL({ size: 128 }) : null,
    status: status,
    activity: game ? game.name : null,
    bio: BIO || customText,
    description: DESCRIPTION,
    updatedAt: new Date().toISOString(),
  };
  cache = { at: now, data };
  return data;
}

const app = express();
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  next();
});
app.get('/health', (req, res) => res.json({ ok: true, owner: OWNER_ID }));
app.get('/api/status', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json(await fetchStatus());
  } catch (e) {
    res.status(503).json({ error: 'offline', detail: e && e.code ? e.code : 'unknown' });
  }
});
app.listen(PORT, () => console.log('[vape-api] HTTP na porta ' + PORT));
client.once(Events.ClientReady, () => console.log('[vape-api] Bot logado como ' + client.user.tag));
client.login(TOKEN).catch((e) => {
  console.error('[vape-api] Falha no login (token invalido?):', e.message);
  process.exit(1);
});
