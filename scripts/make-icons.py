from PIL import Image, ImageDraw
from pathlib import Path
base=Path(__file__).resolve().parent.parent/'assets'
s=4
im=Image.new('RGB',(512,512),'#edf3f9')
d=ImageDraw.Draw(im)
def pts(v): return [(int(x*s),int(y*s)) for x,y in v]
def curve(a,b,c,e,n=30):
 return [((1-t)**3*a[0]+3*(1-t)**2*t*b[0]+3*(1-t)*t*t*c[0]+t**3*e[0],(1-t)**3*a[1]+3*(1-t)**2*t*b[1]+3*(1-t)*t*t*c[1]+t**3*e[1]) for t in [i/n for i in range(n+1)]]
left=curve((29,35),(43,32),(55,35),(64,43))+[(64,97)]+curve((64,97),(53,89),(40,86),(29,90))
right=curve((99,35),(85,32),(73,35),(64,43))+[(64,97)]+curve((64,97),(75,89),(88,86),(99,90))
d.polygon(pts(left),fill='#7fa4c5');d.polygon(pts(right),fill='#e9ab7c')
for a,b in [((64,44),(64,97)),((38,48),(55,52)),((38,60),(55,64)),((90,48),(73,52)),((90,60),(73,64))]:
 d.line(pts([a,b]),fill='white',width=4*s)
 for x,y in [a,b]:d.ellipse(((x-2)*s,(y-2)*s,(x+2)*s,(y+2)*s),fill='white')
for size in [192,512]:im.resize((size,size),Image.Resampling.LANCZOS).save(base/f'icon-{size}.png')
print('App icons generated')
