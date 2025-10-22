import { Request, Response } from "express";
import { getClientIp, ipInfo } from "../helpers/ip.helper";
import { BlockedIp } from "../models/blockedIp.schema";
import {
  createCompositeKey,
  isIpBlocked,
  isIpAllowed,
  setBlockedIp,
  setAllowedIp,
} from "../helpers/cache.helper";

const ipChecker = async (req: Request, res: Response, next: Function) => {
  const ip =
    process.env.NODE_ENV === "development"
      ? process.env.DEV_PUBLIC_IP!
      : getClientIp(req);

  if (req.user.role === "admin") {
    return next();
  }

  if (!ip) {
    res.status(400).json({ message: "IP address not found" });
    return;
  }

  // Check if IP is blocked in cache
  if (isIpBlocked(ip)) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  // Check if IP is allowed in cache
  if (isIpAllowed(ip)) {
    next();
    return;
  }

  const location = await ipInfo(ip);
  if (!location) {
    res.status(400).json({ message: "Could not retrieve IP location info" });
    return;
  }

  const compositeKey = createCompositeKey(
    ip,
    location.country,
    location.region,
    location.city
  );

  const query = {
    $or: [
      { value: location.country, type: "country" },
      { value: location.region, type: "region" },
      { value: location.city, type: "city" },
      { value: ip, type: "ip" },
    ],
  };

  const hasValue = await BlockedIp.exists(query);

  if (hasValue) {
    setBlockedIp(ip, compositeKey);
    res.status(403).json({ message: "Access denied" });
    return;
  }

  setAllowedIp(ip, compositeKey);
  next();
};

export default ipChecker;
