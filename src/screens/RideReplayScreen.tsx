import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../theme';

interface Coord { lat: number; lng: number; }
interface Props { route: { params: { ride: any } }; navigation: any; }

const W = 480, H = 640;

export default function RideReplayScreen({ route, navigation }: Props) {
  const { ride } = route.params;
  const coords: Coord[] = ride.route_path || [];
  const canvasRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const project = (c: Coord, cx: number, cy: number, scale: number, tilt = 0.55) => {
    const rawX = (c.lng - cx) * scale * W + W / 2;
    const rawY = (c.lat - cy) * scale * -H + H / 2;
    return { x: rawX, y: H / 2 + (rawY - H / 2) * tilt };
  };

  const getMapParams = () => {
    if (!coords.length) return null;
    const lats = coords.map(c => c.lat), lngs = coords.map(c => c.lng);
    const cx = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const cy = (Math.min(...lats) + Math.max(...lats)) / 2;
    const span = Math.max(Math.max(...lngs) - Math.min(...lngs), Math.max(...lats) - Math.min(...lats)) || 0.01;
    return { cx, cy, scale: 0.7 / span };
  };

  const drawFrame = (ctx: CanvasRenderingContext2D, frameIdx: number, mp: any, total: number) => {
    const pct = frameIdx / total;
    const drawn = Math.floor(pct * coords.length);

    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    if (!coords.length || !mp) return;

    const pts = coords.map(c => project(c, mp.cx, mp.cy, mp.scale));

    // Glow trail
    if (drawn > 1) {
      const sub = pts.slice(0, drawn);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 214, 125, 0.1)';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      sub.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();

      // Main line
      ctx.beginPath();
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 3;
      sub.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.stroke();
    }

    // Start point
    const s0 = pts[0];
    ctx.beginPath(); ctx.arc(s0.x, s0.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();

    // Moving marker
    if (drawn > 0) {
      const cur = pts[Math.min(drawn, pts.length - 1)];
      const pulse = 12 + Math.sin(frameIdx * 0.2) * 4;
      ctx.beginPath(); ctx.arc(cur.x, cur.y, pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 214, 125, 0.2)'; ctx.fill();
      
      ctx.beginPath(); ctx.arc(cur.x, cur.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = colors.accent; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    }

    // ── HUD OVERLAYS ─────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, W, 70);
    
    ctx.fillStyle = colors.accent; ctx.font = 'bold 12px sans-serif';
    ctx.fillText('RELIVE ACTIVITY', 20, 30);
    ctx.fillStyle = '#999'; ctx.font = '10px sans-serif';
    ctx.fillText(ride.title?.toUpperCase() || 'RIDE REPLAY', 20, 48);

    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`${Math.round(pct * 100)}%`, W - 60, 40);

    // Bottom Stats
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, H - 80, W, 80);
    
    const stats = [
      { l: 'DISTANCE', v: ride.distance || '—' },
      { l: 'DURATION', v: ride.duration || '—' },
      { l: 'AVG SPEED', v: ride.avg_speed || '—' },
    ];
    stats.forEach((st, i) => {
      const sx = 20 + i * (W / 3.2);
      ctx.fillStyle = '#666'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText(st.l, sx, H - 50);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText(st.v, sx, H - 30);
    });

    // Watermark
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '10px sans-serif';
    ctx.fillText('RiderHub Premium', W - 110, H - 15);
  };

  const playAnimation = (shouldRecord = false) => {
    if (!coords.length || !canvasRef.current) return;
    const canvas = canvasRef.current as HTMLCanvasElement;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const mp = getMapParams(); if (!mp) return;

    cancelAnimationFrame(rafRef.current);
    setDone(false); setVideoUrl(null); setProgress(0);
    setPlaying(true);

    const FPS = 30, DURATION = Math.max(8, Math.min(coords.length / 3, 20));
    const TOTAL = FPS * DURATION;
    let frame = 0;

    if (shouldRecord && (window as any).MediaRecorder) {
      chunksRef.current = [];
      const stream = canvas.captureStream(FPS);
      const opts = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].filter(t=>(window as any).MediaRecorder.isTypeSupported(t));
      const rec = new (window as any).MediaRecorder(stream, opts.length ? { mimeType: opts[0] } : {});
      rec.ondataavailable = (e: any) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoUrl(URL.createObjectURL(blob));
        setStatus('Video ready for download!');
        setRecording(false);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setStatus('Recording clip...');
    }

    const tick = () => {
      drawFrame(ctx, frame, mp, TOTAL);
      setProgress(frame / TOTAL);
      if (frame < TOTAL) {
        frame++;
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPlaying(false); setDone(true); setProgress(1);
        if (recorderRef.current && recorderRef.current.state === 'recording') {
          setTimeout(() => recorderRef.current?.stop(), 500);
        }
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopAnim = () => {
    cancelAnimationFrame(rafRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setPlaying(false); setRecording(false);
  };

  const downloadVideo = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl; a.download = `Relive_${ride.title || 'Ride'}.webm`;
    a.click();
  };

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); }, []);

  if (Platform.OS !== 'web') return (
    <SafeAreaView style={ts.container}>
      <View style={ts.center}>
        <Ionicons name="desktop-outline" size={48} color={colors.textMuted} />
        <Text style={ts.webOnlyText}>Relive is only available on web.</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={ts.container}>
      <View style={ts.header}>
        <TouchableOpacity onPress={() => { stopAnim(); navigation.goBack(); }} style={ts.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={ts.headerTitle}>Relive</Text>
          <Text style={ts.headerSubtitle}>Video route replay</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={ts.scrollPadding}>
        <View style={ts.rideHeader}>
          <View style={ts.iconBox}>
            <MaterialCommunityIcons name="map-marker-path" size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ts.rideTitle}>{ride.title}</Text>
            <Text style={ts.rideSubtitle}>{ride.date} • {ride.distance}</Text>
          </View>
        </View>

        <View style={ts.canvasWrapper}>
          {recording && (
            <View style={ts.recBadge}>
              <View style={ts.recDot} />
              <Text style={ts.recText}>REC</Text>
            </View>
          )}
          <canvas ref={canvasRef} width={W} height={H} style={ts.canvas} />
          
          <View style={ts.progressTrack}>
            <View style={[ts.progressBar, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <View style={ts.controls}>
          {!playing ? (
            <>
              <TouchableOpacity style={ts.btnPreview} onPress={() => playAnimation(false)}>
                <Ionicons name="play" size={20} color={colors.text} />
                <Text style={ts.btnText}>PREVIEW</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ts.btnRecord} onPress={() => playAnimation(true)}>
                <Ionicons name="videocam" size={20} color="#000" />
                <Text style={[ts.btnText, { color: '#000' }]}>RECORD CLIP</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={ts.btnStop} onPress={stopAnim}>
              <Ionicons name="stop" size={20} color="#fff" />
              <Text style={[ts.btnText, { color: '#fff' }]}>STOP REPLAY</Text>
            </TouchableOpacity>
          )}
        </View>

        {status ? <Text style={ts.statusText}>{status}</Text> : null}

        {videoUrl && (
          <View style={ts.downloadCard}>
            <Text style={ts.successText}>Video captured successfully!</Text>
            <TouchableOpacity style={ts.btnDownload} onPress={downloadVideo}>
              <Ionicons name="download-outline" size={20} color="#000" />
              <Text style={ts.btnDownloadText}>DOWNLOAD WEBM</Text>
            </TouchableOpacity>
            <Text style={ts.hintText}>WebM format is supported by IG/TikTok. For iOS, convert to MP4.</Text>
          </View>
        )}

        <View style={ts.guideCard}>
          <Text style={ts.guideLabel}>GUIDE</Text>
          <Text style={ts.guideText}>1. Preview your route animation.</Text>
          <Text style={ts.guideText}>2. Record clip to generate a shareable video.</Text>
          <Text style={ts.guideText}>3. Wait for the sequence to complete.</Text>
          <Text style={ts.guideText}>4. Download and share to social media.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  headerSubtitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  webOnlyText: { color: colors.textSecondary, marginTop: spacing.lg, textAlign: 'center' },
  scrollPadding: { padding: spacing.lg, paddingBottom: 60 },
  rideHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: spacing.xl, backgroundColor: '#111', padding: spacing.lg, borderRadius: borderRadius.lg },
  iconBox: { width: 48, height: 48, borderRadius: borderRadius.md, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  rideTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  rideSubtitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  canvasWrapper: { borderRadius: borderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: '#222', backgroundColor: '#000' },
  canvas: { width: '100%', aspectRatio: W/H, display: 'block' },
  recBadge: { position: 'absolute', top: 16, right: 16, zIndex: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4444', marginRight: 8 },
  recText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  progressTrack: { height: 4, backgroundColor: '#111' },
  progressBar: { height: 4, backgroundColor: colors.accent },
  controls: { flexDirection: 'row', gap: 12, marginTop: spacing.xl },
  btnPreview: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111', padding: spacing.lg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#333' },
  btnRecord: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.accent, padding: spacing.lg, borderRadius: borderRadius.md },
  btnStop: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FF4444', padding: spacing.lg, borderRadius: borderRadius.md },
  btnText: { color: colors.text, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  statusText: { color: colors.accent, fontSize: 11, textAlign: 'center', marginTop: spacing.md, fontWeight: '600' },
  downloadCard: { marginTop: spacing.xl, padding: spacing.xl, backgroundColor: '#111', borderRadius: borderRadius.lg, borderLeftWidth: 4, borderLeftColor: colors.accent },
  successText: { color: colors.accent, fontWeight: '700', fontSize: 12, marginBottom: 12 },
  btnDownload: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.accent, padding: spacing.lg, borderRadius: borderRadius.md },
  btnDownloadText: { color: '#000', fontWeight: '800', fontSize: 12 },
  hintText: { color: colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 12, lineHeight: 16 },
  guideCard: { marginTop: spacing.xl, padding: spacing.lg, backgroundColor: '#0A0A0A', borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#111' },
  guideLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  guideText: { color: colors.textSecondary, fontSize: 11, marginBottom: 8, lineHeight: 18 }
});
