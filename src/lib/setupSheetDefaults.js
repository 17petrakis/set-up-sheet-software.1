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
  status: "Active",
};

export const emptyTool = {
  tool_number: "",
  description: "",
  diameter: "",
  flutes: "",
  flute_length: "",
  stickout_length: "",
  exposed_length: "",
  cut_length: "",
  holder: "",
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
};

export const emptyOperation = {
  op_number: "",
  operation_name: "",
  comment: "",
  tool_number: "",
  min_z: "",
  max_z: "",
  cycle_time: "",
  spindle_rpm: "",
};

export const emptyTurningChuck = {
  jaw_description: "",
  chuck_type: "3-jaw",
  chuck_pressure_psi: 60,
  coolant_pressure_psi: 120,
  concentricity_requirement: "",
  fixturing_notes: "",
};

export const emptyTurningTools = { axial: [], radial: [] };

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