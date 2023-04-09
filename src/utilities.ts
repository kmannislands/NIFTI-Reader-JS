import { NiftiExtension } from "./nifti-extension";

export class Utils {
  static crcTable: number[] | null = null;

  public static readonly GUNZIP_MAGIC_COOKIE1 = 31;
  public static readonly GUNZIP_MAGIC_COOKIE2 = 139;

  public static getStringAt(
    data: DataView,
    start: number,
    end: number
  ): string {
    var str = "",
      ctr,
      ch;

    for (ctr = start; ctr < end; ctr += 1) {
      ch = data.getUint8(ctr);

      if (ch !== 0) {
        str += String.fromCharCode(ch);
      }
    }

    return str;
  }

  public static getByteAt(data: DataView, start: number): number {
    return data.getInt8(start);
  }

  public static getShortAt(
    data: DataView,
    start: number,
    littleEndian: boolean
  ) {
    return data.getInt16(start, littleEndian);
  }

  public static getIntAt(
    data: DataView,
    start: number,
    littleEndian: boolean
  ): number {
    return data.getInt32(start, littleEndian);
  }

  public static getFloatAt(
    data: DataView,
    start: number,
    littleEndian: boolean
  ): number {
    return data.getFloat32(start, littleEndian);
  }

  public static getDoubleAt(
    data: DataView,
    start: number,
    littleEndian: boolean
  ): number {
    return data.getFloat64(start, littleEndian);
  }

  // Note: this method signature changed as TS caught that 'littleEndian' was unused
  public static getLongAt(data: DataView, start: number): number {
    var ctr,
      array = [],
      value = 0;

    for (ctr = 0; ctr < 8; ctr += 1) {
      array[ctr] = Utils.getByteAt(data, start + ctr);
    }

    for (ctr = array.length - 1; ctr >= 0; ctr--) {
      // TODO remove "!", check that ctr is a valid index
      value = value * 256 + array[ctr]!;
    }

    return value;
  }

  public static getExtensionsAt(
    data: DataView,
    start: number,
    littleEndian: boolean,
    voxOffset: number
  ): NiftiExtension[] {
    let extensions = [];
    let extensionByteIndex = start;

    // Multiple extended header sections are allowed
    while (extensionByteIndex < voxOffset) {
      // assume same endianess as header until proven otherwise
      let extensionLittleEndian = littleEndian;
      let esize = Utils.getIntAt(data, extensionByteIndex, littleEndian);
      if (!esize) {
        break; // no more extensions
      }

      // check if this takes us past vox_offset
      if (esize + extensionByteIndex > voxOffset) {
        // check if reversing byte order gets a proper size
        extensionLittleEndian = !extensionLittleEndian;
        esize = Utils.getIntAt(data, extensionByteIndex, extensionLittleEndian);
        if (esize + extensionByteIndex > voxOffset) {
          throw new Error("This does not appear to be a valid NIFTI extension");
        }
      }

      // esize must be a positive integral multiple of 16
      if (esize % 16 != 0) {
        throw new Error("This does not appear to be a NIFTI extension");
      }

      let ecode = Utils.getIntAt(
        data,
        extensionByteIndex + 4,
        extensionLittleEndian
      );
      let edata = data.buffer.slice(
        extensionByteIndex + 8,
        extensionByteIndex + esize
      );
      console.log(
        "extensionByteIndex: " + (extensionByteIndex + 8) + " esize: " + esize
      );
      console.log(edata);
      let extension = new NiftiExtension(
        esize,
        ecode,
        edata,
        extensionLittleEndian
      );
      extensions.push(extension);
      extensionByteIndex += esize;
    }

    return extensions;
  }

  public static toArrayBuffer(buffer: Uint8Array): ArrayBuffer {
    var ab, view, i;

    ab = new ArrayBuffer(buffer.length);
    view = new Uint8Array(ab);
    for (i = 0; i < buffer.length; i += 1) {
      view[i] = buffer[i]!;
    }
    return ab;
  }

  public static isString(obj: unknown): obj is string {
    return typeof obj === "string" || obj instanceof String;
  }

  public static formatNumber(num: number, shortFormat: boolean): number {
    let val: number | string = 0;

    if (Utils.isString(num)) {
      val = Number(num);
    } else {
      val = num;
    }

    if (shortFormat) {
      val = val.toPrecision(5);
    } else {
      val = val.toPrecision(7);
    }

    return parseFloat(val);
  }

  public static makeCRCTable(): number[] {
    var c;
    var crcTable = [];
    for (var n = 0; n < 256; n++) {
      c = n;
      for (var k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c;
    }
    return crcTable;
  }

  public static crc32(dataView: DataView): number {
    // TODO: revisit this assignment
    var crcTable = Utils.crcTable || (Utils.crcTable = Utils.makeCRCTable());
    var crc = 0 ^ -1;

    for (var i = 0; i < dataView.byteLength; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ dataView.getUint8(i)) & 0xff]!;
    }

    return (crc ^ -1) >>> 0;
  }
}
