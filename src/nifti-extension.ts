export class NiftiExtension {
  /**
   * @property {number} esize - number of bytes that form the extended header data
   * @property {number} ecode - developer group id
   * @property {ArrayBuffer} data - extension data
   * @property {boolean} littleEndian - is little endian
   */
  constructor(
    public readonly esize: number,
    public readonly ecode: number,
    public readonly edata: ArrayBuffer,
    public readonly littleEndian: boolean
  ) {
    if (esize % 16 != 0) {
      throw new Error("This does not appear to be a NIFTI extension");
    }
  }

  // TODO: what is the actual type of edata here? JSDoc and usage are inconsistent
  public toArrayBuffer(): ArrayBuffer {
    const byteArray = new Uint8Array(this.esize);
    // TODO: How could this have worked? (browserify patching Buffer?)
    byteArray.set(this.edata, 8);

    const view = new DataView(byteArray.buffer);

    // size of extension
    view.setInt32(0, this.esize, this.littleEndian);
    view.setInt32(4, this.ecode, this.littleEndian);

    return byteArray.buffer;
  }
}
