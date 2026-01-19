'use client'

import { useEffect, useRef, useState } from 'react'
import { 
  Waves, 
  Flower2, 
  Layers, 
  Maximize2, 
  ZoomIn, 
  Palette, 
  Droplet, 
  RotateCw, 
  Play, 
  ArrowRightLeft,
  ArrowLeft,
  ArrowRight,
  Shuffle,
  X,
  Minus,
  CheckSquare,
  Square,
  Pause,
  Download,
  Loader2
} from 'lucide-react'
import styles from './page.module.css'

// Generate wavy circle (flower petal shape)
function generateWavyCircle(
  radius: number,
  petalCount: number,
  waviness: number,
  rotation: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  const segments = 64 // Smooth circle with many points
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2 + rotation
    const baseRadius = radius
    
    // Add wavy petal effect - create waves based on petal count
    const petalWave = Math.sin(angle * petalCount) * waviness * radius
    const currentRadius = baseRadius + petalWave
    
    points.push({
      x: Math.cos(angle) * currentRadius,
      y: Math.sin(angle) * currentRadius
    })
  }
  
  return points
}

// Flower class with circular blooms that grow from center outward
class Flower {
  x: number
  y: number
  baseRadius: number
  petalCount: number
  rotation: number
  rotationSpeed: number
  bloomProgress: number
  bloomSpeed: number
  color: string
  centerColor: string
  waviness: number
  layerCount: number
  opacity: number
  isActive: boolean
  rotationDirection: number // 1 for right, -1 for left

  constructor(
    x: number,
    y: number,
    settings: {
      baseRadius?: number
      petalCount?: number
      waviness?: number
      color?: string
      bloomSpeed?: number
      rotationSpeed?: number
      opacity?: number
      layerCount?: number
      rotationDirection?: 'left' | 'right' | 'random'
      scale?: number
    } = {}
  ) {
    this.x = x
    this.y = y
    const scale = settings.scale ?? 1
    this.baseRadius = (settings.baseRadius ?? (30 + Math.random() * 40)) * scale
    this.petalCount = settings.petalCount ?? (5 + Math.floor(Math.random() * 4))
    this.rotation = Math.random() * Math.PI * 2
    
    // Determine rotation direction based on setting
    let direction: number
    if (settings.rotationDirection === 'random') {
      direction = Math.random() > 0.5 ? 1 : -1
    } else if (settings.rotationDirection === 'left') {
      direction = -1
    } else {
      direction = 1 // 'right' or default
    }
    
    this.rotationDirection = direction
    this.rotationSpeed = (settings.rotationSpeed ?? ((Math.random() - 0.5) * 0.02)) * this.rotationDirection
    this.bloomProgress = 0
    this.bloomSpeed = settings.bloomSpeed ?? (0.008 + Math.random() * 0.01)
    this.waviness = settings.waviness ?? 0.15
    this.layerCount = settings.layerCount ?? 4
    this.opacity = settings.opacity ?? 0.8
    this.isActive = true // New flowers start active
    
    // Use provided color or generate from hue
    if (settings.color) {
      this.color = settings.color
      // Generate complementary center color
      const colorMatch = settings.color.match(/hsla?\((\d+)/)
      if (colorMatch) {
        const hue = parseInt(colorMatch[1])
        this.centerColor = `hsla(${(hue + 30) % 360}, 80%, 50%, ${this.opacity})`
      } else {
        this.centerColor = settings.color
      }
    } else {
      const hue = Math.random() * 360
      this.color = `hsla(${hue}, 70%, 60%, ${this.opacity})`
      this.centerColor = `hsla(${(hue + 30) % 360}, 80%, 50%, ${this.opacity})`
    }
  }

  updateRotation(globalRotationDirection?: 'left' | 'right' | 'random') {
    // Update rotation direction if global setting changed
    if (globalRotationDirection !== undefined) {
      let direction: number
      if (globalRotationDirection === 'random') {
        // For random, keep the current direction (don't change existing flowers)
        direction = this.rotationDirection
      } else if (globalRotationDirection === 'left') {
        direction = -1
      } else {
        direction = 1 // 'right'
      }
      
      this.rotationDirection = direction
      const baseSpeed = Math.abs(this.rotationSpeed)
      this.rotationSpeed = baseSpeed * this.rotationDirection
    }
    
    // Always rotate (even when not active)
    this.rotation += this.rotationSpeed
  }
  
  updateGrowth() {
    // Only grow if active
    if (!this.isActive) return
    
    // Continue growing indefinitely
    this.bloomProgress += this.bloomSpeed
  }
  
  deactivate() {
    this.isActive = false
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation)

    // Draw layers from inside out (like petals blooming)
    for (let layer = this.layerCount - 1; layer >= 0; layer--) {
      const layerProgress = Math.min(1, Math.max(0, (this.bloomProgress - (layer / this.layerCount)) * (this.layerCount / (this.layerCount - layer))))
      
      if (layerProgress <= 0) continue
      
      // Each layer grows from center outward
      // Layer radius is calculated based on its position in the layer stack, maintaining consistent spacing
      const layerRadius = (this.baseRadius * (layer + 1) / this.layerCount) * layerProgress
      
      // Generate wavy circle for this layer
      const wavyCircle = generateWavyCircle(
        layerRadius,
        this.petalCount,
        this.waviness,
        0
      )

      // Alternate colors for op-art effect
      const isEvenLayer = layer % 2 === 0
      ctx.fillStyle = isEvenLayer ? this.color : this.centerColor
      ctx.strokeStyle = isEvenLayer ? this.centerColor : this.color
      
      ctx.lineWidth = 1
      ctx.globalAlpha = this.opacity * layerProgress

      // Draw the wavy circle
      if (wavyCircle.length > 0) {
        ctx.beginPath()
        ctx.moveTo(wavyCircle[0].x, wavyCircle[0].y)
        
        // Use quadratic curves for smooth wavy edges
        for (let i = 1; i < wavyCircle.length; i++) {
          const current = wavyCircle[i]
          const next = wavyCircle[(i + 1) % wavyCircle.length]
          const midX = (current.x + next.x) / 2
          const midY = (current.y + next.y) / 2
          ctx.quadraticCurveTo(current.x, current.y, midX, midY)
        }
        
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }

      // Add inner concentric circle for op-art depth effect
      if (layerProgress > 0.3 && layer > 0) {
        const innerRadius = layerRadius * 0.6
        const innerCircle = generateWavyCircle(
          innerRadius,
          this.petalCount,
          this.waviness * 0.5,
          0
        )

        ctx.fillStyle = isEvenLayer ? this.centerColor : this.color
        
        ctx.globalAlpha = this.opacity * layerProgress * 0.6
        
        if (innerCircle.length > 0) {
          ctx.beginPath()
          ctx.moveTo(innerCircle[0].x, innerCircle[0].y)
          
          for (let i = 1; i < innerCircle.length; i++) {
            const current = innerCircle[i]
            const next = innerCircle[(i + 1) % innerCircle.length]
            const midX = (current.x + next.x) / 2
            const midY = (current.y + next.y) / 2
            ctx.quadraticCurveTo(current.x, current.y, midX, midY)
          }
          
          ctx.closePath()
          ctx.fill()
        }
      }
    }

    // Draw center circle
    if (this.bloomProgress > 0.1) {
      // Cap center circle growth to maintain proper proportions
      const centerProgress = Math.min(1, this.bloomProgress)
      const centerRadius = this.baseRadius * 0.15 * centerProgress
      ctx.beginPath()
      ctx.arc(0, 0, centerRadius, 0, Math.PI * 2)
      
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerRadius)
      gradient.addColorStop(0, this.centerColor)
      gradient.addColorStop(0.5, this.color)
      gradient.addColorStop(1, this.centerColor)
      ctx.fillStyle = gradient
      
      ctx.globalAlpha = this.opacity
      ctx.fill()
    }

