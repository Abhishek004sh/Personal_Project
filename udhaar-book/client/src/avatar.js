// A few soft, brand-matching colors so names are easy to tell apart at a
// glance. Picked by the name itself, so the same person always gets the
// same color wherever their avatar shows up (list rows, detail page, etc.)
const AVATAR_COLORS = ['#7a4b1e', '#1b7a43', '#2d5f8a', '#8a3a6b', '#a3671f', '#3a6b6b'];

export function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function avatarInitial(name) {
  return name.trim().charAt(0).toUpperCase();
}
