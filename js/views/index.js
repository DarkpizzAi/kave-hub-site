// Fills the router's registry. One line per view, added as each is ported.
import { registry } from '../app.js';
import food from './food.js';
import home from './home.js';
import household from './household.js';
import calendar from './calendar.js';
import generic from './generic.js';
import house from './house.js';
import money from './money.js';
import fun from './fun.js';
import person from './person.js';
import infrastructure from './infrastructure.js';
import settings from './settings.js';

export function register() {
  registry.__home = home;
  registry.__generic = generic;
  registry.food = food;
  registry.household = (c, p) => (p[0] === 'infrastructure' ? infrastructure(c) : household(c, p));
  registry.calendar = (c, p) => calendar(c, p);
  registry.house = (c, p) => house(c, p);
  registry.money = (c, p) => money(c, p);
  registry.fun = (c, p) => fun(c, p);
  registry.hugo = c => person('hugo')(c);
  registry.isa = c => person('isa')(c);
  registry.settings = settings;
}
