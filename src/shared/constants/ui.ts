/** 32px: chips, fields, default buttons and aside entries. */
export const CONTROL_HEIGHT = "h-8";

/** 40px: full-width form actions (`size="medium"`). */
export const CONTROL_HEIGHT_MEDIUM = "h-10";

/** Page sections: panels, cards, same glass as the aside chrome. */
export const GLASS_SECTION = "bg-surface/40 backdrop-blur";

export const GLASS_SECTION_STRONG = "bg-surface-high/50 backdrop-blur";

/** Fields, selects, chips and tags sit slightly denser for legibility. */
export const GLASS_CONTROL = "bg-surface/70 backdrop-blur";

/** Inner fill of the fury ring: hides the spinning border while staying translucent. */
export const FURY_RING_FILL = "bg-surface/70 backdrop-blur";

export const GLASS_CONTROL_ACTIVE = "bg-surface-high/50 backdrop-blur";

/** Loose controls on the page shell: filters, search fields, filter selects. */
export const LOOSE_CONTROL_SURFACE =
  "border border-edge bg-surface/70 backdrop-blur transition-colors";

export const LOOSE_CONTROL_SURFACE_ACTIVE =
  "border-edge bg-surface-high/50 backdrop-blur text-ink";

export const LOOSE_CONTROL_SURFACE_HOVER =
  "hover:border-edge-strong hover:bg-surface-high/50 hover:text-ink";

/** Strip IconFrame outer margin inside containers that already pad and gap the art. */
export const ICON_FRAME_INSET = "[&_[data-icon-frame]]:!m-0";
