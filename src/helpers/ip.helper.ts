import { Request } from "express";
import axios from "axios";
import { ipCache } from "./cache.helper";

export const getClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"] as string | undefined;
  return forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress || "";
};

interface IpInfoResult {
  country: string;
  region: string;
  city: string;
}

export const ipInfo = async (ip: string): Promise<IpInfoResult | false> => {
  try {
    const cachedData = ipCache.get<IpInfoResult>(ip);
    if (cachedData) {
      return cachedData;
    }

    const response = await axios.get<{
      country: string;
      region: string;
      city: string;
    }>(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`);

    const result = {
      country: response.data.country,
      region: response.data.region,
      city: response.data.city,
    };

    ipCache.set(ip, result);

    return result;
  } catch (error) {
    console.error("IP lookup failed", error);
    return false;
  }
};
