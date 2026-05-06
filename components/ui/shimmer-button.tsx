"use client"
// Source: https://21st.dev/r/magicui/shimmer-button
// npx shadcn@latest add "https://21st.dev/r/magicui/shimmer-button"

import { CSSProperties, FC, ReactNode } from "react"

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
  className?: string
  children?: ReactNode
}

const ShimmerButton: FC<ShimmerButtonProps> = ({
  shimmerColor = "#0A84FF",
  shimmerSize = "0.05em",
  shimmerDuration = "3s",
  borderRadius = "100px",
  background = "#0A84FF",
  className = "",
  children,
  ...props
}) => {
  return (
    <button
      style={
        {
          "--spread": "90deg",
          "--shimmer-color": shimmerColor,
          "--radius": borderRadius,
          "--speed": shimmerDuration,
          "--cut": shimmerSize,
          "--bg": background,
        } as CSSProperties
      }
      className={`group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 text-white [background:var(--bg)] [border-radius:var(--radius)] transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px ${className}`}
      {...props}
    >
      <div className="absolute inset-0 overflow-visible blur-[2px] -z-30 [container-type:size]">
        <div className="absolute inset-0 h-[100cqh] [aspect-ratio:1] [border-radius:0] [mask:none]" style={{ animation: `shimmer-slide var(--speed) ease-in-out infinite alternate` }}>
          <div style={{ animation: "spin-around calc(var(--speed)*2) infinite linear", background: `conic-gradient(from calc(270deg - (var(--spread) * 0.5)), transparent 0, var(--shimmer-color) var(--spread), transparent var(--spread))` }} className="absolute -inset-full w-auto rotate-0" />
        </div>
      </div>
      {children}
      <div className="absolute inset-0 rounded-full shadow-[inset_0_-8px_10px_rgba(255,255,255,0.15)] group-hover:shadow-[inset_0_-6px_10px_rgba(255,255,255,0.25)] transition-all duration-300" />
      <div className="absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]" />
      <style>{`
        @keyframes shimmer-slide {
          to { transform: translate(calc(100cqw - 100%), 0); }
        }
        @keyframes spin-around {
          0% { transform: translateZ(0) rotate(0); }
          15%, 35% { transform: translateZ(0) rotate(90deg); }
          65%, 85% { transform: translateZ(0) rotate(270deg); }
          100% { transform: translateZ(0) rotate(360deg); }
        }
      `}</style>
    </button>
  )
}

export default ShimmerButton
