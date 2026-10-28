import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { fr } from '../i18n/fr'
import './MenuScene.css'

const VALUES = [8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7, 9, 11, 13, 15]
const RADII = [0, 1.7, 1, 0.55]
const ORDER = [0, 1, 3, 7, 8, 4, 9, 10, 2, 5, 11, 12, 6, 13, 14]
const GOLD = '246, 200, 100'

interface TreeNode {
  value: number
  index: number
  x: number
  y: number
  z: number
  parent?: number
}

interface Particle {
  angle: number
  radius: number
  y: number
  size: number
  z: number
}

/** Binary search tree laid out as a 3D heap: every node orbits its parent. */
function buildTree(): TreeNode[] {
  const nodes: TreeNode[] = VALUES.map((value, index) => ({
    value,
    index,
    x: 0,
    y: 0,
    z: 0,
  }))

  VALUES.forEach((_, index) => {
    if (index === 0) {
      nodes[0].y = -1.5
      return
    }

    const parent = nodes[(index - 1) >> 1]
    const side = (index - 1) % 2
    const level = Math.floor(Math.log2(index + 1))
    const phi = (level * Math.PI) / 2 + side * Math.PI + 0.4

    nodes[index].parent = parent.index
    nodes[index].x = parent.x + RADII[level] * Math.cos(phi)
    nodes[index].y = parent.y + 1
    nodes[index].z = parent.z + RADII[level] * Math.sin(phi)
  })

  return nodes
}

function buildParticles(): Particle[] {
  return Array.from({ length: 34 }, () => ({
    angle: Math.random() * Math.PI * 2,
    radius: 2.2 + Math.random() * 1.8,
    y: -2.2 + Math.random() * 4.6,
    size: 0.15 + Math.random() * 0.25,
    z: 1 + Math.random() * 1.5,
  }))
}

/**
 * Decorative hero scene: a binary search tree in 3D, lit in pre-order while it
 * slowly rotates. Dragging turns it by hand; the animation stops when the user
 * asks for reduced motion.
 */
