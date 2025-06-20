export const formatCurrency = (amount: number, options: { 
  showDecimals?: boolean;
  forceK?: boolean;
  showK?: boolean;
  compactNumbers?: boolean;
} = {}) => {
  const { showDecimals = true, forceK = false, showK = true, compactNumbers = true } = options;
  
  // If compact numbers is disabled, always show full amount
  if (!compactNumbers) {
    return amount.toLocaleString('en-AE', { 
      style: 'currency', 
      currency: 'AED',
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0
    });
  }
  
  // If amount is less than 1000 and not forced to show K, show full amount
  if (!forceK && Math.abs(amount) < 1000) {
    return amount.toLocaleString('en-AE', { 
      style: 'currency', 
      currency: 'AED',
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0
    });
  }
  
  // For amounts 1000+, show in K format only if showK is true and compactNumbers is enabled
  if (showK && compactNumbers && Math.abs(amount) >= 1000) {
    const kAmount = amount / 1000;
    if (Math.abs(kAmount) >= 100) {
      return `${kAmount.toFixed(0)}k AED`;
    } else if (Math.abs(kAmount) >= 10) {
      return `${kAmount.toFixed(1)}k AED`;
    } else {
      return `${kAmount.toFixed(2)}k AED`;
    }
  }
  
  // Fallback to full currency format
  return amount.toLocaleString('en-AE', { 
    style: 'currency', 
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

export const formatNumber = (num: number) => {
  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (Math.abs(num) >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

export const formatPercentage = (value: number, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};