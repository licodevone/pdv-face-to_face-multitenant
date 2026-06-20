# Handoff: PDV Face Delivery — Sistema Multitenant

## Visão Geral

Sistema PDV (Point of Sale) multiplataforma com frente de caixa, controle de estoque, delivery rastreável, emissão de NFC-e fiscal e suporte multitenant. Os templates de design cobrem três superfícies principais:

1. **Login** — Autenticação com roles de acesso
2. **Frente de caixa** — PDV operacional completo
3. **Painel administrativo multitenant** — Gestão de clientes/tenants

---

## ⚠️ Sobre os arquivos de design

Os arquivos `.dc.html` neste pacote são **protótipos de referência criados em HTML** — não são código de produção. A tarefa do desenvolvedor é **recriar esses designs no ambiente do codebase real** (`licodevone/backup-pdv-face-to_face-multitenant`) usando os padrões e bibliotecas já estabelecidos no projeto (Node.js + Fastify backend, React/Vue frontend).

**Fidelidade: Alta (hi-fi)** — Os protótipos são pixel-perfect com cores finais, tipografia, espaçamentos e interações. O desenvolvedor deve recriar a UI com fidelidade máxima usando as bibliotecas existentes do codebase.

---

## Repositório de origem

- **GitHub:** `https://github.com/licodevone/backup-pdv-face-to_face-multitenant`
- Explore o repositório para entender a estrutura do backend e frontend existentes.

---

## Telas / Views

### 1. Login (`login/Login.dc.html`)

**Propósito:** Autenticar o usuário e redirecioná-lo para a tela correta conforme a role.

**Layout:**
- `min-height: 100vh`, fundo com gradiente radial sobre `--background: #090d1a`
- Grid de 2 colunas: `minmax(0, 1.2fr)` + `minmax(320px, 0.8fr)`
- Breakpoint mobile ≤860px: empilha em coluna única, painel esquerdo some

**Painel esquerdo — Apresentação:**
- Logo SVG: `assets/brand-logo.svg` — `height: clamp(64px, 8vw, 100px)`
- Título `"Face Delivery"`: `font-size: clamp(2.4rem, 5.8vw, 5.2rem)`, `letter-spacing: -0.06em`, `font-weight: 900`
- Descrição: `font-size: clamp(1rem, 1.6vw, 1.18rem)`, `color: --muted (#9aa4b2)`, `line-height: 1.75`
- Badges de features: pills com `background: color-mix(in srgb, --accent 12%, --surface)`, `border-radius: 999px`, `font-size: 0.82rem`, `font-weight: 800`
- Fundo com dot grid: `background-image: radial-gradient(circle, rgba(96,165,250,0.22) 0 2px, transparent 2px)`, `background-size: 28px 28px`

**Painel direito — Formulário:**
- Card: `background: color-mix(in srgb, --surface 86%, transparent)`, `border: 1px solid --line`, `border-radius: 1.6rem`, `box-shadow: --shadow`
- Eyebrow: `"Bem-vindo"`, `font-size: 0.72rem`, `font-weight: 900`, `letter-spacing: 0.16em`, `text-transform: uppercase`, `color: --accent-soft (#93c5fd)`
- Título: `"Acessar o PDV"`, `font-size: clamp(2rem, 4vw, 3.4rem)`, `letter-spacing: -0.06em`
- Campo e-mail + campo senha: classe `.pdv-input`
- Botão submit: `"Entrar no PDV"`, classe `.pdv-btn.pdv-btn--primary.pdv-btn--block`
- Erro inline: fundo vermelho translúcido, ícone `alert-circle` (Lucide)

**Lógica de autenticação (simulada → integrar com JWT real):**

