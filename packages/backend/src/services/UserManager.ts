import type { Server, Socket } from "socket.io";
import logger from "../utils/logger.js";

export interface User {
  id: string;
  name: string;
  ipPrefix: string | null;
  isPrivate: boolean;
  ip: string;
  inFlight: boolean;
}

export class UserManager {
  private users = new Map<string, User>();
  // Bucket users by prefix for O(1) discovery
  private usersByPrefix = new Map<string, Set<string>>();

  addUser(socketId: string, userData: User) {
    this.users.set(socketId, userData);
    
    if (userData.ipPrefix) {
      if (!this.usersByPrefix.has(userData.ipPrefix)) {
        this.usersByPrefix.set(userData.ipPrefix, new Set());
      }
      this.usersByPrefix.get(userData.ipPrefix)!.add(socketId);
    }
  }

  removeUser(socketId: string) {
    const user = this.users.get(socketId);
    if (user && user.ipPrefix) {
      this.usersByPrefix.get(user.ipPrefix)?.delete(socketId);
      if (this.usersByPrefix.get(user.ipPrefix)?.size === 0) {
        this.usersByPrefix.delete(user.ipPrefix);
      }
    }
    this.users.delete(socketId);
  }

  getUser(socketId: string) {
    return this.users.get(socketId);
  }

  updateUser(socketId: string, updates: Partial<User>) {
    const user = this.users.get(socketId);
    if (user) {
      const updatedUser = { ...user, ...updates };
      // If prefix changed (rare but possible), update buckets
      if (updates.ipPrefix && updates.ipPrefix !== user.ipPrefix) {
        if (user.ipPrefix) this.usersByPrefix.get(user.ipPrefix)?.delete(socketId);
        if (!this.usersByPrefix.has(updates.ipPrefix)) this.usersByPrefix.set(updates.ipPrefix, new Set());
        this.usersByPrefix.get(updates.ipPrefix)!.add(socketId);
      }
      this.users.set(socketId, updatedUser);
    }
  }

  getNearbyUsers(socketId: string): { id: string; name: string }[] {
    const user = this.users.get(socketId);
    if (!user || !user.ipPrefix) return [];

    const bucket = this.usersByPrefix.get(user.ipPrefix);
    if (!bucket) return [];

    const nearby: { id: string; name: string }[] = [];
    for (const id of bucket) {
      if (id === socketId) continue;
      const other = this.users.get(id);
      if (!other || other.inFlight) continue;

      // Privacy logic matching original implementation
      if (user.isPrivate && other.isPrivate) {
        nearby.push({ id, name: other.name });
      } else if (!user.isPrivate && !other.isPrivate) {
        nearby.push({ id, name: other.name });
      }
    }
    return nearby;
  }
}
