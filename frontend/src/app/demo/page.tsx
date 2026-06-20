"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Demonstração auto-reproduzida do PDV usada nas "telas" (desktop e celular)
 * do hero da home. Não depende de backend nem de autenticação: roda um roteiro
 * fixo — tela de login por ~2s, depois a frente de caixa executando o fluxo de
 * adicionar produtos ao carrinho, pagamento e finalização da compra — e repete.
 *
 * Reutiliza as classes do PDV real (globals.css), então herda o visual e a
 * responsividade: o mesmo componente renderiza em layout desktop (viewport
 * largo) e responsivo (viewport estreito) conforme a largura do iframe.
 */

interface DemoProduct {
  id: string;
  name: string;
  image: string;
  priceInCents: number;
  stock: number;
  unit: "UNIT" | "KG";
}

interface DemoCartItem {
  product: DemoProduct;
  quantity: number;
}

interface DemoPayment {
  method: string;
  label: string;
  amountInCents: number;
}

const IMG_BASE = "/img/produtos";

const DEMO_PRODUCTS: DemoProduct[] = [
  { id: "leite", name: "Leite Integral 1L", image: `${IMG_BASE}/sku-leite-1l.png`, priceInCents: 549, stock: 48, unit: "UNIT" },
  { id: "cafe", name: "Café Torrado 500g", image: `${IMG_BASE}/sku-cafe-500g.png`, priceInCents: 1490, stock: 32, unit: "UNIT" },
  { id: "arroz", name: "Arroz Tipo 1 5kg", image: `${IMG_BASE}/sku-arroz-5kg.png`, priceInCents: 2490, stock: 21, unit: "UNIT" },
  { id: "feijao", name: "Feijão Carioca 1kg", image: `${IMG_BASE}/sku-feijao-1kg.png`, priceInCents: 890, stock: 40, unit: "UNIT" },
  { id: "refri", name: "Refrigerante 2L", image: `${IMG_BASE}/sku-refrigerante-2l.png`, priceInCents: 990, stock: 60, unit: "UNIT" },
  { id: "acucar", name: "Açúcar Refinado 1kg", image: `${IMG_BASE}/sku-acucar-1kg.png`, priceInCents: 450, stock: 55, unit: "UNIT" },
];

// Produtos que o roteiro adiciona ao carrinho, na ordem.
const SCRIPT_PRODUCT_IDS = ["leite", "cafe", "arroz"] as const;

// Mesmas categorias da frente de caixa real (7) — somadas ao botão do menu
// gerencial, totalizam os 8 elementos da barra de categorias.
const CATEGORY_CHIPS: { label: string; count: number }[] = [
  { label: "Todos", count: 6 },
  { label: "Alimentos", count: 5 },
  { label: "Bebidas", count: 1 },
  { label: "Sobremesas", count: 0 },
  { label: "Limpeza", count: 0 },
  { label: "PetShop", count: 0 },
  { label: "Bazar", count: 0 },
];

const moneyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatMoney = (valueInCents: number) => moneyFormatter.format(valueInCents / 100);
const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);

function BrandLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5L90 25V75L50 95L10 75V25L50 5Z" fill="#ffffff" opacity="0.1" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" />
      <path d="M35 30H65V40H45V50H60V60H45V75" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M55 30C75 30 85 45 85 52.5C85 60 75 75 55 75" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export default function PdvDemoPage() {
  const [phase, setPhase] = useState<"loading" | "login" | "pdv">("loading");
  const [cartItems, setCartItems] = useState<DemoCartItem[]>([]);
  const [payments, setPayments] = useState<DemoPayment[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const checkoutRef = useRef<HTMLElement | null>(null);

  const subtotalInCents = cartItems.reduce(
    (total, item) => total + item.product.priceInCents * item.quantity,
    0,
  );
  const totalInCents = subtotalInCents;
  const paidInCents = payments.reduce((total, payment) => total + payment.amountInCents, 0);
  const changeInCents = Math.max(paidInCents - totalInCents, 0);

  // Esconde as barras de rolagem dentro do iframe (mock de tela limpa),
  // permitindo ainda a rolagem programática usada no celular.
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent =
      "html,body{scrollbar-width:none;-ms-overflow-style:none;}" +
      "html::-webkit-scrollbar,body::-webkit-scrollbar{width:0;height:0;display:none;}";
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // No celular (viewport estreito, ~390px), rola até o carrinho para mostrar a
  // parte inferior do layout. No desktop (viewport largo) não faz nada.
  // Usa window.scrollTo em vez de scrollIntoView para evitar que o scroll
  // propague ao documento pai (home page) via iframe same-origin.
  useEffect(() => {
    if (phase !== "pdv") return;
    if (typeof window === "undefined" || window.innerWidth > 480) return;
    const timeoutId = window.setTimeout(() => {
      const el = checkoutRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "smooth" });
    }, 200);
    return () => window.clearTimeout(timeoutId);
  }, [phase, cartItems, payments]);

  // Roteiro principal — roda em loop até desmontar.
  useEffect(() => {
    let cancelled = false;
    // Alterna o tema a cada ciclo: um no modo claro, o seguinte no escuro.
    let themeMode: "light" | "dark" = "light";
    const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    const reset = () => {
      setCartItems([]);
      setPayments([]);
      setPaymentAmount("");
      setActiveProductId(null);
      setToastMessage("");
    };

    const addToCart = (product: DemoProduct) => {
      setCartItems((current) => {
        const existing = current.find((item) => item.product.id === product.id);
        if (existing) {
          return current.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }
        return [...current, { product, quantity: 1 }];
      });
    };

    async function run() {
      while (!cancelled) {
        // 0) "Refresh" do sistema ao entrar — tela de carregamento/bootstrap.
        //    Define o tema do ciclo (claro/escuro) já nesse momento.
        document.documentElement.dataset.theme = themeMode;
        reset();
        setPhase("loading");
        await sleep(1600);
        if (cancelled) return;

        // 1) Tela de acesso por ~3s (com o SVG criativo animado).
        setPhase("login");
        await sleep(3000);
        if (cancelled) return;

        // 2) Entra na frente de caixa.
        setPhase("pdv");
        await sleep(750);
        if (cancelled) return;

        // 3) Adiciona os produtos do roteiro ao carrinho.
        for (const productId of SCRIPT_PRODUCT_IDS) {
          const product = DEMO_PRODUCTS.find((item) => item.id === productId);
          if (!product) continue;
          setActiveProductId(product.id);
          await sleep(480);
          if (cancelled) return;
          addToCart(product);
          setActiveProductId(null);
          await sleep(520);
          if (cancelled) return;
        }

        // 4) Pagamento: informa o valor recebido e adiciona o pagamento.
        await sleep(500);
        setPaymentAmount("50,00");
        await sleep(750);
        if (cancelled) return;
        setPayments([{ method: "CASH", label: "Dinheiro", amountInCents: 5000 }]);
        await sleep(950);
        if (cancelled) return;

        // 5) Finaliza a venda.
        setToastMessage("Venda finalizada com sucesso!");
        await sleep(2400);
        if (cancelled) return;

        // 6) Limpa, alterna o tema e reinicia o ciclo.
        setToastMessage("");
        themeMode = themeMode === "light" ? "dark" : "light";
        await sleep(700);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "loading") {
    return (
      <main className="app-shell bootstrap-shell" aria-busy="true" aria-label="Restaurando sessao">
        <div className="bootstrap-shell__content">
          <div className="loader-container">
            <svg className="professional-loader" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="loader-track" cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" opacity="0.1" />
              <circle className="loader-orbit" cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="70 200" />
              <path className="loader-logo-shape" d="M35 50L45 60L65 40" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="loader-text-wrapper">
              <h2 className="loader-title">Face Delivery</h2>
              <div className="loader-status">
                <span className="loader-dot"></span>
                <span className="loader-message">Iniciando ambiente seguro</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "login") {
    return (
      <main className="login-shell">
        <section className="presentation-card">
          <div className="brand-block">
            <BrandLogo className="brand-logo" />
            <div>
              <p className="eyebrow">Frente de caixa</p>
              <h1>Mercado Face to Face</h1>
            </div>
          </div>

          <p className="presentation-copy">
            Interface de <strong>PDV</strong> com arquitetura <strong>Multitenant</strong>, visual
            profissional para operação <strong>Face-to-Face</strong>, focada em venda rápida, menu
            gerencial e acompanhamento da loja.
          </p>

          <div className="login-visual-container">
            <svg className="creative-login-svg" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="bg-blob-1" cx="300" cy="100" r="80" fill="var(--accent)" opacity="0.05" />
              <circle className="bg-blob-2" cx="100" cy="200" r="60" fill="var(--accent)" opacity="0.03" />

              <g className="pdv-device">
                <rect x="80" y="60" width="240" height="160" rx="12" fill="var(--surface-soft)" stroke="var(--accent)" strokeWidth="2" />
                <rect x="95" y="75" width="210" height="120" rx="4" fill="var(--background)" />
                <rect x="180" y="220" width="40" height="40" fill="var(--surface-soft)" stroke="var(--accent)" strokeWidth="2" />
                <rect x="150" y="250" width="100" height="8" rx="4" fill="var(--accent)" opacity="0.4" />

                <g className="ui-elements">
                  <rect x="110" y="90" width="80" height="10" rx="2" fill="var(--accent)" opacity="0.6" />
                  <rect x="110" y="110" width="50" height="10" rx="2" fill="var(--accent)" opacity="0.3" />
                  <rect x="230" y="90" width="60" height="60" rx="8" fill="var(--accent)" opacity="0.15" />
                  <circle className="ui-check" cx="260" cy="120" r="15" fill="var(--success)" opacity="0.8" />
                  <path d="M252 120L258 126L268 114" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </g>

              <g className="delivery-motion">
                <path className="motion-line-1" d="M340 120H380" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
                <path className="motion-line-2" d="M350 145H390" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" opacity="0.2" />
                <path className="motion-line-3" d="M335 170H375" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" opacity="0.3" />

                <g className="floating-package">
                  <circle cx="330" cy="165" r="7" fill="var(--background)" stroke="var(--accent)" strokeWidth="2" />
                  <circle cx="360" cy="165" r="7" fill="var(--background)" stroke="var(--accent)" strokeWidth="2" />
                  <path d="M322 162C322 150 335 145 350 145H372L365 162H322Z" fill="var(--accent)" />
                  <path d="M335 145H355C355 145 355 138 345 138C335 138 335 145 335 145Z" fill="var(--background)" opacity="0.5" />
                  <path d="M368 162L378 135H368" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
                  <rect x="320" y="128" width="22" height="22" rx="4" fill="var(--accent)" stroke="var(--background)" strokeWidth="1.5" />
                  <path d="M326 139H336" stroke="var(--background)" strokeWidth="2" opacity="0.4" />
                </g>
              </g>

              <g className="face-interaction">
                <circle className="user-face" cx="60" cy="120" r="30" fill="var(--accent)" opacity="0.1" stroke="var(--accent)" strokeWidth="2" />
                <path className="smile" d="M50 125C50 125 55 132 60 132C65 132 70 125 70 125" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="52" cy="115" r="2" fill="var(--accent)" />
                <circle cx="68" cy="115" r="2" fill="var(--accent)" />
              </g>

              <circle className="dot-1" cx="100" cy="120" r="3" fill="var(--accent)" />
              <circle className="dot-2" cx="300" cy="150" r="3" fill="var(--accent)" />
            </svg>
          </div>
        </section>

        <section className="login-panel">
          <div>
            <p className="eyebrow">Acesso restrito</p>
            <h2>Entrar no sistema</h2>
            <p>Use um operador já cadastrado para acessar o PDV.</p>
          </div>

          <form className="login-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              E-mail
              <input readOnly value="operador@facedelivery.com" />
            </label>
            <label>
              Senha
              <input readOnly type="password" value="********" />
            </label>
            <button className="primary-button" type="button">
              Entrando...
            </button>
          </form>

          <div className="login-help">
            <span>Validando credenciais do operador...</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pdv-shell">
      {toastMessage ? (
        <div className="app-toast is-success" role="status" aria-live="polite">
          ✓ {toastMessage}
        </div>
      ) : null}

      <header className="pdv-topbar">
        <div className="topbar-brand">
          <BrandLogo className="topbar-logo" />
          <div>
            <p className="eyebrow">Multitenant · Face Delivery</p>
            <h1>Face Delivery</h1>
          </div>
        </div>
      </header>

      <section className="pdv-layout">
        <section className="catalog-panel">
          <div className="catalog-heading">
            <div className="catalog-heading-title">
              <h2>Catálogo</h2>
              <p className="pdv-catalog-subtitle">Toque em um produto para adicionar ao carrinho.</p>
            </div>
          </div>

          <div className="category-toolbar">
            {CATEGORY_CHIPS.map((chip, index) => (
              <button
                key={chip.label}
                className={`category-chip ${index === 0 ? "active" : ""}`.trim()}
                type="button"
              >
                <strong className="category-chip-label">
                  <span>{chip.label}</span>
                </strong>
                <small>{formatNumber(chip.count)}</small>
              </button>
            ))}

            <button className="menu-shortcut" type="button">
              <strong className="menu-shortcut-label">
                <span>Menu</span>
              </strong>
              <small className="menu-shortcut-subtitle">Admin</small>
            </button>
          </div>

          <div className="search-field catalog-search-field">
            <input readOnly placeholder="⌕ Busque por Nome, SKU ou código de barras" />
          </div>

          <div className="product-grid">
            {DEMO_PRODUCTS.map((product) => (
              <button
                key={product.id}
                type="button"
                className={`pdv-product ${activeProductId === product.id ? "is-demo-active" : ""}`.trim()}
              >
                <div className="pdv-product__media">
                  <img src={product.image} alt={product.name} />
                </div>
                <div className="pdv-product__name">{product.name}</div>
                <div className="pdv-product__stock pdv-product__stock--success">
                  ⊙ {formatNumber(product.stock)} un em estoque
                </div>
                <div className="pdv-product__foot">
                  <span className="pdv-product__price">{formatMoney(product.priceInCents)}</span>
                  <span className="pdv-badge pdv-badge--success">
                    <span className="pdv-badge__dot" />
                    Disponível
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside className="checkout-panel" ref={checkoutRef}>
          <div className="checkout-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              <h2 style={{ margin: 0 }}>Carrinho</h2>
              <span className="tag">{formatNumber(cartItems.length)} item(ns)</span>
            </div>
            <strong className="checkout-total">{formatMoney(totalInCents)}</strong>
          </div>

          <section className="side-card cart-side-card">
            <div className="side-card-header">
              <h3>Carrinho</h3>
              <span>{formatNumber(cartItems.length)} item(ns)</span>
            </div>

            <div className="cart-list">
              {cartItems.length === 0 ? (
                <div className="empty-cart-state">
                  <img src="/img/empty-cart-image.png" alt="Carrinho vazio" />
                  <p className="empty-state">Toque em um produto para adicionar.</p>
                </div>
              ) : (
                cartItems.map((item, index) => (
                  <article className="cart-item-row" key={item.product.id}>
                    <span className="cart-item-name">
                      <span className="cart-item-index">{index + 1} - </span>
                      {item.product.name}
                    </span>
                    <span className="cart-item-quantity">Qtd. {formatNumber(item.quantity)}</span>
                    <strong className="cart-item-total">
                      {formatMoney(item.product.priceInCents * item.quantity)}
                    </strong>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="pdv-pay-card">
            <div className="pdv-pay-row">
              <label className="pdv-pay-label">
                <span>Pagamento</span>
                <select value="CASH" disabled>
                  <option value="CASH">Dinheiro</option>
                </select>
              </label>
              <label className="pdv-pay-label">
                <span>Valor recebido</span>
                <input readOnly value={paymentAmount} placeholder="0,00" />
              </label>
            </div>

            <button className="secondary-button block-button" type="button">
              + Adicionar pagamento
            </button>

            {payments.length > 0 && (
              <div className="record-list dense-list">
                {payments.map((payment, index) => (
                  <article className="record-row" key={`${payment.method}-${index}`}>
                    <div>
                      <strong>{payment.label}</strong>
                      <small>Sem terminal</small>
                    </div>
                    <div className="record-aside horizontal-actions">
                      <strong>{formatMoney(payment.amountInCents)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="sale-total-box">
            <div className="pdv-total-main">
              <small>Total a pagar</small>
              <strong>{formatMoney(totalInCents)}</strong>
            </div>
            {paidInCents > 0 && (
              <div className="pdv-total-sub">
                <span>
                  Recebido <b>{formatMoney(paidInCents)}</b>
                </span>
                {changeInCents > 0 && (
                  <span>
                    Troco <b>{formatMoney(changeInCents)}</b>
                  </span>
                )}
              </div>
            )}
            <button className="primary-button block-button large-button" type="button">
              ✓ Finalizar venda
            </button>
          </section>
        </aside>
      </section>
    </main>
  );
}
