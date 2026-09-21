// Fills the router's registry. One line per view, added as each is ported.
import { registry } from '../app.js';
import food from './food.js';
import home from './home.js';
import ourHouse from './our-house.js';
import calendar from './calendar.js';
import generic from './generic.js';
import finance from './finance.js';
import fun from './fun.js';
import person from './person.js';
import chantier from './chantier.js';
import settings from './settings.js';

export function register() {
  registry.__home = home;
  registry.__generic = generic;
  registry.spoon = food;
  registry['our-house'] = c => ourHouse(c);
  registry.calendar = (c, p) => calendar(c, p);
  registry.finance = (c, p) => finance(c, p);
  registry.fun = (c, p) => fun(c, p);
  registry.hugo = c => person('hugo')(c);
  registry.brand = c => generic(c, 'brand', '');
  registry.chantier = c => chantier(c);
  registry.settings = settings;
}
