import React, { useState } from "react";
import Header from "@/components/core1/header";
import Footer from "@/components/core1/footer";
import FadeIn from "@/components/core1/fade-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { registerCustomer } from "@/api/auth";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    try {
      setLoading(true);
      await registerCustomer(form);
      setOk("Account created! You can now log in.");
      setForm({ name: "", email: "", password: "", password_confirmation: "" });
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        Object.values(e2?.response?.data?.errors || {})?.[0]?.[0] ||
        "Registration failed.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="max-w-[1920px] w-full">
        <Header />

        <div className="p-6 flex justify-center">
          <FadeIn className="w-full max-w-xl">
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-1">Create account</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Register as a customer so you can book tours.
                </p>

                {err && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{err}</div>}
                {ok && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{ok}</div>}

                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full name</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={onChange}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={onChange}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm password</label>
                    <input
                      name="password_confirmation"
                      type="password"
                      value={form.password_confirmation}
                      onChange={onChange}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>

                  <Button disabled={loading} className="w-full">
                    {loading ? "Creating..." : "Create account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        <Footer />
      </div>
    </div>
  );
}
