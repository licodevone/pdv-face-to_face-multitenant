# Prompts Criados vs Prompts pendentes

<mark> verifique padrões de projeto que podem ser aplicado no sistema, apenas leitura dos temas e um breve
  resumo porque devo seguir esse padão.  Criacionais, Factory Method, Abstract Factory, Builder,
  Prototype, Adapter, Facade, Decorator, Proxy, Composite, Observer, Strategy, State, Command, Template
  Method, clean code</mark>

  Análise detalhado de engenharia reversa do sistema.

reverse_engineering_report.md
Resumo dos Pontos Analisados no Relatório:

1. `Responsabilidade de Componentes e Arquivos:` Mapeamento de como o backend em Fastify (src/), o frontend Next.js (frontend/), o banco de dados via Prisma (prisma/) e o empacotamento com Electron (desktop/) organizam suas respectivas funções e classes principais, incluindo o isolamento multitenant no banco de dados e rotas.

2. `Arquitetura e Fluxo do Sistema:` Diagramas de sequência detalhando o processo de inicialização (bootstrapping) do ambiente dev com dev.ts , e o fluxo de transação ponta a ponta durante o fechamento de uma venda com RegisterSale  envolvendo integração com balanças e maquininhas de cartão.

3. `Padrões de Projeto Aplicados/Propostos:` Análise de como os padrões de projeto recomendados (como Factory Method, Abstract Factory, Builder, Adapter, Facade, Composite, Observer, Strategy, State, Command, Template Method e práticas de Clean Code) estão presentes ou podem ser incorporados no código para melhorar o desacoplamento e a manutenibilidade do sistema.

Leia o arquivo design_handoff/frente-de-caixa/FrenteDeCaixa.dc.html — é o 
protótipo de referência (HTML + lógica) do layout atual da Frente de Caixa.
Leia também design_handoff/README.md e os tokens em design_handoff/tokens/.

Reescreva a tela frontend/src/app/page.tsx para que o layout fique IGUAL ao 
protótipo, mantendo a stack atual (Next.js + React + os tokens CSS em globals.css). 
Replique exatamente:

COLUNA ESQUERDA (cada bloco com botão chevron de recolher à esquerda):
- "Sessão do caixa": 3 tiles (sessão, produtos ativos, ticket médio)
- "Estoque baixo": subtítulo + painel "Alerta de estoque mínimo" (lista colapsável inteira)
- "Menu de Categorias": grade de chips 4 colunas com ícones lucide
- Campo de busca colapsável
- Grade de produtos (cards com imagem, nome, estoque, preço, badge)

COLUNA DIREITA (checkout):
- Header "Carrinho" + total
- Painéis colapsáveis: "Resumo da venda" (Subtotal/Troco), "Caixa aberto",
  "Inserir ou retirar valores" (botões que abrem modal de suprimento/sangria)
- "Itens da venda" (lista)
- "Cliente" (colapsável: selecionar cliente + desconto %)
- "Formas" (radio 1X/2X/3X)
- Pagamento + Valor recebido + "Adicionar pagamento"
- TOTAL A PAGAR + Finalizar venda

REGRAS DE ESTILO:
- Todos os títulos de seção: cor var(--muted), 0.78rem, peso 800, 
  text-transform uppercase, letter-spacing 0.06em
- Modais: abertura de caixa obrigatória + movimentação (valor + motivo)
- Seletor de paleta de cores na navbar (data-accent no html)
- Modo escuro = fundo preto/cinza; modo claro = azul

NÃO invente telas novas. Apenas replique o protótipo no código de produção.
Use os componentes existentes em frontend/src/components/ quando possível.