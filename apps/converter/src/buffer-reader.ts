export class BufferReader {
  private _offset = 0;

  constructor(private _buffer: Buffer) {
    if (!_buffer || !Buffer.isBuffer(_buffer)) {
      throw new Error('Invalid buffer provided');
    }
  }

  public readUInt16LE(offset = this._offset): number {
    this.validateLength(2);

    const value = this._buffer.readUInt16LE(offset);

    if (offset === this._offset) {
      this._offset += 2;
    } else {
      this._offset = offset + 2;
    }

    return value;
  }

  public readUInt16BE(offset = this._offset): number {
    this.validateLength(2);

    const value = this._buffer.readUInt16BE(offset);
    if (offset === this._offset) {
      this._offset += 2;
    } else {
      this._offset = offset + 2;
    }
    return value;
  }

  public readUInt32BE(offset = this._offset): number {
    this.validateLength(4);

    const value = this._buffer.readUInt32BE(offset);

    if (offset === this._offset) {
      this._offset += 4;
    } else {
      this._offset = offset + 4;
    }

    return value;
  }

  public readUInt32LE(offset = this._offset): number {
    this.validateLength(4);

    const value = this._buffer.readUInt32LE(offset);

    if (offset === this._offset) {
      this._offset += 4;
    } else {
      this._offset = offset + 4;
    }

    return value;
  }

  public readInt32LE(offset = this._offset): number {
    this.validateLength(4);

    const value = this._buffer.readInt32LE(offset);

    if (offset === this._offset) {
      this._offset += 4;
    } else {
      this._offset = offset + 4;
    }

    return value;
  }

  public readInt32BE(offset = this._offset): number {
    this.validateLength(4);

    const value = this._buffer.readInt32BE(offset);

    if (offset === this._offset) {
      this._offset += 4;
    } else {
      this._offset = offset + 4;
    }

    return value;
  }

  public readInt16LE(offset = this._offset): number {
    this.validateLength(2);

    const value = this._buffer.readInt16LE(offset);

    if (offset === this._offset) {
      this._offset += 2;
    } else {
      this._offset = offset + 2;
    }

    return value;
  }

  public readByte(offset = this._offset): number {
    this.validateLength(1);

    const value = this._buffer.readUInt8(offset);

    if (offset === this._offset) {
      this._offset += 1;
    } else {
      this._offset = offset + 1;
    }

    return value;
  }

  public readBytes(length: number, offset = this._offset): Buffer {
    this.validateLength(length);

    const buffer = this._buffer.subarray(offset, this._offset + length);

    if (offset === this._offset) {
      this._offset += length;
    } else {
      this._offset = offset + length;
    }

    return buffer;
  }

  public readString(
    length?: number,
    encoding: BufferEncoding = 'utf8'
  ): string {
    if (length === undefined) {
      length = this.readByte();
    }

    const buf = this.readBytes(length);
    return buf.toString(encoding);
  }

  private validateLength(length: number): void {
    if (!this._buffer) {
      throw new Error('Buffer not initialized');
    }

    if (this._offset + length > this._buffer.length) {
      throw new Error('Buffer overflow');
    }
  }

  public get offset(): number {
    return this._offset;
  }

  public get buffer(): Buffer {
    return this._buffer;
  }

  public get length(): number {
    return this._buffer.length;
  }

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  public set offset(value: number) {
    if (value < 0 || value > this._buffer.length) {
      throw new Error('Invalid offset value');
    }

    this._offset = value;
  }

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  public set buffer(value: Buffer) {
    if (!value || !Buffer.isBuffer(value)) {
      throw new Error('Invalid buffer provided');
    }

    this._buffer = value;
    this._offset = 0;
  }
}
