import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface User {
  email: string;
  password: string;
}
const users: User[] = [{ email: "a@g", password: "123" }];

function AuthPage({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const user = users.find((u) => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem("user_email", email);
      onAuth(user);
    } else {
      setError("Invalid email or password.");
    }
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const userExists = users.some((u) => u.email === email);
    if (userExists) {
      setError("User already exists.");
      return;
    }
    users.push({ email, password });
    localStorage.setItem("user_email", email);
    setSignupSuccess(true);
    setTimeout(() => {
      setSignupSuccess(false);
      setMode("login");
      setEmail("");
      setPassword("");
      // Don't auto-login after signup
    }, 1200);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Card className="w-full max-w-sm p-6">
        <Tabs value={mode} onValueChange={(value: string) => setMode(value as "login" | "signup")}>
          <TabsList className="w-full grid grid-cols-2 mb-5">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          {/* LOGIN FORM */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                autoFocus={mode === "login"}
                required
              />

              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </TabsContent>

          {/* SIGNUP FORM */}
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                autoFocus={mode === "signup"}
                required
              />

              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />

              {error && <div className="text-red-500 text-sm">{error}</div>}
              {signupSuccess && <div className="text-green-600 text-sm">Signup successful! You can log in.</div>}

              <Button type="submit" className="w-full">
                Sign up
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

export default AuthPage;
