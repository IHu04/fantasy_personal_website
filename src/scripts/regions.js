export const regions = [
  {
    name: 'About',
    tag: 'The Tarnished',
    desc: 'A quiet origin beneath a sky of old gold.',
    px: 0.191,
    py: 0.425,
  },
  {
    name: 'Projects',
    tag: 'Sites of Great Runes',
    desc: 'Forged works, prototypes, and strange mechanisms.',
    px: 0.73,
    py: 0.24,
  },
  {
    name: 'Skills',
    tag: 'The Golden Order',
    desc: 'Tools, disciplines, and practiced arts.',
    px: 0.458,
    py: 0.764,
  },
  {
    name: 'Contact',
    tag: 'Roundtable Hold',
    desc: 'A place for messages to find their way home.',
    px: 0.715,
    py: 0.725,
  },
  {
    name: 'Experience',
    tag: 'The Long March',
    desc: 'Past campaigns, lessons, and earned scars.',
    px: 0.508,
    py: 0.55,
  },
];

export function initRegionMarkers(root = document.getElementById('app')) {
  const layer = document.createElement('div');
  layer.className = 'region-marker-layer';
  layer.setAttribute('aria-label', 'Portfolio regions');

  regions.forEach((region, index) => {
    const marker = document.createElement('button');
    marker.className = 'region-marker';
    marker.type = 'button';
    marker.dataset.regionIndex = index;
    marker.style.setProperty('--marker-x', `${region.px * 100}%`);
    marker.style.setProperty('--marker-y', `${region.py * 100}%`);
    marker.setAttribute('aria-label', `${region.name}: ${region.tag}. ${region.desc}`);

    marker.innerHTML = `
      <span class="region-marker__beam" aria-hidden="true"></span>
      <span class="region-marker__ring region-marker__ring--one" aria-hidden="true"></span>
      <span class="region-marker__ring region-marker__ring--two" aria-hidden="true"></span>
      <span class="region-marker__dot" aria-hidden="true"></span>
      <span class="region-marker__label">
        <span class="region-marker__name">${region.name}</span>
        <span class="region-marker__tag">${region.tag}</span>
      </span>
    `;

    layer.append(marker);
  });

  root.append(layer);
  return layer;
}
