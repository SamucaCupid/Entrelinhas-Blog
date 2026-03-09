# WordPress.com privado como CMS headless

## Arquitetura

- WordPress.com (privado) = CMS/backend
- Next.js (este projeto) = frontend publico
- Token de acesso fica apenas no servidor Next.js

## Variaveis de ambiente

Use `.env.local`:

```env
WORDPRESS_COM_SITE=portalentrelinhasdotcomdotbr.wordpress.com
WORDPRESS_COM_ACCESS_TOKEN=seu_token_privado
WORDPRESS_COM_API_BASE=https://public-api.wordpress.com/wp/v2/sites
WORDPRESS_REVALIDATE_SECONDS=60
WORDPRESS_TIMEOUT_MS=10000
REVALIDATE_WEBHOOK_SECRET=seu_segredo_forte
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

Importante:
- Se o site/API exigir autenticacao, `WORDPRESS_COM_ACCESS_TOKEN` precisa ser um token real.
- Se o site/API estiver acessivel publicamente, o token pode ficar vazio.

Opcional (modo legado publico):

```env
WORDPRESS_API_URL=https://public-api.wordpress.com/wp/v2/sites/portalentrelinhasdotcomdotbr.wordpress.com
```

Widget de eventos da cidade (opcional, Ticketmaster):

```env
TICKETMASTER_API_KEY=seu_token_ticketmaster
CITY_EVENTS_CITY=Vitoria da Conquista
CITY_EVENTS_COUNTRY=BR
```


## Fluxo de dados

1. Server Components chamam `src/lib/wp.ts`.
2. `src/lib/wp.ts` delega para `src/lib/wordpress/service.ts`.
3. `service.ts` chama `client.ts` (`server-only`) com `Authorization: Bearer`.
4. Resposta volta normalizada para `PostUI` e `Category`.

## Rotas proxy internas

- `GET /api/cms/posts?limit=12`
- `GET /api/cms/posts?categorySlug=politica&limit=12`
- `GET /api/cms/posts/[slug]`

Essas rotas nao expoem token e retornam JSON sanitizado.

## Publicidade (Ad Slots no Next.js)

Neste projeto, a entrega de anuncios fica no frontend Next.js (nao depende de plugin do WordPress.com Free).

Slots atuais:

- `rail-left-desktop`
- `rail-right-desktop`
- `sidebar-home`
- `sidebar-post`
- `sidebar-category`
- `mobile-feed`

Fluxo recomendado:

1. Comercial fecha campanha (marca, link, datas, editoria, dispositivo).
2. Campanha entra em `AD_CAMPAIGNS_JSON` (ou em `src/lib/ads/config.ts`).
3. O slot seleciona campanha ativa por data/prioridade/categoria.
4. Clique passa por `GET /api/ads/click` para log server-side e redirecionamento.

Variaveis relevantes:

```env
AD_SYSTEM_ENABLED=true
# AD_CAMPAIGNS_JSON=[...]
```

### Operacao sem editar codigo (painel admin + Supabase)

Para gerenciar anuncios sem tocar no repositorio:

1. Configure variaveis de admin no servidor:
   - `ADMIN_PANEL_USERNAME`
   - `ADMIN_PANEL_PASSWORD`
   - `ADMIN_SESSION_SECRET`
2. Configure Supabase:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ADS_TABLE` (default: `ad_campaigns`)
   - `SUPABASE_ADS_AUDIT_TABLE` (default: `ad_campaign_audit_logs`)
   - `SUPABASE_ADS_STORAGE_BUCKET` (default: `ads-images`)
   - `ADS_IMAGE_MAX_BYTES` (default: `5242880`)
   - Crie bucket publico no Storage para upload das imagens dos anuncios.
3. Rode o SQL de setup:
   - `docs/supabase-ads-setup.sql`
4. Acesse:
   - `/admin/login`
   - `/admin/anuncios`

Seguranca:

- cookie de sessao `httpOnly` com expiracao
- credenciais admin validadas no servidor
- chave `SUPABASE_SERVICE_ROLE_KEY` nunca vai para o client
- trilha de auditoria em `ad_campaign_audit_logs`
- rate-limit de login (`ADMIN_LOGIN_MAX_ATTEMPTS`, `ADMIN_LOGIN_WINDOW_SECONDS`, `ADMIN_LOGIN_LOCK_SECONDS`)
- allowlist de IP para `/admin/*` e `/api/admin/*` (`ADMIN_IP_ALLOWLIST_ENABLED`, `ADMIN_ALLOWED_IPS`)

Observacao:

- a rota `/admin/login` pode ser descoberta, mas isso nao significa acesso.
- a protecao real esta em senha forte, sessao assinada, rate-limit e segredo server-side.

Exemplo de allowlist (producao):

```env
ADMIN_IP_ALLOWLIST_ENABLED=true
ADMIN_ALLOWED_IPS=177.23.10.5,177.23.10.0/24
```

Dica:

