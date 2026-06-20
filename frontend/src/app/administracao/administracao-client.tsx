"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowLeftRight,
  BarChart2,
  Building2,
  Check,
  CheckCheck,
  ClipboardList,
  Eye,
  EyeOff,
  Info,
  LayoutDashboard,
  LayoutGrid,
  Monitor,
  Package,
  Pencil,
  Percent,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Trash2,
  User,
  Warehouse,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  deleteTenant,
  listTenants,
  provisionTenant,
  resolveTenant,
  TenantPublicContext,
  updateTenant,
} from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProvisionTenantDraft {
  tenantName: string;
  tenantId: string;
  tenantSlug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

interface TenantEditDraft {
  name: string;
  slug: string;
  isActive: boolean;
}

type RoleKey = "ADMIN" | "MANAGER" | "CASHIER" | "STOCKIST";
type SectionKey =
  | "metricas"
  | "gerencial"
  | "categorias"
  | "busca"
  | "carrinho"
  | "cliente"
  | "desconto"
  | "relatorios"
  | "estoque"
  | "entrada-saida"
  | "config-disp";

type ProfileConfig = Record<RoleKey, Partial<Record<SectionKey, boolean>>>;

// ─── Static data ─────────────────────────────────────────────────────────────

const PROFILE_TABS: Array<{ id: RoleKey; label: string; icon: LucideIcon; desc: string }> = [
  { id: "ADMIN",    label: "Administrador", icon: Shield,          desc: "Acesso completo ao PDV, gerencial e relatórios" },
  { id: "MANAGER",  label: "Gerente",       icon: LayoutDashboard, desc: "Acesso gerencial, relatórios e operação de caixa" },
  { id: "CASHIER",  label: "Funcionário",   icon: Monitor,         desc: "Operação de frente de caixa e vendas" },
  { id: "STOCKIST", label: "Estoquista",    icon: Warehouse,       desc: "Gestão de estoque e relatórios de inventário" },
];

type SectionDef = { id: SectionKey; label: string; icon: LucideIcon; desc: string; locked: RoleKey[] };

const SECTION_DEFS: SectionDef[] = [
  { id: "metricas",      label: "Métricas de resumo",            icon: BarChart2,       desc: "Painel com ticket médio, sessão do caixa e produtos ativos.",            locked: [] },
  { id: "gerencial",     label: "Menu gerencial",                icon: LayoutDashboard, desc: "Acesso a categorias, produtos, clientes, estoque e configurações.",      locked: [] },
  { id: "categorias",    label: "Categorias",                     icon: LayoutGrid,      desc: "Filtros rápidos por categoria no catálogo de produtos.",                 locked: [] },
  { id: "busca",         label: "Campo de busca",                icon: Search,          desc: "Busca por nome, SKU ou código de barras no catálogo.",                   locked: [] },
  { id: "carrinho",      label: "Carrinho de vendas",            icon: ShoppingCart,    desc: "Lista de itens, totais e finalização da venda. Obrigatório para caixa.", locked: ["CASHIER", "ADMIN"] },
  { id: "cliente",       label: "Identificação de cliente",      icon: User,            desc: "Seleção de cliente ou consumidor final para vincular à venda.",           locked: [] },
  { id: "desconto",      label: "Desconto na venda",             icon: Percent,         desc: "Campo de percentual de desconto aplicado ao total da venda.",             locked: [] },
  { id: "relatorios",    label: "Relatórios",                    icon: ClipboardList,   desc: "Acesso a modelos de relatórios operacionais e financeiros.",              locked: [] },
  { id: "estoque",       label: "Gestão de estoque",             icon: Package,         desc: "Visualização e ajuste de saldos de estoque dos produtos.",                locked: [] },
  { id: "entrada-saida", label: "Entrada e saída",               icon: ArrowLeftRight,  desc: "Registro de movimentações de entrada e saída de mercadorias.",            locked: [] },
  { id: "config-disp",   label: "Configuração de dispositivos",  icon: Settings,        desc: "Balança, impressora e perfis de notas fiscais do PDV.",                   locked: [] },
];

const DEFAULT_PROFILE_CONFIG: ProfileConfig = {
  ADMIN:    { metricas: true,  gerencial: true,  categorias: true,  busca: true, carrinho: true,  cliente: true,  desconto: true,  relatorios: true,  "config-disp": true,  estoque: true,  "entrada-saida": true  },
  MANAGER:  { metricas: true,  gerencial: true,  categorias: true,  busca: true, carrinho: true,  cliente: true,  desconto: true,  relatorios: true,  "config-disp": false, estoque: true,  "entrada-saida": false },
  CASHIER:  { metricas: true,  gerencial: false, categorias: true,  busca: true, carrinho: true,  cliente: true,  desconto: false, relatorios: false, "config-disp": false, estoque: false, "entrada-saida": false },
  STOCKIST: { metricas: true,  gerencial: false, categorias: false, busca: true, carrinho: false, cliente: false, desconto: false, relatorios: true,  "config-disp": false, estoque: true,  "entrada-saida": true  },
};

const createEmptyTenantDraft = (): ProvisionTenantDraft => ({
  tenantName: "", tenantId: "", tenantSlug: "", adminName: "", adminEmail: "", adminPassword: "",
});

const createTenantEditDraft = (tenant: TenantPublicContext): TenantEditDraft => ({
  name: tenant.name, slug: tenant.slug, isActive: tenant.isActive,
});

// ─── Brand logo ──────────────────────────────────────────────────────────────

function BrandLogo({ className, color = "var(--accent)" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5L90 25V75L50 95L10 75V25L50 5Z" fill={color} opacity="0.1" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" />
      <path d="M35 30H65V40H45V50H60V60H45V75" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M55 30C75 30 85 45 85 52.5C85 60 75 75 55 75" stroke={color} strokeWidth="8" strokeLinecap="round" opacity="0.6" />
      <path d="M15 45H25" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      <path d="M10 55H22" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.2" />
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AdministracaoClientPage() {
  const [tenantLookup, setTenantLookup] = useState("");
  const [resolvedTenant, setResolvedTenant] = useState<TenantPublicContext | null>(null);
  const [registeredTenants, setRegisteredTenants] = useState<TenantPublicContext[]>([]);
  const [tenantDraft, setTenantDraft] = useState<ProvisionTenantDraft>(createEmptyTenantDraft);
  const [message, setMessage] = useState(
    "Use esta área para consultar tenants existentes ou criar um novo cliente.",
  );
  const [isResolving, setIsResolving] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isListingTenants, setIsListingTenants] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [editingTenantDraft, setEditingTenantDraft] = useState<TenantEditDraft | null>(null);
  const [isMutatingTenant, setIsMutatingTenant] = useState(false);

  // New state
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeProfile, setActiveProfile] = useState<RoleKey>("CASHIER");
  const [profileConfig, setProfileConfig] = useState<ProfileConfig>(DEFAULT_PROFILE_CONFIG);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const loadRegisteredTenants = async (successMessage?: string) => {
    setIsListingTenants(true);
    try {
      const tenants = await listTenants();
      setRegisteredTenants(tenants);
      if (successMessage) setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível listar os clientes cadastrados.");
    } finally {
      setIsListingTenants(false);
    }
  };

  const handleResolveTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lookup = tenantLookup.trim();
    if (!lookup) {
      setResolvedTenant(null);
      setMessage("Informe o slug ou id do tenant para consultar.");
      return;
    }
    setIsResolving(true);
    try {
      const tenant = await resolveTenant({ slug: lookup, tenantId: lookup });
      setResolvedTenant(tenant);
      setMessage(`Tenant ${tenant.name} carregado com sucesso.`);
    } catch (error) {
      setResolvedTenant(null);
      setMessage(error instanceof Error ? error.message : "Não foi possível consultar o tenant.");
    } finally {
      setIsResolving(false);
    }
  };

  const handleProvisionTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsProvisioning(true);
    try {
      const result = await provisionTenant({
        tenantName: tenantDraft.tenantName.trim(),
        tenantId: tenantDraft.tenantId.trim() || undefined,
        tenantSlug: tenantDraft.tenantSlug.trim() || undefined,
        adminName: tenantDraft.adminName.trim(),
        adminEmail: tenantDraft.adminEmail.trim().toLowerCase(),
        adminPassword: tenantDraft.adminPassword,
      });
      setResolvedTenant(result.tenant);
      setTenantLookup(result.tenant.slug);
      setTenantDraft(createEmptyTenantDraft());
      setShowNewForm(false);
      setMessage(`Tenant ${result.tenant.name} criado com admin ${result.admin.email}.`);
      await loadRegisteredTenants();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criar o tenant.");
    } finally {
      setIsProvisioning(false);
    }
  };

  useEffect(() => { void loadRegisteredTenants(); }, []);

  const handleStartTenantEdit = (tenant: TenantPublicContext) => {
    setEditingTenantId(tenant.id);
    setEditingTenantDraft(createTenantEditDraft(tenant));
  };

  const handleCancelTenantEdit = () => {
    setEditingTenantId(null);
    setEditingTenantDraft(null);
    setMessage("Edição de cliente cancelada.");
  };

  const handleSaveTenant = async (tenantId: string) => {
    if (!editingTenantDraft) return;
    setIsMutatingTenant(true);
    try {
      const updated = await updateTenant(tenantId, {
        name: editingTenantDraft.name.trim(),
        slug: editingTenantDraft.slug.trim(),
        isActive: editingTenantDraft.isActive,
      });
      setRegisteredTenants((current) =>
        current.map((t) => (t.id === updated.id ? updated : t)),
      );
      setResolvedTenant((current) =>
        current?.id === updated.id ? updated : current,
      );
      setEditingTenantId(null);
      setEditingTenantDraft(null);
      setMessage(`Cliente ${updated.name} atualizado com sucesso.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o cliente.");
    } finally {
      setIsMutatingTenant(false);
    }
  };

  const handleDeleteTenant = async (tenant: TenantPublicContext) => {
    if (!window.confirm(`Deseja realmente excluir o cliente "${tenant.name}"?`)) return;
    setIsMutatingTenant(true);
    try {
      await deleteTenant(tenant.id);
      setRegisteredTenants((current) => current.filter((t) => t.id !== tenant.id));
      setResolvedTenant((current) => (current?.id === tenant.id ? null : current));
      if (editingTenantId === tenant.id) {
        setEditingTenantId(null);
        setEditingTenantDraft(null);
      }
      setMessage(`Cliente ${tenant.name} removido com sucesso.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir o cliente.");
    } finally {
      setIsMutatingTenant(false);
    }
  };

  const handleOpenNewForm = () => {
    setShowNewForm(true);
    setMessage("Preencha os dados abaixo para criar um novo cliente.");
  };

  const handleCancelNewForm = () => {
    setShowNewForm(false);
    setTenantDraft(createEmptyTenantDraft());
    setMessage("Criação de cliente cancelada.");
  };

  const toggleSection = (role: RoleKey, sectionId: SectionKey) => {
    setProfileConfig((current) => ({
      ...current,
      [role]: { ...current[role], [sectionId]: !current[role][sectionId] },
    }));
  };

  const activeProfileDef = PROFILE_TABS.find((p) => p.id === activeProfile);
  const isBusy = isListingTenants || isProvisioning || isResolving || isMutatingTenant;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="adm-page">
      <div className="adm-shell">

        {/* Topbar */}
        <header className="pdv-topbar">
          <div className="topbar-brand">
            <BrandLogo className="topbar-logo" color="#ffffff" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Administração do sistema</p>
              <h1>Painel multitenant</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="adm-admin-badge">
              <Shield size={13} />
              Admin do sistema
            </span>
            <Button asChild variant="secondary" size="sm" className="adm-icon-btn">
              <Link href="/pdv">
                <ArrowLeft size={15} />
                Voltar ao PDV
              </Link>
            </Button>
          </div>
        </header>

        {/* Status strip */}
        <div className="adm-status-strip panel-card">
          <Info size={15} className="adm-status-icon" />
          <span>{message}</span>
        </div>

        {/* Tenant list */}
        <section className="adm-card">
          <div className="adm-card-header">
            <div>
              <h2 className="adm-card-title">Clientes cadastrados</h2>
              <p className="text-sm text-muted-foreground">
                {registeredTenants.length} cliente{registeredTenants.length === 1 ? "" : "s"} no ambiente multitenant.
              </p>
            </div>
            <Button
              className="adm-icon-btn"
              type="button"
              onClick={handleOpenNewForm}
              disabled={showNewForm}
            >
              <Plus size={15} />
              Novo cliente
            </Button>
          </div>

          <div className="adm-tenant-list">
            {isListingTenants && registeredTenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">Carregando clientes...</p>
            ) : registeredTenants.length === 0 ? (
              <div className="adm-empty-state">
                <Building2 size={40} className="adm-empty-icon" />
                <span>
                  Nenhum cliente cadastrado ainda. Clique em <strong>Novo cliente</strong> para começar.
                </span>
              </div>
            ) : (
              registeredTenants.map((tenant) => (
                <article key={tenant.id} className="adm-tenant-article">
                  {editingTenantId === tenant.id && editingTenantDraft ? (
                    /* Edit mode */
                    <div className="adm-tenant-edit">
                      <p className="adm-edit-label">Editando — {tenant.name}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                          Nome do cliente
                          <Input
                            value={editingTenantDraft.name}
                            onChange={(e) =>
                              setEditingTenantDraft((d) => d ? { ...d, name: e.target.value } : null)
                            }
                            disabled={isMutatingTenant}
                          />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                          Slug
                          <Input
                            value={editingTenantDraft.slug}
                            onChange={(e) =>
                              setEditingTenantDraft((d) => d ? { ...d, slug: e.target.value } : null)
                            }
                            disabled={isMutatingTenant}
                          />
                        </label>
                      </div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingTenantDraft.isActive}
                          onChange={(e) =>
                            setEditingTenantDraft((d) => d ? { ...d, isActive: e.target.checked } : null)
                          }
                          disabled={isMutatingTenant}
                          className="h-4 w-4 rounded border border-input accent-primary"
                        />
                        <span>Cliente ativo</span>
                      </label>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={handleCancelTenantEdit}
                          disabled={isMutatingTenant}
                        >
                          Cancelar
                        </Button>
                        <Button
                          className="adm-icon-btn"
                          type="button"
                          onClick={() => void handleSaveTenant(tenant.id)}
                          disabled={isMutatingTenant}
                        >
                          <Save size={13} />
                          {isMutatingTenant ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <>
                      <div className="adm-tenant-header">
                        <div className="adm-tenant-title">
                          <Building2 size={16} className="adm-accent-icon" />
                          <strong>{tenant.name}</strong>
                          <span className={`status-pill ${tenant.isActive ? "success" : "danger"}`}>
                            {tenant.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <div className="adm-tenant-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="adm-icon-btn"
                            type="button"
                            onClick={() => handleStartTenantEdit(tenant)}
                            disabled={isBusy}
                          >
                            <Pencil size={13} />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="adm-icon-btn adm-danger-btn"
                            type="button"
                            onClick={() => void handleDeleteTenant(tenant)}
                            disabled={isBusy}
                          >
                            <Trash2 size={13} />
                            Excluir
                          </Button>
                        </div>
                      </div>
                      <div className="adm-tenant-meta">
                        <span><strong>slug:</strong> {tenant.slug}</span>
                        <span><strong>id:</strong> {tenant.id}</span>
                        <span className={`status-pill ${tenant.isActive ? "success" : "danger"} adm-meta-pill`}>
                          {tenant.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        {/* Consultar tenant */}
        <section className="adm-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Consulta</p>
            <h3 className="adm-section-title">Consultar tenant</h3>
            <p className="text-sm text-muted-foreground">Informe o slug ou id do cliente para verificar a infraestrutura cadastrada.</p>
          </div>
          <form className="adm-resolve-form" onSubmit={(e) => void handleResolveTenant(e)}>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Slug ou id do tenant
              <Input
                autoComplete="organization"
                placeholder="ex.: loja-demo"
                value={tenantLookup}
                onChange={(e) => setTenantLookup(e.target.value)}
              />
            </label>
            <Button className="adm-icon-btn adm-resolve-btn" type="submit" disabled={isResolving}>
              <Search size={14} />
              {isResolving ? "Consultando..." : "Consultar"}
            </Button>
          </form>
          {resolvedTenant && (
            <div className="adm-resolve-result">
              <strong>{resolvedTenant.name}</strong>
              <span>{resolvedTenant.slug} · {resolvedTenant.id} · {resolvedTenant.isActive ? "Ativo" : "Inativo"}</span>
            </div>
          )}
        </section>

        {/* Novo cliente (collapsible) */}
        {showNewForm && (
          <section className="adm-card">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Provisionamento</p>
              <h2 className="adm-card-title">Novo cliente</h2>
              <p className="text-sm text-muted-foreground">Crie a estrutura inicial do cliente e o primeiro administrador do tenant.</p>
            </div>
            <form onSubmit={(e) => void handleProvisionTenant(e)}>
              <div className="adm-new-form-grid">
                {/* Dados do cliente */}
                <div className="adm-new-form-subcard">
                  <p className="adm-subcard-label">Dados do cliente</p>
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Nome do cliente *
                    <Input
                      placeholder="Ex.: Mercado São João"
                      value={tenantDraft.tenantName}
                      onChange={(e) => setTenantDraft((d) => ({ ...d, tenantName: e.target.value }))}
                      disabled={isProvisioning}
                      required
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5 text-sm font-medium">
                      Tenant ID <small className="font-normal text-muted-foreground">(opcional)</small>
                      <Input
                        placeholder="auto"
                        value={tenantDraft.tenantId}
                        onChange={(e) => setTenantDraft((d) => ({ ...d, tenantId: e.target.value }))}
                        disabled={isProvisioning}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium">
                      Slug <small className="font-normal text-muted-foreground">(opcional)</small>
                      <Input
                        placeholder="mercado-sao-joao"
                        value={tenantDraft.tenantSlug}
                        onChange={(e) => setTenantDraft((d) => ({ ...d, tenantSlug: e.target.value }))}
                        disabled={isProvisioning}
                      />
                    </label>
                  </div>
                </div>

                {/* Administrador inicial */}
                <div className="adm-new-form-subcard">
                  <p className="adm-subcard-label">Administrador inicial</p>
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Nome do admin *
                    <Input
                      placeholder="Ex.: João Silva"
                      value={tenantDraft.adminName}
                      onChange={(e) => setTenantDraft((d) => ({ ...d, adminName: e.target.value }))}
                      disabled={isProvisioning}
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    E-mail do admin *
                    <Input
                      type="email"
                      placeholder="joao@loja.com.br"
                      value={tenantDraft.adminEmail}
                      onChange={(e) => setTenantDraft((d) => ({ ...d, adminEmail: e.target.value }))}
                      disabled={isProvisioning}
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Senha inicial *
                    <div className="relative flex items-center">
                      <Input
                        type={showAdminPassword ? "text" : "password"}
                        placeholder="mín. 8 caracteres"
                        minLength={8}
                        value={tenantDraft.adminPassword}
                        onChange={(e) => setTenantDraft((d) => ({ ...d, adminPassword: e.target.value }))}
                        className="pr-9"
                        disabled={isProvisioning}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowAdminPassword((v) => !v)}
                        aria-label={showAdminPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>
                </div>
              </div>

              <div className="adm-new-form-footer">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleCancelNewForm}
                  disabled={isProvisioning}
                >
                  Cancelar
                </Button>
                <Button className="adm-icon-btn" type="submit" disabled={isProvisioning}>
                  <CheckCheck size={16} />
                  {isProvisioning ? "Criando..." : "Criar cliente"}
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* Configuração de telas por perfil */}
        <section className="adm-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Personalização</p>
            <h2 className="adm-card-title">Configuração de telas por perfil</h2>
            <p className="text-sm text-muted-foreground">
              Ative ou desative seções para cada tipo de usuário. As alterações afetam todos os clientes desse perfil.
            </p>
          </div>

          <div className="adm-profile-tabs">
            {PROFILE_TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`adm-profile-tab${activeProfile === tab.id ? " active" : ""}`}
                  type="button"
                  onClick={() => setActiveProfile(tab.id)}
                >
                  <TabIcon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="adm-profile-sections">
            <p className="text-sm text-muted-foreground adm-profile-desc">{activeProfileDef?.desc}</p>
            <div className="adm-section-list">
              {SECTION_DEFS.map((sec) => {
                const SectionIcon = sec.icon;
                const enabled = profileConfig[activeProfile][sec.id] !== false;
                const isLocked = sec.locked.includes(activeProfile);
                return (
                  <div key={sec.id} className="adm-section-row">
                    <div className="adm-section-info">
                      <SectionIcon size={16} className="adm-accent-icon" />
                      <div>
                        <div className="adm-section-label">{sec.label}</div>
                        <div className="adm-section-desc">{sec.desc}</div>
                      </div>
                    </div>
                    <div className="adm-section-control">
                      {isLocked && <span className="adm-locked-label">Obrigatório</span>}
                      <button
                        className={`adm-toggle-btn${isLocked || enabled ? " active" : ""}`}
                        type="button"
                        onClick={() => { if (!isLocked) toggleSection(activeProfile, sec.id); }}
                        disabled={isLocked}
                      >
                        {enabled ? <Check size={12} /> : <X size={12} />}
                        {isLocked ? "Ativo" : enabled ? "Ativo" : "Inativo"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="adm-footer">
          <div className="adm-footer-inner">
            <div className="adm-footer-brand">
              <BrandLogo className="adm-footer-logo" color="#ffffff" />
              <strong>PDV Face Delivery · Sistema Multitenant</strong>
            </div>
            <a
              href="https://wa.me/5512988601020"
              target="_blank"
              rel="noreferrer"
              className="adm-footer-contact"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              +55 (12) 98860-1020
            </a>
          </div>
        </footer>

      </div>
    </main>
  );
}
