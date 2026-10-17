/**
 * Keep `--app-h` pinned to the *visual* viewport height.
 *
 * `100dvh` is right most of the time, but the software keyboard and the
 * collapsing URL bar are not part of the layout viewport on every browser
 * (iOS Safari in particular). Tracking `visualViewport` keeps the app shell —
 * and therefore the composer — exactly as tall as what the user can see, so
 * the input is never hidden behind the keyboard.
 */
export function installViewportHeight() {
  const root = document.documentElement
  const vv = window.visualViewport

  const apply = () => {
    const h = vv?.height ?? window.innerHeight
    if (h > 0) root.style.setProperty('--app-h', `${Math.round(h)}px`)
  }

  apply()
  window.addEventListener('resize', apply)
  window.addEventListener('orientationchange', apply)
  vv?.addEventListener('resize', apply)
  vv?.addEventListener('scroll', apply)
}