- mantenha `ADMIN_IP_ALLOWLIST_ENABLED=false` em dev local ou inclua `127.0.0.1,::1` na lista.

## Revalidacao imediata por webhook

Rota no Next:

- `POST /api/revalidate`

Seguranca:

- obrigatorio enviar secret (header `x-revalidate-secret`, body `secret` ou query `?secret=...`)
- o valor deve bater com `REVALIDATE_WEBHOOK_SECRET`

Exemplo de payload JSON:

```json
{
  "secret": "seu_segredo_forte",
  "slug": "titulo-da-noticia",
  "categorySlugs": ["politica", "eventos"]
}
```

Esse payload revalida:

- `/`
- `/busca`
- `/post/titulo-da-noticia`
- `/categoria/politica`
- `/categoria/eventos`

No WordPress, configure um webhook de `post published/updated` apontando para `https://SEU_DOMINIO/api/revalidate`.

### Webhook no WordPress.com (campo a campo)

No painel do WordPress.com:

1. `Ferramentas -> Marketing -> Conexoes -> Webhooks` (ou menu equivalente de Webhooks).
2. Clique em `Adicionar webhook`.
3. Preencha:
   - `Evento`: `publish_post`
   - `Metodo`: `POST`
   - `URL`: `https://SEU_DOMINIO/api/revalidate`
   - `Formato`: `application/json` (ou `x-www-form-urlencoded`)
4. Corpo/payload recomendado:
   - `secret` = `seu_segredo_forte`
   - `post_name` = `{post_name}`
   - `post_category` = `{post_category}`
   - `permalink` = `{permalink}`
5. Salve e publique/atualize um post para testar.

Observacoes:
- Nossa rota aceita tanto os campos custom (`slug`, `categorySlugs`) quanto os campos nativos acima (`post_name`, `post_category`).
- Mesmo sem categoria no payload, as categorias editoriais principais sao revalidadas automaticamente.

## WordPress.com Free (sem webhook)

Se voce estiver no plano free e nao tiver Webhooks/Plugins no painel:

- use ISR por tempo no frontend
- mantenha `WORDPRESS_REVALIDATE_SECONDS=60` para posts
- mantenha categorias/listagens com TTL maior (120s)
- use `POST /api/revalidate` apenas para disparo manual quando precisar

Com isso, publicacoes novas entram automaticamente apos o intervalo de revalidate, mesmo sem webhook.

### Teste manual da revalidacao (quando quiser)

`curl`:

```bash
curl -X POST "https://SEU_DOMINIO/api/revalidate" \
  -H "Content-Type: application/json" \
  -d '{"secret":"SEU_REVALIDATE_WEBHOOK_SECRET","slug":"slug-do-post","categorySlugs":["politica"]}'
```

PowerShell:

```powershell
Invoke-RestMethod -Method POST -Uri "https://SEU_DOMINIO/api/revalidate" -ContentType "application/json" -Body '{"secret":"SEU_REVALIDATE_WEBHOOK_SECRET","slug":"slug-do-post","categorySlugs":["politica"]}'
```

## Validacao rapida

1. Teste o proxy:
   - `http://localhost:3000/api/cms/posts?limit=1`
2. Teste detalhe:
   - `http://localhost:3000/api/cms/posts/hello-world`
3. Teste frontend:
   - `http://localhost:3000`
   - `http://localhost:3000/post/hello-world`
4. Teste widget de eventos da cidade:
   - com `TICKETMASTER_API_KEY` valido, o bloco "Eventos em Vitoria da Conquista" deve mostrar eventos externos
   - sem chave ou sem resultados, o bloco cai para posts da categoria `eventos` do WordPress

## Fluxo recomendado (1 vez, sem dor de cabeca)

1. Configure o site:
   - `WORDPRESS_COM_SITE=...`
2. (Opcional) Configure token se o CMS privado exigir:
   - `WORDPRESS_COM_ACCESS_TOKEN=...`
3. Rode:
   - `npm run cms:check`
4. Se der `OK`, suba o frontend:
   - `npm run dev`

Se o `cms:check` falhar com `401/403`, o site exige token valido.

## Checklist Vercel (producao)

1. Projeto na Vercel conectado ao repositorio.
2. Configure em `Project Settings > Environment Variables`:
   - `WORDPRESS_COM_SITE`
   - `WORDPRESS_COM_ACCESS_TOKEN` (somente se necessario para autenticacao)
   - `WORDPRESS_COM_API_BASE` (opcional, recomendado manter)
   - `WORDPRESS_REVALIDATE_SECONDS` (opcional)
   - `WORDPRESS_TIMEOUT_MS` (opcional)
   - `REVALIDATE_WEBHOOK_SECRET` (recomendado para webhook)
   - `NEXT_PUBLIC_SITE_URL` (recomendado para canonical/SEO)
3. Salve e faca novo deploy.
4. Teste:
   - `https://SEU_DOMINIO/api/cms/posts?limit=1`
   - `https://SEU_DOMINIO`
