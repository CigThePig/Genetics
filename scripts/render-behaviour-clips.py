"""Optional Pillow/ffmpeg recorder: diagnostic motion, not production screenshots."""
import gzip,json,math,subprocess
from pathlib import Path
from PIL import Image,ImageDraw
root=Path('tracks/2026-10-20-pre-track12-foundation/evidence')
for name in ['peaceful','search','pursuit']:
 pair=[json.loads(gzip.decompress((root/v/f'{name}-1-motion.json.gz').read_bytes())) for v in ['baseline','final']]
 process=subprocess.Popen(['ffmpeg','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','1000x540','-framerate','10','-i','-','-an','-c:v','libx264','-crf','24','-pix_fmt','yuv420p',str(root/f'{name}-motion.mp4')],stdin=subprocess.PIPE)
 for index in range(min(len(d['frames']) for d in pair)):
  img=Image.new('RGB',(1000,540),'#111c1c');draw=ImageDraw.Draw(img)
  for col,data in enumerate(pair):
   ox=col*500+20;oy=45;sx=460/data['width'];sy=460/data['height'];frame=data['frames'][index]
   draw.text((ox,12),f"{name} | {'BASELINE' if col==0 else 'FOUNDATION'} | {index*.5:.1f}s | seed 1",fill='#e7eee9')
   draw.rectangle((ox,oy,ox+460,oy+460),fill='#334638',outline='#637b6c')
   for c in frame['creatures']:
    color='#ffb25d' if c['species'] in ('triangle','octagon') else '#d8f3ed';trail=[]
    for j in range(max(0,index-24),index+1):
     p=next((n for n in data['frames'][j]['creatures'] if n['id']==c['id']),None)
     if p:trail.append((ox+p['x']*sx,oy+p['y']*sy))
    if len(trail)>1:draw.line(trail,fill='#aa8050' if color=='#ffb25d' else '#78998a',width=1)
    x=ox+c['x']*sx;y=oy+c['y']*sy;draw.ellipse((x-3,y-3,x+3,y+3),fill=color)
    draw.line((x,y,x+math.cos(c['h'])*8,y+math.sin(c['h'])*8),fill=color,width=2)
    if c.get('threat'):draw.ellipse((x-6,y-6,x+6,y+6),outline='#ff6973')
   draw.text((ox,515),'5x diagnostic playback | 0.5s samples | trails: last 12s',fill='#bed3c8')
  process.stdin.write(img.tobytes())
 process.stdin.close()
 if process.wait()!=0:raise RuntimeError('ffmpeg failed')
