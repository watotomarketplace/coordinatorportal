import fs from 'fs';

function run() {
    console.log('Injecting addon into dist/assets...');
    let code = fs.readFileSync('dist/assets/index-BosXJrON.js', 'utf8');
    const addon = fs.readFileSync('dist/assets/attendance-addon.js', 'utf8');

    if (code.includes('AttendanceAddon = ')) {
        console.log('Already injected.');
        return;
    }

    // Inject addon code right after imports
    const importEndStr = 'import{_ as ye,E as yt}from"./utils-Dj1PjNzy.js";';
    if (code.includes(importEndStr)) {
        code = code.replace(importEndStr, importEndStr + '\n' + addon + '\n');
    } else {
        code = code.replace('function Nr(){', addon + '\n\nfunction Nr(){');
    }

    // Inject /attendance route alongside /groups route
    const groupRoute = 'path:"/groups",element:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator"].includes(t.role)?e.jsx(Qt,{}):e.jsx(V,{to:"/dashboard"})';
    const attendanceRoute = 'path:"/attendance",element:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator"].includes(t.role)?e.jsx(window.__ATTENDANCE_ADDON__.AttendanceDashboard,{}):e.jsx(V,{to:"/dashboard"})';
    const targetRouteStr = `e.jsx(J,{${groupRoute}})`;
    const replaceRouteStr = `e.jsx(J,{${groupRoute}}),e.jsx(J,{${attendanceRoute}})`;
    if (code.includes(targetRouteStr)) {
        code = code.replace(targetRouteStr, replaceRouteStr);
    } else {
        console.warn('Could not find the Groups route to target for injection.');
    }

    // Inject Dock Icon
    const dockGroup = '{label:"Groups",path:"/groups",icon:"🏘️",role:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator"],color:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)"}';
    const dockAttendance = '{label:"Attendance",path:"/attendance",icon:"📅",role:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator"],color:"linear-gradient(135deg, #f6d365 0%, #fda085 100%)"}';
    if (code.includes(dockGroup)) code = code.replace(dockGroup, dockGroup + ',' + dockAttendance);

    // Inject Spotlight
    const spotGroup = '{name:"Formation Groups",path:"/groups",icon:"🏘️",description:"Group management"}';
    const spotAttendance = '{name:"Attendance",path:"/attendance",icon:"📅",description:"Session attendance & check-in"}';
    if (code.includes(spotGroup)) {
        code = code.replace(spotGroup, spotGroup + ',' + spotAttendance);
    } else {
        const spotGMin = '{name:"Formation Groups",path:"/groups",icon:"\\uD83C\\uDFD8\\uFE0F",description:"Group management"}';
        const spotAMin = '{name:"Attendance",path:"/attendance",icon:"\\uD83D\\uDCC5",description:"Session attendance & check-in"}';
        code = code.replace(spotGMin, spotGMin + ',' + spotAMin);
    }

    // Inject Launchpad
    const launchGroup = '{name:"Groups",path:"/groups",icon:"🏘️",color:"#f59e0b"}';
    const launchAttendance = '{name:"Attendance",path:"/attendance",icon:"📅",color:"#f6d365"}';
    if (code.includes(launchGroup)) {
        code = code.replace(launchGroup, launchGroup + ',' + launchAttendance);
    } else {
        const launchGMin = '{name:"Groups",path:"/groups",icon:"\\uD83C\\uDFD8\\uFE0F",color:"#f59e0b"}';
        const launchAMin = '{name:"Attendance",path:"/attendance",icon:"\\uD83D\\uDCC5",color:"#f6d365"}';
        code = code.replace(launchGMin, launchGMin + ',' + launchAMin);
    }

    // Inject Mission Control
    const mcGroup = '{name:"Formation Groups",path:"/groups",icon:"🏘️",desc:"Group management",color:"rgba(245,158,11,0.2)"}';
    const mcAttendance = '{name:"Attendance",path:"/attendance",icon:"📅",desc:"Session tracking",color:"rgba(246,211,101,0.2)"}';
    if (code.includes(mcGroup)) {
        code = code.replace(mcGroup, mcGroup + ',' + mcAttendance);
    } else {
        const mcGMin = '{name:"Formation Groups",path:"/groups",icon:"\\uD83C\\uDFD8\\uFE0F",desc:"Group management",color:"rgba(245,158,11,0.2)"}';
        const mcAMin = '{name:"Attendance",path:"/attendance",icon:"\\uD83D\\uDCC5",desc:"Session tracking",color:"rgba(246,211,101,0.2)"}';
        code = code.replace(mcGMin, mcGMin + ',' + mcAMin);
    }

    // --- Inject Attendance button into each group card ---
    // The button calls U(S.id) which is loadGroupDetail — same as clicking the card.
    // stopPropagation prevents the card's own onClick from also firing.
    // Structure: ...member_count_span]})  bottom_row_div]})  card_children]},S.id))
    // We insert the button before the card_children closing ], making it a sibling of bottom_row_div.
    const cardEndTarget = 'children:[S.member_count," member",S.member_count!==1?"s":""]})]})]},S.id))';
    const attendanceBtn = 'e.jsx("button",{onClick:function(ev){ev.stopPropagation();U(S.id)},style:{marginTop:8,padding:"7px 0",borderRadius:8,background:"rgba(74,158,255,0.15)",border:"1px solid rgba(74,158,255,0.35)",color:"#4A9EFF",fontSize:12,fontWeight:600,cursor:"pointer",width:"100%",letterSpacing:.3},children:"\\uD83D\\uDCC5 Attendance"})';
    const cardEndReplace = 'children:[S.member_count," member",S.member_count!==1?"s":""]})]}),'+attendanceBtn+']},S.id))';
    if (code.includes(cardEndTarget)) {
        code = code.replace(cardEndTarget, cardEndReplace);
        console.log('Injected Attendance button into group cards.');
    } else {
        console.warn('Could not find group card end pattern for Attendance button injection.');
    }

    // --- Inject GroupAttendance section into the group detail view ---
    // The detail view ends just before the groups-list return statement.
    // Variable names in the minified component (from Qt function):
    //   t = user, S = group, p = selectedGroup, o = groupDetail
    // We insert a wrapper div containing GroupAttendance as the last child of the detail container.
    //
    // Target anchor: end of the comments section, just before '}return e.jsxs("div",{className:"page-container"'
    // Bracket analysis: T.id||q)) closes map-item + map()
    //   }  = closes children prop of comments-list wrapper
    //   )  = closes comments-list e.jsx
    //   ]  = closes comments glass panel children  <-- these 3 close the comments panel
    //   }  = closes comments glass panel props
    //   )  = closes comments glass panel e.jsx     <-- insert new section AFTER here
    //   ]  = closes MAIN detail container children <-- this ] must come AFTER new section
    //   }  = closes main container props
    //   )  = closes main container e.jsxs
    //   }  = closes if(p&&o){} block
    const detailEndTarget = 'T.id||q))})]})]})}return e.jsxs("div",{className:"page-container"';
    const attendanceSection =
        'e.jsx("div",{style:{marginTop:20},children:' +
        'window.__ATTENDANCE_ADDON__&&window.__ATTENDANCE_ADDON__.GroupAttendance' +
        '?e.jsx(window.__ATTENDANCE_ADDON__.GroupAttendance,{groupId:S.id,groupName:S.group_code+" \\u2014 "+S.name,currentUser:t})' +
        ':null})';
    // Insert section after comments panel closes (first 14 chars of target), before ] that closes main children
    const detailEndReplace =
        'T.id||q))})]}),'+attendanceSection+']})' +
        '}return e.jsxs("div",{className:"page-container"';
    if (code.includes(detailEndTarget)) {
        code = code.replace(detailEndTarget, detailEndReplace);
        console.log('Injected GroupAttendance section into group detail view.');
    } else {
        console.warn('Could not find group detail end pattern for section injection.');
    }

    // --- Patch addMember (Xe) to send student name + email alongside student_id ---
    // The existing call: Xe=async S=>{...JSON.stringify({student_id:String(S)})...}
    // The click:        onClick:()=>Xe(T.id)
    // We change Xe to accept the full student object and send name+email to the backend.
    // Then change the click to pass the full T object instead of just T.id.
    const xeOldBody = 'JSON.stringify({student_id:String(S)})';
    const xeNewBody = 'JSON.stringify({student_id:String(S.id||S),student_name:S.first_name?(S.first_name+" "+S.last_name).trim():S.name||"",student_email:S.email||""})';
    if (code.includes(xeOldBody)) {
        code = code.replace(xeOldBody, xeNewBody);
        console.log('Patched addMember to send student name + email.');
    } else {
        console.warn('Could not find addMember body to patch.');
    }
    const xeOldClick = 'onClick:()=>Xe(T.id)';
    const xeNewClick = 'onClick:()=>Xe(T)';
    if (code.includes(xeOldClick)) {
        code = code.replace(xeOldClick, xeNewClick);
        console.log('Patched addMember click to pass full student object.');
    } else {
        console.warn('Could not find addMember onClick to patch.');
    }

    fs.writeFileSync('dist/assets/index-BosXJrON.js', code);
    console.log('Injection complete. Target file overridden successfully.');
}

run();
