<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <title>QuickChop – Food Delivery</title>
  <style>
    :root {
      --primary: #e85d04;
      --primary-dark: #d00000;
      --bg: #f8f9fa;
      --card: #ffffff;
      --text: #1a1a1a;
      --muted: #6c757d;
      --border: #e9ecef;
      --success: #2a9d8f;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding-bottom: 80px;
    }
    header {
      background: var(--primary);
      color: white;
      padding: 14px 16px;
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .logo { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.5px; }
    .location { font-size: 0.85rem; opacity: 0.9; }
    .cart-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 8px 14px;
      border-radius: 20px;
      font-weight: 600;
      cursor: pointer;
      position: relative;
    }
    .cart-count {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #fff;
      color: var(--primary-dark);
      font-size: 0.7rem;
      font-weight: 700;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .search-bar {
      padding: 12px 16px;
      background: white;
      border-bottom: 1px solid var(--border);
    }
    .search-bar input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: 12px;
      font-size: 1rem;
      outline: none;
    }
    .search-bar input:focus { border-color: var(--primary); }
    .categories {
      display: flex;
      gap: 10px;
      padding: 14px 16px;
      overflow-x: auto;
      background: white;
      border-bottom: 1px solid var(--border);
    }
    .cat-btn {
      flex-shrink: 0;
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: white;
      font-size: 0.9rem;
      cursor: pointer;
      white-space: nowrap;
    }
    .cat-btn.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    .section { padding: 16px; }
    .section-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .food-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 14px;
    }
    .food-card {
      background: var(--card);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
    }
    .food-img {
      height: 110px;
      background: linear-gradient(135deg, #ff9a3c, #e85d04);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
    }
    .food-body { padding: 12px; flex: 1; display: flex; flex-direction: column; }
    .food-name { font-weight: 600; font-size: 0.95rem; margin-bottom: 4px; }
    .food-meta { font-size: 0.8rem; color: var(--muted); margin-bottom: 8px; }
    .food-price { font-weight: 700; color: var(--primary-dark); margin-bottom: 10px; }
    .add-btn {
      margin-top: auto;
      background: var(--primary);
      color: white;
      border: none;
      padding: 8px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .add-btn:active { transform: scale(0.97); }
    /* CART DRAWER */
    .cart-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 200;
      display: none;
    }
    .cart-overlay.open { display: block; }
    .cart-drawer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-radius: 20px 20px 0 0;
      max-height: 85vh;
      overflow-y: auto;
      z-index: 201;
      transform: translateY(100%);
      transition: transform 0.3s ease;
      padding-bottom: 20px;
    }
    .cart-drawer.open { transform: translateY(0); }
    .cart-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      background: white;
    }
    .cart-header h2 { font-size: 1.2rem; }
    .close-cart {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--muted);
    }
    .cart-items { padding: 12px 16px; }
    .cart-item {
      display: flex;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
      align-items: center;
    }
    .cart-item-info { flex: 1; }
    .cart-item-name { font-weight: 600; }
    .cart-item-price { font-size: 0.9rem; color: var(--muted); }
    .qty-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .qty-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: white;
      font-size: 1.1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cart-summary {
      padding: 16px 20px;
      border-top: 1px solid var(--border);
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 0.95rem;
    }
    .summary-row.total {
      font-weight: 700;
      font-size: 1.15rem;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed var(--border);
    }
    .checkout-btn {
      width: 100%;
      background: var(--primary);
      color: white;
      border: none;
      padding: 16px;
      border-radius: 12px;
      font-size: 1.05rem;
      font-weight: 700;
      margin-top: 16px;
      cursor: pointer;
    }
    .checkout-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .empty-cart {
      text-align: center;
      padding: 40px 20px;
      color: var(--muted);
    }
    /* ORDER SUCCESS */
    .success-screen {
      display: none;
      text-align: center;
      padding: 60px 24px;
    }
    .success-screen.show { display: block; }
    .success-icon { font-size: 4rem; margin-bottom: 16px; }
    .success-screen h2 { margin-bottom: 8px; }
    .success-screen p { color: var(--muted); margin-bottom: 24px; }
    .back-home {
      background: var(--primary);
      color: white;
      border: none;
      padding: 12px 28px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
    }
    footer {
      text-align: center;
      padding: 20px;
      font-size: 0.8rem;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <header>
    <div>
      <div class="logo">QuickChop</div>
      <div class="location">📍 Lagos, Nigeria</div>
    </div>
    <button class="cart-btn" id="openCartBtn">
      🛒 Cart
      <span class="cart-count" id="cartCount">0</span>
    </button>
  </header>

  <div class="search-bar">
    <input type="text" id="searchInput" placeholder="Search jollof, suya, pizza..." />
  </div>

  <div class="categories" id="categories">
    <button class="cat-btn active" data-cat="all">All</button>
    <button class="cat-btn" data-cat="Rice">Rice</button>
    <button class="cat-btn" data-cat="Grills">Grills</button>
    <button class="cat-btn" data-cat="Fast Food">Fast Food</button>
    <button class="cat-btn" data-cat="Drinks">Drinks</button>
    <button class="cat-btn" data-cat="Swallow">Swallow</button>
  </div>

  <div class="section">
    <h2 class="section-title">Popular Near You</h2>
    <div class="food-grid" id="foodGrid"></div>
  </div>

  <div class="success-screen" id="successScreen">
    <div class="success-icon">🎉</div>
    <h2>Order Placed!</h2>
    <p>Your food is on the way. Estimated delivery: 25–35 mins</p>
    <button class="back-home" id="backHomeBtn">Back to Menu</button>
  </div>

  <!-- CART -->
  <div class="cart-overlay" id="cartOverlay"></div>
  <div class="cart-drawer" id="cartDrawer">
    <div class="cart-header">
      <h2>Your Cart</h2>
      <button class="close-cart" id="closeCartBtn">×</button>
    </div>
    <div class="cart-items" id="cartItems"></div>
    <div class="cart-summary" id="cartSummary">
      <div class="summary-row">
        <span>Subtotal</span>
        <span id="subtotal">₦0</span>
      </div>
      <div class="summary-row">
        <span>Delivery Fee</span>
        <span>₦500</span>
      </div>
      <div class="summary-row total">
        <span>Total</span>
        <span id="total">₦0</span>
      </div>
      <button class="checkout-btn" id="checkoutBtn" disabled>Place Order</button>
    </div>
  </div>

  <footer>
    © <span id="year"></span> QuickChop • Made in Nigeria
  </footer>

  <script>
    // ============ DATA ============
    const foods = [
      { id: 1, name: "Jollof Rice & Chicken", category: "Rice", price: 3500, emoji: "🍛", rating: 4.8 },
      { id: 2, name: "Fried Rice & Turkey", category: "Rice", price: 3800, emoji: "🍚", rating: 4.7 },
      { id: 3, name: "Suya (Beef)", category: "Grills", price: 2500, emoji: "🥩", rating: 4.9 },
      { id: 4, name: "Chicken Suya", category: "Grills", price: 2800, emoji: "🍗", rating: 4.6 },
      { id: 5, name: "Shawarma", category: "Fast Food", price: 2200, emoji: "🌯", rating: 4.5 },
      { id: 6, name: "Burger & Fries", category: "Fast Food", price: 3000, emoji: "🍔", rating: 4.4 },
      { id: 7, name: "Pounded Yam & Egusi", category: "Swallow", price: 3200, emoji: "🥣", rating: 4.8 },
      { id: 8, name: "Eba & Okro Soup", category: "Swallow", price: 2800, emoji: "🍲", rating: 4.6 },
      { id: 9, name: "Chapman", category: "Drinks", price: 1200, emoji: "🍹", rating: 4.7 },
      { id: 10, name: "Zobo", category: "Drinks", price: 800, emoji: "🧃", rating: 4.5 },
      { id: 11, name: "Pepper Soup", category: "Grills", price: 3000, emoji: "🌶️", rating: 4.8 },
      { id: 12, name: "Asun", category: "Grills", price: 3500, emoji: "🔥", rating: 4.9 },
    ];

    // ============ STATE ============
    let cart = JSON.parse(localStorage.getItem("quickchop_cart") || "[]");
    let currentCategory = "all";
    let searchTerm = "";

    // ============ HELPERS ============
    function saveCart() {
      localStorage.setItem("quickchop_cart", JSON.stringify(cart));
    }

    function formatPrice(n) {
      return "₦" + n.toLocaleString();
    }

    function getCartCount() {
      return cart.reduce((sum, item) => sum + item.qty, 0);
    }

    function getSubtotal() {
      return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    }

    // ============ RENDER FOODS ============
    function renderFoods() {
      const grid = document.getElementById("foodGrid");
      let list = foods;

      if (currentCategory !== "all") {
        list = list.filter(f => f.category === currentCategory);
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        list = list.filter(f =>
          f.name.toLowerCase().includes(term) ||
          f.category.toLowerCase().includes(term)
        );
      }

      if (list.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#6c757d;padding:40px 0">No items found</p>`;
        return;
      }

      grid.innerHTML = list.map(f => `
        <div class="food-card">
          <div class="food-img">${f.emoji}</div>
          <div class="food-body">
            <div class="food-name">${f.name}</div>
            <div class="food-meta">⭐ ${f.rating} • ${f.category}</div>
            <div class="food-price">${formatPrice(f.price)}</div>
            <button class="add-btn" data-id="${f.id}">Add to Cart</button>
          </div>
        </div>
      `).join("");

      // Attach listeners
      grid.querySelectorAll(".add-btn").forEach(btn => {
        btn.addEventListener("click", () => addToCart(+btn.dataset.id));
      });
    }

    // ============ CART LOGIC ============
    function addToCart(id) {
      const food = foods.find(f => f.id === id);
      if (!food) return;

      const existing = cart.find(item => item.id === id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ ...food, qty: 1 });
      }
      saveCart();
      updateCartUI();
      // small feedback
      const btn = document.querySelector(`.add-btn[data-id="${id}"]`);
      if (btn) {
        const original = btn.textContent;
        btn.textContent = "Added ✓";
        btn.style.background = "#2a9d8f";
        setTimeout(() => {
          btn.textContent = original;
          btn.style.background = "";
        }, 800);
      }
    }

    function changeQty(id, delta) {
      const item = cart.find(i => i.id === id);
      if (!item) return;
      item.qty += delta;
      if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
      }
      saveCart();
      updateCartUI();
    }

    function updateCartUI() {
      // badge
      document.getElementById("cartCount").textContent = getCartCount();

      // cart items
      const container = document.getElementById("cartItems");
      if (cart.length === 0) {
        container.innerHTML = `<div class="empty-cart">Your cart is empty</div>`;
        document.getElementById("checkoutBtn").disabled = true;
      } else {
        container.innerHTML = cart.map(item => `
          <div class="cart-item">
            <div style="font-size:1.8rem">${item.emoji}</div>
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">${formatPrice(item.price)}</div>
            </div>
            <div class="qty-controls">
              <button class="qty-btn" data-id="${item.id}" data-delta="-1">−</button>
              <span>${item.qty}</span>
              <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button>
            </div>
          </div>
        `).join("");

        container.querySelectorAll(".qty-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            changeQty(+btn.dataset.id, +btn.dataset.delta);
          });
        });
        document.getElementById("checkoutBtn").disabled = false;
      }

      // totals
      const sub = getSubtotal();
      document.getElementById("subtotal").textContent = formatPrice(sub);
      document.getElementById("total").textContent = formatPrice(sub + (sub > 0 ? 500 : 0));
    }

    // ============ CART OPEN / CLOSE ============
    function openCart() {
      document.getElementById("cartOverlay").classList.add("open");
      document.getElementById("cartDrawer").classList.add("open");
    }
    function closeCart() {
      document.getElementById("cartOverlay").classList.remove("open");
      document.getElementById("cartDrawer").classList.remove("open");
    }

    // ============ CHECKOUT ============
    function placeOrder() {
      if (cart.length === 0) return;
      cart = [];
      saveCart();
      updateCartUI();
      closeCart();
      document.querySelector(".section").style.display = "none";
      document.querySelector(".categories").style.display = "none";
      document.querySelector(".search-bar").style.display = "none";
      document.getElementById("successScreen").classList.add("show");
    }

    function backToMenu() {
      document.getElementById("successScreen").classList.remove("show");
      document.querySelector(".section").style.display = "block";
      document.querySelector(".categories").style.display = "flex";
      document.querySelector(".search-bar").style.display = "block";
    }

    // ============ EVENT LISTENERS ============
    document.getElementById("openCartBtn").addEventListener("click", openCart);
    document.getElementById("closeCartBtn").addEventListener("click", closeCart);
    document.getElementById("cartOverlay").addEventListener("click", closeCart);
    document.getElementById("checkoutBtn").addEventListener("click", placeOrder);
    document.getElementById("backHomeBtn").addEventListener("click", backToMenu);

    // Categories
    document.getElementById("categories").addEventListener("click", (e) => {
      if (e.target.classList.contains("cat-btn")) {
        document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        currentCategory = e.target.dataset.cat;
        renderFoods();
      }
    });

    // Search
    document.getElementById("searchInput").addEventListener("input", (e) => {
      searchTerm = e.target.value.trim();
      renderFoods();
    });

    // Year
    document.getElementById("year").textContent = new Date().getFullYear();

    // Init
    renderFoods();
    updateCartUI();
  </script>
</body>
</html>