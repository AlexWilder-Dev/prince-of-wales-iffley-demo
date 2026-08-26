import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';

import { initHover } from './motion/hover';
import { initReveals } from './motion/reveal';
import { initParallax, measure } from './motion/scroll';
import { initBooking } from './ui/booking';
import { initHero } from './ui/hero';
import { renderEvents, renderHours, renderWalks } from './ui/lists';
import { initMap } from './ui/map';
import { initMenus } from './ui/menus';
import { initNav } from './ui/nav';
import { initSign } from './ui/sign';
import { initStory } from './ui/story';

document.documentElement.classList.add('js');

// Render data-driven content and mount the mechanisms first so the motion
// passes can see everything.
renderEvents();
renderWalks();
renderHours();
initMenus();
initMap();
initStory();

initReveals();
initParallax();
initHover();

initNav();
initHero();
initSign();
initBooking();

measure();
window.addEventListener('load', () => measure(), { once: true });
