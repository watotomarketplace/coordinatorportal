
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
      background: "var(--glass-layer-2, var(--glass-bg))",
      backdropFilter: "var(--blur-layer-2, blur(20px))",
      WebkitBackdropFilter: "var(--blur-layer-2, blur(20px))",
      border: "var(--border-layer-2, 1px solid var(--glass-border))",
      borderRadius: 16,
      overflow: "hidden",
      marginTop: 20,
      boxShadow: "var(--shadow-layer-2, 0 4px 16px rgba(0,0,0,0.15))"
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
        padding: "12px 18px",
        borderRadius: 16,
        fontSize: 13,
        fontWeight: 600,
        background: "var(--glass-layer-4, rgba(30,30,40,0.98))",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        border: "var(--border-layer-2, 1px solid rgba(255,255,255,0.1))",
        color: toast.type === "error" ? "#ff453a" : "#30d158",
        boxShadow: "var(--shadow-layer-3, 0 8px 32px rgba(0,0,0,0.4))",
        display: "flex",
        alignItems: "center",
        gap: 8
      }, children: [
        toast.type === "error" ? "\u274C" : "\u2705",
        " ",
        toast.msg
      ] }),
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
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
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
                background: "var(--glass-layer-4, rgba(30,30,40,0.98))",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                border: "var(--border-layer-2, 1px solid rgba(255,255,255,0.12))",
                borderRadius: "20px 20px 0 0",
                padding: "20px 20px 32px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "var(--shadow-layer-4, 0 -10px 40px rgba(0,0,0,0.3))"
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
