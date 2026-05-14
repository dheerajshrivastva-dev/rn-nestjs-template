# WebSocket Module

Real-time push to connected clients via Socket.IO. Namespace: `/ws`.

## Connection

```javascript
const socket = io('http://localhost:3000/ws', {
  auth: { token: '<jwt-access-token>' },
  transports: ['websocket'],
});
```

On connect, the gateway verifies the JWT and joins the socket to a user-specific room: `user:<userId>`. Unauthenticated connections are rejected.

## Server-Emitted Events

| Event | Room | Payload | Description |
|---|---|---|---|
| `notification:new` | `user:<id>` | `{ id, type, title, body, data, createdAt }` | New inbox notification |
| `command:ack` | `user:<id>` | `{ commandId, status, executedAt }` | Device command result |

Add app-specific events by calling `WsGateway.emitToUser()` from any service.

## Emitting from a Service

```typescript
constructor(private readonly wsGateway: WsGateway) {}

// Send to a specific user
this.wsGateway.emitToUser(userId, 'notification:new', payload);
```

The gateway's `emitToUser` method handles room routing — no need to manage socket IDs.

## CORS

Allowed origins are controlled by:
1. Hardcoded `http://localhost:3000` (dev)
2. `CORS_ORIGINS` env var (comma-separated)

## Auth

JWT is read from `handshake.auth.token` or `handshake.headers.authorization` (Bearer prefix stripped). Expired or invalid tokens are rejected at connection time.
