import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterForm({ onSubmit, isLoading, formData, onChange, onSwitch }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input
          type="text"
          name="firstName"
          placeholder="Imię"
          value={formData.firstName}
          onChange={onChange}
          required
          autoFocus
        />
        <Input
          type="text"
          name="lastName"
          placeholder="Nazwisko"
          value={formData.lastName}
          onChange={onChange}
          required
        />
      </div>
      <Input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={onChange}
        required
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
        {isLoading ? "Rejestracja..." : "Zarejestruj się"}
      </Button>
      <div className="text-sm text-center text-gray-500">
        Masz już konto?{' '}
        <button type="button" onClick={onSwitch} className="text-blue-500 hover:text-blue-700 font-medium transition-colors">Zaloguj się</button>
      </div>
    </form>
  );
}
