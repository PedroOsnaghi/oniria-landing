// === UNIFORMS DEL ENGINE ===
uniform float uTime;
uniform vec2  uResolution;
uniform float uOnlyMask; // 0 = normal | 1 = solo Mask

// === CONTROLES DE INTENSIDAD ===
uniform float uPlasmaStrength;   // Fuerza del plasma interno (energía)
uniform float uGlassStrength;    // Fuerza del efecto vidrio/contenedor
uniform float uPlasmaRadius;     // Radio del plasma dentro de la esfera
uniform float uFresnelWidth;     // Qué tan "grueso" es el borde contenedor
uniform float uFresnelIntensity; // Intensidad del efecto fresnelghp float
uniform float uFresnelBright;   // Brillo extra en el borde del contenedor
uniform float uFresnelBrightWidth; // Ancho del brillo extra en el borde del contenedor

// === CONTROLES DE COLOR ===
// Colores del plasma
uniform vec3 uPlasmaColor;       // Color base del plasma
uniform float uPlasmaColorIntensity; // Intensidad del color del plasma
uniform vec4 uPlasmaColorMap;    // Mapeo de color interno del plasma (vec4 de la línea tanh)
uniform vec3 uPlasmaOffset;      // Offset (color base)
uniform vec3 uPlasmaAmplitude;   // Amplitud (variación de color)
uniform vec3 uPlasmaFrequency;   // Frecuencia (velocidad de cambio)
uniform vec3 uPlasmaPhase;       // Fase (desfase de canales RGB)


// Colores del vidrio/contenedor (paleta procedural)
uniform vec3 uGlassColorBase;    // Color base del vidrio
uniform vec3 uGlassOffset;       // Offset (color base de la paleta)
uniform vec3 uGlassAmplitude;    // Amplitud (variación de color)
uniform vec3 uGlassFrequency;    // Frecuencia (velocidad de cambio)
uniform vec3 uGlassPhase;        // Fase (desfase de canales RGB)
uniform vec3 uGlassTint;         // Tinte del vidrio

// Control de dirección del humo/flujo
uniform float uSmokeDirectionOffset;  // Offset de dirección (animación del flujo) 0.15
uniform float uSmokeTurbulence;       // Turbulencia del flujo (variación ale

// Control de gamma
uniform float uGammaCorrection;  // Corrección gamma

varying vec2 vUv;

#define TAU 3.28318530718

