let cart = [];

const BASE_PRICE = 9990;
const USLUZNA_STAMPA_PRICE = 11490;


const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const PRINT_OPTIONS = [
    { value: "", text: "Одаберите опцију" },
    { value: "bez-broja", text: "Без броја" },
    { value: "usluzna-stampa", text: "Услужна штампа" },
];


document.addEventListener("DOMContentLoaded", function () {
    loadCart();

    const path = window.location.pathname;

    if (path.includes("klubovi.html")) {
        loadTeamData("data/klubovi.json", "club-container");
    } else if (path.includes("dres.html")) {
        initializeDresPage();
    } else if (path.includes("korpa.html")) {
        updateCartDisplay();

        // Dodaj event listener za dugme za narudžbinu samo na stranici korpa.html
        const checkoutButton = document.querySelector(".checkout_button");
        if (checkoutButton) {
            checkoutButton.addEventListener("click", checkoutHandler);
        }
    } else if (path.includes("crvena-zvezda.html")) {
        loadTeamData("data/zvezda.json", "club-container");
    } else if (path.includes("retro-dresovi.html")) {
        loadTeamData("data/retro.json", "club-container");
    }

    updateCartCount(); // Ažuriraj broj proizvoda u korpi prilikom inicijalizacije
});


// Univerzalna funkcija za učitavanje dresova iz JSON-a i prikazivanje
function loadTeamData(jsonPath, containerId) {
    fetch(jsonPath)
        .then(response => response.json())
        .then(data => {
            generateDresoviBySeason(data, containerId);
        })
        .catch(error => console.error(`Greška prilikom učitavanja dresova iz ${jsonPath}:`, error));
}

