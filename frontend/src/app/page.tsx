"use client";

import {
  BadgeDollarSign,
  Blocks,
  CakeSlice,
  ChartColumn,
  ChevronDown,
  ClipboardList,
  FileText,
  GlassWater,
  LayoutDashboard,
  MoonStar,
  Package,
  Palette,
  Printer,
  Scale,
  Settings,
  ShoppingBag,
  SprayCan,
  SunMedium,
  Truck,
  UserCog,
  UsersRound,
  Utensils,
  WalletCards,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { ReactNode, useEffect, useMemo, useState } from "react";

import {
  type CashSession,
  type Customer,
  type FinancialReport,
  type OperatorProfile,
  type PaymentInput,
  type Product,
  getCurrentCashSession,
  getCurrentOperator,
  getFinancialReport,
  listCustomers,
  listProducts,
  openCashSession,
  registerCashMovement,
  registerSale,
  signIn,
  signOut,
  updateCashSessionOpeningAmount,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ThemeMode = "dark" | "light";
type AccentColor = "blue" | "green" | "purple" | "orange" | "rose";
type CategoryId =
  | "TODOS"
  | "ALIMENTOS"
  | "BEBIDAS"
  | "SOBREMESAS"
  | "LIMPEZA"
  | "PETSHOP"
  | "BAZAR";
type ManagerView =
  | "manager-menu"
  | "resumo"
  | "faturamento"
  | "categorias"
  | "produtos"
  | "clientes"
  | "fornecedores"
  | "a-receber"
  | "a-pagar"
  | "estoque"
  | "relatorios"
  | "configuracoes"
  | "balanca"
  | "impressora"
  | "notas-fiscais";

interface CartItem {
  product: Product;
  quantity: number;
}

interface ManagerItem {
  id: ManagerView;
  label: string;
  description: string;
  group: "Gerencial" | "Financeiro" | "Operação" | "Dispositivos" | "Fiscal";
  Icon: LucideIcon;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THEME_KEY = "pdv-face-to-face-theme";
const ACCENT_KEY = "pdv-face-to-face-accent";
const BOOTSTRAP_TIMEOUT_MS = 8_000;
const TOAST_DURATION_MS = 3_200;

const ACCENT_PALETTE: { id: AccentColor; label: string; hex: string }[] = [
  { id: "blue",   label: "Azul",    hex: "#2563eb" },
  { id: "green",  label: "Verde",   hex: "#16a34a" },
  { id: "purple", label: "Roxo",    hex: "#9333ea" },
  { id: "orange", label: "Laranja", hex: "#ea580c" },
  { id: "rose",   label: "Rosa",    hex: "#e11d48" },
];

const CATEGORY_LIST: {
  id: CategoryId;
  label: string;
  Icon: LucideIcon;
  keywords: string[];
}[] = [
  { id: "TODOS",      label: "Todos",      Icon: Blocks,      keywords: [] },
  { id: "ALIMENTOS",  label: "Alimentos",  Icon: Utensils,    keywords: ["alimento","mercearia","arroz","feijao","carne","frios","fruta","legume","laticinio","massa","grao","congelado","hortifruti","padaria"] },
  { id: "BEBIDAS",    label: "Bebidas",    Icon: GlassWater,  keywords: ["bebida","agua","refrigerante","suco","cerveja","vinho","cha","cafe","energetico","leite"] },
  { id: "SOBREMESAS", label: "Sobremesas", Icon: CakeSlice,   keywords: ["sobremesa","doce","bolo","sorvete","chocolate","bala","pudim","torta"] },
  { id: "LIMPEZA",    label: "Limpeza",    Icon: SprayCan,    keywords: ["limpeza","detergente","sabao","amaciante","alvejante","desinfetante","higiene"] },
  { id: "PETSHOP",    label: "PetShop",    Icon: UsersRound,  keywords: ["pet","racao","areia","coleira","veterinario"] },
  { id: "BAZAR",      label: "Bazar",      Icon: ShoppingBag, keywords: ["bazar","utilidade","utensilio","papelaria","casa","cozinha","decoracao"] },
];

const MANAGER_ITEMS: ManagerItem[] = [
  { id: "resumo",        label: "Resumo",        description: "Visão geral do caixa e indicadores do período.",   group: "Gerencial",    Icon: LayoutDashboard },
  { id: "faturamento",   label: "Financeiro",     description: "Faturamento diário/mensal e metas.",               group: "Gerencial",    Icon: ChartColumn },
  { id: "relatorios",    label: "Relatórios",     description: "Modelos e consultas operacionais.",                group: "Gerencial",    Icon: ClipboardList },
  { id: "categorias",    label: "Categorias",     description: "Estrutura do catálogo por setores e famílias.",    group: "Operação",     Icon: Blocks },
  { id: "produtos",      label: "Produtos",       description: "Cadastro completo dos itens vendidos no caixa.",   group: "Operação",     Icon: Package },
  { id: "clientes",      label: "Clientes",       description: "Consumidores, fidelidade e dados de contato.",     group: "Operação",     Icon: UsersRound },
  { id: "fornecedores",  label: "Fornecedores",   description: "Parceiros de compra e abastecimento da loja.",     group: "Operação",     Icon: Truck },
  { id: "a-receber",     label: "A Receber",      description: "Títulos, vencimentos e acompanhamento.",           group: "Financeiro",   Icon: WalletCards },
  { id: "a-pagar",       label: "A Pagar",        description: "Despesas previstas e compromissos.",               group: "Financeiro",   Icon: BadgeDollarSign },
  { id: "estoque",       label: "Estoque",        description: "Saldo, mínimo, status e produtos com alerta.",     group: "Operação",     Icon: Warehouse },
  { id: "configuracoes", label: "Configurações",  description: "Balança, impressora e notas fiscais do PDV.",      group: "Operação",     Icon: Settings },
  { id: "balanca",       label: "Balança",        description: "Cadastro e status dos equipamentos de pesagem.",   group: "Dispositivos", Icon: Scale },
  { id: "impressora",    label: "Impressora",     description: "Impressoras de cupom e configurações da fila.",    group: "Dispositivos", Icon: Printer },
  { id: "notas-fiscais", label: "Notas fiscais",  description: "Perfis, série e ambiente de emissão fiscal.",      group: "Fiscal",       Icon: FileText },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  CASHIER: "Operador de caixa",
  STOCKIST: "Estoquista",
};

const PAYMENT_METHODS: { value: PaymentInput["method"]; label: string }[] = [
  { value: "CASH",           label: "Dinheiro" },
  { value: "PIX",            label: "Pix" },
  { value: "CARD",           label: "Cartão TEF" },
  { value: "STORE_CREDIT",   label: "Fiado" },
  { value: "DIGITAL_WALLET", label: "Carteira digital" },
  { value: "CONTACTLESS",    label: "Aproximação" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const moneyFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numberFmt = new Intl.NumberFormat("pt-BR");
const formatMoney = (cents: number) => moneyFmt.format(cents / 100);
const formatNumber = (n: number) => numberFmt.format(n);
const digitsOnly = (v: string) => v.replace(/\D/g, "");
const normalizeText = (v: string) =>
  v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const parseMoneyCents = (v: string) => {
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};
const formatMoneyInput = (v: string) => {
  const d = digitsOnly(v).padStart(3, "0");
  return `${Number(d.slice(0, -2)).toLocaleString("pt-BR")},${d.slice(-2)}`;
};
const formatDateTime = (v: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(new Date(v));

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "dark";
  const s = localStorage.getItem(THEME_KEY);
  if (s === "dark" || s === "light") return s;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getInitialAccent = (): AccentColor => {
  if (typeof window === "undefined") return "blue";
  const s = localStorage.getItem(ACCENT_KEY) as AccentColor;
  return ACCENT_PALETTE.some((c) => c.id === s) ? s : "blue";
};

const matchesCategory = (product: Product, catId: CategoryId): boolean => {
  if (catId === "TODOS") return true;
  const cat = CATEGORY_LIST.find((c) => c.id === catId);
  if (!cat || cat.keywords.length === 0) return false;
  const haystack = normalizeText(
    `${product.name} ${product.description ?? ""} ${product.category?.path ?? ""}`,
  );
  return cat.keywords.some((kw) => haystack.includes(normalizeText(kw)));
};

const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    to: now.toISOString(),
  };
};

// ─── Small Components ─────────────────────────────────────────────────────────

function BrandLogo({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path
        d="M50 5L90 25V75L50 95L10 75V25L50 5Z"
        fill="#fff"
        opacity="0.1"
        stroke="#fff"
        strokeWidth="2.5"
        strokeOpacity="0.8"
      />
      <path
        d="M35 30H65V40H45V50H60V60H45V75"
        stroke="#fff"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M55 30C75 30 85 45 85 52.5C85 60 75 75 55 75"
        stroke="#fff"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

function BlockLabel({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 0.4rem",
        color: "var(--muted)",
        fontSize: "0.78rem",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {children}
    </p>
  );
}

function CollapseBtn({
  isOpen,
  onToggle,
  label,
}: {
  isOpen: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className="dashboard-collapse-toggle is-inline"
      onClick={onToggle}
      aria-expanded={isOpen}
      title={isOpen ? `Recolher ${label}` : `Expandir ${label}`}
    >
      <ChevronDown
        className={`dashboard-collapse-icon${isOpen ? " is-open" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}

function CollapsibleSection({
  label,
  isOpen,
  onToggle,
  children,
  className = "",
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}) {
  if (!isOpen) {
    return (
      <div className="dashboard-collapsed-block">
        <CollapseBtn isOpen={false} onToggle={onToggle} label={label} />
        <span className="dashboard-collapsed-label">{label}</span>
      </div>
    );
  }
  return (
    <div className={`dashboard-collapsible-inline ${className}`.trim()}>
      <CollapseBtn isOpen onToggle={onToggle} label={label} />
      <div className="dashboard-collapsible-block" style={{ flex: 1, minWidth: 0 }}>
        <BlockLabel>{label}</BlockLabel>
        {children}
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function HomePage() {
  // ── Theme & accent ────────────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [accentColor, setAccentColor] = useState<AccentColor>(getInitialAccent);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isOpMenuOpen, setIsOpMenuOpen] = useState(false);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Informe suas credenciais para acessar o PDV.");

  // ── Data ─────────────────────────────────────────────────────────────────
  const [operator, setOperator] = useState<OperatorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);

  // ── Catalog ───────────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("TODOS");
  const [productSearch, setProductSearch] = useState("");

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // ── Payment ───────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentInput["method"]>("CASH");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [installments, setInstallments] = useState<1 | 2 | 3>(1);
  const [discount, setDiscount] = useState("");

  // ── Customer ──────────────────────────────────────────────────────────────
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState("");

  // ── Modals ────────────────────────────────────────────────────────────────
  const [isCashOpenModalVisible, setIsCashOpenModalVisible] = useState(false);
  const [cashOpeningAmount, setCashOpeningAmount] = useState("");
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<"SUPPLY" | "WITHDRAWAL">("SUPPLY");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementNote, setMovementNote] = useState("");
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [managerView, setManagerView] = useState<ManagerView>("manager-menu");

  // ── Collapsible (left column) ─────────────────────────────────────────────
  const [showSession, setShowSession] = useState(true);
  const [showLowStock, setShowLowStock] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showSearch, setShowSearch] = useState(true);

  // ── Collapsible (right column) ────────────────────────────────────────────
  const [showSummary, setShowSummary] = useState(true);
  const [showCashOpen, setShowCashOpen] = useState(true);
  const [showMovement, setShowMovement] = useState(true);
  const [showCustomer, setShowCustomer] = useState(true);
  const [showForms, setShowForms] = useState(true);

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.dataset.accent = accentColor;
    localStorage.setItem(ACCENT_KEY, accentColor);
  }, [accentColor]);

  useEffect(() => {
    if (!toastMessage) return;
    const id = window.setTimeout(() => setToastMessage(""), TOAST_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [toastMessage]);

  useEffect(() => {
    let mounted = true;
    const timeoutId = window.setTimeout(() => {
      if (!mounted) return;
      setIsBootstrapping(false);
      setIsLoading(false);
      setMessage("Não foi possível restaurar a sessão. Faça login manualmente.");
    }, BOOTSTRAP_TIMEOUT_MS);

    const bootstrap = async () => {
      setIsLoading(true);
      try {
        await getCurrentOperator();
        if (!mounted) return;
        await loadDashboard("Sessão restaurada.");
        if (mounted) setIsAuthenticated(true);
      } catch {
        if (mounted) setMessage("Informe suas credenciais para acessar o PDV.");
      } finally {
        window.clearTimeout(timeoutId);
        if (mounted) {
          setIsBootstrapping(false);
          setIsLoading(false);
        }
      }
    };

    void bootstrap();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.active && p.stockStatus !== "AVAILABLE"),
    [products],
  );

  const visibleProducts = useMemo(() => {
    const search = normalizeText(productSearch.trim());
    return products.filter((p) => {
      if (!p.active) return false;
      if (!matchesCategory(p, selectedCategory)) return false;
      if (
        search &&
        !normalizeText(`${p.name} ${p.sku} ${p.barcode ?? ""}`).includes(search)
      )
        return false;
      return true;
    });
  }, [products, selectedCategory, productSearch]);

  const subtotalCents = cartItems.reduce(
    (sum, i) => sum + Math.round(i.product.priceInCents * i.quantity),
    0,
  );
  const discountPct = Math.min(
    Math.max(Number((discount || "0").replace(",", ".")) || 0, 0),
    100,
  );
  const discountCents = Math.round((subtotalCents * discountPct) / 100);
  const totalCents = Math.max(subtotalCents - discountCents, 0);
  const paidCents = parseMoneyCents(paymentAmount);
  const changeCents = Math.max(paidCents - totalCents, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const operatorInitials = operator
    ? operator.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "OP";

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const loadDashboard = async (successMsg = "Painel atualizado.") => {
    setIsLoading(true);
    try {
      const range = getCurrentMonthRange();
      const [pList, cList, sessionSnap, report, op] = await Promise.all([
        listProducts({ includeInactive: false }),
        listCustomers(),
        getCurrentCashSession(),
        getFinancialReport(range),
        getCurrentOperator(),
      ]);
      setProducts([...pList].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      setCustomers([...cList].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      const sess = sessionSnap.cashSession;
      setCashSession(sess);
      setFinancialReport(report);
      setOperator(op);
      if (!sess && op.role !== "STOCKIST") {
        const suggested = sessionSnap.lastClosedCashSession?.closingAmountInCents ?? 0;
        setCashOpeningAmount(suggested > 0 ? formatMoneyInput(String(suggested)) : "");
        setIsCashOpenModalVisible(true);
        setMessage("Caixa bloqueado. Informe o valor de abertura para iniciar vendas.");
      } else {
        setMessage(successMsg);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro ao carregar painel.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn({ email, password });
      await loadDashboard("Login realizado. Painel pronto para operação.");
      setIsAuthenticated(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Credenciais inválidas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setIsOpMenuOpen(false);
    try {
      await signOut();
      setIsAuthenticated(false);
      setOperator(null);
      setProducts([]);
      setCustomers([]);
      setCashSession(null);
      setFinancialReport(null);
      setCartItems([]);
      setPaymentAmount("");
      setDiscount("");
      setSelectedCustomerId("");
      setPassword("");
      setMessage("Sessão encerrada.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao sair.");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setMessage(msg);
  };

  const addToCart = (product: Product) => {
    if (!cashSession) {
      showToast("Caixa fechado. Abra o caixa antes de vender.");
      return;
    }
    if (product.stockQuantity <= 0) {
      showToast(`⚠ Produto esgotado — ${product.name}`);
      return;
    }
    const existing = cartItems.find((i) => i.product.id === product.id);
    if (existing && existing.quantity + 1 > product.stockQuantity) {
      showToast("Estoque insuficiente para adicionar mais unidades.");
      return;
    }
    setCartItems((prev) =>
      existing
        ? prev.map((i) =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...prev, { product, quantity: 1 }],
    );
    setMessage(`${product.name} adicionado ao carrinho.`);
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleOpenCash = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amountCents = parseMoneyCents(cashOpeningAmount);
    if (amountCents <= 0) {
      setMessage("Informe um valor de abertura maior que zero.");
      return;
    }
    setIsLoading(true);
    try {
      const session = cashSession
        ? await updateCashSessionOpeningAmount(cashSession.id, amountCents)
        : await openCashSession(amountCents);
      setCashSession({
        ...session,
        expectedAmountInCents: session.expectedAmountInCents ?? session.openingAmountInCents,
      });
      setIsCashOpenModalVisible(false);
      setMessage(cashSession ? "Valor do caixa atualizado." : "Caixa aberto com sucesso.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao abrir caixa.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCashMovement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cashSession) return;
    const amountCents = parseMoneyCents(movementAmount);
    if (amountCents <= 0) {
      setMessage("Informe um valor válido.");
      return;
    }
    setIsLoading(true);
    try {
      await registerCashMovement(cashSession.id, {
        type: movementType,
        amountInCents: amountCents,
        note: movementNote.trim() || undefined,
      });
      setIsCashMovementModalOpen(false);
      setMovementAmount("");
      setMovementNote("");
      await loadDashboard(
        movementType === "SUPPLY" ? "Suprimento registrado." : "Sangria registrada.",
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao registrar movimentação.");
      setIsLoading(false);
    }
  };

  const handleFinalizeSale = async () => {
    if (!cashSession || cartItems.length === 0) return;
    if (paidCents < totalCents) {
      showToast("Valor pago insuficiente para finalizar.");
      return;
    }
    setIsLoading(true);
    try {
      await registerSale({
        cashSessionId: cashSession.id,
        customerId: selectedCustomerId || undefined,
        items: cartItems.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        payments: [{ method: paymentMethod, amountInCents: parseMoneyCents(paymentAmount) }],
        discountInCents: discountCents,
        fiscalMode: "ONLINE",
        signatureRequired: false,
      });
      setCartItems([]);
      setPaymentAmount("");
      setDiscount("");
      setSelectedCustomerId("");
      setInstallments(1);
      showToast("Venda finalizada com sucesso!");
      await loadDashboard("Venda registrada. Painel atualizado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao finalizar venda.");
      setIsLoading(false);
    }
  };

  // ─── Bootstrap screen ─────────────────────────────────────────────────────

  if (isBootstrapping) {
    return (
      <div
        className="app-shell bootstrap-shell"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div className="loader-container">
          <p className="loader-title">Face Delivery</p>
          <div className="loader-status">
            <span className="loader-dot" />
            <span className="loader-message">Verificando sessão…</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Login screen ─────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="login-shell">
        <div className="presentation-card">
          <div className="brand-block">
            <svg
              className="brand-logo"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M50 5L90 25V75L50 95L10 75V25L50 5Z"
                fill="var(--accent)"
                opacity="0.15"
                stroke="var(--accent)"
                strokeWidth="2.5"
              />
              <path
                d="M35 30H65V40H45V50H60V60H45V75"
                stroke="var(--accent)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M55 30C75 30 85 45 85 52.5C85 60 75 75 55 75"
                stroke="var(--accent)"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.55"
              />
            </svg>
            <h1>Face Delivery</h1>
          </div>
          <p className="presentation-copy">
            Sistema PDV multiplataforma com frente de caixa, controle de estoque, delivery
            rastreável e suporte multitenant.
          </p>
        </div>

        <div className="login-panel">
          <p className="eyebrow">Bem-vindo</p>
          <h2>Acessar o PDV</h2>
          <form className="login-form" onSubmit={handleLogin}>
            <label>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@loja.com.br"
                required
                autoComplete="email"
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </label>
            {message !== "Informe suas credenciais para acessar o PDV." && message && (
              <p style={{ color: "var(--danger)", fontSize: "0.82rem", margin: 0 }}>
                {message}
              </p>
            )}
            <button
              className="primary-button block-button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Entrando…" : "Entrar no PDV"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Authenticated PDV view ───────────────────────────────────────────────

  return (
    <div className="pdv-shell">
      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toastMessage && <div className="app-toast">{toastMessage}</div>}

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header className="pdv-topbar">
        <div className="topbar-brand">
          <BrandLogo size={48} />
          <div>
            <p
              className="eyebrow"
              style={{ margin: "0 0 1px", color: "#fff", textShadow: "0 1px 2px rgba(15,23,42,0.45)" }}
            >
              Multitenant · Loja Centro
            </p>
            <h1 className="topbar-brand h1" style={{ margin: 0, fontSize: "1.45rem", letterSpacing: "-0.05em", color: "#f8fafc" }}>
              Face Delivery
            </h1>
          </div>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: "0.72rem",
            fontWeight: 900,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(248,250,252,0.85)",
          }}
        >
          PDV — Frente de Caixa
        </p>

        <div className="topbar-actions">
          {/* Color palette */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="theme-toggle"
              title="Paleta de cores"
              onClick={() => setIsPaletteOpen((o) => !o)}
            >
              <Palette aria-hidden="true" style={{ width: "1.1rem", height: "1.1rem" }} />
            </button>
            {isPaletteOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 0.35rem)",
                  background: "color-mix(in srgb, var(--surface) 96%, transparent)",
                  border: "1px solid var(--line)",
                  borderRadius: "0.85rem",
                  boxShadow: "var(--shadow)",
                  padding: "0.5rem 0.6rem",
                  zIndex: 50,
                  display: "flex",
                  gap: "0.45rem",
                  alignItems: "center",
                }}
              >
                {ACCENT_PALETTE.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={() => {
                      setAccentColor(c.id);
                      setIsPaletteOpen(false);
                    }}
                    style={{
                      width: "1.45rem",
                      height: "1.45rem",
                      borderRadius: "50%",
                      background: c.hex,
                      border: accentColor === c.id ? "2.5px solid #fff" : "2px solid transparent",
                      cursor: "pointer",
                      flexShrink: 0,
                      outline: accentColor === c.id ? `2px solid ${c.hex}` : "none",
                      outlineOffset: "1px",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Operator dropdown */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="operator-menu-trigger"
              onClick={() => setIsOpMenuOpen((o) => !o)}
            >
              <span
                style={{
                  height: "2rem",
                  width: "2rem",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "0.78rem",
                  flexShrink: 0,
                }}
              >
                {operatorInitials}
              </span>
              <span className="operator-menu-copy">
                <small>{ROLE_LABELS[operator?.role ?? ""] ?? "Operador"}</small>
                <strong>{operator?.name ?? "Operador"}</strong>
              </span>
              <ChevronDown
                className="operator-menu-chevron"
                style={{
                  transform: isOpMenuOpen ? "rotate(180deg)" : undefined,
                  transition: "transform 0.18s ease",
                }}
                aria-hidden="true"
              />
            </button>

            {isOpMenuOpen && (
              <div className="operator-menu-dropdown">
                <button
                  type="button"
                  className="operator-menu-item"
                  onClick={() => {
                    setIsOpMenuOpen(false);
                    void loadDashboard();
                  }}
                >
                  <UserCog
                    aria-hidden="true"
                    style={{ width: "0.9rem", height: "0.9rem", color: "var(--muted)", marginRight: "0.5rem" }}
                  />
                  Atualizar painel
                </button>
                <button
                  type="button"
                  className="operator-menu-item"
                  onClick={() => {
                    setIsOpMenuOpen(false);
                    setManagerView("manager-menu");
                    setIsManagerOpen(true);
                  }}
                >
                  <LayoutDashboard
                    aria-hidden="true"
                    style={{ width: "0.9rem", height: "0.9rem", color: "var(--muted)", marginRight: "0.5rem" }}
                  />
                  Menu gerencial
                </button>
                <div style={{ height: "1px", background: "var(--line)", margin: "0.2rem 0.3rem" }} />
                <button
                  type="button"
                  className="operator-menu-item danger"
                  onClick={() => void handleLogout()}
                >
                  <UserCog
                    aria-hidden="true"
                    style={{ width: "0.9rem", height: "0.9rem", marginRight: "0.5rem" }}
                  />
                  Sair
                </button>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            className="theme-toggle"
            title={themeMode === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
            onClick={() => setThemeMode((m) => (m === "dark" ? "light" : "dark"))}
          >
            <span className={`theme-toggle-icon ${themeMode === "dark" ? "sun" : "moon"}`}>
              {themeMode === "dark" ? (
                <SunMedium aria-hidden="true" style={{ width: "1.1rem", height: "1.1rem" }} />
              ) : (
                <MoonStar aria-hidden="true" style={{ width: "1.1rem", height: "1.1rem" }} />
              )}
            </span>
          </button>
        </div>
      </header>

      {/* ── Main PDV layout ─────────────────────────────────────────────────── */}
      <div className="pdv-layout">

        {/* ── LEFT: Catalog panel ─────────────────────────────────────────── */}
        <section className="catalog-panel">

          {/* SESSÃO DO CAIXA */}
          <CollapsibleSection
            label="Sessão do caixa"
            isOpen={showSession}
            onToggle={() => setShowSession((o) => !o)}
          >
            <div className="metric-grid three-up">
              <div className={`metric-tile ${cashSession ? "accent" : ""}`}>
                <small>Sessão do caixa</small>
                <strong>{cashSession ? "Caixa aberto" : "Fechado"}</strong>
                <span>
                  {cashSession
                    ? `Desde ${formatDateTime(cashSession.openedAt)}`
                    : "Aguardando abertura"}
                </span>
              </div>
              <div className="metric-tile">
                <small>Produtos ativos</small>
                <strong>{formatNumber(products.filter((p) => p.active).length)}</strong>
                <span>{formatNumber(lowStockProducts.length)} com alerta de estoque</span>
              </div>
              <div className="metric-tile success">
                <small>Ticket médio</small>
                <strong>{formatMoney(financialReport?.averageTicketInCents ?? 0)}</strong>
                <span>
                  {formatNumber(financialReport?.salesCount ?? 0)} venda(s) no período
                </span>
              </div>
            </div>
          </CollapsibleSection>

          {/* ESTOQUE BAIXO */}
          <CollapsibleSection
            label="Estoque baixo"
            isOpen={showLowStock}
            onToggle={() => setShowLowStock((o) => !o)}
          >
            <div className="minimum-stock-panel">
              <p
                style={{
                  margin: "0 0 0.35rem",
                  color: "var(--muted)",
                  fontSize: "0.78rem",
                }}
              >
                Alerta de estoque mínimo
              </p>
              <div className="minimum-stock-list">
                {lowStockProducts.length === 0 ? (
                  <p className="minimum-stock-empty">Nenhum produto com alerta de estoque.</p>
                ) : (
                  lowStockProducts.map((p) => (
                    <div key={p.id} className="minimum-stock-row">
                      <strong>{p.name}</strong>
                      <span
                        style={{
                          color:
                            p.stockStatus === "OUT_OF_STOCK"
                              ? "var(--danger)"
                              : "var(--warning)",
                        }}
                      >
                        {p.stockStatus === "OUT_OF_STOCK"
                          ? "Esgotado"
                          : `${formatNumber(p.stockQuantity)} ${p.unit === "KG" ? "kg" : "un"}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* MENU DE CATEGORIAS */}
          <CollapsibleSection
            label="Menu de Categorias"
            isOpen={showCategories}
            onToggle={() => setShowCategories((o) => !o)}
          >
            <div className="category-toolbar">
              {CATEGORY_LIST.map((cat) => {
                const { Icon } = cat;
                const count =
                  cat.id === "TODOS"
                    ? products.filter((p) => p.active).length
                    : products.filter((p) => p.active && matchesCategory(p, cat.id)).length;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-chip${isActive ? " active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span className="category-chip-label">
                      <Icon className="category-chip-icon" aria-hidden="true" />
                      <strong>{cat.label}</strong>
                    </span>
                    <small>{count} itens</small>
                  </button>
                );
              })}
              {/* Gerencial shortcut chip */}
              <button
                type="button"
                className="menu-shortcut"
                onClick={() => {
                  setManagerView("manager-menu");
                  setIsManagerOpen(true);
                }}
              >
                <span className="menu-shortcut-label">
                  <LayoutDashboard className="menu-shortcut-icon" aria-hidden="true" />
                  <strong>Gerencial</strong>
                </span>
                <small className="menu-shortcut-subtitle">menu gerencial</small>
              </button>
            </div>
          </CollapsibleSection>

          {/* BUSCA */}
          <div className="catalog-gap-categories-search">
            <CollapsibleSection
              label="Busca"
              isOpen={showSearch}
              onToggle={() => setShowSearch((o) => !o)}
              className="catalog-search-field"
            >
              <div
                className="search-field"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span style={{ color: "var(--muted)", fontWeight: 800, fontSize: "1rem" }}>
                  ⌕
                </span>
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar por nome, SKU ou código de barras…"
                  style={{
                    border: 0,
                    background: "transparent",
                    padding: "0.2rem 0",
                    boxShadow: "none",
                    color: "var(--text)",
                  }}
                />
              </div>
            </CollapsibleSection>
          </div>

          {/* GRADE DE PRODUTOS */}
          <div className="product-grid">
            {visibleProducts.map((product) => {
              const isOut = product.stockStatus === "OUT_OF_STOCK";
              const isLow = product.stockStatus === "LOW_STOCK";
              const stockClass = isOut
                ? "pdv-product__stock--danger"
                : isLow
                  ? "pdv-product__stock--warn"
                  : "pdv-product__stock--success";
              const badgeClass = isOut
                ? "pdv-badge--danger"
                : isLow
                  ? "pdv-badge--warn"
                  : "pdv-badge--success";
              const badgeText = isOut ? "Esgotado" : isLow ? "Baixo" : "Disponível";
              const stockLabel =
                product.unit === "KG"
                  ? `${product.stockQuantity.toFixed(1).replace(".", ",")} kg`
                  : `${formatNumber(product.stockQuantity)} un`;
              return (
                <button
                  key={product.id}
                  type="button"
                  className="pdv-product"
                  onClick={() => addToCart(product)}
                  disabled={isOut}
                >
                  <div className="pdv-product__media">
                    <img
                      src={product.imageUrl || "/img/produtos/product-without-image.png"}
                      alt={product.name}
                    />
                  </div>
                  <p className="pdv-product__name">{product.name}</p>
                  <p className={`pdv-product__stock ${stockClass}`}>⊙ {stockLabel} em estoque</p>
                  <div className="pdv-product__foot">
                    <span
                      className="pdv-product__price"
                      style={{ color: "var(--accent-soft)" }}
                    >
                      {formatMoney(product.priceInCents)}
                    </span>
                    <span className={`pdv-badge ${badgeClass}`}>
                      <span className="pdv-badge__dot" />
                      {badgeText}
                    </span>
                  </div>
                </button>
              );
            })}
            {visibleProducts.length === 0 && products.length > 0 && (
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "0.82rem",
                  gridColumn: "1 / -1",
                  padding: "1rem 0",
                }}
              >
                Nenhum produto encontrado para esta busca ou categoria.
              </p>
            )}
          </div>
        </section>

        {/* ── RIGHT: Checkout panel ────────────────────────────────────────── */}
        <aside className="checkout-panel">

          {/* Header */}
          <div className="checkout-header">
            <h2>Carrinho</h2>
            <span className="status-pill neutral">{cartCount} itens</span>
          </div>

          {/* RESUMO DA VENDA */}
          <CollapsibleSection
            label="Resumo da venda"
            isOpen={showSummary}
            onToggle={() => setShowSummary((o) => !o)}
          >
            <div className="panel-card summary-sale-card">
              <div className="summary-row-grid">
                <div>
                  <small style={{ color: "var(--muted)", fontSize: "0.75rem" }}>Subtotal</small>
                  <p style={{ margin: 0, fontWeight: 800 }}>{formatMoney(subtotalCents)}</p>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", fontSize: "0.75rem" }}>Troco</small>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 800,
                      color: changeCents > 0 ? "var(--success)" : undefined,
                    }}
                  >
                    {formatMoney(changeCents)}
                  </p>
                </div>
              </div>
              {discountCents > 0 && (
                <p style={{ margin: "0.3rem 0 0", color: "var(--muted)", fontSize: "0.78rem" }}>
                  Desconto: <b style={{ color: "var(--warning)" }}>{formatMoney(discountCents)}</b>
                </p>
              )}
            </div>
          </CollapsibleSection>

          {/* CAIXA ABERTO */}
          <CollapsibleSection
            label="Caixa aberto"
            isOpen={showCashOpen}
            onToggle={() => setShowCashOpen((o) => !o)}
          >
            <div className="panel-card cash-open-card">
              {cashSession ? (
                <>
                  <p style={{ margin: 0, fontSize: "0.82rem" }}>
                    <b>Aberto:</b> {formatDateTime(cashSession.openedAt)}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>
                    Fundo: {formatMoney(cashSession.openingAmountInCents)}
                  </p>
                  <button
                    type="button"
                    className="secondary-button small-button"
                    style={{ marginTop: "0.25rem" }}
                    onClick={() => setIsCashOpenModalVisible(true)}
                  >
                    Atualizar valor
                  </button>
                </>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>
                    Caixa não iniciado.
                  </p>
                  <button
                    type="button"
                    className="primary-button small-button attention-pulse"
                    style={{ marginTop: "0.25rem" }}
                    onClick={() => setIsCashOpenModalVisible(true)}
                  >
                    Abrir caixa
                  </button>
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* INSERIR OU RETIRAR VALORES */}
          <CollapsibleSection
            label="Inserir ou retirar valores"
            isOpen={showMovement}
            onToggle={() => setShowMovement((o) => !o)}
          >
            <div
              className="panel-card"
              style={{ display: "flex", gap: "0.5rem", padding: "0.6rem" }}
            >
              <button
                type="button"
                className="secondary-button small-button"
                style={{ flex: 1 }}
                disabled={!cashSession}
                onClick={() => {
                  setMovementType("SUPPLY");
                  setIsCashMovementModalOpen(true);
                }}
              >
                + Suprimento
              </button>
              <button
                type="button"
                className="secondary-button small-button"
                style={{ flex: 1 }}
                disabled={!cashSession}
                onClick={() => {
                  setMovementType("WITHDRAWAL");
                  setIsCashMovementModalOpen(true);
                }}
              >
                − Sangria
              </button>
            </div>
          </CollapsibleSection>

          {/* ITENS DA VENDA */}
          <div className="side-card panel-card cart-side-card">
            <BlockLabel>Itens da venda</BlockLabel>
            {cartItems.length === 0 ? (
              <div className="empty-cart-state">
                <img src="/img/empty-cart-image.png" alt="" />
                <p className="empty-state" style={{ fontSize: "0.82rem" }}>
                  Carrinho vazio. Adicione produtos do catálogo.
                </p>
              </div>
            ) : (
              <div className="cart-list">
                {cartItems.map((item, idx) => (
                  <div
                    key={item.product.id}
                    className="cart-item-row"
                    onClick={() => removeFromCart(item.product.id)}
                    title="Clique para remover"
                    style={{
                      background:
                        idx % 2 === 0
                          ? "var(--cart-row-zebra-odd)"
                          : "var(--cart-row-zebra-even)",
                    }}
                  >
                    <span className="cart-item-name">{item.product.name}</span>
                    <span className="cart-item-quantity">{item.quantity}×</span>
                    <span className="cart-item-total">
                      {formatMoney(item.product.priceInCents * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CLIENTE */}
          <CollapsibleSection
            label="Cliente"
            isOpen={showCustomer}
            onToggle={() => setShowCustomer((o) => !o)}
          >
            <div
              className="panel-card customer-side-card"
              style={{ display: "grid", gap: "0.5rem", padding: "0.6rem" }}
            >
              <label>
                Selecionar cliente
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">Consumidor Final</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.cpf ? `  ·  ${c.cpf}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Desconto (%)
                <input
                  type="text"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                />
              </label>
            </div>
          </CollapsibleSection>

          {/* FORMAS (1X / 2X / 3X) */}
          <CollapsibleSection
            label="Formas"
            isOpen={showForms}
            onToggle={() => setShowForms((o) => !o)}
          >
            <div className="panel-card pdv-pay-forms-selector" style={{ padding: "0.55rem 0.7rem" }}>
              <div className="pdv-pay-forms-options">
                {([1, 2, 3] as const).map((n) => (
                  <label key={n} className="pdv-pay-form-option">
                    <input
                      type="radio"
                      name="installments"
                      value={n}
                      checked={installments === n}
                      onChange={() => setInstallments(n)}
                    />
                    <span>{n}X</span>
                  </label>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* PAGAMENTO */}
          <div className="pdv-pay-card panel-card" style={{ padding: "0.6rem" }}>
            <BlockLabel>Pagamento</BlockLabel>
            <div className="pdv-pay-row">
              <label className="pdv-pay-label">
                <span>Forma</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentInput["method"])}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pdv-pay-label">
                <span>Valor recebido</span>
                <input
                  type="text"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(formatMoneyInput(e.target.value))}
                  placeholder="0,00"
                  inputMode="numeric"
                />
              </label>
            </div>
            <button
              type="button"
              className="secondary-button block-button small-button"
              disabled={!cashSession || cartItems.length === 0}
              style={{ marginTop: "0.35rem" }}
            >
              + Adicionar pagamento
            </button>
          </div>

          {/* TOTAL A PAGAR */}
          <div className="sale-total-box">
            <div className="pdv-total-main">
              <small>Total a pagar</small>
              <strong style={{ fontSize: "2rem", letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums" }}>
                {formatMoney(totalCents)}
              </strong>
            </div>
          </div>

          {/* FINALIZAR */}
          <button
            type="button"
            className="primary-button block-button large-button"
            onClick={() => void handleFinalizeSale()}
            disabled={
              !cashSession ||
              cartItems.length === 0 ||
              paidCents < totalCents ||
              isLoading
            }
          >
            ✓ Finalizar venda
          </button>
        </aside>
      </div>

      {/* ── Modal: Abertura de caixa (obrigatória) ───────────────────────── */}
      {isCashOpenModalVisible && (
        <div className="cash-lock-overlay">
          <div className="cash-lock-modal">
            <div
              style={{
                background: "color-mix(in srgb, var(--surface-soft) 96%, transparent)",
                border: "1px solid var(--line)",
                borderRadius: "1.25rem",
                overflow: "hidden",
                boxShadow: "var(--shadow)",
              }}
            >
              <header className="modal-header cash-opening-modal-header" style={{ padding: "0.85rem 1.2rem" }}>
                <p className="eyebrow">Frente de caixa</p>
                <h2>{cashSession ? "Atualizar valor do caixa" : "Abrir caixa"}</h2>
                <p>Informe o valor de entrada para início da operação.</p>
              </header>
              <div style={{ padding: "1.2rem", display: "grid", gap: "0.75rem" }}>
                <div className="cash-lock-message">
                  <strong>Abertura obrigatória</strong>
                  <p>O caixa precisa ser aberto antes de registrar vendas ou movimentações financeiras.</p>
                </div>
                <form onSubmit={handleOpenCash} style={{ display: "grid", gap: "0.65rem" }}>
                  <label>
                    Valor de abertura (R$)
                    <input
                      type="text"
                      value={cashOpeningAmount}
                      onChange={(e) => setCashOpeningAmount(formatMoneyInput(e.target.value))}
                      placeholder="0,00"
                      inputMode="numeric"
                      required
                      autoFocus
                    />
                  </label>
                  <div
                    style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}
                  >
                    {cashSession && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setIsCashOpenModalVisible(false)}
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={isLoading}
                    >
                      {isLoading ? "Abrindo…" : cashSession ? "Atualizar" : "Abrir caixa"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Suprimento / Sangria ──────────────────────────────────── */}
      {isCashMovementModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-window cash-opening-modal">
            <header className="modal-header cash-opening-modal-header">
              <p className="eyebrow">Caixa</p>
              <h2>{movementType === "SUPPLY" ? "Suprimento" : "Sangria"}</h2>
              <p>
                {movementType === "SUPPLY"
                  ? "Inserir dinheiro no caixa"
                  : "Retirar dinheiro do caixa"}
              </p>
            </header>
            <div className="modal-body">
              <form onSubmit={handleCashMovement} style={{ display: "grid", gap: "0.65rem" }}>
                <label>
                  Valor (R$)
                  <input
                    type="text"
                    value={movementAmount}
                    onChange={(e) => setMovementAmount(formatMoneyInput(e.target.value))}
                    placeholder="0,00"
                    inputMode="numeric"
                    required
                    autoFocus
                  />
                </label>
                <label>
                  Motivo / Observação
                  <input
                    type="text"
                    value={movementNote}
                    onChange={(e) => setMovementNote(e.target.value)}
                    placeholder={
                      movementType === "SUPPLY"
                        ? "Ex: troco inicial, suprimento de turno…"
                        : "Ex: retirada parcial, fechamento…"
                    }
                  />
                </label>
                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setIsCashMovementModalOpen(false);
                      setMovementAmount("");
                      setMovementNote("");
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isLoading}
                  >
                    {isLoading ? "Registrando…" : "Confirmar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Menu gerencial ─────────────────────────────────────────── */}
      {isManagerOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-window">
            <header className="modal-header manager-modal-header">
              <div>
                <p className="eyebrow">Menu gerencial</p>
                <h2>
                  {managerView === "manager-menu"
                    ? "Menu gerencial"
                    : (MANAGER_ITEMS.find((i) => i.id === managerView)?.label ?? "Gerencial")}
                </h2>
                <p>
                  {managerView === "manager-menu"
                    ? "Acesse módulos, relatórios e configurações do PDV."
                    : (MANAGER_ITEMS.find((i) => i.id === managerView)?.description ?? "")}
                </p>
              </div>
              <div className="modal-header-actions">
                {managerView !== "manager-menu" && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setManagerView("manager-menu")}
                  >
                    ← Voltar
                  </button>
                )}
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setIsManagerOpen(false);
                    setManagerView("manager-menu");
                  }}
                >
                  Fechar
                </button>
              </div>
            </header>

            <div className="modal-body manager-groups">
              {managerView === "manager-menu" ? (
                (["Gerencial", "Financeiro", "Operação"] as const).map((group) => {
                  const items = MANAGER_ITEMS.filter((i) => i.group === group);
                  if (items.length === 0) return null;
                  return (
                    <div key={group} className="manager-group">
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "0.72rem",
                          fontWeight: 900,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "var(--muted)",
                        }}
                      >
                        {group}
                      </h3>
                      <div className="manager-grid">
                        {items.map((item) => {
                          const { Icon } = item;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              className="manager-tile"
                              onClick={() => setManagerView(item.id)}
                            >
                              <div className="manager-tile-head">
                                <Icon className="manager-tile-icon" aria-hidden="true" />
                                <strong className="manager-tile-label">{item.label}</strong>
                              </div>
                              <span className="manager-tile-description">
                                {item.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  className="panel-card"
                  style={{
                    alignContent: "center",
                    display: "grid",
                    gap: "1rem",
                    justifyItems: "center",
                    minHeight: "16rem",
                    padding: "1.5rem",
                    textAlign: "center",
                  }}
                >
                  {(() => {
                    const item = MANAGER_ITEMS.find((i) => i.id === managerView);
                    if (!item) return null;
                    const { Icon } = item;
                    return (
                      <>
                        <Icon
                          aria-hidden="true"
                          style={{ width: "3rem", height: "3rem", color: "var(--accent)" }}
                        />
                        <h3 style={{ margin: 0 }}>{item.label}</h3>
                        <p
                          style={{
                            margin: 0,
                            color: "var(--muted)",
                            maxWidth: "36rem",
                            lineHeight: 1.6,
                          }}
                        >
                          {item.description}
                        </p>
                        <span
                          style={{
                            alignItems: "center",
                            background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
                            borderRadius: "999px",
                            color: "var(--accent-soft)",
                            display: "inline-flex",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            gap: "0.4rem",
                            letterSpacing: "0.04em",
                            padding: "0.5rem 0.7rem",
                            textTransform: "uppercase",
                          }}
                        >
                          Em construção · Estenda aqui
                        </span>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
