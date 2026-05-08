export const buildInfo = {
  version: __APP_VERSION__,
  commitSha: __APP_COMMIT_SHA__,
  buildId: __APP_BUILD_ID__,
  shortCommitSha: __APP_COMMIT_SHA__.slice(0, 7),
} as const
