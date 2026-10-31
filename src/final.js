import "@fontsource-variable/manrope";
import "@fontsource-variable/source-serif-4";
import "./final.css";

document.documentElement.classList.add("js");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Header e navegação móvel --------------------------------------------------

const siteHeader = document.querySelector("[data-site-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileNavigation = document.querySelector("[data-mobile-nav]");

const updateHeader = () => {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 24);
};

// No próximo quadro: ler scrollY logo depois de trocar a classe "js" obrigaria o navegador a
// recalcular a página inteira de uma vez, no meio do carregamento.
requestAnimationFrame(updateHeader);
window.addEventListener("scroll", updateHeader, { passive: true });

// O menu móvel é o guia da página. Abre pelo botão do topo ou pelo "Seções" da barra
// inferior (ao alcance do polegar); os dois refletem o mesmo estado.
const guideToggle = document.querySelector("[data-guide-toggle]");
let menuOpener = null;

const setMenu = (open, opener = null) => {
  if (!menuToggle || !mobileNavigation) return;
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  guideToggle?.setAttribute("aria-expanded", String(open));
  mobileNavigation.hidden = !open;
  document.body.classList.toggle("menu-open", open);
  siteHeader?.classList.toggle("is-menu-open", open);
  if (open) {
    menuOpener = opener;
    // Aberto pela barra inferior, o foco vai direto para a seção em que a pessoa está.
    if (opener === guideToggle) (mobileNavigation.querySelector('[aria-current="location"]') ?? mobileNavigation.querySelector("a"))?.focus();
  }
};

const closeMenu = () => setMenu(false);

menuToggle?.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true", menuToggle));
guideToggle?.addEventListener("click", () => setMenu(true, guideToggle));

mobileNavigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || mobileNavigation?.hidden !== false) return;
  closeMenu();
  (menuOpener ?? menuToggle)?.focus();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 1050) closeMenu();
});

// Onde a pessoa está: a seção que cruza o meio da tela fica marcada no guia, no menu do
// topo e no contador do botão "Seções".
const guideLinks = [...document.querySelectorAll("[data-guide-link]")];
const guideCount = document.querySelector("[data-guide-count]");
const chapters = guideLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);

