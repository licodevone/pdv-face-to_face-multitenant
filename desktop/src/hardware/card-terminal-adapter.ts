export interface CardPaymentInput {
  amountInCents: number;
  method: "CARD" | "CONTACTLESS" | "DIGITAL_WALLET";
  terminalId: string;
}

export interface CardPaymentOutput {
  status: "APPROVED" | "DENIED" | "PENDING";
  provider: string;
  terminalId: string;
  externalTransactionId: string;
  authorizedAmountInCents: number;
  authorizedAt: string;
}

export const startCardPayment = (
  input: CardPaymentInput,
): CardPaymentOutput => ({
  status: "APPROVED",
  provider: "TEF_SIMULATED",
  terminalId: input.terminalId,
  externalTransactionId: `TEF-${String(Date.now())}`,
  authorizedAmountInCents: input.amountInCents,
  authorizedAt: new Date().toISOString(),
});
