// The homepage gallery is intentionally local and read-only: every frame is an
// existing installed-app screenshot. A working first frame remains if JS fails.
(() => {
  const gallery = document.querySelector('[data-gallery]')
  if (!gallery) return

  const slides = [...gallery.querySelectorAll('.hero-slide')]
  const dots = [...gallery.querySelectorAll('[data-gallery-index]')]
  const pauseButton = gallery.querySelector('[data-gallery-pause]')
  if (slides.length < 2 || dots.length !== slides.length || !pauseButton) return

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let index = 0
  let paused = reducedMotion
  let interacting = false
  let timer

  // Only the visible screenshot may receive keyboard focus or screen-reader
  // attention. Neither the UI nor this timer asserts a scientific result.
  function show(next) {
    index = (next + slides.length) % slides.length
    slides.forEach((slide, position) => {
      const active = position === index
      slide.classList.toggle('is-active', active)
      slide.tabIndex = active ? 0 : -1
      slide.setAttribute('aria-hidden', String(!active))
      dots[position].classList.toggle('is-active', active)
      if (active) dots[position].setAttribute('aria-current', 'true')
      else dots[position].removeAttribute('aria-current')
    })
  }

  // A fresh five-second interval follows each manual change. Hidden tabs,
  // reduced-motion preference and direct user interaction suspend rotation.
  function schedule() {
    window.clearTimeout(timer)
    if (paused || interacting || document.hidden) return
    timer = window.setTimeout(() => {
      show(index + 1)
      schedule()
    }, 5000)
  }

  function step(offset) {
    show(index + offset)
    schedule()
  }

  gallery.querySelector('[data-gallery-prev]').addEventListener('click', () => step(-1))
  gallery.querySelector('[data-gallery-next]').addEventListener('click', () => step(1))
  dots.forEach((dot, position) => dot.addEventListener('click', () => {
    show(position)
    schedule()
  }))

  pauseButton.addEventListener('click', () => {
    paused = !paused
    pauseButton.setAttribute('aria-pressed', String(paused))
    pauseButton.setAttribute('aria-label', paused ? '继续自动换页' : '暂停自动换页')
    pauseButton.textContent = paused ? '▶' : 'Ⅱ'
    schedule()
  })
  gallery.addEventListener('mouseenter', () => { interacting = true; schedule() })
  gallery.addEventListener('mouseleave', () => { interacting = false; schedule() })
  gallery.addEventListener('focusin', () => { interacting = true; schedule() })
  gallery.addEventListener('focusout', () => {
    window.setTimeout(() => {
      interacting = gallery.contains(document.activeElement)
      schedule()
    }, 0)
  })
  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      step(event.key === 'ArrowLeft' ? -1 : 1)
    }
  })
  document.addEventListener('visibilitychange', schedule)

  show(0)
  pauseButton.setAttribute('aria-pressed', String(paused))
  pauseButton.setAttribute('aria-label', paused ? '继续自动换页' : '暂停自动换页')
  pauseButton.textContent = paused ? '▶' : 'Ⅱ'
  gallery.classList.add('is-ready')
  schedule()
})()