// Funkcija za grupisanje i prikazivanje dresova po sezonama
function generateDresoviBySeason(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Kontejner za dresove nije pronađen: ${containerId}`);
        return;
    }

    container.innerHTML = ""; // Očisti prethodni sadržaj

    // Grupisanje dresova po sezoni i filtriranje samo slika koje završavaju sa "1"
    const seasonGroups = {};
    for (const season in data.seasons) {
        if (data.seasons.hasOwnProperty(season)) {
            const seasonDresovi = data.seasons[season];
            if (!seasonGroups[season]) {
                seasonGroups[season] = [];
            }
            seasonDresovi.forEach(item => {
                // Filtriranje samo slika koje završavaju sa "1"
                const filteredImages = item.images.filter(image => image.match(/1\.(jpg|png|jpeg|webp)$/i));
                if (filteredImages.length > 0) {
                    seasonGroups[season].push({ ...item, images: filteredImages });
                }
            });
        }
    }

    // Sortiranje sezona od najnovije ka starijoj
    const sortedSeasons = Object.keys(seasonGroups).sort((a, b) => {
        return b.localeCompare(a);
    });

    // Generisanje HTML-a za svaku sezonu i dresove unutar te sezone
    sortedSeasons.forEach(season => {
        const seasonTitleHTML = `
            <div class="col-12">
                <h2 class="text-center mt-5 mb-3">Сезона ${season}/${parseInt(season) + 1}</h2>
            </div>
        `;
        container.innerHTML += seasonTitleHTML;

        seasonGroups[season].forEach(item => {
            item.images.forEach(image => {
                const cardHTML = `
                    <div class="col-12 col-md-6 col-lg-4 mb-4">
                        <a href="dres.html?team=${item.team}&type=${item.type}&season=${season}" class="card-link">
                            <div class="card">
                                <img src="${image}" class="card-img-top" alt="${item.team} - ${item.type}">
                                <div class="card-body text-center">
                                    <h5 class="card-title">${formatTeamName(item.team)} - ${getTypeLabel(item.type)} (${season}/${parseInt(season) + 1})</h5>
                                </div>
                            </div>
                        </a>
                    </div>
                `;
                container.innerHTML += cardHTML;
            });
        });
    });
}

// Funkcija za učitavanje korpe iz localStorage
function loadCart() {
    cart = [];
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
        try {
            cart = JSON.parse(storedCart);
            cart.forEach(item => {
            // Osiguraj da je cena broj i da nije NaN
                if (typeof item.price !== 'number' || isNaN(item.price) || item.price <= 0) {
                    console.error("Neispravan artikal u korpi:", item);
                    item.price = BASE_PRICE; // Postavi podrazumevanu cenu ako nije ispravna
                }
            });
        } catch (error) {
            console.error("Greška pri parsiranju korpe iz localStorage:", error);
            cart = [];
        }
    }
}

function initializeDresPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const team = urlParams.get("team");
    const type = urlParams.get("type");
    const season = urlParams.get("season");

    let jsonPath = "data/klubovi.json";
    if (team === "crvena_zvezda") {
        jsonPath = "data/zvezda.json";
    } else if (parseInt(season) < 2015) {
        jsonPath = "data/retro.json";
    }

    fetch(jsonPath)
        .then(response => response.json())
        .then(data => {
            const seasonData = data.seasons[season];
            if (!seasonData) {
                console.error(`Sezona ${season} nije pronađena u podacima.`);
                return;
            }

            // Pronađi dres koji odgovara timu i tipu
            const dres = seasonData.find(item => item.team === team && item.type === type);
            if (dres) {
                const images = dres.images;

                if (images.length > 0) {
                    const swiperWrapper = document.getElementById("swiper-wrapper");

                    // Očisti prethodni sadržaj Swiper wrappera
                    swiperWrapper.innerHTML = "";

                    // Dinamičko dodavanje slika u Swiper
                    images.forEach(image => {
                        const slideDiv = document.createElement("div");
                        slideDiv.className = "swiper-slide";
                        slideDiv.innerHTML = `<img src="${image}" alt="${team} ${type} дрес">`;
                        swiperWrapper.appendChild(slideDiv);
                    });

                    // Inicijalizujte ili ponovo inicijalizujte Swiper nakon dodavanja slika
                    initializeSwiper();

                    const productTitle = document.getElementById("productTitle");
                    if (productTitle) {
                        productTitle.textContent = `${formatTeamName(team)} - ${getTypeLabel(type)} (${season}/${parseInt(season) + 1})`;
                    }
                }
            } else {
                console.error(`Dres tipa ${type} za tim ${team} i sezonu ${season} nije pronađen.`);
            }
        })
        .catch(error => console.error("Greška prilikom učitavanja podataka o dresu:", error));

    populateSizeOptions();
    populatePrintOptions();

    const printSelect = document.getElementById("pa_odabir-stampe");
    const addToCartButton = document.getElementById("addToCartButton");

    if (printSelect) {
        printSelect.addEventListener("change", updatePrice);
    }

    if (addToCartButton) {
        addToCartButton.addEventListener("click", handleAddToCart);
    }

    updatePrice(); // Postavi početnu cenu
}

function displayWarning(warningId, message) {
    const warningElement = document.getElementById(warningId);
    if (warningElement) {
        warningElement.textContent = message;
        warningElement.style.display = "block";

        setTimeout(() => {
            warningElement.style.display = "none";
        }, 3000);
    }
}


function populateSizeOptions() {
    const sizeButtonsContainer = document.getElementById("sizeButtons");
    if (!sizeButtonsContainer) {
        console.error("Kontejner za veličine nije pronađen.");
        return;
    }

    SIZE_OPTIONS.forEach(size => {
        const button = document.createElement("button");
        button.className = "size-button";
        button.textContent = size;
        button.addEventListener("click", event => selectSize(size, event));
        sizeButtonsContainer.appendChild(button);
    });
}

function populatePrintOptions() {
    const printSelect = document.getElementById("pa_odabir-stampe");
    const personalizationFields = document.getElementById("personalizationFields");
    if (!printSelect) {
        console.error("Select za štampu nije pronađen.");
        return;
    }

    PRINT_OPTIONS.forEach(option => {
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.text;
        printSelect.appendChild(opt);
    });

    // Dodavanje event listenera za prikazivanje/sklanjanje polja za ime i broj
    printSelect.addEventListener("change", () => {
        const printWarning = document.getElementById("printWarning");
        if (printWarning && printSelect.value !== "") {
            printWarning.style.display = "none";
        }

        // Prikazivanje ili skrivanje polja za personalizaciju
        if (printSelect.value === "usluzna-stampa") {
            personalizationFields.style.display = "block";
        } else {
            personalizationFields.style.display = "none";
        }
    });
}

function selectSize(size, event) {
    const buttons = document.querySelectorAll(".size-button");
    buttons.forEach(button => button.classList.remove("selected"));
    event.target.classList.add("selected");
    const sizeWarning = document.getElementById("sizeWarning");
    if (sizeWarning) {
        sizeWarning.style.display = "none";
    }
}

function updatePrice() {
    const printSelect = document.getElementById("pa_odabir-stampe");
    const priceElement = document.getElementById("productPrice");
    let priceText = "Цена: од 9.990,00 РСД"; // Default text
    if (printSelect && printSelect.value === "usluzna-stampa") {
        priceText = `Цена: ${formatPrice(USLUZNA_STAMPA_PRICE)} РСД`;
    } else if (printSelect && printSelect.value === "bez-broja") {
        priceText = `Цена: ${formatPrice(BASE_PRICE)} РСД`;
    }

    if (priceElement) {
        priceElement.textContent = priceText;
    }
}

function handleAddToCart() {
    const size = document.querySelector(".size-button.selected")?.textContent || null;
    const selectedPrint = document.getElementById("pa_odabir-stampe")?.value || "";
    const mainImageSrc = document.querySelector("#swiper-wrapper .swiper-slide img")?.src || "";
    if (!validateInputs(size, selectedPrint)) {
        return;
    }
    let playerName = "";
    let playerNumber = null;
    if (selectedPrint === "usluzna-stampa") {
        playerName = document.getElementById("playerName").value.trim();
        playerNumber = parseInt(document.getElementById("playerNumber").value, 10);
        if (!playerName.match(/[A-Za-zА-Яа-я\s]{2,12}/)) {
            displayWarning("nameWarning", "Молимо унесите исправно име/презиме (од 2 до 12 карактера).");
            return;
        }
        if (isNaN(playerNumber) || playerNumber < 1 || playerNumber > 99) {
            displayWarning("numberWarning", "Молимо унесите број између 1 и 99.");
            return;
        }
    }
    // Pronađi cenu u zavisnosti od opcije štampe
    let price = BASE_PRICE;
    if (selectedPrint === "usluzna-stampa") {
        price = USLUZNA_STAMPA_PRICE;
    }
    const productName = document.getElementById("productTitle").textContent;
    cart.push({ 
        name: productName, 
        size, 
        price, 
        print: selectedPrint,
        playerName: selectedPrint === "usluzna-stampa" ? playerName : null,
        playerNumber: selectedPrint === "usluzna-stampa" ? playerNumber : null,
        image: mainImageSrc
    });

    saveCart();
    displayNotification("Производ је успешно додат у корпу!");
    updateCartCount();
    resetProductForm();
}

function resetProductForm() {
    const sizeButtons = document.querySelectorAll(".size-button.selected");
    sizeButtons.forEach(button => button.classList.remove("selected"));
    const printSelect = document.getElementById("pa_odabir-stampe");
    if (printSelect) {
        printSelect.value = ""; // Vraća na prvu (default) opciju
    }
    const personalizationFields = document.getElementById("personalizationFields");
    if (personalizationFields) {
        personalizationFields.style.display = "none";
    }
    const playerNameInput = document.getElementById("playerName");
    if (playerNameInput) {
        playerNameInput.value = "";
    }
    const playerNumberInput = document.getElementById("playerNumber");
    if (playerNumberInput) {
        playerNumberInput.value = "";
    }
    updatePrice();
}


function validateInputs(size, selectedPrint) {
    const sizeWarning = document.getElementById("sizeWarning");
    const printWarning = document.getElementById("printWarning");

    if (!size) {
        sizeWarning.style.display = "block";
    } else {
        sizeWarning.style.display = "none";
    }

    if (!selectedPrint) {
        printWarning.style.display = "block";
    } else {
        printWarning.style.display = "none";
    }

    return size && selectedPrint;
}

function updateCartCount() {
    const cartCountElement = document.getElementById("cart-count");
    if (cartCountElement) {
        cartCountElement.textContent = `(${cart.length})`;
    }
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function formatPrice(price) {
    return price.toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parsePrice(priceString) {
    return parseFloat(priceString.replace(/\./g, "").replace(",", "."));
}

function formatTeamName(teamName) {
    if (teamName.toLowerCase() === "crvena_zvezda") {
        return "ЦРВЕНА ЗВЕЗДА";
    }
    return teamName.replace("_", " ").toUpperCase();
}

function getTypeLabel(type) {
    switch (type) {
        case "home":
            return "Домаћи";
        case "away":
            return "Гостујући";
        case "third":
            return "Трећи";
        default:
            return ""; // Vraća prazan string za nepoznat tip
    }
}
function checkoutHandler() {
    // Provera da li je korpa prazna
    if (cart.length === 0) {
displayNotification("Ваша корпа је празна. Молимо додајте производе у корпу пре поручивања.", "alert-warning", "notificationCart");
    return; // Zaustavi izvršavanje ako je korpa prazna
    }
    const contactFormSection = document.getElementById("contactFormSection");
    if (contactFormSection) {
        contactFormSection.style.display = "block";
        contactFormSection.scrollIntoView({ behavior: "smooth" });
    }
}

function displayNotification(message, type, elementId = "notification") {
    const notification = document.getElementById(elementId);
    if (notification) {
        // Postavite klasu za stil i dodajte poruku
        notification.className = `notification alert ${type} text-center`;
        notification.textContent = message;
        notification.style.display = "block";
        notification.style.opacity = "1";
        setTimeout(() => {
            notification.style.opacity = "0";
            setTimeout(() => {
                notification.style.display = "none";
            }, 500); 
        }, 3000);
    }
}



function updateCartDisplay() {
    const cartItemsContainer = document.getElementById("cartItems");
    if (!cartItemsContainer) {
        console.error("Kontejner za stavke korpe nije pronađen.");
        return;
    }
    cartItemsContainer.innerHTML = ""; // Očisti prethodne stavke
    let total = 0;
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p class='text-center'>Ваша корпа је празна.</p>";
        document.getElementById("totalPrice").textContent = "Укупно: 0 РСД";
        return;
    }

    cart.forEach((item, index) => {
        if (!item.price || isNaN(item.price)) {
            console.error(`Proizvod u korpi ima nevažeću cenu:`, item);
            item.price = BASE_PRICE;
        }
        total += item.price;
        const itemDiv = document.createElement("div");
        itemDiv.className = "col-12 mb-3";
    
        let stampanjeDetails = "";
        if (item.print === "usluzna-stampa") {
            stampanjeDetails = `
                <p>Ime/Prezime: ${item.playerName}</p>
                <p>Broj: ${item.playerNumber}</p>
            `;
        }

        itemDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center border p-3">
                <div class="d-flex align-items-center">
                    <img src="${item.image}" alt="${item.name}" style="width: 100px; height: auto; margin-right: 15px;">
                    <div>
                        <h5>${item.name}</h5>
                        <p>Veličina: ${item.size}</p>
                        <p>Štampa: ${item.print ? (item.print === "usluzna-stampa" ? "Uslužna štampa" : "Bez broja") : "Nema štampe"}</p>
                        ${stampanjeDetails}
                        <p>Cena: ${formatPrice(item.price)} RSD</p>
                    </div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">Ukloni</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemDiv);
    });

    const totalPriceElement = document.getElementById("totalPrice");
    if (totalPriceElement) {
        totalPriceElement.textContent = `Укупно: ${formatPrice(total)} РСД`;
    }
}


function removeFromCart(index) {
    cart.splice(index, 1); // Uklanja proizvod iz korpe na osnovu indeksa
    saveCart(); // Čuva ažuriranu korpu u localStorage
    updateCartDisplay(); // Ažurira prikaz korpe
    updateCartCount();
}

function submitOrder() {
    const fullName = document.getElementById("fullName").value.trim();
    const address = document.getElementById("address").value.trim();
    const city = document.getElementById("city").value.trim();
    const postalCode = document.getElementById("postalCode").value.trim();
    const phone = document.getElementById("phone").value.trim();
    if (fullName.length < 2) {
        displayNotification("Молимо унесите пуно име (минимум 2 карактера).", "alert-warning", "notificationCart");
        return;
    }
    if (address.length < 5) {
        displayNotification("Адреса мора имати најмање 5 карактера.", "alert-warning", "notificationCart");
        return;
    }
    if (city.length < 2) {
        displayNotification("Град мора имати најмање 2 карактера.", "alert-warning", "notificationCart");
        return;
    }
    if (!postalCode.match(/^\d{5}$/)) {
        displayNotification("Поштански број мора садржати тачно 5 цифара.", "alert-warning", "notificationCart");
        return;
    }
    if (!phone.match(/^\d{9,10}$/)) {
        displayNotification("Телефонски број мора садржати између 9 и 10 цифара.", "alert-warning", "notificationCart");
        return;
    }
    displayNotification("Хвала вам на поручивању! Ваша поруџбина је успешно примљена.", "alert-success", "notificationCart");

    localStorage.removeItem("cart");
    cart = [];
    updateCartDisplay();
    document.getElementById("contactFormSection").style.display = "none";
}
  
    let swiper = null;

function initializeSwiper() {
    if (swiper) {
        swiper.destroy(); // Uništite postojeći swiper pre inicijalizacije novog
    }
    const swiperContainer = document.querySelector(".mySwiper");
    if (swiperContainer) {
        swiper = new Swiper(swiperContainer, {
            loop: true,
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
        });
    }
}
