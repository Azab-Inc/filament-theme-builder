import { ref } from 'vue'

/** UI draft reset signals; never writes canonical theme state. */
export function useColorFieldResets() {
  const resetKeys = ref<Record<string, number>>({})
  function resetField(id: string): void {
    resetKeys.value[id] = (resetKeys.value[id] ?? 0) + 1
  }
  return { resetKeys, resetField }
}
