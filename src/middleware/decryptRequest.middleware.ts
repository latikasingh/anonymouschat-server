import { NextFunction, Request, Response } from "express";
import { decryptData } from "../helpers/encryption";

function decryptRequest(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.body && req.body.data) {
      req.body = decryptData(req.body.data);
    }
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid encrypted data" });
  }
}

export default decryptRequest;
