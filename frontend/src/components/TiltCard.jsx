import React, { useRef, useState } from 'react'

export default function TiltCard({
  children,
  className = '',
  glare = true,
  maxRotation = 7,
  scale = 1.015,
  onClick,
}) {
  const cardRef = useRef(null)
  const [style, setStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  })
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 })

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const xPercent = x / rect.width
    const yPercent = y / rect.height

    const rotateX = (0.5 - yPercent) * (maxRotation * 2)
    const rotateY = (xPercent - 0.5) * (maxRotation * 2)

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
      transition: 'transform 0.08s ease-out',
    })

    if (glare) {
      setGlarePos({
        x: xPercent * 100,
        y: yPercent * 100,
        opacity: 0.18,
      })
    }
  }

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    })
    if (glare) {
      setGlarePos((prev) => ({ ...prev, opacity: 0 }))
    }
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
      }}
      className={`relative overflow-hidden rounded-2xl border border-line bg-panel/85 shadow-[0_12px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl ${className}`}
    >
      {/* Specular 3D Holographic Glare */}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
          style={{
            opacity: glarePos.opacity,
            background: `radial-gradient(circle 280px at ${glarePos.x}% ${glarePos.y}%, rgba(114, 227, 208, 0.22), rgba(56, 189, 248, 0.08), transparent 70%)`,
          }}
        />
      )}
      {children}
    </div>
  )
}
