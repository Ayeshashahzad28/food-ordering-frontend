(function (TM) {
  "use strict";

  const IMG = (name) => `assets/food/${name}.jpg`;

  // reusable option groups
  const group = (id, title, type, options, required = false) => ({
    id,
    title,
    type, // "single" | "multi"
    required,
    options: options.map(([name, price = 0], i) => ({
      id: `${id}-${i}`,
      name,
      price,
    })),
  });

  const PIZZA_OPTIONS = [
    group(
      "size",
      "Choose size",
      "single",
      [['Small 7"', -300], ['Medium 9"'], ['Large 12"', 500]],
      true,
    ),
    group("extras", "Extras", "multi", [
      ["Extra cheese", 150],
      ["Jalapeños", 80],
      ["Stuffed crust", 250],
    ]),
  ];
  const DRINK_SIZE = group(
    "size",
    "Choose size",
    "single",
    [["345 ml"], ["1.5 L", 150]],
    true,
  );
  const BURGER_OPTIONS = [
    group(
      "meal",
      "Make it a meal",
      "single",
      [["Burger only"], ["With fries & drink", 350]],
      true,
    ),
    group("extras", "Extras", "multi", [
      ["Extra patty", 300],
      ["Cheese slice", 60],
    ]),
  ];
  const SPICE = group(
    "spice",
    "Spice level",
    "single",
    [["Mild"], ["Medium"], ["Spicy"]],
    true,
  );

  //menu item factory
  const item = (id, name, price, img, desc, extra = {}) => ({
    id,
    name,
    price,
    img: IMG(img),
    desc,
    options: [],
    popular: false,
    ...extra,
  });

  // restaurants
  const restaurants = [
    {
      id: "pizza-hut",
      name: "Pizza Hut",
      logo: "assets/brands/pizza-hut.png",
      cover: IMG("pepperoni-pizza"),
      cuisines: ["pizza", "fastfood"],
      tagline: "Pizzas, wings and sides",
      rating: 4.4,
      ratingCount: "5k+",
      eta: [30, 40],
      deliveryFee: 149,
      freeDeliveryOver: 2000,
      minOrder: 600,
      hours: [10, 28], // 10:00 → 04:00 next day
      area: "Gulberg & nearby",
      offer: "Free delivery above Rs 2,000",
      menu: [
        {
          title: "Pizzas",
          items: [
            item(
              "pepperoni-pizza",
              "Pepperoni Pizza",
              1400,
              "pepperoni-pizza",
              "Spicy pepperoni, mozzarella and signature tomato sauce on a hand-stretched base.",
              { options: PIZZA_OPTIONS, popular: true },
            ),
            item(
              "cheese-pizza",
              "Cheese Pizza",
              1200,
              "cheese-pizza",
              "A classic: three-cheese blend over rich tomato sauce.",
              { options: PIZZA_OPTIONS },
            ),
          ],
        },
        {
          title: "Sides",
          items: [
            item(
              "fries",
              "Seasoned Fries",
              300,
              "fries",
              "Crispy golden fries with house seasoning.",
            ),
            item(
              "hot-wings",
              "Hot Wings",
              600,
              "hot-wings",
              "Crunchy chicken wings tossed in hot sauce.",
              {
                options: [
                  group(
                    "pieces",
                    "Pieces",
                    "single",
                    [["6 pieces"], ["12 pieces", 520]],
                    true,
                  ),
                ],
                popular: true,
              },
            ),
          ],
        },
        {
          title: "Drinks",
          items: [
            item(
              "cold-drink",
              "Soft Drink",
              200,
              "cold-drink",
              "Chilled carbonated drink.",
              { options: [DRINK_SIZE] },
            ),
          ],
        },
      ],
    },
    {
      id: "burger-lab",
      name: "Burger Lab",
      logo: "assets/brands/burger-lab.png",
      cover: IMG("beef-burger"),
      cuisines: ["burger", "fastfood"],
      tagline: "Gourmet burgers & shakes",
      rating: 4.6,
      ratingCount: "3k+",
      eta: [25, 35],
      deliveryFee: 129,
      freeDeliveryOver: 1500,
      minOrder: 500,
      hours: [11, 27],
      area: "DHA & nearby",
      offer: "Free delivery above Rs 1,500",
      menu: [
        {
          title: "Burgers",
          items: [
            item(
              "zinger-burger",
              "Zinger Burger",
              850,
              "zinger-burger",
              "Crispy fried chicken fillet, lettuce and spicy mayo.",
              { options: BURGER_OPTIONS, popular: true },
            ),
            item(
              "beef-burger",
              "Beef Burger",
              950,
              "beef-burger",
              "Juicy grilled beef patty, cheddar, pickles and house sauce.",
              { options: BURGER_OPTIONS },
            ),
            item(
              "chicken-burger-deluxe",
              "Chicken Burger Deluxe",
              1100,
              "chicken-burger-deluxe",
              "Double chicken stack with cheese, caramelised onion and garlic mayo.",
              { options: BURGER_OPTIONS },
            ),
          ],
        },
        {
          title: "Sides & Shakes",
          items: [
            item(
              "fries",
              "Loaded Fries",
              300,
              "fries",
              "Fries with cheese sauce and seasoning.",
            ),
            item(
              "milk-shake",
              "Milk Shake",
              400,
              "milk-shake",
              "Thick and creamy, blended to order.",
              {
                options: [
                  group(
                    "flavour",
                    "Flavour",
                    "single",
                    [["Chocolate"], ["Strawberry"], ["Vanilla"]],
                    true,
                  ),
                ],
                popular: true,
              },
            ),
            item(
              "cold-drink",
              "Soft Drink",
              200,
              "cold-drink",
              "Chilled carbonated drink.",
              { options: [DRINK_SIZE] },
            ),
          ],
        },
      ],
    },
    {
      id: "student-biryani",
      name: "Student Biryani",
      logo: null,
      cover: IMG("biryani"),
      cuisines: ["desi"],
      tagline: "Karachi-style biryani",
      rating: 4.5,
      ratingCount: "8k+",
      eta: [35, 45],
      deliveryFee: 99,
      freeDeliveryOver: 1800,
      minOrder: 400,
      hours: [11, 26],
      area: "Saddar & nearby",
      offer: null,
      menu: [
        {
          title: "Rice",
          items: [
            item(
              "biryani",
              "Chicken Biryani",
              700,
              "biryani",
              "Fragrant basmati layered with spiced chicken, potato and fried onions.",
              {
                options: [
                  group(
                    "plate",
                    "Portion",
                    "single",
                    [["Single plate"], ["Double plate", 600]],
                    true,
                  ),
                  SPICE,
                  group("raita", "Add raita", "multi", [
                    ["Raita", 60],
                    ["Salad", 40],
                  ]),
                ],
                popular: true,
              },
            ),
          ],
        },
        {
          title: "Curries",
          items: [
            item(
              "nihari",
              "Beef Nihari",
              1300,
              "nihari",
              "Slow-cooked beef shank stew, served with ginger and lemon.",
              { options: [SPICE] },
            ),
          ],
        },
        {
          title: "Drinks",
          items: [
            item(
              "lassi",
              "Lassi",
              250,
              "lassi",
              "Thick yoghurt drink, made fresh.",
              {
                options: [
                  group(
                    "taste",
                    "Taste",
                    "single",
                    [["Sweet"], ["Salted"]],
                    true,
                  ),
                ],
              },
            ),
            item(
              "cold-drink",
              "Soft Drink",
              200,
              "cold-drink",
              "Chilled carbonated drink.",
              { options: [DRINK_SIZE] },
            ),
          ],
        },
      ],
    },
    {
      id: "butt-karahi",
      name: "Butt Karahi",
      logo: null,
      cover: IMG("chicken-karahi"),
      cuisines: ["desi"],
      tagline: "Lahori karahi & nihari",
      rating: 4.7,
      ratingCount: "6k+",
      eta: [40, 50],
      deliveryFee: 149,
      freeDeliveryOver: 2500,
      minOrder: 800,
      hours: [12, 23.5], // closed late at night: shows closed-state handling
      area: "Lahore Fort Road",
      offer: "Rs 100 off with WELCOME100",
      menu: [
        {
          title: "Karahi & Curries",
          items: [
            item(
              "chicken-karahi",
              "Chicken Karahi",
              1500,
              "chicken-karahi",
              "Wok-cooked chicken with tomato, green chilli and fresh ginger.",
              {
                options: [
                  group(
                    "portion",
                    "Portion",
                    "single",
                    [["Half (serves 1–2)", -500], ["Full (serves 3–4)"]],
                    true,
                  ),
                  SPICE,
                ],
                popular: true,
              },
            ),
            item(
              "nihari",
              "Beef Nihari",
              1300,
              "nihari",
              "Overnight slow-cooked nihari with fresh naan on the side.",
            ),
          ],
        },
        {
          title: "Rice",
          items: [
            item(
              "biryani",
              "Chicken Biryani",
              700,
              "biryani",
              "Aromatic rice with tender spiced chicken.",
            ),
          ],
        },
        {
          title: "Drinks",
          items: [
            item(
              "lassi",
              "Lassi",
              250,
              "lassi",
              "Thick yoghurt drink, made fresh.",
              {
                options: [
                  group(
                    "taste",
                    "Taste",
                    "single",
                    [["Sweet"], ["Salted"]],
                    true,
                  ),
                ],
              },
            ),
            item(
              "cold-drink",
              "Soft Drink",
              200,
              "cold-drink",
              "Chilled carbonated drink.",
              { options: [DRINK_SIZE] },
            ),
          ],
        },
      ],
    },
    {
      id: "chop-chop-wok",
      name: "Chop Chop Wok",
      logo: null,
      cover: IMG("chow-mein"),
      cuisines: ["chinese"],
      tagline: "Pan-Asian wok favourites",
      rating: 4.3,
      ratingCount: "2k+",
      eta: [30, 40],
      deliveryFee: 119,
      freeDeliveryOver: 1800,
      minOrder: 600,
      hours: [12, 27],
      area: "Clifton & nearby",
      offer: "Free delivery above Rs 1,800",
      menu: [
        {
          title: "Wok Mains",
          items: [
            item(
              "chow-mein",
              "Chicken Chow Mein",
              900,
              "chow-mein",
              "Stir-fried noodles with chicken, cabbage and spring onion.",
              { options: [SPICE], popular: true },
            ),
            item(
              "manchurian",
              "Chicken Manchurian",
              1000,
              "manchurian",
              "Crispy chicken in a tangy garlic-soy glaze.",
              { options: [SPICE] },
            ),
            item(
              "fried-rice",
              "Egg Fried Rice",
              850,
              "fried-rice",
              "Wok-tossed rice with egg and vegetables.",
            ),
          ],
        },
        {
          title: "Starters & Drinks",
          items: [
            item(
              "hot-wings",
              "Chilli Wings",
              600,
              "hot-wings",
              "Crispy wings in sweet chilli sauce.",
            ),
            item(
              "cold-drink",
              "Soft Drink",
              200,
              "cold-drink",
              "Chilled carbonated drink.",
              { options: [DRINK_SIZE] },
            ),
          ],
        },
      ],
    },
    {
      id: "broadway-pizza",
      name: "Broadway Pizza",
      logo: null,
      cover: IMG("cheese-pizza"),
      cuisines: ["pizza"],
      tagline: "Pizza made fresh to order",
      rating: 4.2,
      ratingCount: "4k+",
      eta: [30, 45],
      deliveryFee: 139,
      freeDeliveryOver: 2200,
      minOrder: 700,
      hours: [11, 27],
      area: "Johar Town & nearby",
      offer: "Rs 100 off with WELCOME100",
      menu: [
        {
          title: "Pizzas",
          items: [
            item(
              "cheese-pizza",
              "Cheese Lover Pizza",
              1250,
              "cheese-pizza",
              "Loaded with mozzarella and cheddar.",
              { options: PIZZA_OPTIONS, popular: true },
            ),
            item(
              "pepperoni-pizza",
              "Pepperoni Pizza",
              1450,
              "pepperoni-pizza",
              "Thin-sliced pepperoni, melted cheese and oregano.",
              { options: PIZZA_OPTIONS },
            ),
          ],
        },
        {
          title: "Sides & Drinks",
          items: [
            item(
              "fries",
              "Garlic Fries",
              320,
              "fries",
              "Fries tossed in garlic butter.",
            ),
            item(
              "milk-shake",
              "Milk Shake",
              420,
              "milk-shake",
              "Creamy shake, made to order.",
              {
                options: [
                  group(
                    "flavour",
                    "Flavour",
                    "single",
                    [["Chocolate"], ["Strawberry"], ["Vanilla"]],
                    true,
                  ),
                ],
              },
            ),
            item(
              "cold-drink",
              "Soft Drink",
              200,
              "cold-drink",
              "Chilled carbonated drink.",
              { options: [DRINK_SIZE] },
            ),
          ],
        },
      ],
    },
    {
      id: "cheezious",
      name: "Cheezious",
      logo: null,
      cover: IMG("zinger-burger"),
      cuisines: ["burger", "fastfood", "pizza"],
      tagline: "Cheesy fast food",
      rating: 4.5,
      ratingCount: "7k+",
      eta: [25, 35],
      deliveryFee: 99,
      freeDeliveryOver: 1500,
      minOrder: 450,
      hours: [11, 28],
      area: "Islamabad & Rawalpindi",
      offer: "Free delivery above Rs 1,500",
      menu: [
        {
          title: "Burgers & Pizza",
          items: [
            item(
              "zinger-burger",
              "Zinger Cheese Burger",
              800,
              "zinger-burger",
              "Crispy zinger fillet with a slice of melted cheese.",
              { options: BURGER_OPTIONS, popular: true },
            ),
            item(
              "cheese-pizza",
              "Cheese Pizza",
              1100,
              "cheese-pizza",
              "Stretchy cheese on a soft, golden crust.",
              { options: PIZZA_OPTIONS },
            ),
          ],
        },
        {
          title: "Sides & Drinks",
          items: [
            item(
              "hot-wings",
              "Hot Wings",
              580,
              "hot-wings",
              "Spicy, crispy wings.",
              {
                options: [
                  group(
                    "pieces",
                    "Pieces",
                    "single",
                    [["6 pieces"], ["12 pieces", 500]],
                    true,
                  ),
                ],
              },
            ),
            item(
              "fries",
              "Cheesy Fries",
              320,
              "fries",
              "Fries with creamy cheese sauce.",
            ),
            item(
              "milk-shake",
              "Milk Shake",
              380,
              "milk-shake",
              "Creamy shake, made to order.",
              {
                options: [
                  group(
                    "flavour",
                    "Flavour",
                    "single",
                    [["Chocolate"], ["Strawberry"], ["Vanilla"]],
                    true,
                  ),
                ],
              },
            ),
            item(
              "cold-drink",
              "Soft Drink",
              180,
              "cold-drink",
              "Chilled carbonated drink.",
              { options: [DRINK_SIZE] },
            ),
          ],
        },
      ],
    },
  ];

  // cuisine categories shown on Home
  const categories = [
    { id: "pizza", label: "Pizza", icon: "🍕" },
    { id: "burger", label: "Burgers", icon: "🍔" },
    { id: "desi", label: "Desi", icon: "🍛" },
    { id: "chinese", label: "Chinese", icon: "🍜" },
    { id: "fastfood", label: "Fast Food", icon: "🍟" },
  ];

  // vouchers (rules evaluated in services/pricing.js)
  const vouchers = [
    {
      code: "WELCOME100",
      title: "Rs 100 off",
      desc: "On your order above Rs 500",
      type: "flat",
      value: 100,
      minSubtotal: 500,
    },
    {
      code: "TIMEMEAL50",
      title: "50% off up to Rs 300",
      desc: "On orders above Rs 1,000",
      type: "percent",
      value: 50,
      cap: 300,
      minSubtotal: 1000,
    },
    {
      code: "FREEDEL",
      title: "Free delivery",
      desc: "On orders above Rs 800",
      type: "freeDelivery",
      minSubtotal: 800,
    },
  ];

  // sample riders used by the order simulation
  const riders = [
    { name: "Hamza Ali", rating: 4.9, bike: "Honda CD 70 · LEB-4821" },
    { name: "Usman Tariq", rating: 4.8, bike: "Yamaha YBR · KHI-7310" },
    { name: "Bilal Ahmed", rating: 4.7, bike: "Suzuki GS 150 · ISB-2094" },
    { name: "Saad Raza", rating: 4.9, bike: "Honda CG 125 · LHR-5567" },
  ];

  const faqs = [
    [
      "How long does delivery take?",
      "Most orders arrive in 25-45 minutes depending on the restaurant and your location. The estimate is shown before you pay and updates while you track.",
    ],
    [
      "Can I cancel my order?",
      "Yes. You can cancel from the tracking page until the restaurant starts preparing your food.",
    ],
    [
      "How do vouchers work?",
      "Enter a code in your basket. Each voucher has a minimum order value, and only one voucher can be used per order.",
    ],
    [
      "What payment methods are available?",
      "Cash on delivery, card and mobile wallet are available at checkout. This is a demo build, so no real payment is processed.",
    ],
    [
      "What if something is wrong with my order?",
      "Contact support from the Help page with your order number and we will make it right.",
    ],
  ];

  TM.catalog = {
    restaurants,
    categories,
    vouchers,
    riders,
    faqs,
    byId: (id) => restaurants.find((r) => r.id === id) || null,
    voucher: (code) =>
      vouchers.find(
        (v) =>
          v.code ===
          String(code || "")
            .trim()
            .toUpperCase(),
      ) || null,
  };
})((window.TM = window.TM || {}));
