import { dynoComparison } from '../config/siteConfig';
import { buildEngineCurve } from './dynoPhysics';

const { before, after, redline } = dynoComparison;

/** Curvas da comparação ANTES / DEPOIS (dados ilustrativos de siteConfig). */
export const beforeCurve = buildEngineCurve({
  peakTorque: before.torque,
  peakPower: before.power,
  peakPowerRpm: before.powerRpm,
  redline,
});

export const afterCurve = buildEngineCurve({
  peakTorque: after.torque,
  peakPower: after.power,
  peakPowerRpm: after.powerRpm,
  redline,
  spoolStart: 1600,
  spoolEnd: 3000,
});
