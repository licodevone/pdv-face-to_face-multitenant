"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  Blocks,
  CakeSlice,
  ChartColumn,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  GlassWater,
  LayoutDashboard,
  Menu,
  MonitorCog,
  MoonStar,
  Package,
  PawPrint,
  Printer,
  Scale,
  Settings,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
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
import {
  ChangeEvent,
  ReactNode,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CashSession,
  Category,
  Customer,
  FinancialReport,
  OperatorProfile,
  type OperatorRole,
  PaymentInput,
  Product,
  adjustProductStock,
  createCategory,
  createCustomer,
  createProduct,
  getCurrentOperator,
  getCurrentCashSession,
  getFinancialReport,
  listCategories,
  listCustomers,
  listProducts,
  openCashSession,
  registerCashMovement,
  registerSale,
  signIn,
  signOut,
  updateCategory,
  updateCashSessionOpeningAmount,
  updateProduct,
} from "@/lib/api";
import {
  getCsvValue,
  parseCsvMoneyToCents,
  parseCsvNumber,
  parseCsvText,
  type ParsedCsvRow,
} from "@/lib/csv-import";

const SYSTEM_ADMIN_EMAIL = "admin@pdv.local";

// The system administrator (the multitenant super-admin) lands on the
// administration screen; every other operator lands on the PDV front-of-cash.
const isSystemAdministratorOperator = (
  operator: OperatorProfile | null | undefined,
): boolean =>
  operator != null &&
  operator.role === "ADMIN" &&
  operator.email.trim().toLowerCase() === SYSTEM_ADMIN_EMAIL;

interface CartItem {
  product: Product;
  quantity: number;
}

type CategoryShortcutId =
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

interface CategoryShortcut {
  id: CategoryShortcutId;
  label: string;
  keywords: string[];
}

interface ManagerMenuItem {
  id: ManagerView;
  label: string;
  description: string;
  group: ManagerMenuGroup;
}

type ManagerMenuGroup = "Gerencial" | "Financeiro" | "Operacao" | "Dispositivos" | "Fiscal";

interface SummaryNote {
  id: string;
  title: string;
  owner: string;
  status: string;
  description: string;
}

interface BillingPanel {
  id: string;
  title: string;
  period: string;
  goalInCents: number;
  status: string;
}

interface SupplierItem {
  id: string;
  name: string;
  document: string;
  category: string;
  phone: string;
  status: string;
}

interface ReceivableItem {
  id: string;
  customer: string;
  dueDate: string;
  amountInCents: number;
  status: string;
}

interface PayableItem {
  id: string;
  description: string;
  supplier: string;
  dueDate: string;
  amountInCents: number;
  status: string;
}

interface ReportTemplateItem {
  id: string;
  name: string;
  period: string;
  target: string;
}

interface ScaleSettingItem {
  id: string;
  name: string;
  model: string;
  port: string;
  status: string;
}

interface PrinterSettingItem {
  id: string;
  name: string;
  model: string;
  queue: string;
  status: string;
}

interface FiscalProfileItem {
  id: string;
  name: string;
  series: string;
  environment: string;
  status: string;
}

interface ModalShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
  backLabel?: string;
}

interface ManagerTileProps {
  label: string;
  description: string;
  view?: ManagerView;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
}

interface MetricTileProps {
  label: string;
  value: string;
  note?: string;
  tone?: "neutral" | "success" | "accent";
}

interface CollapsibleDashboardSectionProps {
  as?: "div" | "section";
  className: string;
  collapsedLabel: string;
  isCollapsed: boolean;
  onToggle: () => void;
  toggleClassName?: string;
  children: ReactNode;
}

type ThemeMode = "dark" | "light";

interface DashboardVisibilitySettings {
  hideSummaryRowGrid: boolean;
  hideCashOpenCard: boolean;
  hideCatalogHeading: boolean;
  hideCategoryToolbar: boolean;
  hideCatalogSearchField: boolean;
  hideCashWithdrawalCard: boolean;
  hideCartCard: boolean;
  hideCustomerCard: boolean;
  hidePaymentsCard: boolean;
}

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const THEME_STORAGE_KEY = "pdv-face-to-face-theme";
const DASHBOARD_VISIBILITY_STORAGE_KEY = "pdv-face-to-face-dashboard-visibility";
const BOOTSTRAP_SESSION_TIMEOUT_MS = 8_000;
const CART_STOCK_BLOCKED_MESSAGE = "Modifique a quantidade no carrinho";
const EMPTY_CART_IMAGE_URL = "/img/empty-cart-image.png";
const PRODUCT_WITHOUT_IMAGE_URL = "/img/produtos/product-without-image.png";

function BrandLogo({ className, color = "var(--accent)" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hexagonal Tech Shield - Increased outline visibility */}
      <path d="M50 5L90 25V75L50 95L10 75V25L50 5Z" fill={color} opacity="0.1" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" />
      
      {/* "F" Shape with Motion */}
      <path d="M35 30H65V40H45V50H60V60H45V75" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* "D" stylized curve */}
      <path d="M55 30C75 30 85 45 85 52.5C85 60 75 75 55 75" stroke={color} strokeWidth="8" strokeLinecap="round" opacity="0.6" />
      
      {/* Speed lines on the left */}
      <path d="M15 45H25" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      <path d="M10 55H22" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.2" />
    </svg>
  );
}

const DEFAULT_DASHBOARD_VISIBILITY: DashboardVisibilitySettings = {
  hideSummaryRowGrid: false,
  hideCashOpenCard: false,
  hideCatalogHeading: false,
  hideCategoryToolbar: false,
  hideCatalogSearchField: false,
  hideCashWithdrawalCard: false,
  hideCartCard: false,
  hideCustomerCard: false,
  hidePaymentsCard: false,
};

const numberFormatter = new Intl.NumberFormat("pt-BR");

const CATEGORY_SHORTCUTS: CategoryShortcut[] = [
  { id: "TODOS", label: "Todos", keywords: [] },
  {
    id: "ALIMENTOS",
    label: "Alimentos",
    keywords: [
      "alimento",
      "mercearia",
      "padaria",
      "hortifruti",
      "horti",
      "fruta",
      "legume",
      "carne",
      "frios",
      "laticinio",
      "massa",
      "grao",
      "arroz",
      "feijao",
      "congelado",
    ],
  },
  {
    id: "BEBIDAS",
    label: "Bebidas",
    keywords: [
      "bebida",
      "agua",
      "refrigerante",
      "suco",
      "cerveja",
      "vinho",
      "cha",
      "cafe",
      "energetico",
      "leite",
    ],
  },
  {
    id: "SOBREMESAS",
    label: "Sobremesas",
    keywords: ["sobremesa", "doce", "bolo", "sorvete", "chocolate", "bala", "pudim", "torta"],
  },
  {
    id: "LIMPEZA",
    label: "Limpeza",
    keywords: ["limpeza", "detergente", "sabao", "amaciante", "alvejante", "desinfetante", "higiene"],
  },
  {
    id: "PETSHOP",
    label: "PetShop",
    keywords: ["pet", "racao", "ração", "areia", "brinquedo pet", "coleira", "veterinario"],
  },
  {
    id: "BAZAR",
    label: "Bazar",
    keywords: ["bazar", "utilidade", "utensilio", "papelaria", "casa", "cozinha", "decoracao"],
  },
];

const MANAGER_MENU_ITEMS: ManagerMenuItem[] = [
  {
    id: "resumo",
    label: "Resumo",
    description: "Visao geral do caixa, operacao e indicadores do periodo.",
    group: "Gerencial",
  },
  {
    id: "faturamento",
    label: "Financeiro",
    description: "Faturamento diario e mensal, com acompanhamento de metas.",
    group: "Gerencial",
  },
  {
    id: "relatorios",
    label: "Relatorios",
    description: "Modelos e consultas operacionais do estabelecimento.",
    group: "Gerencial",
  },
  {
    id: "categorias",
    label: "Categorias",
    description: "Estrutura do catalogo por setores e familias.",
    group: "Operacao",
  },
  {
    id: "produtos",
    label: "Produtos",
    description: "Cadastro completo dos itens vendidos no caixa.",
    group: "Operacao",
  },
  {
    id: "clientes",
    label: "Clientes",
    description: "Consumidores, fidelidade e dados de contato.",
    group: "Operacao",
  },
  {
    id: "fornecedores",
    label: "Fornecedores",
    description: "Parceiros de compra e abastecimento da loja.",
    group: "Operacao",
  },
  {
    id: "a-receber",
    label: "A Receber",
    description: "Titulos, vencimentos e acompanhamento financeiro.",
    group: "Financeiro",
  },
  {
    id: "a-pagar",
    label: "A Pagar",
    description: "Despesas previstas e compromissos do mercado.",
    group: "Financeiro",
  },
  {
    id: "estoque",
    label: "Estoque",
    description: "Saldo, minimo, status e produtos com alerta.",
    group: "Operacao",
  },
  {
    id: "configuracoes",
    label: "Configuracoes",
    description: "Balanca, impressora e notas fiscais do PDV.",
    group: "Operacao",
  },
];

const CONFIGURATION_MENU_ITEMS: ManagerMenuItem[] = [
  {
    id: "balanca",
    label: "Balanca",
    description: "Cadastro e status dos equipamentos de pesagem.",
    group: "Dispositivos",
  },
  {
    id: "impressora",
    label: "Impressora",
    description: "Impressoras de cupom e configuracoes da fila.",
    group: "Dispositivos",
  },
  {
    id: "notas-fiscais",
    label: "Notas fiscais",
    description: "Perfis, serie e ambiente de emissao fiscal.",
    group: "Fiscal",
  },
];

const MANAGER_GROUP_ORDER: ManagerMenuGroup[] = ["Gerencial", "Financeiro", "Operacao"];

const ALL_MANAGER_VIEWS: ManagerView[] = [
  ...MANAGER_MENU_ITEMS.map((item) => item.id),
  ...CONFIGURATION_MENU_ITEMS.map((item) => item.id),
];

// Item-level access to the manager menu per operator role. Every role also sees
// its own access profile via a navigation shortcut (handled in the render).
const MANAGER_VIEW_ACCESS_BY_ROLE: Record<OperatorRole, ManagerView[]> = {
  ADMIN: ALL_MANAGER_VIEWS,
  MANAGER: ALL_MANAGER_VIEWS,
  CASHIER: ["categorias", "produtos"],
  STOCKIST: ["estoque", "produtos"],
};

const INITIAL_SUMMARY_NOTES: SummaryNote[] = [
  {
    id: "summary-1",
    title: "Acompanhamento do caixa principal",
    owner: "Gerencia da loja",
    status: "Ativo",
    description: "Monitorar abertura, troco e divergencias do turno da manha.",
  },
  {
    id: "summary-2",
    title: "Conferencia de cadastro",
    owner: "Retaguarda",
    status: "Em revisao",
    description: "Validar categorias prioritarias antes da proxima virada de oferta.",
  },
];

const INITIAL_BILLING_PANELS: BillingPanel[] = [
  {
    id: "billing-1",
    title: "Meta loja fisica",
    period: "Mensal",
    goalInCents: 3500000,
    status: "Acompanhando",
  },
  {
    id: "billing-2",
    title: "Meta conveniencia",
    period: "Semanal",
    goalInCents: 850000,
    status: "Em observacao",
  },
];

const INITIAL_SUPPLIERS: SupplierItem[] = [
  {
    id: "supplier-1",
    name: "Distribuidora Central",
    document: "12.345.678/0001-90",
    category: "Alimentos",
    phone: "(11) 4000-1000",
    status: "Ativo",
  },
  {
    id: "supplier-2",
    name: "Higimais Atacado",
    document: "98.765.432/0001-10",
    category: "Limpeza",
    phone: "(11) 4000-2200",
    status: "Homologado",
  },
];

const INITIAL_RECEIVABLES: ReceivableItem[] = [
  {
    id: "receivable-1",
    customer: "Condominio Jardim Azul",
    dueDate: "2026-06-05",
    amountInCents: 148900,
    status: "Aberto",
  },
  {
    id: "receivable-2",
    customer: "Cliente fiado 001",
    dueDate: "2026-06-10",
    amountInCents: 32750,
    status: "Em cobranca",
  },
];

const INITIAL_PAYABLES: PayableItem[] = [
  {
    id: "payable-1",
    description: "Compra semanal de hortifruti",
    supplier: "Distribuidora Central",
    dueDate: "2026-06-03",
    amountInCents: 212500,
    status: "Pendente",
  },
  {
    id: "payable-2",
    description: "Reposicao de material de limpeza",
    supplier: "Higimais Atacado",
    dueDate: "2026-06-08",
    amountInCents: 86400,
    status: "Agendado",
  },
];

const INITIAL_REPORT_TEMPLATES: ReportTemplateItem[] = [
  {
    id: "report-1",
    name: "Resumo de vendas por operador",
    period: "Diario",
    target: "Gerencia",
  },
  {
    id: "report-2",
    name: "Estoque baixo por setor",
    period: "Semanal",
    target: "Compras",
  },
];

const INITIAL_SCALE_SETTINGS: ScaleSettingItem[] = [
  {
    id: "scale-1",
    name: "Balanca do hortifruti",
    model: "Toledo Prix 5",
    port: "COM3",
    status: "Pronta",
  },
];

const INITIAL_PRINTER_SETTINGS: PrinterSettingItem[] = [
  {
    id: "printer-1",
    name: "Cupom frente 01",
    model: "Epson TM-T20X",
    queue: "PDV_CAIXA_01",
    status: "Online",
  },
];

const INITIAL_FISCAL_PROFILES: FiscalProfileItem[] = [
  {
    id: "fiscal-1",
    name: "NFC-e principal",
    series: "1",
    environment: "Producao",
    status: "Ativo",
  },
];

const createEmptyProductDraft = () => ({
  sku: "",
  barcode: "",
  name: "",
  description: "",
  imageUrl: "",
  unit: "UNIT" as Product["unit"],
  categoryId: "",
  price: "",
  cost: "",
  stockQuantity: "0",
  minimumStock: "0",
  fiscalNcm: "",
  fiscalCfop: "",
});

const createEmptyCategoryDraft = () => ({
  name: "",
  description: "",
  parentId: "",
});

const createEmptyCustomerDraft = () => ({
  name: "",
  cpf: "",
  phone: "",
  email: "",
  loyaltyCode: "",
  address: "",
});

const createEmptySummaryNoteDraft = () => ({
  title: "",
  owner: "",
  status: "Ativo",
  description: "",
});

const createEmptyBillingPanelDraft = () => ({
  title: "",
  period: "Mensal",
  goal: "",
  status: "Acompanhando",
});

const createEmptySupplierDraft = () => ({
  name: "",
  document: "",
  category: "",
  phone: "",
  status: "Ativo",
});

const createEmptyReceivableDraft = () => ({
  customer: "",
  dueDate: "",
  amount: "",
  status: "Aberto",
});

const createEmptyPayableDraft = () => ({
  description: "",
  supplier: "",
  dueDate: "",
  amount: "",
  status: "Pendente",
});

const createEmptyReportTemplateDraft = () => ({
  name: "",
  period: "Mensal",
  target: "Gerencia",
});

const createEmptyScaleSettingDraft = () => ({
  name: "",
  model: "",
  port: "",
  status: "Pronta",
});

const createEmptyPrinterSettingDraft = () => ({
  name: "",
  model: "",
  queue: "",
  status: "Online",
});

const createEmptyFiscalProfileDraft = () => ({
  name: "",
  series: "",
  environment: "Producao",
  status: "Ativo",
});

const paymentMethodLabels: Record<PaymentInput["method"], string> = {
  CASH: "Dinheiro",
  CARD: "Cartao TEF",
  PIX: "Pix",
  STORE_CREDIT: "Fiado",
  DIGITAL_WALLET: "Carteira digital",
  CONTACTLESS: "Aproximacao",
};

const ALL_PAYMENT_METHODS: { value: PaymentInput["method"]; label: string }[] = [
  { value: "CASH", label: "Dinheiro" },
  { value: "CARD", label: "Cartão TEF" },
  { value: "PIX", label: "Pix" },
  { value: "STORE_CREDIT", label: "Fiado" },
  { value: "DIGITAL_WALLET", label: "Carteira digital" },
  { value: "CONTACTLESS", label: "Aproximação" },
];

const PRODUCT_IMAGE_MAX_SIZE_IN_BYTES = 450 * 1024;
const CATEGORY_IMPORT_LEVEL_COLUMNS = ["nivel1", "nivel2", "nivel3", "nivel4", "nivel5"] as const;
const PRODUCT_CATEGORY_IMPORT_LEVEL_COLUMNS = [
  "categoria_nivel1",
  "categoria_nivel2",
  "categoria_nivel3",
  "categoria_nivel4",
  "categoria_nivel5",
] as const;

const formatMoney = (valueInCents: number) => moneyFormatter.format(valueInCents / 100);

const formatNumber = (value: number) => numberFormatter.format(value);

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const parseStockQuantityInput = (value: string) => {
  const parsedValue = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
};

const formatStockInputValue = (value: number) => String(value);

const getStockUnitShortLabel = (product: Product) => (product.unit === "KG" ? "kg" : "un");

const parseMoneyToCents = (value: string) => {
  const normalizedValue = value.replace(/\./g, "").replace(",", ".");
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? Math.round(parsedValue * 100) : 0;
};

