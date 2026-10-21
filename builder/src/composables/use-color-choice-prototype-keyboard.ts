import { onMounted, onUnmounted } from 'vue'

export function useColorChoicePrototypeKeyboard(isOpen: () => boolean, close: () => void): void {
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen()) close()
  }
  onMounted(() => window.addEventListener('keydown', onKey))
  onUnmounted(() => window.removeEventListener('keydown', onKey))
}
