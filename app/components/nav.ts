import type { Cat, GameType } from "../lib/types";

export type Route =
  | { name: "home" }
  | { name: "list"; cat: "starline" | "gali" }
  | { name: "market"; gameId: number }
  | { name: "bet"; gameId: number; type: GameType }
  | { name: "chart"; gameId: number }
  | { name: "deposit" }
  | { name: "withdraw" }
  | { name: "bank" }
  | { name: "withdrawHistory" }
  | { name: "bids"; cat?: Cat }
  | { name: "wins" }
  | { name: "statement" }
  | { name: "rates" }
  | { name: "howto" }
  | { name: "notices" }
  | { name: "profile" }
  | { name: "contact" };

export interface Nav {
  push: (r: Route) => void;
  back: () => void;
  reset: (r: Route) => void;
  logout: () => void;
}

/** Signed-in player + app-level toast, provided by WordGameApp. */
export interface Session {
  uid: number;
  toast: (msg: string, tone?: "ok" | "bad") => void;
}