const formatMoneyInput = (value: string) => {
  const normalizedDigits = digitsOnly(value);

  if (!normalizedDigits) {
    return "";
  }

  const normalizedValue = normalizedDigits.padStart(3, "0");
  const integerPortion = normalizedValue.slice(0, -2);
  const centsPortion = normalizedValue.slice(-2);
  const formattedInteger = Number(integerPortion).toLocaleString("pt-BR");

  return `${formattedInteger},${centsPortion}`;
};

const getSuggestedOpeningAmountInCents = (cashSession: CashSession | null) =>
  cashSession?.closingAmountInCents ??
  cashSession?.expectedAmountInCents ??
  cashSession?.openingAmountInCents ??
  0;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Arquivo de imagem invalido."));
    };

    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler a imagem."));
    reader.readAsDataURL(file);
  });

const parsePercentage = (value: string) => {
  const normalizedValue = value.replace(/\./g, "").replace(",", ".");
  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.min(Math.max(parsedValue, 0), 100);
};

const formatPercentageInput = (value: string) => {
  const normalizedValue = value.replace(/\./g, ",").replace(/[^\d,]/g, "");

  if (!normalizedValue) {
    return "";
  }

  const [integerRaw = "", ...decimalParts] = normalizedValue.split(",");
  const integerDigits = digitsOnly(integerRaw).slice(0, 3);
  const normalizedInteger = integerDigits.replace(/^0+(?=\d)/, "");
  const integerPortion =
    normalizedInteger || (normalizedValue.startsWith(",") ? "0" : integerDigits);
  const decimalDigits = digitsOnly(decimalParts.join("")).slice(0, 2);
  const integerValue = integerPortion ? Number(integerPortion) : 0;

  if (integerValue >= 100) {
    return normalizedValue.includes(",") ? "100,00" : "100";
  }

  if (normalizedValue.includes(",")) {
    return `${integerPortion || "0"},${decimalDigits}`;
  }

  return integerPortion;
};

const formatCpfInput = (value: string) => {
  const normalizedDigits = digitsOnly(value).slice(0, 11);

  if (normalizedDigits.length <= 3) {
    return normalizedDigits;
  }

  if (normalizedDigits.length <= 6) {
    return `${normalizedDigits.slice(0, 3)}.${normalizedDigits.slice(3)}`;
  }

  if (normalizedDigits.length <= 9) {
    return `${normalizedDigits.slice(0, 3)}.${normalizedDigits.slice(3, 6)}.${normalizedDigits.slice(6)}`;
  }

  return `${normalizedDigits.slice(0, 3)}.${normalizedDigits.slice(3, 6)}.${normalizedDigits.slice(6, 9)}-${normalizedDigits.slice(9)}`;
};

const formatCnpjInput = (value: string) => {
  const normalizedDigits = digitsOnly(value).slice(0, 14);

  if (normalizedDigits.length <= 2) {
    return normalizedDigits;
  }

  if (normalizedDigits.length <= 5) {
    return `${normalizedDigits.slice(0, 2)}.${normalizedDigits.slice(2)}`;
  }

  if (normalizedDigits.length <= 8) {
    return `${normalizedDigits.slice(0, 2)}.${normalizedDigits.slice(2, 5)}.${normalizedDigits.slice(5)}`;
  }

  if (normalizedDigits.length <= 12) {
    return `${normalizedDigits.slice(0, 2)}.${normalizedDigits.slice(2, 5)}.${normalizedDigits.slice(5, 8)}/${normalizedDigits.slice(8)}`;
  }

  return `${normalizedDigits.slice(0, 2)}.${normalizedDigits.slice(2, 5)}.${normalizedDigits.slice(5, 8)}/${normalizedDigits.slice(8, 12)}-${normalizedDigits.slice(12)}`;
};

const formatCpfOrCnpjInput = (value: string) => {
  const normalizedDigits = digitsOnly(value).slice(0, 14);
  return normalizedDigits.length <= 11
    ? formatCpfInput(normalizedDigits)
    : formatCnpjInput(normalizedDigits);
};

const formatPhoneInput = (value: string) => {
  const normalizedDigits = digitsOnly(value).slice(0, 11);

  if (normalizedDigits.length <= 2) {
    return normalizedDigits.length > 0 ? `(${normalizedDigits}` : "";
  }

  const areaCode = normalizedDigits.slice(0, 2);
  const number = normalizedDigits.slice(2);

  if (normalizedDigits.length <= 6) {
    return `(${areaCode}) ${number}`;
  }

  if (normalizedDigits.length <= 10) {
    return `(${areaCode}) ${number.slice(0, 4)}-${number.slice(4)}`;
  }

  return `(${areaCode}) ${number.slice(0, 5)}-${number.slice(5)}`;
};

const formatCartQuantity = (product: Product, quantity: number) =>
  quantity.toLocaleString("pt-BR", {
    maximumFractionDigits: product.unit === "KG" ? 3 : 0,
    minimumFractionDigits: 0,
  });

const sortCategories = (items: Category[]) =>
  [...items].sort((left, right) => left.path.localeCompare(right.path, "pt-BR"));

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

const getCategoryPathKey = (segments: string[]) =>
  segments
    .map((segment) => normalizeText(segment.trim()))
    .filter(Boolean)
    .join(">");

const buildCategoryPathLookup = (items: Category[]) =>
  new Map(items.map((item) => [getCategoryPathKey(item.path.split(" > ")), item]));

const getHierarchySegmentsFromCsvRow = (
  row: ParsedCsvRow,
  columns: readonly string[],
) =>
  columns.map((column) => getCsvValue(row, [column])).filter(Boolean);

const getCategorySegmentsFromCategoryCsvRow = (row: ParsedCsvRow) => {
  const levelSegments = getHierarchySegmentsFromCsvRow(row, CATEGORY_IMPORT_LEVEL_COLUMNS);

  if (levelSegments.length > 0) {
    return levelSegments;
  }

  const pathValue = getCsvValue(row, ["caminho", "path", "categoria"]);

  if (!pathValue) {
    return [];
  }

  return pathValue
    .split(">")
    .map((segment) => segment.trim())
    .filter(Boolean);
};

const getCategorySegmentsFromProductCsvRow = (row: ParsedCsvRow) =>
  getHierarchySegmentsFromCsvRow(row, PRODUCT_CATEGORY_IMPORT_LEVEL_COLUMNS);

const normalizeProductUnitFromCsv = (value: string): Product["unit"] => {
  const normalizedValue = normalizeText(value);
  return ["kg", "quilo", "quilograma", "kilograma"].includes(normalizedValue) ? "KG" : "UNIT";
};

const mergeUniqueById = <T extends { id: string }>(currentItems: T[], nextItems: T[]) => {
  const recordsById = new Map(currentItems.map((item) => [item.id, item]));

  for (const item of nextItems) {
    recordsById.set(item.id, item);
  }

  return [...recordsById.values()];
};

const getStockLabel = (product: Product) => {
  const stockInfo = `${formatNumber(product.stockQuantity)} ${product.unit === "KG" ? "kg" : "un"}`;

  if (product.stockStatus === "OUT_OF_STOCK") {
    return `Esgotado (${stockInfo})`;
  }

  if (product.stockStatus === "LOW_STOCK") {
    return `Estoque baixo (${stockInfo})`;
  }

  return `Disponivel (${stockInfo})`;
};

