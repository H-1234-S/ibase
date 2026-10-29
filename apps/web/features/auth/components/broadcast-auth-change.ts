/** Notifies other tabs that the cookie-backed login state changed. */
export function broadcastAuthChange() {
  if (typeof BroadcastChannel === 'undefined') {
    return;
  }
  const channel = new BroadcastChannel('ibase-auth');
  channel.postMessage({ type: 'changed' });
  channel.close();
}
