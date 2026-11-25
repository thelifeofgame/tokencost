export function getAlertsApiOrigin() {
  const localOrigin = process.env.NEXT_PUBLIC_LOCAL_ALERTS_API;
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
    && localOrigin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(localOrigin)) {
    return localOrigin;
  }
  return '';
}
