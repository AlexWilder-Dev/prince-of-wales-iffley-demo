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
import { initStory } from './ui/story';

document.documentElement.classList.add('js');

// Render data-driven content first so the motion passes can see it.
renderEvents();
renderWalks();
renderHours();
initMenus();
initMap();

// Motion passes.
initReveals();
initParallax();
initHover();

// Behaviour.
initNav();
initHero();
initStory();
initBooking();

measure();
window.addEventListener('load', () => measure(), { once: true });
