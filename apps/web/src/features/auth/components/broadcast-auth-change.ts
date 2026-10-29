/** Notifies other tabs when the cookie-backed login state changes. */
export function broadcastAuthChange(type: 'changed' | 'logout' = 'changed') {
  if (typeof BroadcastChannel === 'undefined') {
    return;
  }
  const channel = new BroadcastChannel('ibase-auth');
  channel.postMessage({ type });
  channel.close();
}
