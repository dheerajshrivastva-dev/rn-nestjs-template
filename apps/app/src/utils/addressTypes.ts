/**
 * Address Types and Utilities
 * For Bihar and Jharkhand address management
 */

export interface State {
  code: string;
  name: string;
  abbreviation: string;
}

export interface District {
  stateCode: string;
  districtCode: string;
  name: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

export interface GooglePlaceResult {
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

/**
 * Extract address components from Google Places API result
 */
export const parseGoogleAddress = (place: GooglePlaceResult): Partial<Address> => {
  const components = place.address_components;

  const getComponent = (type: string): string | undefined => {
    const component = components.find(c => c.types.includes(type));
    return component?.long_name;
  };

  const street = [
    getComponent('street_number'),
    getComponent('route'),
    getComponent('sublocality_level_2'),
    getComponent('sublocality_level_1'),
  ]
    .filter(Boolean)
    .join(', ');

  return {
    street: street || getComponent('neighborhood') || '',
    city: getComponent('locality') || getComponent('administrative_area_level_2') || '',
    state: getComponent('administrative_area_level_1') || '',
    postalCode: getComponent('postal_code') || '',
    country: getComponent('country') || 'India',
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
  };
};

/**
 * Get state code from state name
 */
export const getStateCode = (stateName: string, states: State[]): string | undefined => {
  const state = states.find(
    s => s.name.toLowerCase() === stateName.toLowerCase() ||
         s.abbreviation.toLowerCase() === stateName.toLowerCase()
  );
  return state?.code;
};

/**
 * Get district code from district name and state code
 */
export const getDistrictCode = (
  districtName: string,
  stateCode: string,
  districts: District[]
): string | undefined => {
  const district = districts.find(
    d => d.stateCode === stateCode &&
         d.name.toLowerCase() === districtName.toLowerCase()
  );
  return district?.districtCode;
};
