/**
 * Asserts that a condition is true. If the condition is false, it throws an error with the given message.
 * Reference: https://github.com/visgl/react-map-gl/blob/master/modules/react-maplibre/src/utils/assert.ts
 * @param  condition required condition.
 * @param message required message.
 */
export default function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
