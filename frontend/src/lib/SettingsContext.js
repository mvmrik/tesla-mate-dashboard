import { createContext, useContext } from 'react';

export const SettingsContext = createContext({
  timeFormat:   '24h',
  distanceUnit: 'km',
  tempUnit:     'C',
});

export const useSettings = () => useContext(SettingsContext);
