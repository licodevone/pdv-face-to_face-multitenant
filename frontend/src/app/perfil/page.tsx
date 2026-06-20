"use client";

import Link from "next/link";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import {
  ChangeCurrentOperatorPasswordInput,
  OperatorProfile,
  changeCurrentOperatorPassword,
  getCurrentOperator,
  updateCurrentOperator,
} from "@/lib/api";
import {
  OPERATOR_ROLE_OPTIONS,
  canEditOwnOperatorRole,
  formatOperatorRoleLabel,
  hasManagerLevelAccess,
} from "@/lib/operator-roles";

interface OperatorProfileDraft {
  name: string;
  email: string;
  image: string;
  role: OperatorProfile["role"];
}

const createEmptyDraft = (): OperatorProfileDraft => ({
  name: "",
  email: "",
  image: "",
  role: "CASHIER",
});

const createDraftFromProfile = (
  operator: OperatorProfile,
): OperatorProfileDraft => ({
  name: operator.name,
  email: operator.email,
  image: operator.image ?? "",
  role: operator.role,
});

interface PasswordDraft extends ChangeCurrentOperatorPasswordInput {
  confirmNewPassword: string;
}

const createEmptyPasswordDraft = (): PasswordDraft => ({
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
  revokeOtherSessions: true,
});

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(new Date(value));

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

