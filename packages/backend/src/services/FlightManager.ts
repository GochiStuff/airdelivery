import type { UserManager } from "./UserManager.js";

export interface Flight {
  ownerId: string;
  members: string[];
  ownerConnected: boolean;
  sdp?: any;
}

export class FlightManager {
  private flights = new Map<string, Flight>();

  constructor(private userManager: UserManager) {}

  createFlight(code: string, ownerId: string): Flight {
    const flight: Flight = {
      ownerId,
      members: [ownerId],
      ownerConnected: true,
    };
    this.flights.set(code, flight);
    this.userManager.updateUser(ownerId, { inFlight: true });
    return flight;
  }

  joinFlight(code: string, socketId: string): { success: boolean; message?: string } {
    const flight = this.flights.get(code);
    if (!flight) return { success: false, message: "Flight not found" };
    if (flight.members.length >= 2) return { success: false, message: "Flight is full" };

    if (!flight.members.includes(socketId)) {
      flight.members.push(socketId);
    }
    this.userManager.updateUser(socketId, { inFlight: true });
    return { success: true };
  }

  leaveFlight(socketId: string): string[] {
    const affectedCodes: string[] = [];
    for (const [code, flight] of this.flights.entries()) {
      if (flight.ownerId === socketId) {
        flight.ownerConnected = false;
        this.flights.delete(code); // Original logic deletes flight if owner leaves
        affectedCodes.push(code);
      } else if (flight.members.includes(socketId)) {
        flight.members = flight.members.filter(id => id !== socketId);
        affectedCodes.push(code);
      }
    }
    this.userManager.updateUser(socketId, { inFlight: false });
    return affectedCodes;
  }

  getFlight(code: string) {
    return this.flights.get(code);
  }

  hasFlight(code: string) {
    return this.flights.has(code);
  }

  getMembers(code: string) {
    const flight = this.flights.get(code);
    if (!flight) return [];
    return flight.members.map(id => {
      const user = this.userManager.getUser(id);
      return {
        id,
        name: user?.name || `Peer-${id.slice(0, 4)}`
      };
    });
  }
}
