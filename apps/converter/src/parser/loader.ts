// import { ReadStream } from 'fs';
// import { ScFile } from '../sc-file';
// import { BufferReader } from '../reader/buffer.reader';
// import * as fzstd from 'fzstd';
// import { createHash } from 'crypto';

// export class Loader {
//   private _chunks: Buffer[] = [];
//   private _file: ScFile;
//   private _reader: BufferReader;

//   public async load(file: ScFile, stream: ReadStream): Promise<void> {
//     return new Promise<void>((resolve, reject) => {
//       this._file = file;

//       stream.on('data', this.onData.bind(this));
//       stream.on('end', async () => {
//         try {
//           const stream = await this.decompress(Buffer.concat(this._chunks));
//           await this.readMetadata();

//           resolve();
//         } catch (error) {
//           reject(error);
//         }
//       });
//     });
//   }

//   private async decompress(buffer: Buffer): Promise<void> {
//     return new Promise<void>((resolve, reject) => {
//       this._reader = new BufferReader(buffer);

//       const magic = this._reader.readBytes(2).toString('utf8');
//       this._file.version = this._reader.readUInt32BE();

//       let tempVersion = this._file.version;
//       let startOffset = 0;

//       if (magic === 'SC' && this._file.version <= 100) {
//         if (this._file.version === 4) {
//           tempVersion = this._reader.readUInt32BE();

//           startOffset = buffer.indexOf('START', this._reader.offset, 'utf8');

//           if (startOffset === -1) {
//             reject('START marker not found in buffer');
//           }
//         }

//         const hashLength = this._reader.readUInt32BE();
//         const fileHash = this._reader.readBytes(hashLength);

//         this._file.fileHash = fileHash.toString('hex');

//         console.log(
//           `File loaded successfully with version ${this._file.version} and hash ${this._file.fileHash}`
//         );
//       } else {
//         this._reader.offset = 0;
//         this._file.version = 0;
//         tempVersion = 0;
//       }

//       if (tempVersion >= 2) {
//         this._reader.buffer = Buffer.from(
//           fzstd.decompress(
//             this._reader.buffer.subarray(this._reader.offset, startOffset)
//           )
//         );
//       }

//       const slicedBytes = this._reader.buffer.subarray(
//         this._reader.offset,
//         this._reader.offset + 9
//       );

//       if (
//         (slicedBytes[0] === 0x5d || slicedBytes[0] === 0x5e) &&
//         slicedBytes[1] === 0 &&
//         slicedBytes[2] === 0 &&
//         slicedBytes[8] < 0x20
//       ) {
//         console.log('next compressing?');
//       }

//       if (!this.validateHash()) {
//         reject(
//           `File hash mismatch. Expected: ${
//             this._file.fileHash
//           }, Computed: ${createHash('md5')
//             .update(this._reader.buffer)
//             .digest('hex')}`
//         );
//       }

//       resolve();
//     });
//   }

//   public async readMetadata(): Promise<void> {
//     const totalShapes = this._reader.readUInt16();
//     const totalMovieClips = this._reader.readUInt16();
//     const totalTextures = this._reader.readUInt16();
//     const totalTextFields = this._reader.readUInt16();
//     const totalTransformMatrices = this._reader.readUInt16();
//     const totalColorTransforms = this._reader.readUInt16();

//     // Padding
//     this._reader.readBytes(5);

//     const exportCount = this._reader.readUInt16();

//     for (let i = 0; i < exportCount; i++) {
//       const id = this._reader.readUInt16();
//       // const nameLength = this._reader.readByte();
//       // const name = this._reader.readBytes(nameLength).toString('utf8');

//       // this._file.exports.push({ id, name });
//     }

//     for (let i = 0; i < exportCount; i++) {
//       const nameLength = this._reader.readByte();
//       const name = this._reader.readBytes(nameLength).toString('utf8');

//       console.log(`Export ${i + 1}/${exportCount}: ${name}`);
//       // this._file.exports[i].name = name;
//     }
//   }

//   public validateHash(): boolean {
//     if (!this._file.fileHash) {
//       const computedHash = createHash('md5')
//         .update(this._reader.buffer)
//         .digest('hex');

//       return this._file.fileHash === computedHash;
//     }

//     return true;
//   }

//   public onData(chunk: Buffer): void {
//     this._chunks.push(chunk);
//   }
// }
