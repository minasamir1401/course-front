export type RichTextImageAlign = "left" | "center" | "right";

export function getRichTextImageStyles(align: RichTextImageAlign, width: string) {
  const safeWidth = width || "100";
  const style = {
    width: `${safeWidth}%`,
    maxWidth: "100%",
    height: "auto",
    borderRadius: "12px",
    display: "block",
    marginTop: "10px",
    marginBottom: "10px",
    marginLeft: "0",
    marginRight: "0",
  };

  if (align === "center") {
    style.marginLeft = "auto";
    style.marginRight = "auto";
  } else if (align === "right") {
    style.marginLeft = "auto";
    style.marginRight = "0";
  } else {
    style.marginLeft = "0";
    style.marginRight = "auto";
  }

  return style;
}

export function buildRichTextImageHtml(src: string, width: string, align: RichTextImageAlign) {
  const styles = getRichTextImageStyles(align, width);
  const styleString = Object.entries(styles)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      return `${cssKey}: ${value};`;
    })
    .join(" ");

  return `<img loading="lazy" decoding="async" src="${src}" data-align="${align}" style="${styleString}" />&nbsp;`;
}
