import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginForm({ onSubmit, isLoading, formData, onChange, onSwitch }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={onChange}
        required
        autoFocus
      />
      <Input
        type="password"
        name="password"
        placeholder="Hasło"
        value={formData.password}
        onChange={onChange}
        required
      />
      <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
        {isLoading ? "Logowanie..." : "Zaloguj się"}
      </Button>
      <div className="text-sm text-center text-gray-500">
        Nie masz konta?{' '}
        <button type="button" onClick={onSwitch} className="text-blue-500 hover:text-blue-700 font-medium transition-colors">Zarejestruj się</button>
      </div>
    </form>
  );
}
