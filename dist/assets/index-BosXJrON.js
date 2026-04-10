const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ProfileSettings-Dlc5YvK_.js","assets/vendor-BzMkH_x1.js","assets/utils-Dj1PjNzy.js","assets/AppearanceSettings-25UFZheH.js","assets/WallpaperSettings-B8d8EVbH.js","assets/NotificationsSettings-Cgu5BcaD.js"])))=>i.map(i=>d[i]);
import{r as at,a,u as Q,j as e,b as fe,O as st,C as ot,c as nt,L as it,B as lt,p as dt,d as ct,e as pt,A as xt,P as gt,f as ht,g as Oe,D as ut,h as mt,R as bt,i as q,N as V,k as Ge,l as ft}from"./vendor-BzMkH_x1.js";import{_ as ye,E as yt}from"./utils-Dj1PjNzy.js";

window.require = function(n) {
  if (n === 'react') return a;
  if (n === 'react/jsx-runtime') return e;
  if (n === 'react-router-dom') return { useNavigate: Q };
  throw new Error('Module not found: ' + n);
};

var AttendanceAddon = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/components/index.jsx
  var React2 = __toESM(__require("react"), 1);
  var import_react_router_dom2 = __require("react-router-dom");

  // src/components/AttendanceDashboard.jsx
  var React = __toESM(__require("react"), 1);
  var import_react_router_dom = __require("react-router-dom");

  // src/components/GroupAttendance.jsx
  var import_react = __require("react");
  var import_jsx_runtime = __require("react/jsx-runtime");
  function InitialsAvatar({ name, size = 36 }) {
    const initials = name ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
    const hue = name ? [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360 : 200;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
      width: size,
      height: size,
      borderRadius: "50%",
      flexShrink: 0,
      background: `hsl(${hue},55%,45%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.38,
      fontWeight: 700,
      color: "#fff",
      letterSpacing: "-0.5px"
    }, children: initials });
  }
  function PctBadge({ pct }) {
    const [bg, border, color] = pct >= 80 ? ["rgba(0,184,148,0.15)", "rgba(0,184,148,0.35)", "#00b894"] : pct >= 60 ? ["rgba(253,203,110,0.15)", "rgba(253,203,110,0.35)", "#fdcb6e"] : ["rgba(255,118,117,0.15)", "rgba(255,118,117,0.35)", "#ff7675"];
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: {
      fontSize: 11,
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: 20,
      background: bg,
      border: `1px solid ${border}`,
      color
    }, children: [
      pct,
      "%"
    ] });
  }
  function GroupAttendance({ groupId, groupName, currentUser }) {
    const [members, setMembers] = (0, import_react.useState)([]);
    const [sessions, setSessions] = (0, import_react.useState)([]);
    const [summaries, setSummaries] = (0, import_react.useState)([]);
    const [loading, setLoading] = (0, import_react.useState)(true);
    const [showModal, setShowModal] = (0, import_react.useState)(false);
    const [saving, setSaving] = (0, import_react.useState)(false);
    const [toast, setToast] = (0, import_react.useState)(null);
    const [deleting, setDeleting] = (0, import_react.useState)(null);
    const [editingSession, setEditingSession] = (0, import_react.useState)(null);
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const [checkInDate, setCheckInDate] = (0, import_react.useState)(today);
    const [checkInWeek, setCheckInWeek] = (0, import_react.useState)(1);
    const [didNotMeet, setDidNotMeet] = (0, import_react.useState)(false);
    const [sessionNotes, setSessionNotes] = (0, import_react.useState)("");
    const [attendanceLog, setAttendanceLog] = (0, import_react.useState)({});
    const showToast = (msg, type = "success") => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3e3);
    };
    const fetchData = (0, import_react.useCallback)(async () => {
      if (!groupId) return;
      setLoading(true);
      try {
        const [mRes, sRes, sumRes] = await Promise.all([
          fetch(`/api/attendance/group/${groupId}/members`),
          fetch(`/api/attendance/group/${groupId}/sessions`),
          fetch(`/api/attendance/group/${groupId}/summary`)
        ]);
        const [mData, sData, sumData] = await Promise.all([mRes.json(), sRes.json(), sumRes.json()]);
        if (mData.success) setMembers(mData.members || []);
        if (sData.success) setSessions(sData.sessions || []);
        if (sumData.success) setSummaries(sumData.summaries || []);
      } catch (e) {
        console.error("GroupAttendance fetch error:", e);
      } finally {
        setLoading(false);
      }
    }, [groupId]);
    (0, import_react.useEffect)(() => {
      fetchData();
    }, [fetchData]);
    const openNewSession = () => {
      setEditingSession(null);
      setCheckInDate(today);
      setCheckInWeek(1);
      setDidNotMeet(false);
      setSessionNotes("");
      setShowModal(true);
    };
    const openEditSession = async (session) => {
      setEditingSession(session);
      setCheckInDate(session.session_date || today);
      setCheckInWeek(session.week_number || 1);
      setDidNotMeet(!!session.did_not_meet);
      setSessionNotes(session.notes || "");
      try {
        const res = await fetch(`/api/attendance/sessions/${session.id}`);
        const data = await res.json();
        if (data.success && data.attendance) {
          const log = {};
          members.forEach((m) => {
            const record = data.attendance.find((a) => a.group_member_id === m.id);
            log[m.id] = {
              attended: record ? !!record.attended : false,
              note: record?.note || "",
              noteOpen: !!record?.note
            };
          });
          setAttendanceLog(log);
        }
      } catch (e) {
        console.error("Failed to load session attendance:", e);
        const log = {};
        members.forEach((m) => {
          log[m.id] = { attended: false, note: "", noteOpen: false };
        });
        setAttendanceLog(log);
      }
      setShowModal(true);
    };
    (0, import_react.useEffect)(() => {
      if (!showModal || editingSession) return;
      const log = {};
      members.forEach((m) => {
        log[m.id] = { attended: false, note: "", noteOpen: false };
      });
      setAttendanceLog(log);
    }, [showModal, members, editingSession]);
    const toggleAttended = (id) => {
      setAttendanceLog((prev) => ({
        ...prev,
        [id]: { ...prev[id], attended: !prev[id].attended }
      }));
    };
    const setNote = (id, val) => {
      setAttendanceLog((prev) => ({ ...prev, [id]: { ...prev[id], note: val } }));
    };
    const toggleNoteOpen = (id) => {
      setAttendanceLog((prev) => ({ ...prev, [id]: { ...prev[id], noteOpen: !prev[id].noteOpen } }));
    };
    const attendedCount = Object.values(attendanceLog).filter((v) => v.attended).length;
    const handleSave = async () => {
      setSaving(true);
      try {
        let sessionId;
        if (editingSession) {
          const uRes = await fetch(`/api/attendance/sessions/${editingSession.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_date: checkInDate,
              week_number: checkInWeek,
              did_not_meet: didNotMeet,
              notes: sessionNotes || null
            })
          });
          const uData = await uRes.json();
          if (!uData.success) throw new Error(uData.message);
          sessionId = editingSession.id;
        } else {
          const sRes = await fetch(`/api/attendance/group/${groupId}/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_date: checkInDate,
              week_number: checkInWeek,
              did_not_meet: didNotMeet,
              notes: sessionNotes || null
            })
          });
          const sData = await sRes.json();
          if (!sData.success) throw new Error(sData.message);
          sessionId = sData.sessionId;
        }
        if (!didNotMeet) {
          const payload = members.map((m) => ({
            group_member_id: m.id,
            attended: !!attendanceLog[m.id]?.attended,
            note: attendanceLog[m.id]?.note || null
          }));
          const cRes = await fetch(`/api/attendance/sessions/${sessionId}/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ attendance: payload })
          });
          const cData = await cRes.json();
          if (!cData.success) throw new Error(cData.message);
        }
        setShowModal(false);
        setEditingSession(null);
        await fetchData();
        showToast(editingSession ? "Session updated" : "Session saved");
      } catch (e) {
        showToast(e.message || "Failed to save session", "error");
      } finally {
        setSaving(false);
      }
    };
    const handleDelete = async (sessionId) => {
      if (!confirm("Delete this session and all its attendance records?")) return;
      setDeleting(sessionId);
      try {
        const res = await fetch(`/api/attendance/sessions/${sessionId}`, { method: "DELETE" });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        await fetchData();
        showToast("Session deleted");
      } catch (e) {
        showToast(e.message || "Failed to delete session", "error");
      } finally {
        setDeleting(null);
      }
    };
    const panelStyle = {
      background: "var(--glass-bg)",
      backdropFilter: "blur(20px)",
      border: "1px solid var(--glass-border)",
      borderRadius: 12,
      overflow: "hidden",
      marginTop: 20
    };
    const panelHeaderStyle = {
      padding: "12px 16px",
      borderBottom: "1px solid var(--glass-border)",
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-primary)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    };
    const rowStyle = {
      padding: "10px 14px",
      borderBottom: "1px solid var(--glass-border)",
      display: "flex",
      alignItems: "center",
      gap: 10
    };
    const inputStyle = {
      width: "100%",
      padding: "9px 12px",
      borderRadius: 8,
      background: "rgba(255,255,255,0.07)",
      border: "1px solid var(--glass-border)",
      color: "var(--text-primary)",
      fontSize: 13,
      outline: "none",
      boxSizing: "border-box"
    };
    if (loading) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: panelStyle, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: panelHeaderStyle, children: "\u{1F4C5} Attendance" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 32, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }, children: "Loading attendance\u2026" })
      ] });
    }
    const summaryMap = {};
    summaries.forEach((s) => {
      summaryMap[s.memberId] = s;
    });
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      toast && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 99999,
        padding: "10px 18px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        background: toast.type === "error" ? "rgba(255,59,48,0.9)" : "rgba(0,184,148,0.9)",
        color: "#fff",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
      }, children: toast.msg }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: panelStyle, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: panelHeaderStyle, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u{1F4C5} Attendance" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: openNewSession,
              style: {
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer"
              },
              children: "+ Record Session"
            }
          )
        ] }),
        members.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 24, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }, children: "No members in this group yet. Add students above to start tracking attendance." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: members.map((m) => {
          const sum = summaryMap[m.id];
          const pct = sum?.percentage ?? 0;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: rowStyle, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InitialsAvatar, { name: m.student_name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 14, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: m.student_name }),
              sum && sum.totalSessions > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }, children: [
                sum.sessionsAttended,
                "/",
                sum.totalSessions,
                " sessions",
                sum.currentStreak > 1 && ` \xB7 \u{1F525} ${sum.currentStreak} streak`
              ] })
            ] }),
            sum && sum.totalSessions > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PctBadge, { pct })
          ] }, m.id);
        }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: panelStyle, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: panelHeaderStyle, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          "Sessions (",
          sessions.length,
          ")"
        ] }) }),
        sessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 24, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }, children: 'No sessions recorded yet. Use "Record Session" above to log the first one.' }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }, children: sessions.map((s) => {
          const dateStr = (/* @__PURE__ */ new Date(s.session_date + "T00:00:00")).toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric" });
          const isDeleting = deleting === s.id;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                padding: 14,
                borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--glass-border)",
                cursor: "pointer",
                transition: "background 0.15s",
                position: "relative"
              },
              onClick: () => openEditSession(s),
              onMouseEnter: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.07)",
              onMouseLeave: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }, children: dateStr }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                    s.did_not_meet ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "rgba(253,203,110,0.15)", color: "#fdcb6e", fontWeight: 600 }, children: "DNM" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 11, color: "var(--text-secondary)" }, children: [
                      "Wk ",
                      s.week_number || "\u2014"
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          handleDelete(s.id);
                        },
                        disabled: isDeleting,
                        title: "Delete session",
                        style: {
                          background: "none",
                          border: "none",
                          cursor: isDeleting ? "wait" : "pointer",
                          color: "rgba(255,118,117,0.6)",
                          fontSize: 14,
                          padding: "0 2px",
                          lineHeight: 1,
                          transition: "color 0.15s"
                        },
                        onMouseEnter: (e) => e.currentTarget.style.color = "#ff7675",
                        onMouseLeave: (e) => e.currentTarget.style.color = "rgba(255,118,117,0.6)",
                        children: "\u{1F5D1}"
                      }
                    )
                  ] })
                ] }),
                !s.did_not_meet && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: 12, color: "var(--text-secondary)" }, children: [
                  "\u{1F465} ",
                  s.attendance_count,
                  "/",
                  s.member_count,
                  " attended"
                ] }),
                s.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: 11, color: "var(--text-secondary)", marginTop: 6, fontStyle: "italic" }, children: [
                  s.notes.slice(0, 80),
                  s.notes.length > 80 ? "\u2026" : ""
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 10, color: "rgba(74,158,255,0.5)", marginTop: 6 }, children: "Tap to edit" })
              ]
            },
            s.id
          );
        }) })
      ] }),
      showModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 1e4,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center"
          },
          onClick: () => {
            setShowModal(false);
            setEditingSession(null);
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                width: "100%",
                maxWidth: 480,
                background: "var(--glass-layer-2, rgba(30,30,40,0.96))",
                backdropFilter: "blur(24px)",
                border: "1px solid var(--glass-border)",
                borderRadius: "20px 20px 0 0",
                padding: "20px 20px 32px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column"
              },
              onClick: (e) => e.stopPropagation(),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }, children: editingSession ? "Edit Session" : "Record Session" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }, children: groupName })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => {
                    setShowModal(false);
                    setEditingSession(null);
                  }, style: { background: "none", border: "none", color: "var(--text-secondary)", fontSize: 20, cursor: "pointer", lineHeight: 1 }, children: "\u2715" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10, marginBottom: 14 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }, children: "Date" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      "input",
                      {
                        type: "date",
                        value: checkInDate,
                        onChange: (e) => setCheckInDate(e.target.value),
                        style: inputStyle
                      }
                    )
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { width: 90 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }, children: "Week" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      "select",
                      {
                        value: checkInWeek,
                        onChange: (e) => setCheckInWeek(Number(e.target.value)),
                        style: inputStyle,
                        children: Array.from({ length: 13 }, (_, i) => i + 1).map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", { value: w, children: [
                          "Week ",
                          w
                        ] }, w))
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 14 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 4 }, children: "Session Notes (optional)" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "textarea",
                    {
                      value: sessionNotes,
                      onChange: (e) => setSessionNotes(e.target.value),
                      placeholder: "How did the session go?",
                      rows: 2,
                      style: {
                        ...inputStyle,
                        resize: "vertical",
                        minHeight: 48
                      }
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: didNotMeet ? "rgba(253,203,110,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${didNotMeet ? "rgba(253,203,110,0.3)" : "var(--glass-border)"}`,
                  cursor: "pointer"
                }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "input",
                    {
                      type: "checkbox",
                      checked: didNotMeet,
                      onChange: (e) => setDidNotMeet(e.target.checked),
                      style: { width: 16, height: 16, accentColor: "#fdcb6e", cursor: "pointer" }
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 13, color: didNotMeet ? "#fdcb6e" : "var(--text-secondary)", fontWeight: didNotMeet ? 600 : 400 }, children: "Group did not meet this week" })
                ] }),
                !didNotMeet && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, overflowY: "auto", marginBottom: 12 }, children: members.map((m) => {
                    const log = attendanceLog[m.id] || { attended: false, note: "", noteOpen: false };
                    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 4 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "div",
                        {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            minHeight: 44,
                            padding: "6px 8px",
                            borderRadius: 8,
                            background: log.attended ? "rgba(74,158,255,0.08)" : "transparent",
                            cursor: "pointer"
                          },
                          onClick: () => toggleAttended(m.id),
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              flexShrink: 0,
                              border: log.attended ? "none" : "2px solid rgba(255,255,255,0.3)",
                              background: log.attended ? "#4A9EFF" : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.15s"
                            }, children: log.attended && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: "13", height: "10", viewBox: "0 0 13 10", fill: "none", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M1 5l3.5 3.5L12 1", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) }),
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InitialsAvatar, { name: m.student_name, size: 30 }),
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1, fontSize: 14, color: "var(--text-primary)", fontWeight: log.attended ? 600 : 400 }, children: m.student_name }),
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                              "button",
                              {
                                onClick: (e) => {
                                  e.stopPropagation();
                                  toggleNoteOpen(m.id);
                                },
                                style: {
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: 11,
                                  color: log.noteOpen || log.note ? "#4A9EFF" : "var(--text-secondary)",
                                  padding: "4px 6px",
                                  borderRadius: 4
                                },
                                children: log.note ? "\u{1F4DD}" : "Note"
                              }
                            )
                          ]
                        }
                      ),
                      log.noteOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "input",
                        {
                          autoFocus: true,
                          placeholder: "Add a note\u2026",
                          value: log.note,
                          onChange: (e) => setNote(m.id, e.target.value),
                          onClick: (e) => e.stopPropagation(),
                          style: {
                            width: "100%",
                            margin: "2px 0 4px",
                            padding: "7px 12px",
                            borderRadius: 6,
                            fontSize: 12,
                            background: "rgba(255,255,255,0.07)",
                            border: "1px solid rgba(74,158,255,0.4)",
                            color: "var(--text-primary)",
                            outline: "none",
                            boxSizing: "border-box"
                          }
                        }
                      )
                    ] }, m.id);
                  }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, textAlign: "center" }, children: [
                    "Attended: ",
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { style: { color: "var(--text-primary)" }, children: attendedCount }),
                    " / ",
                    members.length
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    disabled: saving,
                    onClick: handleSave,
                    style: {
                      width: "100%",
                      padding: "13px",
                      borderRadius: 10,
                      border: "none",
                      background: saving ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: saving ? "var(--text-secondary)" : "#fff",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: saving ? "not-allowed" : "pointer"
                    },
                    children: saving ? "Saving\u2026" : editingSession ? "Update Session" : "Save Session"
                  }
                )
              ]
            }
          )
        }
      )
    ] });
  }

  // src/components/AttendanceDashboard.jsx
  var import_jsx_runtime2 = __require("react/jsx-runtime");
  var glass = { background: "var(--glass-bg)", backdropFilter: "blur(20px)", border: "1px solid var(--glass-border)", borderRadius: 16 };
  function StatCard({ icon, label, value, sub, color }) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { ...glass, padding: "20px 24px", flex: 1, minWidth: 140 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 26, marginBottom: 8 }, children: icon }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 28, fontWeight: 700, color: color || "var(--text-primary)" }, children: value ?? "\u2014" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 13, color: "var(--text-primary)", fontWeight: 600, marginTop: 2 }, children: label }),
      sub && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }, children: sub })
    ] });
  }
  function AttBadge({ pct }) {
    if (pct === null || pct === void 0) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 12, color: "rgba(255,255,255,0.3)" }, children: "No data" });
    const color = pct >= 80 ? "#34d399" : pct >= 60 ? "#fbbf24" : "#f87171";
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden", minWidth: 60 }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s" } }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { fontSize: 13, fontWeight: 700, color, minWidth: 36, textAlign: "right" }, children: [
        pct,
        "%"
      ] })
    ] });
  }
  function AttBar({ pct }) {
    if (pct === null || pct === void 0) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 11, color: "rgba(255,255,255,0.3)" }, children: "No data" });
    }
    const color = pct >= 80 ? "#34d399" : pct >= 60 ? "#fbbf24" : "#f87171";
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { width: `${pct}%`, height: "100%", background: color, borderRadius: 3 } }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { fontSize: 11, fontWeight: 700, color, minWidth: 30, textAlign: "right" }, children: [
        pct,
        "%"
      ] })
    ] });
  }
  function DashboardWidget() {
    const navigate = (0, import_react_router_dom.useNavigate)();
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
      fetch("/api/attendance/dashboard").then((r) => r.json()).then((json) => {
        if (json.success) setData(json);
      }).catch(() => {
      }).finally(() => setLoading(false));
    }, []);
    if (loading) return null;
    const summary = data?.summary || { totalSessions: 0, groupsWithSessions: 0, overallPct: null, totalGroups: 0 };
    const topGroups = (data?.groups || []).filter((g) => Number(g.total_sessions) > 0).slice(0, 6);
    const hasSessions = summary.totalSessions > 0;
    const sectionStyle = { marginTop: 24 };
    const headerStyle = {
      fontSize: 17,
      fontWeight: 700,
      color: "var(--text-primary)",
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 8
    };
    const iconStyle = {
      width: 28,
      height: 28,
      borderRadius: 8,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
      fontSize: 14
    };
    const cardBase = {
      background: "var(--glass-layer-2)",
      backdropFilter: "var(--blur-layer-2)",
      border: "var(--border-layer-2)",
      borderRadius: 16
    };
    const pillColor = summary.overallPct >= 80 ? "#34d399" : summary.overallPct >= 60 ? "#fbbf24" : "#f87171";
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: sectionStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h2", { style: headerStyle, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: iconStyle, children: "\u{1F4C5}" }),
        "Attendance Layer"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { ...cardBase, padding: "14px 16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }, children: "Sessions" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }, children: summary.totalSessions }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }, children: "recorded total" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { ...cardBase, padding: "14px 16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }, children: "Groups" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }, children: [
            summary.groupsWithSessions,
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.35)" }, children: [
              "/ ",
              summary.totalGroups
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }, children: "tracking sessions" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { ...cardBase, padding: "14px 16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }, children: "Avg Attendance" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 24, fontWeight: 700, color: summary.overallPct !== null ? pillColor : "var(--text-primary)" }, children: summary.overallPct !== null ? `${summary.overallPct}%` : "\u2014" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }, children: "across all sessions" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { ...cardBase, overflow: "hidden" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: {
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }, children: hasSessions ? "Top Groups by Sessions" : "No Sessions Yet" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              onClick: () => navigate("/attendance"),
              style: {
                background: "none",
                border: "none",
                color: "#4A9EFF",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0
              },
              children: "View All \u2192"
            }
          )
        ] }),
        hasSessions ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { padding: "8px 0" }, children: topGroups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "div",
          {
            onClick: () => navigate("/attendance"),
            style: {
              padding: "8px 16px",
              display: "grid",
              gridTemplateColumns: "80px 1fr 60px",
              alignItems: "center",
              gap: 12,
              cursor: "pointer"
            },
            onMouseEnter: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)",
            onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }, children: g.group_code }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(AttBar, { pct: g.avg_pct }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "right" }, children: [
                g.total_sessions,
                " sess"
              ] })
            ]
          },
          g.id
        )) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { padding: "32px 24px", textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 32, marginBottom: 10 }, children: "\u{1F4CB}" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }, children: "Start tracking attendance" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 }, children: "Open a Formation Group and record your first session to see attendance data here" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              onClick: () => navigate("/attendance"),
              style: {
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              },
              children: "Go to Attendance"
            }
          )
        ] })
      ] })
    ] });
  }
  function AttendanceDashboard() {
    const [user, setUser] = React.useState(null);
    const [summary, setSummary] = React.useState(null);
    const [groups, setGroups] = React.useState([]);
    const [selectedGroupId, setSelectedGroupId] = React.useState(null);
    const [selectedGroupName, setSelectedGroupName] = React.useState("");
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [campusFilter, setCampusFilter] = React.useState("");
    React.useEffect(() => {
      async function init() {
        try {
          const sessionRes = await fetch("/api/auth/session");
          const sessionData = await sessionRes.json();
          if (!sessionData.user) {
            setError("Not authenticated");
            return;
          }
          setUser(sessionData.user);
        } catch (err) {
          setError("Not authenticated");
          return;
        } finally {
        }
        try {
          const dashRes = await fetch("/api/attendance/dashboard");
          const dashData = await dashRes.json();
          if (dashData.success) {
            setSummary(dashData.summary);
            setGroups(dashData.groups || []);
          } else {
            setSummary({ totalSessions: 0, groupsWithSessions: 0, overallPct: null, totalGroups: 0 });
          }
        } catch (err) {
          console.error("AttendanceDashboard dashboard fetch error:", err);
          setSummary({ totalSessions: 0, groupsWithSessions: 0, overallPct: null, totalGroups: 0 });
        } finally {
          setLoading(false);
        }
      }
      init();
    }, []);
    const campuses = React.useMemo(() => [...new Set(groups.map((g) => g.celebration_point).filter(Boolean))].sort(), [groups]);
    const filteredGroups = campusFilter ? groups.filter((g) => g.celebration_point === campusFilter) : groups;
    if (loading) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "tahoe-page", style: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { width: 32, height: 32, borderRadius: "50%", border: "2px solid #4A9EFF", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" } }) });
    }
    if (error) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "tahoe-page", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { padding: "16px 20px", borderRadius: 12, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }, children: error }) });
    }
    if (selectedGroupId) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tahoe-page", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => {
          setSelectedGroupId(null);
          setSelectedGroupName("");
        }, style: { display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#4A9EFF", cursor: "pointer", fontSize: 14, marginBottom: 20, padding: 0 }, children: "\u2190 Back to Overview" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(GroupAttendance, { groupId: selectedGroupId, groupName: selectedGroupName, currentUser: user || {} }, selectedGroupId)
      ] });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tahoe-page", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { marginBottom: 24 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { style: { margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }, children: "\u{1F4C5} Attendance Overview" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { margin: "4px 0 0", color: "rgba(255,255,255,0.45)", fontSize: 13 }, children: "Session attendance across all formation groups" })
      ] }),
      summary && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(StatCard, { icon: "\u{1F4CB}", label: "Total Sessions", value: summary.totalSessions, sub: "across all groups" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(StatCard, { icon: "\u{1F3D8}\uFE0F", label: "Groups Tracked", value: `${summary.groupsWithSessions} / ${summary.totalGroups}`, sub: "have recorded sessions" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          StatCard,
          {
            icon: "\u2705",
            label: "Overall Attendance",
            value: summary.overallPct !== null ? `${summary.overallPct}%` : "\u2014",
            sub: "average across sessions",
            color: summary.overallPct >= 80 ? "#34d399" : summary.overallPct >= 60 ? "#fbbf24" : summary.overallPct !== null ? "#f87171" : void 0
          }
        )
      ] }),
      campuses.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => setCampusFilter(""), style: { padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.15)", background: !campusFilter ? "#4A9EFF" : "rgba(255,255,255,0.06)", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 600 }, children: "All" }),
        campuses.map((c) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => setCampusFilter(c), style: { padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.15)", background: campusFilter === c ? "#4A9EFF" : "rgba(255,255,255,0.06)", color: "white", cursor: "pointer", fontSize: 12 }, children: c }, c))
      ] }),
      filteredGroups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { ...glass, padding: 48, textAlign: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 40, marginBottom: 12 }, children: "\u{1F4C5}" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { color: "rgba(255,255,255,0.5)", fontSize: 15, marginBottom: 6 }, children: "No sessions recorded yet" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { color: "rgba(255,255,255,0.3)", fontSize: 13 }, children: "Open a Formation Group and use the Attendance section to record your first session" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }, children: filteredGroups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        "div",
        {
          onClick: () => {
            setSelectedGroupId(g.id);
            setSelectedGroupName(`${g.group_code} \u2014 ${g.name}`);
          },
          style: { ...glass, padding: "16px 18px", cursor: "pointer", transition: "border-color 0.2s", borderColor: "rgba(255,255,255,0.12)" },
          onMouseEnter: (e) => e.currentTarget.style.borderColor = "#4A9EFF",
          onMouseLeave: (e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }, children: g.group_code }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }, children: g.celebration_point })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { textAlign: "right" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { fontSize: 12, color: "rgba(255,255,255,0.45)" }, children: [
                  g.total_sessions,
                  " session",
                  g.total_sessions !== 1 ? "s" : ""
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { fontSize: 12, color: "rgba(255,255,255,0.35)" }, children: [
                  g.member_count,
                  " member",
                  g.member_count !== 1 ? "s" : ""
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(AttBadge, { pct: g.avg_pct })
          ]
        },
        g.id
      )) })
    ] });
  }

  // src/components/index.jsx
  window.__ATTENDANCE_ADDON__ = {
    AttendanceDashboard,
    GroupAttendance,
    DashboardWidget
  };
})();

