/**
 * Application semantic version management.
 *
 * Version format: MAJOR.MINOR.PATCH (e.g., "1.2.3")
 * Retrieved from package.json at build time.
 */

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.1.0'

/**
 * Parse a semantic version string into its components.
 * @param version - Version string in format "MAJOR.MINOR.PATCH"
 * @returns Object with major, minor, patch properties
 * @throws Error if version format is invalid
 */
export function parseVersion(version: string): {
  major: number
  minor: number
  patch: number
} {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/)
  if (!match) {
    throw new Error(`Invalid semantic version format: "${version}". Expected format: MAJOR.MINOR.PATCH`)
  }
  return {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2]!, 10),
    patch: parseInt(match[3]!, 10),
  }
}

/**
 * Compare two semantic versions.
 * @param version1 - First version string
 * @param version2 - Second version string
 * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
 */
export function compareVersions(version1: string, version2: string): -1 | 0 | 1 {
  const v1 = parseVersion(version1)
  const v2 = parseVersion(version2)

  if (v1.major !== v2.major) {
    return v1.major < v2.major ? -1 : 1
  }
  if (v1.minor !== v2.minor) {
    return v1.minor < v2.minor ? -1 : 1
  }
  if (v1.patch !== v2.patch) {
    return v1.patch < v2.patch ? -1 : 1
  }
  return 0
}

/**
 * Get the current application version.
 * @returns The app version string
 */
export function getAppVersion(): string {
  return APP_VERSION
}

/**
 * Check if a version is newer than the current app version.
 * @param version - Version string to compare
 * @returns true if version is newer than APP_VERSION
 */
export function isNewerVersion(version: string): boolean {
  return compareVersions(version, APP_VERSION) > 0
}
