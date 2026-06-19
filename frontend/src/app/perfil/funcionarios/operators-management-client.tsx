"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

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

import {
  createOperator,
  getCurrentOperator,
  listOperators,
  OperatorProfile,
  updateOperator,
} from "@/lib/api";
import { formatOperatorRoleLabel, OPERATOR_ROLE_OPTIONS } from "@/lib/operator-roles";

interface OperatorDraft {
  name: string;
  email: string;
  image: string;
  role: OperatorProfile["role"];
}

interface CreateOperatorDraft extends OperatorDraft {
  password: string;
}

const createEmptyOperatorDraft = (): CreateOperatorDraft => ({
  name: "",
  email: "",
  image: "",
  password: "",
  role: "CASHIER",
});

const createDraftFromOperator = (operator: OperatorProfile): OperatorDraft => ({
  name: operator.name,
  email: operator.email,
  image: operator.image ?? "",
  role: operator.role,
});

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(new Date(value));

export function OperatorsManagementClientPage() {
  const [currentOperator, setCurrentOperator] = useState<OperatorProfile | null>(null);
  const [operators, setOperators] = useState<OperatorProfile[]>([]);
  const [newOperatorDraft, setNewOperatorDraft] = useState<CreateOperatorDraft>(createEmptyOperatorDraft);
  const [editingOperatorId, setEditingOperatorId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<OperatorDraft | null>(null);
  const [message, setMessage] = useState("Carregando funcionarios do tenant...");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewOperatorPwd, setShowNewOperatorPwd] = useState(false);

  const loadOperators = async (successMessage = "Funcionarios carregados com sucesso.") => {
    setIsLoading(true);

    try {
      const [loadedCurrentOperator, loadedOperators] = await Promise.all([
        getCurrentOperator(),
        listOperators(),
      ]);
      setCurrentOperator(loadedCurrentOperator);
      setOperators(loadedOperators);
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os funcionarios.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOperators();
  }, []);

  const handleCreateOperator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const operator = await createOperator({
        name: newOperatorDraft.name.trim(),
        email: newOperatorDraft.email.trim().toLowerCase(),
        image: newOperatorDraft.image.trim() || null,
        password: newOperatorDraft.password,
        role: newOperatorDraft.role,
      });

      setOperators((currentOperators) =>
        [...currentOperators, operator].sort((left, right) =>
          left.name.localeCompare(right.name, "pt-BR"),
        ),
      );
      setNewOperatorDraft(createEmptyOperatorDraft());
      setMessage(`Funcionario ${operator.name} cadastrado com sucesso.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel cadastrar o funcionario.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOperator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingOperatorId || !editingDraft) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedOperator = await updateOperator(editingOperatorId, {
        name: editingDraft.name.trim(),
        email: editingDraft.email.trim().toLowerCase(),
        image: editingDraft.image.trim() || null,
        role: editingDraft.role,
      });

      setOperators((currentOperators) =>
        currentOperators.map((operator) => (operator.id === updatedOperator.id ? updatedOperator : operator)),
      );
      setEditingOperatorId(null);
      setEditingDraft(null);
      setMessage(`Funcionario ${updatedOperator.name} atualizado com sucesso.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar o funcionario.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (operator: OperatorProfile) => {
    setEditingOperatorId(operator.id);
    setEditingDraft(createDraftFromOperator(operator));
  };

  const handleCancelEdit = () => {
    setEditingOperatorId(null);
    setEditingDraft(null);
    setMessage("Edicao cancelada.");
  };

  const adminCount = operators.filter((operator) => operator.role === "ADMIN").length;

  return (
    <main className="profile-page">
      <section className="profile-shell">
        <header className="pdv-topbar">
          <div className="topbar-brand">
            <BrandLogo className="topbar-logo" color="#ffffff" />
            <div>
              <p className="eyebrow">Gestão do tenant</p>
              <h1>Funcionários</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => void loadOperators("Lista de funcionarios atualizada.")}
              disabled={isLoading || isSaving}
            >
              Atualizar
            </button>
            <Link className="secondary-button" href="/perfil">
              Voltar
            </Link>
          </div>
        </header>

        <section className="profile-status-strip panel-card">
          <p className="text-sm text-accent font-medium">
            <strong>Status:</strong> {message}
          </p>
          <p className="text-sm text-muted">
            <strong>Administrador atual:</strong> {currentOperator?.email ?? "Aguardando autenticacao"}
          </p>
        </section>

        <div className="profile-layout operator-admin-row">
          <aside className="profile-summary-card panel-card">
            <div className="profile-card-heading">
              <h3 className="font-semibold text-foreground">Resumo da equipe</h3>
              <p className="text-xs text-muted">Visao geral dos operadores do tenant</p>
            </div>

            <div className="profile-avatar-preview mx-auto">
              {operators.length}
            </div>

            <div className="profile-summary-list">
              <div>
                <strong>Total de funcionarios</strong>
                <span>{operators.length}</span>
              </div>
              <div>
                <strong>Administradores</strong>
                <span>{adminCount}</span>
              </div>
              <div>
                <strong>Seu acesso</strong>
                <span>{currentOperator ? formatOperatorRoleLabel(currentOperator.role) : "Nao carregado"}</span>
              </div>
            </div>

            <p className="profile-helper-text">
              Funcionarios e estoquistas acessam apenas o proprio perfil. A gestao da equipe fica
              disponivel somente para administradores.
            </p>
          </aside>

          <div className="profile-main-column">
            <form className="profile-form-card panel-card operator-admin-form" onSubmit={(event) => void handleCreateOperator(event)}>
              <div className="profile-card-heading">
                <h3 className="font-bold text-foreground">Novo funcionario</h3>
                <p className="profile-helper-text">Cadastre o operador com senha inicial e o perfil desejado.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <label className="block">
                  <span className="block text-sm font-medium text-foreground mb-1">Nome completo</span>
                  <input
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent"
                    value={newOperatorDraft.name}
                    onChange={(event) =>
                      setNewOperatorDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))
                    }
                    disabled={isLoading || isSaving}
                    required
                  />
                </label>

                <label className="block">
                  <span className="block text-sm font-medium text-foreground mb-1">E-mail de acesso</span>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent"
                    value={newOperatorDraft.email}
                    onChange={(event) =>
                      setNewOperatorDraft((currentDraft) => ({ ...currentDraft, email: event.target.value }))
                    }
                    disabled={isLoading || isSaving}
                    required
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <label className="block">
                  <span className="block text-sm font-medium text-foreground mb-1">Senha inicial</span>
                  <div className="relative flex items-center">
                    <input
                      type={showNewOperatorPwd ? "text" : "password"}
                      minLength={8}
                      className="w-full px-3 py-2 pr-10 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent"
                      value={newOperatorDraft.password}
                      onChange={(event) =>
                        setNewOperatorDraft((currentDraft) => ({ ...currentDraft, password: event.target.value }))
                      }
                      disabled={isLoading || isSaving}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewOperatorPwd((v) => !v)}
                      aria-label={showNewOperatorPwd ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showNewOperatorPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="block text-sm font-medium text-foreground mb-1">Perfil de acesso</span>
                  <select
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent"
                    value={newOperatorDraft.role}
                    onChange={(event) =>
                      setNewOperatorDraft((currentDraft) => ({
                        ...currentDraft,
                        role: event.target.value as OperatorProfile["role"],
                      }))
                    }
                    disabled={isLoading || isSaving}
                  >
                    {OPERATOR_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block mb-4">
                <span className="block text-sm font-medium text-foreground mb-1">Imagem do operador (URL)</span>
                <input
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                  inputMode="url"
                  placeholder="https://exemplo.com/avatar.png"
                  value={newOperatorDraft.image}
                  onChange={(event) =>
                    setNewOperatorDraft((currentDraft) => ({ ...currentDraft, image: event.target.value }))
                  }
                  disabled={isLoading || isSaving}
                />
              </label>

              <div className="horizontal-actions">
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isLoading || isSaving}
                >
                  {isSaving ? "Cadastrando..." : "Cadastrar funcionario"}
                </button>
              </div>
            </form>

            <div className="profile-main-column">
              {operators.map((operator) => (
                <article key={operator.id} className="profile-form-card panel-card">
                  {editingOperatorId === operator.id && editingDraft ? (
                    <form onSubmit={(event) => void handleEditOperator(event)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="block text-sm font-medium text-foreground mb-1">Nome</span>
                          <input
                            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent"
                            value={editingDraft.name}
                            onChange={(event) =>
                              setEditingDraft((currentDraft) =>
                                currentDraft ? { ...currentDraft, name: event.target.value } : null
                              )
                            }
                            disabled={isLoading || isSaving}
                            required
                          />
                        </label>

                        <label className="block">
                          <span className="block text-sm font-medium text-foreground mb-1">E-mail</span>
                          <input
                            type="email"
                            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent"
                            value={editingDraft.email}
                            onChange={(event) =>
                              setEditingDraft((currentDraft) =>
                                currentDraft ? { ...currentDraft, email: event.target.value } : null
                              )
                            }
                            disabled={isLoading || isSaving}
                            required
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="block text-sm font-medium text-foreground mb-1">Perfil</span>
                        <select
                          className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-accent"
                          value={editingDraft.role}
                          onChange={(event) =>
                            setEditingDraft((currentDraft) =>
                              currentDraft ? { ...currentDraft, role: event.target.value as OperatorProfile["role"] } : null
                            )
                          }
                          disabled={isLoading || isSaving}
                        >
                          {OPERATOR_ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="horizontal-actions no-action">
                        <button className="ghost-button" type="button" onClick={handleCancelEdit}>
                          Cancelar
                        </button>
                        <button className="primary-button" type="submit" disabled={isLoading || isSaving}>
                          {isSaving ? "Salvando..." : "Salvar"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <div className="side-card-header">
                        <div>
                          <h3>{operator.name}</h3>
                          <span>{operator.email}</span>
                        </div>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => handleStartEdit(operator)}
                          disabled={isLoading || isSaving}
                        >
                          Editar
                        </button>
                      </div>
                      <p className="profile-helper-text">{formatOperatorRoleLabel(operator.role)}</p>
                      <div className="profile-summary-list">
                        <div>
                          <strong>Cadastrado</strong>
                          <span>{formatDateTime(operator.createdAt)}</span>
                        </div>
                        <div>
                          <strong>Atualizado</strong>
                          <span>{formatDateTime(operator.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
