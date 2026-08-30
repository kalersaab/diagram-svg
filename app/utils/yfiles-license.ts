import { License } from '@yfiles/yfiles';
import licenseData from '@/lib/license.json';

let isLicensed = false;

export function registerYFilesLicense(): boolean {
  if (isLicensed) {
    return true;
  }
  try {
    License.value = licenseData;
    isLicensed = true;
    return true;
  } catch (err) {
    console.error('Failed to register yFiles license:', err);
    return false;
  }
}