(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const d of document.querySelectorAll('link[rel="modulepreload"]'))g(d);new MutationObserver(d=>{for(const u of d)if(u.type==="childList")for(const c of u.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&g(c)}).observe(document,{childList:!0,subtree:!0});function s(d){const u={};return d.integrity&&(u.integrity=d.integrity),d.referrerPolicy&&(u.referrerPolicy=d.referrerPolicy),d.crossOrigin==="use-credentials"?u.credentials="include":d.crossOrigin==="anonymous"?u.credentials="omit":u.credentials="same-origin",u}function g(d){if(d.ep)return;d.ep=!0;const u=s(d);fetch(d.href,u)}})();var Te={},Fe=at;Te.createRoot=Fe.createRoot,Te.hydrateRoot=Fe.hydrateRoot;const Ue=a.createContext(null),U=()=>a.useContext(Ue);function vt({children:t}){const[r,s]=a.useState(null),[g,d]=a.useState(!0),[u,c]=a.useState([]),o=Q();a.useEffect(()=>{n()},[]);const n=async()=>{try{const m=await fetch("/api/auth/session");if(m.ok){const x=await m.json();x.user&&(fetch("/api/data/students").catch(i=>{}),s(x.user))}}catch(m){console.error("Session check failed:",m)}finally{d(!1)}},h=async(m,x)=>{try{const y=await(await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:m,password:x})})).json();return y.success?(fetch("/api/data/students").catch(f=>{}),s(y.user),p("Welcome, "+y.user.name+"!","success"),{success:!0,user:y.user}):{success:!1,message:y.message||"Login failed"}}catch{return{success:!1,message:"Connection error. Please try again."}}},l=async()=>{try{await fetch("/api/auth/logout",{method:"POST"})}catch(m){console.error("Logout error:",m)}s(null),p("Signed out successfully","info"),o("/login")},p=(m,x="info")=>{const i=Date.now();c(y=>[...y,{id:i,message:m,type:x}]),setTimeout(()=>{c(y=>y.filter(f=>f.id!==i))},4e3)};return e.jsx(Ue.Provider,{value:{user:r,login:h,logout:l,showToast:p,loading:g,toasts:u},children:t})}function jt(){const{login:t}=U(),[r,s]=a.useState(""),[g,d]=a.useState(""),[u,c]=a.useState(""),[o,n]=a.useState(!1),[h,l]=a.useState(new Date),[p,m]=a.useState(null),[x,i]=a.useState(!1);a.useEffect(()=>{const N=setInterval(()=>l(new Date),1e3),v=localStorage.getItem("last_user");if(v)try{const k=JSON.parse(v);m(k),s(k.username||""),i(!0)}catch(k){console.error("Failed to parse saved user",k)}else i(!0);return()=>clearInterval(N)},[]);const y=async N=>{N.preventDefault(),c(""),n(!0);const v=await t(r,g);v.success?v.user&&(fetch("/api/data/students").catch(console.error),localStorage.setItem("last_user",JSON.stringify({username:v.user.username,name:v.user.name,profile_image:v.user.profile_image}))):(c(v.message),n(!1))},f=N=>N.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!1}),z=N=>N.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});return e.jsxs("div",{className:"tahoe-login-container",children:[e.jsxs("div",{className:"tahoe-clock-container",children:[e.jsx("div",{className:"tahoe-clock",children:f(h)}),e.jsx("div",{className:"tahoe-date",children:z(h)})]}),e.jsxs("div",{className:"tahoe-auth-container",children:[e.jsx("div",{className:"login-avatar-large",children:p&&p.profile_image?e.jsx("img",{src:p.profile_image,alt:"Avatar"}):e.jsxs("svg",{width:"60",height:"60",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",style:{opacity:.8},children:[e.jsx("path",{d:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"12",cy:"7",r:"4"})]})}),e.jsx("div",{className:"tahoe-username",children:p?p.name||p.username:r||"Other User"}),u&&e.jsx("div",{style:{color:"#fca5a5",fontSize:"13px",marginBottom:"12px",textShadow:"0 1px 2px rgba(0,0,0,0.5)"},children:u}),e.jsxs("form",{onSubmit:y,style:{width:"100%"},children:[!p&&e.jsx("div",{className:"tahoe-password-pill",style:{marginBottom:"10px"},children:e.jsx("input",{type:"text",className:"tahoe-input-transparent",placeholder:"Username",value:r,onChange:N=>s(N.target.value),required:!0,autoFocus:!p})}),e.jsxs("div",{className:"tahoe-password-pill",children:[e.jsx("input",{type:"password",className:"tahoe-input-transparent",placeholder:"Enter Password",value:g,onChange:N=>d(N.target.value),required:!0,autoFocus:!!p,autoComplete:"current-password"}),e.jsx("button",{type:"submit",className:"tahoe-submit-btn",disabled:o,children:o?e.jsx("div",{className:"spinner",style:{width:"16px",height:"16px",borderWidth:"2px"}}):e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),e.jsx("polyline",{points:"12 5 19 12 12 19"})]})})]})]}),e.jsxs("div",{style:{marginTop:"40px",display:"flex",flexDirection:"column",alignItems:"center",gap:"8px"},children:[e.jsx("div",{style:{fontSize:"12px",color:"rgba(255,255,255,0.4)",fontWeight:500},children:"Enter Password"}),p&&e.jsx("button",{className:"tahoe-secondary-action",onClick:()=>{m(null),s(""),d("")},children:"Switch User"})]})]}),e.jsx("div",{style:{position:"absolute",bottom:"20px",fontSize:"11px",color:"rgba(255,255,255,0.3)"},children:"Watoto Church © 2026"})]})}const Ee=a.lazy(()=>ye(()=>import("./ProfileSettings-Dlc5YvK_.js"),__vite__mapDeps([0,1,2]))),kt=a.lazy(()=>ye(()=>import("./AppearanceSettings-25UFZheH.js"),__vite__mapDeps([3,1,2]))),wt=a.lazy(()=>ye(()=>import("./WallpaperSettings-B8d8EVbH.js"),__vite__mapDeps([4,1,2]))),St=a.lazy(()=>ye(()=>import("./NotificationsSettings-Cgu5BcaD.js"),__vite__mapDeps([5,1])));function Nt({isOpen:t,onClose:r}){var h;const[s,g]=a.useState("profile"),[d,u]=a.useState("");if(a.useEffect(()=>{t||u("")},[t]),a.useEffect(()=>{const l=p=>{var m;(m=p.detail)!=null&&m.tab&&g(p.detail.tab)};return window.addEventListener("open-settings",l),()=>window.removeEventListener("open-settings",l)},[]),!t)return null;const c=[{id:"profile",label:"Profile",icon:"👤",component:Ee},{id:"appearance",label:"Appearance",icon:"🎨",component:kt},{id:"wallpaper",label:"Wallpaper",icon:"🖼️",component:wt},{id:"notifications",label:"Notifications",icon:"🔔",component:St}],o=c.filter(l=>l.label.toLowerCase().includes(d.toLowerCase())),n=((h=c.find(l=>l.id===s))==null?void 0:h.component)||Ee;return e.jsxs("div",{className:"modal-overlay",onClick:r,style:{backdropFilter:"blur(24px)"},children:[e.jsxs("div",{className:"settings-modal-window",onClick:l=>l.stopPropagation(),children:[e.jsx("div",{className:"settings-titlebar",children:e.jsxs("div",{style:{display:"flex",gap:"8px"},children:[e.jsx("div",{className:"traffic-btn red",onClick:r}),e.jsx("div",{className:"traffic-btn yellow"}),e.jsx("div",{className:"traffic-btn green"})]})}),e.jsxs("div",{style:{display:"flex",height:"100%",overflow:"hidden"},children:[e.jsxs("div",{className:"settings-sidebar",children:[e.jsxs("div",{className:"sidebar-search-wrapper",children:[e.jsx("span",{className:"search-icon",children:"🔍"}),e.jsx("input",{type:"text",placeholder:"Search",className:"sidebar-search-input",value:d,onChange:l=>u(l.target.value)})]}),e.jsxs("div",{className:"sidebar-scroll-area",children:[o.map(l=>e.jsxs("button",{onClick:()=>g(l.id),className:`settings-sidebar-btn ${s===l.id?"active":""}`,children:[e.jsx("span",{className:"settings-sidebar-icon",children:l.icon}),l.label]},l.id)),o.length===0&&e.jsx("div",{className:"no-results",children:"No results"})]})]}),e.jsx("div",{className:"settings-content",children:e.jsx(a.Suspense,{fallback:e.jsx("div",{className:"settings-loading",children:"Loading..."}),children:e.jsx(n,{})})})]})]}),e.jsx("style",{children:`
                .settings-modal-window {
                    width: 900px; max-width: 95vw;
                    height: 600px;
                    /* Base Liquid Glass */
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(var(--lg-regular-blur));
                    -webkit-backdrop-filter: blur(var(--lg-regular-blur));
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: var(--lg-radius-lg);
                    box-shadow: var(--lg-shadow-modal);
                    display: flex; flex-direction: column;
                    overflow: hidden;
                    animation: settingsSlideUp 0.3s var(--ease-out-expo);
                    will-change: transform, opacity;
                    position: relative;
                }
                
                /* Noise Texture */
                .settings-modal-window::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: var(--noise-texture);
                    opacity: 0.5;
                    mix-blend-mode: overlay;
                    pointer-events: none;
                    z-index: 0;
                }

                /* Inner Glow/Rim */
                .settings-modal-window::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 12px;
                    padding: 1px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 40%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    pointer-events: none;
                }

                .settings-titlebar {
                    height: 52px;
                    background: transparent; /* Unified with Sidebar */
                    padding: 0 20px;
                    display: flex; align-items: center;
                    flex-shrink: 0;
                    -webkit-app-region: drag;
                    /* No border bottom for unified look, or very subtle */
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    z-index: 2;
                }

                .traffic-btn {
                    width: 12px; height: 12px; border-radius: 50%;
                    cursor: pointer; transition: opacity 0.15s;
                    box-shadow: inset 0 0 0 0.5px rgba(0,0,0,0.1);
                }
                .traffic-btn:hover { opacity: 0.8; }
                .traffic-btn.red { background: #ff5f57; }
                .traffic-btn.yellow { background: #febc2e; }
                .traffic-btn.green { background: #28c840; }

                .settings-sidebar {
                    width: 250px;
                    /* Thin Glass Sidebar */
                    background: rgba(255,255,255,0.05); /* Subtle addition to window glass */
                    backdrop-filter: blur(10px); /* Stacked blur */
                    padding: 0 16px 16px 16px;
                    display: flex; flex-direction: column; gap: 10px;
                    flex-shrink: 0;
                    border-right: 1px solid rgba(255,255,255,0.1);
                    z-index: 2;
                }

                .sidebar-search-wrapper {
                   position: relative;
                   margin-bottom: 8px;
                   margin-top: 16px;
                }
                .sidebar-search-input {
                    width: 100%;
                    padding: 8px 10px 8px 32px;
                    border-radius: var(--radius-input);
                    border: var(--border-layer-2);
                    background: var(--glass-layer-2);
                    font-size: 13px;
                    outline: none;
                    color: var(--text-primary);
                    transition: all 0.2s;
                }
                .sidebar-search-input:focus {
                    background: var(--glass-layer-3);
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px rgba(102,126,234,0.15);
                }

                .search-icon {
                    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
                    font-size: 12px; opacity: 0.5; color: var(--text-secondary);
                }

                .settings-sidebar-btn {
                    display: flex; align-items: center; gap: 10px;
                    padding: 8px 12px; border-radius: var(--radius-button); border: none;
                    background: transparent;
                    color: var(--text-primary);
                    cursor: pointer; font-size: 13px; font-weight: 500;
                    text-align: left; width: 100%;
                    transition: all 0.1s;
                }
                .settings-sidebar-btn:hover {
                    background: var(--glass-layer-2);
                }

                .settings-sidebar-btn.active {
                    background: var(--primary-gradient);
                    color: white;
                    box-shadow: var(--shadow-layer-2);
                }
                
                .settings-sidebar-icon { font-size: 16px; }

                .settings-content {
                    flex: 1; overflow-y: auto; overflow-x: hidden;
                    background: var(--glass-layer-2); /* Distinct Content Pane */
                    border-left: 1px solid rgba(255,255,255,0.1); /* Separator */
                    position: relative;
                    z-index: 2;
                }

                .settings-loading {
                    display: flex; align-items: center; justify-content: center;
                    height: 100%; color: var(--text-secondary);
                }
                
                .no-results {
                    padding: 20px; text-align: center; font-size: 13px; color: var(--text-secondary); opacity: 0.7;
                }

                @keyframes settingsSlideUp {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `})]})}const He=a.createContext();function re(){return a.useContext(He)}function Ct({children:t}){const[r,s]=a.useState(!1),[g,d]=a.useState(()=>localStorage.getItem("themePreference")||"dark"),[u,c]=a.useState(()=>localStorage.getItem("focusMode")||"default"),o=a.useCallback(i=>{if(i==="auto"){const y=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",y?"dark":"light")}else document.documentElement.setAttribute("data-theme",i)},[]),n=a.useCallback(i=>{d(i),localStorage.setItem("themePreference",i),o(i)},[o]),h=a.useCallback(i=>{c(i),localStorage.setItem("focusMode",i)},[]);a.useEffect(()=>{o(g)},[g,o]),a.useEffect(()=>{if(g!=="auto")return;const i=window.matchMedia("(prefers-color-scheme: dark)"),y=f=>{document.documentElement.setAttribute("data-theme",f.matches?"dark":"light")};return i.addEventListener("change",y),()=>i.removeEventListener("change",y)},[g]);const l=()=>s(!0),p=()=>s(!1),x={isSettingsOpen:r,openSettings:l,closeSettings:p,toggleSettings:()=>s(i=>!i),themePreference:g,changeTheme:n,focusMode:u,changeFocusMode:h};return e.jsxs(He.Provider,{value:x,children:[t,e.jsx(Nt,{isOpen:r,onClose:p})]})}function zt({onAppClick:t}){const{user:r}=U(),{openSettings:s}=re(),g=Q(),d=fe(),u=[{label:"Dashboard",path:"/dashboard",icon:"🏠",color:"linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)"},{label:"Students",path:"/students",icon:"🎓",role:["Admin","LeadershipTeam","Pastor","Coordinator","TechSupport"],color:"linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)"},{label:"Users",path:"/admin",icon:"👥",role:["Admin","TechSupport"],color:"linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"},{label:"Analytics",path:"/reports",icon:"📊",role:["Admin","LeadershipTeam","Pastor"],color:"linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)"},{label:"Audit",path:"/audit",icon:"🛡️",role:["Admin","LeadershipTeam"],color:"linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)"},{label:"Batch Tool",path:"/import",icon:"📦",role:["Admin","Coordinator"],color:"linear-gradient(135deg, #FF0099 0%, #493240 100%)"},{label:"Groups",path:"/groups",icon:"🏘️",role:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator"],color:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)"},{label:"Attendance",path:"/attendance",icon:"📅",role:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator"],color:"linear-gradient(135deg, #f6d365 0%, #fda085 100%)"},{label:"Weekly Reports",path:"/weekly-reports",icon:"📝",role:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator","TechSupport"],color:"linear-gradient(135deg, #00b09b 0%, #96c93d 100%)"},{label:"Checkpoints",path:"/checkpoints",icon:"🎯",role:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator","TechSupport"],color:"linear-gradient(135deg, #e17055 0%, #d63031 100%)"},{label:"Tech Support",path:"/tech-support",icon:"🔧",role:["Admin","TechSupport"],color:"linear-gradient(135deg, #0984e3 0%, #6c5ce7 100%)"},{label:"Exports",path:"/exports",icon:"📥",role:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator","TechSupport"],color:"linear-gradient(135deg, #fd79a8 0%, #e84393 100%)"},{label:"Settings",path:"/settings",icon:"⚙️",role:["Admin"],color:"linear-gradient(135deg, #636e72 0%, #2d3436 100%)"}],c=o=>{g(o),t&&t()};return e.jsx("div",{className:"dock-container",children:e.jsxs("div",{className:"dock",children:[u.map((o,n)=>{if(o.role&&!o.role.includes(r==null?void 0:r.role))return null;const h=d.pathname===o.path;return e.jsxs("div",{className:`dock-icon ${h?"active":""}`,onClick:()=>c(o.path),children:[e.jsx("div",{className:"app-icon",style:{background:o.color},children:o.icon}),h&&e.jsx("div",{className:"active-dot"}),e.jsx("div",{className:"tooltip",children:o.label})]},n)}),e.jsx("div",{className:"dock-separator"}),e.jsxs("div",{className:"dock-icon",onClick:s,children:[e.jsx("div",{className:"app-icon settings",children:"⚙️"}),e.jsx("div",{className:"active-dot",style:{opacity:0}})," ",e.jsx("div",{className:"tooltip",children:"System Preferences"})]}),e.jsx("style",{children:`
                .dock-container {
                    position: fixed;
                    bottom: 20px;
                    left: 0;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    z-index: 9999;
                    pointer-events: none; /* Let clicks pass through outside dock */
                }

                .dock-glass {
                    /* Handled by .dock class in index.css */
                    height: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                [data-theme="dark"] .dock-glass {
                    /* Sub-elements override if needed */
                }

                .dock-icon {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
                }

                .dock-icon:hover {
                    transform: translateY(-8px) scale(1.15);
                }

                /* App Icon Style */
                .app-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: white;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                    position: relative;
                    overflow: hidden;
                }
                
                .app-icon.settings {
                    background: linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%);
                    color: #333;
                }

                /* Active Indicator */
                .active-dot {
                    width: 4px;
                    height: 4px;
                    background: rgba(255,255,255,0.8);
                    border-radius: 50%;
                    margin-top: 4px;
                    position: absolute;
                    bottom: -6px;
                }
                [data-theme="dark"] .active-dot { background: rgba(255,255,255,0.6); }

                /* Separator */
                .dock-separator {
                    width: 1px;
                    height: 32px;
                    background: rgba(255,255,255,0.2);
                    margin: 0 4px;
                }

                /* Tooltip (Apple HIG: Glass Layer 4) */
                .tooltip {
                    position: absolute;
                    top: -40px;
                    background: rgba(255,255,255,0.10);
                    backdrop-filter: blur(20px) saturate(160%);
                    -webkit-backdrop-filter: blur(20px) saturate(160%);
                    color: var(--text-primary);
                    padding: 5px 12px;
                    border-radius: 8px;
                    border: 0.5px solid rgba(255,255,255,0.15);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                    font-family: var(--font-ui);
                    font-size: var(--text-caption-1);
                    font-weight: 500;
                    opacity: 0;
                    transform: translateY(6px);
                    transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
                    pointer-events: none;
                    white-space: nowrap;
                }
                
                .dock-icon:hover .tooltip {
                    opacity: 1;
                    transform: translateY(0);
                }

            `})]})})}const Ye=a.createContext();function Le(){return a.useContext(Ye)}function _t({children:t}){const{user:r}=U(),[s,g]=a.useState([]),[d,u]=a.useState(0),[c,o]=a.useState(!1);a.useEffect(()=>{if(!r)return;const l=async()=>{try{const x=await(await fetch("/api/notifications")).json();x.success&&(g(x.notifications),u(x.unreadCount))}catch(m){console.error("Failed to fetch notifications",m)}};l();const p=setInterval(l,3e4);return()=>clearInterval(p)},[r]);const n=async(l=null)=>{try{await fetch("/api/notifications/mark-read",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:l,all:!l})}),l?(g(p=>p.map(m=>m.id===l?{...m,is_read:1}:m)),u(p=>Math.max(0,p-1))):(g(p=>p.map(m=>({...m,is_read:1}))),u(0))}catch(p){console.error("Failed to mark read",p)}},h=()=>o(l=>!l);return e.jsx(Ye.Provider,{value:{notifications:s,unreadCount:d,markAsRead:n,isOpen:c,toggleCenter:h,setIsOpen:o},children:t})}const qe=a.createContext();function Re(){return a.useContext(qe)}function Tt({children:t}){const[r,s]=a.useState(!1),g=()=>s(!0),d=()=>s(!1),u=()=>s(c=>!c);return a.useEffect(()=>{const c=o=>{(o.metaKey||o.ctrlKey)&&o.key==="k"&&(o.preventDefault(),u()),o.key==="Escape"&&r&&d()};return window.addEventListener("keydown",c),()=>window.removeEventListener("keydown",c)},[r]),e.jsx(qe.Provider,{value:{isOpen:r,openSpotlight:g,closeSpotlight:d,toggleSpotlight:u},children:t})}function Lt({isOpen:t,onClose:r}){const s=a.useRef(null),g=Q(),[d,u]=a.useState(()=>localStorage.getItem("themePreference")||"dark"),[c,o]=a.useState({students:0,atRisk:0,pendingReports:0});a.useEffect(()=>{if(!t)return;(async()=>{var p,m,x;try{const y=await(await fetch("/api/data/stats")).json();y.success&&o({students:((p=y.stats)==null?void 0:p.totalStudents)||0,atRisk:((m=y.stats)==null?void 0:m.atRiskStudents)||0,pendingReports:((x=y.stats)==null?void 0:x.pendingReports)||0})}catch{}})()},[t]),a.useEffect(()=>{if(!t)return;const l=m=>{s.current&&!s.current.contains(m.target)&&r()},p=setTimeout(()=>{document.addEventListener("mousedown",l)},100);return()=>{clearTimeout(p),document.removeEventListener("mousedown",l)}},[t,r]),a.useEffect(()=>{if(!t)return;const l=p=>{p.key==="Escape"&&r()};return window.addEventListener("keydown",l),()=>window.removeEventListener("keydown",l)},[t,r]);const n=l=>{if(u(l),localStorage.setItem("themePreference",l),l==="auto"){const p=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",p?"dark":"light")}else document.documentElement.setAttribute("data-theme",l)},h=l=>{r(),g(l)};return t?e.jsxs("div",{ref:s,className:"control-center-panel",children:[e.jsx("div",{className:"cc-section",children:e.jsxs("div",{className:"cc-grid-2x2",children:[e.jsxs("button",{className:"cc-tile",onClick:()=>h("/weekly-reports"),children:[e.jsx("div",{className:"cc-tile-icon",children:"📝"}),e.jsx("div",{className:"cc-tile-label",children:"Submit Report"})]}),e.jsxs("button",{className:"cc-tile",onClick:()=>h("/report-export"),children:[e.jsx("div",{className:"cc-tile-icon",children:"📤"}),e.jsx("div",{className:"cc-tile-label",children:"Export Data"})]}),e.jsxs("button",{className:"cc-tile",onClick:()=>h("/students"),children:[e.jsx("div",{className:"cc-tile-icon",children:"👥"}),e.jsx("div",{className:"cc-tile-label",children:"Students"})]}),e.jsxs("button",{className:"cc-tile",onClick:()=>h("/groups"),children:[e.jsx("div",{className:"cc-tile-icon",children:"🏘️"}),e.jsx("div",{className:"cc-tile-label",children:"Groups"})]})]})}),e.jsxs("div",{className:"cc-section",children:[e.jsx("div",{className:"cc-section-title",children:"Appearance"}),e.jsx("div",{className:"cc-theme-row",children:[{id:"light",label:"☀️",name:"Light"},{id:"dark",label:"🌙",name:"Dark"},{id:"auto",label:"🔄",name:"Auto"}].map(l=>e.jsxs("button",{className:`cc-theme-btn ${d===l.id?"active":""}`,onClick:()=>n(l.id),children:[e.jsx("span",{className:"cc-theme-icon",children:l.label}),e.jsx("span",{className:"cc-theme-name",children:l.name})]},l.id))})]}),e.jsxs("div",{className:"cc-section",children:[e.jsx("div",{className:"cc-section-title",children:"Quick Stats"}),e.jsxs("div",{className:"cc-stats-row",children:[e.jsxs("div",{className:"cc-stat-tile",children:[e.jsx("div",{className:"cc-stat-number",children:c.students}),e.jsx("div",{className:"cc-stat-name",children:"Students"})]}),e.jsxs("div",{className:"cc-stat-tile warning",children:[e.jsx("div",{className:"cc-stat-number",children:c.atRisk}),e.jsx("div",{className:"cc-stat-name",children:"At Risk"})]}),e.jsxs("div",{className:"cc-stat-tile",children:[e.jsx("div",{className:"cc-stat-number",children:c.pendingReports}),e.jsx("div",{className:"cc-stat-name",children:"Pending"})]})]})]}),e.jsx("div",{className:"cc-section",children:e.jsxs("div",{className:"cc-actions-row",children:[e.jsxs("button",{className:"cc-action-btn",onClick:()=>h("/settings"),children:[e.jsx("span",{children:"⚙️"})," Settings"]}),e.jsxs("button",{className:"cc-action-btn",onClick:()=>h("/audit"),children:[e.jsx("span",{children:"📋"})," Audit Logs"]}),e.jsxs("button",{className:"cc-action-btn",onClick:()=>h("/checkpoints"),children:[e.jsx("span",{children:"🎯"})," Checkpoints"]})]})}),e.jsx("style",{children:`
                .control-center-panel {
                    position: fixed;
                    top: 38px;
                    right: 12px;
                    width: 340px;
                    z-index: 9500;
                    background: transparent;
                    box-shadow: none;
                    backdrop-filter: none;
                    border: none;
                    overflow: visible;
                    animation: ccSlideIn 0.3s var(--ease-out-expo);
                    padding: 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .cc-section {
                    background: transparent;
                    border: none;
                    padding: 0;
                    box-shadow: none;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .cc-section-title {
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                    padding: 0 4px;
                }

                /* 2×2 Action Grid (Modernized) */
                .cc-grid-2x2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                .cc-tile {
                    background: rgba(30, 30, 35, 0.35); /* High transparency */
                    backdrop-filter: blur(80px) saturate(400%); /* Extreme saturation */
                    -webkit-backdrop-filter: blur(80px) saturate(400%);
                    border: 0.5px solid rgba(255, 255, 255, 0.15);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-layer-3);
                    padding: 18px 10px;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.2s var(--ease-smooth);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    position: relative;
                    overflow: hidden;
                }
                .cc-tile:hover {
                    box-shadow: 0 12px 32px rgba(0,0,0,0.25);
                    transform: scale(1.03);
                    border-color: rgba(255,255,255,0.5);
                }

                .cc-tile-icon { font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
                .cc-tile-label { font-size: 11px; font-weight: 500; color: var(--text-secondary); }
                .cc-tile:hover .cc-tile-label { color: white; }
                [data-theme="light"] .cc-tile:hover .cc-tile-label { color: #007aff; }

                /* Theme Buttons */
                .cc-theme-row {
                    display: flex;
                    gap: 8px;
                }
                .cc-theme-btn {
                    flex: 1;
                    background: rgba(30, 30, 35, 0.35);
                    backdrop-filter: blur(80px) saturate(400%);
                    -webkit-backdrop-filter: blur(80px) saturate(400%);
                    border: 0.5px solid rgba(255, 255, 255, 0.15);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-layer-2);
                    padding: 14px 4px;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                }
                .cc-theme-btn:hover { 
                    transform: scale(1.05); 
                    box-shadow: 0 12px 32px rgba(0,0,0,0.25);
                }
                .cc-theme-btn.active {
                    background: var(--accent-color);
                    border-color: rgba(255, 255, 255, 0.4);
                }

                .cc-theme-icon { font-size: 18px; }
                .cc-theme-name { font-size: 10px; font-weight: 500; color: var(--text-tertiary); }
                .cc-theme-btn.active .cc-theme-name { color: white; }
                
                /* Stats Row */
                .cc-stats-row {
                    display: flex;
                    gap: 8px;
                }
                .cc-stat-tile {
                    flex: 1;
                    text-align: center;
                    padding: 16px 10px;
                    background: rgba(30, 30, 35, 0.35);
                    backdrop-filter: blur(80px) saturate(400%);
                    -webkit-backdrop-filter: blur(80px) saturate(400%);
                    border: 0.5px solid rgba(255, 255, 255, 0.15);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-layer-2);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                
                .cc-stat-tile.warning {
                    box-shadow: 0 0 20px rgba(255, 159, 10, 0.2);
                    border-color: rgba(255, 159, 10, 0.4);
                }
                .cc-stat-tile.warning .cc-stat-number { color: #ff9f0a; }

                .cc-stat-number { font-size: 22px; font-weight: 600; color: var(--text-primary); }
                [data-theme="light"] .cc-stat-number { color: #1d1d1f; }
                
                .cc-stat-name { font-size: 10px; color: var(--text-tertiary); margin-top: 2px; }

                /* Actions Row */
                .cc-actions-row {
                    display: flex;
                    gap: 8px;
                }
                .cc-action-btn {
                    flex: 1;
                    background: rgba(30, 30, 35, 0.35);
                    backdrop-filter: blur(80px) saturate(400%);
                    -webkit-backdrop-filter: blur(80px) saturate(400%);
                    border: 0.5px solid rgba(255, 255, 255, 0.15);
                    border-radius: var(--radius-button);
                    box-shadow: var(--shadow-layer-2);
                    padding: 12px 8px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                    color: var(--text-secondary);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                }
                .cc-action-btn:hover {
                    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
                    transform: scale(1.05);
                    color: var(--text-primary);
                }
                .cc-action-btn span { font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }

                @keyframes ccSlideIn {
                    from { opacity: 0; transform: translateY(-12px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                /* Light Mode Glass Vibrancy Overrides */
                [data-theme="light"] .cc-tile,
                [data-theme="light"] .cc-theme-btn,
                [data-theme="light"] .cc-stat-tile,
                [data-theme="light"] .cc-action-btn {
                    background: rgba(255, 255, 255, 0.45);
                    border-color: rgba(0, 0, 0, 0.08);
                }
            `})]}):null}function Rt(){const{user:t,logout:r}=U(),s=Q(),{openSettings:g}=re(),{unreadCount:d,toggleCenter:u}=Le(),{toggleSpotlight:c}=Re(),[o,n]=a.useState(new Date),[h,l]=a.useState(!1),[p,m]=a.useState(!1);a.useEffect(()=>{const i=setInterval(()=>n(new Date),6e4);return()=>clearInterval(i)},[]);const x=i=>i.toLocaleDateString("en-US",{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});return e.jsxs("header",{className:"tahoe-menubar",children:[e.jsxs("div",{className:"menubar-left",children:[e.jsx("div",{className:"menu-item app-name font-bold",children:"Coordinator"}),e.jsx("div",{className:"menu-item",children:"File"}),e.jsx("div",{className:"menu-item",children:"Edit"}),e.jsx("div",{className:"menu-item",children:"View"}),e.jsx("div",{className:"menu-item",children:"Window"}),e.jsx("div",{className:"menu-item",children:"Help"})]}),e.jsxs("div",{className:"menubar-right",children:[e.jsx("div",{className:"menu-item icon-btn",onClick:c,title:"Spotlight Search (Cmd+K)",children:e.jsxs("svg",{width:"15",height:"15",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"11",cy:"11",r:"8"}),e.jsx("line",{x1:"21",y1:"21",x2:"16.65",y2:"16.65"})]})}),e.jsx("div",{className:"menu-item icon-btn",onClick:()=>m(!p),title:"Control Center",children:e.jsxs("svg",{width:"15",height:"15",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"3",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"14",y:"3",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"3",y:"14",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"14",y:"14",width:"7",height:"7",rx:"1.5"})]})}),e.jsxs("div",{className:"menu-item icon-btn",onClick:u,title:"Notifications",style:{position:"relative"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"}),e.jsx("path",{d:"M13.73 21a2 2 0 0 1-3.46 0"})]}),d>0&&e.jsx("span",{className:"badge-dot"})]}),e.jsx("div",{className:"menu-item clock",children:x(o)}),t&&e.jsxs("div",{className:`menu-item user-profile ${h?"active":""}`,onClick:()=>l(!h),children:[e.jsx("span",{className:"user-name",children:t.name}),e.jsx("div",{className:"avatar-tiny",children:t.profile_image?e.jsx("img",{src:t.profile_image,alt:t.name,style:{width:"100%",height:"100%",objectFit:"cover"}}):t.name.charAt(0)}),h&&e.jsxs("div",{className:"menubar-dropdown",children:[e.jsxs("div",{className:"dropdown-header",children:[e.jsx("div",{className:"avatar-large",children:t.profile_image?e.jsx("img",{src:t.profile_image,alt:t.name,style:{width:"100%",height:"100%",objectFit:"cover"}}):t.name.charAt(0)}),e.jsxs("div",{className:"user-details",children:[e.jsx("div",{className:"name",children:t.name}),e.jsx("div",{className:"role",children:t.role})]})]}),e.jsx("div",{className:"dropdown-divider"}),e.jsx("button",{onClick:()=>s("/dashboard"),className:"dropdown-item",children:"Dashboard"}),e.jsx("button",{onClick:()=>{l(!1),g()},className:"dropdown-item",children:"System Preferences..."}),e.jsx("div",{className:"dropdown-divider"}),e.jsx("button",{onClick:r,className:"dropdown-item danger",children:"Log Out..."})]})]})]}),e.jsx(Lt,{isOpen:p,onClose:()=>m(!1)}),e.jsx("style",{children:`
                .tahoe-menubar {
                    /* Uses standard .menu-bar class from index.css */
                    composes: menu-bar from global;
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 16px;
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 9999;
                    font-family: var(--font-ui);
                    font-size: var(--text-footnote);
                    color: rgba(0, 0, 0, 0.85);
                    user-select: none;
                }
                [data-theme="dark"] .tahoe-menubar {
                     color: rgba(255, 255, 255, 0.9);
                }

                .menubar-left, .menubar-right {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .menubar-right {
                    gap: 16px;
                }

                .menu-item {
                    padding: 4px 10px;
                    border-radius: 4px;
                    cursor: default;
                    transition: background 0.15s;
                }

                .menu-item:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                [data-theme="dark"] .menu-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .app-name {
                    font-weight: 700;
                }

                .clock {
                    font-feature-settings: "tnum";
                    font-variant-numeric: tabular-nums;
                    font-weight: 500;
                }

                .user-profile {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding-right: 0;
                    position: relative;
                }

                .user-name {
                    font-weight: 500;
                }

                .avatar-tiny {
                    width: 20px;
                    height: 20px;
                    background: rgba(128,128,128,0.3);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 700;
                    border: 1px solid rgba(0,0,0,0.1);
                    overflow: hidden; /* Added for image clipping */
                }
                [data-theme="dark"] .avatar-tiny { border-color: rgba(255,255,255,0.1); }

                /* Dropdown */
                /* Dropdown uses liquid-glass + lg-thin */
                .menubar-dropdown {
                    @apply liquid-glass lg-thin; /* Conceptual - applying classes manually below */
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 6px;
                    width: 240px;
                    background: rgba(245, 245, 245, 0.65); /* Fallback/Blend */
                    backdrop-filter: blur(var(--lg-thin-blur));
                    -webkit-backdrop-filter: blur(var(--lg-thin-blur));
                    border-radius: var(--lg-radius-sm);
                    border: 1px solid rgba(255,255,255,0.2);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    padding: 6px;
                    display: flex;
                    flex-direction: column;
                    z-index: 10000;
                }
                [data-theme="dark"] .menubar-dropdown {
                    background: rgba(40, 40, 40, 0.65);
                    color: white;
                    border-color: rgba(255,255,255,0.1);
                }

                .dropdown-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 10px;
                }

                .avatar-large {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: var(--accent-gradient, linear-gradient(135deg, #007aff, #00c6ff));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    font-weight: 600;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                    overflow: hidden; /* Added for image clipping */
                }

                .user-details .name { font-weight: 600; font-size: var(--text-subheadline); }
                .user-details .role { font-size: var(--text-caption-1); opacity: 0.6; }

                .dropdown-divider {
                    height: 1px;
                    background: rgba(0,0,0,0.08); /* Light Divider */
                    margin: 4px 6px;
                }
                [data-theme="dark"] .dropdown-divider { background: rgba(255,255,255,0.08); }

                .dropdown-item {
                    background: transparent;
                    border: none;
                    text-align: left;
                    padding: 6px 12px;
                    border-radius: 5px;
                    font-size: var(--text-footnote);
                    cursor: pointer;
                    color: inherit;
                    transition: background 0.1s;
                }
                .dropdown-item:hover {
                    background: var(--accent-color, #007aff);
                    color: white;
                }
                .dropdown-item.danger:hover {
                    background: #ff3b30;
                }

                .icon-btn {
                    padding: 4px 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .badge-dot {
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    width: 6px;
                    height: 6px;
                    background: #ff3b30;
                    border-radius: 50%;
                    box-shadow: 0 0 0 1px white;
                }
                [data-theme="dark"] .badge-dot { box-shadow: 0 0 0 1px #333; }

            `})]})}function At(){const[t,r]=a.useState(new Date);return a.useEffect(()=>{const s=setInterval(()=>r(new Date),1e3);return()=>clearInterval(s)},[]),e.jsxs("div",{className:"desktop-widgets-layer",children:[e.jsxs("div",{className:"widget-column",children:[e.jsx("div",{className:"desktop-widget clock-widget",children:e.jsxs("div",{className:"clock-face",children:[e.jsx("div",{className:"time",children:t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}),e.jsx("div",{className:"date",children:t.toLocaleDateString([],{weekday:"long",month:"long",day:"numeric"})})]})}),e.jsxs("div",{className:"desktop-widget calendar-widget",children:[e.jsx("div",{className:"month",children:t.toLocaleDateString([],{month:"long"}).toUpperCase()}),e.jsx("div",{className:"day",children:t.getDate()}),e.jsx("div",{className:"weekday",children:t.toLocaleDateString([],{weekday:"long"})})]}),e.jsxs("div",{className:"desktop-widget status-widget",children:[e.jsx("div",{className:"widget-title",children:"Status"}),e.jsxs("div",{className:"status-row",children:[e.jsx("span",{className:"dot online"}),e.jsx("span",{children:"System Operational"})]}),e.jsxs("div",{className:"status-row",children:[e.jsx("span",{className:"label",children:"Next Class:"}),e.jsx("span",{className:"value",children:"Tue 18:00"})]})]})]}),e.jsx("style",{children:`
                .desktop-widgets-layer {
                    position: fixed;
                    top: 50px; /* Below MenuBar */
                    left: 20px;
                    bottom: 100px; /* Above Dock */
                    width: 300px;
                    z-index: 0; /* Behind App Window */
                    pointer-events: none; /* Let clicks pass through to wallpaper if needed, but widgets usually interactive */
                }

                .widget-column {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .desktop-widget {
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(25px) saturate(180%);
                    -webkit-backdrop-filter: blur(25px) saturate(180%);
                    border-radius: 22px;
                    padding: 20px;
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
                    pointer-events: auto;
                    transition: transform 0.2s;
                }
                
                [data-theme="dark"] .desktop-widget {
                     background: rgba(30, 30, 30, 0.3);
                     border: 1px solid rgba(255, 255, 255, 0.1);
                     box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }

                .desktop-widget:hover {
                    transform: scale(1.02);
                }

                /* Clock Widget */
                .clock-widget {
                    text-align: center;
                }
                .clock-widget .time {
                    font-size: 3rem;
                    font-weight: 300;
                    letter-spacing: -1px;
                    line-height: 1;
                }
                .clock-widget .date {
                    font-size: 1rem;
                    opacity: 0.8;
                    margin-top: 5px;
                    font-weight: 500;
                }

                /* Calendar Widget */
                .calendar-widget {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.25); /* Lighter for calendar */
                }
                [data-theme="dark"] .calendar-widget { background: rgba(0, 0, 0, 0.4); }

                .calendar-widget .month {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #ff3b30; /* macOS Red */
                    margin-bottom: 0;
                }
                .calendar-widget .day {
                    font-size: 3.5rem;
                    font-weight: 400;
                    line-height: 1;
                }
                .calendar-widget .weekday {
                    font-size: 1rem;
                    opacity: 0.7;
                }

                /* Status Widget */
                .status-widget .widget-title {
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    opacity: 0.6;
                    margin-bottom: 10px;
                    letter-spacing: 0.5px;
                }
                .status-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                    font-size: 0.95rem;
                }
                .dot.online {
                    width: 8px;
                    height: 8px;
                    background: #4cd964;
                    border-radius: 50%;
                    box-shadow: 0 0 8px #4cd964;
                }
                .status-row .label {
                    opacity: 0.7;
                }
                .status-row .value {
                    font-weight: 600;
                }
            `})]})}function Ft(){const[t,r]=a.useState(!1),s=fe();return a.useEffect(()=>{r(!1)},[s.pathname]),e.jsxs("div",{className:"tahoe-desktop-env",children:[e.jsx(At,{}),e.jsx(Rt,{}),e.jsxs("div",{className:`app-window-frame ${t?"minimized":""}`,children:[e.jsxs("div",{className:"window-header-controls",children:[e.jsx("span",{className:"control red"}),e.jsx("span",{className:"control yellow",onClick:()=>r(!0),title:"Minimize"}),e.jsx("span",{className:"control green"})]}),e.jsx("div",{className:"main-content-wrapper",children:e.jsx("div",{className:"content-scroll-area",children:e.jsx(st,{})})})]}),e.jsx(zt,{onAppClick:()=>r(!1)}),e.jsx("style",{children:`
                .tahoe-desktop-env {
                    height: 100vh;
                    width: 100vw;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    position: relative;
                }

                .app-window-frame {
                    flex: 1;
                    margin: 40px var(--space-sm) var(--space-xl) var(--space-sm);
                    background: var(--glass-layer-1);
                    backdrop-filter: var(--blur-layer-1);
                    -webkit-backdrop-filter: var(--blur-layer-1);
                    border: var(--border-layer-1);
                    border-radius: var(--radius-window);
                    box-shadow: var(--shadow-layer-2);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    position: relative;
                    z-index: 10;
                    transition: all var(--duration-system) var(--ease-system);
                    transform-origin: bottom center;
                }

                .app-window-frame.minimized {
                    transform: scale(0.6) translateY(100vh);
                    opacity: 0;
                    pointer-events: none;
                }

                .window-header-controls {
                    height: 40px;
                    display: flex;
                    align-items: center;
                    padding-left: 16px;
                    gap: 8px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    background: rgba(255,255,255,0.02);
                }

                .control {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    cursor: pointer;
                    position: relative;
                }
                .control:hover::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; bottom: 0; right: 0;
                    background: rgba(0,0,0,0.1);
                    border-radius: 50%;
                }
                .control.red { background: #FF5F57; border: 1px solid #E0443E; }
                .control.yellow { background: #FFBD2E; border: 1px solid #DEA123; }
                .control.green { background: #28C840; border: 1px solid #1AAB29; }

                .main-content-wrapper {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: rgba(0, 0, 0, 0.04);
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                    position: relative;
                    overflow: hidden;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
                }

                .content-scroll-area {
                    flex: 1;
                    padding: var(--space-lg);
                    overflow-y: auto;
                    scroll-behavior: smooth;
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .app-window-frame {
                        margin: 40px var(--space-xs) 90px var(--space-xs);
                    }
                }
            `})]})}function Et({stats:t}){return e.jsxs("div",{className:"stats-grid",children:[e.jsxs("div",{className:"glass-card stat-card highlight",children:[e.jsx("div",{className:"stat-label",children:"Total Students"}),e.jsx("div",{className:"stat-value",children:t.totalStudents||0}),e.jsx("div",{className:"stat-change",children:"Enrolled in courses"})]}),e.jsxs("div",{className:"glass-card stat-card",children:[e.jsx("div",{className:"stat-label",children:"Active Courses"}),e.jsx("div",{className:"stat-value",children:t.activeCourses||0}),e.jsx("div",{className:"stat-change",children:"Currently in progress"})]}),e.jsxs("div",{className:"glass-card stat-card",children:[e.jsx("div",{className:"stat-label",children:"Completed Courses"}),e.jsx("div",{className:"stat-value",children:t.completedCourses||0}),e.jsx("div",{className:"stat-change",children:"Successfully finished"})]}),e.jsxs("div",{className:"glass-card stat-card",children:[e.jsx("div",{className:"stat-label",children:"Average Progress"}),e.jsxs("div",{className:"stat-value",children:[t.averageProgress||0,"%"]}),e.jsx("div",{className:"stat-change",children:"Overall completion"})]}),e.jsx("style",{children:`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .glass-card.stat-card {
                    background: var(--glass-layer-3);
                    backdrop-filter: var(--blur-layer-3);
                    border: var(--border-layer-3);
                    border-radius: 24px;
                    padding: 24px;
                    box-shadow: var(--shadow-layer-3);
                    transition: transform 0.4s var(--ease-spring-smooth), box-shadow 0.4s var(--ease-spring-smooth);
                }
                .glass-card.stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-layer-4);
                    background: var(--glass-layer-3);
                }
                .stat-label {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .stat-value {
                    font-size: 32px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                    letter-spacing: -0.5px;
                }
                .stat-change {
                    font-size: 12px;
                    color: var(--text-tertiary);
                }
                .highlight .stat-value {
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `})]})}ot.register(nt,it,lt,dt,ct,pt,xt,gt,ht);window.Chart=ot;const X={primary:"rgba(99, 102, 241, 0.8)",success:"rgba(16, 185, 129, 0.8)",warning:"rgba(245, 158, 11, 0.8)",danger:"rgba(239, 68, 68, 0.8)",info:"rgba(59, 130, 246, 0.8)"},ve=t=>{const r=t==="dark"||t==="auto"&&window.matchMedia("(prefers-color-scheme: dark)").matches||document.documentElement.getAttribute("data-theme")==="dark",s=r?"rgba(255, 255, 255, 0.7)":"rgba(0, 0, 0, 0.7)",g=r?"rgba(255, 255, 255, 0.1)":"rgba(0, 0, 0, 0.06)",d=r?"rgba(255, 255, 255, 0.5)":"rgba(0, 0, 0, 0.5)";return{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{labels:{color:s,font:{family:"Plus Jakarta Sans",size:12},padding:12}}},scales:{x:{ticks:{color:d},grid:{color:g}},y:{ticks:{color:d},grid:{color:g}}}}};function It({data:t}){const{theme:r}=re(),s=ve(r),g={labels:["0-25%","26-50%","51-75%","76-100%"],datasets:[{label:"Students",data:t||[0,0,0,0],backgroundColor:[X.danger,X.warning,X.info,X.success],borderRadius:8}]};return e.jsxs("div",{className:"glass-card chart-card",children:[e.jsx("div",{className:"chart-header",children:e.jsx("h3",{className:"chart-title",children:"Progress Distribution"})}),e.jsx("div",{className:"chart-container",children:e.jsx(Oe,{data:g,options:s})})]})}function Bt({data:t}){const{theme:r}=re(),s=ve(r),g={...s,scales:{},plugins:{legend:{position:"right",labels:s.plugins.legend.labels}}},d={labels:["Completed","In Progress","Not Started"],datasets:[{data:t||[0,0,0],backgroundColor:[X.success,X.info,X.warning],borderColor:r==="dark"?"rgba(255, 255, 255, 0.1)":"rgba(255, 255, 255, 1)",borderWidth:2}]};return e.jsxs("div",{className:"glass-card chart-card",children:[e.jsx("div",{className:"chart-header",children:e.jsx("h3",{className:"chart-title",children:"Completion Status"})}),e.jsx("div",{className:"chart-container",children:e.jsx(ut,{data:d,options:g})})]})}function Wt({data:t}){const{theme:r}=re(),s=ve(r),g={...s,indexAxis:"y",plugins:{...s.plugins,legend:{display:!1}}},d={labels:(t==null?void 0:t.labels)||["Course 1","Course 2","Course 3"],datasets:[{label:"Average Progress %",data:(t==null?void 0:t.values)||[0,0,0],backgroundColor:X.primary,borderRadius:8}]};return e.jsxs("div",{className:"glass-card chart-card",children:[e.jsx("div",{className:"chart-header",children:e.jsx("h3",{className:"chart-title",children:"Average Progress per Course"})}),e.jsx("div",{className:"chart-container",children:e.jsx(Oe,{data:d,options:g})})]})}function Dt({data:t}){const{theme:r}=re(),s=ve(r),g={...s,plugins:{...s.plugins,legend:{display:!1}}},d={labels:(t==null?void 0:t.labels)||["Week 1","Week 2","Week 3","Week 4"],datasets:[{label:"Active Students",data:(t==null?void 0:t.values)||[0,0,0,0],borderColor:X.primary,backgroundColor:"rgba(99, 102, 241, 0.1)",fill:!0,tension:.4,pointBackgroundColor:X.primary,pointBorderColor:"#fff",pointHoverBackgroundColor:"#fff",pointHoverBorderColor:X.primary}]};return e.jsxs("div",{className:"glass-card chart-card",children:[e.jsx("div",{className:"chart-header",children:e.jsx("h3",{className:"chart-title",children:"Engagement Over Time"})}),e.jsx("div",{className:"chart-container",children:e.jsx(mt,{data:d,options:g})})]})}function Pt({chartData:t}){return e.jsxs("div",{className:"charts-section",children:[e.jsx(It,{data:t==null?void 0:t.progressDistribution}),e.jsx(Bt,{data:t==null?void 0:t.completionStatus}),e.jsx(Wt,{data:t==null?void 0:t.courseProgress}),e.jsx(Dt,{data:t==null?void 0:t.engagement}),e.jsx("style",{children:`
                .charts-section {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 24px;
                }
                .glass-card.chart-card {
                    background: var(--glass-layer-3);
                    backdrop-filter: var(--blur-layer-3);
                    border: var(--border-layer-3);
                    border-radius: 28px;
                    padding: 24px;
                    box-shadow: var(--shadow-layer-3);
                    transition: transform 0.4s var(--ease-spring-smooth), box-shadow 0.4s var(--ease-spring-smooth);
                }
                .glass-card.chart-card:hover {
                    box-shadow: var(--shadow-layer-4);
                }
                .chart-header {
                    margin-bottom: 20px;
                }
                .chart-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                    letter-spacing: 0.01em;
                }
                .chart-container {
                    position: relative;
                    height: 250px;
                    width: 100%;
                }
            `})]})}function $t({students:t,onFilter:r}){const{user:s}=U(),g=t.filter(u=>u.alertLevel==="red").length,d=t.filter(u=>u.alertLevel==="yellow").length;return g===0&&d===0?null:e.jsxs("div",{className:"alerts-banner",style:{marginBottom:"24px",borderLeft:"4px solid var(--warning)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-2)",border:"var(--border-layer-2)",borderRadius:"16px",boxShadow:"var(--shadow-layer-3)"},children:[e.jsxs("div",{style:{display:"flex",gap:"24px",alignItems:"center"},children:[g>0&&e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",color:"var(--error)"},children:[e.jsx("span",{style:{fontSize:"18px"},children:"🛑"}),e.jsxs("span",{style:{fontWeight:"600"},children:[g," Students"]}),e.jsxs("span",{style:{opacity:.8},children:["inactive ",">"," 30 days"]})]}),d>0&&e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",color:"var(--warning)"},children:[e.jsx("span",{style:{fontSize:"18px"},children:"⚠️"}),e.jsxs("span",{style:{fontWeight:"600"},children:[d," Students"]}),e.jsxs("span",{style:{opacity:.8},children:["inactive ",">"," 14 days"]})]})]}),((s==null?void 0:s.role)==="Pastor"||(s==null?void 0:s.role)==="Admin"||(s==null?void 0:s.role)==="Coordinator")&&e.jsx("button",{className:"btn-secondary",onClick:()=>r&&r("alert"),style:{fontSize:"13px",padding:"6px 16px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)"},children:"View Inactive Students"})]})}function Mt({campus:t}){const r=Q(),[s,g]=a.useState(null),[d,u]=a.useState(!0);a.useEffect(()=>{c()},[t]);const c=async()=>{u(!0);try{const x=new URLSearchParams;t&&x.append("celebration_point",t);const y=await(await fetch(`/api/formation-dashboard?${x}`)).json();y.success&&g(y)}catch{}u(!1)};if(d)return e.jsx("div",{style:{textAlign:"center",padding:40,color:"var(--text-secondary)"},children:"Loading formation data..."});if(!s)return null;const{submissionStatus:o,engagementTrend:n,pastoralConcerns:h,formationEvidence:l,checkpointStatus:p}=s;return o.length>0||n.length>0||h.length>0?e.jsxs("div",{style:{marginTop:24},children:[e.jsxs("h2",{style:{fontSize:17,fontWeight:700,color:"var(--text-primary)",marginBottom:16,display:"flex",alignItems:"center",gap:8},children:[e.jsx("span",{style:{width:28,height:28,borderRadius:8,display:"inline-flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",fontSize:14},children:"🌱"}),"Formation Layer"]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16},children:[e.jsxs("div",{style:ie,onClick:()=>r("/weekly-reports"),className:"formation-widget",children:[e.jsxs("div",{style:le,children:[e.jsx("span",{style:de,children:"📊 Report Submissions"}),e.jsxs("span",{style:{fontSize:11,color:"var(--text-secondary)"},children:[o.length," groups"]})]}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:6,marginTop:10},children:o.map(x=>{const i=x.total_reports>0?x.latest_week>=1?"#34C759":"#FF9500":"#FF3B30";return e.jsx("div",{title:`${x.group_code} — ${x.name}
${x.total_reports} reports, latest: Week ${x.latest_week||"—"}`,style:{width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:`${i}18`,border:`1px solid ${i}33`,fontSize:10,fontWeight:700,color:i,cursor:"pointer",transition:"transform 0.15s"},onMouseEnter:y=>y.currentTarget.style.transform="scale(1.15)",onMouseLeave:y=>y.currentTarget.style.transform="scale(1)",children:x.group_code.slice(-3)},x.id)})}),e.jsxs("div",{style:{display:"flex",gap:12,marginTop:10,fontSize:10,color:"var(--text-secondary)"},children:[e.jsxs("span",{children:[e.jsx("span",{style:{color:"#34C759"},children:"●"})," Submitted"]}),e.jsxs("span",{children:[e.jsx("span",{style:{color:"#FF9500"},children:"●"})," Pending"]}),e.jsxs("span",{children:[e.jsx("span",{style:{color:"#FF3B30"},children:"●"})," No reports"]})]})]}),e.jsxs("div",{style:ie,onClick:()=>r("/weekly-reports"),className:"formation-widget",children:[e.jsxs("div",{style:le,children:[e.jsx("span",{style:de,children:"📈 Engagement Trend"}),e.jsxs("span",{style:{fontSize:11,color:"var(--text-secondary)"},children:[n.length," weeks"]})]}),n.length>0?e.jsxs("div",{style:{marginTop:10},children:[e.jsx("div",{style:{display:"flex",alignItems:"flex-end",gap:4,height:80},children:n.map(x=>{const y=Math.max(10,x.avg_score/3*70),f=x.avg_score>=2.5?"#34C759":x.avg_score>=1.5?"#FF9500":"#FF3B30";return e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",flex:1},title:`Week ${x.week_number}: ${x.avg_score}/3.0
High: ${x.high_count}, Med: ${x.medium_count}, Low: ${x.low_count}`,children:[e.jsx("div",{style:{width:"100%",maxWidth:28,height:y,borderRadius:"6px 6px 2px 2px",background:`linear-gradient(to top, ${f}88, ${f})`,transition:"height 0.3s"}}),e.jsxs("span",{style:{fontSize:9,color:"var(--text-secondary)",marginTop:3},children:["W",x.week_number]})]},x.week_number)})}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:10,color:"var(--text-secondary)"},children:[e.jsx("span",{children:"Low (1.0)"}),e.jsx("span",{children:"High (3.0)"})]})]}):e.jsx("div",{style:{padding:20,textAlign:"center",fontSize:12,color:"var(--text-secondary)"},children:"No engagement data yet"})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16},children:[e.jsxs("div",{style:{...ie,maxHeight:260,overflow:"hidden",display:"flex",flexDirection:"column"},children:[e.jsxs("div",{style:le,children:[e.jsx("span",{style:de,children:"🙏 Pastoral Concerns"}),e.jsx("span",{style:{fontSize:11,color:"#FF9500"},children:h.length})]}),e.jsx("div",{style:{flex:1,overflowY:"auto",marginTop:8},children:h.length>0?h.map(x=>e.jsxs("div",{onClick:()=>r("/weekly-reports"),style:{padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer",transition:"background 0.15s"},children:[e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)",marginBottom:3},children:[x.group_code," · Week ",x.week_number," · ",x.facilitator_name]}),e.jsx("div",{style:{fontSize:12,color:"var(--text-primary)",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"},children:x.pastoral_concerns})]},x.id)):e.jsx("div",{style:{padding:16,textAlign:"center",fontSize:12,color:"var(--text-secondary)"},children:"No concerns flagged"})})]}),e.jsxs("div",{style:{...ie,maxHeight:260,overflow:"hidden",display:"flex",flexDirection:"column"},children:[e.jsxs("div",{style:le,children:[e.jsx("span",{style:de,children:"🌱 Formation Evidence"}),e.jsx("span",{style:{fontSize:11,color:"#34C759"},children:l.length})]}),e.jsx("div",{style:{flex:1,overflowY:"auto",marginTop:8},children:l.length>0?l.map(x=>e.jsxs("div",{onClick:()=>r("/weekly-reports"),style:{padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer"},children:[e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)",marginBottom:3},children:[x.group_code," · Week ",x.week_number," · ",x.facilitator_name]}),e.jsx("div",{style:{fontSize:12,color:"var(--text-primary)",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"},children:x.formation_evidence})]},x.id)):e.jsx("div",{style:{padding:16,textAlign:"center",fontSize:12,color:"var(--text-secondary)"},children:"No evidence reported"})})]}),e.jsxs("div",{style:{...ie,maxHeight:260,overflow:"hidden",display:"flex",flexDirection:"column"},children:[e.jsx("div",{style:le,children:e.jsx("span",{style:de,children:"🎯 Checkpoint Status"})}),p.length>0?e.jsx("div",{style:{marginTop:8,flex:1,overflowY:"auto"},children:[4,8,13].map(x=>{const i=p.filter(N=>N.checkpoint_week===x);if(i.length===0)return null;const y=i.filter(N=>N.status==="reviewed").length,f=i.filter(N=>N.status==="completed").length,z=i.filter(N=>N.status==="pending").length;return e.jsxs("div",{onClick:()=>r("/checkpoints"),style:{padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer"},children:[e.jsxs("div",{style:{fontSize:12,fontWeight:600,color:"var(--text-primary)",marginBottom:4},children:["Week ",x]}),e.jsxs("div",{style:{display:"flex",gap:8,fontSize:10},children:[y>0&&e.jsxs("span",{style:{color:"#34C759"},children:["✅ ",y," reviewed"]}),f>0&&e.jsxs("span",{style:{color:"#007AFF"},children:["✓ ",f," completed"]}),z>0&&e.jsxs("span",{style:{color:"#FF9500"},children:["⏳ ",z," pending"]})]})]},x)})}):e.jsx("div",{style:{padding:16,textAlign:"center",fontSize:12,color:"var(--text-secondary)"},children:"No checkpoints generated yet"})]})]})]}):e.jsxs("div",{style:{marginTop:24},children:[e.jsxs("h2",{style:{fontSize:17,fontWeight:700,color:"var(--text-primary)",marginBottom:16,display:"flex",alignItems:"center",gap:8},children:[e.jsx("span",{style:{width:28,height:28,borderRadius:8,display:"inline-flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",fontSize:14},children:"\uD83C\uDF31"}),"Formation Layer"]}),e.jsx("div",{style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-2)",border:"var(--border-layer-2)",borderRadius:16,padding:"32px 24px",textAlign:"center"},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:32,marginBottom:10},children:"\uD83D\uDCCA"}),e.jsx("div",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)",marginBottom:6},children:"No formation data yet"}),e.jsx("div",{style:{fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.5},children:"Submit weekly reports to see engagement trends, pastoral concerns, and checkpoint status"})]})})]})}const ie={background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-2)",border:"var(--border-layer-2)",borderRadius:16,padding:20,cursor:"pointer",transition:"transform 0.2s var(--ease-spring), box-shadow 0.2s var(--ease-spring), background 0.2s",boxShadow:"var(--shadow-layer-2)"},le={display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},de={fontSize:14,fontWeight:600,color:"var(--text-primary)",letterSpacing:"0.01em"};function Ot(){const{user:t,showToast:r}=U(),{focusMode:s}=re(),g=Q(),[d,u]=a.useState(!0),[c,o]=a.useState([]),[n,h]=a.useState({}),[l,p]=a.useState({}),[m,x]=a.useState([]),[i,y]=a.useState(["Admin","LeadershipTeam","Pastor"].includes(t==null?void 0:t.role)?"":t==null?void 0:t.celebration_point),f=(t==null?void 0:t.role)==="Facilitator";a.useEffect(()=>{z(),f&&N()},[i]);const z=async()=>{u(!0);try{const k=new URLSearchParams;i&&k.append("celebration_point",i);const _=await(await fetch(`/api/data/students?${k}`)).json();_.success?(o(_.students||[]),h(_.stats||{}),p(_.chartData||{})):r(_.message||"Failed to load data","error")}catch(k){console.error("Load data error:",k),r("Failed to connect to server","error")}finally{u(!1)}},N=async()=>{try{const b=await(await fetch("/api/formation-groups")).json();b.success&&x(b.groups||[])}catch{}},v=()=>{g("/students")};return e.jsxs("div",{className:"tahoe-page",children:[["Admin","LeadershipTeam","Pastor"].includes(t==null?void 0:t.role)&&e.jsxs("div",{style:{marginBottom:"24px"},children:[e.jsxs("select",{className:"filter-select",value:i,onChange:k=>y(k.target.value),style:{minWidth:"300px"},children:[e.jsx("option",{value:"",children:"All Celebration Points"}),Z.map(k=>e.jsx("option",{value:k,children:k},k))]}),e.jsx("button",{className:"btn-secondary",onClick:z,style:{marginLeft:"12px"},children:"🔄 Refresh Data"})]}),s!=="default"&&e.jsxs("div",{style:{display:"inline-flex",alignItems:"center",gap:"10px",padding:"8px 16px",borderRadius:"var(--radius-pill)",marginBottom:"24px",background:"var(--glass-layer-2)",border:"var(--border-layer-2)",boxShadow:"var(--shadow-layer-3)",backdropFilter:"var(--blur-layer-2)",fontSize:"12px",color:"var(--text-primary)",animation:"fadeIn 0.3s ease-out"},children:[e.jsx("span",{style:{fontSize:"14px"},children:"🎯"}),e.jsxs("span",{children:["Focus: ",e.jsx("strong",{style:{textTransform:"capitalize",color:"var(--primary-light)"},children:s})]}),e.jsx("button",{onClick:()=>document.dispatchEvent(new CustomEvent("toggle-focus-mode",{detail:"default"})),style:{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"50%",width:"20px",height:"20px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginLeft:"8px",color:"var(--text-secondary)",transition:"all 0.2s"},onMouseEnter:k=>{k.currentTarget.style.background="rgba(255,255,255,0.2)",k.currentTarget.style.color="var(--text-primary)"},onMouseLeave:k=>{k.currentTarget.style.background="rgba(255,255,255,0.1)",k.currentTarget.style.color="var(--text-secondary)"},title:"Clear Focus",children:"✕"})]}),d?e.jsxs("div",{className:"loading-container",children:[e.jsx("div",{className:"spinner"}),e.jsx("p",{children:"Loading dashboard data..."})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{onClick:v,style:{cursor:"pointer"},children:e.jsx($t,{students:c,onFilter:()=>{}})}),s!=="facilitator"&&e.jsx(Et,{stats:n}),s!=="facilitator"&&e.jsx("div",{style:{marginTop:"24px"},children:e.jsx(Pt,{chartData:l})}),e.jsx(Mt,{campus:i}),window.__ATTENDANCE_ADDON__&&window.__ATTENDANCE_ADDON__.DashboardWidget?e.jsx(window.__ATTENDANCE_ADDON__.DashboardWidget,{}):null,f&&m.length>0&&e.jsxs("div",{style:{marginTop:32},children:[e.jsx("h3",{style:{fontSize:16,fontWeight:600,color:"var(--text-primary)",marginBottom:16},children:"📋 My Formation Groups"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:16},children:m.map(k=>e.jsxs("div",{onClick:()=>g("/groups"),className:"glass-card hover-card",style:{padding:20,cursor:"pointer",transition:"transform 0.2s var(--ease-spring), box-shadow 0.2s var(--ease-spring)"},onMouseEnter:b=>{b.currentTarget.style.transform="translateY(-4px)",b.currentTarget.style.boxShadow="var(--shadow-layer-4)"},onMouseLeave:b=>{b.currentTarget.style.transform="translateY(0)",b.currentTarget.style.boxShadow="var(--shadow-layer-3)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12},children:[e.jsx("span",{style:{padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:700,background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",color:"white",letterSpacing:.5,boxShadow:"0 2px 6px rgba(118, 75, 162, 0.3)"},children:k.group_code}),k.is_overdue&&e.jsx("span",{style:{fontSize:10,padding:"3px 8px",borderRadius:6,background:"rgba(255, 59, 48, 0.1)",color:"#ff3b30",border:"1px solid rgba(255, 59, 48, 0.2)",fontWeight:600},children:"Report Overdue"})]}),e.jsx("div",{style:{fontSize:15,fontWeight:600,color:"var(--text-primary)",marginBottom:6},children:k.name}),e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)"},children:[k.member_count||0," member",k.member_count!==1?"s":""," · ",k.celebration_point]})]},k.id))})]})]})]})}const Gt=({score:t,size:r=32,strokeWidth:s=1.5})=>{let g="var(--system-green)",d=100;t==="attention"?(g="var(--system-yellow)",d=75):t==="critical"?(g="var(--system-red)",d=40):typeof t=="number"&&(d=t,d<50?g="var(--system-red)":d<80?g="var(--system-yellow)":g="var(--system-green)");const u=(r-s)/2,c=u*2*Math.PI,o=c-d/100*c;return e.jsx("div",{style:{position:"relative",width:r,height:r,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsxs("svg",{width:r,height:r,style:{transform:"rotate(-90deg)"},children:[e.jsx("circle",{cx:r/2,cy:r/2,r:u,fill:"none",stroke:"rgba(255,255,255,0.1)",strokeWidth:s}),e.jsx("circle",{cx:r/2,cy:r/2,r:u,fill:"none",stroke:g,strokeWidth:s,strokeDasharray:c,strokeDashoffset:o,strokeLinecap:"round",style:{transition:"stroke-dashoffset 0.5s ease"}})]})})};function Je({student:t}){const{user:r,showToast:s}=U(),[g,d]=a.useState("overview"),[u,c]=a.useState([]),[o,n]=a.useState(""),[h,l]=a.useState(!1);a.useEffect(()=>{t&&g==="notes"&&p()},[t,g]);const p=async()=>{l(!0);try{const N=await(await fetch(`/api/data/notes/${t.id}`)).json();N.success&&c(N.notes)}catch(z){console.error("Failed to load notes",z)}finally{l(!1)}},m=async z=>{if(z.preventDefault(),!!o.trim())try{(await(await fetch("/api/data/notes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentId:t.id,content:o,celebrationPoint:t.celebration_point})})).json()).success?(n(""),p(),s("Note added","success")):s("Failed to add note","error")}catch{s("Error adding note","error")}};if(!t)return e.jsxs("div",{className:"empty-state-container",children:[e.jsx("div",{className:"empty-state-icon",children:"👤"}),e.jsx("h3",{children:"Select a Student"}),e.jsx("p",{children:"Choose a student from the list to view their details."}),e.jsx("style",{children:`
                    .empty-state-container {
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                        height: 100%; color: var(--text-muted); text-align: center;
                    }
                    .empty-state-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
                `})]});const x=t.name?t.name.split(" ").map(z=>z[0]).join("").substring(0,2).toUpperCase():"??",i=t.name?t.name.charCodeAt(0):0,y=["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEEAD","#FF9F43","#54a0ff","#5f27cd"],f=y[i%y.length];return e.jsxs("div",{className:"student-detail-view fade-in",children:[e.jsx("div",{className:"student-cover-banner",style:{background:`linear-gradient(135deg, ${f}44, var(--glass-bg))`}}),e.jsxs("div",{className:"student-content-wrapper",children:[e.jsx("div",{className:"student-avatar",style:{background:f},children:x}),e.jsxs("div",{className:"student-header-info",children:[e.jsx("h2",{children:t.name}),e.jsxs("div",{className:"student-badges",children:[e.jsxs("span",{className:"celebration-badge-minimal",children:["📍 ",t.celebration_point]}),t.risk?e.jsxs("span",{className:`status-badge ${t.risk.category.toLowerCase()}`,children:[t.risk.category," Risk"]}):e.jsxs(e.Fragment,{children:[t.alertLevel==="red"&&e.jsx("span",{className:"status-badge red",children:"High Risk"}),t.alertLevel==="yellow"&&e.jsx("span",{className:"status-badge yellow",children:"Moderate Risk"})]}),e.jsx("span",{className:`status-badge ${t.status==="expired"?"red":"healthy"}`,children:t.status})]}),e.jsx("div",{className:"student-email",children:t.email})]}),e.jsxs("div",{className:"student-actions",children:[e.jsxs("a",{href:`mailto:${t.email}`,className:"action-btn",children:[e.jsx("span",{className:"action-icon",children:"✉️"}),e.jsx("span",{className:"action-label",children:"Email"})]}),e.jsxs("button",{className:"action-btn",onClick:()=>d("notes"),children:[e.jsx("span",{className:"action-icon",children:"📝"}),e.jsx("span",{className:"action-label",children:"Note"})]}),e.jsxs("button",{className:"action-btn",onClick:()=>alert("WhatsApp coming soon"),children:[e.jsx("span",{className:"action-icon",children:"💬"}),e.jsx("span",{className:"action-label",children:"Message"})]})]}),e.jsxs("div",{className:"student-tabs",children:[e.jsx("button",{className:`student-tab ${g==="overview"?"active":""}`,onClick:()=>d("overview"),children:"Overview"}),e.jsx("button",{className:`student-tab ${g==="notes"?"active":""}`,onClick:()=>d("notes"),children:"Pastoral Notes"})]}),e.jsx("div",{className:"student-scroll-area",children:g==="overview"?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"student-course-card",children:[e.jsx("h4",{children:"Current Course"}),e.jsx("div",{className:"course-name",children:t.course}),e.jsx("div",{className:"progress-bar-container",style:{height:"8px",background:"rgba(0,0,0,0.05)",borderRadius:"4px",overflow:"hidden"},children:e.jsx("div",{className:"progress-bar-fill",style:{width:`${t.progress}%`,background:f,height:"100%",borderRadius:"4px"}})}),e.jsxs("div",{className:"course-meta",children:[e.jsxs("span",{children:[t.progress,"% Complete"]}),e.jsxs("span",{children:["Last Active: ",new Date(t.lastActivity).toLocaleDateString()]})]})]}),e.jsxs("div",{className:"student-stats-grid",children:[e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-label",children:"Days Inactive"}),e.jsx("div",{className:"stat-value",style:{color:t.daysInactive>14?"var(--warning)":"inherit"},children:t.daysInactive||0})]}),e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-label",children:"Enrolled Date"}),e.jsx("div",{className:"stat-value",style:{fontSize:"14px"},children:t.created_at?new Date(t.created_at).toLocaleDateString():"-"})]})]}),t.risk&&e.jsxs("div",{className:"risk-card glass-card",style:{marginTop:"16px",padding:"16px",borderRadius:"16px",background:"rgba(255,59,48,0.05)",border:"1px solid rgba(255,59,48,0.1)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px",marginBottom:"16px"},children:[e.jsxs("div",{style:{position:"relative"},children:[e.jsx(Gt,{score:100-t.risk.score,size:60,strokeWidth:5}),e.jsx("div",{style:{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:"14px"},children:t.risk.score})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{margin:0,fontSize:"16px",color:"var(--text-primary)"},children:"Risk Intelligence"}),e.jsxs("div",{style:{fontSize:"13px",color:"var(--text-secondary)"},children:["Category: ",e.jsx("span",{style:{fontWeight:600,color:t.risk.category==="Critical"?"#ff3b30":t.risk.category==="Attention"?"#ffcc00":"#34c759"},children:t.risk.category})]})]})]}),e.jsxs("div",{className:"risk-factors",children:[e.jsx(ke,{label:"Login Recency (40%)",value:t.risk.breakdown.recency,max:40,info:`${t.risk.breakdown.daysSinceLogin} days ago`}),e.jsx(ke,{label:"Progress Stagnation (30%)",value:t.risk.breakdown.stagnation,max:30,info:`${t.risk.breakdown.daysSinceActivity} days ago`}),e.jsx(ke,{label:"Completion Rate (20%)",value:t.risk.breakdown.completion,max:20,info:`${t.progress}% done`})]})]})]}):e.jsxs("div",{className:"notes-section",children:[e.jsx("form",{onSubmit:m,style:{marginBottom:"20px"},children:e.jsxs("div",{style:{position:"relative"},children:[e.jsx("textarea",{className:"glass-input student-note-input",placeholder:"Add a new note...",value:o,onChange:z=>n(z.target.value),style:{width:"100%",minHeight:"80px",paddingRight:"40px"}}),e.jsx("button",{type:"submit",className:"student-note-submit",disabled:!o.trim(),children:"➤"})]})}),h?e.jsx("div",{className:"notes-loading",children:"Loading notes..."}):u.length===0?e.jsx("div",{className:"notes-empty",children:"No notes yet."}):e.jsx("div",{className:"notes-timeline",children:u.map(z=>{var N;return e.jsxs("div",{className:"note-item",children:[e.jsx("div",{className:"note-avatar",children:(N=z.author_name)==null?void 0:N.charAt(0)}),e.jsxs("div",{className:"note-content",children:[e.jsxs("div",{className:"note-header",children:[e.jsx("span",{className:"note-author",children:z.author_name}),e.jsx("span",{className:"note-date",children:new Date(z.created_at).toLocaleDateString()})]}),e.jsx("p",{className:"note-text",children:z.content})]})]},z.id)})})]})})]}),e.jsx("style",{children:`
                .student-detail-view {
                    height: 100%; display: flex; flex-direction: column; overflow: hidden;
                    position: relative;
                }
                .student-cover-banner {
                    height: 120px; flex-shrink: 0;
                }
                .student-content-wrapper {
                    flex: 1; display: flex; flex-direction: column;
                    padding: 0 32px 32px;
                    margin-top: -60px;
                    overflow-y: auto;
                }
                .student-avatar {
                    width: 120px; height: 120px; border-radius: 50%;
                    min-width: 120px; flex-shrink: 0;
                    aspect-ratio: 1 / 1; object-fit: cover;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 48px; font-weight: bold; color: white;
                    border: 6px solid var(--glass-bg);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    margin-bottom: 16px;
                }
                .student-header-info { margin-bottom: 24px; }
                .student-header-info h2 {
                    font-size: 28px; font-weight: 700; margin: 0 0 8px 0;
                    letter-spacing: -0.5px;
                }
                .student-email { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

                .student-badges { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
                .celebration-badge-minimal {
                    background: var(--surface-active); color: var(--text-primary);
                    font-size: 12px; padding: 4px 12px; border-radius: 999px;
                    border: 0.5px solid var(--glass-border);
                }
                .status-badge {
                    font-size: 11px; padding: 4px 10px; border-radius: 999px; color: white;
                    font-weight: 500;
                }
                .status-badge.red { background: #ff3b30; }
                .status-badge.yellow { background: #ffcc00; color: black; }
                .status-badge.healthy { background: #34c759; }

                .student-actions {
                    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 32px;
                }
                .action-btn {
                    display: flex; flex-direction: column; alignItems: center; justifyContent: center; gap: 8px;
                    background: var(--surface-hover);
                    border: 0.5px solid var(--glass-border);
                    border-radius: 999px; padding: 12px 20px;
                    color: var(--text-primary); text-decoration: none;
                    transition: all 0.2s; cursor: pointer;
                    height: 64px; /* Reduced height */
                    width: 100%;
                }
                .action-btn:hover {
                    background: var(--surface-active); transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .action-icon { fontSize: 24px; }
                .action-label { fontSize: 12px; fontWeight: 500; }

                .student-tabs {
                    display: flex; background: var(--surface-hover);
                    padding: 4px; border-radius: 999px; margin-bottom: 20px;
                    width: fit-content; align-self: center; // Centered tabs? Or left?
                    width: 100%;
                }
                .student-tab {
                    flex: 1; padding: 8px; background: transparent; border: none;
                    color: var(--text-muted);
                    border-radius: 999px; font-weight: 500; cursor: pointer;
                    transition: all 0.2s; font-size: 13px;
                }
                .student-tab:hover { color: var(--text-primary); }
                .student-tab.active {
                    background: var(--surface-active);
                    color: var(--text-primary);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .student-course-card {
                    background: var(--surface-hover);
                    border-radius: 20px; padding: 20px; margin-bottom: 20px;
                    border: 0.5px solid var(--glass-border);
                }
                .student-course-card h4 {
                    font-size: 12px; text-transform: uppercase; letter-spacing: 1px;
                    color: var(--text-secondary); margin-bottom: 12px;
                }
                .course-name { font-size: 18px; font-weight: 600; margin-bottom: 12px; }
                .course-meta {
                    display: flex; justifyContent: space-between; margin-top: 12px;
                    font-size: 13px; color: var(--text-secondary);
                }

                .student-stats-grid {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
                }
                .stat-card {
                    background: var(--surface-hover);
                    padding: 16px; border-radius: 16px;
                    border: 0.5px solid var(--glass-border);
                }
                .stat-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px; }
                .stat-value { font-size: 20px; font-weight: 600; }

                /* Notes Styles */
                .student-note-input {
                    background: var(--surface-hover);
                    border: 0.5px solid var(--glass-border);
                    border-radius: 18px; padding: 16px;
                    font-family: inherit; color: var(--text-primary);
                }
                .student-note-submit {
                    position: absolute; bottom: 12px; right: 12px;
                    background: var(--accent-color);
                    width: 32px; height: 32px; border-radius: 50%;
                    color: white; border: none; font-size: 14px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: transform 0.2s;
                }
                .student-note-submit:hover { transform: scale(1.1); }
                
                .notes-timeline { display: flex; flex-direction: column; gap: 16px; }
                .note-item { display: flex; gap: 12px; }
                .note-avatar {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: var(--glass-layer-3);
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 600; font-size: 14px;
                }
                .note-content {
                    flex: 1; background: var(--surface-hover);
                    padding: 12px 16px; border-radius: 4px 16px 16px 16px;
                    border: 0.5px solid var(--glass-border);
                }
                .note-header {
                    display: flex; justify-content: space-between;
                    font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;
                }
                .note-author { font-weight: 600; color: var(--text-primary); }
                .note-text { font-size: 14px; line-height: 1.5; margin: 0; white-space: pre-wrap; }

                .risk-factors { display: flex; flex-direction: column; gap: 8px; }
                .risk-factor-row { display: flex; align-items: center; font-size: 12px; gap: 8px; }
                .risk-factor-label { flex: 1; color: var(--text-secondary); }
                .risk-factor-bar-bg { flex: 2; height: 6px; background: rgba(0,0,0,0.1); border-radius: 3px; overflow: hidden; }
                .risk-factor-info { font-size: 10px; color: var(--text-muted); width: 60px; text-align: right; }

                .fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `})]})}function ke({label:t,value:r,max:s,info:g}){const d=Math.min(r/s*100,100);let u="#34c759";return d>50&&(u="#ffcc00"),d>80&&(u="#ff3b30"),e.jsxs("div",{className:"risk-factor-row",children:[e.jsx("span",{className:"risk-factor-label",children:t}),e.jsx("div",{className:"risk-factor-bar-bg",children:e.jsx("div",{style:{width:`${d}%`,height:"100%",background:u,borderRadius:"3px"}})}),e.jsxs("span",{className:"risk-factor-info",children:[g||r,"/",s]})]})}function Ut(){const{user:t,showToast:r}=U(),[s,g]=a.useState("enrolled"),[d,u]=a.useState([]),[c,o]=a.useState(!0),[n,h]=a.useState(!1),[l,p]=a.useState(1),[m,x]=a.useState(!0),i=50,[y,f]=a.useState(""),[z,N]=a.useState(null),[v,k]=a.useState(["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)?"":t==null?void 0:t.celebration_point),[b,_]=a.useState(""),[E,j]=a.useState(""),[L,M]=a.useState(!1),[C,B]=a.useState("all"),W=d.find(A=>(A.id||A.userId)===z)||null;a.useEffect(()=>{O(1,!0)},[s,v,y,E,L,C,b]);const O=async(A,H=!1)=>{H?(o(!0),p(1),x(!0)):h(!0);try{const J=new URLSearchParams({page:A,limit:i,type:s,search:y,celebration_point:v||"",date:E,noCompany:L,source:C,risk:b}),R=await(await fetch(`/api/data/users?${J}`)).json();if(R.success){const I=R.users.map(G=>G.type==="enrolled"||!G.type&&s==="enrolled"?{...G,healthScore:P(G)}:G);u(H?I:G=>[...G,...I]),I.length<i&&x(!1)}else r("Failed to load data","error")}catch(J){console.error("Load error:",J),r("Failed to connect","error")}finally{o(!1),h(!1)}},w=a.useCallback(A=>{const{scrollTop:H,clientHeight:J,scrollHeight:K}=A.target;if(K-H<=J+100&&!c&&!n&&m){const R=l+1;p(R),O(R,!1)}},[c,n,m,l]),P=A=>A.daysInactive>=30?"critical":A.daysInactive>=14?"attention":"healthy",F=async(A,H)=>{if(A.stopPropagation(),!!confirm(`Are you sure you want to enroll ${H.name}?`))try{const K=await(await fetch("/api/thinkific/enroll",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:H.userId})})).json();K.success?(r(`Successfully enrolled ${H.name}`,"success"),O(1,!0)):r(K.message||"Enrollment failed","error")}catch{r("Enrollment failed","error")}};return e.jsxs("div",{className:"students-split-view",children:[e.jsxs("div",{className:"students-sidebar",children:[e.jsxs("div",{className:"sidebar-header",children:[e.jsx("h2",{className:"sidebar-title",children:"Students"}),["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)&&e.jsxs("select",{className:"sidebar-select",value:v,onChange:A=>k(A.target.value),children:[e.jsx("option",{value:"",children:"All Points"}),Z.map(A=>e.jsx("option",{value:A,children:A},A))]}),e.jsxs("div",{className:"sidebar-search-wrapper",children:[e.jsx("span",{className:"search-icon",children:"🔍"}),e.jsx("input",{type:"text",placeholder:"Search",className:"sidebar-search-input",value:y,onChange:A=>f(A.target.value)})]}),e.jsxs("div",{className:"sidebar-tabs",children:[e.jsx("button",{className:`sidebar-tab ${s==="enrolled"?"active":""}`,onClick:()=>g("enrolled"),children:"Enrolled"}),e.jsx("button",{className:`sidebar-tab ${s==="unenrolled"?"active":""}`,onClick:()=>g("unenrolled"),children:"Unenrolled"})]})]}),e.jsx("div",{className:"sidebar-list",onScroll:w,children:c&&d.length===0?e.jsx("div",{className:"sidebar-loading",children:"Loading..."}):d.length===0?e.jsx("div",{className:"sidebar-empty",children:"No students found"}):e.jsxs(e.Fragment,{children:[d.map(A=>{const H=A.id||A.userId,J=H===z,K=A.name?A.name.substring(0,2).toUpperCase():"??";return e.jsxs("div",{className:`sidebar-item ${J?"active":""}`,onClick:()=>N(H),children:[e.jsx("div",{className:"item-avatar",children:K}),e.jsxs("div",{className:"item-content",children:[e.jsx("div",{className:"item-name",children:A.name}),e.jsx("div",{className:"item-subtitle",children:A.email})]}),s==="unenrolled"&&e.jsx("button",{className:"item-action-btn",onClick:R=>F(R,A),title:"Enroll",children:"+"})]},H)}),n&&e.jsx("div",{className:"sidebar-loading-more",children:"Loading more..."})]})}),e.jsxs("div",{className:"sidebar-footer",children:[d.length," Students ",m?"+":""]})]}),e.jsx("div",{className:"students-detail-pane",children:e.jsx(Je,{student:W})}),e.jsx("style",{children:`
                .students-split-view {
                    display: flex; height: calc(100vh - 80px); /* Adjust based on header */
                    background: transparent;
                    border-radius: 12px;
                    overflow: hidden;
                }

                /* SIDEBAR */
                .students-sidebar {
                    width: 320px; flex-shrink: 0;
                    display: flex; flex-direction: column;
                    background: var(--glass-layer-2);
                    backdrop-filter: blur(20px);
                    border-right: 0.5px solid var(--separator);
                }

                .sidebar-header {
                    padding: 16px; display: flex; flex-direction: column; gap: 12px;
                    border-bottom: 0.5px solid var(--separator);
                }

                .sidebar-title {
                    font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0; display: none; /* Hidden title like Contacts */
                }

                .sidebar-select {
                    background: var(--surface-hover); border: none; padding: 6px 12px;
                    border-radius: 6px; font-size: 12px; color: var(--text-primary);
                    width: 100%; outline: none; -webkit-appearance: none;
                }

                .sidebar-search-wrapper { position: relative; }
                .sidebar-search-input {
                    width: 100%; padding: 8px 12px 8px 30px;
                    background: rgba(0,0,0,0.05); border: none;
                    border-radius: 8px; font-size: 13px; color: var(--text-primary);
                    outline: none; transition: background 0.2s;
                }
                .sidebar-search-input:focus { background: rgba(0,0,0,0.1); }
                .search-icon {
                    position: absolute; left: 8px; top: 50%; transform: translateY(-50%);
                    font-size: 12px; opacity: 0.5;
                }

                .sidebar-tabs {
                    display: flex; background: rgba(0,0,0,0.05);
                    padding: 2px; border-radius: 6px;
                }
                .sidebar-tab {
                    flex: 1; border: none; background: transparent;
                    font-size: var(--text-caption-1); font-weight: 500; color: var(--text-secondary);
                    padding: 6px; border-radius: 4px; cursor: pointer;
                    transition: all var(--duration-micro) var(--ease-hover);
                }
                .sidebar-tab.active {
                    background: white; color: black; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                [data-theme="dark"] .sidebar-tab.active { background: #444; color: white; }

                .sidebar-list {
                    flex: 1; overflow-y: auto; padding: 8px 12px;
                }

                .sidebar-item {
                    display: flex; align-items: center; gap: 12px;
                    padding: 6px 10px; border-radius: var(--radius-sm);
                    cursor: pointer; transition: background var(--duration-micro) var(--ease-hover);
                    margin-bottom: 2px;
                }
                .sidebar-item:hover { background: rgba(0,0,0,0.05); }
                /* macOS Finder highlighting */
                .sidebar-item.active { background: rgba(10, 132, 255, 1); color: white; }

                .item-avatar {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: rgba(128,128,128,0.2);
                    display: flex; align-items: center; justify-content: center;
                    font-size: var(--text-caption-2); font-weight: 600; color: var(--text-tertiary);
                }
                .sidebar-item.active .item-avatar { background: rgba(255,255,255,0.25); color: white; }

                .item-content { flex: 1; overflow: hidden; }
                .item-name { font-size: var(--text-callout); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
                .item-subtitle {
                    font-size: var(--text-caption-1); color: var(--text-secondary);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .sidebar-item.active .item-name,
                .sidebar-item.active .item-subtitle { color: white; }

                .item-action-btn {
                    width: 24px; height: 24px; border-radius: 50%;
                    background: rgba(0,0,0,0.1); border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 16px; color: var(--text-secondary);
                }
                .item-action-btn:hover { background: var(--primary); color: white; }
                .sidebar-item.active .item-action-btn { background: rgba(255,255,255,0.2); color: white; }
                .sidebar-item.active .item-action-btn:hover { background: white; color: var(--accent-color); }

                .sidebar-footer {
                    padding: 10px; font-size: 11px; color: var(--text-tertiary);
                    text-align: center; border-top: 0.5px solid var(--separator);
                    background: var(--glass-layer-1);
                }

                .sidebar-loading, .sidebar-empty, .sidebar-loading-more {
                    padding: 20px; text-align: center; font-size: 13px; color: var(--text-secondary);
                }

                /* RIGHT PANE */
                .students-detail-pane {
                    flex: 1; 
                    background: var(--glass-layer-3); /* Solid/Slightly transparent bg */
                    backdrop-filter: blur(40px);
                    position: relative;
                }
            `})]})}function Ht({selectedImage:t,onSelect:r}){const[s,g]=a.useState({}),[d,u]=a.useState(!0),[c,o]=a.useState(null);if(a.useEffect(()=>{fetch("/api/public/profile-images").then(h=>h.json()).then(h=>{h.success&&(g(h.images),Object.keys(h.images).length>0&&o(Object.keys(h.images)[0]))}).catch(h=>console.error("Failed to load profile images",h)).finally(()=>u(!1))},[]),d)return e.jsx("div",{className:"picker-loading",children:"Loading avatars..."});const n=Object.keys(s);return e.jsxs("div",{className:"profile-picker",children:[e.jsx("div",{className:"picker-tabs",children:n.map(h=>e.jsx("button",{onClick:()=>o(h),className:`picker-tab ${c===h?"active":""}`,children:h},h))}),e.jsx("div",{className:"picker-grid-container",children:c&&e.jsx("div",{className:"picker-grid",children:s[c].map((h,l)=>e.jsxs("div",{onClick:()=>r(h),className:`picker-item ${t===h?"active":""}`,children:[e.jsx("img",{src:h,alt:"Avatar",className:"picker-img",onError:p=>{p.target.onerror=null,p.target.style.display="none",p.target.parentNode.classList.add("error"),p.target.parentNode.innerHTML="<span>?</span>"}}),t===h&&e.jsx("div",{className:"picker-check",children:e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"white",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"20 6 9 17 4 12"})})})]},l))})}),e.jsx("style",{children:`
                .profile-picker {
                    display: flex; flex-direction: column; height: 320px;
                    border: 1px solid var(--border-layer-2);
                    border-radius: 12px; overflow: hidden;
                    background: var(--glass-layer-1);
                }
                .picker-loading {
                    padding: 20px; text-align: center; color: var(--text-secondary);
                }
                .picker-tabs {
                    display: flex; overflow-x: auto;
                    background: var(--glass-layer-1);
                    border-bottom: 1px solid var(--border-layer-1);
                    padding: 8px 8px; gap: 4px;
                }
                /* Hide scrollbar */
                .picker-tabs::-webkit-scrollbar { display: none; }
                
                .picker-tab {
                    padding: 6px 12px; white-space: nowrap;
                    background: transparent;
                    color: var(--text-secondary);
                    border: 1px solid transparent; border-radius: 8px;
                    font-size: 12px; font-weight: 500; cursor: pointer;
                    transition: all 0.2s;
                }
                .picker-tab:hover {
                    color: var(--text-primary);
                    background: var(--glass-layer-2);
                }
                .picker-tab.active {
                    background: var(--glass-layer-3);
                    color: var(--text-primary);
                    border-color: var(--border-layer-2);
                    box-shadow: var(--shadow-layer-1);
                }

                .picker-grid-container {
                    flex: 1; padding: 16px; overflow-y: auto;
                    background: var(--glass-layer-2);
                }
                .picker-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
                    gap: 12px;
                }
                .picker-item {
                    aspect-ratio: 1; border-radius: 50%; overflow: hidden; cursor: pointer;
                    border: 3px solid transparent;
                    transition: all 0.2s; position: relative;
                    opacity: 1; background: var(--glass-layer-3);
                }
                .picker-item:hover { transform: scale(1.1); z-index: 2; }
                .picker-item.active {
                    border-color: var(--primary-color);
                    box-shadow: 0 4px 16px rgba(102,126,234,0.3);
                    transform: scale(1.05);
                }
                .picker-img {
                    width: 100%; height: 100%; object-fit: cover;
                }
                .picker-item.error {
                    background: var(--glass-layer-1);
                    display: flex; align-items: center; justify-content: center;
                    color: var(--text-secondary); font-size: 24px;
                }
                .picker-check {
                    position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4);
                    display: flex; align-items: center; justify-content: center;
                }
            `})]})}function Yt(){const{showToast:t,user:r}=U(),s=(r==null?void 0:r.role)==="TechSupport",[g,d]=a.useState([]),[u,c]=a.useState(!0),[o,n]=a.useState(!1),[h,l]=a.useState(null),[p,m]=a.useState({username:"",password:"",name:"",role:"Coordinator",celebration_point:"",profile_image:""});a.useEffect(()=>{x()},[]);const x=async()=>{c(!0);try{const k=await(await fetch("/api/admin/users")).json();if(k.success){let b=k.users||[];s&&(b=b.filter(_=>_.role==="Facilitator")),d(b)}}catch{t("Failed to load users","error")}finally{c(!1)}},i=(v=null)=>{v?(l(v),m({username:v.username,password:"",name:v.name,role:v.role,celebration_point:v.celebration_point||"",profile_image:v.profile_image||""})):(l(null),m({username:"",password:"",name:"",role:s?"Facilitator":"Coordinator",celebration_point:"",profile_image:""})),n(!0)},y=()=>{n(!1),l(null),m({username:"",password:"",name:"",role:"Coordinator",celebration_point:"",profile_image:""})},f=async v=>{if(v.preventDefault(),["Pastor","Coordinator","TechSupport","Facilitator"].includes(p.role)&&!p.celebration_point){t(`${p.role} must be assigned a Celebration Point`,"error");return}try{const b=h?`/api/admin/users/${h.id}`:"/api/admin/users",j=await(await fetch(b,{method:h?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)})).json();j.success?(t(h?"User updated successfully":"User created successfully","success"),y(),x()):t(j.message||"Operation failed","error")}catch{t("Failed to save user","error")}},z=async v=>{if(confirm("Are you sure you want to deactivate this user?"))try{const b=await(await fetch(`/api/admin/users/${v}`,{method:"DELETE"})).json();b.success?(t("User deactivated","success"),x()):t(b.message||"Failed to deactivate user","error")}catch{t("Failed to deactivate user","error")}},N=async v=>{if(confirm(`WARNING: IRREVERSIBLE ACTION

Are you sure you want to PERMANENTLY DELETE this user? This cannot be undone.`))try{const b=await(await fetch(`/api/admin/users/${v}/permanent`,{method:"DELETE"})).json();b.success?(t("User permanently deleted","success"),x()):t(b.message||"Failed to delete user","error")}catch{t("Failed to delete user","error")}};return e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:1200,margin:"0 auto"},children:[e.jsxs("div",{className:"section-header",style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",padding:"16px 24px",borderRadius:20,border:"var(--border-layer-2)",boxShadow:"var(--shadow-layer-2)"},children:[e.jsx("h2",{style:{margin:0,fontSize:22,color:"var(--text-primary)"},children:"User Management"}),e.jsx("button",{className:"btn-primary",onClick:()=>i(),style:{width:"auto",padding:"8px 18px",fontSize:13,boxShadow:"var(--shadow-layer-3)"},children:"+ Add New User"})]}),u?e.jsxs("div",{className:"loading-container",children:[e.jsx("div",{className:"spinner"}),e.jsx("p",{children:"Loading users..."})]}):e.jsx("div",{className:"admin-grid",style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",gap:16},children:g.map(v=>e.jsxs("div",{className:"glass-card user-card",style:{background:"var(--glass-layer-1)",backdropFilter:"var(--blur-layer-2)",border:"var(--border-layer-1)",borderRadius:16,padding:20,display:"flex",flexDirection:"column",gap:16,transition:"transform 0.2s, box-shadow 0.2s, background 0.2s"},onMouseEnter:k=>{k.currentTarget.style.transform="translateY(-4px)",k.currentTarget.style.boxShadow="var(--shadow-layer-3)",k.currentTarget.style.background="var(--glass-layer-2)"},onMouseLeave:k=>{k.currentTarget.style.transform="translateY(0)",k.currentTarget.style.boxShadow="none",k.currentTarget.style.background="var(--glass-layer-1)"},children:[e.jsxs("div",{className:"user-card-header",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsx("div",{className:"user-avatar-small",style:{width:48,height:48,borderRadius:"50%",fontSize:20,background:"linear-gradient(135deg, var(--glass-layer-3), var(--glass-layer-2))",border:"var(--border-layer-2)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-primary)",fontWeight:600,overflow:"hidden",flexShrink:0},children:v.profile_image?e.jsx("img",{src:v.profile_image,alt:v.name,style:{width:"100%",height:"100%",objectFit:"cover"}}):v.name.charAt(0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"user-card-name",style:{fontSize:16,fontWeight:600,color:"var(--text-primary)"},children:v.name}),e.jsx("span",{className:`user-card-role ${v.role.toLowerCase()}`,style:{fontSize:11,padding:"2px 8px",borderRadius:6,background:"var(--glass-layer-3)",color:"var(--text-secondary)",border:"var(--border-layer-1)",display:"inline-block",marginTop:4},children:v.role})]})]}),e.jsxs("div",{className:"user-card-details",style:{background:"var(--glass-layer-2)",borderRadius:10,padding:12,fontSize:13,color:"var(--text-secondary)",border:"var(--border-layer-1)"},children:[e.jsxs("div",{style:{marginBottom:4},children:["Username: ",e.jsx("span",{style:{color:"var(--text-primary)"},children:v.username})]}),v.celebration_point&&e.jsxs("div",{style:{marginBottom:4},children:["Campus: ",e.jsx("span",{style:{color:"var(--text-primary)"},children:v.celebration_point})]}),e.jsxs("div",{children:["Status: ",e.jsx("span",{style:{color:v.active?"#34C759":"#FF3B30"},children:v.active?"Active":"Inactive"})]})]}),e.jsxs("div",{className:"user-card-actions",style:{display:"flex",gap:10,marginTop:"auto"},children:[e.jsx("button",{onClick:()=>i(v),style:{flex:1,padding:"8px",border:"var(--border-layer-2)",background:"var(--glass-layer-2)",color:"var(--text-primary)",fontSize:13,cursor:"pointer",transition:"background 0.2s",fontWeight:500},onMouseEnter:k=>k.target.style.background="var(--glass-layer-3)",onMouseLeave:k=>k.target.style.background="var(--glass-layer-2)",children:"Edit"}),v.active&&e.jsx("button",{onClick:()=>z(v.id),style:{flex:1,padding:"8px",border:"1px solid rgba(255,59,48,0.2)",background:"rgba(255,59,48,0.1)",color:"#ff3b30",fontSize:13,cursor:"pointer",transition:"background 0.2s",fontWeight:500},onMouseEnter:k=>k.target.style.background="rgba(255,59,48,0.2)",onMouseLeave:k=>k.target.style.background="rgba(255,59,48,0.1)",children:"Deactivate"}),!v.active&&!s&&e.jsx("button",{onClick:()=>N(v.id),style:{flex:1,padding:"8px",border:"1px solid rgba(255,59,48,0.4)",background:"rgba(255,59,48,0.2)",color:"#ff3b30",fontSize:13,cursor:"pointer",transition:"background 0.2s",fontWeight:600},onMouseEnter:k=>k.target.style.background="rgba(255,59,48,0.3)",onMouseLeave:k=>k.target.style.background="rgba(255,59,48,0.2)",children:"Delete"})]})]},v.id))}),o&&e.jsx("div",{className:"modal-overlay",onClick:y,style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e4,backdropFilter:"blur(5px)"},children:e.jsxs("div",{className:"glass-card modal",onClick:v=>v.stopPropagation(),style:{width:"800px",maxWidth:"95%",padding:"0",display:"flex",flexDirection:"column",overflow:"hidden",borderRadius:"20px",border:"var(--border-layer-2)",background:"var(--glass-layer-4)",backdropFilter:"var(--blur-layer-4)",boxShadow:"var(--shadow-layer-4)"},children:[e.jsxs("div",{style:{height:"44px",background:"var(--glass-layer-3)",borderBottom:"var(--border-layer-1)",display:"flex",alignItems:"center",padding:"0 16px"},children:[e.jsxs("div",{style:{display:"flex",gap:"8px"},children:[e.jsx("button",{onClick:y,style:{width:"12px",height:"12px",borderRadius:"50%",background:"#ff5f56",border:"1px solid #e0443e",cursor:"pointer"}}),e.jsx("div",{style:{width:"12px",height:"12px",borderRadius:"50%",background:"#ffbd2e",border:"1px solid #dea123"}}),e.jsx("div",{style:{width:"12px",height:"12px",borderRadius:"50%",background:"#27c93f",border:"1px solid #1aab29"}})]}),e.jsx("div",{style:{flex:1,textAlign:"center",fontWeight:"500",color:"var(--text-secondary)",fontSize:"13px"},children:h?"System Preferences - Edit User":"System Preferences - New User"}),e.jsx("div",{style:{width:"52px"}})," "]}),e.jsxs("div",{style:{display:"flex",height:"500px"},children:[e.jsxs("div",{style:{width:"280px",background:"var(--glass-layer-1)",borderRight:"var(--border-layer-1)",padding:"32px 24px",display:"flex",flexDirection:"column",alignItems:"center"},children:[e.jsx("div",{style:{width:"140px",height:"140px",borderRadius:"50%",background:"var(--glass-layer-2)",marginBottom:"24px",border:"4px solid var(--border-layer-2)",overflow:"hidden",boxShadow:"var(--shadow-layer-3)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-secondary)"},children:p.profile_image?e.jsx("img",{src:p.profile_image,alt:"Preview",style:{width:"100%",height:"100%",objectFit:"cover"}}):e.jsx("span",{style:{fontSize:"48px",color:"var(--text-secondary)",opacity:.5},children:"?"})}),e.jsxs("div",{style:{width:"100%"},children:[e.jsx("label",{style:{display:"block",fontSize:"12px",color:"var(--text-secondary)",marginBottom:"12px",textAlign:"center"},children:"Select Avatar"}),e.jsx(Ht,{selectedImage:p.profile_image,onSelect:v=>m({...p,profile_image:v})})]})]}),e.jsx("div",{style:{flex:1,padding:"32px",overflowY:"auto"},children:e.jsxs("form",{onSubmit:f,style:{display:"flex",flexDirection:"column",gap:"24px"},children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",style:{fontSize:"13px",color:"var(--text-secondary)",marginBottom:8,display:"block"},children:"Full Name"}),e.jsx("input",{type:"text",className:"form-input",value:p.name,onChange:v=>m({...p,name:v.target.value}),required:!0,style:{width:"100%",padding:"12px 16px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box"},placeholder:"Joshua Migadde"})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"},children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",style:{fontSize:"13px",color:"var(--text-secondary)",marginBottom:8,display:"block"},children:"Username"}),e.jsx("input",{type:"text",className:"form-input",value:p.username,onChange:v=>m({...p,username:v.target.value}),required:!0,disabled:!!h,style:{width:"100%",padding:"12px 16px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box"},placeholder:"joshua.m"})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",style:{fontSize:"13px",color:"var(--text-secondary)",marginBottom:8,display:"block"},children:"Account Type"}),e.jsx("select",{className:"form-select",value:p.role,onChange:v=>m({...p,role:v.target.value}),style:{width:"100%",padding:"12px 16px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box",appearance:"none"},children:s?e.jsx("option",{value:"Facilitator",children:"Facilitator"}):e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"Coordinator",children:"Coordinator"}),e.jsx("option",{value:"Pastor",children:"Pastor"}),e.jsx("option",{value:"Facilitator",children:"Facilitator"}),e.jsx("option",{value:"TechSupport",children:"Tech Support"}),e.jsx("option",{value:"LeadershipTeam",children:"Leadership Team"}),e.jsx("option",{value:"Admin",children:"Admin"})]})})]})]}),e.jsxs("div",{className:"form-group",children:[e.jsxs("label",{className:"form-label",style:{fontSize:"13px",color:"var(--text-secondary)",marginBottom:8,display:"block"},children:["Password ",h&&e.jsx("span",{style:{opacity:.5},children:"(leave blank to keep current)"})]}),e.jsx("input",{type:"password",className:"form-input",value:p.password,onChange:v=>m({...p,password:v.target.value}),required:!h,style:{width:"100%",padding:"12px 16px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box"},placeholder:"••••••••"})]}),["Pastor","Coordinator","TechSupport","Facilitator"].includes(p.role)&&e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",style:{fontSize:"13px",color:"var(--text-secondary)",marginBottom:8,display:"block"},children:"Assigned Celebration Point"}),e.jsxs("select",{className:"form-select",value:p.celebration_point,onChange:v=>m({...p,celebration_point:v.target.value}),required:!0,style:{width:"100%",padding:"12px 16px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box",appearance:"none"},children:[e.jsx("option",{value:"",children:"Select Celebration Point..."}),Z.map(v=>e.jsx("option",{value:v,children:v},v))]})]}),e.jsx("div",{style:{flex:1}}),e.jsxs("div",{style:{display:"flex",justifyContent:"flex-end",gap:"12px",paddingTop:"24px",borderTop:"var(--border-layer-1)"},children:[e.jsx("button",{type:"button",onClick:y,style:{padding:"10px 20px",borderRadius:10,cursor:"pointer",border:"var(--border-layer-2)",background:"transparent",color:"var(--text-primary)",fontSize:13,fontWeight:500},children:"Cancel"}),e.jsx("button",{type:"submit",className:"btn-primary",style:{padding:"10px 24px",borderRadius:10,fontSize:13,boxShadow:"var(--shadow-layer-2)"},children:h?"Save Changes":"Create Account"})]})]})})]})]})})]})}function qt({logs:t,isOpen:r,onClose:s}){const[g,d]=a.useState(null),[u,c]=a.useState(-1),o=a.useRef(null);if(!r||!(t!=null&&t.length))return null;const n={};t.forEach(i=>{const y=new Date(i.created_at).toLocaleDateString();n[y]||(n[y]=[]),n[y].push(i)});const h=Object.keys(n).sort((i,y)=>new Date(y)-new Date(i)),l=g||h[0],p=n[l]||[],m={LOGIN:"#30d158",LOGOUT:"#64748b",CREATE:"#007aff",UPDATE:"#ffd60a",DELETE:"#ff453a",IMPORT:"#bf5af2",EXPORT:"#06b6d4"},x=i=>{const y=Object.keys(m).find(f=>i==null?void 0:i.toUpperCase().includes(f));return m[y]||"#667eea"};return e.jsxs("div",{className:"tm-overlay",onClick:s,children:[e.jsxs("div",{className:"tm-container",onClick:i=>i.stopPropagation(),children:[e.jsxs("div",{className:"tm-header",children:[e.jsxs("div",{className:"tm-header-left",children:[e.jsx("span",{className:"tm-icon",children:"⏰"}),e.jsx("h3",{children:"Time Machine"})]}),e.jsxs("span",{className:"tm-subtitle",children:[t.length," events · ",h.length," days"]}),e.jsx("button",{className:"tm-close",onClick:s,children:"×"})]}),e.jsx("div",{className:"tm-timeline",ref:o,children:e.jsx("div",{className:"tm-timeline-track",children:h.map((i,y)=>{const f=n[i].length,z=i===l;return e.jsxs("button",{className:`tm-date-marker ${z?"active":""}`,onClick:()=>d(i),title:`${i} — ${f} events`,children:[e.jsx("div",{className:"tm-marker-dot",style:{width:Math.min(12,4+f),height:Math.min(12,4+f)}}),e.jsx("span",{className:"tm-marker-date",children:new Date(i).toLocaleDateString("en-US",{month:"short",day:"numeric"})}),e.jsx("span",{className:"tm-marker-count",children:f})]},i)})})}),e.jsxs("div",{className:"tm-events",children:[e.jsxs("div",{className:"tm-events-header",children:[e.jsx("strong",{children:l}),e.jsxs("span",{children:[p.length," events"]})]}),e.jsx("div",{className:"tm-events-list",children:p.map((i,y)=>e.jsxs("div",{className:`tm-event ${u===y?"tm-event-hover":""}`,onMouseEnter:()=>c(y),onMouseLeave:()=>c(-1),children:[e.jsx("div",{className:"tm-event-time",children:new Date(i.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}),e.jsxs("div",{className:"tm-event-line",children:[e.jsx("div",{className:"tm-event-dot",style:{background:x(i.action)}}),y<p.length-1&&e.jsx("div",{className:"tm-event-connector"})]}),e.jsxs("div",{className:"tm-event-content",children:[e.jsxs("div",{className:"tm-event-action",children:[e.jsx("span",{className:"tm-action-badge",style:{background:x(i.action)+"22",color:x(i.action),borderColor:x(i.action)+"44"},children:i.action}),e.jsx("span",{className:"tm-event-user",children:i.user_name})]}),e.jsx("div",{className:"tm-event-details",children:i.details})]})]},i.id||y))})]})]}),e.jsx("style",{children:`
                .tm-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(40px) saturate(160%);
                    -webkit-backdrop-filter: blur(40px) saturate(160%);
                    z-index: 10003;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: tmFadeIn 0.25s ease-out;
                }
                [data-theme="light"] .tm-overlay {
                    background: rgba(255,255,255,0.3);
                    backdrop-filter: blur(40px) saturate(180%);
                }
                @keyframes tmFadeIn { from { opacity: 0; } to { opacity: 1; } }

                .tm-container {
                    width: 760px;
                    max-width: 95vw;
                    max-height: 85vh;
                    background: var(--glass-layer-2);
                    backdrop-filter: var(--blur-layer-2);
                    -webkit-backdrop-filter: var(--blur-layer-2);
                    border-radius: 20px;
                    border: var(--border-layer-2);
                    box-shadow: var(--shadow-layer-4);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    animation: tmScale 0.3s var(--ease-spring);
                }
                /* Inner rim light */
                .tm-container::after {
                    content: ''; position: absolute; inset: 0; border-radius: 20px; padding: 1px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
                }
                @keyframes tmScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

                .tm-header {
                    display: flex;
                    align-items: center;
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--separator);
                    gap: 16px;
                    background: rgba(0,0,0,0.02);
                }
                .tm-header-left { display: flex; align-items: center; gap: 10px; flex: 1; }
                .tm-icon { font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
                .tm-header h3 { 
                    font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0; 
                }
                .tm-subtitle { 
                    font-size: 12px; color: var(--text-tertiary); 
                    background: rgba(128,128,128,0.1); padding: 4px 10px; border-radius: 20px;
                }
                .tm-close {
                    background: none; border: none; color: var(--text-tertiary);
                    font-size: 20px; cursor: pointer; line-height: 1;
                    width: 28px; height: 28px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                }
                .tm-close:hover { background: rgba(128,128,128,0.15); color: var(--text-primary); }

                .tm-timeline {
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--separator);
                    overflow-x: auto;
                    background: rgba(0,0,0,0.02);
                }
                .tm-timeline-track {
                    display: flex;
                    gap: 8px;
                    min-width: max-content;
                    padding-bottom: 4px;
                }
                .tm-date-marker {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    cursor: pointer;
                    transition: all 0.2s var(--ease-smooth);
                    min-width: 56px;
                }
                [data-theme="light"] .tm-date-marker {
                    background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.05);
                }
                .tm-date-marker:hover { transform: translateY(-2px); background: rgba(255,255,255,0.08); }
                [data-theme="light"] .tm-date-marker:hover { background: rgba(0,0,0,0.06); }

                .tm-date-marker.active {
                    background: var(--primary);
                    border-color: var(--primary-light);
                    box-shadow: 0 4px 12px rgba(99,102,241,0.3);
                }
                .tm-date-marker.active .tm-marker-date,
                .tm-date-marker.active .tm-marker-count { color: white !important; }
                
                .tm-marker-dot {
                    border-radius: 50%;
                    background: var(--text-tertiary);
                    transition: all 0.2s;
                }
                .tm-date-marker.active .tm-marker-dot { background: white; box-shadow: 0 0 8px rgba(255,255,255,0.5); }
                
                .tm-marker-date { font-size: 10px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; }
                .tm-marker-count { font-size: 9px; color: var(--text-tertiary); }

                .tm-events { flex: 1; overflow-y: auto; padding: 0; scroll-behavior: smooth; }
                .tm-events-header {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 24px;
                    font-size: 13px;
                    color: var(--text-secondary);
                    position: sticky;
                    top: 0;
                    background: var(--glass-layer-2);
                    backdrop-filter: blur(16px);
                    z-index: 5;
                    border-bottom: 1px solid var(--separator);
                }
                .tm-events-header strong { color: var(--text-primary); }

                .tm-events-list { padding: 12px 24px 24px; }

                .tm-event {
                    display: flex;
                    gap: 16px;
                    padding: 10px 12px;
                    transition: all 0.2s;
                    border-radius: 10px;
                    border: 1px solid transparent;
                }
                .tm-event-hover { 
                    background: var(--surface-hover); 
                    border-color: var(--separator);
                }

                .tm-event-time {
                    width: 54px;
                    font-size: 11px;
                    color: var(--text-tertiary);
                    padding-top: 4px;
                    text-align: right;
                    flex-shrink: 0;
                    font-feature-settings: "tnum";
                }

                .tm-event-line {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 16px;
                    flex-shrink: 0;
                }
                .tm-event-dot {
                    width: 10px; height: 10px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    margin-top: 5px;
                    box-shadow: 0 0 0 2px var(--glass-layer-2);
                    z-index: 2;
                }
                .tm-event-connector {
                    width: 2px;
                    flex: 1;
                    background: var(--separator);
                    min-height: 20px;
                    margin-top: -2px;
                    margin-bottom: -10px;
                }

                .tm-event-content { flex: 1; min-width: 0; padding-top: 1px; }
                .tm-event-action { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
                .tm-action-badge {
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 6px;
                    border: 1px solid;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .tm-event-user { font-size: 13px; font-weight: 500; color: var(--text-primary); }
                
                .tm-event-details {
                    font-size: 12px;
                    color: var(--text-secondary);
                    line-height: 1.5;
                }
            `})]})}function Jt(){const{user:t,showToast:r}=U(),s=Q(),[g,d]=a.useState([]),[u,c]=a.useState(!0),[o,n]=a.useState(""),[h,l]=a.useState(!1);a.useEffect(()=>{if(t&&t.role!=="Admin"){r("Access denied","error"),s("/dashboard");return}p()},[t,s]);const p=async()=>{c(!0);try{const i=await(await fetch("/api/admin/audit")).json();i.success?d(i.logs):r(i.message||"Failed to fetch logs","error")}catch(x){console.error("Fetch audit logs error:",x),r("Failed to connect to server","error")}finally{c(!1)}},m=g.filter(x=>x.user_name.toLowerCase().includes(o.toLowerCase())||x.details.toLowerCase().includes(o.toLowerCase())||x.action.toLowerCase().includes(o.toLowerCase()));return e.jsxs("div",{className:"tahoe-page",children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"},children:[e.jsx("h1",{style:{fontSize:"24px",fontWeight:"bold"},children:"Audit Logs"}),e.jsxs("div",{style:{display:"flex",gap:"12px"},children:[e.jsx("input",{type:"text",placeholder:"Search logs...",className:"glass-input",value:o,onChange:x=>n(x.target.value),style:{width:"250px"}}),e.jsx("button",{className:"btn-secondary",onClick:()=>l(!0),style:{background:"linear-gradient(135deg, #667eea, #764ba2)",color:"white",border:"none"},children:"⏰ Time Machine"}),e.jsx("button",{className:"btn-secondary",onClick:p,children:"🔄 Refresh"})]})]}),e.jsx("div",{className:"glass-card",style:{padding:"0",overflow:"hidden"},children:u?e.jsxs("div",{className:"loading-container",children:[e.jsx("div",{className:"spinner"}),e.jsx("p",{children:"Loading audit trail..."})]}):e.jsx("div",{className:"table-container",style:{maxHeight:"calc(100vh - 250px)",overflowY:"auto"},children:e.jsxs("table",{className:"data-table",children:[e.jsx("thead",{style:{position:"sticky",top:0,background:"var(--card-bg)",zIndex:10},children:e.jsxs("tr",{children:[e.jsx("th",{children:"Timestamp"}),e.jsx("th",{children:"User"}),e.jsx("th",{children:"Role"}),e.jsx("th",{children:"Action"}),e.jsx("th",{children:"Details"})]})}),e.jsx("tbody",{children:m.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:"5",style:{textAlign:"center",padding:"32px",color:"var(--text-secondary)"},children:"No logs found."})}):m.map(x=>e.jsxs("tr",{children:[e.jsx("td",{style:{fontSize:"13px",color:"var(--text-secondary)"},children:new Date(x.created_at).toLocaleString()}),e.jsx("td",{children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[e.jsx("div",{style:{width:"24px",height:"24px",borderRadius:"50%",background:"var(--accent-gradient)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"bold",color:"white"},children:x.user_name.charAt(0)}),x.user_name]})}),e.jsx("td",{children:e.jsx("span",{className:"status-badge",style:{background:x.role==="Admin"?"rgba(255, 59, 48, 0.2)":"rgba(10, 132, 255, 0.2)",color:x.role==="Admin"?"var(--error)":"var(--info)"},children:x.role})}),e.jsx("td",{style:{fontWeight:"600"},children:x.action}),e.jsx("td",{style:{color:"var(--text-secondary)"},children:x.details})]},x.id))})]})})}),e.jsx(qt,{logs:m,isOpen:h,onClose:()=>l(!1)})]})}function Kt(){const{user:t,showToast:r}=U(),s=Q(),[g,d]=a.useState(!1),[u,c]=a.useState(["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)?"":t==null?void 0:t.celebration_point);a.useEffect(()=>{t&&t.role==="Coordinator"&&(r("Access denied","error"),s("/dashboard"))},[t,s]);const o=async n=>{d(!0);try{const h=new URLSearchParams;u&&h.append("celebration_point",u);const p=await(await fetch(`/api/data/students?${h}`)).json();if(!p.success)throw new Error(p.message);const m=p.students,x=p.stats,i=new yt,y=i.internal.pageSize.getWidth();i.setFontSize(22),i.setTextColor(99,102,241),i.text(`${n} Report`,y/2,20,{align:"center"}),i.setFontSize(14),i.setTextColor(60,60,60),i.text(`Location: ${u||"All Locations"}`,y/2,30,{align:"center"}),i.text(`Date: ${new Date().toLocaleDateString()}`,y/2,38,{align:"center"});let f=50;i.setFontSize(16),i.setTextColor(0,0,0),i.text("Executive Summary",20,f),f+=10,i.setFontSize(11),i.setTextColor(60,60,60),i.text(`Total Students: ${x.totalStudents}`,20,f),i.text(`Course Completion: ${Math.round(x.completedCourses/(x.totalStudents||1)*100)}%`,100,f),f+=8,i.text(`Active Students: ${x.activeCourses}`,20,f),i.text(`Average Progress: ${x.averageProgress}%`,100,f),f+=15,i.setFontSize(16),i.setTextColor(0,0,0),i.text("Engagement & Risks",20,f),f+=10;const z=m.filter(v=>v.alertLevel==="red").length,N=m.filter(v=>v.alertLevel==="yellow").length;if(i.setFontSize(11),i.setTextColor(60,60,60),i.text(`High Risk (Inactive > 30d): ${z} students`,20,f),f+=8,i.text(`Moderate Risk (Inactive > 14d): ${N} students`,20,f),f+=15,n==="Risk Assessment"){i.setFontSize(16),i.setTextColor(0,0,0),i.text("At-Risk Students",20,f),f+=10;const v=m.filter(k=>k.alertLevel==="red"||k.alertLevel==="yellow");v.forEach(k=>{f>270&&(i.addPage(),f=20),i.setFontSize(10),i.text(`• ${k.name} (${k.daysInactive} days inactive) - ${k.course}`,20,f),f+=6}),v.length===0&&i.text("No at-risk students found.",20,f)}else i.setFontSize(16),i.setTextColor(0,0,0),i.text("Course Performance",20,f),f+=10,i.setFontSize(10),i.text("Detailed course breakdown available in Dashboard view.",20,f);i.save(`${n.replace(/\s+/g,"_")}_${new Date().toISOString().split("T")[0]}.pdf`),r("Report generated successfully","success")}catch(h){console.error("Report error:",h),r("Failed to generate report","error")}finally{d(!1)}};return e.jsxs("div",{className:"tahoe-page",children:[e.jsxs("div",{style:{marginBottom:"24px"},children:[e.jsx("h1",{style:{fontSize:"24px",fontWeight:"bold"},children:"Reports Center"}),e.jsx("p",{style:{color:"var(--text-secondary)"},children:"Generate and export detailed performance reports."})]}),["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)&&e.jsxs("div",{style:{marginBottom:"24px"},children:[e.jsx("label",{style:{marginRight:"12px",fontSize:"14px"},children:"Select Location:"}),e.jsxs("select",{className:"filter-select",value:u,onChange:n=>c(n.target.value),style:{minWidth:"250px"},children:[e.jsx("option",{value:"",children:"All Locations"}),Z.map(n=>e.jsx("option",{value:n,children:n},n))]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",gap:"24px"},children:[e.jsx("div",{className:"glass-card",children:e.jsxs("div",{style:{padding:"24px"},children:[e.jsx("div",{style:{fontSize:"48px",marginBottom:"16px"},children:"📊"}),e.jsx("h3",{style:{fontSize:"18px",marginBottom:"8px"},children:"Monthly Overview"}),e.jsx("p",{style:{color:"var(--text-secondary)",fontSize:"14px",marginBottom:"24px"},children:"Comprehensive summary of student enrollment, course completion rates, and overall progress for the selected location."}),e.jsx("button",{className:"btn-primary",style:{width:"100%"},onClick:()=>o("Monthly Overview"),disabled:g,children:g?"Generating...":"Download PDF"})]})}),e.jsx("div",{className:"glass-card",children:e.jsxs("div",{style:{padding:"24px"},children:[e.jsx("div",{style:{fontSize:"48px",marginBottom:"16px"},children:"⚠️"}),e.jsx("h3",{style:{fontSize:"18px",marginBottom:"8px"},children:"Risk Assessment"}),e.jsx("p",{style:{color:"var(--text-secondary)",fontSize:"14px",marginBottom:"24px"},children:"Detailed list of inactive students and engagement risks to prioritize pastoral follow-up and intervention."}),e.jsx("button",{className:"btn-secondary",style:{width:"100%"},onClick:()=>o("Risk Assessment"),disabled:g,children:g?"Generating...":"Download PDF"})]})}),e.jsx("div",{className:"glass-card",style:{opacity:.7},children:e.jsxs("div",{style:{padding:"24px"},children:[e.jsx("div",{style:{fontSize:"48px",marginBottom:"16px"},children:"👥"}),e.jsx("h3",{style:{fontSize:"18px",marginBottom:"8px"},children:"Coordinator Performance"}),e.jsx("p",{style:{color:"var(--text-secondary)",fontSize:"14px",marginBottom:"24px"},children:"analysis of coordinator engagement and student success rates by location."}),e.jsx("button",{className:"btn-secondary",style:{width:"100%"},disabled:!0,children:"Coming Soon"})]})})]})]})}function Vt(){const{user:t,showToast:r}=U(),[s,g]=a.useState(null),[d,u]=a.useState(!1),[c,o]=a.useState(!1),[n,h]=a.useState(null),[l,p]=a.useState(null),m=a.useRef(null),x=j=>{const L=j.split(/\r?\n/).filter(W=>W.trim());if(L.length<2)return[];const M=L[0].split(",").map(W=>W.trim().replace(/^"|"$/g,"").toLowerCase()),C={firstname:"firstName","first name":"firstName",lastname:"lastName","last name":"lastName",email:"email","email address":"email",celebrationpoint:"celebrationPoint","celebration point":"celebrationPoint",campus:"celebrationPoint",company:"celebrationPoint"},B=M.map(W=>C[W]||W);return L.slice(1).map(W=>{W.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);const O=W.split(",").map(P=>P.trim().replace(/^"|"$/g,"")),w={};return B.forEach((P,F)=>{w[P]=O[F]||""}),w}).filter(W=>W.email)},i=j=>{const L=j.target.files[0];L&&(g(L),h(null),p(null))},[y,f]=a.useState("ALL"),z=async()=>{if(s){u(!0);try{const j=await s.text(),L=x(j);if(L.length===0){r("No valid users found in CSV","error"),u(!1);return}const C=await(await fetch("/api/import/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({users:L})})).json();if(C.success){h(C.analysis);const B=C.analysis.some(W=>W.status==="NEW");f(B?"NEW":"ALL")}else r(C.message||"Analysis failed","error")}catch(j){console.error(j),r("Failed to analyze file","error")}finally{u(!1)}}},[N,v]=a.useState(0),k=async j=>{if(!n)return;const L=n.filter(M=>(j==="ALL"||M.status===j)&&M.action);if(L.length===0){r("No users to process for this action","info");return}if(confirm(`Are you sure you want to process ${L.length} users? This might take a while.`)){o(!0),v(0);try{const C=await(await fetch("/api/import/execute",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({operations:L})})).json();if(C.success&&C.jobId){const B=C.jobId;r("Import job started","info");const W=setInterval(async()=>{try{const w=await(await fetch(`/api/import/status/${B}`)).json();w.success&&(v(w.progress),w.status==="completed"?(clearInterval(W),p(w.result),r("Processed all users","success"),o(!1)):w.status==="failed"&&(clearInterval(W),r(`Job failed: ${w.error}`,"error"),o(!1)))}catch(O){console.error("Polling error",O)}},1e3)}else r("Execution failed to start","error"),o(!1)}catch{r("Failed to execute operations","error"),o(!1)}}},b=(j,L)=>{if(!j||j.length===0)return;const M=Object.keys(j[0]),C=[M.join(","),...j.map(w=>M.map(P=>JSON.stringify(w[P])).join(","))].join(`
`),B=new Blob([C],{type:"text/csv;charset=utf-8;"}),W=URL.createObjectURL(B),O=document.createElement("a");O.href=W,O.download=L,O.click()},_=n?{new:n.filter(j=>j.status==="NEW").length,unenrolled:n.filter(j=>j.status==="UNENROLLED").length,missing:n.filter(j=>j.status==="MISSING_INFO").length,enrolled:n.filter(j=>j.status==="ENROLLED").length}:null,E=n?n.filter(j=>y==="ALL"||j.status===y):[];return(t==null?void 0:t.role)!=="Admin"?e.jsxs("div",{className:"tahoe-page tahoe-finder-window",children:[e.jsx("h1",{className:"page-title",children:"Batch Import Tool"}),e.jsxs("div",{className:"portal-main glass-card",style:{padding:"60px 24px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:"20px"},children:[e.jsx("span",{style:{fontSize:"64px"},children:"🚫"}),e.jsx("h2",{style:{color:"var(--text-primary)",margin:0},children:"Access Denied"}),e.jsx("p",{style:{color:"var(--text-secondary)",maxWidth:"400px",margin:0},children:"This tool is restricted to System Administrators only. Please contact your IT department if you believe this is an error."}),e.jsx("button",{className:"btn-secondary",onClick:()=>window.history.back(),style:{marginTop:"12px"},children:"Go Back"})]})]}):e.jsxs("div",{className:"tahoe-page tahoe-finder-window",children:[e.jsx("h1",{className:"page-title",children:"Batch Import Tool"}),e.jsxs("div",{className:"portal-main glass-card",style:{padding:"24px",display:"flex",flexDirection:"column",gap:"24px"},children:[!n&&!l&&e.jsxs("div",{style:{border:"2px dashed rgba(255,255,255,0.2)",borderRadius:"12px",padding:"40px",textAlign:"center",cursor:"pointer",background:"rgba(0,0,0,0.1)"},onClick:()=>m.current.click(),children:[e.jsx("span",{style:{fontSize:"48px",display:"block",marginBottom:"16px"},children:"📂"}),e.jsx("h3",{style:{margin:"0 0 8px 0",color:"#fff"},children:"Upload CSV File"}),e.jsxs("p",{style:{color:"#94a3b8",fontSize:"14px",margin:0},children:["Drag and drop or click to browse",e.jsx("br",{}),"Headers: First Name, Last Name, Email, Celebration Point"]}),e.jsx("input",{type:"file",accept:".csv",ref:m,style:{display:"none"},onChange:i}),s&&e.jsxs("div",{style:{marginTop:"20px",display:"inline-block",background:"rgba(16, 185, 129, 0.2)",padding:"8px 16px",borderRadius:"8px",color:"#6ee7b7"},children:["✅ ",s.name]}),s&&e.jsx("div",{style:{marginTop:"20px"},children:e.jsx("button",{className:"btn-primary",onClick:j=>{j.stopPropagation(),z()},disabled:d,children:d?"Analyzing...":"Analyze File"})})]}),n&&!l&&e.jsxs("div",{className:"fade-in",children:[e.jsxs("div",{style:{display:"flex",gap:"20px",marginBottom:"20px"},children:[e.jsxs("div",{className:`stat-card ${y==="NEW"?"active":""}`,onClick:()=>f("NEW"),style:{flex:1,background:"rgba(59, 130, 246, 0.2)",padding:"16px",borderRadius:"12px",cursor:"pointer",border:y==="NEW"?"2px solid #3b82f6":"2px solid transparent"},children:[e.jsx("div",{style:{fontSize:"12px",color:"#93c5fd"},children:"New Students"}),e.jsx("div",{style:{fontSize:"24px",fontWeight:600,color:"#fff"},children:_.new}),e.jsx("div",{style:{fontSize:"11px",color:"rgba(255,255,255,0.6)",marginTop:"4px"},children:"Click to review"})]}),e.jsxs("div",{className:`stat-card ${y==="UNENROLLED"?"active":""}`,onClick:()=>f("UNENROLLED"),style:{flex:1,background:"rgba(16, 185, 129, 0.2)",padding:"16px",borderRadius:"12px",cursor:"pointer",border:y==="UNENROLLED"?"2px solid #10b981":"2px solid transparent"},children:[e.jsx("div",{style:{fontSize:"12px",color:"#6ee7b7"},children:"Unenrolled"}),e.jsx("div",{style:{fontSize:"24px",fontWeight:600,color:"#fff"},children:_.unenrolled}),e.jsx("div",{style:{fontSize:"11px",color:"rgba(255,255,255,0.6)",marginTop:"4px"},children:"Click to review"})]}),e.jsxs("div",{className:`stat-card ${y==="MISSING_INFO"?"active":""}`,onClick:()=>f("MISSING_INFO"),style:{flex:1,background:"rgba(245, 158, 11, 0.2)",padding:"16px",borderRadius:"12px",cursor:"pointer",border:y==="MISSING_INFO"?"2px solid #f59e0b":"2px solid transparent"},children:[e.jsx("div",{style:{fontSize:"12px",color:"#fcd34d"},children:"Missing Info"}),e.jsx("div",{style:{fontSize:"24px",fontWeight:600,color:"#fff"},children:_.missing}),e.jsx("div",{style:{fontSize:"11px",color:"rgba(255,255,255,0.6)",marginTop:"4px"},children:"Click to review"})]}),e.jsxs("div",{className:`stat-card ${y==="ALL"?"active":""}`,onClick:()=>f("ALL"),style:{flex:1,background:"rgba(255, 255, 255, 0.05)",padding:"16px",borderRadius:"12px",cursor:"pointer",border:y==="ALL"?"2px solid rgba(255,255,255,0.3)":"2px solid transparent"},children:[e.jsx("div",{style:{fontSize:"12px",color:"#94a3b8"},children:"All Rows"}),e.jsx("div",{style:{fontSize:"24px",fontWeight:600,color:"#fff"},children:n.length}),e.jsx("div",{style:{fontSize:"11px",color:"rgba(255,255,255,0.6)",marginTop:"4px"},children:"Show everything"})]})]}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("button",{className:"btn-secondary",onClick:()=>h(null),children:"← Upload New File"}),e.jsxs("span",{style:{fontSize:"14px",color:"#94a3b8"},children:["Showing: ",e.jsx("b",{style:{color:"#fff"},children:y==="ALL"?"All Rows":y})," (",E.length,")"]})]}),e.jsxs("div",{style:{display:"flex",gap:"12px"},children:[y==="NEW"&&_.new>0&&e.jsxs("button",{className:"btn-primary",onClick:()=>k("NEW"),style:{background:"#3b82f6"},children:["Create & Enroll ",_.new," Students"]}),y==="UNENROLLED"&&_.unenrolled>0&&e.jsxs("button",{className:"btn-primary",onClick:()=>k("UNENROLLED"),style:{background:"#10b981"},children:["Enroll ",_.unenrolled," Existing Users"]}),y==="MISSING_INFO"&&_.missing>0&&e.jsxs("button",{className:"btn-primary",onClick:()=>k("MISSING_INFO"),style:{background:"#f59e0b"},children:["fix & Enroll ",_.missing," Users"]}),y==="ALL"&&_.new+_.unenrolled+_.missing>0&&e.jsxs("button",{className:"btn-primary",onClick:()=>k("ALL"),style:{background:"#8b5cf6"},children:["Process All Actions (",_.new+_.unenrolled+_.missing,")"]})]})]}),e.jsx("div",{className:"table-container",style:{maxHeight:"400px",overflowY:"auto",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px"},children:e.jsxs("table",{className:"tahoe-table",style:{width:"100%"},children:[e.jsx("thead",{style:{position:"sticky",top:0,background:"rgba(30,41,59,0.95)"},children:e.jsxs("tr",{children:[e.jsx("th",{style:{padding:"12px",textAlign:"left"},children:"Name"}),e.jsx("th",{style:{padding:"12px",textAlign:"left"},children:"Email"}),e.jsx("th",{style:{padding:"12px",textAlign:"left"},children:"Celebration Point"}),e.jsx("th",{style:{padding:"12px",textAlign:"left"},children:"Status"}),e.jsx("th",{style:{padding:"12px",textAlign:"left"},children:"Proposed Action"})]})}),e.jsx("tbody",{children:E.length>0?E.map((j,L)=>e.jsxs("tr",{style:{borderBottom:"1px solid rgba(255,255,255,0.05)"},children:[e.jsxs("td",{style:{padding:"12px"},children:[j.firstName," ",j.lastName]}),e.jsx("td",{style:{padding:"12px",color:"#94a3b8"},children:j.email}),e.jsx("td",{style:{padding:"12px",color:"#94a3b8"},children:j.celebrationPoint}),e.jsx("td",{style:{padding:"12px"},children:e.jsx("span",{className:"status-badge",style:{padding:"2px 8px",borderRadius:"4px",fontSize:"10px",background:j.status==="NEW"?"rgba(59, 130, 246, 0.2)":j.status==="UNENROLLED"?"rgba(16, 185, 129, 0.2)":j.status==="MISSING_INFO"?"rgba(245, 158, 11, 0.2)":"rgba(255,255,255,0.05)",color:j.status==="NEW"?"#93c5fd":j.status==="UNENROLLED"?"#6ee7b7":j.status==="MISSING_INFO"?"#fcd34d":"#94a3b8"},children:j.status})}),e.jsx("td",{style:{padding:"12px",fontSize:"11px",color:"#94a3b8"},children:j.action||"-"})]},L)):e.jsx("tr",{children:e.jsxs("td",{colSpan:"5",style:{padding:"40px",textAlign:"center",color:"#64748b"},children:["No users found with status: ",y]})})})]})})]}),l&&e.jsxs("div",{className:"fade-in",children:[e.jsxs("div",{style:{textAlign:"center",marginBottom:"24px"},children:[e.jsx("div",{style:{fontSize:"48px",marginBottom:"16px"},children:"🎉"}),e.jsx("h2",{style:{color:"#fff"},children:"Processing Complete"}),e.jsxs("p",{style:{color:"#94a3b8"},children:["Successfully processed ",l.filter(j=>j.success).length," users.",e.jsx("br",{}),"Failed: ",l.filter(j=>!j.success).length]})]}),e.jsxs("div",{style:{display:"flex",gap:"12px",justifyContent:"center",marginBottom:"24px"},children:[e.jsx("button",{className:"btn-secondary",onClick:()=>b(l,"import_results.csv"),children:"Download Report"}),e.jsx("button",{className:"btn-primary",onClick:()=>{p(null),h(null),g(null)},children:"Start Over"})]}),l.some(j=>!j.success)&&e.jsxs("div",{style:{background:"rgba(239, 68, 68, 0.1)",padding:"16px",borderRadius:"12px"},children:[e.jsx("h4",{style:{margin:"0 0 12px 0",color:"#fca5a5"},children:"Errors"}),e.jsx("ul",{style:{margin:0,paddingLeft:"20px",color:"#fca5a5",fontSize:"13px"},children:l.filter(j=>!j.success).map((j,L)=>e.jsxs("li",{children:[j.email,": ",j.message]},L))})]})]}),c&&e.jsxs("div",{style:{position:"absolute",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:"16px",zIndex:50},children:[e.jsx("div",{className:"spinner",style:{marginBottom:"16px"}}),e.jsx("div",{style:{color:"#fff",marginBottom:"8px"},children:"Processing... please wait"}),e.jsx("div",{style:{width:"200px",height:"6px",background:"rgba(255,255,255,0.2)",borderRadius:"3px",overflow:"hidden"},children:e.jsx("div",{style:{width:`${N}%`,height:"100%",background:"#3b82f6",transition:"width 0.3s ease"}})}),e.jsxs("div",{style:{color:"#94a3b8",fontSize:"12px",marginTop:"4px"},children:[N,"%"]})]})]})]})}function Qt(){const{user:t,showToast:r}=U(),[s,g]=a.useState([]),[d,u]=a.useState(!0),[c,o]=a.useState(null),[n,h]=a.useState(null),[l,p]=a.useState(!1),[m,x]=a.useState(["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)?"":t==null?void 0:t.celebration_point),[i,y]=a.useState(!1),[f,z]=a.useState(!1),[N,v]=a.useState(!1),[k,b]=a.useState([]),[_,E]=a.useState({name:"",celebration_point:"",facilitator_user_id:"",cohort:""}),[j,L]=a.useState({name:"",celebration_point:"",facilitator_user_id:"",cohort:"2025"}),[M,C]=a.useState(""),[B,W]=a.useState([]),[O,w]=a.useState(""),[P,F]=a.useState([]),[A,H]=a.useState(""),J=["Admin","LeadershipTeam"].includes(t==null?void 0:t.role),K=["Admin","Coordinator","Facilitator","CoFacilitator","TechSupport"].includes((t==null?void 0:t.role)),R=["Admin","Coordinator"].includes(t==null?void 0:t.role);a.useEffect(()=>{I()},[m]);const I=async()=>{u(!0);try{const S=new URLSearchParams;m&&S.append("celebration_point",m);const D=await(await fetch(`/api/formation-groups?${S}`)).json();D.success?g(D.groups):r(D.message,"error")}catch{r("Failed to load groups","error")}u(!1)},G=async S=>{p(!0);try{const D=await(await fetch(`/api/formation-groups/${S}`)).json();D.success&&(h(D),o(S),oe(S))}catch{r("Failed to load group details","error")}p(!1)},oe=async S=>{try{const D=await(await fetch(`/api/data/notes/group/${S}`)).json();D.success&&F(D.notes||[])}catch{}},ne=async()=>{var S;if(A.trim())try{const D=await(await fetch("/api/data/notes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({groupId:c,content:A,celebrationPoint:(S=n==null?void 0:n.group)==null?void 0:S.celebration_point})})).json();D.success?(r("Comment added","success"),H(""),oe(c)):r(D.message,"error")}catch{r("Failed to add comment","error")}},Ae=async()=>{try{const $=await(await fetch("/api/formation-groups/facilitators/available")).json();$.success&&b($.facilitators)}catch{}},je={Bbira:"WBB",Bugolobi:"WBG",Bweyogerere:"WBW",Downtown:"WDT",Entebbe:"WEN",Nakwero:"WGN",Gulu:"WGU",Jinja:"WJJ",Juba:"WJB",Kansanga:"WKA",Kyengera:"WKY",Laminadera:"WLM",Lubowa:"WLB",Mbarara:"WMB",Mukono:"WMK",Nansana:"WNW",Ntinda:"WNT",Online:"WON",Suubi:"WSU"},Ve=async S=>{if(S.preventDefault(),!j.name||!j.celebration_point){r("Name and Celebration Point required","error");return}let $=null;j.codeSuffix&&($=`${je[j.celebration_point]||"WXX"}${j.codeSuffix.padStart(3,"0")}`);try{const D={...j,group_code:$},Y=await(await fetch("/api/formation-groups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(D)})).json();Y.success?(r(`Group ${Y.group_code} created!`,"success"),y(!1),L({name:"",celebration_point:"",facilitator_user_id:"",cohort:"2025",codeSuffix:""}),I()):r(Y.message,"error")}catch{r("Failed to create group","error")}};a.useEffect(()=>{i&&L(S=>({...S,codeSuffix:""}))},[i]);const Qe=async S=>{var $;if(w(S),S.length<2){W([]);return}try{const D=new URLSearchParams({search:S,limit:10,type:"enrolled"});($=n==null?void 0:n.group)!=null&&$.celebration_point&&D.append("celebration_point",n.group.celebration_point);const Y=await(await fetch(`/api/data/users?${D}`)).json();Y.success&&W(Y.users||[])}catch{}},Xe=async S=>{try{const D=await(await fetch(`/api/formation-groups/${c}/members`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({student_id:String(S.id||S),student_name:S.first_name?(S.first_name+" "+S.last_name).trim():S.name||"",student_email:S.email||""})})).json();D.success?(r("Member added","success"),G(c),w(""),W([])):r(D.message,"error")}catch{r("Failed to add member","error")}},Ze=async S=>{if(confirm("Remove this student from the group?"))try{const D=await(await fetch(`/api/formation-groups/${c}/members/${S}`,{method:"DELETE"})).json();D.success?(r("Member removed","success"),G(c)):r(D.message,"error")}catch{r("Failed to remove member","error")}},et=()=>{const S=n==null?void 0:n.group;S&&(E({name:S.name||"",celebration_point:S.celebration_point||"",facilitator_user_id:S.facilitator_user_id||"",cohort:S.cohort||"2025"}),Ae(),v(!0))},tt=async S=>{S.preventDefault();try{const D=await(await fetch(`/api/formation-groups/${c}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(_)})).json();D.success?(r("Group updated","success"),v(!1),G(c),I()):r(D.message,"error")}catch{r("Failed to update group","error")}},rt=async()=>{if(confirm("Are you sure you want to deactivate this group? It will be hidden from the group list."))try{const $=await(await fetch(`/api/formation-groups/${c}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:0})})).json();$.success?(r("Group deactivated","success"),o(null),h(null),I()):r($.message,"error")}catch{r("Failed to deactivate group","error")}};if(c&&n){const{group:S,members:$,reports:D}=n;return e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:1e3,margin:"0 auto"},children:[e.jsx("button",{onClick:()=>{o(null),h(null)},style:{background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:6,fontWeight:500,transition:"color 0.2s"},onMouseEnter:T=>T.target.style.color="var(--text-primary)",onMouseLeave:T=>T.target.style.color="var(--text-secondary)",children:"← Back to Groups"}),e.jsx("div",{style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:20,padding:32,marginBottom:24,boxShadow:"var(--shadow-layer-3)"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[e.jsxs("div",{children:[e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)",marginBottom:8,fontWeight:500,display:"flex",gap:8},children:[e.jsx("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:S.group_code}),e.jsx("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:S.celebration_point}),e.jsxs("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:["Cohort ",S.cohort]})]}),e.jsx("h2",{style:{margin:0,fontSize:28,color:"var(--text-primary)",fontWeight:700,letterSpacing:"-0.01em"},children:S.name}),e.jsxs("div",{style:{fontSize:15,color:"var(--text-secondary)",marginTop:8},children:["Facilitator: ",e.jsx("strong",{style:{color:"var(--text-primary)"},children:S.facilitator_name||"Unassigned"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12,alignItems:"center"},children:[K&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:et,style:{padding:"8px 16px",borderRadius:10,border:"var(--border-layer-2)",background:"var(--glass-layer-3)",color:"var(--text-primary)",cursor:"pointer",fontSize:13,fontWeight:600,transition:"background 0.2s",boxShadow:"var(--shadow-layer-1)"},children:"✏️ Edit"}),e.jsx("button",{onClick:rt,style:{padding:"8px 16px",borderRadius:10,border:"1px solid rgba(255,59,48,0.2)",background:"rgba(255,59,48,0.1)",color:"#ff3b30",cursor:"pointer",fontSize:13,fontWeight:600,transition:"background 0.2s"},children:"Deactivate"})]}),e.jsxs("div",{style:{background:"linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)",borderRadius:16,padding:"12px 24px",textAlign:"center",color:"white",boxShadow:"var(--shadow-layer-3)"},children:[e.jsx("div",{style:{fontSize:24,fontWeight:800},children:$.length}),e.jsx("div",{style:{fontSize:12,opacity:.9,fontWeight:600},children:"Members"})]})]})]})}),N&&e.jsx("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e4,backdropFilter:"blur(5px)"},onClick:()=>v(!1),children:e.jsxs("div",{style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:24,padding:32,width:480,maxWidth:"90vw",boxShadow:"var(--shadow-layer-4)"},onClick:T=>T.stopPropagation(),children:[e.jsxs("h3",{style:{margin:"0 0 24px",fontSize:20,color:"var(--text-primary)",fontWeight:600},children:["Edit Group — ",S.group_code]}),e.jsxs("form",{onSubmit:tt,children:[e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:ee,children:"Group Name"}),e.jsx("input",{type:"text",value:_.name,onChange:T=>E({..._,name:T.target.value}),required:!0,style:te})]}),e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:ee,children:"Facilitator"}),e.jsxs("select",{value:_.facilitator_user_id,onChange:T=>E({..._,facilitator_user_id:T.target.value}),style:te,children:[e.jsx("option",{value:"",children:"Unassigned"}),k.filter(T=>!_.celebration_point||T.celebration_point===_.celebration_point).map(T=>e.jsxs("option",{value:T.id,children:[T.name," (",T.celebration_point,")"]},T.id))]})]}),e.jsxs("div",{style:{marginBottom:24},children:[e.jsx("label",{style:ee,children:"Cohort"}),e.jsx("input",{type:"text",value:_.cohort,onChange:T=>E({..._,cohort:T.target.value}),style:te})]}),e.jsxs("div",{style:{display:"flex",gap:12,justifyContent:"flex-end"},children:[e.jsx("button",{type:"button",onClick:()=>v(!1),style:{padding:"10px 18px",borderRadius:10,border:"var(--border-layer-2)",background:"transparent",color:"var(--text-primary)",cursor:"pointer",fontSize:13,fontWeight:500},children:"Cancel"}),e.jsx("button",{type:"submit",style:{padding:"10px 24px",borderRadius:10,border:"none",cursor:"pointer",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",color:"white",fontWeight:600,fontSize:13,boxShadow:"var(--shadow-layer-2)"},children:"Save Changes"})]})]})]})}),R&&e.jsxs("div",{style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:16,padding:20,marginBottom:20,boxShadow:"var(--shadow-layer-2)"},children:[e.jsx("div",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)",marginBottom:12},children:"Add Student to Group"}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx("span",{style:{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",opacity:.5,color:"var(--text-secondary)"},children:"🔍"}),e.jsx("input",{type:"text",placeholder:"Search by name or email...",value:O,onChange:T=>Qe(T.target.value),style:{width:"100%",padding:"12px 14px 12px 36px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box",transition:"background 0.2s"},onFocus:T=>T.target.style.background="var(--glass-layer-3)",onBlur:T=>T.target.style.background="var(--glass-layer-1)"})]}),B.length>0&&e.jsx("div",{style:{marginTop:12,maxHeight:240,overflowY:"auto",borderRadius:10,border:"var(--border-layer-2)",background:"var(--glass-layer-1)"},children:B.map(T=>e.jsxs("div",{style:{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"var(--border-layer-1)",cursor:"pointer",transition:"background 0.1s"},onClick:()=>Xe(T),onMouseEnter:Y=>Y.currentTarget.style.background="var(--glass-layer-2)",onMouseLeave:Y=>Y.currentTarget.style.background="transparent",children:[e.jsxs("div",{children:[e.jsxs("div",{style:{fontSize:14,fontWeight:500,color:"var(--text-primary)"},children:[T.first_name," ",T.last_name]}),e.jsx("div",{style:{fontSize:12,color:"var(--text-secondary)"},children:T.email})]}),e.jsx("button",{className:"btn-primary",style:{padding:"4px 12px",fontSize:12},children:"+ Add"})]},T.id))})]}),e.jsxs("div",{style:{background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:12,overflow:"hidden"},children:[e.jsxs("div",{style:{padding:"12px 16px",borderBottom:"1px solid var(--glass-border)",fontSize:13,fontWeight:600,color:"var(--text-primary)"},children:["Members (",$.length,")"]}),$.length===0?e.jsxs("div",{style:{padding:40,textAlign:"center",color:"var(--text-secondary)",fontSize:14},children:["No members yet. ",R&&"Use the search above to add students."]}):e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{borderBottom:"1px solid var(--glass-border)"},children:[e.jsx("th",{style:we,children:"Member"}),e.jsx("th",{style:we,children:"Joined"}),R&&e.jsx("th",{style:we,children:"Actions"})]})}),e.jsx("tbody",{children:$.map(T=>e.jsxs("tr",{style:{borderBottom:"1px solid rgba(255,255,255,0.03)"},children:[e.jsx("td",{style:Se,children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx("div",{style:{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#4A9EFF,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0},children:(T.student_name||String(T.student_id)).charAt(0).toUpperCase()}),e.jsx("span",{style:{fontSize:14},children:T.student_name||T.student_id})]})}),e.jsx("td",{style:Se,children:new Date(T.joined_at).toLocaleDateString()}),R&&e.jsx("td",{style:Se,children:e.jsx("button",{onClick:()=>Ze(T.student_id),style:{background:"rgba(255,59,48,0.15)",border:"none",color:"#ff3b30",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:12},children:"Remove"})})]},T.membership_id))})]})]}),e.jsxs("div",{style:{background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:12,overflow:"hidden",marginTop:20},children:[e.jsxs("div",{style:{padding:"12px 16px",borderBottom:"1px solid var(--glass-border)",fontSize:13,fontWeight:600,color:"var(--text-primary)"},children:["📝 Weekly Reports (",(D||[]).length,")"]}),!D||D.length===0?e.jsx("div",{style:{padding:40,textAlign:"center",color:"var(--text-secondary)",fontSize:14},children:"No weekly reports submitted yet."}):e.jsx("div",{style:{padding:12},children:D.map(T=>{const Y={high:"#00b894",medium:"#fdcb6e",low:"#ff7675"};return e.jsxs("div",{style:{padding:14,marginBottom:8,borderRadius:10,border:"1px solid var(--glass-border)",background:"rgba(255,255,255,0.02)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[e.jsxs("span",{style:{fontSize:14,fontWeight:700,color:"var(--text-primary)"},children:["Week ",T.week_number]}),e.jsx("span",{style:{fontSize:11,padding:"2px 8px",borderRadius:10,fontWeight:600,background:`${Y[T.engagement_level]||"#999"}22`,color:Y[T.engagement_level]||"#999",border:`1px solid ${Y[T.engagement_level]||"#999"}44`,textTransform:"capitalize"},children:T.engagement_level||"N/A"})]}),e.jsx("div",{style:{fontSize:11,color:"var(--text-secondary)"},children:T.submitted_at?new Date(T.submitted_at).toLocaleDateString():"Unknown"})]}),e.jsxs("div",{style:{display:"flex",gap:16,fontSize:12,color:"var(--text-secondary)"},children:[e.jsxs("span",{children:["👥 Attendance: ",e.jsx("strong",{style:{color:"var(--text-primary)"},children:T.attendance_count||"—"})]}),e.jsxs("span",{children:["📊 By: ",T.facilitator_name||"Unknown"]})]}),T.formation_evidence&&e.jsxs("div",{style:{marginTop:8,fontSize:12,color:"var(--text-secondary)",padding:"6px 10px",borderRadius:6,background:"rgba(0,184,148,0.08)",borderLeft:"3px solid #00b894"},children:[e.jsx("strong",{style:{color:"#00b894"},children:"Formation Evidence:"})," ",T.formation_evidence.length>120?T.formation_evidence.slice(0,120)+"…":T.formation_evidence]}),T.pastoral_concerns&&e.jsxs("div",{style:{marginTop:6,fontSize:12,color:"var(--text-secondary)",padding:"6px 10px",borderRadius:6,background:"rgba(255, 118, 117, 0.08)",borderLeft:"3px solid #ff7675"},children:[e.jsx("strong",{style:{color:"#ff7675"},children:"Pastoral Concerns:"})," ",T.pastoral_concerns.length>120?T.pastoral_concerns.slice(0,120)+"…":T.pastoral_concerns]})]},T.id)})})]}),e.jsxs("div",{style:{background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:12,overflow:"hidden",marginTop:20},children:[e.jsxs("div",{style:{padding:"12px 16px",borderBottom:"1px solid var(--glass-border)",fontSize:13,fontWeight:600,color:"var(--text-primary)"},children:["💬 Group Comments (",P.length,")"]}),e.jsx("div",{style:{padding:16,borderBottom:P.length>0?"1px solid var(--glass-border)":"none"},children:e.jsxs("div",{style:{display:"flex",gap:10},children:[e.jsx("input",{type:"text",placeholder:"Add a comment...",value:A,onChange:T=>H(T.target.value),onKeyDown:T=>{T.key==="Enter"&&ne()},style:{flex:1,padding:"10px 14px",borderRadius:8,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-primary)",fontSize:13,outline:"none"}}),e.jsx("button",{onClick:ne,style:{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",color:"white",fontWeight:600,fontSize:12,whiteSpace:"nowrap"},children:"Post"})]})}),P.length>0&&e.jsx("div",{style:{padding:12},children:P.map((T,Y)=>e.jsxs("div",{style:{padding:12,marginBottom:6,borderRadius:8,background:"rgba(255,255,255,0.02)",borderLeft:"3px solid #667eea"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx("strong",{style:{fontSize:12,color:"var(--text-primary)"},children:T.author_name}),T.author_role&&e.jsx("span",{style:{fontSize:10,padding:"1px 6px",borderRadius:4,background:"rgba(102,126,234,0.15)",color:"#667eea"},children:T.author_role})]}),e.jsx("span",{style:{fontSize:10,color:"var(--text-secondary)"},children:T.created_at?new Date(T.created_at).toLocaleString():""})]}),e.jsx("div",{style:{fontSize:13,color:"var(--text-secondary)",lineHeight:1.5},children:T.content})]},T.id||Y))})]}),e.jsx("div",{style:{marginTop:20},children:window.__ATTENDANCE_ADDON__&&window.__ATTENDANCE_ADDON__.GroupAttendance?e.jsx(window.__ATTENDANCE_ADDON__.GroupAttendance,{groupId:S.id,groupName:S.group_code+" — "+S.name,currentUser:t}):null})]})}return e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:1200,margin:"0 auto"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",padding:"16px 24px",borderRadius:20,border:"var(--border-layer-2)",boxShadow:"var(--shadow-layer-2)"},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{margin:0,fontSize:22,color:"var(--text-primary)"},children:"Formation Groups"}),e.jsxs("p",{style:{margin:"4px 0 0",fontSize:13,color:"var(--text-secondary)"},children:[s.length," group",s.length!==1?"s":""," found"]})]}),e.jsxs("div",{style:{display:"flex",gap:12,alignItems:"center"},children:[J&&e.jsxs("select",{value:m,onChange:S=>x(S.target.value),style:{padding:"8px 16px",borderRadius:10,background:"var(--glass-layer-3)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[e.jsx("option",{value:"",children:"All Campuses"}),Z.map(S=>e.jsx("option",{value:S,children:S},S))]}),K&&e.jsx("button",{onClick:()=>{y(!0),Ae()},className:"btn-primary",style:{padding:"8px 18px",fontSize:13,boxShadow:"var(--shadow-layer-3)"},children:"+ New Group"})]})]}),d?e.jsxs("div",{style:{textAlign:"center",padding:60,color:"var(--text-secondary)"},children:[e.jsx("div",{className:"spinner",style:{margin:"0 auto 12px"}}),"Loading groups..."]}):s.length===0?e.jsxs("div",{style:{textAlign:"center",padding:80,color:"var(--text-secondary)",background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:16},children:[e.jsx("div",{style:{fontSize:48,marginBottom:12},children:"📋"}),e.jsx("div",{style:{fontSize:16,fontWeight:600,marginBottom:4},children:"No Formation Groups"}),e.jsx("div",{style:{fontSize:13},children:K?'Click "+ New Group" to create the first group.':"No groups have been created for your campus yet."})]}):e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:16},children:s.map(S=>e.jsxs("div",{onClick:()=>G(S.id),className:"glass-card",style:{padding:"24px",cursor:"pointer",transition:"all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",position:"relative",overflow:"hidden"},children:[e.jsx("div",{style:{position:"absolute",top:0,left:0,width:"100%",height:"4px",background:"linear-gradient(90deg, var(--primary-color), var(--accent-color))",opacity:.8}}),e.jsx("div",{style:{display:"inline-block",padding:"4px 10px",borderRadius:6,background:"var(--glass-layer-3)",border:"var(--border-layer-1)",color:"var(--primary-light)",fontSize:12,fontWeight:700,letterSpacing:"0.5px",marginBottom:16},children:S.group_code}),e.jsxs("h3",{style:{margin:"0 0 8px",fontSize:17,fontWeight:600,color:"var(--text-primary)"},children:[S.name,S.is_overdue&&e.jsx("span",{style:{marginLeft:8,fontSize:10,padding:"2px 6px",borderRadius:4,background:"rgba(255, 59, 48, 0.15)",color:"#ff3b30",border:"1px solid rgba(255, 59, 48, 0.2)"},children:"Overdue"})]}),e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)",marginBottom:4},children:["📍 ",S.celebration_point]}),e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)",marginBottom:4},children:["👤 ",S.facilitator_name||"Unassigned"]}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:16,paddingTop:16,borderTop:"var(--border-layer-1)"},children:[e.jsxs("span",{style:{fontSize:12,color:"var(--text-secondary)"},children:["Cohort ",S.cohort]}),e.jsxs("span",{style:{fontSize:13,fontWeight:600,color:S.member_count>0?"var(--primary-light)":"var(--text-secondary)"},children:[S.member_count," member",S.member_count!==1?"s":""]})]}),e.jsx("button",{onClick:function(ev){ev.stopPropagation();U(S.id)},style:{marginTop:8,padding:"7px 0",borderRadius:8,background:"rgba(74,158,255,0.15)",border:"1px solid rgba(74,158,255,0.35)",color:"#4A9EFF",fontSize:12,fontWeight:600,cursor:"pointer",width:"100%",letterSpacing:.3},children:"\uD83D\uDCC5 Attendance"})]},S.id))}),i&&e.jsx("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e4,backdropFilter:"blur(5px)"},onClick:()=>y(!1),children:e.jsxs("div",{style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:20,padding:32,width:440,maxWidth:"90vw",boxShadow:"var(--shadow-layer-4)"},onClick:S=>S.stopPropagation(),children:[e.jsx("h3",{style:{margin:"0 0 24px",fontSize:20,color:"var(--text-primary)",fontWeight:600},children:"Create Formation Group"}),e.jsxs("form",{onSubmit:Ve,children:[e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:ee,children:"Celebration Point"}),e.jsxs("select",{value:j.celebration_point,onChange:S=>L({...j,celebration_point:S.target.value}),required:!0,style:te,children:[e.jsx("option",{value:"",children:"Select Campus..."}),Z.map(S=>e.jsx("option",{value:S,children:S},S))]})]}),e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:ee,children:"Group Code (Prefix - Number)"}),e.jsxs("div",{style:{display:"flex",gap:10,alignItems:"center"},children:[e.jsx("div",{style:{padding:"10px 14px",borderRadius:8,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,userSelect:"none",minWidth:60,textAlign:"center",fontWeight:"bold"},children:j.celebration_point&&je[j.celebration_point]||"---"}),e.jsx("input",{type:"text",placeholder:"001",value:j.codeSuffix||"",onChange:S=>{const $=S.target.value.replace(/[^0-9]/g,"");L({...j,codeSuffix:$})},maxLength:3,style:{...te,textAlign:"center",letterSpacing:2,fontWeight:"bold"}})]}),e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)",marginTop:6,paddingLeft:4},children:["Full Code: ",j.celebration_point?`${je[j.celebration_point]}${(j.codeSuffix||"000").padStart(3,"0")}`:"Select campus first"]})]}),e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:ee,children:"Group Name"}),e.jsx("input",{type:"text",placeholder:"e.g. Downtown Alpha Group",value:j.name,onChange:S=>L({...j,name:S.target.value}),required:!0,style:te})]}),e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:ee,children:"Facilitator"}),e.jsxs("select",{value:j.facilitator_user_id,onChange:S=>L({...j,facilitator_user_id:S.target.value}),style:te,children:[e.jsx("option",{value:"",children:"Unassigned"}),k.filter(S=>!j.celebration_point||S.celebration_point===j.celebration_point).map(S=>e.jsxs("option",{value:S.id,children:[S.name," (",S.celebration_point,")"]},S.id))]})]}),e.jsxs("div",{style:{marginBottom:24},children:[e.jsx("label",{style:ee,children:"Cohort"}),e.jsx("input",{type:"text",value:j.cohort,onChange:S=>L({...j,cohort:S.target.value}),style:te})]}),e.jsxs("div",{style:{display:"flex",gap:12,justifyContent:"flex-end"},children:[e.jsx("button",{type:"button",onClick:()=>y(!1),style:{padding:"10px 18px",borderRadius:10,border:"var(--border-layer-2)",background:"transparent",color:"var(--text-primary)",cursor:"pointer",fontSize:13,fontWeight:500},children:"Cancel"}),e.jsx("button",{type:"submit",className:"btn-primary",style:{padding:"10px 24px",fontSize:13,boxShadow:"var(--shadow-layer-2)"},children:"Create Group"})]})]})]})})]})}const we={padding:"12px 20px",fontSize:12,fontWeight:600,color:"var(--text-secondary)",textAlign:"left",borderBottom:"var(--border-layer-1)"},Se={padding:"12px 20px",fontSize:13,color:"var(--text-primary)",borderBottom:"var(--border-layer-1)"},ee={display:"block",fontSize:13,fontWeight:500,color:"var(--text-secondary)",marginBottom:6},te={width:"100%",padding:"12px 16px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box",transition:"background 0.2s"};function Xt(){const{user:t,showToast:r}=U(),[s,g]=a.useState([]),[d,u]=a.useState(!0),[c,o]=a.useState(null),[n,h]=a.useState(null),[l,p]=a.useState(["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)?"":t==null?void 0:t.celebration_point),[m,x]=a.useState(""),[i,y]=a.useState(""),[f,z]=a.useState([]),[N,v]=a.useState("list"),k=["Admin","LeadershipTeam"].includes(t==null?void 0:t.role),b=(t==null?void 0:t.role)==="Admin";a.useEffect(()=>{_(),E(),b&&j()},[]),a.useEffect(()=>{_()},[l,m,i]);const _=async()=>{u(!0);try{const C=new URLSearchParams;l&&C.append("celebration_point",l),m&&C.append("week",m),i&&C.append("group_id",i);const W=await(await fetch(`/api/reports?${C}`)).json();W.success&&g(W.reports)}catch{r("Failed to load reports","error")}u(!1)},E=async()=>{try{const C=new URLSearchParams;l&&C.append("celebration_point",l);const W=await(await fetch(`/api/formation-groups?${C}`)).json();W.success&&z(W.groups)}catch{}},j=async()=>{try{const B=await(await fetch("/api/reports/sync-status")).json();B.success&&h(B)}catch{}},L=async()=>{try{r("Syncing from Notion...","info");const B=await(await fetch("/api/reports/sync",{method:"POST"})).json();B.success?(r(B.message||"Sync complete","success"),j(),_()):r(B.message||"Sync failed","error")}catch{r("Sync failed","error")}},M=C=>{const B={high:"#34C759",medium:"#FF9500",low:"#FF3B30"};return e.jsx("span",{style:{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600,textTransform:"capitalize",background:`${B[C]||"#888"}22`,color:B[C]||"#888"},children:C||"N/A"})};return c?e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:800,margin:"0 auto"},children:[e.jsx("button",{onClick:()=>o(null),style:{background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:6,fontWeight:500,transition:"color 0.2s"},onMouseEnter:C=>C.target.style.color="var(--text-primary)",onMouseLeave:C=>C.target.style.color="var(--text-secondary)",children:"← Back to Reports"}),e.jsxs("div",{className:"glass-card",style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:20,padding:32,boxShadow:"var(--shadow-layer-3)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24},children:[e.jsxs("div",{children:[e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)",marginBottom:8,fontWeight:500,display:"flex",gap:8},children:[e.jsx("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:c.group_code}),e.jsx("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:c.celebration_point}),e.jsxs("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:["Week ",c.week_number]})]}),e.jsx("h2",{style:{margin:0,fontSize:24,color:"var(--text-primary)",fontWeight:700},children:c.group_name}),e.jsxs("div",{style:{fontSize:14,color:"var(--text-secondary)",marginTop:8},children:["Facilitator: ",e.jsx("strong",{style:{color:"var(--text-primary)"},children:c.facilitator_name||"Unknown"}),c.submitted_at&&e.jsxs("span",{children:[" · Submitted ",new Date(c.submitted_at).toLocaleDateString()]})]})]}),M(c.engagement_level)]}),[{label:"📊 Attendance",value:c.attendance_count?`${c.attendance_count} participants present`:null},{label:"💬 Key Themes",value:c.key_themes},{label:"🌱 Formation Evidence",value:c.formation_evidence},{label:"🙏 Pastoral Concerns",value:c.pastoral_concerns},{label:"❓ Questions to Escalate",value:c.questions_to_escalate},{label:"🔧 Session Adjustments",value:c.session_adjustments}].map(({label:C,value:B})=>B?e.jsxs("div",{style:{marginBottom:16,padding:16,borderRadius:12,background:"var(--glass-layer-3)",border:"var(--border-layer-1)"},children:[e.jsx("div",{style:{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginBottom:6},children:C}),e.jsx("div",{style:{fontSize:14,color:"var(--text-primary)",lineHeight:1.6,whiteSpace:"pre-wrap"},children:B})]},C):null)]})]}):e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:1200,margin:"0 auto"},children:[e.jsxs("div",{className:"glass-card",style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,padding:"16px 24px",borderRadius:20},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{margin:0,fontSize:22,color:"var(--text-primary)"},children:"Weekly Reports"}),e.jsxs("p",{style:{margin:"4px 0 0",fontSize:13,color:"var(--text-secondary)"},children:[s.length," report",s.length!==1?"s":""," from Notion"]})]}),e.jsxs("div",{style:{display:"flex",gap:10,alignItems:"center"},children:[b&&n&&e.jsx("div",{style:{padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,background:n.status==="success"?"rgba(52,199,89,0.1)":n.status==="error"?"rgba(255,59,48,0.1)":n.status==="disabled"?"var(--glass-layer-1)":"rgba(255,149,0,0.1)",color:n.status==="success"?"#34C759":n.status==="error"?"#FF3B30":n.status==="disabled"?"var(--text-secondary)":"#FF9500",border:"var(--border-layer-1)"},children:n.status==="disabled"?"⚠ Not Configured":n.status==="success"?`✓ Synced ${n.lastSyncTime?new Date(n.lastSyncTime).toLocaleTimeString():""}`:n.status==="error"?"✗ Sync Error":"⟳ Syncing..."}),b&&(n==null?void 0:n.configured)&&e.jsx("button",{onClick:L,style:{padding:"8px 16px",borderRadius:10,border:"var(--border-layer-2)",background:"var(--glass-layer-3)",color:"var(--primary-color)",fontWeight:600,fontSize:13,cursor:"pointer",transition:"background 0.2s",boxShadow:"var(--shadow-layer-1)"},children:"⟳ Sync Now"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"},children:[k&&e.jsxs("select",{value:l,onChange:C=>p(C.target.value),style:{padding:"10px 16px",borderRadius:10,background:"var(--glass-layer-2)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[e.jsx("option",{value:"",children:"All Campuses"}),Z.map(C=>e.jsx("option",{value:C,children:C},C))]}),e.jsxs("select",{value:m,onChange:C=>x(C.target.value),style:{padding:"10px 16px",borderRadius:10,background:"var(--glass-layer-2)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[e.jsx("option",{value:"",children:"All Weeks"}),Array.from({length:13},(C,B)=>B+1).map(C=>e.jsxs("option",{value:C,children:["Week ",C]},C))]}),e.jsxs("select",{value:i,onChange:C=>y(C.target.value),style:{padding:"10px 16px",borderRadius:10,background:"var(--glass-layer-2)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[e.jsx("option",{value:"",children:"All Groups"}),f.map(C=>e.jsxs("option",{value:C.id,children:[C.group_code," — ",C.name]},C.id))]})]}),d?e.jsxs("div",{style:{textAlign:"center",padding:60,color:"var(--text-secondary)"},children:[e.jsx("div",{className:"spinner",style:{margin:"0 auto 12px"}}),"Loading reports..."]}):s.length===0?e.jsxs("div",{className:"glass-card",style:{textAlign:"center",padding:80},children:[e.jsx("div",{style:{fontSize:48,marginBottom:12},children:"📝"}),e.jsx("div",{style:{fontSize:16,fontWeight:600,marginBottom:4,color:"var(--text-primary)"},children:"No Weekly Reports"}),e.jsx("div",{style:{fontSize:13,color:"var(--text-secondary)"},children:(n==null?void 0:n.status)==="disabled"?"Notion sync is not configured. Go to Settings to connect your Notion database.":"No reports have been synced yet. Reports will appear here after the next Notion sync."})]}):e.jsx("div",{className:"glass-card",style:{padding:0,overflow:"hidden"},children:e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{background:"var(--glass-layer-2)",borderBottom:"var(--border-layer-1)"},children:[e.jsx("th",{style:ae,children:"Week"}),e.jsx("th",{style:ae,children:"Group"}),e.jsx("th",{style:ae,children:"Campus"}),e.jsx("th",{style:ae,children:"Facilitator"}),e.jsx("th",{style:ae,children:"Attendance"}),e.jsx("th",{style:ae,children:"Engagement"}),e.jsx("th",{style:ae,children:"Submitted"})]})}),e.jsx("tbody",{children:s.map(C=>e.jsxs("tr",{onClick:()=>o(C),style:{borderBottom:"var(--border-layer-1)",cursor:"pointer",transition:"background 0.1s"},onMouseEnter:B=>B.currentTarget.style.background="var(--glass-layer-2)",onMouseLeave:B=>B.currentTarget.style.background="transparent",children:[e.jsx("td",{style:se,children:e.jsxs("strong",{children:["Week ",C.week_number]})}),e.jsxs("td",{style:se,children:[e.jsx("span",{style:{fontSize:11,fontWeight:700,color:"var(--primary-light)",marginRight:6},children:C.group_code}),C.group_name]}),e.jsx("td",{style:se,children:C.celebration_point}),e.jsx("td",{style:se,children:C.facilitator_name||"—"}),e.jsx("td",{style:se,children:C.attendance_count||"—"}),e.jsx("td",{style:se,children:M(C.engagement_level)}),e.jsx("td",{style:{...se,fontSize:12},children:C.submitted_at?new Date(C.submitted_at).toLocaleDateString():"—"})]},C.id))})]})})]})}const ae={padding:"12px 20px",fontSize:12,fontWeight:600,color:"var(--text-secondary)",textAlign:"left",borderBottom:"var(--border-layer-1)"},se={padding:"12px 20px",fontSize:13,color:"var(--text-primary)",borderBottom:"var(--border-layer-1)"};function Zt(){const{showToast:t}=U(),[r,s]=a.useState({notion_api_key:"",notion_db_id:"",notion_sync_interval:"15"}),[g,d]=a.useState(!0),[u,c]=a.useState(!1),[o,n]=a.useState(null),[h,l]=a.useState(!1),[p,m]=a.useState(null);a.useEffect(()=>{x(),i()},[]);const x=async()=>{try{const N=await(await fetch("/api/settings")).json();N.success&&s({notion_api_key:N.settings.notion_api_key||"",notion_db_id:N.settings.notion_db_id||"",notion_sync_interval:N.settings.notion_sync_interval||"15"})}catch{}d(!1)},i=async()=>{try{const N=await(await fetch("/api/reports/sync-status")).json();N.success&&m(N)}catch{}},y=async z=>{z.preventDefault(),c(!0);try{const N={notion_db_id:r.notion_db_id,notion_sync_interval:r.notion_sync_interval};r.notion_api_key&&!r.notion_api_key.includes("••••")&&(N.notion_api_key=r.notion_api_key);const k=await(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(N)})).json();k.success?(t("Settings saved! Notion sync restarted.","success"),x(),i()):t(k.message,"error")}catch{t("Failed to save settings","error")}c(!1)},f=async()=>{l(!0),n(null);try{const N=await(await fetch("/api/settings/test-notion",{method:"POST"})).json();n(N)}catch{n({success:!1,message:"Connection test failed"})}l(!1)};return g?e.jsx("div",{className:"page-container",style:{padding:24,textAlign:"center",color:"var(--text-secondary)"},children:"Loading settings..."}):e.jsxs("div",{className:"page-container",style:{padding:24,maxWidth:700},children:[e.jsx("h1",{style:{margin:"0 0 4px",fontSize:24,color:"var(--text-primary)"},children:"Settings"}),e.jsx("p",{style:{margin:"0 0 28px",fontSize:13,color:"var(--text-secondary)"},children:"System configuration — Admin only"}),e.jsxs("div",{className:"glass-card",style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:20,padding:32,boxShadow:"var(--shadow-layer-3)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:16,marginBottom:24},children:[e.jsx("div",{style:{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg, #000 0%, #333 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"0 4px 12px rgba(0,0,0,0.2)"},children:"📓"}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:18,fontWeight:700,color:"var(--text-primary)",marginBottom:4},children:"Notion Integration"}),e.jsx("div",{style:{fontSize:13,color:"var(--text-secondary)"},children:"Connect your weekly reports Notion database"})]})]}),p&&e.jsxs("div",{style:{padding:"12px 16px",borderRadius:12,marginBottom:24,background:p.status==="success"?"rgba(52,199,89,0.1)":p.status==="error"?"rgba(255,59,48,0.1)":p.status==="disabled"?"rgba(142,142,147,0.1)":"rgba(255,149,0,0.1)",border:`1px solid ${p.status==="success"?"rgba(52,199,89,0.2)":p.status==="error"?"rgba(255,59,48,0.2)":"rgba(142,142,147,0.2)"}`},children:[e.jsx("div",{style:{fontSize:14,fontWeight:600,color:p.status==="success"?"#34C759":p.status==="error"?"#FF3B30":p.status==="disabled"?"#8E8E93":"#FF9500"},children:p.status==="disabled"?"⚠ Sync Disabled":p.status==="success"?"✓ Sync Active":p.status==="error"?"✗ Sync Error":"⟳ Syncing"}),e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)",marginTop:4},children:[p.message,p.lastSyncTime&&e.jsxs("span",{children:[" · Last: ",new Date(p.lastSyncTime).toLocaleString()]})]})]}),e.jsxs("form",{onSubmit:y,children:[e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:Ne,children:"Notion API Key (Internal Integration Token)"}),e.jsx("input",{type:"password",value:r.notion_api_key,onChange:z=>s({...r,notion_api_key:z.target.value}),placeholder:"secret_xxxxx...",style:Ce}),e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)",marginTop:4},children:["Create an integration at ",e.jsx("a",{href:"https://www.notion.so/my-integrations",target:"_blank",rel:"noopener noreferrer",style:{color:"#667eea"},children:"notion.so/my-integrations"})," and paste the token here."]})]}),e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:Ne,children:"Notion Database ID (Weekly Reports)"}),e.jsx("input",{type:"text",value:r.notion_db_id,onChange:z=>s({...r,notion_db_id:z.target.value}),placeholder:"abc123def456...",style:Ce}),e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)",marginTop:4},children:["Found in the URL of your Notion database: notion.so/[workspace]/[",e.jsx("strong",{children:"database-id"}),"]?..."]})]}),e.jsxs("div",{style:{marginBottom:20},children:[e.jsx("label",{style:Ne,children:"Sync Interval (minutes)"}),e.jsx("input",{type:"number",min:"5",max:"60",value:r.notion_sync_interval,onChange:z=>s({...r,notion_sync_interval:z.target.value}),style:{...Ce,width:100}})]}),e.jsxs("div",{style:{display:"flex",gap:12,flexWrap:"wrap",marginTop:32,borderTop:"var(--border-layer-1)",paddingTop:24},children:[e.jsx("button",{type:"submit",disabled:u,className:"btn-primary",style:{padding:"10px 24px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,opacity:u?.6:1,boxShadow:"var(--shadow-layer-2)"},children:u?"Saving...":"Save & Restart Sync"}),e.jsx("button",{type:"button",onClick:f,disabled:h,style:{padding:"10px 20px",borderRadius:10,cursor:"pointer",border:"var(--border-layer-2)",background:"var(--glass-layer-1)",color:"var(--text-primary)",fontSize:13,opacity:h?.6:1,transition:"background 0.2s",fontWeight:500},children:h?"Testing...":"🔗 Test Connection"})]}),o&&e.jsxs("div",{style:{marginTop:16,padding:14,borderRadius:10,background:o.success?"rgba(52,199,89,0.1)":"rgba(255,59,48,0.1)",border:`1px solid ${o.success?"rgba(52,199,89,0.2)":"rgba(255,59,48,0.2)"}`},children:[e.jsx("div",{style:{fontSize:13,fontWeight:600,color:o.success?"#34C759":"#FF3B30"},children:o.success?"✓ Connection Successful":"✗ Connection Failed"}),e.jsx("div",{style:{fontSize:12,color:"var(--text-secondary)",marginTop:4},children:o.message}),o.properties&&o.properties.length>0&&e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)",marginTop:8},children:[e.jsx("strong",{children:"Database properties:"})," ",o.properties.join(", ")]})]})]})]})]})}const Ne={display:"block",fontSize:13,fontWeight:500,color:"var(--text-secondary)",marginBottom:8},Ce={width:"100%",padding:"12px 14px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box",transition:"background 0.2s"};function er(){const{user:t,showToast:r}=U(),[s,g]=a.useState([]),[d,u]=a.useState(!0),[c,o]=a.useState(null),[n,h]=a.useState([]),[l,p]=a.useState(""),[m,x]=a.useState([]),[i,y]=a.useState(!1),[f,z]=a.useState(""),[N,v]=a.useState(["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)?"":t==null?void 0:t.celebration_point),[k,b]=a.useState(""),_=["Admin","LeadershipTeam"].includes(t==null?void 0:t.role),E=(t==null?void 0:t.role)==="Admin",j=["Admin","LeadershipTeam","Pastor","Coordinator"].includes(t==null?void 0:t.role);a.useEffect(()=>{L()},[]),a.useEffect(()=>{L()},[f,N,k]);const L=async()=>{u(!0);try{const w=new URLSearchParams;f&&w.append("checkpoint_week",f),N&&w.append("celebration_point",N),k&&w.append("status",k);const F=await(await fetch(`/api/checkpoints?${w}`)).json();F.success&&g(F.checkpoints)}catch{r("Failed to load checkpoints","error")}u(!1)},M=async w=>{try{const F=await(await fetch(`/api/checkpoints/${w}`)).json();if(F.success){o(F.checkpoint),h(F.members||[]),p(F.checkpoint.review_notes||"");const A=F.checkpoint.participants_flagged?typeof F.checkpoint.participants_flagged=="string"?JSON.parse(F.checkpoint.participants_flagged):F.checkpoint.participants_flagged:[];x(A)}}catch{r("Failed to load checkpoint","error")}},C=async w=>{y(!0);try{const F=await(await fetch("/api/checkpoints/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({checkpoint_week:w})})).json();F.success?(r(F.message,"success"),L()):r(F.message,"error")}catch{r("Generation failed","error")}y(!1)},B=async w=>{try{const F=await(await fetch(`/api/checkpoints/${c.id}/review`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({review_notes:l,participants_flagged:m,status:w})})).json();F.success?(r(`Checkpoint ${w}`,"success"),o(null),L()):r(F.message,"error")}catch{r("Review failed","error")}},W=w=>{x(P=>P.includes(w)?P.filter(F=>F!==w):[...P,w])},O={pending:{color:"#FF9500",bg:"rgba(255,149,0,0.12)",label:"⏳ Pending"},completed:{color:"#007AFF",bg:"rgba(0,122,255,0.12)",label:"✓ Completed"},reviewed:{color:"#34C759",bg:"rgba(52,199,89,0.12)",label:"✅ Reviewed"}};if(c){const w=c,P=O[w.status]||O.pending;return e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:900,margin:"0 auto"},children:[e.jsx("button",{onClick:()=>o(null),style:{background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:6,fontWeight:500,transition:"color 0.2s"},onMouseEnter:F=>F.target.style.color="var(--text-primary)",onMouseLeave:F=>F.target.style.color="var(--text-secondary)",children:"← Back to Checkpoints"}),e.jsxs("div",{className:"glass-card",style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:20,padding:32,boxShadow:"var(--shadow-layer-3)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24},children:[e.jsxs("div",{children:[e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)",marginBottom:8,fontWeight:500,display:"flex",gap:8},children:[e.jsx("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:w.group_code}),e.jsx("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:w.celebration_point}),e.jsxs("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:["Week ",w.checkpoint_week]})]}),e.jsx("h2",{style:{margin:0,fontSize:24,color:"var(--text-primary)",fontWeight:700},children:w.group_name}),e.jsxs("div",{style:{fontSize:14,color:"var(--text-secondary)",marginTop:8},children:["Facilitator: ",e.jsx("strong",{style:{color:"var(--text-primary)"},children:w.facilitator_name||"Unknown"}),w.reviewed_at&&e.jsxs("span",{children:[" · Reviewed by ",w.reviewer_name," on ",new Date(w.reviewed_at).toLocaleDateString()]})]})]}),e.jsx("span",{style:{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,background:P.bg,color:P.color,border:`1px solid ${P.color}40`},children:P.label})]}),e.jsx("div",{style:{marginBottom:16,padding:16,borderRadius:12,background:"var(--glass-layer-3)",border:"var(--border-layer-1)"},children:e.jsx("div",{style:{fontSize:13,color:"var(--text-primary)",lineHeight:1.6},children:w.summary})}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20},children:[{label:"📊 Attendance Trend",value:w.attendance_trend},{label:"📈 Engagement Trend",value:w.engagement_trend}].map(({label:F,value:A})=>e.jsxs("div",{style:tr,children:[e.jsx("div",{style:{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:4},children:F}),e.jsx("div",{style:{fontSize:14,color:"var(--text-primary)",fontWeight:600},children:A||"N/A"})]},F))}),[{label:"💬 Recurring Themes",value:w.recurring_themes},{label:"🌱 Formation Evidence",value:w.formation_evidence_summary},{label:"🙏 Pastoral Concerns",value:w.concerns_summary}].map(({label:F,value:A})=>A&&A!=="No themes reported"&&A!=="No formation evidence reported"&&A!=="No concerns flagged"?e.jsxs("div",{style:{marginBottom:14,padding:14,borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)"},children:[e.jsx("div",{style:{fontSize:12,fontWeight:600,color:"var(--text-secondary)",marginBottom:6},children:F}),e.jsx("div",{style:{fontSize:13,color:"var(--text-primary)",lineHeight:1.6,whiteSpace:"pre-wrap"},children:A})]},F):null),j&&n.length>0&&e.jsxs("div",{style:{marginTop:16,padding:14,borderRadius:10,background:"rgba(255,59,48,0.04)",border:"1px solid rgba(255,59,48,0.1)"},children:[e.jsx("div",{style:{fontSize:12,fontWeight:600,color:"var(--text-secondary)",marginBottom:10},children:"🚩 Flag Participants for Follow-up"}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:8},children:n.map(F=>{const A=m.includes(F.student_id);return e.jsxs("button",{onClick:()=>W(F.student_id),style:{padding:"6px 12px",borderRadius:8,fontSize:12,cursor:"pointer",border:A?"1px solid #FF3B30":"1px solid var(--glass-border)",background:A?"rgba(255,59,48,0.15)":"transparent",color:A?"#FF3B30":"var(--text-primary)",fontWeight:A?600:400},children:[A?"🚩 ":"",F.first_name||""," ",F.last_name||F.student_id]},F.student_id)})})]}),j&&w.status!=="reviewed"&&e.jsxs("div",{style:{marginTop:20},children:[e.jsx("label",{style:{display:"block",fontSize:12,fontWeight:600,color:"var(--text-secondary)",marginBottom:6},children:"Discernment Notes"}),e.jsx("textarea",{value:l,onChange:F=>p(F.target.value),placeholder:"Add your discernment notes, observations, and recommended actions...",rows:4,style:{width:"100%",padding:12,borderRadius:8,boxSizing:"border-box",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-primary)",fontSize:14,outline:"none",resize:"vertical"}}),e.jsxs("div",{style:{display:"flex",gap:10,marginTop:12},children:[w.status==="pending"&&e.jsx("button",{onClick:()=>B("completed"),style:primaryBtnStyle,children:"✓ Mark Completed"}),e.jsx("button",{onClick:()=>B("reviewed"),style:{...primaryBtnStyle,background:"linear-gradient(135deg, #34C759 0%, #30D158 100%)"},children:"✅ Mark Reviewed"})]})]}),w.review_notes&&w.status==="reviewed"&&e.jsxs("div",{style:{marginTop:16,padding:14,borderRadius:10,background:"rgba(52,199,89,0.06)",border:"1px solid rgba(52,199,89,0.12)"},children:[e.jsx("div",{style:{fontSize:12,fontWeight:600,color:"#34C759",marginBottom:6},children:"📝 Review Notes"}),e.jsx("div",{style:{fontSize:13,color:"var(--text-primary)",lineHeight:1.6,whiteSpace:"pre-wrap"},children:w.review_notes})]})]})]})}return e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:1200,margin:"0 auto"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",padding:"16px 24px",borderRadius:20,border:"var(--border-layer-2)",boxShadow:"var(--shadow-layer-2)"},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{margin:0,fontSize:22,color:"var(--text-primary)"},children:"Discernment Checkpoints"}),e.jsxs("p",{style:{margin:"4px 0 0",fontSize:13,color:"var(--text-secondary)"},children:[s.length," checkpoint",s.length!==1?"s":""," · Structured reflection at Weeks 4, 8 & 13"]})]}),E&&e.jsx("div",{style:{display:"flex",gap:8},children:[4,8,13].map(w=>e.jsx("button",{onClick:()=>C(w),disabled:i,style:{padding:"8px 16px",borderRadius:10,border:"var(--border-layer-2)",background:"var(--glass-layer-3)",color:"var(--primary-color)",fontWeight:600,fontSize:13,cursor:"pointer",opacity:i?.5:1,transition:"background 0.2s"},children:i?"...":`⚡ Week ${w}`},w))})]}),e.jsxs("div",{style:{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"},children:[_&&e.jsxs("select",{value:N,onChange:w=>v(w.target.value),style:{padding:"10px 16px",borderRadius:10,background:"var(--glass-layer-2)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[e.jsx("option",{value:"",children:"All Campuses"}),Z.map(w=>e.jsx("option",{value:w,children:w},w))]}),e.jsxs("select",{value:f,onChange:w=>z(w.target.value),style:{padding:"10px 16px",borderRadius:10,background:"var(--glass-layer-2)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[e.jsx("option",{value:"",children:"All Checkpoints"}),e.jsx("option",{value:"4",children:"Week 4"}),e.jsx("option",{value:"8",children:"Week 8"}),e.jsx("option",{value:"13",children:"Week 13"})]}),e.jsxs("select",{value:k,onChange:w=>b(w.target.value),style:{padding:"10px 16px",borderRadius:10,background:"var(--glass-layer-2)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[e.jsx("option",{value:"",children:"All Statuses"}),e.jsx("option",{value:"pending",children:"Pending"}),e.jsx("option",{value:"completed",children:"Completed"}),e.jsx("option",{value:"reviewed",children:"Reviewed"})]})]}),d?e.jsxs("div",{style:{textAlign:"center",padding:60,color:"var(--text-secondary)"},children:[e.jsx("div",{className:"spinner",style:{margin:"0 auto 12px"}}),"Loading checkpoints..."]}):s.length===0?e.jsxs("div",{style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-2)",border:"var(--border-layer-2)",borderRadius:16,textAlign:"center",padding:80},children:[e.jsx("div",{style:{fontSize:48,marginBottom:12},children:"🎯"}),e.jsx("div",{style:{fontSize:16,fontWeight:600,marginBottom:4,color:"var(--text-primary)"},children:"No Checkpoints Yet"}),e.jsx("div",{style:{fontSize:13,color:"var(--text-secondary)"},children:E?"Use the Week buttons above to generate checkpoints from weekly report data.":"Checkpoints will appear here once generated by an administrator."})]}):e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",gap:16},children:s.map(w=>{const P=O[w.status]||O.pending;return e.jsxs("div",{onClick:()=>M(w.id),className:"glass-card",style:{padding:24,cursor:"pointer",transition:"all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",position:"relative",overflow:"hidden"},children:[e.jsx("div",{style:{position:"absolute",top:0,left:0,width:"100%",height:"4px",background:`linear-gradient(90deg, ${P.color}, var(--primary-color))`,opacity:.8}}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},children:[e.jsxs("span",{style:{padding:"4px 10px",borderRadius:6,background:"var(--glass-layer-3)",border:"var(--border-layer-1)",color:"var(--text-primary)",fontSize:12,fontWeight:700},children:["Week ",w.checkpoint_week]}),e.jsx("span",{style:{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:700,background:P.bg,color:P.color,border:`1px solid ${P.color}30`},children:P.label})]}),e.jsx("h3",{style:{margin:"0 0 4px",fontSize:15,color:"var(--text-primary)"},children:w.group_name}),e.jsxs("div",{style:{fontSize:12,color:"var(--text-secondary)",marginBottom:4},children:[w.group_code," · 📍 ",w.celebration_point]}),e.jsxs("div",{style:{fontSize:12,color:"var(--text-secondary)",marginBottom:10},children:["👤 ",w.facilitator_name||"Unassigned"]}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[w.attendance_trend&&e.jsxs("span",{style:{fontSize:12,padding:"4px 10px",borderRadius:6,background:"var(--glass-layer-2)",color:"var(--text-secondary)",border:"var(--border-layer-1)"},children:["📊 ",w.attendance_trend]}),w.engagement_trend&&e.jsxs("span",{style:{fontSize:12,padding:"4px 10px",borderRadius:6,background:"var(--glass-layer-2)",color:"var(--text-secondary)",border:"var(--border-layer-1)"},children:["📈 ",w.engagement_trend]})]})]},w.id)})})]})}const tr={padding:16,borderRadius:12,background:"var(--glass-layer-2)",border:"var(--border-layer-1)"};function rr(){var J,K;const{user:t,showToast:r}=U(),[s,g]=a.useState(""),[d,u]=a.useState([]),[c,o]=a.useState(null),[n,h]=a.useState(null),[l,p]=a.useState(!1),[m,x]=a.useState(""),[i,y]=a.useState(""),[f,z]=a.useState(!1),[N,v]=a.useState(null),[k,b]=a.useState(null),[_,E]=a.useState(!1),[j,L]=a.useState(null),[M,C]=a.useState([]),[B,W]=a.useState(!1);a.useEffect(()=>{O()},[]);const O=async()=>{try{const I=await(await fetch("/api/data/students")).json();I.success&&u(I.students||[])}catch{}},w=s.length>=2?d.filter(R=>`${R.first_name} ${R.last_name} ${R.email}`.toLowerCase().includes(s.toLowerCase())).slice(0,8):[],P=async R=>{o(R),g(""),x(R.first_name||""),y(R.last_name||""),v(null),b(null),p(!0);try{const G=await(await fetch(`/api/tech-support/lookup/${R.userId}`)).json();G.success?(h(G.user),x(G.user.first_name||R.first_name||""),y(G.user.last_name||R.last_name||"")):h(null)}catch{h(null)}p(!1)},F=async()=>{L(null),z(!0),v(null);try{const I=await(await fetch(`/api/tech-support/name/${c.userId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({first_name:m,last_name:i})})).json();v(I),I.success?r("Name updated on Thinkific","success"):r(typeof I.message=="object"?JSON.stringify(I.message):I.message,"error")}catch{v({success:!1,message:"Connection error"}),r("Failed to update name","error")}z(!1)},A=async()=>{L(null),E(!0),b(null);try{const I=await(await fetch(`/api/tech-support/reset-password/${c.userId}`,{method:"POST"})).json();b(I),I.success?r("Password reset successfully","success"):r(typeof I.message=="object"?JSON.stringify(I.message):I.message,"error")}catch{b({success:!1,message:"Connection error"}),r("Failed to reset password","error")}E(!1)},H=async()=>{try{const I=await(await fetch("/api/tech-support/audit-log")).json();I.success&&C(I.logs||[])}catch{}W(!0)};return e.jsxs("div",{className:"page-container",style:{padding:24,maxWidth:960},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{margin:0,fontSize:24,color:"var(--text-primary)"},children:"Tech Support"}),e.jsx("p",{style:{margin:"4px 0 0",fontSize:13,color:"var(--text-secondary)"},children:"Thinkific write-back actions · Name changes & password resets"})]}),e.jsx("button",{onClick:H,style:De,children:"📋 Audit Log"})]}),e.jsxs("div",{style:{position:"relative",marginBottom:24},children:[e.jsx("input",{type:"text",value:s,onChange:R=>g(R.target.value),placeholder:"🔍 Search participant by name or email...",style:ar}),w.length>0&&e.jsx("div",{style:sr,children:w.map(R=>e.jsxs("div",{onClick:()=>P(R),style:{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.04)",transition:"background 0.15s"},onMouseEnter:I=>I.currentTarget.style.background="rgba(102,126,234,0.1)",onMouseLeave:I=>I.currentTarget.style.background="transparent",children:[e.jsxs("div",{style:{fontSize:13,fontWeight:600,color:"var(--text-primary)"},children:[R.first_name," ",R.last_name]}),e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)"},children:[R.email," · ",R.celebration_point||"No campus"," · ID: ",R.userId]})]},R.id))})]}),c&&e.jsxs("div",{style:ue,children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20},children:[e.jsxs("div",{children:[e.jsxs("h2",{style:{margin:0,fontSize:18,color:"var(--text-primary)"},children:[c.first_name," ",c.last_name]}),e.jsxs("div",{style:{fontSize:12,color:"var(--text-secondary)",marginTop:4},children:["📧 ",c.email," · 📍 ",c.celebration_point||"N/A"," · Thinkific ID: ",c.userId]})]}),e.jsx("button",{onClick:()=>{o(null),v(null),b(null)},style:{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"var(--text-secondary)"},children:"✕"})]}),l&&e.jsx("div",{style:{padding:12,textAlign:"center",color:"var(--text-secondary)",fontSize:13},children:"Looking up live Thinkific data..."}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16},children:[e.jsxs("div",{style:Ie,children:[e.jsx("div",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)",marginBottom:12},children:"✏️ Update Name"}),e.jsxs("div",{style:{marginBottom:10},children:[e.jsx("label",{style:Be,children:"First Name"}),e.jsx("input",{value:m,onChange:R=>x(R.target.value),style:We,placeholder:"First name"})]}),e.jsxs("div",{style:{marginBottom:14},children:[e.jsx("label",{style:Be,children:"Last Name"}),e.jsx("input",{value:i,onChange:R=>y(R.target.value),style:We,placeholder:"Last name"})]}),e.jsx("button",{onClick:()=>L({type:"name"}),disabled:f||!m&&!i,style:{...ze,opacity:f?.5:1,width:"100%"},children:f?"⏳ Updating...":"✏️ Update on Thinkific"}),N&&e.jsx("div",{style:{marginTop:10,padding:10,borderRadius:8,fontSize:12,background:N.success?"rgba(52,199,89,0.1)":"rgba(255,59,48,0.1)",color:N.success?"#34C759":"#FF3B30",border:`1px solid ${N.success?"rgba(52,199,89,0.2)":"rgba(255,59,48,0.2)"}`},children:N.success?`✅ Updated: ${(J=N.previous)==null?void 0:J.first_name} ${(K=N.previous)==null?void 0:K.last_name} → ${m} ${i}`:`❌ ${N.message}`})]}),e.jsxs("div",{style:Ie,children:[e.jsx("div",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)",marginBottom:12},children:"🔑 Password Reset"}),e.jsx("p",{style:{fontSize:12,color:"var(--text-secondary)",lineHeight:1.5,marginBottom:14},children:"Generate a temporary password for this participant. They will need this password to log in and should change it immediately."}),e.jsx("button",{onClick:()=>L({type:"password"}),disabled:_,style:{...ze,width:"100%",background:"linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)",opacity:_?.5:1},children:_?"⏳ Resetting...":"🔑 Reset Password"}),k&&e.jsx("div",{style:{marginTop:10,padding:12,borderRadius:8,fontSize:12,background:k.success?"rgba(52,199,89,0.08)":"rgba(255,59,48,0.1)",border:`1px solid ${k.success?"rgba(52,199,89,0.15)":"rgba(255,59,48,0.2)"}`,color:"var(--text-primary)"},children:k.success?e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{color:"#34C759",fontWeight:600,marginBottom:6},children:"✅ Password Reset Complete"}),e.jsxs("div",{style:{marginBottom:4},children:["Student: ",k.studentName]}),e.jsxs("div",{style:{marginBottom:4},children:["Email: ",k.studentEmail]}),e.jsx("div",{style:{padding:8,borderRadius:6,background:"rgba(255,255,255,0.08)",fontFamily:"monospace",fontSize:14,fontWeight:700,textAlign:"center",userSelect:"all",letterSpacing:1},children:k.tempPassword}),e.jsx("div",{style:{fontSize:10,color:"#FF9500",marginTop:6},children:"⚠️ Share this password securely. Advise participant to change it after login."})]}):e.jsxs("span",{style:{color:"#FF3B30"},children:["❌ ",k.message]})})]})]})]}),j&&e.jsx("div",{style:Pe,children:e.jsxs("div",{style:{...ue,maxWidth:420,textAlign:"center"},children:[e.jsx("div",{style:{fontSize:40,marginBottom:12},children:j.type==="name"?"✏️":"🔑"}),e.jsx("h3",{style:{margin:"0 0 8px",color:"var(--text-primary)"},children:j.type==="name"?"Confirm Name Change":"Confirm Password Reset"}),e.jsx("p",{style:{fontSize:13,color:"var(--text-secondary)",marginBottom:20},children:j.type==="name"?`Update name to "${m} ${i}" on Thinkific for ${c.email}?`:`Generate a new temporary password for ${c.first_name} ${c.last_name} (${c.email})?`}),e.jsx("p",{style:{fontSize:11,color:"#FF9500"},children:"⚠️ This action will modify data on Thinkific and be logged in the audit trail."}),e.jsxs("div",{style:{display:"flex",gap:10,justifyContent:"center",marginTop:16},children:[e.jsx("button",{onClick:()=>L(null),style:De,children:"Cancel"}),e.jsx("button",{onClick:j.type==="name"?F:A,style:{...ze,background:j.type==="name"?"linear-gradient(135deg, #667eea 0%, #764ba2 100%)":"linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)"},children:"Confirm"})]})]})}),B&&e.jsx("div",{style:Pe,children:e.jsxs("div",{style:{...ue,maxWidth:700,maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},children:[e.jsx("h3",{style:{margin:0,color:"var(--text-primary)"},children:"📋 Thinkific Action Audit Log"}),e.jsx("button",{onClick:()=>W(!1),style:{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"var(--text-secondary)"},children:"✕"})]}),e.jsx("div",{style:{flex:1,overflowY:"auto"},children:M.length===0?e.jsx("div",{style:{textAlign:"center",padding:40,color:"var(--text-secondary)"},children:"No actions logged yet"}):e.jsxs("table",{style:{width:"100%",fontSize:12,borderCollapse:"collapse"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{borderBottom:"1px solid rgba(255,255,255,0.08)"},children:[e.jsx("th",{style:ce,children:"Time"}),e.jsx("th",{style:ce,children:"Actor"}),e.jsx("th",{style:ce,children:"Action"}),e.jsx("th",{style:ce,children:"Target"}),e.jsx("th",{style:ce,children:"Details"})]})}),e.jsx("tbody",{children:M.map(R=>{var oe,ne;const I=R.details?JSON.parse(R.details):{},G=R.action.includes("failed");return e.jsxs("tr",{style:{borderBottom:"1px solid rgba(255,255,255,0.03)"},children:[e.jsx("td",{style:pe,children:new Date(R.created_at).toLocaleString()}),e.jsx("td",{style:pe,children:R.actor_name||I.actor_name}),e.jsx("td",{style:pe,children:e.jsx("span",{style:{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:600,background:G?"rgba(255,59,48,0.12)":"rgba(52,199,89,0.12)",color:G?"#FF3B30":"#34C759"},children:R.action.replace("thinkific_","").replace(/_/g," ")})}),e.jsx("td",{style:pe,children:I.thinkific_email||R.target_id}),e.jsx("td",{style:pe,children:I.previous?`${I.previous.first_name} ${I.previous.last_name} → ${((oe=I.updated)==null?void 0:oe.first_name)||""} ${((ne=I.updated)==null?void 0:ne.last_name)||""}`:I.error||I.student_name||"—"})]},R.id)})})]})})]})}),!c&&w.length===0&&e.jsxs("div",{style:{...ue,textAlign:"center",padding:60},children:[e.jsx("div",{style:{fontSize:48,marginBottom:12},children:"🔧"}),e.jsx("div",{style:{fontSize:16,fontWeight:600,color:"var(--text-primary)",marginBottom:4},children:"Tech Support Panel"}),e.jsx("div",{style:{fontSize:13,color:"var(--text-secondary)",maxWidth:400,margin:"0 auto"},children:"Search for a participant above to update their name or reset their password on Thinkific. All actions are audit-logged."})]})]})}const ue={background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:16,padding:24},ar={width:"100%",padding:"12px 16px",borderRadius:12,boxSizing:"border-box",background:"var(--glass-bg)",border:"1px solid var(--glass-border)",color:"var(--text-primary)",fontSize:14,outline:"none",backdropFilter:"blur(12px)"},sr={position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:"0 0 12px 12px",maxHeight:320,overflowY:"auto"},Ie={padding:18,borderRadius:12,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)"},Be={display:"block",fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:4},We={width:"100%",padding:"8px 12px",borderRadius:8,boxSizing:"border-box",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-primary)",fontSize:13,outline:"none"},ze={padding:"10px 18px",borderRadius:10,border:"none",cursor:"pointer",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",color:"white",fontWeight:600,fontSize:13},De={padding:"8px 16px",borderRadius:8,border:"1px solid var(--glass-border)",background:"var(--glass-bg)",color:"var(--text-primary)",cursor:"pointer",fontSize:12,fontWeight:600},Pe={position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e3},ce={textAlign:"left",padding:"8px 10px",fontWeight:600,color:"var(--text-secondary)"},pe={padding:"8px 10px",color:"var(--text-primary)"};function or(){const{user:t,showToast:r}=U(),s=["Admin","LeadershipTeam"].includes(t==null?void 0:t.role),g=(t==null?void 0:t.role)==="Facilitator",[d,u]=a.useState(s?"":t==null?void 0:t.celebration_point),[c,o]=a.useState([]),[n,h]=a.useState(""),[l,p]=a.useState(null);a.useEffect(()=>{m()},[]);const m=async()=>{try{const z=await(await fetch("/api/formation-groups")).json();z.success&&o(z.groups||[])}catch{}},x=async(f,z)=>{var N;p(f);try{const v=z.includes("?")?"&":"?",k=d&&!z.includes("group/")?`${z}${v}celebration_point=${d}`:z,b=await fetch(k);if(!b.ok){const M=await b.json().catch(()=>({}));throw new Error(M.message||"Download failed")}const _=await b.blob(),j=((N=(b.headers.get("Content-Disposition")||"").match(/filename="(.+)"/))==null?void 0:N[1])||`report_${new Date().toISOString().slice(0,10)}.csv`,L=document.createElement("a");L.href=URL.createObjectURL(_),L.download=j,L.click(),URL.revokeObjectURL(L.href),r(`Downloaded ${j}`,"success")}catch(v){r(v.message||"Download failed","error")}p(null)},i=[{key:"roster",icon:"👥",title:"Participant Roster",desc:"Full roster with progress summary, risk scores, and activity.",url:"/api/exports/campus/roster"},{key:"risk",icon:"⚠️",title:"Inactivity / Risk Report",desc:"At-risk participants sorted by risk score and inactivity days.",url:"/api/exports/campus/risk"},{key:"weekly",icon:"📝",title:"Weekly Report Aggregation",desc:"All weekly reports with themes, evidence, and concerns.",url:"/api/exports/campus/weekly-reports"},{key:"evidence",icon:"🌱",title:"Formation Evidence Summary",desc:"Formation observations and growth evidence from reports.",url:"/api/exports/campus/formation-evidence"},{key:"checkpoints",icon:"🎯",title:"Checkpoint Summary",desc:"Discernment checkpoint data with review notes and trends.",url:"/api/exports/campus/checkpoints"}],y=d?c.filter(f=>f.celebration_point===d):c;return e.jsxs("div",{className:"page-container",style:{padding:24,maxWidth:960},children:[e.jsxs("div",{style:{marginBottom:24},children:[e.jsx("h1",{style:{margin:0,fontSize:24,color:"var(--text-primary)"},children:"Report Extraction"}),e.jsx("p",{style:{margin:"4px 0 0",fontSize:13,color:"var(--text-secondary)"},children:"Download CSV reports for campus and formation group data"})]}),s&&e.jsx("div",{style:{marginBottom:20},children:e.jsxs("select",{value:d,onChange:f=>u(f.target.value),style:$e,children:[e.jsx("option",{value:"",children:"All Campuses"}),Z.map(f=>e.jsx("option",{value:f,children:f},f))]})}),!g&&e.jsxs(e.Fragment,{children:[e.jsx("h2",{style:Me,children:"📊 Campus-Based Reports"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:14,marginBottom:32},children:i.map(f=>e.jsxs("div",{style:xe,children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8},children:[e.jsx("span",{style:{fontSize:22},children:f.icon}),e.jsx("span",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)"},children:f.title})]}),e.jsx("p",{style:{fontSize:12,color:"var(--text-secondary)",lineHeight:1.5,margin:"0 0 12px"},children:f.desc}),e.jsx("button",{onClick:()=>x(f.key,f.url),disabled:l===f.key,style:{...me,opacity:l===f.key?.5:1},children:l===f.key?"⏳ Generating...":"📥 Download CSV"})]},f.key))})]}),e.jsx("h2",{style:Me,children:"🏘️ Group-Based Reports"}),y.length===0?e.jsxs("div",{style:{...xe,textAlign:"center",padding:40},children:[e.jsx("div",{style:{fontSize:36,marginBottom:8},children:"🏘️"}),e.jsx("div",{style:{fontSize:13,color:"var(--text-secondary)"},children:"No groups available"})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{marginBottom:16},children:e.jsxs("select",{value:n,onChange:f=>h(f.target.value),style:$e,children:[e.jsx("option",{value:"",children:"Select a Formation Group..."}),y.map(f=>e.jsxs("option",{value:f.id,children:[f.group_code," — ",f.name," (",f.celebration_point,")"]},f.id))]})}),n&&e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:14},children:[e.jsxs("div",{style:xe,children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8},children:[e.jsx("span",{style:{fontSize:22},children:"👥"}),e.jsx("span",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)"},children:"Group Member Roster"})]}),e.jsx("p",{style:{fontSize:12,color:"var(--text-secondary)",lineHeight:1.5,margin:"0 0 12px"},children:"Members with progress, activity, and risk scores."}),e.jsx("button",{onClick:()=>x("group-roster",`/api/exports/group/${n}/roster`),disabled:l==="group-roster",style:{...me,opacity:l==="group-roster"?.5:1},children:l==="group-roster"?"⏳ Generating...":"📥 Download CSV"})]}),e.jsxs("div",{style:xe,children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8},children:[e.jsx("span",{style:{fontSize:22},children:"📝"}),e.jsx("span",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)"},children:"Weekly Report History"})]}),e.jsx("p",{style:{fontSize:12,color:"var(--text-secondary)",lineHeight:1.5,margin:"0 0 12px"},children:"All weekly reports submitted for this group."}),e.jsx("button",{onClick:()=>x("group-weekly",`/api/exports/group/${n}/weekly-reports`),disabled:l==="group-weekly",style:{...me,opacity:l==="group-weekly"?.5:1},children:l==="group-weekly"?"⏳ Generating...":"📥 Download CSV"})]}),e.jsxs("div",{style:xe,children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8},children:[e.jsx("span",{style:{fontSize:22},children:"🌱"}),e.jsx("span",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)"},children:"Formation Evidence Timeline"})]}),e.jsx("p",{style:{fontSize:12,color:"var(--text-secondary)",lineHeight:1.5,margin:"0 0 12px"},children:"Weekly formation observations and growth evidence."}),e.jsx("button",{onClick:()=>x("group-evidence",`/api/exports/group/${n}/formation-evidence`),disabled:l==="group-evidence",style:{...me,opacity:l==="group-evidence"?.5:1},children:l==="group-evidence"?"⏳ Generating...":"📥 Download CSV"})]})]})]})]})}const xe={background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:14,padding:18},$e={padding:"8px 14px",borderRadius:8,background:"var(--glass-bg)",border:"1px solid var(--glass-border)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"blur(12px)",minWidth:280},Me={fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:14,display:"flex",alignItems:"center",gap:8},me={padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",color:"white",fontWeight:600,fontSize:12,width:"100%"};function nr({toasts:t}){const r={success:"✓",error:"✕",info:"ℹ"};return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"toast-container",children:t.map(s=>e.jsxs("div",{className:`toast ${s.type}`,children:[e.jsx("div",{className:"toast-icon",children:r[s.type]||"ℹ"}),e.jsx("span",{className:"toast-message",children:s.message})]},s.id))}),e.jsx("style",{children:`
                .toast-container {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 20000;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    pointer-events: none;
                }
                .toast {
                    pointer-events: auto;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 16px; /* Pill-like for notifications */
                    background: var(--glass-layer-4);
                    backdrop-filter: blur(40px) saturate(180%);
                    -webkit-backdrop-filter: blur(40px) saturate(180%);
                    border: var(--border-layer-3);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1);
                    color: var(--text-primary);
                    font-family: var(--font-ui);
                    font-size: var(--text-footnote);
                    font-weight: 500;
                    animation: toastSlideIn 0.3s var(--ease-spring);
                    min-width: 280px;
                    max-width: 400px;
                }
                [data-theme="light"] .toast {
                    background: rgba(255,255,255,0.85);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                }

                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(20px) scale(0.95); }
                    to { opacity: 1; transform: translateX(0) scale(1); }
                }

                .toast-icon {
                    width: 24px; height: 24px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                    font-size: 14px;
                    font-weight: 700;
                }
                .toast.success .toast-icon { background: rgba(48, 209, 88, 0.2); color: #30d158; }
                .toast.error .toast-icon { background: rgba(255, 69, 58, 0.2); color: #ff453a; }
                .toast.info .toast-icon { background: rgba(10, 132, 255, 0.2); color: #0a84ff; }
            `})]})}const Ke=a.createContext(null),ge=[{id:"default",name:"Default",path:"/bg.jpeg",thumbnail:"/bg.jpeg"},{id:"high-sierra",name:"High Sierra",path:"/wallpapers/10-13.jpeg",thumbnail:"/wallpapers/thumbnails/10-13 Small.jpeg"},{id:"sequoia-dark",name:"Sequoia Dark",path:"/wallpapers/15-Sequoia-Dark-6K.jpeg",thumbnail:"/wallpapers/thumbnails/15-Sequoia-Dark-6K Small.jpeg"},{id:"sequoia-light",name:"Sequoia Light",path:"/wallpapers/15-Sequoia-Light-6K.jpeg",thumbnail:"/wallpapers/thumbnails/15-Sequoia-Light-6K Small.jpeg"},{id:"sequoia-sunrise",name:"Sequoia Sunrise",path:"/wallpapers/15-Sequoia-Sunrise.jpeg",thumbnail:"/wallpapers/thumbnails/15-Sequoia-Sunrise Small.jpeg"},{id:"tahoe-dawn",name:"Tahoe Dawn",path:"/wallpapers/26-Tahoe-Beach-Dawn.jpeg",thumbnail:"/wallpapers/thumbnails/26-Tahoe-Beach-Dawn Small.jpeg"},{id:"tahoe-day",name:"Tahoe Day",path:"/wallpapers/26-Tahoe-Beach-Day.jpeg",thumbnail:"/wallpapers/thumbnails/26-Tahoe-Beach-Day Small.jpeg"},{id:"tahoe-dusk",name:"Tahoe Dusk",path:"/wallpapers/26-Tahoe-Beach-Dusk.jpeg",thumbnail:"/wallpapers/thumbnails/26-Tahoe-Beach-Dusk Small.jpeg"},{id:"tahoe-night",name:"Tahoe Night",path:"/wallpapers/26-Tahoe-Beach-Night.jpeg",thumbnail:"/wallpapers/thumbnails/26-Tahoe-Beach-Night Small.jpeg"}],he=[{id:"blue",label:"Blue",value:"#007AFF"},{id:"purple",label:"Purple",value:"#AF52DE"},{id:"pink",label:"Pink",value:"#FF2D55"},{id:"red",label:"Red",value:"#FF3B30"},{id:"orange",label:"Orange",value:"#FF9500"},{id:"yellow",label:"Yellow",value:"#FFCC00"},{id:"green",label:"Green",value:"#34C759"},{id:"graphite",label:"Graphite",value:"#8E8E93"},{id:"multicolor",label:"Multicolor",value:"#007AFF"}],ir="coordinator-wallpaper",lr="coordinator-theme",dr="coordinator-accent";function cr({children:t}){const{user:r}=U(),s=m=>({wallpaper:m?`coordinator-wallpaper-${m.username}`:ir,theme:m?`coordinator-theme-${m.username}`:lr,accent:m?`coordinator-accent-${m.username}`:dr}),[g,d]=a.useState(()=>{const m=s(r),x=localStorage.getItem(m.wallpaper);if(x){const i=ge.find(y=>y.id===x);if(i)return i}return ge[0]}),[u,c]=a.useState(()=>{const m=s(r);return localStorage.getItem(m.theme)||"dark"}),[o,n]=a.useState(()=>{const m=s(r),x=localStorage.getItem(m.accent);if(x){const i=he.find(y=>y.id===x);if(i)return i}return he[0]});a.useEffect(()=>{const m=s(r),x=localStorage.getItem(m.wallpaper);if(x){const f=ge.find(z=>z.id===x);f&&d(f)}else r||d(ge[0]);const i=localStorage.getItem(m.theme);c(i||"dark");const y=localStorage.getItem(m.accent);if(y){const f=he.find(z=>z.id===y);f&&n(f)}else n(he[0])},[r]);const h=m=>{d(m),localStorage.setItem(s(r).wallpaper,m.id)},l=m=>{c(m),localStorage.setItem(s(r).theme,m)},p=m=>{n(m),localStorage.setItem(s(r).accent,m.id)};return a.useEffect(()=>{document.body.style.setProperty("--wallpaper-url",`url('${g.path}')`)},[g]),a.useEffect(()=>{document.documentElement.setAttribute("data-theme",u)},[u]),a.useEffect(()=>{const m=document.documentElement;m.style.setProperty("--accent-color",o.value);const x=(i,y=30)=>{const f=parseInt(i.slice(1),16),z=Math.max(0,(f>>16)-y),N=Math.max(0,(f>>8&255)-y),v=Math.max(0,(f&255)-y);return`#${(z<<16|N<<8|v).toString(16).padStart(6,"0")}`};m.style.setProperty("--accent-hover",x(o.value)),m.style.setProperty("--accent-gradient",`linear-gradient(135deg, ${o.value} 0%, ${x(o.value)} 100%)`)},[o]),e.jsx(Ke.Provider,{value:{wallpaper:g,setWallpaper:h,wallpapers:ge,theme:u,setTheme:l,accentColor:o,setAccentColor:p,accentColors:he},children:t})}const _r=()=>a.useContext(Ke);function pr(){const{notifications:t,markAsRead:r,isOpen:s,setIsOpen:g}=Le(),d=a.useRef(null);if(a.useEffect(()=>{function o(n){d.current&&!d.current.contains(n.target)&&s&&g(!1)}return document.addEventListener("mousedown",o),()=>document.removeEventListener("mousedown",o)},[s,g]),!s)return null;const u=new Date().toLocaleDateString(),c=t.reduce((o,n)=>{const h=new Date(n.created_at).toLocaleDateString(),l=h===u?"Today":h;return o[l]||(o[l]=[]),o[l].push(n),o},{});return e.jsxs("div",{ref:d,className:"notification-center glass-panel",style:{position:"fixed",top:"38px",right:"10px",width:"320px",height:"calc(100vh - 140px)",zIndex:9e3,borderRadius:"12px",overflow:"hidden",display:"flex",flexDirection:"column",animation:"slideInRight 0.25s ease-out",border:"1px solid var(--glass-border)",background:"var(--glass-bg)",backdropFilter:"blur(20px)",boxShadow:"0 20px 50px rgba(0,0,0,0.3)"},children:[e.jsxs("div",{style:{padding:"12px 16px",borderBottom:"1px solid var(--glass-border)",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{style:{fontWeight:600,fontSize:"13px",color:"var(--text-primary)"},children:"Notifications"}),t.some(o=>!o.is_read)&&e.jsx("button",{onClick:()=>r(),style:{background:"none",border:"none",color:"var(--accent-color)",fontSize:"11px",fontWeight:500,cursor:"pointer"},children:"Mark all as read"})]}),e.jsx("div",{style:{flex:1,overflowY:"auto",padding:"0 10px"},children:Object.keys(c).length===0?e.jsx("div",{style:{padding:"40px 20px",textAlign:"center",color:"var(--text-secondary)",fontSize:"13px"},children:"No notifications"}):Object.entries(c).map(([o,n])=>e.jsxs("div",{children:[e.jsx("h4",{style:{margin:"16px 6px 8px",fontSize:"11px",fontWeight:600,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.5px"},children:o}),n.map(h=>e.jsxs("div",{onClick:()=>r(h.id),className:"notification-item",style:{padding:"10px",marginBottom:"6px",borderRadius:"8px",background:h.is_read?"transparent":"rgba(var(--accent-rgb), 0.1)",cursor:"pointer",transition:"background 0.2s",position:"relative"},children:[!h.is_read&&e.jsx("div",{style:{position:"absolute",left:"4px",top:"16px",width:"6px",height:"6px",borderRadius:"50%",background:"var(--accent-color)"}}),e.jsxs("div",{style:{paddingLeft:h.is_read?"0":"14px"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"2px"},children:[e.jsx("span",{style:{fontSize:"13px",fontWeight:500,color:"var(--text-primary)"},children:h.title}),e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)"},children:new Date(h.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})})]}),e.jsx("p",{style:{fontSize:"12px",color:"var(--text-secondary)",margin:0,lineHeight:"1.4"},children:h.message})]})]},h.id))]},o))}),e.jsx("style",{children:`
                .notification-center {
                    position: fixed;
                    top: 50px;
                    right: 16px;
                    width: 360px;
                    height: calc(100vh - 140px);
                    z-index: 9000;
                    border-radius: 16px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    animation: ncSlideIn 0.3s var(--ease-out-expo);
                    border: var(--border-layer-3);
                    background: var(--glass-layer-3);
                    backdrop-filter: var(--blur-layer-3);
                    -webkit-backdrop-filter: var(--blur-layer-3);
                    box-shadow: var(--shadow-layer-4);
                }
                /* Inner rim light */
                .notification-center::after {
                    content: ''; position: absolute; inset: 0; border-radius: 16px; padding: 1px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
                }

                @keyframes ncSlideIn {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                .notification-item {
                    transition: all 0.2s;
                }
                .notification-item:hover {
                    background: var(--surface-hover) !important;
                    transform: scale(0.99);
                }
                
                /* Custom Scrollbar for this panel */
                div::-webkit-scrollbar { width: 4px; }
                div::-webkit-scrollbar-track { background: transparent; }
                div::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 4px; }
            `})]})}function xr({student:t,onClose:r}){const s=a.useRef();return a.useEffect(()=>{const g=d=>{s.current&&!s.current.contains(d.target)&&r()};return document.addEventListener("mousedown",g),()=>document.removeEventListener("mousedown",g)},[r]),t?e.jsxs("div",{className:"student-modal-overlay",children:[e.jsx("div",{className:"modal glass-modal student-modal-card",ref:s,onClick:g=>g.stopPropagation(),style:{padding:0},children:e.jsxs("div",{style:{position:"relative",height:"100%",overflow:"hidden"},children:[e.jsx("button",{onClick:r,className:"student-modal-close-btn",children:"✕"}),e.jsx(Je,{student:t})]})}),e.jsx("style",{children:`
                .student-modal-overlay {
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,0.3); /* Tuned opacity */
                    backdrop-filter: blur(8px);
                    z-index: 10000;
                    display: flex; align-items: center; justify-content: center;
                    isolation: isolate;
                }
                .student-modal-card {
                    width: 600px; height: 700px;
                    max-width: 90vw; max-height: 90vh;
                    border-radius: 20px;
                    border: 0.5px solid var(--glass-border-bright);
                    box-shadow: 0 40px 100px var(--glass-shadow);
                    overflow: hidden;
                    background: var(--glass-layer-4); /* Ensure high opacity */
                }
                .student-modal-close-btn {
                    position: absolute; top: 16px; right: 16px;
                    background: rgba(0,0,0,0.2); color: white;
                    width: 28px; height: 28px; border-radius: 50%;
                    border: none; cursor: pointer; z-index: 10;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 14px;
                }
                .student-modal-close-btn:hover { background: rgba(0,0,0,0.4); }
                /* Override DetailView internal padding/margin for modal context if needed */
                .student-modal-card .student-detail-view {
                    height: 100%;
                }
                .student-modal-card .student-cover-banner {
                    height: 140px;
                }
            `})]}):null}const gr=[{name:"Dashboard",path:"/dashboard",icon:"📊",description:"Overview & analytics"},{name:"Students",path:"/students",icon:"👥",description:"Student management"},{name:"Formation Groups",path:"/groups",icon:"🏘️",description:"Group management"},{name:"Attendance",path:"/attendance",icon:"📅",description:"Session attendance & check-in"},{name:"Weekly Reports",path:"/weekly-reports",icon:"📝",description:"Submit & view reports"},{name:"Checkpoints",path:"/checkpoints",icon:"🎯",description:"Discernment checkpoints"},{name:"Reports & Export",path:"/exports",icon:"📤",description:"Export data as CSV"},{name:"Settings",path:"/settings",icon:"⚙️",description:"App preferences"},{name:"Admin Panel",path:"/admin",icon:"🔧",description:"User management"},{name:"Audit Logs",path:"/audit",icon:"📋",description:"Activity history"}],be=["All","Students","Groups","Notes","Pages"];function hr(){const{isOpen:t,closeSpotlight:r}=Re(),[s,g]=a.useState(""),[d,u]=a.useState("All"),[c,o]=a.useState({students:[],groups:[],notes:[],pages:[]}),[n,h]=a.useState(!1),[l,p]=a.useState(0),[m,x]=a.useState(null),i=a.useRef(null),y=Q();a.useEffect(()=>{t&&(setTimeout(()=>{var b;return(b=i.current)==null?void 0:b.focus()},50),g(""),u("All"),o({students:[],groups:[],notes:[],pages:[]}),p(0))},[t]),a.useEffect(()=>{if(!s.trim()){o({students:[],groups:[],notes:[],pages:[]});return}const b=s.toLowerCase(),_=gr.filter(j=>j.name.toLowerCase().includes(b)||j.description.toLowerCase().includes(b)).map(j=>({...j,type:"page"})),E=setTimeout(async()=>{h(!0);try{const L=await(await fetch(`/api/data/search?q=${encodeURIComponent(s)}`)).json();L.success&&o({students:L.results.students||[],groups:L.results.groups||[],notes:L.results.notes||[],pages:_})}catch(j){console.error("Search error",j),o(L=>({...L,pages:_}))}finally{h(!1)}},250);return o(j=>({...j,pages:_})),()=>clearTimeout(E)},[s]);const f=(()=>{const b=[];return(d==="All"||d==="Pages")&&b.push(...c.pages),(d==="All"||d==="Students")&&b.push(...c.students),(d==="All"||d==="Groups")&&b.push(...c.groups),(d==="All"||d==="Notes")&&b.push(...c.notes),b})();a.useEffect(()=>{const b=_=>{if(t){if(_.key==="ArrowDown")_.preventDefault(),p(E=>(E+1)%Math.max(1,f.length));else if(_.key==="ArrowUp")_.preventDefault(),p(E=>(E-1+f.length)%Math.max(1,f.length));else if(_.key==="Enter")_.preventDefault(),f[l]&&z(f[l]);else if(_.key==="Tab"){_.preventDefault();const E=be.indexOf(d);u(be[(E+1)%be.length]),p(0)}}};return window.addEventListener("keydown",b),()=>window.removeEventListener("keydown",b)},[t,f,l,d]);const z=b=>{b.type==="student"?(x(b),r()):b.type==="group"?(r(),y("/groups")):b.type==="page"?(r(),y(b.path)):b.type==="note"&&(r(),b.student_id?y("/students"):b.group_id&&y("/groups"))},N=b=>b.type==="page"?b.icon:b.type==="student"?"👤":b.type==="group"?"🏘️":b.type==="note"?"📝":"📄",v=b=>{var _;return b.type==="student"?`${b.email||""} · ${b.celebration_point||""} · ${Math.round(b.percentage_completed||0)}%`:b.type==="group"?`${b.group_code} · ${b.member_count||0} members · ${b.facilitator_name||"No facilitator"}`:b.type==="note"?`${b.author_name} · ${(_=b.content)==null?void 0:_.slice(0,60)}...`:b.type==="page"?b.description:""},k=f.length;return!t&&!m?null:e.jsxs(e.Fragment,{children:[t&&e.jsx("div",{className:`spotlight-overlay ${s.trim()?"":"empty"}`,onClick:r,children:e.jsxs("div",{className:`spotlight ${s.trim()?"active":"empty"}`,onClick:b=>b.stopPropagation(),children:[e.jsxs("div",{className:"spotlight-head",children:[e.jsx("div",{className:"spotlight-search-well",children:e.jsxs("div",{className:"spotlight-search-bar",children:[e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",className:"search-icon",children:[e.jsx("circle",{cx:"11",cy:"11",r:"8"}),e.jsx("line",{x1:"21",y1:"21",x2:"16.65",y2:"16.65"})]}),e.jsx("input",{ref:i,type:"text",placeholder:"Spotlight Search",value:s,onChange:b=>{g(b.target.value),p(0)},className:"spotlight-input"}),s.trim()&&e.jsx("div",{className:"keyboard-hint",children:"esc"})]})}),e.jsxs("div",{className:"spotlight-quick-actions",children:[e.jsx("button",{className:"sq-btn",title:"Students",onClick:()=>{r(),y("/students")},children:e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M22 10v6M2 10l10-5 10 5-10 5z"}),e.jsx("path",{d:"M6 12v5c3 3 9 3 12 0v-5"})]})}),e.jsx("button",{className:"sq-btn",title:"Groups",onClick:()=>{r(),y("/groups")},children:e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"9",cy:"7",r:"4"}),e.jsx("path",{d:"M23 21v-2a4 4 0 0 0-3-3.87"}),e.jsx("path",{d:"M16 3.13a4 4 0 0 1 0 7.75"})]})}),e.jsx("button",{className:"sq-btn",title:"Weekly Reports",onClick:()=>{r(),y("/weekly-reports")},children:e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("line",{x1:"3",y1:"9",x2:"21",y2:"9"}),e.jsx("line",{x1:"9",y1:"21",x2:"9",y2:"9"})]})}),e.jsx("button",{className:"sq-btn",title:"Settings",onClick:()=>{r(),y("/settings")},children:e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"3"}),e.jsx("path",{d:"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"})]})})]})]}),s.trim()&&e.jsx("div",{className:"spotlight-tabs",children:be.map(b=>e.jsxs("button",{className:`spotlight-tab ${d===b?"active":""}`,onClick:()=>{u(b),p(0)},children:[b,b!=="All"&&e.jsx("span",{className:"tab-count",children:b==="Students"?c.students.length:b==="Groups"?c.groups.length:b==="Notes"?c.notes.length:c.pages.length})]},b))}),(n||k>0||s.trim())&&e.jsx("div",{className:"spotlight-results",children:n&&k===0?e.jsxs("div",{className:"spotlight-message",children:[e.jsx("div",{className:"spotlight-spinner"}),"Searching..."]}):k>0?e.jsxs(e.Fragment,{children:[(d==="All"||d==="Pages")&&c.pages.length>0&&e.jsxs("div",{className:"result-section",children:[e.jsx("div",{className:"section-label",children:"Pages"}),c.pages.map((b,_)=>{const E=f.indexOf(b);return e.jsxs("div",{className:`spotlight-item ${E===l?"active":""}`,onClick:()=>z(b),onMouseEnter:()=>p(E),children:[e.jsx("div",{className:"item-icon emoji",children:N(b)}),e.jsxs("div",{className:"item-info",children:[e.jsx("div",{className:"item-name",children:b.name}),e.jsx("div",{className:"item-meta",children:v(b)})]}),e.jsx("div",{className:"item-action",children:"↵"})]},`page-${_}`)})]}),(d==="All"||d==="Students")&&c.students.length>0&&e.jsxs("div",{className:"result-section",children:[e.jsx("div",{className:"section-label",children:"Students"}),c.students.map((b,_)=>{const E=f.indexOf(b);return e.jsxs("div",{className:`spotlight-item ${E===l?"active":""}`,onClick:()=>z(b),onMouseEnter:()=>p(E),children:[e.jsx("div",{className:"item-icon avatar",children:(b.name||"?").charAt(0)}),e.jsxs("div",{className:"item-info",children:[e.jsx("div",{className:"item-name",children:b.name}),e.jsx("div",{className:"item-meta",children:v(b)})]}),b.risk_score>=50&&e.jsx("span",{className:"risk-badge",children:"⚠️"}),e.jsx("div",{className:"item-action",children:"↵"})]},`student-${b.id}`)})]}),(d==="All"||d==="Groups")&&c.groups.length>0&&e.jsxs("div",{className:"result-section",children:[e.jsx("div",{className:"section-label",children:"Formation Groups"}),c.groups.map((b,_)=>{const E=f.indexOf(b);return e.jsxs("div",{className:`spotlight-item ${E===l?"active":""}`,onClick:()=>z(b),onMouseEnter:()=>p(E),children:[e.jsx("div",{className:"item-icon emoji",children:"🏘️"}),e.jsxs("div",{className:"item-info",children:[e.jsx("div",{className:"item-name",children:b.name}),e.jsx("div",{className:"item-meta",children:v(b)})]}),!b.active&&e.jsx("span",{className:"inactive-badge",children:"Inactive"}),e.jsx("div",{className:"item-action",children:"↵"})]},`group-${b.id}`)})]}),(d==="All"||d==="Notes")&&c.notes.length>0&&e.jsxs("div",{className:"result-section",children:[e.jsx("div",{className:"section-label",children:"Notes"}),c.notes.map((b,_)=>{const E=f.indexOf(b);return e.jsxs("div",{className:`spotlight-item ${E===l?"active":""}`,onClick:()=>z(b),onMouseEnter:()=>p(E),children:[e.jsx("div",{className:"item-icon emoji",children:"📝"}),e.jsxs("div",{className:"item-info",children:[e.jsx("div",{className:"item-name",children:b.author_name}),e.jsx("div",{className:"item-meta",children:v(b)})]}),e.jsx("div",{className:"item-action",children:"↵"})]},`note-${b.id}`)})]})]}):s.trim()&&!n?e.jsx("div",{className:"spotlight-message",children:"No results found"}):null}),e.jsxs("div",{className:"spotlight-footer",children:[e.jsxs("span",{className:"footer-hint",children:[e.jsx("kbd",{children:"↑↓"})," Navigate"]}),e.jsxs("span",{className:"footer-hint",children:[e.jsx("kbd",{children:"↵"})," Open"]}),e.jsxs("span",{className:"footer-hint",children:[e.jsx("kbd",{children:"Tab"})," Category"]}),e.jsxs("span",{className:"footer-hint",children:[e.jsx("kbd",{children:"Esc"})," Close"]})]})]})}),m&&e.jsx(xr,{student:m,onClose:()=>x(null),onStatusChange:()=>{}}),e.jsx("style",{children:`
                /* Container styles handled by .spotlight in index.css */
                .spotlight-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.25);
                    backdrop-filter: blur(8px);
                    z-index: 9999;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    padding-top: 60px;
                    transition: background 0.3s, backdrop-filter 0.3s;
                    animation: fadeOverlay 0.2s ease-out;
                }
                .spotlight-overlay.empty {
                    background: transparent;
                    backdrop-filter: none;
                    -webkit-backdrop-filter: none;
                }

                .spotlight-head {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                }

                .spotlight-search-well {
                    flex: 1;
                    height: 56px;
                    transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
                }

                /* Empty State: High Vibrancy Tahoe Glass */
                .spotlight.empty .spotlight-search-well {
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(48px) saturate(200%);
                    -webkit-backdrop-filter: blur(48px) saturate(200%);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    border-radius: 999px;
                    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255,255,255,0.1);
                    overflow: hidden;
                    display: flex;
                }
                [data-theme="light"] .spotlight.empty .spotlight-search-well {
                    background: rgba(255,255,255,0.35);
                    border-color: rgba(255,255,255,0.5);
                }

                .spotlight.active .spotlight-search-well {
                    background: transparent;
                    border: none;
                    box-shadow: none;
                    width: 100%;
                }

                .spotlight-search-bar {
                    display: flex;
                    align-items: center;
                    padding: 0 24px;
                    height: 100%;
                    width: 100%;
                    border-bottom: 1px solid var(--separator);
                    position: relative;
                }
                .spotlight.empty .spotlight-search-bar {
                    border-bottom: none;
                }

                /* Quick Actions */
                .spotlight-quick-actions {
                    display: flex;
                    gap: 12px;
                    animation: fadeInFadeUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) backwards;
                    transition: opacity 0.2s, max-width 0.3s cubic-bezier(0.32, 0.72, 0, 1), transform 0.2s;
                    max-width: 300px;
                    overflow: hidden;
                }
                .spotlight.active .spotlight-quick-actions {
                    opacity: 0;
                    max-width: 0;
                    margin-left: -12px; /* Pull the search bar flush */
                    transform: scale(0.95);
                    pointer-events: none;
                }
                
                @keyframes fadeInFadeUp {
                    from { opacity: 0; transform: translateY(10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .sq-btn {
                    width: 56px;
                    height: 56px;
                    flex-shrink: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(48px) saturate(200%);
                    -webkit-backdrop-filter: blur(48px) saturate(200%);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255, 255, 255, 0.9);
                    cursor: pointer;
                    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s;
                }
                [data-theme="light"] .sq-btn {
                    background: rgba(255,255,255,0.35);
                    border-color: rgba(255,255,255,0.5);
                    color: rgba(0, 0, 0, 0.8);
                }
                .sq-btn:hover {
                    transform: scale(1.08);
                    background: rgba(255, 255, 255, 0.25);
                }
                [data-theme="light"] .sq-btn:hover {
                    background: rgba(255, 255, 255, 0.5);
                }

                .search-icon {
                    color: var(--text-primary);
                    margin-right: 14px;
                    opacity: 0.8;
                }

                .spotlight-input {
                    flex: 1;
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                    font-size: 20px;
                    color: var(--text-primary);
                    font-weight: 400;
                    line-height: normal;
                    outline: none !important;
                    font-family: inherit;
                    letter-spacing: -0.2px;
                    padding: 0 !important;
                }
                .spotlight-input::placeholder { color: var(--text-secondary); font-weight: 400; }

                .keyboard-hint {
                    font-size: 11px;
                    color: var(--text-tertiary);
                    border: 1px solid var(--separator);
                    padding: 4px 8px;
                    border-radius: 6px;
                    background: rgba(255,255,255,0.03);
                }

                /* Categories */
                .spotlight-tabs {
                    display: flex;
                    padding: 0 16px;
                    gap: 4px;
                    border-bottom: 1px solid var(--separator);
                    background: rgba(0,0,0,0.02);
                }

                .spotlight-tab {
                    padding: 10px 14px;
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    position: relative;
                    transition: color 0.15s;
                }
                .spotlight-tab:hover { color: var(--text-primary); }
                .spotlight-tab.active {
                    color: var(--text-primary);
                }
                .spotlight-tab.active::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 14px;
                    right: 14px;
                    height: 2px;
                    background: var(--text-primary);
                    border-radius: 2px 2px 0 0;
                }

                /* Results Area */
                .spotlight-results {
                    max-height: 480px;
                    overflow-y: auto;
                }
                .spotlight-results::-webkit-scrollbar { width: 6px; }
                .spotlight-results::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

                .result-section { margin-bottom: 2px; }

                .section-label {
                    padding: 8px 18px 4px;
                    font-size: 11px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.35);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                [data-theme="light"] .section-label { color: rgba(0,0,0,0.35); }

                .spotlight-item {
                    display: flex;
                    align-items: center;
                    padding: 8px 18px;
                    cursor: pointer;
                    transition: background 0.08s;
                    gap: 10px;
                }
                .spotlight-item.active, .spotlight-item:hover {
                    background: rgba(0, 122, 255, 0.55);
                }
                [data-theme="light"] .spotlight-item.active,
                [data-theme="light"] .spotlight-item:hover {
                    background: rgba(0, 122, 255, 0.18);
                }

                .item-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    flex-shrink: 0;
                }
                .item-icon.avatar {
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border-radius: 50%;
                    font-size: 14px;
                }
                [data-theme="light"] .item-icon.avatar {
                    background: rgba(0,0,0,0.08);
                    color: #1d1d1f;
                }
                .item-icon.emoji { font-size: 20px; }

                .item-info { flex: 1; min-width: 0; }
                .item-name {
                    font-size: 14px;
                    color: white;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                [data-theme="light"] .item-name { color: #1d1d1f; }

                .item-meta {
                    font-size: 11px;
                    color: rgba(255,255,255,0.5);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .spotlight-item.active .item-meta { color: rgba(255,255,255,0.75); }
                [data-theme="light"] .item-meta { color: rgba(0,0,0,0.45); }

                .item-action {
                    font-size: 11px;
                    color: rgba(255,255,255,0.25);
                    flex-shrink: 0;
                }

                .risk-badge, .inactive-badge {
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    flex-shrink: 0;
                    margin-right: 4px;
                }
                .risk-badge { background: rgba(255,59,48,0.2); color: #ff6961; }
                .inactive-badge { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }

                .spotlight-message {
                    padding: 28px;
                    text-align: center;
                    color: rgba(255,255,255,0.35);
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                [data-theme="light"] .spotlight-message { color: rgba(0,0,0,0.35); }

                .spotlight-spinner {
                    width: 16px; height: 16px;
                    border: 2px solid rgba(255,255,255,0.1);
                    border-top-color: rgba(255,255,255,0.5);
                    border-radius: 50%;
                    animation: spotSpin 0.6s linear infinite;
                }

                /* Footer */
                .spotlight-footer {
                    display: flex;
                    gap: 16px;
                    padding: 8px 18px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                    font-size: 10px;
                    color: rgba(255,255,255,0.25);
                }
                [data-theme="light"] .spotlight-footer {
                    border-top-color: rgba(0,0,0,0.06);
                    color: rgba(0,0,0,0.3);
                }
                .spotlight-footer kbd {
                    background: rgba(255,255,255,0.08);
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-family: inherit;
                    font-size: 10px;
                    margin-right: 2px;
                }
                [data-theme="light"] .spotlight-footer kbd { background: rgba(0,0,0,0.06); }

                @keyframes spotSlideDown {
                    from { opacity: 0; transform: scale(0.97) translateY(-12px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes spotFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes spotSpin {
                    to { transform: rotate(360deg); }
                }
            `})]})}const ur=[{keys:["⌘","K"],description:"Spotlight Search",category:"Navigation"},{keys:["⌘","N"],description:"New Note (go to Students)",category:"Actions"},{keys:["⌘","E"],description:"Export Data",category:"Actions"},{keys:["⌘",","],description:"Open Settings",category:"Navigation"},{keys:["⌘","/"],description:"Keyboard Shortcuts",category:"Help"},{keys:["⌘","D"],description:"Dashboard",category:"Navigation"},{keys:["⌘","G"],description:"Formation Groups",category:"Navigation"},{keys:["Esc"],description:"Close overlay / modal",category:"General"}];function mr(){const[t,r]=a.useState(!1),s=Q(),{toggleSpotlight:g}=Re(),{openSettings:d}=re(),{toggleCenter:u}=Le(),c=a.useCallback(n=>{const h=n.target.tagName.toLowerCase();if(h==="input"||h==="textarea"||h==="select")return;const l=n.metaKey||n.ctrlKey;if(l&&n.key==="k"){n.preventDefault(),g();return}if(l&&n.key==="n"){n.preventDefault(),s("/students");return}if(l&&n.key==="e"){n.preventDefault(),s("/exports");return}if(l&&n.key===","){n.preventDefault(),d();return}if(l&&n.key==="/"){n.preventDefault(),r(p=>!p);return}if(l&&n.key==="d"){n.preventDefault(),s("/dashboard");return}if(l&&n.key==="g"){n.preventDefault(),s("/groups");return}if(n.key==="Escape"&&t){r(!1);return}},[s,g,d,t,u]);if(a.useEffect(()=>(window.addEventListener("keydown",c),()=>window.removeEventListener("keydown",c)),[c]),!t)return null;const o={};return ur.forEach(n=>{o[n.category]||(o[n.category]=[]),o[n.category].push(n)}),e.jsxs("div",{className:"shortcuts-overlay",onClick:()=>r(!1),children:[e.jsxs("div",{className:"shortcuts-modal",onClick:n=>n.stopPropagation(),children:[e.jsxs("div",{className:"shortcuts-header",children:[e.jsx("h3",{children:"⌨️ Keyboard Shortcuts"}),e.jsx("button",{className:"shortcuts-close",onClick:()=>r(!1),children:"×"})]}),e.jsx("div",{className:"shortcuts-body",children:Object.entries(o).map(([n,h])=>e.jsxs("div",{className:"shortcut-category",children:[e.jsx("div",{className:"shortcut-cat-title",children:n}),h.map((l,p)=>e.jsxs("div",{className:"shortcut-row",children:[e.jsx("span",{className:"shortcut-desc",children:l.description}),e.jsx("span",{className:"shortcut-keys",children:l.keys.map((m,x)=>e.jsx("kbd",{children:m},x))})]},p))]},n))}),e.jsxs("div",{className:"shortcuts-footer",children:["Press ",e.jsx("kbd",{children:"⌘"}),e.jsx("kbd",{children:"/"})," to toggle this overlay"]})]}),e.jsx("style",{children:`
                .shortcuts-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(20px) saturate(140%);
                    -webkit-backdrop-filter: blur(20px) saturate(140%);
                    z-index: 10002;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: spotFadeIn 0.2s var(--ease-smooth);
                }
                [data-theme="light"] .shortcuts-overlay {
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(20px) saturate(160%);
                }

                .shortcuts-modal {
                    width: 440px;
                    max-width: 90vw;
                    background: var(--glass-layer-2);
                    backdrop-filter: var(--blur-layer-2);
                    -webkit-backdrop-filter: var(--blur-layer-2);
                    border-radius: 20px;
                    border: var(--border-layer-2);
                    box-shadow: var(--shadow-layer-4);
                    overflow: hidden;
                    animation: qlScale 0.3s var(--ease-out-expo);
                    position: relative;
                }
                /* Inner rim light */
                .shortcuts-modal::after {
                    content: ''; position: absolute; inset: 0; border-radius: 20px; padding: 1px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
                }

                .shortcuts-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 24px 12px;
                    border-bottom: 1px solid var(--separator);
                    background: rgba(0,0,0,0.02);
                }
                .shortcuts-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .shortcuts-close {
                    background: none;
                    border: none;
                    color: var(--text-tertiary);
                    font-size: 20px;
                    cursor: pointer;
                    padding: 4px;
                    line-height: 1;
                    width: 28px; height: 28px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                }
                .shortcuts-close:hover { background: rgba(128,128,128,0.15); color: var(--text-primary); }

                .shortcuts-body {
                    padding: 16px 24px;
                    max-height: 400px;
                    overflow-y: auto;
                }

                .shortcut-category { margin-bottom: 20px; }
                .shortcut-cat-title {
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    margin-bottom: 10px;
                }

                .shortcut-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid rgba(128,128,128,0.05);
                }
                .shortcut-row:last-child { border-bottom: none; }
                
                .shortcut-desc {
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .shortcut-keys {
                    display: flex;
                    gap: 4px;
                }
                .shortcut-keys kbd {
                    background: var(--glass-layer-3);
                    border: 1px solid var(--border-layer-3);
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-primary);
                    font-family: 'SF Mono', 'Menlo', monospace;
                    min-width: 24px;
                    text-align: center;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }

                .shortcuts-footer {
                    padding: 12px 24px;
                    border-top: 1px solid var(--separator);
                    text-align: center;
                    font-size: 12px;
                    color: var(--text-tertiary);
                    background: rgba(0,0,0,0.01);
                }
                .shortcuts-footer kbd {
                    background: rgba(128,128,128,0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: inherit;
                    font-size: 11px;
                    color: var(--text-secondary);
                }

                @keyframes spotFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes qlScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `})]})}const _e=[{name:"yellow",bg:"#fff9c4",border:"#f9a825",text:"#5d4037"},{name:"pink",bg:"#fce4ec",border:"#e91e63",text:"#880e4f"},{name:"green",bg:"#e8f5e9",border:"#43a047",text:"#1b5e20"},{name:"blue",bg:"#e3f2fd",border:"#1e88e5",text:"#0d47a1"},{name:"purple",bg:"#f3e5f5",border:"#8e24aa",text:"#4a148c"}];function br(){const[t,r]=a.useState(()=>{try{const o=localStorage.getItem("dashboard_stickies");return o?JSON.parse(o):[]}catch{return[]}}),[s,g]=a.useState(!1);a.useEffect(()=>{localStorage.setItem("dashboard_stickies",JSON.stringify(t))},[t]);const d=o=>{const n=_e.find(l=>l.name===o)||_e[0],h={id:Date.now(),text:"",color:n,x:60+Math.random()*100,y:80+Math.random()*80,width:200,height:180};r(l=>[...l,h]),g(!1)},u=(o,n)=>{r(h=>h.map(l=>l.id===o?{...l,...n}:l))},c=o=>{r(n=>n.filter(h=>h.id!==o))};return e.jsxs("div",{className:"stickies-layer",children:[e.jsxs("div",{className:"stickies-add-container",children:[e.jsx("button",{className:"stickies-add-btn",onClick:()=>g(!s),title:"Add Sticky Note",children:s?"×":"+"}),s&&e.jsx("div",{className:"stickies-color-menu",children:_e.map(o=>e.jsx("button",{className:"stickies-color-swatch",style:{background:o.bg,borderColor:o.border},onClick:()=>d(o.name),title:o.name},o.name))})]}),t.map(o=>e.jsx(fr,{note:o,onUpdate:n=>u(o.id,n),onDelete:()=>c(o.id)},o.id)),e.jsx("style",{children:`
                .stickies-layer {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 100;
                }

                .stickies-add-container {
                    position: fixed;
                    bottom: 90px;
                    right: 24px;
                    pointer-events: auto;
                    z-index: 101;
                    display: flex;
                    flex-direction: column-reverse;
                    align-items: center;
                    gap: 12px;
                }

                .stickies-add-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: var(--glass-layer-3);
                    backdrop-filter: var(--blur-layer-3);
                    -webkit-backdrop-filter: var(--blur-layer-3);
                    border: var(--border-layer-3);
                    color: var(--text-primary);
                    font-size: 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    box-shadow: var(--shadow-layer-3);
                    line-height: 1;
                }
                .stickies-add-btn:hover {
                    background: var(--glass-layer-4);
                    transform: scale(1.1);
                    box-shadow: var(--shadow-layer-4);
                }

                .stickies-color-menu {
                    display: flex;
                    gap: 8px;
                    background: var(--glass-layer-3);
                    backdrop-filter: var(--blur-layer-3);
                    padding: 8px;
                    border-radius: 12px;
                    border: var(--border-layer-3);
                    box-shadow: var(--shadow-layer-4);
                    animation: qlScale 0.2s var(--ease-spring);
                    flex-direction: column;
                }
                
                .stickies-color-swatch {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    border: 2px solid rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: transform 0.2s var(--ease-spring);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .stickies-color-swatch:hover { transform: scale(1.2); }

                @keyframes qlScale {
                    from { opacity: 0; transform: scale(0.9) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .sticky-note {
                    position: fixed;
                    pointer-events: auto;
                    border-radius: 4px;
                    border: 1px solid rgba(0,0,0,0.1);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                    transition: box-shadow 0.2s;
                    font-family: 'SF Pro Text', -apple-system, sans-serif;
                    overflow: hidden;
                }
                /* Subtle paper texture/gloss */
                .sticky-note::before {
                    content: ''; position: absolute; inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 100%);
                    pointer-events: none;
                }
                
                .sticky-note:hover {
                    box-shadow: 0 12px 32px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1);
                    z-index: 150 !important;
                }

                .sticky-titlebar {
                    display: flex;
                    align-items: center;
                    padding: 6px 8px;
                    gap: 6px;
                    user-select: none;
                    position: relative;
                    z-index: 2;
                }

                .sticky-close {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    font-size: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255,255,255,0.9);
                    opacity: 0;
                    transition: opacity 0.15s, transform 0.1s;
                    line-height: 1;
                    padding: 0;
                }
                .sticky-close:hover { transform: scale(1.1); }
                .sticky-note:hover .sticky-close { opacity: 1; }

                .sticky-drag-hint {
                    flex: 1;
                    text-align: center;
                    font-size: 10px;
                    opacity: 0.3;
                    letter-spacing: 2px;
                    cursor: grab;
                }

                .sticky-textarea {
                    flex: 1;
                    resize: none;
                    border: none;
                    background: transparent;
                    padding: 4px 12px 12px;
                    font-size: 14px;
                    font-family: inherit;
                    outline: none;
                    min-height: 120px;
                    line-height: 1.4;
                    position: relative;
                    z-index: 2;
                }
                .sticky-textarea::placeholder {
                    opacity: 0.5;
                    font-style: italic;
                }
            `})]})}function fr({note:t,onUpdate:r,onDelete:s}){const g=a.useRef(null),[d,u]=a.useState(!1),[c,o]=a.useState({x:0,y:0}),[n,h]=a.useState(!t.text),l=a.useCallback(p=>{p.target.tagName==="TEXTAREA"||p.target.tagName==="BUTTON"||(u(!0),o({x:p.clientX-t.x,y:p.clientY-t.y}))},[t.x,t.y]);return a.useEffect(()=>{if(!d)return;const p=x=>{r({x:Math.max(0,x.clientX-c.x),y:Math.max(32,x.clientY-c.y)})},m=()=>u(!1);return window.addEventListener("mousemove",p),window.addEventListener("mouseup",m),()=>{window.removeEventListener("mousemove",p),window.removeEventListener("mouseup",m)}},[d,c,r]),e.jsxs("div",{ref:g,className:"sticky-note",style:{left:t.x,top:t.y,width:t.width,minHeight:t.height,background:t.color.bg,borderColor:t.color.border,color:t.color.text,zIndex:d?200:100,cursor:d?"grabbing":"default"},onMouseDown:l,children:[e.jsxs("div",{className:"sticky-titlebar",style:{borderBottomColor:t.color.border+"33"},children:[e.jsx("button",{className:"sticky-close",style:{background:t.color.border},onClick:s,title:"Delete sticky",children:"×"}),e.jsx("div",{className:"sticky-drag-hint",style:{cursor:"grab"},children:"⋮⋮"})]}),e.jsx("textarea",{className:"sticky-textarea",value:t.text,onChange:p=>r({text:p.target.value}),placeholder:"Type a note...",autoFocus:n,onFocus:()=>h(!0),onBlur:()=>h(!1),style:{color:t.color.text}}),e.jsx("style",{children:`
                .sticky-note {
                    position: fixed;
                    pointer-events: auto;
                    border-radius: 6px;
                    border: 1px solid;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                    transition: box-shadow 0.2s;
                    font-family: 'SF Pro', -apple-system, sans-serif;
                }
                .sticky-note:hover {
                    box-shadow: 0 8px 30px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.12);
                }

                .sticky-titlebar {
                    display: flex;
                    align-items: center;
                    padding: 4px 8px;
                    border-bottom: 1px solid;
                    gap: 6px;
                    user-select: none;
                }

                .sticky-close {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    font-size: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    opacity: 0;
                    transition: opacity 0.15s;
                    line-height: 1;
                    padding: 0;
                }
                .sticky-note:hover .sticky-close { opacity: 1; }

                .sticky-drag-hint {
                    flex: 1;
                    text-align: center;
                    font-size: 10px;
                    opacity: 0.25;
                    letter-spacing: 2px;
                    cursor: grab;
                }

                .sticky-textarea {
                    flex: 1;
                    resize: none;
                    border: none;
                    background: transparent;
                    padding: 8px;
                    font-size: 12px;
                    font-family: inherit;
                    outline: none;
                    min-height: 120px;
                    line-height: 1.5;
                }
                .sticky-textarea::placeholder {
                    opacity: 0.4;
                }
            `})]})}function yr(){const t=fe(),r=Q();return a.useEffect(()=>{if(t.pathname!=="/login"){const s={path:t.pathname,search:t.search,scroll:window.scrollY,timestamp:Date.now()};localStorage.setItem("handoff_session",JSON.stringify(s))}},[t.pathname,t.search]),a.useEffect(()=>{let s;const g=()=>{clearTimeout(s),s=setTimeout(()=>{const d=localStorage.getItem("handoff_session");if(d){const u=JSON.parse(d);u.scroll=window.scrollY,localStorage.setItem("handoff_session",JSON.stringify(u))}},200)};return window.addEventListener("scroll",g,{passive:!0}),()=>{clearTimeout(s),window.removeEventListener("scroll",g)}},[]),a.useEffect(()=>{const s=localStorage.getItem("handoff_session");if(s)try{const g=JSON.parse(s);Date.now()-g.timestamp<24*60*60*1e3&&g.path!==t.pathname&&(r(g.path+(g.search||""),{replace:!0}),setTimeout(()=>{window.scrollTo(0,g.scroll||0)},100))}catch{}},[]),null}const vr=[{name:"Dashboard",path:"/dashboard",icon:"📊",color:"#667eea"},{name:"Students",path:"/students",icon:"👥",color:"#10b981"},{name:"Groups",path:"/groups",icon:"🏘️",color:"#f59e0b"},{name:"Attendance",path:"/attendance",icon:"📅",color:"#f6d365"},{name:"Weekly Reports",path:"/weekly-reports",icon:"📝",color:"#8b5cf6"},{name:"Checkpoints",path:"/checkpoints",icon:"🎯",color:"#ef4444"},{name:"Exports",path:"/exports",icon:"📤",color:"#06b6d4"},{name:"Admin",path:"/admin",icon:"🔧",color:"#6366f1"},{name:"Audit Logs",path:"/audit",icon:"📋",color:"#ec4899"},{name:"Import",path:"/import",icon:"📥",color:"#14b8a6"},{name:"Settings",path:"/settings",icon:"⚙️",color:"#64748b"},{name:"Tech Support",path:"/tech-support",icon:"🛠️",color:"#f97316"}];function jr(){const[t,r]=a.useState(!1),[s,g]=a.useState(""),d=Q();if(a.useEffect(()=>{const o=n=>{n.key==="F4"&&(n.preventDefault(),r(h=>!h),g("")),n.key==="Escape"&&t&&r(!1)};return window.addEventListener("keydown",o),()=>window.removeEventListener("keydown",o)},[t]),!t)return null;const u=vr.filter(o=>o.name.toLowerCase().includes(s.toLowerCase())),c=o=>{r(!1),d(o)};return e.jsxs("div",{className:"launchpad-overlay",onClick:()=>r(!1),children:[e.jsxs("div",{className:"launchpad-content",onClick:o=>o.stopPropagation(),children:[e.jsx("div",{className:"launchpad-search",children:e.jsx("input",{type:"text",placeholder:"Search...",value:s,onChange:o=>g(o.target.value),autoFocus:!0})}),e.jsx("div",{className:"launchpad-grid",children:u.map(o=>e.jsxs("button",{className:"launchpad-app",onClick:()=>c(o.path),children:[e.jsx("div",{className:"launchpad-icon",style:{background:`linear-gradient(135deg, ${o.color}, ${o.color}dd)`},children:o.icon}),e.jsx("span",{className:"launchpad-app-name",children:o.name})]},o.path))}),e.jsx("div",{className:"launchpad-dots",children:e.jsx("span",{className:"launchpad-dot active"})})]}),e.jsx("style",{children:`
                .launchpad-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.45);
                    backdrop-filter: blur(60px) saturate(210%);
                    -webkit-backdrop-filter: blur(60px) saturate(210%);
                    z-index: 10005;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: lpFadeIn 0.35s var(--ease-out-expo);
                }
                [data-theme="light"] .launchpad-overlay {
                    background: rgba(255, 255, 255, 0.3);
                    backdrop-filter: blur(60px) saturate(180%);
                }

                @keyframes lpFadeIn {
                    from { opacity: 0; backdrop-filter: blur(0px); }
                    to { opacity: 1; backdrop-filter: blur(60px) saturate(210%); }
                }

                .launchpad-content {
                    width: 100%;
                    max-width: 960px;
                    padding: 40px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 40px;
                    transform-origin: center center;
                    animation: lpScale 0.4s var(--ease-spring);
                }

                @keyframes lpScale {
                    from { opacity: 0; transform: scale(1.1); }
                    to { opacity: 1; transform: scale(1); }
                }

                .launchpad-search input {
                    width: 280px;
                    padding: 10px 20px;
                    border-radius: var(--radius-pill);
                    border: 1px solid rgba(255,255,255,0.2);
                    background: rgba(0,0,0,0.2);
                    color: white;
                    font-size: 15px;
                    outline: none;
                    text-align: center;
                    backdrop-filter: blur(20px);
                    box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                }
                [data-theme="light"] .launchpad-search input {
                    background: rgba(255,255,255,0.4);
                    border-color: rgba(0,0,0,0.1);
                    color: #1d1d1f;
                }
                .launchpad-search input::placeholder { color: rgba(255,255,255,0.5); }
                [data-theme="light"] .launchpad-search input::placeholder { color: rgba(0,0,0,0.4); }
                
                .launchpad-search input:focus {
                    border-color: rgba(255,255,255,0.5);
                    background: rgba(0,0,0,0.3);
                    width: 320px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                [data-theme="light"] .launchpad-search input:focus {
                    background: rgba(255,255,255,0.6);
                    border-color: rgba(0,0,0,0.2);
                }

                .launchpad-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 32px 24px;
                    width: 100%;
                    max-width: 780px;
                    justify-items: center;
                }

                .launchpad-app {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    transition: transform 0.2s;
                    padding: 0;
                    margin: 0;
                }
                .launchpad-app:hover { transform: scale(1.05); }
                .launchpad-app:active { transform: scale(0.95); opacity: 0.8; }

                .launchpad-icon {
                    width: 72px;
                    height: 72px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 36px;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25);
                    transition: box-shadow 0.2s;
                    position: relative;
                    overflow: hidden;
                }
                /* Glossy Reflection */
                .launchpad-icon::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 50%;
                    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%);
                    pointer-events: none;
                }

                .launchpad-app:hover .launchpad-icon {
                    box-shadow: 0 12px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3);
                }

                .launchpad-app-name {
                    font-size: 12px;
                    color: white;
                    font-weight: 500;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.6);
                    max-width: 90px;
                    text-align: center;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    letter-spacing: 0.2px;
                }
                [data-theme="light"] .launchpad-app-name {
                    color: #1d1d1f;
                    text-shadow: none;
                    font-weight: 600;
                }

                .launchpad-dots {
                    display: flex;
                    gap: 8px;
                    margin-top: 10px;
                }
                .launchpad-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.3);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }
                [data-theme="light"] .launchpad-dot { background: rgba(0,0,0,0.2); }
                .launchpad-dot.active { background: white; }
                [data-theme="light"] .launchpad-dot.active { background: #000; }
            `})]})}const kr=[{name:"Dashboard",path:"/dashboard",icon:"📊",desc:"Analytics & overview",color:"rgba(99,102,241,0.2)"},{name:"Students",path:"/students",icon:"👥",desc:"Student management",color:"rgba(16,185,129,0.2)"},{name:"Formation Groups",path:"/groups",icon:"🏘️",desc:"Group management",color:"rgba(245,158,11,0.2)"},{name:"Attendance",path:"/attendance",icon:"📅",desc:"Session tracking",color:"rgba(246,211,101,0.2)"},{name:"Weekly Reports",path:"/weekly-reports",icon:"📝",desc:"Weekly submissions",color:"rgba(139,92,246,0.2)"},{name:"Checkpoints",path:"/checkpoints",icon:"🎯",desc:"Discernment tracking",color:"rgba(239,68,68,0.2)"},{name:"Export Data",path:"/exports",icon:"📤",desc:"Reports & CSV",color:"rgba(6,182,212,0.2)"},{name:"Audit Logs",path:"/audit",icon:"📋",desc:"Activity history",color:"rgba(236,72,153,0.2)"},{name:"Admin Panel",path:"/admin",icon:"🔧",desc:"User management",color:"rgba(99,102,241,0.2)"}];function wr(){const[t,r]=a.useState(!1),s=Q(),g=fe();if(a.useEffect(()=>{const u=c=>{c.ctrlKey&&c.key==="ArrowUp"&&(c.preventDefault(),r(o=>!o)),c.key==="Escape"&&t&&r(!1)};return window.addEventListener("keydown",u),()=>window.removeEventListener("keydown",u)},[t]),!t)return null;const d=u=>{r(!1),s(u)};return e.jsxs("div",{className:"mc-overlay",onClick:()=>r(!1),children:[e.jsxs("div",{className:"mc-content",onClick:u=>u.stopPropagation(),children:[e.jsxs("div",{className:"mc-header",children:[e.jsx("h2",{children:"Mission Control"}),e.jsx("span",{className:"mc-hint",children:"Click a section to navigate · Press Esc to close"})]}),e.jsx("div",{className:"mc-desktops",children:e.jsx("div",{className:"mc-desktop-thumb active",children:e.jsx("span",{children:"Current View"})})}),e.jsx("div",{className:"mc-grid",children:kr.map(u=>e.jsxs("button",{className:`mc-card ${g.pathname===u.path?"mc-card-active":""}`,onClick:()=>d(u.path),children:[e.jsx("div",{className:"mc-card-preview",style:{background:u.color},children:e.jsx("span",{className:"mc-card-icon",children:u.icon})}),e.jsxs("div",{className:"mc-card-info",children:[e.jsx("span",{className:"mc-card-name",children:u.name}),e.jsx("span",{className:"mc-card-desc",children:u.desc})]}),g.pathname===u.path&&e.jsx("div",{className:"mc-card-indicator",children:"●"})]},u.path))})]}),e.jsx("style",{children:`
                .mc-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(40px) saturate(160%);
                    -webkit-backdrop-filter: blur(40px) saturate(160%);
                    z-index: 10004;
                    display: flex;
                    flex-direction: column;
                    animation: mcSlideDown 0.35s var(--ease-out-expo);
                }
                [data-theme="light"] .mc-overlay {
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(40px) saturate(160%);
                }

                @keyframes mcSlideDown {
                    from { opacity: 0; transform: translateY(-30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .mc-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 40px;
                    overflow-y: auto;
                }

                .mc-header {
                    text-align: center;
                    margin-bottom: 32px;
                }
                .mc-header h2 {
                    font-size: 20px;
                    font-weight: 600;
                    color: white;
                    margin: 0 0 6px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                [data-theme="light"] .mc-header h2 { color: #1d1d1f; text-shadow: none; }
                .mc-hint {
                    font-size: 11px;
                    color: rgba(255,255,255,0.5);
                    background: rgba(0,0,0,0.2);
                    padding: 4px 10px;
                    border-radius: var(--radius-pill);
                }
                [data-theme="light"] .mc-hint { color: rgba(0,0,0,0.5); background: rgba(0,0,0,0.05); }

                .mc-desktops {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 40px;
                }
                .mc-desktop-thumb {
                    padding: 8px 18px;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.1);
                    font-size: 12px;
                    color: rgba(255,255,255,0.6);
                    cursor: default;
                }
                [data-theme="light"] .mc-desktop-thumb {
                    background: rgba(0,0,0,0.04);
                    border-color: rgba(0,0,0,0.06);
                    color: rgba(0,0,0,0.5);
                }
                .mc-desktop-thumb.active {
                    background: rgba(255,255,255,0.15);
                    border-color: rgba(255,255,255,0.25);
                    color: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                [data-theme="light"] .mc-desktop-thumb.active {
                    background: white;
                    border-color: rgba(0,0,0,0.1);
                    color: #1d1d1f;
                }

                .mc-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 20px;
                    width: 100%;
                    max-width: 960px;
                }

                .mc-card {
                    display: flex;
                    flex-direction: column;
                    background: var(--glass-layer-3);
                    backdrop-filter: var(--blur-layer-3);
                    -webkit-backdrop-filter: var(--blur-layer-3);
                    border: var(--border-layer-3);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.25s var(--ease-out-expo);
                    text-align: left;
                    padding: 0;
                    position: relative;
                    box-shadow: var(--shadow-layer-3);
                }
                .mc-card:hover {
                    transform: translateY(-6px) scale(1.02);
                    background: rgba(255,255,255,0.12);
                    border-color: rgba(255,255,255,0.25);
                    box-shadow: 0 16px 40px rgba(0,0,0,0.25);
                }
                [data-theme="light"] .mc-card:hover {
                    background: rgba(255,255,255,0.9);
                }

                .mc-card-active {
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 0 2px var(--primary-light), 0 12px 30px rgba(0,0,0,0.3);
                }

                .mc-card-preview {
                    height: 100px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }
                .mc-card-preview::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.05) 100%);
                }
                .mc-card-icon { 
                    font-size: 36px; 
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
                    transition: transform 0.2s;
                }
                .mc-card:hover .mc-card-icon { transform: scale(1.1); }

                .mc-card-info {
                    padding: 14px 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    background: rgba(0,0,0,0.02);
                }
                .mc-card-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .mc-card-desc {
                    font-size: 11px;
                    color: var(--text-secondary);
                }

                .mc-card-indicator {
                    position: absolute;
                    top: 10px;
                    right: 12px;
                    color: white;
                    font-size: 8px;
                    background: var(--primary);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
            `})]})}const Z=["Bbira","Bugolobi","Bweyogerere","Downtown","Entebbe","Nakwero","Gulu","Jinja","Juba","Kansanga","Kyengera","Laminadera","Lubowa","Mbarara","Mukono","Nansana","Ntinda","Online","Suubi"];function Sr(){const{user:t,loading:r,toasts:s}=U();return a.useEffect(()=>{t&&fetch("/api/data/students").catch(g=>console.debug("Cache warmup background fetch",g))},[t]),r?e.jsx("div",{className:"login-container",children:e.jsx("div",{className:"spinner"})}):e.jsx(cr,{children:e.jsx(Ct,{children:e.jsx(_t,{children:e.jsxs(Tt,{children:[e.jsx("div",{className:"mesh-background"}),e.jsx(pr,{}),e.jsx(hr,{}),e.jsx(mr,{}),e.jsx(br,{}),e.jsx(yr,{}),e.jsx(jr,{}),e.jsx(wr,{}),e.jsxs(bt,{children:[e.jsx(q,{path:"/login",element:t?e.jsx(V,{to:"/dashboard"}):e.jsx(jt,{})}),t&&e.jsxs(q,{element:e.jsx(Ft,{}),children:[e.jsx(q,{path:"/dashboard",element:e.jsx(Ot,{})}),e.jsx(q,{path:"/students",element:["Admin","LeadershipTeam","Pastor","Coordinator","TechSupport"].includes(t.role)?e.jsx(Ut,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(q,{path:"/admin",element:["Admin","TechSupport"].includes(t.role)?e.jsx(Yt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(q,{path:"/audit",element:["Admin","LeadershipTeam"].includes(t.role)?e.jsx(Jt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(q,{path:"/reports",element:["Admin","LeadershipTeam","Pastor"].includes(t.role)?e.jsx(Kt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(q,{path:"/import",element:["Admin","Coordinator"].includes(t.role)?e.jsx(Vt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(q,{path:"/groups",element:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator"].includes(t.role)?e.jsx(Qt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(q,{path:"/attendance",element:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator","CoFacilitator","TechSupport"].includes(t.role)?e.jsx(window.__ATTENDANCE_ADDON__.AttendanceDashboard,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(q,{path:"/weekly-reports",element:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator","TechSupport"].includes(t.role)?e.jsx(Xt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(q,{path:"/settings",element:t.role==="Admin"?e.jsx(Zt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(q,{path:"/checkpoints",element:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator","TechSupport"].includes(t.role)?e.jsx(er,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(q,{path:"/tech-support",element:["Admin","TechSupport"].includes(t.role)?e.jsx(rr,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(q,{path:"/exports",element:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator","TechSupport"].includes(t.role)?e.jsx(or,{}):e.jsx(V,{to:"/dashboard"})})]}),e.jsx(q,{path:"*",element:e.jsx(V,{to:t?"/dashboard":"/login"})})]}),e.jsx(nr,{toasts:s})]})})})})}class Nr extends Ge.Component{constructor(r){super(r),this.state={hasError:!1,error:null,errorInfo:null}}static getDerivedStateFromError(r){return{hasError:!0}}componentDidCatch(r,s){this.setState({error:r,errorInfo:s}),console.error("Uncaught error:",r,s)}render(){return this.state.hasError?e.jsxs("div",{style:{padding:"20px",color:"white",background:"#333",minHeight:"100vh",fontFamily:"monospace"},children:[e.jsx("h1",{children:"⚠️ Something went wrong."}),e.jsxs("details",{style:{whiteSpace:"pre-wrap"},children:[this.state.error&&this.state.error.toString(),e.jsx("br",{}),this.state.errorInfo&&this.state.errorInfo.componentStack]}),e.jsx("button",{onClick:()=>window.location.reload(),style:{marginTop:"20px",padding:"10px 20px",background:"#007bff",color:"white",border:"none",borderRadius:"5px",cursor:"pointer"},children:"Reload Page"}),e.jsx("button",{onClick:()=>window.location.href="/login",style:{marginTop:"20px",marginLeft:"10px",padding:"10px 20px",background:"#6c757d",color:"white",border:"none",borderRadius:"5px",cursor:"pointer"},children:"Go to Login"})]}):this.props.children}}Te.createRoot(document.getElementById("root")).render(e.jsx(Ge.StrictMode,{children:e.jsx(Nr,{children:e.jsx(ft,{children:e.jsx(vt,{children:e.jsx(Sr,{})})})})}));export{he as A,Ht as P,ge as W,_r as a,U as u};
//# sourceMappingURL=index-6TxfGUJG.js.map
