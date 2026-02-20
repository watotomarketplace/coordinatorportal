import{j as a}from"./vendor-BzMkH_x1.js";import{a as i,W as r}from"./index-CBJe6dZD.js";import"./utils-Dj1PjNzy.js";function n(){const{wallpaper:e,setWallpaper:s}=i();return a.jsxs("div",{style:{padding:"28px"},children:[a.jsx("h3",{className:"settings-section-title",children:"Desktop Wallpaper"}),a.jsx("p",{style:{fontSize:"13px",color:"var(--text-secondary)",marginBottom:"24px",opacity:.8},children:"Choose a wallpaper for your dashboard background"}),a.jsx("div",{className:"wallpaper-grid",children:r.map(l=>a.jsxs("div",{className:`wallpaper-thumb ${e.id===l.id?"active":""}`,onClick:()=>s(l),children:[a.jsx("img",{src:l.thumbnail||l.path,alt:l.name,loading:"lazy",style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}}),a.jsxs("div",{className:"wallpaper-thumb-label",children:[a.jsx("span",{children:l.name}),e.id===l.id&&a.jsx("span",{className:"wallpaper-check",children:"✓"})]})]},l.id))}),a.jsx("style",{children:`
                .wallpaper-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 16px;
                }
            `})]})}export{n as default};
//# sourceMappingURL=WallpaperSettings-DbrKF5__.js.map
