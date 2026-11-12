import { ACCENTS, ANIMATION_SPEED, DEFAULT_APPEARANCE, STORAGE_KEY, TEXT_SCALE } from "@/providers/theme-config";

/**
 * Runs in <head> before first paint so the saved theme, accent and layout are applied immediately.
 * Without it the page paints in the default dark theme and then flips once React loads,
 * which looked like wrong colours when the user had chosen light or a custom accent.
 * Mirrors the logic in ThemeProvider (kept deliberately small and dependency free).
 */
export const themeBootScript = `(function(){try{
var K=${JSON.stringify(STORAGE_KEY)},A=${JSON.stringify(ACCENTS)},T=${JSON.stringify(TEXT_SCALE)},S=${JSON.stringify(ANIMATION_SPEED)},D=${JSON.stringify(DEFAULT_APPEARANCE)};
var a={};try{a=JSON.parse(localStorage.getItem(K)||"{}")||{}}catch(e){}
var g=function(k){return a[k]!==undefined&&a[k]!==null?a[k]:D[k]};
var r=document.documentElement,tg=window.Telegram&&window.Telegram.WebApp,m=g("mode");
var light=m==="light"||(m==="system"&&(tg&&tg.colorScheme?tg.colorScheme==="light":window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches));
var th=light?"light":"dark",ac=g("accent"),col;
if(ac==="custom"&&/^#[0-9a-fA-F]{6}$/.test(g("customAccent"))){
col=g("customAccent");
if(light){var n=parseInt(col.slice(1),16),f=function(s){return Math.round(((n>>s)&255)*0.72).toString(16).padStart(2,"0")};col="#"+f(16)+f(8)+f(0)}
}else{var p=A[ac]||A.mint;col=light?p.light:p.dark}
var v=parseInt(col.slice(1),16);
var set=function(k,x){r.dataset[k]=String(x)};
set("theme",th);set("accent",ac);set("surface",g("surface"));set("corners",g("corners"));set("background",g("background"));
set("animationStyle",g("animationStyle"));set("layout",g("layout"));set("width",g("contentWidth"));set("density",g("density"));
set("textSize",g("textSize"));set("motion",g("motion")===false?"off":"on");set("haptics",g("haptics")===false?"off":"on");
set("bgDim",g("backgroundIntensity")<100?"true":"false");
r.style.setProperty("--accent",col);r.style.setProperty("--accent-rgb",((v>>16)&255)+" "+((v>>8)&255)+" "+(v&255));
r.style.setProperty("--glass-blur",(g("blur")*0.32)+"px");r.style.setProperty("--speed",String(S[g("animationSpeed")]||1));
r.style.setProperty("--bg-opacity",String(g("backgroundIntensity")/100));r.style.fontSize=T[g("textSize")]||"16px";
}catch(e){}})();`;
