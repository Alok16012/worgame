import type { State, User } from "./types";

/** Name + logo shown when the app runs in Educational Quiz mode (Play Store safe build). */
export const QUIZ_APP_NAME = "Triviaverse";
export const QUIZ_LOGO = "/quiz-logo.png";

/** Quiz mode for a player: their own flag wins, otherwise the system default. */
export function isQuizMode(state: Pick<State, "settings">, user?: Pick<User, "betting"> | null): boolean {
  return user ? !(user.betting ?? true) : !!state.settings.bettingDisabled;
}

/** App name to show for the current mode. */
export function brandName(state: Pick<State, "settings">, user?: Pick<User, "betting"> | null): string {
  return isQuizMode(state, user) ? state.settings.quizAppName?.trim() || QUIZ_APP_NAME : state.settings.appName;
}
