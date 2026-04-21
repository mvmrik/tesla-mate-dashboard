// span: 1 = single slot, 2 = double (full row), 4 = quad (full block)
// multi: true = multiple instances allowed
export const WIDGET_REGISTRY = {

  // ── Battery & Charging ──────────────────────────────────────────────────────
  battery_health: {
    label: 'Battery Health',
    category: 'battery',
    span: 1,
    needsData: true,
  },
  battery_level: {
    label: 'Battery %',
    category: 'battery',
    span: 1,
    needsData: true,
  },
  battery_range: {
    label: 'Battery Range',
    category: 'battery',
    span: 1,
    needsData: true,
  },
  charge_cost: {
    label: 'Charging Cost',
    category: 'battery',
    span: 4,
    needsData: false,
  },
  last_charge: {
    label: 'Last Charge',
    category: 'battery',
    span: 1,
    needsData: true,
  },
  monthly_kwh_charged: {
    label: 'Monthly kWh Charged',
    category: 'battery',
    span: 1,
    needsData: true,
  },

  // ── Driving ─────────────────────────────────────────────────────────────────
  monthly_avg_speed: {
    label: 'Monthly Avg Speed',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  monthly_distance: {
    label: 'Monthly Distance',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  monthly_drive_time: {
    label: 'Monthly Drive Time',
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
  monthly_kwh_per_100: {
    label: 'Monthly kWh/100km',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  monthly_max_speed: {
    label: 'Monthly Max Speed',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  odometer: {
    label: 'Odometer',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  recent_drives: {
    label: 'Today & Yesterday',
    category: 'driving',
    span: 4,
    needsData: true,
  },
  today_avg_speed: {
    label: 'Today Avg Speed',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  today_distance: {
    label: 'Today Distance',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  today_drive_time: {
    label: 'Today Drive Time',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  today_drives: {
    label: 'Today Drives',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  today_kwh_per_100: {
    label: 'Today kWh/100km',
    category: 'driving',
    span: 1,
    needsData: true,
  },
  today_max_speed: {
    label: 'Today Max Speed',
    category: 'driving',
    span: 1,
    needsData: true,
  },

  // ── Sensors ─────────────────────────────────────────────────────────────────
  temp_inside: {
    label: 'Inside Temp',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  temp_minmax: {
    label: 'Outside Temp Min/Max',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  temp_outside: {
    label: 'Outside Temp',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  tpms_avg: {
    label: 'Tyre Pressure Avg',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  tpms_fl: {
    label: 'Tyre Pressure FL',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  tpms_fr: {
    label: 'Tyre Pressure FR',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  tpms_front: {
    label: 'Tyre Pressure Front',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  tpms_rear: {
    label: 'Tyre Pressure Rear',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  tpms_rl: {
    label: 'Tyre Pressure RL',
    category: 'sensors',
    span: 1,
    needsData: true,
  },
  tpms_rr: {
    label: 'Tyre Pressure RR',
    category: 'sensors',
    span: 1,
    needsData: true,
  },

  // ── Activity ────────────────────────────────────────────────────────────────
  states_12h: {
    label: 'Car States 12h',
    category: 'activity',
    span: 2,
    needsData: false,
  },
  states_24h: {
    label: 'Car States 24h',
    category: 'activity',
    span: 2,
    needsData: false,
  },

  // ── Links ───────────────────────────────────────────────────────────────────
  link: {
    label: 'Quick Link',
    category: 'links',
    span: 1,
    needsData: false,
    multi: true,
  },
};

// Categories: All first, rest alphabetically
export const CATEGORIES = [
  { id: 'all',      label: 'All' },
  { id: 'activity', label: 'Activity' },
  { id: 'battery',  label: 'Battery & Charging' },
  { id: 'driving',  label: 'Driving' },
  { id: 'links',    label: 'Links' },
  { id: 'sensors',  label: 'Sensors' },
];
