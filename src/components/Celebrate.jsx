// חגיגה על המסך: קונפטי (ציור ב-canvas) + בלונים לאבני דרך, ונצנוץ עדין לאירועים קטנים.
// בלי ספרייה. מי שביקש "הפחתת תנועה" במכשיר רואה רק את ההודעה.

import { useEffect, useRef } from 'react';
import { useApp } from '../AppContext.jsx';

const COLORS = ['#6d5dfc', '#19c3b1', '#f5a300', '#e5383b', '#4f8cff', '#2fc46f', '#d6409f'];

const TEXT = {
  milestone: (v) => ({ emoji: '🏆', title: `${v} מילים ירוקות!`, sub: 'אבן דרך חדשה – כל הכבוד!' }),
  goal: () => ({ emoji: '🎯', title: 'עמדת ביעד היומי!', sub: 'אפשר להמשיך או לנוח – הרצף נשמר' }),
  perfect: () => ({ emoji: '✨', title: 'מושלם!', sub: 'כל התשובות נכונות' }),
};

const DURATION = { milestone: 4500, goal: 3000, perfect: 2200 };

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function runConfetti(canvas, count, spread) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = (canvas.width = window.innerWidth * dpr);
  const h = (canvas.height = window.innerHeight * dpr);
  const parts = Array.from({ length: count }, () => {
    // יוצאים משני צדי המסך למטה, או מהמרכז (לנצנוץ קטן)
    const fromLeft = Math.random() < 0.5;
    const x = spread ? (fromLeft ? 0 : w) : w / 2;
    const angle = spread
      ? (fromLeft ? -1 : -Math.PI + 1) + (Math.random() - 0.5) * 0.9
      : Math.random() * Math.PI * 2;
    const speed = (spread ? 14 + Math.random() * 12 : 4 + Math.random() * 6) * dpr;
    return {
      x,
      y: spread ? h * 0.75 : h * 0.4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: (5 + Math.random() * 6) * dpr,
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      round: Math.random() < 0.3,
    };
  });
  let frame;
  const start = performance.now();
  const tick = (t) => {
    const life = (t - start) / 1000;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.vy += 0.35 * dpr; // כבידה
      p.vx *= 0.985; // התנגדות אוויר
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - life / 3.5);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }
    if (life < 3.5) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

export default function Celebrate() {
  const { celebration, clearCelebration } = useApp();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!celebration) return undefined;
    const stopTimer = setTimeout(clearCelebration, DURATION[celebration.kind]);
    let stopConfetti = () => {};
    if (!reducedMotion() && canvasRef.current) {
      const big = celebration.kind === 'milestone';
      stopConfetti = runConfetti(canvasRef.current, big ? 180 : celebration.kind === 'goal' ? 110 : 45, celebration.kind !== 'perfect');
    }
    return () => {
      clearTimeout(stopTimer);
      stopConfetti();
    };
  }, [celebration, clearCelebration]);

  if (!celebration) return null;
  const t = TEXT[celebration.kind](celebration.value);
  const big = celebration.kind === 'milestone';

  return (
    <div className={`celebrate ${celebration.kind}`} key={celebration.key} onClick={clearCelebration} role="status">
      <canvas ref={canvasRef} className="confetti" aria-hidden="true" />
      {big && !reducedMotion() && (
        <div className="balloons" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} style={{ '--i': i, '--x': `${(i * 37) % 100}%`, '--c': COLORS[i % COLORS.length] }} />
          ))}
        </div>
      )}
      <div className={big ? 'celebrate-card' : 'celebrate-toast'}>
        <span className="celebrate-emoji" aria-hidden="true">{t.emoji}</span>
        <div>
          <strong>{t.title}</strong>
          <p>{t.sub}</p>
        </div>
      </div>
    </div>
  );
}
