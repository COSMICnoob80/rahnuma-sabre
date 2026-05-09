export function calculateCGT(
  buyPrice: number,
  sellPrice: number,
  quantity: number,
  holdingDays: number
): { gain: number; tax: number; netGain: number } {
  const gain = (sellPrice - buyPrice) * quantity;
  if (gain <= 0) return { gain, tax: 0, netGain: gain };

  // Pakistan CGT on PSX as per current rules
  // Holdings < 1y: 15% | 1-2y: 12.5% | 2-3y: 10% | 3-4y: 7.5% | 4-5y: 5% | 5-6y: 2.5% | >6y: 0%
  let rate = 0;
  const years = holdingDays / 365;
  if (holdingDays < 365) rate = 0.15;
  else if (years < 2) rate = 0.125;
  else if (years < 3) rate = 0.10;
  else if (years < 4) rate = 0.075;
  else if (years < 5) rate = 0.05;
  else if (years < 6) rate = 0.025;
  else rate = 0;

  const tax = gain * rate;
  return { gain, tax, netGain: gain - tax };
}

export function calculateSIP(
  monthlyInvestment: number,
  annualReturn: number,
  years: number
): { invested: number; returns: number; totalValue: number; yearlyData: { year: number; invested: number; value: number }[] } {
  const monthlyRate = annualReturn / 100 / 12;
  const totalMonths = years * 12;
  const yearlyData: { year: number; invested: number; value: number }[] = [];

  for (let y = 1; y <= years; y++) {
    const m = y * 12;
    const invested = monthlyInvestment * m;
    const value = monthlyInvestment * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate);
    yearlyData.push({ year: y, invested, value: Math.round(value) });
  }

  const invested = monthlyInvestment * totalMonths;
  const totalValue = yearlyData[yearlyData.length - 1]?.value ?? 0;
  return { invested, returns: totalValue - invested, totalValue, yearlyData };
}

export function calculateDHAROI(
  buyPrice: number,
  currentValue: number,
  yearsHeld: number
): { totalReturn: number; annualizedReturn: number; gain: number } {
  const gain = currentValue - buyPrice;
  const totalReturn = (gain / buyPrice) * 100;
  const annualizedReturn = yearsHeld > 0
    ? (Math.pow(currentValue / buyPrice, 1 / yearsHeld) - 1) * 100
    : 0;
  return { totalReturn, annualizedReturn, gain };
}

export function calculateDevaluation(
  currentPkrValue: number,
  devaluationPct: number
): { newValue: number; loss: number; usdEquivalent: number; impliedUsdRate: number } {
  const currentUsdRate = 280;
  const newUsdRate = currentUsdRate * (1 + devaluationPct / 100);
  const usdEquivalent = currentPkrValue / currentUsdRate;
  const newValue = usdEquivalent * newUsdRate;
  return {
    newValue: Math.round(newValue),
    loss: Math.round(currentPkrValue - newValue),
    usdEquivalent,
    impliedUsdRate: newUsdRate,
  };
}

export function calculateFIRE(
  monthlyExpenses: number,
  currentSavings: number,
  monthlySavings: number,
  expectedReturn: number
): { targetCorpus: number; yearsToFire: number; progressPct: number } {
  const targetCorpus = monthlyExpenses * 12 * 25;
  const progressPct = Math.min((currentSavings / targetCorpus) * 100, 100);

  if (currentSavings >= targetCorpus) return { targetCorpus, yearsToFire: 0, progressPct: 100 };

  const monthlyRate = expectedReturn / 100 / 12;
  const monthlyTarget = targetCorpus;

  let years = 0;
  let fv = currentSavings;
  const maxYears = 100;
  while (fv < monthlyTarget && years < maxYears) {
    for (let m = 0; m < 12; m++) {
      fv = fv * (1 + monthlyRate) + monthlySavings;
    }
    years++;
  }

  return { targetCorpus, yearsToFire: years >= maxYears ? -1 : years, progressPct };
}

export function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
