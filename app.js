// ─── You Care — Application State & Router ────────────────────────────────────

const App = {
  currentUser: null,
  currentPage: null,
  searchResults: [],
  selectedProduct: null,
  searchQuery: "",

  init() {
    const saved = localStorage.getItem("yc_user");
    if (saved) this.currentUser = JSON.parse(saved);
    this.route(location.hash || "#landing");
    window.addEventListener("hashchange", () => this.route(location.hash));
  },

  route(hash) {
    const page = hash.replace("#", "") || "landing";
    this.currentPage = page;
    const protectedPages = ["dashboard", "search", "results", "product"];
    if (protectedPages.includes(page) && !this.currentUser) {
      this.navigate("auth");
      return;
    }
    this.render(page);
  },

  navigate(page, data = {}) {
    Object.assign(this, data);
    location.hash = "#" + page;
  },

  login(email, password) {
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      this.currentUser = user;
      localStorage.setItem("yc_user", JSON.stringify(user));
      return true;
    }
    return false;
  },

  register(name, email, password) {
    const newUser = {
      id: "u" + Date.now(),
      email, password, name, age: null,
      treatments: [], photo: null,
    };
    MOCK_USERS.push(newUser);
    this.currentUser = newUser;
    localStorage.setItem("yc_user", JSON.stringify(newUser));
    return newUser;
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem("yc_user");
    this.navigate("landing");
  },

  addTreatment(treatment) {
    this.currentUser.treatments.push(treatment);
    localStorage.setItem("yc_user", JSON.stringify(this.currentUser));
  },

  removeTreatment(id) {
    this.currentUser.treatments = this.currentUser.treatments.filter(t => t.id !== id);
    localStorage.setItem("yc_user", JSON.stringify(this.currentUser));
    this.render("dashboard");
  },

  runSearch(query) {
    this.searchQuery = query;
    this.searchResults = searchProducts(query);
    this.navigate("results");
  },

  render(page) {
    const app = document.getElementById("app");
    app.style.opacity = "0";
    setTimeout(() => {
      app.innerHTML = Pages[page] ? Pages[page]() : Pages.landing();
      app.style.opacity = "1";
      this.bindEvents(page);
    }, 120);
  },

  bindEvents(page) {
    // Nav logout
    document.querySelectorAll("[data-action='logout']").forEach(el =>
      el.addEventListener("click", () => this.logout()));

    // Nav links
    document.querySelectorAll("[data-nav]").forEach(el =>
      el.addEventListener("click", e => {
        e.preventDefault();
        this.navigate(el.dataset.nav);
      }));

    if (page === "auth") this.bindAuth();
    if (page === "dashboard") this.bindDashboard();
    if (page === "search") this.bindSearch();
    if (page === "results") this.bindResults();
    if (page === "product") this.bindProduct();
  },

  bindAuth() {
    const tabs = document.querySelectorAll("[data-tab]");
    tabs.forEach(t => t.addEventListener("click", () => {
      tabs.forEach(x => x.classList.remove("tab-active"));
      t.classList.add("tab-active");
      document.querySelectorAll("[data-panel]").forEach(p => p.classList.add("hidden"));
      document.querySelector(`[data-panel='${t.dataset.tab}']`).classList.remove("hidden");
    }));

    document.getElementById("login-form")?.addEventListener("submit", e => {
      e.preventDefault();
      const email = e.target.email.value;
      const pass = e.target.password.value;
      if (this.login(email, pass)) {
        this.navigate("dashboard");
      } else {
        document.getElementById("login-error").classList.remove("hidden");
      }
    });

    document.getElementById("register-form")?.addEventListener("submit", e => {
      e.preventDefault();
      const name = e.target.name.value;
      const email = e.target.email.value;
      const pass = e.target.password.value;
      this.register(name, email, pass);
      this.navigate("dashboard");
    });
  },

  bindDashboard() {
    document.getElementById("add-treatment-btn")?.addEventListener("click", () => {
      document.getElementById("add-treatment-panel").classList.toggle("hidden");
    });

    document.getElementById("treatment-form")?.addEventListener("submit", e => {
      e.preventDefault();
      const name = e.target.tname.value;
      const type = e.target.ttype.value;
      const since = e.target.tsince.value;
      this.addTreatment({ id: "t" + Date.now(), name, type, since });
      this.render("dashboard");
    });

    document.querySelectorAll("[data-remove-treatment]").forEach(btn =>
      btn.addEventListener("click", () => this.removeTreatment(btn.dataset.removeTreatment)));

    document.querySelectorAll("[data-search-treatment]").forEach(btn =>
      btn.addEventListener("click", () => {
        this.navigate("search", { searchQuery: btn.dataset.searchTreatment });
      }));
  },

  bindSearch() {
    const textarea = document.getElementById("search-input");
    if (textarea && this.searchQuery) textarea.value = this.searchQuery;

    document.getElementById("search-form")?.addEventListener("submit", e => {
      e.preventDefault();
      const query = document.getElementById("search-input").value.trim();
      if (query) this.runSearch(query);
    });

    // Suggestion chips
    document.querySelectorAll("[data-suggestion]").forEach(chip =>
      chip.addEventListener("click", () => {
        document.getElementById("search-input").value = chip.dataset.suggestion;
        document.getElementById("search-input").focus();
      }));

    // Photo upload simulation
    document.getElementById("photo-upload")?.addEventListener("change", e => {
      if (e.target.files[0]) {
        const preview = document.getElementById("photo-preview");
        preview.src = URL.createObjectURL(e.target.files[0]);
        preview.classList.remove("hidden");
        document.getElementById("ai-analyzing").classList.remove("hidden");
        document.getElementById("ai-result").classList.add("hidden");
        setTimeout(() => {
          document.getElementById("ai-analyzing").classList.add("hidden");
          document.getElementById("ai-result").classList.remove("hidden");
          document.getElementById("search-input").value =
            "Lentilles journalières myopie -3.5 dioptries (détecté depuis ordonnance)";
        }, 2200);
      }
    });
  },

  bindResults() {
    document.querySelectorAll("[data-product-id]").forEach(card =>
      card.addEventListener("click", () => {
        const id = card.dataset.productId;
        this.selectedProduct = MOCK_PRODUCTS.find(p => p.id === id);
        this.navigate("product");
      }));

    // Filter tabs
    const filterBtns = document.querySelectorAll("[data-filter]");
    filterBtns.forEach(btn => btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("filter-active"));
      btn.classList.add("filter-active");
      const f = btn.dataset.filter;
      document.querySelectorAll("[data-product-id]").forEach(card => {
        if (f === "all") card.style.display = "";
        else card.style.display = card.dataset.category === f ? "" : "none";
      });
    }));
  },

  bindProduct() {
    document.querySelectorAll("[data-product-id]").forEach(card =>
      card.addEventListener("click", () => {
        const id = card.dataset.productId;
        this.selectedProduct = MOCK_PRODUCTS.find(p => p.id === id);
        this.navigate("product");
      }));
  },
};

