

varying vec2 vUv;

void main() {
  vec2 uv = (vUv - 0.5) * 4.0;
  float r = length(uv);
  float dist = distance(uv, vec2(0.0));

  // --- Mascara circular ---
  // alpha = 1.0 dentro del círculo (opaco)
  // alpha = 0.0 fuera (transparente)
  float alpha = 1.0 - smoothstep(0.8, 1.02 , r);

   if (alpha < 1.0) {
    discard; // completamente transparente afuera
  }


  // --- Alpha aplicado ---
  gl_FragColor = vec4(vec3(0.0), 1.0);
}