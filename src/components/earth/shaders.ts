export const earthVert = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const earthFrag = /* glsl */ `
uniform sampler2D uDay;
uniform sampler2D uNight;
uniform sampler2D uSpec;
uniform vec3 uSun;
uniform vec3 uCam;

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vec3 n = normalize(vNormalW);
  vec3 sun = normalize(uSun);
  vec3 view = normalize(uCam - vPosW);

  vec3 day = texture2D(uDay, vUv).rgb;
  vec3 lights = texture2D(uNight, vUv).rgb;
  float specMask = texture2D(uSpec, vUv).r;

  float ndotl = dot(n, sun);
  float dayF = smoothstep(-0.05, 0.22, ndotl);
  float nightF = 1.0 - smoothstep(-0.02, 0.18, ndotl);
  float twilight = exp(-pow(ndotl * 6.0, 2.0));

  vec3 nightCol = day * 0.028 + lights * 1.85;
  vec3 color = mix(nightCol, day, dayF);

  // Soft terminator scatter — physical dusk, kept quiet
  color += vec3(0.22, 0.14, 0.08) * twilight * 0.22;

  vec3 halfV = normalize(sun + view);
  float spec = pow(max(dot(n, halfV), 0.0), 48.0) * specMask * dayF;
  color += vec3(0.55, 0.62, 0.72) * spec * 0.55;

  float fres = pow(1.0 - max(dot(n, view), 0.0), 2.6);
  color += vec3(0.35, 0.55, 0.75) * fres * 0.12 * dayF;

  gl_FragColor = vec4(color, 1.0);
}
`;

export const atmosVert = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const atmosFrag = /* glsl */ `
uniform vec3 uSun;
uniform vec3 uCam;
uniform float uIntensity;
uniform vec3 uColor;
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vec3 n = normalize(vNormalW);
  vec3 view = normalize(uCam - vPosW);
  vec3 sun = normalize(uSun);
  float fres = pow(1.0 - abs(dot(n, view)), 2.4);
  float sunFacing = smoothstep(-0.3, 0.7, dot(n, sun));
  float a = fres * uIntensity * mix(0.22, 1.0, sunFacing);
  gl_FragColor = vec4(uColor * a, a);
}
`;

export const cloudVert = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
void main() {
  vUv = uv;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const cloudFrag = /* glsl */ `
uniform sampler2D uCloud;
uniform vec3 uSun;
uniform float uOffset;
varying vec2 vUv;
varying vec3 vNormalW;

void main() {
  vec2 uv = vec2(fract(vUv.x + uOffset), vUv.y);
  vec4 tex = texture2D(uCloud, uv);
  float alpha = max(tex.r, tex.a) * 0.52;
  float ndotl = dot(normalize(vNormalW), normalize(uSun));
  float lit = smoothstep(-0.15, 0.45, ndotl);
  vec3 col = mix(vec3(0.04, 0.05, 0.07), vec3(0.96, 0.97, 0.98), lit);
  gl_FragColor = vec4(col, alpha * mix(0.15, 1.0, lit));
}
`;