export default function OperatorProfilePage() {
  const operatorMenuRef = useRef<HTMLDetailsElement | null>(null);
  const [operator, setOperator] = useState<OperatorProfile | null>(null);
  const [draft, setDraft] = useState<OperatorProfileDraft>(createEmptyDraft);
  const [passwordDraft, setPasswordDraft] = useState<PasswordDraft>(createEmptyPasswordDraft);
  const [message, setMessage] = useState("Carregando dados do operador...");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const loadOperatorProfile = async (
    successMessage = "Dados do operador carregados.",
  ) => {
    setIsLoading(true);

    try {
      const loadedOperator = await getCurrentOperator();
      setOperator(loadedOperator);
      setDraft(createDraftFromProfile(loadedOperator));
      setMessage(successMessage);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar os dados do operador.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOperatorProfile();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingProfile(true);

    try {
      const updatedOperator = await updateCurrentOperator({
        name: draft.name.trim(),
        email: draft.email.trim().toLowerCase(),
        image: draft.image.trim() || null,
        role: draft.role,
      });

      setOperator(updatedOperator);
      setDraft(createDraftFromProfile(updatedOperator));
      setMessage("Perfil atualizado com sucesso.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o perfil do operador.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRestoreDraft = () => {
    if (!operator) {
      return;
    }

    setDraft(createDraftFromProfile(operator));
    setMessage("Alteracoes locais restauradas para o ultimo perfil salvo.");
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passwordDraft.newPassword.trim().length < 8) {
      setMessage("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (passwordDraft.newPassword !== passwordDraft.confirmNewPassword) {
      setMessage("A confirmacao da nova senha precisa ser igual a senha informada.");
      return;
    }

    setIsChangingPassword(true);

    try {
      await changeCurrentOperatorPassword({
        currentPassword: passwordDraft.currentPassword,
        newPassword: passwordDraft.newPassword,
        revokeOtherSessions: passwordDraft.revokeOtherSessions,
      });

      setPasswordDraft(createEmptyPasswordDraft());
      setMessage("Senha atualizada com sucesso.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar a senha do operador.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRestorePasswordDraft = () => {
    setPasswordDraft(createEmptyPasswordDraft());
    setMessage("Formulario de senha restaurado.");
  };

  const handleRefreshProfile = async () => {
    await loadOperatorProfile("Perfil recarregado a partir da API.");
  };

  const closeOperatorMenu = () => {
    operatorMenuRef.current?.removeAttribute("open");
  };

  const handleRefreshProfileFromMenu = async () => {
    closeOperatorMenu();
    await handleRefreshProfile();
  };

  const sessionInitials = (operator?.name.trim() || draft.name.trim() || "O")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const isProfileBusy = isLoading || isSavingProfile;
  const isPasswordBusy = isLoading || isChangingPassword;
  const canEditRole = canEditOwnOperatorRole(operator?.role);
  const hasManagerAccess = hasManagerLevelAccess(operator?.role);
  const operatorDisplayName = operator?.name.trim() || draft.name.trim() || "Operador";
  const operatorDisplayRole = operator ? formatOperatorRoleLabel(operator.role) : "Perfil";

  return (
    <main className="profile-page">
      <section className="profile-shell">
        <header className="pdv-topbar">
          <div className="topbar-brand">
            <BrandLogo className="topbar-logo" color="#ffffff" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gerenciamento de conta</p>
              <h1>Seu Perfil</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <Button asChild variant="secondary" size="sm">
              <Link href="/pdv">Voltar</Link>
            </Button>

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
                <Button
                  className="operator-menu-item"
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => void handleRefreshProfileFromMenu()}
                  disabled={isLoading || isSavingProfile || isChangingPassword}
                >
                  Atualizar
                </Button>
                {hasManagerAccess ? (
                  <Button asChild variant="ghost" size="sm" className="operator-menu-item">
                    <Link href="/perfil/funcionarios" onClick={closeOperatorMenu}>
                      Funcionários
                    </Link>
                  </Button>
                ) : null}
                <hr className="operator-menu-divider" />
                <Button
                  className="operator-menu-item danger"
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={closeOperatorMenu}
                >
                  Sair
                </Button>
              </div>
            </details>
          </div>
        </header>

        {message && (
          <div className="profile-status-strip panel-card">
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        )}

        <div className="profile-layout">
          <aside className="profile-summary-card panel-card">
            <div className="profile-card-heading">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resumo da Conta</p>
              <p className="text-sm text-muted-foreground">Dados da sessão autenticada</p>
            </div>

            <div className="profile-avatar-circle">{sessionInitials}</div>

            <div className="profile-summary-rows">
              {[
                { label: "Nome", value: operatorDisplayName },
                { label: "Perfil", value: operatorDisplayRole },
                { label: "Acesso gerencial", value: hasManagerAccess ? "Liberado" : "Bloqueado" },
                { label: "Cadastrado", value: operator ? formatDateTime(operator.createdAt) : "—" },
                { label: "Atualizado", value: operator ? formatDateTime(operator.updatedAt) : "—" },
              ].map((row) => (
                <div key={row.label} className="profile-summary-row">
                  <strong>{row.label}</strong>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="profile-main-column">
            <form className="profile-form-card panel-card" onSubmit={(event) => void handleSubmit(event)}>
              <div className="profile-card-heading">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dados do cadastro</p>
                <p className="text-sm text-muted-foreground">Essas informações alimentam o topo do PDV e o cadastro do operador.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Nome completo
                  <Input
                    autoComplete="name"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        name: event.target.value,
                      }))
                    }
                    disabled={isProfileBusy}
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  E-mail de acesso
                  <Input
                    autoComplete="email"
                    inputMode="email"
                    type="email"
                    value={draft.email}
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        email: event.target.value,
                      }))
                    }
                    disabled={isProfileBusy}
                    required
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-sm font-medium mb-4">
                Imagem do operador (URL)
                <Input
                  autoComplete="url"
                  inputMode="url"
                  placeholder="https://exemplo.com/avatar.png"
                  value={draft.image}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      image: event.target.value,
                    }))
                  }
                  disabled={isProfileBusy}
                />
              </label>

              {canEditRole && (
                <label className="flex flex-col gap-1.5 text-sm font-medium mb-4">
                  Perfil de acesso
                  <Select
                    value={draft.role}
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        role: event.target.value as OperatorProfile["role"],
                      }))
                    }
                    disabled={isProfileBusy}
                  >
                    {OPERATOR_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </label>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleRestoreDraft}
                  disabled={!operator || isProfileBusy}
                >
                  Restaurar
                </Button>
                <Button
                  type="submit"
                  disabled={isProfileBusy || !operator}
                >
                  {isSavingProfile ? "Salvando..." : "Salvar perfil"}
                </Button>
              </div>
            </form>

            <form
              className="profile-form-card panel-card"
              onSubmit={(event) => void handlePasswordSubmit(event)}
            >
              <div className="profile-card-heading">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Alterar senha</p>
                <p className="text-sm text-muted-foreground">Mínimo de 8 caracteres. A nova senha precisa ser confirmada.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Senha atual
                  <div className="relative flex items-center">
                    <Input
                      autoComplete="current-password"
                      type={showCurrentPwd ? "text" : "password"}
                      value={passwordDraft.currentPassword}
                      onChange={(event) =>
                        setPasswordDraft((currentDraft) => ({
                          ...currentDraft,
                          currentPassword: event.target.value,
                        }))
                      }
                      className="pr-9"
                      disabled={isPasswordBusy}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowCurrentPwd((v) => !v)}
                      aria-label={showCurrentPwd ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Nova senha
                  <div className="relative flex items-center">
                    <Input
                      autoComplete="new-password"
                      type={showNewPwd ? "text" : "password"}
                      value={passwordDraft.newPassword}
                      onChange={(event) =>
                        setPasswordDraft((currentDraft) => ({
                          ...currentDraft,
                          newPassword: event.target.value,
                        }))
                      }
                      className="pr-9"
                      disabled={isPasswordBusy}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowNewPwd((v) => !v)}
                      aria-label={showNewPwd ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Confirmar nova senha
                  <div className="relative flex items-center">
                    <Input
                      autoComplete="new-password"
                      type={showConfirmPwd ? "text" : "password"}
                      value={passwordDraft.confirmNewPassword}
                      onChange={(event) =>
                        setPasswordDraft((currentDraft) => ({
                          ...currentDraft,
                          confirmNewPassword: event.target.value,
                        }))
                      }
                      className="pr-9"
                      disabled={isPasswordBusy}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowConfirmPwd((v) => !v)}
                      aria-label={showConfirmPwd ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
                <input
                  checked={passwordDraft.revokeOtherSessions}
                  type="checkbox"
                  onChange={(event) =>
                    setPasswordDraft((currentDraft) => ({
                      ...currentDraft,
                      revokeOtherSessions: event.target.checked,
                    }))
                  }
                  disabled={isPasswordBusy}
                  className="h-4 w-4 rounded border border-input accent-primary"
                />
                <span>Revogar outras sessões ao salvar</span>
              </label>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleRestorePasswordDraft}
                  disabled={isPasswordBusy}
                >
                  Limpar
                </Button>
                <Button type="submit" disabled={isPasswordBusy}>
                  {isChangingPassword ? "Atualizando..." : "Atualizar senha"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
