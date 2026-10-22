import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const BASE = process.env.SHOTS_BASE ?? 'http://127.0.0.1:4173'
const OUT = fileURLToPath(new URL('./shots/', import.meta.url))
mkdirSync(OUT, { recursive: true })

const wait = (page, ms = 400) => page.waitForTimeout(ms)

const shot = async (page, name, settle = 700) => {
  await wait(page, settle)
  await page.screenshot({ path: `${OUT}${name}.png` })
  console.log(`saved ${name}`)
}

const blur = async (page) => {
  await page.evaluate(() => {
    const active = document.activeElement
    if (active instanceof HTMLElement) active.blur()
  })
}

const CHAPTER4 = `${BASE}/#/chapitre-4`
const MENU = `${BASE}/#/`

const openPage = async (browser, width, height) => {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(CHAPTER4, { waitUntil: 'networkidle' })
  await page.waitForSelector('.ldc-svg', { timeout: 10000 })
  await wait(page, 250)
  return page
}

const selectOperation = async (page, label) => {
  await page.getByLabel('Opération', { exact: true }).selectOption({ label })
}

const startOperation = async (page, label, params = {}) => {
  await selectOperation(page, label)
  for (const [field, value] of Object.entries(params)) {
    await page.getByLabel(field, { exact: true }).fill(String(value))
  }
  await page.getByRole('button', { name: 'Exécuter', exact: true }).click()
  await page.locator('.in-progress').waitFor({ timeout: 4000 })
  const pause = page.getByRole('button', { name: 'Pause', exact: true })
  await pause.waitFor({ timeout: 3000 })
  await pause.click()
  await blur(page)
}

const finishOperation = async (page) => {
  const finish = page.getByRole('button', { name: 'Terminer', exact: true })
  if (await finish.isVisible()) {
    await finish.click()
    await wait(page, 350)
  }
  await blur(page)
}

const loadScenario = async (page, needle) => {
  await page.getByRole('button', { name: 'Scénarios' }).click()
  await page.locator('.scenario-popover').waitFor()
  await page.locator('.scenario-item', { hasText: needle }).first().click()
  await wait(page, 400)
}

const startScenarioOperation = async (page) => {
  await page.getByRole('button', { name: 'Prochaine opération' }).click()
  await page.locator('.in-progress').waitFor({ timeout: 4000 })
  await blur(page)
}

const stepUntilCaption = async (page, needle, maxSteps = 80) => {
  for (let index = 0; index < maxSteps; index += 1) {
    const caption = (await page.locator('.caption-text').textContent()) ?? ''
    if (caption.includes(needle)) return
    await page.keyboard.press('ArrowRight')
    await wait(page, 180)
  }
  throw new Error(`caption not reached: ${needle}`)
}

const stepUntilCounter = async (page, needle, maxSteps = 80) => {
  for (let index = 0; index < maxSteps; index += 1) {
    const counter = (await page.locator('.step-counter').textContent()) ?? ''
    if (counter.includes(needle)) return
    await page.keyboard.press('ArrowRight')
    await wait(page, 180)
  }
  throw new Error(`step counter not reached: ${needle}`)
}

const insertTo8 = async (page) => {
  await loadScenario(page, 'Le cours')
  for (const value of [30, 40, 50, 60, 70]) {
    await startOperation(page, 'Insérer en fin', { Valeur: value })
    await finishOperation(page)
  }
}

const codeMetrics = (page) =>
  page.evaluate(() => {
    const body = document.querySelector('.code-body')
    const line = document.querySelector('.line-code')
    if (!(body instanceof HTMLElement) || !(line instanceof HTMLElement)) {
      throw new Error('code panel missing')
    }
    return {
      clientWidth: body.clientWidth,
      scrollWidth: body.scrollWidth,
      clientHeight: body.clientHeight,
      scrollHeight: body.scrollHeight,
      fontSize: getComputedStyle(line).fontSize,
    }
  })

const expectCodeFits = async (page, label) => {
  const metrics = await codeMetrics(page)
  console.log(`${label}: ${JSON.stringify(metrics)}`)
  if (metrics.scrollWidth > metrics.clientWidth + 1) {
    throw new Error(`${label}: code clips horizontally`)
  }
}

const openPresentation = async (page) => {
  await blur(page)
  await page.keyboard.press('p')
  await wait(page, 650)
}

const wheelTo200 = async (page) => {
  await page.locator('.camera-zoom-label').click()
  await wait(page, 400)
  const stage = page.locator('.viz-stage')
  const box = await stage.boundingBox()
  if (!box) throw new Error('stage missing')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, -462)
  await wait(page, 450)
  await page.mouse.move(box.x + 70, box.y + box.height - 60)
  await page.mouse.down()
  await page.mouse.move(box.x + 160, box.y + box.height - 110, { steps: 8 })
  await page.mouse.up()
  await wait(page, 350)
  const zoom = (await page.locator('.camera-zoom-label').textContent()) ?? ''
  const mode = (await page.locator('.camera-mode').textContent()) ?? ''
  if (!zoom.includes('200') || !mode.includes('Manuel')) {
    throw new Error(`manual zoom failed: ${zoom.trim()} / ${mode.trim()}`)
  }
  console.log(`manual zoom: ${zoom.trim()} / ${mode.trim()}`)
}

