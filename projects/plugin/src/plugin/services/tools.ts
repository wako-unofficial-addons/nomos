import { wakoLog } from '@wako-app/mobile-sdk';

export function logData(...data: any) {
  wakoLog('plugin.nomos', data);
}
