// Never enable fixture responses in a production build, even with DEV=true.
export function isDevMode(flag: string | undefined) {
  return process.env.NODE_ENV === "development" && flag === "true";
}
