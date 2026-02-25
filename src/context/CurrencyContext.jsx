import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const CURRENCIES = [
  { code: 'GHS', symbol: '₵', name: 'Ghana Cedi',          flag: '🇬🇭', locale: 'en-GH' },
  { code: 'USD', symbol: '$', name: 'US Dollar',            flag: '🇺🇸', locale: 'en-US' },
  { code: 'GBP', symbol: '£', name: 'British Pound',        flag: '🇬🇧', locale: 'en-GB' },
  { code: 'EUR', symbol: '€', name: 'Euro',                 flag: '🇪🇺', locale: 'de-DE' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira',       flag: '🇳🇬', locale: 'en-NG' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand',   flag: '🇿🇦', locale: 'en-ZA' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar',    flag: '🇨🇦', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar',   flag: '🇦🇺', locale: 'en-AU' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling',    flag: '🇰🇪', locale: 'sw-KE' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA',   flag: '🌍', locale: 'fr-SN' },
];

// Country code → currency code map for auto-detection
const COUNTRY_CURRENCY = {
  GH: 'GHS', US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD',
  NG: 'NGN', ZA: 'ZAR', KE: 'KES',
  SN: 'XOF', CI: 'XOF', BF: 'XOF', ML: 'XOF', NE: 'XOF', TG: 'XOF', BJ: 'XOF', GW: 'XOF',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', PT: 'EUR', IE: 'EUR',
};

// Fallback rates (USD base) — used if API call fails
const FALLBACK_RATES = {
  GHS: 15.5, USD: 1, GBP: 0.79, EUR: 0.92, NGN: 1580,
  ZAR: 18.5, CAD: 1.36, AUD: 1.53, KES: 130, XOF: 600,
};

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('vw_currency') || 'GHS';
  });
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const [detecting, setDetecting] = useState(false);

  // Fetch live exchange rates (USD base)
  useEffect(() => {
    const cached = sessionStorage.getItem('vw_rates');
    if (cached) {
      try { setRates(JSON.parse(cached)); setRatesLoaded(true); return; } catch {}
    }
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(data => {
        if (data?.rates) {
          setRates(data.rates);
          sessionStorage.setItem('vw_rates', JSON.stringify(data.rates));
        }
        setRatesLoaded(true);
      })
      .catch(() => { setRatesLoaded(true); }); // silently fall back
  }, []);

  // Auto-detect country on first visit
  useEffect(() => {
    if (localStorage.getItem('vw_currency')) return; // user already chose
    setDetecting(true);
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const detected = COUNTRY_CURRENCY[data?.country_code] || 'GHS';
        setCurrencyState(detected);
        localStorage.setItem('vw_currency', detected);
      })
      .catch(() => {}) // stay on GHS default
      .finally(() => setDetecting(false));
  }, []);

  const setCurrency = useCallback((code) => {
    setCurrencyState(code);
    localStorage.setItem('vw_currency', code);
  }, []);

  // Convert from USD to selected currency
  const convert = useCallback((usdAmount) => {
    const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
    return usdAmount * rate;
  }, [rates, currency]);

  // Format a USD amount into the selected currency string
  const formatPrice = useCallback((usdAmount) => {
    const cur = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
    const converted = convert(usdAmount);

    // For currencies with large numbers, no decimals
    const noDecimals = ['NGN', 'KES', 'XOF'].includes(currency);

    try {
      return new Intl.NumberFormat(cur.locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: noDecimals ? 0 : 2,
        maximumFractionDigits: noDecimals ? 0 : 2,
      }).format(converted);
    } catch {
      return `${cur.symbol}${converted.toFixed(noDecimals ? 0 : 2)}`;
    }
  }, [currency, convert]);

  const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  return (
    <CurrencyContext.Provider value={{
      currency, setCurrency, currencies: CURRENCIES,
      currentCurrency, formatPrice, convert,
      ratesLoaded, detecting,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
