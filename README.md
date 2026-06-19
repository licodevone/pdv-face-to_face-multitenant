# PDV Face Delivery

Sistema PDV multiplataforma com um único `package.json` em `backend/`, backend Fastify, Prisma/PostgreSQL, Better Auth, documentação Swagger/Scalar, frontend Next.js/React em `backend/frontend/` e shell desktop Electron em `backend/desktop/`.

## Desenvolvimento

1. Entre na pasta `backend`.
2. Configure o banco com `docker compose up -d`.
3. Copie `.env.example` para `.env` e ajuste os valores.
4. Instale dependências com `pnpm install`.
5. Gere o client Prisma com `pnpm prisma generate`.
6. Rode migrations com `pnpm prisma migrate dev`.
7. Crie o primeiro admin com `pnpm create-admin` ou provisione um tenant completo com `pnpm provision-tenant`.
8. Inicie backend + frontend com `pnpm dev`.
9. Se quiser abrir também o shell desktop, rode `pnpm dev:desktop` em outro terminal.

Para subir somente o frontend, rode `pnpm dev:frontend` dentro de `backend/`. Se você já estiver em `backend/frontend/`, use `pnpm dev`, que redireciona para o script correto do pacote pai. Evite chamar `next dev` manualmente fora desses scripts, porque a aplicação depende do `package.json` e do `node_modules` que ficam em `backend/`.

## URLs

- Backend: `http://localhost:4949`
- Swagger UI: `http://localhost:4949/docs`
- Scalar API Reference: `http://localhost:4949/reference`
- Better Auth Scalar Reference: `http://localhost:4949/api/auth/reference`
- Better Auth OpenAPI JSON: `http://localhost:4949/api/auth/open-api/generate-schema`
- Prisma Studio: `http://localhost:5555` após rodar `pnpm studio`
- Frontend: `http://localhost:3000`
- Electron: pode ser aberto separadamente com `pnpm dev:desktop`.

### Acesso externo (ngrok/túnel)

Com um único link público do frontend (porta 3000), o projeto já pode encaminhar API internamente:

- O frontend usa `NEXT_PUBLIC_API_URL=/backend` por padrão.
- O Next faz proxy de `/backend/:path*` para `BACKEND_PROXY_TARGET` (padrão `http://127.0.0.1:4949`).

Assim você pode usar um único túnel ngrok para o frontend e manter o backend local.

Configure:

- `TRUSTED_ORIGINS`: inclua a origem pública do frontend (além dos localhost)
- `BETTER_AUTH_URL`: mantenha `http://localhost:4949` para ambiente local ou ajuste para URL pública do backend se usar túnel separado
- `BACKEND_PROXY_TARGET` (opcional): altere só se o backend não estiver em `127.0.0.1:4949`
- `NEXT_ALLOWED_DEV_ORIGINS` (opcional): lista separada por vírgula para liberar origens do dev server Next (ex.: `https://7fef-179-136-89-128.ngrok-free.app`)

Depois reinicie backend/frontend para aplicar as variáveis.

## Electron no Linux

O script `pnpm dev:desktop` agora detecta automaticamente `Wayland` ou `X11`, inclusive quando existe socket gráfico local mas a variável de ambiente não foi exportada para o terminal. Se não houver sessão gráfica disponível, ele encerra com uma mensagem clara em vez de deixar o Electron cair com `SIGSEGV`.

Se você estiver em um terminal sem ambiente gráfico, abra o projeto a partir de uma sessão desktop Linux com `DISPLAY` ou `WAYLAND_DISPLAY` configurado.

## Prisma Studio

Use `pnpm studio` em vez de `pnpm prisma studio`. O script sobe o Studio com `--browser none`, evitando o erro `ERR_STREAM_UNABLE_TO_PIPE` da abertura automática de navegador no Linux/Node 24. Depois acesse manualmente `http://localhost:5555`.

## Multitenant

- `POST /tenants` provisiona um tenant com admin inicial.
- `GET /tenants/resolve` resolve o tenant por query (`tenantId` ou `slug`), pelos headers `x-tenant-id` / `x-tenant-slug` ou por subdomínio.
- Rotas autenticadas validam o tenant resolvido contra o tenant da sessão.
- Os scripts `pnpm create-admin` e `pnpm provision-tenant` aceitam `TENANT_ID`, `TENANT_SLUG`, `TENANT_NAME`, `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

## Estrutura

- `backend/package.json` - pacote principal da aplicação e onde ficam as dependências compartilhadas.
- `backend/src/` - API Fastify e regras de negócio.
- `backend/prisma/` - schema Prisma e migrations.
- `backend/frontend/` - aplicação Next.js/React e um `package.json` enxuto só para encaminhar scripts locais ao pacote principal.
- `backend/desktop/` - shell Electron e adapters de hardware.

## Escopo Implementado

- Frente de caixa com carrinho, múltiplos pagamentos, troco e venda com baixa automática de estoque.
- Caixa com abertura, reforço, sangria, fechamento e cálculo financeiro.
- Clientes para CPF, fidelidade, delivery e fiado.
- Controle de estoque com sinalização de sem estoque e estoque mínimo.
- NFC-e modelada com status online/contingência para integração fiscal homologada.
- Delivery rastreável por código.
- Assinatura digital para vendas fiado ou operações marcadas.
- Auditoria e controle por perfil de operador.

Integrações fiscais, TEF/maquininhas, balança serial/USB/TCP e emissão NFC-e real dependem de provedores, certificados e homologação SEFAZ. A base já separa esses pontos em modelos/API/desktop para implementação do driver específico.


Nesse diretório no arquivo @Readme.md ele detalhe alguns alguns pontos do projeto de um sistema PDV multinenant, ele utiliza como Fastify para requisição das rotas, Zod para validação e tipagem dos dados, Better-Auth para autenticação de usuários, Prisma ORM com integração do banco de dados PostgreSQL. Para criar a documentação da API Swagger e Scalar. Faça uma analise dos arquivos deste diretório e faça uma engenharia reversa completa do projeto. 
Preciso de um relatório detalhado estruturado da seguinte forma:

1. Quais a responsabilidade de cada arquivo e as principais funções/classes dentro deles.

2. Arquitetura e Fluxo: Como os arquivos se conectam? Explique o fluxo de trabalho desde a inicialização até a execução principal.


<mark> verifique padrões de projeto que podem ser aplicado no sistema, apenas leitura dos temas e um breve
  resumo porque devo seguir esse padão.  Criacionais, Factory Method, Abstract Factory, Builder,
  Prototype, Adapter, Facade, Decorator, Proxy, Composite, Observer, Strategy, State, Command, Template
  Method, clean code</mark>