const getStockTone = (product: Product) => {
  if (product.stockStatus === "OUT_OF_STOCK") {
    return "danger";
  }

  if (product.stockStatus === "LOW_STOCK") {
    return "warn";
  }

  return "success";
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return {
    from: from.toISOString(),
    to: now.toISOString(),
  };
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(new Date(value));

const formatMonthLabel = (value: string) => {
  const [year, month] = value.split("-").map(Number);

  if (!year || !month) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
};

const createLocalId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getInitialDashboardVisibility = (): DashboardVisibilitySettings => {
  if (typeof window === "undefined") {
    return DEFAULT_DASHBOARD_VISIBILITY;
  }

  const storedVisibility = window.localStorage.getItem(DASHBOARD_VISIBILITY_STORAGE_KEY);

  if (!storedVisibility) {
    return DEFAULT_DASHBOARD_VISIBILITY;
  }

  try {
    const parsedVisibility = JSON.parse(storedVisibility) as Partial<DashboardVisibilitySettings> & { hideSideCards?: boolean };
    const shouldHideLegacySideCards = Boolean(parsedVisibility.hideSideCards);

    return {
      hideSummaryRowGrid: Boolean(parsedVisibility.hideSummaryRowGrid),
      hideCashOpenCard: Boolean(parsedVisibility.hideCashOpenCard),
      hideCatalogHeading: Boolean(parsedVisibility.hideCatalogHeading),
      hideCategoryToolbar: Boolean(parsedVisibility.hideCategoryToolbar),
      hideCatalogSearchField: Boolean(parsedVisibility.hideCatalogSearchField),
      hideCashWithdrawalCard:
        shouldHideLegacySideCards || Boolean(parsedVisibility.hideCashWithdrawalCard),
      hideCartCard: shouldHideLegacySideCards || Boolean(parsedVisibility.hideCartCard),
      hideCustomerCard: shouldHideLegacySideCards || Boolean(parsedVisibility.hideCustomerCard),
      hidePaymentsCard: shouldHideLegacySideCards || Boolean(parsedVisibility.hidePaymentsCard),
    };
  } catch {
    return DEFAULT_DASHBOARD_VISIBILITY;
  }
};

const matchesShortcut = (product: Product, shortcutId: CategoryShortcutId) => {
  if (shortcutId === "TODOS") {
    return true;
  }

  const shortcut = CATEGORY_SHORTCUTS.find((item) => item.id === shortcutId);

  if (!shortcut) {
    return true;
  }

  const haystack = normalizeText(
    `${product.name} ${product.description ?? ""} ${product.category?.path ?? ""}`,
  );

  return shortcut.keywords.some((keyword) => haystack.includes(normalizeText(keyword)));
};

const getBackTarget = (view: ManagerView): ManagerView | null => {
  if (view === "manager-menu") {
    return null;
  }

  if (view === "configuracoes") {
    return "manager-menu";
  }

  if (["balanca", "impressora", "notas-fiscais"].includes(view)) {
    return "configuracoes";
  }

  return "manager-menu";
};

function ModalShell({
  title,
  subtitle,
  children,
  onClose,
  onBack,
  backLabel = "Voltar",
}: ModalShellProps) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-window">
        <header className="modal-header manager-modal-header">
          <div>
            <p className="eyebrow">Menu gerencial</p>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          <div className="modal-header-actions">
            {onBack ? (
              <button className="secondary-button" type="button" onClick={onBack}>
                {backLabel}
              </button>
            ) : null}
            <button className="secondary-button" type="button" onClick={onClose}>
              Fechar
            </button>
          </div>
        </header>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

const MANAGER_TILE_ICONS: Record<ManagerView, LucideIcon> = {
  "manager-menu": LayoutDashboard,
  resumo: LayoutDashboard,
  faturamento: ChartColumn,
  categorias: Blocks,
  produtos: Package,
  clientes: UsersRound,
  fornecedores: Truck,
  "a-receber": WalletCards,
  "a-pagar": BadgeDollarSign,
  estoque: Warehouse,
  relatorios: ClipboardList,
  configuracoes: Settings,
  balanca: Scale,
  impressora: Printer,
  "notas-fiscais": FileText,
};

const CATEGORY_SHORTCUT_ICONS: Record<CategoryShortcutId, LucideIcon> = {
  TODOS: Blocks,
  ALIMENTOS: Utensils,
  BEBIDAS: GlassWater,
  SOBREMESAS: CakeSlice,
  LIMPEZA: SprayCan,
  PETSHOP: PawPrint,
  BAZAR: ShoppingBag,
};

function ManagerTileIcon({ view }: { view: ManagerView }) {
  const Icon = MANAGER_TILE_ICONS[view] ?? Sparkles;

  return <Icon className="manager-tile-icon" aria-hidden="true" />;
}

function CategoryShortcutIcon({ shortcutId }: { shortcutId: CategoryShortcutId }) {
  const Icon = CATEGORY_SHORTCUT_ICONS[shortcutId];

  return <Icon className="category-chip-icon" aria-hidden="true" />;
}

function MenuShortcutIcon() {
  return <Menu className="menu-shortcut-icon" aria-hidden="true" />;
}

function ManagerTile({ view, label, description, icon: Icon, href, onClick }: ManagerTileProps) {
  const tileContent = (
    <>
      <div className="manager-tile-head">
        {Icon ? (
          <Icon className="manager-tile-icon" aria-hidden="true" />
        ) : view ? (
          <ManagerTileIcon view={view} />
        ) : null}
        <strong className="manager-tile-label">{label}</strong>
      </div>
      <span className="manager-tile-description">{description}</span>
    </>
  );

  if (href) {
    return (
      <Link className="manager-tile" href={href}>
        {tileContent}
      </Link>
    );
  }

  return (
    <button className="manager-tile" type="button" onClick={onClick}>
      {tileContent}
    </button>
  );
}

function MetricTile({ label, value, note, tone = "neutral" }: MetricTileProps) {
  return (
    <div className={`metric-tile ${tone}`}>
      <small>{label}</small>
      <strong>{value}</strong>
      {note ? <span>{note}</span> : null}
    </div>
  );
}

function CollapsibleDashboardSection({
  as: Component = "div",
  className,
  collapsedLabel,
  isCollapsed,
  onToggle,
  toggleClassName,
  children,
}: CollapsibleDashboardSectionProps) {
  if (isCollapsed) {
    return (
      <div className="dashboard-collapsed-block">
        <button
          className={`dashboard-collapse-toggle is-inline ${toggleClassName ?? ""}`.trim()}
          type="button"
          onClick={onToggle}
          aria-expanded="false"
          aria-label={collapsedLabel}
          title={collapsedLabel}
        >
          <ChevronDown className="dashboard-collapse-icon" aria-hidden="true" />
        </button>
        <span className="dashboard-collapsed-label">{collapsedLabel}</span>
      </div>
    );
  }

  return (
    <div className="dashboard-collapsible-inline">
      <button
        className={`dashboard-collapse-toggle is-inline ${toggleClassName ?? ""}`.trim()}
        type="button"
        onClick={onToggle}
        aria-expanded="true"
        aria-label={collapsedLabel}
        title={collapsedLabel}
      >
        <ChevronDown className="dashboard-collapse-icon is-open" aria-hidden="true" />
      </button>
      <Component
        className={`${className} dashboard-collapsible-block`}
      >
        {children}
      </Component>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [dashboardVisibility, setDashboardVisibility] = useState<DashboardVisibilitySettings>(
    getInitialDashboardVisibility,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [operatorProfile, setOperatorProfile] = useState<OperatorProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [lastClosedCashSession, setLastClosedCashSession] = useState<CashSession | null>(null);
  const [hasLoadedDashboard, setHasLoadedDashboard] = useState(false);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedShortcut, setSelectedShortcut] = useState<CategoryShortcutId>("TODOS");
  const [paymentMethod, setPaymentMethod] = useState<PaymentInput["method"]>("CASH");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [installments, setInstallments] = useState<1 | 2 | 3>(1);
  const [extraPaymentRows, setExtraPaymentRows] = useState<
    { method: PaymentInput["method"]; amount: string }[]
  >([]);
  const [terminalId, setTerminalId] = useState("PDV-01");
  const [transactionId, setTransactionId] = useState("");
  const [payments, setPayments] = useState<PaymentInput[]>([]);
  const [openingAmount, setOpeningAmount] = useState("");
  const [shouldShowCashEntryModal, setShouldShowCashEntryModal] = useState(false);
  const [cashWithdrawalAmount, setCashWithdrawalAmount] = useState("");
  const [cashWithdrawalNote, setCashWithdrawalNote] = useState("");
  const [discount, setDiscount] = useState("0");
  const [message, setMessage] = useState("Informe suas credenciais para acessar o PDV.");
  const [toastMessage, setToastMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<ManagerView | null>(null);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [newProduct, setNewProduct] = useState(createEmptyProductDraft);
  const [newCategory, setNewCategory] = useState(createEmptyCategoryDraft);
  const [newCustomer, setNewCustomer] = useState(createEmptyCustomerDraft);
  const [summaryNotes, setSummaryNotes] = useState<SummaryNote[]>(INITIAL_SUMMARY_NOTES);
  const [billingPanels, setBillingPanels] = useState<BillingPanel[]>(INITIAL_BILLING_PANELS);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(INITIAL_SUPPLIERS);
  const [receivables, setReceivables] = useState<ReceivableItem[]>(INITIAL_RECEIVABLES);
  const [payables, setPayables] = useState<PayableItem[]>(INITIAL_PAYABLES);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplateItem[]>(INITIAL_REPORT_TEMPLATES);
  const [scaleSettings, setScaleSettings] = useState<ScaleSettingItem[]>(INITIAL_SCALE_SETTINGS);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettingItem[]>(INITIAL_PRINTER_SETTINGS);
  const [fiscalProfiles, setFiscalProfiles] = useState<FiscalProfileItem[]>(INITIAL_FISCAL_PROFILES);
  const [newSummaryNote, setNewSummaryNote] = useState(createEmptySummaryNoteDraft);
  const [newBillingPanel, setNewBillingPanel] = useState(createEmptyBillingPanelDraft);
  const [newSupplier, setNewSupplier] = useState(createEmptySupplierDraft);
  const [newReceivable, setNewReceivable] = useState(createEmptyReceivableDraft);
  const [newPayable, setNewPayable] = useState(createEmptyPayableDraft);
  const [newReportTemplate, setNewReportTemplate] = useState(createEmptyReportTemplateDraft);
  const [newScaleSetting, setNewScaleSetting] = useState(createEmptyScaleSettingDraft);
  const [newPrinterSetting, setNewPrinterSetting] = useState(createEmptyPrinterSettingDraft);
  const [newFiscalProfile, setNewFiscalProfile] = useState(createEmptyFiscalProfileDraft);
  const deferredSearch = useDeferredValue(productSearch);
  const operatorMenuRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    setIsCreatePanelOpen(false);
  }, [activeModal]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    window.localStorage.setItem(
      DASHBOARD_VISIBILITY_STORAGE_KEY,
      JSON.stringify(dashboardVisibility),
    );
  }, [dashboardVisibility]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const toastTimeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 3200);

    return () => {
      window.clearTimeout(toastTimeoutId);
    };
  }, [toastMessage]);

  useEffect(() => {
    if (!isBootstrappingSession) {
      return;
    }

    const bootstrapTimeoutId = window.setTimeout(() => {
      setIsBootstrappingSession(false);
      setIsLoading(false);
      setMessage((currentMessage) =>
        currentMessage.startsWith("NETWORK_")
          ? currentMessage
          : "Nao foi possivel restaurar a sessao automaticamente. Faca login manualmente.",
      );
    }, BOOTSTRAP_SESSION_TIMEOUT_MS);

    return () => {
      window.clearTimeout(bootstrapTimeoutId);
    };
  }, [isBootstrappingSession]);

  const subtotalInCents = cartItems.reduce(
    (total, item) => total + Math.round(item.product.priceInCents * item.quantity),
    0,
  );
  const sortedCartItems = useMemo(
    () =>
      [...cartItems].sort((left, right) =>
        left.product.name.localeCompare(right.product.name, "pt-BR", {
          sensitivity: "base",
        }),
      ),
    [cartItems],
  );
  const discountPercentage = parsePercentage(discount);
  const discountInCents = Math.min(
    Math.round(subtotalInCents * (discountPercentage / 100)),
    subtotalInCents,
  );
  const totalInCents = Math.max(subtotalInCents - discountInCents, 0);
  const paymentAmountInCents = parseMoneyToCents(paymentAmount);
  const allRowsAmountInCents =
    paymentAmountInCents +
    extraPaymentRows
      .slice(0, installments - 1)
      .reduce((sum, row) => sum + parseMoneyToCents(row.amount), 0);
  const paidInCents = payments.reduce((total, payment) => total + payment.amountInCents, 0);
  const changeInCents = Math.max(paidInCents - totalInCents, 0);
  const filteredCustomers = useMemo(() => {
    const search = normalizeText(customerSearch.trim());

    if (!search) {
      return customers;
    }

    return customers.filter((customer) =>
      normalizeText(
        `${customer.name} ${customer.cpf ?? ""} ${customer.phone ?? ""} ${customer.email ?? ""}`,
      ).includes(search),
    );
  }, [customerSearch, customers]);
  const visibleProducts = useMemo(() => {
    const search = normalizeText(deferredSearch.trim());

    return products.filter((product) => {
      const searchableText = normalizeText(
        `${product.name} ${product.sku} ${product.barcode ?? ""} ${product.category?.path ?? ""}`,
      );

      const matchesSearch = !search || searchableText.includes(search);
      const matchesCategory = matchesShortcut(product, selectedShortcut);

      return product.active && matchesSearch && matchesCategory;
    });
  }, [deferredSearch, products, selectedShortcut]);
  const lowStockProducts = useMemo(
    () => products.filter((product) => product.active && product.stockStatus !== "AVAILABLE"),
    [products],
  );
  const cartStockIssue = useMemo(
    () =>
      cartItems.find((item) => {
        const latestProduct = products.find((product) => product.id === item.product.id) ?? item.product;
        return item.quantity > latestProduct.stockQuantity;
      }) ?? null,
    [cartItems, products],
  );
  const hasCartStockIssue = cartStockIssue !== null;
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) ?? null;
  const reportPeriodLabel = financialReport
    ? `${formatDate(financialReport.from)} a ${formatDate(financialReport.to)}`
    : "Periodo do mes atual";
  const cashOperationalTotalInCents =
    cashSession?.expectedAmountInCents ?? cashSession?.openingAmountInCents ?? 0;
  const isCashOperationLocked = !cashSession;
  const isSaleInProgress = cartItems.length > 0 && totalInCents > 0;
  const suggestedOpeningAmountInCents = getSuggestedOpeningAmountInCents(lastClosedCashSession);
  const canAddPayment =
    isSaleInProgress &&
    !hasCartStockIssue &&
    allRowsAmountInCents >= totalInCents &&
    !isLoading &&
    !isCashOperationLocked;
  const canFinalizeSale =
    payments.length > 0 &&
    paidInCents >= totalInCents &&
    !hasCartStockIssue &&
    !isLoading &&
    !isCashOperationLocked;

  useEffect(() => {
    if (!hasCartStockIssue) {
      return;
    }

    setToastMessage(CART_STOCK_BLOCKED_MESSAGE);
    setMessage(CART_STOCK_BLOCKED_MESSAGE);
  }, [hasCartStockIssue]);

  const shouldShowCashOpeningModal =
    isAuthenticated && hasLoadedDashboard && shouldShowCashEntryModal;
  const isCashLockScreenVisible = shouldShowCashOpeningModal;
  const getCashOperationBlockedMessage = () =>
    "Caixa bloqueado. Informe o valor de entrada do caixa no modal central para iniciar a operacao.";
  const reportPaymentBreakdown = financialReport
    ? (Object.entries(financialReport.byPaymentMethod) as Array<[PaymentInput["method"], number]>)
    : [];
  const summaryMetrics = [
    {
      label: "Sessao do caixa",
      value: cashSession ? "Caixa aberto" : "Caixa bloqueado",
      note: cashSession
        ? `Desde ${formatDateTime(cashSession.openedAt)}`
        : "Informe o valor de entrada do caixa no modal para iniciar vendas",
      tone: cashSession ? ("success" as const) : ("accent" as const),
    },
    {
      label: "Produtos ativos",
      value: formatNumber(products.filter((product) => product.active).length),
      note: `${formatNumber(lowStockProducts.length)} com alerta de estoque`,
      tone: "neutral" as const,
    },
    {
      label: "Clientes",
      value: formatNumber(customers.length),
      note: `${formatNumber(categories.length)} categorias cadastradas`,
      tone: "neutral" as const,
    },
    {
      label: "Ticket medio",
      value: formatMoney(financialReport?.averageTicketInCents ?? 0),
      note: `${formatNumber(financialReport?.salesCount ?? 0)} venda(s) no periodo`,
      tone: "success" as const,
    },
  ];
  const operatorRole = operatorProfile?.role;
  const isSystemAdministrator = isSystemAdministratorOperator(operatorProfile);
  const allowedManagerViews = operatorRole ? MANAGER_VIEW_ACCESS_BY_ROLE[operatorRole] ?? [] : [];
  const visibleManagerViews = new Set<ManagerView>(["manager-menu", ...allowedManagerViews]);
  const hasManagerAccess = allowedManagerViews.length > 0;
  const managerAccessMessage =
    "Seu perfil de acesso nao libera o menu gerencial. Apenas gerente, administrador e operador podem acessar os modulos permitidos.";

  const loadDashboard = async (
    successMessage = "Painel atualizado.",
    options?: { showCashEntryModal?: boolean },
  ) => {
    setIsLoading(true);

    try {
      const reportRange = getCurrentMonthRange();
      const [
        loadedProducts,
        loadedCustomers,
        loadedCashSessionSnapshot,
        loadedCategories,
        loadedFinancialReport,
        loadedOperatorProfile,
      ] = await Promise.all([
        listProducts({ includeInactive: true }),
        listCustomers(),
        getCurrentCashSession(),
        listCategories(),
        getFinancialReport(reportRange),
        getCurrentOperator(),
      ]);

      setCategories(sortCategories(loadedCategories));
      setProducts(
        [...loadedProducts].sort((left, right) => left.name.localeCompare(right.name, "pt-BR")),
      );
      setCustomers(
        [...loadedCustomers].sort((left, right) => left.name.localeCompare(right.name, "pt-BR")),
      );
      const loadedCashSession = loadedCashSessionSnapshot.cashSession;
      const loadedLastClosedCashSession = loadedCashSessionSnapshot.lastClosedCashSession;
      setCashSession(loadedCashSession);
      setLastClosedCashSession(loadedLastClosedCashSession);
      setFinancialReport(loadedFinancialReport);
      setOperatorProfile(loadedOperatorProfile);
      setEmail(loadedOperatorProfile.email);
      setHasLoadedDashboard(true);
      const needsCashEntry = !loadedCashSession && loadedOperatorProfile.role !== "STOCKIST";
      setShouldShowCashEntryModal(options?.showCashEntryModal ?? needsCashEntry);
      if (!loadedCashSession) {
        const suggestedOpeningAmountInCents = getSuggestedOpeningAmountInCents(
          loadedLastClosedCashSession,
        );
        setOpeningAmount(
          suggestedOpeningAmountInCents > 0
            ? formatMoneyInput(String(suggestedOpeningAmountInCents))
            : "",
        );
        setMessage("Caixa bloqueado. Informe o valor de entrada do caixa para iniciar a operacao.");
      } else {
        setOpeningAmount(formatMoneyInput(String(loadedCashSession.openingAmountInCents)));
        setMessage(successMessage);
      }
      return loadedOperatorProfile;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar dados do PDV.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const restorePersistedSession = async () => {
      setIsLoading(true);

      try {
        await getCurrentOperator();
        if (!isMounted) {
          return;
        }

        const loadedOperator = await loadDashboard("Sessao restaurada. Painel pronto para operacao.");

        if (isMounted && loadedOperator) {
          // Role-based landing is applied at login (handleLogin), not on every
          // restore: a restored session keeps the system administrator able to
          // navigate to the PDV / frente de caixa and back from /perfil.
          setIsAuthenticated(true);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof Error && error.message.startsWith("NETWORK_")) {
          setMessage(error.message);
          return;
        }

        setMessage("Informe suas credenciais para acessar o PDV.");
      } finally {
        if (isMounted) {
          setIsBootstrappingSession(false);
          setIsLoading(false);
        }
      }
    };

    void restorePersistedSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setHasLoadedDashboard(false);

    try {
      await signIn({ email, password });

      const loggedInOperator = await getCurrentOperator();

      // Role-based landing: the system administrator goes straight to the
      // administration (multitenant) area; every other role stays on the PDV shell.
      if (isSystemAdministratorOperator(loggedInOperator)) {
        setMessage("Login realizado. Redirecionando para a administracao...");
        router.push("/administracao");
        return;
      }

      const isStockist = loggedInOperator.role === "STOCKIST";
      await loadDashboard("Login realizado. Painel pronto para operacao.", {
        showCashEntryModal: !isStockist,
      });
      setIsAuthenticated(true);

      // The estoquista lands directly on the stock control view.
      if (isStockist) {
        setActiveModal("estoque");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no login.");
      setHasLoadedDashboard(false);
      setIsLoading(false);
    }
  };

  const resetPdvSessionState = () => {
    setOperatorProfile(null);
    setCategories([]);
    setProducts([]);
    setCustomers([]);
    setCashSession(null);
    setLastClosedCashSession(null);
    setHasLoadedDashboard(false);
    setFinancialReport(null);
    setCartItems([]);
    setProductSearch("");
    setCustomerSearch("");
    setSelectedCustomerId("");
    setSelectedShortcut("TODOS");
    setPaymentMethod("CASH");
    setPaymentAmount("");
    setTerminalId("PDV-01");
    setTransactionId("");
    setPayments([]);
    setOpeningAmount("");
    setShouldShowCashEntryModal(false);
    setCashWithdrawalAmount("");
    setCashWithdrawalNote("");
    setDiscount("0");
    setToastMessage("");
    setActiveModal(null);
    setIsCreatePanelOpen(false);
    setNewProduct(createEmptyProductDraft());
    setNewCategory(createEmptyCategoryDraft());
    setNewCustomer(createEmptyCustomerDraft());
  };

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await signOut();
      resetPdvSessionState();
      setIsAuthenticated(false);
      setPassword("");
      setMessage("Sessao encerrada. Informe suas credenciais para acessar o PDV.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao sair do sistema.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeOperatorMenu = () => {
    operatorMenuRef.current?.removeAttribute("open");
  };

  const handleRefreshDashboardFromMenu = async () => {
    closeOperatorMenu();
    await loadDashboard();
  };

  const handleLogoutFromMenu = async () => {
    closeOperatorMenu();
    await handleLogout();
  };

  const showToast = (nextMessage: string) => {
    setToastMessage(nextMessage);
    setMessage(nextMessage);
  };

  const addProductToCart = (product: Product) => {
    if (!cashSession) {
      setMessage(getCashOperationBlockedMessage());
      return;
    }

    if (product.stockQuantity <= 0) {
      showToast(CART_STOCK_BLOCKED_MESSAGE);
      return;
    }

    const currentQuantity = cartItems.find((item) => item.product.id === product.id)?.quantity ?? 0;

    if (currentQuantity + 1 > product.stockQuantity) {
      showToast(CART_STOCK_BLOCKED_MESSAGE);
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.product.id === product.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...currentItems, { product, quantity: 1 }];
    });

    setMessage(`${product.name} adicionado ao carrinho.`);
  };

  const removeCartItem = (productId: string) => {
    const selectedItem = cartItems.find((item) => item.product.id === productId);

    setCartItems((currentItems) => currentItems.filter((item) => item.product.id !== productId));
    setMessage(
      selectedItem
        ? `${selectedItem.product.name} removido do carrinho.`
        : "Item removido do carrinho.",
    );
  };

  const addPayment = () => {
    if (!cashSession) {
      setMessage(getCashOperationBlockedMessage());
      return;
    }

    if (hasCartStockIssue) {
      showToast(CART_STOCK_BLOCKED_MESSAGE);
      return;
    }

    const amountInCents = parseMoneyToCents(paymentAmount);

    if (amountInCents <= 0) {
      setMessage("Informe um valor de pagamento valido.");
      return;
    }

    const requiresTerminal = ["CARD", "CONTACTLESS", "DIGITAL_WALLET"].includes(paymentMethod);
    const payment: PaymentInput = {
      method: paymentMethod,
      amountInCents,
      ...(requiresTerminal
        ? {
            provider: "TEF",
            terminalId,
            externalTransactionId: transactionId || `TX-${Date.now()}`,
          }
        : {}),
    };

    const extraPayments: PaymentInput[] = extraPaymentRows
      .slice(0, installments - 1)
      .filter((row) => parseMoneyToCents(row.amount) > 0)
      .map((row) => {
        const requiresTerminalExtra = ["CARD", "CONTACTLESS", "DIGITAL_WALLET"].includes(row.method);
        return {
          method: row.method,
          amountInCents: parseMoneyToCents(row.amount),
          ...(requiresTerminalExtra
            ? { provider: "TEF" as const, terminalId, externalTransactionId: `TX-${Date.now()}-${row.method}` }
            : {}),
        };
      });

    setPayments((currentPayments) => [...currentPayments, payment, ...extraPayments]);
    setPaymentAmount("");
    setTransactionId("");
    setExtraPaymentRows((prev) => prev.map((r) => ({ ...r, amount: "" })));
      setMessage(`Pagamento ${paymentMethodLabels[paymentMethod]} adicionado.`);
  };

  const handleOpenCashSession = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!openingAmount.trim()) {
      setMessage("Informe manualmente o valor de entrada do caixa.");
      return;
    }

    const openingAmountInCents = parseMoneyToCents(openingAmount);

    if (openingAmountInCents <= 0) {
      setMessage("Informe um valor de entrada do caixa maior que zero.");
      return;
    }

    setIsLoading(true);

    try {
      if (cashSession) {
        const session = await updateCashSessionOpeningAmount(cashSession.id, openingAmountInCents);
        setCashSession({
          ...session,
          expectedAmountInCents: session.expectedAmountInCents ?? session.openingAmountInCents,
        });
        setShouldShowCashEntryModal(false);
        setOpeningAmount(formatMoneyInput(String(openingAmountInCents)));
        setMessage("Valor de abertura do caixa atualizado com sucesso.");
        return;
      }

      const session = await openCashSession(openingAmountInCents);
      setCashSession({
        ...session,
        expectedAmountInCents: session.expectedAmountInCents ?? session.openingAmountInCents,
      });
      setShouldShowCashEntryModal(false);
      setOpeningAmount("");
      setMessage("Caixa aberto. Valor de entrada registrado para troco.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao abrir caixa.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterCashWithdrawal = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!cashSession) {
      setMessage(getCashOperationBlockedMessage());
      return;
    }

    const amountInCents = parseMoneyToCents(cashWithdrawalAmount);

    if (amountInCents <= 0) {
      setMessage("Informe um valor valido para a sangria.");
      return;
    }

    setIsLoading(true);

    try {
      await registerCashMovement(cashSession.id, {
        type: "WITHDRAWAL",
        amountInCents,
        note: cashWithdrawalNote.trim() || undefined,
      });
      setCashWithdrawalAmount("");
      setCashWithdrawalNote("");
      await loadDashboard("Sangria registrada com sucesso.", { showCashEntryModal: false });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao registrar sangria.");
      setIsLoading(false);
    }
  };

  const handleProductImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setNewProduct((currentProduct) => ({ ...currentProduct, imageUrl: "" }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Selecione um arquivo de imagem valido para o produto.");
      event.target.value = "";
      return;
    }

    if (file.size > PRODUCT_IMAGE_MAX_SIZE_IN_BYTES) {
      setMessage("A imagem do produto deve ter no maximo 450 KB.");
      event.target.value = "";
      return;
    }

    try {
      const imageUrl = await readFileAsDataUrl(file);
      setNewProduct((currentProduct) => ({ ...currentProduct, imageUrl }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar a imagem do produto.");
      event.target.value = "";
    }
  };

  const ensureImportedCategoryHierarchy = async ({
    segments,
    description,
    categoryLookup,
    createdCategories,
    updatedCategories,
  }: {
    segments: string[];
    description?: string;
    categoryLookup: Map<string, Category>;
    createdCategories: Category[];
    updatedCategories: Category[];
  }) => {
    let parentId: string | undefined;
    let leafCategory: Category | null = null;
    const normalizedSegments = segments.map((segment) => segment.trim()).filter(Boolean);

    for (let index = 0; index < normalizedSegments.length; index += 1) {
      const currentSegment = normalizedSegments[index];

      if (!currentSegment) {
        continue;
      }

      const currentSegments = normalizedSegments.slice(0, index + 1);
      const categoryKey = getCategoryPathKey(currentSegments);
      const existingCategory = categoryLookup.get(categoryKey);

      if (existingCategory) {
        if (
          index === normalizedSegments.length - 1 &&
          description !== undefined &&
          description !== existingCategory.description
        ) {
          const updatedCategory = await updateCategory(existingCategory.id, {
            description: description || null,
          });

          categoryLookup.set(categoryKey, updatedCategory);
          updatedCategories.push(updatedCategory);
          parentId = updatedCategory.id;
          leafCategory = updatedCategory;
          continue;
        }

        parentId = existingCategory.id;
        leafCategory = existingCategory;
        continue;
      }

      const createdCategory = await createCategory({
        name: currentSegment,
        description: index === normalizedSegments.length - 1 ? description : undefined,
        parentId,
      });

      categoryLookup.set(categoryKey, createdCategory);
      createdCategories.push(createdCategory);
      parentId = createdCategory.id;
      leafCategory = createdCategory;
    }

    return leafCategory;
  };

  const handleCategoryCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsLoading(true);

    try {
      const rows = parseCsvText(await file.text());

      if (rows.length === 0) {
        throw new Error("O arquivo de categorias esta vazio ou nao possui linhas validas.");
      }

      const categoryLookup = buildCategoryPathLookup(categories);
      const createdCategories: Category[] = [];
      const updatedCategories: Category[] = [];
      let ignoredRows = 0;

      for (const row of rows) {
        const segments = getCategorySegmentsFromCategoryCsvRow(row);

        if (segments.length === 0) {
          ignoredRows += 1;
          continue;
        }

        try {
          await ensureImportedCategoryHierarchy({
            segments,
            description: getCsvValue(row, ["descricao", "description"]) || undefined,
            categoryLookup,
            createdCategories,
            updatedCategories,
          });
        } catch (error) {
          throw new Error(
            `Linha ${row.rowNumber}: ${error instanceof Error ? error.message : "erro ao importar categoria."}`,
          );
        }
      }

      if (createdCategories.length > 0 || updatedCategories.length > 0) {
        setCategories((currentCategories) =>
          sortCategories(
            mergeUniqueById(currentCategories, [...createdCategories, ...updatedCategories]),
          ),
        );
      }

      setMessage(
        `Importacao de categorias concluida: ${createdCategories.length} categoria(s) criada(s), ${updatedCategories.length} atualizada(s) e ${ignoredRows} linha(s) ignorada(s).`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao importar categorias.");
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  const handleProductCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsLoading(true);

    try {
      const rows = parseCsvText(await file.text());

      if (rows.length === 0) {
        throw new Error("O arquivo de produtos esta vazio ou nao possui linhas validas.");
      }

      const categoryLookup = buildCategoryPathLookup(categories);
      const createdCategories: Category[] = [];
      const updatedCategories: Category[] = [];
      const createdProducts: Product[] = [];
      const updatedProducts: Product[] = [];
      const productsBySku = new Map(products.map((product) => [normalizeText(product.sku), product]));
      const productsByBarcode = new Map(
        products
          .map((product) => [digitsOnly(product.barcode ?? ""), product] as const)
          .filter(([barcode]) => Boolean(barcode)),
      );
      let ignoredRows = 0;

      for (const row of rows) {
        const sku = getCsvValue(row, ["sku"]);
        const name = getCsvValue(row, ["nome", "name"]);

        if (!sku && !name) {
          ignoredRows += 1;
          continue;
        }

        if (!sku) {
          throw new Error(`Linha ${row.rowNumber}: informe o SKU do produto.`);
        }

        if (!name) {
          throw new Error(`Linha ${row.rowNumber}: informe o nome do produto.`);
        }

        const barcode = getCsvValue(row, ["codigo_barras", "barcode", "ean"]);
        const skuKey = normalizeText(sku);
        const barcodeKey = digitsOnly(barcode);
        const matchedBySku = productsBySku.get(skuKey);
        const matchedByBarcode = barcodeKey ? productsByBarcode.get(barcodeKey) : undefined;
        const existingProduct =
          matchedBySku && matchedByBarcode && matchedBySku.id !== matchedByBarcode.id
            ? null
            : matchedBySku ?? matchedByBarcode;

        if (matchedBySku && matchedByBarcode && matchedBySku.id !== matchedByBarcode.id) {
          throw new Error(
            `Linha ${row.rowNumber}: SKU e codigo de barras apontam para produtos diferentes.`,
          );
        }

        const categorySegments = getCategorySegmentsFromProductCsvRow(row);
        let categoryId: string | undefined;

        if (categorySegments.length > 0) {
          const leafCategory = await ensureImportedCategoryHierarchy({
            segments: categorySegments,
            categoryLookup,
            createdCategories,
            updatedCategories,
          });
          categoryId = leafCategory?.id;
        }

        const priceInCents = parseCsvMoneyToCents(
          getCsvValue(row, ["preco_venda", "preco", "price"]),
        );

        if (priceInCents <= 0) {
          throw new Error(`Linha ${row.rowNumber}: informe um preco de venda maior que zero.`);
        }

        try {
          const productPayload = {
            sku,
            barcode: barcode || undefined,
            name,
            description: getCsvValue(row, ["descricao", "description"]) || undefined,
            unit: normalizeProductUnitFromCsv(getCsvValue(row, ["unidade", "unit"]) || "UNIT"),
            priceInCents,
            costInCents: Math.max(
              0,
              parseCsvMoneyToCents(getCsvValue(row, ["custo", "cost", "preco_custo"])),
            ),
            stockQuantity: Math.max(
              0,
              parseCsvNumber(getCsvValue(row, ["estoque_atual", "estoque", "stock_quantity"])),
            ),
            minimumStock: Math.max(
              0,
              parseCsvNumber(getCsvValue(row, ["estoque_minimo", "minimum_stock"])),
            ),
            fiscalNcm: getCsvValue(row, ["ncm_fiscal", "ncm"]) || undefined,
            fiscalCfop: getCsvValue(row, ["cfop_fiscal", "cfop"]) || undefined,
            categoryId,
          };

          const product = existingProduct
            ? await updateProduct(existingProduct.id, {
                ...productPayload,
                barcode: productPayload.barcode ?? null,
                description: productPayload.description ?? null,
                fiscalNcm: productPayload.fiscalNcm ?? null,
                fiscalCfop: productPayload.fiscalCfop ?? null,
                categoryId: productPayload.categoryId ?? null,
              })
            : await createProduct({
                ...productPayload,
                imageUrl: PRODUCT_WITHOUT_IMAGE_URL,
              });

          if (existingProduct) {
            updatedProducts.push(product);
          } else {
            createdProducts.push(product);
          }

          productsBySku.set(skuKey, product);

          if (barcodeKey) {
            productsByBarcode.set(barcodeKey, product);
          }
        } catch (error) {
          throw new Error(
            `Linha ${row.rowNumber}: ${error instanceof Error ? error.message : "erro ao importar produto."}`,
          );
        }
      }

      if (createdCategories.length > 0 || updatedCategories.length > 0) {
        setCategories((currentCategories) =>
          sortCategories(
            mergeUniqueById(currentCategories, [...createdCategories, ...updatedCategories]),
          ),
        );
      }

      if (createdProducts.length > 0 || updatedProducts.length > 0) {
        setProducts((currentProducts) =>
          mergeUniqueById(currentProducts, [...createdProducts, ...updatedProducts]).sort((left, right) =>
            left.name.localeCompare(right.name, "pt-BR"),
          ),
        );
      }

      setMessage(
        `Importacao de produtos concluida: ${createdProducts.length} produto(s) criado(s), ${updatedProducts.length} atualizado(s), ${createdCategories.length} categoria(s) criada(s), ${updatedCategories.length} categoria(s) atualizada(s) e ${ignoredRows} linha(s) vazia(s) ignorada(s).`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao importar produtos.");
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  const handleCreateProduct = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const product = await createProduct({
        sku: newProduct.sku,
        barcode: newProduct.barcode || undefined,
        name: newProduct.name,
        description: newProduct.description || undefined,
        imageUrl: newProduct.imageUrl || PRODUCT_WITHOUT_IMAGE_URL,
        unit: newProduct.unit,
        priceInCents: parseMoneyToCents(newProduct.price),
        costInCents: parseMoneyToCents(newProduct.cost),
        stockQuantity: Number(newProduct.stockQuantity),
        minimumStock: Number(newProduct.minimumStock),
        fiscalNcm: newProduct.fiscalNcm || undefined,
        fiscalCfop: newProduct.fiscalCfop || undefined,
        categoryId: newProduct.categoryId || undefined,
      });

      setProducts((currentProducts) =>
        [...currentProducts, product].sort((left, right) =>
          left.name.localeCompare(right.name, "pt-BR"),
        ),
      );
      setNewProduct(createEmptyProductDraft());
      setIsCreatePanelOpen(false);
      setMessage("Produto cadastrado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao cadastrar produto.");
    } finally {
      setIsLoading(false);
    }
  };

  const syncProductState = (updatedProduct: Product) => {
    setProducts((currentProducts) =>
      mergeUniqueById(currentProducts, [updatedProduct]).sort((left, right) =>
        left.name.localeCompare(right.name, "pt-BR"),
      ),
    );
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.product.id === updatedProduct.id
          ? { ...item, product: updatedProduct }
          : item,
      ),
    );
  };

  const handleProductStockInputCommit = async (product: Product, input: HTMLInputElement) => {
    const stockQuantity = parseStockQuantityInput(input.value);

    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
      setMessage("Informe uma quantidade de estoque valida e maior ou igual a zero.");
      input.value = formatStockInputValue(product.stockQuantity);
      return;
    }

    const stockDelta = Number((stockQuantity - product.stockQuantity).toFixed(3));

    if (stockDelta === 0) {
      input.value = formatStockInputValue(product.stockQuantity);
      return;
    }

    setIsLoading(true);

    try {
      const operation = stockDelta > 0 ? "INCREMENT" : "DECREMENT";
      const updatedProduct = await adjustProductStock(product.id, {
        operation,
        quantity: Math.abs(stockDelta),
      });
      syncProductState(updatedProduct);
      setMessage(
        `Estoque de ${updatedProduct.name} ${operation === "INCREMENT" ? "incrementado" : "decrementado"} para ${formatNumber(updatedProduct.stockQuantity)} ${getStockUnitShortLabel(updatedProduct)}.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao atualizar estoque.");
      input.value = formatStockInputValue(product.stockQuantity);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const category = await createCategory({
        name: newCategory.name,
        description: newCategory.description || undefined,
        parentId: newCategory.parentId || undefined,
      });

      setCategories((currentCategories) => sortCategories([...currentCategories, category]));
      setNewCategory({ name: "", description: "", parentId: "" });
      setIsCreatePanelOpen(false);
      setMessage("Categoria cadastrada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao cadastrar categoria.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const customer = await createCustomer({
        name: newCustomer.name,
        cpf: newCustomer.cpf || undefined,
        phone: newCustomer.phone || undefined,
        email: newCustomer.email || undefined,
        loyaltyCode: newCustomer.loyaltyCode || undefined,
        address: newCustomer.address || undefined,
      });

      setCustomers((currentCustomers) =>
        [...currentCustomers, customer].sort((left, right) =>
          left.name.localeCompare(right.name, "pt-BR"),
        ),
      );
      setSelectedCustomerId(customer.id);
      setNewCustomer({
        name: "",
        cpf: "",
        phone: "",
        email: "",
        loyaltyCode: "",
        address: "",
      });
      setIsCreatePanelOpen(false);
      setMessage("Cliente cadastrado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao cadastrar cliente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSale = async () => {
    if (!cashSession) {
      setMessage(getCashOperationBlockedMessage());
      return;
    }

    if (cartItems.length === 0) {
      setMessage("Adicione produtos ao carrinho.");
      return;
    }

    if (hasCartStockIssue) {
      showToast(CART_STOCK_BLOCKED_MESSAGE);
      return;
    }

    if (payments.length === 0) {
      setMessage("Adicione ao menos um pagamento.");
      return;
    }

    if (paidInCents < totalInCents) {
      setMessage("O total pago ainda nao cobre o valor da venda.");
      return;
    }

    setIsLoading(true);

    try {
      const sale = await registerSale({
        cashSessionId: cashSession.id,
        customerId: selectedCustomerId || undefined,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        payments,
        discountInCents,
        fiscalMode: "ONLINE",
        signatureRequired: payments.some((payment) => payment.method === "STORE_CREDIT"),
      });

      const saleMessage = `Venda ${sale.number} finalizada. Troco ${formatMoney(sale.changeInCents)}.`;
      setCartItems([]);
      setPayments([]);
      setDiscount("0");
      await loadDashboard(saleMessage, { showCashEntryModal: false });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao finalizar venda.");
      setIsLoading(false);
    }
  };

  const handleCreateSummaryNote = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSummaryNotes((current) => [
      {
        id: createLocalId("summary"),
        title: newSummaryNote.title,
        owner: newSummaryNote.owner,
        status: newSummaryNote.status,
        description: newSummaryNote.description,
      },
      ...current,
    ]);
    setNewSummaryNote({ title: "", owner: "", status: "Ativo", description: "" });
    setIsCreatePanelOpen(false);
    setMessage("Item de resumo cadastrado localmente.");
  };

  const handleCreateBillingPanel = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBillingPanels((current) => [
      {
        id: createLocalId("billing"),
        title: newBillingPanel.title,
        period: newBillingPanel.period,
        goalInCents: parseMoneyToCents(newBillingPanel.goal),
        status: newBillingPanel.status,
      },
      ...current,
    ]);
    setNewBillingPanel({ title: "", period: "Mensal", goal: "", status: "Acompanhando" });
    setIsCreatePanelOpen(false);
    setMessage("Painel de faturamento cadastrado localmente.");
  };

  const handleCreateSupplier = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuppliers((current) => [
      {
        id: createLocalId("supplier"),
        name: newSupplier.name,
        document: newSupplier.document,
        category: newSupplier.category,
        phone: newSupplier.phone,
        status: newSupplier.status,
      },
      ...current,
    ]);
    setNewSupplier({ name: "", document: "", category: "", phone: "", status: "Ativo" });
    setIsCreatePanelOpen(false);
    setMessage("Fornecedor cadastrado localmente.");
  };

  const handleCreateReceivable = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReceivables((current) => [
      {
        id: createLocalId("receivable"),
        customer: newReceivable.customer,
        dueDate: newReceivable.dueDate,
        amountInCents: parseMoneyToCents(newReceivable.amount),
        status: newReceivable.status,
      },
      ...current,
    ]);
    setNewReceivable({ customer: "", dueDate: "", amount: "", status: "Aberto" });
    setIsCreatePanelOpen(false);
    setMessage("Titulo a receber cadastrado localmente.");
  };

  const handleCreatePayable = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPayables((current) => [
      {
        id: createLocalId("payable"),
        description: newPayable.description,
        supplier: newPayable.supplier,
        dueDate: newPayable.dueDate,
        amountInCents: parseMoneyToCents(newPayable.amount),
        status: newPayable.status,
      },
      ...current,
    ]);
    setNewPayable({ description: "", supplier: "", dueDate: "", amount: "", status: "Pendente" });
    setIsCreatePanelOpen(false);
    setMessage("Titulo a pagar cadastrado localmente.");
  };

  const handleCreateReportTemplate = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReportTemplates((current) => [
      {
        id: createLocalId("report"),
        name: newReportTemplate.name,
        period: newReportTemplate.period,
        target: newReportTemplate.target,
      },
      ...current,
    ]);
    setNewReportTemplate({ name: "", period: "Mensal", target: "Gerencia" });
    setIsCreatePanelOpen(false);
    setMessage("Modelo de relatorio cadastrado localmente.");
  };

  const handleCreateScaleSetting = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setScaleSettings((current) => [
      {
        id: createLocalId("scale"),
        name: newScaleSetting.name,
        model: newScaleSetting.model,
        port: newScaleSetting.port,
        status: newScaleSetting.status,
      },
      ...current,
    ]);
    setNewScaleSetting({ name: "", model: "", port: "", status: "Pronta" });
    setIsCreatePanelOpen(false);
    setMessage("Balanca cadastrada localmente.");
  };

  const handleCreatePrinterSetting = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPrinterSettings((current) => [
      {
        id: createLocalId("printer"),
        name: newPrinterSetting.name,
        model: newPrinterSetting.model,
        queue: newPrinterSetting.queue,
        status: newPrinterSetting.status,
      },
      ...current,
    ]);
    setNewPrinterSetting({ name: "", model: "", queue: "", status: "Online" });
    setIsCreatePanelOpen(false);
    setMessage("Impressora cadastrada localmente.");
  };

  const handleCreateFiscalProfile = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFiscalProfiles((current) => [
      {
        id: createLocalId("fiscal"),
        name: newFiscalProfile.name,
        series: newFiscalProfile.series,
        environment: newFiscalProfile.environment,
        status: newFiscalProfile.status,
      },
      ...current,
    ]);
    setNewFiscalProfile({ name: "", series: "", environment: "Producao", status: "Ativo" });
    setIsCreatePanelOpen(false);
    setMessage("Perfil fiscal cadastrado localmente.");
  };

  const openModal = (view: ManagerView) => {
    if (!hasManagerAccess) {
      setMessage(managerAccessMessage);
      return;
    }

    if (!visibleManagerViews.has(view)) {
      setMessage("Seu perfil permite acessar apenas os links do modulo Operacao.");
      return;
    }

    setActiveModal(view);
  };
  const closeModal = () => setActiveModal(null);

  const productCreateForm = (
    <form className="modal-form-grid" onSubmit={(event) => void handleCreateProduct(event)}>
      <div className="form-columns two-columns-form">
        <label>
          SKU
          <input
            required
            value={newProduct.sku}
            onChange={(event) => setNewProduct({ ...newProduct, sku: event.target.value })}
          />
        </label>
        <label>
          Codigo de barras
          <input
            value={newProduct.barcode}
            onChange={(event) => setNewProduct({ ...newProduct, barcode: event.target.value })}
          />
        </label>
      </div>

      <label>
        Nome do produto
        <input
          required
          value={newProduct.name}
          onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })}
        />
      </label>

      <label>
        Descricao
        <textarea
          value={newProduct.description}
          maxLength={500}
          onChange={(event) => setNewProduct({ ...newProduct, description: event.target.value })}
        />
      </label>

      <div className="product-image-upload">
        <label>
          Imagem do produto
          <input type="file" accept="image/*" onChange={(event) => void handleProductImageChange(event)} />
        </label>

        {newProduct.imageUrl ? (
          <div className="product-image-preview-card">
            <img
              src={newProduct.imageUrl}
              alt={`Previa do produto ${newProduct.name || "sem nome"}`}
            />
            <div>
              <strong>Imagem pronta para uso</strong>
              <small>A imagem sera exibida no catalogo do produto.</small>
            </div>
            <button
              className="ghost-button small-button"
              type="button"
              onClick={() => setNewProduct({ ...newProduct, imageUrl: "" })}
            >
              Remover imagem
            </button>
          </div>
        ) : (
          <small>Opcional. Envie uma imagem leve para aparecer no catalogo.</small>
        )}
      </div>

      <div className="form-columns three-columns-form">
        <label>
          Categoria
          <select
            value={newProduct.categoryId}
            onChange={(event) => setNewProduct({ ...newProduct, categoryId: event.target.value })}
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.path}
              </option>
            ))}
          </select>
        </label>

        <label>
          Unidade
          <select
            value={newProduct.unit}
            onChange={(event) =>
              setNewProduct({ ...newProduct, unit: event.target.value as Product["unit"] })
            }
          >
            <option value="UNIT">Unidade</option>
            <option value="KG">Kg</option>
          </select>
        </label>

        <label>
          Preco de venda
          <input
            inputMode="numeric"
            placeholder="0,00"
            required
            value={newProduct.price}
            onChange={(event) =>
              setNewProduct({ ...newProduct, price: formatMoneyInput(event.target.value) })
            }
          />
        </label>
      </div>

      <div className="form-columns four-columns-form">
        <label>
          Custo
          <input
            inputMode="numeric"
            placeholder="0,00"
            value={newProduct.cost}
            onChange={(event) =>
              setNewProduct({ ...newProduct, cost: formatMoneyInput(event.target.value) })
            }
          />
        </label>
        <label>
          Estoque atual
          <input
            value={newProduct.stockQuantity}
            onChange={(event) => setNewProduct({ ...newProduct, stockQuantity: event.target.value })}
          />
        </label>
        <label>
          Estoque minimo
          <input
            value={newProduct.minimumStock}
            onChange={(event) => setNewProduct({ ...newProduct, minimumStock: event.target.value })}
          />
        </label>
        <label>
          NCM fiscal
          <input
            value={newProduct.fiscalNcm}
            onChange={(event) => setNewProduct({ ...newProduct, fiscalNcm: event.target.value })}
          />
        </label>
      </div>

      <div className="form-columns two-columns-form">
        <label>
          CFOP fiscal
          <input
            value={newProduct.fiscalCfop}
            onChange={(event) => setNewProduct({ ...newProduct, fiscalCfop: event.target.value })}
          />
        </label>
        <div className="form-actions inline-actions">
          <button className="primary-button" type="submit" disabled={isLoading}>
            Salvar produto
          </button>
        </div>
      </div>
    </form>
  );

  const categoryCreateForm = (
    <form className="modal-form-grid" onSubmit={(event) => void handleCreateCategory(event)}>
      <div className="form-columns two-columns-form">
        <label>
          Nome da categoria
          <input
            required
            value={newCategory.name}
            onChange={(event) => setNewCategory({ ...newCategory, name: event.target.value })}
          />
        </label>
        <label>
          Categoria pai
          <select
            value={newCategory.parentId}
            onChange={(event) => setNewCategory({ ...newCategory, parentId: event.target.value })}
          >
            <option value="">Categoria raiz</option>
            {categories
              .filter((category) => category.level < 5)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.path}
                </option>
              ))}
          </select>
        </label>
      </div>

      <label>
        Descricao
        <input
          value={newCategory.description}
          onChange={(event) => setNewCategory({ ...newCategory, description: event.target.value })}
        />
      </label>

      <div className="form-actions inline-actions">
        <button className="primary-button" type="submit" disabled={isLoading}>
          Salvar categoria
        </button>
      </div>
    </form>
  );

  const customerCreateForm = (
    <form className="modal-form-grid" onSubmit={(event) => void handleCreateCustomer(event)}>
      <div className="form-columns two-columns-form">
        <label>
          Nome do cliente
          <input
            required
            value={newCustomer.name}
            onChange={(event) => setNewCustomer({ ...newCustomer, name: event.target.value })}
          />
        </label>
        <label>
          CPF
          <input
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={newCustomer.cpf}
            onChange={(event) =>
              setNewCustomer({ ...newCustomer, cpf: formatCpfInput(event.target.value) })
            }
          />
        </label>
      </div>

      <div className="form-columns three-columns-form">
        <label>
          Telefone
          <input
            inputMode="tel"
            placeholder="(00) 00000-0000"
            value={newCustomer.phone}
            onChange={(event) =>
              setNewCustomer({ ...newCustomer, phone: formatPhoneInput(event.target.value) })
            }
          />
        </label>
        <label>
          E-mail
          <input
            value={newCustomer.email}
            onChange={(event) => setNewCustomer({ ...newCustomer, email: event.target.value })}
          />
        </label>
        <label>
          Codigo fidelidade
          <input
            value={newCustomer.loyaltyCode}
            onChange={(event) => setNewCustomer({ ...newCustomer, loyaltyCode: event.target.value })}
          />
        </label>
      </div>

      <label>
        Endereco
        <input
          value={newCustomer.address}
          onChange={(event) => setNewCustomer({ ...newCustomer, address: event.target.value })}
        />
      </label>

      <div className="form-actions inline-actions">
        <button className="primary-button" type="submit" disabled={isLoading}>
          Salvar cliente
        </button>
      </div>
    </form>
  );

  const renderCreateToggle = () => (
    <button
      className="secondary-button"
      type="button"
      onClick={() => setIsCreatePanelOpen((current) => !current)}
    >
      {isCreatePanelOpen ? " - " : " + "}
    </button>
  );

  const renderActiveModal = () => {
    if (!activeModal || !hasManagerAccess || !visibleManagerViews.has(activeModal)) {
      return null;
    }

    if (activeModal === "manager-menu") {
      return (
        <ModalShell
          title="Menu "
          subtitle="Acesso rapido aos cadastros e consultas principais do PDV."
          onClose={closeModal}
        >
          <div className="manager-groups">
            {MANAGER_GROUP_ORDER.map((group) => {
              const items = MANAGER_MENU_ITEMS.filter(
                (item) => item.group === group && visibleManagerViews.has(item.id),
              );

              if (items.length === 0) {
                return null;
              }

                return (
                  <section className="manager-group" key={group}>
                    <h3>{group}</h3>
                    <div className="manager-grid manager-menu-list">
                      {items.map((item) => (
                      <ManagerTile
                        key={item.id}
                        view={item.id}
                        label={item.label}
                        description={item.description}
                        onClick={() => openModal(item.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            <section className="manager-group">
              <h3>Acesso</h3>
              <div className="manager-grid manager-menu-list">
                <ManagerTile
                  icon={UserCog}
                  href="/perfil"
                  label="Perfil de acesso"
                  description="Seus dados de operador, role e seguranca da conta."
                />
                {operatorRole === "ADMIN" ? (
                  <ManagerTile
                    icon={UsersRound}
                    href="/perfil/funcionarios"
                    label="Funcionarios"
                    description="Cadastro e gestao dos operadores do estabelecimento."
                  />
                ) : null}
              </div>
            </section>
          </div>
        </ModalShell>
      );
    }

    if (activeModal === "configuracoes") {
      return (
        <ModalShell
          title="Configuracoes"
          subtitle="Selecione o grupo que deseja configurar no ambiente do caixa."
          onClose={closeModal}
          onBack={() => openModal("manager-menu")}
          backLabel="Voltar"
        >
          <div className="manager-grid config-grid">
            {CONFIGURATION_MENU_ITEMS.map((item) => (
              <ManagerTile
                key={item.id}
                view={item.id}
                label={item.label}
                description={item.description}
                onClick={() => openModal(item.id)}
              />
            ))}
          </div>
        </ModalShell>
      );
    }

    const backTarget = getBackTarget(activeModal);
    const handleBack = backTarget ? () => openModal(backTarget) : undefined;
    const backLabel = backTarget === "configuracoes" ? "Voltar para configuracoes" : "voltar";

    switch (activeModal) {
      case "resumo":
        return (
          <ModalShell
            title="Resumo operacional"
            subtitle={`Indicadores principais do PDV e acompanhamentos cadastrados. Periodo ${reportPeriodLabel}.`}
            onClose={closeModal}
            onBack={handleBack}
            backLabel={backLabel}
          >
            <section className="modal-section">
              <div className="metric-grid four-up">
                {summaryMetrics.map((metric) => (
                  <MetricTile
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    note={metric.note}
                    tone={metric.tone}
                  />
                ))}
              </div>
            </section>

            <section className="modal-section">
              <div className="section-heading">
                <div>
                  <h3>Acompanhamentos cadastrados</h3>
                  <p>Registre observacoes importantes para a operacao da loja.</p>
                </div>
                {renderCreateToggle()}
              </div>

              {isCreatePanelOpen ? (
                <form className="modal-form-grid" onSubmit={handleCreateSummaryNote}>
                  <div className="form-columns two-columns-form">
                    <label>
                      Titulo
                      <input
                        required
                        value={newSummaryNote.title}
                        onChange={(event) =>
                          setNewSummaryNote({ ...newSummaryNote, title: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Responsavel
                      <input
                        required
                        value={newSummaryNote.owner}
                        onChange={(event) =>
                          setNewSummaryNote({ ...newSummaryNote, owner: event.target.value })
                        }
                      />
                    </label>
                  </div>

                  <div className="form-columns two-columns-form">
                    <label>
                      Status
                      <select
                        value={newSummaryNote.status}
                        onChange={(event) =>
                          setNewSummaryNote({ ...newSummaryNote, status: event.target.value })
                        }
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Em revisao">Em revisao</option>
                        <option value="Concluido">Concluido</option>
                      </select>
                    </label>
                    <label>
                      Descricao
                      <input
                        required
                        value={newSummaryNote.description}
                        onChange={(event) =>
                          setNewSummaryNote({ ...newSummaryNote, description: event.target.value })
                        }
                      />
                    </label>
                  </div>

                  <div className="form-actions inline-actions">
                    <button className="primary-button" type="submit">
                      Salvar resumo
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="record-list">
                {summaryNotes.map((item) => (
                  <article className="record-row" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </div>
                    <div className="record-aside">
                      <span className="tag">{item.status}</span>
                      <small>{item.owner}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </ModalShell>
        );

      case "faturamento":
        return (
          <ModalShell
            title="Faturamento"
            subtitle={`Receita consolidada do periodo ${reportPeriodLabel}, com metas e distribuicao de pagamentos.`}
            onClose={closeModal}
            onBack={handleBack}
            backLabel={backLabel}
          >
            <section className="modal-section">
              <div className="metric-grid four-up">
                <MetricTile
                  label="Venda bruta"
                  value={formatMoney(financialReport?.grossSalesInCents ?? 0)}
                  note="Soma do subtotal do periodo"
                  tone="accent"
                />
                <MetricTile
                  label="Descontos"
                  value={formatMoney(financialReport?.discountInCents ?? 0)}
                  note="Descontos aplicados nas vendas"
                />
                <MetricTile
                  label="Venda liquida"
                  value={formatMoney(financialReport?.netSalesInCents ?? 0)}
                  note={`${formatNumber(financialReport?.salesCount ?? 0)} venda(s)`}
                  tone="success"
                />
                <MetricTile
                  label="Lucro estimado"
                  value={formatMoney(financialReport?.profitInCents ?? 0)}
                  note={`Ticket medio ${formatMoney(financialReport?.averageTicketInCents ?? 0)}`}
                />
              </div>
            </section>

            <section className="modal-section two-column-modal-grid">
              <div className="panel-card">
                <div className="section-heading compact-heading">
                  <div>
                    <h3>Paineis cadastrados</h3>
                    <p>Metas e acompanhamentos locais de faturamento.</p>
                  </div>
                  {renderCreateToggle()}
                </div>

                {isCreatePanelOpen ? (
                  <form className="modal-form-grid" onSubmit={handleCreateBillingPanel}>
                    <div className="form-columns two-columns-form">
                      <label>
                        Titulo
                        <input
                          required
                          value={newBillingPanel.title}
                          onChange={(event) =>
                            setNewBillingPanel({ ...newBillingPanel, title: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Periodicidade
                        <select
                          value={newBillingPanel.period}
                          onChange={(event) =>
                            setNewBillingPanel({ ...newBillingPanel, period: event.target.value })
                          }
                        >
                          <option value="Diario">Diario</option>
                          <option value="Semanal">Semanal</option>
                          <option value="Mensal">Mensal</option>
                        </select>
                      </label>
                    </div>

                    <div className="form-columns two-columns-form">
                      <label>
                        Meta financeira
                        <input
                          inputMode="numeric"
                          placeholder="0,00"
                          required
                          value={newBillingPanel.goal}
                          onChange={(event) =>
                            setNewBillingPanel({
                              ...newBillingPanel,
                              goal: formatMoneyInput(event.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        Status
                        <select
                          value={newBillingPanel.status}
                          onChange={(event) =>
                            setNewBillingPanel({ ...newBillingPanel, status: event.target.value })
                          }
                        >
                          <option value="Acompanhando">Acompanhando</option>
                          <option value="Em observacao">Em observacao</option>
                          <option value="Concluido">Concluido</option>
                        </select>
                      </label>
                    </div>

                    <div className="form-actions inline-actions">
                      <button className="primary-button" type="submit">
                        Salvar painel
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="record-list">
                  {billingPanels.map((item) => (
                    <article className="record-row" key={item.id}>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.period}</small>
                      </div>
                      <div className="record-aside">
                        <strong>{formatMoney(item.goalInCents)}</strong>
                        <small>{item.status}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="panel-card">
                <div className="section-heading compact-heading no-action">
                  <div>
                    <h3>Pagamentos no periodo</h3>
                    <p>Distribuicao por meio de pagamento aprovado.</p>
                  </div>
                </div>

                <div className="record-list">
                  {reportPaymentBreakdown.length === 0 ? (
                    <p className="empty-state">Nenhum pagamento registrado no periodo.</p>
                  ) : (
                    reportPaymentBreakdown.map(([method, amount]) => (
                      <article className="record-row" key={method}>
                        <div>
                          <strong>{paymentMethodLabels[method]}</strong>
                          <small>Participacao no faturamento</small>
                        </div>
                        <div className="record-aside">
                          <strong>{formatMoney(amount)}</strong>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="modal-section two-column-modal-grid">
              <div className="panel-card">
                <div className="section-heading compact-heading no-action">
                  <div>
                    <h3>Faturamento diario</h3>
                    <p>Totais por dia dentro do periodo carregado.</p>
                  </div>
                </div>
                <div className="record-list dense-list">
                  {(financialReport?.daily ?? []).length === 0 ? (
                    <p className="empty-state">Sem vendas para exibir neste intervalo.</p>
                  ) : (
                    (financialReport?.daily ?? []).map((item) => (
                      <article className="record-row" key={item.date}>
                        <div>
                          <strong>{formatDate(item.date)}</strong>
                          <small>{formatNumber(item.salesCount)} venda(s)</small>
                        </div>
                        <div className="record-aside">
                          <strong>{formatMoney(item.totalInCents)}</strong>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="panel-card">
                <div className="section-heading compact-heading no-action">
                  <div>
                    <h3>Faturamento mensal</h3>
                    <p>Acumulado por mes com total de vendas.</p>
                  </div>
                </div>
                <div className="record-list dense-list">
                  {(financialReport?.monthly ?? []).length === 0 ? (
                    <p className="empty-state">Nenhum acumulado mensal disponivel.</p>
                  ) : (
                    (financialReport?.monthly ?? []).map((item) => (
                      <article className="record-row" key={item.month}>
                        <div>
                          <strong>{formatMonthLabel(item.month)}</strong>
                          <small>{formatNumber(item.salesCount)} venda(s)</small>
                        </div>
                        <div className="record-aside">
                          <strong>{formatMoney(item.totalInCents)}</strong>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </section>
          </ModalShell>
        );

      case "categorias":
        return (
          <ModalShell
            title="Categorias"
            subtitle="Cadastro e hierarquia das categorias exibidas no PDV."
            onClose={closeModal}
            onBack={handleBack}
            backLabel={backLabel}
          >
            <section className="modal-section">
              <div className="section-heading">
                <div>
                  <h3>Cadastro de categorias</h3>
                  <p>Use apenas os niveis necessarios para organizar os setores da loja.</p>
                </div>
                {renderCreateToggle()}
              </div>

              <div className="csv-template-card">
                <div>
                  <strong>Modelo CSV para categorias</strong>
                  <p>
                    Baixe o arquivo modelo e preencha a hierarquia por colunas (`nivel1` ate
                    `nivel5`). Isso e mais seguro do que usar tabulacao no CSV.
                  </p>
                </div>
                <a className="ghost-button" href="/modelo-categorias.csv" download>
                  Baixar modelo CSV
                </a>
              </div>

              <div className="csv-import-card">
                <div>
                  <strong>Importar categorias por CSV</strong>
                  <p>
                    Selecione um arquivo no modelo acima para cadastrar a hierarquia das categorias
                    automaticamente.
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv,text/csv,text/tab-separated-values"
                  onChange={(event) => void handleCategoryCsvImport(event)}
                  disabled={isLoading}
                />
              </div>

              {isCreatePanelOpen ? categoryCreateForm : null}

              <div className="record-list modal-scroll-list">
                {categories.length === 0 ? (
                  <p className="empty-state">Nenhuma categoria cadastrada.</p>
                ) : (
                  categories.map((category) => (
                    <article className="record-row" key={category.id}>
                      <div>
                        <strong>{category.path}</strong>
                        <small>
                          Nivel {category.level} · {category.childrenCount} subcategoria(s)
                        </small>
                      </div>
                      <div className="record-aside">
                        <strong>{formatNumber(category.productCount)}</strong>
                        <small>produto(s)</small>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </ModalShell>
        );

      case "produtos":
        return (
          <ModalShell
            title="Produtos"
            subtitle="Cadastro principal dos itens vendidos na frente de caixa."
            onClose={closeModal}
            onBack={handleBack}
            backLabel={backLabel}
          >
            <section className="modal-section">
              <div className="section-heading">
                <div>
                  <h3>Produtos cadastrados</h3>
                  <p>Itens com preco, categoria, estoque e status comercial.</p>
                </div>
                {renderCreateToggle()}
              </div>

              <div className="csv-template-card">
                <div>
                  <strong>Modelo CSV para produtos</strong>
                  <p>
                    Baixe o arquivo modelo e preencha os produtos com a categoria separada em
                    colunas (`categoria_nivel1` ate `categoria_nivel5`) para casar com a hierarquia
                    do cadastro.
                  </p>
                </div>
                <a className="ghost-button" href="/modelo-produtos.csv" download>
                  Baixar modelo CSV
                </a>
              </div>

              <div className="csv-import-card">
                <div>
                  <strong>Importar produtos por CSV</strong>
                  <p>
                    Selecione um arquivo no modelo acima. As categorias do produto podem ser
                    criadas automaticamente durante a importacao.
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv,text/csv,text/tab-separated-values"
                  onChange={(event) => void handleProductCsvImport(event)}
                  disabled={isLoading}
                />
              </div>

              {isCreatePanelOpen ? productCreateForm : null}

              <div className="record-list modal-scroll-list">
                {products.length === 0 ? (
                  <p className="empty-state">Nenhum produto cadastrado.</p>
                ) : (
                  products.map((product) => (
                    <article className="record-row" key={product.id}>
                      <div>
                        <strong>{product.name}</strong>
                        <small>{product.sku} · {getStockLabel(product)}</small>
                      </div>
                      <div className="record-aside">
                        <strong>{formatMoney(product.priceInCents)}</strong>
                        <small>{product.active ? "Ativo" : "Inativo"}</small>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </ModalShell>
        );

      case "clientes":
        return (
          <ModalShell
            title="Clientes"
            subtitle="Cadastro de consumidores e apoio a fidelizacao, entrega e fiado."
            onClose={closeModal}
            onBack={handleBack}
            backLabel={backLabel}
          >
            <section className="modal-section">
              <div className="section-heading">
                <div>
                  <h3>Base de clientes</h3>
                  <p>Pesquise, confira dados e cadastre novos consumidores.</p>
                </div>
                {renderCreateToggle()}
              </div>

              {isCreatePanelOpen ? customerCreateForm : null}

              <label className="search-field">
                Buscar cliente
                <input
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Nome, CPF, telefone ou e-mail"
                />
              </label>

              <div className="record-list">
                {filteredCustomers.length === 0 ? (
                  <p className="empty-state">Nenhum cliente encontrado.</p>
                ) : (
                  filteredCustomers.map((customer) => (
                    <article className="record-row" key={customer.id}>
                      <div>
                        <strong>{customer.name}</strong>
                        <small>
                          {customer.cpf ? formatCpfInput(customer.cpf) : "Sem CPF"} ·{" "}
                          {customer.phone ? formatPhoneInput(customer.phone) : "Sem telefone"} ·{" "}
                          {customer.email ?? "Sem e-mail"}
                        </small>
                      </div>
                      <div className="record-aside">
                        <strong>{customer.loyaltyCode ?? "-"}</strong>
                        <small>{customer.address ?? "Sem endereco"}</small>
                      </div>
                    </article>
                  ))
                )}
              </div>

              

            </section>
          </ModalShell>
        );

      case "fornecedores":
        return (
          <ModalShell
            title="Fornecedores"
            subtitle="Parceiros homologados e cadastro de abastecimento da operacao."
            onClose={closeModal}
            onBack={handleBack}
            backLabel={backLabel}
          >
            <section className="modal-section">
              <div className="section-heading">
                <div>
                  <h3>Fornecedores cadastrados</h3>
                  <p>Lista local de parceiros de compra enquanto o modulo nao possui API dedicada.</p>
                </div>
                {renderCreateToggle()}
              </div>

              {isCreatePanelOpen ? (
                <form className="modal-form-grid" onSubmit={handleCreateSupplier}>
                  <div className="form-columns two-columns-form">
                    <label>
                      Nome fantasia
                      <input
                        required
                        value={newSupplier.name}
                        onChange={(event) =>
                          setNewSupplier({ ...newSupplier, name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      CPF ou CNPJ
                      <input
                        inputMode="numeric"
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        required
                        value={newSupplier.document}
                        onChange={(event) =>
                          setNewSupplier({
                            ...newSupplier,
                            document: formatCpfOrCnpjInput(event.target.value),
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="form-columns three-columns-form">
                    <label>
                      Segmento
                      <input
                        required
                        value={newSupplier.category}
                        onChange={(event) =>
                          setNewSupplier({ ...newSupplier, category: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Telefone
                      <input
                        inputMode="tel"
                        placeholder="(00) 00000-0000"
                        value={newSupplier.phone}
                        onChange={(event) =>
                          setNewSupplier({
                            ...newSupplier,
                            phone: formatPhoneInput(event.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Status
                      <select
                        value={newSupplier.status}
                        onChange={(event) =>
                          setNewSupplier({ ...newSupplier, status: event.target.value })
                        }
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Homologado">Homologado</option>
                        <option value="Pendente">Pendente</option>
                      </select>
                    </label>
                  </div>

                  <div className="form-actions inline-actions">
                    <button className="primary-button" type="submit">
                      Salvar fornecedor
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="record-list">
                {suppliers.map((supplier) => (
                  <article className="record-row" key={supplier.id}>
                    <div>
                      <strong>{supplier.name}</strong>
                      <small>
                        {formatCpfOrCnpjInput(supplier.document)} · {supplier.category}
                      </small>
                    </div>
                    <div className="record-aside">
                      <span className="tag">{supplier.status}</span>
                      <small>{supplier.phone ? formatPhoneInput(supplier.phone) : "Sem telefone"}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </ModalShell>
        );

      case "a-receber":
        return (
          <ModalShell
            title="A receber"
            subtitle="Titulos e compromissos financeiros a receber do estabelecimento."
            onClose={closeModal}
            onBack={handleBack}
            backLabel={backLabel}
          >
            <section className="modal-section">
              <div className="section-heading">
                <div>
                  <h3>Titulos cadastrados</h3>
                  <p>Controle local de contas a receber ate a chegada do backend dedicado.</p>
                </div>
                {renderCreateToggle()}
              </div>

              {isCreatePanelOpen ? (
                <form className="modal-form-grid" onSubmit={handleCreateReceivable}>
                  <div className="form-columns two-columns-form">
                    <label>
                      Cliente
                      <input
                        required
                        value={newReceivable.customer}
                        onChange={(event) =>
                          setNewReceivable({ ...newReceivable, customer: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Vencimento
                      <input
                        required
                        type="date"
                        value={newReceivable.dueDate}
                        onChange={(event) =>
                          setNewReceivable({ ...newReceivable, dueDate: event.target.value })
                        }
                      />
                    </label>
                  </div>

                  <div className="form-columns two-columns-form">
                    <label>
                      Valor
                      <input
                        inputMode="numeric"
                        placeholder="0,00"
                        required
                        value={newReceivable.amount}
                        onChange={(event) =>
                          setNewReceivable({
                            ...newReceivable,
                            amount: formatMoneyInput(event.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Status
                      <select
                        value={newReceivable.status}
                        onChange={(event) =>
                          setNewReceivable({ ...newReceivable, status: event.target.value })
                        }
                      >
                        <option value="Aberto">Aberto</option>
                        <option value="Em cobranca">Em cobranca</option>
                        <option value="Recebido">Recebido</option>
                      </select>
                    </label>
                  </div>

                  <div className="form-actions inline-actions">
                    <button className="primary-button" type="submit">
                      Salvar titulo
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="record-list">
                {receivables.map((item) => (
                  <article className="record-row" key={item.id}>
                    <div>
                      <strong>{item.customer}</strong>
                      <small>Vencimento em {formatDate(item.dueDate)}</small>
                    </div>
                    <div className="record-aside">
                      <strong>{formatMoney(item.amountInCents)}</strong>
                      <small>{item.status}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </ModalShell>
        );

      case "a-pagar":
        return (
          <ModalShell
            title="A pagar"
            subtitle="Compromissos financeiros e despesas programadas da operacao."
            onClose={closeModal}
            onBack={handleBack}
            backLabel={backLabel}
          >
            <section className="modal-section">
              <div className="section-heading">
                <div>
                  <h3>Titulos a pagar</h3>
                  <p>Controle local de despesas e vencimentos da loja.</p>
                </div>
                {renderCreateToggle()}
              </div>

              {isCreatePanelOpen ? (
                <form className="modal-form-grid" onSubmit={handleCreatePayable}>
                  <div className="form-columns two-columns-form">
                    <label>
                      Descricao
                      <input
                        required
                        value={newPayable.description}
                        onChange={(event) =>
                          setNewPayable({ ...newPayable, description: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Fornecedor
                      <input
                        required
                        value={newPayable.supplier}
                        onChange={(event) =>
                          setNewPayable({ ...newPayable, supplier: event.target.value })
                        }
                      />
                    </label>
                  </div>

                  <div className="form-columns three-columns-form">
                    <label>
                      Vencimento
                      <input
                        required
                        type="date"
                        value={newPayable.dueDate}
                        onChange={(event) =>
                          setNewPayable({ ...newPayable, dueDate: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Valor
                      <input
                        inputMode="numeric"
                        placeholder="0,00"
                        required
                        value={newPayable.amount}
                        onChange={(event) =>
                          setNewPayable({
                            ...newPayable,
                            amount: formatMoneyInput(event.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Status
                      <select
                        value={newPayable.status}
                        onChange={(event) =>
                          setNewPayable({ ...newPayable, status: event.target.value })
                        }
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Agendado">Agendado</option>
                        <option value="Pago">Pago</option>
                      </select>
                    </label>
                  </div>

                  <div className="form-actions inline-actions">
                    <button className="primary-button" type="submit">
                      Salvar titulo
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="record-list">
                {payables.map((item) => (
                  <article className="record-row" key={item.id}>
                    <div>
                      <strong>{item.description}</strong>
                      <small>
                        {item.supplier} · vencimento em {formatDate(item.dueDate)}
                      </small>
                    </div>
                    <div className="record-aside">
                      <strong>{formatMoney(item.amountInCents)}</strong>
                      <small>{item.status}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </ModalShell>
        );

      case "estoque":
        return (
          <ModalShell
            title="Estoque"
            subtitle="Consulta de saldo e alerta dos produtos cadastrados no PDV."
            onClose={closeModal}
            onBack={handleBack}
            backLabel={backLabel}
          >
            <section className="modal-section">
              <div className="metric-grid three-up">
                <MetricTile
                  label="Produtos monitorados"
                  value={formatNumber(products.filter((product) => product.active).length)}
                  note="Itens ativos no catalogo"
                />
                <MetricTile
                  label="Estoque baixo"
                  value={formatNumber(lowStockProducts.length)}
                  note="Produtos que pedem reposicao"
                  tone="accent"
                />
                <MetricTile
                  label="Sem estoque"
                  value={formatNumber(products.filter((product) => product.stockStatus === "OUT_OF_STOCK").length)}
                  note="Itens indisponiveis para venda"
                />
              </div>
            </section>

            <section className="modal-section">
              <div className="section-heading">
                <div>
                  <h3>Controle de estoque</h3>
                  <p>Lista de produtos, saldo atual e minimo de seguranca.</p>
                </div>
                {renderCreateToggle()}
              </div>

              {isCreatePanelOpen ? productCreateForm : null}

              <div className="record-list">
                {products.length === 0 ? (
                  <p className="empty-state">Nenhum produto disponivel para controle.</p>
                ) : (
                  products.map((product) => (
                    <article className="record-row" key={product.id}>
                      <div>
                        <strong>{product.name}</strong>
                        <small>
                          Estoque{" "}
                          <input
                            className="stock-inline-input"
                            key={`${product.id}-${product.updatedAt}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="any"
                            defaultValue={formatStockInputValue(product.stockQuantity)}
                            disabled={isLoading}
                            aria-label={`Estoque atual de ${product.name}`}
                            onBlur={(event) => void handleProductStockInputCommit(product, event.currentTarget)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                event.currentTarget.blur();
                              }
                            }}
                          />{" "}
                          · minimo {formatNumber(product.minimumStock)} · {product.unit}
                        </small>
                      </div>
                      <div className="record-aside">
                        <span className={`tag ${getStockTone(product)}`}>{getStockLabel(product)}</span>
                        <small>SKU {product.sku}</small>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </ModalShell>
        );

      case "relatorios":
        return (
          <ModalShell
            title="Relatorios"
            subtitle="Modelos locais e visoes financeiras conectadas ao PDV."
            onClose={closeModal}
            onBack={handleBack}
            backLabel={backLabel}
          >
            <section className="modal-section two-column-modal-grid">
              <div className="panel-card">
                <div className="section-heading compact-heading">
                  <div>
                    <h3>Modelos cadastrados</h3>
                    <p>Relatorios favoritos para consulta da equipe.</p>
                  </div>
                  {renderCreateToggle()}
                </div>

                {isCreatePanelOpen ? (
                  <form className="modal-form-grid" onSubmit={handleCreateReportTemplate}>
                    <div className="form-columns two-columns-form">
                      <label>
                        Nome do relatorio
                        <input
                          required
                          value={newReportTemplate.name}
                          onChange={(event) =>
                            setNewReportTemplate({ ...newReportTemplate, name: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Periodicidade
                        <select
                          value={newReportTemplate.period}
                          onChange={(event) =>
                            setNewReportTemplate({ ...newReportTemplate, period: event.target.value })
                          }
                        >
                          <option value="Diario">Diario</option>
                          <option value="Semanal">Semanal</option>
                          <option value="Mensal">Mensal</option>
                        </select>
                      </label>
                    </div>

                    <label>
                      Destino
                      <input
                        required
                        value={newReportTemplate.target}
                        onChange={(event) =>
                          setNewReportTemplate({ ...newReportTemplate, target: event.target.value })
                        }
                      />
                    </label>

                    <div className="form-actions inline-actions">
                      <button className="primary-button" type="submit">
                        Salvar relatorio
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="record-list">
                  {reportTemplates.map((item) => (
                    <article className="record-row" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <small>{item.period}</small>
                      </div>
                      <div className="record-aside">
                        <small>{item.target}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="panel-card">
                <div className="section-heading compact-heading no-action">
                  <div>
                    <h3>Resumo financeiro</h3>
                    <p>Indicadores puxados do relatorio financeiro real.</p>
                  </div>
                </div>

                <div className="record-list">
                  <article className="record-row">
                    <div>
                      <strong>Venda liquida do periodo</strong>
                      <small>{reportPeriodLabel}</small>
                    </div>
                    <div className="record-aside">
                      <strong>{formatMoney(financialReport?.netSalesInCents ?? 0)}</strong>
                    </div>
                  </article>
                  <article className="record-row">
                    <div>
                      <strong>Lucro estimado</strong>
                      <small>Receita liquida menos custo estimado</small>
                    </div>
                    <div className="record-aside">
                      <strong>{formatMoney(financialReport?.profitInCents ?? 0)}</strong>
                    </div>
                  </article>
                  <article className="record-row">
                    <div>
                      <strong>Ticket medio</strong>
                      <small>Media de venda no intervalo</small>
                    </div>
                    <div className="record-aside">
                      <strong>{formatMoney(financialReport?.averageTicketInCents ?? 0)}</strong>
                    </div>
                  </article>
                </div>
              </div>
            </section>
          </ModalShell>
        );

      case "balanca":
        return (
          <ModalShell
            title="Balanca"
            subtitle="Cadastro local dos equipamentos de pesagem usados no mercado."
            onClose={closeModal}
            onBack={handleBack}
            backLabel={backLabel}
          >
            <section className="modal-section">
              <div className="section-heading">
                <div>
                  <h3>Balancas cadastradas</h3>
                  <p>Configure modelo, porta e disponibilidade para a operacao.</p>
                </div>
                {renderCreateToggle()}
              </div>

              {isCreatePanelOpen ? (
                <form className="modal-form-grid" onSubmit={handleCreateScaleSetting}>
                  <div className="form-columns three-columns-form">
                    <label>
                      Nome
                      <input
                        required
                        value={newScaleSetting.name}
                        onChange={(event) =>
                          setNewScaleSetting({ ...newScaleSetting, name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Modelo
                      <input
                        required
                        value={newScaleSetting.model}
                        onChange={(event) =>
                          setNewScaleSetting({ ...newScaleSetting, model: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Porta
                      <input
                        required
                        value={newScaleSetting.port}
                        onChange={(event) =>
                          setNewScaleSetting({ ...newScaleSetting, port: event.target.value })
                        }
                      />
                    </label>
                  </div>

                  <label>
                    Status
                    <select
                      value={newScaleSetting.status}
                      onChange={(event) =>
                        setNewScaleSetting({ ...newScaleSetting, status: event.target.value })
                      }
                    >
                      <option value="Pronta">Pronta</option>
                      <option value="Em teste">Em teste</option>
                      <option value="Inativa">Inativa</option>
                    </select>
                  </label>

                  <div className="form-actions inline-actions">
                    <button className="primary-button" type="submit">
                      Salvar balanca
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="record-list">
                {scaleSettings.map((item) => (
                  <article className="record-row" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        {item.model} · {item.port}
                      </small>
                    </div>
                    <div className="record-aside">
                      <span className="tag">{item.status}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </ModalShell>
        );

      case "impressora":
        return (
          <ModalShell
            title="Impressora"
            subtitle="Cadastro local das impressoras de cupom e filas de impressao."
            onClose={closeModal}
            onBack={handleBack}
            backLabel={backLabel}
          >
            <section className="modal-section">
              <div className="section-heading">
                <div>
                  <h3>Impressoras cadastradas</h3>
                  <p>Defina fila, modelo e situacao operacional do equipamento.</p>
                </div>
                {renderCreateToggle()}
              </div>

              {isCreatePanelOpen ? (
                <form className="modal-form-grid" onSubmit={handleCreatePrinterSetting}>
                  <div className="form-columns three-columns-form">
                    <label>
                      Nome
                      <input
                        required
                        value={newPrinterSetting.name}
                        onChange={(event) =>
                          setNewPrinterSetting({ ...newPrinterSetting, name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Modelo
                      <input
                        required
                        value={newPrinterSetting.model}
                        onChange={(event) =>
                          setNewPrinterSetting({ ...newPrinterSetting, model: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Fila
                      <input
                        required
                        value={newPrinterSetting.queue}
                        onChange={(event) =>
                          setNewPrinterSetting({ ...newPrinterSetting, queue: event.target.value })
                        }
                      />
                    </label>
                  </div>

                  <label>
                    Status
                    <select
                      value={newPrinterSetting.status}
                      onChange={(event) =>
                        setNewPrinterSetting({ ...newPrinterSetting, status: event.target.value })
                      }
                    >
                      <option value="Online">Online</option>
                      <option value="Em manutencao">Em manutencao</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </label>

                  <div className="form-actions inline-actions">
                    <button className="primary-button" type="submit">
                      Salvar impressora
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="record-list">
                {printerSettings.map((item) => (
                  <article className="record-row" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        {item.model} · fila {item.queue}
                      </small>
                    </div>
                    <div className="record-aside">
                      <span className="tag">{item.status}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </ModalShell>
        );

      case "notas-fiscais":
        return (
          <ModalShell
            title="Notas fiscais"
            subtitle="Perfis de emissao fiscal configurados para o estabelecimento."
            onClose={closeModal}
            onBack={handleBack}
            backLabel={backLabel}
          >
            <section className="modal-section">
              <div className="section-heading">
                <div>
                  <h3>Perfis fiscais</h3>
                  <p>Cadastre serie, ambiente e situacao das configuracoes fiscais.</p>
                </div>
                {renderCreateToggle()}
              </div>

              {isCreatePanelOpen ? (
                <form className="modal-form-grid" onSubmit={handleCreateFiscalProfile}>
                  <div className="form-columns three-columns-form">
                    <label>
                      Nome do perfil
                      <input
                        required
                        value={newFiscalProfile.name}
                        onChange={(event) =>
                          setNewFiscalProfile({ ...newFiscalProfile, name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Serie
                      <input
                        required
                        value={newFiscalProfile.series}
                        onChange={(event) =>
                          setNewFiscalProfile({ ...newFiscalProfile, series: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Ambiente
                      <select
                        value={newFiscalProfile.environment}
                        onChange={(event) =>
                          setNewFiscalProfile({ ...newFiscalProfile, environment: event.target.value })
                        }
                      >
                        <option value="Producao">Producao</option>
                        <option value="Homologacao">Homologacao</option>
                      </select>
                    </label>
                  </div>

                  <label>
                    Status
                    <select
                      value={newFiscalProfile.status}
                      onChange={(event) =>
                        setNewFiscalProfile({ ...newFiscalProfile, status: event.target.value })
                      }
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Em teste">Em teste</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </label>

                  <div className="form-actions inline-actions">
                    <button className="primary-button" type="submit">
                      Salvar perfil fiscal
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="record-list">
                {fiscalProfiles.map((item) => (
                  <article className="record-row" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        Serie {item.series} · {item.environment}
                      </small>
                    </div>
                    <div className="record-aside">
                      <span className="tag">{item.status}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </ModalShell>
        );

      default:
        return null;
    }
  };

  const renderCashLockScreen = () => {
    if (!isCashLockScreenVisible) {
      return null;
    }

    const activeCashSession = cashSession;
    const hasOpenCashSession = Boolean(activeCashSession);

    return (
      <div className="cash-lock-overlay" role="presentation">
        <div
          className="modal-window cash-opening-modal cash-lock-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cash-opening-title"
          aria-describedby="cash-opening-description"
        >
          <header className="modal-header cash-opening-modal-header">
            <div>
              <p className="eyebrow">
                {hasOpenCashSession ? "Conferencia obrigatoria" : "Abertura obrigatoria"}
              </p><br/>
              {suggestedOpeningAmountInCents > 0 ? (
                <p>
                  Ultimo fechamento registrado: {formatMoney(suggestedOpeningAmountInCents)}.
                </p>
              ) : null}
            </div>
          </header>

          <div className="modal-body">
            <form className="modal-form-grid" onSubmit={(event) => void handleOpenCashSession(event)}>
              {hasOpenCashSession ? (
                <div className="cash-lock-message">
                  <strong>Caixa atualmente aberto</strong>
                  <p>
                    Valor anterior de abertura registrado:{" "}
                    {formatMoney(activeCashSession?.openingAmountInCents ?? 0)}
                  </p>
                </div>
              ) : null}

              <label>
                Valor de entrada do caixa
                <input
                  autoFocus
                  inputMode="numeric"
                  placeholder="Ex.: 150,00"
                  required
                  value={openingAmount}
                  onChange={(event) => setOpeningAmount(formatMoneyInput(event.target.value))}
                  disabled={isLoading}
                />
              </label>

              <div className="form-actions inline-actions">
                <button className="primary-button block-button" type="submit" disabled={isLoading}>
                  {hasOpenCashSession ? "Salvar e continuar" : "Confirmar abertura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const operatorDisplayName = operatorProfile?.name.trim() || email;
  const _operatorNameWords = operatorDisplayName.trim().split(/\s+/);
  const _w0 = _operatorNameWords[0] ?? "";
  const _w1 = _operatorNameWords[1] ?? "";
  const sessionInitials = (_operatorNameWords.length >= 2
    ? _w0.charAt(0) + _w1.charAt(0)
    : _w0.slice(0, 2)
  ).toUpperCase();
  const operatorDisplayRole = operatorProfile?.role ?? "Operador";

  const toggleDashboardVisibility = (key: keyof DashboardVisibilitySettings) => {
    setDashboardVisibility((currentVisibility) => ({
      ...currentVisibility,
      [key]: !currentVisibility[key],
    }));
  };

  if (isBootstrappingSession) {
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

  if (!isAuthenticated) {
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
            Interface de <strong>PDV</strong> com arquitetura <strong>Multitenant</strong>, visual profissional para operacao <strong>Face-to-Face</strong>, focada em
            venda rapida, menu gerencial, até <strong>cinco níveis de categorias</strong> por setor e <strong>acompanhamento da loja</strong> do seu estabelecimento.
          </p>
          
          <div className="presentation-highlights">
            <span className="info-badge">
              <ShoppingBasket aria-hidden="true" />
              Caixa rapido
            </span>
            <span className="info-badge">
              <MonitorCog aria-hidden="true" />
              Menu gerencial
            </span>
            <span className="info-badge">
              <CreditCard aria-hidden="true" />
              Relatorios e pagamentos
            </span>
          </div>

          <div className="login-visual-container">
            <svg className="creative-login-svg" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Background abstract shapes */}
              <circle className="bg-blob-1" cx="300" cy="100" r="80" fill="var(--accent)" opacity="0.05" />
              <circle className="bg-blob-2" cx="100" cy="200" r="60" fill="var(--accent)" opacity="0.03" />
              
              {/* The PDV Tablet/Monitor */}
              <g className="pdv-device">
                <rect x="80" y="60" width="240" height="160" rx="12" fill="var(--surface-soft)" stroke="var(--accent)" strokeWidth="2" />
                <rect x="95" y="75" width="210" height="120" rx="4" fill="var(--background)" />
                <rect x="180" y="220" width="40" height="40" fill="var(--surface-soft)" stroke="var(--accent)" strokeWidth="2" />
                <rect x="150" y="250" width="100" height="8" rx="4" fill="var(--accent)" opacity="0.4" />
                
                {/* Simulated UI items on screen */}
                <g className="ui-elements">
                  <rect x="110" y="90" width="80" height="10" rx="2" fill="var(--accent)" opacity="0.6" />
                  <rect x="110" y="110" width="50" height="10" rx="2" fill="var(--accent)" opacity="0.3" />
                  <rect x="230" y="90" width="60" height="60" rx="8" fill="var(--accent)" opacity="0.15" />
                  <circle className="ui-check" cx="260" cy="120" r="15" fill="var(--success)" opacity="0.8" />
                  <path d="M252 120L258 126L268 114" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </g>

              {/* The Delivery Motion Element */}
              <g className="delivery-motion">
                <path className="motion-line-1" d="M340 120H380" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
                <path className="motion-line-2" d="M350 145H390" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" opacity="0.2" />
                <path className="motion-line-3" d="M335 170H375" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
                
                {/* Delivery Scooter (Lambreta) */}
                <g className="floating-package">
                  {/* Wheels */}
                  <circle cx="330" cy="165" r="7" fill="var(--background)" stroke="var(--accent)" strokeWidth="2" />
                  <circle cx="360" cy="165" r="7" fill="var(--background)" stroke="var(--accent)" strokeWidth="2" />
                  {/* Body */}
                  <path d="M322 162C322 150 335 145 350 145H372L365 162H322Z" fill="var(--accent)" />
                  {/* Seat */}
                  <path d="M335 145H355C355 145 355 138 345 138C335 138 335 145 335 145Z" fill="var(--background)" opacity="0.5" />
                  {/* Front/Handlebars */}
                  <path d="M368 162L378 135H368" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
                  {/* Delivery Box */}
                  <rect x="320" y="128" width="22" height="22" rx="4" fill="var(--accent)" stroke="var(--background)" strokeWidth="1.5" />
                  <path d="M326 139H336" stroke="var(--background)" strokeWidth="2" opacity="0.4" />
                </g>
              </g>

              {/* The "Face" / Friendly Interaction Element */}
              <g className="face-interaction">
                <circle className="user-face" cx="60" cy="120" r="30" fill="var(--accent)" opacity="0.1" stroke="var(--accent)" strokeWidth="2" />
                <path className="smile" d="M50 125C50 125 55 132 60 132C65 132 70 125 70 125" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="52" cy="115" r="2" fill="var(--accent)" />
                <circle cx="68" cy="115" r="2" fill="var(--accent)" />
              </g>

              {/* Connection Dots */}
              <circle className="dot-1" cx="100" cy="120" r="3" fill="var(--accent)" />
              <circle className="dot-2" cx="300" cy="150" r="3" fill="var(--accent)" />
            </svg>
          </div>
        </section>

        <section className="login-panel">
          <div>
            <p className="eyebrow">Acesso restrito</p>
            <h2>Entrar no sistema</h2>
            <p>Use um operador ja cadastrado para acessar o PDV.</p>
          </div>

          <form className="login-form" onSubmit={(event) => void handleLogin(event)}>
            <label>
              E-mail
              <input
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label>
              Senha
              <input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar no PDV"}
            </button>
          </form>

          <div className="login-help">
            <span>{message}</span>            
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pdv-shell">
      {toastMessage ? (
        <div className="app-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}

      <header className="pdv-topbar">
        <div className="topbar-brand">
          <BrandLogo className="topbar-logo" color="#ffffff" />
          <div>
            <p className="eyebrow">Multitenant · Face Delivery</p>
            <h1>Face Delivery</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <span className={`status-pill ${cashSession ? "success" : "danger"}`}>
            {cashSession ? "Caixa aberto" : "Caixa bloqueado"}
          </span>
          <button
            className="theme-toggle"
            type="button"
            onClick={() =>
              setThemeMode((currentTheme) =>
                currentTheme === "dark" ? "light" : "dark",
              )
            }
            aria-label={`Ativar modo ${themeMode === "dark" ? "claro" : "escuro"}`}
            title={`Ativar modo ${themeMode === "dark" ? "claro" : "escuro"}`}
          >
            <span
              className={`theme-toggle-icon ${themeMode === "dark" ? "sun" : "moon"}`}
              aria-hidden="true"
            >
              {themeMode === "dark" ? <SunMedium /> : <MoonStar />}
            </span>
          </button>
          <details className="operator-menu" ref={operatorMenuRef}>
            <summary className="operator-menu-trigger">
              <span className="operator-menu-avatar" aria-hidden="true">{sessionInitials}</span>
              <span className="operator-menu-copy">
                <small>{operatorDisplayRole}</small>
                <strong>{operatorDisplayName}</strong>
              </span>
              <span className="operator-menu-chevron" aria-hidden="true">
                <ChevronDown />
              </span>
            </summary>

            <div className="operator-menu-dropdown">
              <Link className="operator-menu-item" href="/perfil" onClick={closeOperatorMenu}>
                Perfil
              </Link>
              {isSystemAdministrator ? (
                <Link className="operator-menu-item" href="/administracao" onClick={closeOperatorMenu}>
                  Administracao
                </Link>
              ) : null}
              <button
                className="operator-menu-item"
                type="button"
                onClick={() => void handleRefreshDashboardFromMenu()}
                disabled={isLoading}
              >
                Atualizar
              </button>
              <button
                className="operator-menu-item danger"
                type="button"
                onClick={() => void handleLogoutFromMenu()}
                disabled={isLoading}
              >
                Sair
              </button>
            </div>
          </details>
        </div>
      </header>

      <div className="pdv-status-strip">
        <span><strong>Status:</strong> {message}</span>
        <span><strong>Cliente:</strong> {selectedCustomer?.name ?? "Consumidor final"}</span>
        <span><strong>Caixa:</strong> {cashSession ? "Aberto" : "Bloqueado"}</span>
      </div>

      <section className="pdv-layout">
        <section className="catalog-panel">

          <CollapsibleDashboardSection
            className="catalog-heading"
            collapsedLabel="Cabecalho do catalogo"
            isCollapsed={dashboardVisibility.hideCatalogHeading}
            onToggle={() => toggleDashboardVisibility("hideCatalogHeading")}
          >
            <div className="catalog-heading-title">
              <h2>Catálogo</h2>
              <p className="pdv-catalog-subtitle">Toque em um produto para adicionar ao carrinho.</p>
            </div>

            <div className="minimum-stock-panel">
              <div className="minimum-stock-list" aria-label="Produtos com estoque minimo ou zerado">
                {lowStockProducts.length === 0 ? (
                  <span className="minimum-stock-empty">Nenhum produto em alerta de estoque.</span>
                ) : (
                  lowStockProducts.map((product, index) => (
                    <article className="minimum-stock-row" key={product.id}>
                      <strong>
                        {index + 1} - {product.name}
                      </strong>
                      <span>QTD. {formatCartQuantity(product, product.stockQuantity)}</span>
                    </article>
                  ))
                )}
              </div>
            </div>

            <MetricTile
              label="Produtos visiveis"
              value={formatNumber(visibleProducts.length)}
              note="Resultado da categoria e busca"
              tone="accent"
            />
            <MetricTile
              label="Total do carrinho"
              value={formatMoney(totalInCents)}
              note={`${formatNumber(cartItems.length)} item(ns)`}
              tone="success"
            />
          </CollapsibleDashboardSection>

          <div className="catalog-gap-heading-categories">
            <CollapsibleDashboardSection
              className="category-toolbar"
              collapsedLabel="Categorias"
              isCollapsed={dashboardVisibility.hideCategoryToolbar}
              onToggle={() => toggleDashboardVisibility("hideCategoryToolbar")}
            >
              <>
                {CATEGORY_SHORTCUTS.map((shortcut) => (
                  <button
                    key={shortcut.id}
                    className={`category-chip ${selectedShortcut === shortcut.id ? "active" : ""}`}
                    type="button"
                    onClick={() => setSelectedShortcut(shortcut.id)}
                  >
                    <strong className="category-chip-label">
                      <CategoryShortcutIcon shortcutId={shortcut.id} />
                      <span>{shortcut.label}</span>
                    </strong>
                    <small>
                      {shortcut.id === "TODOS"
                        ? formatNumber(products.filter((product) => product.active).length)
                        : formatNumber(products.filter((product) => product.active && matchesShortcut(product, shortcut.id)).length)}
                    </small>
                  </button>
                ))}

                <button
                  className={`menu-shortcut ${hasManagerAccess ? "" : "is-locked"}`.trim()}
                  type="button"
                  onClick={() => openModal("manager-menu")}
                  title={
                    hasManagerAccess
                      ? "Abrir cadastros e configuracoes"
                      : "Acesso liberado apenas para administrador e gerente"
                  }
                >
                  <strong className="menu-shortcut-label">
                    <MenuShortcutIcon />
                    <span>{hasManagerAccess ? "Menu" : "Acesso gerencial bloqueado"}</span>
                  </strong>
                  <small className={hasManagerAccess ? "menu-shortcut-subtitle" : undefined}>
                    {hasManagerAccess
                      ? "Admin"
                      : "Disponivel apenas para administrador e gerente"}
                  </small>
                </button>
              </>
            </CollapsibleDashboardSection>
          </div>

          <div className="catalog-gap-categories-search">
            {dashboardVisibility.hideCatalogSearchField ? (
              <div className="dashboard-collapsed-block">
                <button
                  className="dashboard-collapse-toggle is-inline"
                  type="button"
                  onClick={() => toggleDashboardVisibility("hideCatalogSearchField")}
                  aria-expanded="false"
                  aria-label="Busca de produtos"
                  title="Busca de produtos"
                >
                  <ChevronDown className="dashboard-collapse-icon" aria-hidden="true" />
                </button>
                <span className="dashboard-collapsed-label">Busca de produtos</span>
              </div>
            ) : (
              <div className="dashboard-collapsible-inline">
                <button
                  className="dashboard-collapse-toggle is-inline"
                  type="button"
                  onClick={() => toggleDashboardVisibility("hideCatalogSearchField")}
                  aria-expanded="true"
                  aria-label="Busca de produtos"
                  title="Busca de produtos"
                >
                  <ChevronDown className="dashboard-collapse-icon is-open" aria-hidden="true" />
                </button>
                <div className="search-field catalog-search-field dashboard-collapsible-block">

                    <input
                      value={productSearch}
                      onChange={(event) => startTransition(() => setProductSearch(event.target.value))}
                      placeholder="⌕ Busque por Nome, SKU ou código de barras"
                    />

                </div>
              </div>
            )}
          </div>

          <div className="product-grid catalog-gap-search-products">
            {visibleProducts.length === 0 ? (
              <div className="empty-panel">
                <strong>Nenhum produto encontrado.</strong>
                <span>Revise a busca ou troque a categoria selecionada.</span>
              </div>
            ) : (
              visibleProducts.map((product) => {
                const stockTone = getStockTone(product);
                const stockQty = `${formatNumber(product.stockQuantity)} ${product.unit === "KG" ? "kg" : "un"}`;
                const stockBadgeText =
                  product.stockStatus === "OUT_OF_STOCK"
                    ? "Esgotado"
                    : product.stockStatus === "LOW_STOCK"
                    ? "Baixo"
                    : "Disponível";
                return (
                  <button
                    className="pdv-product"
                    type="button"
                    key={product.id}
                    onClick={() => addProductToCart(product)}
                    disabled={isLoading || isCashOperationLocked}
                  >
                    <div className="pdv-product__media">
                      <img
                        src={product.imageUrl ?? PRODUCT_WITHOUT_IMAGE_URL}
                        alt={`Imagem ${product.name}`}
                      />
                    </div>
                    <div className="pdv-product__name">{product.name}</div>
                    <div className={`pdv-product__stock pdv-product__stock--${stockTone}`}>
                      ⊙ {stockQty} em estoque
                    </div>
                    <div className="pdv-product__foot">
                      <span className="pdv-product__price">{formatMoney(product.priceInCents)}</span>
                      <span className={`pdv-badge pdv-badge--${stockTone}`}>
                        <span className="pdv-badge__dot" />
                        {stockBadgeText}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <aside className="checkout-panel">
          <div className="checkout-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              <h2 style={{ margin: 0 }}>Carrinho</h2>
              <span className="tag">{formatNumber(cartItems.length)} item(ns)</span>
            </div>
            <strong className="checkout-total">{formatMoney(totalInCents)}</strong>
          </div>

          <CollapsibleDashboardSection
            className="cash-open-card compact-card summary-sale-card"
            collapsedLabel="Resumo da venda"
            isCollapsed={dashboardVisibility.hideSummaryRowGrid}
            onToggle={() => toggleDashboardVisibility("hideSummaryRowGrid")}
          >
            <>
              <div>
                <h3>Resumo da venda</h3>
                <p>Subtotal e troco calculados para a venda atual.</p>
              </div>
              <div className="summary-row-grid">
                <MetricTile
                  label="Subtotal"
                  value={formatMoney(subtotalInCents)}
                  note="Antes do desconto"
                />
                <MetricTile
                  label="Troco"
                  value={formatMoney(changeInCents)}
                  note="Calculado automaticamente"
                  tone="success"
                />
              </div>
            </>
          </CollapsibleDashboardSection>

          {cashSession ? (
            <CollapsibleDashboardSection
              className="cash-open-card compact-card"
              collapsedLabel="Caixa aberto"
              isCollapsed={dashboardVisibility.hideCashOpenCard}
              onToggle={() => toggleDashboardVisibility("hideCashOpenCard")}
            >
              <>
                <div>
                  <h3>Caixa aberto</h3>
                  <p>Abertura registrada em {formatDateTime(cashSession.openedAt)}.</p>
                </div>

                <small>Total de entrada no caixa: {formatMoney(cashOperationalTotalInCents)}</small>
              </>
            </CollapsibleDashboardSection>
          ) : (
            <CollapsibleDashboardSection
              className="cash-open-card"
              collapsedLabel="Caixa bloqueado"
              isCollapsed={dashboardVisibility.hideCashOpenCard}
              onToggle={() => toggleDashboardVisibility("hideCashOpenCard")}
            >
              <>
                <h3>Caixa bloqueado</h3>
                <p>Informe o valor de entrada do caixa no modal exibido ao entrar no sistema.</p>
              </>
            </CollapsibleDashboardSection>
          )}

          {cashSession ? (
            <CollapsibleDashboardSection
              as="section"
              className="side-card"
              collapsedLabel="Sangria do caixa"
              isCollapsed={dashboardVisibility.hideCashWithdrawalCard}
              onToggle={() => toggleDashboardVisibility("hideCashWithdrawalCard")}
            >
              <div className="side-card-header">
                <h3>Sangria do caixa</h3>
              </div>

              <form className="modal-form-grid" onSubmit={(event) => void handleRegisterCashWithdrawal(event)}>
                <div className="form-columns two-columns-form">
                  <label>
                    Valor da sangria
                    <input
                      inputMode="numeric"
                      placeholder="0,00"
                      value={cashWithdrawalAmount}
                      onChange={(event) => setCashWithdrawalAmount(formatMoneyInput(event.target.value))}
                      disabled={isLoading || isCashOperationLocked}
                    />
                  </label>

                  <label>
                    Motivo
                    <input
                      value={cashWithdrawalNote}
                      onChange={(event) => setCashWithdrawalNote(event.target.value)}
                      placeholder="Ex.: retirada para troco externo"
                      maxLength={300}
                      disabled={isLoading || isCashOperationLocked}
                    />
                  </label>
                </div>

                <div className="form-actions">
                  <small>O saldo projetado do caixa sera abatido automaticamente apos a sangria.</small>
                  <button className="secondary-button" type="submit" disabled={isLoading || isCashOperationLocked}>
                    Sangria
                  </button>
                </div>
              </form>
            </CollapsibleDashboardSection>
          ) : null}

          <section className="side-card cart-side-card">
            <div className="side-card-header">
              <h3>Carrinho</h3>
              <span>{formatNumber(cartItems.length)} item(ns)</span>
            </div>

            <div className="cart-list">
              {cartItems.length === 0 ? (
                <div className="empty-cart-state">
                  <img src={EMPTY_CART_IMAGE_URL} alt="Carrinho vazio" />
                  <p className="empty-state">Toque em um produto para adicionar.</p>
                </div>
              ) : (
                sortedCartItems.map((item, index) => {
                  return (
                    <article
                      className="cart-item-row"
                      key={item.product.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => removeCartItem(item.product.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          removeCartItem(item.product.id);
                        }
                      }}
                    >
                      <span className="cart-item-name">
                        <span className="cart-item-index">{index + 1} - </span>
                        {item.product.name}
                      </span>
                      <span className="cart-item-quantity">
                        Qtd. {formatCartQuantity(item.product, item.quantity)}
                      </span>
                      <strong className="cart-item-total">
                        {formatMoney(Math.round(item.product.priceInCents * item.quantity))}
                      </strong>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <CollapsibleDashboardSection
            as="section"
            className="side-card customer-side-card"
            collapsedLabel="Cliente"
            isCollapsed={dashboardVisibility.hideCustomerCard}
            onToggle={() => toggleDashboardVisibility("hideCustomerCard")}
          >
            <div className="side-card-header">
              <h3>Cliente</h3>
              <span>{selectedCustomer?.name ?? "Consumidor final"}</span>
            </div>

            <label>
              Selecionar cliente
              <select
                value={selectedCustomerId}
                onChange={(event) => setSelectedCustomerId(event.target.value)}
                disabled={isLoading || isCashOperationLocked}
              >
                <option value="">Consumidor final</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Desconto (%)
              <input
                inputMode="decimal"
                placeholder="0"
                value={discount}
                onChange={(event) => setDiscount(formatPercentageInput(event.target.value))}
                disabled={isLoading || isCashOperationLocked}
              />
              <small>Equivale a {formatMoney(discountInCents)} sobre o subtotal.</small>
            </label>
          </CollapsibleDashboardSection>

          <section className="pdv-pay-card">
            <div className="pdv-pay-forms-selector">
              <span>Formas</span>
              <div className="pdv-pay-forms-options">
                {([1, 2, 3] as const).map((n) => (
                  <label key={n} className="pdv-pay-form-option">
                    <input
                      type="radio"
                      name="installments"
                      value={n}
                      checked={installments === n}
                      onChange={() => {
                        setInstallments(n);
                        setExtraPaymentRows((prev) => {
                          const needed = n - 1;
                          if (prev.length >= needed) return prev.slice(0, needed);
                          const missingRows: typeof prev = Array.from({ length: needed - prev.length }, () => ({
                            method: "CASH",
                            amount: "",
                          }));
                          return [...prev, ...missingRows];
                        });
                      }}
                    />
                    <span>{n}X</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Linha 0 — principal */}
            <div className="pdv-pay-row">
              <label className="pdv-pay-label">
                <span>Pagamento</span>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentInput["method"])}
                >
                  {ALL_PAYMENT_METHODS.filter(
                    (m) => !extraPaymentRows.slice(0, installments - 1).some((r) => r.method === m.value),
                  ).map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>

              <label className="pdv-pay-label">
                <span>Valor recebido</span>
                <input
                  inputMode="numeric"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(formatMoneyInput(event.target.value))}
                  placeholder="0,00"
                />
              </label>
            </div>

            {/* Linhas extras (2X → 1 extra, 3X → 2 extras) */}
            {extraPaymentRows.slice(0, installments - 1).map((row, i) => (
              <div className="pdv-pay-row" key={i + 1}>
                <label className="pdv-pay-label">
                  <span>Pagamento</span>
                  <select
                    value={row.method}
                    onChange={(event) =>
                      setExtraPaymentRows((prev) =>
                        prev.map((r, idx) =>
                          idx === i
                            ? { ...r, method: event.target.value as PaymentInput["method"] }
                            : r,
                        ),
                      )
                    }
                  >
                  {ALL_PAYMENT_METHODS.filter((m) => {
                      const usedByOthers = [
                        paymentMethod,
                        ...extraPaymentRows
                          .slice(0, installments - 1)
                          .filter((_, idx) => idx !== i)
                          .map((r) => r.method),
                      ];
                      return !usedByOthers.includes(m.value);
                    }).map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </label>

                <label className="pdv-pay-label">
                  <span>Valor recebido</span>
                  <input
                    inputMode="numeric"
                    value={row.amount}
                    onChange={(event) =>
                      setExtraPaymentRows((prev) =>
                        prev.map((r, idx) =>
                          idx === i
                            ? { ...r, amount: formatMoneyInput(event.target.value) }
                            : r,
                        ),
                      )
                    }
                    placeholder="0,00"
                  />
                </label>
              </div>
            ))}

            {paymentMethod === "CARD" || paymentMethod === "CONTACTLESS" || paymentMethod === "DIGITAL_WALLET" ? (
              <div className="payment-form-grid two-columns-form-grid">
                <label>
                  Terminal
                  <input
                    value={terminalId}
                    onChange={(event) => setTerminalId(event.target.value)}
                  />
                </label>
                <label>
                  Transação TEF
                  <input
                    value={transactionId}
                    onChange={(event) => setTransactionId(event.target.value)}
                  />
                </label>
              </div>
            ) : null}

            <button
              className="secondary-button block-button"
              type="button"
              onClick={addPayment}
              disabled={!canAddPayment}
              title={hasCartStockIssue ? CART_STOCK_BLOCKED_MESSAGE : undefined}
            >
              + Adicionar pagamento
            </button>

            {payments.length > 0 && (
              <div className="record-list dense-list">
                {payments.map((payment, index) => (
                  <article className="record-row" key={`${payment.method}-${index}`}>
                    <div>
                      <strong>{paymentMethodLabels[payment.method]}</strong>
                      <small>{payment.terminalId ?? "Sem terminal"}</small>
                    </div>
                    <div className="record-aside horizontal-actions">
                      <strong>{formatMoney(payment.amountInCents)}</strong>
                      <button
                        className="ghost-button small-button"
                        type="button"
                        onClick={() =>
                          setPayments((current) => current.filter((_, i) => i !== index))
                        }
                        disabled={isLoading || isCashOperationLocked}
                      >
                        Remover
                      </button>
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
                <span>Recebido <b>{formatMoney(paidInCents)}</b></span>
                {changeInCents > 0 && (
                  <span>Troco <b>{formatMoney(changeInCents)}</b></span>
                )}
              </div>
            )}
            <button
              className="primary-button block-button large-button"
              type="button"
              onClick={() => void handleRegisterSale()}
              disabled={!canFinalizeSale}
              title={hasCartStockIssue ? CART_STOCK_BLOCKED_MESSAGE : undefined}
            >
              ✓ Finalizar venda
            </button>
          </section>
        </aside>
      </section>

      <footer className="pdv-footer">
        <div className="pdv-footer-inner">
          <div className="pdv-footer-brand">
            <BrandLogo className="pdv-footer-logo" color="#ffffff" />
            <div>
              <strong className="pdv-footer-name">PDV Face Delivery</strong>
              <span className="pdv-footer-support-text">Suporte do desenvolvedor, atualizações do sistema e atendimento técnico.</span>
            </div>
          </div>
          <a href="https://wa.me/5512988601020" target="_blank" rel="noreferrer" className="pdv-footer-support">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            +55 (12) 98860-1020
          </a>
        </div>
      </footer>

      {renderCashLockScreen()}
      {renderActiveModal()}
    </main>
  );
}
