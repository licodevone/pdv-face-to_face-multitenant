export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "/backend";
const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value);
const stripTrailingSlash = (value: string): string =>
  value.endsWith("/") ? value.slice(0, -1) : value;
const resolveApiBaseUrl = (): string => {
  if (isAbsoluteUrl(apiBaseUrl)) {
    return stripTrailingSlash(apiBaseUrl);
  }

  if (typeof window !== "undefined") {
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      return stripTrailingSlash(new URL(apiBaseUrl, window.location.origin).toString());
    }

    return "http://localhost:4949";
  }

  return stripTrailingSlash(new URL(apiBaseUrl, "http://localhost:4949").toString());
};
const DEFAULT_API_REQUEST_TIMEOUT_MS = 12_000;
const parsedApiTimeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS);
const apiRequestTimeoutMs =
  Number.isFinite(parsedApiTimeout) && parsedApiTimeout > 0
    ? parsedApiTimeout
    : DEFAULT_API_REQUEST_TIMEOUT_MS;

const buildNetworkErrorMessage = () =>
  `NETWORK_ERROR: Nao foi possivel conectar a API em ${resolveApiBaseUrl()}. Verifique se o backend esta rodando e acessivel. ` +
  "Se estiver acessando por um link publico (ex.: ngrok), configure NEXT_PUBLIC_API_URL com a URL publica do backend " +
  "e inclua a origem do frontend em TRUSTED_ORIGINS no backend.";

const buildTimeoutErrorMessage = () =>
  `NETWORK_TIMEOUT: A API em ${resolveApiBaseUrl()} demorou mais de ${Math.ceil(apiRequestTimeoutMs / 1000)}s para responder. ` +
  "Confira conectividade de rede e configuracao de NEXT_PUBLIC_API_URL/TRUSTED_ORIGINS para acesso externo.";

