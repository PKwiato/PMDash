import { ref, type Ref } from 'vue';

export function useFixedTooltip(triggerRef: Ref<HTMLElement | null>) {
  const visible = ref(false);
  const top = ref(0);
  const left = ref(0);

  function show() {
    const el = triggerRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    top.value = rect.top;
    left.value = rect.left + rect.width / 2;
    visible.value = true;
  }

  function hide() {
    visible.value = false;
  }

  return { visible, top, left, show, hide };
}
