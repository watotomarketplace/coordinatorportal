
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
  var import_react_router_dom = __require("react-router-dom");

  // src/components/AttendanceDashboard.jsx
  var React = __toESM(__require("react"), 1);

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
  function AttendanceDashboard() {
    const [user, setUser] = React.useState(null);
    const [groups, setGroups] = React.useState([]);
    const [selectedGroupId, setSelectedGroupId] = React.useState(null);
    const [selectedGroupName, setSelectedGroupName] = React.useState("");
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
      async function init() {
        try {
          const sessionRes = await fetch("/api/auth/session");
          const sessionData = await sessionRes.json();
          if (!sessionData.success || !sessionData.user) {
            setError("Not authenticated");
            return;
          }
          const currentUser = sessionData.user;
          setUser(currentUser);
          const groupsRes = await fetch("/api/formation-groups");
          const groupsData = await groupsRes.json();
          const availableGroups = groupsData.success ? groupsData.groups || [] : [];
          setGroups(availableGroups);
          const urlParams = new URLSearchParams(window.location.search);
          const deepLinkId = urlParams.get("groupId");
          if (deepLinkId) {
            const group = availableGroups.find((g) => String(g.id) === String(deepLinkId));
            if (group) {
              setSelectedGroupId(group.id);
              setSelectedGroupName(`${group.group_code} \u2014 ${group.name}`);
              return;
            }
          }
          if (currentUser.role === "Facilitator" && availableGroups.length > 0) {
            setSelectedGroupId(availableGroups[0].id);
            setSelectedGroupName(`${availableGroups[0].group_code} \u2014 ${availableGroups[0].name}`);
          }
        } catch (err) {
          setError("Failed to load attendance data");
          console.error("AttendanceDashboard init error:", err);
        } finally {
          setLoading(false);
        }
      }
      init();
    }, []);
    const handleGroupChange = (e) => {
      const id = e.target.value;
      if (!id) {
        setSelectedGroupId(null);
        setSelectedGroupName("");
        return;
      }
      const group = groups.find((g) => String(g.id) === String(id));
      setSelectedGroupId(Number(id));
      setSelectedGroupName(group ? `${group.group_code} \u2014 ${group.name}` : "");
    };
    if (loading) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "tahoe-page", style: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "2px solid #4A9EFF",
        borderTopColor: "transparent",
        animation: "spin 0.8s linear infinite"
      } }) });
    }
    if (error) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "tahoe-page", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { padding: "16px 20px", borderRadius: 12, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }, children: error }) });
    }
    const showGroupSelector = user && user.role !== "Facilitator";
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "tahoe-page", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { style: { margin: 0, fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.95)" }, children: "Attendance" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 13 }, children: "Track member-level attendance across group sessions" })
        ] }),
        showGroupSelector && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "select",
          {
            value: selectedGroupId || "",
            onChange: handleGroupChange,
            style: {
              backgroundColor: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              color: "white",
              padding: "9px 14px",
              fontSize: 14,
              minWidth: 220,
              outline: "none",
              cursor: "pointer"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: "\u2014 Select a Group \u2014" }),
              groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("option", { value: g.id, children: [
                g.group_code,
                " \u2014 ",
                g.name
              ] }, g.id))
            ]
          }
        )
      ] }),
      !selectedGroupId ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 320,
        gap: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 40
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 48 }, children: "\u{1F4C5}" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 15 }, children: showGroupSelector ? "Select a group above to view attendance" : "No formation group assigned" }),
        showGroupSelector && groups.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { margin: 0, color: "rgba(255,255,255,0.3)", fontSize: 13 }, children: "No groups found for your campus" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        GroupAttendance,
        {
          groupId: selectedGroupId,
          groupName: selectedGroupName,
          currentUser: user || {}
        },
        selectedGroupId
      )
    ] });
  }

  // src/components/index.jsx
  window.__ATTENDANCE_ADDON__ = {
    AttendanceDashboard,
    GroupAttendance
  };
})();
