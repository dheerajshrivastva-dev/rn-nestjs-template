/**
 * Material Design 3 Elevation System
 * Shadow and surface tint definitions
 *
 * Reference: https://m3.material.io/styles/elevation/tokens
 */

export interface ElevationLevel {
  /**
   * Elevation level (0-5)
   */
  level: number;

  /**
   * Shadow elevation (for Android)
   */
  shadowElevation: number;

  /**
   * Shadow configuration (for iOS)
   */
  shadow: {
    shadowColor: string;
    shadowOffset: {
      width: number;
      height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
  };
}

/**
 * Material Design 3 Elevation Levels
 */
export const elevation = {
  /**
   * Level 0 - No elevation (flat surface)
   */
  level0: {
    level: 0,
    shadowElevation: 0,
    shadow: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
  },

  /**
   * Level 1 - Minimal elevation
   * Used for: Cards, Chips
   */
  level1: {
    level: 1,
    shadowElevation: 1,
    shadow: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
  },

  /**
   * Level 2 - Low elevation
   * Used for: Elevated cards, Hero cards, Top app bar (scrolled)
   */
  level2: {
    level: 2,
    shadowElevation: 2,
    shadow: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
  },

  /**
   * Level 3 - Medium elevation
   * Used for: FAB, Extended FAB
   */
  level3: {
    level: 3,
    shadowElevation: 3,
    shadow: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
  },

  /**
   * Level 4 - High elevation
   * Used for: Navigation drawer, Modal bottom sheets
   */
  level4: {
    level: 4,
    shadowElevation: 4,
    shadow: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.16,
      shadowRadius: 8,
    },
  },

  /**
   * Level 5 - Maximum elevation
   * Used for: Dialogs, Modals
   */
  level5: {
    level: 5,
    shadowElevation: 8,
    shadow: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
  },
} as const;

/**
 * Helper function to get elevation style
 */
export const getElevation = (level: keyof typeof elevation): ElevationLevel['shadow'] => {
  return elevation[level].shadow;
};

/**
 * Surface tint opacity (for light theme elevation tinting)
 */
export const surfaceTintOpacity = {
  level0: 0,
  level1: 0.05,
  level2: 0.08,
  level3: 0.11,
  level4: 0.12,
  level5: 0.14,
} as const;
