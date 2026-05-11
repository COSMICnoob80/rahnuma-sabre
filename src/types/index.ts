export interface Holding {
  id?: number;
  ticker: string;
  quantity: number;
  avg_buy_price: number;
  current_price: number | null;
  last_fetched: string | null;
}

export interface Expense {
  id?: number;
  amount: number;
  category: string;
  date: string;
}

export interface Income {
  id?: number;
  source: string;
  amount: number;
  date?: string;
}

export interface Settings {
  key: string;
  value: string;
}

export interface PortfolioSummary {
  totalCost: number;
  totalValue: number;
  gainLoss: number;
  gainLossPct: number;
}

export interface HoldingWithGain extends Holding {
  current_value: number;
  cost_basis: number;
  gain_loss: number;
  gain_loss_pct: number;
}
