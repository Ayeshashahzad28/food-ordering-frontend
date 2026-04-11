const items = [
  {
    name: "Pepperoni Pizza",
    price: 1400,
    cat: "pizza",
    img: "assets/pepperoni pizza.jfif",
  },
  {
    name: "Cheese Pizza",
    price: 1200,
    cat: "pizza",
    img: "/assets/Cheese Pizza.jpg",
  },

  {
    name: "Zinger Burger",
    price: 850,
    cat: "burger",
    img: "/assets/zinger burger.jfif",
  },
  {
    name: "Beef Burger",
    price: 950,
    cat: "burger",
    img: "assets/Beef Burger.jfif",
  },
  {
    name: "Chicken Burger Deluxe",
    price: 1100,
    cat: "burger",
    img: "assets/Chicken Burger Deluxe.jfif",
  },

  { name: "Biryani", price: 700, cat: "desi", img: "assets/Biryani.jfif" },
  {
    name: "Chicken Karahi",
    price: 1500,
    cat: "desi",
    img: "assets/Chicken Karahi.jfif",
  },
  { name: "Nihari", price: 1300, cat: "desi", img: "assets/Nihari.jfif" },

  {
    name: "Chow Mein",
    price: 900,
    cat: "chinese",
    img: "assets/Chow Mein.jfif",
  },
  {
    name: "Manchurian",
    price: 1000,
    cat: "chinese",
    img: "assets/Manchurian.jfif",
  },
  {
    name: "Fried Rice",
    price: 850,
    cat: "chinese",
    img: "assets/Fried Rice.jfif",
  },
  {
    name: "Cold Drink",
    price: 200,
    cat: "drinks",
    img: "assets/Cold Drink.jfif",
  },
  {
    name: "Milk Shake",
    price: 400,
    cat: "drinks",
    img: "assets/Milk Shake.jfif",
  },
  { 
    name: "Lassi", 
    price: 250, 
    cat: "drinks", 
    img: "assets/Lassi.jfif" 
  },
  { 
    name: "Fries", 
    price: 300, 
    cat: "fastfood", 
    img: "assets/Fries.jfif" 
  },
  {
    name: "Hot Wings",
    price: 600,
    cat: "fastfood",
    img: "assets/Hot Wings.jfif",
  },
];

let cart = [];
let currentCategory = "all";

function displayItems(list) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  list.forEach((item) => {
    container.innerHTML += `
<div class='card'>
<img src='${item.img}'>
<h4>${item.name}</h4>
<p class='price'>Rs ${item.price}</p>
<button class='btn' onclick='addToCart(${JSON.stringify(item).replace(/"/g, "&quot;")})'>
Add to Bag
</button>
</div>`;
  });
}

function filterCategory(cat, el) {
  currentCategory = cat;
  document
    .querySelectorAll(".category")
    .forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
  applyFilters();
}

function applyFilters() {
  let filtered = items;

  const search = document.getElementById("search").value.toLowerCase();

  if (currentCategory !== "all") {
    filtered = filtered.filter((i) => i.cat === currentCategory);
  }

  if (search) {
    filtered = filtered.filter((i) => i.name.toLowerCase().includes(search));
  }

  displayItems(filtered);
}

function addToCart(item) {
  cart.push(item);
  updateCart();
}

function updateCart() {
  const list = document.getElementById("cartItems");
  const totalEl = document.getElementById("total");

  list.innerHTML = "";

  let subtotal = 0;

  cart.forEach((item) => {
    list.innerHTML += `<li>${item.name} - Rs ${item.price}</li>`;
    subtotal += item.price;
  });

  // DELIVERY RULE
  let delivery = subtotal > 1000 ? 0 : subtotal > 0 ? 250 : 0;
  let total = subtotal + delivery;

  totalEl.innerHTML = `
Subtotal: Rs ${subtotal}<br>
Delivery: Rs ${delivery}<br>
<strong>Total: Rs ${total}</strong>
`;
}

function clearCart() {
  cart = [];
  updateCart();
}

function proceedPay() {
  if (cart.length === 0) {
    alert("Cart is empty!");
    return;
  }
  alert("Proceeding to payment gateway...");
}

applyFilters();
