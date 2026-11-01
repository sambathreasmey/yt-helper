import { API_BASE_URL } from "@/lib/api-config";

export type GoldUnit = "damlung" | "chi" | "hun";
export type GoldDirection = "ABOVE" | "BELOW";

export type GoldPrice = {
  price_per_damlung: string;
  source: string;
  updated_on: string;
};

export type GoldHolding = {
  id: number;
  unit: GoldUnit;
  quantity: string;
  remaining_quantity: string;
  remaining_hun: string;
  unit_price_per_damlung: string;
  total_cost: string;
  cost_basis: string;
  market_value: string | null;
  realized_profit_loss: string;
  unrealized_profit_loss: string | null;
  profit_loss: string | null;
  can_edit: boolean;
  note: string;
  created_on: string;
};

export type GoldTransaction = {
  id: string;
  record_id: number;
  type: "BUY" | "SELL";
  unit: GoldUnit;
  quantity: string;
  unit_price_per_damlung: string;
  total: string;
  profit_loss: string | null;
  note: string;
  created_on: string;
};

export type GoldOverview = {
  current_price: GoldPrice | null;
  summary: {
    quantity_hun: string;
    cost_basis: string;
    market_value: string | null;
    realized_profit_loss: string;
    unrealized_profit_loss: string | null;
    total_profit_loss: string | null;
    total_purchase_cost: string;
  };
  holdings: GoldHolding[];
  transactions: GoldTransaction[];
};

export type GoldPriceAlert = {
  id: number;
  target_price_per_damlung: string;
  direction: GoldDirection;
  created_on: string;
  triggered_on: string | null;
};

export type GoldTradeInput = {
  unit: GoldUnit;
  quantity: string;
  unit_price_per_damlung: string;
  note: string;
};

type ApiEnvelope<T> = {
  data?: T | null;
  message?: string;
};

async function request<T>(
  initData: string,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  if (!initData) throw new Error("Telegram session is not ready");

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/gold${path}`, {
      method: options.method || "GET",
      headers: {
        "X-Telegram-Init-Data": initData,
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error("Could not connect to the gold trading service");
  }

  let result: ApiEnvelope<T>;
  try {
    result = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error("The gold trading service returned an invalid response");
  }
  if (!response.ok) {
    throw new Error(
      typeof result.message === "string"
        ? result.message
        : `Request failed (${response.status})`,
    );
  }
  if (result.data === undefined) {
    throw new Error("The gold trading service response is missing data");
  }
  return result.data as T;
}

export const getGoldOverview = (
  initData: string,
  sortBy = "profit_loss",
  order = "desc",
): Promise<GoldOverview> =>
  request(initData, `/overview?sort_by=${sortBy}&order=${order}`);

export const getGoldAlerts = (initData: string): Promise<GoldPriceAlert[]> =>
  request(initData, "/alerts");

export const createGoldPurchase = (
  initData: string,
  input: GoldTradeInput,
): Promise<{ id: number; telegram_alert_sent: boolean }> =>
  request(initData, "/purchases", { method: "POST", body: input });

export const updateGoldPurchase = (
  initData: string,
  id: number,
  input: GoldTradeInput,
): Promise<{ id: number }> =>
  request(initData, `/purchases/${id}`, { method: "PUT", body: input });

export const deleteGoldPurchase = (initData: string, id: number): Promise<{ id: number }> =>
  request(initData, `/purchases/${id}`, { method: "DELETE" });

export const createGoldSale = (
  initData: string,
  input: GoldTradeInput,
): Promise<{ realized_profit_loss: string; telegram_alert_sent: boolean }> =>
  request(initData, "/sales", { method: "POST", body: input });

export const createGoldPriceAlert = (
  initData: string,
  targetPrice: string,
  direction: GoldDirection,
): Promise<{ id: number }> =>
  request(initData, "/alerts", {
    method: "POST",
    body: { target_price_per_damlung: targetPrice, direction },
  });

export const deleteGoldPriceAlert = (initData: string, id: number): Promise<{ id: number }> =>
  request(initData, `/alerts/${id}`, { method: "DELETE" });
