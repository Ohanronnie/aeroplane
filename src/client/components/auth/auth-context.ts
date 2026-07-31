import { createContext, useContext } from "react";
import type { AuthStatus } from "../../api";

export const AuthStatusContext = createContext<AuthStatus | null>(null);

export function useAuthStatus() {
  return useContext(AuthStatusContext);
}
