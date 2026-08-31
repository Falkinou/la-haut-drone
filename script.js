const year = document.querySelector("#year");
const form = document.querySelector(".contact-form");
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".nav-links a");
const messageField = form.querySelector("textarea[name='message']");
const projectField = form.querySelector("#contact-project");
const formButton = form.querySelector("button[type='submit']");
const formStatus = form.querySelector("#contact-status");
const missionOptions = document.querySelectorAll(".mission-option");
const missionTitle = document.querySelector("#mission-preview-title");
const missionCopy = document.querySelector("#mission-preview-copy");
const missionCta = document.querySelector("#mission-cta");
const missionPreview = document.querySelector(".mission-preview");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector("img");
const lightboxKicker = lightbox.querySelector("span");
const lightboxTitle = lightbox.querySelector("strong");
const lightboxClose = lightbox.querySelector(".lightbox-close");

year.textContent = new Date().getFullYear();

navToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const selectMission = (option, shouldFocusContact = false) => {
  missionOptions.forEach((item) => item.classList.toggle("active", item === option));
  missionTitle.textContent = option.dataset.title;
  missionCopy.textContent = option.dataset.copy;
  missionPreview.style.backgroundImage = `linear-gradient(115deg, rgba(8, 23, 18, 0.82), rgba(31, 77, 58, 0.54)), url("${option.dataset.image}")`;
  projectField.value = option.textContent.trim();

  if (!messageField.value.trim() || messageField.dataset.generated === "true") {
    messageField.value = option.dataset.message;
    messageField.dataset.generated = "true";
  }

  missionCta.href = "#contact";

  if (shouldFocusContact) {
    document.querySelector("#contact").scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => messageField.focus(), 420);
  }
};

missionOptions.forEach((option) => {
  option.addEventListener("click", () => selectMission(option));
});

missionCta.addEventListener("click", (event) => {
  event.preventDefault();
  const activeOption = document.querySelector(".mission-option.active");
  selectMission(activeOption, true);
});

messageField.addEventListener("input", () => {
  messageField.dataset.generated = "false";
});

const setFormStatus = (message, type = "") => {
  formStatus.textContent = message;
  formStatus.className = `form-status${type ? ` is-${type}` : ""}`;
};

const openMailFallback = (data) => {
  const subject = encodeURIComponent("Demande de captation drone - Là haut");
  const body = encodeURIComponent(
    `Bonjour Loïc,\n\nNom: ${data.get("name")}\nE-mail: ${data.get("email")}\nTéléphone: ${data.get("telephone") || "Non renseigné"}\nProjet: ${data.get("type_de_projet") || "Non renseigné"}\n\n${data.get("message")}`
  );

  window.location.href = `mailto:contact@lahaut-drone.fr?subject=${subject}&body=${body}`;
};

const openLightbox = (card) => {
  const image = card.querySelector("img");

  lightboxImage.src = card.dataset.src;
  lightboxImage.alt = image.alt;
  lightboxKicker.textContent = card.dataset.kicker;
  lightboxTitle.textContent = card.dataset.title;
  lightbox.hidden = false;
  document.body.classList.add("is-lightbox-open");
  lightboxClose.focus();
};

const closeLightbox = () => {
  lightbox.hidden = true;
  document.body.classList.remove("is-lightbox-open");
  lightboxImage.src = "";
};

document.querySelectorAll("[data-lightbox]").forEach((card) => {
  card.addEventListener("click", () => openLightbox(card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox(card);
    }
  });
});

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

lightboxClose.addEventListener("click", closeLightbox);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !lightbox.hidden) {
    closeLightbox();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = new FormData(form);

  if (data.get("_honey")) {
    return;
  }

  const initialButtonText = formButton.textContent;
  formButton.disabled = true;
  formButton.textContent = "Envoi en cours...";
  setFormStatus("Envoi de votre demande...");

  try {
    const response = await fetch(form.action, {
      method: form.method,
      body: data,
      headers: { Accept: "application/json" },
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === "false") {
      throw new Error("Form submission failed");
    }

    form.reset();
    projectField.value = "";
    messageField.dataset.generated = "false";
    setFormStatus("Merci, votre demande a bien été envoyée. Loïc vous répondra rapidement.", "success");
  } catch {
    setFormStatus("L'envoi automatique n'a pas abouti. Votre messagerie va s'ouvrir pour terminer la demande.", "error");
    openMailFallback(data);
  } finally {
    formButton.disabled = false;
    formButton.textContent = initialButtonText;
  }
});