// === FUNCIONES HELPER PARA NOISE ===
float rand(vec2 n){return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453);}
float noise(vec2 p){
  vec2 ip=floor(p),u=fract(p);
  u=u*u*(3.0-2.0*u);
  float res=mix(
    mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
    mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
  return res*res;
}
// Fractal Brownian Motion - crea texturas complejas
float fbm(vec2 p,int oct){
  float s=0.0,m=0.0,a=0.5;
  for(int i=0;i<10;i++){
    if(i>=oct)break;
    s+=a*noise(p);
    m+=a;
    a*=0.5;
    p*=2.0;
  }
  return s/m;
}
float luma(vec3 c){return dot(c,vec3(0.299,0.587,0.114));}
// Paleta de colores procedural
vec3 pal(float t,vec3 a,vec3 b,vec3 c,vec3 d){return a+b*cos(TAU*(c*t+d));}

// === EFECTO GLASS/CONTENEDOR ===
vec3 glassLayer(vec2 uv,float t){
  float l=dot(uv,uv);
  float sm=smoothstep(1.0,0.98,l);
  
  // Fresnel effect - brillo en los bordes
  float d=sm*l*l*l*uFresnelIntensity;

  vec3 norm=normalize(vec3(uv.x,uv.y,0.7-d));

  // Noise turbulento para textura del vidrio
  float nx=fbm(uv*3.0+t*0.2+58.69,8);
  float ny=fbm(uv*3.0+t*uSmokeTurbulence+26.31,5);
  float n=fbm(uv*3.0+2.0*vec2(nx,ny)+sin(t)*0.5,4);
  n=pow(n,1.1);

  // Color base del vidrio (configurable)
  vec3 col = uGlassColorBase * (n*0.6+0.25);
  
  // Variación de color rotacional (paleta procedural)
  float a=atan(uv.y,uv.x)/TAU+t*uSmokeDirectionOffset + 0.8;
  col*=pal(a, uGlassOffset, uGlassAmplitude, uGlassFrequency, uGlassPhase);
  col*=uGlassTint; // Tinte configurable

  // Reflejos especulares (highlights)
  vec3 cd=abs(col);
  vec3 c=col*d;
  c+=(c*0.5+vec3(1.0)-luma(c)) *vec3(max(0.0,pow(dot(norm,vec3(0,0,-1)),5.0)*3.0));
  
  // Brillos adicionales en la superficie
  float g=2.8*smoothstep(0.6,1.0,fbm(norm.xy*3.0/(1.0+norm.z),3))*d;
  c+=g;

  // Fresnel final - borde brillante del contenedor
  col=c+col*pow((1.0-smoothstep(1.0,uFresnelWidth,l)
                -pow(max(0.0,length(uv)-1.0),uFresnelBrightWidth))*uFresnelBright,2.5);
  col+=abs(norm)*(1.0-d)*sm*0.45;

  return col;
}



// === PLASMA INTERNO/ENERGÍA ===
vec3 plasmaLayer(vec2 p,float t){
  vec2 z=vec2(0.0);
  vec2 i=vec2(0.0);
  
  // Deformación compleja del espacio para efecto orgánico
  vec2 f=p*(z+=4.2-4.0*abs(0.3-dot(p,p)));
  vec4 O=vec4(1.0);
  
  // Loop para crear patrones fractales animados
  for(i.y=1.;i.y<8.0;i.y++){
    O+=(sin(f)+1.5).xyyx*abs(f.x-f.y);
    f+=cos(f.yx*i.y+i+t)/i.y+0.7; // Animación temporal
  }
  
  // Transformaciones de color para plasma (configurable)
  vec4 palCol = vec4(pal(1.0, uPlasmaOffset, uPlasmaAmplitude, uPlasmaFrequency, uPlasmaPhase), 1.0);
  O=tanh(7.0*exp(z.x-5.+p.x*palCol+0.2)/O);
  O=pow(O,vec4(1.)); // Contraste
  O.rgb*=uPlasmaColor * uPlasmaColorIntensity; // Color configurable
  
  return O.rgb;
}

// === FUNCIÓN PRINCIPAL ===
void main() {
  // Coordenadas centradas y escaladas
  vec2 uv = (vUv - 0.5) * 5.0;
  float r = length(uv);
  float t = uTime;

  // === COMBINACIÓN DE CAPAS ===
  
  // Máscara para controlar dónde aparece el plasma
  float plasmaMask = 1.0 - 0.2 * smoothstep(uPlasmaRadius, 0.0, r);
  
  // Capa de plasma interno (energía) - EL NODO PRINCIPAL
  vec3 colPlasma = plasmaLayer(uv, t) * uPlasmaStrength;
  
  // Capa de vidrio/contenedor (borde brillante) - EL HUMO
  vec3 colGlass  = glassLayer(uv, t) * uGlassStrength;

  // === MEZCLA FINAL ===
  vec3 color = colPlasma + colGlass;
  
  // Corrección gamma para mejor visualización (configurable)
  color = pow(color, vec3(uGammaCorrection));

  // === CÁLCULO DE TRANSPARENCIA DIFERENCIADA ===
  
  // Alpha para el nodo central (más opaco)
  float plasmaAlpha = length(colPlasma);
  plasmaAlpha = smoothstep(0.1, 0.8, plasmaAlpha);
  
  // Alpha para el humo (más transparente)
  float smokeAlpha = length(colGlass) * 0.6; // Factor 0.6 para más transparencia
  smokeAlpha = smoothstep(0.05, 0.4, smokeAlpha);
  
  // Combinar alphas: usar el máximo para que el nodo sea visible
  float finalAlpha = max(plasmaAlpha, smokeAlpha);
  
  // Si estás muy lejos del centro, hacer más transparente
  float distanceFade = smoothstep(3.0, 1.5, r);
  finalAlpha *= distanceFade;

  gl_FragColor = vec4(color, finalAlpha);
}