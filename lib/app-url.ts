const DEFAULT_APP_URL = "https://freelance-nu-swart.vercel.app";

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    DEFAULT_APP_URL
  );
}
