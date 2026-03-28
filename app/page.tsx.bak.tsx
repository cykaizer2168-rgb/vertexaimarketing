'use client';

import React, { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Automation & Video Logic
    window.playV = () => {
      const v = document.getElementById('hv') as HTMLVideoElement;
      const o = document.getElementById('vov');
      if (v) { 
        v.play(); 
        if (o) o.style.display = 'none'; 
      }
    };

    // Cursor Glow Logic
    const cg = document.getElementById('cg');
    const handleMouseMove = (e: MouseEvent) => {
      if (cg) {
        cg.style.left = e.clientX + 'px';
        cg.style.top = e.clientY + 'px';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!mounted) return <div className="bg-[#050505] min-h-screen" />;

  return (
    <main>
      {/* 1. ORIGINAL CSS - Retaining the exact Claude version */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;700&display=swap');
        
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#050505 !important; color:#f0f0f0 !important; font-family:'DM Sans',sans-serif !important; overflow-x:hidden}
        
        .hero-title { font-family:'Bebas Neue',sans-serif !important; font-size:clamp(72px,12vw,160px) !important; line-height:.88 !important; text-align:center; margin-top:100px; }
        .tile { border-radius:40px; border:1px solid rgba(255,255,255,0.07); padding:44px; background:#0d0d0d; transition:all .3s; }
        .btn-g { background:#00e676; color:#000; font-weight:700; padding:12px 24px; border-radius:18px; border:none; cursor:pointer; }
        #cg { position:fixed; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle,rgba(0,230,118,0.05) 0%,transparent 70%); pointer-events:none; transform:translate(-50%,-50%); z-index:0; }
        
        nav { position:fixed; top:0; width:100%; z-index:100; padding:18px 40px; background:rgba(5,5,5,0.8); backdrop-filter:blur(20px); border-bottom:1px solid rgba(255,255,255,0.07); display:flex; justify-content:space-between; align-items:center; }
      ` }} />

      {/* 2. ORIGINAL HTML CONTENT */}
      <div dangerouslySetInnerHTML={{ __html: `
        <div id="cg"></div>
        
        <nav>
          <div style="font-family:'Bebas Neue',sans-serif; font-size:24px;">VERTEX<span style="color:#00e676;">.</span></div>
          <button class="btn-g" onclick="document.getElementById('audit').scrollIntoView({behavior:'smooth'})">Free Audit →</button>
        </nav>

        <section style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:100px 20px;">
          <p style="color:#00e676; letter-spacing:0.35em; font-size:10px; margin-bottom:24px;">🔒 AI-POWERED GROWTH SYSTEMS</p>
          <h1 class="hero-title">SCALE <span style="color:#3a3a3a; font-style:italic;">WITHOUT</span><br><span style="-webkit-text-stroke:2px #00e676; color:transparent;">LIMITS.</span></h1>
          
          <div style="width:100%; max-width:900px; margin-top:48px;">
            <div style="aspect-ratio:16/9; border-radius:40px; overflow:hidden; border:1px solid rgba(255,255,255,0.07); background:#0d0d0d; position:relative;">
              <video id="hv" style="width:100%; height:100%; object-fit:cover;" poster="/cover.png">
                <source src="/promo-video.mp4" type="video/mp4" />
              </video>
              <div id="vov" onclick="window.playV()" style="position:absolute; inset:0; background:rgba(0,0,0,0.5); display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer;">
                <div style="width:80px; height:80px; background:#00e676; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:32px; color:#000;">▶</div>
                <span style="margin-top:16px; font-size:10px; letter-spacing:0.2em; color:rgba(255,255,255,0.6);">WATCH THE VSL</span>
              </div>
            </div>
          </div>
        </section>

        <section id="audit" style="padding:120px 20px; text-align:center;">
           <div class="tile" style="max-width:800px; margin:0 auto;">
              <h2 style="font-family:'Bebas Neue',sans-serif; font-size:64px;">READY TO SCALE?</h2>
              <form style="display:flex; gap:10px; max-width:500px; margin:32px auto 0; background:#141414; border:1px solid rgba(255,255,255,0.07); border-radius:24px; padding:6px;">
                <input type="email" placeholder="Work email" style="flex:1; background:transparent; border:none; color:#fff; padding:12px 16px; outline:none;" />
                <button type="submit" class="btn-g">Get Free Audit →</button>
              </form>
           </div>
        </section>
      ` }} />
    </main>
  );
}

// Support for legacy global playV function
declare global {
  interface Window { playV: () => void; }
}