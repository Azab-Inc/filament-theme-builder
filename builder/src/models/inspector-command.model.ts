export type InspectorCommand =
  | { type: 'ftb:preview:handshake'; protocolVersion: 1 }
  | { type: 'ftb:inspector:enable'; protocolVersion: 1 }
  | { type: 'ftb:inspector:disable'; protocolVersion: 1 }
  | { type: 'ftb:inspector:scope'; protocolVersion: 1; selector: string }
