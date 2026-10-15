export type InspectorCommand =
  | { type: 'ftb:inspector:enable'; protocolVersion: 1 }
  | { type: 'ftb:inspector:disable'; protocolVersion: 1 }
