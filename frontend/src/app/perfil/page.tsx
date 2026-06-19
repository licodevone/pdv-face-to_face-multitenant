"use client";

import Link from "next/link";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

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
              <p className="eyebrow">Gerenciamento de conta</p>
              <h1>Seu Perfil</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <Link className="secondary-button" href="/pdv">
              Voltar
            </Link>

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
                <button
                  className="operator-menu-item"
                  type="button"
                  onClick={() => void handleRefreshProfileFromMenu()}
                  disabled={isLoading || isSavingProfile || isChangingPassword}
                >
                  Atualizar
                </button>
                {hasManagerAccess ? (
                  <Link
                    className="operator-menu-item"
                    href="/perfil/funcionarios"
                    onClick={closeOperatorMenu}
                  >
                    Funcionários
                  </Link>
                ) : null}
                <hr className="operator-menu-divider" />
                <button
                  className="operator-menu-item danger"
                  type="button"
                  onClick={() => {
                    closeOperatorMenu();
                  }}
                >
                  Sair
                </button>
              </div>
            </details>
          </div>
        </header>

        {message && (
          <div className="profile-status-strip panel-card">
            <p className="profile-helper-text">{message}</p>
          </div>
        )}

        <div className="profile-layout">
          <aside className="profile-summary-card panel-card">
            <div className="profile-card-heading">
              <p className="eyebrow">Resumo da Conta</p>
              <p className="profile-helper-text">Dados da sessão autenticada</p>
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
                <p className="eyebrow">Dados do cadastro</p>
                <p className="profile-helper-text">Essas informações alimentam o topo do PDV e o cadastro do operador.</p>
              </div>

              <div className="form-columns two-columns-form mb-4">
                <label>
                  Nome completo
                  <input
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

                <label>
                  E-mail de acesso
                  <input
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

              <label className="mb-4">
                Imagem do operador (URL)
                <input
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
                <label className="mb-4">
                  Perfil de acesso
                  <select
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
                  </select>
                </label>
              )}

              <div className="horizontal-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={handleRestoreDraft}
                  disabled={!operator || isProfileBusy}
                >
                  Restaurar
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isProfileBusy || !operator}
                >
                  {isSavingProfile ? "Salvando..." : "Salvar perfil"}
                </button>
              </div>
            </form>

            <form
              className="profile-form-card panel-card"
              onSubmit={(event) => void handlePasswordSubmit(event)}
            >
              <div className="profile-card-heading">
                <p className="eyebrow">Alterar senha</p>
                <p className="profile-helper-text">Mínimo de 8 caracteres. A nova senha precisa ser confirmada.</p>
              </div>

              <div className="form-columns three-columns-form mb-4">
                <label>
                  Senha atual
                  <div className="pwd-wrap">
                    <input
                      autoComplete="current-password"
                      type={showCurrentPwd ? "text" : "password"}
                      value={passwordDraft.currentPassword}
                      onChange={(event) =>
                        setPasswordDraft((currentDraft) => ({
                          ...currentDraft,
                          currentPassword: event.target.value,
                        }))
                      }
                      disabled={isPasswordBusy}
                      required
                    />
                    <button
                      type="button"
                      className="pwd-toggle"
                      onClick={() => setShowCurrentPwd((v) => !v)}
                      aria-label={showCurrentPwd ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <label>
                  Nova senha
                  <div className="pwd-wrap">
                    <input
                      autoComplete="new-password"
                      type={showNewPwd ? "text" : "password"}
                      value={passwordDraft.newPassword}
                      onChange={(event) =>
                        setPasswordDraft((currentDraft) => ({
                          ...currentDraft,
                          newPassword: event.target.value,
                        }))
                      }
                      disabled={isPasswordBusy}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="pwd-toggle"
                      onClick={() => setShowNewPwd((v) => !v)}
                      aria-label={showNewPwd ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <label>
                  Confirmar nova senha
                  <div className="pwd-wrap">
                    <input
                      autoComplete="new-password"
                      type={showConfirmPwd ? "text" : "password"}
                      value={passwordDraft.confirmNewPassword}
                      onChange={(event) =>
                        setPasswordDraft((currentDraft) => ({
                          ...currentDraft,
                          confirmNewPassword: event.target.value,
                        }))
                      }
                      disabled={isPasswordBusy}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="pwd-toggle"
                      onClick={() => setShowConfirmPwd((v) => !v)}
                      aria-label={showConfirmPwd ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
              </div>

              <label className="profile-checkbox-field mb-4">
                <div className="profile-checkbox-row">
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
                  />
                  <span>Revogar outras sessões ao salvar</span>
                </div>
              </label>

              <div className="horizontal-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={handleRestorePasswordDraft}
                  disabled={isPasswordBusy}
                >
                  Limpar
                </button>
                <button className="primary-button" type="submit" disabled={isPasswordBusy}>
                  {isChangingPassword ? "Atualizando..." : "Atualizar senha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
