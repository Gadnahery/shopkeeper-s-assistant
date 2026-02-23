export function calcMarginPercent(buyingPrice: number, sellingPrice: number) {
  if (!buyingPrice) return 0;
  return ((sellingPrice - buyingPrice) / buyingPrice) * 100;
}

export function calcInventoryValue(stock: number, buyingPrice: number) {
  return Number(stock || 0) * Number(buyingPrice || 0);
}

export function calcRetailValue(stock: number, sellingPrice: number) {
  return Number(stock || 0) * Number(sellingPrice || 0);
}

export function calcPotentialProfit(stock: number, buyingPrice: number, sellingPrice: number) {
  return calcRetailValue(stock, sellingPrice) - calcInventoryValue(stock, buyingPrice);
}
