import { Server as HTTPServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { getSession } from 'next-auth/react';
import { parse } from 'url';

interface WebSocketMessage {
  type: string;
  payload: any;
}

export class WebSocketHandler {
  private wss: WebSocketServer;
  private clients: Map<string, Set<WebSocket>>;

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Map();

    this.wss.on('connection', async (ws: WebSocket, req) => {
      const { query } = parse(req.url || '', true);
      const repoId = query.repoId as string;

      if (!repoId) {
        ws.close();
        return;
      }

      // Add client to repository's client list
      if (!this.clients.has(repoId)) {
        this.clients.set(repoId, new Set());
      }
      this.clients.get(repoId)?.add(ws);

      ws.on('message', async (message: string) => {
        try {
          const data: WebSocketMessage = JSON.parse(message);
          await this.handleMessage(repoId, ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        this.clients.get(repoId)?.delete(ws);
        if (this.clients.get(repoId)?.size === 0) {
          this.clients.delete(repoId);
        }
      });
    });
  }

  private async handleMessage(repoId: string, ws: WebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'file_change':
        // Broadcast file changes to all clients except sender
        this.broadcast(repoId, ws, {
          type: 'file_updated',
          payload: message.payload,
        });
        break;

      case 'comment_added':
        // Broadcast new comments to all clients
        this.broadcast(repoId, null, {
          type: 'new_comment',
          payload: message.payload,
        });
        break;

      case 'pr_status_change':
        // Broadcast pull request status changes
        this.broadcast(repoId, null, {
          type: 'pr_updated',
          payload: message.payload,
        });
        break;

      case 'issue_update':
        // Broadcast issue updates
        this.broadcast(repoId, null, {
          type: 'issue_updated',
          payload: message.payload,
        });
        break;
    }
  }

  private broadcast(repoId: string, exclude: WebSocket | null, message: WebSocketMessage) {
    const clients = this.clients.get(repoId);
    if (!clients) return;

    const messageStr = JSON.stringify(message);
    clients.forEach((client) => {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  public notifyRepositoryUpdate(repoId: string, type: string, payload: any) {
    this.broadcast(repoId, null, { type, payload });
  }
}