export interface TenantPublicContext {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategorySummary {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  path: string;
}

export interface Category extends ProductCategorySummary {
  description: string | null;
  childrenCount: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  unit: "UNIT" | "KG";
  priceInCents: number;
  costInCents: number;
  stockQuantity: number;
  minimumStock: number;
  fiscalNcm: string | null;
  fiscalCfop: string | null;
  categoryId: string | null;
  category: ProductCategorySummary | null;
  active: boolean;
  stockStatus: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK";
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsOptions {
  search?: string;
  categoryId?: string;
  includeSubcategories?: boolean;
  includeInactive?: boolean;
  onlyLowStock?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  loyaltyCode: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CashSession {
  id: string;
  openedById: string;
  closedById: string | null;
  openingAmountInCents: number;
  closingAmountInCents: number | null;
  expectedAmountInCents: number | null;
  profitInCents: number | null;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt: string | null;
}

export interface CurrentCashSessionSnapshot {
  cashSession: CashSession | null;
  lastClosedCashSession: CashSession | null;
}

export interface CashMovement {
  id: string;
  cashSessionId: string;
  operatorId: string;
  type: "OPENING" | "SUPPLY" | "WITHDRAWAL" | "CLOSING";
  amountInCents: number;
  note: string | null;
  createdAt: string;
}

export type OperatorRole = "ADMIN" | "MANAGER" | "CASHIER" | "STOCKIST";

export interface OperatorProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: OperatorRole;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInput {
  method: "CASH" | "CARD" | "PIX" | "STORE_CREDIT" | "DIGITAL_WALLET" | "CONTACTLESS";
  amountInCents: number;
  provider?: string;
  externalTransactionId?: string;
  terminalId?: string;
}

export interface SaleInput {
  cashSessionId: string;
  customerId?: string;
  items: Array<{ productId: string; quantity: number }>;
  payments: PaymentInput[];
  discountInCents: number;
  fiscalMode: "ONLINE" | "CONTINGENCY";
  fiscalContingencyReason?: string;
  delivery?: {
    recipientName: string;
    phone?: string;
    address: string;
    notes?: string;
  };
  signatureRequired: boolean;
}

export interface Sale {
  id: string;
  number: string;
  totalInCents: number;
  changeInCents: number;
  fiscalStatus: "PENDING" | "ISSUED" | "CONTINGENCY" | "CANCELLED";
  deliveryTrackingCode: string | null;
  signatureStatus: "PENDING" | "SIGNED" | null;
}

export interface FinancialReport {
  from: string;
  to: string;
  grossSalesInCents: number;
  discountInCents: number;
  netSalesInCents: number;
  profitInCents: number;
  salesCount: number;
  averageTicketInCents: number;
  byPaymentMethod: Record<
    PaymentInput["method"],
    number
  >;
  daily: Array<{
    date: string;
    totalInCents: number;
    salesCount: number;
  }>;
  monthly: Array<{
    month: string;
    totalInCents: number;
    salesCount: number;
  }>;
}

interface ProductsResponse {
  products: Product[];
}

interface CategoriesResponse {
  categories: Category[];
}

interface CustomersResponse {
  customers: Customer[];
}

type CurrentCashSessionResponse = CurrentCashSessionSnapshot;

interface OperatorProfileResponse {
  operator: OperatorProfile;
}

interface OperatorsResponse {
  operators: OperatorProfile[];
}

type FinancialReportResponse = FinancialReport;

interface ApiErrorResponse {
  error: string;
  code: string;
}

interface TenantPublicContextResponse {
  tenant: TenantPublicContext;
}

interface ListTenantsResponse {
  tenants: TenantPublicContext[];
}

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse =>
  typeof value === "object" &&
  value !== null &&
  "error" in value &&
  "code" in value &&
  typeof value.error === "string" &&
  typeof value.code === "string";

const apiFetch = async <ResponseBody>(
  path: string,
  init: RequestInit = {},
): Promise<ResponseBody> => {
  const resolvedApiBaseUrl = resolveApiBaseUrl();
  const headers = new Headers(init.headers);
  const requestController = new AbortController();
  let hasTimedOut = false;
  const timeoutId = setTimeout(() => {
    hasTimedOut = true;
    requestController.abort();
  }, apiRequestTimeoutMs);
  const abortListener = () => requestController.abort();

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (init.signal) {
    if (init.signal.aborted) {
      requestController.abort();
    } else {
      init.signal.addEventListener("abort", abortListener, { once: true });
    }
  }

  let response: Response;

  try {
    response = await fetch(`${resolvedApiBaseUrl}${path}`, {
      ...init,
      headers,
      credentials: "include",
      signal: requestController.signal,
    });
  } catch (error) {
    if (hasTimedOut) {
      throw new Error(buildTimeoutErrorMessage());
    }

    if (error instanceof TypeError) {
      throw new Error(buildNetworkErrorMessage());
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (init.signal) {
      init.signal.removeEventListener("abort", abortListener);
    }
  }

  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const fallbackError: ApiErrorResponse = {
      error: response.statusText || "Erro de comunicação com a API",
      code: `HTTP_${response.status}`,
    };

    const errorBody = isApiErrorResponse(responseBody) ? responseBody : fallbackError;
    throw new Error(`${errorBody.code}: ${errorBody.error}`);
  }

  return responseBody as ResponseBody;
};

export const signIn = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) =>
  apiFetch<unknown>("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const signOut = async () =>
  apiFetch<unknown>("/api/auth/sign-out", {
    method: "POST",
  });

export const resolveTenant = async ({
  tenantId,
  slug,
}: {
  tenantId?: string;
  slug?: string;
}): Promise<TenantPublicContext> => {
  const params = new URLSearchParams();

  if (tenantId) {
    params.set("tenantId", tenantId.trim());
  }

  if (slug) {
    params.set("slug", slug.trim().toLowerCase());
  }

  const query = params.toString();
  const response = await apiFetch<TenantPublicContextResponse>(
    `/tenants/resolve${query ? `?${query}` : ""}`,
    {
      headers: slug ? { "x-tenant-slug": slug.trim().toLowerCase() } : undefined,
    },
  );

  return response.tenant;
};

export const listTenants = async (): Promise<TenantPublicContext[]> => {
  const response = await apiFetch<ListTenantsResponse>("/tenants");
  return response.tenants;
};

export interface UpdateTenantInput {
  name?: string;
  slug?: string;
  isActive?: boolean;
}

export const updateTenant = async (
  tenantId: string,
  input: UpdateTenantInput,
): Promise<TenantPublicContext> =>
  apiFetch<TenantPublicContext>(`/tenants/${tenantId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

export const deleteTenant = async (
  tenantId: string,
): Promise<{ deleted: true }> =>
  apiFetch<{ deleted: true }>(`/tenants/${tenantId}`, {
    method: "DELETE",
  });

export interface ProvisionTenantInput {
  tenantName: string;
  tenantId?: string;
  tenantSlug?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

interface ProvisionTenantResponse {
  tenant: TenantPublicContext;
  admin: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN";
    createdAt: string;
    updatedAt: string;
  };
}

export const provisionTenant = async (
  input: ProvisionTenantInput,
): Promise<ProvisionTenantResponse> =>
  apiFetch<ProvisionTenantResponse>("/tenants", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const getCurrentOperator = async (): Promise<OperatorProfile> => {
  const response = await apiFetch<OperatorProfileResponse>("/operators/me");
  return response.operator;
};

export interface UpdateOperatorProfileInput {
  name?: string;
  email?: string;
  image?: string | null;
  role?: OperatorRole;
}

export const updateCurrentOperator = async (
  operator: UpdateOperatorProfileInput,
): Promise<OperatorProfile> => {
  const response = await apiFetch<OperatorProfileResponse>("/operators/me", {
    method: "PATCH",
    body: JSON.stringify(operator),
  });

  return response.operator;
};

export interface CreateOperatorInput {
  name: string;
  email: string;
  password: string;
  image?: string | null;
  role: OperatorRole;
}

export const listOperators = async (): Promise<OperatorProfile[]> => {
  const response = await apiFetch<OperatorsResponse>("/operators");
  return response.operators;
};

export const createOperator = async (
  operator: CreateOperatorInput,
): Promise<OperatorProfile> => apiFetch<OperatorProfile>("/operators", {
  method: "POST",
  body: JSON.stringify(operator),
});

export const updateOperator = async (
  operatorId: string,
  operator: UpdateOperatorProfileInput,
): Promise<OperatorProfile> =>
  apiFetch<OperatorProfile>(`/operators/${operatorId}`, {
    method: "PATCH",
    body: JSON.stringify(operator),
  });

interface ChangeOperatorPasswordResponse {
  changed: true;
}

export interface ChangeCurrentOperatorPasswordInput {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}

export const changeCurrentOperatorPassword = async ({
  currentPassword,
  newPassword,
  revokeOtherSessions = true,
}: ChangeCurrentOperatorPasswordInput): Promise<boolean> => {
  const response = await apiFetch<ChangeOperatorPasswordResponse>("/operators/me/password", {
    method: "POST",
    body: JSON.stringify({
      currentPassword,
      newPassword,
      revokeOtherSessions,
    }),
  });

  return response.changed;
};

export const listProducts = async (
  options?: string | ListProductsOptions,
): Promise<Product[]> => {
  const normalizedOptions =
    typeof options === "string" ? { search: options } : (options ?? {});
  const params = new URLSearchParams();

  if (normalizedOptions.search) {
    params.set("search", normalizedOptions.search);
  }

  if (normalizedOptions.categoryId) {
    params.set("categoryId", normalizedOptions.categoryId);
  }

  if (normalizedOptions.includeSubcategories !== undefined) {
    params.set(
      "includeSubcategories",
      String(normalizedOptions.includeSubcategories),
    );
  }

  if (normalizedOptions.includeInactive !== undefined) {
    params.set("includeInactive", String(normalizedOptions.includeInactive));
  }

  if (normalizedOptions.onlyLowStock !== undefined) {
    params.set("onlyLowStock", String(normalizedOptions.onlyLowStock));
  }

  const queryString = params.toString();
  const query = queryString ? `?${queryString}` : "";
  const response = await apiFetch<ProductsResponse>(`/products${query}`);
  return response.products;
};

export interface CreateProductInput {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  unit: Product["unit"];
  priceInCents: number;
  costInCents: number;
  stockQuantity: number;
  minimumStock: number;
  fiscalNcm?: string;
  fiscalCfop?: string;
  categoryId?: string;
}

export const createProduct = async (product: CreateProductInput): Promise<Product> =>
  apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });

export interface UpdateProductInput {
  sku?: string;
  barcode?: string | null;
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  unit?: Product["unit"];
  priceInCents?: number;
  costInCents?: number;
  stockQuantity?: number;
  minimumStock?: number;
  fiscalNcm?: string | null;
  fiscalCfop?: string | null;
  categoryId?: string | null;
  active?: boolean;
}

export const updateProduct = async (
  productId: string,
  product: UpdateProductInput,
): Promise<Product> =>
  apiFetch<Product>(`/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(product),
  });

export interface AdjustProductStockInput {
  operation: "SET" | "INCREMENT" | "DECREMENT";
  quantity: number;
}

export const adjustProductStock = async (
  productId: string,
  stockUpdate: AdjustProductStockInput,
): Promise<Product> =>
  apiFetch<Product>(`/products/${productId}/stock`, {
    method: "PATCH",
    body: JSON.stringify(stockUpdate),
  });

export const deleteProduct = async (
  productId: string,
): Promise<{ deleted: true }> =>
  apiFetch<{ deleted: true }>(`/products/${productId}`, {
    method: "DELETE",
  });

export const listCategories = async (search?: string): Promise<Category[]> => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await apiFetch<CategoriesResponse>(`/categories${query}`);
  return response.categories;
};

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
}