// ─── Pages ─────────────────────────────────────────────────────────────────────

const Pages = {

  landing() {
    return `
    <div class="min-h-screen bg-white">
      ${Nav.guest()}
      <!-- Hero -->
      <section class="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pt-24 pb-32">
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
          <div class="absolute top-32 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>
        <div class="relative max-w-5xl mx-auto px-6 text-center">
          <span class="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Consommation médicale éthique & transparente
          </span>
          <h1 class="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Vous savez ce que vous<br>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">mettez dans votre corps.</span>
          </h1>
          <p class="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            Décrivez votre traitement, You Care analyse et vous montre les produits correspondants — avec leur empreinte carbone, conditions de fabrication et coût réel.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#" data-nav="auth" class="btn-primary text-lg px-8 py-4">
              Commencer gratuitement
            </a>
            <a href="#" data-nav="search" class="btn-ghost text-lg px-8 py-4">
              Recherche rapide →
            </a>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section class="py-24 bg-white">
        <div class="max-w-5xl mx-auto px-6">
          <div class="text-center mb-16">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
            <p class="text-gray-500">Trois étapes pour consommer en conscience</p>
          </div>
          <div class="grid md:grid-cols-3 gap-8">
            ${[
              { icon: "🩺", n: "01", title: "Décrivez votre traitement", desc: "Tapez votre condition ou traitement actuel. Vous pouvez aussi photographier une ordonnance — notre IA l'interprète." },
              { icon: "🔍", n: "02", title: "L'IA analyse & recommande", desc: "Nous croisons votre besoin médical avec notre base de produits et leur score éthique, environnemental et social." },
              { icon: "📋", n: "03", title: "Consultez la fiche complète", desc: "Qui a fabriqué ce produit ? À quel coût ? Quelle empreinte carbone ? Vous savez tout avant d'acheter." },
            ].map(s => `
              <div class="card p-8 text-center group hover:shadow-lg transition-all duration-300">
                <div class="text-4xl mb-4">${s.icon}</div>
                <div class="text-xs font-bold text-emerald-500 mb-2 tracking-widest">${s.n}</div>
                <h3 class="text-lg font-semibold text-gray-900 mb-3">${s.title}</h3>
                <p class="text-gray-500 text-sm leading-relaxed">${s.desc}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- Categories -->
      <section class="py-20 bg-gray-50">
        <div class="max-w-5xl mx-auto px-6">
          <div class="text-center mb-14">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Tous types de dispositifs médicaux</h2>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${[
              { icon: "👁️", label: "Lentilles", q: "lentilles myopie" },
              { icon: "💊", label: "Médicaments", q: "allergie antihistaminique" },
              { icon: "🦾", label: "Prothèses", q: "prothèse genou" },
              { icon: "🩹", label: "Dispositifs", q: "dispositif médical" },
            ].map(c => `
              <a href="#" data-nav="search" class="card p-6 text-center cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group">
                <div class="text-3xl mb-3">${c.icon}</div>
                <div class="text-sm font-medium text-gray-700 group-hover:text-emerald-600">${c.label}</div>
              </a>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- Trust signals -->
      <section class="py-20 bg-white">
        <div class="max-w-5xl mx-auto px-6">
          <div class="grid md:grid-cols-4 gap-8 text-center">
            ${[
              { n: "2 400+", label: "Produits référencés" },
              { n: "94 %", label: "Précision IA ordonnance" },
              { n: "12 critères", label: "d'évaluation éthique" },
              { n: "100 %", label: "Données vérifiées" },
            ].map(s => `
              <div>
                <div class="text-3xl font-bold text-emerald-600 mb-1">${s.n}</div>
                <div class="text-sm text-gray-500">${s.label}</div>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="py-24 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center">
        <div class="max-w-2xl mx-auto px-6">
          <h2 class="text-3xl font-bold mb-4">Prêt·e à consommer en conscience ?</h2>
          <p class="text-emerald-100 mb-8 text-lg">Créez votre compte gratuit en 30 secondes.</p>
          <a href="#" data-nav="auth" class="bg-white text-emerald-700 font-semibold px-8 py-4 rounded-xl hover:bg-emerald-50 transition inline-block">
            Créer mon compte →
          </a>
        </div>
      </section>

      ${Footer()}
    </div>`;
  },

  auth() {
    return `
    <div class="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col">
      ${Nav.guest()}
      <div class="flex-1 flex items-center justify-center px-4 py-20">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-4 shadow-lg">
              <span class="text-2xl">💚</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">You Care</h1>
            <p class="text-gray-500 text-sm mt-1">Votre espace santé éthique</p>
          </div>

          <!-- Tabs -->
          <div class="card overflow-hidden">
            <div class="flex border-b border-gray-100">
              <button data-tab="login" class="tab-btn tab-active flex-1 py-3.5 text-sm font-medium">Connexion</button>
              <button data-tab="register" class="tab-btn flex-1 py-3.5 text-sm font-medium text-gray-400">Créer un compte</button>
            </div>

            <!-- Login -->
            <div data-panel="login" class="p-8">
              <div id="login-error" class="hidden bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
                Email ou mot de passe incorrect.
              </div>
              <form id="login-form" class="space-y-4">
                <div>
                  <label class="label">Adresse email</label>
                  <input type="email" name="email" value="alice@example.com" class="input" placeholder="vous@exemple.com" required>
                </div>
                <div>
                  <label class="label">Mot de passe</label>
                  <input type="password" name="password" value="password" class="input" placeholder="••••••••" required>
                </div>
                <button type="submit" class="btn-primary w-full py-3 mt-2">Se connecter</button>
              </form>
              <p class="text-center text-xs text-gray-400 mt-4">Demo : alice@example.com / password</p>
            </div>

            <!-- Register -->
            <div data-panel="register" class="p-8 hidden">
              <form id="register-form" class="space-y-4">
                <div>
                  <label class="label">Nom complet</label>
                  <input type="text" name="name" class="input" placeholder="Alice Martin" required>
                </div>
                <div>
                  <label class="label">Adresse email</label>
                  <input type="email" name="email" class="input" placeholder="vous@exemple.com" required>
                </div>
                <div>
                  <label class="label">Mot de passe</label>
                  <input type="password" name="password" class="input" placeholder="8 caractères minimum" required minlength="6">
                </div>
                <button type="submit" class="btn-primary w-full py-3 mt-2">Créer mon compte</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  },

  dashboard() {
    const u = App.currentUser;
    const typeColors = {
      vision: "bg-blue-100 text-blue-700",
      allergie: "bg-yellow-100 text-yellow-700",
      chronique: "bg-red-100 text-red-700",
      autre: "bg-gray-100 text-gray-700",
    };
    return `
    <div class="min-h-screen bg-gray-50">
      ${Nav.user()}
      <main class="max-w-4xl mx-auto px-4 py-12">

        <!-- Header -->
        <div class="flex items-center gap-4 mb-10">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
            ${u.name.charAt(0)}
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Bonjour, ${u.name.split(" ")[0]} 👋</h1>
            <p class="text-gray-500 text-sm">${u.email}</p>
          </div>
        </div>

        <!-- Quick action -->
        <a href="#" data-nav="search" class="flex items-center gap-4 card p-5 mb-8 hover:shadow-md transition cursor-pointer border-2 border-dashed border-emerald-200 hover:border-emerald-400 group">
          <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 text-xl group-hover:bg-emerald-200 transition">🔍</div>
          <div>
            <div class="font-semibold text-gray-900">Nouvelle recherche</div>
            <div class="text-sm text-gray-400">Décrivez un traitement ou photographiez une ordonnance</div>
          </div>
          <div class="ml-auto text-gray-300 group-hover:text-emerald-500 transition text-xl">→</div>
        </a>

        <!-- Treatments -->
        <div class="card p-6 mb-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-semibold text-gray-900 text-lg">Mes traitements</h2>
            <button id="add-treatment-btn" class="btn-ghost text-sm px-4 py-2">+ Ajouter</button>
          </div>

          <!-- Add form -->
          <div id="add-treatment-panel" class="hidden bg-emerald-50 rounded-xl p-5 mb-5">
            <form id="treatment-form" class="grid grid-cols-2 gap-3">
              <div class="col-span-2">
                <label class="label">Traitement / Condition</label>
                <input name="tname" class="input" placeholder="ex : Myopie -3.5, Allergie aux acariens…" required>
              </div>
              <div>
                <label class="label">Type</label>
                <select name="ttype" class="input">
                  <option value="vision">Vision</option>
                  <option value="allergie">Allergie</option>
                  <option value="chronique">Chronique</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label class="label">Depuis (année)</label>
                <input name="tsince" class="input" placeholder="2020" type="number" min="1900" max="2026">
              </div>
              <div class="col-span-2 flex gap-2 justify-end">
                <button type="button" id="add-treatment-btn" class="btn-ghost text-sm px-4 py-2">Annuler</button>
                <button type="submit" class="btn-primary text-sm px-6 py-2">Enregistrer</button>
              </div>
            </form>
          </div>

          ${u.treatments.length === 0 ? `
            <div class="text-center py-10 text-gray-400">
              <div class="text-4xl mb-2">🩺</div>
              <p class="text-sm">Aucun traitement enregistré</p>
            </div>
          ` : `
            <div class="space-y-3">
              ${u.treatments.map(t => `
                <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition group">
                  <div class="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-lg">${t.type === "vision" ? "👁️" : t.type === "allergie" ? "🌿" : "💊"}</div>
                  <div class="flex-1">
                    <div class="font-medium text-gray-800 text-sm">${t.name}</div>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[t.type] || typeColors.autre}">${t.type}</span>
                      ${t.since ? `<span class="text-xs text-gray-400">depuis ${t.since}</span>` : ""}
                    </div>
                  </div>
                  <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button data-search-treatment="${t.name}" class="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-medium transition">
                      Rechercher
                    </button>
                    <button data-remove-treatment="${t.id}" class="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg transition">
                      ✕
                    </button>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </div>

        <!-- Stats placeholder -->
        <div class="grid grid-cols-3 gap-4">
          ${[
            { icon: "🔍", label: "Recherches", val: "12" },
            { icon: "📋", label: "Produits consultés", val: "34" },
            { icon: "♻️", label: "CO₂ économisé potentiel", val: "4.2 kg" },
          ].map(s => `
            <div class="card p-5 text-center">
              <div class="text-2xl mb-1">${s.icon}</div>
              <div class="text-xl font-bold text-gray-900">${s.val}</div>
              <div class="text-xs text-gray-400 mt-0.5">${s.label}</div>
            </div>
          `).join("")}
        </div>

      </main>
    </div>`;
  },

  search() {
    return `
    <div class="min-h-screen bg-gray-50">
      ${Nav.user()}
      <main class="max-w-3xl mx-auto px-4 py-12">
        <div class="text-center mb-10">
          <h1 class="text-3xl font-bold text-gray-900 mb-3">Que recherchez-vous ?</h1>
          <p class="text-gray-500">Décrivez votre condition, traitement ou produit médical. Vous pouvez aussi uploader une ordonnance.</p>
        </div>

        <div class="card p-8 mb-6">
          <form id="search-form">
            <label class="label text-base mb-3 block">Description de votre besoin</label>
            <textarea
              id="search-input"
              class="input resize-none text-base"
              rows="4"
              placeholder="Ex : Je suis myope à -3.5 dioptries et je cherche des lentilles journalières respectueuses de l'environnement…"
            >${App.searchQuery || ""}</textarea>

            <!-- Suggestions -->
            <div class="flex flex-wrap gap-2 mt-3 mb-6">
              <span class="text-xs text-gray-400 self-center">Suggestions :</span>
              ${[
                "Lentilles myopie -3.5",
                "Allergie aux acariens",
                "Prothèse de genou",
                "Antihistaminique",
              ].map(s => `
                <button type="button" data-suggestion="${s}" class="chip">${s}</button>
              `).join("")}
            </div>

            <button type="submit" class="btn-primary w-full py-4 text-base">
              🔍 Analyser et trouver les produits
            </button>
          </form>
        </div>

        <!-- Photo upload -->
        <div class="card p-6">
          <h3 class="font-semibold text-gray-900 mb-1">📷 Analyser une ordonnance</h3>
          <p class="text-sm text-gray-400 mb-4">Photographiez ou uploadez votre ordonnance — notre IA extrait les informations automatiquement.</p>

          <label class="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition group">
            <input type="file" id="photo-upload" accept="image/*" class="hidden">
            <div class="text-3xl mb-2">📄</div>
            <span class="text-sm text-gray-500 group-hover:text-emerald-600">Cliquez ou glissez une image</span>
            <span class="text-xs text-gray-400 mt-1">JPG, PNG, HEIC — max 10 Mo</span>
          </label>

          <img id="photo-preview" class="hidden w-full max-h-48 object-contain rounded-xl mt-4 border border-gray-100">

          <div id="ai-analyzing" class="hidden mt-4 flex items-center gap-3 bg-teal-50 p-4 rounded-xl">
            <div class="ai-spinner"></div>
            <div>
              <div class="text-sm font-medium text-teal-800">Analyse en cours…</div>
              <div class="text-xs text-teal-600">L'IA lit votre ordonnance</div>
            </div>
          </div>

          <div id="ai-result" class="hidden mt-4 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
            <div class="text-xs font-semibold text-emerald-700 mb-1">✓ Ordonnance analysée</div>
            <div class="text-sm text-gray-700">Détecté : <strong>Lentilles journalières myopie -3.5 dioptries</strong></div>
            <button type="button" class="text-xs text-emerald-600 underline mt-1" onclick="document.getElementById('search-form').dispatchEvent(new Event('submit'))">
              Lancer la recherche avec ce résultat →
            </button>
          </div>
        </div>
      </main>
    </div>`;
  },

  results() {
    const results = App.searchResults;
    const categories = [...new Set(results.map(p => p.category))];

    return `
    <div class="min-h-screen bg-gray-50">
      ${Nav.user()}
      <main class="max-w-5xl mx-auto px-4 py-10">

        <!-- Header -->
        <div class="mb-8">
          <button data-nav="search" class="text-sm text-gray-400 hover:text-emerald-600 transition mb-4 flex items-center gap-1">
            ← Modifier la recherche
          </button>
          <h1 class="text-2xl font-bold text-gray-900">${results.length} produit${results.length > 1 ? "s" : ""} correspondant${results.length > 1 ? "s" : ""}</h1>
          <p class="text-gray-400 text-sm mt-1">« ${App.searchQuery} »</p>
        </div>

        <!-- Filters -->
        <div class="flex gap-2 flex-wrap mb-6">
          <button data-filter="all" class="chip filter-active">Tous (${results.length})</button>
          ${categories.map(cat => `
            <button data-filter="${cat}" class="chip">${cat.charAt(0).toUpperCase() + cat.slice(1)} (${results.filter(p => p.category === cat).length})</button>
          `).join("")}
        </div>

        <!-- Cards -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          ${results.map(p => ProductCard(p)).join("")}
        </div>
      </main>
    </div>`;
  },

  product() {
    const p = App.selectedProduct;
    if (!p) return Pages.results();
    const alternatives = p.alternatives.map(id => MOCK_PRODUCTS.find(x => x.id === id)).filter(Boolean);

    return `
    <div class="min-h-screen bg-gray-50">
      ${Nav.user()}
      <main class="max-w-4xl mx-auto px-4 py-10">

        <button data-nav="results" class="text-sm text-gray-400 hover:text-emerald-600 transition mb-6 flex items-center gap-1">
          ← Retour aux résultats
        </button>

        <!-- Hero product -->
        <div class="card overflow-hidden mb-6">
          <div class="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div class="absolute bottom-4 left-6 text-white">
              <div class="text-xs font-medium opacity-75 mb-1">${p.brand}</div>
              <h1 class="text-2xl font-bold">${p.name}</h1>
              <p class="text-sm opacity-80">${p.tagline}</p>
            </div>
            <div class="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full ${p.match >= 90 ? "bg-emerald-500" : p.match >= 75 ? "bg-yellow-500" : "bg-orange-500"}"></span>
              <span class="text-sm font-bold text-gray-800">${p.match} % match</span>
            </div>
          </div>

          <!-- Tags & indication -->
          <div class="p-6">
            <div class="flex flex-wrap gap-2 mb-4">
              ${p.tags.map(t => `<span class="tag">${t}</span>`).join("")}
            </div>
            <div class="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm text-blue-800">
              <strong>Indication :</strong> ${p.indication}
            </div>
          </div>
        </div>

        <!-- Score radar -->
        <div class="card p-6 mb-6">
          <h2 class="section-title mb-5">Score éthique global</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${Object.entries(p.score).map(([k, v]) => `
              <div class="text-center">
                <div class="relative inline-flex items-center justify-center w-16 h-16 mb-2">
                  <svg class="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" stroke-width="3"/>
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke="${v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : "#ef4444"}"
                      stroke-width="3"
                      stroke-dasharray="${v} ${100 - v}"
                      stroke-linecap="round"/>
                  </svg>
                  <span class="absolute text-sm font-bold text-gray-800">${v}</span>
                </div>
                <div class="text-xs text-gray-500 capitalize">${k}</div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Grid of info sections -->
        <div class="grid md:grid-cols-2 gap-6 mb-6">

          <!-- Fabricant -->
          <div class="card p-6">
            <h2 class="section-title mb-4">🏭 Fabricant</h2>
            <div class="space-y-2 text-sm">
              ${InfoRow("Entreprise", p.ethics.manufacturer)}
              ${InfoRow("Pays", `${p.ethics.country} — ${p.ethics.city}`)}
              ${InfoRow("Fondée en", p.ethics.founded)}
              ${InfoRow("Employés", p.ethics.employees.toLocaleString("fr-FR"))}
              ${InfoRow("Tests animaux", p.ethics.animalTesting ? "❌ Oui" : "✅ Non")}
              ${InfoRow("Vegan", p.ethics.vegan ? "✅ Oui" : "❌ Non")}
            </div>
            <div class="mt-4 pt-4 border-t border-gray-100">
              <div class="text-xs text-gray-500 font-medium mb-2">Conditions sociales</div>
              <p class="text-sm text-gray-600">${p.ethics.workerConditions}</p>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-100">
              <div class="text-xs text-gray-500 font-medium mb-2">Certifications</div>
              <div class="flex flex-wrap gap-1.5">
                ${p.ethics.certifications.map(c => `<span class="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">${c}</span>`).join("")}
              </div>
            </div>
          </div>

          <!-- Supply chain -->
          <div class="card p-6">
            <h2 class="section-title mb-4">🌍 Chaîne d'approvisionnement</h2>
            <div class="space-y-2 text-sm mb-4">
              ${InfoRow("Matière première", p.supply.rawMaterial)}
              ${InfoRow("Emballage", p.supply.packagingMaterial)}
              ${InfoRow("Transport", p.supply.transportMode)}
            </div>
            <div class="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 leading-relaxed mb-4">
              <strong>Traçabilité :</strong> ${p.supply.supplyChain}
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-emerald-50 rounded-xl p-3 text-center">
                <div class="text-lg font-bold text-emerald-700">${p.supply.co2PerUnit} kg</div>
                <div class="text-xs text-emerald-600">CO₂eq / unité</div>
              </div>
              <div class="bg-blue-50 rounded-xl p-3 text-center">
                <div class="text-lg font-bold text-blue-700">${p.supply.waterLitersPerUnit} L</div>
                <div class="text-xs text-blue-600">Eau / unité</div>
              </div>
            </div>
          </div>

          <!-- Coût -->
          <div class="card p-6">
            <h2 class="section-title mb-4">💰 Transparence des coûts</h2>
            <div class="space-y-3">
              ${CostBar("Fabrication", p.cost.manufacturingCost, p.cost.retailPrice)}
              ${CostBar("Prix de vente", p.cost.retailPrice, p.cost.retailPrice)}
            </div>
            <div class="mt-4 pt-4 border-t border-gray-100 text-sm space-y-1">
              ${InfoRow("Marge estimée", `${p.cost.margin} %`)}
              ${InfoRow("Comparaison marché", p.cost.compareMarket)}
            </div>
          </div>

          <!-- Specs -->
          <div class="card p-6">
            <h2 class="section-title mb-4">📐 Caractéristiques</h2>
            <div class="space-y-2 text-sm">
              ${Object.entries(p.specs).map(([k, v]) => InfoRow(k.charAt(0).toUpperCase() + k.slice(1), v)).join("")}
            </div>
            <div class="mt-4 pt-4 border-t border-gray-100">
              <div class="text-xs text-gray-500 font-medium mb-2">♻️ Fin de vie</div>
              <p class="text-sm text-gray-600">${p.endOfLife}</p>
            </div>
          </div>

        </div>

        <!-- Alternatives -->
        ${alternatives.length > 0 ? `
        <div class="card p-6 mb-6">
          <h2 class="section-title mb-4">Alternatives à comparer</h2>
          <div class="grid sm:grid-cols-${Math.min(alternatives.length, 3)} gap-4">
            ${alternatives.map(a => ProductCard(a, true)).join("")}
          </div>
        </div>
        ` : ""}

      </main>
    </div>`;
  },
};

// ─── Component helpers ────────────────────────────────────────────────────────

function Nav(links, right) {
  return `
  <nav class="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
    <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
      <a href="#" data-nav="landing" class="flex items-center gap-2 font-bold text-gray-900 hover:text-emerald-600 transition">
        <span class="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-sm">YC</span>
        You Care
      </a>
      <div class="flex items-center gap-2">${links}</div>
      <div class="flex items-center gap-3">${right}</div>
    </div>
  </nav>
  <div class="h-16"></div>`;
}

Nav.guest = () => Nav(
  `<a href="#" data-nav="landing" class="nav-link">Accueil</a>`,
  `<a href="#" data-nav="auth" class="btn-primary text-sm px-5 py-2">Connexion</a>`
);

Nav.user = () => Nav(
  `<a href="#" data-nav="dashboard" class="nav-link">Mon espace</a>
   <a href="#" data-nav="search" class="nav-link">Recherche</a>`,
  `<span class="text-sm text-gray-500">${App.currentUser?.name?.split(" ")[0] || ""}</span>
   <button data-action="logout" class="btn-ghost text-sm px-4 py-2">Déconnexion</button>`
);

function Footer() {
  return `
  <footer class="bg-gray-900 text-gray-400 py-12">
    <div class="max-w-5xl mx-auto px-6 text-center">
      <div class="flex items-center justify-center gap-2 mb-4">
        <span class="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">YC</span>
        <span class="text-white font-semibold">You Care</span>
      </div>
      <p class="text-sm">Consommer en conscience — chaque produit médical raconté.</p>
      <p class="text-xs mt-4 opacity-50">© 2024 You Care — Données illustratives à des fins de démonstration</p>
    </div>
  </footer>`;
}

function ScoreBadge(score) {
  const color = score >= 80 ? "bg-emerald-100 text-emerald-700" :
                score >= 60 ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700";
  return `<span class="text-xs font-bold px-2 py-0.5 rounded-full ${color}">${score}</span>`;
}

function ProductCard(p, compact = false) {
  const avg = Math.round(Object.values(p.score).reduce((a, b) => a + b, 0) / 4);
  return `
  <div data-product-id="${p.id}" data-category="${p.category}"
    class="card cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden group">
    <div class="relative h-36 bg-gray-100 overflow-hidden">
      <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      <div class="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full ${p.match >= 90 ? "bg-emerald-500" : p.match >= 75 ? "bg-yellow-500" : "bg-orange-500"}"></span>
        <span class="text-xs font-bold text-gray-800">${p.match}%</span>
      </div>
    </div>
    <div class="p-4">
      <div class="text-xs text-gray-400 mb-0.5">${p.brand}</div>
      <h3 class="font-semibold text-gray-900 text-sm leading-snug mb-2">${p.name}</h3>
      <div class="flex items-center justify-between">
        <div class="flex gap-1 flex-wrap">
          ${p.tags.slice(0, 2).map(t => `<span class="tag text-xs">${t}</span>`).join("")}
        </div>
        <div class="flex items-center gap-1 text-xs text-gray-500">
          Score ${ScoreBadge(avg)}
        </div>
      </div>
    </div>
  </div>`;
}

function InfoRow(label, value) {
  return `
  <div class="flex justify-between gap-4">
    <span class="text-gray-400 shrink-0">${label}</span>
    <span class="text-gray-800 text-right font-medium">${value}</span>
  </div>`;
}

function CostBar(label, value, max) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return `
  <div>
    <div class="flex justify-between text-xs mb-1 text-gray-500">
      <span>${label}</span>
      <span class="font-semibold text-gray-800">${typeof value === "number" ? value.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €" : value}</span>
    </div>
    <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div class="h-full bg-emerald-500 rounded-full transition-all" style="width:${pct}%"></div>
    </div>
  </div>`;
}

// ─── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => App.init());
