import NodeCache from "node-cache";

// Cache instances with 1 hour TTL
export const ipCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
export const blockedIpCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
export const allowedIpCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Helper function to create composite key
export const createCompositeKey = (
  ip: string,
  country: string,
  region: string,
  city: string
) => {
  return `${ip}-${country}-${region}-${city}`;
};

// Cache management functions
export const setBlockedIp = (ip: string, compositeKey: string) => {
  blockedIpCache.set(ip, true);
  blockedIpCache.set(compositeKey, true);
};

export const setAllowedIp = (ip: string, compositeKey: string) => {
  allowedIpCache.set(ip, true);
  allowedIpCache.set(compositeKey, true);
};

export const isIpBlocked = (ip: string): boolean => {
  return blockedIpCache.has(ip);
};

export const isIpAllowed = (ip: string): boolean => {
  return allowedIpCache.has(ip);
};

export const clearIpCache = (value: string, type?: "allow" | "block") => {
  const ipCache = type === "block" ? blockedIpCache : allowedIpCache;
  const keys = ipCache.keys();

  for (const key of keys) {
    const parts = key.split("-");
    if (parts.length >= 4) {
      if (parts.includes(value)) {
        const ip = parts[0];
        ipCache.del(ip);
        ipCache.del(key);
      }
    }
  }
};
