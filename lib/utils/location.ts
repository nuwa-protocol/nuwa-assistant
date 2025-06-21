import type { RequestHints } from '../ai/prompts';

// Client version of getting location information
const getClientLocation = async (): Promise<RequestHints> => {
  try {
    // Try to use the browser's location API
    if (navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
              city: undefined, // Browser API does not provide city information
              country: undefined, // Browser API does not provide country information
            });
          },
          () => {
            // If location retrieval fails, return default value
            resolve({
              latitude: undefined,
              longitude: undefined,
              city: undefined,
              country: undefined,
            });
          },
        );
      });
    }
  } catch (error) {
    console.error('Failed to get location:', error);
  }

  // Return default value
  return {
    latitude: undefined,
    longitude: undefined,
    city: undefined,
    country: undefined,
  };
};

export { getClientLocation }; 