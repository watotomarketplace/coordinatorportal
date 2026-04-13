const b=(n,i="export.csv")=>{if(!n||!n.length)return;const s=Object.keys(n[0]),l=[s.join(","),...n.map(c=>s.map(o=>{const d=c[o]===null||c[o]===void 0?"":c[o],t=String(d).replace(/"/g,'""');return t.includes(",")||t.includes('"')||t.includes(`
`)?`"${t}"`:t}).join(","))].join(`
`),r=new Blob([l],{type:"text/csv;charset=utf-8;"}),e=document.createElement("a"),u=URL.createObjectURL(r);e.setAttribute("href",u),e.setAttribute("download",i),e.style.visibility="hidden",document.body.appendChild(e),e.click(),document.body.removeChild(e)};export{b as e};