const browser = await chromium.launch()

const desktop = await openPage(browser, 1920, 1080)
await shot(desktop, '01-empty-1920')
const desktopDockCollapsed = await desktop.locator('.bottom-dock').evaluate((element) =>
  element.classList.contains('collapsed'),
)
if (desktopDockCollapsed) throw new Error('dock should start expanded at 1920x1080')

await loadScenario(desktop, 'LE point fort')
await startScenarioOperation(desktop)
await stepUntilCaption(desktop, 'détache')
await shot(desktop, '02-delete-middle-1920', 1200)
await desktop.close()

const heap = await openPage(browser, 1920, 1080)
await loadScenario(heap, 'Le cours')
await startOperation(heap, 'Insérer en tête', { Valeur: 7 })
await stepUntilCaption(heap, 'malloc')
await shot(heap, '03-heap-1920', 1200)
await stepUntilCaption(heap, 'debut re')
await shot(heap, '04-shared-pins-1920', 1200)
await heap.close()

const eightDesktop = await openPage(browser, 1920, 1080)
await insertTo8(eightDesktop)
await shot(eightDesktop, '05-eight-nodes-1920', 900)
await eightDesktop.getByRole('button', { name: 'Thème sombre' }).click()
await shot(eightDesktop, '06-dark-eight-1920', 500)
await eightDesktop.locator('.shortcuts .header-icon-button').click()
await shot(eightDesktop, '07-shortcuts-1920', 400)
await eightDesktop.close()

const presentationDesktop = await openPage(browser, 1920, 1080)
await loadScenario(presentationDesktop, 'Le cours')
await startOperation(presentationDesktop, 'Supprimer une valeur', { Valeur: 2 })
await openPresentation(presentationDesktop)
const presentationMetaVisible = await presentationDesktop.locator('.brand-meta').isVisible()
if (!presentationMetaVisible) throw new Error('presentation header hides its metadata')
await expectCodeFits(presentationDesktop, 'presentation-1920')
await shot(presentationDesktop, '08-presentation-supprimer-1920', 500)
await presentationDesktop.close()

const fullscreenDesktop = await openPage(browser, 1920, 1080)
await loadScenario(fullscreenDesktop, 'Le cours')
await startOperation(fullscreenDesktop, 'Supprimer une valeur', { Valeur: 2 })
await fullscreenDesktop.getByRole('button', { name: 'Plein écran', exact: true }).click()
await wait(fullscreenDesktop, 500)
const fullscreenState = await fullscreenDesktop.evaluate(() => ({
  active: document.querySelector('.app')?.classList.contains('simulation-fullscreen'),
  header: getComputedStyle(document.querySelector('.app-header')).display,
  code: getComputedStyle(document.querySelector('.right-column')).display,
  dock: getComputedStyle(document.querySelector('.bottom-dock')).display,
}))
console.log(`fullscreen: ${JSON.stringify(fullscreenState)}`)
if (!fullscreenState.active || fullscreenState.header !== 'none' || fullscreenState.code !== 'none' || fullscreenState.dock !== 'none') {
  throw new Error('simulation fullscreen does not hide the shell panels')
}
await shot(fullscreenDesktop, '18-fullscreen-1920', 500)
await fullscreenDesktop.keyboard.press('Escape')
await wait(fullscreenDesktop, 350)
const fullscreenExited = await fullscreenDesktop.locator('.app').evaluate(
  (element) => !element.classList.contains('simulation-fullscreen'),
)
if (!fullscreenExited) throw new Error('Escape did not leave simulation fullscreen')
await fullscreenDesktop.close()

const manualDesktop = await openPage(browser, 1920, 1080)
await loadScenario(manualDesktop, 'Le cours')
await wheelTo200(manualDesktop)
await shot(manualDesktop, '09-manual-200-1920', 500)
await manualDesktop.close()

const mobile = await openPage(browser, 1280, 720)
await shot(mobile, '10-empty-1280')
const mobileDockCollapsed = await mobile.locator('.bottom-dock').evaluate((element) =>
  element.classList.contains('collapsed'),
)
if (!mobileDockCollapsed) throw new Error('dock should start collapsed at 1280x720')

await insertTo8(mobile)
await expectCodeFits(mobile, 'regular-1280')
await shot(mobile, '11-eight-nodes-1280', 900)
await mobile.close()