```js
const users = [
  { role: "sistema",    name: "Admin do sistema",  email: "admin@pdv.local",      password: "Admin@2024",   dest: "/admin" },
  { role: "admin",      name: "Admin do cliente",  email: "admin@loja.com.br",    password: "Admin@2024",   dest: "/pdv" },
  { role: "gerente",    name: "Gerente",            email: "gerente@loja.com.br",  password: "Gerente@2024", dest: "/pdv" },
  { role: "caixa",      name: "Operador de caixa", email: "caixa@loja.com.br",    password: "Caixa@2024",   dest: "/pdv" },
  { role: "estoquista", name: "Estoquista",         email: "estoque@loja.com.br",  password: "Estoque@2024", dest: "/pdv" },
];
// Na autenticação real: POST /auth/login → { token, user: { role, name, email } }
// Salvar em localStorage: localStorage.setItem("pdv_user", JSON.stringify(user))
```

**Roteamento por role:**
- `sistema` → `/admin` (Painel Multitenant)
- `admin`, `gerente`, `caixa`, `estoquista` → `/pdv` (Frente de Caixa)

---

### 2. Frente de Caixa (`pdv/Pdv.dc.html`)

**Propósito:** PDV operacional — catálogo de produtos, carrinho, pagamento e métricas da sessão.

**Layout geral:**
- `min-height: 100vh`, padding `clamp(0.5rem, 1vw, 0.75rem)`
- Stack vertical: `topbar` → `métricas` → `grid principal`
- Grid principal: `1.35fr` (catálogo) + `minmax(360px, 0.72fr)` (checkout)
- Breakpoints: ≤1100px → checkout desce; ≤768px → 1 coluna; ≤600px → chips 2 colunas

#### Topbar (navbar)
- Background: `var(--panel-gradient)` com glassmorphism
- Esquerda: logo `assets/brand-logo.svg` (24px) + nome "Face Delivery"
- Centro: eyebrow `"PDV — FRENTE DE CAIXA"`
- Direita: dropdown do operador + toggle de tema

**Avatar do operador:**
```js
// Lê do localStorage:
const user = JSON.parse(localStorage.getItem("pdv_user") || "{}");
const initials = user.name?.split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase() || "OP";
const roleLabel = {
  sistema: "Administrador do sistema",
  admin: "Admin do cliente",
  gerente: "Gerente",
  caixa: "Operador de caixa",
  estoquista: "Estoquista"
}[user.role] || "Operador";
```

**Dropdown do operador (itens):**
1. Atualizar painel → `window.location.reload()`
2. Perfil do operador → modal de perfil
3. Menu gerencial → abre drawer/modal gerencial
4. Administração do sistema → `/admin` (visível para role `sistema`)
5. Sair → limpa `localStorage.removeItem("pdv_user")` + redirect `/login`

#### Métricas de sessão (3 tiles)
| Tile | Valor | Ícone |
|------|-------|-------|
| Ticket médio | Calculado do histórico de vendas | `trending-up` |
| Sessão do caixa | Timer desde abertura | `clock` |
| Produtos ativos | Count de produtos com estoque > 0 | `package` |

#### Catálogo de produtos

**Chips de categoria (4 por linha, 2 em mobile):**
- Chip ativo: `background: var(--button-bg)`, `color: #fff`, `font-weight: 900`
- Chip inativo: `background: var(--surface-soft)`, `border: 1px solid var(--line)`
- Categorias com ícones Lucide:
  - TODOS → `grid-2x2`
  - Lanches → `sandwich`
  - Bebidas → `cup-soda`
  - Sobremesas → `cake`
  - Combos → `package-2`
  - Açaí → `droplets`
  - Limpeza → `sparkles`

**Cards de produto (4 por linha):**
- `border-radius: var(--radius-md)`, `background: var(--surface-soft)`, `border: 1px solid var(--line)`
- Imagem placeholder: `height: 80px`, degradê azul
- Nome: `font-size: 0.78rem`, `font-weight: 800`, `line-height: 1.3`, `max 2 linhas`
- Preço: `font-size: 0.88rem`, `font-weight: 900`, `color: var(--accent-soft)`
- Estoque badge: `font-size: 0.65rem`, `font-weight: 800`
  - > 5 unidades → `color: var(--success)`, label `"X em estoque"`
  - 1–5 unidades → `color: var(--warning)`, label `"Últimas X"`
  - 0 unidades → `color: var(--danger)`, label `"ESGOTADO"`, botão desabilitado

