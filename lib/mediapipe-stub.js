// Stub for @mediapipe/pose — this package has no proper ESM exports.
// cv-analysis.ts uses MoveNet only, which does not call any mediapipe code at runtime.
// Named exports satisfy Turbopack/webpack static-analysis during build.
export const Pose = undefined;
export const POSE_CONNECTIONS = undefined;
export const POSE_LANDMARKS = undefined;
export const POSE_LANDMARKS_LEFT_SIDE = undefined;
export const POSE_LANDMARKS_RIGHT_SIDE = undefined;
export const POSE_LANDMARKS_NEUTRAL = undefined;
export default {};
