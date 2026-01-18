export function createUI({ statusNode }) {
  return {
    setStatus(message) {
      statusNode.textContent = message;
    }
  };
}
