#define FRAGMENT_SHADER
// Warsow GLSL shader

#if !defined(__GLSL_CG_DATA_TYPES)
#define myhalf float
#define myhalf2 vec2
#define myhalf3 vec3
#define myhalf4 vec4
#else
#define myhalf half
#define myhalf2 half2
#define myhalf3 half3
#define myhalf4 half4
#endif

varying vec4 ProjVector;

#ifdef VERTEX_SHADER
// Vertex shader

void main(void)
{
gl_FrontColor = gl_Color;


mat4 textureMatrix;

textureMatrix = gl_TextureMatrix[0];

gl_Position = ftransform();
ProjVector = textureMatrix * gl_Vertex;
}

#endif // VERTEX_SHADER


#ifdef FRAGMENT_SHADER
// Fragment shader

uniform myhalf3 LightAmbient;

uniform float TextureWidth, TextureHeight;
uniform float ProjDistance;
uniform sampler2DShadow ShadowmapTexture;

void main(void)
{
myhalf color = myhalf(1.0);

if (ProjVector.w <= 0.0 || ProjVector.w >= ProjDistance)
discard;

float dtW  = 1.0 / TextureWidth;
float dtH  = 1.0 / TextureHeight;

vec3 coord = vec3 (ProjVector.xyz / ProjVector.w);
coord = (coord + vec3 (1.0)) * vec3 (0.5);
coord.s = float (clamp (float(coord.s), dtW, 1.0 - dtW));
coord.t = float (clamp (float(coord.t), dtH, 1.0 - dtH));
coord.r = float (clamp (float(coord.r), 0.0, 1.0));

myhalf shadow0 = myhalf(shadow2D(ShadowmapTexture, coord).r);
myhalf shadow = shadow0;

#if defined(APPLY_PCF2x2) || defined(APPLY_PCF3x3)

vec3 coord2 = coord + vec3(0.0, dtH, 0.0);
myhalf shadow1 = myhalf (shadow2D (ShadowmapTexture, coord2).r);

coord2 = coord + vec3(dtW, dtH, 0.0);
myhalf shadow2 = myhalf (shadow2D (ShadowmapTexture, coord2).r);

coord2 = coord + vec3(dtW, 0.0, 0.0);
myhalf shadow3 = myhalf (shadow2D (ShadowmapTexture, coord2).r);

#if defined(APPLY_PCF3x3)
coord2 = coord + vec3(-dtW, 0.0, 0.0);
myhalf shadow4 = myhalf (shadow2D (ShadowmapTexture, coord2).r);

coord2 = coord + vec3(-dtW, -dtH, 0.0);
myhalf shadow5 = myhalf (shadow2D (ShadowmapTexture, coord2).r);

coord2 = coord + vec3(0.0, -dtH, 0.0);
myhalf shadow6 = myhalf (shadow2D (ShadowmapTexture, coord2).r);

coord2 = coord + vec3(dtW, -dtH, 0.0);
myhalf shadow7 = myhalf (shadow2D (ShadowmapTexture, coord2).r);

coord2 = coord + vec3(-dtW, dtH, 0.0);
myhalf shadow8 = myhalf (shadow2D (ShadowmapTexture, coord2).r);

shadow = (shadow0 + shadow1 + shadow2 + shadow3 + shadow4 + shadow5 + shadow6 + shadow7 + shadow8) * myhalf(0.11);
#else
shadow = (shadow0 + shadow1 + shadow2 + shadow3) * myhalf(0.25);
#endif
#else
shadow = shadow0;
#endif

float attenuation = float (ProjVector.w) / ProjDistance;
myhalf compensation = myhalf(0.25) - max(LightAmbient.x, max(LightAmbient.y, LightAmbient.z))
;compensation = max (compensation, 0.0);
color = shadow + attenuation + compensation;

gl_FragColor = vec4(vec3(color),1.0);
}

#endif // FRAGMENT_SHADER

