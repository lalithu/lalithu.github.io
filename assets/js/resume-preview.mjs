// PDF.js 6.5.438, distributed with its license in assets/vendor/pdfjs.
import { getDocument, GlobalWorkerOptions } from "../vendor/pdfjs/pdf.min.mjs";

GlobalWorkerOptions.workerSrc = new URL(
  "../vendor/pdfjs/pdf.worker.min.mjs",
  import.meta.url,
).href;

const pages = document.querySelector("#resume-pages");
const status = document.querySelector("#resume-preview-status");

function addLink(annotation, viewport, pageElement, pdf) {
  const link = document.createElement("a");
  if (annotation.url && /^(https?:|mailto:|tel:)/i.test(annotation.url)) {
    link.href = annotation.url;
    link.setAttribute("aria-label", annotation.url);
  } else if (annotation.dest) {
    link.href = "#resume-pages";
    link.setAttribute("aria-label", "Go to linked résumé page");
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      const destination = typeof annotation.dest === "string"
        ? await pdf.getDestination(annotation.dest)
        : annotation.dest;
      if (!destination) return;

      const [reference] = destination;
      const index = Number.isInteger(reference) ? reference : await pdf.getPageIndex(reference);
      document.getElementById(`resume-page-${index + 1}`)?.scrollIntoView();
    });
  } else {
    return;
  }

  const [x1, y1, x2, y2] = annotation.rect;
  const [left, top] = viewport.convertToViewportPoint(x1, y1);
  const [right, bottom] = viewport.convertToViewportPoint(x2, y2);
  link.style.left = `${100 * Math.min(left, right) / viewport.width}%`;
  link.style.top = `${100 * Math.min(top, bottom) / viewport.height}%`;
  link.style.width = `${100 * Math.abs(right - left) / viewport.width}%`;
  link.style.height = `${100 * Math.abs(bottom - top) / viewport.height}%`;
  pageElement.append(link);
}

async function renderResume() {
  const pdf = await getDocument({ url: pages.dataset.pdf }).promise;

  for (let number = 1; number <= pdf.numPages; number += 1) {
    const page = await pdf.getPage(number);
    const size = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 1520 / size.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    canvas.setAttribute("aria-label", `Résumé page ${number}`);

    const pageElement = document.createElement("div");
    pageElement.className = "resume-page";
    pageElement.id = `resume-page-${number}`;
    pageElement.append(canvas);
    const [, annotations] = await Promise.all([
      page.render({ canvas, viewport }).promise,
      page.getAnnotations({ intent: "display" }),
    ]);
    for (const annotation of annotations) {
      if (annotation.subtype === "Link") addLink(annotation, viewport, pageElement, pdf);
    }
    pages.append(pageElement);
  }
}

renderResume().catch((error) => {
  console.error("Could not render the résumé preview", error);
  status.textContent = "The résumé preview could not load. Use Download PDF to view it.";
  status.hidden = false;
});
