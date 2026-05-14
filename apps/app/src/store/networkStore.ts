/**
 * Network Store - Zustand
 * Tracks real-time network connectivity and server reachability.
 *
 * States:
 * - isConnected: device has internet (from NetInfo)
 * - isServerReachable: backend API responded successfully
 * - retryCount: how many reconnect attempts have been made
 * - status: 'online' | 'offline' | 'server_unreachable'
 */

import {create} from 'zustand';

export type NetworkStatus = 'online' | 'offline' | 'server_unreachable';

interface NetworkState {
  isConnected: boolean;
  isServerReachable: boolean;
  status: NetworkStatus;
  retryCount: number;

  setConnected: (connected: boolean) => void;
  setServerReachable: (reachable: boolean) => void;
  incrementRetry: () => void;
  resetRetry: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isConnected: true,
  isServerReachable: true,
  status: 'online',
  retryCount: 0,

  setConnected: (connected: boolean) =>
    set(state => {
      const status: NetworkStatus = !connected
        ? 'offline'
        : state.isServerReachable
        ? 'online'
        : 'server_unreachable';
      return {isConnected: connected, status, retryCount: connected ? state.retryCount : 0};
    }),

  setServerReachable: (reachable: boolean) =>
    set(state => {
      const status: NetworkStatus = !state.isConnected
        ? 'offline'
        : reachable
        ? 'online'
        : 'server_unreachable';
      return {isServerReachable: reachable, status};
    }),

  incrementRetry: () => set(state => ({retryCount: state.retryCount + 1})),

  resetRetry: () => set({retryCount: 0}),
}));
