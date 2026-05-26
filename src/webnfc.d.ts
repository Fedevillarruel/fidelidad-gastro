declare class NDEFReader {
  write(data: string | { records: Array<{ recordType: string; data: string }> }): Promise<void>
}
