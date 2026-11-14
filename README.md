<<<<<<< HEAD
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
=======
# 🍔 Food Ordering Frontend

A responsive **Food Ordering Frontend** built using **HTML, CSS, and JavaScript**.  
It provides a modern UI with interactive features like food filtering and cart functionality.

---

## 🚀 Features

- Fully responsive design for all devices  
- Food categories filtering system  
- Add to cart functionality  
- Interactive and modern UI  
- Smooth navigation between sections  

---

## 🛠 Tech Stack

- HTML5  
- CSS3  
- JavaScript (Vanilla JS)  

---

## 📸 Preview

### 🏠 Home Page

<img width="1898" height="907" alt="Home Page" src="https://github.com/user-attachments/assets/f4d38177-3819-491a-8da5-ee2e7b27de1e" />

<img width="1897" height="888" alt="Home Section" src="https://github.com/user-attachments/assets/cc7630f3-2b1f-4035-b210-046e80e10379" />

<img width="1899" height="907" alt="UI View" src="https://github.com/user-attachments/assets/d1ace524-636f-4db0-9804-03100e0ccdab" />

---

### 📖 About Us

<img width="1893" height="812" alt="About Page" src="https://github.com/user-attachments/assets/a5a04545-39d5-4a60-af7c-a7441516273e" />

<img width="1896" height="910" alt="About Section" src="https://github.com/user-attachments/assets/172baf38-e8af-4942-bce4-d47c1a52608f" />

<img width="1892" height="902" alt="About UI" src="https://github.com/user-attachments/assets/54a6edb8-c3b8-43f2-abb9-b6b703f2b071" />

---

### 🛒 Order Page

<img width="1900" height="908" alt="Order Page" src="https://github.com/user-attachments/assets/12d18518-6652-42ac-820c-5e0090681cc0" />

<img width="1911" height="912" alt="Cart View" src="https://github.com/user-attachments/assets/04adcb4c-c6e1-4654-9ac4-de3faeb6b247" />

<img width="1899" height="915" alt="Order UI" src="https://github.com/user-attachments/assets/9f25ee6b-a211-4bc3-94ef-02865d313e02" />

<img width="1914" height="909" alt="Checkout View" src="https://github.com/user-attachments/assets/ec49b3a7-b606-40cb-9833-7950a6ff231f" />

<img width="1917" height="906" alt="Order Summary" src="https://github.com/user-attachments/assets/00712534-ad4b-492f-819c-2f37b0c55fcc" />

---

### 📞 Contact Page

<img width="1902" height="912" alt="Contact Page" src="https://github.com/user-attachments/assets/78108849-6cdf-488e-8943-822750eced56" />

<img width="1900" height="914" alt="Contact Form" src="https://github.com/user-attachments/assets/fe6a91bf-cc5e-4ebf-8ab9-947ffe39dd58" />

---

## 🌐 Live Demo

👉 https://food-ordering-frontend-seven.vercel.app

---

## 👩‍💻 Author

**Ayesha Shahzad**  
MERN Stack Developer
>>>>>>> d3bec38799d8492d1e92ea60c80d38b1bdc495c7
