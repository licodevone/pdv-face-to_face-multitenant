import { OperatorRole } from "./api";

export const OPERATOR_ROLE_OPTIONS: Array<{
  value: OperatorRole;
  label: string;
}> = [
  { value: "ADMIN", label: "Administrador" },
  { value: "MANAGER", label: "Gerente" },
  { value: "CASHIER", label: "Funcionario" },
  { value: "STOCKIST", label: "Estoquista" },
];

export const formatOperatorRoleLabel = (role: OperatorRole): string =>
  OPERATOR_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;

export const hasManagerLevelAccess = (role: OperatorRole | null | undefined): boolean =>
  role === "ADMIN" || role === "MANAGER";

export const canEditOwnOperatorRole = (role: OperatorRole | null | undefined): boolean =>
  role === "ADMIN";
