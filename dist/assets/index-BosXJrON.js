const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ProfileSettings-CxM1mxtl.js","assets/vendor-BzMkH_x1.js","assets/utils-Dj1PjNzy.js","assets/AppearanceSettings-iptasjvJ.js","assets/WallpaperSettings-D4TSDW1I.js","assets/NotificationsSettings-Cgu5BcaD.js"])))=>i.map(i=>d[i]);
import{r as at,a,u as Q,j as e,b as fe,O as st,C as ot,c as nt,L as it,B as lt,p as dt,d as ct,e as pt,A as xt,P as gt,f as ht,g as Oe,D as ut,h as mt,R as bt,i as J,N as V,k as Ge,l as ft}from"./vendor-BzMkH_x1.js";import{_ as ye,E as yt}from"./utils-Dj1PjNzy.js";

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
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const [checkInDate, setCheckInDate] = (0, import_react.useState)(today);
    const [checkInWeek, setCheckInWeek] = (0, import_react.useState)(1);
    const [didNotMeet, setDidNotMeet] = (0, import_react.useState)(false);
    const [attendanceLog, setAttendanceLog] = (0, import_react.useState)({});
    const canEdit = currentUser && ["Admin", "Facilitator", "Coordinator"].includes(currentUser.role);
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
    (0, import_react.useEffect)(() => {
      if (!showModal) return;
      const log = {};
      members.forEach((m) => {
        log[m.id] = { attended: false, note: "", noteOpen: false };
      });
      setAttendanceLog(log);
      setDidNotMeet(false);
      setCheckInDate(today);
    }, [showModal, members]);
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
        const sRes = await fetch(`/api/attendance/group/${groupId}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_date: checkInDate,
            week_number: checkInWeek,
            did_not_meet: didNotMeet
          })
        });
        const sData = await sRes.json();
        if (!sData.success) throw new Error(sData.message);
        if (!didNotMeet) {
          const payload = members.map((m) => ({
            group_member_id: m.id,
            attended: !!attendanceLog[m.id]?.attended,
            note: attendanceLog[m.id]?.note || null
          }));
          const cRes = await fetch(`/api/attendance/sessions/${sData.sessionId}/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ attendance: payload })
          });
          const cData = await cRes.json();
          if (!cData.success) throw new Error(cData.message);
        }
        setShowModal(false);
        await fetchData();
        showToast("Session saved");
      } catch (e) {
        showToast(e.message || "Failed to save session", "error");
      } finally {
        setSaving(false);
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
          canEdit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: () => setShowModal(true),
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
        sessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 24, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }, children: [
          "No sessions recorded yet.",
          canEdit ? ' Use "Record Session" above to log the first one.' : ""
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }, children: sessions.map((s) => {
          const dateStr = (/* @__PURE__ */ new Date(s.session_date + "T00:00:00")).toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric" });
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
            padding: 14,
            borderRadius: 10,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--glass-border)"
          }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }, children: dateStr }),
              s.did_not_meet ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "rgba(253,203,110,0.15)", color: "#fdcb6e", fontWeight: 600 }, children: "DNM" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: 11, color: "var(--text-secondary)" }, children: [
                "Wk ",
                s.week_number || "\u2014"
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
            ] })
          ] }, s.id);
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
          onClick: () => setShowModal(false),
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
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }, children: "Record Session" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }, children: groupName })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setShowModal(false), style: { background: "none", border: "none", color: "var(--text-secondary)", fontSize: 20, cursor: "pointer", lineHeight: 1 }, children: "\u2715" })
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
                        style: {
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid var(--glass-border)",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          outline: "none",
                          boxSizing: "border-box"
                        }
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
                        style: {
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid var(--glass-border)",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          outline: "none"
                        },
                        children: Array.from({ length: 13 }, (_, i) => i + 1).map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", { value: w, children: [
                          "Week ",
                          w
                        ] }, w))
                      }
                    )
                  ] })
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
                    children: saving ? "Saving\u2026" : "Save Session"
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