**Toast de produto esgotado:**
- Posição: `fixed`, `top: 1.2rem`, `left: 50%`, `transform: translateX(-50%)`
- `background: color-mix(in srgb, var(--danger) 92%, #111827)`
- `border-radius: var(--radius-md)`, `font-weight: 900`, `color: #fff`
- Auto-dismiss em **3 segundos**

#### Checkout / Carrinho

**Identificação do cliente (select):**
- Opções: `Consumidor Final` (padrão, sem CPF) + lista de clientes cadastrados
- Ao selecionar "Consumidor Final": nenhum CPF exigido

**Lista de itens do carrinho:**
- Linhas zebradas: `--cart-row-zebra-odd` / `--cart-row-zebra-even`
- Controles de quantidade: `−` / `+` com botão remover `×`
- Quantidade não pode ser < 1 (remover ao chegar a 0)

**Desconto:**
- Campo de percentual `0–100%`
- Deduzido do subtotal visualmente

**Totais:**
- Subtotal, desconto (se > 0), **Total em destaque**
- Total: `font-size: var(--text-3xl)`, `font-weight: 900`, `color: var(--accent-soft)`

**Pagamento (grid 2 colunas):**
| Botão | Ação |
|-------|------|
| Dinheiro | Registra venda, limpa carrinho |
| Cartão | Idem |
| Pix | Idem |
| Cancelar | Limpa carrinho sem registrar |

---

### 3. Menu Gerencial (drawer/modal dentro da Frente de Caixa)

**Propósito:** Acesso rápido a sub-sistemas operacionais para o operador autorizado.

**Layout:**
- Overlay: `position: fixed; inset: 0; background: rgba(5,12,28,0.72); backdrop-filter: blur(8px)`
- Card central: `max-width: 520px`, `background: var(--surface)`, `border-radius: var(--radius-xl)`
- Grid de botões: 3 colunas (admin) ou 2 colunas (mobile)

**Itens do menu:**
| Item | Ícone | View |
|------|-------|------|
| Categorias | `blocks` | CRUD de categorias |
| Produtos | `package` | CRUD de produtos + estoque |
| Clientes | `users` | Lista de clientes |
| Estoque | `warehouse` | Saldo por produto |
| Relatórios | `clipboard-list` | Modelos de relatório |
| Configurações | `settings` | Config. de dispositivos |

**Gestão de estoque (sub-view):**
- Tabela: Produto / Categoria / Saldo atual / Última movimentação / Ações
- Botões: Entrada (+) / Saída (−) / Ajuste manual
- Badge de saldo: verde (>5), amarelo (1–5), vermelho (0)
- **Estoque é decrementado automaticamente ao finalizar venda**

---

### 4. Painel Administrativo Multitenant (`admin-multitenant/AdminMultitenant.dc.html`)

**Propósito:** Gerenciamento de tenants (clientes do sistema) e configuração de perfis de acesso.

**Layout:**
- Sidebar esquerda fixa: 200px de largura, lista de seções
- Conteúdo principal: stack de seções

**Seções:**
1. **Lista de tenants** — tabela com nome, plano, status, ações (editar, desativar)
2. **Criar tenant** — formulário com campos: razão social, CNPJ, e-mail, plano, domínio
3. **Configuração de telas por perfil** — toggles de seções por perfil (Admin, Caixa, Estoquista)

**Configuração de telas por perfil:**
```js
const profileConfig = {
  admin:      { metricas: true, gerencial: true, categorias: true, busca: true, carrinho: true, cliente: true, desconto: true, relatorios: true, "config-disp": true },
  caixa:      { metricas: true, gerencial: false, categorias: true, busca: true, carrinho: true, cliente: true, desconto: false, relatorios: false, "config-disp": false },
  estoquista: { metricas: true, gerencial: false, categorias: false, busca: true, carrinho: false, cliente: false, desconto: false, relatorios: true, "config-disp": false, estoque: true, "entrada-saida": true },
};
// Persistir no backend: PATCH /tenants/:id/profile-config
```

