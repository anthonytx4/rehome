import { useEffect, useState } from 'react';
import api from '../api/client';

let cachedConfig = null;
let configPromise = null;

const defaultConfig = {
  configured: false,
  publishableKey: null,
  provider: null,
};

function loadPaymentConfig() {
  if (cachedConfig) return Promise.resolve(cachedConfig);

  if (!configPromise) {
    configPromise = api
      .get('/payments/config')
      .then((res) => {
        cachedConfig = { ...defaultConfig, ...res.data };
        return cachedConfig;
      })
      .catch(() => {
        cachedConfig = defaultConfig;
        return cachedConfig;
      });
  }

  return configPromise;
}

export function usePaymentConfig() {
  const [config, setConfig] = useState(cachedConfig || defaultConfig);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    let cancelled = false;

    loadPaymentConfig().then((value) => {
      if (!cancelled) {
        setConfig(value);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...config,
    loading,
  };
}

export default usePaymentConfig;
