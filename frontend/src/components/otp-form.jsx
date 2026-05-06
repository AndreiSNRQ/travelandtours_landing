import { useForm } from "react-hook-form";
import { useState, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useNavigate } from "react-router";
import AuthContext from "../context/AuthProvider";

export function OTPForm(props) {
  const { handleSubmit, setValue, formState: { isSubmitting } } = useForm();
  const { verifyLoginOtp, resendOtpCode, resendingOtp, cooldownOtp, logout, pendingOtp } = useContext(AuthContext);
  const [expiryTimeLeft, setExpiryTimeLeft] = useState(0);

  useEffect(() => {
    if (!pendingOtp?.expires_at) return;

    const expiry = new Date(pendingOtp.expires_at).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiry - now;

      if (distance < 0) {
        setExpiryTimeLeft(0);
        clearInterval(interval);
      } else {
        setExpiryTimeLeft(Math.floor(distance / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingOtp]);

  const onSubmit = async (credentials) => {
    if (!credentials?.otp) return;
    await verifyLoginOtp(credentials.otp);
  };

  const handleResend = async () => {
    await resendOtpCode();
  }

  return (
    <Card {...props} className="w-full">
      <CardHeader>
        <CardTitle>Enter verification code</CardTitle>
        <CardDescription>We sent a 6-digit code to your email.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="otp">Verification code</FieldLabel>

              <div className="flex justify-center min-w-fit w-full">
                <InputOTP
                  maxLength={6}
                  minLength={6}
                  id="otp"
                  required
                  onChange={(value) => setValue("otp", value)}
                >
                  <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <FieldDescription>
                Enter the 6-digit code sent to your email.
                {expiryTimeLeft > 0 ? (
                  <span className="block text-red-500 font-semibold mt-1">
                    Expires in: {expiryTimeLeft}s
                  </span>
                ) : (
                  <span className="block text-gray-500 mt-1">
                    OTP Expired. Please resend.
                  </span>
                )}
              </FieldDescription>
            </Field>

            <FieldGroup className="mt-4">
              <Button type="submit" disabled={isSubmitting || expiryTimeLeft === 0}>
                {isSubmitting ? "Verifying..." : "Verify"}
              </Button>

              <FieldDescription className="text-center mt-2">
                Didn&apos;t receive the code?{" "}
                <span className="cursor-pointer underline underline-offset-4 hover:text-pink-500"
                  onClick={() => handleResend()}>{
                    resendingOtp
                      ? "Sending..."
                      : cooldownOtp > 0
                        ? `Resend OTP (${cooldownOtp}s)`
                        : "Resend OTP"
                  }
                </span>
              </FieldDescription>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
