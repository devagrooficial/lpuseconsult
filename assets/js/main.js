// ---------------------------------------------------------------------------
// Contato: e-mail usado nos links "mailto" do formulário e do rodapé.
// Placeholder — troque pelo e-mail real da Use Consult antes de publicar.
// ---------------------------------------------------------------------------
const CONTACT_EMAIL = "contato@useconsult.com.br";

// handleLogoError() é definida inline no <head> de cada página (precisa
// existir antes do <img> do logo ser parseado — ver comentário lá).

document.addEventListener("DOMContentLoaded", () => {
  wireContactEmailLinks();
  wireMobileNav();
  wireHeaderScrollShadow();
  wireScrollReveal();
  wireDemoConsulta();
  wireContactForm();
});

function wireContactEmailLinks() {
  document.querySelectorAll("[data-contact-email]").forEach((el) => {
    if (el.tagName === "A") {
      el.href = `mailto:${CONTACT_EMAIL}`;
    }
    el.textContent = CONTACT_EMAIL;
  });
}

// ---------------------------------------------------------------------------
// Navegação mobile
// ---------------------------------------------------------------------------
function wireMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function wireHeaderScrollShadow() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function wireScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const revealAll = () => items.forEach((el) => el.classList.add("is-visible"));

  if (!("IntersectionObserver" in window)) {
    revealAll();
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px 120px 0px" }
  );
  items.forEach((el) => io.observe(el));

  // Rede de segurança: um clique em link âncora do menu pode pular
  // instantaneamente para uma seção que o observer ainda não processou —
  // revela na hora para nunca deixar conteúdo "preso" invisível.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) target.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    });
  });

  // Segunda rede de segurança: nada deve ficar invisível para sempre,
  // mesmo em navegadores/automação onde o observer não dispara a tempo.
  window.addEventListener("load", () => setTimeout(revealAll, 1200));
}

// ---------------------------------------------------------------------------
// Validação de CPF/CNPJ (algoritmo público de dígito verificador).
// Usada apenas para validar o FORMATO digitado — não há nenhuma consulta
// a base de dados real. Ver seção "Demonstração" no site para o disclaimer.
// ---------------------------------------------------------------------------
function onlyDigits(value) {
  return (value || "").replace(/\D/g, "");
}

function isValidCPF(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i);
  let check1 = 11 - (sum % 11);
  if (check1 >= 10) check1 = 0;
  if (check1 !== parseInt(cpf[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i);
  let check2 = 11 - (sum % 11);
  if (check2 >= 10) check2 = 0;
  return check2 === parseInt(cpf[10], 10);
}

function isValidCNPJ(value) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calc = (base) => {
    let pos = base.length - 7;
    let sum = 0;
    for (let i = base.length; i >= 1; i--) {
      sum += parseInt(base.charAt(base.length - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }
    const result = sum % 11;
    return result < 2 ? 0 : 11 - result;
  };

  const digit1 = calc(cnpj.substring(0, 12));
  if (digit1 !== parseInt(cnpj.charAt(12), 10)) return false;
  const digit2 = calc(cnpj.substring(0, 13));
  return digit2 === parseInt(cnpj.charAt(13), 10);
}

function maskDocument(rawValue) {
  const digits = onlyDigits(rawValue).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function wireDemoConsulta() {
  const form = document.getElementById("demo-form");
  if (!form) return;

  const input = document.getElementById("demo-input");
  const errorEl = document.getElementById("demo-error");
  const resultEl = document.getElementById("demo-result");
  const submitBtn = form.querySelector("button[type=submit]");

  let demoData = null;

  input.addEventListener("input", () => {
    const cursorWasAtEnd = input.selectionStart === input.value.length;
    input.value = maskDocument(input.value);
    if (cursorWasAtEnd) input.setSelectionRange(input.value.length, input.value.length);
    errorEl.textContent = "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    resultEl.classList.remove("is-visible");

    const digits = onlyDigits(input.value);
    let type = null;

    if (digits.length === 11) {
      type = isValidCPF(digits) ? "cpf" : null;
      if (!type) errorEl.textContent = "CPF inválido. Verifique os dígitos digitados.";
    } else if (digits.length === 14) {
      type = isValidCNPJ(digits) ? "cnpj" : null;
      if (!type) errorEl.textContent = "CNPJ inválido. Verifique os dígitos digitados.";
    } else {
      errorEl.textContent = "Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) completo.";
    }

    if (!type) {
      input.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Consultando...";

    try {
      if (!demoData) {
        const res = await fetch("assets/data/demo-consulta.json");
        demoData = await res.json();
      }
      await new Promise((resolve) => setTimeout(resolve, 650));
      renderDemoResult(demoData[type], demoData.aviso, input.value, resultEl);
    } catch (err) {
      errorEl.textContent = "Não foi possível carregar a demonstração agora. Tente novamente.";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Consultar";
    }
  });
}

function renderDemoResult(data, aviso, formattedDoc, resultEl) {
  const checksHtml = data.checks
    .map(
      (item) => `<li>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        <span>${item}</span>
      </li>`
    )
    .join("");

  const timestamp = new Date().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  resultEl.innerHTML = `
    <div class="result-card">
      <div class="result-head">
        <div>
          <div class="result-doc">${data.tipo} · ${formattedDoc}</div>
          <div class="result-name">${data.nome}</div>
        </div>
        <span class="status-badge">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          ${data.status}
        </span>
      </div>
      <ul class="result-checks">${checksHtml}</ul>
      <div class="result-cta">
        <a href="#contato" class="btn btn-primary">Quero acesso a consultas reais</a>
      </div>
      <div class="result-footnote">
        Simulado em ${timestamp}. ${aviso || ""}
      </div>
    </div>
  `;
  resultEl.classList.add("is-visible");
}

// ---------------------------------------------------------------------------
// Formulário de contato: monta um e-mail (mailto) com os dados preenchidos.
// Site estático, sem back-end — troque por uma integração real quando houver.
// ---------------------------------------------------------------------------
function wireContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const status = document.getElementById("contact-status");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const nome = (data.get("nome") || "").toString().trim();
    const empresa = (data.get("empresa") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const segmento = (data.get("segmento") || "").toString().trim();
    const telefone = (data.get("telefone") || "").toString().trim();
    const mensagem = (data.get("mensagem") || "").toString().trim();

    if (!nome || !empresa || !email || !segmento) {
      status.textContent = "Preencha os campos obrigatórios antes de enviar.";
      status.className = "form-status error";
      return;
    }

    const subject = `Solicitação de consulta — ${empresa}`;
    const bodyLines = [
      `Nome: ${nome}`,
      `Empresa: ${empresa}`,
      `E-mail: ${email}`,
      `Segmento: ${segmento}`,
      telefone ? `Telefone/WhatsApp: ${telefone}` : null,
      "",
      "Mensagem:",
      mensagem || "(não informado)",
    ].filter(Boolean);

    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailtoUrl;
    status.textContent = "Abrindo seu aplicativo de e-mail para concluir o envio...";
    status.className = "form-status success";
  });
}
