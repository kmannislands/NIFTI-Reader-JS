export { Utils } from './utilities';
export { NiftiExtension } from './nifti-extension';


// TODO: replace the following with an export statement once more files have been converted
import { nifti } from './nifti';

export const isCompressed = nifti.isCompressed;
export const readHeader = nifti.readHeader;
export const readImage = nifti.readImage;
export const decompress = nifti.decompress;
export const isNIFTI = nifti.isNIFTI;
export const isNIFTI1 = nifti.isNIFTI1;
export const isNIFTI2 = nifti.isNIFTI2;
export const hasExtension = nifti.hasExtension;
export const readExtensionData = nifti.readExtensionData;