export function MenuScene(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const box = canvas.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) return
    const context = canvas.getContext('2d')
    if (!context) return

    const nodes = buildTree()
    const particles = buildParticles()
    const rank: number[] = []
    ORDER.forEach((node, position) => {
      rank[node] = position
    })

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let angle = 0.6
    let tilt = 0.3
    let dragging = false
    let lastX = 0
    let lastY = 0
    let frameId = 0

    const size = (): void => {
      const box = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = box.width
      height = box.height
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const frame = (time: number): void => {
      if (width === 0 || height === 0) {
        frameId = requestAnimationFrame(frame)
        return
      }

      if (!dragging && !reduced) angle += 0.0022

      const unit = Math.min(width, height) / 6.6
      const cosAngle = Math.cos(angle)
      const sinAngle = Math.sin(angle)
      const cosTilt = Math.cos(tilt)
      const sinTilt = Math.sin(tilt)
      const step = reduced ? 20 : Math.floor(time / 1200) % (ORDER.length + 4)

      const project = (x: number, y: number, z: number) => {
        const px = x * cosAngle + z * sinAngle
        const pz = -x * sinAngle + z * cosAngle
        const py = y * cosTilt - pz * sinTilt
        const depth = y * sinTilt + pz * cosTilt
        const scale = 9 / (9 + depth)
        return {
          x: width / 2 + px * scale * unit,
          y: height * 0.47 + py * scale * unit,
          z: depth,
          scale,
        }
      }

      const points = nodes.map((node) => project(node.x, node.y, node.z))
      const items: Array<{ z: number; draw: () => void }> = []

      nodes.forEach((node) => {
        if (node.parent === undefined) return
        const start = points[node.parent]
        const end = points[node.index]
        const lit = rank[node.index] <= step
        items.push({
          z: (start.z + end.z) / 2 + 0.01,
          draw: () => {
            context.beginPath()
            context.moveTo(start.x, start.y)
            context.lineTo(end.x, end.y)
            context.strokeStyle = lit ? `rgba(${GOLD}, 0.9)` : 'rgba(150, 180, 255, 0.38)'
            context.lineWidth = (lit ? 2.6 : 1.5) * ((start.scale + end.scale) / 2)
            context.shadowColor = lit ? `rgba(${GOLD}, 0.8)` : 'transparent'
            context.shadowBlur = lit ? 10 : 0
            context.stroke()
            context.shadowBlur = 0
          },
        })
      })

      particles.forEach((particle) => {
        const orbit =
          particle.angle + (reduced ? 0 : time * 0.0002 * particle.size * 5)
        const point = project(
          particle.radius * Math.cos(orbit),
          particle.y,
          particle.radius * Math.sin(orbit),
        )
        items.push({
          z: point.z,
          draw: () => {
            context.beginPath()
            context.arc(point.x, point.y, particle.z * point.scale, 0, Math.PI * 2)
            context.fillStyle = `rgba(${GOLD}, ${0.15 + 0.4 * point.scale * 0.8})`
            context.fill()
          },
        })
      })

      nodes.forEach((node) => {
        const point = points[node.index]
        const active = rank[node.index] === step
        const visible = rank[node.index] <= step
        items.push({
          z: point.z,
          draw: () => {
            const radius =
              (node.index === 0 ? 0.3 : 0.24) * unit * point.scale * (active ? 1.18 : 1)
            const gradient = context.createRadialGradient(
              point.x - radius * 0.35,
              point.y - radius * 0.4,
              radius * 0.1,
              point.x,
              point.y,
              radius,
            )

            if (active) {
              gradient.addColorStop(0, '#fff6d2')
              gradient.addColorStop(0.5, '#f6c864')
              gradient.addColorStop(1, '#b9801f')
            } else if (visible) {
              gradient.addColorStop(0, '#ffe9a8')
              gradient.addColorStop(0.55, '#e3ad43')
              gradient.addColorStop(1, '#8a5d12')
            } else {
              gradient.addColorStop(0, '#9db8ff')
              gradient.addColorStop(0.55, '#3d63e0')
              gradient.addColorStop(1, '#14247a')
            }

            context.shadowColor = active
              ? `rgba(${GOLD}, 1)`
              : visible
                ? `rgba(${GOLD}, 0.5)`
                : 'rgba(80, 120, 255, 0.55)'
            context.shadowBlur = active ? radius * 2.2 : radius * 0.9
            context.beginPath()
            context.arc(point.x, point.y, radius, 0, Math.PI * 2)
            context.fillStyle = gradient
            context.fill()
            context.shadowBlur = 0
            context.lineWidth = 1
            context.strokeStyle = visible
              ? 'rgba(255, 235, 170, 0.7)'
              : 'rgba(190, 210, 255, 0.5)'
            context.stroke()
            context.font = `700 ${radius * 0.95}px ui-monospace, Consolas, monospace`
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillStyle = visible ? '#1a1440' : '#fff'
            context.fillText(String(node.value), point.x, point.y + radius * 0.05)
          },
        })
      })

      context.clearRect(0, 0, width, height)
      items.sort((first, second) => second.z - first.z)
      items.forEach((item) => item.draw())

      frameId = requestAnimationFrame(frame)
    }

    const onPointerDown = (event: PointerEvent): void => {
      dragging = true
      lastX = event.clientX
      lastY = event.clientY
      canvas.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent): void => {
      if (!dragging) return
      angle += (event.clientX - lastX) * 0.01
      tilt = Math.max(-0.2, Math.min(0.8, tilt + (event.clientY - lastY) * 0.006))
      lastX = event.clientX
      lastY = event.clientY
    }

    const onPointerUp = (): void => {
      dragging = false
    }

    size()
    window.addEventListener('resize', size)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    frameId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', size)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
    }
  }, [])

  return (
    <div className="menu-scene" aria-hidden="true">
      <canvas ref={canvasRef} className="menu-scene-canvas" />
      <p className="menu-scene-hint">{fr.menu.sceneHint}</p>
    </div>
  )
}
