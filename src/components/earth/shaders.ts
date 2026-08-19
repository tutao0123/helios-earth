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
  float dayF = smoothstep(-0.08, 0.32, ndotl);
  float nightF = 1.0 - smoothstep(-0.06, 0.22, ndotl);
  float twilight = exp(-pow(ndotl * 4.8, 2.0));

  vec3 nightCol = day * 0.09 + lights * 1.55;
  vec3 color = mix(nightCol, day, dayF);

  // Warm gouache dusk instead of physical scatter
  color += vec3(0.42, 0.22, 0.10) * twilight * 0.28;

  vec3 halfV = normalize(sun + view);
  float spec = pow(max(dot(n, halfV), 0.0), 22.0) * specMask * dayF;
  color += vec3(0.72, 0.78, 0.80) * spec * 0.22;

  float fres = pow(1.0 - max(dot(n, view), 0.0), 2.2);
  color += vec3(0.55, 0.48, 0.32) * fres * 0.08 * dayF;

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
