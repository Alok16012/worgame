import type { Cat } from "../lib/types";

export type Route =
  | { name: "home" }
  | { name: "games"; cat?: Cat }
  | { name: "bid"; gameId: number }
  | { name: "results" }
  | { name: "wallet" }
  | { name: "addfunds" }
  | { name: "withdraw" }
  | { name: "bets" }
  | { name: "profile" }
  | { name: "notifications" }
  | { name: "howto" }
  | { name: "support" };

export interface Nav {
  push: (r: Route) => void;
  back: () => void;
  reset: (r: Route) => void;
  logout: () => void;
}

/** Signed-in player + app-level toast, provided by WordGameApp. */
export interface Session {
  uid: number;
  toast: (msg: string) => void;
}
