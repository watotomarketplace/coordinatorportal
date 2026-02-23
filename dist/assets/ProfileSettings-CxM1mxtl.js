import{a as s,j as e}from"./vendor-BzMkH_x1.js";import{u as f,P as u}from"./index-BosXJrON.js";import"./utils-Dj1PjNzy.js";function v(){const{user:o}=f(),[r,t]=s.useState({name:"",profile_image:"",currentPassword:"",newPassword:""}),[l,n]=s.useState(!1),[d,i]=s.useState(""),[p,c]=s.useState("");s.useEffect(()=>{o&&t(a=>({...a,name:o.name,profile_image:o.profile_image||""}))},[o]);const g=async a=>{a.preventDefault(),i(""),c(""),n(!0);try{const x=await(await fetch("/api/auth/profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:r.name,profile_image:r.profile_image,password:r.newPassword||void 0})})).json();x.success?(c("Profile updated successfully!"),window.location.reload()):i(x.message||"Update failed")}catch{i("Connection error")}finally{n(!1)}};return e.jsxs("div",{style:{display:"flex",height:"100%"},children:[e.jsxs("div",{className:"settings-profile-sidebar",children:[e.jsx("div",{className:"settings-avatar",children:r.profile_image?e.jsx("img",{src:r.profile_image,alt:"Preview",style:{width:"100%",height:"100%",objectFit:"cover"}}):e.jsx("span",{style:{fontSize:"40px",color:"var(--text-secondary)",opacity:.5},children:"?"})}),e.jsxs("div",{style:{width:"100%"},children:[e.jsx("label",{className:"settings-label-sm",children:"Change Avatar"}),e.jsx(u,{selectedImage:r.profile_image,onSelect:a=>t({...r,profile_image:a})})]})]}),e.jsx("div",{style:{flex:1,padding:"28px"},children:e.jsxs("form",{onSubmit:g,style:{display:"flex",flexDirection:"column",gap:"18px",height:"100%"},children:[d&&e.jsx("div",{className:"error-message",children:d}),p&&e.jsx("div",{className:"status-badge completed",style:{display:"block",textAlign:"center"},children:p}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",children:"Full Name"}),e.jsx("input",{type:"text",className:"form-input",value:r.name,onChange:a=>t({...r,name:a.target.value}),required:!0})]}),e.jsx("div",{style:{borderTop:"1px solid var(--border-layer-1)",margin:"4px 0"}}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",children:"New Password (optional)"}),e.jsx("input",{type:"password",className:"form-input",placeholder:"Leave blank to keep current",value:r.newPassword,onChange:a=>t({...r,newPassword:a.target.value})})]}),e.jsx("div",{style:{display:"flex",gap:"12px",marginTop:"auto",paddingTop:"16px"},children:e.jsx("button",{type:"submit",className:"btn-primary",disabled:l,style:{flex:1},children:l?"Saving...":"Save Changes"})})]})}),e.jsx("style",{children:`
                .settings-profile-sidebar {
                    width: 260px;
                    background: var(--glass-layer-1);
                    border-right: 1px solid var(--border-layer-1);
                    padding: 32px 20px;
                    display: flex; flex-direction: column; align-items: center;
                }
                .settings-avatar {
                    width: 120px; height: 120px; border-radius: 50%;
                    background: var(--glass-layer-2); margin-bottom: 24px;
                    border: 4px solid var(--border-layer-2); overflow: hidden;
                    box-shadow: var(--shadow-layer-3);
                    display: flex; align-items: center; justify-content: center;
                }
                .settings-label-sm {
                   font-size: 13px; font-weight: 500; color: var(--text-secondary);
                   margin-bottom: 12px; display: block; text-align: center;
                }
                
                .form-group { display: flex; flex-direction: column; gap: 8px; }
                .form-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
                .form-input {
                    padding: 12px 16px; border-radius: 10px;
                    background: var(--glass-layer-1);
                    border: 1px solid var(--border-layer-2);
                    color: var(--text-primary); font-size: 14px; outline: none;
                    transition: all 0.2s;
                }
                .form-input:focus {
                    background: var(--glass-layer-2);
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(102,126,234,0.15);
                }
                .error-message {
                    padding: 10px; border-radius: 8px; background: rgba(255,59,48,0.1);
                    border: 1px solid rgba(255,59,48,0.2); color: #ff3b30; font-size: 13px;
                }
                .status-badge.completed {
                    padding: 10px; border-radius: 8px; background: rgba(52,199,89,0.1);
                    border: 1px solid rgba(52,199,89,0.2); color: #34c759; font-size: 13px;
                }
                .btn-primary {
                    padding: 10px 20px; border-radius: 10px; border: none;
                    background: var(--primary-gradient);
                    color: white; font-weight: 600; font-size: 13px; cursor: pointer;
                    box-shadow: var(--shadow-layer-2); transition: opacity 0.2s;
                }
                .btn-primary:active { opacity: 0.8; transform: scale(0.98); }
            `})]})}export{v as default};
//# sourceMappingURL=ProfileSettings-CxM1mxtl.js.map
