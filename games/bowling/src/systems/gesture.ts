export interface ScreenPoint { x: number; y: number }
export const MIN_PULL = 14;
export const MAX_PULL = 120;
export const MIN_ANGLE = -25;
export const MAX_ANGLE = 30;
export const clamp = (value: number, min: number, max: number): number => Math.max(min,Math.min(max,value));

/** Invert the projected launch plane so a pull follows the visible camera orientation. */
export function dragShot(pull: ScreenPoint, right: ScreenPoint, forward: ScreenPoint) {
  const determinant=right.x*forward.y-right.y*forward.x;
  const distance=Math.hypot(pull.x,pull.y);
  if(Math.abs(determinant)<0.001) return {angle:0,power:20,armed:false};
  const x=(-pull.x*forward.y+pull.y*forward.x)/determinant;
  const ahead=(-right.x*pull.y+right.y*pull.x)/determinant;
  const angle=clamp(Math.round(Math.atan2(x,ahead)*180/Math.PI*2)/2,MIN_ANGLE,MAX_ANGLE);
  const power=Math.round(20+clamp((distance-MIN_PULL)/(MAX_PULL-MIN_PULL),0,1)*80);
  return {angle:angle===0?0:angle,power,armed:distance>=MIN_PULL && ahead>0};
}
