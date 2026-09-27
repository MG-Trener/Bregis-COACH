export const PDF_WIDTH=595.3200073242188;
export const CROP_TOP=45;
export const CROP_BOTTOM=788;
export const FIRST_PAGE=2;
export const PAGE_GAP=12;
export function pageHeight(scale){return(CROP_BOTTOM-CROP_TOP)*scale;}
export function pageTop(page,scale){return(page-FIRST_PAGE)*(pageHeight(scale)+PAGE_GAP);}
export function readingPosition(scroll,scale,lastPage){const stride=pageHeight(scale)+PAGE_GAP;const page=Math.min(lastPage,Math.max(FIRST_PAGE,Math.floor(Math.max(0,scroll)/stride)+FIRST_PAGE));return{page,y:Math.min(CROP_BOTTOM,Math.max(CROP_TOP,CROP_TOP+(scroll-pageTop(page,scale))/scale))};}
export function jumpOffset(page,y,scale,lastPage){return pageTop(Math.min(lastPage,Math.max(FIRST_PAGE,page)),scale)+Math.max(0,Math.min(CROP_BOTTOM,y)-CROP_TOP)*scale;}
export function visiblePages(scroll,height,scale,lastPage){const first=readingPosition(scroll,scale,lastPage).page,last=readingPosition(scroll+height,scale,lastPage).page;return{first:Math.max(FIRST_PAGE,first-1),last:Math.min(lastPage,last+1)};}
export function sectionVisibility(toc,scroll,height,scale){const positions=toc.map((t,index)=>({index,top:pageTop(t.page,scale)+Math.max(0,t.y-CROP_TOP)*scale})).sort((a,b)=>a.top-b.top||a.index-b.index);const line=scroll+24,end=scroll+height;let active=-1;for(const p of positions){if(p.top<=line)active=p.index;else break;}const visible=positions.filter(p=>p.top>=line&&p.top<end).map(p=>p.index);if(active>=0)visible.unshift(active);return{active,visible};}
