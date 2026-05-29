export interface UomOption {
  readonly code: string
  readonly name: string
}

export interface UomGroup {
  readonly label: string
  readonly options: readonly UomOption[]
}

export const UOM_GROUPS: readonly UomGroup[] = [
  {
    label: 'Count',
    options: [
      { code: 'EA',   name: 'Each' },
      { code: 'DOZ',  name: 'Dozen' },
      { code: 'PCS',  name: 'Pieces' },
      { code: 'BOX',  name: 'Box' },
      { code: 'PKT',  name: 'Packet' },
      { code: 'ROLL', name: 'Roll' },
      { code: 'SET',  name: 'Set' },
      { code: 'PAIR', name: 'Pair' },
    ],
  },
  {
    label: 'Weight',
    options: [
      { code: 'KG', name: 'Kilogram' },
      { code: 'G',  name: 'Gram' },
      { code: 'MG', name: 'Milligram' },
      { code: 'LB', name: 'Pound' },
      { code: 'MT', name: 'Metric Ton' },
    ],
  },
  {
    label: 'Volume',
    options: [
      { code: 'LTR', name: 'Litre' },
      { code: 'ML',  name: 'Millilitre' },
      { code: 'CM3', name: 'Cubic Centimetre' },
    ],
  },
  {
    label: 'Length',
    options: [
      { code: 'M',  name: 'Metre' },
      { code: 'CM', name: 'Centimetre' },
      { code: 'MM', name: 'Millimetre' },
      { code: 'FT', name: 'Foot' },
      { code: 'IN', name: 'Inch' },
    ],
  },
  {
    label: 'Area',
    options: [
      { code: 'M2',  name: 'Square Metre' },
      { code: 'FT2', name: 'Square Foot' },
    ],
  },
  {
    label: 'Time',
    options: [
      { code: 'HR',  name: 'Hour' },
      { code: 'MIN', name: 'Minute' },
      { code: 'DAY', name: 'Day' },
    ],
  },
]
