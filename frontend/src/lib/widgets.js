// Widget registry for the block-based layout system.
// span: 1 = single slot (1×1), 2 = double (full row, 1×2)
export const WIDGET_REGISTRY = {
  battery: {
    label: 'Battery & Range',
    category: 'battery',
    span: 1,
    needsData: true,
  },
  tpms: {
    label: 'Tyre Pressures',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  climate: {
    label: 'Temperature',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  monthly_driving: {
    label: 'Monthly Driving',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  monthly_consumption: {
    label: 'Monthly Consumption',
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
  charge_cost: {
    label: 'Charging Cost',
    category: 'battery',
    span: 2,
    needsData: false,
  },
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
  link: {
    label: 'Quick Link',
    category: 'links',
    span: 1,
    needsData: false,
    multi: true, // multiple instances allowed
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
