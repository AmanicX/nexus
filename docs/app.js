(function () {
  var root = document.documentElement;

  var GROUNDS = {
    cobalt: { bg: "#0034eb", ink: "#ffffff" },
    surface: { bg: "#002fd6", ink: "#ffffff" },
    deep: { bg: "#001c94", ink: "#ffffff" },
    paper: { bg: "#eef0f4", ink: "#06070d" },
    accent: { bg: "#e9e34a", ink: "#111111" }
  };

  var TOKEN = /\(\s*([^()]*?)\s*\)(\s*:\s*([A-Za-z][A-Za-z' ]{0,23}))?|"([^"]*)"(\s*:\s*([A-Za-z][A-Za-z' ]{0,23}))?|<([^<>]*)>|\[([^\[\]]*)\]/g;

  function labels() {
    return document.querySelectorAll("[data-reveal]");
  }

  function reveal() {
    var items = labels();
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });

    Array.prototype.forEach.call(items, function (el) {
      var d = el.getAttribute("data-delay");
      if (d) el.style.setProperty("--delay", d + "ms");
      io.observe(el);
    });

    var bands = document.querySelectorAll(".band");
    var bio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        bio.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.15 });
    Array.prototype.forEach.call(bands, function (el) { bio.observe(el); });
  }

  function chapterColour() {
    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-ground]"));
    if (!sections.length) return;
    var last = "";
    var tick = function () {
      var y = 69;
      var hit = null;
      for (var i = 0; i < sections.length; i++) {
        var r = sections[i].getBoundingClientRect();
        if (r.top <= y && r.bottom > y) hit = sections[i];
      }
      if (!hit) hit = sections[0];
      var name = hit.getAttribute("data-ground");
      if (name === last) return;
      last = name;
      var g = GROUNDS[name];
      if (!g) return;
      root.style.setProperty("--chapter-bg", g.bg);
      root.style.setProperty("--chapter-ink", g.ink);
    };
    var queued = false;
    var onScroll = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; tick(); });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    tick();
  }

  function commands() {
    var filter = document.getElementById("cmd-filter");
    var rowList = Array.prototype.slice.call(document.querySelectorAll(".cmd-row"));
    if (!rowList.length) return;

    var select = function (row) {
      rowList.forEach(function (r) {
        var on = r === row;
        r.classList.toggle("is-on", on);
        r.setAttribute("aria-pressed", on ? "true" : "false");
      });
    };

    rowList.forEach(function (r) {
      r.addEventListener("click", function () { select(r); });
    });

    if (!filter) return;

    var visible = function () { return rowList.filter(function (r) { return !r.hidden; }); };

    filter.addEventListener("input", function () {
      var q = filter.value.trim().toLowerCase();
      rowList.forEach(function (r) {
        var name = r.querySelector(".cmd-name");
        var say = r.querySelector(".cmd-say");
        var hay = (r.getAttribute("data-k") || "") + " " + (name ? name.textContent : "") + " " + (say ? say.textContent : "");
        r.hidden = q.length > 0 && hay.toLowerCase().indexOf(q) === -1;
      });
      var list = visible();
      if (list.length) select(list[0]);
    });

    filter.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      var list = visible();
      if (!list.length) return;
      event.preventDefault();
      var current = list.findIndex(function (r) { return r.classList.contains("is-on"); });
      var next = event.key === "ArrowDown" ? current + 1 : current - 1;
      if (next < 0) next = list.length - 1;
      if (next >= list.length) next = 0;
      select(list[next]);
    });
  }

  function showcase() {
    var input = document.getElementById("show-input");
    var answer = document.getElementById("show-answer");
    var caret = document.querySelector(".show-caret");
    if (!input || !answer) return;

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");

    var placeCaret = function () {
      if (!caret) return;
      var cs = getComputedStyle(input);
      ctx.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
      var w = ctx.measureText(input.value).width;
      var max = input.parentElement.clientWidth - 10;
      if (w > max) w = max;
      caret.style.transform = "translateX(" + Math.round(w + 4) + "px)";
    };

    var render = function () {
      var text = input.value;
      var out = [];
      var m;
      TOKEN.lastIndex = 0;
      while ((m = TOKEN.exec(text)) !== null) {
        if (m[1] != null) out.push({ tag: m[3] ? m[3].trim() : "thought", body: "(" + m[1] + ")", mute: !m[3] });
        else if (m[4] != null) out.push({ tag: m[6] ? m[6].trim() : "you", body: '"' + m[4] + '"', mute: false });
        else if (m[7] != null) out.push({ tag: "god", body: "<" + m[7] + ">", mute: true });
        else if (m[8] != null) out.push({ tag: "world", body: "[" + m[8] + "]", mute: true });
        if (out.length >= 6) break;
      }
      if (!out.length) out.push({ tag: "you", body: text.trim() || "start a scene", mute: false });

      answer.textContent = "";
      out.forEach(function (line, i) {
        var p = document.createElement("p");
        p.className = "sline sline--l" + i + (line.mute ? " sline--think" : "");
        var tag = document.createElement("span");
        tag.className = "stag";
        tag.textContent = line.tag;
        var body = document.createElement("span");
        body.className = "stxt";
        body.textContent = line.body;
        p.appendChild(tag);
        p.appendChild(body);
        answer.appendChild(p);
      });
      Array.prototype.forEach.call(answer.children, function (el, i) {
        el.style.animationDelay = i * 70 + "ms";
        el.classList.add("is-on");
      });
      placeCaret();
    };

    input.addEventListener("input", render);
    Array.prototype.forEach.call(document.querySelectorAll(".show-ex"), function (btn) {
      btn.addEventListener("click", function () {
        input.value = btn.getAttribute("data-fill") || "";
        render();
        input.focus();
      });
    });

    render();
  }

  function copyButton() {
    var copy = document.querySelector(".copy");
    if (!copy) return;
    copy.addEventListener("click", function () {
      var text = copy.getAttribute("data-copy") || "";
      var done = function () {
        copy.textContent = "Copied";
        window.setTimeout(function () { copy.textContent = "Copy"; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      }
    });
  }

  function start() {
    try {
      var ok = "IntersectionObserver" in window;
      reveal();
      if (ok) root.classList.add("is-ready");
      chapterColour();
      commands();
      showcase();
      copyButton();
    } catch (error) {
      root.classList.remove("is-ready");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
