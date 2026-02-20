import{j as e}from"./vendor-BzMkH_x1.js";function s(){return e.jsxs("div",{className:"settings-appearance",children:[e.jsx("h3",{className:"settings-section-title",children:"Notifications"}),e.jsx("p",{style:{fontSize:"13px",color:"var(--text-secondary)",marginBottom:"24px",opacity:.8},children:"Configure how and when you receive notifications"}),e.jsxs("div",{className:"settings-group",children:[e.jsxs("div",{className:"notif-setting-row",children:[e.jsxs("div",{children:[e.jsx("div",{className:"notif-setting-title",children:"High Risk Alerts"}),e.jsx("div",{className:"notif-setting-desc",children:"Get notified when students become inactive"})]}),e.jsxs("label",{className:"toggle-switch",children:[e.jsx("input",{type:"checkbox",defaultChecked:!0}),e.jsx("span",{className:"toggle-slider"})]})]}),e.jsxs("div",{className:"notif-setting-row",children:[e.jsxs("div",{children:[e.jsx("div",{className:"notif-setting-title",children:"System Updates"}),e.jsx("div",{className:"notif-setting-desc",children:"Dashboard updates and maintenance notices"})]}),e.jsxs("label",{className:"toggle-switch",children:[e.jsx("input",{type:"checkbox",defaultChecked:!0}),e.jsx("span",{className:"toggle-slider"})]})]}),e.jsxs("div",{className:"notif-setting-row",children:[e.jsxs("div",{children:[e.jsx("div",{className:"notif-setting-title",children:"Progress Milestones"}),e.jsx("div",{className:"notif-setting-desc",children:"When students reach completion milestones"})]}),e.jsxs("label",{className:"toggle-switch",children:[e.jsx("input",{type:"checkbox"}),e.jsx("span",{className:"toggle-slider"})]})]})]}),e.jsx("style",{children:`
                .notif-setting-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 16px 0; border-bottom: 1px solid var(--separator);
                }
                .notif-setting-title { font-weight: 500; font-size: 14px; margin-bottom: 2px; }
                .notif-setting-desc { font-size: 12px; color: var(--text-secondary); opacity: 0.8; }

                /* iOS Toggle Switch */
                .toggle-switch {
                    position: relative; width: 42px; height: 24px;
                }
                .toggle-switch input { opacity: 0; width: 0; height: 0; }
                .toggle-slider {
                    position: absolute; cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: rgba(128,128,128, 0.3);
                    border-radius: 24px; transition: .3s;
                }
                .toggle-slider:before {
                    position: absolute; content: "";
                    height: 20px; width: 20px;
                    left: 2px; bottom: 2px;
                    background-color: white;
                    border-radius: 50%; transition: .3s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                input:checked + .toggle-slider { background-color: var(--accent-color); }
                input:checked + .toggle-slider:before { transform: translateX(18px); }
            `})]})}export{s as default};
