import crypto from "crypto";

const SECRET_KEY = "12345678901234567890123456789012";
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

export const encryptData = (text: string): string => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(SECRET_KEY, "utf8"),
      iv
    );

    const dataToEncrypt =
      typeof text === "object" ? JSON.stringify(text) : text;
    let encrypted = cipher.update(dataToEncrypt, "utf8", "base64");
    encrypted += cipher.final("base64");

    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:backend:", error);
    throw new Error("Encryption failed:backend:");
  }
};

export const decryptData = (token: string): string => {
  try {
    if (!token) return "";

    const parts = token.split(":");
    if (parts.length !== 2) throw new Error("Invalid encrypted data format");

    const [ivHex, encryptedData] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(SECRET_KEY, "utf8"),
      iv
    );

    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    console.error("Decryption error:backend:", error);
    throw new Error("Decryption failed :backend");
  }
};