---

## Interações e Comportamento

### Fluxo completo de autenticação
```
Login → POST /auth/login → JWT + { role, name, email }
     → localStorage.setItem("pdv_user", JSON.stringify(user))
     → redirect por role (ver tabela acima)

Logout → localStorage.removeItem("pdv_user") → redirect /login
```

### Gestão de estoque em tempo real
```
addToCart(produto):
  1. Verificar estoque atual: GET /produtos/:id/stock
  2. Se stock <= 0: mostrar toast de esgotado (3s), bloquear adição
  3. Se stock > 0: adicionar ao carrinho local (sem debitar ainda)

finalizarVenda():
  1. POST /vendas com { itens, cliente, desconto, formaPagamento }
  2. Backend debita estoque atomicamente
  3. Frontend limpa carrinho + atualiza saldos
```

### Toast de produto esgotado
- Disparo: tentativa de `addToCart` com `stock <= 0`
- Duração: 3000ms, então some
- Só 1 toast por vez (cancela timer anterior)

### Animações / Transições
- Todos os botões: `transition: all 0.18s ease`
- Dropdown de operador: `transition: opacity 0.18s ease`
- Chips de categoria: `transition: background 0.18s ease`
- Easing padrão: `cubic-bezier(0.4, 0, 0.2, 1)`

---

## State Management

### Estado da sessão (localStorage)
```js
// Chave: "pdv_user"
{ role: "caixa" | "admin" | "gerente" | "estoquista" | "sistema", name: string, email: string }
```

### Estado da frente de caixa
```js
{
  cat: string,            // categoria ativa no catálogo
  query: string,          // busca atual
  theme: "dark" | "light",
  toast: string,          // mensagem do toast (vazio = oculto)
  sessionUser: object,    // lido do localStorage
  opMenuOpen: boolean,    // dropdown do operador
  managerOpen: boolean,   // modal gerencial
  managerView: string | null, // null = menu, string = sub-view
  cart: CartItem[],       // { id, name, price, qty }
  stock: Record<id, number>,  // saldo por produto
  clienteId: string,      // cliente selecionado
  desconto: number,       // percentual 0–100
  customers: Customer[],  // lista de clientes
}
```

---

## Design Tokens

### Cores (dark mode padrão)

| Token | Valor | Uso |
|-------|-------|-----|
| `--background` | `#090d1a` | Base do app (navy profundo) |
| `--background-soft` | `#101827` | Base elevada |
| `--surface` | `#111827` | Card / painel |
| `--surface-soft` | `#172033` | Card aninhado |
| `--text` | `#f8fafc` | Texto primário |
| `--muted` | `#9aa4b2` | Texto secundário |
| `--line` | `rgba(148,163,184,0.18)` | Borda hairline |
| `--accent` | `#60a5fa` | Azul primário da marca |
| `--accent-strong` | `#3b82f6` | Azul forte (totais) |
| `--accent-soft` | `#93c5fd` | Azul suave (eyebrows) |
| `--success` | `#22c55e` | Disponível / em estoque |
| `--warning` | `#fbbf24` | Estoque baixo |
| `--danger` | `#fb7185` | Esgotado / erro |
| `--button-bg` | `#2563eb` | Background do botão primário |
| `--panel-gradient` | `linear-gradient(135deg, rgba(37,99,235,0.96), rgba(79,70,229,0.9), rgba(14,165,233,0.78))` | Navbar / topbar |

### Cores (light mode — `html[data-theme="light"]`)

| Token | Valor |
|-------|-------|
| `--background` | `#f0f2f5` |
| `--surface` | `#ffffff` |
| `--text` | `#1c1e21` |
| `--muted` | `#65676b` |
| `--accent` | `#1877f2` |
| `--accent-soft` | `#42a5ff` |
| `--danger` | `#e11d48` |
| `--button-bg` | `#1877f2` |

### Tipografia

