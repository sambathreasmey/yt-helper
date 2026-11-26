import type {
  GoldOverview,
  GoldPricePerformance,
  GoldPricePerformancePeriod,
} from "@/services/gold-trading-api";

const PERFORMANCE_PERIODS: GoldPricePerformancePeriod[] = [
  "today",
  "7_days",
  "30_days",
  "6_months",
  "1_year",
  "5_years",
];

function roundHalfUp(value: number, digits: number): number {
  const factor = 10 ** digits;
  const rounded = Math.floor(Math.abs(value) * factor + 0.5 + Number.EPSILON);
  return Math.sign(value) * rounded / factor;
}

function money(value: number): string | null {
  return Number.isFinite(value) ? roundHalfUp(value, 6).toFixed(6) : null;
}

function sortByProfitLoss<T extends { profit_loss: string | null }>(
  values: T[],
  order: string,
): T[] {
  return [...values].sort((left, right) => {
    const leftValue = left.profit_loss === null ? Number.NaN : Number(left.profit_loss);
    const rightValue = right.profit_loss === null ? Number.NaN : Number(right.profit_loss);
    const leftAvailable = Number.isFinite(leftValue);
    const rightAvailable = Number.isFinite(rightValue);
    if (leftAvailable !== rightAvailable) return leftAvailable ? -1 : 1;
    if (!leftAvailable || !rightAvailable) return 0;
    return (leftValue - rightValue) * (order === "desc" ? -1 : 1);
  });
}

function revaluePerformance(
  performance: GoldPricePerformance | undefined,
  previousPrice: number,
  currentPrice: number,
): GoldPricePerformance | undefined {
  if (!performance || !Number.isFinite(previousPrice) || previousPrice <= 0) return performance;

  const updated = { ...performance };
  for (const period of PERFORMANCE_PERIODS) {
    const change = performance[period];
    if (change.amount === null) continue;
    const baseline = previousPrice - Number(change.amount);
    if (!Number.isFinite(baseline) || baseline <= 0) continue;

    const amount = roundHalfUp(currentPrice - baseline, 2);
    const percentage = roundHalfUp((amount / baseline) * 100, 2);
    updated[period] = {
      amount: amount.toFixed(2),
      percentage: percentage.toFixed(2),
    };
  }
  return updated;
}

/** Recalculates the price-derived fields using the live quote without another overview request. */
export function revalueGoldOverview(
  overview: GoldOverview,
  currentPrice: number,
  sortBy: string,
  order: string,
): GoldOverview {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return overview;

  const holdings = overview.holdings.map((holding) => {
    const remainingHun = Number(holding.remaining_hun);
    const costBasis = Number(holding.cost_basis);
    const realizedProfitLoss = Number(holding.realized_profit_loss);
    const marketValue = money((remainingHun / 100) * currentPrice);
    const unrealized = marketValue === null || !Number.isFinite(costBasis)
      ? null
      : money(Number(marketValue) - costBasis);
    const profitLoss = unrealized === null || !Number.isFinite(realizedProfitLoss)
      ? null
      : money(realizedProfitLoss + Number(unrealized));

    return {
      ...holding,
      market_value: marketValue,
      unrealized_profit_loss: unrealized,
      profit_loss: profitLoss,
    };
  });

  const holdingsById = new Map(holdings.map((holding) => [holding.id, holding]));
  const transactions = overview.transactions.map((transaction) => {
    if (transaction.type !== "BUY") return transaction;
    const holding = holdingsById.get(transaction.record_id);
    return holding
      ? { ...transaction, profit_loss: holding.unrealized_profit_loss }
      : transaction;
  });

  const summaryMarketValue = money(
    (Number(overview.summary.quantity_hun) / 100) * currentPrice,
  );
  const summaryUnrealized = summaryMarketValue !== null
    && holdings.every((holding) => holding.unrealized_profit_loss !== null)
    ? money(holdings.reduce(
      (total, holding) => total + Number(holding.unrealized_profit_loss),
      0,
    ))
    : null;
  const realizedProfitLoss = Number(overview.summary.realized_profit_loss);
  const totalProfitLoss = summaryUnrealized === null || !Number.isFinite(realizedProfitLoss)
    ? null
    : money(realizedProfitLoss + Number(summaryUnrealized));

  return {
    ...overview,
    price_performance: revaluePerformance(
      overview.price_performance,
      Number(overview.current_price?.price_per_damlung),
      currentPrice,
    ),
    summary: {
      ...overview.summary,
      market_value: summaryMarketValue,
      unrealized_profit_loss: summaryUnrealized,
      total_profit_loss: totalProfitLoss,
    },
    holdings: sortBy === "profit_loss" ? sortByProfitLoss(holdings, order) : holdings,
    transactions: sortBy === "profit_loss" ? sortByProfitLoss(transactions, order) : transactions,
  };
}