export const createCategory = async (
  category: CreateCategoryInput,
): Promise<Category> =>
  apiFetch<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(category),
  });

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  parentId?: string | null;
}

export const updateCategory = async (
  categoryId: string,
  category: UpdateCategoryInput,
): Promise<Category> =>
  apiFetch<Category>(`/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(category),
  });

export const deleteCategory = async (
  categoryId: string,
): Promise<{ deleted: true }> =>
  apiFetch<{ deleted: true }>(`/categories/${categoryId}`, {
    method: "DELETE",
  });

export const listCustomers = async (search?: string): Promise<Customer[]> => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await apiFetch<CustomersResponse>(`/customers${query}`);
  return response.customers;
};

export interface CreateCustomerInput {
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  loyaltyCode?: string;
  address?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  cpf?: string | null;
  phone?: string | null;
  email?: string | null;
  loyaltyCode?: string | null;
  address?: string | null;
}

export const createCustomer = async (
  customer: CreateCustomerInput,
): Promise<Customer> =>
  apiFetch<Customer>("/customers", {
    method: "POST",
    body: JSON.stringify(customer),
  });

export const updateCustomer = async (
  customerId: string,
  customer: UpdateCustomerInput,
): Promise<Customer> =>
  apiFetch<Customer>(`/customers/${customerId}`, {
    method: "PATCH",
    body: JSON.stringify(customer),
  });

export const deleteCustomer = async (
  customerId: string,
): Promise<{ deleted: true }> =>
  apiFetch<{ deleted: true }>(`/customers/${customerId}`, {
    method: "DELETE",
  });

export const getCurrentCashSession = async (): Promise<CurrentCashSessionSnapshot> => {
  const response = await apiFetch<CurrentCashSessionResponse>("/cash/sessions/current");
  return response;
};

export const getFinancialReport = async (params?: {
  from?: string;
  to?: string;
}): Promise<FinancialReport> => {
  const queryParams = new URLSearchParams();

  if (params?.from) {
    queryParams.set("from", params.from);
  }

  if (params?.to) {
    queryParams.set("to", params.to);
  }

  const queryString = queryParams.toString();
  const query = queryString ? `?${queryString}` : "";
  return apiFetch<FinancialReportResponse>(`/reports/financial${query}`);
};

export const openCashSession = async (
  openingAmountInCents: number,
): Promise<CashSession> =>
  apiFetch<CashSession>("/cash/sessions/open", {
    method: "POST",
    body: JSON.stringify({ openingAmountInCents }),
  });

export const updateCashSessionOpeningAmount = async (
  cashSessionId: string,
  openingAmountInCents: number,
): Promise<CashSession> =>
  apiFetch<CashSession>(`/cash/sessions/${cashSessionId}/opening-amount`, {
    method: "PATCH",
    body: JSON.stringify({ openingAmountInCents }),
  });

export const registerCashMovement = async (
  cashSessionId: string,
  movement: {
    type: "SUPPLY" | "WITHDRAWAL";
    amountInCents: number;
    note?: string;
  },
): Promise<CashMovement> =>
  apiFetch<CashMovement>(`/cash/sessions/${cashSessionId}/movements`, {
    method: "POST",
    body: JSON.stringify(movement),
  });

export const registerSale = async (sale: SaleInput): Promise<Sale> =>
  apiFetch<Sale>("/sales", {
    method: "POST",
    body: JSON.stringify(sale),
  });