    ctx.restore()
  }
}

// Color palettes
const colorPalettes = {
  '90sPastels': {
    name: "'90s Pastels",
    colors: ['#a1fbb9', '#a0c0ec', '#eef66c', '#db7bec']
  },
  y2k: {
    name: 'Y2K',
    colors: ['#036163', '#ebbe51', '#bc6f7e', '#8c0918']
  },
  ohSnap: {
    name: 'Oh Snap',
    colors: ['#1b153b', '#32a3db', '#d9d130', '#e03385']
  },
  '90sIcon': {
    name: "'90s Icon",
    colors: ['#7262d4', '#35bd8b', '#fca80e', '#c8288f']
  },
  electric: {
    name: 'Electric',
    colors: ['#fb0df1', '#05f7cd', '#aaf604', '#fbfc0b']
  }
}

// Custom hook for drag-to-adjust number inputs
function useDragAdjust(
  value: number,
  onChange: (value: number) => void,
  min: number,
  max: number,
  step: number
) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartValue, setDragStartValue] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
    const startX = e.clientX
    const startY = e.clientY
    let isDraggingActive = false
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX)
      const deltaY = Math.abs(moveEvent.clientY - startY)
      
      // If mouse moved more than 5px vertically (and more than horizontally), start dragging
      if (!isDraggingActive && deltaY > 5 && deltaY > deltaX) {
        isDraggingActive = true
        setIsDragging(true)
        setDragStartY(startY)
        setDragStartValue(value)
        e.preventDefault()
        inputRef.current?.blur() // Remove focus to prevent text selection
      }
    }
    
    const handleMouseUp = () => {
      if (!isDraggingActive) {
        // Allow normal text editing if no drag occurred
        inputRef.current?.focus()
        inputRef.current?.select()
      }
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = dragStartY - e.clientY // Inverted: drag up = increase
      const range = max - min
      // Sensitivity: 100px of drag = full range
      const sensitivity = range / 100
      const deltaValue = deltaY * sensitivity
      const newValue = Math.max(min, Math.min(max, dragStartValue + deltaValue))
      
      // Round to nearest step
      const roundedValue = Math.round(newValue / step) * step
      onChange(roundedValue)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStartY, dragStartValue, min, max, step, onChange])

  return {
    inputRef,
    isDragging,
    handleMouseDown,
  }
}