(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const c of document.querySelectorAll('link[rel="modulepreload"]'))b(c);new MutationObserver(c=>{for(const f of c)if(f.type==="childList")for(const p of f.addedNodes)p.tagName==="LINK"&&p.rel==="modulepreload"&&b(p)}).observe(document,{childList:!0,subtree:!0});function s(c){const f={};return c.integrity&&(f.integrity=c.integrity),c.referrerPolicy&&(f.referrerPolicy=c.referrerPolicy),c.crossOrigin==="use-credentials"?f.credentials="include":c.crossOrigin==="anonymous"?f.credentials="omit":f.credentials="same-origin",f}function b(c){if(c.ep)return;c.ep=!0;const f=s(c);fetch(c.href,f)}})();var Te={},Fe=at;Te.createRoot=Fe.createRoot,Te.hydrateRoot=Fe.hydrateRoot;const Ue=a.createContext(null),H=()=>a.useContext(Ue);function vt({children:t}){const[r,s]=a.useState(null),[b,c]=a.useState(!0),[f,p]=a.useState([]),i=Q();a.useEffect(()=>{let h=!1;const g=window.fetch;return window.fetch=async(...n)=>{const x=await g(...n);return x.status===401&&!n[0].includes("/api/auth/login")&&!n[0].includes("/api/auth/session")&&(h||(h=!0,console.warn("Session expired or server restarted. Redirecting to login."),s(null),i("/login"),setTimeout(()=>h=!1,2e3))),x},o(),()=>{window.fetch=g}},[i]);const o=async()=>{try{const h=await fetch("/api/auth/session");if(h.ok){const g=await h.json();g.user&&(fetch("/api/data/students").catch(n=>{}),s(g.user))}}catch(h){console.error("Session check failed:",h)}finally{c(!1)}},m=async(h,g)=>{try{const x=await(await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:h,password:g})})).json();return x.success?(fetch("/api/data/students").catch(u=>{}),s(x.user),d("Welcome, "+x.user.name+"!","success"),{success:!0,user:x.user}):{success:!1,message:x.message||"Login failed"}}catch{return{success:!1,message:"Connection error. Please try again."}}},l=async()=>{try{await fetch("/api/auth/logout",{method:"POST"})}catch(h){console.error("Logout error:",h)}s(null),d("Signed out successfully","info"),i("/login")},d=(h,g="info")=>{const n=Date.now();p(x=>[...x,{id:n,message:h,type:g}]),setTimeout(()=>{p(x=>x.filter(u=>u.id!==n))},4e3)};return e.jsx(Ue.Provider,{value:{user:r,login:m,logout:l,showToast:d,loading:b,toasts:f},children:t})}function jt(){const{login:t}=H(),[r,s]=a.useState(""),[b,c]=a.useState(""),[f,p]=a.useState(""),[i,o]=a.useState(!1),[m,l]=a.useState(new Date),[d,h]=a.useState(null),[g,n]=a.useState(!1);a.useEffect(()=>{const C=setInterval(()=>l(new Date),1e3),j=localStorage.getItem("last_user");if(j)try{const k=JSON.parse(j);h(k),s(k.username||""),n(!0)}catch(k){console.error("Failed to parse saved user",k)}else n(!0);return()=>clearInterval(C)},[]);const x=async C=>{C.preventDefault(),p(""),o(!0);const j=await t(r,b);j.success?j.user&&(fetch("/api/data/students").catch(console.error),localStorage.setItem("last_user",JSON.stringify({username:j.user.username,name:j.user.name,profile_image:j.user.profile_image}))):(p(j.message),o(!1))},u=C=>C.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!1}),N=C=>C.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});return e.jsxs("div",{className:"tahoe-login-container",children:[e.jsxs("div",{className:"tahoe-clock-container",children:[e.jsx("div",{className:"tahoe-clock",children:u(m)}),e.jsx("div",{className:"tahoe-date",children:N(m)})]}),e.jsxs("div",{className:"tahoe-auth-container",children:[e.jsx("div",{className:"login-avatar-large",children:d&&d.profile_image?e.jsx("img",{src:d.profile_image,alt:"Avatar"}):e.jsxs("svg",{width:"60",height:"60",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",style:{opacity:.8},children:[e.jsx("path",{d:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"12",cy:"7",r:"4"})]})}),e.jsx("div",{className:"tahoe-username",children:d?d.name||d.username:r||"Other User"}),f&&e.jsx("div",{style:{color:"#fca5a5",fontSize:"13px",marginBottom:"12px",textShadow:"0 1px 2px rgba(0,0,0,0.5)"},children:f}),e.jsxs("form",{onSubmit:x,style:{width:"100%"},children:[!d&&e.jsx("div",{className:"tahoe-password-pill",style:{marginBottom:"10px"},children:e.jsx("input",{type:"text",className:"tahoe-input-transparent",placeholder:"Username",value:r,onChange:C=>s(C.target.value),required:!0,autoFocus:!d})}),e.jsxs("div",{className:"tahoe-password-pill",children:[e.jsx("input",{type:"password",className:"tahoe-input-transparent",placeholder:"Enter Password",value:b,onChange:C=>c(C.target.value),required:!0,autoFocus:!!d,autoComplete:"current-password"}),e.jsx("button",{type:"submit",className:"tahoe-submit-btn",disabled:i,children:i?e.jsx("div",{className:"spinner",style:{width:"16px",height:"16px",borderWidth:"2px"}}):e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),e.jsx("polyline",{points:"12 5 19 12 12 19"})]})})]})]}),e.jsxs("div",{style:{marginTop:"40px",display:"flex",flexDirection:"column",alignItems:"center",gap:"8px"},children:[e.jsx("div",{style:{fontSize:"12px",color:"rgba(255,255,255,0.4)",fontWeight:500},children:"Enter Password"}),d&&e.jsx("button",{className:"tahoe-secondary-action",onClick:()=>{h(null),s(""),c("")},children:"Switch User"})]})]}),e.jsx("div",{style:{position:"absolute",bottom:"20px",fontSize:"11px",color:"rgba(255,255,255,0.3)"},children:"Watoto Church © 2026"})]})}const Ee=a.lazy(()=>ye(()=>import("./ProfileSettings-CxM1mxtl.js"),__vite__mapDeps([0,1,2]))),kt=a.lazy(()=>ye(()=>import("./AppearanceSettings-iptasjvJ.js"),__vite__mapDeps([3,1,2]))),wt=a.lazy(()=>ye(()=>import("./WallpaperSettings-D4TSDW1I.js"),__vite__mapDeps([4,1,2]))),St=a.lazy(()=>ye(()=>import("./NotificationsSettings-Cgu5BcaD.js"),__vite__mapDeps([5,1])));function Nt({isOpen:t,onClose:r}){var m;const[s,b]=a.useState("profile"),[c,f]=a.useState("");if(a.useEffect(()=>{t||f("")},[t]),a.useEffect(()=>{const l=d=>{var h;(h=d.detail)!=null&&h.tab&&b(d.detail.tab)};return window.addEventListener("open-settings",l),()=>window.removeEventListener("open-settings",l)},[]),!t)return null;const p=[{id:"profile",label:"Profile",icon:"👤",component:Ee},{id:"appearance",label:"Appearance",icon:"🎨",component:kt},{id:"wallpaper",label:"Wallpaper",icon:"🖼️",component:wt},{id:"notifications",label:"Notifications",icon:"🔔",component:St}],i=p.filter(l=>l.label.toLowerCase().includes(c.toLowerCase())),o=((m=p.find(l=>l.id===s))==null?void 0:m.component)||Ee;return e.jsxs("div",{className:"modal-overlay",onClick:r,style:{backdropFilter:"blur(24px)"},children:[e.jsxs("div",{className:"settings-modal-window",onClick:l=>l.stopPropagation(),children:[e.jsxs("div",{className:"settings-titlebar",children:[e.jsxs("div",{style:{display:"flex",gap:"8px"},children:[e.jsx("div",{className:"traffic-btn red",onClick:r}),e.jsx("div",{className:"traffic-btn yellow",onClick:e=>{const m=e.target.closest(".settings-modal-window");if(m){m.classList.add("modal-minimized");setTimeout(()=>r(),400)}}}),e.jsx("div",{className:"traffic-btn green",onClick:e=>{const m=e.target.closest(".settings-modal-window");if(m)m.classList.toggle("modal-maximized")}})]}),e.jsx("button",{className:"mobile-close-btn",onClick:r,style:{display:"none",background:"var(--surface-hover)",border:"none",borderRadius:"50%",width:28,height:28,color:"var(--text-secondary)",fontSize:14,cursor:"pointer",zIndex:3},children:"✕"})]}),e.jsxs("div",{style:{display:"flex",height:"100%",overflow:"hidden"},children:[e.jsxs("div",{className:"settings-sidebar",children:[e.jsxs("div",{className:"sidebar-search-wrapper",children:[e.jsx("span",{className:"search-icon",children:"🔍"}),e.jsx("input",{type:"text",placeholder:"Search",className:"sidebar-search-input",value:c,onChange:l=>f(l.target.value)})]}),e.jsxs("div",{className:"sidebar-scroll-area",children:[i.map(l=>e.jsxs("button",{onClick:()=>b(l.id),className:`settings-sidebar-btn ${s===l.id?"active":""}`,children:[e.jsx("span",{className:"settings-sidebar-icon",children:l.icon}),l.label]},l.id)),i.length===0&&e.jsx("div",{className:"no-results",children:"No results"})]})]}),e.jsx("div",{className:"settings-content",children:e.jsx(a.Suspense,{fallback:e.jsx("div",{className:"settings-loading",children:"Loading..."}),children:e.jsx(o,{})})})]})]}),e.jsx("style",{children:`
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

                /* Mobile Optimizations - iOS Bottom Sheet */
                @media (max-width: 768px) {
                    .settings-modal-window {
                        width: 100vw;
                        max-width: 100vw;
                        height: 90vh; /* Bottom sheet style */
                        border-radius: 24px 24px 0 0; /* Only round top corners */
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        animation: sheetSlideUp 0.3s cubic-bezier(0.25, 1, 0.5, 1);
                    }

                    @keyframes sheetSlideUp {
                        from { transform: translateY(100%); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }

                    .settings-titlebar {
                        height: auto;
                        padding: 16px;
                        justify-content: flex-end; /* Push close to right if no traffic lights */
                    }
                    
                    /* Apple HIG: Add a grabber handle for bottom sheets */
                    .settings-titlebar::before {
                        content: '';
                        position: absolute;
                        top: 8px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 36px;
                        height: 5px;
                        background: rgba(255,255,255,0.3);
                        border-radius: 10px;
                    }

                    /* Strip macOS Traffic Lights */
                    .traffic-btn {
                        display: none;
                    }

                    /* Add an explicit close button for mobile */
                    .mobile-close-btn {
                        display: block !important;
                    }

                    .settings-modal-window > div {
                        flex-direction: column;
                    }

                    .settings-sidebar {
                        width: 100%;
                        border-right: none;
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                        padding-bottom: 8px;
                    }

                    .sidebar-scroll-area {
                        display: flex;
                        overflow-x: auto;
                        gap: 8px;
                        padding-bottom: 4px;
                        -webkit-overflow-scrolling: touch;
                    }
                    .sidebar-scroll-area::-webkit-scrollbar {
                        display: none;
                    }

                    .settings-sidebar-btn {
                        white-space: nowrap;
                        width: auto;
                        padding: 6px 12px;
                        border-radius: 20px;
                        background: var(--glass-layer-2);
                    }
                    
                    .settings-sidebar-btn.active {
                        background: var(--primary-color);
                    }

                    .settings-content {
                        border-left: none;
                        padding-bottom: env(safe-area-inset-bottom, 20px);
                    }
                }
            `})]})}const He=a.createContext();function re(){return a.useContext(He)}function Ct({children:t}){const[r,s]=a.useState(!1),[b,c]=a.useState(()=>localStorage.getItem("themePreference")||"dark"),[f,p]=a.useState(()=>localStorage.getItem("focusMode")||"default"),i=a.useCallback(n=>{if(n==="auto"){const x=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",x?"dark":"light")}else document.documentElement.setAttribute("data-theme",n)},[]),o=a.useCallback(n=>{c(n),localStorage.setItem("themePreference",n),i(n)},[i]),m=a.useCallback(n=>{p(n),localStorage.setItem("focusMode",n)},[]);a.useEffect(()=>{i(b)},[b,i]),a.useEffect(()=>{if(b!=="auto")return;const n=window.matchMedia("(prefers-color-scheme: dark)"),x=u=>{document.documentElement.setAttribute("data-theme",u.matches?"dark":"light")};return n.addEventListener("change",x),()=>n.removeEventListener("change",x)},[b]);const l=()=>s(!0),d=()=>s(!1),g={isSettingsOpen:r,openSettings:l,closeSettings:d,toggleSettings:()=>s(n=>!n),themePreference:b,changeTheme:o,focusMode:f,changeFocusMode:m};return e.jsxs(He.Provider,{value:g,children:[t,e.jsx(Nt,{isOpen:r,onClose:d})]})}function zt({onAppClick:t}){const{user:r}=H(),{openSettings:s}=re(),b=Q(),c=fe(),f=[{label:"Dashboard",path:"/dashboard",icon:"🏠",color:"linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)"},{label:"Students",path:"/students",icon:"🎓",role:["Admin","LeadershipTeam","Pastor","Coordinator","TechSupport"],color:"linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)"},{label:"Users",path:"/admin",icon:"👥",role:["Admin","TechSupport","Coordinator"],color:"linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"},{label:"Analytics",path:"/reports",icon:"📊",role:["Admin","LeadershipTeam","Pastor"],color:"linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)"},{label:"Audit",path:"/audit",icon:"🛡️",role:["Admin","LeadershipTeam"],color:"linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)"},{label:"Batch Tool",path:"/import",icon:"📦",role:["Admin","Coordinator"],color:"linear-gradient(135deg, #FF0099 0%, #493240 100%)"},{label:"Groups",path:"/groups",icon:"🏘️",role:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator"],color:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)"},{label:"Attendance",path:"/attendance",icon:"📅",role:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator"],color:"linear-gradient(135deg, #f6d365 0%, #fda085 100%)"},{label:"Weekly Reports",path:"/weekly-reports",icon:"📝",role:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator","TechSupport"],color:"linear-gradient(135deg, #00b09b 0%, #96c93d 100%)"},{label:"Checkpoints",path:"/checkpoints",icon:"🎯",role:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator","TechSupport"],color:"linear-gradient(135deg, #e17055 0%, #d63031 100%)"},{label:"Tech Support",path:"/tech-support",icon:"🔧",role:["Admin","TechSupport"],color:"linear-gradient(135deg, #0984e3 0%, #6c5ce7 100%)"},{label:"Exports",path:"/exports",icon:"📥",role:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator","TechSupport"],color:"linear-gradient(135deg, #fd79a8 0%, #e84393 100%)"},{label:"Settings",path:"/settings",icon:"⚙️",role:["Admin"],color:"linear-gradient(135deg, #636e72 0%, #2d3436 100%)"}],p=x=>{b(x),t&&t()},i=f.filter(x=>!x.role||x.role.includes(r==null?void 0:r.role)),o=[...i,{label:"System Preferences",path:"#",icon:"⚙️",color:"linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)",isSettings:!0}],m=[];for(let x=0;x<o.length;x+=4)m.push(o.slice(x,x+4));const[l,d]=a.useState(0),h=a.useRef(null),g=()=>{if(h.current){const x=h.current.scrollLeft,u=h.current.clientWidth,N=Math.round(x/u);N!==l&&d(N)}},n=(x,u)=>{const N=!x.isSettings&&c.pathname===x.path;return e.jsxs("div",{className:`dock-icon ${N?"active":""}`,onClick:()=>x.isSettings?s():p(x.path),children:[e.jsx("div",{className:"app-icon",style:{background:x.color},children:x.icon}),N&&e.jsx("div",{className:"active-dot"}),!N&&x.isSettings&&e.jsx("div",{className:"active-dot",style:{opacity:0}}),e.jsx("div",{className:"tooltip",children:x.label})]},u)};return e.jsxs("div",{className:"dock-container",children:[e.jsxs("div",{className:"dock dock-desktop",children:[i.map((x,u)=>n(x,u)),e.jsx("div",{className:"dock-separator"}),n(o[o.length-1],"settings")]}),e.jsxs("div",{className:"dock-mobile-wrapper",children:[e.jsx("div",{className:"dock dock-mobile",ref:h,onScroll:g,children:m.map((x,u)=>e.jsx("div",{className:"dock-page",children:x.map((N,C)=>n(N,`m-${u}-${C}`))},`page-${u}`))}),m.length>1&&e.jsx("div",{className:"dock-pagination",children:m.map((x,u)=>e.jsx("div",{className:`dot ${u===l?"active":""}`},u))})]}),e.jsx("style",{children:`
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

                /* Desktop Only */
                .dock-mobile-wrapper { display: none; }
                .dock-desktop { display: flex; }

                /* Responsive */
                @media (max-width: 768px) {
                    .dock-desktop { display: none; }
                    .dock-mobile-wrapper {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        width: 100%;
                        padding-bottom: env(safe-area-inset-bottom, 12px);
                    }

                    .dock-container {
                        bottom: 0px;
                        pointer-events: auto;
                    }

                    .dock.dock-mobile {
                        width: calc(100% - 32px); /* float above edges */
                        margin: 0 16px 12px 16px;
                        border-radius: 36px;
                        background: var(--glass-layer-3);
                        backdrop-filter: blur(40px) saturate(200%);
                        -webkit-backdrop-filter: blur(40px) saturate(200%);
                        border: 1px solid rgba(255,255,255,0.2);
                        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                        padding: 12px 16px;
                        
                        overflow-x: auto;
                        scroll-snap-type: x mandatory;
                        flex-wrap: nowrap;
                        justify-content: flex-start;
                        gap: 0;
                        scrollbar-width: none; /* Firefox */
                    }

                    .dock.dock-mobile::-webkit-scrollbar {
                        display: none; /* Chrome/Safari */
                    }

                    .dock-page {
                        min-width: 100%;
                        display: flex;
                        justify-content: center;
                        gap: 24px;
                        scroll-snap-align: center;
                        padding: 0;
                    }
                    
                    /* Remove the top reflection gradient line on mobile */
                    .dock.dock-mobile::after {
                         display: none;
                    }

                    .app-icon {
                        width: 48px;
                        height: 48px;
                        border-radius: 14px;
                        font-size: 24px;
                    }
                    
                    .dock-icon:hover {
                         transform: none; /* No hover lift on touch */
                    }

                    .tooltip {
                        display: none; /* Hide tooltips on touch devices */
                    }

                    .dock-pagination {
                        display: flex;
                        justify-content: center;
                        gap: 6px;
                        margin-bottom: 8px;
                    }

                    .dock-pagination .dot {
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background: rgba(255,255,255,0.25);
                        transition: background 0.3s;
                    }
                    [data-theme="light"] .dock-pagination .dot {
                        background: rgba(0,0,0,0.15);
                    }

                    .dock-pagination .dot.active {
                        background: rgba(255,255,255,0.9);
                    }
                    [data-theme="light"] .dock-pagination .dot.active {
                        background: rgba(0,0,0,0.7);
                    }
                }

            `})]})}const Ye=a.createContext();function Le(){return a.useContext(Ye)}function _t({children:t}){const{user:r}=H(),[s,b]=a.useState([]),[c,f]=a.useState(0),[p,i]=a.useState(!1);a.useEffect(()=>{if(!r)return;const l=async()=>{try{const g=await(await fetch("/api/notifications")).json();g.success&&(b(g.notifications),f(g.unreadCount))}catch(h){console.error("Failed to fetch notifications",h)}};l();const d=setInterval(l,3e4);return()=>clearInterval(d)},[r]);const o=async(l=null)=>{try{await fetch("/api/notifications/mark-read",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:l,all:!l})}),l?(b(d=>d.map(h=>h.id===l?{...h,is_read:1}:h)),f(d=>Math.max(0,d-1))):(b(d=>d.map(h=>({...h,is_read:1}))),f(0))}catch(d){console.error("Failed to mark read",d)}},m=()=>i(l=>!l);return e.jsx(Ye.Provider,{value:{notifications:s,unreadCount:c,markAsRead:o,isOpen:p,toggleCenter:m,setIsOpen:i},children:t})}const qe=a.createContext();function Re(){return a.useContext(qe)}function Tt({children:t}){const[r,s]=a.useState(!1),b=()=>s(!0),c=()=>s(!1),f=()=>s(p=>!p);return a.useEffect(()=>{const p=i=>{(i.metaKey||i.ctrlKey)&&i.key==="k"&&(i.preventDefault(),f()),i.key==="Escape"&&r&&c()};return window.addEventListener("keydown",p),()=>window.removeEventListener("keydown",p)},[r]),e.jsx(qe.Provider,{value:{isOpen:r,openSpotlight:b,closeSpotlight:c,toggleSpotlight:f},children:t})}function Lt({isOpen:t,onClose:r}){const s=a.useRef(null),b=Q(),[c,f]=a.useState(()=>localStorage.getItem("themePreference")||"dark"),[p,i]=a.useState({students:0,atRisk:0,pendingReports:0});a.useEffect(()=>{if(!t)return;(async()=>{var d,h,g;try{const x=await(await fetch("/api/data/stats")).json();x.success&&i({students:((d=x.stats)==null?void 0:d.totalStudents)||0,atRisk:((h=x.stats)==null?void 0:h.atRiskStudents)||0,pendingReports:((g=x.stats)==null?void 0:g.pendingReports)||0})}catch{}})()},[t]),a.useEffect(()=>{if(!t)return;const l=h=>{s.current&&!s.current.contains(h.target)&&r()},d=setTimeout(()=>{document.addEventListener("mousedown",l)},100);return()=>{clearTimeout(d),document.removeEventListener("mousedown",l)}},[t,r]),a.useEffect(()=>{if(!t)return;const l=d=>{d.key==="Escape"&&r()};return window.addEventListener("keydown",l),()=>window.removeEventListener("keydown",l)},[t,r]);const o=l=>{if(f(l),localStorage.setItem("themePreference",l),l==="auto"){const d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",d?"dark":"light")}else document.documentElement.setAttribute("data-theme",l)},m=l=>{r(),b(l)};return t?e.jsxs("div",{ref:s,className:"control-center-panel",children:[e.jsx("div",{className:"cc-section",children:e.jsxs("div",{className:"cc-grid-2x2",children:[e.jsxs("button",{className:"cc-tile",onClick:()=>m("/weekly-reports"),children:[e.jsx("div",{className:"cc-tile-icon",children:"📝"}),e.jsx("div",{className:"cc-tile-label",children:"Submit Report"})]}),e.jsxs("button",{className:"cc-tile",onClick:()=>m("/report-export"),children:[e.jsx("div",{className:"cc-tile-icon",children:"📤"}),e.jsx("div",{className:"cc-tile-label",children:"Export Data"})]}),e.jsxs("button",{className:"cc-tile",onClick:()=>m("/students"),children:[e.jsx("div",{className:"cc-tile-icon",children:"👥"}),e.jsx("div",{className:"cc-tile-label",children:"Students"})]}),e.jsxs("button",{className:"cc-tile",onClick:()=>m("/groups"),children:[e.jsx("div",{className:"cc-tile-icon",children:"🏘️"}),e.jsx("div",{className:"cc-tile-label",children:"Groups"})]})]})}),e.jsxs("div",{className:"cc-section",children:[e.jsx("div",{className:"cc-section-title",children:"Appearance"}),e.jsx("div",{className:"cc-theme-row",children:[{id:"light",label:"☀️",name:"Light"},{id:"dark",label:"🌙",name:"Dark"},{id:"auto",label:"🔄",name:"Auto"}].map(l=>e.jsxs("button",{className:`cc-theme-btn ${c===l.id?"active":""}`,onClick:()=>o(l.id),children:[e.jsx("span",{className:"cc-theme-icon",children:l.label}),e.jsx("span",{className:"cc-theme-name",children:l.name})]},l.id))})]}),e.jsxs("div",{className:"cc-section",children:[e.jsx("div",{className:"cc-section-title",children:"Quick Stats"}),e.jsxs("div",{className:"cc-stats-row",children:[e.jsxs("div",{className:"cc-stat-tile",children:[e.jsx("div",{className:"cc-stat-number",children:p.students}),e.jsx("div",{className:"cc-stat-name",children:"Students"})]}),e.jsxs("div",{className:"cc-stat-tile warning",children:[e.jsx("div",{className:"cc-stat-number",children:p.atRisk}),e.jsx("div",{className:"cc-stat-name",children:"At Risk"})]}),e.jsxs("div",{className:"cc-stat-tile",children:[e.jsx("div",{className:"cc-stat-number",children:p.pendingReports}),e.jsx("div",{className:"cc-stat-name",children:"Pending"})]})]})]}),e.jsx("div",{className:"cc-section",children:e.jsxs("div",{className:"cc-actions-row",children:[e.jsxs("button",{className:"cc-action-btn",onClick:()=>m("/settings"),children:[e.jsx("span",{children:"⚙️"})," Settings"]}),e.jsxs("button",{className:"cc-action-btn",onClick:()=>m("/audit"),children:[e.jsx("span",{children:"📋"})," Audit Logs"]}),e.jsxs("button",{className:"cc-action-btn",onClick:()=>m("/checkpoints"),children:[e.jsx("span",{children:"🎯"})," Checkpoints"]})]})}),e.jsx("style",{children:`
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
            `})]}):null}function Rt(){const{user:t,logout:r}=H(),s=Q(),{openSettings:b}=re(),{unreadCount:c,toggleCenter:f}=Le(),{toggleSpotlight:p}=Re(),[i,o]=a.useState(new Date),[m,l]=a.useState(!1),[d,h]=a.useState(!1);a.useEffect(()=>{const n=setInterval(()=>o(new Date),6e4);return()=>clearInterval(n)},[]);const g=n=>n.toLocaleDateString("en-US",{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});return e.jsxs("header",{className:"tahoe-menubar",children:[e.jsx("div",{className:"menubar-left",children:e.jsx("div",{className:"menu-item app-name font-bold",children:(t==null?void 0:t.role)||"Dashboard"})}),e.jsxs("div",{className:"menubar-right",children:[e.jsx("div",{className:"menu-item icon-btn",onClick:p,title:"Spotlight Search (Cmd+K)",children:e.jsxs("svg",{width:"15",height:"15",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"11",cy:"11",r:"8"}),e.jsx("line",{x1:"21",y1:"21",x2:"16.65",y2:"16.65"})]})}),e.jsx("div",{className:"menu-item icon-btn",onClick:()=>h(!d),title:"Control Center",children:e.jsxs("svg",{width:"15",height:"15",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"3",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"14",y:"3",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"3",y:"14",width:"7",height:"7",rx:"1.5"}),e.jsx("rect",{x:"14",y:"14",width:"7",height:"7",rx:"1.5"})]})}),e.jsxs("div",{className:"menu-item icon-btn",onClick:f,title:"Notifications",style:{position:"relative"},children:[e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"}),e.jsx("path",{d:"M13.73 21a2 2 0 0 1-3.46 0"})]}),c>0&&e.jsx("span",{className:"badge-dot"})]}),e.jsx("div",{className:"menu-item clock",children:g(i)}),t&&e.jsxs("div",{className:`menu-item user-profile ${m?"active":""}`,onClick:()=>l(!m),children:[e.jsx("span",{className:"user-name",children:t.name}),e.jsx("div",{className:"avatar-tiny",children:t.profile_image?e.jsx("img",{src:t.profile_image,alt:t.name,style:{width:"100%",height:"100%",objectFit:"cover"}}):t.name.charAt(0)}),m&&e.jsxs("div",{className:"menubar-dropdown",children:[e.jsxs("div",{className:"dropdown-header",children:[e.jsx("div",{className:"avatar-large",children:t.profile_image?e.jsx("img",{src:t.profile_image,alt:t.name,style:{width:"100%",height:"100%",objectFit:"cover"}}):t.name.charAt(0)}),e.jsxs("div",{className:"user-details",children:[e.jsx("div",{className:"name",children:t.name}),e.jsx("div",{className:"role",children:t.role})]})]}),e.jsx("div",{className:"dropdown-divider"}),e.jsx("button",{onClick:()=>s("/dashboard"),className:"dropdown-item",children:"Dashboard"}),e.jsx("button",{onClick:()=>{l(!1),b()},className:"dropdown-item",children:"System Preferences..."}),e.jsx("div",{className:"dropdown-divider"}),e.jsx("button",{onClick:r,className:"dropdown-item danger",children:"Log Out..."})]})]})]}),e.jsx(Lt,{isOpen:d,onClose:()=>h(!1)}),e.jsx("style",{children:`
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

                /* Responsive */
                @media (max-width: 768px) {
                    .menubar-left .menu-item:not(.app-name) {
                        display: none; /* Hide File, Edit, View, Window, Help */
                    }
                    .clock {
                        display: none; /* Optionally hide clock to save space on very small screens */
                    }
                    .user-profile .user-name {
                        display: none; /* Hide name text, keep avatar */
                    }
                }

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
                        margin: 40px 0 60px 0; /* Flush with sides, space for menubar and dock */
                        border-radius: 0;
                        border-left: none;
                        border-right: none;
                        border-bottom: none;
                    }
                    .window-header-controls {
                        display: none; /* Hide macOS window controls on mobile */
                    }
                    .content-scroll-area {
                        padding: var(--space-md) var(--space-xs); /* Tighter padding for mobile content */
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
                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr); /* Force 2 columns on mobile */
                        gap: 12px;
                    }
                    .glass-card.stat-card {
                        padding: 16px; /* Less padding on small screens */
                        border-radius: 16px;
                    }
                    .stat-value {
                        font-size: 24px; /* Slightly smaller text */
                    }
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
            `})]})}ot.register(nt,it,lt,dt,ct,pt,xt,gt,ht);const X={primary:"rgba(99, 102, 241, 0.8)",success:"rgba(16, 185, 129, 0.8)",warning:"rgba(245, 158, 11, 0.8)",danger:"rgba(239, 68, 68, 0.8)",info:"rgba(59, 130, 246, 0.8)"},ve=t=>{const r=t==="dark"||t==="auto"&&window.matchMedia("(prefers-color-scheme: dark)").matches||document.documentElement.getAttribute("data-theme")==="dark",s=r?"rgba(255, 255, 255, 0.7)":"rgba(0, 0, 0, 0.7)",b=r?"rgba(255, 255, 255, 0.1)":"rgba(0, 0, 0, 0.06)",c=r?"rgba(255, 255, 255, 0.5)":"rgba(0, 0, 0, 0.5)";return{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{labels:{color:s,font:{family:"Plus Jakarta Sans",size:12},padding:12}}},scales:{x:{ticks:{color:c},grid:{color:b}},y:{ticks:{color:c},grid:{color:b}}}}};function It({data:t}){const{theme:r}=re(),s=ve(r),b={labels:["0-25%","26-50%","51-75%","76-100%"],datasets:[{label:"Students",data:t||[0,0,0,0],backgroundColor:[X.danger,X.warning,X.info,X.success],borderRadius:8}]};return e.jsxs("div",{className:"glass-card chart-card",children:[e.jsx("div",{className:"chart-header",children:e.jsx("h3",{className:"chart-title",children:"Progress Distribution"})}),e.jsx("div",{className:"chart-container",children:e.jsx(Oe,{data:b,options:s})})]})}function Bt({data:t}){const{theme:r}=re(),s=ve(r),b={...s,scales:{},plugins:{legend:{position:"right",labels:s.plugins.legend.labels}}},c={labels:["Completed","In Progress","Not Started"],datasets:[{data:t||[0,0,0],backgroundColor:[X.success,X.info,X.warning],borderColor:r==="dark"?"rgba(255, 255, 255, 0.1)":"rgba(255, 255, 255, 1)",borderWidth:2}]};return e.jsxs("div",{className:"glass-card chart-card",children:[e.jsx("div",{className:"chart-header",children:e.jsx("h3",{className:"chart-title",children:"Completion Status"})}),e.jsx("div",{className:"chart-container",children:e.jsx(ut,{data:c,options:b})})]})}function Wt({data:t}){const{theme:r}=re(),s=ve(r),b={...s,indexAxis:"y",plugins:{...s.plugins,legend:{display:!1}}},c={labels:(t==null?void 0:t.labels)||["Course 1","Course 2","Course 3"],datasets:[{label:"Average Progress %",data:(t==null?void 0:t.values)||[0,0,0],backgroundColor:X.primary,borderRadius:8}]};return e.jsxs("div",{className:"glass-card chart-card",children:[e.jsx("div",{className:"chart-header",children:e.jsx("h3",{className:"chart-title",children:"Average Progress per Course"})}),e.jsx("div",{className:"chart-container",children:e.jsx(Oe,{data:c,options:b})})]})}function Dt({data:t}){const{theme:r}=re(),s=ve(r),b={...s,plugins:{...s.plugins,legend:{display:!1}}},c={labels:(t==null?void 0:t.labels)||["Week 1","Week 2","Week 3","Week 4"],datasets:[{label:"Active Students",data:(t==null?void 0:t.values)||[0,0,0,0],borderColor:X.primary,backgroundColor:"rgba(99, 102, 241, 0.1)",fill:!0,tension:.4,pointBackgroundColor:X.primary,pointBorderColor:"#fff",pointHoverBackgroundColor:"#fff",pointHoverBorderColor:X.primary}]};return e.jsxs("div",{className:"glass-card chart-card",children:[e.jsx("div",{className:"chart-header",children:e.jsx("h3",{className:"chart-title",children:"Engagement Over Time"})}),e.jsx("div",{className:"chart-container",children:e.jsx(mt,{data:c,options:b})})]})}function Pt({chartData:t}){return e.jsxs("div",{className:"charts-section",children:[e.jsx(It,{data:t==null?void 0:t.progressDistribution}),e.jsx(Bt,{data:t==null?void 0:t.completionStatus}),e.jsx(Wt,{data:t==null?void 0:t.courseProgress}),e.jsx(Dt,{data:t==null?void 0:t.engagement}),e.jsx("style",{children:`
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
            `})]})}function $t({students:t,onFilter:r}){const{user:s}=H(),b=t.filter(f=>f.alertLevel==="red").length,c=t.filter(f=>f.alertLevel==="yellow").length;return b===0&&c===0?null:e.jsxs("div",{className:"alerts-banner",style:{marginBottom:"24px",borderLeft:"4px solid var(--warning)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-2)",border:"var(--border-layer-2)",borderRadius:"16px",boxShadow:"var(--shadow-layer-3)"},children:[e.jsxs("div",{style:{display:"flex",gap:"24px",alignItems:"center"},children:[b>0&&e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",color:"var(--error)"},children:[e.jsx("span",{style:{fontSize:"18px"},children:"🛑"}),e.jsxs("span",{style:{fontWeight:"600"},children:[b," Students"]}),e.jsxs("span",{style:{opacity:.8},children:["inactive ",">"," 30 days"]})]}),c>0&&e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",color:"var(--warning)"},children:[e.jsx("span",{style:{fontSize:"18px"},children:"⚠️"}),e.jsxs("span",{style:{fontWeight:"600"},children:[c," Students"]}),e.jsxs("span",{style:{opacity:.8},children:["inactive ",">"," 14 days"]})]})]}),((s==null?void 0:s.role)==="Pastor"||(s==null?void 0:s.role)==="Admin"||(s==null?void 0:s.role)==="Coordinator")&&e.jsx("button",{className:"btn-secondary",onClick:()=>r&&r("alert"),style:{fontSize:"13px",padding:"6px 16px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)"},children:"View Inactive Students"})]})}function Mt({campus:t}){const r=Q(),[s,b]=a.useState(null),[c,f]=a.useState(!0);a.useEffect(()=>{p()},[t]);const p=async()=>{f(!0);try{const g=new URLSearchParams;t&&g.append("celebration_point",t);const x=await(await fetch(`/api/formation-dashboard?${g}`)).json();x.success&&b(x)}catch{}f(!1)};if(c)return e.jsx("div",{style:{textAlign:"center",padding:40,color:"var(--text-secondary)"},children:"Loading formation data..."});if(!s)return null;const{submissionStatus:i,engagementTrend:o,pastoralConcerns:m,formationEvidence:l,checkpointStatus:d}=s;return i.length>0||o.length>0||m.length>0?e.jsxs("div",{style:{marginTop:24},children:[e.jsxs("h2",{style:{fontSize:17,fontWeight:700,color:"var(--text-primary)",marginBottom:16,display:"flex",alignItems:"center",gap:8},children:[e.jsx("span",{style:{width:28,height:28,borderRadius:8,display:"inline-flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",fontSize:14},children:"🌱"}),"Formation Layer"]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16},children:[e.jsxs("div",{style:ie,onClick:()=>r("/weekly-reports"),className:"formation-widget",children:[e.jsxs("div",{style:le,children:[e.jsx("span",{style:de,children:"📊 Report Submissions"}),e.jsxs("span",{style:{fontSize:11,color:"var(--text-secondary)"},children:[i.length," groups"]})]}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:6,marginTop:10},children:i.map(g=>{const n=g.total_reports>0?g.latest_week>=1?"#34C759":"#FF9500":"#FF3B30";return e.jsx("div",{title:`${g.group_code} — ${g.name}
${g.total_reports} reports, latest: Week ${g.latest_week||"—"}`,style:{width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:`${n}18`,border:`1px solid ${n}33`,fontSize:10,fontWeight:700,color:n,cursor:"pointer",transition:"transform 0.15s"},onMouseEnter:x=>x.currentTarget.style.transform="scale(1.15)",onMouseLeave:x=>x.currentTarget.style.transform="scale(1)",children:g.group_code.slice(-3)},g.id)})}),e.jsxs("div",{style:{display:"flex",gap:12,marginTop:10,fontSize:10,color:"var(--text-secondary)"},children:[e.jsxs("span",{children:[e.jsx("span",{style:{color:"#34C759"},children:"●"})," Submitted"]}),e.jsxs("span",{children:[e.jsx("span",{style:{color:"#FF9500"},children:"●"})," Pending"]}),e.jsxs("span",{children:[e.jsx("span",{style:{color:"#FF3B30"},children:"●"})," No reports"]})]})]}),e.jsxs("div",{style:ie,onClick:()=>r("/weekly-reports"),className:"formation-widget",children:[e.jsxs("div",{style:le,children:[e.jsx("span",{style:de,children:"📈 Engagement Trend"}),e.jsxs("span",{style:{fontSize:11,color:"var(--text-secondary)"},children:[o.length," weeks"]})]}),o.length>0?e.jsxs("div",{style:{marginTop:10},children:[e.jsx("div",{style:{display:"flex",alignItems:"flex-end",gap:4,height:80},children:o.map(g=>{const x=Math.max(10,g.avg_score/3*70),u=g.avg_score>=2.5?"#34C759":g.avg_score>=1.5?"#FF9500":"#FF3B30";return e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",flex:1},title:`Week ${g.week_number}: ${g.avg_score}/3.0
High: ${g.high_count}, Med: ${g.medium_count}, Low: ${g.low_count}`,children:[e.jsx("div",{style:{width:"100%",maxWidth:28,height:x,borderRadius:"6px 6px 2px 2px",background:`linear-gradient(to top, ${u}88, ${u})`,transition:"height 0.3s"}}),e.jsxs("span",{style:{fontSize:9,color:"var(--text-secondary)",marginTop:3},children:["W",g.week_number]})]},g.week_number)})}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:10,color:"var(--text-secondary)"},children:[e.jsx("span",{children:"Low (1.0)"}),e.jsx("span",{children:"High (3.0)"})]})]}):e.jsx("div",{style:{padding:20,textAlign:"center",fontSize:12,color:"var(--text-secondary)"},children:"No engagement data yet"})]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16},children:[e.jsxs("div",{style:{...ie,maxHeight:260,overflow:"hidden",display:"flex",flexDirection:"column"},children:[e.jsxs("div",{style:le,children:[e.jsx("span",{style:de,children:"🙏 Pastoral Concerns"}),e.jsx("span",{style:{fontSize:11,color:"#FF9500"},children:m.length})]}),e.jsx("div",{style:{flex:1,overflowY:"auto",marginTop:8},children:m.length>0?m.map(g=>e.jsxs("div",{onClick:()=>r("/weekly-reports"),style:{padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer",transition:"background 0.15s"},children:[e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)",marginBottom:3},children:[g.group_code," · Week ",g.week_number," · ",g.facilitator_name]}),e.jsx("div",{style:{fontSize:12,color:"var(--text-primary)",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"},children:g.pastoral_concerns})]},g.id)):e.jsx("div",{style:{padding:16,textAlign:"center",fontSize:12,color:"var(--text-secondary)"},children:"No concerns flagged"})})]}),e.jsxs("div",{style:{...ie,maxHeight:260,overflow:"hidden",display:"flex",flexDirection:"column"},children:[e.jsxs("div",{style:le,children:[e.jsx("span",{style:de,children:"🌱 Formation Evidence"}),e.jsx("span",{style:{fontSize:11,color:"#34C759"},children:l.length})]}),e.jsx("div",{style:{flex:1,overflowY:"auto",marginTop:8},children:l.length>0?l.map(g=>e.jsxs("div",{onClick:()=>r("/weekly-reports"),style:{padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer"},children:[e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)",marginBottom:3},children:[g.group_code," · Week ",g.week_number," · ",g.facilitator_name]}),e.jsx("div",{style:{fontSize:12,color:"var(--text-primary)",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"},children:g.formation_evidence})]},g.id)):e.jsx("div",{style:{padding:16,textAlign:"center",fontSize:12,color:"var(--text-secondary)"},children:"No evidence reported"})})]}),e.jsxs("div",{style:{...ie,maxHeight:260,overflow:"hidden",display:"flex",flexDirection:"column"},children:[e.jsx("div",{style:le,children:e.jsx("span",{style:de,children:"🎯 Checkpoint Status"})}),d.length>0?e.jsx("div",{style:{marginTop:8,flex:1,overflowY:"auto"},children:[4,8,13].map(g=>{const n=d.filter(C=>C.checkpoint_week===g);if(n.length===0)return null;const x=n.filter(C=>C.status==="reviewed").length,u=n.filter(C=>C.status==="completed").length,N=n.filter(C=>C.status==="pending").length;return e.jsxs("div",{onClick:()=>r("/checkpoints"),style:{padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer"},children:[e.jsxs("div",{style:{fontSize:12,fontWeight:600,color:"var(--text-primary)",marginBottom:4},children:["Week ",g]}),e.jsxs("div",{style:{display:"flex",gap:8,fontSize:10},children:[x>0&&e.jsxs("span",{style:{color:"#34C759"},children:["✅ ",x," reviewed"]}),u>0&&e.jsxs("span",{style:{color:"#007AFF"},children:["✓ ",u," completed"]}),N>0&&e.jsxs("span",{style:{color:"#FF9500"},children:["⏳ ",N," pending"]})]})]},g)})}):e.jsx("div",{style:{padding:16,textAlign:"center",fontSize:12,color:"var(--text-secondary)"},children:"No checkpoints generated yet"})]})]})]}):e.jsxs("div",{style:{marginTop:24},children:[e.jsxs("h2",{style:{fontSize:17,fontWeight:700,color:"var(--text-primary)",marginBottom:16,display:"flex",alignItems:"center",gap:8},children:[e.jsx("span",{style:{width:28,height:28,borderRadius:8,display:"inline-flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",fontSize:14},children:"\uD83C\uDF31"}),"Formation Layer"]}),e.jsx("div",{style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-2)",border:"var(--border-layer-2)",borderRadius:16,padding:"32px 24px",textAlign:"center"},children:e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:32,marginBottom:10},children:"\uD83D\uDCCA"}),e.jsx("div",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)",marginBottom:6},children:"No formation data yet"}),e.jsx("div",{style:{fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.5},children:"Submit weekly reports to see engagement trends, pastoral concerns, and checkpoint status"})]})})]})}const ie={background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-2)",border:"var(--border-layer-2)",borderRadius:16,padding:20,cursor:"pointer",transition:"transform 0.2s var(--ease-spring), box-shadow 0.2s var(--ease-spring), background 0.2s",boxShadow:"var(--shadow-layer-2)"},le={display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},de={fontSize:14,fontWeight:600,color:"var(--text-primary)",letterSpacing:"0.01em"};function Ot(){const{user:t,showToast:r}=H(),{focusMode:s}=re(),b=Q(),[c,f]=a.useState(!0),[p,i]=a.useState([]),[o,m]=a.useState({}),[l,d]=a.useState({}),[h,g]=a.useState([]),[n,x]=a.useState(["Admin","LeadershipTeam","Pastor"].includes(t==null?void 0:t.role)?"":t==null?void 0:t.celebration_point),u=(t==null?void 0:t.role)==="Facilitator";a.useEffect(()=>{N(),u&&C()},[n]);const N=async()=>{f(!0);try{const k=new URLSearchParams;n&&k.append("celebration_point",n);const _=await(await fetch(`/api/data/students?${k}`)).json();_.success?(i(_.students||[]),m(_.stats||{}),d(_.chartData||{})):r(_.message||"Failed to load data","error")}catch(k){console.error("Load data error:",k),r("Failed to connect to server","error")}finally{f(!1)}},C=async()=>{try{const y=await(await fetch("/api/formation-groups")).json();y.success&&g(y.groups||[])}catch{}},j=()=>{b("/students")};return e.jsxs("div",{className:"tahoe-page",children:[["Admin","LeadershipTeam","Pastor"].includes(t==null?void 0:t.role)&&e.jsxs("div",{style:{marginBottom:"24px"},children:[e.jsxs("select",{className:"filter-select",value:n,onChange:k=>x(k.target.value),style:{minWidth:"300px"},children:[["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)&&e.jsx("option",{value:"",children:"All Celebration Points"}),Z.map(k=>e.jsx("option",{value:k,children:k},k))]}),e.jsx("button",{className:"btn-secondary",onClick:N,style:{marginLeft:"12px"},children:"🔄 Refresh Data"})]}),s!=="default"&&e.jsxs("div",{style:{display:"inline-flex",alignItems:"center",gap:"10px",padding:"8px 16px",borderRadius:"var(--radius-pill)",marginBottom:"24px",background:"var(--glass-layer-2)",border:"var(--border-layer-2)",boxShadow:"var(--shadow-layer-3)",backdropFilter:"var(--blur-layer-2)",fontSize:"12px",color:"var(--text-primary)",animation:"fadeIn 0.3s ease-out"},children:[e.jsx("span",{style:{fontSize:"14px"},children:"🎯"}),e.jsxs("span",{children:["Focus: ",e.jsx("strong",{style:{textTransform:"capitalize",color:"var(--primary-light)"},children:s})]}),e.jsx("button",{onClick:()=>document.dispatchEvent(new CustomEvent("toggle-focus-mode",{detail:"default"})),style:{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"50%",width:"20px",height:"20px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginLeft:"8px",color:"var(--text-secondary)",transition:"all 0.2s"},onMouseEnter:k=>{k.currentTarget.style.background="rgba(255,255,255,0.2)",k.currentTarget.style.color="var(--text-primary)"},onMouseLeave:k=>{k.currentTarget.style.background="rgba(255,255,255,0.1)",k.currentTarget.style.color="var(--text-secondary)"},title:"Clear Focus",children:"✕"})]}),c?e.jsxs("div",{className:"loading-container",children:[e.jsx("div",{className:"spinner"}),e.jsx("p",{children:"Loading dashboard data..."})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{onClick:j,style:{cursor:"pointer"},children:e.jsx($t,{students:p,onFilter:()=>{}})}),s!=="facilitator"&&e.jsx(Et,{stats:o}),s!=="facilitator"&&e.jsx("div",{style:{marginTop:"24px"},children:e.jsx(Pt,{chartData:l})}),e.jsx(Mt,{campus:n}),window.__ATTENDANCE_ADDON__&&window.__ATTENDANCE_ADDON__.DashboardWidget?e.jsx(window.__ATTENDANCE_ADDON__.DashboardWidget,{}):null,u&&h.length>0&&e.jsxs("div",{style:{marginTop:32},children:[e.jsx("h3",{style:{fontSize:16,fontWeight:600,color:"var(--text-primary)",marginBottom:16},children:"📋 My Formation Groups"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:16},children:h.map(k=>e.jsxs("div",{onClick:()=>b("/groups"),className:"glass-card hover-card",style:{padding:20,cursor:"pointer",transition:"transform 0.2s var(--ease-spring), box-shadow 0.2s var(--ease-spring)"},onMouseEnter:y=>{y.currentTarget.style.transform="translateY(-4px)",y.currentTarget.style.boxShadow="var(--shadow-layer-4)"},onMouseLeave:y=>{y.currentTarget.style.transform="translateY(0)",y.currentTarget.style.boxShadow="var(--shadow-layer-3)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12},children:[e.jsx("span",{style:{padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:700,background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",color:"white",letterSpacing:.5,boxShadow:"0 2px 6px rgba(118, 75, 162, 0.3)"},children:k.group_code}),k.is_overdue&&e.jsx("span",{style:{fontSize:10,padding:"3px 8px",borderRadius:6,background:"rgba(255, 59, 48, 0.1)",color:"#ff3b30",border:"1px solid rgba(255, 59, 48, 0.2)",fontWeight:600},children:"Report Overdue"})]}),e.jsx("div",{style:{fontSize:15,fontWeight:600,color:"var(--text-primary)",marginBottom:6},children:k.name}),e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)"},children:[k.member_count||0," member",k.member_count!==1?"s":""," · ",k.celebration_point]})]},k.id))})]})]})]})}const Gt=({score:t,size:r=32,strokeWidth:s=1.5})=>{let b="var(--system-green)",c=100;t==="attention"?(b="var(--system-yellow)",c=75):t==="critical"?(b="var(--system-red)",c=40):typeof t=="number"&&(c=t,c<50?b="var(--system-red)":c<80?b="var(--system-yellow)":b="var(--system-green)");const f=(r-s)/2,p=f*2*Math.PI,i=p-c/100*p;return e.jsx("div",{style:{position:"relative",width:r,height:r,display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsxs("svg",{width:r,height:r,style:{transform:"rotate(-90deg)"},children:[e.jsx("circle",{cx:r/2,cy:r/2,r:f,fill:"none",stroke:"rgba(255,255,255,0.1)",strokeWidth:s}),e.jsx("circle",{cx:r/2,cy:r/2,r:f,fill:"none",stroke:b,strokeWidth:s,strokeDasharray:p,strokeDashoffset:i,strokeLinecap:"round",style:{transition:"stroke-dashoffset 0.5s ease"}})]})})};function Je({student:t}){const{user:r,showToast:s}=H(),[b,c]=a.useState("overview"),[f,p]=a.useState([]),[i,o]=a.useState(""),[m,l]=a.useState(!1);a.useEffect(()=>{t&&b==="notes"&&d()},[t,b]);const d=async()=>{l(!0);try{const C=await(await fetch(`/api/data/notes/${t.id}`)).json();C.success&&p(C.notes)}catch(N){console.error("Failed to load notes",N)}finally{l(!1)}},h=async N=>{if(N.preventDefault(),!!i.trim())try{(await(await fetch("/api/data/notes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentId:t.id,content:i,celebrationPoint:t.celebration_point})})).json()).success?(o(""),d(),s("Note added","success")):s("Failed to add note","error")}catch{s("Error adding note","error")}};if(!t)return e.jsxs("div",{className:"empty-state-container",children:[e.jsx("div",{className:"empty-state-icon",children:"👤"}),e.jsx("h3",{children:"Select a Student"}),e.jsx("p",{children:"Choose a student from the list to view their details."}),e.jsx("style",{children:`
                    .empty-state-container {
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                        height: 100%; color: var(--text-muted); text-align: center;
                    }
                    .empty-state-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
                `})]});const g=t.name?t.name.split(" ").map(N=>N[0]).join("").substring(0,2).toUpperCase():"??",n=t.name?t.name.charCodeAt(0):0,x=["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEEAD","#FF9F43","#54a0ff","#5f27cd"],u=x[n%x.length];return e.jsxs("div",{className:"student-detail-view fade-in",children:[e.jsx("div",{className:"student-cover-banner",style:{background:`linear-gradient(135deg, ${u}44, var(--glass-bg))`}}),e.jsxs("div",{className:"student-content-wrapper",children:[e.jsx("div",{className:"student-avatar",style:{background:u},children:g}),e.jsxs("div",{className:"student-header-info",children:[e.jsx("h2",{children:t.name}),e.jsxs("div",{className:"student-badges",children:[e.jsxs("span",{className:"celebration-badge-minimal",children:["📍 ",t.celebration_point]}),t.risk?e.jsxs("span",{className:`status-badge ${t.risk.category.toLowerCase()}`,children:[t.risk.category," Risk"]}):e.jsxs(e.Fragment,{children:[t.alertLevel==="red"&&e.jsx("span",{className:"status-badge red",children:"High Risk"}),t.alertLevel==="yellow"&&e.jsx("span",{className:"status-badge yellow",children:"Moderate Risk"})]}),e.jsx("span",{className:`status-badge ${t.status==="expired"?"red":"healthy"}`,children:t.status})]}),e.jsx("div",{className:"student-email",children:t.email})]}),e.jsxs("div",{className:"student-actions",children:[e.jsxs("a",{href:`mailto:${t.email}`,className:"action-btn",children:[e.jsx("span",{className:"action-icon",children:"✉️"}),e.jsx("span",{className:"action-label",children:"Email"})]}),e.jsxs("button",{className:"action-btn",onClick:()=>c("notes"),children:[e.jsx("span",{className:"action-icon",children:"📝"}),e.jsx("span",{className:"action-label",children:"Note"})]}),e.jsxs("button",{className:"action-btn",onClick:()=>alert("WhatsApp coming soon"),children:[e.jsx("span",{className:"action-icon",children:"💬"}),e.jsx("span",{className:"action-label",children:"Message"})]})]}),e.jsxs("div",{className:"student-tabs",children:[e.jsx("button",{className:`student-tab ${b==="overview"?"active":""}`,onClick:()=>c("overview"),children:"Overview"}),e.jsx("button",{className:`student-tab ${b==="notes"?"active":""}`,onClick:()=>c("notes"),children:"Pastoral Notes"})]}),e.jsx("div",{className:"student-scroll-area",children:b==="overview"?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"student-course-card",children:[e.jsx("h4",{children:"Current Course"}),e.jsx("div",{className:"course-name",children:t.course}),e.jsx("div",{className:"progress-bar-container",style:{height:"8px",background:"rgba(0,0,0,0.05)",borderRadius:"4px",overflow:"hidden"},children:e.jsx("div",{className:"progress-bar-fill",style:{width:`${t.progress}%`,background:u,height:"100%",borderRadius:"4px"}})}),e.jsxs("div",{className:"course-meta",children:[e.jsxs("span",{children:[t.progress,"% Complete"]}),e.jsxs("span",{children:["Last Active: ",new Date(t.lastActivity).toLocaleDateString()]})]})]}),e.jsxs("div",{className:"student-stats-grid",children:[e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-label",children:"Days Inactive"}),e.jsx("div",{className:"stat-value",style:{color:t.daysInactive>14?"var(--warning)":"inherit"},children:t.daysInactive||0})]}),e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-label",children:"Enrolled Date"}),e.jsx("div",{className:"stat-value",style:{fontSize:"14px"},children:t.created_at?new Date(t.created_at).toLocaleDateString():"-"})]})]}),t.risk&&e.jsxs("div",{className:"risk-card glass-card",style:{marginTop:"16px",padding:"16px",borderRadius:"16px",background:"rgba(255,59,48,0.05)",border:"1px solid rgba(255,59,48,0.1)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px",marginBottom:"16px"},children:[e.jsxs("div",{style:{position:"relative"},children:[e.jsx(Gt,{score:100-t.risk.score,size:60,strokeWidth:5}),e.jsx("div",{style:{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:"14px"},children:t.risk.score})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{margin:0,fontSize:"16px",color:"var(--text-primary)"},children:"Risk Intelligence"}),e.jsxs("div",{style:{fontSize:"13px",color:"var(--text-secondary)"},children:["Category: ",e.jsx("span",{style:{fontWeight:600,color:t.risk.category==="Critical"?"#ff3b30":t.risk.category==="Attention"?"#ffcc00":"#34c759"},children:t.risk.category})]})]})]}),e.jsxs("div",{className:"risk-factors",children:[e.jsx(ke,{label:"Login Recency (40%)",value:t.risk.breakdown.recency,max:40,info:`${t.risk.breakdown.daysSinceLogin} days ago`}),e.jsx(ke,{label:"Progress Stagnation (30%)",value:t.risk.breakdown.stagnation,max:30,info:`${t.risk.breakdown.daysSinceActivity} days ago`}),e.jsx(ke,{label:"Completion Rate (20%)",value:t.risk.breakdown.completion,max:20,info:`${t.progress}% done`})]})]})]}):e.jsxs("div",{className:"notes-section",children:[e.jsx("form",{onSubmit:h,style:{marginBottom:"20px"},children:e.jsxs("div",{style:{position:"relative"},children:[e.jsx("textarea",{className:"glass-input student-note-input",placeholder:"Add a new note...",value:i,onChange:N=>o(N.target.value),style:{width:"100%",minHeight:"80px",paddingRight:"40px"}}),e.jsx("button",{type:"submit",className:"student-note-submit",disabled:!i.trim(),children:"➤"})]})}),m?e.jsx("div",{className:"notes-loading",children:"Loading notes..."}):f.length===0?e.jsx("div",{className:"notes-empty",children:"No notes yet."}):e.jsx("div",{className:"notes-timeline",children:f.map(N=>{var C;return e.jsxs("div",{className:"note-item",children:[e.jsx("div",{className:"note-avatar",children:(C=N.author_name)==null?void 0:C.charAt(0)}),e.jsxs("div",{className:"note-content",children:[e.jsxs("div",{className:"note-header",children:[e.jsx("span",{className:"note-author",children:N.author_name}),e.jsx("span",{className:"note-date",children:new Date(N.created_at).toLocaleDateString()})]}),e.jsx("p",{className:"note-text",children:N.content})]})]},N.id)})})]})})]}),e.jsx("style",{children:`
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
            `})]})}function ke({label:t,value:r,max:s,info:b}){const c=Math.min(r/s*100,100);let f="#34c759";return c>50&&(f="#ffcc00"),c>80&&(f="#ff3b30"),e.jsxs("div",{className:"risk-factor-row",children:[e.jsx("span",{className:"risk-factor-label",children:t}),e.jsx("div",{className:"risk-factor-bar-bg",children:e.jsx("div",{style:{width:`${c}%`,height:"100%",background:f,borderRadius:"3px"}})}),e.jsxs("span",{className:"risk-factor-info",children:[b||r,"/",s]})]})}function Ut(){const{user:t,showToast:r}=H(),[s,b]=a.useState("enrolled"),[c,f]=a.useState([]),[p,i]=a.useState(!0),[o,m]=a.useState(!1),[l,d]=a.useState(1),[h,g]=a.useState(!0),n=50,[x,u]=a.useState(""),[N,C]=a.useState(null),[j,k]=a.useState(["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)?"":t==null?void 0:t.celebration_point),[y,_]=a.useState(""),[E,v]=a.useState(""),[R,O]=a.useState(!1),[z,B]=a.useState("all"),M=c.find(L=>(L.id||L.userId)===N)||null;a.useEffect(()=>{G(1,!0)},[s,j,x,E,R,z,y]);const G=async(L,$=!1)=>{$?(i(!0),d(1),g(!0)):m(!0);try{const Y=new URLSearchParams({page:L,limit:n,type:s,search:x,celebration_point:j||"",date:E,noCompany:R,source:z,risk:y}),F=await(await fetch(`/api/data/users?${Y}`)).json();if(F.success){const I=F.users.map(U=>U.type==="enrolled"||!U.type&&s==="enrolled"?{...U,healthScore:W(U)}:U);f($?I:U=>[...U,...I]),I.length<n&&g(!1)}else r("Failed to load data","error")}catch(Y){console.error("Load error:",Y),r("Failed to connect","error")}finally{i(!1),m(!1)}},w=a.useCallback(L=>{const{scrollTop:$,clientHeight:Y,scrollHeight:K}=L.target;if(K-$<=Y+100&&!p&&!o&&h){const F=l+1;d(F),G(F,!1)}},[p,o,h,l]),W=L=>L.daysInactive>=30?"critical":L.daysInactive>=14?"attention":"healthy",A=async(L,$)=>{if(L.stopPropagation(),!!confirm(`Are you sure you want to enroll ${$.name}?`))try{const K=await(await fetch("/api/thinkific/enroll",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:$.userId})})).json();K.success?(r(`Successfully enrolled ${$.name}`,"success"),G(1,!0)):r(K.message||"Enrollment failed","error")}catch{r("Enrollment failed","error")}};return e.jsxs("div",{className:"students-split-view",children:[e.jsxs("div",{className:"students-sidebar",children:[e.jsxs("div",{className:"sidebar-header",children:[e.jsx("h2",{className:"sidebar-title",children:"Students"}),["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)&&e.jsxs("select",{className:"sidebar-select",value:j,onChange:L=>k(L.target.value),children:[["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)&&e.jsx("option",{value:"",children:"All Points"}),Z.map(L=>e.jsx("option",{value:L,children:L},L))]}),e.jsxs("div",{className:"sidebar-search-wrapper",children:[e.jsx("span",{className:"search-icon",children:"🔍"}),e.jsx("input",{type:"text",placeholder:"Search",className:"sidebar-search-input",value:x,onChange:L=>u(L.target.value)})]}),e.jsxs("div",{className:"sidebar-tabs",children:[e.jsx("button",{className:`sidebar-tab ${s==="enrolled"?"active":""}`,onClick:()=>b("enrolled"),children:"Enrolled"}),e.jsx("button",{className:`sidebar-tab ${s==="unenrolled"?"active":""}`,onClick:()=>b("unenrolled"),children:"Unenrolled"})]})]}),e.jsx("div",{className:"sidebar-list",onScroll:w,children:p&&c.length===0?e.jsx("div",{className:"sidebar-loading",children:"Loading..."}):c.length===0?e.jsx("div",{className:"sidebar-empty",children:"No students found"}):e.jsxs(e.Fragment,{children:[c.map(L=>{const $=L.id||L.userId,Y=$===N,K=L.name?L.name.substring(0,2).toUpperCase():"??";return e.jsxs("div",{className:`sidebar-item ${Y?"active":""}`,onClick:()=>C($),children:[e.jsx("div",{className:"item-avatar",children:K}),e.jsxs("div",{className:"item-content",children:[e.jsx("div",{className:"item-name",children:L.name}),e.jsx("div",{className:"item-subtitle",children:L.email})]}),s==="unenrolled"&&e.jsx("button",{className:"item-action-btn",onClick:F=>A(F,L),title:"Enroll",children:"+"})]},$)}),o&&e.jsx("div",{className:"sidebar-loading-more",children:"Loading more..."})]})}),e.jsxs("div",{className:"sidebar-footer",children:[c.length," Students ",h?"+":""]})]}),e.jsxs("div",{className:`students-detail-pane ${N?"":"mobile-hidden"}`,children:[N&&e.jsx("button",{className:"mobile-back-btn mobile-only",onClick:()=>C(null),children:"← Back to List"}),e.jsx(Je,{student:M})]}),e.jsx("style",{children:`
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
                    display: flex;
                    flex-direction: column;
                }

                .mobile-back-btn {
                    padding: 12px 16px;
                    background: var(--glass-layer-1);
                    border: none;
                    border-bottom: 1px solid var(--separator);
                    text-align: left;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--accent-color);
                    cursor: pointer;
                }

                .mobile-only {
                    display: none;
                }

                @media (max-width: 768px) {
                    .students-split-view {
                        height: calc(100vh - 120px); /* Adjust for mobile UI */
                        border-radius: 0;
                    }
                    .students-sidebar {
                        width: 100%;
                    }
                    .mobile-hidden {
                        display: none !important;
                    }
                    .mobile-only {
                        display: block;
                    }
                }
            `})]})}function Ht({selectedImage:t,onSelect:r}){const[s,b]=a.useState({}),[c,f]=a.useState(!0),[p,i]=a.useState(null);if(a.useEffect(()=>{fetch("/api/public/profile-images").then(m=>m.json()).then(m=>{m.success&&(b(m.images),Object.keys(m.images).length>0&&i(Object.keys(m.images)[0]))}).catch(m=>console.error("Failed to load profile images",m)).finally(()=>f(!1))},[]),c)return e.jsx("div",{className:"picker-loading",children:"Loading avatars..."});const o=Object.keys(s);return e.jsxs("div",{className:"profile-picker",children:[e.jsx("div",{className:"picker-tabs",children:o.map(m=>e.jsx("button",{onClick:()=>i(m),className:`picker-tab ${p===m?"active":""}`,children:m},m))}),e.jsx("div",{className:"picker-grid-container",children:p&&e.jsx("div",{className:"picker-grid",children:s[p].map((m,l)=>e.jsxs("div",{onClick:()=>r(m),className:`picker-item ${t===m?"active":""}`,children:[e.jsx("img",{src:m,alt:"Avatar",className:"picker-img",onError:d=>{d.target.onerror=null,d.target.style.display="none",d.target.parentNode.classList.add("error"),d.target.parentNode.innerHTML="<span>?</span>"}}),t===m&&e.jsx("div",{className:"picker-check",children:e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"white",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("polyline",{points:"20 6 9 17 4 12"})})})]},l))})}),e.jsx("style",{children:`
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
            `})]})}function Yt(){const{showToast:t,user:r}=H(),s=(r==null?void 0:r.role)==="TechSupport",[b,c]=a.useState([]),[f,p]=a.useState(!0),[i,o]=a.useState(!1),[m,l]=a.useState(null),[d,h]=a.useState({username:"",password:"",name:"",role:"Coordinator",celebration_point:"",profile_image:""});a.useEffect(()=>{g()},[]);const g=async()=>{p(!0);try{const k=await(await fetch("/api/admin/users")).json();if(k.success){let y=k.users||[];s&&(y=y.filter(_=>_.role==="Facilitator")),c(y)}}catch{t("Failed to load users","error")}finally{p(!1)}},n=(j=null)=>{j?(l(j),h({username:j.username,password:"",name:j.name,role:j.role,celebration_point:j.celebration_point||"",profile_image:j.profile_image||""})):(l(null),h({username:"",password:"",name:"",role:s?"Facilitator":"Coordinator",celebration_point:"",profile_image:""})),o(!0)},x=()=>{o(!1),l(null),h({username:"",password:"",name:"",role:"Coordinator",celebration_point:"",profile_image:""})},u=async j=>{if(j.preventDefault(),["Pastor","Coordinator","TechSupport","Facilitator"].includes(d.role)&&!d.celebration_point){t(`${d.role} must be assigned a Celebration Point`,"error");return}try{const y=m?`/api/admin/users/${m.id}`:"/api/admin/users",v=await(await fetch(y,{method:m?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)})).json();v.success?(t(m?"User updated successfully":"User created successfully","success"),x(),g()):t(v.message||"Operation failed","error")}catch{t("Failed to save user","error")}},N=async j=>{if(confirm("Are you sure you want to deactivate this user?"))try{const y=await(await fetch(`/api/admin/users/${j}`,{method:"DELETE"})).json();y.success?(t("User deactivated","success"),g()):t(y.message||"Failed to deactivate user","error")}catch{t("Failed to deactivate user","error")}},C=async j=>{if(confirm(`WARNING: IRREVERSIBLE ACTION

Are you sure you want to PERMANENTLY DELETE this user? This cannot be undone.`))try{const y=await(await fetch(`/api/admin/users/${j}/permanent`,{method:"DELETE"})).json();y.success?(t("User permanently deleted","success"),g()):t(y.message||"Failed to delete user","error")}catch{t("Failed to delete user","error")}};return e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:1200,margin:"0 auto"},children:[e.jsxs("div",{className:"section-header admin-header",style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12,background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",padding:"16px 24px",borderRadius:20,border:"var(--border-layer-2)",boxShadow:"var(--shadow-layer-2)"},children:[e.jsx("h2",{style:{margin:0,fontSize:22,color:"var(--text-primary)"},children:"User Management"}),e.jsx("button",{className:"btn-primary",onClick:()=>n(),style:{width:"auto",padding:"8px 18px",fontSize:13,boxShadow:"var(--shadow-layer-3)"},children:"+ Add New User"})]}),f?e.jsxs("div",{className:"loading-container",children:[e.jsx("div",{className:"spinner"}),e.jsx("p",{children:"Loading users..."})]}):e.jsx("div",{className:"admin-grid",style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:16},children:b.map(j=>e.jsxs("div",{className:"glass-card user-card",style:{background:"var(--glass-layer-1)",backdropFilter:"var(--blur-layer-2)",border:"var(--border-layer-1)",borderRadius:16,padding:20,display:"flex",flexDirection:"column",gap:16,transition:"transform 0.2s, box-shadow 0.2s, background 0.2s"},onMouseEnter:k=>{k.currentTarget.style.transform="translateY(-4px)",k.currentTarget.style.boxShadow="var(--shadow-layer-3)",k.currentTarget.style.background="var(--glass-layer-2)"},onMouseLeave:k=>{k.currentTarget.style.transform="translateY(0)",k.currentTarget.style.boxShadow="none",k.currentTarget.style.background="var(--glass-layer-1)"},children:[e.jsxs("div",{className:"user-card-header",style:{display:"flex",alignItems:"center",gap:12},children:[e.jsx("div",{className:"user-avatar-small",style:{width:48,height:48,borderRadius:"50%",fontSize:20,background:"linear-gradient(135deg, var(--glass-layer-3), var(--glass-layer-2))",border:"var(--border-layer-2)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-primary)",fontWeight:600,overflow:"hidden",flexShrink:0},children:j.profile_image?e.jsx("img",{src:j.profile_image,alt:j.name,style:{width:"100%",height:"100%",objectFit:"cover"}}):j.name.charAt(0)}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"user-card-name",style:{fontSize:16,fontWeight:600,color:"var(--text-primary)"},children:j.name}),e.jsx("span",{className:`user-card-role ${j.role.toLowerCase()}`,style:{fontSize:11,padding:"2px 8px",borderRadius:6,background:"var(--glass-layer-3)",color:"var(--text-secondary)",border:"var(--border-layer-1)",display:"inline-block",marginTop:4},children:j.role})]})]}),e.jsxs("div",{className:"user-card-details",style:{background:"var(--glass-layer-2)",borderRadius:10,padding:12,fontSize:13,color:"var(--text-secondary)",border:"var(--border-layer-1)"},children:[e.jsxs("div",{style:{marginBottom:4},children:["Username: ",e.jsx("span",{style:{color:"var(--text-primary)"},children:j.username})]}),j.celebration_point&&e.jsxs("div",{style:{marginBottom:4},children:["Campus: ",e.jsx("span",{style:{color:"var(--text-primary)"},children:j.celebration_point})]}),e.jsxs("div",{children:["Status: ",e.jsx("span",{style:{color:j.active?"#34C759":"#FF3B30"},children:j.active?"Active":"Inactive"})]})]}),e.jsxs("div",{className:"user-card-actions",style:{display:"flex",gap:10,marginTop:"auto"},children:[e.jsx("button",{onClick:()=>n(j),style:{flex:1,padding:"8px",border:"var(--border-layer-2)",background:"var(--glass-layer-2)",color:"var(--text-primary)",fontSize:13,cursor:"pointer",transition:"background 0.2s",fontWeight:500},onMouseEnter:k=>k.target.style.background="var(--glass-layer-3)",onMouseLeave:k=>k.target.style.background="var(--glass-layer-2)",children:"Edit"}),j.active&&e.jsx("button",{onClick:()=>N(j.id),style:{flex:1,padding:"8px",border:"1px solid rgba(255,59,48,0.2)",background:"rgba(255,59,48,0.1)",color:"#ff3b30",fontSize:13,cursor:"pointer",transition:"background 0.2s",fontWeight:500},onMouseEnter:k=>k.target.style.background="rgba(255,59,48,0.2)",onMouseLeave:k=>k.target.style.background="rgba(255,59,48,0.1)",children:"Deactivate"}),!j.active&&!s&&e.jsx("button",{onClick:()=>C(j.id),style:{flex:1,padding:"8px",border:"1px solid rgba(255,59,48,0.4)",background:"rgba(255,59,48,0.2)",color:"#ff3b30",fontSize:13,cursor:"pointer",transition:"background 0.2s",fontWeight:600},onMouseEnter:k=>k.target.style.background="rgba(255,59,48,0.3)",onMouseLeave:k=>k.target.style.background="rgba(255,59,48,0.2)",children:"Delete"})]})]},j.id))}),i&&e.jsx("div",{className:"modal-overlay",onClick:x,style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e4,backdropFilter:"blur(5px)"},children:e.jsxs("div",{className:"glass-card modal",onClick:j=>j.stopPropagation(),style:{width:"800px",maxWidth:"95%",padding:"0",display:"flex",flexDirection:"column",overflow:"hidden",borderRadius:"20px",border:"var(--border-layer-2)",background:"var(--glass-layer-4)",backdropFilter:"var(--blur-layer-4)",boxShadow:"var(--shadow-layer-4)"},children:[e.jsxs("div",{style:{height:"44px",background:"var(--glass-layer-3)",borderBottom:"var(--border-layer-1)",display:"flex",alignItems:"center",padding:"0 16px"},children:[e.jsxs("div",{style:{display:"flex",gap:"8px"},children:[e.jsx("button",{onClick:x,style:{width:"12px",height:"12px",borderRadius:"50%",background:"#ff5f56",border:"1px solid #e0443e",cursor:"pointer"}}),e.jsx("div",{style:{width:"12px",height:"12px",borderRadius:"50%",background:"#ffbd2e",border:"1px solid #dea123",cursor:"pointer"},onClick:v=>{const m=v.target.closest(".modal");if(m){m.classList.add("modal-minimized");setTimeout(()=>v.target.parentElement.firstChild.click(),400)}}}),e.jsx("div",{style:{width:"12px",height:"12px",borderRadius:"50%",background:"#27c93f",border:"1px solid #1aab29",cursor:"pointer"},onClick:v=>{const m=v.target.closest(".modal");if(m)m.classList.toggle("modal-maximized")}})]}),e.jsx("div",{style:{flex:1,textAlign:"center",fontWeight:"500",color:"var(--text-secondary)",fontSize:"13px"},children:m?"System Preferences - Edit User":"System Preferences - New User"}),e.jsx("div",{style:{width:"52px"}})," "]}),e.jsxs("div",{style:{display:"flex",height:"500px"},children:[e.jsxs("div",{style:{width:"280px",background:"var(--glass-layer-1)",borderRight:"var(--border-layer-1)",padding:"32px 24px",display:"flex",flexDirection:"column",alignItems:"center"},children:[e.jsx("div",{style:{width:"140px",height:"140px",borderRadius:"50%",background:"var(--glass-layer-2)",marginBottom:"24px",border:"4px solid var(--border-layer-2)",overflow:"hidden",boxShadow:"var(--shadow-layer-3)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-secondary)"},children:d.profile_image?e.jsx("img",{src:d.profile_image,alt:"Preview",style:{width:"100%",height:"100%",objectFit:"cover"}}):e.jsx("span",{style:{fontSize:"48px",color:"var(--text-secondary)",opacity:.5},children:"?"})}),e.jsxs("div",{style:{width:"100%"},children:[e.jsx("label",{style:{display:"block",fontSize:"12px",color:"var(--text-secondary)",marginBottom:"12px",textAlign:"center"},children:"Select Avatar"}),e.jsx(Ht,{selectedImage:d.profile_image,onSelect:j=>h({...d,profile_image:j})})]})]}),e.jsx("div",{style:{flex:1,padding:"32px",overflowY:"auto"},children:e.jsxs("form",{onSubmit:u,style:{display:"flex",flexDirection:"column",gap:"24px"},children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",style:{fontSize:"13px",color:"var(--text-secondary)",marginBottom:8,display:"block"},children:"Full Name"}),e.jsx("input",{type:"text",className:"form-input",value:d.name,onChange:j=>h({...d,name:j.target.value}),required:!0,style:{width:"100%",padding:"12px 16px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box"},placeholder:"Joshua Migadde"})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"},children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",style:{fontSize:"13px",color:"var(--text-secondary)",marginBottom:8,display:"block"},children:"Username"}),e.jsx("input",{type:"text",className:"form-input",value:d.username,onChange:j=>h({...d,username:j.target.value}),required:!0,disabled:!!m,style:{width:"100%",padding:"12px 16px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box"},placeholder:"joshua.m"})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",style:{fontSize:"13px",color:"var(--text-secondary)",marginBottom:8,display:"block"},children:"Account Type"}),e.jsx("select",{className:"form-select",value:d.role,onChange:j=>h({...d,role:j.target.value}),style:{width:"100%",padding:"12px 16px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box",appearance:"none"},children:s?e.jsx("option",{value:"Facilitator",children:"Facilitator"}):e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"Coordinator",children:"Coordinator"}),e.jsx("option",{value:"Pastor",children:"Pastor"}),e.jsx("option",{value:"Facilitator",children:"Facilitator"}),e.jsx("option",{value:"TechSupport",children:"Tech Support"}),e.jsx("option",{value:"LeadershipTeam",children:"Leadership Team"}),e.jsx("option",{value:"Admin",children:"Admin"})]})})]})]}),e.jsxs("div",{className:"form-group",children:[e.jsxs("label",{className:"form-label",style:{fontSize:"13px",color:"var(--text-secondary)",marginBottom:8,display:"block"},children:["Password ",m&&e.jsx("span",{style:{opacity:.5},children:"(leave blank to keep current)"})]}),e.jsx("input",{type:"password",className:"form-input",value:d.password,onChange:j=>h({...d,password:j.target.value}),required:!m,style:{width:"100%",padding:"12px 16px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box"},placeholder:"••••••••"})]}),["Pastor","Coordinator","TechSupport","Facilitator"].includes(d.role)&&e.jsxs("div",{className:"form-group",children:[e.jsx("label",{className:"form-label",style:{fontSize:"13px",color:"var(--text-secondary)",marginBottom:8,display:"block"},children:"Assigned Celebration Point"}),e.jsxs("select",{className:"form-select",value:d.celebration_point,onChange:j=>h({...d,celebration_point:j.target.value}),required:!0,style:{width:"100%",padding:"12px 16px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box",appearance:"none"},children:[e.jsx("option",{value:"",children:"Select Celebration Point..."}),Z.map(j=>e.jsx("option",{value:j,children:j},j))]})]}),e.jsx("div",{style:{flex:1}}),e.jsxs("div",{style:{display:"flex",justifyContent:"flex-end",gap:"12px",paddingTop:"24px",borderTop:"var(--border-layer-1)"},children:[e.jsx("button",{type:"button",onClick:x,style:{padding:"10px 20px",borderRadius:10,cursor:"pointer",border:"var(--border-layer-2)",background:"transparent",color:"var(--text-primary)",fontSize:13,fontWeight:500},children:"Cancel"}),e.jsx("button",{type:"submit",className:"btn-primary",style:{padding:"10px 24px",borderRadius:10,fontSize:13,boxShadow:"var(--shadow-layer-2)"},children:m?"Save Changes":"Create Account"})]})]})})]})]})})]})}function qt({logs:t,isOpen:r,onClose:s}){const[b,c]=a.useState(null),[f,p]=a.useState(-1),i=a.useRef(null);if(!r||!(t!=null&&t.length))return null;const o={};t.forEach(n=>{const x=new Date(n.created_at).toLocaleDateString();o[x]||(o[x]=[]),o[x].push(n)});const m=Object.keys(o).sort((n,x)=>new Date(x)-new Date(n)),l=b||m[0],d=o[l]||[],h={LOGIN:"#30d158",LOGOUT:"#64748b",CREATE:"#007aff",UPDATE:"#ffd60a",DELETE:"#ff453a",IMPORT:"#bf5af2",EXPORT:"#06b6d4"},g=n=>{const x=Object.keys(h).find(u=>n==null?void 0:n.toUpperCase().includes(u));return h[x]||"#667eea"};return e.jsxs("div",{className:"tm-overlay",onClick:s,children:[e.jsxs("div",{className:"tm-container",onClick:n=>n.stopPropagation(),children:[e.jsxs("div",{className:"tm-header",children:[e.jsxs("div",{className:"tm-header-left",children:[e.jsx("span",{className:"tm-icon",children:"⏰"}),e.jsx("h3",{children:"Time Machine"})]}),e.jsxs("span",{className:"tm-subtitle",children:[t.length," events · ",m.length," days"]}),e.jsx("button",{className:"tm-close",onClick:s,children:"×"})]}),e.jsx("div",{className:"tm-timeline",ref:i,children:e.jsx("div",{className:"tm-timeline-track",children:m.map((n,x)=>{const u=o[n].length,N=n===l;return e.jsxs("button",{className:`tm-date-marker ${N?"active":""}`,onClick:()=>c(n),title:`${n} — ${u} events`,children:[e.jsx("div",{className:"tm-marker-dot",style:{width:Math.min(12,4+u),height:Math.min(12,4+u)}}),e.jsx("span",{className:"tm-marker-date",children:new Date(n).toLocaleDateString("en-US",{month:"short",day:"numeric"})}),e.jsx("span",{className:"tm-marker-count",children:u})]},n)})})}),e.jsxs("div",{className:"tm-events",children:[e.jsxs("div",{className:"tm-events-header",children:[e.jsx("strong",{children:l}),e.jsxs("span",{children:[d.length," events"]})]}),e.jsx("div",{className:"tm-events-list",children:d.map((n,x)=>e.jsxs("div",{className:`tm-event ${f===x?"tm-event-hover":""}`,onMouseEnter:()=>p(x),onMouseLeave:()=>p(-1),children:[e.jsx("div",{className:"tm-event-time",children:new Date(n.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}),e.jsxs("div",{className:"tm-event-line",children:[e.jsx("div",{className:"tm-event-dot",style:{background:g(n.action)}}),x<d.length-1&&e.jsx("div",{className:"tm-event-connector"})]}),e.jsxs("div",{className:"tm-event-content",children:[e.jsxs("div",{className:"tm-event-action",children:[e.jsx("span",{className:"tm-action-badge",style:{background:g(n.action)+"22",color:g(n.action),borderColor:g(n.action)+"44"},children:n.action}),e.jsx("span",{className:"tm-event-user",children:n.user_name})]}),e.jsx("div",{className:"tm-event-details",children:n.details})]})]},n.id||x))})]})]}),e.jsx("style",{children:`
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
            `})]})}function Jt(){const{user:t,showToast:r}=H(),s=Q(),[b,c]=a.useState([]),[f,p]=a.useState(!0),[i,o]=a.useState(""),[m,l]=a.useState(!1);a.useEffect(()=>{if(t&&t.role!=="Admin"){r("Access denied","error"),s("/dashboard");return}d()},[t,s]);const d=async()=>{p(!0);try{const n=await(await fetch("/api/admin/audit")).json();n.success?c(n.logs):r(n.message||"Failed to fetch logs","error")}catch(g){console.error("Fetch audit logs error:",g),r("Failed to connect to server","error")}finally{p(!1)}},h=b.filter(g=>g.user_name.toLowerCase().includes(i.toLowerCase())||g.details.toLowerCase().includes(i.toLowerCase())||g.action.toLowerCase().includes(i.toLowerCase()));return e.jsxs("div",{className:"tahoe-page",children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"},children:[e.jsx("h1",{style:{fontSize:"24px",fontWeight:"bold"},children:"Audit Logs"}),e.jsxs("div",{style:{display:"flex",gap:"12px"},children:[e.jsx("input",{type:"text",placeholder:"Search logs...",className:"glass-input",value:i,onChange:g=>o(g.target.value),style:{width:"250px"}}),e.jsx("button",{className:"btn-secondary",onClick:()=>l(!0),style:{background:"linear-gradient(135deg, #667eea, #764ba2)",color:"white",border:"none"},children:"⏰ Time Machine"}),e.jsx("button",{className:"btn-secondary",onClick:d,children:"🔄 Refresh"})]})]}),e.jsx("div",{className:"glass-card",style:{padding:"0",overflow:"hidden"},children:f?e.jsxs("div",{className:"loading-container",children:[e.jsx("div",{className:"spinner"}),e.jsx("p",{children:"Loading audit trail..."})]}):e.jsx("div",{className:"table-container table-responsive",style:{maxHeight:"calc(100vh - 250px)",overflowY:"auto"},children:e.jsxs("table",{className:"data-table",children:[e.jsx("thead",{style:{position:"sticky",top:0,background:"var(--card-bg)",zIndex:10},children:e.jsxs("tr",{children:[e.jsx("th",{children:"Timestamp"}),e.jsx("th",{children:"User"}),e.jsx("th",{children:"Role"}),e.jsx("th",{children:"Action"}),e.jsx("th",{children:"Details"})]})}),e.jsx("tbody",{children:h.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:"5",style:{textAlign:"center",padding:"32px",color:"var(--text-secondary)"},children:"No logs found."})}):h.map(g=>e.jsxs("tr",{children:[e.jsx("td",{style:{fontSize:"13px",color:"var(--text-secondary)"},children:new Date(g.created_at).toLocaleString()}),e.jsx("td",{children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[e.jsx("div",{style:{width:"24px",height:"24px",borderRadius:"50%",background:"var(--accent-gradient)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"bold",color:"white"},children:g.user_name.charAt(0)}),g.user_name]})}),e.jsx("td",{children:e.jsx("span",{className:"status-badge",style:{background:g.role==="Admin"?"rgba(255, 59, 48, 0.2)":"rgba(10, 132, 255, 0.2)",color:g.role==="Admin"?"var(--error)":"var(--info)"},children:g.role})}),e.jsx("td",{style:{fontWeight:"600"},children:g.action}),e.jsx("td",{style:{color:"var(--text-secondary)"},children:g.details})]},g.id))})]})})}),e.jsx(qt,{logs:h,isOpen:m,onClose:()=>l(!1)})]})}function Kt(){const{user:t,showToast:r}=H(),s=Q(),[b,c]=a.useState(!1),[f,p]=a.useState(["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)?"":t==null?void 0:t.celebration_point);a.useEffect(()=>{t&&t.role==="Coordinator"&&(r("Access denied","error"),s("/dashboard"))},[t,s]);const i=async o=>{c(!0);try{const m=new URLSearchParams;f&&m.append("celebration_point",f);const d=await(await fetch(`/api/data/students?${m}`)).json();if(!d.success)throw new Error(d.message);const h=d.students,g=d.stats,n=new yt,x=n.internal.pageSize.getWidth();n.setFontSize(22),n.setTextColor(99,102,241),n.text(`${o} Report`,x/2,20,{align:"center"}),n.setFontSize(14),n.setTextColor(60,60,60),n.text(`Location: ${f||"All Locations"}`,x/2,30,{align:"center"}),n.text(`Date: ${new Date().toLocaleDateString()}`,x/2,38,{align:"center"});let u=50;n.setFontSize(16),n.setTextColor(0,0,0),n.text("Executive Summary",20,u),u+=10,n.setFontSize(11),n.setTextColor(60,60,60),n.text(`Total Students: ${g.totalStudents}`,20,u),n.text(`Course Completion: ${Math.round(g.completedCourses/(g.totalStudents||1)*100)}%`,100,u),u+=8,n.text(`Active Students: ${g.activeCourses}`,20,u),n.text(`Average Progress: ${g.averageProgress}%`,100,u),u+=15,n.setFontSize(16),n.setTextColor(0,0,0),n.text("Engagement & Risks",20,u),u+=10;const N=h.filter(j=>j.alertLevel==="red").length,C=h.filter(j=>j.alertLevel==="yellow").length;if(n.setFontSize(11),n.setTextColor(60,60,60),n.text(`High Risk (Inactive > 30d): ${N} students`,20,u),u+=8,n.text(`Moderate Risk (Inactive > 14d): ${C} students`,20,u),u+=15,o==="Risk Assessment"){n.setFontSize(16),n.setTextColor(0,0,0),n.text("At-Risk Students",20,u),u+=10;const j=h.filter(k=>k.alertLevel==="red"||k.alertLevel==="yellow");j.forEach(k=>{u>270&&(n.addPage(),u=20),n.setFontSize(10),n.text(`• ${k.name} (${k.daysInactive} days inactive) - ${k.course}`,20,u),u+=6}),j.length===0&&n.text("No at-risk students found.",20,u)}else n.setFontSize(16),n.setTextColor(0,0,0),n.text("Course Performance",20,u),u+=10,n.setFontSize(10),n.text("Detailed course breakdown available in Dashboard view.",20,u);n.save(`${o.replace(/\s+/g,"_")}_${new Date().toISOString().split("T")[0]}.pdf`),r("Report generated successfully","success")}catch(m){console.error("Report error:",m),r("Failed to generate report","error")}finally{c(!1)}};return e.jsxs("div",{className:"tahoe-page",children:[e.jsxs("div",{style:{marginBottom:"24px"},children:[e.jsx("h1",{style:{fontSize:"24px",fontWeight:"bold"},children:"Reports Center"}),e.jsx("p",{style:{color:"var(--text-secondary)"},children:"Generate and export detailed performance reports."})]}),["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)&&e.jsxs("div",{style:{marginBottom:"24px"},children:[e.jsx("label",{style:{marginRight:"12px",fontSize:"14px"},children:"Select Location:"}),e.jsxs("select",{className:"filter-select",value:f,onChange:o=>p(o.target.value),style:{minWidth:"250px"},children:[["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)&&e.jsx("option",{value:"",children:"All Locations"}),Z.map(o=>e.jsx("option",{value:o,children:o},o))]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",gap:"24px"},children:[e.jsx("div",{className:"glass-card",children:e.jsxs("div",{style:{padding:"24px"},children:[e.jsx("div",{style:{fontSize:"48px",marginBottom:"16px"},children:"📊"}),e.jsx("h3",{style:{fontSize:"18px",marginBottom:"8px"},children:"Monthly Overview"}),e.jsx("p",{style:{color:"var(--text-secondary)",fontSize:"14px",marginBottom:"24px"},children:"Comprehensive summary of student enrollment, course completion rates, and overall progress for the selected location."}),e.jsx("button",{className:"btn-primary",style:{width:"100%"},onClick:()=>i("Monthly Overview"),disabled:b,children:b?"Generating...":"Download PDF"})]})}),e.jsx("div",{className:"glass-card",children:e.jsxs("div",{style:{padding:"24px"},children:[e.jsx("div",{style:{fontSize:"48px",marginBottom:"16px"},children:"⚠️"}),e.jsx("h3",{style:{fontSize:"18px",marginBottom:"8px"},children:"Risk Assessment"}),e.jsx("p",{style:{color:"var(--text-secondary)",fontSize:"14px",marginBottom:"24px"},children:"Detailed list of inactive students and engagement risks to prioritize pastoral follow-up and intervention."}),e.jsx("button",{className:"btn-secondary",style:{width:"100%"},onClick:()=>i("Risk Assessment"),disabled:b,children:b?"Generating...":"Download PDF"})]})}),e.jsx("div",{className:"glass-card",style:{opacity:.7},children:e.jsxs("div",{style:{padding:"24px"},children:[e.jsx("div",{style:{fontSize:"48px",marginBottom:"16px"},children:"👥"}),e.jsx("h3",{style:{fontSize:"18px",marginBottom:"8px"},children:"Coordinator Performance"}),e.jsx("p",{style:{color:"var(--text-secondary)",fontSize:"14px",marginBottom:"24px"},children:"analysis of coordinator engagement and student success rates by location."}),e.jsx("button",{className:"btn-secondary",style:{width:"100%"},disabled:!0,children:"Coming Soon"})]})})]})]})}function Vt(){const{user:t,showToast:r}=H(),[s,b]=a.useState(null),[c,f]=a.useState(!1),[p,i]=a.useState(!1),[o,m]=a.useState(null),[l,d]=a.useState(null),h=a.useRef(null),g=v=>{const R=v.split(/\r?\n/).filter(w=>w.trim());if(R.length<2)return[];const O=w=>{const W=[];let A="",L=!1;for(let $=0;$<w.length;$++){const Y=w[$];Y==='"'?L&&w[$+1]==='"'?(A+='"',$++):L=!L:Y===","&&!L?(W.push(A.trim()),A=""):A+=Y}return W.push(A.trim()),W},B=O(R[0]).map(w=>w.trim().replace(/^"|"$/g,"").toLowerCase()),M={firstname:"firstName","first name":"firstName",lastname:"lastName","last name":"lastName",email:"email","email address":"email",celebrationpoint:"celebrationPoint","celebration point":"celebrationPoint",campus:"celebrationPoint",company:"celebrationPoint","course id":"courseId",courseid:"courseId"},G=B.map(w=>M[w]||w);return R.slice(1).map(w=>{const W=O(w),A={};return G.forEach((L,$)=>{A[L]=W[$]?W[$].replace(/^"|"$/g,""):""}),A}).filter(w=>w.email)},n=v=>{const R=v.target.files[0];R&&(b(R),m(null),d(null))},[x,u]=a.useState("ALL"),N=async()=>{if(s){f(!0);try{const v=await s.text(),R=g(v);if(R.length===0){r("No valid users found in CSV","error"),f(!1);return}const z=await(await fetch("/api/import/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({users:R})})).json();if(z.success){m(z.analysis);const B=z.analysis.some(M=>M.status==="NEW");u(B?"NEW":"ALL")}else r(z.message||"Analysis failed","error")}catch(v){console.error(v),r("Failed to analyze file","error")}finally{f(!1)}}},[C,j]=a.useState(0),k=async v=>{if(!o)return;const R=o.filter(O=>(v==="ALL"||O.status===v)&&O.action);if(R.length===0){r("No users to process for this action","info");return}if(confirm(`Are you sure you want to process ${R.length} users? This might take a while.`)){i(!0),j(0);try{const z=await(await fetch("/api/import/execute",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({operations:R})})).json();if(z.success&&z.jobId){const B=z.jobId;r("Import job started","info");const M=setInterval(async()=>{try{const w=await(await fetch(`/api/import/status/${B}`)).json();w.success&&(j(w.progress),w.status==="completed"?(clearInterval(M),d(w.result),r("Processed all users","success"),i(!1)):w.status==="failed"&&(clearInterval(M),r(`Job failed: ${w.error}`,"error"),i(!1)))}catch(G){console.error("Polling error",G)}},1e3)}else r("Execution failed to start","error"),i(!1)}catch{r("Failed to execute operations","error"),i(!1)}}},y=(v,R)=>{if(!v||v.length===0)return;const O=Object.keys(v[0]),z=[O.join(","),...v.map(w=>O.map(W=>JSON.stringify(w[W])).join(","))].join(`
`),B=new Blob([z],{type:"text/csv;charset=utf-8;"}),M=URL.createObjectURL(B),G=document.createElement("a");G.href=M,G.download=R,G.click()},_=o?{new:o.filter(v=>v.status==="NEW").length,unenrolled:o.filter(v=>v.status==="UNENROLLED").length,missing:o.filter(v=>v.status==="MISSING_INFO").length,enrolled:o.filter(v=>v.status==="ENROLLED").length}:null,E=o?o.filter(v=>x==="ALL"||v.status===x):[];return(t==null?void 0:t.role)!=="Admin"?e.jsxs("div",{className:"tahoe-page tahoe-finder-window",children:[e.jsx("h1",{className:"page-title",children:"Batch Import Tool"}),e.jsxs("div",{className:"portal-main glass-card",style:{padding:"60px 24px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:"20px"},children:[e.jsx("span",{style:{fontSize:"64px"},children:"🚫"}),e.jsx("h2",{style:{color:"var(--text-primary)",margin:0},children:"Access Denied"}),e.jsx("p",{style:{color:"var(--text-secondary)",maxWidth:"400px",margin:0},children:"This tool is restricted to System Administrators only. Please contact your IT department if you believe this is an error."}),e.jsx("button",{className:"btn-secondary",onClick:()=>window.history.back(),style:{marginTop:"12px"},children:"Go Back"})]})]}):e.jsxs("div",{className:"tahoe-page tahoe-finder-window",children:[e.jsx("h1",{className:"page-title",children:"Batch Import Tool"}),e.jsxs("div",{className:"portal-main glass-card",style:{padding:"24px",display:"flex",flexDirection:"column",gap:"24px"},children:[!o&&!l&&e.jsxs("div",{style:{border:"2px dashed rgba(255,255,255,0.2)",borderRadius:"12px",padding:"40px",textAlign:"center",cursor:"pointer",background:"rgba(0,0,0,0.1)"},onClick:()=>h.current.click(),children:[e.jsx("span",{style:{fontSize:"48px",display:"block",marginBottom:"16px"},children:"📂"}),e.jsx("h3",{style:{margin:"0 0 8px 0",color:"#fff"},children:"Upload CSV File"}),e.jsxs("p",{style:{color:"#94a3b8",fontSize:"14px",margin:0},children:["Drag and drop or click to browse",e.jsx("br",{}),"Headers: First Name, Last Name, Email, Celebration Point, Course ID"]}),e.jsx("input",{type:"file",accept:".csv",ref:h,style:{display:"none"},onChange:n}),s&&e.jsxs("div",{style:{marginTop:"20px",display:"inline-block",background:"rgba(16, 185, 129, 0.2)",padding:"8px 16px",borderRadius:"8px",color:"#6ee7b7"},children:["✅ ",s.name]}),s&&e.jsx("div",{style:{marginTop:"20px"},children:e.jsx("button",{className:"btn-primary",onClick:v=>{v.stopPropagation(),N()},disabled:c,children:c?"Analyzing...":"Analyze File"})})]}),o&&!l&&e.jsxs("div",{className:"fade-in",children:[e.jsxs("div",{style:{display:"flex",gap:"20px",marginBottom:"20px"},children:[e.jsxs("div",{className:`stat-card ${x==="NEW"?"active":""}`,onClick:()=>u("NEW"),style:{flex:1,background:"rgba(59, 130, 246, 0.2)",padding:"16px",borderRadius:"12px",cursor:"pointer",border:x==="NEW"?"2px solid #3b82f6":"2px solid transparent"},children:[e.jsx("div",{style:{fontSize:"12px",color:"#93c5fd"},children:"New Students"}),e.jsx("div",{style:{fontSize:"24px",fontWeight:600,color:"#fff"},children:_.new}),e.jsx("div",{style:{fontSize:"11px",color:"rgba(255,255,255,0.6)",marginTop:"4px"},children:"Click to review"})]}),e.jsxs("div",{className:`stat-card ${x==="UNENROLLED"?"active":""}`,onClick:()=>u("UNENROLLED"),style:{flex:1,background:"rgba(16, 185, 129, 0.2)",padding:"16px",borderRadius:"12px",cursor:"pointer",border:x==="UNENROLLED"?"2px solid #10b981":"2px solid transparent"},children:[e.jsx("div",{style:{fontSize:"12px",color:"#6ee7b7"},children:"Unenrolled"}),e.jsx("div",{style:{fontSize:"24px",fontWeight:600,color:"#fff"},children:_.unenrolled}),e.jsx("div",{style:{fontSize:"11px",color:"rgba(255,255,255,0.6)",marginTop:"4px"},children:"Click to review"})]}),e.jsxs("div",{className:`stat-card ${x==="MISSING_INFO"?"active":""}`,onClick:()=>u("MISSING_INFO"),style:{flex:1,background:"rgba(245, 158, 11, 0.2)",padding:"16px",borderRadius:"12px",cursor:"pointer",border:x==="MISSING_INFO"?"2px solid #f59e0b":"2px solid transparent"},children:[e.jsx("div",{style:{fontSize:"12px",color:"#fcd34d"},children:"Missing Info"}),e.jsx("div",{style:{fontSize:"24px",fontWeight:600,color:"#fff"},children:_.missing}),e.jsx("div",{style:{fontSize:"11px",color:"rgba(255,255,255,0.6)",marginTop:"4px"},children:"Click to review"})]}),e.jsxs("div",{className:`stat-card ${x==="ALL"?"active":""}`,onClick:()=>u("ALL"),style:{flex:1,background:"rgba(255, 255, 255, 0.05)",padding:"16px",borderRadius:"12px",cursor:"pointer",border:x==="ALL"?"2px solid rgba(255,255,255,0.3)":"2px solid transparent"},children:[e.jsx("div",{style:{fontSize:"12px",color:"#94a3b8"},children:"All Rows"}),e.jsx("div",{style:{fontSize:"24px",fontWeight:600,color:"#fff"},children:o.length}),e.jsx("div",{style:{fontSize:"11px",color:"rgba(255,255,255,0.6)",marginTop:"4px"},children:"Show everything"})]})]}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("button",{className:"btn-secondary",onClick:()=>m(null),children:"← Upload New File"}),e.jsxs("span",{style:{fontSize:"14px",color:"#94a3b8"},children:["Showing: ",e.jsx("b",{style:{color:"#fff"},children:x==="ALL"?"All Rows":x})," (",E.length,")"]})]}),e.jsxs("div",{style:{display:"flex",gap:"12px"},children:[x==="NEW"&&_.new>0&&e.jsxs("button",{className:"btn-primary",onClick:()=>k("NEW"),style:{background:"#3b82f6"},children:["Create & Enroll ",_.new," Students"]}),x==="UNENROLLED"&&_.unenrolled>0&&e.jsxs("button",{className:"btn-primary",onClick:()=>k("UNENROLLED"),style:{background:"#10b981"},children:["Enroll ",_.unenrolled," Existing Users"]}),x==="MISSING_INFO"&&_.missing>0&&e.jsxs("button",{className:"btn-primary",onClick:()=>k("MISSING_INFO"),style:{background:"#f59e0b"},children:["fix & Enroll ",_.missing," Users"]}),x==="ALL"&&_.new+_.unenrolled+_.missing>0&&e.jsxs("button",{className:"btn-primary",onClick:()=>k("ALL"),style:{background:"#8b5cf6"},children:["Process All Actions (",_.new+_.unenrolled+_.missing,")"]})]})]}),e.jsx("div",{className:"table-container table-responsive",style:{maxHeight:"400px",overflowY:"auto",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px"},children:e.jsxs("table",{className:"tahoe-table",style:{width:"100%",minWidth:"600px"},children:[e.jsx("thead",{style:{position:"sticky",top:0,background:"rgba(30,41,59,0.95)"},children:e.jsxs("tr",{children:[e.jsx("th",{style:{padding:"12px",textAlign:"left"},children:"Name"}),e.jsx("th",{style:{padding:"12px",textAlign:"left"},children:"Email"}),e.jsx("th",{style:{padding:"12px",textAlign:"left"},children:"Celebration Point"}),e.jsx("th",{style:{padding:"12px",textAlign:"left"},children:"Course ID"}),e.jsx("th",{style:{padding:"12px",textAlign:"left"},children:"Status"}),e.jsx("th",{style:{padding:"12px",textAlign:"left"},children:"Proposed Action"})]})}),e.jsx("tbody",{children:E.length>0?E.map((v,R)=>e.jsxs("tr",{style:{borderBottom:"1px solid rgba(255,255,255,0.05)"},children:[e.jsxs("td",{style:{padding:"12px"},children:[v.firstName," ",v.lastName]}),e.jsx("td",{style:{padding:"12px",color:"#94a3b8"},children:v.email}),e.jsx("td",{style:{padding:"12px",color:"#94a3b8"},children:v.celebrationPoint}),e.jsx("td",{style:{padding:"12px",color:"#94a3b8"},children:v.courseId||"Default"}),e.jsx("td",{style:{padding:"12px"},children:e.jsx("span",{className:"status-badge",style:{padding:"2px 8px",borderRadius:"4px",fontSize:"10px",background:v.status==="NEW"?"rgba(59, 130, 246, 0.2)":v.status==="UNENROLLED"?"rgba(16, 185, 129, 0.2)":v.status==="MISSING_INFO"?"rgba(245, 158, 11, 0.2)":"rgba(255,255,255,0.05)",color:v.status==="NEW"?"#93c5fd":v.status==="UNENROLLED"?"#6ee7b7":v.status==="MISSING_INFO"?"#fcd34d":"#94a3b8"},children:v.status})}),e.jsx("td",{style:{padding:"12px",fontSize:"11px",color:"#94a3b8"},children:v.action||"-"})]},R)):e.jsx("tr",{children:e.jsxs("td",{colSpan:"5",style:{padding:"40px",textAlign:"center",color:"#64748b"},children:["No users found with status: ",x]})})})]})})]}),l&&e.jsxs("div",{className:"fade-in",children:[e.jsxs("div",{style:{textAlign:"center",marginBottom:"24px"},children:[e.jsx("div",{style:{fontSize:"48px",marginBottom:"16px"},children:"🎉"}),e.jsx("h2",{style:{color:"#fff"},children:"Processing Complete"}),e.jsxs("p",{style:{color:"#94a3b8"},children:["Successfully processed ",l.filter(v=>v.success).length," users.",e.jsx("br",{}),"Failed: ",l.filter(v=>!v.success).length]})]}),e.jsxs("div",{style:{display:"flex",gap:"12px",justifyContent:"center",marginBottom:"24px"},children:[e.jsx("button",{className:"btn-secondary",onClick:()=>y(l,"import_results.csv"),children:"Download Report"}),e.jsx("button",{className:"btn-primary",onClick:()=>{d(null),m(null),b(null)},children:"Start Over"})]}),l.some(v=>!v.success)&&e.jsxs("div",{style:{background:"rgba(239, 68, 68, 0.1)",padding:"16px",borderRadius:"12px"},children:[e.jsx("h4",{style:{margin:"0 0 12px 0",color:"#fca5a5"},children:"Errors"}),e.jsx("ul",{style:{margin:0,paddingLeft:"20px",color:"#fca5a5",fontSize:"13px"},children:l.filter(v=>!v.success).map((v,R)=>e.jsxs("li",{children:[v.email,": ",v.message]},R))})]})]}),p&&e.jsxs("div",{style:{position:"absolute",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:"16px",zIndex:50},children:[e.jsx("div",{className:"spinner",style:{marginBottom:"16px"}}),e.jsx("div",{style:{color:"#fff",marginBottom:"8px"},children:"Processing... please wait"}),e.jsx("div",{style:{width:"200px",height:"6px",background:"rgba(255,255,255,0.2)",borderRadius:"3px",overflow:"hidden"},children:e.jsx("div",{style:{width:`${C}%`,height:"100%",background:"#3b82f6",transition:"width 0.3s ease"}})}),e.jsxs("div",{style:{color:"#94a3b8",fontSize:"12px",marginTop:"4px"},children:[C,"%"]})]})]})]})}function Qt(){const{user:t,showToast:r}=H(),[s,b]=a.useState([]),[c,f]=a.useState(!0),[p,i]=a.useState(null),[o,m]=a.useState(null),[l,d]=a.useState(!1),[h,g]=a.useState(["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)?"":t==null?void 0:t.celebration_point),[n,x]=a.useState(!1),[u,N]=a.useState(!1),[C,j]=a.useState(!1),[k,y]=a.useState([]),[_,E]=a.useState({name:"",celebration_point:"",facilitator_user_id:"",cohort:""}),[v,R]=a.useState({name:"",celebration_point:"",facilitator_user_id:"",cohort:"2025"}),[O,z]=a.useState(""),[B,M]=a.useState([]),[G,w]=a.useState(""),[W,A]=a.useState([]),[L,$]=a.useState(""),Y=["Admin","LeadershipTeam"].includes(t==null?void 0:t.role),K=["Admin","Coordinator"].includes(t==null?void 0:t.role),F=["Admin","Coordinator"].includes(t==null?void 0:t.role);a.useEffect(()=>{I()},[h]);const I=async()=>{f(!0);try{const S=new URLSearchParams;h&&S.append("celebration_point",h);const D=await(await fetch(`/api/formation-groups?${S}`)).json();D.success?b(D.groups):r(D.message,"error")}catch{r("Failed to load groups","error")}f(!1)},U=async S=>{d(!0);try{const D=await(await fetch(`/api/formation-groups/${S}`)).json();D.success&&(m(D),i(S),oe(S))}catch{r("Failed to load group details","error")}d(!1)},oe=async S=>{try{const D=await(await fetch(`/api/data/notes/group/${S}`)).json();D.success&&A(D.notes||[])}catch{}},ne=async()=>{var S;if(L.trim())try{const D=await(await fetch("/api/data/notes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({groupId:p,content:L,celebrationPoint:(S=o==null?void 0:o.group)==null?void 0:S.celebration_point})})).json();D.success?(r("Comment added","success"),$(""),oe(p)):r(D.message,"error")}catch{r("Failed to add comment","error")}},Ae=async()=>{try{const P=await(await fetch("/api/formation-groups/facilitators/available")).json();P.success&&y(P.facilitators)}catch{}},je={Bbira:"WBB",Bugolobi:"WBG",Bweyogerere:"WBW",Downtown:"WDT",Entebbe:"WEN",Nakwero:"WGN",Gulu:"WGU",Jinja:"WJJ",Juba:"WJB",Kansanga:"WKA",Kyengera:"WKY",Laminadera:"WLM",Lubowa:"WLB",Mbarara:"WMB",Mukono:"WMK",Nansana:"WNW",Ntinda:"WNT",Online:"WON",Suubi:"WSU"},Ve=async S=>{if(S.preventDefault(),!v.name||!v.celebration_point){r("Name and Celebration Point required","error");return}let P=null;v.codeSuffix&&(P=`${je[v.celebration_point]||"WXX"}${v.codeSuffix.padStart(3,"0")}`);try{const D={...v,group_code:P},q=await(await fetch("/api/formation-groups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(D)})).json();q.success?(r(`Group ${q.group_code} created!`,"success"),x(!1),R({name:"",celebration_point:"",facilitator_user_id:"",cohort:"2025",codeSuffix:""}),I()):r(q.message,"error")}catch{r("Failed to create group","error")}};a.useEffect(()=>{n&&R(S=>({...S,codeSuffix:""}))},[n]);const Qe=async S=>{var P;if(w(S),S.length<2){M([]);return}try{const D=new URLSearchParams({search:S,limit:10,type:"enrolled"});(P=o==null?void 0:o.group)!=null&&P.celebration_point&&D.append("celebration_point",o.group.celebration_point);const q=await(await fetch(`/api/data/users?${D}`)).json();q.success&&M(q.users||[])}catch{}},Xe=async S=>{try{const D=await(await fetch(`/api/formation-groups/${p}/members`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({student_id:String(S.id||S),student_name:S.first_name?(S.first_name+" "+S.last_name).trim():S.name||"",student_email:S.email||""})})).json();D.success?(r("Member added","success"),U(p),w(""),M([])):r(D.message,"error")}catch{r("Failed to add member","error")}},Ze=async S=>{if(confirm("Remove this student from the group?"))try{const D=await(await fetch(`/api/formation-groups/${p}/members/${S}`,{method:"DELETE"})).json();D.success?(r("Member removed","success"),U(p)):r(D.message,"error")}catch{r("Failed to remove member","error")}},et=()=>{const S=o==null?void 0:o.group;S&&(E({name:S.name||"",celebration_point:S.celebration_point||"",facilitator_user_id:S.facilitator_user_id||"",cohort:S.cohort||"2025"}),Ae(),j(!0))},tt=async S=>{S.preventDefault();try{const D=await(await fetch(`/api/formation-groups/${p}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(_)})).json();D.success?(r("Group updated","success"),j(!1),U(p),I()):r(D.message,"error")}catch{r("Failed to update group","error")}},rt=async()=>{if(confirm("Are you sure you want to deactivate this group? It will be hidden from the group list."))try{const P=await(await fetch(`/api/formation-groups/${p}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:0})})).json();P.success?(r("Group deactivated","success"),i(null),m(null),I()):r(P.message,"error")}catch{r("Failed to deactivate group","error")}};if(p&&o){const{group:S,members:P,reports:D}=o;return e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:1e3,margin:"0 auto"},children:[e.jsx("button",{onClick:()=>{i(null),m(null)},style:{background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:6,fontWeight:500,transition:"color 0.2s"},onMouseEnter:T=>T.target.style.color="var(--text-primary)",onMouseLeave:T=>T.target.style.color="var(--text-secondary)",children:"← Back to Groups"}),e.jsx("div",{style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:20,padding:32,marginBottom:24,boxShadow:"var(--shadow-layer-3)"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[e.jsxs("div",{children:[e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)",marginBottom:8,fontWeight:500,display:"flex",gap:8},children:[e.jsx("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:S.group_code}),e.jsx("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:S.celebration_point}),e.jsxs("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:["Cohort ",S.cohort]})]}),e.jsx("h2",{style:{margin:0,fontSize:28,color:"var(--text-primary)",fontWeight:700,letterSpacing:"-0.01em"},children:S.name}),e.jsxs("div",{style:{fontSize:15,color:"var(--text-secondary)",marginTop:8},children:["Facilitator: ",e.jsx("strong",{style:{color:"var(--text-primary)"},children:S.facilitator_name||"Unassigned"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12,alignItems:"center"},children:[K&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:et,style:{padding:"8px 16px",borderRadius:10,border:"var(--border-layer-2)",background:"var(--glass-layer-3)",color:"var(--text-primary)",cursor:"pointer",fontSize:13,fontWeight:600,transition:"background 0.2s",boxShadow:"var(--shadow-layer-1)"},children:"✏️ Edit"}),e.jsx("button",{onClick:rt,style:{padding:"8px 16px",borderRadius:10,border:"1px solid rgba(255,59,48,0.2)",background:"rgba(255,59,48,0.1)",color:"#ff3b30",cursor:"pointer",fontSize:13,fontWeight:600,transition:"background 0.2s"},children:"Deactivate"})]}),e.jsxs("div",{style:{background:"linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)",borderRadius:16,padding:"12px 24px",textAlign:"center",color:"white",boxShadow:"var(--shadow-layer-3)"},children:[e.jsx("div",{style:{fontSize:24,fontWeight:800},children:P.length}),e.jsx("div",{style:{fontSize:12,opacity:.9,fontWeight:600},children:"Members"})]})]})]})}),C&&e.jsx("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e4,backdropFilter:"blur(5px)"},onClick:()=>j(!1),children:e.jsxs("div",{style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:24,padding:32,width:480,maxWidth:"90vw",boxShadow:"var(--shadow-layer-4)"},onClick:T=>T.stopPropagation(),children:[e.jsxs("h3",{style:{margin:"0 0 24px",fontSize:20,color:"var(--text-primary)",fontWeight:600},children:["Edit Group — ",S.group_code]}),e.jsxs("form",{onSubmit:tt,children:[e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:ee,children:"Group Name"}),e.jsx("input",{type:"text",value:_.name,onChange:T=>E({..._,name:T.target.value}),required:!0,style:te})]}),e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:ee,children:"Facilitator"}),e.jsxs("select",{value:_.facilitator_user_id,onChange:T=>E({..._,facilitator_user_id:T.target.value}),style:te,children:[e.jsx("option",{value:"",children:"Unassigned"}),k.filter(T=>!_.celebration_point||T.celebration_point===_.celebration_point).map(T=>e.jsxs("option",{value:T.id,children:[T.name," (",T.celebration_point,")"]},T.id))]})]}),e.jsxs("div",{style:{marginBottom:24},children:[e.jsx("label",{style:ee,children:"Cohort"}),e.jsx("input",{type:"text",value:_.cohort,onChange:T=>E({..._,cohort:T.target.value}),style:te})]}),e.jsxs("div",{style:{display:"flex",gap:12,justifyContent:"flex-end"},children:[e.jsx("button",{type:"button",onClick:()=>j(!1),style:{padding:"10px 18px",borderRadius:10,border:"var(--border-layer-2)",background:"transparent",color:"var(--text-primary)",cursor:"pointer",fontSize:13,fontWeight:500},children:"Cancel"}),e.jsx("button",{type:"submit",style:{padding:"10px 24px",borderRadius:10,border:"none",cursor:"pointer",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",color:"white",fontWeight:600,fontSize:13,boxShadow:"var(--shadow-layer-2)"},children:"Save Changes"})]})]})]})}),F&&e.jsxs("div",{style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:16,padding:20,marginBottom:20,boxShadow:"var(--shadow-layer-2)"},children:[e.jsx("div",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)",marginBottom:12},children:"Add Student to Group"}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx("span",{style:{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",opacity:.5,color:"var(--text-secondary)"},children:"🔍"}),e.jsx("input",{type:"text",placeholder:"Search by name or email...",value:G,onChange:T=>Qe(T.target.value),style:{width:"100%",padding:"12px 14px 12px 36px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box",transition:"background 0.2s"},onFocus:T=>T.target.style.background="var(--glass-layer-3)",onBlur:T=>T.target.style.background="var(--glass-layer-1)"})]}),B.length>0&&e.jsx("div",{style:{marginTop:12,maxHeight:240,overflowY:"auto",borderRadius:10,border:"var(--border-layer-2)",background:"var(--glass-layer-1)"},children:B.map(T=>e.jsxs("div",{style:{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"var(--border-layer-1)",cursor:"pointer",transition:"background 0.1s"},onClick:()=>Xe(T),onMouseEnter:q=>q.currentTarget.style.background="var(--glass-layer-2)",onMouseLeave:q=>q.currentTarget.style.background="transparent",children:[e.jsxs("div",{children:[e.jsxs("div",{style:{fontSize:14,fontWeight:500,color:"var(--text-primary)"},children:[T.first_name," ",T.last_name]}),e.jsx("div",{style:{fontSize:12,color:"var(--text-secondary)"},children:T.email})]}),e.jsx("button",{className:"btn-primary",style:{padding:"4px 12px",fontSize:12},children:"+ Add"})]},T.id))})]}),e.jsxs("div",{style:{background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:12,overflow:"hidden"},children:[e.jsxs("div",{style:{padding:"12px 16px",borderBottom:"1px solid var(--glass-border)",fontSize:13,fontWeight:600,color:"var(--text-primary)"},children:["Members (",P.length,")"]}),P.length===0?e.jsxs("div",{style:{padding:40,textAlign:"center",color:"var(--text-secondary)",fontSize:14},children:["No members yet. ",F&&"Use the search above to add students."]}):e.jsx("div",{className:"table-responsive",children:e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:"400px"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{borderBottom:"1px solid var(--glass-border)"},children:[e.jsx("th",{style:we,children:"Member"}),e.jsx("th",{style:we,children:"Joined"}),F&&e.jsx("th",{style:we,children:"Actions"})]})}),e.jsx("tbody",{children:P.map(T=>e.jsxs("tr",{style:{borderBottom:"1px solid rgba(255,255,255,0.03)"},children:[e.jsx("td",{style:Se,children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx("div",{style:{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#4A9EFF,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0},children:(T.student_name||String(T.student_id)).charAt(0).toUpperCase()}),e.jsx("span",{style:{fontSize:14},children:T.student_name||T.student_id})]})}),e.jsx("td",{style:Se,children:new Date(T.joined_at).toLocaleDateString()}),F&&e.jsx("td",{style:Se,children:e.jsx("button",{onClick:()=>Ze(T.student_id),style:{background:"rgba(255,59,48,0.15)",border:"none",color:"#ff3b30",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:12},children:"Remove"})})]},T.membership_id))})]})})]}),e.jsxs("div",{style:{background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:12,overflow:"hidden",marginTop:20},children:[e.jsxs("div",{style:{padding:"12px 16px",borderBottom:"1px solid var(--glass-border)",fontSize:13,fontWeight:600,color:"var(--text-primary)"},children:["📝 Weekly Reports (",(D||[]).length,")"]}),!D||D.length===0?e.jsx("div",{style:{padding:40,textAlign:"center",color:"var(--text-secondary)",fontSize:14},children:"No weekly reports submitted yet."}):e.jsx("div",{style:{padding:12},children:D.map(T=>{const q={high:"#00b894",medium:"#fdcb6e",low:"#ff7675"};return e.jsxs("div",{style:{padding:14,marginBottom:8,borderRadius:10,border:"1px solid var(--glass-border)",background:"rgba(255,255,255,0.02)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[e.jsxs("span",{style:{fontSize:14,fontWeight:700,color:"var(--text-primary)"},children:["Week ",T.week_number]}),e.jsx("span",{style:{fontSize:11,padding:"2px 8px",borderRadius:10,fontWeight:600,background:`${q[T.engagement_level]||"#999"}22`,color:q[T.engagement_level]||"#999",border:`1px solid ${q[T.engagement_level]||"#999"}44`,textTransform:"capitalize"},children:T.engagement_level||"N/A"})]}),e.jsx("div",{style:{fontSize:11,color:"var(--text-secondary)"},children:T.submitted_at?new Date(T.submitted_at).toLocaleDateString():"Unknown"})]}),e.jsxs("div",{style:{display:"flex",gap:16,fontSize:12,color:"var(--text-secondary)"},children:[e.jsxs("span",{children:["👥 Attendance: ",e.jsx("strong",{style:{color:"var(--text-primary)"},children:T.attendance_count||"—"})]}),e.jsxs("span",{children:["📊 By: ",T.facilitator_name||"Unknown"]})]}),T.formation_evidence&&e.jsxs("div",{style:{marginTop:8,fontSize:12,color:"var(--text-secondary)",padding:"6px 10px",borderRadius:6,background:"rgba(0,184,148,0.08)",borderLeft:"3px solid #00b894"},children:[e.jsx("strong",{style:{color:"#00b894"},children:"Formation Evidence:"})," ",T.formation_evidence.length>120?T.formation_evidence.slice(0,120)+"…":T.formation_evidence]}),T.pastoral_concerns&&e.jsxs("div",{style:{marginTop:6,fontSize:12,color:"var(--text-secondary)",padding:"6px 10px",borderRadius:6,background:"rgba(255, 118, 117, 0.08)",borderLeft:"3px solid #ff7675"},children:[e.jsx("strong",{style:{color:"#ff7675"},children:"Pastoral Concerns:"})," ",T.pastoral_concerns.length>120?T.pastoral_concerns.slice(0,120)+"…":T.pastoral_concerns]})]},T.id)})})]}),e.jsxs("div",{style:{background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:12,overflow:"hidden",marginTop:20},children:[e.jsxs("div",{style:{padding:"12px 16px",borderBottom:"1px solid var(--glass-border)",fontSize:13,fontWeight:600,color:"var(--text-primary)"},children:["💬 Group Comments (",W.length,")"]}),e.jsx("div",{style:{padding:16,borderBottom:W.length>0?"1px solid var(--glass-border)":"none"},children:e.jsxs("div",{style:{display:"flex",gap:10},children:[e.jsx("input",{type:"text",placeholder:"Add a comment...",value:L,onChange:T=>$(T.target.value),onKeyDown:T=>{T.key==="Enter"&&ne()},style:{flex:1,padding:"10px 14px",borderRadius:8,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-primary)",fontSize:13,outline:"none"}}),e.jsx("button",{onClick:ne,style:{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",color:"white",fontWeight:600,fontSize:12,whiteSpace:"nowrap"},children:"Post"})]})}),W.length>0&&e.jsx("div",{style:{padding:12},children:W.map((T,q)=>e.jsxs("div",{style:{padding:12,marginBottom:6,borderRadius:8,background:"rgba(255,255,255,0.02)",borderLeft:"3px solid #667eea"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx("strong",{style:{fontSize:12,color:"var(--text-primary)"},children:T.author_name}),T.author_role&&e.jsx("span",{style:{fontSize:10,padding:"1px 6px",borderRadius:4,background:"rgba(102,126,234,0.15)",color:"#667eea"},children:T.author_role})]}),e.jsx("span",{style:{fontSize:10,color:"var(--text-secondary)"},children:T.created_at?new Date(T.created_at).toLocaleString():""})]}),e.jsx("div",{style:{fontSize:13,color:"var(--text-secondary)",lineHeight:1.5},children:T.content})]},T.id||q))})]}),e.jsx("div",{style:{marginTop:20},children:window.__ATTENDANCE_ADDON__&&window.__ATTENDANCE_ADDON__.GroupAttendance?e.jsx(window.__ATTENDANCE_ADDON__.GroupAttendance,{groupId:S.id,groupName:S.group_code+" \u2014 "+S.name,currentUser:t}):null})]})}return e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:1200,margin:"0 auto"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",padding:"16px 24px",borderRadius:20,border:"var(--border-layer-2)",boxShadow:"var(--shadow-layer-2)"},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{margin:0,fontSize:22,color:"var(--text-primary)"},children:"Formation Groups"}),e.jsxs("p",{style:{margin:"4px 0 0",fontSize:13,color:"var(--text-secondary)"},children:[s.length," group",s.length!==1?"s":""," found"]})]}),e.jsxs("div",{style:{display:"flex",gap:12,alignItems:"center"},children:[Y&&e.jsxs("select",{value:h,onChange:S=>g(S.target.value),style:{padding:"8px 16px",borderRadius:10,background:"var(--glass-layer-3)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)&&e.jsx("option",{value:"",children:"All Campuses"}),Z.map(S=>e.jsx("option",{value:S,children:S},S))]}),K&&e.jsx("button",{onClick:()=>{x(!0),Ae()},className:"btn-primary",style:{padding:"8px 18px",fontSize:13,boxShadow:"var(--shadow-layer-3)"},children:"+ New Group"})]})]}),c?e.jsxs("div",{style:{textAlign:"center",padding:60,color:"var(--text-secondary)"},children:[e.jsx("div",{className:"spinner",style:{margin:"0 auto 12px"}}),"Loading groups..."]}):s.length===0?e.jsxs("div",{style:{textAlign:"center",padding:80,color:"var(--text-secondary)",background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:16},children:[e.jsx("div",{style:{fontSize:48,marginBottom:12},children:"📋"}),e.jsx("div",{style:{fontSize:16,fontWeight:600,marginBottom:4},children:"No Formation Groups"}),e.jsx("div",{style:{fontSize:13},children:K?'Click "+ New Group" to create the first group.':"No groups have been created for your campus yet."})]}):e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:16},children:s.map(S=>e.jsxs("div",{onClick:()=>U(S.id),className:"glass-card",style:{padding:"24px",cursor:"pointer",transition:"all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",position:"relative",overflow:"hidden"},children:[e.jsx("div",{style:{position:"absolute",top:0,left:0,width:"100%",height:"4px",background:"linear-gradient(90deg, var(--primary-color), var(--accent-color))",opacity:.8}}),e.jsx("div",{style:{display:"inline-block",padding:"4px 10px",borderRadius:6,background:"var(--glass-layer-3)",border:"var(--border-layer-1)",color:"var(--primary-light)",fontSize:12,fontWeight:700,letterSpacing:"0.5px",marginBottom:16},children:S.group_code}),e.jsxs("h3",{style:{margin:"0 0 8px",fontSize:17,fontWeight:600,color:"var(--text-primary)"},children:[S.name,S.is_overdue&&e.jsx("span",{style:{marginLeft:8,fontSize:10,padding:"2px 6px",borderRadius:4,background:"rgba(255, 59, 48, 0.15)",color:"#ff3b30",border:"1px solid rgba(255, 59, 48, 0.2)"},children:"Overdue"})]}),e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)",marginBottom:4},children:["📍 ",S.celebration_point]}),e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)",marginBottom:4},children:["👤 ",S.facilitator_name||"Unassigned"]}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:16,paddingTop:16,borderTop:"var(--border-layer-1)"},children:[e.jsxs("span",{style:{fontSize:12,color:"var(--text-secondary)"},children:["Cohort ",S.cohort]}),e.jsxs("span",{style:{fontSize:13,fontWeight:600,color:S.member_count>0?"var(--primary-light)":"var(--text-secondary)"},children:[S.member_count," member",S.member_count!==1?"s":""]})]}),e.jsx("button",{onClick:function(ev){ev.stopPropagation();U(S.id)},style:{marginTop:8,padding:"7px 0",borderRadius:8,background:"rgba(74,158,255,0.15)",border:"1px solid rgba(74,158,255,0.35)",color:"#4A9EFF",fontSize:12,fontWeight:600,cursor:"pointer",width:"100%",letterSpacing:.3},children:"\uD83D\uDCC5 Attendance"})]},S.id))}),n&&e.jsx("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e4,backdropFilter:"blur(5px)"},onClick:()=>x(!1),children:e.jsxs("div",{style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:20,padding:32,width:440,maxWidth:"90vw",boxShadow:"var(--shadow-layer-4)"},onClick:S=>S.stopPropagation(),children:[e.jsx("h3",{style:{margin:"0 0 24px",fontSize:20,color:"var(--text-primary)",fontWeight:600},children:"Create Formation Group"}),e.jsxs("form",{onSubmit:Ve,children:[e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:ee,children:"Celebration Point"}),e.jsxs("select",{value:v.celebration_point,onChange:S=>R({...v,celebration_point:S.target.value}),required:!0,style:te,children:[e.jsx("option",{value:"",children:"Select Campus..."}),Z.map(S=>e.jsx("option",{value:S,children:S},S))]})]}),e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:ee,children:"Group Code (Prefix - Number)"}),e.jsxs("div",{style:{display:"flex",gap:10,alignItems:"center"},children:[e.jsx("div",{style:{padding:"10px 14px",borderRadius:8,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,userSelect:"none",minWidth:60,textAlign:"center",fontWeight:"bold"},children:v.celebration_point&&je[v.celebration_point]||"---"}),e.jsx("input",{type:"text",placeholder:"001",value:v.codeSuffix||"",onChange:S=>{const P=S.target.value.replace(/[^0-9]/g,"");R({...v,codeSuffix:P})},maxLength:3,style:{...te,textAlign:"center",letterSpacing:2,fontWeight:"bold"}})]}),e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)",marginTop:6,paddingLeft:4},children:["Full Code: ",v.celebration_point?`${je[v.celebration_point]}${(v.codeSuffix||"000").padStart(3,"0")}`:"Select campus first"]})]}),e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:ee,children:"Group Name"}),e.jsx("input",{type:"text",placeholder:"e.g. Downtown Alpha Group",value:v.name,onChange:S=>R({...v,name:S.target.value}),required:!0,style:te})]}),e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:ee,children:"Facilitator"}),e.jsxs("select",{value:v.facilitator_user_id,onChange:S=>R({...v,facilitator_user_id:S.target.value}),style:te,children:[e.jsx("option",{value:"",children:"Unassigned"}),k.filter(S=>!v.celebration_point||S.celebration_point===v.celebration_point).map(S=>e.jsxs("option",{value:S.id,children:[S.name," (",S.celebration_point,")"]},S.id))]})]}),e.jsxs("div",{style:{marginBottom:24},children:[e.jsx("label",{style:ee,children:"Cohort"}),e.jsx("input",{type:"text",value:v.cohort,onChange:S=>R({...v,cohort:S.target.value}),style:te})]}),e.jsxs("div",{style:{display:"flex",gap:12,justifyContent:"flex-end"},children:[e.jsx("button",{type:"button",onClick:()=>x(!1),style:{padding:"10px 18px",borderRadius:10,border:"var(--border-layer-2)",background:"transparent",color:"var(--text-primary)",cursor:"pointer",fontSize:13,fontWeight:500},children:"Cancel"}),e.jsx("button",{type:"submit",className:"btn-primary",style:{padding:"10px 24px",fontSize:13,boxShadow:"var(--shadow-layer-2)"},children:"Create Group"})]})]})]})})]})}const we={padding:"12px 20px",fontSize:12,fontWeight:600,color:"var(--text-secondary)",textAlign:"left",borderBottom:"var(--border-layer-1)"},Se={padding:"12px 20px",fontSize:13,color:"var(--text-primary)",borderBottom:"var(--border-layer-1)"},ee={display:"block",fontSize:13,fontWeight:500,color:"var(--text-secondary)",marginBottom:6},te={width:"100%",padding:"12px 16px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box",transition:"background 0.2s"};function Xt(){const{user:t,showToast:r}=H(),[s,b]=a.useState([]),[c,f]=a.useState(!0),[p,i]=a.useState(null),[o,m]=a.useState(null),[l,d]=a.useState(["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)?"":t==null?void 0:t.celebration_point),[h,g]=a.useState(""),[n,x]=a.useState(""),[u,N]=a.useState([]),[C,j]=a.useState("list"),k=["Admin","LeadershipTeam"].includes(t==null?void 0:t.role),y=(t==null?void 0:t.role)==="Admin";a.useEffect(()=>{_(),E(),y&&v()},[]),a.useEffect(()=>{_()},[l,h,n]);const _=async()=>{f(!0);try{const z=new URLSearchParams;l&&z.append("celebration_point",l),h&&z.append("week",h),n&&z.append("group_id",n);const M=await(await fetch(`/api/reports?${z}`)).json();M.success&&b(M.reports)}catch{r("Failed to load reports","error")}f(!1)},E=async()=>{try{const z=new URLSearchParams;l&&z.append("celebration_point",l);const M=await(await fetch(`/api/formation-groups?${z}`)).json();M.success&&N(M.groups)}catch{}},v=async()=>{try{const B=await(await fetch("/api/reports/sync-status")).json();B.success&&m(B)}catch{}},R=async()=>{try{r("Syncing from Notion...","info");const B=await(await fetch("/api/reports/sync",{method:"POST"})).json();B.success?(r(B.message||"Sync complete","success"),v(),_()):r(B.message||"Sync failed","error")}catch{r("Sync failed","error")}},O=z=>{const B={high:"#34C759",medium:"#FF9500",low:"#FF3B30"};return e.jsx("span",{style:{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600,textTransform:"capitalize",background:`${B[z]||"#888"}22`,color:B[z]||"#888"},children:z||"N/A"})};return p?e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:800,margin:"0 auto"},children:[e.jsx("button",{onClick:()=>i(null),style:{background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:6,fontWeight:500,transition:"color 0.2s"},onMouseEnter:z=>z.target.style.color="var(--text-primary)",onMouseLeave:z=>z.target.style.color="var(--text-secondary)",children:"← Back to Reports"}),e.jsxs("div",{className:"glass-card",style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:20,padding:32,boxShadow:"var(--shadow-layer-3)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24},children:[e.jsxs("div",{children:[e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)",marginBottom:8,fontWeight:500,display:"flex",gap:8},children:[e.jsx("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:p.group_code}),e.jsx("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:p.celebration_point}),e.jsxs("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:["Week ",p.week_number]})]}),e.jsx("h2",{style:{margin:0,fontSize:24,color:"var(--text-primary)",fontWeight:700},children:p.group_name}),e.jsxs("div",{style:{fontSize:14,color:"var(--text-secondary)",marginTop:8},children:["Facilitator: ",e.jsx("strong",{style:{color:"var(--text-primary)"},children:p.facilitator_name||"Unknown"}),p.submitted_at&&e.jsxs("span",{children:[" · Submitted ",new Date(p.submitted_at).toLocaleDateString()]})]})]}),O(p.engagement_level)]}),[{label:"📊 Attendance",value:p.attendance_count?`${p.attendance_count} participants present`:null},{label:"💬 Key Themes",value:p.key_themes},{label:"🌱 Formation Evidence",value:p.formation_evidence},{label:"🙏 Pastoral Concerns",value:p.pastoral_concerns},{label:"❓ Questions to Escalate",value:p.questions_to_escalate},{label:"🔧 Session Adjustments",value:p.session_adjustments}].map(({label:z,value:B})=>B?e.jsxs("div",{style:{marginBottom:16,padding:16,borderRadius:12,background:"var(--glass-layer-3)",border:"var(--border-layer-1)"},children:[e.jsx("div",{style:{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginBottom:6},children:z}),e.jsx("div",{style:{fontSize:14,color:"var(--text-primary)",lineHeight:1.6,whiteSpace:"pre-wrap"},children:B})]},z):null)]})]}):e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:1200,margin:"0 auto"},children:[e.jsxs("div",{className:"glass-card",style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,padding:"16px 24px",borderRadius:20},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{margin:0,fontSize:22,color:"var(--text-primary)"},children:"Weekly Reports"}),e.jsxs("p",{style:{margin:"4px 0 0",fontSize:13,color:"var(--text-secondary)"},children:[s.length," report",s.length!==1?"s":""," from Notion"]})]}),e.jsxs("div",{style:{display:"flex",gap:10,alignItems:"center"},children:[y&&o&&e.jsx("div",{style:{padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,background:o.status==="success"?"rgba(52,199,89,0.1)":o.status==="error"?"rgba(255,59,48,0.1)":o.status==="disabled"?"var(--glass-layer-1)":"rgba(255,149,0,0.1)",color:o.status==="success"?"#34C759":o.status==="error"?"#FF3B30":o.status==="disabled"?"var(--text-secondary)":"#FF9500",border:"var(--border-layer-1)"},children:o.status==="disabled"?"⚠ Not Configured":o.status==="success"?`✓ Synced ${o.lastSyncTime?new Date(o.lastSyncTime).toLocaleTimeString():""}`:o.status==="error"?"✗ Sync Error":"⟳ Syncing..."}),y&&(o==null?void 0:o.configured)&&e.jsx("button",{onClick:R,style:{padding:"8px 16px",borderRadius:10,border:"var(--border-layer-2)",background:"var(--glass-layer-3)",color:"var(--primary-color)",fontWeight:600,fontSize:13,cursor:"pointer",transition:"background 0.2s",boxShadow:"var(--shadow-layer-1)"},children:"⟳ Sync Now"})]})]}),e.jsxs("div",{style:{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"},children:[k&&e.jsxs("select",{value:l,onChange:z=>d(z.target.value),style:{padding:"10px 16px",borderRadius:10,background:"var(--glass-layer-2)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)&&e.jsx("option",{value:"",children:"All Campuses"}),Z.map(z=>e.jsx("option",{value:z,children:z},z))]}),e.jsxs("select",{value:h,onChange:z=>g(z.target.value),style:{padding:"10px 16px",borderRadius:10,background:"var(--glass-layer-2)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[e.jsx("option",{value:"",children:"All Weeks"}),Array.from({length:13},(z,B)=>B+1).map(z=>e.jsxs("option",{value:z,children:["Week ",z]},z))]}),e.jsxs("select",{value:n,onChange:z=>x(z.target.value),style:{padding:"10px 16px",borderRadius:10,background:"var(--glass-layer-2)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[e.jsx("option",{value:"",children:"All Groups"}),u.map(z=>e.jsxs("option",{value:z.id,children:[z.group_code," — ",z.name]},z.id))]})]}),c?e.jsxs("div",{style:{textAlign:"center",padding:60,color:"var(--text-secondary)"},children:[e.jsx("div",{className:"spinner",style:{margin:"0 auto 12px"}}),"Loading reports..."]}):s.length===0?e.jsxs("div",{className:"glass-card",style:{textAlign:"center",padding:80},children:[e.jsx("div",{style:{fontSize:48,marginBottom:12},children:"📝"}),e.jsx("div",{style:{fontSize:16,fontWeight:600,marginBottom:4,color:"var(--text-primary)"},children:"No Weekly Reports"}),e.jsx("div",{style:{fontSize:13,color:"var(--text-secondary)"},children:(o==null?void 0:o.status)==="disabled"?"Notion sync is not configured. Go to Settings to connect your Notion database.":"No reports have been synced yet. Reports will appear here after the next Notion sync."})]}):e.jsx("div",{className:"glass-card table-responsive",style:{padding:0,overflow:"hidden"},children:e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:"600px"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{background:"var(--glass-layer-2)",borderBottom:"var(--border-layer-1)"},children:[e.jsx("th",{style:ae,children:"Week"}),e.jsx("th",{style:ae,children:"Group"}),e.jsx("th",{style:ae,children:"Campus"}),e.jsx("th",{style:ae,children:"Facilitator"}),e.jsx("th",{style:ae,children:"Attendance"}),e.jsx("th",{style:ae,children:"Engagement"}),e.jsx("th",{style:ae,children:"Submitted"})]})}),e.jsx("tbody",{children:s.map(z=>e.jsxs("tr",{onClick:()=>i(z),style:{borderBottom:"var(--border-layer-1)",cursor:"pointer",transition:"background 0.1s"},onMouseEnter:B=>B.currentTarget.style.background="var(--glass-layer-2)",onMouseLeave:B=>B.currentTarget.style.background="transparent",children:[e.jsx("td",{style:se,children:e.jsxs("strong",{children:["Week ",z.week_number]})}),e.jsxs("td",{style:se,children:[e.jsx("span",{style:{fontSize:11,fontWeight:700,color:"var(--primary-light)",marginRight:6},children:z.group_code}),z.group_name]}),e.jsx("td",{style:se,children:z.celebration_point}),e.jsx("td",{style:se,children:z.facilitator_name||"—"}),e.jsx("td",{style:se,children:z.attendance_count||"—"}),e.jsx("td",{style:se,children:O(z.engagement_level)}),e.jsx("td",{style:{...se,fontSize:12},children:z.submitted_at?new Date(z.submitted_at).toLocaleDateString():"—"})]},z.id))})]})})]})}const ae={padding:"12px 20px",fontSize:12,fontWeight:600,color:"var(--text-secondary)",textAlign:"left",borderBottom:"var(--border-layer-1)"},se={padding:"12px 20px",fontSize:13,color:"var(--text-primary)",borderBottom:"var(--border-layer-1)"};function Zt(){const{showToast:t}=H(),[r,s]=a.useState({notion_api_key:"",notion_db_id:"",notion_sync_interval:"15"}),[b,c]=a.useState(!0),[f,p]=a.useState(!1),[i,o]=a.useState(null),[m,l]=a.useState(!1),[d,h]=a.useState(null);a.useEffect(()=>{g(),n()},[]);const g=async()=>{try{const C=await(await fetch("/api/settings")).json();C.success&&s({notion_api_key:C.settings.notion_api_key||"",notion_db_id:C.settings.notion_db_id||"",notion_sync_interval:C.settings.notion_sync_interval||"15"})}catch{}c(!1)},n=async()=>{try{const C=await(await fetch("/api/reports/sync-status")).json();C.success&&h(C)}catch{}},x=async N=>{N.preventDefault(),p(!0);try{const C={notion_db_id:r.notion_db_id,notion_sync_interval:r.notion_sync_interval};r.notion_api_key&&!r.notion_api_key.includes("••••")&&(C.notion_api_key=r.notion_api_key);const k=await(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(C)})).json();k.success?(t("Settings saved! Notion sync restarted.","success"),g(),n()):t(k.message,"error")}catch{t("Failed to save settings","error")}p(!1)},u=async()=>{l(!0),o(null);try{const C=await(await fetch("/api/settings/test-notion",{method:"POST"})).json();o(C)}catch{o({success:!1,message:"Connection test failed"})}l(!1)};return b?e.jsx("div",{className:"page-container",style:{padding:24,textAlign:"center",color:"var(--text-secondary)"},children:"Loading settings..."}):e.jsxs("div",{className:"page-container",style:{padding:24,maxWidth:700},children:[e.jsx("h1",{style:{margin:"0 0 4px",fontSize:24,color:"var(--text-primary)"},children:"Settings"}),e.jsx("p",{style:{margin:"0 0 28px",fontSize:13,color:"var(--text-secondary)"},children:"System configuration — Admin only"}),e.jsxs("div",{className:"glass-card",style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:20,padding:32,boxShadow:"var(--shadow-layer-3)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:16,marginBottom:24},children:[e.jsx("div",{style:{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg, #000 0%, #333 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"0 4px 12px rgba(0,0,0,0.2)"},children:"📓"}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:18,fontWeight:700,color:"var(--text-primary)",marginBottom:4},children:"Notion Integration"}),e.jsx("div",{style:{fontSize:13,color:"var(--text-secondary)"},children:"Connect your weekly reports Notion database"})]})]}),d&&e.jsxs("div",{style:{padding:"12px 16px",borderRadius:12,marginBottom:24,background:d.status==="success"?"rgba(52,199,89,0.1)":d.status==="error"?"rgba(255,59,48,0.1)":d.status==="disabled"?"rgba(142,142,147,0.1)":"rgba(255,149,0,0.1)",border:`1px solid ${d.status==="success"?"rgba(52,199,89,0.2)":d.status==="error"?"rgba(255,59,48,0.2)":"rgba(142,142,147,0.2)"}`},children:[e.jsx("div",{style:{fontSize:14,fontWeight:600,color:d.status==="success"?"#34C759":d.status==="error"?"#FF3B30":d.status==="disabled"?"#8E8E93":"#FF9500"},children:d.status==="disabled"?"⚠ Sync Disabled":d.status==="success"?"✓ Sync Active":d.status==="error"?"✗ Sync Error":"⟳ Syncing"}),e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)",marginTop:4},children:[d.message,d.lastSyncTime&&e.jsxs("span",{children:[" · Last: ",new Date(d.lastSyncTime).toLocaleString()]})]})]}),e.jsxs("form",{onSubmit:x,children:[e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:Ne,children:"Notion API Key (Internal Integration Token)"}),e.jsx("input",{type:"password",value:r.notion_api_key,onChange:N=>s({...r,notion_api_key:N.target.value}),placeholder:"secret_xxxxx...",style:Ce}),e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)",marginTop:4},children:["Create an integration at ",e.jsx("a",{href:"https://www.notion.so/my-integrations",target:"_blank",rel:"noopener noreferrer",style:{color:"#667eea"},children:"notion.so/my-integrations"})," and paste the token here."]})]}),e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("label",{style:Ne,children:"Notion Database ID (Weekly Reports)"}),e.jsx("input",{type:"text",value:r.notion_db_id,onChange:N=>s({...r,notion_db_id:N.target.value}),placeholder:"abc123def456...",style:Ce}),e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)",marginTop:4},children:["Found in the URL of your Notion database: notion.so/[workspace]/[",e.jsx("strong",{children:"database-id"}),"]?..."]})]}),e.jsxs("div",{style:{marginBottom:20},children:[e.jsx("label",{style:Ne,children:"Sync Interval (minutes)"}),e.jsx("input",{type:"number",min:"5",max:"60",value:r.notion_sync_interval,onChange:N=>s({...r,notion_sync_interval:N.target.value}),style:{...Ce,width:100}})]}),e.jsxs("div",{style:{display:"flex",gap:12,flexWrap:"wrap",marginTop:32,borderTop:"var(--border-layer-1)",paddingTop:24},children:[e.jsx("button",{type:"submit",disabled:f,className:"btn-primary",style:{padding:"10px 24px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,opacity:f?.6:1,boxShadow:"var(--shadow-layer-2)"},children:f?"Saving...":"Save & Restart Sync"}),e.jsx("button",{type:"button",onClick:u,disabled:m,style:{padding:"10px 20px",borderRadius:10,cursor:"pointer",border:"var(--border-layer-2)",background:"var(--glass-layer-1)",color:"var(--text-primary)",fontSize:13,opacity:m?.6:1,transition:"background 0.2s",fontWeight:500},children:m?"Testing...":"🔗 Test Connection"})]}),i&&e.jsxs("div",{style:{marginTop:16,padding:14,borderRadius:10,background:i.success?"rgba(52,199,89,0.1)":"rgba(255,59,48,0.1)",border:`1px solid ${i.success?"rgba(52,199,89,0.2)":"rgba(255,59,48,0.2)"}`},children:[e.jsx("div",{style:{fontSize:13,fontWeight:600,color:i.success?"#34C759":"#FF3B30"},children:i.success?"✓ Connection Successful":"✗ Connection Failed"}),e.jsx("div",{style:{fontSize:12,color:"var(--text-secondary)",marginTop:4},children:i.message}),i.properties&&i.properties.length>0&&e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)",marginTop:8},children:[e.jsx("strong",{children:"Database properties:"})," ",i.properties.join(", ")]})]})]})]})]})}const Ne={display:"block",fontSize:13,fontWeight:500,color:"var(--text-secondary)",marginBottom:8},Ce={width:"100%",padding:"12px 14px",borderRadius:10,background:"var(--glass-layer-1)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:14,outline:"none",boxSizing:"border-box",transition:"background 0.2s"};function er(){const{user:t,showToast:r}=H(),[s,b]=a.useState([]),[c,f]=a.useState(!0),[p,i]=a.useState(null),[o,m]=a.useState([]),[l,d]=a.useState(""),[h,g]=a.useState([]),[n,x]=a.useState(!1),[u,N]=a.useState(""),[C,j]=a.useState(["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)?"":t==null?void 0:t.celebration_point),[k,y]=a.useState(""),_=["Admin","LeadershipTeam"].includes(t==null?void 0:t.role),E=(t==null?void 0:t.role)==="Admin",v=["Admin","LeadershipTeam","Pastor","Coordinator"].includes(t==null?void 0:t.role);a.useEffect(()=>{R()},[]),a.useEffect(()=>{R()},[u,C,k]);const R=async()=>{f(!0);try{const w=new URLSearchParams;u&&w.append("checkpoint_week",u),C&&w.append("celebration_point",C),k&&w.append("status",k);const A=await(await fetch(`/api/checkpoints?${w}`)).json();A.success&&b(A.checkpoints)}catch{r("Failed to load checkpoints","error")}f(!1)},O=async w=>{try{const A=await(await fetch(`/api/checkpoints/${w}`)).json();if(A.success){i(A.checkpoint),m(A.members||[]),d(A.checkpoint.review_notes||"");const L=A.checkpoint.participants_flagged?typeof A.checkpoint.participants_flagged=="string"?JSON.parse(A.checkpoint.participants_flagged):A.checkpoint.participants_flagged:[];g(L)}}catch{r("Failed to load checkpoint","error")}},z=async w=>{x(!0);try{const A=await(await fetch("/api/checkpoints/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({checkpoint_week:w})})).json();A.success?(r(A.message,"success"),R()):r(A.message,"error")}catch{r("Generation failed","error")}x(!1)},B=async w=>{try{const A=await(await fetch(`/api/checkpoints/${p.id}/review`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({review_notes:l,participants_flagged:h,status:w})})).json();A.success?(r(`Checkpoint ${w}`,"success"),i(null),R()):r(A.message,"error")}catch{r("Review failed","error")}},M=w=>{g(W=>W.includes(w)?W.filter(A=>A!==w):[...W,w])},G={pending:{color:"#FF9500",bg:"rgba(255,149,0,0.12)",label:"⏳ Pending"},completed:{color:"#007AFF",bg:"rgba(0,122,255,0.12)",label:"✓ Completed"},reviewed:{color:"#34C759",bg:"rgba(52,199,89,0.12)",label:"✅ Reviewed"}};if(p){const w=p,W=G[w.status]||G.pending;return e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:900,margin:"0 auto"},children:[e.jsx("button",{onClick:()=>i(null),style:{background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:6,fontWeight:500,transition:"color 0.2s"},onMouseEnter:A=>A.target.style.color="var(--text-primary)",onMouseLeave:A=>A.target.style.color="var(--text-secondary)",children:"← Back to Checkpoints"}),e.jsxs("div",{className:"glass-card",style:{background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",border:"var(--border-layer-2)",borderRadius:20,padding:32,boxShadow:"var(--shadow-layer-3)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24},children:[e.jsxs("div",{children:[e.jsxs("div",{style:{fontSize:13,color:"var(--text-secondary)",marginBottom:8,fontWeight:500,display:"flex",gap:8},children:[e.jsx("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:w.group_code}),e.jsx("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:w.celebration_point}),e.jsxs("span",{style:{background:"var(--glass-layer-3)",padding:"2px 8px",borderRadius:6},children:["Week ",w.checkpoint_week]})]}),e.jsx("h2",{style:{margin:0,fontSize:24,color:"var(--text-primary)",fontWeight:700},children:w.group_name}),e.jsxs("div",{style:{fontSize:14,color:"var(--text-secondary)",marginTop:8},children:["Facilitator: ",e.jsx("strong",{style:{color:"var(--text-primary)"},children:w.facilitator_name||"Unknown"}),w.reviewed_at&&e.jsxs("span",{children:[" · Reviewed by ",w.reviewer_name," on ",new Date(w.reviewed_at).toLocaleDateString()]})]})]}),e.jsx("span",{style:{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,background:W.bg,color:W.color,border:`1px solid ${W.color}40`},children:W.label})]}),e.jsx("div",{style:{marginBottom:16,padding:16,borderRadius:12,background:"var(--glass-layer-3)",border:"var(--border-layer-1)"},children:e.jsx("div",{style:{fontSize:13,color:"var(--text-primary)",lineHeight:1.6},children:w.summary})}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))",gap:12,marginBottom:20},children:[{label:"📊 Attendance Trend",value:w.attendance_trend},{label:"📈 Engagement Trend",value:w.engagement_trend}].map(({label:A,value:L})=>e.jsxs("div",{style:tr,children:[e.jsx("div",{style:{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:4},children:A}),e.jsx("div",{style:{fontSize:14,color:"var(--text-primary)",fontWeight:600},children:L||"N/A"})]},A))}),[{label:"💬 Recurring Themes",value:w.recurring_themes},{label:"🌱 Formation Evidence",value:w.formation_evidence_summary},{label:"🙏 Pastoral Concerns",value:w.concerns_summary}].map(({label:A,value:L})=>L&&L!=="No themes reported"&&L!=="No formation evidence reported"&&L!=="No concerns flagged"?e.jsxs("div",{style:{marginBottom:14,padding:14,borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)"},children:[e.jsx("div",{style:{fontSize:12,fontWeight:600,color:"var(--text-secondary)",marginBottom:6},children:A}),e.jsx("div",{style:{fontSize:13,color:"var(--text-primary)",lineHeight:1.6,whiteSpace:"pre-wrap"},children:L})]},A):null),v&&o.length>0&&e.jsxs("div",{style:{marginTop:16,padding:14,borderRadius:10,background:"rgba(255,59,48,0.04)",border:"1px solid rgba(255,59,48,0.1)"},children:[e.jsx("div",{style:{fontSize:12,fontWeight:600,color:"var(--text-secondary)",marginBottom:10},children:"🚩 Flag Participants for Follow-up"}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:8},children:o.map(A=>{const L=h.includes(A.student_id);return e.jsxs("button",{onClick:()=>M(A.student_id),style:{padding:"6px 12px",borderRadius:8,fontSize:12,cursor:"pointer",border:L?"1px solid #FF3B30":"1px solid var(--glass-border)",background:L?"rgba(255,59,48,0.15)":"transparent",color:L?"#FF3B30":"var(--text-primary)",fontWeight:L?600:400},children:[L?"🚩 ":"",A.first_name||""," ",A.last_name||A.student_id]},A.student_id)})})]}),v&&w.status!=="reviewed"&&e.jsxs("div",{style:{marginTop:20},children:[e.jsx("label",{style:{display:"block",fontSize:12,fontWeight:600,color:"var(--text-secondary)",marginBottom:6},children:"Discernment Notes"}),e.jsx("textarea",{value:l,onChange:A=>d(A.target.value),placeholder:"Add your discernment notes, observations, and recommended actions...",rows:4,style:{width:"100%",padding:12,borderRadius:8,boxSizing:"border-box",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-primary)",fontSize:14,outline:"none",resize:"vertical"}}),e.jsxs("div",{style:{display:"flex",gap:10,marginTop:12},children:[w.status==="pending"&&e.jsx("button",{onClick:()=>B("completed"),style:primaryBtnStyle,children:"✓ Mark Completed"}),e.jsx("button",{onClick:()=>B("reviewed"),style:{...primaryBtnStyle,background:"linear-gradient(135deg, #34C759 0%, #30D158 100%)"},children:"✅ Mark Reviewed"})]})]}),w.review_notes&&w.status==="reviewed"&&e.jsxs("div",{style:{marginTop:16,padding:14,borderRadius:10,background:"rgba(52,199,89,0.06)",border:"1px solid rgba(52,199,89,0.12)"},children:[e.jsx("div",{style:{fontSize:12,fontWeight:600,color:"#34C759",marginBottom:6},children:"📝 Review Notes"}),e.jsx("div",{style:{fontSize:13,color:"var(--text-primary)",lineHeight:1.6,whiteSpace:"pre-wrap"},children:w.review_notes})]})]})]})}return e.jsxs("div",{className:"page-container",style:{padding:"24px",maxWidth:1200,margin:"0 auto"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12,background:"var(--glass-layer-2)",backdropFilter:"var(--blur-layer-3)",padding:"16px 24px",borderRadius:20,border:"var(--border-layer-2)",boxShadow:"var(--shadow-layer-2)"},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{margin:0,fontSize:22,color:"var(--text-primary)"},children:"Discernment Checkpoints"}),e.jsxs("p",{style:{margin:"4px 0 0",fontSize:13,color:"var(--text-secondary)"},children:[s.length," checkpoint",s.length!==1?"s":""," · Structured reflection at Weeks 4, 8 & 13"]})]}),E&&e.jsx("div",{style:{display:"flex",gap:8},children:[4,8,13].map(w=>e.jsx("button",{onClick:()=>z(w),disabled:n,style:{padding:"8px 16px",borderRadius:10,border:"var(--border-layer-2)",background:"var(--glass-layer-3)",color:"var(--primary-color)",fontWeight:600,fontSize:13,cursor:"pointer",opacity:n?.5:1,transition:"background 0.2s"},children:n?"...":`⚡ Week ${w}`},w))})]}),e.jsxs("div",{style:{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"},children:[_&&e.jsxs("select",{value:C,onChange:w=>j(w.target.value),style:{padding:"10px 16px",borderRadius:10,background:"var(--glass-layer-2)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)&&e.jsx("option",{value:"",children:"All Campuses"}),Z.map(w=>e.jsx("option",{value:w,children:w},w))]}),e.jsxs("select",{value:u,onChange:w=>N(w.target.value),style:{padding:"10px 16px",borderRadius:10,background:"var(--glass-layer-2)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[e.jsx("option",{value:"",children:"All Checkpoints"}),e.jsx("option",{value:"4",children:"Week 4"}),e.jsx("option",{value:"8",children:"Week 8"}),e.jsx("option",{value:"13",children:"Week 13"})]}),e.jsxs("select",{value:k,onChange:w=>y(w.target.value),style:{padding:"10px 16px",borderRadius:10,background:"var(--glass-layer-2)",border:"var(--border-layer-2)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"var(--blur-layer-1)",cursor:"pointer"},children:[e.jsx("option",{value:"",children:"All Statuses"}),e.jsx("option",{value:"pending",children:"Pending"}),e.jsx("option",{value:"completed",children:"Completed"}),e.jsx("option",{value:"reviewed",children:"Reviewed"})]})]}),c?e.jsxs("div",{style:{textAlign:"center",padding:60,color:"var(--text-secondary)"},children:[e.jsx("div",{className:"spinner",style:{margin:"0 auto 12px"}}),"Loading checkpoints..."]}):s.length===0?e.jsxs("div",{style:{...rr,textAlign:"center",padding:80},children:[e.jsx("div",{style:{fontSize:48,marginBottom:12},children:"🎯"}),e.jsx("div",{style:{fontSize:16,fontWeight:600,marginBottom:4,color:"var(--text-primary)"},children:"No Checkpoints Yet"}),e.jsx("div",{style:{fontSize:13,color:"var(--text-secondary)"},children:E?"Use the Week buttons above to generate checkpoints from weekly report data.":"Checkpoints will appear here once generated by an administrator."})]}):e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:16},children:s.map(w=>{const W=G[w.status]||G.pending;return e.jsxs("div",{onClick:()=>O(w.id),className:"glass-card",style:{padding:24,cursor:"pointer",transition:"all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",position:"relative",overflow:"hidden"},children:[e.jsx("div",{style:{position:"absolute",top:0,left:0,width:"100%",height:"4px",background:`linear-gradient(90deg, ${W.color}, var(--primary-color))`,opacity:.8}}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},children:[e.jsxs("span",{style:{padding:"4px 10px",borderRadius:6,background:"var(--glass-layer-3)",border:"var(--border-layer-1)",color:"var(--text-primary)",fontSize:12,fontWeight:700},children:["Week ",w.checkpoint_week]}),e.jsx("span",{style:{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:700,background:W.bg,color:W.color,border:`1px solid ${W.color}30`},children:W.label})]}),e.jsx("h3",{style:{margin:"0 0 4px",fontSize:15,color:"var(--text-primary)"},children:w.group_name}),e.jsxs("div",{style:{fontSize:12,color:"var(--text-secondary)",marginBottom:4},children:[w.group_code," · 📍 ",w.celebration_point]}),e.jsxs("div",{style:{fontSize:12,color:"var(--text-secondary)",marginBottom:10},children:["👤 ",w.facilitator_name||"Unassigned"]}),e.jsxs("div",{style:{display:"flex",gap:8,flexWrap:"wrap"},children:[w.attendance_trend&&e.jsxs("span",{style:{fontSize:12,padding:"4px 10px",borderRadius:6,background:"var(--glass-layer-2)",color:"var(--text-secondary)",border:"var(--border-layer-1)"},children:["📊 ",w.attendance_trend]}),w.engagement_trend&&e.jsxs("span",{style:{fontSize:12,padding:"4px 10px",borderRadius:6,background:"var(--glass-layer-2)",color:"var(--text-secondary)",border:"var(--border-layer-1)"},children:["📈 ",w.engagement_trend]})]})]},w.id)})})]})}const tr={padding:16,borderRadius:12,background:"var(--glass-layer-2)",border:"var(--border-layer-1)"},rr={background:"var(--glass-layer-1)",backdropFilter:"var(--blur-layer-2)",border:"var(--border-layer-2)",borderRadius:16,padding:24,boxShadow:"var(--shadow-sm)"};function ar(){var Y,K;const{user:t,showToast:r}=H(),[s,b]=a.useState(""),[c,f]=a.useState([]),[p,i]=a.useState(null),[o,m]=a.useState(null),[l,d]=a.useState(!1),[h,g]=a.useState(""),[n,x]=a.useState(""),[u,N]=a.useState(!1),[C,j]=a.useState(null),[k,y]=a.useState(null),[_,E]=a.useState(!1),[v,R]=a.useState(null),[O,z]=a.useState([]),[B,M]=a.useState(!1);a.useEffect(()=>{G()},[]);const G=async()=>{try{const I=await(await fetch("/api/data/students")).json();I.success&&f(I.students||[])}catch{}},w=s.length>=2?c.filter(F=>`${F.first_name} ${F.last_name} ${F.email}`.toLowerCase().includes(s.toLowerCase())).slice(0,8):[],W=async F=>{i(F),b(""),g(F.first_name||""),x(F.last_name||""),j(null),y(null),d(!0);try{const U=await(await fetch(`/api/tech-support/lookup/${F.userId}`)).json();U.success?(m(U.user),g(U.user.first_name||F.first_name||""),x(U.user.last_name||F.last_name||"")):m(null)}catch{m(null)}d(!1)},A=async()=>{R(null),N(!0),j(null);try{const I=await(await fetch(`/api/tech-support/name/${p.userId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({first_name:h,last_name:n})})).json();j(I),I.success?r("Name updated on Thinkific","success"):r(typeof I.message=="object"?JSON.stringify(I.message):I.message,"error")}catch{j({success:!1,message:"Connection error"}),r("Failed to update name","error")}N(!1)},L=async()=>{R(null),E(!0),y(null);try{const I=await(await fetch(`/api/tech-support/reset-password/${p.userId}`,{method:"POST"})).json();y(I),I.success?r("Password reset successfully","success"):r(typeof I.message=="object"?JSON.stringify(I.message):I.message,"error")}catch{y({success:!1,message:"Connection error"}),r("Failed to reset password","error")}E(!1)},$=async()=>{try{const I=await(await fetch("/api/tech-support/audit-log")).json();I.success&&z(I.logs||[])}catch{}M(!0)};return e.jsxs("div",{className:"page-container",style:{padding:24,maxWidth:960},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{margin:0,fontSize:24,color:"var(--text-primary)"},children:"Tech Support"}),e.jsx("p",{style:{margin:"4px 0 0",fontSize:13,color:"var(--text-secondary)"},children:"Thinkific write-back actions · Name changes & password resets"})]}),e.jsx("button",{onClick:$,style:De,children:"📋 Audit Log"})]}),e.jsxs("div",{style:{position:"relative",marginBottom:24},children:[e.jsx("input",{type:"text",value:s,onChange:F=>b(F.target.value),placeholder:"🔍 Search participant by name or email...",style:sr}),w.length>0&&e.jsx("div",{style:or,children:w.map(F=>e.jsxs("div",{onClick:()=>W(F),style:{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.04)",transition:"background 0.15s"},onMouseEnter:I=>I.currentTarget.style.background="rgba(102,126,234,0.1)",onMouseLeave:I=>I.currentTarget.style.background="transparent",children:[e.jsxs("div",{style:{fontSize:13,fontWeight:600,color:"var(--text-primary)"},children:[F.first_name," ",F.last_name]}),e.jsxs("div",{style:{fontSize:11,color:"var(--text-secondary)"},children:[F.email," · ",F.celebration_point||"No campus"," · ID: ",F.userId]})]},F.id))})]}),p&&e.jsxs("div",{style:ue,children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20},children:[e.jsxs("div",{children:[e.jsxs("h2",{style:{margin:0,fontSize:18,color:"var(--text-primary)"},children:[p.first_name," ",p.last_name]}),e.jsxs("div",{style:{fontSize:12,color:"var(--text-secondary)",marginTop:4},children:["📧 ",p.email," · 📍 ",p.celebration_point||"N/A"," · Thinkific ID: ",p.userId]})]}),e.jsx("button",{onClick:()=>{i(null),j(null),y(null)},style:{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"var(--text-secondary)"},children:"✕"})]}),l&&e.jsx("div",{style:{padding:12,textAlign:"center",color:"var(--text-secondary)",fontSize:13},children:"Looking up live Thinkific data..."}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16},children:[e.jsxs("div",{style:Ie,children:[e.jsx("div",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)",marginBottom:12},children:"✏️ Update Name"}),e.jsxs("div",{style:{marginBottom:10},children:[e.jsx("label",{style:Be,children:"First Name"}),e.jsx("input",{value:h,onChange:F=>g(F.target.value),style:We,placeholder:"First name"})]}),e.jsxs("div",{style:{marginBottom:14},children:[e.jsx("label",{style:Be,children:"Last Name"}),e.jsx("input",{value:n,onChange:F=>x(F.target.value),style:We,placeholder:"Last name"})]}),e.jsx("button",{onClick:()=>R({type:"name"}),disabled:u||!h&&!n,style:{...ze,opacity:u?.5:1,width:"100%"},children:u?"⏳ Updating...":"✏️ Update on Thinkific"}),C&&e.jsx("div",{style:{marginTop:10,padding:10,borderRadius:8,fontSize:12,background:C.success?"rgba(52,199,89,0.1)":"rgba(255,59,48,0.1)",color:C.success?"#34C759":"#FF3B30",border:`1px solid ${C.success?"rgba(52,199,89,0.2)":"rgba(255,59,48,0.2)"}`},children:C.success?`✅ Updated: ${(Y=C.previous)==null?void 0:Y.first_name} ${(K=C.previous)==null?void 0:K.last_name} → ${h} ${n}`:`❌ ${C.message}`})]}),e.jsxs("div",{style:Ie,children:[e.jsx("div",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)",marginBottom:12},children:"🔑 Password Reset"}),e.jsx("p",{style:{fontSize:12,color:"var(--text-secondary)",lineHeight:1.5,marginBottom:14},children:"Generate a temporary password for this participant. They will need this password to log in and should change it immediately."}),e.jsx("button",{onClick:()=>R({type:"password"}),disabled:_,style:{...ze,width:"100%",background:"linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)",opacity:_?.5:1},children:_?"⏳ Resetting...":"🔑 Reset Password"}),k&&e.jsx("div",{style:{marginTop:10,padding:12,borderRadius:8,fontSize:12,background:k.success?"rgba(52,199,89,0.08)":"rgba(255,59,48,0.1)",border:`1px solid ${k.success?"rgba(52,199,89,0.15)":"rgba(255,59,48,0.2)"}`,color:"var(--text-primary)"},children:k.success?e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{color:"#34C759",fontWeight:600,marginBottom:6},children:"✅ Password Reset Complete"}),e.jsxs("div",{style:{marginBottom:4},children:["Student: ",k.studentName]}),e.jsxs("div",{style:{marginBottom:4},children:["Email: ",k.studentEmail]}),e.jsx("div",{style:{padding:8,borderRadius:6,background:"rgba(255,255,255,0.08)",fontFamily:"monospace",fontSize:14,fontWeight:700,textAlign:"center",userSelect:"all",letterSpacing:1},children:k.tempPassword}),e.jsx("div",{style:{fontSize:10,color:"#FF9500",marginTop:6},children:"⚠️ Share this password securely. Advise participant to change it after login."})]}):e.jsxs("span",{style:{color:"#FF3B30"},children:["❌ ",k.message]})})]})]})]}),v&&e.jsx("div",{style:Pe,children:e.jsxs("div",{style:{...ue,maxWidth:420,textAlign:"center"},children:[e.jsx("div",{style:{fontSize:40,marginBottom:12},children:v.type==="name"?"✏️":"🔑"}),e.jsx("h3",{style:{margin:"0 0 8px",color:"var(--text-primary)"},children:v.type==="name"?"Confirm Name Change":"Confirm Password Reset"}),e.jsx("p",{style:{fontSize:13,color:"var(--text-secondary)",marginBottom:20},children:v.type==="name"?`Update name to "${h} ${n}" on Thinkific for ${p.email}?`:`Generate a new temporary password for ${p.first_name} ${p.last_name} (${p.email})?`}),e.jsx("p",{style:{fontSize:11,color:"#FF9500"},children:"⚠️ This action will modify data on Thinkific and be logged in the audit trail."}),e.jsxs("div",{style:{display:"flex",gap:10,justifyContent:"center",marginTop:16},children:[e.jsx("button",{onClick:()=>R(null),style:De,children:"Cancel"}),e.jsx("button",{onClick:v.type==="name"?A:L,style:{...ze,background:v.type==="name"?"linear-gradient(135deg, #667eea 0%, #764ba2 100%)":"linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)"},children:"Confirm"})]})]})}),B&&e.jsx("div",{style:Pe,children:e.jsxs("div",{style:{...ue,maxWidth:700,maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},children:[e.jsx("h3",{style:{margin:0,color:"var(--text-primary)"},children:"📋 Thinkific Action Audit Log"}),e.jsx("button",{onClick:()=>M(!1),style:{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"var(--text-secondary)"},children:"✕"})]}),e.jsx("div",{className:"table-responsive",style:{flex:1,overflowY:"auto"},children:O.length===0?e.jsx("div",{style:{textAlign:"center",padding:40,color:"var(--text-secondary)"},children:"No actions logged yet"}):e.jsxs("table",{style:{width:"100%",fontSize:12,borderCollapse:"collapse",minWidth:"500px"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{borderBottom:"1px solid rgba(255,255,255,0.08)"},children:[e.jsx("th",{style:ce,children:"Time"}),e.jsx("th",{style:ce,children:"Actor"}),e.jsx("th",{style:ce,children:"Action"}),e.jsx("th",{style:ce,children:"Target"}),e.jsx("th",{style:ce,children:"Details"})]})}),e.jsx("tbody",{children:O.map(F=>{var oe,ne;const I=F.details?JSON.parse(F.details):{},U=F.action.includes("failed");return e.jsxs("tr",{style:{borderBottom:"1px solid rgba(255,255,255,0.03)"},children:[e.jsx("td",{style:pe,children:new Date(F.created_at).toLocaleString()}),e.jsx("td",{style:pe,children:F.actor_name||I.actor_name}),e.jsx("td",{style:pe,children:e.jsx("span",{style:{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:600,background:U?"rgba(255,59,48,0.12)":"rgba(52,199,89,0.12)",color:U?"#FF3B30":"#34C759"},children:F.action.replace("thinkific_","").replace(/_/g," ")})}),e.jsx("td",{style:pe,children:I.thinkific_email||F.target_id}),e.jsx("td",{style:pe,children:I.previous?`${I.previous.first_name} ${I.previous.last_name} → ${((oe=I.updated)==null?void 0:oe.first_name)||""} ${((ne=I.updated)==null?void 0:ne.last_name)||""}`:I.error||I.student_name||"—"})]},F.id)})})]})})]})}),!p&&w.length===0&&e.jsxs("div",{style:{...ue,textAlign:"center",padding:60},children:[e.jsx("div",{style:{fontSize:48,marginBottom:12},children:"🔧"}),e.jsx("div",{style:{fontSize:16,fontWeight:600,color:"var(--text-primary)",marginBottom:4},children:"Tech Support Panel"}),e.jsx("div",{style:{fontSize:13,color:"var(--text-secondary)",maxWidth:400,margin:"0 auto"},children:"Search for a participant above to update their name or reset their password on Thinkific. All actions are audit-logged."})]})]})}const ue={background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:16,padding:24},sr={width:"100%",padding:"12px 16px",borderRadius:12,boxSizing:"border-box",background:"var(--glass-bg)",border:"1px solid var(--glass-border)",color:"var(--text-primary)",fontSize:14,outline:"none",backdropFilter:"blur(12px)"},or={position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:"0 0 12px 12px",maxHeight:320,overflowY:"auto"},Ie={padding:18,borderRadius:12,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)"},Be={display:"block",fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:4},We={width:"100%",padding:"8px 12px",borderRadius:8,boxSizing:"border-box",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"var(--text-primary)",fontSize:13,outline:"none"},ze={padding:"10px 18px",borderRadius:10,border:"none",cursor:"pointer",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",color:"white",fontWeight:600,fontSize:13},De={padding:"8px 16px",borderRadius:8,border:"1px solid var(--glass-border)",background:"var(--glass-bg)",color:"var(--text-primary)",cursor:"pointer",fontSize:12,fontWeight:600},Pe={position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e3},ce={textAlign:"left",padding:"8px 10px",fontWeight:600,color:"var(--text-secondary)"},pe={padding:"8px 10px",color:"var(--text-primary)"};function nr(){const{user:t,showToast:r}=H(),s=["Admin","LeadershipTeam"].includes(t==null?void 0:t.role),b=(t==null?void 0:t.role)==="Facilitator",[c,f]=a.useState(s?"":t==null?void 0:t.celebration_point),[p,i]=a.useState([]),[o,m]=a.useState(""),[l,d]=a.useState(null);a.useEffect(()=>{h()},[]);const h=async()=>{try{const N=await(await fetch("/api/formation-groups")).json();N.success&&i(N.groups||[])}catch{}},g=async(u,N)=>{var C;d(u);try{const j=N.includes("?")?"&":"?",k=c&&!N.includes("group/")?`${N}${j}celebration_point=${c}`:N,y=await fetch(k);if(!y.ok){const O=await y.json().catch(()=>({}));throw new Error(O.message||"Download failed")}const _=await y.blob(),v=((C=(y.headers.get("Content-Disposition")||"").match(/filename="(.+)"/))==null?void 0:C[1])||`report_${new Date().toISOString().slice(0,10)}.csv`,R=document.createElement("a");R.href=URL.createObjectURL(_),R.download=v,R.click(),URL.revokeObjectURL(R.href),r(`Downloaded ${v}`,"success")}catch(j){r(j.message||"Download failed","error")}d(null)},n=[{key:"roster",icon:"👥",title:"Participant Roster",desc:"Full roster with progress summary, risk scores, and activity.",url:"/api/exports/campus/roster"},{key:"risk",icon:"⚠️",title:"Inactivity / Risk Report",desc:"At-risk participants sorted by risk score and inactivity days.",url:"/api/exports/campus/risk"},{key:"weekly",icon:"📝",title:"Weekly Report Aggregation",desc:"All weekly reports with themes, evidence, and concerns.",url:"/api/exports/campus/weekly-reports"},{key:"evidence",icon:"🌱",title:"Formation Evidence Summary",desc:"Formation observations and growth evidence from reports.",url:"/api/exports/campus/formation-evidence"},{key:"checkpoints",icon:"🎯",title:"Checkpoint Summary",desc:"Discernment checkpoint data with review notes and trends.",url:"/api/exports/campus/checkpoints"}],x=c?p.filter(u=>u.celebration_point===c):p;return e.jsxs("div",{className:"page-container",style:{padding:24,maxWidth:960},children:[e.jsxs("div",{style:{marginBottom:24},children:[e.jsx("h1",{style:{margin:0,fontSize:24,color:"var(--text-primary)"},children:"Report Extraction"}),e.jsx("p",{style:{margin:"4px 0 0",fontSize:13,color:"var(--text-secondary)"},children:"Download CSV reports for campus and formation group data"})]}),s&&e.jsx("div",{style:{marginBottom:20},children:e.jsxs("select",{value:c,onChange:u=>f(u.target.value),style:$e,children:[["Admin","LeadershipTeam"].includes(t==null?void 0:t.role)&&e.jsx("option",{value:"",children:"All Campuses"}),Z.map(u=>e.jsx("option",{value:u,children:u},u))]})}),!b&&e.jsxs(e.Fragment,{children:[e.jsx("h2",{style:Me,children:"📊 Campus-Based Reports"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:14,marginBottom:32},children:n.map(u=>e.jsxs("div",{style:xe,children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8},children:[e.jsx("span",{style:{fontSize:22},children:u.icon}),e.jsx("span",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)"},children:u.title})]}),e.jsx("p",{style:{fontSize:12,color:"var(--text-secondary)",lineHeight:1.5,margin:"0 0 12px"},children:u.desc}),e.jsx("button",{onClick:()=>g(u.key,u.url),disabled:l===u.key,style:{...me,opacity:l===u.key?.5:1},children:l===u.key?"⏳ Generating...":"📥 Download CSV"})]},u.key))})]}),e.jsx("h2",{style:Me,children:"🏘️ Group-Based Reports"}),x.length===0?e.jsxs("div",{style:{...xe,textAlign:"center",padding:40},children:[e.jsx("div",{style:{fontSize:36,marginBottom:8},children:"🏘️"}),e.jsx("div",{style:{fontSize:13,color:"var(--text-secondary)"},children:"No groups available"})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{marginBottom:16},children:e.jsxs("select",{value:o,onChange:u=>m(u.target.value),style:$e,children:[e.jsx("option",{value:"",children:"Select a Formation Group..."}),x.map(u=>e.jsxs("option",{value:u.id,children:[u.group_code," — ",u.name," (",u.celebration_point,")"]},u.id))]})}),o&&e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:14},children:[e.jsxs("div",{style:xe,children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8},children:[e.jsx("span",{style:{fontSize:22},children:"👥"}),e.jsx("span",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)"},children:"Group Member Roster"})]}),e.jsx("p",{style:{fontSize:12,color:"var(--text-secondary)",lineHeight:1.5,margin:"0 0 12px"},children:"Members with progress, activity, and risk scores."}),e.jsx("button",{onClick:()=>g("group-roster",`/api/exports/group/${o}/roster`),disabled:l==="group-roster",style:{...me,opacity:l==="group-roster"?.5:1},children:l==="group-roster"?"⏳ Generating...":"📥 Download CSV"})]}),e.jsxs("div",{style:xe,children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8},children:[e.jsx("span",{style:{fontSize:22},children:"📝"}),e.jsx("span",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)"},children:"Weekly Report History"})]}),e.jsx("p",{style:{fontSize:12,color:"var(--text-secondary)",lineHeight:1.5,margin:"0 0 12px"},children:"All weekly reports submitted for this group."}),e.jsx("button",{onClick:()=>g("group-weekly",`/api/exports/group/${o}/weekly-reports`),disabled:l==="group-weekly",style:{...me,opacity:l==="group-weekly"?.5:1},children:l==="group-weekly"?"⏳ Generating...":"📥 Download CSV"})]}),e.jsxs("div",{style:xe,children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8},children:[e.jsx("span",{style:{fontSize:22},children:"🌱"}),e.jsx("span",{style:{fontSize:14,fontWeight:600,color:"var(--text-primary)"},children:"Formation Evidence Timeline"})]}),e.jsx("p",{style:{fontSize:12,color:"var(--text-secondary)",lineHeight:1.5,margin:"0 0 12px"},children:"Weekly formation observations and growth evidence."}),e.jsx("button",{onClick:()=>g("group-evidence",`/api/exports/group/${o}/formation-evidence`),disabled:l==="group-evidence",style:{...me,opacity:l==="group-evidence"?.5:1},children:l==="group-evidence"?"⏳ Generating...":"📥 Download CSV"})]})]})]})]})}const xe={background:"var(--glass-bg)",backdropFilter:"blur(20px)",border:"1px solid var(--glass-border)",borderRadius:14,padding:18},$e={padding:"8px 14px",borderRadius:8,background:"var(--glass-bg)",width:"100%",border:"1px solid var(--glass-border)",color:"var(--text-primary)",fontSize:13,outline:"none",backdropFilter:"blur(12px)",maxWidth:"100%"},Me={fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:14,display:"flex",alignItems:"center",gap:8},me={padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",color:"white",fontWeight:600,fontSize:12,width:"100%"};function ir({toasts:t}){const r={success:"✓",error:"✕",info:"ℹ"};return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"toast-container",children:t.map(s=>e.jsxs("div",{className:`toast ${s.type}`,children:[e.jsx("div",{className:"toast-icon",children:r[s.type]||"ℹ"}),e.jsx("span",{className:"toast-message",children:s.message})]},s.id))}),e.jsx("style",{children:`
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
            `})]})}const Ke=a.createContext(null),ge=[{id:"default",name:"Default",path:"/bg.jpeg",thumbnail:"/bg.jpeg"},{id:"high-sierra",name:"High Sierra",path:"/wallpapers/10-13.jpeg",thumbnail:"/wallpapers/thumbnails/10-13 Small.jpeg"},{id:"sequoia-dark",name:"Sequoia Dark",path:"/wallpapers/15-Sequoia-Dark-6K.jpeg",thumbnail:"/wallpapers/thumbnails/15-Sequoia-Dark-6K Small.jpeg"},{id:"sequoia-light",name:"Sequoia Light",path:"/wallpapers/15-Sequoia-Light-6K.jpeg",thumbnail:"/wallpapers/thumbnails/15-Sequoia-Light-6K Small.jpeg"},{id:"sequoia-sunrise",name:"Sequoia Sunrise",path:"/wallpapers/15-Sequoia-Sunrise.jpeg",thumbnail:"/wallpapers/thumbnails/15-Sequoia-Sunrise Small.jpeg"},{id:"tahoe-dawn",name:"Tahoe Dawn",path:"/wallpapers/26-Tahoe-Beach-Dawn.jpeg",thumbnail:"/wallpapers/thumbnails/26-Tahoe-Beach-Dawn Small.jpeg"},{id:"tahoe-day",name:"Tahoe Day",path:"/wallpapers/26-Tahoe-Beach-Day.jpeg",thumbnail:"/wallpapers/thumbnails/26-Tahoe-Beach-Day Small.jpeg"},{id:"tahoe-dusk",name:"Tahoe Dusk",path:"/wallpapers/26-Tahoe-Beach-Dusk.jpeg",thumbnail:"/wallpapers/thumbnails/26-Tahoe-Beach-Dusk Small.jpeg"},{id:"tahoe-night",name:"Tahoe Night",path:"/wallpapers/26-Tahoe-Beach-Night.jpeg",thumbnail:"/wallpapers/thumbnails/26-Tahoe-Beach-Night Small.jpeg"}],he=[{id:"blue",label:"Blue",value:"#007AFF"},{id:"purple",label:"Purple",value:"#AF52DE"},{id:"pink",label:"Pink",value:"#FF2D55"},{id:"red",label:"Red",value:"#FF3B30"},{id:"orange",label:"Orange",value:"#FF9500"},{id:"yellow",label:"Yellow",value:"#FFCC00"},{id:"green",label:"Green",value:"#34C759"},{id:"graphite",label:"Graphite",value:"#8E8E93"},{id:"multicolor",label:"Multicolor",value:"#007AFF"}],lr="coordinator-wallpaper",dr="coordinator-theme",cr="coordinator-accent";function pr({children:t}){const{user:r}=H(),s=h=>({wallpaper:h?`coordinator-wallpaper-${h.username}`:lr,theme:h?`coordinator-theme-${h.username}`:dr,accent:h?`coordinator-accent-${h.username}`:cr}),[b,c]=a.useState(()=>{const h=s(r),g=localStorage.getItem(h.wallpaper);if(g){const n=ge.find(x=>x.id===g);if(n)return n}return ge[0]}),[f,p]=a.useState(()=>{const h=s(r);return localStorage.getItem(h.theme)||"dark"}),[i,o]=a.useState(()=>{const h=s(r),g=localStorage.getItem(h.accent);if(g){const n=he.find(x=>x.id===g);if(n)return n}return he[0]});a.useEffect(()=>{const h=s(r),g=localStorage.getItem(h.wallpaper);if(g){const u=ge.find(N=>N.id===g);u&&c(u)}else r||c(ge[0]);const n=localStorage.getItem(h.theme);p(n||"dark");const x=localStorage.getItem(h.accent);if(x){const u=he.find(N=>N.id===x);u&&o(u)}else o(he[0])},[r]);const m=h=>{c(h),localStorage.setItem(s(r).wallpaper,h.id)},l=h=>{p(h),localStorage.setItem(s(r).theme,h)},d=h=>{o(h),localStorage.setItem(s(r).accent,h.id)};return a.useEffect(()=>{document.body.style.setProperty("--wallpaper-url",`url('${b.path}')`)},[b]),a.useEffect(()=>{document.documentElement.setAttribute("data-theme",f)},[f]),a.useEffect(()=>{const h=document.documentElement;h.style.setProperty("--accent-color",i.value);const g=(n,x=30)=>{const u=parseInt(n.slice(1),16),N=Math.max(0,(u>>16)-x),C=Math.max(0,(u>>8&255)-x),j=Math.max(0,(u&255)-x);return`#${(N<<16|C<<8|j).toString(16).padStart(6,"0")}`};h.style.setProperty("--accent-hover",g(i.value)),h.style.setProperty("--accent-gradient",`linear-gradient(135deg, ${i.value} 0%, ${g(i.value)} 100%)`)},[i]),e.jsx(Ke.Provider,{value:{wallpaper:b,setWallpaper:m,wallpapers:ge,theme:f,setTheme:l,accentColor:i,setAccentColor:d,accentColors:he},children:t})}const Tr=()=>a.useContext(Ke);function xr(){const{notifications:t,markAsRead:r,isOpen:s,setIsOpen:b}=Le(),c=a.useRef(null);if(a.useEffect(()=>{function i(o){c.current&&!c.current.contains(o.target)&&s&&b(!1)}return document.addEventListener("mousedown",i),()=>document.removeEventListener("mousedown",i)},[s,b]),!s)return null;const f=new Date().toLocaleDateString(),p=t.reduce((i,o)=>{const m=new Date(o.created_at).toLocaleDateString(),l=m===f?"Today":m;return i[l]||(i[l]=[]),i[l].push(o),i},{});return e.jsxs("div",{ref:c,className:"notification-center glass-panel",style:{position:"fixed",top:"38px",right:"10px",width:"320px",height:"calc(100vh - 140px)",zIndex:9e3,borderRadius:"12px",overflow:"hidden",display:"flex",flexDirection:"column",animation:"slideInRight 0.25s ease-out",border:"1px solid var(--glass-border)",background:"var(--glass-bg)",backdropFilter:"blur(20px)",boxShadow:"0 20px 50px rgba(0,0,0,0.3)"},children:[e.jsxs("div",{style:{padding:"12px 16px",borderBottom:"1px solid var(--glass-border)",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{style:{fontWeight:600,fontSize:"13px",color:"var(--text-primary)"},children:"Notifications"}),t.some(i=>!i.is_read)&&e.jsx("button",{onClick:()=>r(),style:{background:"none",border:"none",color:"var(--accent-color)",fontSize:"11px",fontWeight:500,cursor:"pointer"},children:"Mark all as read"})]}),e.jsx("div",{style:{flex:1,overflowY:"auto",padding:"0 10px"},children:Object.keys(p).length===0?e.jsx("div",{style:{padding:"40px 20px",textAlign:"center",color:"var(--text-secondary)",fontSize:"13px"},children:"No notifications"}):Object.entries(p).map(([i,o])=>e.jsxs("div",{children:[e.jsx("h4",{style:{margin:"16px 6px 8px",fontSize:"11px",fontWeight:600,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.5px"},children:i}),o.map(m=>e.jsxs("div",{onClick:()=>r(m.id),className:"notification-item",style:{padding:"10px",marginBottom:"6px",borderRadius:"8px",background:m.is_read?"transparent":"rgba(var(--accent-rgb), 0.1)",cursor:"pointer",transition:"background 0.2s",position:"relative"},children:[!m.is_read&&e.jsx("div",{style:{position:"absolute",left:"4px",top:"16px",width:"6px",height:"6px",borderRadius:"50%",background:"var(--accent-color)"}}),e.jsxs("div",{style:{paddingLeft:m.is_read?"0":"14px"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"2px"},children:[e.jsx("span",{style:{fontSize:"13px",fontWeight:500,color:"var(--text-primary)"},children:m.title}),e.jsx("span",{style:{fontSize:"10px",color:"var(--text-secondary)"},children:new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})})]}),e.jsx("p",{style:{fontSize:"12px",color:"var(--text-secondary)",margin:0,lineHeight:"1.4"},children:m.message})]})]},m.id))]},i))}),e.jsx("style",{children:`
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
            `})]})}function gr({student:t,onClose:r}){const s=a.useRef();return a.useEffect(()=>{const b=c=>{s.current&&!s.current.contains(c.target)&&r()};return document.addEventListener("mousedown",b),()=>document.removeEventListener("mousedown",b)},[r]),t?e.jsxs("div",{className:"student-modal-overlay",children:[e.jsx("div",{className:"modal glass-modal student-modal-card",ref:s,onClick:b=>b.stopPropagation(),style:{padding:0},children:e.jsxs("div",{style:{position:"relative",height:"100%",overflow:"hidden"},children:[e.jsx("button",{onClick:r,className:"student-modal-close-btn",children:"✕"}),e.jsx(Je,{student:t})]})}),e.jsx("style",{children:`
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
            `})]}):null}const hr=[{name:"Dashboard",path:"/dashboard",icon:"📊",description:"Overview & analytics"},{name:"Students",path:"/students",icon:"👥",description:"Student management"},{name:"Formation Groups",path:"/groups",icon:"🏘️",description:"Group management"},{name:"Attendance",path:"/attendance",icon:"📅",description:"Session attendance & check-in"},{name:"Weekly Reports",path:"/weekly-reports",icon:"📝",description:"Submit & view reports"},{name:"Checkpoints",path:"/checkpoints",icon:"🎯",description:"Discernment checkpoints"},{name:"Reports & Export",path:"/exports",icon:"📤",description:"Export data as CSV"},{name:"Settings",path:"/settings",icon:"⚙️",description:"App preferences"},{name:"Admin Panel",path:"/admin",icon:"🔧",description:"User management"},{name:"Audit Logs",path:"/audit",icon:"📋",description:"Activity history"}],be=["All","Students","Groups","Notes","Pages"];function ur(){const{isOpen:t,closeSpotlight:r}=Re(),[s,b]=a.useState(""),[c,f]=a.useState("All"),[p,i]=a.useState({students:[],groups:[],notes:[],pages:[]}),[o,m]=a.useState(!1),[l,d]=a.useState(0),[h,g]=a.useState(null),n=a.useRef(null),x=Q();a.useEffect(()=>{t&&(setTimeout(()=>{var y;return(y=n.current)==null?void 0:y.focus()},50),b(""),f("All"),i({students:[],groups:[],notes:[],pages:[]}),d(0))},[t]),a.useEffect(()=>{if(!s.trim()){i({students:[],groups:[],notes:[],pages:[]});return}const y=s.toLowerCase(),_=hr.filter(v=>v.name.toLowerCase().includes(y)||v.description.toLowerCase().includes(y)).map(v=>({...v,type:"page"})),E=setTimeout(async()=>{m(!0);try{const R=await(await fetch(`/api/data/search?q=${encodeURIComponent(s)}`)).json();R.success&&i({students:R.results.students||[],groups:R.results.groups||[],notes:R.results.notes||[],pages:_})}catch(v){console.error("Search error",v),i(R=>({...R,pages:_}))}finally{m(!1)}},250);return i(v=>({...v,pages:_})),()=>clearTimeout(E)},[s]);const u=(()=>{const y=[];return(c==="All"||c==="Pages")&&y.push(...p.pages),(c==="All"||c==="Students")&&y.push(...p.students),(c==="All"||c==="Groups")&&y.push(...p.groups),(c==="All"||c==="Notes")&&y.push(...p.notes),y})();a.useEffect(()=>{const y=_=>{if(t){if(_.key==="ArrowDown")_.preventDefault(),d(E=>(E+1)%Math.max(1,u.length));else if(_.key==="ArrowUp")_.preventDefault(),d(E=>(E-1+u.length)%Math.max(1,u.length));else if(_.key==="Enter")_.preventDefault(),u[l]&&N(u[l]);else if(_.key==="Tab"){_.preventDefault();const E=be.indexOf(c);f(be[(E+1)%be.length]),d(0)}}};return window.addEventListener("keydown",y),()=>window.removeEventListener("keydown",y)},[t,u,l,c]);const N=y=>{y.type==="student"?(g(y),r()):y.type==="group"?(r(),x("/groups")):y.type==="page"?(r(),x(y.path)):y.type==="note"&&(r(),y.student_id?x("/students"):y.group_id&&x("/groups"))},C=y=>y.type==="page"?y.icon:y.type==="student"?"👤":y.type==="group"?"🏘️":y.type==="note"?"📝":"📄",j=y=>{var _;return y.type==="student"?`${y.email||""} · ${y.celebration_point||""} · ${Math.round(y.percentage_completed||0)}%`:y.type==="group"?`${y.group_code} · ${y.member_count||0} members · ${y.facilitator_name||"No facilitator"}`:y.type==="note"?`${y.author_name} · ${(_=y.content)==null?void 0:_.slice(0,60)}...`:y.type==="page"?y.description:""},k=u.length;return!t&&!h?null:e.jsxs(e.Fragment,{children:[t&&e.jsx("div",{className:`spotlight-overlay ${s.trim()?"":"empty"}`,onClick:r,children:e.jsxs("div",{className:`spotlight ${s.trim()?"active":"empty"}`,onClick:y=>y.stopPropagation(),children:[e.jsxs("div",{className:"spotlight-head",children:[e.jsx("div",{className:"spotlight-search-well",children:e.jsxs("div",{className:"spotlight-search-bar",children:[e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",className:"search-icon",children:[e.jsx("circle",{cx:"11",cy:"11",r:"8"}),e.jsx("line",{x1:"21",y1:"21",x2:"16.65",y2:"16.65"})]}),e.jsx("input",{ref:n,type:"text",placeholder:"Spotlight Search",value:s,onChange:y=>{b(y.target.value),d(0)},className:"spotlight-input"}),s.trim()&&e.jsx("div",{className:"keyboard-hint",children:"esc"})]})}),e.jsxs("div",{className:"spotlight-quick-actions",children:[e.jsx("button",{className:"sq-btn",title:"Students",onClick:()=>{r(),x("/students")},children:e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M22 10v6M2 10l10-5 10 5-10 5z"}),e.jsx("path",{d:"M6 12v5c3 3 9 3 12 0v-5"})]})}),e.jsx("button",{className:"sq-btn",title:"Groups",onClick:()=>{r(),x("/groups")},children:e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"}),e.jsx("circle",{cx:"9",cy:"7",r:"4"}),e.jsx("path",{d:"M23 21v-2a4 4 0 0 0-3-3.87"}),e.jsx("path",{d:"M16 3.13a4 4 0 0 1 0 7.75"})]})}),e.jsx("button",{className:"sq-btn",title:"Weekly Reports",onClick:()=>{r(),x("/weekly-reports")},children:e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("line",{x1:"3",y1:"9",x2:"21",y2:"9"}),e.jsx("line",{x1:"9",y1:"21",x2:"9",y2:"9"})]})}),e.jsx("button",{className:"sq-btn",title:"Settings",onClick:()=>{r(),x("/settings")},children:e.jsxs("svg",{width:"22",height:"22",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"3"}),e.jsx("path",{d:"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"})]})})]})]}),s.trim()&&e.jsx("div",{className:"spotlight-tabs",children:be.map(y=>e.jsxs("button",{className:`spotlight-tab ${c===y?"active":""}`,onClick:()=>{f(y),d(0)},children:[y,y!=="All"&&e.jsx("span",{className:"tab-count",children:y==="Students"?p.students.length:y==="Groups"?p.groups.length:y==="Notes"?p.notes.length:p.pages.length})]},y))}),(o||k>0||s.trim())&&e.jsx("div",{className:"spotlight-results",children:o&&k===0?e.jsxs("div",{className:"spotlight-message",children:[e.jsx("div",{className:"spotlight-spinner"}),"Searching..."]}):k>0?e.jsxs(e.Fragment,{children:[(c==="All"||c==="Pages")&&p.pages.length>0&&e.jsxs("div",{className:"result-section",children:[e.jsx("div",{className:"section-label",children:"Pages"}),p.pages.map((y,_)=>{const E=u.indexOf(y);return e.jsxs("div",{className:`spotlight-item ${E===l?"active":""}`,onClick:()=>N(y),onMouseEnter:()=>d(E),children:[e.jsx("div",{className:"item-icon emoji",children:C(y)}),e.jsxs("div",{className:"item-info",children:[e.jsx("div",{className:"item-name",children:y.name}),e.jsx("div",{className:"item-meta",children:j(y)})]}),e.jsx("div",{className:"item-action",children:"↵"})]},`page-${_}`)})]}),(c==="All"||c==="Students")&&p.students.length>0&&e.jsxs("div",{className:"result-section",children:[e.jsx("div",{className:"section-label",children:"Students"}),p.students.map((y,_)=>{const E=u.indexOf(y);return e.jsxs("div",{className:`spotlight-item ${E===l?"active":""}`,onClick:()=>N(y),onMouseEnter:()=>d(E),children:[e.jsx("div",{className:"item-icon avatar",children:(y.name||"?").charAt(0)}),e.jsxs("div",{className:"item-info",children:[e.jsx("div",{className:"item-name",children:y.name}),e.jsx("div",{className:"item-meta",children:j(y)})]}),y.risk_score>=50&&e.jsx("span",{className:"risk-badge",children:"⚠️"}),e.jsx("div",{className:"item-action",children:"↵"})]},`student-${y.id}`)})]}),(c==="All"||c==="Groups")&&p.groups.length>0&&e.jsxs("div",{className:"result-section",children:[e.jsx("div",{className:"section-label",children:"Formation Groups"}),p.groups.map((y,_)=>{const E=u.indexOf(y);return e.jsxs("div",{className:`spotlight-item ${E===l?"active":""}`,onClick:()=>N(y),onMouseEnter:()=>d(E),children:[e.jsx("div",{className:"item-icon emoji",children:"🏘️"}),e.jsxs("div",{className:"item-info",children:[e.jsx("div",{className:"item-name",children:y.name}),e.jsx("div",{className:"item-meta",children:j(y)})]}),!y.active&&e.jsx("span",{className:"inactive-badge",children:"Inactive"}),e.jsx("div",{className:"item-action",children:"↵"})]},`group-${y.id}`)})]}),(c==="All"||c==="Notes")&&p.notes.length>0&&e.jsxs("div",{className:"result-section",children:[e.jsx("div",{className:"section-label",children:"Notes"}),p.notes.map((y,_)=>{const E=u.indexOf(y);return e.jsxs("div",{className:`spotlight-item ${E===l?"active":""}`,onClick:()=>N(y),onMouseEnter:()=>d(E),children:[e.jsx("div",{className:"item-icon emoji",children:"📝"}),e.jsxs("div",{className:"item-info",children:[e.jsx("div",{className:"item-name",children:y.author_name}),e.jsx("div",{className:"item-meta",children:j(y)})]}),e.jsx("div",{className:"item-action",children:"↵"})]},`note-${y.id}`)})]})]}):s.trim()&&!o?e.jsx("div",{className:"spotlight-message",children:"No results found"}):null}),e.jsxs("div",{className:"spotlight-footer",children:[e.jsxs("span",{className:"footer-hint",children:[e.jsx("kbd",{children:"↑↓"})," Navigate"]}),e.jsxs("span",{className:"footer-hint",children:[e.jsx("kbd",{children:"↵"})," Open"]}),e.jsxs("span",{className:"footer-hint",children:[e.jsx("kbd",{children:"Tab"})," Category"]}),e.jsxs("span",{className:"footer-hint",children:[e.jsx("kbd",{children:"Esc"})," Close"]})]})]})}),h&&e.jsx(gr,{student:h,onClose:()=>g(null),onStatusChange:()=>{}}),e.jsx("style",{children:`
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

                @media (max-width: 768px) {
                    .spotlight-overlay {
                        padding-top: 20px;
                        padding-left: 10px;
                        padding-right: 10px;
                    }
                    .spotlight-search-bar {
                        padding: 0 16px;
                    }
                    .spotlight-input {
                        font-size: 16px;
                    }
                    .spotlight-quick-actions {
                        gap: 8px;
                    }
                    .sq-btn {
                        width: 44px;
                        height: 44px;
                    }
                    .sq-btn svg {
                        width: 18px;
                        height: 18px;
                    }
                    .spotlight-tabs {
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }
                    .spotlight-tabs::-webkit-scrollbar {
                        display: none;
                    }
                    .spotlight-footer {
                        display: none; /* Hide keyboard hints on mobile */
                    }
                }
            `})]})}const mr=[{keys:["⌘","K"],description:"Spotlight Search",category:"Navigation"},{keys:["⌘","N"],description:"New Note (go to Students)",category:"Actions"},{keys:["⌘","E"],description:"Export Data",category:"Actions"},{keys:["⌘",","],description:"Open Settings",category:"Navigation"},{keys:["⌘","/"],description:"Keyboard Shortcuts",category:"Help"},{keys:["⌘","D"],description:"Dashboard",category:"Navigation"},{keys:["⌘","G"],description:"Formation Groups",category:"Navigation"},{keys:["Esc"],description:"Close overlay / modal",category:"General"}];function br(){const[t,r]=a.useState(!1),s=Q(),{toggleSpotlight:b}=Re(),{openSettings:c}=re(),{toggleCenter:f}=Le(),p=a.useCallback(o=>{const m=o.target.tagName.toLowerCase();if(m==="input"||m==="textarea"||m==="select")return;const l=o.metaKey||o.ctrlKey;if(l&&o.key==="k"){o.preventDefault(),b();return}if(l&&o.key==="n"){o.preventDefault(),s("/students");return}if(l&&o.key==="e"){o.preventDefault(),s("/exports");return}if(l&&o.key===","){o.preventDefault(),c();return}if(l&&o.key==="/"){o.preventDefault(),r(d=>!d);return}if(l&&o.key==="d"){o.preventDefault(),s("/dashboard");return}if(l&&o.key==="g"){o.preventDefault(),s("/groups");return}if(o.key==="Escape"&&t){r(!1);return}},[s,b,c,t,f]);if(a.useEffect(()=>(window.addEventListener("keydown",p),()=>window.removeEventListener("keydown",p)),[p]),!t)return null;const i={};return mr.forEach(o=>{i[o.category]||(i[o.category]=[]),i[o.category].push(o)}),e.jsxs("div",{className:"shortcuts-overlay",onClick:()=>r(!1),children:[e.jsxs("div",{className:"shortcuts-modal",onClick:o=>o.stopPropagation(),children:[e.jsxs("div",{className:"shortcuts-header",children:[e.jsx("h3",{children:"⌨️ Keyboard Shortcuts"}),e.jsx("button",{className:"shortcuts-close",onClick:()=>r(!1),children:"×"})]}),e.jsx("div",{className:"shortcuts-body",children:Object.entries(i).map(([o,m])=>e.jsxs("div",{className:"shortcut-category",children:[e.jsx("div",{className:"shortcut-cat-title",children:o}),m.map((l,d)=>e.jsxs("div",{className:"shortcut-row",children:[e.jsx("span",{className:"shortcut-desc",children:l.description}),e.jsx("span",{className:"shortcut-keys",children:l.keys.map((h,g)=>e.jsx("kbd",{children:h},g))})]},d))]},o))}),e.jsxs("div",{className:"shortcuts-footer",children:["Press ",e.jsx("kbd",{children:"⌘"}),e.jsx("kbd",{children:"/"})," to toggle this overlay"]})]}),e.jsx("style",{children:`
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
            `})]})}const _e=[{name:"yellow",bg:"#fff9c4",border:"#f9a825",text:"#5d4037"},{name:"pink",bg:"#fce4ec",border:"#e91e63",text:"#880e4f"},{name:"green",bg:"#e8f5e9",border:"#43a047",text:"#1b5e20"},{name:"blue",bg:"#e3f2fd",border:"#1e88e5",text:"#0d47a1"},{name:"purple",bg:"#f3e5f5",border:"#8e24aa",text:"#4a148c"}];function fr(){const[t,r]=a.useState(()=>{try{const i=localStorage.getItem("dashboard_stickies");return i?JSON.parse(i):[]}catch{return[]}}),[s,b]=a.useState(!1);a.useEffect(()=>{localStorage.setItem("dashboard_stickies",JSON.stringify(t))},[t]);const c=i=>{const o=_e.find(l=>l.name===i)||_e[0],m={id:Date.now(),text:"",color:o,x:60+Math.random()*100,y:80+Math.random()*80,width:200,height:180};r(l=>[...l,m]),b(!1)},f=(i,o)=>{r(m=>m.map(l=>l.id===i?{...l,...o}:l))},p=i=>{r(o=>o.filter(m=>m.id!==i))};return e.jsxs("div",{className:"stickies-layer",children:[e.jsxs("div",{className:"stickies-add-container",children:[e.jsx("button",{className:"stickies-add-btn",onClick:()=>b(!s),title:"Add Sticky Note",children:s?"×":"+"}),s&&e.jsx("div",{className:"stickies-color-menu",children:_e.map(i=>e.jsx("button",{className:"stickies-color-swatch",style:{background:i.bg,borderColor:i.border},onClick:()=>c(i.name),title:i.name},i.name))})]}),t.map(i=>e.jsx(yr,{note:i,onUpdate:o=>f(i.id,o),onDelete:()=>p(i.id)},i.id)),e.jsx("style",{children:`
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
            `})]})}function yr({note:t,onUpdate:r,onDelete:s}){const b=a.useRef(null),[c,f]=a.useState(!1),[p,i]=a.useState({x:0,y:0}),[o,m]=a.useState(!t.text),l=a.useCallback(d=>{d.target.tagName==="TEXTAREA"||d.target.tagName==="BUTTON"||(f(!0),i({x:d.clientX-t.x,y:d.clientY-t.y}))},[t.x,t.y]);return a.useEffect(()=>{if(!c)return;const d=g=>{r({x:Math.max(0,g.clientX-p.x),y:Math.max(32,g.clientY-p.y)})},h=()=>f(!1);return window.addEventListener("mousemove",d),window.addEventListener("mouseup",h),()=>{window.removeEventListener("mousemove",d),window.removeEventListener("mouseup",h)}},[c,p,r]),e.jsxs("div",{ref:b,className:"sticky-note",style:{left:t.x,top:t.y,width:t.width,minHeight:t.height,background:t.color.bg,borderColor:t.color.border,color:t.color.text,zIndex:c?200:100,cursor:c?"grabbing":"default"},onMouseDown:l,children:[e.jsxs("div",{className:"sticky-titlebar",style:{borderBottomColor:t.color.border+"33"},children:[e.jsx("button",{className:"sticky-close",style:{background:t.color.border},onClick:s,title:"Delete sticky",children:"×"}),e.jsx("div",{className:"sticky-drag-hint",style:{cursor:"grab"},children:"⋮⋮"})]}),e.jsx("textarea",{className:"sticky-textarea",value:t.text,onChange:d=>r({text:d.target.value}),placeholder:"Type a note...",autoFocus:o,onFocus:()=>m(!0),onBlur:()=>m(!1),style:{color:t.color.text}}),e.jsx("style",{children:`
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
            `})]})}function vr(){const t=fe(),r=Q();return a.useEffect(()=>{if(t.pathname!=="/login"){const s={path:t.pathname,search:t.search,scroll:window.scrollY,timestamp:Date.now()};localStorage.setItem("handoff_session",JSON.stringify(s))}},[t.pathname,t.search]),a.useEffect(()=>{let s;const b=()=>{clearTimeout(s),s=setTimeout(()=>{const c=localStorage.getItem("handoff_session");if(c){const f=JSON.parse(c);f.scroll=window.scrollY,localStorage.setItem("handoff_session",JSON.stringify(f))}},200)};return window.addEventListener("scroll",b,{passive:!0}),()=>{clearTimeout(s),window.removeEventListener("scroll",b)}},[]),a.useEffect(()=>{const s=localStorage.getItem("handoff_session");if(s)try{const b=JSON.parse(s);Date.now()-b.timestamp<24*60*60*1e3&&b.path!==t.pathname&&(r(b.path+(b.search||""),{replace:!0}),setTimeout(()=>{window.scrollTo(0,b.scroll||0)},100))}catch{}},[]),null}const jr=[{name:"Dashboard",path:"/dashboard",icon:"📊",color:"#667eea"},{name:"Students",path:"/students",icon:"👥",color:"#10b981"},{name:"Groups",path:"/groups",icon:"🏘️",color:"#f59e0b"},{name:"Attendance",path:"/attendance",icon:"📅",color:"#f6d365"},{name:"Weekly Reports",path:"/weekly-reports",icon:"📝",color:"#8b5cf6"},{name:"Checkpoints",path:"/checkpoints",icon:"🎯",color:"#ef4444"},{name:"Exports",path:"/exports",icon:"📤",color:"#06b6d4"},{name:"Admin",path:"/admin",icon:"🔧",color:"#6366f1"},{name:"Audit Logs",path:"/audit",icon:"📋",color:"#ec4899"},{name:"Import",path:"/import",icon:"📥",color:"#14b8a6"},{name:"Settings",path:"/settings",icon:"⚙️",color:"#64748b"},{name:"Tech Support",path:"/tech-support",icon:"🛠️",color:"#f97316"}];function kr(){const[t,r]=a.useState(!1),[s,b]=a.useState(""),c=Q();if(a.useEffect(()=>{const i=o=>{o.key==="F4"&&(o.preventDefault(),r(m=>!m),b("")),o.key==="Escape"&&t&&r(!1)};return window.addEventListener("keydown",i),()=>window.removeEventListener("keydown",i)},[t]),!t)return null;const f=jr.filter(i=>i.name.toLowerCase().includes(s.toLowerCase())),p=i=>{r(!1),c(i)};return e.jsxs("div",{className:"launchpad-overlay",onClick:()=>r(!1),children:[e.jsxs("div",{className:"launchpad-content",onClick:i=>i.stopPropagation(),children:[e.jsx("div",{className:"launchpad-search",children:e.jsx("input",{type:"text",placeholder:"Search...",value:s,onChange:i=>b(i.target.value),autoFocus:!0})}),e.jsx("div",{className:"launchpad-grid",children:f.map(i=>e.jsxs("button",{className:"launchpad-app",onClick:()=>p(i.path),children:[e.jsx("div",{className:"launchpad-icon",style:{background:`linear-gradient(135deg, ${i.color}, ${i.color}dd)`},children:i.icon}),e.jsx("span",{className:"launchpad-app-name",children:i.name})]},i.path))}),e.jsx("div",{className:"launchpad-dots",children:e.jsx("span",{className:"launchpad-dot active"})})]}),e.jsx("style",{children:`
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
            `})]})}const wr=[{name:"Dashboard",path:"/dashboard",icon:"📊",desc:"Analytics & overview",color:"rgba(99,102,241,0.2)"},{name:"Students",path:"/students",icon:"👥",desc:"Student management",color:"rgba(16,185,129,0.2)"},{name:"Formation Groups",path:"/groups",icon:"🏘️",desc:"Group management",color:"rgba(245,158,11,0.2)"},{name:"Attendance",path:"/attendance",icon:"📅",desc:"Session tracking",color:"rgba(246,211,101,0.2)"},{name:"Weekly Reports",path:"/weekly-reports",icon:"📝",desc:"Weekly submissions",color:"rgba(139,92,246,0.2)"},{name:"Checkpoints",path:"/checkpoints",icon:"🎯",desc:"Discernment tracking",color:"rgba(239,68,68,0.2)"},{name:"Export Data",path:"/exports",icon:"📤",desc:"Reports & CSV",color:"rgba(6,182,212,0.2)"},{name:"Audit Logs",path:"/audit",icon:"📋",desc:"Activity history",color:"rgba(236,72,153,0.2)"},{name:"Admin Panel",path:"/admin",icon:"🔧",desc:"User management",color:"rgba(99,102,241,0.2)"}];function Sr(){const[t,r]=a.useState(!1),s=Q(),b=fe();if(a.useEffect(()=>{const f=p=>{p.ctrlKey&&p.key==="ArrowUp"&&(p.preventDefault(),r(i=>!i)),p.key==="Escape"&&t&&r(!1)};return window.addEventListener("keydown",f),()=>window.removeEventListener("keydown",f)},[t]),!t)return null;const c=f=>{r(!1),s(f)};return e.jsxs("div",{className:"mc-overlay",onClick:()=>r(!1),children:[e.jsxs("div",{className:"mc-content",onClick:f=>f.stopPropagation(),children:[e.jsxs("div",{className:"mc-header",children:[e.jsx("h2",{children:"Mission Control"}),e.jsx("span",{className:"mc-hint",children:"Click a section to navigate · Press Esc to close"})]}),e.jsx("div",{className:"mc-desktops",children:e.jsx("div",{className:"mc-desktop-thumb active",children:e.jsx("span",{children:"Current View"})})}),e.jsx("div",{className:"mc-grid",children:wr.map(f=>e.jsxs("button",{className:`mc-card ${b.pathname===f.path?"mc-card-active":""}`,onClick:()=>c(f.path),children:[e.jsx("div",{className:"mc-card-preview",style:{background:f.color},children:e.jsx("span",{className:"mc-card-icon",children:f.icon})}),e.jsxs("div",{className:"mc-card-info",children:[e.jsx("span",{className:"mc-card-name",children:f.name}),e.jsx("span",{className:"mc-card-desc",children:f.desc})]}),b.pathname===f.path&&e.jsx("div",{className:"mc-card-indicator",children:"●"})]},f.path))})]}),e.jsx("style",{children:`
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
            `})]})}const Z=["Bbira","Bugolobi","Bweyogerere","Downtown","Entebbe","Nakwero","Gulu","Jinja","Juba","Kansanga","Kyengera","Laminadera","Lubowa","Mbarara","Mukono","Nansana","Ntinda","Online","Suubi"];function Nr(){const{user:t,loading:r,toasts:s}=H();return a.useEffect(()=>{t&&fetch("/api/data/students").catch(b=>console.debug("Cache warmup background fetch",b))},[t]),r?e.jsx("div",{className:"login-container",children:e.jsx("div",{className:"spinner"})}):e.jsx(pr,{children:e.jsx(Ct,{children:e.jsx(_t,{children:e.jsxs(Tt,{children:[e.jsx("div",{className:"mesh-background"}),e.jsx(xr,{}),e.jsx(ur,{}),e.jsx(br,{}),e.jsx(fr,{}),e.jsx(vr,{}),e.jsx(kr,{}),e.jsx(Sr,{}),e.jsxs(bt,{children:[e.jsx(J,{path:"/login",element:t?e.jsx(V,{to:"/dashboard"}):e.jsx(jt,{})}),t&&e.jsxs(J,{element:e.jsx(Ft,{}),children:[e.jsx(J,{path:"/dashboard",element:e.jsx(Ot,{})}),e.jsx(J,{path:"/students",element:["Admin","LeadershipTeam","Pastor","Coordinator","TechSupport"].includes(t.role)?e.jsx(Ut,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(J,{path:"/admin",element:["Admin","TechSupport"].includes(t.role)?e.jsx(Yt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(J,{path:"/audit",element:["Admin","LeadershipTeam"].includes(t.role)?e.jsx(Jt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(J,{path:"/reports",element:["Admin","LeadershipTeam","Pastor"].includes(t.role)?e.jsx(Kt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(J,{path:"/import",element:["Admin","Coordinator"].includes(t.role)?e.jsx(Vt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(J,{path:"/groups",element:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator"].includes(t.role)?e.jsx(Qt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(J,{path:"/attendance",element:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator"].includes(t.role)?e.jsx(window.__ATTENDANCE_ADDON__.AttendanceDashboard,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(J,{path:"/weekly-reports",element:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator","TechSupport"].includes(t.role)?e.jsx(Xt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(J,{path:"/settings",element:t.role==="Admin"?e.jsx(Zt,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(J,{path:"/checkpoints",element:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator","TechSupport"].includes(t.role)?e.jsx(er,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(J,{path:"/tech-support",element:["Admin","TechSupport"].includes(t.role)?e.jsx(ar,{}):e.jsx(V,{to:"/dashboard"})}),e.jsx(J,{path:"/exports",element:["Admin","LeadershipTeam","Pastor","Coordinator","Facilitator","TechSupport"].includes(t.role)?e.jsx(nr,{}):e.jsx(V,{to:"/dashboard"})})]}),e.jsx(J,{path:"*",element:e.jsx(V,{to:t?"/dashboard":"/login"})})]}),e.jsx(ir,{toasts:s})]})})})})}class Cr extends Ge.Component{constructor(r){super(r),this.state={hasError:!1,error:null,errorInfo:null}}static getDerivedStateFromError(r){return{hasError:!0}}componentDidCatch(r,s){this.setState({error:r,errorInfo:s}),console.error("Uncaught error:",r,s)}render(){return this.state.hasError?e.jsxs("div",{style:{padding:"20px",color:"white",background:"#333",minHeight:"100vh",fontFamily:"monospace"},children:[e.jsx("h1",{children:"⚠️ Something went wrong."}),e.jsxs("details",{style:{whiteSpace:"pre-wrap"},children:[this.state.error&&this.state.error.toString(),e.jsx("br",{}),this.state.errorInfo&&this.state.errorInfo.componentStack]}),e.jsx("button",{onClick:()=>window.location.reload(),style:{marginTop:"20px",padding:"10px 20px",background:"#007bff",color:"white",border:"none",borderRadius:"5px",cursor:"pointer"},children:"Reload Page"}),e.jsx("button",{onClick:()=>window.location.href="/login",style:{marginTop:"20px",marginLeft:"10px",padding:"10px 20px",background:"#6c757d",color:"white",border:"none",borderRadius:"5px",cursor:"pointer"},children:"Go to Login"})]}):this.props.children}}Te.createRoot(document.getElementById("root")).render(e.jsx(Ge.StrictMode,{children:e.jsx(Cr,{children:e.jsx(ft,{children:e.jsx(vt,{children:e.jsx(Nr,{})})})})}));export{he as A,Ht as P,ge as W,Tr as a,H as u};
//# sourceMappingURL=index-BosXJrON.js.map
