export const emptyGeneral = {
  machine_type: "milling",
  machine: "",
  job_number: "",
  customer: "",
  programmer: "",
  part_number: "",
  revision: "",
  date: "",
  quantity: "",
  material: "",
  pre_machine_size: "",
  operation_description: "",
  program: "",
  units: "Inch",
  total_cycle_time: "",
  work_holding_notes: "",
  operation_notes: "",
  operations_in_view: false,
  status: "Active",
};

export const emptyTool = {
  tool_number: "",
  tool_type: "",
  locked: false,
  angle: "",
  name: "",
  diameter: "",
  flutes: "",
  flute_length: "",
  stickout_length: "",
  exposed_length: "",
  cut_length: "",
  holder: "",
  thread_pitch: "",
  thread_form: "",
  min_bore_diameter: "",
  max_bore_diameter: "",
  insert_count: "",
  insert_type: "",
  blade_thickness: "",
  arbor_size: "",
};

export const emptyPartZero = {
  x_max: "",
  x_min: "",
  y_max: "",
  y_min: "",
  z_max: "",
  z_min: "",
  coordinate_system: "",
  overall_depth_range: "",
  work_coordinate_system: "",
};

export const emptyOperation = {
  op_number: "",
  operation_name: "",
  comment: "",
  tool_number: "",
  min_z: "",
  type: "",
  feed: "",
  max_rpm: "",
  cut_time: "",
  cycle_time: "",
};

export const emptyTurningChuck = {
  wh_s1_active: false,
  wh_s2_active: false,
  wh_s1: {},
  wh_s2: {},
};

export const emptyTurningTools = { turrets: [] };

export const emptyTurningOperation = {
  n_block: "",
  op_number: "",
  operation_name: "",
  comment: "",
  tool_number: "",
  cs_number: "",
  min_z: "",
  max_z: "",
};