// Color conversion utilities (used by both Home and CustomColorPicker)
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min
  let h = 0
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6
    } else if (max === g) {
      h = (b - r) / diff + 2
    } else {
      h = (r - g) / diff + 4
    }
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360
  const s = max === 0 ? 0 : Math.round((diff / max) * 100)
  const v = Math.round(max * 100)
  return { h, s, v }
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  s /= 100
  v /= 100
  const c = v * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const flowersRef = useRef<Flower[]>([])
  const isMouseDownRef = useRef(false)
  const lastFlowerTimeRef = useRef(0)
  const animationIdRef = useRef<number>()
  const initialMousePosRef = useRef<{ x: number; y: number } | null>(null)
  const lastFlowerPosRef = useRef<{ x: number; y: number } | null>(null) // Track last flower position for brush mode
  const isPaintingModeRef = useRef(false) // true = dragging/painting, false = holding/growing
  
  // Settings state
  const [settings, setSettings] = useState({
    waviness: 0.15,
    petalCount: 6,
    baseRadius: 50,
    selectedPalette: '90sPastels' as keyof typeof colorPalettes,
    bloomSpeed: 0.025,
    rotationSpeed: 0.01,
    opacity: 0.8,
    layerCount: 4,
    scale: 1,
    rotationDirection: 'right' as 'left' | 'right' | 'random', // 'left', 'right', or 'random'
    animationEnabled: true,
    showToolbar: true,
    toolbarPosition: 'top' as 'top' | 'bottom'
  })
  
  const activeFlowerRef = useRef<Flower | null>(null)
  const [clearConfirming, setClearConfirming] = useState(false)
  const [exportHovered, setExportHovered] = useState(false)
  const [isExportingGIF, setIsExportingGIF] = useState(false)
  
  // Get a random color from the selected palette
  const getColorFromPalette = (): string => {
    const palette = colorPalettes[settings.selectedPalette]
    return palette.colors[Math.floor(Math.random() * palette.colors.length)]
  }

  // Calculate average color from palette for UI tinting
  const getPaletteTintColor = (): string => {
    const palette = colorPalettes[settings.selectedPalette]
    if (palette.colors.length === 0) return '#667eea' // Default fallback
    
    // Calculate average RGB values
    let totalR = 0, totalG = 0, totalB = 0
    let validColors = 0
    
    palette.colors.forEach(color => {
      const rgb = hexToRgb(color)
      if (rgb) {
        totalR += rgb.r
        totalG += rgb.g
        totalB += rgb.b
        validColors++
      }
    })
    
    if (validColors === 0) return '#667eea'
    
    const avgR = Math.round(totalR / validColors)
    const avgG = Math.round(totalG / validColors)
    const avgB = Math.round(totalB / validColors)
    
    return `rgb(${avgR}, ${avgG}, ${avgB})`
  }

  // Apply palette tint to UI via CSS variables
  useEffect(() => {
    const tintColor = getPaletteTintColor()
    let rgb: { r: number; g: number; b: number } | null = null
    
    if (tintColor.startsWith('#')) {
      rgb = hexToRgb(tintColor)
    } else if (tintColor.startsWith('rgb')) {
      // Parse rgb() string
      const match = tintColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (match) {
        rgb = {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3])
        }
      }
    }
    
    if (rgb) {
      // Set CSS variables for UI tinting with different opacities
      document.documentElement.style.setProperty('--palette-tint-r', rgb.r.toString())
      document.documentElement.style.setProperty('--palette-tint-g', rgb.g.toString())
      document.documentElement.style.setProperty('--palette-tint-b', rgb.b.toString())
      document.documentElement.style.setProperty('--palette-tint', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)
      document.documentElement.style.setProperty('--palette-tint-05', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`)
      document.documentElement.style.setProperty('--palette-tint-10', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`)
      document.documentElement.style.setProperty('--palette-tint-15', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`)
      document.documentElement.style.setProperty('--palette-tint-20', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`)
      document.documentElement.style.setProperty('--palette-tint-25', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`)
      document.documentElement.style.setProperty('--palette-tint-30', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`)
      document.documentElement.style.setProperty('--palette-tint-35', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`)
      document.documentElement.style.setProperty('--palette-tint-40', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`)
      document.documentElement.style.setProperty('--palette-tint-50', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`)
    }
  }, [settings.selectedPalette])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Function to create a flower at a specific position
    const createFlower = (x: number, y: number, keepPreviousActive: boolean = false) => {
      // Only deactivate previous flowers if not in brush mode
      if (!keepPreviousActive) {
        flowersRef.current.forEach(flower => flower.deactivate())
      }
      
      const flower = new Flower(x, y, {
        baseRadius: settings.baseRadius + (Math.random() - 0.5) * settings.baseRadius * 0.2,
        petalCount: Math.max(4, Math.floor(settings.petalCount + (Math.random() - 0.5) * 2)),
        waviness: settings.waviness,
        color: getColorFromPalette(),
        bloomSpeed: settings.bloomSpeed,
        rotationSpeed: settings.rotationSpeed * (0.5 + Math.random()),
        opacity: settings.opacity,
        layerCount: settings.layerCount,
        rotationDirection: settings.rotationDirection,
        scale: settings.scale
      })
      flowersRef.current.push(flower)
      activeFlowerRef.current = flower
    }

    // Get mouse position relative to canvas
    const getMousePos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      // Calculate scale factor between canvas internal size and display size
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      
      let clientX: number, clientY: number
      if ('touches' in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = (e as MouseEvent).clientX
        clientY = (e as MouseEvent).clientY
      }
      
      // Convert to canvas coordinates, accounting for scaling
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      }
    }

    // Mouse down handler
    const handleMouseDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      isMouseDownRef.current = true
      isPaintingModeRef.current = false // Start in "growing" mode
      const pos = getMousePos(e)
      initialMousePosRef.current = { x: pos.x, y: pos.y }
      lastFlowerPosRef.current = { x: pos.x, y: pos.y } // Initialize last flower position
      createFlower(pos.x, pos.y)
    }

    // Mouse move handler (for painting while dragging)
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isMouseDownRef.current || !initialMousePosRef.current || !lastFlowerPosRef.current) return
      
      e.preventDefault()
      const pos = getMousePos(e)
      
      // Check if mouse has moved from initial position
      const dx = pos.x - initialMousePosRef.current.x
      const dy = pos.y - initialMousePosRef.current.y
      const distanceFromStart = Math.sqrt(dx * dx + dy * dy)
      
      // Switch to painting mode (brush mode) on any movement
      if (distanceFromStart > 1) {
        isPaintingModeRef.current = true
        
        // Check distance from last flower position
        const dxFromLast = pos.x - lastFlowerPosRef.current.x
        const dyFromLast = pos.y - lastFlowerPosRef.current.y
        const distanceFromLast = Math.sqrt(dxFromLast * dxFromLast + dyFromLast * dyFromLast)
        
        // Create a new flower if we've moved at least 8 pixels from the last flower
        // Lower threshold makes it feel more connected and responsive
        if (distanceFromLast >= 8) {
          const now = Date.now()
          // Throttle by time (30ms) for smoother, more responsive feel
          if (now - lastFlowerTimeRef.current > 30) {
            // In brush mode, keep all flowers active so they all continue growing
            createFlower(pos.x, pos.y, true)
            lastFlowerPosRef.current = { x: pos.x, y: pos.y } // Update last flower position
            lastFlowerTimeRef.current = now
          }
        }
      }
      // If not in painting mode (holding), the existing flower will continue growing
    }

    // Mouse up handler
    const handleMouseUp = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      isMouseDownRef.current = false
      isPaintingModeRef.current = false
      initialMousePosRef.current = null
      lastFlowerPosRef.current = null
    }

    // Mouse leave handler (stop painting when mouse leaves canvas)
    const handleMouseLeave = () => {
      isMouseDownRef.current = false
      isPaintingModeRef.current = false
      initialMousePosRef.current = null
      lastFlowerPosRef.current = null
    }

    // Global mouse up handler (catches mouse release outside canvas)
    const handleGlobalMouseUp = () => {
      isMouseDownRef.current = false
      isPaintingModeRef.current = false
      initialMousePosRef.current = null
      lastFlowerPosRef.current = null
    }

    // Add event listeners to canvas
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    
    // Touch support for mobile
    canvas.addEventListener('touchstart', handleMouseDown)
    canvas.addEventListener('touchmove', handleMouseMove)
    canvas.addEventListener('touchend', handleMouseUp)
    
    // Add global listeners to catch mouse release anywhere
    window.addEventListener('mouseup', handleGlobalMouseUp)
    window.addEventListener('touchend', handleGlobalMouseUp)
    window.addEventListener('blur', handleGlobalMouseUp) // Stop if window loses focus

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Add subtle background gradient using palette tint
      const tintColor = getPaletteTintColor()
      let rgb: { r: number; g: number; b: number } | null = null
      
      if (tintColor.startsWith('#')) {
        rgb = hexToRgb(tintColor)
      } else if (tintColor.startsWith('rgb')) {
        const match = tintColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (match) {
          rgb = {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3])
          }
        }
      }
      
      if (rgb) {
        // Create a complementary color by shifting hue slightly
        const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        bgGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`)
        // Shift towards a complementary color for gradient end
        const shiftedR = Math.min(255, Math.max(0, rgb.r + 20))
        const shiftedG = Math.min(255, Math.max(0, rgb.g - 10))
        const shiftedB = Math.min(255, Math.max(0, rgb.b + 30))
        bgGradient.addColorStop(1, `rgba(${shiftedR}, ${shiftedG}, ${shiftedB}, 0.1)`)
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else {
        // Fallback
        const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        bgGradient.addColorStop(0, 'rgba(102, 126, 234, 0.1)')
        bgGradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)')
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Update and draw all flowers
      // All flowers rotate continuously, but only active flower grows
      flowersRef.current.forEach(flower => {
        // Only update if animation is enabled
        if (settings.animationEnabled) {
          // Always update rotation (for all flowers)
          flower.updateRotation(settings.rotationDirection)
          
          // Only grow if mouse is down and flower is active
          if (isMouseDownRef.current && flower.isActive) {
            flower.updateGrowth()
          }
        }
        
        flower.draw(ctx)
      })

      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('touchstart', handleMouseDown)
      canvas.removeEventListener('touchmove', handleMouseMove)
      canvas.removeEventListener('touchend', handleMouseUp)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
      window.removeEventListener('touchend', handleGlobalMouseUp)
      window.removeEventListener('blur', handleGlobalMouseUp)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [settings])

  const clearCanvas = () => {
    setClearConfirming(true)
  }

  const confirmClear = () => {
    flowersRef.current = []
    setClearConfirming(false)
  }

  const cancelClear = () => {
    setClearConfirming(false)
  }

  const exportAsPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `flower-art-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  const exportAsGIF = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // If no flowers, just export a static frame
    if (flowersRef.current.length === 0) {
      exportAsPNG()
      return
    }
    
    setIsExportingGIF(true)
    
    try {
      // Dynamically import gif.js (client-side only)
      // @ts-ignore - gif.js doesn't have type definitions
      const GIF = (await import('gif.js/dist/gif.js')).default || (await import('gif.js')).default
      
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: '/gif.worker.js',
        repeat: 0 // Loop forever
      })
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setIsExportingGIF(false)
        return
      }
      
      // Store original rotation values
      const originalRotations = flowersRef.current.map(flower => flower.rotation)
      
      // Calculate frames needed for a smooth loop
      // Find the slowest rotation speed to ensure all flowers complete at least one rotation
      const rotationSpeeds = flowersRef.current.map(f => Math.abs(f.rotationSpeed))
      const slowestSpeed = Math.min(...rotationSpeeds) || settings.rotationSpeed || 0.01
      
      // Use a fixed number of frames for smooth animation (30-60 frames)
      // This ensures the GIF loops smoothly regardless of rotation speed
      const totalFrames = 40 // Fixed frame count for consistent loop timing
      const framesPerSecond = 15 // Playback speed (adjust for file size vs smoothness)
      const frameDelay = Math.round(1000 / framesPerSecond) // Delay in milliseconds
      
      // Calculate rotation increment per frame for a full loop
      const rotationIncrement = (Math.PI * 2) / totalFrames
      
      // Capture frames
      const captureFrame = (frameIndex: number) => {
        // Clear and redraw canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Draw background gradient
        const tintColor = getPaletteTintColor()
        let rgb: { r: number; g: number; b: number } | null = null
        
        if (tintColor.startsWith('#')) {
          rgb = hexToRgb(tintColor)
        } else if (tintColor.startsWith('rgb')) {
          const match = tintColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
          if (match) {
            rgb = {
              r: parseInt(match[1]),
              g: parseInt(match[2]),
              b: parseInt(match[3])
            }
          }
        }
        
        if (rgb) {
          const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
          bgGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`)
          const shiftedR = Math.min(255, Math.max(0, rgb.r + 20))
          const shiftedG = Math.min(255, Math.max(0, rgb.g - 10))
          const shiftedB = Math.min(255, Math.max(0, rgb.b + 30))
          bgGradient.addColorStop(1, `rgba(${shiftedR}, ${shiftedG}, ${shiftedB}, 0.1)`)
          ctx.fillStyle = bgGradient
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        } else {
          const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
          bgGradient.addColorStop(0, 'rgba(102, 126, 234, 0.1)')
          bgGradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)')
          ctx.fillStyle = bgGradient
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        
        // Update and draw all flowers
        flowersRef.current.forEach((flower, index) => {
          // Rotate each flower by the increment, respecting its direction
          // This ensures all flowers complete a full rotation in the same number of frames
          flower.rotation = originalRotations[index] + (frameIndex * rotationIncrement * flower.rotationDirection)
          flower.draw(ctx)
        })
        
        // Add frame to GIF
        gif.addFrame(ctx, { copy: true, delay: frameDelay })
        
        // Continue to next frame or finish
        if (frameIndex < totalFrames - 1) {
          requestAnimationFrame(() => captureFrame(frameIndex + 1))
        } else {
          // Restore original rotations
          flowersRef.current.forEach((flower, index) => {
            flower.rotation = originalRotations[index]
          })
          
          // Render the GIF
          gif.on('finished', (blob: Blob) => {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `flower-art-${Date.now()}.gif`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            setIsExportingGIF(false)
          })
          
          gif.on('error', (error: Error) => {
            console.error('GIF rendering error:', error)
            setIsExportingGIF(false)
            exportAsPNG()
          })
          
          gif.render()
        }
      }
      
      // Start capturing frames
      captureFrame(0)
    } catch (error) {
      console.error('Error exporting GIF:', error)
      setIsExportingGIF(false)
      // Fallback to PNG if GIF export fails
      exportAsPNG()
    }
  }

  // Drag adjust hooks for each control
  const wavinessDrag = useDragAdjust(
    settings.waviness,
    (val) => setSettings({...settings, waviness: val}),
    0,
    0.5,
    0.01
  )
  const petalCountDrag = useDragAdjust(
    settings.petalCount,
    (val) => setSettings({...settings, petalCount: val}),
    4,
    12,
    1
  )
  const layerCountDrag = useDragAdjust(
    settings.layerCount,
    (val) => setSettings({...settings, layerCount: val}),
    2,
    6,
    1
  )
  const baseRadiusDrag = useDragAdjust(
    settings.baseRadius,
    (val) => setSettings({...settings, baseRadius: val}),
    20,
    80,
    5
  )
  const scaleDrag = useDragAdjust(
    settings.scale,
    (val) => setSettings({...settings, scale: val}),
    0.5,
    5,
    0.1
  )
  const opacityDrag = useDragAdjust(
    settings.opacity,
    (val) => setSettings({...settings, opacity: val}),
    0.1,
    1,
    0.05
  )
  const rotationSpeedDrag = useDragAdjust(
    settings.rotationSpeed,
    (val) => setSettings({...settings, rotationSpeed: val}),
    0,
    0.05,
    0.001
  )

  return (
    <main className={styles.main}>
      <canvas ref={canvasRef} className={styles.canvas} />
      {settings.showToolbar && (
        <div className={`${styles.toolbar} ${settings.toolbarPosition === 'bottom' ? styles.toolbarBottom : ''}`}>
          <div className={styles.toolbarHeader}>
            <h3>Tools</h3>
            <button 
              className={styles.toggleBtn}
              onClick={() => setSettings({...settings, showToolbar: !settings.showToolbar})}
            >
              <Minus size={16} />
            </button>
          </div>
          <div className={styles.controls}>
            <div className={styles.controlSection}>
              <h4>Shape</h4>
              <div className={styles.controlGroup}>
                <div className={styles.toolRow}>
                  <div className={styles.toolNameContainer}>
                    <div className={styles.labelWithIcon}>
                      <Waves size={14} />
                      <span>waviness</span>
                    </div>
                    <div className={styles.hoverSlider}>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.01"
                        value={settings.waviness}
                        onChange={(e) => setSettings({...settings, waviness: parseFloat(e.target.value)})}
                        className={styles.rangeSlider}
                      />
                    </div>
                  </div>
                  <div className={styles.inputWrapper}>
                    <input
                      ref={wavinessDrag.inputRef}
                      type="number"
                      className={`${styles.valueInput} ${wavinessDrag.isDragging ? styles.valueInputDragging : ''}`}
                      min="0"
                      max="0.5"
                      step="0.01"
                      value={settings.waviness}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        if (!isNaN(val) && val >= 0 && val <= 0.5) {
                          setSettings({...settings, waviness: val})
                        }
                      }}
                      onMouseDown={wavinessDrag.handleMouseDown}
                    />
                    {wavinessDrag.isDragging && (
                      <div className={styles.sliderTrack}>
                        <div 
                          className={styles.sliderFill}
                          style={{
                            width: `${((settings.waviness - 0) / (0.5 - 0)) * 100}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.controlGroup}>
                <div className={styles.toolRow}>
                  <div className={styles.toolNameContainer}>
                    <div className={styles.labelWithIcon}>
                      <Flower2 size={14} />
                      <span>petal-count</span>
                    </div>
                    <div className={styles.hoverSlider}>
                      <input
                        type="range"
                        min="4"
                        max="12"
                        step="1"
                        value={settings.petalCount}
                        onChange={(e) => setSettings({...settings, petalCount: parseInt(e.target.value)})}
                        className={styles.rangeSlider}
                      />
                    </div>
                  </div>
                  <div className={styles.inputWrapper}>
                    <input
                      ref={petalCountDrag.inputRef}
                      type="number"
                      className={`${styles.valueInput} ${petalCountDrag.isDragging ? styles.valueInputDragging : ''}`}
                      min="4"
                      max="12"
                      step="1"
                      value={settings.petalCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (!isNaN(val) && val >= 4 && val <= 12) {
                          setSettings({...settings, petalCount: val})
                        }
                      }}
                      onMouseDown={petalCountDrag.handleMouseDown}
                    />
                    {petalCountDrag.isDragging && (
                      <div className={styles.sliderTrack}>
                        <div 
                          className={styles.sliderFill}
                          style={{
                            width: `${((settings.petalCount - 4) / (12 - 4)) * 100}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.controlGroup}>
                <div className={styles.toolRow}>
                  <div className={styles.toolNameContainer}>
                    <div className={styles.labelWithIcon}>
                      <Layers size={14} />
                      <span>layer-count</span>
                    </div>
                    <div className={styles.hoverSlider}>
                      <input
                        type="range"
                        min="2"
                        max="6"
                        step="1"
                        value={settings.layerCount}
                        onChange={(e) => setSettings({...settings, layerCount: parseInt(e.target.value)})}
                        className={styles.rangeSlider}
                      />
                    </div>
                  </div>
                  <div className={styles.inputWrapper}>
                    <input
                      ref={layerCountDrag.inputRef}
                      type="number"
                      className={`${styles.valueInput} ${layerCountDrag.isDragging ? styles.valueInputDragging : ''}`}
                      min="2"
                      max="6"
                      step="1"
                      value={settings.layerCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (!isNaN(val) && val >= 2 && val <= 6) {
                          setSettings({...settings, layerCount: val})
                        }
                      }}
                      onMouseDown={layerCountDrag.handleMouseDown}
                    />
                    {layerCountDrag.isDragging && (
                      <div className={styles.sliderTrack}>
                        <div 
                          className={styles.sliderFill}
                          style={{
                            width: `${((settings.layerCount - 2) / (6 - 2)) * 100}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.controlGroup}>
                <div className={styles.toolRow}>
                  <div className={styles.toolNameContainer}>
                    <div className={styles.labelWithIcon}>
                      <Maximize2 size={14} />
                      <span>base-size</span>
                    </div>
                    <div className={styles.hoverSlider}>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        step="5"
                        value={settings.baseRadius}
                        onChange={(e) => setSettings({...settings, baseRadius: parseInt(e.target.value)})}
                        className={styles.rangeSlider}
                      />
                    </div>
                  </div>
                  <div className={styles.inputWrapper}>
                    <input
                      ref={baseRadiusDrag.inputRef}
                      type="number"
                      className={`${styles.valueInput} ${baseRadiusDrag.isDragging ? styles.valueInputDragging : ''}`}
                      min="20"
                      max="80"
                      step="5"
                      value={settings.baseRadius}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (!isNaN(val) && val >= 20 && val <= 80) {
                          setSettings({...settings, baseRadius: val})
                        }
                      }}
                      onMouseDown={baseRadiusDrag.handleMouseDown}
                    />
                    {baseRadiusDrag.isDragging && (
                      <div className={styles.sliderTrack}>
                        <div 
                          className={styles.sliderFill}
                          style={{
                            width: `${((settings.baseRadius - 20) / (80 - 20)) * 100}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.controlGroup}>
                <div className={styles.toolRow}>
                  <div className={styles.toolNameContainer}>
                    <div className={styles.labelWithIcon}>
                      <ZoomIn size={14} />
                      <span>scale</span>
                    </div>
                    <div className={styles.hoverSlider}>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={settings.scale}
                        onChange={(e) => setSettings({...settings, scale: parseFloat(e.target.value)})}
                        className={styles.rangeSlider}
                      />
                    </div>
                  </div>
                  <div className={styles.inputWrapper}>
                    <input
                      ref={scaleDrag.inputRef}
                      type="number"
                      className={`${styles.valueInput} ${scaleDrag.isDragging ? styles.valueInputDragging : ''}`}
                      min="0.5"
                      max="5"
                      step="0.1"
                      value={settings.scale}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        if (!isNaN(val) && val >= 0.5 && val <= 5) {
                          setSettings({...settings, scale: val})
                        }
                      }}
                      onMouseDown={scaleDrag.handleMouseDown}
                    />
                    {scaleDrag.isDragging && (
                      <div className={styles.sliderTrack}>
                        <div 
                          className={styles.sliderFill}
                          style={{
                            width: `${((settings.scale - 0.5) / (5 - 0.5)) * 100}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.controlSection}>
              <h4>Color</h4>
              <div className={styles.controlGroup}>
                <label>
                  <div className={styles.labelWithIcon}>
                    <Palette size={14} />
                    <span>Color Palette</span>
                  </div>
                  <div className={styles.paletteGrid}>
                    {Object.entries(colorPalettes).map(([key, palette]) => (
                      <button
                        key={key}
                        className={`${styles.paletteButton} ${settings.selectedPalette === key ? styles.paletteButtonActive : ''}`}
                        onClick={() => {
                          setSettings({...settings, selectedPalette: key as keyof typeof colorPalettes})
                        }}
                        title={palette.name}
                      >
                        <div className={styles.paletteSwatches}>
                          {palette.colors.map((color, idx) => {
                            if (color === 'pattern') {
                              // Render dot gradient pattern for dotGradient palette
                              return (
                                <div
                                  key={idx}
                                  className={styles.paletteSwatch}
                                  style={{
                                    background: `
                                      repeating-radial-gradient(circle at center,
                                        #000 0px,
                                        #000 2px,
                                        #808080 3px,
                                        #808080 4px,
                                        #fff 5px,
                                        #fff 6px
                                      )
                                    `,
                                    backgroundSize: '12px 12px'
                                  }}
                                />
                              )
                            }
                            return (
                              <div
                                key={idx}
                                className={styles.paletteSwatch}
                                style={{ backgroundColor: color }}
                              />
                            )
                          })}
                        </div>
                        <span className={styles.paletteName}>{palette.name}</span>
                      </button>
                    ))}
                  </div>
                </label>
              </div>
              <div className={styles.controlGroup}>
                <div className={styles.toolRow}>
                  <div className={styles.toolNameContainer}>
                    <div className={styles.labelWithIcon}>
                      <Droplet size={14} />
                      <span>opacity</span>
                    </div>
                    <div className={styles.hoverSlider}>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={settings.opacity}
                        onChange={(e) => setSettings({...settings, opacity: parseFloat(e.target.value)})}
                        className={styles.rangeSlider}
                      />
                    </div>
                  </div>
                  <div className={styles.inputWrapper}>
                    <input
                      ref={opacityDrag.inputRef}
                      type="number"
                      className={`${styles.valueInput} ${opacityDrag.isDragging ? styles.valueInputDragging : ''}`}
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={settings.opacity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        if (!isNaN(val) && val >= 0.1 && val <= 1) {
                          setSettings({...settings, opacity: val})
                        }
                      }}
                      onMouseDown={opacityDrag.handleMouseDown}
                    />
                    {opacityDrag.isDragging && (
                      <div className={styles.sliderTrack}>
                        <div 
                          className={styles.sliderFill}
                          style={{
                            width: `${((settings.opacity - 0.1) / (1 - 0.1)) * 100}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.controlSection}>
              <h4>Animation</h4>
              <div className={styles.controlGroup}>
                <div className={styles.toolRow}>
                  <div className={styles.toolNameContainer}>
                    <div className={styles.labelWithIcon}>
                      <RotateCw size={14} />
                      <span>rotation-speed</span>
                    </div>
                    <div className={styles.hoverSlider}>
                      <input
                        type="range"
                        min="0"
                        max="0.05"
                        step="0.001"
                        value={settings.rotationSpeed}
                        onChange={(e) => setSettings({...settings, rotationSpeed: parseFloat(e.target.value)})}
                        className={styles.rangeSlider}
                      />
                    </div>
                  </div>
                  <div className={styles.inputWrapper}>
                    <input
                      ref={rotationSpeedDrag.inputRef}
                      type="number"
                      className={`${styles.valueInput} ${rotationSpeedDrag.isDragging ? styles.valueInputDragging : ''}`}
                      min="0"
                      max="0.05"
                      step="0.001"
                      value={settings.rotationSpeed}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        if (!isNaN(val) && val >= 0 && val <= 0.05) {
                          setSettings({...settings, rotationSpeed: val})
                        }
                      }}
                      onMouseDown={rotationSpeedDrag.handleMouseDown}
                    />
                    {rotationSpeedDrag.isDragging && (
                      <div className={styles.sliderTrack}>
                        <div 
                          className={styles.sliderFill}
                          style={{
                            width: `${((settings.rotationSpeed - 0) / (0.05 - 0)) * 100}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.controlGroup}>
                <div className={styles.toolRow}>
                  <div className={styles.labelWithIcon}>
                    {settings.animationEnabled ? <Play size={14} /> : <Pause size={14} />}
                    <span>enable-animation</span>
                  </div>
                  <button
                    className={styles.iconToggle}
                    onClick={() => setSettings({...settings, animationEnabled: !settings.animationEnabled})}
                    aria-label="Toggle animation"
                  >
                    {settings.animationEnabled ? (
                      <CheckSquare size={16} className={styles.iconToggleActive} />
                    ) : (
                      <Square size={16} className={styles.iconToggleInactive} />
                    )}
                  </button>
                </div>
              </div>
              <div className={styles.controlGroup} style={{ opacity: settings.animationEnabled ? 1 : 0.5, pointerEvents: settings.animationEnabled ? 'auto' : 'none' }}>
                <div className={styles.toolRow}>
                  <div className={styles.labelWithIcon}>
                    <ArrowRightLeft size={14} />
                    <span>spring-direction</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className={styles.iconToggle}
                      onClick={() => settings.animationEnabled && setSettings({...settings, rotationDirection: 'left'})}
                      aria-label="Spring left"
                      disabled={!settings.animationEnabled}
                      style={{ 
                        opacity: settings.rotationDirection === 'left' ? 1 : 0.5,
                        background: settings.rotationDirection === 'left' ? 'var(--palette-tint-20, rgba(255, 255, 255, 0.2))' : 'transparent'
                      }}
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      className={styles.iconToggle}
                      onClick={() => settings.animationEnabled && setSettings({...settings, rotationDirection: 'right'})}
                      aria-label="Spring right"
                      disabled={!settings.animationEnabled}
                      style={{ 
                        opacity: settings.rotationDirection === 'right' ? 1 : 0.5,
                        background: settings.rotationDirection === 'right' ? 'var(--palette-tint-20, rgba(255, 255, 255, 0.2))' : 'transparent'
                      }}
                    >
                      <ArrowRight size={14} />
                    </button>
                    <button
                      className={styles.iconToggle}
                      onClick={() => settings.animationEnabled && setSettings({...settings, rotationDirection: 'random'})}
                      aria-label="Random direction"
                      disabled={!settings.animationEnabled}
                      style={{ 
                        opacity: settings.rotationDirection === 'random' ? 1 : 0.5,
                        background: settings.rotationDirection === 'random' ? 'var(--palette-tint-20, rgba(255, 255, 255, 0.2))' : 'transparent'
                      }}
                    >
                      <Shuffle size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={styles.exportButtonContainer}
              onMouseEnter={() => setExportHovered(true)}
              onMouseLeave={() => setExportHovered(false)}
            >
              <div className={`${styles.exportButtonsSplit} ${exportHovered ? styles.split : ''}`}>
                <button 
                  className={styles.exportBtn}
                  onClick={exportAsPNG}
                >
                  <Download size={14} />
                  <span className={styles.exportLabel}>PNG</span>
                  <span className={styles.exportLabelUnified}>Export</span>
                </button>
                <button 
                  className={styles.exportBtn}
                  onClick={exportAsGIF}
                  disabled={isExportingGIF}
                >
                  {isExportingGIF ? (
                    <Loader2 size={14} className={styles.loadingSpinner} />
                  ) : (
                    <Download size={14} />
                  )}
                  <span className={styles.exportLabel}>
                    {isExportingGIF ? 'Exporting...' : 'GIF'}
                  </span>
                </button>
              </div>
            </div>

            {clearConfirming ? (
              <div className={styles.clearButtonsContainer}>
                <button className={`${styles.clearBtn} ${styles.confirmBtn}`} onClick={confirmClear}>
                  <CheckSquare size={14} />
                  <span>Confirm</span>
                </button>
                <button className={`${styles.clearBtn} ${styles.cancelBtn}`} onClick={cancelClear}>
                  <X size={14} />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <div className={styles.clearButtonsContainer}>
                <button className={styles.clearBtn} onClick={clearCanvas}>
                  <X size={14} />
                  <span>Clear Canvas</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {!settings.showToolbar && (
        <button 
          className={`${styles.toolbarToggle} ${settings.toolbarPosition === 'bottom' ? styles.toolbarToggleBottom : ''}`}
          onClick={() => setSettings({...settings, showToolbar: true})}
        >
          <Palette size={18} />
        </button>
      )}
    </main>
  )
}
