/* No dependencies: creates a native downloadable six-page PDF from the language-selected lightweight slide cards. */
(function () {
  "use strict";
  const W = 1400, H = 990;
  const NAVY = "#111D31", BURGUNDY = "#8A1F39", CREAM = "#F9F4EF";
  function wrap(ctx, text, x, y, width, lineHeight, maxLines) {
    const words = String(text || "").trim().split(/\s+/), lines = [];
    let current = "";
    for (const word of words) {
      const test = current ? current + " " + word : word;
      if (current && ctx.measureText(test).width > width) {
        lines.push(current);
        current = word;
      } else current = test;
    }
    if (current) lines.push(current);
    for (const line of lines.slice(0, maxLines)) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
    return y;
  }
  function drawSlide(node, number, lang) {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Canvas not available");
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W, 175);
    ctx.fillStyle = "#fff";
    ctx.direction = "ltr"; ctx.textAlign = "left";
    ctx.font = "bold 56px Arial, sans-serif";
    ctx.fillText("LexLearn", 84, 109);
    ctx.textAlign = "right"; ctx.font = "bold 29px Arial, sans-serif";
    ctx.fillText(String(number).padStart(2, "0") + " / 06", W - 83, 106);
    ctx.fillStyle = BURGUNDY; ctx.fillRect(0, 175, W, 9);
    const rtl = lang === "ar", x = rtl ? W - 100 : 100;
    ctx.direction = rtl ? "rtl" : "ltr";
    ctx.textAlign = rtl ? "right" : "left";
    ctx.font = "bold 32px Tahoma, Arial, sans-serif";
    ctx.fillStyle = BURGUNDY;
    wrap(ctx, node.querySelector("small").textContent, x, 295, W - 200, 45, 2);
    ctx.font = "bold 71px Tahoma, Arial, sans-serif";
    ctx.fillStyle = NAVY;
    const next = wrap(ctx, node.querySelector("h3").textContent, x, 445, W - 200, 93, 3);
    ctx.font = "39px Tahoma, Arial, sans-serif";
    ctx.fillStyle = "#46516A";
    wrap(ctx, node.querySelector("p").textContent, x, Math.max(585, next + 55), W - 200, 59, 5);
    ctx.fillStyle = NAVY; ctx.fillRect(100, H - 108, W - 200, 2);
    ctx.font = "25px Tahoma, Arial, sans-serif"; ctx.fillStyle = "#59647B";
    ctx.fillText(rtl ? "LexLearn | ملخص المؤتمر — تعاون جامعي" : "LexLearn | Public conference overview — University collaboration", x, H - 57);
    const raw = atob(c.toDataURL("image/jpeg", 0.87).split(",")[1]);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }
  function makePDF(images) {
    const encoder = new TextEncoder(), chunks = [], offsets = [0];
    let position = 0;
    function binary(chunk) { chunks.push(chunk); position += chunk.length; }
    function plain(s) { binary(encoder.encode(s)); }
    function object(id, content) {
      offsets[id] = position;
      plain(id + " 0 obj\n" + content + "\nendobj\n");
    }
    plain("%PDF-1.4\n%\xD3\xE4\xE5\xF5\n");
    object(1, "<< /Type /Catalog /Pages 2 0 R >>");
    const kids = images.map((_, i) => (3 + i * 3) + " 0 R").join(" ");
    object(2, "<< /Type /Pages /Count " + images.length + " /Kids [" + kids + "] >>");
    images.forEach((img, i) => {
      const page = 3 + i * 3, im = page + 1, content = page + 2;
      object(page, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /I " + im + " 0 R >> >> /Contents " + content + " 0 R >>");
      offsets[im] = position;
      plain(im + " 0 obj\n<< /Type /XObject /Subtype /Image /Width " + W + " /Height " + H + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + img.length + " >>\nstream\n");
      binary(img);
      plain("\nendstream\nendobj\n");
      const op = "q\n842 0 0 595 0 0 cm\n/I Do\nQ\n";
      const stream = encoder.encode(op);
      object(content, "<< /Length " + stream.length + " >>\nstream\n" + op + "endstream");
    });
    const start = position, last = 2 + images.length * 3;
    plain("xref\n0 " + (last + 1) + "\n0000000000 65535 f \n");
    for (let i = 1; i <= last; i++) plain(String(offsets[i]).padStart(10, "0") + " 00000 n \n");
    plain("trailer\n<< /Size " + (last + 1) + " /Root 1 0 R >>\nstartxref\n" + start + "\n%%EOF");
    return new Blob(chunks, {type:"application/pdf"});
  }
  window.lexlearnDownloadPublicDeck = function (lang) {
    const nodes = Array.from(document.querySelectorAll(".slideCard"));
    if (!nodes.length) return;
    const images = nodes.map((node, i) => drawSlide(node, i + 1, lang));
    const blob = makePDF(images);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "LexLearn-Public-Pitch-" + (lang === "ar" ? "AR" : "EN") + ".pdf";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  };
})();
