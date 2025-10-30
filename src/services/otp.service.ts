import { sendEmail } from "./mail.service";
import { Otp } from "../models/otp.schema";
import { OTP_EXPIRY_MS } from "../helpers/const";

export const sendOtpToUser = async (
  email: string,
  username: string
): Promise<void> => {
  const isDev = process.env.NODE_ENV === "development";
  const otp = isDev
    ? 123456
    : Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await Otp.deleteMany({ email });

  {
    !isDev &&
      (await sendEmail(
        email,
        "Your OTP Code",
        `<p>Your OTP is <strong>${otp}</strong>. It will expire in 1 minute.</p>`
      ));
  }
  console.log(`Email OTP ${otp} sent to ${email}`);

  await Otp.create({ otp, username, expiresAt });
};

export const validateOtp = async (
  username: string,
  otp: string
): Promise<boolean> => {
  const existingOtp = await Otp.findOne({ username, otp });

  if (!existingOtp) {
    console.warn(`OTP not found for ${username}`);
    return false;
  }

  const isExpired = new Date() > existingOtp.expiresAt;
  if (isExpired) {
    await Otp.deleteOne({ _id: existingOtp._id });
    console.warn(`Expired OTP for ${username}`);
    return false;
  }

  await Otp.deleteOne({ _id: existingOtp._id });
  return true;
};
