/**
 * SocketService - WebSocket client for real-time notifications and command ACKs.
 *
 * Connects to the backend /ws namespace using Socket.io.
 * Authenticates via JWT passed in handshake.auth.token.
 *
 * Events handled:
 *  - `notification:new`  → invalidate notification queries (badge + inbox refresh)
 *  - `command:ack`       → invalidate device command queries (read receipt for retailer)
 *  - `order:update`      → invalidate orders + actionable count (SUPER_ADMIN badge)
 *  - `transfer:update`   → invalidate key transfers + actionable count
 *
 * Usage:
 *   SocketService.connect(accessToken);   // Call after login / app init
 *   SocketService.disconnect();           // Call on logout
 */

import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL } from '../api/endpoints';
import { notificationKeys } from '../hooks/queries/useNotifications';
import { queryClient } from '../providers/QueryProvider';
import { queryKeys } from '../hooks/queryKeys';

// Derive the base server URL (strip /api/v1 suffix)
const WS_URL = API_BASE_URL;

let socket: Socket | null = null;

const SocketService = {
  // ─── Connect ────────────────────────────────────────────────────────────────

  connect(token: string): void {
    if (socket?.connected) return; // Already connected

    console.warn(`[WS] Connecting to ${WS_URL}/ws ...`);
    socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      console.warn(`[WS] ✅ Connected  url=${WS_URL}/ws  socketId=${socket?.id}`);
    });

    socket.on('disconnect', (reason) => {
      console.warn(`[WS] 🔌 Disconnected  reason=${reason}`);
    });

    socket.on('connect_error', (err) => {
      console.warn(`[WS] ❌ Connection error  message=${err.message}  url=${WS_URL}/ws`);
    });

    // New notification → update unread count cache + invalidate inbox list
    socket.on('notification:new', (data: unknown) => {
      console.warn('[WS] 🔔 notification:new', JSON.stringify(data));

      // Manually increment unread count
      queryClient.setQueryData<number>(notificationKeys.unreadCount(), (old) => {
        return (old ?? 0) + 1;
      });

      // Invalidate infinite list to show new item on next render/refetch
      queryClient.invalidateQueries({ queryKey: notificationKeys.infinite() });
    });

    // Order status change → refresh orders list + actionable count badge
    socket.on('order:update', (data: { orderId: string; status: string }) => {
      console.warn('[WS] 📦 order:update', JSON.stringify(data));
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.actionableCount });
    });

    // Transfer status change → refresh transfers list + actionable count badge
    socket.on('transfer:update', (data: { transferId: string; status: string }) => {
      console.warn('[WS] 🔑 transfer:update', JSON.stringify(data));
      queryClient.invalidateQueries({ queryKey: queryKeys.keyTransfers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.actionableCount });
    });

    // Device command ACK → refresh command history for affected client
    socket.on('command:ack', (data: { commandId: string; clientId: string; status: string }) => {
      console.warn('[WS] 📡 command:ack', JSON.stringify(data));
      // Refresh the specific client's command list
      queryClient.invalidateQueries({ queryKey: ['client-commands', data.clientId] });
      // Also refresh the client detail (lock status may have changed)
      queryClient.invalidateQueries({ queryKey: ['client', data.clientId] });
      // Refresh notifications (command_ack notification was created)
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });
  },

  // ─── Disconnect ─────────────────────────────────────────────────────────────

  disconnect(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
      console.warn('[WS] Disconnected (logout)');
    }
  },

  // ─── Status ─────────────────────────────────────────────────────────────────

  isConnected(): boolean {
    return socket?.connected ?? false;
  },
};

export default SocketService;
