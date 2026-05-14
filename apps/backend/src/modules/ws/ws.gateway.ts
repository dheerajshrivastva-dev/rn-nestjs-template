import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

// ─── CORS Whitelist ────────────────────────────────────────────────────────
// Allows localhost:3000 for local dev, *.duetech.in for production/staging,
// and any additional origins from the CORS_ORIGINS environment variable.

const allowedOrigins: (string | RegExp)[] = [
  'http://localhost:3000',
  /https?:\/\/([a-z0-9-]+\.)*duetech\.in$/,
];

if (process.env.CORS_ORIGINS) {
  const envOrigins = process.env.CORS_ORIGINS.split(',').map((o) => o.trim());
  allowedOrigins.push(...envOrigins);
}

/**
 * WebSocket Gateway
 *
 * Provides real-time push to connected admin app clients.
 *
 * Authentication: Client must pass a valid JWT in handshake.auth.token.
 * Each authenticated user joins a room named `user:<userId>` so targeted
 * events can be emitted without broadcasting to all clients.
 *
 * Events emitted by server:
 *  - `notification:new`  → new inbox notification (business events)
 *  - `command:ack`       → device executed/failed a command (read receipt for retailer)
 */
@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow same-origin requests (e.g., from server-side clients or tests)
      if (!origin) {
        return callback(null, true);
      }
      // Check if the origin is in our dynamic whitelist
      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') {
          return allowed === origin;
        }
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    credentials: true,
  },
  transports: ['websocket'],
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(WsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  handleConnection(client: Socket): void {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`[WS] Client ${client.id} connected without token — disconnecting`);
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<{ sub: string; email: string; role: string }>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Store userId on socket for later reference
      client.data.userId = payload.sub;

      // Join a private room for this user
      client.join(`user:${payload.sub}`);

      // Join role room so role-targeted broadcasts work
      if (payload['role'] === 'super_admin') {
        client.join('role:super_admin');
      }

      this.logger.log(`[WS] User ${payload.sub} connected (socket ${client.id})`);
    } catch {
      this.logger.warn(`[WS] Invalid token — disconnecting socket ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    if (client.data?.userId) {
      this.logger.log(`[WS] User ${client.data.userId} disconnected (socket ${client.id})`);
    }
  }

  // ─── Emit Helpers ─────────────────────────────────────────────────────────

  /**
   * Emit an event to all connected sockets for a specific user.
   * No-op if the user is not currently connected.
   */
  emitToUser(userId: string, event: string, data: unknown): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit a new-notification event to a user.
   * The client invalidates its notification query on receipt.
   */
  notifyUser(userId: string, payload: { id: string; type: string; title: string; body: string; data?: Record<string, string> | null; createdAt: Date }): void {
    this.emitToUser(userId, 'notification:new', payload);
  }

  /**
   * Emit a command ACK event to the retailer who issued the command.
   * Gives real-time read receipt: Sent → Executed / Failed.
   */
  sendCommandAck(userId: string, payload: { commandId: string; clientId: string; status: string }): void {
    this.emitToUser(userId, 'command:ack', payload);
  }

  /**
   * Broadcast an order status change to all connected SUPER_ADMIN sockets.
   * Used to refresh the pending orders badge and list in real time.
   */
  broadcastOrderUpdate(payload: { orderId: string; status: string }): void {
    this.server.to('role:super_admin').emit('order:update', payload);
  }

  /**
   * Emit a key transfer status change to both participants.
   */
  broadcastTransferUpdate(fromUserId: string, toUserId: string, payload: { transferId: string; status: string }): void {
    this.emitToUser(fromUserId, 'transfer:update', payload);
    this.emitToUser(toUserId, 'transfer:update', payload);
  }
}
