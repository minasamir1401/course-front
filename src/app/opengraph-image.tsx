import { ImageResponse } from 'next/og';
export const alt = 'Klevro — Learn with clarity. Grow with confidence.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ display: 'flex', width: '100%', height: '100%', background: 'linear-gradient(125deg, #f8f6ff, #ecfcff)', padding: 72, flexDirection: 'column', color: '#291d40', fontFamily: 'sans-serif' }}>
    <div style={{ display: 'flex', fontSize: 38, fontWeight: 800, color: '#5b29ce', marginBottom: 48 }}>Klevro</div>
    <div style={{ display: 'flex', fontSize: 68, fontWeight: 800, letterSpacing: -2 }}>Learn with clarity.</div>
    <div style={{ display: 'flex', fontSize: 68, fontWeight: 800, letterSpacing: -2, color: '#6737d8' }}>Grow with confidence.</div>
    <div style={{ display: 'flex', fontSize: 25, color: '#5a4b6a', marginTop: 28 }}>Courses · Assessments · Activities · Progress</div>
    <div style={{ display: 'flex', marginTop: 'auto', fontSize: 20, color: '#634e7b' }}>Your learning journey, connected.  /  Arabic & English</div>
  </div>, size);
}
