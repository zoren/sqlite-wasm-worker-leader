type FlexibleString =
  | string
  /** WASM C-string pointer, passed on to WASM as-is. */
  // | WasmPointer
  /** Assumed to hold UTF-8 encoded text, converted to `string` */
  | Uint8Array
  | Int8Array
  | ArrayBuffer
  /**
   * Gets converted to a string using `theArray.join('')` (i.e. concatenated
   * as-is, with no space between each entry). Though JS supports multi-line
   * string literals with the backtick syntax, it is frequently convenient to
   * write out longer SQL constructs as arrays.
   */
  | readonly string[];

/** Types of values that can be passed to/retrieved from SQLite. */
type SqlValue =
  | string
  | number
  | null
  | BigInt
  | Uint8Array
  | Int8Array
  | ArrayBuffer;

type BindingSpec =
  | readonly SqlValue[]
  | { [paramName: string]: SqlValue }
  /** Assumed to have binding index `1` */
  | SqlValue;

interface Version {
  libVersion: string
  libVersionNumber: number
  sourceId: string
  downloadVersion: number
}

interface Config {
  version: Version
  vfsList: string[]
  opfsEnabled: boolean
  bigIntEnabled: boolean
}

interface OpenInfo {
  filename: string
  persistent: boolean
  dbId: string
  vfs: string
}

interface DB {
  openInfo: OpenInfo
  close: () => Promise<void>
  exec: (params: { sql: FlexibleString, rowMode?: 'array' | 'object' }) => Promise<null>
  execArray: (params: { sql: FlexibleString }) => Promise<any[]>
  execObject: (params: { sql: FlexibleString }) => Promise<any[]>
  selectValue: (sql: FlexibleString, bind?: BindingSpec) => Promise<SqlValue | undefined>
  selectValues: (sql: FlexibleString, bind?: BindingSpec, asType?: SQLiteDataType) => Promise<SqlValue[]>
}

interface SQLiteWorker {
  version: Version
  getConfig: () => Promise<Config>
  open: (options: { filename?: string; flags?: string; vfs?: string }) => Promise<DB>
}

interface Worker {
  terminate: () => void
}

export default function initWorker(): Promise<{ dbWorker: SQLiteWorker, worker: Worker }>