| Token | Valor |
|-------|-------|
| `--font-sans` | `Inter, ui-sans-serif, system-ui, -apple-system, sans-serif` |
| `--text-eyebrow` | `0.74rem` + `uppercase` + `letter-spacing: 0.16em` |
| `--text-sm` | `0.82rem` |
| `--text-base` | `0.92rem` |
| `--text-lg` | `1.3rem` |
| `--text-3xl` | `2.6rem` (total do checkout) |
| `--weight-bold` | `800` |
| `--weight-black` | `900` |
| `--tracking-tight` | `-0.06em` (headings grandes) |

### Espaçamento

| Token | Valor |
|-------|-------|
| `--space-2` | `0.35rem` |
| `--space-3` | `0.55rem` |
| `--space-4` | `0.65rem` |
| `--space-5` | `0.75rem` |
| `--space-6` | `0.9rem` |

### Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | `0.6rem` | Chips, botões pequenos |
| `--radius-md` | `0.95rem` | Botões, cards de produto |
| `--radius-lg` | `1rem` | Tiles de métricas |
| `--radius-xl` | `1.35rem` | Catálogo / checkout |
| `--radius-2xl` | `1.6rem` | Cards de login |
| `--radius-pill` | `999px` | Pills, badges, status |

### Sombras

| Token | Valor |
|-------|-------|
| `--shadow` | `0 24px 70px rgba(2,6,23,0.34), 0 10px 28px rgba(2,6,23,0.22)` |
| `--shadow-card` | `0 10px 22px rgba(2,6,23,0.08), inset 0 1px 0 rgba(255,255,255,0.06)` |
| `--button-shadow` | `0 16px 34px rgba(37,99,235,0.26), inset 0 1px 0 rgba(255,255,255,0.08)` |
| `--glow-soft` | `0 0 0.65rem rgba(96,165,250,0.28), 0 16px 38px rgba(96,165,250,0.22)` |

---

## Assets

| Arquivo | Uso |
|---------|-----|
| `assets/brand-logo.svg` | Logo principal — navbar, login, splash |
| `assets/fonts/Inter-*.woff2` | Fonte primária (todos os pesos 400–900) |
| `styles.css` | Entry point — importa todos os tokens |
| `tokens/colors.css` | Tokens de cor (dark + light) |
| `tokens/typography.css` | Tokens de tipografia |
| `tokens/spacing.css` | Tokens de espaçamento, radius, sombra |

**Ícones:** Lucide Icons via CDN
```html
<script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>
<!-- Após montar o DOM: lucide.createIcons() -->
```

---

## Arquivos de referência

| Arquivo | Descrição |
|---------|-----------|
| `design_handoff/login/Login.dc.html` | Protótipo da tela de login |
| `design_handoff/pdv/Pdv.dc.html` | Protótipo da frente de caixa |
| `design_handoff/admin-multitenant/AdminMultitenant.dc.html` | Protótipo do painel admin |
| `design_handoff/styles.css` | Entry point CSS (importa todos os tokens) |
| `design_handoff/tokens/` | Arquivos de tokens (colors, typography, spacing) |
| `design_handoff/assets/` | Logos, fontes e ícones |
| `design_handoff/readme.md` | Guia completo do design system |

---

## Implementação sugerida (ordem)

1. **Instalar Inter** via Google Fonts ou copiar `assets/fonts/Inter-*.woff2`
2. **Copiar `tokens/*.css`** para o projeto, importar do CSS global
3. **Implementar autenticação JWT** com as roles definidas (`sistema`, `admin`, `gerente`, `caixa`, `estoquista`)
4. **Implementar tela de Login** com formulário + roteamento por role
5. **Implementar Frente de Caixa** — navbar com avatar dinâmico, catálogo, carrinho, checkout
6. **Integrar gestão de estoque** — decremento atômico no backend ao finalizar venda
7. **Implementar toast** de produto esgotado
8. **Implementar Painel Admin** — CRUD de tenants + configuração de perfis
9. **Testar responsividade** nos breakpoints: 1100px, 860px, 768px, 600px

---

*Dúvidas ou ajustes no design? Contate o suporte: +55 (12) 98860-1020 (WhatsApp)*
