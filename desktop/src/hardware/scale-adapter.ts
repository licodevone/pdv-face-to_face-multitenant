import { Socket } from "node:net";

export interface ScaleReadInput {
  mode: "TCP" | "SERIAL" | "USB";
  host?: string;
  port?: number;
  path?: string;
  timeoutMs?: number;
}

export interface ScaleReading {
  weight: number;
  unit: "KG";
  source: string;
  raw: string;
  receivedAt: string;
}

const parseWeight = (raw: string): number => {
  const match = raw.replace(",", ".").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const readTcpScale = async (input: ScaleReadInput): Promise<ScaleReading> =>
  new Promise((resolve, reject) => {
    const host = input.host;
    const port = input.port;

    if (!host || !port) {
      reject(new Error("TCP scale requires host and port"));
      return;
    }

    const socket = new Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error("Scale read timeout"));
    }, input.timeoutMs ?? 3_000);

    socket.connect(port, host);
    socket.once("data", (data) => {
      clearTimeout(timeout);
      socket.destroy();
      const raw = data.toString("utf8").trim();
      resolve({
        weight: parseWeight(raw),
        unit: "KG",
        source: `${host}:${String(port)}`,
        raw,
        receivedAt: new Date().toISOString(),
      });
    });
    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

export const readScale = async (input: ScaleReadInput): Promise<ScaleReading> => {
  if (input.mode === "TCP") {
    return readTcpScale(input);
  }

  throw new Error(
    "Serial/USB scale driver must be configured for the selected manufacturer protocol",
  );
};