const popoversMobile = await openPage(browser, 1280, 720)
await popoversMobile.locator('.scenarios-trigger').click()
await wait(popoversMobile, 250)
const scenarioRect = await popoversMobile.locator('.scenario-popover').evaluate((element) => {
  const rect = element.getBoundingClientRect()
  return { right: rect.right, bottom: rect.bottom }
})
if (scenarioRect.right > 1280 || scenarioRect.bottom > 720) {
  throw new Error('scenario popover leaves the viewport')
}
await shot(popoversMobile, '16-scenarios-1280', 250)
await popoversMobile.keyboard.press('Escape')
const scenarioFocus = await popoversMobile.evaluate(() => document.activeElement?.classList.contains('scenarios-trigger'))
if (!scenarioFocus) throw new Error('scenario popover did not return focus')
await popoversMobile.locator('.shortcuts .header-icon-button').click()
await wait(popoversMobile, 250)
const shortcutsRect = await popoversMobile.locator('.shortcuts-popover').evaluate((element) => {
  const rect = element.getBoundingClientRect()
  return { right: rect.right, bottom: rect.bottom }
})
if (shortcutsRect.right > 1280 || shortcutsRect.bottom > 720) {
  throw new Error('shortcuts popover leaves the viewport')
}
await shot(popoversMobile, '17-shortcuts-1280', 250)
await popoversMobile.close()

const presentationMobile = await openPage(browser, 1280, 720)
await loadScenario(presentationMobile, 'Le cours')
await startOperation(presentationMobile, 'Supprimer une valeur', { Valeur: 2 })
await openPresentation(presentationMobile)
await blur(presentationMobile)
await presentationMobile.keyboard.press('d')
await wait(presentationMobile, 600)
const presentationState = await presentationMobile.evaluate(() => ({
  journal: document.querySelectorAll('.journal-panel').length,
  variables: document.querySelectorAll('.watch-panel').length,
  console: document.querySelectorAll('.console-panel').length,
  dockCollapsed: document.querySelector('.bottom-dock')?.classList.contains('collapsed'),
}))
console.log(`presentation-1280 dock: ${JSON.stringify(presentationState)}`)
if (presentationState.journal !== 0 || presentationState.variables !== 1 || presentationState.console !== 1) {
  throw new Error('presentation dock does not show Variables + Console only')
}
if (presentationState.dockCollapsed) throw new Error('presentation dock did not expand')
await expectCodeFits(presentationMobile, 'presentation-1280')
await shot(presentationMobile, '12-presentation-supprimer-1280', 500)
await presentationMobile.close()

const manualMobile = await openPage(browser, 1280, 720)
await loadScenario(manualMobile, 'Le cours')
await wheelTo200(manualMobile)
await shot(manualMobile, '13-manual-200-1280', 500)
await manualMobile.close()

const inverseDesktop = await openPage(browser, 1920, 1080)
await loadScenario(inverseDesktop, 'Inverser la liste')
await startScenarioOperation(inverseDesktop)
await stepUntilCounter(inverseDesktop, '13 / 25')
const reverseArrows = await inverseDesktop.evaluate(
  () =>
    [...document.querySelectorAll('.arrow.arrow-suivant, .arrow.arrow-precedent')].filter((path) =>
      (path.getAttribute('d') ?? '').includes(' C '),
    ).length,
)
console.log(`inverser-1920 curved arrows at 13/25: ${reverseArrows}`)
if (reverseArrows < 1) throw new Error('expected reverse arcs during inverserListe')
await shot(inverseDesktop, '14-inverser-mid-1920', 1400)
await inverseDesktop.close()

const inverseMobile = await openPage(browser, 1280, 720)
await loadScenario(inverseMobile, 'Inverser la liste')
await startScenarioOperation(inverseMobile)
await stepUntilCounter(inverseMobile, '13 / 25')
await shot(inverseMobile, '15-inverser-mid-1280', 1400)
await inverseMobile.close()

// main menu (#/) — entry point, 1920×1080 and 1280×720, light and dark
const menuShot = async (width, height, theme, name) => {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(MENU, { waitUntil: 'networkidle' })
  await page.waitForSelector('.menu-app', { timeout: 10000 })
  if (theme === 'dark') {
    await page.getByRole('button', { name: 'Passer au thème sombre', exact: true }).click()
  }
  await blur(page)
  await shot(page, name, 500)
  await page.close()
}

for (const [width, height, suffix] of [
  [1920, 1080, '1920'],
  [1280, 720, '1280'],
]) {
  await menuShot(width, height, 'light', `16-menu-${suffix}`)
  await menuShot(width, height, 'dark', `17-menu-dark-${suffix}`)
}

// the menu card opens the chapter 4 demo, and ← Menu comes back
const menuNav = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await menuNav.goto(MENU, { waitUntil: 'networkidle' })
await menuNav.getByRole('link', { name: 'Ouvrir « Listes doublement chaînées »' }).click()
await menuNav.waitForSelector('.ldc-svg', { timeout: 10000 })
const chapterHashAfterClick = await menuNav.evaluate(() => window.location.hash)
if (chapterHashAfterClick !== '#/chapitre-4') {
  throw new Error(`menu card did not open the demo: ${chapterHashAfterClick}`)
}
await menuNav.getByRole('button', { name: 'Revenir au menu principal' }).click()
await menuNav.waitForSelector('.menu-app', { timeout: 10000 })
const menuHashAfterBack = await menuNav.evaluate(() => window.location.hash)
if (menuHashAfterBack !== '#/') throw new Error(`← Menu did not return: ${menuHashAfterBack}`)
await menuNav.close()

await browser.close()
console.log(`done -> ${OUT}`)
