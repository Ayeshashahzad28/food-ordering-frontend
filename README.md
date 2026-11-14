# TimeMeal – food ordering app (HTML, CSS, JavaScript)

Open `index.html` in a browser. No build step, no dependencies.

## Features
- Home: delivery/pickup switch, address picker, search (restaurants and dishes), cuisine filters, sorting, open-now / free-delivery / offers filters, vouchers, "order again"
- Restaurant page: sticky category tabs, menu search, item customiser (sizes, extras, notes), closed-restaurant handling, favorites
- Basket: quantity steppers, single-restaurant rule, vouchers (`WELCOME100`, `TIMEMEAL50`, `FREEDEL`), delivery/service fees, minimum order
- Checkout: saved addresses, standard or scheduled time, rider tip, notes, payment (cash, card with Luhn/expiry/CVC checks, wallet)
- Live tracking: timeline, ETA, animated route map, rider card, cancel before cooking starts
- Orders history, reorder, ratings, favorites, account (profile, addresses), help centre with FAQ and contact form

## Notes
- Restaurant names are real Pakistani food businesses; menus, prices, ratings and fees are **sample data**.
- There is no backend. State lives in `localStorage`. Tracking is a time-based simulation (about 2.5 minutes end to end).
- No real payments are taken and card details are never stored.

## Structure
```
css/   base (tokens) · layout · components · views
js/core      utils, store, router, actions
js/data      catalog (restaurants, menus, vouchers)
js/services  availability, cart/pricing, orders/tracking
js/ui        toast, modal, forms, components, dialogs, header
js/views     home, restaurant, checkout, tracking, orders, account, help
```
