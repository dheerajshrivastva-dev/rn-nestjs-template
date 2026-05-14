import { Injectable, Logger } from '@nestjs/common';
import * as geoip from 'geoip-lite';

export interface GeoLocation {
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

@Injectable()
export class GeoIpService {
  private readonly logger = new Logger(GeoIpService.name);

  /**
   * Look up approximate geolocation for an IP address using offline DB.
   * Returns null fields for private/loopback IPs (localhost, 192.168.x.x, etc.).
   */
  lookup(ip: string): GeoLocation {
    try {
      const geo = geoip.lookup(ip);
      if (!geo) {
        return { city: null, country: null, latitude: null, longitude: null };
      }
      return {
        city: geo.city || null,
        country: geo.country || null,
        latitude: geo.ll?.[0] ?? null,
        longitude: geo.ll?.[1] ?? null,
      };
    } catch (err) {
      this.logger.warn(`GeoIP lookup failed for IP ${ip}: ${err?.message}`);
      return { city: null, country: null, latitude: null, longitude: null };
    }
  }

  /**
   * Calculate distance in km between two lat/lon points using the Haversine formula.
   */
  distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
