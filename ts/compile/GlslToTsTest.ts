let glSource1 = `#define LIGHTS_PER_PASS 10
#define CC_USE_FOG 0
#define CC_PIPELINE_TYPE 0
#define CC_USE_HDR 0
#define CC_FORWARD_ADD 0
#define USE_BATCHING 0
#define USE_LIGHTMAP 0
#define CC_USE_IBL 0
#define CC_RECEIVE_SHADOW 0
#define CC_EFFECT_USED_FRAGMENT_UNIFORM_VECTORS 53
#define CC_EFFECT_USED_VERTEX_UNIFORM_VECTORS 37

precision highp float;
uniform highp vec4 cc_cameraPos;
uniform mediump vec4 cc_exposure;
uniform mediump vec4 cc_mainLitDir;
uniform mediump vec4 cc_mainLitColor;
uniform mediump vec4 cc_ambientSky;
uniform mediump vec4 cc_ambientGround;
uniform mediump vec4 cc_fogColor;
uniform mediump vec4 cc_fogBase;
uniform mediump vec4 cc_fogAdd;
vec3 SRGBToLinear (vec3 gamma) {
return gamma * gamma;
}
uniform highp mat4 cc_matLightView;
uniform highp mat4 cc_matLightViewProj;
uniform lowp vec4 cc_shadowNFLSInfo;
uniform lowp vec4 cc_shadowWHPBInfo;
uniform lowp vec4 cc_shadowLPNNInfo;
uniform lowp vec4 cc_shadowColor;
float GGXMobile (float roughness, float NoH, vec3 H, vec3 N) {
vec3 NxH = cross(N, H);
float OneMinusNoHSqr = dot(NxH, NxH);
float a = roughness * roughness;
float n = NoH * a;
float p = a / (OneMinusNoHSqr + n * n);
return p * p;
}
float CalcSpecular (float roughness, float NoH, vec3 H, vec3 N) {
return (roughness * 0.25 + 0.25) * GGXMobile(roughness, NoH, H, N);
}
vec3 BRDFApprox (vec3 specular, float roughness, float NoV) {
const vec4 c0 = vec4(-1.0, -0.0275, -0.572, 0.022);
const vec4 c1 = vec4(1.0, 0.0425, 1.04, -0.04);
vec4 r = roughness * c0 + c1;
float a004 = min(r.x * r.x, exp2(-9.28 * NoV)) * r.x + r.y;
vec2 AB = vec2(-1.04, 1.04) * a004 + r.zw;
AB.y *= clamp(50.0 * specular.g, 0.0, 1.0);
return specular * AB.x + AB.y;
}
struct StandardSurface {
vec4 albedo;
vec3 position;
vec3 normal;
vec3 emissive;
vec3 lightmap;
float lightmap_test;
float roughness;
float metallic;
float occlusion;
};
vec4 CCStandardShadingBase (StandardSurface s, vec4 shadowPos) {
vec3 diffuse = s.albedo.rgb * (1.0 - s.metallic);
vec3 specular = mix(vec3(0.04), s.albedo.rgb, s.metallic);
vec3 N = normalize(s.normal);
vec3 V = normalize(cc_cameraPos.xyz - s.position);
float NV = max(abs(dot(N, V)), 0.001);
specular = BRDFApprox(specular, s.roughness, NV);
vec3 L = normalize(-cc_mainLitDir.xyz);
vec3 H = normalize(L + V);
float NH = max(dot(N, H), 0.0);
float NL = max(dot(N, L), 0.001);
vec3 finalColor = NL * cc_mainLitColor.rgb * cc_mainLitColor.w;
vec3 diffuseContrib = diffuse;
diffuseContrib /= 3.14159265359;
vec3 specularContrib = specular * CalcSpecular(s.roughness, NH, H, N);
finalColor *= (diffuseContrib + specularContrib);
float fAmb = 0.5 - N.y * 0.5;
vec3 ambDiff = mix(cc_ambientSky.rgb, cc_ambientGround.rgb, fAmb) * cc_ambientSky.w;
finalColor += (ambDiff.rgb * diffuse);
finalColor = finalColor * s.occlusion;
finalColor += s.emissive;
return vec4(finalColor, s.albedo.a);
}
uniform highp vec4 cc_lightPos[LIGHTS_PER_PASS];
uniform vec4 cc_lightColor[LIGHTS_PER_PASS];
uniform vec4 cc_lightSizeRangeAngle[LIGHTS_PER_PASS];
uniform vec4 cc_lightDir[LIGHTS_PER_PASS];
float SmoothDistAtt (float distSqr, float invSqrAttRadius) {
float factor = distSqr * invSqrAttRadius;
float smoothFactor = clamp(1.0 - factor * factor, 0.0, 1.0);
return smoothFactor * smoothFactor;
}
float GetDistAtt (float distSqr, float invSqrAttRadius) {
float attenuation = 1.0 / max(distSqr, 0.01*0.01);
attenuation *= SmoothDistAtt(distSqr , invSqrAttRadius);
return attenuation;
}
float GetAngleAtt (vec3 L, vec3 litDir, float litAngleScale, float litAngleOffset) {
float cd = dot(litDir, L);
float attenuation = clamp(cd * litAngleScale + litAngleOffset, 0.0, 1.0);
return (attenuation * attenuation);
}
vec4 CCStandardShadingAdditive (StandardSurface s, vec4 shadowPos) {
vec3 diffuse = s.albedo.rgb * (1.0 - s.metallic);
vec3 specular = mix(vec3(0.04), s.albedo.rgb, s.metallic);
vec3 diffuseContrib = diffuse / 3.14159265359;
vec3 N = normalize(s.normal);
vec3 V = normalize(cc_cameraPos.xyz - s.position);
float NV = max(abs(dot(N, V)), 0.001);
specular = BRDFApprox(specular, s.roughness, NV);
vec3 finalColor = vec3(0.0);
int numLights = CC_PIPELINE_TYPE == 0 ? LIGHTS_PER_PASS : int(cc_lightDir[0].w);
for (int i = 0; i < LIGHTS_PER_PASS; i++) {
if (i >= numLights) break;
vec3 SLU = cc_lightPos[i].xyz - s.position;
vec3 SL = normalize(SLU);
vec3 SH = normalize(SL + V);
float SNL = max(dot(N, SL), 0.001);
float SNH = max(dot(N, SH), 0.0);
float distSqr = dot(SLU, SLU);
float litRadius = cc_lightSizeRangeAngle[i].x;
float litRadiusSqr = litRadius * litRadius;
float illum = 3.14159265359 * (litRadiusSqr / max(litRadiusSqr , distSqr));
float attRadiusSqrInv = 1.0 / max(cc_lightSizeRangeAngle[i].y, 0.01);
attRadiusSqrInv *= attRadiusSqrInv;
float att = GetDistAtt(distSqr, attRadiusSqrInv);
vec3 lspec = specular * CalcSpecular(s.roughness, SNH, SH, N);
if (cc_lightPos[i].w > 0.0) {
float cosInner = max(dot(-cc_lightDir[i].xyz, SL), 0.01);
float cosOuter = cc_lightSizeRangeAngle[i].z;
float litAngleScale = 1.0 / max(0.001, cosInner - cosOuter);
float litAngleOffset = -cosOuter * litAngleScale;
att *= GetAngleAtt(SL, -cc_lightDir[i].xyz, litAngleScale, litAngleOffset);
}
vec3 lightColor = cc_lightColor[i].rgb;
finalColor += SNL * lightColor * cc_lightColor[i].w * illum * att * (diffuseContrib + lspec);
}
finalColor = finalColor * s.occlusion;
return vec4(finalColor, 0.0);
}
vec3 ACESToneMap (vec3 color) {
color = min(color, vec3(8.0));
const float A = 2.51;
const float B = 0.03;
const float C = 2.43;
const float D = 0.59;
const float E = 0.14;
return (color * (A * color + B)) / (color * (C * color + D) + E);
}
vec4 CCFragOutput (vec4 color) {
return color;
}
float LinearFog(vec4 pos) {
vec4 wPos = pos;
float cam_dis = distance(cc_cameraPos, wPos);
float fogStart = cc_fogBase.x;
float fogEnd = cc_fogBase.y;
return clamp((fogEnd - cam_dis) / (fogEnd - fogStart), 0., 1.);
}
float ExpFog(vec4 pos) {
vec4 wPos = pos;
float fogAtten = cc_fogAdd.z;
float fogDensity = cc_fogBase.z;
float cam_dis = distance(cc_cameraPos, wPos) / fogAtten * 4.;
float f = exp(-cam_dis * fogDensity);
return f;
}
float ExpSquaredFog(vec4 pos) {
vec4 wPos = pos;
float fogAtten = cc_fogAdd.z;
float fogDensity = cc_fogBase.z;
float cam_dis = distance(cc_cameraPos, wPos) / fogAtten * 4.;
float f = exp(-cam_dis * cam_dis * fogDensity * fogDensity);
return f;
}
float LayeredFog(vec4 pos) {
vec4 wPos = pos;
float fogAtten = cc_fogAdd.z;
float _FogTop = cc_fogAdd.x;
float _FogRange = cc_fogAdd.y;
vec3 camWorldProj = cc_cameraPos.xyz;
camWorldProj.y = 0.;
vec3 worldPosProj = wPos.xyz;
worldPosProj.y = 0.;
float fDeltaD = distance(worldPosProj, camWorldProj) / fogAtten * 2.0;
float fDeltaY, fDensityIntegral;
if (cc_cameraPos.y > _FogTop) {
if (wPos.y < _FogTop) {
fDeltaY = (_FogTop - wPos.y) / _FogRange * 2.0;
fDensityIntegral = fDeltaY * fDeltaY * 0.5;
} else {
fDeltaY = 0.;
fDensityIntegral = 0.;
}
} else {
if (wPos.y < _FogTop) {
float fDeltaA = (_FogTop - cc_cameraPos.y) / _FogRange * 2.;
float fDeltaB = (_FogTop - wPos.y) / _FogRange * 2.;
fDeltaY = abs(fDeltaA - fDeltaB);
fDensityIntegral = abs((fDeltaA * fDeltaA * 0.5) - (fDeltaB * fDeltaB * 0.5));
} else {
fDeltaY = abs(_FogTop - cc_cameraPos.y) / _FogRange * 2.;
fDensityIntegral = abs(fDeltaY * fDeltaY * 0.5);
}
}
float fDensity;
if (fDeltaY != 0.) {
fDensity = (sqrt(1.0 + ((fDeltaD / fDeltaY) * (fDeltaD / fDeltaY)))) * fDensityIntegral;
} else {
fDensity = 0.;
}
float f = exp(-fDensity);
return f;
}
varying vec2 v_uv;
uniform sampler2D cc_gbuffer_albedoMap;
uniform sampler2D cc_gbuffer_positionMap;
uniform sampler2D cc_gbuffer_normalMap;
uniform sampler2D cc_gbuffer_emissiveMap;
void main () {
StandardSurface s;
vec4 albedoMap = texture2D(cc_gbuffer_albedoMap,v_uv);
vec4 positionMap = texture2D(cc_gbuffer_positionMap,v_uv);
vec4 normalMap = texture2D(cc_gbuffer_normalMap,v_uv);
vec4 emissiveMap = texture2D(cc_gbuffer_emissiveMap,v_uv);
s.albedo = albedoMap;
s.position = positionMap.xyz;
s.roughness = positionMap.w;
s.normal = normalMap.xyz;
s.metallic = normalMap.w;
s.emissive = emissiveMap.xyz;
s.occlusion = emissiveMap.w;
float fogFactor;
fogFactor = 1.0;
vec4 shadowPos;
shadowPos = cc_matLightViewProj * vec4(s.position, 1);
vec4 color = CCStandardShadingBase(s, shadowPos) +
CCStandardShadingAdditive(s, shadowPos);
color = vec4(mix(CC_FORWARD_ADD > 0 ? vec3(0.0) : cc_fogColor.rgb, color.rgb, fogFactor), color.a);
gl_FragColor = CCFragOutput(color);
}
`
glSource1 = `
struct StandardSurface {
    vec4 albedo;
    vec3 position;
    vec3 normal;
    vec3 emissive;
    vec3 lightmap;
    float lightmap_test;
    float roughness;
    float metallic;
    float occlusion;
    };
attribute vec4 a_joints;
void main() {
    vec4 asd;
    StandardSurface s;
    vec3 diffuse = asd.xyz * (1.0 - s.metallic);
    asd.xy = vec2(a_joints.xy);
    gl_Position = vec4(a_joints);
}`
let Compiler = require("glsl-transpiler")

var compile = Compiler({
    uniform: function (name: string) {
        return `uniforms.${name}`
    },
    attribute: function (name: string) {
        return `attributes.${name}`
    },
})
let retsult = compile(glSource1)
console.log(retsult)
// writeFileSync("../token", JSON.stringify(tokens))
// writeFileSync("../ast", JSON.stringify(ast))

// let code = recast.print(ast).code
// console.log(code)
