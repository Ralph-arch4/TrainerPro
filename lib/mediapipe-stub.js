// Stub for @mediapipe/pose — this package has no proper ESM exports.
// cv-analysis.ts uses MoveNet only, which does not call any mediapipe code at runtime.
// This stub prevents Turbopack/webpack static-analysis errors during build.
module.exports = {};
