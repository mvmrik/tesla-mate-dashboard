// Widget registry for the block-based layout system.
// span: 1 = single slot (1×1), 2 = double (full row, 1×2)
// multi: true = multiple instances allowed
export const WIDGET_REGISTRY = {
  // Battery
  battery_level: {
    label: 'Battery %',
    category: 'battery',
    span: 1,
    needsData: true,
  },
  battery_range: {
    label: 'Battery & Range',
    category: 'battery',
    span: 1,
    needsData: true,
  },
  battery_full: {
    label: 'Battery (full)',
    category: 'battery',
    span: 1,
    needsData: true,
  },
  last_charge: {
    label: 'Last Charge',
    category: 'battery',
    span: 1,
    needsData: true,
  },
  charge_cost: {
    label: 'Charging Cost',
    category: 'battery',
    span: 2,
    needsData: false,
  },

  // TPMS
  tpms_avg: {
    label: 'Tyres (avg)',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  tpms_front: {
    label: 'Tyres Front',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  tpms_rear: {
    label: 'Tyres Rear',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  tpms_fl: {
    label: 'Tyre FL',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  tpms_fr: {
    label: 'Tyre FR',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  tpms_rl: {
    label: 'Tyre RL',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  tpms_rr: {
    label: 'Tyre RR',
    category: 'sensors',
    span: 1,
    needsData: true,
  },

  // Climate
  temp_outside: {
    label: 'Outside Temp',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  temp_inside: {
    label: 'Inside Temp',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  temp_both: {
    label: 'Temp In & Out',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  temp_minmax: {
    label: 'Temp Min/Max today',
    category: 'sensors',
    span: 1,
    needsData: true,
  },

  // Driving
  monthly_distance: {
    label: 'Monthly Distance',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  monthly_speed: {
    label: 'Monthly Avg Speed',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  monthly_drives: {
    label: 'Monthly Drives',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  monthly_drivetime: {
    label: 'Monthly Drive Time',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  monthly_kwh_per_100: {
    label: 'Monthly kWh/100km',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  monthly_kwh_total: {
    label: 'Monthly kWh Charged',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  recent_drives: {
    label: 'Today & Yesterday',
    category: 'driving',
    span: 2,
    needsData: true,
  },

  // Activity
  states_12h: {
    label: 'Car States (12h)',
    category: 'activity',
    span: 2,
    needsData: false,
  },
  states_24h: {
    label: 'Car States (24h)',
    category: 'activity',
    span: 2,
    needsData: false,
  },

  // Links
  link: {
    label: 'Quick Link',
    category: 'links',
    span: 1,
    needsData: false,
    multi: true,
  },
};

export const CATEGORIES = [
  { id: 'all',      label: 'All' },
  { id: 'battery',  label: 'Battery & Charging' },
  { id: 'driving',  label: 'Driving' },
  { id: 'sensors',  label: 'Sensors' },
  { id: 'activity', label: 'Activity' },
  { id: 'links',    label: 'Links' },
];