if (chapters.length && "IntersectionObserver" in window) {
  const navLinks = [...guideLinks, ...document.querySelectorAll(".desktop-nav a[href^='#']")];
  const mark = (id) => {
    navLinks.forEach((link) => {
      if (link.getAttribute("href") === `#${id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    const index = chapters.findIndex((chapter) => chapter.id === id);
    if (guideCount && index >= 0) guideCount.textContent = `${String(index + 1).padStart(2, "0")}/${chapters.length}`;
  };
  const spy = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && mark(entry.target.id)),
    { rootMargin: "-45% 0px -54% 0px" },
  );
  chapters.forEach((chapter) => spy.observe(chapter));
}

// Mantém âncoras precisas mesmo com seções extensas renderizadas sob demanda.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href");
    if (!id || id === "#") return;

    const target = document.querySelector(id);
    if (!target) return;

    event.preventDefault();
    history.pushState(null, "", id);
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });

    const stabilizePosition = () => {
      const desiredTop = id === "#inicio" ? 0 : (siteHeader?.offsetHeight ?? 72) + 12;
      const difference = target.getBoundingClientRect().top - desiredTop;
      if (Math.abs(difference) < 3) return;

      const previousBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollBy(0, difference);
      document.documentElement.style.scrollBehavior = previousBehavior;
    };

    window.setTimeout(stabilizePosition, reducedMotion ? 0 : 700);
    window.setTimeout(stabilizePosition, reducedMotion ? 80 : 1450);
  });
});

// Revelação progressiva -----------------------------------------------------

const revealItems = [...document.querySelectorAll(".reveal")];

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -6%" },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

// Contadores de autoridade -------------------------------------------------

const counterElements = [...document.querySelectorAll("[data-counter]")];

const formatCounter = (value) => new Intl.NumberFormat("pt-BR").format(Math.round(value));

const runCounter = (element) => {
  const target = Number(element.dataset.counter);
  if (!Number.isFinite(target)) return;

  if (reducedMotion) {
    element.textContent = formatCounter(target);
    return;
  }

  const startedAt = performance.now();
  const duration = 1250;

  const frame = (now) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    element.textContent = formatCounter(target * eased);
    if (progress < 1) requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
};

const authoritySection = document.querySelector("#autoridade");
if (authoritySection && counterElements.length) {
  if (!("IntersectionObserver" in window)) {
    counterElements.forEach(runCounter);
  } else {
    const counterObserver = new IntersectionObserver(
      ([entry], observer) => {
        if (!entry.isIntersecting) return;
        counterElements.forEach(runCounter);
        observer.disconnect();
      },
      { threshold: 0.25 },
    );
    counterObserver.observe(authoritySection);
  }
}

// Demonstração acessível da plataforma -------------------------------------

document.querySelectorAll("[data-product-tabs]").forEach((tabsRoot) => {
  const tabs = [...tabsRoot.querySelectorAll("[data-product-tab]")];
  const panels = [...tabsRoot.querySelectorAll("[data-product-panel]")];

  const activateTab = (tab, moveFocus = false) => {
    const selectedId = tab.dataset.productTab;

    tabs.forEach((item) => {
      const isSelected = item === tab;
      item.setAttribute("aria-selected", String(isSelected));
      item.tabIndex = isSelected ? 0 : -1;
    });

    panels.forEach((panel) => {
      const isSelected = panel.dataset.productPanel === selectedId;
      panel.hidden = !isSelected;
      panel.classList.toggle("is-active", isSelected);
    });

    if (moveFocus) tab.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      let nextIndex;

      if (["ArrowRight", "ArrowDown"].includes(event.key)) nextIndex = (index + 1) % tabs.length;
      if (["ArrowLeft", "ArrowUp"].includes(event.key)) nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;

      if (nextIndex === undefined) return;
      event.preventDefault();
      activateTab(tabs[nextIndex], true);
      tabs[nextIndex].scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
    });
  });
});

// Raio-X do edifício: cada pavimento abre o seu painel --------------------

document.querySelectorAll("[data-xray]").forEach((stage) => {
  const floors = [...stage.querySelectorAll("[data-xray-floor]")];
  const panels = [...stage.querySelectorAll("[data-xray-panel]")];

  const select = (floor) => {
    floors.forEach((item) => {
      const isSelected = item === floor;
      item.classList.toggle("is-selected", isSelected);
      item.setAttribute("aria-pressed", String(isSelected));
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.xrayPanel !== floor.dataset.xrayFloor;
    });
  };

  floors.forEach((floor) => floor.addEventListener("click", () => select(floor)));
});

// Diagnóstico rápido: tudo calculado aqui, nada é enviado -----------------

const checkForm = document.querySelector("[data-check]");

if (checkForm) {
  const questions = [...checkForm.querySelectorAll("[data-check-question]")];
  const bar = checkForm.querySelector("[data-check-bar]");
  const count = checkForm.querySelector("[data-check-count]");
  const result = checkForm.querySelector("[data-check-result]");
  const scoreRing = checkForm.querySelector(".check-score");
  const scoreValue = checkForm.querySelector("[data-check-score]");
  const title = checkForm.querySelector("[data-check-title]");
  const text = checkForm.querySelector("[data-check-text]");
  const list = checkForm.querySelector("[data-check-list]");
  const unknownNote = checkForm.querySelector("[data-check-unknown]");
  const cta = checkForm.querySelector("[data-check-cta]");
  let summary = "";

  const update = () => {
    const answers = questions.map((question) => ({
      question,
      value: question.querySelector("input:checked")?.value,
    }));
    const answered = answers.filter((answer) => answer.value);
    questions.forEach((question, index) => question.classList.toggle("is-answered", Boolean(answers[index].value)));

    bar?.style.setProperty("--progress", String(answered.length / questions.length));
    count.textContent = `${answered.length} de ${questions.length} respondidas`;
    if (answered.length < questions.length) return;

    const pending = answers.filter((answer) => answer.value !== "sim");
    const unknown = pending.filter((answer) => answer.value === "nsei");
    const score = questions.length - pending.length;

    scoreValue.textContent = String(score);
    scoreRing.style.setProperty("--score", String(score / questions.length));
    scoreRing.style.setProperty("--score-color", score === questions.length ? "#2eb07c" : score >= 4 ? "#e0a530" : "#e0564f");

    if (pending.length === 0) {
      title.textContent = "Seu prédio está em dia.";
      text.textContent = "Raro e valioso. O Fremon mantém essa cadência e guarda as evidências para quando alguém perguntar.";
    } else if (score >= 4) {
      title.textContent = `Quase lá: ${pending.length === 1 ? "um ponto de atenção" : `${pending.length} pontos de atenção`}.`;
      text.textContent = "Pouca coisa separa o seu prédio de uma gestão sem sustos, e é justamente o que costuma ser lembrado tarde.";
    } else {
      title.textContent = `${pending.length} pendências que podem virar problema.`;
      text.textContent = "Nada que não se resolva com método: organizar, priorizar e acompanhar é exatamente o que o Fremon faz.";
    }

    list.replaceChildren(
      ...pending.map(({ question, value }) => {
        const item = document.createElement("li");
        if (value === "nsei") item.className = "is-unknown";
        const label = document.createElement("strong");
        label.textContent = `${question.dataset.checkShort}${value === "nsei" ? " (sem certeza)" : ""}. `;
        item.append(label, question.dataset.checkWhy);
        return item;
      }),
    );
    unknownNote.hidden = unknown.length === 0;

    summary = `Diagnóstico rápido do site: ${score} de ${questions.length} em dia.${
      pending.length ? ` Pendências: ${pending.map(({ question }) => question.dataset.checkShort).join(", ")}.` : ""
    }`;

    if (result.hidden) {
      result.hidden = false;
      result.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
    }
  };

  checkForm.addEventListener("change", update);
  checkForm.addEventListener("submit", (event) => event.preventDefault());

  // Leva o resultado para o formulário de contato, sem enviar nada.
  cta?.addEventListener("click", () => {
    if (!demoForm) return;
    const profile = demoForm.querySelector('select[name="profile"]');
    const assets = demoForm.querySelector('select[name="assets"]');
    const challenge = demoForm.querySelector('textarea[name="challenge"]');
    if (profile && !profile.value) profile.value = "Síndico";
    if (assets && !assets.value) assets.value = "1";
    if (challenge && summary && !challenge.value.includes("Diagnóstico rápido")) {
      challenge.value = challenge.value ? `${challenge.value}\n${summary}` : summary;
    }
    window.setTimeout(() => demoForm.querySelector('input[name="name"]')?.focus({ preventScroll: true }), reducedMotion ? 0 : 700);
  });
}

// Rateio por unidade: valor-base de cada plano dividido pelas unidades ----

const unitsRange = document.querySelector("[data-units-range]");

if (unitsRange) {
  const unitsOutput = document.querySelector("[data-units-output]");
  const perUnitValues = [...document.querySelectorAll("[data-per-unit]")];
  const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  const updateUnits = (animate) => {
    const units = Number(unitsRange.value);
    const min = Number(unitsRange.min);
    const max = Number(unitsRange.max);
    unitsOutput.textContent = String(units);
    unitsRange.style.setProperty("--fill", `${(((units - min) / (max - min)) * 100).toFixed(1)}%`);
    unitsRange.setAttribute("aria-valuetext", `${units} unidades`);

    perUnitValues.forEach((element) => {
      element.textContent = currency.format(Number(element.dataset.perUnit) / units);
      if (!animate || reducedMotion) return;
      element.classList.remove("is-ticking");
      void element.offsetWidth;
      element.classList.add("is-ticking");
    });
  };

  unitsRange.addEventListener("input", () => updateUnits(true));
  updateUnits(false);
}

// Quanto custa adiar: o tempo avança sobre a cena em corte ------------------
// --t vai de 0 (hoje) a 3 (três anos); o custo cresce em escala geométrica
// entre os valores de cada etapa.

const decaySection = document.querySelector("[data-decay]");

if (decaySection) {
  const decayStage = decaySection.querySelector(".decay-stage");
  const decayScene = decaySection.querySelector("[data-decay-scene]");
  const decayRange = decaySection.querySelector("[data-decay-range]");
  const decayTicks = [...decaySection.querySelectorAll("[data-decay-stage]")];
  const field = (name) => decaySection.querySelector(`[data-decay-${name}]`);
  const output = { when: field("when"), title: field("title"), cost: field("cost"), fix: field("fix"), live: field("live") };
  const costs = decayTicks.map((tick) => Number(tick.dataset.cost));
  let current = 0;
  let shownStage = -1;
  let tween = 0;
  let holdTimer = 0;

  const formatCost = (value) => {
    if (value < 1000) return `R$ ${Math.round(value / 10) * 10}`;
    const thousands = value / 1000;
    const text = thousands < 10 ? thousands.toFixed(1).replace(".0", "").replace(".", ",") : String(Math.round(thousands));
    return `R$ ${text} mil`;
  };

  const render = (t, announce = false) => {
    current = Math.min(3, Math.max(0, t));
    decayStage.style.setProperty("--t", current.toFixed(3));
    // Verde → âmbar → vermelho, sempre com contraste sobre o papel.
    const mix = (a, b, p) => a.map((channel, i) => Math.round(channel + (b[i] - channel) * p));
    const rgb = current <= 1.5 ? mix([46, 130, 102], [183, 121, 31], current / 1.5) : mix([183, 121, 31], [184, 68, 62], (current - 1.5) / 1.5);
    decayStage.style.setProperty("--cost-color", `rgb(${rgb.join(" ")})`);
    decayRange.value = String(Math.round(current * 100));

    const k = Math.min(2, Math.floor(current));
    const value = current >= 3 ? costs[3] : costs[k] * (costs[k + 1] / costs[k]) ** (current - k);
    output.cost.textContent = formatCost(value);

    const nearest = Math.round(current);
    if (nearest === shownStage) return;
    shownStage = nearest;
    const tick = decayTicks[nearest];
    output.when.textContent = tick.dataset.when;
    output.title.textContent = tick.dataset.title;
    output.fix.textContent = tick.dataset.fix;
    decayTicks.forEach((item) => item.classList.toggle("is-current", item === tick));
    const summary = `${tick.dataset.when}: ${tick.dataset.title.toLowerCase()}. Para resolver: ${tick.dataset.fix.toLowerCase()}, cerca de ${formatCost(costs[nearest])}.`;
    decayRange.setAttribute("aria-valuetext", summary);
    if (announce) output.live.textContent = summary;
  };

  const stopAutoplay = () => {
    cancelAnimationFrame(tween);
    clearTimeout(holdTimer);
  };

  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

  const animateTo = (target, duration, done) => {
    cancelAnimationFrame(tween);
    const from = current;
    const start = performance.now();
    const frame = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      render(from + (target - from) * easeInOut(progress));
      if (progress < 1) tween = requestAnimationFrame(frame);
      else done?.();
    };
    tween = requestAnimationFrame(frame);
  };

  const touched = () => {
    stopAutoplay();
    decayStage.classList.add("is-touched");
  };

  decayRange.addEventListener("input", () => {
    touched();
    render(Number(decayRange.value) / 100);
  });
  decayRange.addEventListener("pointerdown", touched);
  decayRange.addEventListener("keydown", touched);

  decayTicks.forEach((tick) => {
    tick.addEventListener("click", () => {
      touched();
      const target = Number(tick.dataset.decayStage);
      if (reducedMotion) render(target, true);
      else animateTo(target, 900, () => render(target, true));
    });
  });

  render(0);

  if ("IntersectionObserver" in window) {
    let played = false;
    // Entradas podem chegar em lote (rolagem rápida, âncora): vale sempre a mais recente.
    const playObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        decayScene.classList.toggle("is-playing", entry.isIntersecting && !reducedMotion);
        if (!entry.isIntersecting || played || reducedMotion || decayStage.classList.contains("is-touched")) return;
        played = true;
        // Hoje → 3 meses → 1 ano → 3 anos, com uma pausa em cada etapa.
        const steps = [1, 2, 3];
        const next = (index) => {
          if (index >= steps.length) return;
          animateTo(steps[index], 1500, () => {
            holdTimer = window.setTimeout(() => next(index + 1), 1100);
          });
        };
        holdTimer = window.setTimeout(() => next(0), 900);
      },
      { threshold: 0.5 },
    );
    playObserver.observe(decayScene);
  }
}

// Memória do prédio --------------------------------------------------------
// Doze anos de um prédio, gestão a gestão. Sem o Fremon, cada troca leva junto
// o que estava com quem saiu; com o Fremon, tudo fica no acervo. A história
// toca uma vez quando aparece; o HTML já traz o estado final.

const memory = document.querySelector("[data-memory]");

if (memory) {
  const START = 2014;
  const NOW = 2026;
  const items = [...memory.querySelectorAll(".mem-item")];
  const past = items.filter((item) => item.dataset.year);
  const due = items.filter((item) => !item.dataset.year);
  const columns = [...memory.querySelectorAll(".mem-col")];
  const modeButtons = [...memory.querySelectorAll("[data-memory-mode]")];
  const replay = memory.querySelector("[data-memory-replay]");
  const file = memory.querySelector("[data-memory-file]");
  const fileHome = file.parentElement;
  const defaultItem = memory.querySelector("[data-memory-default]");
  const field = (selector) => memory.querySelector(selector);
  const out = {
    found: field("[data-memory-found]"),
    total: field("[data-memory-total]"),
    next: field("[data-memory-next]"),
    year: field("[data-memory-year]"),
    live: field("[data-memory-live]"),
    meta: field("[data-file-meta]"),
    name: field("[data-file-name]"),
    text: field("[data-file-text]"),
    sem: field("[data-spark-sem]"),
    com: field("[data-spark-com]"),
    dot: field("[data-spark-dot]"),
  };
  // Em tablet e celular cada gestão vira uma linha, e a ficha abre logo abaixo dela.
  const stacked = window.matchMedia("(max-width: 1150px)");

  let mode = "com";
  let year = NOW;
  let shown = past.length;
  let selected = defaultItem;
  let observer = null;
  let frame = 0;
  let countFrame = 0;
  let switchTimer = 0;
  let timers = [];

  items.forEach((item, index) => item.style.setProperty("--i", String(index)));
  columns.forEach((column) =>
    column.querySelectorAll(".mem-item").forEach((item, row) => item.style.setProperty("--r", String(row))),
  );

  const lostAt = (item) => (item.dataset.lost ? Number(item.dataset.lost) : Infinity);

  // Curva do contador: um degrau a cada registro criado e uma queda a cada perda.
  const x = (t) => 2 + ((t - START) / (NOW - START)) * 236;
  const y = (n) => 58 - (n / past.length) * 50;
  const events = [
    ...past.map((item) => [Number(item.dataset.year), 1]),
    ...past.filter((item) => item.dataset.lost).map((item) => [lostAt(item), -1]),
  ].sort((a, b) => a[0] - b[0]);
  const trace = (t, withLoss) => {
    let n = 0;
    let d = `M${x(START)} ${y(0)}`;
    for (const [when, delta] of events) {
      if (when > t) break;
      if (delta < 0 && !withLoss) continue;
      n += delta;
      d += `H${x(when).toFixed(1)}V${y(n).toFixed(1)}`;
    }
    return { d: `${d}H${x(t).toFixed(1)}`, n };
  };
  out.com.setAttribute("d", trace(NOW, false).d);

  const showCount = (n, animate) => {
    cancelAnimationFrame(countFrame);
    if (!animate || reducedMotion) {
      shown = n;
      out.found.textContent = String(n);
      return;
    }
    const from = shown;
    const begin = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - begin) / 800);
      shown = Math.round(from + (n - from) * (1 - (1 - progress) ** 3));
      out.found.textContent = String(shown);
      if (progress < 1) countFrame = requestAnimationFrame(step);
    };
    countFrame = requestAnimationFrame(step);
  };

  const render = (t, animateCount = false) => {
    year = t;
    memory.style.setProperty("--p", ((t - START) / 2 / columns.length).toFixed(4));
    past.forEach((item) => {
      const on = Number(item.dataset.year) <= t;
      item.classList.toggle("is-on", on);
      item.classList.toggle("is-lost", on && mode === "sem" && lostAt(item) <= t);
    });
    due.forEach((item) => item.classList.toggle("is-on", mode === "com" && t >= NOW));
    const current = t >= NOW ? columns.length - 2 : Math.floor((t - START) / 2);
    columns.forEach((column, index) => column.classList.toggle("is-active", index === current));

    const created = past.filter((item) => Number(item.dataset.year) <= t).length;
    const sem = trace(t, true);
    const found = mode === "sem" ? sem.n : created;
    out.sem.setAttribute("d", sem.d);
    out.dot.setAttribute("cx", x(t).toFixed(1));
    out.dot.setAttribute("cy", y(found).toFixed(1));
    out.total.textContent = String(created);
    out.year.textContent = t >= NOW ? "Hoje" : String(Math.floor(t));
    showCount(found, animateCount);
  };

  const updateFile = () => {
    file.classList.toggle("is-hint", !selected);
    if (!selected) {
      file.classList.remove("is-lost");
      out.meta.textContent = "Ficha do registro";
      out.name.textContent = "Toque em um registro";
      out.text.textContent = "Veja o que ele guarda e onde fica quando a gestão muda.";
      return;
    }
    const lost = mode === "sem" && selected.classList.contains("is-lost");
    const kind = selected.querySelector(".mem-kind").textContent;
    const where = selected.querySelector(".mem-where")?.textContent;
    file.classList.toggle("is-lost", lost);
    out.meta.textContent =
      mode === "com" ? (selected.dataset.year ? `${kind} · no acervo do prédio` : kind) : `${lost ? "Não encontrado" : "Onde está"} · ${where}`;
    out.name.textContent = selected.querySelector(".mem-name").textContent;
    out.text.textContent = mode === "com" ? selected.dataset.com : selected.dataset.sem;
  };

  const placeFile = () => {
    const host = stacked.matches && selected ? selected.closest(".mem-col") : fileHome;
    if (file.parentElement !== host) host.append(file);
  };

  const select = (item, announce = false) => {
    selected = item;
    items.forEach((other) => other.setAttribute("aria-pressed", String(other === item)));
    placeFile();
    updateFile();
    if (announce && item) out.live.textContent = `${out.name.textContent}. ${out.meta.textContent}. ${out.text.textContent}`;
  };

  const setMode = (next, { wave = false, announce = false } = {}) => {
    mode = next;
    memory.dataset.mode = next;
    modeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.memoryMode === next)));
    if (wave && !reducedMotion) {
      memory.classList.add("is-switching");
      clearTimeout(switchTimer);
      switchTimer = window.setTimeout(() => memory.classList.remove("is-switching"), 1600);
    }
    out.next.textContent = next === "com" ? `e ${due.length} prazos já no calendário` : "e nenhum prazo à vista";
    if (next === "sem" && selected && !selected.dataset.year) select(defaultItem);
    render(year, wave);
    updateFile();
    if (!announce) return;
    out.live.textContent =
      next === "com"
        ? `Com o Fremon: quem decide hoje encontra ${past.length} de ${past.length} registros do prédio, e ${due.length} prazos já estão no calendário.`
        : `Sem o Fremon: quem decide hoje encontra ${trace(NOW, true).n} de ${past.length} registros do prédio, e nenhum prazo à vista.`;
  };

  const later = (callback, delay) => timers.push(window.setTimeout(callback, delay));

  const stopFilm = () => {
    cancelAnimationFrame(frame);
    timers.forEach(clearTimeout);
    timers = [];
    columns.forEach((column) => column.classList.remove("is-handover"));
  };

  const settle = () => {
    stopFilm();
    observer?.disconnect();
    memory.classList.add("is-settled");
    if (year < NOW) render(NOW);
    // No celular a ficha abre dentro da linha tocada; abrir sozinha empurraria a página.
    select(selected ?? (stacked.matches ? null : defaultItem));
  };

  const flash = (column) => {
    column.classList.add("is-handover");
    // Some antes da próxima troca (a cada 1,1 s), para os rótulos não se encostarem.
    later(() => column.classList.remove("is-handover"), 750);
  };

  const play = () => {
    stopFilm();
    memory.classList.remove("is-settled");
    select(null);
    setMode("sem");
    render(START);
    let stage = 0;
    const duration = (NOW - START) * 560;
    const begin = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - begin) / duration);
      const t = START + (NOW - START) * progress;
      const reached = Math.min(columns.length - 2, Math.floor((t - START) / 2));
      if (reached > stage) {
        stage = reached;
        flash(columns[stage]);
      }
      render(t);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      // Pausa no "hoje" sem o Fremon; depois o acervo devolve tudo.
      later(() => {
        setMode("com", { wave: true });
        later(settle, 1500);
      }, 1800);
    };
    frame = requestAnimationFrame(tick);
  };

  modeButtons.forEach((button) =>
    button.addEventListener("click", () => {
      if (!memory.classList.contains("is-settled")) settle();
      if (button.dataset.memoryMode !== mode) setMode(button.dataset.memoryMode, { wave: true, announce: true });
    }),
  );

  items.forEach((item) =>
    item.addEventListener("click", () => {
      if (!memory.classList.contains("is-settled")) settle();
      select(item, true);
    }),
  );

  replay.addEventListener("click", play);
  stacked.addEventListener("change", placeFile);

  // Passar o mouse num princípio acende o marcador correspondente na cena.
  document.querySelectorAll(".principles-row [data-lens]").forEach((card) => {
    card.addEventListener("pointerenter", () => (memory.dataset.lens = card.dataset.lens));
    card.addEventListener("pointerleave", () => delete memory.dataset.lens);
  });

  if (reducedMotion || !("IntersectionObserver" in window)) {
    setMode("com");
    settle();
  } else {
    select(null);
    setMode("sem");
    render(START);
    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.at(-1).isIntersecting) return;
        observer.disconnect();
        later(play, 500);
      },
      { threshold: 0.3 },
    );
    observer.observe(memory);
  }
}

// Mapa dos módulos ---------------------------------------------------------
// O prédio no centro e as ligações que existem no app. Ao aparecer, conta "o caminho
// de um problema" (vistoria → manutenção → sistema → fornecedor → documentos); depois,
// cada módulo tocado acende as próprias ligações. O HTML já traz Manutenções.

const mapx = document.querySelector("[data-mapx]");

if (mapx) {
  const nodes = [...mapx.querySelectorAll(".mapx-node")];
  const edges = [...mapx.querySelectorAll(".mapx-edge")];
  const spokes = [...mapx.querySelectorAll(".mapx-spokes line")];
  const cards = [...mapx.querySelectorAll("[data-card]")];
  const steps = [...mapx.querySelectorAll("[data-mapx-steps] li")];
  const dots = [...mapx.querySelectorAll(".mapx-dots li")];
  const tour = mapx.querySelector("[data-mapx-tour]");
  const stepText = mapx.querySelector("[data-mapx-step]");
  const count = mapx.querySelector("[data-mapx-count]");
  const live = mapx.querySelector("[data-mapx-live]");
  const replay = mapx.querySelector("[data-mapx-replay]");
  let timer = 0;
  let touched = false;

  const restart = (element, className) => {
    element.classList.remove(className);
    element.getBoundingClientRect();
    element.classList.add(className);
  };

  // Acende um módulo e as suas ligações; no caminho, só a ligação do passo.
  const light = (from, to = null) => {
    const on = edges.filter((edge) => {
      const ends = [edge.dataset.a, edge.dataset.b];
      return to ? ends.includes(from) && ends.includes(to) : ends.includes(from);
    });
    const near = new Set(on.flatMap((edge) => [edge.dataset.a, edge.dataset.b]));
    edges.forEach((edge) => {
      edge.classList.toggle("is-on", on.includes(edge));
      edge.classList.remove("is-drawing");
    });
    spokes.forEach((spoke) => spoke.classList.toggle("is-on", spoke.dataset.node === from));
    nodes.forEach((node) => {
      const id = node.dataset.node;
      node.setAttribute("aria-pressed", String(id === from));
      node.classList.toggle("is-linked", id !== from && near.has(id));
      node.classList.toggle("is-dim", id !== from && !near.has(id));
      node.classList.toggle("is-target", id === to);
    });
    mapx.dataset.active = from;
    return on;
  };

  const select = (id, { announce = false, focus = false } = {}) => {
    light(id);
    cards.forEach((card) => (card.hidden = card.dataset.card !== id));
    const card = cards.find((item) => item.dataset.card === id);
    if (focus) card.querySelector("h3").focus({ preventScroll: true });
    if (!announce) return;
    const links = [...card.querySelectorAll("li button")].map((button) => button.textContent);
    live.textContent = `${card.querySelector("h3").textContent}: conversa com ${links.join(", ")}.`;
  };

  const stopTour = () => {
    clearTimeout(timer);
    mapx.classList.remove("is-touring");
    tour.hidden = true;
  };

  const showStep = (index) => {
    const step = steps[index];
    const on = light(step.dataset.from, step.dataset.to);
    on.forEach((edge) => restart(edge, "is-drawing"));
    stepText.textContent = step.textContent;
    restart(stepText, "is-new");
    count.textContent = `${index + 1} de ${steps.length}`;
    dots.forEach((dot, i) => dot.classList.toggle("is-done", i <= index));
    timer = window.setTimeout(() => {
      if (index + 1 < steps.length) showStep(index + 1);
      else {
        stopTour();
        select("manutencoes");
      }
    }, 2900);
  };

  const play = () => {
    stopTour();
    mapx.classList.add("is-touring");
    cards.forEach((card) => (card.hidden = true));
    tour.hidden = false;
    showStep(0);
  };

  nodes.forEach((node) =>
    node.addEventListener("click", () => {
      touched = true;
      stopTour();
      select(node.dataset.node, { announce: true });
    }),
  );

  mapx.querySelectorAll("[data-go]").forEach((button) =>
    button.addEventListener("click", () => {
      touched = true;
      stopTour();
      select(button.dataset.go, { announce: true, focus: true });
    }),
  );

  cards.forEach((card) => card.querySelector("h3").setAttribute("tabindex", "-1"));
  replay.addEventListener("click", play);
  select("manutencoes");

  if (!reducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.at(-1).isIntersecting) return;
        observer.disconnect();
        timer = window.setTimeout(() => {
          if (!touched) play();
        }, 450);
      },
      { threshold: 0.4 },
    );
    observer.observe(mapx);
  }
}

// Animação explicativa da Lei de Sitter -----------------------------------

const sitterChart = document.querySelector("[data-sitter-chart]");

if (sitterChart) {
  if (reducedMotion || !("IntersectionObserver" in window)) {
    sitterChart.classList.add("is-animated");
  } else {
    const sitterObserver = new IntersectionObserver(
      ([entry], observer) => {
        if (!entry.isIntersecting) return;
        sitterChart.classList.add("is-animated");
        observer.disconnect();
      },
      { threshold: 0.25 },
    );
    sitterObserver.observe(sitterChart);
  }
}

// Recomendação contextual de planos ---------------------------------------

const profileSelector = document.querySelector("[data-profile-selector]");
const recommendation = document.querySelector("[data-plan-recommendation]");
const planCards = [...document.querySelectorAll("[data-plan-card]")];

const profileRecommendations = {
  sindico: {
    plan: "intelligence",
    title: "Intelligence",
    text: "para reunir controle preventivo e apoio técnico em uma operação condominial completa.",
  },
  profissional: {
    plan: "black",
    title: "Fremon Institucional + Black",
    text: "para comparar entidades e ampliar o acompanhamento sobre múltiplas operações.",
  },
  administradora: {
    plan: "compliance",
    title: "Fremon Institucional + Compliance",
    text: "para padronizar documentos, obrigações e rotinas preventivas em toda a carteira.",
  },
  residencia: {
    plan: null,
    title: "Fremon Private",
    text: "para preservar acervo, manutenção e memória técnica de uma residência de alto padrão.",
  },
  portfolio: {
    plan: "black",
    title: "Fremon Institucional",
    text: "para consolidar a governança técnica e a leitura comparável de diferentes ativos.",
  },
};

profileSelector?.querySelectorAll("[data-profile]").forEach((button) => {
  button.addEventListener("click", () => {
    const profile = button.dataset.profile;
    const selected = profileRecommendations[profile];
    if (!selected || !recommendation) return;

    profileSelector.querySelectorAll("[data-profile]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    // DOM em vez de innerHTML: nenhum texto vira HTML, mesmo que os dados mudem no futuro.
    const recommendationTitle = document.createElement("strong");
    recommendationTitle.textContent = selected.title;
    recommendation.querySelector("p").replaceChildren(recommendationTitle, ` ${selected.text}`);

    planCards.forEach((card) => {
      card.classList.toggle("is-recommended", card.dataset.planCard === selected.plan);
    });
  });
});

// FAQ: uma resposta aberta por vez -----------------------------------------

document.querySelectorAll(".faq-list details").forEach((detail) => {
  detail.addEventListener("toggle", () => {
    if (!detail.open) return;
    document.querySelectorAll(".faq-list details").forEach((other) => {
      if (other !== detail) other.open = false;
    });
  });
});

// Formulário e passagem segura para o canal comercial ----------------------

const demoForm = document.querySelector("[data-demo-form]");

const normalizePhone = (value) => value.replace(/\D/g, "").slice(0, 11);

const formatPhone = (value) => {
  const digits = normalizePhone(value);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

demoForm?.querySelector('input[name="phone"]')?.addEventListener("input", (event) => {
  event.target.value = formatPhone(event.target.value);
});

demoForm?.querySelectorAll("input, select, textarea").forEach((control) => {
  control.addEventListener("input", () => {
    control.closest(".field, .consent")?.classList.remove("is-invalid");
    control.removeAttribute("aria-invalid");
  });
  control.addEventListener("change", () => {
    control.closest(".field, .consent")?.classList.remove("is-invalid");
    control.removeAttribute("aria-invalid");
  });
});

demoForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const requiredControls = [...demoForm.querySelectorAll("[required]")];
  let firstInvalid = null;

  requiredControls.forEach((control) => {
    const valid = control.checkValidity();
    const wrapper = control.closest(".field, .consent");
    wrapper?.classList.toggle("is-invalid", !valid);
    control.setAttribute("aria-invalid", String(!valid));
    if (!valid && !firstInvalid) firstInvalid = control;
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const formData = new FormData(demoForm);
  const message = [
    "Olá! Gostaria de agendar uma apresentação personalizada do Fremon.",
    "",
    `Nome: ${formData.get("name")}`,
    `E-mail: ${formData.get("email")}`,
    `WhatsApp: ${formData.get("phone")}`,
    `Perfil: ${formData.get("profile")}`,
    `Patrimônios sob gestão: ${formData.get("assets")}`,
    formData.get("challenge") ? `Prioridade: ${formData.get("challenge")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappLink = demoForm.querySelector("[data-whatsapp-submit]");
  if (whatsappLink) {
    whatsappLink.href = `https://wa.me/5511973377172?text=${encodeURIComponent(message)}`;
  }

  const success = demoForm.querySelector(".form-success");
  if (success) {
    success.hidden = false;
    success.focus();
  }
});

// Barra de contato no celular -----------------------------------------------
// Visível depois do hero; escondida enquanto o formulário ou o rodapé aparecem.

const mobileCta = document.querySelector("[data-mobile-cta]");

if (mobileCta && "IntersectionObserver" in window) {
  const watched = new Map(
    [".hero", "#contato", ".site-footer"].map((selector) => [document.querySelector(selector), false]),
  );
  watched.delete(null);

  const ctaObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => watched.set(entry.target, entry.isIntersecting));
    const anyVisible = [...watched.values()].some(Boolean);
    mobileCta.classList.toggle("is-visible", !anyVisible);
  });
  watched.forEach((_, element) => ctaObserver.observe(element));
}

// Conteúdo temporal ---------------------------------------------------------

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

// Movimento ----------------------------------------------------------------
// Só variáveis CSS saem daqui; com movimento reduzido nada disso roda.

if (!reducedMotion) {
  const root = document.documentElement;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.append(progress);

  // [elemento, fator]: positivo desce com a rolagem, negativo sobe. Só a foto de fundo do
  // topo, que é decorativa: telas do sistema e fotos ficam paradas e nítidas, sem ampliação.
  const parallax = [[".hero-media img", 0.12]].flatMap(([selector, factor]) => [...document.querySelectorAll(selector)].map((element) => [element, factor]));

  // Só mede as fotos perto da tela: medir uma foto dentro de uma seção ainda não desenhada
  // (content-visibility) obrigaria o navegador a montar a seção inteira antes da hora.
  const near = new Set();

  let scheduled = false;
  const onScroll = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      // Todas as leituras antes de qualquer escrita: um só cálculo de layout por quadro.
      const active = parallax.filter(([element]) => near.has(element.parentElement));
      const max = root.scrollHeight - window.innerHeight;
      const boxes = active.map(([element]) => element.parentElement.getBoundingClientRect());
      progress.style.setProperty("--scroll", max > 0 ? (window.scrollY / max).toFixed(4) : "0");

      active.forEach(([element, factor], index) => {
        const box = boxes[index];
        const offset = box.top + box.height / 2 - window.innerHeight / 2;
        element.style.setProperty("--py", `${(offset * factor).toFixed(1)}px`);
      });
    });
  };

  if ("IntersectionObserver" in window) {
    const nearObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? near.add(entry.target) : near.delete(entry.target)));
        onScroll();
      },
      { rootMargin: "200px 0px" },
    );
    parallax.forEach(([element]) => nearObserver.observe(element.parentElement));
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  // Grades que entram item a item.
  [".principles-row", ".implant-steps", ".faq-list"].forEach((selector) => {
    const grid = document.querySelector(selector);
    if (!grid) return;
    grid.dataset.stagger = "";
    [...grid.children].forEach((child, index) => child.style.setProperty("--i", String(index)));
  });

  if (finePointer) {
    // Janela do hero inclina com o cursor; o cartão de detalhe vai no sentido oposto.
    // Só escreve variáveis, uma vez por quadro; abaixo de 1050px o CSS mantém tudo plano.
    const hero = document.querySelector(".hero");
    const heroWindow = hero?.querySelector(".product-window--hero");
    const heroDetail = hero?.querySelector(".shot-detail--hero");
    if (hero && heroWindow) {
      let pointer = null;
      let frame = 0;
      hero.addEventListener("pointermove", (event) => {
        pointer = event;
        hero.classList.add("is-pointer");
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const x = pointer.clientX / window.innerWidth - 0.5;
          const y = pointer.clientY / window.innerHeight - 0.5;
          heroWindow.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
          heroWindow.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
          heroDetail?.style.setProperty("--dx", `${(-x * 22).toFixed(1)}px`);
          heroDetail?.style.setProperty("--dy", `${(-y * 16).toFixed(1)}px`);
        });
      });
      hero.addEventListener("pointerleave", () => {
        cancelAnimationFrame(frame);
        frame = 0;
        ["--rx", "--ry"].forEach((name) => heroWindow.style.removeProperty(name));
        ["--dx", "--dy"].forEach((name) => heroDetail?.style.removeProperty(name));
        hero.classList.remove("is-pointer");
      });
    }

    // Luz que acompanha o cursor nos cartões.
    [".principles-row", ".plan-journey"].forEach((selector) => {
      const grid = document.querySelector(selector);
      if (!grid) return;
      grid.dataset.glow = "";
      grid.addEventListener("pointermove", (event) => {
        const card = event.target.closest(`${selector} > *`);
        if (!card) return;
        const box = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - box.left}px`);
        card.style.setProperty("--my", `${event.clientY - box.top}px`);
      });
    });
  }
}
